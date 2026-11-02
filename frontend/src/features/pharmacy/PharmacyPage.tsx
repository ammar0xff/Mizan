/**
 * PAGE CONTRACT
 * Page: الصيدلية والروشتات وتتبع الصلاحيات (/pharmacy)
 * Archetype: Clinical Pharmacy Management & FEFO Dispensing Console
 * User: الصيدلي، مدير الصيدلية، كاشير الصرف، أو مفتش التفتيش الصيدلي
 * Primary information: دليل الأدوية والبدائل الجنيسة → صرف الروشتات ونسب التأمين → تشغيلات FEFO → دفتر الأدوية المراقبة
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status chips)
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Modal, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { moneyEGP } from "@/lib/format";
import { sound } from "@/lib/sound";
import {
  PharmacyPrescriptionReceiptModal,
  type PharmacyReceiptData,
} from "@/features/modules/SpecializedReceiptModals";

interface PharmacySummary {
  total_drugs: number;
  total_batches: number;
  near_expiry_count: number;
  total_prescriptions: number;
  controlled_entries: number;
}

interface DrugItem {
  id: string;
  code: string;
  trade_name: string;
  scientific_name: string;
  dosage_form: string;
  strength: string;
  barcode: string | null;
  unit_price: number;
  is_controlled: boolean;
  requires_prescription: boolean;
  notes: string | null;
  total_stock: number;
  alternatives_count: number;
}

interface GenericAlternative {
  id: string;
  code: string;
  trade_name: string;
  scientific_name: string;
  dosage_form: string;
  strength: string;
  unit_price: number;
  price_diff: number;
  price_diff_percent: number;
  total_stock: number;
  in_stock: boolean;
}

interface GenericAlternativesResponse {
  original_drug: {
    id: string;
    trade_name: string;
    scientific_name: string;
    unit_price: number;
  };
  alternatives: GenericAlternative[];
}

interface BatchItem {
  id: string;
  drug_id: string;
  drug_trade_name: string;
  drug_scientific_name: string;
  batch_number: string;
  expiry_date: string;
  days_to_expiry: number;
  quantity_on_hand: number;
  purchase_cost: number;
  supplier_name: string | null;
  status: "active" | "warning" | "expired";
}

interface PrescriptionItem {
  id: string;
  rx_number: string;
  patient_name: string;
  patient_phone: string | null;
  doctor_name: string;
  doctor_license: string | null;
  diagnosis: string | null;
  insurance_company: string | null;
  copay_percentage: number;
  total_amount: number;
  patient_paid: number;
  insurance_covered: number;
  status: string;
  created_at: string;
}

interface ControlledLogItem {
  id: string;
  timestamp: string;
  drug_trade_name: string;
  scientific_name: string;
  batch_number: string;
  patient_name: string;
  patient_national_id: string;
  prescriber_doctor: string;
  doctor_license: string | null;
  quantity: number;
  transaction_type: string;
  notes: string | null;
}

export default function PharmacyPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"formulary" | "dispensing" | "batches" | "controlled">("formulary");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterControlled, setFilterControlled] = useState(false);

  // Modals state
  const [isAddDrugOpen, setIsAddDrugOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);
  const [selectedDrugForAlt, setSelectedDrugForAlt] = useState<DrugItem | null>(null);
  const [receiptData, setReceiptData] = useState<PharmacyReceiptData | null>(null);

  // Form states: New Drug
  const [newDrug, setNewDrug] = useState({
    code: "",
    trade_name: "",
    scientific_name: "",
    dosage_form: "أقراص",
    strength: "",
    barcode: "",
    unit_price: 0,
    is_controlled: false,
    requires_prescription: false,
    notes: "",
  });

  // Form states: New Batch
  const [newBatch, setNewBatch] = useState({
    drug_id: "",
    batch_number: "",
    expiry_date: "",
    quantity: 100,
    purchase_cost: 0,
    supplier_name: "",
  });

  // Form states: Dispense RX
  const [dispenseForm, setDispenseForm] = useState({
    patient_name: "",
    patient_phone: "",
    doctor_name: "",
    doctor_license: "",
    diagnosis: "",
    insurance_company: "",
    copay_percentage: 20,
    drug_id: "",
    quantity: 1,
    patient_national_id: "",
  });

  // Queries
  const summaryQuery = useQuery({
    queryKey: ["pharmacy-summary"],
    queryFn: () => api.get<PharmacySummary>("/pharmacy/summary"),
  });

  const drugsQuery = useQuery({
    queryKey: ["pharmacy-drugs", searchQuery, filterControlled],
    queryFn: () =>
      api.get<DrugItem[]>("/pharmacy/drugs", {
        q: searchQuery || undefined,
        controlled_only: filterControlled ? "true" : undefined,
      }),
  });

  const alternativesQuery = useQuery({
    queryKey: ["pharmacy-alternatives", selectedDrugForAlt?.id],
    queryFn: () =>
      api.get<GenericAlternativesResponse>(`/pharmacy/drugs/${selectedDrugForAlt?.id}/alternatives`),
    enabled: !!selectedDrugForAlt,
  });

  const batchesQuery = useQuery({
    queryKey: ["pharmacy-batches"],
    queryFn: () => api.get<BatchItem[]>("/pharmacy/batches"),
    enabled: activeTab === "batches",
  });

  const prescriptionsQuery = useQuery({
    queryKey: ["pharmacy-prescriptions"],
    queryFn: () => api.get<PrescriptionItem[]>("/pharmacy/prescriptions"),
    enabled: activeTab === "dispensing",
  });

  const controlledLogQuery = useQuery({
    queryKey: ["pharmacy-controlled-log"],
    queryFn: () => api.get<ControlledLogItem[]>("/pharmacy/controlled-log"),
    enabled: activeTab === "controlled",
  });

  // Mutations
  const createDrugMutation = useMutation({
    mutationFn: (data: typeof newDrug) => api.post("/pharmacy/drugs", data),
    onSuccess: () => {
      sound.success();
      toast("success", "تم تسجيل الدواء بنجاح في الدليل الدوائي");
      setIsAddDrugOpen(false);
      setNewDrug({
        code: "",
        trade_name: "",
        scientific_name: "",
        dosage_form: "أقراص",
        strength: "",
        barcode: "",
        unit_price: 0,
        is_controlled: false,
        requires_prescription: false,
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-drugs"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-summary"] });
    },
    onError: (err: any) => {
      sound.error();
      toast("error", err.message || "فشل تسجيل الدواء");
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: (data: typeof newBatch) => api.post("/pharmacy/batches", data),
    onSuccess: () => {
      sound.success();
      toast("success", "تم توريد التشغيلة وتسجيل تاريخ الصلاحية بنجاح");
      setIsAddBatchOpen(false);
      setNewBatch({
        drug_id: "",
        batch_number: "",
        expiry_date: "",
        quantity: 100,
        purchase_cost: 0,
        supplier_name: "",
      });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-batches"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-drugs"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-summary"] });
    },
    onError: (err: any) => {
      sound.error();
      toast("error", err.message || "فشل تسجيل التشغيلة");
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: (data: typeof dispenseForm) =>
      api.post<any>("/pharmacy/prescriptions/dispense", data),
    onSuccess: (res) => {
      sound.success();
      toast("success", "تم صرف التذكرة بنجاح وخصم الرصيد وفق بروتوكول FEFO");
      setIsDispenseOpen(false);

      const selDrug = drugsQuery.data?.find((d) => d.id === dispenseForm.drug_id);
      setReceiptData({
        rx_number: res.rx_number || "RX-2026-NEW",
        patient_name: dispenseForm.patient_name,
        patient_phone: dispenseForm.patient_phone || undefined,
        patient_national_id: dispenseForm.patient_national_id || undefined,
        doctor_name: dispenseForm.doctor_name,
        doctor_license: dispenseForm.doctor_license || undefined,
        diagnosis: dispenseForm.diagnosis || undefined,
        insurance_company: dispenseForm.insurance_company || undefined,
        copay_percentage: Number(dispenseForm.copay_percentage),
        total_amount: res.total_amount || 0,
        patient_paid: res.patient_paid || 0,
        insurance_covered: res.insurance_covered || 0,
        drug_trade_name: selDrug?.trade_name || "دواء علاجي",
        scientific_name: selDrug?.scientific_name,
        batch_number: res.allocated_batches?.[0]?.batch_number,
        quantity: Number(dispenseForm.quantity),
        unit_price: selDrug?.unit_price || 0,
        is_controlled: selDrug?.is_controlled,
      });

      setDispenseForm({
        patient_name: "",
        patient_phone: "",
        doctor_name: "",
        doctor_license: "",
        diagnosis: "",
        insurance_company: "",
        copay_percentage: 20,
        drug_id: "",
        quantity: 1,
        patient_national_id: "",
      });

      queryClient.invalidateQueries({ queryKey: ["pharmacy-prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-drugs"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-batches"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-controlled-log"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-summary"] });
    },
    onError: (err: any) => {
      sound.error();
      toast("error", err.message || "فشل صرف التذكرة الدوائية");
    },
  });

  const summary = summaryQuery.data;

  // Selected drug details during dispense for auto calculations
  const currentSelectedDrug = drugsQuery.data?.find((d) => d.id === dispenseForm.drug_id);
  const calculatedTotal = (currentSelectedDrug?.unit_price || 0) * (dispenseForm.quantity || 1);
  const calculatedPatientPaid = calculatedTotal * (dispenseForm.copay_percentage / 100);
  const calculatedInsurance = calculatedTotal - calculatedPatientPaid;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
            <Pill className="size-4" />
            <span>نظام الصيدليات وإدارة الأدوية السريرية (PHA-01..12)</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            الصيدلية، صرف الروشتات، وتتبع الصلاحيات (FEFO)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            دليل الأدوية والبدائل التكافؤية (INN)، حسابات التأمين والتحمل المشترك، وبروتوكول الصرف الأقرب انتهاءً أولاً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold"
            onClick={() => {
              sound.click();
              setIsAddBatchOpen(true);
            }}
          >
            <Calendar className="size-3.5 text-amber-500" />
            توريد تشغيلة (Batch)
          </Button>

          <Button
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold"
            onClick={() => {
              sound.click();
              setIsAddDrugOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            تعريف دواء جديد
          </Button>

          <Button
            className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
            onClick={() => {
              sound.click();
              setIsDispenseOpen(true);
            }}
          >
            <FileText className="size-3.5" />
            صرف روشتة / تذكرة طبية
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4 border-border/70">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">أصناف الأدوية</span>
            <Pill className="size-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold num text-foreground">
            {summaryQuery.isLoading ? <Skeleton className="h-7 w-12" /> : summary?.total_drugs ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">مسجل بالاسم العلمي والتجاري</p>
        </Card>

        <Card className="p-4 border-border/70">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">التشغيلات المخزونة</span>
            <Layers className="size-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold num text-foreground">
            {summaryQuery.isLoading ? <Skeleton className="h-7 w-12" /> : summary?.total_batches ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">تتبع تلقائي بنظام FEFO</p>
        </Card>

        <Card className="p-4 border-border/70 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">تنبيهات قرب الانتهاء</span>
            <AlertTriangle className="size-4" />
          </div>
          <div className="mt-2 text-2xl font-bold num text-amber-700 dark:text-amber-400">
            {summaryQuery.isLoading ? <Skeleton className="h-7 w-12" /> : summary?.near_expiry_count ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">أقل من 90 يوماً للصلاحية</p>
        </Card>

        <Card className="p-4 border-border/70">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">الروشتات المصروفة</span>
            <FileText className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold num text-foreground">
            {summaryQuery.isLoading ? <Skeleton className="h-7 w-12" /> : summary?.total_prescriptions ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">إلكتروني مع حسابات التأمين</p>
        </Card>

        <Card className="p-4 border-border/70 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-medium">دفتر الأدوية المراقبة</span>
            <ShieldAlert className="size-4" />
          </div>
          <div className="mt-2 text-2xl font-bold num text-rose-700 dark:text-rose-400">
            {summaryQuery.isLoading ? <Skeleton className="h-7 w-12" /> : summary?.controlled_entries ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-400/80">خاضع للرقابة والتفتيش</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border text-sm font-medium">
        <button
          onClick={() => {
            sound.click();
            setActiveTab("formulary");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "formulary"
              ? "border-teal-600 font-bold text-teal-600 dark:text-teal-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pill className="size-4" />
          <span>دليل الأدوية والبدائل التكافؤية</span>
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("dispensing");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "dispensing"
              ? "border-teal-600 font-bold text-teal-600 dark:text-teal-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-4" />
          <span>صرف الروشتات والتأمين الطبي</span>
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("batches");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "batches"
              ? "border-teal-600 font-bold text-teal-600 dark:text-teal-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="size-4" />
          <span>أرصدة التشغيلات وتواريخ الصلاحية (FEFO)</span>
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("controlled");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "controlled"
              ? "border-rose-600 font-bold text-rose-600 dark:text-rose-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="size-4" />
          <span>سجل الرقابة ودفتر المخدرات (Schedule)</span>
        </button>
      </div>

      {/* Tab 1: Formulary & Generics */}
      {activeTab === "formulary" && (
        <div className="flex flex-col gap-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث بالاسم التجاري، الاسم العلمي (INN)، أو الباركود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pr-9 pl-4 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={filterControlled}
                  onChange={(e) => setFilterControlled(e.target.checked)}
                  className="rounded border-border text-rose-600 focus:ring-rose-500"
                />
                <span>أدوية الجدول والمراقبة فقط</span>
              </label>
            </div>
          </div>

          {/* Drugs Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">الكود</th>
                    <th className="p-3">الاسم التجاري</th>
                    <th className="p-3">الاسم العلمي (INN Active Ingredient)</th>
                    <th className="p-3">الشكل الصيدلي</th>
                    <th className="p-3">التركيز</th>
                    <th className="p-3">سعر الجمهور</th>
                    <th className="p-3">الرصيد المتاح</th>
                    <th className="p-3">البدائل التكافؤية</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {drugsQuery.isLoading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center">
                        <Skeleton className="h-6 w-1/3 mx-auto" />
                      </td>
                    </tr>
                  ) : drugsQuery.data?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        لا توجد أدوية مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    drugsQuery.data?.map((drug) => (
                      <tr key={drug.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">{drug.code}</td>
                        <td className="p-3 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{drug.trade_name}</span>
                            {drug.is_controlled && (
                              <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                جدول مراقب
                              </Badge>
                            )}
                            {drug.requires_prescription && !drug.is_controlled && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-blue-600 border-blue-500/30">
                                روشتة
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-muted-foreground italic">
                          {drug.scientific_name}
                        </td>
                        <td className="p-3">{drug.dosage_form}</td>
                        <td className="p-3 font-mono text-[11px]">{drug.strength || "—"}</td>
                        <td className="p-3 font-bold num text-teal-600 dark:text-teal-400">
                          {moneyEGP(drug.unit_price)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold num ${
                              drug.total_stock > 0 ? "text-foreground" : "text-rose-500"
                            }`}
                          >
                            {drug.total_stock}
                          </span>
                        </td>
                        <td className="p-3">
                          {drug.alternatives_count > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                              onClick={() => {
                                sound.click();
                                setSelectedDrugForAlt(drug);
                              }}
                            >
                              <ArrowRightLeft className="size-3" />
                              <span>{drug.alternatives_count} بديل مكافئ</span>
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">لا يوجد بدائل</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] gap-1 text-teal-600 hover:text-teal-700"
                            onClick={() => {
                              sound.click();
                              setDispenseForm((prev) => ({ ...prev, drug_id: drug.id }));
                              setIsDispenseOpen(true);
                            }}
                          >
                            <FileText className="size-3" />
                            صرف
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prescriptions & Dispensing History */}
      {activeTab === "dispensing" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">سجل الروشتات والتذاكر المصروفة</h2>
            <Button
              className="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
              onClick={() => {
                sound.click();
                setIsDispenseOpen(true);
              }}
            >
              <FileText className="size-3.5" />
              صرف روشتة جديدة
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">رقم التذكرة</th>
                    <th className="p-3">اسم المريض</th>
                    <th className="p-3">الطبيب المعالج</th>
                    <th className="p-3">جهة التأمين</th>
                    <th className="p-3">نسبة التحمل</th>
                    <th className="p-3">المجموع الكلي</th>
                    <th className="p-3">مسدد من المريض</th>
                    <th className="p-3">تغطية التأمين</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">تاريخ الصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {prescriptionsQuery.isLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
                        <Skeleton className="h-6 w-1/3 mx-auto" />
                      </td>
                    </tr>
                  ) : prescriptionsQuery.data?.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        لا توجد تذاكر مصروفة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    prescriptionsQuery.data?.map((rx) => (
                      <tr key={rx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {rx.rx_number}
                        </td>
                        <td className="p-3 font-bold text-foreground">{rx.patient_name}</td>
                        <td className="p-3 text-muted-foreground">{rx.doctor_name}</td>
                        <td className="p-3">{rx.insurance_company || "نقدي (بدون تأمين)"}</td>
                        <td className="p-3 font-mono">{rx.copay_percentage}%</td>
                        <td className="p-3 font-bold num">{moneyEGP(rx.total_amount)}</td>
                        <td className="p-3 font-bold num text-teal-600 dark:text-teal-400">
                          {moneyEGP(rx.patient_paid)}
                        </td>
                        <td className="p-3 font-bold num text-blue-600 dark:text-blue-400">
                          {moneyEGP(rx.insurance_covered)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                            تم الصرف
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {new Date(rx.created_at).toLocaleString("ar-EG", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: FEFO Batches & Expiry Management */}
      {activeTab === "batches" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                جدول التشغيلات وتواريخ الصلاحية — أولوية الصرف (FEFO)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                يتم فرز التشغيلات حسب تاريخ انتهاء الصلاحية الأقرب لضمان خروج الأقدم قبل انتهاء صلاحيته
              </p>
            </div>
            <Button
              className="h-8 gap-1.5 border-border text-xs font-semibold"
              variant="outline"
              onClick={() => {
                sound.click();
                setIsAddBatchOpen(true);
              }}
            >
              <Calendar className="size-3.5 text-amber-500" />
              تسجيل تشغيلة واردة
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">رقم التشغيلة (Batch)</th>
                    <th className="p-3">الدواء التجاري</th>
                    <th className="p-3">المادة الفعالة</th>
                    <th className="p-3">تاريخ الانتهاء</th>
                    <th className="p-3">الأيام المتبقية</th>
                    <th className="p-3">الرصيد المتبقي</th>
                    <th className="p-3">سعر الشراء</th>
                    <th className="p-3">المورد</th>
                    <th className="p-3">حالة الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {batchesQuery.isLoading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center">
                        <Skeleton className="h-6 w-1/3 mx-auto" />
                      </td>
                    </tr>
                  ) : batchesQuery.data?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        لا توجد تشغيلات مسجلة
                      </td>
                    </tr>
                  ) : (
                    batchesQuery.data?.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{b.batch_number}</td>
                        <td className="p-3 font-bold text-foreground">{b.drug_trade_name}</td>
                        <td className="p-3 text-muted-foreground italic">{b.drug_scientific_name}</td>
                        <td className="p-3 font-mono font-bold">{b.expiry_date}</td>
                        <td className="p-3 font-mono">
                          <span
                            className={
                              b.days_to_expiry < 0
                                ? "text-rose-600 font-bold"
                                : b.days_to_expiry <= 90
                                ? "text-amber-600 font-bold"
                                : "text-muted-foreground"
                            }
                          >
                            {b.days_to_expiry < 0 ? `منتهي منذ ${Math.abs(b.days_to_expiry)} يوم` : `${b.days_to_expiry} يوم`}
                          </span>
                        </td>
                        <td className="p-3 font-bold num">{b.quantity_on_hand}</td>
                        <td className="p-3 num text-muted-foreground">{moneyEGP(b.purchase_cost)}</td>
                        <td className="p-3 text-muted-foreground">{b.supplier_name || "—"}</td>
                        <td className="p-3">
                          {b.status === "expired" ? (
                            <Badge variant="destructive" className="text-[10px]">منتهي الصلاحية</Badge>
                          ) : b.status === "warning" ? (
                            <Badge variant="outline" className="text-[10px] border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              قريب الانتهاء (&lt;90 يوم)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                              صالح للاستخدام
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Controlled Register */}
      {activeTab === "controlled" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-rose-800 dark:text-rose-300">
                  دفتر قيد الأدوية المراقبة وجدول المخدرات والسموم (Schedule & Controlled Register)
                </h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  سجل رقابي ملزم قانوناً بموجب تشريعات وزارة الصحة وهيئة الدواء المصرية. يتم فيه تدوين
                  كافة حركات الصرف والتوريد للأدوية النفسية والمخدرة مع إثبات الرقم القومي للمريض
                  وترخيص الطبيب المعالج لمنع التكرار وسوء الاستخدام.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">تاريخ ووقت الحركة</th>
                    <th className="p-3">اسم الصنف الدوائي</th>
                    <th className="p-3">المادة الفعالة</th>
                    <th className="p-3">رقم التشغيلة</th>
                    <th className="p-3">اسم المستلم (المريض)</th>
                    <th className="p-3">الرقم القومي (NID)</th>
                    <th className="p-3">الطبيب المعالج</th>
                    <th className="p-3">رقم الترخيص</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">نوع القيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {controlledLogQuery.isLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
                        <Skeleton className="h-6 w-1/3 mx-auto" />
                      </td>
                    </tr>
                  ) : controlledLogQuery.data?.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        لا توجد قيود مسجلة في دفتر المراقبة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    controlledLogQuery.data?.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString("ar-EG", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="p-3 font-bold text-foreground">{entry.drug_trade_name}</td>
                        <td className="p-3 text-muted-foreground italic">{entry.scientific_name}</td>
                        <td className="p-3 font-mono font-semibold">{entry.batch_number}</td>
                        <td className="p-3 font-bold text-foreground">{entry.patient_name}</td>
                        <td className="p-3 font-mono text-rose-600 dark:text-rose-400 font-bold">
                          {entry.patient_national_id}
                        </td>
                        <td className="p-3">{entry.prescriber_doctor}</td>
                        <td className="p-3 font-mono text-[11px]">{entry.doctor_license || "—"}</td>
                        <td className="p-3 font-bold num">{entry.quantity}</td>
                        <td className="p-3">
                          <Badge variant="destructive" className="text-[10px]">
                            {entry.transaction_type === "dispense" ? "صرف بتذكرة" : entry.transaction_type}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Generic Alternatives Modal */}
      <Modal
        open={!!selectedDrugForAlt}
        onClose={() => setSelectedDrugForAlt(null)}
        title="دليل البدائل التكافؤية (Generic Equivalents & Alternatives)"
      >
        {selectedDrugForAlt && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground">الدواء الأصلي المطلوب:</span>
              <div className="mt-1 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{selectedDrugForAlt.trade_name}</h4>
                  <p className="text-xs text-muted-foreground italic">{selectedDrugForAlt.scientific_name}</p>
                </div>
                <div className="text-left font-bold num text-sm text-foreground">
                  {moneyEGP(selectedDrugForAlt.unit_price)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-teal-600" />
                <span>البدائل الجنيسة المتاحة المطابقة لنفس المادة الفعالة:</span>
              </h5>

              {alternativesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : alternativesQuery.data?.alternatives.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-muted-foreground">
                  لا توجد بدائل جنيسة مسجلة تشارك نفس المادة الفعالة حالياً
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {alternativesQuery.data?.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-2xs hover:border-teal-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{alt.trade_name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">({alt.strength})</span>
                          {alt.in_stock ? (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">
                              متوفر ({alt.total_stock})
                            </span>
                          ) : (
                            <span className="rounded bg-rose-500/10 px-1.5 py-0.2 text-[10px] font-bold text-rose-500">
                              غير متوفر
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{alt.dosage_form}</p>
                      </div>

                      <div className="text-left">
                        <span className="font-bold num text-sm text-foreground">{moneyEGP(alt.unit_price)}</span>
                        {alt.price_diff < 0 ? (
                          <p className="text-[10px] font-bold text-emerald-600">
                            أوفر بنسبة {Math.abs(alt.price_diff_percent)}% ({moneyEGP(Math.abs(alt.price_diff))})
                          </p>
                        ) : alt.price_diff > 0 ? (
                          <p className="text-[10px] font-medium text-muted-foreground">
                            أعلى بـ {moneyEGP(alt.price_diff)}
                          </p>
                        ) : (
                          <p className="text-[10px] font-medium text-muted-foreground">نفس السعر</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setSelectedDrugForAlt(null)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dispense Prescription Modal */}
      <Modal
        open={isDispenseOpen}
        onClose={() => setIsDispenseOpen(false)}
        title="صرف روشتة / تذكرة دوائية إلكترونية"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispenseMutation.mutate(dispenseForm);
          }}
          className="flex flex-col gap-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">اسم المريض *</label>
              <input
                type="text"
                required
                placeholder="أحمد محمد السيد"
                value={dispenseForm.patient_name}
                onChange={(e) => setDispenseForm({ ...dispenseForm, patient_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">رقم هاتف المريض</label>
              <input
                type="tel"
                placeholder="010XXXXXXXX"
                value={dispenseForm.patient_phone}
                onChange={(e) => setDispenseForm({ ...dispenseForm, patient_phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">اسم الطبيب المعالج *</label>
              <input
                type="text"
                required
                placeholder="د. طارق العوضي"
                value={dispenseForm.doctor_name}
                onChange={(e) => setDispenseForm({ ...dispenseForm, doctor_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">رقم ترخيص الطبيب</label>
              <input
                type="text"
                placeholder="MED-12345"
                value={dispenseForm.doctor_license}
                onChange={(e) => setDispenseForm({ ...dispenseForm, doctor_license: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="font-semibold text-foreground">التشخيص الطبي / الحالة</label>
              <input
                type="text"
                placeholder="ارتفاع ضغط دم مزمن، حساسية صدرية، التهاب..."
                value={dispenseForm.diagnosis}
                onChange={(e) => setDispenseForm({ ...dispenseForm, diagnosis: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">شركة / جهة التأمين الطبي</label>
              <input
                type="text"
                placeholder="بوبا، كير بلس، متلايف، نقابة المهندسين..."
                value={dispenseForm.insurance_company}
                onChange={(e) => setDispenseForm({ ...dispenseForm, insurance_company: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">نسبة تحمل المريض (% Co-pay)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={dispenseForm.copay_percentage}
                onChange={(e) =>
                  setDispenseForm({ ...dispenseForm, copay_percentage: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2 border-t border-border/60 pt-3">
              <label className="font-semibold text-foreground">الصنف الدوائي المطلوب صرفه *</label>
              <select
                required
                value={dispenseForm.drug_id}
                onChange={(e) => setDispenseForm({ ...dispenseForm, drug_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              >
                <option value="">اختر الدواء من الدليل...</option>
                {drugsQuery.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.trade_name} ({d.scientific_name}) — {moneyEGP(d.unit_price)} [رصيد: {d.total_stock}]
                    {d.is_controlled ? " ⚠️ (جدول)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">الكمية المطلوبة *</label>
              <input
                type="number"
                min="1"
                required
                value={dispenseForm.quantity}
                onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* If selected drug is controlled, enforce National ID */}
            {currentSelectedDrug?.is_controlled && (
              <div className="col-span-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5">
                <label className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="size-4" />
                  <span>الرقم القومي للمريض (إلزامي للأدوية المراقبة وجدول المخدرات) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="29408151203491 (14 رقم)"
                  value={dispenseForm.patient_national_id}
                  onChange={(e) =>
                    setDispenseForm({ ...dispenseForm, patient_national_id: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-rose-400 bg-background px-3 py-1.5 text-xs font-mono focus:border-rose-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Pricing & Co-Pay Preview */}
          {dispenseForm.drug_id && (
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 space-y-1">
              <div className="flex justify-between font-medium text-muted-foreground">
                <span>القيمة الكلية للدواء:</span>
                <span className="font-bold num text-foreground">{moneyEGP(calculatedTotal)}</span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>تغطية التأمين ({100 - dispenseForm.copay_percentage}%):</span>
                <span className="font-bold num">-{moneyEGP(calculatedInsurance)}</span>
              </div>
              <div className="flex justify-between border-t border-teal-500/20 pt-1.5 font-black text-teal-700 dark:text-teal-400 text-sm">
                <span>المطلوب تحصيله من المريض نقداً:</span>
                <span className="num">{moneyEGP(calculatedPatientPaid)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-9 text-xs"
              onClick={() => setIsDispenseOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={dispenseMutation.isPending}
              className="flex-1 h-9 font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              {dispenseMutation.isPending ? "جارٍ الصرف وخصم المخزون..." : "تأكيد الصرف وطباعة الإيصال"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Drug Modal */}
      <Modal
        open={isAddDrugOpen}
        onClose={() => setIsAddDrugOpen(false)}
        title="تعريف مستحضر دوائي جديد في الدليل"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDrugMutation.mutate(newDrug);
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">كود الصنف *</label>
              <input
                type="text"
                required
                placeholder="DRG-2001"
                value={newDrug.code}
                onChange={(e) => setNewDrug({ ...newDrug, code: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الاسم التجاري (Trade Name) *</label>
              <input
                type="text"
                required
                placeholder="Cataflam 50mg"
                value={newDrug.trade_name}
                onChange={(e) => setNewDrug({ ...newDrug, trade_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="font-semibold text-foreground">
                الاسم العلمي / المادة الفعالة (INN Scientific Name) *
              </label>
              <input
                type="text"
                required
                placeholder="Diclofenac Potassium"
                value={newDrug.scientific_name}
                onChange={(e) => setNewDrug({ ...newDrug, scientific_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الشكل الصيدلي</label>
              <select
                value={newDrug.dosage_form}
                onChange={(e) => setNewDrug({ ...newDrug, dosage_form: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              >
                <option value="أقراص">أقراص (Tablets)</option>
                <option value="كبسولات">كبسولات (Capsules)</option>
                <option value="شراب">شراب (Syrup)</option>
                <option value="حقن أمبول">حقن أمبول (Ampoules)</option>
                <option value="مرهم / كريم">مرهم / كريم (Ointment/Cream)</option>
                <option value="قطرة">قطرة (Drops)</option>
                <option value="أقلام أنسولين">أقلام أنسولين (Pens)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">التركيز</label>
              <input
                type="text"
                placeholder="50mg, 1000mg/ml"
                value={newDrug.strength}
                onChange={(e) => setNewDrug({ ...newDrug, strength: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">سعر الجمهور الرسمي (ج.م) *</label>
              <input
                type="number"
                step="0.25"
                required
                value={newDrug.unit_price}
                onChange={(e) => setNewDrug({ ...newDrug, unit_price: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الباركود الدولي</label>
              <input
                type="text"
                placeholder="622100..."
                value={newDrug.barcode}
                onChange={(e) => setNewDrug({ ...newDrug, barcode: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDrug.is_controlled}
                  onChange={(e) => setNewDrug({ ...newDrug, is_controlled: e.target.checked })}
                  className="rounded border-border text-rose-600 focus:ring-rose-500"
                />
                <span className="font-bold text-rose-600">دواء مراقب / جدول مخدرات (Schedule)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDrug.requires_prescription}
                  onChange={(e) =>
                    setNewDrug({ ...newDrug, requires_prescription: e.target.checked })
                  }
                  className="rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span>يتطلب روشتة طبية (Rx)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-9 text-xs"
              onClick={() => setIsAddDrugOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createDrugMutation.isPending}
              className="flex-1 h-9 font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              {createDrugMutation.isPending ? "جارٍ الحفظ..." : "حفظ الدواء في الدليل"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Batch Modal */}
      <Modal
        open={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        title="توريد تشغيلة جديدة (Batch Inward)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBatchMutation.mutate(newBatch);
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div>
            <label className="font-semibold text-foreground">الدواء *</label>
            <select
              required
              value={newBatch.drug_id}
              onChange={(e) => setNewBatch({ ...newBatch, drug_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
            >
              <option value="">اختر الدواء...</option>
              {drugsQuery.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.trade_name} ({d.scientific_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">رقم التشغيلة (Batch No) *</label>
              <input
                type="text"
                required
                placeholder="AUG-2026-B12"
                value={newBatch.batch_number}
                onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">تاريخ انتهاء الصلاحية *</label>
              <input
                type="date"
                required
                value={newBatch.expiry_date}
                onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الكمية الموردة *</label>
              <input
                type="number"
                min="1"
                required
                value={newBatch.quantity}
                onChange={(e) => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">تكلفة شراء الوحدة (ج.م) *</label>
              <input
                type="number"
                step="0.25"
                required
                value={newBatch.purchase_cost}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, purchase_cost: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="font-semibold text-foreground">اسم المورد / الشركة الموزعة</label>
              <input
                type="text"
                placeholder="الشركة المتحدة للتوزيع، ابن سينا فارما، فارما أوفرسيز..."
                value={newBatch.supplier_name}
                onChange={(e) => setNewBatch({ ...newBatch, supplier_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-9 text-xs"
              onClick={() => setIsAddBatchOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createBatchMutation.isPending}
              className="flex-1 h-9 font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              {createBatchMutation.isPending ? "جارٍ التوريد..." : "تسجيل التشغيلة في المخزون"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Prescription Dispensing Receipt Modal */}
      <PharmacyPrescriptionReceiptModal
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
