"""API Router for Field Service & Maintenance ERP module (FSM-01..11)."""
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
from app.modules.field_service.models import (
    FsmEquipmentAsset,
    FsmTechnician,
    FsmVanInventory,
    FsmWorkOrder,
)

router = APIRouter(prefix="/field-service", tags=["Field Service & Maintenance ERP"])


# Schemas
class WorkOrderCreate(BaseModel):
    client_name: str
    client_phone: str
    site_address: str
    equipment_type: str
    issue_description: str
    priority_sla: str  # emergency_2h, urgent_6h, standard_24h
    assigned_technician: str
    van_code: str
    scheduled_date: str


class WorkOrderStatusUpdate(BaseModel):
    status: str
    completion_notes: str = ""


class TechnicianCreate(BaseModel):
    tech_name: str
    phone: str
    van_code: str
    assigned_zone: str


class VanPartCreate(BaseModel):
    van_code: str
    technician_name: str
    part_code: str
    part_name: str
    qty_on_hand: int
    min_alert_threshold: int = 2
    unit_price: float


class PartConsumeRequest(BaseModel):
    qty: int = 1


class EquipmentCreate(BaseModel):
    serial_number: str
    client_name: str
    site_location: str
    equipment_model: str
    install_date: str
    last_service_date: str
    next_service_due: str
    warranty_status: str


@router.get("/summary")
async def get_fsm_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Field Service operations."""
    q_wo = await db.execute(select(FsmWorkOrder).where(FsmWorkOrder.tenant_id == tenant_id))
    work_orders = q_wo.scalars().all()

    q_techs = await db.execute(select(FsmTechnician).where(FsmTechnician.tenant_id == tenant_id))
    techs = q_techs.scalars().all()

    q_van = await db.execute(select(FsmVanInventory).where(FsmVanInventory.tenant_id == tenant_id))
    van_parts = q_van.scalars().all()

    q_equip = await db.execute(select(FsmEquipmentAsset).where(FsmEquipmentAsset.tenant_id == tenant_id))
    assets = q_equip.scalars().all()

    open_wo = sum(1 for w in work_orders if w.status != "completed")
    emergency_wo = sum(1 for w in work_orders if w.priority_sla == "emergency_2h" and w.status != "completed")
    completed_wo = sum(1 for w in work_orders if w.status == "completed")

    on_job_techs = sum(1 for t in techs if t.live_status == "working_on_job")
    low_stock_parts = sum(1 for p in van_parts if p.qty_on_hand <= p.min_alert_threshold)

    return {
        "active_work_orders_count": open_wo,
        "emergency_sla_count": emergency_wo,
        "completed_work_orders_count": completed_wo,
        "total_technicians_count": len(techs),
        "techs_on_job_count": on_job_techs,
        "low_stock_van_parts_count": low_stock_parts,
        "covered_assets_count": len(assets),
    }


@router.get("/work-orders")
async def list_work_orders(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(FsmWorkOrder).where(FsmWorkOrder.tenant_id == tenant_id).order_by(FsmWorkOrder.created_at.desc())
    )
    return q.scalars().all()


@router.post("/work-orders")
async def create_work_order(
    payload: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"WO-FSM-{uuid.uuid4().hex[:5].upper()}"
    wo = FsmWorkOrder(
        tenant_id=tenant_id,
        order_ref=ref,
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        site_address=payload.site_address,
        equipment_type=payload.equipment_type,
        issue_description=payload.issue_description,
        priority_sla=payload.priority_sla,
        assigned_technician=payload.assigned_technician,
        van_code=payload.van_code,
        scheduled_date=payload.scheduled_date,
        status="dispatched",
        completion_notes="",
    )
    db.add(wo)
    await db.commit()
    await db.refresh(wo)
    return wo


@router.post("/work-orders/{wo_id}/status")
async def update_work_order_status(
    wo_id: str,
    payload: WorkOrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(FsmWorkOrder).where(FsmWorkOrder.id == wo_id, FsmWorkOrder.tenant_id == tenant_id)
    )
    wo = q.scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="أمر العمل غير موجود")
    wo.status = payload.status
    if payload.completion_notes:
        wo.completion_notes = payload.completion_notes

    if payload.status == "completed":
        q_tech = await db.execute(
            select(FsmTechnician).where(FsmTechnician.tech_name == wo.assigned_technician, FsmTechnician.tenant_id == tenant_id)
        )
        tech = q_tech.scalar_one_or_none()
        if tech:
            tech.jobs_completed_today += 1
            tech.live_status = "available"

    await db.commit()
    await db.refresh(wo)
    return wo


@router.get("/technicians")
async def list_technicians(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(FsmTechnician).where(FsmTechnician.tenant_id == tenant_id).order_by(FsmTechnician.created_at.desc())
    )
    return q.scalars().all()


@router.post("/technicians")
async def create_technician(
    payload: TechnicianCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    t = FsmTechnician(
        tenant_id=tenant_id,
        tech_name=payload.tech_name,
        phone=payload.phone,
        van_code=payload.van_code,
        assigned_zone=payload.assigned_zone,
        live_status="available",
        jobs_completed_today=0,
        rating=4.8,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.get("/van-inventory")
async def list_van_inventory(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(FsmVanInventory).where(FsmVanInventory.tenant_id == tenant_id).order_by(FsmVanInventory.van_code.asc())
    )
    return q.scalars().all()


@router.post("/van-inventory")
async def create_van_part(
    payload: VanPartCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    item = FsmVanInventory(
        tenant_id=tenant_id,
        van_code=payload.van_code,
        technician_name=payload.technician_name,
        part_code=payload.part_code,
        part_name=payload.part_name,
        qty_on_hand=payload.qty_on_hand,
        min_alert_threshold=payload.min_alert_threshold,
        unit_price=payload.unit_price,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/van-inventory/{part_id}/consume")
async def consume_van_part(
    part_id: str,
    payload: PartConsumeRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(FsmVanInventory).where(FsmVanInventory.id == part_id, FsmVanInventory.tenant_id == tenant_id)
    )
    item = q.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="قطعة الغيار غير مسجلة بالسيارة")
    if item.qty_on_hand < payload.qty:
        raise HTTPException(status_code=400, detail="الرصيد المتاح بسيارة الصيانة لا يكفي")
    item.qty_on_hand -= payload.qty
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/equipment")
async def list_equipment(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(FsmEquipmentAsset).where(FsmEquipmentAsset.tenant_id == tenant_id).order_by(FsmEquipmentAsset.created_at.desc())
    )
    return q.scalars().all()


@router.post("/equipment")
async def create_equipment(
    payload: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    item = FsmEquipmentAsset(
        tenant_id=tenant_id,
        serial_number=payload.serial_number,
        client_name=payload.client_name,
        site_location=payload.site_location,
        equipment_model=payload.equipment_model,
        install_date=payload.install_date,
        last_service_date=payload.last_service_date,
        next_service_due=payload.next_service_due,
        warranty_status=payload.warranty_status,
        total_repairs_count=0,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/seed")
async def seed_fsm_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed sample field work orders, technicians, van inventories, and machinery assets."""
    q_wo = await db.execute(select(FsmWorkOrder).where(FsmWorkOrder.tenant_id == tenant_id))
    if q_wo.scalars().first():
        return {"message": "بيانات الصيانة الميدانية والتشغيل مسجلة مسبقاً"}

    # Seed Technicians
    t1 = FsmTechnician(
        tenant_id=tenant_id,
        tech_name="المهندس / سامح عبد الظاهر",
        phone="01099112233",
        van_code="VAN-08 (تكييف وتشيللرات)",
        assigned_zone="القاهرة الجديدة والتجمع الخامس",
        live_status="working_on_job",
        jobs_completed_today=2,
        rating=4.9,
    )
    t2 = FsmTechnician(
        tenant_id=tenant_id,
        tech_name="الفني / مايكل نجيب",
        phone="01244332211",
        van_code="VAN-14 (مصاعد وكنترول)",
        assigned_zone="الشيخ زايد ومدينة 6 أكتوبر",
        live_status="driving_to_site",
        jobs_completed_today=1,
        rating=4.7,
    )
    t3 = FsmTechnician(
        tenant_id=tenant_id,
        tech_name="الفني / إبراهيم دسوقي",
        phone="01155664433",
        van_code="VAN-03 (مضخات وكهرباء قوى)",
        assigned_zone="المعادي والمنطقة الصناعية بشق الثعبان",
        live_status="available",
        jobs_completed_today=3,
        rating=4.8,
    )
    db.add_all([t1, t2, t3])
    await db.flush()

    # Seed Work Orders
    w1 = FsmWorkOrder(
        tenant_id=tenant_id,
        order_ref="WO-FSM-9901",
        client_name="مستشفى دار الشفاء التخصصي",
        client_phone="01009876543",
        site_address="المبنى الرئيسي - غرفة التبريد المركزي بالبدروم",
        equipment_type="تشيللر تبريد غرف العمليات (Carrier 30XA)",
        issue_description="إنذار ضغط الزيت وانخفاض كفاءة التبريد في الدائرة رقم 2 مع ارتفاع درجة حرارة الكمبروسور.",
        priority_sla="emergency_2h",
        assigned_technician=t1.tech_name,
        van_code=t1.van_code,
        scheduled_date="2026-11-02",
        status="on_site",
        completion_notes="الفني متواجد حالياً بموقع المستشفى وبدأ في فحص ضغوط الفريون وحساسات الضغط العالي.",
    )
    w2 = FsmWorkOrder(
        tenant_id=tenant_id,
        order_ref="WO-FSM-9902",
        client_name="برج النيل الإداري (Nile Tower)",
        client_phone="01223344556",
        site_address="كورنيش النيل - مصعد رقم 3 (بانوراما)",
        equipment_type="مصعد ركاب سرعات أوتيس (Otis Gen2)",
        issue_description="اهتزاز ملحوظ عند الوقوف في الدور التاسع وتأخر فتح الباب الخارجي.",
        priority_sla="urgent_6h",
        assigned_technician=t2.tech_name,
        van_code=t2.van_code,
        scheduled_date="2026-11-02",
        status="dispatched",
        completion_notes="",
    )
    w3 = FsmWorkOrder(
        tenant_id=tenant_id,
        order_ref="WO-FSM-9903",
        client_name="مصنع إيجي فود للصناعات الغذائية",
        client_phone="01144889922",
        site_address="المنطقة الصناعية الثالثة - 6 أكتوبر",
        equipment_type="مضخة مياه ضغط عالي متعددة المراحل Grundfos",
        issue_description="الصيانة الوقائية الشهرية وتغيير موانع التسريب الميكانيكية وتزييت الرولمان بلي.",
        priority_sla="standard_24h",
        assigned_technician=t3.tech_name,
        van_code=t3.van_code,
        scheduled_date="2026-11-01",
        status="completed",
        completion_notes="تمت الصيانة بنجاح واختبار ضغط الشبكة عند 8 بار دون أي تسريب، مع تسليم التقرير لإدارة الصيانة بالمصنع.",
    )
    db.add_all([w1, w2, w3])

    # Seed Van Inventory
    v1 = FsmVanInventory(
        tenant_id=tenant_id,
        van_code="VAN-08 (تكييف وتشيللرات)",
        technician_name=t1.tech_name,
        part_code="PRT-CAP-45UF",
        part_name="مكثف تشغيل ضاغط أصلي 45uF 450V",
        qty_on_hand=6,
        min_alert_threshold=2,
        unit_price=350.0,
    )
    v2 = FsmVanInventory(
        tenant_id=tenant_id,
        van_code="VAN-08 (تكييف وتشيللرات)",
        technician_name=t1.tech_name,
        part_code="PRT-GAS-R410A",
        part_name="أسطوانة فريون تبريد صديق للبيئة R410A (11.3 كجم)",
        qty_on_hand=1,  # Low stock alert!
        min_alert_threshold=2,
        unit_price=2400.0,
    )
    v3 = FsmVanInventory(
        tenant_id=tenant_id,
        van_code="VAN-14 (مصاعد وكنترول)",
        technician_name=t2.tech_name,
        part_code="PRT-DOOR-SENS",
        part_name="ستارة ضوئية إلكترونية لحماية أبواب المصاعد",
        qty_on_hand=3,
        min_alert_threshold=1,
        unit_price=1800.0,
    )
    db.add_all([v1, v2, v3])

    # Seed Equipment Assets
    eq1 = FsmEquipmentAsset(
        tenant_id=tenant_id,
        serial_number="SN-CARRIER-88120",
        client_name="مستشفى دار الشفاء التخصصي",
        site_location="غرفة الميكانيكا المركزية - المبنى أ",
        equipment_model="Carrier AquaForce 30XA-400 (400 طن تبريد)",
        install_date="2024-03-15",
        last_service_date="2026-10-01",
        next_service_due="2026-11-01",
        warranty_status="amc_active",
        total_repairs_count=3,
    )
    eq2 = FsmEquipmentAsset(
        tenant_id=tenant_id,
        serial_number="SN-OTIS-GEN2-441",
        client_name="برج النيل الإداري",
        site_location="بئر المصاعد الشمالي (Elevator #3)",
        equipment_model="Otis Gen2 Comfort 1000kg (16 راكب)",
        install_date="2023-08-20",
        last_service_date="2026-10-15",
        next_service_due="2026-11-15",
        warranty_status="amc_active",
        total_repairs_count=2,
    )
    db.add_all([eq1, eq2])

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات الصيانة الميدانية وأوامر العمل وقطع الغيار بنجاح"}
