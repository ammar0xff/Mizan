"""Database models for Kitchen Display System (KDS) module."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class KitchenTicket(TenantScoped, Base):
    __tablename__ = "kitchen_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(32), index=True)
    table_name: Mapped[str] = mapped_column(String(64))
    waiter: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="cooking")  # pending, cooking, ready, served
    elapsed_minutes: Mapped[int] = mapped_column(Integer, default=0)
    items_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
