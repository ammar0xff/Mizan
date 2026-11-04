import { useState } from "react";
import {
  Barcode,
  Printer,
  RotateCcw,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { sound } from "@/lib/sound";

export interface CartItem {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

const CATALOG_ITEMS: Omit<CartItem, "qty">[] = [
  { id: "item-1", name: "ماسورة PVC الشريف 3 بوصة (4 بار)", barcode: "622104019201", unit: "متر", unitPrice: 420 },
  { id: "item-2", name: "خلاط مياه حوض نحاس تركي ثقيل", barcode: "622104019202", unit: "قطعة", unitPrice: 1250 },
  { id: "item-3", name: "لفة سلك سويدي معزول 2.5 مم (100 م)", barcode: "622104019203", unit: "لفة", unitPrice: 980 },
  { id: "item-4", name: "شيكارة أسمنت بورتلاندي 50 كجم", barcode: "622104019204", unit: "شيكارة", unitPrice: 195 },
  { id: "item-5", name: "محبس دفن إيطالي 3/4 بوصة أصلي", barcode: "622104019205", unit: "قطعة", unitPrice: 340 },
];

const INITIAL_CART: CartItem[] = [
  { id: "item-1", name: "ماسورة PVC الشريف 3 بوصة (4 بار)", barcode: "622104019201", unit: "متر", qty: 2, unitPrice: 420 },
  { id: "item-2", name: "خلاط مياه حوض نحاس تركي ثقيل", barcode: "622104019202", unit: "قطعة", qty: 1, unitPrice: 1250 },
  { id: "item-3", name: "لفة سلك سويدي معزول 2.5 مم (100 م)", barcode: "622104019203", unit: "لفة", qty: 1, unitPrice: 980 },
];

interface PosDemoProps {
  compact?: boolean;
}

export function BuildingMaterialsPosDemo({ compact = false }: PosDemoProps) {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [invoiceSeq, setInvoiceSeq] = useState<number>(1048);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isPrinted, setIsPrinted] = useState<boolean>(false);
  const [nextScanIndex, setNextScanIndex] = useState<number>(3); // starts pointing to item-4
  const [mobileTab, setMobileTab] = useState<"cart" | "receipt">("cart");

  // Math: 14% Egyptian VAT
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const vat = Math.round(subtotal * 14) / 100;
  const total = subtotal + vat;

  // Format numbers to Egyptian Latin format with .num
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 1. Simulate Barcode Scan
  const handleScanBarcode = () => {
    if (isFrozen) return;

    const itemToScan = CATALOG_ITEMS[nextScanIndex % CATALOG_ITEMS.length];
    setNextScanIndex((prev) => prev + 1);

    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.id === itemToScan.id);
      if (existing) {
        return prevCart.map((it) =>
          it.id === itemToScan.id ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prevCart, { ...itemToScan, qty: 1 }];
    });

    try {
      sound.scan();
    } catch {}
  };

  // 2. Adjust item quantity
  const handleUpdateQty = (id: string, delta: number) => {
    if (isFrozen) return;
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  // 3. Issue and Print Invoice
  const handleIssueInvoice = () => {
    if (isFrozen) return;
    setIsFrozen(true);
    setIsPrinted(true);
    setInvoiceSeq((prev) => prev + 1);
    setMobileTab("receipt");

    try {
      sound.success();
    } catch {}
  };

  // 4. Reset Demo
  const handleReset = () => {
    setCart(INITIAL_CART);
    setIsFrozen(false);
    setIsPrinted(false);
    setNextScanIndex(3);
    setMobileTab("cart");
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card shadow-xs overflow-hidden text-foreground">
      {/* Terminal Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-muted/40 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-border bg-background">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success ms-1 inline-block" />
            وردية مفتوحة · درج #1
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            فاتورة: <span className="num font-bold">INV-{invoiceSeq}</span>
          </span>
        </div>

        {/* Demo Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleScanBarcode}
            disabled={isFrozen}
            className="text-xs h-8 px-2.5 gap-1 border-border"
          >
            <Barcode className="h-3.5 w-3.5 text-primary" />
            <span>مسح باركود</span>
          </Button>

          <Button
            size="sm"
            onClick={handleIssueInvoice}
            disabled={isFrozen || cart.length === 0}
            className="text-xs h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-1"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>إصدار الفاتورة</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
            title="إعادة تعيين المحاكاة"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-border bg-muted/30 p-1 text-xs" role="tablist">
        <button
          role="tab"
          aria-selected={mobileTab === "cart"}
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-1.5 font-medium rounded-sm transition-colors ${
            mobileTab === "cart" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
          }`}
        >
          شاشة الكاشير ({cart.length} أصناف)
        </button>
        <button
          role="tab"
          aria-selected={mobileTab === "receipt"}
          onClick={() => setMobileTab("receipt")}
          className={`flex-1 py-1.5 font-medium rounded-sm transition-colors ${
            mobileTab === "receipt" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
          }`}
        >
          الإيصال الحراري (80mm) {isPrinted && <Check className="inline h-3.5 w-3.5 ms-1 text-success" />}
        </button>
      </div>

      {/* Grid: POS Cart Lines vs Live Thermal Receipt */}
      <div className={`grid grid-cols-1 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-12"} divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-border`}>
        {/* Left: Cart Table / Item List */}
        <div className={`${mobileTab === "cart" ? "block" : "hidden"} lg:block ${compact ? "p-4 space-y-3" : "lg:col-span-7 p-4 sm:p-5 space-y-3"}`}>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border pb-2">
            <span>الصنف وبيان البضاعة</span>
            <span>الكمية والسعر</span>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pe-1">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/80 bg-background p-2.5 text-xs transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground truncate">{item.name}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    كود: <span className="num">{item.barcode}</span> · {item.unit}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!compact && !isFrozen && (
                    <div className="flex items-center gap-1 border border-border rounded-md px-1 py-0.5 bg-muted/30">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                        aria-label="إنقاص الكمية"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="num px-1.5 font-bold font-mono text-xs text-foreground">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                        aria-label="زيادة الكمية"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {compact && (
                    <span className="text-xs text-muted-foreground">
                      الكمية: <span className="num font-bold font-mono">{item.qty}</span>
                    </span>
                  )}

                  <div className="text-end min-w-[70px]">
                    <div className="num font-bold text-foreground">
                      {fmt(item.qty * item.unitPrice)}
                    </div>
                    <div className="text-muted-foreground text-xs">ج.م</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Live Totals */}
          <div className="border-t border-border pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي (قبل الضريبة):</span>
              <span>
                <span className="num font-semibold text-foreground">{fmt(subtotal)}</span> ج.م
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ضريبة القيمة المضافة (14% VAT):</span>
              <span>
                <span className="num font-semibold text-foreground">{fmt(vat)}</span> ج.م
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-border/80 font-bold text-sm">
              <span className="text-foreground">الإجمالي المستحق:</span>
              <span className="text-primary font-mono text-base">
                <span className="num font-bold">{fmt(total)}</span> <span className="text-xs">ج.م</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actual Thermal Receipt Slip Preview (80mm) */}
        <div className={`${mobileTab === "receipt" ? "block" : "hidden"} lg:block ${compact ? "p-4 bg-muted/20" : "lg:col-span-5 p-4 sm:p-5 bg-muted/20 space-y-3"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              معاينة الإيصال الحراري (80mm)
            </span>
            {isPrinted ? (
              <Badge variant="outline" className="border-success/40 text-success bg-success/10 text-xs">
                <Check className="h-3 w-3 ms-1 inline" /> تم إصدار الفاتورة
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                جاهز للطباعة
              </Badge>
            )}
          </div>

          {/* Receipt Canvas */}
          <div className="receipt-paper rounded-md p-4 text-xs font-mono space-y-2.5">
            <div className="text-center space-y-0.5 border-b border-dashed border-border pb-2.5">
              <div className="font-bold text-foreground text-sm">
                مؤسسة الأهرام لتجارة مواد البناء
              </div>
              <div className="text-muted-foreground text-xs">
                سجل تجاري: <span className="num">109823</span> · بطاقة ضريبية: <span className="num">491-820-911</span>
              </div>
              <div className="text-muted-foreground text-xs">
                فاتورة ضريبية مبسطة: <span className="num font-bold text-foreground">INV-{invoiceSeq}</span>
              </div>
              <div className="text-muted-foreground text-xs">
                التاريخ: <span className="num">2026-11-04 09:30:15</span>
              </div>
            </div>

            {/* Receipt Table Rows */}
            <div className="space-y-1.5 py-1 text-xs">
              {cart.map((line) => (
                <div key={line.id} className="flex justify-between items-baseline gap-2">
                  <div className="truncate text-foreground max-w-[140px]">
                    {line.name}
                  </div>
                  <div className="text-end shrink-0 text-muted-foreground">
                    <span className="num">{line.qty}</span> × <span className="num">{fmt(line.unitPrice)}</span> ={" "}
                    <span className="num font-semibold text-foreground">{fmt(line.qty * line.unitPrice)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Receipt Math */}
            <div className="border-t border-dashed border-border pt-2 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>الوعاء الخاضع:</span>
                <span>
                  <span className="num">{fmt(subtotal)}</span> ج.م
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>ضريبة القيمة المضافة 14%:</span>
                <span>
                  <span className="num">{fmt(vat)}</span> ج.م
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border">
                <span>الصافي المطلوب:</span>
                <span>
                  <span className="num">{fmt(total)}</span> ج.م
                </span>
              </div>
            </div>

            <div className="text-center pt-2 text-muted-foreground text-xs border-t border-dashed border-border">
              الفاتورة متوافقة مع منظومة ETA الإلكترونية المصرية
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
