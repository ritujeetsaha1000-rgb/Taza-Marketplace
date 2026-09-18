from typing import Optional
from pydantic import BaseModel, Field


class WarehouseBase(BaseModel):
    id: Optional[str] = Field(None, description="Unique Warehouse ID")
    district: str = Field(..., description="District in West Bengal")
    locationName: str = Field(..., description="Name of warehouse or storage complex")
    latitude: float = Field(..., description="Geographical latitude")
    longitude: float = Field(..., description="Geographical longitude")
    capacityKg: float = Field(..., description="Total storage capacity in kilograms")
    currentStockKg: float = Field(0.0, description="Current stock stored in kilograms")
    isAvailable: bool = Field(True, description="Whether the warehouse has open storage capacity")


class WarehouseResponse(WarehouseBase):
    availableSpaceKg: float = Field(..., description="Calculated available space in kg")
    availablePercent: Optional[float] = Field(36.0, description="Percentage of storage space currently available (e.g. 36.0%)")
    occupancyPercent: Optional[float] = Field(64.0, description="Percentage of storage space currently occupied (e.g. 64.0%)")
    distanceKm: Optional[float] = Field(None, description="Distance from requested coordinates in kilometers")
    scannedRadiusKm: Optional[float] = Field(None, description="Radius boundary at which the warehouse was discovered (40km increments)")
    scanIterations: Optional[int] = Field(None, description="Number of 40km radial scan cycles required")
    scanStatus: Optional[str] = Field(None, description="Human-readable scan status and result")

