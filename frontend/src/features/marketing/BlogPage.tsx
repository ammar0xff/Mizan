import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Search,
  Clock,
  ArrowRight,
} from "lucide-react";
import { BLOG_POSTS } from "./blogData";
import { Badge } from "@/components/kit/badge";
import { MarketingLayout } from "./MarketingLayout";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "كافة المقالات" },
    { id: "engineering", label: "هندسة النظم وPostgreSQL" },
    { id: "hardware", label: "العتاد وأجهزة الكاشير" },
    { id: "accounting", label: "إدارة الأعمال والـ ERP" },
    { id: "retail", label: "التجزئة وسرعة الكاشير" },
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
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="outline" className="bg-brand/10 text-brand">
              مدونة ميزان الهندسية والتقنية
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              أحدث المقالات الهندسية وحلول الأعمال
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              شروحات تقنية معمقة، استعراض لبنية PostgreSQL RLS، أسرار تكامل طابعات الكاشير الحرارية،
              ودراسات حالة للمنشآت النامية.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-brand text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المقالات..."
                className="w-full rounded-lg border border-slate-200 bg-white ps-9 pe-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Featured Article Card */}
          {selectedCategory === "all" && searchQuery === "" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="p-6 sm:p-8 lg:p-10 lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="success">مقال مميز</Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      {featuredPost.categoryLabel}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featuredPost.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                    <Link to={`/blog/${featuredPost.slug}`} className="hover:text-brand transition-colors">
                      {featuredPost.title}
                    </Link>
                  </h2>
                  <div className="text-xs font-mono text-slate-400 mt-1">{featuredPost.titleEn}</div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {featuredPost.author.name}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {featuredPost.date}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <span>قراءة المقال كاملاً</span>
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-brand-dark to-slate-950 p-6 sm:p-8 lg:col-span-5 flex flex-col justify-center text-white">
                <div className="font-mono text-xs text-slate-400 mb-2">Technical Architecture Preview</div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-emerald-400 leading-relaxed shadow-inner">
                  <div>-- PostgreSQL RLS Session Isolation</div>
                  <div className="text-slate-400">SET LOCAL app.current_tenant_id = :id;</div>
                  <div className="text-brand-light mt-2">SELECT * FROM invoices</div>
                  <div className="text-slate-500">/* Evaluated by Kernel Engine */</div>
                  <div className="text-emerald-300">✓ 0% Data Leakage Risk</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid of All Filtered Articles */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {post.categoryLabel}
                    </Badge>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug hover:text-brand transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">{post.date}</span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="font-bold text-brand hover:underline flex items-center gap-1"
                  >
                    <span>قراءة</span>
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
