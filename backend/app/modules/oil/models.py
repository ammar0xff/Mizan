"""SQLAlchemy models for Oil & Gas Extraction ERP module (OIL-01..14)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class OilWellHead(TenantScoped, Base):
    __tablename__ = "oil_wells"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    well_tag: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    well_name: Mapped[str] = mapped_column(String(255), nullable=False)
    concession_name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform_or_pad: Mapped[str] = mapped_column(String(128), nullable=False)
    well_type: Mapped[str] = mapped_column(String(64), default="oil_producer")  # oil_producer, gas_condensate, water_injection, gas_lift
    reservoir_formation: Mapped[str] = mapped_column(String(128), default="Kareem Sandstone")
    status: Mapped[str] = mapped_column(String(32), default="producing")  # producing, shut_in, drilling, workover
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class OilDailyProduction(TenantScoped, Base):
    __tablename__ = "oil_daily_productions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    well_id: Mapped[str] = mapped_column(String(36), ForeignKey("oil_wells.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date: Mapped[str] = mapped_column(String(32), nullable=False)
    gross_liquid_bbl: Mapped[float] = mapped_column(Float, default=0.0)
    net_oil_bbl: Mapped[float] = mapped_column(Float, default=0.0)
    gas_rate_mmscfd: Mapped[float] = mapped_column(Float, default=0.0)
    water_cut_pct: Mapped[float] = mapped_column(Float, default=0.0)
    tubing_pressure_psi: Mapped[float] = mapped_column(Float, default=1200.0)
    choke_size_64th: Mapped[float] = mapped_column(Float, default=32.0)

class OilDrillingReport(TenantScoped, Base):
    __tablename__ = "oil_drilling_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ddr_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    rig_name: Mapped[str] = mapped_column(String(255), nullable=False)
    concession: Mapped[str] = mapped_column(String(255), nullable=False)
    report_date: Mapped[str] = mapped_column(String(32), nullable=False)
    current_depth_ft: Mapped[float] = mapped_column(Float, default=0.0)
    footage_last_24h_ft: Mapped[float] = mapped_column(Float, default=0.0)
    mud_weight_ppg: Mapped[float] = mapped_column(Float, default=9.8)
    daily_rig_cost_egp: Mapped[float] = mapped_column(Float, default=0.0)
    operations_summary: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="drilling")  # drilling, casing, tripping, testing

class OilTankFarm(TenantScoped, Base):
    __tablename__ = "oil_tank_farms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tank_tag: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    terminal_location: Mapped[str] = mapped_column(String(255), nullable=False)
    product_type: Mapped[str] = mapped_column(String(64), default="crude_oil_heavy")  # crude_oil_heavy, crude_oil_light, marine_diesel, jet_a1
    gross_observed_volume_bbl: Mapped[float] = mapped_column(Float, default=0.0)
    api_gravity: Mapped[float] = mapped_column(Float, default=32.5)
    temperature_f: Mapped[float] = mapped_column(Float, default=85.0)
    net_standard_volume_bbl: Mapped[float] = mapped_column(Float, default=0.0)
    safe_fill_capacity_bbl: Mapped[float] = mapped_column(Float, default=250000.0)
    status: Mapped[str] = mapped_column(String(32), default="in_service")  # in_service, filling, discharging, settling

class OilJvCashCall(TenantScoped, Base):
    __tablename__ = "oil_jv_cash_calls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cash_call_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    concession: Mapped[str] = mapped_column(String(255), nullable=False)
    partner_company: Mapped[str] = mapped_column(String(255), nullable=False)
    working_interest_pct: Mapped[float] = mapped_column(Float, default=50.0)
    billing_period: Mapped[str] = mapped_column(String(32), nullable=False)
    operating_expenditure_egp: Mapped[float] = mapped_column(Float, default=0.0)
    capital_expenditure_egp: Mapped[float] = mapped_column(Float, default=0.0)
    total_due_egp: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="approved")  # issued, approved, funded, reconciled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
