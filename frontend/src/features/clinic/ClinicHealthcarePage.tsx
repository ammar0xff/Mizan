import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  Microscope,
  Pill,
  Search,
  Stethoscope,
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
import { Skeleton } from "@/components/kit/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/kit/table";
import { sound } from "@/lib/sound";

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

const moneyEGP = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export default function ClinicHealthcarePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<"appointments" | "emr" | "rx_labs" | "beds">("appointments");
  const [search, setSearch] = useState("");

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [admitBedTarget, setAdmitBedTarget] = useState<ClinicBed | null>(null);
  const [admitPatientName, setAdmitPatientName] = useState("");

  // Appointment Form
  const [bookingForm, setBookingForm] = useState({
    patient_name: "",
    doctor_name: "د. هشام الشناوي (استشاري الباطنة)",
    department: "الباطنة العامة",
    appointment_date: "2026-11-02",
    time_slot: "11:30 AM",
    consultation_fee: "350",
    chief_complaint: "",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<ClinicSummary>({
    queryKey: ["clinic-summary"],
    queryFn: () => api.get("/clinic/summary"),
  });

  const { data: appointments = [], isLoading: isApptsLoading } = useQuery<ClinicAppointment[]>({
    queryKey: ["clinic-appointments"],
    queryFn: () => api.get("/clinic/appointments"),
  });

  const { data: patients = [] } = useQuery<ClinicPatient[]>({
    queryKey: ["clinic-patients"],
    queryFn: () => api.get("/clinic/patients"),
  });

  const { data: encounters = [] } = useQuery<ClinicEncounter[]>({
    queryKey: ["clinic-encounters"],
    queryFn: () => api.get("/clinic/encounters"),
  });

  const { data: prescriptions = [] } = useQuery<ClinicPrescription[]>({
    queryKey: ["clinic-prescriptions"],
    queryFn: () => api.get("/clinic/prescriptions"),
  });

  const { data: labOrders = [] } = useQuery<ClinicLabOrder[]>({
    queryKey: ["clinic-labs"],
    queryFn: () => api.get("/clinic/lab-orders"),
  });

  const { data: beds = [], isLoading: isBedsLoading } = useQuery<ClinicBed[]>({
    queryKey: ["clinic-beds"],
    queryFn: () => api.get("/clinic/beds"),
  });

  // Actions
  const handleUpdateApptStatus = async (apptId: string, newStatus: string) => {
    sound.click();
    try {
      await api.post(`/clinic/appointments/${apptId}/status`, { status: newStatus });
      toast("success", "تم تحديث حالة الموعد الطبي بنجاح");
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("error", "تعذر تحديث حالة الموعد");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/clinic/appointments", {
        patient_id: "pat-" + Date.now(),
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
      setBookingForm({
        patient_name: "",
        doctor_name: "د. هشام الشناوي (استشاري الباطنة)",
        department: "الباطنة العامة",
        appointment_date: "2026-11-02",
        time_slot: "11:30 AM",
        consultation_fee: "350",
        chief_complaint: "",
      });
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("error", "تعذر تسجيل الموعد الطبي");
    }
  };

  const handleDispenseRx = async (rxId: string) => {
    sound.click();
    try {
      await api.post(`/clinic/prescriptions/${rxId}/dispense`, {});
      toast("success", "تم صرف الروشتة الطبية من الصيدلية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["clinic-prescriptions"] });
    } catch {
      toast("error", "تعذر صرف الروشتة");
    }
  };

  const handleAdmitBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitBedTarget) return;
    sound.click();
    try {
      await api.post(`/clinic/beds/${admitBedTarget.id}/admit`, {
        patient_name: admitPatientName,
        admission_date: "2026-11-02",
      });
      toast("success", `تم تسكين المريض بالسرير ${admitBedTarget.bed_code}`);
      setAdmitBedTarget(null);
      setAdmitPatientName("");
      queryClient.invalidateQueries({ queryKey: ["clinic-beds"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-summary"] });
    } catch {
      toast("error", "تعذر تسكين المريض");
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
      toast("error", "تعذر تسجيل خروج المريض");
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
      toast("error", "تعذر اعتماد نظافة السرير");
    }
  };

  const filteredAppts = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      a.appointment_ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              العيادات والمراكز الطبية والمستشفيات
            </h1>
            <Badge variant="outline" className="border-teal-500/40 text-teal-400 bg-teal-500/10 text-xs">
              HLT-01..12
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            السجلات الطبية EMR، حجز المواعيد والكشوفات، الروشتات الرقمية e-Rx، الفحوصات، وأسِرّة التنويم والأجنحة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              sound.click();
              setIsBookingOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-500 text-white gap-2 h-9 text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            حجز موعد كشف جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">مواعيد وكشوفات اليوم</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.today_appointments_count || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary?.waiting_queue_count || 0} مرضى بقائمة الانتظار الحالية
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">إشغال أسِرّة التنويم والمستشفى</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.bed_occupancy_percent || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary?.occupied_beds || 0} مشغول من أصل {summary?.total_beds || 0} سرير
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">سجلات المرضى (EMR Files)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.total_registered_patients || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">ملف إلكتروني نشط ومعتمد</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">الفحوصات والتحاليل المعلقة</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Microscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.pending_lab_orders_count || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">بانتظار نتائج المختبر والأشعة</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.click();
              setTab("appointments");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "appointments"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الكشوفات وقائمة الانتظار (Appointments)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("emr");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "emr"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            السجلات الطبية والتشخيص (EMR Charts)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("rx_labs");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "rx_labs"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الروشتات والفحوصات (e-Rx & Labs)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("beds");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "beds"
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            أقسام وأسِرّة التنويم (Wards & Beds)
          </button>
        </div>

        <div className="relative w-64 pb-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث بالمريض أو الطبيب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Appointments & Queuing */}
      {tab === "appointments" && (
        <Card className="border-border/50">
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
              {isApptsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAppts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد مواعيد كشوفات مسجلة حالياً
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppts.map((appt) => (
                  <TableRow key={appt.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-sm">{appt.appointment_ref}</div>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        دور رقم #{appt.queue_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">{appt.patient_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{appt.chief_complaint}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground text-sm">{appt.doctor_name}</div>
                      <div className="text-xs text-muted-foreground">{appt.department}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <div className="text-foreground">{appt.appointment_date}</div>
                      <div className="text-muted-foreground">{appt.time_slot}</div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(appt.consultation_fee)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          appt.status === "completed"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                            : appt.status === "in_consultation"
                            ? "border-blue-500/40 text-blue-400 bg-blue-500/10 text-xs"
                            : appt.status === "waiting"
                            ? "border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs"
                            : "border-border text-muted-foreground text-xs"
                        }
                      >
                        {appt.status === "completed"
                          ? "اكتمل الكشف"
                          : appt.status === "in_consultation"
                          ? "داخل العيادة"
                          : appt.status === "waiting"
                          ? "بانتظار الدخول"
                          : "مجدول"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {appt.status === "waiting" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateApptStatus(appt.id, "in_consultation")}
                            className="text-xs h-7 px-2.5 bg-blue-600 hover:bg-blue-500 text-white gap-1"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            دخول للطبيب
                          </Button>
                        )}
                        {appt.status === "in_consultation" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateApptStatus(appt.id, "completed")}
                            className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            إنهاء الكشف
                          </Button>
                        )}
                        {appt.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateApptStatus(appt.id, "waiting")}
                            className="text-xs h-7 px-2.5 border-border gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            تسجيل وصول
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Patients & EMR Longitudinal Records */}
      {tab === "emr" && (
        <div className="space-y-6">
          <Card className="border-border/50">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                سجل المرضى المعتمد (Master Patient Index)
              </h3>
              <Badge variant="outline" className="font-mono text-xs">
                {patients.length} مرضى
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-right">رقم الملف (MRN) والمريض</TableHead>
                  <TableHead className="text-right">الرقم القومي والتواصل</TableHead>
                  <TableHead className="text-center">فصيلة الدم والسن</TableHead>
                  <TableHead className="text-right">الحساسيات والأمراض المزمنة</TableHead>
                  <TableHead className="text-right">التأمين الطبي والتحمل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((pat) => (
                  <TableRow key={pat.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-bold text-foreground text-sm">{pat.full_name}</div>
                      <Badge variant="outline" className="font-mono text-[10px] mt-0.5">
                        {pat.patient_mrn}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-foreground">{pat.phone}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{pat.national_id}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
                        {pat.blood_group}
                      </span>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{pat.date_of_birth}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-red-400 font-medium">{pat.allergies}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{pat.chronic_conditions}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{pat.insurance_provider}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        تحمل المريض: {pat.copay_percent}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Clinical Encounters List */}
          <Card className="border-border/50 p-5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              الزيارات السريرية والتشخيص المعتمد (ICD-10 Encounters)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {encounters.map((enc) => (
                <div
                  key={enc.id}
                  className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 cursor-pointer hover:border-teal-500/50 transition"
                  onClick={() => toast("info", `زيارة ${enc.encounter_ref} - المريض: ${enc.patient_name}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{enc.encounter_ref}</span>
                    <Badge variant="outline" className="border-teal-500/40 text-teal-400 bg-teal-500/10 text-xs">
                      كود ICD-10: {enc.icd10_code}
                    </Badge>
                  </div>

                  <div className="text-sm font-semibold text-foreground">
                    المريض: {enc.patient_name} — {enc.doctor_name}
                  </div>

                  {/* Vitals Ribbon */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono p-2 rounded-lg bg-card/70 border border-border/40">
                    <div>
                      <div className="text-muted-foreground text-[10px]">الضغط BP</div>
                      <div className="font-bold text-foreground">
                        {enc.bp_systolic}/{enc.bp_diastolic}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">النبض HR</div>
                      <div className="font-bold text-foreground">{enc.heart_rate} bpm</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">الحرارة Temp</div>
                      <div className="font-bold text-foreground">{enc.temperature}°C</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">الأكسجين SpO2</div>
                      <div className="font-bold text-foreground">{enc.spo2}%</div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="text-foreground font-semibold">التشخيص: </span>
                    {enc.icd10_description}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Prescriptions (e-Rx) & Diagnostic Labs */}
      {tab === "rx_labs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prescriptions */}
          <Card className="p-5 border-border/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base">الروشتات الرقمية والجرعات (e-Rx)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {prescriptions.length} روشتة
              </Badge>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{rx.rx_ref}</span>
                    <Badge
                      variant="outline"
                      className={
                        rx.status === "dispensed"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                          : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs"
                      }
                    >
                      {rx.status === "dispensed" ? "تم الصرف من الصيدلية" : "بانتظار الصرف"}
                    </Badge>
                  </div>

                  <div className="text-sm font-bold text-foreground">{rx.medication_name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    الجرعة: {rx.dosage} — التكرار: {rx.frequency} — المدة: {rx.duration_days} يوم
                  </div>
                  <div className="text-xs text-muted-foreground">المريض: {rx.patient_name} — الطبيب: {rx.doctor_name}</div>

                  {rx.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleDispenseRx(rx.id)}
                      className="w-full mt-2 text-xs h-7 bg-purple-600 hover:bg-purple-500 text-white gap-1"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      تأكيد صرف الروشتة الآن
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Diagnostic Labs */}
          <Card className="p-5 border-border/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">الفحوصات المعملية والأشعة (Lab Orders)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {labOrders.length} فحص
              </Badge>
            </div>

            <div className="space-y-3">
              {labOrders.map((lab) => (
                <div key={lab.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{lab.order_ref}</span>
                    <Badge variant="outline" className="font-mono text-[10px] border-blue-500/30 text-blue-400">
                      باركود العينة: {lab.specimen_barcode}
                    </Badge>
                  </div>

                  <div className="text-sm font-bold text-foreground">{lab.test_name}</div>
                  <div className="text-xs text-muted-foreground">التصنيف: {lab.category}</div>

                  <div className="p-2 rounded bg-card/70 border border-border/40 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">النتيجة:</span>
                      <span className="font-bold text-foreground">{lab.result_value}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">المعدل الطبيعي:</span>
                      <span className="text-muted-foreground">{lab.reference_range}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>المريض: {lab.patient_name}</span>
                    {lab.is_signed_off && (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        معتمد من الطبيب
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Inpatient Wards & Beds */}
      {tab === "beds" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Bed className="w-5 h-5 text-teal-400" />
              مخطط الغرف وأسِرّة التنويم والأجنحة (Ward Floor Plan)
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> شاغر متاح
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> مشغول بمريض
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> تعقيم وتجهيز
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isBedsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-5 border-border/50">
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))
            ) : (
              beds.map((b) => (
                <Card
                  key={b.id}
                  className={`p-4 border transition ${
                    b.status === "occupied"
                      ? "border-rose-500/40 bg-rose-500/5"
                      : b.status === "available"
                      ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500"
                      : "border-amber-500/40 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-mono font-bold text-base text-foreground">{b.bed_code}</span>
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
                        ? "مشغول"
                        : b.status === "available"
                        ? "متاح للتسكين"
                        : "تعقيم وتجهيز"}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="font-semibold text-foreground">{b.ward_name}</div>
                    <div className="text-muted-foreground">{b.room_number} — {b.bed_type}</div>
                    <div className="font-mono font-bold text-foreground">{moneyEGP(b.daily_rate)} / يوم</div>

                    {b.status === "occupied" && (
                      <div className="p-2 rounded bg-card/80 border border-border/40 mt-2 space-y-0.5 font-mono">
                        <div className="font-bold text-foreground">{b.current_patient_name}</div>
                        <div className="text-[11px] text-muted-foreground">تاريخ الدخول: {b.admission_date}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2">
                    {b.status === "available" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          sound.click();
                          setAdmitBedTarget(b);
                        }}
                        className="w-full text-xs h-7 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
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
                        className="w-full text-xs h-7 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1"
                      >
                        خروج المريض وتفريغ
                      </Button>
                    )}
                    {b.status === "cleaning" && (
                      <Button
                        size="sm"
                        onClick={() => handleCleanBed(b.id)}
                        className="w-full text-xs h-7 bg-amber-600 hover:bg-amber-500 text-white gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        اعتماد النظافة والجاهزية
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              حجز موعد كشف واستشارة طبية
            </h3>
            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض ثلاثي *</label>
                <Input
                  required
                  placeholder="مثال: مروان أحمد إبراهيم"
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
                  <label className="block text-muted-foreground mb-1">التوقيت التقريبي</label>
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
                  placeholder="مثال: سعال جاف وضيق تنفس مستمر"
                  value={bookingForm.chief_complaint}
                  onChange={(e) => setBookingForm({ ...bookingForm, chief_complaint: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-teal-600 hover:bg-teal-500 text-white">
                  تأكيد الحجز والدور
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bed Admit Modal */}
      {admitBedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setAdmitBedTarget(null)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Bed className="w-5 h-5 text-teal-400" />
              تسكين مريض بالسرير: {admitBedTarget.bed_code}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {admitBedTarget.ward_name} — {admitBedTarget.room_number} ({moneyEGP(admitBedTarget.daily_rate)}/يوم)
            </p>
            <form onSubmit={handleAdmitBed} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم المريض *</label>
                <Input
                  required
                  placeholder="مثال: طارق عبد الحميد محمود"
                  value={admitPatientName}
                  onChange={(e) => setAdmitPatientName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setAdmitBedTarget(null)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-teal-600 hover:bg-teal-500 text-white">
                  اعتماد التسكين
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
