import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { FileText } from "lucide-react";
import { useClinic } from "../ClinicContext";

const moneyEGP = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export default function BillingTab() {
  const c = useClinic();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            فواتير الكشوفات والتحصيل (Billing &amp; Invoices)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            إصدار فواتير الكشوفات، احتساب نسب التحمل (Copay)، وتسجيل المدفوعات
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-start py-2 px-3">رقم الفاتورة</th>
              <th className="text-start py-2 px-3">المريض</th>
              <th className="text-start py-2 px-3">المجموع</th>
              <th className="text-start py-2 px-3">تحمل التأمين</th>
              <th className="text-start py-2 px-3">تحمل المريض</th>
              <th className="text-start py-2 px-3">المدفوع</th>
              <th className="text-start py-2 px-3">الحالة</th>
              <th className="text-start py-2 px-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {c.invoicesData.map((inv: any) => (
              <tr key={inv.id} className="border-t border-border/40">
                <td className="py-2 px-3 font-mono">{inv.invoice_ref}</td>
                <td className="py-2 px-3">{inv.patient_name}</td>
                <td className="py-2 px-3 font-mono">{moneyEGP(inv.total)}</td>
                <td className="py-2 px-3 font-mono">{moneyEGP(inv.insurance_amount)}</td>
                <td className="py-2 px-3 font-mono">{moneyEGP(inv.patient_amount)}</td>
                <td className="py-2 px-3 font-mono">{moneyEGP(inv.paid_amount)}</td>
                <td className="py-2 px-3">
                  <Badge variant={inv.status === "paid" ? "success" : "outline"}>{inv.status}</Badge>
                </td>
                <td className="py-2 px-3">
                  {inv.status !== "paid" && (
                    <Button size="sm" onClick={() => c.handlePayInvoice(inv)} className="text-xs h-7">
                      تسجيل دفع
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {c.invoicesData.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-muted-foreground">
                  لا توجد فواتير. استخدم زر "إصدار فاتورة" في تبويب المواعيد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}