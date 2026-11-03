/**
 * Admoon Subscriptions & Plan Tiers Page.
 *
 * Manage SaaS subscription tiers (Trial, Starter, Pro, Enterprise),
 * live tenant distribution, pricing quotas, and direct tenant plan assignment.
 */
import { useEffect, useState } from "react";
import { Check, RefreshCw, ShieldCheck, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/kit/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { api, ApiError } from "@/lib/api";

interface PlanConfig {
  id: string;
  name: string;
  price_monthly_egp: number;
  price_annual_egp: number;
  max_users: number;
  max_branches: number;
  max_monthly_sales: number;
  trial_days?: number;
  features: string[];
  popular?: boolean;
}

interface SubscriptionRecord {
  id: string;
  tenant_id: string;
  tenant_name: string;
  plan: string;
  status: string;
  contact_phone: string | null;
  created_at: string | null;
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface SubscriptionsData {
  plan_counts: Record<string, number>;
  plans: PlanConfig[];
  subscriptions: SubscriptionRecord[];
  total_active_tenants: number;
}

export default function Subscriptions() {
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Plan override modal state
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [targetPlan, setTargetPlan] = useState<string>("pro");
  const [savingPlan, setSavingPlan] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get<SubscriptionsData>("/admoon/subscriptions");
      setData(res);
    } catch (err) {
      console.error("Failed to load admoon subscriptions:", err);
      toast.error(err instanceof ApiError ? err.message : "فشل تحميل بيانات الاشتراكات");
    } finally {
      setLoading(false);
    }
  }

  async function openTenantPlanModal(defaultPlan?: string) {
    if (defaultPlan) setTargetPlan(defaultPlan);
    setModalOpen(true);
    try {
      const res = await api.get<{ items: TenantItem[] }>("/admoon/tenants");
      setTenants(res.items || []);
      if (res.items?.length > 0 && !selectedTenantId) {
        setSelectedTenantId(res.items[0].id);
      }
    } catch (err) {
      toast.error("فشل جلب قائمة المنشآت");
    }
  }

  async function handleUpdateTenantPlan() {
    if (!selectedTenantId) {
      toast.error("الرجاء اختيار المنشأة");
      return;
    }
    setSavingPlan(true);
    try {
      const res = await api.post<{ ok: boolean; message: string }>(
        `/admoon/tenants/${selectedTenantId}/plan`,
        {
          plan: targetPlan,
          reason: "Superadmin plan allocation from admoon subscriptions dashboard",
        }
      );
      toast.success(res.message || "تم تحديث باقة المنشأة بنجاح");
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر ترقية باقة المنشأة");
    } finally {
      setSavingPlan(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const plans = data?.plans || [];
  const planCounts = data?.plan_counts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground">باقات وخطط الاشتراك (Subscription Tiers)</h1>
            <Badge variant="outline" className="text-[10px] font-mono">
              {data?.total_active_tenants ?? 0} منشأة مسجلة
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة تسعير الخطط الشهرية والسنوية، الحصص، ومحددات الميزات لكافة المستأجرين.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Billing Cycle Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-card text-xs font-bold">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              سداد شهري
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                billingCycle === "annual" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              سداد سنوي (خصم 17%)
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="text-xs font-bold"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Button
            size="sm"
            onClick={() => openTenantPlanModal()}
            className="text-xs font-bold gap-1.5"
          >
            <ShieldCheck className="size-3.5" />
            <span>تعيين باقة لمنشأة</span>
          </Button>
        </div>
      </div>

      {/* Distribution Summary Pill */}
      <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs">
        <span className="text-xs font-bold text-muted-foreground block mb-2">توزيع المستأجرين على الباقات السحابية:</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["trial", "starter", "pro", "enterprise"].map((pKey) => {
            const count = planCounts[pKey] || 0;
            const names: Record<string, string> = {
              trial: "تجريبية",
              starter: "البداية",
              pro: "المحترفين",
              enterprise: "المؤسسات",
            };
            return (
              <div key={pKey} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{names[pKey]}</span>
                  <span className="font-mono text-[10px] uppercase font-bold text-primary">{pKey}</span>
                </div>
                <p className="text-xl font-black text-foreground mt-1 num">
                  {count} <span className="text-xs font-normal text-muted-foreground">منشأة</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const price = billingCycle === "monthly" ? p.price_monthly_egp : p.price_annual_egp;
          const subscriberCount = planCounts[p.id] || 0;
          const isPro = p.id === "pro";

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between relative transition hover:shadow-sm ${
                isPro ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
              }`}
            >
              {isPro && (
                <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="size-3" />
                  الأكثر طلباً
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{p.name}</h2>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground num">{formatCurrency(price)}</span>
                      <span className="text-xs text-muted-foreground">/{billingCycle === "monthly" ? "شهر" : "سنة"}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] num">
                    {subscriberCount} عميل
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">المستخدمون:</span>
                    <span className="font-bold text-foreground num">{p.max_users >= 999 ? "غير محدود" : `${p.max_users} مستخدم`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">الفروع والمستودعات:</span>
                    <span className="font-bold text-foreground num">{p.max_branches >= 999 ? "غير محدود" : `${p.max_branches} فرع`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">فواتير البيع / شهر:</span>
                    <span className="font-bold text-foreground num">{p.max_monthly_sales >= 999999 ? "غير محدود" : `${p.max_monthly_sales.toLocaleString("en-US")} فاتورة`}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-[11px] text-muted-foreground">المزايا والحصص:</p>
                  {p.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-foreground/90">
                      <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Button
                  size="sm"
                  variant={isPro ? "default" : "outline"}
                  onClick={() => openTenantPlanModal(p.id)}
                  className="w-full text-xs font-bold h-8"
                >
                  تعيين هذه الباقة لمنشأة
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Subscriptions Activity Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="text-xs font-bold text-foreground">أحدث طلبات الاشتراك وتحديثات الباقات</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            سجل حركة المنشآت عند بدء الدفع، الترقية، أو إدخال أرقام التواصل.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
              <tr>
                <th className="py-3 px-4">المنشأة</th>
                <th className="py-3 px-3">الباقة</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">رقم الهاتف</th>
                <th className="py-3 px-3">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.subscriptions && data.subscriptions.length > 0 ? (
                data.subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="size-3 text-muted-foreground" />
                      <span>{s.tenant_name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-primary font-bold">{s.plan}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {s.contact_phone || "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {s.created_at ? s.created_at.slice(0, 16).replace("T", " ") : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                    لا توجد سجلات اشتراك حديثة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Allocation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <span>ترقية أو تعيين باقة لمنشأة</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <p className="text-muted-foreground">
              تطبيق الباقة يحدّث فوراً حدود المستخدمين، الفروع، والمبيعات الشهرية للمنشأة المختارة في قاعدة البيانات.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">اختر المنشأة (Tenant):</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (حالياً: {t.plan})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">الباقة المستهدفة (Target Plan):</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "trial", name: "تجريبية (Trial - 14 يوم)", desc: "3 مستخدمين، فرع واحد" },
                  { id: "starter", name: "البداية (Starter)", desc: "5 مستخدمين، فرع واحد" },
                  { id: "pro", name: "المحترفين (Pro)", desc: "15 مستخدم، 3 فروع" },
                  { id: "enterprise", name: "المؤسسات (Enterprise)", desc: "مستخدمين وفروع غير محدودة" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTargetPlan(p.id)}
                    className={`p-2.5 rounded-xl border text-right transition-colors ${
                      targetPlan === p.id
                        ? "border-primary bg-primary/10 text-foreground font-bold ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="font-bold text-foreground">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={savingPlan}
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateTenantPlan}
              disabled={savingPlan}
              className="gap-1.5 font-bold"
            >
              {savingPlan ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              <span>تطبيق الترقية فوراً</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
