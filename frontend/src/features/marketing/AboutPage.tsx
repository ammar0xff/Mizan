import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  Lock,
  Boxes,
  Building2,
  Compass,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { useTranslation } from "@/i18n";

export default function AboutPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const principles = [
    {
      icon: Boxes,
      titleAr: "المعيارية المطلقة (Radical Modularity)",
      titleEn: "Radical Modularity",
      descAr: "نرفض الهياكل الجامدة. كل نشاط تجاري في ميزان هو موديول مستقل يتم تفعيله أو تعطيله بنقرة زر دون المساس باستقرار المنظومة.",
      descEn: "We reject monoliths. Every sector capability in Mizan is an autonomous module activated with zero codebase disruption.",
    },
    {
      icon: Lock,
      titleAr: "العزل الرياضي للبيانات (Strict RLS)",
      titleEn: "Mathematical Data Isolation (RLS)",
      descAr: "بيانات كل منشأة معزولة حسابياً على مستوى نواة PostgreSQL باستخدام Row-Level Security، مما يضمن أماناً بنكياً واستقلالية تامة.",
      descEn: "Every tenant's business records are isolated at the database engine level via PostgreSQL Row-Level Security.",
    },
    {
      icon: Zap,
      titleAr: "سرعة استجابة فائقة (Sub-10ms Velocity)",
      titleEn: "Sub-10ms Velocity & Offline Engine",
      descAr: "محرك نقطة بيع صُمم ليعمل بنمط Offline-First مع دعم كامل لاختصارات الكيبورد وقوارئ الباركود لتفريغ طوابير الكاشير بسرعة فائقة.",
      descEn: "Engineered offline-first with zero cashier downtime, lightning thermal printing, and barcode scanner shortcuts.",
    },
    {
      icon: ShieldCheck,
      titleAr: "التكامل المالي الموحد (Financial Integrity)",
      titleEn: "Unified Financial Ledger Integrity",
      descAr: "أي حركة بيع، شراء، جرد، أو حسم مواد خام يتم ترحيلها فورياً إلى شجرة الحسابات العامة ودفتر الأستاذ المزدوج دون وساطة.",
      descEn: "Every transaction, inventory variance, and receipt flows instantaneously into the double-entry general ledger.",
    },
  ];

  const team = [
    {
      nameAr: "د. طارق المنشاوي",
      nameEn: "Dr. Tarek El-Menshawy",
      roleAr: "المؤسس والمدير التنفيذي",
      roleEn: "Founder & Chief Executive Officer",
      bioAr: "خبرة 18 عاماً في قيادة التحول الرقمي وحوكمة النظم المحاسبية وسلاسل الإمداد عبر كبرى المجموعات التجارية في مصر والخليج.",
      bioEn: "18+ years leading enterprise digital transformation, financial governance, and ERP implementations across MENA.",
      initials: "TM",
    },
    {
      nameAr: "م. كريم الباز",
      nameEn: "Eng. Karim El-Baz",
      roleAr: "رئيس قطاع الهندسة المعمارية",
      roleEn: "VP of Software Architecture",
      bioAr: "متخصص في أنظمة قواعد البيانات الموزعة، معمارية PostgreSQL RLS، وتصميم محركات نقاط البيع عالية التزامن والأداء.",
      bioEn: "Specialized in high-concurrency transactional architectures, distributed PostgreSQL engines, and sub-10ms POS systems.",
      initials: "KB",
    },
    {
      nameAr: "سارة عبد الرحمن",
      nameEn: "Sarah Abdelrahman",
      roleAr: "رئيسة تصميم وتجربة المنتج",
      roleEn: "Head of Product Design",
      bioAr: "رائدة في تصميم واجهات وتجارب النظم السحابية المعقدة بهوية بصرية مستوحاة من الدفاتر الحسابية والخطوط التيبوغرافية الراقية.",
      bioEn: "Editorial UI/UX lead passionate about transforming dense financial workflows into calm, balanced digital experiences.",
      initials: "SA",
    },
  ];

  const offices = [
    {
      cityAr: "القاهرة (المقر الرئيسي)",
      cityEn: "Cairo (Headquarters)",
      addressAr: "الحي المالي، القرية الذكية، الجيزة",
      addressEn: "Financial District, Smart Village, Giza",
      contact: "cairo@mizan.app",
    },
    {
      cityAr: "الرياض (مكتب العمليات)",
      cityEn: "Riyadh (Regional Operations)",
      addressAr: "طريق الملك فهد، حي الصحافة",
      addressEn: "King Fahd Road, Al-Sahafa District",
      contact: "riyadh@mizan.app",
    },
    {
      cityAr: "دبي (مركز الابتكار)",
      cityEn: "Dubai (Innovation Hub)",
      addressAr: "مركز دبي المالي العالمي (DIFC)",
      addressEn: "Dubai International Financial Centre",
      contact: "dubai@mizan.app",
    },
  ];

  return (
    <MarketingLayout>
      <div className="py-16 sm:py-24 space-y-24 bg-[#FAF6F0] text-[#262321] transition-colors">
        {/* 1. Editorial Hero Header */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#651E2C] shadow-xs">
            <Compass className="size-3.5 text-[#B86B76]" />
            <span>{isAr ? "رؤيتنا ورسالتنا الهندسية" : "Engineering Philosophy & Vision"}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-[1.15]">
            {isAr ? (
              <>
                هندسة معمارية متوازنة <br />
                <span className="italic text-[#B86B76]">بُنيت لتدوم وتتحمل أعباء العمل</span>
              </>
            ) : (
              <>
                Engineered for balance. <br />
                <span className="italic text-[#B86B76]">Built for operational endurance.</span>
              </>
            )}
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#77716E] font-body leading-relaxed">
            {isAr
              ? "انطلقنا لإنهاء عصر الأنظمة الجامدة المعقدة. نمنح أصحاب الأعمال والمديرين تحكماً كاملاً ورؤية مالية واضحة بلا تعقيد أو بطء."
              : "We founded Mizan to end the era of brittle monolithic ERPs. We deliver unified control and mathematical clarity for thriving enterprises."}
          </p>
        </div>

        {/* 2. Hero Architectural Image Banner */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden border border-[#E7D6C1] shadow-xl bg-[#35151D] aspect-[21/9]">
            <img
              src="./assets/marketing/arch-hero-feature.jpg"
              alt="Mizan Architectural Balance"
              className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#35151D] via-[#35151D]/30 to-transparent" />
            <div className="absolute bottom-6 sm:bottom-10 start-6 sm:start-10 max-w-xl text-[#FAF6F0] space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#B86B76] font-bold">
                {isAr ? "فلسفة التصميم والمعمارية" : "Design & Architectural Philosophy"}
              </span>
              <h2 className="font-display text-xl sm:text-3xl font-normal text-white">
                {isAr ? "التناغم بين جمال التيبوغرافيا والصرامة الهندسية" : "Harmonizing Editorial Grace & Engineering Rigor"}
              </h2>
            </div>
          </div>
        </div>

        {/* 3. The Story of Mizan */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#651E2C]">
              {isAr ? "قصة ولادة المنظومة" : "The Genesis of Mizan"}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#262321]">
              {isAr ? "لماذا كان العالم بحاجة إلى ميزان؟" : "Why Modern Business Needed Mizan"}
            </h2>
          </div>

          <div className="rounded-2xl border border-[#E7D6C1] bg-white p-8 sm:p-12 shadow-xs space-y-6 text-sm sm:text-base text-[#77716E] font-body leading-relaxed">
            <p>
              {isAr
                ? "على مدار عقود طويلة، واجهت الأنشطة التجارية خيارين كلاهما شاق: إما الاعتماد على برامج محاسبية سطحية تفتقر للعمق والقطاعات المتخصصة، أو الاستثمار في أنظمة ERP تقليدية ثقيلة تلتهم ميزانيات طائلة وتستغرق شهوراً لتنصيبها وتتسبب في بطء مزمن عند نقاط البيع وطوابير الكاشير."
                : "For decades, growing enterprises faced an agonizing dilemma: adopt simplistic bookkeeping apps lacking industry depth, or invest in colossal legacy ERP suites demanding months of painful implementation and constant cashier lag."}
            </p>
            <p>
              {isAr
                ? "صممنا «ميزان» كحل جذري يعيد التوازن. بدأنا ببناء نواة معيارية تعتمد على قواعد بيانات PostgreSQL معزولة بالكامل، وابتكرنا معمارية الكوليكشنات القطاعية (الـ 47 موديول)، بحيث تفعّل كل منشأة ما تحتاجه تحديداً بضغطة زر واحدة دون تحميل نظامها أي حمل برمجي زائد."
                : "We engineered Mizan as the definitive antidote. Built upon mathematical PostgreSQL tenant isolation, our modular architecture gives every merchant instant access to 47 domain modules — activated with a single click, completely tailored to their business rhythm."}
            </p>
            <p>
              {isAr
                ? "اليوم، تعمل مئات المتاجر وسلاسل المطابخ والمجمعات اللوجستية ومصانع التجهيز على ميزان، وتطبع فواتيرها الحرارية في أجزاء من الثانية، مع طمأنينة مطلقة بأن حساباتها ودفاترها معصومة من الخلل والتباين."
                : "Today, hundreds of high-volume merchants, distributed branches, and multi-tenant facilities rely on Mizan to settle millions in daily transactions with sub-10ms cashier execution and uncompromised financial balance."}
            </p>
          </div>
        </div>

        {/* 4. Core Engineering Pillars */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#651E2C]">
              {isAr ? "المعايير الراسخة" : "Uncompromising Standards"}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#262321]">
              {isAr ? "المبادئ الهندسية الأربعة التي تحكم نظامنا" : "The Four Pillars Governing Our Codebase"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {principles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E7D6C1] bg-white p-8 shadow-xs space-y-4 hover:border-[#651E2C]/50 transition-colors"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#651E2C]/10 text-[#651E2C]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display text-xl font-normal text-[#262321]">
                    {isAr ? p.titleAr : p.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#77716E] font-body leading-relaxed">
                    {isAr ? p.descAr : p.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Leadership Team */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#651E2C]">
              {isAr ? "القيادة والخبرة" : "Leadership & Architects"}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#262321]">
              {isAr ? "فريق الهندسة وتطوير المنتج" : "The Minds Behind Mizan"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E7D6C1] bg-white p-8 text-center shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#FAF6F0] border-2 border-[#E7D6C1] text-[#651E2C] font-display text-xl font-bold shadow-xs">
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-normal text-[#262321]">
                      {isAr ? member.nameAr : member.nameEn}
                    </h3>
                    <p className="text-xs font-semibold text-[#B86B76] mt-0.5">
                      {isAr ? member.roleAr : member.roleEn}
                    </p>
                  </div>
                  <p className="text-xs text-[#77716E] leading-relaxed">
                    {isAr ? member.bioAr : member.bioEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Global Offices & Engineering Hubs */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#651E2C]">
              {isAr ? "التواجد الإقليمي" : "Regional Footprint"}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#262321]">
              {isAr ? "مراكز الدعم والهندسة الإقليمية" : "Regional Engineering & Advisory Centers"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {offices.map((office, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E7D6C1] bg-white p-6 space-y-2 text-start shadow-xs"
              >
                <div className="flex items-center gap-2 text-[#651E2C]">
                  <Building2 className="size-4" />
                  <h4 className="font-bold text-xs text-[#262321]">
                    {isAr ? office.cityAr : office.cityEn}
                  </h4>
                </div>
                <p className="text-xs text-[#77716E] leading-relaxed">
                  {isAr ? office.addressAr : office.addressEn}
                </p>
                <span className="font-mono text-[11px] text-[#B86B76] block pt-1">
                  {office.contact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Final Call to Action */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#35151D] p-8 sm:p-12 text-center text-[#F5EBDD] space-y-6 shadow-xl">
            <h2 className="font-display text-2xl sm:text-4xl font-normal tracking-tight text-white">
              {isAr ? "انضم إلى عائلة المنشآت التي اختارت الاتزان" : "Join the Enterprises That Chose Perfect Balance"}
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#E7D6C1] leading-relaxed">
              {isAr
                ? "ابدأ تجربتك المجانية اليوم لمدة 14 يوماً بكامل الصلاحيات، أو احجز جلسة عرض حي مع فريقنا."
                : "Experience our 14-day full feature trial today, or book a live product walkthrough with our systems architects."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                render={<Link to="/signup" />}
                nativeButton={false}
                size="lg"
                className="bg-[#651E2C] text-white hover:bg-[#8A293B] rounded-full px-6 py-2.5 text-xs font-bold"
              >
                {isAr ? "بدء التجربة المجانية الفورية" : "Start 14-Day Free Trial"}
              </Button>
              <Button
                render={<Link to="/contact" />}
                nativeButton={false}
                size="lg"
                variant="outline"
                className="border-[#E7D6C1]/30 bg-transparent text-[#F5EBDD] hover:bg-white/10 rounded-full px-6 py-2.5 text-xs font-bold"
              >
                {isAr ? "طلب استشارة ومحادثة مباشرة" : "Contact Engineering Team"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
