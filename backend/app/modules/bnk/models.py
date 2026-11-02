"""SQLAlchemy models for Banking & Financial Institutions ERP module (BNK-01..14)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class BnkAccountMaster(TenantScoped, Base):
    __tablename__ = "bnk_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cif_number: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    account_number: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[str] = mapped_column(String(64), default="current")  # current, savings, corporate_checking, time_deposit
    currency: Mapped[str] = mapped_column(String(8), default="EGP")
    ledger_balance_egp: Mapped[float] = mapped_column(Float, default=0.0)
    available_balance_egp: Mapped[float] = mapped_column(Float, default=0.0)
    hold_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    interest_rate_pct: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, dormant, frozen, closed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class BnkTransaction(TenantScoped, Base):
    __tablename__ = "bnk_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("bnk_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    txn_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    direction: Mapped[str] = mapped_column(String(16), default="credit")  # debit, credit
    channel: Mapped[str] = mapped_column(String(64), default="core_branch")  # core_branch, ipn_instant, ach_clearing, swift_wire, atm
    description: Mapped[str] = mapped_column(Text, nullable=False)
    balance_after_egp: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[str] = mapped_column(String(32), nullable=False)

class BnkLoanApplication(TenantScoped, Base):
    __tablename__ = "bnk_loan_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    applicant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    applicant_national_id: Mapped[str] = mapped_column(String(64), nullable=False)
    loan_type: Mapped[str] = mapped_column(String(64), default="sme_working_capital")  # sme_working_capital, retail_personal, mortgage, microfinance
    principal_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    interest_rate_pct: Mapped[float] = mapped_column(Float, default=18.5)
    tenor_months: Mapped[int] = mapped_column(Integer, default=24)
    monthly_installment_egp: Mapped[float] = mapped_column(Float, default=0.0)
    i_score_rating: Mapped[int] = mapped_column(Integer, default=720)
    ecl_stage: Mapped[str] = mapped_column(String(32), default="stage_1_performing")  # stage_1_performing, stage_2_underperforming, stage_3_impaired
    status: Mapped[str] = mapped_column(String(32), default="approved")  # applied, underwriting, approved, disbursed, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class BnkComplianceAlert(TenantScoped, Base):
    __tablename__ = "bnk_compliance_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("bnk_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(32), default="high")  # low, medium, high, critical
    sar_filed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="open")  # open, under_investigation, cleared, reported_to_fiu
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
