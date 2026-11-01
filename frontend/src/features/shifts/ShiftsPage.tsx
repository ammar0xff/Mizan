import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, LockKeyhole, Printer, Unlock } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api, openPrintDoc } from "@/lib/api";
import { dateTime, D, money, moneyEGP } from "@/lib/format";
import { Badge, Button, Card, Empty, ErrorBox, Input, Select, Spinner } from "@/components/ui";
import { useBranch } from "@/components/AppShell";

interface Warehouse { id: string; name: string }
interface Shift {
  id: string; warehouse_id: string; warehouse_name?: string; status: string;
  opened_at: string; closed_at: string | null; initial_amount: string;
  closing_balance: string | null; expected_balance: string | null; difference: string | null;
}
interface Tx { id: string; tx_type: string; amount: string; note: string | null; created_at: string }

export default function ShiftsPage() {
  const qc = useQueryClient();
  const { branchId, setBranchId } = useBranch();
  const [warehouseId, setWarehouseId] = useState("");
  const [openAmount, setOpenAmount] = useState("0");
  const [closeAmount, setCloseAmount] = useState("");
  const [txType, setTxType] = useState("deposit");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");

  const wh = useQuery({ queryKey: ["warehouses"], queryFn: () => api.get<Warehouse[]>("/stock/warehouses") });
  const wid = warehouseId || branchId || wh.data?.[0]?.id || "";

  const current = useQuery({
    queryKey: ["shift", "current", wid],
    queryFn: async () => {
      try {
        return await api.get<Shift>("/shifts/current", { warehouse_id: wid });
      } catch {
        return null;
      }
    },
    enabled: !!wid,
    retry: false,
  });
  const history = useQuery({
    queryKey: ["shifts", wid],
    queryFn: () => api.get<Shift[]>("/shifts", { warehouse_id: wid }),
    enabled: !!wid,
  });
  const txs = useQuery({
    queryKey: ["shift-txs", current.data?.id],
    queryFn: () => api.get<Tx[]>(`/shifts/${current.data!.id}/transactions`),
    enabled: !!current.data?.id,
  });

  const openShift = useMutation({
    mutationFn: () => api.post("/shifts/open", { warehouse_id: wid, initial_amount: D(openAmount).toNumber() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shift"] }); qc.invalidateQueries({ queryKey: ["shifts"] }); },
  });
  const closeShift = useMutation({
    mutationFn: () => api.post(`/shifts/${current.data!.id}/close`, { closing_balance: D(closeAmount).toNumber() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shift"] }); qc.invalidateQueries({ queryKey: ["shifts"] }); },
  });
  const addTx = useMutation({
    mutationFn: () =>
      api.post(`/shifts/${current.data!.id}/transactions`, {
        type: txType,
        amount: D(txAmount).toNumber(),
        note: txNote || null,
      }),
    onSuccess: () => { setTxAmount(""); setTxNote(""); qc.invalidateQueries({ queryKey: ["shift-txs"] }); },
  });

  const shift = current.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">الورديات</h1>
        <Select
          value={wid}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setBranchId(e.target.value);
          }}
          className="w-auto"
        >
          {wh.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
      </div>

      {current.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      ) : !shift ? (
        <Card className="space-y-4">
          <p className="flex items-center gap-2 font-bold"><Unlock size={18} /> لا توجد وردية مفتوحة</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!openShift.isPending && wid) openShift.mutate();
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">العهدة الافتتاحية</label>
              <Input autoFocus className="num w-40 font-bold" inputMode="decimal" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} />
            </div>
            <Button type="submit" className="h-10 font-bold" disabled={openShift.isPending || !wid}>
              {openShift.isPending ? <Spinner /> : "فتح الوردية"}
            </Button>
          </form>
          {openShift.isError && <ErrorBox message={(openShift.error as Error).message} />}
        </Card>
      ) : (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold text-success"><Clock size={18} /> وردية مفتوحة</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openPrintDoc(`/print/shift/${shift.id}`)}>
                <Printer size={16} /> تقرير الوردية
              </Button>
            </div>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-muted">العهدة الافتتاحية</p><p className="num font-bold">{moneyEGP(shift.initial_amount)}</p></div>
            <div><p className="text-muted">الافتتاح</p><p className="text-xs">{dateTime(shift.opened_at)}</p></div>
            <div>
              <p className="text-muted">حركات الدرج</p>
              <p className="num font-bold">{txs.data?.length ?? 0}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3">
            <p className="mb-2 text-sm font-bold">حركة درج جديدة</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!addTx.isPending && txAmount) addTx.mutate();
              }}
              className="flex flex-wrap items-end gap-2"
            >
              <Select value={txType} onChange={(e) => setTxType(e.target.value)} className="w-auto">
                <option value="deposit">إيداع</option>
                <option value="withdrawal">سحب</option>
                <option value="expense">مصروف</option>
              </Select>
              <Input className="num w-32 font-bold" inputMode="decimal" placeholder="المبلغ" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
              <Input className="w-48" placeholder="ملاحظة" value={txNote} onChange={(e) => setTxNote(e.target.value)} />
              <Button type="submit" variant="outline" disabled={addTx.isPending || !txAmount}>
                {addTx.isPending ? <Spinner /> : "إضافة"}
              </Button>
            </form>
            {addTx.isError && <p className="mt-2 text-sm text-danger">{(addTx.error as Error).message}</p>}
          </div>

          {!!txs.data?.length && (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {txs.data.map((t) => (
                <li key={t.id} className="flex items-center justify-between p-3 text-sm">
                  <Badge tone={t.tx_type === "deposit" ? "success" : t.tx_type === "withdrawal" ? "warning" : "danger"}>
                    {t.tx_type === "deposit" ? "إيداع" : t.tx_type === "withdrawal" ? "سحب" : "مصروف"}
                  </Badge>
                  <span className="text-muted">{t.note ?? ""}</span>
                  <span className="num font-bold">{money(t.amount)}</span>
                  <span className="text-xs text-muted">{dateTime(t.created_at)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold"><LockKeyhole size={16} /> إغلاق الوردية</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!closeShift.isPending && closeAmount !== "") closeShift.mutate();
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">الرصيد الفعلي المعدود</label>
                <Input className="num w-40 font-bold" inputMode="decimal" value={closeAmount} onChange={(e) => setCloseAmount(e.target.value)} />
              </div>
              <Button type="submit" variant="danger" className="h-10 font-bold" disabled={closeShift.isPending || closeAmount === ""}>
                {closeShift.isPending ? <Spinner /> : "إغلاق الوردية"}
              </Button>
            </form>
            {closeShift.isError && <p className="mt-2 text-sm text-danger">{(closeShift.error as Error).message}</p>}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-bold">سجل الورديات</h2>
        {history.isLoading ? (
          <div className="grid place-items-center p-6"><Spinner /></div>
        ) : !history.data?.length ? (
          <Empty text="لا توجد ورديات سابقة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="p-2 text-start">الافتتاح</th>
                  <th className="p-2 text-start">الإغلاق</th>
                  <th className="p-2 text-start">العهدة</th>
                  <th className="p-2 text-start">رصيد الإغلاق</th>
                  <th className="p-2 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {history.data.slice(0, 20).map((s) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0">
                    <td className="p-2 text-xs text-muted">{dateTime(s.opened_at)}</td>
                    <td className="p-2 text-xs text-muted">{s.closed_at ? dateTime(s.closed_at) : "—"}</td>
                    <td className="num p-2">{money(s.initial_amount)}</td>
                    <td className="num p-2">{s.closing_balance ? money(s.closing_balance) : "—"}</td>
                    <td className="p-2">
                      <Badge tone={s.status === "open" ? "success" : "muted"}>
                        {s.status === "open" ? "مفتوحة" : "مغلقة"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
