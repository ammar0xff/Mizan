# Independent Hospital / Clinic ERP Audit

**System under review:** `backend/app/modules/clinic/` (plus tightly coupled pharmacy, sales, settings, core roles/modules) and `backend/app/modules/clinic/frontend/ClinicHealthcarePage.tsx`.
**Auditor stance:** independent hospital IT auditor; code treated as the entire system.
**Date:** 2026-11-06.
**Files read in full:** `manifest.json`, `models.py`, `router.py`, `frontend/ClinicHealthcarePage.tsx`, `core/roles.py`, `schemas/user.py`, `models/user.py`, `models/tenant.py`, `modules/pharmacy/router.py`, `modules/pharmacy/models.py`, `api/routers/sales.py` (first 120 lines), `api/routers/settings.py` (full), `core/modules.py`.

---

## 1. Executive Summary

**Verdict: PROTOTYPE — not production-ready for a real hospital/clinic.**

The clinic module is a well-tenanted, Arabic-RTL, demo-friendly EMR-lite. It models the happy path of a patient journey (registration → appointment → encounter with vitals & ICD-10 → e-Rx → lab order → inpatient bed) and enforces multi-tenancy via `TenantScoped` + RLS. However, as a hospital information system it is **not safe to use on real patients**: there is **no billing/ledger integration** (money fields are decorative), **no clinical RBAC** (any authenticated tenant user has full clinical access), **no referential integrity** (patient/doctor/bed links are free-text or unvalidated strings), **no audit trail**, **no permission enforcement despite declared permissions**, **no pharmacy dispensing link** (dispense only flips a status), and **no insurance claims**. The frontend masks backend failures with realistic fallback demo data and swallows errors into "info" toasts, so failures are invisible to users.

A real hospital IT auditor would classify this as a **Phase-3 prototype / sales demo**, not a deployable HIS.

---

## 2. Scope & Method

- Static code review of all files listed above.
- Endpoint inventory extracted from `router.py` (clinic + pharmacy) and `sales.py`/`settings.py`.
- Cross-referenced declared permissions in `manifest.json` against `core/roles.py`, `schemas/user.py`, and actual `Depends(...)` usage in routers.
- Cross-referenced clinic ↔ pharmacy ↔ finance linkage by following imports/calls.
- Frontend reviewed for error handling, pagination, role gating, demo-data fallback.

---

## 3. Audit Criteria

### 3.1 Medical / Clinical Operations — ⚠️ Partial

| Capability | Status | Evidence |
|---|---|---|
| Patient registration (EMR) | ✅ basic | `models.py:14-31` ClinicPatient; `router.py:153-197` list/create |
| Patient update/delete/search | ❌ missing | Only `GET/POST /clinic/patients` (`router.py:153,172`); no PUT/DELETE/GET-by-id/search |
| Appointments + queuing | ✅ basic | `models.py:34-51`; `router.py:200-266`; queue_no computed by counting same-date rows (`router.py:220-227`) |
| Appointment cancel/reschedule | ❌ missing | Only `POST /clinic/appointments/{id}/status` (`router.py:249`); no cancel/reschedule endpoint |
| Clinical encounter + vitals | ✅ | `models.py:53-74` (BP/HR/temp/SpO2); `router.py:269-310` |
| ICD-10 diagnosis | ✅ stored | `models.py:70-71` icd10_code/description; no validation against ICD-10 catalog |
| e-Prescription | ⚠️ | `models.py:76-94`; `router.py:325-370`; no quantity, no dose validation, no drug-allergy check |
| Lab order + result + sign-off | ⚠️ | `models.py:96-113`; `router.py:385-432`; result is a free-text string; `is_signed_off` set by same caller (`router.py:429`) |
| Inpatient bed admit/discharge/clean | ✅ basic | `router.py:447-507` |
| Bed ↔ patient link | ❌ weak | `models.py:126` `current_patient_name: str` (free text, not FK to patient) |
| Allergy tracking | ⚠️ stored only | `models.py:26` default string; never enforced at prescribing (`router.py:325-347`) |
| Chronic conditions | ✅ stored | `models.py:27` |
| Insurance provider & copay | ⚠️ stored only | `models.py:28-30`; never used in billing (see 3.2) |
| Drug interaction / allergy alerts | ❌ | none |
| Appointment reminders / no-show | ❌ | none |
| Multi-doctor scheduling / rooms | ❌ | `doctor_name`/`department` are free text (`models.py:42-43`); no doctor entity |
| Referrals / inter-dept transfer | ❌ | none |
| Vital-signs trends / charts | ❌ | none |
| Consent / e-signature | ❌ | none |

### 3.2 Financial Operations — ❌ Largely absent

| Capability | Status | Evidence |
|---|---|---|
| Consultation fee field | ⚠️ stored only | `models.py:48` `consultation_fee`; never creates a sale/invoice |
| Bed daily_rate field | ⚠️ stored only | `models.py:124`; no accumulation (rate × nights) anywhere |
| Insurance copay_percent field | ⚠️ stored only | `models.py:30`; never applied to a payment |
| Invoice generation from consultation | ❌ | No call into `sales.py`/sale_service from clinic router; `grep audit_log` in clinic router = none |
| Insurance claim submission | ❌ | No claim entity; `grep claim` in clinic = none |
| Copay collection / payment posting | ❌ | none |
| Bed charges accumulation | ❌ | `discharge_bed` (`router.py:469-487`) only flips status to "cleaning" |
| Posting to ledger / GL | ❌ | clinic router imports no finance service |
| Pharmacy dispensing → inventory | ❌ | `dispense_prescription` (`pharmacy/router.py:533-622`) decrements `PharmacyBatch.quantity_on_hand` (`pharmacy/router.py:571`) but creates no Sale, no ledger entry, no link to clinic Rx |
| Lab billing | ❌ | `record_lab_result` (`router.py:413-432`) no charge |
| Revenue visibility | ❌ | summary (`router.py:111-150`) returns counts only, no revenue |

**Conclusion:** clinic money fields are decorative; revenue is invisible to finance.

### 3.3 Operational / HR — ❌ Weak

- Roles: `core/roles.py:2-9` defines only `admin, manager, cashier, storekeeper, accountant` — **no clinical roles** (doctor, nurse, receptionist, lab_tech, pharmacist, billing). Manifest declares `clinic:doctor`, `clinic:nurse` (`manifest.json:12`) that map to nothing.
- `_VALID_ROLES` (`schemas/user.py:6`) matches the 5 generic roles — no clinical roles creatable.
- Permission enforcement: clinic router endpoints depend only on `get_current_user`/`get_current_tenant_id` (e.g. `router.py:111-116`, `153-158`, `172-178`) — **no `require_perm` anywhere** (`grep require_perm clinic/router.py` = 0). Any authenticated tenant user reads/writes all clinical data.
- `require_module("clinic")` is never applied to the router (`api/router.py:96-97` includes it unconditionally; `core/modules.py:794` exists but unused here).
- No doctor entity, no department master, no shift/roster, no credential/expiry tracking.
- No audit trail: `grep audit_log clinic/router.py` = 0; `AuditLog` model exists (`models/audit_log.py:13`) but clinic never writes to it.

### 3.4 Pharmacy & Lab Integration — ⚠️ Disconnected

- Pharmacy module is separate and richer (FEFO, controlled-substances log, copay calc) — `pharmacy/router.py`, `pharmacy/models.py`.
- Clinic e-Rx `dispense` (`router.py:354-370`) only sets `status="dispensed"`; does **not** call pharmacy to deduct stock or record a sale. Pharmacy has its own `DispensePrescriptionRequest` (`pharmacy/router.py:47-57`) with no link to `ClinicPrescription.rx_ref`.
- No shared medication catalog between clinic Rx (free-text `medication_name`) and pharmacy `PharmacyDrug`.
- Lab: `ClinicLabOrder` has `specimen_barcode`, `result_value`, `is_signed_off` but no link to a lab module/LIS; result is a single string with no units/numeric value/critical flag/collection timestamp.

### 3.5 Data Integrity — ❌ Weak

- `TenantScoped` on all clinic models (`models.py:14,34,53,76,96,115`) → RLS enforced. ✅
- No FKs between clinic entities: `patient_id: Mapped[str]` indexed but not `ForeignKey` (`models.py:40,59,83,102`); `encounter_ref` on Rx is a string (`models.py:82`); bed patient is free text (`models.py:126`). Referential integrity relies on app discipline.
- `PharmacyDrug.code` is `unique=True` globally (`pharmacy/models.py:18`) — not tenant-scoped unique (multi-tenant collision risk).
- No soft delete / versioning on any clinical entity (no `deleted_at`, no `version`).
- No consent records.
- Seed data uses hardcoded refs (`APT-2026-101`, etc.) that collide across tenants if seeded twice? `_seed_clinic_records` guards by patient existence (`router.py:509-512`), but refs are not unique-constrained anyway.

### 3.6 Compliance — ❌ Insufficient

- Audit log: clinic mutations never logged (see 3.3).
- `is_signed_off` on lab orders (`models.py:111`) is set by the same user recording the result (`router.py:427-429`) — no separation of duties.
- PII: `national_id`, `phone` stored in plain text (`models.py:21-22`); no encryption-at-rest noted; no masking in API responses.
- No "who-did-what" attribution on patients/encounters/prescriptions (no `created_by`/`updated_by` columns).
- No immutable/signed medical record.

### 3.7 Frontend UX — ⚠️ Mixed

- Single 2,283-line component (`ClinicHealthcarePage.tsx`) — maintainability risk.
- Tabs URL-synced (`?tab=`) (`ClinicHealthcarePage.tsx:459-468`); 5 tabs + 7 modals.
- **Fallback demo data masks failures**: `patients = patientsData.length > 0 ? patientsData : FALLBACK_PATIENTS` (lines 585-590) and summary fallback (592-602). A failed/empty backend renders a populated page, hiding outages.
- Error handling swallows failures into "info" toasts: e.g. `handleCreateAppointment` catch → `toast("info", "تعذر حفظ الموعد...")` (647-650); `handleUpdateApptStatus` (624-626). No retry, no error state.
- No pagination anywhere (patients/appointments/labs/beds all render full lists).
- Search is client-side only (832-873) — no server-side filtering.
- No role gating in UI beyond module presence; no clinical-role checks.
- `isSummaryLoading` used only for auto-seed trigger (605-614); loading states otherwise unused.

### 3.8 API Surface — ❌ Incomplete

Present (clinic):
`GET /clinic/summary`, `GET/POST /clinic/patients`, `GET/POST /clinic/appointments`, `POST /clinic/appointments/{id}/status`, `GET/POST /clinic/encounters`, `GET/POST /clinic/prescriptions`, `POST /clinic/prescriptions/{id}/dispense`, `GET/POST /clinic/lab-orders`, `POST /clinic/lab-orders/{id}/result`, `GET /clinic/beds`, `POST /clinic/beds/{id}/admit|discharge|clean`, `POST /clinic/seed`.

Missing (vs. real hospital):
- Patient: GET-by-id, PUT, DELETE, search, merge/dedupe.
- Appointment: cancel, reschedule, no-show mark, reminders.
- Encounter: GET-by-id, PUT, addendum, attachments.
- Prescription: PUT, cancel, quantity, dispense timestamp/pharmacist.
- Lab: cancel, collect specimen, numeric results + units + critical flags, sign-off by different user.
- Bed: transfer, discharge summary, charge calculation, maintenance status.
- Billing: invoice generation, copay collection, insurance claim submission/status.
- Pharmacy link: dispense should deduct stock + create sale.
- Audit: mutation log endpoints.

---

## 4. Gaps vs. a Real Hospital (Prioritized)

### P0 — Must fix before real use
1. **Billing integration**: consultation fees, bed charges (daily_rate × nights), pharmacy dispensing, and lab tests must generate invoices/sales and post to finance. Money fields are currently decorative. Evidence: `models.py:48,124,30`; `router.py` has no finance/sales calls.
2. **Permission enforcement**: add clinical roles to `core/roles.py` and `schemas/user.py`; enforce `clinic:*` perms in clinic router endpoints (currently none — `router.py` uses only `get_current_user`). Manifest declares `clinic:view/manage/doctor/nurse` (`manifest.json:12`) but nothing consumes them.
3. **Pharmacy dispensing link**: dispense should deduct inventory and create a sale line; clinic Rx and pharmacy drug catalog must be linked. Evidence: `router.py:354-370` only flips status; `pharmacy/router.py:571` decrements batch only.
4. **Insurance claims**: create a claim entity with submission status and copay calculation. Evidence: no claim model/endpoint anywhere.
5. **Referential integrity**: `patient_id` should be a real FK; bed patient should reference patient (not free-text name). Evidence: `models.py:40,59,83,102,126`.
6. **Audit trail**: log all clinical mutations with user attribution. Evidence: `grep audit_log clinic/router.py` = 0.

### P1 — Important
7. Appointment reminders, no-show tracking, reschedule/cancel endpoints.
8. Multi-doctor scheduling, room/clinic assignment, department master.
9. Lab: numeric results with units, critical flags, collection timestamp, sign-off by a different user.
10. Prescription: quantity, dispense timestamp, pharmacist, drug-allergy cross-check.
11. Pagination + server-side search/filter on patients and appointments.
12. `require_module("clinic")` guard on router registration (`api/router.py:96-97` currently unguarded).
13. Tenant-scoped uniqueness for `PharmacyDrug.code` (`pharmacy/models.py:18` global unique).

### P2 — Nice to have
14. Vital-signs trends, growth charts.
15. Consent forms / e-signature.
16. Medical imaging (PACS) integration.
17. Referrals / inter-department transfers.
18. Split `ClinicHealthcarePage.tsx` (2,283 lines) into per-tab components.
19. Remove/limit fallback demo data so backend failures surface.
20. Stop swallowing errors into "info" toasts; add retry/error states.

---

## 5. Concrete Recommendations

1. Wire clinic → sales/finance: on appointment completion create a sale line for `consultation_fee` applying copay; on bed discharge create a charge for `daily_rate × nights`; on lab result sign-off optionally bill.
2. Add clinical RBAC: extend `core/roles.py` (ROLE_LABELS + ROLE_DEFAULT_PERMISSIONS) and `schemas/user.py` `_VALID_ROLES` with doctor/nurse/receptionist/lab_tech/pharmacist/billing; enforce in clinic router via `require_perm`; gate frontend by perm not just module.
3. Add `clinic_insurance_claims` table + submission status + frontend tab.
4. Make `dispense` call pharmacy/inventory to deduct stock and record a sale; link `ClinicPrescription` ↔ `PharmacyPrescription`.
5. Add audit columns (`created_by`, `updated_by`, `updated_at`, `deleted_at`) to all clinic entities and write to `AuditLog`.
6. Add FKs and (where appropriate) soft delete; enforce patient existence on appointment/encounter/Rx/lab creation.
7. Split frontend file into `features/clinic/{Appointments,Patients,EMR,Prescriptions,Labs,Beds}.tsx`; add pagination and server-side search; replace demo fallback with explicit empty/error states.
8. Apply `require_module("clinic")` to router registration and add numeric lab results with units/critical flags and separation of sign-off user.

---

## 6. Appendix — Endpoint Inventory

**Clinic** (`router.py`): summary, patients (GET/POST), appointments (GET/POST, status), encounters (GET/POST), prescriptions (GET/POST, dispense), lab-orders (GET/POST, result), beds (GET, admit/discharge/clean), seed.

**Pharmacy** (`pharmacy/router.py`): summary, drugs (GET/POST, alternatives), batches (GET/POST), prescriptions (GET/POST dispense), controlled (GET), drugs/{id}/alternatives.

**Sales** (`sales.py`): full CRUD-ish with cancel/return/partial-return/items — reference for what clinic lacks (cancel, return, update, delete, pagination with limit/offset).

**Settings** (`settings.py`): store settings, logo upload, theme import — not clinical.

**Conclusion:** The module is a solid, well-tenanted prototype. The single biggest gap is that **money is stored but never posted to the ledger**, and **clinical access is unguarded**, which makes it unusable as a real hospital system until billing integration and RBAC land.
