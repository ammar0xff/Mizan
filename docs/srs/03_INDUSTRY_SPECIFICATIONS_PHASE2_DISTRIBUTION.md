# Mizan Modular ERP — Software Requirements Specification (SRS)
## Section 03: Phase 2 — Distribution & Logistics

---

### Phase Scope
Phase 2 addresses supply chain, distribution, logistics, multi-client warehouse operations (3PL), and omni-channel e-commerce. Each system inherits from the Shared ERP Core (`CORE-*`, `FIN-*`, `INV-*`, `CRM-*`, `PUR-*`) and integrates specialized logistics engines.

---

## 6. Wholesale / Distribution ERP (System ID: `WHO`)
*Target Businesses*: FMCG Distributors, Pharmaceutical Wholesalers, Building Material Importers, Industrial Equipment Distributors.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `CRM-01..08`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **WHO-01** | Quantity-Based Tiered Pricing | Sales Mgr, Wholesaler | Volume tier ladders: e.g., 1-99 units @ 100 EGP, 100-499 units @ 92 EGP, 500+ units @ 85 EGP. | Evaluated dynamically during order creation; applies volume pricing per line or across cart categories. |
| **WHO-02** | Customer-Specific Price Lists | Account Mgr, Sales Rep | Customized contracted price schedules per wholesale client or distributor class with fixed expiry dates. | Overrides standard price books; restricts order entry to contracted items. |
| **WHO-03** | Minimum Order Quantities (MOQ) | Sales Admin | Enforces minimum quantity per SKU or minimum total order value (MOV) before sales order validation. | Prevents order submission unless MOQ/MOV criteria are satisfied. |
| **WHO-04** | Bulk Order & Packing Hierarchy | Warehouse Clerk | Supports multiple packaging levels (Unit -> Inner Pack -> Carton/Case -> Pallet). Scans master carton barcode to decrement component units. | Automated unit-of-measure conversion throughout sales, inventory, and shipping. |
| **WHO-05** | Sales Territory & Distributor Mgmt | Commercial Director | Assigns geographic sales territories and client routes to dedicated field sales reps or authorized sub-distributors. | Enforces territory exclusivity; tracks target vs actual sales quota achievement. |
| **WHO-06** | Credit Ceiling & Overdue Block | Credit Controller | Real-time evaluation of total exposure = Outstanding Receivables + Unbilled Delivery Notes + Pending Sales Orders. | Hard stop on order booking if exposure exceeds approved credit limit or customer has invoices overdue by > N days. |
| **WHO-07** | Landed Cost Allocation | Cost Accountant | Apportions freight, customs tariffs, port handling, clearance, and marine insurance across imported inventory lots. | Allocates by weight, volume, or invoice value; automatically recalculates final inventory unit cost (`INV-04`). |
| **WHO-08** | Drop-Shipping Workflow | Procurement, Sales | Sales order triggers direct Purchase Order to external supplier with customer's delivery destination. | Supplier ships directly to customer; three-way billing reconciliation without intermediate warehouse inventory handling. |
| **WHO-09** | Backorders & Partial Fulfillment | Order Desk, Warehouse | Orders exceeding available stock split into shipped quantity and open backorder queue. | Auto-notifies order desk and reserves incoming replenishment stock for priority backorder dispatch. |
| **WHO-10** | Distributor Rebates & Incentives | Marketing, Finance | Retrospective volume rebates calculated quarterly/annually based on target tiers achieved by distributors. | Accrues rebate liability during the period; generates credit notes upon formal sign-off. |

---

## 7. Logistics / Transportation ERP (System ID: `LOG`)
*Target Businesses*: Freight Forwarders, Trucking Companies, Courier & Delivery Fleets, Inter-City Cargo.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `HR-01..10`, `CRM-01..08`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **LOG-01** | Consignment & Shipment Lifecycle | Dispatcher, Freight Clerk | Booking -> Cargo Inspection -> Vehicle Allocation -> Departure -> In-Transit -> Destination Hub -> Out for Delivery -> Delivered. | Unique tracking code (AWB / Tracking Number) with milestone timestamps and geo-coordinates. |
| **LOG-02** | Waybill & Bill of Lading (BoL) | Dispatcher, Driver | Automatic generation of standard CMR / Domestic Waybill / Sea Bill of Lading with cargo manifests and hazard declarations. | Barcode embedded for rapid hub scanning; prints multi-copy cargo manifests. |
| **LOG-03** | Real-Time Milestone Tracking | Dispatcher, Customer | Event-driven status updates (Gate-In, Cleared Customs, Departed Hub, Out for Delivery) broadcast to customer portal and webhook. | Supports GPS telematics integration (Teltonika, Queclink, Geotab). |
| **LOG-04** | Route Planning & Optimization | Fleet Planner | Multi-stop delivery routing optimizing travel distance, vehicle capacity constraints, delivery time windows, and traffic tolls. | Visual map routing; generates turn-by-turn waypoint itinerary for driver mobile app. |
| **LOG-05** | Fleet & Vehicle Management | Fleet Manager | Vehicle registry (Plate number, tonnage, cargo volume, refrigeration capability, license expiry, insurance policy, odometer). | Automated preventive maintenance reminders based on mileage or calendar intervals. |
| **LOG-06** | Driver Compliance & Rostering | Fleet Supervisor | Driver license validation (Heavy vehicle, Hazmat), medical check records, driving hours limitation (prevent fatigue), and trip assignments. | Blocks trip dispatch if driver certification is expired or exceeds maximum driving hours. |
| **LOG-07** | Freight Tariff & Rating Matrix | Pricing Officer | Multi-dimensional freight rating: Distance (km), Weight (kg/ton), Volumetric Weight (CBM), and zone-to-zone fixed tariffs. | Volumetric calculation standard: (L x W x H in cm) / 5000 (air) or 3000 (land). |
| **LOG-08** | Freight Billing & Accessorials | Billing Clerk | Invoice generation combining freight charges with accessorial fees (fuel surcharge, tailgate, inside delivery, waiting time, demurrage). | Supports consolidated periodic invoicing for corporate account holders. |
| **LOG-09** | Digital Proof of Delivery (e-POD) | Driver, Consignee | Driver mobile app captures receiver signature, photographic proof of delivered cargo, and exact timestamp/GPS coordinates. | Instantly marks consignment `Delivered` and releases billing trigger to finance. |
| **LOG-10** | Vehicle Operating Costs & Fuel Log | Fleet Accountant | Fuel card integration, toll receipts, maintenance expenses, and tire wear tracked per vehicle. | Calculates Cost-Per-Kilometer (CPK) and vehicle profitability across trips. |
| **LOG-11** | Cargo Claims & Damage Workflow | Claims Officer, Insurer | Damaged or missing cargo claim registration, photo evidence, inspection survey, and settlement credit notes. | Tracks claim liability and subrogation recovery against carrier insurance. |

---

## 8. Third-Party Logistics (3PL) ERP / WMS (System ID: `WMS`)
*Target Businesses*: 3PL Providers, Multi-Client Warehouses, Cold Storage Hubs, Fulfillment Centers.
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `PUR-01..08`, `LOG-01..11`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **WMS-01** | Multi-Client Tenancy & Isolation | WMS Admin, Client | Single physical warehouse hosts inventory owned by distinct client accounts with complete data and operational segregation. | Client can only query their own stock, orders, and billing reports; prevents cross-contamination. |
| **WMS-02** | Client-Specific Inventory Ownership | Inventory Controller | Every warehouse pallet, bin, and item explicitly tagged with `Client_ID`. | Inventory adjustments, write-offs, and stock reserves tracked strictly under client liability. |
| **WMS-03** | Algorithmic Putaway Rules | Warehouse Mgr | Recommends optimal bin location based on velocity (ABC classification), cargo dimensions, weight limits, temperature class, and hazardous materials compatibility. | System assigns directed putaway task to forklift operator's mobile scanner. |
| **WMS-04** | Wave, Batch & Zone Picking | Pick Supervisor | Orders grouped into waves; pickers assigned by physical zone (Aisle 1-10) or batch picked to minimize transit time. | Generates pick lists sorted by optimal travel path through warehouse aisles. |
| **WMS-05** | Dynamic Slotting & Replenishment | Warehouse Analyst | Periodically recommends moving high-velocity fast-moving items closer to packing docks; generates internal replenishment tasks from bulk to forward pick faces. | Minimizes overall picker travel distance; recalculates velocity weekly. |
| **WMS-06** | Cross-Docking Engine | Inbound Supervisor | Identifies incoming shipments that match pending outbound orders; directs goods directly from receiving to outbound staging dock without putaway. | Eliminates storage dwell time; slashes handling labor costs by up to 50%. |
| **WMS-07** | Inbound Receiving & Discrepancies | Receiving Clerk | Advance Shipping Notice (ASN) verification, blind counts, carton condition inspection, over/short/damaged (OS&D) reporting. | Generates OS&D report with photos within 2 hours of container de-vanning. |
| **WMS-08** | Client 3PL Billing Engine | Billing Officer | Automated calculation of storage fees (per pallet/day or CBM/month), handling in/out fees, pick-and-pack charges, and packaging material consumption. | Generates itemized monthly 3PL invoices per client with full transaction audit backup. |
| **WMS-09** | Warehouse Labor Productivity | Operations Director | Tracks scan-per-hour, picks-per-hour, and putaway velocity per worker badge via mobile RF scanner sessions. | Real-time productivity leaderboard and labor cost allocation by client account. |
| **WMS-10** | RFID & Gate Scanner Integration | Tech Ops | Portal RFID antennas at loading docks automatically scan pallets passing through; verifies truck manifest in real-time. | Alarms if unmanifested or incorrect pallet passes through dock door. |
| **WMS-11** | Warehouse Service Level Agreements | Quality Mgr | Monitors inbound dock-to-stock time (e.g., < 24 hrs), pick accuracy (> 99.8%), and order cycle time against contractual SLAs. | Client dashboard displays live SLA compliance metrics and penalty calculations. |

---

## 9. E-commerce ERP (System ID: `ECS`)
*Target Businesses*: Pure-play Online Retailers, D2C Brands, Multi-Channel Marketplace Sellers (Amazon, Noon, Shopify).
*Shared Base*: Inherits `CORE-01..15`, `FIN-01..15`, `INV-01..10`, `CRM-01..08`, `RET-01..05`.

| ID | Requirement | User Roles | Workflows & Business Rules | Acceptance Criteria |
|---|---|---|---|---|
| **ECS-01** | Unified Online Product Catalog | Ecom Manager | Centralized product titles, SEO meta tags, rich HTML descriptions, image galleries, and multi-variant pricing. | Master source of truth pushed to Shopify, WooCommerce, Amazon, and Noon via APIs. |
| **ECS-02** | Multi-Marketplace Sync | Integration Engineer | Bi-directional API connectors syncing stock levels, order imports, and fulfillment confirmations across all selling channels. | Inventory buffer reserves buffer stock to prevent overselling across simultaneous channels. |
| **ECS-03** | Payment Gateway Reconciliation | Accountant | Integrates with Paymob, Fawry, Stripe, PayTabs, Tabby, Tamara. Verifies transaction fees, net settlements, and chargebacks. | Auto-reconciliation of payment gateway batch deposits against bank statement (`FIN-09`). |
| **ECS-04** | Cart & Checkout Session Tracking | Marketing, Web Admin | Tracks cart sessions, shipping address validation, tax calculation by destination province, and discount voucher application. | Sub-second checkout response; real-time reservation of stock during checkout lock window (15 mins). |
| **ECS-05** | Order Consolidation & Routing | Fulfillment Supervisor | Consolidates orders from all channels into single fulfillment queue; routes to nearest warehouse with available stock. | Reduces split-shipment costs; assigns optimal courier service by destination postal code. |
| **ECS-06** | Automated Pick, Pack, Ship | Packing Station Operator | Scan barcode of order sheet -> scan items to verify accuracy -> automatic print of shipping label and tax invoice. | 100% item verification preventing packing mistakes; auto-notifies courier API for pickup. |
| **ECS-07** | Return Merchandise Authorization (RMA) | Customer Service | Self-service customer return request portal -> validation -> return shipping label generation -> warehouse inspection -> refund or store credit. | Restocks undamaged items immediately into active inventory (`INV-02`). |
| **ECS-08** | Cash on Delivery (COD) Management | Finance, Dispatcher | Specialized cash remittance reconciliation tracking courier COD collection, remitted funds, courier collection fees, and customer refusal rates. | Discrepancy reporting for courier remittances overdue > 5 business days. |
| **ECS-09** | International Shipping & Multi-Currency | International Ops | Currency conversion at checkout, landed customs calculation (DDP vs DDU), and international courier documentation (DHL, FedEx, Aramex). | Real-time exchange rate refresh; generates commercial invoices for customs clearance. |
| **ECS-10** | Shipping Label Auto-Generation | Warehouse Operator | Generates native shipping label formats (ZPL for thermal printers, PDF 4x6) directly from courier APIs upon packing completion. | Embeds courier tracking barcode, routing code, and delivery sort hub info. |
| **ECS-11** | Customer-Facing Tracking Portal | Customer | Branded order tracking page showing live delivery progress, courier contact, and estimated arrival time. | Reduces "Where Is My Order" (WISMO) support inquiries by over 60%. |
| **ECS-12** | Abandoned Cart Recovery | Growth Marketer | Automated webhook triggering personalized WhatsApp / Email reminders with dynamic discount incentive for abandoned checkouts. | Tracks recovery conversion rate; halts messaging once purchase is completed. |
