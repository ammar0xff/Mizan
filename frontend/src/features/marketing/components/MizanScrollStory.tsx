import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ShoppingCart,
  Boxes,
  Calculator,
  BarChart3,
  CheckCircle2,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { EASINGS, DURATIONS } from "@/lib/motion";

interface StoryStep {
  id: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  metricLabelAr: string;
  metricLabelEn: string;
  metricVal: string;
  icon: typeof ShoppingCart;
  renderVisual: (isAr: boolean) => React.ReactNode;
}

export function MizanScrollStory() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const shouldReduceMotion = useReducedMotion();

  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const steps: StoryStep[] = [
    {
      id: "pos",
      badgeAr: "المرحلة الأولى: نقطة البيع",
      badgeEn: "Stage 1: Fast Checkout",
      titleAr: "بيع لحظي في أقل من ثانيتين وطباعة حرارية فورية",
      titleEn: "Instant Sub-2s Checkout & Live Thermal Printing",
      descAr:
        "يمرر الكاشير الباركود، فتصدر الفاتورة الضريبية متوافقة مع متطلبات الـ QR كود، وتتحول العملية فوراً لكافة أقسام المنظومة.",
      descEn:
        "The cashier scans the barcode, the tax receipt prints with ZATCA/ETA QR code, and data cascades instantly across all modules.",
      metricLabelAr: "متوسط سرعة الفاتورة",
      metricLabelEn: "Avg. Checkout Latency",
      metricVal: "0.45s",
      icon: ShoppingCart,
      renderVisual: (ar) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-[#651E2C]" />
              <span className="text-xs font-bold text-[#262321]">
                {ar ? "فاتورة مبيعات #INV-8492" : "Tax Invoice #INV-8492"}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#27835C]/15 text-[#27835C] px-2 py-0.5 rounded-full">
              {ar ? "مدفوعة نقدياً" : "PAID (CASH)"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dashed border-[#E6DCD2]">
              <span className="text-[#262321]">سيراميك رويال فرز أول (12 م²)</span>
              <span className="font-mono font-bold text-[#262321]">1,800 ج.م</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-[#E6DCD2]">
              <span className="text-[#262321]">أسمنت لافارج بورتلاند (5 شكائر)</span>
              <span className="font-mono font-bold text-[#262321]">1,150 ج.م</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-sm text-[#651E2C]">
              <span>{ar ? "الإجمالي مع الضريبة (14%):" : "Total with VAT (14%):"}</span>
              <span className="font-mono">3,363 ج.م</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FAF0E4] p-3 text-[11px] text-[#8A293B] flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-[#27835C]" />
            <span>
              {ar
                ? "تم الخصم التلقائي من المخزن وتوليد قيد اليومية"
                : "Stock auto-deducted & general ledger entry posted."}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "wms",
      badgeAr: "المرحلة الثانية: الخصم المخزني",
      badgeEn: "Stage 2: WMS Stock Sync",
      titleAr: "مزامنة المخازن والفروع بدون جرد يدوي",
      titleEn: "Multi-Branch Stock Rebalancing in Real-Time",
      descAr:
        "بمجرد اعتماد الفاتورة، يُحدث ميزان رصيد المخزن الفعلي في الفرع، ويطلق تنبيهاً ذكياً إذا وصل الصنف لحد إعادة الطلب.",
      descEn:
        "Instantly decrements physical branch warehouse stock and triggers automatic reorder notifications when safety thresholds are met.",
      metricLabelAr: "دقة مطابقة المخزون",
      metricLabelEn: "Inventory Accuracy",
      metricVal: "99.8%",
      icon: Boxes,
      renderVisual: (ar) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="size-4 text-[#8A293B]" />
              <span className="text-xs font-bold text-[#262321]">
                {ar ? "حالة الأرصدة الحية (مستودع مدينة نصر)" : "Live Inventory Status"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#77716E]">
              {ar ? "محدث الآن" : "Live Sync"}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#262321] font-medium">سيراميك رويال فرز أول</span>
                <span className="font-mono text-[#77716E]">148 / 500 م²</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E6DCD2] overflow-hidden">
                <div className="h-full bg-[#27835C] rounded-full w-[65%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#262321] font-medium">أسمنت لافارج (شكائر)</span>
                <span className="font-mono text-[#C58A35] font-bold">12 شيكارة (حد الطلب)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E6DCD2] overflow-hidden">
                <div className="h-full bg-[#C58A35] rounded-full w-[20%]" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#C58A35]/30 bg-[#FFF9F0] p-2.5 text-[11px] text-[#C58A35] flex items-center justify-between">
            <span>{ar ? "إشعار: إصدار أمر شراء استباقي" : "Alert: Automated Reorder Created"}</span>
            <span className="font-bold font-mono">PO-104</span>
          </div>
        </div>
      ),
    },
    {
      id: "ledger",
      badgeAr: "المرحلة الثالثة: القيد المحاسبي",
      badgeEn: "Stage 3: Automated Ledger",
      titleAr: "توليد قيود اليومية آلياً دون أخطاء بشرية",
      titleEn: "Zero-Human-Error Double Entry Posting",
      descAr:
        "يتم تحويل حركة البيع تلقائياً إلى قيد محاسبي مزدوج متزن (من حـ/ الخزينة إلى حـ/ المبيعات والضريبة) مع تحديث ميزان المراجعة.",
      descEn:
        "Transforms transaction into balanced double-entry vouchers: Cash Account debited, Sales & VAT credited with zero lag.",
      metricLabelAr: "وفر ساعات المحاسبين",
      metricLabelEn: "Accounting Hours Saved",
      metricVal: "18h/wk",
      icon: Calculator,
      renderVisual: (ar) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-[#651E2C]" />
              <span className="text-xs font-bold text-[#262321]">
                {ar ? "قيد يومية آلي #JV-2026-91" : "Journal Entry #JV-2026-91"}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#27835C]/10 text-[#27835C] px-2 py-0.5 rounded-full">
              {ar ? "متزن 100%" : "BALANCED"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="grid grid-cols-12 py-1 bg-[#FAF6F0] px-2 rounded font-bold text-[#77716E]">
              <span className="col-span-6">{ar ? "الحساب" : "Account"}</span>
              <span className="col-span-3 text-end">{ar ? "مدين" : "Debit"}</span>
              <span className="col-span-3 text-end">{ar ? "دائن" : "Credit"}</span>
            </div>
            <div className="grid grid-cols-12 py-1 px-2 text-[#262321]">
              <span className="col-span-6">1010 - الخزينة الرئيسية</span>
              <span className="col-span-3 text-end font-bold text-[#27835C]">3,363</span>
              <span className="col-span-3 text-end text-[#77716E]">-</span>
            </div>
            <div className="grid grid-cols-12 py-1 px-2 text-[#262321]">
              <span className="col-span-6">4010 - إيرادات المبيعات</span>
              <span className="col-span-3 text-end text-[#77716E]">-</span>
              <span className="col-span-3 text-end font-bold text-[#651E2C]">2,950</span>
            </div>
            <div className="grid grid-cols-12 py-1 px-2 text-[#262321]">
              <span className="col-span-6">2020 - ضريبة القيمة المضافة</span>
              <span className="col-span-3 text-end text-[#77716E]">-</span>
              <span className="col-span-3 text-end font-bold text-[#651E2C]">413</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      badgeAr: "المرحلة الرابعة: القرار التنفيذي",
      badgeEn: "Stage 4: Executive Insights",
      titleAr: "لوحة تحكم تنفيذية تكشف هوامش الربح الحقيقية",
      titleEn: "Executive Dashboards Showing Net Profit Margins",
      descAr:
        "يستعرض صاحب العمل تقارير التدفق النقدي وهوامش الربحية لكل صنف وفرع لحظة بلحظة على هاتفه الذكي من أي مكان في العالم.",
      descEn:
        "Business owners inspect cashflow trends and net margins per item & branch in real-time from anywhere.",
      metricLabelAr: "نمو هامش الربح",
      metricLabelEn: "Net Margin Expansion",
      metricVal: "+14.2%",
      icon: BarChart3,
      renderVisual: (ar) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-[#B86B76]" />
              <span className="text-xs font-bold text-[#262321]">
                {ar ? "مؤشرات الأداء اللحظية (Q4)" : "Real-time KPI Engine"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#27835C] font-bold">
              +24.8% YoY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#FAF0E4] p-3">
              <div className="text-[11px] text-[#77716E]">{ar ? "صافي الربح" : "Net Profit"}</div>
              <div className="text-lg font-bold font-mono text-[#651E2C]">482,100 ج.م</div>
            </div>
            <div className="rounded-xl bg-[#FAF0E4] p-3">
              <div className="text-[11px] text-[#77716E]">{ar ? "متوسط السلة" : "Avg Basket"}</div>
              <div className="text-lg font-bold font-mono text-[#262321]">1,640 ج.م</div>
            </div>
          </div>

          <div className="h-16 w-full pt-1">
            <svg viewBox="0 0 100 35" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <path
                d="M0,30 Q25,24 50,16 T100,4 L100,35 L0,35 Z"
                fill="rgba(184, 107, 118, 0.2)"
              />
              <path
                d="M0,30 Q25,24 50,16 T100,4"
                fill="none"
                stroke="#651E2C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      ),
    },
  ];

  // GSAP ScrollTrigger setup for pinned desktop narrative
  useEffect(() => {
    if (shouldReduceMotion) return;

    // Only apply desktop pinning if screen >= 1024px
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop || !triggerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: triggerRef.current,
        start: "top 15%",
        end: "bottom 85%",
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          const stepIndex = Math.min(
            Math.floor(progress * steps.length),
            steps.length - 1
          );
          setActiveStep(stepIndex);
        },
      });
    }, triggerRef);

    return () => ctx.revert();
  }, [shouldReduceMotion, steps.length]);

  return (
    <div ref={containerRef} className="relative py-16 sm:py-24">
      {/* Section Masthead */}
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DECFC0] bg-[#FAF0E4] text-xs font-semibold text-[#651E2C]">
          <Sparkles className="size-3.5" />
          <span>
            {isAr
              ? "انسيابية العمليات المتصلة (Workflow Continuity)"
              : "End-to-End Workflow Continuity"}
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#262321] font-display">
          {isAr
            ? "رحلة الفاتورة: من الكاشير إلى الميزانية في ثانية واحدة"
            : "The Invoice Journey: From Checkout to Ledger in 1s"}
        </h2>
        <p className="text-sm sm:text-base text-[#77716E] leading-relaxed">
          {isAr
            ? "شاهد كيف تتدفق البيانات تلقائياً بين موديولات ميزان بدون تدخل يدوي وبدون فقدان مليم واحد."
            : "See how operational data cascades seamlessly across Mizan modules without human error."}
        </p>
      </div>

      {/* Pinned Container */}
      <div
        ref={triggerRef}
        className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Sticky Visual Stage Frame (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="relative rounded-3xl border border-[#E7D6C1] bg-[#FFFFFF] p-6 sm:p-8 shadow-2xl overflow-hidden min-h-[380px] flex flex-col justify-between">
            {/* Top Stat Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DCD2]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#27835C] animate-pulse" />
                <span className="text-xs font-mono font-bold text-[#77716E]">
                  {steps[activeStep].metricLabelAr}
                </span>
              </div>
              <span className="text-base font-mono font-bold text-[#651E2C]">
                {steps[activeStep].metricVal}
              </span>
            </div>

            {/* Visual Content with Smooth AnimatePresence */}
            <div className="my-auto py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={steps[activeStep].id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: DURATIONS.normal, ease: EASINGS.editorial }}
                >
                  {steps[activeStep].renderVisual(isAr)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stage Stepper Dots */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E6DCD2] text-xs">
              <span className="font-mono text-[#77716E]">
                {activeStep + 1} / {steps.length}
              </span>
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === activeStep
                        ? "w-8 bg-[#651E2C]"
                        : "w-2 bg-[#E7D6C1] hover:bg-[#B86B76]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Flowing Cards (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer rounded-2xl p-6 sm:p-7 border transition-all duration-300 ${
                  isActive
                    ? "bg-[#FFFFFF] border-[#651E2C] shadow-lg ring-1 ring-[#651E2C]/20"
                    : "bg-[#FAF6F0]/60 border-[#E7D6C1] hover:bg-[#FFFFFF] hover:border-[#DECFC0]"
                }`}
                whileHover={shouldReduceMotion ? undefined : { x: isAr ? -4 : 4 }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? "bg-[#651E2C] text-[#FAF6F0]"
                        : "bg-[#FAF0E4] text-[#651E2C]"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isActive ? "text-[#651E2C]" : "text-[#77716E]"
                      }`}
                    >
                      {isAr ? step.badgeAr : step.badgeEn}
                    </span>

                    <h3 className="text-lg sm:text-xl font-bold text-[#262321] leading-snug">
                      {isAr ? step.titleAr : step.titleEn}
                    </h3>

                    <p className="text-sm text-[#77716E] leading-relaxed">
                      {isAr ? step.descAr : step.descEn}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
