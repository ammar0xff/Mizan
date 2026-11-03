import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingCart,
  Receipt,
  Boxes,
  Truck,
  Wallet,
  UserCog,
  Store,
  Printer,
  Cpu,
  Fingerprint,
  UtensilsCrossed,
  Pill,
  Stethoscope,
  GraduationCap,
  Scale,
  Hotel,
  Dumbbell,
  Factory,
  Blocks,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/kit/popover";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";
import { useModulesStore } from "@/stores/modules";
import { useTenantNav } from "@/lib/tenant";
import { sound } from "@/lib/sound";

interface AppTile {
  id: string;
  label: string;
  labelEn: string;
  to: string;
  icon: any;
  color: string;
  isCore?: boolean;
}

const ALL_SYSTEM_APPS: AppTile[] = [
  {
    id: "pos",
    label: "نقطة البيع (POS)",
    labelEn: "Point of Sale",
    to: "/pos",
    icon: ShoppingCart,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "sales",
    label: "المبيعات والفوترة",
    labelEn: "Sales & Invoicing",
    to: "/sales",
    icon: Receipt,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "inventory",
    label: "المخزون والمستودعات",
    labelEn: "Inventory & Stock",
    to: "/inventory",
    icon: Boxes,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "purchases",
    label: "المشتريات والتوريد",
    labelEn: "Purchases",
    to: "/purchases",
    icon: Truck,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "finance",
    label: "المالية والخزائن",
    labelEn: "Finance & Accounts",
    to: "/finance",
    icon: Wallet,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "hr",
    label: "الموارد البشرية",
    labelEn: "Human Resources",
    to: "/hr",
    icon: UserCog,
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "storefront",
    label: "المتجر الإلكتروني",
    labelEn: "E-Commerce Storefront",
    to: "/storefront",
    icon: Store,
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "restaurant",
    label: "المطاعم والصالة",
    labelEn: "Restaurant & Tables",
    to: "/restaurant/tables",
    icon: UtensilsCrossed,
    color: "from-red-500 to-amber-600",
  },
  {
    id: "pharmacy",
    label: "الصيدلية والأدوية",
    labelEn: "Pharmacy",
    to: "/pharmacy",
    icon: Pill,
    color: "from-emerald-600 to-teal-700",
  },
  {
    id: "clinic",
    label: "العيادات والمستشفيات",
    labelEn: "Clinic & Patients",
    to: "/clinic",
    icon: Stethoscope,
    color: "from-sky-500 to-cyan-600",
  },
  {
    id: "school",
    label: "المدارس والأكاديميات",
    labelEn: "School & Students",
    to: "/school/students",
    icon: GraduationCap,
    color: "from-indigo-500 to-blue-600",
  },
  {
    id: "law",
    label: "المحاماة والقضايا",
    labelEn: "Law Practice",
    to: "/law",
    icon: Scale,
    color: "from-stone-600 to-stone-800",
  },
  {
    id: "hospitality",
    label: "الفنادق والضيافة",
    labelEn: "Hotel PMS",
    to: "/hospitality",
    icon: Hotel,
    color: "from-amber-600 to-yellow-600",
  },
  {
    id: "gym",
    label: "الجيم واللياقة",
    labelEn: "Gym & Fitness",
    to: "/gym",
    icon: Dumbbell,
    color: "from-lime-500 to-emerald-600",
  },
  {
    id: "mfg",
    label: "التصنيع والإنتاج",
    labelEn: "Manufacturing MRP",
    to: "/mfg",
    icon: Factory,
    color: "from-slate-600 to-slate-800",
  },
  {
    id: "pos_hardware",
    label: "طابعات ونقاط البيع",
    labelEn: "POS Hardware",
    to: "/pos",
    icon: Printer,
    color: "from-pink-600 to-rose-700",
  },
  {
    id: "automation_worker",
    label: "الأتمتة والمهام",
    labelEn: "Automation Worker",
    to: "/operations",
    icon: Cpu,
    color: "from-purple-600 to-indigo-700",
  },
  {
    id: "zk_attendance",
    label: "أجهزة البصمة والدوام",
    labelEn: "Biometrics & Sync",
    to: "/hr",
    icon: Fingerprint,
    color: "from-emerald-500 to-green-600",
  },
];

export function OdooAppLauncher() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { activeModules, hasModule } = useModulesStore();
  const { tenantTo } = useTenantNav();

  // Filter apps installed in this tenant + core apps
  const installedApps = ALL_SYSTEM_APPS.filter(
    (app) => app.isCore || hasModule(app.id) || activeModules.includes(app.id)
  );

  const displayedApps = installedApps.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.label.toLowerCase().includes(q) ||
      app.labelEn.toLowerCase().includes(q)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition"
            title="تطبيقات ميزان (Odoo Apps Launcher)"
          />
        }
      >
        <LayoutGrid className="size-4 text-primary" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] p-0 rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Launcher Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <LayoutGrid className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">
                تطبيقات المنظومة (Odoo Apps)
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {installedApps.length} تطبيق مفعل في المنشأة
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Modulized
          </Badge>
        </div>

        {/* Quick Search inside Launcher */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute right-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن تطبيق أو قسم…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pe-8 ps-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3 max-h-[340px] overflow-y-auto">
          {displayedApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.id}
                to={tenantTo(app.to)}
                onClick={() => {
                  sound.click();
                  setOpen(false);
                }}
                className="group flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition text-center"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-white shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="w-full">
                  <div className="text-[11px] font-bold text-foreground truncate">
                    {app.label.split(" ")[0]}
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate">
                    {app.labelEn}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Launcher Footer -> App Store */}
        <div className="border-t border-white/10 bg-white/[0.02] p-2.5">
          <Link
            to={tenantTo("/modules")}
            onClick={() => {
              sound.click();
              setOpen(false);
            }}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition"
          >
            <div className="flex items-center gap-2">
              <Blocks className="size-4" />
              <span>سوق التطبيقات والوحدات (App Store)</span>
            </div>
            <ExternalLink className="size-3.5 opacity-70" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
