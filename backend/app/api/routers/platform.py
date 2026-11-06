"""Public platform surface: signup, plans, subscription requests.

Self-serve flow: a merchant signs up through the onboarding wizard →
a workspace tenant is created with a tailored demo dataset → they run on
a trial; the banner routes them to pricing where a subscription request
is recorded until payment integration lands.
"""
import re
import unicodedata
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
from app.core.modules import SECTOR_TO_PRESET, set_active_modules
from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.tenant import Subscription, Tenant
from app.models.user import User
from app.services.demo_seed import seed_demo

router = APIRouter(prefix="/platform", tags=["platform"])

signup_limiter = RateLimiter(max_requests=5, window_seconds=3600)

TRIAL_DAYS = 14

PLANS = [
    {"id": "starter", "name": "باقة البداية (Starter)", "price_egp": 450,
     "tagline": "للمتاجر والمنشآت الناشئة — فرع واحد متكامل",
     "features": ["فرع واحد · حتى 5 مستخدمين", "نقطة بيع + مخزون + مبيعات", "طباعة إيصالات حرارية 80mm/58mm", "شاشات مطبخ KDS أو ماسح باركود"]},
    {"id": "pro", "name": "باقة المحترفين (Pro)", "price_egp": 850, "popular": True,
     "tagline": "الأكثر طلباً — صالات الجيم، المطاعم، والسلاسل",
     "features": ["حتى 3 فروع · 15 مستخدمًا", "كافة كوليكشنات الأنشطة (نوادي، مطاعم، مدارس)", "قاعدة بيانات سحابية مستقلة (Neon Postgres)", "رواتب وموظفون HR ونسخ احتياطي يومي"]},
    {"id": "enterprise", "name": "باقة المؤسسات (Enterprise)", "price_egp": 1950,
     "tagline": "لسلاسل الأعمال الكبرى والمشاريع متعددة الفروع",
     "features": ["فروع ومستخدمون بلا حدود", "خادم VPS مخصص مع عزل أمني فائق", "ترخيص نسخة سطح مكتب أوفلاين (.exe)", "دومين مخصص وتخزين سحابي غير محدود"]},
]

SECTORS = [
    # Phase 1: Core Business Systems
    "retail", "restaurant", "pharmacy", "consulting", "school",
    # Phase 2: Distribution and Logistics
    "wholesale", "logistics", "wms_3pl", "ecommerce",
    # Phase 3: Service-Based Systems
    "healthcare", "law_firm", "travel", "hotel", "gym", "salon", "agency", "field_service",
    # Phase 4: Manufacturing and Production
    "discrete_mfg", "food_mfg", "pharma_mfg", "printing",
    # Phase 5: Projects and Infrastructure
    "construction", "real_estate", "agriculture", "energy",
    # Phase 6: Specialized Systems
    "banking", "insurance", "government", "entertainment", "oil_gas",
    # Legacy aliases for backward compatibility
    "services", "plumbing", "electrical", "tiles", "paint",
]
SCALES = ["small", "medium", "large"]

SECTOR_PRIMARY_MODULES: dict[str, list[str]] = {
    # Phase 1: Core Business Systems
    "retail": ["pos", "inventory", "sales", "finance", "hr"],
    "restaurant": ["restaurant", "pos", "inventory", "finance"],
    "pharmacy": ["pharmacy", "inventory", "pos", "finance"],
    "consulting": ["services", "finance", "hr"],
    "school": ["school", "finance", "hr"],
    # Phase 2: Distribution and Logistics
    "wholesale": ["wholesale", "inventory", "sales", "finance"],
    "logistics": ["logistics", "finance", "operations"],
    "wms_3pl": ["wms", "inventory", "finance"],
    "ecommerce": ["ecommerce", "inventory", "sales", "finance"],
    # Phase 3: Service-Based Systems
    "healthcare": ["healthcare_clinic", "pharmacy", "finance", "inventory", "hr"],
    "law_firm": ["law", "finance", "hr"],
    "travel": ["travel", "sales", "finance"],
    "hotel": ["hospitality", "restaurant", "finance"],
    "gym": ["gym", "pos", "finance"],
    "salon": ["salon", "pos", "finance"],
    "agency": ["agency", "finance", "operations"],
    "field_service": ["field_service", "inventory", "operations", "finance"],
    # Phase 4: Manufacturing and Production
    "discrete_mfg": ["mfg", "inventory", "operations", "finance"],
    "food_mfg": ["fod", "inventory", "operations", "finance"],
    "pharma_mfg": ["phm", "inventory", "operations", "finance"],
    "printing": ["prn", "inventory", "operations", "finance"],
    # Phase 5: Projects and Infrastructure
    "construction": ["cst", "inventory", "operations", "finance"],
    "real_estate": ["rec", "finance", "operations"],
    "agriculture": ["agr", "inventory", "operations", "finance"],
    "energy": ["eng", "inventory", "operations", "finance"],
    # Phase 6: Specialized Systems
    "banking": ["bnk", "finance"],
    "insurance": ["ins", "finance"],
    "government": ["gov", "finance", "operations"],
    "entertainment": ["ent", "pos", "finance", "operations"],
    "oil_gas": ["oil", "operations", "finance"],
    # Legacy aliases
    "services": ["services", "finance", "hr"],
    "plumbing": ["pos", "inventory", "finance"],
    "electrical": ["pos", "inventory", "finance"],
    "tiles": ["pos", "inventory", "finance"],
    "paint": ["pos", "inventory", "finance"],
}

SECTOR_PRIMARY_ROUTES: dict[str, str] = {
    # Phase 1: Core Business Systems
    "retail": "/pos",
    "restaurant": "/restaurant/tables",
    "pharmacy": "/pharmacy",
    "consulting": "/services",
    "school": "/school/students",
    # Phase 2: Distribution and Logistics
    "wholesale": "/wholesale",
    "logistics": "/logistics",
    "wms_3pl": "/wms",
    "ecommerce": "/ecommerce",
    # Phase 3: Service-Based Systems
    "healthcare": "/clinic",
    "law_firm": "/law",
    "travel": "/travel",
    "hotel": "/hospitality",
    "gym": "/gym",
    "salon": "/salon",
    "agency": "/agency",
    "field_service": "/field-service",
    # Phase 4: Manufacturing and Production
    "discrete_mfg": "/mfg",
    "food_mfg": "/fod",
    "pharma_mfg": "/phm",
    "printing": "/prn",
    # Phase 5: Projects and Infrastructure
    "construction": "/cst",
    "real_estate": "/rec",
    "agriculture": "/agr",
    "energy": "/eng",
    # Phase 6: Specialized Systems
    "banking": "/bnk",
    "insurance": "/ins",
    "government": "/gov",
    "entertainment": "/ent",
    "oil_gas": "/oil",
    # Legacy aliases
    "services": "/services",
    "plumbing": "/pos",
    "electrical": "/pos",
    "tiles": "/pos",
    "paint": "/pos",
}

PALETTE_HUES = {
    "mizan": 350,
    "slate": 240,
    "cobalt": 250,
    "emerald": 155,
    "amber": 75,
    "monokai": 255,
    "water": 250,
    "copper": 55,
    "midnight": 230,
}


class SignupRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=128)
    sector: str
    scale: str
    palette: str = "mizan"
    features: list[str] = Field(default_factory=list)
    owner_username: str = Field(min_length=3, max_length=64, pattern=r"^[\w.\-]+$")
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

    # Generate a unique URL slug for the tenant
    normalized = unicodedata.normalize("NFKD", data.company_name).encode("ascii", "ignore").decode("ascii").lower()
    cleaned = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    candidate = cleaned[:32] if cleaned and len(cleaned) >= 3 else f"tenant-{uuid.uuid4().hex[:6]}"

    base_candidate = candidate
    suffix_counter = 1
    while True:
        exists = (await db.execute(select(Tenant.id).where(Tenant.slug == candidate))).scalar_one_or_none()
        if not exists:
            break
        candidate = f"{base_candidate}-{suffix_counter}"
        suffix_counter += 1

    tenant_slug = candidate
    hue = PALETTE_HUES.get(data.palette, 250)

    # Calculate initial active modules: sector defaults merged with requested features
    base_mods = SECTOR_PRIMARY_MODULES.get(data.sector, ["pos", "inventory", "finance"])
    requested_features = data.features or []
    all_active = list(dict.fromkeys(base_mods + requested_features))
    primary_route = SECTOR_PRIMARY_ROUTES.get(data.sector, "/pos")
    preset_id = SECTOR_TO_PRESET.get(data.sector)

    tenant = Tenant(
        id=uuid.uuid4(),
        name=data.company_name.strip(),
        slug=tenant_slug,
        sector=data.sector,
        scale=data.scale,
        palette={"name": data.palette, "hue": hue},
        features=requested_features,
        active_modules=all_active,
        status="active",
        deployment_mode="cloud_saas",
        business_type=data.sector,
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

    await seed_demo(db, tenant.id, owner.id, data.sector, data.scale, all_active)

    # Persist the sector's active modules and preset so guards + Modules page resolve
    await set_active_modules(db, all_active, preset_id=preset_id)

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
    resp = JSONResponse(content={**body, "primary_route": primary_route, "tenant": {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "sector": tenant.sector,
        "business_type": tenant.business_type,
        "primary_route": primary_route,
        "plan": tenant.plan,
        "trial_ends_at": tenant.trial_ends_at.isoformat(),
        "palette": tenant.palette,
        "features": tenant.features,
        "active_modules": tenant.active_modules,
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
