import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandCoins, Plus, Truck } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { D, dateTime, moneyEGP } from "@/lib/format";
import { Button, Card, Empty, ErrorBox, Input, Modal, Select, Spinner } from "@/components/ui";

interface Supplier { id: string; name: string; phone: string | null; balance: string }
interface LedgerEntry { id?: string; date?: string; created_at?: string; description?: string | null; notes?: string | null; debit?: string | null; credit?: string | null; amount?: string | null }

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [ledgerFor, setLedgerFor] = useState<Supplier | null>(null);
  const [txFor, setTxFor] = useState<Supplier | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState("credit");

  const list = useQuery({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      const res = await api.get<{ items: Supplier[] } | Supplier[]>("/suppliers", { search: search || undefined });
      return Array.isArray(res) ? res : res.items ?? [];
    },
  });
  const ledger = useQuery({
    queryKey: ["supplier-ledger", ledgerFor?.id],
    queryFn: () => api.get<LedgerEntry[]>(`/suppliers/${ledgerFor!.id}/ledger`),
    enabled: !!ledgerFor,
  });

  const create = useMutation({
    mutationFn: () => api.post("/suppliers", { name: form.name, phone: form.phone || null }),
    onSuccess: () => { setCreating(false); setForm({ name: "", phone: "" }); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
  });
  const tx = useMutation({
    mutationFn: () =>
      api.post(`/suppliers/${txFor!.id}/transactions`, {
        amount: D(txAmount).toNumber(),
        type: txType,
        notes: null,
      }),
    onSuccess: () => { setTxFor(null); setTxAmount(""); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-extrabold"><Truck size={20} /> الموردون</h1>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> مورد جديد</Button>
      </div>

      <Card className="p-3">
        <Input placeholder="ابحث بالاسم…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      ) : list.isError ? (
        <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : !list.data?.length ? (
        <Empty text="لا يوجد موردون" hint="أضف أول مورد" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الاسم</th>
                <th className="p-3 text-start">الهاتف</th>
                <th className="p-3 text-start">الرصيد</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.slice(0, 60).map((s) => (
                <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-elevated">
                  <td className="p-3 font-bold">{s.name}</td>
                  <td className="num p-3" dir="ltr">{s.phone ?? "—"}</td>
                  <td className="num p-3 font-bold text-brand">{moneyEGP(s.balance)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button className="rounded-md p-1.5 text-muted hover:bg-elevated hover:text-ink" onClick={() => setLedgerFor(s)} aria-label="كشف حساب">📒</button>
                      <button
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-brand hover:bg-elevated"
                        onClick={() => { setTxFor(s); setTxAmount(""); }}
                      >
                        <HandCoins size={16} /> حركة
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="مورد جديد">
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الهاتف</label>
            <Input className="num" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button className="w-full" disabled={create.isPending || !form.name} onClick={() => create.mutate()}>
            {create.isPending ? <Spinner /> : "حفظ"}
          </Button>
        </div>
      </Modal>

      <Modal open={!!txFor} onClose={() => setTxFor(null)} title={`حركة حساب — ${txFor?.name ?? ""}`}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">الرصيد: <span className="num font-bold text-ink">{moneyEGP(txFor?.balance ?? 0)}</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">النوع</label>
              <Select value={txType} onChange={(e) => setTxType(e.target.value)}>
                <option value="credit">دائن (علينا)</option>
                <option value="debit">مدين (لنا)</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">المبلغ</label>
              <Input className="num text-lg" inputMode="decimal" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
            </div>
          </div>
          {tx.isError && <ErrorBox message={(tx.error as Error).message} />}
          <Button className="w-full" disabled={tx.isPending || !txAmount} onClick={() => tx.mutate()}>
            {tx.isPending ? <Spinner /> : "تسجيل الحركة"}
          </Button>
        </div>
      </Modal>

      <Modal open={!!ledgerFor} onClose={() => setLedgerFor(null)} title={`كشف حساب — ${ledgerFor?.name ?? ""}`} wide>
        {ledger.isLoading ? (
          <div className="grid place-items-center p-8"><Spinner /></div>
        ) : ledger.isError ? (
          <ErrorBox message={(ledger.error as Error).message} />
        ) : !ledger.data?.length ? (
          <Empty text="لا توجد حركات" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-2 text-start">التاريخ</th>
                <th className="p-2 text-start">البيان</th>
                <th className="p-2 text-start">مدين</th>
                <th className="p-2 text-start">دائن</th>
              </tr>
            </thead>
            <tbody>
              {ledger.data.slice(0, 50).map((l, i) => (
                <tr key={l.id ?? i} className="border-b border-line/60 last:border-0">
                  <td className="p-2 text-xs text-muted">{dateTime(l.date ?? l.created_at)}</td>
                  <td className="p-2">{l.description ?? l.notes ?? "—"}</td>
                  <td className="num p-2">{l.debit ? moneyEGP(l.debit) : "—"}</td>
                  <td className="num p-2 text-success">{l.credit ? moneyEGP(l.credit) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
