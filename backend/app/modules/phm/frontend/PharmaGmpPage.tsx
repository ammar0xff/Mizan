import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Fingerprint,
  FlaskConical,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
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

interface PhmSummary {
  active_ebr_batches_count: number;
  pending_qp_release_count: number;
  released_batches_count: number;
  open_deviations_capa_count: number;
  line_clearance_records_count: number;
  master_formulas_count: number;
}

interface PhmMasterFormula {
  id: string;
  product_code: string;
  generic_name: string;
  brand_name: string;
  dosage_form: string;
  strength: string;
  master_batch_size: number;
  batch_unit: string;
  shelf_life_months: number;
  registration_no: string;
  is_active: boolean;
}

interface PhmElectronicBatchRecord {
  id: string;
  ebr_number: string;
  formula_id?: string;
  product_name?: string;
  batch_lot: string;
  planned_yield: number;
  actual_yield: number;
  current_step: string;
  status: "in_process" | "qa_hold" | "qp_released" | "rejected";
  primary_operator: string;
  witness_signoff_by?: string;
  witness_timestamp?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  created_at?: string;
}

interface PhmQpRelease {
  id: string;
  release_cert_ref: string;
  ebr_id: string;
  batch_lot: string;
  qp_name: string;
  qp_license_no: string;
  release_status: "approved" | "rejected";
  disposition_reason: string;
  digital_signature_hash: string;
  signed_at?: string;
}

interface PhmDeviationCapa {
  id: string;
  deviation_ref: string;
  ebr_id?: string;
  batch_lot: string;
  deviation_type: "critical" | "major" | "minor";
  root_cause_category: string;
  root_cause_details: string;
  capa_action_plan: string;
  assigned_qa_lead: string;
  target_completion_date?: string;
  status: "under_investigation" | "capa_assigned" | "effectiveness_verified" | "closed";
  created_at?: string;
}

interface PhmCleanInPlaceLog {
  id: string;
  vessel_name: string;
  previous_product: string;
  next_product: string;
  cleaning_agent: string;
  rinse_conductivity_us: number;
  swab_test_result: string;
  line_clearance_signoff_by: string;
  cleaned_at: string;
}

interface PhmStabilityStudy {
  id: string;
  study_ref: string;
  product_code: string;
  storage_condition: string;
  timepoint_months: number;
  assay_pct: number;
  degradation_products_pct: number;
  status: "conforms" | "out_of_specification" | "trending_down";
  tested_at?: string;
}

export default function PharmaGmpPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ebr" | "qp" | "deviations" | "cip" | "stability">("ebr");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isNewEbrOpen, setIsNewEbrOpen] = useState(false);
  const [isAdvanceStepOpen, setIsAdvanceStepOpen] = useState(false);
  const [selectedEbr, setSelectedEbr] = useState<PhmElectronicBatchRecord | null>(null);
  const [isNewQpOpen, setIsNewQpOpen] = useState(false);
  const [isNewDeviationOpen, setIsNewDeviationOpen] = useState(false);
  const [isNewCipOpen, setIsNewCipOpen] = useState(false);
  const [isNewStabilityOpen, setIsNewStabilityOpen] = useState(false);

  // Form states
  const [newEbrData, setNewEbrData] = useState({
    ebr_number: "EBR-2026-004",
    formula_id: "",
    batch_lot: "LOT-PHM-994",
    planned_yield: 100000,
    primary_operator: "د. طارق الجندي",
    manufacturing_date: "2026-11-02",
    expiry_date: "2029-11-01",
  });

  const [stepData, setStepData] = useState({
    next_step: "granulation",
    actual_yield: 98500,
    witness_signoff_by: "د. ريم المهندس (مفتش الجودة)",
    electronic_signature_reason: "التحقق المزدوج من خطوة المعالجة الحرجة ومطابقة العيار الدوائي",
  });

  const [qpData, setQpData] = useState({
    ebr_id: "",
    qp_name: "د. عبد الرحمن الفيل (Qualified Person)",
    qp_license_no: "EGY-QP-84920",
    release_status: "approved",
    disposition_reason: "كافة الفحوص الميكروبيولوجية والكيميائية مطابقة لـ USP / BP ومعايير التحرير الدوائي.",
    signature_password: "Verified_Pass_2026#",
  });

  const [devData, setDevData] = useState({
    deviation_ref: "DEV-2026-003",
    ebr_id: "",
    deviation_type: "minor",
    root_cause_category: "Equipment",
    root_cause_details: "تذبذب عزم دوران خلاط التحبيب الرطب عالي القص لمدة 4 دقائق بسبب انخفاض الجهد المغذي.",
    capa_action_plan: "معايرة محرك الخلاط وإضافة منظم جهد مخصص وتدريب الفريق الفني على فحص القواطع الكهربائية.",
    assigned_qa_lead: "د. هبة الشافعي",
    target_completion_date: "2026-11-15",
  });

  const [cipData, setCipData] = useState({
    vessel_name: "مفاعل التحبيب والخلط عالي السرعة (High Shear Mixer G-02)",
    previous_product: "أوجمنتين فورت 625 مجم أقراص",
    next_product: "باراسيتامول 500 مجم أقراص",
    cleaning_agent: "NaOH 2% + 3x WFI Rinse + WFI Final Flush",
    rinse_conductivity_us: 0.95,
    swab_test_result: "Negative (< 2 ppm TOC)",
    line_clearance_signoff_by: "م. كمال التوني (QA Specialist)",
    cleaned_at: "2026-11-02 08:30",
  });

  const [stabData, setStabData] = useState({
    study_ref: "STAB-2026-004",
    product_code: "PHM-AMX-500",
    storage_condition: "Zone IVb (30°C / 75% RH)",
    timepoint_months: 6,
    assay_pct: 99.4,
    degradation_products_pct: 0.22,
    status: "conforms",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<PhmSummary>({
    queryKey: ["phm", "summary"],
    queryFn: () => api.get<PhmSummary>("/phm/summary"),
  });

  const { data: formulas = [] } = useQuery<PhmMasterFormula[]>({
    queryKey: ["phm", "formulas"],
    queryFn: () => api.get<PhmMasterFormula[]>("/phm/formulas"),
  });

  const { data: ebrs = [], isLoading: isEbrsLoading } = useQuery<PhmElectronicBatchRecord[]>({
    queryKey: ["phm", "ebrs"],
    queryFn: () => api.get<PhmElectronicBatchRecord[]>("/phm/ebrs"),
  });

  const { data: qpReleases = [], isLoading: isQpLoading } = useQuery<PhmQpRelease[]>({
    queryKey: ["phm", "qp-releases"],
    queryFn: () => api.get<PhmQpRelease[]>("/phm/qp-releases"),
  });

  const { data: deviations = [], isLoading: isDevLoading } = useQuery<PhmDeviationCapa[]>({
    queryKey: ["phm", "deviations"],
    queryFn: () => api.get<PhmDeviationCapa[]>("/phm/deviations"),
  });

  const { data: cipLogs = [], isLoading: isCipLoading } = useQuery<PhmCleanInPlaceLog[]>({
    queryKey: ["phm", "cip-logs"],
    queryFn: () => api.get<PhmCleanInPlaceLog[]>("/phm/cip-logs"),
  });

  const { data: stabs = [], isLoading: isStabLoading } = useQuery<PhmStabilityStudy[]>({
    queryKey: ["phm", "stability-studies"],
    queryFn: () => api.get<PhmStabilityStudy[]>("/phm/stability-studies"),
  });

  // Handlers
  const handleCreateEbr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/phm/ebrs", {
        ...newEbrData,
        planned_yield: Number(newEbrData.planned_yield),
      });
      sound.click();
      toast("success", "تم إنشاء سجل التشغيل الإلكتروني الدوائي (EBR) بنجاح");
      setIsNewEbrOpen(false);
      queryClient.invalidateQueries({ queryKey: ["phm"] });
    } catch {
      toast("error", "فشل في تسجيل دفعة التشغيل الإلكترونية");
    }
  };

  const handleAdvanceStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEbr) return;
    try {
      await api.post(`/phm/ebrs/${selectedEbr.id}/step`, {
        ...stepData,
        actual_yield: Number(stepData.actual_yield),
      });
      sound.click();
      toast("success", "تم توثيق الخطوة الحالية وتوقيع المشاهد المزدوج (Dual-Witness)");
      setIsAdvanceStepOpen(false);
      setSelectedEbr(null);
      queryClient.invalidateQueries({ queryKey: ["phm"] });
    } catch {
      toast("error", "فشل في توثيق الخطوة");
    }
  };

  const handleCreateQpRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qpData.ebr_id) {
      toast("error", "يرجى تحديد دفعة التشغيل المراد توقيع الإفراج عنها");
      return;
    }
    try {
      await api.post("/phm/qp-releases", qpData);
      sound.click();
      toast("success", "تم اعتماد وتوقيع الإفراج الدوائي الرقمي بموجب 21 CFR Part 11");
      setIsNewQpOpen(false);
      queryClient.invalidateQueries({ queryKey: ["phm"] });
    } catch {
      toast("error", "فشل في تسجيل توقيع الإفراج");
    }
  };

  const handleCreateDeviation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/phm/deviations", devData);
      sound.click();
      toast("success", "تم فتح سجل الانحراف وتكليف فريق الجودة بإجراءات CAPA");
      setIsNewDeviationOpen(false);
      queryClient.invalidateQueries({ queryKey: ["phm"] });
    } catch {
      toast("error", "فشل في تسجيل الانحراف الدوائي");
    }
  };

  const handleCreateCip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/phm/cip-logs", {
        ...cipData,
        rinse_conductivity_us: Number(cipData.rinse_conductivity_us),
      });
      sound.click();
      toast("success", "تم توثيق محضر خلو الخط وتطهير المفاعل CIP");
      setIsNewCipOpen(false);
      queryClient.invalidateQueries({ queryKey: ["phm"] });
    } catch {
      toast("error", "فشل في تسجيل محضر CIP");
    }
  };

  const handleCreateStability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/phm/stability-studies", {
        ...stabData,
        timepoint_months: Number(stabData.timepoint_months),
        assay_pct: Number(stabData.assay_pct),
        degradation_products_pct: Number(stabData.degradation_products_pct),
      });
      sound.click();
      toast("success", "تم تسجيل نتائج دراسة ثبات المستحضر الدوائي في كبينة Zone IVb");
      setIsNewStabilityOpen(false);
      queryClient.invalidateQueries({ queryKey: ["phm"] });
    } catch {
      toast("error", "فشل في تسجيل دراسة الثبات");
    }
  };

  const filteredEbrs = ebrs.filter(
    (e) =>
      e.ebr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.batch_lot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.product_name && e.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              التصنيع الدوائي ومراقبة الجودة cGMP
            </h1>
            <p className="text-sm text-muted-foreground">
              إدارة سجلات التشغيل الإلكترونية BMR، شهادات الإفراج الرقمية 21 CFR Part 11، وتحقيقات CAPA وخلو الخطوط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "ebr" && (
            <Button
              onClick={() => {
                sound.click();
                if (formulas.length > 0 && !newEbrData.formula_id) {
                  setNewEbrData((prev) => ({ ...prev, formula_id: formulas[0].id }));
                }
                setIsNewEbrOpen(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4" />
              تسجيل دفعة تصنيع EBR
            </Button>
          )}

          {activeTab === "qp" && (
            <Button
              onClick={() => {
                sound.click();
                if (ebrs.length > 0 && !qpData.ebr_id) {
                  setQpData((prev) => ({ ...prev, ebr_id: ebrs[0].id }));
                }
                setIsNewQpOpen(true);
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Fingerprint className="h-4 w-4" />
              توقيع إفراج صيدلي مؤهل QP
            </Button>
          )}

          {activeTab === "deviations" && (
            <Button
              onClick={() => {
                sound.click();
                setIsNewDeviationOpen(true);
              }}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              تسجيل انحراف تشغيلي CAPA
            </Button>
          )}

          {activeTab === "cip" && (
            <Button
              onClick={() => {
                sound.click();
                setIsNewCipOpen(true);
              }}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Sparkles className="h-4 w-4" />
              محضر خلو خط CIP جديد
            </Button>
          )}

          {activeTab === "stability" && (
            <Button
              onClick={() => {
                sound.click();
                setIsNewStabilityOpen(true);
              }}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Thermometer className="h-4 w-4" />
              تسجيل فحص ثبات Zone IVb
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">دفعات تشغيل EBR نشطة</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.active_ebr_batches_count ?? 0}
          </div>
          <span className="text-xs text-muted-foreground">تحت المعالجة في الصالات النظيفة</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">في انتظار إفراج QP</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.pending_qp_release_count ?? 0}
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400">حجز جودة وتدقيق BMR</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">دفعات مفرجة ومطابقة</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.released_batches_count ?? 0}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400">تحرير دوائي معتمد</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">انحرافات مفتوحة CAPA</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.open_deviations_capa_count ?? 0}
          </div>
          <span className="text-xs text-rose-600 dark:text-rose-400">تحقيقات أسباب جذرية</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">خلو خطوط وتطهير CIP</span>
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.line_clearance_records_count ?? 0}
          </div>
          <span className="text-xs text-cyan-600 dark:text-cyan-400">مسحات TOC & توصيلية</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">التركيبات الدوائية المعتمدة</span>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.master_formulas_count ?? 0}
          </div>
          <span className="text-xs text-muted-foreground">سجلات BMR المسجلة بوزارة الصحة</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            sound.click();
            setActiveTab("ebr");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "ebr"
              ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          سجلات التشغيل الإلكترونية (EBR / BMR)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("qp");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "qp"
              ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Fingerprint className="h-4 w-4" />
          إفراج الصيدلي المؤهل (21 CFR Part 11 QP Release)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("deviations");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "deviations"
              ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          الانحرافات وخطة CAPA التصحيحية
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("cip");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "cip"
              ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          تطهير المفاعلات وخلو الخطوط (CIP Logs)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("stability");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "stability"
              ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Thermometer className="h-4 w-4" />
          دراسات الثبات والتحلل (Zone IVb Stability)
        </button>
      </div>

      {/* Tab 1: Electronic Batch Records (EBR) */}
      {activeTab === "ebr" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الدفعة أو اسم المستحضر الدوائي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold font-mono">{filteredEbrs.length}</span> دفعة تشغيل إلكترونية
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم السجل EBR</TableHead>
                  <TableHead>المستحضر الدوائي</TableHead>
                  <TableHead>رقم التشغيلة (Batch Lot)</TableHead>
                  <TableHead>الكمية المخططة / الفعلية</TableHead>
                  <TableHead>المرحلة الحالية (BMR Step)</TableHead>
                  <TableHead>حالة التشغيلة</TableHead>
                  <TableHead>المشغل والتوقيع المزدوج</TableHead>
                  <TableHead>تاريخ الصلاحية</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isEbrsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredEbrs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات تشغيل مطابقة لمعايير البحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEbrs.map((ebr) => (
                    <TableRow key={ebr.id}>
                      <TableCell className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {ebr.ebr_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {ebr.product_name || "مستحضر دوائي معتمد"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono font-bold">
                          {ebr.batch_lot}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {ebr.planned_yield.toLocaleString()} /{" "}
                        <span className={ebr.actual_yield > 0 ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                          {ebr.actual_yield > 0 ? ebr.actual_yield.toLocaleString() : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {ebr.current_step}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ebr.status === "qp_released"
                              ? "success"
                              : ebr.status === "qa_hold"
                              ? "warning"
                              : ebr.status === "rejected"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {ebr.status === "qp_released"
                            ? "مفرج ومعتمد QP"
                            : ebr.status === "qa_hold"
                            ? "حجز جودة QA Hold"
                            : ebr.status === "rejected"
                            ? "مرفوض"
                            : "قيد التشغيل بالمصنع"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>المشغل: <span className="font-medium">{ebr.primary_operator}</span></div>
                        {ebr.witness_signoff_by && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                            المشاهد: {ebr.witness_signoff_by}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ebr.expiry_date || "—"}
                      </TableCell>
                      <TableCell className="text-left">
                        {ebr.status === "in_process" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              sound.click();
                              setSelectedEbr(ebr);
                              setIsAdvanceStepOpen(true);
                            }}
                            className="gap-1 border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            توثيق الخطوة
                          </Button>
                        )}
                        {ebr.status === "qa_hold" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              sound.click();
                              setQpData((prev) => ({ ...prev, ebr_id: ebr.id }));
                              setIsNewQpOpen(true);
                            }}
                            className="gap-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                          >
                            <Fingerprint className="h-3.5 w-3.5" />
                            توقيع إفراج QP
                          </Button>
                        )}
                        {ebr.status === "qp_released" && (
                          <Badge variant="success" className="gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> مكتمل ومفرج
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 2: QP Release (21 CFR Part 11) */}
      {activeTab === "qp" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300">
                  معايير التحرير الدوائي الصيدلي (EU Annex 16 / US 21 CFR Part 11)
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1">
                  كل دفعة إنتاجية دوائية تتطلب إفراجاً كتابياً ورقمياً مشفراً بهاش SHA-256 من الصيدلي المؤهل (Qualified Person)
                  بعد مراجعة كافة سجلات الـ BMR، مسحات خطوط التطهير، نتائج المعامل الكيميائية والميكروبيولوجية، والتحقق من عدم وجود انحرافات مفتوحة.
                </p>
              </div>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مرجع شهادة الإفراج</TableHead>
                  <TableHead>رقم التشغيلة</TableHead>
                  <TableHead>الصيدلي المؤهل (QP)</TableHead>
                  <TableHead>رقم ترخيص المزاولة</TableHead>
                  <TableHead>حالة القرار (Disposition)</TableHead>
                  <TableHead>بصمة التوقيع الرقمي (SHA-256)</TableHead>
                  <TableHead>تاريخ ووقت التوقيع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isQpLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : qpReleases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد شهادات إفراج مسجلة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  qpReleases.map((qp) => (
                    <TableRow key={qp.id}>
                      <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {qp.release_cert_ref}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono font-bold">
                          {qp.batch_lot}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{qp.qp_name}</TableCell>
                      <TableCell className="font-mono text-xs">{qp.qp_license_no}</TableCell>
                      <TableCell>
                        <Badge variant={qp.release_status === "approved" ? "success" : "destructive"}>
                          {qp.release_status === "approved" ? "معتمد ومفرج للسوق" : "مرفوض للإتلاف"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded border border-border">
                          {qp.digital_signature_hash}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {qp.signed_at || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 3: Deviations & CAPA */}
      {activeTab === "deviations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل الانحرافات التشغيلية والتحقيقات الجذرية والإجراءات الوقائية (CAPA)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              إجمالي الحالات: {deviations.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مرجع الانحراف</TableHead>
                  <TableHead>التشغيلة / النطاق</TableHead>
                  <TableHead>الدرجة (Classification)</TableHead>
                  <TableHead>تصنيف السبب الجذري</TableHead>
                  <TableHead>تفاصيل الانحراف وخطة CAPA</TableHead>
                  <TableHead>مسؤول الجودة QA</TableHead>
                  <TableHead>الحالة والموعد المستهدف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDevLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : deviations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد انحرافات مفتوحة — جميع خطوط الإنتاج مطابقة للمواصفات القياسية
                    </TableCell>
                  </TableRow>
                ) : (
                  deviations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {d.deviation_ref}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {d.batch_lot}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            d.deviation_type === "critical"
                              ? "destructive"
                              : d.deviation_type === "major"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {d.deviation_type === "critical"
                            ? "حرج (Critical)"
                            : d.deviation_type === "major"
                            ? "رئيسي (Major)"
                            : "طفيف (Minor)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.root_cause_category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-medium text-xs truncate" title={d.root_cause_details}>
                          {d.root_cause_details}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate" title={d.capa_action_plan}>
                          <span className="font-semibold text-foreground">CAPA:</span> {d.capa_action_plan}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{d.assigned_qa_lead}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "closed" ? "success" : "warning"}>
                          {d.status === "closed"
                            ? "مغلق بعد التحقق"
                            : d.status === "effectiveness_verified"
                            ? "تم التحقق من الفعالية"
                            : d.status === "capa_assigned"
                            ? "تم تعيين CAPA"
                            : "قيد التحقيق"}
                        </Badge>
                        {d.target_completion_date && (
                          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                            المستهدف: {d.target_completion_date}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 4: Clean In Place (CIP) & Line Clearance */}
      {activeTab === "cip" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجلات التطهير CIP وخلو الخطوط والتحقق من التلوث التبادلي (Cross-Contamination)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              محاضر التطهير: {cipLogs.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المفاعل / الخط الإنتاجي</TableHead>
                  <TableHead>المستحضر السابق</TableHead>
                  <TableHead>المستحضر اللاحق</TableHead>
                  <TableHead>سائل التطهير وخطوات الشطف</TableHead>
                  <TableHead>التوصيلية النهائية (Conductivity)</TableHead>
                  <TableHead>نتيجة مسحة التلوث (Swab Test)</TableHead>
                  <TableHead>مسؤول اعتماد خلو الخط</TableHead>
                  <TableHead>توقيت التطهير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCipLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : cipLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات تطهير CIP مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  cipLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-cyan-700 dark:text-cyan-400">
                        {log.vessel_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.previous_product}</TableCell>
                      <TableCell className="text-xs font-semibold">{log.next_product}</TableCell>
                      <TableCell className="text-xs font-mono">{log.cleaning_agent}</TableCell>
                      <TableCell className="font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          log.rinse_conductivity_us <= 1.3
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {log.rinse_conductivity_us} µS/cm
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {log.swab_test_result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{log.line_clearance_signoff_by}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.cleaned_at}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 5: Stability Studies (Zone IVb) */}
      {activeTab === "stability" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/50 p-4 dark:bg-indigo-950/20">
            <div className="flex items-start gap-3">
              <Thermometer className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300">
                  اختبارات الثبات الإقليمية (ICH Zone IVb: 30°C ± 2°C / 75% RH ± 5% RH)
                </h4>
                <p className="text-xs text-indigo-800/80 dark:text-indigo-400/80 mt-1">
                  المتابعة الدورية للعيار الدوائي (Assay %) ومتبقيات التحلل الكيميائي (Degradation Products %) تحت الظروف المناخية
                  الحارة والرطبة للمنطقة الرابعة ب لضمان بقاء المستحضر فعالاً وآمناً طوال فترة الصلاحية المسجلة.
                </p>
              </div>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مرجع الدراسة</TableHead>
                  <TableHead>كود المستحضر</TableHead>
                  <TableHead>كبينة التخزين والظروف</TableHead>
                  <TableHead>نقطة الفحص الزمني</TableHead>
                  <TableHead>العيار الدوائي (Assay %)</TableHead>
                  <TableHead>شوائب التحلل (Degradation %)</TableHead>
                  <TableHead>الحالة والمطابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isStabLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : stabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد دراسات ثبات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  stabs.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {s.study_ref}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.product_code}</TableCell>
                      <TableCell className="text-xs">{s.storage_condition}</TableCell>
                      <TableCell className="font-mono font-bold">{s.timepoint_months} شهور</TableCell>
                      <TableCell className="font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          s.assay_pct >= 95.0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {s.assay_pct}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className="text-muted-foreground">{s.degradation_products_pct}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "conforms" ? "success" : "destructive"}>
                          {s.status === "conforms"
                            ? "مطابق لدستور الأدوية"
                            : s.status === "trending_down"
                            ? "انخفاض تدريجي ملحوظ"
                            : "خارج حدود المواصفة (OOS)"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Modal: New EBR Batch */}
      {isNewEbrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewEbrOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold">إنشاء سجل تشغيل إلكتروني جديد (BMR / EBR)</h3>
            </div>

            <form onSubmit={handleCreateEbr} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم سجل EBR</label>
                  <Input
                    value={newEbrData.ebr_number}
                    onChange={(e) => setNewEbrData({ ...newEbrData, ebr_number: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم التشغيلة (Batch Lot)</label>
                  <Input
                    value={newEbrData.batch_lot}
                    onChange={(e) => setNewEbrData({ ...newEbrData, batch_lot: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">المستحضر والتركيبة الدوائية المعتمدة</label>
                <select
                  value={newEbrData.formula_id}
                  onChange={(e) => setNewEbrData({ ...newEbrData, formula_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {formulas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.brand_name} - {f.product_code} ({f.dosage_form})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">حجم التشغيلة المخطط</label>
                  <Input
                    type="number"
                    value={newEbrData.planned_yield}
                    onChange={(e) => setNewEbrData({ ...newEbrData, planned_yield: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المشغل المسؤول (Primary Operator)</label>
                  <Input
                    value={newEbrData.primary_operator}
                    onChange={(e) => setNewEbrData({ ...newEbrData, primary_operator: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ بدء التصنيع</label>
                  <Input
                    type="date"
                    value={newEbrData.manufacturing_date}
                    onChange={(e) => setNewEbrData({ ...newEbrData, manufacturing_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ انتهاء الصلاحية</label>
                  <Input
                    type="date"
                    value={newEbrData.expiry_date}
                    onChange={(e) => setNewEbrData({ ...newEbrData, expiry_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewEbrOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  إنشاء السجل وبدء الوزن
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Advance EBR Step (Dual Witness) */}
      {isAdvanceStepOpen && selectedEbr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAdvanceStepOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="text-lg font-bold">توثيق خطوة التصنيع والتوقيع المزدوج</h3>
                <p className="text-xs text-muted-foreground">
                  الدفعة: <span className="font-mono font-bold text-foreground">{selectedEbr.batch_lot}</span> ({selectedEbr.ebr_number})
                </p>
              </div>
            </div>

            <form onSubmit={handleAdvanceStep} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">الانتقال إلى المرحلة التالية</label>
                <select
                  value={stepData.next_step}
                  onChange={(e) => setStepData({ ...stepData, next_step: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="dispensing">الوزن والصرف (Dispensing & Weighing)</option>
                  <option value="granulation">التحبيب والتجفيف (High-Shear Granulation & FBD)</option>
                  <option value="blending">الخلط النهائي للبودرة (Final Blending)</option>
                  <option value="compression_filling">الكبس أو التعبئة (Tablet Compression / Capsule Filling)</option>
                  <option value="coating">الكسوة المغلفة (Film Coating)</option>
                  <option value="packaging_complete">التعبئة الثانوية والتغليف (Blister & Cartoning)</option>
                  <option value="qa_review">المراجعة النهائية للجودة (QA Review / Hold)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">الكمية الفعلية المحققة (Actual Yield)</label>
                <Input
                  type="number"
                  value={stepData.actual_yield}
                  onChange={(e) => setStepData({ ...stepData, actual_yield: Number(e.target.value) })}
                  required
                  className="font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">المشاهد المعتمد (Dual-Witness QA Sign-off)</label>
                <Input
                  value={stepData.witness_signoff_by}
                  onChange={(e) => setStepData({ ...stepData, witness_signoff_by: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">سبب التوقيع الإلكتروني 21 CFR Part 11</label>
                <Input
                  value={stepData.electronic_signature_reason}
                  onChange={(e) => setStepData({ ...stepData, electronic_signature_reason: e.target.value })}
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsAdvanceStepOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  اعتماد الخطوة وتوثيق التوقيع المزدوج
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: QP Release Sign-off */}
      {isNewQpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewQpOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Fingerprint className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold">توقيع الإفراج الدوائي الصيدلي (QP Disposition)</h3>
            </div>

            <form onSubmit={handleCreateQpRelease} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">دفعة التشغيل المستهدفة للإفراج</label>
                <select
                  value={qpData.ebr_id}
                  onChange={(e) => setQpData({ ...qpData, ebr_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ebrs.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.batch_lot} - {e.ebr_number} ({e.product_name || "منتج"}) [{e.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">اسم الصيدلي المؤهل (QP)</label>
                  <Input
                    value={qpData.qp_name}
                    onChange={(e) => setQpData({ ...qpData, qp_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم ترخيص مزاولة QP</label>
                  <Input
                    value={qpData.qp_license_no}
                    onChange={(e) => setQpData({ ...qpData, qp_license_no: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">قرار التحرير الدوائي</label>
                <select
                  value={qpData.release_status}
                  onChange={(e) => setQpData({ ...qpData, release_status: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="approved">اعتماد وإفراج للسوق (Approved for Market Release)</option>
                  <option value="rejected">رفض التشغيلة وإتلافها (Rejected / Quarantine for Destruction)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">حيثيات القرار ومطابقة المواصفات</label>
                <textarea
                  value={qpData.disposition_reason}
                  onChange={(e) => setQpData({ ...qpData, disposition_reason: e.target.value })}
                  rows={2}
                  className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">كلمة المرور لتأكيد التوقيع الرقمي (Part 11)</label>
                <Input
                  type="password"
                  value={qpData.signature_password}
                  onChange={(e) => setQpData({ ...qpData, signature_password: e.target.value })}
                  required
                  placeholder="أدخل كلمة المرور لتوليد SHA-256 Hash"
                  className="font-mono mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewQpOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  توليد التوقيع الرقمي وإفراج الدفعة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Deviation / CAPA */}
      {isNewDeviationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewDeviationOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h3 className="text-lg font-bold">تسجيل انحراف تشغيلي دوائي وتكليف CAPA</h3>
            </div>

            <form onSubmit={handleCreateDeviation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مرجع الانحراف</label>
                  <Input
                    value={devData.deviation_ref}
                    onChange={(e) => setDevData({ ...devData, deviation_ref: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الدرجة (Severity)</label>
                  <select
                    value={devData.deviation_type}
                    onChange={(e) => setDevData({ ...devData, deviation_type: e.target.value })}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="minor">طفيف (Minor)</option>
                    <option value="major">رئيسي (Major)</option>
                    <option value="critical">حرج (Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">تصنيف السبب الجذري (Root Cause Category)</label>
                <select
                  value={devData.root_cause_category}
                  onChange={(e) => setDevData({ ...devData, root_cause_category: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Equipment">أعطال أو معايرة المعدات (Equipment)</option>
                  <option value="Human Error">خطأ بشري أو تدريب (Human Error)</option>
                  <option value="Material">مادة خام أو مورد (Raw Material)</option>
                  <option value="Procedure">إجراء تشغيل قياسي SOP (Procedure)</option>
                  <option value="Environmental">بيئة الغرفة النظيفة والتهوية (HVAC / Cleanroom)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">تفاصيل الانحراف والتحقيق الأولي</label>
                <textarea
                  value={devData.root_cause_details}
                  onChange={(e) => setDevData({ ...devData, root_cause_details: e.target.value })}
                  rows={2}
                  required
                  className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">خطة الإجراءات التصحيحية والوقائية (CAPA)</label>
                <textarea
                  value={devData.capa_action_plan}
                  onChange={(e) => setDevData({ ...devData, capa_action_plan: e.target.value })}
                  rows={2}
                  required
                  className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مسؤول الجودة QA المعين</label>
                  <Input
                    value={devData.assigned_qa_lead}
                    onChange={(e) => setDevData({ ...devData, assigned_qa_lead: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الموعد المستهدف للإغلاق</label>
                  <Input
                    type="date"
                    value={devData.target_completion_date}
                    onChange={(e) => setDevData({ ...devData, target_completion_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewDeviationOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                  تسجيل الانحراف وتفعيل CAPA
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New CIP Line Clearance */}
      {isNewCipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewCipOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-bold">تسجيل محضر تطهير CIP وخلو الخط الدوائي</h3>
            </div>

            <form onSubmit={handleCreateCip} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">المفاعل أو الوعاء المستهدف (Vessel)</label>
                <Input
                  value={cipData.vessel_name}
                  onChange={(e) => setCipData({ ...cipData, vessel_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المستحضر السابق</label>
                  <Input
                    value={cipData.previous_product}
                    onChange={(e) => setCipData({ ...cipData, previous_product: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المستحضر اللاحق</label>
                  <Input
                    value={cipData.next_product}
                    onChange={(e) => setCipData({ ...cipData, next_product: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">محاليل التطهير ودورات الشطف بالماء فائق النقاء</label>
                <Input
                  value={cipData.cleaning_agent}
                  onChange={(e) => setCipData({ ...cipData, cleaning_agent: e.target.value })}
                  required
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">التوصيلية النهائية (µS/cm)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cipData.rinse_conductivity_us}
                    onChange={(e) => setCipData({ ...cipData, rinse_conductivity_us: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نتيجة مسحة التلوث TOC / Swab</label>
                  <Input
                    value={cipData.swab_test_result}
                    onChange={(e) => setCipData({ ...cipData, swab_test_result: e.target.value })}
                    required
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مسؤول توقيع خلو الخط</label>
                  <Input
                    value={cipData.line_clearance_signoff_by}
                    onChange={(e) => setCipData({ ...cipData, line_clearance_signoff_by: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ ووقت التطهير</label>
                  <Input
                    value={cipData.cleaned_at}
                    onChange={(e) => setCipData({ ...cipData, cleaned_at: e.target.value })}
                    required
                    className="mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewCipOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  اعتماد خلو الخط والسماح بالتشغيل
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Stability Study */}
      {isNewStabilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewStabilityOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold">تسجيل فحص ثبات كبينة Zone IVb</h3>
            </div>

            <form onSubmit={handleCreateStability} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مرجع الدراسة</label>
                  <Input
                    value={stabData.study_ref}
                    onChange={(e) => setStabData({ ...stabData, study_ref: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود المستحضر الدوائي</label>
                  <Input
                    value={stabData.product_code}
                    onChange={(e) => setStabData({ ...stabData, product_code: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">ظروف الحفظ والكبينة المناخية</label>
                <Input
                  value={stabData.storage_condition}
                  onChange={(e) => setStabData({ ...stabData, storage_condition: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نقطة الفحص (شهور)</label>
                  <Input
                    type="number"
                    value={stabData.timepoint_months}
                    onChange={(e) => setStabData({ ...stabData, timepoint_months: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">العيار الدوائي Assay %</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stabData.assay_pct}
                    onChange={(e) => setStabData({ ...stabData, assay_pct: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">شوائب التحلل %</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stabData.degradation_products_pct}
                    onChange={(e) => setStabData({ ...stabData, degradation_products_pct: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">حالة النتيجة والمطابقة لدستور الأدوية</label>
                <select
                  value={stabData.status}
                  onChange={(e) => setStabData({ ...stabData, status: e.target.value as any })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="conforms">مطابق للمواصفات (Conforms to Specification)</option>
                  <option value="trending_down">انخفاض تدريجي ملحوظ (Trending Downward)</option>
                  <option value="out_of_specification">خارج حدود المواصفة (Out of Specification - OOS)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewStabilityOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  حفظ نتائج فحص الثبات
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
