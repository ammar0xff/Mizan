import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sun,
  Moon,
  Sparkles,
  Printer,
} from "lucide-react";
import { MarketingLayout } from "./MarketingLayout";
import { Button } from "@/components/kit/button";
import { useTranslation } from "@/i18n";
import { BuildingMaterialsPosDemo } from "./components/BuildingMaterialsPosDemo";
import { toast } from "sonner";

export default function DashboardShowcasePage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<"overview" | "pos" | "inventory" | "finance">("overview");
  const [printedReceipt, setPrintedReceipt] = useState(false);

  const isLight = themeMode === "light";

  const kpis = [
    {
      titleAr: "إجمالي إيراد اليوم",
      titleEn: "Today's Gross Revenue",
      value: "EGP 248,750",
      change: "+18.4%",
      isPositive: true,
      spark: [35, 45, 60, 50, 75, 90, 85, 110],
    },
    {
      titleAr: "الفواتير الضريبية المصدرة",
      titleEn: "Tax Invoices Issued",
      value: "1,284",
      change: "+24.8%",
      isPositive: true,
      spark: [20, 30, 45, 40, 60, 70, 95, 120],
    },
    {
      titleAr: "العمليات النقدية والبنكية",
      titleEn: "Treasury Settlements",
      value: "EGP 194,200",
      change: "+12.1%",
      isPositive: true,
      spark: [40, 35, 50, 65, 55, 80, 75, 90],
    },
    {
      titleAr: "سرعة استجابة الكاشير",
      titleEn: "Avg. POS Latency",
      value: "4.8 ms",
      change: "Sub-10ms",
      isPositive: true,
      spark: [8, 6, 5, 6, 5, 4, 5, 4.8],
    },
  ];

  const recentTransactions = [
    {
      id: "INV-94021",
      customerAr: "شركة الأهرام للمقاولات",
      customerEn: "Al-Ahram Contracting Co.",
      itemsAr: "30 شيكارة أسمنت لافارج + 15 سيخ حديد عز",
      itemsEn: "30 Lafarge Cement Bags + 15 Ezz Rebars",
      total: "EGP 42,500",
      statusAr: "مسددة (فوري)",
      statusEn: "Settled (Fawry)",
      time: "منذ 4 دقائق",
    },
    {
      id: "INV-94020",
      customerAr: "مكتب المروة للاستشارات",
      customerEn: "Al-Marwa Engineering Hub",
      itemsAr: "مواسير مياه بوليمر 1 بوصة + محابس برونز",
      itemsEn: "1-inch Polymer Pipes + Bronze Valves",
      total: "EGP 18,300",
      statusAr: "مسددة (فيزا)",
      statusEn: "Settled (Visa)",
      time: "منذ 12 دقيقة",
    },
    {
      id: "INV-94019",
      customerAr: "معرض الوفاء للتجهيزات",
      customerEn: "Al-Wafaa Finishing Depot",
      itemsAr: "سيراميك كليوباترا فرز أول 120 م²",
      itemsEn: "Cleopatra Porcelain Class 1 120 m²",
      total: "EGP 76,800",
      statusAr: "مسددة (نقدي)",
      statusEn: "Settled (Cash)",
      time: "منذ 26 دقيقة",
    },
  ];

  const handlePrintTest = () => {
    setPrintedReceipt(true);
    toast.success(isAr ? "تم إرسال أمر الطباعة الحرارية بنبضة ESC/POS المباشرة!" : "Thermal print command sent with direct ESC/POS pulse!");
    setTimeout(() => setPrintedReceipt(false), 3000);
  };

  return (
    <MarketingLayout>
      <div className="py-16 sm:py-24 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* 1. Header Section */}
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white px-4 py-1.5 text-xs font-semibold text-[#651E2C] shadow-xs">
              <Sparkles className="size-3.5 text-[#B86B76]" />
              <span>{isAr ? "معاينة النظام الحي التفاعلية" : "Interactive Live ERP Environment"}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-tight">
              {isAr ? (
                <>
                  شاهد بيئة العمل الحقيقية <br />
                  <span className="italic text-[#B86B76]">بالنمطين الفاتح والداكن</span>
                </>
              ) : (
                <>
                  Experience the live platform <br />
                  <span className="italic text-[#B86B76]">in both Light & Dark modes</span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base text-[#77716E] font-body leading-relaxed">
              {isAr
                ? "اختر بين النمط الفاتح (العاجي الدافئ Warm Ivory) والنمط الداكن (المرلوت العميق Deep Merlot)، واستكشف مؤشرات الأداء الحية ومحرك نقطة البيع السريع."
                : "Toggle between Warm Ivory (Light) and Deep Merlot (Dark) architectural themes. Test real-time KPIs and offline cashier processing."}
            </p>

            {/* Theme Mode & View Switchers */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              {/* Light / Dark Switcher */}
              <div className="inline-flex items-center rounded-full border border-[#E7D6C1] bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setThemeMode("light")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isLight ? "bg-[#651E2C] text-white shadow-xs" : "text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  <Sun className="size-3.5" />
                  <span>{isAr ? "النمط العاجي (Light)" : "Warm Ivory (Light)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    !isLight ? "bg-[#35151D] text-white shadow-xs" : "text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  <Moon className="size-3.5" />
                  <span>{isAr ? "نمط المرلوت الداكن (Dark)" : "Deep Merlot (Dark)"}</span>
                </button>
              </div>

              {/* Module Feature Switcher */}
              <div className="inline-flex items-center rounded-full border border-[#E7D6C1] bg-white p-1 shadow-xs">
                {[
                  { id: "overview", labelAr: "لوحة التحكم", labelEn: "Overview" },
                  { id: "pos", labelAr: "نقطة البيع (POS)", labelEn: "POS Cashier" },
                  { id: "inventory", labelAr: "المستودع (WMS)", labelEn: "Inventory" },
                  { id: "finance", labelAr: "دفتر الأستاذ (GL)", labelEn: "Ledger" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                      activeTab === t.id
                        ? "bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1] shadow-xs"
                        : "text-[#77716E] hover:text-[#262321]"
                    }`}
                  >
                    {isAr ? t.labelAr : t.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Interactive ERP Frame (Screens 15 & 16) */}
          <div
            className={`rounded-3xl border transition-colors duration-500 overflow-hidden shadow-2xl ${
              isLight
                ? "border-[#E7D6C1] bg-[#FAF6F0] text-[#262321]"
                : "border-[#5E1B28] bg-[#270F16] text-[#FAF6F0]"
            }`}
          >
            {/* Top Workspace Chrome Bar */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${
                isLight ? "border-[#E7D6C1] bg-white" : "border-[#5E1B28] bg-[#1E0C11]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-[#E7D6C1]" />
                  <span className="size-3 rounded-full bg-[#B86B76]/50" />
                  <span className="size-3 rounded-full bg-[#651E2C]/50" />
                </div>
                <div className="h-4 w-px bg-[#E7D6C1]" />
                <span className="font-bold text-xs">
                  {isAr ? "ميزان ERP — مساحة عمل: مؤسسة البناء الحديث للتوريدات" : "Mizan ERP — Workspace: Modern Construction Supplies"}
                </span>
                <span className="rounded-full bg-[#27835C]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#27835C] font-mono">
                  {isAr ? "● متصل سحابياً (RLS مشفر)" : "● Online (RLS Encrypted)"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <Button
                  size="sm"
                  onClick={handlePrintTest}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    isLight
                      ? "bg-[#651E2C] text-white hover:bg-[#521723]"
                      : "bg-[#8A293B] text-white hover:bg-[#A63A4E]"
                  }`}
                >
                  <Printer className="size-3.5 me-1.5" />
                  <span>{printedReceipt ? (isAr ? "تم إرسال النبضة!" : "Pulsed!") : isAr ? "اختبار طباعة 80mm" : "Test 80mm Print"}</span>
                </Button>
              </div>
            </div>

            {/* Inner Dashboard View */}
            <div className="p-6 sm:p-8 space-y-8">
              {activeTab === "pos" ? (
                <BuildingMaterialsPosDemo />
              ) : (
                <>
                  {/* KPI Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {kpis.map((kpi, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl p-5 border transition-all shadow-xs space-y-2 ${
                          isLight
                            ? "bg-white border-[#E7D6C1]"
                            : "bg-[#35151D] border-[#5E1B28]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-[#77716E]">
                          <span>{isAr ? kpi.titleAr : kpi.titleEn}</span>
                          <span className="font-mono text-emerald-600 font-bold">{kpi.change}</span>
                        </div>
                        <div className="font-display text-2xl sm:text-3xl font-normal font-mono">
                          {kpi.value}
                        </div>
                        {/* Mini Sparkline SVG */}
                        <div className="h-6 w-full pt-1">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24">
                            <polyline
                              fill="none"
                              stroke={isLight ? "#27835C" : "#D4626E"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points="0,20 15,16 30,12 45,15 60,8 75,4 90,6 100,2"
                            />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Grid: Revenue Curve + Live Sales Ledger */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Revenue Curve Chart Box */}
                    <div
                      className={`lg:col-span-7 rounded-2xl p-6 border space-y-4 shadow-xs ${
                        isLight ? "bg-white border-[#E7D6C1]" : "bg-[#35151D] border-[#5E1B28]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-xl font-normal">
                            {isAr ? "منحنى نمو الإيراد والسيولة النقدية" : "Revenue Velocity & Liquidity Growth"}
                          </h3>
                          <p className="text-xs text-[#77716E]">
                            {isAr ? "مقارنة الحركات اليومية عبر فروع القاهرة والجيزة" : "Daily transaction comparison across Cairo branches"}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#651E2C] bg-[#651E2C]/10 px-3 py-1 rounded-full">
                          +24.8% YoY
                        </span>
                      </div>

                      {/* Stylized SVG Chart matching mockup */}
                      <div className="h-56 w-full pt-4">
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isLight ? "#651E2C" : "#D4626E"} stopOpacity="0.25" />
                              <stop offset="100%" stopColor={isLight ? "#651E2C" : "#D4626E"} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,160 Q70,120 140,140 T280,70 T420,50 L500,30 L500,200 L0,200 Z"
                            fill="url(#chartGrad)"
                          />
                          <path
                            d="M0,160 Q70,120 140,140 T280,70 T420,50 L500,30"
                            fill="none"
                            stroke={isLight ? "#651E2C" : "#D4626E"}
                            strokeWidth="3"
                          />
                          <circle cx="420" cy="50" r="5" fill={isLight ? "#651E2C" : "#D4626E"} />
                        </svg>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#77716E] pt-2 border-t border-[#E7D6C1]/50 font-mono">
                        <span>السبت</span>
                        <span>الأحد</span>
                        <span>الاثنين</span>
                        <span>الثلاثاء</span>
                        <span>الأربعاء</span>
                        <span>الخميس</span>
                        <span>الجمعة</span>
                      </div>
                    </div>

                    {/* Live Recent Transactions Feed */}
                    <div
                      className={`lg:col-span-5 rounded-2xl p-6 border space-y-4 shadow-xs ${
                        isLight ? "bg-white border-[#E7D6C1]" : "bg-[#35151D] border-[#5E1B28]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-xl font-normal">
                          {isAr ? "آخر الفواتير الضريبية" : "Latest Tax Invoices"}
                        </h3>
                        <span className="text-xs text-emerald-600 font-mono flex items-center gap-1">
                          <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                          Live Sync
                        </span>
                      </div>

                      <div className="space-y-3">
                        {recentTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className={`rounded-xl p-3.5 border transition-colors space-y-1.5 ${
                              isLight
                                ? "bg-[#FAF6F0] border-[#E7D6C1] hover:border-[#651E2C]/50"
                                : "bg-[#270F16] border-[#5E1B28] hover:border-[#D4626E]/50"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold font-mono">{tx.id}</span>
                              <span className="font-mono font-bold text-[#651E2C]">{tx.total}</span>
                            </div>
                            <div className="text-xs font-semibold">{isAr ? tx.customerAr : tx.customerEn}</div>
                            <div className="text-[11px] text-[#77716E] truncate">
                              {isAr ? tx.itemsAr : tx.itemsEn}
                            </div>
                            <div className="flex items-center justify-between pt-1 text-[10px] text-[#77716E] font-mono">
                              <span className="text-emerald-600 font-bold">{isAr ? tx.statusAr : tx.statusEn}</span>
                              <span>{tx.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. Bottom CTA Section */}
          <div className="rounded-3xl bg-[#35151D] p-8 sm:p-12 text-center text-[#F5EBDD] space-y-6 shadow-xl">
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-white">
              {isAr ? "ابدأ إدارة منشأتك على ميزان اليوم" : "Start Operating on Mizan ERP Today"}
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#E7D6C1] leading-relaxed">
              {isAr
                ? "تفعيل فوري خلال دقائق بدون بطاقة ائتمان، مع فترة تجربة مجانية شاملة لكافة الموديولات."
                : "Instant activation in minutes with zero credit card required. Experience all 47 modules for 14 days."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                render={<Link to="/signup" />}
                nativeButton={false}
                size="lg"
                className="bg-[#651E2C] text-white hover:bg-[#8A293B] rounded-full px-6 py-2.5 text-xs font-bold"
              >
                {isAr ? "بدء التجربة المجانية الفورية" : "Start 14-Day Free Trial"}
              </Button>
              <Button
                render={<Link to="/contact" />}
                nativeButton={false}
                size="lg"
                variant="outline"
                className="border-[#E7D6C1]/30 bg-transparent text-[#F5EBDD] hover:bg-white/10 rounded-full px-6 py-2.5 text-xs font-bold"
              >
                {isAr ? "طلب استشارة هندسية" : "Request Architecture Walkthrough"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
