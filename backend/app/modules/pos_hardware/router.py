"""API router for POS Hardware & Thermal Printing module."""
from __future__ import annotations

import base64
import datetime
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.modules.pos_hardware.models import PosHardwareProfile

router = APIRouter(prefix="/modules/pos_hardware", tags=["pos-hardware"])


class HardwareProfileSchema(BaseModel):
    workstation_name: str = "كاشير رئيسي (Workstation 1)"
    printer_type: str = "browser_thermal"
    printer_ip: str | None = None
    printer_port: int = 9100
    paper_width: str = "80mm"
    auto_print: bool = True
    cash_drawer_pulse: bool = True
    show_tax_qr: bool = True
    header_note: str | None = "أهلاً وسهلاً بكم — نسعد بخدمتكم دائماً"
    footer_note: str | None = "البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب الفاتورة"


def _build_zatca_tlv_mock(seller_name: str, tax_number: str, timestamp_str: str, total_str: str, tax_str: str) -> str:
    """Helper to build standard TLV base64 string for tax QR preview."""
    def _tlv_tag(tag: int, val: str) -> bytes:
        val_bytes = val.encode("utf-8")
        return bytes([tag, len(val_bytes)]) + val_bytes

    tlv_bytes = (
        _tlv_tag(1, seller_name)
        + _tlv_tag(2, tax_number)
        + _tlv_tag(3, timestamp_str)
        + _tlv_tag(4, total_str)
        + _tlv_tag(5, tax_str)
    )
    return base64.b64encode(tlv_bytes).decode("ascii")


@router.get("/config")
async def get_hardware_config(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve active POS hardware profile for current tenant."""
    stmt = select(PosHardwareProfile).order_by(PosHardwareProfile.is_default.desc()).limit(1)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        # Create default
        profile = PosHardwareProfile(
            workstation_name="كاشير رئيسي (Workstation 1)",
            printer_type="browser_thermal",
            paper_width="80mm",
            auto_print=True,
            cash_drawer_pulse=True,
            show_tax_qr=True,
            header_note="أهلاً وسهلاً بكم — نسعد بخدمتكم دائماً",
            footer_note="البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب الفاتورة",
            is_default=True,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "id": str(profile.id),
        "workstation_name": profile.workstation_name,
        "printer_type": profile.printer_type,
        "printer_ip": profile.printer_ip,
        "printer_port": profile.printer_port,
        "paper_width": profile.paper_width,
        "auto_print": profile.auto_print,
        "cash_drawer_pulse": profile.cash_drawer_pulse,
        "show_tax_qr": profile.show_tax_qr,
        "header_note": profile.header_note,
        "footer_note": profile.footer_note,
        "is_default": profile.is_default,
    }


@router.put("/config")
async def update_hardware_config(
    payload: HardwareProfileSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Update active POS hardware profile for current tenant."""
    stmt = select(PosHardwareProfile).order_by(PosHardwareProfile.is_default.desc()).limit(1)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        profile = PosHardwareProfile(**payload.model_dump(), is_default=True)
        db.add(profile)
    else:
        for k, v in payload.model_dump().items():
            setattr(profile, k, v)

    await db.commit()
    await db.refresh(profile)
    return {
        "status": "success",
        "message": "تم حفظ إعدادات عتاد نقاط البيع بنجاح",
        "config": {
            "id": str(profile.id),
            "workstation_name": profile.workstation_name,
            "paper_width": profile.paper_width,
            "auto_print": profile.auto_print,
            "cash_drawer_pulse": profile.cash_drawer_pulse,
            "show_tax_qr": profile.show_tax_qr,
            "header_note": profile.header_note,
            "footer_note": profile.footer_note,
        },
    }


@router.post("/test-print")
async def generate_test_print(
    payload: HardwareProfileSchema | None = None,
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Generate test receipt data with Egyptian tax QR payload."""
    now_iso = datetime.datetime.now().isoformat()
    qr_data = _build_zatca_tlv_mock(
        seller_name="المصرية الألمانية للأدوات الصحية",
        tax_number="300987654300003",
        timestamp_str=now_iso,
        total_str="250.00",
        tax_str="32.61",
    )

    width = payload.paper_width if payload else "80mm"
    return {
        "status": "ready",
        "paper_width": width,
        "store_name": "المصرية الألمانية للأدوات الصحية",
        "tax_number": "300987654300003",
        "invoice_no": "TEST-" + uuid.uuid4().hex[:6].upper(),
        "timestamp": now_iso,
        "cashier": user.name or "كاشير 1",
        "header_note": payload.header_note if payload else "أهلاً وسهلاً بكم — نسعد بخدمتكم دائماً",
        "footer_note": payload.footer_note if payload else "البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب الفاتورة",
        "items": [
            {"name": "محبس نحاس إيطالي 1/2 بوصة", "qty": 2, "price": 85.0, "total": 170.0},
            {"name": "شريط تفلون مانع تسريب 12م", "qty": 4, "price": 20.0, "total": 80.0},
        ],
        "subtotal": 217.39,
        "tax": 32.61,
        "total": 250.0,
        "qr_payload": qr_data,
        "cash_drawer_pulse": payload.cash_drawer_pulse if payload else True,
    }
