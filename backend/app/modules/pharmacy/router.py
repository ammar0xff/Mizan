"""FastAPI Router for Pharmacy & Medication Management module."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.pharmacy.models import (
    PharmacyBatch,
    PharmacyControlledLog,
    PharmacyDrug,
    PharmacyPrescription,
)

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy Module"])


class CreateDrugRequest(BaseModel):
    code: str
    trade_name: str
    scientific_name: str
    dosage_form: str = "أقراص"
    strength: str = ""
    barcode: str | None = None
    unit_price: float = 0.0
    is_controlled: bool = False
    requires_prescription: bool = False
    notes: str | None = None


class CreateBatchRequest(BaseModel):
    drug_id: str
    batch_number: str
    expiry_date: str  # YYYY-MM-DD
    quantity: int
    purchase_cost: float
    supplier_name: str | None = None


class DispensePrescriptionRequest(BaseModel):
    patient_name: str
    patient_phone: str | None = None
    doctor_name: str
    doctor_license: str | None = None
    diagnosis: str | None = None
    insurance_company: str | None = None
    copay_percentage: float = 0.0  # 0 to 100
    drug_id: str
    quantity: int
    patient_national_id: str | None = None  # required if drug is controlled


DEFAULT_DRUGS = [
    {
        "code": "DRG-1001",
        "trade_name": "Panadol Extra",
        "scientific_name": "Paracetamol + Caffeine",
        "dosage_form": "أقراص",
        "strength": "500mg/65mg",
        "barcode": "6221001002001",
        "unit_price": 55.0,
        "is_controlled": False,
        "requires_prescription": False,
        "notes": "مسكن للآلام وخافض للحرارة",
    },
    {
        "code": "DRG-1002",
        "trade_name": "Adol Extra",
        "scientific_name": "Paracetamol + Caffeine",
        "dosage_form": "أقراص",
        "strength": "500mg/65mg",
        "barcode": "6221001002002",
        "unit_price": 38.0,
        "is_controlled": False,
        "requires_prescription": False,
        "notes": "بديل محلي مكافئ للبانادول بسعر اقتصادي",
    },
    {
        "code": "DRG-1003",
        "trade_name": "Augmentin 1g",
        "scientific_name": "Amoxicillin + Clavulanic Acid",
        "dosage_form": "أقراص مغلفة",
        "strength": "1000mg",
        "barcode": "6221001002003",
        "unit_price": 135.0,
        "is_controlled": False,
        "requires_prescription": True,
        "notes": "مضاد حيوي واسع المجال",
    },
    {
        "code": "DRG-1004",
        "trade_name": "Curam 1g",
        "scientific_name": "Amoxicillin + Clavulanic Acid",
        "dosage_form": "أقراص",
        "strength": "1000mg",
        "barcode": "6221001002004",
        "unit_price": 105.0,
        "is_controlled": False,
        "requires_prescription": True,
        "notes": "بديل جنيس مكافئ للأوجمنتين",
    },
    {
        "code": "DRG-1005",
        "trade_name": "Concor 5mg",
        "scientific_name": "Bisoprolol Fumarate",
        "dosage_form": "أقراص",
        "strength": "5mg",
        "barcode": "6221001002005",
        "unit_price": 68.0,
        "is_controlled": False,
        "requires_prescription": True,
        "notes": "علاج ضغط الدم المرتفع وتنظيم ضربات القلب",
    },
    {
        "code": "DRG-1006",
        "trade_name": "Lantus SoloStar",
        "scientific_name": "Insulin Glargine",
        "dosage_form": "أقلام حقن مسبقة التعبئة",
        "strength": "100 units/ml",
        "barcode": "6221001002006",
        "unit_price": 750.0,
        "is_controlled": False,
        "requires_prescription": True,
        "notes": "أنسولين ممتد المفعول — يحفظ في الثلاجة (سلسلة تبريد)",
    },
    {
        "code": "DRG-1007",
        "trade_name": "Rivotril 2mg (جدول)",
        "scientific_name": "Clonazepam",
        "dosage_form": "أقراص",
        "strength": "2mg",
        "barcode": "6221001002007",
        "unit_price": 32.5,
        "is_controlled": True,
        "requires_prescription": True,
        "notes": "مادة مراقبة خاضعة لقانون المخدرات — تصرف ببطاقة الرقم القومي وترخيص الطبيب",
    },
]


async def _ensure_seeded(db: AsyncSession) -> None:
    res = await db.execute(select(PharmacyDrug).limit(1))
    if res.scalar_one_or_none() is None:
        created_drugs: list[PharmacyDrug] = []
        for d in DEFAULT_DRUGS:
            drug = PharmacyDrug(**d)
            db.add(drug)
            created_drugs.append(drug)
        await db.flush()

        today = date.today()
        # Seed batches with varying expiry for FEFO testing
        batches = [
            PharmacyBatch(
                drug_id=created_drugs[0].id,
                batch_number="BCH-2024-01",
                expiry_date=(today + timedelta(days=45)).isoformat(),  # near expiry
                quantity_on_hand=120,
                purchase_cost=42.0,
                supplier_name="الشركة المتحدة للتوزيع",
                status="warning",
            ),
            PharmacyBatch(
                drug_id=created_drugs[0].id,
                batch_number="BCH-2024-02",
                expiry_date=(today + timedelta(days=365)).isoformat(),  # long expiry
                quantity_on_hand=300,
                purchase_cost=42.0,
                supplier_name="الشركة المتحدة للتوزيع",
                status="active",
            ),
            PharmacyBatch(
                drug_id=created_drugs[1].id,
                batch_number="ADL-9981",
                expiry_date=(today + timedelta(days=240)).isoformat(),
                quantity_on_hand=250,
                purchase_cost=27.0,
                supplier_name="ابن سينا فارما",
                status="active",
            ),
            PharmacyBatch(
                drug_id=created_drugs[2].id,
                batch_number="AUG-4401",
                expiry_date=(today + timedelta(days=60)).isoformat(),
                quantity_on_hand=80,
                purchase_cost=108.0,
                supplier_name="فارما أوفرسيز",
                status="warning",
            ),
            PharmacyBatch(
                drug_id=created_drugs[6].id,  # Controlled Rivotril
                batch_number="RIV-CTRL-01",
                expiry_date=(today + timedelta(days=180)).isoformat(),
                quantity_on_hand=40,
                purchase_cost=25.0,
                supplier_name="الشركة المصرية للأدوية (رسمي)",
                status="active",
            ),
        ]
        for b in batches:
            db.add(b)

        # Seed sample prescription
        sample_rx = PharmacyPrescription(
            rx_number="RX-2026-0001",
            patient_name="محمود سعيد عبد الرحمن",
            patient_phone="01012345678",
            doctor_name="د. طارق العوضي",
            doctor_license="MED-94812",
            diagnosis="ارتفاع ضغط دم مزمن والتهاب بكتيري",
            insurance_company="بوبا للتأمين الطبي (Bupa)",
            copay_percentage=20.0,
            total_amount=203.0,
            patient_paid=40.6,
            insurance_covered=162.4,
            status="dispensed",
        )
        db.add(sample_rx)

        # Seed controlled log
        ctrl_log = PharmacyControlledLog(
            drug_id=created_drugs[6].id,
            batch_number="RIV-CTRL-01",
            patient_name="أحمد عادل فهمي",
            patient_national_id="29408151203491",
            prescriber_doctor="د. شريف عبد المنعم (استشاري مخ وأعصاب)",
            doctor_license="DOC-38291",
            quantity=1,
            transaction_type="dispense",
            notes="صرف وفق تذكرة طبية معتمدة ورقم قومي مسجل",
        )
        db.add(ctrl_log)

        await db.commit()


@router.get("/summary")
async def get_pharmacy_summary(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve operational KPIs for pharmacy dashboard."""
    await _ensure_seeded(db)

    total_drugs = await db.scalar(select(func.count(PharmacyDrug.id))) or 0
    total_batches = await db.scalar(select(func.count(PharmacyBatch.id))) or 0
    near_expiry = await db.scalar(select(func.count(PharmacyBatch.id)).where(PharmacyBatch.status == "warning")) or 0
    total_rx = await db.scalar(select(func.count(PharmacyPrescription.id))) or 0
    controlled_entries = await db.scalar(select(func.count(PharmacyControlledLog.id))) or 0

    return {
        "total_drugs": total_drugs,
        "total_batches": total_batches,
        "near_expiry_count": near_expiry,
        "total_prescriptions": total_rx,
        "controlled_entries": controlled_entries,
    }


@router.get("/drugs")
async def list_drugs(
    q: str | None = Query(None, description="Search by trade or scientific name"),
    controlled_only: bool = False,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """List drugs with stock sums and generic alternatives count."""
    await _ensure_seeded(db)

    stmt = select(PharmacyDrug)
    if controlled_only:
        stmt = stmt.where(PharmacyDrug.is_controlled.is_(True))
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            (PharmacyDrug.trade_name.ilike(term))
            | (PharmacyDrug.scientific_name.ilike(term))
            | (PharmacyDrug.code.ilike(term))
            | (PharmacyDrug.barcode.ilike(term))
        )
    stmt = stmt.order_by(PharmacyDrug.trade_name.asc())
    res = await db.execute(stmt)
    drugs = res.scalars().all()

    items = []
    for d in drugs:
        # Sum current stock across active batches
        stock_sum = (
            await db.scalar(
                select(func.coalesce(func.sum(PharmacyBatch.quantity_on_hand), 0)).where(
                    PharmacyBatch.drug_id == d.id
                )
            )
            or 0
        )

        # Count generic alternatives sharing the exact same scientific name
        alt_count = (
            await db.scalar(
                select(func.count(PharmacyDrug.id)).where(
                    PharmacyDrug.scientific_name == d.scientific_name,
                    PharmacyDrug.id != d.id,
                )
            )
            or 0
        )

        items.append(
            {
                "id": d.id,
                "code": d.code,
                "trade_name": d.trade_name,
                "scientific_name": d.scientific_name,
                "dosage_form": d.dosage_form,
                "strength": d.strength,
                "barcode": d.barcode,
                "unit_price": d.unit_price,
                "is_controlled": d.is_controlled,
                "requires_prescription": d.requires_prescription,
                "notes": d.notes,
                "total_stock": stock_sum,
                "alternatives_count": alt_count,
            }
        )

    return items


@router.post("/drugs")
async def create_drug(
    payload: CreateDrugRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Create a new pharmaceutical drug profile."""
    existing = await db.scalar(select(PharmacyDrug).where(PharmacyDrug.code == payload.code))
    if existing:
        raise HTTPException(status_code=409, detail="كود الدواء مسجل بالفعل")

    drug = PharmacyDrug(
        code=payload.code,
        trade_name=payload.trade_name,
        scientific_name=payload.scientific_name,
        dosage_form=payload.dosage_form,
        strength=payload.strength,
        barcode=payload.barcode,
        unit_price=payload.unit_price,
        is_controlled=payload.is_controlled,
        requires_prescription=payload.requires_prescription,
        notes=payload.notes,
    )
    db.add(drug)
    await db.commit()
    await db.refresh(drug)
    return {"ok": True, "id": drug.id, "message": "تم إضافة الدواء بنجاح"}


@router.get("/drugs/{drug_id}/alternatives")
async def get_generic_alternatives(
    drug_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Find generic substitute drugs sharing the exact active ingredient."""
    drug = await db.get(PharmacyDrug, drug_id)
    if not drug:
        raise HTTPException(status_code=404, detail="الدواء غير موجود")

    stmt = (
        select(PharmacyDrug)
        .where(
            PharmacyDrug.scientific_name == drug.scientific_name,
            PharmacyDrug.id != drug.id,
        )
        .order_by(PharmacyDrug.unit_price.asc())
    )
    res = await db.execute(stmt)
    alts = res.scalars().all()

    result = []
    for a in alts:
        stock = (
            await db.scalar(
                select(func.coalesce(func.sum(PharmacyBatch.quantity_on_hand), 0)).where(
                    PharmacyBatch.drug_id == a.id
                )
            )
            or 0
        )
        price_diff = a.unit_price - drug.unit_price
        result.append(
            {
                "id": a.id,
                "code": a.code,
                "trade_name": a.trade_name,
                "scientific_name": a.scientific_name,
                "dosage_form": a.dosage_form,
                "strength": a.strength,
                "unit_price": a.unit_price,
                "price_diff": price_diff,
                "price_diff_percent": round((price_diff / drug.unit_price) * 100, 1) if drug.unit_price > 0 else 0,
                "total_stock": stock,
                "in_stock": stock > 0,
            }
        )

    return {
        "original_drug": {
            "id": drug.id,
            "trade_name": drug.trade_name,
            "scientific_name": drug.scientific_name,
            "unit_price": drug.unit_price,
        },
        "alternatives": result,
    }


@router.get("/batches")
async def list_batches(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """List inventory batches sorted by FEFO (First Expired, First Out)."""
    await _ensure_seeded(db)

    stmt = select(PharmacyBatch, PharmacyDrug).join(PharmacyDrug, PharmacyBatch.drug_id == PharmacyDrug.id)
    if status:
        stmt = stmt.where(PharmacyBatch.status == status)
    stmt = stmt.order_by(PharmacyBatch.expiry_date.asc())  # FEFO priority

    res = await db.execute(stmt)
    rows = res.all()

    today_str = date.today().isoformat()
    ninety_days_str = (date.today() + timedelta(days=90)).isoformat()

    items = []
    for batch, drug in rows:
        # Determine dynamic expiry status
        if batch.expiry_date < today_str:
            computed_status = "expired"
        elif batch.expiry_date <= ninety_days_str:
            computed_status = "warning"
        else:
            computed_status = "active"

        try:
            exp_d = date.fromisoformat(batch.expiry_date)
            days_left = (exp_d - date.today()).days
        except Exception:
            days_left = 0

        items.append(
            {
                "id": batch.id,
                "drug_id": drug.id,
                "drug_trade_name": drug.trade_name,
                "drug_scientific_name": drug.scientific_name,
                "trade_name": drug.trade_name,
                "scientific_name": drug.scientific_name,
                "dosage_form": drug.dosage_form,
                "batch_number": batch.batch_number,
                "expiry_date": batch.expiry_date,
                "days_to_expiry": days_left,
                "quantity_on_hand": batch.quantity_on_hand,
                "purchase_cost": batch.purchase_cost,
                "unit_price": drug.unit_price,
                "supplier_name": batch.supplier_name,
                "status": computed_status,
            }
        )

    return items


@router.post("/batches")
async def create_batch(
    payload: CreateBatchRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Register incoming pharmaceutical batch."""
    drug = await db.get(PharmacyDrug, payload.drug_id)
    if not drug:
        raise HTTPException(status_code=404, detail="الدواء المحدد غير موجود")

    today_str = date.today().isoformat()
    ninety_days_str = (date.today() + timedelta(days=90)).isoformat()

    if payload.expiry_date < today_str:
        status = "expired"
    elif payload.expiry_date <= ninety_days_str:
        status = "warning"
    else:
        status = "active"

    batch = PharmacyBatch(
        drug_id=payload.drug_id,
        batch_number=payload.batch_number,
        expiry_date=payload.expiry_date,
        quantity_on_hand=payload.quantity,
        purchase_cost=payload.purchase_cost,
        supplier_name=payload.supplier_name,
        status=status,
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return {"ok": True, "id": batch.id, "message": "تم تسجيل التشغيلة بنجاح بنظام FEFO"}


@router.get("/prescriptions")
async def list_prescriptions(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """List dispensed and pending prescriptions."""
    await _ensure_seeded(db)
    stmt = select(PharmacyPrescription).order_by(PharmacyPrescription.dispensed_at.desc())
    res = await db.execute(stmt)
    prescriptions = res.scalars().all()
    return prescriptions


@router.post("/prescriptions")
async def dispense_prescription(
    payload: DispensePrescriptionRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Dispense medication against a prescription with co-pay calculation and batch deduction."""
    drug = await db.get(PharmacyDrug, payload.drug_id)
    if not drug:
        raise HTTPException(status_code=404, detail="الدواء غير موجود")

    # If controlled, require patient national ID
    if drug.is_controlled and not payload.patient_national_id:
        raise HTTPException(
            status_code=422,
            detail="الدواء مصنف مادة مراقبة (جدول مخدرات) ويشترط تسجيل الرقم القومي للمريض",
        )

    # Pick earliest non-expired batch via FEFO
    today_str = date.today().isoformat()
    stmt = (
        select(PharmacyBatch)
        .where(
            PharmacyBatch.drug_id == drug.id,
            PharmacyBatch.quantity_on_hand >= payload.quantity,
            PharmacyBatch.expiry_date >= today_str,
        )
        .order_by(PharmacyBatch.expiry_date.asc())
        .limit(1)
    )
    batch = (await db.execute(stmt)).scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=400,
            detail="لا يوجد رصيد تشغيلة صالح وغير منتهي يكفي الكمية المطلوبة بنظام FEFO",
        )

    # Decrement batch inventory
    batch.quantity_on_hand -= payload.quantity

    # Calculate financial settlement and co-pay
    total_price = round(drug.unit_price * payload.quantity, 2)
    copay_pct = max(0.0, min(100.0, payload.copay_percentage))
    patient_share = round(total_price * (copay_pct / 100.0), 2) if payload.insurance_company else total_price
    insurance_share = round(total_price - patient_share, 2)

    rx_number = f"RX-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    prescription = PharmacyPrescription(
        rx_number=rx_number,
        patient_name=payload.patient_name,
        patient_phone=payload.patient_phone,
        doctor_name=payload.doctor_name,
        doctor_license=payload.doctor_license,
        diagnosis=payload.diagnosis,
        insurance_company=payload.insurance_company,
        copay_percentage=copay_pct,
        total_amount=total_price,
        patient_paid=patient_share,
        insurance_covered=insurance_share,
        status="dispensed",
    )
    db.add(prescription)

    # Log in controlled drugs register if applicable
    if drug.is_controlled:
        ctrl_log = PharmacyControlledLog(
            drug_id=drug.id,
            batch_number=batch.batch_number,
            patient_name=payload.patient_name,
            patient_national_id=payload.patient_national_id or "—",
            prescriber_doctor=payload.doctor_name,
            doctor_license=payload.doctor_license,
            quantity=payload.quantity,
            transaction_type="dispense",
            notes=f"روشتة رقم {rx_number} — تشخيص: {payload.diagnosis or 'عادي'}",
        )
        db.add(ctrl_log)

    await db.commit()

    return {
        "ok": True,
        "rx_number": rx_number,
        "dispensed_batch": batch.batch_number,
        "allocated_batches": [{"batch_number": batch.batch_number, "quantity": payload.quantity}],
        "total_amount": total_price,
        "patient_paid": patient_share,
        "insurance_covered": insurance_share,
        "message": "تم صرف الروشتة وخصم الرصيد بنظام FEFO بنجاح",
    }


@router.get("/controlled")
@router.get("/controlled-log")
async def get_controlled_register(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve official controlled substances and narcotics inspection ledger."""
    await _ensure_seeded(db)

    stmt = (
        select(PharmacyControlledLog, PharmacyDrug)
        .join(PharmacyDrug, PharmacyControlledLog.drug_id == PharmacyDrug.id)
        .order_by(PharmacyControlledLog.logged_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    items = []
    for log, drug in rows:
        items.append(
            {
                "id": log.id,
                "drug_code": drug.code,
                "drug_trade_name": drug.trade_name,
                "trade_name": drug.trade_name,
                "scientific_name": drug.scientific_name,
                "batch_number": log.batch_number,
                "patient_name": log.patient_name,
                "patient_national_id": log.patient_national_id,
                "prescriber_doctor": log.prescriber_doctor,
                "doctor_license": log.doctor_license,
                "quantity": log.quantity,
                "transaction_type": log.transaction_type,
                "notes": log.notes,
                "timestamp": log.logged_at.isoformat(),
                "logged_at": log.logged_at.isoformat(),
            }
        )

    return items
