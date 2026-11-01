import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class Customer(TenantScoped, Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_cash: Mapped[bool] = mapped_column(Boolean, default=False)
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, server_default="0")
    credit_limit: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True, default=None)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=func.false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Supplier(TenantScoped, Base):
    __tablename__ = "suppliers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(32), default="supplier")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=func.false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
