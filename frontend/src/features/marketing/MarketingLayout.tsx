import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Layers,
  Lock,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { Button } from "@/components/kit/button";

interface MarketingLayoutProps {
  children?: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  const location = useLocation();
  const { user, token, tenant } = useAuth();
  const { themeMode, toggleThemeMode } = useUiStore();
  const shouldReduceMotion = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Max 4 links in main navigation
  const navLinks = [
    { href: "/product", label: "المنتج" },
    { href: "/industries", label: "القطاعات" },
    { href: "/pricing", label: "الأسعار" },
    { href: "/docs", label: "التوثيق" },
  ];

  const appDestination = tenant ? `/c/${tenant.slug}` : "/pos";

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col bg-background font-sans text-foreground transition-colors duration-150 selection:bg-primary selection:text-primary-foreground"
    >
      {/* 1. Sticky Modern Top Navigation — Hairline border, no blur gimmick */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 min-h-[44px] py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight text-foreground leading-tight">
                  ميزان ERP
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  إدارة تجار مواد البناء
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links — Max 4 Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="التنقل الرئيسي">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Utilities (Theme Toggle + Single Clear CTA) */}
          <div className="flex items-center gap-2.5">
            {/* Dark/Light Mode Toggle — 44px touch target */}
            <button
              onClick={toggleThemeMode}
              title={themeMode === "dark" ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="تبديل مظهر العرض"
            >
              {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Authenticated Dashboard vs Guest Start CTA */}
            {token && user ? (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium min-h-[44px] px-4 text-xs"
                render={<Link to={appDestination} />}
                nativeButton={false}
              >
                لوحة التحكم
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:flex min-h-[44px] items-center px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium min-h-[44px] px-5 text-xs shadow-xs"
                  render={<Link to="/signup" />}
                  nativeButton={false}
                >
                  ابدأ مجاناً
                </Button>
              </div>
            )}

            {/* Mobile Menu Hamburger — 44px target */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-b border-border bg-card px-4 py-4 md:hidden"
            >
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`rounded-md px-3 py-3 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-border flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    className="flex min-h-[44px] items-center justify-center rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    تسجيل الدخول للمنظومة
                  </Link>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium min-h-[44px] text-xs"
                    render={<Link to="/signup" />}
                    nativeButton={false}
                  >
                    ابدأ تجربة مجانية (14 يوماً)
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* 3. Four Dense Columns Footer — Hairline top, domain links, no fluff */}
      <footer className="border-t border-border bg-card text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 sm:py-10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-y-8 lg:grid-cols-4">
            {/* Col 1: Identity & Live Merchant Reliability */}
            <div className="col-span-2 lg:col-span-1 space-y-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="font-semibold text-base text-foreground">
                  ميزان ERP
                </span>
              </Link>
              <p className="text-xs leading-relaxed text-muted-foreground">
                منظومة نقاط البيع والمخازن والخزينة لتجار ومحلات مواد البناء والسباكة والكهرباء بمصر.
                صُممت لتعمل بدون توقف بنمط Offline-First مع عزل بيانات مشفر.
              </p>

              {/* System Reliability Indicator */}
              <div className="flex items-center gap-2 pt-1 text-xs font-mono text-foreground">
                <span className="flex h-2 w-2 rounded-full bg-success" />
                <span>حالة النظام: مستقرة 99.98%</span>
              </div>

              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-success" /> معتمد ETA مصر
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-4 w-4 text-primary" /> تشفير TLS 1.3
                </span>
              </div>
            </div>

            {/* Col 2: Core Platform Capabilities */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                إمكانيات المنظومة
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors">
                    نقطة البيع السريعة والكاشير
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors">
                    إدارة المستودعات والوحدات المركبة
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors">
                    الخزينة والعهد ويومية الموردين
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors">
                    فواتير الباركود والطباعة الحرارية
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-foreground transition-colors">
                    تقارير الورديات والـ Z-Report
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Building Materials Sectors */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                قطاعات مواد البناء
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/industries" className="hover:text-foreground transition-colors">
                    الأدوات الصحية والسباكة
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-foreground transition-colors">
                    تجار الكهرباء والإنارة
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-foreground transition-colors">
                    الدهانات ومستلزمات البناء
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-foreground transition-colors">
                    الحديد والأسمنت ومواد العزل
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-foreground transition-colors">
                    المسامير والعدد والمعدات
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Documentation & Legal */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                التوثيق والمساعدة
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/docs" className="hover:text-foreground transition-colors">
                    دليل تشغيل الكاشير والمخازن
                  </Link>
                </li>
                <li>
                  <Link to="/docs/dev/hardware-escpos" className="hover:text-foreground transition-colors">
                    ربط الطابعات وقوارئ الباركود
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground transition-colors">
                    الأسعار وباقات الاشتراك
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors">
                    طلب عرض توضيحي (Demo)
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-foreground transition-colors">
                    عن المنصة ومبادئ العمل
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar — Hairline top border */}
          <div className="mt-6 sm:mt-8 flex flex-col items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row gap-2.5 sm:gap-3">
            <div>
              © {new Date().getFullYear()} ميزان ERP. جميع الحقوق محفوظة لتجار ومحلات مواد البناء بمصر.
            </div>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-foreground transition-colors">
                عن الشركة
              </Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                الباقات
              </Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                اتصل بنا
              </Link>
              <Link to="/docs" className="hover:text-foreground transition-colors">
                سياسة الخصوصية
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
