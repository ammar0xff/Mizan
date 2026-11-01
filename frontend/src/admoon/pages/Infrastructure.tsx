/**
 * Admoon Infrastructure & Resource Quotas Page.
 * 
 * Hardware limits, worker thread monitoring, rate limiting, and capacity quotas.
 */
import { useEffect, useState } from "react";
import { Server, Cpu, Activity, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { toast } from "sonner";

export default function Infrastructure() {
  const [telemetry, setTelemetry] = useState<any>({
    cpu_utilization_pct: 18.5,
    memory_utilization_pct: 34.2,
    disk_total_gb: 120.0,
    disk_used_gb: 42.5,
    disk_free_gb: 77.5,
    active_worker_threads: 4,
    api_p95_latency_ms: 28.4,
    database_connection_pool: { total: 20, active: 3, idle: 17 },
  });

  const fetchMetrics = async () => {
    try {
      const res = await api.get<any>("/admoon/system-metrics");
      if (res.telemetry) setTelemetry(res.telemetry);
      toast.success("تم تحديث قياسات السيرفر الحية");
    } catch {
      toast.error("فشل قراءة مقاييس البنية التحتية");
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">إدارة البنية التحتية والموارد (Infrastructure & Hardware)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            متابعة استهلاك المعالجات والذاكرة وحصص التخزين ومسبح اتصالات قواعد البيانات ومحركات الخلفية.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMetrics} className="text-xs h-8 gap-1.5">
          <RefreshCw className="size-3.5" />
          تحديث المقاييس
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">استهلاك المعالج (CPU)</span>
            <Cpu className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground num">{telemetry.cpu_utilization_pct}%</div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${telemetry.cpu_utilization_pct}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">Quad-Core Host Nodes</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">استهلاك الذاكرة (RAM)</span>
            <Activity className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground num">{telemetry.memory_utilization_pct}%</div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${telemetry.memory_utilization_pct}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">Allocated: 2048 MB / Container</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">اتصالات قاعدة البيانات (DB Pool)</span>
            <Server className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground num">
            {telemetry.database_connection_pool?.active} / {telemetry.database_connection_pool?.total}
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: "15%" }} />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">17 Idle Connections Available</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-foreground">الحصص وسياسات حماية الموارد للمنشآت (Tenant Resource Quotas)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="font-semibold text-foreground">أقصى معدل طلبات API (Rate Limit):</span>
            <p className="font-bold font-mono text-primary">300 requests / minute / tenant</p>
            <p className="text-[11px] text-muted-foreground">حماية من هجمات الإغراق والحفاظ على استقرار الخادم</p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="font-semibold text-foreground">أقصى حجم لرفع الملف الفردي:</span>
            <p className="font-bold font-mono text-primary">25 MB / file</p>
            <p className="text-[11px] text-muted-foreground">مطبق على المرفقات وإيصالات السداد وصور المنتجات</p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="font-semibold text-foreground">جلسات العمل المتزامنة للكاشير:</span>
            <p className="font-bold font-mono text-primary">Up to 20 concurrent sessions</p>
            <p className="text-[11px] text-muted-foreground">توزيع آلي للأجهزة على نقاط البيع المتزامنة</p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="font-semibold text-foreground">عزل الخوادم الافتراضية (VPS Sandboxing):</span>
            <p className="font-bold font-mono text-emerald-600">Isolated cgroups & namespaces</p>
            <p className="text-[11px] text-muted-foreground">فصل موارد كل شركة في حاوية مستقلة تماماً</p>
          </div>
        </div>
      </div>
    </div>
  );
}
