"""Tenant Plan Gating, Quota Enforcement & Trial Lifecycle Service."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.plans import get_plan, get_plan_limits
from app.models.product import Product
from app.models.sale import Sale
from app.models.tenant import Tenant
from app.models.user import User
from app.models.warehouse import Warehouse


async def get_tenant_by_id(db: AsyncSession, tenant_id: uuid.UUID) -> Tenant:
    """Fetch tenant or raise 404."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    tenant = (await db.execute(stmt)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="مساحة العمل غير موجودة")
    return tenant


async def check_tenant_active_and_writable(db: AsyncSession, tenant_id: uuid.UUID) -> Tenant:
    """Verify tenant is not suspended and trial has not expired."""
    tenant = await get_tenant_by_id(db, tenant_id)

    if tenant.status == "suspended":
        raise HTTPException(
            status_code=403,
            detail="تم تعليق مساحة العمل من قبل إدارة المنصة. يرجى مراجعة الدعم الفني.",
        )

    # Check Trial Expiration
    if tenant.plan == "trial" and tenant.trial_ends_at:
        now = datetime.now(UTC)
        trial_end = tenant.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=UTC)

        if now > trial_end:
            raise HTTPException(
                status_code=403,
                detail="انتهت الفترة التجريبية لمساحة العمل — مساحة العمل في وضع القراءة فقط. يرجى الترقية لتفعيل عمليات الإضافة والمبيعات.",
            )

    return tenant


async def check_user_creation_limit(db: AsyncSession, tenant_id: uuid.UUID) -> None:
    """Check if tenant has reached the user limit for their plan."""
    tenant = await check_tenant_active_and_writable(db, tenant_id)
    limits = get_plan_limits(tenant.plan)
    max_users = limits["max_users"]

    stmt = select(func.count(User.id)).where(User.tenant_id == tenant_id, User.is_active == True)
    active_users = (await db.execute(stmt)).scalar() or 0

    if active_users >= max_users:
        raise HTTPException(
            status_code=403,
            detail=f"وصلت إلى الحد الأقصى للمستخدمين المسموح به في باقتك الحالية ({active_users}/{max_users}). يرجى ترقية باقتك لإضافة مستخدمين جدد.",
        )


async def check_branch_creation_limit(db: AsyncSession, tenant_id: uuid.UUID) -> None:
    """Check if tenant has reached the warehouse/branch limit for their plan."""
    tenant = await check_tenant_active_and_writable(db, tenant_id)
    limits = get_plan_limits(tenant.plan)
    max_branches = limits["max_branches"]

    stmt = select(func.count(Warehouse.id)).where(Warehouse.tenant_id == tenant_id, Warehouse.is_active == True)
    branches_count = (await db.execute(stmt)).scalar() or 0

    if branches_count >= max_branches:
        raise HTTPException(
            status_code=403,
            detail=f"وصلت إلى الحد الأقصى لعدد الفروع المسموح به في باقتك ({branches_count}/{max_branches}). يرجى ترقية باقتك لإضافة فرع جديد.",
        )


async def check_sales_volume_limit(db: AsyncSession, tenant_id: uuid.UUID) -> None:
    """Check if tenant has reached monthly sales volume quota."""
    tenant = await check_tenant_active_and_writable(db, tenant_id)
    limits = get_plan_limits(tenant.plan)
    max_sales = limits["max_monthly_sales"]

    now = datetime.now(UTC)
    first_of_month = datetime(now.year, now.month, 1, tzinfo=UTC)

    stmt = select(func.count(Sale.id)).where(Sale.tenant_id == tenant_id, Sale.created_at >= first_of_month)
    sales_this_month = (await db.execute(stmt)).scalar() or 0

    if sales_this_month >= max_sales:
        raise HTTPException(
            status_code=403,
            detail=f"تجاوزت الحد الأقصى للمبيعات الشهرية المسموح بها في باقتك ({sales_this_month}/{max_sales}). يرجى ترقية باقتك للاستمرار في إصدار الفواتير.",
        )


async def get_tenant_limits_and_usage(db: AsyncSession, tenant_id: uuid.UUID) -> Dict[str, Any]:
    """Calculate and return live tenant usage against plan quotas."""
    tenant = await get_tenant_by_id(db, tenant_id)
    plan_info = get_plan(tenant.plan)
    limits = get_plan_limits(tenant.plan)

    now = datetime.now(UTC)
    is_read_only = False
    days_left_in_trial = 0

    if tenant.plan == "trial" and tenant.trial_ends_at:
        trial_end = tenant.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=UTC)
        delta = (trial_end - now).total_seconds() / 86400
        days_left_in_trial = max(0, int(delta))
        if delta <= 0:
            is_read_only = True

    # 1. Users
    users_count = (
        await db.execute(
            select(func.count(User.id)).where(User.tenant_id == tenant_id, User.is_active == True)
        )
    ).scalar() or 0

    # 2. Branches / Warehouses
    branches_count = (
        await db.execute(
            select(func.count(Warehouse.id)).where(Warehouse.tenant_id == tenant_id, Warehouse.is_active == True)
        )
    ).scalar() or 0

    # 3. Monthly Sales
    first_of_month = datetime(now.year, now.month, 1, tzinfo=UTC)
    monthly_sales_count = (
        await db.execute(
            select(func.count(Sale.id)).where(Sale.tenant_id == tenant_id, Sale.created_at >= first_of_month)
        )
    ).scalar() or 0

    # 4. Products Count (indicative of storage)
    products_count = (
        await db.execute(
            select(func.count(Product.id)).where(Product.tenant_id == tenant_id)
        )
    ).scalar() or 0

    return {
        "tenant_id": str(tenant.id),
        "tenant_name": tenant.name,
        "plan": tenant.plan,
        "plan_id": tenant.plan,
        "plan_name": plan_info["name"],
        "plan_price_monthly_egp": plan_info["price_monthly_egp"],
        "status": tenant.status,
        "is_read_only": is_read_only,
        "is_writable": not is_read_only,
        "is_trial": tenant.plan == "trial",
        "trial_ends_at": tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
        "days_left_in_trial": days_left_in_trial,
        "trial_remaining_days": days_left_in_trial,
        "limits": {
            "max_users": limits["max_users"],
            "max_branches": limits["max_branches"],
            "max_monthly_sales": limits["max_monthly_sales"],
            "max_storage_mb": limits["max_storage_mb"],
        },
        "usage": {
            "current_users": users_count,
            "current_branches": branches_count,
            "current_monthly_sales": monthly_sales_count,
            "storage_mb": round(products_count * 0.5 + 50.0, 1),
        },
        "quotas": {
            "users": {
                "used": users_count,
                "max": limits["max_users"],
                "percentage": round(min(100.0, (users_count / limits["max_users"]) * 100), 1) if limits["max_users"] else 0,
            },
            "branches": {
                "used": branches_count,
                "max": limits["max_branches"],
                "percentage": round(min(100.0, (branches_count / limits["max_branches"]) * 100), 1) if limits["max_branches"] else 0,
            },
            "monthly_sales": {
                "used": monthly_sales_count,
                "max": limits["max_monthly_sales"],
                "percentage": round(min(100.0, (monthly_sales_count / limits["max_monthly_sales"]) * 100), 1) if limits["max_monthly_sales"] else 0,
            },
            "storage_mb": {
                "used": round(products_count * 0.5 + 50.0, 1),
                "max": limits["max_storage_mb"],
                "percentage": round(min(100.0, ((products_count * 0.5 + 50.0) / limits["max_storage_mb"]) * 100), 1),
            },
        },
    }
