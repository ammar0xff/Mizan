import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { BLOG_POSTS } from "./blogData";
import { MarketingLayout } from "./MarketingLayout";
import { useTranslation } from "@/i18n";
import { assetUrl } from "@/lib/utils";

export default function BlogPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", labelAr: "كافة المقالات", labelEn: "All Essays" },
    { id: "engineering", labelAr: "هندسة النظم وPostgreSQL", labelEn: "Systems & PostgreSQL" },
    { id: "hardware", labelAr: "العتاد وأجهزة الكاشير", labelEn: "POS Hardware & Thermal" },
    { id: "accounting", labelAr: "التكامل المالي والـ ERP", labelEn: "Ledger & Financial ERP" },
    { id: "retail", labelAr: "سرعة التجزئة والعمليات", labelEn: "Retail Velocity" },
  ];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCat = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredPost = BLOG_POSTS[0];

  return (
    <MarketingLayout>
      <div className="py-16 sm:py-24 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* 1. Editorial Masthead Header */}
          <div className="mx-auto max-w-4xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#651E2C] shadow-xs">
              <BookOpen className="size-3.5 text-[#B86B76]" />
              <span>{isAr ? "دفتر ميزان — المجلة الهندسية والمعرفية" : "The Mizan Journal — Systems & Engineering"}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-[1.15]">
              {isAr ? (
                <>
                  أوراق هندسية، معمارية قواعد البيانات، <br />
                  <span className="italic text-[#B86B76]">والنزاهة المحاسبية المعيارية</span>
                </>
              ) : (
                <>
                  Essays on systems architecture, <br />
                  <span className="italic text-[#B86B76]">distributed databases, & ledger integrity</span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base text-[#77716E] font-body leading-relaxed">
              {isAr
                ? "شروحات تقنية معمقة، استعراض لأسرار PostgreSQL Row-Level Security، بروتوكولات الطباعة الحرارية، وتجارب حية من قلب المنشآت."
                : "Deep technical articles on transactional isolation, offline-first cashier protocols, hardware ESC/POS pulses, and ERP architecture."}
            </p>
          </div>

          {/* 2. Featured Article Hero Card */}
          {featuredPost && selectedCategory === "all" && !searchQuery && (
            <div className="rounded-3xl border border-[#E7D6C1] bg-white p-6 sm:p-10 shadow-xs hover:border-[#651E2C]/50 transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#651E2C]/10 px-3 py-1 text-[11px] font-bold text-[#651E2C]">
                      {isAr ? featuredPost.categoryLabel : "Software Architecture"}
                    </span>
                    <span className="text-xs text-[#77716E] flex items-center gap-1 font-mono">
                      <Clock className="size-3.5 text-[#B86B76]" />
                      {featuredPost.readTime}
                    </span>
                    <span className="text-[#E7D6C1]">•</span>
                    <span className="text-xs text-[#77716E] font-mono">{featuredPost.date}</span>
                  </div>

                  <Link to={`/blog/${featuredPost.slug}`}>
                    <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-[#262321] hover:text-[#651E2C] transition-colors leading-tight">
                      {isAr ? featuredPost.title : featuredPost.titleEn}
                    </h2>
                  </Link>

                  <p className="text-xs sm:text-sm text-[#77716E] font-body leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E7D6C1]">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-[#FAF6F0] border border-[#E7D6C1] text-xs font-bold text-[#651E2C]">
                        {featuredPost.author.name.slice(0, 2)}
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[#262321] block">{featuredPost.author.name}</span>
                        <span className="text-[#77716E] text-[11px] font-mono">{featuredPost.author.role}</span>
                      </div>
                    </div>

                    <Link
                      to={`/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#651E2C] hover:underline"
                    >
                      <span>{isAr ? "قراءة المقال بالكامل" : "Read Full Essay"}</span>
                      {isAr ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden border border-[#E7D6C1] aspect-[16/11] bg-[#35151D]">
                    <img
                      src={assetUrl("assets/marketing/arch-hero-feature.jpg")}
                      alt="PostgreSQL RLS Architecture"
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#35151D]/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 start-4 text-white">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#B86B76]">
                        {isAr ? "المقال المميز" : "Featured Essay"}
                      </span>
                      <h4 className="font-display text-sm font-normal">PostgreSQL Engine RLS</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E7D6C1] pb-6">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#651E2C] text-white shadow-xs"
                      : "bg-white text-[#77716E] border border-[#E7D6C1] hover:border-[#651E2C]/50 hover:text-[#262321]"
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#77716E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "البحث في المقالات والمفاهيم..." : "Search essays & topics..."}
                className="w-full rounded-full border border-[#E7D6C1] bg-white ps-9 pe-4 py-2 text-xs text-[#262321] placeholder:text-[#77716E] focus:border-[#651E2C] focus:outline-hidden"
              />
            </div>
          </div>

          {/* 4. Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <div
                key={post.slug}
                className="flex flex-col justify-between rounded-2xl border border-[#E7D6C1] bg-white p-6 shadow-xs hover:border-[#651E2C]/50 hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#77716E]">
                    <span className="rounded-full bg-[#FAF6F0] px-2.5 py-0.5 font-bold text-[#651E2C] border border-[#E7D6C1]">
                      {isAr ? post.categoryLabel : post.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="size-3 text-[#B86B76]" />
                      {post.readTime}
                    </span>
                  </div>

                  <Link to={`/blog/${post.slug}`}>
                    <h3 className="font-display text-xl font-normal text-[#262321] hover:text-[#651E2C] transition-colors leading-snug">
                      {isAr ? post.title : post.titleEn}
                    </h3>
                  </Link>

                  <p className="text-xs text-[#77716E] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E7D6C1] flex items-center justify-between text-xs">
                  <span className="text-[#77716E] font-mono text-[11px]">{post.date}</span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 font-bold text-[#651E2C] hover:underline"
                  >
                    <span>{isAr ? "قراءة" : "Read"}</span>
                    {isAr ? <ArrowLeft className="size-3" /> : <ArrowRight className="size-3" />}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
