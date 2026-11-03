"""Biometric Attendance and ZK Device Sync models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class ZkBiometricDevice(TenantScoped, Base):
    """ZKTeco / Biometric Attendance Clocking Device on local network."""
    __tablename__ = "zk_biometric_devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), default="جهاز البصمة الرئيسي")
    ip_address: Mapped[str] = mapped_column(String(64), default="192.168.1.201")
    port: Mapped[int] = mapped_column(Integer, default=4370)
    protocol: Mapped[str] = mapped_column(String(20), default="tcp")  # tcp / udp
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location: Mapped[str | None] = mapped_column(String(150), nullable=True, default="المدخل الرئيسي")
    status: Mapped[str] = mapped_column(String(30), default="online")  # online, offline, syncing
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_ping_ms: Mapped[int | None] = mapped_column(Integer, nullable=True, default=24)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BiometricPunchLog(TenantScoped, Base):
    """Raw attendance punch timestamp captured from biometric machine or CSV."""
    __tablename__ = "biometric_punch_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("zk_biometric_devices.id", ondelete="SET NULL"), nullable=True
    )
    employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hr_employees.id", ondelete="SET NULL"), nullable=True
    )
    emp_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    punch_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    punch_state: Mapped[str] = mapped_column(String(30), default="check_in")  # check_in, check_out, break_start, break_end
    verify_mode: Mapped[str] = mapped_column(String(30), default="fingerprint")  # fingerprint, face, card, password
    is_synced: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_record: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
