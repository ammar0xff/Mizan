import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  CheckCircle2,
  Headphones,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { Input } from "@/components/kit/input";
import { MarketingLayout } from "./MarketingLayout";
import { toast } from "sonner";
import { sound } from "@/lib/sound";
import { useTranslation } from "@/i18n";
import { assetUrl } from "@/lib/utils";

export default function ContactPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [inquiryType, setInquiryType] = useState<"demo" | "enterprise" | "migration" | "support">("demo");
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
      toast.error(
        isAr
          ? "يرجى ملء الحقول الإلزامية (الاسم، البريد الإلكتروني، ورقم الهاتف)"
          : "Please fill in required fields (Name, Email, and Phone)"
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      try {
        sound.success();
      } catch {}
      toast.success(
        isAr
          ? "تم استلام طلبكم بنجاح! سيتواصل معكم مهندس حلول ميزان قريباً."
          : "Request received successfully! A Mizan solutions engineer will reach out shortly."
      );
    }, 800);
  };

  return (
    <MarketingLayout>
      <div className="py-16 sm:py-24 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* 1. Header */}
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#651E2C] shadow-xs">
              <Headphones className="size-3.5 text-[#B86B76]" />
              <span>{isAr ? "فريق الاستشارات الهندسية والمبيعات" : "Engineering Consultation & Advisory"}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-[1.15]">
              {isAr ? (
                <>
                  لنناقش التوازن التشغيلي <br />
                  <span className="italic text-[#B86B76]">والمعماري لمنشأتك</span>
                </>
              ) : (
                <>
                  Let's discuss the architectural <br />
                  <span className="italic text-[#B86B76]">balance of your enterprise</span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base text-[#77716E] font-body leading-relaxed">
              {isAr
                ? "سواء كنت ترغب في جدولة عرض توضيحي حي (Live Demo)، بحث متطلبات الربط السحابي، أو استكشاف خطط المؤسسات، مهندسونا مستعدون لمساعدتك."
                : "Whether scheduling a live architectural walkthrough, planning legacy data migration, or configuring custom enterprise infrastructure, we are here."}
            </p>
          </div>

          {/* 2. Split Contact Section */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
            {/* Left Column: Architectural Info Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-[#E7D6C1] bg-white p-8 shadow-xs space-y-6">
                <div className="relative rounded-2xl overflow-hidden border border-[#E7D6C1] aspect-[16/10] bg-[#35151D]">
                  <img
                    src={assetUrl("assets/marketing/contact-building.jpg")}
                    alt="Mizan Headquarters"
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#35151D]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 start-4 text-white">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B86B76]">
                      {isAr ? "المقر الرئيسي" : "Headquarters"}
                    </span>
                    <h3 className="font-display text-lg font-normal">
                      {isAr ? "القرية الذكية، القاهرة" : "Smart Village, Cairo"}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 pt-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1]">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <span className="text-[#77716E] block font-medium">
                        {isAr ? "الاستفسارات التجارية والهندسية:" : "Commercial & Architecture Inquiries:"}
                      </span>
                      <a href="mailto:solutions@mizan.app" className="font-mono font-bold text-[#651E2C] hover:underline">
                        solutions@mizan.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1]">
                      <Phone className="size-4" />
                    </div>
                    <div>
                      <span className="text-[#77716E] block font-medium">
                        {isAr ? "الخط الساخن المباشر:" : "Direct Advisory Hotline:"}
                      </span>
                      <span className="font-mono font-bold text-[#262321]">+20 (2) 3536-8000</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1]">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="text-[#77716E] block font-medium">
                        {isAr ? "ضمان سرعة الاستجابة:" : "Response SLA Guarantee:"}
                      </span>
                      <span className="text-[#262321] font-semibold">
                        {isAr ? "أقل من ساعتين خلال أيام العمل الرسمية" : "Under 2 hours during official business days"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF6F0] text-[#651E2C] border border-[#E7D6C1]">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <span className="text-[#77716E] block font-medium">
                        {isAr ? "سرية البيانات والمواثيق:" : "Data Privacy & Governance:"}
                      </span>
                      <span className="text-[#262321]">
                        {isAr ? "اتفاقية عدم إفصاح رسمية (NDA) معتمدة لكل استشارة" : "Formal enterprise NDA signed before technical audit"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact & Booking Form */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-[#E7D6C1] bg-white p-8 sm:p-10 shadow-xs">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 text-center space-y-4"
                    >
                      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FAF6F0] text-[#651E2C] border-2 border-[#E7D6C1]">
                        <CheckCircle2 className="size-8" />
                      </div>
                      <h3 className="font-display text-2xl font-normal text-[#262321]">
                        {isAr ? "تم استلام استشارتكم بنجاح" : "Your Consultation Has Been Booked"}
                      </h3>
                      <p className="mx-auto max-w-md text-xs sm:text-sm text-[#77716E] leading-relaxed">
                        {isAr
                          ? "شكراً لتواصلك مع ميزان. سيقوم مهندس الحلول المعماري بالتواصل معكم عبر الهاتف أو البريد الإلكتروني لتنسيق جلسة العرض التوضيحي."
                          : "Thank you for reaching out to Mizan. A solutions architect will contact you directly to arrange the live system walkthrough."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsSuccess(false);
                          setMessage("");
                        }}
                        className="border-[#E7D6C1] text-xs mt-2"
                      >
                        {isAr ? "إرسال طلب استشارة آخر" : "Submit Another Inquiry"}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleSubmit}
                      className="space-y-6"
                    >
                      {/* Inquiry Type Tabs */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#262321]">
                          {isAr ? "نوع الطلب أو الاستشارة:" : "Nature of Inquiry:"}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { id: "demo", labelAr: "عرض حي (Live Demo)", labelEn: "Live Demo" },
                            { id: "enterprise", labelAr: "باقة المؤسسات", labelEn: "Enterprise" },
                            { id: "migration", labelAr: "نقل البيانات", labelEn: "Data Migration" },
                            { id: "support", labelAr: "دعم فني واستشارة", labelEn: "Technical Support" },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setInquiryType(t.id as any)}
                              className={`rounded-xl border py-2.5 px-3 text-center transition-all ${
                                inquiryType === t.id
                                  ? "border-[#651E2C] bg-[#651E2C]/5 text-[#651E2C] font-bold"
                                  : "border-[#E7D6C1] bg-[#FAF6F0] text-[#77716E] hover:border-[#651E2C]/40"
                              }`}
                            >
                              {isAr ? t.labelAr : t.labelEn}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fields Row 1 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#262321]">
                            {isAr ? "الاسم الكامل *" : "Full Name *"}
                          </label>
                          <Input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={isAr ? "مثال: م. أحمد منصور" : "e.g. Johnathan Miller"}
                            className="border-[#E7D6C1] bg-[#FAF6F0] text-xs py-2"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#262321]">
                            {isAr ? "البريد الإلكتروني للعمل *" : "Work Email *"}
                          </label>
                          <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="border-[#E7D6C1] bg-[#FAF6F0] text-xs py-2 font-mono"
                          />
                        </div>
                      </div>

                      {/* Fields Row 2 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#262321]">
                            {isAr ? "رقم الهاتف / واتساب *" : "Phone / WhatsApp *"}
                          </label>
                          <Input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+20 100 123 4567"
                            className="border-[#E7D6C1] bg-[#FAF6F0] text-xs py-2 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#262321]">
                            {isAr ? "اسم المنشأة أو الشركة" : "Company / Enterprise Name"}
                          </label>
                          <Input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={isAr ? "مثال: مجموعة المنار للتجارة" : "e.g. Apex Global Trade"}
                            className="border-[#E7D6C1] bg-[#FAF6F0] text-xs py-2"
                          />
                        </div>
                      </div>

                      {/* Industry Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#262321]">
                          {isAr ? "القطاع التجاري الأساسي:" : "Primary Business Vertical:"}
                        </label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] px-3.5 py-2.5 text-xs text-[#262321] focus:border-[#651E2C] focus:outline-hidden"
                        >
                          <option value="retail">{isAr ? "التجزئة والمتاجر والمعارض (Retail & Trade)" : "Retail & Commercial Showrooms"}</option>
                          <option value="materials">{isAr ? "مواد البناء والتشطيبات والعدد (Building Materials)" : "Building Materials & Hardware"}</option>
                          <option value="hospitality">{isAr ? "المطاعم والكافيهات وسلاسل الضيافة (Hospitality & KDS)" : "Restaurants, Cafes & Food Chains"}</option>
                          <option value="manufacturing">{isAr ? "التصنيع وتجهيز المواد الخام (Manufacturing & Assembly)" : "Discrete Manufacturing & Assembly"}</option>
                          <option value="healthcare">{isAr ? "المجمعات الطبية والعيادات والصيدليات (Healthcare & Clinics)" : "Healthcare & Medical Polyclinics"}</option>
                          <option value="distribution">{isAr ? "التوزيع وسلاسل الإمداد والأسطول (Logistics & Fleet)" : "Distribution, Warehousing & Fleet"}</option>
                        </select>
                      </div>

                      {/* Message Textarea */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#262321]">
                          {isAr ? "تفاصيل إضافية أو متطلبات خاصة (اختياري):" : "Specific Requirements / Notes (Optional):"}
                        </label>
                        <textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={
                            isAr
                              ? "عدد الفروع الحالية، أجهزة الكاشير المستخدمة، أو طبيعة قواعد البيانات الحالية..."
                              : "Current branches, hardware setups, or current accounting system in place..."
                          }
                          className="w-full rounded-xl border border-[#E7D6C1] bg-[#FAF6F0] p-3 text-xs text-[#262321] placeholder:text-[#77716E] focus:border-[#651E2C] focus:outline-hidden"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#651E2C] text-white hover:bg-[#521723] rounded-xl py-3 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="size-3.5" />
                        <span>
                          {isSubmitting
                            ? isAr
                              ? "جاري إرسال الطلب..."
                              : "Transmitting..."
                            : isAr
                            ? "تأكيد طلب العرض التوضيحي المباشر"
                            : "Confirm Architecture Walkthrough Request"}
                        </span>
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
