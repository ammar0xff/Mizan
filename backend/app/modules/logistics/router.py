"""API router for Logistics, Fleet & Transportation module (LOG-01..11)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.logistics.models import (
    LogisticsCargoClaim,
    LogisticsConsignment,
    LogisticsDriver,
    LogisticsFuelLog,
    LogisticsRouteTrip,
    LogisticsVehicle,
)

router = APIRouter(prefix="/logistics", tags=["logistics"])


# ------------------ Schemas ------------------ #
class ConsignmentCreate(BaseModel):
    waybill_type: str = "domestic_waybill"
    sender_name: str
    sender_city: str = "القاهرة"
    consignee_name: str
    consignee_phone: str
    consignee_city: str = "الإسكندرية"
    consignee_address: str
    cargo_description: str
    package_count: int = 1
    actual_weight_kg: float = 1.0
    length_cm: float = 30.0
    width_cm: float = 20.0
    height_cm: float = 15.0
    cod_amount: float = 0.0
    freight_rate_per_kg: float = 12.0
    accessorial_charges: float = 0.0
    hazard_class: str = "بضائع عامة غير خطرة"


class MilestoneUpdate(BaseModel):
    status: str
    milestone_text: str


class EpodSubmit(BaseModel):
    recipient_name: str
    notes: str = ""


class VehicleCreate(BaseModel):
    plate_number: str
    vehicle_type: str
    make_model: str = "مرسيدس أكتروس 2024"
    payload_capacity_kg: float = 10000.0
    cargo_volume_cbm: float = 45.0
    is_refrigerated: bool = False
    odometer_km: float = 50000.0
    license_expiry: str
    insurance_expiry: str


class DriverCreate(BaseModel):
    name: str
    phone: str
    national_id: str
    license_grade: str = "رخصة درجة أولى مهنية"
    license_expiry: str
    medical_fitness: bool = True
    max_daily_hours: float = 9.0


class TripDispatchCreate(BaseModel):
    trip_code: str
    origin_hub: str = "المستودع الرئيسي - القاهرة"
    destination_hub: str = "فرع التوزيع - الإسكندرية"
    assigned_vehicle_plate: str
    assigned_driver_name: str
    total_distance_km: float = 225.0
    total_consignments: int = 12
    departure_time: str
    arrival_time_est: str


class FuelLogCreate(BaseModel):
    vehicle_plate: str
    driver_name: str
    date: str
    liters_pumped: float
    cost_total: float
    odometer_at_fill: float
    fuel_station: str = "محطة وطنية"
    receipt_number: str


class ClaimCreate(BaseModel):
    consignment_tracking: str
    claimant_name: str
    claim_type: str = "damage"
    claimed_amount: float
    incident_description: str


class ClaimSettle(BaseModel):
    settled_amount: float
    status: str = "settled"


# ------------------ Endpoints ------------------ #
@router.get("/summary")
async def get_logistics_summary(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Return key metrics and KPIs across logistics & fleet operations."""
    # Consignments
    res_cons = await db.execute(select(LogisticsConsignment))
    consignments = res_cons.scalars().all()
    total_consignments = len(consignments)
    in_transit_count = sum(1 for c in consignments if c.status in ("in_transit", "vehicle_allocated", "out_for_delivery"))
    delivered_count = sum(1 for c in consignments if c.status == "delivered")
    total_cod_pending = sum(c.cod_amount for c in consignments if c.status != "delivered" and c.cod_amount > 0)
    total_freight_revenue = sum(c.total_charges for c in consignments)

    # Vehicles & Drivers
    res_veh = await db.execute(select(func.count(LogisticsVehicle.id)))
    vehicles_count = res_veh.scalar_one() or 0

    res_drv = await db.execute(select(func.count(LogisticsDriver.id)))
    drivers_count = res_drv.scalar_one() or 0

    # Claims
    res_claims = await db.execute(select(func.count(LogisticsCargoClaim.id)))
    claims_count = res_claims.scalar_one() or 0

    return {
        "total_consignments": total_consignments,
        "in_transit_count": in_transit_count,
        "delivered_count": delivered_count,
        "delivery_success_rate": round((delivered_count / total_consignments * 100), 1) if total_consignments > 0 else 0,
        "total_cod_pending": round(total_cod_pending, 2),
        "total_freight_revenue": round(total_freight_revenue, 2),
        "vehicles_count": vehicles_count,
        "drivers_count": drivers_count,
        "claims_count": claims_count,
    }


@router.get("/consignments")
async def list_consignments(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsConsignment).order_by(desc(LogisticsConsignment.created_at)))
    return res.scalars().all()


@router.post("/consignments")
async def create_consignment(
    body: ConsignmentCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    # Volumetric weight calculation: (L * W * H) / 3000 for domestic road freight
    volumetric_kg = (body.length_cm * body.width_cm * body.height_cm) / 3000.0
    chargeable_kg = max(body.actual_weight_kg, volumetric_kg)
    freight = chargeable_kg * body.freight_rate_per_kg
    total = freight + body.accessorial_charges

    tracking = f"AWB-2026-{uuid.uuid4().hex[:6].upper()}"

    item = LogisticsConsignment(
        tracking_number=tracking,
        waybill_type=body.waybill_type,
        sender_name=body.sender_name,
        sender_city=body.sender_city,
        consignee_name=body.consignee_name,
        consignee_phone=body.consignee_phone,
        consignee_city=body.consignee_city,
        consignee_address=body.consignee_address,
        cargo_description=body.cargo_description,
        package_count=body.package_count,
        actual_weight_kg=round(body.actual_weight_kg, 2),
        volumetric_weight_kg=round(volumetric_kg, 2),
        chargeable_weight_kg=round(chargeable_kg, 2),
        cod_amount=round(body.cod_amount, 2),
        freight_charges=round(freight, 2),
        accessorial_charges=round(body.accessorial_charges, 2),
        total_charges=round(total, 2),
        status="booked",
        current_milestone="تم إصدار بوليصة الشحن بانتظار الفحص والتحميل",
        hazard_class=body.hazard_class,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/consignments/{id}/milestone")
async def advance_consignment_milestone(
    id: str,
    body: MilestoneUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsConsignment).where(LogisticsConsignment.id == id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="بوليصة الشحن غير موجودة")
    rec.status = body.status
    rec.current_milestone = body.milestone_text
    await db.commit()
    return {"status": "success", "consignment_status": rec.status, "milestone": rec.current_milestone}


@router.post("/consignments/{id}/epod")
async def submit_digital_proof_of_delivery(
    id: str,
    body: EpodSubmit,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsConsignment).where(LogisticsConsignment.id == id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="بوليصة الشحن غير موجودة")
    rec.status = "delivered"
    rec.current_milestone = f"تم التسليم النهائي للمستلم ({body.recipient_name}) وتوثيق إثبات التسليم الرقمي e-POD"
    rec.pod_recipient_name = body.recipient_name
    rec.pod_signature_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rec.pod_notes = body.notes
    rec.delivered_at = datetime.now()
    await db.commit()
    return {"status": "success", "delivered": True, "pod_recipient": rec.pod_recipient_name}


@router.get("/vehicles")
async def list_vehicles(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsVehicle).order_by(LogisticsVehicle.plate_number))
    return res.scalars().all()


@router.post("/vehicles")
async def create_vehicle(
    body: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    veh = LogisticsVehicle(**body.model_dump())
    db.add(veh)
    await db.commit()
    await db.refresh(veh)
    return veh


@router.get("/drivers")
async def list_drivers(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsDriver).order_by(LogisticsDriver.name))
    return res.scalars().all()


@router.post("/drivers")
async def create_driver(
    body: DriverCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    drv = LogisticsDriver(**body.model_dump())
    db.add(drv)
    await db.commit()
    await db.refresh(drv)
    return drv


@router.get("/trips")
async def list_trips(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsRouteTrip).order_by(desc(LogisticsRouteTrip.created_at)))
    return res.scalars().all()


@router.post("/trips")
async def create_trip(
    body: TripDispatchCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    trip = LogisticsRouteTrip(**body.model_dump(), status="in_transit")
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.post("/trips/{id}/complete")
async def complete_trip(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsRouteTrip).where(LogisticsRouteTrip.id == id))
    trip = res.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="الرحلة غير موجودة")
    trip.status = "completed"
    await db.commit()
    return {"status": "success", "trip_status": trip.status}


@router.get("/fuel-logs")
async def list_fuel_logs(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsFuelLog).order_by(desc(LogisticsFuelLog.date)))
    return res.scalars().all()


@router.post("/fuel-logs")
async def create_fuel_log(
    body: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    log = LogisticsFuelLog(**body.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/claims")
async def list_cargo_claims(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsCargoClaim).order_by(desc(LogisticsCargoClaim.created_at)))
    return res.scalars().all()


@router.post("/claims")
async def create_cargo_claim(
    body: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    claim = LogisticsCargoClaim(**body.model_dump())
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    return claim


@router.post("/claims/{id}/settle")
async def settle_cargo_claim(
    id: str,
    body: ClaimSettle,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(LogisticsCargoClaim).where(LogisticsCargoClaim.id == id))
    claim = res.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="طلب التعويض غير موجود")
    claim.status = body.status
    claim.settled_amount = body.settled_amount
    await db.commit()
    return {"status": "success", "claim_status": claim.status, "settled_amount": claim.settled_amount}


@router.post("/seed")
async def seed_logistics_sample_data(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Seed initial sample fleet and consignments if empty."""
    res = await db.execute(select(func.count(LogisticsVehicle.id)))
    count = res.scalar_one() or 0
    if count > 0:
        return {"status": "already_seeded", "message": "بيانات اللوجستيات موجودة بالفعل"}

    # 1. Vehicles
    vehicles = [
        LogisticsVehicle(
            plate_number="ق ن ج 4812",
            vehicle_type="شاحنة نقل ثقيل ستارة 40 قدم",
            make_model="مرسيدس أكتروس 2024",
            payload_capacity_kg=24000.0,
            cargo_volume_cbm=78.0,
            is_refrigerated=False,
            odometer_km=84500.0,
            license_expiry="2027-04-15",
            insurance_expiry="2027-05-01",
            status="available",
            last_service_km=80000.0,
            next_service_km=90000.0,
        ),
        LogisticsVehicle(
            plate_number="س و ر 1935",
            vehicle_type="شاحنة مبردة لحوم ومستحضرات 10 طن",
            make_model="إيسوزو فوروارد FTR مبرد",
            payload_capacity_kg=10000.0,
            cargo_volume_cbm=35.0,
            is_refrigerated=True,
            odometer_km=42300.0,
            license_expiry="2027-08-20",
            insurance_expiry="2027-09-01",
            status="on_trip",
            last_service_km=40000.0,
            next_service_km=50000.0,
        ),
        LogisticsVehicle(
            plate_number="د ط م 7721",
            vehicle_type="شاحنة توصيل سريع مغلقة (جامبو)",
            make_model="شيفروليه جامبو 7000",
            payload_capacity_kg=4500.0,
            cargo_volume_cbm=18.0,
            is_refrigerated=False,
            odometer_km=28900.0,
            license_expiry="2026-12-10",
            insurance_expiry="2026-12-31",
            status="available",
            last_service_km=25000.0,
            next_service_km=35000.0,
        ),
    ]
    db.add_all(vehicles)

    # 2. Drivers
    drivers = [
        LogisticsDriver(
            name="كابتن/ محمود عبد التواب",
            phone="01019882233",
            national_id="28509121400234",
            license_grade="رخصة درجة أولى مهنية (نقل ثقيل وتريلات)",
            license_expiry="2028-02-14",
            medical_fitness=True,
            max_daily_hours=9.0,
            logged_hours_today=4.0,
            status="available",
        ),
        LogisticsDriver(
            name="كابتن/ إبراهيم العزازي",
            phone="01224556677",
            national_id="29003152200567",
            license_grade="رخصة درجة أولى (نقل مبرد ومواد حساسة)",
            license_expiry="2027-11-30",
            medical_fitness=True,
            max_daily_hours=9.0,
            logged_hours_today=7.5,
            status="on_trip",
        ),
    ]
    db.add_all(drivers)

    # 3. Consignments
    consignments = [
        LogisticsConsignment(
            tracking_number="AWB-2026-CAI-9011",
            waybill_type="domestic_waybill",
            sender_name="شركة الدلتا للصناعات الغذائية",
            sender_city="القاهرة",
            consignee_name="سوبرماركت المدينة المنورة",
            consignee_phone="01154332211",
            consignee_city="الإسكندرية",
            consignee_address="طريق الحرية، زيزينيا، الإسكندرية",
            cargo_description="كراتين معلبات غذائية ومشروبات عصائر",
            package_count=45,
            actual_weight_kg=650.0,
            volumetric_weight_kg=520.0,
            chargeable_weight_kg=650.0,
            cod_amount=18500.0,
            freight_charges=2600.0,
            accessorial_charges=250.0,
            total_charges=2850.0,
            status="in_transit",
            current_milestone="غادرت الشاحنة مركز فرز القاهرة متجهة إلى الإسكندرية",
        ),
        LogisticsConsignment(
            tracking_number="AWB-2026-CAI-9012",
            waybill_type="domestic_waybill",
            sender_name="مؤسسة النصر للأجهزة الكهربائية",
            sender_city="العاشر من رمضان",
            consignee_name="مركز تكنو تريد للتوزيع",
            consignee_phone="01099223344",
            consignee_city="طنطا",
            consignee_address="شارع الجيش، ميدان المحطة، طنطا",
            cargo_description="شاشات تلفزيون وغسالات أوتوماتيك",
            package_count=18,
            actual_weight_kg=480.0,
            volumetric_weight_kg=710.0,
            chargeable_weight_kg=710.0,
            cod_amount=0.0,
            freight_charges=3550.0,
            accessorial_charges=400.0,
            total_charges=3950.0,
            status="delivered",
            current_milestone="تم التسليم النهائي للمستلم وتوثيق إثبات التسليم الرقمي e-POD",
            pod_recipient_name="أحمد عبد الرازق (مدير المخازن)",
            pod_signature_date="2026-11-01 14:30:00",
            pod_notes="تم فحص الشحنة وسلامة الأختام واستلام 18 كرتونة بحالة ممتازة",
            delivered_at=datetime.now(),
        ),
    ]
    db.add_all(consignments)

    # 4. Route Trips
    trips = [
        LogisticsRouteTrip(
            trip_code="TRIP-CAI-ALX-014",
            origin_hub="المستودع اللوجستي المركزي - العبور",
            destination_hub="محطة توزيع سموحة - الإسكندرية",
            assigned_vehicle_plate="ق ن ج 4812",
            assigned_driver_name="كابتن/ محمود عبد التواب",
            total_distance_km=220.0,
            total_consignments=18,
            departure_time="07:30 ص",
            arrival_time_est="11:45 ص",
            status="in_transit",
        )
    ]
    db.add_all(trips)

    # 5. Fuel Log
    fuels = [
        LogisticsFuelLog(
            vehicle_plate="ق ن ج 4812",
            driver_name="كابتن/ محمود عبد التواب",
            date="2026-11-01",
            liters_pumped=160.0,
            cost_total=2400.0,
            odometer_at_fill=84280.0,
            fuel_station="محطة وطنية - كفر الدوار",
            receipt_number="GAS-99812",
        )
    ]
    db.add_all(fuels)

    # 6. Claims
    claims = [
        LogisticsCargoClaim(
            consignment_tracking="AWB-2026-CAI-9011",
            claimant_name="شركة الدلتا للصناعات الغذائية",
            claim_type="damage",
            claimed_amount=1200.0,
            settled_amount=1200.0,
            incident_description="تلف كرتونة عصائر أثناء التفريغ بمحطة النقل الوسيطة",
            status="settled",
        )
    ]
    db.add_all(claims)

    await db.commit()
    return {"status": "seeded", "message": "تم تهيئة بيانات الشحن واللوجستيات التجريبية بنجاح"}
