import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShieldCheck, Zap, Server, Database, ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui";
import { useAuth } from "@/stores/auth";
import { PLANS, TRIAL_DAYS } from "./plans";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";
import { Input } from "@/components/ui";

export default function PricingPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [phone, setPhone] = useState("");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  async function requestPlan(planId: string) {
    if (!user) {
      window.location.href = "/signup";
      return;
    }
    setBusyPlan(planId);
    try {
      const r = await api.post<{ message: string }>("/platform/subscribe-request", {
        plan: planId,
        contact_phone: phone || undefined,
      });
      toast("success", r.message);
    } catch (err) {
      toast("error", err instanceof ApiError ? err.message : "تعذر إرسال الطلب");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground selection:bg-primary/20" dir="rtl">
      {/* Official Header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black shadow-sm">
              V
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">Vendora ERP</span>
              <span className="text-[10px] text-muted-foreground font-medium">المنظومة السحابية المتكاملة</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              الرئيسية
            </Link>
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              تسجيل الدخول
            </Link>
            {user ? (
              <Button variant="outline" nativeButton={false} render={<a href="/app" />}>
                الرجوع للنظام
              </Button>
            ) : (
              <Button nativeButton={false} render={<Link to="/signup" />}>
                ابدأ مجاناً
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 font-medium">
            <Zap className="size-3.5 text-primary" />
            خطط اشتراك شفافة وعادلة لكافة أحجام الأعمال
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            باقات تناسب نمو منشأتك — من المتجر الفردي حتى سلاسل الفروع
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            كل باقة تمنحك وصولاً كاملاً لتجربة المنصة لمدة <span className="font-semibold text-foreground">{TRIAL_DAYS} يوماً مجاناً</span> بلا حاجة لبطاقة ائتمانية. اختر الدورة المناسبة وتحكم في كامل مواردك.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center rounded-xl border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                الدفع الشهري
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  billingCycle === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  وفّر شهرين (17%)
                </span>
              </button>
            </div>
          </div>

          {tenant?.plan === "trial" && (
            <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
              أنت الآن على باقة التجربة المجانية. عند تثبيت اشتراكك، ستظل كافة بياناتك وفروعك وإعداداتك كما هي دون أي انقطاع.
            </div>
          )}
        </div>

        {!user && (
          <div className="mx-auto mt-8 flex max-w-sm items-center gap-2">
            <Input
              placeholder="رقم الهاتف للتواصل السريع والاستفسارات (اختياري)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const price = billingCycle === "monthly" ? p.price_egp : Math.round(p.price_annual_egp / 12);
            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 transition hover:shadow-md ${
                  p.popular ? "border-primary ring-2 ring-primary/20 shadow-md" : ""
                }`}
              >
                {p.popular && (
                  <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground font-semibold">
                    الأكثر طلباً
                  </Badge>
                )}

                <div>
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground min-h-[32px]">{p.tagline}</p>

                  <div className="mt-5 border-t border-b py-4">
                    <div className="flex items-baseline gap-1">
                      {price === 0 ? (
                        <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">مجاناً</span>
                      ) : (
                        <>
                          <span className="num text-4xl font-black tracking-tight">{price.toLocaleString("en-US")}</span>
                          <span className="text-xs font-semibold text-muted-foreground mr-1">ج.م / شهرياً</span>
                        </>
                      )}
                    </div>
                    {billingCycle === "annual" && p.price_annual_egp > 0 && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        تُدفع سنوياً بقيمة <span className="num font-semibold">{p.price_annual_egp.toLocaleString("en-US")} ج.م</span>
                      </p>
                    )}
                  </div>

                  {/* Quotas */}
                  <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>المستخدمون المصرح لهم:</span>
                      <span className="num font-semibold text-foreground">
                        {p.maxUsers >= 50 ? "غير محدود" : `${p.maxUsers} مستخدمين`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المساحة السحابية المخصصة:</span>
                      <span className="num font-semibold text-foreground">
                        {p.maxStorageMb >= 102400 ? "100+ GB أو غير محدود" : `${Math.round(p.maxStorageMb / 1024)} GB`}
                      </span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="mt-5">
                    <span className="text-xs font-semibold text-muted-foreground">المزايا المضمنة:</span>
                    <ul className="mt-2.5 flex flex-col gap-2 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-foreground/90">
                          <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t">
                  <Button
                    variant={p.popular ? "default" : "outline"}
                    className="w-full font-semibold"
                    disabled={busyPlan === p.id}
                    onClick={() => requestPlan(p.id)}
                  >
                    {user ? (price > 0 ? "ترقية الاشتراك" : "الباقة الحالية") : "ابدأ تجربتك الآن"}
                    <ArrowLeft className="size-4 mr-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform Guarantees Section */}
        <section className="mt-20 rounded-2xl border bg-muted/20 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight">معايير الأمان والمرونة الموحدة لكافة العملاء</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              سواء اخترت الباقة المجانية أو خطة المؤسسات الكبرى، ستحصل على البنية التحتية الصلبة لمنصة Vendora.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-4 rounded-xl border bg-background p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Database className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold">عزل كامل لبيانات كل منشأة</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  قواعد بيانات مستقلة ومنع اختلاط السجلات، مع إمكانية ربط تفرع Neon أو قاعدة بيانات PostgreSQL خاصة.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border bg-background p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold">نسخ احتياطي واستعادة فورية</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  نسخ تلقائي مجدول مع إمكانية تصدير واسترجاع نسخة كاملة بضغطة زر وتنزيلها محلياً دون قيود.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border bg-background p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Server className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold">مرونة التشغيل أوفلاين وسحابياً</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  دعم العمل المكتبي بدون إنترنت تماماً مع تراخيص مشفرة بـ HMAC ومزامنة تلقائية عند عودة الشبكة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Superadmin CTA */}
        <div className="mt-12 text-center text-xs text-muted-foreground">
          هل أنت المشرف على البنية التحتية لمنصة Vendora؟{" "}
          <Link to="/admoon" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
            الدخول إلى لوحة قيادة المشرف العام (Admoon Control Plane)
          </Link>
        </div>
      </main>

      <footer className="mt-20 border-t py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Vendora SaaS ERP Platform — منصة تخطيط موارد المؤسسات المتكاملة.</p>
      </footer>
    </div>
  );
}
