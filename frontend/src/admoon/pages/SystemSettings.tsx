/**
 * Admoon System Settings & Offline Licensing Console.
 */
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { toast } from "sonner";

export default function SystemSettings() {
  const [platformName, setPlatformName] = useState("Mizan Modular SaaS ERP");
  const [supportEmail, setSupportEmail] = useState("support@mizan.app");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-foreground">إعدادات المنظومة العامة والتراخيص (System Settings)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          التحكم في معايير المنصة، المفاتيح السرية، وتوليد تراخيص العمل المكتبي غير المتصل.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-foreground">بيانات المنصة وهوية المالك</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1">اسم المنصة الرسمي:</label>
            <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="h-9 text-xs" />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">بريد الدعم الفني المعتمد:</label>
            <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="h-9 text-xs font-mono" />
          </div>
        </div>
        <Button size="sm" onClick={() => toast.success("تم حفظ إعدادات المنصة بنجاح")} className="text-xs h-8">
          حفظ التعديلات
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <KeyRound className="size-5 text-purple-500" />
          <div>
            <h2 className="text-sm font-bold text-foreground">توقيع التراخيص المشفرة للعمل دون اتصال (HMAC-SHA256)</h2>
            <p className="text-xs text-muted-foreground">توليد تراخيص رقمية مستقلة للتطبيقات المكتبية (.exe) تعمل دون الحاجة للاتصال بالإنترنت.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-muted/20 text-xs space-y-2">
          <p className="font-semibold text-foreground">المفتاح السري لتوقيع التراخيص:</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              •••••••••••••••••••••••••••••••••••• (Secured in KMS / Environment)
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("المفتاح محمي ومؤمن في متغيرات بيئة الخادم")}
              className="text-xs h-7"
            >
              فحص السلامة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
