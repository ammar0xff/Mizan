import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  AtSign,
  Lock,
  ArrowRight,
  ArrowLeft,
  Globe,
  Check,
} from "lucide-react";
import { ErrorBox, Spinner } from "@/components/ui";
import { useAuth } from "@/stores/auth";
import { sound } from "@/lib/sound";
import { MizanLogo } from "@/components/MizanLogo";
import { useTranslation } from "@/i18n";

export default function SignupPage() {
  const { locale, dir, toggleLocale } = useTranslation();
  const isAr = locale === "ar";

  const draft: { full_name?: string; username?: string } = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("vendora.owner") ??
          sessionStorage.getItem("mizan.owner") ??
          "{}"
      );
    } catch {
      return {};
    }
  })();

  const [fullName, setFullName] = useState(draft.full_name ?? "");
  const [username, setUsername] = useState(draft.username ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const setSignupDraft = () => useAuth.setState({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      sound.click();
      const payload = JSON.stringify({ full_name: fullName, username, password });
      sessionStorage.setItem("vendora.owner", payload);
      sessionStorage.setItem("mizan.owner", payload);
      setSignupDraft();
      navigate("/onboarding");
    } catch (err: any) {
      sound.error();
      setError(
        err?.message ||
          (isAr ? "حدث خطأ أثناء حفظ البيانات" : "An error occurred during registration.")
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
            {isAr ? "ابدأ رحلتك معنا،" : "Start your journey,"}
            <br />
            <span className="italic text-[#D4626E]">
              {isAr ? "نحو إدارة أكثر توازناً." : "into perfect balance."}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-[#E7D6C1]/80 leading-relaxed font-light">
            {isAr
              ? "تجربة سحابية مجانية لمدة 14 يوماً بكامل المزايا. بدون بطاقة ائتمانية وبجاهزية تشغيل فورية."
              : "Full-feature 14-day trial. No credit card required. Instant multi-tenant deployment."}
          </p>

          <div className="pt-4 flex flex-col gap-2 text-start text-xs text-[#E7D6C1]/90 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#27835C] shrink-0" />
              <span>{isAr ? "عزل بيانات مشفر لكل منشأة" : "Encrypted tenant data isolation"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#27835C] shrink-0" />
              <span>{isAr ? "كاشير أوفلاين مع فواتير سريعة" : "Offline-first POS with fast invoicing"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#27835C] shrink-0" />
              <span>{isAr ? "دعم فني وتدريب مجاني" : "Dedicated setup and support"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#E7D6C1]/60 z-10 font-mono">
          <span>© {new Date().getFullYear()} Mizan ERP</span>
          <span className="flex items-center gap-1.5 text-[#27835C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#27835C]" />
            <span>{isAr ? "تسجيل آمن ومشفر" : "Secure Registration"}</span>
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
              {isAr ? "إنشاء حساب جديد" : "Create Your Account"}
            </h1>
            <p className="text-xs sm:text-sm text-[#77716E]">
              {isAr
                ? "خطوة واحدة فقط وسنساعدك في تجهيز مساحة عمل شركتك واختيار الوحدات."
                : "Step 1 of 2: Create your admin credentials to setup your workspace."}
            </p>
          </div>

          {error && <ErrorBox message={error} />}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5 text-start">
              <label htmlFor="reg-fullname" className="text-xs font-semibold text-[#262321]">
                {isAr ? "الاسم الكامل" : "Full Name"}
              </label>
              <div className="relative">
                <UserIcon className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-[#77716E]" />
                <input
                  id="reg-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                  autoComplete="name"
                  placeholder={isAr ? "مثال: م. أحمد كمال" : "e.g. John Doe"}
                  className="w-full rounded-xl border border-[#DECFC0] bg-[#FAF6F0] py-2.5 ps-10 pe-3 text-sm text-[#262321] placeholder:text-[#77716E]/70 focus:border-[#651E2C] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-start">
              <label htmlFor="reg-username" className="text-xs font-semibold text-[#262321]">
                {isAr ? "اسم المستخدم أو المعرف" : "Username"}
              </label>
              <div className="relative">
                <AtSign className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-[#77716E]" />
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder={isAr ? "مثال: mizan_admin" : "e.g. mizan_admin"}
                  className="w-full rounded-xl border border-[#DECFC0] bg-[#FAF6F0] py-2.5 ps-10 pe-3 text-sm text-[#262321] placeholder:text-[#77716E]/70 focus:border-[#651E2C] focus:bg-[#FFFFFF] focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-start">
              <label htmlFor="reg-password" className="text-xs font-semibold text-[#262321]">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-[#77716E]" />
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#DECFC0] bg-[#FAF6F0] py-2.5 ps-10 pe-3 text-sm text-[#262321] placeholder:text-[#77716E]/70 focus:border-[#651E2C] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                />
              </div>
              <span className="text-[11px] text-[#77716E]">
                {isAr ? "يجب أن تحتوي على 6 خانات على الأقل" : "Must be at least 6 characters"}
              </span>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[#651E2C] hover:bg-[#521723] text-[#FAF6F0] py-3.5 text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50 mt-2"
            >
              {busy ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <span>{isAr ? "متابعة لتجهيز المنشأة" : "Continue to Workspace Setup"}</span>
                  {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E6DCD2] text-center text-xs text-[#77716E]">
            <span>{isAr ? "لديك حساب بالفعل؟" : "Already have an account?"} </span>
            <Link to="/login" className="font-semibold text-[#651E2C] hover:underline">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
