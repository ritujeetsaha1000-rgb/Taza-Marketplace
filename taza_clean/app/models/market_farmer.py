import enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any


class SubGroupEnum(str, enum.Enum):
    GRAINS = "Grains"
    VEGETABLES = "Vegetables"
    FRUITS = "Fruits"


class OfferedCrop:
    def __init__(
        self,
        id: Optional[int] = None,
        crop_name: str = "",
        sub_group: SubGroupEnum = SubGroupEnum.VEGETABLES,
        available_quantity: float = 0.0,
        expected_price_per_unit: float = 0.0,
        farmer_id: Optional[int] = None,
        **kwargs
    ):
        self.id = id
        self.crop_name = crop_name
        self.sub_group = sub_group if isinstance(sub_group, SubGroupEnum) else SubGroupEnum(sub_group)
        self.available_quantity = available_quantity
        self.expected_price_per_unit = expected_price_per_unit
        self.farmer_id = farmer_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "crop_name": self.crop_name,
            "sub_group": self.sub_group.value if isinstance(self.sub_group, SubGroupEnum) else self.sub_group,
            "available_quantity": self.available_quantity,
            "expected_price_per_unit": self.expected_price_per_unit,
        }


class RegisteredFarmer:
    def __init__(
        self,
        id: int,
        farmer_name: str,
        contact_number: str,
        district_name: str,
        village_or_block: str,
        registered_at: Optional[datetime] = None,
        offered_crops: Optional[List[Any]] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.farmer_name = farmer_name
        self.contact_number = contact_number
        self.district_name = district_name
        self.village_or_block = village_or_block
        self.registered_at = registered_at or datetime.now(timezone.utc)

        self.offered_crops: List[OfferedCrop] = []
        if offered_crops:
            for idx, c in enumerate(offered_crops, start=1):
                if isinstance(c, dict):
                    if "id" not in c or not c["id"]:
                        c["id"] = idx
                    self.offered_crops.append(OfferedCrop(**c))
                elif isinstance(c, OfferedCrop):
                    if not c.id:
                        c.id = idx
                    self.offered_crops.append(c)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "farmer_name": self.farmer_name,
            "contact_number": self.contact_number,
            "district_name": self.district_name,
            "village_or_block": self.village_or_block,
            "registered_at": self.registered_at,
            "offered_crops": [c.to_dict() for c in self.offered_crops],
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["RegisteredFarmer"]:
        if not doc:
            return None
        return cls(**doc)


class MarketPrice:
    def __init__(
        self,
        id: int,
        district_name: str,
        crop_name: str,
        sub_group: SubGroupEnum,
        average_price_inr: float,
        unit: str = "Quintal",
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.district_name = district_name
        self.crop_name = crop_name
        self.sub_group = sub_group if isinstance(sub_group, SubGroupEnum) else SubGroupEnum(sub_group)
        self.average_price_inr = average_price_inr
        self.unit = unit

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "district_name": self.district_name,
            "crop_name": self.crop_name,
            "sub_group": self.sub_group.value if isinstance(self.sub_group, SubGroupEnum) else self.sub_group,
            "average_price_inr": self.average_price_inr,
            "unit": self.unit,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["MarketPrice"]:
        if not doc:
            return None
        return cls(**doc)
