"""Database models for Discrete Manufacturing & Assembly module (MFG-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class MfgBom(TenantScoped, Base):
    """Multi-Level Bill of Materials (BOM) & Engineering Revisions (MFG-01)."""
    __tablename__ = "mfg_boms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bom_code: Mapped[str] = mapped_column(String(64), index=True)
    item_name: Mapped[str] = mapped_column(String(128))
    revision: Mapped[str] = mapped_column(String(32), default="Rev-A")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    base_qty: Mapped[float] = mapped_column(Float, default=1.0)
    uom: Mapped[str] = mapped_column(String(32), default="PCS")
    total_standard_cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MfgBomItem(TenantScoped, Base):
    """Indented Components & Raw Materials Tree (MFG-01)."""
    __tablename__ = "mfg_bom_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bom_id: Mapped[str] = mapped_column(String(36), index=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    component_code: Mapped[str] = mapped_column(String(64))
    component_name: Mapped[str] = mapped_column(String(128))
    quantity_required: Mapped[float] = mapped_column(Float, default=1.0)
    uom: Mapped[str] = mapped_column(String(32), default="PCS")
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    scrap_factor_percent: Mapped[float] = mapped_column(Float, default=0.0)


class MfgWorkCenter(TenantScoped, Base):
    """Work Centers & Machine Stations (MFG-02)."""
    __tablename__ = "mfg_work_centers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    center_code: Mapped[str] = mapped_column(String(64), index=True)
    center_name: Mapped[str] = mapped_column(String(128))
    department: Mapped[str] = mapped_column(String(64), default="Machining")
    hourly_machine_rate: Mapped[float] = mapped_column(Float, default=0.0)
    hourly_labor_rate: Mapped[float] = mapped_column(Float, default=0.0)
    capacity_hours_per_day: Mapped[float] = mapped_column(Float, default=8.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, maintenance, idle


class MfgRoutingOperation(TenantScoped, Base):
    """Sequential Manufacturing Steps & Routing (MFG-02)."""
    __tablename__ = "mfg_routing_operations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bom_id: Mapped[str] = mapped_column(String(36), index=True)
    work_center_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    sequence_num: Mapped[int] = mapped_column(Integer, default=10)
    operation_name: Mapped[str] = mapped_column(String(128))
    setup_time_mins: Mapped[float] = mapped_column(Float, default=15.0)
    run_time_per_unit_mins: Mapped[float] = mapped_column(Float, default=5.0)


class MfgProductionOrder(TenantScoped, Base):
    """Production Orders & Shop Floor Work-in-Progress (MFG-04, MFG-06)."""
    __tablename__ = "mfg_production_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_ref: Mapped[str] = mapped_column(String(64), index=True)
    bom_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    finished_good_name: Mapped[str] = mapped_column(String(128))
    planned_qty: Mapped[float] = mapped_column(Float, default=100.0)
    completed_qty: Mapped[float] = mapped_column(Float, default=0.0)
    scrap_qty: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="planned")  # planned, released, in_progress, completed, closed
    scheduled_start: Mapped[str | None] = mapped_column(String(32), nullable=True)
    scheduled_end: Mapped[str | None] = mapped_column(String(32), nullable=True)
    actual_wip_cost: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MfgQualityInspection(TenantScoped, Base):
    """Quality Control Inspections & Non-Conformance Reports (MFG-09)."""
    __tablename__ = "mfg_quality_inspections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_ref: Mapped[str] = mapped_column(String(64), index=True)
    order_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    stage: Mapped[str] = mapped_column(String(32), default="in_process")  # incoming, in_process, final
    sample_size: Mapped[int] = mapped_column(Integer, default=10)
    defect_count: Mapped[int] = mapped_column(Integer, default=0)
    outcome: Mapped[str] = mapped_column(String(32), default="passed")  # passed, quarantined, rejected
    inspector_name: Mapped[str] = mapped_column(String(128))
    ncr_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MfgOeeLog(TenantScoped, Base):
    """Overall Equipment Effectiveness (OEE) Metrics (MFG-12)."""
    __tablename__ = "mfg_oee_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_center_id: Mapped[str] = mapped_column(String(36), index=True)
    log_date: Mapped[str] = mapped_column(String(32))
    planned_production_time_hrs: Mapped[float] = mapped_column(Float, default=8.0)
    operating_time_hrs: Mapped[float] = mapped_column(Float, default=7.2)
    ideal_cycle_time_mins: Mapped[float] = mapped_column(Float, default=2.0)
    total_pieces: Mapped[int] = mapped_column(Integer, default=200)
    good_pieces: Mapped[int] = mapped_column(Integer, default=192)
    availability_pct: Mapped[float] = mapped_column(Float, default=90.0)
    performance_pct: Mapped[float] = mapped_column(Float, default=92.5)
    quality_pct: Mapped[float] = mapped_column(Float, default=96.0)
    oee_score_pct: Mapped[float] = mapped_column(Float, default=80.0)
