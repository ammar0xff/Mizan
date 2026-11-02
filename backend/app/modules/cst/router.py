"""API Router for Construction & Contracting ERP module (CST-01..15)."""
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

from app.modules.cst.models import (
    CstProject,
    CstBoqItem,
    CstIpcCertificate,
    CstChangeOrder,
    CstHeavyMachineryLog,
    CstLetterOfGuarantee,
)

router = APIRouter(prefix="/cst", tags=["Construction & Contracting ERP"])

# Pydantic Schemas
class ProjectCreate(BaseModel):
    project_code: str
    project_name: str
    client_name: str
    consultant_name: str
    contract_value_egp: float = 0.0
    start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    retention_rate_pct: float = 5.0
    advance_payment_pct: float = 10.0
    status: str = "in_progress"

class BoqItemCreate(BaseModel):
    project_id: str
    item_code: str
    description: str
    unit: str = "m3"
    planned_quantity: float = 0.0
    unit_rate_egp: float = 0.0

class IpcCreate(BaseModel):
    project_id: str
    ipc_number: str
    period_start: str
    period_end: str
    gross_amount_egp: float
    retention_deduction_egp: float = 0.0
    advance_recovery_egp: float = 0.0
    consultant_approval_date: Optional[str] = None
    consultant_notes: Optional[str] = None

class ChangeOrderCreate(BaseModel):
    project_id: str
    variation_ref: str
    title: str
    scope_description: str
    requested_amount_egp: float
    approved_amount_egp: float
    time_extension_days: int = 0
    status: str = "approved"

class MachineryLogCreate(BaseModel):
    project_id: str
    equipment_tag: str
    equipment_name: str
    operator_name: str
    operating_hours: float
    idle_hours: float = 0.0
    diesel_liters: float = 0.0
    status: str = "operational"
    log_date: str

class GuaranteeCreate(BaseModel):
    project_id: str
    lg_number: str
    bank_name: str
    bond_type: str = "performance_bond"
    amount_egp: float
    cash_margin_pct: float = 15.0
    issue_date: str
    expiry_date: str
    status: str = "active"

# Endpoints
@router.get("/summary")
async def get_cst_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_prjs = await db.execute(select(CstProject).where(CstProject.tenant_id == tenant_id))
    prjs = q_prjs.scalars().all()
    active_projects = sum(1 for p in prjs if p.status in ("in_progress", "planning", "snagging"))
    total_contract_value = sum(p.contract_value_egp for p in prjs)

    q_ipcs = await db.execute(select(CstIpcCertificate).where(CstIpcCertificate.tenant_id == tenant_id))
    ipcs = q_ipcs.scalars().all()
    total_ipc_certified = sum(i.net_payable_egp for i in ipcs if i.status in ("certified", "invoiced", "paid"))

    q_cos = await db.execute(select(CstChangeOrder).where(CstChangeOrder.tenant_id == tenant_id))
    cos = q_cos.scalars().all()
    total_change_orders = sum(c.approved_amount_egp for c in cos if c.status == "approved")

    q_mach = await db.execute(select(CstHeavyMachineryLog).where(CstHeavyMachineryLog.tenant_id == tenant_id))
    mach = q_mach.scalars().all()
    active_machinery = sum(1 for m in mach if m.status == "operational")

    q_lgs = await db.execute(select(CstLetterOfGuarantee).where(CstLetterOfGuarantee.tenant_id == tenant_id, CstLetterOfGuarantee.status == "active"))
    lgs = q_lgs.scalars().all()
    total_lgs = sum(l.amount_egp for l in lgs)

    return {
        "active_projects_count": active_projects,
        "total_contract_value_egp": total_contract_value,
        "total_ipc_certified_egp": total_ipc_certified,
        "total_change_orders_egp": total_change_orders,
        "active_machinery_count": active_machinery,
        "total_guarantees_amount_egp": total_lgs
    }

@router.get("/projects")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(CstProject).where(CstProject.tenant_id == tenant_id).order_by(CstProject.created_at.desc()))
    return q.scalars().all()

@router.post("/projects")
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    project = CstProject(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_code=payload.project_code,
        project_name=payload.project_name,
        client_name=payload.client_name,
        consultant_name=payload.consultant_name,
        contract_value_egp=payload.contract_value_egp,
        start_date=payload.start_date,
        expected_completion_date=payload.expected_completion_date,
        retention_rate_pct=payload.retention_rate_pct,
        advance_payment_pct=payload.advance_payment_pct,
        status=payload.status
    )
    db.add(project)
    await db.commit()
    return project

@router.get("/boq-items")
async def list_boq_items(
    project_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    stmt = select(CstBoqItem).where(CstBoqItem.tenant_id == tenant_id)
    if project_id:
        stmt = stmt.where(CstBoqItem.project_id == project_id)
    q = await db.execute(stmt)
    return q.scalars().all()

@router.post("/boq-items")
async def create_boq_item(
    payload: BoqItemCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    total = payload.planned_quantity * payload.unit_rate_egp
    item = CstBoqItem(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=payload.project_id,
        item_code=payload.item_code,
        description=payload.description,
        unit=payload.unit,
        planned_quantity=payload.planned_quantity,
        unit_rate_egp=payload.unit_rate_egp,
        total_budget_egp=total,
        actual_executed_qty=0.0
    )
    db.add(item)
    await db.commit()
    return item

@router.get("/ipcs")
async def list_ipcs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(CstIpcCertificate).where(CstIpcCertificate.tenant_id == tenant_id).order_by(CstIpcCertificate.created_at.desc()))
    ipcs = q.scalars().all()
    results = []
    for i in ipcs:
        qp = await db.execute(select(CstProject).where(CstProject.id == i.project_id))
        prj = qp.scalar_one_or_none()
        results.append({
            "id": i.id,
            "project_id": i.project_id,
            "project_name": prj.project_name if prj else "Unknown Project",
            "ipc_number": i.ipc_number,
            "period_start": i.period_start,
            "period_end": i.period_end,
            "gross_amount_egp": i.gross_amount_egp,
            "retention_deduction_egp": i.retention_deduction_egp,
            "advance_recovery_egp": i.advance_recovery_egp,
            "net_payable_egp": i.net_payable_egp,
            "status": i.status,
            "consultant_approval_date": i.consultant_approval_date,
            "consultant_notes": i.consultant_notes,
            "created_at": i.created_at.isoformat() if i.created_at else None
        })
    return results

@router.post("/ipcs")
async def create_ipc(
    payload: IpcCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    net = payload.gross_amount_egp - payload.retention_deduction_egp - payload.advance_recovery_egp
    ipc = CstIpcCertificate(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=payload.project_id,
        ipc_number=payload.ipc_number,
        period_start=payload.period_start,
        period_end=payload.period_end,
        gross_amount_egp=payload.gross_amount_egp,
        retention_deduction_egp=payload.retention_deduction_egp,
        advance_recovery_egp=payload.advance_recovery_egp,
        net_payable_egp=net,
        status="certified",
        consultant_approval_date=payload.consultant_approval_date or datetime.utcnow().strftime("%Y-%m-%d"),
        consultant_notes=payload.consultant_notes
    )
    db.add(ipc)
    await db.commit()
    return ipc

@router.get("/change-orders")
async def list_change_orders(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(CstChangeOrder).where(CstChangeOrder.tenant_id == tenant_id).order_by(CstChangeOrder.created_at.desc()))
    cos = q.scalars().all()
    results = []
    for c in cos:
        qp = await db.execute(select(CstProject).where(CstProject.id == c.project_id))
        prj = qp.scalar_one_or_none()
        results.append({
            "id": c.id,
            "project_id": c.project_id,
            "project_name": prj.project_name if prj else "Unknown Project",
            "variation_ref": c.variation_ref,
            "title": c.title,
            "scope_description": c.scope_description,
            "requested_amount_egp": c.requested_amount_egp,
            "approved_amount_egp": c.approved_amount_egp,
            "time_extension_days": c.time_extension_days,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return results

@router.post("/change-orders")
async def create_change_order(
    payload: ChangeOrderCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    order = CstChangeOrder(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=payload.project_id,
        variation_ref=payload.variation_ref,
        title=payload.title,
        scope_description=payload.scope_description,
        requested_amount_egp=payload.requested_amount_egp,
        approved_amount_egp=payload.approved_amount_egp,
        time_extension_days=payload.time_extension_days,
        status=payload.status
    )
    db.add(order)
    await db.commit()
    return order

@router.get("/machinery-logs")
async def list_machinery_logs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(CstHeavyMachineryLog).where(CstHeavyMachineryLog.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/machinery-logs")
async def create_machinery_log(
    payload: MachineryLogCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    log = CstHeavyMachineryLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=payload.project_id,
        equipment_tag=payload.equipment_tag,
        equipment_name=payload.equipment_name,
        operator_name=payload.operator_name,
        operating_hours=payload.operating_hours,
        idle_hours=payload.idle_hours,
        diesel_liters=payload.diesel_liters,
        status=payload.status,
        log_date=payload.log_date
    )
    db.add(log)
    await db.commit()
    return log

@router.get("/guarantees")
async def list_guarantees(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(CstLetterOfGuarantee).where(CstLetterOfGuarantee.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/guarantees")
async def create_guarantee(
    payload: GuaranteeCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    lg = CstLetterOfGuarantee(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=payload.project_id,
        lg_number=payload.lg_number,
        bank_name=payload.bank_name,
        bond_type=payload.bond_type,
        amount_egp=payload.amount_egp,
        cash_margin_pct=payload.cash_margin_pct,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        status=payload.status
    )
    db.add(lg)
    await db.commit()
    return lg

@router.post("/seed")
async def seed_cst_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Construction & Contracting ERP."""
    q_existing = await db.execute(select(CstProject).where(CstProject.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Construction module already seeded"}

    # 1. Projects
    p1_id = str(uuid.uuid4())
    p2_id = str(uuid.uuid4())
    projects = [
        CstProject(
            id=p1_id,
            tenant_id=tenant_id,
            project_code="PRJ-NC-2026-01",
            project_name="أبراج فيندورا بيزنس بارك - العاصمة الإدارية الجديدة",
            client_name="شركة العاصمة الإدارية للتنمية العمرانية (ACUD)",
            consultant_name="دار الهندسة للاستشارات (Dar Al-Handasah)",
            contract_value_egp=185000000.0,
            start_date="2026-01-15",
            expected_completion_date="2027-12-30",
            retention_rate_pct=5.0,
            advance_payment_pct=10.0,
            status="in_progress",
            total_billed_egp=42500000.0,
            total_collected_egp=38000000.0
        ),
        CstProject(
            id=p2_id,
            tenant_id=tenant_id,
            project_code="PRJ-ALX-2026-02",
            project_name="مشروع محور التنمية السياحي والمارينا البحرية - الإسكندرية",
            client_name="هيئة المجتمعات العمرانية الجديدة",
            consultant_name="مكتب الاستشارات الهندسية شاكر (Shaker Consultancy)",
            contract_value_egp=95000000.0,
            start_date="2026-03-01",
            expected_completion_date="2027-06-30",
            retention_rate_pct=5.0,
            advance_payment_pct=10.0,
            status="in_progress",
            total_billed_egp=18200000.0,
            total_collected_egp=15000000.0
        )
    ]
    for p in projects:
        db.add(p)
    await db.flush()

    # 2. BOQ Items
    boqs = [
        CstBoqItem(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            project_id=p1_id,
            item_code="03-30-00-C35",
            description="خرسانة مسلحة سابقة الصب وجاهزة للأعمدة والأسقف رتبة C35 متضمنة مواد العزل والمصنعيات",
            unit="m3",
            planned_quantity=14500.0,
            unit_rate_egp=4850.0,
            total_budget_egp=70325000.0,
            actual_executed_qty=5200.0
        ),
        CstBoqItem(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            project_id=p1_id,
            item_code="05-12-00-STL",
            description="توريد وتركيب حديد تسليح عالي المقاومة B500D قطر 16-32 مم شامل التقطيع والتشكيل والرباط",
            unit="ton",
            planned_quantity=2200.0,
            unit_rate_egp=46500.0,
            total_budget_egp=102300000.0,
            actual_executed_qty=850.0
        )
    ]
    for b in boqs:
        db.add(b)

    # 3. IPCs
    ipc = CstIpcCertificate(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=p1_id,
        ipc_number="IPC-004-NOV2026",
        period_start="2026-10-01",
        period_end="2026-10-31",
        gross_amount_egp=12500000.0,
        retention_deduction_egp=625000.0,
        advance_recovery_egp=1250000.0,
        net_payable_egp=10625000.0,
        status="certified",
        consultant_approval_date="2026-11-01",
        consultant_notes="تمت مراجعة حصر الأعمال المنفذة ومطابقتها لتقارير ضبط الجودة واختبارات مكعبات الخرسانة (7 و 28 يوم)."
    )
    db.add(ipc)

    # 4. Change Orders
    co = CstChangeOrder(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=p1_id,
        variation_ref="VO-NC-2026-001",
        title="تعديل مواصفات واجهات الكلادينج والزجاج المزدوج المقسى لعزل حراري أعلى (Low-E Double Glazed)",
        scope_description="استبدال مواصفة الزجاج الفردي بواجهات زجاجية موفرة للطاقة معتمدة من LEED Platinum",
        requested_amount_egp=8500000.0,
        approved_amount_egp=7800000.0,
        time_extension_days=35,
        status="approved"
    )
    db.add(co)

    # 5. Heavy Machinery
    mach = [
        CstHeavyMachineryLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            project_id=p1_id,
            equipment_tag="EQ-TCRANE-01",
            equipment_name="رافعة برجية Liebherr 280 EC-H 12 (ذراع 70 متر)",
            operator_name="الأسطى بدوي شحاتة",
            operating_hours=9.5,
            idle_hours=1.0,
            diesel_liters=180.0,
            status="operational",
            log_date="2026-11-02"
        ),
        CstHeavyMachineryLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            project_id=p1_id,
            equipment_tag="EQ-EXCAV-02",
            equipment_name="حفار هيدروليكي CAT 336D2 مع جاك شاكوش تكسير صخور",
            operator_name="الأسطى رجب السوهاجي",
            operating_hours=8.0,
            idle_hours=0.5,
            diesel_liters=240.0,
            status="operational",
            log_date="2026-11-02"
        )
    ]
    for m in mach:
        db.add(m)

    # 6. Letter of Guarantee
    lg = CstLetterOfGuarantee(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        project_id=p1_id,
        lg_number="LG-NBE-PERF-2026-8812",
        bank_name="البنك الأهلي المصري (NBE) - فرع العاصمة الإدارية",
        bond_type="performance_bond",
        amount_egp=9250000.0,
        cash_margin_pct=15.0,
        issue_date="2026-01-10",
        expiry_date="2028-02-28",
        status="active"
    )
    db.add(lg)

    await db.commit()
    return {"message": "Construction module seeded successfully"}
