import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Server,
  ShieldCheck,
  Printer,
  Laptop,
  Network,
  Dumbbell,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Stethoscope,
  Briefcase,
  ArrowLeft,
  Layers,
  Search,
  Cpu,
} from "lucide-react";
import { PLANS, DEPLOYMENT_MODES } from "./plans";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";

/* Industry vertical data */
const INDUSTRY_VERTICALS = [
  {
    id: "gym",
    icon: Dumbbell,
    name: "صالات الجيم واللياقة",
    subtitle: "إدارة اشتراكات، بوابات دخول، وكافيتيريا رياضية",
    collection: "gym-pos",
    badge: "كوليكشن متخصص",
    description:
      "منظومة متكاملة لنوادي اللياقة البدنية والكروس فيت، تدمج إدارة الاشتراكات الدورية، ربط بوابات الدخول الإلكترونية، جلسات التدريب الخاص (PT)، ونقاط بيع كافيتيريا المكملات الغذائية.",
    metrics: [
      { label: "دقة تجديد العضويات", value: "100%" },
      { label: "تسجيل دخول المشترك", value: "< ثانية واحدة" },
      { label: "تقارير الحضور والتردد", value: "لحظية" },
    ],
    features: [
      "إدارة العضويات الشهرية، الربع سنوية، والسنوية مع تنبيهات تلقائية قبل الانتهاء",
      "إيقاف وتجميد مؤقت للاشتراك (Freeze) وفق سياسات محددة",
      "كوليكشن Gym-POS سريع للمشروبات والمكملات مع الخصم الفوري من رصيد العضو",
      "توزيع عمولات المدربين وحصص التدريب الشخصي (PT)",
      "ربط بوابات الدخول الدوارة وبطاقات RFID / الباركود",
    ],
  },
  {
    id: "restaurant",
    icon: UtensilsCrossed,
    name: "المطاعم والكافيهات",
    subtitle: "شاشات مطبخ KDS، إدارة صالة، وتجزئة شيكات",
    collection: "restaurant-pos",
    badge: "كوليكشن متخصص",
    description:
      "شاشات طلبات سريعة للمطاعم والكافيهات، تدعم تنظيم الطاولات، إرسال الطلبات لحظياً لشاشات المطبخ (KDS) وطابعات البون، دليفري وسفري، مع تفكيك المكونات وحساب تكلفة الأطباق.",
    metrics: [
      { label: "سرعة ترحيل الطلب للمطبخ", value: "لحظية" },
      { label: "مرونة تجزئة الفاتورة", value: "طاولة / ضيف" },
      { label: "دعم طابعات البون", value: "80mm / 58mm" },
    ],
    features: [
      "شاشة مطبخ تفاعلية (KDS) تصنف الطلبات وتتابع توقيت التحضير لكل طاولة",
      "إدارة خريطة الطاولات وحالة كل طاولة (فارغة، مشغولة، قيد التحاسب)",
      "تجزئة الشيك (Split Bill) بين رواد الطاولة والدفع بعدة وسائل مقسمة",
      "إدارة طلبات الدليفري وتعيين الطيارين ومتابعة أوقات التوصيل",
      "خصم تلقائي لمكونات الوجبات من مستودع الأغذية والمشروبات",
    ],
  },
  {
    id: "retail",
    icon: ShoppingBag,
    name: "محلات التجزئة والسوبرماركت",
    subtitle: "ماسح باركود، موازين، وجرد لحظي للمخزون",
    collection: "retail-pos",
    badge: "كوليكشن متخصص",
    description:
      "محطة بيع سريعة مصممة للسوبرماركت، معارض الأدوات، ومحلات التجزئة. استجابة فورية لقوارئ الباركود، ربط الموازين الإلكترونية، فواتير ضريبية سريعة، وتنبيهات نواقص المخزون.",
    metrics: [
      { label: "سرعة إصدار الفاتورة", value: "أقل من 3 ثوانٍ" },
      { label: "مطابقة رصيد المستودع", value: "لحظية بالباركود" },
      { label: "دعم الأوزان والباركود المتغير", value: "مدعوم بالكامل" },
    ],
    features: [
      "دعم قراءة باركود الأوزان للمواد الطازجة واللحوم والمخبوزات تلقائياً",
      "بيع آجل، دفع مقسم (نقدي / بطاقة / محفظة إلكترونية)، وعروض أسعار",
      "تنبيهات حد إعادة الطلب للأصناف الحرجة قبل نفادها من الأرفف",
      "جرد مخزني دوري باستخدام أجهزة الجرد الكفية والماسح الضوئي",
      "طباعة بطاقات الأسعار والباركود الحراري للأصناف الجديدة",
    ],
  },
  {
    id: "school",
    icon: GraduationCap,
    name: "المدارس والمراكز التعليمية",
    subtitle: "شؤون الطلاب، أقساط، ورسوم حافلات",
    collection: "school",
    badge: "وحدة أكاديمية",
    description:
      "منظومة متخصصة لإدارة شؤون الطلاب، خطط الأقساط الدراسية، متابعة سداد المصروفات، رسوم الزي المدرسي والكتب وحافلات النقل، مع إصدار إيصالات دفع إلكترونية معتمدة.",
    metrics: [
      { label: "متابعة متأخرات الأقساط", value: "دقيقة 100%" },
      { label: "إيصالات رسوم ضريبية", value: "معتمدة فوراً" },
      { label: "إدارة خطوط الحافلات", value: "منظمة ومحدثة" },
    ],
    features: [
      "سجلات الطلاب الشاملة مع توزيع الصفوف والمراحل الدراسية",
      "جدولة الأقساط المدرسية على دفعات منتظمة مع كشوف حساب لكل ولي أمر",
      "إصدار إيصالات قبض الرسوم الدراسية وأنشطة الأكاديمية",
      "إدارة رسوم النقل المدرسي والحافلات واشتراكات الأنشطة الإضافية",
      "تقارير التدفق المالي للمصروفات ونسب التحصيل الشهرية والسنوية",
    ],
  },
  {
    id: "healthcare",
    icon: Stethoscope,
    name: "المراكز الطبية والعيادات",
    subtitle: "ملفات مرضى، حجز مواعيد، وصيدلية العيادة",
    collection: "healthcare",
    badge: "وحدة رعاية صحية",
    description:
      "نظام لإدارة المراكز الطبية والعيادات التخصصية، يجمع بين سجلات المرضى الإلكترونية، جداول مواعيد الأطباء، روشتات الفحص، وفواتير الخدمات الطبية ومستلزمات الصيدلية.",
    metrics: [
      { label: "أمان وسرية ملف المريض", value: "مشفر بالكامل" },
      { label: "حجز وتنظيم المواعيد", value: "بدون تداخل" },
      { label: "صرف الروشتات والمستلزمات", value: "مباشر ومترابط" },
    ],
    features: [
      "ملف إلكتروني شامل لكل مريض يتضمن التاريخ المرضي والملاحظات الطبية",
      "حجز وإدارة مواعيد العيادات مع تصنيف الكشوفات والاستشارات",
      "إصدار فواتير الخدمات الطبية والفحوصات المعملية",
      "متابعة صيدلية العيادة والمستهلكات الطبية ومطابقة التواريخ والصلاحية",
      "تقارير حسابات الأطباء والنسب المالية لكل استشاري",
    ],
  },
  {
    id: "services",
    icon: Briefcase,
    name: "المقاولات وشركات الخدمات",
    subtitle: "فواتير مشاريع، عقود، وتتبع تكاليف ميدانية",
    collection: "services",
    badge: "وحدة خدمات",
    description:
      "إدارة عقود المشاريع الخدمية والهندسية، متابعة مراكز التكلفة، أوامر الشغل الميدانية، وتدفق المستخلصات المالية للمشاريع خطوة بخطوة مع تقارير أرباح المشروعات.",
    metrics: [
      { label: "مراقبة تكلفة المشروع", value: "مباشرة ولحظية" },
      { label: "دقة مستخلصات العملاء", value: "معتمدة وشفافة" },
      { label: "تتبع عقود الصيانة", value: "تنبيهات استباقية" },
    ],
    features: [
      "فتح ملف لكل مشروع وربط المصروفات والمشتريات بمركز تكلفة محدد",
      "إصدار مستخلصات وفواتير الإنجاز بمراحل تسليم معتمدة",
      "متابعة عقود الصيانة الدورية وجداول الزيارات الميدانية",
      "تسجيل ساعات عمل الفنيين وتكاليف المواد المستهلكة في كل موقع",
      "تحليل صافي ربحية كل مشروع مقارنة بالميزانية التقديرية",
    ],
  },
];

/* Modular architecture categories */
const MODULE_CATEGORIES = [
  {
    id: "pos",
    name: "نقاط البيع والمبيعات",
    modules: [
      { code: "gym-pos", name: "Gym-POS", desc: "كاشير الصالات الرياضية، الاشتراكات والمكملات" },
      { code: "restaurant-pos", name: "Restaurant-POS", desc: "كاشير المطاعم، الطاولات، وشاشات المطبخ KDS" },
      { code: "retail-pos", name: "Retail-POS", desc: "كاشير السوبرماركت والتجزئة مع الموازين والباركود" },
      { code: "invoicing", name: "الفواتير والمبيعات", desc: "عروض أسعار، فواتير ضريبية، مرتجعات، وذمم العملاء" },
    ],
  },
  {
    id: "inventory",
    name: "المستودعات والمخزون",
    modules: [
      { code: "inventory", name: "إدارة المخزون اللحظي", desc: "أرصدة الفروع، حد الطلب، والتحويلات الداخلية" },
      { code: "purchases", name: "المشتريات والموردين", desc: "أوامر الشراء، الاستلام المخزني، وسجلات ديون الموردين" },
    ],
  },
  {
    id: "finance",
    name: "المالية والخزائن",
    modules: [
      { code: "safes", name: "الخزائن والمحافظ", desc: "إدارة السيولة النقدية، الحسابات البنكية، والتحويلات" },
      { code: "ledger", name: "الدفاتر المحاسبية", desc: "قيود اليومية، ميزان المراجعة، ومراكز التكلفة" },
    ],
  },
  {
    id: "hr",
    name: "رأس المال البشري HR",
    modules: [
      { code: "employees", name: "الموظفون والورديات", desc: "سجلات العاملين، مناوبات العمل، والحضور والانصراف" },
      { code: "payroll", name: "مسيرات الأجور والرواتب", desc: "احتساب البدلات والخصومات وصرف الرواتب الشهرية" },
    ],
  },
  {
    id: "specialized",
    name: "القطاعات المتخصصة",
    modules: [
      { code: "school", name: "المدارس والطلاب", desc: "شؤون الدارسين، جداول الأقساط المدرسية، والحافلات" },
      { code: "healthcare", name: "العيادات والصحة", desc: "ملفات المرضى، حجز المواعيد، وروشتات الأطباء" },
      { code: "services", name: "المشاريع والخدمات", desc: "عقود المشروعات، أوامر الشغل، وتكاليف العمليات" },
    ],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState<string>("gym");
  const [selectedDeployment, setSelectedDeployment] = useState<string>("saas");
  const [selectedCategory, setSelectedCategory] = useState<string>("pos");
  const [searchSlug, setSearchSlug] = useState("");
  const [searchError, setSearchError] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const activeIndustry =
    INDUSTRY_VERTICALS.find((v) => v.id === selectedIndustry) ?? INDUSTRY_VERTICALS[0];
  const activeDeployment =
    DEPLOYMENT_MODES.find((d) => d.id === selectedDeployment) ?? DEPLOYMENT_MODES[0];
  const activeCategory =
    MODULE_CATEGORIES.find((c) => c.id === selectedCategory) ?? MODULE_CATEGORIES[0];

  function handleNavigateSlug(e: React.FormEvent) {
    e.preventDefault();
    const clean = searchSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!clean) {
      setSearchError("يرجى إدخال اسم المنشأة أو الرابط الخاص بها");
      return;
    }
    navigate(`/${clean}`);
  }

  return (
    <div className="min-h-svh bg-background text-foreground selection:bg-primary/20" dir="rtl">
      {/* Official Top Announcement Bar */}
      <div className="border-b bg-muted/40 px-4 py-2 text-center text-xs font-medium text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>منصة Vendora ERP جاهزة للتشغيل السحابي أو المكتبي المستقل (Offline .exe)</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admoon"
              className="flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <ShieldCheck className="size-3.5" />
              <span>بوابة المشرف العام (Admoon)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Official Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-xl shadow-xs">
                V
              </span>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">Vendora ERP</span>
                <span className="text-[10px] text-muted-foreground font-medium">المنظومة السحابية المتكاملة</span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <a href="#industries" className="rounded-lg px-3 py-2 transition hover:text-foreground">
                حلول القطاعات
              </a>
              <a href="#deployments" className="rounded-lg px-3 py-2 transition hover:text-foreground">
                بيئات الاستضافة
              </a>
              <a href="#modules" className="rounded-lg px-3 py-2 transition hover:text-foreground">
                معمارية الوحدات
              </a>
              <a href="#printing" className="rounded-lg px-3 py-2 transition hover:text-foreground">
                محرك الطباعة
              </a>
              <a href="#pricing" className="rounded-lg px-3 py-2 transition hover:text-foreground">
                الخطط والأسعار
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              تسجيل الدخول
            </Link>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link to="/signup" />}
              className="font-semibold shadow-xs"
            >
              <span>ابدأ مساحة عملك</span>
              <ArrowLeft className="size-4 mr-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/30 via-background to-background py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="mx-auto flex justify-center">
            <Badge variant="secondary" className="mb-6 gap-2 px-3 py-1.5 text-xs font-semibold">
              <Layers className="size-3.5 text-primary" />
              <span>منظومة ERP متعددة المستأجرين والصناعات · Multi-Tenant Architecture</span>
            </Badge>
          </div>

          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-black tracking-tight sm:text-6xl sm:leading-[1.15]">
            المنظومة المتكاملة لإدارة وتخطيط الموارد — لكل قطاع ولكل بيئة تشغيل
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl">
            سواء كنت تدير نادياً رياضياً، سلسلة مطاعم، مجمع تجزئة وسوبرماركت، أو صرحاً تعليمياً: تمنحك <strong className="text-foreground">Vendora ERP</strong> بنية تشغيل صلبة تعمل سحابياً بالكامل، أو عبر شبكة محلية LAN، أو بتطبيق مكتبي مستقل بلا إنترنت (Offline .exe)، مع عزل تام لقواعد البيانات ومحرك طباعة إيصالات احترافي.
          </p>

          {/* Quick CTA Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link to="/signup" />}
              className="px-6 font-bold shadow-md"
            >
              <span>ابدأ تجربتك المجانية (14 يوماً)</span>
              <ArrowLeft className="size-5 mr-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href="#industries" />}
              className="font-semibold"
            >
              استكشف حلول قطاعك
            </Button>
            <Button
              size="lg"
              variant="ghost"
              nativeButton={false}
              render={<Link to="/admoon" />}
              className="font-semibold text-muted-foreground hover:text-foreground"
            >
              <ShieldCheck className="size-4 ml-1.5 text-primary" />
              <span>لوحة تحكم Admoon</span>
            </Button>
          </div>

          {/* Platform Trust Highlights */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="num text-2xl font-black text-foreground">14+</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">وحدة نمطية قابلة للإضافة</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="num text-2xl font-black text-foreground">4</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">بيئات استضافة ونشر مرنة</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="num text-2xl font-black text-foreground">5</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">محركات قواعد بيانات مدعومة</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="num text-2xl font-black text-foreground">100%</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">عزل أمني تام لبيانات المنشآت</div>
            </div>
          </div>

          {/* Direct Tenant Slug Resolver Bar */}
          <div className="mx-auto mt-14 max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-right">
              <Search className="size-4 text-primary" />
              <span className="text-sm font-bold text-foreground">هل تمتلك مساحة عمل مسجلة بالفعل؟</span>
              <span className="text-xs text-muted-foreground">(ادخل مباشرة عبر رابط منشأتك)</span>
            </div>
            <form onSubmit={handleNavigateSlug} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-xs font-mono">
                  vendora.com/
                </div>
                <input
                  type="text"
                  value={searchSlug}
                  onChange={(e) => {
                    setSearchSlug(e.target.value);
                    setSearchError("");
                  }}
                  placeholder="مثال: monset-gym أو albaraka"
                  className="w-full rounded-xl border bg-background pr-28 pl-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto font-semibold shrink-0">
                <span>دخول مساحة العمل</span>
                <ArrowLeft className="size-4 mr-1.5" />
              </Button>
            </form>
            {searchError && (
              <p className="mt-2 text-xs font-medium text-destructive text-right">{searchError}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground justify-start">
              <span>جرّب مساحات عمل استعراضية:</span>
              <button
                type="button"
                onClick={() => navigate("/monset-gym")}
                className="rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
                dir="ltr"
              >
                monset-gym
              </button>
              <button
                type="button"
                onClick={() => navigate("/demo-restaurant")}
                className="rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
                dir="ltr"
              >
                demo-restaurant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Verticals Section */}
      <section id="industries" className="py-20 lg:py-28 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-3 font-semibold">حلول متخصصة لكل صناعة</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              تكيّف حقيقي مع متطلبات مجالك وليس مجرد نموذج افتراضي عام
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              تأتي منصة Vendora مزودة بكوليكشنات جاهزة مخصصة لكل نشاط تجاري، تمنحك شاشات واختصارات وسير عمل مفصلاً لطبيعة عملك اليومي.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {INDUSTRY_VERTICALS.map((ind) => {
              const Icon = ind.icon;
              const isSelected = ind.id === selectedIndustry;
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{ind.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Showcase Card */}
          <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-10 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <activeIndustry.icon className="size-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black">{activeIndustry.name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {activeIndustry.collection}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activeIndustry.subtitle}</p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
                  {activeIndustry.description}
                </p>

                {/* Features checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    المزايا التشغيلية المباشرة في هذا الكوليكشن:
                  </h4>
                  <ul className="grid gap-2.5 sm:grid-cols-1">
                    {activeIndustry.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-1" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Button nativeButton={false} render={<Link to="/signup" />} className="font-semibold">
                    <span>تشغيل مساحة عمل لهذا النشاط</span>
                    <ArrowLeft className="size-4 mr-1.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/${activeIndustry.id === "gym" ? "monset-gym" : "demo"}`)}
                    className="font-semibold"
                  >
                    معاينة تجريبية حية
                  </Button>
                </div>
              </div>

              {/* Metrics sidebar */}
              <div className="lg:col-span-5 rounded-xl border bg-muted/30 p-6 space-y-6">
                <h4 className="text-sm font-bold text-foreground">مؤشرات الأداء والكفاءة الميدانية</h4>
                <div className="grid gap-4">
                  {activeIndustry.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg border bg-background p-4 shadow-2xs">
                      <div className="num text-2xl font-black text-primary">{m.value}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground block mb-1">
                    جاهز مع بيانات افتراضية فورية:
                  </span>
                  عند إنشاء حسابك واختيار هذا النشاط، يقوم معالج Vendora بتهيئة شجرة الحسابات، تصنيفات الأصناف، وإعدادات الكاشير المناسبة تلقائياً دون الحاجة لإدخال يدوي مجهد.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Modes Section */}
      <section id="deployments" className="py-20 lg:py-28 border-b bg-muted/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-3 font-semibold">مرونة معمارية لا مثيل لها</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              اختر بيئة الاستضافة التي تلائم ظروف عملك وبنيتك التحتية
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              لا نفرض عليك استضافة سحابية إجبارية إذا كانت طبيعة منشأتك تتطلب العمل في بيئة معزولة دون إنترنت أو عبر شبكة محلية LAN خاصة.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DEPLOYMENT_MODES.map((d) => {
              const isSelected = d.id === selectedDeployment;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDeployment(d.id)}
                  className={`cursor-pointer rounded-2xl border bg-card p-6 transition flex flex-col justify-between ${
                    isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "hover:border-primary/50"
                  }`}
                >
                  <div>
                    <Badge variant={isSelected ? "default" : "outline"} className="mb-3 font-semibold text-xs">
                      {d.badge}
                    </Badge>
                    <h3 className="text-lg font-bold">{d.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground min-h-[32px]">{d.tagline}</p>

                    <ul className="mt-6 flex flex-col gap-2 text-xs">
                      {d.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <span className="text-xs font-semibold text-primary flex items-center justify-between">
                      <span>{isSelected ? "البيئة المحددة حالياً" : "اضغط للمعاينة"}</span>
                      <ArrowLeft className="size-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Deployment Details Banner */}
          <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                  {selectedDeployment === "offline" ? (
                    <Laptop className="size-6" />
                  ) : selectedDeployment === "lan" ? (
                    <Network className="size-6" />
                  ) : selectedDeployment === "vps" ? (
                    <Server className="size-6" />
                  ) : (
                    <Cpu className="size-6" />
                  )}
                </span>
                <div>
                  <h4 className="text-base font-bold">
                    معمارية النشر: {activeDeployment.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeDeployment.tagline} — مدعومة بالكامل ضمن بروتوكولات تحكم المشرف العام Admoon.
                  </p>
                </div>
              </div>
              <Button nativeButton={false} render={<Link to="/signup" />} className="font-semibold shrink-0">
                طلب تهيئة هذه البيئة
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pluggable Modular Architecture Section */}
      <section id="modules" className="py-20 lg:py-28 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-3 font-semibold">بنية التطبيقات المرنة</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              14+ وحدة نمطية تعمل بتناغم تام — فعّل ما تحتاجه فقط
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              صممت منظومة Vendora Modular Engine لتتيح لكل شركة تشغيل الوحدات النمطية التي تخدم نشاطها فقط، مع الاحتفاظ بإمكانية التوسع والتفعيل بضغطة زر دون إعادة تثبيت النظام.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {MODULE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Module Cards Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeCategory.modules.map((m) => (
              <div key={m.code} className="rounded-xl border bg-card p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {m.code}
                  </span>
                  <span className="flex size-2 rounded-full bg-emerald-500" title="جاهز للتشغيل" />
                </div>
                <h4 className="mt-3 font-bold text-sm text-foreground">{m.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>التوافق:</span>
                  <span className="font-medium text-foreground">Cloud / LAN / Offline</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Printing & Hardware Engine Section */}
      <section id="printing" className="py-20 lg:py-28 border-b bg-muted/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <Badge variant="secondary" className="gap-1.5 font-semibold">
                <Printer className="size-3.5 text-primary" />
                محرك الطباعة والعتاد (Printing Engine)
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                طباعة إيصالات حرارية وفواتير ضريبية بدون وسيط أو تعريفات معقدة
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                يحتوي نظام Vendora على محرك طباعة مستقل (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">engines/printing</code>) مهيأ بالكامل لإصدار إيصالات نقاط البيع الحرارية بمقاسي 80mm و58mm مع محاذاة النص العربي، QR Code، ونبضات فتح درج النقدية التلقائي.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">دعم طابعات البون الحرارية (ESC/POS)</h4>
                    <p className="text-xs text-muted-foreground">
                      ربط مباشر عبر USB، Network (TCP/IP)، أو Bluetooth مع دعم قص الورق وفتح الدرج.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">فواتير ضريبية قياس A4 معتمدة</h4>
                    <p className="text-xs text-muted-foreground">
                      قوالب فواتير رسمية للشركات والموردين والمستخلصات مزودة ببيانات السجل التجاري والضريبي.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">طباعة ملصقات الباركود والأسعار</h4>
                    <p className="text-xs text-muted-foreground">
                      توليد وطباعة باركود الأصناف وتواريخ الصلاحية مباشرة على طابعات الملصقات الحرارية.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button nativeButton={false} render={<Link to="/signup" />} className="font-semibold">
                  <span>تجربة محرك الطباعة في نظامك</span>
                  <ArrowLeft className="size-4 mr-1.5" />
                </Button>
              </div>
            </div>

            {/* Thermal Receipt Visual Preview Box */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl relative overflow-hidden font-mono text-xs">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                
                {/* Simulated thermal receipt content */}
                <div className="text-center pb-4 border-b border-dashed border-border space-y-1">
                  <div className="text-base font-black tracking-tight text-foreground font-sans">
                    VENDORA ERP · فندق ومطعم الواحة
                  </div>
                  <div className="text-[11px] text-muted-foreground">فرع التجمع الخامس — القاهرة</div>
                  <div className="text-[11px] text-muted-foreground">الرقم الضريبي: 394-821-492</div>
                  <div className="text-[10px] text-muted-foreground pt-1">فاتورة ضريبية مبسطة #INV-2026-0814</div>
                </div>

                <div className="py-3 border-b border-dashed border-border text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>التاريخ: {new Date().toLocaleDateString("ar-EG")}</span>
                    <span>الكاشير: عمر محمود</span>
                  </div>
                  <div className="flex justify-between">
                    <span>النوع: صالة (طاولة 12)</span>
                    <span>الوقت: 14:32</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-3 border-b border-dashed border-border space-y-2">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>الصنف</span>
                    <span>الكمية × السعر = الإجمالي</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>وجبة ميكس جريل عائلي</span>
                    <span>1 × 450.00 = 450.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>سلطات ومقبلات مشكلة</span>
                    <span>2 × 45.00 = 90.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>عصير برتقال فريش</span>
                    <span>3 × 35.00 = 105.00</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="py-3 border-b border-dashed border-border space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>المجموع قبل الضريبة:</span>
                    <span className="font-bold text-foreground">645.00 ج.م</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ضريبة القيمة المضافة (14%):</span>
                    <span className="font-bold text-foreground">90.30 ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-foreground pt-1 border-t">
                    <span>الإجمالي النهائي المستحق:</span>
                    <span className="text-primary font-black">735.30 ج.م</span>
                  </div>
                </div>

                {/* Simulated QR Code box */}
                <div className="pt-4 text-center space-y-2">
                  <div className="mx-auto size-24 border border-dashed rounded-lg bg-muted/40 grid place-items-center text-[9px] text-muted-foreground">
                    [ رمز استجابة QR معتمد ]
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    شكراً لزيارتكم · معتمد لدى هيئة الضرائب العامة
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-3 font-semibold">باقات واضحة وبلا مفاجآت</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              استثمر في نظام ينمو مع حجم أرباحك وتوسعك
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              ابدأ اليوم بـ <strong className="text-foreground">14 يوماً مجاناً</strong> بدون بطاقة ائتمانية، واختر باقتك وقتما تشاء.
            </p>

            {/* Billing Switcher */}
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center rounded-xl border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                    billingCycle === "monthly"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  الدفع الشهري
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                    billingCycle === "annual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>الدفع السنوي</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    وفّر شهرين (17%)
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => {
              const price = billingCycle === "monthly" ? p.price_egp : Math.round(p.price_annual_egp / 12);
              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 transition hover:shadow-md ${
                    p.popular ? "border-primary ring-2 ring-primary/20 shadow-md" : ""
                  }`}
                >
                  {p.popular && (
                    <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground font-semibold text-xs">
                      الأكثر طلباً
                    </Badge>
                  )}

                  <div>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground min-h-[32px]">{p.tagline}</p>

                    <div className="mt-5 border-t border-b py-4">
                      <div className="flex items-baseline gap-1">
                        {price === 0 ? (
                          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            مجاناً
                          </span>
                        ) : (
                          <>
                            <span className="num text-4xl font-black tracking-tight">{price.toLocaleString("en-US")}</span>
                            <span className="text-xs font-semibold text-muted-foreground mr-1">ج.م / شهرياً</span>
                          </>
                        )}
                      </div>
                      {billingCycle === "annual" && p.price_annual_egp > 0 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          تُدفع سنوياً بقيمة <span className="num font-semibold">{p.price_annual_egp.toLocaleString("en-US")} ج.م</span>
                        </p>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="mt-5">
                      <ul className="flex flex-col gap-2 text-xs">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-foreground/90">
                            <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t">
                    <Button
                      variant={p.popular ? "default" : "outline"}
                      className="w-full font-semibold"
                      nativeButton={false}
                      render={<Link to="/signup" />}
                    >
                      <span>ابدأ تجربتك</span>
                      <ArrowLeft className="size-4 mr-1.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/pricing"
              className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
            >
              عرض جدول مقارنة المزايا الكامل وحساب التكاليف المخصصة ←
            </Link>
          </div>
        </div>
      </section>

      {/* Control Plane & Security Spotlight (Admoon) */}
      <section className="py-16 border-b bg-gradient-to-r from-card via-background to-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border bg-muted/20 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="outline" className="gap-1.5 font-semibold text-xs border-primary/40 text-primary">
                <ShieldCheck className="size-3.5" />
                مركز تحكم المنصة والمشرف العام (Admoon Control Plane)
              </Badge>
              <h3 className="text-2xl font-black tracking-tight">
                أنت تملك السيطرة الكاملة على كافة مستأجري وخوادم المنصة
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                لوحة تحكم مركزية مخصصة لمديري ومطوري منصة Vendora لإدارة اشتراكات الشركات، مراقبة استهلاك الموارد، مراجعة سجلات التدقيق الأمني (Audit Logs)، وتوليد تراخيص التشغيل المكتبي دون اتصال بضغطة زر.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="default"
                nativeButton={false}
                render={<Link to="/admoon" />}
                className="font-bold shadow-md"
              >
                <ShieldCheck className="size-4 ml-1.5" />
                <span>فتح بوابة Admoon</span>
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to="/admoon/tenants" />}
                className="font-semibold"
              >
                إدارة المستأجرين
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            جاهز لتحديث منظومة إدارة أعمالك اليوم؟
          </h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
            أنشئ مساحة عملك في أقل من دقيقة، اختر نشاطك التجاري، وستجد شاشاتك وبياناتك التجريبية جاهزة للعمل الفوري — بدون بطاقة دفع وبدعم فني كامل.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link to="/signup" />}
              className="px-8 font-bold shadow-md"
            >
              <span>ابدأ تجربتك المجانية الآن</span>
              <ArrowLeft className="size-5 mr-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link to="/login" />}
              className="font-semibold"
            >
              تسجيل الدخول للنظام
            </Button>
          </div>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="border-t bg-card py-12 text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
                  V
                </span>
                <span className="text-base font-bold text-foreground">Vendora ERP</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                منظومة تخطيط موارد المؤسسات المتطورة. تدعم السحابية، الشبكات المحلية، والتشغيل المكتبي المستقل لنوادي الجيم، المطاعم، المتاجر، والمؤسسات.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                حلول القطاعات
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#industries" className="hover:text-foreground">صالات الجيم واللياقة (Gym-POS)</a></li>
                <li><a href="#industries" className="hover:text-foreground">المطاعم والكافيهات (Restaurant-POS)</a></li>
                <li><a href="#industries" className="hover:text-foreground">التجزئة والسوبرماركت (Retail-POS)</a></li>
                <li><a href="#industries" className="hover:text-foreground">المدارس والأكاديميات التعليمية</a></li>
                <li><a href="#industries" className="hover:text-foreground">المراكز الطبية والعيادات</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                المنصة والتقنية
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#deployments" className="hover:text-foreground">بيئات التشغيل (Cloud, LAN, Offline)</a></li>
                <li><a href="#modules" className="hover:text-foreground">معمارية الوحدات النمطية (14+ Module)</a></li>
                <li><a href="#printing" className="hover:text-foreground">محرك الطباعة وعتاد الكاشير</a></li>
                <li><Link to="/pricing" className="hover:text-foreground">الخطط وباقات الاشتراك</Link></li>
                <li><Link to="/admoon" className="hover:text-foreground">مركز المشرف العام (Admoon)</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                الحساب والوصول
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/signup" className="hover:text-foreground">إنشاء مساحة عمل جديدة</Link></li>
                <li><Link to="/login" className="hover:text-foreground">تسجيل الدخول</Link></li>
                <li><Link to="/onboarding" className="hover:text-foreground">معالج تهيئة المنشأة</Link></li>
                <li><Link to="/admoon/login" className="hover:text-foreground">دخول إدارة المنصة</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Vendora Multi-Tenant SaaS ERP. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4">
              <span>الإصدار 3.2 المستقر</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">كافة الخوادم تعمل بكفاءة 100%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
