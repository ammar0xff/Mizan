"""Role definitions and default permissions."""

ROLE_LABELS = {
    "admin":         "مدير عام",
    "manager":       "مشرف",
    "cashier":       "كاشير",
    "storekeeper":   "أمين مخازن",
    "accountant":    "محاسب",
    "doctor":        "طبيب",
    "nurse":         "ممرض/ممرضة",
    "receptionist":  "موظف استقبال",
    "lab_tech":      "فني مختبر",
    "pharmacist":    "صيدلي",
}

# Default permissions per role (used when creating new users)
ROLE_DEFAULT_PERMISSIONS = {
    "admin": [
        "pos", "sales", "quotations", "inventory", "operations",
        "customers", "reports", "archive", "payroll", "users",
        "settings", "admin", "shifts", "finance",
    ],
    "manager": [
        "pos", "sales", "quotations", "inventory", "operations",
        "customers", "reports", "archive", "shifts", "finance", "settings", "payroll",
    ],
    "cashier": [
        "pos", "sales", "quotations", "customers", "shifts",
    ],
    "storekeeper": [
        "inventory", "operations", "archive",
    ],
    "accountant": [
        "reports", "finance", "archive", "customers", "inventory", "payroll",
    ],
    "doctor": [
        "clinic", "clinic:view", "clinic:manage", "clinic:doctor",
        "patients", "reports", "finance",
    ],
    "nurse": [
        "clinic", "clinic:view", "clinic:nurse",
        "patients",
    ],
    "receptionist": [
        "clinic", "clinic:view", "clinic:manage",
        "patients", "customers",
    ],
    "lab_tech": [
        "clinic", "clinic:view", "clinic:manage",
    ],
    "pharmacist": [
        "clinic", "clinic:view", "clinic:manage",
        "inventory", "pos",
    ],
}


