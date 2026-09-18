from typing import Optional
from pydantic import BaseModel, Field


class OtpData(BaseModel):
    otp: str = Field(..., examples=["123456"])
    expiryTimeMillis: int = Field(..., examples=[1725785400000])


class SendOtpRequest(BaseModel):
    phoneNumber: str = Field(..., examples=["+919876543210"])



class SendOtpResponse(BaseModel):
    status: str = Field(..., examples=["SUCCESS"])
    message: str = Field(..., examples=["OTP sent successfully"])
    otpForTesting: Optional[str] = Field(None, examples=["123456"])


class VerifyOtpRequest(BaseModel):
    phoneNumber: str = Field(..., examples=["+919876543210"])
    otp: str = Field(..., examples=["123456"])


class VerifyOtpResponse(BaseModel):
    status: str = Field(..., examples=["SUCCESS"])
    message: str = Field(..., examples=["OTP verified successfully"])
