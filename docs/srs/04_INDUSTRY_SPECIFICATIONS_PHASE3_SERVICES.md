# Mizan Modular ERP — Software Requirements Specification (SRS)
## Section 04: Phase 3 — Service-Based Systems

---

### Phase Scope
Phase 3 covers service-centric, appointment-driven, and client-relationship intensive business models: Healthcare Clinics/Hospitals, Law Practices, Travel Agencies, Hotels, Gyms & Sports Clubs, Salons & Spas, Creative & Translation Agencies, and Field Service Operations.

---

## 10. Clinic / Hospital ERP (System ID: `HLT`)
*Target Businesses*: Medical Clinics, Polyclinics, Day-Surgery Centers, Community Hospitals.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `HR-01..10`, `INV-01..10`, `PHA-01..12` (Pharmacy/Dispensing).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **HLT-01** | Electronic Medical Record (EMR) | Physician, Nurse | Longitudinal patient chart: Vitals, Medical History, Allergies, Chronic Conditions, Clinical Progress Notes. HIPAA/GDPR compliant access control. |
| **HLT-02** | Physician Appointment Scheduling | Receptionist, Doctor | Multi-doctor calendar with consultation duration slots, walk-in queuing, cancellation reasons, and automated SMS reminders. |
| **HLT-03** | Encounters & Clinical Diagnoses | Physician | Structured encounter documentation capturing chief complaint, ICD-10 diagnostic coding, and physical exam findings. |
| **HLT-04** | Electronic Prescriptions (e-Rx) | Physician, Pharmacist | Digital prescription generation linked directly to in-clinic pharmacy (`PHA-04`) with dosage instructions and allergy warnings. |
| **HLT-05** | Lab & Radiology Orders | Physician, Lab Tech | Order entry for diagnostic tests; barcode specimen tracking; result entry with normal reference ranges; physician sign-off. |
| **HLT-06** | Patient Billing & Insurance | Billing Clerk, Insurer | Co-pay settlement, deductibles, universal health insurance claims submission, and pre-authorization approvals. |
| **HLT-07** | Inpatient Admission & Discharge | Admissions Clerk | Bed reservation, admission assessment, daily inpatient care charting, discharge summary, and unified discharge billing. |
| **HLT-08** | Ward & Bed Management | Head Nurse | Graphical ward floor plan displaying real-time occupancy (Occupied, Cleaning, Reserved, Maintenance). |
| **HLT-09** | Medical Equipment Calibration | Bio-Med Engineer | Registry of clinical devices (Ultrasound, ECG, Autoclaves) with preventive maintenance schedules and calibration certificates. |
| **HLT-10** | Medical Coding (ICD-10, CPT) | Medical Coder | Translates clinical notes into standard billing codes (ICD-10, CPT) required for private and public insurance reimbursement. |
| **HLT-11** | Patient Consent & Data Privacy | Compliance Officer | Digital patient consent capture, medical record access audit logs, and restricted VIP patient chart protections. |
| **HLT-12** | Clinical Quality & Mortality Reporting | Medical Director | Statistical reporting on hospital-acquired infections, readmission rates within 30 days, patient wait times, and mortality. |

---

## 11. Law Firm ERP (System ID: `LAW`)
*Target Businesses*: Law Firms, Legal Counsel Practices, Intellectual Property Agencies.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `CON-01..08` (Consulting Base).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **LAW-01** | Case & Matter Management | Partner, Associate | Comprehensive case files: Case Number, Court Jurisdiction, Opposing Party, Opposing Counsel, Assigned Legal Team. |
| **LAW-02** | Court Hearings & Deadline Calendar | Legal Assistant | Master judicial calendar tracking court sessions, appeal filing deadlines, statute of limitations, and expert witness sessions. |
| **LAW-03** | Conflict of Interest Checking | Compliance Partner | Automated keyword and party search across past and active clients/matters before accepting new engagement. |
| **LAW-04** | Legal Document Versioning | Lawyer, Paralegal | Secure document drafting with redlining, version control, contract clause libraries, and electronic signature integration. |
| **LAW-05** | Billable Hours by Lawyer & Matter | Associate, Partner | Precise time tracking (hourly or block billing) with rate multipliers for court appearances vs document drafting. |
| **LAW-06** | Client Trust Account Accounting | Finance Director | Strict regulatory segregation of client trust funds (retainers, settlement payouts) from the firm's operational bank accounts. |
| **LAW-07** | Case Disbursement Tracking | Finance, Paralegal | Tracking out-of-pocket court filing fees, expert testimony costs, translation, and travel expenses billed back to client. |
| **LAW-08** | Evidence & Discovery Repository | Lawyer, Investigator | Cataloging physical and digital evidence, exhibits, depositions, and chain-of-custody documentation. |
| **LAW-09** | Secure Client Case Portal | Client, Lawyer | Encrypted client portal to view case milestones, upcoming hearings, shared pleadings, and account statements. |

---

## 12. Travel Agency ERP (System ID: `TRV`)
*Target Businesses*: Tour Operators, Corporate Travel Agencies, Inbound/Outbound Travel Agendas.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `PUR-01..08`.

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **TRV-01** | Tour Package & Itinerary Builder | Tour Specialist | Drag-and-drop itinerary creator combining flights, hotels, transfers, sightseeing, and meal plans into branded day-by-day PDFs. |
| **TRV-02** | Flight GDS / API Integration | Ticketing Agent | Connects with Amadeus / Sabre / Travelport APIs for flight search, PNR creation, ticket issuance, and void/refund processing. |
| **TRV-03** | Hotel Bed-Bank Integrations | Reservations Clerk | Live room availability and wholesale rates from Hotelbeds, WebBeds, and direct contracted hotel partner allotments. |
| **TRV-04** | Group Tours & Passenger Manifests | Group Coordinator | Group departure management, rooming lists, dietary requirements, passport validity checks, and tour leader allocations. |
| **TRV-05** | Commission & Markup Calculation | Finance Officer | Dynamic margin engine supporting fixed markups, percentage markups, and GDS back-end supplier commissions tracking. |
| **TRV-06** | Cancellation & Refund Policies | Ticketing Agent | Automates tiered supplier cancellation penalties (e.g., 30 days free, 15 days 50%, < 7 days non-refundable) and refund vouchers. |
| **TRV-07** | Traveler Passports & Visa Vault | Documentation Clerk | Encrypted storage of passport scans, visa grant notices, travel insurance policies, and expiry notification reminders. |
| **TRV-08** | Consolidated Travel Invoicing | Corporate Billing Clerk | Single monthly consolidated corporate invoice grouping hundreds of employee flights, hotel stays, and car rentals. |
| **TRV-09** | Sub-Agent & Affiliate Commission | B2B Sales Mgr | B2B sub-agent portal with dedicated credit limits, white-label vouchers, and instant commission deductions. |
| **TRV-10** | Live Availability Synchronization | Tech Ops | Caches and syncs allotment quotas across external booking channels to prevent overbooking group tour seats. |

---

## 13. Hotel / Hospitality ERP (System ID: `HOT`)
*Target Businesses*: Hotels, Resorts, Boutique Inns, Serviced Apartments.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `HR-01..10`, `RES-01..10` (F&B / Kitchen), `INV-01..10`.

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **HOT-01** | Property Management System (PMS) | Front Desk, GM | Central reservation calendar, room availability matrix, rate plans (BAR, Corporate, Non-refundable), and occupancy KPIs. |
| **HOT-02** | Room Inventory & Hierarchy | Reservations Mgr | Room configuration: Property -> Building -> Floor -> Room Type (Standard, Suite, Deluxe) -> Room Number with smoking/bedding tags. |
| **HOT-03** | Check-in, Check-out & Guest Folios | Front Desk Clerk | Guest registration card, passport scan, keycard encoding integration (VingCard, Salto), folio charging, and room billing settlement. |
| **HOT-04** | Housekeeping Task Dispatch | Housekeeper, Supervisor | Real-time room cleaning status (Clean, Dirty, Inspected, Out-of-Order). Mobile app for maids to update room status instantly. |
| **HOT-05** | Channel Manager Bi-Directional Sync | Revenue Manager | Instant two-way sync of room rates and availability with OTAs (Booking.com, Expedia, Agoda) to eliminate manual parity issues. |
| **HOT-06** | Room Maintenance Work Orders | Chief Engineer | Engineering requests for broken AC, plumbing, or electrical issues directly flagging room as `Out of Service`. |
| **HOT-07** | Guest Incidentals & POS Posting | Waiter, Front Desk | Restaurant, spa, and laundry bills charged directly to room number with guest signature verification (`Room Folio Posting`). |
| **HOT-08** | Night Audit & Day-End Closing | Night Auditor | Automated midnight rollover: posts room charges, taxes, reconciles daily revenue, generates RevPAR, ADR, and Occupancy % reports. |
| **HOT-09** | Rate & Revenue Management | Revenue Manager | Dynamic pricing algorithms adjusting daily rates based on forecasted occupancy, seasonal events, and competitor monitoring. |
| **HOT-10** | Guest Profile & Loyalty History | Concierge, Guest Relations | Captures guest preferences (pillow type, room floor, anniversaries), total lifetime spend, and VIP recognition tags. |
| **HOT-11** | Minibar & Amenity Consumption | Minibar Attendant | Daily minibar audit with automatic posting to guest folio and replacement stock request to housekeeping store. |
| **HOT-12** | Banqueting & Event Catering | Events Coordinator | Conference room booking, audio-visual equipment rental, banquet catering menu selection, and event deposit invoicing. |

---

## 14. Gym / Sports Club ERP (System ID: `GYM`)
*Target Businesses*: Fitness Centers, Crossfit Boxes, Sports Academies, Martial Arts Studios.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `RET-01..05` (POS for Shakes/Supplements), `XENG-06` (Subscription Billing).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **GYM-01** | Membership Lifecycle Management | Sales Rep, Member | Membership plans (Monthly, Quarterly, Annual, Off-Peak). Captures health disclaimer, emergency contacts, and photo ID. |
| **GYM-02** | Turnstile & Access Control Sync | Front Desk, Member | Integrates with RFID wristbands, biometric finger/face scanners, and QR barcodes at entry turnstiles. Blocks expired/frozen members. |
| **GYM-03** | Membership Freeze & Cancellation | Member, Front Desk | Allows members to freeze subscription for configured days (e.g., up to 30 days/year) with automated recalculation of expiry date. |
| **GYM-04** | Personal Training (PT) Packages | Fitness Mgr, Trainer | PT package purchase (e.g., 12 sessions). Trainee check-in consumes session balance; verifies trainer signature. |
| **GYM-05** | Group Class & Court Scheduling | Coach, Member | Class timetable (Yoga, Spinning, CrossFit) with capacity limits. Member mobile app booking with automated waitlist promotion. |
| **GYM-06** | Trainer Commission Calculation | Accountant | Calculates trainer commissions based on private sessions completed, group class headcount, and new membership sales quotas. |
| **GYM-07** | Automated Renewal Reminders | Marketing, Front Desk | Automated WhatsApp and SMS alerts dispatched at 7 days, 3 days, and 1 day prior to membership expiry with payment link. |
| **GYM-08** | Member Body Assessment & Metrics | Trainer | InBody biometric data logging (Weight, Body Fat %, Muscle Mass, BMI) with progress tracking charts on member mobile portal. |
| **GYM-09** | Gym-POS & Shake Bar Integration | Cashier | Specialized POS for sports supplements, healthy meals, and apparel with member account charging or cash checkout. |
| **GYM-10** | Fitness Equipment Maintenance | Gym Supervisor | Periodic inspection log of treadmills, weights, and cables with repair status tracking and spare part requisition (`INV-05`). |

---

## 15. Salon / Spa ERP (System ID: `SAL`)
*Target Businesses*: Hair Salons, Beauty Centers, Day Spas, Barbershop Chains.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `RET-01..05`, `HR-01..10`, `XENG-07` (Scheduling).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **SAL-01** | Service Catalog & Duration Matrix | Salon Manager | Services defined with estimated durations (e.g., Haircut 30m, Coloring 90m, Massage 60m), buffer turnaround time, and price. |
| **SAL-02** | Visual Stylist Appointment Calendar | Receptionist | Grid calendar by stylist/station and time slot. Drag-and-drop rescheduling; color-coded appointment statuses. |
| **SAL-03** | Service Packages & Prepaid Sessions | Receptionist, Client | Prepaid series (e.g., Pack of 5 Moroccan Baths). Tracks remaining balance and validates client identity. |
| **SAL-04** | Stylist Commission Engine | Accountant | Multi-tiered commissions: Services rendered % + Retail product sales % with deduction of service consumable costs. |
| **SAL-05** | Customer Beauty Treatment History | Stylist | Historical log of hair dye formulas (brand, shade ratio, developer volume), skin sensitivity notes, and before/after photos. |
| **SAL-06** | Internal Consumables Depletion | Stylist, Storekeeper | Internal consumption tracking of bulk shampoos, coloring tubes, wax, and oils consumed during treatments (`INV-03`). |
| **SAL-07** | No-Show & Cancellation Policy | Receptionist | Captures deposits upon online booking; charges cancellation fee if client cancels within < 4 hours of appointment. |
| **SAL-08** | Treatment Room & Chair Booking | Receptionist | Allocation of specialized physical rooms (Facial Room, Sauna, Jacuzzi) and equipment to prevent double-booking. |
| **SAL-09** | Client Review & Rating Capture | Client, Manager | Automated SMS survey post-appointment. Flags negative reviews (< 3 stars) to manager for immediate follow-up. |
| **SAL-10** | Walk-in Queuing Display | Hostess, Client | Digital waiting room display showing estimated wait time and current ticket number being served. |

---

## 16. Creative / Translation / Design Agency ERP (System ID: `AGE`)
*Target Businesses*: Digital Marketing Agencies, Advertising Studios, Translation Bureaus, Architecture Practices.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `CON-01..08`, `XENG-12` (Project Management).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **AGE-01** | Creative Brief & Project Scoping | Account Manager | Captures client objectives, target audience, brand guidelines, deliverables (video, graphics, copy), and hard deadlines. |
| **AGE-02** | Milestone & Sprint Deliverables | Project Mgr, Designer | Project broken into milestones with client sign-off gates. Prevents progressing to production before brief approval. |
| **AGE-03** | Creative Asset Versioning & Proofing | Art Director, Client | Web-based proofing tool allowing clients to pin comments directly onto image and video timecodes with version comparisons. |
| **AGE-04** | Resource Capacity & Workload Board | Traffic Manager | Heatmap of designer and copywriter bandwidth preventing team burnout; assists task assignment based on availability. |
| **AGE-05** | Retainer Hours & Scope Creep Alert | Account Executive | Compares actual hours burned against monthly retainer contract; alerts team when 80% of allocated hours are consumed. |
| **AGE-06** | Translation Memory & Word Counts | Translator, PM | Word-count calculation (source words, weighted words, repetitions) and translation rate calculation per word/page. |
| **AGE-07** | Freelancer & Contractor POs | Project Mgr, Finance | Purchase orders generated for external voice actors, 3D animators, or translators with cost tracking against project margin. |
| **AGE-08** | Digital Asset Management (DAM) | Creative Team | Central tagged repository of client logos, fonts, raw footages, and final approved high-resolution render files. |
| **AGE-09** | Campaign Media Spend Reconciliation | Media Buyer | Reconciles client ad spend budgets against actual Facebook, Google, and TikTok ad network billing invoices. |
| **AGE-10** | Client Approval Workflow | Client, PM | Formal digital sign-off records with timestamp and IP verification before release of copyright or high-res assets. |

---

## 17. Field Service / Maintenance ERP (System ID: `FSM`)
*Target Businesses*: HVAC Maintenance, Elevator Servicing, IT Field Support, Appliance Repair Networks.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `CRM-01..08`, `LOG-01..06`.

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **FSM-01** | Service Request & Ticket Intake | Dispatcher, Client | Customer hotline or portal request logging issue category, priority SLA (Emergency 2h, Standard 24h), and equipment location. |
| **FSM-02** | Work Order Generation & Dispatch | Dispatcher, Tech | Generates Work Order with required skills, checklist tasks, and recommended spare parts; assigns to nearest qualified technician. |
| **FSM-03** | Technician Route & GPS Dispatch | Dispatcher, Tech | Visual map dispatching based on technician live location, traffic conditions, and job proximity to minimize travel time. |
| **FSM-04** | Van / Trunk Inventory Tracking | Field Technician | Mobile stock location representing technician van inventory. Tracks parts used on-site; auto-triggers warehouse replenishment. |
| **FSM-05** | Service Level Agreement (SLA) Engine | Service Director | Monitors First-Time Fix Rate (FTFR), Mean Time to Repair (MTTR), and SLA breach countdown timers with escalation alerts. |
| **FSM-06** | Equipment Service History Log | Field Technician | Serialized history of all past maintenance visits, replaced components, and inspection test values for each customer machine. |
| **FSM-07** | Preventive Maintenance (PM) Scheduler | Service Coordinator | Automated generation of recurring scheduled maintenance work orders based on calendar cycles or equipment run hours. |
| **FSM-08** | Mobile Field App & Offline Mode | Field Technician | Mobile application for technicians to view work orders, fill inspection checklists, take photos, and work offline in basements. |
| **FSM-09** | On-Site Signatures & Field Invoice | Field Tech, Customer | Captures customer sign-off signature on mobile screen; prints or emails completed Service Report and tax invoice. |
| **FSM-10** | Warranty & Service Contract Validation | Dispatcher, Tech | Automatic verification if customer equipment is covered by active AMC (Annual Maintenance Contract) or manufacturer warranty. |
| **FSM-11** | Subcontractor Field Job Management | Dispatcher, Finance | Outsourced service job dispatching to certified third-party service partners with fixed labor rate verification. |
