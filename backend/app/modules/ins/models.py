"""SQLAlchemy models for Insurance & Reinsurance ERP module (INS-01..14)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class InsPolicy(TenantScoped, Base):
    __tablename__ = "ins_policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_number: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    line_of_business: Mapped[str] = mapped_column(String(64), default="motor_comprehensive")  # motor_comprehensive, health_corporate, property_fire, marine_cargo
    policyholder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sum_insured_egp: Mapped[float] = mapped_column(Float, default=0.0)
    annual_premium_egp: Mapped[float] = mapped_column(Float, default=0.0)
    deductible_egp: Mapped[float] = mapped_column(Float, default=0.0)
    start_date: Mapped[str] = mapped_column(String(32), nullable=False)
    end_date: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, underwriting, expired, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InsClaim(TenantScoped, Base):
    __tablename__ = "ins_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id: Mapped[str] = mapped_column(String(36), ForeignKey("ins_policies.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    claimant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    loss_date: Mapped[str] = mapped_column(String(32), nullable=False)
    reported_date: Mapped[str] = mapped_column(String(32), nullable=False)
    estimated_loss_egp: Mapped[float] = mapped_column(Float, default=0.0)
    approved_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    surveyor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="reported")  # reported, surveying, adjudicated, settled, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InsSurvey(TenantScoped, Base):
    __tablename__ = "ins_surveys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("ins_claims.id", ondelete="CASCADE"), nullable=False, index=True)
    survey_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    surveyor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    inspected_item: Mapped[str] = mapped_column(String(255), nullable=False)
    damage_description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_repair_egp: Mapped[float] = mapped_column(Float, default=0.0)
    subrogation_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    survey_date: Mapped[str] = mapped_column(String(32), nullable=False)

class InsReinsuranceTreaty(TenantScoped, Base):
    __tablename__ = "ins_reinsurance_treaties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    treaty_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    reinsurer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    treaty_type: Mapped[str] = mapped_column(String(64), default="quota_share")  # quota_share, surplus, excess_of_loss
    retention_limit_egp: Mapped[float] = mapped_column(Float, default=0.0)
    cession_percentage: Mapped[float] = mapped_column(Float, default=40.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, expired
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
