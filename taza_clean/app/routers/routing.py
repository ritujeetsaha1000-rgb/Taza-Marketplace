from fastapi import APIRouter
from app.schemas.logistics import RouteRequest, RouteResponse
from app.services.logistics_service import logistics_service

router = APIRouter(prefix="/optimize-route", tags=["Route Optimization Engine"])


@router.post("", response_model=RouteResponse)
@router.post("/", response_model=RouteResponse)
async def optimize_route(payload: RouteRequest):
    """
    Direct Route Optimization Controller:
    - Implements POST /api/v1/optimize-route
    - Accepts Location origin and waypoints list, returning optimizedOrder and totalDistanceKm.
    """
    return await logistics_service.optimize_external_route(
        origin=payload.origin,
        waypoints=payload.waypoints
    )
