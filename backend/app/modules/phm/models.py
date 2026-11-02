"""Database models for Pharmaceutical & Chemical GMP Manufacturing module (PHM-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class PhmMasterFormula(TenantScoped, Base):
    """Master Formulation & Product Specifications (PHM-01)."""
    __tablename__ = "phm_master_formulas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_code: Mapped[str] = mapped_column(String(64), index=True)
    generic_name: Mapped[str] = mapped_column(String(128))
    brand_name: Mapped[str] = mapped_column(String(128))
    dosage_form: Mapped[str] = mapped_column(String(64), default="Tablets")  # Tablets, Capsules, Syrup, Vials, Ointment
    strength: Mapped[str] = mapped_column(String(64), default="500 mg")
    master_batch_size: Mapped[float] = mapped_column(Float, default=100000.0)
    batch_unit: Mapped[str] = mapped_column(String(32), default="Tabs")
    shelf_life_months: Mapped[int] = mapped_column(Integer, default=36)
    registration_no: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PhmElectronicBatchRecord(TenantScoped, Base):
    """Electronic Batch Manufacturing Records (EBR) & Dual Witness Sign-offs (PHM-02, PHM-11)."""
    __tablename__ = "phm_electronic_batch_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ebr_number: Mapped[str] = mapped_column(String(64), index=True)
    formula_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    batch_lot: Mapped[str] = mapped_column(String(64), index=True)
    planned_yield: Mapped[float] = mapped_column(Float, default=100000.0)
    actual_yield: Mapped[float] = mapped_column(Float, default=0.0)
    current_step: Mapped[str] = mapped_column(String(64), default="dispensing")  # dispensing, granulation, compression, coating, packaging, qa_review, qp_released
    status: Mapped[str] = mapped_column(String(32), default="in_process")  # in_process, qa_hold, qp_released, rejected
    primary_operator: Mapped[str] = mapped_column(String(128))
    witness_signoff_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    witness_timestamp: Mapped[str | None] = mapped_column(String(64), nullable=True)
    manufacturing_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PhmQpRelease(TenantScoped, Base):
    """Qualified Person (QP) Formal Batch Disposition Certificate (PHM-03)."""
    __tablename__ = "phm_qp_releases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    release_cert_ref: Mapped[str] = mapped_column(String(64), index=True)
    ebr_id: Mapped[str] = mapped_column(String(36), index=True)
    qp_name: Mapped[str] = mapped_column(String(128))
    qp_license_no: Mapped[str] = mapped_column(String(64))
    release_status: Mapped[str] = mapped_column(String(32), default="approved")  # approved, conditional, rejected
    disposition_reason: Mapped[str] = mapped_column(String(256), default="All critical quality attributes conform to pharmacopeial specifications.")
    digital_signature_hash: Mapped[str] = mapped_column(String(128))
    signed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PhmDeviationCapa(TenantScoped, Base):
    """Production Deviations & Corrective/Preventive Actions (CAPA) (PHM-05, PHM-06)."""
    __tablename__ = "phm_deviations_capa"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    deviation_ref: Mapped[str] = mapped_column(String(64), index=True)
    ebr_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    deviation_type: Mapped[str] = mapped_column(String(32), default="minor")  # critical, major, minor
    root_cause_category: Mapped[str] = mapped_column(String(64), default="Equipment")  # Equipment, Operator, Environmental, Material
    root_cause_details: Mapped[str] = mapped_column(Text)
    capa_action_plan: Mapped[str] = mapped_column(Text)
    assigned_qa_lead: Mapped[str] = mapped_column(String(128))
    target_completion_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="under_investigation")  # under_investigation, capa_pending, closed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PhmCleanInPlaceLog(TenantScoped, Base):
    """Clean-in-Place (CIP), Vessel Cleaning & Line Clearance (PHM-08, PHM-09)."""
    __tablename__ = "phm_cip_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vessel_name: Mapped[str] = mapped_column(String(128))
    previous_product: Mapped[str] = mapped_column(String(128))
    next_product: Mapped[str] = mapped_column(String(128))
    cleaning_agent: Mapped[str] = mapped_column(String(128), default="NaOH 2% + WFI Rinse")
    rinse_conductivity_us: Mapped[float] = mapped_column(Float, default=1.1)
    swab_test_result: Mapped[str] = mapped_column(String(64), default="Negative (< 10 ppm)")
    line_clearance_signoff_by: Mapped[str] = mapped_column(String(128))
    cleaned_at: Mapped[str] = mapped_column(String(64))


class PhmStabilityStudy(TenantScoped, Base):
    """Zone IVb Stability Testing & Degradation Curves (PHM-10)."""
    __tablename__ = "phm_stability_studies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_ref: Mapped[str] = mapped_column(String(64), index=True)
    product_code: Mapped[str] = mapped_column(String(64))
    storage_condition: Mapped[str] = mapped_column(String(64), default="Zone IVb (30°C / 75% RH)")
    timepoint_months: Mapped[int] = mapped_column(Integer, default=6)
    assay_pct: Mapped[float] = mapped_column(Float, default=99.4)
    degradation_products_pct: Mapped[float] = mapped_column(Float, default=0.2)
    status: Mapped[str] = mapped_column(String(32), default="conforms")  # conforms, under_testing, out_of_spec
    tested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
