/**
 * PAGE CONTRACT
 * Page: إنشاء الحساب (/signup)
 * User: تاجر يريد تجربة ميزان — جاي من صفحة الهبوط أو الأسعار
 * Outcome: حساب + مساحة عمل جاهزة ببيانات تجريبية على نشاطه
 * Primary information: اسمك، اسم المستخدم، كلمة المرور، (الشركة والنشاط يجي بعدها في الويزارد)
 * Primary action (per state): idle → «أنشئ الحساب»؛ busy → spinner؛ error → تصحيح الحقل
 * Secondary action: عندي حساب؟ تسجيل الدخول
 * Required states: idle, submitting, username-taken (409), validation, network-error
 * Responsive: عمود واحد مركزي في كل المقاسات
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale } from "lucide-react";
import { Button, ErrorBox, Input } from "@/components/ui";
import { useAuth } from "@/stores/auth";

export default function SignupPage() {
  const draft: { full_name?: string; username?: string } = (() => {
    try { return JSON.parse(sessionStorage.getItem("mizan.owner") ?? "{}"); } catch { return {}; }
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
      sessionStorage.setItem("mizan.owner", JSON.stringify({ full_name: fullName, username, password }));
      setSignupDraft();
      navigate("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Scale /></span>
          <span className="text-xl font-bold">ميزان</span>
        </Link>
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-bold">أنشئ حسابك</h1>
          <p className="mt-1 text-sm text-muted-foreground">خطوة واحدة وبعدها نجهّز مساحة عملك معًا</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fn" className="mb-1 block text-sm font-medium">اسمك الكامل</label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" autoFocus />
            </div>
            <div>
              <label htmlFor="u" className="mb-1 block text-sm font-medium">اسم المستخدم</label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username"
                pattern="[a-zA-Z0-9_.\-]+" title="حروف إنجليزية وأرقام فقط" />
            </div>
            <div>
              <label htmlFor="p" className="mb-1 block text-sm font-medium">كلمة المرور</label>
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="new-password" minLength={6} />
            </div>
            {error && <ErrorBox message={error} />}
            <Button type="submit" className="w-full" disabled={busy || !fullName || !username || password.length < 6}>
              التالي — جهّز مساحة عملك
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          عندي حساب؟ <Link to="/login" className="font-medium text-primary hover:underline">تسجيل الدخول</Link>
        </p>
        {busy && <p className="sr-only">جارٍ التحويل…</p>}
      </div>
    </div>
  );
}
