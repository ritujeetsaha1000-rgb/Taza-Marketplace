from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from app.models.product import CropCategory, CropGrade


class MandiComparisonData(BaseModel):
    mandi_name: str
    mandi_modal_price_per_kg: float
    estimated_retail_price_per_kg: Optional[float] = None
    platform_price_per_kg: float
    consumer_savings_percent: float
    farmer_margin_gain_percent: float
    is_better_deal: bool


class CatalogProductItem(BaseModel):
    id: int
    farmer_id: int
    farmer_name: str
    farmer_rating: float
    fpo_affiliation: Optional[str]
    crop_name: str
    variety: Optional[str]
    category: CropCategory
    grade: CropGrade
    quantity_available_kg: float
    minimum_order_kg: float
    base_price_per_kg: float
    harvest_timestamp: datetime
    
    # Freshness intelligence: e^(-lambda * t) where t = hours_since_harvest + expected_delivery_hours
    hours_since_harvest: float
    expected_delivery_hours: Optional[float] = 2.0
    transit_adjusted_hours: Optional[float] = None
    freshness_score: float  # 0 to 100
    freshness_label: str    # e.g., "Farm Fresh (< 6 hrs)", "Optimal (< 24 hrs)", "Fair"
    
    # Geo & Proximity
    district: str
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    
    # Benchmark comparison
    mandi_benchmark: Optional[MandiComparisonData] = None
    
    # Stock-Style Dynamic Daily Pricing
    pricing_strategy: str = "DYNAMIC_MANDI_PEG"
    min_price_floor_per_kg: Optional[float] = None
    target_farmer_price_per_kg: Optional[float] = None
    daily_price_change_percent: float = 0.0
    daily_trend: str = "STABLE"  # "UP", "DOWN", "STABLE"
    is_market_pegged: bool = True
    
    is_organic: bool
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CatalogFilterParams(BaseModel):
    district: Optional[str] = None
    category: Optional[CropCategory] = None
    search: Optional[str] = None
    max_distance_km: Optional[float] = Field(None, gt=0, examples=[50.0])
    min_freshness_score: Optional[float] = Field(None, ge=0, le=100, examples=[70.0])
    max_price_per_kg: Optional[float] = Field(None, gt=0)
    is_organic: Optional[bool] = None
    consumer_lat: Optional[float] = None
    consumer_lng: Optional[float] = None
    sort_by: Optional[str] = Field("freshness", examples=["freshness"]) # "freshness", "distance", "price_asc", "price_desc"
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)



class CatalogResponse(BaseModel):
    total_items: int
    returned_items: int
    filter_applied: dict
    items: List[CatalogProductItem]
