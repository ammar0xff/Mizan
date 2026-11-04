import { useState, useEffect } from "react";
import {
  Printer,
  QrCode,
  Receipt,
  Check,
  Zap,
  Sliders,
  X,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { Button } from "@/components/ui";

interface ThermalReceiptSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (config: any) => void;
}

export function ThermalReceiptSettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: ThermalReceiptSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [autoPrint, setAutoPrint] = useState(true);
  const [showTaxQr, setShowTaxQr] = useState(true);
  const [cashDrawerPulse, setCashDrawerPulse] = useState(true);
  const [headerNote, setHeaderNote] = useState("أهلاً وسهلاً بكم — نسعد بخدمتكم دائماً");
  const [footerNote, setFooterNote] = useState("البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب الفاتورة");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api
      .get<{
        paper_width: "80mm" | "58mm";
        auto_print: boolean;
        show_tax_qr: boolean;
        cash_drawer_pulse: boolean;
        header_note: string | null;
        footer_note: string | null;
      }>("/modules/pos_hardware/config")
      .then((cfg) => {
        if (cfg) {
          if (cfg.paper_width) setPaperWidth(cfg.paper_width);
          if (typeof cfg.auto_print === "boolean") setAutoPrint(cfg.auto_print);
          if (typeof cfg.show_tax_qr === "boolean") setShowTaxQr(cfg.show_tax_qr);
          if (typeof cfg.cash_drawer_pulse === "boolean") setCashDrawerPulse(cfg.cash_drawer_pulse);
          if (cfg.header_note) setHeaderNote(cfg.header_note);
          if (cfg.footer_note) setFooterNote(cfg.footer_note);
        }
      })
      .catch(() => {
        // use defaults if network error
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      sound.click();
      const payload = {
        workstation_name: "كاشير رئيسي (Workstation 1)",
        printer_type: "browser_thermal",
        paper_width: paperWidth,
        auto_print: autoPrint,
        show_tax_qr: showTaxQr,
        cash_drawer_pulse: cashDrawerPulse,
        header_note: headerNote,
        footer_note: footerNote,
      };
      await api.put("/modules/pos_hardware/config", payload);
      sound.success();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onSettingsSaved?.(payload);
    } catch {
      sound.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = () => {
    sound.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-card p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                إعدادات عتاد الكاشير والطباعة الحرارية
              </h2>
              <p className="text-xs text-muted-foreground">
                تكوين طابعة الإيصالات، مقاس الورق (80mm / 58mm)، والباركود الضريبي
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

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 py-3">
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "config"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Sliders className="h-4 w-4" />
            خيارات الطابعة والورق
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "preview"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4" />
            معاينة الإيصال الحراري ({paperWidth})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>جارٍ تحميل تكوين العتاد...</span>
            </div>
          ) : activeTab === "config" ? (
            <div className="space-y-6">
              {/* Paper Width Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  نوع ومقاس ورق الطابعة الحرارية
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setPaperWidth("80mm")}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition flex flex-col gap-2 ${
                      paperWidth === "80mm"
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-foreground">
                        80 مم (قياسي POS Standard)
                      </span>
                      {paperWidth === "80mm" && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      العرض الأكثر شيوعاً لكاشير المحلات، يدعم رمز QR الضريبي بالكامل وتفاصيل الأصناف
                      والأسعار براحة تامة.
                    </p>
                    <div className="mt-2 text-[11px] font-mono bg-black/40 px-2 py-1 rounded text-primary">
                      عرض الورقة: ~72-80mm (48-56 حرفاً في السطر)
                    </div>
                  </div>

                  <div
                    onClick={() => setPaperWidth("58mm")}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition flex flex-col gap-2 ${
                      paperWidth === "58mm"
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-foreground">
                        58 مم (مدمج محمول Compact)
                      </span>
                      {paperWidth === "58mm" && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      مخصص لطابعات البلوتوث والمحمولة ونقاط البيع السريعة، خطوط مدمجة وتكثيف عمودي
                      لتوفير الورق.
                    </p>
                    <div className="mt-2 text-[11px] font-mono bg-black/40 px-2 py-1 rounded text-primary">
                      عرض الورقة: ~48-58mm (32-36 حرفاً في السطر)
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Printer className="h-4 w-4 text-primary" />
                      طباعة تلقائية عند البيع
                    </span>
                    <p className="text-xs text-muted-foreground">
                      فتح شاشة الطباعة فورياً بعد إتمام الدفع بنجاح
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="h-5 w-5 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-emerald-400" />
                      QR الفاتورة الإلكترونية والضريبية
                    </span>
                    <p className="text-xs text-muted-foreground">
                      رمز TLV مشفر متوافق مع هيئة الضرائب والزكاة
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showTaxQr}
                    onChange={(e) => setShowTaxQr(e.target.checked)}
                    className="h-5 w-5 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      فتح درج النقدية التلقائي
                    </span>
                    <p className="text-xs text-muted-foreground">
                      إرسال نبضة لفتح الدرج عند عمليات الدفع النقدي
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cashDrawerPulse}
                    onChange={(e) => setCashDrawerPulse(e.target.checked)}
                    className="h-5 w-5 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Text customizers */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    الترويسة المخصصة للإيصال (Header Note)
                  </label>
                  <input
                    type="text"
                    value={headerNote}
                    onChange={(e) => setHeaderNote(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    placeholder="مثال: أهلاً وسهلاً بكم في متجرنا"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    تذييل الإيصال وسياسة الاسترجاع (Footer Note)
                  </label>
                  <input
                    type="text"
                    value={footerNote}
                    onChange={(e) => setFooterNote(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    placeholder="مثال: البضاعة المباعة ترد وتستبدل خلال 14 يوماً"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Live Thermal Preview Tab */
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>نمط العرض الحالي:</span>
                <span className="font-bold text-primary">{paperWidth}</span>
                <span>• يحاكي الورق الحراري الفعلي وخطوط ESC/POS</span>
              </div>

              {/* Simulated Thermal Ticket Container */}
              <div
                className={`border border-stone-400/40 bg-stone-100 text-stone-900 shadow-2xl p-4 font-mono text-xs rounded-md transition-all duration-300 ${
                  paperWidth === "80mm" ? "w-[340px]" : "w-[240px] text-[10px]"
                }`}
                style={{ direction: "rtl" }}
              >
                {/* Header */}
                <div className="text-center border-b border-dashed border-stone-400 pb-2 mb-2">
                  <div className="text-sm font-black">المصرية الألمانية للأدوات الصحية</div>
                  <div className="text-[10px] text-stone-600">فرع العبور — مبيعات التجزئة</div>
                  <div className="text-[10px] text-stone-600">س.ت: 492019 • ض.م: 300987654300003</div>
                  <div className="mt-1 text-[11px] font-semibold text-stone-700">{headerNote}</div>
                </div>

                {/* Metadata */}
                <div className="text-[10px] border-b border-dashed border-stone-400 pb-2 mb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>فاتورة رقم:</span>
                    <span className="font-bold">INV-2026-0042</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التاريخ:</span>
                    <span>{new Date().toLocaleDateString("ar-EG")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الكاشير:</span>
                    <span>أحمد ممدوح (كاشير 1)</span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-b border-dashed border-stone-400 pb-2 mb-2">
                  <div className="flex justify-between font-bold border-b border-stone-300 pb-1 mb-1">
                    <span>الصنف</span>
                    <span>الكمية × السعر</span>
                    <span>الإجمالي</span>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <div className="font-semibold">محبس نحاس إيطالي 1/2</div>
                      <div className="flex justify-between text-stone-600">
                        <span>2 × 85.00 ج.م</span>
                        <span className="font-bold text-stone-900">170.00 ج.م</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">شريط تفلون مانع تسريب</div>
                      <div className="flex justify-between text-stone-600">
                        <span>4 × 20.00 ج.م</span>
                        <span className="font-bold text-stone-900">80.00 ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1 border-b border-dashed border-stone-400 pb-2 mb-2 text-[11px]">
                  <div className="flex justify-between">
                    <span>المجموع الخاضع للضريبة:</span>
                    <span>219.30 ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة (14%):</span>
                    <span>30.70 ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-300">
                    <span>الإجمالي النهائي:</span>
                    <span>250.00 ج.م</span>
                  </div>
                  <div className="flex justify-between text-stone-600 text-[10px]">
                    <span>طريقة الدفع:</span>
                    <span>نقداً (Cash)</span>
                  </div>
                </div>

                {/* QR Code */}
                {showTaxQr && (
                  <div className="flex flex-col items-center justify-center my-3 gap-1">
                    {/* SVG Tax QR placeholder */}
                    <div className="p-2 bg-white rounded border border-stone-300 shadow-sm">
                      <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
                        <rect width="84" height="84" fill="white" />
                        {/* 4 corner position markers */}
                        <rect x="6" y="6" width="22" height="22" fill="black" />
                        <rect x="8" y="8" width="18" height="18" fill="white" />
                        <rect x="11" y="11" width="12" height="12" fill="black" />

                        <rect x="56" y="6" width="22" height="22" fill="black" />
                        <rect x="58" y="8" width="18" height="18" fill="white" />
                        <rect x="61" y="11" width="12" height="12" fill="black" />

                        <rect x="6" y="56" width="22" height="22" fill="black" />
                        <rect x="8" y="58" width="18" height="18" fill="white" />
                        <rect x="11" y="61" width="12" height="12" fill="black" />

                        {/* QR internal patterns */}
                        <rect x="34" y="8" width="16" height="4" fill="black" />
                        <rect x="38" y="16" width="12" height="4" fill="black" />
                        <rect x="10" y="34" width="24" height="4" fill="black" />
                        <rect x="36" y="30" width="12" height="12" fill="black" />
                        <rect x="54" y="34" width="20" height="4" fill="black" />
                        <rect x="34" y="50" width="16" height="6" fill="black" />
                        <rect x="56" y="56" width="10" height="10" fill="black" />
                        <rect x="70" y="68" width="8" height="8" fill="black" />
                        <rect x="40" y="68" width="8" height="8" fill="black" />
                      </svg>
                    </div>
                    <span className="text-[9px] text-stone-600 font-sans">
                      رمز الفاتورة الإلكترونية المعتمد
                    </span>
                  </div>
                )}

                {/* Footer Note */}
                <div className="text-center text-[9px] text-stone-600 mt-2 border-t border-dotted border-stone-400 pt-2">
                  <p>{footerNote}</p>
                  <p className="mt-1 font-sans text-stone-400">Powered by Mizan POS</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTestPrint}
              className="gap-2 border-white/10 text-foreground hover:bg-white/10"
            >
              <Printer className="h-4 w-4 text-primary" />
              طباعة تجريبية (Test Print)
            </Button>
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="h-4 w-4" />
                تم حفظ التكوين بنجاح!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              إغلاق
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary">
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
