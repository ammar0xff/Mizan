import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  Lock,
  Boxes,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";

export default function AboutPage() {
  const principles = [
    {
      icon: Boxes,
      title: "المعيارية المطلقة (Radical Modularity)",
      desc: "نرفض الهياكل الجامدة. كل نشاط تجاري في ميزان هو موديول مستقل يتم تفعيله أو تعطيله بنقرة زر واحدة دون الحاجة لتعديل شفرة النظام.",
    },
    {
      icon: Lock,
      title: "العزل الرياضي بقواعد البيانات (RLS)",
      desc: "بيانات كل منشأة معزولة حسابياً على مستوى نواة PostgreSQL باستخدام تقنية Row-Level Security، مما يضمن أماناً بنكياً واستقلالية تامة.",
    },
    {
      icon: Zap,
      title: "سرعة استجابة فائقة (Sub-10ms Velocity)",
      desc: "محرك نقطة بيع صُمم ليعمل بنمط Offline-First مع دعم كامل لاختصارات لوحة المفاتيح وقارئات الباركود لتفريغ طوابير الكاشير بسرعة خيالية.",
    },
    {
      icon: ShieldCheck,
      title: "التكامل المالي الموحد (Unified Financial Integrity)",
      desc: "أي حركة بيع، شراء، جرد، أو حسم مواد خام في أي موديول يتم ترحيلها فورياً إلى شجرة الحسابات العامة ودفتر الأستاذ المزدوج دون وساطة.",
    },
  ];

  const stats = [
    { value: "47", label: "موديولاً قطاعياً متخصصاً", sub: "جاهز للتفعيل الفوري" },
    { value: "< 3s", label: "سرعة إصدار الفاتورة", sub: "شاملة الطباعة الحرارية" },
    { value: "100%", label: "عزل RLS بين المنشآت", sub: "صفر مخاطر تسريب" },
    { value: "99.98%", label: "توافرية السحابة والخدمات", sub: "مراقبة لحظية 24/7" },
  ];

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-16 space-y-16">
        {/* 1. Hero Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="outline" className="bg-brand/10 text-brand">
            رؤيتنا ورسالتنا الهندسية
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-3xl mx-auto leading-tight">
            بنينا ميزان ERP لإنهاء حقبة الأنظمة الجامدة المعقدة
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            مهمتنا هي تمكين المؤسسات والأنشطة التجارية في الشرق الأوسط من إدارة كافة عملياتها
            (المبيعات، المخازن، الحسابات، الموارد البشرية، والإنتاج) عبر منصة واحدة رشيقة تتكيف مع
            نمو المنشأة ولا تعيقها.
          </p>
        </section>

        {/* 2. Key Metrics Bar */}
        <section className="border-y border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 text-center">
              {stats.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black font-mono text-brand">
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-slate-400">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. The Story Behind Mizan */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 dark:border-slate-800 dark:bg-slate-900 space-y-4 leading-relaxed text-sm sm:text-base text-slate-600 dark:text-slate-300">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              قصة ولادة المنظومة
            </h2>
            <p>
              لعقود طويلة، واجهت الشركات خيارين كلاهما صعب: إما شراء برامج محاسبية سطحية لا تلبي
              احتياجات قطاعهم المتخصص، أو الاستثمار في أنظمة ERP عملاقة تكلف ملايين الجنيهات
              وتستغرق أشهراً لتشغيلها، وفوق ذلك تعاني من بطء في بيئات البيع السريع ونقاط الكاشير.
            </p>
            <p>
              صممنا <strong>ميزان ERP</strong> كحل جذري لهذه المعادلة. بدأنا ببناء نواة معيارية تعتمد
              على أحدث معايير الأمان وقواعد البيانات غير التزامنية، ثم وفرنا باقات جاهزة ومسبقة
              الضبط لكل نشاط: تجارة التجزئة، سلاسل المطاعم، المجمعات الطبية، المدارس، نوادي
              اللياقة، والتصنيع.
            </p>
            <p>
              اليوم، يستطيع أي تاجر أو مدير شركة بدء عملياته فورياً، طباعة فواتيره الحرارية المعتمدة،
              وربط أجهزة البصمة وقوارئ الباركود في دقائق، مع طمأنينة كاملة بأن بياناته معزولة ومحمية
              بأعلى المعايير.
            </p>
          </div>
        </section>

        {/* 4. Core Engineering Principles Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              المبادئ الهندسية الأربعة التي تحكم نظامنا
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              قيم تقنية ثابته نلتزم بها في كل سطر برمجي نكتبه
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {principles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. CTA Banner */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-brand-dark to-slate-900 p-8 sm:p-12 text-center text-white space-y-6 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              جاهز لتجربة الجيل الجديد من أنظمة الـ ERP؟
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300">
              ابدأ تجربتك المجانية اليوم لمدة 14 يوماً بلا حاجة لبطاقة دفع. أو تواصل مع مستشارينا
              لحجز عرض توضيحي مباشر لمنشأتك.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-brand text-white font-bold hover:bg-brand/90"
                render={<Link to="/signup" />}
                nativeButton={false}
              >
                بدء التجربة المجانية الآن
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                render={<Link to="/contact" />}
                nativeButton={false}
              >
                طلب استشارة مبيعات
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
