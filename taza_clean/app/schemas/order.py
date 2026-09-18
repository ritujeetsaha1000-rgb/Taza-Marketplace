from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from app.models.order import OrderStatus, PaymentStatus


class OrderCreate(BaseModel):
    product_id: int = Field(..., examples=[1])
    
    # Flexible weight supporting 150g (0.150 kg) to 50kg+ (50.0 kg)
    quantity_kg: float = Field(..., ge=0.15, le=5000.0, examples=[2.5])
    delivery_address: str = Field(..., examples=["Flat 4B, Greenfield City, Behala Chowrasta, Kolkata"])
    consumer_lat: float = Field(..., ge=20.0, le=28.0, examples=[22.4986])
    consumer_lng: float = Field(..., ge=85.0, le=90.0, examples=[88.3102])
    notes: Optional[str] = Field(None, examples=["Please deliver early morning if possible"])


class OrderStatusUpdate(BaseModel):
    status: OrderStatus = Field(..., examples=[OrderStatus.CONFIRMED_BY_FARMER])
    notes: Optional[str] = Field(None, examples=["Produce sorted and packed in jute bags"])



class OrderItemSummary(BaseModel):
    product_id: int
    crop_name: str
    category: str
    variety: Optional[str]
    unit_price_inr: float
    harvest_timestamp: datetime


class OrderResponse(BaseModel):
    id: int
    order_number: str
    consumer_id: int
    farmer_id: int
    product_id: int
    product_info: Optional[OrderItemSummary] = None
    
    quantity_kg: float
    unit_price_inr: float
    subtotal_inr: float
    platform_fee_inr: float
    logistics_fee_inr: float
    total_amount_inr: float
    
    status: OrderStatus
    payment_status: PaymentStatus
    razorpay_order_id: Optional[str] = None
    
    delivery_address: str
    consumer_lat: float
    consumer_lng: float
    pickup_lat: float
    pickup_lng: float
    
    estimated_distance_km: float
    estimated_delivery_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    cancellation_allowed: Optional[bool] = None
    cancellation_status_message: Optional[str] = None
    travel_vendor_name: Optional[str] = "Bengal Rural Travel Express"
    raw_logistics_fee_inr: Optional[float] = None
    city_retail_total_inr: Optional[float] = None
    is_retail_capped: Optional[bool] = False
    retail_subsidy_inr: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


class OrderTrackingStep(BaseModel):
    status: str
    title: str
    description: str
    timestamp: Optional[datetime]
    completed: bool


class OrderTrackingResponse(BaseModel):
    order_id: int
    order_number: str
    current_status: OrderStatus
    payment_status: PaymentStatus
    crop_name: str
    quantity_kg: float
    farmer_name: str
    farmer_phone: str
    farmer_district: str
    
    origin_coords: dict
    destination_coords: dict
    distance_km: float
    estimated_delivery_time: Optional[datetime]
    estimated_window_text: str
    
    timeline: List[OrderTrackingStep]
    relay_active: bool
    cancellation_allowed: Optional[bool] = None
    cancellation_status_message: Optional[str] = None
