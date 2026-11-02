import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Container,
  Cylinder,
  Database,
  DollarSign,
  Droplets,
  Flame,
  Gauge,
  Plus,
  RefreshCw,
  Search,
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

interface OilSummary {
  total_producing_wells_count: number;
  daily_crude_oil_production_bbl: number;
  daily_natural_gas_production_mmscfd: number;
  active_drilling_rigs_count: number;
  tank_farm_storage_volume_bbl: number;
  jv_cash_calls_due_egp: number;
}

interface OilWell {
  id: string;
  well_tag: string;
  well_name: string;
  concession_name: string;
  platform_or_pad: string;
  well_type: string;
  reservoir_formation: string;
  status: string;
  created_at?: string;
}

interface OilProduction {
  id: string;
  well_id: string;
  well_tag: string;
  well_name: string;
  log_date: string;
  gross_liquid_bbl: number;
  net_oil_bbl: number;
  gas_rate_mmscfd: number;
  water_cut_pct: number;
  tubing_pressure_psi: number;
  choke_size_64th: number;
}

interface OilDrillingReport {
  id: string;
  ddr_ref: string;
  rig_name: string;
  concession: string;
  report_date: string;
  current_depth_ft: number;
  footage_last_24h_ft: number;
  mud_weight_ppg: number;
  daily_rig_cost_egp: number;
  operations_summary: string;
  status: string;
  created_at?: string;
}

interface OilTank {
  id: string;
  tank_tag: string;
  terminal_location: string;
  product_type: string;
  gross_observed_volume_bbl: number;
  api_gravity: number;
  temperature_f: number;
  net_standard_volume_bbl: number;
  safe_fill_capacity_bbl: number;
  status: string;
  created_at?: string;
}

interface OilCashCall {
  id: string;
  cash_call_ref: string;
  concession: string;
  partner_company: string;
  working_interest_pct: number;
  billing_period: string;
  operating_expenditure_egp: number;
  capital_expenditure_egp: number;
  total_due_egp: number;
  status: string;
  created_at?: string;
}

export default function OilGasPage() {
  const [activeTab, setActiveTab] = useState<
    "wells" | "production" | "drilling" | "tanks" | "cash_calls"
  >("wells");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isWellModalOpen, setIsWellModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isDrillingModalOpen, setIsDrillingModalOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [isCashCallModalOpen, setIsCashCallModalOpen] = useState(false);

  // Form states
  const [wellForm, setWellForm] = useState({
    well_tag: "",
    well_name: "",
    concession_name: "امتياز خليج السويس - حقل مرجان",
    platform_or_pad: "منصة دلتا البحرية (Platform Delta)",
    well_type: "oil_producer",
    reservoir_formation: "تكوين كريم الجيري (Kareem Sandstone)",
    status: "producing",
  });

  const [productionForm, setProductionForm] = useState({
    well_id: "",
    log_date: new Date().toISOString().split("T")[0],
    gross_liquid_bbl: 4000,
    net_oil_bbl: 3500,
    gas_rate_mmscfd: 3.5,
    water_cut_pct: 12.5,
    tubing_pressure_psi: 1250,
    choke_size_64th: 32,
  });

  const [drillingForm, setDrillingForm] = useState({
    ddr_ref: "",
    rig_name: "بريمة الحفر البحرية كليوباترا 02",
    concession: "امتياز خليج السويس",
    report_date: new Date().toISOString().split("T")[0],
    current_depth_ft: 12850,
    footage_last_24h_ft: 140,
    mud_weight_ppg: 9.8,
    daily_rig_cost_egp: 450000,
    operations_summary: "حفر تجويف 8.5 بوصة في طبقة الحجر الجيري وسحب عينات صخرية",
    status: "drilling",
  });

  const [tankForm, setTankForm] = useState({
    tank_tag: "",
    terminal_location: "ميناء ومستودعات رأس غارب البترولية",
    product_type: "crude_oil_heavy",
    gross_observed_volume_bbl: 180000,
    api_gravity: 32.5,
    temperature_f: 85,
    net_standard_volume_bbl: 178500,
    safe_fill_capacity_bbl: 250000,
    status: "in_service",
  });

  const [cashCallForm, setCashCallForm] = useState({
    cash_call_ref: "",
    concession: "امتياز خليج السويس - حقل مرجان",
    partner_company: "بي بي العالمية (BP Exploration)",
    working_interest_pct: 50,
    billing_period: "2026-11",
    operating_expenditure_egp: 20000000,
    capital_expenditure_egp: 15000000,
    total_due_egp: 35000000,
    status: "approved",
  });

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<OilSummary>({
    queryKey: ["oil-summary"],
    queryFn: () => api.get<OilSummary>("/oil/summary"),
  });

  const {
    data: wells = [],
    isLoading: isWellsLoading,
    refetch: refetchWells,
  } = useQuery<OilWell[]>({
    queryKey: ["oil-wells"],
    queryFn: () => api.get<OilWell[]>("/oil/wells"),
  });

  const {
    data: productions = [],
    isLoading: isProductionsLoading,
    refetch: refetchProductions,
  } = useQuery<OilProduction[]>({
    queryKey: ["oil-productions"],
    queryFn: () => api.get<OilProduction[]>("/oil/productions"),
  });

  const {
    data: drillingReports = [],
    isLoading: isDrillingLoading,
    refetch: refetchDrilling,
  } = useQuery<OilDrillingReport[]>({
    queryKey: ["oil-drilling"],
    queryFn: () => api.get<OilDrillingReport[]>("/oil/drilling-reports"),
  });

  const {
    data: tanks = [],
    isLoading: isTanksLoading,
    refetch: refetchTanks,
  } = useQuery<OilTank[]>({
    queryKey: ["oil-tanks"],
    queryFn: () => api.get<OilTank[]>("/oil/tank-farms"),
  });

  const {
    data: cashCalls = [],
    isLoading: isCashCallsLoading,
    refetch: refetchCashCalls,
  } = useQuery<OilCashCall[]>({
    queryKey: ["oil-cash-calls"],
    queryFn: () => api.get<OilCashCall[]>("/oil/cash-calls"),
  });

  const handleRefresh = () => {
    sound.click();
    refetchSummary();
    refetchWells();
    refetchProductions();
    refetchDrilling();
    refetchTanks();
    refetchCashCalls();
    toast("success", "تم تحديث بيانات استخراج وإنتاج البترول والغاز");
  };

  const handleCreateWell = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/oil/wells", wellForm);
      toast("success", "تم تسجيل بئر الاستكشاف / الإنتاج بنجاح");
      setIsWellModalOpen(false);
      refetchWells();
      refetchSummary();
      setWellForm({
        well_tag: "",
        well_name: "",
        concession_name: "امتياز خليج السويس - حقل مرجان",
        platform_or_pad: "منصة دلتا البحرية (Platform Delta)",
        well_type: "oil_producer",
        reservoir_formation: "تكوين كريم الجيري (Kareem Sandstone)",
        status: "producing",
      });
    } catch {
      toast("error", "فشل تسجيل البئر");
    }
  };

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/oil/productions", productionForm);
      toast("success", "تم تسجيل سجل الإنتاج اليومي بنجاح");
      setIsProductionModalOpen(false);
      refetchProductions();
      refetchSummary();
      setProductionForm({
        well_id: "",
        log_date: new Date().toISOString().split("T")[0],
        gross_liquid_bbl: 4000,
        net_oil_bbl: 3500,
        gas_rate_mmscfd: 3.5,
        water_cut_pct: 12.5,
        tubing_pressure_psi: 1250,
        choke_size_64th: 32,
      });
    } catch {
      toast("error", "فشل تسجيل سجل الإنتاج");
    }
  };

  const handleCreateDrilling = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/oil/drilling-reports", drillingForm);
      toast("success", "تم اعتماد تقرير الحفر اليومي (DDR) بنجاح");
      setIsDrillingModalOpen(false);
      refetchDrilling();
      refetchSummary();
      setDrillingForm({
        ddr_ref: "",
        rig_name: "بريمة الحفر البحرية كليوباترا 02",
        concession: "امتياز خليج السويس",
        report_date: new Date().toISOString().split("T")[0],
        current_depth_ft: 12850,
        footage_last_24h_ft: 140,
        mud_weight_ppg: 9.8,
        daily_rig_cost_egp: 450000,
        operations_summary: "حفر تجويف 8.5 بوصة في طبقة الحجر الجيري وسحب عينات صخرية",
        status: "drilling",
      });
    } catch {
      toast("error", "فشل اعتماد تقرير الحفر");
    }
  };

  const handleCreateTank = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/oil/tank-farms", tankForm);
      toast("success", "تم تسجيل خزان التخزين والمستودع بنجاح");
      setIsTankModalOpen(false);
      refetchTanks();
      refetchSummary();
      setTankForm({
        tank_tag: "",
        terminal_location: "ميناء ومستودعات رأس غارب البترولية",
        product_type: "crude_oil_heavy",
        gross_observed_volume_bbl: 180000,
        api_gravity: 32.5,
        temperature_f: 85,
        net_standard_volume_bbl: 178500,
        safe_fill_capacity_bbl: 250000,
        status: "in_service",
      });
    } catch {
      toast("error", "فشل تسجيل الخزان");
    }
  };

  const handleCreateCashCall = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/oil/cash-calls", cashCallForm);
      toast("success", "تم إصدار مطالبة الشركاء (JV Cash Call) بنجاح");
      setIsCashCallModalOpen(false);
      refetchCashCalls();
      refetchSummary();
      setCashCallForm({
        cash_call_ref: "",
        concession: "امتياز خليج السويس - حقل مرجان",
        partner_company: "بي بي العالمية (BP Exploration)",
        working_interest_pct: 50,
        billing_period: "2026-11",
        operating_expenditure_egp: 20000000,
        capital_expenditure_egp: 15000000,
        total_due_egp: 35000000,
        status: "approved",
      });
    } catch {
      toast("error", "فشل إصدار مطالبة الشركاء");
    }
  };

  // Filters
  const filteredWells = wells.filter(
    (w) =>
      w.well_tag.toLowerCase().includes(search.toLowerCase()) ||
      w.well_name.toLowerCase().includes(search.toLowerCase()) ||
      w.concession_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProductions = productions.filter(
    (p) =>
      p.well_tag.toLowerCase().includes(search.toLowerCase()) ||
      p.well_name.toLowerCase().includes(search.toLowerCase()) ||
      p.log_date.includes(search)
  );

  const filteredDrilling = drillingReports.filter(
    (d) =>
      d.ddr_ref.toLowerCase().includes(search.toLowerCase()) ||
      d.rig_name.toLowerCase().includes(search.toLowerCase()) ||
      d.concession.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTanks = tanks.filter(
    (t) =>
      t.tank_tag.toLowerCase().includes(search.toLowerCase()) ||
      t.terminal_location.toLowerCase().includes(search.toLowerCase()) ||
      t.product_type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCashCalls = cashCalls.filter(
    (c) =>
      c.cash_call_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.partner_company.toLowerCase().includes(search.toLowerCase()) ||
      c.concession.toLowerCase().includes(search.toLowerCase())
  );

  const formatWellType = (wt: string) => {
    switch (wt) {
      case "oil_producer":
        return "بئر نفط منتج (Oil Producer)";
      case "gas_condensate":
        return "بئر غاز ومتكثفات (Gas Condensate)";
      case "water_injector":
        return "بئر حقن مياه للحفاظ على الضغط (Water Injector)";
      default:
        return wt;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                إدارة استخراج وإنتاج البترول والغاز (Oil & Gas Extraction)
              </h1>
              <p className="text-sm text-muted-foreground">
                رؤوس الآبار والمكامن، تخصيص الإنتاج اليومي، تقارير الحفر والبرائم (DDR)، مستودعات الخزانات، ومطالبات الشراكة (JV Cash Calls)
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2 border-border/40 hover:bg-secondary/20"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          {activeTab === "wells" && (
            <Button
              onClick={() => {
                sound.click();
                setIsWellModalOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4" />
              تسجيل بئر جديد
            </Button>
          )}
          {activeTab === "production" && (
            <Button
              onClick={() => {
                sound.click();
                if (wells.length > 0 && !productionForm.well_id) {
                  setProductionForm((prev) => ({ ...prev, well_id: wells[0].id }));
                }
                setIsProductionModalOpen(true);
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              تسجيل إنتاج يومي
            </Button>
          )}
          {activeTab === "drilling" && (
            <Button
              onClick={() => {
                sound.click();
                setIsDrillingModalOpen(true);
              }}
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4" />
              تقرير حفر يومي (DDR)
            </Button>
          )}
          {activeTab === "tanks" && (
            <Button
              onClick={() => {
                sound.click();
                setIsTankModalOpen(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة خزان تخزين
            </Button>
          )}
          {activeTab === "cash_calls" && (
            <Button
              onClick={() => {
                sound.click();
                setIsCashCallModalOpen(true);
              }}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إصدار مطالبة شراكة (JV)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              الآبار المنتجة
            </span>
            <Compass className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.total_producing_wells_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            آبار نشطة ومتصلة بخطوط الأنابيب
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              إنتاج النفط اليومي
            </span>
            <Droplets className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.daily_crude_oil_production_bbl ?? 0).toLocaleString()} BBL`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            برميل زيت صافي يومياً
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              إنتاج الغاز الطبيعي
            </span>
            <Flame className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              `${summary?.daily_natural_gas_production_mmscfd ?? 0} MMSCFD`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مليون قدم مكعب قياسي يومياً
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              برائم الحفر النشطة
            </span>
            <Gauge className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.active_drilling_rigs_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            حفارات تعمل بمواقع الاستكشاف
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              مخزون المستودعات
            </span>
            <Cylinder className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.tank_farm_storage_volume_bbl ?? 0).toLocaleString()} BBL`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            خام قياسي في حظيرة الخزانات
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              مطالبات الشركاء (JV)
            </span>
            <DollarSign className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.jv_cash_calls_due_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مطالبات نفقات التشغيل والرأسمال
          </span>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              sound.click();
              setActiveTab("wells");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "wells"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Compass className="h-4 w-4" />
            رؤوس الآبار والمكامن (Wells)
            <Badge variant="outline" className="mr-1 text-xs">
              {wells.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("production");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "production"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Droplets className="h-4 w-4" />
            الإنتاج اليومي (Production)
            <Badge variant="outline" className="mr-1 text-xs">
              {productions.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("drilling");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "drilling"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Gauge className="h-4 w-4" />
            تقارير الحفر والبرائم (DDR)
            <Badge variant="outline" className="mr-1 text-xs">
              {drillingReports.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("tanks");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "tanks"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Container className="h-4 w-4" />
            حظيرة الخزانات (Tank Farm)
            <Badge variant="outline" className="mr-1 text-xs">
              {tanks.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("cash_calls");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "cash_calls"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Database className="h-4 w-4" />
            مطالبات الشركاء (Cash Calls)
            <Badge variant="outline" className="mr-1 text-xs">
              {cashCalls.length}
            </Badge>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالبئر، الامتياز، البريمة، الخزان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Tab 1: Wells */}
      {activeTab === "wells" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود البئر (Well Tag)</TableHead>
                <TableHead className="text-right">اسم البئر وحقل الاستكشاف</TableHead>
                <TableHead className="text-right">منطقة الامتياز (Concession)</TableHead>
                <TableHead className="text-right">المنصة / وسادة الحفر</TableHead>
                <TableHead className="text-right">نوع البئر والوظيفة</TableHead>
                <TableHead className="text-right">الطبقة الجيولوجية (Formation)</TableHead>
                <TableHead className="text-right">الحالة التشغيلية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isWellsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredWells.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد آبار مسجلة تطابق البحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredWells.map((w) => (
                  <TableRow key={w.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-amber-400">
                      {w.well_tag}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {w.well_name}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {w.concession_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {w.platform_or_pad}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                        {formatWellType(w.well_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {w.reservoir_formation}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {w.status === "producing" ? "منتج ومرتبط بالخط" : w.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Production */}
      {activeTab === "production" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود البئر</TableHead>
                <TableHead className="text-right">اسم البئر</TableHead>
                <TableHead className="text-right">تاريخ القياس</TableHead>
                <TableHead className="text-right">السائل الكلي (Gross)</TableHead>
                <TableHead className="text-right">النفط الصافي (Net Oil)</TableHead>
                <TableHead className="text-right">معدل الغاز الطبيعي</TableHead>
                <TableHead className="text-right">نسبة المياه (Water Cut)</TableHead>
                <TableHead className="text-right">ضغط الأنابيب (THP)</TableHead>
                <TableHead className="text-right">فتحة الخانق (Choke)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isProductionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredProductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد سجلات إنتاج يومي مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredProductions.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-amber-400">
                      {p.well_tag}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {p.well_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.log_date}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {p.gross_liquid_bbl.toLocaleString()} BBL
                    </TableCell>
                    <TableCell className="font-mono font-bold text-emerald-400">
                      {p.net_oil_bbl.toLocaleString()} BBL
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-blue-400">
                      {p.gas_rate_mmscfd} MMSCFD
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {p.water_cut_pct}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {p.tubing_pressure_psi} PSI
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.choke_size_64th}/64"
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 3: Drilling (DDR) */}
      {activeTab === "drilling" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم التقرير (DDR)</TableHead>
                <TableHead className="text-right">اسم بريمة الحفر (Rig)</TableHead>
                <TableHead className="text-right">منطقة الامتياز</TableHead>
                <TableHead className="text-right">تاريخ العمليات</TableHead>
                <TableHead className="text-right">العمق الحالي (MD)</TableHead>
                <TableHead className="text-right">الحفر خلال 24 ساعة</TableHead>
                <TableHead className="text-right">وزن سائل الحفر (Mud)</TableHead>
                <TableHead className="text-right">تكلفة التشغيل اليومية</TableHead>
                <TableHead className="text-right">ملخص العمليات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDrillingLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredDrilling.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    لا توجد تقارير حفر يومية مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrilling.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-orange-400">
                      {d.ddr_ref}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {d.rig_name}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {d.concession}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.report_date}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {d.current_depth_ft.toLocaleString()} قدم
                    </TableCell>
                    <TableCell className="font-mono text-emerald-400 font-semibold">
                      +{d.footage_last_24h_ft} قدم/يوم
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.mud_weight_ppg} PPG
                    </TableCell>
                    <TableCell className="font-mono text-amber-400">
                      {d.daily_rig_cost_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {d.operations_summary}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-orange-600/20 text-orange-400 border border-orange-500/30"
                      >
                        {d.status === "drilling" ? "حفر نشط وتدوير طَفلة" : d.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Tank Farm */}
      {activeTab === "tanks" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود الخزان (Tank Tag)</TableHead>
                <TableHead className="text-right">المحطة والمستودع</TableHead>
                <TableHead className="text-right">نوع الخام / المنتج</TableHead>
                <TableHead className="text-right">الحجم المرصود (GOV)</TableHead>
                <TableHead className="text-right">كثافة الخام (API Gravity)</TableHead>
                <TableHead className="text-right">الحجم القياسي الصافي (NSV)</TableHead>
                <TableHead className="text-right">نسبة الامتلاء</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTanksLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTanks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد خزانات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredTanks.map((t) => {
                  const pct = t.safe_fill_capacity_bbl > 0
                    ? Math.round((t.net_standard_volume_bbl / t.safe_fill_capacity_bbl) * 100)
                    : 0;
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono font-medium text-blue-400">
                        {t.tank_tag}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {t.terminal_location}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                          {t.product_type === "crude_oil_heavy" ? "خام ثقيل (Heavy Crude)" : t.product_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {t.gross_observed_volume_bbl.toLocaleString()} BBL
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-amber-400">
                        {t.api_gravity}° API ({t.temperature_f}°F)
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {t.net_standard_volume_bbl.toLocaleString()} BBL
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        >
                          {t.status === "in_service" ? "بالخدمة وتخزين آمن" : t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 5: Cash Calls */}
      {activeTab === "cash_calls" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم المطالبة (Cash Call)</TableHead>
                <TableHead className="text-right">منطقة الامتياز (Concession)</TableHead>
                <TableHead className="text-right">الشريك الأجنبي (Partner)</TableHead>
                <TableHead className="text-right">حصة المشاركة (%)</TableHead>
                <TableHead className="text-right">فترة الفاتورة</TableHead>
                <TableHead className="text-right">نفقات التشغيل (OPEX)</TableHead>
                <TableHead className="text-right">نفقات الاستثمار (CAPEX)</TableHead>
                <TableHead className="text-right">إجمالي المستحق</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCashCallsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredCashCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد مطالبات شركاء مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredCashCalls.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-indigo-400">
                      {c.cash_call_ref}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {c.concession}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {c.partner_company}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-amber-400">
                      {c.working_interest_pct}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.billing_period}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {c.operating_expenditure_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {c.capital_expenditure_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono font-bold text-emerald-400">
                      {c.total_due_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {c.status === "approved" ? "معتمد ومسدد" : c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal: New Well */}
      {isWellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">تسجيل رأس بئر جديد</h2>
              <button
                onClick={() => setIsWellModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWell} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود البئر (Well Tag)</label>
                  <Input
                    required
                    placeholder="مثال: W-MRJ-108"
                    value={wellForm.well_tag}
                    onChange={(e) => setWellForm({ ...wellForm, well_tag: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نوع البئر</label>
                  <select
                    value={wellForm.well_type}
                    onChange={(e) => setWellForm({ ...wellForm, well_type: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="oil_producer">بئر نفط منتج (Oil Producer)</option>
                    <option value="gas_condensate">بئر غاز ومتكثفات (Gas Condensate)</option>
                    <option value="water_injector">بئر حقن مياه للحفاظ على الضغط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم البئر والحقل</label>
                <Input
                  required
                  placeholder="مثال: بئر مرجان البحري 108"
                  value={wellForm.well_name}
                  onChange={(e) => setWellForm({ ...wellForm, well_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">منطقة الامتياز (Concession)</label>
                  <Input
                    required
                    value={wellForm.concession_name}
                    onChange={(e) => setWellForm({ ...wellForm, concession_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المنصة أو وسادة الحفر</label>
                  <Input
                    required
                    value={wellForm.platform_or_pad}
                    onChange={(e) => setWellForm({ ...wellForm, platform_or_pad: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">الطبقة الجيولوجية (Reservoir Formation)</label>
                <Input
                  required
                  value={wellForm.reservoir_formation}
                  onChange={(e) => setWellForm({ ...wellForm, reservoir_formation: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsWellModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ وتسجيل البئر
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Production */}
      {isProductionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">تسجيل إنتاج يومي لرأس البئر</h2>
              <button
                onClick={() => setIsProductionModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduction} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">البئر المستهدف</label>
                  <select
                    value={productionForm.well_id}
                    onChange={(e) => setProductionForm({ ...productionForm, well_id: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">اختر البئر...</option>
                    {wells.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.well_tag} - {w.well_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ القياس</label>
                  <Input
                    type="date"
                    required
                    value={productionForm.log_date}
                    onChange={(e) => setProductionForm({ ...productionForm, log_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">السائل الكلي (Gross BBL)</label>
                  <Input
                    type="number"
                    required
                    value={productionForm.gross_liquid_bbl}
                    onChange={(e) => setProductionForm({ ...productionForm, gross_liquid_bbl: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">النفط الصافي (Net Oil BBL)</label>
                  <Input
                    type="number"
                    required
                    value={productionForm.net_oil_bbl}
                    onChange={(e) => setProductionForm({ ...productionForm, net_oil_bbl: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">معدل الغاز (MMSCFD)</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={productionForm.gas_rate_mmscfd}
                    onChange={(e) => setProductionForm({ ...productionForm, gas_rate_mmscfd: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نسبة المياه (% Water Cut)</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={productionForm.water_cut_pct}
                    onChange={(e) => setProductionForm({ ...productionForm, water_cut_pct: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ضغط رأس الأنبوب (PSI)</label>
                  <Input
                    type="number"
                    required
                    value={productionForm.tubing_pressure_psi}
                    onChange={(e) => setProductionForm({ ...productionForm, tubing_pressure_psi: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">فتحة الخانق (64ths)</label>
                  <Input
                    type="number"
                    required
                    value={productionForm.choke_size_64th}
                    onChange={(e) => setProductionForm({ ...productionForm, choke_size_64th: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsProductionModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  حفظ سجل الإنتاج
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Drilling Report */}
      {isDrillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">اعتماد تقرير الحفر اليومي (DDR)</h2>
              <button
                onClick={() => setIsDrillingModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDrilling} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم تقرير الحفر (DDR Ref)</label>
                  <Input
                    required
                    placeholder="مثال: DDR-2026-RIG-08"
                    value={drillingForm.ddr_ref}
                    onChange={(e) => setDrillingForm({ ...drillingForm, ddr_ref: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">اسم بريمة الحفر</label>
                  <Input
                    required
                    value={drillingForm.rig_name}
                    onChange={(e) => setDrillingForm({ ...drillingForm, rig_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">منطقة الامتياز</label>
                  <Input
                    required
                    value={drillingForm.concession}
                    onChange={(e) => setDrillingForm({ ...drillingForm, concession: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ التقرير</label>
                  <Input
                    type="date"
                    required
                    value={drillingForm.report_date}
                    onChange={(e) => setDrillingForm({ ...drillingForm, report_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">العمق الحالي (قدم)</label>
                  <Input
                    type="number"
                    required
                    value={drillingForm.current_depth_ft}
                    onChange={(e) => setDrillingForm({ ...drillingForm, current_depth_ft: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الحفر آخر 24 س (قدم)</label>
                  <Input
                    type="number"
                    required
                    value={drillingForm.footage_last_24h_ft}
                    onChange={(e) => setDrillingForm({ ...drillingForm, footage_last_24h_ft: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كثافة الطفلة (PPG)</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={drillingForm.mud_weight_ppg}
                    onChange={(e) => setDrillingForm({ ...drillingForm, mud_weight_ppg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">تكلفة البريمة اليومية (ج.م)</label>
                <Input
                  type="number"
                  required
                  value={drillingForm.daily_rig_cost_egp}
                  onChange={(e) => setDrillingForm({ ...drillingForm, daily_rig_cost_egp: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">ملخص العمليات الجيولوجية والميكانيكية</label>
                <textarea
                  required
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={drillingForm.operations_summary}
                  onChange={(e) => setDrillingForm({ ...drillingForm, operations_summary: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsDrillingModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  اعتماد تقرير الحفر
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Tank */}
      {isTankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">إضافة خزان تخزين بمستودعات الحقل</h2>
              <button
                onClick={() => setIsTankModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTank} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود الخزان (Tank Tag)</label>
                  <Input
                    required
                    placeholder="مثال: TK-104-RG"
                    value={tankForm.tank_tag}
                    onChange={(e) => setTankForm({ ...tankForm, tank_tag: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الموقع والمحطة</label>
                  <Input
                    required
                    value={tankForm.terminal_location}
                    onChange={(e) => setTankForm({ ...tankForm, terminal_location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الحجم القياسي الصافي (NSV BBL)</label>
                  <Input
                    type="number"
                    required
                    value={tankForm.net_standard_volume_bbl}
                    onChange={(e) => setTankForm({ ...tankForm, net_standard_volume_bbl: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">السعة الآمنة القصوى (BBL)</label>
                  <Input
                    type="number"
                    required
                    value={tankForm.safe_fill_capacity_bbl}
                    onChange={(e) => setTankForm({ ...tankForm, safe_fill_capacity_bbl: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كثافة الخام (°API)</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={tankForm.api_gravity}
                    onChange={(e) => setTankForm({ ...tankForm, api_gravity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">درجة الحرارة (°F)</label>
                  <Input
                    type="number"
                    required
                    value={tankForm.temperature_f}
                    onChange={(e) => setTankForm({ ...tankForm, temperature_f: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsTankModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  حفظ الخزان
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Cash Call */}
      {isCashCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">إصدار مطالبة شراكة (JV Cash Call)</h2>
              <button
                onClick={() => setIsCashCallModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCashCall} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم المطالبة (Ref)</label>
                  <Input
                    required
                    placeholder="مثال: CC-2026-MRJ-11"
                    value={cashCallForm.cash_call_ref}
                    onChange={(e) => setCashCallForm({ ...cashCallForm, cash_call_ref: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الشريك الأجنبي (Partner)</label>
                  <Input
                    required
                    value={cashCallForm.partner_company}
                    onChange={(e) => setCashCallForm({ ...cashCallForm, partner_company: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">منطقة الامتياز</label>
                  <Input
                    required
                    value={cashCallForm.concession}
                    onChange={(e) => setCashCallForm({ ...cashCallForm, concession: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">فترة الفاتورة (YYYY-MM)</label>
                  <Input
                    required
                    value={cashCallForm.billing_period}
                    onChange={(e) => setCashCallForm({ ...cashCallForm, billing_period: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نفقات تشغيل OPEX (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={cashCallForm.operating_expenditure_egp}
                    onChange={(e) => {
                      const opex = parseFloat(e.target.value) || 0;
                      setCashCallForm({
                        ...cashCallForm,
                        operating_expenditure_egp: opex,
                        total_due_egp: opex + cashCallForm.capital_expenditure_egp,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نفقات استثمار CAPEX (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={cashCallForm.capital_expenditure_egp}
                    onChange={(e) => {
                      const capex = parseFloat(e.target.value) || 0;
                      setCashCallForm({
                        ...cashCallForm,
                        capital_expenditure_egp: capex,
                        total_due_egp: cashCallForm.operating_expenditure_egp + capex,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نسبة الشريك (%)</label>
                  <Input
                    type="number"
                    required
                    value={cashCallForm.working_interest_pct}
                    onChange={(e) => setCashCallForm({ ...cashCallForm, working_interest_pct: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsCashCallModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  إصدار مطالبة الشركاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
