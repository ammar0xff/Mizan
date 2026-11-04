import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Building2,
  Users,
  ShieldCheck,
  Play,
  Box,
  BarChart3,
  Shield,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { MizanDashboardHeroMockup } from "./components/MizanDashboardHeroMockup";
import { BuildingMaterialsPosDemo } from "./components/BuildingMaterialsPosDemo";
import { PLANS } from "./plans";
import { useTranslation } from "@/i18n";

export default function LandingPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const shouldReduceMotion = useReducedMotion();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeModuleTab, setActiveModuleTab] = useState<number>(0);

  const pricingPlans = PLANS.filter((p) => p.id !== "trial");

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  // Modular Units for the Interactive Architecture Showcase
  const modules = [
    {
      id: "finance",
      titleEn: "Accounting & Finance",
      titleAr: "المحاسبة والمالية المتقدمة",
      descEn: "Multi-currency general ledger, real-time balance sheet, tax-compliant invoicing, and automated bank reconciliation.",
      descAr: "شجرة حسابات ذكية، قيود يومية آلية، مراكز تكلفة، وتقارير ختامية وميزانية عمومية لحظية متوافقة مع ETA.",
      icon: BarChart3,
      statsEn: "99.98% ledger accuracy",
      statsAr: "دقة محاسبية 99.98%",
    },
    {
      id: "sales",
      titleEn: "Sales & POS Terminal",
      titleAr: "المبيعات ونقاط البيع السريعة",
      descEn: "High-speed 2-second cashier checkout, thermal printing, barcode scanner integration, and offline-first data sync.",
      descAr: "إصدار فواتير في ثانيتين، ربط قارئات الباركود وطابعات الإيصالات 80mm، ونمط تشغيل أوفلاين كامل بدون إنترنت.",
      icon: Zap,
      statsEn: "< 2s checkout speed",
      statsAr: "إصدار الفاتورة < ثانيتين",
    },
    {
      id: "inventory",
      titleEn: "Inventory & Warehouses",
      titleAr: "المخازن والمستودعات والوحدات",
      descEn: "Compound units conversion (meter, carton, bag), batch tracking, barcode label printing, and multi-branch stock transfers.",
      descAr: "معاملات تحويل الوحدات المركبة (متر، لفة، كرتونة)، تنبيهات نواقص المخزون، ونقل بضائع سلس بين الفروع.",
      icon: Layers,
      statsEn: "Zero stock discrepancies",
      statsAr: "مطابقة رصيد المخزن الفعلي",
    },
    {
      id: "purchases",
      titleEn: "Procurement & Vendors",
      titleAr: "المشتريات ويومية الموردين",
      descEn: "Vendor ledger reconciliation, payment schedules, purchase orders tracking, and automated cost averaging.",
      descAr: "متابعة حسابات الموردين والأجل، مسحوبات البضائع، الشيكات المستحقة، ومتوسط تكلفة الشراء المرجح.",
      icon: Box,
      statsEn: "Full payables control",
      statsAr: "ضبط مديونيات الموردين بدقة",
    },
    {
      id: "hr",
      titleEn: "HR & Shift Attendance",
      titleAr: "الموارد البشرية وورديات العمل",
      descEn: "Biometric attendance tracking, shift handover audits, commissions, advances deductions, and payroll calculation.",
      descAr: "توثيق حضور الموظفين، تقارير Z-Report لتسليم الوردية، سلف العمال، وحساب الرواتب والبدلات آلياً.",
      icon: Users,
      statsEn: "Seamless shift audit",
      statsAr: "تسليم وردية ومطابقة درج 100%",
    },
  ];

  const faqs = [
    {
      qEn: "How does Mizan guarantee uninterrupted sales when the internet disconnects?",
      qAr: "كيف يضمن ميزان استمرار البيع عند انقطاع كابل الإنترنت؟",
      aEn: "The POS cashier application is built offline-first. It caches all products, prices, and discounts locally in encrypted storage. You can scan barcodes, issue invoices, and print receipts normally without internet. All data synchronizes automatically to the cloud as soon as connection restores.",
      aAr: "يعمل تطبيق الكاشير بنمط Offline-First؛ حيث يحتفظ بنسخة مشفرة من الأصناف والأسعار محلياً داخل جهازك. يمكنك مسح الباركود، إصدار الفواتير، وطباعة الإيصالات بشكل طبيعي، وتتم المزامنة التلقائية مع السحابة فور عودة الاتصال.",
    },
    {
      qEn: "Does Mizan support standard thermal receipt printers and barcode scanners?",
      qAr: "هل يدعم النظام طابعات الإيصالات الحرارية وقوارئ الباركود المتوفرة بالمحل؟",
      aEn: "Yes. Mizan integrates directly with standard ESC/POS USB and network receipt printers (80mm and 58mm), wired and wireless barcode scanners, and electronic barcode weight scales without requiring proprietary hardware.",
      aAr: "نعم. يتكامل ميزان مباشرة مع كافة طابعات الإيصالات الحرارية القياسية عبر USB أو الشبكة (80 مم و58 مم) ببروتوكول ESC/POS، بالإضافة إلى قارئات الباركود السلكية واللاسلكية وموازين الباركود الإلكترونية.",
    },
    {
      qEn: "Can businesses activate only the modules they need?",
      qAr: "هل يمكن تفعيل الوحدات والموديولات التي يحتاجها نشاطي فقط؟",
      aEn: "Absolutely. Mizan is completely modular. You can start with POS and Inventory, and later activate Accounting, HR, or Manufacturing with a single click as your business expands, keeping your subscription and interface clean.",
      aAr: "بالتأكيد. ميزان مصمم ببنية معيارية مرنة؛ يمكنك البدء بالكاشير والمخازن فقط، وتفعيل المحاسبة المتقدمة أو الموارد البشرية أو التصنيع بنقرة زر واحدة كلما نما عملك، دون أي تكاليف أو تعقيدات إضافية.",
    },
    {
      qEn: "Are Mizan invoices compliant with the Egyptian Tax Authority (ETA) requirements?",
      qAr: "هل تتوافق الفواتير مع اشتراطات الفاتورة الإلكترونية المصرية (ETA)؟",
      aEn: "Yes. Invoices include cryptographic QR codes according to Egyptian tax standards, along with tax registration numbers, commercial register details, and buyer data according to ETA regulations.",
      aAr: "نعم. يولد النظام رمز الاستجابة السريعة المشفر وفق المعايير الضريبية المصرية، ويتيح إدراج الرقم الضريبي والسجل التجاري وبيانات المشتري وفق ضوابط مصلحة الضرائب المصرية.",
    },
  ];

  return (
    <MarketingLayout>
      <div className="flex flex-col">
        {/* ================================================================= */}
        {/* 1. HERO SECTION — Deep Merlot (#35151D) with Concentric Arcs      */}
        {/* Matches Image 1 (EN) and Image 2 (AR) Pixel-for-Pixel             */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-[#35151D] text-[#FAF6F0] hero-concentric-arcs pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#4A1520]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column (LTR) / Right Column (RTL): Copy & CTAs */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-5 space-y-6 text-start"
              >
                {/* Pill Tag */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#FAF6F0]/90 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-[#D4626E] animate-pulse" />
                  <span>
                    {isAr
                      ? "منصة ERP عصرية لنمو أعمالك"
                      : "Modern ERP for Growing Businesses"}
                  </span>
                </div>

                {/* Display Headline with Signature Rose-Coral Emphasis */}
                <h1
                  className={`text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#FAF6F0] leading-[1.15] ${
                    isAr ? "font-serif-ar" : "font-serif-en"
                  }`}
                >
                  {isAr ? (
                    <>
                      أدر أعمالك{" "}
                      <span className="italic text-[#D4626E] font-semibold">
                        بتوازن.
                      </span>
                      <br />
                      <span className="text-2xl sm:text-3xl lg:text-4xl block mt-2 text-[#FAF6F0]/90">
                        نظام واحد. رؤية أوضح. نمو أكثر ذكاءً.
                      </span>
                    </>
                  ) : (
                    <>
                      Bring your
                      <br />
                      business into
                      <br />
                      perfect{" "}
                      <span className="italic text-[#D4626E] font-normal">
                        balance
                      </span>
                    </>
                  )}
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[#E7D6C1]/85 leading-relaxed max-w-lg font-light">
                  {isAr
                    ? "منصة ميزان لإدارة أعمالك، تجمع العمليات المالية والإدارية والتشغيلية في منظومة واحدة متكاملة."
                    : "Mizan is a powerful, modular ERP platform that connects your operations, finances, and people — in one elegant system."}
                </p>

                {/* CTAs matching mockup */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button
                    size="lg"
                    className="bg-[#651E2C] text-[#FAF6F0] hover:bg-[#521723] rounded-full px-7 py-3.5 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    render={<Link to="/signup" />}
                    nativeButton={false}
                  >
                    <span>{isAr ? "اكتشف ميزان" : "Start Free Trial"}</span>
                    {isAr ? (
                      <ArrowLeft className="h-4 w-4 ms-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 ms-2" />
                    )}
                  </Button>

                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm sm:text-base font-medium text-[#FAF6F0] backdrop-blur-sm transition-all hover:border-white/30"
                  >
                    <Play className="h-4 w-4 fill-current text-[#D4626E]" />
                    <span>{isAr ? "استكشف المنصة" : "Watch Demo"}</span>
                  </a>
                </div>

                {/* Metrics row at bottom of hero */}
                <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-bold font-mono text-[#FAF6F0]">
                      <Building2 className="h-4 w-4 text-[#D4626E] shrink-0" />
                      <span>{isAr ? "+100" : "100+"}</span>
                    </div>
                    <div className="text-xs text-[#E7D6C1]/75">
                      {isAr ? "شركة تعتمد علينا" : "Companies"}
                    </div>
                  </div>

                  <div className="space-y-1 border-s border-white/10 ps-4">
                    <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-bold font-mono text-[#FAF6F0]">
                      <Users className="h-4 w-4 text-[#D4626E] shrink-0" />
                      <span>{isAr ? "+1,500" : "1,500+"}</span>
                    </div>
                    <div className="text-xs text-[#E7D6C1]/75">
                      {isAr ? "مستخدم متزامن" : "Concurrent Users"}
                    </div>
                  </div>

                  <div className="space-y-1 border-s border-white/10 ps-4">
                    <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-bold font-mono text-[#FAF6F0]">
                      <ShieldCheck className="h-4 w-4 text-[#27835C] shrink-0" />
                      <span>99.9%</span>
                    </div>
                    <div className="text-xs text-[#E7D6C1]/75">
                      {isAr ? "وقت التشغيل" : "Uptime"}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column (LTR) / Left Column (RTL): Dashboard Mockup Frame */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="lg:col-span-7"
              >
                <MizanDashboardHeroMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. WHY MIZAN SECTION — Warm Ivory (#F5EBDD) Architectural Layout  */}
        {/* Matches Image 1 (EN) and Image 2 (AR) Pixel-for-Pixel             */}
        {/* ================================================================= */}
        <section className="bg-[#F5EBDD] py-16 sm:py-24 border-b border-[#E6DCD2]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              {/* Architectural Image with Burgundy Circular Disc */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Overlapping Burgundy Architectural Disc Graphic */}
                  <div
                    className={`absolute -top-6 ${
                      isAr ? "-start-6" : "-end-6"
                    } w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-[#651E2C] opacity-90 z-0 shadow-lg`}
                  />

                  {/* High-Resolution Architectural Archways Photograph */}
                  <div className="relative z-10 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#DECFC0] shadow-2xl bg-[#EFE4D6]">
                    <img
                      src="./assets/marketing/arch-hero-feature.jpg"
                      alt="Mizan Architectural Balance & Structure"
                      className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Editorial Feature Story & 3 Pillars */}
              <div className="lg:col-span-7 space-y-6 text-start">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#77716E]">
                    {isAr ? "لماذا ميزان؟" : "WHY MIZAN"}
                  </span>
                  <div className="h-px w-16 bg-[#DECFC0]" />
                </div>

                <h2
                  className={`text-3xl sm:text-4xl lg:text-5xl font-normal text-[#262321] tracking-tight leading-[1.2] ${
                    isAr ? "font-serif-ar" : "font-serif-en"
                  }`}
                >
                  {isAr ? (
                    <>
                      أكثر من مجرد نظام ERP.
                      <br />
                      <span className="text-[#651E2C] font-semibold">
                        إنه نظام بيئي متكامل لنجاح أعمالك.
                      </span>
                    </>
                  ) : (
                    <>
                      More than an ERP.
                      <br />
                      A complete business{" "}
                      <span className="italic text-[#651E2C]">ecosystem.</span>
                    </>
                  )}
                </h2>

                <p className="text-sm sm:text-base text-[#55504D] leading-relaxed max-w-xl">
                  {isAr
                    ? "من المنظومة المرنة إلى التقارير الذكية، يمنحك ميزان الأدوات التي تحتاجها لإدارة أعمالك بكفاءة وتحقيق أهدافك بثقة."
                    : "From finance to HR, inventory to projects — Mizan brings everything together with unmatched flexibility and ease of use."}
                </p>

                {/* 3 Pillars List */}
                <div className="space-y-4 pt-2">
                  {/* Pillar 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7D6C1] text-[#651E2C] shadow-xs">
                      <Box className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#262321]">
                        {isAr ? "تصميم وحدات مرن" : "Modular Design"}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#77716E]">
                        {isAr
                          ? "فعل ما تحتاجه فقط.. ودع الباقي لاحقاً."
                          : "Start with what you need, grow without limits."}
                      </p>
                    </div>
                  </div>

                  {/* Pillar 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7D6C1] text-[#651E2C] shadow-xs">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#262321]">
                        {isAr ? "تحليلات ذكية" : "Real-Time Insights"}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#77716E]">
                        {isAr
                          ? "اتخذ قرارات أذكى وأسرع."
                          : "Make smarter decisions, faster."}
                      </p>
                    </div>
                  </div>

                  {/* Pillar 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7D6C1] text-[#651E2C] shadow-xs">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#262321]">
                        {isAr ? "أمان بمعايير عالمية" : "Enterprise-Grade Security"}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#77716E]">
                        {isAr
                          ? "بياناتك دائماً في أمان."
                          : "Your data, always protected."}
                      </p>
                    </div>
                  </div>
                </div>

                {isAr && (
                  <div className="pt-2">
                    <Button
                      size="default"
                      className="bg-[#651E2C] text-[#FAF6F0] hover:bg-[#521723] rounded-full px-6 py-2.5 text-xs font-semibold"
                      render={<Link to="/product" />}
                      nativeButton={false}
                    >
                      <span>تعرف على المزيد</span>
                      <ArrowLeft className="h-3.5 w-3.5 ms-1.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. MODULAR ARCHITECTURE SHOWCASE — Unified Enterprise Ecosystem   */}
        {/* Matches Image 4 (Product Page / Ecosystem Architecture)           */}
        {/* ================================================================= */}
        <section className="bg-[#FAF6F0] py-16 sm:py-24 border-b border-[#E6DCD2]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B86B76]">
                {isAr ? "بنية معمارية معيارية" : "MODULAR ARCHITECTURE"}
              </span>
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-normal text-[#262321] tracking-tight ${
                  isAr ? "font-serif-ar" : "font-serif-en"
                }`}
              >
                {isAr
                  ? "منصة أعمال متكاملة في نظام واحد"
                  : "One Integrated Business Platform"}
              </h2>
              <p className="text-sm sm:text-base text-[#77716E] leading-relaxed">
                {isAr
                  ? "اختر الوحدات التي تناسب متطلبات نشاطك اليوم، مع إمكانية التوسع والتكامل في أي وقت دون إعادة هيكلة البيانات."
                  : "Activate only the modules your business needs today, and scale seamlessly as your operations expand."}
              </p>
            </div>

            {/* Interactive Module Tabs & Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Module Selector List (5 Cols) */}
              <div className="lg:col-span-5 space-y-2">
                {modules.map((m, idx) => {
                  const Icon = m.icon;
                  const isSelected = activeModuleTab === idx;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveModuleTab(idx)}
                      className={`w-full text-start p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-[#FFFFFF] border-[#651E2C] shadow-md ring-1 ring-[#651E2C]"
                          : "bg-[#FFFFFF]/60 border-[#DECFC0] hover:bg-[#FFFFFF] hover:border-[#B86B76]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                            isSelected
                              ? "bg-[#651E2C] text-[#FAF6F0]"
                              : "bg-[#EFE4D6] text-[#651E2C]"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#262321]">
                            {isAr ? m.titleAr : m.titleEn}
                          </div>
                          <div className="text-xs text-[#77716E]">
                            {isAr ? m.statsAr : m.statsEn}
                          </div>
                        </div>
                      </div>
                      {isAr ? (
                        <ArrowLeft
                          className={`h-4 w-4 transition-transform ${
                            isSelected ? "text-[#651E2C] translate-x-1" : "text-transparent"
                          }`}
                        />
                      ) : (
                        <ArrowRight
                          className={`h-4 w-4 transition-transform ${
                            isSelected ? "text-[#651E2C] translate-x-1" : "text-transparent"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Module Active Detail Frame (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-[#DECFC0] bg-[#FFFFFF] p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0E4] text-[#651E2C]">
                        {(() => {
                          const ModIcon = modules[activeModuleTab].icon;
                          return <ModIcon className="h-6 w-6 text-[#651E2C]" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#262321]">
                          {isAr
                            ? modules[activeModuleTab].titleAr
                            : modules[activeModuleTab].titleEn}
                        </h3>
                        <span className="text-xs text-[#27835C] font-semibold bg-[#27835C]/10 px-2.5 py-0.5 rounded-full inline-block mt-1">
                          {isAr ? "وحدة معيارية جاهزة للعمل" : "Standard Ready Module"}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/product"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#651E2C] hover:underline"
                    >
                      <span>{isAr ? "تفاصيل الوحدة" : "Module Specs"}</span>
                      {isAr ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    </Link>
                  </div>

                  <p className="text-sm sm:text-base text-[#55504D] leading-relaxed">
                    {isAr
                      ? modules[activeModuleTab].descAr
                      : modules[activeModuleTab].descEn}
                  </p>

                  <div className="rounded-2xl border border-[#DECFC0] bg-[#FAF6F0] p-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#77716E]">
                      {isAr ? "أبرز الإمكانيات المتاحة" : "Core Capabilities Included"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#262321]">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#27835C] shrink-0" />
                        <span>{isAr ? "قاعدة بيانات مستقلة وعزل كامل" : "Tenant Isolation & RLS Security"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#27835C] shrink-0" />
                        <span>{isAr ? "تصدير وطباعة تقارير فورية" : "Instant Reports Exporting"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#27835C] shrink-0" />
                        <span>{isAr ? "سجل تدقيق كامل للعمليات Audit" : "Full Operation Audit Logging"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#27835C] shrink-0" />
                        <span>{isAr ? "دعم كامل للغة العربية والإنجليزية" : "Full RTL / LTR Bilingualism"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. LIVE INTERACTIVE POS TERMINAL — Verified Offline Simulation     */}
        {/* ================================================================= */}
        <section id="demo" className="bg-[#F5EBDD] py-16 sm:py-24 border-b border-[#E6DCD2]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="max-w-2xl text-start space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#651E2C]">
                {isAr ? "محاكاة تشغيلية حية" : "LIVE INTERACTIVE EXPERIENCE"}
              </span>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-normal text-[#262321] tracking-tight ${
                  isAr ? "font-serif-ar" : "font-serif-en"
                }`}
              >
                {isAr ? "جرّب كاشير ميزان بنفسك الآن" : "Try Mizan POS Terminal Live"}
              </h2>
              <p className="text-xs sm:text-sm text-[#77716E]">
                {isAr
                  ? "امسح باركود الأصناف بالزر، راقب احتساب الضريبة بدقة 14%، ثم أخرج الفاتورة للإيصال الحراري بنمط أوفلاين."
                  : "Simulate barcode scanning, observe accurate 14% VAT calculation, and issue an 80mm thermal receipt."}
              </p>
            </div>

            {/* The Working Interactive POS Demo */}
            <BuildingMaterialsPosDemo />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. PRICING SECTION — 3 Luxury Tiers with Monthly/Annual Switch     */}
        {/* Matches Image 4 (Pricing Page)                                    */}
        {/* ================================================================= */}
        <section className="bg-[#FAF6F0] py-16 sm:py-24 border-b border-[#E6DCD2]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B86B76]">
                {isAr ? "الأسعار والباقات" : "TRANSPARENT PRICING"}
              </span>
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-normal text-[#262321] tracking-tight ${
                  isAr ? "font-serif-ar" : "font-serif-en"
                }`}
              >
                {isAr
                  ? "خطط تسعير مرنة تناسب احتياجاتك"
                  : "Predictable Plans Built to Scale"}
              </h2>
              <p className="text-sm sm:text-base text-[#77716E]">
                {isAr
                  ? "ابدأ تجربتك المجانية لمدة 14 يوماً بلا بطاقة دفع. اختر الباقة المناسبة لحجم نشاطك."
                  : "Start your 14-day free trial with no card required. Cancel or upgrade anytime."}
              </p>

              {/* Monthly / Annual Honest Switcher */}
              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center rounded-full border border-[#DECFC0] bg-[#FAF0E4] p-1 text-xs">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                      billingCycle === "monthly"
                        ? "bg-[#651E2C] text-[#FAF6F0] shadow-xs"
                        : "text-[#55504D] hover:text-[#262321]"
                    }`}
                  >
                    {isAr ? "شهري" : "Monthly"}
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`rounded-full px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                      billingCycle === "annual"
                        ? "bg-[#651E2C] text-[#FAF6F0] shadow-xs"
                        : "text-[#55504D] hover:text-[#262321]"
                    }`}
                  >
                    <span>{isAr ? "سنوي (شهرين مجاناً)" : "Annual (2 Months Free)"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {pricingPlans.map((plan) => {
                const isAnnual = billingCycle === "annual";
                const displayPrice = isAnnual
                  ? Math.round(plan.price_annual_egp / 12)
                  : plan.price_egp;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-8 bg-[#FFFFFF] transition-all hover:shadow-xl ${
                      plan.popular
                        ? "border-[#651E2C] shadow-lg ring-1 ring-[#651E2C]"
                        : "border-[#DECFC0] shadow-sm"
                    }`}
                  >
                    {/* Centered Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <span className="rounded-full bg-[#651E2C] text-[#FAF6F0] px-4 py-1 text-xs font-semibold shadow-md">
                          {isAr ? "الأكثر طلباً" : "Most Popular"}
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-[#262321]">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-[#77716E] mt-1 min-h-[32px]">
                          {plan.tagline}
                        </p>
                      </div>

                      {/* Price Figure */}
                      <div className="border-t border-[#E6DCD2] pt-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold font-mono text-[#262321]">
                            {displayPrice.toLocaleString("en-US")}
                          </span>
                          <span className="text-xs font-medium text-[#77716E]">
                            {isAr ? "ج.م / شهرياً" : "EGP / mo"}
                          </span>
                        </div>
                        <div className="text-xs text-[#77716E] font-mono mt-1">
                          {isAnnual
                            ? isAr
                              ? `تُدفع ${plan.price_annual_egp.toLocaleString("en-US")} ج.م سنوياً`
                              : `Billed annually at ${plan.price_annual_egp.toLocaleString("en-US")} EGP/yr`
                            : isAr
                            ? "دفع شهري متجدد"
                            : "Billed monthly"}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="border-t border-[#E6DCD2] pt-4 space-y-2">
                        <div className="text-xs font-bold text-[#262321]">
                          {isAr ? "المزايا المشمولة:" : "Included features:"}
                        </div>
                        <ul className="space-y-2 text-xs text-[#55504D]">
                          {plan.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-[#27835C] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#E6DCD2] mt-6">
                      <Button
                        className={`w-full min-h-[44px] rounded-full text-xs font-semibold ${
                          plan.popular
                            ? "bg-[#651E2C] text-[#FAF6F0] hover:bg-[#521723]"
                            : "bg-[#EFE4D6] text-[#262321] hover:bg-[#E7D6C1]"
                        }`}
                        render={
                          <Link to={plan.id === "enterprise" ? "/contact" : "/signup"} />
                        }
                        nativeButton={false}
                      >
                        {plan.id === "enterprise"
                          ? isAr
                            ? "تواصل مع فريق المبيعات"
                            : "Contact Enterprise Sales"
                          : isAr
                          ? "ابدأ تجربة مجانية (14 يوماً)"
                          : "Start 14-Day Free Trial"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. FAQ SECTION — Typographic Disclosure Accordion                 */}
        {/* ================================================================= */}
        <section className="bg-[#F5EBDD] py-16 sm:py-20 border-b border-[#E6DCD2]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-start space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B86B76]">
                {isAr ? "الأسئلة الشائعة" : "FREQUENTLY ASKED QUESTIONS"}
              </span>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-normal text-[#262321] tracking-tight ${
                  isAr ? "font-serif-ar" : "font-serif-en"
                }`}
              >
                {isAr ? "إجابات واضحة ومباشرة" : "Clear Answers to Common Questions"}
              </h2>
            </div>

            <div className="divide-y divide-[#DECFC0] border-y border-[#DECFC0]">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="py-4">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between text-start gap-4 min-h-[44px] text-sm sm:text-base font-semibold text-[#262321] hover:text-[#651E2C] transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#77716E] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#651E2C]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                        transition={{ duration: 0.15 }}
                        className="pt-2 text-xs sm:text-sm leading-relaxed text-[#55504D]"
                      >
                        {isAr ? faq.aAr : faq.aEn}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7. FINAL EDITORIAL CTA BANNER — Deep Merlot (#35151D)             */}
        {/* ================================================================= */}
        <section className="bg-[#35151D] text-[#FAF6F0] py-16 sm:py-24 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4626E]">
              {isAr ? "ابدأ اليوم بلا تعقيد" : "EQUILIBRIUM IN BUSINESS"}
            </span>

            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FAF6F0] tracking-tight leading-tight ${
                isAr ? "font-serif-ar" : "font-serif-en"
              }`}
            >
              {isAr
                ? "ابدأ إدارة أعمالك بتوازن تشغيلي ومالي دقيق اليوم."
                : "Bring your business into perfect balance today."}
            </h2>

            <p className="text-xs sm:text-sm text-[#E7D6C1]/80 max-w-lg mx-auto">
              {isAr
                ? "فترة تجريبية 14 يوماً بكامل المزايا · بدون بطاقة بنكية · جاهز للعمل السحابي فوراً."
                : "14-day full feature trial · No credit card required · Instant cloud setup."}
            </p>

            <div className="pt-4 flex justify-center">
              <Button
                size="lg"
                className="bg-[#651E2C] text-[#FAF6F0] hover:bg-[#521723] rounded-full px-8 py-4 text-sm font-semibold shadow-xl hover:scale-105 transition-all"
                render={<Link to="/signup" />}
                nativeButton={false}
              >
                <span>{isAr ? "ابدأ تجربتك المجانية الآن" : "Start Your Free Trial"}</span>
                {isAr ? <ArrowLeft className="h-4 w-4 ms-2" /> : <ArrowRight className="h-4 w-4 ms-2" />}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
