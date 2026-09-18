import re
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.models.product import ProductListing, CropCategory
from app.schemas.consumer import (
    CatalogProductItem,
    CatalogResponse,
    MandiComparisonData,
)
from app.services.pricing_freshness_service import pricing_freshness_service
from app.services.logistics_service import logistics_service

router = APIRouter(prefix="/consumers", tags=["Consumers & Bulk Buyers"])


@router.get("/catalog", response_model=CatalogResponse)
async def get_consumer_catalog(
    district: Optional[str] = Query(None, description="Filter by production district (e.g. Hooghly, Nadia)"),
    category: Optional[CropCategory] = Query(None, description="Crop category"),
    search: Optional[str] = Query(None, description="Search crop name or variety"),
    consumer_lat: Optional[float] = Query(None, description="Consumer latitude for proximity calculation"),
    consumer_lng: Optional[float] = Query(None, description="Consumer longitude for proximity calculation"),
    max_distance_km: Optional[float] = Query(None, description="Filter max distance from consumer in km"),
    min_freshness_score: Optional[float] = Query(None, description="Filter minimum freshness score (0-100)"),
    is_organic: Optional[bool] = Query(None, description="Filter organic only"),
    sort_by: str = Query("freshness", description="Sorting: 'freshness', 'distance', 'price_asc', 'price_desc'"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Consumer Catalog with:
    - Real-time Freshness Scoring (exponential decay since harvest timestamp)
    - Proximity-based distance calculations
    - Mandi APMC benchmark price comparisons and direct savings
    """
    query: dict = {"is_available": True}

    if district:
        query["district"] = {"$regex": re.escape(district.strip()), "$options": "i"}
    if category:
        query["category"] = category.value if hasattr(category, "value") else category
    if is_organic is not None:
        query["is_organic"] = is_organic
    if search:
        s_regex = {"$regex": re.escape(search.strip()), "$options": "i"}
        query["$or"] = [{"crop_name": s_regex}, {"variety": s_regex}]

    listings_cursor = db["product_listings"].find(query)
    listings_docs = await listings_cursor.to_list(length=500)

    # Pre-fetch mandi benchmarks and farmers
    mandi_cursor = db["mandi_benchmarks"].find({})
    mandi_benchmarks = await mandi_cursor.to_list(length=500)
    mandi_map = {
        (mb.get("district_name", "").lower(), mb.get("crop_name", "").lower()): mb
        for mb in mandi_benchmarks
    }

    farmer_ids = list({d["farmer_id"] for d in listings_docs if "farmer_id" in d})
    farmers_cursor = db["users"].find({"id": {"$in": farmer_ids}})
    farmers_map = {f["id"]: f async for f in farmers_cursor}

    catalog_items: List[CatalogProductItem] = []

    for doc in listings_docs:
        l = ProductListing.from_doc(doc)

        dist_km: Optional[float] = None
        if consumer_lat is not None and consumer_lng is not None:
            dist_km = round(
                logistics_service.haversine_distance_km(
                    consumer_lat, consumer_lng, l.latitude, l.longitude
                ) * logistics_service.ROAD_TORTUOSITY_FACTOR,
                1
            )

        # Expected delivery time for the consumer to avoid harvest spoilage during transit
        # Average Bengal rural/suburban corridor speed ~35 km/h + 30 min dispatch buffer
        expected_delivery_hours = round(max(0.5, (dist_km / 35.0) + 0.5), 1) if dist_km is not None else 2.0

        # t = time of harvest (hours since harvest) + expected delivery time for consumer
        hours, freshness_score, freshness_label = pricing_freshness_service.calculate_freshness(
            harvest_timestamp=l.harvest_timestamp,
            shelf_life_hours=l.shelf_life_hours,
            decay_lambda=l.freshness_decay_lambda,
            expected_delivery_hours=expected_delivery_hours
        )

        if min_freshness_score is not None and freshness_score < min_freshness_score:
            continue
        if max_distance_km is not None and dist_km is not None and dist_km > max_distance_km:
            continue

        lookup_key = (l.district.lower(), l.crop_name.lower())
        mandi_item = mandi_map.get(lookup_key)
        if not mandi_item:
            # Try matching by crop name directly
            for (d, c), mb in mandi_map.items():
                if c == l.crop_name.lower():
                    mandi_item = mb
                    break
        if not mandi_item:
            # Try fuzzy/substring and alias matching
            crop_lower = l.crop_name.lower().replace("/", " ").replace("(", " ").replace(")", " ")
            crop_tokens = {w for w in crop_lower.split() if len(w) > 2 and w not in ["pack", "fresh", "grade", "desi"]}
            for (d, c), mb in mandi_map.items():
                c_clean = c.replace("/", " ").replace("(", " ").replace(")", " ")
                c_tokens = {w for w in c_clean.split() if len(w) > 2 and w not in ["pack", "fresh", "grade", "desi"]}
                # If tokens overlap significantly or key words match
                if crop_tokens.intersection(c_tokens):
                    mandi_item = mb
                    break
                if ("eggplant" in crop_tokens and ("brinjal" in c_tokens or "begun" in c_tokens)) or \
                   ("mousambi" in crop_tokens and "mousambi" in c_clean) or \
                   ("banana" in crop_tokens and ("kola" in c_clean or "banana" in c_clean)) or \
                   ("pomegranate" in crop_tokens and ("bedana" in c_clean or "pomegranate" in c_clean)):
                    mandi_item = mb
                    break

        # Daily dynamic pricing calculation
        pricing_strat = getattr(l, "pricing_strategy", "DYNAMIC_MANDI_PEG") or "DYNAMIC_MANDI_PEG"
        min_floor = getattr(l, "min_price_floor_per_kg", None)
        cat_val = l.category.value if hasattr(l.category, "value") else str(l.category)
        
        eff_price, change_pct, trend = pricing_freshness_service.calculate_daily_dynamic_price(
            base_price=l.expected_base_price_per_kg,
            crop_name=l.crop_name,
            pricing_strategy=pricing_strat,
            min_price_floor=min_floor,
            category=cat_val
        )

        mandi_comp: Optional[MandiComparisonData] = None
        if mandi_item:
            mandi_comp = pricing_freshness_service.compare_with_mandi(
                platform_price_per_kg=eff_price,
                mandi_modal_price_per_kg=mandi_item.get("modal_price_per_kg", 0.0),
                mandi_name=mandi_item.get("mandi_name", "")
            )

        farmer_user = farmers_map.get(l.farmer_id)
        farmer_rating = 4.8
        fpo_name = None
        farmer_name = "Registered Farmer"
        if farmer_user:
            farmer_name = farmer_user.get("full_name", "Registered Farmer")
            fp = farmer_user.get("farmer_profile") or {}
            farmer_rating = fp.get("rating", 4.8)
            fpo_name = fp.get("fpo_affiliation")

        catalog_items.append(
            CatalogProductItem(
                id=l.id,
                farmer_id=l.farmer_id,
                farmer_name=farmer_name,
                farmer_rating=farmer_rating,
                fpo_affiliation=fpo_name,
                crop_name=l.crop_name,
                variety=l.variety,
                category=l.category,
                grade=l.grade,
                quantity_available_kg=l.quantity_available_kg,
                minimum_order_kg=l.minimum_order_kg,
                base_price_per_kg=eff_price,
                pricing_strategy=pricing_strat,
                min_price_floor_per_kg=min_floor,
                target_farmer_price_per_kg=getattr(l, "target_farmer_price_per_kg", l.expected_base_price_per_kg),
                daily_price_change_percent=change_pct,
                daily_trend=trend,
                is_market_pegged=pricing_strat == "DYNAMIC_MANDI_PEG",
                harvest_timestamp=l.harvest_timestamp,
                hours_since_harvest=hours,
                expected_delivery_hours=expected_delivery_hours,
                transit_adjusted_hours=round(hours + expected_delivery_hours, 1),
                freshness_score=freshness_score,
                freshness_label=freshness_label,
                district=l.district,
                latitude=l.latitude,
                longitude=l.longitude,
                distance_km=dist_km,
                mandi_benchmark=mandi_comp,
                is_organic=l.is_organic,
                image_url=l.image_url
            )
        )

    if sort_by == "freshness":
        catalog_items.sort(key=lambda x: x.freshness_score, reverse=True)
    elif sort_by == "distance" and consumer_lat is not None:
        catalog_items.sort(key=lambda x: x.distance_km if x.distance_km is not None else 99999)
    elif sort_by == "price_asc":
        catalog_items.sort(key=lambda x: x.base_price_per_kg)
    elif sort_by == "price_desc":
        catalog_items.sort(key=lambda x: x.base_price_per_kg, reverse=True)

    total_count = len(catalog_items)
    paginated_items = catalog_items[offset : offset + limit]

    return CatalogResponse(
        total_items=total_count,
        returned_items=len(paginated_items),
        filter_applied={
            "district": district,
            "category": category.value if category else None,
            "max_distance_km": max_distance_km,
            "min_freshness_score": min_freshness_score,
            "sort_by": sort_by,
        },
        items=paginated_items
    )


@router.get("/listings/{listing_id}", response_model=CatalogProductItem)
async def get_listing_detail(
    listing_id: int,
    consumer_lat: Optional[float] = Query(None),
    consumer_lng: Optional[float] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Detailed view for a single farm product listing with Mandi benchmark comparison."""
    doc = await db["product_listings"].find_one({"id": listing_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    listing = ProductListing.from_doc(doc)

    dist_km: Optional[float] = None
    if consumer_lat is not None and consumer_lng is not None:
        dist_km = round(
            logistics_service.haversine_distance_km(
                consumer_lat, consumer_lng, listing.latitude, listing.longitude
            ) * logistics_service.ROAD_TORTUOSITY_FACTOR,
            1
        )

    expected_delivery_hours = round(max(0.5, (dist_km / 35.0) + 0.5), 1) if dist_km is not None else 2.0
    hours, freshness_score, freshness_label = pricing_freshness_service.calculate_freshness(
        harvest_timestamp=listing.harvest_timestamp,
        shelf_life_hours=listing.shelf_life_hours,
        decay_lambda=listing.freshness_decay_lambda,
        expected_delivery_hours=expected_delivery_hours
    )

    pricing_strat = getattr(listing, "pricing_strategy", "DYNAMIC_MANDI_PEG") or "DYNAMIC_MANDI_PEG"
    min_floor = getattr(listing, "min_price_floor_per_kg", None)
    cat_val = listing.category.value if hasattr(listing.category, "value") else str(listing.category)

    eff_price, change_pct, trend = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=listing.expected_base_price_per_kg,
        crop_name=listing.crop_name,
        pricing_strategy=pricing_strat,
        min_price_floor=min_floor,
        category=cat_val
    )

    mandi_item = await db["mandi_benchmarks"].find_one({
        "district_name": {"$regex": re.escape(listing.district), "$options": "i"}
    })

    mandi_comp = None
    if mandi_item:
        mandi_comp = pricing_freshness_service.compare_with_mandi(
            platform_price_per_kg=eff_price,
            mandi_modal_price_per_kg=mandi_item.get("modal_price_per_kg", 0.0),
            mandi_name=mandi_item.get("mandi_name", "")
        )

    farmer_user = await db["users"].find_one({"id": listing.farmer_id})
    farmer_name = farmer_user.get("full_name", "Farmer") if farmer_user else "Farmer"
    farmer_rating = 4.8
    fpo_name = None
    if farmer_user:
        fp = farmer_user.get("farmer_profile") or {}
        farmer_rating = fp.get("rating", 4.8)
        fpo_name = fp.get("fpo_affiliation")

    return CatalogProductItem(
        id=listing.id,
        farmer_id=listing.farmer_id,
        farmer_name=farmer_name,
        farmer_rating=farmer_rating,
        fpo_affiliation=fpo_name,
        crop_name=listing.crop_name,
        variety=listing.variety,
        category=listing.category,
        grade=listing.grade,
        quantity_available_kg=listing.quantity_available_kg,
        minimum_order_kg=listing.minimum_order_kg,
        base_price_per_kg=eff_price,
        pricing_strategy=pricing_strat,
        min_price_floor_per_kg=min_floor,
        target_farmer_price_per_kg=getattr(listing, "target_farmer_price_per_kg", listing.expected_base_price_per_kg),
        daily_price_change_percent=change_pct,
        daily_trend=trend,
        is_market_pegged=pricing_strat == "DYNAMIC_MANDI_PEG",
        harvest_timestamp=listing.harvest_timestamp,
        hours_since_harvest=hours,
        expected_delivery_hours=expected_delivery_hours,
        transit_adjusted_hours=round(hours + expected_delivery_hours, 1),
        freshness_score=freshness_score,
        freshness_label=freshness_label,
        district=listing.district,
        latitude=listing.latitude,
        longitude=listing.longitude,
        distance_km=dist_km,
        mandi_benchmark=mandi_comp,
        is_organic=listing.is_organic,
        image_url=listing.image_url
    )
