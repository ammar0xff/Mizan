"""API Router for Healthcare & Clinic/Hospital ERP module (HLT-01..12)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)
from app.modules.clinic.models import (
    ClinicAppointment,
    ClinicEncounter,
    ClinicInpatientBed,
    ClinicLabOrder,
    ClinicPatient,
    ClinicPrescription,
)

router = APIRouter(prefix="/clinic", tags=["Healthcare & Clinic ERP"])


# Pydantic Schemas
class PatientCreate(BaseModel):
    patient_mrn: str
    full_name: str
    national_id: str
    phone: str
    gender: str
    date_of_birth: str
    blood_group: str = "A+"
    allergies: str = "لا توجد حساسيات مسجلة"
    chronic_conditions: str = "لا توجد أمراض مزمنة"
    insurance_provider: str = "نقدي / غير مؤمن"
    insurance_policy_no: str = "N/A"
    copay_percent: float = 0.0


class AppointmentCreate(BaseModel):
    patient_id: str
    patient_name: str
    doctor_name: str
    department: str
    appointment_date: str
    time_slot: str
    consultation_fee: float = 250.0
    chief_complaint: str = ""


class AppointmentStatusUpdate(BaseModel):
    status: str  # scheduled, waiting, in_consultation, completed, cancelled


class EncounterCreate(BaseModel):
    patient_id: str
    patient_name: str
    doctor_name: str
    department: str
    encounter_date: str
    bp_systolic: int = 120
    bp_diastolic: int = 80
    heart_rate: int = 72
    temperature: float = 37.0
    spo2: int = 98
    chief_complaint: str
    icd10_code: str
    icd10_description: str
    clinical_notes: str


class PrescriptionCreate(BaseModel):
    encounter_ref: str = ""
    patient_id: str
    patient_name: str
    doctor_name: str
    issue_date: str
    medication_name: str
    dosage: str
    frequency: str
    duration_days: int = 7
    instructions: str = ""


class LabOrderCreate(BaseModel):
    patient_id: str
    patient_name: str
    doctor_name: str
    test_name: str
    category: str
    specimen_barcode: str
    reference_range: str = "Normal"


class LabResultUpdate(BaseModel):
    result_value: str
    is_signed_off: bool = True


class BedAdmitRequest(BaseModel):
    patient_name: str
    admission_date: str


@router.get("/summary")
async def get_clinic_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Clinic / Hospital operations."""
    q_patients = await db.execute(select(ClinicPatient).where(ClinicPatient.tenant_id == tenant_id))
    patients = q_patients.scalars().all()
    if not patients:
        await _seed_clinic_records(db, tenant_id)
        q_patients = await db.execute(select(ClinicPatient).where(ClinicPatient.tenant_id == tenant_id))
        patients = q_patients.scalars().all()

    q_appts = await db.execute(select(ClinicAppointment).where(ClinicAppointment.tenant_id == tenant_id))
    appts = q_appts.scalars().all()

    q_beds = await db.execute(select(ClinicInpatientBed).where(ClinicInpatientBed.tenant_id == tenant_id))
    beds = q_beds.scalars().all()

    q_labs = await db.execute(select(ClinicLabOrder).where(ClinicLabOrder.tenant_id == tenant_id))
    labs = q_labs.scalars().all()

    total_beds = len(beds)
    occupied_beds = sum(1 for b in beds if b.status == "occupied")
    bed_occupancy_pct = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

    today_appts = len(appts)
    waiting_queue = sum(1 for a in appts if a.status in ("scheduled", "waiting"))
    pending_labs = sum(1 for l in labs if l.status != "reported")

    return {
        "total_registered_patients": len(patients),
        "today_appointments_count": today_appts,
        "waiting_queue_count": waiting_queue,
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "bed_occupancy_percent": bed_occupancy_pct,
        "pending_lab_orders_count": pending_labs,
    }


@router.get("/patients")
async def list_patients(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicPatient).where(ClinicPatient.tenant_id == tenant_id).order_by(ClinicPatient.created_at.desc())
    )
    patients = q.scalars().all()
    if not patients:
        await _seed_clinic_records(db, tenant_id)
        q = await db.execute(
            select(ClinicPatient).where(ClinicPatient.tenant_id == tenant_id).order_by(ClinicPatient.created_at.desc())
        )
        patients = q.scalars().all()
    return patients


@router.post("/patients")
async def create_patient(
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    patient = ClinicPatient(
        tenant_id=tenant_id,
        patient_mrn=payload.patient_mrn,
        full_name=payload.full_name,
        national_id=payload.national_id,
        phone=payload.phone,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        blood_group=payload.blood_group,
        allergies=payload.allergies,
        chronic_conditions=payload.chronic_conditions,
        insurance_provider=payload.insurance_provider,
        insurance_policy_no=payload.insurance_policy_no,
        copay_percent=payload.copay_percent,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/appointments")
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicAppointment).where(ClinicAppointment.tenant_id == tenant_id).order_by(ClinicAppointment.created_at.desc())
    )
    return q.scalars().all()


@router.post("/appointments")
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"APT-{uuid.uuid4().hex[:6].upper()}"
    q_count = await db.execute(
        select(ClinicAppointment).where(
            ClinicAppointment.tenant_id == tenant_id,
            ClinicAppointment.appointment_date == payload.appointment_date,
        )
    )
    existing_count = len(q_count.scalars().all())
    queue_no = existing_count + 1

    appt = ClinicAppointment(
        tenant_id=tenant_id,
        appointment_ref=ref,
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        department=payload.department,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        queue_number=queue_no,
        status="scheduled",
        consultation_fee=payload.consultation_fee,
        chief_complaint=payload.chief_complaint,
    )
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.post("/appointments/{appt_id}/status")
async def update_appointment_status(
    appt_id: str,
    payload: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicAppointment).where(ClinicAppointment.id == appt_id, ClinicAppointment.tenant_id == tenant_id)
    )
    appt = q.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="الموعد الطبي غير موجود")
    appt.status = payload.status
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("/encounters")
async def list_encounters(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicEncounter).where(ClinicEncounter.tenant_id == tenant_id).order_by(ClinicEncounter.created_at.desc())
    )
    return q.scalars().all()


@router.post("/encounters")
async def create_encounter(
    payload: EncounterCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"ENC-{uuid.uuid4().hex[:6].upper()}"
    enc = ClinicEncounter(
        tenant_id=tenant_id,
        encounter_ref=ref,
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        department=payload.department,
        encounter_date=payload.encounter_date,
        bp_systolic=payload.bp_systolic,
        bp_diastolic=payload.bp_diastolic,
        heart_rate=payload.heart_rate,
        temperature=payload.temperature,
        spo2=payload.spo2,
        chief_complaint=payload.chief_complaint,
        icd10_code=payload.icd10_code,
        icd10_description=payload.icd10_description,
        clinical_notes=payload.clinical_notes,
    )
    db.add(enc)
    await db.commit()
    await db.refresh(enc)
    return enc


@router.get("/prescriptions")
async def list_prescriptions(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicPrescription).where(ClinicPrescription.tenant_id == tenant_id).order_by(ClinicPrescription.created_at.desc())
    )
    return q.scalars().all()


@router.post("/prescriptions")
async def create_prescription(
    payload: PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"RX-{uuid.uuid4().hex[:6].upper()}"
    rx = ClinicPrescription(
        tenant_id=tenant_id,
        rx_ref=ref,
        encounter_ref=payload.encounter_ref or f"ENC-{uuid.uuid4().hex[:6].upper()}",
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        issue_date=payload.issue_date,
        medication_name=payload.medication_name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        duration_days=payload.duration_days,
        instructions=payload.instructions,
        status="pending",
    )
    db.add(rx)
    await db.commit()
    await db.refresh(rx)
    return rx


@router.post("/prescriptions/{rx_id}/dispense")
async def dispense_prescription(
    rx_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicPrescription).where(ClinicPrescription.id == rx_id, ClinicPrescription.tenant_id == tenant_id)
    )
    rx = q.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="الروشتة الطبية غير موجودة")
    rx.status = "dispensed"
    await db.commit()
    await db.refresh(rx)
    return rx


@router.get("/lab-orders")
async def list_lab_orders(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicLabOrder).where(ClinicLabOrder.tenant_id == tenant_id).order_by(ClinicLabOrder.created_at.desc())
    )
    return q.scalars().all()


@router.post("/lab-orders")
async def create_lab_order(
    payload: LabOrderCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ref = f"LAB-{uuid.uuid4().hex[:6].upper()}"
    order = ClinicLabOrder(
        tenant_id=tenant_id,
        order_ref=ref,
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        test_name=payload.test_name,
        category=payload.category,
        specimen_barcode=payload.specimen_barcode,
        reference_range=payload.reference_range,
        result_value="قيد التحليل",
        status="ordered",
        is_signed_off=False,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/lab-orders/{order_id}/result")
async def record_lab_result(
    order_id: str,
    payload: LabResultUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicLabOrder).where(ClinicLabOrder.id == order_id, ClinicLabOrder.tenant_id == tenant_id)
    )
    order = q.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="طلب الفحص المخبري غير موجود")
    order.result_value = payload.result_value
    order.status = "reported"
    order.is_signed_off = payload.is_signed_off
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/beds")
async def list_beds(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicInpatientBed).where(ClinicInpatientBed.tenant_id == tenant_id).order_by(ClinicInpatientBed.ward_name, ClinicInpatientBed.bed_code)
    )
    return q.scalars().all()


@router.post("/beds/{bed_id}/admit")
async def admit_bed(
    bed_id: str,
    payload: BedAdmitRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicInpatientBed).where(ClinicInpatientBed.id == bed_id, ClinicInpatientBed.tenant_id == tenant_id)
    )
    bed = q.scalar_one_or_none()
    if not bed:
        raise HTTPException(status_code=404, detail="السرير الطبي غير موجود")
    bed.status = "occupied"
    bed.current_patient_name = payload.patient_name
    bed.admission_date = payload.admission_date
    await db.commit()
    await db.refresh(bed)
    return bed


@router.post("/beds/{bed_id}/discharge")
async def discharge_bed(
    bed_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicInpatientBed).where(ClinicInpatientBed.id == bed_id, ClinicInpatientBed.tenant_id == tenant_id)
    )
    bed = q.scalar_one_or_none()
    if not bed:
        raise HTTPException(status_code=404, detail="السرير الطبي غير موجود")
    bed.status = "cleaning"
    bed.current_patient_name = ""
    bed.admission_date = ""
    await db.commit()
    await db.refresh(bed)
    return bed


@router.post("/beds/{bed_id}/clean")
async def clean_bed(
    bed_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(ClinicInpatientBed).where(ClinicInpatientBed.id == bed_id, ClinicInpatientBed.tenant_id == tenant_id)
    )
    bed = q.scalar_one_or_none()
    if not bed:
        raise HTTPException(status_code=404, detail="السرير الطبي غير موجود")
    bed.status = "available"
    await db.commit()
    await db.refresh(bed)
    return bed


async def _seed_clinic_records(db: AsyncSession, tenant_id: str) -> bool:
    q_patients = await db.execute(select(ClinicPatient).where(ClinicPatient.tenant_id == tenant_id))
    if q_patients.scalars().first():
        return False

    # Seed Patients
    p1 = ClinicPatient(
        tenant_id=tenant_id,
        patient_mrn="MRN-2026-0811",
        full_name="فاطمة الزهراء علي",
        national_id="29408151203488",
        phone="01091234567",
        gender="أنثى",
        date_of_birth="1994-08-15",
        blood_group="O+",
        allergies="حساسية شديدة من البنسلين ومشتقاته (Penicillin)",
        chronic_conditions="داء السكري النوع الثاني (Type 2 DM)",
        insurance_provider="شركة بوبا مصر للتأمين الصحي",
        insurance_policy_no="BUPA-EG-99410",
        copay_percent=10.0,
    )
    p2 = ClinicPatient(
        tenant_id=tenant_id,
        patient_mrn="MRN-2026-0812",
        full_name="طارق عبد الحميد محمود",
        national_id="28512041401922",
        phone="01287654321",
        gender="ذكر",
        date_of_birth="1985-12-04",
        blood_group="A+",
        allergies="لا توجد حساسيات دوائية مسجلة",
        chronic_conditions="ارتفاع ضغط الدم الشرياني (Hypertension)",
        insurance_provider="مصر للتأمين التكافلي",
        insurance_policy_no="MISR-TAK-4412",
        copay_percent=20.0,
    )
    p3 = ClinicPatient(
        tenant_id=tenant_id,
        patient_mrn="MRN-2026-0813",
        full_name="مروان أحمد إبراهيم",
        national_id="30205101602811",
        phone="01155443322",
        gender="ذكر",
        date_of_birth="2002-05-10",
        blood_group="B+",
        allergies="حساسية الأسبرين ومضادات الالتهاب غير الستيرويدية (NSAIDs)",
        chronic_conditions="ربو قصبي مزمن (Bronchial Asthma)",
        insurance_provider="نقدي / غير مؤمن",
        insurance_policy_no="N/A",
        copay_percent=0.0,
    )
    db.add_all([p1, p2, p3])
    await db.flush()

    # Seed Appointments
    a1 = ClinicAppointment(
        tenant_id=tenant_id,
        appointment_ref="APT-2026-101",
        patient_id=p1.id,
        patient_name=p1.full_name,
        doctor_name="د. هشام الشناوي (استشاري الباطنة والسكري)",
        department="الباطنة العامة",
        appointment_date="2026-11-02",
        time_slot="10:00 AM",
        queue_number=1,
        status="waiting",
        consultation_fee=350.0,
        chief_complaint="متابعة دورية لمستوى السكر التراكمي وإجهاد عام",
    )
    a2 = ClinicAppointment(
        tenant_id=tenant_id,
        appointment_ref="APT-2026-102",
        patient_id=p2.id,
        patient_name=p2.full_name,
        doctor_name="د. منى سراج الدين (استشاري القلب والأوعية الدموية)",
        department="أمراض القلب",
        appointment_date="2026-11-02",
        time_slot="10:30 AM",
        queue_number=2,
        status="in_consultation",
        consultation_fee=450.0,
        chief_complaint="نوبات خفقان وارتفاع قراءات ضغط الدم الصباحية",
    )
    a3 = ClinicAppointment(
        tenant_id=tenant_id,
        appointment_ref="APT-2026-103",
        patient_id=p3.id,
        patient_name=p3.full_name,
        doctor_name="د. كريم عبد العزيز (أخصائي الصدر والحساسية)",
        department="الأمراض الصدرية",
        appointment_date="2026-11-02",
        time_slot="11:15 AM",
        queue_number=3,
        status="scheduled",
        consultation_fee=300.0,
        chief_complaint="ضيق تنفس مصاحب للسعال الجاف أثناء النوم",
    )
    db.add_all([a1, a2, a3])

    # Seed Clinical Encounters (EMR)
    enc1 = ClinicEncounter(
        tenant_id=tenant_id,
        encounter_ref="ENC-2026-901",
        patient_id=p1.id,
        patient_name=p1.full_name,
        doctor_name="د. هشام الشناوي",
        department="الباطنة العامة",
        encounter_date="2026-11-01",
        bp_systolic=125,
        bp_diastolic=82,
        heart_rate=76,
        temperature=37.1,
        spo2=98,
        chief_complaint="ارتفاع قراءات السكر الصائم 160 ملغ/دل مع شعور بالعطش المتكرر",
        icd10_code="E11.9",
        icd10_description="Type 2 diabetes mellitus without complications",
        clinical_notes="المريضة منتظمة على دواء ميتفورمين 1000 ملغ. تم تعديل الجرعة وإضافة منظم حديث ومطالبة بتحليل HbA1c بعد شهرين.",
    )
    db.add(enc1)

    # Seed Prescriptions (e-Rx)
    rx1 = ClinicPrescription(
        tenant_id=tenant_id,
        rx_ref="RX-2026-4401",
        encounter_ref=enc1.encounter_ref,
        patient_id=p1.id,
        patient_name=p1.full_name,
        doctor_name="د. هشام الشناوي",
        issue_date="2026-11-01",
        medication_name="سيدوفاج ريتارد 1000 مجم (Metformin XR)",
        dosage="1000mg",
        frequency="قرص واحد مع وجبة العشاء يومياً",
        duration_days=30,
        instructions="يؤخذ مع الأكل لتقليل الاضطرابات المعوية. تم تحذير الصيدلية من حساسية البنسلين.",
        status="dispensed",
    )
    rx2 = ClinicPrescription(
        tenant_id=tenant_id,
        rx_ref="RX-2026-4402",
        encounter_ref="ENC-2026-902",
        patient_id=p2.id,
        patient_name=p2.full_name,
        doctor_name="د. منى سراج الدين",
        issue_date="2026-11-02",
        medication_name="كونكور 5 مجم (Bisoprolol Fumarate)",
        dosage="5mg",
        frequency="قرص واحد صباحاً على الريق",
        duration_days=30,
        instructions="قياس النبض وضغط الدم بانتظام قبل أخذ الجرعة.",
        status="pending",
    )
    db.add_all([rx1, rx2])

    # Seed Diagnostic Lab Orders
    lab1 = ClinicLabOrder(
        tenant_id=tenant_id,
        order_ref="LAB-2026-5501",
        patient_id=p1.id,
        patient_name=p1.full_name,
        doctor_name="د. هشام الشناوي",
        test_name="السكر التراكمي بالدم (HbA1c - Glycated Hemoglobin)",
        category="كيمياء حيوية سريرية",
        specimen_barcode="SPEC-HBA1C-9912",
        reference_range="< 5.7% (طبيعي) / 5.7 - 6.4% (ما قبل السكري)",
        result_value="7.8% (مرتفع - داء السكري غير منضبط)",
        status="reported",
        is_signed_off=True,
    )
    lab2 = ClinicLabOrder(
        tenant_id=tenant_id,
        order_ref="LAB-2026-5502",
        patient_id=p2.id,
        patient_name=p2.full_name,
        doctor_name="د. منى سراج الدين",
        test_name="صورة دهنيات كاملة بالدم (Lipid Profile)",
        category="كيمياء حيوية سريرية",
        specimen_barcode="SPEC-LIPID-8821",
        reference_range="LDL < 100 mg/dL, HDL > 40 mg/dL",
        result_value="قيد الفحص المخبري",
        status="collected",
        is_signed_off=False,
    )
    db.add_all([lab1, lab2])

    # Seed Inpatient Beds & Wards
    b1 = ClinicInpatientBed(
        tenant_id=tenant_id,
        bed_code="BED-ICU-01",
        ward_name="العناية المركزة (ICU)",
        room_number="غرفة 101",
        bed_type="عناية حثيثة متقدمة",
        daily_rate=3500.0,
        status="occupied",
        current_patient_name="محمود صبري حسن (ملاحظة ما بعد القسطرة)",
        admission_date="2026-11-01",
    )
    b2 = ClinicInpatientBed(
        tenant_id=tenant_id,
        bed_code="BED-ICU-02",
        ward_name="العناية المركزة (ICU)",
        room_number="غرفة 102",
        bed_type="عناية حثيثة متقدمة",
        daily_rate=3500.0,
        status="available",
        current_patient_name="",
        admission_date="",
    )
    b3 = ClinicInpatientBed(
        tenant_id=tenant_id,
        bed_code="BED-SURG-201",
        ward_name="جناح الجراحة العامة",
        room_number="غرفة 201",
        bed_type="سرير استشفاء جراحي",
        daily_rate=1400.0,
        status="occupied",
        current_patient_name="طارق عبد الحميد محمود",
        admission_date="2026-11-02",
    )
    b4 = ClinicInpatientBed(
        tenant_id=tenant_id,
        bed_code="BED-SURG-202",
        ward_name="جناح الجراحة العامة",
        room_number="غرفة 202",
        bed_type="سرير استشفاء جراحي",
        daily_rate=1400.0,
        status="cleaning",
        current_patient_name="",
        admission_date="",
    )
    b5 = ClinicInpatientBed(
        tenant_id=tenant_id,
        bed_code="BED-MED-301",
        ward_name="جناح الباطنة والرعاية النهارية",
        room_number="غرفة 301",
        bed_type="سرير إقامة طبية",
        daily_rate=950.0,
        status="available",
        current_patient_name="",
        admission_date="",
    )
    db.add_all([b1, b2, b3, b4, b5])

    await db.commit()
    return True


@router.post("/seed")
async def seed_clinic_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed initial sample clinical, appointment, EMR, and inpatient bed data."""
    seeded = await _seed_clinic_records(db, tenant_id)
    if not seeded:
        return {"message": "بيانات المركز الطبي والعناية السريرية مسجلة مسبقاً"}
    return {"message": "تم تهيئة وتوليد بيانات العيادات والملفات الطبية والأسرة بنجاح"}
