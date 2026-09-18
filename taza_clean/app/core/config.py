import os
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TAZA Agri-Tech Logistics & Direct Commerce Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security & Auth
    SECRET_KEY: str = "taza_super_secure_secret_key_change_in_production_wb_agri_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Database (MongoDB)
    MONGO_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "taza_agri"


    # External Integration Hooks
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    ROUTE_OPTIMIZATION_SERVICE_URL: str = "http://localhost:8080/api/v1/optimize-route"
    DISASTER_ALERTS_SERVICE_URL: str = "http://localhost:8080/api/v1/alerts"
    MAPS_SERVICE_URL: str = "http://localhost:8080/api/v1/maps"
    OTP_SERVICE_URL: str = "http://localhost:8080/api/v1/otp"
    GOOGLE_MAPS_API_KEY: str = "mock_google_maps_key"

    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPENWEATHER_API_KEY: str = "mock_openweather_key"

    RAZORPAY_KEY_ID: str = "rzp_test_TZRrxxFUxeJKzg"
    RAZORPAY_KEY_SECRET: str = "qLF5wruWsjYSJEDOWYrV6Rlp"

    SMS_PROVIDER: str = "msg91_mock"
    MSG91_AUTH_KEY: str = "mock_msg91_auth_key"
    TWILIO_ACCOUNT_SID: str = "mock_twilio_account_sid"
    TWILIO_AUTH_TOKEN: str = "mock_twilio_auth_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"

    # Commercial & Logistics defaults
    BASE_DELIVERY_FARE_INR: float = 35.0
    MIN_DELIVERY_FARE_INR: float = 35.0
    MAX_DELIVERY_FARE_INR: float = 65.0
    PER_KM_RATE_INR: float = 6.5
    PLATFORM_COMMISSION_PERCENT: float = 2.0

    # Email & SMTP Delivery Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "TAZA Agro Platform"
    SMTP_USE_TLS: bool = True
    RESEND_API_KEY: Optional[str] = None
    BREVO_API_KEY: Optional[str] = None

    # External Insurance Claims Database
    EXTERNAL_MONGO_URI: str = "mongodb+srv://sumeetghoshvis_db_user:i6FjkqMom9jmVjzs@data.iujrixk.mongodb.net/database?appName=Data"
    EXTERNAL_DATABASE_NAME: str = "database"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
