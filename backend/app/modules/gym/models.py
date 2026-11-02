"""Database models for Gym & Fitness Sports Club ERP module (GYM-01..10)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class GymMembership(TenantScoped, Base):
    """Membership Lifecycle Management (GYM-01, GYM-03)."""
    __tablename__ = "gym_memberships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_code: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "GYM-MBR-1092"
    full_name: Mapped[str] = mapped_column(String(128), index=True)
    phone: Mapped[str] = mapped_column(String(32))
    plan_name: Mapped[str] = mapped_column(String(64))  # سنوي VIP، باقة 6 أشهر فضية، شهري حديد ولياقة
    start_date: Mapped[str] = mapped_column(String(32))
    end_date: Mapped[str] = mapped_column(String(32))
    price: Mapped[float] = mapped_column(Float)
    paid_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, frozen, expired
    freeze_days_allowed: Mapped[int] = mapped_column(Integer, default=30)
    freeze_days_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GymAccessLog(TenantScoped, Base):
    """Turnstile & Access Control Log (GYM-02)."""
    __tablename__ = "gym_access_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id: Mapped[str] = mapped_column(String(36), index=True)
    member_name: Mapped[str] = mapped_column(String(128))
    gate_name: Mapped[str] = mapped_column(String(64))  # بوابة الدخول الرئيسية، بوابة المسبح والسبا
    scanned_at: Mapped[str] = mapped_column(String(32))
    access_result: Mapped[str] = mapped_column(String(32))  # granted, denied_expired, denied_frozen
    reason: Mapped[str] = mapped_column(String(128), default="دخول مصرح به")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GymPTPackage(TenantScoped, Base):
    """Personal Training (PT) Packages (GYM-04)."""
    __tablename__ = "gym_pt_packages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id: Mapped[str] = mapped_column(String(36), index=True)
    member_name: Mapped[str] = mapped_column(String(128))
    trainer_name: Mapped[str] = mapped_column(String(128), index=True)
    total_sessions: Mapped[int] = mapped_column(Integer, default=12)
    completed_sessions: Mapped[int] = mapped_column(Integer, default=0)
    price_per_session: Mapped[float] = mapped_column(Float, default=250.0)
    total_price: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, completed, expired
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GymGroupClass(TenantScoped, Base):
    """Group Classes & Timetable Scheduling (GYM-05)."""
    __tablename__ = "gym_group_classes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_name: Mapped[str] = mapped_column(String(128))  # كروس فيت CrossFit, سبيننج Spinning, يوجا Yoga
    coach_name: Mapped[str] = mapped_column(String(128))
    studio_room: Mapped[str] = mapped_column(String(64))  # قاعة 1، استوديو الدراجات
    schedule_time: Mapped[str] = mapped_column(String(64))  # الأحد والثلاثاء 6:00 PM
    max_capacity: Mapped[int] = mapped_column(Integer, default=20)
    booked_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled, ongoing, completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GymBodyAssessment(TenantScoped, Base):
    """InBody Biometric Data & Progress Tracking (GYM-08)."""
    __tablename__ = "gym_body_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id: Mapped[str] = mapped_column(String(36), index=True)
    member_name: Mapped[str] = mapped_column(String(128))
    assessment_date: Mapped[str] = mapped_column(String(32))
    weight_kg: Mapped[float] = mapped_column(Float)
    body_fat_percent: Mapped[float] = mapped_column(Float)
    muscle_mass_kg: Mapped[float] = mapped_column(Float)
    bmi: Mapped[float] = mapped_column(Float)
    coach_notes: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
