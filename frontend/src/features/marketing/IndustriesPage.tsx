import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  UtensilsCrossed,
  Stethoscope,
  Briefcase,
  Factory,
  HardHat,
  Check,
  ArrowRight,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { useTranslation } from "@/i18n";

export default function IndustriesPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState("retail");

  const industries = [
    {
      id: "retail",
      icon: ShoppingCart,
      titleAr: "التجزئة والسوبرماركت والمعارض",
      titleEn: "Retail, Supermarkets & Showrooms",
      taglineAr: "سرعة في طوابير الكاشير، ربط الموازين والباركود، وتنبيهات نواقص الأرفف اللحظية.",
      taglineEn: "High-speed cashier checkout, scales and barcode integration, and live stock shortage alerts.",
      descAr: "صُممت حزمة التجزئة خصيصاً للمتاجر الاستهلاكية، معارض الأجهزة، ومحلات السوبرماركت المزدحمة. تدعم قراءة باركود الأوزان للمواد الطازجة، إصدار الفواتير الضريبية في أقل من ثانيتين، وتحديث أرصدة المستودعات فورياً.",
      descEn: "Designed for high-traffic retail outlets, supermarkets, and showrooms. Supports weight scale barcodes, under 2-second invoicing, and instant multi-branch stock reconciliation.",
      metricsAr: [
        { label: "سرعة الفاتورة", value: "< ثانيتين" },
        { label: "دقة المخزون", value: "99.8%" },
        { label: "إغلاق الوردية", value: "دقيقة واحدة" },
      ],
      metricsEn: [
        { label: "Checkout Speed", value: "< 2s" },
        { label: "Stock Accuracy", value: "99.8%" },
        { label: "Shift Close", value: "1 min" },
      ],
      featuresAr: [
        "دعم قراءة باركود الأوزان للمواد الطازجة",
        "تقسيم طرق الدفع (نقدي / فيزا / آجل)",
        "تعليق واستئناف الفواتير بنقرة زر",
        "تقارير Z-Report اليومية لمطابقة الخزينة",
      ],
      featuresEn: [
        "Weight scale barcode scanning",
        "Split payment methods (Cash/Card/Credit)",
        "Instant bill holding and resume",
        "Daily Z-Report register reconciliation",
      ],
    },
    {
      id: "building",
      icon: HardHat,
      titleAr: "مواد البناء والأدوات الصحية والكهرباء",
      titleEn: "Building Materials & Contracting Supplies",
      taglineAr: "تحويل الوحدات المركبة (أمتار، لفات، شكائر)، يومية الموردين، وتتبع الهالك والتوالف.",
      taglineEn: "Compound units conversion (meters, coils, bags), vendor credit ledgers, and scrap write-offs.",
      descAr: "حل متخصص لشركات وتجار الأسمنت، السيراميك، الأدوات الصحية، السباكة، والأسلاك والإنارة. يعالج بدقة بيع الأطوال والأوزان المركبة وخصمها اللحظي من المخزن.",
      descEn: "Engineered specifically for building materials, hardware, plumbing, and electrical merchants with compound length/weight units tracking.",
      metricsAr: [
        { label: "معاملات الوحدات", value: "آلية فورية" },
        { label: "مطابقة الموردين", value: "100%" },
        { label: "نمط أوفلاين", value: "بدون انقطاع" },
      ],
      metricsEn: [
        { label: "Unit Conversion", value: "Instant" },
        { label: "Vendor Audit", value: "100%" },
        { label: "Offline Mode", value: "Uninterrupted" },
      ],
      featuresAr: [
        "بيع بالمتر أو اللفة أو الشيكارة مع تحويل فوري",
        "متابعة مسحوبات الأجل وشيكات الموردين المؤجلة",
        "تسجيل كسر السيراميك وتوالف الأنابيب والأسلاك",
        "إصدار إيصالات حرارية 80mm متوافقة مع ETA",
      ],
      featuresEn: [
        "Compound units conversion (meter/roll/bag)",
        "Vendor payables and post-dated checks",
        "Scrap and breakage cost write-offs",
        "ETA tax-compliant 80mm thermal receipts",
      ],
    },
    {
      id: "restaurant",
      icon: UtensilsCrossed,
      titleAr: "المطاعم والكافيهات والضيافة",
      titleEn: "Restaurants, Cafes & Hospitality",
      taglineAr: "مخطط الصالة والطاولات، شاشات المطبخ اللحظية (KDS)، وتفكيك وصفات الوجبات الخام.",
      taglineEn: "Floorplan table mapping, real-time Kitchen Displays (KDS), and raw ingredients recipe costing.",
      descAr: "منظومة متكاملة لقطاع الأغذية والمشروبات تربط الكابتن أوردر، شاشات المطبخ، والكاشير بسلاسة، مع خصم المقادير الخام للوجبة من المستودع تلقائياً.",
      descEn: "End-to-end hospitality system linking table orders, kitchen display screens, and cashier checkout with automated raw recipe backflushing.",
      metricsAr: [
        { label: "ترحيل الطلب", value: "فوري لحظي" },
        { label: "خفض الهدر", value: "حتى 18%" },
        { label: "شاشات المطبخ", value: "تفاعلية باللمس" },
      ],
      metricsEn: [
        { label: "Ticket Routing", value: "Instant" },
        { label: "Waste Reduction", value: "Up to 18%" },
        { label: "KDS Screens", value: "Touch-first" },
      ],
      featuresAr: [
        "شاشات مطبخ تفاعلية ملونة تصنف الطلبات وتحدد مدة التحضير",
        "مخطط تفاعلي لحالة الطاولات (مشغولة، فارغة، قيد التحاسب)",
        "تجزئة الشيك (Split Bill) بعدة طرق دفع مقسمة",
        "خصم مقادير الوجبة الخام من مستودع الأغذية تلقائياً",
      ],
      featuresEn: [
        "Interactive color-coded touch KDS displays",
        "Interactive floorplan and table reservation states",
        "Split bill processing across multiple diners",
        "Automated raw ingredients recipe backflushing",
      ],
    },
    {
      id: "manufacturing",
      icon: Factory,
      titleAr: "التصنيع والورش وخطوط الإنتاج",
      titleEn: "Manufacturing & Production Lines",
      taglineAr: "شجرة المواد (BOM)، أوامر التشغيل، تتبع تكاليف العمالة والآلات، وإدارة مراحل الإنتاج.",
      taglineEn: "Bill of Materials (BOM), work orders, machine/labor cost tracking, and production stage audits.",
      descAr: "حزمة متقدمة للمصانع والورش والمنشآت التحويلية لمتابعة استهلاك المواد الخام، تكاليف التشغيل غير المباشرة، وحساب التكلفة الفعلية للمنتج النهائي بدقة متناهية.",
      descEn: "Advanced manufacturing engine tracking raw materials consumption, overhead costs, and actual finished goods unit profitability.",
      metricsAr: [
        { label: "تتبع شجرة المواد", value: "دقة 100%" },
        { label: "أوامر التشغيل", value: "لحظية" },
        { label: "حساب التكلفة", value: "آلي بالكامل" },
      ],
      metricsEn: [
        { label: "BOM Precision", value: "100%" },
        { label: "Work Orders", value: "Real-time" },
        { label: "Unit Costing", value: "Automated" },
      ],
      featuresAr: [
        "شجرة مواد تفصيلية للمنتجات المعقدة متعدة المستويات",
        "أوامر تشغيل ومتابعة مراحل الإنتاج من المادة الخام للتام",
        "توزيع تكاليف الكهرباء والعمالة والصيانة على التشغيلات",
        "تقارير فروق التكلفة المعيارية والتكلفة الفعلية",
      ],
      featuresEn: [
        "Multi-level Bill of Materials (BOM) definitions",
        "Work orders tracking stages from raw to finished",
        "Labor, electricity, and maintenance cost allocation",
        "Standard vs actual costing variance analytics",
      ],
    },
    {
      id: "clinic",
      icon: Stethoscope,
      titleAr: "العيادات والمراكز الطبية والمختبرات",
      titleEn: "Clinics, Medical Centers & Labs",
      taglineAr: "الملفات الطبية الإلكترونية (EMR)، حجز المواعيد والكشوفات، والروشتات الرقمية.",
      taglineEn: "Electronic Medical Records (EMR), appointment scheduling, and digital prescription workflows.",
      descAr: "نظام إداري وطبي متكامل للمجمعات الطبية والعيادات التخصصية، يدعم تنظيم جدول الأطباء، السجل المرضي الموحد لكل مريض، وإرسال الروشتة إلكترونياً لصيدلية المركز.",
      descEn: "Comprehensive clinical and administrative management for healthcare facilities, patient files, appointment queuing, and digital doctor notes.",
      metricsAr: [
        { label: "أرشفة السجلات", value: "سحابية مشفرة" },
        { label: "زمن الانتظار", value: "انخفاض 40%" },
        { label: "تكامل الصيدلية", value: "آلي فوري" },
      ],
      metricsEn: [
        { label: "EMR Archival", value: "HIPAA Compliant" },
        { label: "Wait Times", value: "-40% reduction" },
        { label: "Pharmacy Link", value: "Instant" },
      ],
      featuresAr: [
        "سجل مرضي إلكتروني شامل لكل مريض يوثق الزيارات والتشخيص",
        "جدول مواعيد تفاعلي للأطباء مع رسائل تذكير تلقائية",
        "طباعة الروشتات الرقمية وطلبات التحاليل والأشعة المعتمدة",
        "تقارير محاسبية لنسب وأتعاب الأطباء مع المطالبات المالية",
      ],
      featuresEn: [
        "Comprehensive patient history and diagnostic records",
        "Doctor appointment scheduling with SMS reminders",
        "Digital prescriptions and lab test requests printing",
        "Doctor revenue share commissions and fee statements",
      ],
    },
    {
      id: "services",
      icon: Briefcase,
      titleAr: "الشركات والخدمات المهنية والاستشارات",
      titleEn: "Professional Services & Consulting",
      taglineAr: "عقود الخدمات، الساعات القابلة للفوترة، خطابات التكليف، وربط المصروفات بالمشروعات.",
      taglineEn: "Client contracts, billable hours, engagement letters, and cost-center project profitability.",
      descAr: "صُممت لمكاتب المحاسبة، الاستشارات، شركات البرمجيات، ووكالات الدعاية لتتبع ربحية المشروعات بدقة واحتساب الساعات المستحقة وإصدار المطالبات الدورية.",
      descEn: "Tailored for consulting, law firms, software agencies, and professional practices to track project profitability and billable client retainers.",
      metricsAr: [
        { label: "تتبع الساعات", value: "دقيق لحظياً" },
        { label: "أرباح المشروعات", value: "كشف فوري" },
        { label: "إصدار المطالبات", value: "دوري آلي" },
      ],
      metricsEn: [
        { label: "Time Tracking", value: "Precision live" },
        { label: "Project P&L", value: "Real-time" },
        { label: "Retainer Invoicing", value: "Automated" },
      ],
      featuresAr: [
        "تسجيل ساعات عمل الاستشاريين القابلة للفوترة",
        "إدارة العقود والمطالبات المالية الدورية التلقائية",
        "تحليل ربحية كل مشروع وكل عميل على حدة",
        "إدارة مهام الفريق وتوزيع المسؤوليات بنظام كانبان",
      ],
      featuresEn: [
        "Billable consultant time and timesheet approvals",
        "Recurring service contracts and retainer management",
        "Granular project and client profitability analytics",
        "Team task assignment and Kanban milestone boards",
      ],
    },
  ];

  const currentInd = industries.find((i) => i.id === activeTab) || industries[0];

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-20 space-y-16 sm:space-y-24 bg-[#FAF6F0] text-[#262321]">
        {/* 1. Hero Header matching Image 4 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DECFC0] bg-[#FAF0E4] px-4 py-1.5 text-xs font-semibold text-[#651E2C]">
            <Layers className="h-3.5 w-3.5" />
            <span>{isAr ? "حلول متخصصة لكل نشاط" : "Domain-Specific Solutions"}</span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-normal text-[#262321] tracking-tight max-w-4xl mx-auto leading-tight ${
              isAr ? "font-serif-ar" : "font-serif-en"
            }`}
          >
            {isAr
              ? "حلول مخصصة لكل قطاع"
              : "Tailored Solutions for Every Industry"}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#77716E] leading-relaxed">
            {isAr
              ? "لا تفرض عليك ميزان قالباً واحداً جامداً؛ بل تتشكل شاشاتها ووحداتها لتلائم طبيعة أعمال قطاعك بدقة متناهية."
              : "Mizan adapts to your domain workflows instead of forcing your business into rigid generic templates."}
          </p>
        </div>

        {/* 2. Photographic Industry Cards Grid matching Image 4 (Row 1, Screen 5) */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {industries.map((ind) => {
              const Icon = ind.icon;
              const isSelected = activeTab === ind.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => setActiveTab(ind.id)}
                  className={`p-4 sm:p-5 rounded-3xl border text-center transition-all flex flex-col items-center justify-center gap-3 ${
                    isSelected
                      ? "bg-[#FFFFFF] border-[#651E2C] shadow-lg ring-1 ring-[#651E2C] -translate-y-1"
                      : "bg-[#FFFFFF]/70 border-[#DECFC0] hover:bg-[#FFFFFF] hover:border-[#B86B76]"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                      isSelected
                        ? "bg-[#651E2C] text-[#FAF6F0]"
                        : "bg-[#FAF0E4] text-[#651E2C]"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-[#262321] leading-tight">
                    {isAr ? ind.titleAr.split("و")[0] : ind.titleEn.split(",")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Selected Industry Deep Dive Section matching Image 4 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#DECFC0] bg-[#FFFFFF] p-8 sm:p-12 shadow-xl space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4 text-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0E4] text-[#651E2C]">
                    {(() => {
                      const IndIcon = currentInd.icon;
                      return <IndIcon className="h-6 w-6 text-[#651E2C]" />;
                    })()}
                  </div>
                  <div>
                    <h2
                      className={`text-2xl sm:text-3xl font-bold text-[#262321] ${
                        isAr ? "font-serif-ar" : "font-serif-en text-3xl font-normal"
                      }`}
                    >
                      {isAr ? currentInd.titleAr : currentInd.titleEn}
                    </h2>
                    <p className="text-xs font-semibold text-[#651E2C] mt-0.5">
                      {isAr ? currentInd.taglineAr : currentInd.taglineEn}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#55504D] leading-relaxed pt-2">
                  {isAr ? currentInd.descAr : currentInd.descEn}
                </p>

                {/* Features Checkmarks */}
                <div className="pt-4 border-t border-[#E6DCD2] space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#77716E]">
                    {isAr ? "المزايا الميدانية المخصصة للقطاع" : "Key Specialized Features"}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#262321]">
                    {(isAr ? currentInd.featuresAr : currentInd.featuresEn).map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#27835C] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metrics & CTA Box (5 Cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-[#DECFC0] bg-[#FAF0E4]/70 p-6 space-y-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#77716E] border-b border-[#DECFC0] pb-2">
                  {isAr ? "أثر المنظومة بالأرقام" : "Measurable Business Impact"}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {(isAr ? currentInd.metricsAr : currentInd.metricsEn).map((m, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-base sm:text-lg font-bold font-mono text-[#651E2C]">
                        {m.value}
                      </div>
                      <div className="text-[11px] text-[#77716E] leading-tight">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    size="lg"
                    className="w-full bg-[#651E2C] hover:bg-[#521723] text-[#FAF6F0] rounded-full text-xs font-semibold py-3 shadow-md"
                    render={<Link to="/signup" />}
                    nativeButton={false}
                  >
                    <span>{isAr ? "تفعيل حزمة هذا القطاع" : "Activate This Industry Suite"}</span>
                    {isAr ? <ArrowLeft className="h-3.5 w-3.5 ms-2" /> : <ArrowRight className="h-3.5 w-3.5 ms-2" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Support Strip */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2
            className={`text-2xl sm:text-3xl font-normal text-[#262321] ${
              isAr ? "font-serif-ar" : "font-serif-en"
            }`}
          >
            {isAr ? "هل يتبع نشاطك قطاعاً مخصصاً آخر؟" : "Have a Custom Enterprise Vertical?"}
          </h2>
          <p className="text-xs sm:text-sm text-[#77716E]">
            {isAr
              ? "فريق مهندسي ميزان جاهز لتخصيص الوحدات ونماذج الفواتير وحقول البيانات وفقاً للوائح نشاطك الدقيقة."
              : "Our solutions architects can configure bespoke modules, workflows, and custom forms for your unique industry."}
          </p>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#651E2C] hover:underline"
            >
              <span>{isAr ? "تواصل مع مستشار الحلول" : "Speak to an Industry Specialist"}</span>
              {isAr ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
