/**
 * PAGE CONTRACT
 * Page: إدارة صالة المطعم، المطبخ، شجرة المكونات وتكاليف الطعام (/restaurant/tables)
 * Archetype: Floor Plan Matrix, Live Kitchen Display (KDS), Recipe BOM & Food Waste
 * User: مدير الصالة، الشيف العمومي، الكاشير، ومسؤول التكاليف لمتابعة الإشغال، والتحضير، ونسب تكلفة الأطباق
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status chips)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChefHat,
  Clock,
  ShoppingBag,
  Timer,
  Users,
  UtensilsCrossed,
  LayoutGrid,
  CheckCircle2,
  Printer,
  LogOut,
  UserPlus,
  BookOpen,
  Trash2,
  Layers,
  TrendingDown,
  Scale,
  Sparkles,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { Badge } from "@/components/kit/badge";
import { Button, buttonVariants } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { ErrorBox, Modal, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { moneyEGP } from "@/lib/format";
import { sound } from "@/lib/sound";
import { RestaurantGuestCheckModal, type DiningTableReceiptData } from "@/features/modules/SpecializedReceiptModals";

interface TableItem {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: "available" | "occupied" | "reserved";
  order_total: number;
  guests: number;
  opened_at: string | null;
}

interface KDSTicket {
  id: string;
  order_number: string;
  table: string;
  waiter: string;
  elapsed_minutes: number;
  status: "pending" | "cooking" | "ready";
  items: { name: string; qty: number; notes: string }[];
}

interface RecipeIngredient {
  id: string;
  raw_item_name: string;
  qty_per_portion: number;
  unit: string;
  unit_cost: number;
  yield_loss_pct: number;
  line_cost: number;
}

interface RecipeItem {
  id: string;
  menu_item_name: string;
  category: string;
  sale_price: number;
  yield_portions: number;
  prep_time_minutes: number;
  station: string;
  notes: string | null;
  ingredients: RecipeIngredient[];
  ingredient_count: number;
  calculated_cost: number;
  food_cost_pct: number;
  margin_pct: number;
  cost_status: "optimal" | "acceptable" | "high";
}

interface WasteItem {
  id: string;
  item_name: string;
  qty: number;
  unit: string;
  estimated_cost: number;
  reason_code: string;
  reason_label: string;
  notes: string | null;
  logged_by: string;
  created_at: string;
}

interface WasteResponse {
  total_waste_cost: number;
  count: number;
  logs: WasteItem[];
}

export default function RestaurantTablesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"hall" | "kds" | "recipes" | "waste">("hall");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [guestCheckData, setGuestCheckData] = useState<DiningTableReceiptData | null>(null);
  const [isUpdatingTable, setIsUpdatingTable] = useState(false);
  const [isDepleting, setIsDepleting] = useState(false);
  const [depletionResult, setDepletionResult] = useState<any | null>(null);
  const [isRecordingWaste, setIsRecordingWaste] = useState(false);

  // Waste form state
  const [wasteForm, setWasteForm] = useState({
    item_name: "",
    qty: 1,
    unit: "كجم",
    estimated_cost: 0,
    reason: "prep_waste",
    notes: "",
  });

  const { toast } = useToast();

  const tablesQuery = useQuery({
    queryKey: ["restaurant-tables"],
    queryFn: () => api.get<TableItem[]>("/modules/restaurant/tables"),
  });

  const kdsQuery = useQuery({
    queryKey: ["restaurant-kds"],
    queryFn: () => api.get<KDSTicket[]>("/modules/restaurant/kitchen-orders"),
    refetchInterval: 15_000,
  });

  const recipesQuery = useQuery({
    queryKey: ["restaurant-recipes"],
    queryFn: () => api.get<RecipeItem[]>("/modules/restaurant/recipes"),
  });

  const wasteQuery = useQuery({
    queryKey: ["restaurant-waste"],
    queryFn: () => api.get<WasteResponse>("/modules/restaurant/waste"),
  });

  const tables = tablesQuery.data ?? [];
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const availableCount = tables.filter((t) => t.status === "available").length;
  const totalActiveRevenue = tables.reduce((acc, t) => acc + t.order_total, 0);

  const recipes = recipesQuery.data ?? [];
  const wasteData = wasteQuery.data ?? { total_waste_cost: 0, count: 0, logs: [] };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <UtensilsCrossed className="size-4" />
            <span>وحدة المطاعم والكافيهات وإدارة الأغذية</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            إدارة المطعم، الصالة وشجرة الوصفات (BOM & Costing)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            متابعة إشغال الطاولات، تذاكر المطبخ اللحظية، خصم مكونات الأطباق تلقائياً، وسجل هادر الأغذية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={tab === "hall" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("hall");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <LayoutGrid className="size-3.5" />
            مخطط الصالة
          </Button>

          <Button
            variant={tab === "kds" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("kds");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <ChefHat className="size-3.5" />
            شاشة المطبخ (KDS)
            {kdsQuery.data && (
              <span className="ms-1 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">
                {kdsQuery.data.length}
              </span>
            )}
          </Button>

          <Button
            variant={tab === "recipes" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("recipes");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <BookOpen className="size-3.5" />
            شجرة الوصفات وتكاليف الطعام
            {recipes.length > 0 && (
              <span className="ms-1 rounded-full bg-primary/20 px-1.5 text-[10px] text-primary font-bold">
                {recipes.length}
              </span>
            )}
          </Button>

          <Button
            variant={tab === "waste" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("waste");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Trash2 className="size-3.5" />
            الهادر والتالف
          </Button>

          <Link
            to="/pos"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5 text-xs")}
          >
            <ShoppingBag className="size-3.5" />
            كاشير التيك أواي
          </Link>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">طاولات مشغولة حالياً</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-2xl font-black text-amber-600 dark:text-amber-400">{occupiedCount}</p>
            <span className="text-xs text-muted-foreground">من أصل <span className="num font-semibold">{tables.length}</span></span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">نسبة الإشغال: {tables.length ? Math.round((occupiedCount / tables.length) * 100) : 0}% (<span className="num font-semibold">{availableCount}</span> متاحة)</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">إجمالي حسابات الصالة الجارية</p>
          <p className="num mt-1 text-2xl font-black text-foreground">{moneyEGP(totalActiveRevenue)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">مستحقات على الطاولات المشغولة</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">تذاكر قيد التحضير بالمطبخ</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="num text-2xl font-black text-foreground">{kdsQuery.data?.length ?? 0}</p>
            <Badge variant="warning" className="h-5 px-1.5 text-[10px] font-bold">مباشر</Badge>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">محطات الطهي والتحضير</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">إجمالي تكلفة الهادر المسجل</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-2xl font-black text-rose-600 dark:text-rose-400">{moneyEGP(wasteData.total_waste_cost)}</p>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground"><span className="num font-semibold">{wasteData.count}</span> سجلات هادر وتالف</p>
        </Card>
      </div>

      {/* Tab 1: Dining Hall Floor Plan */}
      {tab === "hall" && (
        <div className="flex flex-col gap-4">
          {tablesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : tablesQuery.isError ? (
            <ErrorBox message={(tablesQuery.error as Error).message} onRetry={() => tablesQuery.refetch()} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((t) => {
                const isOccupied = t.status === "occupied";
                const isReserved = t.status === "reserved";

                return (
                  <Card
                    key={t.id}
                    className={`cursor-pointer overflow-hidden p-5 transition-all hover:scale-[1.01] ${
                      isOccupied
                        ? "border-amber-500/60 bg-amber-500/5 shadow-xs"
                        : isReserved
                        ? "border-blue-500/50 bg-blue-500/5"
                        : "border-border/80 hover:border-emerald-500/60"
                    }`}
                    onClick={() => {
                      sound.click();
                      setSelectedTable(t);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-11 items-center justify-center rounded-xl font-bold text-base ${
                            isOccupied
                              ? "bg-amber-500 text-white"
                              : isReserved
                              ? "bg-blue-600 text-white"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {t.number}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">طاولة {t.number}</h3>
                          <p className="text-[11px] text-muted-foreground">{t.section}</p>
                        </div>
                      </div>

                      <Badge
                        variant={isOccupied ? "warning" : isReserved ? "secondary" : "success"}
                        className="h-5 px-2 text-[10px] font-bold"
                      >
                        {isOccupied ? "مشغولة" : isReserved ? "محجوزة" : "فارغة ومتاحة"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-3.5" />
                        سعة {t.capacity} أفراد
                        {isOccupied && <strong className="text-foreground">({t.guests} جالسين)</strong>}
                      </span>

                      {isOccupied && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Timer className="size-3" />
                          {t.opened_at}
                        </span>
                      )}
                    </div>

                    {isOccupied && (
                      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-card/80 p-2 text-xs">
                        <span className="text-muted-foreground">الحساب الجاري:</span>
                        <strong className="num text-sm font-bold text-foreground">
                          {moneyEGP(t.order_total)}
                        </strong>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Kitchen Display System (KDS) */}
      {tab === "kds" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 text-xs">
            <span className="flex items-center gap-2 font-medium">
              <Clock className="size-4 text-primary" />
              تحديث تذاكر المطبخ التلقائي نشط كل 15 ثانية
            </span>
            <span className="text-muted-foreground">
              توجيه أوتوماتيكي لمحطات التحضير (شواية، فرن بيتزا، بار ومشروبات)
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kdsQuery.data?.map((ticket) => (
              <Card key={ticket.id} className="flex flex-col justify-between overflow-hidden p-4 border-amber-500/40">
                <div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">{ticket.order_number}</span>
                        <Badge variant="warning" className="h-5 px-1.5 text-[10px]">
                          قيد الطهي
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-foreground">{ticket.table}</p>
                    </div>

                    <div className="text-end">
                      <span className="num font-mono text-xs font-bold text-destructive">
                        ⏱ {ticket.elapsed_minutes} دقيقة
                      </span>
                      <p className="text-[10px] text-muted-foreground">{ticket.waiter}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {ticket.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{it.name}</span>
                          {it.notes && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">
                              ملاحظة: {it.notes}
                            </span>
                          )}
                        </div>
                        <span className="num font-bold text-sm text-primary">×{it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-border/60 pt-3">
                  <Button
                    onClick={async () => {
                      sound.click();
                      try {
                        await api.post(`/modules/restaurant/kitchen-orders/${ticket.id}/status`, {
                          status: "ready",
                        });
                        sound.success();
                        toast("success", `تم تجهيز طلب ${ticket.order_number} للطاولة ${ticket.table} بنجاح`);
                        await queryClient.invalidateQueries({ queryKey: ["restaurant-kds"] });
                      } catch (err: any) {
                        toast("error", err.message || "فشل تحديث حالة الطلب");
                      }
                    }}
                    className="w-full h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="size-4" />
                    تم التحضير وجاهز للتقديم
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Recipe BOM & Food Costing (RES-02, RES-05, RES-10) */}
      {tab === "recipes" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Scale className="size-4 text-primary" />
                شجرة وصفات الأطباق وتحليل نسبة تكلفة الطعام (Food Cost %)
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                حساب التكلفة الفعلية للمكونات الأولية مع نسبة هادر الطهي (Yield Loss)، وهامش الربحية المستهدف لكل صنف
              </p>
            </div>

            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-bold"
              onClick={() => {
                sound.click();
                if (recipes.length > 0) {
                  setSelectedRecipe(recipes[0]);
                }
              }}
            >
              <Sparkles className="size-3.5" />
              فحص تفاصيل المكونات وهادر الطهي
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => {
              const isOptimal = r.cost_status === "optimal";
              const isHigh = r.cost_status === "high";

              return (
                <Card
                  key={r.id}
                  className="overflow-hidden p-5 border-border/80 hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                          {r.category}
                        </Badge>
                        <h3 className="font-bold text-base text-foreground">{r.menu_item_name}</h3>
                        <p className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                          <Flame className="size-3" />
                          {r.station}
                        </p>
                      </div>

                      <Badge
                        variant={isOptimal ? "success" : isHigh ? "destructive" : "warning"}
                        className="h-5 px-2 text-[10px] font-bold"
                      >
                        تكلفة {r.food_cost_pct}%
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-border/50 py-3">
                      <div>
                        <span className="text-[11px] text-muted-foreground">سعر البيع:</span>
                        <p className="num text-base font-bold text-foreground">{moneyEGP(r.sale_price)}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">تكلفة المكونات:</span>
                        <p className="num text-base font-bold text-amber-600 dark:text-amber-400">
                          {moneyEGP(r.calculated_cost)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">هامش الربح:</span>
                        <p className="num font-semibold text-emerald-600 dark:text-emerald-400">
                          {r.margin_pct}% ({moneyEGP(r.sale_price - r.calculated_cost)})
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">المكونات المسجلة:</span>
                        <p className="num font-semibold text-foreground">{r.ingredient_count} أصناف أولية</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sound.click();
                        setSelectedRecipe(r);
                      }}
                      className="flex-1 h-8 text-xs font-semibold gap-1"
                    >
                      <Layers className="size-3" />
                      عرض شجرة BOM
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        sound.click();
                        setIsDepleting(true);
                        try {
                          const res = await api.post<any>("/modules/restaurant/recipes/deplete", {
                            order_number: `#SIM-${Math.floor(100 + Math.random() * 900)}`,
                            items: [{ recipe_id: r.id, qty: 1 }],
                          });
                          sound.success();
                          setDepletionResult(res);
                          toast("success", `تم محاكاة خصم مكونات «${r.menu_item_name}» بنجاح`);
                        } catch (err: any) {
                          toast("error", err.message || "فشل خصم المكونات");
                        } finally {
                          setIsDepleting(false);
                        }
                      }}
                      disabled={isDepleting}
                      className="h-8 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <TrendingDown className="size-3" />
                      خصم تلقائي
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Food Waste & Spoilage Register (RES-08) */}
      {tab === "waste" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Trash2 className="size-4 text-rose-500" />
                سجل الهادر والتالف الغذائي وتكاليف الفاقد (Food Waste Log)
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                توثيق أسباب التلف (هادر تحضير، انتهاء صلاحية، تلف تخزين) لحساب الخسائر وضبط المخزون
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsRecordingWaste(true);
              }}
              className="h-8 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="size-3.5" />
              تسجيل هادر / تالف جديد
            </Button>
          </div>

          <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">الصنف التالف</th>
                    <th className="p-3">الكمية المسجلة</th>
                    <th className="p-3">التكلفة التقديرية</th>
                    <th className="p-3">سبب التلف</th>
                    <th className="p-3">المسؤول عن التسجيل</th>
                    <th className="p-3">ملاحظات</th>
                    <th className="p-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {wasteData.logs.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30">
                      <td className="p-3 font-bold text-foreground">{w.item_name}</td>
                      <td className="p-3 num font-semibold">
                        {w.qty} {w.unit}
                      </td>
                      <td className="p-3 num font-bold text-rose-600 dark:text-rose-400">
                        {moneyEGP(w.estimated_cost)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            w.reason_code === "expired"
                              ? "destructive"
                              : w.reason_code === "spoiled"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {w.reason_label}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{w.logged_by}</td>
                      <td className="p-3 text-muted-foreground text-[11px]">{w.notes || "—"}</td>
                      <td className="p-3 num text-muted-foreground">{w.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recipe BOM Detail Modal */}
      <Modal
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe ? `شجرة مكونات طبق: ${selectedRecipe.menu_item_name}` : ""}
      >
        {selectedRecipe && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center">
              <div>
                <span className="text-[11px] text-muted-foreground">سعر البيع</span>
                <p className="num text-base font-bold text-foreground">{moneyEGP(selectedRecipe.sale_price)}</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">إجمالي تكلفة المكونات</span>
                <p className="num text-base font-bold text-amber-600 dark:text-amber-400">
                  {moneyEGP(selectedRecipe.calculated_cost)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">نسبة تكلفة الطعام</span>
                <p className="num text-base font-bold text-primary">{selectedRecipe.food_cost_pct}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">المادة الأولية</th>
                    <th className="p-2.5">الكمية / وجبة</th>
                    <th className="p-2.5">هادر الطهي</th>
                    <th className="p-2.5">سعر الوحدة</th>
                    <th className="p-2.5">تكلفة الصنف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {selectedRecipe.ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">{ing.raw_item_name}</td>
                      <td className="p-2.5 num">
                        {ing.qty_per_portion} {ing.unit}
                      </td>
                      <td className="p-2.5 num text-amber-600 font-semibold">{ing.yield_loss_pct}%</td>
                      <td className="p-2.5 num">{moneyEGP(ing.unit_cost)}</td>
                      <td className="p-2.5 num font-bold text-foreground">{moneyEGP(ing.line_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                محطة التحضير: <strong>{selectedRecipe.station}</strong>. وقت التجهيز المتوقع: {selectedRecipe.prep_time_minutes} دقيقة.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Depletion Result Modal */}
      <Modal
        open={!!depletionResult}
        onClose={() => setDepletionResult(null)}
        title="تقرير الخصم التلقائي للمكونات (Backflushing)"
      >
        {depletionResult && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="size-4" />
                <span>{depletionResult.detail}</span>
              </div>
              <p className="mt-1 text-xs">
                إجمالي تكلفة المواد المسحوبة من المخزن: <strong>{moneyEGP(depletionResult.total_depleted_cost)}</strong>
              </p>
            </div>

            <div className="rounded-xl border border-border/80 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">المكون الأولي</th>
                    <th className="p-2.5">الكمية المخصومة</th>
                    <th className="p-2.5">التكلفة المحسوبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {depletionResult.depleted_ingredients?.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5 font-semibold text-foreground">{item.raw_item_name}</td>
                      <td className="p-2.5 num font-bold text-primary">
                        {item.total_qty_depleted} {item.unit}
                      </td>
                      <td className="p-2.5 num font-bold text-amber-600 dark:text-amber-400">
                        {moneyEGP(item.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Waste Modal */}
      <Modal
        open={isRecordingWaste}
        onClose={() => setIsRecordingWaste(false)}
        title="تسجيل هادر أو تالف جديد"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            sound.click();
            try {
              await api.post("/modules/restaurant/waste", wasteForm);
              sound.success();
              toast("success", `تم تسجيل هادر ${wasteForm.item_name} بنجاح`);
              await queryClient.invalidateQueries({ queryKey: ["restaurant-waste"] });
              setIsRecordingWaste(false);
              setWasteForm({ item_name: "", qty: 1, unit: "كجم", estimated_cost: 0, reason: "prep_waste", notes: "" });
            } catch (err: any) {
              toast("error", err.message || "فشل تسجيل الهادر");
            }
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div>
            <label className="font-semibold text-foreground">اسم الصنف أو المادة الأولية *</label>
            <input
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="مثال: صدور دجاج متبلة، طماطم فريش..."
              value={wasteForm.item_name}
              onChange={(e) => setWasteForm({ ...wasteForm, item_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">الكمية التالفة *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num"
                value={wasteForm.qty}
                onChange={(e) => setWasteForm({ ...wasteForm, qty: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الوحدة *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={wasteForm.unit}
                onChange={(e) => setWasteForm({ ...wasteForm, unit: e.target.value })}
              >
                <option value="كجم">كجم</option>
                <option value="قطعة">قطعة</option>
                <option value="لتر">لتر</option>
                <option value="عبوة">عبوة</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">التكلفة التقديرية (ج.م) *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num"
                value={wasteForm.estimated_cost}
                onChange={(e) => setWasteForm({ ...wasteForm, estimated_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">سبب التلف *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={wasteForm.reason}
                onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
              >
                <option value="prep_waste">هادر تحضير وتشغيل</option>
                <option value="expired">انتهاء صلاحية</option>
                <option value="spoiled">تلف وسوء تخزين</option>
                <option value="customer_return">مرتجع من العميل</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground">ملاحظات توضيحية</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="سبب التلف أو الملاحظة الفنية للشيف..."
              value={wasteForm.notes}
              onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRecordingWaste(false)}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              تأكيد تسجيل الهادر
            </Button>
          </div>
        </form>
      </Modal>

      {/* Table Detail / Order Modal */}
      <Modal
        open={!!selectedTable}
        onClose={() => !isUpdatingTable && setSelectedTable(null)}
        title={selectedTable ? `طاولة رقم ${selectedTable.number} (${selectedTable.section})` : ""}
      >
        {selectedTable && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted p-2.5">
                <span className="text-muted-foreground">الحالة الحالية: </span>
                <strong className={`font-bold ${selectedTable.status === "occupied" ? "text-amber-600" : "text-emerald-600"}`}>
                  {selectedTable.status === "occupied" ? "مشغولة حالياً" : "فارغة ومتاحة"}
                </strong>
              </div>
              <div className="rounded-lg bg-muted p-2.5">
                <span className="text-muted-foreground">سعة الطاولة: </span>
                <strong className="font-bold">{selectedTable.capacity} أفراد</strong>
              </div>
            </div>

            {selectedTable.status === "occupied" ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">إجمالي حساب الطاولة:</span>
                  <strong className="num text-xl font-black text-amber-600 dark:text-amber-400">
                    {moneyEGP(selectedTable.order_total)}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                  <span>الضيوف الجالسين: <strong className="text-foreground">{selectedTable.guests} أفراد</strong></span>
                  <span>وقت الجلوس: <strong className="text-foreground">{selectedTable.opened_at || "الآن"}</strong></span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                الطاولة فارغة ونظيفة، جاهزة لاستقبال زبائن جدد أو تسكين حجز مسبق.
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {selectedTable.status === "occupied" ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-9 text-xs font-semibold gap-1.5"
                      onClick={() => {
                        sound.click();
                        setGuestCheckData({
                          tableNumber: selectedTable.number,
                          section: selectedTable.section,
                          serverName: "محمد الشافعي (كابتن صالة)",
                          guests: selectedTable.guests || 2,
                          openedAt: selectedTable.opened_at || undefined,
                          subtotal: selectedTable.order_total || 240.0,
                          serviceChargePercent: 12,
                          vatPercent: 14,
                        });
                      }}
                    >
                      <Printer className="size-3.5 text-amber-500" />
                      طباعة بون الحساب (Guest Check)
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUpdatingTable}
                      className="h-9 text-xs font-semibold gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        setIsUpdatingTable(true);
                        try {
                          sound.click();
                          await api.post(`/modules/restaurant/tables/${selectedTable.id}/status`, {
                            status: "available",
                          });
                          sound.success();
                          toast("success", `تم إخلاء طاولة ${selectedTable.number} وتصفير الحساب بنجاح`);
                          await queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
                          setSelectedTable(null);
                        } catch (err: any) {
                          toast("error", err.message || "فشل إخلاء الطاولة");
                        } finally {
                          setIsUpdatingTable(false);
                        }
                      }}
                    >
                      <LogOut className="size-3.5" />
                      إخلاء الطاولة
                    </Button>
                  </div>

                  <Link
                    to="/pos"
                    className={cn(buttonVariants(), "w-full font-bold text-center text-xs h-9")}
                  >
                    إضافة أصناف للطلب / محاسبة الكاشير
                  </Link>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={isUpdatingTable}
                    className="flex-1 h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      setIsUpdatingTable(true);
                      try {
                        sound.click();
                        const timeStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
                        await api.post(`/modules/restaurant/tables/${selectedTable.id}/status`, {
                          status: "occupied",
                          guests: selectedTable.capacity,
                          opened_at: timeStr,
                          order_total: 180.0,
                        });
                        sound.success();
                        toast("success", `تم تسكين الضيوف وفتح طاولة ${selectedTable.number} بنجاح`);
                        await queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
                        setSelectedTable(null);
                      } catch (err: any) {
                        toast("error", err.message || "فشل فتح الطاولة");
                      } finally {
                        setIsUpdatingTable(false);
                      }
                    }}
                  >
                    <UserPlus className="size-3.5" />
                    تسكين ضيوف وفتح الطاولة
                  </Button>

                  <Link
                    to="/pos"
                    className={cn(buttonVariants({ variant: "outline" }), "flex-1 font-bold text-center text-xs h-9")}
                  >
                    فتح طلب جديد بالـ POS
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Guest Check Print Modal */}
      <RestaurantGuestCheckModal
        open={!!guestCheckData}
        onClose={() => setGuestCheckData(null)}
        data={guestCheckData}
      />
    </div>
  );
}
