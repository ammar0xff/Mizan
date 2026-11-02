"""Database models for Restaurant & Dining Hall module."""
from __future__ import annotations

import uuid

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class RestaurantTable(TenantScoped, Base):
    __tablename__ = "restaurant_tables"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    number: Mapped[str] = mapped_column(String(32), index=True)
    capacity: Mapped[int] = mapped_column(Integer, default=4)
    section: Mapped[str] = mapped_column(String(64), default="الصالة الرئيسية")
    status: Mapped[str] = mapped_column(String(32), default="available")  # available, occupied, reserved
    order_total: Mapped[float] = mapped_column(Float, default=0.0)
    guests: Mapped[int] = mapped_column(Integer, default=0)
    opened_at: Mapped[str | None] = mapped_column(String(64), nullable=True)


class RestaurantRecipe(TenantScoped, Base):
    """Recipe Master / Bill of Materials (BOM) for menu items."""
    __tablename__ = "restaurant_recipes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    menu_item_name: Mapped[str] = mapped_column(String(128), index=True)
    category: Mapped[str] = mapped_column(String(64), default="وجبات رئيسية")
    sale_price: Mapped[float] = mapped_column(Float, default=0.0)
    yield_portions: Mapped[int] = mapped_column(Integer, default=1)
    prep_time_minutes: Mapped[int] = mapped_column(Integer, default=15)
    station: Mapped[str] = mapped_column(String(64), default="المطبخ الرئيسي")  # شواية, بار, فرن بيتزا, حلويات
    notes: Mapped[str | None] = mapped_column(String(256), nullable=True)


class RestaurantRecipeItem(TenantScoped, Base):
    """Raw ingredients required per recipe portion with yield loss shrinkage."""
    __tablename__ = "restaurant_recipe_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipe_id: Mapped[str] = mapped_column(String(36), index=True)
    raw_item_name: Mapped[str] = mapped_column(String(128))
    qty_per_portion: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32), default="كجم")  # كجم, جم, قطعة, مل
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    yield_loss_pct: Mapped[float] = mapped_column(Float, default=0.0)  # هادر الطهي أو التنظيف %


class RestaurantWasteLog(TenantScoped, Base):
    """Food Waste & Spoilage Tracking (RES-08)."""
    __tablename__ = "restaurant_waste_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_name: Mapped[str] = mapped_column(String(128))
    qty: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32), default="كجم")
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(String(64))  # prep_waste, expired, spoiled, customer_return
    notes: Mapped[str | None] = mapped_column(String(256), nullable=True)
    logged_by: Mapped[str] = mapped_column(String(64), default="شيف المطبخ")
    created_at: Mapped[str] = mapped_column(String(32))

