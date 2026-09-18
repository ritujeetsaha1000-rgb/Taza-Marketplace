from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import date


class DistrictMetricResponse(BaseModel):
    id: int
    district_name: str
    state: str
    soil_type: str
    annual_rainfall_mm: float
    agro_climatic_zone: str
    primary_crops: List[Any]
    harvest_seasons: List[Any]
    baseline_yield_per_acre_kg: float
    cold_storage_capacity_tonnes: float
    active_fpos_count: int
    centroid_lat: float
    centroid_lng: float

    model_config = ConfigDict(from_attributes=True)


class MandiBenchmarkResponse(BaseModel):
    id: int
    district_name: str
    mandi_name: str
    crop_name: str
    variety: Optional[str] = None
    modal_price_per_kg: float
    min_price_per_kg: float
    max_price_per_kg: float
    arrival_quantity_tonnes: float
    reported_date: date
    source_agency: str

    model_config = ConfigDict(from_attributes=True)


class DistrictProductionOverview(BaseModel):
    district_name: str
    top_crops: List[str]
    current_season: str
    estimated_active_farmers: int
    current_market_arrivals_tonnes: float
    average_mandi_price_inr_kg: float
    platform_direct_savings_percent: float
    soil_health_index: str
