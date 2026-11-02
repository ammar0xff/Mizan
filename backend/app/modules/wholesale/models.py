"""Database models for Wholesale & Bulk Distribution module (WHO-01..10)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class WholesaleTieredPrice(TenantScoped, Base):
    """Quantity-Based Tiered Price Schedules (WHO-01)."""
    __tablename__ = "wholesale_tiered_prices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_name: Mapped[str] = mapped_column(String(128), index=True)
    barcode: Mapped[str] = mapped_column(String(64), index=True)
    min_quantity: Mapped[int] = mapped_column(Integer, default=1)
    max_quantity: Mapped[int] = mapped_column(Integer, default=999999)
    tier_name: Mapped[str] = mapped_column(String(64))  # e.g. "شريحة التجزئة", "شريحة الجملة الأولى", "شريحة كبار الموزعين"
    unit_price: Mapped[float] = mapped_column(Float)
    discount_percent: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WholesalePriceList(TenantScoped, Base):
    """Customer-Specific Contracted Price Schedules (WHO-02)."""
    __tablename__ = "wholesale_price_lists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    list_name: Mapped[str] = mapped_column(String(128), index=True)
    customer_class: Mapped[str] = mapped_column(String(64))  # وكيل معتمد، تاجر جملة، سلسلة سوبرماركت
    target_customer: Mapped[str] = mapped_column(String(128), default="كافة عملاء الشريحة")
    currency: Mapped[str] = mapped_column(String(16), default="EGP")
    valid_from: Mapped[str] = mapped_column(String(32))
    valid_to: Mapped[str] = mapped_column(String(32))
    discount_rate: Mapped[float] = mapped_column(Float, default=0.0)
    payment_terms_days: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WholesalePackagingHierarchy(TenantScoped, Base):
    """Bulk Packaging & Unit Hierarchy (WHO-04)."""
    __tablename__ = "wholesale_packaging_hierarchy"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_name: Mapped[str] = mapped_column(String(128), index=True)
    barcode: Mapped[str] = mapped_column(String(64), index=True)
    package_level: Mapped[str] = mapped_column(String(32))  # piece, inner_pack, carton, pallet
    level_label_ar: Mapped[str] = mapped_column(String(64))  # حبة / قطعة، باكت داخلي، كرتونة، باليتة
    units_in_pack: Mapped[int] = mapped_column(Integer, default=1)
    gross_weight_kg: Mapped[float] = mapped_column(Float, default=1.0)
    volume_cbm: Mapped[float] = mapped_column(Float, default=0.01)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class WholesaleCreditExposure(TenantScoped, Base):
    """Credit Ceiling & Overdue Block Sub-Ledger (WHO-06)."""
    __tablename__ = "wholesale_credit_exposures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name: Mapped[str] = mapped_column(String(128), index=True)
    customer_class: Mapped[str] = mapped_column(String(64), default="تاجر جملة")
    approved_credit_limit: Mapped[float] = mapped_column(Float, default=100000.0)
    current_receivables: Mapped[float] = mapped_column(Float, default=0.0)
    unbilled_delivery_notes: Mapped[float] = mapped_column(Float, default=0.0)
    pending_sales_orders: Mapped[float] = mapped_column(Float, default=0.0)
    max_allowed_overdue_days: Mapped[int] = mapped_column(Integer, default=45)
    oldest_overdue_days: Mapped[int] = mapped_column(Integer, default=0)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    block_reason: Mapped[str] = mapped_column(String(256), default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def total_exposure(self) -> float:
        return self.current_receivables + self.unbilled_delivery_notes + self.pending_sales_orders

    @property
    def remaining_credit(self) -> float:
        return max(0.0, self.approved_credit_limit - self.total_exposure)


class WholesaleLandedCost(TenantScoped, Base):
    """Landed Cost Allocation for Imports & Bulk Shipments (WHO-07)."""
    __tablename__ = "wholesale_landed_costs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shipment_reference: Mapped[str] = mapped_column(String(64), index=True)
    origin_country: Mapped[str] = mapped_column(String(64), default="ألمانيا")
    supplier_name: Mapped[str] = mapped_column(String(128))
    fob_goods_value: Mapped[float] = mapped_column(Float, default=0.0)
    freight_charges: Mapped[float] = mapped_column(Float, default=0.0)
    customs_tariffs: Mapped[float] = mapped_column(Float, default=0.0)
    port_clearance_fees: Mapped[float] = mapped_column(Float, default=0.0)
    marine_insurance: Mapped[float] = mapped_column(Float, default=0.0)
    allocation_method: Mapped[str] = mapped_column(String(32), default="value")  # value, weight, volume
    total_landed_cost: Mapped[float] = mapped_column(Float, default=0.0)
    cost_multiplier: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[str] = mapped_column(String(32), default="allocated")  # draft, allocated, posted
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WholesaleDropShipment(TenantScoped, Base):
    """Drop-Shipping Direct Orders (WHO-08)."""
    __tablename__ = "wholesale_drop_shipments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_ref: Mapped[str] = mapped_column(String(64), index=True)
    customer_name: Mapped[str] = mapped_column(String(128), index=True)
    customer_destination: Mapped[str] = mapped_column(String(256))
    supplier_name: Mapped[str] = mapped_column(String(128))
    product_description: Mapped[str] = mapped_column(String(256))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    supplier_po_ref: Mapped[str] = mapped_column(String(64))
    carrier_name: Mapped[str] = mapped_column(String(64), default="أرامكس للشحن")
    tracking_number: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="pending_dispatch")  # pending_dispatch, in_transit, delivered
    is_three_way_reconciled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WholesaleDistributorRebate(TenantScoped, Base):
    """Distributor Target Incentives & Volume Rebates (WHO-10)."""
    __tablename__ = "wholesale_distributor_rebates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    distributor_name: Mapped[str] = mapped_column(String(128), index=True)
    period: Mapped[str] = mapped_column(String(64))  # الربع الثالث 2026، الربع الرابع 2026
    target_sales_amount: Mapped[float] = mapped_column(Float, default=1000000.0)
    achieved_sales_amount: Mapped[float] = mapped_column(Float, default=0.0)
    achievement_percent: Mapped[float] = mapped_column(Float, default=0.0)
    rebate_rate_percent: Mapped[float] = mapped_column(Float, default=3.5)
    rebate_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="accrued")  # accrued, verified, credit_note_issued
    credit_note_ref: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
