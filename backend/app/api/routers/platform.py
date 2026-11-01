"""Public platform surface: signup, plans, subscription requests.

Self-serve flow: a merchant signs up through the onboarding wizard →
a workspace tenant is created with a tailored demo dataset → they run on
a trial; the banner routes them to pricing where a subscription request
is recorded until payment integration lands.
"""
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.ratelimit import RateLimiter
from app.core.security import hash_password
from app.core.tenancy import bind_tenant, current_tenant_id
from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.tenant import Subscription, Tenant
from app.models.user import User
from app.services.demo_seed import seed_demo

router = APIRouter(prefix="/platform", tags=["platform"])

signup_limiter = RateLimiter(max_requests=5, window_seconds=3600)

TRIAL_DAYS = 14

PLANS = [
    {"id": "basic", "name": "أساسي", "price_egp": 499,
     "tagline": "ابدأ صح — فرع واحد جاهز للبيع",
     "features": ["فرع واحد · 3 مستخدمين", "نقطة بيع + مخزون + مبيعات", "عملاء وموردون", "تقارير أساسية"]},
    {"id": "pro", "name": "احترافي", "price_egp": 999, "popular": True,
     "tagline": "للمحلات اللي بتكبر — كل الميزات",
     "features": ["حتى 3 فروع · 15 مستخدمًا", "كل ميزات أساسي", "مشتريات وذمم وخزائن", "تقارير متقدمة + تصدير"]},
    {"id": "enterprise", "name": "مؤسسي", "price_egp": None,
     "tagline": "سلاسل وفروع كثيرة",
     "features": ["فروع ومستخدمون بلا حدود", "صلاحيات متقدمة", "أولوية دعم", "تهيئة وتدريب فريق العمل"]},
]

SECTORS = ["plumbing", "electrical", "tiles", "paint"]
SCALES = ["small", "medium", "large"]


class SignupRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=128)
    sector: str
    scale: str
    palette: str = "water"
    features: list[str] = Field(default_factory=list)
    owner_username: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    owner_password: str = Field(min_length=6, max_length=128)
    owner_full_name: str = Field(min_length=2, max_length=128)
    owner_phone: str | None = Field(default=None, max_length=32)


class SubscribeRequest(BaseModel):
    plan: str
    contact_phone: str | None = Field(default=None, max_length=32)


@router.get("/plans")
async def list_plans():
    return {"plans": PLANS, "trial_days": TRIAL_DAYS}


@router.post("/signup")
async def signup(data: SignupRequest, request: Request, db: AsyncSession = Depends(get_db), _=Depends(signup_limiter)):
    if data.sector not in SECTORS or data.scale not in SCALES:
        raise HTTPException(status_code=422, detail="نشاط غير معروف")

    existing = await db.execute(select(User.id).where(User.username == data.owner_username))
    if existing.scalar():
        raise HTTPException(status_code=409, detail="اسم المستخدم محجوز — اختر اسمًا آخر")

    tenant = Tenant(
        id=uuid.uuid4(),
        name=data.company_name.strip(),
        sector=data.sector,
        scale=data.scale,
        palette={"hue": {"water": 250, "emerald": 155, "copper": 55, "midnight": 230}.get(data.palette, 250)},
        features=data.features,
        plan="trial",
        trial_ends_at=datetime.now(UTC) + timedelta(days=TRIAL_DAYS),
    )
    db.add(tenant)
    await db.flush()

    await bind_tenant(db, tenant.id)  # seed inside the tenant's context (ctx + RLS GUC)
    owner = User(
        id=uuid.uuid4(),
        username=data.owner_username,
        full_name=data.owner_full_name.strip(),
        role="admin",
        password_hash=hash_password(data.owner_password),
        tenant_id=tenant.id,
    )
    db.add(owner)
    await db.flush()

    await seed_demo(db, tenant.id, owner.id, data.sector, data.scale, data.features)

    await db.commit()

    # issue a token exactly like /auth/login does
    from app.services import auth_service
    token = auth_service.issue_token(owner)
    from app.api.routers.auth import TokenResponse
    body = TokenResponse(
        access_token=token["access_token"], token_type="bearer",
        user_id=token["user_id"], username=token["username"],
        full_name=token["full_name"], role=token["role"],
    ).model_dump()
    from fastapi.responses import JSONResponse
    resp = JSONResponse(content={**body, "tenant": {
        "id": str(tenant.id), "name": tenant.name, "plan": tenant.plan,
        "trial_ends_at": tenant.trial_ends_at.isoformat(), "palette": tenant.palette,
        "features": tenant.features,
    }})
    resp.set_cookie(
        key="access_token", value=token["access_token"],
        httponly=True, secure=settings.IS_PRODUCTION, samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/",
    )
    return resp


@router.post("/subscribe-request")
async def subscribe_request(data: SubscribeRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    tid = current_tenant_id.get()
    if tid is None:
        raise HTTPException(status_code=403, detail="لا يوجد مساحة عمل مرتبطة")
    sub = Subscription(id=uuid.uuid4(), tenant_id=tid, plan=data.plan,
                       status="requested", contact_phone=data.contact_phone)
    db.add(sub)
    await db.commit()
    return {"status": "requested", "plan": data.plan,
            "message": "وصلنا طلبك — فريق المبيعات هيتواصل معاك لتفعيل الخطة"}


@router.get("/me/tenant")
async def my_tenant(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    tid = current_tenant_id.get()
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tid))).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="لا توجد مساحة عمل")
    return {
        "id": str(tenant.id), "name": tenant.name, "sector": tenant.sector,
        "scale": tenant.scale, "palette": tenant.palette, "features": tenant.features,
        "plan": tenant.plan, "trial_ends_at": tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
    }


@router.post("/wipe-demo")
async def wipe_demo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Safely delete seeded demo data for the current tenant while preserving
    real user-created products, categories, branches, and sales."""
    if current_user.role not in ("admin", "manager") and not current_user.is_manager:
        raise HTTPException(status_code=403, detail="صلاحية مدير مطلوبة لمسح البيانات التجريبية")

    tid = current_tenant_id.get() or current_user.tenant_id
    if not tid:
        raise HTTPException(status_code=400, detail="لا توجد مساحة عمل مرتبطة")

    from sqlalchemy import text as sqlt

    # 1. Delete demo sales & payments (cascade takes care of sale_items, payments)
    del_sales = (await db.execute(sqlt("DELETE FROM sales WHERE tenant_id=:tid AND is_demo=TRUE RETURNING id"), {"tid": tid})).fetchall()

    # 2. Delete demo stock balances
    del_balances = (await db.execute(sqlt("DELETE FROM stock_balances WHERE tenant_id=:tid AND is_demo=TRUE RETURNING product_id"), {"tid": tid})).fetchall()

    # 3. Delete demo products NOT referenced by any real sales
    del_products = (await db.execute(sqlt("""
        DELETE FROM products
        WHERE tenant_id=:tid AND is_demo=TRUE
          AND id NOT IN (SELECT product_id FROM sale_items WHERE tenant_id=:tid)
        RETURNING id
    """), {"tid": tid})).fetchall()

    # 4. Delete demo subcategories & categories without remaining products
    del_subcats = (await db.execute(sqlt("""
        DELETE FROM subcategories
        WHERE tenant_id=:tid AND is_demo=TRUE
          AND id NOT IN (SELECT subcategory_id FROM products WHERE tenant_id=:tid AND subcategory_id IS NOT NULL)
        RETURNING id
    """), {"tid": tid})).fetchall()

    del_cats = (await db.execute(sqlt("""
        DELETE FROM categories
        WHERE tenant_id=:tid AND is_demo=TRUE
          AND id NOT IN (SELECT category_id FROM subcategories WHERE tenant_id=:tid)
        RETURNING id
    """), {"tid": tid})).fetchall()

    # 5. Delete demo customers & suppliers not referenced by real transactions
    del_customers = (await db.execute(sqlt("""
        DELETE FROM customers
        WHERE tenant_id=:tid AND is_demo=TRUE
          AND id NOT IN (SELECT customer_id FROM sales WHERE tenant_id=:tid AND customer_id IS NOT NULL)
        RETURNING id
    """), {"tid": tid})).fetchall()

    del_suppliers = (await db.execute(sqlt("""
        DELETE FROM suppliers
        WHERE tenant_id=:tid AND is_demo=TRUE
          AND id NOT IN (SELECT supplier_id FROM purchase_orders WHERE tenant_id=:tid AND supplier_id IS NOT NULL)
        RETURNING id
    """), {"tid": tid})).fetchall()

    # 6. Reset demo safes / wallets balance if they exist
    await db.execute(sqlt("""
        UPDATE safes SET balance = 0 WHERE tenant_id=:tid AND is_demo=TRUE
    """), {"tid": tid})

    await db.commit()
    return {
        "ok": True,
        "message": "تم مسح البيانات التجريبية بنجاح",
        "deleted": {
            "sales": len(del_sales),
            "stock_balances": len(del_balances),
            "products": len(del_products),
            "subcategories": len(del_subcats),
            "categories": len(del_cats),
            "customers": len(del_customers),
            "suppliers": len(del_suppliers),
        },
    }
