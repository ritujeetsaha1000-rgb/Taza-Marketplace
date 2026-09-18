from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.logistics import (
    RouteCalculationRequest,
    RouteCalculationResponse,
    BatchPickupDropoffRequest,
    BatchPickupDropoffResponse,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    VendorDeliveryQuoteRequest,
    VendorDeliveryQuoteResponse,
)
from app.services.logistics_service import logistics_service

router = APIRouter(prefix="/logistics", tags=["Logistics & Routing Engine"])


@router.post("/calculate-route", response_model=RouteCalculationResponse)
async def calculate_route(
    payload: RouteCalculationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Logistics Route Calculator:
    - Calculates distance & duration using OSRM with geodesic road tortuosity fallback.
    - Recommends optimal green vehicle type (E-Rickshaw, Tata Ace, Reefer Van).
    - Computes delivery fares and carbon emissions savings.
    """
    return await logistics_service.calculate_route(
        origin_lat=payload.origin_latitude,
        origin_lng=payload.origin_longitude,
        dest_lat=payload.destination_latitude,
        dest_lng=payload.destination_longitude,
        cargo_weight_kg=payload.cargo_weight_kg,
        requires_cold_chain=payload.requires_cold_chain,
        preferred_vehicle=payload.preferred_vehicle
    )


@router.post("/delivery-quote", response_model=VendorDeliveryQuoteResponse)
async def get_vendor_delivery_quote(
    payload: VendorDeliveryQuoteRequest
):
    """
    External Travel Vendor Delivery Fare Calculator with City Retail Guarantee:
    - Calculates distance, vehicle type, and vendor delivery charge.
    - Strictly caps the delivery fee if it would cause order total to exceed City Retail price.
    """
    return await logistics_service.calculate_vendor_delivery_quote(
        subtotal_inr=payload.subtotal_inr,
        city_retail_total_inr=payload.city_retail_total_inr,
        cargo_weight_kg=payload.cargo_weight_kg,
        origin_lat=payload.origin_latitude,
        origin_lng=payload.origin_longitude,
        dest_lat=payload.destination_latitude,
        dest_lng=payload.destination_longitude,
        platform_fee_inr=payload.platform_fee_inr,
        requires_cold_chain=payload.requires_cold_chain
    )


@router.post("/batch-optimize", response_model=BatchPickupDropoffResponse)
async def batch_optimize_routes(
    payload: BatchPickupDropoffRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Multi-Stop Waypoint Sequence Optimizer:
    Sequences agricultural pickups across multiple farmgates in a district to minimize transit time and carbon footprint.
    """
    if not payload.waypoints:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one waypoint is required for batch optimization."
        )

    return logistics_service.optimize_batch_route(
        hub_lat=payload.hub_latitude,
        hub_lng=payload.hub_longitude,
        waypoints=payload.waypoints,
        vehicle_capacity_kg=payload.vehicle_capacity_kg
    )


@router.post("/optimize-route", response_model=RouteOptimizeResponse)
async def optimize_route(
    payload: RouteOptimizeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Direct Route Optimization Engine:
    - Calls the Spring Boot / external Route Optimization service (`POST /api/v1/optimize-route`)
    - Computes greedy nearest-neighbor sequence and total distance (km) with automatic fallback
    """
    return await logistics_service.optimize_external_route(
        origin=payload.origin,
        waypoints=payload.waypoints
    )

