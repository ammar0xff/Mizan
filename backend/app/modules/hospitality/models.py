"""Database models for Hotel Property Management System (PMS) module (HOT-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class HotelRoom(TenantScoped, Base):
    """Room Inventory & Hierarchy (HOT-01, HOT-02)."""
    __tablename__ = "hotel_rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_number: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "101", "205", "501-VIP"
    room_type: Mapped[str] = mapped_column(String(64), index=True)  # غرفة قياسية Standard, غرفة ديلوكس Deluxe, جناح تنفيذي Suite
    floor: Mapped[str] = mapped_column(String(32))  # الدور الأول، الثالث، العاشر
    bed_type: Mapped[str] = mapped_column(String(32))  # King Size, Twin Beds
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    base_rate: Mapped[float] = mapped_column(Float, default=1800.0)
    status: Mapped[str] = mapped_column(String(32), default="vacant_clean")  # vacant_clean, vacant_dirty, occupied, inspected, out_of_order
    amenities: Mapped[str] = mapped_column(String(256), default="إطلالة على النيل / المدينة، واي فاي سريع، ميني بار، ماكينة قهوة")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HotelReservation(TenantScoped, Base):
    """Guest Check-in, Check-out & Reservations (HOT-03)."""
    __tablename__ = "hotel_reservations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reservation_ref: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "HTL-RES-7701"
    guest_name: Mapped[str] = mapped_column(String(128), index=True)
    guest_phone: Mapped[str] = mapped_column(String(32))
    guest_passport: Mapped[str] = mapped_column(String(32))
    room_number: Mapped[str] = mapped_column(String(32), index=True)
    check_in_date: Mapped[str] = mapped_column(String(32))
    check_out_date: Mapped[str] = mapped_column(String(32))
    nights: Mapped[int] = mapped_column(Integer, default=1)
    room_rate: Mapped[float] = mapped_column(Float)
    total_charges: Mapped[float] = mapped_column(Float)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="confirmed")  # confirmed, checked_in, checked_out, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HotelFolioItem(TenantScoped, Base):
    """Guest Folio & Incidentals Room Posting (HOT-07)."""
    __tablename__ = "hotel_folio_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reservation_id: Mapped[str] = mapped_column(String(36), index=True)
    guest_name: Mapped[str] = mapped_column(String(128))
    room_number: Mapped[str] = mapped_column(String(32), index=True)
    charge_type: Mapped[str] = mapped_column(String(64))  # إقامة ليلية، مطعم وكافيه، ميني بار، مغسلة، خدمات سبا
    description: Mapped[str] = mapped_column(String(256))
    net_amount: Mapped[float] = mapped_column(Float)
    tax_amount: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float)
    charge_date: Mapped[str] = mapped_column(String(32))
    is_settled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HotelHousekeepingTask(TenantScoped, Base):
    """Housekeeping & Room Cleaning Dispatch (HOT-04)."""
    __tablename__ = "hotel_housekeeping_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_number: Mapped[str] = mapped_column(String(32), index=True)
    task_type: Mapped[str] = mapped_column(String(64))  # تنظيف يومي (Stayover)، تنظيف مغادرة (Checkout Clean)، تنظيف عميق (Deep Clean)
    priority: Mapped[str] = mapped_column(String(32), default="normal")  # urgent, high, normal
    assigned_to: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, in_progress, completed
    notes: Mapped[str] = mapped_column(String(256), default="")
    completed_at: Mapped[str] = mapped_column(String(32), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HotelNightAudit(TenantScoped, Base):
    """Night Audit & Revenue Metrics - RevPAR / ADR (HOT-08)."""
    __tablename__ = "hotel_night_audits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_date: Mapped[str] = mapped_column(String(32), index=True)
    total_rooms: Mapped[int] = mapped_column(Integer)
    occupied_rooms: Mapped[int] = mapped_column(Integer)
    occupancy_rate: Mapped[float] = mapped_column(Float)  # e.g. 75.0%
    room_revenue: Mapped[float] = mapped_column(Float)
    fnb_revenue: Mapped[float] = mapped_column(Float)
    total_revenue: Mapped[float] = mapped_column(Float)
    adr: Mapped[float] = mapped_column(Float)  # Average Daily Rate
    revpar: Mapped[float] = mapped_column(Float)  # Revenue Per Available Room
    conducted_by: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
