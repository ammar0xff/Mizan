import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Gamepad2,
  PartyPopper,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Store,
  Ticket,
  UtensilsCrossed,
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

interface EntSummary {
  total_active_events_count: number;
  total_tickets_sold_count: number;
  total_box_office_revenue_egp: number;
  active_gaming_cards_count: number;
  total_concessions_revenue_egp: number;
  turnstile_scanned_entries_count: number;
}

interface EntEvent {
  id: string;
  event_code: string;
  title: string;
  category: string;
  venue_name: string;
  session_start: string;
  total_capacity: number;
  sold_tickets_count: number;
  status: string;
  created_at?: string;
}

interface EntTicket {
  id: string;
  session_id: string;
  event_title: string;
  venue_name: string;
  ticket_barcode: string;
  seat_tier: string;
  seat_number: string;
  price_egp: number;
  customer_name: string;
  scanned_at_turnstile: boolean;
  scan_timestamp?: string;
  status: string;
}

interface EntGamingCard {
  id: string;
  rfid_tag: string;
  holder_name: string;
  credits_balance_egp: number;
  bonus_tickets_count: number;
  loyalty_tier: string;
  last_tap_attraction: string;
  status: string;
  created_at?: string;
}

interface EntConcession {
  id: string;
  order_ref: string;
  counter_station: string;
  combo_summary: string;
  total_amount_egp: number;
  payment_method: string;
  cashier_name: string;
  status: string;
  created_at?: string;
}

export default function EntertainmentPage() {
  const [activeTab, setActiveTab] = useState<
    "events" | "tickets" | "cards" | "concessions"
  >("events");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
    event_code: "",
    title: "",
    category: "concert",
    venue_name: "",
    session_start: new Date(Date.now() + 48 * 3600 * 1000)
      .toISOString()
      .slice(0, 16),
    total_capacity: 1500,
    sold_tickets_count: 0,
    status: "scheduled",
  });

  const [ticketForm, setTicketForm] = useState({
    session_id: "",
    ticket_barcode: "",
    seat_tier: "vip_platinum",
    seat_number: "A-12",
    price_egp: 1500,
    customer_name: "",
  });

  const [cardForm, setCardForm] = useState({
    rfid_tag: "",
    holder_name: "",
    credits_balance_egp: 500,
    bonus_tickets_count: 120,
    loyalty_tier: "gold",
    last_tap_attraction: "قطار الموت السريع (Hyper Coaster)",
    status: "active",
  });

  const [concessionForm, setConcessionForm] = useState({
    order_ref: "",
    counter_station: "منفذ المسرح الرئيسي - Counter 1",
    combo_summary: "فشار عائلي بالجبنة + 2 كولا كبير + ناتشوز هالبينو",
    total_amount_egp: 350,
    payment_method: "contactless_pos",
    cashier_name: "أمير سمير",
    status: "completed",
  });

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<EntSummary>({
    queryKey: ["ent-summary"],
    queryFn: () => api.get<EntSummary>("/ent/summary"),
  });

  const {
    data: events = [],
    isLoading: isEventsLoading,
    refetch: refetchEvents,
  } = useQuery<EntEvent[]>({
    queryKey: ["ent-events"],
    queryFn: () => api.get<EntEvent[]>("/ent/events"),
  });

  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = useQuery<EntTicket[]>({
    queryKey: ["ent-tickets"],
    queryFn: () => api.get<EntTicket[]>("/ent/tickets"),
  });

  const {
    data: cards = [],
    isLoading: isCardsLoading,
    refetch: refetchCards,
  } = useQuery<EntGamingCard[]>({
    queryKey: ["ent-cards"],
    queryFn: () => api.get<EntGamingCard[]>("/ent/gaming-cards"),
  });

  const {
    data: concessions = [],
    isLoading: isConcessionsLoading,
    refetch: refetchConcessions,
  } = useQuery<EntConcession[]>({
    queryKey: ["ent-concessions"],
    queryFn: () => api.get<EntConcession[]>("/ent/concessions"),
  });

  const handleRefresh = () => {
    sound.click();
    refetchSummary();
    refetchEvents();
    refetchTickets();
    refetchCards();
    refetchConcessions();
    toast("success", "تم تحديث بيانات الترفيه والفعاليات");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ent/events", eventForm);
      toast("success", "تم جدولة الفعالية بنجاح");
      setIsEventModalOpen(false);
      refetchEvents();
      refetchSummary();
      setEventForm({
        event_code: "",
        title: "",
        category: "concert",
        venue_name: "",
        session_start: new Date(Date.now() + 48 * 3600 * 1000)
          .toISOString()
          .slice(0, 16),
        total_capacity: 1500,
        sold_tickets_count: 0,
        status: "scheduled",
      });
    } catch {
      toast("error", "فشل جدولة الفعالية");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ent/tickets", ticketForm);
      toast("success", "تم إصدار وحجز التذكرة بنجاح");
      setIsTicketModalOpen(false);
      refetchTickets();
      refetchEvents();
      refetchSummary();
      setTicketForm({
        session_id: "",
        ticket_barcode: "",
        seat_tier: "vip_platinum",
        seat_number: "A-12",
        price_egp: 1500,
        customer_name: "",
      });
    } catch {
      toast("error", "فشل إصدار التذكرة");
    }
  };

  const handleScanTicket = async (ticketId: string) => {
    sound.click();
    try {
      await api.post(`/ent/tickets/${ticketId}/scan`, {
        turnstile_gate: "البوابة الرئيسية A - بوابة إلكترونية 01",
      });
      toast("success", "تم مسح التذكرة وسماح البوابة بالمرور (Access Granted)");
      refetchTickets();
      refetchSummary();
    } catch {
      toast("error", "فشل المسح: التذكرة مستخدمة مسبقاً أو غير صالحة!");
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ent/gaming-cards", cardForm);
      toast("success", "تم إصدار وشحن بطاقة الألعاب بنجاح");
      setIsCardModalOpen(false);
      refetchCards();
      refetchSummary();
      setCardForm({
        rfid_tag: "",
        holder_name: "",
        credits_balance_egp: 500,
        bonus_tickets_count: 120,
        loyalty_tier: "gold",
        last_tap_attraction: "قطار الموت السريع (Hyper Coaster)",
        status: "active",
      });
    } catch {
      toast("error", "فشل إصدار بطاقة الألعاب");
    }
  };

  const handleCreateConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ent/concessions", concessionForm);
      toast("success", "تم تسجيل طلب الضيافة والمأكولات بنجاح");
      setIsConcessionModalOpen(false);
      refetchConcessions();
      refetchSummary();
      setConcessionForm({
        order_ref: "",
        counter_station: "منفذ المسرح الرئيسي - Counter 1",
        combo_summary: "فشار عائلي بالجبنة + 2 كولا كبير + ناتشوز هالبينو",
        total_amount_egp: 350,
        payment_method: "contactless_pos",
        cashier_name: "أمير سمير",
        status: "completed",
      });
    } catch {
      toast("error", "فشل تسجيل طلب الضيافة");
    }
  };

  // Filters
  const filteredEvents = events.filter(
    (e) =>
      e.event_code.toLowerCase().includes(search.toLowerCase()) ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_barcode.includes(search) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.event_title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCards = cards.filter(
    (c) =>
      c.rfid_tag.toLowerCase().includes(search.toLowerCase()) ||
      c.holder_name.toLowerCase().includes(search.toLowerCase()) ||
      c.loyalty_tier.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConcessions = concessions.filter(
    (o) =>
      o.order_ref.toLowerCase().includes(search.toLowerCase()) ||
      o.counter_station.toLowerCase().includes(search.toLowerCase()) ||
      o.cashier_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSeatTier = (tier: string) => {
    switch (tier) {
      case "royal_gold":
        return "المقصورة الملكية (Royal Gold)";
      case "vip_platinum":
        return "بلاتينيوم مميز (VIP Platinum)";
      case "regular":
        return "الدرجة العامة (General Admission)";
      default:
        return tier;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <PartyPopper className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                إدارة الترفيه، الفعاليات والملاهي (Entertainment & Events)
              </h1>
              <p className="text-sm text-muted-foreground">
                تنظيم وجدولة الحفلات، حجز التذاكر ومسح البوابات الإلكترونية، بطاقات الألعاب RFID، ومنافذ الضيافة F&B
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
          {activeTab === "events" && (
            <Button
              onClick={() => {
                sound.click();
                setIsEventModalOpen(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4" />
              جدولة فعالية / عرض جديد
            </Button>
          )}
          {activeTab === "tickets" && (
            <Button
              onClick={() => {
                sound.click();
                if (events.length > 0 && !ticketForm.session_id) {
                  setTicketForm((prev) => ({ ...prev, session_id: events[0].id }));
                }
                setIsTicketModalOpen(true);
              }}
              className="gap-2 bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إصدار تذكرة دخول
            </Button>
          )}
          {activeTab === "cards" && (
            <Button
              onClick={() => {
                sound.click();
                setIsCardModalOpen(true);
              }}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إصدار بطاقة ألعاب RFID
            </Button>
          )}
          {activeTab === "concessions" && (
            <Button
              onClick={() => {
                sound.click();
                setIsConcessionModalOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4" />
              تسجيل طلب ضيافة ومأكولات
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              الفعاليات المجدولة
            </span>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.total_active_events_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            عروض مسرحية ومهرجانات نشطة
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              التذاكر المباعة
            </span>
            <Ticket className="h-5 w-5 text-pink-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.total_tickets_sold_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            تذاكر مقاعد ودخول مؤكدة
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              إيرادات شباك التذاكر
            </span>
            <Zap className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.total_box_office_revenue_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مبيعات التذاكر الإجمالية
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              بطاقات الألعاب التفاعلية
            </span>
            <Gamepad2 className="h-5 w-5 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.active_gaming_cards_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            بطاقات RFID نشطة بالملاهي
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              مبيعات الضيافة (F&B)
            </span>
            <UtensilsCrossed className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.total_concessions_revenue_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مشروبات ووجبات سريعة
          </span>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              sound.click();
              setActiveTab("events");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "events"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            العروض والفعاليات (Events)
            <Badge variant="outline" className="mr-1 text-xs">
              {events.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("tickets");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "tickets"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4" />
            شباك التذاكر والبوابات (Tickets & Turnstiles)
            <Badge variant="outline" className="mr-1 text-xs">
              {tickets.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("cards");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "cards"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            بطاقات ألعاب الملاهي (RFID Cards)
            <Badge variant="outline" className="mr-1 text-xs">
              {cards.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("concessions");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "concessions"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Store className="h-4 w-4" />
            منافذ الأغذية والضيافة (F&B Concessions)
            <Badge variant="outline" className="mr-1 text-xs">
              {concessions.length}
            </Badge>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالفعالية، الباركود، الزائر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Tab 1: Events */}
      {activeTab === "events" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود الفعالية</TableHead>
                <TableHead className="text-right">عنوان الفعالية / العرض</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">القاعة / المسرح</TableHead>
                <TableHead className="text-right">موعد العرض</TableHead>
                <TableHead className="text-right">السعة الاستيعابية</TableHead>
                <TableHead className="text-right">نسبة الإشغال</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEventsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد فعاليات مسجلة تطابق البحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((ev) => {
                  const pct = ev.total_capacity > 0
                    ? Math.round((ev.sold_tickets_count / ev.total_capacity) * 100)
                    : 0;
                  return (
                    <TableRow key={ev.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono font-medium text-purple-400">
                        {ev.event_code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {ev.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                          {ev.category === "concert"
                            ? "حفل موسيقي غنائي"
                            : ev.category === "theater"
                            ? "عرض مسرحي"
                            : ev.category === "circus"
                            ? "سيرك واستعراضات"
                            : ev.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {ev.venue_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {ev.session_start}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {ev.sold_tickets_count} / {ev.total_capacity} مقعد
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-pink-500"
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
                          {ev.status === "scheduled" ? "مؤكد ومتاح للحجز" : ev.status}
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

      {/* Tab 2: Tickets & Turnstiles */}
      {activeTab === "tickets" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">باركود التذكرة</TableHead>
                <TableHead className="text-right">الفعالية المرتبطة</TableHead>
                <TableHead className="text-right">الزائر / الحاجز</TableHead>
                <TableHead className="text-right">فئة المقعد</TableHead>
                <TableHead className="text-right">رقم المقعد</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">حالة البوابة الإلكترونية</TableHead>
                <TableHead className="text-center">إجراء البوابة (Turnstile)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTicketsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد تذاكر صادرة
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-pink-400 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-pink-500" />
                      {t.ticket_barcode}
                    </TableCell>
                    <TableCell className="text-foreground font-medium max-w-xs truncate">
                      {t.event_title}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {t.customer_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                        {formatSeatTier(t.seat_tier)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {t.seat_number}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {t.price_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      {t.scanned_at_turnstile ? (
                        <div className="flex flex-col">
                          <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 w-fit">
                            تم الدخول بنجاح
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {t.scan_timestamp}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                          بانتظار العبور
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {!t.scanned_at_turnstile ? (
                        <Button
                          size="sm"
                          onClick={() => handleScanTicket(t.id)}
                          className="bg-pink-600 hover:bg-pink-700 text-white text-xs gap-1.5 h-8"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          محاكاة مسح البوابة
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          مستخدمة (Anti-Passback)
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 3: Gaming Cards */}
      {activeTab === "cards" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود بطاقة RFID</TableHead>
                <TableHead className="text-right">اسم العميل / حامل البطاقة</TableHead>
                <TableHead className="text-right">فئة العضوية (Tier)</TableHead>
                <TableHead className="text-right">رصيد الألعاب المتبقي</TableHead>
                <TableHead className="text-right">نقاط التذاكر والمكافآت</TableHead>
                <TableHead className="text-right">آخر لعبة تم لمس البطاقة عليها</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCardsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد بطاقات ألعاب مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredCards.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-cyan-400">
                      {c.rfid_tag}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {c.holder_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                        {c.loyalty_tier === "gold" ? "عضوية ذهبية VIP" : "عضوية قياسية"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {c.credits_balance_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-amber-400 font-bold">
                      {c.bonus_tickets_count} تذكرة
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.last_tap_attraction}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {c.status === "active" ? "نشطة وجاهزة للعب" : c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Concessions */}
      {activeTab === "concessions" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم الطلب</TableHead>
                <TableHead className="text-right">منفذ البيع / الكاونتر</TableHead>
                <TableHead className="text-right">تفاصيل الوجبة / المشروبات</TableHead>
                <TableHead className="text-right">إجمالي الفاتورة</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">اسم الكاشير</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isConcessionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredConcessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد فواتير ضيافة مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredConcessions.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-amber-400">
                      {o.order_ref}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {o.counter_station}
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-sm truncate">
                      {o.combo_summary}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {o.total_amount_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.payment_method === "contactless_pos"
                        ? "بطاقة دفع تلامسية"
                        : o.payment_method}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {o.cashier_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {o.status === "completed" ? "مدفوع ومسلم" : o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal: New Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">جدولة فعالية / عرض ترفيهي جديد</h2>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود الفعالية</label>
                  <Input
                    required
                    placeholder="مثال: EVT-2026-SHOW-09"
                    value={eventForm.event_code}
                    onChange={(e) => setEventForm({ ...eventForm, event_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">التصنيف</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="concert">حفل موسيقي غنائي</option>
                    <option value="theater">عرض مسرحي كوميدي</option>
                    <option value="circus">سيرك واستعراضات أكروباتية</option>
                    <option value="gaming_expo">معرض ألعاب فيديو وبطولات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">عنوان الفعالية</label>
                <Input
                  required
                  placeholder="مثال: ليلة الموسيقى العربية الكبرى"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">اسم القاعة / المسرح</label>
                  <Input
                    required
                    placeholder="مثال: المسرح الروماني المكشوف"
                    value={eventForm.venue_name}
                    onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ ووقت العرض</label>
                  <Input
                    type="datetime-local"
                    required
                    value={eventForm.session_start}
                    onChange={(e) => setEventForm({ ...eventForm, session_start: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">السعة الاستيعابية للمقاعد</label>
                <Input
                  type="number"
                  required
                  value={eventForm.total_capacity}
                  onChange={(e) => setEventForm({ ...eventForm, total_capacity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  جدولة وحفظ الفعالية
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Ticket */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">إصدار تذكرة دخول لشباك التذاكر</h2>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">الفعالية والعرض</label>
                <select
                  value={ticketForm.session_id}
                  onChange={(e) => setTicketForm({ ...ticketForm, session_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">اختر الفعالية...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.event_code} - {ev.title} ({ev.venue_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">باركود التذكرة (12 رقم)</label>
                  <Input
                    required
                    placeholder="998877665544"
                    value={ticketForm.ticket_barcode}
                    onChange={(e) => setTicketForm({ ...ticketForm, ticket_barcode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">فئة المقعد</label>
                  <select
                    value={ticketForm.seat_tier}
                    onChange={(e) => setTicketForm({ ...ticketForm, seat_tier: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="royal_gold">المقصورة الملكية (Royal Gold)</option>
                    <option value="vip_platinum">بلاتينيوم مميز (VIP Platinum)</option>
                    <option value="regular">الدرجة العامة (Regular)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم المقعد / الصف</label>
                  <Input
                    required
                    placeholder="مثال: Royal Box 01"
                    value={ticketForm.seat_number}
                    onChange={(e) => setTicketForm({ ...ticketForm, seat_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">سعر التذكرة (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={ticketForm.price_egp}
                    onChange={(e) => setTicketForm({ ...ticketForm, price_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم الزائر / العميل</label>
                <Input
                  required
                  placeholder="الاسم بالكامل"
                  value={ticketForm.customer_name}
                  onChange={(e) => setTicketForm({ ...ticketForm, customer_name: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsTicketModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
                  إصدار وتأكيد التذكرة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Card */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">إصدار وشحن بطاقة ألعاب RFID</h2>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCard} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">معرف الشريحة (RFID Tag)</label>
                  <Input
                    required
                    placeholder="مثال: RFID-CARD-9912"
                    value={cardForm.rfid_tag}
                    onChange={(e) => setCardForm({ ...cardForm, rfid_tag: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">فئة الولاء والعضوية</label>
                  <select
                    value={cardForm.loyalty_tier}
                    onChange={(e) => setCardForm({ ...cardForm, loyalty_tier: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="gold">عضوية ذهبية (Gold VIP)</option>
                    <option value="silver">عضوية فضية (Silver)</option>
                    <option value="standard">عضوية عادية (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم حامل البطاقة</label>
                <Input
                  required
                  placeholder="اسم اللاعب أو ولي الأمر"
                  value={cardForm.holder_name}
                  onChange={(e) => setCardForm({ ...cardForm, holder_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رصيد الشحن المالي (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={cardForm.credits_balance_egp}
                    onChange={(e) => setCardForm({ ...cardForm, credits_balance_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تذاكر المكافآت المجانية</label>
                  <Input
                    type="number"
                    required
                    value={cardForm.bonus_tickets_count}
                    onChange={(e) => setCardForm({ ...cardForm, bonus_tickets_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">آخر لعبة مستخدمة</label>
                <Input
                  value={cardForm.last_tap_attraction}
                  onChange={(e) => setCardForm({ ...cardForm, last_tap_attraction: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsCardModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  شحن وتسليم البطاقة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Concession */}
      {isConcessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">تسجيل فاتورة ضيافة ومأكولات (F&B)</h2>
              <button
                onClick={() => setIsConcessionModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateConcession} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم الطلب</label>
                  <Input
                    required
                    placeholder="مثال: ORD-2026-FNB-99"
                    value={concessionForm.order_ref}
                    onChange={(e) => setConcessionForm({ ...concessionForm, order_ref: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">منفذ البيع / المحطة</label>
                  <Input
                    required
                    value={concessionForm.counter_station}
                    onChange={(e) => setConcessionForm({ ...concessionForm, counter_station: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">تفاصيل الوجبة والمشروبات</label>
                <Input
                  required
                  placeholder="مثال: كومبو سينما كبير + 2 كولا + ناتشوز"
                  value={concessionForm.combo_summary}
                  onChange={(e) => setConcessionForm({ ...concessionForm, combo_summary: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المبلغ الإجمالي (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={concessionForm.total_amount_egp}
                    onChange={(e) => setConcessionForm({ ...concessionForm, total_amount_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">طريقة الدفع</label>
                  <select
                    value={concessionForm.payment_method}
                    onChange={(e) => setConcessionForm({ ...concessionForm, payment_method: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="contactless_pos">نقطة بيع إلكترونية POS</option>
                    <option value="cash">نقداً</option>
                    <option value="rfid_credits">رصيد بطاقة الألعاب</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الكاشير</label>
                  <Input
                    required
                    value={concessionForm.cashier_name}
                    onChange={(e) => setConcessionForm({ ...concessionForm, cashier_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsConcessionModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  تأكيد وسداد الفاتورة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
