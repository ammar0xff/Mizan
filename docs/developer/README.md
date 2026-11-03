# Mizan ERP — Developer Documentation Suite

Welcome to the official developer documentation suite for **Mizan ERP (ميزان)**.

Mizan is a high-performance, asynchronous, multi-tenant enterprise resource planning system designed around a self-contained, pluggable module architecture.

---

## 📚 Documentation Index

| Guide | Document Title | Description | Target Audience |
| :---: | :--- | :--- | :--- |
| **[01](01_ARCHITECTURE_OVERVIEW.md)** | **[Architecture Overview](01_ARCHITECTURE_OVERVIEW.md)** | High-level system topology, PostgreSQL Row-Level Security (RLS), multi-tenancy resolution strategies, and technology stack. | All Contributors, Tech Leads |
| **[02](02_MODULE_DEVELOPMENT_GUIDE.md)** | **[Module Development Guide](02_MODULE_DEVELOPMENT_GUIDE.md)** | Modular philosophy, directory anatomy, lifecycle state machine, and the 3 frontend integration models. | Module Authors, Backend/Frontend |
| **[03](03_MANIFEST_SPECIFICATION.md)** | **[Manifest Specification](03_MANIFEST_SPECIFICATION.md)** | Exhaustive reference for `manifest.json`, supported business categories, navigation hooks, and zero-code settings schemas. | Module Authors, Integration Devs |
| **[04](04_BACKEND_MODELS_AND_API.md)** | **[Backend Models & API](04_BACKEND_MODELS_AND_API.md)** | SQLAlchemy 2.0 Async declarative models with `TenantScoped`, FastAPI `APIRouter` mounting, and security guard dependencies. | Backend Engineers, API Devs |
| **[05](05_FRONTEND_AND_UI_KIT.md)** | **[Frontend & UI Kit](05_FRONTEND_AND_UI_KIT.md)** | React 19, Tailwind CSS design tokens, Cairo typography, bidirectional RTL/LTR, Radix UI Kit primitives, and Zustand stores. | Frontend Devs, UI/UX Designers |
| **[06](06_HARDWARE_AND_AUTOMATION.md)** | **[Hardware & Automation](06_HARDWARE_AND_AUTOMATION.md)** | ESC/POS thermal printing (80mm/58mm), ZATCA TLV QR generation, `useBarcodeScanner` listener, background cron, and ZKTeco biometrics. | IoT & Hardware Engineers |
| **[07](07_TUTORIAL_CREATE_A_MODULE.md)** | **[Tutorial: Create a Module](07_TUTORIAL_CREATE_A_MODULE.md)** | Step-by-step walkthrough: Building the "Loyalty Points & Rewards" (`loyalty_rewards`) module from manifest to API and UI. | All Developers (Practical Guide) |
| **[08](08_DEPLOYMENT_AND_CLI.md)** | **[Deployment & CLI Guide](08_DEPLOYMENT_AND_CLI.md)** | Docker Compose configuration, environment variables, Nginx SSL reverse proxy, and `manage.py` administrative CLI commands. | DevOps, SysAdmins, Infrastructure |

---

## 🎯 Role-Based Reading Tracks

Depending on your role or objective, follow these curated reading paths:

### Track A: Third-Party & Extension Module Authors
If your goal is to build a new business vertical or feature package:
1. Start with **[02: Module Development Guide](02_MODULE_DEVELOPMENT_GUIDE.md)** to understand the module contract.
2. Review **[03: Manifest Specification](03_MANIFEST_SPECIFICATION.md)** to declare metadata and settings.
3. Follow **[07: Tutorial: Create a Module](07_TUTORIAL_CREATE_A_MODULE.md)** to build and test a concrete module.
4. Deepen your backend implementation with **[04: Backend Models & API](04_BACKEND_MODELS_AND_API.md)**.

### Track B: Core Backend Engineers
If you are contributing to Mizan's core engine, API endpoints, or database:
1. Read **[01: Architecture Overview](01_ARCHITECTURE_OVERVIEW.md)** for PostgreSQL RLS and tenancy models.
2. Read **[04: Backend Models & API](04_BACKEND_MODELS_AND_API.md)** for SQLAlchemy 2.0 async conventions.
3. Read **[08: Deployment & CLI Guide](08_DEPLOYMENT_AND_CLI.md)** for database migrations and CLI commands.

### Track C: Frontend & UI/UX Engineers
If you are designing interfaces, cashier screens, or mobile layouts:
1. Read **[01: Architecture Overview](01_ARCHITECTURE_OVERVIEW.md)** for high-level structure.
2. Read **[05: Frontend & UI Kit](05_FRONTEND_AND_UI_KIT.md)** for Tailwind tokens, Cairo RTL, and Radix primitives.
3. Review **[02: Module Development Guide (Section 4)](02_MODULE_DEVELOPMENT_GUIDE.md#4-frontend-integration-models)** for UI integration models.

### Track D: Hardware, IoT & Automation Specialists
If you are integrating physical devices, printers, scanners, or background jobs:
1. Read **[06: Hardware Integration & Automation Workers](06_HARDWARE_AND_AUTOMATION.md)**.
2. Read **[04: Backend Models & API](04_BACKEND_MODELS_AND_API.md)** for endpoint protection.

### Track E: DevOps & Platform Administrators
If you are deploying, backing up, or scaling Mizan clusters:
1. Read **[01: Architecture Overview](01_ARCHITECTURE_OVERVIEW.md)**.
2. Read **[08: Deployment & CLI Guide](08_DEPLOYMENT_AND_CLI.md)**.

---

## ⚙️ Coding Standards & Contributing Guidelines

1. **Naming Conventions:** All references to the platform must use **Mizan (ميزان)**.
2. **Multi-Tenancy Guard:** Never write raw SQL or SQLAlchemy queries without verifying tenant isolation via `TenantScoped` and `current_tenant()`.
3. **Async Everywhere:** Backend endpoints and database sessions must remain 100% asynchronous (`async def`, `await db.execute()`).
4. **Localization (i18n):** User-facing strings must support both Arabic (RTL) and English (LTR).
5. **No Broken Modules:** Every module added to `backend/app/modules/` must contain valid `manifest.json`, `models.py`, `router.py`, and `__init__.py`.
