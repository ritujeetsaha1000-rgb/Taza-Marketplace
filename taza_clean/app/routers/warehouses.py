from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.warehouse import WarehouseResponse
from app.services.warehouse_service import warehouse_service

router = APIRouter(prefix="/warehouses", tags=["AI Warehouse Allocation & Proximity Hubs"])


@router.get("/nearest", response_model=WarehouseResponse)
async def find_nearest_warehouse(
    lat: float = Query(..., description="Farmer latitude coordinate", ge=-90.0, le=90.0),
    lng: float = Query(..., description="Farmer longitude coordinate", ge=-180.0, le=180.0)
):
    """
    AI Proximity Warehouse Scanner:
    - Scans for nearest available warehouse starting within a 40.0 km radius.
    - If none is located, incrementally expands search horizon by +40.0 km (40 -> 80 -> 120 ... up to 1000 km).
    - Returns warehouse data along with available space (capacityKg - currentStockKg) and distance.
    """
    result = warehouse_service.find_nearest_warehouse(lat=lat, lng=lng)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No available warehouse found within 1000 km radius."
        )
    return result


@router.get("", response_model=List[WarehouseResponse])
@router.get("/", response_model=List[WarehouseResponse])
async def list_warehouses(
    district: Optional[str] = Query(None, description="Optional district name filter"),
    only_available: bool = Query(True, description="Filter only warehouses with open capacity")
):
    """
    Lists warehouses sourced from MongoDB Atlas with current capacity and available space.
    """
    warehouses = warehouse_service.get_all_warehouses()
    filtered = []
    for wh in warehouses:
        if only_available and not wh.get("isAvailable", True):
            continue
        if district and district.lower() not in wh.get("district", "").lower():
            continue

        cap = float(wh.get("capacityKg", 500000.0))
        stk = float(wh.get("currentStockKg", 320000.0))
        avail = max(0.0, cap - stk)
        avail_pct = round((avail / cap) * 100, 1) if cap > 0 else 0.0
        occ_pct = round((stk / cap) * 100, 1) if cap > 0 else 0.0

        filtered.append({
            "id": str(wh.get("id", wh.get("_id", ""))),
            "district": wh.get("district", "West Bengal"),
            "locationName": wh.get("locationName", "Storage Node"),
            "latitude": wh.get("latitude", 0.0),
            "longitude": wh.get("longitude", 0.0),
            "capacityKg": cap,
            "currentStockKg": stk,
            "isAvailable": wh.get("isAvailable", True),
            "availableSpaceKg": avail,
            "availablePercent": avail_pct,
            "occupancyPercent": occ_pct,
            "distanceKm": None,
            "scannedRadiusKm": None,
            "scanIterations": None,
            "scanStatus": f"Registered Storage Hub ({avail_pct}% available)",
        })
    return filtered
