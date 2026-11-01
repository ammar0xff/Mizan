"""Admoon Superadmin Control Plane.

Dedicated backend surface for the SaaS platform owner (Admoon) to manage all
client companies (tenants), their ERP modules, routing slugs, custom tech stack
architectures (PostgreSQL/Neon, Firebase, Dedicated SQL, Desktop Standalone .exe,
custom storage and runtimes), and perform one-click impersonation.
"""
from __future__ import annotations

import base64
import hashlib
import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.core.tenancy import bind_tenant
from app.db.base import get_db
from app.dependencies import get_current_user, require_superadmin
from app.models.product import Product
from app.models.sale import Sale
from app.models.tenant import Tenant
from app.models.user import User
from app.models.warehouse import Warehouse
from app.services import auth_service
from app.services.demo_seed import seed_demo

router = APIRouter(prefix="/admoon", tags=["admoon"])


# -------------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------------
class TechStackConfig(BaseModel):
    deployment_mode: str = Field(
        default="cloud_saas",
        description="cloud_saas | firebase_cloud | dedicated_sql | desktop_standalone | hybrid_sync",
    )
    db_engine: str = Field(
        default="postgres_neon",
        description="postgres_neon | postgres_shared | postgres_dedicated | mysql | sqlite_local | firestore",
    )
    db_connection_uri: str | None = Field(default=None, description="Connection string or cloud database endpoint")
    storage_driver: str = Field(
        default="local",
        description="local | s3_minio | firebase_storage | gcs | azure_blob",
    )
    storage_bucket: str | None = Field(default=None)
    backend_engine: str = Field(
        default="fastapi_cloud",
        description="fastapi_cloud | firebase_serverless | desktop_embedded | custom_host",
    )
    backend_host: str | None = Field(default=None)
    offline_sync_enabled: bool = False
    custom_env: dict[str, Any] = Field(default_factory=dict)


class ProvisionTenantRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=128)
    slug: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9_-]+$")
    custom_domain: str | None = Field(default=None, max_length=128)
    business_type: str = Field(default="retail")
    sector: str = Field(default="retail")
    scale: str = Field(default="medium")
    palette: str = Field(default="cobalt")
    plan: str = Field(default="pro")
    deployment_mode: str = Field(default="cloud_saas")
    tech_stack: TechStackConfig = Field(default_factory=TechStackConfig)
    active_modules: list[str] = Field(default_factory=lambda: ["pos", "inventory"])
    owner_username: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    owner_password: str = Field(min_length=6, max_length=128)
    owner_full_name: str = Field(min_length=2, max_length=128)
    trial_days: int = 30


class UpdateTenantRequest(BaseModel):
    name: str | None = None
    slug: str | None = None
    custom_domain: str | None = None
    status: str | None = None  # active, trial, suspended, archived, offline_licensed
    plan: str | None = None
    business_type: str | None = None
    trial_ends_at: datetime | None = None
    palette_name: str | None = None
    limits: dict[str, Any] | None = None


class UpdateModulesRequest(BaseModel):
    active_modules: list[str]


# -------------------------------------------------------------------------
# Public Tenant Slug Resolver (For subdomains or /monset-gym routing)
# -------------------------------------------------------------------------
@router.get("/resolve-slug/{slug_or_domain}")
async def resolve_tenant_slug(slug_or_domain: str, db: AsyncSession = Depends(get_db)):
    """Resolves a tenant by slug (e.g. 'monset-gym') or custom domain (e.g. 'erp.monset-gym.com').
    Returns basic company routing profile, active modules, and palette for client app bootstrap.
    """
    clean_identifier = slug_or_domain.strip().lower()
    stmt = select(Tenant).where(
        (func.lower(Tenant.slug) == clean_identifier)
        | (func.lower(Tenant.custom_domain) == clean_identifier)
        | (func.lower(Tenant.storefront_slug) == clean_identifier)
    )
    tenant = (await db.execute(stmt)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المنشأة ذات المعرف '{slug_or_domain}' غير موجودة في ميزان",
        )

    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "custom_domain": tenant.custom_domain,
        "business_type": tenant.business_type,
        "sector": tenant.sector,
        "status": tenant.status,
        "plan": tenant.plan,
        "palette": tenant.palette,
        "deployment_mode": tenant.deployment_mode,
        "active_modules": tenant.active_modules or ["pos", "inventory"],
        "limits": tenant.limits,
    }


# -------------------------------------------------------------------------
# Platform Overview KPIs
# -------------------------------------------------------------------------
@router.get("/overview")
async def get_admoon_overview(
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Aggregate KPIs across all client companies, tech stack footprints, and business sectors."""
    total_tenants = (await db.execute(select(func.count(Tenant.id)))).scalar() or 0
    active_tenants = (
        await db.execute(select(func.count(Tenant.id)).where(Tenant.status == "active"))
    ).scalar() or 0
    trial_tenants = (
        await db.execute(select(func.count(Tenant.id)).where(Tenant.status == "trial"))
    ).scalar() or 0
    suspended_tenants = (
        await db.execute(select(func.count(Tenant.id)).where(Tenant.status == "suspended"))
    ).scalar() or 0

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_sales = (await db.execute(select(func.count(Sale.id)))).scalar() or 0
    total_sales_volume = (await db.execute(select(func.coalesce(func.sum(Sale.net_total), 0)))).scalar() or 0
    total_products = (await db.execute(select(func.count(Product.id)))).scalar() or 0

    # Deployment mode breakdown
    modes_res = (
        await db.execute(select(Tenant.deployment_mode, func.count(Tenant.id)).group_by(Tenant.deployment_mode))
    ).all()
    deployment_modes = {mode or "cloud_saas": count for mode, count in modes_res}

    # Business sector breakdown
    sectors_res = (
        await db.execute(select(Tenant.business_type, func.count(Tenant.id)).group_by(Tenant.business_type))
    ).all()
    business_types = {btype or "retail": count for btype, count in sectors_res}

    # Plans breakdown
    plans_res = (await db.execute(select(Tenant.plan, func.count(Tenant.id)).group_by(Tenant.plan))).all()
    plans = {plan or "trial": count for plan, count in plans_res}

    return {
        "kpis": {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "trial_tenants": trial_tenants,
            "suspended_tenants": suspended_tenants,
            "total_users": total_users,
            "total_sales": total_sales,
            "total_sales_volume_egp": float(total_sales_volume),
            "total_products": total_products,
        },
        "breakdowns": {
            "deployment_modes": deployment_modes,
            "business_types": business_types,
            "plans": plans,
        },
    }


# -------------------------------------------------------------------------
# Tenants List & Search
# -------------------------------------------------------------------------
@router.get("/tenants")
async def list_tenants(
    search: str | None = Query(None, description="Search by name, slug, or custom domain"),
    status: str | None = Query(None),
    deployment_mode: str | None = Query(None),
    business_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """List all tenant ERPs with rich management metadata and live telemetry counters."""
    stmt = select(Tenant).order_by(Tenant.created_at.desc())

    if status:
        stmt = stmt.where(Tenant.status == status)
    if deployment_mode:
        stmt = stmt.where(Tenant.deployment_mode == deployment_mode)
    if business_type:
        stmt = stmt.where(Tenant.business_type == business_type)
    if search:
        s = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Tenant.name).like(s)
            | func.lower(func.coalesce(Tenant.slug, "")).like(s)
            | func.lower(func.coalesce(Tenant.custom_domain, "")).like(s)
        )

    tenants = (await db.execute(stmt)).scalars().all()

    # Pre-fetch counts grouped by tenant_id for high performance
    user_counts = dict(
        (await db.execute(select(User.tenant_id, func.count(User.id)).group_by(User.tenant_id))).all()
    )
    product_counts = dict(
        (await db.execute(select(Product.tenant_id, func.count(Product.id)).group_by(Product.tenant_id))).all()
    )
    sales_rows = (
        await db.execute(
            select(
                Sale.tenant_id,
                func.count(Sale.id),
                func.coalesce(func.sum(Sale.net_total), 0),
            ).group_by(Sale.tenant_id)
        )
    ).all()
    sales_data = {row[0]: (row[1], float(row[2])) for row in sales_rows}

    items = []
    for t in tenants:
        sales_info = sales_data.get(t.id, (0, 0.0))
        sales_count = sales_info[0]
        sales_vol = sales_info[1]

        items.append(
            {
                "id": str(t.id),
                "name": t.name,
                "slug": t.slug,
                "custom_domain": t.custom_domain,
                "business_type": t.business_type,
                "sector": t.sector,
                "scale": t.scale,
                "status": t.status,
                "plan": t.plan,
                "trial_ends_at": t.trial_ends_at.isoformat() if t.trial_ends_at else None,
                "palette": t.palette,
                "deployment_mode": t.deployment_mode,
                "tech_stack": t.tech_stack or {},
                "active_modules": t.active_modules or ["pos", "inventory"],
                "limits": t.limits or {},
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "stats": {
                    "users_count": user_counts.get(t.id, 0),
                    "products_count": product_counts.get(t.id, 0),
                    "sales_count": sales_count,
                    "sales_volume_egp": sales_vol,
                },
            }
        )

    return {"items": items, "count": len(items)}


# -------------------------------------------------------------------------
# Tenant Details Drill-Down
# -------------------------------------------------------------------------
@router.get("/tenants/{tenant_id}")
async def get_tenant_details(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Retrieve deep operational details of a specific client company, its users, and branches."""
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المنشأة غير موجودة")

    # Fetch users for this tenant
    users = (
        (
            await db.execute(
                select(User)
                .where(User.tenant_id == tenant_id)
                .order_by(User.created_at.asc())
            )
        )
        .scalars()
        .all()
    )

    # Fetch warehouses / branches for this tenant
    branches = (
        (
            await db.execute(
                select(Warehouse)
                .where(Warehouse.tenant_id == tenant_id)
                .order_by(Warehouse.created_at.asc())
            )
        )
        .scalars()
        .all()
    )

    product_count = (
        await db.execute(select(func.count(Product.id)).where(Product.tenant_id == tenant_id))
    ).scalar() or 0
    sales_count = (
        await db.execute(select(func.count(Sale.id)).where(Sale.tenant_id == tenant_id))
    ).scalar() or 0
    sales_volume = (
        await db.execute(
            select(func.coalesce(func.sum(Sale.net_total), 0)).where(Sale.tenant_id == tenant_id)
        )
    ).scalar() or 0

    return {
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "custom_domain": tenant.custom_domain,
            "business_type": tenant.business_type,
            "sector": tenant.sector,
            "scale": tenant.scale,
            "status": tenant.status,
            "plan": tenant.plan,
            "trial_ends_at": tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
            "palette": tenant.palette,
            "deployment_mode": tenant.deployment_mode,
            "tech_stack": tenant.tech_stack or {},
            "active_modules": tenant.active_modules or ["pos", "inventory"],
            "limits": tenant.limits or {},
            "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
        },
        "stats": {
            "products_count": product_count,
            "sales_count": sales_count,
            "sales_volume_egp": float(sales_volume),
            "users_count": len(users),
            "branches_count": len(branches),
        },
        "users": [
            {
                "id": str(u.id),
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "is_manager": u.is_manager,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "branches": [
            {
                "id": str(w.id),
                "name": w.name,
                "is_active": w.is_active,
                "is_default": w.is_default,
            }
            for w in branches
        ],
    }


# -------------------------------------------------------------------------
# Provision New Client ERP
# -------------------------------------------------------------------------
@router.post("/tenants", status_code=status.HTTP_201_CREATED)
async def provision_tenant(
    data: ProvisionTenantRequest,
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Provision a complete client ERP workspace directly from Admoon with custom tech stack & modules."""
    clean_slug = data.slug.strip().lower()

    # Check slug collisions
    existing_slug = (
        await db.execute(select(Tenant.id).where(Tenant.slug == clean_slug))
    ).scalar_one_or_none()
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"الرابط التعريفي (Slug) '{clean_slug}' محجوز لمنشأة أخرى",
        )

    # Check owner username collisions
    existing_user = (
        await db.execute(select(User.id).where(User.username == data.owner_username.strip()))
    ).scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"اسم المستخدم '{data.owner_username}' محجوز مسبقاً",
        )

    tenant_id = uuid.uuid4()
    owner_id = uuid.uuid4()

    new_tenant = Tenant(
        id=tenant_id,
        name=data.company_name.strip(),
        slug=clean_slug,
        custom_domain=data.custom_domain.strip() if data.custom_domain else None,
        sector=data.sector,
        business_type=data.business_type,
        scale=data.scale,
        status="active",
        plan=data.plan,
        deployment_mode=data.deployment_mode,
        palette={"name": data.palette, "hue": 250},
        tech_stack=data.tech_stack.model_dump(),
        active_modules=data.active_modules,
        trial_ends_at=datetime.now(UTC) + timedelta(days=data.trial_days),
    )
    db.add(new_tenant)
    await db.flush()

    await bind_tenant(db, tenant_id)
    owner = User(
        id=owner_id,
        username=data.owner_username.strip(),
        full_name=data.owner_full_name.strip(),
        role="admin",
        is_manager=True,
        permissions=["*"],
        password_hash=hash_password(data.owner_password),
        tenant_id=tenant_id,
    )
    db.add(owner)
    await db.flush()

    # Seed sector-specific starter catalogs (e.g. gym, restaurant, school)
    await seed_demo(db, tenant_id, owner_id, data.sector, data.scale, data.active_modules)
    await db.commit()

    return {
        "ok": True,
        "message": f"تم تأسيس مساحة عمل '{data.company_name}' بنجاح",
        "tenant_id": str(tenant_id),
        "slug": clean_slug,
        "owner_username": data.owner_username,
        "routing": {
            "path_root": f"/{clean_slug}",
            "subdomain": f"{clean_slug}.vendora.app",
            "custom_domain": data.custom_domain,
        },
    }


# -------------------------------------------------------------------------
# Update Tenant Profile & Status
# -------------------------------------------------------------------------
@router.put("/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: uuid.UUID,
    data: UpdateTenantRequest,
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المنشأة غير موجودة")

    if data.name is not None:
        tenant.name = data.name.strip()
    if data.slug is not None:
        clean_slug = data.slug.strip().lower()
        # Verify unique
        collision = (
            await db.execute(select(Tenant.id).where(Tenant.slug == clean_slug, Tenant.id != tenant_id))
        ).scalar_one_or_none()
        if collision:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="الرابط التعريفي محجوز")
        tenant.slug = clean_slug
    if data.custom_domain is not None:
        tenant.custom_domain = data.custom_domain.strip() if data.custom_domain else None
    if data.status is not None:
        tenant.status = data.status
    if data.plan is not None:
        tenant.plan = data.plan
    if data.business_type is not None:
        tenant.business_type = data.business_type
    if data.trial_ends_at is not None:
        tenant.trial_ends_at = data.trial_ends_at
    if data.palette_name is not None:
        tenant.palette = {"name": data.palette_name, "hue": 250}
    if data.limits is not None:
        tenant.limits = {**(tenant.limits or {}), **data.limits}

    await db.commit()
    return {"ok": True, "message": "تم تحديث بيانات المنشأة بنجاح"}


# -------------------------------------------------------------------------
# Update Custom Tech Stack
# -------------------------------------------------------------------------
@router.put("/tenants/{tenant_id}/tech-stack")
async def update_tech_stack(
    tenant_id: uuid.UUID,
    config: TechStackConfig,
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Configure custom infrastructure stack: DB engine (Neon, MySQL, SQLite .exe), Storage driver, Backend runtime."""
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المنشأة غير موجودة")

    tenant.deployment_mode = config.deployment_mode
    tenant.tech_stack = config.model_dump()
    await db.commit()

    return {
        "ok": True,
        "message": f"تم تحديث البنية التقنية لمنشأة '{tenant.name}' إلى {config.deployment_mode}",
        "tech_stack": tenant.tech_stack,
    }


# -------------------------------------------------------------------------
# Update Active Modules
# -------------------------------------------------------------------------
@router.put("/tenants/{tenant_id}/modules")
async def update_tenant_modules(
    tenant_id: uuid.UUID,
    data: UpdateModulesRequest,
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Toggle installed ERP modules (e.g. gym, restaurant, school, pos, finance, hr) for this client."""
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المنشأة غير موجودة")

    tenant.active_modules = data.active_modules
    await db.commit()

    return {
        "ok": True,
        "message": f"تم تحديث وحدات منشأة '{tenant.name}' بنجاح",
        "active_modules": tenant.active_modules,
    }


# -------------------------------------------------------------------------
# One-Click Impersonation ("الدخول كمدير المنشأة")
# -------------------------------------------------------------------------
@router.post("/tenants/{tenant_id}/impersonate")
async def impersonate_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Allows Admoon to jump directly into the client's ERP as an administrator to audit or provide support."""
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المنشأة غير موجودة")

    # Find the primary admin/manager of the client
    owner = (
        await db.execute(
            select(User)
            .where(User.tenant_id == tenant_id, User.role.in_(["admin", "manager"]))
            .order_by(User.created_at.asc())
            .limit(1)
        )
    ).scalar_one_or_none()

    if not owner:
        # Fallback to any active user in the tenant
        owner = (
            await db.execute(
                select(User).where(User.tenant_id == tenant_id).order_by(User.created_at.asc()).limit(1)
            )
        ).scalar_one_or_none()

    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="لا يوجد مستخدم مسجل في هذه المنشأة للدخول به")

    # Issue token for the client user
    token_data = auth_service.issue_token(owner)

    resp = JSONResponse(content={
        "ok": True,
        "access_token": token_data["access_token"],
        "user": {
            "id": str(owner.id),
            "username": owner.username,
            "full_name": owner.full_name,
            "role": owner.role,
        },
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "plan": tenant.plan,
            "palette": tenant.palette,
            "active_modules": tenant.active_modules,
        },
        "redirect_path": "/",
    })
    resp.set_cookie(
        key="access_token",
        value=token_data["access_token"],
        httponly=True,
        secure=settings.IS_PRODUCTION,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return resp


# -------------------------------------------------------------------------
# Offline License Key Generator (For .exe Desktop Standalone clients)
# -------------------------------------------------------------------------
@router.post("/tenants/{tenant_id}/license-key")
async def generate_license_key(
    tenant_id: uuid.UUID,
    valid_days: int = Query(365, ge=30, le=3650),
    db: AsyncSession = Depends(get_db),
    _superadmin: User = Depends(require_superadmin),
):
    """Generates an offline cryptographically signed license payload for standalone desktop (.exe) clients."""
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المنشأة غير موجودة")

    expires = datetime.now(UTC) + timedelta(days=valid_days)
    payload = {
        "v": 1,
        "tenant_id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "modules": tenant.active_modules or ["pos", "inventory"],
        "max_branches": (tenant.limits or {}).get("max_branches", 3),
        "max_users": (tenant.limits or {}).get("max_users", 10),
        "issued_at": datetime.now(UTC).isoformat(),
        "expires_at": expires.isoformat(),
    }

    raw = json.dumps(payload, sort_keys=True)
    secret = settings.SECRET_KEY.encode()
    signature = hashlib.sha256(raw.encode() + secret).hexdigest()[:32]
    encoded_token = base64.b64encode(f"{raw}::{signature}".encode()).decode()

    # Save generated license into tech_stack
    current_stack = dict(tenant.tech_stack or {})
    current_stack["license_key"] = encoded_token
    current_stack["license_expires_at"] = expires.isoformat()
    tenant.tech_stack = current_stack
    tenant.status = "offline_licensed"
    tenant.deployment_mode = "desktop_standalone"
    await db.commit()

    return {
        "ok": True,
        "license_key": encoded_token,
        "expires_at": expires.isoformat(),
        "payload": payload,
    }
