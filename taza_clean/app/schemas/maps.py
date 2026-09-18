from pydantic import BaseModel, Field


class PlaceResponse(BaseModel):
    placeId: str = Field(..., examples=["p101"])
    name: str = Field(..., examples=["Central Park"])
    lat: float = Field(..., examples=[40.785091])
    lng: float = Field(..., examples=[-73.968285])
    address: str = Field(..., examples=["New York, NY, USA"])


# Direct alias matching com.api.maps.model.Place
Place = PlaceResponse

