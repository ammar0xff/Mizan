import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Hotel,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Search,
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

interface HospitalitySummary {
  total_rooms: number;
  occupied_rooms: number;
  dirty_rooms: number;
  occupancy_rate_percent: number;
  today_checkins_count: number;
  pending_housekeeping_tasks: number;
  average_daily_rate_adr: number;
  revenue_per_available_room_revpar: number;
}

interface HotelRoom {
  id: string;
  room_number: string;
  room_type: string;
  floor: string;
  bed_type: string;
  max_guests: number;
  base_rate: number;
  status: "vacant_clean" | "vacant_dirty" | "occupied" | "inspected" | "out_of_order";
  amenities: string;
}

interface HotelReservation {
  id: string;
  reservation_ref: string;
  guest_name: string;
  guest_phone: string;
  guest_passport: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  room_rate: number;
  total_charges: number;
  paid_amount: number;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled";
}

interface HotelFolioItem {
  id: string;
  reservation_id: string;
  guest_name: string;
  room_number: string;
  charge_type: string;
  description: string;
  net_amount: number;
  tax_amount: number;
  total_amount: number;
  charge_date: string;
  is_settled: boolean;
}

interface HotelHousekeepingTask {
  id: string;
  room_number: string;
  task_type: string;
  priority: "urgent" | "high" | "normal";
  assigned_to: string;
  status: "pending" | "in_progress" | "completed";
  notes: string;
  completed_at: string;
}

interface HotelNightAudit {
  id: string;
  audit_date: string;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  room_revenue: number;
  fnb_revenue: number;
  total_revenue: number;
  adr: number;
  revpar: number;
  conducted_by: string;
}

export default function HospitalityPmsPage() {
  const [activeTab, setActiveTab] = useState<"rooms" | "reservations" | "folio" | "housekeeping" | "night_audit">("rooms");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewRoomOpen, setIsNewRoomOpen] = useState(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [isNewFolioOpen, setIsNewFolioOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<HospitalitySummary>({
    queryKey: ["hospitalitySummary"],
    queryFn: () => api.get<HospitalitySummary>("/hospitality/summary"),
  });

  const { data: rooms = [], isLoading: isRoomsLoading } = useQuery<HotelRoom[]>({
    queryKey: ["hotelRooms"],
    queryFn: () => api.get<HotelRoom[]>("/hospitality/rooms"),
  });

  const { data: reservations = [], isLoading: isReservationsLoading } = useQuery<HotelReservation[]>({
    queryKey: ["hotelReservations"],
    queryFn: () => api.get<HotelReservation[]>("/hospitality/reservations"),
  });

  const { data: folioItems = [], isLoading: isFolioLoading } = useQuery<HotelFolioItem[]>({
    queryKey: ["hotelFolioItems"],
    queryFn: () => api.get<HotelFolioItem[]>("/hospitality/folio"),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery<HotelHousekeepingTask[]>({
    queryKey: ["hotelHousekeepingTasks"],
    queryFn: () => api.get<HotelHousekeepingTask[]>("/hospitality/housekeeping"),
  });

  const { data: nightAudits = [], isLoading: isAuditsLoading } = useQuery<HotelNightAudit[]>({
    queryKey: ["hotelNightAudits"],
    queryFn: () => api.get<HotelNightAudit[]>("/hospitality/night-audits"),
  });

  // Forms State
  const [newRoom, setNewRoom] = useState({
    room_number: "601-VIP",
    room_type: "جناح رويال تنفيذي (Royal Suite)",
    floor: "الدور السادس",
    bed_type: "King Size Bed",
    max_guests: 3,
    base_rate: 4500,
    amenities: "إطلالة بانورامية كاملة على النيل، جاكوزي خاص، صالون استقبال، خدمة كونسيرج 24 ساعة",
  });

  const [newReservation, setNewReservation] = useState({
    guest_name: "",
    guest_phone: "",
    guest_passport: "",
    room_number: "",
    check_in_date: new Date().toISOString().split("T")[0],
    check_out_date: "2026-11-06",
    nights: 3,
    room_rate: 2200,
    paid_amount: 6600,
  });

  const [newFolio, setNewFolio] = useState({
    reservation_id: "",
    guest_name: "",
    room_number: "",
    charge_type: "مطعم وكافيه",
    description: "عشاء مفتوح مطعم النيل للمأكولات البحرية (2 أفراد)",
    net_amount: 850,
    tax_amount: 119,
  });

  const [newTask, setNewTask] = useState({
    room_number: "",
    task_type: "تنظيف يومي (Stayover)",
    priority: "normal",
    assigned_to: "فريق النظافة أ - صباحي",
    notes: "تغيير الشراشف والمناشف وتعبئة الميني بار",
  });

  // Handlers
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/hospitality/rooms", newRoom);
      queryClient.invalidateQueries({ queryKey: ["hotelRooms"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      setIsNewRoomOpen(false);
      toast("success", "تم تسجيل الغرفة بنجاح في جدول الوحدات");
    } catch {
      toast("error", "تعذر إضافة الغرفة");
    }
  };

  const handleUpdateRoomStatus = async (roomId: string, status: string) => {
    sound.click();
    try {
      await api.post(`/hospitality/rooms/${roomId}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["hotelRooms"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      toast("success", "تم تغيير حالة الغرفة بنجاح");
    } catch {
      toast("error", "تعذر تحديث حالة الغرفة");
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/hospitality/reservations", newReservation);
      queryClient.invalidateQueries({ queryKey: ["hotelReservations"] });
      queryClient.invalidateQueries({ queryKey: ["hotelRooms"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      setIsNewReservationOpen(false);
      toast("success", "تم تسجيل حجز النزيل بنجاح");
    } catch {
      toast("error", "تعذر تسجيل الحجز");
    }
  };

  const handleCheckIn = async (resId: string) => {
    sound.click();
    try {
      await api.post(`/hospitality/reservations/${resId}/checkin`);
      queryClient.invalidateQueries({ queryKey: ["hotelReservations"] });
      queryClient.invalidateQueries({ queryKey: ["hotelRooms"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      toast("success", "تم تسكين النزيل وتسليم بطاقة الغرفة");
    } catch {
      toast("error", "تعذر إتمام التسكين");
    }
  };

  const handleCheckOut = async (resId: string) => {
    sound.click();
    try {
      await api.post(`/hospitality/reservations/${resId}/checkout`);
      queryClient.invalidateQueries({ queryKey: ["hotelReservations"] });
      queryClient.invalidateQueries({ queryKey: ["hotelRooms"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      toast("success", "تمت تسوية الحساب وتحويل الغرفة للنظافة");
    } catch {
      toast("error", "تعذر إتمام المغادرة");
    }
  };

  const handleCreateFolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/hospitality/folio", newFolio);
      queryClient.invalidateQueries({ queryKey: ["hotelFolioItems"] });
      queryClient.invalidateQueries({ queryKey: ["hotelReservations"] });
      setIsNewFolioOpen(false);
      toast("success", "تم قيد البند في فاتورة النزيل (Folio)");
    } catch {
      toast("error", "تعذر تسجيل البند");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/hospitality/housekeeping", newTask);
      queryClient.invalidateQueries({ queryKey: ["hotelHousekeepingTasks"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      setIsNewTaskOpen(false);
      toast("success", "تم إرسال مهمة التنظيف بنجاح");
    } catch {
      toast("error", "تعذر إرسال المهمة");
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    sound.click();
    try {
      await api.post(`/hospitality/housekeeping/${taskId}/complete`);
      queryClient.invalidateQueries({ queryKey: ["hotelHousekeepingTasks"] });
      queryClient.invalidateQueries({ queryKey: ["hotelRooms"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      toast("success", "أصبحت الغرفة جاهزة ونظيفة للتسكين");
    } catch {
      toast("error", "تعذر تحديث المهمة");
    }
  };

  const handleRunNightAudit = async () => {
    sound.click();
    try {
      await api.post("/hospitality/night-audit/run");
      queryClient.invalidateQueries({ queryKey: ["hotelNightAudits"] });
      queryClient.invalidateQueries({ queryKey: ["hospitalitySummary"] });
      toast("success", "تم ترحيل إيرادات اليوم وحساب مؤشرات ADR و RevPAR");
    } catch {
      toast("error", "تعذر تشغيل التدقيق الليلي");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Hotel className="h-7 w-7 text-brand" />
            نظام إدارة الفنادق والضيافة (Hotel PMS)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مصفوفة الغرف والحجوزات، تسكين ومغادرة النزلاء، الفواتير المجمعة، والإشراف الداخلي والتدقيق الليلي
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "rooms" && (
            <Button onClick={() => setIsNewRoomOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة غرفة للأسطول
            </Button>
          )}
          {activeTab === "reservations" && (
            <Button onClick={() => setIsNewReservationOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              حجز غرفة جديد
            </Button>
          )}
          {activeTab === "folio" && (
            <Button onClick={() => setIsNewFolioOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              قيد مصروف على الغرفة
            </Button>
          )}
          {activeTab === "housekeeping" && (
            <Button onClick={() => setIsNewTaskOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              تكليف مهمة نظافة
            </Button>
          )}
          {activeTab === "night_audit" && (
            <Button onClick={handleRunNightAudit} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Moon className="h-4 w-4" />
              تشغيل التدقيق الليلي (Night Audit)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Bed className="h-4 w-4 text-brand" />
            إجمالي الغرف
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold">{summary?.total_rooms || 0}</div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Users className="h-4 w-4 text-emerald-500" />
            الغرف المشغولة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-500">
              {summary?.occupied_rooms || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Sparkles className="h-4 w-4 text-sky-500" />
            نسبة الإشغال (Occupancy)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-sky-500">
              {summary?.occupancy_rate_percent || 0}%
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Clock className="h-4 w-4 text-amber-500" />
            غرف بحاجة للنظافة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.dirty_rooms || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <DollarSign className="h-4 w-4 text-teal-500" />
            متوسط السعر اليومي (ADR)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-teal-500">
              {(summary?.average_daily_rate_adr || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Moon className="h-4 w-4 text-indigo-500" />
            عائد الغرفة المتاحة (RevPAR)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-indigo-500">
              {(summary?.revenue_per_available_room_revpar || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "rooms" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("rooms")}
            className="gap-2"
          >
            <Bed className="h-4 w-4" />
            مصفوفة حالة الغرف
          </Button>
          <Button
            variant={activeTab === "reservations" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("reservations")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            الحجوزات ومكتب الاستقبال
          </Button>
          <Button
            variant={activeTab === "folio" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("folio")}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            فواتير النزلاء (Folio)
          </Button>
          <Button
            variant={activeTab === "housekeeping" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("housekeeping")}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            الإشراف الداخلي والنظافة
          </Button>
          <Button
            variant={activeTab === "night_audit" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("night_audit")}
            className="gap-2"
          >
            <Moon className="h-4 w-4" />
            التدقيق الليلي والإيرادات
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الغرفة، النزيل، الحجز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Rooms Matrix */}
      {activeTab === "rooms" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isRoomsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                </Card>
              ))
            ) : rooms.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                لا توجد غرف مسجلة حالياً
              </div>
            ) : (
              rooms
                .filter((r) =>
                  r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.floor.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((room) => {
                  const getStatusBadge = () => {
                    switch (room.status) {
                      case "vacant_clean":
                        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">شاغرة ونظيفة</Badge>;
                      case "occupied":
                        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">مشغولة بنزيل</Badge>;
                      case "vacant_dirty":
                        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">بحاجة للتنظيف</Badge>;
                      case "inspected":
                        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40">تم التفتيش</Badge>;
                      default:
                        return <Badge className="bg-red-500/20 text-red-400 border-red-500/40">خارج الخدمة</Badge>;
                    }
                  };

                  return (
                    <Card
                      key={room.id}
                      className={`p-4 border-2 transition-all ${
                        room.status === "occupied"
                          ? "border-blue-500/30 bg-blue-950/10"
                          : room.status === "vacant_dirty"
                          ? "border-amber-500/30 bg-amber-950/10"
                          : "border-border/60 bg-card/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                          غرفة {room.room_number}
                        </span>
                        {getStatusBadge()}
                      </div>

                      <div className="mt-2 text-xs space-y-1 text-muted-foreground">
                        <div className="font-semibold text-foreground">{room.room_type}</div>
                        <div>{room.floor} • {room.bed_type}</div>
                        <div className="font-mono font-bold text-brand">
                          {room.base_rate.toLocaleString()} ج.م / ليلة
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-1">
                        {room.status === "vacant_dirty" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => handleUpdateRoomStatus(room.id, "vacant_clean")}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            تعيين كنظيفة
                          </Button>
                        )}
                        {room.status === "vacant_clean" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => {
                              setNewReservation({ ...newReservation, room_number: room.room_number, room_rate: room.base_rate });
                              setIsNewReservationOpen(true);
                            }}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            حجز فوري
                          </Button>
                        )}
                        {room.status === "occupied" && (
                          <div className="text-[11px] text-muted-foreground w-full text-center py-1">
                            تتم إدارتها من مكتب الاستقبال
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Reservations & Front Desk */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">رقم الحجز</TableHead>
                  <TableHead className="text-right">النزيل</TableHead>
                  <TableHead className="text-right">الغرفة</TableHead>
                  <TableHead className="text-right">تاريخ الوصول</TableHead>
                  <TableHead className="text-right">تاريخ المغادرة</TableHead>
                  <TableHead className="text-right">الليالي والقيمة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات الاستقبال</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isReservationsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد حجوزات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations
                    .filter((r) =>
                      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.reservation_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.room_number.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="font-mono font-bold text-xs">{res.reservation_ref}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{res.guest_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {res.guest_phone} • جواز: {res.guest_passport}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono font-bold bg-muted">
                            غرفة {res.room_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{res.check_in_date}</TableCell>
                        <TableCell className="text-xs font-mono">{res.check_out_date}</TableCell>
                        <TableCell>
                          <div className="font-mono font-bold text-xs">{res.total_charges.toLocaleString()} ج.م</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {res.nights} ليالي @ {res.room_rate} ج.م
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              res.status === "checked_in"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : res.status === "checked_out"
                                ? "bg-muted text-muted-foreground"
                                : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                            }
                          >
                            {res.status === "checked_in"
                              ? "في الفندق (Checked-In)"
                              : res.status === "checked_out"
                              ? "غادر (Checked-Out)"
                              : "مؤكد مسبقاً"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {res.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
                              onClick={() => handleCheckIn(res.id)}
                            >
                              <LogIn className="h-3.5 w-3.5" />
                              تسكين (Check-In)
                            </Button>
                          )}
                          {res.status === "checked_in" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                              onClick={() => handleCheckOut(res.id)}
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              تسوية ومغادرة (Check-Out)
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

      {/* TAB 3: Folio & Incidentals */}
      {activeTab === "folio" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">الغرفة</TableHead>
                  <TableHead className="text-right">النزيل</TableHead>
                  <TableHead className="text-right">نوع المصروف</TableHead>
                  <TableHead className="text-right">بيان الخدمة</TableHead>
                  <TableHead className="text-right">المبلغ الصافي</TableHead>
                  <TableHead className="text-right">الضريبة</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFolioLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : folioItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد بنود مصروفات مقيدة
                    </TableCell>
                  </TableRow>
                ) : (
                  folioItems
                    .filter((f) =>
                      f.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      f.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      f.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-bold text-xs text-brand">
                          غرفة {item.room_number}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{item.guest_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-muted">
                            {item.charge_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {item.description}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.net_amount.toLocaleString()} ج.م</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.tax_amount.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-emerald-500">
                          {item.total_amount.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.charge_date}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              item.is_settled
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            }
                          >
                            {item.is_settled ? "تمت التسوية" : "قيد الحساب (مفتوح)"}
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

      {/* TAB 4: Housekeeping */}
      {activeTab === "housekeeping" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">الغرفة</TableHead>
                  <TableHead className="text-right">نوع المهمة</TableHead>
                  <TableHead className="text-right">الأولوية</TableHead>
                  <TableHead className="text-right">المسؤول المكلف</TableHead>
                  <TableHead className="text-right">الملاحظات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTasksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد مهام إشراف داخلي حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks
                    .filter((t) =>
                      t.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      t.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono font-bold text-xs text-brand">
                          غرفة {task.room_number}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{task.task_type}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              task.priority === "urgent"
                                ? "bg-red-500/10 text-red-500 border-red-500/30 font-bold"
                                : task.priority === "high"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {task.priority === "urgent" ? "عاجل جداً" : task.priority === "high" ? "أولوية مرتفعة" : "عادي"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{task.assigned_to}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {task.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              task.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                            }
                          >
                            {task.status === "completed" ? "منجز ونظيف" : "قيد التنفيذ"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {task.status !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleCompleteTask(task.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              إتمام المهمة
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

      {/* TAB 5: Night Audit & RevPAR */}
      {activeTab === "night_audit" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">تاريخ التدقيق</TableHead>
                  <TableHead className="text-right">الغرف المشغولة</TableHead>
                  <TableHead className="text-right">نسبة الإشغال</TableHead>
                  <TableHead className="text-right">إيراد الغرف</TableHead>
                  <TableHead className="text-right">إيراد الأغذية والمشروبات F&B</TableHead>
                  <TableHead className="text-right">إجمالي إيراد اليوم</TableHead>
                  <TableHead className="text-right">ADR</TableHead>
                  <TableHead className="text-right">RevPAR</TableHead>
                  <TableHead className="text-right">المحاسب المسؤول</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAuditsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : nightAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات تدقيق ليلي سابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  nightAudits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-mono font-bold text-xs">{audit.audit_date}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {audit.occupied_rooms} / {audit.total_rooms} غرفة
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-sky-500/10 text-sky-500 font-mono font-bold">
                          {audit.occupancy_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{audit.room_revenue.toLocaleString()} ج.م</TableCell>
                      <TableCell className="font-mono text-xs">{audit.fnb_revenue.toLocaleString()} ج.م</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-500">
                        {audit.total_revenue.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-teal-500">
                        {audit.adr.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-indigo-500">
                        {audit.revpar.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{audit.conducted_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* MODAL 1: Create Room */}
      {isNewRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إضافة غرفة جديدة للأسطول الفندقي</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewRoomOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">رقم الغرفة</label>
                  <Input
                    required
                    value={newRoom.room_number}
                    onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الطابق / الدور</label>
                  <Input
                    required
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">تصنيف ونوع الغرفة</label>
                <Input
                  required
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">نوع الأسرة</label>
                  <Input
                    value={newRoom.bed_type}
                    onChange={(e) => setNewRoom({ ...newRoom, bed_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">أقصى نزلاء</label>
                  <Input
                    type="number"
                    value={newRoom.max_guests}
                    onChange={(e) => setNewRoom({ ...newRoom, max_guests: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">السعر لليلة (ج.م)</label>
                  <Input
                    type="number"
                    value={newRoom.base_rate}
                    onChange={(e) => setNewRoom({ ...newRoom, base_rate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">المرافق والتجهيزات</label>
                <Input
                  value={newRoom.amenities}
                  onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewRoomOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إضافة الغرفة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Create Reservation */}
      {isNewReservationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل حجز فندقي جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewReservationOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم النزيل</label>
                  <Input
                    required
                    value={newReservation.guest_name}
                    onChange={(e) => setNewReservation({ ...newReservation, guest_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">هاتف النزيل</label>
                  <Input
                    required
                    value={newReservation.guest_phone}
                    onChange={(e) => setNewReservation({ ...newReservation, guest_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">رقم الجواز / الرقم القومي</label>
                  <Input
                    required
                    value={newReservation.guest_passport}
                    onChange={(e) => setNewReservation({ ...newReservation, guest_passport: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">اختر الغرفة الشاغرة</label>
                  <select
                    required
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newReservation.room_number}
                    onChange={(e) => {
                      const sel = rooms.find((r) => r.room_number === e.target.value);
                      setNewReservation({
                        ...newReservation,
                        room_number: e.target.value,
                        room_rate: sel ? sel.base_rate : 2200,
                        paid_amount: sel ? sel.base_rate * newReservation.nights : 6600,
                      });
                    }}
                  >
                    <option value="">-- حدد الغرفة --</option>
                    {rooms
                      .filter((r) => r.status === "vacant_clean" || r.room_number === newReservation.room_number)
                      .map((r) => (
                        <option key={r.id} value={r.room_number}>
                          غرفة {r.room_number} - {r.room_type} ({r.base_rate.toLocaleString()} ج.م)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">تاريخ الوصول</label>
                  <Input
                    type="date"
                    value={newReservation.check_in_date}
                    onChange={(e) => setNewReservation({ ...newReservation, check_in_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ المغادرة</label>
                  <Input
                    type="date"
                    value={newReservation.check_out_date}
                    onChange={(e) => setNewReservation({ ...newReservation, check_out_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">عدد الليالي</label>
                  <Input
                    type="number"
                    min={1}
                    value={newReservation.nights}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setNewReservation({
                        ...newReservation,
                        nights: n,
                        paid_amount: n * newReservation.room_rate,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">سعر الليلة (ج.م)</label>
                  <Input
                    type="number"
                    value={newReservation.room_rate}
                    onChange={(e) => setNewReservation({ ...newReservation, room_rate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">المبلغ المدفوع مقدماً (ج.م)</label>
                  <Input
                    type="number"
                    value={newReservation.paid_amount}
                    onChange={(e) => setNewReservation({ ...newReservation, paid_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تأكيد الحجز</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Create Folio Item */}
      {isNewFolioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">قيد مصروف على حساب النزيل (Room Folio)</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewFolioOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateFolioItem} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اختر النزيل والغرفة</label>
                <select
                  required
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={newFolio.reservation_id}
                  onChange={(e) => {
                    const res = reservations.find((r) => r.id === e.target.value);
                    setNewFolio({
                      ...newFolio,
                      reservation_id: e.target.value,
                      guest_name: res ? res.guest_name : "",
                      room_number: res ? res.room_number : "",
                    });
                  }}
                >
                  <option value="">-- حدد النزيل المقيم --</option>
                  {reservations
                    .filter((r) => r.status === "checked_in")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        غرفة {r.room_number} - {r.guest_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">تصنيف الخدمة</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newFolio.charge_type}
                    onChange={(e) => setNewFolio({ ...newFolio, charge_type: e.target.value })}
                  >
                    <option value="مطعم وكافيه">مطعم وكافيه (F&B)</option>
                    <option value="ميني بار">ميني بار (Minibar)</option>
                    <option value="مغسلة">خدمات مغسلة ودراي كلين</option>
                    <option value="خدمات سبا">سبا ومساج</option>
                    <option value="خدمات أخرى">خدمات نقل وسياحة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">المبلغ الصافي (ج.م)</label>
                  <Input
                    type="number"
                    value={newFolio.net_amount}
                    onChange={(e) => {
                      const net = Number(e.target.value);
                      setNewFolio({
                        ...newFolio,
                        net_amount: net,
                        tax_amount: Math.round(net * 0.14),
                      });
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">بيان الخدمة بالتفصيل</label>
                <Input
                  required
                  value={newFolio.description}
                  onChange={(e) => setNewFolio({ ...newFolio, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewFolioOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">ترحيل للغرفة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: Create Housekeeping Task */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تكليف مهمة إشراف داخلي ونظافة</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewTaskOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اختر الغرفة</label>
                  <select
                    required
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newTask.room_number}
                    onChange={(e) => setNewTask({ ...newTask, room_number: e.target.value })}
                  >
                    <option value="">-- حدد الغرفة --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.room_number}>
                        غرفة {r.room_number} ({r.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">نوع المهمة</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newTask.task_type}
                    onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                  >
                    <option value="تنظيف يومي (Stayover)">تنظيف يومي (Stayover)</option>
                    <option value="تنظيف مغادرة (Checkout Clean)">تنظيف مغادرة (Checkout Clean)</option>
                    <option value="تنظيف عميق (Deep Clean)">تنظيف عميق (Deep Clean)</option>
                    <option value="تفتيش جودة (Inspection)">تفتيش جودة (Inspection)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الأولوية</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="normal">عادي</option>
                    <option value="high">مرتفعة</option>
                    <option value="urgent">عاجل جداً</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">المسؤول المكلف</label>
                  <Input
                    required
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">ملاحظات وتوجيهات خاصة</label>
                <Input
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewTaskOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إرسال التكليف</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
