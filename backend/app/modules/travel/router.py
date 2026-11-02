"""API Router for Travel & Tourism Agency ERP module (TRV-01..10)."""
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
from app.modules.travel.models import (
    TravelBooking,
    TravelPackage,
    TravelPassenger,
    TravelVisaApplication,
)

router = APIRouter(prefix="/travel", tags=["Travel & Tourism ERP"])


# Schemas
class PackageCreate(BaseModel):
    package_code: str
    package_name: str
    destination_country: str
    destination_city: str
    duration_days: int = 7
    duration_nights: int = 6
    base_cost: float
    selling_price: float
    max_seats: int = 25
    inclusions: str
    day_by_day_plan: str


class BookingCreate(BaseModel):
    package_id: str
    customer_name: str
    customer_phone: str
    num_passengers: int = 1
    departure_date: str
    return_date: str
    hotel_name: str
    total_amount: float
    paid_amount: float = 0.0


class PassengerCreate(BaseModel):
    booking_id: str
    booking_ref: str
    full_name: str
    passport_number: str
    nationality: str = "مصري"
    date_of_birth: str
    passport_expiry: str
    room_type: str = "مزدوجة"
    dietary_notes: str = "عادي"


class VisaCreate(BaseModel):
    traveler_name: str
    passport_number: str
    destination_country: str
    visa_category: str
    submission_date: str
    passport_expiry_date: str
    notes: str = ""


@router.get("/summary")
async def get_travel_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Travel Agency operations."""
    q_pkgs = await db.execute(select(TravelPackage).where(TravelPackage.tenant_id == tenant_id))
    packages = q_pkgs.scalars().all()

    q_bks = await db.execute(select(TravelBooking).where(TravelBooking.tenant_id == tenant_id))
    bookings = q_bks.scalars().all()

    q_pax = await db.execute(select(TravelPassenger).where(TravelPassenger.tenant_id == tenant_id))
    passengers = q_pax.scalars().all()

    q_visas = await db.execute(select(TravelVisaApplication).where(TravelVisaApplication.tenant_id == tenant_id))
    visas = q_visas.scalars().all()

    total_gross = sum(b.total_amount for b in bookings)
    total_paid = sum(b.paid_amount for b in bookings)
    pending_visas = sum(1 for v in visas if v.status in ("submitted", "under_review"))

    return {
        "active_packages_count": len(packages),
        "total_bookings_count": len(bookings),
        "total_passengers_count": len(passengers),
        "gross_booking_value": total_gross,
        "collected_revenue": total_paid,
        "pending_visas_count": pending_visas,
    }


@router.get("/packages")
async def list_packages(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(TravelPackage).where(TravelPackage.tenant_id == tenant_id).order_by(TravelPackage.created_at.desc())
    )
    return q.scalars().all()


@router.post("/packages")
async def create_package(
    payload: PackageCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    pkg = TravelPackage(
        tenant_id=tenant_id,
        package_code=payload.package_code,
        package_name=payload.package_name,
        destination_country=payload.destination_country,
        destination_city=payload.destination_city,
        duration_days=payload.duration_days,
        duration_nights=payload.duration_nights,
        base_cost=payload.base_cost,
        selling_price=payload.selling_price,
        max_seats=payload.max_seats,
        booked_seats=0,
        inclusions=payload.inclusions,
        day_by_day_plan=payload.day_by_day_plan,
        status="active",
    )
    db.add(pkg)
    await db.commit()
    await db.refresh(pkg)
    return pkg


@router.get("/bookings")
async def list_bookings(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(TravelBooking).where(TravelBooking.tenant_id == tenant_id).order_by(TravelBooking.created_at.desc())
    )
    return q.scalars().all()


@router.post("/bookings")
async def create_booking(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"TRV-BK-{uuid.uuid4().hex[:6].upper()}"
    pnr = f"PNR-{uuid.uuid4().hex[:5].upper()}"

    q_pkg = await db.execute(
        select(TravelPackage).where(TravelPackage.id == payload.package_id, TravelPackage.tenant_id == tenant_id)
    )
    pkg = q_pkg.scalar_one_or_none()
    pkg_name = pkg.package_name if pkg else "برنامج سياحي مخصص"

    if pkg:
        pkg.booked_seats += payload.num_passengers

    pay_status = "paid" if payload.paid_amount >= payload.total_amount else ("partial" if payload.paid_amount > 0 else "pending")

    bk = TravelBooking(
        tenant_id=tenant_id,
        booking_ref=ref,
        package_id=payload.package_id,
        package_name=pkg_name,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        num_passengers=payload.num_passengers,
        departure_date=payload.departure_date,
        return_date=payload.return_date,
        flight_pnr=pnr,
        hotel_name=payload.hotel_name,
        total_amount=payload.total_amount,
        paid_amount=payload.paid_amount,
        payment_status=pay_status,
        booking_status="confirmed",
    )
    db.add(bk)
    await db.commit()
    await db.refresh(bk)
    return bk


@router.post("/bookings/{booking_id}/ticket")
async def ticket_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(TravelBooking).where(TravelBooking.id == booking_id, TravelBooking.tenant_id == tenant_id)
    )
    bk = q.scalar_one_or_none()
    if not bk:
        raise HTTPException(status_code=404, detail="الحجز غير موجود")
    bk.booking_status = "ticketed"
    await db.commit()
    await db.refresh(bk)
    return bk


@router.get("/passengers")
async def list_passengers(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(TravelPassenger).where(TravelPassenger.tenant_id == tenant_id).order_by(TravelPassenger.created_at.desc())
    )
    return q.scalars().all()


@router.post("/passengers")
async def create_passenger(
    payload: PassengerCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    pax = TravelPassenger(
        tenant_id=tenant_id,
        booking_id=payload.booking_id,
        booking_ref=payload.booking_ref,
        full_name=payload.full_name,
        passport_number=payload.passport_number,
        nationality=payload.nationality,
        date_of_birth=payload.date_of_birth,
        passport_expiry=payload.passport_expiry,
        room_type=payload.room_type,
        dietary_notes=payload.dietary_notes,
        visa_status="issued",
    )
    db.add(pax)
    await db.commit()
    await db.refresh(pax)
    return pax


@router.get("/visas")
async def list_visas(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(TravelVisaApplication).where(TravelVisaApplication.tenant_id == tenant_id).order_by(TravelVisaApplication.created_at.desc())
    )
    return q.scalars().all()


@router.post("/visas")
async def create_visa(
    payload: VisaCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    visa = TravelVisaApplication(
        tenant_id=tenant_id,
        traveler_name=payload.traveler_name,
        passport_number=payload.passport_number,
        destination_country=payload.destination_country,
        visa_category=payload.visa_category,
        submission_date=payload.submission_date,
        passport_expiry_date=payload.passport_expiry_date,
        status="submitted",
        notes=payload.notes,
    )
    db.add(visa)
    await db.commit()
    await db.refresh(visa)
    return visa


@router.post("/visas/{visa_id}/approve")
async def approve_visa(
    visa_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(TravelVisaApplication).where(TravelVisaApplication.id == visa_id, TravelVisaApplication.tenant_id == tenant_id)
    )
    v = q.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="طلب التأشيرة غير موجود")
    v.status = "approved"
    v.approval_date = "2026-11-02"
    await db.commit()
    await db.refresh(v)
    return v


@router.post("/seed")
async def seed_travel_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed sample travel packages, itineraries, bookings, and passengers."""
    q_pkgs = await db.execute(select(TravelPackage).where(TravelPackage.tenant_id == tenant_id))
    if q_pkgs.scalars().first():
        return {"message": "بيانات وكالة السياحة والسفر مسجلة مسبقاً"}

    # Seed Packages
    p1 = TravelPackage(
        tenant_id=tenant_id,
        package_code="PKG-IST-2026",
        package_name="سحر البوسفور وإسطنبول التاريخية (VIP)",
        destination_country="تركيا",
        destination_city="إسطنبول وسبانجا",
        duration_days=8,
        duration_nights=7,
        base_cost=32000.0,
        selling_price=44500.0,
        max_seats=20,
        booked_seats=14,
        inclusions="طيران دولي مباشر (مصر للطيران) + فندق 5 نجوم شيراتون إسطنبول + جولات البوسفور وسبانجا + إفطار فاخر",
        day_by_day_plan="اليوم 1: الوصول والاستقبال VIP - اليوم 2: جولة السلطان أحمد وآيا صوفيا - اليوم 3: رحلة البوسفور البحرية - اليوم 4: بحيرة سبانجا والمعشوقية - اليوم 5: التسوق بمول جواهر وجراند بازار - اليوم 6: جزيرة الأميرات - اليوم 7: يوم حر - اليوم 8: التوديع والمغادرة.",
        status="active",
    )
    p2 = TravelPackage(
        tenant_id=tenant_id,
        package_code="PKG-UMR-2026",
        package_name="عمرة رجب الفاخرة (أبراج الساعة مكة والمدينة)",
        destination_country="المملكة العربية السعودية",
        destination_city="مكة المكرمة والمدينة المنورة",
        duration_days=10,
        duration_nights=9,
        base_cost=41000.0,
        selling_price=53000.0,
        max_seats=30,
        booked_seats=28,
        inclusions="تأشيرة العمرة الإلكترونية + طيران مباشر جدة/المدينة + فنادق فيرمونت مكة ودار التقوى + قطار الحرمين السريع",
        day_by_day_plan="اليوم 1: الوصول إلى جدة والانتقال للحرم المكي لأداء النسك - الأيام 2-5: الإقامة بمكة المكرمة - اليوم 6: التوجه للمدينة المنورة بقطار الحرمين - الأيام 7-9: زيارة الروضة الشريفة ومزارات المدينة - اليوم 10: السفر والعودة للقاهرة.",
        status="active",
    )
    p3 = TravelPackage(
        tenant_id=tenant_id,
        package_code="PKG-AND-2026",
        package_name="روائع الأندلس وإسبانيا الكلاسيكية",
        destination_country="إسبانيا",
        destination_city="مدريد، قرطبة، غرناطة، إشبيلية",
        duration_days=9,
        duration_nights=8,
        base_cost=65000.0,
        selling_price=89000.0,
        max_seats=15,
        booked_seats=6,
        inclusions="طيران الخطوط الإسبانية إيبيريا + فنادق 4 نجوم سوبريور + تذاكر قصر الحمراء ومسجد قرطبة + مرشد عربي معتمد",
        day_by_day_plan="اليوم 1: مدريد - اليوم 2: القصر الملكي ومتحف برادو - اليوم 3: القطار لقرطبة - اليوم 4: غرناطة وقصر الحمراء - اليوم 5-6: إشبيلية وعروض الفلامنكو - اليوم 7-8: العودة لمدريد - اليوم 9: المغادرة.",
        status="active",
    )
    db.add_all([p1, p2, p3])
    await db.flush()

    # Seed Bookings
    b1 = TravelBooking(
        tenant_id=tenant_id,
        booking_ref="TRV-BK-9011",
        package_id=p1.id,
        package_name=p1.package_name,
        customer_name="المهندس / أحمد عبد الجواد",
        customer_phone="01011223344",
        num_passengers=2,
        departure_date="2026-11-20",
        return_date="2026-11-27",
        flight_pnr="MS-TK9821",
        hotel_name="فندق شيراتون إسطنبول سيتي سنتر",
        total_amount=89000.0,
        paid_amount=89000.0,
        payment_status="paid",
        booking_status="ticketed",
    )
    b2 = TravelBooking(
        tenant_id=tenant_id,
        booking_ref="TRV-BK-9012",
        package_id=p2.id,
        package_name=p2.package_name,
        customer_name="الحاج / منصور القاضي",
        customer_phone="01244556677",
        num_passengers=4,
        departure_date="2026-12-05",
        return_date="2026-12-14",
        flight_pnr="SV-CAI-4412",
        hotel_name="فندق برج ساعة مكة فيرمونت + دار التقوى المدينة",
        total_amount=212000.0,
        paid_amount=120000.0,
        payment_status="partial",
        booking_status="confirmed",
    )
    db.add_all([b1, b2])
    await db.flush()

    # Seed Passengers
    pax1 = TravelPassenger(
        tenant_id=tenant_id,
        booking_id=b1.id,
        booking_ref=b1.booking_ref,
        full_name="أحمد عبد الجواد سليمان",
        passport_number="A28910452",
        nationality="مصري",
        date_of_birth="1982-04-12",
        passport_expiry="2030-05-18",
        room_type="مزدوجة",
        dietary_notes="وجبة إسلامية حلال",
        visa_status="issued",
    )
    pax2 = TravelPassenger(
        tenant_id=tenant_id,
        booking_id=b1.id,
        booking_ref=b1.booking_ref,
        full_name="منى فاروق الشربيني",
        passport_number="A31449012",
        nationality="مصري",
        date_of_birth="1986-09-22",
        passport_expiry="2029-11-04",
        room_type="مزدوجة",
        dietary_notes="وجبة نباتية",
        visa_status="issued",
    )
    pax3 = TravelPassenger(
        tenant_id=tenant_id,
        booking_id=b2.id,
        booking_ref=b2.booking_ref,
        full_name="منصور القاضي محمد",
        passport_number="A19822340",
        nationality="مصري",
        date_of_birth="1960-01-15",
        passport_expiry="2028-03-30",
        room_type="ثنائية مطلة على الكعبة",
        dietary_notes="وجبة قليلة السكر والملح",
        visa_status="issued",
    )
    db.add_all([pax1, pax2, pax3])

    # Seed Visas
    v1 = TravelVisaApplication(
        tenant_id=tenant_id,
        traveler_name="شريف ممدوح علام",
        passport_number="A44109822",
        destination_country="إسبانيا (شنغن)",
        visa_category="تأشيرة سياحة قصيرة C-Type",
        submission_date="2026-10-25",
        approval_date="2026-11-01",
        passport_expiry_date="2031-08-14",
        status="approved",
        notes="تم استلام الجواز بتأشيرة شنغن صالحة لمدة عام كامل من القنصلية الإسبانية بالقاهرة.",
    )
    v2 = TravelVisaApplication(
        tenant_id=tenant_id,
        traveler_name="ياسمين كمال الدين",
        passport_number="A51203394",
        destination_country="تركيا",
        visa_category="تأشيرة سياحة إلكترونية eVisa",
        submission_date="2026-10-31",
        approval_date="",
        passport_expiry_date="2029-12-01",
        status="under_review",
        notes="بانتظار التحقق من كشف الحساب البنكي وخطاب العمل الموثق.",
    )
    db.add_all([v1, v2])

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات وكالة السياحة والرحلات والتأشيرات بنجاح"}
