"""API router for Restaurant module with full PostgreSQL persistence."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.restaurant.models import RestaurantTable

router = APIRouter(prefix="", tags=["Restaurant Module"])


class UpdateTableStatusRequest(BaseModel):
    status: str  # available, occupied, reserved
    guests: int | None = None
    order_total: float | None = None
    opened_at: str | None = None


DEFAULT_TABLES = [
    {"number": "1", "capacity": 4, "section": "الصالة الرئيسية", "status": "occupied", "order_total": 450.0, "guests": 3, "opened_at": "منذ 25 دقيقة"},
    {"number": "2", "capacity": 2, "section": "الصالة الرئيسية", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
    {"number": "3", "capacity": 6, "section": "صالة العائلات", "status": "occupied", "order_total": 1280.0, "guests": 5, "opened_at": "منذ 45 دقيقة"},
    {"number": "4", "capacity": 4, "section": "صالة العائلات", "status": "reserved", "order_total": 0.0, "guests": 0, "opened_at": None},
    {"number": "5", "capacity": 8, "section": "التراس الخارجي", "status": "occupied", "order_total": 890.0, "guests": 6, "opened_at": "منذ 10 دقائق"},
    {"number": "6", "capacity": 2, "section": "التراس الخارجي", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
]


async def _ensure_seeded(db: AsyncSession) -> None:
    res = await db.execute(select(RestaurantTable).limit(1))
    if res.scalar_one_or_none() is None:
        for t in DEFAULT_TABLES:
            db.add(RestaurantTable(**t))
        await db.commit()


@router.get("/tables")
async def get_restaurant_tables(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve active dining tables from PostgreSQL."""
    await _ensure_seeded(db)
    stmt = select(RestaurantTable).order_by(RestaurantTable.number)
    res = await db.execute(stmt)
    tables = res.scalars().all()
    return [
        {
            "id": t.id,
            "number": t.number,
            "capacity": t.capacity,
            "section": t.section,
            "status": t.status,
            "order_total": t.order_total,
            "guests": t.guests,
            "opened_at": t.opened_at,
        }
        for t in tables
    ]


@router.post("/tables/{table_id}/status")
async def update_table_status(
    table_id: str,
    data: UpdateTableStatusRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Update table occupancy or reservation state."""
    stmt = select(RestaurantTable).where(RestaurantTable.id == table_id)
    res = await db.execute(stmt)
    table = res.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="طاولة غير موجودة")

    table.status = data.status
    if data.guests is not None:
        table.guests = data.guests
    if data.order_total is not None:
        table.order_total = data.order_total
    if data.opened_at is not None:
        table.opened_at = data.opened_at
    elif data.status == "available":
        table.opened_at = None
        table.guests = 0
        table.order_total = 0.0

    await db.commit()
    await db.refresh(table)
    return table
