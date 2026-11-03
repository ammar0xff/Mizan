import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ShieldCheck,
  Printer,
  Barcode,
  ArrowRight,
  Cpu,
  Sparkles,
  ChevronDown,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { InteractiveProductShowcase } from "./components/InteractiveProductShowcase";
import { PLANS } from "./plans";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "ما الذي يميز ميزان ERP عن البرامج المحاسبية وأنظمة الـ ERP الأخرى؟",
      a: "يعتمد ميزان معمارية معيارية بالكامل (Modular Architecture) حيث يحتوي على 47 موديولاً متخصصاً. لا تضطر لدفع تكلفة موديولات لا تحتاجها، ويمكنك تفعيل أو تعطيل أي تطبيق بنقرة زر دون تعديل شفرة النظام. بالإضافة إلى عزل بياناتك أمنياً عبر تقنية PostgreSQL Row-Level Security وسرعة كاشير فائقة تدعم الطباعة الحرارية المباشرة.",
    },
    {
      q: "هل يعمل نظام الكاشير عند انقطاع الإنترنت؟",
      a: "نعم! تم تصميم تطبيق الكاشير بمفهوم Offline-First، حيث يحتفظ بنسخة مشفرة من الأصناف والأسعار محلياً، ويتيح مسح الباركود وإصدار الفواتير وطباعتها حتى عند انقطاع الإنترنت، ثم يقوم بمزامنة المبيعات تلقائياً مع السحابة فور عودة الاتصال.",
    },
    {
      q: "هل تدعم فواتير ميزان متطلبات هيئة الزكاة والجمارك (ZATCA) ومنظومة الفاتورة الإلكترونية؟",
      a: "نعم، تتوافق فواتير ميزان مع متطلبات ZATCA Phase 1 & 2 في السعودية ومنظومة الفاتورة الإلكترونية ETA في مصر، حيث يولد النظام تلقائياً رمز الاستجابة السريعة المشفر بصيغة TLV Base64 متضمناً الأختام الرقمية وبيانات الرقم الضريبي.",
    },
    {
      q: "ما هي أنواع الطابعات وأجهزة الكاشير المتوافقة مع النظام؟",
      a: "يدعم ميزان كافة الطابعات الحرارية القياسية عبر USB أو الشبكة (بمقاسي 80 مم و58 مم)، وقوارئ الباركود السلكية واللاسلكية، شاشات المطبخ اللمسية KDS، أجهزة الحضور البيومترية ZKTeco، وموازين الباركود الإلكترونية.",
    },
    {
      q: "هل يمكنني تجربة المنصة مجاناً قبل الاشتراك؟",
      a: "بالتأكيد! نوفر فترة تجريبية مجانية لمدة 14 يوماً تشمل كافة الموديولات والوظائف بدون الحاجة لإدخال أي بطاقة دفع ائتمانية. يمكنك إنشاء حسابك والبدء فورياً.",
    },
  ];

  return (
    <MarketingLayout>
      <div className="space-y-20 sm:space-y-28 py-8 sm:py-12">
        {/* ==================================================================== */}
        {/* 1. SIGNATURE HERO SECTION WITH CHOREOGRAPHED ENTRANCE & 3D MOCKUP   */}
        {/* ==================================================================== */}
        <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16">
          {/* Subtle Ambient Background Glow */}
          <div className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-brand/20 via-blue-400/10 to-transparent blur-3xl dark:from-brand/10 dark:via-brand-dark/20" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3.5 py-1 text-xs font-bold text-brand dark:bg-brand/10 dark:border-brand/40 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>الجيل الجديد من أنظمة الـ ERP المعيارية متعددة المنشآت</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-[11px]">Mizan 3.0</span>
              </motion.div>

              {/* Staggered Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]"
              >
                نظام ERP معياري يتكيف مع طريقة عملك الحقيقية
              </motion.h1>

              {/* Supporting Value Proposition */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
              >
                منظومة سحابية متكاملة تدعم 47 قطاعاً ونشاطاً متخصصاً. عزل أمني مطلق بقواعد بيانات
                PostgreSQL RLS، وسرعة كاشير فائقة تدعم كافة أجهزة الباركود والطباعة الحرارية.
              </motion.p>

              {/* Dual Action CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-3 pt-2"
              >
                <Button
                  size="lg"
                  className="bg-brand text-white font-bold hover:bg-brand/90 px-8 shadow-md shadow-brand/25 text-sm"
                  render={<Link to="/signup" />}
                  nativeButton={false}
                >
                  <span>ابدأ تجربة مجانية 14 يوماً</span>
                  <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-xs sm:text-sm font-semibold border-slate-300 dark:border-slate-700"
                  render={<Link to="/contact" />}
                  nativeButton={false}
                >
                  احجز عرضاً توضيحياً (Demo)
                </Button>
              </motion.div>

              {/* Trust Micro-Bullets */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500 font-bold" /> بدون بطاقة دفع ائتمانية
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500 font-bold" /> تفعيل فوري لكافة الموديولات
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500 font-bold" /> متوافق مع هيئات الزكاة والضرائب
                </span>
              </motion.div>
            </div>

            {/* 3D-Perspective ERP Mockup Frame with Layered Floating Pills */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              className="mt-12 sm:mt-16 relative mx-auto max-w-5xl"
            >
              {/* Outer Glow & Shadow Container */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-slate-300/60 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/70">
                {/* Browser Frame Title Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ms-2 font-mono text-[11px] text-slate-400">
                      https://app.mizan.app/c/german-egyptian/pos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px]">
                      نظام متصل • سحابي
                    </Badge>
                  </div>
                </div>

                {/* Simulated Real POS & Dashboard Interface */}
                <div className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl">
                  {/* Top KPIs Row inside mockup */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400">مبيعات الوردية اللحظية</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                        24,850.00 ج.م
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                        <TrendingUp className="h-3 w-3" /> +14.2% عن أمس
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400">الفواتير المصدرة اليوم</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                        184 فاتورة
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        متوسط الفاتورة: 135 ج.م
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400">أرصدة المستودعات النشطة</div>
                      <div className="text-base sm:text-lg font-black text-brand font-mono mt-0.5">
                        12,400 قطعة
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">4 مستودعات متزامنة</div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400">حالة عزل البيانات (RLS)</div>
                      <div className="text-base sm:text-lg font-black text-emerald-600 font-mono mt-0.5">
                        100% معزول
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">PostgreSQL Kernel</div>
                    </div>
                  </div>

                  {/* POS Cashier Main Workspace Mockup */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          نقطة البيع السريعة • الوردية الصباحية
                        </span>
                        <span className="text-xs font-mono text-emerald-600 font-bold">
                          ● طابعة الكاشير جاهزة (80mm)
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            جبنة بيضاء فيتا 500 جم (باركود: 62210492810)
                          </span>
                          <span className="font-bold font-mono">45.00 ج.م</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            عصير برتقال طبيعي 1L × 2
                          </span>
                          <span className="font-bold font-mono">60.00 ج.م</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            شاي أسود 100 فتلة فاخر
                          </span>
                          <span className="font-bold font-mono">85.00 ج.م</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                          إجمالي الحساب المستحق
                        </div>
                        <div className="text-2xl font-black text-brand font-mono">
                          216.60 ج.م
                        </div>
                        <div className="text-[10px] text-slate-400">
                          شامل ضريبة القيمة المضافة 14%
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>رمز ZATCA QR:</span>
                          <Badge variant="success" className="text-[9px]">
                            مضمن بالفاتورة
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>درج النقدية:</span>
                          <span className="font-mono text-emerald-600 font-bold">نبضة RJ11 ✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layered Floating Accent Pill 1 (Top Left) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden sm:flex absolute -top-5 -start-6 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Printer className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">إيصال حراري 80mm</div>
                  <div className="text-[10px] text-slate-400">طباعة فورية + نبضة الدرج</div>
                </div>
              </motion.div>

              {/* Layered Floating Accent Pill 2 (Bottom Right) */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="hidden sm:flex absolute -bottom-5 -end-6 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-brand dark:bg-blue-950 dark:text-brand-light">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">PostgreSQL RLS</div>
                  <div className="text-[10px] text-slate-400">عزل أمني تام للمنشآت</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 2. THE PROBLEM VS. SOLUTION NARRATIVE                                 */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 dark:border-slate-800 dark:bg-slate-900 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40">
                المقارنة الهندسية
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                لماذا تفشل أنظمة الـ ERP التقليدية؟ وكيف يعالج ميزان هذه المعضلة؟
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Problem Column */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-900/50 dark:bg-rose-950/20 space-y-4">
                <h3 className="font-bold text-base text-rose-900 dark:text-rose-300 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-200 text-rose-800 text-xs font-black">
                    ✕
                  </span>
                  الأنظمة الكلاسيكية والبرامج الجامدة
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>تكلفة تأسيسية باهظة وعقود صيانة معقدة تجبرك على الدفع لميزات لا تستخدمها.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>بطء شديد في شاشات الكاشير وتعطل البيع عند انقطاع كابل الإنترنت.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>تشتت البيانات بين برامج منفصلة لكل فرع وصعوبة مطابقة الخزائن والعهد.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>صعوبة بالغة في التوسع أو إضافة أنشطة جديدة للمنشأة.</span>
                  </li>
                </ul>
              </div>

              {/* Solution Column */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-4">
                <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-xs font-black">
                    ✓
                  </span>
                  معمارية ميزان ERP المعيارية الحديثة
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>معيارية تامة: 47 موديولاً متخصصاً تفعّل ما تحتاجه فقط بنقرة زر واحدة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>سرعة استجابة أقل من 3 ثوانٍ للكاشير مع عمل كامل بدون إنترنت (Offline-First).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>شجرة حسابات موحدة وقيد محاسبي مزدوج يرحل العمليات تلقائياً في لحظتها.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>عزل رياضي بقواعد بيانات PostgreSQL RLS بدون أي مخاطر تسريب.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. INTERACTIVE PRODUCT SHOWCASE COMPONENT (THE CENTERPIECE)          */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="bg-brand/10 text-brand">
              محاكاة تفاعلية حية
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              استكشف الموديول المناسب لنشاطك عملياً
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              اختر أي موديول أدناه لتجربة واجهته التفاعلية، مسح الباركود، ومعاينة الفاتورة الحرارية
            </p>
          </div>

          <InteractiveProductShowcase />
        </section>

        {/* ==================================================================== */}
        {/* 4. HARDWARE, IOT & AUTOMATION SHOWCASE                                */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 dark:border-slate-800 dark:bg-slate-900 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="bg-brand/10 text-brand">
                العتاد وأجهزة الكاشير
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                تكامل مباشر مع كافة أجهزة نقاط البيع والطباعة
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                لا حاجة لتثبيت برامج تشغيل خارجية أو وسيطة، يتصل ميزان بالأجهزة عبر بروتوكولات معتمدة
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
                  <Printer className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  طابعات الإيصالات الحرارية
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  دعم بروتوكول ESC/POS بمقاسي 80mm و58mm عبر USB، الشبكة، أو البلوتوث مع قطع الورق
                  التلقائي.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
                  <Barcode className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  قارئات الباركود السريعة
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  محرك استماع عالي السرعة (useBarcodeScanner) يميز المسح الآلي عن الكتابة اليدوية مع نغمة
                  تأكيد فورية.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  رمز ZATCA / ETA QR المعتمد
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  توليد كود TLV Base64 مشفر وفق متطلبات هيئة الزكاة والجمارك ومنظومة الفاتورة
                  الإلكترونية المصرية.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  أجهزة البصمة ZKTeco
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  مزامنة تلقائية لبصمات الحضور والانصراف عبر بروتوكول TCP/IP (منفذ 4370) لترحيلها لمسير
                  الرواتب.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 5. PRICING PREVIEW SECTION                                           */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="bg-brand/10 text-brand">
              باقات شفافة بلا قيود خفية
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              اختر الخطة المناسبة لحجم منشأتك
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              ادفع سنوياً ووفر 20%، أو اشترك شهرياً مع إمكانية الإلغاء أو الترقية في أي وقت
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <span
                className={`text-xs font-bold ${
                  billingCycle === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-400"
                }`}
              >
                الدفع الشهري
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "annual" ? "monthly" : "annual")}
                className="relative h-6 w-12 rounded-full bg-brand p-1 transition-colors"
                aria-label="تبديل دورة الدفع"
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    billingCycle === "annual" ? "translate-x-6 rtl:-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  billingCycle === "annual" ? "text-slate-900 dark:text-white" : "text-slate-400"
                }`}
              >
                <span>الدفع السنوي</span>
                <Badge variant="success" className="text-[10px]">
                  خصم 20%
                </Badge>
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const price =
                billingCycle === "annual"
                  ? Math.round(plan.price_annual_egp / 12)
                  : plan.price_egp;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                    plan.popular
                      ? "border-brand bg-white shadow-xl ring-2 ring-brand/30 dark:bg-slate-900"
                      : "border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-bold">
                      الأكثر طلباً
                    </Badge>
                  )}

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{plan.tagline}</p>

                    <div className="mt-4 border-y border-slate-100 py-3 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                          {price === 0 ? "مجاناً" : `${price} ج.م`}
                        </span>
                        {price > 0 && <span className="text-xs text-slate-400">/ شهرياً</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {billingCycle === "annual" && price > 0
                          ? `تدفع ${plan.price_annual_egp} ج.م سنوياً`
                          : "فاتورة شهرية مرنة"}
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-500 font-bold mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      className={`w-full text-xs font-bold ${
                        plan.popular
                          ? "bg-brand text-white hover:bg-brand/90"
                          : "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700"
                      }`}
                      render={<Link to="/signup" />}
                      nativeButton={false}
                    >
                      {price === 0 ? "بدء التجربة المجانية" : "اختيار الباقة"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Link
              to="/pricing"
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>عرض جدول المقارنة التفصيلي لكافة المزايا والحدود</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 6. INTERACTIVE FAQ ACCORDION                                         */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              الأسئلة الشائعة حول المنظومة
            </h2>
            <p className="text-xs text-slate-500">إجابات واضحة ومباشرة لأهم استفساراتك</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
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
                        className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 7. FINAL HIGH-CONVERTING CONVERSION BANNER                            */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-dark to-slate-900 p-8 sm:p-14 text-center text-white shadow-2xl">
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white text-xs">
                انضم إلى الجيل الجديد
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                ابدأ رحلة التحول الرقمي لمنشأتك مع ميزان ERP اليوم
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                14 يوماً تجربة كاملة مجاناً لكافة الموديولات. تهيئة سهلة في 10 دقائق، دعم فني متواصل،
                وضمان استقرار لا يتوقف.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  size="lg"
                  className="bg-brand text-white font-bold hover:bg-brand/90 px-8 text-sm shadow-lg"
                  render={<Link to="/signup" />}
                  nativeButton={false}
                >
                  بدء التجربة المجانية الآن
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs sm:text-sm font-semibold"
                  render={<Link to="/contact" />}
                  nativeButton={false}
                >
                  طلب استشارة مبيعات
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
