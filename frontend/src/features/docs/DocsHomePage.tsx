import { Link } from "react-router-dom";
import {
  Boxes,
  Code2,
  Server,
  Zap,
  Printer,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Terminal,
  Sparkles,
} from "lucide-react";
import { DOC_SECTIONS } from "./docsData";
import { useTranslation } from "@/i18n";

export default function DocsHomePage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const quickCards = [
    {
      titleAr: "دليل البداية السريعة",
      titleEn: "Quick Start Guide",
      icon: Zap,
      href: "/docs/introduction",
      descAr: "تعرف على كيفية إنشاء منشأتك، إضافة الفروع، وتشغيل أول نقطة بيع في 10 دقائق.",
      descEn: "Step-by-step setup to register your tenant, configure branches, and process your first cashier sale in 10 minutes.",
      badgeAr: "ابدأ هنا",
      badgeEn: "Start Here",
    },
    {
      titleAr: "كتالوج الـ 47 موديول القطاعي",
      titleEn: "47-Sector Modules Catalog",
      icon: Boxes,
      href: "/docs/modules/accounting",
      descAr: "شرح شامل لكافة موديولات المنظومة (المطاعم، المستودعات، العيادات، التصنيع، والمالية).",
      descEn: "Comprehensive reference across all industry modules: KDS, WMS, Clinics, Manufacturing, and General Ledger.",
      badgeAr: "مرجع شامل",
      badgeEn: "Full Catalog",
    },
    {
      titleAr: "مرجع REST API الموثق",
      titleEn: "REST API & Webhooks",
      icon: Code2,
      href: "/docs/dev/api-intro",
      descAr: "المصادقة بـ JWT، استدعاء نقاط النهاية، معالجة الأخطاء، ونموذج مواصفة manifest.json.",
      descEn: "JWT authentication, OpenAPI endpoints, rate limits, webhooks, and module manifest.json schemas.",
      badgeAr: "للمطورين",
      badgeEn: "Developers",
    },
    {
      titleAr: "النشر الذاتي والحاويات Docker",
      titleEn: "Deployment & Operations",
      icon: Server,
      href: "/docs/deploy/self-hosted",
      descAr: "أوامر تشغيل الحاويات، متغيرات البيئة، وسياسات عزل PostgreSQL RLS الصارمة.",
      descEn: "Docker compose setups, environment variables, offline desktop .exe builds, and PostgreSQL RLS policies.",
      badgeAr: "DevOps",
      badgeEn: "DevOps",
    },
  ];

  const popularGuides = [
    {
      titleAr: "الطباعة الحرارية وبروتوكول ESC/POS",
      titleEn: "ESC/POS Thermal Printing & Cash Drawers",
      slug: "dev/hardware-escpos",
      icon: Printer,
      categoryAr: "عتاد وأجهزة",
      categoryEn: "Hardware & POS",
    },
    {
      titleAr: "عزل البيانات وسياسات PostgreSQL RLS",
      titleEn: "PostgreSQL Row-Level Security Isolation",
      slug: "admin/tenant-settings",
      icon: ShieldCheck,
      categoryAr: "أمان وقواعد بيانات",
      categoryEn: "Security & DB",
    },
    {
      titleAr: "إدارة الورديات ونقاط البيع السريعة",
      titleEn: "Cashier Shifts & Instant Checkout",
      slug: "modules/pos",
      icon: Zap,
      categoryAr: "عمليات التجزئة",
      categoryEn: "Retail Operations",
    },
    {
      titleAr: "مواصفة الموديول manifest.json",
      titleEn: "Module Specification manifest.json",
      slug: "dev/manifest-spec",
      icon: Terminal,
      categoryAr: "تطوير الإضافات",
      categoryEn: "Module Extension",
    },
  ];

  return (
    <div className="space-y-12">
      {/* 1. Deep Merlot Hero Banner */}
      <div className="relative rounded-3xl bg-[#35151D] p-8 sm:p-12 text-[#F5EBDD] overflow-hidden shadow-xl border border-white/10 hero-concentric-arcs">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#E7D6C1] backdrop-blur-xs">
            <Sparkles className="size-3 text-[#B86B76]" />
            <span>{isAr ? "مركز المعرفة والمطورين — الإصدار 3.0" : "Knowledge & Architecture Hub — v3.0"}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
            {isAr ? (
              <>
                كل ما تحتاجه للتهيئة، التكامل، <br />
                <span className="italic text-[#B86B76]">والتشغيل على منصة ميزان</span>
              </>
            ) : (
              <>
                Everything you need to configure, integrate, <br />
                <span className="italic text-[#B86B76]">and scale with Mizan ERP</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-[#E7D6C1] leading-relaxed">
            {isAr
              ? "دليلك الهندسي الشامل لتهيئة وتشغيل وتطوير موديولات ميزان ERP. استكشف معمارية الـ 47 موديول، واجهات REST API، آليات تكامل أجهزة الكاشير والطباعة، والنشر السحابي والذاتي."
              : "Comprehensive architecture reference for configuring, operating, and extending Mizan ERP modules. Explore our 47-sector catalog, OpenAPI contracts, and hardware protocols."}
          </p>
        </div>
      </div>

      {/* 2. Quickstart Action Cards */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-normal text-[#262321]">
          {isAr ? "مسارات البدء السريع" : "Quickstart Pathways"}
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                to={card.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#E7D6C1] bg-white p-6 shadow-xs transition-all hover:border-[#651E2C] hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1] group-hover:bg-[#651E2C] group-hover:text-white transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full bg-[#FAF6F0] px-2.5 py-1 text-[10px] font-bold text-[#651E2C] border border-[#E7D6C1]">
                      {isAr ? card.badgeAr : card.badgeEn}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-normal text-[#262321] group-hover:text-[#651E2C] transition-colors">
                    {isAr ? card.titleAr : card.titleEn}
                  </h3>

                  <p className="mt-2 text-xs text-[#77716E] leading-relaxed">
                    {isAr ? card.descAr : card.descEn}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E7D6C1]/50 flex items-center justify-between text-xs font-bold text-[#651E2C]">
                  <span>{isAr ? "فتح الدليل والتعليمات" : "Open Guide"}</span>
                  {isAr ? <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Popular Guides */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-normal text-[#262321]">
          {isAr ? "الأدلة الأكثر قراءة واعتماداً" : "Essential Operations Guides"}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {popularGuides.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                to={`/docs/${item.slug}`}
                className="group flex items-center justify-between rounded-xl border border-[#E7D6C1] bg-white p-4 hover:border-[#651E2C]/50 hover:bg-[#FAF6F0]/50 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1]">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#262321] group-hover:text-[#651E2C] transition-colors">
                      {isAr ? item.titleAr : item.titleEn}
                    </h4>
                    <span className="text-[10px] text-[#77716E] font-mono">
                      {isAr ? item.categoryAr : item.categoryEn}
                    </span>
                  </div>
                </div>
                {isAr ? (
                  <ArrowLeft className="size-4 text-[#77716E] group-hover:text-[#651E2C] transition-colors" />
                ) : (
                  <ArrowRight className="size-4 text-[#77716E] group-hover:text-[#651E2C] transition-colors" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Complete Section Directory Grid */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-normal text-[#262321]">
          {isAr ? "فهرس المقالات الكامل (38 مقالاً)" : "Complete Documentation Directory (38 Articles)"}
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl border border-[#E7D6C1] bg-white p-5 shadow-xs space-y-3"
            >
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#651E2C] border-b border-[#E7D6C1] pb-2">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/docs/${item.slug}`}
                      className="block text-xs text-[#77716E] hover:text-[#651E2C] transition-colors"
                    >
                      • {item.title}
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
