"""SQLAlchemy models for Commercial Agriculture & Farm Management ERP module (AGR-01..13)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class AgrFarmPlot(TenantScoped, Base):
    __tablename__ = "agr_farm_plots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    farm_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str] = mapped_column(String(128), nullable=False)
    soil_type: Mapped[str] = mapped_column(String(128), default="Sandy Loam")
    area_feddans: Mapped[float] = mapped_column(Float, default=0.0)
    irrigation_type: Mapped[str] = mapped_column(String(64), default="center_pivot")  # center_pivot, drip, sprinkler, flood
    gps_coordinates: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="cultivated")  # cultivated, fallow, harvesting, soil_prep
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AgrCropSeason(TenantScoped, Base):
    __tablename__ = "agr_crop_seasons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("agr_farm_plots.id", ondelete="CASCADE"), nullable=False, index=True)
    season_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    crop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    variety: Mapped[str] = mapped_column(String(128), nullable=False)
    planting_date: Mapped[str] = mapped_column(String(32), nullable=False)
    expected_harvest_date: Mapped[str] = mapped_column(String(32), nullable=False)
    target_yield_tons: Mapped[float] = mapped_column(Float, default=0.0)
    actual_yield_tons: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="planted")  # planned, planted, vegetative, flowering, harvested
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AgrChemicalSprayLog(TenantScoped, Base):
    __tablename__ = "agr_chemical_spray_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    crop_season_id: Mapped[str] = mapped_column(String(36), ForeignKey("agr_crop_seasons.id", ondelete="CASCADE"), nullable=False, index=True)
    spray_ref: Mapped[str] = mapped_column(String(64), nullable=False)
    chemical_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage_per_feddan: Mapped[str] = mapped_column(String(128), nullable=False)
    active_ingredient: Mapped[str] = mapped_column(String(128), nullable=False)
    target_pest_or_deficiency: Mapped[str] = mapped_column(String(255), nullable=False)
    withholding_days_phi: Mapped[int] = mapped_column(Integer, default=14)
    applied_date: Mapped[str] = mapped_column(String(32), nullable=False)
    applied_by: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="completed")  # completed, scheduled

class AgrHarvestBatch(TenantScoped, Base):
    __tablename__ = "agr_harvest_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    crop_season_id: Mapped[str] = mapped_column(String(36), ForeignKey("agr_crop_seasons.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_lot: Mapped[str] = mapped_column(String(64), nullable=False)
    harvest_date: Mapped[str] = mapped_column(String(32), nullable=False)
    total_weight_tons: Mapped[float] = mapped_column(Float, default=0.0)
    grade_classification: Mapped[str] = mapped_column(String(64), default="Class 1 (Export)")
    reject_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    globalgap_compliant: Mapped[bool] = mapped_column(Boolean, default=True)
    destination_warehouse: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class AgrLivestockAnimal(TenantScoped, Base):
    __tablename__ = "agr_livestock_animals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rfid_tag: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    breed: Mapped[str] = mapped_column(String(128), nullable=False)
    gender: Mapped[str] = mapped_column(String(16), default="female")  # female, male
    birth_date: Mapped[str] = mapped_column(String(32), nullable=False)
    current_weight_kg: Mapped[float] = mapped_column(Float, default=0.0)
    daily_milk_yield_liters: Mapped[float] = mapped_column(Float, default=0.0)
    health_status: Mapped[str] = mapped_column(String(32), default="healthy")  # healthy, pregnant, quarantined, lactating
    last_vaccination_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
