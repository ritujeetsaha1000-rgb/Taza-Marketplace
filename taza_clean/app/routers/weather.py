from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.weather import WeatherAdvisoryResponse, DisasterAlertResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather & Agro-Advisories"])


@router.get("/advisory", response_model=WeatherAdvisoryResponse)
async def get_weather_advisory(
    district: str = Query("Hooghly", description="Target West Bengal district"),
    latitude: Optional[float] = Query(None, description="Latitude override"),
    longitude: Optional[float] = Query(None, description="Longitude override")
):
    """
    Real-time Agro-Meteorological Advisory & Weather Alert:
    - Queries Open-Meteo live API for precipitation probability, temperature, and wind.
    - Evaluates flood, waterlogging, frost, and heatwave risk for seasonal West Bengal crops.
    - Yields harvest suitability score and logistics dispatch safety flag.
    """
    return await weather_service.get_district_weather_advisory(
        district=district,
        lat=latitude,
        lng=longitude
    )


@router.get("/alerts", response_model=DisasterAlertResponse)
async def get_disaster_alerts(
    region: str = Query("Hooghly", description="Target geographical region/district"),
    windSpeedKph: float = Query(0.0, alias="wind_speed_kph", description="Wind speed in km/h"),
    rainfallMm: float = Query(0.0, alias="rainfall_mm", description="Rainfall in mm"),
    latitude: Optional[float] = Query(None, description="Optional latitude override"),
    longitude: Optional[float] = Query(None, description="Optional longitude override")
):
    """
    Disaster Meteorological Alerts API:
    - Queries real-time Open-Meteo meteorological telemetry for live disaster detection.
    - Evaluates severe windstorm (Hurricane/Gale) and flash flood hazards.
    """
    return await weather_service.get_disaster_alerts(
        region=region,
        wind_speed_kph=windSpeedKph,
        rainfall_mm=rainfallMm,
        lat=latitude,
        lng=longitude
    )


@router.get("/district/{district_name}", response_model=WeatherAdvisoryResponse)
async def get_district_weather(district_name: str):
    """Direct lookup for weather advisory by West Bengal district name."""
    return await weather_service.get_district_weather_advisory(district=district_name)
