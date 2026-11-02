"""API Router for Law Firm & Legal Practice ERP module (LAW-01..09)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)
from app.modules.law.models import (
    LawCase,
    LawConflictCheck,
    LawHearing,
    LawTimeEntry,
    LawTrustTransaction,
)

router = APIRouter(prefix="/law", tags=["Law Firm & Legal ERP"])


# Schemas
class CaseCreate(BaseModel):
    case_number: str
    client_name: str
    case_title: str
    case_type: str
    court_jurisdiction: str
    circuit_number: str
    opposing_party: str
    opposing_counsel: str
    assigned_partner: str
    filing_date: str
    claim_amount: float = 0.0


class CaseStatusUpdate(BaseModel):
    status: str


class HearingCreate(BaseModel):
    case_id: str
    case_number: str
    hearing_date: str
    court_room: str
    hearing_stage: str
    required_action: str


class HearingOutcomeUpdate(BaseModel):
    outcome_summary: str
    next_hearing_date: str = ""
    appeal_deadline: str = ""


class TimeEntryCreate(BaseModel):
    case_id: str
    case_number: str
    lawyer_name: str
    lawyer_role: str
    work_date: str
    hours: float
    hourly_rate: float
    activity_type: str
    description: str


class TrustTransactionCreate(BaseModel):
    account_number: str
    case_id: str
    client_name: str
    transaction_type: str  # deposit, disbursement, settlement
    amount: float
    payment_reference: str
    description: str


class ConflictCheckCreate(BaseModel):
    search_query: str


@router.get("/summary")
async def get_law_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Law Firm operations."""
    q_cases = await db.execute(select(LawCase).where(LawCase.tenant_id == tenant_id))
    cases = q_cases.scalars().all()

    q_hearings = await db.execute(select(LawHearing).where(LawHearing.tenant_id == tenant_id))
    hearings = q_hearings.scalars().all()

    q_time = await db.execute(select(LawTimeEntry).where(LawTimeEntry.tenant_id == tenant_id))
    time_entries = q_time.scalars().all()

    q_trust = await db.execute(select(LawTrustTransaction).where(LawTrustTransaction.tenant_id == tenant_id))
    trust_txs = q_trust.scalars().all()

    active_cases = sum(1 for c in cases if c.status in ("active", "in_court"))
    total_unbilled_hours = sum(t.hours for t in time_entries if not t.is_billed)
    unbilled_value = sum(t.total_amount for t in time_entries if not t.is_billed)

    latest_balance = trust_txs[-1].running_balance if trust_txs else 0.0

    return {
        "active_cases_count": active_cases,
        "total_cases_count": len(cases),
        "upcoming_hearings_count": len(hearings),
        "unbilled_hours_total": total_unbilled_hours,
        "unbilled_fees_amount": unbilled_value,
        "client_trust_balance": latest_balance,
    }


@router.get("/cases")
async def list_cases(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawCase).where(LawCase.tenant_id == tenant_id).order_by(LawCase.created_at.desc())
    )
    return q.scalars().all()


@router.post("/cases")
async def create_case(
    payload: CaseCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    item = LawCase(
        tenant_id=tenant_id,
        case_number=payload.case_number,
        client_name=payload.client_name,
        case_title=payload.case_title,
        case_type=payload.case_type,
        court_jurisdiction=payload.court_jurisdiction,
        circuit_number=payload.circuit_number,
        opposing_party=payload.opposing_party,
        opposing_counsel=payload.opposing_counsel,
        assigned_partner=payload.assigned_partner,
        filing_date=payload.filing_date,
        claim_amount=payload.claim_amount,
        status="active",
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/cases/{case_id}/status")
async def update_case_status(
    case_id: str,
    payload: CaseStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(LawCase).where(LawCase.id == case_id, LawCase.tenant_id == tenant_id))
    c = q.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="القضية غير موجودة")
    c.status = payload.status
    await db.commit()
    await db.refresh(c)
    return c


@router.get("/hearings")
async def list_hearings(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawHearing).where(LawHearing.tenant_id == tenant_id).order_by(LawHearing.hearing_date.asc())
    )
    return q.scalars().all()


@router.post("/hearings")
async def create_hearing(
    payload: HearingCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    hearing = LawHearing(
        tenant_id=tenant_id,
        case_id=payload.case_id,
        case_number=payload.case_number,
        hearing_date=payload.hearing_date,
        court_room=payload.court_room,
        hearing_stage=payload.hearing_stage,
        required_action=payload.required_action,
        outcome_summary="بانتظار انعقاد الجلسة",
    )
    db.add(hearing)
    await db.commit()
    await db.refresh(hearing)
    return hearing


@router.post("/hearings/{hearing_id}/outcome")
async def record_hearing_outcome(
    hearing_id: str,
    payload: HearingOutcomeUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawHearing).where(LawHearing.id == hearing_id, LawHearing.tenant_id == tenant_id)
    )
    h = q.scalar_one_or_none()
    if not h:
        raise HTTPException(status_code=404, detail="جلسة المحكمة غير مسجلة")
    h.outcome_summary = payload.outcome_summary
    h.next_hearing_date = payload.next_hearing_date
    h.appeal_deadline = payload.appeal_deadline
    await db.commit()
    await db.refresh(h)
    return h


@router.get("/time-entries")
async def list_time_entries(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawTimeEntry).where(LawTimeEntry.tenant_id == tenant_id).order_by(LawTimeEntry.work_date.desc())
    )
    return q.scalars().all()


@router.post("/time-entries")
async def create_time_entry(
    payload: TimeEntryCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    total = round(payload.hours * payload.hourly_rate, 2)
    entry = LawTimeEntry(
        tenant_id=tenant_id,
        case_id=payload.case_id,
        case_number=payload.case_number,
        lawyer_name=payload.lawyer_name,
        lawyer_role=payload.lawyer_role,
        work_date=payload.work_date,
        hours=payload.hours,
        hourly_rate=payload.hourly_rate,
        total_amount=total,
        activity_type=payload.activity_type,
        description=payload.description,
        is_billed=False,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/time-entries/{entry_id}/bill")
async def bill_time_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawTimeEntry).where(LawTimeEntry.id == entry_id, LawTimeEntry.tenant_id == tenant_id)
    )
    entry = q.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="السجل الزمني غير موجود")
    entry.is_billed = True
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/trust-transactions")
async def list_trust_transactions(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawTrustTransaction).where(LawTrustTransaction.tenant_id == tenant_id).order_by(LawTrustTransaction.created_at.asc())
    )
    return q.scalars().all()


@router.post("/trust-transactions")
async def create_trust_transaction(
    payload: TrustTransactionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q_prev = await db.execute(
        select(LawTrustTransaction).where(LawTrustTransaction.tenant_id == tenant_id).order_by(LawTrustTransaction.created_at.desc())
    )
    prev = q_prev.scalars().first()
    prev_bal = prev.running_balance if prev else 0.0

    if payload.transaction_type in ("deposit", "إيداع أمانة"):
        new_bal = prev_bal + payload.amount
    else:
        new_bal = prev_bal - payload.amount

    tx = LawTrustTransaction(
        tenant_id=tenant_id,
        account_number=payload.account_number,
        case_id=payload.case_id,
        client_name=payload.client_name,
        transaction_type=payload.transaction_type,
        amount=payload.amount,
        running_balance=new_bal,
        payment_reference=payload.payment_reference,
        description=payload.description,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@router.get("/conflict-checks")
async def list_conflict_checks(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(LawConflictCheck).where(LawConflictCheck.tenant_id == tenant_id).order_by(LawConflictCheck.created_at.desc())
    )
    return q.scalars().all()


@router.post("/conflict-checks")
async def run_conflict_check(
    payload: ConflictCheckCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Scan past & active cases for opposing party/client collisions."""
    keyword = f"%{payload.search_query}%"
    q_match = await db.execute(
        select(LawCase).where(
            LawCase.tenant_id == tenant_id,
            or_(
                LawCase.client_name.ilike(keyword),
                LawCase.opposing_party.ilike(keyword),
                LawCase.opposing_counsel.ilike(keyword),
            ),
        )
    )
    matches = q_match.scalars().all()

    if matches:
        flagged = ", ".join([f"{m.case_number} ({m.client_name} ضد {m.opposing_party})" for m in matches])
        check = LawConflictCheck(
            tenant_id=tenant_id,
            search_query=payload.search_query,
            searched_by=current_user.full_name or current_user.username,
            conflict_found=True,
            flagged_matters=flagged,
            clearance_status="flagged_conflict",
            notes=f"تم رصد تطابق مع {len(matches)} ملفات قضائية جارية أو سابقة بالمكتب.",
        )
    else:
        check = LawConflictCheck(
            tenant_id=tenant_id,
            search_query=payload.search_query,
            searched_by=current_user.full_name or current_user.username,
            conflict_found=False,
            flagged_matters="لا يوجد تعارض مصالح مسجل",
            clearance_status="cleared",
            notes="تم التحقق من كافة أطراف الخصومة وسجل الموكلين بنجاح دون رصد تعارض.",
        )

    db.add(check)
    await db.commit()
    await db.refresh(check)
    return check


@router.post("/seed")
async def seed_law_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed initial sample cases, court hearings, billable time, and trust accounting."""
    q_cases = await db.execute(select(LawCase).where(LawCase.tenant_id == tenant_id))
    if q_cases.scalars().first():
        return {"message": "بيانات مكتب المحاماة مسجلة مسبقاً"}

    # Seed Cases
    c1 = LawCase(
        tenant_id=tenant_id,
        case_number="894 / 2026 ق استئناف القاهرة",
        client_name="شركة الدلتا للصناعات الهندسية ش.م.م",
        case_title="بطلان حكم تحكيم تجاري في عقد توريد خطوط إنتاج صناعية",
        case_type="تحكيم وتنازع تجاري",
        court_jurisdiction="محكمة استئناف القاهرة الاقتصادية",
        circuit_number="الدائرة السابعة استئناف تجاري",
        opposing_party="مجموعة فورتونا الدولية للمقاولات المحدودة",
        opposing_counsel="مكتب د. كمال منصور للمحاماة والاستشارات",
        assigned_partner="المستشار / عصام الشريف (شريك نقض)",
        filing_date="2026-02-15",
        claim_amount=14500000.0,
        status="in_court",
    )
    c2 = LawCase(
        tenant_id=tenant_id,
        case_number="1240 / 2026 عمالي كلي الجيزة",
        client_name="المصرية لخدمات التكنولوجيا المالية (فينتك)",
        case_title="نزاع عمالي جماعي ومطالبة بمكافآت نهاية الخدمة والتعويضات",
        case_type="قضايا العمل والتأمينات",
        court_jurisdiction="محكمة جنوب الجيزة الابتدائية",
        circuit_number="الدائرة الثالثة عمالي كلي",
        opposing_party="رابطة مهندسي البرمجيات السابقين",
        opposing_counsel="الأستاذ / سامح الجمل المحامي بالاستئناف",
        assigned_partner="الأستاذة / نيفين الألفي (شريك استئناف)",
        filing_date="2026-06-10",
        claim_amount=2800000.0,
        status="active",
    )
    c3 = LawCase(
        tenant_id=tenant_id,
        case_number="315 / 2026 جنح اقتصادية الشيخ زايد",
        client_name="مؤسسة النور للإعلام والنشر الرقمي",
        case_title="التعدي على حقوق الملكية الفكرية والعلامة التجارية المسجلة",
        case_type="حماية الملكية الفكرية",
        court_jurisdiction="محكمة القاهرة الاقتصادية",
        circuit_number="الدائرة الأولى جنح مستأنف اقتصادية",
        opposing_party="منصة المحتوى المفتوح الإلكترونية",
        opposing_counsel="مكتب النزاهة القانونية للشركات",
        assigned_partner="المستشار / عصام الشريف (شريك نقض)",
        filing_date="2026-09-01",
        claim_amount=4200000.0,
        status="judgment_rendered",
    )
    db.add_all([c1, c2, c3])
    await db.flush()

    # Seed Hearings
    h1 = LawHearing(
        tenant_id=tenant_id,
        case_id=c1.id,
        case_number=c1.case_number,
        hearing_date="2026-11-08",
        court_room="القاعة 4 - الدور الثالث بمجمع محاكم العباسية",
        hearing_stage="سماع المرافعة الختامية وتقديم المذكرات ومستندات الإيداع",
        required_action="إيداع حافظة مستندات مترجمة معتمدة وإبداء الدفوع الشكلية للبطلان",
        outcome_summary="بانتظار انعقاد الجلسة المحددة",
        next_hearing_date="2026-12-14",
        appeal_deadline="",
    )
    h2 = LawHearing(
        tenant_id=tenant_id,
        case_id=c2.id,
        case_number=c2.case_number,
        hearing_date="2026-11-15",
        court_room="قاعة 2 عمالي - محكمة تاج الدول",
        hearing_stage="ورود تقرير الخبير الحسابي المندوب من وزارة العدل",
        required_action="الاطلاع على تقرير الخبير وإعداد مذكرة الاعتراضات الحسابية",
        outcome_summary="بانتظار ورود التقرير الفني",
        next_hearing_date="",
        appeal_deadline="",
    )
    db.add_all([h1, h2])

    # Seed Time Entries
    t1 = LawTimeEntry(
        tenant_id=tenant_id,
        case_id=c1.id,
        case_number=c1.case_number,
        lawyer_name="المستشار / عصام الشريف",
        lawyer_role="شريك مؤسس - محامي بالنقض",
        work_date="2026-10-28",
        hours=4.5,
        hourly_rate=2500.0,
        total_amount=11250.0,
        activity_type="صياغة مذكرات البطلان والطعن",
        description="صياغة أسباب بطلان تشكيل هيئة التحكيم ومخالفة النظام العام الإجرائي",
        is_billed=False,
    )
    t2 = LawTimeEntry(
        tenant_id=tenant_id,
        case_id=c1.id,
        case_number=c1.case_number,
        lawyer_name="الأستاذ / ماجد حسني",
        lawyer_role="محامي أول بالاستئناف",
        work_date="2026-10-30",
        hours=6.0,
        hourly_rate=1200.0,
        total_amount=7200.0,
        activity_type="بحث السوابق القضائية وترجمة الدلائل",
        description="استخراج أحكام محكمة النقض الاقتصادية ذات الصلة باتفاقات التحكيم",
        is_billed=False,
    )
    t3 = LawTimeEntry(
        tenant_id=tenant_id,
        case_id=c2.id,
        case_number=c2.case_number,
        lawyer_name="الأستاذة / نيفين الألفي",
        lawyer_role="شريك استئناف ومستشار عقود",
        work_date="2026-10-25",
        hours=3.0,
        hourly_rate=1800.0,
        total_amount=5400.0,
        activity_type="جلسة مفاوضات تسوية ودية",
        description="اجتماع تفاوضي مع الممثل القانوني للموظفين لبحث حلول التسوية قبل الجلسة",
        is_billed=True,
    )
    db.add_all([t1, t2, t3])

    # Seed Client Trust Account (IOLTA)
    tr1 = LawTrustTransaction(
        tenant_id=tenant_id,
        account_number="IOLTA-CIB-2026-EGP",
        case_id=c1.id,
        client_name=c1.client_name,
        transaction_type="إيداع أمانة قضائية (Retainer)",
        amount=250000.0,
        running_balance=250000.0,
        payment_reference="DEP-CIB-991204",
        description="أمانة مقدمة من شركة الدلتا لتغطية أتعاب الخبراء ورسوم الاستئناف القضائي",
    )
    tr2 = LawTrustTransaction(
        tenant_id=tenant_id,
        account_number="IOLTA-CIB-2026-EGP",
        case_id=c1.id,
        client_name=c1.client_name,
        transaction_type="سداد رسوم قضائية وأمانة خبير (Disbursement)",
        amount=35000.0,
        running_balance=215000.0,
        payment_reference="DISB-EXP-4401",
        description="سداد أمانة خبير وزارة العدل وخزينة المحكمة بموجب قسيمة سداد رسمية",
    )
    db.add_all([tr1, tr2])

    # Seed Conflict Check
    cc1 = LawConflictCheck(
        tenant_id=tenant_id,
        search_query="مجموعة فورتونا الدولية",
        searched_by="المستشار / عصام الشريف",
        conflict_found=True,
        flagged_matters="894 / 2026 ق استئناف القاهرة (خصم في نزاع تحكيمي تجاري)",
        clearance_status="flagged_conflict",
        notes="تم رفض قبول تمثيل الكيان لمصلحة موكلنا الحالي شركة الدلتا للصناعات الهندسية.",
    )
    db.add(cc1)

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات مكاتب المحاماة والقضايا والأمانات بنجاح"}
