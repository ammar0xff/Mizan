import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  FileText,
  HandCoins,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { Badge } from "@/components/kit/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";
import { api } from "@/lib/api";
import { D, dateTime, moneyEGP } from "@/lib/format";
import { Button, Card, Empty, ErrorBox, Input, Modal, Select, Spinner, useToast } from "@/components/ui";
import { sound } from "@/lib/sound";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  balance: string;
}

interface LedgerEntry {
  id?: string;
  date?: string;
  created_at?: string;
  description?: string | null;
  notes?: string | null;
  debit?: string | null;
  credit?: string | null;
  amount?: string | null;
}

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [ledgerFor, setLedgerFor] = useState<Supplier | null>(null);
  const [txFor, setTxFor] = useState<Supplier | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"credit" | "debit">("credit");

  const list = useQuery({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      const res = await api.get<{ items: Supplier[] } | Supplier[]>("/suppliers", {
        search: search.trim() || undefined,
      });
      return Array.isArray(res) ? res : res.items ?? [];
    },
  });

  const ledger = useQuery({
    queryKey: ["supplier-ledger", ledgerFor?.id],
    queryFn: () => api.get<LedgerEntry[]>(`/suppliers/${ledgerFor!.id}/ledger`),
    enabled: !!ledgerFor,
  });

  const { toast } = useToast();

  const create = useMutation({
    mutationFn: () => api.post("/suppliers", { name: form.name, phone: form.phone || null }),
    onSuccess: () => {
      sound.success();
      setCreating(false);
      setForm({ name: "", phone: "" });
      toast("success", "تمت إضافة المورد بنجاح");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: () => sound.error(),
  });

  const tx = useMutation({
    mutationFn: () =>
      api.post(`/suppliers/${txFor!.id}/transactions`, {
        amount: D(txAmount).toNumber(),
        type: txType,
        notes: null,
      }),
    onSuccess: () => {
      sound.success();
      setTxFor(null);
      setTxAmount("");
      toast("success", "تم تسجيل حركة الحساب بنجاح");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: () => sound.error(),
  });

  // Calculate Accounts Payable (AP) KPIs
  const suppliers = list.data ?? [];
  const totalPayables = suppliers.reduce(
    (acc, s) => acc + Math.max(0, parseFloat(s.balance || "0")),
    0,
  );
  const dueCount = suppliers.filter((s) => parseFloat(s.balance || "0") > 0).length;
  const settledCount = suppliers.filter((s) => parseFloat(s.balance || "0") <= 0).length;
  const totalSuppliers = suppliers.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <Truck className="size-6 text-primary" aria-hidden />
            الموردون والالتزامات التجارية (AP)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            إدارة حسابات الموردين، متابعة التزامات الشراء، وتسجيل دفعات السداد
          </p>
        </div>

        <Button
          onClick={() => {
            sound.click();
            setCreating(true);
          }}
          className="gap-2 font-semibold"
        >
          <Plus className="size-4" />
          مورد جديد
        </Button>
      </div>

      {/* AP Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">إجمالي الالتزامات للموردين</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-destructive">
            {moneyEGP(totalPayables)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/80">مبالغ مستحقة السداد للشركات</p>
        </Card>

        <Card className={`p-4 ${dueCount > 0 ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10" : ""}`}>
          <p className="text-[11px] font-medium text-muted-foreground">موردون لهم مستحقات</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className={`num text-xl font-bold tracking-tight ${dueCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {dueCount}
            </p>
            <span className="text-[11px] text-muted-foreground">
              من أصل <span className="num font-semibold">{totalSuppliers}</span>
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/80">تتطلب تسوية دفعات نقدية</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">حسابات مسواة بالكامل</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {settledCount}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            <CheckCircle2 className="size-3 text-emerald-500" />
            لا توجد مبالغ مستحقة عليهم
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">إجمالي الموردين المعتمدين</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-foreground">
            {totalSuppliers}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/80">شركات وتجار جملة مسجلين</p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative rounded-xl border border-border/80 bg-card p-2.5 shadow-xs">
        <Search className="absolute start-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم المورد أو رقم الهاتف…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-10 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        {search && (
          <button
            onClick={() => {
              sound.click();
              setSearch("");
            }}
            className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="مسح البحث"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suppliers List Table */}
      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : suppliers.length === 0 ? (
        <Empty
          text="لا يوجد موردون مطابقون"
          hint={search ? "جرّب البحث بكلمة أخرى" : "اضغط على «مورد جديد» لتسجيل أول مورد في شبكتك"}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground">
                  <TableHead className="p-3 text-start">المورد / الشركة</TableHead>
                  <TableHead className="p-3 text-start">الهاتف</TableHead>
                  <TableHead className="p-3 text-start">الرصيد المستحق (دائن)</TableHead>
                  <TableHead className="p-3 text-center">حالة السداد</TableHead>
                  <TableHead className="p-3 text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => {
                  const bal = parseFloat(s.balance || "0");
                  const isDue = bal > 0;

                  return (
                    <TableRow
                      key={s.id}
                      className="border-b border-border/40 text-xs transition-colors hover:bg-muted/30 last:border-0"
                    >
                      <TableCell className="p-3 font-semibold text-foreground">
                        {s.name}
                      </TableCell>

                      <TableCell className="num p-3 text-xs text-muted-foreground" dir="ltr">
                        {s.phone ?? "—"}
                      </TableCell>

                      <TableCell className="num p-3 font-bold">
                        <span className={isDue ? "text-destructive" : "text-muted-foreground"}>
                          {moneyEGP(s.balance)}
                        </span>
                      </TableCell>

                      <TableCell className="p-3 text-center">
                        {isDue ? (
                          <Badge variant="warning" className="h-5 gap-1 px-2 text-[10px] font-bold">
                            <Clock className="size-3" />
                            مستحق السداد
                          </Badge>
                        ) : (
                          <Badge variant="success" className="h-5 gap-1 px-2 text-[10px] font-semibold">
                            <CheckCircle2 className="size-3" />
                            خالص
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              sound.click();
                              setLedgerFor(s);
                            }}
                          >
                            <FileText className="size-3.5" />
                            كشف حساب
                          </Button>

                          <Button
                            className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
                            onClick={() => {
                              sound.click();
                              setTxFor(s);
                              setTxAmount("");
                              setTxType("debit"); // default to paying off supplier (debit)
                            }}
                          >
                            <HandCoins className="size-3.5" />
                            حركة حساب / سداد
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create Supplier Dialog */}
      <Modal open={creating} onClose={() => setCreating(false)} title="إضافة مورد جديد">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!create.isPending && form.name) create.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              اسم المورد أو الشركة المصنعة *
            </label>
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: شركة الأهرام للمستلزمات الكهربائية"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              رقم الهاتف / مسؤول المبيعات
            </label>
            <Input
              className="num text-xs"
              dir="ltr"
              placeholder="01112345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {create.isError && <ErrorBox message={(create.error as Error).message} />}

          <Button
            type="submit"
            className="w-full h-10 font-bold"
            disabled={create.isPending || !form.name.trim()}
          >
            {create.isPending ? <Spinner /> : "حفظ المورد"}
          </Button>
        </form>
      </Modal>

      {/* Record Transaction / Payment Dialog */}
      <Modal
        open={!!txFor}
        onClose={() => setTxFor(null)}
        title={`حركة حساب المورد — ${txFor?.name ?? ""}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!tx.isPending && txAmount) tx.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
            <span className="text-muted-foreground">الرصيد القائم الحالي: </span>
            <strong className="num text-sm font-bold text-destructive">
              {moneyEGP(txFor?.balance ?? 0)}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                نوع الحركة
              </label>
              <Select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="h-10 text-xs font-medium"
              >
                <option value="debit">سداد دفعة للمورد (مدين − يخفّض الدين)</option>
                <option value="credit">استحقاق فاتورة توريد (دائن + يزيد الدين)</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                المبلغ (ج.م) *
              </label>
              <Input
                autoFocus
                className="num text-lg font-bold"
                inputMode="decimal"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {tx.isError && <ErrorBox message={(tx.error as Error).message} />}

          <Button
            type="submit"
            className="w-full h-10 font-bold"
            disabled={tx.isPending || !txAmount}
          >
            {tx.isPending ? <Spinner /> : "تسجيل الحركة في الحساب"}
          </Button>
        </form>
      </Modal>

      {/* Supplier Account Ledger Dialog */}
      <Modal
        open={!!ledgerFor}
        onClose={() => setLedgerFor(null)}
        title={`كشف حساب المورد — ${ledgerFor?.name ?? ""}`}
        wide
      >
        {ledger.isLoading ? (
          <div className="grid place-items-center p-8">
            <Spinner />
          </div>
        ) : ledger.isError ? (
          <ErrorBox message={(ledger.error as Error).message} />
        ) : !ledger.data?.length ? (
          <Empty text="لا توجد حركات مسجلة" hint="لم تتم حركات توريد أو سداد لهذا المورد بعد" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/80">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground">
                    <TableHead className="p-3 text-start">التاريخ والوقت</TableHead>
                    <TableHead className="p-3 text-start">البيان / الفاتورة</TableHead>
                    <TableHead className="p-3 text-start">مسدد للمورد (مدين)</TableHead>
                    <TableHead className="p-3 text-start">مستحق للمورد (دائن)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.data.map((l, i) => (
                    <TableRow
                      key={l.id ?? i}
                      className="border-b border-border/40 text-xs hover:bg-muted/30 last:border-0"
                    >
                      <TableCell className="num p-3 text-xs text-muted-foreground">
                        {dateTime(l.created_at ?? l.date ?? "")}
                      </TableCell>
                      <TableCell className="p-3 font-medium text-foreground">
                        {l.description ?? l.notes ?? "—"}
                      </TableCell>
                      <TableCell className="num p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {l.debit ? moneyEGP(l.debit) : "—"}
                      </TableCell>
                      <TableCell className="num p-3 font-bold text-destructive">
                        {l.credit ? moneyEGP(l.credit) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
