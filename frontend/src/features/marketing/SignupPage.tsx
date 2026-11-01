import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ErrorBox, Input } from "@/components/ui";
import { useAuth } from "@/stores/auth";

export default function SignupPage() {
  const draft: { full_name?: string; username?: string } = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("vendora.owner") ?? sessionStorage.getItem("mizan.owner") ?? "{}"
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
  const setSignupDraft = () => useAuth.setState({}); // tenant set after the wizard creates the workspace

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // keep the account fields for the wizard's final signup call
      const payload = JSON.stringify({ full_name: fullName, username, password });
      sessionStorage.setItem("vendora.owner", payload);
      sessionStorage.setItem("mizan.owner", payload); // backward-compat for existing wizard reader
      setSignupDraft();
      navigate("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground text-lg font-black shadow-sm">
            V
          </span>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">Vendora ERP</span>
            <span className="text-[10px] text-muted-foreground font-medium">المنظومة السحابية المتكاملة</span>
          </div>
        </Link>
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-bold">أنشئ حسابك الإداري</h1>
          <p className="mt-1 text-sm text-muted-foreground">خطوة واحدة وبعدها نجهّز مساحة عمل شركتك معاً</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fn" className="mb-1 block text-sm font-medium">
                اسمك الكامل
              </label>
              <Input
                id="fn"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
                placeholder="مثال: أحمد محمود"
              />
            </div>
            <div>
              <label htmlFor="u" className="mb-1 block text-sm font-medium">
                اسم المستخدم
              </label>
              <Input
                id="u"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                pattern="[a-zA-Z0-9_.\-]+"
                title="حروف إنجليزية وأرقام فقط"
                placeholder="مثال: ahmed_admin"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div>
              <label htmlFor="p" className="mb-1 block text-sm font-medium">
                كلمة المرور
              </label>
              <Input
                id="p"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="٦ أحرف أو أرقام على الأقل"
              />
            </div>
            {error && <ErrorBox message={error} />}
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={busy || !fullName || !username || password.length < 6}
            >
              التالي — تخصيص مساحة العمل
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          تملك حساباً مسجلاً بالفعل؟{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </p>
        {busy && <p className="sr-only">جارٍ التحويل…</p>}
      </div>
    </div>
  );
}
