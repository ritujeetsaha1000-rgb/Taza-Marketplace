from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any


class DistrictMetric:
    def __init__(
        self,
        id: int,
        district_name: str,
        state: str = "West Bengal",
        soil_type: str = "",
        annual_rainfall_mm: float = 0.0,
        agro_climatic_zone: str = "",
        primary_crops: Optional[List[Any]] = None,
        harvest_seasons: Optional[List[Any]] = None,
        baseline_yield_per_acre_kg: float = 0.0,
        cold_storage_capacity_tonnes: float = 0.0,
        active_fpos_count: int = 5,
        centroid_lat: float = 0.0,
        centroid_lng: float = 0.0,
        primary_crops_json: Optional[str] = None,
        harvest_seasons_json: Optional[str] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.district_name = district_name
        self.state = state
        self.soil_type = soil_type
        self.annual_rainfall_mm = annual_rainfall_mm
        self.agro_climatic_zone = agro_climatic_zone
        self.primary_crops = primary_crops or []
        self.harvest_seasons = harvest_seasons or []
        self.baseline_yield_per_acre_kg = baseline_yield_per_acre_kg
        self.cold_storage_capacity_tonnes = cold_storage_capacity_tonnes
        self.active_fpos_count = active_fpos_count
        self.centroid_lat = centroid_lat
        self.centroid_lng = centroid_lng

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "district_name": self.district_name,
            "state": self.state,
            "soil_type": self.soil_type,
            "annual_rainfall_mm": self.annual_rainfall_mm,
            "agro_climatic_zone": self.agro_climatic_zone,
            "primary_crops": self.primary_crops,
            "harvest_seasons": self.harvest_seasons,
            "baseline_yield_per_acre_kg": self.baseline_yield_per_acre_kg,
            "cold_storage_capacity_tonnes": self.cold_storage_capacity_tonnes,
            "active_fpos_count": self.active_fpos_count,
            "centroid_lat": self.centroid_lat,
            "centroid_lng": self.centroid_lng,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["DistrictMetric"]:
        if not doc:
            return None
        return cls(**doc)


class MandiBenchmark:
    def __init__(
        self,
        id: int,
        district_name: str,
        mandi_name: str,
        crop_name: str,
        modal_price_per_kg: float,
        min_price_per_kg: float,
        max_price_per_kg: float,
        variety: Optional[str] = None,
        arrival_quantity_tonnes: float = 10.0,
        reported_date: Optional[date] = None,
        source_agency: str = "Agmarknet WB",
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.district_name = district_name
        self.mandi_name = mandi_name
        self.crop_name = crop_name
        self.variety = variety
        self.modal_price_per_kg = modal_price_per_kg
        self.min_price_per_kg = min_price_per_kg
        self.max_price_per_kg = max_price_per_kg
        self.arrival_quantity_tonnes = arrival_quantity_tonnes
        self.reported_date = reported_date or date.today()
        self.source_agency = source_agency

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "district_name": self.district_name,
            "mandi_name": self.mandi_name,
            "crop_name": self.crop_name,
            "variety": self.variety,
            "modal_price_per_kg": self.modal_price_per_kg,
            "min_price_per_kg": self.min_price_per_kg,
            "max_price_per_kg": self.max_price_per_kg,
            "arrival_quantity_tonnes": self.arrival_quantity_tonnes,
            "reported_date": str(self.reported_date) if isinstance(self.reported_date, date) else self.reported_date,
            "source_agency": self.source_agency,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["MandiBenchmark"]:
        if not doc:
            return None
        return cls(**doc)
