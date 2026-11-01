"""API endpoints for Vendora Modular App Engine."""
from __future__ import annotations

from dataclasses import asdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.modules import (
    BUSINESS_PRESETS,
    DEFAULT_MODULES,
    DEFAULT_PRESET,
    MODULE_CATALOG,
    get_active_modules,
    get_active_preset,
    require_module,
    set_active_modules,
)
from app.modules.loader import registry
from app.db.base import get_db
from app.dependencies import get_current_user, require_perm

router = APIRouter(prefix="/modules", tags=["modules"])


class ToggleModuleRequest(BaseModel):
    enabled: bool


class ApplyPresetRequest(BaseModel):
    preset_id: str


class UpdateModuleSettingsRequest(BaseModel):
    settings: dict[str, Any]


@router.get("")
async def list_modules(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """List all available modules, current tenant active modules, and business presets."""
    active_mods = await get_active_modules(db)
    active_preset = await get_active_preset(db)

    # Combine built-in catalog with auto-discovered modules from loader
    discovered = {m.id: m for m in registry.get_all_manifests()}
    combined = {**MODULE_CATALOG, **discovered}

    catalog_list = []
    for m in combined.values():
        d = asdict(m)
        d["is_installed"] = m.id in active_mods
        catalog_list.append(d)

    presets_list = [asdict(p) for p in BUSINESS_PRESETS.values()]

    return {
        "active_preset": active_preset,
        "active_modules": active_mods,
        "catalog": catalog_list,
        "presets": presets_list,
    }


@router.get("/{module_id}/settings")
async def get_module_settings_endpoint(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retrieve settings schema and current tenant values for a module."""
    try:
        return await registry.get_settings(db, module_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="الوحدة المطلوبة غير مسجلة")


@router.post("/{module_id}/settings")
async def save_module_settings_endpoint(
    module_id: str,
    data: UpdateModuleSettingsRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_perm("settings")),
):
    """Save updated settings for a module."""
    try:
        updated = await registry.save_settings(db, module_id, data.settings)
        return {
            "detail": "تم حفظ إعدادات الوحدة بنجاح",
            "settings": updated,
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="الوحدة المطلوبة غير مسجلة")


@router.post("/{module_id}/toggle")
async def toggle_module(
    module_id: str,
    data: ToggleModuleRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_perm("settings")),
):
    """Enable or disable a specific module."""
    if module_id not in MODULE_CATALOG:
        raise HTTPException(status_code=404, detail="الوحدة المطلوبة غير موجودة في الدليل")

    if module_id == "core" and not data.enabled:
        raise HTTPException(status_code=400, detail="لا يمكن تعطيل النواة الأساسية للنظام")

    active = set(await get_active_modules(db))

    if data.enabled:
        active.add(module_id)
        # Add dependencies
        manifest = MODULE_CATALOG[module_id]
        for dep in manifest.dependencies:
            active.add(dep)
    else:
        # Check if other active modules depend on this one
        dependent = [
            m.name
            for m in MODULE_CATALOG.values()
            if m.id in active and module_id in m.dependencies and m.id != module_id
        ]
        if dependent:
            raise HTTPException(
                status_code=400,
                detail=f"لا يمكن تعطيل هذه الوحدة لأن الوحدات التالية تعتمد عليها: {', '.join(dependent)}",
            )
        active.discard(module_id)

    await set_active_modules(db, list(active))
    return {
        "detail": "تم تحديث حالة الوحدة بنجاح",
        "active_modules": list(active),
    }


@router.post("/presets/apply")
async def apply_preset(
    data: ApplyPresetRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_perm("settings")),
):
    """Apply a business collection preset (Retail, Restaurant, School, Services)."""
    preset = BUSINESS_PRESETS.get(data.preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="حزمة النشاط المطلوبة غير مسجلة")

    await set_active_modules(db, preset.modules, preset_id=data.preset_id)
    return {
        "detail": f"تم تطبيق حزمة «{preset.name}» بنجاح",
        "active_preset": data.preset_id,
        "active_modules": preset.modules,
    }


# ============================================================================
# Specialized Industry Endpoints (Restaurant & School Mock / Interactive Data)
# ============================================================================

@router.get("/restaurant/tables")
async def get_restaurant_tables(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Return dining hall tables and current active orders."""
    return [
        {"id": "t1", "number": "1", "capacity": 4, "section": "الصالة الرئيسية", "status": "occupied", "order_total": 450.0, "guests": 3, "opened_at": "منذ 25 دقيقة"},
        {"id": "t2", "number": "2", "capacity": 2, "section": "الصالة الرئيسية", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
        {"id": "t3", "number": "3", "capacity": 6, "section": "صالة العائلات", "status": "occupied", "order_total": 1280.0, "guests": 5, "opened_at": "منذ 45 دقيقة"},
        {"id": "t4", "number": "4", "capacity": 4, "section": "صالة العائلات", "status": "reserved", "order_total": 0.0, "guests": 4, "opened_at": None},
        {"id": "t5", "number": "5", "capacity": 8, "section": "التراس الخارجي", "status": "occupied", "order_total": 890.0, "guests": 6, "opened_at": "منذ 10 دقائق"},
        {"id": "t6", "number": "6", "capacity": 2, "section": "التراس الخارجي", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
    ]


@router.get("/restaurant/kitchen-orders")
async def get_kitchen_orders(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Kitchen Display System (KDS) live ticket queue."""
    return [
        {
            "id": "kds-101",
            "order_number": "#K-104",
            "table": "طاولة 3 (عائلات)",
            "waiter": "كريم أحمد",
            "elapsed_mins": 12,
            "status": "cooking",
            "items": [
                {"name": "برجر دبل بيف مشوي", "qty": 2, "notes": "بدون بصل، جبنة إضافية"},
                {"name": "بيتزا رانش دجاج لارج", "qty": 1, "notes": "تسوية مقرمشة"},
                {"name": "بطاطس ويدجز متبلة", "qty": 2, "notes": ""},
            ],
        },
        {
            "id": "kds-102",
            "order_number": "#K-105",
            "table": "طاولة 1 (رئيسية)",
            "waiter": "عمر محمود",
            "elapsed_mins": 4,
            "status": "pending",
            "items": [
                {"name": "باستا ألفريدو دجاج ومشروم", "qty": 1, "notes": "إكسترا صوص أبيض"},
                {"name": "سلطة سيزر دجاج مشوي", "qty": 1, "notes": ""},
            ],
        },
    ]


@router.get("/school/students")
async def get_school_students(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """School student roster with tuition installment balances."""
    return [
        {"id": "s-1", "code": "STU-2024-001", "name": "أحمد محمود حسن", "grade": "الصف الأول الإعدادي", "parent_phone": "01098765432", "total_tuition": 15000, "paid_tuition": 10000, "balance_due": 5000, "status": "active"},
        {"id": "s-2", "code": "STU-2024-002", "name": "سارة إبراهيم فتحي", "grade": "الصف الثاني الثانوي", "parent_phone": "01123456789", "total_tuition": 22000, "paid_tuition": 22000, "balance_due": 0, "status": "settled"},
        {"id": "s-3", "code": "STU-2024-003", "name": "يوسف طارق علي", "grade": "الصف السادس الابتدائي", "parent_phone": "01234567890", "total_tuition": 12000, "paid_tuition": 6000, "balance_due": 6000, "status": "overdue"},
        {"id": "s-4", "code": "STU-2024-004", "name": "مريم خالد سمير", "grade": "الصف الثالث الإعدادي", "parent_phone": "01011223344", "total_tuition": 18000, "paid_tuition": 18000, "balance_due": 0, "status": "settled"},
    ]
