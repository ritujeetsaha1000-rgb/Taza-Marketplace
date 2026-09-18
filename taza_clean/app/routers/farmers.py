from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.database import get_db, get_next_sequence_value
from app.core.deps import require_roles, get_current_user
from app.models.user import User, UserRole
from app.models.product import ProductListing
from app.models.order import OrderStatus
from app.schemas.farmer import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    FarmerDashboardResponse,
    FarmerOrderSummaryItem,
    DirectContactRelayResponse,
    FarmerPricingScenarioRequest,
    FarmerPricingScenarioResponse,
)
from app.services.pricing_freshness_service import pricing_freshness_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/farmers", tags=["Farmers & FPOs"])


@router.post("/listings", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_crop_listing(
    payload: ProductCreate,
    current_user: User = Depends(require_roles([UserRole.FARMER, UserRole.FPO])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Farmers / FPOs publish crop listings.
    Requires mandatory harvest timestamp, available quantity in kg, base price, and farm coordinates.
    """
    harvest_dt = payload.harvest_timestamp
    if harvest_dt.tzinfo is None:
        harvest_dt = harvest_dt.replace(tzinfo=timezone.utc)

    lat = payload.latitude
    lng = payload.longitude
    district = payload.district
    if current_user.farmer_profile:
        lat = lat or current_user.farmer_profile.latitude
        lng = lng or current_user.farmer_profile.longitude
        district = district or current_user.farmer_profile.district

    listing_id = await get_next_sequence_value(db, "product_id")
    now = datetime.now(timezone.utc)

    listing_doc = {
        "id": listing_id,
        "farmer_id": current_user.id,
        "crop_name": payload.crop_name,
        "variety": payload.variety,
        "category": payload.category.value if hasattr(payload.category, 'value') else payload.category,
        "grade": payload.grade.value if hasattr(payload.grade, 'value') else payload.grade,
        "quantity_available_kg": payload.quantity_available_kg,
        "minimum_order_kg": payload.minimum_order_kg,
        "expected_base_price_per_kg": payload.expected_base_price_per_kg,
        "harvest_timestamp": harvest_dt,
        "shelf_life_hours": payload.shelf_life_hours,
        "freshness_decay_lambda": payload.freshness_decay_lambda,
        "district": district,
        "latitude": lat,
        "longitude": lng,
        "description": payload.description,
        "is_organic": payload.is_organic,
        "is_available": True,
        "image_url": payload.image_url,
        "has_insurance": payload.has_insurance,
        "insurance_policy_number": payload.insurance_policy_number or f"TZ-POL-WH-{listing_id}",
        "pricing_strategy": payload.pricing_strategy or "DYNAMIC_MANDI_PEG",
        "target_farmer_price_per_kg": payload.target_farmer_price_per_kg or payload.expected_base_price_per_kg,
        "min_price_floor_per_kg": payload.min_price_floor_per_kg,
        "created_at": now,
        "updated_at": now,
    }

    await db["product_listings"].insert_one(listing_doc)

    hours, score, _ = pricing_freshness_service.calculate_freshness(
        harvest_dt, payload.shelf_life_hours, payload.freshness_decay_lambda
    )

    listing_obj = ProductListing.from_doc(listing_doc)
    eff_price, change_pct, trend = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=listing_obj.expected_base_price_per_kg,
        crop_name=listing_obj.crop_name,
        pricing_strategy=listing_obj.pricing_strategy,
        min_price_floor=listing_obj.min_price_floor_per_kg,
        category=listing_obj.category.value if hasattr(listing_obj.category, "value") else str(listing_obj.category)
    )
    resp = ProductResponse.model_validate(listing_obj)
    resp.current_freshness_score = score
    resp.hours_since_harvest = hours
    resp.today_dynamic_price_per_kg = eff_price
    resp.daily_price_change_percent = change_pct
    resp.daily_trend = trend
    return resp


@router.get("/listings", response_model=List[ProductResponse])
async def get_my_listings(
    include_inactive: bool = False,
    current_user: User = Depends(require_roles([UserRole.FARMER, UserRole.FPO])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Returns all listings for current farmer with dynamically evaluated freshness scores and daily stock prices."""
    query = {"farmer_id": current_user.id}
    if not include_inactive:
        query["is_available"] = True

    cursor = db["product_listings"].find(query).sort("created_at", -1)
    response_items: List[ProductResponse] = []

    async for doc in cursor:
        listing = ProductListing.from_doc(doc)
        hours, score, _ = pricing_freshness_service.calculate_freshness(
            listing.harvest_timestamp, listing.shelf_life_hours, listing.freshness_decay_lambda
        )
        eff_price, change_pct, trend = pricing_freshness_service.calculate_daily_dynamic_price(
            base_price=listing.expected_base_price_per_kg,
            crop_name=listing.crop_name,
            pricing_strategy=listing.pricing_strategy,
            min_price_floor=listing.min_price_floor_per_kg,
            category=listing.category.value if hasattr(listing.category, "value") else str(listing.category)
        )
        item = ProductResponse.model_validate(listing)
        item.current_freshness_score = score
        item.hours_since_harvest = hours
        item.today_dynamic_price_per_kg = eff_price
        item.daily_price_change_percent = change_pct
        item.daily_trend = trend
        response_items.append(item)

    return response_items


@router.put("/listings/{listing_id}", response_model=ProductResponse)
async def update_crop_listing(
    listing_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(require_roles([UserRole.FARMER, UserRole.FPO])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update listing quantity, price, or availability status."""
    update_data = payload.model_dump(exclude_unset=True)
    if "category" in update_data and hasattr(update_data["category"], "value"):
        update_data["category"] = update_data["category"].value
    if "grade" in update_data and hasattr(update_data["grade"], "value"):
        update_data["grade"] = update_data["grade"].value
    update_data["updated_at"] = datetime.now(timezone.utc)

    updated_doc = await db["product_listings"].find_one_and_update(
        {"id": listing_id, "farmer_id": current_user.id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if not updated_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    listing = ProductListing.from_doc(updated_doc)
    hours, score, _ = pricing_freshness_service.calculate_freshness(
        listing.harvest_timestamp, listing.shelf_life_hours, listing.freshness_decay_lambda
    )
    eff_price, change_pct, trend = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=listing.expected_base_price_per_kg,
        crop_name=listing.crop_name,
        pricing_strategy=listing.pricing_strategy,
        min_price_floor=listing.min_price_floor_per_kg,
        category=listing.category.value if hasattr(listing.category, "value") else str(listing.category)
    )
    resp = ProductResponse.model_validate(listing)
    resp.current_freshness_score = score
    resp.hours_since_harvest = hours
    resp.today_dynamic_price_per_kg = eff_price
    resp.daily_price_change_percent = change_pct
    resp.daily_trend = trend
    return resp


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_crop_listing(
    listing_id: int,
    current_user: User = Depends(require_roles([UserRole.FARMER, UserRole.FPO])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Marks a listing as unavailable."""
    res = await db["product_listings"].update_one(
        {"id": listing_id, "farmer_id": current_user.id},
        {"$set": {"is_available": False, "updated_at": datetime.now(timezone.utc)}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return None


@router.get("/dashboard", response_model=FarmerDashboardResponse)
async def get_farmer_dashboard(
    current_user: User = Depends(require_roles([UserRole.FARMER, UserRole.FPO])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Comprehensive dashboard for outgoing orders, revenue, and active listings."""
    total_l = await db["product_listings"].count_documents({"farmer_id": current_user.id})
    active_l = await db["product_listings"].count_documents({"farmer_id": current_user.id, "is_available": True})

    orders_cursor = db["orders"].find({"farmer_id": current_user.id}).sort("created_at", -1)
    orders = await orders_cursor.to_list(length=100)

    # Pre-fetch user and product lookups for order summary
    consumer_ids = list({o["consumer_id"] for o in orders if "consumer_id" in o})
    product_ids = list({o["product_id"] for o in orders if "product_id" in o})

    consumers_cursor = db["users"].find({"id": {"$in": consumer_ids}})
    consumers_map = {c["id"]: c async for c in consumers_cursor}

    products_cursor = db["product_listings"].find({"id": {"$in": product_ids}})
    products_map = {p["id"]: p async for p in products_cursor}

    total_sales_kg = 0.0
    total_revenue_inr = 0.0
    pending_count = 0
    dispatched_count = 0
    recent_items: List[FarmerOrderSummaryItem] = []

    for o in orders:
        status_val = o.get("status", "PLACED")
        if status_val in ["CONFIRMED_BY_FARMER", "DISPATCHED", "IN_TRANSIT", "DELIVERED"]:
            total_sales_kg += o.get("quantity_kg", 0.0)
            total_revenue_inr += o.get("subtotal_inr", 0.0)

        if status_val == "PLACED":
            pending_count += 1
        elif status_val in ["CONFIRMED_BY_FARMER", "DISPATCHED", "IN_TRANSIT"]:
            dispatched_count += 1

        c_info = consumers_map.get(o.get("consumer_id"))
        p_info = products_map.get(o.get("product_id"))

        recent_items.append(
            FarmerOrderSummaryItem(
                order_id=o["id"],
                order_number=o.get("order_number", ""),
                crop_name=p_info.get("crop_name", "Crop Item") if p_info else "Crop Item",
                quantity_kg=o.get("quantity_kg", 0.0),
                total_amount_inr=o.get("total_amount_inr", 0.0),
                consumer_name=c_info.get("full_name", "Customer") if c_info else "Customer",
                consumer_phone=c_info.get("phone", "") if c_info else "",
                consumer_address=o.get("delivery_address", ""),
                status=status_val,
                payment_status=o.get("payment_status", "PENDING"),
                created_at=o.get("created_at", datetime.now(timezone.utc))
            )
        )

    fp = current_user.farmer_profile
    return FarmerDashboardResponse(
        total_listings=total_l,
        active_listings=active_l,
        total_sales_kg=round(total_sales_kg, 2),
        total_revenue_inr=round(total_revenue_inr, 2),
        pending_orders_count=pending_count,
        dispatched_orders_count=dispatched_count,
        recent_outgoing_orders=recent_items[:15],
        district=fp.district if fp else "West Bengal",
        fpo_affiliation=fp.fpo_affiliation if fp else None
    )


@router.post("/relay-contact/{order_id}", response_model=DirectContactRelayResponse)
async def direct_contact_relay(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Direct contact relay between farmer and consumer/logistics agent.
    Generates secure masked relay and sends confirmation SMS.
    """
    order = await db["orders"].find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.id not in [order["farmer_id"], order["consumer_id"]] and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to access this order relay")

    farmer = await db["users"].find_one({"id": order["farmer_id"]})
    consumer = await db["users"].find_one({"id": order["consumer_id"]})

    if not farmer or not consumer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer or consumer not found")

    relay_token = await notification_service.create_farmer_consumer_relay_token(
        farmer_id=farmer["id"],
        farmer_phone=farmer["phone"],
        consumer_phone=consumer["phone"],
        order_number=order["order_number"]
    )

    await notification_service.send_sms(
        phone=farmer["phone"],
        message=f"[TAZA RELAY] Order #{order['order_number']}: Buyer {consumer['full_name']} is coordinating dispatch. Ref Token: {relay_token}"
    )

    farmer_prof = farmer.get("farmer_profile") or {}
    district_name = farmer_prof.get("district", "West Bengal")

    return DirectContactRelayResponse(
        farmer_id=farmer["id"],
        farmer_name=farmer["full_name"],
        farmer_phone=farmer["phone"],
        farm_district=district_name,
        relay_sms_sent=True,
        relay_token=relay_token,
        instructions="Use the relay token when communicating with the logistics driver or platform pickup hub."
    )


@router.post("/pricing-scenario", response_model=FarmerPricingScenarioResponse)
async def simulate_farmer_pricing_scenario(payload: FarmerPricingScenarioRequest):
    """
    Simulates farmer pricing scenarios:
    - FIXED_PRICE: Farmer rate stays locked at base price regardless of market spikes.
    - DYNAMIC_MANDI_PEG: Farmer tracks daily Mandi rhythm and enjoys a 20% profit share
      bonus of the wholesale market surge when prices spike in the Mandis!
    """
    res = pricing_freshness_service.calculate_market_high_profit_share(
        base_price=payload.base_price_per_kg,
        pricing_strategy=payload.pricing_strategy,
        mandi_market_price=payload.mandi_market_price,
        market_surge_inr=payload.market_surge_inr,
        harvest_quantity_kg=payload.harvest_quantity_kg,
        profit_share_percent=payload.profit_share_percent,
        min_price_floor=payload.min_price_floor_per_kg
    )
    return FarmerPricingScenarioResponse(**res)


@router.get("/pricing-scenario", response_model=FarmerPricingScenarioResponse)
async def get_farmer_pricing_scenario(
    base_price_per_kg: float = 25.0,
    pricing_strategy: str = "DYNAMIC_MANDI_PEG",
    market_surge_inr: float = 10.0,
    harvest_quantity_kg: float = 500.0,
    profit_share_percent: float = 20.0
):
    """GET query version for quick client/browser scenario verification."""
    res = pricing_freshness_service.calculate_market_high_profit_share(
        base_price=base_price_per_kg,
        pricing_strategy=pricing_strategy,
        market_surge_inr=market_surge_inr,
        harvest_quantity_kg=harvest_quantity_kg,
        profit_share_percent=profit_share_percent
    )
    return FarmerPricingScenarioResponse(**res)

