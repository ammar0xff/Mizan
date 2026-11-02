"""Universal Modular App Engine for Vendora ERP.

Provides a pluggable module registry, business presets (Retail, Restaurant,
School, Services, Clinic), dependency resolution, and tenant-scoped module
activation.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Any

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.settings import StoreSetting


@dataclass
class ModuleManifest:
    id: str
    name: str
    name_en: str
    category: str
    version: str
    icon: str
    description: str
    dependencies: list[str] = field(default_factory=list)
    is_core: bool = False
    is_installed: bool = False
    badge: str | None = None


@dataclass
class BusinessPreset:
    id: str
    name: str
    name_en: str
    icon: str
    badge: str
    description: str
    modules: list[str]


# Built-in Catalog of Business Modules
MODULE_CATALOG: dict[str, ModuleManifest] = {
    "core": ModuleManifest(
        id="core",
        name="النواة الأساسية",
        name_en="Core System",
        category="core",
        version="3.0.0",
        icon="Layers",
        description="المحرك المالي الموحد، إدارة المستخدمين، الصلاحيات، الخزائن، وسجل التدقيق الرقابي.",
        dependencies=[],
        is_core=True,
    ),
    "inventory": ModuleManifest(
        id="inventory",
        name="إدارة المخزون والتوريد",
        name_en="Inventory & Supply",
        category="retail",
        version="3.0.0",
        icon="Boxes",
        description="تتبع الأرصدة اللحظية، إدارة الفروع والمستودعات، تسويات الجرد، وأوامر الشراء والتوريد.",
        dependencies=["core"],
    ),
    "pos": ModuleManifest(
        id="pos",
        name="نقطة البيع السريعة والكاشير",
        name_en="Point of Sale",
        category="retail",
        version="3.0.0",
        icon="ShoppingCart",
        description="إصدار الفواتير الفوري، دعم قارئ الباركود، الشاشات اللمسية، إدارة أدراج الكاشير والورديات.",
        dependencies=["core", "inventory"],
    ),
    "finance": ModuleManifest(
        id="finance",
        name="المالية والحسابات والذمم (AR/AP)",
        name_en="Finance & Ledgers",
        category="finance",
        version="3.0.0",
        icon="Wallet",
        description="كشوف حسابات العملاء والموردين، إدارة الخزائن والمحافظ الإلكترونية، القيود والمصروفات.",
        dependencies=["core"],
    ),
    "hr": ModuleManifest(
        id="hr",
        name="الموارد البشرية والرواتب",
        name_en="Human Resources & Payroll",
        category="hr",
        version="3.0.0",
        icon="UserCog",
        description="سجلات الموظفين، ساعات العمل والحضور، مسيرات الرواتب الشهرية، والسلف والخصومات.",
        dependencies=["core"],
    ),
    "restaurant": ModuleManifest(
        id="restaurant",
        name="إدارة المطاعم والكافيهات",
        name_en="Restaurant & Hospitality",
        category="hospitality",
        version="1.0.0",
        icon="UtensilsCrossed",
        badge="جديد",
        description="مخطط صالة الطعام وحجز الطاولات، شاشات المطبخ اللحظية (KDS)، ووصفات المأكولات وخصم المكونات (BOM).",
        dependencies=["core", "pos", "inventory"],
    ),
    "school": ModuleManifest(
        id="school",
        name="المدارس والأكاديميات التعليمية",
        name_en="School & Education",
        category="education",
        version="1.0.0",
        icon="GraduationCap",
        badge="جديد",
        description="شؤون الطلاب، إدارة المراحل والفصول، تحصيل الأقساط والمصروفات المجدولة، ودفاتر الحضور الأكاديمي.",
        dependencies=["core", "finance"],
    ),
    "clinic": ModuleManifest(
        id="clinic",
        name="العيادات والمراكز الطبية",
        name_en="Clinics & Healthcare",
        category="healthcare",
        version="1.0.0",
        icon="Stethoscope",
        badge="قريباً",
        description="سجلات المرضى الطبية، حجز المواعيد والكشوفات، الروشتات، وصرف الأدوية والمستلزمات الطبية.",
        dependencies=["core", "inventory", "finance"],
    ),
    "services": ModuleManifest(
        id="services",
        name="الشركات والمكاتب الخدمية",
        name_en="Professional Services",
        category="services",
        version="1.0.0",
        icon="Briefcase",
        description="عروض الأسعار، عقود المشاريع، المطالبات والفوترة الزمنية، ومتابعة تسليمات العملاء.",
        dependencies=["core", "finance"],
    ),
    "pharmacy": ModuleManifest(
        id="pharmacy",
        name="الصيدليات وصرف الأدوية",
        name_en="Pharmacy & Dispensing",
        category="healthcare",
        version="1.0.0",
        icon="Pill",
        badge="جديد",
        description="دليل الأدوية والبدائل التكافؤية (INN)، صرف الروشتات والتأمين الطبي، تتبع الصلاحيات (FEFO)، ودفتر الأدوية المراقبة.",
        dependencies=["core", "inventory", "pos", "finance"],
    ),
    "wholesale": ModuleManifest(
        id="wholesale",
        name="تجارة الجملة والتوزيع والتوريدات",
        name_en="Wholesale & Bulk Distribution",
        category="distribution_logistics",
        version="1.0.0",
        icon="Boxes",
        badge="Phase 2",
        description="سلالم التسعير الكمي المتدرج، قوائم أسعار العملاء، سقوف المديونية، تكلفة الاستيراد المفرغة، والشحن المباشر ومكافآت التوزيع.",
        dependencies=["core", "inventory", "finance"],
    ),
    "logistics": ModuleManifest(
        id="logistics",
        name="الشحن والخدمات اللوجستية والأسطول",
        name_en="Logistics & Fleet Transportation",
        category="distribution_logistics",
        version="1.0.0",
        icon="Truck",
        badge="Phase 2",
        description="تتبع دورة حياة الشحنات وبوالص الشحن (AWB/BoL)، تخطيط المسارات، إدارة أساطيل المركبات، إثبات التسليم الرقمي e-POD، وتكاليف الوقود.",
        dependencies=["core", "finance"],
    ),
    "wms": ModuleManifest(
        id="wms",
        name="المستودعات والخدمات اللوجستية للغير (3PL WMS)",
        name_en="3PL & Warehouse Management",
        category="distribution_logistics",
        version="1.0.0",
        icon="Warehouse",
        badge="Phase 2",
        description="مستودعات العملاء المتعددين وعزل ملكية المخزون، المواقع التخزينية المرمزة، موجات الجمع والانتقاء، والعبور المباشر والفوترة الشهرية.",
        dependencies=["core", "inventory", "finance"],
    ),
    "ecommerce": ModuleManifest(
        id="ecommerce",
        name="التجارة الإلكترونية والربط متعدد القنوات",
        name_en="Omnichannel E-commerce & Fulfillment",
        category="distribution_logistics",
        version="1.0.0",
        icon="Globe",
        badge="Phase 2",
        description="ربط المتاجر والمنصات الرقمية، مخزون الأمان العازل، دورة التجهيز Pick-Pack-Ship وبوالص الشحن، تسوية بوابات الدفع وCOD والمرتجعات.",
        dependencies=["core", "inventory", "finance"],
    ),
}

# Pre-packaged Business Vertical Bundles
BUSINESS_PRESETS: dict[str, BusinessPreset] = {
    "retail": BusinessPreset(
        id="retail",
        name="تجارة وتجزئة ومستودعات",
        name_en="Retail & Supermarket",
        icon="Store",
        badge="الأكثر شيوعاً",
        description="الحزمة الكاملة للمحلات التجارية، السوبرماركت، والمتاجر الاستهلاكية ومستودعات التجزئة.",
        modules=["core", "inventory", "pos", "finance", "hr"],
    ),
    "restaurant": BusinessPreset(
        id="restaurant",
        name="مطاعم، كافيهات، وضيافة",
        name_en="Restaurant & Hospitality",
        icon="UtensilsCrossed",
        badge="مخصص للمطاعم",
        description="إدارة متكاملة لصالة الطعام، تقسيم الطاولات، شاشات المطبخ، حسم مخزون المكونات الخام، والتوصيل.",
        modules=["core", "pos", "restaurant", "inventory", "finance"],
    ),
    "school": BusinessPreset(
        id="school",
        name="مدارس، جامعات، ومراكز تدريب",
        name_en="School & Academy",
        icon="GraduationCap",
        badge="مخصص للتعليم",
        description="إدارة شاملة لشؤون الطلاب، دفعات الأقساط، كشوف الحضور الأكاديمية، ورواتب المعلمين والموظفين.",
        modules=["core", "school", "finance", "hr"],
    ),
    "services": BusinessPreset(
        id="services",
        name="شركات خدمات، مكاتب، ومقاولات",
        name_en="Services & Consulting",
        icon="Briefcase",
        badge="مخصص للمشاريع",
        description="إصدار عروض الأسعار والمطالبات، تتبع عقود المشاريع والخدمات الاستشارية، وإدارة فريق العمل.",
        modules=["core", "services", "finance", "hr"],
    ),
    "pharmacy": BusinessPreset(
        id="pharmacy",
        name="صيدليات، مستودعات أدوية، ومراكز صرف",
        name_en="Pharmacy & Pharmaceuticals",
        icon="Pill",
        badge="مخصص للصيدليات",
        description="إدارة صرف الروشتات، حساب نسب التأمين، تتبع تواريخ الصلاحية والتشغيلات (FEFO)، وبدائل الأدوية العلمية، ودفتر السموم والمخدرات.",
        modules=["core", "inventory", "pos", "finance", "pharmacy"],
    ),
    "wholesale": BusinessPreset(
        id="wholesale",
        name="تجارة الجملة والتوزيع والتوريدات",
        name_en="Wholesale & Bulk Distribution",
        icon="Boxes",
        badge="توزيع وتوريدات",
        description="سلالم الأسعار الكمية، سقوف المديونية، تكلفة الاستيراد المفرغة Landed Cost، والشحن المباشر Drop-Shipping، ومكافآت التوزيع التراكمية.",
        modules=["core", "inventory", "finance", "wholesale"],
    ),
    "logistics": BusinessPreset(
        id="logistics",
        name="شحن ونقل وخدمات لوجستية وأساطيل",
        name_en="Logistics & Fleet Transportation",
        icon="Truck",
        badge="شحن وأساطيل",
        description="تتبع بوالص الشحن AWB/BoL، توجيه وتخطيط الرحلات، فحص دوري للمركبات، امتثال السائقين، إثبات التسليم الرقمي e-POD، وتكاليف الوقود.",
        modules=["core", "finance", "logistics"],
    ),
    "wms_3pl": BusinessPreset(
        id="wms_3pl",
        name="مستودعات وخدمات لوجستية للغير (3PL WMS)",
        name_en="3PL & Warehouse Management",
        icon="Warehouse",
        badge="مستودعات 3PL",
        description="إدارة مستودعات العملاء المتعددين، ترميز المواقع التخزينية، موجات الجمع والانتقاء، العبور السريع Cross-Docking، والفوترة الشهرية.",
        modules=["core", "inventory", "finance", "wms"],
    ),
    "ecommerce": BusinessPreset(
        id="ecommerce",
        name="تجارة إلكترونية ومتاجر متعددة القنوات",
        name_en="Omnichannel E-commerce",
        icon="Globe",
        badge="متاجر إلكترونية",
        description="ربط منصات المتاجر الرقمية، مخزون الأمان العازل، خط سير تجهيز الشحنات، تسوية بوابات الدفع، الدفع عند الاستلام COD، والمرتجعات RMA.",
        modules=["core", "inventory", "finance", "ecommerce"],
    ),
}

DEFAULT_MODULES = ["core", "inventory", "pos", "finance", "hr"]
DEFAULT_PRESET = "retail"


async def get_active_modules(db: AsyncSession) -> list[str]:
    """Retrieve the active module list for the current tenant from settings."""
    result = await db.execute(select(StoreSetting).where(StoreSetting.key == "installed_modules"))
    row = result.scalar_one_or_none()
    if not row or not row.value:
        return list(DEFAULT_MODULES)
    try:
        mods = json.loads(row.value)
        if isinstance(mods, list):
            # Ensure 'core' is always present
            return list(set(["core"] + mods))
    except Exception:
        pass
    return list(DEFAULT_MODULES)


async def get_active_preset(db: AsyncSession) -> str:
    """Retrieve active preset identifier."""
    result = await db.execute(select(StoreSetting).where(StoreSetting.key == "active_business_preset"))
    row = result.scalar_one_or_none()
    return row.value if row and row.value else DEFAULT_PRESET


async def set_active_modules(db: AsyncSession, modules: list[str], preset_id: str | None = None) -> None:
    """Save active modules and optional preset for the current tenant."""
    # Ensure core is always active
    clean_mods = list(set(["core"] + modules))

    # Validate dependencies
    for mod_id in clean_mods:
        manifest = MODULE_CATALOG.get(mod_id)
        if manifest:
            for dep in manifest.dependencies:
                if dep not in clean_mods:
                    clean_mods.append(dep)

    # Upsert installed_modules
    val_json = json.dumps(clean_mods)
    res = await db.execute(select(StoreSetting).where(StoreSetting.key == "installed_modules"))
    row = res.scalar_one_or_none()
    if row:
        row.value = val_json
    else:
        db.add(StoreSetting(key="installed_modules", value=val_json))

    if preset_id:
        res_p = await db.execute(select(StoreSetting).where(StoreSetting.key == "active_business_preset"))
        row_p = res_p.scalar_one_or_none()
        if row_p:
            row_p.value = preset_id
        else:
            db.add(StoreSetting(key="active_business_preset", value=preset_id))

    await db.commit()


def require_module(module_id: str):
    """FastAPI dependency to guard endpoints requiring a specific active module."""
    async def _checker(db: AsyncSession = Depends(get_db)):
        active = await get_active_modules(db)
        if module_id not in active:
            manifest = MODULE_CATALOG.get(module_id)
            name = manifest.name if manifest else module_id
            raise HTTPException(
                status_code=403,
                detail=f"وحدة «{name}» غير مفعلة في اشتراك المنشأة الحالي. يمكنك تفعيلها من متجر الإضافات.",
            )
        return True

    return _checker
