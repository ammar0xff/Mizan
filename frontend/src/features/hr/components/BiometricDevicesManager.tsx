import { useState, useEffect, useRef } from "react";
import {
  Fingerprint,
  Plus,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Upload,
  Clock,
  ShieldCheck,
  Server,
} from "lucide-react";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { Button, Card, Badge, Spinner } from "@/components/ui";

interface BiometricDevice {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  protocol: string;
  serial_number: string | null;
  location: string | null;
  status: string;
  last_ping_ms: number | null;
  last_sync_at: string | null;
}

interface PunchRecord {
  id: string;
  emp_code: string | null;
  employee_name: string;
  punch_time: string | null;
  punch_state: string;
  verify_mode: string;
  is_synced: boolean;
}

export function BiometricDevicesManager() {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [punches, setPunches] = useState<PunchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New device form
  const [newName, setNewName] = useState("");
  const [newIp, setNewIp] = useState("192.168.1.202");
  const [newPort, setNewPort] = useState(4370);
  const [newLocation, setNewLocation] = useState("المكتب الإداري");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [devData, punchData] = await Promise.all([
        api.get<BiometricDevice[]>("/modules/zk_attendance/devices"),
        api.get<PunchRecord[]>("/modules/zk_attendance/punches?limit=25"),
      ]);
      setDevices(devData || []);
      setPunches(punchData || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePing = async (id: string) => {
    setPingingId(id);
    try {
      sound.click();
      const res = await api.post<{ status: string; latency_ms: number; message: string }>(
        `/modules/zk_attendance/devices/${id}/ping`,
        {}
      );
      sound.success();
      setFeedback({ type: "success", msg: res.message });
      setTimeout(() => setFeedback(null), 4000);
      loadData();
    } catch {
      sound.error();
      setFeedback({ type: "error", msg: "تعذر الاتصال بالجهاز عبر الشبكة المحلية." });
    } finally {
      setPingingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      sound.click();
      const res = await api.post<{ status: string; message: string }>(
        `/modules/zk_attendance/devices/${id}/sync`,
        {}
      );
      sound.success();
      setFeedback({ type: "success", msg: res.message });
      setTimeout(() => setFeedback(null), 5000);
      loadData();
    } catch {
      sound.error();
      setFeedback({ type: "error", msg: "فشلت مزامنة سجلات البصمة." });
    } finally {
      setSyncingId(null);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newIp.trim()) return;
    setIsSubmitting(true);
    try {
      sound.click();
      await api.post("/modules/zk_attendance/devices", {
        name: newName,
        ip_address: newIp,
        port: Number(newPort),
        protocol: "tcp",
        location: newLocation,
      });
      sound.success();
      setIsAddOpen(false);
      setNewName("");
      loadData();
    } catch {
      sound.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟")) return;
    try {
      sound.click();
      await api.del(`/modules/zk_attendance/devices/${id}`);
      sound.success();
      loadData();
    } catch {
      sound.error();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      sound.click();
      const res = await api.postForm<{ message: string }>("/modules/zk_attendance/import-csv", fd);
      sound.success();
      setFeedback({ type: "success", msg: res.message });
      setTimeout(() => setFeedback(null), 5000);
      loadData();
    } catch {
      sound.error();
      setFeedback({ type: "error", msg: "فشل استيراد ملف البصمة CSV." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              أجهزة البصمة والتحكم في الحضور (ZKTeco Biometrics)
            </h2>
            <p className="text-xs text-muted-foreground">
              ربط مباشر مع أجهزة بصمة اليد والوجه عبر الشبكة المحلية (TCP/IP) أو الاستيراد التلقائي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 border-white/10 text-xs text-foreground hover:bg-white/10"
          >
            <Upload className="h-4 w-4 text-emerald-400" />
            استيراد ملف CSV
          </Button>

          <Button onClick={() => setIsAddOpen(true)} className="gap-2 text-xs bg-primary">
            <Plus className="h-4 w-4" />
            إضافة جهاز بصمة
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Devices Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => (
            <Card
              key={dev.id}
              className="p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between gap-4 hover:border-white/20 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{dev.name}</h3>
                      <span className="text-[11px] text-muted-foreground">{dev.location || "بدون موقع"}</span>
                    </div>
                  </div>
                  <Badge
                    tone={dev.status === "online" ? "success" : "muted"}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        dev.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-stone-500"
                      }`}
                    />
                    {dev.status === "online" ? "متصل بالشبكة" : "غير متصل"}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between">
                    <span className="font-sans text-[11px]">عنوان IP:</span>
                    <span className="text-foreground font-bold">
                      {dev.ip_address}:{dev.port}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-[11px]">البروتوكول:</span>
                    <span>{dev.protocol.toUpperCase()}</span>
                  </div>
                  {dev.last_ping_ms !== null && (
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px]">زمن الاستجابة:</span>
                      <span className="text-emerald-400">{dev.last_ping_ms} ms</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-sans text-[11px]">آخر مزامنة:</span>
                    <span className="font-sans">
                      {dev.last_sync_at
                        ? new Date(dev.last_sync_at).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "لم تُزامن"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingingId === dev.id}
                  onClick={() => handlePing(dev.id)}
                  className="h-8 gap-1.5 text-xs border-white/10 hover:bg-white/10 flex-1"
                >
                  {pingingId === dev.id ? <Spinner /> : <Activity className="h-3.5 w-3.5 text-amber-400" />}
                  فحص الاتصال
                </Button>

                <Button
                  size="sm"
                  disabled={syncingId === dev.id}
                  onClick={() => handleSync(dev.id)}
                  className="h-8 gap-1.5 text-xs bg-primary flex-1"
                >
                  {syncingId === dev.id ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />}
                  مزامنة الآن
                </Button>

                <button
                  onClick={() => handleDeleteDevice(dev.id)}
                  className="p-2 text-muted-foreground hover:text-red-400 transition"
                  title="حذف الجهاز"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Live Punches Log Stream */}
      <Card className="p-5 rounded-2xl border border-white/10 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              سجل حركات البصمة الحية (Biometric Punch Stream)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">آخر {punches.length} حركة مسجلة</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs text-right">
            <thead className="bg-white/5 text-muted-foreground uppercase border-b border-white/10">
              <tr>
                <th className="py-2 px-3">كود الموظف</th>
                <th className="py-2 px-3">اسم الموظف</th>
                <th className="py-2 px-3">نوع الحركة</th>
                <th className="py-2 px-3">وسيلة التحقق</th>
                <th className="py-2 px-3">التوقيت</th>
                <th className="py-2 px-3">حالة المزامنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {punches.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition">
                  <td className="py-2 px-3 font-mono font-bold text-primary">{p.emp_code || "—"}</td>
                  <td className="py-2 px-3 font-semibold text-foreground">{p.employee_name}</td>
                  <td className="py-2 px-3">
                    {p.punch_state === "check_in" ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold">
                        تسجيل دخول
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-bold">
                        تسجيل انصراف
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground flex items-center gap-1.5">
                    <Fingerprint className="h-3.5 w-3.5 text-primary" />
                    <span>{p.verify_mode === "fingerprint" ? "بصمة إصبع" : "بصمة وجه"}</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground font-mono">
                    {p.punch_time
                      ? new Date(p.punch_time).toLocaleString("ar-EG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      مُعتمدة في الحضور
                    </span>
                  </td>
                </tr>
              ))}
              {punches.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    لا توجد حركات بصمة مسجلة حالياً. اضغط "مزامنة الآن" لسحب السجلات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Device Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">إضافة جهاز بصمة جديد (ZKTeco)</h3>
            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم الجهاز</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: جهاز الفرع الإداري (ZK-Uface)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">عنوان IP بالشبكة</label>
                  <input
                    type="text"
                    required
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="192.168.1.202"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">منفذ الاتصال (Port)</label>
                  <input
                    type="number"
                    required
                    value={newPort}
                    onChange={(e) => setNewPort(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">موقع التثبيت</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="مثال: مدخل الموظفين - الدور الأرضي"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddOpen(false)}
                  className="text-muted-foreground"
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary">
                  {isSubmitting ? <Spinner /> : "إضافة الجهاز"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
