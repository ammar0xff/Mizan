"""Universal Modular App Engine for Mizan ERP.

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
        name="العيادات والمراكز الطبية والمستشفيات",
        name_en="Healthcare & Clinic/Hospital ERP",
        category="healthcare",
        version="1.0.0",
        icon="Stethoscope",
        badge="Phase 3",
        description="السجلات الطبية الإلكترونية (EMR)، حجز المواعيد والكشوفات، الروشتات الرقمية (e-Rx)، الفحوصات والتحاليل، وغرف وأسِرّة التنويم.",
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
    "law": ModuleManifest(
        id="law",
        name="مكاتب المحاماة والاستشارات القانونية",
        name_en="Law Firm & Legal Practice Management",
        category="professional_services",
        version="1.0.0",
        icon="Scale",
        badge="Phase 3",
        description="إدارة القضايا والملفات القضائية، الأجندة وجلسات المحاكم، فحص تعارض المصالح، الساعات المهنية المحتسبة، وحسابات أمانات العملاء المفرزة.",
        dependencies=["core", "finance"],
    ),
    "travel": ModuleManifest(
        id="travel",
        name="شركات السياحة ووكالات السفر والحجوزات",
        name_en="Travel & Tourism Agency Management",
        category="tourism_hospitality",
        version="1.0.0",
        icon="Plane",
        badge="Phase 3",
        description="بناء وتصميم البرامج السياحية (Itinerary Builder)، حجوزات الطيران والفنادق، منافست الركاب، محرك العمولات والهوامش، وخزينة الجوازات والتأشيرات.",
        dependencies=["core", "finance"],
    ),
    "hospitality": ModuleManifest(
        id="hospitality",
        name="الفنادق والمنتجعات ونظام الضيافة (PMS)",
        name_en="Hotel Property Management System (PMS)",
        category="tourism_hospitality",
        version="1.0.0",
        icon="Building",
        badge="Phase 3",
        description="إدارة الغرف الفندقية، الحجوزات والتسكين (Check-in/Check-out)، فواتير النزلاء (Folio)، مهام التدبير المنزلي، والتدقيق الليلي (Night Audit).",
        dependencies=["core", "finance"],
    ),
    "gym": ModuleManifest(
        id="gym",
        name="الأندية الصحية والجيم والأنشطة الرياضية",
        name_en="Gym & Fitness Sports Club Management",
        category="sports_wellness",
        version="1.0.0",
        icon="Dumbbell",
        badge="Phase 3",
        description="عضويات الجيم واشتراكات اللياقة، بوابات العبور الإلكترونية (Turnstiles)، باقات التدريب الخاص (PT)، جداول الحصص الجماعية، وقياسات InBody.",
        dependencies=["core", "finance"],
    ),
    "salon": ModuleManifest(
        id="salon",
        name="صالونات التجميل والسبا والعناية الشخصية",
        name_en="Salon, Spa & Personal Care Management",
        category="sports_wellness",
        version="1.0.0",
        icon="Scissors",
        badge="Phase 3",
        description="دليل الخدمات وفترات التنفيذ (Duration Matrix)، أجندة مصففي الشعر والغرف، تتبع تركيبات الصبغة، محرك عمولات المصففين، واستهلاك المواد الخام.",
        dependencies=["core", "finance"],
    ),
    "agency": ModuleManifest(
        id="agency",
        name="وكالات الدعاية والإعلام والترجمة المعتمدة",
        name_en="Creative, Media & Translation Agency",
        category="professional_services",
        version="1.0.0",
        icon="Palette",
        badge="Phase 3",
        description="إدارة المشاريع الإبداعية ومراحل التسليم، سعة وإشغال فريق العمل (Capacity Board)، تتبع استهلاك ساعات العقود (Retainers)، والترجمة المعتمدة.",
        dependencies=["core", "finance"],
    ),
    "field_service": ModuleManifest(
        id="field_service",
        name="الصيانة الميدانية والتشغيل والخدمات الفنية (FSM)",
        name_en="Field Service & Maintenance Management",
        category="services",
        version="1.0.0",
        icon="Wrench",
        badge="Phase 3",
        description="أوامر العمل الميدانية وبلاغات الأعطال، تتبع الفنيين ومواقع العمل (GPS Dispatch)، مخزون سيارات الصيانة (Van Inventory)، واتفاقيات مستوى الخدمة (SLA).",
        dependencies=["core", "finance", "inventory"],
    ),
    "mfg": ModuleManifest(
        id="mfg",
        name="التصنيع الميكانيكي وخطوط التجميع (Discrete MFG)",
        name_en="Discrete Manufacturing & Assembly",
        category="manufacturing",
        version="1.0.0",
        icon="Factory",
        badge="Phase 4",
        description="شجرة المنتج متعددة المستويات (BOM)، مراكز العمل ومسارات التشغيل، تخطيط الاحتياجات (MRP)، أوامر الإنتاج والرقابة على الصالة، وحساب كفاءة المعدات OEE.",
        dependencies=["core", "inventory", "purchases"],
    ),
    "fod": ModuleManifest(
        id="fod",
        name="الصناعات الغذائية والمشروبات (HACCP/FEFO)",
        name_en="Food & Beverage Process Manufacturing",
        category="manufacturing",
        version="1.0.0",
        icon="Utensils",
        badge="Phase 4",
        description="وصفات الخلط والإنتاج المستمر، تتبع التشغيلات العكسي والتصاعدي، نقاط التحكم الحرجة (HACCP)، إدارة تواريخ الصلاحية (FEFO)، والاستدعاء التجريبي Mock Recall.",
        dependencies=["core", "inventory", "purchases"],
    ),
    "phm": ModuleManifest(
        id="phm",
        name="التصنيع الدوائي والكيميائي (cGMP / 21 CFR Part 11)",
        name_en="Pharmaceutical & Chemical GMP Manufacturing",
        category="manufacturing",
        version="1.0.0",
        icon="ShieldCheck",
        badge="Phase 4",
        description="سجلات التشغيل الإلكترونية (EBR)، الإفراج الدوائي QP Batch Release، إدارة الحيود والإجراءات التصحيحية (CAPA)، التوقيع الرقمي 21 CFR Part 11، ودراسات الثباتية.",
        dependencies=["core", "inventory", "purchases", "pharmacy"],
    ),
    "prn": ModuleManifest(
        id="prn",
        name="الطباعة والتغليف والكرتون (Job Dockets/MHR)",
        name_en="Printing & Packaging ERP",
        category="manufacturing",
        version="1.0.0",
        icon="Printer",
        badge="Phase 4",
        description="تذاكر الشغل والطباعة Job Dockets، تخطيط المونتاج Imposition، جدولة ماكينات الطباعة وتغيير الأحبار، تكلفة ساعات التشغيل الميكانيكية MHR، ومخزون الورق بالجراماج GSM.",
        dependencies=["core", "inventory", "purchases", "mfg"],
    ),
    "cst": ModuleManifest(
        id="cst",
        name="المقاولات العامة والإنشاءات الهندسية (Construction & Contracting)",
        name_en="Construction & Contracting ERP",
        category="infrastructure_projects",
        version="1.0.0",
        icon="HardHat",
        badge="Phase 5",
        description="هيكل تجزئة العمل WBS، جداول الكميات BOQ، مستخلصات التنفيذ IPC والاستقطاعات وحسن التنفيذ، أوامر التغيير والمطالبات، والمعدات الثقيلة.",
        dependencies=["core", "inventory", "purchases", "finance", "hr"],
    ),
    "rec": ModuleManifest(
        id="rec",
        name="التطوير العقاري وإدارة الممتلكات (Real Estate & Property Management)",
        name_en="Real Estate & Property Management ERP",
        category="infrastructure_projects",
        version="1.0.0",
        icon="Building2",
        badge="Phase 5",
        description="محفظة العقارات والوحدات، مصفوفة الشواغر والإشغال، عقود الإيجار، حافظة شيكات PDC، رسوم الصيانة CAM، وعوائد التشغيل الصافية NOI.",
        dependencies=["core", "finance"],
    ),
    "agr": ModuleManifest(
        id="agr",
        name="الزراعة التجارية وإدارة المزارع والمحاصيل (Agriculture & Livestock)",
        name_en="Commercial Agriculture & Farm Management ERP",
        category="infrastructure_projects",
        version="1.0.0",
        icon="Tractor",
        badge="Phase 5",
        description="هيكل الأراضي والبيفوتات الزراعية، تخطيط المواسم، برامج التسميد والمكافحة وفترات الأمان PHI، دورات الري، وتتبع الحصاد والتصدير GlobalG.A.P.",
        dependencies=["core", "inventory", "purchases", "finance"],
    ),
    "eng": ModuleManifest(
        id="eng",
        name="محطات الطاقة وتوليد الكهرباء (Power Plant & Grid ERP)",
        name_en="Energy & Power Generation Plant ERP",
        category="infrastructure_projects",
        version="1.0.0",
        icon="Zap",
        badge="Phase 5",
        description="شجرة الأصول القياسية ISO 14224/KKS، بيانات SCADA والحساسات اللحظية MW، الصيانة التنبؤية، تسوية عقود PPA، وتصاريح العمل PTW/LOTO.",
        dependencies=["core", "inventory", "purchases", "finance", "hr"],
    ),
    "bnk": ModuleManifest(
        id="bnk",
        name="الأنظمة المصرفية والمؤسسات المالية (Banking ERP)",
        name_en="Banking & Financial Institutions ERP",
        category="specialized",
        version="1.0.0",
        icon="Landmark",
        badge="Phase 6",
        description="ملف العميل الموحد CIF، دفتر الأستاذ البنكي اللحظي، الإقراض والتقييم الائتماني I-Score، مراقبة غسيل الأموال AML، ومعايير IFRS 9.",
        dependencies=["core", "finance"],
    ),
    "ins": ModuleManifest(
        id="ins",
        name="التأمين وإعادة التأمين وإدارة المطالبات (Insurance ERP)",
        name_en="Insurance & Claims ERP",
        category="specialized",
        version="1.0.0",
        icon="Shield",
        badge="Phase 6",
        description="إصدار وثائق التأمين، احتساب الأقساط الاكتوارية، مطالبات الحوادث والمعاينة الفنية، مخصصات IFRS 17، واتفاقيات إعادة التأمين.",
        dependencies=["core", "finance"],
    ),
    "gov": ModuleManifest(
        id="gov",
        name="القطاع الحكومي والمنظمات غير الهادفة للربح (Government & NGOs)",
        name_en="Government & Nonprofit ERP",
        category="specialized",
        version="1.0.0",
        icon="Building",
        badge="Phase 6",
        description="محاسبة الصناديق المقيدة وغير المقيدة، الارتباط المالي وحجز الموازنات Encumbrance، دورة حياة المنح، وسجل المستفيدين وتوزيع المساعدات.",
        dependencies=["core", "finance"],
    ),
    "ent": ModuleManifest(
        id="ent",
        name="الترفيه والفعاليات والألعاب والملاهي (Entertainment & Events)",
        name_en="Entertainment, Events & Gaming ERP",
        category="specialized",
        version="1.0.0",
        icon="Ticket",
        badge="Phase 6",
        description="كتالوج الفعاليات والعروض، حجز المقاعد المدرجة، بوابات الدخول السريعة Turnstiles، بطاقات ألعاب الملاهي RFID، وبوفيهات الأغذية السريعة.",
        dependencies=["core", "pos", "finance"],
    ),
    "oil": ModuleManifest(
        id="oil",
        name="عمليات البترول والغاز واستخراج الطاقة (Oil & Gas ERP)",
        name_en="Oil & Gas Extraction ERP",
        category="specialized",
        version="1.0.0",
        icon="Flame",
        badge="Phase 6",
        description="شجرة الآبار والمكامن البحرية والبرية، تخصيص الإنتاج الهيدروكربوني اليومي، تقرير الحفر اليومي DDR، صهاريج الخام، ومحاسبة الشركاء JV Cash Calls.",
        dependencies=["core", "finance", "cst", "eng"],
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
    "healthcare": BusinessPreset(
        id="healthcare",
        name="عيادات ومراكز طبية ومستشفيات",
        name_en="Clinics & Healthcare Hospital",
        icon="Stethoscope",
        badge="مراكز طبية",
        description="الملفات الطبية الإلكترونية EMR، حجز المواعيد والكشوفات، الروشتات الرقمية e-Rx، الفحوصات، وإدارة غرف وأسِرّة التنويم والمطالبات.",
        modules=["core", "clinic", "pharmacy", "finance"],
    ),
    "law_firm": BusinessPreset(
        id="law_firm",
        name="مكاتب المحاماة والاستشارات القانونية",
        name_en="Law Firm & Legal Counsel",
        icon="Scale",
        badge="محاماة وقضايا",
        description="إدارة القضايا والملفات القضائية، أجندة الجلسات والطعون، فحص تعارض المصالح، الساعات المهنية المحتسبة، وأمانات الموكلين IOLTA.",
        modules=["core", "law", "finance"],
    ),
    "travel_agency": BusinessPreset(
        id="travel_agency",
        name="وكالات السياحة والسفر والحج والعمرة",
        name_en="Travel & Tourism Agency",
        icon="Plane",
        badge="سياحة وسفر",
        description="بناء وتصميم البرامج السياحية، حجوزات الطيران والفنادق ومنافست الركاب، محرك العمولات، وخزينة التأشيرات والجوازات.",
        modules=["core", "travel", "finance"],
    ),
    "hospitality_hotel": BusinessPreset(
        id="hospitality_hotel",
        name="فنادق ومنتجعات وشقق فندقية (PMS)",
        name_en="Hotel Property Management",
        icon="Building",
        badge="فنادق وضيافة",
        description="تسكين ومغادرة النزلاء (Check-in/Out)، فواتير الغرف والخدمات (Folio)، التدبير المنزلي، والتدقيق الليلي وإيرادات RevPAR.",
        modules=["core", "hospitality", "restaurant", "finance"],
    ),
    "gym_sports": BusinessPreset(
        id="gym_sports",
        name="أندية صحية وجيم وأكاديميات رياضية",
        name_en="Gym & Sports Fitness Club",
        icon="Dumbbell",
        badge="لياقة وجيم",
        description="إدارة عضويات الجيم وتجميد الاشتراكات، بوابات الدخول Turnstile، باقات التدريب الخاص PT، الحصص الجماعية، وقياسات InBody.",
        modules=["core", "gym", "pos", "finance"],
    ),
    "salon_spa": BusinessPreset(
        id="salon_spa",
        name="صالونات تجميل ومراكز سبا وعناية",
        name_en="Salon & Beauty Spa",
        icon="Scissors",
        badge="تجميل وسبا",
        description="مصفوفة الخدمات والمواعيد، تتبع صبغات الشعر وتركيبات العناية، كراسي التصفيف وغرف السبا، ومحرك عمولات المصففين.",
        modules=["core", "salon", "pos", "finance"],
    ),
    "creative_agency": BusinessPreset(
        id="creative_agency",
        name="وكالات دعاية وإعلان ومكاتب ترجمة",
        name_en="Creative & Translation Agency",
        icon="Palette",
        badge="دعاية وترجمة",
        description="المشاريع الإبداعية ومراحل التسليم، مصفوفة سعة الفريق، عقود الساعات الشهرية Retainers، والترجمة المعتمدة وحساب الكلمات.",
        modules=["core", "agency", "services", "finance"],
    ),
    "field_service": BusinessPreset(
        id="field_service",
        name="صيانة ميدانية وخدمات فنية وتشغيل (FSM)",
        name_en="Field Service & Technical Support",
        icon="Wrench",
        badge="صيانة ميدانية",
        description="أوامر العمل وبلاغات الأعطال، توجيه الفنيين GPS، مخزون سيارات الصيانة Van Inventory، عقود الصيانة AMC، ومراقبة SLA.",
        modules=["core", "field_service", "inventory", "finance"],
    ),
    "mfg": BusinessPreset(
        id="mfg",
        name="مصانع ميكانيكية وتجميع وهندسة صناعية",
        name_en="Discrete Manufacturing Plant",
        icon="Factory",
        badge="تصنيع وتجميع",
        description="شجرة المنتج متعددة المستويات BOM، تخطيط الاحتياجات MRP، مراكز التشغيل والمسارات، تكلفة أوامر التشغيل، ومؤشرات كفاءة المعدات OEE.",
        modules=["core", "mfg", "inventory", "purchases", "finance"],
    ),
    "fod": BusinessPreset(
        id="fod",
        name="صناعات غذائية، ألبان، ومشروبات (HACCP)",
        name_en="Food & Beverage Processing Plant",
        icon="Utensils",
        badge="أغذية ومشروبات",
        description="تركيبات ووصفات التصنيع، سلامة الغذاء ونقاط HACCP، السحب والاستدعاء الفوري Mock Recall، وتتبع التشغيلات FEFO.",
        modules=["core", "fod", "inventory", "purchases", "finance"],
    ),
    "phm": BusinessPreset(
        id="phm",
        name="مصانع أدوية ومستحضرات طبية وكيميائية (cGMP)",
        name_en="Pharmaceutical GMP Factory",
        icon="ShieldCheck",
        badge="دوائي وكيميائي",
        description="سجلات التشغيل الدوائية EBR، اعتماد وضبط الجودة QP Release، تقارير الانحرافات وحالات CAPA، وتوقيعات 21 CFR Part 11 المعتمدة.",
        modules=["core", "phm", "pharmacy", "inventory", "purchases", "finance"],
    ),
    "prn": BusinessPreset(
        id="prn",
        name="مطابع، علب كرتون، وخطوط تغليف",
        name_en="Commercial Printing & Packaging Plant",
        icon="Printer",
        badge="طباعة وتغليف",
        description="أوامر الطباعة Job Dockets، تخطيط المونتاج Imposition، إدارة الأحبار والورق GSM، وحساب تكلفة الماكينات بساعات MHR.",
        modules=["core", "prn", "mfg", "inventory", "purchases", "finance"],
    ),
    "cst": BusinessPreset(
        id="cst",
        name="شركات مقاولات، إنشاءات، وأعمال كهروميكانيكية",
        name_en="General Contracting & Construction",
        icon="HardHat",
        badge="مقاولات وإنشاءات",
        description="إدارة مشاريع البناء والمواقع، جداول الكميات BOQ، المستخلصات التنفيذية IPC، تتبع أوامر التغيير، وإدارة المعدات الثقيلة.",
        modules=["core", "cst", "inventory", "purchases", "finance", "hr"],
    ),
    "rec": BusinessPreset(
        id="rec",
        name="تطوير عقاري، مجمعات تجارية، وإدارة أملاك",
        name_en="Real Estate & Property Management",
        icon="Building2",
        badge="عقارات وأملاك",
        description="إدارة المولات والمباني، عقود الإيجار والتحصيل، الشيكات الآجلة PDC، رسوم الخدمات المشتركة CAM، وتحليل عوائد الاستثمار NOI.",
        modules=["core", "rec", "finance"],
    ),
    "agr": BusinessPreset(
        id="agr",
        name="شركات استصلاح زراعي، مزارع، وإنتاج حيواني",
        name_en="Commercial Agriculture & Livestock Farm",
        icon="Tractor",
        badge="زراعة وإنتاج",
        description="إدارة الأراضي والبيفوتات، جداول التسميد والمكافحة PHI، دورات الري، شحنات الحصاد GlobalG.A.P.، وقطعان الألبان والماشية.",
        modules=["core", "agr", "inventory", "purchases", "finance"],
    ),
    "eng": BusinessPreset(
        id="eng",
        name="محطات طاقة شمسية، توربينات، وشبكات كهرباء",
        name_en="Power Generation & Solar Plant",
        icon="Zap",
        badge="طاقة وكهرباء",
        description="إدارة محطات التوليد، ربط SCADA اللحظي، تصاريح العمل وعزل الطاقة PTW/LOTO، تسوية اتفاقيات PPA، ومراقبة الانبعاثات CEMS.",
        modules=["core", "eng", "inventory", "purchases", "finance", "hr"],
    ),
    "bnk": BusinessPreset(
        id="bnk",
        name="بنوك، مؤسسات تمويل، وشركات ائتمان",
        name_en="Banking & Financial Institutions",
        icon="Landmark",
        badge="مصارف وتمويل",
        description="إدارة الحسابات المصرفية، سجل المعاملات الفورية، الجدارة الائتمانية I-Score، تقييم خسائر الائتمان المتوقعة ECL، ومراقبة الامتثال AML.",
        modules=["core", "bnk", "finance"],
    ),
    "ins": BusinessPreset(
        id="ins",
        name="شركات تأمين عام وطبي وإعادة تأمين",
        name_en="Insurance & Reinsurance",
        icon="Shield",
        badge="تأمين ومطالبات",
        description="إصدار وثائق التأمين، إدارة الحوادث والتعويضات FNOL، المعاينات الفنية، مخصصات IFRS 17، وتوزيع اتفاقيات إعادة التأمين.",
        modules=["core", "ins", "finance"],
    ),
    "gov": BusinessPreset(
        id="gov",
        name="هيئات حكومية، صناديق سيادية، ومنظمات دولية",
        name_en="Government & Nonprofit",
        icon="Building",
        badge="قطاع عام ومنظمات",
        description="محاسبة الصناديق والمنح، الرقابة على الموازنات وحجز الارتباطات، سجلات المساعدات الإنسانية والتحقق البصري، والمناقصات الحكومية.",
        modules=["core", "gov", "finance"],
    ),
    "ent": BusinessPreset(
        id="ent",
        name="مدن ملاهي، دور سينما، ومسارح وفعاليات",
        name_en="Entertainment & Theme Parks",
        icon="Ticket",
        badge="ترفيه ومهرجانات",
        description="تنظيم الفعاليات والمقاعد، بوابات التذاكر الإلكترونية، بطاقات شحن ألعاب الأركيد، وبوفيهات الأغذية السريعة.",
        modules=["core", "ent", "pos", "finance"],
    ),
    "oil": BusinessPreset(
        id="oil",
        name="شركات استخراج بترول وغاز، حفر، ومستودعات صهاريج",
        name_en="Oil & Gas E&P",
        icon="Flame",
        badge="بترول وطاقة",
        description="إدارة حقول وآبار البترول والغاز، تقارير الإنتاج، تقرير الحفر اليومي DDR، قياسات صهاريج الخام والمصافي، ومطالبات الشركاء JV Cash Calls.",
        modules=["core", "oil", "finance", "cst", "eng"],
    ),
}

DEFAULT_MODULES = ["core", "inventory", "pos", "finance", "hr"]
DEFAULT_PRESET = "retail"

SECTOR_TO_PRESET: dict[str, str] = {
    "retail": "retail", "restaurant": "restaurant", "pharmacy": "pharmacy",
    "consulting": "services", "school": "school", "wholesale": "wholesale",
    "logistics": "logistics", "wms_3pl": "wms_3pl", "ecommerce": "ecommerce",
    "healthcare": "healthcare", "law_firm": "services", "travel": "travel_agency",
    "hotel": "hospitality_hotel", "gym": "gym_sports", "salon": "salon_spa",
    "agency": "creative_agency", "field_service": "field_service",
    "discrete_mfg": "mfg", "food_mfg": "mfg", "pharma_mfg": "mfg", "printing": "prn",
    "construction": "cst", "real_estate": "rec", "agriculture": "agr", "energy": "services",
    "banking": "bnk", "insurance": "ins", "government": "gov", "entertainment": "ent",
    "oil_gas": "oil", "services": "services", "plumbing": "retail", "electrical": "retail",
    "tiles": "retail", "paint": "retail",
}


async def get_active_modules(db: AsyncSession) -> list[str]:
    """Retrieve the active module list for the current tenant from settings."""
    result = await db.execute(select(StoreSetting).where(StoreSetting.key == "installed_modules"))
    row = result.scalar_one_or_none()
    if row and row.value:
        try:
            mods = json.loads(row.value)
            if isinstance(mods, list):
                # Ensure 'core' is always present
                return list(set(["core"] + mods))
        except Exception:
            pass
    # Fallback for tenants created before installed_modules was persisted:
    # use the tenant's active_modules column.
    try:
        from app.core.tenancy import current_tenant_id
        from app.models.tenant import Tenant

        tid = current_tenant_id.get()
        if tid is not None:
            t = (await db.execute(select(Tenant).where(Tenant.id == tid))).scalar_one_or_none()
            if t and getattr(t, "active_modules", None):
                return list(set(["core"] + list(t.active_modules)))
    except Exception:
        pass
    return list(DEFAULT_MODULES)


async def get_active_preset(db: AsyncSession) -> str:
    """Retrieve active preset identifier."""
    result = await db.execute(select(StoreSetting).where(StoreSetting.key == "active_business_preset"))
    row = result.scalar_one_or_none()
    if row and row.value:
        return row.value
    # Fallback for tenants created before preset was persisted: derive from sector.
    try:
        from app.core.tenancy import current_tenant_id
        from app.models.tenant import Tenant

        tid = current_tenant_id.get()
        if tid is not None:
            t = (await db.execute(select(Tenant).where(Tenant.id == tid))).scalar_one_or_none()
            if t and getattr(t, "sector", None):
                return SECTOR_TO_PRESET.get(t.sector, "retail")
    except Exception:
        pass
    return DEFAULT_PRESET


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
