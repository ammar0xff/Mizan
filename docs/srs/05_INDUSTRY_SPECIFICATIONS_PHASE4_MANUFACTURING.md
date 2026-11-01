# Vendora Modular ERP — Software Requirements Specification (SRS)
## Section 05: Phase 4 — Manufacturing & Production

---

### Phase Scope
Phase 4 covers industrial manufacturing across both discrete assembly and continuous process paradigms: Discrete Assembly, Food/Beverage Processing, Pharmaceutical/Chemical GMP Manufacturing, and Printing/Packaging plants.

---

## 18. Discrete Manufacturing ERP (System ID: `MFG`)
*Target Businesses*: Automotive Assembly, Industrial Machinery, Electronics, Metal Fabrication, Furniture.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `HR-01..10`, `XENG-10` (Quality).

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **MFG-01** | Multi-Level Bill of Materials (BOM) | Indented multi-tier product assembly trees (Finished Good -> Sub-Assembly -> Component -> Raw Material). Supports engineering revision controls and effective date ranges. |
| **MFG-02** | Work Centers & Routing Operations | Sequence of manufacturing steps (Cutting, Welding, Painting, Assembly, Testing). Defines standard run time, setup time, labor rates, and machine hourly costs per work center. |
| **MFG-03** | Material Requirements Planning (MRP) | Explodes master production schedules (MPS) against open sales orders and stock levels; calculates gross vs net raw material demand and recommends PO release dates. |
| **MFG-04** | Production Order Management | Work order release, material staging, batch allocation, operation start/complete tracking, and status lifecycle (Planned, Released, In-Progress, Closed). |
| **MFG-05** | Shop Floor Control (SFC) | Tablet/barcode terminals on shop floor where operators clock in, log good pieces produced, scrap quantities, and operation run time. |
| **MFG-06** | Work-In-Progress (WIP) Accounting | Real-time valuation of inventory residing in mid-assembly operations. Accumulates raw materials, direct labor, and manufacturing overhead before finished goods transfer. |
| **MFG-07** | Rough-Cut Capacity Planning (RCCP) | Evaluates machine center and labor hour availability against projected production workload; highlights bottleneck work centers. |
| **MFG-08** | Backflushing of Inventory | Automatic deduction of component inventory based on BOM ratios upon completion of finished goods production orders. |
| **MFG-09** | Quality Inspection & Non-Conformance | Incoming, in-process, and final quality control inspections. Generates Non-Conformance Reports (NCR) and routes defective units to quarantine. |
| **MFG-10** | Scrap & Rework Management | Logs rework labor and additional material costs spent to repair out-of-spec products; calculates scrap percentage variance against standard tolerance. |
| **MFG-11** | Production Costing (Standard vs Actual) | Compares theoretical BOM/routing cost against actual material consumed, direct labor hours logged, and allocated factory overhead. Reports material usage variances. |
| **MFG-12** | Overall Equipment Effectiveness (OEE) | Calculates machine performance metrics: OEE = Availability * Performance * Quality. Logs machine breakdowns and idle reason codes. |

---

## 19. Food / Beverage Process Manufacturing ERP (System ID: `FOD`)
*Target Businesses*: Dairy Processing, Canned Foods, Bakeries, Meat Packing, Beverage Bottling.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `RES-02..08`.

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **FOD-01** | Formula & Recipe Scaling | Formulation management with dynamic batch scaling based on target output weight (kg) or available core ingredient stock (e.g., scale milk batch to 5,000L). |
| **FOD-02** | Ingredient Potency & Substitution | Adjusts ingredient quantities based on active potency, moisture content, or brix rating (e.g., sugar syrup concentration adjustments). |
| **FOD-03** | Batch Production Lifecycle | Batch order release, ingredient pre-weigh staging, mixing, cooking, cooling, and automated packaging lines tracking. |
| **FOD-04** | Bi-Directional Batch Traceability | Immediate backward trace from finished lot to raw ingredient suppliers, and forward trace from contaminated raw ingredient to all distributed consumer packages. |
| **FOD-05** | Dynamic Shelf-Life Calculation | Calculates expiration date based on the shortest shelf-life ingredient in the recipe or pasteurization completion timestamp. |
| **FOD-06** | FEFO Warehouse Management | Strictly directs warehouse operators to pick earliest-expiring ingredient lots (`INV-09`); blocks picking expired batches for food production. |
| **FOD-07** | Yield Variance & Evaporation Loss | Tracks natural weight loss during cooking, dehydration, or fermentation. Flags batch yield variances exceeding standard moisture loss tolerances. |
| **FOD-08** | HACCP & Critical Control Points (CCP) | Digital logging of mandatory temperature, pH, metal detector checks, and sterilization cycles at defined CCP intervals. Halts line if CCP limits breached. |
| **FOD-09** | QA Lab Sampling & Microbiology | Records lab results (E. coli, Salmonella, Yeast, Moisture %) against batch samples; automated quarantine release only upon passing test sign-off. |
| **FOD-10** | Mock Recall Simulator | Audits traceability speed: system must generate complete report of suspect lot distribution within 30 minutes to satisfy ISO 22000 / FDA audit standards. |
| **FOD-11** | Co-Products & By-Products Costing | Allocates joint manufacturing costs across main product and secondary outputs (e.g., Cheese production yielding Whey byproduct; Oil refining yielding Meal). |
| **FOD-12** | Cold Storage IoT Telemetry | Continuous temperature and humidity sensors in raw cold rooms and finished goods distribution freezers with SMS alarm triggers. |

---

## 20. Pharmaceutical / Chemical Process Manufacturing (System ID: `PHM`)
*Target Businesses*: Formulation Pharma, Active Pharmaceutical Ingredients (API), Specialty Chemicals, Cosmetics.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `PHA-01..12`.

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **PHM-01** | Current Good Manufacturing Practice (cGMP) | System workflows enforce compliance with FDA 21 CFR Part 11, EU GMP Annex 11, and WHO technical guidelines. |
| **PHM-02** | Electronic Batch Records (EBR) | Digital step-by-step master production record. Requires operator dual-witness sign-offs for critical ingredient additions. |
| **PHM-03** | Qualified Person (QP) Batch Release | Formal Quality Assurance disposition workflow. System locks finished inventory until the Authorized QP signs the release certificate. |
| **PHM-04** | Quality Control (QC) Lab Management | Integrated LIMS functionality: reagent tracking, test methods, Certificate of Analysis (CoA) generation, and out-of-specification (OOS) workflows. |
| **PHM-05** | Deviation & Non-Conformance Mgmt | Structured recording of production deviations, environmental excursions, or machine errors with risk impact assessment. |
| **PHM-06** | CAPA (Corrective & Preventive Actions) | Formal lifecycle for corrective actions: root cause investigation (5-Whys, Ishikawa), action plan implementation, and effectiveness review. |
| **PHM-07** | Controlled Change Management (MOC) | Strict change control approval for alterations to master recipes, production machinery, suppliers, or critical process parameters. |
| **PHM-08** | Equipment Qualification & Calibration | IQ/OQ/PQ records, calibration due date tracking, and operational logbooks for reactors, autoclaves, and packaging lines. |
| **PHM-09** | Clean-In-Place (CIP) & Line Clearance | Mandatory digital check and supervisor verification of vessel cleaning and packaging line clearance between production campaigns to prevent cross-contamination. |
| **PHM-10** | Regulatory Dossier & Stability Testing | Stability chamber study tracking (Zone IVb conditions: 30°C/75% RH). Generates degradation curve reports for ministry registration. |
| **PHM-11** | 21 CFR Part 11 Electronic Signatures | Cryptographic e-signatures with re-authentication (username + password + reason code), unalterable timestamps, and immutable audit trails. |
| **PHM-12** | Raw Material Quarantine & Retest Dates | Chemical raw materials receive `Quarantine` status on receipt; requires QC lab testing before status switch to `Approved for Use`. Auto-expires upon retest date. |

---

## 21. Printing / Packaging ERP (System ID: `PRN`)
*Target Businesses*: Commercial Offset Printers, Flexo Packaging, Digital Print Shops, Corrugated Carton Plants.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `MFG-01..11`.

| ID | Requirement | Key Specification & Acceptance Criteria |
|---|---|---|
| **PRN-01** | Job Ticket / Job Docket Production | Central digital job jacket capturing client specs: run quantity, finished dimensions, page count, substrate, ink colors (CMYK + Pantone), binding, finishing. |
| **PRN-02** | Sheet Imposition & Layout Optimization | Algorithmic calculation of optimum sheet layout and cutting patterns to maximize sheet yield and minimize paper waste. |
| **PRN-03** | Pre-Press & Artwork Approval | Proofing workflow with PDF pre-flight checks, color separation verification, and client digital signature sign-off before CTP plate output. |
| **PRN-04** | Press Scheduling & Gang Run Printing | Scheduling press runs by cylinder width, ink wash-up sequence (light to dark), and grouping similar jobs onto a single plate (Gang Running). |
| **PRN-05** | Material Estimation & Ink Formulation | Calculation of paper reams, ink consumption (coverage % formula), lamination film, die-cutting dies, and hot foil stamping requirements. |
| **PRN-06** | Reel & Sheet Stock Management | Substrate inventory tracking by paper type, basis weight (GSM), grain direction, caliper, and reel diameter/linear meters. |
| **PRN-07** | Post-Press Finishing Operations | Production tracking through folding, stitching, die-cutting, gluing, laminating, embossing, and carton gluing lines. |
| **PRN-08** | Spoilage & Make-Ready Waste | Dedicated tracking of make-ready sheets during press setup vs running spoilage with variance against estimated waste allowance. |
| **PRN-09** | Machine Hourly Rate (MHR) Costing | Accurate job costing multiplying work center hourly rates (Prep, 4-Color Press, Die-Cutter) by actual logged run time plus raw material consumption. |
| **PRN-10** | Packaging Bundles & Pallet Stacking | Carton packing, pallet layer patterns, strapping, and GS1 logistic pallet label generation with gross weights for dispatch. |
