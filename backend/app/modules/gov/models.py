"""SQLAlchemy models for Government & Nonprofit ERP module (GOV-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class GovFund(TenantScoped, Base):
    __tablename__ = "gov_funds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fund_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    fund_name: Mapped[str] = mapped_column(String(255), nullable=False)
    fund_type: Mapped[str] = mapped_column(String(64), default="temporarily_restricted")  # unrestricted, temporarily_restricted, permanent_endowment
    donor_organization: Mapped[str] = mapped_column(String(255), nullable=False)
    allocated_budget_egp: Mapped[float] = mapped_column(Float, default=0.0)
    spent_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    remaining_budget_egp: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class GovBudgetCommitment(TenantScoped, Base):
    __tablename__ = "gov_budget_commitments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fund_id: Mapped[str] = mapped_column(String(36), ForeignKey("gov_funds.id", ondelete="CASCADE"), nullable=False, index=True)
    commitment_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    department: Mapped[str] = mapped_column(String(128), nullable=False)
    line_item: Mapped[str] = mapped_column(String(255), nullable=False)
    requisition_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    encumbered_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="encumbered")  # pre_encumbered, encumbered, liquidated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class GovBeneficiaryAid(TenantScoped, Base):
    __tablename__ = "gov_beneficiary_aids"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    beneficiary_national_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vulnerability_score: Mapped[int] = mapped_column(Integer, default=75)
    aid_type: Mapped[str] = mapped_column(String(64), default="cash_transfer")  # cash_transfer, food_carton, medical_voucher, housing_rehab
    aid_value_egp: Mapped[float] = mapped_column(Float, default=0.0)
    family_members_count: Mapped[int] = mapped_column(Integer, default=1)
    distribution_date: Mapped[str] = mapped_column(String(32), nullable=False)
    biometric_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(32), default="delivered")  # delivered, pending, flagged

class GovPublicTender(TenantScoped, Base):
    __tablename__ = "gov_public_tenders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tender_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    procuring_entity: Mapped[str] = mapped_column(String(255), nullable=False)
    estimated_budget_egp: Mapped[float] = mapped_column(Float, default=0.0)
    bid_bond_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    closing_date: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="published")  # published, technical_evaluation, commercial_evaluation, awarded, closed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
