import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Database,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";

export default function ProductPage() {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);

  const workflowSteps = [
    {
      title: "1. حركة بيع في الكاشير (POS)",
      desc: "يقوم الكاشير بمسح باركود المنتج وإصدار الفاتورة الضريبية الفورية مع طباعة الإيصال الحراري ونبضة فتح الدرج.",
      module: "pos",
      badge: "نقطة بيع سريعة",
    },
    {
      title: "2. خصم المخزون اللحظي (WMS)",
      desc: "يقوم محرك المخزون بخصم الكميات من المستودع المحدد فورياً، وتتبع التشغيلة FEFO، وتحديث حد إعادة الطلب.",
      module: "inventory",
      badge: "إدارة المخزون",
    },
    {
      title: "3. ترحيل القيود لدفتر الأستاذ (GL)",
      desc: "يتم إنشاء قيد محاسبي مزدوج تلقائي: مدين (الخزينة) ودائن (إيراد المبيعات + ضريبة القيمة المضافة) بدون تدخل يدوي.",
      module: "finance",
      badge: "المالية والحسابات",
    },
    {
      title: "4. احتساب عمولة الموظف والوردية (HR)",
      desc: "يتم تسجيل العملية في سجل تدقيق الكاشير، وربط المبيعات بمسير الحوافز والرواتب الشهري المعتمد.",
      module: "hr",
      badge: "الموارد البشرية",
    },
  ];

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-16 space-y-16">
        {/* 1. Hero Header */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="outline" className="bg-brand/10 text-brand">
            معمارية المنظومة الموحدة
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            نظام متكامل يربط عمليات منشأتك بنبضة واحدة
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            وداعاً لتشتت البيانات بين برامج منفصلة لكل قسم. في ميزان ERP، تتصل كافة الموديولات
            بشجرة حسابات موحدة، قاعدة بيانات آمنة، ومحرك أحداث لحظي يضمن تدفق المعلومات بسلاسة.
          </p>
        </div>

        {/* 2. Visual Architecture Diagram */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-8">
            <div className="text-center space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                طبقات معمارية ميزان الثلاث (The 3-Layer Architecture)
              </h2>
              <p className="text-xs text-slate-500">
                تصميم هندسي يجمع بين صلابة النواة ومرونة التخصيص غير المحدود
              </p>
            </div>

            <div className="space-y-4">
              {/* Layer 1: Core System */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-sm text-blue-900 dark:text-blue-300">
                      الطبقة الأولى: النواة والأمان وقواعد البيانات (Core & PostgreSQL RLS)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900">
                    أساسية لكافة المنشآت
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  تتولى إدارة المستخدمين، المصادقة وتشفير JWT، صلاحيات RBAC، شجرة الحسابات العامة،
                  سجل التدقيق الرقابي غير القابل للتعديل، وسياسات عزل المنشآت الحسابية RLS.
                </p>
              </div>

              {/* Layer 2: Modular Applications */}
              <div className="rounded-xl border border-brand/30 bg-brand/5 p-5 dark:border-brand/30 dark:bg-brand/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-brand" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      الطبقة الثانية: الموديولات القطاعية والتطبيقات (47 Pluggable Modules)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900">
                    تفعيل بنقرة زر
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  موديولات مستقلة ذاتياً تعرّف جداولها وشاشاتها وواجهاتها عبر manifest.json:
                  المطاعم وشاشات المطبخ، الصيدليات وتتبع الصلاحيات، العيادات والملفات الطبية،
                  المقاولات، وصالات الجيم.
                </p>
              </div>

              {/* Layer 3: Hardware & Device Ecosystem */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                      الطبقة الثالثة: تكامل العتاد وأجهزة نقاط البيع (Hardware & Automation)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900">
                    بروتوكولات مباشرة
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  محرك طباعة إيصالات حرارية مباشر عبر ESC/POS، قارئات الباركود السريعة، أجهزة الحضور
                  والانصراف ZKTeco عبر منفذ 4370 TCP، ومحرك الأتمتة المجدول (Cron Worker).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Cross-Module Data Flow Simulator */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40">
              التكامل اللحظي
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              كيف تتدفق البيانات بين الموديولات في ثوانٍ؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              اضغط على أي مرحلة لمشاهدة تأثيرها التلقائي على باقي أقسام المنظومة
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`flex flex-col justify-between rounded-xl p-5 text-start border transition-all ${
                  activeWorkflowStep === idx
                    ? "border-brand bg-white shadow-md ring-2 ring-brand/20 dark:bg-slate-900"
                    : "border-slate-200 bg-white/70 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60"
                }`}
              >
                <div>
                  <Badge variant="outline" className="mb-3 text-[10px]">
                    {step.badge}
                  </Badge>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span>الموديول: {step.module}</span>
                  {activeWorkflowStep === idx && (
                    <span className="text-brand font-bold">نشط الآن ✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Migration from Legacy ERPs */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-center">
              الانتقال السلس من جداول Excel والبرامج القديمة
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-xs">
                  01
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  استيراد الأصناف والأرصدة
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ارفع ملفات Excel للأصناف، الباركود، وأرصدة المستودعات مع فحص التكرارات تلقائياً.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-xs">
                  02
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  استيراد العملاء والموردين
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ترحيل الأرصدة الافتتاحية للمديونيات مع بيانات الاتصال والسجلات الضريبية المعتمدة.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-xs">
                  03
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  بدء العمل والتشغيل الفوري
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ربط طابعات الكاشير وأجهزة الباركود والبدء في إصدار الفواتير دون أي توقف لعملياتك.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. CTA */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl bg-brand p-8 sm:p-12 text-white space-y-4 shadow-xl shadow-brand/20">
            <h2 className="text-2xl sm:text-3xl font-black">
              استكشف الموديولات المخصصة لقطاعك الآن
            </h2>
            <p className="max-w-lg mx-auto text-xs sm:text-sm text-white/90">
              اختر باقة نشاطك التجاري وابدأ بتجربتها مجاناً مع كامل المزايا وصلاحيات التخصيص.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                size="lg"
                className="bg-white text-brand hover:bg-slate-100 font-bold"
                render={<Link to="/signup" />}
                nativeButton={false}
              >
                بدء التجربة المجانية (14 يوماً)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
