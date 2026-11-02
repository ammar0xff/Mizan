"""API Router for Oil & Gas Extraction ERP module (OIL-01..14)."""
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

from app.modules.oil.models import (
    OilWellHead,
    OilDailyProduction,
    OilDrillingReport,
    OilTankFarm,
    OilJvCashCall,
)

router = APIRouter(prefix="/oil", tags=["Oil & Gas ERP"])

# Pydantic Schemas
class WellCreate(BaseModel):
    well_tag: str
    well_name: str
    concession_name: str
    platform_or_pad: str
    well_type: str = "oil_producer"
    reservoir_formation: str = "Kareem Sandstone"
    status: str = "producing"

class ProductionCreate(BaseModel):
    well_id: str
    log_date: str
    gross_liquid_bbl: float
    net_oil_bbl: float
    gas_rate_mmscfd: float = 0.0
    water_cut_pct: float = 12.5
    tubing_pressure_psi: float = 1200.0
    choke_size_64th: float = 32.0

class DrillingReportCreate(BaseModel):
    ddr_ref: str
    rig_name: str
    concession: str
    report_date: str
    current_depth_ft: float
    footage_last_24h_ft: float
    mud_weight_ppg: float = 9.8
    daily_rig_cost_egp: float
    operations_summary: str
    status: str = "drilling"

class TankCreate(BaseModel):
    tank_tag: str
    terminal_location: str
    product_type: str = "crude_oil_heavy"
    gross_observed_volume_bbl: float
    api_gravity: float = 32.5
    temperature_f: float = 85.0
    net_standard_volume_bbl: float
    safe_fill_capacity_bbl: float = 250000.0
    status: str = "in_service"

class CashCallCreate(BaseModel):
    cash_call_ref: str
    concession: str
    partner_company: str
    working_interest_pct: float = 50.0
    billing_period: str
    operating_expenditure_egp: float
    capital_expenditure_egp: float
    total_due_egp: float
    status: str = "approved"

# Endpoints
@router.get("/summary")
async def get_oil_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_wells = await db.execute(select(OilWellHead).where(OilWellHead.tenant_id == tenant_id))
    wells = q_wells.scalars().all()
    producing_wells = sum(1 for w in wells if w.status == "producing")

    q_prod = await db.execute(select(OilDailyProduction).where(OilDailyProduction.tenant_id == tenant_id))
    prods = q_prod.scalars().all()
    daily_oil = sum(p.net_oil_bbl for p in prods)
    daily_gas = sum(p.gas_rate_mmscfd for p in prods)

    q_rigs = await db.execute(select(OilDrillingReport).where(OilDrillingReport.tenant_id == tenant_id, OilDrillingReport.status == "drilling"))
    active_rigs = len(q_rigs.scalars().all())

    q_tanks = await db.execute(select(OilTankFarm).where(OilTankFarm.tenant_id == tenant_id))
    tanks = q_tanks.scalars().all()
    total_storage = sum(t.net_standard_volume_bbl for t in tanks)

    q_calls = await db.execute(select(OilJvCashCall).where(OilJvCashCall.tenant_id == tenant_id))
    calls = q_calls.scalars().all()
    total_calls = sum(c.total_due_egp for c in calls)

    return {
        "total_producing_wells_count": producing_wells,
        "daily_crude_oil_production_bbl": round(daily_oil, 1),
        "daily_natural_gas_production_mmscfd": round(daily_gas, 2),
        "active_drilling_rigs_count": active_rigs,
        "tank_farm_storage_volume_bbl": round(total_storage, 1),
        "jv_cash_calls_due_egp": round(total_calls, 2)
    }

@router.get("/wells")
async def list_wells(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(OilWellHead).where(OilWellHead.tenant_id == tenant_id).order_by(OilWellHead.created_at.desc()))
    return q.scalars().all()

@router.post("/wells")
async def create_well(
    payload: WellCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    well = OilWellHead(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        well_tag=payload.well_tag,
        well_name=payload.well_name,
        concession_name=payload.concession_name,
        platform_or_pad=payload.platform_or_pad,
        well_type=payload.well_type,
        reservoir_formation=payload.reservoir_formation,
        status=payload.status
    )
    db.add(well)
    await db.commit()
    return well

@router.get("/productions")
async def list_productions(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(OilDailyProduction).where(OilDailyProduction.tenant_id == tenant_id))
    prods = q.scalars().all()
    results = []
    for p in prods:
        qw = await db.execute(select(OilWellHead).where(OilWellHead.id == p.well_id))
        w = qw.scalar_one_or_none()
        results.append({
            "id": p.id,
            "well_id": p.well_id,
            "well_tag": w.well_tag if w else "Unknown",
            "well_name": w.well_name if w else "Well Head",
            "log_date": p.log_date,
            "gross_liquid_bbl": p.gross_liquid_bbl,
            "net_oil_bbl": p.net_oil_bbl,
            "gas_rate_mmscfd": p.gas_rate_mmscfd,
            "water_cut_pct": p.water_cut_pct,
            "tubing_pressure_psi": p.tubing_pressure_psi,
            "choke_size_64th": p.choke_size_64th
        })
    return results

@router.post("/productions")
async def create_production(
    payload: ProductionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    prod = OilDailyProduction(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        well_id=payload.well_id,
        log_date=payload.log_date,
        gross_liquid_bbl=payload.gross_liquid_bbl,
        net_oil_bbl=payload.net_oil_bbl,
        gas_rate_mmscfd=payload.gas_rate_mmscfd,
        water_cut_pct=payload.water_cut_pct,
        tubing_pressure_psi=payload.tubing_pressure_psi,
        choke_size_64th=payload.choke_size_64th
    )
    db.add(prod)
    await db.commit()
    return prod

@router.get("/drilling-reports")
async def list_drilling_reports(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(OilDrillingReport).where(OilDrillingReport.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/drilling-reports")
async def create_drilling_report(
    payload: DrillingReportCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    report = OilDrillingReport(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        ddr_ref=payload.ddr_ref,
        rig_name=payload.rig_name,
        concession=payload.concession,
        report_date=payload.report_date,
        current_depth_ft=payload.current_depth_ft,
        footage_last_24h_ft=payload.footage_last_24h_ft,
        mud_weight_ppg=payload.mud_weight_ppg,
        daily_rig_cost_egp=payload.daily_rig_cost_egp,
        operations_summary=payload.operations_summary,
        status=payload.status
    )
    db.add(report)
    await db.commit()
    return report

@router.get("/tank-farms")
async def list_tank_farms(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(OilTankFarm).where(OilTankFarm.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/tank-farms")
async def create_tank_farm(
    payload: TankCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    tank = OilTankFarm(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        tank_tag=payload.tank_tag,
        terminal_location=payload.terminal_location,
        product_type=payload.product_type,
        gross_observed_volume_bbl=payload.gross_observed_volume_bbl,
        api_gravity=payload.api_gravity,
        temperature_f=payload.temperature_f,
        net_standard_volume_bbl=payload.net_standard_volume_bbl,
        safe_fill_capacity_bbl=payload.safe_fill_capacity_bbl,
        status=payload.status
    )
    db.add(tank)
    await db.commit()
    return tank

@router.get("/cash-calls")
async def list_cash_calls(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(OilJvCashCall).where(OilJvCashCall.tenant_id == tenant_id).order_by(OilJvCashCall.created_at.desc()))
    return q.scalars().all()

@router.post("/cash-calls")
async def create_cash_call(
    payload: CashCallCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    call = OilJvCashCall(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        cash_call_ref=payload.cash_call_ref,
        concession=payload.concession,
        partner_company=payload.partner_company,
        working_interest_pct=payload.working_interest_pct,
        billing_period=payload.billing_period,
        operating_expenditure_egp=payload.operating_expenditure_egp,
        capital_expenditure_egp=payload.capital_expenditure_egp,
        total_due_egp=payload.total_due_egp,
        status=payload.status
    )
    db.add(call)
    await db.commit()
    return call

@router.post("/seed")
async def seed_oil_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Oil & Gas Extraction ERP."""
    q_existing = await db.execute(select(OilWellHead).where(OilWellHead.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Oil module already seeded"}

    w1_id = str(uuid.uuid4())
    w2_id = str(uuid.uuid4())
    wells = [
        OilWellHead(
            id=w1_id,
            tenant_id=tenant_id,
            well_tag="W-GUPCO-MRJ-104",
            well_name="بئر مرجان البحري 104 (Offshore Producer)",
            concession_name="امتياز خليج السويس - حقل مرجان",
            platform_or_pad="منصة دلتا البحرية (Platform Delta)",
            well_type="oil_producer",
            reservoir_formation="تكوين كريم الجيري (Kareem Sandstone)",
            status="producing"
        ),
        OilWellHead(
            id=w2_id,
            tenant_id=tenant_id,
            well_tag="W-WES-DES-08",
            well_name="بئر قارون الصحراء الغربية 08",
            concession_name="امتياز الصحراء الغربية - حقل قارون",
            platform_or_pad="منصة الإنتاج البرية Pad Bravo",
            well_type="gas_condensate",
            reservoir_formation="تكوين البحرية السفلي (Lower Bahariya)",
            status="producing"
        )
    ]
    for w in wells:
        db.add(w)
    await db.flush()

    # Daily Production
    prods = [
        OilDailyProduction(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            well_id=w1_id,
            log_date="2026-11-01",
            gross_liquid_bbl=4250.0,
            net_oil_bbl=3650.0,
            gas_rate_mmscfd=4.2,
            water_cut_pct=14.1,
            tubing_pressure_psi=1450.0,
            choke_size_64th=28.0
        ),
        OilDailyProduction(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            well_id=w2_id,
            log_date="2026-11-01",
            gross_liquid_bbl=2100.0,
            net_oil_bbl=1850.0,
            gas_rate_mmscfd=18.5,
            water_cut_pct=11.9,
            tubing_pressure_psi=2200.0,
            choke_size_64th=32.0
        )
    ]
    for p in prods:
        db.add(p)

    # Drilling Reports
    drilling = [
        OilDrillingReport(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            ddr_ref="DDR-ELQAHER-2026-081",
            rig_name="الحفار البحري القاهر 2 (Jack-up Rig El-Qaher II)",
            concession="امتياز خليج السويس - حقل مرجان المطور",
            report_date="2026-11-01",
            current_depth_ft=11450.0,
            footage_last_24h_ft=185.0,
            mud_weight_ppg=10.2,
            daily_rig_cost_egp=1850000.0,
            operations_summary="حفر قطاع 8.5 بوصة في تكوين رمال كريم مع سحب أنابيب الحفر لتغيير الدقاق PDC وتدوير سائل الحفر",
            status="drilling"
        )
    ]
    for d in drilling:
        db.add(d)

    # Tank Farms
    tanks = [
        OilTankFarm(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            tank_tag="TK-CRUDE-RGB-01",
            terminal_location="ميناء ومستودعات رأس غارب البترولية - صهريج التصدير 1",
            product_type="crude_oil_heavy",
            gross_observed_volume_bbl=184500.0,
            api_gravity=31.8,
            temperature_f=82.4,
            net_standard_volume_bbl=183200.0,
            safe_fill_capacity_bbl=250000.0,
            status="in_service"
        ),
        OilTankFarm(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            tank_tag="TK-COND-WES-02",
            terminal_location="مجمع معالجة وفصل الغاز - الصحراء الغربية",
            product_type="crude_oil_light",
            gross_observed_volume_bbl=94000.0,
            api_gravity=42.1,
            temperature_f=78.0,
            net_standard_volume_bbl=93600.0,
            safe_fill_capacity_bbl=150000.0,
            status="in_service"
        )
    ]
    for tk in tanks:
        db.add(tk)

    # JV Cash Calls
    cash_calls = [
        OilJvCashCall(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            cash_call_ref="CC-GUPCO-2026-NOV",
            concession="امتياز خليج السويس (اتفاقية التزام جابكو)",
            partner_company="الهيئة المصرية العامة للبترول (EGPC)",
            working_interest_pct=50.0,
            billing_period="2026-11",
            operating_expenditure_egp=42000000.0,
            capital_expenditure_egp=78000000.0,
            total_due_egp=60000000.0,
            status="approved"
        )
    ]
    for cc in cash_calls:
        db.add(cc)

    await db.commit()
    return {"message": "Oil module seeded successfully"}
