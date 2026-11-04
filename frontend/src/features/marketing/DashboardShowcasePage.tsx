import { useState } from "react";
import {
  Sun,
  Moon,
  Sparkles,
  Printer,
  Search,
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  CreditCard,
  FileText,
  ScanLine,
  BarChart3,
  Settings,
  Bell,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { MarketingLayout } from "./MarketingLayout";
import { Button } from "@/components/kit/button";
import { useTranslation } from "@/i18n";
import { MizanLogo } from "@/components/MizanLogo";
import { motion } from "motion/react";
import { MizanMagnetic } from "@/components/motion/MizanMagnetic";
import { toast } from "sonner";

export default function DashboardShowcasePage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [printedReceipt, setPrintedReceipt] = useState(false);

  const isLight = themeMode === "light";

  const kpis = [
    {
      titleAr: "إجمالي المبيعات",
      titleEn: "Total Revenue",
      value: "$128,450",
      change: "+12.4%",
      isPositive: true,
    },
    {
      titleAr: "الطلبات المكتملة",
      titleEn: "Completed Orders",
      value: "1,284",
      change: "+8.1%",
      isPositive: true,
    },
    {
      titleAr: "نسبة دقة المخزون",
      titleEn: "Inventory Accuracy",
      value: "98.7%",
      change: "+0.5%",
      isPositive: true,
    },
  ];

  const transactions = [
    {
      id: "INV-94021",
      customerAr: "شركة الأهرام للمقاولات والتوريدات",
      customerEn: "Al-Ahram Contracting Ltd.",
      flag: "🇪🇬",
      amount: "$42,500",
      methodAr: "تحويل بنكي فوري",
      methodEn: "Direct Bank Transfer",
      status: "completed",
      dateAr: "اليوم، 11:42 ص",
      dateEn: "Today, 11:42 AM",
    },
    {
      id: "INV-94020",
      customerAr: "مؤسسة الدلتا لمواد البناء الحديث",
      customerEn: "Delta Modern Building Supplies",
      flag: "🇸🇦",
      amount: "$18,300",
      methodAr: "بطاقة ائتمانية",
      methodEn: "Credit Card (Visa)",
      status: "completed",
      dateAr: "اليوم، 10:15 ص",
      dateEn: "Today, 10:15 AM",
    },
    {
      id: "INV-94019",
      customerAr: "معرض الوفاء للتجهيزات والتشطيب",
      customerEn: "Al-Wafaa Finishing Depo",
      flag: "🇦🇪",
      amount: "$76,800",
      methodAr: "أجل (30 يوم)",
      methodEn: "Credit Net 30",
      status: "pending",
      dateAr: "أمس، 04:30 م",
      dateEn: "Yesterday, 04:30 PM",
    },
  ];

  const handlePrintTest = () => {
    setPrintedReceipt(true);
    toast.success(
      isAr
        ? "تم إرسال نبضة الطباعة الحرارية المباشرة بنجاح!"
        : "Thermal receipt printed with native ESC/POS pulse!"
    );
    setTimeout(() => setPrintedReceipt(false), 3000);
  };

  const navMenuItems = [
    { id: "dash", labelAr: "لوحة التحكم", labelEn: "Dashboard", icon: LayoutDashboard, active: true },
    { id: "sales", labelAr: "المبيعات", labelEn: "Sales", icon: ShoppingBag },
    { id: "inventory", labelAr: "المخزون", labelEn: "Inventory", icon: Boxes },
    { id: "finance", labelAr: "الخزينة والسيولة", labelEn: "Treasury & Cash", icon: CreditCard },
    { id: "invoices", labelAr: "الفواتير الضريبية", labelEn: "Tax Invoices", icon: FileText },
    { id: "pos", labelAr: "نقاط البيع (POS)", labelEn: "POS Cashier", icon: ScanLine },
    { id: "reports", labelAr: "التحليلات", labelEn: "Analytics", icon: BarChart3 },
    { id: "settings", labelAr: "الإعدادات", labelEn: "Settings", icon: Settings },
  ];

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-20 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header Controls & Mode Toggle */}
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white px-4 py-1.5 text-xs font-semibold text-[#651E2C] shadow-xs">
              <Sparkles className="size-3.5 text-[#B86B76]" />
              <span>{isAr ? "معاينة النظام الحي التفاعلية" : "Interactive Live ERP Environment"}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-[#262321] leading-tight">
              {isAr ? (
                <>
                  شاهد بيئة العمل الحقيقية <br />
                  <span className="italic text-[#651E2C]">بالنمطين الفاتح والداكن (Pixel Match)</span>
                </>
              ) : (
                <>
                  Experience the live platform <br />
                  <span className="italic text-[#651E2C]">in Light & Dark Modes</span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-xs sm:text-sm text-[#77716E] leading-relaxed">
              {isAr
                ? "انقر للتبديل بين النمط العاجي الفاتح (Warm Ivory) ونمط المرلوت الليلي (Deep Merlot) لمطابقة شاشتي 15 و 16 في المنظومة."
                : "Toggle between Warm Ivory (Light) and Deep Merlot (Dark) to view the live responsive interface matching Screens 15 & 16."}
            </p>

            {/* Light / Dark Mode Toggle Buttons */}
            <div className="pt-2 flex justify-center items-center gap-3">
              <div className="relative inline-flex items-center rounded-full border border-[#E7D6C1] bg-white p-1.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setThemeMode("light")}
                  className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                    isLight
                      ? "text-white"
                      : "text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  {isLight && (
                    <motion.div
                      layoutId="dashThemeTogglePill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#651E2C] shadow-xs z-[-1]"
                    />
                  )}
                  <Sun className="size-3.5" />
                  <span>{isAr ? "النمط الفاتح (Light)" : "Warm Ivory (Light)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                    !isLight
                      ? "text-white"
                      : "text-[#77716E] hover:text-[#262321]"
                  }`}
                >
                  {!isLight && (
                    <motion.div
                      layoutId="dashThemeTogglePill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#35151D] shadow-xs z-[-1]"
                    />
                  )}
                  <Moon className="size-3.5" />
                  <span>{isAr ? "النمط الداكن (Dark)" : "Deep Merlot (Dark)"}</span>
                </button>
              </div>

              <MizanMagnetic>
                <Button
                  size="sm"
                  onClick={handlePrintTest}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    isLight
                      ? "border border-[#E7D6C1] bg-white text-[#262321] hover:bg-[#FAF6F0]"
                      : "border border-white/20 bg-[#35151D] text-white hover:bg-[#521723]"
                  }`}
                >
                  <Printer className="size-3.5 me-1.5" />
                  <span>{printedReceipt ? (isAr ? "تم إرسال النبضة!" : "Pulsed!") : isAr ? "طباعة تجريبية" : "Test Print"}</span>
                </Button>
              </MizanMagnetic>
            </div>
          </div>

          {/* 2. Interactive ERP Frame matching Screens 15 & 16 */}
          <div
            className={`rounded-3xl border transition-all duration-500 overflow-hidden shadow-2xl flex flex-col md:flex-row ${
              isLight
                ? "border-[#E7D6C1] bg-[#FAF6F0] text-[#262321]"
                : "border-[#4A1D27] bg-[#1E0C11] text-[#FAF6F0]"
            }`}
          >
            {/* Left/Sidebar Navigation Rail (Deep Merlot) matching Screen 15 & 16 */}
            <aside
              className={`w-full md:w-64 p-5 flex flex-col justify-between shrink-0 transition-colors ${
                isLight ? "bg-[#35151D] text-white" : "bg-[#270F16] text-white border-e border-[#4A1D27]"
              }`}
            >
              <div className="space-y-6">
                {/* Logo & Workspace Brand */}
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                  <MizanLogo className="h-8 w-auto text-white" />
                  <div>
                    <span className="font-display text-sm font-bold block text-white">Mizan ERP</span>
                    <span className="text-[10px] text-[#E7D6C1]/80 block font-mono">v3.0 Production</span>
                  </div>
                </div>

                {/* Navigation Menu Items */}
                <nav className="space-y-1">
                  {navMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          item.active
                            ? "bg-[#651E2C] text-white shadow-xs font-bold"
                            : "text-[#E7D6C1]/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{isAr ? item.labelAr : item.labelEn}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom User Profile */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-3 text-xs">
                <div className="size-9 rounded-full bg-[#651E2C] border border-[#B86B76] flex items-center justify-center font-bold text-white text-[11px]">
                  TM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate text-xs">
                    {isAr ? "د. طارق المنشاوي" : "Dr. Tarek M."}
                  </div>
                  <div className="text-[10px] text-[#E7D6C1]/70 font-mono">Admin • Cairo Hub</div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-hidden">
              {/* Top Search & Chrome Bar */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E7D6C1]/40">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-[#77716E]" />
                  <input
                    type="text"
                    readOnly
                    value=""
                    placeholder={isAr ? "بحث في النظام، الفواتير، والعملاء..." : "Search system, invoices, customers..."}
                    className={`w-full rounded-full border px-10 py-2 text-xs transition-colors ${
                      isLight
                        ? "border-[#E7D6C1] bg-white text-[#262321] placeholder-[#77716E]"
                        : "border-[#4A1D27] bg-[#2E121B] text-white placeholder-white/40"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono ${
                    isLight ? "bg-[#27835C]/10 text-[#27835C]" : "bg-[#27835C]/20 text-emerald-400"
                  }`}>
                    <span className="size-2 rounded-full bg-[#27835C] animate-pulse" />
                    <span>{isAr ? "متصل سحابياً" : "Live Sync"}</span>
                  </span>
                  <div className={`p-2 rounded-full border ${isLight ? "border-[#E7D6C1] bg-white text-[#77716E]" : "border-[#4A1D27] bg-[#2E121B] text-white/70"}`}>
                    <Bell className="size-4" />
                  </div>
                </div>
              </div>

              {/* 1. Three Top Metric Cards ($128,450 / 1,284 / 98.7%) matching Screen 15 & 16 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {kpis.map((kpi, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-5 border transition-all shadow-xs space-y-2 ${
                      isLight
                        ? "bg-white border-[#E7D6C1]"
                        : "bg-[#270F16] border-[#4A1D27]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#77716E]">
                      <span>{isAr ? kpi.titleAr : kpi.titleEn}</span>
                      <span className="font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {kpi.change}
                      </span>
                    </div>
                    <div className="font-display text-3xl font-normal font-mono text-[#262321] dark:text-white">
                      {kpi.value}
                    </div>
                    <div className="text-[11px] text-[#77716E]">
                      {isAr ? "مقارنة بالشهر السابق" : "vs. previous month"}
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Middle Row: Revenue Spline Chart (65%) + Donut Chart (35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Spline Chart with Red Dot Nodes */}
                <div
                  className={`lg:col-span-8 rounded-2xl p-6 border shadow-xs space-y-4 ${
                    isLight ? "bg-white border-[#E7D6C1]" : "bg-[#270F16] border-[#4A1D27]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl font-normal text-[#262321] dark:text-white">
                        {isAr ? "منحنى نمو المبيعات الشهرية" : "Monthly Revenue Spline Curve"}
                      </h3>
                      <p className="text-xs text-[#77716E]">
                        {isAr ? "تحليل التدفق النقدي والإيراد عبر جميع الفروع" : "Cashflow and revenue trend across all branches"}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#651E2C] dark:text-[#D4626E] bg-[#651E2C]/10 dark:bg-[#D4626E]/10 px-3 py-1 rounded-full">
                      2026 Q4
                    </span>
                  </div>

                  {/* Spline SVG Chart with Node Dots */}
                  <div className="h-48 w-full pt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="splineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C14E50" stopOpacity={isLight ? 0.3 : 0.4} />
                          <stop offset="100%" stopColor="#C14E50" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d="M 20,130 C 80,100 120,110 180,75 C 240,40 300,90 360,50 C 420,20 450,40 480,25 L 480,150 L 20,150 Z"
                        fill="url(#splineGrad)"
                      />

                      {/* Curve Stroke */}
                      <path
                        d="M 20,130 C 80,100 120,110 180,75 C 240,40 300,90 360,50 C 420,20 450,40 480,25"
                        fill="none"
                        stroke={isLight ? "#651E2C" : "#D4626E"}
                        strokeWidth="3"
                      />

                      {/* Red Node Dots matching Screen 15 & 16 */}
                      <circle cx="20" cy="130" r="5" fill="#C14E50" stroke="#FFF" strokeWidth="2" />
                      <circle cx="100" cy="105" r="5" fill="#C14E50" stroke="#FFF" strokeWidth="2" />
                      <circle cx="180" cy="75" r="5" fill="#C14E50" stroke="#FFF" strokeWidth="2" />
                      <circle cx="260" cy="65" r="5" fill="#C14E50" stroke="#FFF" strokeWidth="2" />
                      <circle cx="360" cy="50" r="5" fill="#C14E50" stroke="#FFF" strokeWidth="2" />
                      <circle cx="480" cy="25" r="5" fill="#C14E50" stroke="#FFF" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#77716E] pt-2 border-t border-[#E7D6C1]/40 font-mono">
                    <span>يناير ($20k)</span>
                    <span>فبراير ($45k)</span>
                    <span>مارس ($68k)</span>
                    <span>أبريل ($82k)</span>
                    <span>مايو ($95k)</span>
                    <span>يونيو ($128k)</span>
                  </div>
                </div>

                {/* Donut Chart matching Screen 15 & 16 */}
                <div
                  className={`lg:col-span-4 rounded-2xl p-6 border shadow-xs space-y-4 flex flex-col justify-between ${
                    isLight ? "bg-white border-[#E7D6C1]" : "bg-[#270F16] border-[#4A1D27]"
                  }`}
                >
                  <div>
                    <h3 className="font-display text-xl font-normal text-[#262321] dark:text-white">
                      {isAr ? "قنوات البيع" : "Sales Channels"}
                    </h3>
                    <p className="text-xs text-[#77716E]">
                      {isAr ? "توزيع الإيراد حسب المصدر" : "Revenue share by origin"}
                    </p>
                  </div>

                  {/* Circular Donut SVG */}
                  <div className="flex items-center justify-center py-4">
                    <svg className="size-36" viewBox="0 0 100 100">
                      {/* Segment 1: Burgundy (60%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#651E2C"
                        strokeWidth="16"
                        strokeDasharray="145 240"
                        strokeDashoffset="0"
                      />
                      {/* Segment 2: Rose (25%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#B86B76"
                        strokeWidth="16"
                        strokeDasharray="60 240"
                        strokeDashoffset="-145"
                      />
                      {/* Segment 3: Coral (15%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#D4626E"
                        strokeWidth="16"
                        strokeDasharray="35 240"
                        strokeDashoffset="-205"
                      />
                    </svg>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#651E2C]" />
                        <span>{isAr ? "نقاط البيع المباشرة (POS)" : "In-store POS"}</span>
                      </div>
                      <span className="font-mono font-bold">60%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#B86B76]" />
                        <span>{isAr ? "طلبات التوريد والجملة" : "Wholesale B2B"}</span>
                      </div>
                      <span className="font-mono font-bold">25%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#D4626E]" />
                        <span>{isAr ? "المتجر الإلكتروني" : "Online Storefront"}</span>
                      </div>
                      <span className="font-mono font-bold">15%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Bottom Row: Recent Transactions Table matching Screen 15 & 16 */}
              <div
                className={`rounded-2xl p-6 border shadow-xs space-y-4 ${
                  isLight ? "bg-white border-[#E7D6C1]" : "bg-[#270F16] border-[#4A1D27]"
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#E7D6C1]/40 pb-3">
                  <h3 className="font-display text-lg font-normal text-[#262321] dark:text-white">
                    {isAr ? "آخر المعاملات المالية المعتمدة" : "Recent Authorized Transactions"}
                  </h3>
                  <span className="text-xs text-[#77716E] font-mono">
                    {isAr ? "إجمالي المعاملات اليوم: 42" : "Total today: 42 operations"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs border-collapse">
                    <thead>
                      <tr className="text-[#77716E] border-b border-[#E7D6C1]/40 text-[11px] font-bold">
                        <th className="py-2.5 px-3 text-start">{isAr ? "العميل" : "Customer"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "رقم الفاتورة" : "Invoice ID"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "طريقة الدفع" : "Method"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "التاريخ" : "Timestamp"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7D6C1]/30">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-medium">
                            <span className="me-2">{tx.flag}</span>
                            <span>{isAr ? tx.customerAr : tx.customerEn}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#651E2C] dark:text-[#D4626E]">
                            {tx.id}
                          </td>
                          <td className="py-3 px-3 text-[#77716E]">
                            {isAr ? tx.methodAr : tx.methodEn}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#262321] dark:text-white">
                            {tx.amount}
                          </td>
                          <td className="py-3 px-3">
                            {tx.status === "completed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-[#27835C] border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="size-3" />
                                <span>{isAr ? "مكتمل" : "Completed"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-[#C58A35] border border-amber-200 dark:border-amber-800">
                                <Clock className="size-3" />
                                <span>{isAr ? "قيد التسوية" : "Pending"}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#77716E] font-mono text-[11px]">
                            {isAr ? tx.dateAr : tx.dateEn}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>

        </div>
      </div>
    </MarketingLayout>
  );
}
