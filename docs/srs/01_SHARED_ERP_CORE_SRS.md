# Vendora Modular ERP — Software Requirements Specification (SRS)
## Section 01: Shared ERP Core Platform Specification

---

### Scope
This document specifies the formal software requirements for the foundational layer of Vendora ERP. All 30 industry packages inherit and build directly upon these shared capabilities.

---

## 1. Core Platform Requirements (CORE-01 to CORE-15)

### CORE-01: Multi-Company Management
- **Description**: The system shall support multiple legal entities operating within a single tenant boundary or across federated tenant instances.
- **Acceptance Criteria**:
  1. Each company shall maintain distinct legal registration numbers, tax IDs, base currencies, and fiscal year definitions.
  2. The system shall support inter-company transactions with automated balancing journal entries.
  3. Consolidated financial and operational reports shall be generable across selected subsets or all companies.
- **Data Entities**: `Company`, `InterCompanyAccount`, `TaxAuthoritySetting`.

### CORE-02: Multi-Branch and Multi-Location Management
- **Description**: The system shall allow each company to define physical and logical branches, retail outlets, warehouses, and storage zones.
- **Acceptance Criteria**:
  1. Transactions (sales, purchases, journal entries, inventory transfers) must be tagged with a branch origin.
  2. Users can be restricted to view or operate only within their assigned branch(es).
  3. Centralized HQ users can view rolled-up and branch-comparative dashboards.
- **Data Entities**: `Branch`, `Warehouse`, `StorageZone`, `UserBranchAssignment`.

### CORE-03: Role-Based Access Control (RBAC)
- **Description**: The system shall enforce fine-grained permissions per entity and action (Create, Read, Update, Delete, Export, Approve, Post).
- **Acceptance Criteria**:
  1. Permissions must be combinable into named Roles (e.g., `Cashier`, `StoreManager`, `Accountant`, `Auditor`, `SuperAdmin`).
  2. Field-level masking or hiding must be enforceable (e.g., cost price invisible to front-desk staff).
  3. Changes to role definitions must propagate immediately across active sessions.
- **Data Entities**: `Role`, `Permission`, `UserRole`, `FieldAccessRule`.

### CORE-04: User Management, Teams, Departments, and Job Roles
- **Description**: Complete lifecycle management of system users, organizational hierarchies, reporting lines, and departmental groupings.
- **Acceptance Criteria**:
  1. Users must support 2FA (TOTP) and session revocation.
  2. Organizational chart with manager-subordinate hierarchies used for automatic workflow approvals.
  3. Deactivated users must immediately lose access while preserving audit trail references.

### CORE-05: Configurable Approval Workflows
- **Description**: Multi-tier, conditional approval engine for financial and operational records.
- **Acceptance Criteria**:
  1. Support step-based rules (e.g., PO > 50,000 EGP requires Finance Director approval).
  2. Escalation timeouts with auto-delegation or reminder notifications.
  3. Rejection reasons mandatory, returning the record to `Draft` state with comments.
- **Data Entities**: `WorkflowDefinition`, `WorkflowStep`, `ApprovalRequest`, `ApprovalLog`.

### CORE-06: Audit Trail for Critical Actions
- **Description**: Immutable append-only log capturing user actions, timestamps, IP addresses, entity IDs, and delta state changes (before/after values).
- **Acceptance Criteria**:
  1. Logs cannot be modified or deleted by any user, including administrators.
  2. Cryptographic hash chaining or HMAC validation must verify log integrity.
  3. Exportable audit reports for statutory and compliance inspections.
- **Data Entities**: `AuditLog`, `SecurityEvent`.

### CORE-07: Notifications, Reminders, and Alerts
- **Description**: Real-time in-app, email, SMS, and webhook notification dispatcher.
- **Acceptance Criteria**:
  1. Event triggers for low stock, overdue invoices, pending approvals, and license renewal.
  2. User notification preferences (mute channels, batch digests).

### CORE-08: Document Management and Attachments
- **Description**: Centralized document storage linked to ERP transactions (e.g., vendor invoices, receipts, signed contracts, lab certificates).
- **Acceptance Criteria**:
  1. File integrity hashing (SHA-256) and malware scan hooks.
  2. Versioning and thumbnail generation for images and PDFs.
  3. Storage provider abstraction (Local disk, S3-compatible, Firebase Storage).

### CORE-09: Custom Fields and Configurable Forms
- **Description**: Metadata-driven entity extension allowing administrators to append attributes (text, number, date, dropdown) without altering database schemas.
- **Acceptance Criteria**:
  1. Custom fields rendered automatically in forms, lists, and filter criteria.
  2. Stored in typed JSONB attributes with validation rules.

### CORE-10: Dashboard and Configurable Reporting
- **Description**: Interactive analytic dashboard with KPI widgets, charts (Recharts), and custom report builders.
- **Acceptance Criteria**:
  1. Pre-built standard financial and operational metrics.
  2. User-specific layout customization and automated PDF/Excel scheduled exports.

### CORE-11: Search, Filtering, Sorting, and Pagination
- **Description**: Full-text and indexed parametric search across all tabular data views.
- **Acceptance Criteria**:
  1. Server-side pagination with deterministic sorting.
  2. Search query debouncing (< 250ms) and multi-column filter predicates.

### CORE-12: Import/Export (CSV, Excel, PDF)
- **Description**: High-throughput asynchronous bulk data ingestion and export engine.
- **Acceptance Criteria**:
  1. Dry-run validation highlighting bad rows before importing.
  2. Background job execution for exports exceeding 5,000 records.

### CORE-13: Localization, Language, Timezone, and Currency
- **Description**: Comprehensive i18n/l10n engine configured for Arabic (RTL) and English (LTR).
- **Acceptance Criteria**:
  1. Dual-language labels throughout UI and document printouts.
  2. Timezone-aware date parsing (`Africa/Cairo` default) and localized number formatting (`ar-EG-u-nu-latn`).

### CORE-14: Configurable Numbering Sequences
- **Description**: Auto-incrementing, collision-free transaction document numbers.
- **Acceptance Criteria**:
  1. Format templates: `{PREFIX}-{BRANCH}-{YEAR}-{SEQ:6}` (e.g., `INV-CAI-2026-000412`).
  2. Sequence gap detection and strict monotonically increasing counters using database sequences.

### CORE-15: Data Archival and Retention Policies
- **Description**: Automated partitioning and archival of historical records.
- **Acceptance Criteria**:
  1. Cold-storage offloading of transaction tables older than configured retention period (e.g., 5 years).
  2. Read-only historical querying without performance penalty on active tables.

---

## 2. Finance and Accounting (FIN-01 to FIN-15)

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **FIN-01** | General Ledger (GL) | Double-entry transaction journal. Debits must equal credits at posting time. No direct updates allowed once posted; corrections require reversal entries. |
| **FIN-02** | Chart of Accounts | Hierarchical 5-tier account tree (Assets, Liabilities, Equity, Revenue, Expenses). Configurable account numbering and currency restrictions. |
| **FIN-03** | Accounts Receivable (AR) | Customer sub-ledger, aging schedules (0-30, 31-60, 61-90, 90+ days), dunning letters, and auto-settlement against receipts. |
| **FIN-04** | Accounts Payable (AP) | Supplier sub-ledger, aging analysis, payment scheduling, and invoice reconciliation against Goods Receipt Notes (GRN). |
| **FIN-05** | Journal Entries | Manual and automated system vouchers with debit/credit balancing, cost center attribution, and supporting document attachments. |
| **FIN-06** | Invoices & Billing | Tax-compliant sales and purchase invoices, electronic invoice UUID/QR generation (compatible with ETA Egyptian Tax Authority and ZATCA standards). |
| **FIN-07** | Credit & Debit Notes | Formal reversal adjustments referencing original invoice numbers with mandatory justification codes and stock re-entry options. |
| **FIN-08** | Cash & Bank Management | Multiple petty cash safes, electronic wallets (Vodafone Cash, InstaPay), bank accounts, and bank transfer routing. |
| **FIN-09** | Bank Reconciliation | Electronic statement import (OFX, CSV), rule-based automatic transaction matching, and discrepancy adjustment journals. |
| **FIN-10** | Tax Engine | Configurable tax codes (VAT 14%, WHT 1-3%, Table Tax, Municipal Surcharges). Automated tax summary reporting and declaration preparation. |
| **FIN-11** | Cost & Profit Centers | Multi-dimensional analytical accounting attributing revenue and expenses to branches, projects, departments, or vehicle fleets. |
| **FIN-12** | Financial Statements | Real-time Balance Sheet, Profit & Loss (Income Statement), Trial Balance, and Cash Flow Statement (Direct/Indirect methods). |
| **FIN-13** | Fiscal Periods & Closing | Monthly/annual period lock. Prevents posting into closed periods without explicit SuperAdmin reopening permission. |
| **FIN-14** | Budgeting vs Actuals | Annual/quarterly budget creation by cost center and GL account with variance tracking and real-time budget depletion alerts. |
| **FIN-15** | Multi-Currency & Forex | Transactions recorded in original currency and base currency (EGP). Realized and unrealized exchange gain/loss calculation on revaluation. |

---

## 3. Sales and CRM (CRM-01 to CRM-08)

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **CRM-01** | Customer Database | Comprehensive customer master: legal name, commercial register, tax ID, contacts, shipping/billing addresses, payment terms. |
| **CRM-02** | Communication History | Log of calls, emails, WhatsApp messages, meeting notes, and ticket interactions linked to the customer timeline. |
| **CRM-03** | Quotations & Sales Orders | Price quotations with validity expiry, conversion to sales orders, stock reservations, and delivery status tracking. |
| **CRM-04** | Price Lists | Tiered price books (Retail, Wholesale, VIP, Distributor), customer-specific prices, and seasonal date-range activations. |
| **CRM-05** | Promotions & Discounts | Percentage, fixed amount, bundle discounts, volume ladders, and promotional coupon codes with usage ceilings. |
| **CRM-06** | Credit Limits & Terms | Strict credit ceiling checks at order entry. Blocks sales orders if overdue invoices exist or limit is exceeded without override. |
| **CRM-07** | Returns & Refunds | RMA workflows, condition grading (resellable, damaged, scrap), restock fees, and refund vouchers or credit notes. |
| **CRM-08** | Loyalty Programs | Point accrual per currency spent, tier progressions (Silver, Gold, Platinum), and point redemption at POS checkout. |

---

## 4. Procurement and Supplier Management (PUR-01 to PUR-08)

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **PUR-01** | Supplier Master | Vendor profiles, bank details, tax numbers, credit rating, approved product catalog, and lead-time metrics. |
| **PUR-02** | Purchase Requisitions | Internal demand requests submitted by department heads, routed through approval workflows before PO conversion. |
| **PUR-03** | Purchase Orders (PO) | Formal purchase contracts with agreed unit prices, payment milestones, delivery terms (Incoterms), and penalty clauses. |
| **PUR-04** | Goods Receipt Notes (GRN) | Warehouse receiving document capturing physical quantity inspected, rejected, accepted, batch numbers, and warehouse bin allocation. |
| **PUR-05** | 3-Way Matching | Automated verification matching Purchase Order = Goods Receipt Note = Supplier Invoice. Flags discrepancies exceeding tolerance. |
| **PUR-06** | Supplier Payments | Cheque printing, wire transfer batch generation, payment voucher recording, and advance payment settlement. |
| **PUR-07** | Vendor Performance | KPI tracking: On-Time Delivery (OTD) rate, quality defect rate, price variance, and overall vendor scorecarding. |
| **PUR-08** | Price History Tracking | Historical procurement price comparison across suppliers and time periods to inform purchasing negotiations. |

---

## 5. Inventory and Warehouse Management (INV-01 to INV-10)

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **INV-01** | Product Master | Item master, SKU, barcode, unit of measure (UOM) conversions (e.g., box of 24 to units), dimensions, weight, tax category. |
| **INV-02** | Stock on Hand & Reservations | Real-time physical inventory, allocated stock for pending orders, and net available to promise (ATP). |
| **INV-03** | Stock Movements & Transfers | Inter-warehouse transit orders, shipping confirmation, receiving confirmation, and in-transit inventory accounting. |
| **INV-04** | Inventory Valuation | Real-time valuation using FIFO (First-In, First-Out) or Weighted Average Cost (WAC). Automatic COGS calculation at point of sale. |
| **INV-05** | Reorder Points & Replenishment | Min/Max stock thresholds, safety stock calculation, and automated purchase requisition generation for low-stock items. |
| **INV-06** | Cycle Counting & Adjustments | Regular cycle counts, variance reporting, manager sign-off, and automated inventory write-off/write-up journal entries. |
| **INV-07** | Barcode & QR Code Engine | Generation, parsing, and mobile scanning of EAN-13, Code-128, GS1-128, and QR codes for all items and packaging levels. |
| **INV-08** | Lot & Serial Tracking | Individual serial number tracking for electronics/machinery; lot/batch numbers for tracking production groups from source to customer. |
| **INV-09** | Expiry & Shelf-Life Management | Expiration date enforcement, FEFO (First Expired, First Out) picking logic, and shelf-life warning alerts. |
| **INV-10** | Multi-Warehouse & Bin Locations | Hierarchical warehouse modeling: Warehouse -> Aisle -> Rack -> Shelf -> Bin location tracking. |

---

## 6. HR and Localized Payroll (HR-01 to HR-10)

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **HR-01** | Employee Master & Contracts | Complete employee records, social insurance numbers, passport/national IDs, contract types, probation periods, and job titles. |
| **HR-02** | Org Structure & Departments | Visual department hierarchy, reporting relationships, and delegation matrix. |
| **HR-03** | Attendance & Biometric Sync | Integration with ZKTeco/Hikvision biometric devices, web check-in, geofencing, overtime, and tardiness calculations. |
| **HR-04** | Leaves & Absence | Annual leave balance accrual, sick leave, maternity/paternity leave, and approval workflows. |
| **HR-05** | Localized Payroll Engine | Monthly payroll calculation compliant with Egyptian Labor Law and Tax Authority rules: gross salary, allowances, overtime, deductions. |
| **HR-06** | Statutory Deductions (Egypt) | Egyptian Social Insurance Law 148/2019 (Employee 11%, Employer 18.75% up to maximum cap), Progressive Income Tax slabs, Martyrs Tax (0.05%). |
| **HR-07** | Expenses & Reimbursements | Employee expense claims, digital receipt uploads, manager approval, and direct payroll reimbursement. |
| **HR-08** | Performance Appraisals | Periodic KPI reviews, 360-degree feedback, and goal achievement scoring linked to annual bonuses. |
| **HR-09** | Onboarding & Offboarding | Task checklists for asset handover, IT account provisioning/deprovisioning, clearance forms, and end-of-service gratuity calculation. |
| **HR-10** | Shift Scheduling & Rosters | Multi-shift management, night differential pay, rotating shifts, and shift swapping requests with supervisor confirmation. |

---

## 7. System & Technical Architecture (SYS-01 to SYS-10)

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **SYS-01** | REST API Layer | OpenAPI 3.0 / Swagger documented endpoints for all entities. Uniform error payloads and rate limiting. |
| **SYS-02** | Webhooks & Events | Outbound HTTP webhooks triggered on key domain events (`sale.created`, `inventory.low`, `invoice.paid`) with retry backoff. |
| **SYS-03** | Transaction Integrity | Strict ACID guarantees using PostgreSQL transactions. Idempotent API requests using unique `Idempotency-Key` headers. |
| **SYS-04** | Backup & Disaster Recovery | Automated daily encrypted snapshots, Point-In-Time Recovery (PITR) up to 30 days, and verified one-click restore scripts. |
| **SYS-05** | Encryption | TLS 1.3 in transit; AES-256 for data at rest. Application-layer encryption for tenant connection secrets and API keys. |
| **SYS-06** | Authentication & Sessions | JWT with short expiry (15m) + secure HTTP-only refresh tokens. RBAC validation middleware on every endpoint. |
| **SYS-07** | Observability & Logging | Structured JSON logging (structlog), Prometheus-compatible metrics endpoint, and OpenTelemetry distributed tracing hooks. |
| **SYS-08** | Automated Testing | Comprehensive unit tests, integration test suites, and Playwright E2E verification pipelines. |
| **SYS-09** | Configurable Business Rules | JSON-based declarative rule engine for validation (e.g., "Disallow sale if gross margin < 5%"). |
| **SYS-10** | Data Migration & Balances | Opening balance wizards for GL accounts, customers, suppliers, and physical inventory quantities with verification balancing. |

---

## 8. The 15 Reusable Cross-Industry Engines

1. **Workflow Engine (`XENG-01`)**: Graph-based state machine handling transitions, validations, and multi-tier approval chains.
2. **Notification Engine (`XENG-02`)**: Unified dispatcher supporting push, SMS, email, and in-app toasts.
3. **Document Management Engine (`XENG-03`)**: Versioned attachment store with OCR hooks and preview generation.
4. **Reporting Engine (`XENG-04`)**: Parameterized query builder exporting PDF, Excel, and JSON data.
5. **Integration Engine (`XENG-05`)**: REST/GraphQL connector hub with webhook subscriptions and replay queues.
6. **Subscription Billing Engine (`XENG-06`)**: Recurring billing, grace periods, pro-rata adjustments, and dunning cycles.
7. **Scheduling Engine (`XENG-07`)**: Resource booking, staff rosters, calendar views, and conflict detection.
8. **Pricing Engine (`XENG-08`)**: Multi-tier price books, formula-based dynamic pricing, and promo rules.
9. **Inventory Ledger Engine (`XENG-09`)**: Immutable stock movement ledger with double-entry inventory tracking.
10. **Quality Management Engine (`XENG-10`)**: Inspection checklists, sampling plans, non-conformance reports (NCR), and CAPA.
11. **Asset Management Engine (`XENG-11`)**: Fixed asset registers, straight-line/declining balance depreciation, and maintenance history.
12. **Project Management Engine (`XENG-12`)**: Gantt charts, work breakdown structures (WBS), milestones, and time logs.
13. **Customer Portal (`XENG-13`)**: Self-service portal for order tracking, invoice payment, and service requests.
14. **Supplier Portal (`XENG-14`)**: Portal for PO confirmation, ASN submission, and invoice upload.
15. **Mobile Operations Engine (`XENG-15`)**: Offline-first mobile data capture, camera barcode scanning, and signature capture.
