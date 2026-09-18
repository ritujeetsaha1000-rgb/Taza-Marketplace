from typing import List
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.maps import PlaceResponse
from app.services.maps_service import maps_service

router = APIRouter(prefix="/maps", tags=["Maps & Geocoding Engine"])


@router.get("/geocode", response_model=List[PlaceResponse])
async def geocode(
    query: str = Query(..., description="Location search query")
):
    """
    Geocode Search API:
    - Queries external Spring Boot Maps Service (`GET /api/v1/maps/geocode?query=...`)
    - Searches locations, landmarks, and agricultural hubs by name and address.
    """
    return await maps_service.geocode(query=query)


@router.get("/reverse-geocode", response_model=PlaceResponse)
async def reverse_geocode(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate")
):
    """
    Reverse Geocode API:
    - Queries external Spring Boot Maps Service (`GET /api/v1/maps/reverse-geocode?lat=...&lng=...`)
    - Finds the nearest address / place for coordinates or returns 404.
    """
    place = await maps_service.reverse_geocode(lat=lat, lng=lng)
    if not place:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No address found near coordinates"
        )
    return place
