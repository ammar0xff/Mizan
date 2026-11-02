"""API Router for Hotel Property Management System (PMS) module (HOT-01..12)."""
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
from app.modules.hospitality.models import (
    HotelFolioItem,
    HotelHousekeepingTask,
    HotelNightAudit,
    HotelReservation,
    HotelRoom,
)

router = APIRouter(prefix="/hospitality", tags=["Hotel & Hospitality PMS"])


# Schemas
class RoomCreate(BaseModel):
    room_number: str
    room_type: str
    floor: str
    bed_type: str
    max_guests: int = 2
    base_rate: float
    amenities: str = "واي فاي سريع، ميني بار، إطلالة مميزة"


class RoomStatusUpdate(BaseModel):
    status: str  # vacant_clean, vacant_dirty, occupied, inspected, out_of_order


class ReservationCreate(BaseModel):
    guest_name: str
    guest_phone: str
    guest_passport: str
    room_number: str
    check_in_date: str
    check_out_date: str
    nights: int
    room_rate: float
    paid_amount: float = 0.0


class FolioItemCreate(BaseModel):
    reservation_id: str
    guest_name: str
    room_number: str
    charge_type: str
    description: str
    net_amount: float
    tax_amount: float = 0.0


class HousekeepingTaskCreate(BaseModel):
    room_number: str
    task_type: str
    priority: str = "normal"
    assigned_to: str
    notes: str = ""


@router.get("/summary")
async def get_hospitality_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Hotel PMS operations."""
    q_rooms = await db.execute(select(HotelRoom).where(HotelRoom.tenant_id == tenant_id))
    rooms = q_rooms.scalars().all()

    q_res = await db.execute(select(HotelReservation).where(HotelReservation.tenant_id == tenant_id))
    reservations = q_res.scalars().all()

    q_tasks = await db.execute(select(HotelHousekeepingTask).where(HotelHousekeepingTask.tenant_id == tenant_id))
    tasks = q_tasks.scalars().all()

    q_audits = await db.execute(
        select(HotelNightAudit).where(HotelNightAudit.tenant_id == tenant_id).order_by(HotelNightAudit.created_at.desc())
    )
    latest_audit = q_audits.scalars().first()

    total_rooms = len(rooms)
    occupied_rooms = sum(1 for r in rooms if r.status == "occupied")
    dirty_rooms = sum(1 for r in rooms if r.status == "vacant_dirty")
    occupancy_pct = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0.0

    today_checkins = sum(1 for r in reservations if r.status == "confirmed")
    pending_cleaning = sum(1 for t in tasks if t.status != "completed")

    adr = latest_audit.adr if latest_audit else 2400.0
    revpar = latest_audit.revpar if latest_audit else round(adr * (occupancy_pct / 100), 2)

    return {
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "dirty_rooms": dirty_rooms,
        "occupancy_rate_percent": occupancy_pct,
        "today_checkins_count": today_checkins,
        "pending_housekeeping_tasks": pending_cleaning,
        "average_daily_rate_adr": adr,
        "revenue_per_available_room_revpar": revpar,
    }


@router.get("/rooms")
async def list_rooms(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelRoom).where(HotelRoom.tenant_id == tenant_id).order_by(HotelRoom.room_number.asc())
    )
    return q.scalars().all()


@router.post("/rooms")
async def create_room(
    payload: RoomCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    room = HotelRoom(
        tenant_id=tenant_id,
        room_number=payload.room_number,
        room_type=payload.room_type,
        floor=payload.floor,
        bed_type=payload.bed_type,
        max_guests=payload.max_guests,
        base_rate=payload.base_rate,
        status="vacant_clean",
        amenities=payload.amenities,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.post("/rooms/{room_id}/status")
async def update_room_status(
    room_id: str,
    payload: RoomStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(HotelRoom).where(HotelRoom.id == room_id, HotelRoom.tenant_id == tenant_id))
    r = q.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="الغرفة غير مسجلة")
    r.status = payload.status
    await db.commit()
    await db.refresh(r)
    return r


@router.get("/reservations")
async def list_reservations(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelReservation).where(HotelReservation.tenant_id == tenant_id).order_by(HotelReservation.created_at.desc())
    )
    return q.scalars().all()


@router.post("/reservations")
async def create_reservation(
    payload: ReservationCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"HTL-RES-{uuid.uuid4().hex[:6].upper()}"
    total = round(payload.nights * payload.room_rate, 2)
    res = HotelReservation(
        tenant_id=tenant_id,
        reservation_ref=ref,
        guest_name=payload.guest_name,
        guest_phone=payload.guest_phone,
        guest_passport=payload.guest_passport,
        room_number=payload.room_number,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        nights=payload.nights,
        room_rate=payload.room_rate,
        total_charges=total,
        paid_amount=payload.paid_amount,
        status="confirmed",
    )
    db.add(res)
    await db.commit()
    await db.refresh(res)
    return res


@router.post("/reservations/{res_id}/checkin")
async def checkin_reservation(
    res_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelReservation).where(HotelReservation.id == res_id, HotelReservation.tenant_id == tenant_id)
    )
    res = q.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="الحجز غير موجود")
    res.status = "checked_in"

    # Mark room as occupied
    q_room = await db.execute(
        select(HotelRoom).where(HotelRoom.room_number == res.room_number, HotelRoom.tenant_id == tenant_id)
    )
    rm = q_room.scalar_one_or_none()
    if rm:
        rm.status = "occupied"

    # Post initial room rate folio item
    folio = HotelFolioItem(
        tenant_id=tenant_id,
        reservation_id=res.id,
        guest_name=res.guest_name,
        room_number=res.room_number,
        charge_type="إقامة ليلية (Room Charge)",
        description=f"رسوم إقامة الغرفة {res.room_number} لمدة {res.nights} ليالي",
        net_amount=res.total_charges,
        tax_amount=round(res.total_charges * 0.14, 2),  # 14% VAT
        total_amount=round(res.total_charges * 1.14, 2),
        charge_date=res.check_in_date,
        is_settled=False,
    )
    db.add(folio)

    await db.commit()
    await db.refresh(res)
    return res


@router.post("/reservations/{res_id}/checkout")
async def checkout_reservation(
    res_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelReservation).where(HotelReservation.id == res_id, HotelReservation.tenant_id == tenant_id)
    )
    res = q.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="الحجز غير موجود")
    res.status = "checked_out"

    # Mark room as vacant_dirty
    q_room = await db.execute(
        select(HotelRoom).where(HotelRoom.room_number == res.room_number, HotelRoom.tenant_id == tenant_id)
    )
    rm = q_room.scalar_one_or_none()
    if rm:
        rm.status = "vacant_dirty"

    # Auto-dispatch housekeeping task
    task = HotelHousekeepingTask(
        tenant_id=tenant_id,
        room_number=res.room_number,
        task_type="تنظيف مغادرة (Checkout Clean)",
        priority="urgent",
        assigned_to="فريق التدبير المنزلي المناوب",
        status="pending",
        notes=f"مغادرة النزيل {res.guest_name}. تجهيز الغرفة للنزيل القادم مع تغيير البياضات بالكامل.",
    )
    db.add(task)

    await db.commit()
    await db.refresh(res)
    return res


@router.get("/folios")
async def list_folios(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelFolioItem).where(HotelFolioItem.tenant_id == tenant_id).order_by(HotelFolioItem.charge_date.desc())
    )
    return q.scalars().all()


@router.post("/folios")
async def create_folio_item(
    payload: FolioItemCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    tot = round(payload.net_amount + payload.tax_amount, 2)
    folio = HotelFolioItem(
        tenant_id=tenant_id,
        reservation_id=payload.reservation_id,
        guest_name=payload.guest_name,
        room_number=payload.room_number,
        charge_type=payload.charge_type,
        description=payload.description,
        net_amount=payload.net_amount,
        tax_amount=payload.tax_amount,
        total_amount=tot,
        charge_date="2026-11-02",
        is_settled=False,
    )
    db.add(folio)
    await db.commit()
    await db.refresh(folio)
    return folio


@router.get("/housekeeping")
async def list_housekeeping(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelHousekeepingTask).where(HotelHousekeepingTask.tenant_id == tenant_id).order_by(HotelHousekeepingTask.created_at.desc())
    )
    return q.scalars().all()


@router.post("/housekeeping")
async def create_housekeeping_task(
    payload: HousekeepingTaskCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    task = HotelHousekeepingTask(
        tenant_id=tenant_id,
        room_number=payload.room_number,
        task_type=payload.task_type,
        priority=payload.priority,
        assigned_to=payload.assigned_to,
        status="pending",
        notes=payload.notes,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/housekeeping/{task_id}/complete")
async def complete_housekeeping_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelHousekeepingTask).where(HotelHousekeepingTask.id == task_id, HotelHousekeepingTask.tenant_id == tenant_id)
    )
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="مهمة التدبير المنزلي غير موجودة")
    t.status = "completed"
    t.completed_at = "2026-11-02 11:30"

    # Mark room as vacant_clean or inspected
    q_room = await db.execute(
        select(HotelRoom).where(HotelRoom.room_number == t.room_number, HotelRoom.tenant_id == tenant_id)
    )
    rm = q_room.scalar_one_or_none()
    if rm and rm.status != "occupied":
        rm.status = "inspected"

    await db.commit()
    await db.refresh(t)
    return t


@router.get("/night-audits")
async def list_night_audits(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(HotelNightAudit).where(HotelNightAudit.tenant_id == tenant_id).order_by(HotelNightAudit.created_at.desc())
    )
    return q.scalars().all()


@router.post("/seed")
async def seed_hospitality_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed sample rooms, reservations, folios, and housekeeping tasks."""
    q_rooms = await db.execute(select(HotelRoom).where(HotelRoom.tenant_id == tenant_id))
    if q_rooms.scalars().first():
        return {"message": "بيانات الفندق والغرف مسجلة مسبقاً"}

    # Seed Rooms
    r1 = HotelRoom(
        tenant_id=tenant_id,
        room_number="101",
        room_type="غرفة كينج قياسية (Standard King)",
        floor="الدور الأول",
        bed_type="1 King Bed",
        max_guests=2,
        base_rate=1600.0,
        status="vacant_clean",
        amenities="واي فاي، تلفزيون 55 بوصة، ميني بار، إطلالة على الحديقة",
    )
    r2 = HotelRoom(
        tenant_id=tenant_id,
        room_number="102",
        room_type="غرفة توأم ديلوكس (Deluxe Twin)",
        floor="الدور الأول",
        bed_type="2 Twin Beds",
        max_guests=2,
        base_rate=1950.0,
        status="occupied",
        amenities="واي فاي، إطلالة على حمام السباحة، بلكونة خاصة، ماكينة نيسبريسو",
    )
    r3 = HotelRoom(
        tenant_id=tenant_id,
        room_number="205",
        room_type="جناح رجال الأعمال التنفيذي (Executive Suite)",
        floor="الدور الثاني",
        bed_type="1 Super King",
        max_guests=3,
        base_rate=3400.0,
        status="occupied",
        amenities="صالة استقبال مجهزة، إطلالة بانورامية على النيل، دخول لاونج رجال الأعمال، مكتب عمل متكامل",
    )
    r4 = HotelRoom(
        tenant_id=tenant_id,
        room_number="206",
        room_type="جناح ديلوكس عائلي (Family Suite)",
        floor="الدور الثاني",
        bed_type="1 King + 2 Twin",
        max_guests=4,
        base_rate=3800.0,
        status="vacant_dirty",
        amenities="غرفتين متصلتين، مطبخ تحضيري، حوض استحمام جاكوزي",
    )
    r5 = HotelRoom(
        tenant_id=tenant_id,
        room_number="501-VIP",
        room_type="الجناح الرئاسي الملكي (Royal Presidential Suite)",
        floor="الدور الخامس - البنتهاوس",
        bed_type="Master Royal Bed",
        max_guests=4,
        base_rate=9500.0,
        status="inspected",
        amenities="تراس خاص مع مسبح خاص، غرفة ساونا، مدخل ومصعد خاص VIP، خادم شخصي متفرغ (Butler)",
    )
    db.add_all([r1, r2, r3, r4, r5])
    await db.flush()

    # Seed Reservations
    res1 = HotelReservation(
        tenant_id=tenant_id,
        reservation_ref="HTL-RES-7701",
        guest_name="د. يوسف المنشاوي",
        guest_phone="01005544332",
        guest_passport="P2891004",
        room_number="102",
        check_in_date="2026-11-01",
        check_out_date="2026-11-04",
        nights=3,
        room_rate=1950.0,
        total_charges=5850.0,
        paid_amount=5850.0,
        status="checked_in",
    )
    res2 = HotelReservation(
        tenant_id=tenant_id,
        reservation_ref="HTL-RES-7702",
        guest_name="سعادة السفير / كارلوس منديز",
        guest_phone="+34611223344",
        guest_passport="ES-9941028",
        room_number="205",
        check_in_date="2026-10-31",
        check_out_date="2026-11-05",
        nights=5,
        room_rate=3400.0,
        total_charges=17000.0,
        paid_amount=17000.0,
        status="checked_in",
    )
    res3 = HotelReservation(
        tenant_id=tenant_id,
        reservation_ref="HTL-RES-7703",
        guest_name="المهندسة / سحر القصاص",
        guest_phone="01122998877",
        guest_passport="A1499201",
        room_number="101",
        check_in_date="2026-11-02",
        check_out_date="2026-11-06",
        nights=4,
        room_rate=1600.0,
        total_charges=6400.0,
        paid_amount=2000.0,
        status="confirmed",
    )
    db.add_all([res1, res2, res3])
    await db.flush()

    # Seed Folio items (incidentals posting)
    f1 = HotelFolioItem(
        tenant_id=tenant_id,
        reservation_id=res1.id,
        guest_name=res1.guest_name,
        room_number=res1.room_number,
        charge_type="إقامة ليلية (Room Charge)",
        description="إقامة 3 ليالي غرفة ديلوكس توأم",
        net_amount=5850.0,
        tax_amount=819.0,
        total_amount=6669.0,
        charge_date="2026-11-01",
        is_settled=True,
    )
    f2 = HotelFolioItem(
        tenant_id=tenant_id,
        reservation_id=res1.id,
        guest_name=res1.guest_name,
        room_number=res1.room_number,
        charge_type="مطعم ولاونج الفندق (F&B / Room Service)",
        description="عشاء روم سيرفيس وجبة ستيك مشوي ومقبلات إيطالية",
        net_amount=850.0,
        tax_amount=119.0,
        total_amount=969.0,
        charge_date="2026-11-01",
        is_settled=False,
    )
    f3 = HotelFolioItem(
        tenant_id=tenant_id,
        reservation_id=res2.id,
        guest_name=res2.guest_name,
        room_number=res2.room_number,
        charge_type="مغسلة وتنظيف جاف (Laundry)",
        description="كي وتنظيف بدلة رسمية وقمصان",
        net_amount=380.0,
        tax_amount=53.2,
        total_amount=433.2,
        charge_date="2026-11-02",
        is_settled=False,
    )
    db.add_all([f1, f2, f3])

    # Seed Housekeeping tasks
    hk1 = HotelHousekeepingTask(
        tenant_id=tenant_id,
        room_number="206",
        task_type="تنظيف مغادرة (Checkout Clean)",
        priority="urgent",
        assigned_to="أمينة محمود (مشرفة الأدوار)",
        status="pending",
        notes="مغادرة العائلة صباح اليوم. تغيير كافة المفروشات وتعقيم الحمام.",
    )
    hk2 = HotelHousekeepingTask(
        tenant_id=tenant_id,
        room_number="102",
        task_type="تنظيف إقامة يومي (Stayover Clean)",
        priority="normal",
        assigned_to="محمود راشد",
        status="in_progress",
        notes="ترتيب الأسرّة وتجديد زجاجات المياه والمناشف.",
    )
    db.add_all([hk1, hk2])

    # Seed Night Audit
    audit1 = HotelNightAudit(
        tenant_id=tenant_id,
        audit_date="2026-11-01",
        total_rooms=5,
        occupied_rooms=3,
        occupancy_rate=60.0,
        room_revenue=8750.0,
        fnb_revenue=2840.0,
        total_revenue=11590.0,
        adr=2916.67,
        revpar=1750.0,
        conducted_by="مراقب الحسابات الليلي / هاني عبد الرازق",
    )
    db.add(audit1)

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات الفندق والغرف والتدبير المنزلي والتدقيق الليلي بنجاح"}
