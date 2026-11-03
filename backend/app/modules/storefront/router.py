"""Tenant Storefront Router: Public Catalog, E-Commerce Checkout, and Back-Office Management."""
from __future__ import annotations

import random
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.pagination import Page
from app.core.tenancy import bind_tenant, current_tenant_id
from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.product import Category, Product, Subcategory
from app.models.tenant import Tenant
from app.models.user import User
from app.modules.storefront.models import (
    StorefrontConfig,
    StorefrontCoupon,
    StorefrontOrder,
    StorefrontOrderItem,
)

router = APIRouter(tags=["storefront"])


# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------
async def _resolve_tenant_by_slug(db: AsyncSession, slug_or_id: str) -> Tenant:
    """Find tenant by slug, or fallback to UUID id."""
    stmt = select(Tenant).where(Tenant.slug == slug_or_id)
    tenant = (await db.execute(stmt)).scalar_one_or_none()
    if not tenant:
        try:
            tid = uuid.UUID(slug_or_id)
            stmt = select(Tenant).where(Tenant.id == tid)
            tenant = (await db.execute(stmt)).scalar_one_or_none()
        except ValueError:
            pass

    if not tenant:
        raise HTTPException(
            status_code=404, detail="المتجر غير موجود — تحقق من صحة الرابط أو اسم المنشأة"
        )
    return tenant


async def _get_or_create_config(db: AsyncSession, tenant: Tenant) -> StorefrontConfig:
    stmt = select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id)
    cfg = (await db.execute(stmt)).scalar_one_or_none()
    if not cfg:
        cfg = StorefrontConfig(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            store_title=f"متجر {tenant.name}",
            tagline="تسوق كافة المنتجات بأفضل جودة وخدمة التوصيل السريع",
            brand_color="#0f766e",
            announcement="🚚 توصيل مجاني للطلبات فوق 500 ج.م • دفع كاش عند الاستلام أو فوري وإنستاباي",
            delivery_fee=30.0,
            free_delivery_above=500.0,
            min_order_amount=50.0,
            allow_delivery=True,
            allow_pickup=True,
            allow_dine_in=True,
            is_active=True,
        )
        db.add(cfg)
        await db.commit()
        await db.refresh(cfg)
    return cfg


# -------------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------------
class CartItemIn(BaseModel):
    product_id: uuid.UUID
    quantity: float = Field(default=1.0, gt=0)
    notes: str | None = None


class CheckoutIn(BaseModel):
    customer_name: str = Field(min_length=2, max_length=128)
    customer_phone: str = Field(min_length=8, max_length=32)
    customer_email: str | None = None
    delivery_type: str = Field(default="delivery")  # delivery | pickup | dine_in
    delivery_address: str | None = None
    table_number: str | None = None
    notes: str | None = None
    payment_method: str = Field(default="cod")  # cod | fawry | instapay | card
    coupon_code: str | None = None
    items: list[CartItemIn] = Field(min_length=1)


class ValidateCouponIn(BaseModel):
    code: str
    subtotal: float


class UpdateStatusIn(BaseModel):
    status: str = Field(description="confirmed | preparing | out_for_delivery | completed | cancelled")


class UpdateConfigIn(BaseModel):
    store_title: str
    tagline: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    brand_color: str = "#0f766e"
    announcement: str | None = None
    whatsapp_number: str | None = None
    delivery_fee: float = 30.0
    free_delivery_above: float | None = 500.0
    min_order_amount: float = 50.0
    allow_delivery: bool = True
    allow_pickup: bool = True
    allow_dine_in: bool = True
    social_instagram: str | None = None
    social_facebook: str | None = None


class CreateCouponIn(BaseModel):
    code: str = Field(min_length=3, max_length=32)
    discount_percent: float | None = None
    discount_amount: float | None = None
    min_order_amount: float = 0.0
    max_uses: int | None = None
    valid_until: datetime | None = None


# -------------------------------------------------------------------------
# Public Storefront Endpoints (Unauthenticated / Customer Facing)
# -------------------------------------------------------------------------
@router.get("/storefront/{tenant_slug}/config")
async def get_public_store_config(tenant_slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch store identity, theme, contact, and delivery settings."""
    tenant = await _resolve_tenant_by_slug(db, tenant_slug)
    cfg = await _get_or_create_config(db, tenant)

    # Categories count
    await bind_tenant(db, tenant.id)
    cat_stmt = (
        select(Category.name, func.count(Product.id))
        .join(Subcategory, Subcategory.category_id == Category.id)
        .join(Product, Product.subcategory_id == Subcategory.id)
        .where(Product.is_active == True)
        .group_by(Category.name)
    )
    cat_counts = (await db.execute(cat_stmt)).all()

    return {
        "tenant_id": str(tenant.id),
        "tenant_name": tenant.name,
        "tenant_slug": tenant.slug or tenant_slug,
        "sector": tenant.sector,
        "config": {
            "store_title": cfg.store_title,
            "tagline": cfg.tagline,
            "logo_url": cfg.logo_url,
            "banner_url": cfg.banner_url,
            "brand_color": cfg.brand_color,
            "announcement": cfg.announcement,
            "whatsapp_number": cfg.whatsapp_number,
            "delivery_fee": cfg.delivery_fee,
            "free_delivery_above": cfg.free_delivery_above,
            "min_order_amount": cfg.min_order_amount,
            "allow_delivery": cfg.allow_delivery,
            "allow_pickup": cfg.allow_pickup,
            "allow_dine_in": cfg.allow_dine_in,
            "is_active": cfg.is_active,
            "social_instagram": cfg.social_instagram,
            "social_facebook": cfg.social_facebook,
        },
        "categories_summary": [{"name": c[0], "count": c[1]} for c in cat_counts],
    }


@router.get("/storefront/{tenant_slug}/categories")
async def get_public_store_categories(tenant_slug: str, db: AsyncSession = Depends(get_db)):
    """List public categories for the tenant."""
    tenant = await _resolve_tenant_by_slug(db, tenant_slug)
    await bind_tenant(db, tenant.id)

    cats = (await db.execute(select(Category).order_by(Category.name))).scalars().all()
    result = []
    for c in cats:
        # count active products
        count = (
            await db.execute(
                select(func.count(Product.id))
                .join(Subcategory, Subcategory.category_id == c.id)
                .where(Product.subcategory_id == Subcategory.id, Product.is_active == True)
            )
        ).scalar() or 0
        if count > 0:
            result.append({
                "id": str(c.id),
                "name": c.name,
                "code": c.code,
                "image_url": c.image_url,
                "product_count": count,
            })
    return result


@router.get("/storefront/{tenant_slug}/products")
async def get_public_store_products(
    tenant_slug: str,
    category_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Browse public catalog for tenant."""
    tenant = await _resolve_tenant_by_slug(db, tenant_slug)
    await bind_tenant(db, tenant.id)

    stmt = select(Product).where(Product.is_active == True)
    count_stmt = select(func.count(Product.id)).where(Product.is_active == True)

    if search:
        search_filter = or_(Product.name.ilike(f"%{search}%"), Product.code.ilike(f"%{search}%"))
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    if category_id:
        stmt = stmt.join(Subcategory).where(Subcategory.category_id == category_id)
        count_stmt = count_stmt.join(Subcategory).where(Subcategory.category_id == category_id)

    total = (await db.execute(count_stmt)).scalar() or 0
    pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    stmt = (
        stmt.options(
            selectinload(Product.subcategory).selectinload(Subcategory.category),
            selectinload(Product.images),
        )
        .order_by(Product.name)
        .offset(offset)
        .limit(page_size)
    )

    rows = (await db.execute(stmt)).scalars().all()

    items = []
    for p in rows:
        img = p.image_url or (p.images[0].image_url if p.images else None)
        items.append({
            "id": str(p.id),
            "name": p.name,
            "code": p.code,
            "unit": p.unit,
            "retail_price": float(p.retail_price or 0.0),
            "image_url": img,
            "description": p.description,
            "category_name": p.subcategory.category.name if p.subcategory and p.subcategory.category else None,
            "category_id": str(p.subcategory.category_id) if p.subcategory else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.post("/storefront/{tenant_slug}/validate-coupon")
async def validate_store_coupon(
    tenant_slug: str,
    payload: ValidateCouponIn,
    db: AsyncSession = Depends(get_db),
):
    """Validate coupon code and return discount amount."""
    tenant = await _resolve_tenant_by_slug(db, tenant_slug)

    stmt = select(StorefrontCoupon).where(
        StorefrontCoupon.tenant_id == tenant.id,
        StorefrontCoupon.code == payload.code.strip().upper(),
        StorefrontCoupon.is_active == True,
    )
    coupon = (await db.execute(stmt)).scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=400, detail="كود الخصم غير صحيح أو غير مفعل")

    now = datetime.now(UTC)
    if coupon.valid_until and coupon.valid_until < now:
        raise HTTPException(status_code=400, detail="انتهت صلاحية كود الخصم")

    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="تم الوصول للحد الأقصى لاستخدام هذا الكود")

    if payload.subtotal < coupon.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"الحد الأدنى لتطبيق هذا الخصم هو {coupon.min_order_amount} ج.م",
        )

    discount = 0.0
    if coupon.discount_percent:
        discount = round((payload.subtotal * coupon.discount_percent) / 100.0, 2)
    elif coupon.discount_amount:
        discount = round(min(payload.subtotal, coupon.discount_amount), 2)

    return {
        "valid": True,
        "code": coupon.code,
        "discount_amount": discount,
        "message": f"تم تطبيق الخصم بنجاح وفرت {discount} ج.م",
    }


@router.post("/storefront/{tenant_slug}/checkout")
async def storefront_checkout(
    tenant_slug: str,
    payload: CheckoutIn,
    db: AsyncSession = Depends(get_db),
):
    """Customer checkout: create StorefrontOrder and StorefrontOrderItems."""
    tenant = await _resolve_tenant_by_slug(db, tenant_slug)
    cfg = await _get_or_create_config(db, tenant)

    if not cfg.is_active:
        raise HTTPException(status_code=400, detail="المتجر مغلق حالياً عن استقبال الطلبات")

    # Fetch products and compute subtotal
    subtotal = 0.0
    order_items_to_create = []

    for item in payload.items:
        p_stmt = select(Product).where(Product.id == item.product_id, Product.tenant_id == tenant.id)
        prod = (await db.execute(p_stmt)).scalar_one_or_none()
        if not prod:
            raise HTTPException(status_code=400, detail=f"المنتج ({item.product_id}) غير متوفر")

        price = float(prod.retail_price or 0.0)
        line_total = round(price * item.quantity, 2)
        subtotal += line_total

        order_items_to_create.append({
            "product_id": prod.id,
            "product_name": prod.name,
            "unit_price": price,
            "quantity": item.quantity,
            "total_price": line_total,
            "notes": item.notes,
        })

    # Validate min order
    if subtotal < cfg.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"الحد الأدنى للطلب هو {cfg.min_order_amount} ج.م (المجموع الحالي: {subtotal} ج.م)",
        )

    # Delivery fee
    delivery_fee = 0.0
    if payload.delivery_type == "delivery":
        if cfg.free_delivery_above and subtotal >= cfg.free_delivery_above:
            delivery_fee = 0.0
        else:
            delivery_fee = cfg.delivery_fee

    # Discount
    discount_amount = 0.0
    if payload.coupon_code:
        c_stmt = select(StorefrontCoupon).where(
            StorefrontCoupon.tenant_id == tenant.id,
            StorefrontCoupon.code == payload.coupon_code.strip().upper(),
            StorefrontCoupon.is_active == True,
        )
        coupon = (await db.execute(c_stmt)).scalar_one_or_none()
        if coupon and (not coupon.valid_until or coupon.valid_until >= datetime.now(UTC)):
            if not coupon.max_uses or coupon.used_count < coupon.max_uses:
                if subtotal >= coupon.min_order_amount:
                    if coupon.discount_percent:
                        discount_amount = round((subtotal * coupon.discount_percent) / 100.0, 2)
                    elif coupon.discount_amount:
                        discount_amount = round(min(subtotal, coupon.discount_amount), 2)
                    coupon.used_count += 1

    total_amount = round(max(0.0, subtotal - discount_amount) + delivery_fee, 2)

    # Order Number
    now = datetime.now(UTC)
    order_number = f"ORD-{now.strftime('%Y%m')}-{random.randint(1000, 9999)}"

    # Fawry Ref
    fawry_ref = None
    if payload.payment_method == "fawry":
        fawry_ref = f"788{random.randint(1000000, 9999999)}"

    order = StorefrontOrder(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        order_number=order_number,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        delivery_type=payload.delivery_type,
        delivery_address=payload.delivery_address,
        table_number=payload.table_number,
        notes=payload.notes,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount_amount=discount_amount,
        coupon_code=payload.coupon_code,
        total_amount=total_amount,
        status="pending",
        payment_method=payload.payment_method,
        payment_status="unpaid" if payload.payment_method != "card" else "pending",
        fawry_ref=fawry_ref,
    )
    db.add(order)

    for oi in order_items_to_create:
        item_obj = StorefrontOrderItem(
            id=uuid.uuid4(),
            order_id=order.id,
            product_id=oi["product_id"],
            product_name=oi["product_name"],
            unit_price=oi["unit_price"],
            quantity=oi["quantity"],
            total_price=oi["total_price"],
            notes=oi["notes"],
        )
        db.add(item_obj)

    # Trigger In-App Notification for Merchant ERP
    try:
        from app.models.notification import Notification

        notif = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="storefront_order",
            severity="info",
            title=f"طلب متجر إلكتروني جديد ({order_number})",
            body=f"قام العميل «{order.customer_name}» بإرسال طلب جديد بقيمة {total_amount} ج.م بانتظار التجهيز.",
            link="/storefront",
            data_json={
                "order_number": order_number,
                "order_id": str(order.id),
                "customer_name": order.customer_name,
                "total_amount": total_amount,
            },
            is_read=False,
        )
        db.add(notif)
    except Exception as e:
        logger.warning("Could not create storefront notification: %s", e)

    await db.commit()

    return {
        "ok": True,
        "order_number": order_number,
        "customer_name": order.customer_name,
        "total_amount": total_amount,
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "discount_amount": discount_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "fawry_ref": fawry_ref,
        "whatsapp_link": f"https://wa.me/{cfg.whatsapp_number}?text=مرحباً، أود تأكيد طلبي برقم {order_number} بقيمة {total_amount} ج.م" if cfg.whatsapp_number else None,
        "message": "تم استلام طلبك بنجاح وجاري تجهيزه من قبل فريق المتجر",
    }


@router.get("/storefront/{tenant_slug}/orders/{order_number}")
async def get_public_order_tracking(
    tenant_slug: str, order_number: str, db: AsyncSession = Depends(get_db)
):
    """Public customer order status tracker."""
    tenant = await _resolve_tenant_by_slug(db, tenant_slug)

    stmt = select(StorefrontOrder).where(
        StorefrontOrder.tenant_id == tenant.id,
        StorefrontOrder.order_number == order_number,
    )
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")

    items = [
        {
            "product_name": i.product_name,
            "unit_price": i.unit_price,
            "quantity": i.quantity,
            "total_price": i.total_price,
        }
        for i in order.items
    ]

    return {
        "order_number": order.order_number,
        "customer_name": order.customer_name,
        "delivery_type": order.delivery_type,
        "delivery_address": order.delivery_address,
        "table_number": order.table_number,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "fawry_ref": order.fawry_ref,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "discount_amount": order.discount_amount,
        "total_amount": order.total_amount,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": items,
    }


# -------------------------------------------------------------------------
# Back-Office Management Endpoints (Requires Tenant Auth)
# -------------------------------------------------------------------------
@router.get("/modules/storefront/dashboard")
async def get_storefront_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Back-office statistics for web orders."""
    tid = current_tenant_id.get() or current_user.tenant_id
    if not tid:
        raise HTTPException(status_code=400, detail="لا توجد مساحة عمل مرتبطة")

    # Metrics
    orders_q = await db.execute(select(StorefrontOrder).where(StorefrontOrder.tenant_id == tid))
    all_orders = orders_q.scalars().all()

    total_orders = len(all_orders)
    total_revenue = sum(o.total_amount for o in all_orders if o.status != "cancelled")
    pending_orders = sum(1 for o in all_orders if o.status == "pending")
    preparing_orders = sum(1 for o in all_orders if o.status == "preparing")
    completed_orders = sum(1 for o in all_orders if o.status == "completed")

    return {
        "total_orders": total_orders,
        "total_revenue_egp": round(total_revenue, 2),
        "pending_orders": pending_orders,
        "preparing_orders": preparing_orders,
        "completed_orders": completed_orders,
        "average_ticket_egp": round(total_revenue / total_orders, 2) if total_orders else 0.0,
    }


@router.get("/modules/storefront/config")
async def get_storefront_admin_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current tenant store configuration."""
    tid = current_tenant_id.get() or current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tid)
    tenant = (await db.execute(stmt)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="المنشأة غير موجودة")

    cfg = await _get_or_create_config(db, tenant)
    return {
        "tenant_slug": tenant.slug or str(tenant.id),
        "config": {
            "store_title": cfg.store_title,
            "tagline": cfg.tagline,
            "logo_url": cfg.logo_url,
            "banner_url": cfg.banner_url,
            "brand_color": cfg.brand_color,
            "announcement": cfg.announcement,
            "whatsapp_number": cfg.whatsapp_number,
            "delivery_fee": cfg.delivery_fee,
            "free_delivery_above": cfg.free_delivery_above,
            "min_order_amount": cfg.min_order_amount,
            "allow_delivery": cfg.allow_delivery,
            "allow_pickup": cfg.allow_pickup,
            "allow_dine_in": cfg.allow_dine_in,
            "is_active": cfg.is_active,
            "social_instagram": cfg.social_instagram,
            "social_facebook": cfg.social_facebook,
        },
    }


@router.put("/modules/storefront/config")
async def update_storefront_admin_config(
    payload: UpdateConfigIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update tenant storefront settings."""
    tid = current_tenant_id.get() or current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tid)
    tenant = (await db.execute(stmt)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="المنشأة غير موجودة")

    cfg = await _get_or_create_config(db, tenant)
    cfg.store_title = payload.store_title
    cfg.tagline = payload.tagline
    cfg.logo_url = payload.logo_url
    cfg.banner_url = payload.banner_url
    cfg.brand_color = payload.brand_color
    cfg.announcement = payload.announcement
    cfg.whatsapp_number = payload.whatsapp_number
    cfg.delivery_fee = payload.delivery_fee
    cfg.free_delivery_above = payload.free_delivery_above
    cfg.min_order_amount = payload.min_order_amount
    cfg.allow_delivery = payload.allow_delivery
    cfg.allow_pickup = payload.allow_pickup
    cfg.allow_dine_in = payload.allow_dine_in
    cfg.social_instagram = payload.social_instagram
    cfg.social_facebook = payload.social_facebook

    await db.commit()
    return {"ok": True, "message": "تم حفظ وتحديث إعدادات المتجر الإلكتروني بنجاح"}


@router.get("/modules/storefront/orders")
async def get_storefront_admin_orders(
    status_filter: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List online storefront orders with status filtering."""
    tid = current_tenant_id.get() or current_user.tenant_id
    stmt = select(StorefrontOrder).where(StorefrontOrder.tenant_id == tid)

    if status_filter and status_filter != "all":
        stmt = stmt.where(StorefrontOrder.status == status_filter)

    if search:
        search_filter = or_(
            StorefrontOrder.order_number.ilike(f"%{search}%"),
            StorefrontOrder.customer_name.ilike(f"%{search}%"),
            StorefrontOrder.customer_phone.ilike(f"%{search}%"),
        )
        stmt = stmt.where(search_filter)

    stmt = stmt.order_by(desc(StorefrontOrder.created_at)).offset((page - 1) * page_size).limit(page_size)
    orders = (await db.execute(stmt)).scalars().all()

    items = []
    for o in orders:
        items.append({
            "id": str(o.id),
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "customer_email": o.customer_email,
            "delivery_type": o.delivery_type,
            "delivery_address": o.delivery_address,
            "table_number": o.table_number,
            "notes": o.notes,
            "subtotal": o.subtotal,
            "delivery_fee": o.delivery_fee,
            "discount_amount": o.discount_amount,
            "coupon_code": o.coupon_code,
            "total_amount": o.total_amount,
            "status": o.status,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "fawry_ref": o.fawry_ref,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items_count": len(o.items),
            "items": [
                {
                    "product_name": itm.product_name,
                    "unit_price": itm.unit_price,
                    "quantity": itm.quantity,
                    "total_price": itm.total_price,
                    "notes": itm.notes,
                }
                for itm in o.items
            ],
        })

    return {"items": items, "page": page, "page_size": page_size}


@router.post("/modules/storefront/orders/{order_id}/status")
async def update_storefront_order_status(
    order_id: uuid.UUID,
    payload: UpdateStatusIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change storefront order status."""
    tid = current_tenant_id.get() or current_user.tenant_id
    stmt = select(StorefrontOrder).where(StorefrontOrder.id == order_id, StorefrontOrder.tenant_id == tid)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")

    order.status = payload.status
    if payload.status == "completed" and order.payment_method == "cod":
        order.payment_status = "paid"

    await db.commit()
    return {"ok": True, "message": f"تم تحديث حالة الطلب إلى '{payload.status}'", "status": order.status}


@router.get("/modules/storefront/coupons")
async def list_storefront_coupons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List discount coupons for tenant."""
    tid = current_tenant_id.get() or current_user.tenant_id
    stmt = select(StorefrontCoupon).where(StorefrontCoupon.tenant_id == tid).order_by(desc(StorefrontCoupon.created_at))
    coupons = (await db.execute(stmt)).scalars().all()

    return {
        "coupons": [
            {
                "id": str(c.id),
                "code": c.code,
                "discount_percent": c.discount_percent,
                "discount_amount": c.discount_amount,
                "min_order_amount": c.min_order_amount,
                "max_uses": c.max_uses,
                "used_count": c.used_count,
                "valid_until": c.valid_until.isoformat() if c.valid_until else None,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in coupons
        ]
    }


@router.post("/modules/storefront/coupons")
async def create_storefront_coupon(
    payload: CreateCouponIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a discount coupon."""
    tid = current_tenant_id.get() or current_user.tenant_id
    code = payload.code.strip().upper()

    existing = (
        await db.execute(
            select(StorefrontCoupon).where(StorefrontCoupon.tenant_id == tid, StorefrontCoupon.code == code)
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="كود الخصم مسجل بالفعل")

    coupon = StorefrontCoupon(
        id=uuid.uuid4(),
        tenant_id=tid,
        code=code,
        discount_percent=payload.discount_percent,
        discount_amount=payload.discount_amount,
        min_order_amount=payload.min_order_amount,
        max_uses=payload.max_uses,
        valid_until=payload.valid_until,
        is_active=True,
    )
    db.add(coupon)
    await db.commit()
    return {"ok": True, "message": f"تم إنشاء كود الخصم '{code}' بنجاح", "coupon_id": str(coupon.id)}


@router.delete("/modules/storefront/coupons/{coupon_id}")
async def delete_storefront_coupon(
    coupon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate or remove a coupon."""
    tid = current_tenant_id.get() or current_user.tenant_id
    stmt = select(StorefrontCoupon).where(StorefrontCoupon.id == coupon_id, StorefrontCoupon.tenant_id == tid)
    coupon = (await db.execute(stmt)).scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="كود الخصم غير موجود")

    coupon.is_active = False
    await db.commit()
    return {"ok": True, "message": "تم إيقاف تفعيل كود الخصم"}
