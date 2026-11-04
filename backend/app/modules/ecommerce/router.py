"""API router for Omnichannel E-commerce module (ECS-01..12)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.ecommerce.models import (
    EcomAbandonedCart,
    EcomChannelStore,
    EcomCodReconciliation,
    EcomOrderFulfillment,
    EcomReturnRequest,
)

router = APIRouter(prefix="/ecommerce", tags=["ecommerce"])


# ------------------ Schemas ------------------ #
class ChannelStoreCreate(BaseModel):
    platform: str
    store_name: str
    store_url: str
    buffer_stock_percent: float = 10.0


class OrderCreate(BaseModel):
    order_number: str
    channel_platform: str = "Shopify"
    customer_name: str
    customer_phone: str
    shipping_city: str = "القاهرة"
    shipping_address: str
    items_summary: str
    total_amount: float
    payment_gateway: str = "Paymob"
    payment_status: str = "paid"
    courier_name: str = "بوسطة للشحن (Bosta)"


class PackOrderAction(BaseModel):
    courier_name: str = "بوسطة للشحن (Bosta)"


class ShipOrderAction(BaseModel):
    tracking_number: str


class ReturnCreate(BaseModel):
    order_number: str
    customer_name: str
    return_reason: str
    items_count: int = 1
    refund_amount: float


class CodReconciliationCreate(BaseModel):
    remittance_batch: str
    courier_name: str = "بوسطة للشحن السريع"
    orders_count: int
    total_collected_cash: float
    courier_delivery_fees: float
    bank_deposit_reference: str = ""
    settled_date: str


# ------------------ Endpoints ------------------ #
@router.get("/summary")
async def get_ecommerce_summary(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Return key metrics and KPIs across omnichannel e-commerce operations."""
    # Channels
    res_stores = await db.execute(select(func.count(EcomChannelStore.id)))
    stores_count = res_stores.scalar_one() or 0

    # Orders
    res_orders = await db.execute(select(EcomOrderFulfillment))
    orders = res_orders.scalars().all()
    total_orders = len(orders)
    pending_fulfillment = sum(1 for o in orders if o.fulfillment_status in ("unfulfilled", "picking", "packed"))
    total_gmv = sum(o.total_amount for o in orders)
    pending_cod = sum(o.total_amount for o in orders if o.payment_status == "pending_cod" and o.fulfillment_status != "returned")

    # Returns
    res_ret = await db.execute(select(func.count(EcomReturnRequest.id)))
    open_returns = res_ret.scalar_one() or 0

    # Abandoned Carts
    res_carts = await db.execute(select(EcomAbandonedCart))
    carts = res_carts.scalars().all()
    total_carts = len(carts)
    recovered_revenue = sum(c.recovered_amount for c in carts if c.recovery_status == "recovered")

    return {
        "stores_count": stores_count,
        "total_orders": total_orders,
        "pending_fulfillment": pending_fulfillment,
        "total_gmv": round(total_gmv, 2),
        "pending_cod_amount": round(pending_cod, 2),
        "open_returns_count": open_returns,
        "total_abandoned_carts": total_carts,
        "recovered_revenue": round(recovered_revenue, 2),
    }


@router.get("/stores")
async def list_stores(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomChannelStore).order_by(EcomChannelStore.store_name))
    return res.scalars().all()


@router.post("/stores")
async def create_store(
    body: ChannelStoreCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    store = EcomChannelStore(**body.model_dump())
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


@router.post("/stores/{id}/sync")
async def trigger_store_sync(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomChannelStore).where(EcomChannelStore.id == id))
    store = res.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="المتجر غير موجود")
    store.sync_status = "connected"
    store.last_sync_time = "الآن (مزامنة مكتملة)"
    await db.commit()
    return {"status": "success", "sync_status": store.sync_status, "last_sync": store.last_sync_time}


@router.get("/orders")
async def list_orders(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomOrderFulfillment).order_by(desc(EcomOrderFulfillment.created_at)))
    return res.scalars().all()


@router.post("/orders")
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    order = EcomOrderFulfillment(**body.model_dump(), fulfillment_status="unfulfilled")
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/orders/{id}/pack")
async def pack_order(
    id: str,
    body: PackOrderAction,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomOrderFulfillment).where(EcomOrderFulfillment.id == id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    order.fulfillment_status = "packed"
    order.courier_name = body.courier_name
    order.shipping_label_barcode = f"LBL-{uuid.uuid4().hex[:8].upper()}"
    await db.commit()
    return {"status": "success", "order_status": order.fulfillment_status, "label": order.shipping_label_barcode}


@router.post("/orders/{id}/ship")
async def ship_order(
    id: str,
    body: ShipOrderAction,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomOrderFulfillment).where(EcomOrderFulfillment.id == id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    order.fulfillment_status = "shipped"
    order.tracking_number = body.tracking_number
    await db.commit()
    return {"status": "success", "order_status": order.fulfillment_status, "tracking": order.tracking_number}


@router.get("/returns")
async def list_returns(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomReturnRequest).order_by(desc(EcomReturnRequest.created_at)))
    return res.scalars().all()


@router.post("/returns")
async def create_return(
    body: ReturnCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    rma_code = f"RMA-{uuid.uuid4().hex[:6].upper()}"
    rma = EcomReturnRequest(
        rma_number=rma_code,
        **body.model_dump(),
        status="requested",
    )
    db.add(rma)
    await db.commit()
    await db.refresh(rma)
    return rma


@router.post("/returns/{id}/restock")
async def restock_and_refund_return(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomReturnRequest).where(EcomReturnRequest.id == id))
    rma = res.scalar_one_or_none()
    if not rma:
        raise HTTPException(status_code=404, detail="طلب الاسترجاع غير موجود")
    rma.status = "restocked_refunded"
    rma.restocked_to_inventory = True
    await db.commit()
    return {"status": "success", "return_status": rma.status, "restocked": True}


@router.get("/cod-reconciliations")
async def list_cod_reconciliations(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomCodReconciliation).order_by(desc(EcomCodReconciliation.settled_date)))
    return res.scalars().all()


@router.post("/cod-reconciliations")
async def create_cod_reconciliation(
    body: CodReconciliationCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    net = body.total_collected_cash - body.courier_delivery_fees
    rec = EcomCodReconciliation(
        **body.model_dump(),
        net_remitted_amount=round(net, 2),
        status="received",
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.get("/abandoned-carts")
async def list_abandoned_carts(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomAbandonedCart).order_by(desc(EcomAbandonedCart.cart_total)))
    return res.scalars().all()


@router.post("/abandoned-carts/{id}/send-reminder")
async def send_cart_recovery_reminder(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(EcomAbandonedCart).where(EcomAbandonedCart.id == id))
    cart = res.scalar_one_or_none()
    if not cart:
        raise HTTPException(status_code=404, detail="السلة غير موجودة")
    cart.recovery_status = "reminder_sent"
    await db.commit()
    return {
        "status": "success",
        "cart_status": cart.recovery_status,
        "message": f"تم إرسال تذكير بالواتساب للعميل {cart.customer_name} مع كود خصم {cart.discount_coupon}",
    }


@router.post("/seed")
async def seed_ecommerce_sample_data(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Seed initial sample online channels, orders, RMAs, COD remittances, and abandoned carts."""
    res = await db.execute(select(func.count(EcomChannelStore.id)))
    count = res.scalar_one() or 0
    if count > 0:
        return {"status": "already_seeded", "message": "بيانات التجارة الإلكترونية موجودة بالفعل"}

    # 1. Connected Channels
    stores = [
        EcomChannelStore(
            platform="Shopify",
            store_name="متجر ميزان فاشون الإلكتروني",
            store_url="https://mizan-fashion.myshopify.com",
            sync_status="connected",
            last_sync_time="منذ 4 دقائق",
            buffer_stock_percent=10.0,
            total_synced_products=184,
            total_orders_imported=540,
        ),
        EcomChannelStore(
            platform="Amazon",
            store_name="سوق أمازون مصر (Amazon.eg Vendor)",
            store_url="https://sellercentral.amazon.eg",
            sync_status="connected",
            last_sync_time="منذ 12 دقيقة",
            buffer_stock_percent=15.0,
            total_synced_products=92,
            total_orders_imported=310,
        ),
        EcomChannelStore(
            platform="Salla",
            store_name="متجر ميزان الخليج - سلة",
            store_url="https://salla.sa/mizan-gulf",
            sync_status="connected",
            last_sync_time="منذ 30 دقيقة",
            buffer_stock_percent=10.0,
            total_synced_products=65,
            total_orders_imported=195,
        ),
    ]
    db.add_all(stores)

    # 2. Orders
    orders = [
        EcomOrderFulfillment(
            order_number="ORD-SHOP-9921",
            channel_platform="Shopify",
            customer_name="سارة محمود عبد الفتاح",
            customer_phone="01099887766",
            shipping_city="القاهرة",
            shipping_address="كمبوند ميفيدا، التجمع الخامس، شقة 14",
            items_summary="فستان صيفي مطرز (قطعة 1) + شال حرير طبيعي (قطعة 1)",
            total_amount=1850.0,
            payment_gateway="Paymob - بطاقة بنكية",
            payment_status="paid",
            fulfillment_status="unfulfilled",
            courier_name="بوسطة للشحن (Bosta)",
        ),
        EcomOrderFulfillment(
            order_number="ORD-AMZ-4412",
            channel_platform="Amazon",
            customer_name="خالد إبراهيم دسوقي",
            customer_phone="01122334455",
            shipping_city="الجيزة",
            shipping_address="الدقي، شارع مصدق، عمارة 22",
            items_summary="حذاء كاجوال جلد طبيعي مقاس 43 (قطعة 1)",
            total_amount=950.0,
            payment_gateway="الدفع عند الاستلام (COD)",
            payment_status="pending_cod",
            fulfillment_status="packed",
            courier_name="بوسطة للشحن (Bosta)",
            shipping_label_barcode="LBL-BOSTA-77192",
        ),
        EcomOrderFulfillment(
            order_number="ORD-SALLA-1105",
            channel_platform="Salla",
            customer_name="عبد العزيز ناصر القحطاني",
            customer_phone="+966501234567",
            shipping_city="الرياض",
            shipping_address="حي الملقا، طريق أنس بن مالك",
            items_summary="طقم عطور فاخرة مخلط العود (عدد 2)",
            total_amount=3400.0,
            payment_gateway="تابي (Tabby) - تقسيط",
            payment_status="paid",
            fulfillment_status="shipped",
            courier_name="أرامكس إكسبريس (Aramex)",
            tracking_number="ARX-KSA-9908123",
            shipping_label_barcode="LBL-ARX-55102",
        ),
    ]
    db.add_all(orders)

    # 3. RMAs
    returns = [
        EcomReturnRequest(
            rma_number="RMA-2026-0041",
            order_number="ORD-SHOP-9810",
            customer_name="ياسمين الشريف",
            return_reason="مقاس الحذاء أصغر من المطلوب ويرغب العميل في الاستبدال",
            items_count=1,
            refund_amount=850.0,
            status="requested",
        )
    ]
    db.add_all(returns)

    # 4. COD Reconciliation
    cods = [
        EcomCodReconciliation(
            remittance_batch="COD-BOSTA-BATCH-2026-44",
            courier_name="بوسطة للشحن السريع",
            orders_count=22,
            total_collected_cash=28600.0,
            courier_delivery_fees=1760.0,
            net_remitted_amount=26840.0,
            status="received",
            bank_deposit_reference="CIB-DEP-99410",
            settled_date="2026-11-01",
        )
    ]
    db.add_all(cods)

    # 5. Abandoned Carts
    carts = [
        EcomAbandonedCart(
            cart_token="CART-TOK-99238",
            customer_name="كريم مدحت المهدي",
            customer_phone="01015667788",
            customer_email="karim.medhat@gmail.com",
            cart_total=2400.0,
            items_preview="ساعة يد كلاسيك فضية + حزام جلد بني",
            abandoned_time_ago="منذ ساعة ونصف",
            recovery_status="abandoned",
            discount_coupon="RECOVER10",
        ),
        EcomAbandonedCart(
            cart_token="CART-TOK-88102",
            customer_name="مها السعيد زكي",
            customer_phone="01288776655",
            customer_email="maha.saeed@outlook.com",
            cart_total=1600.0,
            items_preview="حقيبة يد جلد إيطالي بيج",
            abandoned_time_ago="منذ 4 ساعات",
            recovery_status="recovered",
            discount_coupon="RECOVER10",
            recovered_amount=1440.0,
        ),
    ]
    db.add_all(carts)

    await db.commit()
    return {"status": "seeded", "message": "تم تهيئة بيانات التجارة الإلكترونية بنجاح"}
