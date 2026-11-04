import { Link } from "react-router-dom";
import {
  BarChart3,
  ShoppingCart,
  Users,
  Layers,
  Box,
  Briefcase,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { useTranslation } from "@/i18n";

export default function FeaturesPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const coreFeatures = [
    {
      id: "finance",
      titleAr: "إدارة مالية متقدمة",
      titleEn: "Advanced Financial Management",
      descAr: "شجرة حسابات موحدة، قيود يومية تلقائية، تسوية بنكية آلية، وميزان مراجعة وتقارير أرباح وخسائر لحظية.",
      descEn: "Unified chart of accounts, automated journal entries, bank reconciliation, balance sheet, and live P&L reports.",
      icon: BarChart3,
      badge: "Accounting",
      itemsAr: [
        "إصدار قيود محاسبية تلقائية مع كل حركة",
        "كشوف حسابات تفصيلية للعملاء والموردين",
        "تقارير مراكز التكلفة والمشروعات",
        "إقرارات ضريبة القيمة المضافة ETA",
      ],
      itemsEn: [
        "Automated double-entry posting per transaction",
        "Detailed customer and vendor sub-ledgers",
        "Cost centers and project tracking",
        "Tax compliance and VAT return exports",
      ],
    },
    {
      id: "sales",
      titleAr: "إدارة المبيعات ونقاط البيع",
      titleEn: "Sales & Fast POS Terminal",
      descAr: "إصدار فواتير ضريبية في ثانيتين، قراءة باركود سريعة، طباعة إيصالات حرارية، ونمط أوفلاين لا ينقطع.",
      descEn: "2-second checkout, barcode scanning, thermal receipt printing, split payment methods, and offline resilience.",
      icon: ShoppingCart,
      badge: "Sales & POS",
      itemsAr: [
        "دعم قارئات الباركود وطابعات 80mm/58mm",
        "تعليق واستئناف الفواتير بسلاسة",
        "تقارير Z-Report اليومية لإغلاق الدرج",
        "إدارة خصومات وعروض الأسعار التنافسية",
      ],
      itemsEn: [
        "ESC/POS thermal printer and scanner support",
        "Seamless bill holding and resume",
        "Z-Report cashier drawer shift closing",
        "Discount policies and quotation workflows",
      ],
    },
    {
      id: "hr",
      titleAr: "إدارة الموارد البشرية",
      titleEn: "Human Resources & Payroll",
      descAr: "متابعة أجهزة البصمة، تسجيل الحضور والانصراف، مسير الرواتب الآلي، وإدارة السلف والبدلات والعمولات.",
      descEn: "Biometric clock-in integration, attendance, automated payroll, advances deductions, and performance commissions.",
      icon: Users,
      badge: "Human Resources",
      itemsAr: [
        "احتساب الرواتب والبدلات والخصومات آلياً",
        "متابعة ورديات الموظفين وجداول العمل",
        "سجل كامل للعهد والسلف النقدية",
        "تقييم الأداء ونسب عمولات البيع",
      ],
      itemsEn: [
        "Automated salary and deductions calculation",
        "Shift scheduling and attendance audits",
        "Employee cash advances tracking",
        "Performance metrics and sales commissions",
      ],
    },
    {
      id: "inventory",
      titleAr: "إدارة المخزون والمستودعات",
      titleEn: "Inventory & Warehouses",
      descAr: "تتبع الأصناف في مستودعات متعددة، معاملات تحويل الوحدات المركبة، تنبيهات النواقص، وجرد باركود لاسلكي.",
      descEn: "Multi-branch stock monitoring, compound units converter, stock reorder alerts, and wireless barcode auditing.",
      icon: Layers,
      badge: "Warehouses",
      itemsAr: [
        "تحويل فوري بين المتر واللفة والكرتونة",
        "تتبع أرقام التشغيلات وتواريخ الصلاحية FEFO",
        "أذون الصرف والإضافة والتحويلات المخزنية",
        "معالجة الهالك والتوالف بدقة تامة",
      ],
      itemsEn: [
        "Instant compound units conversion",
        "Batch and expiry date tracking (FEFO)",
        "Goods receipt, issue, and branch transfers",
        "Scrap and damaged inventory write-offs",
      ],
    },
    {
      id: "purchasing",
      titleAr: "المشتريات وإدارة الموردين",
      titleEn: "Purchasing & Vendors",
      descAr: "أوامر الشراء، استلام البضائع وفحص الجودة، إدارة مسحوبات الأجل، وجداول استحقاق شيكات الموردين.",
      descEn: "Purchase orders, goods receipt quality checks, credit payables tracking, and vendor check schedules.",
      icon: Box,
      badge: "Procurement",
      itemsAr: [
        "مقارنة عروض أسعار الموردين",
        "تسجيل فواتير الشراء وحساب متوسط التكلفة",
        "تنبيهات مواعيد استحقاق الشيكات والمديونيات",
        "مطابقة كشوف حسابات الموردين آلياً",
      ],
      itemsEn: [
        "Vendor quotations comparison",
        "Purchase bills and weighted average costing",
        "Payment due dates and check alerts",
        "Automated vendor statement reconciliation",
      ],
    },
    {
      id: "projects",
      titleAr: "المشاريع والأتمتة الذكية",
      titleEn: "Projects & Tasks Automation",
      descAr: "إدارة المشاريع، تتبع ساعات العمل، ربط المصروفات بمراكز التكلفة، وجدولة التقارير والتنبيهات الدورية.",
      descEn: "Project milestones, billable hours tracking, cost center expense mapping, and scheduled automated jobs.",
      icon: Briefcase,
      badge: "Projects & Ops",
      itemsAr: [
        "تتبع ربحية المشروعات والمقاولات",
        "جدولة الإغلاق اليومي للورديات تلقائياً",
        "إرسال ملخصات الإيرادات اليومية للمديرين",
        "محرك أتمتة مهام خلفي فائق الاعتمادية",
      ],
      itemsEn: [
        "Project profitability tracking",
        "Automated end-of-day shift closing",
        "Automated daily revenue email summaries",
        "High-reliability background task engine",
      ],
    },
  ];

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-20 space-y-16 sm:space-y-24 bg-[#FAF6F0] text-[#262321]">
        {/* 1. Hero Header matching Image 4 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DECFC0] bg-[#FAF0E4] px-4 py-1.5 text-xs font-semibold text-[#651E2C]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? "قدرات المنظومة الشاملة" : "Complete Platform Capabilities"}</span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-normal text-[#262321] tracking-tight max-w-4xl mx-auto leading-tight ${
              isAr ? "font-serif-ar" : "font-serif-en"
            }`}
          >
            {isAr
              ? "مميزات ميزان — كل ما تحتاجه لإدارة أعمالك بكفاءة"
              : "Mizan Features — Engineered for Total Operational Control"}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#77716E] leading-relaxed">
            {isAr
              ? "مجموعة متكاملة من التطبيقات والوظائف المصممة لتمنحك تحكماً مطلقاً في كل صنف، كل وردية، وكل قرش في منشأتك."
              : "A comprehensive suite of enterprise-grade tools designed to give you precision control over inventory, finances, and workforce."}
          </p>
        </div>

        {/* 2. Six Core Feature Cards Grid matching Image 4 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {coreFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="rounded-3xl border border-[#DECFC0] bg-[#FFFFFF] p-6 sm:p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0E4] text-[#651E2C] shadow-xs">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold text-[#651E2C] bg-[#651E2C]/10 px-3 py-1 rounded-full font-mono">
                        {feat.badge}
                      </span>
                    </div>

                    <h3
                      className={`text-xl font-bold text-[#262321] ${
                        isAr ? "font-serif-ar" : "font-serif-en text-2xl font-normal"
                      }`}
                    >
                      {isAr ? feat.titleAr : feat.titleEn}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#77716E] leading-relaxed">
                      {isAr ? feat.descAr : feat.descEn}
                    </p>

                    <div className="pt-2 border-t border-[#E6DCD2] space-y-2">
                      {(isAr ? feat.itemsAr : feat.itemsEn).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#55504D]">
                          <Check className="h-3.5 w-3.5 text-[#27835C] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#651E2C] hover:text-[#521723] pt-2"
                  >
                    <span>{isAr ? "تفعيل هذه الوحدة" : "Activate This Module"}</span>
                    {isAr ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Deep Showcase Section: Smart Reports & Analytics matching Image 4 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#DECFC0] bg-[#FAF0E4]/60 p-8 sm:p-14 shadow-xl space-y-8">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B86B76]">
                {isAr ? "ذكاء الأعمال الفوري" : "BUSINESS INTELLIGENCE"}
              </span>
              <h2
                className={`text-3xl sm:text-4xl font-normal text-[#262321] tracking-tight ${
                  isAr ? "font-serif-ar" : "font-serif-en"
                }`}
              >
                {isAr ? "تقارير وتحليلات ذكية لحظية" : "Live Intelligent Financial Analytics"}
              </h2>
              <p className="text-xs sm:text-sm text-[#77716E] leading-relaxed">
                {isAr
                  ? "لوحات بيانية تفاعلية تكشف لك في ثوانٍ معدل الربحية الحقيقي، الأصناف الأكثر مبيعاً، ومعدلات دوران المخزون دون انتظار محاسب أو نهاية الشهر."
                  : "Interactive analytical views showing true profit margins, fastest selling SKUs, and inventory turnover in real-time."}
              </p>
            </div>

            {/* Simulated Live Analytics Dashboard Board */}
            <div className="rounded-2xl border border-[#DECFC0] bg-[#FFFFFF] p-6 shadow-lg space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-s divide-[#E6DCD2] text-center">
                <div className="p-2">
                  <div className="text-xs text-[#77716E]">{isAr ? "صافي أرباح الشهر" : "Net Profit"}</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#27835C] mt-1">EGP 342,850</div>
                  <div className="text-[10px] text-[#27835C]">↑ 18.4% vs last mo</div>
                </div>

                <div className="p-2">
                  <div className="text-xs text-[#77716E]">{isAr ? "معدل دوران المخزون" : "Turnover Rate"}</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#262321] mt-1">4.2x / yr</div>
                  <div className="text-[10px] text-[#77716E]">Healthy velocity</div>
                </div>

                <div className="p-2">
                  <div className="text-xs text-[#77716E]">{isAr ? "نسبة التحصيل النقدي" : "Cash Collection"}</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#651E2C] mt-1">94.8%</div>
                  <div className="text-[10px] text-[#77716E]">Low aging debt</div>
                </div>

                <div className="p-2">
                  <div className="text-xs text-[#77716E]">{isAr ? "متوسط زمن الفاتورة" : "Avg Checkout"}</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#262321] mt-1">1.8 sec</div>
                  <div className="text-[10px] text-[#27835C]">Zero queues</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CTA */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl font-normal text-[#262321] tracking-tight ${
              isAr ? "font-serif-ar" : "font-serif-en"
            }`}
          >
            {isAr ? "ابدأ تجربة كافة المميزات مجاناً لمدة 14 يوماً" : "Experience All Features with 14 Days Free"}
          </h2>
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              className="bg-[#651E2C] text-[#FAF6F0] hover:bg-[#521723] rounded-full px-8 py-3.5 text-sm font-semibold shadow-lg"
              render={<Link to="/signup" />}
              nativeButton={false}
            >
              <span>{isAr ? "ابدأ الآن" : "Start Free Trial"}</span>
              {isAr ? <ArrowLeft className="h-4 w-4 ms-2" /> : <ArrowRight className="h-4 w-4 ms-2" />}
            </Button>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
