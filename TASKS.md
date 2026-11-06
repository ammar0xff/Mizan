# ميزان (Mizan) — Roadmap & Delivery Status

Current as of 2026-11-03. All core operational ERP screens, multi-tenancy SaaS infrastructure, storefront modules, notification center, and advanced hardware/automation integrations are shipped, live in Docker, and verified via Playwright E2E suites.

## 1. Shipped Core & SaaS Milestones (Completed & CI-Green)

- [x] **SaaS Multi-Tenancy Engine** — Row-level security (RLS), tenant isolation (`tenant_id NOT NULL`), composite username constraints, and dynamic subdomain/slug resolution.
- [x] **Admoon Control Plane** — Comprehensive platform administration suite: tenant wizard, database & hosting metrics, plan subscriptions, live MRR tracking, provisioning jobs, and audit logs.
- [x] **Monetization & Plan Gating** — Fawry, Paymob, and InstaPay checkout activation, tier gating (Starter, Pro, Enterprise), and automated upgrade alerts.
- [x] **Tenant Storefronts Engine (`storefront`)** — Public customer-facing storefronts with customizable branding, shopping cart, checkout, coupon engine, and real-time merchant dispatch board (Screens 196–201).
- [x] **In-App Notification Center & Alerts Hub** — TopNav bell popover, live unread badges, automated system alert triggers (storefront web orders, low stock, trial expiry), filter pills, and read/unread state management (Screens 202–205).
- [x] **POS Hardware & Thermal Receipt Module (`pos_hardware`)** — Global continuous barcode listener (`useBarcodeScanner`), 80mm & 58mm ESC/POS thermal printing with Egyptian Tax/ZATCA QR format, and F1–F10 velocity shortcuts modal (Screens 206–209).
- [x] **Background Automation & Cron Worker Module (`automation_worker`)** — Standalone scheduled job worker with CLI support (`python manage.py cron --run-all`), midnight shift auto-close with Z-Reports, subscription enforcement, and daily metrics digest (Screens 210–211).
- [x] **HR Biometric Attendance & Device Sync Module (`zk_attendance`)** — ZKTeco network device manager (port 4370), live ping latency testing, automated punch-to-attendance harmonization, and CSV offline import (Screens 212–213).
- [x] **Internationalization & Directional Engine (`i18n`)** — Global bilingual switcher (`EN` / `عربي`) with real-time `<html dir="ltr">` / `<html dir="rtl">` layout inversion and complete translation store (Screens 214–215).

---

## 2. Next Major Integration Candidates (Modular Architecture)

Integration modules now live under the **`integrations`** category (`backend/app/modules/<id>/` + `frontend/`), following the same module contract as core/vertical modules. Each integration is a self-contained, activatable module with its own settings schema, router, models, and UI.

- [x] **WhatsApp Business & Digital Receipt Dispatch (`whatsapp_gateway`)** — Scaffolded as an integration module: settings schema (Cloud API token, phone number ID, template selector, auto-send toggles), message log model, `/integrations/whatsapp/*` endpoints (status, send-receipt, messages), and a management page. Real dispatch to Meta's Cloud API is queued for the worker.
- [ ] **Egyptian Tax Authority (ETA) e-Invoicing & e-Receipt Module (`eta_einvoice`)** — Implement as an `integrations` module: ETA portal submission queue, document signing schema (UUID, issuer tax ID, activity code, 14% VAT + 1% WHT), status dashboard.
- [ ] **Customer Loyalty Points & Tiered Rewards Module (`loyalty_rewards`)** — Implement as an `integrations` module: points per EGP, Bronze/Silver/Gold tiers, in-POS redemption, balance statements.
- [ ] **UI Kit Modernization & Cleanup** — Migrate remaining legacy screen internals from `components/ui.tsx` shim to direct `components/kit/` design system primitives.

---

## 3. Tenant & User Management (Completed)

- [x] **Company Name & Logo Customization** — `store_name`/`logo_url` in store_settings, SettingsPage form, upload-logo endpoint (generates PWA icons).
- [x] **Inner Account & Permission Management** — UsersPage: create users, roles, granular permissions, password reset.
- [x] **Per-User Personal Settings** — `User.settings` jsonb + `/users/me/settings` endpoints + personal section in SettingsPage (theme, language, notification toggles), separate from global store settings.
- [x] **Sector-Specific Settings** — handled via per-module `settings_schema` (SECTOR_MODULES_MAP activates sector-relevant modules, each with its own settings).
