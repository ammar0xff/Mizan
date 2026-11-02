"""API Router for Discrete Manufacturing & Assembly module (MFG-01..12)."""
from __future__ import annotations

import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)

from app.modules.mfg.models import (
    MfgBom,
    MfgBomItem,
    MfgWorkCenter,
    MfgRoutingOperation,
    MfgProductionOrder,
    MfgQualityInspection,
    MfgOeeLog,
)

router = APIRouter(prefix="/mfg", tags=["Discrete Manufacturing & Assembly"])

# Pydantic Schemas
class BomItemCreate(BaseModel):
    level: int = 1
    component_code: str
    component_name: str
    quantity_required: float = 1.0
    uom: str = "PCS"
    unit_cost: float = 0.0
    scrap_factor_percent: float = 0.0

class RoutingOpCreate(BaseModel):
    work_center_id: Optional[str] = None
    sequence_num: int = 10
    operation_name: str
    setup_time_mins: float = 15.0
    run_time_per_unit_mins: float = 5.0

class BomCreate(BaseModel):
    bom_code: str
    item_name: str
    revision: str = "Rev-A"
    base_qty: float = 1.0
    uom: str = "PCS"
    total_standard_cost: float = 0.0
    items: List[BomItemCreate] = []
    operations: List[RoutingOpCreate] = []

class WorkCenterCreate(BaseModel):
    center_code: str
    center_name: str
    department: str = "Machining"
    hourly_machine_rate: float = 0.0
    hourly_labor_rate: float = 0.0
    capacity_hours_per_day: float = 8.0
    status: str = "active"

class ProductionOrderCreate(BaseModel):
    order_ref: str
    bom_id: Optional[str] = None
    finished_good_name: str
    planned_qty: float = 100.0
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str
    completed_qty: Optional[float] = None
    scrap_qty: Optional[float] = None
    actual_wip_cost: Optional[float] = None
    notes: Optional[str] = None

class InspectionCreate(BaseModel):
    inspection_ref: str
    order_id: Optional[str] = None
    stage: str = "in_process"
    sample_size: int = 10
    defect_count: int = 0
    outcome: str = "passed"
    inspector_name: str
    ncr_number: Optional[str] = None
    notes: Optional[str] = None

class OeeLogCreate(BaseModel):
    work_center_id: str
    log_date: str
    planned_production_time_hrs: float = 8.0
    operating_time_hrs: float = 7.2
    ideal_cycle_time_mins: float = 2.0
    total_pieces: int = 200
    good_pieces: int = 192

# Endpoints
@router.get("/summary")
async def get_mfg_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_orders = await db.execute(select(MfgProductionOrder).where(MfgProductionOrder.tenant_id == tenant_id))
    orders = q_orders.scalars().all()
    
    active_orders = sum(1 for o in orders if o.status in ("planned", "released", "in_progress"))
    completed_orders = sum(1 for o in orders if o.status in ("completed", "closed"))
    total_wip = sum(o.actual_wip_cost for o in orders)

    q_centers = await db.execute(select(MfgWorkCenter).where(MfgWorkCenter.tenant_id == tenant_id))
    centers = q_centers.scalars().all()

    q_ncrs = await db.execute(
        select(MfgQualityInspection).where(
            MfgQualityInspection.tenant_id == tenant_id,
            MfgQualityInspection.outcome.in_(["quarantined", "rejected"])
        )
    )
    open_ncrs = len(q_ncrs.scalars().all())

    q_oee = await db.execute(select(MfgOeeLog).where(MfgOeeLog.tenant_id == tenant_id))
    oee_logs = q_oee.scalars().all()
    avg_oee = round(sum(l.oee_score_pct for l in oee_logs) / len(oee_logs), 1) if oee_logs else 82.5

    return {
        "active_production_orders": active_orders,
        "completed_production_orders": completed_orders,
        "total_work_centers": len(centers),
        "open_ncrs_count": open_ncrs,
        "total_wip_value": round(float(total_wip), 2),
        "average_oee_score": avg_oee
    }

@router.get("/boms")
async def list_boms(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q_boms = await db.execute(select(MfgBom).where(MfgBom.tenant_id == tenant_id).order_by(MfgBom.created_at.desc()))
    boms = q_boms.scalars().all()
    results = []
    for b in boms:
        q_items = await db.execute(select(MfgBomItem).where(MfgBomItem.bom_id == b.id))
        items = q_items.scalars().all()
        q_ops = await db.execute(select(MfgRoutingOperation).where(MfgRoutingOperation.bom_id == b.id).order_by(MfgRoutingOperation.sequence_num))
        ops = q_ops.scalars().all()
        results.append({
            "id": b.id,
            "bom_code": b.bom_code,
            "item_name": b.item_name,
            "revision": b.revision,
            "is_active": b.is_active,
            "base_qty": b.base_qty,
            "uom": b.uom,
            "total_standard_cost": b.total_standard_cost,
            "items_count": len(items),
            "items": [
                {
                    "id": item.id,
                    "level": item.level,
                    "component_code": item.component_code,
                    "component_name": item.component_name,
                    "quantity_required": item.quantity_required,
                    "uom": item.uom,
                    "unit_cost": item.unit_cost,
                    "scrap_factor_percent": item.scrap_factor_percent,
                }
                for item in items
            ],
            "operations": [
                {
                    "id": op.id,
                    "sequence_num": op.sequence_num,
                    "operation_name": op.operation_name,
                    "work_center_id": op.work_center_id,
                    "setup_time_mins": op.setup_time_mins,
                    "run_time_per_unit_mins": op.run_time_per_unit_mins,
                }
                for op in ops
            ]
        })
    return results

@router.post("/boms")
async def create_bom(
    payload: BomCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    bom_id = str(uuid.uuid4())
    bom = MfgBom(
        id=bom_id,
        tenant_id=tenant_id,
        bom_code=payload.bom_code,
        item_name=payload.item_name,
        revision=payload.revision,
        base_qty=payload.base_qty,
        uom=payload.uom,
        total_standard_cost=payload.total_standard_cost
    )
    db.add(bom)
    await db.flush()

    for item in payload.items:
        db.add(MfgBomItem(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            bom_id=bom_id,
            level=item.level,
            component_code=item.component_code,
            component_name=item.component_name,
            quantity_required=item.quantity_required,
            uom=item.uom,
            unit_cost=item.unit_cost,
            scrap_factor_percent=item.scrap_factor_percent
        ))

    for op in payload.operations:
        db.add(MfgRoutingOperation(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            bom_id=bom_id,
            work_center_id=op.work_center_id,
            sequence_num=op.sequence_num,
            operation_name=op.operation_name,
            setup_time_mins=op.setup_time_mins,
            run_time_per_unit_mins=op.run_time_per_unit_mins
        ))

    await db.commit()
    return {"id": bom.id, "bom_code": bom.bom_code, "status": "created"}

@router.get("/work-centers")
async def list_work_centers(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(MfgWorkCenter).where(MfgWorkCenter.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/work-centers")
async def create_work_center(
    payload: WorkCenterCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    wc = MfgWorkCenter(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        center_code=payload.center_code,
        center_name=payload.center_name,
        department=payload.department,
        hourly_machine_rate=payload.hourly_machine_rate,
        hourly_labor_rate=payload.hourly_labor_rate,
        capacity_hours_per_day=payload.capacity_hours_per_day,
        status=payload.status
    )
    db.add(wc)
    await db.commit()
    return wc

@router.get("/production-orders")
async def list_production_orders(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(MfgProductionOrder).where(MfgProductionOrder.tenant_id == tenant_id).order_by(MfgProductionOrder.created_at.desc()))
    orders = q.scalars().all()
    results = []
    for o in orders:
        bom_code = None
        if o.bom_id:
            qb = await db.execute(select(MfgBom).where(MfgBom.id == o.bom_id))
            b = qb.scalar_one_or_none()
            if b:
                bom_code = b.bom_code
        results.append({
            "id": o.id,
            "order_ref": o.order_ref,
            "bom_id": o.bom_id,
            "bom_code": bom_code,
            "finished_good_name": o.finished_good_name,
            "planned_qty": o.planned_qty,
            "completed_qty": o.completed_qty,
            "scrap_qty": o.scrap_qty,
            "status": o.status,
            "scheduled_start": o.scheduled_start,
            "scheduled_end": o.scheduled_end,
            "actual_wip_cost": o.actual_wip_cost,
            "notes": o.notes,
            "created_at": o.created_at.isoformat() if o.created_at else None
        })
    return results

@router.post("/production-orders")
async def create_production_order(
    payload: ProductionOrderCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    order = MfgProductionOrder(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        order_ref=payload.order_ref,
        bom_id=payload.bom_id,
        finished_good_name=payload.finished_good_name,
        planned_qty=payload.planned_qty,
        scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end,
        notes=payload.notes,
        status="planned"
    )
    db.add(order)
    await db.commit()
    return order

@router.post("/production-orders/{id}/status")
async def update_order_status(
    id: str,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(MfgProductionOrder).where(MfgProductionOrder.id == id, MfgProductionOrder.tenant_id == tenant_id))
    order = q.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")
    
    order.status = payload.status
    if payload.completed_qty is not None:
        order.completed_qty = payload.completed_qty
    if payload.scrap_qty is not None:
        order.scrap_qty = payload.scrap_qty
    if payload.actual_wip_cost is not None:
        order.actual_wip_cost = payload.actual_wip_cost
    if payload.notes:
        order.notes = payload.notes
    
    await db.commit()
    return order

@router.get("/inspections")
async def list_inspections(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(MfgQualityInspection).where(MfgQualityInspection.tenant_id == tenant_id).order_by(MfgQualityInspection.created_at.desc()))
    return q.scalars().all()

@router.post("/inspections")
async def create_inspection(
    payload: InspectionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    insp = MfgQualityInspection(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        inspection_ref=payload.inspection_ref,
        order_id=payload.order_id,
        stage=payload.stage,
        sample_size=payload.sample_size,
        defect_count=payload.defect_count,
        outcome=payload.outcome,
        inspector_name=payload.inspector_name,
        ncr_number=payload.ncr_number,
        notes=payload.notes
    )
    db.add(insp)
    await db.commit()
    return insp

@router.get("/oee-logs")
async def list_oee_logs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(MfgOeeLog).where(MfgOeeLog.tenant_id == tenant_id))
    logs = q.scalars().all()
    results = []
    for l in logs:
        qc = await db.execute(select(MfgWorkCenter).where(MfgWorkCenter.id == l.work_center_id))
        center = qc.scalar_one_or_none()
        results.append({
            "id": l.id,
            "work_center_id": l.work_center_id,
            "center_name": center.center_name if center else "Unknown",
            "center_code": center.center_code if center else "",
            "log_date": l.log_date,
            "planned_production_time_hrs": l.planned_production_time_hrs,
            "operating_time_hrs": l.operating_time_hrs,
            "total_pieces": l.total_pieces,
            "good_pieces": l.good_pieces,
            "availability_pct": l.availability_pct,
            "performance_pct": l.performance_pct,
            "quality_pct": l.quality_pct,
            "oee_score_pct": l.oee_score_pct
        })
    return results

@router.post("/oee-logs")
async def create_oee_log(
    payload: OeeLogCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    avail = round((payload.operating_time_hrs / max(payload.planned_production_time_hrs, 0.1)) * 100.0, 1)
    avail = min(avail, 100.0)
    
    ideal_pieces = (payload.operating_time_hrs * 60.0) / max(payload.ideal_cycle_time_mins, 0.1)
    perf = round((payload.total_pieces / max(ideal_pieces, 1.0)) * 100.0, 1)
    perf = min(perf, 100.0)
    
    qual = round((payload.good_pieces / max(payload.total_pieces, 1)) * 100.0, 1)
    qual = min(qual, 100.0)
    
    oee = round((avail * perf * qual) / 10000.0, 1)

    log = MfgOeeLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        work_center_id=payload.work_center_id,
        log_date=payload.log_date,
        planned_production_time_hrs=payload.planned_production_time_hrs,
        operating_time_hrs=payload.operating_time_hrs,
        ideal_cycle_time_mins=payload.ideal_cycle_time_mins,
        total_pieces=payload.total_pieces,
        good_pieces=payload.good_pieces,
        availability_pct=avail,
        performance_pct=perf,
        quality_pct=qual,
        oee_score_pct=oee
    )
    db.add(log)
    await db.commit()
    return log

@router.post("/seed")
async def seed_mfg_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Discrete Manufacturing & Assembly."""
    q_existing = await db.execute(select(MfgBom).where(MfgBom.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Mfg module already seeded"}

    # 1. Work Centers
    wc1_id = str(uuid.uuid4())
    wc2_id = str(uuid.uuid4())
    wc3_id = str(uuid.uuid4())
    wc4_id = str(uuid.uuid4())

    wcs = [
        MfgWorkCenter(
            id=wc1_id,
            tenant_id=tenant_id,
            center_code="WC-CNC-01",
            center_name="مركز الخراطة والتشغيل الآلي CNC",
            department="الخراطة والتشغيل الدقيق",
            hourly_machine_rate=850.0,
            hourly_labor_rate=150.0,
            capacity_hours_per_day=16.0,
            status="active"
        ),
        MfgWorkCenter(
            id=wc2_id,
            tenant_id=tenant_id,
            center_code="WC-WELD-02",
            center_name="محطة اللحام الآلي TIG/MIG",
            department="التشكيل واللحام الهيكلي",
            hourly_machine_rate=450.0,
            hourly_labor_rate=180.0,
            capacity_hours_per_day=16.0,
            status="active"
        ),
        MfgWorkCenter(
            id=wc3_id,
            tenant_id=tenant_id,
            center_code="WC-PAINT-03",
            center_name="كابينة الطلاء الإلكتروستاتيكي والكوراج",
            department="المعالجة السطحية والطلاء",
            hourly_machine_rate=600.0,
            hourly_labor_rate=120.0,
            capacity_hours_per_day=8.0,
            status="active"
        ),
        MfgWorkCenter(
            id=wc4_id,
            tenant_id=tenant_id,
            center_code="WC-ASSY-04",
            center_name="خط التجميع النهائي واختبارات الجودة",
            department="التجميع والتعبئة",
            hourly_machine_rate=350.0,
            hourly_labor_rate=200.0,
            capacity_hours_per_day=16.0,
            status="active"
        )
    ]
    for w in wcs:
        db.add(w)
    await db.flush()

    # 2. BOM & Routings
    bom1_id = str(uuid.uuid4())
    bom1 = MfgBom(
        id=bom1_id,
        tenant_id=tenant_id,
        bom_code="BOM-PUMP-500",
        item_name="مضخة طرد مركزي صناعية 15 حصان (Centrifugal Pump)",
        revision="Rev-C (2026)",
        base_qty=1.0,
        uom="UNIT",
        total_standard_cost=14850.0
    )
    db.add(bom1)
    await db.flush()

    bom_items = [
        MfgBomItem(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, level=1, component_code="RAW-CAST-01", component_name="جسم المضخة حديد زهر مسبوك Cast Iron Casing", quantity_required=1.0, uom="PCS", unit_cost=3200.0, scrap_factor_percent=2.0),
        MfgBomItem(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, level=2, component_code="SUB-IMPEL-02", component_name="مروحة التدوير ستانلس ستيل SS316 Impeller", quantity_required=1.0, uom="PCS", unit_cost=2100.0, scrap_factor_percent=1.5),
        MfgBomItem(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, level=2, component_code="PRT-SHAFT-03", component_name="عمود الدوران معالج حرارياً Alloy Shaft", quantity_required=1.0, uom="PCS", unit_cost=1850.0, scrap_factor_percent=1.0),
        MfgBomItem(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, level=3, component_code="PRT-SEAL-04", component_name="مانع تسريب ميكانيكي كربوني Mechanical Seal", quantity_required=2.0, uom="SET", unit_cost=750.0, scrap_factor_percent=0.5),
        MfgBomItem(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, level=3, component_code="PRT-BEAR-05", component_name="رولمان بلي ياباني SKF Deep Groove Bearings", quantity_required=2.0, uom="PCS", unit_cost=620.0, scrap_factor_percent=0.0),
        MfgBomItem(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, level=1, component_code="ELC-MOTR-06", component_name="محرك كهربائي 3 فاز 15 حصان Siemens Class F", quantity_required=1.0, uom="UNIT", unit_cost=4960.0, scrap_factor_percent=0.0),
    ]
    for bi in bom_items:
        db.add(bi)

    routings = [
        MfgRoutingOperation(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, work_center_id=wc1_id, sequence_num=10, operation_name="خراطة وتفريز الشفاه وتجويف المحمل CNC", setup_time_mins=30.0, run_time_per_unit_mins=45.0),
        MfgRoutingOperation(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, work_center_id=wc2_id, sequence_num=20, operation_name="لحام قاعدة التثبيت وقرص المحرك", setup_time_mins=20.0, run_time_per_unit_mins=25.0),
        MfgRoutingOperation(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, work_center_id=wc3_id, sequence_num=30, operation_name="دهان إلكتروستاتيكي مقاوم للصدأ والكيماويات", setup_time_mins=40.0, run_time_per_unit_mins=20.0),
        MfgRoutingOperation(id=str(uuid.uuid4()), tenant_id=tenant_id, bom_id=bom1_id, work_center_id=wc4_id, sequence_num=40, operation_name="تجميع الأجزاء، محاذاة العمود، واختبار الضغط الهيدروستاتيكي", setup_time_mins=15.0, run_time_per_unit_mins=60.0),
    ]
    for r in routings:
        db.add(r)
    await db.flush()

    # 3. Production Orders
    po1_id = str(uuid.uuid4())
    po2_id = str(uuid.uuid4())
    orders = [
        MfgProductionOrder(
            id=po1_id,
            tenant_id=tenant_id,
            order_ref="WO-2026-001",
            bom_id=bom1_id,
            finished_good_name="مضخة طرد مركزي صناعية 15 حصان",
            planned_qty=50.0,
            completed_qty=35.0,
            scrap_qty=2.0,
            status="in_progress",
            scheduled_start="2026-11-01",
            scheduled_end="2026-11-10",
            actual_wip_cost=519750.0,
            notes="طلب إنتاج لصالح هيئة مياه الشرب والصرف الصحي - أولوية عاجلة"
        ),
        MfgProductionOrder(
            id=po2_id,
            tenant_id=tenant_id,
            order_ref="WO-2026-002",
            bom_id=bom1_id,
            finished_good_name="مضخة طرد مركزي صناعية 15 حصان",
            planned_qty=20.0,
            completed_qty=0.0,
            scrap_qty=0.0,
            status="released",
            scheduled_start="2026-11-08",
            scheduled_end="2026-11-18",
            actual_wip_cost=0.0,
            notes="توريد لمشروع محطة تحلية الجونة"
        ),
        MfgProductionOrder(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            order_ref="WO-2026-003",
            bom_id=bom1_id,
            finished_good_name="مضخة طرد مركزي صناعية 15 حصان",
            planned_qty=40.0,
            completed_qty=40.0,
            scrap_qty=1.0,
            status="completed",
            scheduled_start="2026-10-15",
            scheduled_end="2026-10-28",
            actual_wip_cost=594000.0,
            notes="تم التسليم بالكامل لمخازن المنتجات التامة"
        )
    ]
    for o in orders:
        db.add(o)

    # 4. Quality Inspections
    inspections = [
        MfgQualityInspection(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            inspection_ref="QC-INSP-881",
            order_id=po1_id,
            stage="in_process",
            sample_size=10,
            defect_count=0,
            outcome="passed",
            inspector_name="م/ أحمد النجار (رئيس قسم توكيد الجودة)",
            notes="فحص استواء السطح وسماكة الطلاء بمقياس ميكروميتر رقمي"
        ),
        MfgQualityInspection(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            inspection_ref="QC-INSP-882",
            order_id=po1_id,
            stage="in_process",
            sample_size=5,
            defect_count=1,
            outcome="quarantined",
            inspector_name="م/ أحمد النجار",
            ncr_number="NCR-2026-019",
            notes="وجود نخر هوائي دقيق في مروحة الصب Impeller - تم التحويل للحجر الفني لإعادة الفحص بالموجات فوق الصوتية"
        )
    ]
    for i in inspections:
        db.add(i)

    # 5. OEE Logs
    oee_logs = [
        MfgOeeLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            work_center_id=wc1_id,
            log_date="2026-11-01",
            planned_production_time_hrs=16.0,
            operating_time_hrs=14.8,
            ideal_cycle_time_mins=45.0,
            total_pieces=20,
            good_pieces=19,
            availability_pct=92.5,
            performance_pct=95.0,
            quality_pct=95.0,
            oee_score_pct=83.5
        ),
        MfgOeeLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            work_center_id=wc3_id,
            log_date="2026-11-01",
            planned_production_time_hrs=8.0,
            operating_time_hrs=7.4,
            ideal_cycle_time_mins=20.0,
            total_pieces=22,
            good_pieces=22,
            availability_pct=92.5,
            performance_pct=99.1,
            quality_pct=100.0,
            oee_score_pct=91.7
        )
    ]
    for l in oee_logs:
        db.add(l)

    await db.commit()
    return {"message": "Discrete Manufacturing seeded successfully"}
