import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Zap,
  CreditCard,
  RefreshCw,
  Copy,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui";
import { useAuth } from "@/stores/auth";
import { PLANS, Plan } from "./plans";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";
import { Input } from "@/components/kit/input";
import { MarketingLayout } from "./MarketingLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/kit/dialog";
import { toast as sonnerToast } from "sonner";
import { useTranslation } from "@/i18n";
import { motion, AnimatePresence } from "motion/react";

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
  const { locale } = useTranslation();
  const isAr = locale === "ar";

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      sonnerToast.info(
        isAr
          ? "أنت مفعّل بالفعل على المنصة أو يمكنك اختيار إحدى الباقات الإنتاجية"
          : "You are already active or can choose an active production plan"
      );
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
      sonnerToast.success(res.message || (isAr ? "تم إنشاء طلب السداد وإصدار الفاتورة" : "Checkout invoice generated"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (isAr ? "تعذر إنشاء جلسة الدفع" : "Failed to create payment session");
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
      sonnerToast.success(res.message || (isAr ? "تم تأكيد السداد وتفعيل الباقة بنجاح!" : "Payment confirmed and plan activated!"));

      if (tenant) {
        setTenant({
          ...tenant,
          plan: checkoutResult.plan,
          trial_ends_at: null,
          limits: res.limits || tenant.limits,
        });
      }

      try {
        const updated = await api.get<SubscriptionInfo>("/billing/subscription");
        setSubInfo(updated);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (isAr ? "فشلت محاكاة السداد" : "Payment simulation failed");
      toast("error", msg);
      sonnerToast.error(msg);
    } finally {
      setSimulating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    sonnerToast.success(isAr ? "تم نسخ الكود للحافظة" : "Copied code to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const isCurrentPlan = (planId: string) => tenant?.plan === planId;

  // Filter the 3 paid commercial plans for the main luxury cards
  const commercialPlans = PLANS.filter((p) => p.id !== "trial");

  const comparisonFeatures = [
    { nameAr: "المستخدمين النشطين", nameEn: "Active Users", starter: "5", pro: "15", enterprise: "غير محدود / Unlimited" },
    { nameAr: "الفروع والمخازن المتصلة", nameEn: "Branches & Warehouses", starter: "1", pro: "3", enterprise: "غير محدود / Unlimited" },
    { nameAr: "المعمارية ونمط العمل الأوفلاين", nameEn: "Offline-First Engine", starter: true, pro: true, enterprise: true },
    { nameAr: "قاعدة بيانات معزولة RLS مشفرة", nameEn: "Encrypted Isolated RLS Database", starter: true, pro: true, enterprise: true },
    { nameAr: "كافة الـ 47 موديول قطاعي", nameEn: "Full 47 Sector Modules", starter: false, pro: true, enterprise: true },
    { nameAr: "شاشات المطابخ KDS وبوالص الشحن", nameEn: "Kitchen KDS & Fleet Dispatch", starter: false, pro: true, enterprise: true },
    { nameAr: "استيراد ملفات وتكامل REST API", nameEn: "REST API & Webhooks Access", starter: false, pro: true, enterprise: true },
    { nameAr: "خادم مخصص ونطاق خاص (Custom Domain)", nameEn: "Dedicated Server & Custom Domain", starter: false, pro: false, enterprise: true },
    { nameAr: "ترخيص مكتبي .exe محلي للأجهزة", nameEn: "Local .exe Desktop License", starter: false, pro: false, enterprise: true },
    { nameAr: "مدير حساب هندسي ودعم 24/7", nameEn: "Dedicated Engineering Manager", starter: "Standard", pro: "Priority", enterprise: "24/7 SLA" },
  ];

  const faqs = [
    {
      qAr: "هل أحتاج لبطاقة ائتمان لبدء التجربة المجانية؟",
      qEn: "Do I need a credit card for the 14-day trial?",
      aAr: "إطلاقاً. يمكنك تفعيل حسابك والبدء في إدارة مخزونك ونقاط البيع مجاناً بالكامل لمدة 14 يوماً بدون إدخال أي وسيلة دفع.",
      aEn: "Not at all. You can register and experience full POS, inventory, and accounting features for 14 days with zero payment info required.",
    },
    {
      qAr: "ما هي طرق الدفع المتاحة داخل مصر وخارجها؟",
      qEn: "What payment methods are supported?",
      aAr: "ندعم السداد بالجنيه المصري عبر كود فوري (Fawry)، تحويل فوري عبر إنستاباي (InstaPay)، محفظة فودافون كاش، والبطاقات الائتمانية البنكية (Visa / MasterCard).",
      aEn: "We support EGP billing via Fawry pay code, instant bank transfers via InstaPay, Vodafone Cash, and standard Visa / Mastercard.",
    },
    {
      qAr: "هل يمكنني الترقية أو تغيير الباقة لاحقاً مع توسع فروعنا؟",
      qEn: "Can I scale or upgrade our plan as we add branches?",
      aAr: "نعم وبكل سهولة. يتم احتساب فرق السعر بدقة متناهية (Prorated) وترقية مساحة العمل فورياً دون أي انقطاع في الخدمة أو توقف للكاشير.",
      aEn: "Yes, seamlessly. Pricing is prorated and your workspace limits and modules upgrade instantly with zero cashier downtime.",
    },
    {
      qAr: "هل تبقى بيانات مشروعي معزولة في حال انتهاء الاشتراك؟",
      qEn: "Is our financial data safe if subscription lapses?",
      aAr: "تبقى كافة فواتيرك وقيودك المحاسبية محفوظة ومعزولة ومشفرة بنمط القراءة فقط لمدة 90 يوماً إضافية مع إمكانية تصديرها بالكامل بصيغة Excel أو JSON في أي وقت.",
      aEn: "All financial journals and transaction records remain strictly isolated, encrypted, and accessible in read-only mode for 90 days with one-click Excel/JSON export.",
    },
  ];

  return (
    <MarketingLayout>
      <div className="py-16 sm:py-24 space-y-20 bg-[#FAF6F0] text-[#262321] transition-colors">
        {/* 1. Hero Section */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#651E2C] shadow-xs">
            <Sparkles className="size-3.5 text-[#B86B76]" />
            <span>
              {isAr
                ? "باقات اشتراك مرنة بالجنيه المصري — تفعيل فوري وبوابات سداد متعددة"
                : "Flexible Egyptian Pound pricing — Instant activation & local gateways"}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-[1.15]">
            {isAr ? (
              <>
                استثمار مدروس وشفاف <br />
                <span className="italic text-[#B86B76]">لتحقيق التوازن التشغيلي</span>
              </>
            ) : (
              <>
                Predictable, transparent investment <br />
                <span className="italic text-[#B86B76]">in your operational balance</span>
              </>
            )}
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#77716E] font-body leading-relaxed">
            {isAr
              ? "اختر الباقة المناسبة لحجم منشأتك. بدون رسوم خفية، مع إمكانية الترقية أو الإلغاء في أي وقت."
              : "Choose the package tailored to your business scale. No hidden fees, upgrade or adjust branches anytime."}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center rounded-full border border-[#E7D6C1] bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#651E2C] text-white shadow-xs"
                    : "text-[#77716E] hover:text-[#262321]"
                }`}
              >
                {isAr ? "الدفع الشهري" : "Monthly Billing"}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-[#651E2C] text-white shadow-xs"
                    : "text-[#77716E] hover:text-[#262321]"
                }`}
              >
                <span>{isAr ? "الدفع السنوي" : "Annual Billing"}</span>
                <span className="rounded-full bg-[#B86B76]/20 px-2 py-0.5 text-[10px] font-bold text-[#651E2C]">
                  {isAr ? "وفر 20%" : "Save 20%"}
                </span>
              </button>
            </div>
          </div>

          {/* Active Tenant Workspace Quota Status */}
          {tenant && subInfo && (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[#B86B76]/30 bg-white p-4 text-start shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E7D6C1] pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-semibold text-[#262321]">
                    {isAr ? "المساحة النشطة:" : "Active Workspace:"}{" "}
                    <span className="font-bold text-[#651E2C]">{tenant.name}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] text-[#651E2C] border-[#B86B76]/40">
                    {tenant.plan.toUpperCase()}
                  </Badge>
                </div>
                {subInfo.is_trial && (
                  <span className="text-xs font-medium text-amber-700 font-mono">
                    {isAr ? `${subInfo.trial_remaining_days} يوم متبقي بالتجربة` : `${subInfo.trial_remaining_days} days trial left`}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] p-2.5">
                  <span className="text-[11px] text-[#77716E] block">{isAr ? "المستخدمون:" : "Users:"}</span>
                  <span className="font-bold font-mono text-[#262321]">
                    {subInfo.usage.current_users} / {subInfo.limits.max_users >= 999 ? "∞" : subInfo.limits.max_users}
                  </span>
                </div>
                <div className="rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] p-2.5">
                  <span className="text-[11px] text-[#77716E] block">{isAr ? "الفروع:" : "Branches:"}</span>
                  <span className="font-bold font-mono text-[#262321]">
                    {subInfo.usage.current_branches} / {subInfo.limits.max_branches >= 999 ? "∞" : subInfo.limits.max_branches}
                  </span>
                </div>
                <div className="rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] p-2.5">
                  <span className="text-[11px] text-[#77716E] block">{isAr ? "مبيعات الشهر:" : "Monthly Sales:"}</span>
                  <span className="font-bold font-mono text-[#262321]">
                    {subInfo.usage.current_monthly_sales}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Three Editorial Luxury Pricing Cards */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch">
            {commercialPlans.map((plan) => {
              const isPopular = plan.popular;
              const isCurrent = isCurrentPlan(plan.id);
              const price = billingCycle === "annual" ? Math.round(plan.price_annual_egp / 12) : plan.price_egp;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl transition-all duration-300 p-8 sm:p-10 ${
                    isPopular
                      ? "border-2 border-[#651E2C] bg-white shadow-xl shadow-[#651E2C]/5 ring-1 ring-[#651E2C]"
                      : "border border-[#E7D6C1] bg-white/80 hover:bg-white shadow-xs"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 start-1/2 -translate-x-1/2 rounded-full bg-[#651E2C] px-4 py-1 text-[11px] font-bold text-white shadow-xs">
                      {isAr ? "الباقة الأكثر اختياراً" : "Most Popular Choice"}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display text-2xl font-normal text-[#262321]">
                        {isAr
                          ? plan.name.split("(")[0].trim()
                          : plan.id.charAt(0).toUpperCase() + plan.id.slice(1)}
                      </h3>
                      <p className="mt-2 text-xs text-[#77716E] leading-relaxed">
                        {isAr ? plan.tagline : plan.recommendedFor}
                      </p>
                    </div>

                    <div className="border-y border-[#E7D6C1] py-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-4xl sm:text-5xl font-normal text-[#262321] font-mono">
                          {price.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-[#77716E]">
                          {isAr ? "ج.م / شهر" : "EGP / month"}
                        </span>
                      </div>
                      {billingCycle === "annual" && (
                        <p className="mt-1 text-[11px] text-[#B86B76] font-medium font-mono">
                          {isAr
                            ? `يُسدد ${plan.price_annual_egp.toLocaleString()} ج.م سنوياً`
                            : `Billed ${plan.price_annual_egp.toLocaleString()} EGP annually`}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#77716E]">
                        {isAr ? "المزايا المتضمنة:" : "Included Capabilities:"}
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#262321]">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1]">
                              <Check className="size-2.5 stroke-[3]" />
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#E7D6C1]">
                    <Button
                      onClick={() => handlePlanClick(plan)}
                      size="lg"
                      className={`w-full rounded-xl py-3 text-xs font-bold transition-all ${
                        isPopular
                          ? "bg-[#651E2C] text-white hover:bg-[#521723] shadow-md"
                          : "border border-[#E7D6C1] bg-[#FAF6F0] text-[#262321] hover:bg-[#E7D6C1]"
                      }`}
                    >
                      {isCurrent
                        ? isAr
                          ? "باقاتك الحالية المفعلة"
                          : "Current Active Plan"
                        : user
                        ? isAr
                          ? "ترقية واشتراك فوري"
                          : "Upgrade & Subscribe"
                        : isAr
                        ? "ابدأ تجربة الـ 14 يوماً"
                        : "Start 14-Day Free Trial"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Detailed Feature Comparison Matrix */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#262321]">
              {isAr ? "جدول المقارنة التفصيلي للميزات" : "Comprehensive Feature Comparison"}
            </h2>
            <p className="text-xs text-[#77716E]">
              {isAr
                ? "مقارنة دقيقة لجميع الصلاحيات والحصص والخيارات المعمارية"
                : "Exact comparison of quotas, operational permissions, and infrastructure"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E7D6C1] bg-white shadow-xs">
            <table className="w-full text-start text-xs text-[#262321]">
              <thead>
                <tr className="border-b border-[#E7D6C1] bg-[#FAF6F0] text-[#77716E]">
                  <th className="py-4 px-6 text-start font-bold uppercase tracking-wider">
                    {isAr ? "الميزة / القدرة" : "Feature / Capability"}
                  </th>
                  <th className="py-4 px-4 text-center font-bold">{isAr ? "البداية (Starter)" : "Starter"}</th>
                  <th className="py-4 px-4 text-center font-bold text-[#651E2C] bg-[#651E2C]/5">
                    {isAr ? "المحترفين (Pro)" : "Pro"}
                  </th>
                  <th className="py-4 px-4 text-center font-bold">{isAr ? "المؤسسات (Enterprise)" : "Enterprise"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7D6C1]">
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF6F0]/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-[#262321]">
                      {isAr ? row.nameAr : row.nameEn}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <Check className="mx-auto size-4 text-[#27835C] stroke-[2.5]" />
                        ) : (
                          <span className="text-[#77716E]">—</span>
                        )
                      ) : (
                        <span className="font-mono">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center bg-[#651E2C]/5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="mx-auto size-4 text-[#651E2C] stroke-[2.5]" />
                        ) : (
                          <span className="text-[#77716E]">—</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-[#651E2C]">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <Check className="mx-auto size-4 text-[#27835C] stroke-[2.5]" />
                        ) : (
                          <span className="text-[#77716E]">—</span>
                        )
                      ) : (
                        <span className="font-mono font-semibold">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Frequently Asked Questions (FAQ Accordions) */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#262321]">
              {isAr ? "الأسئلة الشائعة حول الباقات والسداد" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs text-[#77716E]">
              {isAr ? "إجابات شفافة عن الفوترة والتجديد وإلغاء الاشتراك" : "Transparent answers about billing, upgrades, and cancellations"}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E7D6C1] bg-white overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-start font-semibold text-xs sm:text-sm text-[#262321] hover:text-[#651E2C] transition-colors"
                  >
                    <span>{isAr ? faq.qAr : faq.qEn}</span>
                    <ChevronDown
                      className={`size-4 text-[#77716E] transition-transform duration-200 shrink-0 ms-2 ${
                        isOpen ? "rotate-180 text-[#651E2C]" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 text-xs text-[#77716E] leading-relaxed border-t border-[#E7D6C1]/50 pt-3"
                      >
                        {isAr ? faq.aAr : faq.aEn}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Final CTA Banner */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#35151D] p-8 sm:p-12 text-center text-[#F5EBDD] space-y-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <h2 className="font-display text-2xl sm:text-4xl font-normal tracking-tight text-white">
                {isAr ? "هل تحتاج إلى استشارة متخصصة لمؤسستك؟" : "Need custom enterprise requirements?"}
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#E7D6C1] font-body leading-relaxed">
                {isAr
                  ? "فريقنا الهندسي مستعد لمساعدتك في تخطيط استضافة مخصصة، نقل البيانات التاريخية، وتدريب طاقم العمل."
                  : "Our engineering consultants will assist you with custom deployments, legacy data migration, and on-premise setups."}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  render={<Link to="/contact" />}
                  nativeButton={false}
                  size="lg"
                  className="bg-[#651E2C] text-white hover:bg-[#8A293B] rounded-full px-6 py-2.5 text-xs font-bold"
                >
                  {isAr ? "حجز جلسة استشارية مع مهندس حلول" : "Book Enterprise Architecture Session"}
                </Button>
                <Button
                  render={<Link to="/signup" />}
                  nativeButton={false}
                  size="lg"
                  variant="outline"
                  className="border-[#E7D6C1]/30 bg-transparent text-[#F5EBDD] hover:bg-white/10 rounded-full px-6 py-2.5 text-xs font-bold"
                >
                  {isAr ? "تجربة مجانية فورية" : "Start 14-Day Free Trial"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout and Payment Simulation Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 border border-[#E7D6C1] text-[#262321] font-body">
          <DialogHeader className="border-b border-[#E7D6C1] pb-4">
            <DialogTitle className="font-display text-xl text-[#262321] font-normal">
              {isAr ? "إتمام الاشتراك وتأكيد السداد" : "Complete Subscription & Checkout"}
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-5 py-3">
              {/* Plan Summary Card */}
              <div className="rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#262321]">
                    {selectedPlan.name}
                  </h4>
                  <p className="text-xs text-[#77716E]">
                    {billingCycle === "annual"
                      ? isAr
                        ? "دورة فوترة سنوية (خصم 20%)"
                        : "Annual billing cycle (20% off)"
                      : isAr
                      ? "دورة فوترة شهرية"
                      : "Monthly billing cycle"}
                  </p>
                </div>
                <div className="text-end font-mono">
                  <span className="text-lg font-bold text-[#651E2C]">
                    {(billingCycle === "annual"
                      ? selectedPlan.price_annual_egp
                      : selectedPlan.price_egp
                    ).toLocaleString()}{" "}
                    {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
              </div>

              {!checkoutResult ? (
                <>
                  {/* Payment Gateway Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#262321]">
                      {isAr ? "اختر وسيلة الدفع المناسبة:" : "Select payment method:"}
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: "card", label: isAr ? "بطاقة بنكية (Visa/MC)" : "Bank Card (Visa/MC)", icon: CreditCard },
                        { id: "fawry", label: isAr ? "كود فوري (Fawry Pay)" : "Fawry Pay Code", icon: Zap },
                        { id: "instapay", label: isAr ? "تحويل إنستاباي (InstaPay)" : "InstaPay Transfer", icon: RefreshCw },
                        { id: "vodafone_cash", label: isAr ? "محفظة فودافون كاش" : "Vodafone Cash Wallet", icon: Sparkles },
                      ].map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            className={`flex items-center gap-2 rounded-xl border p-3 text-start transition-all ${
                              paymentMethod === m.id
                                ? "border-[#651E2C] bg-[#651E2C]/5 text-[#651E2C] font-bold"
                                : "border-[#E7D6C1] hover:bg-[#FAF6F0] text-[#77716E]"
                            }`}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#77716E]">
                      {isAr ? "رقم الهاتف لتأكيد السداد (اختياري):" : "Contact phone for receipt (optional):"}
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="border-[#E7D6C1] text-xs font-mono"
                    />
                  </div>

                  <Button
                    onClick={handleCreateCheckout}
                    disabled={checkingOut}
                    className="w-full bg-[#651E2C] text-white hover:bg-[#521723] rounded-xl py-3 text-xs font-bold"
                  >
                    {checkingOut
                      ? isAr
                        ? "جاري تجهيز الفاتورة..."
                        : "Preparing invoice..."
                      : isAr
                      ? "إصدار الفاتورة وتوليد كود السداد"
                      : "Generate Invoice & Payment Code"}
                  </Button>
                </>
              ) : (
                /* Invoice and Simulation UI */
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 text-xs space-y-2 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        {isAr ? "تم إصدار الفاتورة بنجاح" : "Invoice Issued Successfully"}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-800">
                        #{checkoutResult.invoice_ref}
                      </span>
                    </div>

                    {checkoutResult.payment_meta.fawry_ref && (
                      <div className="mt-2 rounded-lg bg-white p-3 border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-[#77716E] block">
                            {isAr ? "كود سداد فوري الموحد:" : "Fawry Reference Code:"}
                          </span>
                          <span className="font-mono text-base font-black text-[#651E2C]">
                            {checkoutResult.payment_meta.fawry_ref}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(checkoutResult.payment_meta.fawry_ref!)}
                          className="text-[11px] border-[#E7D6C1]"
                        >
                          {copiedCode ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                    )}

                    {checkoutResult.payment_meta.instructions && (
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        {checkoutResult.payment_meta.instructions}
                      </p>
                    )}
                  </div>

                  {/* Dev / Test Payment Simulator Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleSimulatePayment}
                      disabled={simulating || paymentActivated}
                      className="w-full bg-[#27835C] text-white hover:bg-[#1E6B4A] rounded-xl py-3 text-xs font-bold"
                    >
                      {paymentActivated
                        ? isAr
                          ? "تم تفعيل الباقة بنجاح!"
                          : "Plan Activated Successfully!"
                        : simulating
                        ? isAr
                          ? "جاري تأكيد السداد الآلي..."
                          : "Simulating confirmation..."
                        : isAr
                        ? "محاكاة الدفع الفوري (Webhook Live Trigger)"
                        : "Simulate Instant Payment (Webhook Live Trigger)"}
                    </Button>
                    <p className="mt-1.5 text-center text-[10px] text-[#77716E]">
                      {isAr
                        ? "زر المحاكاة متاح للتجربة والتفعيل التلقائي دون خصم فعلي"
                        : "Simulator triggers platform webhook to activate quotas instantly"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-[#E7D6C1] pt-3">
            <Button
              variant="outline"
              onClick={() => setCheckoutModalOpen(false)}
              className="border-[#E7D6C1] text-xs"
            >
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingLayout>
  );
}
