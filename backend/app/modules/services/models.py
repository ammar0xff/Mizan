"""Database models for Consulting & Professional Services module (CON-01..08)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class ConsultingEngagement(TenantScoped, Base):
    """Client Engagement & Retainer Contract (CON-01, CON-04)."""
    __tablename__ = "consulting_engagements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    project_name: Mapped[str] = mapped_column(String(128))
    billing_model: Mapped[str] = mapped_column(String(32), default="retainer")  # retainer, hourly, fixed_milestone
    contract_value: Mapped[float] = mapped_column(Float, default=0.0)
    retainer_balance: Mapped[float] = mapped_column(Float, default=0.0)
    hourly_rate: Mapped[float] = mapped_column(Float, default=800.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, review, completed
    start_date: Mapped[str] = mapped_column(String(32))
    due_date: Mapped[str] = mapped_column(String(32))
    partner_in_charge: Mapped[str] = mapped_column(String(64), default="د. حازم القاضي (شريك)")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ConsultingTimesheet(TenantScoped, Base):
    """Timesheet & Billable Hours Tracking (CON-02, CON-03)."""
    __tablename__ = "consulting_timesheets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    engagement_id: Mapped[str] = mapped_column(String(36), index=True)
    engagement_name: Mapped[str] = mapped_column(String(128))
    consultant_name: Mapped[str] = mapped_column(String(64))
    role: Mapped[str] = mapped_column(String(64), default="مستشار أول")
    date: Mapped[str] = mapped_column(String(32), index=True)
    hours: Mapped[float] = mapped_column(Float)
    is_billable: Mapped[bool] = mapped_column(Boolean, default=True)
    rate: Mapped[float] = mapped_column(Float, default=800.0)
    task_description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="approved")  # submitted, approved, billed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ConsultingStatutoryDeadline(TenantScoped, Base):
    """Statutory Deliverable Deadlines & Tax Calendar (CON-07)."""
    __tablename__ = "consulting_statutory_deadlines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    filing_type: Mapped[str] = mapped_column(String(128))  # ضريبة القيمة المضافة، ضريبة الدخل، التأمينات
    due_date: Mapped[str] = mapped_column(String(32), index=True)
    period: Mapped[str] = mapped_column(String(64))  # أكتوبر 2026، الربع الثالث 2026
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, under_review, filed, acknowledged
    assigned_to: Mapped[str] = mapped_column(String(64), default="أ/ شريف ممدوح")
    receipt_reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
