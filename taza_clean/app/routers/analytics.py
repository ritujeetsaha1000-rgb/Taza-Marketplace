import re
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.models.analytics import DistrictMetric, MandiBenchmark
from app.schemas.analytics import (
    DistrictMetricResponse,
    MandiBenchmarkResponse,
    DistrictProductionOverview,
)

router = APIRouter(prefix="/analytics", tags=["Agricultural Analytics & District Intelligence"])


@router.get("/districts", response_model=List[DistrictMetricResponse])
async def get_district_metrics(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Returns agricultural baseline metrics across West Bengal districts."""
    cursor = db["district_metrics"].find({}).sort("district_name", 1)
    response: List[DistrictMetricResponse] = []

    async for r in cursor:
        primary_crops = r.get("primary_crops", [])
        if not primary_crops and r.get("primary_crops_json"):
            primary_crops = json.loads(r["primary_crops_json"])

        harvest_seasons = r.get("harvest_seasons", [])
        if not harvest_seasons and r.get("harvest_seasons_json"):
            harvest_seasons = json.loads(r["harvest_seasons_json"])

        response.append(
            DistrictMetricResponse(
                id=r["id"],
                district_name=r["district_name"],
                state=r.get("state", "West Bengal"),
                soil_type=r.get("soil_type", ""),
                annual_rainfall_mm=r.get("annual_rainfall_mm", 0.0),
                agro_climatic_zone=r.get("agro_climatic_zone", ""),
                primary_crops=primary_crops,
                harvest_seasons=harvest_seasons,
                baseline_yield_per_acre_kg=r.get("baseline_yield_per_acre_kg", 0.0),
                cold_storage_capacity_tonnes=r.get("cold_storage_capacity_tonnes", 0.0),
                active_fpos_count=r.get("active_fpos_count", 5),
                centroid_lat=r.get("centroid_lat", 0.0),
                centroid_lng=r.get("centroid_lng", 0.0)
            )
        )
    return response


@router.get("/districts/{district_name}", response_model=DistrictMetricResponse)
async def get_single_district_metric(
    district_name: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Returns detailed agro-climatic profile for a specific district."""
    r = await db["district_metrics"].find_one({
        "district_name": {"$regex": re.escape(district_name.strip()), "$options": "i"}
    })

    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_name}' profile not found in West Bengal agricultural registry."
        )

    primary_crops = r.get("primary_crops", [])
    if not primary_crops and r.get("primary_crops_json"):
        primary_crops = json.loads(r["primary_crops_json"])

    harvest_seasons = r.get("harvest_seasons", [])
    if not harvest_seasons and r.get("harvest_seasons_json"):
        harvest_seasons = json.loads(r["harvest_seasons_json"])

    return DistrictMetricResponse(
        id=r["id"],
        district_name=r["district_name"],
        state=r.get("state", "West Bengal"),
        soil_type=r.get("soil_type", ""),
        annual_rainfall_mm=r.get("annual_rainfall_mm", 0.0),
        agro_climatic_zone=r.get("agro_climatic_zone", ""),
        primary_crops=primary_crops,
        harvest_seasons=harvest_seasons,
        baseline_yield_per_acre_kg=r.get("baseline_yield_per_acre_kg", 0.0),
        cold_storage_capacity_tonnes=r.get("cold_storage_capacity_tonnes", 0.0),
        active_fpos_count=r.get("active_fpos_count", 5),
        centroid_lat=r.get("centroid_lat", 0.0),
        centroid_lng=r.get("centroid_lng", 0.0)
    )


@router.get("/mandi-benchmarks", response_model=List[MandiBenchmarkResponse])
async def get_mandi_benchmarks(
    district: Optional[str] = Query(None, description="Filter by district"),
    crop_name: Optional[str] = Query(None, description="Filter by crop name"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Returns official APMC Mandi daily modal prices across West Bengal."""
    query: dict = {}
    if district:
        query["district_name"] = {"$regex": re.escape(district.strip()), "$options": "i"}
    if crop_name:
        query["crop_name"] = {"$regex": re.escape(crop_name.strip()), "$options": "i"}

    cursor = db["mandi_benchmarks"].find(query).sort("reported_date", -1)
    benchmarks: List[MandiBenchmarkResponse] = []

    async for b in cursor:
        benchmarks.append(
            MandiBenchmarkResponse(
                id=b["id"],
                district_name=b["district_name"],
                mandi_name=b["mandi_name"],
                crop_name=b["crop_name"],
                variety=b.get("variety"),
                modal_price_per_kg=b["modal_price_per_kg"],
                min_price_per_kg=b["min_price_per_kg"],
                max_price_per_kg=b["max_price_per_kg"],
                arrival_quantity_tonnes=b.get("arrival_quantity_tonnes", 10.0),
                reported_date=b.get("reported_date"),
                source_agency=b.get("source_agency", "Agmarknet WB")
            )
        )
    return benchmarks


@router.get("/mandi-benchmark-lookup")
async def lookup_mandi_benchmark(
    crop_name: str = Query(..., description="Crop name to search"),
    district: Optional[str] = Query(None, description="Optional district name"),
    category: Optional[str] = Query(None, description="Optional crop category"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Intelligent lookup for APMC Mandi benchmarks.
    Finds exact or best fuzzy match for vegetables, fruits, crops, grains, tubers, and spices.
    Returns official modal price, estimated retail price, and APMC market origin.
    """
    clean_crop = crop_name.strip()
    clean_dist = district.strip() if district else None

    # 1. Try exact or regex match on crop + district
    query = {"crop_name": {"$regex": re.escape(clean_crop), "$options": "i"}}
    if clean_dist:
        query["district_name"] = {"$regex": re.escape(clean_dist), "$options": "i"}

    match = await db["mandi_benchmarks"].find_one(query)

    # 2. Try match on crop alone if district-specific not found
    if not match:
        match = await db["mandi_benchmarks"].find_one({
            "crop_name": {"$regex": re.escape(clean_crop), "$options": "i"}
        })

    # 3. Try token/substring match across all benchmarks
    if not match:
        words = [w for w in re.split(r'[\s\(\)\/,-]+', clean_crop) if len(w) > 2]
        all_benchmarks = await db["mandi_benchmarks"].find({}).to_list(length=200)
        for b in all_benchmarks:
            b_name = b.get("crop_name", "").lower()
            b_var = (b.get("variety") or "").lower()
            for w in words:
                w_l = w.lower()
                if w_l in b_name or b_name in w_l or w_l in b_var:
                    match = b
                    break
            if match:
                break

    if match:
        modal_price = match.get("modal_price_per_kg", 25.0)
        est_retail = round(modal_price * 1.45, 2)
        return {
            "matched": True,
            "crop_name": match.get("crop_name"),
            "variety": match.get("variety"),
            "district_name": match.get("district_name"),
            "mandi_name": match.get("mandi_name"),
            "category": match.get("category"),
            "modal_price_per_kg": modal_price,
            "min_price_per_kg": match.get("min_price_per_kg", round(modal_price * 0.85, 2)),
            "max_price_per_kg": match.get("max_price_per_kg", round(modal_price * 1.25, 2)),
            "estimated_retail_price_per_kg": est_retail,
            "source_agency": match.get("source_agency", "Agmarknet WB Dept of Agri Marketing"),
            "reported_date": match.get("reported_date")
        }

    # Fallback generic default based on category
    cat_defaults = {
        "TUBERS": 22.00,
        "VEGETABLES": 28.00,
        "FRUITS": 55.00,
        "GRAINS_PADDY": 45.00,
        "SPICES": 75.00,
        "CASH_CROPS": 50.00
    }
    fallback_modal = cat_defaults.get(category, 30.00)
    return {
        "matched": False,
        "crop_name": clean_crop,
        "variety": "Standard Regional Variety",
        "district_name": clean_dist or "West Bengal State Aggregate",
        "mandi_name": "West Bengal APMC Aggregated State Benchmark",
        "category": category or "VEGETABLES",
        "modal_price_per_kg": fallback_modal,
        "min_price_per_kg": round(fallback_modal * 0.85, 2),
        "max_price_per_kg": round(fallback_modal * 1.25, 2),
        "estimated_retail_price_per_kg": round(fallback_modal * 1.45, 2),
        "source_agency": "Agmarknet WB Aggregate",
        "reported_date": None
    }


@router.get("/district-overview/{district_name}", response_model=DistrictProductionOverview)
async def get_district_overview(
    district_name: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """High-level summary of agricultural throughput and arbitrage metrics for a district."""
    dm = await db["district_metrics"].find_one({
        "district_name": {"$regex": re.escape(district_name.strip()), "$options": "i"}
    })

    if not dm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_name}' not found."
        )

    crops_list = dm.get("primary_crops", [])
    if not crops_list and dm.get("primary_crops_json"):
        crops_list = json.loads(dm["primary_crops_json"])
    top_crop_names = [c.get("name", "") if isinstance(c, dict) else str(c) for c in crops_list]

    mandis_cursor = db["mandi_benchmarks"].find({
        "district_name": {"$regex": re.escape(district_name.strip()), "$options": "i"}
    })
    mandis = await mandis_cursor.to_list(length=100)
    avg_price = (
        sum(m["modal_price_per_kg"] for m in mandis) / len(mandis)
        if mandis
        else 24.50
    )

    fpos_count = dm.get("active_fpos_count", 5)
    baseline_yield = dm.get("baseline_yield_per_acre_kg", 2000.0)

    return DistrictProductionOverview(
        district_name=dm["district_name"],
        top_crops=top_crop_names or ["Rice", "Potato", "Jute"],
        current_season="Kharif / Post-Monsoon Harvesting",
        estimated_active_farmers=fpos_count * 350,
        current_market_arrivals_tonnes=round(baseline_yield * 4.2, 1),
        average_mandi_price_inr_kg=round(avg_price, 2),
        platform_direct_savings_percent=22.5,
        soil_health_index="Rich Gangetic Alluvial (High N-P-K retention)"
    )
