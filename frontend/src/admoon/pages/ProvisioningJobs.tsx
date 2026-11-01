/**
 * Admoon Provisioning Jobs Queue & Inspector.
 * 
 * Live background job list, step logs inspector, and retry triggers.
 */
import { useEffect, useState } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { toast } from "sonner";

interface JobItem {
  id: string;
  tenant_id: string;
  job_type: string;
  current_step: string;
  progress_percent: number;
  status: string;
  error_message: string | null;
  step_logs: Array<{ step: string; message: string; timestamp: string }>;
  started_at: string;
  completed_at: string | null;
}

export default function ProvisioningJobs() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: JobItem[] }>("/admoon/jobs?limit=50");
      setJobs(res.items);
      if (res.items.length > 0 && !selectedJob) {
        setSelectedJob(res.items[0]);
      }
    } catch {
      toast.error("فشل قراءة طابور وظائف التأسيس");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      await api.post(`/admoon/jobs/${jobId}/retry`);
      toast.success("تمت إعادة إدراج الوظيفة في طابور التنفيذ");
      fetchJobs();
    } catch {
      toast.error("فشل إعادة تشغيل الوظيفة");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">طابور التأسيس الآلي (Provisioning Engine Jobs)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            سجل وظائف تهيئة البنية التحتية، بناء قواعد البيانات، وتثبيت الوحدات النمطية بالخلفية.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading} className="text-xs h-8 gap-1.5">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث الطابور
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-foreground">الوظائف المسجلة ({jobs.length})</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {jobs.map((j) => {
              const isSelected = selectedJob?.id === j.id;
              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all space-y-1.5 ${
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground font-mono">Job #{j.id.slice(0, 8)}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : j.status === "failed"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {j.status === "completed" ? "ناجحة" : j.status === "failed" ? "فشلت" : "جارية"}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>النوع: {j.job_type}</span>
                    <span className="font-mono">{j.progress_percent}%</span>
                  </div>
                </div>
              );
            })}
            {jobs.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">لا توجد وظائف في السجل</p>
            )}
          </div>
        </div>

        {/* Selected Job Inspector */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          {selectedJob ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground text-sm font-mono">تفاصيل الوظيفة: {selectedJob.id}</h3>
                  <p className="text-xs text-muted-foreground">
                    النوع: {selectedJob.job_type} • المنشأة: {selectedJob.tenant_id.slice(0, 8)}
                  </p>
                </div>

                {selectedJob.status === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(selectedJob.id)}
                    className="text-xs h-8 gap-1.5 text-destructive border-destructive/30"
                  >
                    <RotateCcw className="size-3.5" />
                    إعادة المحاولة
                  </Button>
                )}
              </div>

              {selectedJob.error_message && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive space-y-1">
                  <p className="font-bold">رسالة الخطأ المسجلة:</p>
                  <p className="font-mono">{selectedJob.error_message}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">سجل خطوات التنفيذ (Execution Timeline):</h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto font-mono text-xs">
                  {(selectedJob.step_logs || []).map((log, idx) => (
                    <div key={idx} className="p-2 rounded bg-muted/30 border border-border flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0">[{log.step}]</span>
                      <span className="flex-1 text-foreground font-sans">{log.message}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{log.timestamp ? log.timestamp.slice(11, 19) : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-12">اختر وظيفة من القائمة لاستعراض سجل التنفيذ</p>
          )}
        </div>
      </div>
    </div>
  );
}
