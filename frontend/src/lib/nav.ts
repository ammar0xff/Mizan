import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  Blocks,
  Boxes,
  ChefHat,
  Clock,
  Contact,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCog,
  Wallet,
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

  // Restaurant & Hospitality Specialized Injections
  { to: "/restaurant/tables", label: "إدارة الطاولات والصالة", perm: "pos", module: "restaurant", icon: LayoutGrid, group: "main" },
  { to: "/restaurant/kitchen", label: "شاشة المطبخ (KDS)", perm: "pos", module: "restaurant", icon: ChefHat, group: "main" },

  // School & Education Specialized Injections
  { to: "/school/students", label: "شؤون الطلاب والأقساط", perm: "customers", module: "school", icon: GraduationCap, group: "main" },

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
