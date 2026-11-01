"""API router for School & Education module with full PostgreSQL persistence."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_perm
from app.modules.school.models import SchoolPayment, SchoolStudent

router = APIRouter(prefix="", tags=["School Module"])


class PayInstallmentRequest(BaseModel):
    amount: float
    notes: str | None = None


class CreateStudentRequest(BaseModel):
    code: str
    name: str
    grade: str
    parent_phone: str
    total_tuition: float


DEFAULT_STUDENTS = [
    {"code": "STU-2024-001", "name": "أحمد محمود حسن", "grade": "الصف الأول الإعدادي", "parent_phone": "01098765432", "total_tuition": 15000.0, "paid_tuition": 10000.0, "balance_due": 5000.0, "status": "active"},
    {"code": "STU-2024-002", "name": "سارة إبراهيم فتحي", "grade": "الصف الثاني الثانوي", "parent_phone": "01123456789", "total_tuition": 22000.0, "paid_tuition": 22000.0, "balance_due": 0.0, "status": "settled"},
    {"code": "STU-2024-003", "name": "يوسف طارق علي", "grade": "الصف السادس الابتدائي", "parent_phone": "01234567890", "total_tuition": 12000.0, "paid_tuition": 6000.0, "balance_due": 6000.0, "status": "overdue"},
    {"code": "STU-2024-004", "name": "مريم خالد سمير", "grade": "الصف الثالث الإعدادي", "parent_phone": "01011223344", "total_tuition": 18000.0, "paid_tuition": 18000.0, "balance_due": 0.0, "status": "settled"},
]


async def _ensure_seeded(db: AsyncSession) -> None:
    """Seed initial students if table is empty."""
    res = await db.execute(select(SchoolStudent).limit(1))
    if res.scalar_one_or_none() is None:
        for s in DEFAULT_STUDENTS:
            db.add(SchoolStudent(**s))
        await db.commit()


@router.get("/students")
async def get_school_students(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve students and tuition fees status from PostgreSQL."""
    await _ensure_seeded(db)
    stmt = select(SchoolStudent).order_by(SchoolStudent.created_at.desc())
    res = await db.execute(stmt)
    students = res.scalars().all()
    return [
        {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "grade": s.grade,
            "parent_phone": s.parent_phone,
            "total_tuition": s.total_tuition,
            "paid_tuition": s.paid_tuition,
            "balance_due": s.balance_due,
            "status": s.status,
        }
        for s in students
    ]


@router.post("/students")
async def create_school_student(
    data: CreateStudentRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_perm("settings")),
):
    """Register a new student."""
    student = SchoolStudent(
        code=data.code,
        name=data.name,
        grade=data.grade,
        parent_phone=data.parent_phone,
        total_tuition=data.total_tuition,
        paid_tuition=0.0,
        balance_due=data.total_tuition,
        status="active",
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.post("/students/{student_id}/pay")
async def pay_student_installment(
    student_id: str,
    data: PayInstallmentRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Record a tuition payment and persist transaction."""
    stmt = select(SchoolStudent).where(SchoolStudent.id == student_id)
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="طالب غير موجود")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="يجب أن يكون المبلغ المحصل أكبر من صفر")

    # Update student balances
    new_paid = student.paid_tuition + data.amount
    new_balance = max(0.0, student.total_tuition - new_paid)
    student.paid_tuition = new_paid
    student.balance_due = new_balance
    student.status = "settled" if new_balance <= 0 else "active"

    # Create payment receipt
    receipt_no = f"REC-{uuid.uuid4().hex[:8].upper()}"
    payment = SchoolPayment(
        student_id=student.id,
        amount=data.amount,
        receipt_no=receipt_no,
        notes=data.notes,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return {
        "detail": f"تم تسجيل سداد مبلغ {data.amount:.2f} ج.م للطالب {student.name}",
        "receipt_no": receipt_no,
        "paid_amount": data.amount,
        "new_balance_due": new_balance,
        "total_paid": new_paid,
        "student_name": student.name,
        "student_code": student.code,
    }
