# Vendora Modular ERP — Software Requirements Specification (SRS)
## Section 02: Phase 1 — Core Business Systems

---

### Phase Scope
Phase 1 covers the core everyday business systems: Retail, Restaurant/Café, Pharmacy, Consulting/Accounting, and Educational Institutes. Each industry builds on top of the Shared ERP Core, referencing shared requirements by ID (`CORE-*`, `FIN-*`, `INV-*`, `CRM-*`, `PUR-*`, `HR-*`).

---

## 1. Retail ERP (System ID: `RET`)
*Target Businesses*: Supermarkets, Boutiques, Electronics Stores, Department Stores, Building Materials.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `PUR-01..08`, `INV-01..10`, `HR-01..10`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **RET-01** | POS Terminal & Cash Drawer Reconciliation | Cashier, Store Supervisor | Cashier opens shift with float count -> registers transactions -> shift close with physical count -> discrepancy variance report. | Supports drawer kick pulse via ESC/POS; prevents shift close if open tickets exist without supervisor override. |
| **RET-02** | Real-time POS-to-Inventory Sync | Cashier, Inventory Mgr | Each scanned sale immediately decrements stock balance in the local branch warehouse (`INV-02`). | Latency < 100ms; supports offline queueing with auto-sync upon reconnection. |
| **RET-03** | Product Variants (Size, Color, SKU) | Catalog Mgr, Cashier | Matrix view generating child SKUs from parent product attributes (e.g., Shirt -> Size: M/L/XL, Color: Blue/Red). | Each variant maintains unique barcode, stock balance, and optional variant-level cost/price. |
| **RET-04** | Loyalty Points & Rewards | Cashier, Customer | Customer phone number look-up -> auto-accrue points based on rules -> instant redemption voucher at checkout. | Points expire after configurable months; maximum redemption limits per ticket enforceable. |
| **RET-05** | Promotions & Bundle Engine | Marketing Mgr, Cashier | Buy X Get Y Free, mix-and-match bundles, time-limited flash sales. | Pricing engine evaluates cart items and applies optimal discount automatically. |
| **RET-06** | Barcode Label Printing & Scanning | Stock Clerk, Cashier | Direct generation and thermal printing of shelf talkers, product barcode stickers, and price tags. | Supports EAN-13, UPC, Code 128, and weight-embedded barcodes (scale items). |
| **RET-07** | Cashier Shift Audit & X/Z Reports | Cashier, Auditor | Generates mid-shift X-Report (non-resetting) and end-of-shift Z-Report (closing register and posting to General Ledger `FIN-05`). | All sales, refunds, voids, and cash drops logged with immutable sequence numbers. |
| **RET-08** | Store-Level Replenishment | Branch Mgr, Warehouse Mgr | Calculates replenishment needs based on min/max levels (`INV-05`) and triggers Inter-Branch Transfer Orders (`INV-03`). | Automated transfer requisition generated when branch inventory hits safety stock. |
| **RET-09** | Layaway & Installment Sales | Sales Agent, Accountant | Customer pays deposit -> goods reserved in warehouse -> customer pays installments -> final goods release on full payment. | Dedicated layaway sub-ledger; auto-cancel and restock if installments lapse beyond grace period. |
| **RET-10** | Gift Cards & Store Credit | Cashier, Accountant | Issue magnetic or digital gift cards, recharge balances, apply store credit for customer returns without cash refund. | Real-time balance check; fraud-prevention PIN and audit log of card redemptions. |

---

## 2. Restaurant / Café ERP (System ID: `RES`)
*Target Businesses*: Dine-in Restaurants, Fast Food, Cafés, Cloud Kitchens, Bakeries.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `PUR-01..08`, `INV-01..10`, `HR-01..10`, and `RET-01,06,07`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **RES-01** | Menu & Category Configuration | Chef, F&B Manager | Multi-menu setup (Breakfast, Lunch, Dinner, Happy Hour) with dietary badges (Vegan, Gluten-Free, Halal) and prep times. | Time-scheduled menu activation; dynamic hide/show based on ingredient availability. |
| **RES-02** | Recipe & Ingredient-level BOM | Chef, Cost Controller | Multi-level Bill of Materials linking menu items to raw ingredients with yield loss percentage (e.g., 1 Burger = 150g Beef Patty + 1 Bun + 20g Sauce). | Backflushing decrements raw ingredient inventory upon kitchen ticket completion. |
| **RES-03** | Kitchen Display System (KDS) | Kitchen Staff, Expediter | Interactive touchscreens in food preparation zones displaying incoming orders with color-coded elapsed time alerts (Green < 10m, Orange 10-20m, Red > 20m). | Order bump switches item status to `Ready`; notifies waiter or triggers delivery packing. |
| **RES-04** | Table Management & Floor Layout | Hostess, Waiter | Visual graphical floor plan (Indoor, Terrace, VIP) showing table occupancy status (Vacant, Seated, Ordered, Billed, Dirty). | Table merging, splitting, and transfer of seated guests between tables without losing order data. |
| **RES-05** | Order Routing by Kitchen Station | Waiter, Kitchen Staff | Split printing/routing: Drinks to Bar printer, Steaks to Grill KDS, Salads to Cold Station KDS. | Guaranteed delivery of order fragments to correct stations with master ticket reconciliation. |
| **RES-06** | Split Bills & Multi-Payment | Waiter, Cashier | Bill splitting by seat, by item, or equally across N guests. Supports split tender (part Cash, part Visa). | Total split payments must exactly match order total; releases table lock upon settlement. |
| **RES-07** | Modifier & Combo Management | Waiter, Cashier | Mandatory and optional modifier groups (e.g., Meat Temperature: Rare/Med/Well; Sides: Fries or Salad; Extra Cheese +15 EGP). | Modifiers adjust price and decrement ingredient inventory accurately. |
| **RES-08** | Food Waste & Spoilage Tracking | Chef, Storekeeper | Daily recording of prep waste, expired ingredients, and returned meals with mandatory reason codes. | Posts directly to Waste Expense GL account (`FIN-05`); updates inventory on hand. |
| **RES-09** | Delivery Platform Integration | Delivery Dispatcher | API integration with aggregators (Talabat, elmenus, HungerStation) injecting orders directly into POS and KDS. | Centralized delivery status tracking, driver assignment, and aggregator commission reconciliation. |
| **RES-10** | Food Cost & Recipe Profitability | Cost Controller, CFO | Real-time calculation of Food Cost % = (Ingredient Cost / Menu Sale Price) * 100 with variance vs actual purchase prices. | Alerts when ingredient price hikes push margin below target threshold (e.g., > 32% food cost). |

---

## 3. Pharmacy ERP (System ID: `PHA`)
*Target Businesses*: Retail Pharmacies, Pharmacy Chains, Hospital Pharmacies.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `PUR-01..08`, `INV-01..10`, `RET-01..08`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **PHA-01** | Drug Master with Scientific Names | Pharmacist, Data Admin | Drug profiles with Trade Name, International Nonproprietary Name (INN / Generic), ATC code, Dosage form, and Strength. | Searchable by active ingredient; alerts on controlled substances and narcotic schedules. |
| **PHA-02** | Batch / Lot & Expiry Tracking | Pharmacist, Storekeeper | Every received item must capture Batch Number and Expiration Date at Goods Receipt (`PUR-04`). | System blocks sale or dispensing of expired batches; generates near-expiry alerts (30/60/90 days). |
| **PHA-03** | FEFO Stock Picking | Pharmacist, Cashier | First Expired, First Out (FEFO) logic automatically presents the earliest-expiring batch at POS scanning. | Override requires explicit supervisor PIN with audit logging. |
| **PHA-04** | Prescription Processing & Dispensing | Pharmacist | Captures Doctor Name, Patient ID, Diagnosis, and Prescribed Dosage; validates against stock availability. | Dispensing workflow logs exact batch numbers handed to patient; prints dosage label. |
| **PHA-05** | Controlled Drug Registers | Chief Pharmacist, Inspector | Dedicated immutable ledger for scheduled narcotics and psychotropic medications. | Requires patient national ID, prescriber license number, and police/health authority inspection reports. |
| **PHA-06** | Drug Interaction & Allergy Alerts | Pharmacist | Automated cross-check of multi-item prescriptions for drug-drug interactions (DDI) and known patient allergies. | Visual severity warnings (Mild, Moderate, Severe/Contraindicated) blocking checkout without pharmacist sign-off. |
| **PHA-07** | Patient Medication History | Pharmacist | Longitudinal record of patient's historical dispensed prescriptions, chronic medications, and refill schedules. | Refill reminders dispatched via SMS/WhatsApp for chronic condition patients (Diabetes, Hypertension). |
| **PHA-08** | Generic Substitution Engine | Pharmacist, Cashier | Suggests equivalent generic alternatives sharing identical active ingredient, strength, and dosage form. | Displays cost comparison to patient; tracks substitution acceptance rate. |
| **PHA-09** | Quarantine & Recalled Drug Workflow | Quality Officer, Storekeeper | Instant one-click quarantine of specific manufacturer batches across all branch locations upon recall notice. | Freezes inventory from POS sales; prepares return-to-vendor credit claim (`PUR-07`). |
| **PHA-10** | Insurance Claim Processing | Billing Clerk, Insurance Officer | Direct eligibility check, co-payment calculation (e.g., 20% patient, 80% insurer), prior authorization, and claim generation. | Reconciles insurance claims against insurer remittances; manages rejected claim appeals. |
| **PHA-11** | Cold-Chain & Temp Monitoring | Storekeeper, Quality Officer | Temperature and humidity logging for vaccine and insulin refrigerators with IoT sensor alert hooks. | Excursion logs attached to batch records; prompts quality disposition if temp limits exceeded. |
| **PHA-12** | Ministry of Health Regulatory Reporting | Pharmacist, Compliance | Automated generation of statutory reports (sales of controlled drugs, psychotropics, antibiotic dispensing trends). | Formats compliant with local health authority regulatory filing standards. |

---

## 4. Accounting / Consulting Office ERP (System ID: `CON`)
*Target Businesses*: Accounting Firms, Audit Practices, Tax Advisors, Management Consultancies.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `HR-01..10`, `XENG-12` (Project Management).

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **CON-01** | Client Engagement & Agreements | Partner, Senior Consultant | Engagement letter setup defining scope of work, billing model (Fixed Fee, Time & Materials, Retainer), and billing schedule. | Version-controlled engagement terms; prevents unassigned consultants from charging hours. |
| **CON-02** | Task-Based Project Billing | Consultant, Project Mgr | Work breakdown into phases (Audit Planning, Fieldwork, Reporting). Time entries linked directly to engagement tasks. | Multi-tier rate cards by consultant seniority (Partner, Senior, Junior, Associate). |
| **CON-03** | Billable vs Non-Billable Time | Consultant, Partner | Timesheet capture distinguishing client billable hours from administrative/training hours. | Minimum 15-minute increment tracking; partner approval before timesheet lock and billing export. |
| **CON-04** | Retainer & Advance Management | Billing Clerk, Accountant | Upfront retainer collection deposited to unearned revenue account; monthly drawdown against completed deliverables. | Automatic notification when retainer balance drops below 20% threshold. |
| **CON-05** | Recurring Invoicing Engine | Accountant | Automated monthly/quarterly fee invoicing for ongoing retainer clients (e.g., Bookkeeping, Monthly Tax Filing). | Generates draft invoices on 1st of month; emails finalized PDF upon approval. |
| **CON-06** | Client & Engagement Profitability | Managing Partner, CFO | Real-time calculation: Revenue Billed minus (Consultant Cost per Hour * Hours Spent) minus Out-of-Pocket Expenses. | Visual profit margin breakdown per client, service line, and partner portfolio. |
| **CON-07** | Statutory Deliverable Deadlines | Compliance Mgr, Consultant | Calendar tracking legal tax return deadlines (VAT 15th, Corporate Tax 30th April), audit submission dates, and filings. | Multi-stage status progression (Not Started, In Progress, Review, Filed, Acknowledged). |
| **CON-08** | Secure Client Document Portal | Client, Consultant | Encrypted web portal where clients securely upload trial balances, receipts, and bank statements; download audit reports. | Granular permissions; virus scan on upload; tamper-evident download audit trail. |

---

## 5. School / Educational Institute ERP (System ID: `EDU`)
*Target Businesses*: Private K-12 Schools, Colleges, Training Academies, Language Centers.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `HR-01..10`, `XENG-06` (Subscription/Tuition Billing).

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **EDU-01** | Student Admissions & Enrollment | Admissions Officer, Parent | Online application -> document submission -> assessment test -> acceptance decision -> student ID generation. | Tracks enrollment quotas per grade/class; auto-allocates matriculation numbering. |
| **EDU-02** | Student & Guardian Profiles | Registrar, Guardian | Detailed biographical data, medical alerts, emergency contacts, authorized pickup persons, and sibling links. | Sibling linkage enables family tuition discount calculations automatically. |
| **EDU-03** | Academic Programs, Stages & Courses | Academic Dean, Teacher | Curriculum structure: Academic Year -> Stage -> Grade -> Section -> Subject -> Credit Hours. | Pre-requisite enforcement; assignment of teachers and course syllabus documents. |
| **EDU-04** | Timetable & Classroom Scheduling | Academic Coordinator | Algorithmic classroom, laboratory, and teacher schedule generator preventing room or instructor double-booking. | Visual weekly grid by student section, teacher, and physical room. |
| **EDU-05** | Student Attendance & Absence Tracking | Teacher, Parent | Period-by-period or daily attendance recording via tablet/web; automated SMS to parents upon unexcused absence. | Absence threshold warnings; integration with biometric school turnstiles. |
| **EDU-06** | Exam & Grading Management | Teacher, Registrar | Gradebook supporting continuous assessment, homework, midterms, and final exams with weighted GPA calculation. | Grade approval workflow; locks gradebooks once finalized by department head. |
| **EDU-07** | Transcripts & Official Certificates | Registrar, Student | Automated generation of standardized report cards, transcripts, graduation certificates, and official letters. | Digital QR code verification on printed transcripts for third-party authenticity validation. |
| **EDU-08** | Tuition Fees & Installment Schedules | Bursar, Accountant | Tuition fee structures customized by grade with installment plans (Term 1, Term 2, Term 3), bus fees, and book charges. | Aging statement of student dues; blocks report card access or registration if tuition is severely delinquent. |
| **EDU-09** | Scholarships & Sibling Discounts | Bursar, Principal | Configurable discount policies (10% 2nd sibling, 20% 3rd sibling; merit scholarships; staff children exemptions). | Requires committee approval; reflects as discount allowance in student billing account. |
| **EDU-10** | Parent & Student Portal | Parent, Student | Mobile-responsive portal displaying attendance, homework assignments, exam grades, fee balances, and online tuition payment. | Secure authentication; direct messaging between parents and homeroom teachers. |
