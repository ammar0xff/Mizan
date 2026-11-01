import { Printer, GraduationCap, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/kit/button";
import { Modal } from "@/components/ui";
import { moneyEGP } from "@/lib/format";
import { sound } from "@/lib/sound";

export interface SchoolPaymentReceiptData {
  receipt_no: string;
  student_name: string;
  student_code: string;
  grade?: string;
  parent_phone?: string;
  paid_amount: number;
  new_balance_due: number;
  total_paid?: number;
  total_tuition?: number;
  created_at?: string;
  notes?: string;
}

export function SchoolTuitionReceiptModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: SchoolPaymentReceiptData | null;
}) {
  if (!data) return null;

  function handlePrint() {
    sound.click();
    window.print();
  }

  const dateStr = data.created_at || new Date().toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" });

  return (
    <Modal open={open} onClose={onClose} title="إيصال سداد رسوم دراسية إلكتروني">
      <div className="flex flex-col gap-5">
        {/* Printable Receipt Paper Container */}
        <div
          id="school-print-receipt"
          className="relative rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-card p-6 shadow-sm text-foreground"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-indigo-100 dark:border-indigo-950 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-indigo-950 dark:text-indigo-200">
                  مدارس فيندورا الدولية للتعليم المتطور
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  إدارة الحسابات والشؤون المالية · إيصال تحصيل رسمي
                </p>
              </div>
            </div>

            <div className="text-end">
              <span className="inline-block rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 text-[11px] font-mono font-black text-indigo-700 dark:text-indigo-300">
                {data.receipt_no}
              </span>
              <p className="num mt-1 text-[10px] text-muted-foreground font-mono">{dateStr}</p>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-muted/40 p-3.5 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground">اسم الطالب:</span>
              <p className="font-bold text-foreground text-sm">{data.student_name}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">كود القيد المدرسي:</span>
              <p className="num font-mono font-bold text-foreground">{data.student_code}</p>
            </div>
            {data.grade && (
              <div>
                <span className="text-[11px] text-muted-foreground">المرحلة / الصف:</span>
                <p className="font-semibold text-foreground">{data.grade}</p>
              </div>
            )}
            {data.parent_phone && (
              <div>
                <span className="text-[11px] text-muted-foreground">هاتف ولي الأمر:</span>
                <p className="num font-mono font-semibold text-foreground" dir="ltr">{data.parent_phone}</p>
              </div>
            )}
          </div>

          {/* Payment Statement Table */}
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-border">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="p-2.5 text-start font-semibold">البيان</th>
                  <th className="p-2.5 text-end font-semibold">المبلغ المسدد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-foreground">سداد دفعة من المصروفات الدراسية للعام الحالي</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {data.notes || "طريقة الدفع: نقدي بخزينة المدرسة"}
                    </p>
                  </td>
                  <td className="p-3 text-end font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {moneyEGP(data.paid_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Balances Summary */}
          <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-border p-3.5 text-xs">
            {data.total_tuition !== undefined && (
              <div className="flex justify-between text-muted-foreground">
                <span>إجمالي الرسوم الدراسية المقررة:</span>
                <span className="num font-mono font-semibold">{moneyEGP(data.total_tuition)}</span>
              </div>
            )}
            {data.total_paid !== undefined && (
              <div className="flex justify-between text-muted-foreground">
                <span>إجمالي المسدد حتى تاريخه:</span>
                <span className="num font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {moneyEGP(data.total_paid)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 dark:border-border pt-1.5 font-bold">
              <span>المتبقي المستحق على الطالب:</span>
              <span className={`num font-mono text-sm ${data.new_balance_due > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {data.new_balance_due > 0 ? moneyEGP(data.new_balance_due) : "خالص بالكامل (0.00 ج.م)"}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Box */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-border pt-4 text-center text-xs">
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-muted-foreground">توقيع مسؤول الخزينة</span>
              <div className="mt-4 h-6 w-32 border-b border-dashed border-slate-400" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-muted-foreground">خاتم الحسابات والاعتماد</span>
              <div className="mt-2 flex size-12 items-center justify-center rounded-full border-2 border-dashed border-indigo-400 text-[10px] font-bold text-indigo-500">
                معتمد
              </div>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-9 text-xs"
            onClick={onClose}
          >
            إغلاق
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-9 font-bold text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Printer className="size-3.5" />
            طباعة الإيصال (A5 / Thermal)
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export interface DiningTableReceiptData {
  tableNumber: string;
  section: string;
  serverName: string;
  guests: number;
  openedAt?: string;
  subtotal: number;
  serviceChargePercent?: number;
  vatPercent?: number;
}

export function RestaurantGuestCheckModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: DiningTableReceiptData | null;
}) {
  if (!data) return null;

  function handlePrint() {
    sound.click();
    window.print();
  }

  const subtotal = data.subtotal || 380.0;
  const serviceCharge = (subtotal * (data.serviceChargePercent ?? 12)) / 100;
  const vat = (subtotal * (data.vatPercent ?? 14)) / 100;
  const total = subtotal + serviceCharge + vat;

  return (
    <Modal open={open} onClose={onClose} title={`بون حساب طاولة ${data.tableNumber} (Guest Check)`}>
      <div className="flex flex-col gap-5">
        {/* Thermal 80mm Check Paper */}
        <div
          id="restaurant-print-check"
          className="mx-auto w-full max-w-[340px] rounded-xl border border-dashed border-border bg-card p-5 font-mono text-xs shadow-sm text-foreground"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-border pb-3">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white mb-1.5">
              <UtensilsCrossed className="size-5" />
            </div>
            <h3 className="font-black text-sm text-foreground tracking-tight">مطعم وكافيه فيندورا</h3>
            <p className="text-[10px] text-muted-foreground">صالة الطعام والضيافة · بون فحص الطاولة</p>
          </div>

          {/* Table Meta */}
          <div className="mt-3 flex flex-col gap-1 text-[11px] border-b border-dashed border-border pb-3">
            <div className="flex justify-between font-bold">
              <span>طاولة: {data.tableNumber}</span>
              <span>القسم: {data.section}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>الويتر: {data.serverName || "أحمد سامي"}</span>
              <span>الضيوف: {data.guests || 2} أفراد</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>الوقت: {data.openedAt || "الآن"}</span>
              <span>التاريخ: {new Date().toLocaleDateString("ar-EG")}</span>
            </div>
          </div>

          {/* Check Items Mock / Real breakdown */}
          <div className="mt-3 space-y-2 border-b border-dashed border-border pb-3 text-xs">
            <div className="flex justify-between">
              <span>1x وجبة مشويات ميكس عائلية</span>
              <span className="font-bold">{moneyEGP(240)}</span>
            </div>
            <div className="flex justify-between">
              <span>2x عصير برتقال طازج</span>
              <span className="font-bold">{moneyEGP(90)}</span>
            </div>
            <div className="flex justify-between">
              <span>1x مقبلات وحمص باللحمة</span>
              <span className="font-bold">{moneyEGP(50)}</span>
            </div>
          </div>

          {/* Calculation */}
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي:</span>
              <span className="num font-semibold">{moneyEGP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>خدمة الصالة ({data.serviceChargePercent ?? 12}%):</span>
              <span className="num font-semibold">{moneyEGP(serviceCharge)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ضريبة القيمة المضافة ({data.vatPercent ?? 14}%):</span>
              <span className="num font-semibold">{moneyEGP(vat)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-border pt-2 text-sm font-black text-amber-600 dark:text-amber-400">
              <span>الإجمالي المطلوب:</span>
              <span className="num font-black">{moneyEGP(total)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 text-center border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
            <p className="font-bold text-foreground">شكراً لزيارتكم الكريمة!</p>
            <p>الأسعار تشمل الضرائب والخدمة المقررة</p>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-9 text-xs"
            onClick={onClose}
          >
            إغلاق
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-9 font-bold text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Printer className="size-3.5" />
            طباعة بون الصالة (80mm)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
