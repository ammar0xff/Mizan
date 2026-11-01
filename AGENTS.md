# Agent instructions — ميزان (Mizan)

Multi-tenant SaaS (Arabic RTL) for Egyptian building-materials merchants:
FastAPI + SQLAlchemy async + PostgreSQL (Neon, RLS multi-tenancy) ·
React 19 + Vite + Tailwind v4 + owned shadcn kit · Vercel deploys both.

**Read before working:** [README.md](README.md) (product + commands) ·
[SYSTEM.md](SYSTEM.md) (architecture) · [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md)
(visual canon) · [docs/ui-ux-kit/](docs/ui-ux-kit/README.md) (methodology — page contracts,
preflight, AI-tell score). [TASKS.md](TASKS.md) holds the roadmap.

## Non-negotiables

1. **Tenancy** — every business table is `TenantScoped`; never bypass the layers (ORM
   filter, `before_flush` stamp, RLS GUC). New raw SQL needs no tenant logic — RLS enforces
   it — but raw INSERTs rely on the `tenant_id` column default reading `app.tenant_id`.
2. **Migrations** — append to `scripts/migrate.py` `MIGRATIONS` (v33+), idempotent SQL,
   statement-wise execution is built in. On Neon run with `set_config('app.bypass','on')`
   (the app role owns its tables; FORCE RLS applies to it).
3. **UI work** — follow `frontend/DESIGN_SYSTEM.md` + the ui-ux-kit: fill a page contract
   before new screens, one dominant action per state, Arabic copy, `.num` on every figure,
   lucide icons only (never emoji), `text-xs` floor, lucide sizes 16/18/20.
4. **Tests** — `npm test` (9 unit) + `npx tsc -b --noEmit` + `npm run build` in `frontend/`;
   e2e (107) from `e2e/` with `E2E_API_BASE` and `E2E_DATABASE_URL` pointing at the SAME
   server. Report results honestly.

## Commands

```bash
python3 scripts/migrate.py                        # migrations (local docker stack)
cd frontend && npm run build && npx tsc -b --noEmit
cd frontend && npx vercel --prod --yes --token <TOKEN>   # frontend deploy (CLI-only project)
cd e2e && E2E_API_BASE=… E2E_DATABASE_URL=… .venv/bin/pytest -q
```

## Verified gotchas (each one bit in production)

- `CORS_ORIGINS` is a **Vercel env var** on the backend project — it overrides
  `config.py`. New frontend origins go there (+ redeploy), not just into code.
- Frontend deploys are **CLI-only** (project `mizan-app` is not Git-linked); backend deploys
  are **Git-only** (push to `master`).
- `/auth/login` and `/platform/signup` are CSRF-exempt; everything else needs the
  `X-CSRF-Token` echo (cookie `csrf_token`) in cookie mode.
- The `/login` route flips to the app only when **token AND user** exist — a signup/login
  flow that stores the token before fetching `/auth/me` causes a redirect ping-pong.
- After `POST /platform/signup`, fetch `/auth/me` before `setUser` — the signup response
  lacks the `permissions` array the route guards require.
- `/shifts/current` returns **200 + `null`** when no shift is open (not 404).
- `/stock/valuation` returns a totals **object**, not rows.
- Print/export: print endpoints reject session tokens — mint a 60s `scope=print` token via
  `POST /auth/print-token` (see `openPrintDoc` in `lib/api.ts`).
- Numbers: `ar-EG-u-nu-latn` locale + the `.num` class — never Arabic-Indic digits.
- `python3 scripts/migrate.py` on a fresh volume provisions the tenant foundation first;
  a full e2e pass on a fresh volume is the CI parity gate (107/107).
