"""Database models for Pharmacy & Medication Management module."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.tenancy import TenantScoped
from app.db.base import Base


class PharmacyDrug(TenantScoped, Base):
    __tablename__ = "pharmacy_drugs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    trade_name: Mapped[str] = mapped_column(String(128), index=True)
    scientific_name: Mapped[str] = mapped_column(String(128), index=True)
    dosage_form: Mapped[str] = mapped_column(String(64), default="أقراص")
    strength: Mapped[str] = mapped_column(String(64), default="")
    barcode: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    is_controlled: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    batches = relationship("PharmacyBatch", back_populates="drug", cascade="all, delete-orphan")


class PharmacyBatch(TenantScoped, Base):
    __tablename__ = "pharmacy_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    drug_id: Mapped[str] = mapped_column(String(36), ForeignKey("pharmacy_drugs.id"), index=True)
    batch_number: Mapped[str] = mapped_column(String(64), index=True)
    expiry_date: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0)
    purchase_cost: Mapped[float] = mapped_column(Float, default=0.0)
    supplier_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, warning, expired, quarantined
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    drug = relationship("PharmacyDrug", back_populates="batches")


class PharmacyPrescription(TenantScoped, Base):
    __tablename__ = "pharmacy_prescriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rx_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    patient_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    doctor_name: Mapped[str] = mapped_column(String(128))
    doctor_license: Mapped[str | None] = mapped_column(String(64), nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(String(256), nullable=True)
    insurance_company: Mapped[str | None] = mapped_column(String(128), nullable=True)
    copay_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    patient_paid: Mapped[float] = mapped_column(Float, default=0.0)
    insurance_covered: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="dispensed")  # dispensed, pending, cancelled
    dispensed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PharmacyControlledLog(TenantScoped, Base):
    __tablename__ = "pharmacy_controlled_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    drug_id: Mapped[str] = mapped_column(String(36), ForeignKey("pharmacy_drugs.id"), index=True)
    batch_number: Mapped[str] = mapped_column(String(64))
    patient_name: Mapped[str] = mapped_column(String(128))
    patient_national_id: Mapped[str] = mapped_column(String(32))
    prescriber_doctor: Mapped[str] = mapped_column(String(128))
    doctor_license: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    transaction_type: Mapped[str] = mapped_column(String(32), default="dispense")  # dispense, receive, discard
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
