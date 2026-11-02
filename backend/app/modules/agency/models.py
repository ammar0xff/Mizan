"""Database models for Creative, Media & Translation Agency module (AGE-01..10)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class AgencyProject(TenantScoped, Base):
    """Creative Brief & Milestone Deliverables (AGE-01, AGE-02)."""
    __tablename__ = "agency_projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_code: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "PRJ-MKT-2026"
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    project_title: Mapped[str] = mapped_column(String(256))
    service_category: Mapped[str] = mapped_column(String(64))  # هوية بصرية، حملة إعلانية، فيديو وموشن، ترجمة قانونية
    contract_value: Mapped[float] = mapped_column(Float)
    deadline: Mapped[str] = mapped_column(String(32))
    total_milestones: Mapped[int] = mapped_column(Integer, default=4)
    completed_milestones: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="in_production")  # in_production, client_review, delivered, closed
    brief_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AgencyCapacityMember(TenantScoped, Base):
    """Resource Capacity & Workload Heatmap Board (AGE-04)."""
    __tablename__ = "agency_capacity_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_name: Mapped[str] = mapped_column(String(128), index=True)
    role_title: Mapped[str] = mapped_column(String(128))  # مدير فني Senior Art Director، مصمم موشن، كاتب محتوى إبداعي
    weekly_capacity_hours: Mapped[float] = mapped_column(Float, default=40.0)
    booked_hours: Mapped[float] = mapped_column(Float, default=32.0)
    utilization_percent: Mapped[float] = mapped_column(Float, default=80.0)
    status: Mapped[str] = mapped_column(String(32), default="optimal")  # available, optimal, overloaded
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AgencyRetainer(TenantScoped, Base):
    """Retainer Hours & Scope Creep Tracking (AGE-05)."""
    __tablename__ = "agency_retainers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    retainer_tier: Mapped[str] = mapped_column(String(64))  # باقة إدارة تسويق شهرية 80 ساعة، صيانة إعلامية
    contracted_hours: Mapped[float] = mapped_column(Float, default=80.0)
    burned_hours: Mapped[float] = mapped_column(Float, default=68.5)
    utilization_percent: Mapped[float] = mapped_column(Float, default=85.6)
    scope_creep_alert: Mapped[bool] = mapped_column(Boolean, default=True)  # True when >= 80%
    overage_hourly_rate: Mapped[float] = mapped_column(Float, default=850.0)
    renewal_date: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AgencyTranslationOrder(TenantScoped, Base):
    """Translation Memory & Word Counts Calculation (AGE-06)."""
    __tablename__ = "agency_translation_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_title: Mapped[str] = mapped_column(String(256), index=True)
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    source_language: Mapped[str] = mapped_column(String(32), default="الإنجليزية")
    target_language: Mapped[str] = mapped_column(String(32), default="العربية")
    total_words: Mapped[int] = mapped_column(Integer)
    repeated_words_discount: Mapped[int] = mapped_column(Integer, default=0)
    net_billable_words: Mapped[int] = mapped_column(Integer)
    rate_per_word: Mapped[float] = mapped_column(Float, default=0.65)
    total_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="translating")  # translating, proofreading, certified_stamped
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
