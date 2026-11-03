# Mizan ERP — Architecture Overview & Technical Foundations

**Target Audience:** Core contributors, backend/frontend engineers, technical leads.  
**Platform Version:** Mizan 3.0 (Modular Enterprise SaaS)

---

## 1. System High-Level Architecture

Mizan is architected as an asynchronous, multi-tenant enterprise resource planning (ERP) platform designed for extreme horizontal scalability, strong cryptographic isolation between tenants, and a pluggable modular extension system.

```
                           [ Clients / Browsers ]
                                     |
               +---------------------+---------------------+
               |                     |                     |
     [ Admin / Cashier POS ]   [ Public Storefront ]   [ Admoon SaaS Admin ]
      (/c/:slug or /:slug)      (/store/:slug)              (/admoon)
               |                     |                     |
               +---------------------+---------------------+
                                     |
                          [ Nginx / Cloudflare ]
                                     |
                  +------------------+------------------+
                  |                                     |
         [ Frontend SPA (Vite) ]               [ Backend API (FastAPI) ]
           React 19 + Tailwind                     Uvicorn + Python 3.12
           Zustand + TanStack                      AsyncIO + SQLAlchemy 2.0
                  |                                     |
                  +------------------+------------------+
                                     |
                    +----------------+----------------+
                    |                                 |
         [ PostgreSQL Database ]             [ Hardware & Devices ]
          Row-Level Security (RLS)            Thermal Printers (ESC/POS)
          Zero-Mock Schema                    USB/BT Barcode Scanners
          Tenancy-Scoped Queries              ZKTeco Biometric Devices (TCP 4370)
```

---

## 2. Technology Stack

### Backend Stack
- **Runtime:** Python 3.12+ (AsyncIO, uvloop)
- **Web Framework:** FastAPI (Asynchronous REST API, OpenAPI/Swagger 3.0 documentation at `/docs`)
- **ORM & Data Access:** SQLAlchemy 2.0 (Async Engine, `select` syntax, declarative mappings)
- **Database:** PostgreSQL 16+ with native **Row-Level Security (RLS)**
- **Driver:** `asyncpg` (high-performance asynchronous PostgreSQL driver)
- **Password Security:** Argon2 / Bcrypt cryptographic password hashing
- **Authentication:** JWT (JSON Web Tokens) with HS256, expiration tracking, and role claims

### Frontend Stack
- **Framework:** React 19 with TypeScript
- **Bundler:** Vite 6 with HMR and split chunking
- **Styling:** Tailwind CSS 3.4 + Radix UI Primitives + CSS Variables (Design Tokens)
- **Typography:** Cairo font family with native bidirectional Arabic (RTL) and English (LTR)
- **State Management:** Zustand (Stores for Auth, UI, Modules, i18n, Audio)
- **Server Cache:** TanStack Query v5 (`@tanstack/react-query`) with automatic background refetching
- **Icons:** `lucide-react`
- **Audio Feedback:** Synthesized Web Audio API sound effects (`sound.scan()`, `sound.success()`, `sound.error()`)

---

## 3. Multi-Tenancy & Data Isolation Model

Mizan uses a **Shared-Database, Shared-Schema with Row-Level Security (RLS)** architecture. This allows hosting thousands of merchants on a single PostgreSQL instance while guaranteeing mathematical isolation between tenant datasets.

```
                      +-----------------------------+
                      |       PostgreSQL Engine      |
                      +-----------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
    [ Tenant A: Egyptian German ]               [ Tenant B: Monset Gym ]
    tenant_id: c935140b-...                     tenant_id: e841a20f-...
    RLS Policy: tenant_id = current_tenant()     RLS Policy: tenant_id = current_tenant()
    - Products                                  - Products
    - Invoices                                  - Invoices
    - Shifts                                    - Shifts
    - Employees                                 - Employees
```

### The 4 Tenant Resolution Strategies
Mizan resolves the active tenant through four waterfall mechanisms:
1. **Canonical Path:** `/c/:tenantSlug/*` (e.g., `/c/german-egyptian/pos`)
2. **Subdomain:** `https://<tenant_slug>.mizan.app/*`
3. **HTTP Header:** `X-Tenant-Slug` or `X-Tenant-ID`
4. **JWT Claim:** Authenticated `user.tenant_id` stored inside the session token

### Tenancy Enforcement in Python
Every tenant-scoped database model inherits from `TenantScoped` (`backend/app/core/tenancy.py`):
```python
from app.core.tenancy import TenantScoped
from app.db.base import Base

class MyModel(TenantScoped, Base):
    __tablename__ = "my_custom_table"
    # id (UUID PK), tenant_id (UUID FK), created_at, updated_at are inherited automatically!
    title = Column(String(100), nullable=False)
```

During session execution, SQLAlchemy tenancy listeners automatically inject the tenant context into session variables (`SET LOCAL app.current_tenant_id = :tid`) ensuring zero data leakage even in raw queries.
