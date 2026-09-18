import enum
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple


class CropCategory(str, enum.Enum):
    VEGETABLES = "VEGETABLES"
    FRUITS = "FRUITS"
    GRAINS_PADDY = "GRAINS_PADDY"
    TUBERS = "TUBERS"
    CASH_CROPS = "CASH_CROPS"
    SPICES = "SPICES"
    PULSES = "PULSES"


class CropGrade(str, enum.Enum):
    GRADE_A_PREMIUM = "GRADE_A_PREMIUM"
    GRADE_B_STANDARD = "GRADE_B_STANDARD"
    ORGANIC_CERTIFIED = "ORGANIC_CERTIFIED"


class ProductListing:
    def __init__(
        self,
        id: int,
        farmer_id: int,
        crop_name: str,
        category: CropCategory,
        quantity_available_kg: float,
        expected_base_price_per_kg: float,
        harvest_timestamp: datetime,
        district: str,
        latitude: float,
        longitude: float,
        variety: Optional[str] = None,
        grade: CropGrade = CropGrade.GRADE_A_PREMIUM,
        minimum_order_kg: float = 0.15,
        shelf_life_hours: int = 72,
        freshness_decay_lambda: float = 0.015,
        description: Optional[str] = None,
        is_organic: bool = False,
        is_available: bool = True,
        image_url: Optional[str] = None,
        has_insurance: bool = True,
        insurance_policy_number: Optional[str] = None,
        pricing_strategy: str = "DYNAMIC_MANDI_PEG",
        target_farmer_price_per_kg: Optional[float] = None,
        min_price_floor_per_kg: Optional[float] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.farmer_id = farmer_id
        self.crop_name = crop_name
        self.variety = variety
        self.category = category if isinstance(category, CropCategory) else CropCategory(category)
        self.grade = grade if isinstance(grade, CropGrade) else CropGrade(grade)
        self.quantity_available_kg = quantity_available_kg
        self.minimum_order_kg = minimum_order_kg
        self.expected_base_price_per_kg = expected_base_price_per_kg
        self.pricing_strategy = pricing_strategy or "DYNAMIC_MANDI_PEG"
        self.target_farmer_price_per_kg = target_farmer_price_per_kg or expected_base_price_per_kg
        self.min_price_floor_per_kg = min_price_floor_per_kg
        self.harvest_timestamp = harvest_timestamp
        self.shelf_life_hours = shelf_life_hours
        self.freshness_decay_lambda = freshness_decay_lambda
        self.district = district
        self.latitude = latitude
        self.longitude = longitude
        self.description = description
        self.is_organic = is_organic
        self.is_available = is_available
        self.image_url = image_url
        self.has_insurance = has_insurance
        self.insurance_policy_number = insurance_policy_number or f"TZ-POL-WH-{id}"
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def get_effective_price_per_kg(self, target_date: Optional[datetime] = None) -> float:
        """Returns the active daily dynamic price per kg respecting the farmer's pricing strategy and floor."""
        from app.services.pricing_freshness_service import pricing_freshness_service
        cat_val = self.category.value if hasattr(self.category, "value") else str(self.category)
        eff_price, _, _ = pricing_freshness_service.calculate_daily_dynamic_price(
            base_price=self.expected_base_price_per_kg,
            crop_name=self.crop_name,
            pricing_strategy=self.pricing_strategy,
            min_price_floor=self.min_price_floor_per_kg,
            target_date=target_date,
            category=cat_val
        )
        return eff_price

    def get_daily_pricing_analytics(self, target_date: Optional[datetime] = None) -> Tuple[float, float, str]:
        """Returns (effective_price, daily_change_percent, trend) for stock-market style daily tracking."""
        from app.services.pricing_freshness_service import pricing_freshness_service
        cat_val = self.category.value if hasattr(self.category, "value") else str(self.category)
        return pricing_freshness_service.calculate_daily_dynamic_price(
            base_price=self.expected_base_price_per_kg,
            crop_name=self.crop_name,
            pricing_strategy=self.pricing_strategy,
            min_price_floor=self.min_price_floor_per_kg,
            target_date=target_date,
            category=cat_val
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "farmer_id": self.farmer_id,
            "crop_name": self.crop_name,
            "variety": self.variety,
            "category": self.category.value if isinstance(self.category, CropCategory) else self.category,
            "grade": self.grade.value if isinstance(self.grade, CropGrade) else self.grade,
            "quantity_available_kg": self.quantity_available_kg,
            "minimum_order_kg": self.minimum_order_kg,
            "expected_base_price_per_kg": self.expected_base_price_per_kg,
            "pricing_strategy": self.pricing_strategy,
            "target_farmer_price_per_kg": self.target_farmer_price_per_kg,
            "min_price_floor_per_kg": self.min_price_floor_per_kg,
            "harvest_timestamp": self.harvest_timestamp,
            "shelf_life_hours": self.shelf_life_hours,
            "freshness_decay_lambda": self.freshness_decay_lambda,
            "district": self.district,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "description": self.description,
            "is_organic": self.is_organic,
            "is_available": self.is_available,
            "image_url": self.image_url,
            "has_insurance": self.has_insurance,
            "insurance_policy_number": self.insurance_policy_number,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["ProductListing"]:
        if not doc:
            return None
        return cls(**doc)
