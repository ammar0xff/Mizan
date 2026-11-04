# Mizan Modular ERP — Software Requirements Specification (SRS)
## Section 06: Phase 5 — Projects & Infrastructure

---

### Phase Scope
Phase 5 specifies capital-intensive, project-managed, and asset-heavy infrastructure domains: General Construction & Contracting, Real Estate & Property Management, Commercial Agriculture & Livestock, and Energy/Power Generation.

---

## 22. Construction / Contracting ERP (System ID: `CST`)
*Target Businesses*: General Contractors, Civil Engineering, MEP Contractors, Infrastructure Developers.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `PUR-01..08`, `INV-01..10`, `HR-01..10`, `XENG-12` (Project Management).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **CST-01** | Project Site Hierarchy & WBS | Project Director | Multi-level Work Breakdown Structure (WBS): Project -> Zone -> Building -> Floor -> Activity with assigned project engineers. |
| **CST-02** | Bill of Quantities (BOQ) Engine | Cost Estimator, QS | Comprehensive BOQ importing Excel/CSI MasterFormat: item description, unit, estimated qty, contract rate, and baseline budget. |
| **CST-03** | Project Budget & Cost Controls | Cost Controller, CFO | Tracks commitments (issued POs), actual costs (invoices/timesheets), and forecast at completion (EAC) with cost-to-complete variance. |
| **CST-04** | Progress Invoicing & IPC Management | Quantity Surveyor | Interim Payment Certificates (IPC): measurement of work completed, retention deduction (5-10%), advance payment recovery, and net client billing. |
| **CST-05** | Variation & Change Order Tracking | Contract Administrator | Client or consultant change orders: scope delta, price adjustment, and contractual time extension approval before site execution. |
| **CST-06** | Subcontractor Package Management | Procurement, QS | Subcontractor agreements, back-to-back payment terms, subcontractor progress payment evaluations, and retention release upon defect liability. |
| **CST-07** | Site Material Requisitions (MR) | Site Engineer, Store | Digital requisition of concrete, rebar, pipes from project site with automatic verification against BOQ allocated limits. |
| **CST-08** | Heavy Machinery & Plant Allocation | Plant Manager | Equipment tracking (Excavators, Cranes, Generators, Trucks), daily utilization logs, idle hours, fuel consumption, and inter-site mobilization. |
| **CST-09** | Site Labor & Daily Manpower Logs | Foreman, HR | Daily timesheets by trade (Mason, Carpenter, Steel Fixer, Electrician) allocated directly to specific WBS activity cost codes. |
| **CST-10** | Critical Path (CPM) Schedule Sync | Planning Engineer | Integration with Primavera P6 / MS Project XML to sync task start/end dates, milestone baselines, and calculate schedule slippage. |
| **CST-11** | Quality Site Inspections (WIR/MIR) | QA/QC Inspector | Work Inspection Requests (WIR) and Material Inspection Requests (MIR) with consultant sign-off and photo evidence. |
| **CST-12** | Project Cash Flow Forecasting | Finance Director | S-curve cash in vs cash out forecasting matching project timeline and billing milestones. |
| **CST-13** | Retention & Advance Guarantees | Treasury Accountant | Letter of Guarantee (LG) tracking (Bid Bond, Performance Bond, Advance Payment Bond, Retention Bond) with bank margin and renewal alerts. |
| **CST-14** | Material Waste & Scrap on Site | Site Engineer | Comparison of theoretical design quantity (BOM) against actual site consumption (e.g., rebar cutting waste percentage). |
| **CST-15** | Snagging & Handover Defect Period | Handover Mgr, Client | Digital punch-list management during project handover; tracks rectification of defects prior to Final Acceptance Certificate (FAC). |

---

## 23. Real Estate / Property Management ERP (System ID: `RE`)
*Target Businesses*: Commercial Real Estate, Residential Compounds, Mall Operators, Asset Asset Managers.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `CRM-01..08`, `FSM-01..11` (Maintenance), `XENG-06` (Subscription/Rent Billing).

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **RE-01** | Property Portfolio & Unit Hierarchy | Portfolio Manager | Property Tree: Portfolio -> Community/Compound -> Building/Tower -> Floor -> Unit (Apartment, Retail Shop, Office, Villa, Parking). |
| **RE-02** | Unit Availability & Status Board | Leasing Agent | Color-coded visual matrix showing unit status: Vacant, Leased, Reserved, Maintenance, Under Fit-out. |
| **RE-03** | Lease Contract Lifecycle | Leasing Officer | Lease drafting, tenant screening, agreed rental rate, installment frequency (Quarterly, Bi-Annual), fit-out grace period, and e-signatures. |
| **RE-04** | Cheque & Rent Collection Schedule | Treasury Accountant | PDC (Post-Dated Cheque) management vault, bank deposit scheduling, bounce notification workflows, and online payment portal. |
| **RE-05** | Security Deposit Vault & Escrow | Accountant | Tracks refundable security deposits, holds in escrow, deducts unit damage restoration fees upon move-out, and refunds balance. |
| **RE-06** | Escalation & Renewal Automation | Leasing Manager | Automated lease renewal notifications 90/60 days prior to expiry; applies annual rental indexation percentage according to law. |
| **RE-07** | Service Charge & Common Area (CAM) | Operations Director | Apportions building operating costs (cleaning, security, chiller, landscaping) to tenants by Gross Leasable Area (GLA) square meters. |
| **RE-08** | Tenant Maintenance Request Portal | Tenant, Facilities Mgr | Mobile tenant portal to log plumbing, electrical, or AC complaints; dispatches work orders to facility engineers (`FSM-02`). |
| **RE-09** | Move-in & Move-out Unit Inspection | Property Inspector | Digital inspection checklist capturing utility meter readings (Water, Electricity, Gas), wall condition, fixture inventory, and photos. |
| **RE-10** | Property Profitability & Yield (NOI) | Asset Manager, CFO | Real-time Net Operating Income (NOI) = Gross Rental Revenue minus Operating Expenses (OPEX); calculates Capitalization Rate (Cap Rate) and ROI. |
| **RE-11** | Retail Mall Sales Turnover Rent | Mall Accountant | Ingests tenant monthly retail sales figures; calculates Base Rent vs Percentage Turnover Rent (e.g., Base Rent OR 8% of gross sales). |
| **RE-12** | Multi-Property Tax & Depreciation | Financial Controller | Tracks property asset book value, annual building depreciation, municipal property tax declarations, and insurance policies. |

---

## 24. Agriculture / Farm Management ERP (System ID: `AGR`)
*Target Businesses*: Commercial Farms, Orchards, Greenhouses, Dairy Farms, Poultry & Livestock.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `MFG-01..08`.

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **AGR-01** | Land, Farm & Plot Hierarchy | Farm Manager | Geographic partitioning: Farm -> Sector -> Pivot / Greenhouse -> Plot with soil type, acreage (Feddan / Hectare), and GPS polygons. |
| **AGR-02** | Crop Planning & Seasonal Calendars | Agronomist | Crop cycle planning: Seed variety, planting date, expected growing days, target harvest window, and planned yield per acre. |
| **AGR-03** | Crop Rotation & Soil Health | Agronomist | Historical log of planted crops per plot to prevent soil nutrient depletion and pest buildup; tracks nitrogen/pH levels. |
| **AGR-04** | Seed, Fertilizer & Pesticide Mgmt | Agronomist, Store | Application scheduling for chemical fertilizers and sprays; tracks active ingredient dosage, withholding periods (PHI), and safety limits. |
| **AGR-05** | Irrigation & Water Resource Mgmt | Irrigation Tech | Scheduling drip/pivot irrigation run hours, well water salinity tracking, canal water quotas, and diesel/electricity pump costs. |
| **AGR-06** | Farm Machinery & Tractor Telematics | Fleet Supervisor | Operating logs for tractors, harvesters, and sprayers; tracks engine hours, implement attachment changes, and maintenance. |
| **AGR-07** | Field Labor & Piece-Rate Work | Field Supervisor | Daily field labor logging: seasonal harvesting crews paid by collected crates/weight (piece-rate) or daily wage. |
| **AGR-08** | Harvest Planning & Yield Estimation | Farm Manager | Real-time harvest logging: harvested crop weight, grade classification (Class 1, Class 2, Industrial), and sorting reject percentages. |
| **AGR-09** | Harvest Batch Traceability (GlobalGAP) | Quality Officer | Unique harvest lot number linking field plot, harvest date, used pesticide batch, and packing box for export compliance (GlobalG.A.P.). |
| **AGR-10** | Weather Station Telemetry Sync | Tech Ops | Connects with IoT weather stations (Davis, Pessl) logging ambient temperature, humidity, rainfall, and frost warning alerts. |
| **AGR-11** | Livestock Lifecycle Management | Veterinarian | Individual animal tagging (RFID ear-tag), pedigree, breed, calving history, vaccination schedule, milk yield log, and weight gain tracking. |
| **AGR-12** | Commodity Market Pricing Sync | Commercial Sales | Integration with agricultural exchange commodity prices; manages forward contracts and spot market produce sales. |
| **AGR-13** | Seasonal Agricultural Costing | Cost Accountant | Biological asset accounting (IAS 41): accumulates costs across planting, weeding, and irrigation into biological asset until harvest transfer to inventory. |

---

## 25. Energy / Power Plant ERP (System ID: `ENG`)
*Target Businesses*: Solar PV Plants, Wind Farms, Gas Turbine Power Stations, Grid Sub-Stations.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `HR-01..10`, `FSM-01..11`.

| ID | Requirement | User Roles | Workflows & Acceptance Criteria |
|---|---|---|---|
| **ENG-01** | Asset Hierarchy & Functional Locations | Plant Engineer | Standardized asset tree (ISO 14224 / KKS): Plant -> Unit -> System (Turbine, Generator, Inverter) -> Subsystem -> Tagged Component. |
| **ENG-02** | SCADA / IoT Telemetry Data Ingestion | Operations Analyst | High-frequency time-series data connector (OPC-UA, Modbus, MQTT) logging MW output, grid frequency, temperature, and voltage. |
| **ENG-03** | Predictive & Condition-Based Maintenance | Reliability Engineer | Continuous vibration analysis, oil spectrometry, and thermal imaging alerts triggering maintenance work orders before failure. |
| **ENG-04** | Critical Spare Parts & Insurance Spares | Inventory Controller | Management of long-lead critical spares (turbines blades, transformers, circuit breakers) with minimum availability guarantees. |
| **ENG-05** | Major Overhaul & Shutdown Planning | Maintenance Director | Turnaround and shutdown project scheduling: permits, contractor mobilization, component refurbishments, and re-commissioning. |
| **ENG-06** | Generation Capacity & Heat Rate Analysis | Performance Engineer | Tracks thermal efficiency (Heat Rate = Fuel Energy In / Electrical Energy Out) or Performance Ratio (PR) for Solar PV farms. |
| **ENG-07** | Power Purchase Agreement (PPA) Billing | Commercial Billing | Complex tariff settlement matching delivered MWh to grid off-taker against PPA contract tiers, peak/off-peak rates, and availability penalties. |
| **ENG-08** | Permit-to-Work (PTW) & Lockout-Tagout | Safety Officer (HSE) | Mandatory digital Permit-to-Work lifecycle (Hot Work, High Voltage, Confined Space) with Lockout-Tagout (LOTO) isolation confirmations. |
| **ENG-09** | HSE Incident & Near-Miss Reporting | HSE Director | Root-cause incident reporting (OSHA compliant): lost-time injury frequency rate (LTIFR), environmental leaks, and safety corrective actions. |
| **ENG-10** | Carbon Emissions & CEMS Reporting | Environmental Officer | Continuous Emission Monitoring System (CEMS) logging CO2, NOx, and SOx emissions for environmental authority compliance. |
| **ENG-11** | Solar Panel Cleaning & Degradation | Operations Mgr | Algorithmic soiling loss detection identifying when washing solar arrays provides higher ROI than water and cleaning labor costs. |
| **ENG-12** | Grid Compliance & Curtailment Logging | Grid Dispatcher | Records grid dispatch instructions, curtailment events (grid operator commanded output reductions), and compensation claims. |
