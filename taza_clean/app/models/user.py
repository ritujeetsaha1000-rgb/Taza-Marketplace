import enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any


class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    CONSUMER = "CONSUMER"
    FPO = "FPO"
    ADMIN = "ADMIN"


class BuyerType(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    RESTAURANT = "RESTAURANT"
    RETAILER = "RETAILER"
    BULK_TRADER = "BULK_TRADER"


class FarmerProfile:
    def __init__(
        self,
        id: Optional[int] = None,
        user_id: Optional[int] = None,
        district: str = "",
        block: Optional[str] = None,
        village: Optional[str] = None,
        farm_size_acres: float = 1.0,
        kisan_credit_card_no: Optional[str] = None,
        latitude: float = 0.0,
        longitude: float = 0.0,
        fpo_affiliation: Optional[str] = None,
        primary_crops: Optional[str] = None,
        rating: float = 4.8,
        total_sales_kg: float = 0.0,
        **kwargs
    ):
        self.id = id or user_id
        self.user_id = user_id
        self.district = district
        self.block = block
        self.village = village
        self.farm_size_acres = farm_size_acres
        self.kisan_credit_card_no = kisan_credit_card_no
        self.latitude = latitude
        self.longitude = longitude
        self.fpo_affiliation = fpo_affiliation
        self.primary_crops = primary_crops
        self.rating = rating
        self.total_sales_kg = total_sales_kg

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "district": self.district,
            "block": self.block,
            "village": self.village,
            "farm_size_acres": self.farm_size_acres,
            "kisan_credit_card_no": self.kisan_credit_card_no,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "fpo_affiliation": self.fpo_affiliation,
            "primary_crops": self.primary_crops,
            "rating": self.rating,
            "total_sales_kg": self.total_sales_kg,
        }


class ConsumerProfile:
    def __init__(
        self,
        id: Optional[int] = None,
        user_id: Optional[int] = None,
        buyer_type: BuyerType = BuyerType.INDIVIDUAL,
        delivery_address: str = "",
        district: str = "",
        pincode: str = "",
        latitude: float = 0.0,
        longitude: float = 0.0,
        gstin: Optional[str] = None,
        **kwargs
    ):
        self.id = id or user_id
        self.user_id = user_id
        self.buyer_type = buyer_type if isinstance(buyer_type, BuyerType) else BuyerType(buyer_type)
        self.delivery_address = delivery_address
        self.district = district
        self.pincode = pincode
        self.latitude = latitude
        self.longitude = longitude
        self.gstin = gstin

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "buyer_type": self.buyer_type.value if isinstance(self.buyer_type, BuyerType) else self.buyer_type,
            "delivery_address": self.delivery_address,
            "district": self.district,
            "pincode": self.pincode,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "gstin": self.gstin,
        }


class User:
    def __init__(
        self,
        id: int,
        email: str,
        phone: str,
        hashed_password: str,
        full_name: str,
        role: UserRole = UserRole.CONSUMER,
        is_active: bool = True,
        is_verified: bool = False,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        farmer_profile: Optional[Any] = None,
        consumer_profile: Optional[Any] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.email = email
        self.phone = phone
        self.hashed_password = hashed_password
        self.full_name = full_name
        self.role = role if isinstance(role, UserRole) else UserRole(role)
        self.is_active = is_active
        self.is_verified = is_verified
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

        if isinstance(farmer_profile, dict):
            self.farmer_profile = FarmerProfile(**farmer_profile)
        elif isinstance(farmer_profile, FarmerProfile):
            self.farmer_profile = farmer_profile
        else:
            self.farmer_profile = None

        if isinstance(consumer_profile, dict):
            self.consumer_profile = ConsumerProfile(**consumer_profile)
        elif isinstance(consumer_profile, ConsumerProfile):
            self.consumer_profile = consumer_profile
        else:
            self.consumer_profile = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "phone": self.phone,
            "hashed_password": self.hashed_password,
            "full_name": self.full_name,
            "role": self.role.value if isinstance(self.role, UserRole) else self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "farmer_profile": self.farmer_profile.to_dict() if self.farmer_profile else None,
            "consumer_profile": self.consumer_profile.to_dict() if self.consumer_profile else None,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["User"]:
        if not doc:
            return None
        return cls(**doc)
