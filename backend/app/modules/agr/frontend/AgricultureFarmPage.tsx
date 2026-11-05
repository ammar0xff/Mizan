import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Droplets,
  FileCheck,
  MapPin,
  Milk,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  Wheat,
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

interface AgrSummary {
  total_farm_plots_count: number;
  total_feddans_cultivated: number;
  active_crop_seasons_count: number;
  total_harvest_weight_tons: number;
  livestock_head_count: number;
  daily_milk_production_liters: number;
}

interface AgrFarmPlot {
  id: string;
  plot_code: string;
  farm_name: string;
  sector: string;
  soil_type: string;
  area_feddans: number;
  irrigation_type: string;
  gps_coordinates: string;
  status: string;
  created_at?: string;
}

interface AgrCropSeason {
  id: string;
  plot_id: string;
  plot_code: string;
  farm_name: string;
  season_code: string;
  crop_name: string;
  variety: string;
  planting_date: string;
  expected_harvest_date: string;
  target_yield_tons: number;
  actual_yield_tons: number;
  status: string;
  created_at?: string;
}

interface AgrChemicalSprayLog {
  id: string;
  crop_season_id: string;
  crop_name: string;
  season_code: string;
  spray_ref: string;
  chemical_name: string;
  dosage_per_feddan: string;
  active_ingredient: string;
  target_pest_or_deficiency: string;
  withholding_days_phi: number;
  applied_date: string;
  applied_by: string;
  status: string;
}

interface AgrHarvestBatch {
  id: string;
  crop_season_id: string;
  crop_name: string;
  season_code: string;
  batch_lot: string;
  harvest_date: string;
  total_weight_tons: number;
  grade_classification: string;
  reject_percentage: number;
  globalgap_compliant: boolean;
  destination_warehouse: string;
  notes?: string | null;
}

interface AgrLivestockAnimal {
  id: string;
  rfid_tag: string;
  breed: string;
  gender: string;
  birth_date: string;
  current_weight_kg: number;
  daily_milk_yield_liters: number;
  health_status: string;
  last_vaccination_date?: string | null;
}

export default function AgricultureFarmPage() {
  const [activeTab, setActiveTab] = useState<
    "plots" | "seasons" | "sprays" | "harvests" | "livestock"
  >("plots");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [isSprayModalOpen, setIsSprayModalOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [isLivestockModalOpen, setIsLivestockModalOpen] = useState(false);

  // Form states
  const [plotForm, setPlotForm] = useState({
    plot_code: "",
    farm_name: "مزارع توشكى للاستصلاح الزراعي",
    sector: "القطاع الأوسط - بيفوت 3",
    soil_type: "طميية رملية (Sandy Loam)",
    area_feddans: 120,
    irrigation_type: "center_pivot",
    gps_coordinates: "22.5210° N, 31.8540° E",
    status: "cultivated",
  });

  const [seasonForm, setSeasonForm] = useState({
    plot_id: "",
    season_code: "",
    crop_name: "قمح سدس 12 (Wheat)",
    variety: "سدس 12 عالي الجودة",
    planting_date: new Date().toISOString().split("T")[0],
    expected_harvest_date: new Date(Date.now() + 150 * 86400000).toISOString().split("T")[0],
    target_yield_tons: 350,
    status: "planted",
  });

  const [sprayForm, setSprayForm] = useState({
    crop_season_id: "",
    spray_ref: "",
    chemical_name: "سماد نترات نشادر وبوتاسيوم",
    dosage_per_feddan: "50 كجم / فدان",
    active_ingredient: "N 33.5% + K2O 24%",
    target_pest_or_deficiency: "تغذية ورقية وتحفيز النمو الجذري",
    withholding_days_phi: 7,
    applied_date: new Date().toISOString().split("T")[0],
    applied_by: "المهندس الزراعي أحمد مختار",
    status: "completed",
  });

  const [harvestForm, setHarvestForm] = useState({
    crop_season_id: "",
    batch_lot: "",
    harvest_date: new Date().toISOString().split("T")[0],
    total_weight_tons: 45.5,
    grade_classification: "Class 1 (Export)",
    reject_percentage: 1.5,
    globalgap_compliant: true,
    destination_warehouse: "محطة الفرز والتعبئة المركزية - صوامع شرق العوينات",
    notes: "جودة التصدير ممتازة مطابقة للمواصفة القياسية الأوروبية",
  });

  const [livestockForm, setLivestockForm] = useState({
    rfid_tag: "",
    breed: "هولشتاين بيور (Holstein Friesian)",
    gender: "female",
    birth_date: "2023-04-15",
    current_weight_kg: 580,
    daily_milk_yield_liters: 34.5,
    health_status: "lactating",
    last_vaccination_date: new Date().toISOString().split("T")[0],
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery<AgrSummary>({
    queryKey: ["agr-summary"],
    queryFn: () => api.get<AgrSummary>("/agr/summary"),
  });

  const { data: plots = [], isLoading: isPlotsLoading, refetch: refetchPlots } = useQuery<AgrFarmPlot[]>({
    queryKey: ["agr-plots"],
    queryFn: () => api.get<AgrFarmPlot[]>("/agr/plots"),
  });

  const { data: seasons = [], isLoading: isSeasonsLoading, refetch: refetchSeasons } = useQuery<AgrCropSeason[]>({
    queryKey: ["agr-seasons"],
    queryFn: () => api.get<AgrCropSeason[]>("/agr/seasons"),
  });

  const { data: sprays = [], isLoading: isSpraysLoading, refetch: refetchSprays } = useQuery<AgrChemicalSprayLog[]>({
    queryKey: ["agr-sprays"],
    queryFn: () => api.get<AgrChemicalSprayLog[]>("/agr/sprays"),
  });

  const { data: harvests = [], isLoading: isHarvestsLoading, refetch: refetchHarvests } = useQuery<AgrHarvestBatch[]>({
    queryKey: ["agr-harvests"],
    queryFn: () => api.get<AgrHarvestBatch[]>("/agr/harvests"),
  });

  const { data: livestock = [], isLoading: isLivestockLoading, refetch: refetchLivestock } = useQuery<AgrLivestockAnimal[]>({
    queryKey: ["agr-livestock"],
    queryFn: () => api.get<AgrLivestockAnimal[]>("/agr/livestock"),
  });

  const refreshAll = () => {
    sound.click();
    refetchSummary();
    refetchPlots();
    refetchSeasons();
    refetchSprays();
    refetchHarvests();
    refetchLivestock();
    toast("success", "تم تحديث كافة بيانات الزراعة والمحاصيل بنجاح");
  };

  // Handlers
  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agr/plots", plotForm);
      toast("success", "تم إضافة الحوض والقطاع الزراعي بنجاح");
      setIsPlotModalOpen(false);
      refetchPlots();
      refetchSummary();
    } catch {
      toast("error", "فشل إضافة القطاع الزراعي");
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agr/seasons", seasonForm);
      toast("success", "تم إطلاق الدورة المحصولية والجدول الزمني بنجاح");
      setIsSeasonModalOpen(false);
      refetchSeasons();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل الدورة المحصولية");
    }
  };

  const handleCreateSpray = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agr/sprays", sprayForm);
      toast("success", "تم تسجيل معاملة التسميد والرش وحساب فترة الأمان (PHI)");
      setIsSprayModalOpen(false);
      refetchSprays();
    } catch {
      toast("error", "فشل تسجيل معاملة الرش");
    }
  };

  const handleCreateHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agr/harvests", harvestForm);
      toast("success", "تم توثيق دفعة الحصاد ورمز تتبع GlobalG.A.P.");
      setIsHarvestModalOpen(false);
      refetchHarvests();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل دفعة الحصاد");
    }
  };

  const handleCreateLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agr/livestock", livestockForm);
      toast("success", "تم تسجيل الرأس في السجل الإلكتروني (RFID)");
      setIsLivestockModalOpen(false);
      refetchLivestock();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل الحيوان");
    }
  };

  // Filters
  const filteredPlots = plots.filter(
    (p) =>
      p.plot_code.toLowerCase().includes(search.toLowerCase()) ||
      p.farm_name.toLowerCase().includes(search.toLowerCase()) ||
      p.sector.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSeasons = seasons.filter(
    (s) =>
      s.season_code.toLowerCase().includes(search.toLowerCase()) ||
      s.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      s.farm_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSprays = sprays.filter(
    (sp) =>
      sp.spray_ref.toLowerCase().includes(search.toLowerCase()) ||
      sp.chemical_name.toLowerCase().includes(search.toLowerCase()) ||
      sp.crop_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHarvests = harvests.filter(
    (h) =>
      h.batch_lot.toLowerCase().includes(search.toLowerCase()) ||
      h.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      h.grade_classification.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLivestock = livestock.filter(
    (l) =>
      l.rfid_tag.toLowerCase().includes(search.toLowerCase()) ||
      l.breed.toLowerCase().includes(search.toLowerCase()) ||
      l.health_status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <Tractor className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                إدارة الزراعة والمزارع والإنتاج الحيواني (AGR)
              </h1>
              <p className="text-sm text-zinc-400">
                أجهزة الري المحوري (Pivots)، التسميد وفترات الأمان (PHI)، تتبع حصاد GlobalG.A.P.، وقطيع الماشية (RFID)
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

          {activeTab === "plots" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsPlotModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة قطاع / بيفوت
            </Button>
          )}

          {activeTab === "seasons" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (plots.length > 0) {
                  setSeasonForm((prev) => ({ ...prev, plot_id: plots[0].id }));
                }
                setIsSeasonModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              دورة محصولية جديدة
            </Button>
          )}

          {activeTab === "sprays" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (seasons.length > 0) {
                  setSprayForm((prev) => ({ ...prev, crop_season_id: seasons[0].id }));
                }
                setIsSprayModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل رش وتسميد (PHI)
            </Button>
          )}

          {activeTab === "harvests" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (seasons.length > 0) {
                  setHarvestForm((prev) => ({ ...prev, crop_season_id: seasons[0].id }));
                }
                setIsHarvestModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              توثيق دفعة حصاد
            </Button>
          )}

          {activeTab === "livestock" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsLivestockModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل رأس ماشية (RFID)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">القطاعات والبيفوتات</span>
            <MapPin className="h-4 w-4 text-emerald-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {summary?.total_farm_plots_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">حوض زراعي</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">المساحة المزروعة</span>
            <Sprout className="h-4 w-4 text-lime-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-lime-400">
                {(summary?.total_feddans_cultivated ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">فدان</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">الدورات المحصولية</span>
            <Calendar className="h-4 w-4 text-blue-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-blue-400">
                {summary?.active_crop_seasons_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">موسم نشط</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">إجمالي الحصاد المسجل</span>
            <Wheat className="h-4 w-4 text-amber-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-amber-400">
                {summary?.total_harvest_weight_tons ?? 0}
              </span>
              <span className="text-xs text-zinc-500">طن ناتج</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">قطيع الثروة الحيوانية</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-purple-400">
                {summary?.livestock_head_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">رأس ماشية</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">إنتاج الحليب اليومي</span>
            <Milk className="h-4 w-4 text-sky-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-sky-400">
                {summary?.daily_milk_production_liters ?? 0}
              </span>
              <span className="text-xs text-zinc-500">لتر / يوم</span>
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
              setActiveTab("plots");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "plots"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <MapPin className="h-4 w-4" />
            الأحواض والقطاعات (Pivots)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("seasons");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "seasons"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Sprout className="h-4 w-4" />
            الدورات والمواسم المحصولية
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("sprays");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "sprays"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Droplets className="h-4 w-4" />
            سجل الرش وفترات الأمان (PHI)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("harvests");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "harvests"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Wheat className="h-4 w-4" />
            دفعات الحصاد والتصدير (GlobalG.A.P.)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("livestock");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "livestock"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Milk className="h-4 w-4" />
            الإنتاج الحيواني والألبان (RFID)
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

      {/* Tab 1: Farm Plots & Pivots */}
      {activeTab === "plots" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                خريطة الأحواض والقطاعات الزراعية
              </h2>
              <p className="text-xs text-zinc-400">
                تسجيل مساحات الفدادين، أنظمة الري المحوري والتنقيط، وإحداثيات GPS
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              {filteredPlots.length} قطاع زراعي
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">كود القطاع</TableHead>
                  <TableHead className="text-zinc-400">اسم المزرعة</TableHead>
                  <TableHead className="text-zinc-400">القطاع والجهاز</TableHead>
                  <TableHead className="text-zinc-400">المساحة (فدان)</TableHead>
                  <TableHead className="text-zinc-400">نظام الري</TableHead>
                  <TableHead className="text-zinc-400">نوع التربة</TableHead>
                  <TableHead className="text-zinc-400">إحداثيات GPS</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPlotsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPlots.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد أحواض زراعية مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlots.map((p) => (
                    <TableRow key={p.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-emerald-400">
                        {p.plot_code}
                      </TableCell>
                      <TableCell className="font-medium text-white">{p.farm_name}</TableCell>
                      <TableCell className="text-zinc-300">{p.sector}</TableCell>
                      <TableCell className="font-mono font-bold text-lime-400">
                        {p.area_feddans} فدان
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-zinc-800 text-zinc-300 text-xs"
                        >
                          {p.irrigation_type === "center_pivot"
                            ? "ري محوري (Pivot)"
                            : p.irrigation_type === "drip"
                            ? "تنقيط حديث"
                            : "رشاشات ثابتة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">{p.soil_type}</TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {p.gps_coordinates}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {p.status === "cultivated" ? "مزروع نشط" : p.status}
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

      {/* Tab 2: Crop Seasons */}
      {activeTab === "seasons" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                الدورات والمواسم المحصولية
              </h2>
              <p className="text-xs text-zinc-400">
                جدولة الزراعة، مواعيد الحصاد المتوقعة، ومستهدفات الإنتاج بالطن
              </p>
            </div>
            <Badge variant="outline" className="border-lime-500/30 text-lime-400">
              {filteredSeasons.length} موسم مسجل
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">كود الموسم</TableHead>
                  <TableHead className="text-zinc-400">المحصول والصنف</TableHead>
                  <TableHead className="text-zinc-400">الحوض / البيفوت</TableHead>
                  <TableHead className="text-zinc-400">تاريخ الزراعة</TableHead>
                  <TableHead className="text-zinc-400">الحصاد المتوقع</TableHead>
                  <TableHead className="text-zinc-400">المستهدف</TableHead>
                  <TableHead className="text-zinc-400">المتحقق فعلياً</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSeasonsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredSeasons.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد مواسم محصولية مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSeasons.map((s) => (
                    <TableRow key={s.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {s.season_code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{s.crop_name}</div>
                        <div className="text-xs text-zinc-400">{s.variety}</div>
                      </TableCell>
                      <TableCell className="font-mono text-zinc-300">
                        {s.plot_code}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {s.planting_date}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {s.expected_harvest_date}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-emerald-400">
                        {s.target_yield_tons} طن
                      </TableCell>
                      <TableCell className="font-mono font-bold text-amber-400">
                        {s.actual_yield_tons > 0 ? `${s.actual_yield_tons} طن` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            s.status === "harvested"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }
                        >
                          {s.status === "vegetative"
                            ? "مرحلة النمو الخضري"
                            : s.status === "planted"
                            ? "تمت الزراعة"
                            : s.status === "harvested"
                            ? "تم الحصاد"
                            : s.status}
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

      {/* Tab 3: Chemical Sprays & PHI */}
      {activeTab === "sprays" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                سجل الرش والتسميد وفترات ما قبل الحصاد (PHI)
              </h2>
              <p className="text-xs text-zinc-400">
                تتبع المركبات الكيميائية، الجرعات لكل فدان، ومطابقة فترة الأمان لسلامة الغذاء والتصدير
              </p>
            </div>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              {filteredSprays.length} معاملة مسجلة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">كود المعاملة</TableHead>
                  <TableHead className="text-zinc-400">المحصول والموسم</TableHead>
                  <TableHead className="text-zinc-400">اسم المبيد / السماد</TableHead>
                  <TableHead className="text-zinc-400">المادة الفعالة والجرعة</TableHead>
                  <TableHead className="text-zinc-400">الهدف / الآفة</TableHead>
                  <TableHead className="text-zinc-400">فترة الأمان (PHI)</TableHead>
                  <TableHead className="text-zinc-400">تاريخ التنفيذ</TableHead>
                  <TableHead className="text-zinc-400">المسؤول</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSpraysLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredSprays.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد معاملات رش مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSprays.map((sp) => (
                    <TableRow key={sp.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {sp.spray_ref}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{sp.crop_name}</div>
                        <div className="font-mono text-xs text-zinc-500">{sp.season_code}</div>
                      </TableCell>
                      <TableCell className="text-zinc-200 font-medium">{sp.chemical_name}</TableCell>
                      <TableCell>
                        <div className="text-xs text-zinc-300">{sp.active_ingredient}</div>
                        <div className="font-mono text-xs text-zinc-500">{sp.dosage_per_feddan}</div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">{sp.target_pest_or_deficiency}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-xs"
                        >
                          {sp.withholding_days_phi} يوم أمان
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {sp.applied_date}
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs">{sp.applied_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 4: Harvest Batches & GlobalG.A.P. */}
      {activeTab === "harvests" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                دفعات الحصاد والتصدير الدولي (GlobalG.A.P.)
              </h2>
              <p className="text-xs text-zinc-400">
                أرقام التشغيلات (Lot Numbers)، تصنيف الجودة، ونسب الفرز والإعدام
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              {filteredHarvests.length} دفعة حصاد
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم التشغيلة (Lot)</TableHead>
                  <TableHead className="text-zinc-400">المحصول والموسم</TableHead>
                  <TableHead className="text-zinc-400">تاريخ الجمع</TableHead>
                  <TableHead className="text-zinc-400">الوزن الإجمالي</TableHead>
                  <TableHead className="text-zinc-400">رتبة الفرز</TableHead>
                  <TableHead className="text-zinc-400">نسبة الفرز والشوائب</TableHead>
                  <TableHead className="text-zinc-400">معيار GlobalG.A.P.</TableHead>
                  <TableHead className="text-zinc-400">مستودع الوجهة والتخزين</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isHarvestsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredHarvests.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد دفعات حصاد مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHarvests.map((h) => (
                    <TableRow key={h.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {h.batch_lot}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{h.crop_name}</div>
                        <div className="font-mono text-xs text-zinc-500">{h.season_code}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {h.harvest_date}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {h.total_weight_tons} طن
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"
                        >
                          {h.grade_classification}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-zinc-400 text-xs">
                        {h.reject_percentage}%
                      </TableCell>
                      <TableCell>
                        {h.globalgap_compliant ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <FileCheck className="h-3.5 w-3.5" /> معتمد للتصدير
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">سوق محلي</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs max-w-xs truncate">
                        {h.destination_warehouse}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 5: Livestock & RFID Ear-Tags */}
      {activeTab === "livestock" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                قطيع الثروة الحيوانية والحلاب (RFID Tagging)
              </h2>
              <p className="text-xs text-zinc-400">
                أرقام الأذن الإلكترونية، السلالة والأنساب، إنتاجية الحليب اليومية، والتحصينات البيطرية
              </p>
            </div>
            <Badge variant="outline" className="border-sky-500/30 text-sky-400">
              {filteredLivestock.length} رأس مسجل
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم الشريحة (RFID Tag)</TableHead>
                  <TableHead className="text-zinc-400">السلالة والجنس</TableHead>
                  <TableHead className="text-zinc-400">تاريخ الميلاد والسن</TableHead>
                  <TableHead className="text-zinc-400">الوزن الحالي</TableHead>
                  <TableHead className="text-zinc-400">إنتاجية الحليب / يوم</TableHead>
                  <TableHead className="text-zinc-400">الحالة الإنتاجية والبيطرية</TableHead>
                  <TableHead className="text-zinc-400">تاريخ آخر تحصين</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLivestockLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLivestock.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                      لا توجد رؤوس ماشية مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLivestock.map((l) => (
                    <TableRow key={l.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono font-bold text-amber-400">
                        {l.rfid_tag}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{l.breed}</div>
                        <div className="text-xs text-zinc-500">
                          {l.gender === "female" ? "أنثى (بقرة / عِجلة)" : "ذكر (ثور / طلوقة)"}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {l.birth_date}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-zinc-200">
                        {l.current_weight_kg} كجم
                      </TableCell>
                      <TableCell className="font-mono font-bold text-sky-400">
                        {l.daily_milk_yield_liters > 0
                          ? `${l.daily_milk_yield_liters} لتر / يوم`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            l.health_status === "lactating"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : l.health_status === "pregnant"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }
                        >
                          {l.health_status === "lactating"
                            ? "مدر للحليب (حلاّب)"
                            : l.health_status === "pregnant"
                            ? "عشار / حمل مؤكد"
                            : "سليم بيطرياً"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {l.last_vaccination_date ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Modal: New Plot */}
      {isPlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إضافة حوض / جهاز ري محوري جديد</h3>
              <button
                onClick={() => setIsPlotModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlot} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">كود الحوض / الجهاز</label>
                  <Input
                    required
                    value={plotForm.plot_code}
                    onChange={(e) => setPlotForm({ ...plotForm, plot_code: e.target.value })}
                    placeholder="مثال: PVT-NORTH-04"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نظام الري</label>
                  <select
                    value={plotForm.irrigation_type}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, irrigation_type: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="center_pivot">ري محوري (Center Pivot)</option>
                    <option value="drip">شبكة تنقيط حديثة</option>
                    <option value="sprinkler">رشاشات رذاذية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم المزرعة والمشروع</label>
                <Input
                  required
                  value={plotForm.farm_name}
                  onChange={(e) => setPlotForm({ ...plotForm, farm_name: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">القطاع والمنطقة</label>
                <Input
                  required
                  value={plotForm.sector}
                  onChange={(e) => setPlotForm({ ...plotForm, sector: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">المساحة الإجمالية (فدان)</label>
                  <Input
                    type="number"
                    value={plotForm.area_feddans}
                    onChange={(e) =>
                      setPlotForm({
                        ...plotForm,
                        area_feddans: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نوع التربة</label>
                  <Input
                    value={plotForm.soil_type}
                    onChange={(e) => setPlotForm({ ...plotForm, soil_type: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">إحداثيات GPS</label>
                <Input
                  required
                  value={plotForm.gps_coordinates}
                  onChange={(e) =>
                    setPlotForm({ ...plotForm, gps_coordinates: e.target.value })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsPlotModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  حفظ القطاع
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Season */}
      {isSeasonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إطلاق موسم ودورة محصولية جديدة</h3>
              <button
                onClick={() => setIsSeasonModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSeason} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الحوض / البيفوت المستهدف</label>
                  <select
                    value={seasonForm.plot_id}
                    onChange={(e) => setSeasonForm({ ...seasonForm, plot_id: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plot_code} ({p.farm_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">كود الموسم</label>
                  <Input
                    required
                    value={seasonForm.season_code}
                    onChange={(e) =>
                      setSeasonForm({ ...seasonForm, season_code: e.target.value })
                    }
                    placeholder="مثال: WHT-2026-WIN"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">اسم المحصول</label>
                  <Input
                    required
                    value={seasonForm.crop_name}
                    onChange={(e) =>
                      setSeasonForm({ ...seasonForm, crop_name: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الصنف والنوع</label>
                  <Input
                    required
                    value={seasonForm.variety}
                    onChange={(e) =>
                      setSeasonForm({ ...seasonForm, variety: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">تاريخ الزراعة</label>
                  <Input
                    type="date"
                    value={seasonForm.planting_date}
                    onChange={(e) =>
                      setSeasonForm({ ...seasonForm, planting_date: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تاريخ الحصاد المستهدف</label>
                  <Input
                    type="date"
                    value={seasonForm.expected_harvest_date}
                    onChange={(e) =>
                      setSeasonForm({ ...seasonForm, expected_harvest_date: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">مستهدف الإنتاج الكلي (طن)</label>
                <Input
                  type="number"
                  value={seasonForm.target_yield_tons}
                  onChange={(e) =>
                    setSeasonForm({
                      ...seasonForm,
                      target_yield_tons: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSeasonModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  حفظ الموسم
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Spray Log */}
      {isSprayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">تسجيل معاملة رش وتسميد مع فترة أمان (PHI)</h3>
              <button
                onClick={() => setIsSprayModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSpray} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الموسم المحصولي</label>
                  <select
                    value={sprayForm.crop_season_id}
                    onChange={(e) =>
                      setSprayForm({ ...sprayForm, crop_season_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.season_code} — {s.crop_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">كود المعاملة المرجعي</label>
                  <Input
                    required
                    value={sprayForm.spray_ref}
                    onChange={(e) => setSprayForm({ ...sprayForm, spray_ref: e.target.value })}
                    placeholder="مثال: SPR-2026-03"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم المبيد أو السماد</label>
                <Input
                  required
                  value={sprayForm.chemical_name}
                  onChange={(e) =>
                    setSprayForm({ ...sprayForm, chemical_name: e.target.value })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">المادة الفعالة والتركيز</label>
                  <Input
                    required
                    value={sprayForm.active_ingredient}
                    onChange={(e) =>
                      setSprayForm({ ...sprayForm, active_ingredient: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الجرعة / فدان</label>
                  <Input
                    required
                    value={sprayForm.dosage_per_feddan}
                    onChange={(e) =>
                      setSprayForm({ ...sprayForm, dosage_per_feddan: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">الهدف / الآفة المستهدفة</label>
                <Input
                  required
                  value={sprayForm.target_pest_or_deficiency}
                  onChange={(e) =>
                    setSprayForm({ ...sprayForm, target_pest_or_deficiency: e.target.value })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">فترة الأمان قبل الحصاد (PHI بالأيام)</label>
                  <Input
                    type="number"
                    required
                    value={sprayForm.withholding_days_phi}
                    onChange={(e) =>
                      setSprayForm({
                        ...sprayForm,
                        withholding_days_phi: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">المشرف المنفذ</label>
                  <Input
                    required
                    value={sprayForm.applied_by}
                    onChange={(e) => setSprayForm({ ...sprayForm, applied_by: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsSprayModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  حفظ المعاملة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Harvest Batch */}
      {isHarvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">توثيق دفعة حصاد وتصدير (GlobalG.A.P.)</h3>
              <button
                onClick={() => setIsHarvestModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateHarvest} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الموسم المحصولي</label>
                  <select
                    value={harvestForm.crop_season_id}
                    onChange={(e) =>
                      setHarvestForm({ ...harvestForm, crop_season_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.season_code} — {s.crop_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رقم التشغيلة (Batch Lot)</label>
                  <Input
                    required
                    value={harvestForm.batch_lot}
                    onChange={(e) =>
                      setHarvestForm({ ...harvestForm, batch_lot: e.target.value })
                    }
                    placeholder="مثال: LOT-2026-WHT-01"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الوزن الكلي (طن)</label>
                  <Input
                    type="number"
                    value={harvestForm.total_weight_tons}
                    onChange={(e) =>
                      setHarvestForm({
                        ...harvestForm,
                        total_weight_tons: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رتبة الجودة</label>
                  <select
                    value={harvestForm.grade_classification}
                    onChange={(e) =>
                      setHarvestForm({
                        ...harvestForm,
                        grade_classification: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="Class 1 (Export)">درجة أولى تصدير (Class 1)</option>
                    <option value="Class 2 (Local Premium)">درجة ثانية محلي ممتاز</option>
                    <option value="Industrial / Processing">تصنيع وتعبئة مركزة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">محطة الفرز والوجهة</label>
                <Input
                  required
                  value={harvestForm.destination_warehouse}
                  onChange={(e) =>
                    setHarvestForm({ ...harvestForm, destination_warehouse: e.target.value })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="globalgap"
                  checked={harvestForm.globalgap_compliant}
                  onChange={(e) =>
                    setHarvestForm({ ...harvestForm, globalgap_compliant: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="globalgap" className="text-xs text-zinc-300">
                  شهادة المطابقة القياسية الدولية (GlobalG.A.P. Certified)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsHarvestModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  توثيق الدفعة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Livestock Animal */}
      {isLivestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">تسجيل رأس ماشية في السجل الذكي (RFID)</h3>
              <button
                onClick={() => setIsLivestockModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLivestock} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم الشريحة الإلكترونية (RFID)</label>
                  <Input
                    required
                    value={livestockForm.rfid_tag}
                    onChange={(e) =>
                      setLivestockForm({ ...livestockForm, rfid_tag: e.target.value })
                    }
                    placeholder="مثال: RFID-EG-99401"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">السلالة</label>
                  <Input
                    required
                    value={livestockForm.breed}
                    onChange={(e) =>
                      setLivestockForm({ ...livestockForm, breed: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الجنس</label>
                  <select
                    value={livestockForm.gender}
                    onChange={(e) =>
                      setLivestockForm({ ...livestockForm, gender: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="female">أنثى</option>
                    <option value="male">ذكر</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الحالة الإنتاجية والبيطرية</label>
                  <select
                    value={livestockForm.health_status}
                    onChange={(e) =>
                      setLivestockForm({ ...livestockForm, health_status: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="lactating">مدر للحليب (حلاب)</option>
                    <option value="pregnant">عشار (حامل)</option>
                    <option value="healthy">سليم بيطرياً</option>
                    <option value="quarantined">في العزل البيطري</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الوزن الحالي (كجم)</label>
                  <Input
                    type="number"
                    value={livestockForm.current_weight_kg}
                    onChange={(e) =>
                      setLivestockForm({
                        ...livestockForm,
                        current_weight_kg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">إنتاج الحليب اليومي (لتر)</label>
                  <Input
                    type="number"
                    value={livestockForm.daily_milk_yield_liters}
                    onChange={(e) =>
                      setLivestockForm({
                        ...livestockForm,
                        daily_milk_yield_liters: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLivestockModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  حفظ وتسجيل الحيوان
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
