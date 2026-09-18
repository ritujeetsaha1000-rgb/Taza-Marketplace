import enum
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List


class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    CONFIRMED_BY_FARMER = "CONFIRMED_BY_FARMER"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Order:
    def __init__(
        self,
        id: int,
        order_number: str,
        consumer_id: int,
        farmer_id: int,
        product_id: int,
        quantity_kg: float,
        unit_price_inr: float,
        subtotal_inr: float,
        total_amount_inr: float,
        delivery_address: str,
        consumer_lat: float,
        consumer_lng: float,
        pickup_lat: float,
        pickup_lng: float,
        platform_fee_inr: float = 0.0,
        logistics_fee_inr: float = 0.0,
        status: OrderStatus = OrderStatus.PLACED,
        payment_status: PaymentStatus = PaymentStatus.PENDING,
        razorpay_order_id: Optional[str] = None,
        razorpay_payment_id: Optional[str] = None,
        estimated_distance_km: float = 0.0,
        estimated_delivery_time: Optional[datetime] = None,
        notes: Optional[str] = None,
        tracking_events: Optional[List[Dict[str, Any]]] = None,
        travel_vendor_name: Optional[str] = "Bengal Rural Travel Express",
        raw_logistics_fee_inr: Optional[float] = None,
        city_retail_total_inr: Optional[float] = None,
        is_retail_capped: Optional[bool] = False,
        retail_subsidy_inr: Optional[float] = 0.0,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self.id = id
        self._id = _id
        self.order_number = order_number
        self.consumer_id = consumer_id
        self.farmer_id = farmer_id
        self.product_id = product_id
        self.quantity_kg = quantity_kg
        self.unit_price_inr = unit_price_inr
        self.subtotal_inr = subtotal_inr
        self.platform_fee_inr = platform_fee_inr
        self.logistics_fee_inr = logistics_fee_inr
        self.total_amount_inr = total_amount_inr
        self.status = status if isinstance(status, OrderStatus) else OrderStatus(status)
        self.payment_status = payment_status if isinstance(payment_status, PaymentStatus) else PaymentStatus(payment_status)
        self.razorpay_order_id = razorpay_order_id
        self.razorpay_payment_id = razorpay_payment_id
        self.delivery_address = delivery_address
        self.consumer_lat = consumer_lat
        self.consumer_lng = consumer_lng
        self.pickup_lat = pickup_lat
        self.pickup_lng = pickup_lng
        self.estimated_distance_km = estimated_distance_km
        self.estimated_delivery_time = estimated_delivery_time
        self.notes = notes
        self.tracking_events = tracking_events or []
        self.travel_vendor_name = travel_vendor_name
        self.raw_logistics_fee_inr = raw_logistics_fee_inr
        self.city_retail_total_inr = city_retail_total_inr
        self.is_retail_capped = is_retail_capped
        self.retail_subsidy_inr = retail_subsidy_inr
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "order_number": self.order_number,
            "consumer_id": self.consumer_id,
            "farmer_id": self.farmer_id,
            "product_id": self.product_id,
            "quantity_kg": self.quantity_kg,
            "unit_price_inr": self.unit_price_inr,
            "subtotal_inr": self.subtotal_inr,
            "platform_fee_inr": self.platform_fee_inr,
            "logistics_fee_inr": self.logistics_fee_inr,
            "total_amount_inr": self.total_amount_inr,
            "travel_vendor_name": self.travel_vendor_name,
            "raw_logistics_fee_inr": self.raw_logistics_fee_inr,
            "city_retail_total_inr": self.city_retail_total_inr,
            "is_retail_capped": self.is_retail_capped,
            "retail_subsidy_inr": self.retail_subsidy_inr,
            "status": self.status.value if isinstance(self.status, OrderStatus) else self.status,
            "payment_status": self.payment_status.value if isinstance(self.payment_status, PaymentStatus) else self.payment_status,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "delivery_address": self.delivery_address,
            "consumer_lat": self.consumer_lat,
            "consumer_lng": self.consumer_lng,
            "pickup_lat": self.pickup_lat,
            "pickup_lng": self.pickup_lng,
            "estimated_distance_km": self.estimated_distance_km,
            "estimated_delivery_time": self.estimated_delivery_time,
            "notes": self.notes,
            "tracking_events": self.tracking_events,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["Order"]:
        if not doc:
            return None
        return cls(**doc)
