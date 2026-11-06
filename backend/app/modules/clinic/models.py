"""Database models for Healthcare & Clinic/Hospital ERP module (HLT-01..12)."""
from __future__ import annotations

import json
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class ClinicPatient(TenantScoped, Base):
    """Electronic Medical Record (EMR) Master Patient Index (HLT-01)."""
    __tablename__ = "clinic_patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_mrn: Mapped[str] = mapped_column(String(32), index=True)  # Medical Record Number (MRN)
    full_name: Mapped[str] = mapped_column(String(128), index=True)
    national_id: Mapped[str] = mapped_column(String(32), index=True)
    phone: Mapped[str] = mapped_column(String(32))
    gender: Mapped[str] = mapped_column(String(16))  # ذكر / أنثى
    date_of_birth: Mapped[str] = mapped_column(String(32))
    blood_group: Mapped[str] = mapped_column(String(8), default="A+")
    allergies: Mapped[str] = mapped_column(String(256), default="لا توجد حساسيات مسجلة")
    chronic_conditions: Mapped[str] = mapped_column(String(256), default="لا توجد أمراض مزمنة")
    insurance_provider: Mapped[str] = mapped_column(String(128), default="نقدي / غير مؤمن")
    insurance_policy_no: Mapped[str] = mapped_column(String(64), default="N/A")
    copay_percent: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClinicAppointment(TenantScoped, Base):
    """Physician Appointment Scheduling & Queuing (HLT-02)."""
    __tablename__ = "clinic_appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_ref: Mapped[str] = mapped_column(String(32), index=True)
    patient_id: Mapped[str] = mapped_column(String(36), index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    doctor_name: Mapped[str] = mapped_column(String(128), index=True)
    department: Mapped[str] = mapped_column(String(64))  # باطنة، أطفال، عظام، جراحة، جلدية
    appointment_date: Mapped[str] = mapped_column(String(32))
    time_slot: Mapped[str] = mapped_column(String(32))  # 10:30 AM
    queue_number: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled, waiting, in_consultation, completed, cancelled
    consultation_fee: Mapped[float] = mapped_column(Float, default=250.0)
    chief_complaint: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClinicEncounter(TenantScoped, Base):
    """Clinical Encounters, Vitals & ICD-10 Diagnoses (HLT-03, HLT-10)."""
    __tablename__ = "clinic_encounters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    encounter_ref: Mapped[str] = mapped_column(String(32), index=True)
    patient_id: Mapped[str] = mapped_column(String(36), index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    doctor_name: Mapped[str] = mapped_column(String(128))
    department: Mapped[str] = mapped_column(String(64))
    encounter_date: Mapped[str] = mapped_column(String(32))
    bp_systolic: Mapped[int] = mapped_column(Integer, default=120)
    bp_diastolic: Mapped[int] = mapped_column(Integer, default=80)
    heart_rate: Mapped[int] = mapped_column(Integer, default=72)
    temperature: Mapped[float] = mapped_column(Float, default=37.0)
    spo2: Mapped[int] = mapped_column(Integer, default=98)
    chief_complaint: Mapped[str] = mapped_column(Text)
    icd10_code: Mapped[str] = mapped_column(String(32), index=True)  # e.g. E11.9, I10, J06.9
    icd10_description: Mapped[str] = mapped_column(String(256))
    clinical_notes: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClinicPrescription(TenantScoped, Base):
    """Electronic Prescriptions (e-Rx) (HLT-04)."""
    __tablename__ = "clinic_prescriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rx_ref: Mapped[str] = mapped_column(String(32), index=True)
    encounter_ref: Mapped[str] = mapped_column(String(32), default="", index=True)
    patient_id: Mapped[str] = mapped_column(String(36), index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    doctor_name: Mapped[str] = mapped_column(String(128))
    issue_date: Mapped[str] = mapped_column(String(32))
    medication_name: Mapped[str] = mapped_column(String(128))
    dosage: Mapped[str] = mapped_column(String(64))  # e.g. 500mg
    frequency: Mapped[str] = mapped_column(String(64))  # 3 مرات يومياً بعد الأكل
    duration_days: Mapped[int] = mapped_column(Integer, default=7)
    instructions: Mapped[str] = mapped_column(String(256), default="")
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, dispensed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClinicLabOrder(TenantScoped, Base):
    """Laboratory & Diagnostic Radiology Orders (HLT-05)."""
    __tablename__ = "clinic_lab_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_ref: Mapped[str] = mapped_column(String(32), index=True)
    patient_id: Mapped[str] = mapped_column(String(36), index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    doctor_name: Mapped[str] = mapped_column(String(128))
    test_name: Mapped[str] = mapped_column(String(128))  # CBC, صورة دم كاملة, أشعة سينية الصدر
    category: Mapped[str] = mapped_column(String(64))  # مختبر / أشعة
    specimen_barcode: Mapped[str] = mapped_column(String(64), index=True)
    reference_range: Mapped[str] = mapped_column(String(128), default="Normal")
    result_value: Mapped[str] = mapped_column(String(128), default="قيد التحليل")
    status: Mapped[str] = mapped_column(String(32), default="ordered")  # ordered, collected, reported
    is_signed_off: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClinicInpatientBed(TenantScoped, Base):
    """Ward & Inpatient Bed Occupancy Management (HLT-07, HLT-08)."""
    __tablename__ = "clinic_inpatient_beds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bed_code: Mapped[str] = mapped_column(String(32), index=True)  # e.g. BED-ICU-01, BED-W-204
    ward_name: Mapped[str] = mapped_column(String(64), index=True)  # العناية المركزة (ICU)، جناح الجراحة، قسم الباطنة
    room_number: Mapped[str] = mapped_column(String(32))
    bed_type: Mapped[str] = mapped_column(String(32))  # عادي، عناية حثيثة، عزل طبي
    daily_rate: Mapped[float] = mapped_column(Float, default=1200.0)
    status: Mapped[str] = mapped_column(String(32), default="available")  # available, occupied, cleaning, maintenance
    current_patient_name: Mapped[str] = mapped_column(String(128), default="")
    admission_date: Mapped[str] = mapped_column(String(32), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClinicInvoice(TenantScoped, Base):
    """Clinic/Hospital billing invoice (consultation, bed, lab, pharmacy charges)."""
    __tablename__ = "clinic_invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_ref: Mapped[str] = mapped_column(String(32), index=True)
    patient_id: Mapped[str] = mapped_column(String(36), index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    appointment_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    encounter_ref: Mapped[str | None] = mapped_column(String(32), nullable=True)
    charges: Mapped[list] = mapped_column(JSONB, default=list)  # [{description, amount}]
    total: Mapped[float] = mapped_column(Float, default=0.0)
    copay_percent: Mapped[float] = mapped_column(Float, default=0.0)
    insurance_amount: Mapped[float] = mapped_column(Float, default=0.0)
    patient_amount: Mapped[float] = mapped_column(Float, default=0.0)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, partial, paid
    payment_method: Mapped[str] = mapped_column(String(32), default="cash")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ClinicInsuranceClaim(TenantScoped, Base):
    """Insurance claim submission & tracking for clinic services."""
    __tablename__ = "clinic_insurance_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_ref: Mapped[str] = mapped_column(String(32), index=True)
    patient_id: Mapped[str] = mapped_column(String(36), index=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    invoice_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    insurance_provider: Mapped[str] = mapped_column(String(128))
    policy_no: Mapped[str] = mapped_column(String(64), default="N/A")
    copay_percent: Mapped[float] = mapped_column(Float, default=0.0)
    claimed_amount: Mapped[float] = mapped_column(Float, default=0.0)
    approved_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="submitted")  # submitted, approved, rejected, paid
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
