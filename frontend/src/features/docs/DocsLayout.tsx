import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  FileText,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import { DOC_SECTIONS, getAllDocArticles } from "./docsData";
import { useUiStore } from "@/stores/ui";
import { useI18nStore } from "@/i18n";
import { MizanLogo } from "@/components/MizanLogo";
import { MizanReadingProgress } from "@/components/motion/MizanReadingProgress";

interface DocsLayoutProps {
  children?: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const location = useLocation();
  const { themeMode, toggleThemeMode } = useUiStore();
  const { locale, toggleLocale, dir } = useI18nStore();
  const isAr = locale === "ar";

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
      className="min-h-screen flex flex-col bg-[#FAF6F0] font-body text-[#262321] transition-colors selection:bg-[#651E2C] selection:text-white"
    >
      <MizanReadingProgress color="#651E2C" height={2.5} />
      {/* 1. Docs Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E7D6C1] bg-[#FAF6F0]/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex size-9 items-center justify-center rounded-xl border border-[#E7D6C1] text-[#262321] hover:bg-white lg:hidden"
              aria-label="Toggle Docs Navigation"
            >
              <Menu className="size-4" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <MizanLogo size="sm" showWordmark={true} />
            </Link>

            <span className="text-[#E7D6C1] hidden sm:inline-block">/</span>

            <Link
              to="/docs"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#651E2C] hover:underline"
            >
              <BookOpen className="size-3.5 text-[#B86B76]" />
              <span>{isAr ? "مركز التوثيق والمطورين" : "Docs & Developer Portal"}</span>
            </Link>

            <span className="hidden md:inline-flex rounded-full bg-[#651E2C]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#651E2C] font-mono">
              v3.0.0
            </span>
          </div>

          {/* Search Trigger & Right Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white px-3.5 py-1.5 text-xs text-[#77716E] hover:border-[#651E2C] hover:text-[#262321] sm:w-64 transition-all shadow-xs"
            >
              <Search className="size-3.5 text-[#B86B76] group-hover:text-[#651E2C]" />
              <span className="flex-1 text-start">
                {isAr ? "بحث في شروحات المنظومة..." : "Search docs & APIs..."}
              </span>
              <kbd className="hidden sm:inline-block rounded border border-[#E7D6C1] bg-[#FAF6F0] px-1.5 py-0.5 text-[10px] font-mono text-[#77716E]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={toggleLocale}
              title={isAr ? "Switch to English" : "التبديل إلى العربية"}
              className="flex size-9 items-center justify-center rounded-full border border-[#E7D6C1] bg-white text-xs font-bold text-[#262321] hover:border-[#651E2C]"
            >
              {isAr ? "EN" : "ع"}
            </button>

            <button
              type="button"
              onClick={toggleThemeMode}
              title="Toggle theme"
              className="flex size-9 items-center justify-center rounded-full border border-[#E7D6C1] bg-white text-[#262321] hover:border-[#651E2C]"
            >
              {themeMode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#651E2C] bg-[#651E2C]/10 hover:bg-[#651E2C] hover:text-white rounded-full px-3 py-1.5 transition-all ms-1"
            >
              <Home className="size-3.5" />
              <span>{isAr ? "الموقع الرئيسي" : "Home"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area with Sidebar */}
      <div className="flex-1 flex mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-e border-[#E7D6C1] pe-6 py-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="mb-4">
            <Link
              to="/docs"
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                location.pathname === "/docs"
                  ? "bg-[#651E2C] text-white shadow-xs"
                  : "text-[#262321] hover:bg-white"
              }`}
            >
              <FileText className="size-4" />
              <span>{isAr ? "فهرس التوثيق العام" : "Documentation Overview"}</span>
            </Link>
          </div>

          <nav className="space-y-6">
            {DOC_SECTIONS.map((section) => {
              const isExpanded = expandedSections[section.id] ?? false;
              return (
                <div key={section.id} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between text-start text-xs font-bold uppercase tracking-wider text-[#77716E] hover:text-[#262321] py-1"
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <ul className="space-y-0.5 ps-1 border-s-2 border-[#E7D6C1]">
                      {section.items.map((item) => {
                        const active = location.pathname === `/docs/${item.slug}`;
                        return (
                          <li key={item.slug}>
                            <Link
                              to={`/docs/${item.slug}`}
                              className={`block rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                                active
                                  ? "bg-[#651E2C]/10 text-[#651E2C] font-bold"
                                  : "text-[#77716E] hover:bg-white hover:text-[#262321]"
                              }`}
                            >
                              {item.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#35151D]/60 backdrop-blur-xs lg:hidden"
            >
              <motion.div
                initial={{ x: isAr ? 300 : -300 }}
                animate={{ x: 0 }}
                exit={{ x: isAr ? 300 : -300 }}
                className="fixed inset-y-0 start-0 w-80 bg-[#FAF6F0] p-6 shadow-2xl overflow-y-auto border-e border-[#E7D6C1]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#E7D6C1] mb-4">
                  <MizanLogo size="sm" showWordmark={true} />
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="size-8 flex items-center justify-center rounded-lg border border-[#E7D6C1] text-[#262321]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <nav className="space-y-6">
                  {DOC_SECTIONS.map((section) => (
                    <div key={section.id} className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#77716E]">
                        {section.title}
                      </h4>
                      <ul className="space-y-1 ps-2 border-s border-[#E7D6C1]">
                        {section.items.map((item) => (
                          <li key={item.slug}>
                            <Link
                              to={`/docs/${item.slug}`}
                              className="block rounded-lg px-2 py-1.5 text-xs text-[#262321] hover:bg-white"
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Pane */}
        <main className="flex-1 py-8 lg:ps-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-[#35151D]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl border border-[#E7D6C1] bg-white p-4 shadow-2xl space-y-4"
            >
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#B86B76]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? "اكتب للبحث في شروحات وموديولات ميزان..." : "Type to search articles and modules..."}
                  className="w-full rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] ps-9 pe-4 py-2.5 text-xs text-[#262321] placeholder:text-[#77716E] focus:border-[#651E2C] focus:outline-hidden"
                />
              </div>

              {searchQuery.trim() && (
                <div className="max-h-80 overflow-y-auto divide-y divide-[#E7D6C1] text-xs">
                  {searchResults.length === 0 ? (
                    <p className="py-6 text-center text-[#77716E]">
                      {isAr ? "لم يتم العثور على نتائج تطابق بحثك" : "No matching documentation articles found"}
                    </p>
                  ) : (
                    searchResults.map((res) => (
                      <Link
                        key={res.slug}
                        to={`/docs/${res.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="block p-3 hover:bg-[#FAF6F0] rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#262321]">{res.title}</span>
                          <span className="text-[10px] text-[#651E2C] font-mono">{res.category}</span>
                        </div>
                        <p className="text-[11px] text-[#77716E] line-clamp-1 mt-0.5">
                          {res.description}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
