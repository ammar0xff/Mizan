"""API router for Kitchen Display System (KDS) module."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="", tags=["Kitchen Display Module"])


@router.get("/kitchen-orders")
async def get_kitchen_orders(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve active kitchen orders for KDS display."""
    return [
        {
            "id": "k-104",
            "table": "طاولة 3 (عائلات)",
            "waiter": "كريم أحمد",
            "status": "cooking",
            "elapsed_minutes": 12,
            "items": [
                {"name": "برجر دبل بيف مشوي", "qty": 2, "notes": "بدون بصل، جبنة إضافية"},
                {"name": "بيتزا رانش دجاج لارج", "qty": 1, "notes": "تسوية مقرمشة"},
                {"name": "بطاطس ويدجز متبلة", "qty": 2, "notes": ""},
            ],
        },
        {
            "id": "k-105",
            "table": "طاولة 1 (رئيسية)",
            "waiter": "عمر محمود",
            "status": "cooking",
            "elapsed_minutes": 4,
            "items": [
                {"name": "باستا ألفريدو دجاج ومشروم", "qty": 1, "notes": "إكسترا صوص أبيض"},
                {"name": "سلطة سيزر دجاج مشوي", "qty": 1, "notes": ""},
            ],
        },
    ]
