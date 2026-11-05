import { Keyboard, X, Zap, Barcode, Printer, CreditCard, ShoppingBag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

interface PosKeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosKeyboardShortcutsModal({ isOpen, onClose }: PosKeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: "F1",
      title: "التركيز على قارئ الباركود",
      description: "نقل المؤشر فورياً إلى خانة إدخال الكود أو البحث",
      icon: <Barcode className="h-4 w-4 text-primary" />,
    },
    {
      key: "F2",
      title: "الدفع النقدي السريع",
      description: "فتح نافذة الدفع بمبلغ الفاتورة نقداً والإنهاء التلقائي",
      icon: <CreditCard className="h-4 w-4 text-emerald-400" />,
    },
    {
      key: "F3",
      title: "الدفع الآجل / على الحساب",
      description: "تسجيل الفاتورة على حساب العميل الحالي",
      icon: <Zap className="h-4 w-4 text-amber-400" />,
    },
    {
      key: "F4",
      title: "تعليق / استئناف الفاتورة",
      description: "حفظ السلة مؤقتاً لخدمة عميل آخر والعودة لها لاحقاً",
      icon: <RotateCcw className="h-4 w-4 text-blue-400" />,
    },
    {
      key: "F8",
      title: "التبديل بين قطاعي / جملة",
      description: "تغيير تسعير السلة فورياً بين سعر البيع العادي وسعر الجملة",
      icon: <ShoppingBag className="h-4 w-4 text-purple-400" />,
    },
    {
      key: "F9",
      title: "إلغاء وتفريغ السلة",
      description: "مسح جميع الأصناف من الفاتورة الحالية والبدء من جديد",
      icon: <X className="h-4 w-4 text-red-400" />,
    },
    {
      key: "F10",
      title: "إعدادات الطابعة الحرارية والعتاد",
      description: "تخصيص مقاس الورق (80mm / 58mm) ومعاينة الفاتورة",
      icon: <Printer className="h-4 w-4 text-pink-400" />,
    },
    {
      key: "Esc",
      title: "إغلاق أي نافذة منبثقة",
      description: "الخروج من نوافذ الدفع أو التعليق والعودة للشاشة الرئيسية",
      icon: <X className="h-4 w-4 text-stone-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-card p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                اختصارات لوحة المفاتيح والسرعة الفائقة
              </h2>
              <p className="text-xs text-muted-foreground">
                تسريع عمليات الكاشير والبيع بدون الحاجة لاستخدام الماوس
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Continuous Barcode Scanner Banner */}
        <div className="mt-4 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-xs font-bold text-emerald-400">
                المسح التلقائي المستمر نشط (Continuous Barcode Listener)
              </div>
              <div className="text-[11px] text-muted-foreground">
                يمكنك ضرب مسدس الباركود في أي وقت مباشرة دون الحاجة للوقوف داخل حقل البحث!
              </div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            جاهز للمسح
          </span>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5 hover:border-white/15 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                  {sc.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{sc.title}</div>
                  <div className="text-xs text-muted-foreground">{sc.description}</div>
                </div>
              </div>
              <kbd className="min-w-[42px] px-2.5 py-1 text-center rounded-xl border border-white/20 bg-black/40 text-xs font-mono font-bold text-primary shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/10 pt-4">
          <Button onClick={onClose} className="bg-primary">
            فهمت، إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
