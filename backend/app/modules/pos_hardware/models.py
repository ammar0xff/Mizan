"""POS Hardware & Thermal Printing Models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class PosHardwareProfile(TenantScoped, Base):
    """Workstation hardware configuration profile for thermal printers and POS devices."""
    __tablename__ = "pos_hardware_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workstation_name: Mapped[str] = mapped_column(String(100), default="كاشير رئيسي (Workstation 1)")
    printer_type: Mapped[str] = mapped_column(String(50), default="browser_thermal")  # browser_thermal, network_escpos, usb_raw
    printer_ip: Mapped[str | None] = mapped_column(String(100), nullable=True)
    printer_port: Mapped[int] = mapped_column(Integer, default=9100)
    paper_width: Mapped[str] = mapped_column(String(20), default="80mm")  # 80mm, 58mm
    auto_print: Mapped[bool] = mapped_column(Boolean, default=True)
    cash_drawer_pulse: Mapped[bool] = mapped_column(Boolean, default=True)
    show_tax_qr: Mapped[bool] = mapped_column(Boolean, default=True)
    header_note: Mapped[str | None] = mapped_column(Text, nullable=True, default="أهلاً وسهلاً بكم — نسعد بخدمتكم دائماً")
    footer_note: Mapped[str | None] = mapped_column(Text, nullable=True, default="البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب الفاتورة")
    is_default: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
