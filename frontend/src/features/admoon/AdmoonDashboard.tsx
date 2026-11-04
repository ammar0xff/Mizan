/**
 * PAGE CONTRACT
 * Page: Admoon Control Plane (/admoon)
 * User: SaaS Platform Owner (admoon / ammar)
 * Outcome: Complete cross-tenant visibility, client ERP infrastructure customization, module toggling, one-click impersonation, and offline license generation.
 * Visual standard: Borders-first elevation, OKLCH semantic tokens, .num tabular lining figures, zero AI tell.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Database,
  KeyRound,
  LogIn,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Shield,
  ArrowRight,
  Sliders,
  DollarSign,
  Users,
  Package,
  Copy,
  Check,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/stores/auth";
import { useUiStore, type ThemePalette } from "@/stores/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdmoonOverview {
  kpis: {
    total_tenants: number;
    active_tenants: number;
    trial_tenants: number;
    suspended_tenants: number;
    total_users: number;
    total_sales: number;
    total_sales_volume_egp: number;
    total_products: number;
  };
  breakdowns: {
    deployment_modes: Record<string, number>;
    business_types: Record<string, number>;
    plans: Record<string, number>;
  };
}

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

const MODULE_DEFINITIONS = [
  { id: "pos", name: "نقطة بيع سريعة (POS)", desc: "باركود، اختصارات سريعة، وإيصالات حرارية" },
  { id: "inventory", name: "المستودعات والمخزون", desc: "تتبع الكميات، حد الطلب، والتحويلات" },
  { id: "gym", name: "إدارة النوادي الرياضية (Gym)", desc: "اشتراكات الأعضاء، الدخول البيومتري، وخطط التدريب" },
  { id: "restaurant", name: "إدارة المطاعم والصالة", desc: "توزيع الطاولات، شاشات المطبخ KDS، وفصل الشيكات" },
  { id: "school", name: "المدارس والأكاديميات", desc: "شؤون الطلاب، الأقساط، وسندات الرسوم المدرسية" },
  { id: "finance", name: "الخزائن والمعاملات المالية", desc: "دفاتر النقدية، الحسابات البنكية، والمصروفات" },
  { id: "hr", name: "شؤون الموظفين والرواتب", desc: "الورديات، الحضور والانصراف، ومسيرات الأجور" },
];

export default function AdmoonDashboard() {
  const [overview, setOverview] = useState<AdmoonOverview | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  // Modals state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [licenseModalData, setLicenseModalData] = useState<{ key: string; name: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Provision Form state
  const [provName, setProvName] = useState("");
  const [provSlug, setProvSlug] = useState("");
  const [provDomain, setProvDomain] = useState("");
  const [provBusinessType, setProvBusinessType] = useState("gym");
  const [provMode, setProvMode] = useState("cloud_saas");
  const [provDbEngine, setProvDbEngine] = useState("postgres_neon");
  const [provDbUri, setProvDbUri] = useState("");
  const [provStorage, setProvStorage] = useState("local");
  const [provModules, setProvModules] = useState<string[]>(["pos", "inventory", "gym"]);
  const [provOwnerUser, setProvOwnerUser] = useState("");
  const [provOwnerPass, setProvOwnerPass] = useState("");
  const [provOwnerName, setProvOwnerName] = useState("");
  const [submittingProv, setSubmittingProv] = useState(false);

  // Superadmin Gate State
  const [isForbidden, setIsForbidden] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [superUser, setSuperUser] = useState("ammar");
  const [superPass, setSuperPass] = useState("changeme");
  const [authenticating, setAuthenticating] = useState(false);
  const currentUser = useAuth((s) => s.user);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setIsForbidden(false);
      const [ovData, tnData] = await Promise.all([
        api.get<AdmoonOverview>("/admoon/overview"),
        api.get<{ items: TenantItem[] }>("/admoon/tenants"),
      ]);
      setOverview(ovData);
      setTenants(tnData.items);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
        setIsForbidden(true);
      } else {
        toast.error(err instanceof ApiError ? err.message : "فشل تحميل بيانات أديمون");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuperadminLogin = async (username = superUser, password = superPass) => {
    try {
      setAuthenticating(true);
      setAuthError(null);
      const r = await api.post<{
        access_token: string;
        user_id: string;
        username: string;
        role: string;
        full_name: string;
      }>("/auth/login", { username, password });

      useAuth.getState().setToken(r.access_token);
      const me = await api.get<import("@/stores/auth").User & { tenant?: import("@/stores/auth").TenantInfo }>("/auth/me");
      useAuth.getState().setUser(me);
      if (me.tenant) {
        useAuth.getState().setTenant(me.tenant);
      }
      toast.success("تم تسجيل الدخول بنجاح كمالك المنصة");
      setIsForbidden(false);
      fetchAll();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "تعذر التحقق من بيانات المالك الخارق");
    } finally {
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleImpersonate = async (tenant: TenantItem) => {
    try {
      const res = await api.post<{
        access_token: string;
        user: import("@/stores/auth").User;
        tenant: import("@/stores/auth").TenantInfo;
        redirect_path: string;
      }>(`/admoon/tenants/${tenant.id}/impersonate`, {});

      // Switch context to tenant
      useAuth.getState().login(res.access_token, res.user);
      useAuth.getState().setTenant(res.tenant);
      if (res.tenant.palette?.name) {
        useUiStore.getState().setPalette(res.tenant.palette.name as ThemePalette);
      }

      toast.success(`تم الدخول بنجاح كمدير لمنشأة "${tenant.name}"`);
      window.location.href = import.meta.env.BASE_URL ?? "/";
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر الدخول كمدير المنشأة");
    }
  };

  const handleGenerateLicense = async (tenant: TenantItem) => {
    try {
      const res = await api.post<{ license_key: string }>(
        `/admoon/tenants/${tenant.id}/license-key?valid_days=365`,
        {}
      );
      setLicenseModalData({ key: res.license_key, name: tenant.name });
      toast.success("تم توليد مفتاح ترخيص الأوفلاين للنسخة المكتبية بنجاح");
      fetchAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فشل توليد مفتاح الترخيص");
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName || !provSlug || !provOwnerUser || !provOwnerPass) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSubmittingProv(true);
    try {
      await api.post("/admoon/tenants", {
        company_name: provName,
        slug: provSlug,
        custom_domain: provDomain || null,
        business_type: provBusinessType,
        sector: provBusinessType === "gym" ? "services" : provBusinessType,
        deployment_mode: provMode,
        tech_stack: {
          deployment_mode: provMode,
          db_engine: provDbEngine,
          db_connection_uri: provDbUri || null,
          storage_driver: provStorage,
          offline_sync_enabled: provMode === "desktop_standalone" || provMode === "hybrid_sync",
        },
        active_modules: provModules,
        owner_username: provOwnerUser,
        owner_password: provOwnerPass,
        owner_full_name: provOwnerName || provOwnerUser,
      });

      toast.success(`تم تأسيس منشأة "${provName}" بنجاح وتجهيز وحداتها`);
      setIsProvisionOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فشل تأسيس المنشأة");
    } finally {
      setSubmittingProv(false);
    }
  };

  const handleSaveTechStack = async () => {
    if (!selectedTenant) return;
    try {
      await Promise.all([
        api.put(`/admoon/tenants/${selectedTenant.id}/tech-stack`, {
          deployment_mode: selectedTenant.deployment_mode,
          db_engine: selectedTenant.tech_stack.db_engine || "postgres_neon",
          db_connection_uri: selectedTenant.tech_stack.db_connection_uri || null,
          storage_driver: selectedTenant.tech_stack.storage_driver || "local",
          storage_bucket: selectedTenant.tech_stack.storage_bucket || null,
          backend_engine: selectedTenant.tech_stack.backend_engine || "fastapi_cloud",
          offline_sync_enabled: !!selectedTenant.tech_stack.offline_sync_enabled,
        }),
        api.put(`/admoon/tenants/${selectedTenant.id}/modules`, {
          active_modules: selectedTenant.active_modules,
        }),
        api.put(`/admoon/tenants/${selectedTenant.id}`, {
          slug: selectedTenant.slug,
          custom_domain: selectedTenant.custom_domain,
          status: selectedTenant.status,
          business_type: selectedTenant.business_type,
        }),
      ]);

      toast.success("تم حفظ إعدادات البنية التقنية والوحدات بنجاح");
      setIsTechStackModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فشل حفظ التعديلات");
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (modeFilter !== "all" && t.deployment_mode !== modeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchSlug = (t.slug || "").toLowerCase().includes(q);
      const matchDomain = (t.custom_domain || "").toLowerCase().includes(q);
      const matchType = (t.business_type || "").toLowerCase().includes(q);
      return matchName || matchSlug || matchDomain || matchType;
    }
    return true;
  });

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs">
              <Shield className="size-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">بوابة الإدارة العليا (Admoon)</h1>
              <p className="text-xs text-muted-foreground font-mono">SaaS Control Plane Authentication</p>
            </div>
          </div>

          {currentUser ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
              <p className="font-bold text-amber-500">حسابك الحالي غير مخول:</p>
              <p className="leading-relaxed text-foreground/80">
                أنت مسجل حالياً بحساب <span className="font-bold text-foreground font-mono">({currentUser.username})</span> بدور <span className="font-bold text-foreground">({currentUser.role})</span>.
                لوحة أديمون مخصصة حصرياً لمالك المنصة (Superadmin) لإدارة ومتابعة كافة المنشآت.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              يرجى تسجيل الدخول بحساب مالك المنصة المعتمد للوصول إلى لوحة التحكم الإدارية لكافة المنشآت.
            </p>
          )}

          {authError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {authError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSuperadminLogin();
            }}
            className="space-y-4 pt-1"
          >
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">اسم المستخدم للمالك</label>
              <input
                type="text"
                value={superUser}
                onChange={(e) => setSuperUser(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">كلمة المرور</label>
              <input
                type="password"
                value={superPass}
                onChange={(e) => setSuperPass(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                required
                autoFocus
              />
            </div>

            <Button type="submit" disabled={authenticating} className="w-full font-bold text-xs h-9">
              {authenticating ? "جارٍ التحقق..." : "مصادقة المالك الخارق والدخول"}
            </Button>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleSuperadminLogin("ammar", "changeme")}
                disabled={authenticating}
                className="text-primary hover:underline font-semibold"
              >
                دخول سريع كـ ammar (Superadmin)
              </button>
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                العودة للرئيسية
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      {/* Topmast Platform Navigation */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-xs">
            <Shield className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight">admoon</span>
              <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                SaaS Control Plane
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">الإدارة العامة لشركات ومنشآت المنظومة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 gap-1.5 text-xs font-semibold"
            onClick={fetchAll}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>تحديث</span>
          </Button>

          <Button
            className="h-8 gap-1.5 text-xs font-bold"
            onClick={() => setIsProvisionOpen(true)}
          >
            <Plus className="size-3.5" />
            <span>تأسيس منشأة جديدة</span>
          </Button>

          <Link to="/">
            <Button variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground">
              <span>العودة للمتجر</span>
              <ArrowRight className="size-3.5 rotate-180" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Control Plane Viewport */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Platform Overview KPIs */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium">إجمالي المنشآت</span>
                <Building2 className="size-4 text-primary" />
              </div>
              <div className="text-2xl font-black font-mono num">
                {overview.kpis.total_tenants}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span className="text-emerald-500 font-semibold">{overview.kpis.active_tenants} نشطة</span>
                <span>•</span>
                <span>{overview.kpis.trial_tenants} تجريبية</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium">إجمالي مبيعات المنظومة</span>
                <DollarSign className="size-4 text-primary" />
              </div>
              <div className="text-2xl font-black font-mono num">
                {overview.kpis.total_sales_volume_egp.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                عبر {overview.kpis.total_sales} فاتورة مسجلة
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium">المستخدمين المسجلين</span>
                <Users className="size-4 text-primary" />
              </div>
              <div className="text-2xl font-black font-mono num">
                {overview.kpis.total_users}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                مشغلو كاشير ومديرو فروع
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium">إجمالي أصناف المخزون</span>
                <Package className="size-4 text-primary" />
              </div>
              <div className="text-2xl font-black font-mono num">
                {overview.kpis.total_products}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                أصناف، وجبات، وخدمات
              </div>
            </div>
          </div>
        )}

        {/* Directory Controls & Search */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث باسم المنشأة، الرابط التعريفي (/monset-gym)، أو النطاق..."
                className="ps-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-3 text-xs font-medium"
              >
                <option value="all">كافة أنماط النشر والتشغيل</option>
                <option value="cloud_saas">سحابي متعدد (Cloud SaaS)</option>
                <option value="firebase_cloud">فايربيس سحابي (Firebase)</option>
                <option value="dedicated_sql">قاعدة مخصصة (Dedicated SQL)</option>
                <option value="desktop_standalone">مكتبي محلي مستقل (.exe)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-3 text-xs font-medium"
              >
                <option value="all">كافة الحالات</option>
                <option value="active">نشطة (Active)</option>
                <option value="trial">تجريبية (Trial)</option>
                <option value="offline_licensed">مرخصة أوفلاين</option>
                <option value="suspended">موقوفة (Suspended)</option>
              </select>
            </div>
          </div>

          {/* Tenants Master Table */}
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-border/80 bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">المنشأة والرابط التعريفي (Slug / Root)</th>
                  <th className="p-3 text-start">البنية التقنية (Tech Stack)</th>
                  <th className="p-3 text-start">مجال العمل والوحدات</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">الإحصائيات الحية</th>
                  <th className="p-3 text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      لا توجد منشآت مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-sm text-foreground">{t.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-primary font-bold">
                            /{t.slug || "no-slug"}
                          </span>
                          {t.custom_domain && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              • <ExternalLink className="size-2.5" /> {t.custom_domain}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px]">
                          {t.deployment_mode === "firebase_cloud" ? (
                            <>
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              <span className="font-semibold text-amber-500">Firebase Firestore</span>
                            </>
                          ) : t.deployment_mode === "desktop_standalone" ? (
                            <>
                              <span className="size-1.5 rounded-full bg-purple-500" />
                              <span className="font-semibold text-purple-400">Desktop .exe (SQLite)</span>
                            </>
                          ) : t.deployment_mode === "dedicated_sql" ? (
                            <>
                              <span className="size-1.5 rounded-full bg-blue-500" />
                              <span className="font-semibold text-blue-400">Dedicated SQL</span>
                            </>
                          ) : (
                            <>
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span className="font-semibold text-foreground">Postgres Neon (RLS)</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                          {t.tech_stack.storage_driver || "local"} storage
                          {t.tech_stack.offline_sync_enabled ? " • offline sync ✓" : ""}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-foreground capitalize">
                          {t.business_type === "gym"
                            ? "نادي رياضي (Gym)"
                            : t.business_type === "restaurant"
                            ? "مطاعم وضيافة"
                            : t.business_type === "school"
                            ? "مدارس وأكاديميات"
                            : t.business_type}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(t.active_modules || []).slice(0, 3).map((m) => (
                            <span
                              key={m}
                              className="rounded border border-border/60 bg-muted/30 px-1 py-0.2 text-[9px] font-mono text-muted-foreground"
                            >
                              {m}
                            </span>
                          ))}
                          {(t.active_modules || []).length > 3 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{(t.active_modules || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                            t.status === "active"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : t.status === "offline_licensed"
                              ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                              : t.status === "suspended"
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          )}
                        >
                          <span className="size-1 rounded-full bg-current" />
                          {t.status === "active"
                            ? "نشطة"
                            : t.status === "offline_licensed"
                            ? "مرخصة أوفلاين"
                            : t.status === "suspended"
                            ? "موقوفة"
                            : "تجريبية"}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        <div>المستخدمين: <span className="font-bold text-foreground num">{t.stats.users_count}</span></div>
                        <div>الأصناف: <span className="font-bold text-foreground num">{t.stats.products_count}</span></div>
                        <div>المبيعات: <span className="font-bold text-primary num">{t.stats.sales_volume_egp.toLocaleString()} ج.م</span></div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Impersonate Button */}
                          <Button
                            className="h-7 px-2.5 gap-1 text-[11px] font-bold"
                            onClick={() => handleImpersonate(t)}
                            title="دخول فوري كمدير لهذه المنشأة"
                          >
                            <LogIn className="size-3" />
                            <span>دخول كمدير</span>
                          </Button>

                          {/* Tech Stack & Modules Config */}
                          <Button
                            variant="outline"
                            className="h-7 px-2 gap-1 text-[11px]"
                            onClick={() => {
                              setSelectedTenant(JSON.parse(JSON.stringify(t)));
                              setIsTechStackModalOpen(true);
                            }}
                            title="تعديل البنية التقنية والوحدات"
                          >
                            <Sliders className="size-3" />
                            <span>البنية والوحدات</span>
                          </Button>

                          {/* License Generator */}
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={() => handleGenerateLicense(t)}
                            title="توليد مفتاح ترخيص للنسخة المكتبية (.exe)"
                          >
                            <KeyRound className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: Provision New Client ERP */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">تأسيس مساحة عمل ومنظومة عميل جديدة</h2>
              </div>
              <button
                onClick={() => setIsProvisionOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">اسم الشركة / العميل</label>
                  <Input
                    value={provName}
                    onChange={(e) => {
                      setProvName(e.target.value);
                      if (!provSlug) {
                        setProvSlug(
                          e.target.value
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, "-")
                            .replace(/-+/g, "-")
                        );
                      }
                    }}
                    placeholder="مثال: نادي مونست الرياضي"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    الرابط التعريفي الجذر (Slug / Path)
                  </label>
                  <Input
                    value={provSlug}
                    onChange={(e) => setProvSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="monset-gym"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    يتاح كـ: domain.com/{provSlug || "slug"} أو {provSlug || "slug"}.domain.com
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">
                  النطاق المخصص (اختياري Custom Domain)
                </label>
                <Input
                  value={provDomain}
                  onChange={(e) => setProvDomain(e.target.value)}
                  placeholder="erp.monset-gym.com"
                  className="font-mono text-xs"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">مجال العمل التخصصي</label>
                  <select
                    value={provBusinessType}
                    onChange={(e) => {
                      setProvBusinessType(e.target.value);
                      if (e.target.value === "gym") setProvModules(["pos", "inventory", "gym", "finance"]);
                      else if (e.target.value === "restaurant") setProvModules(["pos", "inventory", "restaurant"]);
                      else if (e.target.value === "school") setProvModules(["pos", "inventory", "school", "finance"]);
                    }}
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                  >
                    <option value="gym">نادي رياضي وصالة لياقة (Gym & Fitness)</option>
                    <option value="restaurant">مطعم، كافيه، وضيافة (Restaurant)</option>
                    <option value="school">مدرسة، أكاديمية، وتدريب (School)</option>
                    <option value="retail">سوبرماركت وتجزئة عامة (Retail)</option>
                    <option value="healthcare">صيدلية، عيادة، ورعاية (Healthcare)</option>
                    <option value="services">خدمات، مقاولات، واستشارات (Services)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">
                    نمط النشر والبنية التقنية (Custom Tech Stack)
                  </label>
                  <select
                    value={provMode}
                    onChange={(e) => {
                      setProvMode(e.target.value);
                      if (e.target.value === "firebase_cloud") {
                        setProvDbEngine("firestore");
                        setProvStorage("firebase_storage");
                      } else if (e.target.value === "desktop_standalone") {
                        setProvDbEngine("sqlite_local");
                        setProvStorage("local");
                      } else {
                        setProvDbEngine("postgres_neon");
                        setProvStorage("local");
                      }
                    }}
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs font-semibold"
                  >
                    <option value="cloud_saas">سحابي متعدد (Cloud SaaS - Postgres Neon / Shared)</option>
                    <option value="firebase_cloud">فايربيس متكامل (Firebase Firestore / Storage / Auth)</option>
                    <option value="dedicated_sql">قاعدة بيانات مخصصة (Dedicated PostgreSQL / MySQL)</option>
                    <option value="desktop_standalone">تطبيق مكتبي محلي مستقل (.exe مع SQLite داخلية)</option>
                    <option value="hybrid_sync">هجين متزامن (Local Offline POS + Cloud Sync)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Tech Stack Connection Inputs */}
              {(provMode === "dedicated_sql" || provMode === "firebase_cloud") && (
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Database className="size-3.5 text-primary" />
                    <span>تخصيص مسار الاتصال بقاعدة البيانات</span>
                  </div>
                  <Input
                    value={provDbUri}
                    onChange={(e) => setProvDbUri(e.target.value)}
                    placeholder={
                      provMode === "firebase_cloud"
                        ? "firestore://project-id-credentials"
                        : "postgresql://user:pass@db.client.com:5432/dbname"
                    }
                    className="font-mono text-xs"
                  />
                </div>
              )}

              {/* Modules selection */}
              <div>
                <label className="font-semibold text-foreground mb-1.5 block">
                  الوحدات المفعلة للعميل (Client ERP Modules)
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {MODULE_DEFINITIONS.map((m) => {
                    const isChecked = provModules.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setProvModules((prev) =>
                            prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                          )
                        }
                        className={cn(
                          "flex items-start gap-2 rounded-lg border p-2 text-start transition",
                          isChecked
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isChecked && <Check className="size-3" />}
                        </span>
                        <div>
                          <div className="font-bold text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">{m.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Owner account credentials */}
              <div className="border-t border-border/60 pt-3">
                <span className="font-bold text-foreground block mb-2">بيانات حساب مدير المنشأة الأول</span>
                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">اسم المدير الكامل</label>
                    <Input
                      value={provOwnerName}
                      onChange={(e) => setProvOwnerName(e.target.value)}
                      placeholder="الكابتن محمد"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">اسم المستخدم</label>
                    <Input
                      value={provOwnerUser}
                      onChange={(e) => setProvOwnerUser(e.target.value)}
                      placeholder="captain_admin"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">كلمة المرور</label>
                    <Input
                      type="password"
                      value={provOwnerPass}
                      onChange={(e) => setProvOwnerPass(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" type="button" onClick={() => setIsProvisionOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={submittingProv} className="font-bold">
                  {submittingProv ? "جارٍ التأسيس وبذر الكتالوج..." : "تأسيس مساحة العمل الآن ✓"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tech Stack & Modules Editor */}
      {isTechStackModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  تعديل البنية التقنية والوحدات: {selectedTenant.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  المعرف الجذري: <span className="font-mono text-primary">/{selectedTenant.slug}</span>
                </p>
              </div>
              <button
                onClick={() => setIsTechStackModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground mb-1 block">نمط التشغيل والنشر</label>
                  <select
                    value={selectedTenant.deployment_mode}
                    onChange={(e) =>
                      setSelectedTenant({ ...selectedTenant, deployment_mode: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs font-semibold"
                  >
                    <option value="cloud_saas">سحابي متعدد (Cloud SaaS - Postgres Neon / Shared)</option>
                    <option value="firebase_cloud">فايربيس متكامل (Firebase Firestore / Storage / Auth)</option>
                    <option value="dedicated_sql">قاعدة مخصصة (Dedicated PostgreSQL / MySQL)</option>
                    <option value="desktop_standalone">تطبيق مكتبي محلي مستقل (.exe مع SQLite)</option>
                    <option value="hybrid_sync">هجين متزامن (Local POS + Cloud Sync)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground mb-1 block">حالة المنشأة</label>
                  <select
                    value={selectedTenant.status}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, status: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                  >
                    <option value="active">نشطة ومفعلة (Active)</option>
                    <option value="trial">فترة تجريبية (Trial)</option>
                    <option value="offline_licensed">مرخصة أوفلاين (Offline Licensed)</option>
                    <option value="suspended">موقوفة مؤقتاً (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">مسار الاتصال بقاعدة البيانات</label>
                <Input
                  value={selectedTenant.tech_stack.db_connection_uri || ""}
                  onChange={(e) =>
                    setSelectedTenant({
                      ...selectedTenant,
                      tech_stack: { ...selectedTenant.tech_stack, db_connection_uri: e.target.value },
                    })
                  }
                  placeholder="اتركه فارغاً لاستخدام قاعدة المنظومة الافتراضية"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">مشغل التخزين والملفات</label>
                <select
                  value={selectedTenant.tech_stack.storage_driver || "local"}
                  onChange={(e) =>
                    setSelectedTenant({
                      ...selectedTenant,
                      tech_stack: { ...selectedTenant.tech_stack, storage_driver: e.target.value },
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                >
                  <option value="local">مساحة التخزين المحلية (Local FileSystem)</option>
                  <option value="s3_minio">متوافق مع S3 (MinIO / Cloudflare R2 / AWS S3)</option>
                  <option value="firebase_storage">فايربيس ستوريدج (Firebase Storage)</option>
                  <option value="gcs">جوجل كلاود ستوريدج (Google Cloud Storage)</option>
                </select>
              </div>

              {/* Active Modules Toggles */}
              <div>
                <label className="font-semibold text-foreground mb-1.5 block">الوحدات المفعلة للمنشأة</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {MODULE_DEFINITIONS.map((m) => {
                    const isChecked = (selectedTenant.active_modules || []).includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const cur = selectedTenant.active_modules || [];
                          const updated = isChecked ? cur.filter((x) => x !== m.id) : [...cur, m.id];
                          setSelectedTenant({ ...selectedTenant, active_modules: updated });
                        }}
                        className={cn(
                          "flex items-start gap-2 rounded-lg border p-2 text-start transition",
                          isChecked
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isChecked && <Check className="size-3" />}
                        </span>
                        <div>
                          <div className="font-bold text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">{m.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" onClick={() => setIsTechStackModalOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveTechStack} className="font-bold">
                  حفظ التعديلات ✓
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Offline License Key Display */}
      {licenseModalData && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-purple-400" />
                <h2 className="text-base font-bold text-foreground">مفتاح ترخيص أوفلاين للنسخة المكتبية</h2>
              </div>
              <button
                onClick={() => setLicenseModalData(null)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              تم توليد مفتاح ترخيص رقمي موقّع مشفّراً لمنشأة <strong className="text-foreground">{licenseModalData.name}</strong>.
              يتم وضع هذا المفتاح داخل ملف إعدادات البرنامج المكتبي (.exe) لتفعيل النظام أوفلاين بدون اتصال بالإنترنت.
            </p>

            <div className="relative rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] break-all select-all text-foreground">
              {licenseModalData.key}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">صالح لمدة 365 يوماً من تاريخ الإصدار</span>
              <Button
                className="gap-1.5 font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(licenseModalData.key);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                  toast.success("تم نسخ مفتاح الترخيص للحافظة");
                }}
              >
                {copiedKey ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKey ? "تم النسخ" : "نسخ المفتاح"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
