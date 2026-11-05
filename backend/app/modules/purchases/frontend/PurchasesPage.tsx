import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { dateTime, D, money, moneyEGP } from "@/lib/format";
import { Badge, Button, Empty, ErrorBox, Input, Modal, Select, Spinner } from "@/components/ui";

interface PO {
  id: string; doc_number: string; supplier_name: string | null; status: string;
  total: string | null; created_at: string; notes: string | null;
}
interface Supplier { id: string; name: string }
interface Warehouse { id: string; name: string }
interface Product { id: string; name: string; code: string | null; cost_price: string }
interface LineItem { product: Product; qty: string; unit_cost: string }

export default function PurchasesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const list = useQuery({
    queryKey: ["purchases", page],
    queryFn: () => api.get<PO[]>("/purchases", { page, page_size: 25 }),
  });
  const suppliers = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const res = await api.get<{ items: Supplier[] } | Supplier[]>("/suppliers");
      return Array.isArray(res) ? res : res.items ?? [];
    },
  });
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: () => api.get<Warehouse[]>("/stock/warehouses") });
  const found = useQuery({
    queryKey: ["po-product-search", productSearch],
    queryFn: () => api.get<{ items: Product[] }>("/products", { search: productSearch, page: 1, page_size: 8 }),
    enabled: creating && productSearch.trim().length > 1,
  });

  const total = items.reduce((s, i) => s.plus(D(i.qty || "0").times(D(i.unit_cost || "0"))), D(0));

  const create = useMutation({
    mutationFn: () =>
      api.post("/purchases", {
        warehouse_id: warehouseId || warehouses.data?.[0]?.id,
        supplier_id: supplierId || null,
        notes: notes || null,
        items: items.map((i) => ({
          product_id: i.product.id,
          qty: D(i.qty || "0").toNumber(),
          unit_cost: D(i.unit_cost || "0").toNumber(),
        })).filter((i) => i.qty > 0),
      }),
    onSuccess: () => {
      setCreating(false);
      setItems([]); setNotes(""); setSupplierId(""); setProductSearch("");
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });

  const receive = useMutation({
    mutationFn: (id: string) => api.post(`/purchases/${id}/receive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">المشتريات</h1>
        <Button onClick={() => { setCreating(true); if (!warehouseId && warehouses.data?.[0]) setWarehouseId(warehouses.data[0].id); }}>
          <Plus size={16} /> أمر شراء جديد
        </Button>
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      ) : list.isError ? (
        <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : !list.data?.length ? (
        <Empty text="لا توجد أوامر شراء" hint="أنشئ أول أمر شراء" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">المستند</th>
                <th className="p-3 text-start">المورد</th>
                <th className="p-3 text-start">الإجمالي</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((po) => (
                <tr key={po.id} className="border-b border-line/60 last:border-0 hover:bg-elevated">
                  <td className="num p-3 font-bold" dir="ltr">{po.doc_number}</td>
                  <td className="p-3">{po.supplier_name ?? "—"}</td>
                  <td className="num p-3 font-bold">{po.total ? moneyEGP(po.total) : "—"}</td>
                  <td className="p-3">
                    <Badge tone={po.status === "received" ? "success" : po.status === "cancelled" ? "danger" : "brand"}>
                      {po.status === "received" ? "مستلم" : po.status === "cancelled" ? "ملغي" : po.status === "partial" ? "جزئي" : "مسودة"}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted">{dateTime(po.created_at)}</td>
                  <td className="p-3">
                    {po.status !== "received" && po.status !== "cancelled" && (
                      <Button variant="outline" onClick={() => receive.mutate(po.id)} disabled={receive.isPending}>
                        {receive.isPending ? <Spinner /> : <><PackageCheck size={16} /> استلام</>}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {receive.isError && <ErrorBox message={(receive.error as Error).message} />}

      {list.data?.length === 25 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابق</Button>
          <span className="num text-muted">صفحة {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>التالي</Button>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="أمر شراء جديد" wide>
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">المورد</label>
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">— نقدي —</option>
                {suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">المخزن</label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ملاحظات</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">إضافة منتج</label>
            <Input placeholder="ابحث بالاسم…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            {!!found.data?.items.length && (
              <div className="mt-2 grid gap-1 rounded-lg border border-line p-2">
                {found.data.items.map((p) => (
                  <button
                    key={p.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-elevated"
                    onClick={() => {
                      setItems((it) => [...it, { product: p, qty: "1", unit_cost: p.cost_price }]);
                      setProductSearch("");
                    }}
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="num text-xs text-muted">{money(p.cost_price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!!items.length && (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th className="p-2 text-start">المنتج</th>
                    <th className="p-2 text-start">الكمية</th>
                    <th className="p-2 text-start">تكلفة الوحدة</th>
                    <th className="p-2 text-start">الإجمالي</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.product.id} className="border-b border-line/60 last:border-0">
                      <td className="p-2 font-semibold">{it.product.name}</td>
                      <td className="p-2">
                        <input className="num w-20 rounded-md border border-line bg-surface p-1.5 text-center" inputMode="decimal"
                          value={it.qty} onChange={(e) => setItems((arr) => arr.map((x, j) => j === idx ? { ...x, qty: e.target.value } : x))} aria-label="الكمية" />
                      </td>
                      <td className="p-2">
                        <input className="num w-24 rounded-md border border-line bg-surface p-1.5 text-center" inputMode="decimal"
                          value={it.unit_cost} onChange={(e) => setItems((arr) => arr.map((x, j) => j === idx ? { ...x, unit_cost: e.target.value } : x))} aria-label="التكلفة" />
                      </td>
                      <td className="num p-2 font-bold">{money(D(it.qty || "0").times(D(it.unit_cost || "0")))}</td>
                      <td className="p-2">
                        <button className="rounded p-1 text-danger hover:bg-elevated" onClick={() => setItems((arr) => arr.filter((_, j) => j !== idx))} aria-label="حذف">
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-sm font-semibold text-muted-foreground">الإجمالي الكلي لأمر الشراء</span>
            <span className="num text-xl font-black text-primary">{money(total)} <span className="text-sm font-sans font-normal text-muted-foreground">ج.م</span></span>
          </div>

          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button className="w-full h-11 font-bold text-sm shadow-md" disabled={create.isPending || !items.length} onClick={() => create.mutate()}>
            {create.isPending ? <Spinner /> : "حفظ أمر الشراء"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
