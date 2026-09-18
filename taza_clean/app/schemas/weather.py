from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AgroAlertItem(BaseModel):
    severity: str = Field(..., examples=["WARNING"])  # "INFO", "WARNING", "CRITICAL"
    alert_type: str = Field(..., examples=["HEAVY_RAINFALL"])  # "HEATWAVE", "FLOOD_RISK", "FROST", "HIGH_WIND"
    title: str = Field(..., examples=["Heavy Monsoon Inundation Risk"])
    description: str = Field(..., examples=["Expected rainfall > 65mm in next 24 hours. Protect harvested tubers and potatoes in storage."])
    affected_crops: List[str] = Field(..., examples=[["Jyoti Potato", "Pointed Gourd", "Paddy"]])
    mitigation_advice: str = Field(..., examples=["Elevate farm-gate storage bags; ensure field drainage trenches are clear."])



class WeatherAdvisoryResponse(BaseModel):
    district: str
    latitude: float
    longitude: float
    current_temperature_c: float
    relative_humidity_percent: float
    precipitation_probability_percent: float
    wind_speed_kmh: float
    weather_condition: str
    harvest_suitability_score: int  # 0 to 100
    is_safe_for_logistics_dispatch: bool
    alerts: List[AgroAlertItem]
    forecast_source: str


class DisasterAlertResponse(BaseModel):
    region: str
    severity: str  # "LOW", "MODERATE", "HIGH", "EXTREME"
    activeWarnings: List[str]
    live_wind_speed_kph: Optional[float] = Field(None, description="Current live wind speed in km/h")
    live_wind_gusts_kph: Optional[float] = Field(None, description="Current live wind gusts in km/h")
    live_rainfall_mm: Optional[float] = Field(None, description="Current precipitation/rainfall in mm")
    live_temperature_c: Optional[float] = Field(None, description="Current ambient temperature in °C")
    live_humidity_percent: Optional[float] = Field(None, description="Current relative humidity in %")
    live_weather_condition: Optional[str] = Field(None, description="Interpreted live weather condition")
    weather_code: Optional[int] = Field(None, description="WMO weather code from Open-Meteo")
    alert_active: Optional[bool] = Field(False, description="Whether active disaster warning requires action")
    alert_type: Optional[str] = Field(None, description="Primary disaster categorization")
    action_required: Optional[str] = Field(None, description="Logistics / agro mitigation advice")
    reroute_active: Optional[bool] = Field(False, description="Whether automated flood/storm rerouting is active")
    safe_corridor: Optional[str] = Field(None, description="Designated safe transport corridor")
    forecast_source: Optional[str] = Field("OPEN_METEO_LIVE_API", description="Data provenance")

