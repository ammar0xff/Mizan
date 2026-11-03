import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Layers,
  Lock,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { useI18nStore } from "@/i18n";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";

interface MarketingLayoutProps {
  children?: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  const location = useLocation();
  const { user, token, tenant } = useAuth();
  const { themeMode, toggleThemeMode } = useUiStore();
  const { locale, toggleLocale, dir } = useI18nStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: "/product", label: "المنصة والمنتج", labelEn: "Product" },
    { href: "/features", label: "المزايا والوظائف", labelEn: "Features" },
    { href: "/industries", label: "القطاعات المتخصصة", labelEn: "Industries" },
    { href: "/pricing", label: "الأسعار والباقات", labelEn: "Pricing" },
    { href: "/docs", label: "التوثيق وAPI", labelEn: "Documentation" },
    { href: "/about", label: "عن المنصة", labelEn: "About" },
    { href: "/blog", label: "المدونة", labelEn: "Blog" },
    { href: "/contact", label: "اتصل بنا", labelEn: "Contact" },
  ];

  const appDestination = tenant ? `/c/${tenant.slug}` : "/";

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand selection:text-white"
    >
      {/* 1. Announcement Bar */}
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-50 bg-gradient-to-r from-slate-900 via-brand-dark to-slate-900 px-4 py-2 text-center text-xs text-white shadow-xs dark:from-slate-950 dark:via-brand-dark dark:to-slate-950"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white text-[10px]">
                إصدار Mizan 3.0
              </Badge>
              <span className="font-medium text-slate-200">
                إطلاق معمارية الـ 47 موديول معياري، دعم طباعة الفواتير الحرارية، وعزل RLS الفوري.
              </span>
              <Link
                to="/features"
                className="font-bold underline hover:text-brand-light ms-1 inline-flex items-center gap-1"
              >
                استكشف الجديد <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </div>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              aria-label="إغلاق التنبيه"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Sticky Modern Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/25 transition-transform group-hover:scale-105">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  ميزان ERP
                </span>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  Mizan SaaS Suite
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  {locale === "ar" ? link.label : link.labelEn}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Utilities (Theme, Lang, Auth) */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={toggleLocale}
              title={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {locale === "ar" ? "EN" : "ع"}
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleThemeMode}
              title={themeMode === "dark" ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Authenticated vs Guest CTAs */}
            {token && user ? (
              <Button
                size="sm"
                className="bg-brand text-xs text-white hover:bg-brand/90 font-bold"
                render={<Link to={appDestination} />}
                nativeButton={false}
              >
                لوحة تحكم ERP
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden sm:inline-flex text-xs font-semibold text-slate-700 dark:text-slate-200"
                  render={<Link to="/login" />}
                  nativeButton={false}
                >
                  تسجيل الدخول
                </Button>
                <Button
                  size="sm"
                  className="bg-brand text-xs text-white hover:bg-brand/90 font-bold shadow-sm shadow-brand/20"
                  render={<Link to="/signup" />}
                  nativeButton={false}
                >
                  ابدأ مجاناً
                </Button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
            >
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {locale === "ar" ? link.label : link.labelEn}
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold"
                    render={<Link to="/login" />}
                    nativeButton={false}
                  >
                    تسجيل الدخول للنظام
                  </Button>
                  <Button
                    className="w-full bg-brand text-xs text-white font-bold"
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

      {/* 3. Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* 4. Comprehensive Enterprise SaaS Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Col 1: Identity & System Status */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/25">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                  ميزان ERP
                </span>
              </Link>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                المنظومة السحابية المعيارية الموحدة لإدارة العمليات التجارية والمالية. مصممة لدعم 47
                نشاطاً وقطاعاً، عزل تام بقواعد بيانات PostgreSQL RLS، ودعم كاشير فوري متوافق مع
                الطباعة الحرارية وهيئات الزكاة والضرائب.
              </p>

              {/* Live Operational Status Pill */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-900">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  كافة الخدمات تعمل بكفاءة 99.98%
                </span>
                <Link to="/docs" className="ms-auto text-brand underline text-[11px]">
                  سجل الحالة
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> معتمد ZATCA / ETA
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-4 w-4 text-brand" /> تشفير TLS 1.3
                </span>
              </div>
            </div>

            {/* Col 2: Product & Modules */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                المنصة والموديلات
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <Link to="/product" className="hover:text-brand transition-colors">
                    معمارية الـ 47 موديول
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-brand transition-colors">
                    نقاط البيع والكاشير POS
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-brand transition-colors">
                    المخزون والمستودعات WMS
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-brand transition-colors">
                    المالية ودفتر الأستاذ
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-brand transition-colors">
                    الموارد البشرية والرواتب
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-brand transition-colors">
                    شاشات المطبخ KDS
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Industry Solutions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                القطاعات والحلول
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <Link to="/industries" className="hover:text-brand transition-colors">
                    التجزئة والسوبرماركت
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-brand transition-colors">
                    المطاعم والكافيهات
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-brand transition-colors">
                    العيادات والمراكز الطبية
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-brand transition-colors">
                    الصيدليات وصرف الأدوية
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-brand transition-colors">
                    نوادي اللياقة والجيم
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-brand transition-colors">
                    التصنيع وشجرة المواد BOM
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Developers & Documentation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                المطورون والتوثيق
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <Link to="/docs" className="hover:text-brand transition-colors">
                    بوابة التوثيق الرسمية
                  </Link>
                </li>
                <li>
                  <Link to="/docs/introduction" className="hover:text-brand transition-colors">
                    دليل البدء السريع
                  </Link>
                </li>
                <li>
                  <Link to="/docs/dev/manifest-spec" className="hover:text-brand transition-colors">
                    مواصفة manifest.json
                  </Link>
                </li>
                <li>
                  <Link to="/docs/dev/api-intro" className="hover:text-brand transition-colors">
                    مرجع REST API الموثق
                  </Link>
                </li>
                <li>
                  <Link to="/docs/dev/hardware-escpos" className="hover:text-brand transition-colors">
                    ربط طابعات ESC/POS
                  </Link>
                </li>
                <li>
                  <Link to="/docs/deploy/self-hosted" className="hover:text-brand transition-colors">
                    النشر الذاتي Docker
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row">
            <div>
              © {new Date().getFullYear()} ميزان ERP (Mizan Modular Suite). جميع الحقوق محفوظة.
            </div>
            <div className="mt-4 flex items-center gap-4 sm:mt-0">
              <Link to="/about" className="hover:text-slate-600 dark:hover:text-slate-300">
                عن الشركة
              </Link>
              <Link to="/pricing" className="hover:text-slate-600 dark:hover:text-slate-300">
                الأسعار
              </Link>
              <Link to="/contact" className="hover:text-slate-600 dark:hover:text-slate-300">
                الدعم الفني
              </Link>
              <Link to="/docs" className="hover:text-slate-600 dark:hover:text-slate-300">
                الأمان والخصوصية
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
