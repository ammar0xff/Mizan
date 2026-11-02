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
    categories = registry.get_categories()

    return {
        "active_preset": active_preset,
        "active_modules": active_mods,
        "catalog": catalog_list,
        "presets": presets_list,
        "categories": categories,
    }


@router.get("/categories")
async def get_module_categories(
    _=Depends(get_current_user),
):
    """Return categorized configuration of all modular ERP suites and specialized collections."""
    return {"categories": registry.get_categories()}


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


import io
import json
import zipfile
from fastapi import File, UploadFile
from app.modules.restaurant.router import (
    get_restaurant_tables as db_get_tables,
    update_table_status as db_update_table,
    UpdateTableStatusRequest,
    get_restaurant_recipes as db_get_recipes,
    create_restaurant_recipe as db_create_recipe,
    CreateRecipeRequest,
    backflush_deplete_order_ingredients as db_deplete_order,
    DepleteOrderRequest,
    get_food_waste_logs as db_get_waste,
    record_food_waste as db_record_waste,
    RecordWasteRequest,
    get_restaurant_summary as db_get_summary,
)
from app.modules.kitchen_display.router import get_kitchen_orders as db_get_kitchen_orders, update_kitchen_ticket_status as db_update_ticket, UpdateTicketStatusRequest
from app.modules.school.router import (
    get_school_students as db_get_students,
    pay_student_installment as db_pay_installment,
    PayInstallmentRequest,
    get_attendance_records as db_get_attendance,
    record_attendance as db_record_attendance,
    RecordAttendanceRequest,
    get_grade_records as db_get_grades,
    record_grade as db_record_grade,
    RecordGradeRequest,
    get_school_summary as db_get_school_summary,
)
from app.modules.services.router import (
    get_engagements as db_get_engagements,
    create_engagement as db_create_engagement,
    CreateEngagementRequest,
    execute_retainer_drawdown as db_execute_drawdown,
    DrawdownRequest,
    get_timesheets as db_get_timesheets,
    create_timesheet_entry as db_create_timesheet,
    CreateTimesheetRequest,
    get_statutory_deadlines as db_get_deadlines,
    create_statutory_deadline as db_create_deadline,
    CreateDeadlineRequest,
    update_deadline_status as db_update_deadline_status,
    UpdateDeadlineStatusRequest,
    get_consulting_summary as db_get_consulting_summary,
)


@router.post("/upload")
async def upload_module_package(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_perm("settings")),
):
    """Import and install a custom third-party module package (.zip)."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="يجب أن تكون حزمة الموديول ملفاً مضغوطاً بصيغة .zip")

    content = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            manifest_names = [n for n in z.namelist() if n.endswith("manifest.json")]
            if not manifest_names:
                raise HTTPException(status_code=400, detail="الحزمة لا تحتوي على ملف manifest.json التعريفي")

            manifest_path = manifest_names[0]
            manifest_data = json.loads(z.read(manifest_path).decode("utf-8"))
            mod_id = manifest_data.get("id")
            if not mod_id:
                raise HTTPException(status_code=400, detail="معرف الموديول 'id' غير محدد في المانيفست")

            target_dir = registry.modules_dir / mod_id
            target_dir.mkdir(parents=True, exist_ok=True)

            prefix = manifest_path.rsplit("manifest.json", 1)[0]
            for member in z.namelist():
                if member.endswith("/"):
                    continue
                rel_path = member[len(prefix):] if prefix and member.startswith(prefix) else member
                if not rel_path or ".." in rel_path:
                    continue
                dest = target_dir / rel_path
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(z.read(member))

            registry._discovered = False
            discovered = registry.discover_modules()
            manifest = discovered.get(mod_id)

            return {
                "detail": f"تم استيراد وتثبيت وحدة «{manifest_data.get('name', mod_id)}» بنجاح في النظام",
                "module": asdict(manifest) if manifest else manifest_data,
            }
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="ملف الـ ZIP تالف أو غير صالح")


# ============================================================================
# Specialized Industry Endpoints (Connected Directly to PostgreSQL Database)
# ============================================================================

@router.get("/restaurant/tables")
async def get_restaurant_tables(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Return dining hall tables from PostgreSQL database."""
    return await db_get_tables(db=db, _user=_user)


@router.post("/restaurant/tables/{table_id}/status")
async def update_restaurant_table_status(
    table_id: str,
    data: UpdateTableStatusRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Update table occupancy or reservation state in PostgreSQL."""
    return await db_update_table(table_id=table_id, data=data, db=db, _user=_user)


@router.get("/restaurant/kitchen-orders")
async def get_kitchen_orders(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Kitchen Display System (KDS) live ticket queue from PostgreSQL."""
    return await db_get_kitchen_orders(db=db, _user=_user)


@router.post("/restaurant/kitchen-orders/{ticket_id}/status")
async def update_kitchen_ticket_status(
    ticket_id: str,
    data: UpdateTicketStatusRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Update kitchen ticket status in PostgreSQL."""
    return await db_update_ticket(ticket_id=ticket_id, data=data, db=db, _user=_user)


@router.get("/restaurant/recipes")
async def get_restaurant_recipes(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Retrieve menu recipes with BOM and food cost analysis."""
    return await db_get_recipes(db=db, _user=_user)


@router.post("/restaurant/recipes")
async def create_restaurant_recipe(
    data: CreateRecipeRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Create a new recipe with BOM ingredients."""
    return await db_create_recipe(data=data, db=db, _user=_user)


@router.post("/restaurant/recipes/deplete")
async def backflush_deplete_order_ingredients(
    data: DepleteOrderRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Backflushing stock depletion based on recipe BOM."""
    return await db_deplete_order(data=data, db=db, _user=_user)


@router.get("/restaurant/waste")
async def get_food_waste_logs(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Retrieve food waste and spoilage records."""
    return await db_get_waste(db=db, _user=_user)


@router.post("/restaurant/waste")
async def record_food_waste(
    data: RecordWasteRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Record a food waste or spoilage event."""
    return await db_record_waste(data=data, db=db, _user=_user)


@router.get("/restaurant/summary")
async def get_restaurant_summary(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("restaurant")),
    _user=Depends(get_current_user),
):
    """Summary dashboard metrics for restaurant management."""
    return await db_get_summary(db=db, _user=_user)


@router.get("/school/students")
async def get_school_students(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """School student roster from PostgreSQL database."""
    return await db_get_students(db=db, _user=_user)


@router.post("/school/students/{student_id}/pay")
async def pay_school_student_installment(
    student_id: str,
    data: PayInstallmentRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """Record a student tuition installment payment in PostgreSQL."""
    return await db_pay_installment(student_id=student_id, data=data, db=db, _user=_user)


@router.get("/school/attendance")
async def get_school_attendance(
    date: str | None = None,
    grade: str | None = None,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """Retrieve student attendance and absence records."""
    return await db_get_attendance(date=date, grade=grade, db=db, _user=_user)


@router.post("/school/attendance")
async def record_school_attendance(
    data: RecordAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """Record student daily or period attendance."""
    return await db_record_attendance(data=data, db=db, _user=_user)


@router.get("/school/grades")
async def get_school_grades(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """Retrieve school gradebook and exam results."""
    return await db_get_grades(db=db, _user=_user)


@router.post("/school/grades")
async def record_school_grade(
    data: RecordGradeRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """Record exam score in gradebook."""
    return await db_record_grade(data=data, db=db, _user=_user)


@router.get("/school/summary")
async def get_school_summary(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("school")),
    _user=Depends(get_current_user),
):
    """School executive KPIs summary."""
    return await db_get_school_summary(db=db, _user=_user)


@router.get("/services/engagements")
async def get_services_engagements(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Retrieve professional services engagements and retainers."""
    return await db_get_engagements(db=db, _user=_user)


@router.post("/services/engagements")
async def create_services_engagement(
    data: CreateEngagementRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Create a new client engagement."""
    return await db_create_engagement(data=data, db=db, _user=_user)


@router.post("/services/engagements/{engagement_id}/drawdown")
async def execute_services_drawdown(
    engagement_id: str,
    data: DrawdownRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Draw down deliverable value from client retainer balance."""
    return await db_execute_drawdown(engagement_id=engagement_id, data=data, db=db, _user=_user)


@router.get("/services/timesheets")
async def get_services_timesheets(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Retrieve consultant timesheets and billable totals."""
    return await db_get_timesheets(db=db, _user=_user)


@router.post("/services/timesheets")
async def create_services_timesheet(
    data: CreateTimesheetRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Log a consultant billable timesheet entry."""
    return await db_create_timesheet(data=data, db=db, _user=_user)


@router.get("/services/deadlines")
async def get_services_deadlines(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Retrieve compliance and statutory filing deadlines."""
    return await db_get_deadlines(db=db, _user=_user)


@router.post("/services/deadlines")
async def create_services_deadline(
    data: CreateDeadlineRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Add a new statutory compliance deadline."""
    return await db_create_deadline(data=data, db=db, _user=_user)


@router.post("/services/deadlines/{deadline_id}/status")
async def update_services_deadline_status(
    deadline_id: str,
    data: UpdateDeadlineStatusRequest,
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Update statutory filing status."""
    return await db_update_deadline_status(deadline_id=deadline_id, data=data, db=db, _user=_user)


@router.get("/services/summary")
async def get_services_summary(
    db: AsyncSession = Depends(get_db),
    _mod=Depends(require_module("services")),
    _user=Depends(get_current_user),
):
    """Executive KPIs summary for professional services."""
    return await db_get_consulting_summary(db=db, _user=_user)


