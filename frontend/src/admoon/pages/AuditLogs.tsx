/**
 * Admoon Immutable Audit Logs Page.
 * 
 * Tracks all administrative events, tenant status changes, database adjustments,
 * backups, and security interventions.
 */
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

interface AuditLogItem {
  id: string;
  action: string;
  tenant_id: string | null;
  platform_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, any>;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: AuditLogItem[] }>("/admoon/audit-logs?limit=100");
      setLogs(res.items);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">السجل الرقابي والتدقيق الأمني (Audit Trail)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            سجل غير قابل للتعديل لكافة الأنشطة الإدارية، تعديلات البنية التحتية، والدخول كمدير منشأة.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="text-xs h-8 gap-1.5">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث السجل
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
            <tr>
              <th className="py-3 px-4">نوع العملية (Action)</th>
              <th className="py-3 px-3">المنشأة المستهدفة</th>
              <th className="py-3 px-3">التفاصيل والمعايير</th>
              <th className="py-3 px-3">عنوان IP</th>
              <th className="py-3 px-3">الوقت والتاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20">
                <td className="py-3 px-4">
                  <span className="font-bold text-foreground font-sans">
                    {log.action === "tenant_status_change"
                      ? "تعديل حالة منشأة"
                      : log.action === "backup_created"
                      ? "إنشاء لقطة احتياطية"
                      : log.action === "backup_restored"
                      ? "استعادة نسخة احتياطية"
                      : log.action === "tenant_deleted"
                      ? "حذف مساحة عمل"
                      : log.action === "tenant_cloned"
                      ? "استنساخ إعدادات"
                      : log.action}
                  </span>
                  <div className="text-[10px] text-muted-foreground">ID: {log.id.slice(0, 8)}</div>
                </td>
                <td className="py-3 px-3 font-semibold text-foreground">
                  {log.tenant_id ? log.tenant_id.slice(0, 8) : "Global Platform"}
                </td>
                <td className="py-3 px-3 text-muted-foreground font-sans max-w-xs truncate">
                  {JSON.stringify(log.details)}
                </td>
                <td className="py-3 px-3 text-muted-foreground">{log.ip_address || "127.0.0.1 (Local)"}</td>
                <td className="py-3 px-3 text-muted-foreground">{log.created_at ? log.created_at.slice(0, 19).replace("T", " ") : ""}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground font-sans">
                  لا توجد سجلات تدقيق حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
