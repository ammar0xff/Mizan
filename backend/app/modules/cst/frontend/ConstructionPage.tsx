import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Building,
  Coins,
  FileCheck,
  FileText,
  HardHat,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
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

interface CstSummary {
  active_projects_count: number;
  total_contract_value_egp: number;
  total_ipc_certified_egp: number;
  total_change_orders_egp: number;
  active_machinery_count: number;
  total_guarantees_amount_egp: number;
}

interface CstProject {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string;
  consultant_name: string;
  contract_value_egp: number;
  start_date?: string;
  expected_completion_date?: string;
  retention_rate_pct: number;
  advance_payment_pct: number;
  status: "planning" | "in_progress" | "snagging" | "completed" | "handed_over";
  total_billed_egp: number;
  total_collected_egp: number;
  created_at?: string;
}

interface CstBoqItem {
  id: string;
  project_id: string;
  item_code: string;
  description: string;
  unit: string;
  planned_quantity: number;
  unit_rate_egp: number;
  total_budget_egp: number;
  actual_executed_qty: number;
}

interface CstIpcCertificate {
  id: string;
  project_id: string;
  project_name: string;
  ipc_number: string;
  period_start: string;
  period_end: string;
  gross_amount_egp: number;
  retention_deduction_egp: number;
  advance_recovery_egp: number;
  net_payable_egp: number;
  status: "draft" | "submitted_to_consultant" | "certified" | "invoiced" | "paid";
  consultant_approval_date?: string;
  consultant_notes?: string;
  created_at?: string;
}

interface CstChangeOrder {
  id: string;
  project_id: string;
  project_name: string;
  variation_ref: string;
  title: string;
  scope_description: string;
  requested_amount_egp: number;
  approved_amount_egp: number;
  time_extension_days: number;
  status: "proposed" | "under_review" | "approved" | "rejected";
  created_at?: string;
}

interface CstHeavyMachineryLog {
  id: string;
  project_id: string;
  equipment_tag: string;
  equipment_name: string;
  operator_name: string;
  operating_hours: number;
  idle_hours: number;
  diesel_liters: number;
  status: "operational" | "standby" | "maintenance";
  log_date: string;
}

interface CstLetterOfGuarantee {
  id: string;
  project_id: string;
  lg_number: string;
  bank_name: string;
  bond_type: "bid_bond" | "performance_bond" | "advance_payment" | "retention";
  amount_egp: number;
  cash_margin_pct: number;
  issue_date: string;
  expiry_date: string;
  status: "active" | "extended" | "released" | "liquidated";
}

export default function ConstructionPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"projects" | "boq" | "ipc" | "variations" | "machinery" | "guarantees">("projects");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewIpcOpen, setIsNewIpcOpen] = useState(false);
  const [isNewCoOpen, setIsNewCoOpen] = useState(false);
  const [isNewMachineryOpen, setIsNewMachineryOpen] = useState(false);
  const [isNewLgOpen, setIsNewLgOpen] = useState(false);

  // Form states
  const [newProject, setNewProject] = useState({
    project_code: "PRJ-ZAY-2026-03",
    project_name: "مستشفى الشيخ زايد التخصصي الجديد (سعة 250 سرير)",
    client_name: "وزارة الإسكان والمرافق والمجتمعات العمرانية",
    consultant_name: "مجموعة شاكر الاستشارية (Shaker Consultancy)",
    contract_value_egp: 142000000,
    start_date: "2026-11-01",
    expected_completion_date: "2028-05-30",
    retention_rate_pct: 5.0,
    advance_payment_pct: 10.0,
    status: "in_progress",
  });

  const [newIpc, setNewIpc] = useState({
    project_id: "",
    ipc_number: "IPC-005-DEC2026",
    period_start: "2026-11-01",
    period_end: "2026-11-30",
    gross_amount_egp: 15400000,
    retention_deduction_egp: 770000,
    advance_recovery_egp: 1540000,
    consultant_approval_date: "2026-12-05",
    consultant_notes: "تمت المعاينة ومطابقة اختبارات تكسير مكعبات الخرسانة والأوتوكاد As-Built.",
  });

  const [newCo, setNewCo] = useState({
    project_id: "",
    variation_ref: "VO-NC-2026-002",
    title: "تعديل أعمال شبكات إطفاء الحريق والرشاشات التلقائية لغرف السيرفرات (FM200)",
    scope_description: "استبدال شبكة الإطفاء بالمياه إلى نظام الغاز النظيف FM200 لمركز البيانات المركزي",
    requested_amount_egp: 4200000,
    approved_amount_egp: 3850000,
    time_extension_days: 20,
    status: "approved",
  });

  const [newMach, setNewMach] = useState({
    project_id: "",
    equipment_tag: "EQ-PUMP-03",
    equipment_name: "مضخة خرسانة متحركة Schwing Stetter 52m",
    operator_name: "الأسطى محروس برعي",
    operating_hours: 10.5,
    idle_hours: 1.0,
    diesel_liters: 220,
    status: "operational",
    log_date: "2026-11-02",
  });

  const [newLg, setNewLg] = useState({
    project_id: "",
    lg_number: "LG-MISR-ADV-9941",
    bank_name: "بنك مصر (Banque Misr) - فرع المعاملات الدولية",
    bond_type: "advance_payment",
    amount_egp: 14200000,
    cash_margin_pct: 10.0,
    issue_date: "2026-11-01",
    expiry_date: "2027-11-01",
    status: "active",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<CstSummary>({
    queryKey: ["cst", "summary"],
    queryFn: () => api.get<CstSummary>("/cst/summary"),
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<CstProject[]>({
    queryKey: ["cst", "projects"],
    queryFn: () => api.get<CstProject[]>("/cst/projects"),
  });

  const { data: boqItems = [], isLoading: isBoqLoading } = useQuery<CstBoqItem[]>({
    queryKey: ["cst", "boq-items"],
    queryFn: () => api.get<CstBoqItem[]>("/cst/boq-items"),
  });

  const { data: ipcs = [], isLoading: isIpcsLoading } = useQuery<CstIpcCertificate[]>({
    queryKey: ["cst", "ipcs"],
    queryFn: () => api.get<CstIpcCertificate[]>("/cst/ipcs"),
  });

  const { data: changeOrders = [], isLoading: isCosLoading } = useQuery<CstChangeOrder[]>({
    queryKey: ["cst", "change-orders"],
    queryFn: () => api.get<CstChangeOrder[]>("/cst/change-orders"),
  });

  const { data: machineryLogs = [], isLoading: isMachLoading } = useQuery<CstHeavyMachineryLog[]>({
    queryKey: ["cst", "machinery-logs"],
    queryFn: () => api.get<CstHeavyMachineryLog[]>("/cst/machinery-logs"),
  });

  const { data: guarantees = [], isLoading: isLgsLoading } = useQuery<CstLetterOfGuarantee[]>({
    queryKey: ["cst", "guarantees"],
    queryFn: () => api.get<CstLetterOfGuarantee[]>("/cst/guarantees"),
  });

  // Handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/cst/projects", {
        ...newProject,
        contract_value_egp: Number(newProject.contract_value_egp),
      });
      sound.click();
      toast("success", "تم إنشاء المشروع الإنشائي وتسجيل العقد بنجاح");
      setIsNewProjectOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cst"] });
    } catch {
      toast("error", "فشل في تسجيل المشروع");
    }
  };

  const handleCreateIpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpc.project_id) {
      toast("error", "يرجى تحديد المشروع الإنشائي للمستخلص");
      return;
    }
    try {
      await api.post("/cst/ipcs", {
        ...newIpc,
        gross_amount_egp: Number(newIpc.gross_amount_egp),
        retention_deduction_egp: Number(newIpc.retention_deduction_egp),
        advance_recovery_egp: Number(newIpc.advance_recovery_egp),
      });
      sound.click();
      toast("success", "تم إنشاء واعتماد مستخلص التنفيذ (IPC) واحتساب صافي المستحق");
      setIsNewIpcOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cst"] });
    } catch {
      toast("error", "فشل في تسجيل المستخلص");
    }
  };

  const handleCreateCo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCo.project_id) {
      toast("error", "يرجى تحديد المشروع لأمر التغيير");
      return;
    }
    try {
      await api.post("/cst/change-orders", {
        ...newCo,
        requested_amount_egp: Number(newCo.requested_amount_egp),
        approved_amount_egp: Number(newCo.approved_amount_egp),
        time_extension_days: Number(newCo.time_extension_days),
      });
      sound.click();
      toast("success", "تم تسجيل أمر التغيير والملحق الزمني والمادي بنجاح");
      setIsNewCoOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cst"] });
    } catch {
      toast("error", "فشل في تسجيل أمر التغيير");
    }
  };

  const handleCreateMach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMach.project_id) {
      toast("error", "يرجى تحديد المشروع التابع للمعدة");
      return;
    }
    try {
      await api.post("/cst/machinery-logs", {
        ...newMach,
        operating_hours: Number(newMach.operating_hours),
        idle_hours: Number(newMach.idle_hours),
        diesel_liters: Number(newMach.diesel_liters),
      });
      sound.click();
      toast("success", "تم توثيق سجل تشغيل المعدة الثقيلة واستهلاك الديزل");
      setIsNewMachineryOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cst"] });
    } catch {
      toast("error", "فشل في تسجيل المعدة");
    }
  };

  const handleCreateLg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLg.project_id) {
      toast("error", "يرجى تحديد المشروع لخطاب الضمان");
      return;
    }
    try {
      await api.post("/cst/guarantees", {
        ...newLg,
        amount_egp: Number(newLg.amount_egp),
        cash_margin_pct: Number(newLg.cash_margin_pct),
      });
      sound.click();
      toast("success", "تم تسجيل خطاب الضمان البنكي (LG) في الخزينة");
      setIsNewLgOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cst"] });
    } catch {
      toast("error", "فشل في تسجيل خطاب الضمان");
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.project_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              المقاولات العامة والإنشاءات الهندسية (Construction & EPC)
            </h1>
            <p className="text-sm text-muted-foreground">
              هيكل تجزئة العمل WBS، جداول الكميات BOQ، مستخلصات التنفيذ IPC، أوامر التغيير، وإدارة المعدات والضمانات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "projects" && (
            <Button
              onClick={() => {
                sound.click();
                setIsNewProjectOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4" />
              مشروع إنشائي جديد
            </Button>
          )}

          {activeTab === "ipc" && (
            <Button
              onClick={() => {
                sound.click();
                if (projects.length > 0 && !newIpc.project_id) {
                  setNewIpc((prev) => ({ ...prev, project_id: projects[0].id }));
                }
                setIsNewIpcOpen(true);
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileCheck className="h-4 w-4" />
              مستخلص تنفيذ جديد (IPC)
            </Button>
          )}

          {activeTab === "variations" && (
            <Button
              onClick={() => {
                sound.click();
                if (projects.length > 0 && !newCo.project_id) {
                  setNewCo((prev) => ({ ...prev, project_id: projects[0].id }));
                }
                setIsNewCoOpen(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              أمر تغيير تعاقدي (Change Order)
            </Button>
          )}

          {activeTab === "machinery" && (
            <Button
              onClick={() => {
                sound.click();
                if (projects.length > 0 && !newMach.project_id) {
                  setNewMach((prev) => ({ ...prev, project_id: projects[0].id }));
                }
                setIsNewMachineryOpen(true);
              }}
              className="gap-2 bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700"
            >
              <Truck className="h-4 w-4" />
              تسجيل تشغيل معدة ثقيلة
            </Button>
          )}

          {activeTab === "guarantees" && (
            <Button
              onClick={() => {
                sound.click();
                if (projects.length > 0 && !newLg.project_id) {
                  setNewLg((prev) => ({ ...prev, project_id: projects[0].id }));
                }
                setIsNewLgOpen(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Banknote className="h-4 w-4" />
              خطاب ضمان بنكي (LG)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">المشروعات الجارية</span>
            <Building className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.active_projects_count ?? 0}
          </div>
          <span className="text-xs text-muted-foreground">مواقع تحت التنفيذ والإنشاء</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">قيمة العقود الإجمالية</span>
            <Coins className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : `${((summary?.total_contract_value_egp ?? 0) / 1000000).toFixed(1)}M ج.م`}
          </div>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">العطاءات والتعاقدات المعتمدة</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">مستخلصات معتمدة (IPC)</span>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : `${((summary?.total_ipc_certified_egp ?? 0) / 1000000).toFixed(2)}M ج.م`}
          </div>
          <span className="text-xs text-muted-foreground">صافي بعد خصم الاستقطاعات</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">أوامر التغيير المعتمدة</span>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : `${((summary?.total_change_orders_egp ?? 0) / 1000000).toFixed(2)}M ج.م`}
          </div>
          <span className="text-xs text-muted-foreground">إضافات تعاقدية معتمدة (VO)</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-zinc-600 dark:border-l-zinc-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">المعدات الثقيلة العاملة</span>
            <Truck className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? <Skeleton className="h-7 w-12" /> : summary?.active_machinery_count ?? 0}
          </div>
          <span className="text-xs text-muted-foreground">أوناش وحفارات وخلاطات</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">خطابات الضمان النشطة</span>
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : `${((summary?.total_guarantees_amount_egp ?? 0) / 1000000).toFixed(2)}M ج.م`}
          </div>
          <span className="text-xs text-muted-foreground">حسن تنفيذ ودفعة مقدمة LG</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            sound.click();
            setActiveTab("projects");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "projects"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building className="h-4 w-4" />
          المشروعات وعقود المقاولات (Projects)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("boq");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "boq"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          جداول الكميات والبنود (BOQ Engine)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("ipc");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "ipc"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          مستخلصات التنفيذ والاستقطاعات (IPC)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("variations");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "variations"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          أوامر التغيير والملحقات (Change Orders)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("machinery");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "machinery"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="h-4 w-4" />
          تشغيل المعدات والديزل (Machinery & Plant)
        </button>

        <button
          onClick={() => {
            sound.click();
            setActiveTab("guarantees");
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "guarantees"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          خطابات الضمان البنكية (Letters of Guarantee)
        </button>
      </div>

      {/* Tab 1: Projects */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بكود المشروع أو اسم الموقع أو المالك..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold font-mono">{filteredProjects.length}</span> مشروع إنشائي معتمد
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود المشروع</TableHead>
                  <TableHead>اسم المشروع والموقع</TableHead>
                  <TableHead>الجهة المالكة (Client)</TableHead>
                  <TableHead>المكتب الاستشاري (Consultant)</TableHead>
                  <TableHead>قيمة العقد الإجمالية</TableHead>
                  <TableHead>نسب الاستقطاع والتعاقد</TableHead>
                  <TableHead>الحالة والمرحلة</TableHead>
                  <TableHead>المعتمد المفوتر / المحصل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isProjectsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد مشروعات مطابقة لمعايير البحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {p.project_code}
                      </TableCell>
                      <TableCell className="font-medium text-xs max-w-xs truncate" title={p.project_name}>
                        {p.project_name}
                      </TableCell>
                      <TableCell className="text-xs">{p.client_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.consultant_name}</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {p.contract_value_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className="text-muted-foreground">حسن تنفيذ:</span> {p.retention_rate_pct}% |{" "}
                        <span className="text-muted-foreground">مقدم:</span> {p.advance_payment_pct}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "completed" || p.status === "handed_over"
                              ? "success"
                              : p.status === "snagging"
                              ? "warning"
                              : "default"
                          }
                        >
                          {p.status === "in_progress"
                            ? "قيد التنفيذ بالموقع"
                            : p.status === "snagging"
                            ? "مرحلة التسليم والملاحظات"
                            : p.status === "handed_over"
                            ? "تم التسليم النهائي FAC"
                            : "تخطيط وعطاءات"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="font-bold">{p.total_billed_egp.toLocaleString()} ج.م</div>
                        <div className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                          محصل: {p.total_collected_egp.toLocaleString()} ج.م
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 2: Bill of Quantities (BOQ) */}
      {activeTab === "boq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              جدول حصر الكميات والميزانيات التقديرية (Bill of Quantities - MasterFormat)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              إجمالي البنود: {boqItems.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود البند (CSI Code)</TableHead>
                  <TableHead>وصف البند ومواصفات التنفيذ</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الكمية التعاقدية</TableHead>
                  <TableHead>سعر الوحدة المعياري</TableHead>
                  <TableHead>إجمالي ميزانية البند</TableHead>
                  <TableHead>الكمية المنفذة فعلياً</TableHead>
                  <TableHead>نسبة الإنجاز</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBoqLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : boqItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد بنود كميات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  boqItems.map((b) => {
                    const completionPct = b.planned_quantity > 0 ? (b.actual_executed_qty / b.planned_quantity) * 100 : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {b.item_code}
                        </TableCell>
                        <TableCell className="text-xs max-w-md font-medium">{b.description}</TableCell>
                        <TableCell className="font-mono text-xs">{b.unit}</TableCell>
                        <TableCell className="font-mono font-bold">{b.planned_quantity.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{b.unit_rate_egp.toLocaleString()} ج.م</TableCell>
                        <TableCell className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {b.total_budget_egp.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {b.actual_executed_qty.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {completionPct.toFixed(1)}%
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

      {/* Tab 3: Interim Payment Certificates (IPC) */}
      {activeTab === "ipc" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300">
                  مستخلصات التنفيذ الدورية (Interim Payment Certificates - IPC)
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1">
                  حساب الأعمال المنفذة خلال الدورة الشهرية مع الاستقطاعات النظامية: استقطاع حسن التنفيذ (Retention 5%)،
                  واسترداد قسط الدفعة المقدمة (Advance Payment Recovery 10%) وفقاً لاعتماد استشاري المالك.
                </p>
              </div>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المستخلص</TableHead>
                  <TableHead>المشروع الإنشائي</TableHead>
                  <TableHead>الفترة الزمنية</TableHead>
                  <TableHead>إجمالي الأعمال المنفذة</TableHead>
                  <TableHead>استقطاع حسن التنفيذ (5%)</TableHead>
                  <TableHead>استرداد الدفعة المقدمة (10%)</TableHead>
                  <TableHead>صافي المستحق للمقاول</TableHead>
                  <TableHead>حالة الاعتماد</TableHead>
                  <TableHead>تاريخ اعتماد الاستشاري</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isIpcsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : ipcs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد مستخلصات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  ipcs.map((ipc) => (
                    <TableRow key={ipc.id}>
                      <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ipc.ipc_number}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{ipc.project_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ipc.period_start} إلى {ipc.period_end}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">
                        {ipc.gross_amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs text-rose-600 dark:text-rose-400">
                        -{ipc.retention_deduction_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs text-amber-600 dark:text-amber-400">
                        -{ipc.advance_recovery_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {ipc.net_payable_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">
                          {ipc.status === "certified"
                            ? "معتمد من الاستشاري"
                            : ipc.status === "paid"
                            ? "تم الصرف بنكياً"
                            : "قيد المراجعة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ipc.consultant_approval_date || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 4: Change Orders */}
      {activeTab === "variations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل أوامر التغيير والمطالبات التعاقدية (Variation Orders & Time Extensions)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              إجمالي أوامر التغيير: {changeOrders.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مرجع أمر التغيير</TableHead>
                  <TableHead>المشروع التابع</TableHead>
                  <TableHead>عنوان التعديل ونطاق العمل</TableHead>
                  <TableHead>المبلغ المطلوب</TableHead>
                  <TableHead>المبلغ المعتمد تعاقدياً</TableHead>
                  <TableHead>المدة الزمنية الإضافية</TableHead>
                  <TableHead>حالة الاعتماد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCosLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : changeOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد أوامر تغيير مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  changeOrders.map((co) => (
                    <TableRow key={co.id}>
                      <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {co.variation_ref}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{co.project_name}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-bold text-xs">{co.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate" title={co.scope_description}>
                          {co.scope_description}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{co.requested_amount_egp.toLocaleString()} ج.م</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {co.approved_amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className="px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          +{co.time_extension_days} يوم
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">معتمد ومدرج بالعقد</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 5: Heavy Machinery */}
      {activeTab === "machinery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل تشغيل ومعدلات وقود المعدات الثقيلة والآليات (Plant & Heavy Machinery)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              المعدات المسجلة: {machineryLogs.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود المعدة</TableHead>
                  <TableHead>اسم المعدة والنوع</TableHead>
                  <TableHead>سائق / مشغل المعدة</TableHead>
                  <TableHead>ساعات التشغيل الفعلية</TableHead>
                  <TableHead>ساعات التوقف (Idle)</TableHead>
                  <TableHead>استهلاك الديزل (لتر)</TableHead>
                  <TableHead>الحالة التشغيلية</TableHead>
                  <TableHead>تاريخ السجل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMachLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : machineryLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات تشغيل معدات
                    </TableCell>
                  </TableRow>
                ) : (
                  machineryLogs.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                        {m.equipment_tag}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{m.equipment_name}</TableCell>
                      <TableCell className="text-xs">{m.operator_name}</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {m.operating_hours} ساعة
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.idle_hours} ساعة</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        {m.diesel_liters} لتر سولار
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">قيد التشغيل بالموقع</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.log_date}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 6: Letters of Guarantee (LG) */}
      {activeTab === "guarantees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل خطابات الضمان البنكية الصادرة للمشروعات (Letters of Guarantee - LG)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              الخطابات الصادرة: {guarantees.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم خطاب الضمان</TableHead>
                  <TableHead>البنك المصدر والفرع</TableHead>
                  <TableHead>نوع الضمان (Bond Type)</TableHead>
                  <TableHead>قيمة خطاب الضمان (LG Amount)</TableHead>
                  <TableHead>الغطاء النقدي المجمد</TableHead>
                  <TableHead>تاريخ الإصدار والانتهاء</TableHead>
                  <TableHead>حالة الخطاب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLgsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : guarantees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد خطابات ضمان مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  guarantees.map((lg) => (
                    <TableRow key={lg.id}>
                      <TableCell className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {lg.lg_number}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{lg.bank_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lg.bond_type === "performance_bond"
                            ? "ضمان حسن تنفيذ (Performance Bond)"
                            : lg.bond_type === "advance_payment"
                            ? "ضمان دفعة مقدمة (Advance Payment)"
                            : lg.bond_type === "bid_bond"
                            ? "ضمان ابتدائي (Bid Bond)"
                            : "ضمان صيانة وعيوب (Retention Bond)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {lg.amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {lg.cash_margin_pct}% ({((lg.amount_egp * lg.cash_margin_pct) / 100).toLocaleString()} ج.م)
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {lg.issue_date} إلى <span className="font-bold text-foreground">{lg.expiry_date}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">ساري المفعول بالبنك</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Modal: New Project */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewProjectOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <HardHat className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-bold">تسجيل مشروع إنشائي وعقد مقاولة جديد</h3>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود المشروع</label>
                  <Input
                    value={newProject.project_code}
                    onChange={(e) => setNewProject({ ...newProject, project_code: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">القيمة التعاقدية (ج.م)</label>
                  <Input
                    type="number"
                    value={newProject.contract_value_egp}
                    onChange={(e) => setNewProject({ ...newProject, contract_value_egp: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم المشروع والموقع</label>
                <Input
                  value={newProject.project_name}
                  onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الجهة المالكة (Client)</label>
                  <Input
                    value={newProject.client_name}
                    onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الاستشاري المشرف (Consultant)</label>
                  <Input
                    value={newProject.consultant_name}
                    onChange={(e) => setNewProject({ ...newProject, consultant_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ بدء التنفيذ</label>
                  <Input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الموعد النهائي للتسليم</label>
                  <Input
                    type="date"
                    value={newProject.expected_completion_date}
                    onChange={(e) => setNewProject({ ...newProject, expected_completion_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  إنشاء المشروع وبدء الموقع
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New IPC */}
      {isNewIpcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewIpcOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold">تسجيل مستخلص تنفيذ دوري (IPC)</h3>
            </div>

            <form onSubmit={handleCreateIpc} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">المشروع الإنشائي</label>
                <select
                  value={newIpc.project_id}
                  onChange={(e) => setNewIpc({ ...newIpc, project_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم المستخلص</label>
                  <Input
                    value={newIpc.ipc_number}
                    onChange={(e) => setNewIpc({ ...newIpc, ipc_number: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">إجمالي الأعمال المنفذة (ج.م)</label>
                  <Input
                    type="number"
                    value={newIpc.gross_amount_egp}
                    onChange={(e) => setNewIpc({ ...newIpc, gross_amount_egp: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">استقطاع حسن التنفيذ (5%)</label>
                  <Input
                    type="number"
                    value={newIpc.retention_deduction_egp}
                    onChange={(e) => setNewIpc({ ...newIpc, retention_deduction_egp: Number(e.target.value) })}
                    className="font-mono mt-1 text-rose-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">استرداد دفعة مقدمة (10%)</label>
                  <Input
                    type="number"
                    value={newIpc.advance_recovery_egp}
                    onChange={(e) => setNewIpc({ ...newIpc, advance_recovery_egp: Number(e.target.value) })}
                    className="font-mono mt-1 text-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">ملاحظات واعتماد الاستشاري</label>
                <textarea
                  value={newIpc.consultant_notes}
                  onChange={(e) => setNewIpc({ ...newIpc, consultant_notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewIpcOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  اعتماد المستخلص وتثبيته
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Change Order */}
      {isNewCoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewCoOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold">تسجيل أمر تغيير تعاقدي (Change Order)</h3>
            </div>

            <form onSubmit={handleCreateCo} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">المشروع التابع</label>
                <select
                  value={newCo.project_id}
                  onChange={(e) => setNewCo({ ...newCo, project_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مرجع أمر التغيير</label>
                  <Input
                    value={newCo.variation_ref}
                    onChange={(e) => setNewCo({ ...newCo, variation_ref: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المدة الإضافية المعتمدة (أيام)</label>
                  <Input
                    type="number"
                    value={newCo.time_extension_days}
                    onChange={(e) => setNewCo({ ...newCo, time_extension_days: Number(e.target.value) })}
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">عنوان التعديل ونطاق العمل</label>
                <Input
                  value={newCo.title}
                  onChange={(e) => setNewCo({ ...newCo, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">شرح وتفاصيل التعديل الفني</label>
                <textarea
                  value={newCo.scope_description}
                  onChange={(e) => setNewCo({ ...newCo, scope_description: e.target.value })}
                  rows={2}
                  required
                  className="w-full mt-1 rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المبلغ المطلوب (ج.م)</label>
                  <Input
                    type="number"
                    value={newCo.requested_amount_egp}
                    onChange={(e) => setNewCo({ ...newCo, requested_amount_egp: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المبلغ المعتمد (ج.م)</label>
                  <Input
                    type="number"
                    value={newCo.approved_amount_egp}
                    onChange={(e) => setNewCo({ ...newCo, approved_amount_egp: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewCoOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  حفظ واعتماد أمر التغيير
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Machinery Log */}
      {isNewMachineryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewMachineryOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-lg font-bold">تسجيل تشغيل ومحروقات معدة ثقيلة</h3>
            </div>

            <form onSubmit={handleCreateMach} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">المشروع التابع</label>
                <select
                  value={newMach.project_id}
                  onChange={(e) => setNewMach({ ...newMach, project_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود / تاج المعدة</label>
                  <Input
                    value={newMach.equipment_tag}
                    onChange={(e) => setNewMach({ ...newMach, equipment_tag: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">سائق / مشغل المعدة</label>
                  <Input
                    value={newMach.operator_name}
                    onChange={(e) => setNewMach({ ...newMach, operator_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم المعدة والموديل</label>
                <Input
                  value={newMach.equipment_name}
                  onChange={(e) => setNewMach({ ...newMach, equipment_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ساعات التشغيل</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newMach.operating_hours}
                    onChange={(e) => setNewMach({ ...newMach, operating_hours: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ساعات التوقف (Idle)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newMach.idle_hours}
                    onChange={(e) => setNewMach({ ...newMach, idle_hours: Number(e.target.value) })}
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">سولار (لتر)</label>
                  <Input
                    type="number"
                    value={newMach.diesel_liters}
                    onChange={(e) => setNewMach({ ...newMach, diesel_liters: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewMachineryOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700">
                  حفظ سجل المعدة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New LG */}
      {isNewLgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewLgOpen(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold">تسجيل خطاب ضمان بنكي (Letter of Guarantee)</h3>
            </div>

            <form onSubmit={handleCreateLg} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">المشروع التابع</label>
                <select
                  value={newLg.project_id}
                  onChange={(e) => setNewLg({ ...newLg, project_id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم خطاب الضمان</label>
                  <Input
                    value={newLg.lg_number}
                    onChange={(e) => setNewLg({ ...newLg, lg_number: e.target.value })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نوع الضمان</label>
                  <select
                    value={newLg.bond_type}
                    onChange={(e) => setNewLg({ ...newLg, bond_type: e.target.value as any })}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="performance_bond">حسن تنفيذ (Performance Bond)</option>
                    <option value="advance_payment">دفعة مقدمة (Advance Payment)</option>
                    <option value="bid_bond">ابتدائي (Bid Bond)</option>
                    <option value="retention">ضمان صيانة (Retention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">البنك المصدر والفرع</label>
                <Input
                  value={newLg.bank_name}
                  onChange={(e) => setNewLg({ ...newLg, bank_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">قيمة الضمان (ج.م)</label>
                  <Input
                    type="number"
                    value={newLg.amount_egp}
                    onChange={(e) => setNewLg({ ...newLg, amount_egp: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نسبة الغطاء النقدي (%)</label>
                  <Input
                    type="number"
                    value={newLg.cash_margin_pct}
                    onChange={(e) => setNewLg({ ...newLg, cash_margin_pct: Number(e.target.value) })}
                    required
                    className="font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ الإصدار</label>
                  <Input
                    type="date"
                    value={newLg.issue_date}
                    onChange={(e) => setNewLg({ ...newLg, issue_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ انتهاء الصلاحية</label>
                  <Input
                    type="date"
                    value={newLg.expiry_date}
                    onChange={(e) => setNewLg({ ...newLg, expiry_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsNewLgOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  حفظ خطاب الضمان
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
