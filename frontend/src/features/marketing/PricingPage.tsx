import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ShieldCheck,
  Zap,
  Server,
  Database,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  Copy,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui";
import { useAuth } from "@/stores/auth";
import { PLANS, Plan } from "./plans";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";
import { Input } from "@/components/kit/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/kit/dialog";
import { formatCurrency } from "@/lib/format";
import { toast as sonnerToast } from "sonner";

interface CheckoutResult {
  invoice_ref: string;
  plan: string;
  plan_name: string;
  amount_egp: number;
  billing_cycle: string;
  payment_method: string;
  payment_meta: {
    type: string;
    fawry_ref?: string;
    ipa_address?: string;
    reference_note?: string;
    checkout_url?: string;
    instructions?: string;
    expiry_hours?: number;
  };
  status: string;
  message: string;
}

interface SubscriptionInfo {
  plan: string;
  limits: {
    max_users: number;
    max_branches: number;
    max_monthly_sales: number;
  };
  usage: {
    current_users: number;
    current_branches: number;
    current_monthly_sales: number;
  };
  is_trial: boolean;
  trial_remaining_days: number | null;
  is_writable: boolean;
}

export default function PricingPage() {
  const { user, tenant, setTenant } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [phone, setPhone] = useState("");

  // Live Subscription Status (if logged in)
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentActivated, setPaymentActivated] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load tenant subscription info if logged in
  useEffect(() => {
    if (user && tenant) {
      api
        .get<SubscriptionInfo>("/billing/subscription")
        .then((res) => setSubInfo(res))
        .catch(() => {
          /* ignore error if not tenant admin */
        });
    }
  }, [user, tenant]);

  function handlePlanClick(p: Plan) {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (p.id === "trial") {
      sonnerToast.info("أنت مفعل بالفعل على المنصة أو يمكنك اختيار إحدى الباقات الإنتاجية");
      return;
    }
    setSelectedPlan(p);
    setCheckoutResult(null);
    setPaymentActivated(false);
    setCheckoutModalOpen(true);
  }

  async function handleCreateCheckout() {
    if (!selectedPlan) return;
    setCheckingOut(true);
    try {
      const res = await api.post<CheckoutResult>("/billing/checkout", {
        plan: selectedPlan.id,
        billing_cycle: billingCycle,
        payment_method: paymentMethod,
        contact_phone: phone || undefined,
      });
      setCheckoutResult(res);
      sonnerToast.success(res.message || "تم إنشاء طلب السداد وإصدار الفاتورة");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "تعذر إنشاء جلسة الدفع";
      toast("error", msg);
      sonnerToast.error(msg);
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleSimulatePayment() {
    if (!checkoutResult) return;
    setSimulating(true);
    try {
      const res = await api.post<{ ok: boolean; message: string; limits?: any }>(
        "/billing/simulate-payment",
        {
          invoice_ref: checkoutResult.invoice_ref,
        }
      );
      setPaymentActivated(true);
      sonnerToast.success(res.message || "تم تأكيد السداد وتفعيل الباقة بنجاح!");

      // Update tenant state in auth store
      if (tenant) {
        setTenant({
          ...tenant,
          plan: checkoutResult.plan,
          trial_ends_at: null,
          limits: res.limits || tenant.limits,
        });
      }

      // Re-fetch subscription info
      try {
        const updated = await api.get<SubscriptionInfo>("/billing/subscription");
        setSubInfo(updated);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "فشلت محاكاة السداد";
      toast("error", msg);
      sonnerToast.error(msg);
    } finally {
      setSimulating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    sonnerToast.success("تم نسخ الكود للحافظة");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const isCurrentPlan = (planId: string) => {
    return tenant?.plan === planId;
  };

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
            {user ? (
              <Button variant="outline" nativeButton={false} render={<Link to="/app" />}>
                الرجوع للنظام
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  تسجيل الدخول
                </Link>
                <Button nativeButton={false} render={<Link to="/signup" />}>
                  ابدأ مجاناً
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 font-medium">
            <Zap className="size-3.5 text-primary" />
            باقات اشتراك بالجنيه المصري مع بوابات دفع آلية (فوري • إنستاباي • فيزا)
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            باقات تناسب نمو منشأتك — من المتجر الفردي حتى سلاسل الفروع
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            تفعيل فوري لكافة الميزات والقطاعات مع حصص مستخدمين وفروع مرنة وتخزين مشفر.
          </p>

          {/* Current Plan & Quota Status Bar (Logged in Tenant) */}
          {tenant && subInfo && (
            <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 text-right shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">
                    مساحة العمل: <span className="text-primary font-black">{tenant.name}</span>
                  </span>
                  <Badge variant="outline" className="font-bold text-[10px] text-primary border-primary/30">
                    الباقة الحالية: {tenant.plan.toUpperCase()}
                  </Badge>
                </div>
                {subInfo.is_trial && (
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    متبقي في التجربة المجانية: <span className="font-bold num">{subInfo.trial_remaining_days} يوم</span>
                  </div>
                )}
              </div>

              {/* Live Quotas Usage Indicators */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">المستخدمون النشطون:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-foreground num">
                      {subInfo.usage.current_users} / {subInfo.limits.max_users >= 999 ? "غير محدود" : subInfo.limits.max_users}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({Math.round((subInfo.usage.current_users / (subInfo.limits.max_users || 1)) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">الفروع والمستودعات:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-foreground num">
                      {subInfo.usage.current_branches} / {subInfo.limits.max_branches >= 999 ? "غير محدود" : subInfo.limits.max_branches}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({Math.round((subInfo.usage.current_branches / (subInfo.limits.max_branches || 1)) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                  <span className="text-muted-foreground block text-[11px]">فواتير المبيعات هذا الشهر:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-foreground num">
                      {subInfo.usage.current_monthly_sales} / {subInfo.limits.max_monthly_sales >= 999999 ? "غير محدود" : subInfo.limits.max_monthly_sales}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({Math.round((subInfo.usage.current_monthly_sales / (subInfo.limits.max_monthly_sales || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const price = billingCycle === "monthly" ? p.price_egp : Math.round(p.price_annual_egp / 12);
            const active = isCurrentPlan(p.id);

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 transition hover:shadow-md ${
                  p.popular ? "border-primary ring-2 ring-primary/20 shadow-md" : ""
                } ${active ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500" : ""}`}
              >
                {p.popular && !active && (
                  <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground font-semibold flex items-center gap-1">
                    <Sparkles className="size-3" />
                    الأكثر طلباً
                  </Badge>
                )}
                {active && (
                  <Badge className="absolute -top-3 right-6 bg-emerald-600 text-white font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    باقتك الحالية
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
                    variant={active ? "outline" : p.popular ? "default" : "outline"}
                    className="w-full font-semibold"
                    disabled={active && p.id === "trial"}
                    onClick={() => handlePlanClick(p)}
                  >
                    {active ? "باقتك الحالية المفعلة" : price > 0 ? "ترقية الاشتراك وسداد فوري" : "ابدأ تجربتك المجانية"}
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

      {/* Interactive Checkout & Payment Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <span>ترقية الاشتراك والدفع الإلكتروني الآمن</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 py-2 text-xs">
              {/* Step 1: Selection & Checkout Initiation */}
              {!checkoutResult ? (
                <>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground text-sm">{selectedPlan.name}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        الدورة: {billingCycle === "annual" ? "سداد سنوي (خصم شهرين)" : "سداد شهري"}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="text-xl font-black text-primary num">
                        {formatCurrency(
                          billingCycle === "annual" ? selectedPlan.price_annual_egp : selectedPlan.price_egp
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-foreground block">اختر بوابة وطريقة السداد المفضلة:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "card",
                          name: "بطاقة بنكية (Visa / Meeza)",
                          badge: "بوابة Paymob",
                          icon: "💳",
                        },
                        {
                          id: "fawry",
                          name: "فوري باي (Fawry Pay)",
                          badge: "كود فوري فوري",
                          icon: "⚡",
                        },
                        {
                          id: "instapay",
                          name: "إنستاباي (InstaPay)",
                          badge: "تحويل لحظي IPN",
                          icon: "📱",
                        },
                        {
                          id: "vodafone_cash",
                          name: "محافظ المحمول الذكية",
                          badge: "فودافون كاش",
                          icon: "🔴",
                        },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-xl border text-right transition-colors ${
                            paymentMethod === m.id
                              ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary font-bold"
                              : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>{m.icon}</span>
                            <span>{m.name}</span>
                          </div>
                          <span className="text-[10px] text-primary/80 mt-1 block">{m.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">رقم هاتف مسؤول المنشأة (لإرسال إشعار السداد):</label>
                    <Input
                      placeholder="010xxxxxxxx أو 011xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </>
              ) : paymentActivated ? (
                /* Step 3: Success Screen */
                <div className="py-6 text-center space-y-4">
                  <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">مبروك! تم تفعيل اشتراكك بنجاح</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      تمت ترقية المنشأة إلى <strong className="text-foreground">{checkoutResult.plan_name}</strong> وجرى تحديث كافة الصلاحيات والحصص فوراً.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border inline-block font-mono text-xs">
                    رقم الفاتورة المعتمدة: <strong className="text-primary">{checkoutResult.invoice_ref}</strong>
                  </div>
                </div>
              ) : (
                /* Step 2: Payment Details & Simulation Screen */
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground">رقم مرجع الفاتورة السحابية:</span>
                      <p className="font-mono font-black text-foreground text-sm">{checkoutResult.invoice_ref}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[11px] text-muted-foreground">المبلغ المستحق:</span>
                      <p className="font-black text-primary text-base num">
                        {formatCurrency(checkoutResult.amount_egp)}
                      </p>
                    </div>
                  </div>

                  {/* Fawry instructions */}
                  {checkoutResult.payment_meta.type === "fawry" && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                        كود الدفع لدى منافذ فوري أو فوري باي:
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-black font-mono tracking-widest text-foreground bg-background px-4 py-1.5 rounded-lg border border-border">
                          {checkoutResult.payment_meta.fawry_ref}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(checkoutResult.payment_meta.fawry_ref || "")}
                          className="h-9 px-3 gap-1"
                        >
                          {copiedCode ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                          <span className="text-[10px]">{copiedCode ? "تم النسخ" : "نسخ"}</span>
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {checkoutResult.payment_meta.instructions}
                      </p>
                    </div>
                  )}

                  {/* InstaPay instructions */}
                  {checkoutResult.payment_meta.type === "instapay" && (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">عنوان الدفع اللحظي (IPA):</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(checkoutResult.payment_meta.ipa_address || "")}
                          className="h-6 text-[11px] gap-1"
                        >
                          <Copy className="size-3" />
                          <span>نسخ</span>
                        </Button>
                      </div>
                      <p className="font-mono font-bold text-primary text-sm bg-muted/60 p-2 rounded-lg">
                        {checkoutResult.payment_meta.ipa_address}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {checkoutResult.payment_meta.instructions}
                      </p>
                    </div>
                  )}

                  {/* Card / Paymob instructions */}
                  {checkoutResult.payment_meta.type === "card" && (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <span className="text-xs font-bold text-foreground block">بوابة البطاقات البنكية المعتمدة:</span>
                      <p className="text-[11px] text-muted-foreground">
                        نظام التحصيل مؤمن ومربوط مع شبكة الدفع القومية المصرية ميزة، وفيزا، وماستركارد.
                      </p>
                    </div>
                  )}

                  {/* Instant Demo/Simulation Activation Banner */}
                  <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                      <Zap className="size-4" />
                      <span>اختبار البيئة التجريبية (Instant Demo Activation)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                      يمكنك الضغط أدناه لتأكيد السداد فوراً بمحاكاة البنك، وترقية مساحة العمل وتحديث الحصص في قاعدة البيانات دون انتظار السداد الفعلي.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleSimulatePayment}
                      disabled={simulating}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 h-8 mt-1"
                    >
                      {simulating ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                      <span>تأكيد السداد وتفعيل الباقة فوراً</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {paymentActivated ? (
              <Button
                size="sm"
                className="w-full font-bold"
                onClick={() => {
                  setCheckoutModalOpen(false);
                  navigate("/app");
                }}
              >
                الذهاب إلى مساحة العمل
              </Button>
            ) : !checkoutResult ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={checkingOut}
                >
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateCheckout}
                  disabled={checkingOut}
                  className="font-bold gap-1.5"
                >
                  {checkingOut ? <RefreshCw className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
                  <span>متابعة وإصدار الفاتورة</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckoutModalOpen(false)}
              >
                إغلاق
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-20 border-t py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Vendora SaaS ERP Platform — منظومة تخطيط موارد المؤسسات المتكاملة.</p>
      </footer>
    </div>
  );
}
