import httpx
from typing import List, Optional
from app.core.config import settings
from app.schemas.maps import PlaceResponse


class MapsService:
    """Maps, Geocoding & Reverse Geocoding service with external REST integration and local fallback."""

    def __init__(self):
        self.database: List[PlaceResponse] = [
            PlaceResponse(placeId="p101", name="Central Park", lat=40.785091, lng=-73.968285, address="New York, NY, USA"),
            PlaceResponse(placeId="p102", name="Eiffel Tower", lat=48.858370, lng=2.294481, address="Champ de Mars, Paris, France"),
            PlaceResponse(placeId="p103", name="Hooghly Farmer Hub", lat=22.8963, lng=88.2461, address="Hooghly, West Bengal, India"),
            PlaceResponse(placeId="p104", name="Singur Agro Mandi", lat=22.8124, lng=88.2345, address="Singur, Hooghly, West Bengal, India"),
            PlaceResponse(placeId="p105", name="Kolkata Apex Market", lat=22.5726, lng=88.3639, address="Kolkata, West Bengal, India"),
        ]

    async def geocode(self, query: str) -> List[PlaceResponse]:
        """
        Geocodes a text query into locations.
        Queries the external Spring Boot Maps Service (/api/v1/maps/geocode?query=...).
        Falls back to local search if remote service is unreachable.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"{settings.MAPS_SERVICE_URL}/geocode",
                    params={"query": query}
                )
                if res.status_code == 200:
                    data = res.json()
                    return [PlaceResponse(**item) for item in data]
        except Exception:
            # Fallback to local search
            pass

        results: List[PlaceResponse] = []
        search = query.lower()
        for p in self.database:
            if search in p.name.lower() or search in p.address.lower():
                results.append(p)
        return results

    async def reverse_geocode(self, lat: float, lng: float) -> Optional[PlaceResponse]:
        """
        Reverse geocodes lat/lng into a place address.
        Queries the external Spring Boot Maps Service (/api/v1/maps/reverse-geocode?lat=...&lng=...).
        Falls back to local spatial distance matching if remote service is unreachable.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"{settings.MAPS_SERVICE_URL}/reverse-geocode",
                    params={"lat": lat, "lng": lng}
                )
                if res.status_code == 200:
                    data = res.json()
                    return PlaceResponse(**data)
                elif res.status_code == 404:
                    return None
        except Exception:
            # Fallback to local lookup
            pass

        for p in self.database:
            if abs(p.lat - lat) < 0.1 and abs(p.lng - lng) < 0.1:
                return p

        return None


maps_service = MapsService()
