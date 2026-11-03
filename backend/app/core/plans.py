"""Vendora SaaS Subscription Plans & Quotas Definition."""
from __future__ import annotations

from typing import Any, Dict

PLANS_CONFIG: Dict[str, Dict[str, Any]] = {
    "trial": {
        "id": "trial",
        "name": "الباقة التجريبية (Trial)",
        "name_en": "Trial",
        "price_monthly_egp": 0,
        "price_annual_egp": 0,
        "max_users": 3,
        "max_branches": 1,
        "max_monthly_sales": 100,
        "max_storage_mb": 1024,
        "trial_days": 14,
        "popular": False,
        "allowed_module_categories": ["core", "preset"],
        "features": [
            "فترة تجريبية 14 يوماً",
            "حتى 3 مستخدمين",
            "فرع واحد / مستودع رئيسي",
            "100 فاتورة مبيعات شهرياً",
            "نقاط البيع والمخزون الأساسي",
        ],
    },
    "starter": {
        "id": "starter",
        "name": "باقة البداية (Starter)",
        "name_en": "Starter",
        "price_monthly_egp": 450,
        "price_annual_egp": 4500,
        "max_users": 5,
        "max_branches": 1,
        "max_monthly_sales": 500,
        "max_storage_mb": 5120,
        "trial_days": 0,
        "popular": False,
        "allowed_module_categories": ["core", "phase1", "preset"],
        "features": [
            "فرع واحد متكامل",
            "حتى 5 مستخدمين",
            "500 فاتورة مبيعات شهرياً",
            "إدارة المخزون والموردين والعملاء",
            "طباعة إيصالات حرارية 80mm/58mm",
            "أرشفة إلكترونية ونسخ احتياطي",
        ],
    },
    "pro": {
        "id": "pro",
        "name": "باقة المحترفين (Pro)",
        "name_en": "Professional",
        "price_monthly_egp": 850,
        "price_annual_egp": 8500,
        "max_users": 15,
        "max_branches": 3,
        "max_monthly_sales": 5000,
        "max_storage_mb": 20480,
        "trial_days": 0,
        "popular": True,
        "allowed_module_categories": ["core", "phase1", "phase2", "phase3", "preset"],
        "features": [
            "حتى 3 فروع ومستودعات",
            "حتى 15 مستخدماً",
            "5,000 فاتورة مبيعات شهرياً",
            "كافة الأنشطة التجارية والخدمية وسلاسل الإمداد",
            "قاعدة بيانات سحابية مستقلة (PostgreSQL / Neon)",
            "إدارة الرواتب وشؤون الموظفين (HR)",
            "دعم فني مباشر على مدار الساعة",
        ],
    },
    "enterprise": {
        "id": "enterprise",
        "name": "باقة المؤسسات الكبرى (Enterprise)",
        "name_en": "Enterprise",
        "price_monthly_egp": 1950,
        "price_annual_egp": 19500,
        "max_users": 99999,
        "max_branches": 999,
        "max_monthly_sales": 9999999,
        "max_storage_mb": 102400,
        "trial_days": 0,
        "popular": False,
        "allowed_module_categories": ["all"],
        "features": [
            "فروع ومستخدمون ومبيعات بلا حدود",
            "كافة الأنشطة الـ 30 (تصنيع، مقاولات، بنوك، بترول)",
            "خادم VPS مخصص مع عزل أمني فائق",
            "نطاق مخصص (Custom Domain) وشهادة SSL خاصة",
            "ترخيص نسخة سطح مكتب أوفلاين (.exe)",
            "مدير حساب تقني ودعم مخصص",
        ],
    },
}


def get_plan(plan_id: str) -> Dict[str, Any]:
    """Retrieve plan configuration or default to trial."""
    return PLANS_CONFIG.get(plan_id.lower(), PLANS_CONFIG["trial"])


def get_plan_limits(plan_id: str) -> Dict[str, Any]:
    """Return dictionary of numerical quotas for a plan."""
    plan = get_plan(plan_id)
    return {
        "max_users": plan["max_users"],
        "max_branches": plan["max_branches"],
        "max_monthly_sales": plan["max_monthly_sales"],
        "max_storage_mb": plan["max_storage_mb"],
    }
