import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Search,
  Bell,
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Briefcase,
  FileText,
  Settings,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { MizanLogo } from "@/components/MizanLogo";
import { assetUrl } from "@/lib/utils";

export function MizanDashboardHeroMockup() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const shouldReduceMotion = useReducedMotion();
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const floatAnim1 = shouldReduceMotion ? undefined : { y: [-4, 6, -4] };
  const floatTrans1 = shouldReduceMotion
    ? undefined
    : { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const };

  const floatAnim2 = shouldReduceMotion ? undefined : { y: [6, -5, 6] };
  const floatTrans2 = shouldReduceMotion
    ? undefined
    : { duration: 5.2, repeat: Infinity, ease: "easeInOut" as const };

  const floatAnim3 = shouldReduceMotion ? undefined : { y: [-5, 5, -5] };
  const floatTrans3 = shouldReduceMotion
    ? undefined
    : { duration: 4.8, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="relative w-full max-w-4xl mx-auto select-none">
      {/* ── FLOATING ELEMENT 1: New Order Received Notification ── */}
      <motion.div
        animate={floatAnim1}
        transition={floatTrans1}
        className={`absolute -top-7 ${
          isAr ? "-start-4 sm:-start-6" : "-start-4 sm:-start-8"
        } z-30 rounded-2xl border border-[#E6DCD2]/80 bg-[#FFFFFF] px-4 py-2.5 shadow-xl flex items-center gap-3 backdrop-blur-sm`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E4] text-[#B86B76]">
          <ShoppingCart className="h-5 w-5 text-[#8A293B]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#262321]">
            {isAr ? "طلب شراء جديد" : "New Order Received"}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#77716E]">
            <Clock className="h-3 w-3" />
            <span>{isAr ? "منذ دقيقتين" : "2 min ago"}</span>
          </div>
        </div>
      </motion.div>

      {/* ── FLOATING ELEMENT 2: Architectural Arches Colonnade Card ── */}
      <motion.div
        animate={floatAnim2}
        transition={floatTrans2}
        className={`hidden sm:block absolute -top-10 ${
          isAr ? "-end-6 sm:-end-10" : "-end-6 sm:-end-10"
        } z-10 w-28 h-32 rounded-2xl overflow-hidden border border-white/20 shadow-2xl`}
      >
        <img
          src={assetUrl("assets/marketing/arch-floating-card.jpg")}
          alt="Mizan Architectural Balance"
          className="w-full h-full object-cover brightness-95 hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback gradient if file not yet loaded
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#35151D]/60 to-transparent" />
      </motion.div>

      {/* ── CENTRAL DASHBOARD FRAME ── */}
      <div className="relative z-20 rounded-2xl sm:rounded-3xl border border-white/15 bg-[#FAF6F0] shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_25px_60px_-15px_rgba(38,14,21,0.5)]">
        {/* Dark ERP Sidebar (#2A1218 / Merlot) */}
        <div className="w-full md:w-56 bg-[#270F16] text-[#E7D6C1] p-3 sm:p-4 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-e border-white/10">
          <div className="space-y-4">
            {/* Sidebar Brand Header */}
            <div className="flex items-center gap-2 px-2 py-1 border-b border-white/10 pb-3">
              <MizanLogo size="sm" variant="icon" theme="dark" />
              <span className={`font-semibold text-sm text-[#FAF6F0] ${isAr ? "font-serif-ar" : "font-serif-en"}`}>
                {isAr ? "ميزان" : "Mizan"}
              </span>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1 text-xs">
              <button
                onClick={() => setActiveMenu("dashboard")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  activeMenu === "dashboard"
                    ? "bg-[#651E2C] text-[#FAF6F0] font-semibold shadow-sm"
                    : "text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0]"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>{isAr ? "لوحة التحكم" : "Dashboard"}</span>
              </button>

              <button
                onClick={() => setActiveMenu("sales")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>{isAr ? "المبيعات" : "Sales"}</span>
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu("purchases")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="h-3.5 w-3.5" />
                  <span>{isAr ? "المشتريات" : "Purchases"}</span>
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu("inventory")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{isAr ? "المخزون" : "Inventory"}</span>
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu("accounting")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isAr ? "المحاسبة" : "Accounting"}</span>
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu("hr")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{isAr ? "الموارد البشرية" : "HR"}</span>
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu("projects")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[#E7D6C1]/75 hover:bg-white/5 hover:text-[#FAF6F0] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{isAr ? "المشاريع" : "Projects"}</span>
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </nav>
          </div>

          <div className="pt-2 border-t border-white/10 hidden md:block">
            <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-[#E7D6C1]/60 hover:text-[#FAF6F0]">
              <Settings className="h-3.5 w-3.5" />
              <span>{isAr ? "الإعدادات" : "Settings"}</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Workspace (Warm Ivory `#FAF6F0`) */}
        <div className="flex-1 p-3 sm:p-5 space-y-4 bg-[#FAF6F0]">
          {/* Top Operational Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-[#E6DCD2] pb-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-3.5 w-3.5 text-[#77716E]" />
              <input
                type="text"
                readOnly
                placeholder={isAr ? "البحث في النظام..." : "Search anything..."}
                className="w-full rounded-full border border-[#DECFC0] bg-[#FFFFFF] py-1.5 ps-9 pe-3 text-xs text-[#262321] placeholder:text-[#77716E]/70 focus:outline-none"
              />
            </div>

            {/* Notification & User Profile */}
            <div className="flex items-center gap-2">
              <button className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF] border border-[#DECFC0] text-[#55504D] hover:bg-[#EFE4D6]">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute top-1 end-1 h-1.5 w-1.5 rounded-full bg-[#651E2C]" />
              </button>

              <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#DECFC0] rounded-full ps-1 pe-2.5 py-0.5">
                <div className="h-6 w-6 rounded-full bg-[#35151D] text-[#FAF6F0] flex items-center justify-center text-[11px] font-bold">
                  A
                </div>
                <span className="text-[11px] font-medium text-[#262321] hidden sm:inline">Ammar</span>
              </div>

              {/* Date Filter Dropdown */}
              <button className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#DECFC0] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-medium text-[#55504D]">
                <span>{isAr ? "آخر 30 يوماً" : "Last 30 Days"}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-semibold text-[#262321]">
              {isAr ? "نظرة عامة على أعمالك" : "Business Overview"}
            </h2>
          </div>

          {/* 3 KPI Stat Cards with SVG Area Sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Card 1: Revenue */}
            <div className="rounded-xl border border-[#E6DCD2] bg-[#FFFFFF] p-3 shadow-xs space-y-1.5">
              <div className="text-[11px] font-medium text-[#77716E]">
                {isAr ? "إجمالي الإيرادات" : "Total Revenue"}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <div className="text-base sm:text-lg font-bold font-mono text-[#262321]">
                  {isAr ? "2,480,750 ج.م" : "EGP 2,480,750"}
                </div>
                <div className="inline-flex items-center text-[10px] font-bold text-[#27835C] bg-[#27835C]/10 px-1.5 py-0.5 rounded-full">
                  ↑ 12.5%
                </div>
              </div>
              {/* Green Area Sparkline SVG */}
              <div className="h-7 w-full pt-1">
                <svg viewBox="0 0 100 25" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                  <path
                    d="M0,20 Q20,10 40,16 T70,8 T100,2 L100,25 L0,25 Z"
                    fill="rgba(39, 131, 92, 0.15)"
                  />
                  <path
                    d="M0,20 Q20,10 40,16 T70,8 T100,2"
                    fill="none"
                    stroke="#27835C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Orders */}
            <div className="rounded-xl border border-[#E6DCD2] bg-[#FFFFFF] p-3 shadow-xs space-y-1.5">
              <div className="text-[11px] font-medium text-[#77716E]">
                {isAr ? "عدد الطلبات" : "Total Orders"}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <div className="text-base sm:text-lg font-bold font-mono text-[#262321]">
                  1,284
                </div>
                <div className="inline-flex items-center text-[10px] font-bold text-[#27835C] bg-[#27835C]/10 px-1.5 py-0.5 rounded-full">
                  ↑ 8.3%
                </div>
              </div>
              {/* Green Sparkline SVG */}
              <div className="h-7 w-full pt-1">
                <svg viewBox="0 0 100 25" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                  <path
                    d="M0,18 Q25,22 45,12 T75,10 T100,3 L100,25 L0,25 Z"
                    fill="rgba(39, 131, 92, 0.15)"
                  />
                  <path
                    d="M0,18 Q25,22 45,12 T75,10 T100,3"
                    fill="none"
                    stroke="#27835C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Active Clients */}
            <div className="rounded-xl border border-[#E6DCD2] bg-[#FFFFFF] p-3 shadow-xs space-y-1.5">
              <div className="text-[11px] font-medium text-[#77716E]">
                {isAr ? "العملاء النشطين" : "Active Clients"}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <div className="text-base sm:text-lg font-bold font-mono text-[#262321]">
                  892
                </div>
                <div className="inline-flex items-center text-[10px] font-bold text-[#27835C] bg-[#27835C]/10 px-1.5 py-0.5 rounded-full">
                  ↑ 10.1%
                </div>
              </div>
              {/* Green Sparkline SVG */}
              <div className="h-7 w-full pt-1">
                <svg viewBox="0 0 100 25" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                  <path
                    d="M0,19 Q30,15 50,18 T80,7 T100,4 L100,25 L0,25 Z"
                    fill="rgba(39, 131, 92, 0.15)"
                  />
                  <path
                    d="M0,19 Q30,15 50,18 T80,7 T100,4"
                    fill="none"
                    stroke="#27835C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Row of 2 Analytics Visuals (Revenue Growth Curve + Donut Chart) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Visual 1: Revenue Growth Spline Chart (7 Cols) */}
            <div className="sm:col-span-7 rounded-xl border border-[#E6DCD2] bg-[#FFFFFF] p-3 sm:p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#262321]">
                <span>{isAr ? "معدل النمو في الإيرادات" : "Revenue Growth"}</span>
                <span className="rounded-full bg-[#270F16] text-[#FAF6F0] px-2 py-0.5 text-[10px] font-mono">
                  +24.8%
                </span>
              </div>

              {/* Spline Area Chart */}
              <div className="relative h-28 w-full pt-2">
                <svg viewBox="0 0 240 70" className="h-full w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenue-spline-grad" x1="0" y1="0" x2="0" y2="70" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#651E2C" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#651E2C" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  <line x1="0" y1="15" x2="240" y2="15" stroke="#E6DCD2" strokeDasharray="3 3" />
                  <line x1="0" y1="35" x2="240" y2="35" stroke="#E6DCD2" strokeDasharray="3 3" />
                  <line x1="0" y1="55" x2="240" y2="55" stroke="#E6DCD2" strokeDasharray="3 3" />

                  {/* Shaded Area */}
                  <path
                    d="M0,52 C35,50 50,38 80,44 C110,50 140,25 170,30 C200,35 215,12 240,8 L240,70 L0,70 Z"
                    fill="url(#revenue-spline-grad)"
                  />

                  {/* Spline Curve */}
                  <path
                    d="M0,52 C35,50 50,38 80,44 C110,50 140,25 170,30 C200,35 215,12 240,8"
                    fill="none"
                    stroke="#651E2C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Nodes */}
                  <circle cx="80" cy="44" r="3" fill="#651E2C" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="170" cy="30" r="3" fill="#651E2C" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="240" cy="8" r="3.5" fill="#D4626E" stroke="#FFFFFF" strokeWidth="1.5" />
                </svg>

                {/* X-axis months */}
                <div className="flex justify-between text-[10px] text-[#77716E] font-mono pt-1">
                  <span>{isAr ? "يناير" : "Jan"}</span>
                  <span>{isAr ? "فبراير" : "Feb"}</span>
                  <span>{isAr ? "مارس" : "Mar"}</span>
                  <span>{isAr ? "أبريل" : "Apr"}</span>
                  <span>{isAr ? "مايو" : "May"}</span>
                  <span>{isAr ? "يونيو" : "Jun"}</span>
                </div>
              </div>
            </div>

            {/* Visual 2: Sales by Sector Donut Chart (5 Cols) */}
            <div className="sm:col-span-5 rounded-xl border border-[#E6DCD2] bg-[#FFFFFF] p-3 sm:p-3.5 space-y-2 flex flex-col justify-between">
              <div className="text-xs font-semibold text-[#262321]">
                {isAr ? "المبيعات حسب القطاع" : "Sales by Sector"}
              </div>

              <div className="flex items-center justify-center gap-3">
                {/* SVG Donut */}
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    {/* Ring Background */}
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#EFE4D6" strokeWidth="4.5" />
                    {/* Retail 42% */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#651E2C"
                      strokeWidth="4.5"
                      strokeDasharray="36.9 88"
                      strokeDashoffset="0"
                    />
                    {/* Services 34% */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#B86B76"
                      strokeWidth="4.5"
                      strokeDasharray="29.9 88"
                      strokeDashoffset="-36.9"
                    />
                    {/* Manufacturing 24% */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#D4626E"
                      strokeWidth="4.5"
                      strokeDasharray="21.1 88"
                      strokeDashoffset="-66.8"
                    />
                  </svg>
                </div>

                {/* Legend */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#262321]">
                    <span className="h-2 w-2 rounded-full bg-[#651E2C]" />
                    <span>{isAr ? "التجزئة 42%" : "Retail 42%"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#55504D]">
                    <span className="h-2 w-2 rounded-full bg-[#B86B76]" />
                    <span>{isAr ? "الخدمات 34%" : "Services 34%"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#77716E]">
                    <span className="h-2 w-2 rounded-full bg-[#D4626E]" />
                    <span>{isAr ? "التصنيع 24%" : "Manufacturing 24%"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING ELEMENT 3: Total Growth Vertical Bar Chart ── */}
      <motion.div
        animate={floatAnim3}
        transition={floatTrans3}
        className={`hidden sm:block absolute -top-4 ${
          isAr ? "-start-10 sm:-start-14" : "-end-10 sm:-end-14"
        } z-30 rounded-2xl border border-[#E6DCD2]/80 bg-[#FFFFFF] p-3.5 shadow-xl backdrop-blur-sm`}
      >
        <div className="text-[11px] font-bold text-[#651E2C] font-mono">+24.8%</div>
        <div className="text-[10px] text-[#77716E] mb-2">{isAr ? "إجمالي النمو" : "Total Growth"}</div>
        <div className="flex items-end gap-1.5 h-10">
          <div className="w-2 rounded-t-sm bg-[#651E2C]/40 h-3" />
          <div className="w-2 rounded-t-sm bg-[#651E2C]/50 h-5" />
          <div className="w-2 rounded-t-sm bg-[#651E2C]/70 h-4" />
          <div className="w-2 rounded-t-sm bg-[#651E2C]/80 h-7" />
          <div className="w-2 rounded-t-sm bg-[#651E2C] h-9" />
          <div className="w-2 rounded-t-sm bg-[#8A293B] h-10" />
        </div>
      </motion.div>

      {/* ── FLOATING ELEMENT 4: All Systems Operational Pill ── */}
      <motion.div
        animate={floatAnim1}
        transition={floatTrans1}
        className={`absolute -bottom-5 ${
          isAr ? "-end-2 sm:-end-4" : "-end-2 sm:-end-4"
        } z-30 rounded-full border border-[#E6DCD2]/90 bg-[#FFFFFF] px-3.5 py-1.5 shadow-lg flex items-center gap-2`}
      >
        <CheckCircle2 className="h-4 w-4 text-[#27835C]" />
        <span className="text-xs font-semibold text-[#262321]">
          {isAr ? "تمت العملية بنجاح" : "All systems operational"}
        </span>
      </motion.div>
    </div>
  );
}

export default MizanDashboardHeroMockup;
