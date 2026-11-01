import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarSync, Plus, Upload, UserPlus, Usb } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { D, date as fmtDate, dateTime, money, moneyEGP } from "@/lib/format";
import { Badge, Button, Card, Empty, ErrorBox, Input, Modal, Select, Spinner } from "@/components/ui";

interface Employee { id: string; emp_code: string | null; name: string; position: string | null; monthly_salary: string; is_active: boolean }
interface Attendance { id: string; employee_id: string; work_date: string; check_in: string | null; check_out: string | null; status: string }
interface Advance { id: string; employee_id: string; amount: string; date: string; note: string | null }
interface SyncLog { id: string; synced_at: string; status: string; fetched: number; added: number; updated: number; message: string | null }

export default function HrPage() {
  const [tab, setTab] = useState("employees");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">الموارد البشرية</h1>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "employees", l: "الموظفون" },
          { k: "attendance", l: "الحضور" },
          { k: "advances", l: "السلف" },
          { k: "sync", l: "المزامنة والجهاز" },
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
      {tab === "employees" && <EmployeesTab />}
      {tab === "attendance" && <AttendanceTab />}
      {tab === "advances" && <AdvancesTab />}
      {tab === "sync" && <SyncTab />}
    </div>
  );
}

function EmployeesTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", emp_code: "", position: "", monthly_salary: "" });

  const list = useQuery({ queryKey: ["hr-employees"], queryFn: () => api.get<Employee[]>("/hr/employees") });
  const create = useMutation({
    mutationFn: () =>
      api.post("/hr/employees", {
        name: form.name,
        emp_code: form.emp_code || undefined,
        position: form.position || undefined,
        monthly_salary: form.monthly_salary ? D(form.monthly_salary).toNumber() : undefined,
      }),
    onSuccess: () => { setCreating(false); setForm({ name: "", emp_code: "", position: "", monthly_salary: "" }); qc.invalidateQueries({ queryKey: ["hr-employees"] }); },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><UserPlus size={16} /> موظف جديد</Button>
      </div>
      {list.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      : list.isError ? <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      : !list.data?.length ? <Empty text="لا يوجد موظفون" />
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الكود</th>
                <th className="p-3 text-start">الاسم</th>
                <th className="p-3 text-start">الوظيفة</th>
                <th className="p-3 text-start">الراتب الشهري</th>
                <th className="p-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((e) => (
                <tr key={e.id} className="border-b border-line/60 last:border-0">
                  <td className="num p-3 text-muted" dir="ltr">{e.emp_code ?? "—"}</td>
                  <td className="p-3 font-bold">{e.name}</td>
                  <td className="p-3">{e.position ?? "—"}</td>
                  <td className="num p-3 font-bold">{moneyEGP(e.monthly_salary)}</td>
                  <td className="p-3"><Badge tone={e.is_active ? "success" : "muted"}>{e.is_active ? "نشط" : "موقوف"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="موظف جديد">
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
              <label className="mb-1 block text-sm font-medium">الكود</label>
              <Input dir="ltr" value={form.emp_code} onChange={(e) => setForm({ ...form, emp_code: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">الوظيفة</label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الراتب الشهري</label>
            <Input className="num" inputMode="decimal" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} />
          </div>
          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={create.isPending || !form.name}>
            {create.isPending ? <Spinner /> : "حفظ الموظف"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function AttendanceTab() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ employee_id: "", work_date: "", check_in: "", check_out: "", status: "present" });

  const employees = useQuery({ queryKey: ["hr-employees"], queryFn: () => api.get<Employee[]>("/hr/employees") });
  const att = useQuery({
    queryKey: ["hr-attendance", month],
    queryFn: () => api.get<Attendance[]>("/hr/attendance", { month }),
  });
  const add = useMutation({
    mutationFn: () =>
      api.post("/hr/attendance", {
        employee_id: form.employee_id,
        work_date: form.work_date,
        check_in: form.check_in || undefined,
        check_out: form.check_out || undefined,
        status: form.status,
      }),
    onSuccess: () => { setAdding(false); qc.invalidateQueries({ queryKey: ["hr-attendance"] }); },
  });
  const nameOf = (id: string) => employees.data?.find((e) => e.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input type="month" className="num rounded-lg border border-line bg-surface px-3 py-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="الشهر" />
        <Button onClick={() => setAdding(true)}><Plus size={16} /> تسجيل حضور</Button>
      </div>
      {att.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      : att.isError ? <ErrorBox message={(att.error as Error).message} onRetry={() => att.refetch()} />
      : !att.data?.length ? <Empty text="لا توجد سجلات حضور هذا الشهر" />
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الموظف</th>
                <th className="p-3 text-start">اليوم</th>
                <th className="p-3 text-start">الحضور</th>
                <th className="p-3 text-start">الانصراف</th>
                <th className="p-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {att.data.slice(0, 100).map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="p-3 font-bold">{nameOf(a.employee_id)}</td>
                  <td className="p-3 text-muted">{fmtDate(a.work_date)}</td>
                  <td className="num p-3" dir="ltr">{a.check_in?.slice(11, 16) ?? "—"}</td>
                  <td className="num p-3" dir="ltr">{a.check_out?.slice(11, 16) ?? "—"}</td>
                  <td className="p-3"><Badge tone={a.status === "present" ? "success" : "warning"}>{a.status === "present" ? "حاضر" : a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="تسجيل حضور">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!add.isPending && form.employee_id && form.work_date) add.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <Select autoFocus value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">— اختر الموظف —</option>
            {employees.data?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <Input type="date" className="num" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} aria-label="اليوم" />
            <Input type="time" className="num" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} aria-label="الحضور" />
            <Input type="time" className="num" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} aria-label="الانصراف" />
          </div>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="present">حاضر</option>
            <option value="leave">إجازة</option>
            <option value="absent">غائب</option>
          </Select>
          {add.isError && <ErrorBox message={(add.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={add.isPending || !form.employee_id || !form.work_date}>
            {add.isPending ? <Spinner /> : "حفظ الحضور"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function AdvancesTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ employee_id: "", amount: "", note: "" });

  const employees = useQuery({ queryKey: ["hr-employees"], queryFn: () => api.get<Employee[]>("/hr/employees") });
  const list = useQuery({ queryKey: ["hr-advances"], queryFn: () => api.get<Advance[]>("/hr/advances") });
  const create = useMutation({
    mutationFn: () =>
      api.post("/hr/advances", {
        employee_id: form.employee_id,
        amount: D(form.amount).toNumber(),
        note: form.note || null,
      }),
    onSuccess: () => { setCreating(false); setForm({ employee_id: "", amount: "", note: "" }); qc.invalidateQueries({ queryKey: ["hr-advances"] }); },
  });
  const nameOf = (id: string) => employees.data?.find((e) => e.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus size={16} /> سلفة جديدة</Button>
      </div>
      {list.isLoading ? <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      : !list.data?.length ? <Empty text="لا توجد سلف" />
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">الموظف</th>
                <th className="p-3 text-start">المبلغ</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {list.data.slice(0, 60).map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="p-3 font-bold">{nameOf(a.employee_id)}</td>
                  <td className="num p-3 font-bold text-warning">{money(a.amount)}</td>
                  <td className="p-3 text-xs text-muted">{fmtDate(a.date)}</td>
                  <td className="p-3 text-muted">{a.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="سلفة جديدة">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!create.isPending && form.employee_id && form.amount) create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <Select autoFocus value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">— اختر الموظف —</option>
            {employees.data?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <div>
            <label className="mb-1 block text-sm font-medium">المبلغ</label>
            <Input className="num text-lg font-bold" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظة</label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={create.isPending || !form.employee_id || !form.amount}>
            {create.isPending ? <Spinner /> : "حفظ السلفة"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function SyncTab() {
  const qc = useQueryClient();
  const fileRef = useState<HTMLInputElement | null>(null)[0];
  const inputRef = { current: fileRef } as React.RefObject<HTMLInputElement | null>;

  const log = useQuery({ queryKey: ["hr-sync-log"], queryFn: () => api.get<SyncLog[]>("/hr/sync-log") });

  const sync = useMutation({
    mutationFn: () => api.post("/hr/sync-device", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-sync-log"] }),
  });
  const importCsv = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.postForm("/hr/attendance/import-csv", fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-attendance"] }); },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-bold"><Usb size={18} /> جهاز البصمة (ZK)</p>
          <p className="text-sm text-muted">يزامن سجلات الحضور من جهاز ZK المتصل بالشبكة المحلية</p>
        </div>
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          {sync.isPending ? <Spinner /> : <><CalendarSync size={16} /> مزامنة الآن</>}
        </Button>
      </Card>
      {sync.isError && <ErrorBox message={(sync.error as Error).message} />}
      {sync.isSuccess && (
        <Card className="border-success/40 bg-success/10 p-4 text-sm">
          تمت المحاولة — راجع السجل بالأسفل. (إذا فشل الاتصال بالجهاز سيظهر خطأ 502 وهو متوقع عند عدم توفر الجهاز)
        </Card>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-bold"><Upload size={18} /> استيراد حضور من ملف CSV</p>
          <p className="text-sm text-muted">يدعم ملفات الحضور التصديرية (Jibble وغيرها)</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv.mutate(f); }}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={importCsv.isPending}>
          {importCsv.isPending ? <Spinner /> : "اختر ملف CSV"}
        </Button>
      </Card>
      {importCsv.isError && <ErrorBox message={(importCsv.error as Error).message} />}
      {importCsv.isSuccess && <Card className="border-success/40 bg-success/10 p-4 text-sm">تم الاستيراد بنجاح</Card>}

      <Card>
        <h2 className="mb-3 font-bold">سجل المزامنة</h2>
        {log.isLoading ? <div className="grid place-items-center p-6"><Spinner /></div>
        : !log.data?.length ? <Empty text="لا يوجد سجل" />
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-2 text-start">الوقت</th>
                <th className="p-2 text-start">الحالة</th>
                <th className="p-2 text-start">جُلب</th>
                <th className="p-2 text-start">أُضيف</th>
                <th className="p-2 text-start">حُدّث</th>
              </tr>
            </thead>
            <tbody>
              {log.data.slice(0, 15).map((l) => (
                <tr key={l.id} className="border-b border-line/60 last:border-0">
                  <td className="p-2 text-xs text-muted">{dateTime(l.synced_at)}</td>
                  <td className="p-2"><Badge tone={l.status === "success" ? "success" : "danger"}>{l.status}</Badge></td>
                  <td className="num p-2">{l.fetched}</td>
                  <td className="num p-2">{l.added}</td>
                  <td className="num p-2">{l.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
