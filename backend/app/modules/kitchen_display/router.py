"""API router for Kitchen Display System (KDS) module with full PostgreSQL persistence."""
from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.kitchen_display.models import KitchenTicket

router = APIRouter(prefix="", tags=["Kitchen Display Module"])


class UpdateTicketStatusRequest(BaseModel):
    status: str  # pending, cooking, ready, served


DEFAULT_TICKETS = [
    {
        "order_number": "#K-104",
        "table_name": "طاولة 3 (عائلات)",
        "waiter": "كريم أحمد",
        "status": "cooking",
        "elapsed_minutes": 12,
        "items_json": json.dumps([
            {"name": "برجر دبل بيف مشوي", "qty": 2, "notes": "بدون بصل، جبنة إضافية"},
            {"name": "بيتزا رانش دجاج لارج", "qty": 1, "notes": "تسوية مقرمشة"},
            {"name": "بطاطس ويدجز متبلة", "qty": 2, "notes": ""},
        ], ensure_ascii=False),
    },
    {
        "order_number": "#K-105",
        "table_name": "طاولة 1 (رئيسية)",
        "waiter": "عمر محمود",
        "status": "cooking",
        "elapsed_minutes": 4,
        "items_json": json.dumps([
            {"name": "باستا ألفريدو دجاج ومشروم", "qty": 1, "notes": "إكسترا صوص أبيض"},
            {"name": "سلطة سيزر دجاج مشوي", "qty": 1, "notes": ""},
        ], ensure_ascii=False),
    },
]


async def _ensure_seeded(db: AsyncSession) -> None:
    res = await db.execute(select(KitchenTicket).limit(1))
    if res.scalar_one_or_none() is None:
        for t in DEFAULT_TICKETS:
            db.add(KitchenTicket(**t))
        await db.commit()


@router.get("/kitchen-orders")
async def get_kitchen_orders(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve active kitchen orders from PostgreSQL."""
    await _ensure_seeded(db)
    stmt = select(KitchenTicket).where(KitchenTicket.status.in_(["pending", "cooking", "ready"])).order_by(KitchenTicket.created_at)
    res = await db.execute(stmt)
    tickets = res.scalars().all()
    out = []
    for t in tickets:
        try:
            items = json.loads(t.items_json)
        except Exception:
            items = []
        out.append({
            "id": t.id,
            "order_number": t.order_number,
            "table": t.table_name,
            "waiter": t.waiter,
            "status": t.status,
            "elapsed_minutes": t.elapsed_minutes,
            "items": items,
        })
    return out


@router.post("/kitchen-orders/{ticket_id}/status")
async def update_kitchen_ticket_status(
    ticket_id: str,
    data: UpdateTicketStatusRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Update kitchen ticket status (e.g. mark ready / served)."""
    stmt = select(KitchenTicket).where(KitchenTicket.id == ticket_id)
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="تذكرة مطبخ غير موجودة")

    ticket.status = data.status
    await db.commit()
    await db.refresh(ticket)
    return {"detail": "تم تحديث حالة التذكرة بنجاح", "id": ticket.id, "status": ticket.status}
