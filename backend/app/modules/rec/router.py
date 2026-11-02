"""API Router for Real Estate & Property Management ERP module (RE-01..12)."""
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

from app.modules.rec.models import (
    RecProperty,
    RecUnit,
    RecLeaseContract,
    RecPdcCheque,
    RecMaintenanceTicket,
)

router = APIRouter(prefix="/rec", tags=["Real Estate & Property Management ERP"])

# Pydantic Schemas
class PropertyCreate(BaseModel):
    property_code: str
    property_name: str
    property_type: str = "commercial_mall"
    city: str
    district: str
    total_units_count: int = 0
    gross_leasable_area_sqm: float = 0.0

class UnitCreate(BaseModel):
    property_id: str
    unit_number: str
    floor: str
    unit_type: str = "office"
    area_sqm: float = 0.0
    annual_rent_rate_egp: float = 0.0
    service_charge_sqm_egp: float = 150.0
    status: str = "vacant"
    current_tenant_name: Optional[str] = None

class ContractCreate(BaseModel):
    unit_id: str
    contract_ref: str
    tenant_name: str
    tenant_national_id: str
    tenant_phone: str
    start_date: str
    end_date: str
    annual_rent_egp: float
    payment_frequency: str = "quarterly"
    security_deposit_egp: float = 0.0

class ChequeCreate(BaseModel):
    contract_id: str
    cheque_number: str
    bank_name: str
    amount_egp: float
    due_date: str
    status: str = "in_safe"

class ChequeStatusUpdate(BaseModel):
    status: str
    collected_at: Optional[str] = None

class TicketCreate(BaseModel):
    unit_id: str
    ticket_ref: str
    category: str = "HVAC / Chiller"
    description: str
    reported_by: str
    cost_egp: float = 0.0
    is_cam_apportioned: bool = False
    status: str = "open"

# Endpoints
@router.get("/summary")
async def get_rec_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_props = await db.execute(select(RecProperty).where(RecProperty.tenant_id == tenant_id))
    props = q_props.scalars().all()

    q_units = await db.execute(select(RecUnit).where(RecUnit.tenant_id == tenant_id))
    units = q_units.scalars().all()
    total_units = len(units)
    leased_units = sum(1 for u in units if u.status == "leased")
    vacant_units = sum(1 for u in units if u.status == "vacant")
    occupancy_rate = round((leased_units / total_units * 100), 1) if total_units > 0 else 0.0

    q_contracts = await db.execute(select(RecLeaseContract).where(RecLeaseContract.tenant_id == tenant_id, RecLeaseContract.status == "active"))
    contracts = q_contracts.scalars().all()
    total_annual_rent = sum(c.annual_rent_egp for c in contracts)

    q_tickets = await db.execute(select(RecMaintenanceTicket).where(RecMaintenanceTicket.tenant_id == tenant_id, RecMaintenanceTicket.status != "resolved"))
    open_tickets = len(q_tickets.scalars().all())

    return {
        "total_properties_count": len(props),
        "total_units_count": total_units,
        "leased_units_count": leased_units,
        "vacant_units_count": vacant_units,
        "occupancy_rate_pct": occupancy_rate,
        "total_annual_rent_egp": total_annual_rent,
        "open_maintenance_tickets_count": open_tickets
    }

@router.get("/properties")
async def list_properties(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(RecProperty).where(RecProperty.tenant_id == tenant_id).order_by(RecProperty.created_at.desc()))
    return q.scalars().all()

@router.post("/properties")
async def create_property(
    payload: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    prop = RecProperty(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        property_code=payload.property_code,
        property_name=payload.property_name,
        property_type=payload.property_type,
        city=payload.city,
        district=payload.district,
        total_units_count=payload.total_units_count,
        gross_leasable_area_sqm=payload.gross_leasable_area_sqm
    )
    db.add(prop)
    await db.commit()
    return prop

@router.get("/units")
async def list_units(
    property_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    stmt = select(RecUnit).where(RecUnit.tenant_id == tenant_id)
    if property_id:
        stmt = stmt.where(RecUnit.property_id == property_id)
    q = await db.execute(stmt)
    units = q.scalars().all()
    results = []
    for u in units:
        qp = await db.execute(select(RecProperty).where(RecProperty.id == u.property_id))
        p = qp.scalar_one_or_none()
        results.append({
            "id": u.id,
            "property_id": u.property_id,
            "property_name": p.property_name if p else "Unknown Property",
            "unit_number": u.unit_number,
            "floor": u.floor,
            "unit_type": u.unit_type,
            "area_sqm": u.area_sqm,
            "annual_rent_rate_egp": u.annual_rent_rate_egp,
            "service_charge_sqm_egp": u.service_charge_sqm_egp,
            "status": u.status,
            "current_tenant_name": u.current_tenant_name
        })
    return results

@router.post("/units")
async def create_unit(
    payload: UnitCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    unit = RecUnit(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        property_id=payload.property_id,
        unit_number=payload.unit_number,
        floor=payload.floor,
        unit_type=payload.unit_type,
        area_sqm=payload.area_sqm,
        annual_rent_rate_egp=payload.annual_rent_rate_egp,
        service_charge_sqm_egp=payload.service_charge_sqm_egp,
        status=payload.status,
        current_tenant_name=payload.current_tenant_name
    )
    db.add(unit)
    await db.commit()
    return unit

@router.get("/contracts")
async def list_contracts(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(RecLeaseContract).where(RecLeaseContract.tenant_id == tenant_id).order_by(RecLeaseContract.created_at.desc()))
    contracts = q.scalars().all()
    results = []
    for c in contracts:
        qu = await db.execute(select(RecUnit).where(RecUnit.id == c.unit_id))
        unit = qu.scalar_one_or_none()
        unit_number = unit.unit_number if unit else "Unknown"
        results.append({
            "id": c.id,
            "unit_id": c.unit_id,
            "unit_number": unit_number,
            "contract_ref": c.contract_ref,
            "tenant_name": c.tenant_name,
            "tenant_national_id": c.tenant_national_id,
            "tenant_phone": c.tenant_phone,
            "start_date": c.start_date,
            "end_date": c.end_date,
            "annual_rent_egp": c.annual_rent_egp,
            "payment_frequency": c.payment_frequency,
            "security_deposit_egp": c.security_deposit_egp,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return results

@router.post("/contracts")
async def create_contract(
    payload: ContractCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    contract = RecLeaseContract(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        unit_id=payload.unit_id,
        contract_ref=payload.contract_ref,
        tenant_name=payload.tenant_name,
        tenant_national_id=payload.tenant_national_id,
        tenant_phone=payload.tenant_phone,
        start_date=payload.start_date,
        end_date=payload.end_date,
        annual_rent_egp=payload.annual_rent_egp,
        payment_frequency=payload.payment_frequency,
        security_deposit_egp=payload.security_deposit_egp,
        status="active"
    )
    db.add(contract)

    # Automatically mark unit as leased
    qu = await db.execute(select(RecUnit).where(RecUnit.id == payload.unit_id, RecUnit.tenant_id == tenant_id))
    unit = qu.scalar_one_or_none()
    if unit:
        unit.status = "leased"
        unit.current_tenant_name = payload.tenant_name

    await db.commit()
    return contract

@router.get("/cheques")
async def list_cheques(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(RecPdcCheque).where(RecPdcCheque.tenant_id == tenant_id).order_by(RecPdcCheque.due_date.asc()))
    cheques = q.scalars().all()
    results = []
    for ch in cheques:
        qc = await db.execute(select(RecLeaseContract).where(RecLeaseContract.id == ch.contract_id))
        contract = qc.scalar_one_or_none()
        results.append({
            "id": ch.id,
            "contract_id": ch.contract_id,
            "contract_ref": contract.contract_ref if contract else "Unknown",
            "tenant_name": contract.tenant_name if contract else "Unknown",
            "cheque_number": ch.cheque_number,
            "bank_name": ch.bank_name,
            "amount_egp": ch.amount_egp,
            "due_date": ch.due_date,
            "status": ch.status,
            "collected_at": ch.collected_at
        })
    return results

@router.post("/cheques")
async def create_cheque(
    payload: ChequeCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ch = RecPdcCheque(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        contract_id=payload.contract_id,
        cheque_number=payload.cheque_number,
        bank_name=payload.bank_name,
        amount_egp=payload.amount_egp,
        due_date=payload.due_date,
        status=payload.status
    )
    db.add(ch)
    await db.commit()
    return ch

@router.post("/cheques/{id}/status")
async def update_cheque_status(
    id: str,
    payload: ChequeStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(RecPdcCheque).where(RecPdcCheque.id == id, RecPdcCheque.tenant_id == tenant_id))
    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Cheque not found")
    ch.status = payload.status
    if payload.collected_at:
        ch.collected_at = payload.collected_at
    await db.commit()
    return ch

@router.get("/tickets")
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(RecMaintenanceTicket).where(RecMaintenanceTicket.tenant_id == tenant_id).order_by(RecMaintenanceTicket.created_at.desc()))
    tickets = q.scalars().all()
    results = []
    for t in tickets:
        qu = await db.execute(select(RecUnit).where(RecUnit.id == t.unit_id))
        unit = qu.scalar_one_or_none()
        results.append({
            "id": t.id,
            "unit_id": t.unit_id,
            "unit_number": unit.unit_number if unit else "General CAM",
            "ticket_ref": t.ticket_ref,
            "category": t.category,
            "description": t.description,
            "reported_by": t.reported_by,
            "cost_egp": t.cost_egp,
            "is_cam_apportioned": t.is_cam_apportioned,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    return results

@router.post("/tickets")
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ticket = RecMaintenanceTicket(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        unit_id=payload.unit_id,
        ticket_ref=payload.ticket_ref,
        category=payload.category,
        description=payload.description,
        reported_by=payload.reported_by,
        cost_egp=payload.cost_egp,
        is_cam_apportioned=payload.is_cam_apportioned,
        status=payload.status
    )
    db.add(ticket)
    await db.commit()
    return ticket

@router.post("/seed")
async def seed_rec_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Real Estate & Property Management ERP."""
    q_existing = await db.execute(select(RecProperty).where(RecProperty.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Real Estate module already seeded"}

    # 1. Properties
    prop1_id = str(uuid.uuid4())
    prop2_id = str(uuid.uuid4())
    properties = [
        RecProperty(
            id=prop1_id,
            tenant_id=tenant_id,
            property_code="PROP-MALL-01",
            property_name="كايرو جيت سيتي مول والمكاتب الإدارية (Cairo Gate Mall & Offices)",
            property_type="commercial_mall",
            city="القاهرة الجديدة",
            district="التجمع الخامس - شارع التسعين الشمالي",
            total_units_count=45,
            gross_leasable_area_sqm=38500.0
        ),
        RecProperty(
            id=prop2_id,
            tenant_id=tenant_id,
            property_code="PROP-CPD-02",
            property_name="كمبوند بالم جروف ريزيدنس الفاخر (Palm Grove Residences)",
            property_type="residential_compound",
            city="مدينة السادس من أكتوبر",
            district="منطقة التوسعات الشرقية",
            total_units_count=120,
            gross_leasable_area_sqm=54000.0
        )
    ]
    for p in properties:
        db.add(p)
    await db.flush()

    # 2. Units
    u1_id = str(uuid.uuid4())
    u2_id = str(uuid.uuid4())
    u3_id = str(uuid.uuid4())
    units = [
        RecUnit(
            id=u1_id,
            tenant_id=tenant_id,
            property_id=prop1_id,
            unit_number="RETAIL-G-04",
            floor="الدور الأرضي - واجهة البلازا",
            unit_type="retail_shop",
            area_sqm=280.0,
            annual_rent_rate_egp=1850000.0,
            service_charge_sqm_egp=240.0,
            status="leased",
            current_tenant_name="ستاربكس كوفي (Starbucks Egypt)"
        ),
        RecUnit(
            id=u2_id,
            tenant_id=tenant_id,
            property_id=prop1_id,
            unit_number="OFFICE-03-B",
            floor="الدور الثالث - برج المكاتب",
            unit_type="office",
            area_sqm=450.0,
            annual_rent_rate_egp=1350000.0,
            service_charge_sqm_egp=190.0,
            status="leased",
            current_tenant_name="شركة برايس ووترهاوس كوبرز (PwC Consulting)"
        ),
        RecUnit(
            id=u3_id,
            tenant_id=tenant_id,
            property_id=prop1_id,
            unit_number="RETAIL-F1-12",
            floor="الدور الأول - ممشى الموضة",
            unit_type="retail_shop",
            area_sqm=190.0,
            annual_rent_rate_egp=890000.0,
            service_charge_sqm_egp=210.0,
            status="vacant",
            current_tenant_name=None
        )
    ]
    for u in units:
        db.add(u)
    await db.flush()

    # 3. Lease Contracts
    c1_id = str(uuid.uuid4())
    contracts = [
        RecLeaseContract(
            id=c1_id,
            tenant_id=tenant_id,
            unit_id=u1_id,
            contract_ref="LSE-2026-STARBUCKS",
            tenant_name="مجموعة الشايع مصر للتجارة (Alshaya Group - Starbucks)",
            tenant_national_id="REG-CO-884129",
            tenant_phone="01002938475",
            start_date="2026-01-01",
            end_date="2029-12-31",
            annual_rent_egp=1850000.0,
            payment_frequency="quarterly",
            security_deposit_egp=462500.0,
            status="active"
        )
    ]
    for c in contracts:
        db.add(c)
    await db.flush()

    # 4. Cheques
    cheques = [
        RecPdcCheque(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            contract_id=c1_id,
            cheque_number="CHQ-CIB-99214",
            bank_name="البنك التجاري الدولي (CIB) - فرع مول مصر",
            amount_egp=462500.0,
            due_date="2026-11-15",
            status="in_safe",
            collected_at=None
        ),
        RecPdcCheque(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            contract_id=c1_id,
            cheque_number="CHQ-CIB-99215",
            bank_name="البنك التجاري الدولي (CIB) - فرع مول مصر",
            amount_egp=462500.0,
            due_date="2027-02-15",
            status="in_safe",
            collected_at=None
        )
    ]
    for ch in cheques:
        db.add(ch)

    # 5. Maintenance Ticket
    ticket = RecMaintenanceTicket(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        unit_id=u1_id,
        ticket_ref="TKT-CAM-2026-042",
        category="HVAC / Chiller",
        description="صيانة فلاتر وحدة مناولة الهواء AHU المركزية المغذية لفرع ستاربكس وضبط ضغط الفريون",
        reported_by="م. تامر الشنواني (إدارة المرافق والتشغيل)",
        cost_egp=8500.0,
        is_cam_apportioned=True,
        status="in_progress"
    )
    db.add(ticket)

    await db.commit()
    return {"message": "Real Estate module seeded successfully"}
