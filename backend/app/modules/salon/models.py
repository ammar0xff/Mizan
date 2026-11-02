"""Database models for Salon, Spa & Personal Care module (SAL-01..10)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class SalonService(TenantScoped, Base):
    """Service Catalog & Duration Matrix (SAL-01)."""
    __tablename__ = "salon_services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_name: Mapped[str] = mapped_column(String(128), index=True)
    category: Mapped[str] = mapped_column(String(64))  # شعر وتصفيف، صبغة ومعالجة، بشرة وأظافر، سبا ومساج
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)
    buffer_turnaround_minutes: Mapped[int] = mapped_column(Integer, default=15)
    base_price: Mapped[float] = mapped_column(Float)
    consumable_cost: Mapped[float] = mapped_column(Float, default=50.0)  # تكلفة المواد المستهلكة
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SalonAppointment(TenantScoped, Base):
    """Visual Stylist Appointment Calendar (SAL-02, SAL-08)."""
    __tablename__ = "salon_appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_ref: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "SAL-APT-2026"
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    client_phone: Mapped[str] = mapped_column(String(32))
    stylist_name: Mapped[str] = mapped_column(String(128), index=True)
    service_name: Mapped[str] = mapped_column(String(128))
    station_or_room: Mapped[str] = mapped_column(String(64))  # كرسي 2 تصفيف، غرفة الساونا والجاكوزي، كابينة الفيشال
    appointment_date: Mapped[str] = mapped_column(String(32))
    time_slot: Mapped[str] = mapped_column(String(32))  # 02:30 PM
    price: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled, in_service, completed, cancelled
    payment_status: Mapped[str] = mapped_column(String(32), default="unpaid")  # paid, unpaid
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SalonStylist(TenantScoped, Base):
    """Stylist Commission Engine & Performance (SAL-04)."""
    __tablename__ = "salon_stylists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stylist_name: Mapped[str] = mapped_column(String(128), index=True)
    specialty: Mapped[str] = mapped_column(String(64))  # خبير صبغات ومعالجات، مصفف شعر محترف، أخصائية عناية بالبشرة
    phone: Mapped[str] = mapped_column(String(32))
    commission_service_percent: Mapped[float] = mapped_column(Float, default=25.0)  # % من خدمات التصفيف
    commission_retail_percent: Mapped[float] = mapped_column(Float, default=10.0)   # % من بيع منتجات العناية
    total_services_count: Mapped[int] = mapped_column(Integer, default=0)
    gross_revenue_generated: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SalonBeautyFormula(TenantScoped, Base):
    """Client Beauty Treatment History & Hair Formulas (SAL-05)."""
    __tablename__ = "salon_beauty_formulas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    client_phone: Mapped[str] = mapped_column(String(32))
    stylist_name: Mapped[str] = mapped_column(String(128))
    formula_date: Mapped[str] = mapped_column(String(32))
    service_type: Mapped[str] = mapped_column(String(64))  # صبغة شعر، معالجة فيلر وبروتين، تنظيف بشرة هايدرافيشال
    formula_details: Mapped[str] = mapped_column(Text)  # e.g. L'Oreal Inoa 6.1 (30g) + 7.1 (20g) + 20 Vol (50g)
    sensitivity_notes: Mapped[str] = mapped_column(String(256), default="تم اختبار الحساسية 48 ساعة بنجاح دون أي تحسس")
    stylist_notes: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
