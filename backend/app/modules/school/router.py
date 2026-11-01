"""API router for School module."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="", tags=["School Module"])


@router.get("/students")
async def get_school_students(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve students and tuition fees status."""
    return [
        {"id": "s-1", "code": "STU-2024-001", "name": "أحمد محمود حسن", "grade": "الصف الأول الإعدادي", "parent_phone": "01098765432", "total_tuition": 15000.0, "paid_tuition": 10000.0, "balance_due": 5000.0},
        {"id": "s-2", "code": "STU-2024-002", "name": "سارة إبراهيم فتحي", "grade": "الصف الثاني الثانوي", "parent_phone": "01123456789", "total_tuition": 22000.0, "paid_tuition": 22000.0, "balance_due": 0.0},
        {"id": "s-3", "code": "STU-2024-003", "name": "يوسف طارق علي", "grade": "الصف السادس الابتدائي", "parent_phone": "01234567890", "total_tuition": 12000.0, "paid_tuition": 6000.0, "balance_due": 6000.0},
        {"id": "s-4", "code": "STU-2024-004", "name": "مريم خالد سمير", "grade": "الصف الثالث الإعدادي", "parent_phone": "01011223344", "total_tuition": 18000.0, "paid_tuition": 18000.0, "balance_due": 0.0},
    ]
