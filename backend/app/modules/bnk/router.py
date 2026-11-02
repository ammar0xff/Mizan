"""API Router for Banking & Financial Institutions ERP module (BNK-01..14)."""
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

from app.modules.bnk.models import (
    BnkAccountMaster,
    BnkTransaction,
    BnkLoanApplication,
    BnkComplianceAlert,
)

router = APIRouter(prefix="/bnk", tags=["Banking & Financial Institutions ERP"])

# Pydantic Schemas
class AccountCreate(BaseModel):
    cif_number: str
    account_number: str
    customer_name: str
    account_type: str = "current"
    currency: str = "EGP"
    ledger_balance_egp: float = 0.0
    available_balance_egp: float = 0.0
    hold_amount_egp: float = 0.0
    interest_rate_pct: float = 0.0
    status: str = "active"

class TransactionCreate(BaseModel):
    account_id: str
    txn_ref: str
    amount_egp: float
    direction: str = "credit"
    channel: str = "ipn_instant"
    description: str

class LoanApplicationCreate(BaseModel):
    loan_ref: str
    applicant_name: str
    applicant_national_id: str
    loan_type: str = "sme_working_capital"
    principal_amount_egp: float
    interest_rate_pct: float = 18.5
    tenor_months: int = 24
    monthly_installment_egp: float = 0.0
    i_score_rating: int = 720
    ecl_stage: str = "stage_1_performing"
    status: str = "approved"

class AlertCreate(BaseModel):
    account_id: str
    alert_ref: str
    rule_name: str
    transaction_amount_egp: float
    risk_level: str = "high"
    sar_filed: bool = False
    status: str = "open"

# Endpoints
@router.get("/summary")
async def get_bnk_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_accounts = await db.execute(select(BnkAccountMaster).where(BnkAccountMaster.tenant_id == tenant_id))
    accounts = q_accounts.scalars().all()
    total_deposits = sum(a.ledger_balance_egp for a in accounts)

    q_loans = await db.execute(select(BnkLoanApplication).where(BnkLoanApplication.tenant_id == tenant_id))
    loans = q_loans.scalars().all()
    total_loans = sum(l.principal_amount_egp for l in loans if l.status in ["approved", "disbursed"])

    q_alerts = await db.execute(select(BnkComplianceAlert).where(BnkComplianceAlert.tenant_id == tenant_id, BnkComplianceAlert.status == "open"))
    open_alerts = len(q_alerts.scalars().all())

    return {
        "total_accounts_count": len(accounts),
        "total_deposits_egp": round(total_deposits, 2),
        "total_loans_disbursed_egp": round(total_loans, 2),
        "active_loans_count": len(loans),
        "open_aml_alerts_count": open_alerts,
        "capital_adequacy_ratio_pct": 19.4
    }

@router.get("/accounts")
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(BnkAccountMaster).where(BnkAccountMaster.tenant_id == tenant_id).order_by(BnkAccountMaster.created_at.desc()))
    return q.scalars().all()

@router.post("/accounts")
async def create_account(
    payload: AccountCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    acc = BnkAccountMaster(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        cif_number=payload.cif_number,
        account_number=payload.account_number,
        customer_name=payload.customer_name,
        account_type=payload.account_type,
        currency=payload.currency,
        ledger_balance_egp=payload.ledger_balance_egp,
        available_balance_egp=payload.available_balance_egp if payload.available_balance_egp > 0 else payload.ledger_balance_egp - payload.hold_amount_egp,
        hold_amount_egp=payload.hold_amount_egp,
        interest_rate_pct=payload.interest_rate_pct,
        status=payload.status
    )
    db.add(acc)
    await db.commit()
    return acc

@router.get("/transactions")
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(BnkTransaction).where(BnkTransaction.tenant_id == tenant_id).order_by(BnkTransaction.timestamp.desc()))
    txns = q.scalars().all()
    results = []
    for t in txns:
        qa = await db.execute(select(BnkAccountMaster).where(BnkAccountMaster.id == t.account_id))
        acc = qa.scalar_one_or_none()
        results.append({
            "id": t.id,
            "account_id": t.account_id,
            "account_number": acc.account_number if acc else "Unknown",
            "customer_name": acc.customer_name if acc else "Unknown Customer",
            "txn_ref": t.txn_ref,
            "amount_egp": t.amount_egp,
            "direction": t.direction,
            "channel": t.channel,
            "description": t.description,
            "balance_after_egp": t.balance_after_egp,
            "timestamp": t.timestamp
        })
    return results

@router.post("/transactions")
async def create_transaction(
    payload: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    qa = await db.execute(select(BnkAccountMaster).where(BnkAccountMaster.id == payload.account_id, BnkAccountMaster.tenant_id == tenant_id))
    acc = qa.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    if payload.direction == "debit":
        if acc.available_balance_egp < payload.amount_egp:
            raise HTTPException(status_code=400, detail="Insufficient available balance")
        acc.ledger_balance_egp -= payload.amount_egp
        acc.available_balance_egp -= payload.amount_egp
    else:
        acc.ledger_balance_egp += payload.amount_egp
        acc.available_balance_egp += payload.amount_egp

    txn = BnkTransaction(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        account_id=payload.account_id,
        txn_ref=payload.txn_ref,
        amount_egp=payload.amount_egp,
        direction=payload.direction,
        channel=payload.channel,
        description=payload.description,
        balance_after_egp=acc.available_balance_egp,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(txn)
    await db.commit()
    return txn

@router.get("/loans")
async def list_loans(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(BnkLoanApplication).where(BnkLoanApplication.tenant_id == tenant_id).order_by(BnkLoanApplication.created_at.desc()))
    return q.scalars().all()

@router.post("/loans")
async def create_loan(
    payload: LoanApplicationCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    installment = payload.monthly_installment_egp
    if installment == 0:
        # Approximate monthly installment
        total_repayable = payload.principal_amount_egp * (1 + (payload.interest_rate_pct / 100) * (payload.tenor_months / 12))
        installment = round(total_repayable / payload.tenor_months, 2)

    loan = BnkLoanApplication(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        loan_ref=payload.loan_ref,
        applicant_name=payload.applicant_name,
        applicant_national_id=payload.applicant_national_id,
        loan_type=payload.loan_type,
        principal_amount_egp=payload.principal_amount_egp,
        interest_rate_pct=payload.interest_rate_pct,
        tenor_months=payload.tenor_months,
        monthly_installment_egp=installment,
        i_score_rating=payload.i_score_rating,
        ecl_stage=payload.ecl_stage,
        status=payload.status
    )
    db.add(loan)
    await db.commit()
    return loan

@router.get("/alerts")
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(BnkComplianceAlert).where(BnkComplianceAlert.tenant_id == tenant_id).order_by(BnkComplianceAlert.created_at.desc()))
    alerts = q.scalars().all()
    results = []
    for al in alerts:
        qa = await db.execute(select(BnkAccountMaster).where(BnkAccountMaster.id == al.account_id))
        acc = qa.scalar_one_or_none()
        results.append({
            "id": al.id,
            "account_id": al.account_id,
            "account_number": acc.account_number if acc else "Unknown",
            "customer_name": acc.customer_name if acc else "Customer",
            "alert_ref": al.alert_ref,
            "rule_name": al.rule_name,
            "transaction_amount_egp": al.transaction_amount_egp,
            "risk_level": al.risk_level,
            "sar_filed": al.sar_filed,
            "status": al.status,
            "created_at": al.created_at.isoformat() if al.created_at else None
        })
    return results

@router.post("/alerts")
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    alert = BnkComplianceAlert(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        account_id=payload.account_id,
        alert_ref=payload.alert_ref,
        rule_name=payload.rule_name,
        transaction_amount_egp=payload.transaction_amount_egp,
        risk_level=payload.risk_level,
        sar_filed=payload.sar_filed,
        status=payload.status
    )
    db.add(alert)
    await db.commit()
    return alert

@router.post("/seed")
async def seed_bnk_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Banking ERP."""
    q_existing = await db.execute(select(BnkAccountMaster).where(BnkAccountMaster.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Banking module already seeded"}

    a1_id = str(uuid.uuid4())
    a2_id = str(uuid.uuid4())
    accounts = [
        BnkAccountMaster(
            id=a1_id,
            tenant_id=tenant_id,
            cif_number="CIF-100842",
            account_number="EG29000200010000049281",
            customer_name="مجموعة السويدي للصناعات الهندسية والكابلات",
            account_type="corporate_checking",
            currency="EGP",
            ledger_balance_egp=48500000.0,
            available_balance_egp=47500000.0,
            hold_amount_egp=1000000.0,
            interest_rate_pct=14.5,
            status="active"
        ),
        BnkAccountMaster(
            id=a2_id,
            tenant_id=tenant_id,
            cif_number="CIF-100915",
            account_number="EG91000400020000088194",
            customer_name="الدكتورة نورهان طارق المنشاوي",
            account_type="savings",
            currency="EGP",
            ledger_balance_egp=3420000.0,
            available_balance_egp=3420000.0,
            hold_amount_egp=0.0,
            interest_rate_pct=18.0,
            status="active"
        )
    ]
    for acc in accounts:
        db.add(acc)
    await db.flush()

    # Transactions
    txns = [
        BnkTransaction(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            account_id=a1_id,
            txn_ref="TXN-IPN-2026-9041",
            amount_egp=2500000.0,
            direction="credit",
            channel="ipn_instant",
            description="تحويل لحظي شبكة المدفوعات اللحظية IPN - توريدات عقود كهرباء",
            balance_after_egp=47500000.0,
            timestamp="2026-11-01 10:45:22"
        ),
        BnkTransaction(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            account_id=a1_id,
            txn_ref="TXN-ACH-2026-3310",
            amount_egp=450000.0,
            direction="debit",
            channel="ach_clearing",
            description="مقاصة شيكات غرفة المقاصة المركزية ACH لصالح مقاول باطن",
            balance_after_egp=47050000.0,
            timestamp="2026-11-01 12:15:00"
        )
    ]
    for t in txns:
        db.add(t)

    # Loan Applications
    loans = [
        BnkLoanApplication(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            loan_ref="LN-SME-2026-0038",
            applicant_name="الشركة المصرية لتوزيع الأجهزة الطبية",
            applicant_national_id="10094829104",
            loan_type="sme_working_capital",
            principal_amount_egp=8500000.0,
            interest_rate_pct=16.5,
            tenor_months=36,
            monthly_installment_egp=301250.0,
            i_score_rating=780,
            ecl_stage="stage_1_performing",
            status="disbursed"
        )
    ]
    for l in loans:
        db.add(l)

    # AML Alert
    alert = BnkComplianceAlert(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        account_id=a1_id,
        alert_ref="AML-2026-R09",
        rule_name="التحويلات السريعة متكررة القيمة (Rapid Structuring Monitoring)",
        transaction_amount_egp=2500000.0,
        risk_level="high",
        sar_filed=False,
        status="under_investigation"
    )
    db.add(alert)
    await db.commit()

    return {"message": "Banking module seeded successfully"}
