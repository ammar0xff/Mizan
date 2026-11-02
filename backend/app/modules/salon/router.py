"""API Router for Salon, Spa & Personal Care module (SAL-01..10)."""
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
from app.modules.salon.models import (
    SalonAppointment,
    SalonBeautyFormula,
    SalonService,
    SalonStylist,
)

router = APIRouter(prefix="/salon", tags=["Salon & Spa ERP"])


# Schemas
class ServiceCreate(BaseModel):
    service_name: str
    category: str
    duration_minutes: int = 45
    buffer_turnaround_minutes: int = 15
    base_price: float
    consumable_cost: float = 50.0


class AppointmentCreate(BaseModel):
    client_name: str
    client_phone: str
    stylist_name: str
    service_name: str
    station_or_room: str
    appointment_date: str
    time_slot: str
    price: float


class AppointmentStatusUpdate(BaseModel):
    status: str
    payment_status: str = "paid"


class StylistCreate(BaseModel):
    stylist_name: str
    specialty: str
    phone: str
    commission_service_percent: float = 25.0
    commission_retail_percent: float = 10.0


class FormulaCreate(BaseModel):
    client_name: str
    client_phone: str
    stylist_name: str
    formula_date: str
    service_type: str
    formula_details: str
    sensitivity_notes: str = "تم إجراء اختبار الحساسية دون تحسس"
    stylist_notes: str = ""


@router.get("/summary")
async def get_salon_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Salon & Spa operations."""
    q_appts = await db.execute(select(SalonAppointment).where(SalonAppointment.tenant_id == tenant_id))
    appts = q_appts.scalars().all()

    q_stylists = await db.execute(select(SalonStylist).where(SalonStylist.tenant_id == tenant_id))
    stylists = q_stylists.scalars().all()

    q_services = await db.execute(select(SalonService).where(SalonService.tenant_id == tenant_id))
    services = q_services.scalars().all()

    q_formulas = await db.execute(select(SalonBeautyFormula).where(SalonBeautyFormula.tenant_id == tenant_id))
    formulas = q_formulas.scalars().all()

    today_total = len(appts)
    in_service = sum(1 for a in appts if a.status == "in_service")
    completed = sum(1 for a in appts if a.status == "completed")
    today_revenue = sum(a.price for a in appts if a.status in ("in_service", "completed"))

    return {
        "today_appointments_count": today_total,
        "in_service_now_count": in_service,
        "completed_services_count": completed,
        "active_stylists_count": len(stylists),
        "catalog_services_count": len(services),
        "recorded_formulas_count": len(formulas),
        "today_revenue_amount": today_revenue,
    }


@router.get("/services")
async def list_services(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(SalonService).where(SalonService.tenant_id == tenant_id).order_by(SalonService.category.asc())
    )
    return q.scalars().all()


@router.post("/services")
async def create_service(
    payload: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    item = SalonService(
        tenant_id=tenant_id,
        service_name=payload.service_name,
        category=payload.category,
        duration_minutes=payload.duration_minutes,
        buffer_turnaround_minutes=payload.buffer_turnaround_minutes,
        base_price=payload.base_price,
        consumable_cost=payload.consumable_cost,
        is_active=True,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/appointments")
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(SalonAppointment).where(SalonAppointment.tenant_id == tenant_id).order_by(SalonAppointment.created_at.desc())
    )
    return q.scalars().all()


@router.post("/appointments")
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"SAL-APT-{uuid.uuid4().hex[:5].upper()}"
    appt = SalonAppointment(
        tenant_id=tenant_id,
        appointment_ref=ref,
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        stylist_name=payload.stylist_name,
        service_name=payload.service_name,
        station_or_room=payload.station_or_room,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        price=payload.price,
        status="scheduled",
        payment_status="unpaid",
    )
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.post("/appointments/{appt_id}/status")
async def update_appointment_status(
    appt_id: str,
    payload: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(SalonAppointment).where(SalonAppointment.id == appt_id, SalonAppointment.tenant_id == tenant_id)
    )
    appt = q.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="الموعد غير موجود")
    appt.status = payload.status
    appt.payment_status = payload.payment_status

    if payload.status == "completed":
        q_st = await db.execute(
            select(SalonStylist).where(SalonStylist.stylist_name == appt.stylist_name, SalonStylist.tenant_id == tenant_id)
        )
        st = q_st.scalar_one_or_none()
        if st:
            st.total_services_count += 1
            st.gross_revenue_generated += appt.price

    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("/stylists")
async def list_stylists(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(SalonStylist).where(SalonStylist.tenant_id == tenant_id).order_by(SalonStylist.created_at.desc())
    )
    return q.scalars().all()


@router.post("/stylists")
async def create_stylist(
    payload: StylistCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    st = SalonStylist(
        tenant_id=tenant_id,
        stylist_name=payload.stylist_name,
        specialty=payload.specialty,
        phone=payload.phone,
        commission_service_percent=payload.commission_service_percent,
        commission_retail_percent=payload.commission_retail_percent,
        total_services_count=0,
        gross_revenue_generated=0.0,
    )
    db.add(st)
    await db.commit()
    await db.refresh(st)
    return st


@router.get("/formulas")
async def list_formulas(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(SalonBeautyFormula).where(SalonBeautyFormula.tenant_id == tenant_id).order_by(SalonBeautyFormula.created_at.desc())
    )
    return q.scalars().all()


@router.post("/formulas")
async def create_formula(
    payload: FormulaCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    form = SalonBeautyFormula(
        tenant_id=tenant_id,
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        stylist_name=payload.stylist_name,
        formula_date=payload.formula_date,
        service_type=payload.service_type,
        formula_details=payload.formula_details,
        sensitivity_notes=payload.sensitivity_notes,
        stylist_notes=payload.stylist_notes,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form


@router.post("/seed")
async def seed_salon_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed sample salon services, stylists, appointments, and chemical formulas."""
    q_services = await db.execute(select(SalonService).where(SalonService.tenant_id == tenant_id))
    if q_services.scalars().first():
        return {"message": "بيانات صالون التجميل والسبا مسجلة مسبقاً"}

    # Seed Services
    s1 = SalonService(
        tenant_id=tenant_id,
        service_name="قص وتصفيف الشعر الاحترافي (Haircut & Blowdry)",
        category="شعر وتصفيف",
        duration_minutes=45,
        buffer_turnaround_minutes=15,
        base_price=450.0,
        consumable_cost=30.0,
        is_active=True,
    )
    s2 = SalonService(
        tenant_id=tenant_id,
        service_name="صبغة شعر كاملة وهايلايت أولابليكس (Balayage & Olaplex)",
        category="صبغة ومعالجة",
        duration_minutes=120,
        buffer_turnaround_minutes=20,
        base_price=2200.0,
        consumable_cost=420.0,
        is_active=True,
    )
    s3 = SalonService(
        tenant_id=tenant_id,
        service_name="جلسة تنظيف بشرة هايدرافيشال ملكي (HydraFacial Deluxe)",
        category="بشرة وأظافر",
        duration_minutes=60,
        buffer_turnaround_minutes=15,
        base_price=1200.0,
        consumable_cost=180.0,
        is_active=True,
    )
    s4 = SalonService(
        tenant_id=tenant_id,
        service_name="الحمام المغربي الملكي بالأعشاب والزيوت العطرية",
        category="سبا ومساج",
        duration_minutes=90,
        buffer_turnaround_minutes=30,
        base_price=1600.0,
        consumable_cost=250.0,
        is_active=True,
    )
    db.add_all([s1, s2, s3, s4])
    await db.flush()

    # Seed Stylists
    st1 = SalonStylist(
        tenant_id=tenant_id,
        stylist_name="مدام / رانيا الكردي",
        specialty="كبير مصففي الشعر وخبيرة الصبغات العالمية",
        phone="01099223311",
        commission_service_percent=30.0,
        commission_retail_percent=12.0,
        total_services_count=142,
        gross_revenue_generated=185000.0,
    )
    st2 = SalonStylist(
        tenant_id=tenant_id,
        stylist_name="الأستاذة / نورهان الفاسي",
        specialty="أخصائية السبا والحمام المغربي والتدليك الطبيعي",
        phone="01144556622",
        commission_service_percent=25.0,
        commission_retail_percent=10.0,
        total_services_count=98,
        gross_revenue_generated=124000.0,
    )
    st3 = SalonStylist(
        tenant_id=tenant_id,
        stylist_name="الآنسة / ميرنا لطيف",
        specialty="أخصائية العناية بالبشرة والميكروبليدينج والفيشال",
        phone="01288776655",
        commission_service_percent=25.0,
        commission_retail_percent=10.0,
        total_services_count=110,
        gross_revenue_generated=145000.0,
    )
    db.add_all([st1, st2, st3])
    await db.flush()

    # Seed Appointments
    a1 = SalonAppointment(
        tenant_id=tenant_id,
        appointment_ref="SAL-APT-701",
        client_name="مدام / جيهان السلاب",
        client_phone="01011445566",
        stylist_name=st1.stylist_name,
        service_name=s2.service_name,
        station_or_room="كرسي التصفيف الرئيسي VIP (Chair 1)",
        appointment_date="2026-11-02",
        time_slot="11:00 AM",
        price=2200.0,
        status="in_service",
        payment_status="paid",
    )
    a2 = SalonAppointment(
        tenant_id=tenant_id,
        appointment_ref="SAL-APT-702",
        client_name="الأستاذة / ندى الشناوي",
        client_phone="01299887744",
        stylist_name=st2.stylist_name,
        service_name=s4.service_name,
        station_or_room="جناح الحمام المغربي والساونا الملكية",
        appointment_date="2026-11-02",
        time_slot="12:30 PM",
        price=1600.0,
        status="scheduled",
        payment_status="unpaid",
    )
    a3 = SalonAppointment(
        tenant_id=tenant_id,
        appointment_ref="SAL-APT-703",
        client_name="الآنسة / فريدة هلال",
        client_phone="01122339988",
        stylist_name=st3.stylist_name,
        service_name=s3.service_name,
        station_or_room="غرفة الهايدرافيشال والماسكات (Room 3)",
        appointment_date="2026-11-02",
        time_slot="02:00 PM",
        price=1200.0,
        status="scheduled",
        payment_status="unpaid",
    )
    db.add_all([a1, a2, a3])

    # Seed Beauty Formula History
    f1 = SalonBeautyFormula(
        tenant_id=tenant_id,
        client_name="مدام / جيهان السلاب",
        client_phone="01011445566",
        stylist_name=st1.stylist_name,
        formula_date="2026-11-02",
        service_type="صبغة بالياج وخصل رمادي زيتي",
        formula_details="L'Oreal Blond Studio 9 + 30 Vol (1:1.5) مع سائل Olaplex No.1، متبوع برنساج Dialight 9.11 + 9.02 مع أوكسجين 9 Vol لمدة 18 دقيقة على المغسلة.",
        sensitivity_notes="تم التحقق من فروة الرأس، لا توجد أي التهابات أو حساسية.",
        stylist_notes="العميلة تفضل الحفاظ على الجذور بلونها الطبيعي لسهولة الصيانة الدورية.",
    )
    db.add(f1)

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات صالون التجميل والسبا والتركيبات بنجاح"}
