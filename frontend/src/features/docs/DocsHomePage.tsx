import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Boxes,
  Zap,
  Search,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { DOC_SECTIONS } from "./docsData";
import { useTranslation } from "@/i18n";
import { assetUrl } from "@/lib/utils";

export default function DocsHomePage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const mainPillars = [
    {
      titleAr: "الأساسيات",
      titleEn: "Core Basics",
      icon: BookOpen,
      href: "/docs/core/architecture",
      descAr: "تهيئة المنشأة، إعداد الفروع، وإدارة صلاحيات المستخدمين وعزل البيانات.",
      descEn: "Tenant onboarding, branch configuration, user access control, and PostgreSQL RLS.",
    },
    {
      titleAr: "المميزات",
      titleEn: "Platform Features",
      icon: Boxes,
      href: "/docs/modules/accounting",
      descAr: "شرح شامل لكافة موديولات المنظومة (المبيعات، المخزون، ونقاط البيع السريعة).",
      descEn: "Comprehensive reference across all industry modules: POS, WMS, and General Ledger.",
    },
    {
      titleAr: "البداية السريعة",
      titleEn: "Quick Start",
      icon: Zap,
      href: "/docs/introduction",
      descAr: "دليل عملي لتشغيل أول نقطة بيع، إضافة الأصناف، وإصدار الفواتير في 10 دقائق.",
      descEn: "Step-by-step setup to register your store and process your first cashier sale in 10 minutes.",
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/docs/introduction?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-16">
      {/* 1. Deep Merlot Hero Banner matching Screen 13 (13_docs_home.png) */}
      <div className="relative rounded-3xl bg-[#35151D] text-[#FAF6F0] overflow-hidden shadow-2xl border border-white/10 hero-concentric-arcs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Text & Search Side */}
          <div className="lg:col-span-8 p-8 sm:p-14 space-y-6 text-start z-10">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
              {isAr ? "مرحباً في دليل استخدام ميزان" : "Welcome to Mizan Documentation"}
            </h1>

            <p className="text-xs sm:text-sm text-[#E7D6C1] leading-relaxed max-w-xl">
              {isAr
                ? "ابحث عن الإجابات، وتصفح تغطية شاملة من إمكانيات ميزان لإدارة الحسابات، نقاط البيع، والمستودعات."
                : "Search for answers and explore comprehensive documentation on accounting, cashier operations, and warehouse management."}
            </p>

            {/* Centered / Prominent White Pill Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl pt-2">
              <div className="relative flex items-center">
                <Search className="absolute start-4 size-4 text-[#77716E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? "ابحث عن موضوع، ميزة، أو كود برمجي..."
                      : "Search documentation, APIs, guides..."
                  }
                  className="w-full rounded-full border border-white/30 bg-white ps-11 pe-24 py-3.5 text-xs text-[#262321] placeholder-[#77716E] shadow-lg focus:outline-hidden focus:ring-2 focus:ring-[#B86B76] transition-all"
                />
                <button
                  type="submit"
                  className="absolute end-2 rounded-full bg-[#651E2C] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#521723] transition-all"
                >
                  {isAr ? "بحث" : "Search"}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[#E7D6C1]/80 ps-2">
                <span>{isAr ? "شائع:" : "Popular:"}</span>
                <Link to="/docs/modules/accounting" className="hover:text-white underline">
                  {isAr ? "المحاسبة" : "Accounting"}
                </Link>
                <span>•</span>
                <Link to="/docs/dev/hardware-escpos" className="hover:text-white underline">
                  {isAr ? "الطباعة الحرارية" : "Thermal Printing"}
                </Link>
                <span>•</span>
                <Link to="/docs/admin/tenant-settings" className="hover:text-white underline">
                  {isAr ? "عزل البيانات RLS" : "PostgreSQL RLS"}
                </Link>
              </div>
            </form>
          </div>

          {/* Arched Architectural Photo Side */}
          <div className="hidden lg:block lg:col-span-4 h-full min-h-[300px] relative overflow-hidden">
            <img
              src={assetUrl("assets/marketing/arch-hero-feature.jpg")}
              alt="Mizan Knowledge Arch"
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-e from-[#35151D] via-[#35151D]/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* 2. Three Circular Cards: الأساسيات، المميزات، البداية السريعة matching Screen 13 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mainPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <Link
              key={idx}
              to={pillar.href}
              className="flex flex-col items-center text-center space-y-4 rounded-3xl border border-[#E7D6C1] bg-white p-8 shadow-xs hover:shadow-md hover:border-[#651E2C] transition-all group"
            >
              <div className="flex size-16 items-center justify-center rounded-full bg-[#F5EBDD] border border-[#E7D6C1] text-[#651E2C] shadow-xs group-hover:scale-105 transition-transform">
                <Icon className="size-7" />
              </div>

              <h2 className="font-display text-2xl font-normal text-[#262321] group-hover:text-[#651E2C] transition-colors">
                {isAr ? pillar.titleAr : pillar.titleEn}
              </h2>

              <p className="text-xs sm:text-sm text-[#77716E] leading-relaxed max-w-xs">
                {isAr ? pillar.descAr : pillar.descEn}
              </p>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#651E2C] pt-2">
                <span>{isAr ? "استكشف الدليل" : "Read Section"}</span>
                <ArrowIcon className="size-3.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* 3. Comprehensive Documentation Catalog */}
      <div className="space-y-6 pt-6 border-t border-[#E7D6C1]">
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#262321]">
            {isAr ? "تصفح جميع أقسام التوثيق" : "Browse All Documentation Categories"}
          </h2>
          <p className="text-xs sm:text-sm text-[#77716E]">
            {isAr
              ? "38 مقالاً هندسياً يغطي جميع طبقات النظام من المحاسبة إلى العتاد ونقاط النهاية"
              : "38 articles covering all system layers from core ledger to hardware protocols"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOC_SECTIONS.map((sec) => (
            <div
              key={sec.id}
              className="rounded-2xl border border-[#E7D6C1] bg-white p-6 shadow-xs space-y-3"
            >
              <h3 className="font-display text-lg font-bold text-[#262321] border-b border-[#E7D6C1] pb-2">
                {isAr ? sec.title : sec.titleEn}
              </h3>
              <ul className="space-y-2 text-xs">
                {sec.items.slice(0, 4).map((art) => (
                  <li key={art.slug}>
                    <Link
                      to={`/docs/${art.slug}`}
                      className="text-[#77716E] hover:text-[#651E2C] flex items-center justify-between transition-colors py-0.5"
                    >
                      <span className="line-clamp-1">{isAr ? art.title : art.titleEn}</span>
                      <ArrowIcon className="size-3 text-[#B86B76] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
