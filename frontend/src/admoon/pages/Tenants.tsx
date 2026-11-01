/**
 * Admoon Tenants Management Page.
 * 
 * High-density data table, search, multi-filters, lifecycle actions (Suspend, Reactivate,
 * Clone, Reset, Delete with confirmation), Tech Stack inspector, and 1-click Impersonation.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  LogIn,
  Sliders,
  KeyRound,
  Copy,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Database,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/stores/auth";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface TenantItem {
  id: string;
  name: string;
  slug: string | null;
  custom_domain: string | null;
  business_type: string;
  sector: string;
  scale: string;
  status: string;
  plan: string;
  trial_ends_at: string | null;
  palette: { name?: string; hue?: number };
  deployment_mode: string;
  tech_stack: {
    db_engine?: string;
    db_connection_uri?: string;
    storage_driver?: string;
    storage_bucket?: string;
    backend_engine?: string;
    offline_sync_enabled?: boolean;
    license_key?: string;
    custom_env?: Record<string, unknown>;
  };
  active_modules: string[];
  limits: Record<string, unknown>;
  created_at: string;
  stats: {
    users_count: number;
    products_count: number;
    sales_count: number;
    sales_volume_egp: number;
  };
}

export default function Tenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  // Modals state
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [licenseModalData, setLicenseModalData] = useState<{ key: string; name: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<TenantItem | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: TenantItem[] }>("/admoon/tenants");
      setTenants(res.items);
    } catch {
      toast.error("فشل تحميل قائمة المنشآت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleImpersonate = async (tenantId: string) => {
    try {
      const r = await api.post<{
        ok: boolean;
        access_token: string;
        user: import("@/stores/auth").User;
        tenant: import("@/stores/auth").TenantInfo;
        redirect_path: string;
      }>(`/admoon/tenants/${tenantId}/impersonate`);

      useAuth.getState().setToken(r.access_token);
      useAuth.getState().setUser(r.user);
      useAuth.getState().setTenant(r.tenant);

      toast.success(`تم تسجيل الدخول بنجاح كمدير لـ '${r.tenant.name}'`);
      const targetSlug = r.tenant.slug || "";
      if (targetSlug) {
        navigate(`/${targetSlug}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فشل تسجيل الدخول بالمنشأة");
    }
  };

  const handleSetStatus = async (tenantId: string, newStatus: string) => {
    try {
      await api.post(`/admoon/tenants/${tenantId}/status`, { status: newStatus });
      toast.success(`تم تغيير حالة المنشأة إلى '${newStatus}'`);
      fetchTenants();
    } catch {
      toast.error("فشل تحديث حالة المنشأة");
    }
  };

  const handleDeleteTenant = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await api.del(`/admoon/tenants/${deleteConfirmTarget.id}?confirmed=true`);
      toast.success(`تم حذف مساحة العمل '${deleteConfirmTarget.name}' نهائياً`);
      setDeleteConfirmTarget(null);
      fetchTenants();
    } catch {
      toast.error("فشل حذف المنشأة");
    }
  };

  const handleGenerateLicense = async (t: TenantItem) => {
    try {
      const res = await api.post<{ license_key: string }>(`/admoon/tenants/${t.id}/license-key?valid_days=365`);
      setLicenseModalData({ key: res.license_key, name: t.name });
      fetchTenants();
    } catch {
      toast.error("فشل توليد ترخيص العمل المكتبي");
    }
  };

  const filtered = tenants.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (modeFilter !== "all" && t.deployment_mode !== modeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchName = t.name.toLowerCase().includes(s);
      const matchSlug = t.slug?.toLowerCase().includes(s) || false;
      const matchDomain = t.custom_domain?.toLowerCase().includes(s) || false;
      if (!matchName && !matchSlug && !matchDomain) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">إدارة الشركات والمستأجرين (Tenants Master)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إجمالي {tenants.length} منشأة مسجلة عبر كافة البيئات السحابية والمحلية والـ VPS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTenants} disabled={loading} className="text-xs h-8 gap-1.5">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث القائمة
          </Button>
          <Button size="sm" asChild className="text-xs h-8 gap-1.5 font-bold">
            <Link to="/admoon/wizard">
              <Plus className="size-3.5" />
              تأسيس منشأة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="ابحث باسم المنشأة، الرابط (Slug)، أو النطاق..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 px-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">نشطة (Active)</option>
            <option value="trial">تجريبية (Trial)</option>
            <option value="suspended">معلقة (Suspended)</option>
            <option value="offline_licensed">مرخصة مكتبياً</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">كافة بيئات الاستضافة</option>
            <option value="cloud_saas">SaaS سحابي كامل</option>
            <option value="desktop_standalone">مكتبي محلي (.exe)</option>
            <option value="lan_deployment">شبكة محلية (LAN)</option>
            <option value="vps_deployment">خادم خاص (VPS)</option>
          </select>
        </div>
      </div>

      {/* Main Tenants Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
              <tr>
                <th className="py-3 px-4">الشركة والرابط</th>
                <th className="py-3 px-3">النشاط والباقة</th>
                <th className="py-3 px-3">بيئة الاستضافة وقاعدة البيانات</th>
                <th className="py-3 px-3">الوحدات النمطية</th>
                <th className="py-3 px-3">المستخدمون والمبيعات</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات المالك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Link to={`/admoon/tenants/${t.id}`} className="hover:text-primary transition-colors">
                        {t.name}
                      </Link>
                      {t.slug && (
                        <Link
                          to={`/${t.slug}`}
                          target="_blank"
                          className="text-muted-foreground hover:text-primary"
                          title="فتح جذر العميل"
                        >
                          <ExternalLink className="size-3" />
                        </Link>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      /{t.slug || t.id.slice(0, 8)}
                      {t.custom_domain && <span className="text-primary mr-1.5">({t.custom_domain})</span>}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground">{t.business_type}</span>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">
                      Plan: {t.plan}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">
                        {t.deployment_mode === "cloud_saas"
                          ? "SaaS سحابي"
                          : t.deployment_mode === "desktop_standalone"
                          ? "مكتبي (.exe)"
                          : t.deployment_mode === "lan_deployment"
                          ? "شبكة LAN"
                          : t.deployment_mode === "vps_deployment"
                          ? "خادم VPS"
                          : t.deployment_mode}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                      <Database className="size-2.5 text-primary" />
                      {t.tech_stack.db_engine || "postgres_neon"}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(t.active_modules || []).slice(0, 3).map((mod) => (
                        <span key={mod} className="rounded px-1.5 py-0.5 bg-muted text-[10px] font-bold text-muted-foreground">
                          {mod}
                        </span>
                      ))}
                      {(t.active_modules || []).length > 3 && (
                        <span className="rounded px-1 py-0.5 bg-muted/60 text-[10px] font-mono text-muted-foreground">
                          +{(t.active_modules || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-foreground num">{formatCurrency(t.stats?.sales_volume_egp || 0)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      {t.stats?.users_count || 0} مستخدم • {t.stats?.products_count || 0} صنف
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : t.status === "trial"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : t.status === "offline_licensed"
                          ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {t.status === "active"
                        ? "نشط"
                        : t.status === "trial"
                        ? "تجريبي"
                        : t.status === "offline_licensed"
                        ? "ترخيص مكتبي"
                        : t.status === "suspended"
                        ? "معلق"
                        : t.status}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleImpersonate(t.id)}
                        className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 font-semibold"
                        title="الدخول الفوري كمدير لهذه الشركة"
                      >
                        <LogIn className="size-3.5" />
                        دخول
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(t);
                          setIsTechStackModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="تخصيص البنية التقنية ومحرك DB"
                      >
                        <Sliders className="size-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerateLicense(t)}
                        className="h-7 w-7 p-0 text-purple-500 hover:bg-purple-500/10"
                        title="توليد ترخيص مكتبي .exe"
                      >
                        <KeyRound className="size-3.5" />
                      </Button>

                      {t.status === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetStatus(t.id, "suspended")}
                          className="h-7 w-7 p-0 text-amber-500 hover:bg-amber-500/10"
                          title="تعليق المنشأة"
                        >
                          <PauseCircle className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetStatus(t.id, "active")}
                          className="h-7 w-7 p-0 text-emerald-500 hover:bg-emerald-500/10"
                          title="تنشيط المنشأة"
                        >
                          <PlayCircle className="size-3.5" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmTarget(t)}
                        className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        title="حذف المنشأة"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">تأكيد حذف مساحة العمل نهائياً</h3>
                <p className="text-xs text-muted-foreground">هذا الإجراء لا يمكن التراجع عنه.</p>
              </div>
            </div>

            <p className="text-xs text-foreground/80 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف منشأة{" "}
              <strong className="text-foreground font-bold">"{deleteConfirmTarget.name}"</strong> (/{deleteConfirmTarget.slug})؟
              سيتم حذف كافة البيانات والفواتير وحسابات المستخدمين التابعة لها.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmTarget(null)} className="text-xs">
                إلغاء
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteTenant} className="text-xs font-bold">
                نعم، احذف نهائياً
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tech Stack Customization Modal */}
      {isTechStackModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sliders className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">تخصيص البنية التقنية (Tech Stack)</h3>
                  <p className="text-xs text-muted-foreground">{selectedTenant.name}</p>
                </div>
              </div>
              <button onClick={() => setIsTechStackModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">نمط الاستضافة:</label>
                <select
                  value={selectedTenant.deployment_mode}
                  onChange={(e) =>
                    setSelectedTenant({ ...selectedTenant, deployment_mode: e.target.value })
                  }
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="cloud_saas">سحابي كامل (Cloud SaaS)</option>
                  <option value="desktop_standalone">مكتبي محلي مستقل (.exe)</option>
                  <option value="lan_deployment">شبكة محلية للمنشأة (LAN)</option>
                  <option value="vps_deployment">خادم افتراضي خاص (VPS)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">محرك قاعدة البيانات:</label>
                <select
                  value={selectedTenant.tech_stack?.db_engine || "postgres_neon"}
                  onChange={(e) =>
                    setSelectedTenant({
                      ...selectedTenant,
                      tech_stack: { ...selectedTenant.tech_stack, db_engine: e.target.value },
                    })
                  }
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="postgres_neon">Neon Serverless PostgreSQL</option>
                  <option value="postgres_shared">PostgreSQL المشترك (Isolated Schema)</option>
                  <option value="mysql">MySQL 8.0 على VPS</option>
                  <option value="sqlite_local">SQLite مدمج (Local Embedded)</option>
                  <option value="firestore">Google Cloud Firestore (NoSQL)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">وسيط التخزين:</label>
                <select
                  value={selectedTenant.tech_stack?.storage_driver || "local"}
                  onChange={(e) =>
                    setSelectedTenant({
                      ...selectedTenant,
                      tech_stack: { ...selectedTenant.tech_stack, storage_driver: e.target.value },
                    })
                  }
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="local">Local Filesystem</option>
                  <option value="s3_minio">AWS S3 / MinIO / Cloudflare R2</option>
                  <option value="firebase_storage">Firebase Cloud Storage</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setIsTechStackModalOpen(false)} className="text-xs">
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await api.put(`/admoon/tenants/${selectedTenant.id}/tech-stack`, {
                      deployment_mode: selectedTenant.deployment_mode,
                      db_engine: selectedTenant.tech_stack.db_engine || "postgres_neon",
                      storage_driver: selectedTenant.tech_stack.storage_driver || "local",
                    });
                    toast.success("تم تحديث البنية التقنية بنجاح");
                    setIsTechStackModalOpen(false);
                    fetchTenants();
                  } catch {
                    toast.error("فشل حفظ البنية التقنية");
                  }
                }}
                className="text-xs font-bold"
              >
                حفظ البنية التقنية
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offline License Modal */}
      {licenseModalData && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">مفتاح الترخيص المكتبي (.exe)</h3>
                  <p className="text-xs text-muted-foreground font-mono">{licenseModalData.name}</p>
                </div>
              </div>
              <button onClick={() => setLicenseModalData(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/30 font-mono text-xs break-all leading-relaxed select-all">
              {licenseModalData.key}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(licenseModalData.key);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-xs gap-1.5"
              >
                {copiedKey ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copiedKey ? "تم النسخ للحافظة" : "نسخ المفتاح المشفر"}
              </Button>
              <Button size="sm" onClick={() => setLicenseModalData(null)} className="text-xs font-bold">
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
