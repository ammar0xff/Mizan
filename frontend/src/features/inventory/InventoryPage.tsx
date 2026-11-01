import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useBranch } from "@/components/AppShell";
import { Skeleton } from "@/components/kit/skeleton";
import { Badge } from "@/components/kit/badge";
import { Button, buttonVariants } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";
import { Empty, ErrorBox, Input, Select } from "@/components/ui";
import { api, openPrintDoc } from "@/lib/api";
import { dateTime, moneyEGP, qty as fq } from "@/lib/format";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  unit: string;
  retail_price: string;
  wholesale_price: string;
  cost_price: string;
  reorder_point?: string | number | null;
}

interface Movement {
  id: string;
  product_name?: string;
  warehouse_name?: string;
  movement_type: string;
  qty: string;
  created_at: string;
  note?: string | null;
}

export default function InventoryPage() {
  const [tab, setTab] = useState<"valuation" | "low" | "movements">("valuation");
  const { warehouses, branchId, setBranchId } = useBranch();
  const wid = branchId ?? (warehouses[0]?.id || "");

  // Valuation summary stats
  const valuationQuery = useQuery({
    queryKey: ["valuation", wid],
    queryFn: () =>
      api.get<{ total_cost_value: number; total_retail_value: number; product_count: number }>("/stock/valuation", {
        warehouse_id: wid,
      }),
    enabled: !!wid,
  });

  // Low stock count for quick alert badge
  const lowStockQuery = useQuery({
    queryKey: ["low-stock-count", wid],
    queryFn: () =>
      api.get<{ product_id: string; product_name: string; current_qty: number; unit: string }[]>("/stock/low-stock", {
        warehouse_id: wid,
      }),
    enabled: !!wid,
  });

  const costVal = valuationQuery.data?.total_cost_value ?? 0;
  const retailVal = valuationQuery.data?.total_retail_value ?? 0;
  const expectedProfit = retailVal - costVal;
  const profitMarginPercent = costVal > 0 ? ((expectedProfit / costVal) * 100).toFixed(1) : "0";
  const lowCount = lowStockQuery.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header with Warehouse Synchronizer and Operations Quick-Link */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <Boxes className="size-6 text-primary" aria-hidden />
            المخزون والتقييم اللحظي
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            كشف أرصدة المخازن، التقييم المالي بالتكلفة والبيع، ومتابعة حدود إعادة الطلب
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={wid}
            onChange={(e) => {
              sound.click();
              setBranchId(e.target.value);
            }}
            className="h-9 w-48 text-xs font-semibold"
            aria-label="تحديد الفرع أو المخزن"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold"
            onClick={() => {
              sound.click();
              openPrintDoc("/reports/inventory/print", { warehouse_id: wid });
            }}
          >
            <Printer className="size-3.5 text-muted-foreground" />
            طباعة كشف الجرد
          </Button>

          <Link
            to="/operations"
            className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 text-xs font-semibold")}
          >
            <SlidersHorizontal className="size-3.5" />
            العمليات المخزنية
            <ArrowUpRight className="size-3 opacity-70" />
          </Link>
        </div>
      </div>

      {/* Financial Valuation KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">قيمة المخزون بالتكلفة</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-foreground">
            {moneyEGP(costVal)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/80">رأس المال المستثمر</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">قيمة المخزون بالبيع</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-primary">
            {moneyEGP(retailVal)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/80">العائد البيعي المتوقع</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">هامش الربح التقديري</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className="num text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {moneyEGP(expectedProfit)}
            </p>
            <span className="num text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">
              ({profitMarginPercent}%)
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/80">
            <TrendingUp className="size-2.5 text-emerald-500" />
            هامش التجزئة الإجمالي
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">الأصناف المتتبعة</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-foreground">
            {valuationQuery.data?.product_count ?? 0}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/80">صنف مسجل في هذا المخزن</p>
        </Card>

        <Card className={`p-4 ${lowCount > 0 ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10" : ""}`}>
          <p className="text-[11px] font-medium text-muted-foreground">تنبيهات نقص المخزون</p>
          <div className="mt-1 flex items-center gap-2">
            <p className={`num text-xl font-bold tracking-tight ${lowCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {lowCount}
            </p>
            {lowCount > 0 && (
              <Badge variant="warning" className="h-5 px-1.5 text-[10px] font-bold">
                تحت الحد
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/80">تحتاج لإعادة طلب سريع</p>
        </Card>
      </div>

      {/* Central View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.click();
              setTab("valuation");
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "valuation"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            الأرصدة والتقييم التفصيلي
          </button>

          <button
            onClick={() => {
              sound.click();
              setTab("low");
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "low"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>نواقص المخزون</span>
            {lowCount > 0 && (
              <span
                className={`num flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  tab === "low" ? "bg-white text-primary" : "bg-amber-500 text-white"
                }`}
              >
                {lowCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.click();
              setTab("movements");
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "movements"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            سجل حركات المخزون
          </button>
        </div>

        {/* Info strip about Operations unification */}
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          لتحويل البضائع بين الفروع أو تسجيل محاضر الجرد، استخدم{" "}
          <Link to="/operations" className="font-semibold text-primary underline underline-offset-2">
            شاشة العمليات المخزنية
          </Link>
          .
        </p>
      </div>

      {/* Tab Panels */}
      {tab === "valuation" && <DetailedLedgerTab wid={wid} />}
      {tab === "low" && <LowStockAlertsTab wid={wid} />}
      {tab === "movements" && <MovementsAuditTab wid={wid} />}
    </div>
  );
}

/**
 * Itemized Stock Balance & Valuation Ledger
 */
function DetailedLedgerTab({ wid }: { wid: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // Fetch catalog products
  const productsQuery = useQuery({
    queryKey: ["inventory-ledger-products", search, page],
    queryFn: () =>
      api.get<{ items: Product[]; total: number; pages: number }>("/products", {
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      }),
  });

  const products = productsQuery.data?.items ?? [];
  const pids = products.map((p) => p.id);

  // Fetch live warehouse stock balances for this page's products
  const balancesQuery = useQuery({
    queryKey: ["inventory-ledger-balances", wid, pids],
    queryFn: () =>
      api.post<Record<string, number | boolean | Record<string, boolean>>>(
        `/stock/balance/bulk?warehouse_id=${wid}`,
        pids,
      ),
    enabled: !!wid && pids.length > 0,
  });

  const balances = (balancesQuery.data ?? {}) as Record<string, number>;

  // Combine product details with current warehouse balance
  const rows = products.map((p) => {
    const rawQty = balances[p.id];
    const qty = typeof rawQty === "number" ? rawQty : 0;
    const reorderPoint = p.reorder_point ? Number(p.reorder_point) : 5;
    const cost = Number(p.cost_price || 0);
    const retail = Number(p.retail_price || 0);
    const totalValuation = qty * cost;

    let status: "out_of_stock" | "low_stock" | "in_stock";
    if (qty <= 0) {
      status = "out_of_stock";
    } else if (qty <= reorderPoint) {
      status = "low_stock";
    } else {
      status = "in_stock";
    }

    return {
      ...p,
      currentQty: qty,
      reorderPoint,
      unitCost: cost,
      unitRetail: retail,
      totalValuation,
      status,
    };
  });

  // Filter in memory for instantaneous feel
  const filteredRows = rows.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو الباركود أو كود الصنف…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-9 text-xs"
          />
          {search && (
            <button
              onClick={() => {
                sound.click();
                setSearch("");
                setPage(1);
              }}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">الحالة:</span>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 w-36 text-xs"
          >
            <option value="all">كافة الحالات</option>
            <option value="in_stock">متوفر فقط</option>
            <option value="low_stock">منخفض المخزون</option>
            <option value="out_of_stock">نافد المخزون</option>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="تحديث البيانات"
            onClick={() => {
              sound.click();
              productsQuery.refetch();
              balancesQuery.refetch();
            }}
          >
            <RefreshCw className={`size-3.5 ${productsQuery.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Table Container */}
      {productsQuery.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <ErrorBox
          message={(productsQuery.error as Error).message}
          onRetry={() => productsQuery.refetch()}
        />
      ) : filteredRows.length === 0 ? (
        <Empty
          text="لا توجد أصناف مطابقة"
          hint={search ? "جرّب تغيير كلمات البحث أو مسح الفلاتر" : "لم يتم تسجيل أصناف في هذا المخزن بعد"}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground">
                  <TableHead className="p-3 text-start">الصنف / الكود</TableHead>
                  <TableHead className="p-3 text-center">الرصيد المتاح</TableHead>
                  <TableHead className="p-3 text-center">حد إعادة الطلب</TableHead>
                  <TableHead className="p-3 text-start">متوسط التكلفة</TableHead>
                  <TableHead className="p-3 text-start">سعر البيع</TableHead>
                  <TableHead className="p-3 text-start">إجمالي التقييم (تكلفة)</TableHead>
                  <TableHead className="p-3 text-center">حالة المخزون</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="border-b border-border/40 text-xs transition-colors hover:bg-muted/30 last:border-0"
                  >
                    {/* Product Name & SKU */}
                    <TableCell className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{r.name}</span>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          {r.code && (
                            <span className="num font-mono bg-muted/60 px-1 py-0.5 rounded">
                              {r.code}
                            </span>
                          )}
                          {r.barcode && (
                            <span className="num font-mono">{r.barcode}</span>
                          )}
                          <span>· {r.unit}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Current Available Stock */}
                    <TableCell className="p-3 text-center">
                      <span
                        className={`num text-sm font-black ${
                          r.status === "out_of_stock"
                            ? "text-destructive"
                            : r.status === "low_stock"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                        }`}
                      >
                        {fq(r.currentQty)}
                      </span>
                      <span className="ms-1 text-[10px] text-muted-foreground">{r.unit}</span>
                    </TableCell>

                    {/* Reorder Point */}
                    <TableCell className="num p-3 text-center text-xs text-muted-foreground">
                      {r.reorderPoint}
                    </TableCell>

                    {/* Unit Cost */}
                    <TableCell className="num p-3 font-medium text-foreground">
                      {moneyEGP(r.unitCost)}
                    </TableCell>

                    {/* Unit Retail */}
                    <TableCell className="num p-3 font-semibold text-primary">
                      {moneyEGP(r.unitRetail)}
                    </TableCell>

                    {/* Total Valuation */}
                    <TableCell className="num p-3 font-bold text-foreground">
                      {moneyEGP(r.totalValuation)}
                    </TableCell>

                    {/* Stock Status Badge */}
                    <TableCell className="p-3 text-center">
                      {r.status === "out_of_stock" ? (
                        <Badge variant="destructive" className="h-5 gap-1 px-2 text-[10px] font-bold">
                          <XCircle className="size-3" />
                          نفد الرصيد
                        </Badge>
                      ) : r.status === "low_stock" ? (
                        <Badge variant="warning" className="h-5 gap-1 px-2 text-[10px] font-bold">
                          <AlertTriangle className="size-3" />
                          أوشك على النفاد
                        </Badge>
                      ) : (
                        <Badge variant="success" className="h-5 gap-1 px-2 text-[10px] font-semibold">
                          <CheckCircle2 className="size-3" />
                          متوفر
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer with Summary Counts */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              عرض <span className="num font-bold text-foreground">{filteredRows.length}</span> صنف
              {productsQuery.data?.total ? (
                <> من إجمالي <span className="num font-bold text-foreground">{productsQuery.data.total}</span> صنف مسجل</>
              ) : null}
            </span>

            {/* Pagination Controls */}
            {productsQuery.data && productsQuery.data.pages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    sound.click();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className="h-7 px-2 text-xs"
                >
                  السابق
                </Button>
                <span className="num px-2 text-xs font-semibold text-foreground">
                  {page} / {productsQuery.data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= productsQuery.data.pages}
                  onClick={() => {
                    sound.click();
                    setPage((p) => p + 1);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated Low Stock Alerts Tab
 */
function LowStockAlertsTab({ wid }: { wid: string }) {
  const q = useQuery({
    queryKey: ["low-stock-full", wid],
    queryFn: () =>
      api.get<{ product_id: string; product_name: string; current_qty: number; unit: string }[]>(
        "/stock/low-stock",
        { warehouse_id: wid },
      ),
    enabled: !!wid,
  });

  return q.isLoading ? (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  ) : q.isError ? (
    <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} />
  ) : !q.data?.length ? (
    <Empty
      text="لا توجد أصناف تحت حد الطلب"
      hint="كافة الأصناف المسجلة في هذا المخزن أعلى من حد إعادة الطلب"
    />
  ) : (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
        <span className="flex items-center gap-2 font-medium">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          يوجد <strong className="num font-bold">{q.data.length}</strong> أصناف قاربت على النفاد أو نفدت تماماً وتحتاج لأمر شراء توريد.
        </span>
        <Link
          to="/purchases"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs border-amber-500/30 bg-card")}
        >
          إنشاء أمر شراء
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground">
                <TableHead className="p-3 text-start">الصنف</TableHead>
                <TableHead className="p-3 text-center">الرصيد الحالي المتاح</TableHead>
                <TableHead className="p-3 text-start">الوحدة</TableHead>
                <TableHead className="p-3 text-end">الإجراء الموصى به</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((r) => (
                <TableRow
                  key={r.product_id}
                  className="border-b border-border/40 text-xs hover:bg-muted/30 last:border-0"
                >
                  <TableCell className="p-3 font-semibold text-foreground">
                    {r.product_name}
                  </TableCell>
                  <TableCell className="num p-3 text-center font-bold text-destructive">
                    {fq(r.current_qty)}
                  </TableCell>
                  <TableCell className="p-3 text-muted-foreground">{r.unit}</TableCell>
                  <TableCell className="p-3 text-end">
                    <Link
                      to={`/purchases?product_id=${r.product_id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 gap-1 text-xs text-primary")}
                    >
                      طلب توريد
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/**
 * Stock Movements Audit Ledger Tab
 */
function MovementsAuditTab({ wid }: { wid: string }) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["movements-ledger", wid, page],
    queryFn: () =>
      api.get<{ items: Movement[]; total: number; pages: number }>("/stock/movements", {
        warehouse_id: wid,
        page,
        page_size: 40,
      }),
    enabled: !!wid,
  });

  const LABEL: Record<string, { label: string; positive: boolean }> = {
    opening_stock: { label: "رصيد افتتاحي", positive: true },
    purchase: { label: "فاتورة مشتريات (+)", positive: true },
    return_in: { label: "مرتجع مبيعات (+)", positive: true },
    adjustment_in: { label: "تسوية جرد بالزيادة (+)", positive: true },
    transfer_in: { label: "تحويل وارد من فرع (+)", positive: true },
    sale: { label: "فاتورة مبيعات (−)", positive: false },
    damage: { label: "بضاعة تالفة (−)", positive: false },
    adjustment_out: { label: "تسوية جرد بالنقص (−)", positive: false },
    transfer_out: { label: "تحويل صادر لفرع (−)", positive: false },
  };

  const movements = q.data?.items ?? [];

  return q.isLoading ? (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  ) : q.isError ? (
    <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} />
  ) : movements.length === 0 ? (
    <Empty text="لا توجد حركات مخزون مسجلة" hint="لم تتم حركات بيع أو شراء أو تحويلات بعد" />
  ) : (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground">
              <TableHead className="p-3 text-start">نوع الحركة</TableHead>
              <TableHead className="p-3 text-start">الصنف</TableHead>
              <TableHead className="p-3 text-center">الكمية</TableHead>
              <TableHead className="p-3 text-start">التاريخ والوقت</TableHead>
              <TableHead className="p-3 text-start">الملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => {
              const meta = LABEL[m.movement_type] ?? { label: m.movement_type, positive: true };
              return (
                <TableRow
                  key={m.id}
                  className="border-b border-border/40 text-xs hover:bg-muted/30 last:border-0"
                >
                  <TableCell className="p-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        meta.positive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 font-semibold text-foreground">
                    {m.product_name ?? "—"}
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <span
                      className={`num font-bold ${
                        meta.positive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {meta.positive ? "+" : "−"}
                      {fq(m.qty)}
                    </span>
                  </TableCell>
                  <TableCell className="num p-3 text-xs text-muted-foreground">
                    {dateTime(m.created_at)}
                  </TableCell>
                  <TableCell className="p-3 text-xs text-muted-foreground">
                    {m.note || "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {q.data && q.data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/20 px-4 py-2 text-xs">
          <span className="text-muted-foreground">
            إجمالي الحركات: <span className="num font-bold text-foreground">{q.data.total}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                sound.click();
                setPage((p) => Math.max(1, p - 1));
              }}
              className="h-7 px-2 text-xs"
            >
              السابق
            </Button>
            <span className="num px-2 font-semibold text-foreground">
              {page} / {q.data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= q.data.pages}
              onClick={() => {
                sound.click();
                setPage((p) => p + 1);
              }}
              className="h-7 px-2 text-xs"
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
