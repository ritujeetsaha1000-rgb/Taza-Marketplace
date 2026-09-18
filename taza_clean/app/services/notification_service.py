import uuid
from typing import Dict, Any
from app.core.config import settings


class NotificationService:
    """Relays SMS/OTP and direct order coordination notifications between farmers & consumers."""

    async def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """Dispatches an SMS via Msg91/Twilio mock."""
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        # In a real environment, httpx.post to Msg91 API or Twilio Client
        return {
            "success": True,
            "message_id": message_id,
            "recipient": phone,
            "provider": settings.SMS_PROVIDER,
            "content_preview": message[:60] + "..." if len(message) > 60 else message
        }

    async def create_farmer_consumer_relay_token(
        self,
        farmer_id: int,
        farmer_phone: str,
        consumer_phone: str,
        order_number: str
    ) -> str:
        """
        Creates a masked communication relay token so consumers and farmers can coordinate pickups safely.
        """
        relay_token = f"RELAY-WB-{uuid.uuid4().hex[:6].upper()}"
        return relay_token


notification_service = NotificationService()
