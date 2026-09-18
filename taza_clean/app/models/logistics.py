import enum
from datetime import datetime, timezone
from typing import Optional, Dict, Any


class VehicleType(str, enum.Enum):
    E_RICKSHAW = "E_RICKSHAW"  # Local district transport (low carbon)
    TATA_ACE = "TATA_ACE"      # Small commercial vehicle (Chhota Hathi)
    MAHINDRA_BOLERO_PICKUP = "MAHINDRA_BOLERO_PICKUP"
    REEFER_COLD_VAN = "REEFER_COLD_VAN"  # For perishable greens and fruits
    E_TRUCK_3W = "E_TRUCK_3W"


class RouteStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    DISPATCHED = "DISPATCHED"
    COMPLETED = "COMPLETED"
    RE_ROUTED_WEATHER = "RE_ROUTED_WEATHER"


class RouteLog:
    def __init__(
        self,
        id: int,
        order_id: int,
        origin_district: str,
        origin_lat: float,
        origin_lng: float,
        destination_district: str,
        destination_lat: float,
        destination_lng: float,
        distance_km: float,
        duration_minutes: float,
        vehicle_type: VehicleType = VehicleType.TATA_ACE,
        estimated_carbon_kg: float = 0.0,
        status: RouteStatus = RouteStatus.PLANNED,
        route_geometry_geojson: Optional[str] = None,
        waypoints_summary: Optional[str] = None,
        created_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.order_id = order_id
        self.origin_district = origin_district
        self.origin_lat = origin_lat
        self.origin_lng = origin_lng
        self.destination_district = destination_district
        self.destination_lat = destination_lat
        self.destination_lng = destination_lng
        self.distance_km = distance_km
        self.duration_minutes = duration_minutes
        self.vehicle_type = vehicle_type if isinstance(vehicle_type, VehicleType) else VehicleType(vehicle_type)
        self.estimated_carbon_kg = estimated_carbon_kg
        self.status = status if isinstance(status, RouteStatus) else RouteStatus(status)
        self.route_geometry_geojson = route_geometry_geojson
        self.waypoints_summary = waypoints_summary
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "order_id": self.order_id,
            "origin_district": self.origin_district,
            "origin_lat": self.origin_lat,
            "origin_lng": self.origin_lng,
            "destination_district": self.destination_district,
            "destination_lat": self.destination_lat,
            "destination_lng": self.destination_lng,
            "distance_km": self.distance_km,
            "duration_minutes": self.duration_minutes,
            "vehicle_type": self.vehicle_type.value if isinstance(self.vehicle_type, VehicleType) else self.vehicle_type,
            "estimated_carbon_kg": self.estimated_carbon_kg,
            "status": self.status.value if isinstance(self.status, RouteStatus) else self.status,
            "route_geometry_geojson": self.route_geometry_geojson,
            "waypoints_summary": self.waypoints_summary,
            "created_at": self.created_at,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["RouteLog"]:
        if not doc:
            return None
        return cls(**doc)
