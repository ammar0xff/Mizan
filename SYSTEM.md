# SYSTEM — architecture of ميزان (Mizan)

Current as of 2026-11-01, post SaaS pivot. Verified against the running system.

## Surfaces

| Surface | Host | Notes |
|---|---|---|
| Web app | `mizan-app-liart.vercel.app` (Vercel project `mizan-app`) | SPA, CLI-deployed, `VITE_BASE=/`, rewrites → `index.html` |
| API | `vendora-backend-six.vercel.app/api` (Vercel project `vendora-backend`) | Git-integrated on `master`, root `backend/` |
| Storefront | `…/api/storefront` | Public, binds the founding tenant |
| Database | Neon `ep-misty-tooth-aeavzg5g` / `neondb` | Pooled URL in Vercel env |
| Legacy mirror | `ammar0xff.github.io/Vendora` | Pages auto-deploy on `frontend/**` |

## Tenancy model (three enforcement layers)

1. **ORM filter** — `app/core/tenancy.py` listens on `do_orm_execute` and injects
   `with_loader_criteria(TenantScoped, tenant_id == ctx)` for SELECT/UPDATE/DELETE.
   The context lives in a ContextVar set by `get_current_user` (legacy NULL-tenant users
   resolve to the primary workspace).
2. **Insert stamping** — `before_flush` copies the contextvar onto new `TenantScoped` rows
   whose `tenant_id` is unset.
3. **Row-Level Security** — every scoped table is `ENABLE`+`FORCE` RLS with policy
   `tenant_isolation`: `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR
   current_setting('app.bypass', true) = 'on'`. `bind_tenant()` sets the ContextVar and binds
   the GUC via transaction-local `set_config('app.tenant_id', :t, true)`. An `after_begin` Session
   listener re-applies `set_config(..., true)` on every transaction (preventing state loss across
   `db.commit()` under PgBouncer transaction pooling), and `unbind_tenant` executes `RESET app.tenant_id; RESET app.bypass;`.

Supporting mechanics:
- `tenant_id` columns DEFAULT to `NULLIF(current_setting('app.tenant_id', true), '')::uuid` → raw
  `INSERT` sites evaluate cleanly without type errors when unauthenticated.
- Tenant deletion **cascades** through all tables *and* `users`.
- Composite per-tenant uniques replaced global ones (invoice numbers, wallet names,
  PO numbers, period months, category names, warehouse codes, barcodes, safe doc numbers, and users(tenant_id, username)).
- `users.tenant_id` is NOT NULL (v33); `User` inherits `TenantScoped` and enforces RLS.
- Demo data tracking: `is_demo BOOLEAN NOT NULL DEFAULT FALSE` across business tables enables clean, self-serve data wipes via `POST /platform/wipe-demo`.
- Offline POS stock collision policy: when offline sale synced (`allow_negative_stock` or `is_offline_sync`), insufficient stock is decremented into negative balance and an `AuditLog(inventory_discrepancy)` entry is created for manager reconciliation.

## Request lifecycle (API)

`request → CSRF middleware (cookie mode; /auth/login, /platform/signup, /health exempt)
→ route dependency get_db (AsyncSession)
→ get_current_user (cookie → Bearer fallback → JWT decode → user load → bind_tenant)
→ permission gate (`require_perm`, role map in core/roles.py)
→ router/service (ORM or raw SQL — both tenancy-enforced)
→ response (+ Set-Cookie on login/signup)`

Print endpoints are separate: `POST /auth/print-token` issues a 60s `scope=print` JWT;
`get_print_user` accepts it as `?token=` for browser-opened tabs.

## Data model

52 tables. Tenant-scoped (50): products/categories/subcategories/barcodes/images,
stock_balances/movements, warehouses, sales/items/payments, shifts/drawer transactions,
customers/suppliers/transactions, wallets, safes/deposits, purchases + price history,
expenses, collections, financial categories, accounting periods, hr_* (employees,
payroll, attendance, shifts, settings, sync log, audit), archive, notifications'
device tokens, store settings, audit log, payroll legacy. Platform-only: `tenants`,
`subscriptions`, `schema_migrations`, `user_warehouses` (join), `users` (nullable tenant).

Migrations: 35 tracked (v0–v32) in `scripts/migrate.py`, executed statement-by-statement
(dollar-tag-aware splitter) with the tenant foundation (`ensure_foundation`) and
`app.tenant_id`/`app.bypass` bound into every psql session. `create_all` runs at boot for
new tables only; the tracked migrations own all column/constraint changes.

## Frontend architecture

- `App.tsx` — `/` renders **LandingPage for visitors, the guarded Shell for signed-in
  users**; `/pricing`, `/signup`, `/onboarding` public; `/login` flips on `token && user`.
- `AppShell.tsx` — navy brand rail (grouped nav from `lib/nav.ts`, permission-gated),
  topbar (branch selector from `/stock/warehouses`, live shift badge, Ctrl+K search,
  theme toggle, user menu), trial banner, sidebar upsell card.
- `components/kit/` — shadcn/ui v4 on @base-ui/react (34 components, owned).
  `components/ui.tsx` — legacy primitives visually identical to the kit; frozen, no new use.
- `components/app/shared.tsx` — PageHeader, StatCard, KpiTile, Delta, ListState
  (skeleton → error → empty → content), StatusBadge pills, TableShell, TablePagination.
- State: TanStack Query (server) + Zustand (`stores/auth.ts`: token/user/tenant, persists
  `vendora.session`, applies the tenant brand hue to `--brand-hue`).
- Offline POS: IndexedDB sale queue (`lib/offline.ts`) with replay + conflict classification.
- PWA: app-shell service worker (network-first navigations, never caches `/api/`).

## SaaS lifecycle

`/signup` (account draft → sessionStorage) → `/onboarding` (sector → company+scale →
palette+features, live hue preview) → `POST /platform/signup` → tenant (trial 14d) + owner
+ `demo_seed` workspace (sector catalog × scale: branches, products with barcodes and
pricing, customers/suppliers, opening stock, two weeks of sales) → auto-login (token +
`/auth/me` profile + tenant) → banner → `/pricing` → `POST /platform/subscribe-request`
(manual activation until a payment provider lands).

Plans: أساسي 499 ج.م · احترافي 999 ج.م · مؤسسي custom. Feature toggles from the wizard
(credit/quotations/purchases/hr) are stored per tenant and gate navigation.
