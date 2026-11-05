import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  Blocks,
  Boxes,
  Briefcase,
  ChefHat,
  Clock,
  Contact,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Pill,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  Wallet,
  Warehouse,
  Globe,
  Compass,
  Dumbbell,
  Hotel,
  Palette,
  Scale,
  Scissors,
  Stethoscope,
  Wrench,
  Factory,
  Utensils,
  FlaskConical,
  Printer,
  HardHat,
  Building2,
  Tractor,
  Zap,
  Landmark,
  Shield,
  Building,
  Ticket,
  Flame,
  Bed,
  Calendar,
  HeartPulse,
  Microscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  perm: string; // "" = always visible; checked against the user's real permissions
  module?: string; // "" or omitted = always active; otherwise checked against active_modules
  icon: LucideIcon;
  group: "main" | "stock" | "money" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  // Core & POS
  { to: "/", label: "لوحة التحكم", perm: "", module: "", icon: LayoutDashboard, group: "main" },
  { to: "/pos", label: "نقطة البيع", perm: "pos", module: "pos", icon: ShoppingCart, group: "main" },
  { to: "/sales", label: "المبيعات", perm: "sales", module: "pos", icon: Receipt, group: "main" },
  { to: "/shifts", label: "الورديات", perm: "shifts", module: "pos", icon: Clock, group: "main" },

  // Pharmacy & Dispensing Specialized Injections
  { to: "/pharmacy", label: "الصيدلية والروشتات", perm: "pos", module: "pharmacy", icon: Pill, group: "main" },

  // Restaurant & Hospitality Specialized Injections
  { to: "/restaurant/tables", label: "إدارة الطاولات والصالة", perm: "pos", module: "restaurant", icon: LayoutGrid, group: "main" },
  { to: "/restaurant/kitchen", label: "شاشة المطبخ (KDS)", perm: "pos", module: "restaurant", icon: ChefHat, group: "main" },

  // School & Education Specialized Injections
  { to: "/school/students", label: "شؤون الطلاب والأقساط", perm: "customers", module: "school", icon: GraduationCap, group: "main" },

  // Consulting & Professional Services
  { to: "/services", label: "الخدمات والاستشارات", perm: "customers", module: "services", icon: Briefcase, group: "main" },

  // Distribution & Supply Chain (Phase 2)
  { to: "/wholesale", label: "تجارة الجملة والتوزيع", perm: "sales", module: "wholesale", icon: Boxes, group: "stock" },
  { to: "/logistics", label: "الشحن والأسطول", perm: "operations", module: "logistics", icon: Truck, group: "main" },
  { to: "/wms", label: "مستودعات 3PL", perm: "inventory", module: "wms", icon: Warehouse, group: "stock" },
  { to: "/ecommerce", label: "المتجر الإلكتروني", perm: "sales", module: "ecommerce", icon: Globe, group: "main" },
  { to: "/storefront", label: "متجر المنشأة (Storefront)", perm: "sales", module: "storefront", icon: Store, group: "main" },

  // Service-Based Systems (Phase 3)
  { to: "/clinic", label: "العيادات والمستشفيات", perm: "customers", module: "clinic", icon: Stethoscope, group: "main" },
  { to: "/law", label: "المحاماة والقضايا", perm: "customers", module: "law", icon: Scale, group: "main" },
  { to: "/travel", label: "السياحة وحجوزات السفر", perm: "sales", module: "travel", icon: Compass, group: "main" },
  { to: "/hospitality", label: "الفنادق والضيافة (PMS)", perm: "operations", module: "hospitality", icon: Hotel, group: "main" },
  { to: "/gym", label: "الجيم واللياقة البدنية", perm: "customers", module: "gym", icon: Dumbbell, group: "main" },
  { to: "/salon", label: "الصالون والتجميل والسبا", perm: "pos", module: "salon", icon: Scissors, group: "main" },
  { to: "/agency", label: "الدعاية والإعلام والترجمة", perm: "operations", module: "agency", icon: Palette, group: "main" },
  { to: "/field-service", label: "الصيانة الميدانية (FSM)", perm: "operations", module: "field_service", icon: Wrench, group: "stock" },

  // Manufacturing & Industrial (Phase 4)
  { to: "/mfg", label: "التصنيع الميكانيكي (BOM/MRP)", perm: "operations", module: "mfg", icon: Factory, group: "stock" },
  { to: "/fod", label: "الصناعات الغذائية (HACCP)", perm: "operations", module: "fod", icon: Utensils, group: "stock" },
  { to: "/phm", label: "التصنيع الدوائي (cGMP)", perm: "operations", module: "phm", icon: FlaskConical, group: "stock" },
  { to: "/prn", label: "الطباعة والتغليف (Job Dockets)", perm: "operations", module: "prn", icon: Printer, group: "stock" },

  // Projects & Infrastructure (Phase 5)
  { to: "/cst", label: "المقاولات العامة والإنشاءات", perm: "operations", module: "cst", icon: HardHat, group: "stock" },
  { to: "/rec", label: "التطوير العقاري وإدارة الأملاك", perm: "operations", module: "rec", icon: Building2, group: "main" },
  { to: "/agr", label: "الزراعة وإدارة المزارع", perm: "operations", module: "agr", icon: Tractor, group: "stock" },
  { to: "/eng", label: "محطات الطاقة وتوليد الكهرباء", perm: "operations", module: "eng", icon: Zap, group: "stock" },

  // Specialized & Public Sector (Phase 6)
  { to: "/bnk", label: "البنوك والمؤسسات المصرفية", perm: "finance", module: "bnk", icon: Landmark, group: "money" },
  { to: "/ins", label: "التأمين وإدارة المطالبات", perm: "finance", module: "ins", icon: Shield, group: "money" },
  { to: "/gov", label: "القطاع الحكومي والمنظمات", perm: "operations", module: "gov", icon: Building, group: "main" },
  { to: "/ent", label: "الترفيه والفعاليات والملاهي", perm: "operations", module: "ent", icon: Ticket, group: "main" },
  { to: "/oil", label: "عمليات البترول والغاز", perm: "operations", module: "oil", icon: Flame, group: "stock" },

  // Stock & Inventory
  { to: "/products", label: "المنتجات", perm: "inventory", module: "inventory", icon: Package, group: "stock" },
  { to: "/inventory", label: "المخزون والتقييم", perm: "inventory", module: "inventory", icon: Boxes, group: "stock" },
  { to: "/operations", label: "العمليات المخزنية", perm: "operations", module: "inventory", icon: ArrowLeftRight, group: "stock" },
  { to: "/purchases", label: "المشتريات والتوريد", perm: "purchases", module: "inventory", icon: Truck, group: "stock" },

  // Finance & AR/AP
  { to: "/customers", label: "العملاء (AR)", perm: "customers", module: "finance", icon: Contact, group: "money" },
  { to: "/suppliers", label: "الموردون (AP)", perm: "customers", module: "finance", icon: Truck, group: "money" },
  { to: "/finance", label: "المالية والخزائن", perm: "finance", module: "finance", icon: Wallet, group: "money" },
  { to: "/reports", label: "التقارير", perm: "reports", module: "core", icon: BarChart3, group: "money" },

  // HR & Payroll
  { to: "/hr", label: "الموظفون", perm: "payroll", module: "hr", icon: UserCog, group: "admin" },
  { to: "/hr/payroll", label: "الرواتب", perm: "payroll", module: "hr", icon: Wallet, group: "admin" },

  // Administration & Marketplace
  { to: "/modules", label: "سوق الوحدات والأنشطة", perm: "settings", module: "", icon: Blocks, group: "admin" },
  { to: "/archive", label: "الأرشيف", perm: "archive", module: "core", icon: Archive, group: "admin" },
  { to: "/users", label: "المستخدمون والصلاحيات", perm: "users", module: "core", icon: ShieldCheck, group: "admin" },
  { to: "/settings", label: "الإعدادات", perm: "settings", module: "core", icon: Settings, group: "admin" },
];

export const NAV_GROUPS: Record<NavItem["group"], string> = {
  main: "التشغيل والعمليات",
  stock: "المخزون والتوريد",
  money: "المال والعلاقات",
  admin: "الإدارة والنظام",
};

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export function getSectorNavigation(
  sector: string | undefined,
  can: (perm: string) => boolean,
  hasModule: (mod: string) => boolean,
): NavGroup[] {
  if (sector === "healthcare") {
    const rawGroups: NavGroup[] = [
      {
        id: "clinical",
        label: "العيادات والتشغيل الطبي",
        items: [
          { to: "/clinic", label: "لوحة التحكم الطبية", perm: "", module: "", icon: Stethoscope, group: "main" },
          { to: "/clinic?tab=appointments", label: "حجز المواعيد والانتظار", perm: "", module: "", icon: Calendar, group: "main" },
          { to: "/clinic?tab=patients", label: "سجلات وملفات المرضى (EMR)", perm: "", module: "", icon: Users, group: "main" },
          { to: "/clinic?tab=emr", label: "الكشوفات السريرية والتشخيص", perm: "", module: "", icon: HeartPulse, group: "main" },
          { to: "/clinic?tab=rx_labs", label: "الروشتات والوصفات الرقمية", perm: "", module: "", icon: Pill, group: "main" },
          { to: "/clinic?tab=labs", label: "الفحوصات والتحاليل المخبرية", perm: "", module: "", icon: Microscope, group: "main" },
          { to: "/clinic?tab=beds", label: "أسرّة التنويم والأجنحة", perm: "", module: "", icon: Bed, group: "main" },
        ],
      },
      {
        id: "pharmacy_supplies",
        label: "الصيدلية والمستلزمات الطبية",
        items: [
          { to: "/pharmacy", label: "صيدلية وصرف الأدوية", perm: "pos", module: "pharmacy", icon: Pill, group: "stock" },
          { to: "/inventory", label: "المخزون والمستلزمات الطبية", perm: "inventory", module: "inventory", icon: Boxes, group: "stock" },
          { to: "/purchases", label: "طلبيات وتوريد الأدوية", perm: "purchases", module: "inventory", icon: Truck, group: "stock" },
        ],
      },
      {
        id: "medical_finance",
        label: "المالية والفوترة الطبية",
        items: [
          { to: "/sales", label: "فواتير الكشوفات والتأمين", perm: "sales", module: "", icon: Receipt, group: "money" },
          { to: "/customers", label: "حسابات المرضى والتعاقدات", perm: "customers", module: "finance", icon: Contact, group: "money" },
          { to: "/suppliers", label: "شركات الأدوية والموردين", perm: "customers", module: "finance", icon: Truck, group: "money" },
          { to: "/finance", label: "الخزائن والإيرادات الطبية", perm: "finance", module: "finance", icon: Wallet, group: "money" },
          { to: "/reports", label: "التقارير الطبية والمالية", perm: "reports", module: "core", icon: BarChart3, group: "money" },
        ],
      },
      {
        id: "medical_staff",
        label: "الكادر الطبي والإدارة",
        items: [
          { to: "/hr", label: "الأطباء وهيئة التمريض", perm: "payroll", module: "hr", icon: UserCog, group: "admin" },
          { to: "/shifts", label: "نوبتجيات ومناوبات الكادر", perm: "shifts", module: "core", icon: Clock, group: "admin" },
          { to: "/modules", label: "سوق الوحدات الطبية", perm: "settings", module: "", icon: Blocks, group: "admin" },
          { to: "/users", label: "المستخدمون وصلاحيات النظام", perm: "users", module: "core", icon: ShieldCheck, group: "admin" },
          { to: "/settings", label: "إعدادات العيادات والمجمع", perm: "settings", module: "core", icon: Settings, group: "admin" },
        ],
      },
    ];

    return rawGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => (!item.perm || can(item.perm)) && (!item.module || hasModule(item.module))),
      }))
      .filter((g) => g.items.length > 0);
  }

  if (sector === "restaurant") {
    const rawGroups: NavGroup[] = [
      {
        id: "dining",
        label: "الصالة والتشغيل الفندقي",
        items: [
          { to: "/restaurant/tables", label: "إدارة الطاولات والصالة", perm: "pos", module: "restaurant", icon: LayoutGrid, group: "main" },
          { to: "/restaurant/kitchen", label: "شاشة المطبخ (KDS)", perm: "pos", module: "restaurant", icon: ChefHat, group: "main" },
          { to: "/pos", label: "نقطة بيع المطعم والطلبات", perm: "pos", module: "pos", icon: ShoppingCart, group: "main" },
          { to: "/sales", label: "فواتير الطلبات والضيافة", perm: "sales", module: "pos", icon: Receipt, group: "main" },
        ],
      },
      {
        id: "kitchen_stock",
        label: "المطبخ والمخزون الغذائي",
        items: [
          { to: "/products", label: "قائمة المأكولات والمشروبات (Menu)", perm: "inventory", module: "inventory", icon: Utensils, group: "stock" },
          { to: "/inventory", label: "المكونات والمخزون الغذائي", perm: "inventory", module: "inventory", icon: Boxes, group: "stock" },
          { to: "/purchases", label: "توريدات الأغذية والخضار", perm: "purchases", module: "inventory", icon: Truck, group: "stock" },
        ],
      },
      {
        id: "dining_finance",
        label: "المالية وحسابات العملاء",
        items: [
          { to: "/customers", label: "حسابات عملاء الشركات والولاء", perm: "customers", module: "finance", icon: Contact, group: "money" },
          { to: "/suppliers", label: "موردو اللحوم والأغذية", perm: "customers", module: "finance", icon: Truck, group: "money" },
          { to: "/finance", label: "الخزينة والمالية اليومية", perm: "finance", module: "finance", icon: Wallet, group: "money" },
          { to: "/reports", label: "تقارير المبيعات وهدر المطبخ", perm: "reports", module: "core", icon: BarChart3, group: "money" },
        ],
      },
      {
        id: "dining_staff",
        label: "الكادر والإدارة",
        items: [
          { to: "/hr", label: "الشيفات وطاقم الخدمة", perm: "payroll", module: "hr", icon: UserCog, group: "admin" },
          { to: "/shifts", label: "ورديات العمل", perm: "shifts", module: "pos", icon: Clock, group: "admin" },
          { to: "/settings", label: "إعدادات المطعم", perm: "settings", module: "core", icon: Settings, group: "admin" },
        ],
      },
    ];

    return rawGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => (!item.perm || can(item.perm)) && (!item.module || hasModule(item.module))),
      }))
      .filter((g) => g.items.length > 0);
  }

  if (sector === "pharmacy") {
    const rawGroups: NavGroup[] = [
      {
        id: "dispensing",
        label: "صيدلية وصرف الأدوية",
        items: [
          { to: "/pharmacy", label: "الصيدلية وصرف الروشتات", perm: "pos", module: "pharmacy", icon: Pill, group: "main" },
          { to: "/pos", label: "كاشير ونقطة بيع الأدوية", perm: "pos", module: "pos", icon: ShoppingCart, group: "main" },
          { to: "/sales", label: "مبيعات الأدوية والمستلزمات", perm: "sales", module: "pos", icon: Receipt, group: "main" },
        ],
      },
      {
        id: "pharmacy_stock",
        label: "الأدوية والتشغيلات والصلاحيات",
        items: [
          { to: "/products", label: "الأدوية والمستحضرات", perm: "inventory", module: "inventory", icon: Package, group: "stock" },
          { to: "/inventory", label: "مخزون الأدوية وتواريخ الصلاحية", perm: "inventory", module: "inventory", icon: Boxes, group: "stock" },
          { to: "/suppliers", label: "شركات ومستودعات الأدوية", perm: "customers", module: "finance", icon: Truck, group: "stock" },
          { to: "/purchases", label: "طلبيات وتوريد الأدوية", perm: "purchases", module: "inventory", icon: Truck, group: "stock" },
        ],
      },
      {
        id: "pharmacy_finance",
        label: "التأمين والمالية",
        items: [
          { to: "/customers", label: "عملاء التأمين والنقدي", perm: "customers", module: "finance", icon: Contact, group: "money" },
          { to: "/finance", label: "الخزائن والمالية", perm: "finance", module: "finance", icon: Wallet, group: "money" },
          { to: "/reports", label: "تقارير الصيدلية والنواقص", perm: "reports", module: "core", icon: BarChart3, group: "money" },
        ],
      },
      {
        id: "pharmacy_admin",
        label: "فريق الصيادلة والإدارة",
        items: [
          { to: "/hr", label: "الصيادلة ومساعدو الصيدلي", perm: "payroll", module: "hr", icon: UserCog, group: "admin" },
          { to: "/shifts", label: "ورديات الصيدلية", perm: "shifts", module: "pos", icon: Clock, group: "admin" },
          { to: "/settings", label: "إعدادات الصيدلية", perm: "settings", module: "core", icon: Settings, group: "admin" },
        ],
      },
    ];

    return rawGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => (!item.perm || can(item.perm)) && (!item.module || hasModule(item.module))),
      }))
      .filter((g) => g.items.length > 0);
  }

  // Default Standard Navigation
  const visible = NAV_ITEMS.filter((n) => (!n.perm || can(n.perm)) && (!n.module || hasModule(n.module)));
  return (Object.keys(NAV_GROUPS) as NavItem["group"][])
    .map((g) => ({
      id: g,
      label: NAV_GROUPS[g],
      items: visible.filter((n) => n.group === g),
    }))
    .filter((g) => g.items.length > 0);
}
