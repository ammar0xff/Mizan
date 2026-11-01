"""Payment wallet models."""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class PaymentWallet(TenantScoped, Base):
    __tablename__ = "payment_wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), index=True)
    type: Mapped[str] = mapped_column(String(32))
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=func.false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("tenant_id", "name", name="uq_payment_wallets_name"),)

class WalletTransaction(TenantScoped, Base):
    """Maps to wallet_transactions table."""
    __tablename__ = "wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("payment_wallets.id", ondelete="CASCADE"))
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    tx_type: Mapped[str] = mapped_column(String(32), nullable=False)  # deposit/withdrawal/transfer_in/transfer_out
    ref_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    note: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
