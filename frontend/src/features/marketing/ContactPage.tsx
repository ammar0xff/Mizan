import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Send,
  CheckCircle2,
  Headphones,
} from "lucide-react";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Input } from "@/components/kit/input";
import { MarketingLayout } from "./MarketingLayout";
import { toast } from "sonner";
import { sound } from "@/lib/sound";

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState<"demo" | "sales" | "support">("demo");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("retail");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("يرجى ملء الحقول الإلزامية (الاسم، البريد، ورقم الهاتف)");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      try {
        sound.success();
      } catch {}
      toast.success("تم استلام طلبكم بنجاح! سيتواصل معكم مستشار ميزان قريباً.");
    }, 900);
  };

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="bg-brand/10 text-brand">
              فريق المبيعات والدعم المؤسسي
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              تواصل مع خبراء ميزان ERP
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              سواء كنت ترغب في حجز عرض توضيحي مباشر (Live Demo)، مناقشة باقات المؤسسات، أو الحصول على
              دعم فني متخصص، فريقنا جاهز لمساعدتك.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Left Column: Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 text-center space-y-4"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        تم استلام طلبك بنجاح!
                      </h3>
                      <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        شكراً لتواصلك مع ميزان ERP. سيقوم أحد مستشارينا بالتواصل معك عبر الهاتف أو
                        البريد الإلكتروني خلال أقل من ساعتين عمل لترتيب موعد العرض.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsSuccess(false);
                          setMessage("");
                        }}
                      >
                        إرسال رسالة أخرى
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      {/* Inquiry Type Tabs */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          نوع الاستفسار المطلوب:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setInquiryType("demo")}
                            className={`rounded-lg p-2.5 text-xs font-bold transition-colors ${
                              inquiryType === "demo"
                                ? "bg-brand text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            عرض توضيحي مباشر
                          </button>
                          <button
                            type="button"
                            onClick={() => setInquiryType("sales")}
                            className={`rounded-lg p-2.5 text-xs font-bold transition-colors ${
                              inquiryType === "sales"
                                ? "bg-brand text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            مبيعات المؤسسات
                          </button>
                          <button
                            type="button"
                            onClick={() => setInquiryType("support")}
                            className={`rounded-lg p-2.5 text-xs font-bold transition-colors ${
                              inquiryType === "support"
                                ? "bg-brand text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            دعم فني واستفسار
                          </button>
                        </div>
                      </div>

                      {/* Name & Phone */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            الاسم بالكامل <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="مثال: أحمد عبد الله"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            رقم الهاتف / واتساب <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+20 100 000 0000"
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Email & Company */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            البريد الإلكتروني للعمل <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            اسم المنشأة أو الشركة
                          </label>
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="مثال: أسواق النور للتجارة"
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {/* Industry Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          نشاط المنشأة الرئيسي:
                        </label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="retail">تجارة تجزئة وسوبرماركت</option>
                          <option value="restaurant">مطاعم، كافيهات، وضيافة</option>
                          <option value="clinic">عيادات ومراكز طبية</option>
                          <option value="pharmacy">صيدليات ومستودعات أدوية</option>
                          <option value="gym">صالات جيم وأندية رياضية</option>
                          <option value="mfg">تصنيع وخطوط إنتاج</option>
                          <option value="wholesale">تجارة جملة وتوزيع</option>
                          <option value="services">شركات ومكاتب مهنية</option>
                          <option value="other">نشاط آخر</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            ملاحظات أو متطلبات خاصة:
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {message.length} / 500 حرف
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={500}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="اذكر عدد الفروع التقريبي، عدد الكاشيرات، أو أي أجهزة ترغب في ربطها..."
                          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand text-xs font-bold text-white hover:bg-brand/90 py-2.5"
                      >
                        {isSubmitting ? (
                          <span>جارٍ إرسال الطلب...</span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Send className="h-4 w-4 rtl:rotate-180" />
                            تأكيد وإرسال طلب التواصل
                          </span>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Office info & Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              {/* Channel 1: Cairo */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-brand" />
                  <span>المقر الإقليمي الرئيسي (مصر)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  مجمع البنوك، التجمع الخامس، القاهرة الجديدة، جمهورية مصر العربية.
                </p>
                <div className="pt-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                  هاتف: +20 100 000 0000 • متاح من 9 ص حتى 6 م
                </div>
              </div>

              {/* Channel 2: Riyadh */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-brand" />
                  <span>مكتب المبيعات (المملكة العربية السعودية)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  طريق الملك فهد، حي الصحافة، الرياض، المملكة العربية السعودية.
                </p>
                <div className="pt-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                  هاتف: +966 50 000 0000 • مبيعات المؤسسات
                </div>
              </div>

              {/* Channel 3: Email & SLA */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Headphones className="h-4 w-4 text-emerald-500" />
                  <span>قنوات البريد الإلكتروني المباشرة</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">استشارات المبيعات:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      sales@mizan.app
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الدعم الفني والتشغيلي:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      support@mizan.app
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 text-[11px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ✓ ضمان زمن استجابة (SLA) خلال ساعتي عمل للحالات العادية، وفوري للحالات الطارئة.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
