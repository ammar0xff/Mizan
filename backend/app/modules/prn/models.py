"""Database models for Printing & Packaging ERP module (PRN-01..10)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class PrnJobDocket(TenantScoped, Base):
    """Job Ticket / Digital Job Jacket Production (PRN-01)."""
    __tablename__ = "prn_job_dockets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    docket_no: Mapped[str] = mapped_column(String(64), index=True)
    client_name: Mapped[str] = mapped_column(String(128))
    job_title: Mapped[str] = mapped_column(String(128))
    run_quantity: Mapped[int] = mapped_column(Integer, default=5000)
    finished_width_mm: Mapped[float] = mapped_column(Float, default=210.0)
    finished_height_mm: Mapped[float] = mapped_column(Float, default=297.0)
    paper_type: Mapped[str] = mapped_column(String(128), default="كوشيه لامع فاخر (Gloss Art Paper)")
    gsm: Mapped[int] = mapped_column(Integer, default=150)
    colors_front: Mapped[str] = mapped_column(String(64), default="4C (CMYK)")
    colors_back: Mapped[str] = mapped_column(String(64), default="4C (CMYK)")
    lamination: Mapped[str] = mapped_column(String(64), default="سلوفان مط (Matte Thermal)")
    binding: Mapped[str] = mapped_column(String(64), default="تطبيق وتدبيس سرج (Saddle Stitch)")
    status: Mapped[str] = mapped_column(String(32), default="prepress")  # prepress, plate_ctp, on_press, postpress_finishing, packed_ready, delivered
    delivery_deadline: Mapped[str | None] = mapped_column(String(32), nullable=True)
    total_cost_egp: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PrnImpositionPlan(TenantScoped, Base):
    """Sheet Imposition & Layout Optimization (PRN-02)."""
    __tablename__ = "prn_imposition_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    docket_id: Mapped[str] = mapped_column(String(36), index=True)
    sheet_size: Mapped[str] = mapped_column(String(64), default="70 x 100 cm")
    pages_per_sheet: Mapped[int] = mapped_column(Integer, default=8)
    sheet_yield_count: Mapped[int] = mapped_column(Integer, default=8)
    total_sheets_required: Mapped[int] = mapped_column(Integer, default=650)
    make_ready_sheets: Mapped[int] = mapped_column(Integer, default=150)
    expected_spoilage_pct: Mapped[float] = mapped_column(Float, default=3.5)
    layout_type: Mapped[str] = mapped_column(String(64), default="Work & Turn (قلب مسطح)")


class PrnPressMachine(TenantScoped, Base):
    """Offset/Flexo Presses & Machine Hourly Rates (MHR) (PRN-04, PRN-09)."""
    __tablename__ = "prn_press_machines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    machine_code: Mapped[str] = mapped_column(String(64), index=True)
    machine_name: Mapped[str] = mapped_column(String(128))
    machine_type: Mapped[str] = mapped_column(String(64), default="offset_sheetfed")  # offset_sheetfed, flexo, die_cutter, folder_gluer
    hourly_rate_egp: Mapped[float] = mapped_column(Float, default=1250.0)
    max_speed_sph: Mapped[int] = mapped_column(Integer, default=15000)
    current_job_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="printing")  # printing, washup, make_ready, idle, maintenance


class PrnInkFormula(TenantScoped, Base):
    """Ink Formulation & Coverage Estimation (PRN-05)."""
    __tablename__ = "prn_ink_formulas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    docket_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ink_name: Mapped[str] = mapped_column(String(128))
    coverage_pct: Mapped[float] = mapped_column(Float, default=35.0)
    estimated_ink_kg: Mapped[float] = mapped_column(Float, default=4.5)
    actual_ink_kg: Mapped[float] = mapped_column(Float, default=4.2)
    batch_lot: Mapped[str] = mapped_column(String(64), default="INK-LOT-8821")


class PrnFinishingLog(TenantScoped, Base):
    """Post-Press Finishing Operations & Spoilage (PRN-07, PRN-08)."""
    __tablename__ = "prn_finishing_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    docket_id: Mapped[str] = mapped_column(String(36), index=True)
    operation_name: Mapped[str] = mapped_column(String(64))  # folding, die_cutting, lamination, carton_gluing
    operator_name: Mapped[str] = mapped_column(String(128))
    completed_pieces: Mapped[int] = mapped_column(Integer, default=5000)
    defective_pieces: Mapped[int] = mapped_column(Integer, default=42)
    machine_hours_spent: Mapped[float] = mapped_column(Float, default=2.5)
    status: Mapped[str] = mapped_column(String(32), default="completed")  # pending, in_progress, completed
