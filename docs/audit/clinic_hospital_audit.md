# Hospital / Clinic ERP Audit — Mizan (میزان)

**Scope:** `backend/app/modules/clinic/` + `backend/app/modules/clinic/frontend/ClinicHealthcarePage.tsx` + related modules (finance, pharmacy, HR, sales, inventory).
**Audited against:** a real multi-department hospital/clinic workflow (medical, financial, operational, compliance).
**Date:** 2026-11-06.

---

## 1. Executive Summary

The clinic module is a **well-structured, single-tenant-scoped EMR-lite** with realistic demo data and a polished UI. It covers the patient journey from registration → appointment → encounter (vitals + ICD-10) → e-Rx → lab orders → inpatient beds. Tenancy (RLS) is correctly applied on every table.

However, as a **real hospital system it is incomplete**: it has **no billing/invoicing integration**, **no role-based clinical permissions**, **no pharmacy dispensing link**, **no lab result workflow beyond a single field**, **no audit trail**, and **no multi-doctor/multi-department scheduling**. It behaves like a clinic demo, not a production hospital.

**Verdict:** Functional prototype. Needs the gaps in §12 before real hospital use.

---

## 2. Module Overview

- **Manifest id:** `clinic`, category `healthcare`, v1.0.0, badge "Phase 3".
- **Dependencies:** `core`, `inventory`, `finance`.
- **Declared permissions:** `clinic:view`, `clinic:manage`, `clinic:doctor`, `clinic:nurse`.
- **Business types:** clinic, hospital, polyclinic, dental_center.
- **Backend:** `models.py` (7 models), `router.py` (~765 lines, 14 endpoints + seed).
- **Frontend:** `ClinicHealthcarePage.tsx` (~2,290 lines, 5 tabs, 6 modals).

---

## 3. Data Model

| Entity | Key fields | Notes |
|---|---|---|
| `ClinicPatient` (EMR) | MRN, name, national_id, phone, gender, DOB, blood_group, allergies, chronic_conditions, insurance_provider/policy, copay_percent | Good core. No photo, no emergency contact, no next-of-kin, no address. |
| `ClinicAppointment` | ref, patient, doctor, department, date, time_slot, queue_number, status, fee, chief_complaint | No room/clinic assignment, no reminder flag, no no-show tracking. |
| `ClinicEncounter` | ref, patient, doctor, dept, date, vitals (BP/HR/temp/SpO2), chief_complaint, ICD-10 code+desc, notes | Single-encounter; no follow-up linkage, no attachments. |
| `ClinicPrescription` | rx_ref, encounter_ref, patient, doctor, issue_date, medication, dosage, frequency, duration, instructions, status | No quantity, no dispense timestamp, no pharmacist, no drug-interaction check. |
| `ClinicLabOrder` | order_ref, patient, doctor, test_name, category, specimen_barcode, reference_range, result_value, status, signed_off | Single result_value string; no numeric results, no units, no critical flags, no collection timestamp. |
| `ClinicInpatientBed` | bed_code, ward, room_number, bed_type, daily_rate, status, current_patient_name, admission_date | Patient stored as free-text name (not FK to patient); no discharge summary, no bed transfer history. |

**Relationships:** All are `TenantScoped` (RLS enforced). Patient↔Appointment/Encounter/Rx/Lab linked by `patient_id` (string, not FK). Bed↔Patient is a free-text name (weak link). **No foreign keys** between clinic entities — referential integrity relies on application discipline.

---

## 4. API Surface

Endpoints (all tenant-scoped, auth required, **no permission checks**):

| Method | Path | Purpose |
|---|---|---|
| GET | `/clinic/summary` | KPIs (auto-seeds if empty) |
| GET/POST | `/clinic/patients` | List / create (auto-seeds) |
| GET/POST | `/clinic/appointments` | List / create (queue number auto) |
| POST | `/clinic/appointments/{id}/status` | Status update |
| GET/POST | `/clinic/encounters` | List / create |
| GET/POST | `/clinic/prescriptions` | List / create |
| POST | `/clinic/prescriptions/{id}/dispense` | Mark dispensed |
| GET/POST | `/clinic/lab-orders` | List / create |
| POST | `/clinic/lab-orders/{id}/result` | Record result + sign-off |
| GET | `/clinic/beds` | List beds |
| POST | `/clinic/beds/{id}/admit\|discharge\|clean` | Bed lifecycle |
| POST | `/clinic/seed` | Manual seed |

**Missing endpoints:** update/delete patient, search patients, appointment cancellation/reschedule, encounter update, prescription update, lab order cancel, bed transfer, admission/discharge summary, billing/invoice, insurance claim submission.

---

## 5. Frontend

Tabs: `appointments`, `patients`, `emr`, `rx_labs` (rx + labs), `beds`. URL-synced via `?tab=`. Modals: booking, patient, encounter, Rx, lab order, lab result, admit bed. Fallback demo data when API empty. Auto-seed trigger on empty summary.

Strengths: RTL, search filtering, status badges, realistic Arabic demo data, responsive.

Weaknesses: single 2,290-line file; no pagination; no role gating; catch blocks previously reported success on failure (fixed); `isApptsLoading` etc. unused.

---

## 6. Medical Operations Coverage

| Capability | Status |
|---|---|
| Patient registration (EMR) | ✅ |
| Appointment scheduling + queue | ✅ |
| Clinical encounter + vitals + ICD-10 | ✅ |
| e-Prescription (e-Rx) | ✅ basic |
| Lab order + result + sign-off | ✅ basic |
| Inpatient bed management (admit/discharge/clean) | ✅ |
| Allergy/chronic condition tracking | ✅ stored, not enforced |
| Insurance provider & copay | ✅ stored, **not billed** |
| Drug interaction / allergy alerts at prescribing | ❌ |
| Appointment reminders / no-show | ❌ |
| Multi-doctor scheduling / room assignment | ❌ |
| Referrals / transfers between departments | ❌ |
| Vital-signs trends / growth charts | ❌ |
| Medical imaging (PACS) | ❌ |
| Consent forms / e-signature | ❌ |

---

## 7. Financial Operations Coverage

| Capability | Status |
|---|---|
| Consultation fee on appointment | ✅ stored |
| Bed daily_rate | ✅ stored |
| Insurance copay_percent on patient | ✅ stored |
| **Invoice generation from consultation** | ❌ — never creates a sale/invoice |
| **Insurance claim submission** | ❌ — no claim entity, no submission |
| **Copay collection / payment posting** | ❌ |
| **Bed charges accumulation (daily_rate × days)** | ❌ |
| **Link to finance (revenue, GL)** | ❌ |
| **Pharmacy dispensing → inventory deduction** | ❌ — dispense only flips status |
| **Lab billing** | ❌ |

The clinic module stores money-related fields but **never posts them to the finance/sales ledger**. Revenue from consultations, bed occupancy, and pharmacy dispensing is invisible to the financial system.

---

## 8. HR / Staff & Permissions

- **Roles defined:** only `admin, manager, cashier, storekeeper, accountant` (5 generic roles). No clinical roles (doctor, nurse, receptionist, lab tech, pharmacist).
- `_VALID_ROLES` in `schemas/user.py` only allows `admin, manager, cashier` — so `storekeeper` and `accountant` can't even be created via API (validation rejects). **Bug.**
- `required_permissions` in clinic manifest (`clinic:view/manage/doctor/nurse`) are **never checked** — clinic router endpoints use only `get_current_user` + `get_current_tenant_id`, no `require_perm`. Any authenticated tenant user can read/write all clinical data.
- Frontend Guard uses `module="clinic"` (hasModule) only, not perm. So a cashier has full clinical access.
- No doctor-to-department assignment, no shift/roster for clinical staff, no credential/expiry tracking.

---

## 9. Pharmacy & Lab Integration

- Pharmacy module exists (separate) with its own copay logic and FEFO/expiry tracking.
- Clinic e-Rx `dispense` endpoint only flips status — it does **not** call pharmacy to deduct stock or record a sale.
- Lab orders have a specimen barcode and result, but no link to a lab module or external LIS; result is a free-text string.

---

## 10. Audit / Compliance

- All tables are `TenantScoped` (RLS) — good.
- No audit log (who created/modified patient, encounter, prescription). 
- No soft-delete / versioning of medical records.
- No consent / e-signature.
- `is_signed_off` on lab orders exists but is set by the same user recording the result (no separation).
- National ID stored in plain text (acceptable for this scope, but no encryption at rest noted).

---

## 11. Frontend Quality

- Single 2,290-line component (maintainability risk).
- No pagination on patients/appointments/labs/beds.
- Catch blocks previously reported success on API failure — **fixed** (commit `4be6ca3`).
- `isApptsLoading`, `isPatientsLoading`, `isBedsLoading` removed (unused).
- Demo fallback data makes the page look populated even with no backend — good for demos, but masks backend failures.

---

## 12. Gaps vs. a Real Hospital (Prioritized)

### P0 — Must fix before real use
1. **Billing integration:** consultation fees, bed charges (daily_rate × days), pharmacy dispensing, and lab tests must generate invoices/sales and post to finance. Currently money fields are decorative.
2. **Permission enforcement:** add clinical roles (doctor, nurse, receptionist, lab_tech, pharmacist, billing) to `ROLE_LABELS`/`ROLE_DEFAULT_PERMISSIONS` and `_VALID_ROLES`; enforce `clinic:*` perms in router endpoints and frontend Guard.
3. **Pharmacy dispensing link:** dispense should deduct inventory and create a sale line.
4. **Insurance claims:** create a claim entity, copay calculation, submission status.
5. **Referential integrity:** patient_id should be a FK; bed.current_patient should reference patient.

### P1 — Important
6. Appointment reminders, no-show tracking, reschedule/cancel.
7. Multi-doctor scheduling, room/clinic assignment.
8. Lab: numeric results with units, critical flags, collection timestamp, sign-off by a different user.
9. Prescription: quantity, dispense timestamp, pharmacist, drug-allergy cross-check.
10. Audit log for all clinical mutations.
11. Pagination + server-side search/filter on patients and appointments.

### P2 — Nice to have
12. Vital-signs trends, growth charts.
13. Consent forms / e-signature.
14. Medical imaging (PACS) integration.
15. Referrals / inter-department transfers.
16. Split `ClinicHealthcarePage.tsx` into per-tab components.

---

## 13. Recommendations

1. **Wire clinic → sales/finance:** on appointment completion, create a sale line for consultation_fee (applying copay). On bed discharge, create a charge for daily_rate × nights. On lab result sign-off, optionally bill.
2. **Add clinical RBAC:** extend `core/roles.py` and `schemas/user.py` `_VALID_ROLES` with doctor/nurse/receptionist/lab_tech/pharmacist; enforce in clinic router via `require_perm`.
3. **Add `clinic_insurance_claims` table** with submission status, and a frontend tab.
4. **Make `dispense` call pharmacy/inventory** to deduct stock and record a sale.
5. **Add audit columns** (created_by, updated_by, updated_at) to all clinic entities.
6. **Split the frontend file** into `features/clinic/{Appointments,Patients,EMR,Prescriptions,Labs,Beds}.tsx`.

The module is a solid, well-tenanted prototype. The single biggest gap is that **money is stored but never posted to the ledger**, which makes it unusable as a real hospital system until billing integration lands.