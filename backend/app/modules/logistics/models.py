"""Database models for Logistics, Fleet & Transportation module (LOG-01..11)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class LogisticsConsignment(TenantScoped, Base):
    """Consignment & Shipment Lifecycle with BoL & e-POD (LOG-01, 02, 03, 07, 08, 09)."""
    __tablename__ = "logistics_consignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # AWB-2026-XXXX
    waybill_type: Mapped[str] = mapped_column(String(32), default="domestic_waybill")  # domestic_waybill, cmr_international, sea_bol
    sender_name: Mapped[str] = mapped_column(String(128))
    sender_city: Mapped[str] = mapped_column(String(64), default="القاهرة")
    consignee_name: Mapped[str] = mapped_column(String(128), index=True)
    consignee_phone: Mapped[str] = mapped_column(String(32))
    consignee_city: Mapped[str] = mapped_column(String(64), default="الإسكندرية")
    consignee_address: Mapped[str] = mapped_column(String(256))
    cargo_description: Mapped[str] = mapped_column(String(256))
    package_count: Mapped[int] = mapped_column(Integer, default=1)
    actual_weight_kg: Mapped[float] = mapped_column(Float, default=1.0)
    volumetric_weight_kg: Mapped[float] = mapped_column(Float, default=1.0)
    chargeable_weight_kg: Mapped[float] = mapped_column(Float, default=1.0)
    cod_amount: Mapped[float] = mapped_column(Float, default=0.0)
    freight_charges: Mapped[float] = mapped_column(Float, default=0.0)
    accessorial_charges: Mapped[float] = mapped_column(Float, default=0.0)
    total_charges: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="booked")  # booked, vehicle_allocated, in_transit, out_for_delivery, delivered, exception
    current_milestone: Mapped[str] = mapped_column(String(128), default="تم حجز الشحنة بانتظار التحميل")
    hazard_class: Mapped[str] = mapped_column(String(64), default="بضائع عامة غير خطرة")
    pod_recipient_name: Mapped[str] = mapped_column(String(128), default="")
    pod_signature_date: Mapped[str] = mapped_column(String(32), default="")
    pod_notes: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LogisticsVehicle(TenantScoped, Base):
    """Fleet & Vehicle Registry with Maintenance Thresholds (LOG-05)."""
    __tablename__ = "logistics_vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plate_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    vehicle_type: Mapped[str] = mapped_column(String(64))  # شاحنة مبردة 10 طن، تريلا ستارة 40 قدم، بيك أب جامبو
    make_model: Mapped[str] = mapped_column(String(64), default="مرسيدس أكتروس 2024")
    payload_capacity_kg: Mapped[float] = mapped_column(Float, default=10000.0)
    cargo_volume_cbm: Mapped[float] = mapped_column(Float, default=45.0)
    is_refrigerated: Mapped[bool] = mapped_column(Boolean, default=False)
    odometer_km: Mapped[float] = mapped_column(Float, default=50000.0)
    license_expiry: Mapped[str] = mapped_column(String(32))
    insurance_expiry: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="available")  # available, on_trip, maintenance
    last_service_km: Mapped[float] = mapped_column(Float, default=45000.0)
    next_service_km: Mapped[float] = mapped_column(Float, default=55000.0)


class LogisticsDriver(TenantScoped, Base):
    """Driver Rostering, Licensing & Fatigue Prevention (LOG-06)."""
    __tablename__ = "logistics_drivers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(128), index=True)
    phone: Mapped[str] = mapped_column(String(32))
    national_id: Mapped[str] = mapped_column(String(32))
    license_grade: Mapped[str] = mapped_column(String(64))  # رخصة درجة أولى مهنية، نقل مواد خطرة Hazmat
    license_expiry: Mapped[str] = mapped_column(String(32))
    medical_fitness: Mapped[bool] = mapped_column(Boolean, default=True)
    max_daily_hours: Mapped[float] = mapped_column(Float, default=9.0)
    logged_hours_today: Mapped[float] = mapped_column(Float, default=3.5)
    status: Mapped[str] = mapped_column(String(32), default="available")  # available, on_trip, resting


class LogisticsRouteTrip(TenantScoped, Base):
    """Multi-Stop Route Dispatch & Waypoint Manifests (LOG-04)."""
    __tablename__ = "logistics_route_trips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    origin_hub: Mapped[str] = mapped_column(String(64), default="المستودع الرئيسي - القاهرة")
    destination_hub: Mapped[str] = mapped_column(String(64), default="فرع التوزيع - الإسكندرية")
    assigned_vehicle_plate: Mapped[str] = mapped_column(String(32))
    assigned_driver_name: Mapped[str] = mapped_column(String(128))
    total_distance_km: Mapped[float] = mapped_column(Float, default=225.0)
    total_consignments: Mapped[int] = mapped_column(Integer, default=12)
    departure_time: Mapped[str] = mapped_column(String(32))
    arrival_time_est: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled, in_transit, completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LogisticsFuelLog(TenantScoped, Base):
    """Vehicle Operating Costs & CPK Fuel Accounting (LOG-10)."""
    __tablename__ = "logistics_fuel_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_plate: Mapped[str] = mapped_column(String(32), index=True)
    driver_name: Mapped[str] = mapped_column(String(128))
    date: Mapped[str] = mapped_column(String(32), index=True)
    liters_pumped: Mapped[float] = mapped_column(Float)
    cost_total: Mapped[float] = mapped_column(Float)
    odometer_at_fill: Mapped[float] = mapped_column(Float)
    fuel_station: Mapped[str] = mapped_column(String(128), default="محطة وطنية - طريق مصر إسكندرية الصحراوي")
    receipt_number: Mapped[str] = mapped_column(String(64))


class LogisticsCargoClaim(TenantScoped, Base):
    """Cargo Claims & Damage Settlement Workflow (LOG-11)."""
    __tablename__ = "logistics_cargo_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consignment_tracking: Mapped[str] = mapped_column(String(64), index=True)
    claimant_name: Mapped[str] = mapped_column(String(128))
    claim_type: Mapped[str] = mapped_column(String(32), default="damage")  # damage, loss, delay
    claimed_amount: Mapped[float] = mapped_column(Float)
    settled_amount: Mapped[float] = mapped_column(Float, default=0.0)
    incident_description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="submitted")  # submitted, under_investigation, approved, settled, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
