"""Database models for Restaurant & Dining Hall module."""
from __future__ import annotations

import uuid

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class RestaurantTable(TenantScoped, Base):
    __tablename__ = "restaurant_tables"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    number: Mapped[str] = mapped_column(String(32), index=True)
    capacity: Mapped[int] = mapped_column(Integer, default=4)
    section: Mapped[str] = mapped_column(String(64), default="الصالة الرئيسية")
    status: Mapped[str] = mapped_column(String(32), default="available")  # available, occupied, reserved
    order_total: Mapped[float] = mapped_column(Float, default=0.0)
    guests: Mapped[int] = mapped_column(Integer, default=0)
    opened_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
