import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Search,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { MarketingLayout } from "./MarketingLayout";

interface FeatureItem {
  id: string;
  category: "pos" | "inventory" | "finance" | "clinic" | "restaurant" | "mfg" | "hardware";
  categoryLabel: string;
  title: string;
  titleEn: string;
  description: string;
  capabilities: string[];
  moduleName: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "pos-quick",
    category: "pos",
    categoryLabel: "نقاط البيع والكاشير",
    title: "محرك إصدار الفواتير الفائق (High-Velocity POS)",
    titleEn: "Instant Checkout Engine",
    description:
      "شاشة كاشير فائقة الاستجابة تتيح مسح الباركود، تطبيق الخصومات المصرح بها، إصدار الفاتورة الضريبية، وطباعة الإيصال الحراري في أقل من ثانيتين.",
    capabilities: [
      "دعم قراءة باركود الأوزان والباركود المتغير للمواد الطازجة",
      "تقسيم طرق الدفع (نقدي / فيزا / محفظة إلكترونية)",
      "تعليق الفواتير واستئنافها دون تأخير طوابير العملاء",
      "إدارة أدراج الكاشير وورديات الموظفين مع تقرير Z-Report",
    ],
    moduleName: "pos",
  },
  {
    id: "inv-wms",
    category: "inventory",
    categoryLabel: "المخزون والمستودعات",
    title: "إدارة المخازن المتعددة وتتبع الصلاحيات (FEFO)",
    titleEn: "Multi-Warehouse & Expiration Tracking",
    description:
      "تتبع لحظي لأرصدة الأصناف في الفروع والمستودعات، أذون الصرف والإضافة، التحويلات بين الفروع، وتسويات الجرد الدوري.",
    capabilities: [
      "تتبع أرقام التشغيلات وتواريخ انتهاء الصلاحية (First-Expired, First-Out)",
      "تنبيهات تلقائية عند اقتراب المخزون من حد إعادة الطلب",
      "أذون التحويل بين المستودعات مع تأكيد الاستلام من الطرفين",
      "جرد مخزني لحظي باستخدام قوارئ الباركود اللاسلكية",
    ],
    moduleName: "inventory",
  },
  {
    id: "fin-ledger",
    category: "finance",
    categoryLabel: "المالية والحسابات",
    title: "شجرة الحسابات والقيود المحاسبية التلقائية",
    titleEn: "Automated General Ledger & Chart of Accounts",
    description:
      "كشوف حسابات تفصيلية للعملاء والموردين، إدارة الخزائن والعهد البنكية، والترحيل التلقائي للقيود المحاسبية بنظام القيد المزدوج.",
    capabilities: [
      "إنشاء قيود يومية تلقائية فور تأكيد أي حركة بيع أو شراء أو استهلاك",
      "كشف حساب تفصيلي للعميل والمورد مع مطابقة الشيكات الآجلة",
      "ميزان المراجعة، قائمة الدخل، وتقارير الأرباح والخسائر اللحظية",
      "تسوية العهد النقدية ومطابقة أدراج الكاشير بنهاية الورديات",
    ],
    moduleName: "finance",
  },
  {
    id: "hardware-escpos",
    category: "hardware",
    categoryLabel: "العتاد والأجهزة",
    title: "طباعة الإيصالات الحرارية (80mm/58mm) ونبضة الدرج",
    titleEn: "Thermal Receipt Printing & Cash Drawer Solenoid",
    description:
      "توليد أوامر ESC/POS الثنائية المباشرة لطابعات الإيصالات الحرارية عبر USB والشبكة، مع فتح درج الكاشير ورمز ZATCA TLV المشفر.",
    capabilities: [
      "دعم مقاسي الورق القياسي (80 مم) والمدمج المحمول (58 مم)",
      "نبضة فتح درج النقدية الكهرومغناطيسي عبر منفذ RJ11/RJ12",
      "توليد رمز الاستجابة السريعة الضريبي ZATCA Phase 2 تلقائياً",
      "طباعة مباشرة من المتصفح بدون الحاجة لبرامج وسيطة",
    ],
    moduleName: "pos_hardware",
  },
  {
    id: "restaurant-kds",
    category: "restaurant",
    categoryLabel: "المطاعم والضيافة",
    title: "مخطط الصالة وشاشات المطبخ اللحظية (KDS)",
    titleEn: "Kitchen Display System & Table Floorplan",
    description:
      "إدارة حجز الطاولات، إرسال أوامر التحضير لشاشات المطبخ فورياً، تجزئة الشيكات بين رواد الطاولة، وخصم مكونات الأطباق الخام (BOM).",
    capabilities: [
      "شاشات مطبخ تفاعلية ملونة تصنف الطلبات وتحدد مدة التحضير",
      "مخطط تفاعلي لحالة الطاولات (مشغولة، فارغة، قيد التحاسب)",
      "تجزئة الشيك (Split Bill) بعدة طرق دفع مقسمة",
      "خصم مقادير الوجبة الخام من مستودع الأغذية تلقائياً (Backflushing)",
    ],
    moduleName: "restaurant",
  },
  {
    id: "clinic-emr",
    category: "clinic",
    categoryLabel: "الرعاية الصحية",
    title: "الملف الطبي الإلكتروني (EMR) والروشتات الرقمية",
    titleEn: "Electronic Medical Records & Digital Prescriptions",
    description:
      "منظومة متكاملة للعيادات والمراكز الطبية تربط حجز المواعيد، الفحص السريري، الروشتات الرقمية، والفحوصات المخبرية بصيدلية المركز.",
    capabilities: [
      "سجل طبي موحد لكل مريض يشمل التاريخ المرضي والأدوية المزمنة",
      "روشتة رقمية ذكية (e-Rx) تمنع التداخلات الدوائية الضارة",
      "جدول مواعيد الأطباء وغرف الكشف وتتبع أوقات الانتظار",
      "ربط فوري مع صيدلية المركز لصرف العلاج وخصم المخزون",
    ],
    moduleName: "clinic",
  },
  {
    id: "mfg-bom",
    category: "mfg",
    categoryLabel: "التصنيع والإنتاج",
    title: "شجرة المنتج متعددة المستويات ومؤشر كفاءة المعدات (OEE)",
    titleEn: "Bill of Materials (BOM) & Overall Equipment Effectiveness",
    description:
      "تخطيط وتتبع أوامر التشغيل والإنتاج الميكانيكي والغذائي، مسارات التشغيل، وصرف المواد الخام مع حساب تكلفة ساعة الماكينة.",
    capabilities: [
      "شجرة منتج (BOM) متعددة المستويات والمكونات البديلة",
      "متابعة كفاءة ماكينات خط الإنتاج الثلاثية (التوافر، الأداء، الجودة)",
      "أوامر تشغيل تسجل الفاقد والهالك ونقاط التحكم الحرجة (HACCP)",
      "حساب دقيق لتكلفة المنتج التام شاملة العمالة والمصروفات غير المباشرة",
    ],
    moduleName: "mfg",
  },
];

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "كافة المزايا" },
    { id: "pos", label: "نقاط البيع POS" },
    { id: "inventory", label: "المخزون WMS" },
    { id: "finance", label: "المالية والحسابات" },
    { id: "hardware", label: "العتاد والأجهزة" },
    { id: "restaurant", label: "المطاعم KDS" },
    { id: "clinic", label: "العيادات الطبية" },
    { id: "mfg", label: "التصنيع BOM" },
  ];

  const filteredFeatures = FEATURES.filter((feat) => {
    const matchesCat = selectedCategory === "all" || feat.category === selectedCategory;
    const matchesSearch =
      feat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-16 space-y-12">
        {/* Header */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="outline" className="bg-brand/10 text-brand">
            دليل المزايا والوظائف التشغيلية
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-3xl mx-auto">
            قدرات تشغيلية مصممة لأدق تفاصيل عملك
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            استكشف قدرات المنصة عبر كافة المجالات: الكاشير، المستودعات، الدفاتر المالية، الأجهزة
            الميدانية، والأنشطة المتخصصة.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-brand text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المزايا والوظائف..."
                className="w-full rounded-lg border border-slate-200 bg-white ps-9 pe-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-brand/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-[10px]">
                      {item.categoryLabel}
                    </Badge>
                    <span className="font-mono text-[10px] text-slate-400">
                      موديول: {item.moduleName}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.titleEn}</div>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      أهم الإمكانيات المعتمدة:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {item.capabilities.map((cap, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <Link
                    to="/signup"
                    className="font-bold text-brand hover:underline flex items-center gap-1"
                  >
                    <span>تجربة الموديول مجاناً</span>
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  </Link>
                  <Link to="/docs" className="text-slate-400 hover:text-slate-600 text-[11px]">
                    عرض التوثيق
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
