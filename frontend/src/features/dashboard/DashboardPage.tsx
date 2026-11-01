/**
 * PAGE CONTRACT
 * Page: صحيفة اليوم (/)
 * User: مدير الفرع يفتح النظام في بداية اليوم (أو يعود من جولة الفروع)
 * Outcome: قراءة رقم اليوم بثوانٍ، ثم الانتقال إلى الإجراء التالي (بيع / نواقص / فواتير)
 * Primary information: مبيعات اليوم (الرقم المهيمن) → سياقه (عدد الفواتير، المتوسط، اتجاه 14 يومًا) → مبيعات الشهر → النواقص → الوردية
 * Primary action (per state): populated → «فاتورة جديدة»؛ error → «إعادة المحاولة»؛ لا نواقص → «مراجعة المخزون»
 * Secondary action: كل الفواتير · اقتراح طلب شراء
 * Real content only: لا نسب مُختلقة ولا أهداف غير مسجلة — كل رقم من مصدره
 * Required states: loading (skeleton), error (retry), populated; كل قسم يتحمّل فراغه بنفسه
 * Composition: دفتر اليوم — طباعي مسطّر بلا بطاقات؛ التسلسل الهرمي بالحجم والقواعد لا بالصناديق
 * Responsive: 1440 شريط البطل بثلاث رُكنات؛ 768 يلتفّ؛ 390 عمود واحد والرقم أولًا
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarRange, Receipt, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { useBranch } from "@/components/AppShell";
import { Delta, KpiTile, ListState, Money, Num, StatusBadge, TableShell } from "@/components/app/shared";
import { Button } from "@/components/kit/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";
import { Skeleton } from "@/components/kit/skeleton";
import { formatDateTime, formatNumber } from "@/lib/format";

interface DailyReport {
  date: string;
  total_sales: number;
  total_items: number;
  invoice_count: number;
}
interface MonthlyReport {
  total_sales?: string | number;
  invoice_count?: number;
  [k: string]: unknown;
}
interface SaleRow {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total: string;
  status: string;
  created_at: string;
}
interface LowStockRow {
  product_id: string;
  product_name: string;
  current_qty: number;
  unit: string;
}

/** Build a 14-day series (oldest → newest) from the recent-sales list. */
function buildTrend(sales: SaleRow[]): { day: string; sales: number }[] {
  const byDay = new Map<string, number>();
  for (const s of sales) {
    const key = (s.created_at ?? "").slice(0, 10);
    if (byDay.has(key) && s.status !== "cancelled" && s.status !== "quotation") {
      byDay.set(key, (byDay.get(key) ?? 0) + Number(s.total));
    }
  }
  const days: { day: string; sales: number }[] = [];
  const today = new Date();
  for (let back = 13; back >= 0; back--) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      sales: Math.round((byDay.get(key) ?? 0) * 100) / 100,
    });
  }
  return days;
}

/** Inline 14-day sparkline — pure SVG, no chart library needed at this size. */
function Sparkline({ data, className }: { data: { sales: number }[]; className?: string }) {
  const max = Math.max(...data.map((d) => d.sales), 1);
  const pts = data
    .map((d, i) => `${(i / Math.max(data.length - 1, 1)) * 100},${28 - (d.sales / max) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--chart-1)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function DashboardPage() {
  const { branchId, branchName } = useBranch();

  const daily = useQuery({
    queryKey: ["report", "daily"],
    queryFn: () => api.get<DailyReport>("/reports/sales/daily"),
  });
  const monthly = useQuery({
    queryKey: ["report", "monthly"],
    queryFn: () =>
      api.get<MonthlyReport>("/reports/sales/monthly", {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      }),
  });
  const lowStock = useQuery({
    queryKey: ["dash", "low", branchId],
    queryFn: () => api.get<LowStockRow[]>("/stock/low-stock", { warehouse_id: branchId! }),
    enabled: !!branchId,
  });
  const shift = useQuery({
    queryKey: ["shift", "dash", branchId],
    queryFn: () => api.get<{ id: string; started_at: string } | null>("/shifts/current", { warehouse_id: branchId! }),
    enabled: !!branchId,
    retry: false,
  });
  const recent = useQuery({
    queryKey: ["dash", "recent"],
    queryFn: () => api.get<SaleRow[]>("/sales", { page: 1, page_size: 14 }),
  });

  const trend = buildTrend(recent.data ?? []);
  const trendTotal = trend.reduce((s, d) => s + d.sales, 0);

  const dayTotal = Number(daily.data?.total_sales ?? 0);
  const dayCount = daily.data?.invoice_count ?? 0;
  const dayAvg = dayCount > 0 ? dayTotal / dayCount : 0;
  const yesterday = trend[trend.length - 2]?.sales ?? 0;
  const dayDelta = yesterday > 0 ? ((dayTotal - yesterday) / yesterday) * 100 : null;
  const lowCount = lowStock.data?.length ?? 0;
  const today = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { dateStyle: "full", timeZone: "Africa/Cairo" }).format(new Date());

  return (
    <div className="flex flex-col gap-8">
      {/* Masthead — the sheet's overline and the one action that matters */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="sr-only">لوحة التحكم</h1>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            صحيفة اليوم — {today} · {branchName}
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/pos" />}>
          <ShoppingCart data-icon="inline-start" />
          فاتورة جديدة
        </Button>
      </div>

      {/* Hero band — the number the whole page exists for */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b border-border pb-8">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Receipt className="size-3.5" aria-hidden />
            مبيعات اليوم
          </p>
          {daily.isLoading ? (
            <Skeleton className="h-12 w-56" />
          ) : daily.isError ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              تعذّر تحميل مبيعات اليوم
              <Button variant="outline" size="sm" onClick={() => daily.refetch()}>
                إعادة المحاولة
              </Button>
            </p>
          ) : (
            <p className="flex items-baseline gap-2">
              <span className="num text-5xl font-bold tracking-tight">{formatNumber(dayTotal)}</span>
              <span className="text-lg text-muted-foreground">ج.م</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            <Num value={dayCount} /> فاتورة · متوسط الفاتورة <Money value={dayAvg} />
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            آخر ١٤ يومًا — إجمالي <Money value={trendTotal} />
          </p>
          <Sparkline data={trend} className="h-10 w-44" />
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <p className="font-medium text-muted-foreground">الوردية</p>
          {shift.data ? (
            <p>
              مفتوحة · <span className="num">{formatDateTime(shift.data.started_at)}</span>
            </p>
          ) : (
            <p>
              <span className="text-destructive">مغلقة</span> —{" "}
              <Link to="/shifts" className="underline-offset-4 hover:underline">
                افتح وردية لبدء البيع
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* KPI tiles — colored, with real deltas (today vs yesterday) and a live sparkline */}
      <section aria-label="مؤشرات الأداء" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiTile
          label="مبيعات الشهر"
          icon={CalendarRange}
          tone="default"
          value={monthly.isError ? "—" : <Money value={Number(monthly.data?.total_sales ?? 0)} />}
          hint={monthly.isError ? "غير متاح حاليًا" : <span>حتى تاريخ اليوم · <Num value={monthly.data?.invoice_count ?? 0} /> فاتورة</span>}
        />
        <KpiTile
          label="منتجات تحت الحد"
          icon={AlertTriangle}
          tone={lowCount > 0 ? "warning" : "success"}
          value={<Num value={lowCount} />}
          hint={<Link to="/inventory" className="underline-offset-4 hover:underline">عرض قائمة النواقص</Link>}
        />
        <KpiTile
          label="مبيعات أمس"
          icon={Receipt}
          tone="info"
          value={<Money value={trend[trend.length - 2]?.sales ?? 0} />}
          hint={<Delta percent={dayDelta} />}
        />
        <KpiTile
          label="إجمالي ١٤ يومًا"
          icon={CalendarRange}
          tone="success"
          value={<Money value={trendTotal} />}
          hint={<span>متوسط يومي <Money value={trendTotal / 14} /></span>}
        />
      </section>

      {/* نواقص — a ruled section, not a card */}
      <section aria-label="نواقص المخزن" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
          <h2 className="text-sm font-semibold">
            نواقص {branchName} {lowCount > 0 && <span className="num text-muted-foreground">({lowCount})</span>}
          </h2>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/purchases" />}>
            اقتراح طلب شراء
          </Button>
        </div>
        <ListState
          status={lowStock.isLoading ? "loading" : lowStock.isError ? "error" : "ready"}
          isEmpty={lowCount === 0}
          onRetry={() => lowStock.refetch()}
          emptyTitle="لا توجد نواقص"
          emptyDescription="كل الأصناف فوق حد الطلب في هذا الفرع."
          emptyAction={
            <Button variant="outline" nativeButton={false} render={<Link to="/inventory" />}>
              مراجعة المخزون
            </Button>
          }
        >
          <ul className="flex flex-col divide-y divide-border">
            {(lowStock.data ?? []).slice(0, 6).map((p) => (
              <li key={p.product_id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-sm font-medium">{p.product_name}</span>
                <span className="shrink-0 text-sm">
                  <Num value={p.current_qty} className="font-semibold text-destructive" />
                  <span className="text-xs text-muted-foreground"> {p.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        </ListState>
      </section>

      {/* أحدث الفواتير — ledger rows */}
      <section aria-label="أحدث الفواتير" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
          <h2 className="text-sm font-semibold">أحدث الفواتير</h2>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/sales" />}>
            كل الفواتير
          </Button>
        </div>
        <ListState
          status={recent.isLoading ? "loading" : recent.isError ? "error" : "ready"}
          isEmpty={(recent.data?.length ?? 0) === 0}
          onRetry={() => recent.refetch()}
          emptyTitle="لا توجد مبيعات بعد"
          emptyDescription="ستظهر الفواتير هنا بمجرد تسجيل أول عملية بيع."
          emptyAction={
            <Button nativeButton={false} render={<Link to="/pos" />}>
              <ShoppingCart data-icon="inline-start" />
              ابدأ البيع
            </Button>
          }
        >
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead className="text-end">الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="hidden sm:table-cell">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recent.data ?? []).slice(0, 7).map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="num font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer_name ?? "عميل نقدي"}</TableCell>
                    <TableCell className="text-end">
                      <Money value={Number(inv.total)} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="num hidden text-muted-foreground sm:table-cell">{formatDateTime(inv.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </ListState>
      </section>
    </div>
  );
}
