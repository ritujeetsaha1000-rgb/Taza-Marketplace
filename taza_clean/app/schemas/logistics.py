from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.logistics import VehicleType, RouteStatus


class WaypointLocation(BaseModel):
    name: str = Field(..., examples=["Hooghly Farmer Cluster Hub"])
    latitude: float = Field(..., ge=20.0, le=28.0, examples=[22.8124])
    longitude: float = Field(..., ge=85.0, le=90.0, examples=[88.2345])
    type: str = Field(default="PICKUP", examples=["PICKUP"]) # "PICKUP" or "DROPOFF"
    demand_kg: float = Field(default=0.0, ge=0)


class RouteCalculationRequest(BaseModel):
    origin_latitude: float = Field(..., ge=20.0, le=28.0, examples=[22.8124])
    origin_longitude: float = Field(..., ge=85.0, le=90.0, examples=[88.2345])
    origin_district: Optional[str] = Field(None, examples=["Hooghly"])
    
    destination_latitude: float = Field(..., ge=20.0, le=28.0, examples=[22.4986])
    destination_longitude: float = Field(..., ge=85.0, le=90.0, examples=[88.3102])
    destination_district: Optional[str] = Field(None, examples=["Kolkata"])
    
    cargo_weight_kg: float = Field(default=10.0, gt=0, examples=[25.0])
    requires_cold_chain: bool = Field(default=False)
    preferred_vehicle: Optional[VehicleType] = None


class RouteSegment(BaseModel):
    step_number: int
    instruction: str
    distance_km: float
    duration_minutes: float


class RouteCalculationResponse(BaseModel):
    origin: dict
    destination: dict
    total_distance_km: float
    estimated_duration_minutes: float
    recommended_vehicle: VehicleType
    logistics_cost_inr: float
    estimated_carbon_kg: float
    carbon_savings_percent_vs_diesel: float
    route_geometry_geojson: Optional[dict] = None
    turn_by_turn_summary: List[RouteSegment]
    service_provider: str  # "OSRM_ENGINE" or "HAVERSINE_SPATIAL_MODEL"


class BatchPickupDropoffRequest(BaseModel):
    hub_district: str = Field(..., examples=["Hooghly"])
    hub_latitude: float = Field(..., examples=[22.8124])
    hub_longitude: float = Field(..., examples=[88.2345])
    waypoints: List[WaypointLocation]
    vehicle_capacity_kg: float = Field(default=500.0, gt=0)



class BatchPickupDropoffResponse(BaseModel):
    optimized_sequence: List[WaypointLocation]
    total_route_distance_km: float
    total_duration_minutes: float
    total_cargo_kg: float
    vehicle_utilization_percent: float
    estimated_total_cost_inr: float


class RouteOptimizeLocation(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = ""


class RouteOptimizeRequest(BaseModel):
    origin: RouteOptimizeLocation
    waypoints: List[RouteOptimizeLocation]


class RouteOptimizeResponse(BaseModel):
    optimizedOrder: List[RouteOptimizeLocation]
    totalDistanceKm: float


# Direct aliases matching Java POJO class names
Location = RouteOptimizeLocation
RouteRequest = RouteOptimizeRequest
RouteResponse = RouteOptimizeResponse


class VendorDeliveryQuoteRequest(BaseModel):
    origin_latitude: float = Field(default=22.8124, ge=20.0, le=28.0)
    origin_longitude: float = Field(default=88.2345, ge=85.0, le=90.0)
    destination_latitude: float = Field(default=22.4986, ge=20.0, le=28.0)
    destination_longitude: float = Field(default=88.3102, ge=85.0, le=90.0)
    cargo_weight_kg: float = Field(default=2.5, gt=0)
    subtotal_inr: float = Field(..., ge=0)
    platform_fee_inr: float = Field(default=0.0, ge=0)
    city_retail_total_inr: float = Field(..., ge=0)
    requires_cold_chain: bool = Field(default=False)
    vendor_id: Optional[str] = "KISAN_EXPRESS_LOGISTICS"


class VendorDeliveryQuoteResponse(BaseModel):
    vendor_name: str
    vehicle_type: VehicleType
    distance_km: float
    raw_delivery_fee_inr: float
    max_allowable_delivery_fee_inr: float
    final_delivery_fee_inr: float
    is_retail_capped: bool
    retail_subsidy_inr: float
    subtotal_inr: float
    platform_fee_inr: float
    total_payable_inr: float
    city_retail_total_inr: float
    consumer_savings_inr: float
    guarantee_message: str

