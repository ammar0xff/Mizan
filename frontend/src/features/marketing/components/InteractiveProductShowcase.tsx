import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Boxes,
  Wallet,
  Stethoscope,
  UtensilsCrossed,
  Factory,
  Printer,
  Barcode,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { sound } from "@/lib/sound";

export type ShowcaseTab = "pos" | "inventory" | "finance" | "clinic" | "restaurant" | "mfg";

interface TabDefinition {
  id: ShowcaseTab;
  title: string;
  titleEn: string;
  icon: any;
  tagline: string;
  badge: string;
}

const TABS: TabDefinition[] = [
  {
    id: "pos",
    title: "نقطة البيع السريعة",
    titleEn: "Point of Sale",
    icon: ShoppingCart,
    tagline: "إصدار فوري للفواتير بسرعة < 3 ثوانٍ مع دعم كامل لأجهزة الباركود والطباعة الحرارية",
    badge: "سرعة فائقة",
  },
  {
    id: "inventory",
    title: "المخزون والتوريد",
    titleEn: "Inventory & WMS",
    icon: Boxes,
    tagline: "تتبع لحظي للأرصدة في المستودعات المتعددة، تنبيهات انتهاء الصلاحية FEFO، وجرد باركود",
    badge: "متعدد الفروع",
  },
  {
    id: "finance",
    title: "المالية والحسابات",
    titleEn: "Finance & Ledgers",
    icon: Wallet,
    tagline: "كشوف حسابات العملاء والموردين، إدارة الخزائن والعهد، والقيود المحاسبية التلقائية",
    badge: "مطابقة مزدوجة",
  },
  {
    id: "clinic",
    title: "العيادات والمراكز الطبية",
    titleEn: "Clinic & Healthcare",
    icon: Stethoscope,
    tagline: "السجلات الطبية الإلكترونية (EMR)، الروشتات الرقمية، حجز المواعيد والكشوفات",
    badge: "رعاية صحية",
  },
  {
    id: "restaurant",
    title: "المطاعم وشاشات المطبخ",
    titleEn: "Restaurant & KDS",
    icon: UtensilsCrossed,
    tagline: "مخطط صالة الطعام، شاشات المطبخ اللحظية (KDS)، وتفكيك وصفات الأطباق الخام (BOM)",
    badge: "ضيافة وكافيهات",
  },
  {
    id: "mfg",
    title: "التصنيع وتخطيط الإنتاج",
    titleEn: "Manufacturing & BOM",
    icon: Factory,
    tagline: "شجرة المنتج متعددة المستويات، مسارات التشغيل، وأوامر الإنتاج مع مؤشر كفاءة OEE",
    badge: "صناعة وإنتاج",
  },
];

export function InteractiveProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("pos");
  const [posItemsCount, setPosItemsCount] = useState<number>(3);
  const [lastAction, setLastAction] = useState<string>("النظام جاهز");

  const handleTabChange = (tabId: ShowcaseTab) => {
    setActiveTab(tabId);
    try {
      sound.scan();
    } catch {}
  };

  const handleSimulateScan = () => {
    setPosItemsCount((prev) => prev + 1);
    setLastAction("تم مسح صنف جديد بالباركود: حليب طازج 1 لتر");
    try {
      sound.scan();
    } catch {}
  };

  const handleSimulatePrint = () => {
    setLastAction("تم إرسال أمر الطباعة الحرارية (80mm) ونبضة فتح درج الكاشير");
    try {
      sound.success();
    } catch {}
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/40">
      {/* Tab Selector Header */}
      <div className="border-b border-slate-200/80 p-3 dark:border-slate-800 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group relative flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all duration-200 ${
                  isActive
                    ? "bg-brand/10 text-brand shadow-sm ring-1 ring-brand/30 dark:bg-brand/20 dark:text-brand-light"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                    isActive
                      ? "bg-brand text-white shadow-md shadow-brand/25 dark:bg-brand"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold leading-tight sm:text-sm">{tab.title}</span>
                <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {tab.titleEn}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-[13px] h-1 w-12 rounded-full bg-brand sm:-bottom-[17px]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Showcase Area */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand/5 text-brand dark:bg-brand/20">
                {TABS.find((t) => t.id === activeTab)?.badge}
              </Badge>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                {TABS.find((t) => t.id === activeTab)?.title}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {TABS.find((t) => t.id === activeTab)?.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              حالة المحاكاة: {lastAction}
            </span>
          </div>
        </div>

        {/* Animated Tab Content Container */}
        <AnimatePresence mode="wait">
          {activeTab === "pos" && (
            <motion.div
              key="pos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-12"
            >
              {/* POS Left Column: Active Cart / Order Preview */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50 lg:col-span-7">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      سلة الكاشير الحالية (فاتورة #{posItemsCount * 142})
                    </span>
                    <Badge variant="success">الوردية مفتوحة • كاشير 01</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-xs dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-bold dark:bg-slate-800">
                          1×
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            جبنة بيضاء فيتا 500 جم
                          </div>
                          <div className="text-[10px] text-slate-400">باركود: 62210492810</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        45.00 ج.م
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-xs dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-bold dark:bg-slate-800">
                          2×
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            عصير برتقال طبيعي 1 لتر
                          </div>
                          <div className="text-[10px] text-slate-400">باركود: 62210499312</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        60.00 ج.م
                      </div>
                    </div>

                    {posItemsCount > 2 && (
                      <div className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-xs dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-bold dark:bg-slate-800">
                            1×
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              شاي أسود فاخر 100 فتلة
                            </div>
                            <div className="text-[10px] text-slate-400">باركود: 62210477123</div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          85.00 ج.م
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>المجموع الفرعي</span>
                    <span>{105 + (posItemsCount > 2 ? 85 : 0)}.00 ج.م</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>ضريبة القيمة المضافة (14%)</span>
                    <span>{((105 + (posItemsCount > 2 ? 85 : 0)) * 0.14).toFixed(2)} ج.م</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                    <span>الإجمالي النهائي المستحق</span>
                    <span className="text-base text-brand">
                      {((105 + (posItemsCount > 2 ? 85 : 0)) * 1.14).toFixed(2)} ج.م
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSimulateScan}
                      className="flex-1 bg-slate-800 text-xs text-white hover:bg-slate-900 dark:bg-slate-700"
                    >
                      <Barcode className="h-4 w-4 ms-1.5" />
                      محاكاة مسح باركود
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSimulatePrint}
                      className="flex-1 bg-brand text-xs text-white hover:bg-brand/90"
                    >
                      <Printer className="h-4 w-4 ms-1.5" />
                      إصدار الفاتورة وطباعة
                    </Button>
                  </div>
                </div>
              </div>

              {/* POS Right Column: Simulated Thermal Receipt Preview */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
                <div className="w-full max-w-[260px] rounded-sm border border-slate-200 bg-amber-50/20 p-4 font-mono text-[11px] shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <div className="text-center font-bold text-slate-800 dark:text-slate-100">
                    مؤسسة الميزان للتجارة
                  </div>
                  <div className="text-center text-[10px] text-slate-500">
                    الرقم الضريبي: 310123456700003
                  </div>
                  <div className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700" />
                  <div className="flex justify-between text-[10px]">
                    <span>فاتورة ضريبية مبسطة</span>
                    <span>#INV-09821</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>التاريخ: {new Date().toLocaleDateString("ar-EG")}</span>
                    <span>الوقت: 14:32</span>
                  </div>
                  <div className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>جبنة بيضاء 500 جم</span>
                      <span>45.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عصير برتقال 1L × 2</span>
                      <span>60.00</span>
                    </div>
                    {posItemsCount > 2 && (
                      <div className="flex justify-between">
                        <span>شاي أسود 100 فتلة</span>
                        <span>85.00</span>
                      </div>
                    )}
                  </div>
                  <div className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700" />
                  <div className="flex justify-between font-bold">
                    <span>المجموع الإجمالي</span>
                    <span>{((105 + (posItemsCount > 2 ? 85 : 0)) * 1.14).toFixed(2)} ج.م</span>
                  </div>
                  <div className="my-3 flex flex-col items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded bg-white p-1 shadow-xs dark:bg-slate-800">
                      {/* Stylized QR mockup */}
                      <div className="grid h-full w-full grid-cols-4 gap-0.5 rounded bg-slate-900 p-1 dark:bg-white">
                        <div className="bg-white dark:bg-slate-900" />
                        <div className="bg-slate-900 dark:bg-white" />
                        <div className="bg-white dark:bg-slate-900" />
                        <div className="bg-slate-900 dark:bg-white" />
                        <div className="bg-slate-900 dark:bg-white" />
                        <div className="bg-white dark:bg-slate-900" />
                        <div className="bg-slate-900 dark:bg-white" />
                        <div className="bg-white dark:bg-slate-900" />
                      </div>
                    </div>
                    <span className="mt-1 text-[9px] text-slate-400">
                      رمز ZATCA / ETA معتمد بصيغة TLV
                    </span>
                  </div>
                  <div className="text-center text-[9px] text-slate-400">
                    شكراً لزيارتكم — البضاعة ترد وتستبدل خلال 14 يوماً
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    مستودع القاهرة المركزي (WH-01)
                  </span>
                  <Badge variant="outline">2,480 صنف نشط</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">معدل الإشغال السعوي</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">78%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-[78%] rounded-full bg-brand" />
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                    ✓ تم اكتمال الجرد الدوري المطابق بنسبة 99.8%
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    تنبيهات الصلاحية (FEFO)
                  </span>
                  <Badge variant="destructive">3 أصناف قريبة</Badge>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded bg-white p-2 shadow-xs dark:bg-slate-900">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      زبادي طازج (تشغيلة #882)
                    </span>
                    <span className="text-rose-500 font-bold">باقي 4 أيام</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-white p-2 shadow-xs dark:bg-slate-900">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      حليب مبستر 1L
                    </span>
                    <span className="text-amber-500 font-bold">باقي 9 أيام</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    أوامر الشراء والتوريد التلقائي
                  </span>
                  <Badge variant="success">مفعل آلياً</Badge>
                </div>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  يقوم محرك الأتمتة (Automation Worker) بمراقبة حد إعادة الطلب كل ساعة وتوليد مسودات
                  أوامر الشراء للموردين المعتمدين بأسعار التعاقد.
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-brand">
                  <span>آخر فحص: منذ 12 دقيقة</span>
                  <span className="underline cursor-pointer">عرض سجل PO</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "finance" && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-12"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50 lg:col-span-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ميزان المراجعة والقيود المحاسبية التلقائية
                  </span>
                  <Badge variant="outline">شجرة حسابات قياسية</Badge>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-start">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                        <th className="py-2 text-start font-medium">رقم القيد</th>
                        <th className="py-2 text-start font-medium">البيان</th>
                        <th className="py-2 text-start font-medium">مدين (ج.م)</th>
                        <th className="py-2 text-start font-medium">دائن (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">#JV-1049</td>
                        <td className="py-2.5 font-sans text-slate-700 dark:text-slate-300">
                          إيراد مبيعات وردية الصباح POS
                        </td>
                        <td className="py-2.5 text-emerald-600 font-bold">14,250.00</td>
                        <td className="py-2.5 text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">#JV-1049</td>
                        <td className="py-2.5 font-sans text-slate-700 dark:text-slate-300">
                          ضريبة القيمة المضافة المستحقة (14%)
                        </td>
                        <td className="py-2.5 text-slate-400">—</td>
                        <td className="py-2.5 text-rose-600 font-bold">1,750.00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">#JV-1050</td>
                        <td className="py-2.5 font-sans text-slate-700 dark:text-slate-300">
                          صرف عهدة مورد ألبان المراعي
                        </td>
                        <td className="py-2.5 text-slate-400">—</td>
                        <td className="py-2.5 text-slate-800 dark:text-slate-200 font-bold">
                          6,500.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    أرصدة الخزائن والعهد اللحظية
                  </span>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        الخزينة الرئيسية (الفرع 1)
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        84,200 ج.م
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        حساب بنك مصر (الشركات)
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        342,950 ج.م
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        محفظة فودافون كاش
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        12,400 ج.م
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 text-[11px] text-slate-400">
                  مطابقة محاسبية فورية مع أرصدة أدراج الكاشير عند إغلاق الوردية (X/Z Report).
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "clinic" && (
            <motion.div
              key="clinic"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-12"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50 lg:col-span-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    الملف الطبي الإلكتروني (EMR) — المريض: أحمد محمود زهران
                  </span>
                  <Badge variant="outline">كود المريض: #MED-9402</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-3 text-xs dark:bg-slate-900">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ضغط الدم</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      120/80 mmHg
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">سكر عشوائي</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      95 mg/dL
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">فصيلة الدم</span>
                    <span className="font-bold text-brand font-mono">O+ Positive</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    الروشتة الرقمية المصروفة (e-Rx)
                  </span>
                  <div className="flex items-center justify-between rounded bg-white p-2.5 text-xs dark:bg-slate-900">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Augmentin 1g Tablets
                      </div>
                      <div className="text-[10px] text-slate-400">
                        قرص كل 12 ساعة بعد الأكل لمدة 7 أيام
                      </div>
                    </div>
                    <Badge variant="success">تم الصرف من صيدلية المركز</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  جدول كشوفات اليوم (عيادة الباطنة)
                </span>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded bg-emerald-50 p-2 dark:bg-emerald-950/40">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      10:00 ص • كشف منتهٍ
                    </span>
                    <span className="text-[10px] text-slate-500">سارة إبراهيم</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-blue-50 p-2 dark:bg-blue-950/40">
                    <span className="font-bold text-blue-800 dark:text-blue-300">
                      10:30 ص • في غرفة الكشف
                    </span>
                    <span className="text-[10px] text-slate-500">أحمد زهران</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-50 p-2 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">11:00 ص • استشارة</span>
                    <span className="text-[10px] text-slate-400">محمد عبد الرحمن</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "restaurant" && (
            <motion.div
              key="restaurant"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-12"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50 lg:col-span-7">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    مخطط صالة الطعام (Floor Plan)
                  </span>
                  <Badge variant="outline">الصالة الرئيسية • 18 طاولة</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-rose-300 bg-rose-50 p-3 text-center dark:border-rose-900 dark:bg-rose-950/30">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      طاولة T-01
                    </span>
                    <span className="text-[10px] text-rose-600">مشغولة (4 ضيوف)</span>
                    <span className="mt-1 font-mono text-[9px] text-slate-500">منذ 28 د</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      طاولة T-02
                    </span>
                    <span className="text-[10px] text-emerald-600">فارغة جاهزة</span>
                    <span className="mt-1 font-mono text-[9px] text-slate-400">سعة 2</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-amber-300 bg-amber-50 p-3 text-center dark:border-amber-900 dark:bg-amber-950/30">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      طاولة T-03
                    </span>
                    <span className="text-[10px] text-amber-600">قيد التحاسب</span>
                    <span className="mt-1 font-mono text-[9px] text-slate-500">طلب الشيك</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      طاولة T-04
                    </span>
                    <span className="text-[10px] text-emerald-600">فارغة جاهزة</span>
                    <span className="mt-1 font-mono text-[9px] text-slate-400">سعة 6</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    شاشة المطبخ اللحظية (KDS Live)
                  </span>
                  <Badge variant="destructive">تذكرة قيد التحضير</Badge>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>طلب طاولة T-01 (#K-812)</span>
                    <span className="flex items-center gap-1 text-rose-600">
                      <Clock className="h-3 w-3" /> 08:20 د
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <div>• 2× برجر لحم واغيو دبل (بدون بصل)</div>
                    <div>• 1× بطاطس مقلية بالجبنة</div>
                    <div>• 2× مشروب غازي مثلج</div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" className="bg-emerald-600 text-[10px] text-white">
                      تم التجهيز والتسليم للصالة ✓
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "mfg" && (
            <motion.div
              key="mfg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-12"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50 lg:col-span-7">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    أمر إنتاج وتصنيع رقم #MO-2026-09
                  </span>
                  <Badge variant="success">قيد التشغيل • خط التجميع 02</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded bg-white p-2.5 shadow-xs dark:bg-slate-900">
                    <div className="flex justify-between font-bold">
                      <span>المنتج النهائي: محول طاقة صناعي 50kW</span>
                      <span className="text-brand">المطلوب: 100 وحدة</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>تم إنجاز 65 وحدة (65%)</span>
                      <span className="font-mono">متبقي 35 وحدة</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full w-[65%] rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  <div className="rounded bg-white p-2.5 shadow-xs dark:bg-slate-900 text-[11px] space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      شجرة المكونات الخام (BOM Depletion)
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>• ألواح نحاس معزولة 4mm: 200 كجم</span>
                      <span className="text-emerald-600">تم الخصم التلقائي ✓</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>• رقائق معالجة إلكترونية MCU: 100 قطعة</span>
                      <span className="text-emerald-600">تم الخصم التلقائي ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    كفاءة المعدات الكلية (OEE Metrics)
                  </span>
                  <div className="mt-4 flex items-center justify-around text-center">
                    <div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        96.2%
                      </div>
                      <div className="text-[10px] text-slate-400">التوافرية (Availability)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-brand font-mono">94.8%</div>
                      <div className="text-[10px] text-slate-400">الأداء (Performance)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-emerald-600 font-mono">99.1%</div>
                      <div className="text-[10px] text-slate-400">الجودة (Quality)</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded bg-slate-50 p-2.5 text-center text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  مؤشر OEE الإجمالي: <strong className="text-emerald-600">90.3% (معيار عالمي)</strong>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
