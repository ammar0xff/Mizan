"""Database models for Omnichannel E-commerce module (ECS-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class EcomChannelStore(TenantScoped, Base):
    """Connected Stores & Marketplaces (ECS-01, ECS-02)."""
    __tablename__ = "ecom_channel_stores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform: Mapped[str] = mapped_column(String(32))  # Shopify, WooCommerce, Amazon, Noon, Salla, Zid
    store_name: Mapped[str] = mapped_column(String(128), index=True)
    store_url: Mapped[str] = mapped_column(String(256))
    sync_status: Mapped[str] = mapped_column(String(32), default="connected")  # connected, syncing, warning, disconnected
    last_sync_time: Mapped[str] = mapped_column(String(32), default="منذ 5 دقائق")
    buffer_stock_percent: Mapped[float] = mapped_column(Float, default=10.0)
    total_synced_products: Mapped[int] = mapped_column(Integer, default=0)
    total_orders_imported: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EcomOrderFulfillment(TenantScoped, Base):
    """Consolidated Online Orders & Pick-Pack-Ship Workflow (ECS-04, ECS-05, ECS-06, ECS-10)."""
    __tablename__ = "ecom_order_fulfillments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    channel_platform: Mapped[str] = mapped_column(String(32), default="Shopify")
    customer_name: Mapped[str] = mapped_column(String(128), index=True)
    customer_phone: Mapped[str] = mapped_column(String(32))
    shipping_city: Mapped[str] = mapped_column(String(64), default="القاهرة")
    shipping_address: Mapped[str] = mapped_column(String(256))
    items_summary: Mapped[str] = mapped_column(String(256))
    total_amount: Mapped[float] = mapped_column(Float)
    payment_gateway: Mapped[str] = mapped_column(String(64), default="Paymob")  # Paymob, Fawry, Stripe, Tabby, Cash on Delivery (COD)
    payment_status: Mapped[str] = mapped_column(String(32), default="paid")  # paid, pending_cod, refunded
    fulfillment_status: Mapped[str] = mapped_column(String(32), default="unfulfilled")  # unfulfilled, picking, packed, shipped, delivered, returned
    courier_name: Mapped[str] = mapped_column(String(64), default="بوسطة للشحن (Bosta)")
    tracking_number: Mapped[str] = mapped_column(String(64), default="")
    shipping_label_barcode: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EcomReturnRequest(TenantScoped, Base):
    """Return Merchandise Authorization (RMA) & Inspection (ECS-07)."""
    __tablename__ = "ecom_return_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rma_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    order_number: Mapped[str] = mapped_column(String(64), index=True)
    customer_name: Mapped[str] = mapped_column(String(128))
    return_reason: Mapped[str] = mapped_column(String(128))
    items_count: Mapped[int] = mapped_column(Integer, default=1)
    refund_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="requested")  # requested, approved, received_inspected, restocked_refunded, rejected
    restocked_to_inventory: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EcomCodReconciliation(TenantScoped, Base):
    """Cash on Delivery (COD) Remittance & Courier Reconciliation (ECS-08)."""
    __tablename__ = "ecom_cod_reconciliations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    remittance_batch: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    courier_name: Mapped[str] = mapped_column(String(64), default="بوسطة للشحن السريع")
    orders_count: Mapped[int] = mapped_column(Integer, default=1)
    total_collected_cash: Mapped[float] = mapped_column(Float)
    courier_delivery_fees: Mapped[float] = mapped_column(Float)
    net_remitted_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="received")  # pending, received, discrepancy
    bank_deposit_reference: Mapped[str] = mapped_column(String(64), default="")
    settled_date: Mapped[str] = mapped_column(String(32))


class EcomAbandonedCart(TenantScoped, Base):
    """Abandoned Cart Tracking & Automated Recovery (ECS-12)."""
    __tablename__ = "ecom_abandoned_carts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(128))
    customer_phone: Mapped[str] = mapped_column(String(32))
    customer_email: Mapped[str] = mapped_column(String(64))
    cart_total: Mapped[float] = mapped_column(Float)
    items_preview: Mapped[str] = mapped_column(String(256))
    abandoned_time_ago: Mapped[str] = mapped_column(String(64), default="منذ ساعتين")
    recovery_status: Mapped[str] = mapped_column(String(32), default="abandoned")  # abandoned, reminder_sent, recovered
    discount_coupon: Mapped[str] = mapped_column(String(32), default="SAVE10")
    recovered_amount: Mapped[float] = mapped_column(Float, default=0.0)
