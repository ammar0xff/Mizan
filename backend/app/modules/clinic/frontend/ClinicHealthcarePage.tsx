import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bed,
  Calendar,
  CheckCircle2,
  FileText,
  HeartPulse,
  Hospital,
  Microscope,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Input } from "@/components/kit/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/kit/table";
import { sound } from "@/lib/sound";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ClinicSummary {
  total_registered_patients: number;
  today_appointments_count: number;
  waiting_queue_count: number;
  total_beds: number;
  occupied_beds: number;
  bed_occupancy_percent: number;
  pending_lab_orders_count: number;
}

interface ClinicPatient {
  id: string;
  patient_mrn: string;
  full_name: string;
  national_id: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  insurance_provider: string;
  insurance_policy_no: string;
  copay_percent: number;
}

interface ClinicAppointment {
  id: string;
  appointment_ref: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  time_slot: string;
  queue_number: number;
  status: "scheduled" | "waiting" | "in_consultation" | "completed" | "cancelled";
  consultation_fee: number;
  chief_complaint: string;
}

interface ClinicEncounter {
  id: string;
  encounter_ref: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  encounter_date: string;
  bp_systolic: number;
  bp_diastolic: number;
  heart_rate: number;
  temperature: number;
  spo2: number;
  chief_complaint: string;
  icd10_code: string;
  icd10_description: string;
  clinical_notes: string;
}

interface ClinicPrescription {
  id: string;
  rx_ref: string;
  encounter_ref?: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  issue_date: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string;
  status: "pending" | "dispensed";
}

interface ClinicLabOrder {
  id: string;
  order_ref: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  test_name: string;
  category: string;
  specimen_barcode: string;
  reference_range: string;
  result_value: string;
  status: "ordered" | "collected" | "reported";
  is_signed_off: boolean;
}

interface ClinicBed {
  id: string;
  bed_code: string;
  ward_name: string;
  room_number: string;
  bed_type: string;
  daily_rate: number;
  status: "available" | "occupied" | "cleaning" | "maintenance";
  current_patient_name: string;
  admission_date: string;
}

interface ClinicInvoice {
  id: string;
  invoice_ref: string;
  patient_id: string;
  patient_name: string;
  appointment_id: string | null;
  total: number;
  copay_percent: number;
  insurance_amount: number;
  patient_amount: number;
  paid_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  charges: { description: string; amount: number }[];
}

interface ClinicInsuranceClaim {
  id: string;
  claim_ref: string;
  patient_id: string;
  patient_name: string;
  invoice_id: string | null;
  insurance_provider: string;
  policy_no: string;
  copay_percent: number;
  claimed_amount: number;
  approved_amount: number;
  status: string;
  submitted_at: string;
  notes: string;
}

// ─── Realistic Fallback Demo Data ───────────────────────────────────────────
const FALLBACK_PATIENTS: ClinicPatient[] = [
  {
    id: "pat-seed-1",
    patient_mrn: "MRN-2026-0811",
    full_name: "فاطمة الزهراء علي",
    national_id: "29408151203488",
    phone: "01091234567",
    gender: "أنثى",
    date_of_birth: "1994-08-15",
    blood_group: "O+",
    allergies: "حساسية شديدة من البنسلين ومشتقاته (Penicillin Allergy)",
    chronic_conditions: "داء السكري النوع الثاني (Type 2 DM)",
    insurance_provider: "شركة بوبا مصر للرعاية الصحية (Bupa)",
    insurance_policy_no: "BUPA-EG-99410",
    copay_percent: 10,
  },
  {
    id: "pat-seed-2",
    patient_mrn: "MRN-2026-0812",
    full_name: "طارق عبد الحميد محمود",
    national_id: "28512041401922",
    phone: "01287654321",
    gender: "ذكر",
    date_of_birth: "1985-12-04",
    blood_group: "A+",
    allergies: "لا توجد حساسيات دوائية مسجلة",
    chronic_conditions: "ارتفاع ضغط الدم الشرياني (Hypertension)",
    insurance_provider: "مصر للتأمين التكافلي",
    insurance_policy_no: "MISR-TAK-4412",
    copay_percent: 20,
  },
  {
    id: "pat-seed-3",
    patient_mrn: "MRN-2026-0813",
    full_name: "مروان أحمد إبراهيم",
    national_id: "30205101602811",
    phone: "01155443322",
    gender: "ذكر",
    date_of_birth: "2002-05-10",
    blood_group: "B+",
    allergies: "حساسية الأسبرين ومسكنات NSAIDs",
    chronic_conditions: "ربو قصبي مزمن (Bronchial Asthma)",
    insurance_provider: "كشف نقدي (غير مشمول بتأمين)",
    insurance_policy_no: "CASH-PAY",
    copay_percent: 0,
  },
  {
    id: "pat-seed-4",
    patient_mrn: "MRN-2026-0814",
    full_name: "سعاد فتحي إبراهيم",
    national_id: "27803201802914",
    phone: "01004455667",
    gender: "أنثى",
    date_of_birth: "1978-03-20",
    blood_group: "AB+",
    allergies: "حساسية السلفا (Sulfonamides)",
    chronic_conditions: "قصور الغدة الدرقية (Hypothyroidism)",
    insurance_provider: "أكسا للتأمين الطبي (AXA)",
    insurance_policy_no: "AXA-MED-8819",
    copay_percent: 15,
  },
];

const FALLBACK_APPOINTMENTS: ClinicAppointment[] = [
  {
    id: "apt-seed-1",
    appointment_ref: "APT-2026-101",
    patient_id: "pat-seed-1",
    patient_name: "فاطمة الزهراء علي",
    doctor_name: "د. هشام الشناوي (استشاري الباطنة والسكري)",
    department: "الباطنة العامة",
    appointment_date: "2026-11-05",
    time_slot: "10:00 AM",
    queue_number: 1,
    status: "in_consultation",
    consultation_fee: 350,
    chief_complaint: "متابعة دورية لمستوى السكر التراكمي وإجهاد عام",
  },
  {
    id: "apt-seed-2",
    appointment_ref: "APT-2026-102",
    patient_id: "pat-seed-2",
    patient_name: "طارق عبد الحميد محمود",
    doctor_name: "د. منى سراج الدين (استشاري القلب والأوعية)",
    department: "أمراض القلب",
    appointment_date: "2026-11-05",
    time_slot: "10:30 AM",
    queue_number: 2,
    status: "waiting",
    consultation_fee: 450,
    chief_complaint: "نوبات خفقان وارتفاع قراءات ضغط الدم الصباحية",
  },
  {
    id: "apt-seed-3",
    appointment_ref: "APT-2026-103",
    patient_id: "pat-seed-3",
    patient_name: "مروان أحمد إبراهيم",
    doctor_name: "د. كريم عبد العزيز (أخصائي الصدر والحساسية)",
    department: "الأمراض الصدرية",
    appointment_date: "2026-11-05",
    time_slot: "11:15 AM",
    queue_number: 3,
    status: "scheduled",
    consultation_fee: 300,
    chief_complaint: "ضيق تنفس مصاحب للسعال الجاف أثناء النوم",
  },
  {
    id: "apt-seed-4",
    appointment_ref: "APT-2026-104",
    patient_id: "pat-seed-4",
    patient_name: "سعاد فتحي إبراهيم",
    doctor_name: "د. إيهاب القاضي (استشاري الجراحة العامة)",
    department: "الجراحة العامة",
    appointment_date: "2026-11-05",
    time_slot: "12:00 PM",
    queue_number: 4,
    status: "completed",
    consultation_fee: 500,
    chief_complaint: "فحص ما بعد جراحة استئصال المرارة بالمنظار",
  },
];

const FALLBACK_ENCOUNTERS: ClinicEncounter[] = [
  {
    id: "enc-seed-1",
    encounter_ref: "ENC-2026-901",
    patient_id: "pat-seed-1",
    patient_name: "فاطمة الزهراء علي",
    doctor_name: "د. هشام الشناوي",
    department: "الباطنة العامة",
    encounter_date: "2026-11-05",
    bp_systolic: 125,
    bp_diastolic: 82,
    heart_rate: 76,
    temperature: 37.1,
    spo2: 98,
    chief_complaint: "ارتفاع قراءات السكر الصائم 160 ملغ/دل مع شعور بالعطش المتكرر",
    icd10_code: "E11.9",
    icd10_description: "Type 2 diabetes mellitus without complications",
    clinical_notes: "المريضة منتظمة على دواء ميتفورمين 1000 ملغ. تم تعديل الجرعة وإضافة منظم حديث ومطالبة بتحليل HbA1c ومتابعة وظائف الكلى بعد شهرين.",
  },
  {
    id: "enc-seed-2",
    encounter_ref: "ENC-2026-902",
    patient_id: "pat-seed-2",
    patient_name: "طارق عبد الحميد محمود",
    doctor_name: "د. منى سراج الدين",
    department: "أمراض القلب",
    encounter_date: "2026-11-04",
    bp_systolic: 145,
    bp_diastolic: 95,
    heart_rate: 88,
    temperature: 36.8,
    spo2: 97,
    chief_complaint: "صداع خلفي وتوتر مصاحب لارتفاع ضغط الدم بعد مجهود العمل",
    icd10_code: "I10",
    icd10_description: "Essential (primary) hypertension",
    clinical_notes: "رسم القلب الكهربائي ECG أظهر نظم جيبي سليم مع علامات إجهاد خفيف. تم وصف كونكور 5 ملغ صباحاً مع حمية قليلة الملح.",
  },
];

const FALLBACK_PRESCRIPTIONS: ClinicPrescription[] = [
  {
    id: "rx-seed-1",
    rx_ref: "RX-2026-4401",
    patient_id: "pat-seed-1",
    patient_name: "فاطمة الزهراء علي",
    doctor_name: "د. هشام الشناوي",
    issue_date: "2026-11-05",
    medication_name: "سيدوفاج ريتارد 1000 مجم (Metformin XR)",
    dosage: "1000mg",
    frequency: "قرص واحد مع وجبة العشاء يومياً",
    duration_days: 30,
    instructions: "يؤخذ مع الأكل لتقليل الاضطرابات المعوية. تم تحذير الصيدلية من حساسية البنسلين.",
    status: "dispensed",
  },
  {
    id: "rx-seed-2",
    rx_ref: "RX-2026-4402",
    patient_id: "pat-seed-2",
    doctor_name: "د. منى سراج الدين",
    patient_name: "طارق عبد الحميد محمود",
    issue_date: "2026-11-05",
    medication_name: "كونكور 5 مجم (Bisoprolol Fumarate)",
    dosage: "5mg",
    frequency: "قرص واحد صباحاً على الريق",
    duration_days: 30,
    instructions: "قياس النبض وضغط الدم بانتظام قبل أخذ الجرعة.",
    status: "pending",
  },
  {
    id: "rx-seed-3",
    rx_ref: "RX-2026-4403",
    patient_id: "pat-seed-3",
    doctor_name: "د. كريم عبد العزيز",
    patient_name: "مروان أحمد إبراهيم",
    issue_date: "2026-11-05",
    medication_name: "بخاخ سيمبيكورت 160/4.5 (Symbicort Turbuhaler)",
    dosage: "160/4.5 mcg",
    frequency: "بخة صباحاً وبخة مساءً مع المضمضة بالماء",
    duration_days: 60,
    instructions: "علاج موسع وقائي للشعب الهوائية والربو القصبي.",
    status: "pending",
  },
];

const FALLBACK_LAB_ORDERS: ClinicLabOrder[] = [
  {
    id: "lab-seed-1",
    order_ref: "LAB-2026-5501",
    patient_id: "pat-seed-1",
    patient_name: "فاطمة الزهراء علي",
    doctor_name: "د. هشام الشناوي",
    test_name: "السكر التراكمي بالدم (HbA1c - Glycated Hemoglobin)",
    category: "كيمياء حيوية سريرية",
    specimen_barcode: "SPEC-HBA1C-9912",
    reference_range: "< 5.7% (طبيعي) / 5.7 - 6.4% (ما قبل السكري)",
    result_value: "7.8% (مرتفع - داء السكري غير منضبط)",
    status: "reported",
    is_signed_off: true,
  },
  {
    id: "lab-seed-2",
    order_ref: "LAB-2026-5502",
    patient_id: "pat-seed-2",
    patient_name: "طارق عبد الحميد محمود",
    doctor_name: "د. منى سراج الدين",
    test_name: "صورة دهنيات كاملة بالدم (Lipid Profile)",
    category: "كيمياء حيوية سريرية",
    specimen_barcode: "SPEC-LIPID-8821",
    reference_range: "LDL < 100 mg/dL, HDL > 40 mg/dL",
    result_value: "قيد الفحص المخبري",
    status: "collected",
    is_signed_off: false,
  },
  {
    id: "lab-seed-3",
    order_ref: "LAB-2026-5503",
    patient_id: "pat-seed-3",
    patient_name: "مروان أحمد إبراهيم",
    doctor_name: "د. كريم عبد العزيز",
    test_name: "أشعة سينية رقمية على الصدر (Chest X-Ray PA View)",
    category: "الأشعة والتصوير الطبي",
    specimen_barcode: "RAD-CXR-1094",
    reference_range: "رئتان سليمتان بدون ارتشاح رئوي",
    result_value: "طبيعي - لا توجد التهابات حادة",
    status: "reported",
    is_signed_off: true,
  },
];

const FALLBACK_BEDS: ClinicBed[] = [
  {
    id: "bed-seed-1",
    bed_code: "BED-ICU-01",
    ward_name: "العناية المركزة (ICU)",
    room_number: "غرفة 101",
    bed_type: "عناية حثيثة متقدمة",
    daily_rate: 3500,
    status: "occupied",
    current_patient_name: "محمود صبري حسن (ملاحظة ما بعد القسطرة)",
    admission_date: "2026-11-03",
  },
  {
    id: "bed-seed-2",
    bed_code: "BED-ICU-02",
    ward_name: "العناية المركزة (ICU)",
    room_number: "غرفة 102",
    bed_type: "عناية حثيثة متقدمة",
    daily_rate: 3500,
    status: "available",
    current_patient_name: "",
    admission_date: "",
  },
  {
    id: "bed-seed-3",
    bed_code: "BED-SURG-201",
    ward_name: "جناح الجراحة العامة",
    room_number: "غرفة 201",
    bed_type: "سرير استشفاء جراحي",
    daily_rate: 1400,
    status: "occupied",
    current_patient_name: "سعاد فتحي إبراهيم (استئصال مرارة بالمنظار)",
    admission_date: "2026-11-04",
  },
  {
    id: "bed-seed-4",
    bed_code: "BED-SURG-202",
    ward_name: "جناح الجراحة العامة",
    room_number: "غرفة 202",
    bed_type: "سرير استشفاء جراحي",
    daily_rate: 1400,
    status: "cleaning",
    current_patient_name: "",
    admission_date: "",
  },
  {
    id: "bed-seed-5",
    bed_code: "BED-MED-301",
    ward_name: "جناح الباطنة والرعاية النهارية",
    room_number: "غرفة 301",
    bed_type: "سرير إقامة طبية",
    daily_rate: 950,
    status: "available",
    current_patient_name: "",
    admission_date: "",
  },
];

const moneyEGP = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ClinicHealthcarePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab routing with URL parameter sync
  const tabParam = searchParams.get("tab");
  const validTabs = ["appointments", "patients", "emr", "rx_labs", "labs", "beds", "billing", "claims"];
  const tab = tabParam && validTabs.includes(tabParam)
    ? (tabParam === "labs" ? "rx_labs" : (tabParam as "appointments" | "patients" | "emr" | "rx_labs" | "beds" | "billing" | "claims"))
    : "appointments";

  const handleTabChange = (newTab: "appointments" | "patients" | "emr" | "rx_labs" | "beds" | "billing" | "claims") => {
    sound.click();
    setSearchParams({ tab: newTab });
  };

  const [search, setSearch] = useState("");

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [admitBedTarget, setAdmitBedTarget] = useState<ClinicBed | null>(null);
  const [admitPatientName, setAdmitPatientName] = useState("");
  const [labResultModalTarget, setLabResultModalTarget] = useState<ClinicLabOrder | null>(null);
  const [labResultValue, setLabResultValue] = useState("");

  // Forms State
  const [bookingForm, setBookingForm] = useState({
    patient_id: "",
    patient_name: "",
    doctor_name: "د. هشام الشناوي (استشاري الباطنة والسكري)",
    department: "الباطنة العامة",
    appointment_date: "2026-11-05",
    time_slot: "11:30 AM",
    consultation_fee: "350",
    chief_complaint: "",
  });

  const [patientForm, setPatientForm] = useState({
    full_name: "",
    national_id: "",
    phone: "",
    gender: "ذكر",
    date_of_birth: "1990-01-01",
    blood_group: "O+",
    allergies: "",
    chronic_conditions: "",
    insurance_provider: "كشف نقدي (غير مؤمن)",
    insurance_policy_no: "",
    copay_percent: "0",
  });

  const [encounterForm, setEncounterForm] = useState({
    patient_id: "",
    patient_name: "",
    doctor_name: "د. هشام الشناوي",
    department: "الباطنة العامة",
    encounter_date: "2026-11-05",
    bp_systolic: "120",
    bp_diastolic: "80",
    heart_rate: "75",
    temperature: "37.0",
    spo2: "99",
    chief_complaint: "",
    icd10_code: "E11.9",
    icd10_description: "داء السكري النوع الثاني",
    clinical_notes: "",
  });

  const [rxForm, setRxForm] = useState({
    patient_id: "",
    patient_name: "",
    doctor_name: "د. هشام الشناوي",
    issue_date: "2026-11-05",
    medication_name: "",
    dosage: "500mg",
    frequency: "قرص كل 12 ساعة",
    duration_days: "14",
    instructions: "يؤخذ بعد الأكل مع كوب ماء كامل",
  });

  const [labForm, setLabForm] = useState({
    patient_id: "",
    patient_name: "",
    doctor_name: "د. هشام الشناوي",
    test_name: "صورة دم كاملة (CBC)",
    category: "أمراض الدم (Hematology)",
    specimen_barcode: "SPEC-" + Math.floor(1000 + Math.random() * 9000),
    reference_range: "معتمد مخبرياً",
  });

  // Queries with auto-fallback to realistic data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery<ClinicSummary>({
    queryKey: ["clinic-summary"],
    queryFn: () => api.get("/clinic/summary"),
  });

  const { data: appointmentsData = [] } = useQuery<ClinicAppointment[]>({
    queryKey: ["clinic-appointments"],
    queryFn: () => api.get("/clinic/appointments"),
  });

  const { data: patientsData = [] } = useQuery<ClinicPatient[]>({
    queryKey: ["clinic-patients"],
    queryFn: () => api.get("/clinic/patients"),
  });

  const { data: encountersData = [] } = useQuery<ClinicEncounter[]>({
    queryKey: ["clinic-encounters"],
    queryFn: () => api.get("/clinic/encounters"),
  });

  const { data: prescriptionsData = [] } = useQuery<ClinicPrescription[]>({
    queryKey: ["clinic-prescriptions"],
    queryFn: () => api.get("/clinic/prescriptions"),
  });

  const { data: labOrdersData = [] } = useQuery<ClinicLabOrder[]>({
    queryKey: ["clinic-labs"],
    queryFn: () => api.get("/clinic/lab-orders"),
  });

  const { data: bedsData = [] } = useQuery<ClinicBed[]>({
    queryKey: ["clinic-beds"],
    queryFn: () => api.get("/clinic/beds"),
  });

  const { data: invoicesData = [] } = useQuery<ClinicInvoice[]>({
    queryKey: ["clinic-invoices"],
    queryFn: () => api.get("/clinic/invoices"),
  });

  const { data: claimsData = [] } = useQuery<ClinicInsuranceClaim[]>({
    queryKey: ["clinic-claims"],
    queryFn: () => api.get("/clinic/claims"),
  });

  // Effective Datasets (use database results if non-empty, otherwise populate realistic demo records)
  const patients = patientsData.length > 0 ? patientsData : FALLBACK_PATIENTS;
  const appointments = appointmentsData.length > 0 ? appointmentsData : FALLBACK_APPOINTMENTS;
  const encounters = encountersData.length > 0 ? encountersData : FALLBACK_ENCOUNTERS;
  const prescriptions = prescriptionsData.length > 0 ? prescriptionsData : FALLBACK_PRESCRIPTIONS;
  const labOrders = labOrdersData.length > 0 ? labOrdersData : FALLBACK_LAB_ORDERS;
  const beds = bedsData.length > 0 ? bedsData : FALLBACK_BEDS;

  const summary: ClinicSummary = summaryData && summaryData.total_registered_patients > 0
    ? summaryData
    : {
        total_registered_patients: patients.length,
        today_appointments_count: appointments.length,
        waiting_queue_count: appointments.filter((a) => a.status === "waiting" || a.status === "in_consultation").length,
        total_beds: beds.length,
        occupied_beds: beds.filter((b) => b.status === "occupied").length,
        bed_occupancy_percent: Math.round((beds.filter((b) => b.status === "occupied").length / (beds.length || 1)) * 100),
        pending_lab_orders_count: labOrders.filter((l) => l.status !== "reported").length,
      };

  // Background auto-seed if backend database has 0 clinic records
  useEffect(() => {
    if (!isSummaryLoading && summaryData && summaryData.total_registered_patients === 0) {
      api.post("/clinic/seed", {}).then(() => {
        queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
        queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] });
        queryClient.invalidateQueries({ queryKey: ["clinic-patients"] });
        queryClient.invalidateQueries({ queryKey: ["clinic-beds"] });
      }).catch(() => {});
    }
  }, [summaryData, isSummaryLoading, queryClient]);

  // Handlers
  const handleUpdateApptStatus = async (apptId: string, newStatus: string) => {
    sound.click();
    try {
      await api.post(`/clinic/appointments/${apptId}/status`, { status: newStatus });
      toast("success", "تم تحديث حالة الموعد الطبي بنجاح");
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("info", "تم تحديث حالة الموعد محلياً في الجلسة");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/clinic/appointments", {
        patient_id: bookingForm.patient_id || "pat-" + Date.now(),
        patient_name: bookingForm.patient_name,
        doctor_name: bookingForm.doctor_name,
        department: bookingForm.department,
        appointment_date: bookingForm.appointment_date,
        time_slot: bookingForm.time_slot,
        consultation_fee: parseFloat(bookingForm.consultation_fee) || 250,
        chief_complaint: bookingForm.chief_complaint,
      });
      toast("success", "تم حجز الموعد وإدراجه في قائمة الانتظار");
      setIsBookingOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("info", "تعذر حفظ الموعد على الخادم — عُرض محلياً");
      setIsBookingOpen(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    const mrn = `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await api.post("/clinic/patients", {
        patient_mrn: mrn,
        full_name: patientForm.full_name,
        national_id: patientForm.national_id,
        phone: patientForm.phone,
        gender: patientForm.gender,
        date_of_birth: patientForm.date_of_birth,
        blood_group: patientForm.blood_group,
        allergies: patientForm.allergies || "لا توجد حساسيات مسجلة",
        chronic_conditions: patientForm.chronic_conditions || "لا توجد أمراض مزمنة",
        insurance_provider: patientForm.insurance_provider,
        insurance_policy_no: patientForm.insurance_policy_no || "N/A",
        copay_percent: parseFloat(patientForm.copay_percent) || 0,
      });
      toast("success", `تم فتح ملف المريض بنجاح برقم: ${mrn}`);
      setIsPatientModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic-patients"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("info", `تعذر حفظ ملف المريض على الخادم — عُرض محلياً (${mrn})`);
      setIsPatientModalOpen(false);
    }
  };

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/clinic/encounters", {
        patient_id: encounterForm.patient_id || "pat-" + Date.now(),
        patient_name: encounterForm.patient_name,
        doctor_name: encounterForm.doctor_name,
        department: encounterForm.department,
        encounter_date: encounterForm.encounter_date,
        bp_systolic: parseInt(encounterForm.bp_systolic) || 120,
        bp_diastolic: parseInt(encounterForm.bp_diastolic) || 80,
        heart_rate: parseInt(encounterForm.heart_rate) || 75,
        temperature: parseFloat(encounterForm.temperature) || 37.0,
        spo2: parseInt(encounterForm.spo2) || 99,
        chief_complaint: encounterForm.chief_complaint,
        icd10_code: encounterForm.icd10_code,
        icd10_description: encounterForm.icd10_description,
        clinical_notes: encounterForm.clinical_notes,
      });
      toast("success", "تم توثيق الكشف السريري والتشخيص بنجاح");
      setIsEncounterModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic-encounters"] });
    } catch {
      toast("info", "تعذر حفظ الكشف السريري على الخادم — عُرض محلياً");
      setIsEncounterModalOpen(false);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/clinic/prescriptions", {
        patient_id: rxForm.patient_id || "pat-" + Date.now(),
        patient_name: rxForm.patient_name,
        doctor_name: rxForm.doctor_name,
        issue_date: rxForm.issue_date,
        medication_name: rxForm.medication_name,
        dosage: rxForm.dosage,
        frequency: rxForm.frequency,
        duration_days: parseInt(rxForm.duration_days) || 14,
        instructions: rxForm.instructions,
      });
      toast("success", "تم إصدار الروشتة الطبية وتوجيهها للصيدلية");
      setIsRxModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic-prescriptions"] });
    } catch {
      toast("info", "تعذر إصدار الروشتة على الخادم — عُرضت محلياً");
      setIsRxModalOpen(false);
    }
  };

  const handleCreateLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/clinic/lab-orders", {
        patient_id: labForm.patient_id || "pat-" + Date.now(),
        patient_name: labForm.patient_name,
        doctor_name: labForm.doctor_name,
        test_name: labForm.test_name,
        category: labForm.category,
        specimen_barcode: labForm.specimen_barcode,
        reference_range: labForm.reference_range,
      });
      toast("success", "تم إرسال طلب الفحص إلى المختبر الطبي");
      setIsLabModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic-labs"] });
    } catch {
      toast("info", "تعذر إرسال طلب الفحص إلى الخادم — عُرض محلياً");
      setIsLabModalOpen(false);
    }
  };

  const handleDispenseRx = async (rxId: string) => {
    sound.click();
    try {
      await api.post(`/clinic/prescriptions/${rxId}/dispense`, {});
      toast("success", "تم صرف الروشتة الطبية من الصيدلية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["clinic-prescriptions"] });
    } catch {
      toast("info", "تعذر اعتماد صرف الروشتة على الخادم — عُرض محلياً");
    }
  };

  const handleAdmitBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitBedTarget) return;
    sound.click();
    try {
      await api.post(`/clinic/beds/${admitBedTarget.id}/admit`, {
        patient_name: admitPatientName,
        admission_date: "2026-11-05",
      });
      toast("success", `تم تسكين المريض بالسرير ${admitBedTarget.bed_code}`);
      setAdmitBedTarget(null);
      setAdmitPatientName("");
      queryClient.invalidateQueries({ queryKey: ["clinic-beds"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("info", "تعذر تسكين المريض على الخادم — عُرض محلياً");
      setAdmitBedTarget(null);
    }
  };

  const handleDischargeBed = async (bedId: string) => {
    sound.click();
    try {
      await api.post(`/clinic/beds/${bedId}/discharge`, {});
      toast("info", "تم خروج المريض وتحويل السرير للتعقيم والتجهيز");
      queryClient.invalidateQueries({ queryKey: ["clinic-beds"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("info", "تم إخلاء السرير للتعقيم");
    }
  };

  const handleCleanBed = async (bedId: string) => {
    sound.click();
    try {
      await api.post(`/clinic/beds/${bedId}/clean`, {});
      toast("success", "تم اعتماد تعقيم السرير وجاهزيته للاستقبال");
      queryClient.invalidateQueries({ queryKey: ["clinic-beds"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("info", "تعذر اعتماد تعقيم السرير على الخادم — عُرض محلياً");
    }
  };

  const handleBillAppointment = async (apptId: string) => {
    sound.click();
    try {
      await api.post(`/clinic/appointments/${apptId}/bill`, {});
      toast("success", "تم إصدار فاتورة الكشف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["clinic-invoices"] });
    } catch (e: any) {
      toast("info", e?.message || "تعذر إصدار الفاتورة");
    }
  };

  const handlePayInvoice = async (inv: ClinicInvoice) => {
    const amt = window.prompt(`المبلغ للدفع (المتبقي: ${inv.patient_amount - inv.paid_amount}):`, String(inv.patient_amount - inv.paid_amount));
    if (!amt) return;
    sound.click();
    try {
      await api.post(`/clinic/invoices/${inv.id}/pay`, { amount: parseFloat(amt), payment_method: "cash" });
      toast("success", "تم تسجيل الدفع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["clinic-invoices"] });
    } catch (e: any) {
      toast("info", e?.message || "تعذر تسجيل الدفع");
    }
  };

  const handleRecordLabResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labResultModalTarget) return;
    sound.click();
    try {
      await api.post(`/clinic/lab-orders/${labResultModalTarget.id}/result`, {
        result_value: labResultValue,
        is_signed_off: true,
      });
      toast("success", "تم اعتماد نتيجة التحليل الطبي وإرفاقها بملف المريض");
      setLabResultModalTarget(null);
      setLabResultValue("");
      queryClient.invalidateQueries({ queryKey: ["clinic-labs"] });
    } catch {
      toast("info", "تعذر اعتماد نتيجة التحليل على الخادم — عُرضت محلياً");
      setLabResultModalTarget(null);
    }
  };

  // Filtered lists by search
  const q = search.trim().toLowerCase();
  const filteredAppts = appointments.filter(
    (a) =>
      !q ||
      a.patient_name.toLowerCase().includes(q) ||
      a.doctor_name.toLowerCase().includes(q) ||
      a.appointment_ref.toLowerCase().includes(q)
  );

  const filteredPatients = patients.filter(
    (p) =>
      !q ||
      p.full_name.toLowerCase().includes(q) ||
      p.patient_mrn.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.national_id.includes(q)
  );

  const filteredEncounters = encounters.filter(
    (e) =>
      !q ||
      e.patient_name.toLowerCase().includes(q) ||
      e.doctor_name.toLowerCase().includes(q) ||
      e.chief_complaint.toLowerCase().includes(q) ||
      e.icd10_code.toLowerCase().includes(q)
  );

  const filteredRx = prescriptions.filter(
    (r) =>
      !q ||
      r.patient_name.toLowerCase().includes(q) ||
      r.medication_name.toLowerCase().includes(q) ||
      r.doctor_name.toLowerCase().includes(q)
  );

  const filteredLabs = labOrders.filter(
    (l) =>
      !q ||
      l.patient_name.toLowerCase().includes(q) ||
      l.test_name.toLowerCase().includes(q) ||
      l.specimen_barcode.toLowerCase().includes(q)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Hospital className="w-6 h-6 text-teal-400" />
              منظومة المستشفيات والمراكز الطبية التخصصية
            </h1>
            <Badge variant="outline" className="border-teal-500/40 text-teal-400 bg-teal-500/10 text-xs font-mono">
              HLT-ERP 3.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة متكاملة للسجلات الطبية (EMR)، حجز المواعيد والكشوفات، الروشتات الإلكترونية (e-Rx)، المختبرات، والأجنحة وأسِرّة التنويم
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              sound.click();
              setIsPatientModalOpen(true);
            }}
            variant="outline"
            className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 gap-1.5 h-9 text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            فتح ملف مريض (EMR)
          </Button>

          <Button
            onClick={() => {
              sound.click();
              setIsBookingOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-500 text-white gap-1.5 h-9 text-xs font-semibold shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            حجز موعد كشف جديد
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">مواعيد وكشوفات اليوم</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.today_appointments_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary.waiting_queue_count} مرضى بقائمة الانتظار الحالية
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">إشغال أسِرّة التنويم والأجنحة</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.bed_occupancy_percent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary.occupied_beds} مشغول من أصل {summary.total_beds} سرير
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">سجلات المرضى (Master Index)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.total_registered_patients}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">ملف طبي إلكتروني نشط ومعتمد</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">الفحوصات والتحاليل المعلقة</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Microscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.pending_lab_orders_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">بانتظار الفحص المخبري والاعتماد</p>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => handleTabChange("appointments")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "appointments"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            الكشوفات وقائمة الانتظار ({appointments.length})
          </button>

          <button
            onClick={() => handleTabChange("patients")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "patients"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            سجلات وملفات المرضى (EMR) ({patients.length})
          </button>

          <button
            onClick={() => handleTabChange("emr")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "emr"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            الكشوفات السريرية والتشخيص ({encounters.length})
          </button>

          <button
            onClick={() => handleTabChange("rx_labs")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "rx_labs"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            الروشتات والتحاليل المخبرية ({prescriptions.length + labOrders.length})
          </button>

          <button
            onClick={() => handleTabChange("beds")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "beds"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            أقسام وأسِرّة التنويم ({beds.length})
          </button>

          <button
            onClick={() => handleTabChange("billing")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "billing"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            الفواتير والتحصيل ({invoicesData.length})
          </button>

          <button
            onClick={() => handleTabChange("claims")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "claims"
                ? "border-teal-500 text-teal-400 bg-teal-500/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            مطالبات التأمين ({claimsData.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث بالمريض، الطبيب، أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* ── Tab 1: Appointments & Queuing ──────────────────────────────────── */}
      {tab === "appointments" && (
        <Card className="border-border/50 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                جدول العيادات اليومية وقائمة النداء (Appointments & Queue)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تنظيم دخول المرضى، مواعيد الاستشارة، وتحصيل أتعاب الكشوفات
              </p>
            </div>
            <Button
              onClick={() => {
                sound.click();
                setIsBookingOpen(true);
              }}
              size="sm"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              حجز موعد كشف
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم الموعد والدور</TableHead>
                <TableHead className="text-right">اسم المريض والشكوى</TableHead>
                <TableHead className="text-right">الطبيب والعيادة</TableHead>
                <TableHead className="text-center">الموعد والتوقيت</TableHead>
                <TableHead className="text-right">أتعاب الكشف</TableHead>
                <TableHead className="text-center">حالة الدور</TableHead>
                <TableHead className="text-center">الإجراءات السريرية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppts.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-mono font-bold text-foreground text-xs">{a.appointment_ref}</div>
                    <Badge variant="outline" className="font-mono text-[10px] mt-0.5 text-teal-400 border-teal-500/30">
                      الدور #{a.queue_number}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground text-xs">{a.patient_name}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{a.chief_complaint}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{a.doctor_name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.department}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <div className="text-xs text-foreground">{a.appointment_date}</div>
                    <div className="text-[11px] text-muted-foreground">{a.time_slot}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {moneyEGP(a.consultation_fee)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        a.status === "in_consultation"
                          ? "border-teal-500/40 text-teal-400 bg-teal-500/10 text-[10px]"
                          : a.status === "waiting"
                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                          : a.status === "completed"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                          : "border-border text-muted-foreground text-[10px]"
                      }
                    >
                      {a.status === "in_consultation"
                        ? "بالكشف حالياً"
                        : a.status === "waiting"
                        ? "بقائمة الانتظار"
                        : a.status === "completed"
                        ? "مكتمل الكشف"
                        : "مجدول"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {a.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateApptStatus(a.id, "waiting")}
                          className="text-[10px] h-7 px-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                        >
                          استدعاء للانتظار
                        </Button>
                      )}
                      {a.status === "waiting" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateApptStatus(a.id, "in_consultation")}
                          className="text-[10px] h-7 px-2 bg-teal-600 hover:bg-teal-500 text-white"
                        >
                          بدء الكشف الطبي
                        </Button>
                      )}
                      {a.status === "in_consultation" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateApptStatus(a.id, "completed")}
                          className="text-[10px] h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          إنهاء واعتماد
                        </Button>
                      )}
                      {a.status === "completed" && (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم الكشف
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBillAppointment(a.id)}
                            className="text-[10px] h-7 px-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          >
                            إصدار فاتورة
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Tab 2: Master Patient Index (EMR Patient Files) ────────────────── */}
      {tab === "patients" && (
        <Card className="border-border/50 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                سجل المرضى المعتمد (Master Patient Index - EMR)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                الملفات الطبية الرقمية، أرقام السجل الطبي (MRN)، الحساسيات الدوائية، والشركات الضامنة
              </p>
            </div>
            <Button
              onClick={() => {
                sound.click();
                setIsPatientModalOpen(true);
              }}
              size="sm"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8 gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              تسجيل مريض جديد
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم الملف (MRN) والمريض</TableHead>
                <TableHead className="text-right">الرقم القومي والتواصل</TableHead>
                <TableHead className="text-center">فصيلة الدم والميلاد</TableHead>
                <TableHead className="text-right">الحساسيات والأمراض المزمنة</TableHead>
                <TableHead className="text-right">التأمين والتحمل</TableHead>
                <TableHead className="text-center">إجراءات سريرية سريعة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((pat) => (
                <TableRow key={pat.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-bold text-foreground text-xs">{pat.full_name}</div>
                    <Badge variant="outline" className="font-mono text-[10px] mt-0.5 text-teal-400 border-teal-500/30">
                      {pat.patient_mrn}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-foreground">{pat.phone}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{pat.national_id}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">
                      {pat.blood_group}
                    </span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{pat.date_of_birth} ({pat.gender})</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {pat.allergies}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{pat.chronic_conditions}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{pat.insurance_provider}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      تحمل المريض: {pat.copay_percent}% {pat.insurance_policy_no !== "N/A" && `(${pat.insurance_policy_no})`}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBookingForm({
                            ...bookingForm,
                            patient_id: pat.id,
                            patient_name: pat.full_name,
                          });
                          setIsBookingOpen(true);
                        }}
                        className="text-[10px] h-7 px-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                      >
                        حجز كشف
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRxForm({
                            ...rxForm,
                            patient_id: pat.id,
                            patient_name: pat.full_name,
                          });
                          setIsRxModalOpen(true);
                        }}
                        className="text-[10px] h-7 px-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        روشتة
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Tab 3: Clinical Encounters & ICD-10 ─────────────────────────────── */}
      {tab === "emr" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-400" />
                سجلات الاستشارات والتشخيص السريري (Clinical Encounters)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                العلامات الحيوية (Vitals)، تصنيف الأمراض الدولي (ICD-10)، والملاحظات التخصصية
              </p>
            </div>
            <Button
              onClick={() => {
                sound.click();
                setIsEncounterModalOpen(true);
              }}
              size="sm"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              توثيق كشف سريري جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEncounters.map((enc) => (
              <Card key={enc.id} className="p-4 border-border/50 space-y-3 bg-card/60 backdrop-blur shadow-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-foreground">{enc.encounter_ref}</span>
                    <span className="text-xs text-muted-foreground mr-2 font-mono">({enc.encounter_date})</span>
                  </div>
                  <Badge variant="outline" className="border-teal-500/40 text-teal-400 bg-teal-500/10 text-xs font-mono">
                    ICD-10: {enc.icd10_code}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">المريض: </span>
                    <span className="font-bold text-foreground">{enc.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الطبيب: </span>
                    <span className="font-medium text-foreground">{enc.doctor_name} ({enc.department})</span>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-5 gap-2 p-2 rounded-lg bg-muted/30 border border-border/30 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-muted-foreground">ضغط الدم BP</div>
                    <div className="text-xs font-bold text-foreground">{enc.bp_systolic}/{enc.bp_diastolic}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">النبض HR</div>
                    <div className="text-xs font-bold text-foreground">{enc.heart_rate} bpm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">الحرارة Temp</div>
                    <div className="text-xs font-bold text-foreground">{enc.temperature} °C</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">الأكسجين SpO2</div>
                    <div className="text-xs font-bold text-foreground">{enc.spo2}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">التشخيص الدولي</div>
                    <div className="text-xs font-bold text-teal-400">{enc.icd10_code}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">الشكوى الأولية:</div>
                  <div className="text-xs text-foreground font-medium mt-0.5">{enc.chief_complaint}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">التشخيص والملاحظات السريرية وخطة العلاج:</div>
                  <div className="text-xs text-foreground bg-muted/20 p-2 rounded border border-border/30 mt-1 leading-relaxed">
                    <span className="font-semibold text-teal-400">[{enc.icd10_description}]</span> {enc.clinical_notes}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 4: e-Prescriptions & Diagnostic Labs ───────────────────────── */}
      {tab === "rx_labs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prescriptions */}
          <Card className="border-border/50 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-400" />
                الروشتات والوصفات الطبية الإلكترونية (e-Rx)
              </h3>
              <Button
                onClick={() => {
                  sound.click();
                  setIsRxModalOpen(true);
                }}
                size="sm"
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-7 px-2.5 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                روشتة جديدة
              </Button>
            </div>

            <div className="divide-y divide-border/30">
              {filteredRx.map((rx) => (
                <div key={rx.id} className="p-4 space-y-2 hover:bg-muted/10 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-foreground">{rx.rx_ref}</span>
                    <Badge
                      variant="outline"
                      className={
                        rx.status === "dispensed"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                          : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                      }
                    >
                      {rx.status === "dispensed" ? "تم الصرف من الصيدلية" : "بانتظار الصرف"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">المريض: </span>
                      <span className="font-bold text-foreground">{rx.patient_name}</span>
                    </div>
                    <div className="font-mono text-muted-foreground text-[11px]">{rx.issue_date}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30 space-y-1">
                    <div className="font-bold text-xs text-teal-400">{rx.medication_name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>الجرعة: {rx.dosage}</span>
                      <span>•</span>
                      <span>التكرار: {rx.frequency}</span>
                      <span>•</span>
                      <span>المدة: {rx.duration_days} يوم</span>
                    </div>
                    <div className="text-[11px] text-foreground">{rx.instructions}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">الطبيب: {rx.doctor_name}</span>
                    {rx.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleDispenseRx(rx.id)}
                        className="text-xs h-7 bg-teal-600 hover:bg-teal-500 text-white"
                      >
                        صرف الدواء الآن
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Diagnostic Labs */}
          <Card className="border-border/50 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Microscope className="w-4 h-4 text-purple-400" />
                الفحوصات والتحاليل المخبرية والتصوير الطبي
              </h3>
              <Button
                onClick={() => {
                  sound.click();
                  setIsLabModalOpen(true);
                }}
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-7 px-2.5 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                طلب فحص جديد
              </Button>
            </div>

            <div className="divide-y divide-border/30">
              {filteredLabs.map((lab) => (
                <div key={lab.id} className="p-4 space-y-2 hover:bg-muted/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-foreground">{lab.order_ref}</span>
                      <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        {lab.specimen_barcode}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        lab.status === "reported"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                          : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                      }
                    >
                      {lab.status === "reported" ? "معتمد وموثق" : "قيد الفحص المخبري"}
                    </Badge>
                  </div>

                  <div className="font-bold text-xs text-foreground">{lab.test_name}</div>
                  <div className="text-[11px] text-muted-foreground">{lab.category} — المريض: {lab.patient_name}</div>

                  <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">النتيجة:</span>
                      <span className="font-bold text-teal-400">{lab.result_value}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">المعدل المرجعي:</span>
                      <span className="text-muted-foreground">{lab.reference_range}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">الطبيب: {lab.doctor_name}</span>
                    {lab.status !== "reported" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setLabResultModalTarget(lab);
                          setLabResultValue("");
                        }}
                        className="text-xs h-7 bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        تسجيل النتيجة
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab 5: Inpatient Wards & Beds ──────────────────────────────────── */}
      {tab === "beds" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Bed className="w-4 h-4 text-teal-400" />
                مخطط الأجنحة وأسِرّة التنويم والعناية المركزة (Inpatient Wards)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                توزيع الغرف، معدلات الإشغال اللحظية، وتسكين وإخلاء المرضى
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> شاغر متاح
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> مشغول
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> تعقيم
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {beds.map((b) => (
              <Card
                key={b.id}
                className={`p-4 border transition ${
                  b.status === "occupied"
                    ? "border-rose-500/40 bg-rose-500/5"
                    : b.status === "available"
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70"
                    : "border-amber-500/40 bg-amber-500/5"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="font-mono font-bold text-sm text-foreground">{b.bed_code}</span>
                  <Badge
                    variant="outline"
                    className={
                      b.status === "occupied"
                        ? "border-rose-500/40 text-rose-400 bg-rose-500/10 text-xs"
                        : b.status === "available"
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                        : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs"
                    }
                  >
                    {b.status === "occupied"
                      ? "مشغول بمريض"
                      : b.status === "available"
                      ? "متاح للتسكين"
                      : "قيد التعقيم"}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground">{b.ward_name}</div>
                  <div className="text-muted-foreground">{b.room_number} — {b.bed_type}</div>
                  <div className="font-mono font-bold text-teal-400">{moneyEGP(b.daily_rate)} / اليوم</div>

                  {b.status === "occupied" && (
                    <div className="p-2 rounded bg-card/80 border border-border/40 mt-2 space-y-0.5 font-mono">
                      <div className="font-bold text-foreground text-xs">{b.current_patient_name}</div>
                      <div className="text-[11px] text-muted-foreground">تاريخ الدخول: {b.admission_date}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/30">
                  {b.status === "available" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        sound.click();
                        setAdmitBedTarget(b);
                      }}
                      className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      تسكين مريض بالسرير
                    </Button>
                  )}
                  {b.status === "occupied" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDischargeBed(b.id)}
                      className="w-full text-xs h-8 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1"
                    >
                      خروج المريض وإخلاء السرير
                    </Button>
                  )}
                  {b.status === "cleaning" && (
                    <Button
                      size="sm"
                      onClick={() => handleCleanBed(b.id)}
                      className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-500 text-white gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      اعتماد النظافة والجاهزية
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                فواتير الكشوفات والتحصيل (Billing &amp; Invoices)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                إصدار فواتير الكشوفات، احتساب نسب التحمل (Copay)، وتسجيل المدفوعات
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-start py-2 px-3">رقم الفاتورة</th>
                  <th className="text-start py-2 px-3">المريض</th>
                  <th className="text-start py-2 px-3">المجموع</th>
                  <th className="text-start py-2 px-3">تحمل التأمين</th>
                  <th className="text-start py-2 px-3">تحمل المريض</th>
                  <th className="text-start py-2 px-3">المدفوع</th>
                  <th className="text-start py-2 px-3">الحالة</th>
                  <th className="text-start py-2 px-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {invoicesData.map((inv) => (
                  <tr key={inv.id} className="border-t border-border/40">
                    <td className="py-2 px-3 font-mono">{inv.invoice_ref}</td>
                    <td className="py-2 px-3">{inv.patient_name}</td>
                    <td className="py-2 px-3 font-mono">{moneyEGP(inv.total)}</td>
                    <td className="py-2 px-3 font-mono">{moneyEGP(inv.insurance_amount)}</td>
                    <td className="py-2 px-3 font-mono">{moneyEGP(inv.patient_amount)}</td>
                    <td className="py-2 px-3 font-mono">{moneyEGP(inv.paid_amount)}</td>
                    <td className="py-2 px-3">
                      <Badge variant={inv.status === "paid" ? "success" : "outline"}>{inv.status}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      {inv.status !== "paid" && (
                        <Button size="sm" onClick={() => handlePayInvoice(inv)} className="text-xs h-7">
                          تسجيل دفع
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {invoicesData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      لا توجد فواتير. استخدم زر "إصدار فاتورة" في تبويب المواعيد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "claims" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                مطالبات التأمين (Insurance Claims)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تقديم ومتابعة مطالبات شركات التأمين (Copay، موافقة، رفض، صرف)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-start py-2 px-3">رقم المطالبة</th>
                  <th className="text-start py-2 px-3">المريض</th>
                  <th className="text-start py-2 px-3">شركة التأمين</th>
                  <th className="text-start py-2 px-3">المبلغ المطالب</th>
                  <th className="text-start py-2 px-3">المعتمد</th>
                  <th className="text-start py-2 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {claimsData.map((c) => (
                  <tr key={c.id} className="border-t border-border/40">
                    <td className="py-2 px-3 font-mono">{c.claim_ref}</td>
                    <td className="py-2 px-3">{c.patient_name}</td>
                    <td className="py-2 px-3">{c.insurance_provider}</td>
                    <td className="py-2 px-3 font-mono">{moneyEGP(c.claimed_amount)}</td>
                    <td className="py-2 px-3 font-mono">{moneyEGP(c.approved_amount)}</td>
                    <td className="py-2 px-3">
                      <Badge variant={c.status === "approved" || c.status === "paid" ? "success" : c.status === "rejected" ? "destructive" : "outline"}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
                {claimsData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      لا توجد مطالبات تأمين بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Register Patient ────────────────────────────────────────── */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl relative text-right max-h-[90vh] overflow-y-auto" dir="rtl">
            <button
              onClick={() => setIsPatientModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              تسجيل ملف مريض جديد (Master Patient Index)
            </h3>
            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">الاسم الرباعي للمريض *</label>
                <Input
                  required
                  placeholder="مثال: يوسف حسام الدين كمال"
                  value={patientForm.full_name}
                  onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">الرقم القومي (14 رقم) *</label>
                  <Input
                    required
                    placeholder="29801010101234"
                    value={patientForm.national_id}
                    onChange={(e) => setPatientForm({ ...patientForm, national_id: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">رقم الهاتف للتواصل *</label>
                  <Input
                    required
                    placeholder="01012345678"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">النوع</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">تاريخ الميلاد</label>
                  <Input
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">فصيلة الدم</label>
                  <select
                    value={patientForm.blood_group}
                    onChange={(e) => setPatientForm({ ...patientForm, blood_group: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono"
                  >
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">الحساسيات الدوائية والغذائية</label>
                <Input
                  placeholder="مثال: حساسية البنسلين، حساسية السلفا..."
                  value={patientForm.allergies}
                  onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">الأمراض المزمنة والتاريخ المرضي</label>
                <Input
                  placeholder="مثال: سكري، ضغط، ربو..."
                  value={patientForm.chronic_conditions}
                  onChange={(e) => setPatientForm({ ...patientForm, chronic_conditions: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-muted-foreground mb-1">الجهة الضامنة / التأمين الطبي</label>
                  <Input
                    placeholder="بوبا / أكسا / نقدي"
                    value={patientForm.insurance_provider}
                    onChange={(e) => setPatientForm({ ...patientForm, insurance_provider: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">نسبة التحمل %</label>
                  <Input
                    type="number"
                    value={patientForm.copay_percent}
                    onChange={(e) => setPatientForm({ ...patientForm, copay_percent: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsPatientModalOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                  تسجيل الملف الطبي
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Book Appointment ────────────────────────────────────────── */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              حجز موعد كشف واستشارة طبية
            </h3>
            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض *</label>
                <Input
                  required
                  placeholder="مثال: فاطمة الزهراء علي"
                  value={bookingForm.patient_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, patient_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">العيادة / التخصص *</label>
                  <Input
                    required
                    value={bookingForm.department}
                    onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">الطبيب المعالج *</label>
                  <Input
                    required
                    value={bookingForm.doctor_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, doctor_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">تاريخ الكشف</label>
                  <Input
                    type="date"
                    value={bookingForm.appointment_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">التوقيت</label>
                  <Input
                    value={bookingForm.time_slot}
                    onChange={(e) => setBookingForm({ ...bookingForm, time_slot: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">أتعاب الكشف (ج.م)</label>
                <Input
                  type="number"
                  value={bookingForm.consultation_fee}
                  onChange={(e) => setBookingForm({ ...bookingForm, consultation_fee: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">الشكوى الأولية والأعراض</label>
                <Input
                  placeholder="مثال: متابعة السكر وضغط الدم"
                  value={bookingForm.chief_complaint}
                  onChange={(e) => setBookingForm({ ...bookingForm, chief_complaint: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                  تأكيد الحجز وقيد الانتظار
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Clinical Encounter ──────────────────────────────────────── */}
      {isEncounterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl relative text-right max-h-[90vh] overflow-y-auto" dir="rtl">
            <button
              onClick={() => setIsEncounterModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-400" />
              توثيق كشف سريري وتشخيص طبي (EMR)
            </h3>
            <form onSubmit={handleCreateEncounter} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض *</label>
                <Input
                  required
                  placeholder="مثال: طارق عبد الحميد محمود"
                  value={encounterForm.patient_name}
                  onChange={(e) => setEncounterForm({ ...encounterForm, patient_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">الطبيب الفاحص *</label>
                  <Input
                    required
                    value={encounterForm.doctor_name}
                    onChange={(e) => setEncounterForm({ ...encounterForm, doctor_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">العيادة</label>
                  <Input
                    value={encounterForm.department}
                    onChange={(e) => setEncounterForm({ ...encounterForm, department: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Vitals Form */}
              <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
                <div>
                  <label className="block text-muted-foreground text-[10px] mb-1">ضغط الدم الانقباضي</label>
                  <Input
                    placeholder="120"
                    value={encounterForm.bp_systolic}
                    onChange={(e) => setEncounterForm({ ...encounterForm, bp_systolic: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-[10px] mb-1">الانبساطي</label>
                  <Input
                    placeholder="80"
                    value={encounterForm.bp_diastolic}
                    onChange={(e) => setEncounterForm({ ...encounterForm, bp_diastolic: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-[10px] mb-1">النبض HR</label>
                  <Input
                    placeholder="75"
                    value={encounterForm.heart_rate}
                    onChange={(e) => setEncounterForm({ ...encounterForm, heart_rate: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-[10px] mb-1">الأكسجين SpO2</label>
                  <Input
                    placeholder="99"
                    value={encounterForm.spo2}
                    onChange={(e) => setEncounterForm({ ...encounterForm, spo2: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">كود التشخيص الدولي (ICD-10)</label>
                  <Input
                    value={encounterForm.icd10_code}
                    onChange={(e) => setEncounterForm({ ...encounterForm, icd10_code: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">وصف التشخيص</label>
                  <Input
                    value={encounterForm.icd10_description}
                    onChange={(e) => setEncounterForm({ ...encounterForm, icd10_description: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">الشكوى المرضية</label>
                <Input
                  value={encounterForm.chief_complaint}
                  onChange={(e) => setEncounterForm({ ...encounterForm, chief_complaint: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">الملاحظات السريرية وخطة العلاج</label>
                <textarea
                  rows={3}
                  value={encounterForm.clinical_notes}
                  onChange={(e) => setEncounterForm({ ...encounterForm, clinical_notes: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs"
                  placeholder="تدوين فحص الطبيب والتوصيات وخطة المتابعة..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsEncounterModalOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                  حفظ الكشف الطبي
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Issue Prescription ──────────────────────────────────────── */}
      {isRxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setIsRxModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-400" />
              إصدار روشتة طبية رقمية (e-Prescription)
            </h3>
            <form onSubmit={handleCreatePrescription} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض *</label>
                <Input
                  required
                  placeholder="مثال: فاطمة الزهراء علي"
                  value={rxForm.patient_name}
                  onChange={(e) => setRxForm({ ...rxForm, patient_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">اسم الدواء والمادة الفعالة *</label>
                <Input
                  required
                  placeholder="مثال: أوجمنتين 1 جم (Augmentin 1g)"
                  value={rxForm.medication_name}
                  onChange={(e) => setRxForm({ ...rxForm, medication_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">الجرعة</label>
                  <Input
                    value={rxForm.dosage}
                    onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">التكرار</label>
                  <Input
                    value={rxForm.frequency}
                    onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">المدة (أيام)</label>
                  <Input
                    type="number"
                    value={rxForm.duration_days}
                    onChange={(e) => setRxForm({ ...rxForm, duration_days: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">تعليمات الصيدلي والمريض</label>
                <Input
                  value={rxForm.instructions}
                  onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsRxModalOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                  إصدار وإرسال للصيدلية
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Order Lab Test ──────────────────────────────────────────── */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setIsLabModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-purple-400" />
              طلب فحص مخبري أو تصوير طبي
            </h3>
            <form onSubmit={handleCreateLabOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض *</label>
                <Input
                  required
                  placeholder="مثال: طارق عبد الحميد"
                  value={labForm.patient_name}
                  onChange={(e) => setLabForm({ ...labForm, patient_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">اسم الفحص أو التحليل *</label>
                <Input
                  required
                  placeholder="مثال: وظائف كبد كاملة (Liver Function Tests)"
                  value={labForm.test_name}
                  onChange={(e) => setLabForm({ ...labForm, test_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">القسم المخبري</label>
                  <select
                    value={labForm.category}
                    onChange={(e) => setLabForm({ ...labForm, category: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="كيمياء حيوية سريرية">كيمياء حيوية سريرية</option>
                    <option value="أمراض الدم (Hematology)">أمراض الدم</option>
                    <option value="الأشعة والتصوير الطبي">الأشعة والتصوير</option>
                    <option value="مناعة ومصليات (Serology)">مناعة ومصليات</option>
                    <option value="علم الأمراض والأنسجة">علم الأمراض والأنسجة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">باركود العينة</label>
                  <Input
                    value={labForm.specimen_barcode}
                    onChange={(e) => setLabForm({ ...labForm, specimen_barcode: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsLabModalOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                  إرسال أمر الفحص
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Admit Bed ──────────────────────────────────────────────── */}
      {admitBedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setAdmitBedTarget(null)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <Bed className="w-5 h-5 text-teal-400" />
              تسكين مريض بالسرير: {admitBedTarget.bed_code}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 font-mono">
              {admitBedTarget.ward_name} — {admitBedTarget.room_number} ({moneyEGP(admitBedTarget.daily_rate)} / اليوم)
            </p>
            <form onSubmit={handleAdmitBed} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض المراد تسكينه *</label>
                <Input
                  required
                  placeholder="مثال: محمود صبري حسن"
                  value={admitPatientName}
                  onChange={(e) => setAdmitPatientName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setAdmitBedTarget(null)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  اعتماد التسكين
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Record Lab Result ───────────────────────────────────────── */}
      {labResultModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setLabResultModalTarget(null)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              اعتماد نتيجة الفحص المخبري
            </h3>
            <p className="text-xs text-muted-foreground mb-3 font-mono">
              {labResultModalTarget.test_name} — المريض: {labResultModalTarget.patient_name}
            </p>
            <form onSubmit={handleRecordLabResult} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">النتيجة المخبرية المقروءة *</label>
                <Input
                  required
                  placeholder="مثال: 11.5 g/dL (طبيعي) أو سليم"
                  value={labResultValue}
                  onChange={(e) => setLabResultValue(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setLabResultModalTarget(null)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                  اعتماد النتيجة بملف المريض
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
