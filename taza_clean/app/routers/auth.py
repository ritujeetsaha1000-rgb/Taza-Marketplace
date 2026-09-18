from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db, get_next_sequence_value
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.user import User, UserRole, BuyerType
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    FarmerAgreementEmailRequest,
    FarmerAgreementEmailResponse
)
from app.services.agreement_service import agreement_service
from app.services.insurance_service import insurance_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegister,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register a new Farmer or Consumer with their specialized profile."""
    # Check if user already exists
    existing_user = await db["users"].find_one({
        "$or": [{"email": payload.email}, {"phone": payload.phone}]
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or phone number already exists."
        )

    # Validate profile payload matching role
    if payload.role in [UserRole.FARMER, UserRole.FPO] and not payload.farmer_profile:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Farmer profile data (district, coordinates, farm size) is required for farmer/FPO registration."
        )
    if payload.role == UserRole.CONSUMER and not payload.consumer_profile:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Consumer profile data (delivery address, district, coordinates) is required for consumer registration."
        )

    user_id = await get_next_sequence_value(db, "user_id")
    now = datetime.now(timezone.utc)

    farmer_prof_dict = None
    if payload.farmer_profile:
        farmer_prof_dict = {
            "id": user_id,
            "user_id": user_id,
            "district": payload.farmer_profile.district,
            "block": payload.farmer_profile.block,
            "village": payload.farmer_profile.village,
            "farm_size_acres": payload.farmer_profile.farm_size_acres,
            "kisan_credit_card_no": payload.farmer_profile.kisan_credit_card_no,
            "latitude": payload.farmer_profile.latitude,
            "longitude": payload.farmer_profile.longitude,
            "fpo_affiliation": payload.farmer_profile.fpo_affiliation,
            "primary_crops": payload.farmer_profile.primary_crops,
            "rating": 4.8,
            "total_sales_kg": 0.0,
        }

    consumer_prof_dict = None
    if payload.consumer_profile:
        consumer_prof_dict = {
            "id": user_id,
            "user_id": user_id,
            "buyer_type": payload.consumer_profile.buyer_type.value if hasattr(payload.consumer_profile.buyer_type, 'value') else payload.consumer_profile.buyer_type,
            "delivery_address": payload.consumer_profile.delivery_address,
            "district": payload.consumer_profile.district,
            "pincode": payload.consumer_profile.pincode,
            "latitude": payload.consumer_profile.latitude,
            "longitude": payload.consumer_profile.longitude,
            "gstin": payload.consumer_profile.gstin,
        }

    user_doc = {
        "id": user_id,
        "email": payload.email,
        "phone": payload.phone,
        "hashed_password": get_password_hash(payload.password),
        "full_name": payload.full_name,
        "role": payload.role.value if hasattr(payload.role, 'value') else payload.role,
        "is_active": True,
        "is_verified": True,
        "created_at": now,
        "updated_at": now,
        "farmer_profile": farmer_prof_dict,
        "consumer_profile": consumer_prof_dict,
    }

    await db["users"].insert_one(user_doc)
    return User.from_doc(user_doc)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """OAuth2 compatible login endpoint."""
    user_doc = await db["users"].find_one({
        "$or": [{"email": form_data.username}, {"phone": form_data.username}]
    })

    if not user_doc or not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    user_role = user_doc["role"]
    access_token = create_access_token(subject=user_doc["id"], role=user_role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user_doc["id"],
        role=user_role,
        full_name=user_doc["full_name"]
    )


@router.post("/login/json", response_model=Token)
async def login_json(
    payload: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """JSON body login endpoint for mobile and frontend SPAs."""
    user_doc = await db["users"].find_one({
        "$or": [{"email": payload.email_or_phone}, {"phone": payload.email_or_phone}]
    })

    if not user_doc or not verify_password(payload.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
        )
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    user_role = user_doc["role"]
    access_token = create_access_token(subject=user_doc["id"], role=user_role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user_doc["id"],
        role=user_role,
        full_name=user_doc["full_name"]
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Returns profile for currently authenticated user."""
    return current_user


@router.post("/farmer-agreement/send", response_model=FarmerAgreementEmailResponse)
async def send_farmer_agreement(
    payload: FarmerAgreementEmailRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Dispatches trilingual terms & conditions agreement to the farmer's email with their
    name and contact number included, and logs audit record in MongoDB.
    """
    result = await agreement_service.dispatch_agreement_email(
        db=db,
        farmer_name=payload.farmer_name,
        farmer_email=payload.farmer_email,
        contact_number=payload.contact_number
    )
    return FarmerAgreementEmailResponse(**result)


@router.get("/farmer-agreement/preview", response_class=HTMLResponse)
async def preview_farmer_agreement(
    farmer_name: str = "Ananda Mondal",
    contact_number: str = "+91 98301 12233"
):
    """Returns HTML preview of the trilingual produce agreement."""
    return agreement_service.generate_agreement_html(
        farmer_name=farmer_name,
        contact_number=contact_number
    )


@router.get("/farmer-agreement/documents")
async def get_farmer_documents(
    farmer_email: Optional[str] = None,
    contact_number: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Returns list of legal and contractual documents for the farmer profile,
    including the TAZA Farmer Produce Agreement and warehouse receipts.
    """
    agreements = []
    if db is not None and (farmer_email or contact_number):
        query = {}
        if farmer_email and contact_number:
            query = {"$or": [{"farmer_email": farmer_email}, {"contact_number": contact_number}]}
        elif farmer_email:
            query = {"farmer_email": farmer_email}
        elif contact_number:
            query = {"contact_number": contact_number}

        cursor = db["farmer_agreements"].find(query).sort("accepted_at", -1)
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            agreements.append(doc)

    default_name = agreements[0]["farmer_name"] if agreements else "Ananda Mondal"
    default_contact = agreements[0]["contact_number"] if agreements else (contact_number or "+91 9830112233")
    default_email = agreements[0]["farmer_email"] if agreements else (farmer_email or "ananda.mondal@farmer.taza.in")
    latest_agreement_id = agreements[0]["agreement_id"] if agreements else "TZ-AGR-2026-WB"

    # Fetch dynamic claim details from database (with sample space fallback)
    claim_summary = await insurance_service.get_latest_claim_summary()
    claim_amt = claim_summary.get("claimAmountRs", claim_summary.get("calculatedRefundRs", 4250.0))
    claim_amt_formatted = f"₹{claim_amt:,.2f}" if isinstance(claim_amt, (int, float)) else str(claim_amt)
    claim_id = str(claim_summary.get("claimId") or claim_summary.get("_id") or "TZ-CLM-6AA5E0E4")
    incident = claim_summary.get("incidentRiskFactor", "Fire & Explosion in Electrical Cold Storage Bay")
    claim_status = claim_summary.get("approvalStatus", "Approved & Settled")
    crop_name = claim_summary.get("cropName", "Jyoti Potato")

    documents = [
        {
            "id": "doc-all-risks-insurance",
            "title": "ALL RISKS INSURANCE POLICY (Warehouse Storage Cover • গুদামজাত শস্য সর্বঝুঁকি বীমা)",
            "category": "INSURANCE_POLICY",
            "status": f"ACTIVE_CLAIM_SETTLED ({claim_amt_formatted})",
            "ref_id": "TZ-POL-WH-2026-0884",
            "claim_id": claim_id,
            "claim_amount": claim_amt_formatted,
            "claim_status": claim_status,
            "claim_peril": incident,
            "crop_name": crop_name,
            "farmer_name": default_name,
            "contact_number": default_contact,
            "farmer_email": default_email,
            "issue_date": datetime.now(timezone.utc).strftime("%d %B %Y"),
            "description": f"Comprehensive 22-clause warehouse damage insurance policy (Clause 21 Spoilage & Clause 22 Minimum Claim Threshold). Claim ID: {claim_id} | Peril: {incident} | Amount Claimed: {claim_amt_formatted} ({claim_status}).",
            "download_available": True,
            "print_available": True
        },
        {
            "id": "doc-produce-agreement",
            "title": "TAZA Farmer Produce Agreement (কৃষক ফসল চুক্তি / किसान उपज समझौता)",
            "category": "CONTRACT",
            "status": "SIGNED_AND_ACTIVE",
            "ref_id": latest_agreement_id,
            "farmer_name": default_name,
            "contact_number": default_contact,
            "farmer_email": default_email,
            "issue_date": agreements[0].get("agreement_date") if agreements else datetime.now(timezone.utc).strftime("%d %B %Y"),
            "description": "Statutory trilingual agreement guaranteeing minimum profit margin, 40km warehouse storage, 30-day electronic payments, and zero land claim protection.",
            "download_available": True,
            "print_available": True
        },
        {
            "id": "doc-warehouse-transit",
            "title": "Singur Cold Storage & Weighment Transit Pass (৪০ কিমি গুদামজাতকরণ রসিদ)",
            "category": "LOGISTICS_PASS",
            "status": "ACTIVE",
            "ref_id": "TZ-WH-PASS-8841",
            "farmer_name": default_name,
            "contact_number": default_contact,
            "farmer_email": default_email,
            "issue_date": datetime.now(timezone.utc).strftime("%d %B %Y"),
            "description": "AI-routed cold chain transit authorization for nearest Singur/Hooghly cooperative warehouse within 40km radius.",
            "download_available": True,
            "print_available": True
        },
        {
            "id": "doc-disaster-protection",
            "title": "Crop Calamity & Fair Price Protection Certificate (দুর্যোগ সুরক্ষা প্রশংসাপত্র)",
            "category": "INSURANCE_CERTIFICATE",
            "status": "VERIFIED",
            "ref_id": "TZ-PROT-WB-2026",
            "farmer_name": default_name,
            "contact_number": default_contact,
            "farmer_email": default_email,
            "issue_date": datetime.now(timezone.utc).strftime("%d %B %Y"),
            "description": "Protection certificate safeguarding farmer against sudden wholesale price crash and cyclone crop damages.",
            "download_available": True,
            "print_available": True
        }
    ]

    return {
        "farmer_name": default_name,
        "contact_number": default_contact,
        "farmer_email": default_email,
        "total_documents": len(documents),
        "documents": documents,
        "latest_insurance_claim": claim_summary,
        "raw_agreement_records": agreements
    }
