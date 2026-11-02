"""API Router for Gym & Fitness Sports Club ERP module (GYM-01..10)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)
from app.modules.gym.models import (
    GymAccessLog,
    GymBodyAssessment,
    GymGroupClass,
    GymMembership,
    GymPTPackage,
)

router = APIRouter(prefix="/gym", tags=["Gym & Fitness Club ERP"])


# Schemas
class MembershipCreate(BaseModel):
    full_name: str
    phone: str
    plan_name: str
    start_date: str
    end_date: str
    price: float
    paid_amount: float
    freeze_days_allowed: int = 30


class FreezeRequest(BaseModel):
    days: int


class TurnstileScanRequest(BaseModel):
    member_id: str
    gate_name: str = "بوابة الدخول الرئيسية"


class PTPackageCreate(BaseModel):
    member_id: str
    member_name: str
    trainer_name: str
    total_sessions: int = 12
    price_per_session: float = 250.0


class ClassCreate(BaseModel):
    class_name: str
    coach_name: str
    studio_room: str
    schedule_time: str
    max_capacity: int = 20


class AssessmentCreate(BaseModel):
    member_id: str
    member_name: str
    assessment_date: str
    weight_kg: float
    body_fat_percent: float
    muscle_mass_kg: float
    bmi: float
    coach_notes: str = ""


@router.get("/summary")
async def get_gym_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Gym & Fitness Club."""
    q_mem = await db.execute(select(GymMembership).where(GymMembership.tenant_id == tenant_id))
    members = q_mem.scalars().all()

    q_logs = await db.execute(select(GymAccessLog).where(GymAccessLog.tenant_id == tenant_id))
    logs = q_logs.scalars().all()

    q_pt = await db.execute(select(GymPTPackage).where(GymPTPackage.tenant_id == tenant_id))
    pt_packs = q_pt.scalars().all()

    q_classes = await db.execute(select(GymGroupClass).where(GymGroupClass.tenant_id == tenant_id))
    classes = q_classes.scalars().all()

    active_members = sum(1 for m in members if m.status == "active")
    frozen_members = sum(1 for m in members if m.status == "frozen")
    expired_members = sum(1 for m in members if m.status == "expired")

    today_access = len(logs)
    active_pt = sum(1 for p in pt_packs if p.status == "active")

    return {
        "active_members_count": active_members,
        "frozen_members_count": frozen_members,
        "expired_members_count": expired_members,
        "total_members_count": len(members),
        "today_turnstile_scans": today_access,
        "active_pt_packages_count": active_pt,
        "classes_scheduled_count": len(classes),
    }


@router.get("/memberships")
async def list_memberships(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymMembership).where(GymMembership.tenant_id == tenant_id).order_by(GymMembership.created_at.desc())
    )
    return q.scalars().all()


@router.post("/memberships")
async def create_membership(
    payload: MembershipCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    code = f"GYM-MBR-{uuid.uuid4().hex[:5].upper()}"
    mem = GymMembership(
        tenant_id=tenant_id,
        member_code=code,
        full_name=payload.full_name,
        phone=payload.phone,
        plan_name=payload.plan_name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        price=payload.price,
        paid_amount=payload.paid_amount,
        status="active",
        freeze_days_allowed=payload.freeze_days_allowed,
        freeze_days_used=0,
    )
    db.add(mem)
    await db.commit()
    await db.refresh(mem)
    return mem


@router.post("/memberships/{mem_id}/freeze")
async def freeze_membership(
    mem_id: str,
    payload: FreezeRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymMembership).where(GymMembership.id == mem_id, GymMembership.tenant_id == tenant_id)
    )
    mem = q.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="العضوية غير موجودة")
    if mem.freeze_days_used + payload.days > mem.freeze_days_allowed:
        raise HTTPException(status_code=400, detail="تم تجاوز الحد المسموح به لأيام التجميد السنوي")

    mem.status = "frozen"
    mem.freeze_days_used += payload.days
    await db.commit()
    await db.refresh(mem)
    return mem


@router.post("/memberships/{mem_id}/unfreeze")
async def unfreeze_membership(
    mem_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymMembership).where(GymMembership.id == mem_id, GymMembership.tenant_id == tenant_id)
    )
    mem = q.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="العضوية غير موجودة")
    mem.status = "active"
    await db.commit()
    await db.refresh(mem)
    return mem


@router.get("/access-logs")
async def list_access_logs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymAccessLog).where(GymAccessLog.tenant_id == tenant_id).order_by(GymAccessLog.created_at.desc())
    )
    return q.scalars().all()


@router.post("/access-logs/scan")
async def simulate_turnstile_scan(
    payload: TurnstileScanRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q_mem = await db.execute(
        select(GymMembership).where(GymMembership.id == payload.member_id, GymMembership.tenant_id == tenant_id)
    )
    mem = q_mem.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="كود العضوية غير صحيح")

    if mem.status == "active":
        result = "granted"
        reason = "عضوية سارية - مصرح بالدخول"
    elif mem.status == "frozen":
        result = "denied_frozen"
        reason = "العضوية مجمدة حالياً بناء على طلب العميل"
    else:
        result = "denied_expired"
        reason = "العضوية منتهية الصلاحية - يرجى التجديد عند الاستقبال"

    log = GymAccessLog(
        tenant_id=tenant_id,
        member_id=mem.id,
        member_name=mem.full_name,
        gate_name=payload.gate_name,
        scanned_at="2026-11-02 10:45",
        access_result=result,
        reason=reason,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/pt-packages")
async def list_pt_packages(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymPTPackage).where(GymPTPackage.tenant_id == tenant_id).order_by(GymPTPackage.created_at.desc())
    )
    return q.scalars().all()


@router.post("/pt-packages")
async def create_pt_package(
    payload: PTPackageCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    total = round(payload.total_sessions * payload.price_per_session, 2)
    pack = GymPTPackage(
        tenant_id=tenant_id,
        member_id=payload.member_id,
        member_name=payload.member_name,
        trainer_name=payload.trainer_name,
        total_sessions=payload.total_sessions,
        completed_sessions=0,
        price_per_session=payload.price_per_session,
        total_price=total,
        status="active",
    )
    db.add(pack)
    await db.commit()
    await db.refresh(pack)
    return pack


@router.post("/pt-packages/{pack_id}/consume-session")
async def consume_pt_session(
    pack_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymPTPackage).where(GymPTPackage.id == pack_id, GymPTPackage.tenant_id == tenant_id)
    )
    pack = q.scalar_one_or_none()
    if not pack:
        raise HTTPException(status_code=404, detail="باقة التدريب الخاص غير موجودة")
    if pack.completed_sessions >= pack.total_sessions:
        raise HTTPException(status_code=400, detail="تم استهلاك كافة حصص الباقة التدريبية")

    pack.completed_sessions += 1
    if pack.completed_sessions >= pack.total_sessions:
        pack.status = "completed"

    await db.commit()
    await db.refresh(pack)
    return pack


@router.get("/classes")
async def list_classes(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymGroupClass).where(GymGroupClass.tenant_id == tenant_id).order_by(GymGroupClass.created_at.desc())
    )
    return q.scalars().all()


@router.post("/classes")
async def create_class(
    payload: ClassCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    c = GymGroupClass(
        tenant_id=tenant_id,
        class_name=payload.class_name,
        coach_name=payload.coach_name,
        studio_room=payload.studio_room,
        schedule_time=payload.schedule_time,
        max_capacity=payload.max_capacity,
        booked_count=0,
        status="scheduled",
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


@router.post("/classes/{class_id}/book")
async def book_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymGroupClass).where(GymGroupClass.id == class_id, GymGroupClass.tenant_id == tenant_id)
    )
    c = q.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="الحصة غير موجودة")
    if c.booked_count >= c.max_capacity:
        raise HTTPException(status_code=400, detail="اكتمل العدد بالحصة التدريبية")
    c.booked_count += 1
    await db.commit()
    await db.refresh(c)
    return c


@router.get("/assessments")
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(GymBodyAssessment).where(GymBodyAssessment.tenant_id == tenant_id).order_by(GymBodyAssessment.assessment_date.desc())
    )
    return q.scalars().all()


@router.post("/assessments")
async def create_assessment(
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    item = GymBodyAssessment(
        tenant_id=tenant_id,
        member_id=payload.member_id,
        member_name=payload.member_name,
        assessment_date=payload.assessment_date,
        weight_kg=payload.weight_kg,
        body_fat_percent=payload.body_fat_percent,
        muscle_mass_kg=payload.muscle_mass_kg,
        bmi=payload.bmi,
        coach_notes=payload.coach_notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/seed")
async def seed_gym_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed sample gym members, access turnstile logs, PT packages, and InBody tests."""
    q_mem = await db.execute(select(GymMembership).where(GymMembership.tenant_id == tenant_id))
    if q_mem.scalars().first():
        return {"message": "بيانات الجيم والأنشطة الرياضية مسجلة مسبقاً"}

    # Seed Memberships
    m1 = GymMembership(
        tenant_id=tenant_id,
        member_code="GYM-MBR-901",
        full_name="كابتن / عمر عادل سالم",
        phone="01099887766",
        plan_name="العضوية الذهبية السنوية (Gold VIP)",
        start_date="2026-01-01",
        end_date="2026-12-31",
        price=7500.0,
        paid_amount=7500.0,
        status="active",
        freeze_days_allowed=45,
        freeze_days_used=10,
    )
    m2 = GymMembership(
        tenant_id=tenant_id,
        member_code="GYM-MBR-902",
        full_name="الدكتورة / هبة الله عبد الرحمن",
        phone="01155667788",
        plan_name="باقة 6 أشهر (اللياقة والكروس فيت)",
        start_date="2026-06-01",
        end_date="2026-11-30",
        price=4200.0,
        paid_amount=4200.0,
        status="active",
        freeze_days_allowed=20,
        freeze_days_used=0,
    )
    m3 = GymMembership(
        tenant_id=tenant_id,
        member_code="GYM-MBR-903",
        full_name="الأستاذ / سامر خيري لطفي",
        phone="01233445566",
        plan_name="باقة 3 أشهر غير أوقات الذروة (Off-Peak)",
        start_date="2026-08-01",
        end_date="2026-10-31",
        price=1800.0,
        paid_amount=1800.0,
        status="expired",
        freeze_days_allowed=15,
        freeze_days_used=5,
    )
    m4 = GymMembership(
        tenant_id=tenant_id,
        member_code="GYM-MBR-904",
        full_name="المهندس / رامي عزت رضوان",
        phone="01044332211",
        plan_name="العضوية السنوية الشاملة",
        start_date="2026-03-01",
        end_date="2027-02-28",
        price=6800.0,
        paid_amount=6800.0,
        status="frozen",
        freeze_days_allowed=30,
        freeze_days_used=14,
    )
    db.add_all([m1, m2, m3, m4])
    await db.flush()

    # Seed Access Turnstile Logs
    log1 = GymAccessLog(
        tenant_id=tenant_id,
        member_id=m1.id,
        member_name=m1.full_name,
        gate_name="بوابة الدخول الرئيسية (Turnstile A)",
        scanned_at="2026-11-02 08:30",
        access_result="granted",
        reason="عضوية سنوية VIP سارية",
    )
    log2 = GymAccessLog(
        tenant_id=tenant_id,
        member_id=m2.id,
        member_name=m2.full_name,
        gate_name="بوابة استوديو اللياقة والسبا",
        scanned_at="2026-11-02 09:15",
        access_result="granted",
        reason="اشتراك كروس فيت ساري",
    )
    log3 = GymAccessLog(
        tenant_id=tenant_id,
        member_id=m3.id,
        member_name=m3.full_name,
        gate_name="بوابة الدخول الرئيسية (Turnstile B)",
        scanned_at="2026-11-02 10:05",
        access_result="denied_expired",
        reason="تم حظر البوابة - الاشتراك انتهى بتاريخ 31-10-2026",
    )
    db.add_all([log1, log2, log3])

    # Seed PT Packages
    pt1 = GymPTPackage(
        tenant_id=tenant_id,
        member_id=m1.id,
        member_name=m1.full_name,
        trainer_name="كابتن / حازم الشريف (مدرب لياقة بدنية وبناء أجسام)",
        total_sessions=16,
        completed_sessions=10,
        price_per_session=300.0,
        total_price=4800.0,
        status="active",
    )
    pt2 = GymPTPackage(
        tenant_id=tenant_id,
        member_id=m2.id,
        member_name=m2.full_name,
        trainer_name="كابتن / دينا الجوهري (أخصائية تغذية وتمارين وظيفية)",
        total_sessions=12,
        completed_sessions=4,
        price_per_session=250.0,
        total_price=3000.0,
        status="active",
    )
    db.add_all([pt1, pt2])

    # Seed Group Classes
    c1 = GymGroupClass(
        tenant_id=tenant_id,
        class_name="حصة الدراجات الثابتة (Spinning Endurance)",
        coach_name="كابتن / مصطفى علوان",
        studio_room="استوديو الدراجات والساوند سيستم",
        schedule_time="اليوم 06:00 PM",
        max_capacity=22,
        booked_count=18,
        status="scheduled",
    )
    c2 = GymGroupClass(
        tenant_id=tenant_id,
        class_name="تمارين المقاومة الوظيفية (CrossFit WOD)",
        coach_name="كابتن / حازم الشريف",
        studio_room="الصالة المفتوحة (Outdoor Arena)",
        schedule_time="اليوم 07:30 PM",
        max_capacity=15,
        booked_count=15,
        status="scheduled",
    )
    db.add_all([c1, c2])

    # Seed InBody Biometrics
    a1 = GymBodyAssessment(
        tenant_id=tenant_id,
        member_id=m1.id,
        member_name=m1.full_name,
        assessment_date="2026-10-15",
        weight_kg=84.5,
        body_fat_percent=14.2,
        muscle_mass_kg=42.1,
        bmi=24.8,
        coach_notes="تحسن ممتاز في الكتلة العضلية بزيادة 1.8 كجم مع انخفاض نسبة الدهون بنسبة 2.5%. الحفاظ على البرنامج الحالي.",
    )
    db.add(a1)

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات الجيم وعضويات اللياقة والبوابات بنجاح"}
