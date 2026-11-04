# ميزان — Mizan

[![CI/CD](https://github.com/ammar0xff/Mizan/actions/workflows/ci.yml/badge.svg)](https://github.com/ammar0xff/Mizan/actions/workflows/ci.yml)

**Multi-tenant SaaS** for Egyptian building-materials and hardware merchants: point of sale,
inventory, invoicing, purchasing, customers & suppliers, treasuries, reports, and payroll —
Arabic-first, RTL, built for صالة العرض and the back office alike.

> نظام إدارة كامل لنُهُد المواد والبناء — نقطة بيع، مخزون، فواتير، مشتريات، خزائن، وتقارير.
> سجّل، أجب على ٣ أسئلة، وهتلاقي نظامك شغّال ببيانات تجريبية على قطاعتك — مجانًا ١٤ يوم.

| Surface | URL |
|---|---|
| **App (canonical)** | https://mizan-app-liart.vercel.app |
| **API** | https://vendora-backend-six.vercel.app/api |
| **API docs (OpenAPI)** | https://vendora-backend-six.vercel.app/api/docs |
| **Public storefront (tenant #1)** | https://vendora-backend-six.vercel.app/api/storefront |
| Legacy mirror | https://ammar0xff.github.io/Mizan |

The founding workspace (tenant #1) is **الشركة المصرية الألمانية للأدوات الصحية** — admin:
`ammar` / `changeme`. New merchants self-serve through `/signup` → a 3-step onboarding
wizard (business activity, company & scale, brand palette + optional features) → a workspace
pre-seeded with demo data tailored to their sector → a 14-day trial.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · SQLAlchemy 2.0 async · asyncpg · PostgreSQL 16+ (Neon) |
| Tenancy | `TenantScoped` mixin on 50 tables · ORM query filter · **PostgreSQL Row-Level Security** |
| Auth | JWT (httpOnly cookie **or** Bearer) · CSRF double-submit · scoped print tokens |
| Frontend | React 19 · TypeScript strict · Vite · Tailwind CSS v4 · shadcn/ui v4 kit (@base-ui/react) · Motion · TanStack Query · Zustand · recharts · sonner |
| Locale | Arabic RTL · IBM Plex Sans Arabic · `ar-EG-u-nu-latn` (Western digits, `.num` class) |
| Deploys | Backend: Vercel (Git integration) · Frontend: Vercel (CLI) · DB: Neon |

## Repository map

```
backend/
  app/api/routers/     28 routers (auth, products, stock, sales, shifts, purchases,
                       parties, finance, hr, payroll, periods, reports, platform, …)
  app/core/            config, security, tenancy (mixin + query filter + GUC binding)
  app/models/          52 SQLAlchemy models — 50 tenant-scoped
  app/services/        business logic incl. demo_seed (sector-tailored workspaces)
  migrations/          SQL fragments used by tracked migrations
  main.py              app factory, create_all, middleware
frontend/
  src/features/        17 app modules + marketing (landing, pricing, signup, onboarding)
  src/components/kit/  shadcn/ui v4 components (owned, editable)
  src/components/app/  PageHeader, StatCard, KpiTile, ListState, TableShell …
  src/components/      AppShell (navy rail + topbar), shell-parts (Ctrl+K palette, banner)
  DESIGN_SYSTEM.md     visual canon — tokens, type scale, patterns
e2e/                   107-test live API suite (httpx + pytest)
scripts/               migrate.py (tracked SQL migrations), remediate_remote.py, setup.py
docs/ui-ux-kit/        UI/UX methodology (user-provided canon — do not edit)
```

## Local development

```bash
# stack: postgres :5433 · backend :8000
docker compose up -d
python3 scripts/migrate.py            # tracked migrations (v0–v32), idempotent

# backend (venv is uv-managed — no pip)
cd backend && .venv/bin/uvicorn main:app --port 8010   # or the :8000 container

# frontend
cd frontend && npm install && npm run dev              # :5173, /api proxied

# tests
cd frontend && npm test                # 9 vitest unit tests
cd e2e && .venv/bin/pytest -q \
  E2E_API_BASE=http://localhost:8000 \
  E2E_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/inventory_db
  # ^ the two vars must point at the same server (conftest guards this)
```

First admin on any fresh volume: `ammar` / `changeme`. `scripts/migrate.py` provisions the
`tenants` foundation and binds `app.tenant_id` / `app.bypass` into every psql session before
running the 35 tracked migrations statement-by-statement.

## Multi-tenancy in one paragraph

Every business row carries `tenant_id` (`TenantScoped` mixin). Reads/writes are filtered by
an ORM global criterion driven by a request-scoped ContextVar; inserts are stamped in
`before_flush`; **and** PostgreSQL RLS (ENABLE + FORCE + `tenant_isolation` policy keyed on
the `app.tenant_id` GUC) enforces the same rule for the ~160 raw-SQL call sites. Raw INSERTs
resolve `tenant_id` from a column DEFAULT that reads the same GUC. Tenant deletion
**cascades** to all workspace data. Migrations run with `app.bypass = 'on'` because the
application role owns its tables. Signup, storefront, and health are the only unauthenticated
surfaces; the storefront binds the founding tenant explicitly.

## Deployment

- **Backend** — Vercel project `vendora-backend`, Git integration on `master`, root
  directory `backend/`, `vercel.json` rewrites `/api/* → /*`. Env vars on Vercel:
  `DATABASE_URL` (Neon **pooled** URL), `SECRET_KEY`, `APP_ENV=production`,
  `CORS_ORIGINS` (JSON array — **this Vercel var overrides `config.py`; add new frontend
  origins there, not only in code**, then redeploy).
- **Frontend** — Vercel project `mizan-app`, deployed via
  `npx vercel --prod --yes --token <TOKEN>` from `frontend/`. `vercel.json` sets
  `VITE_BASE=/` and rewrites every path to `index.html` (SPA, real 200s on deep links).
  GitHub Pages still auto-mirrors `frontend/**` pushes at the legacy URL.
- **Database** — Neon `quiet-bread-42676613` / branch `br-still-sunset-aegj3ngq` /
  endpoint `ep-misty-tooth-aeavzg5g`. Migrations v0–v32 are applied there; for manual runs
  use the app role with `set_config('app.bypass', 'on')` first.

## Feature map

| Area | Highlights |
|---|---|
| POS | barcode + search, retail/wholesale tiers, credit sales with limits, split payments, hold/resume, offline queue (IndexedDB), F2/F3/Esc shortcuts, shift enforcement |
| Sales | invoices, quotations → invoice conversion, partial/full returns, cancellation, Excel export, scoped print documents |
| Inventory | O(1) `stock_balances` reads, per-warehouse valuation, low-stock alerts, transfers, stocktaking, adjustments |
| Purchasing | supplier invoices, PO receiving, price history, supplier statements |
| Parties | customer/supplier ledgers, balances, credit limits, collections |
| Finance | safes, wallets, expenses, cash flow, aging, accounting periods with monthly close |
| HR/Payroll | attendance (CSV + ZK sync), payroll engine, draft → review → approve → pay, payslips |
| Platform | self-serve signup, tailored demo seeding, plans & subscription requests, per-tenant brand hue |
| Storefront | public catalog page for the founding tenant, themed from store settings |

## Frontend design system

`frontend/DESIGN_SYSTEM.md` is the binding visual canon (steel-blue/water tokens, type and
icon scales, touch floors, composition language). `docs/ui-ux-kit/` is the binding
methodology (page contracts, states, preflight, AI-tell score). Read both before touching UI.
