"""Database models for Travel & Tourism Agency ERP module (TRV-01..10)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class TravelPackage(TenantScoped, Base):
    """Tour Package & Itinerary Builder (TRV-01)."""
    __tablename__ = "travel_packages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    package_code: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "PKG-IST-2026"
    package_name: Mapped[str] = mapped_column(String(128), index=True)
    destination_country: Mapped[str] = mapped_column(String(64))  # تركيا، إسبانيا، السعودية (عمرة)
    destination_city: Mapped[str] = mapped_column(String(64))  # إسطنبول، مدريد، مكة والمدينة
    duration_days: Mapped[int] = mapped_column(Integer, default=7)
    duration_nights: Mapped[int] = mapped_column(Integer, default=6)
    base_cost: Mapped[float] = mapped_column(Float)
    selling_price: Mapped[float] = mapped_column(Float)
    max_seats: Mapped[int] = mapped_column(Integer, default=25)
    booked_seats: Mapped[int] = mapped_column(Integer, default=0)
    inclusions: Mapped[str] = mapped_column(String(256))  # طيران دولي + فندق 5 نجوم + جولات سياحية + إفطار
    day_by_day_plan: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, sold_out, draft
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TravelBooking(TenantScoped, Base):
    """Travel Bookings & Flight/Hotel Reservations (TRV-02, TRV-03)."""
    __tablename__ = "travel_bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_ref: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "TRV-BK-4091"
    package_id: Mapped[str] = mapped_column(String(36), index=True)
    package_name: Mapped[str] = mapped_column(String(128))
    customer_name: Mapped[str] = mapped_column(String(128), index=True)
    customer_phone: Mapped[str] = mapped_column(String(32))
    num_passengers: Mapped[int] = mapped_column(Integer, default=1)
    departure_date: Mapped[str] = mapped_column(String(32))
    return_date: Mapped[str] = mapped_column(String(32))
    flight_pnr: Mapped[str] = mapped_column(String(32))  # e.g. "MS-TK7892"
    hotel_name: Mapped[str] = mapped_column(String(128))
    total_amount: Mapped[float] = mapped_column(Float)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    payment_status: Mapped[str] = mapped_column(String(32), default="pending")  # paid, partial, pending
    booking_status: Mapped[str] = mapped_column(String(32), default="confirmed")  # confirmed, ticketed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TravelPassenger(TenantScoped, Base):
    """Passenger Manifest & Rooming Lists (TRV-04)."""
    __tablename__ = "travel_passengers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), index=True)
    booking_ref: Mapped[str] = mapped_column(String(32), index=True)
    full_name: Mapped[str] = mapped_column(String(128), index=True)
    passport_number: Mapped[str] = mapped_column(String(32), index=True)
    nationality: Mapped[str] = mapped_column(String(64), default="مصري")
    date_of_birth: Mapped[str] = mapped_column(String(32))
    passport_expiry: Mapped[str] = mapped_column(String(32))
    room_type: Mapped[str] = mapped_column(String(32), default="مزدوجة")  # مفردة، مزدوجة، ثلاثية
    dietary_notes: Mapped[str] = mapped_column(String(128), default="عادي")
    visa_status: Mapped[str] = mapped_column(String(32), default="issued")  # issued, pending, not_required
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TravelVisaApplication(TenantScoped, Base):
    """Traveler Passports & Visa Vault (TRV-07)."""
    __tablename__ = "travel_visas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    traveler_name: Mapped[str] = mapped_column(String(128), index=True)
    passport_number: Mapped[str] = mapped_column(String(32), index=True)
    destination_country: Mapped[str] = mapped_column(String(64))
    visa_category: Mapped[str] = mapped_column(String(64))  # سياحة إلكترونية eVisa، شينغن، عمرة، تأشيرة عمل
    submission_date: Mapped[str] = mapped_column(String(32))
    approval_date: Mapped[str] = mapped_column(String(32), default="")
    passport_expiry_date: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="submitted")  # submitted, under_review, approved, rejected
    notes: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
