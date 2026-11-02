"""API router for Wholesale & Bulk Distribution module (WHO-01..10)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.wholesale.models import (
    WholesaleCreditExposure,
    WholesaleDistributorRebate,
    WholesaleDropShipment,
    WholesaleLandedCost,
    WholesalePackagingHierarchy,
    WholesalePriceList,
    WholesaleTieredPrice,
)

router = APIRouter(prefix="/wholesale", tags=["wholesale"])


# ------------------ Request Schemas ------------------ #
class TieredPriceCreate(BaseModel):
    product_name: str
    barcode: str
    min_quantity: int
    max_quantity: int
    tier_name: str
    unit_price: float
    discount_percent: float = 0.0


class PriceListCreate(BaseModel):
    list_name: str
    customer_class: str
    target_customer: str = "كافة عملاء الشريحة"
    currency: str = "EGP"
    valid_from: str
    valid_to: str
    discount_rate: float = 0.0
    payment_terms_days: int = 30


class PackagingCreate(BaseModel):
    product_name: str
    barcode: str
    package_level: str
    level_label_ar: str
    units_in_pack: int
    gross_weight_kg: float = 1.0
    volume_cbm: float = 0.01


class CreditBlockToggle(BaseModel):
    is_blocked: bool
    block_reason: str = ""


class LandedCostCreate(BaseModel):
    shipment_reference: str
    origin_country: str = "ألمانيا"
    supplier_name: str
    fob_goods_value: float
    freight_charges: float
    customs_tariffs: float
    port_clearance_fees: float
    marine_insurance: float
    allocation_method: str = "value"
    notes: str = ""


class DropShipmentCreate(BaseModel):
    order_ref: str
    customer_name: str
    customer_destination: str
    supplier_name: str
    product_description: str
    quantity: int
    supplier_po_ref: str
    carrier_name: str = "أرامكس للشحن"
    tracking_number: str


class DropShipmentStatusUpdate(BaseModel):
    status: str
    is_three_way_reconciled: bool = False


# ------------------ Endpoints ------------------ #
@router.get("/summary")
async def get_wholesale_summary(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Return overview metrics and KPIs for wholesale operations."""
    # Count price lists
    res_lists = await db.execute(select(func.count(WholesalePriceList.id)))
    price_lists_count = res_lists.scalar_one() or 0

    # Count tiered pricing rules
    res_tiers = await db.execute(select(func.count(WholesaleTieredPrice.id)))
    tiered_rules_count = res_tiers.scalar_one() or 0

    # Credit exposure stats
    res_credit = await db.execute(select(WholesaleCreditExposure))
    exposures = res_credit.scalars().all()
    total_exposure = sum(e.total_exposure for e in exposures)
    total_limits = sum(e.approved_credit_limit for e in exposures)
    blocked_count = sum(1 for e in exposures if e.is_blocked)

    # Landed cost volume
    res_landed = await db.execute(select(func.sum(WholesaleLandedCost.total_landed_cost)))
    total_landed_volume = res_landed.scalar_one() or 0.0

    # Active drop shipments
    res_drop = await db.execute(select(func.count(WholesaleDropShipment.id)))
    drop_shipments_count = res_drop.scalar_one() or 0

    # Accrued Rebates
    res_rebates = await db.execute(select(func.sum(WholesaleDistributorRebate.rebate_amount)))
    total_accrued_rebates = res_rebates.scalar_one() or 0.0

    return {
        "price_lists_count": price_lists_count,
        "tiered_rules_count": tiered_rules_count,
        "total_credit_exposure": round(total_exposure, 2),
        "total_approved_limits": round(total_limits, 2),
        "credit_utilization_percent": round((total_exposure / total_limits * 100), 1) if total_limits > 0 else 0,
        "blocked_distributors_count": blocked_count,
        "total_landed_cost_volume": round(total_landed_volume, 2),
        "drop_shipments_count": drop_shipments_count,
        "total_accrued_rebates": round(total_accrued_rebates, 2),
    }


@router.get("/tiered-prices")
async def list_tiered_prices(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleTieredPrice).order_by(WholesaleTieredPrice.product_name, WholesaleTieredPrice.min_quantity))
    return res.scalars().all()


@router.post("/tiered-prices")
async def create_tiered_price(
    body: TieredPriceCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    rule = WholesaleTieredPrice(**body.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get("/price-lists")
async def list_price_lists(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesalePriceList).order_by(desc(WholesalePriceList.created_at)))
    return res.scalars().all()


@router.post("/price-lists")
async def create_price_list(
    body: PriceListCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    plist = WholesalePriceList(**body.model_dump())
    db.add(plist)
    await db.commit()
    await db.refresh(plist)
    return plist


@router.get("/packaging")
async def list_packaging_hierarchy(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesalePackagingHierarchy).order_by(WholesalePackagingHierarchy.product_name, WholesalePackagingHierarchy.units_in_pack))
    return res.scalars().all()


@router.post("/packaging")
async def create_packaging_hierarchy(
    body: PackagingCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    item = WholesalePackagingHierarchy(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/credit-limits")
async def list_credit_limits(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleCreditExposure).order_by(desc(WholesaleCreditExposure.is_blocked)))
    rows = res.scalars().all()
    # serialize with properties
    return [
        {
            "id": r.id,
            "customer_name": r.customer_name,
            "customer_class": r.customer_class,
            "approved_credit_limit": r.approved_credit_limit,
            "current_receivables": r.current_receivables,
            "unbilled_delivery_notes": r.unbilled_delivery_notes,
            "pending_sales_orders": r.pending_sales_orders,
            "total_exposure": r.total_exposure,
            "remaining_credit": r.remaining_credit,
            "max_allowed_overdue_days": r.max_allowed_overdue_days,
            "oldest_overdue_days": r.oldest_overdue_days,
            "is_blocked": r.is_blocked,
            "block_reason": r.block_reason,
        }
        for r in rows
    ]


@router.post("/credit-limits/{id}/block")
async def toggle_credit_block(
    id: str,
    body: CreditBlockToggle,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleCreditExposure).where(WholesaleCreditExposure.id == id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="سجل الائتمان غير موجود")
    rec.is_blocked = body.is_blocked
    rec.block_reason = body.block_reason if body.is_blocked else ""
    await db.commit()
    return {"status": "success", "is_blocked": rec.is_blocked, "block_reason": rec.block_reason}


@router.get("/landed-costs")
async def list_landed_costs(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleLandedCost).order_by(desc(WholesaleLandedCost.created_at)))
    return res.scalars().all()


@router.post("/landed-costs")
async def create_landed_cost(
    body: LandedCostCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    total = (
        body.fob_goods_value
        + body.freight_charges
        + body.customs_tariffs
        + body.port_clearance_fees
        + body.marine_insurance
    )
    multiplier = (total / body.fob_goods_value) if body.fob_goods_value > 0 else 1.0

    entry = WholesaleLandedCost(
        **body.model_dump(),
        total_landed_cost=round(total, 2),
        cost_multiplier=round(multiplier, 4),
        status="allocated",
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/drop-shipments")
async def list_drop_shipments(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleDropShipment).order_by(desc(WholesaleDropShipment.created_at)))
    return res.scalars().all()


@router.post("/drop-shipments")
async def create_drop_shipment(
    body: DropShipmentCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    entry = WholesaleDropShipment(**body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/drop-shipments/{id}/status")
async def update_drop_shipment_status(
    id: str,
    body: DropShipmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleDropShipment).where(WholesaleDropShipment.id == id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="إرسالية الشحن المباشر غير موجودة")
    rec.status = body.status
    rec.is_three_way_reconciled = body.is_three_way_reconciled
    await db.commit()
    return {"status": "success", "record_status": rec.status, "reconciled": rec.is_three_way_reconciled}


@router.get("/rebates")
async def list_distributor_rebates(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleDistributorRebate).order_by(desc(WholesaleDistributorRebate.created_at)))
    return res.scalars().all()


@router.post("/rebates/{id}/issue-credit-note")
async def issue_rebate_credit_note(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WholesaleDistributorRebate).where(WholesaleDistributorRebate.id == id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="عقد المكافأة غير موجود")
    rec.status = "credit_note_issued"
    rec.credit_note_ref = f"CRN-WHO-{uuid.uuid4().hex[:6].upper()}"
    await db.commit()
    return {"status": "success", "credit_note_ref": rec.credit_note_ref}


@router.post("/seed")
async def seed_wholesale_sample_data(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Seed comprehensive initial data for Wholesale distribution if tables are empty."""
    res = await db.execute(select(func.count(WholesalePriceList.id)))
    count = res.scalar_one() or 0
    if count > 0:
        return {"status": "already_seeded", "message": "بيانات الجملة والتوزيع موجودة بالفعل"}

    # 1. Tiered Pricing
    tiers = [
        WholesaleTieredPrice(
            product_name="زيت طعام ذرة نقي 1 لتر",
            barcode="6221001234567",
            min_quantity=1,
            max_quantity=99,
            tier_name="شريحة التجزئة الصغرى",
            unit_price=85.0,
            discount_percent=0.0,
        ),
        WholesaleTieredPrice(
            product_name="زيت طعام ذرة نقي 1 لتر",
            barcode="6221001234567",
            min_quantity=100,
            max_quantity=499,
            tier_name="شريحة المحلات والسوبرماركت",
            unit_price=78.5,
            discount_percent=7.6,
        ),
        WholesaleTieredPrice(
            product_name="زيت طعام ذرة نقي 1 لتر",
            barcode="6221001234567",
            min_quantity=500,
            max_quantity=999999,
            tier_name="شريحة كبار الموزعين والتوكيلات",
            unit_price=72.0,
            discount_percent=15.3,
        ),
        WholesaleTieredPrice(
            product_name="أرز مصري فاخر حبة عريضة 5 كجم",
            barcode="6222009876543",
            min_quantity=1,
            max_quantity=49,
            tier_name="تجزئة ونصف جملة",
            unit_price=160.0,
            discount_percent=0.0,
        ),
        WholesaleTieredPrice(
            product_name="أرز مصري فاخر حبة عريضة 5 كجم",
            barcode="6222009876543",
            min_quantity=50,
            max_quantity=999999,
            tier_name="باليتات كبار تجار الحبوب",
            unit_price=142.0,
            discount_percent=11.25,
        ),
    ]
    db.add_all(tiers)

    # 2. Contracted Price Lists
    plists = [
        WholesalePriceList(
            list_name="قائمة أسعار التوكيلات والموزعين الحصريين (Class A)",
            customer_class="وكيل رئيسي معتمد",
            target_customer="موزعو قطاع الدلتا والقاهرة الكبرى",
            currency="EGP",
            valid_from="2026-01-01",
            valid_to="2026-12-31",
            discount_rate=14.5,
            payment_terms_days=60,
        ),
        WholesalePriceList(
            list_name="قائمة أسعار سلاسل الهايبرماركت والتجزئة الكبرى",
            customer_class="سلاسل تجارية كبرى (Key Accounts)",
            target_customer="كارفور، لولو ماركت، سبينيس",
            currency="EGP",
            valid_from="2026-06-01",
            valid_to="2026-12-31",
            discount_rate=9.0,
            payment_terms_days=45,
        ),
    ]
    db.add_all(plists)

    # 3. Packaging Hierarchy
    packaging = [
        WholesalePackagingHierarchy(
            product_name="زيت طعام ذرة نقي 1 لتر",
            barcode="6221001234567",
            package_level="piece",
            level_label_ar="زجاجة منفردة (قطعة)",
            units_in_pack=1,
            gross_weight_kg=0.95,
            volume_cbm=0.0012,
        ),
        WholesalePackagingHierarchy(
            product_name="زيت طعام ذرة نقي 1 لتر",
            barcode="6221001234567-BOX",
            package_level="carton",
            level_label_ar="كرتونة تصدير (12 زجاجة)",
            units_in_pack=12,
            gross_weight_kg=11.8,
            volume_cbm=0.016,
        ),
        WholesalePackagingHierarchy(
            product_name="زيت طعام ذرة نقي 1 لتر",
            barcode="6221001234567-PAL",
            package_level="pallet",
            level_label_ar="باليتة خشبية شحن (60 كرتونة / 720 زجاجة)",
            units_in_pack=720,
            gross_weight_kg=720.0,
            volume_cbm=1.2,
        ),
    ]
    db.add_all(packaging)

    # 4. Credit Exposures
    credit_exposures = [
        WholesaleCreditExposure(
            customer_name="شركة النور للتجارة والتوريدات العامة",
            customer_class="وكيل رئيسي",
            approved_credit_limit=500000.0,
            current_receivables=340000.0,
            unbilled_delivery_notes=45000.0,
            pending_sales_orders=30000.0,
            max_allowed_overdue_days=45,
            oldest_overdue_days=22,
            is_blocked=False,
        ),
        WholesaleCreditExposure(
            customer_name="مؤسسة الفيروز لتجارة الجملة والمواد الغذائية",
            customer_class="تاجر جملة",
            approved_credit_limit=250000.0,
            current_receivables=265000.0,
            unbilled_delivery_notes=20000.0,
            pending_sales_orders=15000.0,
            max_allowed_overdue_days=30,
            oldest_overdue_days=58,
            is_blocked=True,
            block_reason="تجاوز سقف الائتمان المعتمد ووجود فواتير متأخرة لأكثر من 58 يوماً",
        ),
        WholesaleCreditExposure(
            customer_name="سلاسل التوحيد ماركت للسلع الاستهلاكية",
            customer_class="سلاسل تجارية",
            approved_credit_limit=1000000.0,
            current_receivables=420000.0,
            unbilled_delivery_notes=80000.0,
            pending_sales_orders=50000.0,
            max_allowed_overdue_days=60,
            oldest_overdue_days=18,
            is_blocked=False,
        ),
    ]
    db.add_all(credit_exposures)

    # 5. Landed Costs
    landed_costs = [
        WholesaleLandedCost(
            shipment_reference="IMP-2026-HAM-089",
            origin_country="ألمانيا (ميناء هامبورغ)",
            supplier_name="Bayer Agro Chemical Supplies GmbH",
            fob_goods_value=450000.0,
            freight_charges=62000.0,
            customs_tariffs=48000.0,
            port_clearance_fees=18500.0,
            marine_insurance=9500.0,
            allocation_method="value",
            total_landed_cost=588000.0,
            cost_multiplier=1.3067,
            status="allocated",
            notes="شحنة حاوية 40 قدم مواد خام زراعية عبر ميناء الإسكندرية الجمركي",
        )
    ]
    db.add_all(landed_costs)

    # 6. Drop-Shipments
    drops = [
        WholesaleDropShipment(
            order_ref="SO-DS-9901",
            customer_name="مصنع النورس للصناعات البلاستيكية",
            customer_destination="المنطقة الصناعية الثالثة، مدينة العاشر من رمضان",
            supplier_name="شركة سابك للبتروكيماويات",
            product_description="حبيبات بوليمر عالي الكثافة (HDPE) - 5 أطنان",
            quantity=5,
            supplier_po_ref="PO-SUPP-8812",
            carrier_name="أسطول سابك اللوجستي المباشر",
            tracking_number="TRK-SABIC-44021",
            status="in_transit",
            is_three_way_reconciled=False,
        )
    ]
    db.add_all(drops)

    # 7. Distributor Rebates
    rebates = [
        WholesaleDistributorRebate(
            distributor_name="شركة النور للتجارة والتوريدات العامة",
            period="الربع الثالث 2026",
            target_sales_amount=2000000.0,
            achieved_sales_amount=2450000.0,
            achievement_percent=122.5,
            rebate_rate_percent=4.0,
            rebate_amount=98000.0,
            status="accrued",
        )
    ]
    db.add_all(rebates)

    await db.commit()
    return {"status": "seeded", "message": "تم تهيئة بيانات الجملة والتوزيع التجريبية بنجاح"}
