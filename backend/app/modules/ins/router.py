"""API Router for Insurance & Reinsurance ERP module (INS-01..14)."""
from __future__ import annotations

import uuid
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)

from app.modules.ins.models import (
    InsPolicy,
    InsClaim,
    InsSurvey,
    InsReinsuranceTreaty,
)

router = APIRouter(prefix="/ins", tags=["Insurance ERP"])

# Pydantic Schemas
class PolicyCreate(BaseModel):
    policy_number: str
    line_of_business: str = "motor_comprehensive"
    policyholder_name: str
    sum_insured_egp: float
    annual_premium_egp: float
    deductible_egp: float = 2000.0
    start_date: str
    end_date: str
    status: str = "active"

class ClaimCreate(BaseModel):
    policy_id: str
    claim_ref: str
    claimant_name: str
    loss_date: str
    reported_date: str
    estimated_loss_egp: float
    approved_amount_egp: float = 0.0
    surveyor_name: str
    status: str = "reported"

class SurveyCreate(BaseModel):
    claim_id: str
    survey_ref: str
    surveyor_name: str
    inspected_item: str
    damage_description: str
    estimated_repair_egp: float
    subrogation_recommended: bool = False
    survey_date: str

class TreatyCreate(BaseModel):
    treaty_code: str
    reinsurer_name: str
    treaty_type: str = "quota_share"
    retention_limit_egp: float
    cession_percentage: float = 40.0
    status: str = "active"

# Endpoints
@router.get("/summary")
async def get_ins_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_policies = await db.execute(select(InsPolicy).where(InsPolicy.tenant_id == tenant_id))
    policies = q_policies.scalars().all()
    active_policies = sum(1 for p in policies if p.status == "active")
    total_gwp = sum(p.annual_premium_egp for p in policies)

    q_claims = await db.execute(select(InsClaim).where(InsClaim.tenant_id == tenant_id))
    claims = q_claims.scalars().all()
    total_paid = sum(c.approved_amount_egp for c in claims if c.status == "settled")
    open_claims = sum(1 for c in claims if c.status not in ["settled", "rejected"])
    loss_ratio = round((total_paid / total_gwp * 100), 1) if total_gwp > 0 else 0.0

    q_treaties = await db.execute(select(InsReinsuranceTreaty).where(InsReinsuranceTreaty.tenant_id == tenant_id))
    treaties = q_treaties.scalars().all()

    return {
        "active_policies_count": active_policies,
        "total_gross_written_premium_egp": round(total_gwp, 2),
        "total_claims_paid_egp": round(total_paid, 2),
        "open_claims_count": open_claims,
        "claims_loss_ratio_pct": loss_ratio,
        "reinsurance_treaties_count": len(treaties)
    }

@router.get("/policies")
async def list_policies(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(InsPolicy).where(InsPolicy.tenant_id == tenant_id).order_by(InsPolicy.created_at.desc()))
    return q.scalars().all()

@router.post("/policies")
async def create_policy(
    payload: PolicyCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    policy = InsPolicy(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        policy_number=payload.policy_number,
        line_of_business=payload.line_of_business,
        policyholder_name=payload.policyholder_name,
        sum_insured_egp=payload.sum_insured_egp,
        annual_premium_egp=payload.annual_premium_egp,
        deductible_egp=payload.deductible_egp,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status
    )
    db.add(policy)
    await db.commit()
    return policy

@router.get("/claims")
async def list_claims(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(InsClaim).where(InsClaim.tenant_id == tenant_id).order_by(InsClaim.created_at.desc()))
    claims = q.scalars().all()
    results = []
    for c in claims:
        qp = await db.execute(select(InsPolicy).where(InsPolicy.id == c.policy_id))
        pol = qp.scalar_one_or_none()
        results.append({
            "id": c.id,
            "policy_id": c.policy_id,
            "policy_number": pol.policy_number if pol else "Unknown Policy",
            "line_of_business": pol.line_of_business if pol else "motor_comprehensive",
            "claim_ref": c.claim_ref,
            "claimant_name": c.claimant_name,
            "loss_date": c.loss_date,
            "reported_date": c.reported_date,
            "estimated_loss_egp": c.estimated_loss_egp,
            "approved_amount_egp": c.approved_amount_egp,
            "surveyor_name": c.surveyor_name,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return results

@router.post("/claims")
async def create_claim(
    payload: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    claim = InsClaim(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        policy_id=payload.policy_id,
        claim_ref=payload.claim_ref,
        claimant_name=payload.claimant_name,
        loss_date=payload.loss_date,
        reported_date=payload.reported_date,
        estimated_loss_egp=payload.estimated_loss_egp,
        approved_amount_egp=payload.approved_amount_egp,
        surveyor_name=payload.surveyor_name,
        status=payload.status
    )
    db.add(claim)
    await db.commit()
    return claim

@router.get("/surveys")
async def list_surveys(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(InsSurvey).where(InsSurvey.tenant_id == tenant_id))
    surveys = q.scalars().all()
    results = []
    for s in surveys:
        qc = await db.execute(select(InsClaim).where(InsClaim.id == s.claim_id))
        claim = qc.scalar_one_or_none()
        results.append({
            "id": s.id,
            "claim_id": s.claim_id,
            "claim_ref": claim.claim_ref if claim else "Unknown Claim",
            "survey_ref": s.survey_ref,
            "surveyor_name": s.surveyor_name,
            "inspected_item": s.inspected_item,
            "damage_description": s.damage_description,
            "estimated_repair_egp": s.estimated_repair_egp,
            "subrogation_recommended": s.subrogation_recommended,
            "survey_date": s.survey_date
        })
    return results

@router.post("/surveys")
async def create_survey(
    payload: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    survey = InsSurvey(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        claim_id=payload.claim_id,
        survey_ref=payload.survey_ref,
        surveyor_name=payload.surveyor_name,
        inspected_item=payload.inspected_item,
        damage_description=payload.damage_description,
        estimated_repair_egp=payload.estimated_repair_egp,
        subrogation_recommended=payload.subrogation_recommended,
        survey_date=payload.survey_date
    )
    db.add(survey)
    await db.commit()
    return survey

@router.get("/treaties")
async def list_treaties(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(InsReinsuranceTreaty).where(InsReinsuranceTreaty.tenant_id == tenant_id).order_by(InsReinsuranceTreaty.created_at.desc()))
    return q.scalars().all()

@router.post("/treaties")
async def create_treaty(
    payload: TreatyCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    treaty = InsReinsuranceTreaty(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        treaty_code=payload.treaty_code,
        reinsurer_name=payload.reinsurer_name,
        treaty_type=payload.treaty_type,
        retention_limit_egp=payload.retention_limit_egp,
        cession_percentage=payload.cession_percentage,
        status=payload.status
    )
    db.add(treaty)
    await db.commit()
    return treaty

@router.post("/seed")
async def seed_ins_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Insurance ERP."""
    q_existing = await db.execute(select(InsPolicy).where(InsPolicy.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Insurance module already seeded"}

    pol1_id = str(uuid.uuid4())
    pol2_id = str(uuid.uuid4())
    policies = [
        InsPolicy(
            id=pol1_id,
            tenant_id=tenant_id,
            policy_number="POL-MTR-2026-0812",
            line_of_business="motor_comprehensive",
            policyholder_name="شركة النور للخدمات اللوجستية والنقل المبرد",
            sum_insured_egp=12500000.0,
            annual_premium_egp=375000.0,
            deductible_egp=5000.0,
            start_date="2026-01-01",
            end_date="2026-12-31",
            status="active"
        ),
        InsPolicy(
            id=pol2_id,
            tenant_id=tenant_id,
            policy_number="POL-PROP-2026-0044",
            line_of_business="property_fire",
            policyholder_name="مجمع مصانع النيل للصناعات الدوائية",
            sum_insured_egp=85000000.0,
            annual_premium_egp=1250000.0,
            deductible_egp=25000.0,
            start_date="2026-01-01",
            end_date="2026-12-31",
            status="active"
        )
    ]
    for p in policies:
        db.add(p)
    await db.flush()

    # Claims
    clm_id = str(uuid.uuid4())
    claims = [
        InsClaim(
            id=clm_id,
            tenant_id=tenant_id,
            policy_id=pol1_id,
            claim_ref="CLM-2026-MTR-0041",
            claimant_name="السائق محمود عبد الرحمن",
            loss_date="2026-10-18",
            reported_date="2026-10-19",
            estimated_loss_egp=145000.0,
            approved_amount_egp=138000.0,
            surveyor_name="المهندس الاستشاري هشام فوزي (خبير معاينة حوادث)",
            status="settled"
        )
    ]
    for c in claims:
        db.add(c)
    await db.flush()

    # Surveys
    surveys = [
        InsSurvey(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            claim_id=clm_id,
            survey_ref="SRV-2026-0091",
            surveyor_name="المهندس الاستشاري هشام فوزي",
            inspected_item="شاحنة مرسيدس أكتروس 2024 - رقم لوحة (ق ص د 9142)",
            damage_description="تلفيات في الصدام الأمامي والردياتير والفانوس الأيمن إثر تصادم على طريق السويس",
            estimated_repair_egp=145000.0,
            subrogation_recommended=True,
            survey_date="2026-10-20"
        )
    ]
    for s in surveys:
        db.add(s)

    # Reinsurance Treaties
    treaties = [
        InsReinsuranceTreaty(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            treaty_code="TRT-MTR-QS-2026",
            reinsurer_name="سويس ري العالمية (Swiss Re Group)",
            treaty_type="quota_share",
            retention_limit_egp=5000000.0,
            cession_percentage=45.0,
            status="active"
        ),
        InsReinsuranceTreaty(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            treaty_code="TRT-PROP-XL-2026",
            reinsurer_name="ميونخ ري الألمانية (Munich Re)",
            treaty_type="excess_of_loss",
            retention_limit_egp=20000000.0,
            cession_percentage=80.0,
            status="active"
        )
    ]
    for tr in treaties:
        db.add(tr)
    await db.commit()

    return {"message": "Insurance module seeded successfully"}
