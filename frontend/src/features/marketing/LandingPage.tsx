/**
 * PAGE CONTRACT — Marketing Landing Page (صفحة الهبوط الرئيسية)
 *
 * GOAL: Convert Egyptian building-materials and plumbing/electrical merchants to start a free 14-day trial.
 * AUDIENCE: Egyptian building-materials merchants (تجار ومحلات مواد البناء، الأدوات الصحية، السباكة، الكهرباء، والدهانات).
 * PRIMARY ACTION: "ابدأ مجاناً" (Start free trial, 14 days, no card required) -> /signup
 * SECONDARY ACTION: "شاهد جولة 3 دقائق" (Scroll to interactive POS demo) -> #demo
 * TONE: Bespoke, editorial, ledger-like ("دفتر اليوم"), confident, zero fluff, restraint.
 * TYPOGRAPHY: IBM Plex Sans Arabic, display 600 (no 900), body 400/500. Scale: 64/40/28/18/16/14/12.
 * NUMERALS: .num class, ar-EG-u-nu-latn, Latin digits only.
 * VIEWPORT BUDGET: <= 6.5 viewports at 390x844.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Printer,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { BuildingMaterialsPosDemo } from "./components/BuildingMaterialsPosDemo";
import { PLANS } from "./plans";

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 3 plans only (Starter, Pro, Enterprise) — Trial is dropped as a card; trial is the CTA.
  const pricingPlans = PLANS.filter((p) => p.id !== "trial");

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const capabilities = [
    {
      domain: "الأصناف والوحدات المركبة",
      solution: "بيع بالمتر أو اللفة أو الشيكارة أو الكرتونة مع تحويل فوري للمخزون.",
      outcome: "منع أخطاء حساب الأطوال والكسور بين المخزن والكاشير.",
    },
    {
      domain: "قارئات الباركود السريعة",
      solution: "قراءة باركود الشركات المصنعة أو طباعة ملصقات داخلية للأصناف المفتوحة.",
      outcome: "إصدار الفاتورة في ثانيتين ومنع طوابير الانتظار بالمحل.",
    },
    {
      domain: "إدارة الهالك والتوالف",
      solution: "تسجيل كسر السيراميك وتوالف الأنابيب والأسلاك مع حسم مباشر من التكلفة.",
      outcome: "معرفة صافي أرباح المحل الحقيقية دون أرقام وهمية.",
    },
    {
      domain: "جرد المخازن الفعلي",
      solution: "جرد جزئي دوري حسب الرف أو الفئة دون إيقاف حركة البيع اليومية.",
      outcome: "مطابقة رصيد البضاعة الدفتري مع الموجود الفعلي بالمستودع.",
    },
    {
      domain: "حسابات الموردين والأجل",
      solution: "متابعة مسحوبات الأجل، مواعيد الشيكات، وحسومات الشراء التجارية.",
      outcome: "ضبط مديونيات الشركات الموردة وتفادي تضارب المطالبات.",
    },
    {
      domain: "عهد العمال والورش",
      solution: "تسجيل سلف الصنايعية ومسحوبات الورش وخصمها من الحساب الختامي.",
      outcome: "تتبع كل قرش يخرج من خزينة المحل لجهة محددة.",
    },
  ];

  const faqs = [
    {
      q: "كيف يضمن ميزان استمرار البيع عند انقطاع كابل الإنترنت؟",
      a: "يعمل تطبيق الكاشير بنمط Offline-First؛ حيث يحتفظ بنسخة مشفرة من الأصناف والأسعار محلياً داخل جهازك. يمكنك مسح الباركود، إصدار الفواتير، وطباعة الإيصالات بشكل طبيعي، وتتم المزامنة التلقائية مع السحابة فور عودة الاتصال.",
    },
    {
      q: "هل يدعم النظام طابعات الإيصالات الحرارية وقوارئ الباركود المتوفرة بالمحل؟",
      a: "نعم. يتكامل ميزان مباشرة مع كافة طابعات الإيصالات الحرارية القياسية عبر USB أو الشبكة (80 مم و58 مم) ببروتوكول ESC/POS، بالإضافة إلى قارئات الباركود السلكية واللاسلكية وموازين الباركود الإلكترونية.",
    },
    {
      q: "كيف يعالج النظام بيع الأصناف بالأطوال أو الأوزان (مثل الأسلاك والأنابيب والأسمنت)؟",
      a: "يدعم النظام الوحدات المركبة وشجرة التعبئة؛ يمكنك تعريف الصنف بوحدته الكبرى (شيكارة، لفة، كرتونة) ووحدته الصغرى (كيلو، متر، قطعة) مع تحديد معامل التحويل، فيقوم المخزن بحسم الكمية بدقة آلية.",
    },
    {
      q: "هل تتوافق الفواتير مع اشتراطات الفاتورة الإلكترونية المصرية (ETA)؟",
      a: "نعم. يولد النظام رمز الاستجابة السريعة المشفر وفق المعايير الضريبية المصرية، ويتيح إدراج الرقم الضريبي والسجل التجاري وبيانات المشتري وفق ضوابط مصلحة الضرائب المصرية.",
    },
  ];

  return (
    <MarketingLayout>
      <div className="space-y-10 sm:space-y-16 py-6 sm:py-10">
        {/* ================================================================= */}
        {/* 2. HERO — Asymmetric 12-col grid: 7 cols copy / 5 cols product    */}
        {/* ================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* 7 Cols Copy */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Overline: Muted small caps / 12px */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                نقطة بيع · مخزون · خزينة
              </div>

              {/* H1: One idea, 2 lines max, weight 600 */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight leading-[1.2]">
                كل صنف، كل وردية، كل قرش — في دفتر واحد.
              </h1>

              {/* One sentence of proof, max 20 words, no adjectives */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                منظومة كاشير ومخازن وخزينة أوفلاين لتجار ومحلات مواد البناء والسباكة والكهرباء بمصر.
              </p>

              {/* Primary CTA + text link */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button
                  size="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium min-h-[44px] px-6 text-sm shadow-xs"
                  render={<Link to="/signup" />}
                  nativeButton={false}
                >
                  <span>ابدأ مجاناً لمدة 14 يوماً</span>
                  <ArrowLeft className="h-4 w-4 ms-2" />
                </Button>

                <a
                  href="#demo"
                  className="min-h-[44px] inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  شاهد جولة 3 دقائق
                </a>
              </div>

              {/* Below: concrete verifiable facts separated by hairlines */}
              <div className="pt-3 sm:pt-4 border-t border-border flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  يعمل أوفلاين بدون إنترنت
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5 text-foreground" />
                  طباعة إيصالات فورية 80mm
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  متوافق مع منظومة الفاتورة ETA
                </span>
              </div>
            </div>

            {/* 5 Cols Product Frame — Real POS preview */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-border pb-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">معاينة الكاشير المباشر</span>
                  <span className="font-mono">فاتورة في ثانيتين</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-md bg-muted/30 border border-border/60">
                    <div>
                      <div className="font-semibold text-foreground">ماسورة PVC الشريف 3 بوصة</div>
                      <div className="text-muted-foreground text-xs font-mono">
                        <span className="num">2</span> × <span className="num">420.00</span> ج.م
                      </div>
                    </div>
                    <div className="num font-bold text-foreground">840.00 ج.م</div>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-md bg-muted/30 border border-border/60">
                    <div>
                      <div className="font-semibold text-foreground">خلاط مياه حوض نحاس تركي</div>
                      <div className="text-muted-foreground text-xs font-mono">
                        <span className="num">1</span> × <span className="num">1,250.00</span> ج.م
                      </div>
                    </div>
                    <div className="num font-bold text-foreground">1,250.00 ج.م</div>
                  </div>

                  <div className="hidden sm:flex justify-between items-center p-2 rounded-md bg-muted/30 border border-border/60">
                    <div>
                      <div className="font-semibold text-foreground">لفة سلك سويدي معزول 2.5 مم</div>
                      <div className="text-muted-foreground text-xs font-mono">
                        <span className="num">1</span> × <span className="num">980.00</span> ج.م
                      </div>
                    </div>
                    <div className="num font-bold text-foreground">980.00 ج.م</div>
                  </div>
                </div>

                <div className="border-t border-dashed border-border pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>المجموع الخاضع:</span>
                    <span className="num font-mono">3,070.00 ج.م</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ضريبة القيمة المضافة 14%:</span>
                    <span className="num font-mono">429.80 ج.م</span>
                  </div>
                  <div className="flex justify-between font-semibold text-xs sm:text-sm text-foreground pt-1 border-t border-border">
                    <span>الصافي النهائي:</span>
                    <span className="num font-mono text-primary font-bold">3,499.80 ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. PROOF STRIP — 3 verifiable facts only                           */}
        {/* ================================================================= */}
        <section className="border-y border-border bg-card/60 py-3 sm:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-border text-center">
              <div className="py-1.5 sm:py-0 px-4">
                <div className="text-xl sm:text-2xl font-semibold font-mono text-foreground">
                  <span className="num">3,420+</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  فاتورة مسجلة بفروع التجربة <span className="font-mono text-muted-foreground">(عرض توضيحي)</span>
                </div>
              </div>

              <div className="py-1.5 sm:py-0 px-4">
                <div className="text-xl sm:text-2xl font-semibold font-mono text-foreground">
                  <span className="num">0 ثانية</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  تعطل بيع عند انقطاع الإنترنت بنمط أوفلاين
                </div>
              </div>

              <div className="py-1.5 sm:py-0 px-4">
                <div className="text-xl sm:text-2xl font-semibold font-mono text-foreground">
                  <span className="num">100%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  مطابقة حسابية بين مبيعات الوردية وتقرير الخزينة
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. PRODUCT (CENTERPIECE) — ONE WORKING POS DEMO                   */}
        {/* ================================================================= */}
        <section id="demo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              محاكاة تشغيلية حية
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              جرّب كاشير ميزان الآن
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              امسح باركود الأصناف بالزر، راقب احتساب الضريبة بدقة 14%، ثم أخرج الفاتورة للإيصال الحراري.
            </p>
          </div>

          {/* Interactive Single Product Frame */}
          <BuildingMaterialsPosDemo />
        </section>

        {/* ================================================================= */}
        {/* 5. HOW IT WORKS — 3 Ruled Steps, Tabular Figures                   */}
        {/* ================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              الدورة التشغيلية
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              كيف تدار الوردية في ميزان؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 border-t border-border pt-4 sm:pt-6">
            {/* Step 1 */}
            <div className="space-y-1 sm:space-y-2">
              <div className="text-xl sm:text-2xl font-semibold font-mono text-primary num">01.</div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                فتح الوردية وتعيين رصيد الدرج
              </h3>
              <p className="text-xs leading-normal sm:leading-relaxed text-muted-foreground">
                يبدأ الكاشير يومه بتسجيل النقدية الافتتاحية في درج المحل. يوثق النظام اسم البائع وتوقيت البدء لمنع تداخل عهد الورديات.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-1 sm:space-y-2 border-t md:border-t-0 md:border-s border-border pt-3 md:pt-0 md:ps-6">
              <div className="text-xl sm:text-2xl font-semibold font-mono text-primary num">02.</div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                مسح الباركود والبيع السريع
              </h3>
              <p className="text-xs leading-normal sm:leading-relaxed text-muted-foreground">
                قراءة فورية لباركود الأصناف مع حسم فوري من المخزون وحساب الضريبة بنسبة 14%. طباعة الإيصال الحراري في ثانيتين دون تأخير الزبائن.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-1 sm:space-y-2 border-t md:border-t-0 md:border-s border-border pt-3 md:pt-0 md:ps-6">
              <div className="text-xl sm:text-2xl font-semibold font-mono text-primary num">03.</div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                إغلاق الوردية ومطابقة الخزينة
              </h3>
              <p className="text-xs leading-normal sm:leading-relaxed text-muted-foreground">
                طباعة تقرير Z-Report ومطابقة النقد الفعلي بالمبيعات المسجلة. ترحيل النقدية وفروق الجرد تلقائياً إلى الخزينة الرئيسية بنقرة زر.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. BUILT FOR BUILDING MATERIALS — Compact Ruled Table / Mobile List */}
        {/* ================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                تخصصية النشاط
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                مصمم خصيصاً لتجار ومحلات مواد البناء
              </h2>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              مدعوم بنواة ميزان المعيارية (47 موديولاً متخصصاً متاحاً للتفعيل)
            </div>
          </div>

          {/* Desktop/Tablet Ruled Capability Table */}
          <div className="hidden sm:block border border-border rounded-lg bg-card overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-start">القدرة التشغيلية</th>
                  <th className="py-3 px-4 text-start">المعالجة العملية في ميزان</th>
                  <th className="py-3 px-4 text-start">الأثر المباشر على المحل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {capabilities.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                      {row.domain}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                      {row.solution}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                      {row.outcome}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Ruled Ledger List (Compact & Fast) */}
          <div className="sm:hidden divide-y divide-border border-y border-border">
            {capabilities.map((row, idx) => (
              <div key={idx} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">{row.domain}</span>
                  <span className="text-primary font-medium text-end shrink-0">{row.outcome}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">{row.solution}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7. PRICING — 3 Plans, Honest Toggle, Physical Centered Badge       */}
        {/* ================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-2.5 sm:space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              الأسعار والباقات
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              اشتراكات واضحة بدون مصاريف خفية
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ابدأ تجربتك المجانية لمدة 14 يوماً بلا بطاقة دفع. اختر الباقة المناسبة لحجم نشاطك.
            </p>

            {/* Monthly / Annual Honest Toggle */}
            <div className="pt-1 sm:pt-2 flex justify-center">
              <div className="inline-flex items-center rounded-md border border-border bg-muted/30 p-1 text-xs">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-sm px-3.5 py-1.5 font-medium transition-colors ${
                    billingCycle === "monthly"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`rounded-sm px-3.5 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                    billingCycle === "annual"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>سنوي (شهرين مجاناً)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {pricingPlans.map((plan) => {
              const isAnnual = billingCycle === "annual";
              const displayPrice = isAnnual ? Math.round(plan.price_annual_egp / 12) : plan.price_egp;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-lg border p-4 sm:p-6 bg-card transition-all ${
                    plan.popular
                      ? "border-primary shadow-xs ring-1 ring-primary"
                      : "border-border shadow-xs"
                  }`}
                >
                  {/* Physical Center Alignment for 'الأكثر طلباً' Badge (RTL Safe) */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold shadow-xs">
                        الأكثر طلباً
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="font-semibold text-base text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 sm:min-h-[32px]">
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Price Figure */}
                    <div className="border-t border-border pt-3 sm:pt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-semibold font-mono text-foreground num">
                          {displayPrice.toLocaleString("en-US")}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">ج.م / شهرياً</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {isAnnual
                          ? `تُدفع ${plan.price_annual_egp.toLocaleString("en-US")} ج.م سنوياً`
                          : "دفع شهري متجدد"}
                      </div>
                    </div>

                    {/* Included Features List */}
                    <div className="border-t border-border pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
                      <div className="text-xs font-semibold text-foreground">المزايا المشمولة:</div>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
                        {plan.features.map((feat, fIdx) => (
                          <li
                            key={fIdx}
                            className={`items-start gap-2 ${fIdx >= 4 ? "hidden sm:flex" : "flex"}`}
                          >
                            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-6 border-t border-border mt-3 sm:mt-6">
                    <Button
                      className={`w-full min-h-[44px] text-xs font-medium ${
                        plan.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                      render={<Link to={plan.id === "enterprise" ? "/contact" : "/signup"} />}
                      nativeButton={false}
                    >
                      {plan.id === "enterprise" ? "تواصل مع فريق المبيعات" : "ابدأ تجربة مجانية (14 يوماً)"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 8. FAQ — 4 items, Hairline Rows, Typographic Disclosure            */}
        {/* ================================================================= */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              الأسئلة الشائعة
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              إجابات مباشرة لتجار مواد البناء
            </h2>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-3 sm:py-4">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-start gap-4 min-h-[44px] text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                      transition={{ duration: 0.15 }}
                      className="pt-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 9. FINAL CTA — Typographic Only, One Line, One Button             */}
        {/* ================================================================= */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4 py-6 sm:py-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            ابدأ ضبط حسابات محلك ووردية اليوم في 10 دقائق.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            فترة تجريبية 14 يوماً بكامل المزايا · بدون بطاقة بنكية · جاهز للعمل فوراً.
          </p>
          <div className="pt-1 sm:pt-2 flex justify-center">
            <Button
              size="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium min-h-[44px] px-8 text-sm shadow-xs"
              render={<Link to="/signup" />}
              nativeButton={false}
            >
              <span>ابدأ تجربتك المجانية الآن</span>
              <ArrowLeft className="h-4 w-4 ms-2" />
            </Button>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
