import { useParams, Link, Navigate } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { BLOG_POSTS } from "./blogData";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { toast } from "sonner";
import { useState } from "react";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("تم نسخ رابط المقال إلى الحافظة!");
  };

  return (
    <MarketingLayout>
      <article className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/blog" className="hover:text-brand">
              المدونة
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{post.categoryLabel}</span>
          </nav>

          {/* Article Header */}
          <div className="space-y-4 border-b border-slate-200 pb-8 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand/10 text-brand">
                {post.categoryLabel}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {post.readTime}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400 font-mono">{post.date}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {post.title}
            </h1>
            <div className="text-sm font-mono text-slate-400">{post.titleEn}</div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {post.author.name}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">{post.author.role}</span>
                </div>
              </div>

              <Button size="sm" variant="outline" onClick={handleCopyLink} className="text-xs">
                <Share2 className="h-3.5 w-3.5 ms-1.5" />
                مشاركة المقال
              </Button>
            </div>
          </div>

          {/* Lead Paragraph */}
          <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {post.content.intro}
          </p>

          {/* Body Sections */}
          <div className="space-y-8 pt-4">
            {post.content.bodySections.map((sec, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
                  {sec.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {sec.text}
                </p>

                {sec.codeBlock && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs font-mono text-slate-400">
                      <span>{sec.codeBlock.lang}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sec.codeBlock!.code);
                          setCopiedCode(true);
                          toast.success("تم نسخ الكود!");
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                      >
                        {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCode ? "تم النسخ" : "نسخ الكود"}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                      <code>{sec.codeBlock.code}</code>
                    </pre>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Conclusion */}
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 dark:bg-brand/10 dark:border-brand/30">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              خلاصة هندسية
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {post.content.conclusion}
            </p>
          </div>

          {/* Related Articles */}
          <div className="border-t border-slate-200 pt-10 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مقالات ذات صلة قد تهمك
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="rounded-xl border border-slate-200 p-4 hover:border-brand/40 dark:border-slate-800 transition-colors block"
                >
                  <div className="text-[10px] font-mono text-slate-400 mb-1">
                    {related.categoryLabel}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                    {related.title}
                  </h4>
                  <div className="mt-2 text-[11px] text-brand font-bold flex items-center gap-1">
                    <span>قراءة</span>
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
