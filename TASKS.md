# ميزان — Roadmap

Current as of 2026-11-01. The SaaS pivot (multi-tenancy + rebrand + self-serve onboarding)
is shipped and CI-green; everything below is what remains.

## Monetization (next up)

- [ ] **Payment integration** — Paymob / Fawry / InstaPay checkout for plan activation
      (subscription requests are recorded today; activation is manual).
- [ ] **Plan gating** — enforce plan limits server-side (branches, users, features) with
      tenant-aware middleware; upgrade prompts in-app.
- [ ] **Trial lifecycle** — expiry enforcement (read-only workspace after trial), reminder
      notifications; [x] tenant self-service data reset shipped via `POST /platform/wipe-demo` (v33).

## Platform hardening

- [x] **RLS on `users`** (v33) — backfilled, `tenant_id NOT NULL`, composite `uq_users_tenant_username (tenant_id, username)`, and `tenant_isolation` policy with forced RLS.
- [ ] **Custom domain** — `mizan-app-liart.vercel.app` → a real domain (also resolves the
      "Mizan" name collision with an unrelated UAE legal product).
- [ ] **Rotate credentials** — the Vercel token shared in chat (2026-11-01) and the Neon
      API key pasted earlier; both are treated as burned.
- [ ] **Tenant storefronts** — `/api/storefront` currently serves the founding tenant only;
      per-tenant slugs + themed storefronts.
- [ ] Background jobs off serverless (shift auto-close, notification digests).

## Product surface

- [ ] i18n — English UI alongside Arabic (landing + billing first).
- [ ] Per-screen page contracts for the remaining modules (finance, inventory, hr,
      operations, settings, purchases, shifts, suppliers — patterns already proven on
      dashboard/pos/sales/products/login).
- [ ] Migrate remaining screens' internals from the legacy `components/ui.tsx` shim to
      `components/kit/` directly (structural debt, invisible to users).
- [ ] HR: attendance device sync hardening (ZK), CSV import UX.
- [ ] Mobile POS polish: barcode gun focus modes, receipt printer presets.

## Known quirks (documented, low priority)

- `notifications` router exists; no surfaced notification center yet (bell is data-driven
  from low stock + credit invoices).
- `vendora` Vercel project (`vendora-self-xi.vercel.app`) is a stale auto-deploy of the old
  frontend — candidates for deletion from the Vercel dashboard.
- GitHub Pages mirror still deploys on `frontend/**` pushes; keep until the Vercel domain
  is universally shared, then disable the workflow.
