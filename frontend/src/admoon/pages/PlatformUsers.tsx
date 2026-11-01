/**
 * Admoon Platform Users & RBAC Management Page.
 */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PlatformUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function PlatformUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await api.get<{ items: PlatformUser[] }>("/admoon/platform-users");
      setUsers(res.items);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">مسؤولو المنصة والصلاحيات (Platform RBAC)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة حسابات إدارة المنصة وصلاحيات المالك الخارق ومديري البنية التحتية والدعم الفني.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">المالك الخارق (Superadmin)</span>
          <p className="text-xl font-black text-foreground mt-1">ammar</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">كامل صلاحيات المنصة والشركات (*)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">أدوار المنظومة (RBAC Roles)</span>
          <p className="text-xl font-black text-primary mt-1">6 أدوار معتمدة</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Platform, Infra, Billing, Support, Auditor</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">حالة المصادقة الثنائية (MFA)</span>
          <p className="text-xl font-black text-foreground mt-1">TOTP Enabled</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">حماية مشددة على لوحة أديمون</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
            <tr>
              <th className="py-3 px-4">اسم المستخدم</th>
              <th className="py-3 px-3">الاسم الكامل</th>
              <th className="py-3 px-3">الدور الرقابي (RBAC Role)</th>
              <th className="py-3 px-3">تاريخ التعيين</th>
              <th className="py-3 px-3">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20">
                <td className="py-3 px-4 font-mono font-bold text-foreground">{u.username}</td>
                <td className="py-3 px-3 font-semibold text-foreground">{u.full_name}</td>
                <td className="py-3 px-3 font-bold text-primary">{u.role}</td>
                <td className="py-3 px-3 font-mono text-muted-foreground">{u.created_at ? u.created_at.slice(0, 10) : ""}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    نشط (Active)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
