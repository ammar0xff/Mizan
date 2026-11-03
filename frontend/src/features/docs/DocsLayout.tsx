import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  Layers,
  FileText,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import { DOC_SECTIONS, getAllDocArticles } from "./docsData";
import { useUiStore } from "@/stores/ui";
import { useI18nStore } from "@/i18n";
import { Badge } from "@/components/kit/badge";

interface DocsLayoutProps {
  children?: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useUiStore();
  const { locale, toggleLocale, dir } = useI18nStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "getting-started": true,
    "user-guide": true,
    "modules-doc": true,
    "admin-doc": false,
    "dev-doc": true,
    "deployment-doc": false,
    "support-doc": false,
  });

  const allArticles = getAllDocArticles();

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.overview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100"
    >
      {/* 1. Docs Sticky TopBar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label="قائمة التوثيق"
            >
              <Menu className="h-4 w-4" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white shadow-xs">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                ميزان ERP
              </span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700">/</span>

            <Link
              to="/docs"
              className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>بوابة التوثيق والمطورين</span>
            </Link>

            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              v3.0.0
            </Badge>
          </div>

          {/* Search Trigger & Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-brand/40 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 sm:w-64"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand" />
              <span className="flex-1 text-start">بحث في التوثيق...</span>
              <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleLocale}
              title={locale === "ar" ? "English" : "العربية"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {locale === "ar" ? "EN" : "ع"}
            </button>

            <button
              onClick={toggleThemeMode}
              title="تبديل المظهر"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ms-1"
            >
              <Home className="h-3.5 w-3.5" />
              <span>الموقع الرئيسي</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area with Sidebar */}
      <div className="flex-1 flex mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-e border-slate-200/80 pe-6 py-8 dark:border-slate-800/80 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="mb-4">
            <Link
              to="/docs"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                location.pathname === "/docs"
                  ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>نظرة عامة على التوثيق</span>
            </Link>
          </div>

          <div className="space-y-6">
            {DOC_SECTIONS.map((section) => {
              const isExpanded = expandedSections[section.id] !== false;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-slate-200 hover:text-brand"
                  >
                    <span>{locale === "ar" ? section.title : section.titleEn}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                        isExpanded ? "rotate-0" : "-rotate-90 rtl:rotate-90"
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <ul className="mt-2 space-y-1 border-s border-slate-200 ps-2.5 ms-1 dark:border-slate-800">
                      {section.items.map((item) => {
                        const itemPath = `/docs/${item.slug}`;
                        const isActive = location.pathname === itemPath;
                        return (
                          <li key={item.slug}>
                            <Link
                              to={itemPath}
                              className={`block rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                                isActive
                                  ? "bg-brand text-white font-bold shadow-xs"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              {locale === "ar" ? item.title : item.titleEn}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Mobile Collapsible Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 lg:hidden backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute inset-y-0 start-0 w-80 max-w-[85%] bg-white p-6 shadow-2xl dark:bg-slate-900 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-brand" />
                    <span className="font-bold text-sm">أقسام التوثيق</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-6">
                  {DOC_SECTIONS.map((section) => (
                    <div key={section.id}>
                      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase mb-2">
                        {locale === "ar" ? section.title : section.titleEn}
                      </div>
                      <ul className="space-y-1">
                        {section.items.map((item) => {
                          const itemPath = `/docs/${item.slug}`;
                          const isActive = location.pathname === itemPath;
                          return (
                            <li key={item.slug}>
                              <Link
                                to={itemPath}
                                className={`block rounded-md px-3 py-1.5 text-xs ${
                                  isActive
                                    ? "bg-brand text-white font-bold"
                                    : "text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {locale === "ar" ? item.title : item.titleEn}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 py-8 lg:ps-8">{children}</div>
      </div>

      {/* 3. Search Modal Dialog (Cmd+K) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-xs sm:pt-24"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center border-b border-slate-200 px-4 dark:border-slate-800">
                <Search className="h-4 w-4 text-slate-400 ms-1" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في كافة شروحات وموديولات التوثيق..."
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden dark:text-white"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {searchQuery.trim() === "" ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    اكتب كلمة البحث للبحث الفوري في الـ 38 دليلاً وموديولاً...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    لم يتم العثور على نتائج تطابق «{searchQuery}»
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.slug}
                        onClick={() => {
                          navigate(`/docs/${result.slug}`);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full flex-col items-start rounded-lg p-2.5 text-start hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {result.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({result.titleEn})
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                          {result.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
