"""API Router for Commercial Agriculture & Farm Management ERP module (AGR-01..13)."""
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

from app.modules.agr.models import (
    AgrFarmPlot,
    AgrCropSeason,
    AgrChemicalSprayLog,
    AgrHarvestBatch,
    AgrLivestockAnimal,
)

router = APIRouter(prefix="/agr", tags=["Agriculture & Livestock Farm Management ERP"])

# Pydantic Schemas
class PlotCreate(BaseModel):
    plot_code: str
    farm_name: str
    sector: str
    soil_type: str = "Sandy Loam"
    area_feddans: float = 0.0
    irrigation_type: str = "center_pivot"
    gps_coordinates: str
    status: str = "cultivated"

class SeasonCreate(BaseModel):
    plot_id: str
    season_code: str
    crop_name: str
    variety: str
    planting_date: str
    expected_harvest_date: str
    target_yield_tons: float = 0.0
    status: str = "planted"

class SprayCreate(BaseModel):
    crop_season_id: str
    spray_ref: str
    chemical_name: str
    dosage_per_feddan: str
    active_ingredient: str
    target_pest_or_deficiency: str
    withholding_days_phi: int = 14
    applied_date: str
    applied_by: str
    status: str = "completed"

class HarvestCreate(BaseModel):
    crop_season_id: str
    batch_lot: str
    harvest_date: str
    total_weight_tons: float
    grade_classification: str = "Class 1 (Export)"
    reject_percentage: float = 2.0
    globalgap_compliant: bool = True
    destination_warehouse: str
    notes: Optional[str] = None

class LivestockCreate(BaseModel):
    rfid_tag: str
    breed: str
    gender: str = "female"
    birth_date: str
    current_weight_kg: float = 550.0
    daily_milk_yield_liters: float = 32.0
    health_status: str = "healthy"
    last_vaccination_date: Optional[str] = None

# Endpoints
@router.get("/summary")
async def get_agr_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_plots = await db.execute(select(AgrFarmPlot).where(AgrFarmPlot.tenant_id == tenant_id))
    plots = q_plots.scalars().all()
    total_feddans = sum(p.area_feddans for p in plots)

    q_seasons = await db.execute(select(AgrCropSeason).where(AgrCropSeason.tenant_id == tenant_id, AgrCropSeason.status != "harvested"))
    seasons = q_seasons.scalars().all()

    q_harvests = await db.execute(select(AgrHarvestBatch).where(AgrHarvestBatch.tenant_id == tenant_id))
    harvests = q_harvests.scalars().all()
    total_harvest = sum(h.total_weight_tons for h in harvests)

    q_animals = await db.execute(select(AgrLivestockAnimal).where(AgrLivestockAnimal.tenant_id == tenant_id))
    animals = q_animals.scalars().all()
    total_milk = sum(a.daily_milk_yield_liters for a in animals)

    return {
        "total_farm_plots_count": len(plots),
        "total_feddans_cultivated": total_feddans,
        "active_crop_seasons_count": len(seasons),
        "total_harvest_weight_tons": total_harvest,
        "livestock_head_count": len(animals),
        "daily_milk_production_liters": round(total_milk, 1)
    }

@router.get("/plots")
async def list_plots(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(AgrFarmPlot).where(AgrFarmPlot.tenant_id == tenant_id).order_by(AgrFarmPlot.created_at.desc()))
    return q.scalars().all()

@router.post("/plots")
async def create_plot(
    payload: PlotCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    plot = AgrFarmPlot(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        plot_code=payload.plot_code,
        farm_name=payload.farm_name,
        sector=payload.sector,
        soil_type=payload.soil_type,
        area_feddans=payload.area_feddans,
        irrigation_type=payload.irrigation_type,
        gps_coordinates=payload.gps_coordinates,
        status=payload.status
    )
    db.add(plot)
    await db.commit()
    return plot

@router.get("/seasons")
async def list_seasons(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(AgrCropSeason).where(AgrCropSeason.tenant_id == tenant_id).order_by(AgrCropSeason.created_at.desc()))
    seasons = q.scalars().all()
    results = []
    for s in seasons:
        qp = await db.execute(select(AgrFarmPlot).where(AgrFarmPlot.id == s.plot_id))
        plot = qp.scalar_one_or_none()
        results.append({
            "id": s.id,
            "plot_id": s.plot_id,
            "plot_code": plot.plot_code if plot else "Unknown",
            "farm_name": plot.farm_name if plot else "Unknown Farm",
            "season_code": s.season_code,
            "crop_name": s.crop_name,
            "variety": s.variety,
            "planting_date": s.planting_date,
            "expected_harvest_date": s.expected_harvest_date,
            "target_yield_tons": s.target_yield_tons,
            "actual_yield_tons": s.actual_yield_tons,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return results

@router.post("/seasons")
async def create_season(
    payload: SeasonCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    season = AgrCropSeason(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        plot_id=payload.plot_id,
        season_code=payload.season_code,
        crop_name=payload.crop_name,
        variety=payload.variety,
        planting_date=payload.planting_date,
        expected_harvest_date=payload.expected_harvest_date,
        target_yield_tons=payload.target_yield_tons,
        actual_yield_tons=0.0,
        status=payload.status
    )
    db.add(season)
    await db.commit()
    return season

@router.get("/sprays")
async def list_sprays(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(AgrChemicalSprayLog).where(AgrChemicalSprayLog.tenant_id == tenant_id))
    sprays = q.scalars().all()
    results = []
    for sp in sprays:
        qs = await db.execute(select(AgrCropSeason).where(AgrCropSeason.id == sp.crop_season_id))
        season = qs.scalar_one_or_none()
        results.append({
            "id": sp.id,
            "crop_season_id": sp.crop_season_id,
            "crop_name": season.crop_name if season else "Unknown Crop",
            "season_code": season.season_code if season else "",
            "spray_ref": sp.spray_ref,
            "chemical_name": sp.chemical_name,
            "dosage_per_feddan": sp.dosage_per_feddan,
            "active_ingredient": sp.active_ingredient,
            "target_pest_or_deficiency": sp.target_pest_or_deficiency,
            "withholding_days_phi": sp.withholding_days_phi,
            "applied_date": sp.applied_date,
            "applied_by": sp.applied_by,
            "status": sp.status
        })
    return results

@router.post("/sprays")
async def create_spray(
    payload: SprayCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    spray = AgrChemicalSprayLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        crop_season_id=payload.crop_season_id,
        spray_ref=payload.spray_ref,
        chemical_name=payload.chemical_name,
        dosage_per_feddan=payload.dosage_per_feddan,
        active_ingredient=payload.active_ingredient,
        target_pest_or_deficiency=payload.target_pest_or_deficiency,
        withholding_days_phi=payload.withholding_days_phi,
        applied_date=payload.applied_date,
        applied_by=payload.applied_by,
        status=payload.status
    )
    db.add(spray)
    await db.commit()
    return spray

@router.get("/harvests")
async def list_harvests(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(AgrHarvestBatch).where(AgrHarvestBatch.tenant_id == tenant_id))
    harvests = q.scalars().all()
    results = []
    for h in harvests:
        qs = await db.execute(select(AgrCropSeason).where(AgrCropSeason.id == h.crop_season_id))
        season = qs.scalar_one_or_none()
        results.append({
            "id": h.id,
            "crop_season_id": h.crop_season_id,
            "crop_name": season.crop_name if season else "Crop Harvest",
            "season_code": season.season_code if season else "",
            "batch_lot": h.batch_lot,
            "harvest_date": h.harvest_date,
            "total_weight_tons": h.total_weight_tons,
            "grade_classification": h.grade_classification,
            "reject_percentage": h.reject_percentage,
            "globalgap_compliant": h.globalgap_compliant,
            "destination_warehouse": h.destination_warehouse,
            "notes": h.notes
        })
    return results

@router.post("/harvests")
async def create_harvest(
    payload: HarvestCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    batch = AgrHarvestBatch(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        crop_season_id=payload.crop_season_id,
        batch_lot=payload.batch_lot,
        harvest_date=payload.harvest_date,
        total_weight_tons=payload.total_weight_tons,
        grade_classification=payload.grade_classification,
        reject_percentage=payload.reject_percentage,
        globalgap_compliant=payload.globalgap_compliant,
        destination_warehouse=payload.destination_warehouse,
        notes=payload.notes
    )
    db.add(batch)
    await db.commit()
    return batch

@router.get("/livestock")
async def list_livestock(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(AgrLivestockAnimal).where(AgrLivestockAnimal.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/livestock")
async def create_livestock(
    payload: LivestockCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    animal = AgrLivestockAnimal(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        rfid_tag=payload.rfid_tag,
        breed=payload.breed,
        gender=payload.gender,
        birth_date=payload.birth_date,
        current_weight_kg=payload.current_weight_kg,
        daily_milk_yield_liters=payload.daily_milk_yield_liters,
        health_status=payload.health_status,
        last_vaccination_date=payload.last_vaccination_date
    )
    db.add(animal)
    await db.commit()
    return animal

@router.post("/seed")
async def seed_agr_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Agriculture & Livestock Farm Management ERP."""
    q_existing = await db.execute(select(AgrFarmPlot).where(AgrFarmPlot.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Agriculture module already seeded"}

    # 1. Plots
    p1_id = str(uuid.uuid4())
    p2_id = str(uuid.uuid4())
    plots = [
        AgrFarmPlot(
            id=p1_id,
            tenant_id=tenant_id,
            plot_code="PVT-EAST-01",
            farm_name="مزارع توشكى الذهبية للاستصلاح الزراعي والتصدير",
            sector="القطاع الشرقي - جهاز بيفوت 1",
            soil_type="طميية رملية عالية الخصوبة (Sandy Loam)",
            area_feddans=125.0,
            irrigation_type="center_pivot",
            gps_coordinates="22.5184° N, 31.8492° E",
            status="cultivated"
        ),
        AgrFarmPlot(
            id=p2_id,
            tenant_id=tenant_id,
            plot_code="DRP-ORCH-02",
            farm_name="مزارع وادي النطرون للحاصلات البستانية",
            sector="بستان الموالح والبرتقال الصيفي - قطاع التنقيط",
            soil_type="رملية جيرية معالجة (Calcareous Sand)",
            area_feddans=80.0,
            irrigation_type="drip",
            gps_coordinates="30.4120° N, 30.2980° E",
            status="cultivated"
        )
    ]
    for p in plots:
        db.add(p)
    await db.flush()

    # 2. Crop Seasons
    s1_id = str(uuid.uuid4())
    seasons = [
        AgrCropSeason(
            id=s1_id,
            tenant_id=tenant_id,
            plot_id=p1_id,
            season_code="CR-WHT-2026-01",
            crop_name="قمح صلب استراتيجي عالي الجودة (Sakha 95 Durum)",
            variety="سخا 95 معتمد مقاوم للأصداء",
            planting_date="2025-11-15",
            expected_harvest_date="2026-04-20",
            target_yield_tons=375.0,
            actual_yield_tons=382.5,
            status="vegetative"
        )
    ]
    for s in seasons:
        db.add(s)
    await db.flush()

    # 3. Chemical Spray
    spray = AgrChemicalSprayLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        crop_season_id=s1_id,
        spray_ref="SPR-2026-042",
        chemical_name="سماد سائل NPK 20-20-20 + أحماض أمينية وهيوميك",
        dosage_per_feddan="3.5 كجم / فدان عبر شبكة التسميد الفنتوري",
        active_ingredient="عناصر كبرى مخلبية ومحفزات نمو جذري",
        target_pest_or_deficiency="تنشيط التفريع الخضري وزيادة عدد السنابل",
        withholding_days_phi=14,
        applied_date="2026-11-01",
        applied_by="م. محمود الشرقاوي (أخصائي التسميد)",
        status="completed"
    )
    db.add(spray)

    # 4. Harvest Batch
    harvest = AgrHarvestBatch(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        crop_season_id=s1_id,
        batch_lot="LOT-ORNG-VAL-2026",
        harvest_date="2026-10-28",
        total_weight_tons=145.0,
        grade_classification="Class 1 (Export)",
        reject_percentage=1.8,
        globalgap_compliant=True,
        destination_warehouse="محطة الفرز والتعبئة المركزية - صومعة التبريد 3",
        notes="تم الفحص الحجري والتأكد من مطابقة متبقيات المبيدات MRL للاتحاد الأوروبي."
    )
    db.add(harvest)

    # 5. Livestock
    animals = [
        AgrLivestockAnimal(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            rfid_tag="RFID-EG-HOL-0104",
            breed="هولشتاين ألماني أصيل (Holstein Pedigree)",
            gender="female",
            birth_date="2023-04-12",
            current_weight_kg=640.0,
            daily_milk_yield_liters=34.5,
            health_status="lactating",
            last_vaccination_date="2026-10-15"
        ),
        AgrLivestockAnimal(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            rfid_tag="RFID-EG-HOL-0105",
            breed="هولشتاين ألماني أصيل (Holstein Pedigree)",
            gender="female",
            birth_date="2023-05-20",
            current_weight_kg=610.0,
            daily_milk_yield_liters=31.0,
            health_status="pregnant",
            last_vaccination_date="2026-10-15"
        )
    ]
    for a in animals:
        db.add(a)

    await db.commit()
    return {"message": "Agriculture module seeded successfully"}
