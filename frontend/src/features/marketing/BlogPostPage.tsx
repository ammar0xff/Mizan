import { useParams, Link, Navigate } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { BLOG_POSTS } from "./blogData";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import { assetUrl } from "@/lib/utils";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const [copiedCode, setCopiedCode] = useState(false);
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(isAr ? "تم نسخ رابط المقال إلى الحافظة!" : "Article link copied to clipboard!");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(isAr ? "تم نسخ الشفرة البرمجية!" : "Code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <MarketingLayout>
      <article className="py-16 sm:py-24 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* 1. Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#77716E]">
            <Link to="/blog" className="hover:text-[#651E2C] transition-colors">
              {isAr ? "دفتر ميزان" : "Mizan Journal"}
            </Link>
            <span>/</span>
            <span className="text-[#262321] font-semibold">{post.categoryLabel}</span>
          </nav>

          {/* 2. Article Header */}
          <div className="space-y-6 border-b border-[#E7D6C1] pb-8">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#651E2C]/10 px-3 py-1 text-[11px] font-bold text-[#651E2C]">
                {post.categoryLabel}
              </span>
              <span className="text-xs text-[#77716E] flex items-center gap-1 font-mono">
                <Clock className="size-3.5 text-[#B86B76]" /> {post.readTime}
              </span>
              <span className="text-[#E7D6C1]">•</span>
              <span className="text-xs text-[#77716E] font-mono">{post.date}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#262321] tracking-tight leading-[1.2]">
              {isAr ? post.title : post.titleEn}
            </h1>

            <div className="flex items-center justify-between pt-4 border-t border-[#E7D6C1]">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-white border border-[#E7D6C1] font-display font-bold text-[#651E2C] text-sm">
                  {post.author.name.slice(0, 2)}
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-[#262321]">{post.author.name}</span>
                  <span className="text-[#77716E] text-[11px] font-mono">{post.author.role}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="border-[#E7D6C1] bg-white text-xs text-[#262321] hover:bg-[#FAF6F0]"
              >
                <Share2 className="size-3.5 me-1.5 text-[#651E2C]" />
                {isAr ? "مشاركة المقال" : "Share Essay"}
              </Button>
            </div>
          </div>

          {/* 3. Header Architectural Banner Image matching Screen 10 */}
          <div className="relative rounded-3xl overflow-hidden border border-[#E7D6C1] aspect-[21/9] bg-[#35151D] shadow-md">
            <img
              src={assetUrl("assets/marketing/blog-post-arch.jpg")}
              alt={post.title}
              className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* 4. Lead Editorial Paragraph & Laptop Showcase Split matching Screen 10 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2">
            <div className="md:col-span-5 rounded-2xl overflow-hidden border border-[#E7D6C1] shadow-md bg-white p-2">
              <img
                src={assetUrl("assets/marketing/blog-post-laptop.jpg")}
                alt="Mizan Dashboard on Laptop"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
            <div className="md:col-span-7 space-y-4">
              <p className="font-display text-xl sm:text-2xl font-normal leading-relaxed text-[#262321] border-s-2 border-[#651E2C] ps-5 py-1">
                {post.content.intro}
              </p>
            </div>
          </div>

          {/* 5. Article Body Sections */}
          <div className="space-y-10 pt-4 font-body text-sm sm:text-base text-[#262321] leading-relaxed">
            {post.content.bodySections.map((sec, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="font-display text-2xl font-normal text-[#262321] border-b border-[#E7D6C1] pb-2">
                  {sec.title}
                </h2>
                <p className="text-[#77716E] whitespace-pre-line leading-relaxed">
                  {sec.text}
                </p>

                {sec.codeBlock && (
                  <div className="mt-4 rounded-2xl border border-[#35151D] bg-[#270F16] overflow-hidden shadow-lg text-start">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs font-mono text-[#E7D6C1]">
                      <span>{sec.codeBlock.lang.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(sec.codeBlock!.code)}
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-white/70 hover:text-white transition-colors"
                      >
                        {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        <span>{copiedCode ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ الشفرة" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-[#FAF6F0] overflow-x-auto leading-relaxed">
                      <code>{sec.codeBlock.code}</code>
                    </pre>
                  </div>
                )}
              </section>
            ))}

            {/* Conclusion */}
            <div className="rounded-2xl border border-[#E7D6C1] bg-white p-6 sm:p-8 space-y-2 text-[#77716E]">
              <h3 className="font-display text-lg font-normal text-[#262321]">
                {isAr ? "الخلاصة المعمارية" : "Architectural Takeaway"}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed">
                {post.content.conclusion}
              </p>
            </div>
          </div>

          {/* 6. Author Bio Card */}
          <div className="rounded-3xl border border-[#E7D6C1] bg-white p-8 flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#FAF6F0] border border-[#E7D6C1] font-display font-bold text-[#651E2C] text-lg">
              {post.author.name.slice(0, 2)}
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-lg font-normal text-[#262321]">{post.author.name}</h4>
              <p className="text-xs text-[#B86B76] font-mono">{post.author.role}</p>
              <p className="text-xs text-[#77716E] pt-1 leading-relaxed">
                {isAr
                  ? "فريق هندسي متخصص في بناء المحركات السحابية المعزولة، معمارية PostgreSQL RLS، وبروتوكولات نقاط البيع غير التزامنية."
                  : "Core engineering group dedicated to high-availability multi-tenant cloud architectures and sub-10ms cashier transaction processing."}
              </p>
            </div>
          </div>

          {/* 7. Related Essays */}
          {relatedPosts.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-[#E7D6C1]">
              <h3 className="font-display text-2xl font-normal text-[#262321]">
                {isAr ? "مقالات ذات صلة" : "Related Technical Essays"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedPosts.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/blog/${r.slug}`}
                    className="group rounded-2xl border border-[#E7D6C1] bg-white p-6 hover:border-[#651E2C]/50 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#651E2C] font-mono">{r.categoryLabel}</span>
                      <h4 className="font-display text-base font-normal text-[#262321] group-hover:text-[#651E2C] transition-colors leading-snug">
                        {isAr ? r.title : r.titleEn}
                      </h4>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-[#77716E] font-mono pt-3 border-t border-[#E7D6C1]/50">
                      <span>{r.date}</span>
                      <span className="group-hover:text-[#651E2C] flex items-center gap-1 font-bold">
                        {isAr ? "قراءة" : "Read"} {isAr ? <ArrowLeft className="size-3" /> : <ArrowRight className="size-3" />}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </MarketingLayout>
  );
}
