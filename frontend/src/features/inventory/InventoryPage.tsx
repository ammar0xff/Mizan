import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api, openPrintDoc } from "@/lib/api";
import { D, dateTime, moneyEGP, qty as fq } from "@/lib/format";
import { Button, Card, Empty, ErrorBox, Input, Select, Spinner } from "@/components/ui";

interface Warehouse { id: string; name: string }
interface Product { id: string; name: string; code: string | null; cost_price: string }
interface Movement { id: string; product_name?: string; movement_type: string; qty: string; created_at: string; note?: string | null }

export default function InventoryPage() {
  const [tab, setTab] = useState("valuation");
  const wh = useQuery({ queryKey: ["warehouses"], queryFn: () => api.get<Warehouse[]>("/stock/warehouses") });
  const [wid, setWid] = useState("");
  if (!wid && wh.data?.length) setWid(wh.data[0].id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">المخزون</h1>
        <Select value={wid} onChange={(e) => setWid(e.target.value)} className="w-auto">
          {wh.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "valuation", l: "التقييم" },
          { k: "low", l: "نقص المخزون" },
          { k: "transfer", l: "تحويل بين الفروع" },
          { k: "adjust", l: "تسوية جرد" },
          { k: "movements", l: "حركة المخزون" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.k ? "bg-brand text-brand-ink" : "border border-line text-muted hover:text-ink"}`}
          >
            {t.l}
          </button>
        ))}
      </div>
      {tab === "valuation" && <ValuationTab wid={wid} />}
      {tab === "low" && <LowTab wid={wid} />}
      {tab === "transfer" && <TransferTab />}
      {tab === "adjust" && <AdjustTab wid={wid} />}
      {tab === "movements" && <MovementsTab wid={wid} />}
    </div>
  );
}

function ValuationTab({ wid }: { wid: string }) {
  const v = useQuery({
    queryKey: ["valuation", wid],
    queryFn: () => api.get<{ total_cost_value: number; total_retail_value: number; product_count: number }>("/stock/valuation", { warehouse_id: wid }),
    enabled: !!wid,
  });

  return (
    <div className="flex flex-col gap-6">
      {v.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : v.isError ? (
        <ErrorBox message={(v.error as Error).message} onRetry={() => v.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><p className="text-xs text-muted">قيمة المخزون بالتكلفة</p><p className="num text-xl font-black">{moneyEGP(v.data?.total_cost_value ?? 0)}</p></Card>
          <Card><p className="text-xs text-muted">قيمة المخزون بالبيع</p><p className="num text-xl font-black text-brand">{moneyEGP(v.data?.total_retail_value ?? 0)}</p></Card>
          <Card><p className="text-xs text-muted">عدد الأصناف المتتبعة</p><p className="num text-xl font-black">{v.data?.product_count ?? 0}</p></Card>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        التقييم الإجمالي للفرع — تقرير الأصناف بالتفصيل متاح من
        {" "}<button className="font-semibold text-primary hover:underline" onClick={() => openPrintDoc("/reports/inventory/print", { warehouse_id: wid })}>تقرير الجرد المطبوع</button>.
      </p>
    </div>
  );
}

function LowTab({ wid }: { wid: string }) {
  const q = useQuery({
    queryKey: ["low-stock", wid],
    queryFn: () => api.get<{ product_id: string; product_name: string; current_qty: number; unit: string }[]>("/stock/low-stock", { warehouse_id: wid }),
    enabled: !!wid,
  });
  return q.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
    : q.isError ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} />
    : !q.data?.length ? <Empty text="لا توجد أصناف تحت الحد" hint="كل الأصناف فوق حد الطلب في هذا الفرع" />
    : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="p-3 text-start">الصنف</th>
              <th className="p-3 text-start">المتاح</th>
              <th className="p-3 text-start">الوحدة</th>
            </tr>
          </thead>
          <tbody>
            {q.data.slice(0, 60).map((r) => (
              <tr key={r.product_id} className="border-b border-line/60 last:border-0">
                <td className="p-3 font-semibold">{r.product_name}</td>
                <td className="num p-3 font-bold text-destructive">{fq(r.current_qty)}</td>
                <td className="p-3 text-muted-foreground">{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
}

function TransferTab() {
  const qc = useQueryClient();
  const wh = useQuery({ queryKey: ["warehouses"], queryFn: () => api.get<Warehouse[]>("/stock/warehouses") });
  const [form, setForm] = useState({ product_id: "", from: "", to: "", qty: "", note: "" });
  const [search, setSearch] = useState("");

  const found = useQuery({
    queryKey: ["inv-product-search", search],
    queryFn: () => api.get<{ items: Product[] }>("/products", { search, page: 1, page_size: 8 }),
    enabled: search.trim().length > 1,
  });

  const transfer = useMutation({
    mutationFn: () =>
      api.post("/stock/transfer", {
        product_id: form.product_id,
        from_warehouse_id: form.from,
        to_warehouse_id: form.to,
        qty: D(form.qty).toNumber(),
        note: form.note || undefined,
      }),
    onSuccess: () => { setForm({ product_id: "", from: "", to: "", qty: "", note: "" }); setSearch(""); qc.invalidateQueries({ queryKey: ["valuation"] }); },
  });

  return (
    <Card className="max-w-xl space-y-3">
      <p className="flex items-center gap-2 font-bold"><ArrowLeftRight size={18} /> تحويل مخزون بين فرعين</p>
      <div>
        <label className="mb-1 block text-sm font-medium">المنتج</label>
        {form.product_id ? (
          <div className="flex items-center justify-between rounded-lg border border-line bg-elevated p-2 text-sm">
            <span className="font-bold">{found.data?.items.find((p) => p.id === form.product_id)?.name ?? form.product_id}</span>
            <button className="text-xs text-danger" onClick={() => setForm({ ...form, product_id: "" })}>تغيير</button>
          </div>
        ) : (
          <>
            <Input placeholder="ابحث بالاسم…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {!!found.data?.items.length && (
              <div className="mt-2 grid gap-1 rounded-lg border border-line p-2">
                {found.data.items.map((p) => (
                  <button key={p.id} className="rounded-md px-2 py-1.5 text-start text-sm hover:bg-elevated" onClick={() => setForm({ ...form, product_id: p.id })}>
                    {p.name} <span className="num text-xs text-muted">{p.code}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">من فرع</label>
          <Select value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}>
            <option value="">— اختر —</option>
            {wh.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">إلى فرع</label>
          <Select value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>
            <option value="">— اختر —</option>
            {wh.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">الكمية</label>
          <Input className="num" inputMode="decimal" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ملاحظة</label>
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </div>
      {transfer.isError && <ErrorBox message={(transfer.error as Error).message} />}
      {transfer.isSuccess && <Card className="border-success/40 bg-success/10 p-3 text-sm">تم التحويل بنجاح</Card>}
      <Button
        className="w-full"
        disabled={transfer.isPending || !form.product_id || !form.from || !form.to || !form.qty || form.from === form.to}
        onClick={() => transfer.mutate()}
      >
        {transfer.isPending ? <Spinner /> : "تنفيذ التحويل"}
      </Button>
    </Card>
  );
}

function AdjustTab({ wid }: { wid: string }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<{ product_id: string; name: string; qty: string; type: "adjustment_in" | "adjustment_out" }[]>([]);
  const [search, setSearch] = useState("");

  const found = useQuery({
    queryKey: ["adj-product-search", search],
    queryFn: () => api.get<{ items: Product[] }>("/products", { search, page: 1, page_size: 8 }),
    enabled: search.trim().length > 1,
  });

  const save = useMutation({
    mutationFn: () =>
      api.post("/stock/adjustment/bulk", rows.map((r) => ({
        product_id: r.product_id,
        warehouse_id: wid,
        movement_type: r.type,
        qty: D(r.qty).toNumber(),
      }))),
    onSuccess: () => { setRows([]); setSearch(""); qc.invalidateQueries({ queryKey: ["valuation"] }); },
  });

  return (
    <Card className="max-w-2xl space-y-3">
      <p className="flex items-center gap-2 font-bold"><SlidersHorizontal size={18} /> تسوية جرد — {wh0(wid)}</p>
      <Input placeholder="ابحث عن منتج لإضافته…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {!!found.data?.items.length && !search.startsWith(" ") && (
        <div className="grid gap-1 rounded-lg border border-line p-2">
          {found.data.items.map((p) => (
            <button
              key={p.id}
              className="rounded-md px-2 py-1.5 text-start text-sm hover:bg-elevated"
              onClick={() => {
                if (!rows.find((r) => r.product_id === p.id)) {
                  setRows((rs) => [...rs, { product_id: p.id, name: p.name, qty: "", type: "adjustment_in" }]);
                }
                setSearch("");
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {!!rows.length && (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.product_id} className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.name}</span>
              <Select
                className="w-auto"
                value={r.type}
                onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, type: e.target.value as "adjustment_in" | "adjustment_out" } : x))}
              >
                <option value="adjustment_in">زيادة</option>
                <option value="adjustment_out">نقص</option>
              </Select>
              <Input
                className="num w-24" inputMode="decimal" placeholder="الكمية"
                value={r.qty}
                onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))}
              />
              <button className="rounded p-1 text-danger" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="حذف">✕</button>
            </div>
          ))}
        </div>
      )}
      {save.isError && <ErrorBox message={(save.error as Error).message} />}
      {save.isSuccess && <Card className="border-success/40 bg-success/10 p-3 text-sm">تم حفظ التسوية</Card>}
      <Button className="w-full" disabled={save.isPending || !rows.length || rows.some((r) => !r.qty)} onClick={() => save.mutate()}>
        {save.isPending ? <Spinner /> : `حفظ التسوية (${rows.length} صنف)`}
      </Button>
    </Card>
  );
}

function wh0(_wid: string) { return "للفرع المحدد أعلى الصفحة"; }

function MovementsTab({ wid }: { wid: string }) {
  const q = useQuery({
    queryKey: ["movements", wid],
    queryFn: () => api.get<Movement[]>("/stock/movements", { warehouse_id: wid, page: 1, page_size: 50 }),
    enabled: !!wid,
  });
  const LABEL: Record<string, string> = {
    opening_stock: "رصيد افتتاحي", purchase: "شراء", return_in: "مرتجع داخل", adjustment_in: "تسوية +",
    transfer_in: "تحويل داخل", sale: "بيع", damage: "تالف", adjustment_out: "تسوية −", transfer_out: "تحويل خارج",
  };
  return q.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
    : q.isError ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} />
    : !q.data?.length ? <Empty text="لا توجد حركات" />
    : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="p-3 text-start">النوع</th>
              <th className="p-3 text-start">الكمية</th>
              <th className="p-3 text-start">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((m) => (
              <tr key={m.id} className="border-b border-line/60 last:border-0">
                <td className="p-3 font-semibold">{LABEL[m.movement_type] ?? m.movement_type}</td>
                <td className="num p-3 font-bold">{fq(m.qty)}</td>
                <td className="p-3 text-xs text-muted">{dateTime(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
}
