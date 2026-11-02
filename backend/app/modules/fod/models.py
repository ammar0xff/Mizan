"""Database models for Food & Beverage Process Manufacturing module (FOD-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class FodRecipe(TenantScoped, Base):
    """Formula & Continuous Process Formulation (FOD-01)."""
    __tablename__ = "fod_recipes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipe_code: Mapped[str] = mapped_column(String(64), index=True)
    product_name: Mapped[str] = mapped_column(String(128))
    base_batch_size: Mapped[float] = mapped_column(Float, default=1000.0)
    uom: Mapped[str] = mapped_column(String(32), default="KG")
    target_yield_pct: Mapped[float] = mapped_column(Float, default=95.0)
    standard_loss_pct: Mapped[float] = mapped_column(Float, default=5.0)
    shelf_life_days: Mapped[int] = mapped_column(Integer, default=180)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FodRecipeIngredient(TenantScoped, Base):
    """Recipe Ingredients, Active Potency & Allergens (FOD-01, FOD-02)."""
    __tablename__ = "fod_recipe_ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipe_id: Mapped[str] = mapped_column(String(36), index=True)
    ingredient_code: Mapped[str] = mapped_column(String(64))
    ingredient_name: Mapped[str] = mapped_column(String(128))
    standard_qty: Mapped[float] = mapped_column(Float, default=100.0)
    uom: Mapped[str] = mapped_column(String(32), default="KG")
    potency_factor: Mapped[float] = mapped_column(Float, default=1.0)
    is_allergen: Mapped[bool] = mapped_column(Boolean, default=False)
    allergen_type: Mapped[str | None] = mapped_column(String(64), nullable=True)  # Milk, Gluten, Soy, Nuts


class FodBatchOrder(TenantScoped, Base):
    """Batch Orders, FEFO Lifecycle & Evaporation Loss (FOD-03, FOD-05, FOD-07)."""
    __tablename__ = "fod_batch_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_number: Mapped[str] = mapped_column(String(64), index=True)
    recipe_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    product_name: Mapped[str] = mapped_column(String(128))
    target_qty: Mapped[float] = mapped_column(Float, default=1000.0)
    actual_yield_qty: Mapped[float] = mapped_column(Float, default=0.0)
    yield_loss_pct: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="staging")  # staging, mixing, cooking, cooling, packaging, qc_quarantine, released
    start_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    supervisor_name: Mapped[str] = mapped_column(String(128))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FodHaccpLog(TenantScoped, Base):
    """HACCP Critical Control Points (CCP) Monitoring (FOD-08)."""
    __tablename__ = "fod_haccp_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ccp_point: Mapped[str] = mapped_column(String(64))  # pasteurizer_temp, metal_detector, ph_level, sealing_integrity
    reading_value: Mapped[str] = mapped_column(String(64))
    standard_limit: Mapped[str] = mapped_column(String(64))
    is_compliant: Mapped[bool] = mapped_column(Boolean, default=True)
    recorded_at: Mapped[str] = mapped_column(String(64))
    operator_name: Mapped[str] = mapped_column(String(128))
    corrective_action: Mapped[str | None] = mapped_column(String(256), nullable=True)


class FodQaLabSample(TenantScoped, Base):
    """QA Microbiology & Lab Tests (FOD-09)."""
    __tablename__ = "fod_qa_lab_samples"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    sample_ref: Mapped[str] = mapped_column(String(64), index=True)
    test_name: Mapped[str] = mapped_column(String(64))  # e_coli, salmonella, yeast_mold, moisture_pct, brix
    result_value: Mapped[str] = mapped_column(String(64))
    spec_limit: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="pass")  # pending, pass, fail
    tested_by: Mapped[str] = mapped_column(String(128))
    tested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FodTraceabilityRecall(TenantScoped, Base):
    """Mock Recall Simulator & Bi-Directional Traceability (FOD-04, FOD-10)."""
    __tablename__ = "fod_traceability_recalls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_ref: Mapped[str] = mapped_column(String(64), index=True)
    suspect_ingredient_lot: Mapped[str] = mapped_column(String(64))
    affected_batches_count: Mapped[int] = mapped_column(Integer, default=1)
    distributed_units_count: Mapped[int] = mapped_column(Integer, default=0)
    audit_duration_mins: Mapped[float] = mapped_column(Float, default=12.5)
    is_within_iso_30min: Mapped[bool] = mapped_column(Boolean, default=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
