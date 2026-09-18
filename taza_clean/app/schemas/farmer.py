from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from app.models.product import CropCategory, CropGrade


class ProductCreate(BaseModel):
    crop_name: str = Field(..., min_length=2, max_length=100, examples=["Jyoti Potato"])
    variety: Optional[str] = Field(None, max_length=100, examples=["Chandramukhi"])
    category: CropCategory = Field(..., examples=[CropCategory.TUBERS])
    grade: CropGrade = Field(default=CropGrade.GRADE_A_PREMIUM)
    quantity_available_kg: float = Field(..., gt=0, examples=[500.0])
    minimum_order_kg: float = Field(default=0.15, gt=0, examples=[0.15])
    expected_base_price_per_kg: float = Field(..., gt=0, examples=[22.50])
    
    # Mandatory harvest timestamp
    harvest_timestamp: datetime = Field(..., examples=["2026-09-05T06:00:00Z"])
    shelf_life_hours: int = Field(default=72, gt=0, examples=[96])
    freshness_decay_lambda: float = Field(default=0.015, gt=0, examples=[0.015])
    
    # Farm Geo-coordinates & District
    district: str = Field(..., examples=["Hooghly"])
    latitude: float = Field(..., ge=20.0, le=28.0, examples=[22.8124])
    longitude: float = Field(..., ge=85.0, le=90.0, examples=[88.2345])
    
    description: Optional[str] = Field(None, examples=["Freshly harvested farm-gate potatoes, unwashed and skin intact for longer shelf life."])
    is_organic: bool = Field(default=False)
    image_url: Optional[str] = None
    has_insurance: bool = Field(default=True, description="Warehouse Storage All Risks Insurance Cover")
    insurance_policy_number: Optional[str] = Field(default=None)
    pricing_strategy: str = Field(default="DYNAMIC_MANDI_PEG", description="DYNAMIC_MANDI_PEG or FIXED_PRICE")
    target_farmer_price_per_kg: Optional[float] = Field(None, gt=0, description="Farmer target baseline price")
    min_price_floor_per_kg: Optional[float] = Field(None, gt=0, description="Minimum Price Floor (MSP) below which crop will never sell")



class ProductUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    category: Optional[CropCategory] = None
    grade: Optional[CropGrade] = None
    quantity_available_kg: Optional[float] = Field(None, gt=0)
    minimum_order_kg: Optional[float] = Field(None, gt=0)
    expected_base_price_per_kg: Optional[float] = Field(None, gt=0)
    is_available: Optional[bool] = None
    description: Optional[str] = None
    pricing_strategy: Optional[str] = None
    target_farmer_price_per_kg: Optional[float] = Field(None, gt=0)
    min_price_floor_per_kg: Optional[float] = Field(None, gt=0)


class ProductResponse(BaseModel):
    id: int
    farmer_id: int
    crop_name: str
    variety: Optional[str]
    category: CropCategory
    grade: CropGrade
    quantity_available_kg: float
    minimum_order_kg: float
    expected_base_price_per_kg: float
    harvest_timestamp: datetime
    shelf_life_hours: int
    freshness_decay_lambda: float
    district: str
    latitude: float
    longitude: float
    description: Optional[str]
    is_organic: bool
    is_available: bool
    image_url: Optional[str]
    created_at: datetime
    has_insurance: bool = True
    insurance_policy_number: Optional[str] = None
    pricing_strategy: str = "DYNAMIC_MANDI_PEG"
    target_farmer_price_per_kg: Optional[float] = None
    min_price_floor_per_kg: Optional[float] = None
    today_dynamic_price_per_kg: Optional[float] = None
    daily_price_change_percent: Optional[float] = None
    daily_trend: Optional[str] = None
    
    # Computed freshness
    current_freshness_score: Optional[float] = None
    hours_since_harvest: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class FarmerOrderSummaryItem(BaseModel):
    order_id: int
    order_number: str
    crop_name: str
    quantity_kg: float
    total_amount_inr: float
    consumer_name: str
    consumer_phone: str
    consumer_address: str
    status: str
    payment_status: str
    created_at: datetime


class FarmerDashboardResponse(BaseModel):
    total_listings: int
    active_listings: int
    total_sales_kg: float
    total_revenue_inr: float
    pending_orders_count: int
    dispatched_orders_count: int
    recent_outgoing_orders: List[FarmerOrderSummaryItem]
    district: str
    fpo_affiliation: Optional[str]


class DirectContactRelayResponse(BaseModel):
    farmer_id: int
    farmer_name: str
    farmer_phone: str
    farm_district: str
    relay_sms_sent: bool
    relay_token: str
    instructions: str


class FarmerPricingScenarioRequest(BaseModel):
    base_price_per_kg: float = Field(..., gt=0, examples=[25.0])
    pricing_strategy: str = Field(default="DYNAMIC_MANDI_PEG", examples=["DYNAMIC_MANDI_PEG"])
    mandi_market_price: Optional[float] = Field(default=None, examples=[35.0])
    market_surge_inr: Optional[float] = Field(default=10.0, ge=0, examples=[10.0])
    harvest_quantity_kg: float = Field(default=500.0, gt=0, examples=[500.0])
    profit_share_percent: float = Field(default=20.0, ge=0, le=100, examples=[20.0])
    min_price_floor_per_kg: Optional[float] = Field(default=None, examples=[20.0])


class FarmerPricingScenarioResponse(BaseModel):
    pricing_strategy: str
    market_state: str
    base_price_per_kg: float
    mandi_benchmark_price_per_kg: float
    market_surge_inr: float
    farmer_profit_share_percent: float
    farmer_profit_share_per_kg: float
    final_farmer_payout_per_kg: float
    effective_gain_percent: float
    harvest_quantity_kg: float
    base_total_payout_inr: float
    extra_farmer_profit_inr: float
    total_farmer_payout_inr: float
    consumer_saving_vs_mandi_inr: float
    scenario_summary: str
    explanation: str

