"""SQLAlchemy models for Real Estate & Property Management ERP module (RE-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class RecProperty(TenantScoped, Base):
    __tablename__ = "rec_properties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    property_name: Mapped[str] = mapped_column(String(255), nullable=False)
    property_type: Mapped[str] = mapped_column(String(64), default="commercial_mall")  # residential_compound, commercial_mall, office_tower, mixed_use
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    district: Mapped[str] = mapped_column(String(128), nullable=False)
    total_units_count: Mapped[int] = mapped_column(Integer, default=0)
    gross_leasable_area_sqm: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RecUnit(TenantScoped, Base):
    __tablename__ = "rec_units"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("rec_properties.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_number: Mapped[str] = mapped_column(String(64), nullable=False)
    floor: Mapped[str] = mapped_column(String(64), nullable=False)
    unit_type: Mapped[str] = mapped_column(String(64), default="office")  # retail_shop, office, luxury_apartment, penthouse, villa
    area_sqm: Mapped[float] = mapped_column(Float, default=0.0)
    annual_rent_rate_egp: Mapped[float] = mapped_column(Float, default=0.0)
    service_charge_sqm_egp: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="vacant")  # vacant, leased, reserved, under_fitout, maintenance
    current_tenant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

class RecLeaseContract(TenantScoped, Base):
    __tablename__ = "rec_lease_contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id: Mapped[str] = mapped_column(String(36), ForeignKey("rec_units.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    tenant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tenant_national_id: Mapped[str] = mapped_column(String(64), nullable=False)
    tenant_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    start_date: Mapped[str] = mapped_column(String(32), nullable=False)
    end_date: Mapped[str] = mapped_column(String(32), nullable=False)
    annual_rent_egp: Mapped[float] = mapped_column(Float, default=0.0)
    payment_frequency: Mapped[str] = mapped_column(String(32), default="quarterly")  # monthly, quarterly, semi_annual, annual
    security_deposit_egp: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, under_renewal, terminated, expired
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RecPdcCheque(TenantScoped, Base):
    __tablename__ = "rec_pdc_cheques"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id: Mapped[str] = mapped_column(String(36), ForeignKey("rec_lease_contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    cheque_number: Mapped[str] = mapped_column(String(64), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    due_date: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="in_safe")  # in_safe, deposited, cleared, bounced
    collected_at: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

class RecMaintenanceTicket(TenantScoped, Base):
    __tablename__ = "rec_maintenance_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id: Mapped[str] = mapped_column(String(36), ForeignKey("rec_units.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_ref: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="HVAC / Chiller")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reported_by: Mapped[str] = mapped_column(String(255), nullable=False)
    cost_egp: Mapped[float] = mapped_column(Float, default=0.0)
    is_cam_apportioned: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="open")  # open, assigned, in_progress, resolved
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
