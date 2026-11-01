import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandCoins, Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { D, moneyEGP, dateTime } from "@/lib/format";
import { Button, Card, Empty, ErrorBox, Input, Modal, Spinner, useToast } from "@/components/ui";

interface Customer { id: string; name: string; phone: string | null; balance: string; credit_limit: string | null }
interface LedgerEntry { id: string; description: string | null; debit: string | null; credit: string | null; created_at: string }

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", credit_limit: "" });
  const [ledgerFor, setLedgerFor] = useState<Customer | null>(null);
  const [payFor, setPayFor] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const list = useQuery({
    queryKey: ["customers", search],
    queryFn: () => api.get<Customer[]>("/customers", { search: search || undefined }),
  });

  const ledger = useQuery({
    queryKey: ["customer-ledger", ledgerFor?.id],
    queryFn: () => api.get<LedgerEntry[]>(`/customers/${ledgerFor!.id}/ledger`),
    enabled: !!ledgerFor,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/customers", {
        name: form.name,
        phone: form.phone || null,
        credit_limit: form.credit_limit ? D(form.credit_limit).toNumber() : null,
      }),
    onSuccess: () => { setCreating(false); setForm({ name: "", phone: "", credit_limit: "" }); qc.invalidateQueries({ queryKey: ["customers"] }); },
  });

  const { toast } = useToast();
  const pay = useMutation({
    mutationFn: () => api.post(`/customers/${payFor!.id}/payments`, { amount: D(payAmount).toNumber() }),
    onSuccess: () => { setPayFor(null); setPayAmount(""); toast("success", "تم تسجيل الدفعة"); qc.invalidateQueries({ queryKey: ["customers"] }); },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-extrabold"><Users size={20} /> العملاء</h1>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> عميل جديد</Button>
      </div>

      <Card className="p-3">
        <Input placeholder="ابحث بالاسم أو الهاتف…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      ) : list.isError ? (
        <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : !list.data?.length ? (
        <Empty text="لا يوجد عملاء" hint="أضف أول عميل" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الاسم</th>
                <th className="p-3 text-start">الهاتف</th>
                <th className="p-3 text-start">الرصيد (مدين)</th>
                <th className="hidden p-3 text-start sm:table-cell">حد الائتمان</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.slice(0, 60).map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-elevated">
                  <td className="w-full max-w-0 truncate p-3 font-bold">{c.name}</td>
                  <td className="num p-3" dir="ltr">{c.phone ?? "—"}</td>
                  <td className="num p-3 font-bold text-brand">{moneyEGP(c.balance)}</td>
                  <td className="num hidden p-3 text-muted sm:table-cell">{c.credit_limit ? moneyEGP(c.credit_limit) : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button className="rounded-md p-1.5 text-muted hover:bg-elevated hover:text-ink" onClick={() => setLedgerFor(c)} aria-label="كشف حساب">📒</button>
                      <button
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-brand hover:bg-elevated"
                        onClick={() => { setPayFor(c); setPayAmount(""); }}
                      >
                        <HandCoins size={16} /> تحصيل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create */}
      {/* Create */}
      <Modal open={creating} onClose={() => setCreating(false)} title="عميل جديد">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!create.isPending && form.name) create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم *</label>
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">الهاتف</label>
              <Input className="num" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">حد الائتمان</label>
              <Input className="num" inputMode="decimal" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
            </div>
          </div>
          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={create.isPending || !form.name}>
            {create.isPending ? <Spinner /> : "حفظ العميل"}
          </Button>
        </form>
      </Modal>

      {/* Payment */}
      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={`تحصيل دفعة — ${payFor?.name ?? ""}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!pay.isPending && payAmount) pay.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-sm text-muted-foreground">الرصيد الحالي: <span className="num font-bold text-foreground">{moneyEGP(payFor?.balance ?? 0)}</span></p>
          <div>
            <label className="mb-1 block text-sm font-medium">المبلغ المحصّل</label>
            <Input autoFocus className="num text-lg font-bold" inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </div>
          {pay.isError && <ErrorBox message={(pay.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={pay.isPending || !payAmount}>
            {pay.isPending ? <Spinner /> : "تسجيل الدفعة"}
          </Button>
        </form>
      </Modal>

      {/* Ledger */}
      <Modal open={!!ledgerFor} onClose={() => setLedgerFor(null)} title={`كشف حساب — ${ledgerFor?.name ?? ""}`} wide>
        {ledger.isLoading ? (
          <div className="grid place-items-center p-8"><Spinner /></div>
        ) : ledger.isError ? (
          <ErrorBox message={(ledger.error as Error).message} />
        ) : !ledger.data?.length ? (
          <Empty text="لا توجد حركات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted-foreground bg-secondary/30">
                  <th className="p-2.5 text-start font-semibold">التاريخ</th>
                  <th className="p-2.5 text-start font-semibold">البيان</th>
                  <th className="p-2.5 text-start font-semibold">مدين</th>
                  <th className="p-2.5 text-start font-semibold">دائن</th>
                </tr>
              </thead>
              <tbody>
                {ledger.data.slice(0, 50).map((l) => (
                  <tr key={l.id} className="border-b border-line/60 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-2.5 text-xs text-muted-foreground">{dateTime(l.created_at)}</td>
                    <td className="p-2.5 font-medium">{l.description ?? "—"}</td>
                    <td className="num p-2.5 font-bold">{l.debit ? moneyEGP(l.debit) : "—"}</td>
                    <td className="num p-2.5 font-bold text-success">{l.credit ? moneyEGP(l.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
