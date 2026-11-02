"""Database models for Field Service & Maintenance ERP module (FSM-01..11)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class FsmWorkOrder(TenantScoped, Base):
    """Work Order Generation, SLA & Field Dispatch (FSM-01, FSM-02)."""
    __tablename__ = "fsm_work_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_ref: Mapped[str] = mapped_column(String(32), index=True)  # e.g. "WO-FSM-3301"
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    client_phone: Mapped[str] = mapped_column(String(32))
    site_address: Mapped[str] = mapped_column(String(256))
    equipment_type: Mapped[str] = mapped_column(String(64))  # تكييف مركزي Chiller, مصاعد, مضخات مياه, خوادم
    issue_description: Mapped[str] = mapped_column(Text)
    priority_sla: Mapped[str] = mapped_column(String(32))  # emergency_2h, urgent_6h, standard_24h
    assigned_technician: Mapped[str] = mapped_column(String(128), index=True)
    van_code: Mapped[str] = mapped_column(String(32))
    scheduled_date: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="dispatched")  # dispatched, on_site, parts_needed, completed
    completion_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FsmTechnician(TenantScoped, Base):
    """Technician GPS & Field Roster (FSM-03)."""
    __tablename__ = "fsm_technicians"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tech_name: Mapped[str] = mapped_column(String(128), index=True)
    phone: Mapped[str] = mapped_column(String(32))
    van_code: Mapped[str] = mapped_column(String(32), index=True)
    assigned_zone: Mapped[str] = mapped_column(String(64))  # التجمع والقاهرة الجديدة، 6 أكتوبر، المعادي وحلوان
    live_status: Mapped[str] = mapped_column(String(32), default="available")  # available, driving_to_site, working_on_job
    jobs_completed_today: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=4.8)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FsmVanInventory(TenantScoped, Base):
    """Mobile Van / Trunk Spare Parts Inventory (FSM-04)."""
    __tablename__ = "fsm_van_inventory"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    van_code: Mapped[str] = mapped_column(String(32), index=True)
    technician_name: Mapped[str] = mapped_column(String(128))
    part_code: Mapped[str] = mapped_column(String(32), index=True)
    part_name: Mapped[str] = mapped_column(String(128), index=True)
    qty_on_hand: Mapped[int] = mapped_column(Integer, default=0)
    min_alert_threshold: Mapped[int] = mapped_column(Integer, default=2)
    unit_price: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FsmEquipmentAsset(TenantScoped, Base):
    """Customer Machine Asset History & Maintenance Contracts AMC (FSM-06, FSM-10)."""
    __tablename__ = "fsm_equipment_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    serial_number: Mapped[str] = mapped_column(String(64), index=True)  # e.g. "SN-CARRIER-8812"
    client_name: Mapped[str] = mapped_column(String(128), index=True)
    site_location: Mapped[str] = mapped_column(String(128))
    equipment_model: Mapped[str] = mapped_column(String(128))  # تشيللر تبريد مركزي Carrier 30XA
    install_date: Mapped[str] = mapped_column(String(32))
    last_service_date: Mapped[str] = mapped_column(String(32))
    next_service_due: Mapped[str] = mapped_column(String(32))
    warranty_status: Mapped[str] = mapped_column(String(32))  # under_warranty, amc_active, expired
    total_repairs_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
