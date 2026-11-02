"""Database models for 3PL & Warehouse Management System (WMS-01..11)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tenancy import TenantScoped
from app.db.base import Base


class WmsClientAccount(TenantScoped, Base):
    """3PL Client Tenancy & Dedicated Fee Contracts (WMS-01, WMS-02, WMS-08)."""
    __tablename__ = "wms_client_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    company_name: Mapped[str] = mapped_column(String(128), index=True)
    contact_person: Mapped[str] = mapped_column(String(64))
    phone: Mapped[str] = mapped_column(String(32))
    email: Mapped[str] = mapped_column(String(64))
    storage_rate_pallet_day: Mapped[float] = mapped_column(Float, default=15.0)
    handling_in_per_pallet: Mapped[float] = mapped_column(Float, default=30.0)
    handling_out_per_pallet: Mapped[float] = mapped_column(Float, default=25.0)
    pick_per_line_fee: Mapped[float] = mapped_column(Float, default=5.0)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, suspended, archived
    total_stored_pallets: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WmsBinLocation(TenantScoped, Base):
    """Multi-Zone Bin Locations (Zone-Aisle-Rack-Shelf-Bin) & Slotting (WMS-03, WMS-05)."""
    __tablename__ = "wms_bin_locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bin_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # ZN-A-01-2-B
    zone: Mapped[str] = mapped_column(String(128), default="Zone A - الجاف والغذائي")
    aisle: Mapped[str] = mapped_column(String(16))
    rack: Mapped[str] = mapped_column(String(16))
    shelf: Mapped[str] = mapped_column(String(16))
    position: Mapped[str] = mapped_column(String(16))
    velocity_class: Mapped[str] = mapped_column(String(16), default="A")  # A (سريع الدوران), B (متوسط), C (بطيء)
    max_weight_kg: Mapped[float] = mapped_column(Float, default=1200.0)
    max_volume_cbm: Mapped[float] = mapped_column(Float, default=1.8)
    status: Mapped[str] = mapped_column(String(32), default="empty")  # empty, occupied, reserved, maintenance
    client_code: Mapped[str] = mapped_column(String(32), default="")
    current_pallet_barcode: Mapped[str] = mapped_column(String(64), default="")
    current_product_name: Mapped[str] = mapped_column(String(128), default="")
    current_quantity: Mapped[int] = mapped_column(Integer, default=0)


class WmsPickingWave(TenantScoped, Base):
    """Wave, Batch & Zone Picking Order Batches (WMS-04)."""
    __tablename__ = "wms_picking_waves"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wave_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    client_code: Mapped[str] = mapped_column(String(32), index=True)
    zone: Mapped[str] = mapped_column(String(32), default="Zone A")
    picker_name: Mapped[str] = mapped_column(String(64))
    total_orders: Mapped[int] = mapped_column(Integer, default=1)
    total_items_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="in_progress")  # queued, in_progress, completed
    started_at: Mapped[str] = mapped_column(String(32))
    completed_at: Mapped[str] = mapped_column(String(32), default="")


class WmsInboundReceipt(TenantScoped, Base):
    """Inbound ASN Receiving & OS&D Discrepancies (WMS-07)."""
    __tablename__ = "wms_inbound_receipts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asn_number: Mapped[str] = mapped_column(String(64), index=True)
    client_code: Mapped[str] = mapped_column(String(32), index=True)
    carrier_name: Mapped[str] = mapped_column(String(128))
    expected_units: Mapped[int] = mapped_column(Integer, default=0)
    received_units: Mapped[int] = mapped_column(Integer, default=0)
    damaged_units: Mapped[int] = mapped_column(Integer, default=0)
    short_units: Mapped[int] = mapped_column(Integer, default=0)
    over_units: Mapped[int] = mapped_column(Integer, default=0)
    osd_status: Mapped[str] = mapped_column(String(32), default="clean")  # clean, discrepancy_reported, resolved
    inspector_notes: Mapped[str] = mapped_column(Text, default="")
    received_date: Mapped[str] = mapped_column(String(32))


class WmsCrossDockOrder(TenantScoped, Base):
    """Cross-Docking Direct Transit Routing (WMS-06)."""
    __tablename__ = "wms_cross_dock_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cross_dock_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    client_code: Mapped[str] = mapped_column(String(32))
    inbound_asn_ref: Mapped[str] = mapped_column(String(64))
    outbound_so_ref: Mapped[str] = mapped_column(String(64))
    cargo_description: Mapped[str] = mapped_column(String(256))
    pallet_count: Mapped[int] = mapped_column(Integer, default=1)
    inbound_dock: Mapped[str] = mapped_column(String(32), default="رصيف استلام 01")
    outbound_dock: Mapped[str] = mapped_column(String(32), default="رصيف تحميل 04")
    status: Mapped[str] = mapped_column(String(32), default="transferred")  # scheduled, in_transfer, transferred, dispatched


class WmsBillingInvoice(TenantScoped, Base):
    """3PL Itemized Monthly Client Invoicing Engine (WMS-08)."""
    __tablename__ = "wms_billing_invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    client_code: Mapped[str] = mapped_column(String(32), index=True)
    billing_month: Mapped[str] = mapped_column(String(32))
    storage_charges: Mapped[float] = mapped_column(Float, default=0.0)
    handling_in_charges: Mapped[float] = mapped_column(Float, default=0.0)
    handling_out_charges: Mapped[float] = mapped_column(Float, default=0.0)
    picking_charges: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="issued")  # draft, issued, paid
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
