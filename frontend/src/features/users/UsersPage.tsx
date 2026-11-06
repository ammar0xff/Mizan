import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus } from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { Badge, Button, Empty, ErrorBox, Input, Modal, Select, Spinner } from "@/components/ui";

interface UserRow {
  id: string; username: string; full_name: string; role: string; is_active: boolean;
  is_manager: boolean; permissions?: string[];
}

const ALL_PERMS = [
  "pos", "sales", "quotations", "inventory", "operations", "purchases",
  "customers", "reports", "archive", "payroll", "users", "settings", "admin", "shifts", "finance",
  "clinic", "clinic:view", "clinic:manage", "clinic:doctor", "clinic:nurse",
];
const PERM_LABELS: Record<string, string> = {
  pos: "نقطة البيع", sales: "المبيعات", quotations: "عروض الأسعار", inventory: "المخزون",
  operations: "العمليات", purchases: "المشتريات", customers: "العملاء", reports: "التقارير",
  archive: "الأرشيف", payroll: "الموارد البشرية", users: "المستخدمون", settings: "الإعدادات",
  admin: "إدارة", shifts: "الورديات", finance: "المالية",
  clinic: "العيادات (وصول)", "clinic:view": "عرض العيادات", "clinic:manage": "إدارة العيادات",
  "clinic:doctor": "طبيب", "clinic:nurse": "تمريض",
};
const ROLES = ["admin", "manager", "cashier", "storekeeper", "accountant"];

export default function UsersPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", password: "", role: "cashier" });
  const [permFor, setPermFor] = useState<UserRow | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [pwFor, setPwFor] = useState<UserRow | null>(null);
  const [newPw, setNewPw] = useState("");

  const list = useQuery({ queryKey: ["users"], queryFn: () => api.get<UserRow[]>("/users") });

  const create = useMutation({
    mutationFn: () => api.post("/users", form),
    onSuccess: () => { setCreating(false); setForm({ username: "", full_name: "", password: "", role: "cashier" }); qc.invalidateQueries({ queryKey: ["users"] }); },
  });

  const savePerms = useMutation({
    mutationFn: () => api.put(`/permissions/${permFor!.id}`, { permissions: perms }),
    onSuccess: () => { setPermFor(null); qc.invalidateQueries({ queryKey: ["users"] }); },
  });

  const resetPw = useMutation({
    mutationFn: () => api.post(`/users/${pwFor!.id}/reset-password`, { new_password: newPw }),
    onSuccess: () => { setPwFor(null); setNewPw(""); },
  });

  function openPerms(u: UserRow) {
    setPermFor(u);
    setPerms(u.permissions ?? []);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">المستخدمون والصلاحيات</h1>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> مستخدم جديد</Button>
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
      ) : list.isError ? (
        <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : !list.data?.length ? (
        <Empty text="لا يوجد مستخدمون" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start">اسم المستخدم</th>
                <th className="p-3 text-start">الاسم</th>
                <th className="hidden p-3 text-start md:table-cell">الدور</th>
                <th className="hidden p-3 text-start sm:table-cell">الصلاحيات</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-elevated">
                  <td className="p-3 font-bold" dir="ltr">{u.username}</td>
                  <td className="w-full max-w-0 truncate p-3">{u.full_name}</td>
                  <td className="hidden p-3 md:table-cell"><Badge tone="brand">{u.role}</Badge></td>
                  <td className="num hidden p-3 text-muted sm:table-cell">{u.permissions?.length ?? 0}</td>
                  <td className="p-3"><Badge tone={u.is_active ? "success" : "muted"}>{u.is_active ? "نشط" : "موقوف"}</Badge></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="outline" onClick={() => openPerms(u)}>الصلاحيات</Button>
                      <button
                        className="rounded-md p-2 text-muted hover:bg-elevated hover:text-ink"
                        onClick={() => { setPwFor(u); setNewPw(""); }}
                        aria-label="كلمة مرور جديدة"
                      >
                        <KeyRound size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="مستخدم جديد">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!create.isPending && form.username && form.password && form.full_name) create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">اسم المستخدم *</label>
              <Input autoFocus dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">الاسم الكامل *</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">كلمة المرور *</label>
              <Input type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">الدور</label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
          </div>
          {create.isError && <ErrorBox message={(create.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={create.isPending || !form.username || !form.password || !form.full_name}>
            {create.isPending ? <Spinner /> : "إنشاء المستخدم"}
          </Button>
        </form>
      </Modal>

      <Modal open={!!permFor} onClose={() => setPermFor(null)} title={`صلاحيات — ${permFor?.full_name ?? ""}`} wide>
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            تخصيص الصلاحيات الدقيقة لهذا الحساب. يملك مدير النظام (Admin) صلاحيات شاملة تلقائياً.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALL_PERMS.map((p) => (
              <label key={p} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${perms.includes(p) ? "border-primary bg-primary/10 font-bold text-primary" : "border-line hover:bg-secondary/40"}`}>
                <input
                  type="checkbox"
                  checked={perms.includes(p)}
                  onChange={(e) => setPerms((s) => e.target.checked ? [...s, p] : s.filter((x) => x !== p))}
                />
                {PERM_LABELS[p] ?? p}
              </label>
            ))}
          </div>
          {savePerms.isError && <ErrorBox message={(savePerms.error as Error).message} />}
          <Button className="w-full h-10 font-bold" disabled={savePerms.isPending} onClick={() => savePerms.mutate()}>
            {savePerms.isPending ? <Spinner /> : "حفظ الصلاحيات"}
          </Button>
        </div>
      </Modal>

      <Modal open={!!pwFor} onClose={() => setPwFor(null)} title={`كلمة مرور جديدة — ${pwFor?.username ?? ""}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!resetPw.isPending && newPw) resetPw.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">كلمة المرور الجديدة</label>
            <Input autoFocus type="password" dir="ltr" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          {resetPw.isError && <ErrorBox message={(resetPw.error as Error).message} />}
          <Button type="submit" className="w-full h-10 font-bold" disabled={resetPw.isPending || !newPw}>
            {resetPw.isPending ? <Spinner /> : "تعيين كلمة المرور"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
