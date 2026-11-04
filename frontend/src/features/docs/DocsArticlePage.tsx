import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  Copy,
  Check,
  AlertCircle,
  Lightbulb,
  Info,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { getDocArticle, getAllDocArticles } from "./docsData";
import { Button } from "@/components/kit/button";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";

export default function DocsArticlePage() {
  const params = useParams();
  const slug = params["*"] || params.slug || "";
  const article = getDocArticle(slug);

  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);

  const { locale } = useTranslation();
  const isAr = locale === "ar";

  if (!article) {
    return <Navigate to="/docs" replace />;
  }

  const allArticles = getAllDocArticles();
  const currentIndex = allArticles.findIndex((a) => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    toast.success(isAr ? "تم نسخ الشفرة البرمجية إلى الحافظة!" : "Code copied to clipboard!");
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-12 text-[#262321] font-body">
      {/* Main Reading Column */}
      <div className="xl:col-span-9 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#77716E]">
          <Link to="/docs" className="hover:text-[#651E2C] transition-colors">
            {isAr ? "مركز التوثيق" : "Documentation"}
          </Link>
          <span>/</span>
          <span className="text-[#262321] font-semibold">{article.title}</span>
        </nav>

        {/* Article Title & Meta */}
        <div className="border-b border-[#E7D6C1] pb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#651E2C]/10 px-3 py-1 text-[11px] font-bold text-[#651E2C]">
              {article.category}
            </span>
            <span className="text-xs text-[#77716E] font-mono">/{article.slug}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[#262321] tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="text-xs font-mono text-[#77716E]">{article.titleEn}</div>

          <p className="mt-3 text-sm text-[#77716E] leading-relaxed">
            {article.content.overview}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {article.content.sections.map((sec, idx) => (
            <section key={sec.id} id={sec.id} className="scroll-mt-20 space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-normal text-[#262321] border-b border-[#E7D6C1] pb-2">
                {sec.title}
              </h2>

              <div className="text-xs sm:text-sm text-[#77716E] leading-relaxed whitespace-pre-line">
                {sec.body}
              </div>

              {/* Callout Box if present */}
              {sec.callout && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-2xl p-4 text-xs leading-relaxed border ${
                    sec.callout.type === "tip"
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                      : sec.callout.type === "important"
                      ? "border-amber-200 bg-amber-50/80 text-amber-950"
                      : sec.callout.type === "warning"
                      ? "border-[#651E2C]/30 bg-[#651E2C]/5 text-[#651E2C]"
                      : "border-blue-200 bg-blue-50/80 text-blue-950"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {sec.callout.type === "tip" && <Lightbulb className="size-4 text-emerald-600" />}
                    {sec.callout.type === "important" && (
                      <AlertCircle className="size-4 text-amber-600" />
                    )}
                    {sec.callout.type === "warning" && (
                      <AlertTriangle className="size-4 text-[#651E2C]" />
                    )}
                    {sec.callout.type === "note" && <Info className="size-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block mb-0.5">
                      {sec.callout.type === "tip"
                        ? isAr ? "نصيحة تقنية:" : "Technical Tip:"
                        : sec.callout.type === "important"
                        ? isAr ? "ملاحظة هامة:" : "Important Note:"
                        : sec.callout.type === "warning"
                        ? isAr ? "تحذير أمني:" : "Security Warning:"
                        : isAr ? "تنبيه:" : "Notice:"}
                    </span>
                    {sec.callout.text}
                  </div>
                </div>
              )}

              {/* Code Snippet with Copy Button */}
              {sec.codeBlock && (
                <div className="mt-4 rounded-2xl border border-[#35151D] bg-[#270F16] overflow-hidden shadow-lg text-start">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs font-mono text-[#E7D6C1]">
                    <span>{sec.codeBlock.filename || sec.codeBlock.language.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(sec.codeBlock!.code, idx)}
                      className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors"
                    >
                      {copiedCodeIndex === idx ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span className="text-emerald-400">{isAr ? "تم النسخ" : "Copied"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>{isAr ? "نسخ الشفرة" : "Copy"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#FAF6F0] overflow-x-auto leading-relaxed">
                    <code>{sec.codeBlock.code}</code>
                  </pre>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Was this helpful feedback widget */}
        <div className="mt-12 rounded-2xl border border-[#E7D6C1] bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="text-xs text-[#77716E]">
            {isAr ? "هل كان هذا الشرح مفيداً وواضحاً لمنشأتك؟" : "Was this documentation article helpful and clear?"}
          </div>
          <div className="flex items-center gap-2">
            {feedbackGiven ? (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="size-3.5" />
                {isAr ? "شكراً لمشاركتنا تقييمك القيّم!" : "Thank you for your valuable feedback!"}
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFeedbackGiven("yes");
                    toast.success(isAr ? "شكراً على تقييمك الإيجابي!" : "Thank you for your rating!");
                  }}
                  className="text-xs border-[#E7D6C1] hover:bg-[#FAF6F0]"
                >
                  <ThumbsUp className="size-3.5 me-1 text-emerald-600" />
                  <span>{isAr ? "نعم، مفيد" : "Yes, helpful"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFeedbackGiven("no");
                    toast.info(isAr ? "تم تسجيل ملاحظتك وسنعمل على تحسين المقال." : "Noted. We will improve this guide.");
                  }}
                  className="text-xs border-[#E7D6C1] hover:bg-[#FAF6F0]"
                >
                  <ThumbsDown className="size-3.5 me-1 text-[#651E2C]" />
                  <span>{isAr ? "يحتاج تحسين" : "Needs clarity"}</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Previous and Next Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E7D6C1] pt-6">
          {prevArticle ? (
            <Link
              to={`/docs/${prevArticle.slug}`}
              className="flex flex-col items-start rounded-xl border border-[#E7D6C1] bg-white p-4 hover:border-[#651E2C]/50 w-full sm:w-1/2 transition-colors shadow-xs"
            >
              <span className="text-[10px] text-[#77716E] font-mono">
                {isAr ? "← المقال السابق" : "← Previous Article"}
              </span>
              <span className="text-xs font-bold text-[#262321] mt-0.5">
                {prevArticle.title}
              </span>
            </Link>
          ) : (
            <div className="w-1/2" />
          )}

          {nextArticle && (
            <Link
              to={`/docs/${nextArticle.slug}`}
              className="flex flex-col items-end rounded-xl border border-[#E7D6C1] bg-white p-4 hover:border-[#651E2C]/50 w-full sm:w-1/2 text-end transition-colors shadow-xs"
            >
              <span className="text-[10px] text-[#77716E] font-mono">
                {isAr ? "المقال التالي →" : "Next Article →"}
              </span>
              <span className="text-xs font-bold text-[#262321] mt-0.5">
                {nextArticle.title}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Right Column: "On this page" Table of Contents (Sticky on Desktop) */}
      <div className="hidden xl:block xl:col-span-3">
        <div className="sticky top-24 border-s-2 border-[#E7D6C1] ps-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#651E2C]">
            {isAr ? "في هذه الصفحة" : "On This Page"}
          </div>
          <ul className="space-y-2 text-xs text-[#77716E]">
            {article.content.sections.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="hover:text-[#651E2C] block truncate transition-colors"
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#E7D6C1]">
            <Link
              to="/contact"
              className="text-xs text-[#651E2C] hover:underline font-bold block"
            >
              {isAr ? "هل تحتاج لمساعدة مطور مخصصة؟" : "Need custom developer assistance?"}
            </Link>
            <span className="text-[10px] text-[#77716E] block mt-1">
              {isAr ? "تواصل مباشرة مع مهندسي النظام" : "Direct access to our systems architects"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
