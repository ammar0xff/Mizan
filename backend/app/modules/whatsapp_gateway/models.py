"""Database models for WhatsApp Business integration module."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class WhatsAppMessageLog(TenantScoped, Base):
    """Log of WhatsApp messages dispatched by the integration (auditable)."""
    __tablename__ = "whatsapp_message_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_phone: Mapped[str] = mapped_column(String(32), index=True)
    message_type: Mapped[str] = mapped_column(String(32), default="receipt")  # receipt, order_confirmation, template
    reference_type: Mapped[str | None] = mapped_column(String(32), nullable=True)  # sale, storefront_order
    reference_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    template_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="queued")  # queued, sent, delivered, read, failed
    provider_message_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
