from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, AliasChoices
from app.models.market_farmer import SubGroupEnum


class OfferedCropCreate(BaseModel):
    crop_name: str = Field(
        ...,
        validation_alias=AliasChoices("cropName", "crop_name"),
        min_length=1,
        max_length=100
    )
    sub_group: SubGroupEnum = Field(
        ...,
        validation_alias=AliasChoices("subGroup", "sub_group")
    )
    available_quantity: float = Field(
        ...,
        validation_alias=AliasChoices("availableQuantity", "available_quantity"),
        ge=0
    )
    expected_price_per_unit: float = Field(
        ...,
        validation_alias=AliasChoices("expectedPricePerUnit", "expected_price_per_unit"),
        ge=0
    )

    model_config = ConfigDict(populate_by_name=True)


class OfferedCropResponse(BaseModel):
    id: int
    crop_name: str
    sub_group: SubGroupEnum
    available_quantity: float
    expected_price_per_unit: float

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class FarmerRegistrationCreate(BaseModel):
    farmer_name: str = Field(
        ...,
        validation_alias=AliasChoices("farmerName", "farmer_name"),
        min_length=1,
        max_length=255
    )
    contact_number: str = Field(
        ...,
        validation_alias=AliasChoices("contactNumber", "contact_number"),
        min_length=5,
        max_length=20
    )
    district_name: str = Field(
        ...,
        validation_alias=AliasChoices("districtName", "district_name"),
        min_length=1,
        max_length=100
    )
    village_or_block: str = Field(
        ...,
        validation_alias=AliasChoices("villageOrBlock", "village_or_block"),
        min_length=1,
        max_length=150
    )
    offered_crops: List[OfferedCropCreate] = Field(
        default_factory=list,
        validation_alias=AliasChoices("offeredCrops", "offered_crops")
    )

    model_config = ConfigDict(populate_by_name=True)


class FarmerRegistrationResponse(BaseModel):
    id: int
    farmer_name: str
    contact_number: str
    district_name: str
    village_or_block: str
    registered_at: datetime
    offered_crops: List[OfferedCropResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MarketPriceCreate(BaseModel):
    district_name: str = Field(
        ...,
        validation_alias=AliasChoices("districtName", "district_name"),
        min_length=1,
        max_length=100
    )
    crop_name: str = Field(
        ...,
        validation_alias=AliasChoices("cropName", "crop_name"),
        min_length=1,
        max_length=100
    )
    sub_group: SubGroupEnum = Field(
        ...,
        validation_alias=AliasChoices("subGroup", "sub_group")
    )
    average_price_inr: float = Field(
        ...,
        validation_alias=AliasChoices("averagePriceINR", "average_price_inr"),
        ge=0
    )
    unit: str = Field(
        default="Quintal",
        validation_alias=AliasChoices("unit"),
        max_length=50
    )

    model_config = ConfigDict(populate_by_name=True)


class MarketPriceResponse(BaseModel):
    id: int
    district_name: str
    crop_name: str
    sub_group: SubGroupEnum
    average_price_inr: float
    unit: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PriceComparisonItem(BaseModel):
    farmer_id: int
    farmer_name: str
    contact_number: str
    district_name: str
    village_or_block: str
    crop_name: str
    sub_group: SubGroupEnum
    available_quantity: float
    farmer_expected_price_per_kg: float
    market_average_price_per_kg: Optional[float] = None
    market_average_price_raw: Optional[float] = None
    market_unit: Optional[str] = None
    price_difference_inr_per_kg: Optional[float] = None
    farmer_vs_market_status: str  # "COMPETITIVE_BELOW_MARKET", "ABOVE_MARKET", "MARKET_BENCHMARK_UNAVAILABLE"


class PriceComparisonResponse(BaseModel):
    total_comparisons: int
    district_filter: Optional[str] = None
    crop_filter: Optional[str] = None
    comparisons: List[PriceComparisonItem]

