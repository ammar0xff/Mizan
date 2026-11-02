"""API router for School & Education module with full PostgreSQL persistence."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_perm
from app.modules.school.models import (
    SchoolAcademicTerm,
    SchoolAttendance,
    SchoolGradeRecord,
    SchoolPayment,
    SchoolStudent,
)

router = APIRouter(prefix="", tags=["School Module"])


class PayInstallmentRequest(BaseModel):
    amount: float
    term: str = "القسط الأول"
    notes: str | None = None


class CreateStudentRequest(BaseModel):
    code: str
    name: str
    grade: str
    parent_phone: str
    guardian_name: str | None = None
    has_sibling_discount: bool = False
    total_tuition: float


class RecordAttendanceRequest(BaseModel):
    student_id: str
    student_name: str
    grade: str
    date: str
    status: str  # present, absent, late, excused
    notes: str | None = None
    recorded_by: str = "مشرف الحضور"


class RecordGradeRequest(BaseModel):
    student_id: str
    student_name: str
    grade: str
    term: str = "الفصل الدراسي الأول"
    subject: str
    exam_type: str = "midterm"  # midterm, final, coursework
    max_score: float = 100.0
    score: float
    remarks: str | None = None


DEFAULT_STUDENTS = [
    {
        "code": "STU-2024-001",
        "name": "أحمد محمود حسن",
        "grade": "الصف الأول الإعدادي",
        "parent_phone": "01098765432",
        "guardian_name": "محمود حسن علي",
        "has_sibling_discount": False,
        "total_tuition": 15000.0,
        "paid_tuition": 10000.0,
        "balance_due": 5000.0,
        "status": "active",
    },
    {
        "code": "STU-2024-002",
        "name": "سارة إبراهيم فتحي",
        "grade": "الصف الثاني الثانوي",
        "parent_phone": "01123456789",
        "guardian_name": "إبراهيم فتحي السيد",
        "has_sibling_discount": True,
        "total_tuition": 22000.0,
        "paid_tuition": 22000.0,
        "balance_due": 0.0,
        "status": "settled",
    },
    {
        "code": "STU-2024-003",
        "name": "يوسف طارق علي",
        "grade": "الصف السادس الابتدائي",
        "parent_phone": "01234567890",
        "guardian_name": "طارق علي عثمان",
        "has_sibling_discount": False,
        "total_tuition": 12000.0,
        "paid_tuition": 6000.0,
        "balance_due": 6000.0,
        "status": "overdue",
    },
    {
        "code": "STU-2024-004",
        "name": "مريم خالد سمير",
        "grade": "الصف الثالث الإعدادي",
        "parent_phone": "01011223344",
        "guardian_name": "خالد سمير إبراهيم",
        "has_sibling_discount": True,
        "total_tuition": 18000.0,
        "paid_tuition": 18000.0,
        "balance_due": 0.0,
        "status": "settled",
    },
]

DEFAULT_TERMS = [
    {
        "name": "الفصل الدراسي الأول 2024-2025",
        "academic_year": "2024-2025",
        "start_date": "2024-09-21",
        "end_date": "2025-01-15",
        "is_current": True,
    },
    {
        "name": "الفصل الدراسي الثاني 2024-2025",
        "academic_year": "2024-2025",
        "start_date": "2025-02-08",
        "end_date": "2025-06-05",
        "is_current": False,
    },
]

DEFAULT_ATTENDANCE = [
    {"student_name": "أحمد محمود حسن", "grade": "الصف الأول الإعدادي", "date": "2026-11-01", "status": "present", "recorded_by": "أ/ مجدي رضوان"},
    {"student_name": "سارة إبراهيم فتحي", "grade": "الصف الثاني الثانوي", "date": "2026-11-01", "status": "present", "recorded_by": "أ/ سوسن فؤاد"},
    {"student_name": "يوسف طارق علي", "grade": "الصف السادس الابتدائي", "date": "2026-11-01", "status": "absent", "notes": "غياب غير معذور - تم إرسال إشعار ولي الأمر", "recorded_by": "أ/ هاني كمال"},
    {"student_name": "مريم خالد سمير", "grade": "الصف الثالث الإعدادي", "date": "2026-11-01", "status": "late", "notes": "تأخير 15 دقيقة طابور الصباح", "recorded_by": "أ/ مجدي رضوان"},
]

DEFAULT_GRADES = [
    {"student_name": "أحمد محمود حسن", "grade": "الصف الأول الإعدادي", "subject": "الرياضيات", "term": "الفصل الأول", "exam_type": "midterm", "max_score": 100.0, "score": 92.0, "letter_grade": "A", "is_passed": True, "remarks": "ممتاز في الجبر"},
    {"student_name": "سارة إبراهيم فتحي", "grade": "الصف الثاني الثانوي", "subject": "الكيمياء", "term": "الفصل الأول", "exam_type": "midterm", "max_score": 100.0, "score": 96.0, "letter_grade": "A+", "is_passed": True, "remarks": "أداء متفوق بالمعمل"},
    {"student_name": "يوسف طارق علي", "grade": "الصف السادس الابتدائي", "subject": "اللغة الإنجليزية", "term": "الفصل الأول", "exam_type": "midterm", "max_score": 100.0, "score": 74.0, "letter_grade": "C", "is_passed": True, "remarks": "يحتاج مراجعة القواعد"},
    {"student_name": "مريم خالد سمير", "grade": "الصف الثالث الإعدادي", "subject": "العلوم", "term": "الفصل الأول", "exam_type": "midterm", "max_score": 100.0, "score": 88.0, "letter_grade": "B+", "is_passed": True, "remarks": "جيد جداً"},
]


async def _ensure_seeded(db: AsyncSession) -> None:
    """Seed initial students and academic records if table is empty."""
    res = await db.execute(select(SchoolStudent).limit(1))
    if res.scalar_one_or_none() is None:
        for s in DEFAULT_STUDENTS:
            db.add(SchoolStudent(**s))
        await db.commit()

    term_res = await db.execute(select(SchoolAcademicTerm).limit(1))
    if term_res.scalar_one_or_none() is None:
        for t in DEFAULT_TERMS:
            db.add(SchoolAcademicTerm(**t))
        await db.commit()

    # Seed initial attendance and grades with real student IDs
    stu_res = await db.execute(select(SchoolStudent))
    stu_list = {s.name: s.id for s in stu_res.scalars().all()}

    att_res = await db.execute(select(SchoolAttendance).limit(1))
    if att_res.scalar_one_or_none() is None:
        for a in DEFAULT_ATTENDANCE:
            s_id = stu_list.get(a["student_name"], str(uuid.uuid4()))
            db.add(SchoolAttendance(student_id=s_id, **a))
        await db.commit()

    grd_res = await db.execute(select(SchoolGradeRecord).limit(1))
    if grd_res.scalar_one_or_none() is None:
        for g in DEFAULT_GRADES:
            s_id = stu_list.get(g["student_name"], str(uuid.uuid4()))
            db.add(SchoolGradeRecord(student_id=s_id, **g))
        await db.commit()


# ============================================================================
# Students & Admissions
# ============================================================================

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
            "guardian_name": s.guardian_name,
            "has_sibling_discount": s.has_sibling_discount,
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
    final_tuition = data.total_tuition
    if data.has_sibling_discount:
        # 10% sibling discount policy (EDU-09)
        final_tuition = round(data.total_tuition * 0.90, 2)

    student = SchoolStudent(
        code=data.code,
        name=data.name,
        grade=data.grade,
        parent_phone=data.parent_phone,
        guardian_name=data.guardian_name,
        has_sibling_discount=data.has_sibling_discount,
        total_tuition=final_tuition,
        paid_tuition=0.0,
        balance_due=final_tuition,
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

    new_paid = student.paid_tuition + data.amount
    new_balance = max(0.0, student.total_tuition - new_paid)
    student.paid_tuition = new_paid
    student.balance_due = new_balance
    student.status = "settled" if new_balance <= 0 else "active"

    receipt_no = f"REC-{uuid.uuid4().hex[:8].upper()}"
    payment = SchoolPayment(
        student_id=student.id,
        amount=data.amount,
        receipt_no=receipt_no,
        term=data.term,
        notes=data.notes,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return {
        "detail": f"تم تسجيل سداد مبلغ {data.amount:.2f} ج.م للطالب {student.name}",
        "receipt_no": receipt_no,
        "term": data.term,
        "paid_amount": data.amount,
        "new_balance_due": new_balance,
        "total_paid": new_paid,
        "student_name": student.name,
        "student_code": student.code,
        "grade": student.grade,
    }


# ============================================================================
# Attendance & Absence Tracking (EDU-05)
# ============================================================================

@router.get("/attendance")
async def get_attendance_records(
    date: str | None = None,
    grade: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve daily attendance records with rate summary."""
    await _ensure_seeded(db)
    stmt = select(SchoolAttendance)
    if date:
        stmt = stmt.where(SchoolAttendance.date == date)
    if grade:
        stmt = stmt.where(SchoolAttendance.grade == grade)

    res = await db.execute(stmt)
    records = res.scalars().all()

    present_count = sum(1 for r in records if r.status == "present")
    total_count = len(records)
    rate_pct = round((present_count / total_count * 100.0) if total_count > 0 else 100.0, 1)

    return {
        "total_records": total_count,
        "present_count": present_count,
        "absent_count": sum(1 for r in records if r.status == "absent"),
        "late_count": sum(1 for r in records if r.status == "late"),
        "attendance_rate_pct": rate_pct,
        "records": [
            {
                "id": r.id,
                "student_id": r.student_id,
                "student_name": r.student_name,
                "grade": r.grade,
                "date": r.date,
                "status": r.status,
                "notes": r.notes,
                "recorded_by": r.recorded_by,
            }
            for r in records
        ],
    }


@router.post("/attendance")
async def record_attendance(
    data: RecordAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Log student attendance record."""
    record = SchoolAttendance(
        student_id=data.student_id,
        student_name=data.student_name,
        grade=data.grade,
        date=data.date,
        status=data.status,
        notes=data.notes,
        recorded_by=data.recorded_by,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"detail": f"تم تسجيل حالة حضور {record.student_name} بنجاح", "id": record.id}


# ============================================================================
# Exams & Gradebook (EDU-06, EDU-07)
# ============================================================================

@router.get("/grades")
async def get_grade_records(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve exam results and gradebook entries."""
    await _ensure_seeded(db)
    stmt = select(SchoolGradeRecord).order_by(SchoolGradeRecord.subject)
    res = await db.execute(stmt)
    grades = res.scalars().all()

    avg_score = round(sum(g.score for g in grades) / len(grades), 1) if grades else 0.0
    passed_count = sum(1 for g in grades if g.is_passed)

    return {
        "total_grades": len(grades),
        "average_score": avg_score,
        "pass_rate_pct": round((passed_count / len(grades) * 100.0) if grades else 100.0, 1),
        "grades": [
            {
                "id": g.id,
                "student_name": g.student_name,
                "grade": g.grade,
                "term": g.term,
                "subject": g.subject,
                "exam_type": g.exam_type,
                "max_score": g.max_score,
                "score": g.score,
                "letter_grade": g.letter_grade,
                "is_passed": g.is_passed,
                "remarks": g.remarks,
            }
            for g in grades
        ],
    }


@router.post("/grades")
async def record_grade(
    data: RecordGradeRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Add a student exam score to the gradebook."""
    pct = (data.score / data.max_score) * 100.0 if data.max_score > 0 else 0.0
    if pct >= 95:
        letter = "A+"
    elif pct >= 85:
        letter = "A"
    elif pct >= 75:
        letter = "B"
    elif pct >= 65:
        letter = "C"
    elif pct >= 50:
        letter = "D"
    else:
        letter = "F"

    grade_rec = SchoolGradeRecord(
        student_id=data.student_id,
        student_name=data.student_name,
        grade=data.grade,
        term=data.term,
        subject=data.subject,
        exam_type=data.exam_type,
        max_score=data.max_score,
        score=data.score,
        letter_grade=letter,
        is_passed=pct >= 50.0,
        remarks=data.remarks,
    )
    db.add(grade_rec)
    await db.commit()
    await db.refresh(grade_rec)
    return {"detail": f"تم حفظ نتيجة {grade_rec.subject} للطالب {grade_rec.student_name} بنجاح", "id": grade_rec.id}


# ============================================================================
# Summary KPIs
# ============================================================================

@router.get("/summary")
async def get_school_summary(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Executive KPI metrics for school administration."""
    await _ensure_seeded(db)
    students_res = await db.execute(select(SchoolStudent))
    students = students_res.scalars().all()

    att_res = await db.execute(select(SchoolAttendance))
    att_records = att_res.scalars().all()
    present = sum(1 for a in att_records if a.status == "present")
    att_rate = round((present / len(att_records) * 100.0) if att_records else 100.0, 1)

    total_tuition = sum(s.total_tuition for s in students)
    paid_tuition = sum(s.paid_tuition for s in students)
    balance_due = sum(s.balance_due for s in students)

    return {
        "total_students": len(students),
        "total_tuition": total_tuition,
        "paid_tuition": paid_tuition,
        "balance_due": balance_due,
        "collection_rate_pct": round((paid_tuition / total_tuition * 100.0) if total_tuition > 0 else 0.0, 1),
        "attendance_rate_pct": att_rate,
        "current_term": "الفصل الدراسي الأول 2024-2025",
    }
