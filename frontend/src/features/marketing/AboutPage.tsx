import { Link } from "react-router-dom";
import {
  Eye,
  Target,
  Shield,
  ArrowRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { Button } from "@/components/kit/button";
import { MarketingLayout } from "./MarketingLayout";
import { useTranslation } from "@/i18n";
import { assetUrl } from "@/lib/utils";
import { motion } from "motion/react";
import { MizanMagnetic } from "@/components/motion/MizanMagnetic";

export default function AboutPage() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const pillars = [
    {
      icon: Eye,
      titleAr: "رؤيتنا",
      titleEn: "Our Vision",
      descAr: "أن نكون المنظومة السحابية الرائدة التي تعيد تعريف الكفاءة الإدارية والمالية للشركات في الشرق الأوسط.",
      descEn: "To become the premier enterprise platform redefining financial and operational clarity across MENA.",
    },
    {
      icon: Target,
      titleAr: "مهمتنا",
      titleEn: "Our Mission",
      descAr: "تمكين المنشآت التجارية من إدارة أعمالها بنظام موحد يجمع السرعة القصوى مع الدقة المحاسبية المطلقة.",
      descEn: "Empowering businesses through unified software that marries sub-10ms velocity with mathematical precision.",
    },
    {
      icon: Shield,
      titleAr: "قيمنا",
      titleEn: "Our Values",
      descAr: "الشفافية الهندسية، أمان البيانات الصارم، التطور المستمر، والتفاني في خدمة نجاح كل عميل.",
      descEn: "Architectural transparency, rigorous data isolation, continuous evolution, and uncompromising merchant focus.",
    },
  ];

  const teamMembers = [
    {
      nameAr: "د. طارق المنشاوي",
      nameEn: "Dr. Tarek El-Menshawy",
      roleAr: "المؤسس والمدير التنفيذي",
      roleEn: "Founder & CEO",
      img: assetUrl("assets/marketing/avatar-1.jpg"),
    },
    {
      nameAr: "م. كريم الباز",
      nameEn: "Eng. Karim El-Baz",
      roleAr: "رئيس قطاع التكنولوجيا",
      roleEn: "Chief Technology Officer",
      img: assetUrl("assets/marketing/avatar-2.jpg"),
    },
    {
      nameAr: "سارة عبد الرحمن",
      nameEn: "Sarah Abdelrahman",
      roleAr: "رئيسة تصميم وتجربة المنتج",
      roleEn: "Head of Product Design",
      img: assetUrl("assets/marketing/avatar-3.jpg"),
    },
    {
      nameAr: "أحمد الشناوي",
      nameEn: "Ahmed El-Shennawy",
      roleAr: "مدير العمليات والتوسع",
      roleEn: "Head of Operations",
      img: assetUrl("assets/marketing/avatar-4.jpg"),
    },
  ];

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <MarketingLayout>
      <div className="py-12 sm:py-20 bg-[#FAF6F0] text-[#262321] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
          
          {/* 1. Split Hero Section matching Screen 7 (07_about.png) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Modern Architectural Building Photo */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden border border-[#E7D6C1] shadow-xl bg-white p-2">
                <img
                  src={assetUrl("assets/marketing/about-building.jpg")}
                  alt={isAr ? "مقر وتطوير ميزان" : "Mizan Headquarters"}
                  className="w-full h-full object-cover rounded-2xl hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Right Column: "من نحن" and Heading */}
            <div className="lg:col-span-6 space-y-6 text-start order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D6C1] bg-white px-3.5 py-1 text-xs font-semibold text-[#651E2C] shadow-xs">
                <Building2 className="size-3.5 text-[#B86B76]" />
                <span>{isAr ? "عن المنصة والمؤسسة" : "About Mizan & Enterprise"}</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#262321] leading-tight">
                {isAr ? (
                  <>
                    من نحن <br />
                    <span className="italic text-[#651E2C]">هدفنا هو تمكين الأعمال من تحقيق المزيد</span>
                  </>
                ) : (
                  <>
                    About Us <br />
                    <span className="italic text-[#651E2C]">Empowering businesses to achieve more</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-[#77716E] font-body leading-relaxed max-w-xl">
                {isAr
                  ? "نظام متكامل يجمع بين القوة والمرونة، مصمم لخدمة الشركات والمؤسسات بكفاءة وموثوقية عالية، لتمكين اتخاذ القرارات الذكية وتحقيق التوازن الشامل."
                  : "An enterprise platform engineered for balance, flexibility, and absolute financial clarity, empowering modern trading houses to operate without friction."}
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <MizanMagnetic>
                  <Button
                    nativeButton={false}
                    render={<Link to="/signup" />}
                    size="lg"
                    className="rounded-xl bg-[#651E2C] px-7 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#521723]"
                  >
                    <span>{isAr ? "انضم إلينا اليوم" : "Join Us Today"}</span>
                    <ArrowIcon className="size-4 ms-2" />
                  </Button>
                </MizanMagnetic>
                <MizanMagnetic>
                  <Button
                    nativeButton={false}
                    render={<Link to="/contact" />}
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-[#E7D6C1] bg-white px-7 py-3.5 text-xs font-bold text-[#262321] hover:bg-[#FAF6F0] shadow-xs"
                  >
                    <span>{isAr ? "تواصل مع فريقنا" : "Contact Our Team"}</span>
                  </Button>
                </MizanMagnetic>
              </div>
            </div>
          </div>

          {/* 2. Three Circular Pillar Cards (رؤيتنا، مهمتنا، قيمنا) matching Screen 7 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pil, idx) => {
              const Icon = pil.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col items-center text-center space-y-4 rounded-3xl border border-[#E7D6C1] bg-white/70 p-8 shadow-xs hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#F5EBDD] border border-[#E7D6C1] text-[#651E2C] shadow-xs">
                    <Icon className="size-7" />
                  </div>

                  <h3 className="font-display text-2xl font-normal text-[#262321]">
                    {isAr ? pil.titleAr : pil.titleEn}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#77716E] leading-relaxed max-w-xs">
                    {isAr ? pil.descAr : pil.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* 3. Team Section: "فريق العمل" with 4 Circular Avatars matching Screen 7 */}
          <div className="space-y-12 text-center pt-8 border-t border-[#E7D6C1]">
            <div className="space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#262321]">
                {isAr ? "فريق العمل" : "Our Leadership Team"}
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#77716E]">
                {isAr
                  ? "نخبة من خبراء الهندسة المعمارية للنظم السحابية وتجربة المستخدم وحوكمة الأعمال"
                  : "Seasoned architects and engineers committed to operational balance and elegance"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center space-y-3 group cursor-default"
                >
                  <div className="size-24 rounded-full overflow-hidden border-2 border-[#E7D6C1] shadow-md group-hover:border-[#651E2C] group-hover:scale-105 transition-all p-1 bg-white">
                    <img
                      src={member.img}
                      alt={isAr ? member.nameAr : member.nameEn}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#262321]">
                      {isAr ? member.nameAr : member.nameEn}
                    </h3>
                    <p className="text-xs text-[#77716E] mt-0.5">
                      {isAr ? member.roleAr : member.roleEn}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MarketingLayout>
  );
}
