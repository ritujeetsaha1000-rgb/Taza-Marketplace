import re
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db, get_next_sequence_value
from app.models.market_farmer import RegisteredFarmer, OfferedCrop, MarketPrice, SubGroupEnum
from app.schemas.market_farmer import (
    FarmerRegistrationCreate,
    FarmerRegistrationResponse,
    MarketPriceCreate,
    MarketPriceResponse,
    PriceComparisonItem,
    PriceComparisonResponse,
)

router = APIRouter(prefix="/market-farmer", tags=["Farmer Crop Offerings & Market Intelligence"])


@router.post("/farmers", response_model=FarmerRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_farmer_with_crops(
    payload: FarmerRegistrationCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Register a farmer along with their offered crop catalog and expected prices.
    Accepts both camelCase and snake_case request bodies.
    """
    farmer_id = await get_next_sequence_value(db, "registered_farmer_id")
    now = datetime.now(timezone.utc)

    offered_crops_docs = []
    for idx, crop_data in enumerate(payload.offered_crops, start=1):
        offered_crops_docs.append({
            "id": idx,
            "crop_name": crop_data.crop_name.strip(),
            "sub_group": crop_data.sub_group.value if hasattr(crop_data.sub_group, "value") else crop_data.sub_group,
            "available_quantity": crop_data.available_quantity,
            "expected_price_per_unit": crop_data.expected_price_per_unit,
        })

    farmer_doc = {
        "id": farmer_id,
        "farmer_name": payload.farmer_name.strip(),
        "contact_number": payload.contact_number.strip(),
        "district_name": payload.district_name.strip(),
        "village_or_block": payload.village_or_block.strip(),
        "registered_at": now,
        "offered_crops": offered_crops_docs,
    }

    await db["registered_farmers"].insert_one(farmer_doc)
    return RegisteredFarmer.from_doc(farmer_doc)


@router.get("/farmers", response_model=List[FarmerRegistrationResponse])
async def list_registered_farmers(
    district: Optional[str] = Query(None, description="Filter by district name"),
    crop_name: Optional[str] = Query(None, description="Filter by crop name"),
    sub_group: Optional[SubGroupEnum] = Query(None, description="Filter by crop sub-group (Grains, Vegetables, Fruits)"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List registered farmers and their offered crops with optional search filters.
    """
    query: dict = {}
    if district:
        query["district_name"] = {"$regex": re.escape(district.strip()), "$options": "i"}

    sub_group_val = sub_group.value if sub_group and hasattr(sub_group, "value") else sub_group
    if crop_name and sub_group_val:
        query["offered_crops"] = {
            "$elemMatch": {
                "crop_name": {"$regex": re.escape(crop_name.strip()), "$options": "i"},
                "sub_group": sub_group_val
            }
        }
    elif crop_name:
        query["offered_crops.crop_name"] = {"$regex": re.escape(crop_name.strip()), "$options": "i"}
    elif sub_group_val:
        query["offered_crops.sub_group"] = sub_group_val

    cursor = db["registered_farmers"].find(query).sort("registered_at", -1)
    farmers: List[FarmerRegistrationResponse] = []

    async for doc in cursor:
        rf = RegisteredFarmer.from_doc(doc)
        farmers.append(FarmerRegistrationResponse.model_validate(rf))

    return farmers


@router.get("/farmers/{farmer_id}", response_model=FarmerRegistrationResponse)
async def get_registered_farmer(
    farmer_id: int,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get a specific registered farmer and their offered crops by ID.
    """
    doc = await db["registered_farmers"].find_one({"id": farmer_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registered farmer with ID {farmer_id} not found."
        )
    return RegisteredFarmer.from_doc(doc)


@router.post("/prices", response_model=MarketPriceResponse, status_code=status.HTTP_201_CREATED)
async def record_market_price(
    payload: MarketPriceCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Record or update average market price for a district, crop, and subgroup.
    Accepts both camelCase and snake_case request bodies.
    """
    price_id = await get_next_sequence_value(db, "market_price_id")

    price_doc = {
        "id": price_id,
        "district_name": payload.district_name.strip(),
        "crop_name": payload.crop_name.strip(),
        "sub_group": payload.sub_group.value if hasattr(payload.sub_group, "value") else payload.sub_group,
        "average_price_inr": payload.average_price_inr,
        "unit": payload.unit.strip() if payload.unit else "Quintal",
    }

    await db["market_prices"].insert_one(price_doc)
    return MarketPrice.from_doc(price_doc)


@router.get("/prices", response_model=List[MarketPriceResponse])
async def list_market_prices(
    district_name: Optional[str] = Query(None, description="Filter by district name"),
    crop_name: Optional[str] = Query(None, description="Filter by crop name"),
    sub_group: Optional[SubGroupEnum] = Query(None, description="Filter by sub-group"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List market prices across districts and crops with optional filters.
    """
    query: dict = {}
    if district_name:
        query["district_name"] = {"$regex": re.escape(district_name.strip()), "$options": "i"}
    if crop_name:
        query["crop_name"] = {"$regex": re.escape(crop_name.strip()), "$options": "i"}
    if sub_group:
        query["sub_group"] = sub_group.value if hasattr(sub_group, "value") else sub_group

    cursor = db["market_prices"].find(query).sort([("district_name", 1), ("crop_name", 1)])
    prices: List[MarketPriceResponse] = []

    async for doc in cursor:
        mp = MarketPrice.from_doc(doc)
        prices.append(MarketPriceResponse.model_validate(mp))

    return prices


@router.get("/prices/{price_id}", response_model=MarketPriceResponse)
async def get_market_price(
    price_id: int,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get a specific market price entry by ID.
    """
    doc = await db["market_prices"].find_one({"id": price_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market price record with ID {price_id} not found."
        )
    return MarketPrice.from_doc(doc)


@router.get("/arbitrage", response_model=PriceComparisonResponse)
async def get_price_arbitrage(
    district_name: Optional[str] = Query(None, description="Filter by district"),
    crop_name: Optional[str] = Query(None, description="Filter by crop name"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Compare farmer offered crop prices against APMC / district market benchmarks
    to identify farmgate savings and competitive arbitrage opportunities.
    """
    query: dict = {}
    if district_name:
        query["district_name"] = {"$regex": re.escape(district_name.strip()), "$options": "i"}

    farmers_cursor = db["registered_farmers"].find(query).sort("district_name", 1)
    farmers_docs = await farmers_cursor.to_list(length=500)

    mp_cursor = db["market_prices"].find({})
    all_market_prices = await mp_cursor.to_list(length=500)

    comparisons: List[PriceComparisonItem] = []

    for f_doc in farmers_docs:
        f = RegisteredFarmer.from_doc(f_doc)
        for crop in f.offered_crops:
            if crop_name and crop_name.strip().lower() not in crop.crop_name.lower():
                continue

            matching_mp = next(
                (
                    mp for mp in all_market_prices
                    if (mp.get("district_name", "").lower() in f.district_name.lower() or f.district_name.lower() in mp.get("district_name", "").lower())
                    and (mp.get("crop_name", "").lower() in crop.crop_name.lower() or crop.crop_name.lower() in mp.get("crop_name", "").lower())
                ),
                None
            )

            mkt_price_kg = None
            diff_inr = None
            status_label = "MARKET_BENCHMARK_UNAVAILABLE"

            if matching_mp:
                avg_price = matching_mp.get("average_price_inr", 0.0)
                unit_str = matching_mp.get("unit", "Quintal")
                if unit_str.lower() == "quintal":
                    mkt_price_kg = round(avg_price / 100.0, 2)
                else:
                    mkt_price_kg = round(avg_price, 2)

                diff_inr = round(crop.expected_price_per_unit - mkt_price_kg, 2)
                if diff_inr <= 0:
                    status_label = "COMPETITIVE_BELOW_MARKET"
                else:
                    status_label = "ABOVE_MARKET"

            comparisons.append(
                PriceComparisonItem(
                    farmer_id=f.id,
                    farmer_name=f.farmer_name,
                    contact_number=f.contact_number,
                    district_name=f.district_name,
                    village_or_block=f.village_or_block,
                    crop_name=crop.crop_name,
                    sub_group=crop.sub_group,
                    available_quantity=crop.available_quantity,
                    farmer_expected_price_per_kg=crop.expected_price_per_unit,
                    market_average_price_per_kg=mkt_price_kg,
                    market_average_price_raw=matching_mp.get("average_price_inr") if matching_mp else None,
                    market_unit=matching_mp.get("unit") if matching_mp else None,
                    price_difference_inr_per_kg=diff_inr,
                    farmer_vs_market_status=status_label
                )
            )

    return PriceComparisonResponse(
        total_comparisons=len(comparisons),
        district_filter=district_name,
        crop_filter=crop_name,
        comparisons=comparisons
    )
