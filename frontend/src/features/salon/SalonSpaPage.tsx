import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Droplets,
  FileText,
  Palette,
  Play,
  Plus,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
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

interface SalonSummary {
  today_appointments_count: number;
  in_service_now_count: number;
  completed_services_count: number;
  active_stylists_count: number;
  catalog_services_count: number;
  recorded_formulas_count: number;
  today_revenue_amount: number;
}

interface SalonService {
  id: string;
  service_name: string;
  category: string;
  duration_minutes: number;
  buffer_turnaround_minutes: number;
  base_price: number;
  consumable_cost: number;
  is_active: boolean;
}

interface SalonAppointment {
  id: string;
  appointment_ref: string;
  client_name: string;
  client_phone: string;
  stylist_name: string;
  service_name: string;
  station_or_room: string;
  appointment_date: string;
  time_slot: string;
  price: number;
  status: "scheduled" | "in_service" | "completed" | "cancelled";
  payment_status: "paid" | "unpaid";
}

interface SalonStylist {
  id: string;
  stylist_name: string;
  specialty: string;
  phone: string;
  commission_service_percent: number;
  commission_retail_percent: number;
  total_services_count: number;
  gross_revenue_generated: number;
}

interface SalonBeautyFormula {
  id: string;
  client_name: string;
  client_phone: string;
  stylist_name: string;
  formula_date: string;
  service_type: string;
  formula_details: string;
  sensitivity_notes: string;
  stylist_notes: string;
}

export default function SalonSpaPage() {
  const [activeTab, setActiveTab] = useState<"appointments" | "services" | "stylists" | "formulas">("appointments");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isNewStylistOpen, setIsNewStylistOpen] = useState(false);
  const [isNewFormulaOpen, setIsNewFormulaOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<SalonBeautyFormula | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<SalonSummary>({
    queryKey: ["salonSummary"],
    queryFn: () => api.get<SalonSummary>("/salon/summary"),
  });

  const { data: appointments = [], isLoading: isAppointmentsLoading } = useQuery<SalonAppointment[]>({
    queryKey: ["salonAppointments"],
    queryFn: () => api.get<SalonAppointment[]>("/salon/appointments"),
  });

  const { data: services = [], isLoading: isServicesLoading } = useQuery<SalonService[]>({
    queryKey: ["salonServices"],
    queryFn: () => api.get<SalonService[]>("/salon/services"),
  });

  const { data: stylists = [], isLoading: isStylistsLoading } = useQuery<SalonStylist[]>({
    queryKey: ["salonStylists"],
    queryFn: () => api.get<SalonStylist[]>("/salon/stylists"),
  });

  const { data: formulas = [], isLoading: isFormulasLoading } = useQuery<SalonBeautyFormula[]>({
    queryKey: ["salonFormulas"],
    queryFn: () => api.get<SalonBeautyFormula[]>("/salon/formulas"),
  });

  // Forms State
  const [newAppointment, setNewAppointment] = useState({
    client_name: "",
    client_phone: "",
    stylist_name: "مروة الإسكندراني (Color Specialist)",
    service_name: "صبغة كاملة وتدرج هايلايت Balayage",
    station_or_room: "كرسي تصفيف 1",
    appointment_date: new Date().toISOString().split("T")[0],
    time_slot: "03:30 PM",
    price: 1850,
  });

  const [newService, setNewService] = useState({
    service_name: "علاج الشعر بالكافيار والبروتين البرازيلي",
    category: "صبغة ومعالجة",
    duration_minutes: 90,
    buffer_turnaround_minutes: 15,
    base_price: 2400,
    consumable_cost: 350,
  });

  const [newStylist, setNewStylist] = useState({
    stylist_name: "",
    specialty: "أخصائي قص وتصفيف محترف",
    phone: "",
    commission_service_percent: 25.0,
    commission_retail_percent: 10.0,
  });

  const [newFormula, setNewFormula] = useState({
    client_name: "",
    client_phone: "",
    stylist_name: "مروة الإسكندراني",
    formula_date: new Date().toISOString().split("T")[0],
    service_type: "صبغة ومعالجة فيلر",
    formula_details: "Wella Koleston 7/1 (40g) + 8/0 (20g) مع أوكسجين 20 Vol (60ml). وقت الانتظار: 35 دقيقة ثم غسيل بشامبو خالي من السلفات.",
    sensitivity_notes: "تم عمل اختبار حساسية موضعي خلف الأذن قبل 48 ساعة وكانت النتيجة سليمة تماماً.",
    stylist_notes: "الشعر ناعم ومسامي، تجنب استخدام حرارة عالية أثناء التجفيف.",
  });

  // Handlers
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/salon/appointments", newAppointment);
      queryClient.invalidateQueries({ queryKey: ["salonAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["salonSummary"] });
      setIsNewAppointmentOpen(false);
      toast("success", "تم إدراج الموعد في جدول المصفف بنجاح");
    } catch {
      toast("error", "تعذر حجز الموعد");
    }
  };

  const handleUpdateAppointmentStatus = async (aptId: string, status: string) => {
    sound.click();
    try {
      await api.post(`/salon/appointments/${aptId}/status`, {
        status,
        payment_status: status === "completed" ? "paid" : "unpaid",
      });
      queryClient.invalidateQueries({ queryKey: ["salonAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["salonStylists"] });
      queryClient.invalidateQueries({ queryKey: ["salonSummary"] });
      const statusText = status === "in_service" ? "تم بدء تقديم الخدمة" : "اكتملت الخدمة وتم التحصيل";
      toast("success", statusText);
    } catch {
      toast("error", "تعذر تحديث حالة الموعد");
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/salon/services", newService);
      queryClient.invalidateQueries({ queryKey: ["salonServices"] });
      queryClient.invalidateQueries({ queryKey: ["salonSummary"] });
      setIsNewServiceOpen(false);
      toast("success", "تم تحديث كتالوج الخدمات والأسعار بنجاح");
    } catch {
      toast("error", "تعذر إضافة الخدمة");
    }
  };

  const handleCreateStylist = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/salon/stylists", newStylist);
      queryClient.invalidateQueries({ queryKey: ["salonStylists"] });
      queryClient.invalidateQueries({ queryKey: ["salonSummary"] });
      setIsNewStylistOpen(false);
      toast("success", "تم إنشاء ملف الكادر ونسب العمولات بنجاح");
    } catch {
      toast("error", "تعذر تسجيل المصفف");
    }
  };

  const handleCreateFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/salon/formulas", newFormula);
      queryClient.invalidateQueries({ queryKey: ["salonFormulas"] });
      queryClient.invalidateQueries({ queryKey: ["salonSummary"] });
      setIsNewFormulaOpen(false);
      toast("success", "تم أرشفة تركيبة الصبغة في ملف العميل بنجاح");
    } catch {
      toast("error", "تعذر حفظ التركيبة");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="h-7 w-7 text-brand" />
            صالون التجميل والسبا والعناية الشخصية
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            جدولة مواعيد المصففين، كتالوج الخدمات والمدد الزمنية، حساب عمولات الكادر، وسجل تركيبات الصبغات واختبارات الحساسية
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "appointments" && (
            <Button onClick={() => setIsNewAppointmentOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              حجز موعد تجميل
            </Button>
          )}
          {activeTab === "services" && (
            <Button onClick={() => setIsNewServiceOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة خدمة للكتالوج
            </Button>
          )}
          {activeTab === "stylists" && (
            <Button onClick={() => setIsNewStylistOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مصفف / خبير
            </Button>
          )}
          {activeTab === "formulas" && (
            <Button onClick={() => setIsNewFormulaOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل تركيبة صبغة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Calendar className="h-4 w-4 text-brand" />
            مواعيد اليوم
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold">{summary?.today_appointments_count || 0}</div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Sparkles className="h-4 w-4 text-sky-500" />
            قيد الخدمة الآن
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-sky-500">
              {summary?.in_service_now_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            الخدمات المكتملة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-500">
              {summary?.completed_services_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <DollarSign className="h-4 w-4 text-teal-500" />
            إيراد الصالون اليوم
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-teal-500">
              {(summary?.today_revenue_amount || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Users className="h-4 w-4 text-violet-500" />
            خبراء التجميل والمصففون
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-violet-500">
              {summary?.active_stylists_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Droplets className="h-4 w-4 text-amber-500" />
            تركيبات الصبغة المؤرشفة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.recorded_formulas_count || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "appointments" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("appointments")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            جدول المواعيد والكراسي
          </Button>
          <Button
            variant={activeTab === "services" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("services")}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            كتالوج الخدمات والمدد
          </Button>
          <Button
            variant={activeTab === "stylists" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("stylists")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            عمولات الكادر والمصففين
          </Button>
          <Button
            variant={activeTab === "formulas" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("formulas")}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            تركيبات الصبغة واختبارات الحساسية
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالعميل، المصفف، الخدمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">رقم الموعد</TableHead>
                  <TableHead className="text-right">العميل والموبايل</TableHead>
                  <TableHead className="text-right">المصفف المسؤول</TableHead>
                  <TableHead className="text-right">الخدمة المطلوبة</TableHead>
                  <TableHead className="text-right">المكان / الكرسي</TableHead>
                  <TableHead className="text-right">الوقت والتاريخ</TableHead>
                  <TableHead className="text-right">السعر والدفع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات الموعد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAppointmentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد مواعيد مسجلة اليوم
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments
                    .filter((a) =>
                      a.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.stylist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.service_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-mono font-bold text-xs">{apt.appointment_ref}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{apt.client_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{apt.client_phone}</div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-brand">{apt.stylist_name}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{apt.service_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-muted">
                            {apt.station_or_room}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <div>{apt.appointment_date}</div>
                          <div className="text-brand font-bold">{apt.time_slot}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-bold text-xs">{apt.price.toLocaleString()} ج.م</div>
                          <Badge
                            variant="outline"
                            className={
                              apt.payment_status === "paid"
                                ? "bg-emerald-500/10 text-emerald-500 text-[10px]"
                                : "bg-amber-500/10 text-amber-500 text-[10px]"
                            }
                          >
                            {apt.payment_status === "paid" ? "تم التحصيل" : "غير مدفوع"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              apt.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : apt.status === "in_service"
                                ? "bg-sky-500/10 text-sky-500 border-sky-500/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {apt.status === "completed"
                              ? "مكتمل"
                              : apt.status === "in_service"
                              ? "قيد الجلسة الآن"
                              : "مجدول"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {apt.status === "scheduled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-sky-500/40 text-sky-500 hover:bg-sky-500/10"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, "in_service")}
                            >
                              <Play className="h-3.5 w-3.5" />
                              بدء الجلسة
                            </Button>
                          )}
                          {apt.status === "in_service" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, "completed")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              إتمام وتحصيل
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

      {/* TAB 2: Services Catalog */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم الخدمة</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">المدة الزمنية</TableHead>
                  <TableHead className="text-right">وقت التجهيز (Buffer)</TableHead>
                  <TableHead className="text-right">تكلفة المستهلكات</TableHead>
                  <TableHead className="text-right">سعر الخدمة الأساسي</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isServicesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      كتالوج الخدمات فارغ
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((srv) => (
                    <TableRow key={srv.id}>
                      <TableCell className="font-semibold text-sm">{srv.service_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-muted">
                          {srv.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{srv.duration_minutes} دقيقة</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {srv.buffer_turnaround_minutes} دقيقة
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {srv.consumable_cost.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-brand">
                        {srv.base_price.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                          مفعلة
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

      {/* TAB 3: Stylists & Commissions */}
      {activeTab === "stylists" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم المصفف / الخبير</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">نسبة عمولة الخدمات</TableHead>
                  <TableHead className="text-right">نسبة عمولة التجزئة</TableHead>
                  <TableHead className="text-right">إجمالي الخدمات المنجزة</TableHead>
                  <TableHead className="text-right">الإيراد المحقق</TableHead>
                  <TableHead className="text-right">صافي العمولة المستحقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isStylistsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : stylists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا يوجد مصففون مسجلون
                    </TableCell>
                  </TableRow>
                ) : (
                  stylists.map((st) => {
                    const commissionDue = Math.round(st.gross_revenue_generated * (st.commission_service_percent / 100));
                    return (
                      <TableRow key={st.id}>
                        <TableCell className="font-semibold text-sm">{st.stylist_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{st.specialty}</TableCell>
                        <TableCell className="font-mono text-xs">{st.phone}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-sky-500">
                          {st.commission_service_percent}%
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {st.commission_retail_percent}%
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold">
                          {st.total_services_count} خدمة
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs">
                          {st.gross_revenue_generated.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-emerald-500">
                          {commissionDue.toLocaleString()} ج.م
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

      {/* TAB 4: Beauty Formulas & Patch Testing */}
      {activeTab === "formulas" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم العميل</TableHead>
                  <TableHead className="text-right">المصفف</TableHead>
                  <TableHead className="text-right">تاريخ الإجراء</TableHead>
                  <TableHead className="text-right">نوع الجلسة</TableHead>
                  <TableHead className="text-right">تفاصيل التركيبة والألوان</TableHead>
                  <TableHead className="text-right">اختبار الحساسية (Patch Test)</TableHead>
                  <TableHead className="text-center">عرض كامل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFormulasLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : formulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد تركيبات صبغة مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  formulas.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-semibold text-sm">{f.client_name}</TableCell>
                      <TableCell className="text-xs text-brand font-medium">{f.stylist_name}</TableCell>
                      <TableCell className="font-mono text-xs">{f.formula_date}</TableCell>
                      <TableCell className="text-xs">{f.service_type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate font-mono">
                        {f.formula_details}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-emerald-500">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[180px]">{f.sensitivity_notes}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => setSelectedFormula(f)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          التفاصيل
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

      {/* MODAL 1: View Formula Details */}
      {selectedFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold">{selectedFormula.client_name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedFormula.formula_date} • خبير التجميل: {selectedFormula.stylist_name}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFormula(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <span className="font-bold text-brand">تفاصيل تركيبة الصبغة والمقادير:</span>
                <p className="text-foreground font-mono text-sm leading-relaxed whitespace-pre-line mt-1">
                  {selectedFormula.formula_details}
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  نتيجة اختبار الحساسية للجلد:
                </span>
                <p className="text-emerald-400">{selectedFormula.sensitivity_notes}</p>
              </div>

              {selectedFormula.stylist_notes && (
                <div className="p-3 bg-muted/20 rounded-lg text-xs space-y-1">
                  <span className="font-bold">ملاحظات إضافية من المصفف:</span>
                  <p className="text-muted-foreground">{selectedFormula.stylist_notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedFormula(null)}>إغلاق</Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 2: Create Appointment */}
      {isNewAppointmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل موعد تجميل جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewAppointmentOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم العميل</label>
                  <Input
                    required
                    value={newAppointment.client_name}
                    onChange={(e) => setNewAppointment({ ...newAppointment, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">رقم الهاتف</label>
                  <Input
                    required
                    value={newAppointment.client_phone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, client_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اختر المصفف</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newAppointment.stylist_name}
                    onChange={(e) => setNewAppointment({ ...newAppointment, stylist_name: e.target.value })}
                  >
                    {stylists.map((s) => (
                      <option key={s.id} value={s.stylist_name}>
                        {s.stylist_name} ({s.specialty})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">اختر الخدمة</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newAppointment.service_name}
                    onChange={(e) => {
                      const s = services.find((x) => x.service_name === e.target.value);
                      setNewAppointment({
                        ...newAppointment,
                        service_name: e.target.value,
                        price: s ? s.base_price : 1850,
                      });
                    }}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.service_name}>
                        {s.service_name} ({s.base_price.toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">الكرسي / الغرفة</label>
                  <Input
                    value={newAppointment.station_or_room}
                    onChange={(e) => setNewAppointment({ ...newAppointment, station_or_room: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">التاريخ</label>
                  <Input
                    type="date"
                    value={newAppointment.appointment_date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الوقت</label>
                  <Input
                    value={newAppointment.time_slot}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time_slot: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">سعر الجلسة (ج.م)</label>
                <Input
                  type="number"
                  value={newAppointment.price}
                  onChange={(e) => setNewAppointment({ ...newAppointment, price: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تثبيت الموعد</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Create Service */}
      {isNewServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إضافة خدمة جديدة للكتالوج</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewServiceOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اسم الخدمة</label>
                <Input
                  required
                  value={newService.service_name}
                  onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">التصنيف</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="شعر وتصفيف">شعر وتصفيف</option>
                    <option value="صبغة ومعالجة">صبغة ومعالجة</option>
                    <option value="بشرة وأظافر">بشرة وأظافر</option>
                    <option value="سبا ومساج">سبا ومساج</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">المدة بالدقائق</label>
                  <Input
                    type="number"
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">سعر الخدمة الأساسي (ج.م)</label>
                  <Input
                    type="number"
                    value={newService.base_price}
                    onChange={(e) => setNewService({ ...newService, base_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تكلفة المواد المستهلكة (ج.م)</label>
                  <Input
                    type="number"
                    value={newService.consumable_cost}
                    onChange={(e) => setNewService({ ...newService, consumable_cost: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إدراج في الكتالوج</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: Create Stylist */}
      {isNewStylistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إضافة خبير تجميل / مصفف جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewStylistOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateStylist} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم المصفف</label>
                  <Input
                    required
                    value={newStylist.stylist_name}
                    onChange={(e) => setNewStylist({ ...newStylist, stylist_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">رقم الهاتف</label>
                  <Input
                    required
                    value={newStylist.phone}
                    onChange={(e) => setNewStylist({ ...newStylist, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">التخصص المهني</label>
                <Input
                  required
                  value={newStylist.specialty}
                  onChange={(e) => setNewStylist({ ...newStylist, specialty: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">نسبة عمولة الخدمات (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newStylist.commission_service_percent}
                    onChange={(e) => setNewStylist({ ...newStylist, commission_service_percent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">نسبة عمولة مبيعات المنتجات (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newStylist.commission_retail_percent}
                    onChange={(e) => setNewStylist({ ...newStylist, commission_retail_percent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewStylistOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تسجيل المصفف</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 5: Create Formula */}
      {isNewFormulaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل تركيبة صبغة واختبار حساسية</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewFormulaOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateFormula} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم العميل</label>
                  <Input
                    required
                    value={newFormula.client_name}
                    onChange={(e) => setNewFormula({ ...newFormula, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">هاتف العميل</label>
                  <Input
                    required
                    value={newFormula.client_phone}
                    onChange={(e) => setNewFormula({ ...newFormula, client_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">المصفف القائم بالعمل</label>
                  <Input
                    required
                    value={newFormula.stylist_name}
                    onChange={(e) => setNewFormula({ ...newFormula, stylist_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">نوع الخدمة والمعالجة</label>
                  <Input
                    required
                    value={newFormula.service_type}
                    onChange={(e) => setNewFormula({ ...newFormula, service_type: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">تفاصيل تركيبة الصبغة والمقادير</label>
                <textarea
                  className="w-full h-24 p-2 text-xs border rounded bg-background"
                  required
                  value={newFormula.formula_details}
                  onChange={(e) => setNewFormula({ ...newFormula, formula_details: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">ملاحظات فحص حساسية الجلد (Patch Test)</label>
                <Input
                  value={newFormula.sensitivity_notes}
                  onChange={(e) => setNewFormula({ ...newFormula, sensitivity_notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewFormulaOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ التركيبة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
