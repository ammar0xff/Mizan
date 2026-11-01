"""Row-level multi-tenancy.

Every tenant-owned row carries tenant_id (TenantScoped mixin). Reads and
writes are scoped automatically:

- Reads/updates/deletes: `with_loader_criteria` injects `tenant_id == ctx`
  into every ORM statement while a tenant is in context.
- Inserts: `before_flush` stamps tenant_id from context when left unset.

The context is set by `get_current_user` from the authenticated user, or
explicitly by public routes (storefront) after resolving their tenant.
Scripts and migrations run with no context and see everything.
"""
import uuid
from contextvars import ContextVar

from sqlalchemy import ForeignKey, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, Session, declared_attr, mapped_column, with_loader_criteria

current_tenant_id: ContextVar[uuid.UUID | None] = ContextVar("current_tenant_id", default=None)


class TenantScoped:
    """Mixin for models whose rows belong to exactly one tenant."""

    @declared_attr
    def tenant_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


def install_tenancy_events() -> None:
    """Attach global scoping listeners to the sync Session class (all sessions)."""

    @event.listens_for(Session, "after_begin")
    def _set_pg_tenant(session, transaction, connection):
        tid = current_tenant_id.get()
        if tid is not None:
            from sqlalchemy import text
            connection.execute(
                text("SELECT set_config('app.tenant_id', :t, true)"),
                {"t": str(tid)},
            )

    @event.listens_for(Session, "do_orm_execute")
    def _scope_statements(execute_state):
        if not (execute_state.is_select or execute_state.is_update or execute_state.is_delete):
            return
        tid = current_tenant_id.get()
        if tid is None:
            return
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                TenantScoped,
                lambda cls: cls.tenant_id == tid,
                include_aliases=True,
            )
        )

    @event.listens_for(Session, "before_flush")
    def _stamp_tenant(session, flush_context, instances):
        tid = current_tenant_id.get()
        for obj in session.new:
            if isinstance(obj, TenantScoped) and getattr(obj, "tenant_id", None) is None:
                if tid is not None:
                    obj.tenant_id = tid


async def primary_tenant_id(db) -> uuid.UUID | None:
    """The platform's first (founding) workspace — legacy users land here."""
    from sqlalchemy import select

    from app.models.tenant import Tenant

    res = await db.execute(select(Tenant.id).order_by(Tenant.created_at).limit(1))
    return res.scalar()


async def bind_tenant(db, tid: uuid.UUID | None) -> None:
    """Bind the tenant to BOTH the request context (ORM stamping/scoping)
    and the Postgres GUC (RLS — enforces raw SQL too). Uses transaction-local
    setting (true) so the pool automatically clears on commit/rollback."""
    from sqlalchemy import text
    current_tenant_id.set(tid)
    if tid is not None:
        await db.execute(text("SELECT set_config('app.tenant_id', :t, true)"), {"t": str(tid)})


async def unbind_tenant(db) -> None:
    from sqlalchemy import text
    current_tenant_id.set(None)
    try:
        await db.execute(text("RESET app.tenant_id; RESET app.bypass;"))
    except Exception:
        pass  # connection already gone
