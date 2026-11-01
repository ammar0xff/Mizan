/**
 * PAGE CONTRACT
 * Page: تسجيل الدخول (/login)
 * User: موظف الشركة يبدأ ورديته من جهاز الفرع أو منزله
 * Outcome: مصادقة ناجحة والوصول إلى لوحة التحكم بصلاحيات دوره
 * Primary information: حقلا اسم المستخدم وكلمة المرور؛ رسالة الخطأ عند الفشل
 * Primary action (per state): idle → «تسجيل الدخول»؛ error → إعادة المحاولة بنفس النموذج
 * Secondary action: إظهار/إخفاء كلمة المرور
 * Required states: idle, submitting (busy), invalid-credentials (ErrorBox), network-error
 * Responsive: 1440 لوحتا هوية/نموذج؛ <lg شريط هوية مصغّر فوق النموذج
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { Button, ErrorBox, Input, Spinner } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { useAuth, type User } from "@/stores/auth";

const auth = () => useAuth.getState();

interface LoginResponse {
  access_token: string;
  user_id: string;
  username: string;
  full_name: string;
  role: User["role"];
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<LoginResponse>("/auth/login", { username, password });
      // store the token FIRST so the /auth/me call carries Bearer credentials
      auth().setToken(r.access_token);
      try {
        const me = await api.get<User>("/auth/me");
        auth().setUser(me);
      } catch (meErr) {
        auth().logout(); // token unusable — do not keep a half-session
        throw meErr;
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — the navy identity, right side in RTL */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-side p-10 lg:flex">
        <div
          className="login-brand-art pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ "--brand-art-image": `url(${import.meta.env.BASE_URL}products/pvc-pipe.png), url(${import.meta.env.BASE_URL}products/mixer-faucet.png)` } as React.CSSProperties}
        />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-side-primary text-xl font-black text-side-primary-ink">ف</div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold text-side-ink">ميزان</div>
            <div className="text-xs text-side-muted">المصرية الألمانية</div>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-snug text-side-ink">
            نظام متكامل لإدارة الفروع ونقاط البيع
          </h2>
          <p className="mt-3 text-sm leading-7 text-side-muted">
            أدوات صحية ومواد بناء — مبيعات ومخزون ومشتريات ومالية ورواتب،
            لكل فرع صلاحياته ووردياته وتقاريره.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-side-ink/90">
            {["نقاط بيع سريعة", "مخزون لحظي", "ذمم وخزائن", "تقارير شاملة"].map((f) => (
              <li key={f} className="flex items-center gap-2 rounded-lg border border-side-line bg-side-accent/60 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-side-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-side-muted">© {new Date().getFullYear()} الشركة المصرية الألمانية للأدوات الصحية</p>
      </aside>

      {/* Form panel */}
      <div className="grid place-items-center bg-bg p-4">
        <Stagger className="w-full max-w-sm" delay={0.05}>
          <StaggerItem>
          {/* compact brand strip on mobile */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-black text-brand-ink">ف</div>
            <div className="leading-tight">
              <div className="font-extrabold">ميزان</div>
              <div className="text-xs text-muted">المصرية الألمانية</div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-xl">
            <div className="mb-8 text-center lg:text-right">
              <h1 className="text-xl font-bold">تسجيل الدخول</h1>
              <p className="mt-1 text-sm text-muted">ادخل بياناتك للوصول إلى لوحة التحكم</p>
            </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="u" className="mb-1 block text-sm font-medium">اسم المستخدم</label>
            <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus />
          </div>
          <div>
            <label htmlFor="p" className="mb-1 block text-sm font-medium">كلمة المرور</label>
            <div className="relative">
              <Input
                id="p"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pl-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
                aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" disabled={busy || !username || !password} className="w-full">
            {busy ? <Spinner /> : <LogIn size={16} />}
            تسجيل الدخول
          </Button>
        </form>
          </div>
        </StaggerItem>
      </Stagger>
      </div>
    </div>
  );
}
