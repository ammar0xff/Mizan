/**
 * Admoon Billing & Invoices Management Page.
 */
import { formatCurrency } from "@/lib/format";

const INVOICES = [
  { id: "INV-2026-001", tenant: "نادي مونست الرياضي", amount: 850, date: "2026-10-01", status: "paid", method: "InstaPay" },
  { id: "INV-2026-002", tenant: "مطعم شمس الأصيل", amount: 850, date: "2026-10-05", status: "paid", method: "Visa / Card" },
  { id: "INV-2026-003", tenant: "أكاديمية النور للغات", amount: 1950, date: "2026-10-12", status: "paid", method: "Bank Transfer" },
  { id: "INV-2026-004", tenant: "سوبرماركت التوفيق", amount: 450, date: "2026-10-18", status: "pending", method: "Fawry" },
];

export default function BillingInvoices() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-foreground">الفواتير والاشتراكات المالية (Billing & Invoices)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          سجل فواتير الاشتراكات الشهرية والسنوية ومتابعة مدفوعات المستأجرين.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">إجمالي الإيرادات الشهرية (MRR)</span>
          <p className="text-xl font-black text-foreground mt-1 num">{formatCurrency(4100)}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">+18% نمو مقارنة بالشهر السابق</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">الفواتير المسددة</span>
          <p className="text-xl font-black text-emerald-600 mt-1 num">3 فواتير</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">معدل تحصيل 85%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">الفواتير المعلقة / القادمة</span>
          <p className="text-xl font-black text-amber-500 mt-1 num">1 فاتورة</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">تستحق خلال 5 أيام</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
            <tr>
              <th className="py-3 px-4">رقم الفاتورة</th>
              <th className="py-3 px-3">المنشأة</th>
              <th className="py-3 px-3">المبلغ</th>
              <th className="py-3 px-3">تاريخ الإصدار</th>
              <th className="py-3 px-3">طريقة السداد</th>
              <th className="py-3 px-3">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/20">
                <td className="py-3 px-4 font-mono font-bold">{inv.id}</td>
                <td className="py-3 px-3 font-semibold text-foreground">{inv.tenant}</td>
                <td className="py-3 px-3 font-bold num">{formatCurrency(inv.amount)}</td>
                <td className="py-3 px-3 font-mono text-muted-foreground">{inv.date}</td>
                <td className="py-3 px-3">{inv.method}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {inv.status === "paid" ? "مسددة" : "في الانتظار"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
