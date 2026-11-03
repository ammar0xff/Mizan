# ميزان (Vendora) — Roadmap & Delivery Status

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

- [ ] **Egyptian Tax Authority (ETA) e-Invoicing & e-Receipt Module (`eta_einvoice`)** — Direct integration with ETA portal (مصلحة الضرائب المصرية), automatic document signing schema (UUID, issuer tax ID, tax activity code, 14% VAT + 1% WHT breakdown), submission queue, and status dashboard.
- [ ] **WhatsApp Business & Digital Receipt Dispatch Module (`whatsapp_gateway`)** — Automatic digital invoice dispatch directly to customer's WhatsApp upon checkout or storefront order placement, template messaging, and customer receipt portal.
- [ ] **Customer Loyalty Points & Tiered Rewards Module (`loyalty_rewards`)** — Points earning per EGP, tier progression (Bronze/Silver/Gold), in-POS points redemption discount at checkout, and customer balance statements.
- [ ] **UI Kit Modernization & Cleanup** — Migrate remaining legacy screen internals from `components/ui.tsx` shim to direct `components/kit/` design system primitives.
