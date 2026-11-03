import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  UtensilsCrossed,
  Stethoscope,
  Pill,
  Dumbbell,
  Truck,
  Factory,
  HardHat,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";

interface IndustryProfile {
  id: string;
  icon: any;
  name: string;
  nameEn: string;
  tagline: string;
  badge: string;
  description: string;
  challenges: string[];
  bundleModules: string[];
  metrics: { label: string; value: string }[];
  sampleWorkflows: string[];
}

const INDUSTRIES: IndustryProfile[] = [
  {
    id: "retail",
    icon: ShoppingCart,
    name: "التجزئة، السوبرماركت، والمعارض",
    nameEn: "Retail & Supermarkets",
    tagline: "سرعة فائقة في طوابير الكاشير، ربط الموازين وقوارئ الباركود، وتنبيهات نواقص الأرفف اللحظية.",
    badge: "الأكثر انتشاراً",
    description:
      "صُممت حزمة التجزئة خصيصاً للمتاجر الاستهلاكية، معارض الأجهزة، ومحلات السوبرماركت المزدحمة. تدعم قراءة باركود الأوزان للمواد الطازجة، إصدار الفواتير الضريبية في أقل من 3 ثوانٍ، وتحديث أرصدة المستودعات فورياً.",
    challenges: [
      "تكدس طوابير الكاشير وبطء استجابة البرامج التقليدية",
      "صعوبة مطابقة باركود الأوزان للمخبوزات واللحوم الطازجة",
      "نفاد الأصناف سريعة الدوران دون تنبيه مسبق لإعادة الطلب",
      "فروقات عجز النقدية بأدراج الكاشير عند إغلاق الوردية",
    ],
    bundleModules: ["core", "inventory", "pos", "finance", "hr"],
    metrics: [
      { label: "سرعة إصدار الفاتورة", value: "< 2.5 ثانية" },
      { label: "دقة مطابقة المخزون", value: "99.8%" },
      { label: "زمن إغلاق الوردية", value: "دقيقة واحدة" },
    ],
    sampleWorkflows: [
      "مسح باركود المنتج أو باركود الميزان الإلكتروني",
      "تطبيق خصم العميل المعتمد أو استبدال نقاط الولاء",
      "إصدار الفاتورة الضريبية مع فتح درج الكاشير ونبضة الطابعة",
      "تحديث تلقائي لمستودع المتجر وتسجيل القيد في الخزينة",
    ],
  },
  {
    id: "restaurant",
    icon: UtensilsCrossed,
    name: "المطاعم، الكافيهات، والضيافة",
    nameEn: "Restaurants & Hospitality",
    tagline: "مخطط صالة الطعام، شاشات المطبخ اللحظية (KDS)، تجزئة الشيكات، وتفكيك وصفات الوجبات الخام.",
    badge: "مخصص للضيافة",
    description:
      "منظومة متكاملة لقطاع الأغذية والمشروبات تربط الكابتن أوردر، شاشات المطبخ، والكاشير بسلاسة، مع خصم المقادير الخام للوجبة (Backflushing) من المستودع تلقائياً.",
    challenges: [
      "تأخر وصول طلبات الصالة لطهاة المطبخ أو ضياع البونات الورقية",
      "إهدار المواد الخام وصعوبة احتساب تكلفة الأطباق بدقة (Food Cost)",
      "تعقيدات تجزئة الفاتورة بين رواد الطاولة الواحدة",
      "تتبع كفاءة طياري الدليفري وأوقات التوصيل للعملاء",
    ],
    bundleModules: ["core", "pos", "restaurant", "inventory", "finance"],
    metrics: [
      { label: "ترحيل الطلب للمطبخ", value: "فوري (لحظي)" },
      { label: "خفض إهدار المواد الخام", value: "حتى 18%" },
      { label: "دعم شاشات KDS", value: "تفاعلية باللمس" },
    ],
    sampleWorkflows: [
      "تسجيل الطلب على طاولة محددة في مخطط الصالة",
      "ظهور تذكرة الطلب فورياً في شاشة المطبخ KDS مع توقيت التحضير",
      "تنبيه الويتر بانتهاء تجهيز الوجبة وتسليمها للعميل",
      "تجزئة الشيك أو الدفع الكامل وإصدار إيصال 80mm الضريبي",
    ],
  },
  {
    id: "clinic",
    icon: Stethoscope,
    name: "العيادات والمراكز الطبية والمستشفيات",
    nameEn: "Healthcare & Clinics",
    tagline: "الملفات الطبية الإلكترونية (EMR)، حجز المواعيد والكشوفات، الروشتات الرقمية، والفحوصات.",
    badge: "رعاية صحية",
    description:
      "نظام إداري وطبي متكامل للمجمعات الطبية والعيادات التخصصية، يدعم تنظيم جدول الأطباء، السجل المرضي الموحد لكل مريض، وإرسال الروشتة إلكترونياً لصيدلية المركز.",
    challenges: [
      "تلف أو ضياع الملفات الورقية للمرضى وتاريخهم العلاجي",
      "تداخل مواعيد المرضى وتكدس صالات الانتظار في العيادات",
      "أخطاء قراءة الخط اليدوي للروشتات الطبية",
      "صعوبة متابعة مستحقات ونسب أتعاب الأطباء الشهرية",
    ],
    bundleModules: ["core", "clinic", "pharmacy", "finance"],
    metrics: [
      { label: "استدعاء الملف الطبي", value: "أقل من ثانية" },
      { label: "منع تعارض الأدوية", value: "آلي بالكامل" },
      { label: "تنظيم مواعيد الكشف", value: "SMS وواتساب" },
    ],
    sampleWorkflows: [
      "تسجيل المريض وحجز موعد في الاستقبال",
      "دخول الطبيب على السجل الطبي EMR وتسجيل التشخيص",
      "إصدار الروشتة الرقمية e-Rx وطباعة تعليمات الجرعات",
      "صرف العلاج تلقائياً من صيدلية المركز وخصم المخزون",
    ],
  },
  {
    id: "pharmacy",
    icon: Pill,
    name: "الصيدليات وصرف الأدوية والمستلزمات",
    nameEn: "Pharmacies & Dispensing",
    tagline: "دليل الأدوية والبدائل التكافؤية (INN)، تتبع تواريخ الصلاحية (FEFO)، ودفتر الأدوية المراقبة.",
    badge: "صيدليات",
    description:
      "حل صيدلي دقيق يدعم اقتراح البدائل العلمية عند نفاد الدواء، مراقبة تواريخ الصلاحية بالتشغيلة واليوم، وربط مبيعات التأمين الطبي والخصومات النقابية.",
    challenges: [
      "خسائر انتهاء صلاحية الأدوية على الأرفف دون تدوير ذكي",
      "صعوبة حفظ كافة البدائل والأسماء التجارية والتركيزات",
      "تسوية مطالبات شركات التأمين الطبي المليئة بالاستقطاعات",
      "الرقابة الصارمة على أدوية الجدول والسموم",
    ],
    bundleModules: ["core", "inventory", "pos", "finance", "pharmacy"],
    metrics: [
      { label: "تنبيهات FEFO المبكرة", value: "قبل 90 يوماً" },
      { label: "قاعدة بيانات البدائل", value: "آلاف الأصناف" },
      { label: "تسوية التأمين الطبي", value: "تلقائية فورية" },
    ],
    sampleWorkflows: [
      "مسح باركود الدواء في الكاشير وتنبيه الصيدلي بتاريخ الصلاحية",
      "اقتراح البديل العلمي المطابق في حالة نفاد الصنف",
      "تطبيق نسبة خصم التأمين الطبي المعتمدة للعميل",
      "تسجيل حركة الصرف في سجل المستودع المعتمد",
    ],
  },
  {
    id: "gym",
    icon: Dumbbell,
    name: "الأندية الصحية وصالات الجيم واللياقة",
    nameEn: "Gyms & Sports Clubs",
    tagline: "إدارة العضويات، بوابات الدخول Turnstiles، حصص التدريب الخاص PT، وكافيتيريا المكملات.",
    badge: "لياقة ورياضة",
    description:
      "نظام رياضي متكامل لإدارة اشتراكات الجيم والكروس فيت، تجميد العضويات المؤقت (Freeze)، ربط بوابات الدخول الذكية ببطاقات RFID، وتوزيع عمولات المدربين.",
    challenges: [
      "دخول غير المشتركين أو أصحاب الاشتراكات المنتهية",
      "نزاعات تجميد الاشتراكات والمدد المتبقية",
      "حساب مستحقات المدربين عن حصص التدريب الشخصي (PT)",
      "جرد مكملات ومشروبات البار الرياضي",
    ],
    bundleModules: ["core", "gym", "pos", "finance"],
    metrics: [
      { label: "سرعة فتح البوابة الذكية", value: "< 0.5 ثانية" },
      { label: "تنبيه تجديد العضوية", value: "آلي عبر WhatsApp" },
      { label: "تتبع قياسات InBody", value: "ملف إلكتروني" },
    ],
    sampleWorkflows: [
      "مسح بطاقة العضو عند بوابة الدخول Turnstile والتحقق من سريان العضوية",
      "تسجيل حضور حصة التدريب الخاص PT مع الكابتن",
      "شراء مكمل غذائي من كافيتيريا الجيم مع الخصم من الرصيد",
      "إصدار إشعار تجديد الاشتراك قبل انتهائه بـ 3 أيام",
    ],
  },
  {
    id: "logistics",
    icon: Truck,
    name: "الشحن، النقل، والخدمات اللوجستية (3PL)",
    nameEn: "Logistics & Fleet Transport",
    tagline: "تتبع بوالص الشحن (AWB)، تخطيط المسارات، إثبات التسليم الرقمي e-POD، وتكاليف أسطول المركبات.",
    badge: "لوجستيات وأسطول",
    description:
      "إدارة دورة حياة الشحنات والطرود بدءاً من الاستلام من المستودع، التجميع على خطوط السير، إثبات التسليم بالتوقيع والصورة e-POD، ومراقبة نفقات الوقود والصيانة.",
    challenges: [
      "صعوبة تتبع موقع وحالة الشحنات لحظياً للعملاء",
      "فقدان إثباتات التسليم الورقية وبطء تسوية مبالغ الدفع عند الاستلام COD",
      "ارتفاع تكاليف الوقود واستهلاك المركبات دون رقابة",
      "تأخر فوترة العملاء عن رسوم التخزين والنقل الشهري",
    ],
    bundleModules: ["core", "logistics", "wms", "finance"],
    metrics: [
      { label: "توليد بوليصة الشحن AWB", value: "فوري بالباركود" },
      { label: "تسوية مبالغ COD", value: "مطابقة يومية" },
      { label: "إثبات التسليم e-POD", value: "توقيع وصورة" },
    ],
    sampleWorkflows: [
      "توليد بوليصة الشحن AWB مع باركود التتبع",
      "تعيين الشحنات لمركبات الأسطول وسائقي التوزيع",
      "تسليم الشحنة للعميل وتوقيع إثبات الاستلام الرقمي e-POD",
      "توريد المبالغ المحصلة لخزينة الشركة وإغلاق عهدة السائق",
    ],
  },
  {
    id: "mfg",
    icon: Factory,
    name: "التصنيع الميكانيكي، التجميع، والأغذية",
    nameEn: "Manufacturing & Assembly",
    tagline: "شجرة المنتج متعددة المستويات (BOM)، أوامر التشغيل، تخطيط الاحتياجات (MRP)، وكفاءة OEE.",
    badge: "تصنيع وإنتاج",
    description:
      "تخطيط دورة التصنيع بدءاً من صرف المواد الخام، مراكز العمل، تتبع مراحل التجميع، رقابة الجودة ونقاط HACCP، وحتى احتساب تكلفة المنتج التام بدقة متناهية.",
    challenges: [
      "عدم معرفة التكلفة الحقيقية للمنتج بعد احتساب العمالة والكهرباء",
      "توقف خطوط الإنتاج بسبب نفاد مكون بسيط من شجرة المنتج",
      "صعوبة قياس كفاءة ماكينات الصالة وأسباب التوقف والأعطال",
      "تتبع التشغيلات العكسي في حالة استدعاء دفعة معيبة (Recall)",
    ],
    bundleModules: ["core", "mfg", "inventory", "purchases", "finance"],
    metrics: [
      { label: "مراقبة كفاءة المعدات OEE", value: "لحظية" },
      { label: "شجرة المواد BOM", value: "متعددة المستويات" },
      { label: "تتبع التشغيلات العكسي", value: "مطابق لمعايير ISO" },
    ],
    sampleWorkflows: [
      "إنشاء أمر الإنتاج بناءً على طلبيات العملاء المؤكدة",
      "صرف المواد الخام من مستودع الأجزاء بناءً على شجرة BOM",
      "تسجيل ساعات تشغيل الماكينة وأوقات الصيانة الوقائية",
      "فحص الجودة وتسليم المنتج النهائي لمستودع البضاعة الجاهزة",
    ],
  },
  {
    id: "construction",
    icon: HardHat,
    name: "المقاولات العامة والإنشاءات الهندسية",
    nameEn: "Construction & Contracting",
    tagline: "جداول الكميات (BOQ)، مستخلصات التنفيذ (IPC)، أوامر التغيير، وإدارة المعدات الثقيلة.",
    badge: "مقاولات وإنشاءات",
    description:
      "إدارة شاملة للمشاريع الهندسية ومواقع البناء، تربط استهلاك خامات الموقع، مستخلصات مقاولي الباطن والمالك، بنود حسن التنفيذ، وتكلفة ساعات تشغيل المعدات.",
    challenges: [
      "تجاوز التكاليف الفعلية للميزانية التقديرية المعتمدة للمشروع",
      "تأخر اعتماد مستخلصات التنفيذ وتتبع الاستقطاعات وحسن التنفيذ",
      "صعوبة مراقبة كميات الأسمنت والحديد المستهلكة في الموقع",
      "تسوية حسابات مقاولي الباطن والعمالة اليومية",
    ],
    bundleModules: ["core", "cst", "inventory", "purchases", "finance", "hr"],
    metrics: [
      { label: "تتبع انحراف الميزانية BOQ", value: "لحظي لكل بند" },
      { label: "إصدار المستخلص IPC", value: "معتمد رقمياً" },
      { label: "مراقبة معدات الموقع", value: "ساعات تشغيل ووقود" },
    ],
    sampleWorkflows: [
      "رفع جدول الكميات المعتمد BOQ وتوزيعه على مراحل التنفيذ",
      "صرف مواد البناء لموقع المشروع بموجب إذن صرف هندسي",
      "إصدار مستخلص التنفيذ الدوري للمالك بنسب الإنجاز الفعلية",
      "تسوية مستحقات مقاولي الباطن بعد خصم الدفعات المقدمة",
    ],
  },
];

export default function IndustriesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryProfile>(INDUSTRIES[0]);

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-16 space-y-16">
        {/* Header */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="outline" className="bg-brand/10 text-brand">
            حلول متخصصة لكل قطاع
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto">
            منظومة ميزان ERP مصممة لتفهم لغة نشاطك التجاري
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            سواء كنت تدير سوبرماركت، سلسلة مطاعم، مجمعاً طبياً، أو مصنعاً، نوفر لك حزمة موديولات مسبقة
            الضبط تلبي احتياجاتك التشغيلية دون الحاجة لتطوير مكلف.
          </p>
        </div>

        {/* Industry Selector Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              const isSelected = selectedIndustry.id === ind.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all ${
                    isSelected
                      ? "border-brand bg-brand/10 text-brand ring-2 ring-brand/20 shadow-xs dark:bg-brand/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <div
                    className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-brand text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold leading-tight line-clamp-2">
                    {ind.name.split("،")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Industry Deep Dive Profile */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndustry.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-8"
            >
              {/* Profile Top Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/25">
                    <selectedIndustry.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-brand/10 text-brand text-[10px]">
                        {selectedIndustry.badge}
                      </Badge>
                      <span className="font-mono text-xs text-slate-400">
                        {selectedIndustry.nameEn}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedIndustry.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-brand text-xs font-bold text-white hover:bg-brand/90"
                    render={<Link to="/signup" />}
                    nativeButton={false}
                  >
                    بدء تجربة باقة {selectedIndustry.name.split("،")[0]}
                  </Button>
                </div>
              </div>

              {/* Tagline & Description */}
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {selectedIndustry.tagline}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedIndustry.description}
                </p>
              </div>

              {/* Key Metrics Counters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60 text-center">
                {selectedIndustry.metrics.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-2xl font-black font-mono text-brand">{m.value}</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Two Column Grid: Challenges vs Workflow */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Column 1: Challenges Solved */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                    تحديات تشغيلية تحلها المنظومة:
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {selectedIndustry.challenges.map((ch, idx) => (
                      <li key={idx} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                        <span className="text-rose-500 font-bold">✗</span>
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Typical Workflow */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    دورة العمل القياسية المؤتمتة:
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {selectedIndustry.sampleWorkflows.map((wf, idx) => (
                      <li key={idx} className="flex items-start gap-2 rounded-lg bg-emerald-50/50 p-2.5 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300">
                        <span className="text-emerald-600 font-bold font-mono">0{idx + 1}.</span>
                        <span>{wf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Included Modules Badge List */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  الموديولات النشطة في هذه الباقة:
                </span>
                {selectedIndustry.bundleModules.map((modId) => (
                  <Badge key={modId} variant="outline" className="font-mono text-[10px]">
                    {modId}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MarketingLayout>
  );
}
