from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from app.services.insurance_service import insurance_service

router = APIRouter(prefix="/insurance", tags=["Insurance & Claims"])


class ClaimRecord(BaseModel):
    id: Optional[str] = None
    claim_id: str
    crop_name: str
    incident_risk_factor: str
    insured_stock_kg: float
    claim_amount_rs: float
    calculated_refund_rs: float
    approval_status: str
    warehouse_location: str
    applicable_clause: Optional[str] = None
    disbursement_channel: Optional[str] = None
    created_at: Optional[str] = None


class ClaimCreateRequest(BaseModel):
    crop_name: str
    incident_risk_factor: str
    claim_amount_rs: float
    insured_stock_kg: Optional[float] = None
    damaged_quantity_kg: Optional[float] = None
    calculated_refund_rs: Optional[float] = None
    warehouse_id: Optional[str] = None
    warehouse_location: Optional[str] = "Singur Cooperative Cold Hub A-1"
    farmer_name: Optional[str] = "Ananda Mondal"
    contact_number: Optional[str] = "+91 9830112233"
    damage_description: Optional[str] = None


@router.get("/claims")
async def list_insurance_claims(crop_name: Optional[str] = None):
    """
    Retrieves damage claims from the database (e.g. MongoDB insurancerefunds)
    with automatic sample space fallback.
    """
    claims = await insurance_service.fetch_claims_from_db(crop_name)
    return {
        "claims": claims,
        "total_claims": len(claims),
        "source": "MongoDB insurancerefunds / Sample Space"
    }


@router.get("/policy")
async def get_insurance_policy(
    farmer_name: Optional[str] = "Ananda Mondal",
    contact_number: Optional[str] = "+91 9830112233",
    crop_name: Optional[str] = "Jyoti Potato",
    quantity_kg: Optional[float] = 500.0,
    warehouse_name: Optional[str] = "Singur Cooperative Cold Hub A-1 / Alipurduar Vacant Plot A4",
    format: Optional[str] = "json"
):
    """
    Generates and returns the statutory ALL RISKS INSURANCE POLICY (Warehouse Storage Cover)
    with the 22 clauses from the policy document, highlighting the claim details and amount claimed.
    """
    claim_data = await insurance_service.get_latest_claim_summary(crop_name)
    html_content = insurance_service.generate_policy_html(
        farmer_name=farmer_name or "Ananda Mondal",
        contact_number=contact_number or "+91 9830112233",
        crop_name=crop_name or "Jyoti Potato",
        quantity_kg=quantity_kg or 500.0,
        warehouse_name=warehouse_name or "Singur Cooperative Cold Hub A-1 / Alipurduar Vacant Plot A4",
        claim_data=claim_data
    )

    if format == "html" or format == "raw_html":
        return HTMLResponse(content=html_content)

    amt = claim_data.get("claimAmountRs", claim_data.get("calculatedRefundRs", 4250.0))
    return {
        "policy_title": "ALL RISKS INSURANCE POLICY (Warehouse Storage Cover)",
        "farmer_name": farmer_name,
        "contact_number": contact_number,
        "crop_name": crop_name,
        "quantity_kg": quantity_kg,
        "warehouse_name": warehouse_name,
        "has_active_claim": True if claim_data else False,
        "claim": claim_data,
        "claim_amount_rs": float(amt),
        "amount_claimed": float(amt),
        "policy_html": html_content,
        "html_preview": html_content
    }


@router.post("/claims", status_code=status.HTTP_200_OK)
async def create_claim(payload: ClaimCreateRequest):
    """
    Submits a new warehouse damage claim.
    """
    claim_id = f"TZ-CLM-{int(datetime.now(timezone.utc).timestamp())}"
    stock_kg = payload.insured_stock_kg or payload.damaged_quantity_kg or 100.0
    refund_rs = payload.calculated_refund_rs if payload.calculated_refund_rs is not None else payload.claim_amount_rs
    new_claim = {
        "claimId": claim_id,
        "cropName": payload.crop_name,
        "incidentRiskFactor": payload.incident_risk_factor,
        "insuredStockKg": stock_kg,
        "claimAmountRs": payload.claim_amount_rs,
        "calculatedRefundRs": refund_rs,
        "approvalStatus": "Pending Inspection",
        "warehouseLocation": payload.warehouse_location or "Singur Cooperative Cold Hub A-1",
        "applicableClause": "Clause 21 Spoilage Cover & Clause 22 Minimum Claim Threshold",
        "disbursementChannel": "Direct Electronic Bank Settlement",
        "createdAt": datetime.now(timezone.utc).strftime("%d %B %Y")
    }

    try:
        db = insurance_service.get_external_db()
        if db is not None:
            await db["insurancerefunds"].insert_one(dict(new_claim))
    except Exception:
        pass

    return {
        "success": True,
        "claim_id": claim_id,
        "claim_amount_rs": payload.claim_amount_rs,
        "status": "Recorded",
        "message": f"Insurance claim of ₹{payload.claim_amount_rs:,.2f} recorded under {claim_id}",
        "policy_endorsement": "Clause 21 / Clause 22 Statutory Cover Added"
    }
