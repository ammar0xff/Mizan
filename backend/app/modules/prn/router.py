"""API Router for Printing & Packaging ERP module (PRN-01..10)."""
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

from app.modules.prn.models import (
    PrnJobDocket,
    PrnImpositionPlan,
    PrnPressMachine,
    PrnInkFormula,
    PrnFinishingLog,
)

router = APIRouter(prefix="/prn", tags=["Printing & Packaging ERP"])

# Pydantic Schemas
class ImpositionCreate(BaseModel):
    sheet_size: str = "70 x 100 cm"
    pages_per_sheet: int = 8
    sheet_yield_count: int = 8
    total_sheets_required: int = 650
    make_ready_sheets: int = 150
    expected_spoilage_pct: float = 3.5
    layout_type: str = "Work & Turn (قلب مسطح)"

class JobDocketCreate(BaseModel):
    docket_no: str
    client_name: str
    job_title: str
    run_quantity: int = 5000
    finished_width_mm: float = 210.0
    finished_height_mm: float = 297.0
    paper_type: str = "كوشيه لامع فاخر (Gloss Art Paper)"
    gsm: int = 150
    colors_front: str = "4C (CMYK)"
    colors_back: str = "4C (CMYK)"
    lamination: str = "سلوفان مط (Matte Thermal)"
    binding: str = "تطبيق وتدبيس سرج (Saddle Stitch)"
    delivery_deadline: Optional[str] = None
    total_cost_egp: float = 0.0
    notes: Optional[str] = None
    imposition: Optional[ImpositionCreate] = None

class DocketStatusUpdate(BaseModel):
    status: str
    total_cost_egp: Optional[float] = None
    notes: Optional[str] = None

class MachineCreate(BaseModel):
    machine_code: str
    machine_name: str
    machine_type: str = "offset_sheetfed"
    hourly_rate_egp: float = 1250.0
    max_speed_sph: int = 15000
    status: str = "idle"

class InkFormulaCreate(BaseModel):
    docket_id: Optional[str] = None
    ink_name: str
    coverage_pct: float = 35.0
    estimated_ink_kg: float = 4.5
    actual_ink_kg: float = 4.2
    batch_lot: str = "INK-LOT-8821"

class FinishingLogCreate(BaseModel):
    docket_id: str
    operation_name: str
    operator_name: str
    completed_pieces: int = 5000
    defective_pieces: int = 42
    machine_hours_spent: float = 2.5
    status: str = "completed"

# Endpoints
@router.get("/summary")
async def get_prn_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_dockets = await db.execute(select(PrnJobDocket).where(PrnJobDocket.tenant_id == tenant_id))
    dockets = q_dockets.scalars().all()

    active_dockets = sum(1 for d in dockets if d.status in ("prepress", "plate_ctp", "on_press", "postpress_finishing"))
    completed_dockets = sum(1 for d in dockets if d.status in ("packed_ready", "delivered"))

    q_machines = await db.execute(select(PrnPressMachine).where(PrnPressMachine.tenant_id == tenant_id))
    machines = q_machines.scalars().all()
    running_presses = sum(1 for m in machines if m.status in ("printing", "make_ready"))

    q_imp = await db.execute(select(PrnImpositionPlan).where(PrnImpositionPlan.tenant_id == tenant_id))
    plans = q_imp.scalars().all()
    total_sheets = sum(p.total_sheets_required for p in plans)
    avg_spoilage = round(sum(p.expected_spoilage_pct for p in plans) / len(plans), 1) if plans else 3.2

    return {
        "active_job_dockets_count": active_dockets,
        "completed_dockets_count": completed_dockets,
        "running_presses_count": running_presses,
        "total_presses_count": len(machines),
        "total_sheets_allocated": total_sheets,
        "average_spoilage_rate_pct": avg_spoilage
    }

@router.get("/dockets")
async def list_dockets(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PrnJobDocket).where(PrnJobDocket.tenant_id == tenant_id).order_by(PrnJobDocket.created_at.desc()))
    dockets = q.scalars().all()
    results = []
    for d in dockets:
        qi = await db.execute(select(PrnImpositionPlan).where(PrnImpositionPlan.docket_id == d.id))
        imp = qi.scalar_one_or_none()
        results.append({
            "id": d.id,
            "docket_no": d.docket_no,
            "client_name": d.client_name,
            "job_title": d.job_title,
            "run_quantity": d.run_quantity,
            "finished_dimensions": f"{d.finished_width_mm}x{d.finished_height_mm} mm",
            "paper_type": d.paper_type,
            "gsm": d.gsm,
            "colors": f"{d.colors_front} / {d.colors_back}",
            "lamination": d.lamination,
            "binding": d.binding,
            "status": d.status,
            "delivery_deadline": d.delivery_deadline,
            "total_cost_egp": d.total_cost_egp,
            "notes": d.notes,
            "imposition": {
                "sheet_size": imp.sheet_size,
                "pages_per_sheet": imp.pages_per_sheet,
                "total_sheets_required": imp.total_sheets_required,
                "make_ready_sheets": imp.make_ready_sheets,
                "expected_spoilage_pct": imp.expected_spoilage_pct,
                "layout_type": imp.layout_type,
            } if imp else None,
            "created_at": d.created_at.isoformat() if d.created_at else None
        })
    return results

@router.post("/dockets")
async def create_docket(
    payload: JobDocketCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    docket_id = str(uuid.uuid4())
    docket = PrnJobDocket(
        id=docket_id,
        tenant_id=tenant_id,
        docket_no=payload.docket_no,
        client_name=payload.client_name,
        job_title=payload.job_title,
        run_quantity=payload.run_quantity,
        finished_width_mm=payload.finished_width_mm,
        finished_height_mm=payload.finished_height_mm,
        paper_type=payload.paper_type,
        gsm=payload.gsm,
        colors_front=payload.colors_front,
        colors_back=payload.colors_back,
        lamination=payload.lamination,
        binding=payload.binding,
        delivery_deadline=payload.delivery_deadline,
        total_cost_egp=payload.total_cost_egp,
        notes=payload.notes,
        status="prepress"
    )
    db.add(docket)
    await db.flush()

    imp = payload.imposition or ImpositionCreate()
    db.add(PrnImpositionPlan(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        docket_id=docket_id,
        sheet_size=imp.sheet_size,
        pages_per_sheet=imp.pages_per_sheet,
        sheet_yield_count=imp.sheet_yield_count,
        total_sheets_required=imp.total_sheets_required,
        make_ready_sheets=imp.make_ready_sheets,
        expected_spoilage_pct=imp.expected_spoilage_pct,
        layout_type=imp.layout_type
    ))

    await db.commit()
    return docket

@router.post("/dockets/{id}/status")
async def update_docket_status(
    id: str,
    payload: DocketStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PrnJobDocket).where(PrnJobDocket.id == id, PrnJobDocket.tenant_id == tenant_id))
    docket = q.scalar_one_or_none()
    if not docket:
        raise HTTPException(status_code=404, detail="Job docket not found")
        
    docket.status = payload.status
    if payload.total_cost_egp is not None:
        docket.total_cost_egp = payload.total_cost_egp
    if payload.notes:
        docket.notes = payload.notes
        
    await db.commit()
    return docket

@router.get("/machines")
async def list_machines(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PrnPressMachine).where(PrnPressMachine.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/machines")
async def create_machine(
    payload: MachineCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    machine = PrnPressMachine(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        machine_code=payload.machine_code,
        machine_name=payload.machine_name,
        machine_type=payload.machine_type,
        hourly_rate_egp=payload.hourly_rate_egp,
        max_speed_sph=payload.max_speed_sph,
        status=payload.status
    )
    db.add(machine)
    await db.commit()
    return machine

@router.get("/ink-formulas")
async def list_ink_formulas(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PrnInkFormula).where(PrnInkFormula.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/ink-formulas")
async def create_ink_formula(
    payload: InkFormulaCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    formula = PrnInkFormula(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        docket_id=payload.docket_id,
        ink_name=payload.ink_name,
        coverage_pct=payload.coverage_pct,
        estimated_ink_kg=payload.estimated_ink_kg,
        actual_ink_kg=payload.actual_ink_kg,
        batch_lot=payload.batch_lot
    )
    db.add(formula)
    await db.commit()
    return formula

@router.get("/finishing-logs")
async def list_finishing_logs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PrnFinishingLog).where(PrnFinishingLog.tenant_id == tenant_id))
    logs = q.scalars().all()
    results = []
    for l in logs:
        qd = await db.execute(select(PrnJobDocket).where(PrnJobDocket.id == l.docket_id))
        docket = qd.scalar_one_or_none()
        results.append({
            "id": l.id,
            "docket_id": l.docket_id,
            "docket_no": docket.docket_no if docket else "Unknown",
            "job_title": docket.job_title if docket else "",
            "operation_name": l.operation_name,
            "operator_name": l.operator_name,
            "completed_pieces": l.completed_pieces,
            "defective_pieces": l.defective_pieces,
            "machine_hours_spent": l.machine_hours_spent,
            "status": l.status
        })
    return results

@router.post("/finishing-logs")
async def create_finishing_log(
    payload: FinishingLogCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    log = PrnFinishingLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        docket_id=payload.docket_id,
        operation_name=payload.operation_name,
        operator_name=payload.operator_name,
        completed_pieces=payload.completed_pieces,
        defective_pieces=payload.defective_pieces,
        machine_hours_spent=payload.machine_hours_spent,
        status=payload.status
    )
    db.add(log)
    await db.commit()
    return log

@router.post("/seed")
async def seed_prn_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Printing & Packaging ERP."""
    q_existing = await db.execute(select(PrnJobDocket).where(PrnJobDocket.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Printing module already seeded"}

    # 1. Press Machines (MHR)
    m1_id = str(uuid.uuid4())
    m2_id = str(uuid.uuid4())
    m3_id = str(uuid.uuid4())
    machines = [
        PrnPressMachine(
            id=m1_id,
            tenant_id=tenant_id,
            machine_code="PRS-HD-102",
            machine_name="ماكينة هايدلبرج سبيد ماستر 5 ألوان Heidelberg XL 102",
            machine_type="offset_sheetfed",
            hourly_rate_egp=1850.0,
            max_speed_sph=16000,
            status="printing"
        ),
        PrnPressMachine(
            id=m2_id,
            tenant_id=tenant_id,
            machine_code="PRS-BOBST-01",
            machine_name="ماكينة تكسير وريجة أوتوماتيكية بوبست Bobst Novacut",
            machine_type="die_cutter",
            hourly_rate_egp=950.0,
            max_speed_sph=9000,
            status="make_ready"
        ),
        PrnPressMachine(
            id=m3_id,
            tenant_id=tenant_id,
            machine_code="PRS-GLUE-02",
            machine_name="خط لصق وتطبيق العلب الكرتونية Folder Gluer",
            machine_type="folder_gluer",
            hourly_rate_egp=750.0,
            max_speed_sph=25000,
            status="idle"
        )
    ]
    for m in machines:
        db.add(m)
    await db.flush()

    # 2. Job Dockets & Impositions
    d1_id = str(uuid.uuid4())
    d2_id = str(uuid.uuid4())
    dockets = [
        PrnJobDocket(
            id=d1_id,
            tenant_id=tenant_id,
            docket_no="JCK-2026-9011",
            client_name="شركة نستله مصر للصناعات الغذائية",
            job_title="علب كرتون نسكافيه 3في1 - 24 باكت (Duplex 350 GSM)",
            run_quantity=50000,
            finished_width_mm=140.0,
            finished_height_mm=210.0,
            paper_type="دوبلكس ظهر رمادي أوروبي Duplex Board",
            gsm=350,
            colors_front="5C (CMYK + Pantone Red 032C)",
            colors_back="1C (Black Instructions)",
            lamination="ورنيش مائي لامع Food-Grade Water Varnish",
            binding="تكسير ليزر ولصق قاع أوتوماتيك Crash-Lock Bottom",
            status="on_press",
            delivery_deadline="2026-11-12",
            total_cost_egp=142500.0,
            notes="فحص جودة الشد والألوان كل 2000 فرخ بمقياس Spectrophotometer"
        ),
        PrnJobDocket(
            id=d2_id,
            tenant_id=tenant_id,
            docket_no="JCK-2026-9012",
            client_name="بنك مصر - قطاع التسويق والاتصال المؤسسي",
            job_title="كتالوج الخدمات المصرفية لكبار العملاء (Annual Report)",
            run_quantity=3000,
            finished_width_mm=210.0,
            finished_height_mm=297.0,
            paper_type="كوشيه فاخر مطفي كوندات ألماني Condat Silk",
            gsm=200,
            colors_front="4C (CMYK)",
            colors_back="4C (CMYK)",
            lamination="سلوفان حراري مط + سبوت يو في بارز Spot UV",
            binding="غلاف كرتون مقوى وخياطة وتجليد Hardcover Bound",
            status="plate_ctp",
            delivery_deadline="2026-11-20",
            total_cost_egp=68000.0,
            notes="تسليم عينة مونتاج بروف رقمي Cromalin قبل الطباعة"
        ),
        PrnJobDocket(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            docket_no="JCK-2026-8980",
            client_name="مجموعة صيدليات العزبي",
            job_title="أكياس ورقية صديقة للبيئة كرافت بني 100 جم",
            run_quantity=100000,
            finished_width_mm=240.0,
            finished_height_mm=320.0,
            paper_type="ورق كرافت طبيعي Virgin Brown Kraft",
            gsm=100,
            colors_front="2C (Pantone Green 347C + Dark Blue)",
            colors_back="0C (Blank)",
            lamination="بدون سلوفان",
            binding="تخريم ويد حبل قطني مبروم",
            status="packed_ready",
            delivery_deadline="2026-11-01",
            total_cost_egp=115000.0,
            notes="جاهز للشحن في باليتات استرتش"
        )
    ]
    for d in dockets:
        db.add(d)
    await db.flush()

    impositions = [
        PrnImpositionPlan(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            docket_id=d1_id,
            sheet_size="70 x 100 cm",
            pages_per_sheet=6,
            sheet_yield_count=6,
            total_sheets_required=8650,
            make_ready_sheets=350,
            expected_spoilage_pct=4.0,
            layout_type="تجميع علب متداخل Imposition Nesting"
        ),
        PrnImpositionPlan(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            docket_id=d2_id,
            sheet_size="70 x 100 cm",
            pages_per_sheet=8,
            sheet_yield_count=8,
            total_sheets_required=2800,
            make_ready_sheets=150,
            expected_spoilage_pct=2.5,
            layout_type="Work & Turn (قلب مسطح)"
        )
    ]
    for imp in impositions:
        db.add(imp)

    # 3. Ink Formulas
    inks = [
        PrnInkFormula(id=str(uuid.uuid4()), tenant_id=tenant_id, docket_id=d1_id, ink_name="Pantone Red 032C Spot Ink", coverage_pct=28.5, estimated_ink_kg=14.2, actual_ink_kg=13.8, batch_lot="INK-PAN-RED-991"),
        PrnInkFormula(id=str(uuid.uuid4()), tenant_id=tenant_id, docket_id=d1_id, ink_name="Process Cyan SunChemical Euro", coverage_pct=42.0, estimated_ink_kg=22.5, actual_ink_kg=23.1, batch_lot="INK-CYAN-SUN-882"),
    ]
    for i in inks:
        db.add(i)

    # 4. Finishing Logs
    finishing = [
        PrnFinishingLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            docket_id=d1_id,
            operation_name="تكسير وريجة Bobst Die-Cutting",
            operator_name="الفني / رأفت عبد المنعم",
            completed_pieces=32000,
            defective_pieces=120,
            machine_hours_spent=4.2,
            status="in_progress"
        ),
        PrnFinishingLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            docket_id=d1_id,
            operation_name="سلوفان حراري وورنيش مائي",
            operator_name="الفني / هاني منصور",
            completed_pieces=50000,
            defective_pieces=210,
            machine_hours_spent=5.0,
            status="completed"
        )
    ]
    for fl in finishing:
        db.add(fl)

    await db.commit()
    return {"message": "Printing & Packaging seeded successfully"}
