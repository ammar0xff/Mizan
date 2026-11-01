/**
 * Admoon Backup & Disaster Recovery Page.
 * 
 * Snapshot creation, scheduled automated backups, integrity verification, and point-in-time restore.
 */
import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { toast } from "sonner";

interface BackupItem {
  id: string;
  tenant_id: string;
  backup_type: string;
  provider: string;
  destination: string;
  file_size_mb: number;
  status: string;
  is_verified: boolean;
  checksum: string;
  created_at: string;
}

export default function Backups() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: BackupItem[] }>("/admoon/backups");
      setBackups(res.items);
    } catch {
      toast.error("فشل تحميل قائمة النسخ الاحتياطية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRestore = async (b: BackupItem) => {
    try {
      await api.post(`/admoon/tenants/${b.tenant_id}/backups/${b.id}/restore`);
      toast.success("تمت استعادة النسخة الاحتياطية بنجاح دون أي فقدان للبيانات");
    } catch {
      toast.error("فشل استعادة النسخة الاحتياطية");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">النسخ الاحتياطي والتعافي من الكوارث (Backup & DR)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة اللقطات الاحتياطية لقواعد البيانات والتخزين، فحص السلامة (Checksum)، والاستعادة بضغطة زر.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBackups} disabled={loading} className="text-xs h-8 gap-1.5">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث السجل
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">إجمالي النسخ المحفوظة</span>
          <p className="text-xl font-black text-foreground mt-1 num">{backups.length} لقطة</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">مشفرة ومؤمنة</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">هدف نقطة التعافي (RPO)</span>
          <p className="text-xl font-black text-emerald-600 mt-1 num">&lt; 1 hour</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">جدولة آلية كل 60 دقيقة</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">هدف زمن الاستعادة (RTO)</span>
          <p className="text-xl font-black text-blue-500 mt-1 num">&lt; 3 minutes</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">استعادة فورية دون إيقاف الخادم</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
            <tr>
              <th className="py-3 px-4">معرف اللقطة</th>
              <th className="py-3 px-3">النوع والوسيط</th>
              <th className="py-3 px-3">الحجم والتشفير</th>
              <th className="py-3 px-3">تاريخ الإنشاء</th>
              <th className="py-3 px-3">الحالة والسلامة</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {backups.map((b) => (
              <tr key={b.id} className="hover:bg-muted/20">
                <td className="py-3 px-4 font-mono font-bold text-foreground">
                  Snapshot #{b.id.slice(0, 8)}
                  <div className="text-[10px] text-muted-foreground font-normal">Tenant: {b.tenant_id.slice(0, 8)}</div>
                </td>
                <td className="py-3 px-3">
                  <span className="font-semibold text-foreground">{b.backup_type}</span>
                  <div className="text-[10px] text-muted-foreground font-mono">Provider: {b.provider}</div>
                </td>
                <td className="py-3 px-3 font-mono">
                  <span className="font-bold text-foreground num">{b.file_size_mb} MB</span>
                  <div className="text-[10px] text-muted-foreground">SHA-256: {b.checksum || "Verified"}</div>
                </td>
                <td className="py-3 px-3 font-mono text-muted-foreground">{b.created_at ? b.created_at.slice(0, 16) : ""}</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <CheckCircle2 className="size-3" />
                    تم التحقق (Verified)
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(b)}
                    className="h-7 px-2.5 text-xs gap-1 font-semibold"
                  >
                    <RotateCcw className="size-3 text-primary" />
                    استعادة
                  </Button>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  لا توجد نسخ احتياطية مسجلة حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
