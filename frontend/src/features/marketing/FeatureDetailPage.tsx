import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { MizanMagnetic } from "@/components/motion/MizanMagnetic";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Bell,
  Sliders,
} from "lucide-react";
import { MarketingLayout } from "./MarketingLayout";
import { Button } from "@/components/kit/button";
import { useTranslation } from "@/i18n";
import { assetUrl } from "@/lib/utils";

interface InventoryItem {
  code: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  warehouseAr: string;
  warehouseEn: string;
  qty: number;
  unitAr: string;
  unitEn: string;
  status: "optimal" | "low" | "critical";
  sparkline: number[];
}

export default function FeatureDetailPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const shouldReduceMotion = useReducedMotion();

  const [activeFilter, setActiveFilter] = useState<"all" | "low" | "critical">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const sampleInventory: InventoryItem[] = [
    {
      code: "PRD-101",
      nameAr: "أسمنت بورتلاندي ممتاز 50 كجم",
      nameEn: "Portland Premium Cement 50kg",
      categoryAr: "مواد بناء أساسية",
      categoryEn: "Basic Materials",
      warehouseAr: "مستودع القاهرة المركزي",
      warehouseEn: "Cairo Central Hub",
      qty: 1420,
      unitAr: "شيكارة",
      unitEn: "bags",
      status: "optimal",
      sparkline: [40, 52, 60, 58, 72, 85, 90],
    },
    {
      code: "PRD-102",
      nameAr: "حديد تسليح مشرشر 12 مم — عز",
      nameEn: "Deformed Rebar 12mm — Ezz",
      categoryAr: "معادن وتشييد",
      categoryEn: "Metals & Rebar",
      warehouseAr: "مستودع العاشر من رمضان",
      warehouseEn: "10th of Ramadan Yard",
      qty: 850,
      unitAr: "طن",
      unitEn: "tons",
      status: "optimal",
      sparkline: [65, 70, 68, 75, 80, 78, 88],
    },
    {
      code: "PRD-103",
      nameAr: "طوب طفلي أحمر قياسي 25×12×6",
      nameEn: "Standard Red Clay Brick 25x12x6",
      categoryAr: "طوب وبلوكات",
      categoryEn: "Bricks & Blocks",
      warehouseAr: "مستودع الجيزة الجنوبي",
      warehouseEn: "South Giza Depot",
      qty: 24500,
      unitAr: "طوبة",
      unitEn: "bricks",
      status: "optimal",
      sparkline: [50, 48, 55, 62, 59, 70, 74],
    },
    {
      code: "PRD-104",
      nameAr: "دهانات داخلية مطفية 20 لتر",
      nameEn: "Interior Matte Paint 20L",
      categoryAr: "تشطيبات وديكور",
      categoryEn: "Finishing & Paints",
      warehouseAr: "مستودع القاهرة المركزي",
      warehouseEn: "Cairo Central Hub",
      qty: 18,
      unitAr: "جردل",
      unitEn: "pails",
      status: "low",
      sparkline: [80, 65, 50, 42, 35, 25, 18],
    },
    {
      code: "PRD-105",
      nameAr: "مواسير تغذية مياه PVC 1 بوصة ضغط 16",
      nameEn: "PVC Pressure Water Pipes 1\" 16bar",
      categoryAr: "سباكة وصحي",
      categoryEn: "Plumbing Supplies",
      warehouseAr: "مستودع العاشر من رمضان",
      warehouseEn: "10th of Ramadan Yard",
      qty: 320,
      unitAr: "ماسورة",
      unitEn: "pipes",
      status: "optimal",
      sparkline: [45, 50, 52, 60, 65, 75, 82],
    },
    {
      code: "PRD-106",
      nameAr: "أسلاك نحاسية معزولة 2.5 مم لفات 100م",
      nameEn: "Insulated Copper Wire 2.5mm 100m",
      categoryAr: "كهرباء وإنارة",
      categoryEn: "Electrical Cables",
      warehouseAr: "مستودع القاهرة المركزي",
      warehouseEn: "Cairo Central Hub",
      qty: 4,
      unitAr: "لفة",
      unitEn: "rolls",
      status: "critical",
      sparkline: [70, 55, 45, 30, 20, 10, 4],
    },
  ];

  const filteredItems = sampleInventory.filter((item) => {
    if (activeFilter === "low" && item.status !== "low") return false;
    if (activeFilter === "critical" && item.status !== "critical") return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = isAr ? item.nameAr.toLowerCase().includes(q) : item.nameEn.toLowerCase().includes(q);
      const matchCode = item.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const steps = [
    {
      step: 1,
      icon: Sliders,
      titleAr: "الضبط والتهيئة",
      titleEn: "Configuration & Setup",
      descAr: "تهيئة المستودعات، تعريف الأصناف والباركود، وربط مستويات التكلفة وحدود إعادة الطلب الآلي.",
      descEn: "Configure warehouses, barcodes, automated safety reorder thresholds, and unit of measure matrices.",
    },
    {
      step: 2,
      icon: RefreshCw,
      titleAr: "الربط المباشر مع نقاط البيع",
      titleEn: "Instant Cashier Sync",
      descAr: "حسم فوري للأرصدة مع كل فاتورة بيع صادرة، وتحديث لحظي لدفتر المخزن بدون تأخير أو أخطاء بشرية.",
      descEn: "Real-time stock deduction upon POS transaction checkout with zero delay across branches.",
    },
    {
      step: 3,
      icon: Bell,
      titleAr: "التنبؤ الذكي وإعادة الطلب",
      titleEn: "Smart Forecasting & Alerts",
      descAr: "تنبيهات استباقية بالكميات المنخفضة، وتحليل معدلات الاستهلاك، وتوليد أوامر شراء مؤتمتة للموردين.",
      descEn: "Proactive depletion alerts, consumption burn velocity analytics, and auto-generated supplier POs.",
    },
  ];

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-20 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
          
          {/* 1. Hero Section matching Screen 4 (04_feature_details.png) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Right/Start Column: Text Content */}
            <div className="lg:col-span-7 space-y-6 text-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white px-3.5 py-1 text-xs font-semibold text-[#651E2C] shadow-xs">
                <span className="size-2 rounded-full bg-[#651E2C]" />
                <span>{isAr ? "الوحدة الأساسية — إدارة المخزون والمستودعات" : "Core Module — WMS & Inventory"}</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-tight">
                {isAr ? (
                  <>
                    إدارة المخزون <br />
                    <span className="italic text-[#651E2C]">تحكم كامل في مواردك بدقة متناهية</span>
                  </>
                ) : (
                  <>
                    Inventory Control <br />
                    <span className="italic text-[#651E2C]">Total precision across your warehouses</span>
                  </>
                )}
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-[#77716E] font-body leading-relaxed">
                {isAr
                  ? "تحكم كامل في مخزونك، وتحقيق أفضل استغلال للموارد مع تتبع دقيق للأرصدة عبر المستودعات والفروع وتنبيهات إعادة الطلب الفورية."
                  : "Complete command of multi-branch stock levels, automated safety reorder points, lot tracking, and warehouse optimization."}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <MizanMagnetic>
                  <Button
                    nativeButton={false}
                    render={<Link to="/signup" />}
                    size="lg"
                    className="rounded-xl bg-[#651E2C] px-7 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#521723] transition-all"
                  >
                    <span>{isAr ? "ابدأ تجربة مجانية" : "Start Free Trial"}</span>
                    <ArrowIcon className="size-4 ms-2" />
                  </Button>
                </MizanMagnetic>

                <MizanMagnetic>
                  <Button
                    nativeButton={false}
                    render={<Link to="/demo" />}
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-[#E7D6C1] bg-white px-7 py-3.5 text-xs font-bold text-[#262321] hover:bg-[#FAF6F0] transition-all shadow-xs"
                  >
                    <span>{isAr ? "شاهد المعاينة الحية" : "Live Demo"}</span>
                  </Button>
                </MizanMagnetic>
              </div>
            </div>

            {/* Left/End Column: Arched Architectural Photo */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-[4/5] rounded-t-[140px] rounded-b-3xl overflow-hidden border border-[#E7D6C1] shadow-2xl bg-[#FAF6F0] p-1.5">
                <div className="w-full h-full rounded-t-[136px] rounded-b-[22px] overflow-hidden relative">
                  <img
                    src={assetUrl("assets/marketing/feature-detail-arch.jpg")}
                    alt={isAr ? "إدارة المخزون — ميزان" : "Mizan Inventory Management"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#35151D]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 start-6 end-6 text-white text-start">
                    <span className="text-[11px] font-bold text-[#E7D6C1] uppercase tracking-wider block">
                      {isAr ? "المرونة والتحكم" : "Flexibility & Control"}
                    </span>
                    <span className="font-display text-lg font-normal text-white">
                      {isAr ? "جاهزية فورية لآلاف الأصناف والباركود" : "Enterprise Grade WMS Architecture"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Central Feature Data Mockup Card matching Screen 4 */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-[#E7D6C1] bg-white p-6 sm:p-8 shadow-xl space-y-6"
          >
            {/* Mockup Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7D6C1] pb-6">
              {/* Search Bar with Icon */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-[#77716E]" />
                <input
                  type="text"
                  placeholder={isAr ? "بحث في الأصناف والباركود والكود..." : "Search items, SKU, or barcode..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] ps-10 pe-4 py-2.5 text-xs text-[#262321] placeholder-[#77716E] focus:outline-hidden focus:border-[#651E2C] transition-all"
                />
              </div>

              {/* Filter Pills with sliding layoutId indicator */}
              <div className="relative flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    activeFilter === "all"
                      ? "text-white"
                      : "bg-[#FAF6F0] border border-[#E7D6C1] text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  {activeFilter === "all" && (
                    <motion.div
                      layoutId="featureFilterPill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#651E2C] shadow-xs z-[-1]"
                    />
                  )}
                  <span>{isAr ? "الكل (842)" : "All (842)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("low")}
                  className={`relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    activeFilter === "low"
                      ? "text-white"
                      : "bg-[#FAF6F0] border border-[#E7D6C1] text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  {activeFilter === "low" && (
                    <motion.div
                      layoutId="featureFilterPill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#651E2C] shadow-xs z-[-1]"
                    />
                  )}
                  <span>{isAr ? "منخفض المخزون (14)" : "Low Stock (14)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("critical")}
                  className={`relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    activeFilter === "critical"
                      ? "text-white"
                      : "bg-[#FAF6F0] border border-[#E7D6C1] text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  {activeFilter === "critical" && (
                    <motion.div
                      layoutId="featureFilterPill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#651E2C] shadow-xs z-[-1]"
                    />
                  )}
                  <span>{isAr ? "نفذت الكمية (3)" : "Critical / Out (3)"}</span>
                </button>
              </div>
            </div>

            {/* Inventory Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7D6C1] text-[#77716E] text-[11px] font-bold">
                    <th className="py-3 px-4 text-start">{isAr ? "كود الصنف / الاسم" : "SKU & Description"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الفئة / المستودع" : "Category / Yard"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الرصيد الفعلي" : "Available Balance"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الحالة" : "Status"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "معدل السحب (7 أيام)" : "Velocity (7 Days)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7D6C1]/60">
                  {filteredItems.map((item) => (
                    <tr key={item.code} className="hover:bg-[#FAF6F0]/80 transition-colors">
                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#262321]">{isAr ? item.nameAr : item.nameEn}</div>
                        <div className="font-mono text-[11px] text-[#77716E]">{item.code}</div>
                      </td>

                      {/* Category & Yard */}
                      <td className="py-3.5 px-4">
                        <div className="text-[#262321]">{isAr ? item.categoryAr : item.categoryEn}</div>
                        <div className="text-[11px] text-[#77716E]">{isAr ? item.warehouseAr : item.warehouseEn}</div>
                      </td>

                      {/* Available Qty */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-sm font-bold text-[#262321]">
                          {item.qty.toLocaleString()}
                        </span>{" "}
                        <span className="text-[11px] text-[#77716E]">{isAr ? item.unitAr : item.unitEn}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {item.status === "optimal" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#27835C] border border-emerald-200">
                            <span className="size-1.5 rounded-full bg-[#27835C]" />
                            {isAr ? "رصيد كافٍ" : "Optimal"}
                          </span>
                        )}
                        {item.status === "low" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-[#C58A35] border border-amber-200">
                            <span className="size-1.5 rounded-full bg-[#C58A35]" />
                            {isAr ? "منخفض المخزون" : "Low Stock"}
                          </span>
                        )}
                        {item.status === "critical" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[#C14E50] border border-rose-200">
                            <span className="size-1.5 rounded-full bg-[#C14E50]" />
                            {isAr ? "إعادة طلب فورية" : "Critical"}
                          </span>
                        )}
                      </td>

                      {/* Sparkline Curve */}
                      <td className="py-3.5 px-4 w-36">
                        <div className="h-6 w-full">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24">
                            <polyline
                              fill="none"
                              stroke={item.status === "critical" ? "#C14E50" : item.status === "low" ? "#C58A35" : "#651E2C"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={item.sparkline
                                .map((val, idx) => `${idx * 16},${24 - Math.round((val / 100) * 20)}`)
                                .join(" ")}
                            />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Mockup Status Footer */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-[#E7D6C1] text-xs text-[#77716E]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#27835C] animate-pulse" />
                <span>{isAr ? "المزامنة اللحظية مفعلة عبر المستودعات" : "Multi-warehouse real-time sync active"}</span>
              </div>
              <div className="font-mono text-[11px]">
                {isAr ? "إجمالي الأصناف النشطة: 842 صنف" : "Total active SKUs: 842 items"}
              </div>
            </div>
          </motion.div>

          {/* 3. Section: "كيف تعمل الميزة؟" with 3 circular cards matching Screen 4 */}
          <div className="space-y-12 text-center">
            <div className="space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#262321]">
                {isAr ? "كيف تعمل الميزة؟" : "How It Works"}
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#77716E]">
                {isAr
                  ? "ثلاث خطوات محكمة تضمن انسيابية البضائع وحماية رأس المال العامل"
                  : "Three synchronized steps engineered to maximize inventory throughput"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((st) => {
                const Icon = st.icon;
                return (
                  <motion.div
                    key={st.step}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: st.step * 0.1 }}
                    className="flex flex-col items-center text-center space-y-4 rounded-3xl border border-[#E7D6C1] bg-white/60 p-8 shadow-xs hover:bg-white hover:shadow-md transition-all"
                  >
                    {/* Circular Rose Badge with Burgundy Icon */}
                    <div className="flex size-16 items-center justify-center rounded-full bg-[#F5EBDD] border border-[#E7D6C1] text-[#651E2C] shadow-xs">
                      <Icon className="size-7" />
                    </div>

                    <h3 className="font-display text-xl font-normal text-[#262321]">
                      {isAr ? st.titleAr : st.titleEn}
                    </h3>

                    <p className="text-xs text-[#77716E] leading-relaxed max-w-xs">
                      {isAr ? st.descAr : st.descEn}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 4. Bottom Deep Merlot CTA Banner */}
          <div className="relative rounded-3xl bg-[#35151D] p-8 sm:p-12 text-center text-white overflow-hidden shadow-2xl border border-white/10 hero-concentric-arcs">
            <div className="relative z-10 mx-auto max-w-2xl space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#B86B76] font-bold">
                {isAr ? "أتمتة المخازن والمستودعات" : "Intelligent Warehouse Automation"}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-normal text-white">
                {isAr ? "جاهز للارتقاء بإدارة مخزونك باحترافية؟" : "Ready for complete inventory command?"}
              </h2>
              <p className="text-xs sm:text-sm text-[#E7D6C1] leading-relaxed">
                {isAr
                  ? "ابدأ اليوم تجربة ميزان المجانية واختبر المزامنة الفورية لنقاط البيع والمخازن مع دعم كامل لأجهزة الباركود والطباعة الحرارية."
                  : "Deploy Mizan today. Experience instant cashier sync, automatic reorder forecasting, and offline resilience."}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Button
                  nativeButton={false}
                  render={<Link to="/signup" />}
                  size="lg"
                  className="rounded-xl bg-[#651E2C] px-8 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#521723]"
                >
                  <span>{isAr ? "ابدأ تجربة الـ 14 يوماً مجاناً" : "Start 14-Day Free Trial"}</span>
                  <ArrowIcon className="size-4 ms-2" />
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link to="/pricing" />}
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-white/20 bg-white/10 px-8 py-3.5 text-xs font-bold text-white hover:bg-white/20 backdrop-blur-xs"
                >
                  <span>{isAr ? "استعرض باقات الاشتراك" : "View Pricing"}</span>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MarketingLayout>
  );
}
