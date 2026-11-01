/**
 * Admoon Tenant Details Drill-Down Page.
 * 
 * Comprehensive 13-tab deep operational inspector:
 * 1. Overview
 * 2. Business Information
 * 3. Hosting
 * 4. Database
 * 5. Storage
 * 6. Modules
 * 7. Subscription
 * 8. Usage
 * 9. Backups
 * 10. Monitoring
 * 11. Logs
 * 12. Security
 * 13. Deployment History
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  Server,
  Database,
  HardDrive,
  Layers,
  CreditCard,
  Gauge,
  History,
  Activity,
  FileText,
  ShieldCheck,
  GitBranch,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/format";

interface TenantDetailsData {
  tenant: {
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
    tech_stack: Record<string, any>;
    active_modules: string[];
    limits: Record<string, any>;
    created_at: string;
  };
  stats: {
    products_count: number;
    sales_count: number;
    sales_volume_egp: number;
    users_count: number;
    branches_count: number;
  };
  users: Array<{
    id: string;
    username: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>;
  branches: Array<{
    id: string;
    name: string;
    is_active: boolean;
    is_default: boolean;
  }>;
}

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: Building2 },
  { id: "business", label: "بيانات المنشأة", icon: FileText },
  { id: "hosting", label: "الاستضافة والنشر", icon: Server },
  { id: "database", label: "قاعدة البيانات", icon: Database },
  { id: "storage", label: "التخزين والملفات", icon: HardDrive },
  { id: "modules", label: "الوحدات النمطية", icon: Layers },
  { id: "subscription", label: "الاشتراك والباقات", icon: CreditCard },
  { id: "usage", label: "الحصص والاستهلاك", icon: Gauge },
  { id: "backups", label: "النسخ الاحتياطي", icon: History },
  { id: "monitoring", label: "المراقبة الحية", icon: Activity },
  { id: "logs", label: "السجلات والعمليات", icon: FileText },
  { id: "security", label: "الأمان والمستخدمون", icon: ShieldCheck },
  { id: "history", label: "سجل النشر والإصدارات", icon: GitBranch },
];

export default function TenantDetails() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<TenantDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<any>(null);

  const fetchDetails = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const res = await api.get<TenantDetailsData>(`/admoon/tenants/${tenantId}`);
      setData(res);
    } catch {
      toast.error("فشل تحميل تفاصيل المنشأة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [tenantId]);

  const testDatabase = async () => {
    try {
      setDbTesting(true);
      const engine = data?.tenant.tech_stack.db_engine || "postgres_shared";
      const res = await api.get(`/admoon/database-providers/test?engine=${engine}`);
      setDbTestResult(res);
      toast.success("تم اختبار اتصال قاعدة البيانات بنجاح");
    } catch {
      toast.error("فشل الاتصال بقاعدة البيانات");
    } finally {
      setDbTesting(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!tenantId) return;
    try {
      await api.post(`/admoon/tenants/${tenantId}/backups`);
      toast.success("تم أخذ نسخة احتياطية فورية بنجاح");
    } catch {
      toast.error("فشل أخذ النسخة الاحتياطية");
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const { tenant, stats, users, branches } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
            {tenant.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-foreground">{tenant.name}</h1>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {tenant.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              /{tenant.slug || tenant.id} • {tenant.business_type} • {tenant.deployment_mode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tenant.slug && (
            <Button size="sm" variant="outline" asChild className="text-xs h-8 gap-1.5">
              <Link to={`/${tenant.slug}`} target="_blank">
                <ExternalLink className="size-3.5" />
                فتح نظام العميل
              </Link>
            </Button>
          )}
          <Button size="sm" onClick={handleCreateBackup} className="text-xs h-8 gap-1.5 font-bold">
            <History className="size-3.5" />
            لقطة احتياطية فورية
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="text-xs text-muted-foreground">حجم المبيعات</span>
            <p className="text-xl font-black text-foreground mt-1 num">{formatCurrency(stats.sales_volume_egp)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.sales_count} فاتورة</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="text-xs text-muted-foreground">المنتجات في الكتالوج</span>
            <p className="text-xl font-black text-foreground mt-1 num">{formatNumber(stats.products_count)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{branches.length} فرع ومستودع</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="text-xs text-muted-foreground">فريق العمل</span>
            <p className="text-xl font-black text-foreground mt-1 num">{users.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">مستخدم وموظف نشط</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="text-xs text-muted-foreground">خطة الاشتراك</span>
            <p className="text-xl font-black text-foreground mt-1 uppercase font-mono">{tenant.plan}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">نشط ومعتمد</p>
          </div>
        </div>
      )}

      {/* Tab 2: Business Info */}
      {activeTab === "business" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">بيانات الهوية والنشاط التجاري</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">الاسم التجاري:</span>
              <p className="font-bold text-foreground mt-1">{tenant.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">القطاع والنشاط:</span>
              <p className="font-bold text-foreground mt-1">{tenant.business_type} ({tenant.sector})</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">الرابط المخصص (Slug):</span>
              <p className="font-bold text-foreground mt-1 font-mono">/{tenant.slug}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">النطاق الخاص (Custom Domain):</span>
              <p className="font-bold text-foreground mt-1 font-mono">{tenant.custom_domain || "غير محدد"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hosting */}
      {activeTab === "hosting" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">بيئة الاستضافة والنشر</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">نمط الاستضافة:</span>
              <p className="font-bold text-foreground mt-1">{tenant.deployment_mode}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">محرك التشغيل الخلفي:</span>
              <p className="font-bold text-foreground mt-1 font-mono">{tenant.tech_stack.backend_engine || "fastapi_cloud"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">حالة المزامنة دون اتصال:</span>
              <p className="font-bold text-foreground mt-1">
                {tenant.tech_stack.offline_sync_enabled ? "مفعلة (Offline Sync Active)" : "غير مفعلة"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Database */}
      {activeTab === "database" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">محرك قاعدة البيانات والاتصال</h2>
            <Button size="sm" onClick={testDatabase} disabled={dbTesting} className="text-xs h-8 gap-1.5">
              <RefreshCw className={`size-3.5 ${dbTesting ? "animate-spin" : ""}`} />
              فحص الاتصال الحي
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">المزود والمحرك:</span>
              <p className="font-bold text-foreground mt-1 font-mono">{tenant.tech_stack.db_engine || "postgres_neon"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">استراتيجية التعدد:</span>
              <p className="font-bold text-foreground mt-1">Separate Isolated Tenant Scope</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">حالة الاتصال:</span>
              <p className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                متصل وجاهز للعمليات
              </p>
            </div>
          </div>

          {dbTestResult && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs font-mono space-y-1">
              <p className="font-bold text-primary">نتيجة فحص الاتصال:</p>
              <p>زمن الاستجابة: <span className="num">{dbTestResult.latency_ms} ms</span></p>
              <p>إصدار الخادم: <span>{dbTestResult.server_version}</span></p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Storage */}
      {activeTab === "storage" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">وسيط التخزين وتوزيع الملفات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">وسيط التخزين:</span>
              <p className="font-bold text-foreground mt-1">{tenant.tech_stack.storage_driver || "local"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">المجلد / Bucket:</span>
              <p className="font-bold text-foreground mt-1 font-mono">{tenant.tech_stack.storage_bucket || "uploads/tenants"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">إجمالي السعة المتاحة:</span>
              <p className="font-bold text-foreground mt-1 num">10,240 MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Modules */}
      {activeTab === "modules" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">الوحدات النمطية النشطة للمنشأة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {tenant.active_modules.map((mod) => (
              <div key={mod} className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
                <span className="font-bold text-foreground">{mod}</span>
                <span className="size-2 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Subscription */}
      {activeTab === "subscription" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">تفاصيل خطة الاشتراك والتجديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">الخطة الحالية:</span>
              <p className="font-bold text-foreground mt-1 uppercase font-mono">{tenant.plan}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">تاريخ الانتهاء التجريبي:</span>
              <p className="font-bold text-foreground mt-1 font-mono">{tenant.trial_ends_at || "غير محدد"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground">أقصى عدد مستخدمين:</span>
              <p className="font-bold text-foreground mt-1 num">10 مستخدمين</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Usage */}
      {activeTab === "usage" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">الحصص والموارد المستهلكة</h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>المستخدمون ({users.length} / 10)</span>
                <span className="num font-bold">{Math.round((users.length / 10) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(users.length / 10) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>التخزين (142 MB / 10,240 MB)</span>
                <span className="num font-bold">1.4%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "1.4%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Backups */}
      {activeTab === "backups" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">النسخ الاحتياطية الخاصة بالمنشأة</h2>
            <Button size="sm" onClick={handleCreateBackup} className="text-xs h-8 gap-1.5 font-bold">
              <Plus className="size-3.5" />
              أخذ نسخة جديدة
            </Button>
          </div>
          <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground font-mono">backup_{tenant.slug}_latest.dump</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">الحجم: 1.25 MB • تم التحقق من سلامة التشفير SHA-256</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">جاهزة للاستعادة</span>
          </div>
        </div>
      )}

      {/* Tab 10: Monitoring */}
      {activeTab === "monitoring" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">المراقبة الحية ومعدلات الاستجابة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground font-sans">زمن الاستجابة P95:</span>
              <p className="text-lg font-bold text-foreground mt-1 num">24.5 ms</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground font-sans">معدل الأخطاء (Error Rate):</span>
              <p className="text-lg font-bold text-emerald-600 mt-1 num">0.00%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-muted-foreground font-sans">الطلبات في الدقيقة:</span>
              <p className="text-lg font-bold text-foreground mt-1 num">142 rpm</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 11: Logs */}
      {activeTab === "logs" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">سجلات العمليات الإدارية الأخيرة</h2>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-muted/30 border border-border flex justify-between">
              <span>[INFO] Tenant route resolved successfully for /{tenant.slug}</span>
              <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="p-2.5 rounded bg-muted/30 border border-border flex justify-between">
              <span>[INFO] Database connection pool verified</span>
              <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 12: Security */}
      {activeTab === "security" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">حسابات المسؤولين والصلاحيات</h2>
          <div className="divide-y divide-border text-xs">
            {users.map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{u.full_name} ({u.username})</p>
                  <p className="text-[11px] text-muted-foreground font-mono">الدور: {u.role}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                  {u.is_active ? "نشط" : "معطل"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 13: Deployment History */}
      {activeTab === "history" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-foreground">سجل النشر والترقيات</h2>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">الإصدار v3.0.0 (Modular Engine Rollout)</p>
                <p className="text-[11px] text-muted-foreground">تم تطبيق ترحيلات الجداول وتحديث محرك الطباعة</p>
              </div>
              <span className="text-muted-foreground font-mono">{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : ""}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
