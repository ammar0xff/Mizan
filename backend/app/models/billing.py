"""Tenant Billing & Invoices Models."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BillingInvoice(Base):
    """SaaS subscription invoice for tenant plan activations and renewals."""

    __tablename__ = "tenant_billing_invoices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    invoice_ref: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    plan: Mapped[str] = mapped_column(String(16), nullable=False)
    billing_cycle: Mapped[str] = mapped_column(String(16), nullable=False, default="monthly")
    amount_egp: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False, default="card")
    payment_gateway_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")  # pending, paid, failed, refunded
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
