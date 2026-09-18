from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from app.schemas.otp import SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse
from app.services.otp_service import otp_service

router = APIRouter(prefix="/otp", tags=["OTP & SMS Authentication Engine"])


@router.post("/send", response_model=SendOtpResponse)
async def send_otp(payload: SendOtpRequest):
    """
    Generate and send 6-digit OTP:
    - Calls Spring Boot / external OTP service (`POST /api/v1/otp/send`)
    - 5 minutes expiration with SMS dispatch simulation
    """
    if not payload.phoneNumber or not payload.phoneNumber.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required"
        )
    return await otp_service.send_otp(phone_number=payload.phoneNumber.strip())


@router.post("/verify")
async def verify_otp(payload: VerifyOtpRequest):
    """
    Verify received OTP:
    - Calls Spring Boot / external OTP service (`POST /api/v1/otp/verify`)
    - Checks matching 6-digit code and expiration window
    """
    if not payload.phoneNumber or not payload.phoneNumber.strip() or not payload.otp or not payload.otp.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Phone number and OTP are required"}
        )

    code, result = await otp_service.verify_otp(
        phone_number=payload.phoneNumber.strip(),
        otp=payload.otp.strip()
    )

    return JSONResponse(
        status_code=code,
        content=result.model_dump()
    )
