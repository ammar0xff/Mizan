"""Database Models for Tenant Storefront Module."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StorefrontConfig(Base):
    __tablename__ = "storefront_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    store_title: Mapped[str] = mapped_column(String(128), default="متجرنا الإلكتروني")
    tagline: Mapped[str | None] = mapped_column(String(255), default="تسوق أفضل المنتجات مع خدمة التوصيل السريع")
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    brand_color: Mapped[str] = mapped_column(String(32), default="#0f766e")
    announcement: Mapped[str | None] = mapped_column(
        String(255),
        default="🚚 توصيل مجاني للطلبات بقيمة 500 ج.م أو أكثر • ادفع عند الاستلام أو عبر فوري وإنستاباي",
    )
    whatsapp_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    delivery_fee: Mapped[float] = mapped_column(Float, default=30.0)
    free_delivery_above: Mapped[float | None] = mapped_column(Float, default=500.0, nullable=True)
    min_order_amount: Mapped[float] = mapped_column(Float, default=50.0)
    allow_delivery: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_pickup: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_dine_in: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    social_instagram: Mapped[str | None] = mapped_column(String(255), nullable=True)
    social_facebook: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())


class StorefrontOrder(Base):
    __tablename__ = "storefront_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    order_number: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(128), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # delivery | pickup | dine_in
    delivery_type: Mapped[str] = mapped_column(String(32), default="delivery")
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    table_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    delivery_fee: Mapped[float] = mapped_column(Float, default=0.0)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    coupon_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)

    # pending | confirmed | preparing | out_for_delivery | completed | cancelled
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)

    # cod | fawry | instapay | card
    payment_method: Mapped[str] = mapped_column(String(32), default="cod")
    payment_status: Mapped[str] = mapped_column(String(32), default="unpaid")
    fawry_ref: Mapped[str | None] = mapped_column(String(32), nullable=True)

    items: Mapped[list[StorefrontOrderItem]] = relationship(
        "StorefrontOrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())


class StorefrontOrderItem(Base):
    __tablename__ = "storefront_order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("storefront_orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    total_price: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    order: Mapped[StorefrontOrder] = relationship("StorefrontOrder", back_populates="items")


class StorefrontCoupon(Base):
    __tablename__ = "storefront_coupons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    code: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    discount_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    discount_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_order_amount: Mapped[float] = mapped_column(Float, default=0.0)
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
