"""API router for Consulting & Professional Services module (CON-01..08)."""
from __future__ import annotations

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.services.models import (
    ConsultingEngagement,
    ConsultingStatutoryDeadline,
    ConsultingTimesheet,
)

router = APIRouter(prefix="", tags=["Services & Consulting Module"])


class CreateEngagementRequest(BaseModel):
    client_name: str
    project_name: str
    billing_model: str = "retainer"  # retainer, hourly, fixed_milestone
    contract_value: float
    retainer_balance: float | None = None
    hourly_rate: float = 800.0
    start_date: str
    due_date: str
    partner_in_charge: str = "د. حازم القاضي (شريك)"


class DrawdownRequest(BaseModel):
    amount: float
    description: str
    deliverable_name: str | None = None


class CreateTimesheetRequest(BaseModel):
    engagement_id: str
    engagement_name: str
    consultant_name: str
    role: str = "مستشار أول"
    date: str
    hours: float
    is_billable: bool = True
    rate: float = 800.0
    task_description: str


class CreateDeadlineRequest(BaseModel):
    client_name: str
    filing_type: str
    due_date: str
    period: str
    assigned_to: str = "أ/ شريف ممدوح"


class UpdateDeadlineStatusRequest(BaseModel):
    status: str  # pending, under_review, filed, acknowledged
    receipt_reference: str | None = None


DEFAULT_ENGAGEMENTS = [
    {
        "id": "eng-01",
        "client_name": "مجموعة الفطيم للاستثمار والتجارة",
        "project_name": "المراجعة السنوية وإعداد القوائم المالية المستقلة",
        "billing_model": "retainer",
        "contract_value": 180000.0,
        "retainer_balance": 90000.0,
        "hourly_rate": 1200.0,
        "status": "active",
        "start_date": "2026-01-01",
        "due_date": "2026-12-31",
        "partner_in_charge": "د. حازم القاضي (شريك إداري)",
    },
    {
        "id": "eng-02",
        "client_name": "شركة الأهرام للصناعات الغذائية",
        "project_name": "استشارات الفحص الضريبي ورد ضريبة القيمة المضافة",
        "billing_model": "hourly",
        "contract_value": 75000.0,
        "retainer_balance": 15000.0,  # <= 20% triggers alert!
        "hourly_rate": 950.0,
        "status": "active",
        "start_date": "2026-06-01",
        "due_date": "2026-11-30",
        "partner_in_charge": "أ/ طارق المنشاوي (شريك ضرائب)",
    },
    {
        "id": "eng-03",
        "client_name": "مكتب النور للمقاولات العامة",
        "project_name": "إعادة هيكلة الحسابات والتكلفة وربط الـ ERP",
        "billing_model": "fixed_milestone",
        "contract_value": 120000.0,
        "retainer_balance": 60000.0,
        "hourly_rate": 800.0,
        "status": "active",
        "start_date": "2026-08-15",
        "due_date": "2026-12-15",
        "partner_in_charge": "أ/ ريهام السعيد (مستشار رئيسي)",
    },
]

DEFAULT_TIMESHEETS = [
    {
        "engagement_id": "eng-01",
        "engagement_name": "مجموعة الفطيم - المراجعة السنوية",
        "consultant_name": "د. حازم القاضي",
        "role": "شريك إداري",
        "date": "2026-11-01",
        "hours": 3.5,
        "is_billable": True,
        "rate": 1200.0,
        "task_description": "جلسة مراجعة واعتماد سياسات الاضمحلال والمخصصات مع لجنة المراجعة",
        "status": "approved",
    },
    {
        "engagement_id": "eng-01",
        "engagement_name": "مجموعة الفطيم - المراجعة السنوية",
        "consultant_name": "أ/ مجدي رضوان",
        "role": "مراجع أول",
        "date": "2026-11-01",
        "hours": 6.0,
        "is_billable": True,
        "rate": 750.0,
        "task_description": "فحص عينات المصادقات البنكية وأرصدة العملاء والمدينين",
        "status": "approved",
    },
    {
        "engagement_id": "eng-02",
        "engagement_name": "الأهرام للأغذية - فحص ضريبي",
        "consultant_name": "أ/ طارق المنشاوي",
        "role": "شريك ضرائب",
        "date": "2026-11-01",
        "hours": 4.0,
        "is_billable": True,
        "rate": 950.0,
        "task_description": "حضور جلسة الفحص الميداني بمأمورية كبار الممولين لرد الضريبة",
        "status": "approved",
    },
    {
        "engagement_id": "eng-03",
        "engagement_name": "مكتب النور - إعادة هيكلة",
        "consultant_name": "أ/ سارة فتحي",
        "role": "مساعد مالي",
        "date": "2026-11-01",
        "hours": 2.0,
        "is_billable": False,
        "rate": 400.0,
        "task_description": "أرشفة المستندات الورقية وتدريب داخلي غير خاضع للفوترة",
        "status": "approved",
    },
]

DEFAULT_DEADLINES = [
    {
        "client_name": "مجموعة الفطيم للاستثمار",
        "filing_type": "إقرار ضريبة القيمة المضافة (VAT)",
        "due_date": "2026-11-15",
        "period": "أكتوبر 2026",
        "status": "under_review",
        "assigned_to": "أ/ شريف ممدوح",
        "receipt_reference": None,
    },
    {
        "client_name": "شركة الأهرام للصناعات الغذائية",
        "filing_type": "إقرار كسب العمل الشهري والتأمينات",
        "due_date": "2026-11-15",
        "period": "أكتوبر 2026",
        "status": "filed",
        "assigned_to": "أ/ هاني كمال",
        "receipt_reference": "ETA-REC-2026-9921",
    },
    {
        "client_name": "مكتب النور للمقاولات العامة",
        "filing_type": "تسوية ضريبة كسب العمل ربع السنوية",
        "due_date": "2026-11-20",
        "period": "الربع الثالث 2026",
        "status": "pending",
        "assigned_to": "أ/ ريهام السعيد",
        "receipt_reference": None,
    },
]


async def _ensure_seeded(db: AsyncSession) -> None:
    eng_res = await db.execute(select(ConsultingEngagement).limit(1))
    if eng_res.scalar_one_or_none() is None:
        for e in DEFAULT_ENGAGEMENTS:
            db.add(ConsultingEngagement(**e))
        await db.commit()

    time_res = await db.execute(select(ConsultingTimesheet).limit(1))
    if time_res.scalar_one_or_none() is None:
        for t in DEFAULT_TIMESHEETS:
            db.add(ConsultingTimesheet(**t))
        await db.commit()

    dead_res = await db.execute(select(ConsultingStatutoryDeadline).limit(1))
    if dead_res.scalar_one_or_none() is None:
        for d in DEFAULT_DEADLINES:
            db.add(ConsultingStatutoryDeadline(**d))
        await db.commit()


# ============================================================================
# Engagements & Retainers (CON-01, CON-04)
# ============================================================================

@router.get("/engagements")
async def get_engagements(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve client engagements with retainer balance and threshold warnings."""
    await _ensure_seeded(db)
    stmt = select(ConsultingEngagement).order_by(ConsultingEngagement.created_at.desc())
    res = await db.execute(stmt)
    engagements = res.scalars().all()

    out = []
    for e in engagements:
        ratio = (e.retainer_balance / e.contract_value * 100.0) if e.contract_value > 0 else 100.0
        is_low_retainer = ratio <= 20.0  # Alert if balance < 20% (CON-04)

        out.append({
            "id": e.id,
            "client_name": e.client_name,
            "project_name": e.project_name,
            "billing_model": e.billing_model,
            "contract_value": e.contract_value,
            "retainer_balance": e.retainer_balance,
            "retainer_ratio_pct": round(ratio, 1),
            "is_low_retainer": is_low_retainer,
            "hourly_rate": e.hourly_rate,
            "status": e.status,
            "start_date": e.start_date,
            "due_date": e.due_date,
            "partner_in_charge": e.partner_in_charge,
        })
    return out


@router.post("/engagements")
async def create_engagement(
    data: CreateEngagementRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Register a new client engagement letter and retainer."""
    eng = ConsultingEngagement(
        client_name=data.client_name,
        project_name=data.project_name,
        billing_model=data.billing_model,
        contract_value=data.contract_value,
        retainer_balance=data.retainer_balance if data.retainer_balance is not None else data.contract_value,
        hourly_rate=data.hourly_rate,
        status="active",
        start_date=data.start_date,
        due_date=data.due_date,
        partner_in_charge=data.partner_in_charge,
    )
    db.add(eng)
    await db.commit()
    await db.refresh(eng)
    return {"detail": f"تم إنشاء عقد «{eng.project_name}» للعميل {eng.client_name} بنجاح", "id": eng.id}


@router.post("/engagements/{engagement_id}/drawdown")
async def execute_retainer_drawdown(
    engagement_id: str,
    data: DrawdownRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    Retainer Drawdown (CON-04):
    Draw down billable deliverables or milestone from client upfront retainer balance.
    """
    stmt = select(ConsultingEngagement).where(ConsultingEngagement.id == engagement_id)
    res = await db.execute(stmt)
    eng = res.scalar_one_or_none()
    if not eng:
        raise HTTPException(status_code=404, detail="عقد الاستشارة غير موجود")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="يجب أن يكون مبلغ الاستقطاع أكبر من صفر")

    if eng.retainer_balance < data.amount:
        raise HTTPException(status_code=400, detail="رصيد الدفعة المقدمة لا يكفي، يرجى تجديد الدفعة أو إصدار فاتورة مباشرة")

    eng.retainer_balance = max(0.0, eng.retainer_balance - data.amount)
    await db.commit()
    await db.refresh(eng)

    ratio = (eng.retainer_balance / eng.contract_value * 100.0) if eng.contract_value > 0 else 0.0
    return {
        "detail": f"تم خصم مبلغ {data.amount:.2f} ج.م من رصيد مقدم أتعاب العميل {eng.client_name}",
        "engagement_id": eng.id,
        "drawn_amount": data.amount,
        "new_retainer_balance": eng.retainer_balance,
        "retainer_ratio_pct": round(ratio, 1),
        "is_low_retainer": ratio <= 20.0,
    }


# ============================================================================
# Timesheets & Billable Hours (CON-02, CON-03)
# ============================================================================

@router.get("/timesheets")
async def get_timesheets(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve consultant timesheet logs with billable/non-billable totals."""
    await _ensure_seeded(db)
    stmt = select(ConsultingTimesheet).order_by(ConsultingTimesheet.created_at.desc())
    res = await db.execute(stmt)
    sheets = res.scalars().all()

    billable_hours = sum(s.hours for s in sheets if s.is_billable)
    non_billable_hours = sum(s.hours for s in sheets if not s.is_billable)
    total_billable_value = sum((s.hours * s.rate) for s in sheets if s.is_billable)

    return {
        "total_billable_hours": billable_hours,
        "total_non_billable_hours": non_billable_hours,
        "total_billable_value": round(total_billable_value, 2),
        "sheets": [
            {
                "id": s.id,
                "engagement_id": s.engagement_id,
                "engagement_name": s.engagement_name,
                "consultant_name": s.consultant_name,
                "role": s.role,
                "date": s.date,
                "hours": s.hours,
                "is_billable": s.is_billable,
                "rate": s.rate,
                "line_value": round(s.hours * s.rate, 2),
                "task_description": s.task_description,
                "status": s.status,
            }
            for s in sheets
        ],
    }


@router.post("/timesheets")
async def create_timesheet_entry(
    data: CreateTimesheetRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Log a new consultant timesheet entry."""
    entry = ConsultingTimesheet(
        engagement_id=data.engagement_id,
        engagement_name=data.engagement_name,
        consultant_name=data.consultant_name,
        role=data.role,
        date=data.date,
        hours=data.hours,
        is_billable=data.is_billable,
        rate=data.rate,
        task_description=data.task_description,
        status="approved",
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"detail": f"تم تسجيل {entry.hours} ساعة عمل بواسطة {entry.consultant_name} بنجاح", "id": entry.id}


# ============================================================================
# Statutory Filings & Deadlines (CON-07)
# ============================================================================

@router.get("/deadlines")
async def get_statutory_deadlines(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve compliance and statutory tax filings calendar."""
    await _ensure_seeded(db)
    stmt = select(ConsultingStatutoryDeadline).order_by(ConsultingStatutoryDeadline.due_date)
    res = await db.execute(stmt)
    deadlines = res.scalars().all()

    return [
        {
            "id": d.id,
            "client_name": d.client_name,
            "filing_type": d.filing_type,
            "due_date": d.due_date,
            "period": d.period,
            "status": d.status,
            "assigned_to": d.assigned_to,
            "receipt_reference": d.receipt_reference,
        }
        for d in deadlines
    ]


@router.post("/deadlines")
async def create_statutory_deadline(
    data: CreateDeadlineRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Create a new compliance filing deadline."""
    deadline = ConsultingStatutoryDeadline(
        client_name=data.client_name,
        filing_type=data.filing_type,
        due_date=data.due_date,
        period=data.period,
        status="pending",
        assigned_to=data.assigned_to,
    )
    db.add(deadline)
    await db.commit()
    await db.refresh(deadline)
    return {"detail": f"تم إدراج استحقاق {deadline.filing_type} للعميل {deadline.client_name} بنجاح", "id": deadline.id}


@router.post("/deadlines/{deadline_id}/status")
async def update_deadline_status(
    deadline_id: str,
    data: UpdateDeadlineStatusRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Update statutory filing status (e.g. filed / acknowledged)."""
    stmt = select(ConsultingStatutoryDeadline).where(ConsultingStatutoryDeadline.id == deadline_id)
    res = await db.execute(stmt)
    deadline = res.scalar_one_or_none()
    if not deadline:
        raise HTTPException(status_code=404, detail="استحقاق غير موجود")

    deadline.status = data.status
    if data.receipt_reference:
        deadline.receipt_reference = data.receipt_reference

    await db.commit()
    await db.refresh(deadline)
    return {"detail": f"تم تحديث حالة الاستحقاق إلى {deadline.status}", "id": deadline.id}


# ============================================================================
# Summary KPIs
# ============================================================================

@router.get("/summary")
async def get_consulting_summary(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Executive metrics for accounting and consulting practices."""
    await _ensure_seeded(db)

    eng_res = await db.execute(select(ConsultingEngagement))
    engagements = eng_res.scalars().all()

    time_res = await db.execute(select(ConsultingTimesheet))
    sheets = time_res.scalars().all()

    dead_res = await db.execute(select(ConsultingStatutoryDeadline))
    deadlines = dead_res.scalars().all()

    total_contract = sum(e.contract_value for e in engagements)
    total_retainer = sum(e.retainer_balance for e in engagements)
    billable_hours = sum(s.hours for s in sheets if s.is_billable)
    billable_value = sum(s.hours * s.rate for s in sheets if s.is_billable)
    pending_deadlines = sum(1 for d in deadlines if d.status in ["pending", "under_review"])

    return {
        "total_engagements": len(engagements),
        "total_contract_value": total_contract,
        "total_retainer_balance": total_retainer,
        "total_billable_hours": billable_hours,
        "total_billable_value": round(billable_value, 2),
        "pending_deadlines_count": pending_deadlines,
    }
