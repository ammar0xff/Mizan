import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CheckCircle2,
  Clock,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
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

interface FsmSummary {
  active_work_orders_count: number;
  emergency_sla_count: number;
  completed_work_orders_count: number;
  total_technicians_count: number;
  techs_on_job_count: number;
  low_stock_van_parts_count: number;
  covered_assets_count: number;
}

interface FsmWorkOrder {
  id: string;
  order_ref: string;
  client_name: string;
  client_phone: string;
  site_address: string;
  equipment_type: string;
  issue_description: string;
  priority_sla: "emergency_2h" | "urgent_6h" | "standard_24h";
  assigned_technician: string;
  van_code: string;
  scheduled_date: string;
  status: "dispatched" | "on_site" | "parts_needed" | "completed";
  completion_notes: string;
}

interface FsmTechnician {
  id: string;
  tech_name: string;
  phone: string;
  van_code: string;
  assigned_zone: string;
  live_status: "available" | "driving_to_site" | "working_on_job";
  jobs_completed_today: number;
  rating: number;
}

interface FsmVanInventory {
  id: string;
  van_code: string;
  technician_name: string;
  part_code: string;
  part_name: string;
  qty_on_hand: number;
  min_alert_threshold: number;
  unit_price: number;
}

interface FsmEquipmentAsset {
  id: string;
  serial_number: string;
  client_name: string;
  site_location: string;
  equipment_model: string;
  install_date: string;
  last_service_date: string;
  next_service_due: string;
  warranty_status: "under_warranty" | "amc_active" | "expired";
  total_repairs_count: number;
}

export default function FieldServicePage() {
  const [activeTab, setActiveTab] = useState<"work_orders" | "technicians" | "van_inventory" | "assets">("work_orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewTechOpen, setIsNewTechOpen] = useState(false);
  const [isNewPartOpen, setIsNewPartOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [completeTargetOrder, setCompleteTargetOrder] = useState<FsmWorkOrder | null>(null);
  const [completionNotes, setCompletionNotes] = useState("تمت الصيانة بنجاح واستبدال القطع المعيبة واختبار التشغيل");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<FsmSummary>({
    queryKey: ["fsmSummary"],
    queryFn: () => api.get<FsmSummary>("/field-service/summary"),
  });

  const { data: workOrders = [], isLoading: isOrdersLoading } = useQuery<FsmWorkOrder[]>({
    queryKey: ["fsmWorkOrders"],
    queryFn: () => api.get<FsmWorkOrder[]>("/field-service/work-orders"),
  });

  const { data: technicians = [], isLoading: isTechsLoading } = useQuery<FsmTechnician[]>({
    queryKey: ["fsmTechnicians"],
    queryFn: () => api.get<FsmTechnician[]>("/field-service/technicians"),
  });

  const { data: vanParts = [], isLoading: isVanLoading } = useQuery<FsmVanInventory[]>({
    queryKey: ["fsmVanParts"],
    queryFn: () => api.get<FsmVanInventory[]>("/field-service/van-inventory"),
  });

  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<FsmEquipmentAsset[]>({
    queryKey: ["fsmAssets"],
    queryFn: () => api.get<FsmEquipmentAsset[]>("/field-service/equipment-assets"),
  });

  // Forms State
  const [newOrder, setNewOrder] = useState({
    client_name: "",
    client_phone: "",
    site_address: "مبنى البنك الأهلي - التجمع الخامس، شارع التسعين",
    equipment_type: "تشيللر تبريد مركزي (Carrier Chiller)",
    issue_description: "توقف مفاجئ في ضاغط التبريد رقم 2 وارتفاع درجة حرارة الخوادم",
    priority_sla: "emergency_2h",
    assigned_technician: "م/ أحمد الشناوي",
    van_code: "VAN-01",
    scheduled_date: new Date().toISOString().split("T")[0],
  });

  const [newTech, setNewTech] = useState({
    tech_name: "",
    phone: "",
    van_code: "VAN-04",
    assigned_zone: "التجمع والقاهرة الجديدة",
  });

  const [newPart, setNewPart] = useState({
    van_code: "VAN-01",
    technician_name: "م/ أحمد الشناوي",
    part_code: "PRT-VALV-88",
    part_name: "صمام تمدد حراري Danfoss 2 بوصة",
    qty_on_hand: 4,
    min_alert_threshold: 2,
    unit_price: 1850.0,
  });

  const [newAsset, setNewAsset] = useState({
    serial_number: "SN-CARRIER-9921",
    client_name: "",
    site_location: "القرية الذكية - مبنى C4",
    equipment_model: "تشيللر تبريد مركزي Carrier 30XA",
    install_date: "2024-03-15",
    last_service_date: "2026-08-10",
    next_service_due: "2026-11-20",
    warranty_status: "amc_active",
  });

  // Handlers
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field-service/work-orders", newOrder);
      queryClient.invalidateQueries({ queryKey: ["fsmWorkOrders"] });
      queryClient.invalidateQueries({ queryKey: ["fsmSummary"] });
      setIsNewOrderOpen(false);
      sound.click();
      toast("success", "تم إصدار أمر الشغل وإرسال التكليف لسيارة الصيانة بنجاح");
    } catch {
      toast("error", "تعذر إصدار أمر الشغل");
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTargetOrder) return;
    try {
      await api.post(`/field-service/work-orders/${completeTargetOrder.id}/status`, {
        status: "completed",
        completion_notes: completionNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["fsmWorkOrders"] });
      queryClient.invalidateQueries({ queryKey: ["fsmSummary"] });
      setCompleteTargetOrder(null);
      sound.click();
      toast("success", "تم إنجاز أمر الشغل وإغلاق البلاغ بنجاح");
    } catch {
      toast("error", "تعذر إغلاق أمر الشغل");
    }
  };

  const handleCreateTech = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field-service/technicians", newTech);
      queryClient.invalidateQueries({ queryKey: ["fsmTechnicians"] });
      queryClient.invalidateQueries({ queryKey: ["fsmSummary"] });
      setIsNewTechOpen(false);
      sound.click();
      toast("success", "تم إضافة الفني وسيارته للأسطول الميداني بنجاح");
    } catch {
      toast("error", "تعذر إضافة الفني");
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field-service/van-inventory", newPart);
      queryClient.invalidateQueries({ queryKey: ["fsmVanParts"] });
      queryClient.invalidateQueries({ queryKey: ["fsmSummary"] });
      setIsNewPartOpen(false);
      sound.click();
      toast("success", "تم تحميل القطعة على مخزن سيارة الصيانة بنجاح");
    } catch {
      toast("error", "تعذر إضافة قطعة الغيار");
    }
  };

  const handleConsumePart = async (partId: string) => {
    try {
      await api.post(`/field-service/van-inventory/${partId}/consume`, { qty: 1 });
      queryClient.invalidateQueries({ queryKey: ["fsmVanParts"] });
      queryClient.invalidateQueries({ queryKey: ["fsmSummary"] });
      sound.click();
      toast("success", "تم تسجيل استهلاك القطعة في موقع العميل بنجاح");
    } catch {
      toast("error", "رصيد القطعة في السيارة غير كافٍ");
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field-service/equipment-assets", newAsset);
      queryClient.invalidateQueries({ queryKey: ["fsmAssets"] });
      queryClient.invalidateQueries({ queryKey: ["fsmSummary"] });
      setIsNewAssetOpen(false);
      sound.click();
      toast("success", "تم إدراج المعدة في جدول عقود الصيانة الدورية AMC بنجاح");
    } catch {
      toast("error", "تعذر تسجيل المعدة");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-7 w-7 text-brand" />
            إدارة الصيانة الميدانية وخدمات الفنيين (FSM)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            أوامر الشغل واتفاقيات مستوى الخدمة (SLA)، تتبع الفنيين الميداني، مخزون سيارات الصيانة، وأصول الأجهزة وعقود AMC
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "work_orders" && (
            <Button onClick={() => setIsNewOrderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              أمر شغل ميداني جديد
            </Button>
          )}
          {activeTab === "technicians" && (
            <Button onClick={() => setIsNewTechOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل فني وسيّارة
            </Button>
          )}
          {activeTab === "van_inventory" && (
            <Button onClick={() => setIsNewPartOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تحميل قطع غيار للسيارة
            </Button>
          )}
          {activeTab === "assets" && (
            <Button onClick={() => setIsNewAssetOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل أصل وماكينة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Clock className="h-4 w-4 text-brand" />
            أوامر الشغل المفتوحة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold">{summary?.active_work_orders_count || 0}</div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            طوارئ عاجلة (2h SLA)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-red-500">
              {summary?.emergency_sla_count || 0}
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
              {summary?.completed_work_orders_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Truck className="h-4 w-4 text-sky-500" />
            فنيو الأسطول الميداني
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-sky-500">
              {summary?.total_technicians_count || 0} سيارة
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Navigation className="h-4 w-4 text-amber-500" />
            فنيون بالمواقع حالياً
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.techs_on_job_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Boxes className="h-4 w-4 text-violet-500" />
            نواقص قطع الغيار بالسيارات
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-violet-500">
              {summary?.low_stock_van_parts_count || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "work_orders" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("work_orders")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            أوامر الشغل واستجابة SLA
          </Button>
          <Button
            variant={activeTab === "technicians" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("technicians")}
            className="gap-2"
          >
            <Navigation className="h-4 w-4" />
            خريطة الفنيين والسيارات
          </Button>
          <Button
            variant={activeTab === "van_inventory" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("van_inventory")}
            className="gap-2"
          >
            <Boxes className="h-4 w-4" />
            مخازن سيارات الصيانة (Van Parts)
          </Button>
          <Button
            variant={activeTab === "assets" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("assets")}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            أصول الأجهزة وعقود AMC
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالرقم، العميل، المعدة، الفني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Work Orders */}
      {activeTab === "work_orders" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">رقم البلاغ</TableHead>
                  <TableHead className="text-right">العميل والموقع</TableHead>
                  <TableHead className="text-right">نوع المعدة والعطل</TableHead>
                  <TableHead className="text-right">أولوية الاستجابة (SLA)</TableHead>
                  <TableHead className="text-right">الفني والسيارة المكلفة</TableHead>
                  <TableHead className="text-right">الموعد المحدد</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات الفني</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOrdersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد أوامر شغل مسجلة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders
                    .filter((w) =>
                      w.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      w.order_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      w.assigned_technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      w.equipment_type.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((wo) => (
                      <TableRow key={wo.id}>
                        <TableCell className="font-mono font-bold text-xs">{wo.order_ref}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{wo.client_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-brand" />
                            {wo.site_address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-brand">{wo.equipment_type}</div>
                          <div className="text-xs text-muted-foreground max-w-xs truncate">{wo.issue_description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              wo.priority_sla === "emergency_2h"
                                ? "bg-red-500/10 text-red-500 border-red-500/30 font-bold"
                                : wo.priority_sla === "urgent_6h"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                            }
                          >
                            {wo.priority_sla === "emergency_2h"
                              ? "طارئ جداً (خلال ساعتين)"
                              : wo.priority_sla === "urgent_6h"
                              ? "عاجل (خلال 6 ساعات)"
                              : "اعتيادي (24 ساعة)"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold">{wo.assigned_technician}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">سيارة: {wo.van_code}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{wo.scheduled_date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              wo.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : wo.status === "on_site"
                                ? "bg-sky-500/10 text-sky-500 border-sky-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            }
                          >
                            {wo.status === "completed"
                              ? "تم الإصلاح والإغلاق"
                              : wo.status === "on_site"
                              ? "الفني بالموقع حالياً"
                              : "في طريق التوجه (Dispatched)"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {wo.status !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => setCompleteTargetOrder(wo)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              إغلاق البلاغ
                            </Button>
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

      {/* TAB 2: Technicians & GPS Live Board */}
      {activeTab === "technicians" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم الفني</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">كود السيارة المتنقلة</TableHead>
                  <TableHead className="text-right">المنطقة الجغرافية المغطاة</TableHead>
                  <TableHead className="text-right">الحالة الميدانية الحالية</TableHead>
                  <TableHead className="text-right">البلاغات المنجزة اليوم</TableHead>
                  <TableHead className="text-right">تقييم الجودة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTechsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : technicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد فنيون مسجلون
                    </TableCell>
                  </TableRow>
                ) : (
                  technicians.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold text-sm">{t.tech_name}</TableCell>
                      <TableCell className="font-mono text-xs">{t.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs bg-muted">
                          {t.van_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.assigned_zone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.live_status === "working_on_job"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : t.live_status === "driving_to_site"
                              ? "bg-sky-500/10 text-sky-500 border-sky-500/30"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          }
                        >
                          {t.live_status === "working_on_job"
                            ? "يعمل بموقع العميل"
                            : t.live_status === "driving_to_site"
                            ? "في الطريق للموقع (Driving)"
                            : "متاح ومستعد لبلاغ جديد"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-center font-bold">
                        {t.jobs_completed_today} بلاغات
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-amber-500">
                        ⭐ {t.rating} / 5.0
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 3: Van Inventory */}
      {activeTab === "van_inventory" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">كود السيارة</TableHead>
                  <TableHead className="text-right">الفني المسؤول</TableHead>
                  <TableHead className="text-right">كود القطعة</TableHead>
                  <TableHead className="text-right">اسم قطعة الغيار</TableHead>
                  <TableHead className="text-right">الرصيد بالسيارة</TableHead>
                  <TableHead className="text-right">حد الطلب الأدنى</TableHead>
                  <TableHead className="text-right">سعر الوحدة</TableHead>
                  <TableHead className="text-center">تسجيل استهلاك بموقع العميل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isVanLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : vanParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد قطع غيار مسجلة بسيارات الصيانة
                    </TableCell>
                  </TableRow>
                ) : (
                  vanParts.map((p) => {
                    const isLowStock = p.qty_on_hand <= p.min_alert_threshold;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono font-bold text-xs">{p.van_code}</TableCell>
                        <TableCell className="text-xs font-medium">{p.technician_name}</TableCell>
                        <TableCell className="font-mono text-xs">{p.part_code}</TableCell>
                        <TableCell className="font-semibold text-sm">{p.part_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-mono font-bold text-xs">
                            <span className={isLowStock ? "text-red-500" : "text-emerald-500"}>
                              {p.qty_on_hand} قطع
                            </span>
                            {isLowStock && (
                              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/30">
                                منخفض
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.min_alert_threshold} قطع</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-brand">
                          {p.unit_price.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={p.qty_on_hand <= 0}
                            className="text-xs gap-1 border-brand/40 text-brand hover:bg-brand/10"
                            onClick={() => handleConsumePart(p.id)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                            استهلاك قطعة
                          </Button>
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

      {/* TAB 4: Customer Machine Assets & AMC */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">الرقم التسلسلي (S/N)</TableHead>
                  <TableHead className="text-right">العميل والموقع</TableHead>
                  <TableHead className="text-right">موديل وطراز المعدة</TableHead>
                  <TableHead className="text-right">تاريخ التركيب</TableHead>
                  <TableHead className="text-right">آخر صيانة</TableHead>
                  <TableHead className="text-right">موعد الصيانة القادم</TableHead>
                  <TableHead className="text-right">حالة الضمان وعقد AMC</TableHead>
                  <TableHead className="text-center">مرات الإصلاح السابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAssetsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد معدات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((ast) => (
                    <TableRow key={ast.id}>
                      <TableCell className="font-mono font-bold text-xs text-brand">{ast.serial_number}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{ast.client_name}</div>
                        <div className="text-xs text-muted-foreground">{ast.site_location}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{ast.equipment_model}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{ast.install_date}</TableCell>
                      <TableCell className="font-mono text-xs">{ast.last_service_date}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-sky-500">{ast.next_service_due}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            ast.warranty_status === "amc_active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : ast.warranty_status === "under_warranty"
                              ? "bg-sky-500/10 text-sky-500 border-sky-500/30"
                              : "bg-red-500/10 text-red-500 border-red-500/30"
                          }
                        >
                          {ast.warranty_status === "amc_active"
                            ? "عقد صيانة ساري (AMC Active)"
                            : ast.warranty_status === "under_warranty"
                            ? "تحت الضمان الأصلي"
                            : "منتهي الضمان"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-center font-bold">
                        {ast.total_repairs_count} مرات
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* MODAL 1: Create Work Order */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إصدار وتكليف أمر شغل صيانة ميدانية</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewOrderOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم العميل / المنشأة</label>
                  <Input
                    required
                    value={newOrder.client_name}
                    onChange={(e) => setNewOrder({ ...newOrder, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">هاتف مسؤول الموقع</label>
                  <Input
                    required
                    value={newOrder.client_phone}
                    onChange={(e) => setNewOrder({ ...newOrder, client_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">عنوان الموقع بالتفصيل</label>
                <Input
                  required
                  value={newOrder.site_address}
                  onChange={(e) => setNewOrder({ ...newOrder, site_address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">نوع المعدة / النظام</label>
                  <Input
                    required
                    value={newOrder.equipment_type}
                    onChange={(e) => setNewOrder({ ...newOrder, equipment_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">أولوية الاستجابة SLA</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newOrder.priority_sla}
                    onChange={(e) => setNewOrder({ ...newOrder, priority_sla: e.target.value as any })}
                  >
                    <option value="emergency_2h">طارئ جداً (خلال ساعتين)</option>
                    <option value="urgent_6h">عاجل (خلال 6 ساعات)</option>
                    <option value="standard_24h">اعتيادي (خلال 24 ساعة)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">وصف العطل والبلاغ</label>
                <textarea
                  className="w-full h-20 p-2 text-xs border rounded bg-background"
                  required
                  value={newOrder.issue_description}
                  onChange={(e) => setNewOrder({ ...newOrder, issue_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">الفني المكلف</label>
                  <Input
                    value={newOrder.assigned_technician}
                    onChange={(e) => setNewOrder({ ...newOrder, assigned_technician: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">كود السيارة</label>
                  <Input
                    value={newOrder.van_code}
                    onChange={(e) => setNewOrder({ ...newOrder, van_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ الزيارة</label>
                  <Input
                    type="date"
                    value={newOrder.scheduled_date}
                    onChange={(e) => setNewOrder({ ...newOrder, scheduled_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إرسال وتوجيه الفني</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Complete Work Order */}
      {completeTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل إنجاز أمر الشغل</h3>
              <Button variant="ghost" size="sm" onClick={() => setCompleteTargetOrder(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCompleteOrder} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="font-bold text-brand">{completeTargetOrder.order_ref}</div>
                <div>العميل: {completeTargetOrder.client_name}</div>
                <div className="text-muted-foreground">{completeTargetOrder.equipment_type}</div>
              </div>

              <div>
                <label className="text-xs font-medium">تقرير الفني وتوصيف الإصلاح المنفذ</label>
                <textarea
                  className="w-full h-24 p-2 text-xs border rounded bg-background"
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setCompleteTargetOrder(null)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  إغلاق وتأكيد الإصلاح
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Create Technician */}
      {isNewTechOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل فني وسيّارة صيانة بالأسطول</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewTechOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateTech} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم الفني</label>
                  <Input
                    required
                    value={newTech.tech_name}
                    onChange={(e) => setNewTech({ ...newTech, tech_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">رقم الهاتف المحمول</label>
                  <Input
                    required
                    value={newTech.phone}
                    onChange={(e) => setNewTech({ ...newTech, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">كود سيارة الصيانة (Van)</label>
                  <Input
                    required
                    value={newTech.van_code}
                    onChange={(e) => setNewTech({ ...newTech, van_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">المنطقة الجغرافية المغطاة</label>
                  <Input
                    required
                    value={newTech.assigned_zone}
                    onChange={(e) => setNewTech({ ...newTech, assigned_zone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewTechOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تسجيل في الأسطول</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: Create Van Part */}
      {isNewPartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تحميل قطع غيار لمخزن سيارة الفني</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewPartOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePart} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">كود سيارة الصيانة</label>
                  <Input
                    required
                    value={newPart.van_code}
                    onChange={(e) => setNewPart({ ...newPart, van_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الفني المسؤول عن السيارة</label>
                  <Input
                    required
                    value={newPart.technician_name}
                    onChange={(e) => setNewPart({ ...newPart, technician_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">كود قطعة الغيار</label>
                  <Input
                    required
                    value={newPart.part_code}
                    onChange={(e) => setNewPart({ ...newPart, part_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">اسم وتوصيف القطعة</label>
                  <Input
                    required
                    value={newPart.part_name}
                    onChange={(e) => setNewPart({ ...newPart, part_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">الكمية المشحونة</label>
                  <Input
                    type="number"
                    value={newPart.qty_on_hand}
                    onChange={(e) => setNewPart({ ...newPart, qty_on_hand: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">حد النواقص الأدنى</label>
                  <Input
                    type="number"
                    value={newPart.min_alert_threshold}
                    onChange={(e) => setNewPart({ ...newPart, min_alert_threshold: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">سعر الوحدة (ج.م)</label>
                  <Input
                    type="number"
                    value={newPart.unit_price}
                    onChange={(e) => setNewPart({ ...newPart, unit_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewPartOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تحميل بالسيارة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 5: Create Equipment Asset */}
      {isNewAssetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل أصل ومعدة في عقود الصيانة AMC</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewAssetOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الرقم التسلسلي (Serial Number)</label>
                  <Input
                    required
                    value={newAsset.serial_number}
                    onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">اسم العميل والمنشأة</label>
                  <Input
                    required
                    value={newAsset.client_name}
                    onChange={(e) => setNewAsset({ ...newAsset, client_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">موقع التركيب</label>
                  <Input
                    required
                    value={newAsset.site_location}
                    onChange={(e) => setNewAsset({ ...newAsset, site_location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">طراز وموديل المعدة</label>
                  <Input
                    required
                    value={newAsset.equipment_model}
                    onChange={(e) => setNewAsset({ ...newAsset, equipment_model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">تاريخ التركيب</label>
                  <Input
                    type="date"
                    value={newAsset.install_date}
                    onChange={(e) => setNewAsset({ ...newAsset, install_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ آخر صيانة</label>
                  <Input
                    type="date"
                    value={newAsset.last_service_date}
                    onChange={(e) => setNewAsset({ ...newAsset, last_service_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">موعد الصيانة القادم</label>
                  <Input
                    type="date"
                    value={newAsset.next_service_due}
                    onChange={(e) => setNewAsset({ ...newAsset, next_service_due: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">حالة الضمان وعقد الصيانة</label>
                <select
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={newAsset.warranty_status}
                  onChange={(e) => setNewAsset({ ...newAsset, warranty_status: e.target.value })}
                >
                  <option value="amc_active">عقد صيانة ساري (AMC Active)</option>
                  <option value="under_warranty">تحت الضمان الأصلي (Under Warranty)</option>
                  <option value="expired">منتهي الصلاحية والضمان</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewAssetOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ بيانات المعدة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
