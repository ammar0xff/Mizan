"""API Router for Government & Nonprofit ERP module (GOV-01..12)."""
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

from app.modules.gov.models import (
    GovFund,
    GovBudgetCommitment,
    GovBeneficiaryAid,
    GovPublicTender,
)

router = APIRouter(prefix="/gov", tags=["Government & Nonprofit ERP"])

# Pydantic Schemas
class FundCreate(BaseModel):
    fund_code: str
    fund_name: str
    fund_type: str = "temporarily_restricted"
    donor_organization: str
    allocated_budget_egp: float
    spent_amount_egp: float = 0.0

class CommitmentCreate(BaseModel):
    fund_id: str
    commitment_ref: str
    department: str
    line_item: str
    requisition_amount_egp: float
    encumbered_amount_egp: float
    status: str = "encumbered"

class AidCreate(BaseModel):
    beneficiary_national_id: str
    full_name: str
    vulnerability_score: int = 75
    aid_type: str = "cash_transfer"
    aid_value_egp: float
    family_members_count: int = 1
    distribution_date: str
    biometric_verified: bool = True
    status: str = "delivered"

class TenderCreate(BaseModel):
    tender_ref: str
    title: str
    procuring_entity: str
    estimated_budget_egp: float
    bid_bond_amount_egp: float
    closing_date: str
    status: str = "published"

# Endpoints
@router.get("/summary")
async def get_gov_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_funds = await db.execute(select(GovFund).where(GovFund.tenant_id == tenant_id))
    funds = q_funds.scalars().all()
    total_budget = sum(f.allocated_budget_egp for f in funds)
    total_spent = sum(f.spent_amount_egp for f in funds)

    q_comms = await db.execute(select(GovBudgetCommitment).where(GovBudgetCommitment.tenant_id == tenant_id, GovBudgetCommitment.status == "encumbered"))
    comms = q_comms.scalars().all()
    total_encumbered = sum(c.encumbered_amount_egp for c in comms)

    q_aids = await db.execute(select(GovBeneficiaryAid).where(GovBeneficiaryAid.tenant_id == tenant_id))
    aids = q_aids.scalars().all()

    q_tenders = await db.execute(select(GovPublicTender).where(GovPublicTender.tenant_id == tenant_id, GovPublicTender.status != "closed"))
    tenders = q_tenders.scalars().all()

    return {
        "total_funds_count": len(funds),
        "total_allocated_budget_egp": round(total_budget, 2),
        "total_spent_budget_egp": round(total_spent, 2),
        "encumbered_commitments_egp": round(total_encumbered, 2),
        "total_beneficiaries_assisted": len(aids),
        "active_tenders_count": len(tenders)
    }

@router.get("/funds")
async def list_funds(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(GovFund).where(GovFund.tenant_id == tenant_id).order_by(GovFund.created_at.desc()))
    return q.scalars().all()

@router.post("/funds")
async def create_fund(
    payload: FundCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    remaining = payload.allocated_budget_egp - payload.spent_amount_egp
    fund = GovFund(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        fund_code=payload.fund_code,
        fund_name=payload.fund_name,
        fund_type=payload.fund_type,
        donor_organization=payload.donor_organization,
        allocated_budget_egp=payload.allocated_budget_egp,
        spent_amount_egp=payload.spent_amount_egp,
        remaining_budget_egp=remaining
    )
    db.add(fund)
    await db.commit()
    return fund

@router.get("/commitments")
async def list_commitments(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(GovBudgetCommitment).where(GovBudgetCommitment.tenant_id == tenant_id).order_by(GovBudgetCommitment.created_at.desc()))
    comms = q.scalars().all()
    results = []
    for c in comms:
        qf = await db.execute(select(GovFund).where(GovFund.id == c.fund_id))
        fund = qf.scalar_one_or_none()
        results.append({
            "id": c.id,
            "fund_id": c.fund_id,
            "fund_code": fund.fund_code if fund else "Unknown",
            "fund_name": fund.fund_name if fund else "General Treasury",
            "commitment_ref": c.commitment_ref,
            "department": c.department,
            "line_item": c.line_item,
            "requisition_amount_egp": c.requisition_amount_egp,
            "encumbered_amount_egp": c.encumbered_amount_egp,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return results

@router.post("/commitments")
async def create_commitment(
    payload: CommitmentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    comm = GovBudgetCommitment(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        fund_id=payload.fund_id,
        commitment_ref=payload.commitment_ref,
        department=payload.department,
        line_item=payload.line_item,
        requisition_amount_egp=payload.requisition_amount_egp,
        encumbered_amount_egp=payload.encumbered_amount_egp,
        status=payload.status
    )
    db.add(comm)
    await db.commit()
    return comm

@router.get("/aids")
async def list_aids(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(GovBeneficiaryAid).where(GovBeneficiaryAid.tenant_id == tenant_id).order_by(GovBeneficiaryAid.distribution_date.desc()))
    return q.scalars().all()

@router.post("/aids")
async def create_aid(
    payload: AidCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    aid = GovBeneficiaryAid(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        beneficiary_national_id=payload.beneficiary_national_id,
        full_name=payload.full_name,
        vulnerability_score=payload.vulnerability_score,
        aid_type=payload.aid_type,
        aid_value_egp=payload.aid_value_egp,
        family_members_count=payload.family_members_count,
        distribution_date=payload.distribution_date,
        biometric_verified=payload.biometric_verified,
        status=payload.status
    )
    db.add(aid)
    await db.commit()
    return aid

@router.get("/tenders")
async def list_tenders(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(GovPublicTender).where(GovPublicTender.tenant_id == tenant_id).order_by(GovPublicTender.created_at.desc()))
    return q.scalars().all()

@router.post("/tenders")
async def create_tender(
    payload: TenderCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    tender = GovPublicTender(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        tender_ref=payload.tender_ref,
        title=payload.title,
        procuring_entity=payload.procuring_entity,
        estimated_budget_egp=payload.estimated_budget_egp,
        bid_bond_amount_egp=payload.bid_bond_amount_egp,
        closing_date=payload.closing_date,
        status=payload.status
    )
    db.add(tender)
    await db.commit()
    return tender

@router.post("/seed")
async def seed_gov_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Government & Nonprofit ERP."""
    q_existing = await db.execute(select(GovFund).where(GovFund.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Government module already seeded"}

    f1_id = str(uuid.uuid4())
    f2_id = str(uuid.uuid4())
    funds = [
        GovFund(
            id=f1_id,
            tenant_id=tenant_id,
            fund_code="FND-UNICEF-WASH",
            fund_name="منحة اليونيسف لدعم شبكات مياه الشرب والصرف بالقرى الأكثر احتياجاً",
            fund_type="temporarily_restricted",
            donor_organization="منظمة الأمم المتحدة للطفولة (UNICEF)",
            allocated_budget_egp=35000000.0,
            spent_amount_egp=18400000.0,
            remaining_budget_egp=16600000.0
        ),
        GovFund(
            id=f2_id,
            tenant_id=tenant_id,
            fund_code="FND-AWQAF-HEALTH",
            fund_name="وقف المرحوم عبد العزيز الشربيني لرعاية مرضى الغسيل الكلوي",
            fund_type="permanent_endowment",
            donor_organization="هيئة الأوقاف المصرية - ديوان الوقف الخيري",
            allocated_budget_egp=50000000.0,
            spent_amount_egp=12500000.0,
            remaining_budget_egp=37500000.0
        )
    ]
    for f in funds:
        db.add(f)
    await db.flush()

    # Commitments
    commitments = [
        GovBudgetCommitment(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            fund_id=f1_id,
            commitment_ref="ENC-2026-WASH-01",
            department="الإدارة الهندسية لمشروعات الصرف الصحي",
            line_item="بند 302: محابس ومواسير بولي إيثيلين عالي الكثافة (HDPE)",
            requisition_amount_egp=4500000.0,
            encumbered_amount_egp=4500000.0,
            status="encumbered"
        )
    ]
    for c in commitments:
        db.add(c)

    # Beneficiary Aids
    aids = [
        GovBeneficiaryAid(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            beneficiary_national_id="28509121401928",
            full_name="فاطمة الزهراء إبراهيم حسن",
            vulnerability_score=92,
            aid_type="cash_transfer",
            aid_value_egp=2500.0,
            family_members_count=5,
            distribution_date="2026-11-01",
            biometric_verified=True,
            status="delivered"
        ),
        GovBeneficiaryAid(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            beneficiary_national_id="27903140109284",
            full_name="صابرين مصطفى عبد العال",
            vulnerability_score=85,
            aid_type="food_carton",
            aid_value_egp=1200.0,
            family_members_count=4,
            distribution_date="2026-11-01",
            biometric_verified=True,
            status="delivered"
        )
    ]
    for a in aids:
        db.add(a)

    # Public Tenders
    tenders = [
        GovPublicTender(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            tender_ref="TND-2026-MIN-009",
            title="مناقصة عامة رقم 9 لتوريد أجهزة غسيل كلوي متطورة لمستشفيات الصعيد",
            procuring_entity="الهيئة العامة للمستشفيات والمعاهد التعليمية",
            estimated_budget_egp=28000000.0,
            bid_bond_amount_egp=560000.0,
            closing_date="2026-12-15",
            status="published"
        )
    ]
    for t in tenders:
        db.add(t)

    await db.commit()
    return {"message": "Government module seeded successfully"}
