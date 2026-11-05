"""API router for WhatsApp Business integration module."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.modules import require_module
from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.modules.whatsapp_gateway.models import WhatsAppMessageLog


async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)

router = APIRouter(prefix="/integrations/whatsapp", tags=["Integration: WhatsApp Business"])


class SendReceiptRequest(BaseModel):
    recipient_phone: str
    reference_type: str = "sale"  # sale, storefront_order
    reference_id: str | None = None
    template_name: str = "receipt_basic"


class IntegrationStatus(BaseModel):
    module: str = "whatsapp_gateway"
    configured: bool
    auto_send_on_sale: bool
    auto_send_on_storefront_order: bool
    queued_messages: int
    sent_messages: int
    failed_messages: int


@router.get("/status", response_model=IntegrationStatus)
async def get_status(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    _mod: bool = Depends(require_module("whatsapp_gateway")),
):
    """Return configuration/health status for the WhatsApp integration."""
    result = await db.execute(
        select(WhatsAppMessageLog).where(WhatsAppMessageLog.tenant_id == tenant_id)
    )
    rows = result.scalars().all()
    queued = sum(1 for r in rows if r.status == "queued")
    sent = sum(1 for r in rows if r.status in ("sent", "delivered", "read"))
    failed = sum(1 for r in rows if r.status == "failed")
    # Configured if a token is stored (checked via settings store in production).
    return IntegrationStatus(
        configured=False,
        auto_send_on_sale=True,
        auto_send_on_storefront_order=True,
        queued_messages=queued,
        sent_messages=sent,
        failed_messages=failed,
    )


@router.post("/send-receipt")
async def send_receipt(
    payload: SendReceiptRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: Any = Depends(get_current_user),
    _mod: bool = Depends(require_module("whatsapp_gateway")),
):
    """Queue a WhatsApp receipt message. Real dispatch happens via the worker."""
    log = WhatsAppMessageLog(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        recipient_phone=payload.recipient_phone,
        message_type="receipt",
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        template_name=payload.template_name,
        status="queued",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return {"message": "تم إدراج الإيصال في قائمة إرسال WhatsApp", "id": log.id, "status": log.status}


@router.get("/messages")
async def list_messages(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    limit: int = 50,
    _mod: bool = Depends(require_module("whatsapp_gateway")),
):
    """List recent WhatsApp message log entries for the tenant."""
    result = await db.execute(
        select(WhatsAppMessageLog)
        .where(WhatsAppMessageLog.tenant_id == tenant_id)
        .order_by(WhatsAppMessageLog.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "recipient_phone": r.recipient_phone,
            "message_type": r.message_type,
            "reference_type": r.reference_type,
            "reference_id": r.reference_id,
            "template_name": r.template_name,
            "status": r.status,
            "provider_message_id": r.provider_message_id,
            "error_detail": r.error_detail,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
