"""API router for 3PL & Warehouse Management System (WMS-01..11)."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.wms.models import (
    WmsBillingInvoice,
    WmsBinLocation,
    WmsClientAccount,
    WmsCrossDockOrder,
    WmsInboundReceipt,
    WmsPickingWave,
)

router = APIRouter(prefix="/wms", tags=["wms"])


# ------------------ Schemas ------------------ #
class ClientAccountCreate(BaseModel):
    client_code: str
    company_name: str
    contact_person: str
    phone: str
    email: str
    storage_rate_pallet_day: float = 15.0
    handling_in_per_pallet: float = 30.0
    handling_out_per_pallet: float = 25.0
    pick_per_line_fee: float = 5.0


class BinCreate(BaseModel):
    bin_code: str
    zone: str = "Zone A - الجاف والغذائي"
    aisle: str
    rack: str
    shelf: str
    position: str
    velocity_class: str = "A"
    max_weight_kg: float = 1200.0
    max_volume_cbm: float = 1.8


class PutawayAction(BaseModel):
    client_code: str
    current_pallet_barcode: str
    current_product_name: str
    current_quantity: int


class PickingWaveCreate(BaseModel):
    wave_number: str
    client_code: str
    zone: str = "Zone A"
    picker_name: str
    total_orders: int = 1
    total_items_count: int = 24


class InboundReceiptCreate(BaseModel):
    asn_number: str
    client_code: str
    carrier_name: str
    expected_units: int
    received_units: int
    damaged_units: int = 0
    short_units: int = 0
    over_units: int = 0
    osd_status: str = "clean"
    inspector_notes: str = ""
    received_date: str


class CrossDockCreate(BaseModel):
    cross_dock_code: str
    client_code: str
    inbound_asn_ref: str
    outbound_so_ref: str
    cargo_description: str
    pallet_count: int = 1
    inbound_dock: str = "رصيف استلام 01"
    outbound_dock: str = "رصيف تحميل 04"


class InvoiceGenerateCreate(BaseModel):
    client_code: str
    billing_month: str
    pallet_days_count: int = 600
    handling_in_pallets: int = 50
    handling_out_pallets: int = 40
    picked_lines_count: int = 350


# ------------------ Endpoints ------------------ #
@router.get("/summary")
async def get_wms_summary(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Return key metrics and KPIs across 3PL warehouse operations."""
    # Clients
    res_cli = await db.execute(select(func.count(WmsClientAccount.id)))
    clients_count = res_cli.scalar_one() or 0

    # Bins
    res_bins = await db.execute(select(WmsBinLocation))
    bins = res_bins.scalars().all()
    total_bins = len(bins)
    occupied_bins = sum(1 for b in bins if b.status == "occupied")
    utilization_rate = round((occupied_bins / total_bins * 100), 1) if total_bins > 0 else 0

    # Waves
    res_waves = await db.execute(select(WmsPickingWave))
    waves = res_waves.scalars().all()
    active_waves = sum(1 for w in waves if w.status == "in_progress")

    # Inbound receipts & OS&D
    res_rec = await db.execute(select(WmsInboundReceipt))
    receipts = res_rec.scalars().all()
    total_receipts = len(receipts)
    clean_receipts = sum(1 for r in receipts if r.osd_status == "clean")
    clean_rate = round((clean_receipts / total_receipts * 100), 1) if total_receipts > 0 else 100

    # Cross dock
    res_xd = await db.execute(select(func.count(WmsCrossDockOrder.id)))
    cross_dock_count = res_xd.scalar_one() or 0

    # Revenue
    res_inv = await db.execute(select(func.sum(WmsBillingInvoice.total_amount)))
    total_3pl_revenue = res_inv.scalar_one() or 0.0

    return {
        "clients_count": clients_count,
        "total_bins": total_bins,
        "occupied_bins": occupied_bins,
        "utilization_rate": utilization_rate,
        "active_waves": active_waves,
        "total_receipts": total_receipts,
        "clean_receipts_rate": clean_rate,
        "cross_dock_count": cross_dock_count,
        "total_3pl_revenue": round(total_3pl_revenue, 2),
    }


@router.get("/clients")
async def list_clients(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsClientAccount).order_by(WmsClientAccount.company_name))
    return res.scalars().all()


@router.post("/clients")
async def create_client(
    body: ClientAccountCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    cli = WmsClientAccount(**body.model_dump())
    db.add(cli)
    await db.commit()
    await db.refresh(cli)
    return cli


@router.get("/bins")
async def list_bins(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsBinLocation).order_by(WmsBinLocation.bin_code))
    return res.scalars().all()


@router.post("/bins")
async def create_bin(
    body: BinCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    bin_loc = WmsBinLocation(**body.model_dump())
    db.add(bin_loc)
    await db.commit()
    await db.refresh(bin_loc)
    return bin_loc


@router.post("/bins/{id}/putaway")
async def execute_putaway(
    id: str,
    body: PutawayAction,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsBinLocation).where(WmsBinLocation.id == id))
    bin_loc = res.scalar_one_or_none()
    if not bin_loc:
        raise HTTPException(status_code=404, detail="الموقع التخزيني غير موجود")
    bin_loc.status = "occupied"
    bin_loc.client_code = body.client_code
    bin_loc.current_pallet_barcode = body.current_pallet_barcode
    bin_loc.current_product_name = body.current_product_name
    bin_loc.current_quantity = body.current_quantity
    await db.commit()
    return {"status": "success", "bin_code": bin_loc.bin_code, "bin_status": bin_loc.status}


@router.post("/bins/{id}/empty")
async def empty_bin(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsBinLocation).where(WmsBinLocation.id == id))
    bin_loc = res.scalar_one_or_none()
    if not bin_loc:
        raise HTTPException(status_code=404, detail="الموقع التخزيني غير موجود")
    bin_loc.status = "empty"
    bin_loc.client_code = ""
    bin_loc.current_pallet_barcode = ""
    bin_loc.current_product_name = ""
    bin_loc.current_quantity = 0
    await db.commit()
    return {"status": "success", "bin_code": bin_loc.bin_code, "bin_status": "empty"}


@router.get("/waves")
async def list_picking_waves(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsPickingWave).order_by(desc(WmsPickingWave.started_at)))
    return res.scalars().all()


@router.post("/waves")
async def create_picking_wave(
    body: PickingWaveCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    wave = WmsPickingWave(
        **body.model_dump(),
        started_at="اليوم 09:30 ص",
        status="in_progress",
    )
    db.add(wave)
    await db.commit()
    await db.refresh(wave)
    return wave


@router.post("/waves/{id}/complete")
async def complete_picking_wave(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsPickingWave).where(WmsPickingWave.id == id))
    wave = res.scalar_one_or_none()
    if not wave:
        raise HTTPException(status_code=404, detail="موجة الانتقاء غير موجودة")
    wave.status = "completed"
    wave.completed_at = "تم الانتهاء 11:15 ص"
    await db.commit()
    return {"status": "success", "wave_status": wave.status}


@router.get("/inbound-receipts")
async def list_inbound_receipts(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsInboundReceipt).order_by(desc(WmsInboundReceipt.received_date)))
    return res.scalars().all()


@router.post("/inbound-receipts")
async def create_inbound_receipt(
    body: InboundReceiptCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    rec = WmsInboundReceipt(**body.model_dump())
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.get("/cross-dock")
async def list_cross_dock_orders(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsCrossDockOrder).order_by(WmsCrossDockOrder.cross_dock_code))
    return res.scalars().all()


@router.post("/cross-dock")
async def create_cross_dock_order(
    body: CrossDockCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    entry = WmsCrossDockOrder(**body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/invoices")
async def list_invoices(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(select(WmsBillingInvoice).order_by(desc(WmsBillingInvoice.created_at)))
    return res.scalars().all()


@router.post("/invoices/generate")
async def generate_client_invoice(
    body: InvoiceGenerateCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res_cli = await db.execute(select(WmsClientAccount).where(WmsClientAccount.client_code == body.client_code))
    client = res_cli.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="حساب العميل غير موجود")

    storage = body.pallet_days_count * client.storage_rate_pallet_day
    handling_in = body.handling_in_pallets * client.handling_in_per_pallet
    handling_out = body.handling_out_pallets * client.handling_out_per_pallet
    picking = body.picked_lines_count * client.pick_per_line_fee
    total = storage + handling_in + handling_out + picking

    inv_num = f"3PL-INV-{body.billing_month[:4]}-{uuid.uuid4().hex[:5].upper()}"

    inv = WmsBillingInvoice(
        invoice_number=inv_num,
        client_code=body.client_code,
        billing_month=body.billing_month,
        storage_charges=round(storage, 2),
        handling_in_charges=round(handling_in, 2),
        handling_out_charges=round(handling_out, 2),
        picking_charges=round(picking, 2),
        total_amount=round(total, 2),
        status="issued",
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return inv


@router.post("/seed")
async def seed_wms_sample_data(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Seed initial sample 3PL clients, bin slots, and waves if empty."""
    res = await db.execute(select(func.count(WmsClientAccount.id)))
    count = res.scalar_one() or 0
    if count > 0:
        return {"status": "already_seeded", "message": "بيانات إدارة المستودعات 3PL موجودة بالفعل"}

    # 1. Client Accounts
    clients = [
        WmsClientAccount(
            client_code="CLI-NESTLE",
            company_name="شركة نستله للصناعات الغذائية - مصر",
            contact_person="م/ هشام عبد الرحيم",
            phone="01001122334",
            email="logistics.eg@nestle.com",
            storage_rate_pallet_day=16.0,
            handling_in_per_pallet=35.0,
            handling_out_per_pallet=30.0,
            pick_per_line_fee=5.5,
            status="active",
            total_stored_pallets=140,
        ),
        WmsClientAccount(
            client_code="CLI-UNILEVER",
            company_name="يونيليفر مشرق للتجارة والتسويق",
            contact_person="أ/ دينا فاروق",
            phone="01223344556",
            email="scm.egypt@unilever.com",
            storage_rate_pallet_day=18.0,
            handling_in_per_pallet=40.0,
            handling_out_per_pallet=35.0,
            pick_per_line_fee=6.0,
            status="active",
            total_stored_pallets=85,
        ),
    ]
    db.add_all(clients)

    # 2. Bins Grid
    bins = [
        WmsBinLocation(
            bin_code="ZN-A-01-1-A",
            zone="Zone A - الجاف والغذائي",
            aisle="01",
            rack="01",
            shelf="1",
            position="A",
            velocity_class="A",
            max_weight_kg=1200.0,
            max_volume_cbm=1.8,
            status="occupied",
            client_code="CLI-NESTLE",
            current_pallet_barcode="PAL-NES-9901",
            current_product_name="نسكافيه كلاسيك برطمان 200 جم (كرتونة)",
            current_quantity=48,
        ),
        WmsBinLocation(
            bin_code="ZN-A-01-1-B",
            zone="Zone A - الجاف والغذائي",
            aisle="01",
            rack="01",
            shelf="1",
            position="B",
            velocity_class="A",
            max_weight_kg=1200.0,
            max_volume_cbm=1.8,
            status="occupied",
            client_code="CLI-NESTLE",
            current_pallet_barcode="PAL-NES-9902",
            current_product_name="حليب نيدو مجفف أكياس 900 جم",
            current_quantity=60,
        ),
        WmsBinLocation(
            bin_code="ZN-A-01-2-A",
            zone="Zone A - الجاف والغذائي",
            aisle="01",
            rack="01",
            shelf="2",
            position="A",
            velocity_class="B",
            max_weight_kg=1000.0,
            max_volume_cbm=1.8,
            status="empty",
        ),
        WmsBinLocation(
            bin_code="ZN-B-02-1-A",
            zone="Zone B - العناية الشخصية والمنظفات",
            aisle="02",
            rack="01",
            shelf="1",
            position="A",
            velocity_class="A",
            max_weight_kg=1200.0,
            max_volume_cbm=1.8,
            status="occupied",
            client_code="CLI-UNILEVER",
            current_pallet_barcode="PAL-UNI-7701",
            current_product_name="شامبو دوف عناية متكاملة 400 مل",
            current_quantity=72,
        ),
        WmsBinLocation(
            bin_code="ZN-B-02-2-A",
            zone="Zone B - العناية الشخصية والمنظفات",
            aisle="02",
            rack="01",
            shelf="2",
            position="A",
            velocity_class="C",
            max_weight_kg=800.0,
            max_volume_cbm=1.5,
            status="empty",
        ),
    ]
    db.add_all(bins)

    # 3. Picking Wave
    waves = [
        WmsPickingWave(
            wave_number="WV-2026-0041",
            client_code="CLI-NESTLE",
            zone="Zone A",
            picker_name="أحمد حسني (مشغل رافعة)",
            total_orders=3,
            total_items_count=36,
            status="in_progress",
            started_at="اليوم 09:15 ص",
        )
    ]
    db.add_all(waves)

    # 4. Inbound Receipts
    inbounds = [
        WmsInboundReceipt(
            asn_number="ASN-NES-2026-088",
            client_code="CLI-NESTLE",
            carrier_name="أسطول شاحنات نستله المركزي",
            expected_units=1200,
            received_units=1200,
            damaged_units=0,
            short_units=0,
            over_units=0,
            osd_status="clean",
            inspector_notes="مطابقة تامة لإشعار الشحن المسبق ASN وسلامة التغليف الحراري للباليتات",
            received_date="2026-11-01",
        )
    ]
    db.add_all(inbounds)

    # 5. Cross Dock
    cross_docks = [
        WmsCrossDockOrder(
            cross_dock_code="XD-2026-0012",
            client_code="CLI-UNILEVER",
            inbound_asn_ref="ASN-UNI-449",
            outbound_so_ref="SO-HYPER-991",
            cargo_description="شحنة عاجلة صابون لوكس ومستحضرات تجميل",
            pallet_count=6,
            inbound_dock="رصيف استلام 02",
            outbound_dock="رصيف شحن كارفور 05",
            status="transferred",
        )
    ]
    db.add_all(cross_docks)

    # 6. Billing Invoices
    invoices = [
        WmsBillingInvoice(
            invoice_number="3PL-INV-2026-10-NES",
            client_code="CLI-NESTLE",
            billing_month="أكتوبر 2026",
            storage_charges=38400.0,
            handling_in_charges=4200.0,
            handling_out_charges=3600.0,
            picking_charges=6800.0,
            total_amount=53000.0,
            status="issued",
        )
    ]
    db.add_all(invoices)

    await db.commit()
    return {"status": "seeded", "message": "تم تهيئة بيانات إدارة المستودعات 3PL بنجاح"}
