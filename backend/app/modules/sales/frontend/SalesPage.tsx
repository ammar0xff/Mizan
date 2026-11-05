/**
 * PAGE CONTRACT
 * Page: المبيعات (/sales)
 * User: مدير أو محاسب يراجع الفواتير ويتعامل مع حالة واحدة (طباعة/مرتجع/إلغاء)
 * Outcome: الوصول لفاتورة محددة وتنفيذ إجراء واحد عليها
 * Primary information: رقم الفاتورة + تاريخها، العميل، الإجمالي/المتبقي، الحالة
 * Primary action (per state): populated → فتح تفاصيل الفاتورة (الصف كله)؛ filtered-empty → «مسح البحث»؛ first-empty → «ابدأ البيع»؛ error → «إعادة المحاولة»
 * Secondary action: طباعة، تحويل عرض سعر لفاتورة، تصدير Excel
 * Required states: loading (skeleton), error (retry), filtered-empty (reset), first-use-empty, populated
 * Responsive: 1440 جدول كامل + Sheet تفاصيل؛ 768 إخفاء أعمدة ثانوية؛ 390 أعمدة أساسية فقط مع قصّ الاسم المرن
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MoreHorizontal, Printer, Receipt, ShoppingCart, Undo2, Wallet } from "lucide-react";
import { api, downloadExport, openPrintDoc } from "@/lib/api";
import { dateTime, formatDateTime, moneyEGP } from "@/lib/format";
import { ListState, Money, Num, PageHeader, SearchField, StatCard, StatusBadge, TablePagination, TableShell } from "@/components/app/shared";
import { Button } from "@/components/kit/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/kit/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/kit/sheet";
import { Skeleton } from "@/components/kit/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/kit/tabs";

interface SaleRow {
  id: string; invoice_number: string; total: string; net_total: string; paid_amount: string;
  status: string; is_credit: boolean; created_at: string; customer_name: string | null;
  payment_method: string | null; sale_mode: string;
}
interface SaleItemRow {
  product_id?: string; product_name: string; qty: number;
  unit_price: string; discount: string; returned_qty?: number;
}
interface SaleDetail extends SaleRow {
  items?: SaleItemRow[];
}

const statusLabel = (s: SaleRow): string =>
  s.status === "cancelled" ? "ملغاة"
  : s.status === "quotation" ? "عرض سعر"
  : s.status === "draft" ? "مسودة"
  : s.is_credit ? "آجل"
  : "مكتملة";

export default function SalesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("invoices");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});

  const confirmQuotation = useMutation({
    mutationFn: (id: string) => api.post(`/sales/${id}/confirm-quotation`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["sale"] }); },
  });
  const cancelSale = useMutation({
    mutationFn: (id: string) => api.put(`/sales/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["sale"] }); },
  });
  const fullReturn = useMutation({
    mutationFn: (id: string) => api.post(`/sales/${id}/return`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["sale"] }); },
  });
  const partialReturn = useMutation({
    mutationFn: (id: string) =>
      api.post(`/sales/${id}/partial-return`, {
        items: Object.entries(returnQty)
          .map(([product_id, q]) => ({ product_id, qty: Number(q) }))
          .filter((i) => i.qty > 0),
      }),
    onSuccess: () => { setReturnQty({}); qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["sale"] }); },
  });

  const list = useQuery({
    queryKey: ["sales", page, search],
    queryFn: () => api.get<SaleRow[]>("/sales", { page, page_size: pageSize, search: search || undefined }),
  });
  const detail = useQuery({
    queryKey: ["sale", detailId],
    queryFn: () => api.get<SaleDetail>(`/sales/${detailId}`),
    enabled: !!detailId,
  });

  const rows = useMemo(
    () =>
      (list.data ?? []).filter((s) =>
        view === "quotations"
          ? s.status === "quotation" || s.status === "draft"
          : s.status !== "quotation" && s.status !== "draft",
      ),
    [list.data, view],
  );
  const sold = rows.filter((r) => r.status !== "cancelled" && r.status !== "quotation");
  const totalSales = sold.reduce((s, r) => s + Number(r.total), 0);
  const outstanding = sold.reduce((s, r) => s + (Number(r.total) - Number(r.paid_amount)), 0);

  const d = detail.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المبيعات"
        description="كل الفواتير وعروض الأسعار والمرتجعات"
        actions={
          <>
            <Button variant="outline" onClick={() => downloadExport("/export/sales", undefined, "sales.xlsx")}>
              <Download data-icon="inline-start" />
              تصدير
            </Button>
            <Button nativeButton={false} render={<Link to="/pos" />}>
              <ShoppingCart data-icon="inline-start" />
              فاتورة جديدة
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="إجمالي المبيعات (حسب الفلتر)" value={<Money value={totalSales} />} icon={Receipt} />
        <StatCard label="مستحقات آجلة" value={<Money value={outstanding} />} icon={Wallet} tone="warning" />
        <StatCard label="عدد الفواتير" value={<Num value={sold.length} />} icon={Undo2} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField value={search} onChange={setSearch} placeholder="رقم الفاتورة أو اسم العميل" />
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
            <TabsTrigger value="quotations">عروض الأسعار</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ListState
        status={list.isLoading ? "loading" : list.isError ? "error" : "ready"}
        isEmpty={rows.length === 0}
        onRetry={() => list.refetch()}
        emptyIcon={Receipt}
        emptyTitle={search ? "لا توجد نتائج للبحث" : "لا توجد فواتير بعد"}
        emptyDescription={search ? `لا توجد فواتير تطابق «${search}» — وسّع البحث أو امسحه للمحاولة من جديد.` : "ستظهر الفواتير هنا بمجرد تسجيل أول عملية بيع."}
        emptyAction={search ? (
          <Button variant="outline" onClick={() => { setSearch(""); setPage(1); }}>
            مسح البحث
          </Button>
        ) : (
          <Button nativeButton={false} render={<Link to="/pos" />}>
            <ShoppingCart data-icon="inline-start" />
            ابدأ البيع
          </Button>
        )}
      >
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead className="hidden lg:table-cell">الدفع</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead className="hidden sm:table-cell">الحالة</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">إجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => setDetailId(inv.id)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="num font-medium">{inv.invoice_number}</span>
                      <span className="num text-xs text-muted-foreground">{formatDateTime(inv.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-full max-w-0 truncate">{inv.customer_name ?? "عميل نقدي"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {inv.payment_method === "cash" ? "نقدي" : inv.payment_method === "wallet" ? "محفظة" : inv.is_credit ? "آجل" : inv.payment_method ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Money value={Number(inv.total)} className="font-medium" />
                      {inv.is_credit && inv.status !== "cancelled" && (
                        <span className="text-xs text-warning">
                          متبقي <Money value={Number(inv.total) - Number(inv.paid_amount)} currency={false} />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={statusLabel(inv)} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={`إجراءات ${inv.invoice_number}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setDetailId(inv.id)}>عرض التفاصيل</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintDoc(`/print/sale/${inv.id}`)}>
                            <Printer />
                            طباعة
                          </DropdownMenuItem>
                          {(inv.status === "quotation" || inv.status === "draft") && (
                            <DropdownMenuItem disabled={confirmQuotation.isPending} onClick={() => confirmQuotation.mutate(inv.id)}>
                              تحويل لفاتورة
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </ListState>

      <TablePagination
        page={page}
        pages={rows.length === pageSize ? page + 1 : page}
        onPage={(p) => setPage(p)}
        pageSize={pageSize}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
      />

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="num">فاتورة {d?.invoice_number ?? ""}</SheetTitle>
            <SheetDescription>
              {d ? `${d.sale_mode === "retail" ? "تجزئة" : "جملة"} · ${dateTime(d.created_at)}` : ""}
            </SheetDescription>
          </SheetHeader>
          {detail.isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detail.isError ? (
            <p className="p-4 text-sm text-destructive">{(detail.error as Error).message}</p>
          ) : d && (
            <div className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                  <p className="num text-sm font-semibold">{moneyEGP(d.total)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">المدفوع</p>
                  <p className="num text-sm font-semibold">{moneyEGP(d.paid_amount)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <StatusBadge status={statusLabel(d)} />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead className="text-end">السعر</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(d.items ?? []).map((it, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{it.product_name}</TableCell>
                        <TableCell className="num">{it.qty}</TableCell>
                        <TableCell className="num text-end">{moneyEGP(it.unit_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {d.status !== "cancelled" && (
                <div className="rounded-xl border p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Undo2 className="size-4" /> مرتجع جزئي
                  </p>
                  <div className="flex flex-col gap-2">
                    {(d.items ?? []).map((it, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate">
                          {it.product_name} <span className="num text-muted-foreground">(مبيع {it.qty})</span>
                        </span>
                        <input
                          className="num w-20 rounded-md border bg-transparent p-1.5 text-center"
                          inputMode="decimal"
                          placeholder="0"
                          value={returnQty[it.product_id ?? ""] ?? ""}
                          onChange={(e) => setReturnQty((r) => ({ ...r, [it.product_id ?? ""]: e.target.value }))}
                          aria-label={`كمية مرتجع ${it.product_name}`}
                        />
                      </div>
                    ))}
                  </div>
                  {partialReturn.isError && <p className="mt-2 text-sm text-destructive">{(partialReturn.error as Error).message}</p>}
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    disabled={partialReturn.isPending || !Object.values(returnQty).some((v) => Number(v) > 0)}
                    onClick={() => detailId && partialReturn.mutate(detailId)}
                  >
                    تنفيذ المرتجع الجزئي
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => detailId && openPrintDoc(`/print/sale/${detailId}`)}>
                  <Printer data-icon="inline-start" />
                  طباعة
                </Button>
                {d.status !== "cancelled" && (
                  <>
                    <Button variant="outline" disabled={fullReturn.isPending} onClick={() => detailId && fullReturn.mutate(detailId)}>
                      مرتجع كامل
                    </Button>
                    <Button variant="destructive" disabled={cancelSale.isPending} onClick={() => detailId && cancelSale.mutate(detailId)}>
                      إلغاء الفاتورة
                    </Button>
                  </>
                )}
              </div>
              {(cancelSale.isError || fullReturn.isError || partialReturn.isError) && (
                <p className="text-sm text-destructive">
                  {((cancelSale.error ?? fullReturn.error ?? partialReturn.error) as Error).message}
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
