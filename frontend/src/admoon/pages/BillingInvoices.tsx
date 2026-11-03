/**
 * Admoon Billing & Invoices Management Page.
 * Connected to live PostgreSQL BillingInvoice records with MRR metrics,
 * real-time search, status filtering, and payment simulation/confirmation.
 */
import { useEffect, useState, useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { Input } from "@/components/kit/input";
import { Badge } from "@/components/kit/badge";

export interface InvoiceItem {
  id: string;
  tenant: string;
  tenant_id: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  plan: string;
  billing_cycle: string;
}

interface InvoicesResponse {
  mrr_egp: number;
  paid_count: number;
  pending_count: number;
  items: InvoiceItem[];
}

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبية",
  starter: "البداية (Starter)",
  pro: "المحترفين (Pro)",
  enterprise: "المؤسسات (Enterprise)",
};

const METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  card: { label: "بطاقة فيزا / ماستركارد", icon: "💳" },
  fawry: { label: "فوري باي (Fawry)", icon: "⚡" },
  instapay: { label: "إنستاباي (InstaPay)", icon: "📱" },
  vodafone_cash: { label: "فودافون كاش", icon: "🔴" },
  bank_transfer: { label: "تحويل بنكي", icon: "🏛️" },
};

export default function BillingInvoices() {
  const [data, setData] = useState<InvoicesResponse>({
    mrr_egp: 0,
    paid_count: 0,
    pending_count: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [confirmingRef, setConfirmingRef] = useState<string | null>(null);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await api.get<InvoicesResponse>("/admoon/billing-invoices");
      setData(res);
    } catch (err) {
      console.error("Failed to load admoon billing invoices:", err);
      toast.error(err instanceof ApiError ? err.message : "فشل تحميل فواتير الاشتراكات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function handleSimulatePayment(invoiceRef: string) {
    setConfirmingRef(invoiceRef);
    try {
      const res = await api.post<{ ok: boolean; message: string }>("/billing/simulate-payment", {
        invoice_ref: invoiceRef,
      });
      toast.success(res.message || `تم تأكيد سداد الفاتورة ${invoiceRef} بنجاح`);
      await fetchInvoices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر تأكيد سداد الفاتورة");
    } finally {
      setConfirmingRef(null);
    }
  }

  const filteredInvoices = useMemo(() => {
    return data.items.filter((inv) => {
      const matchesSearch =
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.tenant.toLowerCase().includes(search.toLowerCase()) ||
        (inv.plan && inv.plan.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" ? true : inv.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.items, search, statusFilter]);

  const totalInvoices = data.paid_count + data.pending_count;
  const collectionRate = totalInvoices > 0 ? Math.round((data.paid_count / totalInvoices) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground">الفواتير والاشتراكات المالية (Billing & Invoices)</h1>
            <Badge variant="outline" className="font-mono text-[10px]">
              {data.items.length} فاتورة
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            سجل الفواتير السحابية، متابعة مدفوعات المستأجرين، وتدقيق تحصيلات فوري وإنستاباي والبطاقات.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchInvoices}
          disabled={loading}
          className="gap-1.5 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>تحديث السجلات</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">إجمالي الإيرادات المحصلة (MRR)</span>
            <Receipt className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2 num">
            {formatCurrency(data.mrr_egp)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="size-3.5" />
            <span>مدفوعات حية مؤكدة من البنك وبوابات الدفع</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">الفواتير المسددة</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 num">
            {data.paid_count} <span className="text-xs font-normal text-muted-foreground">فاتورة</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            معدل التحصيل الفعلي: <span className="font-bold text-foreground num">{collectionRate}%</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">الفواتير المعلقة / قيد التحصيل</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500 mt-2 num">
            {data.pending_count} <span className="text-xs font-normal text-muted-foreground">فاتورة</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            بانتظار إيداع فوري أو إنستاباي أو إتمام المعاملة
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="البحث برقم الفاتورة أو اسم المنشأة أو الباقة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            كافة الفواتير ({data.items.length})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            المسددة ({data.paid_count})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            المعلقة ({data.pending_count})
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {loading && data.items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <RefreshCw className="size-6 animate-spin mx-auto text-primary" />
            <p className="text-xs">جاري جلب فواتير الاشتراكات من قاعدة البيانات...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <Receipt className="size-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">لا توجد فواتير مطابقة</p>
            <p className="text-xs">جرّب تغيير عبارة البحث أو فلتر الحالة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                <tr>
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-3">المنشأة</th>
                  <th className="py-3 px-3">الباقة</th>
                  <th className="py-3 px-3">الدورة</th>
                  <th className="py-3 px-3">المبلغ</th>
                  <th className="py-3 px-3">تاريخ الإصدار</th>
                  <th className="py-3 px-3">طريقة السداد</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => {
                  const methodInfo = METHOD_LABELS[inv.method.toLowerCase()] || {
                    label: inv.method,
                    icon: "💳",
                  };
                  const isPaid = inv.status.toLowerCase() === "paid";
                  const isConfirming = confirmingRef === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {inv.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span>{inv.tenant}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-foreground">
                          {PLAN_LABELS[inv.plan] || inv.plan}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {inv.billing_cycle === "annual" ? "سنوي" : "شهري"}
                      </td>
                      <td className="py-3 px-3 font-bold num text-foreground">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-3 font-mono text-muted-foreground">
                        {inv.date}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 px-2 py-0.5 rounded">
                          <span>{methodInfo.icon}</span>
                          <span>{methodInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <Check className="size-2.5" />
                              <span>مسددة</span>
                            </>
                          ) : (
                            <>
                              <Clock className="size-2.5" />
                              <span>في الانتظار</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isPaid ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSimulatePayment(inv.id)}
                            disabled={isConfirming}
                            className="h-7 text-[11px] font-bold gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <ShieldCheck className="size-3" />
                            <span>{isConfirming ? "جاري التأكيد..." : "تأكيد واستلام"}</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            مفعلة ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
