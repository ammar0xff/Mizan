import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CheckCircle2,
  DoorOpen,
  FileText,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Wrench,
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

interface RecSummary {
  total_properties_count: number;
  total_units_count: number;
  leased_units_count: number;
  vacant_units_count: number;
  occupancy_rate_pct: number;
  total_annual_rent_egp: number;
  open_maintenance_tickets_count: number;
}

interface RecProperty {
  id: string;
  property_code: string;
  property_name: string;
  property_type: string;
  city: string;
  district: string;
  total_units_count: number;
  gross_leasable_area_sqm: number;
  created_at?: string;
}

interface RecUnit {
  id: string;
  property_id: string;
  property_name: string;
  unit_number: string;
  floor: string;
  unit_type: string;
  area_sqm: number;
  annual_rent_rate_egp: number;
  service_charge_sqm_egp: number;
  status: string;
  current_tenant_name?: string | null;
}

interface RecContract {
  id: string;
  unit_id: string;
  unit_number: string;
  contract_ref: string;
  tenant_name: string;
  tenant_national_id: string;
  tenant_phone: string;
  start_date: string;
  end_date: string;
  annual_rent_egp: number;
  payment_frequency: string;
  security_deposit_egp: number;
  status: string;
  created_at?: string;
}

interface RecCheque {
  id: string;
  contract_id: string;
  contract_ref: string;
  tenant_name: string;
  cheque_number: string;
  bank_name: string;
  amount_egp: number;
  due_date: string;
  status: string;
  collected_at?: string | null;
}

interface RecTicket {
  id: string;
  unit_id: string;
  unit_number: string;
  ticket_ref: string;
  category: string;
  description: string;
  reported_by: string;
  cost_egp: number;
  is_cam_apportioned: boolean;
  status: string;
  created_at?: string;
}

export default function RealEstatePage() {
  const [activeTab, setActiveTab] = useState<
    "properties" | "units" | "contracts" | "cheques" | "tickets"
  >("properties");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Form states
  const [propForm, setPropForm] = useState({
    property_code: "",
    property_name: "",
    property_type: "commercial_mall",
    city: "القاهرة",
    district: "التجمع الخامس",
    total_units_count: 10,
    gross_leasable_area_sqm: 1500,
  });

  const [unitForm, setUnitForm] = useState({
    property_id: "",
    unit_number: "",
    floor: "الطابق الأول",
    unit_type: "office",
    area_sqm: 120,
    annual_rent_rate_egp: 240000,
    service_charge_sqm_egp: 150,
    status: "vacant",
    current_tenant_name: "",
  });

  const [contractForm, setContractForm] = useState({
    unit_id: "",
    contract_ref: "",
    tenant_name: "",
    tenant_national_id: "",
    tenant_phone: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    annual_rent_egp: 300000,
    payment_frequency: "quarterly",
    security_deposit_egp: 50000,
  });

  const [chequeForm, setChequeForm] = useState({
    contract_id: "",
    cheque_number: "",
    bank_name: "البنك الأهلي المصري",
    amount_egp: 75000,
    due_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
    status: "in_safe",
  });

  const [ticketForm, setTicketForm] = useState({
    unit_id: "",
    ticket_ref: "",
    category: "HVAC / تكييف وتبريد مركزي",
    description: "",
    reported_by: "",
    cost_egp: 1200,
    is_cam_apportioned: true,
    status: "open",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery<RecSummary>({
    queryKey: ["rec-summary"],
    queryFn: () => api.get<RecSummary>("/rec/summary"),
  });

  const { data: properties = [], isLoading: isPropertiesLoading, refetch: refetchProperties } = useQuery<RecProperty[]>({
    queryKey: ["rec-properties"],
    queryFn: () => api.get<RecProperty[]>("/rec/properties"),
  });

  const { data: units = [], isLoading: isUnitsLoading, refetch: refetchUnits } = useQuery<RecUnit[]>({
    queryKey: ["rec-units"],
    queryFn: () => api.get<RecUnit[]>("/rec/units"),
  });

  const { data: contracts = [], isLoading: isContractsLoading, refetch: refetchContracts } = useQuery<RecContract[]>({
    queryKey: ["rec-contracts"],
    queryFn: () => api.get<RecContract[]>("/rec/contracts"),
  });

  const { data: cheques = [], isLoading: isChequesLoading, refetch: refetchCheques } = useQuery<RecCheque[]>({
    queryKey: ["rec-cheques"],
    queryFn: () => api.get<RecCheque[]>("/rec/cheques"),
  });

  const { data: tickets = [], isLoading: isTicketsLoading, refetch: refetchTickets } = useQuery<RecTicket[]>({
    queryKey: ["rec-tickets"],
    queryFn: () => api.get<RecTicket[]>("/rec/tickets"),
  });

  const refreshAll = () => {
    sound.click();
    refetchSummary();
    refetchProperties();
    refetchUnits();
    refetchContracts();
    refetchCheques();
    refetchTickets();
    toast("success", "تم تحديث كافة بيانات العقارات وإدارة الأملاك بنجاح");
  };

  // Handlers
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/rec/properties", propForm);
      toast("success", "تم إضافة العقار والمجمع الاستثماري بنجاح");
      setIsPropertyModalOpen(false);
      refetchProperties();
      refetchSummary();
    } catch {
      toast("error", "فشل إضافة العقار الجديد");
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/rec/units", unitForm);
      toast("success", "تم تسجيل الوحدة العقارية بنجاح");
      setIsUnitModalOpen(false);
      refetchUnits();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل الوحدة");
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/rec/contracts", contractForm);
      toast("success", "تم توثيق عقد الإيجار وتحديث حالة الوحدة تلقائياً");
      setIsContractModalOpen(false);
      refetchContracts();
      refetchUnits();
      refetchSummary();
    } catch {
      toast("error", "فشل توثيق العقد الإيجاري");
    }
  };

  const handleCreateCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/rec/cheques", chequeForm);
      toast("success", "تم إيداع الشيك في الخزينة الرقمية بنجاح");
      setIsChequeModalOpen(false);
      refetchCheques();
    } catch {
      toast("error", "فشل حفظ بيانات الشيك");
    }
  };

  const handleUpdateChequeStatus = async (id: string, newStatus: string) => {
    sound.click();
    try {
      await api.post(`/rec/cheques/${id}/status`, {
        status: newStatus,
        collected_at: newStatus === "cleared" ? new Date().toISOString().split("T")[0] : null,
      });
      toast("success", `تم تحديث حالة الشيك إلى ${newStatus === "cleared" ? "تم التحصيل" : newStatus === "deposited" ? "أودع للتحصيل" : "مرتد"}`);
      refetchCheques();
      queryClient.invalidateQueries({ queryKey: ["rec-cheques"] });
    } catch {
      toast("error", "فشل تحديث حالة الشيك");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/rec/tickets", ticketForm);
      toast("success", "تم فتح تذكرة الصيانة وتوزيع التكاليف المشتركة (CAM)");
      setIsTicketModalOpen(false);
      refetchTickets();
      refetchSummary();
    } catch {
      toast("error", "فشل إنشاء تذكرة الصيانة");
    }
  };

  // Filters
  const filteredProperties = properties.filter(
    (p) =>
      p.property_name.toLowerCase().includes(search.toLowerCase()) ||
      p.property_code.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUnits = units.filter(
    (u) =>
      u.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      u.property_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.current_tenant_name && u.current_tenant_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredContracts = contracts.filter(
    (c) =>
      c.contract_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      c.unit_number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCheques = cheques.filter(
    (ch) =>
      ch.cheque_number.toLowerCase().includes(search.toLowerCase()) ||
      ch.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      ch.bank_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_ref.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.reported_by.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                إدارة التطوير العقاري والأملاك (RE)
              </h1>
              <p className="text-sm text-zinc-400">
                محفظة الأصول، مصفوفة الشواغر والإشغال، عقود الإيجار، خزانة الشيكات (PDC)، والتكاليف المشتركة (CAM)
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

          {activeTab === "properties" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsPropertyModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة عقار / مجمع
            </Button>
          )}

          {activeTab === "units" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (properties.length > 0) {
                  setUnitForm((prev) => ({ ...prev, property_id: properties[0].id }));
                }
                setIsUnitModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل وحدة جديدة
            </Button>
          )}

          {activeTab === "contracts" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (units.length > 0) {
                  setContractForm((prev) => ({ ...prev, unit_id: units[0].id }));
                }
                setIsContractModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              توثيق عقد إيجار
            </Button>
          )}

          {activeTab === "cheques" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (contracts.length > 0) {
                  setChequeForm((prev) => ({ ...prev, contract_id: contracts[0].id }));
                }
                setIsChequeModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              إيداع شيك (PDC)
            </Button>
          )}

          {activeTab === "tickets" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (units.length > 0) {
                  setTicketForm((prev) => ({ ...prev, unit_id: units[0].id }));
                }
                setIsTicketModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              فتح تذكرة صيانة / CAM
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">العقارات والمجمعات</span>
            <Building2 className="h-4 w-4 text-amber-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {summary?.total_properties_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">مجمع</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">إجمالي الوحدات</span>
            <DoorOpen className="h-4 w-4 text-blue-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {summary?.total_units_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">وحدة</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">الوحدات المؤجرة</span>
            <KeyRound className="h-4 w-4 text-emerald-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-emerald-400">
                {summary?.leased_units_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">مستأجرة</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">نسبة الإشغال (Occupancy)</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-purple-400">
                {summary?.occupancy_rate_pct ?? 0}%
              </span>
              <span className="text-xs text-zinc-500">شواغر {summary?.vacant_units_count ?? 0}</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">الإيجار السنوي الإجمالي</span>
            <Banknote className="h-4 w-4 text-amber-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <div className="mt-2">
              <div className="font-mono text-xl font-bold text-white">
                {(summary?.total_annual_rent_egp ?? 0).toLocaleString()}
              </div>
              <span className="text-xs text-zinc-500">ج.م سنوياً</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">تذاكر الصيانة المفتوحة</span>
            <Wrench className="h-4 w-4 text-rose-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-rose-400">
                {summary?.open_maintenance_tickets_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">تذكرة قيد المعالجة</span>
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
              setActiveTab("properties");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "properties"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            محفظة العقارات والمجمعات
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("units");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "units"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <DoorOpen className="h-4 w-4" />
            مصفوفة الوحدات والشواغر
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("contracts");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "contracts"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            عقود الإيجار والتأجير
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("cheques");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "cheques"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Banknote className="h-4 w-4" />
            خزانة الشيكات الآجلة (PDC)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("tickets");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "tickets"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Wrench className="h-4 w-4" />
            الصيانة والمصاريف المشتركة (CAM)
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

      {/* Tab 1: Properties Portfolio */}
      {activeTab === "properties" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                محفظة الأصول والمشاريع العقارية
              </h2>
              <p className="text-xs text-zinc-400">
                تسجيل المولات التجارية، المجمعات السكنية، والأبراج الإدارية ومساحاتها التأجيرية
              </p>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              {filteredProperties.length} عقار مسجل
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">كود العقار</TableHead>
                  <TableHead className="text-zinc-400">اسم العقار / المشروع</TableHead>
                  <TableHead className="text-zinc-400">النوع</TableHead>
                  <TableHead className="text-zinc-400">المدينة والمنطقة</TableHead>
                  <TableHead className="text-zinc-400">عدد الوحدات</TableHead>
                  <TableHead className="text-zinc-400">المساحة التأجيرية (GLA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPropertiesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                      لا توجد عقارات مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProperties.map((p) => (
                    <TableRow key={p.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-semibold text-amber-400">
                        {p.property_code}
                      </TableCell>
                      <TableCell className="font-medium text-white">{p.property_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-zinc-800/80 text-zinc-300 text-xs"
                        >
                          {p.property_type === "commercial_mall"
                            ? "مول تجاري"
                            : p.property_type === "office_tower"
                            ? "برج إداري"
                            : p.property_type === "residential_compound"
                            ? "مجمع سكني"
                            : "متعدد الاستخدام"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {p.city} — {p.district}
                      </TableCell>
                      <TableCell className="font-mono text-zinc-300">
                        {p.total_units_count} وحدة
                      </TableCell>
                      <TableCell className="font-mono font-medium text-emerald-400">
                        {p.gross_leasable_area_sqm.toLocaleString()} م²
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 2: Units Matrix */}
      {activeTab === "units" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                مصفوفة الوحدات العقارية والشواغر
              </h2>
              <p className="text-xs text-zinc-400">
                لوحة إشغال المحلات والمكاتب، أسعار المتر الإيجاري، والتكاليف الخدمية
              </p>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {filteredUnits.length} وحدة معروضة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم الوحدة</TableHead>
                  <TableHead className="text-zinc-400">العقار التابع له</TableHead>
                  <TableHead className="text-zinc-400">الطابق والنوع</TableHead>
                  <TableHead className="text-zinc-400">المساحة</TableHead>
                  <TableHead className="text-zinc-400">الإيجار السنوي</TableHead>
                  <TableHead className="text-zinc-400">خدمات الصيانة / م²</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                  <TableHead className="text-zinc-400">المستأجر الحالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUnitsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUnits.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد وحدات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnits.map((u) => (
                    <TableRow key={u.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono font-bold text-white">
                        {u.unit_number}
                      </TableCell>
                      <TableCell className="text-zinc-300">{u.property_name}</TableCell>
                      <TableCell className="text-zinc-400">
                        {u.floor} ({u.unit_type === "retail_shop" ? "محل تجاري" : "مكتب إداري"})
                      </TableCell>
                      <TableCell className="font-mono text-zinc-300">{u.area_sqm} م²</TableCell>
                      <TableCell className="font-mono font-semibold text-emerald-400">
                        {u.annual_rent_rate_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-zinc-400">
                        {u.service_charge_sqm_egp} ج.م / م²
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            u.status === "leased"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : u.status === "reserved"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }
                        >
                          {u.status === "leased"
                            ? "مؤجرة"
                            : u.status === "vacant"
                            ? "شاغرة"
                            : "محجوزة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {u.current_tenant_name ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 3: Lease Contracts */}
      {activeTab === "contracts" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                عقود الإيجار والاتفاقيات الاستثمارية
              </h2>
              <p className="text-xs text-zinc-400">
                إدارة دورة حياة العقود، فترات السماح، مواعيد التجديد، والتأمين المسترد
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              {filteredContracts.length} عقد سارٍ
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم العقد</TableHead>
                  <TableHead className="text-zinc-400">الوحدة</TableHead>
                  <TableHead className="text-zinc-400">اسم المستأجر وبياناته</TableHead>
                  <TableHead className="text-zinc-400">فترة العقد</TableHead>
                  <TableHead className="text-zinc-400">الإيجار السنوي</TableHead>
                  <TableHead className="text-zinc-400">دورية السداد</TableHead>
                  <TableHead className="text-zinc-400">مبلغ التأمين</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isContractsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredContracts.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد عقود إيجار مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((c) => (
                    <TableRow key={c.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {c.contract_ref}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-white">
                        {c.unit_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{c.tenant_name}</div>
                        <div className="font-mono text-xs text-zinc-500">{c.tenant_phone}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {c.start_date} إلى {c.end_date}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {c.annual_rent_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {c.payment_frequency === "quarterly"
                          ? "ربع سنوي (4 دفعات)"
                          : c.payment_frequency === "monthly"
                          ? "شهري"
                          : "سنوي"}
                      </TableCell>
                      <TableCell className="font-mono text-zinc-300">
                        {c.security_deposit_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {c.status === "active" ? "ساري المفعول" : c.status}
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

      {/* Tab 4: PDC Cheques Vault */}
      {activeTab === "cheques" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                خزانة الشيكات الآجلة (PDC Vault)
              </h2>
              <p className="text-xs text-zinc-400">
                إدارة استحقاقات الشيكات البنكية، جدولة الإيداع، وإشعارات التحصيل والارتداد
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              {filteredCheques.length} شيك في الخزانة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم الشيك</TableHead>
                  <TableHead className="text-zinc-400">المستأجر والعقد</TableHead>
                  <TableHead className="text-zinc-400">البنك المسحوب عليه</TableHead>
                  <TableHead className="text-zinc-400">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-zinc-400">قيمة الشيك</TableHead>
                  <TableHead className="text-zinc-400">حالة الشيك</TableHead>
                  <TableHead className="text-zinc-400 text-left">إجراءات الخزينة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isChequesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredCheques.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                      لا توجد شيكات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCheques.map((ch) => (
                    <TableRow key={ch.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono font-bold text-amber-400">
                        {ch.cheque_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{ch.tenant_name}</div>
                        <div className="font-mono text-xs text-zinc-500">عقد: {ch.contract_ref}</div>
                      </TableCell>
                      <TableCell className="text-zinc-300">{ch.bank_name}</TableCell>
                      <TableCell className="font-mono text-zinc-300">{ch.due_date}</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {ch.amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            ch.status === "cleared"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : ch.status === "deposited"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : ch.status === "bounced"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-zinc-800 text-zinc-300"
                          }
                        >
                          {ch.status === "cleared"
                            ? "تم التحصيل"
                            : ch.status === "deposited"
                            ? "أودع للتحصيل"
                            : ch.status === "bounced"
                            ? "شيك مرتد"
                            : "في الخزينة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        {ch.status === "in_safe" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateChequeStatus(ch.id, "deposited")}
                            className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            إيداع في البنك
                          </Button>
                        )}
                        {ch.status === "deposited" && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateChequeStatus(ch.id, "cleared")}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              تسجيل كـ تم التحصيل
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateChequeStatus(ch.id, "bounced")}
                              className="h-7 text-xs"
                            >
                              ارتداد
                            </Button>
                          </div>
                        )}
                        {ch.status === "cleared" && (
                          <span className="font-mono text-xs text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> تم التحصيل ({ch.collected_at})
                          </span>
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

      {/* Tab 5: Maintenance & CAM Apportionment */}
      {activeTab === "tickets" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                تذاكر الصيانة والمصاريف المشتركة (CAM)
              </h2>
              <p className="text-xs text-zinc-400">
                تسجيل شكاوى المستأجرين، صيانة التكييف والمصاعد، وتوزيع تكاليف التشغيل
              </p>
            </div>
            <Badge variant="outline" className="border-rose-500/30 text-rose-400">
              {filteredTickets.length} تذكرة صيانة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم البلاغ</TableHead>
                  <TableHead className="text-zinc-400">الوحدة</TableHead>
                  <TableHead className="text-zinc-400">التصنيف</TableHead>
                  <TableHead className="text-zinc-400">الوصف والمشكلة</TableHead>
                  <TableHead className="text-zinc-400">مُقدم البلاغ</TableHead>
                  <TableHead className="text-zinc-400">التكلفة التقديرية</TableHead>
                  <TableHead className="text-zinc-400">توزيع CAM</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTicketsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد تذاكر صيانة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((t) => (
                    <TableRow key={t.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {t.ticket_ref}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-white">
                        {t.unit_number}
                      </TableCell>
                      <TableCell className="text-zinc-300">{t.category}</TableCell>
                      <TableCell className="text-zinc-300 max-w-xs truncate">{t.description}</TableCell>
                      <TableCell className="text-zinc-400">{t.reported_by}</TableCell>
                      <TableCell className="font-mono font-semibold text-rose-400">
                        {t.cost_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        {t.is_cam_apportioned ? (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">
                            مشتركة (CAM)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                            خاصة بالوحدة
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            t.status === "resolved"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }
                        >
                          {t.status === "open"
                            ? "مفتوحة"
                            : t.status === "in_progress"
                            ? "قيد المعالجة"
                            : "تم الحل"}
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

      {/* Modal: New Property */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إضافة عقار / مجمع استثماري جديد</h3>
              <button
                onClick={() => setIsPropertyModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProperty} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">كود العقار</label>
                  <Input
                    required
                    value={propForm.property_code}
                    onChange={(e) => setPropForm({ ...propForm, property_code: e.target.value })}
                    placeholder="مثال: PROP-MALL-01"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نوع العقار</label>
                  <select
                    value={propForm.property_type}
                    onChange={(e) => setPropForm({ ...propForm, property_type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="commercial_mall">مول تجاري</option>
                    <option value="office_tower">برج إداري</option>
                    <option value="residential_compound">مجمع سكني</option>
                    <option value="mixed_use">متعدد الاستخدامات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم العقار / المشروع</label>
                <Input
                  required
                  value={propForm.property_name}
                  onChange={(e) => setPropForm({ ...propForm, property_name: e.target.value })}
                  placeholder="مثال: مجمع سيتي سنتر الإداري"
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">المدينة</label>
                  <Input
                    required
                    value={propForm.city}
                    onChange={(e) => setPropForm({ ...propForm, city: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">المنطقة / الحي</label>
                  <Input
                    required
                    value={propForm.district}
                    onChange={(e) => setPropForm({ ...propForm, district: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">عدد الوحدات الإجمالي</label>
                  <Input
                    type="number"
                    value={propForm.total_units_count}
                    onChange={(e) =>
                      setPropForm({ ...propForm, total_units_count: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">المساحة التأجيرية (م² GLA)</label>
                  <Input
                    type="number"
                    value={propForm.gross_leasable_area_sqm}
                    onChange={(e) =>
                      setPropForm({
                        ...propForm,
                        gross_leasable_area_sqm: parseFloat(e.target.value) || 0,
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
                  onClick={() => setIsPropertyModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ العقار
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Unit */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">تسجيل وحدة عقارية جديدة</h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUnit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400">العقار التابع له</label>
                <select
                  value={unitForm.property_id}
                  onChange={(e) => setUnitForm({ ...unitForm, property_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.property_name} ({p.property_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم الوحدة</label>
                  <Input
                    required
                    value={unitForm.unit_number}
                    onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                    placeholder="مثال: U-204"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الطابق</label>
                  <Input
                    required
                    value={unitForm.floor}
                    onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })}
                    placeholder="مثال: الطابق الثاني"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">نوع الوحدة</label>
                  <select
                    value={unitForm.unit_type}
                    onChange={(e) => setUnitForm({ ...unitForm, unit_type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="office">مكتب إداري</option>
                    <option value="retail_shop">محل تجاري</option>
                    <option value="luxury_apartment">شقة فاخرة</option>
                    <option value="penthouse">بنتهاوس</option>
                    <option value="villa">فيلا مستقلة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">المساحة الإجمالية (م²)</label>
                  <Input
                    type="number"
                    value={unitForm.area_sqm}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, area_sqm: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الإيجار السنوي المقدر (ج.م)</label>
                  <Input
                    type="number"
                    value={unitForm.annual_rent_rate_egp}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        annual_rent_rate_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تكلفة الخدمات والصيانة / م²</label>
                  <Input
                    type="number"
                    value={unitForm.service_charge_sqm_egp}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        service_charge_sqm_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsUnitModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ الوحدة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Lease Contract */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">توثيق عقد إيجار جديد</h3>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateContract} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الوحدة المؤجرة</label>
                  <select
                    value={contractForm.unit_id}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, unit_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} ({u.property_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رقم العقد المرجعي</label>
                  <Input
                    required
                    value={contractForm.contract_ref}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, contract_ref: e.target.value })
                    }
                    placeholder="مثال: LC-2026-004"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم المستأجر / الشركة</label>
                <Input
                  required
                  value={contractForm.tenant_name}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, tenant_name: e.target.value })
                  }
                  placeholder="مثال: شركة النيل للحلول الرقمية"
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الرقم القومي / السجل التجاري</label>
                  <Input
                    required
                    value={contractForm.tenant_national_id}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, tenant_national_id: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رقم هاتف الاتصال</label>
                  <Input
                    required
                    value={contractForm.tenant_phone}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, tenant_phone: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">تاريخ بدء العقد</label>
                  <Input
                    type="date"
                    value={contractForm.start_date}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, start_date: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تاريخ نهاية العقد</label>
                  <Input
                    type="date"
                    value={contractForm.end_date}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, end_date: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الإيجار السنوي (ج.م)</label>
                  <Input
                    type="number"
                    value={contractForm.annual_rent_egp}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        annual_rent_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">دورية السداد</label>
                  <select
                    value={contractForm.payment_frequency}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, payment_frequency: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="quarterly">ربع سنوي</option>
                    <option value="monthly">شهري</option>
                    <option value="semi_annual">نصف سنوي</option>
                    <option value="annual">سنوي دفعة واحدة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">التأمين المسترد (ج.م)</label>
                  <Input
                    type="number"
                    value={contractForm.security_deposit_egp}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        security_deposit_egp: parseFloat(e.target.value) || 0,
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
                  onClick={() => setIsContractModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  توثيق العقد
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New PDC Cheque */}
      {isChequeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">إيداع شيك آجل (PDC) بالخزانة</h3>
              <button
                onClick={() => setIsChequeModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCheque} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400">عقد الإيجار المرتبط</label>
                <select
                  value={chequeForm.contract_id}
                  onChange={(e) => setChequeForm({ ...chequeForm, contract_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contract_ref} — {c.tenant_name} (وحدة {c.unit_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم الشيك البنكي</label>
                  <Input
                    required
                    value={chequeForm.cheque_number}
                    onChange={(e) =>
                      setChequeForm({ ...chequeForm, cheque_number: e.target.value })
                    }
                    placeholder="مثال: CHQ-884019"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">اسم البنك</label>
                  <Input
                    required
                    value={chequeForm.bank_name}
                    onChange={(e) => setChequeForm({ ...chequeForm, bank_name: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">مبلغ الشيك (ج.م)</label>
                  <Input
                    type="number"
                    value={chequeForm.amount_egp}
                    onChange={(e) =>
                      setChequeForm({
                        ...chequeForm,
                        amount_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تاريخ الاستحقاق</label>
                  <Input
                    type="date"
                    value={chequeForm.due_date}
                    onChange={(e) => setChequeForm({ ...chequeForm, due_date: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsChequeModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ وإيداع الشيك
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Maintenance Ticket */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">فتح تذكرة صيانة / مصاريف مشتركة (CAM)</h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الوحدة العقارية المعنية</label>
                  <select
                    value={ticketForm.unit_id}
                    onChange={(e) => setTicketForm({ ...ticketForm, unit_id: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} ({u.property_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رقم البلاغ / التذكرة</label>
                  <Input
                    required
                    value={ticketForm.ticket_ref}
                    onChange={(e) => setTicketForm({ ...ticketForm, ticket_ref: e.target.value })}
                    placeholder="مثال: TKT-2026-003"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">تصنيف العطل</label>
                  <Input
                    required
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">مُقدم البلاغ</label>
                  <Input
                    required
                    value={ticketForm.reported_by}
                    onChange={(e) => setTicketForm({ ...ticketForm, reported_by: e.target.value })}
                    placeholder="اسم المشتكي أو المهندس"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">تفاصيل العطل والعمل المطلوب</label>
                <textarea
                  required
                  rows={3}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="صيانة وإصلاح وحدة تبريد Chiller أو تسريب مياه..."
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">التكلفة التقديرية (ج.م)</label>
                  <Input
                    type="number"
                    value={ticketForm.cost_egp}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        cost_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_cam"
                    checked={ticketForm.is_cam_apportioned}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, is_cam_apportioned: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="is_cam" className="text-xs text-zinc-300">
                    توزيع التكلفة كمصاريف عامة مشتركة (CAM)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsTicketModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  فتح التذكرة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
