import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Banknote, Lock, LockOpen, Plus, Wallet } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { D, dateTime, money, moneyEGP } from "@/lib/format";
import { Badge, Button, Card, Empty, ErrorBox, Input, Modal, Select, Spinner } from "@/components/ui";

interface Safe { id: string; name: string; safe_type: string; balance: string }
interface WalletRow { id: string; name: string; type: string; balance: string }
interface Expense {
  id: string; amount: string; description: string; status: string; created_at: string;
  is_recurring: boolean; category_name?: string | null; vendor_name?: string | null;
}
interface FinCategory { id: string; name: string }
interface Vendor { id: string; name: string }
interface Period { month: string; status: string }
interface LedgerRow { id?: string; date?: string; description?: string | null; debit?: string | null; credit?: string | null; balance?: string | null }

const TABS = [
  { key: "expenses", label: "المصروفات" },
  { key: "cash", label: "الخزائن والمحافظ" },
  { key: "ledger", label: "دفتر الأستاذ" },
  { key: "periods", label: "الفترات المحاسبية" },
] as const;

export default function FinancePage() {
  const [tab, setTab] = useState<string>("expenses");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">المالية</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-brand text-brand-ink" : "border border-line text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "expenses" && <ExpensesTab />}
      {tab === "cash" && <CashTab />}
      {tab === "ledger" && <LedgerTab />}
      {tab === "periods" && <PeriodsTab />}
    </div>
  );
}

/* ── Expenses ─────────────────────────────────────────── */
function ExpensesTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "", category_id: "", vendor_id: "", payment_method: "cash", is_recurring: false, recurring_interval: "monthly" });

  const list = useQuery({ queryKey: ["expenses"], queryFn: () => api.get<Expense[]>("/expenses", { page: 1, page_size: 50 }) });
  const cats = useQuery({ queryKey: ["fin-cats"], queryFn: () => api.get<FinCategory[]>("/financial-categories") });
  const vendors = useQuery({ queryKey: ["fin-vendors"], queryFn: () => api.get<Vendor[]>("/expense-vendors") });

  const create = useMutation({
    mutationFn: () =>
      api.post("/expenses", {
        amount: D(form.amount).toNumber(),
        description: form.description,
        category_id: form.category_id || undefined,
        vendor_id: form.vendor_id || undefined,
        payment_method: form.payment_method,
        is_recurring: form.is_recurring,
        recurring_interval: form.is_recurring ? form.recurring_interval : undefined,
      }),
    onSuccess: () => { setCreating(false); setForm({ amount: "", description: "", category_id: "", vendor_id: "", payment_method: "cash", is_recurring: false, recurring_interval: "monthly" }); qc.invalidateQueries({ queryKey: ["expenses"] }); },
  });
  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/expenses/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus size={16} /> مصروف جديد</Button>
      </div>
      {list.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      : list.isError ? <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      : !list.data?.length ? <Empty text="لا توجد مصروفات" />
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الوصف</th>
                <th className="p-3 text-start">المبلغ</th>
                <th className="p-3 text-start">التصنيف</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((e) => (
                <tr key={e.id} className="border-b border-line/60 last:border-0">
                  <td className="p-3 font-semibold">{e.description}{e.is_recurring && <Badge tone="brand">مكرر</Badge>}</td>
                  <td className="num p-3 font-bold text-danger">{moneyEGP(e.amount)}</td>
                  <td className="p-3 text-muted">{e.category_name ?? "—"}</td>
                  <td className="p-3"><Badge tone={e.status === "approved" ? "success" : "warning"}>{e.status === "approved" ? "معتمد" : "مسودة"}</Badge></td>
                  <td className="p-3 text-xs text-muted">{dateTime(e.created_at)}</td>
                  <td className="p-3">
                    {e.status !== "approved" && (
                      <Button variant="outline" onClick={() => approve.mutate(e.id)} disabled={approve.isPending}>اعتماد</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {approve.isError && <ErrorBox message={(approve.error as Error).message} />}

      <Modal open={creating} onClose={() => setCreating(false)} title="مصروف جديد">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!create.isPending && form.amount && form.description) create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">الوصف *</label>
            <Input autoFocus value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">المبلغ *</label>
              <Input className="num" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">طريقة الدفع</label>
              <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="cash">نقدي</option>
                <option value="wallet">محفظة</option>
                <option value="bank">تحويل بنكي</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">التصنيف</label>
              <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">— بدون —</option>
                {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">الجهة</label>
              <Select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
                <option value="">— بدون —</option>
                {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
            مصروف متكرر
          </label>
          {form.is_recurring && (
            <Select value={form.recurring_interval} onChange={(e) => setForm({ ...form, recurring_interval: e.target.value })}>
              <option value="monthly">شهري</option>
              <option value="weekly">أسبوعي</option>
              <option value="yearly">سنوي</option>
            </Select>
          )}
          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={create.isPending || !form.amount || !form.description}>
            {create.isPending ? <Spinner /> : "حفظ المصروف"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

/* ── Safes & wallets ──────────────────────────────────── */
function CashTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ kind: "deposit" | "withdraw" | "transfer"; target: Safe } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [toSafe, setToSafe] = useState("");

  const safes = useQuery({ queryKey: ["safes"], queryFn: () => api.get<Safe[]>("/safes") });
  const wallets = useQuery({ queryKey: ["wallets"], queryFn: () => api.get<WalletRow[]>("/wallets") });

  const act = useMutation({
    mutationFn: () => {
      const a = D(amount).toNumber();
      const id = modal!.target.id;
      if (modal!.kind === "deposit") return api.post(`/safes/${id}/deposit`, { amount: a, notes: note || null });
      if (modal!.kind === "withdraw") return api.post(`/safes/${id}/withdraw`, { amount: a, note: note || null });
      return api.post("/safes/transfer", { from_wallet_id: id, to_safe_id: toSafe, amount: a, note: note || null });
    },
    onSuccess: () => { setModal(null); setAmount(""); setNote(""); qc.invalidateQueries({ queryKey: ["safes"] }); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 font-bold">الخزائن</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {safes.isLoading ? <Card><Spinner /></Card>
          : safes.data?.map((s) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold"><Banknote size={18} /> {s.name}</span>
                <Badge tone="muted">{s.safe_type === "permanent" ? "دائمة" : "مؤقتة"}</Badge>
              </div>
              <p className="num text-2xl font-black text-brand">{money(s.balance)} <span className="text-sm font-normal text-muted">ج.م</span></p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setModal({ kind: "deposit", target: s })}>إيداع</Button>
                <Button variant="outline" onClick={() => setModal({ kind: "withdraw", target: s })}>سحب</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-bold">محافظ الدفع</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.data?.map((w) => (
            <Card key={w.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold"><Wallet size={18} /> {w.name}</span>
                <Badge tone="brand">{w.type}</Badge>
              </div>
              <p className="num text-xl font-black">{money(w.balance)} <span className="text-sm font-normal text-muted">ج.م</span></p>
              <Button variant="outline" onClick={() => setModal({ kind: "transfer", target: w as unknown as Safe })}>
                <ArrowLeftRight size={16} /> تحويل لخزنة
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.kind === "deposit" ? `إيداع في ${modal.target.name}` : modal?.kind === "withdraw" ? `سحب من ${modal?.target.name}` : `تحويل من ${modal?.target.name} إلى خزنة`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!act.isPending && amount && (modal?.kind !== "transfer" || toSafe)) act.mutate();
          }}
          className="flex flex-col gap-3"
        >
          {modal?.kind === "transfer" && (
            <div>
              <label className="mb-1 block text-sm font-medium">إلى خزنة</label>
              <Select value={toSafe} onChange={(e) => setToSafe(e.target.value)}>
                <option value="">— اختر —</option>
                {safes.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">المبلغ</label>
            <Input autoFocus className="num text-lg font-bold" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظة</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {act.isError && <ErrorBox message={(act.error as Error).message} />}
          <Button
            type="submit"
            className="w-full h-10 font-bold"
            disabled={act.isPending || !amount || (modal?.kind === "transfer" && !toSafe)}
          >
            {act.isPending ? <Spinner /> : "تنفيذ"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

/* ── Ledger ───────────────────────────────────────────── */
function LedgerTab() {
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(iso(today));

  const ledger = useQuery({
    queryKey: ["fin-ledger", from, to],
    queryFn: () => api.get<LedgerRow[]>("/financial-ledger", { from_date: from, to_date: to }),
  });
  const profit = useQuery({
    queryKey: ["profit", from, to],
    queryFn: () => api.get<Record<string, string>>("/reports/profit", { from_date: from, to_date: to }),
  });

  const totalDebit = (ledger.data ?? []).reduce((s, r) => s + Number(r.debit ?? 0), 0);
  const totalCredit = (ledger.data ?? []).reduce((s, r) => s + Number(r.credit ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">من</label>
          <Input type="date" className="num w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">إلى</label>
          <Input type="date" className="num w-44" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      {profit.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(profit.data).slice(0, 3).map(([k, v]) => (
            <Card key={k}>
              <p className="text-xs text-muted">{k}</p>
              <p className="num text-xl font-black">{money(v)}</p>
            </Card>
          ))}
        </div>
      )}

      {ledger.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      : ledger.isError ? <ErrorBox message={(ledger.error as Error).message} onRetry={() => ledger.refetch()} />
      : !ledger.data?.length ? <Empty text="لا توجد حركات في هذه الفترة" />
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">البيان</th>
                <th className="p-3 text-start">مدين</th>
                <th className="p-3 text-start">دائن</th>
              </tr>
            </thead>
            <tbody>
              {ledger.data.slice(0, 100).map((r, i) => (
                <tr key={r.id ?? i} className="border-b border-line/60 last:border-0">
                  <td className="p-3 text-xs text-muted">{r.date ? dateTime(r.date) : "—"}</td>
                  <td className="p-3">{r.description ?? "—"}</td>
                  <td className="num p-3">{r.debit ? money(r.debit) : "—"}</td>
                  <td className="num p-3 text-success">{r.credit ? money(r.credit) : "—"}</td>
                </tr>
              ))}
              <tr className="bg-elevated font-black">
                <td className="p-3" colSpan={2}>الإجمالي</td>
                <td className="num p-3">{money(totalDebit)}</td>
                <td className="num p-3 text-success">{money(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Accounting periods ───────────────────────────────── */
function PeriodsTab() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["periods"], queryFn: () => api.get<Period[]>("/periods") });
  const act = useMutation({
    mutationFn: ({ month, verb }: { month: string; verb: "close" | "reopen" }) => api.post(`/periods/${month}/${verb}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["periods"] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">إغلاق الشهر يمنع أي عمليات مالية عليه. الشهر المغلق يمكن إعادة فتحه.</p>
      {list.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      : list.isError ? <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      : !list.data?.length ? <Empty text="لا توجد فترات محاسبية" />
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الشهر</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((p) => (
                <tr key={p.month} className="border-b border-line/60 last:border-0">
                  <td className="num p-3 font-bold" dir="ltr">{p.month}</td>
                  <td className="p-3">
                    <Badge tone={p.status === "closed" ? "danger" : "success"}>
                      {p.status === "closed" ? "مغلق" : "مفتوح"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {p.status === "closed" ? (
                      <Button variant="outline" onClick={() => act.mutate({ month: p.month, verb: "reopen" })} disabled={act.isPending}>
                        <LockOpen size={16} /> إعادة فتح
                      </Button>
                    ) : (
                      <Button variant="danger" onClick={() => act.mutate({ month: p.month, verb: "close" })} disabled={act.isPending}>
                        <Lock size={16} /> إغلاق الشهر
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {act.isError && <ErrorBox message={(act.error as Error).message} />}
    </div>
  );
}
