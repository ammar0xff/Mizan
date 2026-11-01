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


class HostingConfig(Base):
    """Infrastructure and deployment hosting configuration for a tenant."""

    __tablename__ = "tenant_hosting_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    hosting_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="cloud_saas")
    deployment_provider: Mapped[str] = mapped_column(String(64), nullable=False, default="docker_compose")
    app_host: Mapped[str | None] = mapped_column(String(128), nullable=True)
    domain: Mapped[str | None] = mapped_column(String(128), nullable=True)
    port: Mapped[int] = mapped_column(default=8000)
    internal_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    public_access: Mapped[bool] = mapped_column(default=True)
    ssl_enabled: Mapped[bool] = mapped_column(default=True)
    cpu_limit: Mapped[str] = mapped_column(String(16), default="2.0")
    ram_limit_mb: Mapped[int] = mapped_column(default=2048)
    storage_limit_mb: Mapped[int] = mapped_column(default=10240)
    deployment_status: Mapped[str] = mapped_column(String(32), default="healthy")
    deployed_version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    last_health_check: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DatabaseConfig(Base):
    """Database provider and connection parameters for a tenant."""

    __tablename__ = "tenant_database_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="postgresql")
    strategy: Mapped[str] = mapped_column(String(32), nullable=False, default="shared_db")
    host: Mapped[str | None] = mapped_column(String(128), nullable=True)
    port: Mapped[int | None] = mapped_column(nullable=True)
    database_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    schema_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    encrypted_secret_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    connection_status: Mapped[str] = mapped_column(String(32), default="connected")
    ssl_mode: Mapped[str] = mapped_column(String(16), default="prefer")
    last_successful_connection: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_backup_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class StorageConfig(Base):
    """Storage provider configuration for a tenant."""

    __tablename__ = "tenant_storage_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="local")
    bucket_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    endpoint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quota_mb: Mapped[int] = mapped_column(default=10240)
    used_mb: Mapped[float] = mapped_column(default=0.0)
    retention_days: Mapped[int] = mapped_column(default=365)


class ProvisioningJob(Base):
    """Background provisioning and infrastructure orchestration jobs."""

    __tablename__ = "provisioning_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_type: Mapped[str] = mapped_column(String(32), nullable=False, default="new_tenant")
    current_step: Mapped[str] = mapped_column(String(64), nullable=False, default="validating")
    progress_percent: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    step_logs: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PlatformAuditLog(Base):
    """Immutable audit trail for SaaS platform administrative actions."""

    __tablename__ = "platform_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    platform_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BackupRecord(Base):
    """Tenant database and storage backup snapshots."""

    __tablename__ = "tenant_backups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    backup_type: Mapped[str] = mapped_column(String(32), nullable=False, default="full_database")
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="local")
    destination: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_mb: Mapped[float] = mapped_column(default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="completed")
    is_verified: Mapped[bool] = mapped_column(default=True)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
