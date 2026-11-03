# Mizan ERP — Module Development Guide

**Target Audience:** Module authors, integration engineers, system architects.  
**Platform Version:** Mizan 3.0 (Modular Enterprise Architecture)

---

## 1. Modular Philosophy (Mizan vs. Monolith)

In Mizan ERP, **every business domain is a module**. From foundational domains like Inventory, Sales, and Accounting to vertical solutions like Restaurants, Clinics, Real Estate, and Hardware Integrations, everything follows the identical modular contract.

```
                           +---------------------------+
                           |    Mizan Core Engine      |
                           |  Tenancy, Auth, RLS, DB   |
                           +---------------------------+
                                         |
     +-------------------+---------------+-------------------+
     |                   |                                   |
[ Core Modules ]   [ Industry Verticals ]           [ Hardware & Workers ]
- core             - restaurant (KDS, Tables, BOM)  - pos_hardware (ESC/POS)
- inventory        - clinic (EMR, Rx, Beds)         - zk_attendance (Biometric)
- pos              - school (Tuition, Attendance)   - automation_worker (Cron)
- finance          - law (Cases, Retainers)
- hr               - gym (Turnstiles, Memberships)
```

### Key Architectural Tenets:
1. **Self-Contained:** A module houses its metadata (`manifest.json`), database models (`models.py`), API endpoints (`router.py`), business rules, and UI contract in a single directory.
2. **Zero-Code Discovery:** Dropping a valid module directory into `backend/app/modules/` immediately registers it across the API, Swagger documentation, and Admin store.
3. **Strict Tenancy Isolation:** Modules operate within PostgreSQL Row-Level Security (RLS). A tenant activating a module has complete data isolation from any other tenant.
4. **Dependency Integrity:** Modules declare dependencies (e.g., `restaurant` requires `pos` and `inventory`). The engine enforces activation order and prevents breaking removals.

---

## 2. Directory Anatomy

Every module lives in `backend/app/modules/<module_id>/`. The canonical structure is:

```
backend/app/modules/<module_id>/
├── manifest.json         # Mandatory: Module descriptor, metadata, settings schema
├── __init__.py           # Mandatory: Package marker and symbol exports
├── models.py             # Optional: SQLAlchemy 2.0 models (inheriting TenantScoped)
├── router.py             # Optional: FastAPI APIRouter endpoints
├── schemas.py            # Optional: Pydantic v2 validation models
├── services/             # Optional: Domain services and complex algorithms
│   └── processor.py
└── ui/                   # Optional: Bundled static/micro-frontend assets
    ├── index.html
    └── bundle.js
```

### File Responsibilities:
- **`manifest.json`**: The heart of the module. Declares identity, version, dependencies, navigation items, and settings schema.
- **`__init__.py`**: Exposes public module APIs and ensures clean Python package resolution.
- **`models.py`**: Defines database tables. All tables must inherit `TenantScoped` and `Base` to ensure automatic tenancy and audit columns.
- **`router.py`**: Must export an instance named `router = APIRouter(...)`. The module loader automatically discovers and mounts this router.

---

## 3. Module Lifecycle & State Machine

```
   [ Packaged .zip ]
           |
     Upload / CLI
           |
           v
   +----------------+     manifest invalid
   |   Discovery    | ------------------------> [ Error / Rejected ]
   +----------------+
           | manifest valid
           v
   +----------------+
   |   Registered   | (Available in Module Catalog)
   +----------------+
           |
           | Tenant Clicks "Install" / "Activate"
           v
   +----------------+     Unsatisfied
   | Dependency Chk | ------------------------> [ Auto-Activate Dependencies ]
   +----------------+
           | All satisfied
           v
   +----------------+
   |  Active Tenant | (Appears in Mizan App Launcher & Nav)
   +----------------+
           |
           | Tenant Updates Settings
           v
   +----------------+
   | Persist Config | (Saved to StoreSetting in PostgreSQL)
   +----------------+
```

### Lifecycle Phases:
1. **Discovery (`loader.py`):** On startup (or after ZIP import), `ModuleRegistry.discover_modules()` scans `backend/app/modules/` for `manifest.json`. It validates fields, extracts settings schemas, and checks for `router.py`.
2. **Catalog Registration:** Modules are merged with the built-in catalog and served via `GET /api/v1/modules`.
3. **Tenant Activation:** When a merchant toggles a module ON, `POST /api/v1/modules/{id}/toggle` adds the module ID to the tenant's `installed_modules` record in `StoreSetting`. All declared `dependencies` are recursively resolved and activated.
4. **Endpoint Protection:** Routes are guarded by the `require_module("<module_id>")` dependency. If tenant A hasn't activated `pharmacy`, any request to `/api/v1/modules/pharmacy/*` returns `403 Forbidden` with a friendly localized message.
5. **Deactivation Protection:** If module `A` is required by active module `B`, deactivating `A` is blocked until `B` is first deactivated.

---

## 4. Frontend Integration Models

Mizan supports three frontend integration strategies:

### Model A: Zero-Code Declarative UI (Instant)
If your module only requires configuration parameters (API keys, preferences, operational modes, toggles), define them in `manifest.json` under `settings_schema`.

- **How it works:** Mizan's core UI dynamically renders input fields (switches, text inputs, number pickers, dropdown selects) in the module's management modal.
- **Persistence:** Values are saved to PostgreSQL via `POST /api/v1/modules/{id}/settings` and merged with defaults automatically.
- **Developer Effort:** **Zero lines of frontend code.**

### Model B: Packaged UI Bundle (Self-Contained)
If your module has custom interactive screens and you wish to distribute it as a single `.zip` file without touching the host React repository:
1. Build your frontend as a static bundle (`index.html`, CSS, JS).
2. Place the assets inside a `ui/` directory within your module folder.
3. The manifest points to `ui/index.html`.
4. Mizan serves the bundle inside an isolated sandboxed iframe or Web Component, passing the tenant token and API base URL via `postMessage` or URL query parameters.

### Model C: Native React Feature (Core Integration)
For high-performance, deeply integrated modules (like POS, Restaurant KDS, or Healthcare EMR):
1. Create a feature folder in `frontend/src/features/<module_id>/`.
2. Use Mizan's design tokens and Radix UI Kit primitives (`components/kit/`).
3. Add routes in `frontend/src/App.tsx`.
4. Register the module tile in `frontend/src/components/MizanAppLauncher.tsx`.

---

## 5. Packaging & Distributing Modules (.zip)

Third-party developers can package modules into standard `.zip` archives.

### Rules for Packaging:
1. The root of the `.zip` (or immediate single top-level directory) must contain `manifest.json`.
2. No absolute paths or parent directory traversal (`../`) inside file entries.
3. Keep database schema definitions inside `models.py`.

### Archive Structure Example:
```
loyalty_points.zip
├── manifest.json
├── __init__.py
├── models.py
└── router.py
```

### Installation Methods:
1. **Via Mizan Admin UI:** Navigate to `/modules` -> Click **"استيراد إضافة" (Import Module)** -> Upload `.zip`.
2. **Via REST API:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/modules/upload" \
     -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
     -F "file=@loyalty_points.zip"
   ```
3. **Via Filesystem:** Unzip directly into `backend/app/modules/<module_id>/` and restart the backend container or call `registry.discover_modules()`.
