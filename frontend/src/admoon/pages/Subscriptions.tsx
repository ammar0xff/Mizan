/**
 * Admoon Subscriptions & Plan Tiers Page.
 * 
 * Manage SaaS subscription tiers (Starter, Pro, Business, Enterprise, Custom),
 * pricing, quotas, and feature flags.
 */
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

const PLANS = [
  {
    id: "trial",
    name: "الباقة التجريبية (Trial)",
    priceMonthly: 0,
    priceAnnual: 0,
    maxUsers: 3,
    maxStorageMb: 2048,
    features: ["نقاط البيع السريعة POS", "إدارة المستودعات الأساسية", "المبيعات والورديات", "دعم فني عبر البريد"],
    popular: false,
  },
  {
    id: "starter",
    name: "باقة البداية (Starter)",
    priceMonthly: 450,
    priceAnnual: 4500,
    maxUsers: 5,
    maxStorageMb: 5120,
    features: ["كافة مزايا التجريبية", "إدارة الموردين والعملاء", "أرشفة إلكترونية للوثائق", "شاشات KDS للمطابخ"],
    popular: false,
  },
  {
    id: "pro",
    name: "باقة المحترفين (Pro)",
    priceMonthly: 850,
    priceAnnual: 8500,
    maxUsers: 15,
    maxStorageMb: 20480,
    features: [
      "كافة قطاعات الأنشطة (نوادي، مطاعم، مدارس)",
      "تفرع Neon وقاعدة بيانات مستقلة",
      "إدارة الرواتب وشؤون الموظفين HR",
      "نسخ احتياطي يومي آلي مشفر",
      "دعم فني مباشر على مدار الساعة",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "باقة المؤسسات (Enterprise)",
    priceMonthly: 1950,
    priceAnnual: 19500,
    maxUsers: 50,
    maxStorageMb: 102400,
    features: [
      "خادم VPS مخصص مع عزل أمني فائق",
      "تخزين سحابي غير محدود S3",
      "نطاق مخصص وشهادة SSL خاصة",
      "تراخيص مكتبية دون اتصال غير محدودة",
      "مدير حساب تقني مخصص",
    ],
    popular: false,
  },
];

export default function Subscriptions() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">باقات وخطط الاشتراك (Subscription Tiers)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة تسعير الخطط الشهرية والسنوية، الحصص، ومحددات الميزات لكافة المستأجرين.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const price = billingCycle === "monthly" ? p.priceMonthly : p.priceAnnual;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between relative ${
                p.popular ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  الأكثر طلباً
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">{p.name}</h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground num">{formatCurrency(price)}</span>
                    <span className="text-xs text-muted-foreground">/{billingCycle === "monthly" ? "شهر" : "سنة"}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">أقصى مستخدمين:</span>
                    <span className="font-bold text-foreground num">{p.maxUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">سعة التخزين:</span>
                    <span className="font-bold text-foreground num">{p.maxStorageMb / 1024} GB</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-[11px] text-muted-foreground">المزايا والحصص:</p>
                  {p.features.map((feat, idx) => (
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
                  variant={p.popular ? "default" : "outline"}
                  onClick={() => toast.success(`تم اختيار تعديل خطة '${p.name}'`)}
                  className="w-full text-xs font-bold h-8"
                >
                  تعديل معايير الباقة
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
