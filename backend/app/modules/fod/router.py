"""API Router for Food & Beverage Process Manufacturing module (FOD-01..12)."""
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

from app.modules.fod.models import (
    FodRecipe,
    FodRecipeIngredient,
    FodBatchOrder,
    FodHaccpLog,
    FodQaLabSample,
    FodTraceabilityRecall,
)

router = APIRouter(prefix="/fod", tags=["Food & Beverage Process Manufacturing"])

# Pydantic Schemas
class IngredientCreate(BaseModel):
    ingredient_code: str
    ingredient_name: str
    standard_qty: float = 100.0
    uom: str = "KG"
    potency_factor: float = 1.0
    is_allergen: bool = False
    allergen_type: Optional[str] = None

class RecipeCreate(BaseModel):
    recipe_code: str
    product_name: str
    base_batch_size: float = 1000.0
    uom: str = "KG"
    target_yield_pct: float = 95.0
    standard_loss_pct: float = 5.0
    shelf_life_days: int = 180
    ingredients: List[IngredientCreate] = []

class BatchOrderCreate(BaseModel):
    batch_number: str
    recipe_id: Optional[str] = None
    product_name: str
    target_qty: float = 1000.0
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    supervisor_name: str
    notes: Optional[str] = None

class BatchStatusUpdate(BaseModel):
    status: str
    actual_yield_qty: Optional[float] = None
    yield_loss_pct: Optional[float] = None
    notes: Optional[str] = None

class HaccpLogCreate(BaseModel):
    batch_id: Optional[str] = None
    ccp_point: str
    reading_value: str
    standard_limit: str
    is_compliant: bool = True
    recorded_at: str
    operator_name: str
    corrective_action: Optional[str] = None

class LabSampleCreate(BaseModel):
    sample_ref: str
    batch_id: Optional[str] = None
    test_name: str
    result_value: str
    spec_limit: str
    status: str = "pass"
    tested_by: str

class MockRecallRequest(BaseModel):
    suspect_ingredient_lot: str

# Endpoints
@router.get("/summary")
async def get_fod_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_batches = await db.execute(select(FodBatchOrder).where(FodBatchOrder.tenant_id == tenant_id))
    batches = q_batches.scalars().all()

    active_batches = sum(1 for b in batches if b.status in ("staging", "mixing", "cooking", "cooling", "packaging", "qc_quarantine"))
    quarantined = sum(1 for b in batches if b.status == "qc_quarantine")
    avg_loss = round(sum(b.yield_loss_pct for b in batches) / len(batches), 1) if batches else 3.2

    q_haccp = await db.execute(select(FodHaccpLog).where(FodHaccpLog.tenant_id == tenant_id))
    haccp_logs = q_haccp.scalars().all()
    compliant = sum(1 for l in haccp_logs if l.is_compliant)
    ccp_pct = round((compliant / len(haccp_logs)) * 100.0, 1) if haccp_logs else 100.0

    q_tests = await db.execute(select(FodQaLabSample).where(FodQaLabSample.tenant_id == tenant_id, FodQaLabSample.status == "pending"))
    pending_tests = len(q_tests.scalars().all())

    q_recipes = await db.execute(select(FodRecipe).where(FodRecipe.tenant_id == tenant_id))
    total_recipes = len(q_recipes.scalars().all())

    return {
        "active_batches_count": active_batches,
        "quarantined_batches_count": quarantined,
        "ccp_compliance_percent": ccp_pct,
        "average_yield_loss_pct": avg_loss,
        "pending_lab_samples_count": pending_tests,
        "total_recipes_count": total_recipes
    }

@router.get("/recipes")
async def list_recipes(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(FodRecipe).where(FodRecipe.tenant_id == tenant_id).order_by(FodRecipe.created_at.desc()))
    recipes = q.scalars().all()
    results = []
    for r in recipes:
        qi = await db.execute(select(FodRecipeIngredient).where(FodRecipeIngredient.recipe_id == r.id))
        ingrs = qi.scalars().all()
        results.append({
            "id": r.id,
            "recipe_code": r.recipe_code,
            "product_name": r.product_name,
            "base_batch_size": r.base_batch_size,
            "uom": r.uom,
            "target_yield_pct": r.target_yield_pct,
            "standard_loss_pct": r.standard_loss_pct,
            "shelf_life_days": r.shelf_life_days,
            "ingredients": [
                {
                    "id": i.id,
                    "ingredient_code": i.ingredient_code,
                    "ingredient_name": i.ingredient_name,
                    "standard_qty": i.standard_qty,
                    "uom": i.uom,
                    "potency_factor": i.potency_factor,
                    "is_allergen": i.is_allergen,
                    "allergen_type": i.allergen_type,
                }
                for i in ingrs
            ]
        })
    return results

@router.post("/recipes")
async def create_recipe(
    payload: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    recipe_id = str(uuid.uuid4())
    recipe = FodRecipe(
        id=recipe_id,
        tenant_id=tenant_id,
        recipe_code=payload.recipe_code,
        product_name=payload.product_name,
        base_batch_size=payload.base_batch_size,
        uom=payload.uom,
        target_yield_pct=payload.target_yield_pct,
        standard_loss_pct=payload.standard_loss_pct,
        shelf_life_days=payload.shelf_life_days
    )
    db.add(recipe)
    await db.flush()

    for i in payload.ingredients:
        db.add(FodRecipeIngredient(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            recipe_id=recipe_id,
            ingredient_code=i.ingredient_code,
            ingredient_name=i.ingredient_name,
            standard_qty=i.standard_qty,
            uom=i.uom,
            potency_factor=i.potency_factor,
            is_allergen=i.is_allergen,
            allergen_type=i.allergen_type
        ))

    await db.commit()
    return {"id": recipe.id, "recipe_code": recipe.recipe_code, "status": "created"}

@router.get("/batches")
async def list_batches(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(FodBatchOrder).where(FodBatchOrder.tenant_id == tenant_id).order_by(FodBatchOrder.created_at.desc()))
    batches = q.scalars().all()
    results = []
    for b in batches:
        recipe_code = None
        if b.recipe_id:
            qr = await db.execute(select(FodRecipe).where(FodRecipe.id == b.recipe_id))
            r = qr.scalar_one_or_none()
            if r:
                recipe_code = r.recipe_code
        results.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "recipe_id": b.recipe_id,
            "recipe_code": recipe_code,
            "product_name": b.product_name,
            "target_qty": b.target_qty,
            "actual_yield_qty": b.actual_yield_qty,
            "yield_loss_pct": b.yield_loss_pct,
            "status": b.status,
            "start_date": b.start_date,
            "expiry_date": b.expiry_date,
            "supervisor_name": b.supervisor_name,
            "notes": b.notes,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return results

@router.post("/batches")
async def create_batch(
    payload: BatchOrderCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    batch = FodBatchOrder(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        batch_number=payload.batch_number,
        recipe_id=payload.recipe_id,
        product_name=payload.product_name,
        target_qty=payload.target_qty,
        start_date=payload.start_date,
        expiry_date=payload.expiry_date,
        supervisor_name=payload.supervisor_name,
        notes=payload.notes,
        status="staging"
    )
    db.add(batch)
    await db.commit()
    return batch

@router.post("/batches/{id}/status")
async def update_batch_status(
    id: str,
    payload: BatchStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(FodBatchOrder).where(FodBatchOrder.id == id, FodBatchOrder.tenant_id == tenant_id))
    batch = q.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch order not found")
    
    batch.status = payload.status
    if payload.actual_yield_qty is not None:
        batch.actual_yield_qty = payload.actual_yield_qty
        if batch.target_qty > 0:
            loss = max(0.0, ((batch.target_qty - payload.actual_yield_qty) / batch.target_qty) * 100.0)
            batch.yield_loss_pct = round(loss, 2)
    if payload.yield_loss_pct is not None:
        batch.yield_loss_pct = payload.yield_loss_pct
    if payload.notes:
        batch.notes = payload.notes
        
    await db.commit()
    return batch

@router.get("/haccp-logs")
async def list_haccp_logs(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(FodHaccpLog).where(FodHaccpLog.tenant_id == tenant_id).order_by(FodHaccpLog.recorded_at.desc()))
    logs = q.scalars().all()
    results = []
    for l in logs:
        batch_num = "Global CCP"
        if l.batch_id:
            qb = await db.execute(select(FodBatchOrder).where(FodBatchOrder.id == l.batch_id))
            b = qb.scalar_one_or_none()
            if b:
                batch_num = b.batch_number
        results.append({
            "id": l.id,
            "batch_id": l.batch_id,
            "batch_number": batch_num,
            "ccp_point": l.ccp_point,
            "reading_value": l.reading_value,
            "standard_limit": l.standard_limit,
            "is_compliant": l.is_compliant,
            "recorded_at": l.recorded_at,
            "operator_name": l.operator_name,
            "corrective_action": l.corrective_action
        })
    return results

@router.post("/haccp-logs")
async def create_haccp_log(
    payload: HaccpLogCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    log = FodHaccpLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        batch_id=payload.batch_id,
        ccp_point=payload.ccp_point,
        reading_value=payload.reading_value,
        standard_limit=payload.standard_limit,
        is_compliant=payload.is_compliant,
        recorded_at=payload.recorded_at,
        operator_name=payload.operator_name,
        corrective_action=payload.corrective_action
    )
    db.add(log)
    await db.commit()
    return log

@router.get("/lab-samples")
async def list_lab_samples(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(FodQaLabSample).where(FodQaLabSample.tenant_id == tenant_id).order_by(FodQaLabSample.tested_at.desc()))
    samples = q.scalars().all()
    results = []
    for s in samples:
        batch_num = None
        if s.batch_id:
            qb = await db.execute(select(FodBatchOrder).where(FodBatchOrder.id == s.batch_id))
            b = qb.scalar_one_or_none()
            if b:
                batch_num = b.batch_number
        results.append({
            "id": s.id,
            "sample_ref": s.sample_ref,
            "batch_id": s.batch_id,
            "batch_number": batch_num,
            "test_name": s.test_name,
            "result_value": s.result_value,
            "spec_limit": s.spec_limit,
            "status": s.status,
            "tested_by": s.tested_by,
            "tested_at": s.tested_at.isoformat() if s.tested_at else None
        })
    return results

@router.post("/lab-samples")
async def create_lab_sample(
    payload: LabSampleCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    sample = FodQaLabSample(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        sample_ref=payload.sample_ref,
        batch_id=payload.batch_id,
        test_name=payload.test_name,
        result_value=payload.result_value,
        spec_limit=payload.spec_limit,
        status=payload.status,
        tested_by=payload.tested_by
    )
    db.add(sample)
    await db.commit()
    return sample

@router.get("/recalls")
async def list_recalls(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(FodTraceabilityRecall).where(FodTraceabilityRecall.tenant_id == tenant_id).order_by(FodTraceabilityRecall.generated_at.desc()))
    return q.scalars().all()

@router.post("/recalls/simulate")
async def simulate_recall(
    payload: MockRecallRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    sim = FodTraceabilityRecall(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        simulation_ref=f"REC-SIM-{uuid.uuid4().hex[:6].upper()}",
        suspect_ingredient_lot=payload.suspect_ingredient_lot,
        affected_batches_count=2,
        distributed_units_count=4850,
        audit_duration_mins=8.5,
        is_within_iso_30min=True
    )
    db.add(sim)
    await db.commit()
    return sim

@router.post("/seed")
async def seed_fod_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Food & Beverage Process Manufacturing."""
    q_existing = await db.execute(select(FodRecipe).where(FodRecipe.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Food module already seeded"}

    # 1. Recipes & Formulations
    r1_id = str(uuid.uuid4())
    r1 = FodRecipe(
        id=r1_id,
        tenant_id=tenant_id,
        recipe_code="REC-YOG-01",
        product_name="زبادي طبيعي كامل الدسم 170 جم (Full Cream Yogurt)",
        base_batch_size=5000.0,
        uom="KG",
        target_yield_pct=96.5,
        standard_loss_pct=3.5,
        shelf_life_days=21
    )
    db.add(r1)
    await db.flush()

    ingredients = [
        FodRecipeIngredient(id=str(uuid.uuid4()), tenant_id=tenant_id, recipe_id=r1_id, ingredient_code="RAW-MILK-01", ingredient_name="حليب بقري طازج خام 3.5% دسم", standard_qty=4750.0, uom="LITER", potency_factor=1.0, is_allergen=True, allergen_type="ألبان وحليب"),
        FodRecipeIngredient(id=str(uuid.uuid4()), tenant_id=tenant_id, recipe_id=r1_id, ingredient_code="RAW-SMP-02", ingredient_name="حليب مجفف فرز منزوع الدسم Skimmed Milk Powder", standard_qty=180.0, uom="KG", potency_factor=1.0, is_allergen=True, allergen_type="ألبان وحليب"),
        FodRecipeIngredient(id=str(uuid.uuid4()), tenant_id=tenant_id, recipe_id=r1_id, ingredient_code="CULT-STR-03", ingredient_name="بادئ تخمير حيوي DVS Yogurt Culture (Streptococcus thermophilus)", standard_qty=2.5, uom="KG", potency_factor=1.2, is_allergen=False, allergen_type=None),
        FodRecipeIngredient(id=str(uuid.uuid4()), tenant_id=tenant_id, recipe_id=r1_id, ingredient_code="STAB-PEC-04", ingredient_name="مغلظ قوام بكتين نباتي Citrus Pectin", standard_qty=15.0, uom="KG", potency_factor=1.0, is_allergen=False, allergen_type=None),
    ]
    for ing in ingredients:
        db.add(ing)
    await db.flush()

    # 2. Batch Orders
    b1_id = str(uuid.uuid4())
    b2_id = str(uuid.uuid4())
    batches = [
        FodBatchOrder(
            id=b1_id,
            tenant_id=tenant_id,
            batch_number="BAT-YOG-2026-901",
            recipe_id=r1_id,
            product_name="زبادي طبيعي كامل الدسم 170 جم",
            target_qty=5000.0,
            actual_yield_qty=4840.0,
            yield_loss_pct=3.2,
            status="cooling",
            start_date="2026-11-02",
            expiry_date="2026-11-23",
            supervisor_name="م/ خالد العوضي (مدير خطوط الألبان)",
            notes="تم التلقيح في درجة حرارة 43°C والتحضين لمدة 4.5 ساعات"
        ),
        FodBatchOrder(
            id=b2_id,
            tenant_id=tenant_id,
            batch_number="BAT-YOG-2026-902",
            recipe_id=r1_id,
            product_name="زبادي طبيعي كامل الدسم 170 جم",
            target_qty=5000.0,
            actual_yield_qty=0.0,
            yield_loss_pct=0.0,
            status="staging",
            start_date="2026-11-02",
            expiry_date="2026-11-23",
            supervisor_name="م/ حسام الشافعي",
            notes="جاهز لعمليات البسترة والتجنيس"
        ),
        FodBatchOrder(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            batch_number="BAT-YOG-2026-899",
            recipe_id=r1_id,
            product_name="زبادي طبيعي كامل الدسم 170 جم",
            target_qty=5000.0,
            actual_yield_qty=4875.0,
            yield_loss_pct=2.5,
            status="released",
            start_date="2026-10-31",
            expiry_date="2026-11-21",
            supervisor_name="م/ خالد العوضي",
            notes="تم الإفراج النهائي والتوزيع لسيارات التبريد اللوجستية"
        )
    ]
    for b in batches:
        db.add(b)

    # 3. HACCP Logs
    haccp_logs = [
        FodHaccpLog(id=str(uuid.uuid4()), tenant_id=tenant_id, batch_id=b1_id, ccp_point="CCP-1: حرارة البسترة الفجائية HTST Pasteurization", reading_value="85.4°C / 18 sec", standard_limit="85.0°C - 88.0°C", is_compliant=True, recorded_at="2026-11-02 08:30", operator_name="الفني / عاطف جاد"),
        FodHaccpLog(id=str(uuid.uuid4()), tenant_id=tenant_id, batch_id=b1_id, ccp_point="CCP-2: جهاز كشف المعادن Inline Metal Detector", reading_value="Fe 1.0mm, Non-Fe 1.2mm, SS 1.5mm - No Rejection", standard_limit="Zero Foreign Objects", is_compliant=True, recorded_at="2026-11-02 11:15", operator_name="م/ خالد العوضي"),
        FodHaccpLog(id=str(uuid.uuid4()), tenant_id=tenant_id, batch_id=b1_id, ccp_point="CCP-3: حموضة التخمير ونقطة التخثر pH Value", reading_value="pH 4.52", standard_limit="pH 4.50 - 4.60", is_compliant=True, recorded_at="2026-11-02 13:00", operator_name="كيميائي / سامح بدر"),
    ]
    for h in haccp_logs:
        db.add(h)

    # 4. Lab Samples
    samples = [
        FodQaLabSample(id=str(uuid.uuid4()), tenant_id=tenant_id, batch_id=b1_id, sample_ref="LAB-SMP-991", test_name="بكتيريا القولون الكلية Total Coliforms", result_value="< 1 CFU/g (مطابق)", spec_limit="Max 10 CFU/g", status="pass", tested_by="د. نهال رضوان (ميكروبيولوجي)"),
        FodQaLabSample(id=str(uuid.uuid4()), tenant_id=tenant_id, batch_id=b1_id, sample_ref="LAB-SMP-992", test_name="فطريات وخمائر Yeast & Molds", result_value="< 10 CFU/g (مطابق)", spec_limit="Max 100 CFU/g", status="pass", tested_by="د. نهال رضوان"),
        FodQaLabSample(id=str(uuid.uuid4()), tenant_id=tenant_id, batch_id=b1_id, sample_ref="LAB-SMP-993", test_name="السالمونيلا Salmonella spp.", result_value="سلبية في 25 جم (Absent/25g)", spec_limit="Absent in 25g", status="pass", tested_by="د. نهال رضوان"),
    ]
    for s in samples:
        db.add(s)

    # 5. Recall Simulation
    sim = FodTraceabilityRecall(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        simulation_ref="MOCK-ISO22000-2026-04",
        suspect_ingredient_lot="LOT-SMP-IRISH-221B",
        affected_batches_count=3,
        distributed_units_count=14200,
        audit_duration_mins=11.4,
        is_within_iso_30min=True
    )
    db.add(sim)

    await db.commit()
    return {"message": "Food & Beverage seeded successfully"}
