import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
  Zap,
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

interface EngSummary {
  total_power_assets_count: number;
  total_generation_capacity_mw: number;
  current_output_mw: number;
  active_ptw_count: number;
  total_settled_mwh: number;
  total_ppa_billed_egp: number;
}

interface EngPowerAsset {
  id: string;
  asset_tag: string;
  asset_name: string;
  plant_name: string;
  system_type: string;
  rated_capacity_mw: number;
  installation_date: string;
  status: string;
  created_at?: string;
}

interface EngTelemetryLog {
  id: string;
  asset_id: string;
  asset_tag: string;
  asset_name: string;
  timestamp: string;
  active_power_mw: number;
  grid_frequency_hz: number;
  ambient_temperature_c: number;
  internal_temperature_c: number;
  efficiency_ratio_pct: number;
  curtailment_active: boolean;
}

interface EngPermitToWork {
  id: string;
  asset_id: string;
  asset_tag: string;
  ptw_number: string;
  work_type: string;
  description: string;
  lead_technician: string;
  safety_officer: string;
  loto_confirmed: boolean;
  valid_from: string;
  valid_to: string;
  status: string;
}

interface EngPpaBilling {
  id: string;
  billing_period: string;
  offtaker_name: string;
  delivered_mwh: number;
  peak_tariff_egp_per_mwh: number;
  off_peak_tariff_egp_per_mwh: number;
  total_billed_egp: number;
  curtailment_compensation_egp: number;
  status: string;
  created_at?: string;
}

interface EngHseIncident {
  id: string;
  incident_ref: string;
  incident_type: string;
  severity: string;
  location: string;
  description: string;
  corrective_action: string;
  reported_by: string;
  incident_date: string;
  status: string;
}

export default function EnergyPowerPlantPage() {
  const [activeTab, setActiveTab] = useState<
    "assets" | "telemetry" | "ptw" | "ppa" | "incidents"
  >("assets");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isPtwModalOpen, setIsPtwModalOpen] = useState(false);
  const [isPpaModalOpen, setIsPpaModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Form states
  const [assetForm, setAssetForm] = useState({
    asset_tag: "",
    asset_name: "",
    plant_name: "مجمع بنبان للطاقة الشمسية - قطاع بنبان 4",
    system_type: "solar_pv_inverter",
    rated_capacity_mw: 5.0,
    installation_date: new Date().toISOString().split("T")[0],
    status: "online",
  });

  const [telemetryForm, setTelemetryForm] = useState({
    asset_id: "",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    active_power_mw: 4.85,
    grid_frequency_hz: 50.02,
    ambient_temperature_c: 32.5,
    internal_temperature_c: 48.0,
    efficiency_ratio_pct: 98.4,
    curtailment_active: false,
  });

  const [ptwForm, setPtwForm] = useState({
    asset_id: "",
    ptw_number: "",
    work_type: "high_voltage_isolation",
    description: "",
    lead_technician: "",
    safety_officer: "مسؤول السلامة والصحة المهنية (HSE)",
    loto_confirmed: true,
    valid_from: new Date().toISOString().split("T")[0] + " 08:00",
    valid_to: new Date().toISOString().split("T")[0] + " 17:00",
    status: "active",
  });

  const [ppaForm, setPpaForm] = useState({
    billing_period: "2026-Q1",
    offtaker_name: "الشركة المصرية لنقل الكهرباء (EETC)",
    delivered_mwh: 7500,
    peak_tariff_egp_per_mwh: 1450,
    off_peak_tariff_egp_per_mwh: 980,
    total_billed_egp: 0,
    curtailment_compensation_egp: 120000,
    status: "approved",
  });

  const [incidentForm, setIncidentForm] = useState({
    incident_ref: "",
    incident_type: "near_miss",
    severity: "low",
    location: "ساحة المحولات الرئيسية 220kV",
    description: "",
    corrective_action: "",
    reported_by: "",
    incident_date: new Date().toISOString().split("T")[0],
    status: "closed",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery<EngSummary>({
    queryKey: ["eng-summary"],
    queryFn: () => api.get<EngSummary>("/eng/summary"),
  });

  const { data: assets = [], isLoading: isAssetsLoading, refetch: refetchAssets } = useQuery<EngPowerAsset[]>({
    queryKey: ["eng-assets"],
    queryFn: () => api.get<EngPowerAsset[]>("/eng/assets"),
  });

  const { data: telemetry = [], isLoading: isTelemetryLoading, refetch: refetchTelemetry } = useQuery<EngTelemetryLog[]>({
    queryKey: ["eng-telemetry"],
    queryFn: () => api.get<EngTelemetryLog[]>("/eng/telemetry"),
  });

  const { data: ptws = [], isLoading: isPtwsLoading, refetch: refetchPtws } = useQuery<EngPermitToWork[]>({
    queryKey: ["eng-ptws"],
    queryFn: () => api.get<EngPermitToWork[]>("/eng/ptws"),
  });

  const { data: ppas = [], isLoading: isPpasLoading, refetch: refetchPpas } = useQuery<EngPpaBilling[]>({
    queryKey: ["eng-ppa-billings"],
    queryFn: () => api.get<EngPpaBilling[]>("/eng/ppa-billings"),
  });

  const { data: incidents = [], isLoading: isIncidentsLoading, refetch: refetchIncidents } = useQuery<EngHseIncident[]>({
    queryKey: ["eng-incidents"],
    queryFn: () => api.get<EngHseIncident[]>("/eng/incidents"),
  });

  const refreshAll = () => {
    sound.click();
    refetchSummary();
    refetchAssets();
    refetchTelemetry();
    refetchPtws();
    refetchPpas();
    refetchIncidents();
    toast("success", "تم تحديث كافة بيانات محطات الطاقة والشبكة الكهربائية");
  };

  // Handlers
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/eng/assets", assetForm);
      toast("success", "تم تسجيل الأصل وموقعه الوظيفي (KKS Tag) بنجاح");
      setIsAssetModalOpen(false);
      refetchAssets();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل الأصل الهندسي");
    }
  };

  const handleCreateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/eng/telemetry", telemetryForm);
      toast("success", "تم إرسال قراءات SCADA / التردد الكهربائي بنجاح");
      setIsTelemetryModalOpen(false);
      refetchTelemetry();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل قراءات SCADA");
    }
  };

  const handleCreatePtw = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/eng/ptws", ptwForm);
      toast("success", "تم إصدار تصريح العمل وتأكيد العزل الآمن (LOTO)");
      setIsPtwModalOpen(false);
      refetchPtws();
      refetchSummary();
    } catch {
      toast("error", "فشل إصدار تصريح العمل");
    }
  };

  const handleCreatePpa = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/eng/ppa-billings", ppaForm);
      toast("success", "تم توثيق فاتورة تسوية اتفاقية شراء الطاقة (PPA)");
      setIsPpaModalOpen(false);
      refetchPpas();
      refetchSummary();
    } catch {
      toast("error", "فشل إصدار تسوية PPA");
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/eng/incidents", incidentForm);
      toast("success", "تم تسجيل تقرير السلامة والصحة المهنية (OSHA / CEMS)");
      setIsIncidentModalOpen(false);
      refetchIncidents();
    } catch {
      toast("error", "فشل تسجيل الحادثة البيئية");
    }
  };

  // Filters
  const filteredAssets = assets.filter(
    (a) =>
      a.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      a.plant_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTelemetry = telemetry.filter(
    (t) =>
      t.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
      t.asset_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPtws = ptws.filter(
    (p) =>
      p.ptw_number.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.lead_technician.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPpas = ppas.filter(
    (b) =>
      b.billing_period.toLowerCase().includes(search.toLowerCase()) ||
      b.offtaker_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.incident_ref.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      inc.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                إدارة محطات توليد الطاقة والشبكات الكهربائية (ENG)
              </h1>
              <p className="text-sm text-zinc-400">
                الشجرة الوظيفية (ISO 14224 / KKS)، قراءات SCADA، تصاريح العمل والعزل (PTW/LOTO)، وتسويات PPA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>

          {activeTab === "assets" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsAssetModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل أصل طاقة (KKS)
            </Button>
          )}

          {activeTab === "telemetry" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (assets.length > 0) {
                  setTelemetryForm((prev) => ({ ...prev, asset_id: assets[0].id }));
                }
                setIsTelemetryModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إرسال قراءة SCADA
            </Button>
          )}

          {activeTab === "ptw" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (assets.length > 0) {
                  setPtwForm((prev) => ({ ...prev, asset_id: assets[0].id }));
                }
                setIsPtwModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إصدار تصريح عمل (PTW)
            </Button>
          )}

          {activeTab === "ppa" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsPpaModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إنشاء تسوية PPA
            </Button>
          )}

          {activeTab === "incidents" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsIncidentModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إبلاغ عن واقعة HSE / CEMS
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">أصول التوليد والتحويل</span>
            <Cpu className="h-4 w-4 text-amber-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {summary?.total_power_assets_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">مكون KKS</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">السعة التصميمية الكلية</span>
            <BatteryCharging className="h-4 w-4 text-blue-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-blue-400">
                {summary?.total_generation_capacity_mw ?? 0}
              </span>
              <span className="text-xs text-zinc-500">ميجاوات (MW)</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">الإنتاج اللحظي (SCADA)</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-emerald-400">
                {summary?.current_output_mw ?? 0}
              </span>
              <span className="text-xs text-zinc-500">MW حالياً</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">تصاريح العمل والعزل (LOTO)</span>
            <Lock className="h-4 w-4 text-rose-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-rose-400">
                {summary?.active_ptw_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">تصريح نشط</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">الطاقة المسلمة للشبكة</span>
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-purple-400">
                {(summary?.total_settled_mwh ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">MWh</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">مفوتر اتفاقية PPA</span>
            <FileSpreadsheet className="h-4 w-4 text-amber-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <div className="mt-2">
              <div className="font-mono text-lg font-bold text-white">
                {(summary?.total_ppa_billed_egp ?? 0).toLocaleString()}
              </div>
              <span className="text-xs text-zinc-500">ج.م للمشتري</span>
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              sound.click();
              setActiveTab("assets");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "assets"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Cpu className="h-4 w-4" />
            أصول المحطة والمواقع الوظيفية (KKS)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("telemetry");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "telemetry"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Activity className="h-4 w-4" />
            مراقبة التردد والإنتاج اللحظي (SCADA)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("ptw");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "ptw"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Lock className="h-4 w-4" />
            تصاريح العمل وإجراءات العزل (PTW/LOTO)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("ppa");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "ppa"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            اتفاقيات شراء الطاقة وتسوية التعرفة (PPA)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("incidents");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "incidents"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            سجل السلامة والإنبعاثات (HSE / CEMS)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="بحث وتصفية السجلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-800 bg-zinc-900/60 pr-9 text-sm text-zinc-200 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Tab 1: Functional Location Assets (KKS) */}
      {activeTab === "assets" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                الشجرة الوظيفية وأصول المحطة (ISO 14224 / KKS)
              </h2>
              <p className="text-xs text-zinc-400">
                العواكس الشمسية، التوربينات الغازية، والمحولات الرئيسية 220kV مع السعة التصميمية
              </p>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              {filteredAssets.length} أصل كهربائي
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رمز الأصل (KKS Tag)</TableHead>
                  <TableHead className="text-zinc-400">اسم المكون الهندسي</TableHead>
                  <TableHead className="text-zinc-400">اسم المحطة</TableHead>
                  <TableHead className="text-zinc-400">نوع النظام</TableHead>
                  <TableHead className="text-zinc-400">السعة الاسمية (MW)</TableHead>
                  <TableHead className="text-zinc-400">تاريخ التركيب والربط</TableHead>
                  <TableHead className="text-zinc-400">الحالة التشغيلية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAssetsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAssets.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                      لا توجد أصول مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((a) => (
                    <TableRow key={a.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {a.asset_tag}
                      </TableCell>
                      <TableCell className="font-medium text-white">{a.asset_name}</TableCell>
                      <TableCell className="text-zinc-300">{a.plant_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-zinc-800 text-zinc-300 text-xs"
                        >
                          {a.system_type === "solar_pv_inverter"
                            ? "عاكس شمسي مركزي (PV Inverter)"
                            : a.system_type === "gas_turbine"
                            ? "توربينة غازية دورة مركبة"
                            : a.system_type === "stepup_transformer"
                            ? "محول رفع جهد Step-Up"
                            : "محطة تفريغ وربط شبكي"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-blue-400">
                        {a.rated_capacity_mw} MW
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {a.installation_date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            a.status === "online"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : a.status === "standby"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }
                        >
                          {a.status === "online"
                            ? "متصل بالشبكة (Online)"
                            : a.status === "standby"
                            ? "جاهزية احتياطية (Standby)"
                            : "عطل / صيانة"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 2: SCADA & IoT Telemetry */}
      {activeTab === "telemetry" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                قراءات منظومة SCADA والمراقبة اللحظية
              </h2>
              <p className="text-xs text-zinc-400">
                تسجيل استقرار تردد الشبكة (50 Hz)، كفاءة التحويل، درجات الحرارة الداخلية، وحالات خفض الحمل القسري (Curtailment)
              </p>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {filteredTelemetry.length} قراءة SCADA
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">المكون والأصل</TableHead>
                  <TableHead className="text-zinc-400">وقت القراءة اللحظية</TableHead>
                  <TableHead className="text-zinc-400">القدرة الفعالة (MW)</TableHead>
                  <TableHead className="text-zinc-400">تردد الشبكة (Hz)</TableHead>
                  <TableHead className="text-zinc-400">الحرارة المحيطة / الداخلية</TableHead>
                  <TableHead className="text-zinc-400">كفاءة الأداء (PR %)</TableHead>
                  <TableHead className="text-zinc-400">أوامر الخفض (Curtailment)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTelemetryLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredTelemetry.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                      لا توجد قراءات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTelemetry.map((t) => (
                    <TableRow key={t.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-amber-400">{t.asset_tag}</div>
                        <div className="text-xs text-white">{t.asset_name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {t.timestamp}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {t.active_power_mw} MW
                      </TableCell>
                      <TableCell className="font-mono text-sm text-cyan-400">
                        {t.grid_frequency_hz} Hz
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {t.ambient_temperature_c}°C / {t.internal_temperature_c}°C
                      </TableCell>
                      <TableCell className="font-mono font-bold text-purple-400">
                        {t.efficiency_ratio_pct}%
                      </TableCell>
                      <TableCell>
                        {t.curtailment_active ? (
                          <Badge variant="destructive" className="text-xs">
                            أمر خفض سارٍ
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                            توليد كامل
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 3: Digital PTW & LOTO */}
      {activeTab === "ptw" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                تصاريح العمل وإجراءات العزل الآمن (PTW / LOTO)
              </h2>
              <p className="text-xs text-zinc-400">
                تصاريح الجهد العالي (High Voltage)، الأعمال الساخنة، وتأكيد غلق المفاتيح وقفل العزل
              </p>
            </div>
            <Badge variant="outline" className="border-rose-500/30 text-rose-400">
              {filteredPtws.length} تصريح عمل
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم التصريح</TableHead>
                  <TableHead className="text-zinc-400">المعدة المعزولة</TableHead>
                  <TableHead className="text-zinc-400">نوع العمل والمخاطر</TableHead>
                  <TableHead className="text-zinc-400">وصف المهمة</TableHead>
                  <TableHead className="text-zinc-400">مهندس التنفيذ</TableHead>
                  <TableHead className="text-zinc-400">مسؤول السلامة</TableHead>
                  <TableHead className="text-zinc-400">تأكيد العزل LOTO</TableHead>
                  <TableHead className="text-zinc-400">فترة الصلاحية</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPtwsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPtws.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={9} className="py-8 text-center text-zinc-500">
                      لا توجد تصاريح عمل مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPtws.map((p) => (
                    <TableRow key={p.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {p.ptw_number}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {p.asset_tag}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-zinc-800 text-zinc-300 text-xs"
                        >
                          {p.work_type === "high_voltage_isolation"
                            ? "عزل جهد كهربي عالي"
                            : p.work_type === "hot_work"
                            ? "أعمال لهب ولحام ساخنة"
                            : p.work_type === "confined_space"
                            ? "دخول أماكن محصورة"
                            : "عمرة سنوية شاملة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs max-w-xs truncate">
                        {p.description}
                      </TableCell>
                      <TableCell className="text-zinc-200 text-xs">{p.lead_technician}</TableCell>
                      <TableCell className="text-zinc-400 text-xs">{p.safety_officer}</TableCell>
                      <TableCell>
                        {p.loto_confirmed ? (
                          <span className="flex items-center gap-1 font-mono text-xs text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> LOTO مؤكد
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-rose-400">
                            <AlertTriangle className="h-3.5 w-3.5" /> عزل غير مكتمل
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {p.valid_from} إلى {p.valid_to}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            p.status === "active"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }
                        >
                          {p.status === "active" ? "سارٍ تحت العزل" : "مكتمل ومغلق"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 4: PPA Agreements & Offtaker Billing */}
      {activeTab === "ppa" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                اتفاقيات شراء الطاقة وتسوية التعرفة (PPA Billing)
              </h2>
              <p className="text-xs text-zinc-400">
                تسوية الكميات المصدرة للشبكة، تعرفة الذروة وخارج الذروة، وتعويضات خفض التوليد
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              {filteredPpas.length} تسوية مفوترة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">فترة التسوية</TableHead>
                  <TableHead className="text-zinc-400">المشتري (Off-taker)</TableHead>
                  <TableHead className="text-zinc-400">الطاقة المسلمة (MWh)</TableHead>
                  <TableHead className="text-zinc-400">تعرفة الذروة / MWh</TableHead>
                  <TableHead className="text-zinc-400">تعرفة خارج الذروة / MWh</TableHead>
                  <TableHead className="text-zinc-400">تعويضات الخفض القسري</TableHead>
                  <TableHead className="text-zinc-400">الإجمالي المفوتر (ج.م)</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPpasLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPpas.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد تسويات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPpas.map((b) => (
                    <TableRow key={b.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {b.billing_period}
                      </TableCell>
                      <TableCell className="font-medium text-white">{b.offtaker_name}</TableCell>
                      <TableCell className="font-mono font-bold text-purple-400">
                        {b.delivered_mwh.toLocaleString()} MWh
                      </TableCell>
                      <TableCell className="font-mono text-zinc-300">
                        {b.peak_tariff_egp_per_mwh} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-zinc-400">
                        {b.off_peak_tariff_egp_per_mwh} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-emerald-400">
                        {b.curtailment_compensation_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono font-bold text-white">
                        {b.total_billed_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {b.status === "approved"
                            ? "معتمدة للمطالبة"
                            : b.status === "settled"
                            ? "تمت التسوية"
                            : b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 5: HSE Incidents & CEMS Emissions */}
      {activeTab === "incidents" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                سجل السلامة المهنية ومراقبة الإنبعاثات (HSE / CEMS)
              </h2>
              <p className="text-xs text-zinc-400">
                تسجيل الحوادث الوشيكة (Near-Miss)، انبعاثات غازات المداخن، والإجراءات التصحيحية المعتمدة
              </p>
            </div>
            <Badge variant="outline" className="border-rose-500/30 text-rose-400">
              {filteredIncidents.length} سجل سلامة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم البلاغ</TableHead>
                  <TableHead className="text-zinc-400">نوع الواقعة</TableHead>
                  <TableHead className="text-zinc-400">مستوى الخطورة</TableHead>
                  <TableHead className="text-zinc-400">الموقع</TableHead>
                  <TableHead className="text-zinc-400">وصف الحادثة</TableHead>
                  <TableHead className="text-zinc-400">الإجراء التصحيحي المتخذ</TableHead>
                  <TableHead className="text-zinc-400">تاريخ الواقعة</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isIncidentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredIncidents.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد بلاغات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((inc) => (
                    <TableRow key={inc.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {inc.incident_ref}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-zinc-800 text-zinc-300 text-xs"
                        >
                          {inc.incident_type === "near_miss"
                            ? "حادثة وشيكة (Near-Miss)"
                            : inc.incident_type === "cems_emission_alert"
                            ? "تنبيه انبعاثات مداخن CEMS"
                            : inc.incident_type === "environmental_spill"
                            ? "تسريب بيئي"
                            : "إصابة عمل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            inc.severity === "critical"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : inc.severity === "medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }
                        >
                          {inc.severity === "critical"
                            ? "حرجة"
                            : inc.severity === "medium"
                            ? "متوسطة"
                            : "منخفضة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs">{inc.location}</TableCell>
                      <TableCell className="text-zinc-300 text-xs max-w-xs truncate">{inc.description}</TableCell>
                      <TableCell className="text-zinc-400 text-xs max-w-xs truncate">{inc.corrective_action}</TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">{inc.incident_date}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            inc.status === "closed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }
                        >
                          {inc.status === "closed" ? "مغلقة / مصححة" : "قيد التحقيق"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Modal: New Power Asset */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">تسجيل أصل توليد / محول طاقة (KKS)</h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAsset} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رمز الأصل الموحد (KKS Tag)</label>
                  <Input
                    required
                    value={assetForm.asset_tag}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })}
                    placeholder="مثال: 10GS-INV-03"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نوع النظام</label>
                  <select
                    value={assetForm.system_type}
                    onChange={(e) => setAssetForm({ ...assetForm, system_type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="solar_pv_inverter">عاكس شمسي مركزي (PV Inverter)</option>
                    <option value="gas_turbine">توربينة غازية</option>
                    <option value="stepup_transformer">محول رفع جهد Step-Up</option>
                    <option value="grid_substation">محطة محولات وربط شبكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم المكون الهندسي</label>
                <Input
                  required
                  value={assetForm.asset_name}
                  onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })}
                  placeholder="مثال: عاكس مركزي SMA Sunny Central 4.4MW"
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم المحطة والموقع</label>
                <Input
                  required
                  value={assetForm.plant_name}
                  onChange={(e) => setAssetForm({ ...assetForm, plant_name: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">السعة التصميمية (MW)</label>
                  <Input
                    type="number"
                    value={assetForm.rated_capacity_mw}
                    onChange={(e) =>
                      setAssetForm({
                        ...assetForm,
                        rated_capacity_mw: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تاريخ التركيب والربط</label>
                  <Input
                    type="date"
                    value={assetForm.installation_date}
                    onChange={(e) =>
                      setAssetForm({ ...assetForm, installation_date: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsAssetModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ الأصل
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Telemetry Log */}
      {isTelemetryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إرسال قراءات تشغيلية (SCADA Log)</h3>
              <button
                onClick={() => setIsTelemetryModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTelemetry} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400">المعدة الكهربائية المستهدفة</label>
                <select
                  value={telemetryForm.asset_id}
                  onChange={(e) =>
                    setTelemetryForm({ ...telemetryForm, asset_id: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_tag} — {a.asset_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">القدرة الفعالة الحالية (MW)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={telemetryForm.active_power_mw}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        active_power_mw: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تردد الشبكة (Hz)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={telemetryForm.grid_frequency_hz}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        grid_frequency_hz: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">حرارة الجو (°C)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={telemetryForm.ambient_temperature_c}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        ambient_temperature_c: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">حرارة المحول / العاكس (°C)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={telemetryForm.internal_temperature_c}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        internal_temperature_c: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">كفاءة التحويل (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={telemetryForm.efficiency_ratio_pct}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        efficiency_ratio_pct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="curtailment"
                    checked={telemetryForm.curtailment_active}
                    onChange={(e) =>
                      setTelemetryForm({ ...telemetryForm, curtailment_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="curtailment" className="text-xs text-zinc-300">
                    أمر خفض قدرة التوليد (Curtailment Active)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTelemetryModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  إرسال القراءات
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Permit to Work */}
      {isPtwModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إصدار تصريح عمل وعزل آمن (PTW / LOTO)</h3>
              <button
                onClick={() => setIsPtwModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePtw} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">المعدة المطلوب عزلها</label>
                  <select
                    value={ptwForm.asset_id}
                    onChange={(e) => setPtwForm({ ...ptwForm, asset_id: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} — {a.asset_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رقم التصريح</label>
                  <Input
                    required
                    value={ptwForm.ptw_number}
                    onChange={(e) => setPtwForm({ ...ptwForm, ptw_number: e.target.value })}
                    placeholder="مثال: PTW-2026-HV-02"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">نوع العمل والمخاطر</label>
                  <select
                    value={ptwForm.work_type}
                    onChange={(e) => setPtwForm({ ...ptwForm, work_type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="high_voltage_isolation">عزل جهد كهربائي عالي (HV)</option>
                    <option value="hot_work">أعمال ساخنة ولحام</option>
                    <option value="confined_space">دخول أماكن محصورة</option>
                    <option value="inverter_annual_overhaul">عمرة شاملة وصيانة وقائية</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">مهندس التنفيذ المسؤول</label>
                  <Input
                    required
                    value={ptwForm.lead_technician}
                    onChange={(e) =>
                      setPtwForm({ ...ptwForm, lead_technician: e.target.value })
                    }
                    placeholder="اسم المهندس / الفني"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">وصف نطاق العمل وخطوات العزل</label>
                <textarea
                  required
                  rows={3}
                  value={ptwForm.description}
                  onChange={(e) => setPtwForm({ ...ptwForm, description: e.target.value })}
                  placeholder="فصل قواطع الدائرة ووضع أقفال وبطاقات التحذير LOTO..."
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="loto"
                  checked={ptwForm.loto_confirmed}
                  onChange={(e) => setPtwForm({ ...ptwForm, loto_confirmed: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="loto" className="text-xs text-zinc-300">
                  تأكيد إتمام إجراءات القفل والوسم والعزل الميداني (LOTO Lockout Confirmed)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsPtwModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  إصدار التصريح
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New PPA Billing */}
      {isPpaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إنشاء تسوية اتفاقية شراء الطاقة (PPA)</h3>
              <button
                onClick={() => setIsPpaModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePpa} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">فترة التسوية</label>
                  <Input
                    required
                    value={ppaForm.billing_period}
                    onChange={(e) => setPpaForm({ ...ppaForm, billing_period: e.target.value })}
                    placeholder="مثال: 2026-Q1 أو 2026-03"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الجهة المشترية (Off-taker)</label>
                  <Input
                    required
                    value={ppaForm.offtaker_name}
                    onChange={(e) => setPpaForm({ ...ppaForm, offtaker_name: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الطاقة المسلمة للشبكة (MWh)</label>
                  <Input
                    type="number"
                    value={ppaForm.delivered_mwh}
                    onChange={(e) =>
                      setPpaForm({
                        ...ppaForm,
                        delivered_mwh: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تعويضات الخفض القسري (ج.م)</label>
                  <Input
                    type="number"
                    value={ppaForm.curtailment_compensation_egp}
                    onChange={(e) =>
                      setPpaForm({
                        ...ppaForm,
                        curtailment_compensation_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">تعرفة أوقات الذروة (ج.م / MWh)</label>
                  <Input
                    type="number"
                    value={ppaForm.peak_tariff_egp_per_mwh}
                    onChange={(e) =>
                      setPpaForm({
                        ...ppaForm,
                        peak_tariff_egp_per_mwh: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تعرفة خارج الذروة (ج.م / MWh)</label>
                  <Input
                    type="number"
                    value={ppaForm.off_peak_tariff_egp_per_mwh}
                    onChange={(e) =>
                      setPpaForm({
                        ...ppaForm,
                        off_peak_tariff_egp_per_mwh: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsPpaModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ واعتماد التسوية
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Incident */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إبلاغ عن واقعة سلامة / بيئة (HSE / CEMS)</h3>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم البلاغ المرجعي</label>
                  <Input
                    required
                    value={incidentForm.incident_ref}
                    onChange={(e) =>
                      setIncidentForm({ ...incidentForm, incident_ref: e.target.value })
                    }
                    placeholder="مثال: HSE-2026-003"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نوع الواقعة</label>
                  <select
                    value={incidentForm.incident_type}
                    onChange={(e) =>
                      setIncidentForm({ ...incidentForm, incident_type: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="near_miss">حادثة وشيكة (Near-Miss)</option>
                    <option value="cems_emission_alert">تنبيه انبعاثات مداخن (CEMS)</option>
                    <option value="environmental_spill">تسريب سوائل عازلة / زيت</option>
                    <option value="first_aid">إسعافات أولية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">مستوى الخطورة</label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) =>
                      setIncidentForm({ ...incidentForm, severity: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">مرتفعة</option>
                    <option value="critical">حرجة جداً</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">مكان الواقعة</label>
                  <Input
                    required
                    value={incidentForm.location}
                    onChange={(e) =>
                      setIncidentForm({ ...incidentForm, location: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">وصف الحادثة</label>
                <textarea
                  required
                  rows={2}
                  value={incidentForm.description}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">الإجراء التصحيحي المتخذ</label>
                <textarea
                  required
                  rows={2}
                  value={incidentForm.corrective_action}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, corrective_action: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">المُبلّغ</label>
                <Input
                  required
                  value={incidentForm.reported_by}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, reported_by: e.target.value })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsIncidentModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  تسجيل الواقعة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
