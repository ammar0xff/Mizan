"""API Router for Creative, Media & Translation Agency module (AGE-01..10)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)
from app.modules.agency.models import (
    AgencyCapacityMember,
    AgencyProject,
    AgencyRetainer,
    AgencyTranslationOrder,
)

router = APIRouter(prefix="/agency", tags=["Creative & Translation Agency ERP"])


# Schemas
class ProjectCreate(BaseModel):
    project_code: str
    client_name: str
    project_title: str
    service_category: str
    contract_value: float
    deadline: str
    total_milestones: int = 4
    brief_notes: str = ""


class CapacityMemberCreate(BaseModel):
    member_name: str
    role_title: str
    weekly_capacity_hours: float = 40.0
    booked_hours: float = 32.0


class RetainerCreate(BaseModel):
    client_name: str
    retainer_tier: str
    contracted_hours: float = 80.0
    overage_hourly_rate: float = 850.0
    renewal_date: str


class RetainerBurnHoursRequest(BaseModel):
    hours: float


class TranslationCreate(BaseModel):
    doc_title: str
    client_name: str
    source_language: str = "الإنجليزية"
    target_language: str = "العربية"
    total_words: int
    repeated_words_discount: int = 0
    rate_per_word: float = 0.65


@router.get("/summary")
async def get_agency_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Overview KPIs for Creative & Translation Agency operations."""
    q_proj = await db.execute(select(AgencyProject).where(AgencyProject.tenant_id == tenant_id))
    projects = q_proj.scalars().all()

    q_cap = await db.execute(select(AgencyCapacityMember).where(AgencyCapacityMember.tenant_id == tenant_id))
    members = q_cap.scalars().all()

    q_ret = await db.execute(select(AgencyRetainer).where(AgencyRetainer.tenant_id == tenant_id))
    retainers = q_ret.scalars().all()

    q_trans = await db.execute(select(AgencyTranslationOrder).where(AgencyTranslationOrder.tenant_id == tenant_id))
    translations = q_trans.scalars().all()

    active_projects = sum(1 for p in projects if p.status != "closed")
    pipeline_val = sum(p.contract_value for p in projects if p.status != "closed")

    tot_cap = sum(m.weekly_capacity_hours for m in members)
    tot_booked = sum(m.booked_hours for m in members)
    avg_util = round((tot_booked / tot_cap * 100), 1) if tot_cap > 0 else 0.0

    creep_alerts = sum(1 for r in retainers if r.scope_creep_alert)

    return {
        "active_projects_count": active_projects,
        "total_projects_count": len(projects),
        "pipeline_contract_value": pipeline_val,
        "team_members_count": len(members),
        "team_utilization_percent": avg_util,
        "scope_creep_alerts_count": creep_alerts,
        "translation_orders_count": len(translations),
    }


@router.get("/projects")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyProject).where(AgencyProject.tenant_id == tenant_id).order_by(AgencyProject.created_at.desc())
    )
    return q.scalars().all()


@router.post("/projects")
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    p = AgencyProject(
        tenant_id=tenant_id,
        project_code=payload.project_code,
        client_name=payload.client_name,
        project_title=payload.project_title,
        service_category=payload.service_category,
        contract_value=payload.contract_value,
        deadline=payload.deadline,
        total_milestones=payload.total_milestones,
        completed_milestones=0,
        status="in_production",
        brief_notes=payload.brief_notes,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/projects/{project_id}/milestone")
async def advance_project_milestone(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyProject).where(AgencyProject.id == project_id, AgencyProject.tenant_id == tenant_id)
    )
    p = q.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    if p.completed_milestones < p.total_milestones:
        p.completed_milestones += 1
    if p.completed_milestones == p.total_milestones:
        p.status = "delivered"
    await db.commit()
    await db.refresh(p)
    return p


@router.get("/capacity")
async def list_capacity(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyCapacityMember).where(AgencyCapacityMember.tenant_id == tenant_id).order_by(AgencyCapacityMember.utilization_percent.desc())
    )
    return q.scalars().all()


@router.post("/capacity")
async def create_capacity_member(
    payload: CapacityMemberCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    util = round((payload.booked_hours / payload.weekly_capacity_hours * 100), 1) if payload.weekly_capacity_hours > 0 else 0.0
    status = "overloaded" if util > 95.0 else ("optimal" if util >= 70.0 else "available")
    m = AgencyCapacityMember(
        tenant_id=tenant_id,
        member_name=payload.member_name,
        role_title=payload.role_title,
        weekly_capacity_hours=payload.weekly_capacity_hours,
        booked_hours=payload.booked_hours,
        utilization_percent=util,
        status=status,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/retainers")
async def list_retainers(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyRetainer).where(AgencyRetainer.tenant_id == tenant_id).order_by(AgencyRetainer.created_at.desc())
    )
    return q.scalars().all()


@router.post("/retainers")
async def create_retainer(
    payload: RetainerCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    r = AgencyRetainer(
        tenant_id=tenant_id,
        client_name=payload.client_name,
        retainer_tier=payload.retainer_tier,
        contracted_hours=payload.contracted_hours,
        burned_hours=0.0,
        utilization_percent=0.0,
        scope_creep_alert=False,
        overage_hourly_rate=payload.overage_hourly_rate,
        renewal_date=payload.renewal_date,
    )
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return r


@router.post("/retainers/{retainer_id}/burn-hours")
async def burn_retainer_hours(
    retainer_id: str,
    payload: RetainerBurnHoursRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyRetainer).where(AgencyRetainer.id == retainer_id, AgencyRetainer.tenant_id == tenant_id)
    )
    r = q.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="عقد الساعات غير موجود")
    r.burned_hours += payload.hours
    util = round((r.burned_hours / r.contracted_hours * 100), 1) if r.contracted_hours > 0 else 0.0
    r.utilization_percent = util
    r.scope_creep_alert = util >= 80.0
    await db.commit()
    await db.refresh(r)
    return r


@router.get("/translations")
async def list_translations(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyTranslationOrder).where(AgencyTranslationOrder.tenant_id == tenant_id).order_by(AgencyTranslationOrder.created_at.desc())
    )
    return q.scalars().all()


@router.post("/translations")
async def create_translation(
    payload: TranslationCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    billable = max(0, payload.total_words - payload.repeated_words_discount)
    total = round(billable * payload.rate_per_word, 2)
    t = AgencyTranslationOrder(
        tenant_id=tenant_id,
        doc_title=payload.doc_title,
        client_name=payload.client_name,
        source_language=payload.source_language,
        target_language=payload.target_language,
        total_words=payload.total_words,
        repeated_words_discount=payload.repeated_words_discount,
        net_billable_words=billable,
        rate_per_word=payload.rate_per_word,
        total_amount=total,
        status="translating",
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.post("/translations/{trans_id}/status")
async def update_translation_status(
    trans_id: str,
    status: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(AgencyTranslationOrder).where(AgencyTranslationOrder.id == trans_id, AgencyTranslationOrder.tenant_id == tenant_id)
    )
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="طلب الترجمة غير موجود")
    t.status = status
    await db.commit()
    await db.refresh(t)
    return t


@router.post("/seed")
async def seed_agency_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed sample agency projects, capacity board, retainers, and translation orders."""
    q_proj = await db.execute(select(AgencyProject).where(AgencyProject.tenant_id == tenant_id))
    if q_proj.scalars().first():
        return {"message": "بيانات الوكالة الإبداعية والمشاريع مسجلة مسبقاً"}

    # Seed Creative Projects
    p1 = AgencyProject(
        tenant_id=tenant_id,
        project_code="PRJ-BRD-8801",
        client_name="مجموعة العاصمة للإنشاءات والاستثمار",
        project_title="تطوير الهوية البصرية المتكاملة ودليل العلامة التجارية (Brand Guidelines)",
        service_category="هوية بصرية وإرشادات براند",
        contract_value=185000.0,
        deadline="2026-11-30",
        total_milestones=4,
        completed_milestones=2,
        status="in_production",
        brief_notes="المرحلة 1: البحث والتموضع (تمت) - المرحلة 2: خيارات الشعار وخطوط الطباعة (تمت) - المرحلة 3: تطبيقات المطبوعات والواجهات - المرحلة 4: كتيب العلامة النهائي.",
    )
    p2 = AgencyProject(
        tenant_id=tenant_id,
        project_code="PRJ-VID-8802",
        client_name="منصة سويفت للمدفوعات الرقمية (FinTech)",
        project_title="سلسلة إعلانات موشن جرافيك وفيديو تسويقي ثلاثي الأبعاد 3D",
        service_category="إنتاج فيديو وموشن جرافيك",
        contract_value=240000.0,
        deadline="2026-11-20",
        total_milestones=5,
        completed_milestones=4,
        status="client_review",
        brief_notes="تم الانتهاء من الرندر ثلاثي الأبعاد وتسجيل التعليق الصوتي. بانتظار الاعتماد الختامي من العميل للنشر عبر قنوات السوشيال ميديا.",
    )
    db.add_all([p1, p2])
    await db.flush()

    # Seed Capacity Heatmap Board
    c1 = AgencyCapacityMember(
        tenant_id=tenant_id,
        member_name="أحمد سراج (Creative Director)",
        role_title="المدير الإبداعي والتوجيه الفني",
        weekly_capacity_hours=40.0,
        booked_hours=36.0,
        utilization_percent=90.0,
        status="optimal",
    )
    c2 = AgencyCapacityMember(
        tenant_id=tenant_id,
        member_name="مريم بهجت (3D & Motion Lead)",
        role_title="قائدة فريق الرسوم المتحركة والـ 3D",
        weekly_capacity_hours=40.0,
        booked_hours=42.5,
        utilization_percent=106.3,
        status="overloaded",
    )
    c3 = AgencyCapacityMember(
        tenant_id=tenant_id,
        member_name="كريم الشناوي (Senior Copywriter)",
        role_title="مؤلف نصوص إعلانية ومحتوى إبداعي",
        weekly_capacity_hours=40.0,
        booked_hours=24.0,
        utilization_percent=60.0,
        status="available",
    )
    c4 = AgencyCapacityMember(
        tenant_id=tenant_id,
        member_name="د. فؤاد النحاس (Legal Translator)",
        role_title="مترجم قانوني معتمد وعضو جمعية المترجمين",
        weekly_capacity_hours=40.0,
        booked_hours=34.0,
        utilization_percent=85.0,
        status="optimal",
    )
    db.add_all([c1, c2, c3, c4])

    # Seed Retainer Hour Trackers
    r1 = AgencyRetainer(
        tenant_id=tenant_id,
        client_name="سلسلة مطاعم رويال برجر",
        retainer_tier="باقة السوشيال ميديا والتصميم (60 ساعة شهرياً)",
        contracted_hours=60.0,
        burned_hours=54.5,
        utilization_percent=90.8,
        scope_creep_alert=True,
        overage_hourly_rate=750.0,
        renewal_date="2026-11-30",
    )
    r2 = AgencyRetainer(
        tenant_id=tenant_id,
        client_name="شركة النماء للمنتجات الاستهلاكية",
        retainer_tier="باقة الاستشارات الإعلامية والحملات (100 ساعة شهرياً)",
        contracted_hours=100.0,
        burned_hours=48.0,
        utilization_percent=48.0,
        scope_creep_alert=False,
        overage_hourly_rate=900.0,
        renewal_date="2026-11-30",
    )
    db.add_all([r1, r2])

    # Seed Translation Orders
    t1 = AgencyTranslationOrder(
        tenant_id=tenant_id,
        doc_title="عقد اندماج واستحواذ شركات استثمارية وقوائم التدقيق (M&A Agreement)",
        client_name="مكتب الشرق الأوسط للاستشارات المالية",
        source_language="الإنجليزية",
        target_language="العربية",
        total_words=18500,
        repeated_words_discount=3200,
        net_billable_words=15300,
        rate_per_word=0.75,
        total_amount=11475.0,
        status="proofreading",
    )
    t2 = AgencyTranslationOrder(
        tenant_id=tenant_id,
        doc_title="دليل المستخدم والمواصفات الفنية لمحطة معالجة مياه صناعية",
        client_name="الهندسية لمعالجة البيئة والتكنولوجيا",
        source_language="الألمانية",
        target_language="العربية",
        total_words=8400,
        repeated_words_discount=1100,
        net_billable_words=7300,
        rate_per_word=0.90,
        total_amount=6570.0,
        status="translating",
    )
    db.add_all([t1, t2])

    await db.commit()
    return {"message": "تم تهيئة وتوليد بيانات الوكالة الإبداعية وسعات الفريق وعقود الساعات بنجاح"}
