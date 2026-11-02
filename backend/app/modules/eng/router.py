"""API Router for Energy & Power Generation Plant ERP module (ENG-01..12)."""
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

from app.modules.eng.models import (
    EngPowerAsset,
    EngTelemetryLog,
    EngPermitToWork,
    EngPpaBilling,
    EngHseIncident,
)

router = APIRouter(prefix="/eng", tags=["Energy & Power Generation Plant ERP"])

# Pydantic Schemas
class PowerAssetCreate(BaseModel):
    asset_tag: str
    asset_name: str
    plant_name: str
    system_type: str = "solar_pv_inverter"
    rated_capacity_mw: float = 0.0
    installation_date: str
    status: str = "online"

class TelemetryCreate(BaseModel):
    asset_id: str
    timestamp: str
    active_power_mw: float
    grid_frequency_hz: float = 50.0
    ambient_temperature_c: float = 25.0
    internal_temperature_c: float = 45.0
    efficiency_ratio_pct: float = 98.5
    curtailment_active: bool = False

class PtwCreate(BaseModel):
    asset_id: str
    ptw_number: str
    work_type: str = "high_voltage_isolation"
    description: str
    lead_technician: str
    safety_officer: str
    loto_confirmed: bool = True
    valid_from: str
    valid_to: str
    status: str = "active"

class PpaBillingCreate(BaseModel):
    billing_period: str
    offtaker_name: str
    delivered_mwh: float
    peak_tariff_egp_per_mwh: float = 1450.0
    off_peak_tariff_egp_per_mwh: float = 980.0
    total_billed_egp: float = 0.0
    curtailment_compensation_egp: float = 0.0
    status: str = "approved"

class IncidentCreate(BaseModel):
    incident_ref: str
    incident_type: str = "near_miss"
    severity: str = "low"
    location: str
    description: str
    corrective_action: str
    reported_by: str
    incident_date: str
    status: str = "closed"

# Endpoints
@router.get("/summary")
async def get_eng_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_assets = await db.execute(select(EngPowerAsset).where(EngPowerAsset.tenant_id == tenant_id))
    assets = q_assets.scalars().all()
    total_capacity = sum(a.rated_capacity_mw for a in assets)

    q_tele = await db.execute(select(EngTelemetryLog).where(EngTelemetryLog.tenant_id == tenant_id))
    tele = q_tele.scalars().all()
    current_output = sum(t.active_power_mw for t in tele) if tele else total_capacity * 0.92

    q_ptws = await db.execute(select(EngPermitToWork).where(EngPermitToWork.tenant_id == tenant_id, EngPermitToWork.status == "active"))
    active_ptws = len(q_ptws.scalars().all())

    q_ppa = await db.execute(select(EngPpaBilling).where(EngPpaBilling.tenant_id == tenant_id))
    ppas = q_ppa.scalars().all()
    total_mwh = sum(p.delivered_mwh for p in ppas)
    total_billed = sum(p.total_billed_egp for p in ppas)

    return {
        "total_power_assets_count": len(assets),
        "total_generation_capacity_mw": round(total_capacity, 2),
        "current_output_mw": round(current_output, 2),
        "active_ptw_count": active_ptws,
        "total_settled_mwh": round(total_mwh, 1),
        "total_ppa_billed_egp": round(total_billed, 2)
    }

@router.get("/assets")
async def list_assets(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EngPowerAsset).where(EngPowerAsset.tenant_id == tenant_id).order_by(EngPowerAsset.created_at.desc()))
    return q.scalars().all()

@router.post("/assets")
async def create_asset(
    payload: PowerAssetCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    asset = EngPowerAsset(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        asset_tag=payload.asset_tag,
        asset_name=payload.asset_name,
        plant_name=payload.plant_name,
        system_type=payload.system_type,
        rated_capacity_mw=payload.rated_capacity_mw,
        installation_date=payload.installation_date,
        status=payload.status
    )
    db.add(asset)
    await db.commit()
    return asset

@router.get("/telemetry")
async def list_telemetry(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EngTelemetryLog).where(EngTelemetryLog.tenant_id == tenant_id))
    tele = q.scalars().all()
    results = []
    for t in tele:
        qa = await db.execute(select(EngPowerAsset).where(EngPowerAsset.id == t.asset_id))
        asset = qa.scalar_one_or_none()
        results.append({
            "id": t.id,
            "asset_id": t.asset_id,
            "asset_tag": asset.asset_tag if asset else "Unknown",
            "asset_name": asset.asset_name if asset else "Power Component",
            "timestamp": t.timestamp,
            "active_power_mw": t.active_power_mw,
            "grid_frequency_hz": t.grid_frequency_hz,
            "ambient_temperature_c": t.ambient_temperature_c,
            "internal_temperature_c": t.internal_temperature_c,
            "efficiency_ratio_pct": t.efficiency_ratio_pct,
            "curtailment_active": t.curtailment_active
        })
    return results

@router.post("/telemetry")
async def create_telemetry(
    payload: TelemetryCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    log = EngTelemetryLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        asset_id=payload.asset_id,
        timestamp=payload.timestamp,
        active_power_mw=payload.active_power_mw,
        grid_frequency_hz=payload.grid_frequency_hz,
        ambient_temperature_c=payload.ambient_temperature_c,
        internal_temperature_c=payload.internal_temperature_c,
        efficiency_ratio_pct=payload.efficiency_ratio_pct,
        curtailment_active=payload.curtailment_active
    )
    db.add(log)
    await db.commit()
    return log

@router.get("/ptws")
async def list_ptws(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EngPermitToWork).where(EngPermitToWork.tenant_id == tenant_id))
    ptws = q.scalars().all()
    results = []
    for p in ptws:
        qa = await db.execute(select(EngPowerAsset).where(EngPowerAsset.id == p.asset_id))
        asset = qa.scalar_one_or_none()
        results.append({
            "id": p.id,
            "asset_id": p.asset_id,
            "asset_tag": asset.asset_tag if asset else "General Asset",
            "ptw_number": p.ptw_number,
            "work_type": p.work_type,
            "description": p.description,
            "lead_technician": p.lead_technician,
            "safety_officer": p.safety_officer,
            "loto_confirmed": p.loto_confirmed,
            "valid_from": p.valid_from,
            "valid_to": p.valid_to,
            "status": p.status
        })
    return results

@router.post("/ptws")
async def create_ptw(
    payload: PtwCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ptw = EngPermitToWork(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        asset_id=payload.asset_id,
        ptw_number=payload.ptw_number,
        work_type=payload.work_type,
        description=payload.description,
        lead_technician=payload.lead_technician,
        safety_officer=payload.safety_officer,
        loto_confirmed=payload.loto_confirmed,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        status=payload.status
    )
    db.add(ptw)
    await db.commit()
    return ptw

@router.get("/ppa-billings")
async def list_ppa_billings(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EngPpaBilling).where(EngPpaBilling.tenant_id == tenant_id).order_by(EngPpaBilling.created_at.desc()))
    return q.scalars().all()

@router.post("/ppa-billings")
async def create_ppa_billing(
    payload: PpaBillingCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    total = payload.total_billed_egp
    if total == 0:
        total = payload.delivered_mwh * payload.peak_tariff_egp_per_mwh + payload.curtailment_compensation_egp

    billing = EngPpaBilling(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        billing_period=payload.billing_period,
        offtaker_name=payload.offtaker_name,
        delivered_mwh=payload.delivered_mwh,
        peak_tariff_egp_per_mwh=payload.peak_tariff_egp_per_mwh,
        off_peak_tariff_egp_per_mwh=payload.off_peak_tariff_egp_per_mwh,
        total_billed_egp=total,
        curtailment_compensation_egp=payload.curtailment_compensation_egp,
        status=payload.status
    )
    db.add(billing)
    await db.commit()
    return billing

@router.get("/incidents")
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EngHseIncident).where(EngHseIncident.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/incidents")
async def create_incident(
    payload: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    incident = EngHseIncident(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        incident_ref=payload.incident_ref,
        incident_type=payload.incident_type,
        severity=payload.severity,
        location=payload.location,
        description=payload.description,
        corrective_action=payload.corrective_action,
        reported_by=payload.reported_by,
        incident_date=payload.incident_date,
        status=payload.status
    )
    db.add(incident)
    await db.commit()
    return incident

@router.post("/seed")
async def seed_eng_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Energy & Power Generation Plant ERP."""
    q_existing = await db.execute(select(EngPowerAsset).where(EngPowerAsset.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Energy module already seeded"}

    # 1. Assets
    a1_id = str(uuid.uuid4())
    a2_id = str(uuid.uuid4())
    assets = [
        EngPowerAsset(
            id=a1_id,
            tenant_id=tenant_id,
            asset_tag="KKS-BNB-INV-01",
            asset_name="محول طاقة شمسية مركزي SMA Sunny Central 4400 UP (Inverter Station)",
            plant_name="محطة بنبان للطاقة الشمسية (مجمع أسوان للطاقة المتجددة)",
            system_type="solar_pv_inverter",
            rated_capacity_mw=4.4,
            installation_date="2022-03-15",
            status="online"
        ),
        EngPowerAsset(
            id=a2_id,
            tenant_id=tenant_id,
            asset_tag="KKS-BNB-TRF-02",
            asset_name="محول رفع الجهد الرئيسي ABB 33/220 kV Step-Up Power Transformer",
            plant_name="محطة بنبان للطاقة الشمسية - محطة محولات الربط بالشبكة الموحدة",
            system_type="stepup_transformer",
            rated_capacity_mw=50.0,
            installation_date="2022-03-20",
            status="online"
        )
    ]
    for a in assets:
        db.add(a)
    await db.flush()

    # 2. Telemetry
    telemetry = [
        EngTelemetryLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            asset_id=a1_id,
            timestamp="2026-11-02 11:30:00",
            active_power_mw=4.18,
            grid_frequency_hz=50.02,
            ambient_temperature_c=29.4,
            internal_temperature_c=48.2,
            efficiency_ratio_pct=98.8,
            curtailment_active=False
        )
    ]
    for t in telemetry:
        db.add(t)

    # 3. Permit to Work (PTW / LOTO)
    ptw = EngPermitToWork(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        asset_id=a2_id,
        ptw_number="PTW-HV-2026-0042",
        work_type="high_voltage_isolation",
        description="فحص دوري لعوازل الجهد العالي 220 ك.ف واختبار عزل زيت المحول الكيميائي DGA",
        lead_technician="م. شريف عبد العظيم (مهندس صيانة الجهد العالي)",
        safety_officer="م. هاني الفقي (مدير السلامة والصحة المهنية HSE)",
        loto_confirmed=True,
        valid_from="2026-11-02 06:00",
        valid_to="2026-11-02 18:00",
        status="active"
    )
    db.add(ptw)

    # 4. PPA Billing
    billing = EngPpaBilling(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        billing_period="2026-10",
        offtaker_name="الشركة المصرية لنقل الكهرباء (EETC)",
        delivered_mwh=14850.0,
        peak_tariff_egp_per_mwh=1450.0,
        off_peak_tariff_egp_per_mwh=980.0,
        total_billed_egp=19250000.0,
        curtailment_compensation_egp=420000.0,
        status="approved"
    )
    db.add(billing)

    # 5. HSE Incident
    incident = EngHseIncident(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        incident_ref="HSE-2026-002",
        incident_type="near_miss",
        severity="low",
        location="ساحة المحولات 220 ك.ف - بوابة التفريغ",
        description="تسريب طفيف لقطرات زيت عازل عند محبس أخذ العينات تم تداركه فوراً باستخدام حوض التجميع الرملي",
        corrective_action="إحكام ربط الجوان الحلقي O-Ring واستبدال محبس الفحص وتحديث سجل فحص التسريبات الأسبوعي",
        reported_by="م. تامر الجندي (مهندس موقع)",
        incident_date="2026-10-25",
        status="closed"
    )
    db.add(incident)

    await db.commit()
    return {"message": "Energy module seeded successfully"}
