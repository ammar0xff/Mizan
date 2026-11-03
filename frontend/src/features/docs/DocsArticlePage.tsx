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
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { toast } from "sonner";

export default function DocsArticlePage() {
  const params = useParams();
  // Match full wildcard or multi-segment path
  const slug = params["*"] || params.slug || "";
  const article = getDocArticle(slug);

  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);

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
    toast.success("تم نسخ الكود البرمجي إلى الحافظة!");
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
      {/* Main Reading Column */}
      <div className="xl:col-span-9 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/docs" className="hover:text-brand">
            التوثيق
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">{article.title}</span>
        </nav>

        {/* Article Title & Meta */}
        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-brand/10 text-brand dark:bg-brand/20">
              {article.category}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">/{article.slug}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {article.title}
          </h1>
          <div className="text-sm font-mono text-slate-400 mt-1">{article.titleEn}</div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {article.content.overview}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {article.content.sections.map((sec, idx) => (
            <section key={sec.id} id={sec.id} className="scroll-mt-20">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 mb-3 dark:border-slate-800">
                {sec.title}
              </h2>

              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {sec.body}
              </div>

              {/* Callout Box if present */}
              {sec.callout && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-xl p-4 text-xs leading-relaxed ${
                    sec.callout.type === "tip"
                      ? "border border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : sec.callout.type === "important"
                      ? "border border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                      : sec.callout.type === "warning"
                      ? "border border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                      : "border border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {sec.callout.type === "tip" && <Lightbulb className="h-4 w-4 text-emerald-600" />}
                    {sec.callout.type === "important" && (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    {sec.callout.type === "warning" && (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                    {sec.callout.type === "note" && <Info className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block mb-0.5">
                      {sec.callout.type === "tip"
                        ? "نصيحة تقنية:"
                        : sec.callout.type === "important"
                        ? "ملاحظة هامة:"
                        : sec.callout.type === "warning"
                        ? "تحذير أمني:"
                        : "تنبيه:"}
                    </span>
                    {sec.callout.text}
                  </div>
                </div>
              )}

              {/* Code Snippet with Copy Button */}
              {sec.codeBlock && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs font-mono text-slate-400">
                    <span>{sec.codeBlock.filename || sec.codeBlock.language}</span>
                    <button
                      onClick={() => handleCopyCode(sec.codeBlock!.code, idx)}
                      className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                    >
                      {copiedCodeIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>نسخ الكود</span>
                        </>
                      )}
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

        {/* Was this helpful feedback widget */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            هل كان هذا الشرح مفيداً وواضحاً؟
          </div>
          <div className="flex items-center gap-2">
            {feedbackGiven ? (
              <span className="text-xs text-emerald-600 font-bold">
                ✓ شكراً لمشاركتنا رأيك القيّم!
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFeedbackGiven("yes");
                    toast.success("شكراً على تقييمك الإيجابي!");
                  }}
                  className="text-xs"
                >
                  <ThumbsUp className="h-3.5 w-3.5 ms-1 text-emerald-500" /> نعم، مفيد
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFeedbackGiven("no");
                    toast.info("تم تسجيل ملاحظتك وسنعمل على تحسين المقال.");
                  }}
                  className="text-xs"
                >
                  <ThumbsDown className="h-3.5 w-3.5 ms-1 text-rose-500" /> يحتاج تحسين
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Previous and Next Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          {prevArticle ? (
            <Link
              to={`/docs/${prevArticle.slug}`}
              className="flex flex-col items-start rounded-lg border border-slate-200 p-3 hover:border-brand/40 dark:border-slate-800 w-full sm:w-1/2 transition-colors"
            >
              <span className="text-[10px] text-slate-400">← المقال السابق</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {prevArticle.title}
              </span>
            </Link>
          ) : (
            <div className="w-1/2" />
          )}

          {nextArticle && (
            <Link
              to={`/docs/${nextArticle.slug}`}
              className="flex flex-col items-end rounded-lg border border-slate-200 p-3 hover:border-brand/40 dark:border-slate-800 w-full sm:w-1/2 text-end transition-colors"
            >
              <span className="text-[10px] text-slate-400">المقال التالي →</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {nextArticle.title}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Right Column: "On this page" Table of Contents (Sticky on Desktop) */}
      <div className="hidden xl:block xl:col-span-3">
        <div className="sticky top-20 border-s border-slate-200 ps-4 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            في هذه الصفحة
          </div>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            {article.content.sections.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="hover:text-brand block truncate transition-colors"
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/contact"
              className="text-[11px] text-brand hover:underline font-bold block"
            >
              هل تحتاج لمساعدة مطور مخصصة؟
            </Link>
            <span className="text-[10px] text-slate-400 block mt-1">
              تواصل مباشرة مع مهندسي النظام
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
