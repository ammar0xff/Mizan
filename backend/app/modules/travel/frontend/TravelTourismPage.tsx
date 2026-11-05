import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Compass,
  FileCheck,
  FileText,
  Globe,
  Hotel,
  MapPin,
  Plane,
  Plus,
  Search,
  Ticket,
  UserCheck,
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

interface TravelSummary {
  active_packages_count: number;
  total_bookings_count: number;
  total_passengers_count: number;
  gross_booking_value: number;
  collected_revenue: number;
  pending_visas_count: number;
}

interface TravelPackage {
  id: string;
  package_code: string;
  package_name: string;
  destination_country: string;
  destination_city: string;
  duration_days: number;
  duration_nights: number;
  base_cost: number;
  selling_price: number;
  max_seats: number;
  booked_seats: number;
  inclusions: string;
  day_by_day_plan: string;
  status: "active" | "sold_out" | "draft";
}

interface TravelBooking {
  id: string;
  booking_ref: string;
  package_id: string;
  package_name: string;
  customer_name: string;
  customer_phone: string;
  num_passengers: number;
  departure_date: string;
  return_date: string;
  flight_pnr: string;
  hotel_name: string;
  total_amount: number;
  paid_amount: number;
  payment_status: "paid" | "partial" | "pending";
  booking_status: "confirmed" | "ticketed" | "cancelled";
}

interface TravelPassenger {
  id: string;
  booking_id: string;
  booking_ref: string;
  full_name: string;
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  passport_expiry: string;
  room_type: string;
  dietary_notes: string;
  visa_status: "issued" | "pending" | "not_required";
}

interface TravelVisa {
  id: string;
  traveler_name: string;
  passport_number: string;
  destination_country: string;
  visa_category: string;
  submission_date: string;
  approval_date: string;
  passport_expiry_date: string;
  status: "submitted" | "under_review" | "approved" | "rejected";
  notes: string;
}

export default function TravelTourismPage() {
  const [activeTab, setActiveTab] = useState<"packages" | "bookings" | "passengers" | "visas">("packages");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewPackageOpen, setIsNewPackageOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isNewPassengerOpen, setIsNewPassengerOpen] = useState(false);
  const [isNewVisaOpen, setIsNewVisaOpen] = useState(false);
  const [selectedPlanPackage, setSelectedPlanPackage] = useState<TravelPackage | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<TravelSummary>({
    queryKey: ["travelSummary"],
    queryFn: () => api.get<TravelSummary>("/travel/summary"),
  });

  const { data: packages = [], isLoading: isPackagesLoading } = useQuery<TravelPackage[]>({
    queryKey: ["travelPackages"],
    queryFn: () => api.get<TravelPackage[]>("/travel/packages"),
  });

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<TravelBooking[]>({
    queryKey: ["travelBookings"],
    queryFn: () => api.get<TravelBooking[]>("/travel/bookings"),
  });

  const { data: passengers = [], isLoading: isPassengersLoading } = useQuery<TravelPassenger[]>({
    queryKey: ["travelPassengers"],
    queryFn: () => api.get<TravelPassenger[]>("/travel/passengers"),
  });

  const { data: visas = [], isLoading: isVisasLoading } = useQuery<TravelVisa[]>({
    queryKey: ["travelVisas"],
    queryFn: () => api.get<TravelVisa[]>("/travel/visas"),
  });

  // Package Form State
  const [newPackage, setNewPackage] = useState({
    package_code: "PKG-DXB-2026",
    package_name: "مغامرات دبي الفاخرة وسفاري الصحراء",
    destination_country: "الإمارات",
    destination_city: "دبي وأبو ظبي",
    duration_days: 6,
    duration_nights: 5,
    base_cost: 28000,
    selling_price: 39500,
    max_seats: 20,
    inclusions: "طيران مباشر + إقامة بفندق أتلانتس + جولة برج خليفة وسفاري صحراوي",
    day_by_day_plan: "اليوم 1: الوصول والاستقبال - اليوم 2: جولة المدينة وبرج خليفة - اليوم 3: رحلة سفاري صحراوي وعشاء بدوي - اليوم 4: جزيرة ياس وعالم فيراري - اليوم 5: تسوق حر بمول دبي - اليوم 6: المغادرة.",
  });

  // Booking Form State
  const [newBooking, setNewBooking] = useState({
    package_id: "",
    customer_name: "",
    customer_phone: "",
    num_passengers: 1,
    departure_date: "2026-11-15",
    return_date: "2026-11-22",
    hotel_name: "فندق شيراتون",
    total_amount: 39500,
    paid_amount: 39500,
  });

  // Passenger Form State
  const [newPassenger, setNewPassenger] = useState({
    booking_id: "",
    booking_ref: "",
    full_name: "",
    passport_number: "",
    nationality: "مصري",
    date_of_birth: "1990-05-15",
    passport_expiry: "2031-10-20",
    room_type: "مزدوجة",
    dietary_notes: "وجبة حلال عادية",
  });

  // Visa Form State
  const [newVisa, setNewVisa] = useState({
    traveler_name: "",
    passport_number: "",
    destination_country: "المملكة العربية السعودية",
    visa_category: "تأشيرة سياحة إلكترونية eVisa",
    submission_date: new Date().toISOString().split("T")[0],
    passport_expiry_date: "2032-01-01",
    notes: "طلب مستعجل للرحيل الأسبوع القادم",
  });

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/travel/packages", newPackage);
      queryClient.invalidateQueries({ queryKey: ["travelPackages"] });
      queryClient.invalidateQueries({ queryKey: ["travelSummary"] });
      setIsNewPackageOpen(false);
      toast("success", "تم إنشاء البرنامج السياحي بنجاح");
    } catch {
      toast("error", "تعذر حفظ البرنامج السياحي");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/travel/bookings", newBooking);
      queryClient.invalidateQueries({ queryKey: ["travelBookings"] });
      queryClient.invalidateQueries({ queryKey: ["travelPackages"] });
      queryClient.invalidateQueries({ queryKey: ["travelSummary"] });
      setIsNewBookingOpen(false);
      toast("success", "تم إصدار وتأكيد الحجز السياحي بنجاح");
    } catch {
      toast("error", "تعذر تسجيل الحجز");
    }
  };

  const handleTicketBooking = async (bookingId: string) => {
    sound.click();
    try {
      await api.post(`/travel/bookings/${bookingId}/ticket`);
      queryClient.invalidateQueries({ queryKey: ["travelBookings"] });
      toast("success", "تم إصدار تذاكر الطيران وقسائم الفنادق بنجاح");
    } catch {
      toast("error", "تعذر إصدار التذاكر");
    }
  };

  const handleCreatePassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/travel/passengers", newPassenger);
      queryClient.invalidateQueries({ queryKey: ["travelPassengers"] });
      queryClient.invalidateQueries({ queryKey: ["travelSummary"] });
      setIsNewPassengerOpen(false);
      toast("success", "تم إضافة بيانات المسافر إلى المانيفست");
    } catch {
      toast("error", "تعذر تسجيل المسافر");
    }
  };

  const handleCreateVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/travel/visas", newVisa);
      queryClient.invalidateQueries({ queryKey: ["travelVisas"] });
      queryClient.invalidateQueries({ queryKey: ["travelSummary"] });
      setIsNewVisaOpen(false);
      toast("success", "تم تسجيل طلب التأشيرة بنجاح");
    } catch {
      toast("error", "تعذر تسجيل التأشيرة");
    }
  };

  const handleApproveVisa = async (visaId: string) => {
    sound.click();
    try {
      await api.post(`/travel/visas/${visaId}/approve`);
      queryClient.invalidateQueries({ queryKey: ["travelVisas"] });
      queryClient.invalidateQueries({ queryKey: ["travelSummary"] });
      toast("success", "تم اعتماد وإصدار التأشيرة بنجاح");
    } catch {
      toast("error", "تعذر اعتماد التأشيرة");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="h-7 w-7 text-brand" />
            وكالة السياحة والسفر وتنظيم الرحلات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة البرامج والرحلات الشاملة، حجوزات الطيران والفنادق، قوائم المسافرين وخزينة التأشيرات
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "packages" && (
            <Button onClick={() => setIsNewPackageOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء برنامج سياحي
            </Button>
          )}
          {activeTab === "bookings" && (
            <Button onClick={() => setIsNewBookingOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              حجز رحلة جديد
            </Button>
          )}
          {activeTab === "passengers" && (
            <Button onClick={() => setIsNewPassengerOpen(true)} className="gap-2">
              <UserCheck className="h-4 w-4" />
              تسجيل مسافر في القائمة
            </Button>
          )}
          {activeTab === "visas" && (
            <Button onClick={() => setIsNewVisaOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              طلب تأشيرة جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Globe className="h-4 w-4 text-brand" />
            البرامج النشطة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold">{summary?.active_packages_count || 0}</div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Ticket className="h-4 w-4 text-emerald-500" />
            إجمالي الحجوزات
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-500">
              {summary?.total_bookings_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Plane className="h-4 w-4 text-sky-500" />
            قيمة الحجوزات الإجمالية
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-sky-500">
              {(summary?.gross_booking_value || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
            الإيرادات المحصلة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-teal-500">
              {(summary?.collected_revenue || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Users className="h-4 w-4 text-violet-500" />
            المسافرون المسجلون
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-violet-500">
              {summary?.total_passengers_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <FileCheck className="h-4 w-4 text-amber-500" />
            تأشيرات قيد المعالجة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.pending_visas_count || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "packages" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("packages")}
            className="gap-2"
          >
            <Compass className="h-4 w-4" />
            برامج الرحلات والأفواج
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("bookings")}
            className="gap-2"
          >
            <Ticket className="h-4 w-4" />
            حجوزات التذاكر والفنادق
          </Button>
          <Button
            variant={activeTab === "passengers" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("passengers")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            مانيفست الركاب وتسكين الغرف
          </Button>
          <Button
            variant={activeTab === "visas" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("visas")}
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            خزينة الجوازات والتأشيرات
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود، الوجهة، الاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Packages */}
      {activeTab === "packages" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">كود البرنامج</TableHead>
                  <TableHead className="text-right">اسم البرنامج والوجهة</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">المقاعد والحجوزات</TableHead>
                  <TableHead className="text-right">سعر البيع / الفرد</TableHead>
                  <TableHead className="text-right">المشتملات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">خطة الأيام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPackagesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد برامج سياحية مسجلة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  packages
                    .filter((p) =>
                      p.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.destination_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.package_code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((pkg) => {
                      const occupancyPct = Math.round((pkg.booked_seats / pkg.max_seats) * 100);
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-mono font-bold text-xs">{pkg.package_code}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{pkg.package_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-brand" />
                              {pkg.destination_city}، {pkg.destination_country}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {pkg.duration_days} أيام / {pkg.duration_nights} ليالي
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono font-bold">
                              {pkg.booked_seats} / {pkg.max_seats} مقعد ({occupancyPct}%)
                            </div>
                            <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${occupancyPct >= 90 ? "bg-red-500" : "bg-brand"}`}
                                style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-sm text-brand">
                            {pkg.selling_price.toLocaleString()} ج.م
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                            {pkg.inclusions}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                pkg.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                  : "bg-red-500/10 text-red-500 border-red-500/30"
                              }
                            >
                              {pkg.status === "active" ? "متاح للحجز" : "مكتمل العدد"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => setSelectedPlanPackage(pkg)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              عرض المسار
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

      {/* TAB 2: Bookings */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">رقم الحجز</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">البرنامج السياحي</TableHead>
                  <TableHead className="text-right">الركاب</TableHead>
                  <TableHead className="text-right">تواريخ الرحلة</TableHead>
                  <TableHead className="text-right">PNR الطيران والفندق</TableHead>
                  <TableHead className="text-right">القيمة والتحصيل</TableHead>
                  <TableHead className="text-right">حالة الحجز</TableHead>
                  <TableHead className="text-center">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBookingsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد حجوزات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings
                    .filter((b) =>
                      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.flight_pnr.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((bk) => (
                      <TableRow key={bk.id}>
                        <TableCell className="font-mono font-bold text-xs">{bk.booking_ref}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{bk.customer_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{bk.customer_phone}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium max-w-xs truncate">{bk.package_name}</TableCell>
                        <TableCell className="font-mono text-center font-bold text-xs">{bk.num_passengers}</TableCell>
                        <TableCell className="text-xs font-mono">
                          <div>من: {bk.departure_date}</div>
                          <div className="text-muted-foreground">إلى: {bk.return_date}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono font-bold flex items-center gap-1 text-sky-500">
                            <Plane className="h-3 w-3" />
                            {bk.flight_pnr}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Hotel className="h-3 w-3" />
                            {bk.hotel_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-bold text-xs">{bk.total_amount.toLocaleString()} ج.م</div>
                          <Badge
                            variant="outline"
                            className={
                              bk.payment_status === "paid"
                                ? "bg-emerald-500/10 text-emerald-500 text-[10px]"
                                : bk.payment_status === "partial"
                                ? "bg-amber-500/10 text-amber-500 text-[10px]"
                                : "bg-red-500/10 text-red-500 text-[10px]"
                            }
                          >
                            {bk.payment_status === "paid" ? "مسدد بالكامل" : bk.payment_status === "partial" ? "مسدد جزئياً" : "معلق"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              bk.booking_status === "ticketed"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                            }
                          >
                            {bk.booking_status === "ticketed" ? "تم إصدار التذاكر" : "مؤكد / غير مصدر"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {bk.booking_status !== "ticketed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleTicketBooking(bk.id)}
                            >
                              <Ticket className="h-3.5 w-3.5" />
                              إصدار التذاكر
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

      {/* TAB 3: Passengers Manifest */}
      {activeTab === "passengers" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">رقم الحجز</TableHead>
                  <TableHead className="text-right">اسم المسافر الكامل</TableHead>
                  <TableHead className="text-right">رقم الجواز</TableHead>
                  <TableHead className="text-right">الجنسية والميلاد</TableHead>
                  <TableHead className="text-right">صلاحية الجواز</TableHead>
                  <TableHead className="text-right">تسكين الغرفة</TableHead>
                  <TableHead className="text-right">الوجبات والملاحظات</TableHead>
                  <TableHead className="text-right">حالة التأشيرة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPassengersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : passengers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا يوجد مسافرون مسجلون في القائمة
                    </TableCell>
                  </TableRow>
                ) : (
                  passengers
                    .filter((p) =>
                      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.passport_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.booking_ref.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((pax) => (
                      <TableRow key={pax.id}>
                        <TableCell className="font-mono text-xs font-bold text-brand">{pax.booking_ref}</TableCell>
                        <TableCell className="font-semibold text-sm">{pax.full_name}</TableCell>
                        <TableCell className="font-mono font-bold text-xs">{pax.passport_number}</TableCell>
                        <TableCell className="text-xs">
                          <div>{pax.nationality}</div>
                          <div className="text-muted-foreground font-mono">{pax.date_of_birth}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{pax.passport_expiry}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted text-xs">
                            غرفة {pax.room_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{pax.dietary_notes}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              pax.visa_status === "issued"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            }
                          >
                            {pax.visa_status === "issued" ? "صادرة ومكتملة" : "قيد الإصدار"}
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

      {/* TAB 4: Visas Vault */}
      {activeTab === "visas" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم المسافر</TableHead>
                  <TableHead className="text-right">رقم الجواز والصلاحية</TableHead>
                  <TableHead className="text-right">الدولة المستهدفة</TableHead>
                  <TableHead className="text-right">نوع التأشيرة</TableHead>
                  <TableHead className="text-right">تاريخ التقديم</TableHead>
                  <TableHead className="text-right">ملاحظات السفارة</TableHead>
                  <TableHead className="text-right">حالة الطلب</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isVisasLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : visas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      خزينة التأشيرات خالية حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  visas
                    .filter((v) =>
                      v.traveler_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.passport_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.destination_country.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((visa) => (
                      <TableRow key={visa.id}>
                        <TableCell className="font-semibold text-sm">{visa.traveler_name}</TableCell>
                        <TableCell>
                          <div className="font-mono font-bold text-xs">{visa.passport_number}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            تنتهي: {visa.passport_expiry_date}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{visa.destination_country}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{visa.visa_category}</TableCell>
                        <TableCell className="text-xs font-mono">{visa.submission_date}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{visa.notes || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              visa.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : visa.status === "rejected"
                                ? "bg-red-500/10 text-red-500 border-red-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            }
                          >
                            {visa.status === "approved" ? "معتمدة ومصدرة" : visa.status === "rejected" ? "مرفوضة" : "قيد المراجعة في القنصلية"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {visa.status !== "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleApproveVisa(visa.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              تسجيل الموافقة
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

      {/* MODAL 1: Day by Day Plan Viewer */}
      {selectedPlanPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold">{selectedPlanPackage.package_name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedPlanPackage.package_code} • {selectedPlanPackage.destination_city}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPlanPackage(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <span className="font-bold text-brand">المشتملات والخدمات المرفقة:</span>
                <p className="text-muted-foreground">{selectedPlanPackage.inclusions}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold">تفاصيل خطة الرحلة يوماً بيوم:</span>
                <div className="p-4 bg-card border rounded-lg text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                  {selectedPlanPackage.day_by_day_plan}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedPlanPackage(null)}>إغلاق</Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 2: Create Package */}
      {isNewPackageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء برنامج سياحي / فوج جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewPackageOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">كود البرنامج</label>
                  <Input
                    required
                    value={newPackage.package_code}
                    onChange={(e) => setNewPackage({ ...newPackage, package_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">اسم البرنامج</label>
                  <Input
                    required
                    value={newPackage.package_name}
                    onChange={(e) => setNewPackage({ ...newPackage, package_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الدولة المستهدفة</label>
                  <Input
                    required
                    value={newPackage.destination_country}
                    onChange={(e) => setNewPackage({ ...newPackage, destination_country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">المدينة والوجهة</label>
                  <Input
                    required
                    value={newPackage.destination_city}
                    onChange={(e) => setNewPackage({ ...newPackage, destination_city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">الأيام</label>
                  <Input
                    type="number"
                    value={newPackage.duration_days}
                    onChange={(e) => setNewPackage({ ...newPackage, duration_days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الليالي</label>
                  <Input
                    type="number"
                    value={newPackage.duration_nights}
                    onChange={(e) => setNewPackage({ ...newPackage, duration_nights: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">سعة المقاعد</label>
                  <Input
                    type="number"
                    value={newPackage.max_seats}
                    onChange={(e) => setNewPackage({ ...newPackage, max_seats: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">تكلفة البرنامج الأساسية (ج.م)</label>
                  <Input
                    type="number"
                    value={newPackage.base_cost}
                    onChange={(e) => setNewPackage({ ...newPackage, base_cost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">سعر البيع المقترح للفرد (ج.م)</label>
                  <Input
                    type="number"
                    value={newPackage.selling_price}
                    onChange={(e) => setNewPackage({ ...newPackage, selling_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">المشتملات والخدمات المرفقة</label>
                <Input
                  value={newPackage.inclusions}
                  onChange={(e) => setNewPackage({ ...newPackage, inclusions: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">خطة الرحلة يوماً بيوم (Itinerary)</label>
                <textarea
                  className="w-full h-24 p-2 text-xs border rounded bg-background"
                  value={newPackage.day_by_day_plan}
                  onChange={(e) => setNewPackage({ ...newPackage, day_by_day_plan: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewPackageOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ وإتاحة البرنامج</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Create Booking */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل حجز رحلة سياحية</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewBookingOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اختر البرنامج السياحي</label>
                <select
                  required
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={newBooking.package_id}
                  onChange={(e) => {
                    const sel = packages.find((p) => p.id === e.target.value);
                    setNewBooking({
                      ...newBooking,
                      package_id: e.target.value,
                      total_amount: sel ? sel.selling_price * newBooking.num_passengers : 0,
                      paid_amount: sel ? sel.selling_price * newBooking.num_passengers : 0,
                    });
                  }}
                >
                  <option value="">-- حدد البرنامج --</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.package_name} ({p.selling_price.toLocaleString()} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم العميل الرئيسي</label>
                  <Input
                    required
                    value={newBooking.customer_name}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">هاتف العميل</label>
                  <Input
                    required
                    value={newBooking.customer_phone}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">عدد المسافرين</label>
                  <Input
                    type="number"
                    min={1}
                    value={newBooking.num_passengers}
                    onChange={(e) => setNewBooking({ ...newBooking, num_passengers: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ السفر</label>
                  <Input
                    type="date"
                    value={newBooking.departure_date}
                    onChange={(e) => setNewBooking({ ...newBooking, departure_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ العودة</label>
                  <Input
                    type="date"
                    value={newBooking.return_date}
                    onChange={(e) => setNewBooking({ ...newBooking, return_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">فندق الإقامة</label>
                <Input
                  value={newBooking.hotel_name}
                  onChange={(e) => setNewBooking({ ...newBooking, hotel_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الإجمالي (ج.م)</label>
                  <Input
                    type="number"
                    value={newBooking.total_amount}
                    onChange={(e) => setNewBooking({ ...newBooking, total_amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">المبلغ المدفوع (ج.م)</label>
                  <Input
                    type="number"
                    value={newBooking.paid_amount}
                    onChange={(e) => setNewBooking({ ...newBooking, paid_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewBookingOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تأكيد الحجز</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: Create Passenger */}
      {isNewPassengerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل مسافر في قائمة المانيفست</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewPassengerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePassenger} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اختر الحجز التابع له</label>
                <select
                  required
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={newPassenger.booking_id}
                  onChange={(e) => {
                    const bk = bookings.find((b) => b.id === e.target.value);
                    setNewPassenger({
                      ...newPassenger,
                      booking_id: e.target.value,
                      booking_ref: bk ? bk.booking_ref : "",
                    });
                  }}
                >
                  <option value="">-- حدد الحجز --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_ref} - {b.customer_name} ({b.package_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم المسافر كما بالجواز</label>
                  <Input
                    required
                    value={newPassenger.full_name}
                    onChange={(e) => setNewPassenger({ ...newPassenger, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">رقم جواز السفر</label>
                  <Input
                    required
                    value={newPassenger.passport_number}
                    onChange={(e) => setNewPassenger({ ...newPassenger, passport_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">الجنسية</label>
                  <Input
                    value={newPassenger.nationality}
                    onChange={(e) => setNewPassenger({ ...newPassenger, nationality: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ الميلاد</label>
                  <Input
                    type="date"
                    value={newPassenger.date_of_birth}
                    onChange={(e) => setNewPassenger({ ...newPassenger, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">صلاحية الجواز</label>
                  <Input
                    type="date"
                    value={newPassenger.passport_expiry}
                    onChange={(e) => setNewPassenger({ ...newPassenger, passport_expiry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">نوع الغرفة</label>
                  <select
                    className="w-full p-2 border rounded text-xs bg-background"
                    value={newPassenger.room_type}
                    onChange={(e) => setNewPassenger({ ...newPassenger, room_type: e.target.value })}
                  >
                    <option value="مزدوجة">مزدوجة (Double)</option>
                    <option value="مفردة">مفردة (Single)</option>
                    <option value="ثلاثية">ثلاثية (Triple)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">ملاحظات الوجبات الخاصة</label>
                  <Input
                    value={newPassenger.dietary_notes}
                    onChange={(e) => setNewPassenger({ ...newPassenger, dietary_notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewPassengerOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إضافة للمانيفست</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 5: Create Visa Application */}
      {isNewVisaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل طلب تأشيرة جديد في الخزينة</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewVisaOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateVisa} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم المسافر</label>
                  <Input
                    required
                    value={newVisa.traveler_name}
                    onChange={(e) => setNewVisa({ ...newVisa, traveler_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">رقم الجواز</label>
                  <Input
                    required
                    value={newVisa.passport_number}
                    onChange={(e) => setNewVisa({ ...newVisa, passport_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الدولة المستهدفة</label>
                  <Input
                    required
                    value={newVisa.destination_country}
                    onChange={(e) => setNewVisa({ ...newVisa, destination_country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">نوع التأشيرة</label>
                  <Input
                    required
                    value={newVisa.visa_category}
                    onChange={(e) => setNewVisa({ ...newVisa, visa_category: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">تاريخ التقديم</label>
                  <Input
                    type="date"
                    value={newVisa.submission_date}
                    onChange={(e) => setNewVisa({ ...newVisa, submission_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ انتهاء الجواز</label>
                  <Input
                    type="date"
                    value={newVisa.passport_expiry_date}
                    onChange={(e) => setNewVisa({ ...newVisa, passport_expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">ملاحظات السفارة</label>
                <Input
                  value={newVisa.notes}
                  onChange={(e) => setNewVisa({ ...newVisa, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewVisaOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إرسال الطلب</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
