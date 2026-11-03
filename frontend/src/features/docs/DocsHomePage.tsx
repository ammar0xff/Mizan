import { Link } from "react-router-dom";
import {
  Boxes,
  Code2,
  Server,
  Zap,
  Printer,
  ShieldCheck,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { DOC_SECTIONS } from "./docsData";

export default function DocsHomePage() {
  const quickCards = [
    {
      title: "دليل البداية السريعة",
      titleEn: "Quick Start Guide",
      icon: Zap,
      href: "/docs/introduction",
      desc: "تعرف على كيفية إنشاء منشأتك، إضافة الفروع، وتشغيل أول نقطة بيع في 10 دقائق.",
      badge: "ابدأ هنا",
    },
    {
      title: "كتالوج الـ 47 موديول",
      titleEn: "Modules Reference",
      icon: Boxes,
      href: "/docs/modules/accounting",
      desc: "شرح شامل لكافة موديولات المنظومة (المطاعم، المستودعات، العيادات، التصنيع، والمالية).",
      badge: "مرجع شامل",
    },
    {
      title: "مرجع REST API الموثق",
      titleEn: "REST API Reference",
      icon: Code2,
      href: "/docs/dev/api-intro",
      desc: "المصادقة بـ JWT، استدعاء نقاط النهاية، معالجة الأخطاء، ونموذج مواصفة manifest.json.",
      badge: "للمطورين",
    },
    {
      title: "النشر الذاتي وDocker",
      titleEn: "Deployment & Operations",
      icon: Server,
      href: "/docs/deploy/self-hosted",
      desc: "أوامر تشغيل الحاويات، متغيرات البيئة، وسياسات عزل PostgreSQL RLS الصارمة.",
      badge: "DevOps",
    },
  ];

  const popularGuides = [
    {
      title: "الطباعة الحرارية وبروتوكول ESC/POS",
      slug: "dev/hardware-escpos",
      icon: Printer,
      category: "عتاد وأجهزة",
    },
    {
      title: "عزل البيانات وسياسات PostgreSQL RLS",
      slug: "admin/tenant-settings",
      icon: ShieldCheck,
      category: "أمان وقواعد بيانات",
    },
    {
      title: "إدارة الورديات ونقاط البيع السريعة",
      slug: "modules/pos",
      icon: Zap,
      category: "عمليات التجزئة",
    },
    {
      title: "مواصفة الموديول manifest.json",
      slug: "dev/manifest-spec",
      icon: Terminal,
      category: "تطوير الإضافات",
    },
  ];

  return (
    <div className="space-y-10">
      {/* 1. Hero Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-brand/5 p-6 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-brand/10">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="bg-brand/10 text-brand dark:bg-brand/20">
            مركز المعرفة والمطورين
          </Badge>
          <span className="text-xs text-slate-400 font-mono">الإصدار 3.0 المعياري</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          توثيق منصة ميزان ERP
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          دليلك الشامل لتهيئة وتشغيل وتطوير موديولات ميزان ERP. استكشف معمارية الـ 47 موديول، واجهات
          البرمجة REST API، آليات تكامل أجهزة الكاشير والطباعة، والنشر السحابي والذاتي.
        </p>
      </div>

      {/* 2. Quickstart Action Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          مسارات البدء السريع
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                to={card.href}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-brand/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {card.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                    {card.title}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mb-2">{card.titleEn}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand">
                  <span>فتح الدليل</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Popular Guides */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          الأدلة الأكثر قراءة وتطعيماً
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {popularGuides.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                to={`/docs/${item.slug}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-brand/40 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 rtl:rotate-180" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Complete Section Directory Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          فهرس التوثيق الكامل (38 مقالاً)
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/docs/${item.slug}`}
                      className="block text-xs text-slate-600 hover:text-brand dark:text-slate-400 dark:hover:text-brand-light transition-colors"
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
