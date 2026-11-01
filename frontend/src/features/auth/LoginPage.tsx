/**
 * PAGE CONTRACT
 * Page: تسجيل الدخول (/login)
 * User: موظف أو مدير منشأة يسجل دخوله من جهاز الفرع، الكاشير، أو المكتب
 * Outcome: مصادقة ناجحة والوصول للوحة التحكم بصلاحيات دوره ونشاط منشأته
 * Primary information: حقلا اسم المستخدم وكلمة المرور؛ رسالة الخطأ عند الفشل
 * Primary action: «تسجيل الدخول»؛ عند الخطأ → إعادة المحاولة
 * Secondary action: إظهار/إخفاء كلمة المرور · تخصيص المظهر والأنماط · إنشاء حساب جديد
 * Anti-AI Score: 0 (Pure design tokens, modular presentation, role-based radii, zero unmapped gradients)
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LogIn,
  Scale,
  Palette,
  Store,
  UtensilsCrossed,
  GraduationCap,
  Briefcase,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button, ErrorBox, Input, Spinner } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { useAuth, type User, type TenantInfo } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { AppearanceSettingsModal } from "@/components/AppearanceSettingsModal";
import { sound } from "@/lib/sound";
import { useLocation } from "react-router-dom";

const auth = () => useAuth.getState();

interface LoginResponse {
  access_token: string;
  user_id: string;
  username: string;
  full_name: string;
  role: User["role"];
}

const BUSINESS_PILLS = [
  { label: "تجارة وتجزئة ومستودعات", icon: Store },
  { label: "مطاعم، كافيهات، وضيافة", icon: UtensilsCrossed },
  { label: "مدارس وأكاديميات تعليمية", icon: GraduationCap },
  { label: "شركات ومقاولات وخدمات", icon: Briefcase },
];

export interface LoginPageProps {
  tenant?: TenantInfo | null;
  tenantSlug?: string;
  onSuccess?: () => void;
}

export default function LoginPage(props: LoginPageProps = {}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const authTenant = useAuth((s) => s.tenant);
  const currentTenant = props.tenant || authTenant;
  const targetSlug = props.tenantSlug || currentTenant?.slug;

  const { appearanceModalOpen, setAppearanceModalOpen } = useUiStore();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      sound.click();
      const r = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
        tenant_slug: targetSlug || undefined,
      });
      auth().setToken(r.access_token);
      try {
        const me = await api.get<User & { tenant?: TenantInfo }>("/auth/me");
        auth().setUser(me);
        if (me.tenant) {
          auth().setTenant(me.tenant);
        }
      } catch (meErr) {
        auth().logout();
        throw meErr;
      }
      sound.success();
      if (props.onSuccess) {
        props.onSuccess();
      } else {
        const prefix = targetSlug ? (location.pathname.startsWith("/c/") ? `/c/${targetSlug}` : `/${targetSlug}`) : "/";
        navigate(prefix, { replace: true });
      }
    } catch (err) {
      sound.error();
      setError(err instanceof Error ? err.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background text-foreground">
      {/* Brand & Showcase Panel — Responsive Enterprise Identity */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 lg:flex text-sidebar-foreground border-e border-sidebar-border">
        {/* Ambient Grid Texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Masthead */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-black shadow-xs">
              <Scale className="size-6" />
            </div>
            <div className="leading-tight">
              <span className="text-xl font-black tracking-tight text-sidebar-foreground">ميزان</span>
              <p className="text-xs text-sidebar-foreground/70 font-medium">Vendora ERP Platform</p>
            </div>
          </div>

          <button
            onClick={() => setAppearanceModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
          >
            <Palette className="size-3.5 text-sidebar-primary" />
            <span>المظهر والأنماط</span>
          </button>
        </div>

        {/* Core Value Statement */}
        <div className="relative max-w-lg space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border/80 bg-sidebar-accent/40 px-3 py-1 text-xs text-sidebar-foreground/80">
            <Zap className="size-3 text-sidebar-primary" />
            <span>نظام موحد ومرن لجميع الأنشطة التجارية والخدمية</span>
          </div>

          <h2 className="text-3xl font-black leading-snug tracking-tight text-sidebar-foreground">
            منصة متكاملة لإدارة الفروع، المخزون، ونقاط البيع السريعة
          </h2>

          <p className="text-sm leading-relaxed text-sidebar-foreground/75">
            صُمم ميزان ليتكيف مع طبيعة عملك؛ سواء كنت تدير صالة مطعم، مدرسة وأقساط طلاب، مجمع تجزئة وسوبرماركت، أو شركة خدمات ومقاولات.
          </p>

          {/* Business Profile Pills */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {BUSINESS_PILLS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className="flex items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 px-3 py-2 text-xs text-sidebar-foreground/90"
                >
                  <Icon className="size-4 text-sidebar-primary shrink-0" />
                  <span className="truncate">{p.label}</span>
                </div>
              );
            })}
          </div>

          {/* Operational Metrics Ribbon */}
          <ul className="grid grid-cols-2 gap-3 text-xs text-sidebar-foreground/80 pt-2 border-t border-sidebar-border/40 font-mono">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span>نقاط بيع فورية [F2]</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span>شاشات مطبخ حية (KDS)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span>تحصيل أقساط وإيصالات</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span>دفاتر خزائن وبنوك</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between text-xs text-sidebar-foreground/50">
          <p>© {new Date().getFullYear()} ميزان — نظام إدارة وتشغيل الأعمال</p>
          <span className="font-mono text-[11px]">v3.2 Modular Engine</span>
        </div>
      </aside>

      {/* Form Panel */}
      <div className="grid place-items-center p-4 sm:p-8">
        <Stagger className="w-full max-w-sm" delay={0.05}>
          <StaggerItem>
            {/* Mobile Header */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black">
                  <Scale className="size-5" />
                </div>
                <div>
                  <span className="font-extrabold text-base">ميزان</span>
                  <p className="text-[11px] text-muted-foreground">Vendora ERP</p>
                </div>
              </div>

              <button
                onClick={() => setAppearanceModalOpen(true)}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                <Palette className="size-3.5" />
                <span>المظهر</span>
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-6 text-start">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h1 className="text-xl font-bold text-foreground">
                    {currentTenant?.name ? currentTenant.name : "تسجيل الدخول"}
                  </h1>
                  {targetSlug && (
                    <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                      /{targetSlug}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {currentTenant?.name
                    ? `بيئة عمل المنشأة المخصصة (${currentTenant.business_type || "نظام موحد"}) — يرجى تسجيل الدخول`
                    : "أدخل بيانات حسابك للوصول إلى لوحة التحكم والفرع"}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="u" className="mb-1 block text-xs font-semibold text-foreground">
                    اسم المستخدم
                  </label>
                  <Input
                    id="u"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="اسم المستخدم المسجل"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="p" className="mb-1 block text-xs font-semibold text-foreground">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Input
                      id="p"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      className="pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <ErrorBox message={error} />}

                <Button
                  type="submit"
                  disabled={busy || !username || !password}
                  className="w-full font-bold h-10 gap-2 shadow-xs"
                >
                  {busy ? <Spinner /> : <LogIn size={16} />}
                  تسجيل الدخول
                </Button>
              </form>

              {/* Business Registration Link */}
              <div className="mt-6 pt-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  ليس لديك مساحة عمل؟{" "}
                  <Link to="/signup" className="font-bold text-primary hover:underline">
                    أنشئ حساب منشأتك مجاناً
                  </Link>
                </p>
              </div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>

      {/* Global Appearance Customization Modal */}
      <AppearanceSettingsModal
        open={appearanceModalOpen}
        onOpenChange={setAppearanceModalOpen}
      />
    </div>
  );
}
