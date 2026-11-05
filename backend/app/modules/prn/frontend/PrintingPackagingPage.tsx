import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CheckCircle2,
  Clock,
  Coins,
  Gauge,
  Layers,
  Palette,
  Percent,
  Plus,
  Printer,
  Scissors,
  Search,
  Settings2,
  Sparkles,
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

interface PrnSummary {
  active_job_dockets_count: number;
  completed_dockets_count: number;
  running_presses_count: number;
  total_presses_count: number;
  total_sheets_allocated: number;
  average_spoilage_rate_pct: number;
}

interface PrnImpositionPlan {
  sheet_size: string;
  pages_per_sheet: number;
  total_sheets_required: number;
  make_ready_sheets: number;
  expected_spoilage_pct: number;
  layout_type: string;
}

interface PrnJobDocket {
  id: string;
  docket_no: string;
  client_name: string;
  job_title: string;
  run_quantity: number;
  finished_dimensions: string;
  paper_type: string;
  gsm: number;
  colors: string;
  lamination: string;
  binding: string;
  status: "prepress" | "plate_ctp" | "on_press" | "postpress_finishing" | "packed_ready" | "delivered";
  delivery_deadline?: string;
  total_cost_egp: number;
  notes?: string;
  imposition?: PrnImpositionPlan;
  created_at?: string;
}

interface PrnPressMachine {
  id: string;
  machine_code: string;
  machine_name: string;
  machine_type: string;
  hourly_rate_egp: number;
  max_speed_sph: number;
  status: "idle" | "printing" | "make_ready" | "maintenance";
}

interface PrnInkFormula {
  id: string;
  docket_id?: string;
  ink_name: string;
  coverage_pct: number;
  estimated_ink_kg: number;
  actual_ink_kg: number;
  batch_lot: string;
}

interface PrnFinishingLog {
  id: string;
  docket_id: string;
  docket_no: string;
  job_title: string;
  operation_name: string;
  operator_name: string;
  completed_pieces: number;
  defective_pieces: number;
  machine_hours_spent: number;
  status: "in_progress" | "completed";
}

export default function PrintingPackagingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"dockets" | "imposition" | "machines" | "ink" | "finishing">("dockets");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isNewDocketOpen, setIsNewDocketOpen] = useState(false);
  const [isNewMachineOpen, setIsNewMachineOpen] = useState(false);
  const [isNewInkOpen, setIsNewInkOpen] = useState(false);
  const [isNewFinishingOpen, setIsNewFinishingOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState<PrnJobDocket | null>(null);

  // Form states
  const [newDocketData, setNewDocketData] = useState({
    docket_no: "JCK-2026-004",
    client_name: "شركة أوركيديا للأدوية",
    job_title: "علب كرتون دواء مستحضر أوجمنتين 625 مجم فورت مع صقل UV موضعي",
    run_quantity: 25000,
    finished_width_mm: 65,
    finished_height_mm: 120,
    paper_type: "دوبلكس كرتون أبيض رمادي (Duplex Board Grey Back)",
    gsm: 350,
    colors_front: "5C (CMYK + Pantone 286C)",
    colors_back: "1C (Black Pharmacopeia Warning)",
    lamination: "سلوفان مط حراري + يو في موضعي (Spot UV)",
    binding: "تكسير وريجة ولصق خطي أوتوماتيك (Die-Cut & Straight Glue)",
    delivery_deadline: "2026-11-12",
    total_cost_egp: 48500,
    notes: "يجب مراعاة اتجاه الألياف (Grain Direction) لتفادي تشقق الزوايا عند التكسير على بوبست.",
    sheet_size: "70 x 100 cm",
    pages_per_sheet: 16,
    sheet_yield_count: 16,
    total_sheets_required: 1800,
    make_ready_sheets: 250,
    expected_spoilage_pct: 3.8,
    layout_type: "Work & Back (شيت وايز)",
  });

  const [machineData, setMachineData] = useState({
    machine_code: "PRESS-04",
    machine_name: "KBA Rapida 106 - 6 ألوان + وحدة ورنيش (Coater)",
    machine_type: "offset_sheetfed",
    hourly_rate_egp: 2800,
    max_speed_sph: 18000,
    status: "idle",
  });

  const [inkData, setInkData] = useState({
    docket_id: "",
    ink_name: "Pantone 286 C (Royal Corporate Blue)",
    coverage_pct: 28.5,
    estimated_ink_kg: 8.4,
    actual_ink_kg: 7.9,
    batch_lot: "INK-PAN-286-99",
  });

  const [finishingData, setFinishingData] = useState({
    docket_id: "",
    operation_name: "تكسير وتفريغ على ماكينة بوبست (Bobst Novacut 106 Die-Cutter)",
    operator_name: "الأسطى أحمد رمضان",
    completed_pieces: 10000,
    defective_pieces: 85,
    machine_hours_spent: 3.2,
    status: "completed",
  });

  const [statusUpdate, setStatusUpdate] = useState({
    status: "on_press",
    total_cost_egp: 0,
    notes: "",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<PrnSummary>({
    queryKey: ["prn", "summary"],
    queryFn: () => api.get<PrnSummary>("/prn/summary"),
  });

  const { data: dockets = [], isLoading: isDocketsLoading } = useQuery<PrnJobDocket[]>({
    queryKey: ["prn", "dockets"],
    queryFn: () => api.get<PrnJobDocket[]>("/prn/dockets"),
  });

  const { data: machines = [], isLoading: isMachinesLoading } = useQuery<PrnPressMachine[]>({
    queryKey: ["prn", "machines"],
    queryFn: () => api.get<PrnPressMachine[]>("/prn/machines"),
  });

  const { data: inkFormulas = [], isLoading: isInkLoading } = useQuery<PrnInkFormula[]>({
    queryKey: ["prn", "ink-formulas"],
    queryFn: () => api.get<PrnInkFormula[]>("/prn/ink-formulas"),
  });

  const { data: finishingLogs = [], isLoading: isFinishingLoading } = useQuery<PrnFinishingLog[]>({
    queryKey: ["prn", "finishing-logs"],
    queryFn: () => api.get<PrnFinishingLog[]>("/prn/finishing-logs"),
  });

  // Handlers
  const handleCreateDocket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/prn/dockets", {
        docket_no: newDocketData.docket_no,
        client_name: newDocketData.client_name,
        job_title: newDocketData.job_title,
        run_quantity: Number(newDocketData.run_quantity),
        finished_width_mm: Number(newDocketData.finished_width_mm),
        finished_height_mm: Number(newDocketData.finished_height_mm),
        paper_type: newDocketData.paper_type,
        gsm: Number(newDocketData.gsm),
        colors_front: newDocketData.colors_front,
        colors_back: newDocketData.colors_back,
        lamination: newDocketData.lamination,
        binding: newDocketData.binding,
        delivery_deadline: newDocketData.delivery_deadline,
        total_cost_egp: Number(newDocketData.total_cost_egp),
        notes: newDocketData.notes,
        imposition: {
          sheet_size: newDocketData.sheet_size,
          pages_per_sheet: Number(newDocketData.pages_per_sheet),
          sheet_yield_count: Number(newDocketData.sheet_yield_count),
          total_sheets_required: Number(newDocketData.total_sheets_required),
          make_ready_sheets: Number(newDocketData.make_ready_sheets),
          expected_spoilage_pct: Number(newDocketData.expected_spoilage_pct),
          layout_type: newDocketData.layout_type,
        },
      });
      sound.click();
      toast("success", "تم إنشاء أمر تشغيل الطباعة وتذكرة العمل بنجاح");
      setIsNewDocketOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prn"] });
    } catch {
      toast("error", "فشل في تسجيل تذكرة الطباعة");
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocket) return;
    try {
      await api.post(`/prn/dockets/${selectedDocket.id}/status`, {
        status: statusUpdate.status,
        total_cost_egp: statusUpdate.total_cost_egp ? Number(statusUpdate.total_cost_egp) : undefined,
        notes: statusUpdate.notes,
      });
      sound.click();
      toast("success", "تم تحديث مرحلة تشغيل تذكرة الطباعة بنجاح");
      setIsStatusModalOpen(false);
      setSelectedDocket(null);
      queryClient.invalidateQueries({ queryKey: ["prn"] });
    } catch {
      toast("error", "فشل في تحديث حالة التذكرة");
    }
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/prn/machines", {
        ...machineData,
        hourly_rate_egp: Number(machineData.hourly_rate_egp),
        max_speed_sph: Number(machineData.max_speed_sph),
      });
      sound.click();
      toast("success", "تم تسجيل ماكينة الطباعة وحساب معدل الساعة MHR");
      setIsNewMachineOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prn"] });
    } catch {
      toast("error", "فشل في تسجيل الماكينة");
    }
  };

  const handleCreateInk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/prn/ink-formulas", {
        ...inkData,
        docket_id: inkData.docket_id || undefined,
        coverage_pct: Number(inkData.coverage_pct),
        estimated_ink_kg: Number(inkData.estimated_ink_kg),
        actual_ink_kg: Number(inkData.actual_ink_kg),
      });
      sound.click();
      toast("success", "تم حفظ تركيبة الحبر ومعدل التغطية المقدر");
      setIsNewInkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prn"] });
    } catch {
      toast("error", "فشل في تسجيل الحبر");
    }
  };

  const handleCreateFinishing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishingData.docket_id) {
      toast("error", "يرجى اختيار أمر التشغيل المستهدف");
      return;
    }
    try {
      await api.post("/prn/finishing-logs", {
        ...finishingData,
        completed_pieces: Number(finishingData.completed_pieces),
        defective_pieces: Number(finishingData.defective_pieces),
        machine_hours_spent: Number(finishingData.machine_hours_spent),
      });
      sound.click();
      toast("success", "تم تسجيل عملية ما بعد الطباعة والتشطيب");
      setIsNewFinishingOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prn"] });
    } catch {
      toast("error", "فشل في تسجيل التشطيب");
    }
  };

  const filteredDockets = dockets.filter(
    (d) =>
      d.docket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              الطباعة والتغليف والكرتون (Job Dockets & Press)
            </h1>
            <p className="text-sm text-muted-foreground">
              تذاكر العمل والهندسة الطباعية، مونتاج الفراخ (Imposition)، جدولة الماكينات ومعدل الساعة MHR، والتشطيب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "dockets" && (
            <Button
              onClick={() => {
                sound.click();
                setIsNewDocketOpen(true);
              }}
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4" />
              أمر طباعة جديد (Job Docket)
            </Button>
          )}

          {activeTab === "machines" && (
            <Button
              onClick={() => {
                sound.click();
                setIsNewMachineOpen(true);
              }}
              className="gap-2 bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700"
            >
              <Settings2 className="h-4 w-4" />
              إضافة ماكينة طباعة / تكسير
            </Button>
          )}

          {activeTab === "ink" && (
            <Button
              onClick={() => {
                sound.click();
                if (dockets.length > 0 && !inkData.docket_id) {
                  setInkData((prev) => ({ ...prev, docket_id: dockets[0].id }));
                }
                setIsNewInkOpen(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Palette className="h-4 w-4" />
              حساب تغذية وحبر بانتون
            </Button>
          )}

          {activeTab === "finishing" && (
            <Button
              onClick={() => {
                sound.click();
                if (dockets.length > 0 && !finishingData.docket_id) {
                  setFinishingData((prev) => ({ ...prev, docket_id: dockets[0].id }));
                }
                setIsNewFinishingOpen(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Scissors className="h-4 w-4" />
              توثيق تشطيب وتكسير
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">أوامر تشغيل نشطة</span>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.active_job_dockets_count ?? 0}
          </div>
          <span className="text-xs text-muted-foreground">تذاكر قيد التنفيذ بالمطبعة</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">أوامر مسلمة للعملاء</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.completed_dockets_count ?? 0}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400">مكتملة ومفوترة</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">ماكينات قيد الدوران</span>
            <Gauge className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              `${summary?.running_presses_count ?? 0} / ${summary?.total_presses_count ?? 0}`
            )}
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400">أوفست / بوبست عاملة</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">إجمالي الفراخ المحجوزة</span>
            <Boxes className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.total_sheets_allocated?.toLocaleString() ?? 0}
          </div>
          <span className="text-xs text-muted-foreground">فراخ 70×100 / كوشيه ودوبلكس</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">متوسط نسبة الهالك والتجهيز</span>
            <Percent className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : `${summary?.average_spoilage_rate_pct ?? 0}%`}
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400">Make-Ready & Spoilage</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">إجمالي قيمة التذاكر EGP</span>
            <Coins className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono">
            {dockets.reduce((sum, d) => sum + (d.total_cost_egp || 0), 0).toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground">تكلفة الخامات وساعات التشغيل</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            sound.click();
            setActiveTab("dockets");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "dockets"
              ? "border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Printer className="h-4 w-4" />
          تذاكر وأوامر الطباعة (Job Dockets)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("imposition");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "imposition"
              ? "border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          تخطيط الفراخ والمونتاج (Imposition & Yield)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("machines");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "machines"
              ? "border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gauge className="h-4 w-4" />
          ماكينات الطباعة وتكلفة الساعة (MHR)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("ink");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "ink"
              ? "border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="h-4 w-4" />
          الأحبار ونسب التغطية (Ink & Pantone)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("finishing");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "finishing"
              ? "border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Scissors className="h-4 w-4" />
          التشطيب والتكسير واللصق (Post-Press Finishing)
        </button>
      </div>

      {/* Tab 1: Job Dockets */}
      {activeTab === "dockets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم التذكرة أو اسم العميل أو اسم المطبوع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold font-mono">{filteredDockets.length}</span> تذكرة تشغيل طباعية
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>العميل والمطبوع</TableHead>
                  <TableHead>الكمية والمقاس النهائي</TableHead>
                  <TableHead>مواصفات الخامة والجراماج</TableHead>
                  <TableHead>الألوان والسلوفان</TableHead>
                  <TableHead>حالة التشغيل</TableHead>
                  <TableHead>التكلفة الإجمالية</TableHead>
                  <TableHead>موعد التسليم</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDocketsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDockets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد تذاكر طباعة مطابقة لمعايير البحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDockets.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-mono font-bold text-orange-600 dark:text-orange-400">
                        {doc.docket_no}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{doc.client_name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">{doc.job_title}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className="font-bold">{doc.run_quantity.toLocaleString()}</span> قطعة
                        <div className="text-muted-foreground text-[11px]">{doc.finished_dimensions}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{doc.paper_type}</div>
                        <div className="font-mono text-muted-foreground text-[11px]">{doc.gsm} جم/م²</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {doc.colors}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{doc.lamination}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            doc.status === "delivered" || doc.status === "packed_ready"
                              ? "success"
                              : doc.status === "on_press"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {doc.status === "prepress"
                            ? "تجهيز فني / CTP"
                            : doc.status === "plate_ctp"
                            ? "إخراج زنكات CTP"
                            : doc.status === "on_press"
                            ? "قيد الطباعة على الماكينة"
                            : doc.status === "postpress_finishing"
                            ? "مرحلة التشطيب والتكسير"
                            : doc.status === "packed_ready"
                            ? "جاهز للتسليم والفرز"
                            : "تم التسليم للعميل"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs">
                        {doc.total_cost_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {doc.delivery_deadline || "—"}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            sound.click();
                            setSelectedDocket(doc);
                            setStatusUpdate({
                              status: doc.status,
                              total_cost_egp: doc.total_cost_egp,
                              notes: doc.notes || "",
                            });
                            setIsStatusModalOpen(true);
                          }}
                          className="gap-1 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 text-xs"
                        >
                          تحديث المرحلة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 2: Imposition Plans */}
      {activeTab === "imposition" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-orange-500/30 bg-orange-50/50 p-4 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-orange-900 dark:text-orange-300">
                  هندسة المونتاج واستغلال مسطح الورق (Sheet Imposition & Layout Optimization)
                </h4>
                <p className="text-xs text-orange-800/80 dark:text-orange-400/80 mt-1">
                  حساب عدد التكرارات في الفرخ الواحد (Sheet Yield)، فراخ التضبيط الأولي (Make-Ready Sheets) لضبط البنسة ومطابقة الألوان،
                  وتقدير نسبة الهالك الفني بما يضمن أعلى كفاءة خامات وتفادي فاقد كراتين التعبئة والعلب الدوائية والتجارية.
                </p>
              </div>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة والمطبوع</TableHead>
                  <TableHead>مقاس فرخ الورق</TableHead>
                  <TableHead>عدد النسخ بالفرخ (Yield)</TableHead>
                  <TableHead>أسلوب القلب والمونتاج</TableHead>
                  <TableHead>إجمالي الفراخ المحجوزة</TableHead>
                  <TableHead>فراخ التجهيز (Make-Ready)</TableHead>
                  <TableHead>نسبة الهالك المتوقعة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dockets.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                        {d.docket_no}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{d.job_title}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">
                      {d.imposition?.sheet_size || "70 x 100 cm"}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      <Badge variant="secondary">
                        {d.imposition?.pages_per_sheet || 8} نسخ/فرخ
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {d.imposition?.layout_type || "Work & Turn"}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {d.imposition?.total_sheets_required?.toLocaleString() || "—"} فرخ
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.imposition?.make_ready_sheets || 0} فرخ ضبط
                    </TableCell>
                    <TableCell className="font-mono">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {d.imposition?.expected_spoilage_pct || 3.0}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 3: Press Machines & MHR */}
      {activeTab === "machines" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل ماكينات الطباعة ومعدل تكلفة الساعة الميكانيكية (Machine Hourly Rate - MHR)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              إجمالي الماكينات: {machines.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود الماكينة</TableHead>
                  <TableHead>اسم الماكينة والوصف الفني</TableHead>
                  <TableHead>نوع الماكينة</TableHead>
                  <TableHead>معدل تكلفة الساعة (MHR)</TableHead>
                  <TableHead>السرعة القصوى (SPH)</TableHead>
                  <TableHead>الحالة التشغيلية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMachinesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : machines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد ماكينات مسجلة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  machines.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                        {m.machine_code}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{m.machine_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {m.machine_type === "offset_sheetfed"
                            ? "أوفست فراخ شيت"
                            : m.machine_type === "die_cutting"
                            ? "ماكينة تكسير وريجة"
                            : m.machine_type === "folder_gluer"
                            ? "ماكينة لصق علب أوتوماتيك"
                            : "فليكسو جرافيك"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {m.hourly_rate_egp.toLocaleString()} ج.م / ساعة
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {m.max_speed_sph.toLocaleString()} فرخ/ساعة
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.status === "printing"
                              ? "success"
                              : m.status === "make_ready"
                              ? "warning"
                              : m.status === "maintenance"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {m.status === "printing"
                            ? "طباعة مستمرة (Running)"
                            : m.status === "make_ready"
                            ? "تجهيز وتغيير زنكات"
                            : m.status === "maintenance"
                            ? "صيانة دورية"
                            : "جاهزة / خاملة (Idle)"}
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

      {/* Tab 4: Ink Formulations */}
      {activeTab === "ink" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل استهلاك وخلط الأحبار الخاصة وبانتون (Ink Coverage & Spot Formulations)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              الخلطات المسجلة: {inkFormulas.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>لون / اسم الحبر</TableHead>
                  <TableHead>رقم التشغيلة (Batch Lot)</TableHead>
                  <TableHead>نسبة التغطية على الفرخ (Coverage %)</TableHead>
                  <TableHead>الحبر المقدر (Estimated kg)</TableHead>
                  <TableHead>الحبر المستهلك الفعلي (Actual kg)</TableHead>
                  <TableHead>فرق الاستهلاك والحيود</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInkLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : inkFormulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد تركيبات أحبار مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  inkFormulas.map((ink) => {
                    const diff = ink.actual_ink_kg - ink.estimated_ink_kg;
                    return (
                      <TableRow key={ink.id}>
                        <TableCell className="font-medium text-xs flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-purple-500 inline-block" />
                          {ink.ink_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {ink.batch_lot}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs">{ink.coverage_pct}%</TableCell>
                        <TableCell className="font-mono text-xs">{ink.estimated_ink_kg} كجم</TableCell>
                        <TableCell className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                          {ink.actual_ink_kg} كجم
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span
                            className={
                              diff > 0
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : "text-emerald-600 dark:text-emerald-400 font-bold"
                            }
                          >
                            {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} كجم
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 5: Post-Press Finishing */}
      {activeTab === "finishing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل عمليات التشطيب وما بعد الطباعة (Folding, Die-Cutting & Gluing)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              سجلات التشطيب: {finishingLogs.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>العملية الفنية</TableHead>
                  <TableHead>الفني المشغل</TableHead>
                  <TableHead>القطع المكتملة السليمة</TableHead>
                  <TableHead>القطع التالفة (Defects)</TableHead>
                  <TableHead>ساعات التشغيل الفعلية</TableHead>
                  <TableHead>حالة المرحلة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFinishingLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : finishingLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات تشطيب مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  finishingLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                          {log.docket_no}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">{log.job_title}</div>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{log.operation_name}</TableCell>
                      <TableCell className="text-xs">{log.operator_name}</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {log.completed_pieces.toLocaleString()} قطعة
                      </TableCell>
                      <TableCell className="font-mono text-xs text-rose-600 dark:text-rose-400">
                        {log.defective_pieces} قطعة هالك
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.machine_hours_spent} ساعة</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "completed" ? "success" : "warning"}>
                          {log.status === "completed" ? "مكتملة ومفرزة" : "قيد التشغيل"}
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

      {/* Modal: New Job Docket */}
      {isNewDocketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 my-8">
            <button
              onClick={() => setIsNewDocketOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Printer className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-bold">إنشاء أمر طباعة وتذكرة تشغيل جديدة (Job Docket)</h3>
            </div>

            <form onSubmit={handleCreateDocket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم التذكرة (Docket No)</label>
                  <Input
                    value={newDocketData.docket_no}
                    onChange={(e) => setNewDocketData({ ...newDocketData, docket_no: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">اسم العميل</label>
                  <Input
                    value={newDocketData.client_name}
                    onChange={(e) => setNewDocketData({ ...newDocketData, client_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">عنوان واسم المطبوع / العبوة</label>
                <Input
                  value={newDocketData.job_title}
                  onChange={(e) => setNewDocketData({ ...newDocketData, job_title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الكمية المطلوبة (Run Qty)</label>
                  <Input
                    type="number"
                    value={newDocketData.run_quantity}
                    onChange={(e) => setNewDocketData({ ...newDocketData, run_quantity: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">العرض النهائي (مم)</label>
                  <Input
                    type="number"
                    value={newDocketData.finished_width_mm}
                    onChange={(e) => setNewDocketData({ ...newDocketData, finished_width_mm: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الارتفاع النهائي (مم)</label>
                  <Input
                    type="number"
                    value={newDocketData.finished_height_mm}
                    onChange={(e) => setNewDocketData({ ...newDocketData, finished_height_mm: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نوع خامة الورق / الكرتون</label>
                  <Input
                    value={newDocketData.paper_type}
                    onChange={(e) => setNewDocketData({ ...newDocketData, paper_type: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الوزن والجراماج (GSM)</label>
                  <Input
                    type="number"
                    value={newDocketData.gsm}
                    onChange={(e) => setNewDocketData({ ...newDocketData, gsm: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ألوان الوجه الأمامي</label>
                  <Input
                    value={newDocketData.colors_front}
                    onChange={(e) => setNewDocketData({ ...newDocketData, colors_front: e.target.value })}
                    required
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ألوان الوجه الخلفي</label>
                  <Input
                    value={newDocketData.colors_back}
                    onChange={(e) => setNewDocketData({ ...newDocketData, colors_back: e.target.value })}
                    required
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">السلوفان والمعالجة السطحية</label>
                  <Input
                    value={newDocketData.lamination}
                    onChange={(e) => setNewDocketData({ ...newDocketData, lamination: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">التجليد والتكسير والتقفيل</label>
                  <Input
                    value={newDocketData.binding}
                    onChange={(e) => setNewDocketData({ ...newDocketData, binding: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Imposition section */}
              <div className="rounded-lg border border-border p-3 bg-muted/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Layers className="h-4 w-4 text-orange-600" />
                  مواصفات المونتاج وتخطيط الفرخ (Imposition Specs)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">مقاس الفرخ</label>
                    <Input
                      value={newDocketData.sheet_size}
                      onChange={(e) => setNewDocketData({ ...newDocketData, sheet_size: e.target.value })}
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">عدد النسخ بالفرخ</label>
                    <Input
                      type="number"
                      value={newDocketData.pages_per_sheet}
                      onChange={(e) => setNewDocketData({ ...newDocketData, pages_per_sheet: Number(e.target.value) })}
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">الفراخ المطلوبة</label>
                    <Input
                      type="number"
                      value={newDocketData.total_sheets_required}
                      onChange={(e) => setNewDocketData({ ...newDocketData, total_sheets_required: Number(e.target.value) })}
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الموعد الأقصى للتسليم</label>
                  <Input
                    type="date"
                    value={newDocketData.delivery_deadline}
                    onChange={(e) => setNewDocketData({ ...newDocketData, delivery_deadline: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">التكلفة التقديرية (EGP)</label>
                  <Input
                    type="number"
                    value={newDocketData.total_cost_egp}
                    onChange={(e) => setNewDocketData({ ...newDocketData, total_cost_egp: Number(e.target.value) })}
                    className="mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewDocketOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  إنشاء تذكرة العمل وحجز الخامات
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Update Status */}
      {isStatusModalOpen && selectedDocket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="text-lg font-bold">تحديث مرحلة تذكرة الطباعة</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedDocket.docket_no}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">المرحلة الحالية في خط الإنتاج</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="prepress">تجهيز ومراجعة فنية (Prepress Proofing)</option>
                  <option value="plate_ctp">إخراج زنكات CTP (Computer to Plate)</option>
                  <option value="on_press">طباعة على الماكينة (On-Press Printing)</option>
                  <option value="postpress_finishing">تشطيب وتكسير وسلوفان (Finishing)</option>
                  <option value="packed_ready">مفروز وجاهز للتسليم (Packed & Ready)</option>
                  <option value="delivered">تم التسليم النهائي للعميل (Delivered)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">التكلفة الفعلية المحدثة (ج.م)</label>
                <Input
                  type="number"
                  value={statusUpdate.total_cost_egp}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, total_cost_egp: Number(e.target.value) })}
                  className="font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">ملاحظات التشغيل والإنتاج</label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  حفظ التحديث
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Machine */}
      {isNewMachineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewMachineOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-lg font-bold">تسجيل ماكينة طباعة / تكسير جديدة</h3>
            </div>

            <form onSubmit={handleCreateMachine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود الماكينة</label>
                  <Input
                    value={machineData.machine_code}
                    onChange={(e) => setMachineData({ ...machineData, machine_code: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نوع الماكينة</label>
                  <select
                    value={machineData.machine_type}
                    onChange={(e) => setMachineData({ ...machineData, machine_type: e.target.value })}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="offset_sheetfed">أوفست فراخ شيت (Sheetfed Offset)</option>
                    <option value="flexographic">فليكسوجرافيك رول (Flexo)</option>
                    <option value="die_cutting">ماكينة تكسير وريجة (Die-Cutting)</option>
                    <option value="folder_gluer">ماكينة لصق علب كرتون (Folder-Gluer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم الماكينة والموديل</label>
                <Input
                  value={machineData.machine_name}
                  onChange={(e) => setMachineData({ ...machineData, machine_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">معدل تكلفة الساعة EGP (MHR)</label>
                  <Input
                    type="number"
                    value={machineData.hourly_rate_egp}
                    onChange={(e) => setMachineData({ ...machineData, hourly_rate_egp: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">السرعة القصوى (SPH)</label>
                  <Input
                    type="number"
                    value={machineData.max_speed_sph}
                    onChange={(e) => setMachineData({ ...machineData, max_speed_sph: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewMachineOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700">
                  حفظ الماكينة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Ink Formula */}
      {isNewInkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewInkOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold">تسجيل حبر ومعدل تغطية لفرخ الطباعة</h3>
            </div>

            <form onSubmit={handleCreateInk} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">أمر التشغيل المرتبط</label>
                <select
                  value={inkData.docket_id}
                  onChange={(e) => setInkData({ ...inkData, docket_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">عام - غير مرتبط بتذكرة محددة</option>
                  {dockets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.docket_no} - {d.job_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">اسم الحبر / بانتون Spot</label>
                  <Input
                    value={inkData.ink_name}
                    onChange={(e) => setInkData({ ...inkData, ink_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم التشغيلة (Batch Lot)</label>
                  <Input
                    value={inkData.batch_lot}
                    onChange={(e) => setInkData({ ...inkData, batch_lot: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نسبة التغطية %</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inkData.coverage_pct}
                    onChange={(e) => setInkData({ ...inkData, coverage_pct: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الحبر المقدر (كجم)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inkData.estimated_ink_kg}
                    onChange={(e) => setInkData({ ...inkData, estimated_ink_kg: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الحبر الفعلي (كجم)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inkData.actual_ink_kg}
                    onChange={(e) => setInkData({ ...inkData, actual_ink_kg: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewInkOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  حفظ الحبر
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Finishing Log */}
      {isNewFinishingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewFinishingOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold">تسجيل عملية تشطيب وتكسير</h3>
            </div>

            <form onSubmit={handleCreateFinishing} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">أمر التشغيل المستهدف</label>
                <select
                  value={finishingData.docket_id}
                  onChange={(e) => setFinishingData({ ...finishingData, docket_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {dockets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.docket_no} - {d.job_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم العملية والماكينة</label>
                <Input
                  value={finishingData.operation_name}
                  onChange={(e) => setFinishingData({ ...finishingData, operation_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم الفني المشغل</label>
                <Input
                  value={finishingData.operator_name}
                  onChange={(e) => setFinishingData({ ...finishingData, operator_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">القطع السليمة</label>
                  <Input
                    type="number"
                    value={finishingData.completed_pieces}
                    onChange={(e) => setFinishingData({ ...finishingData, completed_pieces: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">القطع التالفة</label>
                  <Input
                    type="number"
                    value={finishingData.defective_pieces}
                    onChange={(e) => setFinishingData({ ...finishingData, defective_pieces: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ساعات الماكينة</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={finishingData.machine_hours_spent}
                    onChange={(e) => setFinishingData({ ...finishingData, machine_hours_spent: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewFinishingOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  حفظ سجل التشطيب
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
