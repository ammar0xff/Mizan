import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Factory,
  Layers,
  Percent,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
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

interface MfgSummary {
  active_production_orders: number;
  completed_production_orders: number;
  total_work_centers: number;
  open_ncrs_count: number;
  total_wip_value: number;
  average_oee_score: number;
}

interface MfgBomItem {
  id: string;
  level: number;
  component_code: string;
  component_name: string;
  quantity_required: number;
  uom: string;
  unit_cost: number;
  scrap_factor_percent: number;
}

interface MfgRoutingOp {
  id: string;
  sequence_num: number;
  operation_name: string;
  work_center_id?: string;
  setup_time_mins: number;
  run_time_per_unit_mins: number;
}

interface MfgBom {
  id: string;
  bom_code: string;
  item_name: string;
  revision: string;
  is_active: boolean;
  base_qty: number;
  uom: string;
  total_standard_cost: number;
  items: MfgBomItem[];
  operations: MfgRoutingOp[];
}

interface MfgWorkCenter {
  id: string;
  center_code: string;
  center_name: string;
  department: string;
  hourly_machine_rate: number;
  hourly_labor_rate: number;
  capacity_hours_per_day: number;
  status: "active" | "maintenance" | "idle";
}

interface MfgProductionOrder {
  id: string;
  order_ref: string;
  bom_id?: string;
  bom_code?: string;
  finished_good_name: string;
  planned_qty: number;
  completed_qty: number;
  scrap_qty: number;
  status: "planned" | "released" | "in_progress" | "completed" | "closed";
  scheduled_start?: string;
  scheduled_end?: string;
  actual_wip_cost: number;
  notes?: string;
}

interface MfgQualityInspection {
  id: string;
  inspection_ref: string;
  order_id?: string;
  stage: "incoming" | "in_process" | "final";
  sample_size: number;
  defect_count: number;
  outcome: "passed" | "quarantined" | "rejected";
  inspector_name: string;
  ncr_number?: string;
  notes?: string;
}

interface MfgOeeLog {
  id: string;
  work_center_id: string;
  center_name: string;
  center_code: string;
  log_date: string;
  planned_production_time_hrs: number;
  operating_time_hrs: number;
  total_pieces: number;
  good_pieces: number;
  availability_pct: number;
  performance_pct: number;
  quality_pct: number;
  oee_score_pct: number;
}

export default function DiscreteManufacturingPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "boms" | "work_centers" | "inspections" | "oee">("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewBomOpen, setIsNewBomOpen] = useState(false);
  const [isNewCenterOpen, setIsNewCenterOpen] = useState(false);
  const [isNewInspOpen, setIsNewInspOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<MfgProductionOrder | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<MfgSummary>({
    queryKey: ["mfgSummary"],
    queryFn: () => api.get<MfgSummary>("/mfg/summary"),
  });

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<MfgProductionOrder[]>({
    queryKey: ["mfgOrders"],
    queryFn: () => api.get<MfgProductionOrder[]>("/mfg/production-orders"),
  });

  const { data: boms = [], isLoading: isBomsLoading } = useQuery<MfgBom[]>({
    queryKey: ["mfgBoms"],
    queryFn: () => api.get<MfgBom[]>("/mfg/boms"),
  });

  const { data: workCenters = [] } = useQuery<MfgWorkCenter[]>({
    queryKey: ["mfgWorkCenters"],
    queryFn: () => api.get<MfgWorkCenter[]>("/mfg/work-centers"),
  });

  const { data: inspections = [] } = useQuery<MfgQualityInspection[]>({
    queryKey: ["mfgInspections"],
    queryFn: () => api.get<MfgQualityInspection[]>("/mfg/inspections"),
  });

  const { data: oeeLogs = [] } = useQuery<MfgOeeLog[]>({
    queryKey: ["mfgOeeLogs"],
    queryFn: () => api.get<MfgOeeLog[]>("/mfg/oee-logs"),
  });

  // Forms
  const [newOrder, setNewOrder] = useState({
    order_ref: `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
    finished_good_name: "مضخة طرد مركزي صناعية 15 حصان",
    planned_qty: 30,
    scheduled_start: new Date().toISOString().split("T")[0],
    scheduled_end: "2026-11-25",
    notes: "تشغيل دقيق وتجميع وفق المعيار الصناعي ISO 9001",
  });

  const [newCenter, setNewCenter] = useState({
    center_code: `WC-LINE-0${workCenters.length + 1}`,
    center_name: "محطة الفحص الهيدروليكي والاختبار النهائي",
    department: "التجميع والجودة",
    hourly_machine_rate: 550.0,
    hourly_labor_rate: 160.0,
    capacity_hours_per_day: 16.0,
    status: "active" as const,
  });

  const [newInsp, setNewInsp] = useState({
    inspection_ref: `QC-INSP-${Math.floor(100 + Math.random() * 900)}`,
    stage: "final" as const,
    sample_size: 10,
    defect_count: 0,
    outcome: "passed" as const,
    inspector_name: "م/ أحمد النجار (توكيد الجودة)",
    ncr_number: "",
    notes: "مطابقة فحص العزل وتوازن دوران عمود الدوران الديناميكي",
  });

  // Actions
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/mfg/production-orders", newOrder);
      queryClient.invalidateQueries({ queryKey: ["mfgOrders"] });
      queryClient.invalidateQueries({ queryKey: ["mfgSummary"] });
      setIsNewOrderOpen(false);
      sound.click();
      toast("success", "تم إصدار أمر الإنتاج وتحويله لصالة التشغيل بنجاح");
    } catch {
      toast("error", "تعذر إنشاء أمر الإنتاج");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, completedQty: number) => {
    try {
      await api.post(`/mfg/production-orders/${orderId}/status`, {
        status: nextStatus,
        completed_qty: completedQty,
        actual_wip_cost: completedQty * 14850.0,
      });
      queryClient.invalidateQueries({ queryKey: ["mfgOrders"] });
      queryClient.invalidateQueries({ queryKey: ["mfgSummary"] });
      setTargetOrder(null);
      sound.click();
      toast("success", `تم تحديث حالة أمر التشغيل إلى ${nextStatus}`);
    } catch {
      toast("error", "تعذر تحديث حالة أمر التشغيل");
    }
  };

  const handleCreateWorkCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/mfg/work-centers", newCenter);
      queryClient.invalidateQueries({ queryKey: ["mfgWorkCenters"] });
      queryClient.invalidateQueries({ queryKey: ["mfgSummary"] });
      setIsNewCenterOpen(false);
      sound.click();
      toast("success", "تمت إضافة مركز العمل الجديد لخطوط الإنتاج");
    } catch {
      toast("error", "تعذر إضافة مركز العمل");
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/mfg/inspections", newInsp);
      queryClient.invalidateQueries({ queryKey: ["mfgInspections"] });
      queryClient.invalidateQueries({ queryKey: ["mfgSummary"] });
      setIsNewInspOpen(false);
      sound.click();
      toast("success", "تم تسجيل تقرير فحص الجودة بنجاح");
    } catch {
      toast("error", "تعذر تسجيل فحص الجودة");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="h-7 w-7 text-brand" />
            التصنيع الميكانيكي وخطوط التجميع (BOM / MRP)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            شجرة المنتجات متعددة المستويات، مسارات التشغيل، أوامر الإنتاج، الرقابة على الصالة، وكفاءة المعدات الشاملة (OEE)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "orders" && (
            <Button onClick={() => setIsNewOrderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              أمر إنتاج جديد (Work Order)
            </Button>
          )}
          {activeTab === "boms" && (
            <Button onClick={() => setIsNewBomOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء شجرة منتج (BOM)
            </Button>
          )}
          {activeTab === "work_centers" && (
            <Button onClick={() => setIsNewCenterOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مركز عمل جديد
            </Button>
          )}
          {activeTab === "inspections" && (
            <Button onClick={() => setIsNewInspOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل فحص جودة / NCR
            </Button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Clock className="h-4 w-4 text-amber-500" />
            أوامر الإنتاج النشطة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.active_production_orders || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            الأوامر المكتملة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-500">
              {summary?.completed_production_orders || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Wrench className="h-4 w-4 text-blue-500" />
            مراكز العمل والماكينات
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-blue-500">
              {summary?.total_work_centers || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            تقارير عدم المطابقة (NCR)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-rose-500">
              {summary?.open_ncrs_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <DollarSign className="h-4 w-4 text-violet-500" />
            قيمة الإنتاج تحت التشغيل WIP
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-violet-500">
              {(summary?.total_wip_value || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Percent className="h-4 w-4 text-teal-500" />
            معدل كفاءة المعدات (OEE)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-teal-500">
              {summary?.average_oee_score || 0}%
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("orders")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            أوامر الإنتاج وصالة التشغيل
          </Button>
          <Button
            variant={activeTab === "boms" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("boms")}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            شجرة المنتجات والتكاليف (BOM)
          </Button>
          <Button
            variant={activeTab === "work_centers" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("work_centers")}
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            مراكز العمل والماكينات
          </Button>
          <Button
            variant={activeTab === "inspections" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("inspections")}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            رقابة الجودة وتقارير NCR
          </Button>
          <Button
            variant={activeTab === "oee" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("oee")}
            className="gap-2"
          >
            <Percent className="h-4 w-4" />
            كفاءة المعدات الشاملة (OEE)
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالرقم، المنتج، مركز العمل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Orders */}
      {activeTab === "orders" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم أمر الشغل</TableHead>
                <TableHead>المنتج التام</TableHead>
                <TableHead>الكمية المخططة</TableHead>
                <TableHead>المنجز / الهالك</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ البدء / الانتهاء</TableHead>
                <TableHead>تكلفة التشغيل WIP</TableHead>
                <TableHead>الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOrdersLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Skeleton className="h-8 w-48 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد أوامر إنتاج مسجلة حالياً
                  </TableCell>
                </TableRow>
              ) : (
                orders
                  .filter((o) => o.order_ref.includes(searchTerm) || o.finished_good_name.includes(searchTerm))
                  .map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-bold text-foreground">
                        {o.order_ref}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{o.finished_good_name}</div>
                        {o.bom_code && (
                          <div className="text-xs text-muted-foreground font-mono">BOM: {o.bom_code}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{o.planned_qty} وحدة</TableCell>
                      <TableCell className="font-mono">
                        <span className="text-emerald-500 font-bold">{o.completed_qty}</span>
                        {" / "}
                        <span className="text-rose-500">{o.scrap_qty}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            o.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : o.status === "in_progress"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : o.status === "released"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {o.status === "completed"
                            ? "مكتمل"
                            : o.status === "in_progress"
                            ? "قيد التشغيل"
                            : o.status === "released"
                            ? "مُفرَج للإنتاج"
                            : "مخطط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {o.scheduled_start || "—"} إلى {o.scheduled_end || "—"}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-violet-400">
                        {o.actual_wip_cost.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        {o.status === "released" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateOrderStatus(o.id, "in_progress", o.completed_qty)}
                          >
                            بدء التشغيل
                          </Button>
                        )}
                        {o.status === "in_progress" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setTargetOrder(o)}
                          >
                            تسجيل إنجاز
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 2: BOMs */}
      {activeTab === "boms" && (
        <div className="space-y-6">
          {isBomsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            boms.map((bom) => (
              <Card key={bom.id} className="p-5 border-border/60 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-border/40 gap-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg text-brand">{bom.bom_code}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {bom.revision}
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                        نشط ومعتمد
                      </Badge>
                    </div>
                    <div className="text-base font-bold text-foreground mt-1">{bom.item_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">التكلفة المعيارية للوحدة (Standard BOM Cost)</div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                      {bom.total_standard_cost.toLocaleString()} ج.م
                    </div>
                  </div>
                </div>

                {/* Sub-components & Raw Materials */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                    <Boxes className="h-4 w-4" />
                    المكونات والخامات ومعدلات الهالك (Components & Scrap Factors)
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستوى</TableHead>
                        <TableHead>كود الصنف</TableHead>
                        <TableHead>اسم المكون / الخامة</TableHead>
                        <TableHead>الكمية المعيارية</TableHead>
                        <TableHead>تكلفة الوحدة</TableHead>
                        <TableHead>نسبة الهالك المسموح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bom.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-mono">
                            <Badge variant="outline" className="text-xs">
                              Tier-{it.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{it.component_code}</TableCell>
                          <TableCell className="font-semibold">{it.component_name}</TableCell>
                          <TableCell className="font-mono">
                            {it.quantity_required} {it.uom}
                          </TableCell>
                          <TableCell className="font-mono">{it.unit_cost.toLocaleString()} ج.م</TableCell>
                          <TableCell className="font-mono text-rose-400">{it.scrap_factor_percent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Routings */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                    <Wrench className="h-4 w-4" />
                    مسارات التشغيل ومراكز العمل (Routing Operations)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {bom.operations.map((op) => (
                      <div key={op.id} className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-brand">خطوة {op.sequence_num}</span>
                          <span className="text-muted-foreground">تشغيل: {op.run_time_per_unit_mins} دقيقة</span>
                        </div>
                        <div className="font-semibold text-sm">{op.operation_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          زمن الإعداد: {op.setup_time_mins} دقيقة
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Work Centers */}
      {activeTab === "work_centers" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>كود المركز</TableHead>
                <TableHead>اسم الماكينة / المركز</TableHead>
                <TableHead>القسم الصناعي</TableHead>
                <TableHead>سعر ساعة الماكينة MHR</TableHead>
                <TableHead>سعر ساعة العمالة</TableHead>
                <TableHead>الطاقة الإنتاجية اليومية</TableHead>
                <TableHead>الحالة التشغيلية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workCenters.map((wc) => (
                <TableRow key={wc.id}>
                  <TableCell className="font-mono font-bold text-foreground">{wc.center_code}</TableCell>
                  <TableCell className="font-semibold">{wc.center_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{wc.department}</TableCell>
                  <TableCell className="font-mono font-bold text-teal-400">
                    {wc.hourly_machine_rate.toLocaleString()} ج.م / س
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {wc.hourly_labor_rate.toLocaleString()} ج.م / س
                  </TableCell>
                  <TableCell className="font-mono">{wc.capacity_hours_per_day} ساعة/يوم</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        wc.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }
                    >
                      {wc.status === "active" ? "جاهز للعمل" : "صيانة وقائية"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 4: Inspections & NCR */}
      {activeTab === "inspections" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>كود الفحص</TableHead>
                <TableHead>المرحلة</TableHead>
                <TableHead>حجم العينة</TableHead>
                <TableHead>القطع المعيبة</TableHead>
                <TableHead>القرار</TableHead>
                <TableHead>رقم تقرير NCR</TableHead>
                <TableHead>مهندس الجودة</TableHead>
                <TableHead>الملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono font-bold text-foreground">{i.inspection_ref}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {i.stage === "incoming" ? "فحص خامات واردة" : i.stage === "in_process" ? "فحص أثناء التشغيل" : "فحص نهائي"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{i.sample_size} قطع</TableCell>
                  <TableCell className="font-mono text-rose-400 font-bold">{i.defect_count}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        i.outcome === "passed"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : i.outcome === "quarantined"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }
                    >
                      {i.outcome === "passed" ? "مطابق ومعتمد" : i.outcome === "quarantined" ? "حجر فني وتوقف" : "مرفوض"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-rose-400">
                    {i.ncr_number || "—"}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{i.inspector_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {i.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 5: OEE Dashboard */}
      {activeTab === "oee" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>مركز العمل</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>ساعات التشغيل / المخططة</TableHead>
                <TableHead>الإنتاج التام / السليم</TableHead>
                <TableHead>الإتاحة Availability</TableHead>
                <TableHead>الأداء Performance</TableHead>
                <TableHead>الجودة Quality</TableHead>
                <TableHead>مؤشر OEE النهائي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oeeLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-semibold">{log.center_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{log.center_code}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.log_date}</TableCell>
                  <TableCell className="font-mono">
                    {log.operating_time_hrs} / {log.planned_production_time_hrs} س
                  </TableCell>
                  <TableCell className="font-mono">
                    <span className="text-emerald-400 font-bold">{log.good_pieces}</span> / {log.total_pieces}
                  </TableCell>
                  <TableCell className="font-mono">{log.availability_pct}%</TableCell>
                  <TableCell className="font-mono">{log.performance_pct}%</TableCell>
                  <TableCell className="font-mono">{log.quality_pct}%</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-brand/10 text-brand border-brand/30 font-mono font-bold text-sm"
                    >
                      {log.oee_score_pct}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* MODAL: New Production Order */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Factory className="h-5 w-5 text-brand" />
                إصدار أمر إنتاج وتشغيل جديد (Work Order)
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewOrderOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">رقم أمر الشغل</label>
                <Input
                  value={newOrder.order_ref}
                  onChange={(e) => setNewOrder({ ...newOrder, order_ref: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">المنتج التام المراد تصنيعه</label>
                <Input
                  value={newOrder.finished_good_name}
                  onChange={(e) => setNewOrder({ ...newOrder, finished_good_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">الكمية المستهدفة</label>
                  <Input
                    type="number"
                    value={newOrder.planned_qty}
                    onChange={(e) => setNewOrder({ ...newOrder, planned_qty: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">تاريخ البدء المخطط</label>
                  <Input
                    type="date"
                    value={newOrder.scheduled_start}
                    onChange={(e) => setNewOrder({ ...newOrder, scheduled_start: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">ملاحظات التشغيل والعميل</label>
                <Input
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إصدار وتعميم للصالة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: Record Output */}
      {targetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                تسجيل إنجاز الإنتاج (Shop Floor Output)
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setTargetOrder(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm">
              أمر الشغل: <span className="font-bold font-mono">{targetOrder.order_ref}</span>
              <br />
              المنتج: <span className="font-semibold">{targetOrder.finished_good_name}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold mb-1 block">الكمية المنجزة السليمة</label>
                <Input
                  type="number"
                  defaultValue={targetOrder.planned_qty}
                  id="completedQtyInput"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setTargetOrder(null)}>
                إلغاء
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  const val = Number((document.getElementById("completedQtyInput") as HTMLInputElement)?.value || targetOrder.planned_qty);
                  handleUpdateOrderStatus(targetOrder.id, "completed", val);
                }}
              >
                تأكيد الإنجاز وتوريد للمخزن
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: Work Center */}
      {isNewCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand" />
                إضافة مركز عمل وماكينة
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewCenterOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateWorkCenter} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">كود المركز</label>
                <Input
                  value={newCenter.center_code}
                  onChange={(e) => setNewCenter({ ...newCenter, center_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">اسم المركز / الماكينة</label>
                <Input
                  value={newCenter.center_name}
                  onChange={(e) => setNewCenter({ ...newCenter, center_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">سعر ساعة الماكينة MHR</label>
                  <Input
                    type="number"
                    value={newCenter.hourly_machine_rate}
                    onChange={(e) => setNewCenter({ ...newCenter, hourly_machine_rate: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">ساعات العمل اليومية</label>
                  <Input
                    type="number"
                    value={newCenter.capacity_hours_per_day}
                    onChange={(e) => setNewCenter({ ...newCenter, capacity_hours_per_day: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewCenterOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ مركز العمل</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: Inspection */}
      {isNewInspOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand" />
                تسجيل تقرير فحص جودة / حالة عدم مطابقة
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewInspOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateInspection} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">رقم تقرير الفحص</label>
                <Input
                  value={newInsp.inspection_ref}
                  onChange={(e) => setNewInsp({ ...newInsp, inspection_ref: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">حجم العينة</label>
                  <Input
                    type="number"
                    value={newInsp.sample_size}
                    onChange={(e) => setNewInsp({ ...newInsp, sample_size: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">القطع المعيبة</label>
                  <Input
                    type="number"
                    value={newInsp.defect_count}
                    onChange={(e) => setNewInsp({ ...newInsp, defect_count: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">قرار الجودة</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newInsp.outcome}
                  onChange={(e) => setNewInsp({ ...newInsp, outcome: e.target.value as any })}
                >
                  <option value="passed">مطابق ومعتمد (Passed)</option>
                  <option value="quarantined">حجر فني وتوقف (Quarantined)</option>
                  <option value="rejected">مرفوض نهائياً (Rejected)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">ملاحظات وتقرير الفحص</label>
                <Input
                  value={newInsp.notes}
                  onChange={(e) => setNewInsp({ ...newInsp, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewInspOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تسجيل واعتماد الفحص</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: BOM Mock Alert */}
      {isNewBomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand" />
                إنشاء شجرة منتج جديدة (BOM Builder)
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewBomOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              يتم إنشاء شجرة المنتجات الهندسية عبر استيراد مخططات CAD ومكونات التصنيع المعتمدة مع المسارات التشغيلية المرتبطة.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => { setIsNewBomOpen(false); toast("info", "تم حفظ المسودة الهندسية"); }}>
                حفظ وإغلاق
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
