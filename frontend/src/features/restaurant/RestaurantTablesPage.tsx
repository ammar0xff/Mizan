import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  elapsed_mins: number;
  status: "pending" | "cooking" | "ready";
  items: { name: string; qty: number; notes: string }[];
}

export default function RestaurantTablesPage() {
  const [tab, setTab] = useState<"hall" | "kds">("hall");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
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

  const tables = tablesQuery.data ?? [];
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const availableCount = tables.filter((t) => t.status === "available").length;
  const totalActiveRevenue = tables.reduce((acc, t) => acc + t.order_total, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <UtensilsCrossed className="size-4" />
            <span>وحدة المطاعم والكافيهات</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            إدارة الصالة والطلبات الحية (Dine-in & KDS)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            متابعة إشغال الطاولات، أوقات الجلوس، تذاكر المطبخ اللحظية، وإجمالي حسابات الصالة
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            مخطط الصالة والطاولات
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

          <Link
            to="/pos"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5 text-xs")}
          >
            <ShoppingBag className="size-3.5" />
            كاشير التيك أواي
          </Link>
        </div>
      </div>

      {/* Restaurant Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">طاولات مشغولة حالياً</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-2xl font-black text-amber-600 dark:text-amber-400">{occupiedCount}</p>
            <span className="text-xs text-muted-foreground">من أصل <span className="num font-semibold">{tables.length}</span></span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">نسبة الإشغال: {tables.length ? Math.round((occupiedCount / tables.length) * 100) : 0}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">طاولات متاحة للجلوس</p>
          <p className="num mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableCount}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">جاهزة لاستقبال الزبائن فوراً</p>
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
          <p className="mt-1 text-[10px] text-muted-foreground">متوسط وقت الإعداد: 9 دقائق</p>
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
              يتم إرسال الطلبات مباشرة من أجهزة الويترز ونقاط البيع إلى المطبخ
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
                        ⏱ {ticket.elapsed_mins} دقيقة
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
                    onClick={() => {
                      sound.success();
                      toast("success", `تم تجهيز التذكرة ${ticket.order_number} بنجاح`);
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

      {/* Table Detail / Order Modal */}
      <Modal
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `طاولة رقم ${selectedTable.number} (${selectedTable.section})` : ""}
      >
        {selectedTable && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted p-2.5">
                <span className="text-muted-foreground">الحالة: </span>
                <strong className="font-bold">
                  {selectedTable.status === "occupied" ? "مشغولة" : "متاحة"}
                </strong>
              </div>
              <div className="rounded-lg bg-muted p-2.5">
                <span className="text-muted-foreground">السعة: </span>
                <strong className="font-bold">{selectedTable.capacity} أفراد</strong>
              </div>
            </div>

            {selectedTable.status === "occupied" ? (
              <div className="rounded-xl border border-border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الحساب الجاري:</span>
                  <strong className="num text-lg font-bold text-primary">
                    {moneyEGP(selectedTable.order_total)}
                  </strong>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">وقت بدء الجلسة: {selectedTable.opened_at}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                الطاولة جاهزة لاستقبال ضيوف جدد وبدء طلب طعام جديد.
              </p>
            )}

            <div className="flex gap-2">
              <Link
                to="/pos"
                className={cn(buttonVariants(), "flex-1 font-bold text-center")}
              >
                {selectedTable.status === "occupied" ? "إضافة أصناف / محاسبة" : "فتح طاولة وبدء الطلب"}
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
