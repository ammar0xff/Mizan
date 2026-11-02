"""Database models for Law Firm & Legal Practice ERP module (LAW-01..09)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class LawCase(TenantScoped, Base):
    """Case & Matter Management (LAW-01)."""
    __tablename__ = "law_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number: Mapped[str] = mapped_column(String(64), index=True)  # e.g. "894 / 2026 ق استئناف القاهرة"
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    case_title: Mapped[str] = mapped_column(String(256))
    case_type: Mapped[str] = mapped_column(String(64))  # نزاع تجاري، تحكيم دولي، قضايا عمالية، حماية ملكية فكرية
    court_jurisdiction: Mapped[str] = mapped_column(String(128))  # محكمة استئناف القاهرة الاقتصادية
    circuit_number: Mapped[str] = mapped_column(String(64))  # الدائرة 7 تجاري
    opposing_party: Mapped[str] = mapped_column(String(128))
    opposing_counsel: Mapped[str] = mapped_column(String(128))
    assigned_partner: Mapped[str] = mapped_column(String(128))
    filing_date: Mapped[str] = mapped_column(String(32))
    claim_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, in_court, judgment_rendered, closed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LawHearing(TenantScoped, Base):
    """Master Judicial Calendar & Court Hearings (LAW-02)."""
    __tablename__ = "law_hearings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String(36), index=True)
    case_number: Mapped[str] = mapped_column(String(64), index=True)
    hearing_date: Mapped[str] = mapped_column(String(32), index=True)
    court_room: Mapped[str] = mapped_column(String(64))
    hearing_stage: Mapped[str] = mapped_column(String(128))  # تبادل مذكرات، سماع مرافعة ختامية، تقرير الخبراء، حجز للحكم
    required_action: Mapped[str] = mapped_column(String(256))
    outcome_summary: Mapped[str] = mapped_column(Text, default="بانتظار انعقاد الجلسة")
    next_hearing_date: Mapped[str] = mapped_column(String(32), default="")
    appeal_deadline: Mapped[str] = mapped_column(String(32), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LawTimeEntry(TenantScoped, Base):
    """Billable Hours & Time Tracking (LAW-05)."""
    __tablename__ = "law_time_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String(36), index=True)
    case_number: Mapped[str] = mapped_column(String(64))
    lawyer_name: Mapped[str] = mapped_column(String(128), index=True)
    lawyer_role: Mapped[str] = mapped_column(String(64))  # شريك مؤسس، محامي نقض، محامي استئناف
    work_date: Mapped[str] = mapped_column(String(32))
    hours: Mapped[float] = mapped_column(Float, default=1.0)
    hourly_rate: Mapped[float] = mapped_column(Float, default=1200.0)
    total_amount: Mapped[float] = mapped_column(Float)
    activity_type: Mapped[str] = mapped_column(String(64))  # صياغة مذكرات، حضور جلسة محكمة، مفاوضات تسوية
    description: Mapped[str] = mapped_column(Text)
    is_billed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LawTrustTransaction(TenantScoped, Base):
    """Client Trust Account Accounting (IOLTA / أمانات الموكلين) (LAW-06, LAW-07)."""
    __tablename__ = "law_trust_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_number: Mapped[str] = mapped_column(String(64), index=True)  # e.g. "IOLTA-CIB-2026"
    case_id: Mapped[str] = mapped_column(String(36), index=True)
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    transaction_type: Mapped[str] = mapped_column(String(64))  # إيداع أمانة (deposit)، سداد رسوم قضائية (disbursement)، صرف تسوية (settlement)
    amount: Mapped[float] = mapped_column(Float)
    running_balance: Mapped[float] = mapped_column(Float)
    payment_reference: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LawConflictCheck(TenantScoped, Base):
    """Automated Conflict of Interest Checking (LAW-03)."""
    __tablename__ = "law_conflict_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    search_query: Mapped[str] = mapped_column(String(256), index=True)
    searched_by: Mapped[str] = mapped_column(String(128))
    conflict_found: Mapped[bool] = mapped_column(Boolean, default=False)
    flagged_matters: Mapped[str] = mapped_column(String(256), default="لا يوجد تعارض مصالح")
    clearance_status: Mapped[str] = mapped_column(String(32), default="cleared")  # cleared, flagged
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
