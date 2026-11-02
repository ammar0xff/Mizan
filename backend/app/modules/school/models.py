"""Database models for School & Education module."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class SchoolStudent(TenantScoped, Base):
    __tablename__ = "school_students"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    grade: Mapped[str] = mapped_column(String(64))
    parent_phone: Mapped[str] = mapped_column(String(32))
    guardian_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    has_sibling_discount: Mapped[bool] = mapped_column(Boolean, default=False)
    total_tuition: Mapped[float] = mapped_column(Float, default=0.0)
    paid_tuition: Mapped[float] = mapped_column(Float, default=0.0)
    balance_due: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, settled, overdue
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SchoolPayment(TenantScoped, Base):
    __tablename__ = "school_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("school_students.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    receipt_no: Mapped[str] = mapped_column(String(32), index=True)
    term: Mapped[str] = mapped_column(String(64), default="القسط الأول")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SchoolAcademicTerm(TenantScoped, Base):
    """Academic Term / Year (EDU-03)."""
    __tablename__ = "school_academic_terms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(128), index=True)
    academic_year: Mapped[str] = mapped_column(String(32), default="2024-2025")
    start_date: Mapped[str] = mapped_column(String(32))
    end_date: Mapped[str] = mapped_column(String(32))
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)


class SchoolAttendance(TenantScoped, Base):
    """Student Daily & Period Attendance Tracking (EDU-05)."""
    __tablename__ = "school_attendance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String(36), index=True)
    student_name: Mapped[str] = mapped_column(String(128))
    grade: Mapped[str] = mapped_column(String(64), index=True)
    date: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), default="present")  # present, absent, late, excused
    notes: Mapped[str | None] = mapped_column(String(256), nullable=True)
    recorded_by: Mapped[str] = mapped_column(String(64), default="مشرف الحضور")


class SchoolGradeRecord(TenantScoped, Base):
    """Exam & Continuous Assessment Gradebook (EDU-06)."""
    __tablename__ = "school_grade_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String(36), index=True)
    student_name: Mapped[str] = mapped_column(String(128))
    grade: Mapped[str] = mapped_column(String(64))
    term: Mapped[str] = mapped_column(String(64), default="الفصل الدراسي الأول")
    subject: Mapped[str] = mapped_column(String(64))  # رياضيات, علوم, لغة عربية...
    exam_type: Mapped[str] = mapped_column(String(32), default="midterm")  # midterm, final, coursework
    max_score: Mapped[float] = mapped_column(Float, default=100.0)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    letter_grade: Mapped[str] = mapped_column(String(8), default="A")
    is_passed: Mapped[bool] = mapped_column(Boolean, default=True)
    remarks: Mapped[str | None] = mapped_column(String(256), nullable=True)
