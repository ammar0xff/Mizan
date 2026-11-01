/**
 * Admoon Hosting & Deployment Management Page.
 * 
 * Manages deployment modes: Cloud SaaS, Local Single-Machine, LAN, VPS, and Hybrid.
 */
import { useState } from "react";
import { Server, Globe, Wifi, Terminal } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "sonner";

export default function HostingConfig() {
  const [selectedMode, setSelectedMode] = useState("cloud_saas");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-foreground">بيئات الاستضافة والنشر (Hosting & Deployments)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          إدارة ودعم أنماط الاستضافة المتعددة: السحابة العامة، الشبكات المحلية، الخوادم الخاصة، والتطبيقات المكتبية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { id: "cloud_saas", name: "SaaS سحابي كامل", icon: Globe, count: "3 منشآت", status: "Healthy" },
          { id: "desktop_standalone", name: "مكتبي محلي (.exe)", icon: Terminal, count: "1 منشأة", status: "Active Offline" },
          { id: "lan_deployment", name: "شبكة محلية (LAN)", icon: Wifi, count: "0 منشآت", status: "Ready" },
          { id: "vps_deployment", name: "خادم خاص (VPS)", icon: Server, count: "1 منشأة", status: "Active VPS" },
        ].map((h) => {
          const Icon = h.icon;
          const isSelected = selectedMode === h.id;
          return (
            <div
              key={h.id}
              onClick={() => setSelectedMode(h.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {h.status}
                </span>
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">{h.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{h.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">معايير بيئة النمط المختار ({selectedMode})</h2>
          <Button size="sm" onClick={() => toast.success("تم تحديث إعدادات الاستضافة العامة")} className="text-xs h-8">
            حفظ التغييرات
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground font-semibold">تكوين النطاق العكسي (Reverse Proxy):</span>
            <p className="font-bold text-foreground">Nginx / Traefik Automated SSL</p>
            <p className="text-[11px] text-muted-foreground">شهادات Let's Encrypt مجانية وتجديد دوري</p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground font-semibold">المزامنة مع السحابة:</span>
            <p className="font-bold text-foreground">Bidirectional Hybrid Sync</p>
            <p className="text-[11px] text-muted-foreground">تجميع العمليات والمزامنة عند توفر الاتصال</p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground font-semibold">عزل الحاويات:</span>
            <p className="font-bold text-foreground">Docker Engine / Compose v2</p>
            <p className="text-[11px] text-muted-foreground">حاويات معزولة للباك إند وقاعدة البيانات</p>
          </div>
        </div>
      </div>
    </div>
  );
}
