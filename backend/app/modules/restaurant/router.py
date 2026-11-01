"""API router for Restaurant module."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="", tags=["Restaurant Module"])


@router.get("/tables")
async def get_restaurant_tables(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve active dining tables for the restaurant vertical."""
    return [
        {"id": "t-1", "number": "1", "capacity": 4, "section": "الصالة الرئيسية", "status": "occupied", "order_total": 450.0, "guests": 3, "opened_at": "منذ 25 دقيقة"},
        {"id": "t-2", "number": "2", "capacity": 2, "section": "الصالة الرئيسية", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
        {"id": "t-3", "number": "3", "capacity": 6, "section": "صالة العائلات", "status": "occupied", "order_total": 1280.0, "guests": 5, "opened_at": "منذ 45 دقيقة"},
        {"id": "t-4", "number": "4", "capacity": 4, "section": "صالة العائلات", "status": "reserved", "order_total": 0.0, "guests": 0, "opened_at": None},
        {"id": "t-5", "number": "5", "capacity": 8, "section": "التراس الخارجي", "status": "occupied", "order_total": 890.0, "guests": 6, "opened_at": "منذ 10 دقائق"},
        {"id": "t-6", "number": "6", "capacity": 2, "section": "التراس الخارجي", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
    ]
