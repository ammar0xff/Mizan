import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Cpu,
  Play,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  History,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { Button } from "@/components/ui";

interface AutomationJob {
  key: string;
  title: string;
  title_en: string;
  description: string;
  cron: string;
  is_enabled: boolean;
  last_run: {
    id: string | null;
    status: string;
    start_time: string | null;
    duration_ms: number;
    items_processed: number;
    message: string;
  } | null;
}

interface JobLog {
  id: string;
  job_name: string;
  status: string;
  start_time: string | null;
  duration_ms: number;
  items_processed: number;
  message: string;
  error_details: string | null;
}

interface AutomationWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutomationWorkerModal({ isOpen, onClose }: AutomationWorkerModalProps) {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [activeTab, setActiveTab] = useState<"jobs" | "logs">("jobs");
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const data = await api.get<AutomationJob[]>("/modules/automation/jobs");
      setJobs(data);
    } catch {
      // ignore
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.get<JobLog[]>("/modules/automation/logs?limit=25");
      setLogs(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    Promise.all([fetchJobs(), fetchLogs()]).finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunJob = async (jobKey: string) => {
    setRunningJob(jobKey);
    try {
      sound.click();
      const res = await api.post<{
        status: string;
        message: string;
        duration_ms: number;
        items_processed: number;
      }>(`/modules/automation/run/${jobKey}`, {});
      sound.success();
      setToastMessage(`✓ اكتملت المهمة: ${res.message || "بنجاح"}`);
      setTimeout(() => setToastMessage(null), 3500);
      await Promise.all([fetchJobs(), fetchLogs()]);
    } catch {
      sound.error();
    } finally {
      setRunningJob(null);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      sound.click();
      await api.post("/modules/automation/run-all", {});
      sound.success();
      setToastMessage("✓ تم تنفيذ كافة مهام الأتمتة المجدولة بنجاح!");
      setTimeout(() => setToastMessage(null), 4000);
      await Promise.all([fetchJobs(), fetchLogs()]);
    } catch {
      sound.error();
    } finally {
      setIsRunningAll(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-card p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                محرك الأتمتة وجدولة المهام الخلفية (Automation Cron Worker)
              </h2>
              <p className="text-xs text-muted-foreground">
                إغلاق الورديات التلقائي، متابعة الاشتراكات، توليد التقارير وتطهير البيانات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action ribbon & tabs */}
        <div className="flex items-center justify-between border-b border-white/10 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "jobs"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Cpu className="h-4 w-4" />
              المهام المجدولة ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "logs"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4" />
              سجل التشغيل الأخير ({logs.length})
            </button>
          </div>

          <Button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="gap-2 bg-gradient-to-r from-indigo-500 to-primary text-white shadow-lg"
          >
            {isRunningAll ? <RotateCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            تشغيل كافة المهام الآن
          </Button>
        </div>

        {/* Toast alert banner */}
        {toastMessage && (
          <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <RotateCw className="h-6 w-6 animate-spin text-primary" />
              <span>جارٍ تحميل حالة المهام وسجل التشغيل...</span>
            </div>
          ) : activeTab === "jobs" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between gap-3 hover:border-white/20 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-foreground">{job.title}</h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {job.cron}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span>
                        {job.last_run?.start_time
                          ? new Date(job.last_run.start_time).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "لم تُنفذ اليوم"}
                      </span>
                      {job.last_run?.status === "success" && (
                        <span className="text-emerald-400 font-bold">✓ ناجحة</span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={runningJob === job.key}
                      onClick={() => handleRunJob(job.key)}
                      className="h-8 gap-1.5 text-xs border-white/10 hover:bg-white/10"
                    >
                      {runningJob === job.key ? (
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-primary" />
                      )}
                      تشغيل الآن
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Logs Tab */
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-white/5 text-muted-foreground uppercase border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">المهمة</th>
                      <th className="py-2.5 px-3">الحالة</th>
                      <th className="py-2.5 px-3">الوقت</th>
                      <th className="py-2.5 px-3">المدة</th>
                      <th className="py-2.5 px-3">العناصر</th>
                      <th className="py-2.5 px-3">النتيجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition">
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                          {log.job_name}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> ناجحة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                              <AlertTriangle className="h-3.5 w-3.5" /> فشلت
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {log.start_time
                            ? new Date(log.start_time).toLocaleString("ar-EG", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {log.duration_ms}ms
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">
                          {log.items_processed}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground max-w-[280px] truncate">
                          {log.message || log.error_details || "—"}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          لا توجد سجلات تشغيل بعد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
          <span>الجدولة تعمل عبر نظام Cron المتوافق مع سحابية Docker وLinux CLI</span>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-foreground">
            إغلاق
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
