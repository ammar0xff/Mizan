import { Printer, GraduationCap, UtensilsCrossed, Pill } from "lucide-react";
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
          className="relative rounded-2xl border border-border bg-card p-6 shadow-sm text-foreground"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-foreground">
                  مدارس فيندورا الدولية للتعليم المتطور
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  إدارة الحسابات والشؤون المالية · إيصال تحصيل رسمي
                </p>
              </div>
            </div>

            <div className="text-end">
              <span className="inline-block rounded-md bg-secondary px-2.5 py-1 text-[11px] font-mono font-black text-foreground">
                {data.receipt_no}
              </span>
              <p className="num mt-1 text-[10px] text-muted-foreground font-mono">{dateStr}</p>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary/50 p-3.5 text-xs">
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
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="p-2.5 text-start font-semibold">البيان</th>
                  <th className="p-2.5 text-end font-semibold">المبلغ المسدد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
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
          <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-dashed border-border p-3.5 text-xs">
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
            <div className="flex justify-between border-t border-border pt-1.5 font-bold">
              <span>المتبقي المستحق على الطالب:</span>
              <span className={`num font-mono text-sm ${data.new_balance_due > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {data.new_balance_due > 0 ? moneyEGP(data.new_balance_due) : "خالص بالكامل (0.00 ج.م)"}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Box */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center text-xs">
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-muted-foreground">توقيع مسؤول الخزينة</span>
              <div className="mt-4 h-6 w-32 border-b border-dashed border-border" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-muted-foreground">خاتم الحسابات والاعتماد</span>
              <div className="mt-2 flex size-12 items-center justify-center rounded-full border-2 border-dashed border-primary text-[10px] font-bold text-primary">
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
            className="flex-1 h-9 font-bold text-xs gap-1.5"
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

export interface PharmacyReceiptData {
  rx_number: string;
  patient_name: string;
  patient_phone?: string;
  patient_national_id?: string;
  doctor_name: string;
  doctor_license?: string;
  diagnosis?: string;
  insurance_company?: string;
  copay_percentage: number;
  total_amount: number;
  patient_paid: number;
  insurance_covered: number;
  drug_trade_name: string;
  scientific_name?: string;
  batch_number?: string;
  quantity: number;
  unit_price: number;
  is_controlled?: boolean;
  created_at?: string;
}

export function PharmacyPrescriptionReceiptModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: PharmacyReceiptData | null;
}) {
  if (!data) return null;

  function handlePrint() {
    sound.click();
    window.print();
  }

  const dateStr = data.created_at || new Date().toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" });

  return (
    <Modal open={open} onClose={onClose} title="إيصال صرف تذكرة دوائية رسمي">
      <div className="flex flex-col gap-5">
        <div
          id="pharmacy-print-receipt"
          className="relative rounded-2xl border border-border bg-card p-6 shadow-sm text-foreground"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <Pill className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-foreground">
                  صيدلية فيندورا للرعاية الدوائية
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  إدارة الصرف السريري والتأمين الطبي · إيصال رسمي
                </p>
              </div>
            </div>
            <div className="text-left font-mono text-xs">
              <span className="rounded bg-teal-500/10 px-2 py-0.5 font-bold text-teal-700 dark:text-teal-400">
                {data.rx_number}
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground">{dateStr}</p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">اسم المريض:</span>
              <p className="font-bold text-foreground">{data.patient_name}</p>
              {data.patient_phone && (
                <p className="text-[11px] text-muted-foreground font-mono">{data.patient_phone}</p>
              )}
              {data.patient_national_id && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                  رقم قومي: {data.patient_national_id}
                </p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">الطبيب المعالج:</span>
              <p className="font-bold text-foreground">{data.doctor_name}</p>
              {data.doctor_license && (
                <p className="text-[11px] text-muted-foreground font-mono">ترخيص: {data.doctor_license}</p>
              )}
            </div>

            {data.diagnosis && (
              <div className="col-span-2 rounded-lg bg-muted/40 p-2 text-[11px]">
                <span className="font-semibold text-muted-foreground">التشخيص الطبي: </span>
                <span className="text-foreground">{data.diagnosis}</span>
              </div>
            )}

            {data.insurance_company && (
              <div className="col-span-2 flex items-center justify-between rounded-lg border border-teal-500/20 bg-teal-500/5 px-2.5 py-1.5 text-[11px]">
                <span className="font-medium text-teal-800 dark:text-teal-300">
                  جهة التأمين: {data.insurance_company}
                </span>
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  نسبة التحمل: {data.copay_percentage}%
                </span>
              </div>
            )}
          </div>

          {/* Dispensed Drug Item */}
          <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex items-start justify-between text-xs">
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  {data.drug_trade_name}
                  {data.is_controlled && (
                    <span className="rounded bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-bold text-rose-600">
                      جدول رقابي
                    </span>
                  )}
                </p>
                {data.scientific_name && (
                  <p className="text-[11px] text-muted-foreground font-medium italic">
                    {data.scientific_name}
                  </p>
                )}
                {data.batch_number && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    رقم التشغيلة (Batch): {data.batch_number}
                  </p>
                )}
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-muted-foreground">{data.quantity} × {moneyEGP(data.unit_price)}</span>
                <p className="font-bold text-foreground">{moneyEGP(data.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Pricing & Co-Pay Breakdown */}
          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>القيمة الإجمالية للدواء:</span>
              <span className="num font-semibold">{moneyEGP(data.total_amount)}</span>
            </div>
            {data.insurance_covered > 0 && (
              <div className="flex justify-between text-teal-600 dark:text-teal-400 font-medium">
                <span>تغطية شركة التأمين ({100 - data.copay_percentage}%):</span>
                <span className="num font-semibold">-{moneyEGP(data.insurance_covered)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border/80 pt-2 text-sm font-black text-foreground">
              <span>المبلغ المسدد نقداً من المريض:</span>
              <span className="num font-black text-teal-600 dark:text-teal-400">{moneyEGP(data.patient_paid)}</span>
            </div>
          </div>

          {/* Verification stamp */}
          <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
            <div>
              <p className="font-bold text-foreground">الصيدلي المسؤول: د. صيدلي مناوب</p>
              <p>تم الصرف وفق بروتوكول FEFO والاشتراطات الصحية</p>
            </div>
            <div className="rounded border border-border px-2 py-1 text-center font-mono text-[9px]">
              رقم العملية
              <br />
              <span className="font-bold text-foreground">{data.rx_number}</span>
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
            className="flex-1 h-9 font-bold text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Printer className="size-3.5" />
            طباعة إيصال الصرف (A5 / 80mm)
          </Button>
        </div>
      </div>
    </Modal>
  );
}

