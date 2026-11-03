"""Seed demo storefront settings, coupons, and customer web orders for Vendora tenants."""
import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from app.db.base import AsyncSessionLocal
from app.models.tenant import Tenant
from app.models.product import Product
from app.modules.storefront.models import (
    StorefrontConfig,
    StorefrontOrder,
    StorefrontOrderItem,
    StorefrontCoupon,
)
from sqlalchemy import select

async def seed_storefront():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Tenant))
        tenants = res.scalars().all()
        if not tenants:
            print("No tenants found!")
            return

        for tenant in tenants:
            print(f"--- Processing storefront for tenant: {tenant.name} ({tenant.slug}) ---")

            # 0. Enable module
            mods = list(tenant.active_modules or [])
            if "storefront" not in mods:
                mods.append("storefront")
                tenant.active_modules = mods
                print("✓ Added storefront to active_modules")

            # 1. Config
            stmt_cfg = select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id)
            cfg = (await session.execute(stmt_cfg)).scalar_one_or_none()
            if not cfg:
                cfg = StorefrontConfig(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    store_title=f"متجر {tenant.name} الإلكتروني",
                    tagline="تسوق أونلاين بأفضل الأسعار مع التوصيل السريع والدفع عند الاستلام",
                    brand_color="#0f766e" if "german" in (tenant.slug or "") else "#b45309",
                    announcement="🚚 كود خصم WELCOME10 لخصم 10% على كافة الطلبات • توصيل مجاني فوق 350 ج.م",
                    whatsapp_number="201099887766",
                    delivery_fee=25.0,
                    free_delivery_above=350.0,
                    min_order_amount=50.0,
                    allow_delivery=True,
                    allow_pickup=True,
                    allow_dine_in=True,
                    is_active=True,
                    social_instagram="https://instagram.com/vendora.erp",
                    social_facebook="https://facebook.com/vendora.erp",
                )
                session.add(cfg)
                print("✓ Seeded StorefrontConfig")

            # 2. Coupons
            stmt_c = select(StorefrontCoupon).where(StorefrontCoupon.tenant_id == tenant.id)
            coupons = (await session.execute(stmt_c)).scalars().all()
            if not coupons:
                now = datetime.now(UTC)
                c1 = StorefrontCoupon(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    code="WELCOME10",
                    discount_percent=10.0,
                    min_order_amount=100.0,
                    max_uses=1000,
                    used_count=14,
                    valid_until=now + timedelta(days=90),
                    is_active=True,
                )
                c2 = StorefrontCoupon(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    code="SAVE50",
                    discount_amount=50.0,
                    min_order_amount=300.0,
                    max_uses=500,
                    used_count=8,
                    valid_until=now + timedelta(days=60),
                    is_active=True,
                )
                session.add_all([c1, c2])
                print("✓ Seeded StorefrontCoupons (WELCOME10, SAVE50)")

            # 3. Orders
            stmt_o = select(StorefrontOrder).where(StorefrontOrder.tenant_id == tenant.id)
            existing_orders = (await session.execute(stmt_o)).scalars().first()
            if not existing_orders:
                # Fetch products for real items
                res_p = await session.execute(select(Product).where(Product.tenant_id == tenant.id).limit(6))
                prods = res_p.scalars().all()

                now = datetime.now(UTC)
                p1 = prods[0] if len(prods) > 0 else None
                p2 = prods[1] if len(prods) > 1 else None

                o1 = StorefrontOrder(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    order_number=f"ORD-{now.strftime('%Y%m')}-1049",
                    customer_name="أحمد محمود السيد",
                    customer_phone="01012345678",
                    customer_email="ahmed.m@example.com",
                    delivery_type="delivery",
                    delivery_address="الدقي، شارع مصدق، عمارة 14، الدور الخامس",
                    notes="يرجى الاتصال قبل الوصول بـ 10 دقائق",
                    subtotal=240.0,
                    delivery_fee=25.0,
                    discount_amount=24.0,
                    coupon_code="WELCOME10",
                    total_amount=241.0,
                    status="pending",
                    payment_method="cod",
                    payment_status="unpaid",
                    created_at=now - timedelta(minutes=25),
                )
                session.add(o1)

                if p1:
                    session.add(StorefrontOrderItem(
                        id=uuid.uuid4(),
                        order_id=o1.id,
                        product_id=p1.id,
                        product_name=p1.name,
                        unit_price=float(p1.retail_price or 120.0),
                        quantity=2.0,
                        total_price=float(p1.retail_price or 120.0) * 2,
                    ))

                o2 = StorefrontOrder(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    order_number=f"ORD-{now.strftime('%Y%m')}-1050",
                    customer_name="سارة إبراهيم حسن",
                    customer_phone="01198765432",
                    customer_email="sara.h@example.com",
                    delivery_type="pickup",
                    notes="استلام من الفرع الرئيسي",
                    subtotal=450.0,
                    delivery_fee=0.0,
                    discount_amount=0.0,
                    total_amount=450.0,
                    status="preparing",
                    payment_method="fawry",
                    payment_status="paid",
                    fawry_ref="7883920194",
                    created_at=now - timedelta(hours=2),
                )
                session.add(o2)

                if p2:
                    session.add(StorefrontOrderItem(
                        id=uuid.uuid4(),
                        order_id=o2.id,
                        product_id=p2.id,
                        product_name=p2.name,
                        unit_price=float(p2.retail_price or 150.0),
                        quantity=3.0,
                        total_price=float(p2.retail_price or 150.0) * 3,
                    ))

                print("✓ Seeded StorefrontOrders with items")

        await session.commit()
        print("All storefront demo data seeded successfully across tenants!")

if __name__ == "__main__":
    asyncio.run(seed_storefront())
