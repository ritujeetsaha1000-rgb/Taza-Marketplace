from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.weather import DisasterAlertResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/alerts", tags=["Disaster Alerts Engine"])


@router.get("", response_model=DisasterAlertResponse)
@router.get("/", response_model=DisasterAlertResponse)
async def get_alerts(
    region: str = Query("Hooghly", description="Target region/district"),
    windSpeedKph: float = Query(0.0, alias="wind_speed_kph", description="Wind speed in km/h"),
    rainfallMm: float = Query(0.0, alias="rainfall_mm", description="Rainfall in mm"),
    latitude: Optional[float] = Query(None, description="Optional GPS latitude override"),
    longitude: Optional[float] = Query(None, description="Optional GPS longitude override")
):
    """
    Disaster Alerts API:
    - Queries real-time Open-Meteo meteorological telemetry for live disaster detection.
    - Evaluates Gale / Hurricane force windstorms, Flash Flood watches, and Heatwave warnings.
    - Maintains backwards compatibility with Spring Boot alert parameters.
    """
    return await weather_service.get_disaster_alerts(
        region=region,
        wind_speed_kph=windSpeedKph,
        rainfall_mm=rainfallMm,
        lat=latitude,
        lng=longitude
    )
