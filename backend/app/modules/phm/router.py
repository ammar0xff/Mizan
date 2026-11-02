"""API Router for Pharmaceutical & Chemical GMP Manufacturing module (PHM-01..12)."""
from __future__ import annotations

import hashlib
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

from app.modules.phm.models import (
    PhmMasterFormula,
    PhmElectronicBatchRecord,
    PhmQpRelease,
    PhmDeviationCapa,
    PhmCleanInPlaceLog,
    PhmStabilityStudy,
)

router = APIRouter(prefix="/phm", tags=["Pharmaceutical & Chemical GMP Manufacturing"])

# Pydantic Schemas
class FormulaCreate(BaseModel):
    product_code: str
    generic_name: str
    brand_name: str
    dosage_form: str = "Tablets"
    strength: str = "500 mg"
    master_batch_size: float = 100000.0
    batch_unit: str = "Tabs"
    shelf_life_months: int = 36
    registration_no: str

class EbrCreate(BaseModel):
    ebr_number: str
    formula_id: Optional[str] = None
    batch_lot: str
    planned_yield: float = 100000.0
    primary_operator: str
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None

class EbrStepAdvance(BaseModel):
    next_step: str
    actual_yield: Optional[float] = None
    witness_signoff_by: str
    electronic_signature_reason: str = "Verification of critical processing step as per BMR"

class QpReleaseCreate(BaseModel):
    ebr_id: str
    qp_name: str
    qp_license_no: str
    release_status: str = "approved"
    disposition_reason: str = "All critical quality attributes conform to pharmacopeial specifications."
    signature_password: str

class DeviationCreate(BaseModel):
    deviation_ref: str
    ebr_id: Optional[str] = None
    deviation_type: str = "minor"
    root_cause_category: str = "Equipment"
    root_cause_details: str
    capa_action_plan: str
    assigned_qa_lead: str
    target_completion_date: Optional[str] = None

class CipLogCreate(BaseModel):
    vessel_name: str
    previous_product: str
    next_product: str
    cleaning_agent: str = "NaOH 2% + WFI Rinse"
    rinse_conductivity_us: float = 1.1
    swab_test_result: str = "Negative (< 10 ppm)"
    line_clearance_signoff_by: str
    cleaned_at: str

class StabilityStudyCreate(BaseModel):
    study_ref: str
    product_code: str
    storage_condition: str = "Zone IVb (30°C / 75% RH)"
    timepoint_months: int = 6
    assay_pct: float = 99.4
    degradation_products_pct: float = 0.2
    status: str = "conforms"

# Endpoints
@router.get("/summary")
async def get_phm_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_ebrs = await db.execute(select(PhmElectronicBatchRecord).where(PhmElectronicBatchRecord.tenant_id == tenant_id))
    ebrs = q_ebrs.scalars().all()

    active_ebrs = sum(1 for e in ebrs if e.status in ("in_process", "qa_hold"))
    pending_qp = sum(1 for e in ebrs if e.status == "qa_hold")
    released_batches = sum(1 for e in ebrs if e.status == "qp_released")

    q_devs = await db.execute(select(PhmDeviationCapa).where(PhmDeviationCapa.tenant_id == tenant_id, PhmDeviationCapa.status != "closed"))
    open_deviations = len(q_devs.scalars().all())

    q_cip = await db.execute(select(PhmCleanInPlaceLog).where(PhmCleanInPlaceLog.tenant_id == tenant_id))
    cip_cleared = len(q_cip.scalars().all())

    q_formulas = await db.execute(select(PhmMasterFormula).where(PhmMasterFormula.tenant_id == tenant_id))
    total_formulas = len(q_formulas.scalars().all())

    return {
        "active_ebr_batches_count": active_ebrs,
        "pending_qp_release_count": pending_qp,
        "released_batches_count": released_batches,
        "open_deviations_capa_count": open_deviations,
        "line_clearance_records_count": cip_cleared,
        "master_formulas_count": total_formulas
    }

@router.get("/formulas")
async def list_formulas(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmMasterFormula).where(PhmMasterFormula.tenant_id == tenant_id).order_by(PhmMasterFormula.created_at.desc()))
    return q.scalars().all()

@router.post("/formulas")
async def create_formula(
    payload: FormulaCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    formula = PhmMasterFormula(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        product_code=payload.product_code,
        generic_name=payload.generic_name,
        brand_name=payload.brand_name,
        dosage_form=payload.dosage_form,
        strength=payload.strength,
        master_batch_size=payload.master_batch_size,
        batch_unit=payload.batch_unit,
        shelf_life_months=payload.shelf_life_months,
        registration_no=payload.registration_no
    )
    db.add(formula)
    await db.commit()
    return formula

@router.get("/ebrs")
async def list_ebrs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmElectronicBatchRecord).where(PhmElectronicBatchRecord.tenant_id == tenant_id).order_by(PhmElectronicBatchRecord.created_at.desc()))
    ebrs = q.scalars().all()
    results = []
    for e in ebrs:
        product_name = None
        if e.formula_id:
            qf = await db.execute(select(PhmMasterFormula).where(PhmMasterFormula.id == e.formula_id))
            f = qf.scalar_one_or_none()
            if f:
                product_name = f"{f.brand_name} ({f.strength})"
        results.append({
            "id": e.id,
            "ebr_number": e.ebr_number,
            "formula_id": e.formula_id,
            "product_name": product_name,
            "batch_lot": e.batch_lot,
            "planned_yield": e.planned_yield,
            "actual_yield": e.actual_yield,
            "current_step": e.current_step,
            "status": e.status,
            "primary_operator": e.primary_operator,
            "witness_signoff_by": e.witness_signoff_by,
            "witness_timestamp": e.witness_timestamp,
            "manufacturing_date": e.manufacturing_date,
            "expiry_date": e.expiry_date,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return results

@router.post("/ebrs")
async def create_ebr(
    payload: EbrCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ebr = PhmElectronicBatchRecord(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        ebr_number=payload.ebr_number,
        formula_id=payload.formula_id,
        batch_lot=payload.batch_lot,
        planned_yield=payload.planned_yield,
        actual_yield=0.0,
        current_step="dispensing",
        status="in_process",
        primary_operator=payload.primary_operator,
        manufacturing_date=payload.manufacturing_date,
        expiry_date=payload.expiry_date
    )
    db.add(ebr)
    await db.commit()
    return ebr

@router.post("/ebrs/{id}/step")
async def advance_ebr_step(
    id: str,
    payload: EbrStepAdvance,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmElectronicBatchRecord).where(PhmElectronicBatchRecord.id == id, PhmElectronicBatchRecord.tenant_id == tenant_id))
    ebr = q.scalar_one_or_none()
    if not ebr:
        raise HTTPException(status_code=404, detail="EBR batch record not found")
    
    ebr.current_step = payload.next_step
    if payload.actual_yield is not None:
        ebr.actual_yield = payload.actual_yield
    
    ebr.witness_signoff_by = payload.witness_signoff_by
    ebr.witness_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    if payload.next_step in ["packaging_complete", "qa_review"]:
        ebr.status = "qa_hold"
        
    await db.commit()
    return ebr

@router.get("/qp-releases")
async def list_qp_releases(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmQpRelease).where(PhmQpRelease.tenant_id == tenant_id).order_by(PhmQpRelease.signed_at.desc()))
    releases = q.scalars().all()
    results = []
    for r in releases:
        qe = await db.execute(select(PhmElectronicBatchRecord).where(PhmElectronicBatchRecord.id == r.ebr_id))
        ebr = qe.scalar_one_or_none()
        results.append({
            "id": r.id,
            "release_cert_ref": r.release_cert_ref,
            "ebr_id": r.ebr_id,
            "batch_lot": ebr.batch_lot if ebr else "Unknown",
            "qp_name": r.qp_name,
            "qp_license_no": r.qp_license_no,
            "release_status": r.release_status,
            "disposition_reason": r.disposition_reason,
            "digital_signature_hash": r.digital_signature_hash,
            "signed_at": r.signed_at.isoformat() if r.signed_at else None
        })
    return results

@router.post("/qp-releases")
async def create_qp_release(
    payload: QpReleaseCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmElectronicBatchRecord).where(PhmElectronicBatchRecord.id == payload.ebr_id, PhmElectronicBatchRecord.tenant_id == tenant_id))
    ebr = q.scalar_one_or_none()
    if not ebr:
        raise HTTPException(status_code=404, detail="Target batch record not found")
        
    raw_sig = f"{payload.qp_name}:{payload.qp_license_no}:{ebr.batch_lot}:{payload.signature_password}:{datetime.utcnow().isoformat()}"
    sig_hash = hashlib.sha256(raw_sig.encode()).hexdigest()
    
    cert_ref = f"QP-REL-{ebr.batch_lot}-{uuid.uuid4().hex[:4].upper()}"
    rel = PhmQpRelease(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        release_cert_ref=cert_ref,
        ebr_id=payload.ebr_id,
        qp_name=payload.qp_name,
        qp_license_no=payload.qp_license_no,
        release_status=payload.release_status,
        disposition_reason=payload.disposition_reason,
        digital_signature_hash=f"SHA256:{sig_hash[:32]}"
    )
    db.add(rel)
    
    if payload.release_status == "approved":
        ebr.status = "qp_released"
    else:
        ebr.status = "rejected"
        
    await db.commit()
    return rel

@router.get("/deviations")
async def list_deviations(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmDeviationCapa).where(PhmDeviationCapa.tenant_id == tenant_id).order_by(PhmDeviationCapa.created_at.desc()))
    devs = q.scalars().all()
    results = []
    for d in devs:
        batch_lot = "Facility-Wide"
        if d.ebr_id:
            qe = await db.execute(select(PhmElectronicBatchRecord).where(PhmElectronicBatchRecord.id == d.ebr_id))
            e = qe.scalar_one_or_none()
            if e:
                batch_lot = e.batch_lot
        results.append({
            "id": d.id,
            "deviation_ref": d.deviation_ref,
            "ebr_id": d.ebr_id,
            "batch_lot": batch_lot,
            "deviation_type": d.deviation_type,
            "root_cause_category": d.root_cause_category,
            "root_cause_details": d.root_cause_details,
            "capa_action_plan": d.capa_action_plan,
            "assigned_qa_lead": d.assigned_qa_lead,
            "target_completion_date": d.target_completion_date,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None
        })
    return results

@router.post("/deviations")
async def create_deviation(
    payload: DeviationCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    dev = PhmDeviationCapa(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        deviation_ref=payload.deviation_ref,
        ebr_id=payload.ebr_id,
        deviation_type=payload.deviation_type,
        root_cause_category=payload.root_cause_category,
        root_cause_details=payload.root_cause_details,
        capa_action_plan=payload.capa_action_plan,
        assigned_qa_lead=payload.assigned_qa_lead,
        target_completion_date=payload.target_completion_date,
        status="under_investigation"
    )
    db.add(dev)
    await db.commit()
    return dev

@router.get("/cip-logs")
async def list_cip_logs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmCleanInPlaceLog).where(PhmCleanInPlaceLog.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/cip-logs")
async def create_cip_log(
    payload: CipLogCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    log = PhmCleanInPlaceLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        vessel_name=payload.vessel_name,
        previous_product=payload.previous_product,
        next_product=payload.next_product,
        cleaning_agent=payload.cleaning_agent,
        rinse_conductivity_us=payload.rinse_conductivity_us,
        swab_test_result=payload.swab_test_result,
        line_clearance_signoff_by=payload.line_clearance_signoff_by,
        cleaned_at=payload.cleaned_at
    )
    db.add(log)
    await db.commit()
    return log

@router.get("/stability-studies")
async def list_stability_studies(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(PhmStabilityStudy).where(PhmStabilityStudy.tenant_id == tenant_id).order_by(PhmStabilityStudy.tested_at.desc()))
    return q.scalars().all()

@router.post("/stability-studies")
async def create_stability_study(
    payload: StabilityStudyCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    study = PhmStabilityStudy(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        study_ref=payload.study_ref,
        product_code=payload.product_code,
        storage_condition=payload.storage_condition,
        timepoint_months=payload.timepoint_months,
        assay_pct=payload.assay_pct,
        degradation_products_pct=payload.degradation_products_pct,
        status=payload.status
    )
    db.add(study)
    await db.commit()
    return study

@router.post("/seed")
async def seed_phm_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Pharmaceutical & Chemical GMP Manufacturing."""
    q_existing = await db.execute(select(PhmMasterFormula).where(PhmMasterFormula.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Pharma module already seeded"}

    # 1. Master Formulas
    f1_id = str(uuid.uuid4())
    f2_id = str(uuid.uuid4())
    formulas = [
        PhmMasterFormula(
            id=f1_id,
            tenant_id=tenant_id,
            product_code="PHM-AMX-500",
            generic_name="Amoxicillin Trihydrate + Clavulanate Potassium",
            brand_name="أوجمنتين فورت 500/125 مجم أقراص مغلفة",
            dosage_form="Film-Coated Tablets",
            strength="625 mg",
            master_batch_size=200000.0,
            batch_unit="Tabs",
            shelf_life_months=24,
            registration_no="EDA-REG-2024-88412"
        ),
        PhmMasterFormula(
            id=f2_id,
            tenant_id=tenant_id,
            product_code="PHM-PAR-1000",
            generic_name="Paracetamol Infusion Sterile",
            brand_name="باراسيتامول فيال وريدي 10 مجم/مل 100 مل",
            dosage_form="Sterile IV Infusion",
            strength="1000 mg / 100 ml",
            master_batch_size=20000.0,
            batch_unit="Vials",
            shelf_life_months=36,
            registration_no="EDA-REG-2023-77190"
        )
    ]
    for f in formulas:
        db.add(f)
    await db.flush()

    # 2. EBR Records
    ebr1_id = str(uuid.uuid4())
    ebr2_id = str(uuid.uuid4())
    ebrs = [
        PhmElectronicBatchRecord(
            id=ebr1_id,
            tenant_id=tenant_id,
            ebr_number="EBR-2026-AUG-01",
            formula_id=f1_id,
            batch_lot="LOT-AUG-2601",
            planned_yield=200000.0,
            actual_yield=198400.0,
            current_step="coating",
            status="in_process",
            primary_operator="صيدلي / أحمد الجندي (مشرف قسم الحبيبات والضغط)",
            witness_signoff_by="د. منى عبد الفتاح (توكيد الجودة QA)",
            witness_timestamp="2026-11-02 09:40 UTC",
            manufacturing_date="2026-11-01",
            expiry_date="2028-10-31"
        ),
        PhmElectronicBatchRecord(
            id=ebr2_id,
            tenant_id=tenant_id,
            ebr_number="EBR-2026-PAR-02",
            formula_id=f2_id,
            batch_lot="LOT-PAR-2602",
            planned_yield=20000.0,
            actual_yield=19950.0,
            current_step="sterile_filling_autoclave",
            status="qa_hold",
            primary_operator="كيميائي / سامي العسال",
            witness_signoff_by="د. طارق مرزوق (مدير توكيد الجودة)",
            witness_timestamp="2026-11-01 16:20 UTC",
            manufacturing_date="2026-10-30",
            expiry_date="2029-10-29"
        ),
        PhmElectronicBatchRecord(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            ebr_number="EBR-2026-AUG-99",
            formula_id=f1_id,
            batch_lot="LOT-AUG-2599",
            planned_yield=200000.0,
            actual_yield=198900.0,
            current_step="packaging_complete",
            status="qp_released",
            primary_operator="صيدلي / أحمد الجندي",
            witness_signoff_by="د. منى عبد الفتاح",
            witness_timestamp="2026-10-28 14:15 UTC",
            manufacturing_date="2026-10-25",
            expiry_date="2028-10-24"
        )
    ]
    for e in ebrs:
        db.add(e)
    await db.flush()

    # 3. QP Releases
    rel = PhmQpRelease(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        release_cert_ref="QP-CERT-2026-0042",
        ebr_id=ebr2_id,
        qp_name="د. طارق مرزوق (Qualified Person)",
        qp_license_no="EDA-QP-LIC-7749",
        release_status="approved",
        disposition_reason="تم مراجعة سجل التشغيلة BMR وفحوصات العقامة Sterility وفحص السموم البيروجينية Endotoxins - مطابقة لدستور الأدوية الأوروبي EP",
        digital_signature_hash="SHA256:d8a94bc72e118f6291a273c509b84fa1"
    )
    db.add(rel)

    # 4. Deviations & CAPA
    dev = PhmDeviationCapa(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        deviation_ref="DEV-2026-014",
        ebr_id=ebr1_id,
        deviation_type="minor",
        root_cause_category="Equipment",
        root_cause_details="تذبذب في ضغط الهواء لكابينة الطلاء الأوتوماتيكي لمدة 4 دقائق بسبب تبديل فلتر الهواء المركزي",
        capa_action_plan="1) فحص عينات إضافية من الأقراص للتأكد من تجانس سماكة الغلاف.\n2) إضافة حساس إنذار مبكر لفرق ضغط الفلاتر في جدول الصيانة الوقائية PM.",
        assigned_qa_lead="د. منى عبد الفتاح",
        target_completion_date="2026-11-15",
        status="under_investigation"
    )
    db.add(dev)

    # 5. CIP Logs
    cip = PhmCleanInPlaceLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        vessel_name="مفاعل المزج والتحضير المعقم ريكتور R-102 (Sterile Tank)",
        previous_product="باراسيتامول فيال وريدي 100 مل",
        next_product="سيفترياكسون معلق وريدي",
        cleaning_agent="دورة CIP كاملة: شطف WFI ساخن 80°C + هيدروكسيد صوديوم 2% + تعقيم بالبخار SIP 121°C",
        rinse_conductivity_us=0.85,
        swab_test_result="مطابق - عدم وجود أي بقايا دوائية (< 5 ppm TOC)",
        line_clearance_signoff_by="د. هبة رضوان (مفتش ضبط الجودة)",
        cleaned_at="2026-11-02 06:30"
    )
    db.add(cip)

    # 6. Stability Studies
    stab = PhmStabilityStudy(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        study_ref="STAB-AUG-IVb-12M",
        product_code="PHM-AMX-500",
        storage_condition="Zone IVb (30°C / 75% RH)",
        timepoint_months=12,
        assay_pct=99.2,
        degradation_products_pct=0.31,
        status="conforms"
    )
    db.add(stab)

    await db.commit()
    return {"message": "Pharmaceutical GMP seeded successfully"}
