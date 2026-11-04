import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LogIn,
  Lock,
  User as UserIcon,
  Globe,
} from "lucide-react";
import { api } from "@/lib/api";
import { ErrorBox, Spinner } from "@/components/ui";
import { useAuth, type User, type TenantInfo } from "@/stores/auth";
import { sound } from "@/lib/sound";
import { MizanLogo } from "@/components/MizanLogo";
import { useTranslation } from "@/i18n";

const auth = () => useAuth.getState();

interface LoginResponse {
  access_token: string;
  user_id: string;
  username: string;
  full_name: string;
  role: User["role"];
}

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
  const { locale, dir, toggleLocale } = useTranslation();
  const isAr = locale === "ar";

  const authTenant = useAuth((s) => s.tenant);
  const currentTenant = props.tenant || authTenant;
  const targetSlug = props.tenantSlug || currentTenant?.slug;

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
        const prefix = targetSlug
          ? location.pathname.startsWith("/c/")
            ? `/c/${targetSlug}`
            : `/${targetSlug}`
          : "/";
        navigate(prefix, { replace: true });
      }
    } catch (err: any) {
      sound.error();
      setError(
        err?.response?.data?.detail ||
          (isAr
            ? "تعذر تسجيل الدخول، تأكد من صحة البيانات والمحاولة مجدداً"
            : "Failed to sign in. Please check your credentials.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      dir={dir}
      className={`min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FAF6F0] text-[#262321] ${
        isAr ? "font-body" : "font-sans"
      }`}
    >
      {/* ── LEFT PANEL: Deep Merlot Architectural Brand Cover (#35151D) ── */}
      <div className="lg:col-span-5 bg-[#35151D] text-[#FAF6F0] hero-concentric-arcs p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-e border-[#481822]">
        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <Link to="/" aria-label="Mizan ERP">
            <MizanLogo size="lg" theme="dark" locale={locale} />
          </Link>
          <button
            onClick={toggleLocale}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-[#E7D6C1] hover:bg-white/10 transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-[#D4626E]" />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
        </div>

        {/* Center Brand Statement matching Image 4 */}
        <div className="my-auto py-12 space-y-4 text-center z-10 max-w-sm mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
              <MizanLogo size="xl" variant="icon" theme="dark" />
            </div>
          </div>

          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl font-normal text-[#FAF6F0] tracking-tight leading-snug ${
              isAr ? "font-serif-ar" : "font-serif-en"
            }`}
          >
            {isAr ? "مرحباً بعودتك،" : "Welcome back,"}
            <br />
            <span className="italic text-[#D4626E]">
              {isAr ? "لنكمل معاً رحلتك." : "let's continue your journey."}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-[#E7D6C1]/80 leading-relaxed font-light">
            {isAr
              ? "نظام موحد ومرن لجميع الأنشطة التجارية والخدمية — توازن تام في كل تفاصيل الإدارة."
              : "An integrated, modular ecosystem uniting operations, finances, and people in perfect equilibrium."}
          </p>
        </div>

        {/* Bottom Status */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#E7D6C1]/60 z-10 font-mono">
          <span>© {new Date().getFullYear()} Mizan ERP</span>
          <span className="flex items-center gap-1.5 text-[#27835C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#27835C]" />
            <span>{isAr ? "المنظومة متصلة" : "All Systems Online"}</span>
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL: Warm Ivory Form Area (#FAF6F0) ── */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-[#FFFFFF] p-8 sm:p-10 rounded-3xl border border-[#DECFC0] shadow-xl">
          <div className="space-y-2 text-start">
            <h1
              className={`text-2xl sm:text-3xl font-semibold text-[#262321] tracking-tight ${
                isAr ? "font-serif-ar" : "font-serif-en"
              }`}
            >
              {isAr ? "تسجيل الدخول" : "Sign In to Mizan"}
            </h1>
            <p className="text-xs sm:text-sm text-[#77716E]">
              {isAr
                ? "أدخل بيانات حسابك للوصول إلى لوحة التحكم ومساحة العمل الخاصة بك."
                : "Enter your credentials to access your enterprise dashboard."}
            </p>
          </div>

          {error && <ErrorBox message={error} />}

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5 text-start">
              <label htmlFor="login-username" className="text-xs font-semibold text-[#262321]">
                {isAr ? "اسم المستخدم أو البريد" : "Username or Email"}
              </label>
              <div className="relative">
                <UserIcon className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-[#77716E]" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  placeholder={isAr ? "اسم المستخدم (مثال: admin)" : "Username (e.g. admin)"}
                  className="w-full rounded-xl border border-[#DECFC0] bg-[#FAF6F0] py-2.5 ps-10 pe-3 text-sm text-[#262321] placeholder:text-[#77716E]/70 focus:border-[#651E2C] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-start">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-[#262321]">
                  {isAr ? "كلمة المرور" : "Password"}
                </label>
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="text-xs text-[#651E2C] hover:underline"
                >
                  {show ? (isAr ? "إخفاء" : "Hide") : (isAr ? "إظهار" : "Show")}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-[#77716E]" />
                <input
                  id="login-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#DECFC0] bg-[#FAF6F0] py-2.5 ps-10 pe-10 text-sm text-[#262321] placeholder:text-[#77716E]/70 focus:border-[#651E2C] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-[#77716E] hover:text-[#262321]"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[#651E2C] hover:bg-[#521723] text-[#FAF6F0] py-3 text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
            >
              {busy ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{isAr ? "تسجيل الدخول" : "Sign In"}</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E6DCD2] text-center text-xs text-[#77716E]">
            <span>{isAr ? "ليس لديك حساب بعد؟" : "Don't have an account yet?"} </span>
            <Link to="/signup" className="font-semibold text-[#651E2C] hover:underline">
              {isAr ? "أنشئ حساباً جديداً مجاناً" : "Start 14-day free trial"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
