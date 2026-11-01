import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Tenant(Base):
    """A merchant workspace — one company with its branches, staff, and data."""

    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sector: Mapped[str] = mapped_column(String(32), nullable=False, default="plumbing")
    scale: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")
    # wizard choices: {"primary_hue": "...", ...} applied by the frontend as token overrides
    palette: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # optional feature toggles chosen in the wizard, e.g. ["credit", "quotations", "hr"]
    features: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    plan: Mapped[str] = mapped_column(String(16), nullable=False, default="trial")
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    storefront_slug: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)

    # Multi-tenancy routing & custom tech stack config
    slug: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    custom_domain: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    deployment_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="cloud_saas")
    business_type: Mapped[str] = mapped_column(String(64), nullable=False, default="retail")
    tech_stack: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    active_modules: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    limits: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Subscription(Base):
    """A plan activation request / record. Payment integration lands later."""

    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="requested")
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
