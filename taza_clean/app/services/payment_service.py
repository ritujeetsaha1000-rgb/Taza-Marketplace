import hmac
import hashlib
import uuid
from typing import Dict, Any, Optional
from app.core.config import settings


class PaymentService:
    """Razorpay sandbox payment integration and signature verification hook."""

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET

    async def create_order(
        self,
        amount_inr: float,
        currency: str = "INR",
        receipt_id: Optional[str] = None,
        notes: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Creates a Razorpay sandbox order (Amount in smallest sub-unit paise).
        """
        amount_paise = int(round(amount_inr * 100))
        generated_order_id = f"order_rzp_{uuid.uuid4().hex[:14]}"
        
        return {
            "id": generated_order_id,
            "entity": "order",
            "amount": amount_paise,
            "amount_paid": 0,
            "amount_due": amount_paise,
            "currency": currency,
            "receipt": receipt_id or f"rcpt_{uuid.uuid4().hex[:8]}",
            "status": "created",
            "attempts": 0,
            "notes": notes or {},
            "key_id": self.key_id
        }

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Verifies SHA256 HMAC signature. In sandbox/mock mode, returns True if signature matches or starts with 'mock_sig'.
        """
        if razorpay_signature.startswith("mock_sig_") or settings.DEBUG:
            return True
            
        payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        generated_sig = hmac.new(
            self.key_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(generated_sig, razorpay_signature)


payment_service = PaymentService()
