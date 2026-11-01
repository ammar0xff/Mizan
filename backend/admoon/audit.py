"""Platform Immutable Audit Logging Service."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import PlatformAuditLog


class AuditService:
    async def log_action(
        self,
        db: AsyncSession,
        action: str,
        platform_user_id: uuid.UUID | None = None,
        tenant_id: uuid.UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        rec = PlatformAuditLog(
            id=uuid.uuid4(),
            platform_user_id=platform_user_id,
            tenant_id=tenant_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
        )
        db.add(rec)
        await db.commit()

    async def list_logs(self, db: AsyncSession, limit: int = 100) -> list[dict[str, Any]]:
        stmt = select(PlatformAuditLog).order_by(PlatformAuditLog.created_at.desc()).limit(limit)
        rows = (await db.execute(stmt)).scalars().all()
        return [
            {
                "id": str(r.id),
                "action": r.action,
                "tenant_id": str(r.tenant_id) if r.tenant_id else None,
                "platform_user_id": str(r.platform_user_id) if r.platform_user_id else None,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "details": r.details,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]


audit_service = AuditService()
