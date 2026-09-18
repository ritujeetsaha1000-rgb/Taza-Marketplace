from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from app.models.user import UserRole, BuyerType


class FarmerProfileCreate(BaseModel):
    district: str = Field(..., examples=["Hooghly"])
    block: Optional[str] = Field(None, examples=["Singur"])
    village: Optional[str] = Field(None, examples=["Balarambati"])
    farm_size_acres: float = Field(..., gt=0, examples=[2.5])
    kisan_credit_card_no: Optional[str] = Field(None, examples=["KCC-WB-2024-9843"])
    latitude: float = Field(..., ge=20.0, le=28.0, examples=[22.8124])
    longitude: float = Field(..., ge=85.0, le=90.0, examples=[88.2345])
    fpo_affiliation: Optional[str] = Field(None, examples=["Hooghly Potato Producers FPO"])
    primary_crops: Optional[str] = Field(None, examples=["Jyoti Potato, Rice, Jute"])


class ConsumerProfileCreate(BaseModel):
    buyer_type: BuyerType = Field(default=BuyerType.INDIVIDUAL)
    delivery_address: str = Field(..., examples=["Flat 4B, Greenfield City, Behala Chowrasta"])
    district: str = Field(..., examples=["Kolkata"])
    pincode: str = Field(..., examples=["700061"])
    latitude: float = Field(..., ge=20.0, le=28.0, examples=[22.4986])
    longitude: float = Field(..., ge=85.0, le=90.0, examples=[88.3102])
    gstin: Optional[str] = Field(None, examples=["19ABCDE1234F1Z5"])


class UserRegister(BaseModel):
    email: EmailStr = Field(..., examples=["ananda.mondal@farmer.taza.in"])
    phone: str = Field(..., min_length=10, max_length=15, examples=["+919830112233"])
    password: str = Field(..., min_length=6, examples=["Kisan@2026"])
    full_name: str = Field(..., examples=["Ananda Mondal"])
    role: UserRole = Field(..., examples=[UserRole.FARMER])
    
    # Nested profile depending on role
    farmer_profile: Optional[FarmerProfileCreate] = None
    consumer_profile: Optional[ConsumerProfileCreate] = None


class UserLogin(BaseModel):
    email_or_phone: str = Field(..., examples=["ananda.mondal@farmer.taza.in"])
    password: str = Field(..., examples=["Kisan@2026"])



class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    full_name: str


class FarmerProfileResponse(BaseModel):
    id: int
    district: str
    block: Optional[str] = None
    village: Optional[str] = None
    farm_size_acres: float
    latitude: float
    longitude: float
    fpo_affiliation: Optional[str] = None
    primary_crops: Optional[str] = None
    rating: float
    total_sales_kg: float

    model_config = ConfigDict(from_attributes=True)


class ConsumerProfileResponse(BaseModel):
    id: int
    buyer_type: BuyerType
    delivery_address: str
    district: str
    pincode: str
    latitude: float
    longitude: float
    gstin: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    email: str
    phone: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    farmer_profile: Optional[FarmerProfileResponse] = None
    consumer_profile: Optional[ConsumerProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class FarmerAgreementEmailRequest(BaseModel):
    farmer_name: str = Field(..., min_length=2, examples=["Ananda Mondal"])
    farmer_email: EmailStr = Field(..., examples=["ananda.mondal@farmer.taza.in"])
    contact_number: str = Field(..., min_length=10, max_length=20, examples=["+919830112233"])


class FarmerAgreementEmailResponse(BaseModel):
    status: str
    agreement_id: str
    farmer_name: str
    farmer_email: str
    contact_number: str
    message: str
    delivery_provider: Optional[str] = None
    is_live_delivered: bool = False
    error_detail: Optional[str] = None
