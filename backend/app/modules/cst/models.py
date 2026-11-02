"""SQLAlchemy models for Construction & Contracting ERP module (CST-01..15)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class CstProject(TenantScoped, Base):
    __tablename__ = "cst_projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    consultant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contract_value_egp: Mapped[float] = mapped_column(Float, default=0.0)
    start_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    expected_completion_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    retention_rate_pct: Mapped[float] = mapped_column(Float, default=5.0)
    advance_payment_pct: Mapped[float] = mapped_column(Float, default=10.0)
    status: Mapped[str] = mapped_column(String(32), default="in_progress")  # planning, in_progress, snagging, completed, handed_over
    total_billed_egp: Mapped[float] = mapped_column(Float, default=0.0)
    total_collected_egp: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CstBoqItem(TenantScoped, Base):
    __tablename__ = "cst_boq_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("cst_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    item_code: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="m3")
    planned_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    unit_rate_egp: Mapped[float] = mapped_column(Float, default=0.0)
    total_budget_egp: Mapped[float] = mapped_column(Float, default=0.0)
    actual_executed_qty: Mapped[float] = mapped_column(Float, default=0.0)

class CstIpcCertificate(TenantScoped, Base):
    __tablename__ = "cst_ipc_certificates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("cst_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    ipc_number: Mapped[str] = mapped_column(String(64), nullable=False)
    period_start: Mapped[str] = mapped_column(String(32), nullable=False)
    period_end: Mapped[str] = mapped_column(String(32), nullable=False)
    gross_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    retention_deduction_egp: Mapped[float] = mapped_column(Float, default=0.0)
    advance_recovery_egp: Mapped[float] = mapped_column(Float, default=0.0)
    net_payable_egp: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="certified")  # draft, submitted_to_consultant, certified, invoiced, paid
    consultant_approval_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    consultant_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CstChangeOrder(TenantScoped, Base):
    __tablename__ = "cst_change_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("cst_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    variation_ref: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    scope_description: Mapped[str] = mapped_column(Text, nullable=False)
    requested_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    approved_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    time_extension_days: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="approved")  # proposed, under_review, approved, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CstHeavyMachineryLog(TenantScoped, Base):
    __tablename__ = "cst_heavy_machinery_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("cst_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    equipment_tag: Mapped[str] = mapped_column(String(64), nullable=False)
    equipment_name: Mapped[str] = mapped_column(String(255), nullable=False)
    operator_name: Mapped[str] = mapped_column(String(255), nullable=False)
    operating_hours: Mapped[float] = mapped_column(Float, default=0.0)
    idle_hours: Mapped[float] = mapped_column(Float, default=0.0)
    diesel_liters: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="operational")  # operational, standby, maintenance
    log_date: Mapped[str] = mapped_column(String(32), nullable=False)

class CstLetterOfGuarantee(TenantScoped, Base):
    __tablename__ = "cst_letters_of_guarantee"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("cst_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    lg_number: Mapped[str] = mapped_column(String(64), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bond_type: Mapped[str] = mapped_column(String(32), default="performance_bond")  # bid_bond, performance_bond, advance_payment, retention
    amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    cash_margin_pct: Mapped[float] = mapped_column(Float, default=15.0)
    issue_date: Mapped[str] = mapped_column(String(32), nullable=False)
    expiry_date: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, extended, released, liquidated
