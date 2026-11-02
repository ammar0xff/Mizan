"""SQLAlchemy models for Energy & Power Generation Plant ERP module (ENG-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class EngPowerAsset(TenantScoped, Base):
    __tablename__ = "eng_power_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_tag: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    asset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    plant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_type: Mapped[str] = mapped_column(String(64), default="solar_pv_inverter")  # solar_pv_inverter, gas_turbine, stepup_transformer, grid_substation
    rated_capacity_mw: Mapped[float] = mapped_column(Float, default=0.0)
    installation_date: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="online")  # online, standby, tripped, maintenance
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EngTelemetryLog(TenantScoped, Base):
    __tablename__ = "eng_telemetry_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("eng_power_assets.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[str] = mapped_column(String(32), nullable=False)
    active_power_mw: Mapped[float] = mapped_column(Float, default=0.0)
    grid_frequency_hz: Mapped[float] = mapped_column(Float, default=50.0)
    ambient_temperature_c: Mapped[float] = mapped_column(Float, default=25.0)
    internal_temperature_c: Mapped[float] = mapped_column(Float, default=45.0)
    efficiency_ratio_pct: Mapped[float] = mapped_column(Float, default=98.5)
    curtailment_active: Mapped[bool] = mapped_column(Boolean, default=False)

class EngPermitToWork(TenantScoped, Base):
    __tablename__ = "eng_permits_to_work"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("eng_power_assets.id", ondelete="CASCADE"), nullable=False, index=True)
    ptw_number: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    work_type: Mapped[str] = mapped_column(String(64), default="high_voltage_isolation")  # high_voltage_isolation, hot_work, confined_space, inverter_annual_overhaul
    description: Mapped[str] = mapped_column(Text, nullable=False)
    lead_technician: Mapped[str] = mapped_column(String(255), nullable=False)
    safety_officer: Mapped[str] = mapped_column(String(255), nullable=False)
    loto_confirmed: Mapped[bool] = mapped_column(Boolean, default=True)  # Lockout / Tagout
    valid_from: Mapped[str] = mapped_column(String(32), nullable=False)
    valid_to: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, completed, cancelled, expired

class EngPpaBilling(TenantScoped, Base):
    __tablename__ = "eng_ppa_billings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    billing_period: Mapped[str] = mapped_column(String(32), nullable=False)
    offtaker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    delivered_mwh: Mapped[float] = mapped_column(Float, default=0.0)
    peak_tariff_egp_per_mwh: Mapped[float] = mapped_column(Float, default=1450.0)
    off_peak_tariff_egp_per_mwh: Mapped[float] = mapped_column(Float, default=980.0)
    total_billed_egp: Mapped[float] = mapped_column(Float, default=0.0)
    curtailment_compensation_egp: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="approved")  # draft, submitted, approved, settled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EngHseIncident(TenantScoped, Base):
    __tablename__ = "eng_hse_incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    incident_type: Mapped[str] = mapped_column(String(64), default="near_miss")  # near_miss, first_aid, lost_time_injury, environmental_spill, cems_emission_alert
    severity: Mapped[str] = mapped_column(String(32), default="low")  # low, medium, high, critical
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    corrective_action: Mapped[str] = mapped_column(Text, nullable=False)
    reported_by: Mapped[str] = mapped_column(String(255), nullable=False)
    incident_date: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="closed")  # open, under_investigation, closed
