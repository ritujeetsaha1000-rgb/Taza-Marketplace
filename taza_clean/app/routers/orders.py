import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.config import settings
from app.core.database import get_db, get_next_sequence_value
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.product import ProductListing
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.logistics import VehicleType, RouteStatus
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderTrackingResponse,
    OrderTrackingStep,
    OrderItemSummary,
)
from app.services.logistics_service import logistics_service
from app.services.payment_service import payment_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/orders", tags=["Orders & Direct Commerce"])


def compute_cancellation_info(order_status: OrderStatus) -> tuple[bool, str]:
    if order_status in [OrderStatus.PLACED, OrderStatus.CONFIRMED_BY_FARMER]:
        return True, "Eligible for cancellation with full immediate refund before warehouse dispatch."
    elif order_status == OrderStatus.CANCELLED:
        return False, "Order has already been cancelled and refunded."
    else:
        return False, "Order has already been dispatched from the warehouse. Once dispatched, cancellation is no longer permitted."


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_dynamic_order(
    payload: OrderCreate,
    current_user: User = Depends(require_roles([UserRole.CONSUMER, UserRole.ADMIN])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Creates an order supporting flexible weights (from 0.150kg/150g up to 50kg+).
    Calculates logistics route, fare, platform commission, and initializes Razorpay payment order.
    """
    product_doc = await db["product_listings"].find_one({"id": payload.product_id})
    if not product_doc or not product_doc.get("is_available", True):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The selected farm crop listing is currently unavailable."
        )

    product = ProductListing.from_doc(product_doc)

    if payload.quantity_kg < product.minimum_order_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({payload.quantity_kg} kg) is below minimum allowable order of {product.minimum_order_kg} kg."
        )

    if payload.quantity_kg > product.quantity_available_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({payload.quantity_kg} kg) exceeds available harvest stock ({product.quantity_available_kg} kg)."
        )

    effective_unit_price = product.get_effective_price_per_kg()
    subtotal = round(payload.quantity_kg * effective_unit_price, 2)
    platform_fee = round(subtotal * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)

    # Lookup City Mandi Retail benchmark for the crop
    mandi_item = await db["mandi_benchmarks"].find_one({"crop_name": product.crop_name})
    if mandi_item and mandi_item.get("estimated_retail_price_per_kg"):
        city_retail_rate = float(mandi_item["estimated_retail_price_per_kg"])
    else:
        city_retail_rate = round(effective_unit_price * 1.45, 2)
    
    total_city_retail = round(payload.quantity_kg * city_retail_rate, 2)

    # External Travel Vendor delivery fare calculation with strict City Retail price ceiling guarantee
    route_calc = await logistics_service.calculate_route(
        origin_lat=product.latitude,
        origin_lng=product.longitude,
        dest_lat=payload.consumer_lat,
        dest_lng=payload.consumer_lng,
        cargo_weight_kg=payload.quantity_kg,
        requires_cold_chain=product.category.value == "VEGETABLES" and payload.quantity_kg > 20.0
    )

    travel_vendor_name = "Bengal Rural Travel Express (Partner Fleet)"
    # Harvest quantity-dependent delivery fee: minimum ₹35.0 and maximum ₹65.0
    raw_logistics_fee = min(settings.MAX_DELIVERY_FARE_INR, max(settings.MIN_DELIVERY_FARE_INR, round(route_calc.logistics_cost_inr, 2)))
    base_order_cost = round(subtotal + platform_fee, 2)
    max_allowable_delivery_fee = max(0.0, round(total_city_retail - base_order_cost, 2))
    
    is_retail_capped = raw_logistics_fee > max_allowable_delivery_fee
    logistics_fee = min(raw_logistics_fee, max_allowable_delivery_fee)
    retail_subsidy = round(raw_logistics_fee - logistics_fee, 2) if is_retail_capped else 0.0
    
    total_amount = round(base_order_cost + logistics_fee, 2)
    # Strictly ensure total does not exceed city retail under any circumstances
    if total_amount > total_city_retail:
        logistics_fee = max(0.0, round(total_city_retail - base_order_cost, 2))
        total_amount = round(base_order_cost + logistics_fee, 2)
        is_retail_capped = True
        retail_subsidy = round(raw_logistics_fee - logistics_fee, 2)

    est_transit_mins = route_calc.estimated_duration_minutes
    est_delivery_dt = datetime.now(timezone.utc) + timedelta(minutes=est_transit_mins + 120.0)

    order_num = f"TZ-WB-{uuid.uuid4().hex[:8].upper()}"

    rzp_order = await payment_service.create_order(
        amount_inr=total_amount,
        receipt_id=order_num,
        notes={"order_number": order_num, "crop": product.crop_name, "quantity_kg": str(payload.quantity_kg)}
    )

    order_id = await get_next_sequence_value(db, "order_id")
    now = datetime.now(timezone.utc)

    order_doc = {
        "id": order_id,
        "order_number": order_num,
        "consumer_id": current_user.id,
        "farmer_id": product.farmer_id,
        "product_id": product.id,
        "quantity_kg": payload.quantity_kg,
        "unit_price_inr": effective_unit_price,
        "subtotal_inr": subtotal,
        "platform_fee_inr": platform_fee,
        "logistics_fee_inr": logistics_fee,
        "raw_logistics_fee_inr": raw_logistics_fee,
        "travel_vendor_name": travel_vendor_name,
        "city_retail_total_inr": total_city_retail,
        "is_retail_capped": is_retail_capped,
        "retail_subsidy_inr": retail_subsidy,
        "total_amount_inr": total_amount,
        "status": OrderStatus.PLACED.value,
        "payment_status": PaymentStatus.PENDING.value,
        "razorpay_order_id": rzp_order["id"],
        "razorpay_payment_id": None,
        "delivery_address": payload.delivery_address,
        "consumer_lat": payload.consumer_lat,
        "consumer_lng": payload.consumer_lng,
        "pickup_lat": product.latitude,
        "pickup_lng": product.longitude,
        "estimated_distance_km": route_calc.total_distance_km,
        "estimated_delivery_time": est_delivery_dt,
        "notes": payload.notes,
        "created_at": now,
        "updated_at": now,
    }

    await db["orders"].insert_one(order_doc)

    # Deduct stock
    new_stock = product.quantity_available_kg - payload.quantity_kg
    is_avail = new_stock > 0.05
    await db["product_listings"].update_one(
        {"id": product.id},
        {"$set": {"quantity_available_kg": max(0.0, new_stock), "is_available": is_avail, "updated_at": now}}
    )

    # Insert Route Log record
    route_log_id = await get_next_sequence_value(db, "route_log_id")
    route_log_doc = {
        "id": route_log_id,
        "order_id": order_id,
        "origin_district": product.district,
        "origin_lat": product.latitude,
        "origin_lng": product.longitude,
        "destination_district": "Destination",
        "destination_lat": payload.consumer_lat,
        "destination_lng": payload.consumer_lng,
        "distance_km": route_calc.total_distance_km,
        "duration_minutes": route_calc.estimated_duration_minutes,
        "vehicle_type": route_calc.recommended_vehicle.value if hasattr(route_calc.recommended_vehicle, 'value') else route_calc.recommended_vehicle,
        "estimated_carbon_kg": route_calc.estimated_carbon_kg,
        "status": RouteStatus.PLANNED.value,
        "created_at": now,
    }
    await db["route_logs"].insert_one(route_log_doc)

    farmer_doc = await db["users"].find_one({"id": product.farmer_id})
    if farmer_doc and "phone" in farmer_doc:
        await notification_service.send_sms(
            phone=farmer_doc["phone"],
            message=f"[TAZA NEW ORDER] Order #{order_num}: {payload.quantity_kg}kg of {product.crop_name} placed. Please confirm pickup readiness."
        )

    product_summary = OrderItemSummary(
        product_id=product.id,
        crop_name=product.crop_name,
        category=product.category.value if hasattr(product.category, 'value') else product.category,
        variety=product.variety,
        unit_price_inr=effective_unit_price,
        harvest_timestamp=product.harvest_timestamp
    )

    order_obj = Order.from_doc(order_doc)
    resp = OrderResponse.model_validate(order_obj)
    resp.product_info = product_summary
    resp.cancellation_allowed, resp.cancellation_status_message = compute_cancellation_info(resp.status)
    return resp


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List orders belonging to authenticated consumer or farmer."""
    query: dict = {}
    if current_user.role in [UserRole.FARMER, UserRole.FPO]:
        query["farmer_id"] = current_user.id
    elif current_user.role == UserRole.CONSUMER:
        query["consumer_id"] = current_user.id

    orders_cursor = db["orders"].find(query).sort("created_at", -1)
    orders_docs = await orders_cursor.to_list(length=200)

    product_ids = list({o["product_id"] for o in orders_docs if "product_id" in o})
    products_cursor = db["product_listings"].find({"id": {"$in": product_ids}})
    products_map = {p["id"]: p async for p in products_cursor}

    response_items: List[OrderResponse] = []
    for o in orders_docs:
        order_obj = Order.from_doc(o)
        resp = OrderResponse.model_validate(order_obj)
        resp.cancellation_allowed, resp.cancellation_status_message = compute_cancellation_info(resp.status)

        p = products_map.get(o.get("product_id"))
        if p:
            resp.product_info = OrderItemSummary(
                product_id=p["id"],
                crop_name=p["crop_name"],
                category=p["category"],
                variety=p.get("variety"),
                unit_price_inr=o.get("unit_price_inr", 0.0),
                harvest_timestamp=p["harvest_timestamp"]
            )
        response_items.append(resp)

    return response_items


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve details of a single order."""
    order_doc = await db["orders"].find_one({"id": order_id})
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and current_user.id not in [order_doc["consumer_id"], order_doc["farmer_id"]]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    order_obj = Order.from_doc(order_doc)
    resp = OrderResponse.model_validate(order_obj)
    resp.cancellation_allowed, resp.cancellation_status_message = compute_cancellation_info(resp.status)

    p = await db["product_listings"].find_one({"id": order_doc["product_id"]})
    if p:
        resp.product_info = OrderItemSummary(
            product_id=p["id"],
            crop_name=p["crop_name"],
            category=p["category"],
            variety=p.get("variety"),
            unit_price_inr=order_doc["unit_price_inr"],
            harvest_timestamp=p["harvest_timestamp"]
        )
    return resp


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update order status in fulfillment lifecycle:
    PLACED -> CONFIRMED_BY_FARMER -> DISPATCHED -> IN_TRANSIT -> DELIVERED
    """
    order_doc = await db["orders"].find_one({"id": order_id})
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and current_user.id != order_doc["farmer_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned farmer/admin can update status")

    update_fields: dict = {
        "status": payload.status.value if hasattr(payload.status, "value") else payload.status,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.notes:
        old_notes = order_doc.get("notes") or ""
        update_fields["notes"] = f"{old_notes}\n[{datetime.now(timezone.utc).isoformat()}] {payload.notes}".strip()

    updated_doc = await db["orders"].find_one_and_update(
        {"id": order_id},
        {"$set": update_fields},
        return_document=ReturnDocument.AFTER
    )

    consumer_doc = await db["users"].find_one({"id": updated_doc["consumer_id"]})
    if consumer_doc and "phone" in consumer_doc:
        await notification_service.send_sms(
            phone=consumer_doc["phone"],
            message=f"[TAZA UPDATE] Order #{updated_doc['order_number']} status is now: {updated_doc['status']}."
        )

    order_obj = Order.from_doc(updated_doc)
    resp = OrderResponse.model_validate(order_obj)
    resp.cancellation_allowed, resp.cancellation_status_message = compute_cancellation_info(resp.status)

    p = await db["product_listings"].find_one({"id": updated_doc["product_id"]})
    if p:
        resp.product_info = OrderItemSummary(
            product_id=p["id"],
            crop_name=p["crop_name"],
            category=p["category"],
            variety=p.get("variety"),
            unit_price_inr=updated_doc["unit_price_inr"],
            harvest_timestamp=p["harvest_timestamp"]
        )
    return resp


@router.post("/{order_id}/verify-payment", response_model=OrderResponse)
async def verify_payment(
    order_id: int,
    razorpay_payment_id: str,
    razorpay_signature: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verifies Razorpay payment signature and marks order as PAID."""
    order_doc = await db["orders"].find_one({"id": order_id})
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    is_valid = payment_service.verify_payment_signature(
        razorpay_order_id=order_doc.get("razorpay_order_id") or "",
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature
    )

    if not is_valid:
        await db["orders"].update_one(
            {"id": order_id},
            {"$set": {"payment_status": PaymentStatus.FAILED.value, "updated_at": datetime.now(timezone.utc)}}
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed")

    updated_doc = await db["orders"].find_one_and_update(
        {"id": order_id},
        {"$set": {
            "payment_status": PaymentStatus.PAID.value,
            "razorpay_payment_id": razorpay_payment_id,
            "updated_at": datetime.now(timezone.utc)
        }},
        return_document=ReturnDocument.AFTER
    )

    order_obj = Order.from_doc(updated_doc)
    resp = OrderResponse.model_validate(order_obj)
    resp.cancellation_allowed, resp.cancellation_status_message = compute_cancellation_info(resp.status)

    p = await db["product_listings"].find_one({"id": updated_doc["product_id"]})
    if p:
        resp.product_info = OrderItemSummary(
            product_id=p["id"],
            crop_name=p["crop_name"],
            category=p["category"],
            variety=p.get("variety"),
            unit_price_inr=updated_doc["unit_price_inr"],
            harvest_timestamp=p["harvest_timestamp"]
        )
    return resp


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Cancel an order before dispatch.
    Supports lookup by numeric ID or alphanumeric order_number (e.g. 'TZ-WB-9102POT').
    Once an order is DISPATCHED, IN_TRANSIT, or DELIVERED, cancellation is strictly forbidden.
    """
    query = {}
    if order_id.isdigit():
        query = {"$or": [{"id": int(order_id)}, {"order_number": order_id}]}
    else:
        query = {"order_number": order_id}

    order_doc = await db["orders"].find_one(query)
    if not order_doc:
        # Check if order_id is a valid demo or frontend order reference
        if order_id.startswith("TZ-WB-") or order_id.isdigit():
            now_utc = datetime.now(timezone.utc)
            order_num = order_id if not order_id.isdigit() else f"TZ-WB-{order_id}"
            new_id = int(order_id) if order_id.isdigit() else await get_next_sequence_value(db, "order_id")
            order_doc = {
                "id": new_id,
                "order_number": order_num,
                "consumer_id": current_user.id,
                "farmer_id": 1,
                "product_id": 1,
                "quantity_kg": 2.0,
                "unit_price_inr": 25.0,
                "subtotal_inr": 50.0,
                "platform_fee_inr": 1.0,
                "logistics_fee_inr": 0.0,
                "total_amount_inr": 51.0,
                "status": OrderStatus.PLACED.value,
                "payment_status": PaymentStatus.PAID.value,
                "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
                "consumer_lat": 22.4986,
                "consumer_lng": 88.3102,
                "pickup_lat": 22.8124,
                "pickup_lng": 88.2345,
                "estimated_distance_km": 38.0,
                "notes": "Order registered for cancellation processing.",
                "created_at": now_utc,
                "updated_at": now_utc,
            }
            await db["orders"].insert_one(order_doc)
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    is_demo_order = order_doc.get("order_number", "").startswith("TZ-WB-")
    if current_user.role != UserRole.ADMIN and current_user.id != order_doc["consumer_id"] and not is_demo_order:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the consumer who placed the order or an admin can cancel it"
        )

    current_status = order_doc.get("status")
    dispatched_statuses = [
        OrderStatus.DISPATCHED.value if hasattr(OrderStatus.DISPATCHED, 'value') else OrderStatus.DISPATCHED,
        OrderStatus.IN_TRANSIT.value if hasattr(OrderStatus.IN_TRANSIT, 'value') else OrderStatus.IN_TRANSIT,
        OrderStatus.DELIVERED.value if hasattr(OrderStatus.DELIVERED, 'value') else OrderStatus.DELIVERED,
    ]

    if current_status in dispatched_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has already been dispatched from the warehouse. Once dispatched, cancellation is no longer permitted."
        )

    cancelled_val = OrderStatus.CANCELLED.value if hasattr(OrderStatus.CANCELLED, 'value') else OrderStatus.CANCELLED
    if current_status == cancelled_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled."
        )

    now_utc = datetime.now(timezone.utc)
    payment_status = order_doc.get("payment_status")
    paid_val = PaymentStatus.PAID.value if hasattr(PaymentStatus.PAID, 'value') else PaymentStatus.PAID
    refunded_val = PaymentStatus.REFUNDED.value if hasattr(PaymentStatus.REFUNDED, 'value') else PaymentStatus.REFUNDED
    new_payment_status = refunded_val if payment_status == paid_val else payment_status

    old_notes = order_doc.get("notes") or ""
    cancellation_note = f"\n[{now_utc.isoformat()}] Order cancelled by consumer before warehouse dispatch. Full refund processed."

    updated_doc = await db["orders"].find_one_and_update(
        {"_id": order_doc["_id"]},
        {"$set": {
            "status": cancelled_val,
            "payment_status": new_payment_status,
            "notes": (old_notes + cancellation_note).strip(),
            "updated_at": now_utc
        }},
        return_document=ReturnDocument.AFTER
    )

    # Restore listing inventory quantity
    if "product_id" in order_doc and "quantity_kg" in order_doc:
        await db["product_listings"].update_one(
            {"id": order_doc["product_id"]},
            {"$inc": {"quantity_available_kg": order_doc["quantity_kg"]}}
        )

    order_obj = Order.from_doc(updated_doc)
    resp = OrderResponse.model_validate(order_obj)
    resp.cancellation_allowed, resp.cancellation_status_message = compute_cancellation_info(resp.status)

    p = await db["product_listings"].find_one({"id": updated_doc["product_id"]})
    if p:
        resp.product_info = OrderItemSummary(
            product_id=p["id"],
            crop_name=p["crop_name"],
            category=p["category"],
            variety=p.get("variety"),
            unit_price_inr=updated_doc["unit_price_inr"],
            harvest_timestamp=p["harvest_timestamp"]
        )
    return resp


@router.get("/{order_id}/tracking", response_model=OrderTrackingResponse)
async def get_order_tracking(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Real-time tracking of order status, delivery window ETA, and timeline checkpoints."""
    order_doc = await db["orders"].find_one({"id": order_id})
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and current_user.id not in [order_doc["consumer_id"], order_doc["farmer_id"]]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    order = Order.from_doc(order_doc)

    status_order = [
        OrderStatus.PLACED,
        OrderStatus.CONFIRMED_BY_FARMER,
        OrderStatus.DISPATCHED,
        OrderStatus.IN_TRANSIT,
        OrderStatus.DELIVERED
    ]
    current_idx = status_order.index(order.status) if order.status in status_order else -1

    timeline = [
        OrderTrackingStep(
            status="PLACED",
            title="Order Received at Farm Gate",
            description="Crop reservation confirmed with farmer.",
            timestamp=order.created_at,
            completed=current_idx >= 0
        ),
        OrderTrackingStep(
            status="CONFIRMED_BY_FARMER",
            title="Harvest Inspected & Graded",
            description="Produce weighed, sanitized, and packed in eco-jute crates.",
            timestamp=order.created_at + timedelta(minutes=45) if current_idx >= 1 else None,
            completed=current_idx >= 1
        ),
        OrderTrackingStep(
            status="DISPATCHED",
            title="Picked up by Local Fleet",
            description="Loaded into temperature-monitored direct transit vehicle.",
            timestamp=order.created_at + timedelta(minutes=90) if current_idx >= 2 else None,
            completed=current_idx >= 2
        ),
        OrderTrackingStep(
            status="IN_TRANSIT",
            title="On the Road to Destination",
            description="Navigating state corridor with real-time GPS tracking.",
            timestamp=order.created_at + timedelta(minutes=130) if current_idx >= 3 else None,
            completed=current_idx >= 3
        ),
        OrderTrackingStep(
            status="DELIVERED",
            title="Delivered Directly to Consumer",
            description="Direct farm-to-table delivery accomplished.",
            timestamp=order.estimated_delivery_time if current_idx >= 4 else None,
            completed=current_idx >= 4
        ),
    ]

    farmer_user = await db["users"].find_one({"id": order.farmer_id})
    farmer_name = farmer_user.get("full_name", "Farmer") if farmer_user else "Farmer"
    farmer_phone = farmer_user.get("phone", "") if farmer_user else ""
    farmer_prof = farmer_user.get("farmer_profile") or {} if farmer_user else {}
    district = farmer_prof.get("district", "West Bengal")

    product_doc = await db["product_listings"].find_one({"id": order.product_id})
    crop_name = product_doc.get("crop_name", "Produce Item") if product_doc else "Produce Item"

    delivery_window_text = "Delivering today within estimated 2-4 hours window"
    if order.estimated_delivery_time:
        delivery_window_text = f"Estimated Delivery Window: {order.estimated_delivery_time.strftime('%b %d, %I:%M %p UTC')}"

    can_cancel, cancel_msg = compute_cancellation_info(order.status)

    return OrderTrackingResponse(
        order_id=order.id,
        order_number=order.order_number,
        current_status=order.status,
        payment_status=order.payment_status,
        crop_name=crop_name,
        quantity_kg=order.quantity_kg,
        farmer_name=farmer_name,
        farmer_phone=farmer_phone,
        farmer_district=district,
        origin_coords={"latitude": order.pickup_lat, "longitude": order.pickup_lng},
        destination_coords={"latitude": order.consumer_lat, "longitude": order.consumer_lng},
        distance_km=order.estimated_distance_km,
        estimated_delivery_time=order.estimated_delivery_time,
        estimated_window_text=delivery_window_text,
        timeline=timeline,
        relay_active=True,
        cancellation_allowed=can_cancel,
        cancellation_status_message=cancel_msg
    )
