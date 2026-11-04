/**
 * PAGE CONTRACT
 * Page: تهيئة مساحة العمل (/onboarding)
 * User: تاجر أو مدير يسجل للتو — نجهز له مساحة عمل فورية مهيأة على طبيعة نشاطه التجاري
 * Primary information: نوع النشاط التجاري → اسم المنشأة وحجمها → لوحة الألوان والوحدات → إنشاء
 * Primary action: step 0..1 → «التالي»؛ step 2 → «أنشئ مساحة عملي الآن»؛ busy → جارٍ التجهيز
 * Art Direction: Warm Editorial Luxury (Oxblood, Deep Merlot, Warm Ivory, Muted Rose)
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Scale as ScaleIcon,
  Palette,
  Sparkles,
  Building2,
  Building,
  Store,
  Layers,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  Pill,
  Briefcase,
  GraduationCap,
  Truck,
  Warehouse,
  Globe,
  Stethoscope,
  Plane,
  Hotel,
  Dumbbell,
  Wrench,
  Factory,
  Apple,
  FlaskConical,
  Printer,
  HardHat,
  Wheat,
  Zap,
  Landmark,
  ShieldCheck,
  Ticket,
  Flame,
  X,
  type LucideIcon,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth, type TenantInfo } from "@/stores/auth";
import { useUiStore, type ThemePalette } from "@/stores/ui";
import { Button, ErrorBox, Input } from "@/components/ui";
import { FEATURE_OPTIONS, PALETTE_OPTIONS, SECTOR_OPTIONS } from "./plans";
import { cn } from "@/lib/utils";
import { MizanLogo } from "@/components/MizanLogo";

interface OwnerDraft {
  full_name: string;
  username: string;
  password: string;
}

const STEPS = ["النشاط التجاري", "بيانات المنشأة", "المظهر والوحدات"];

interface SectorMeta {
  value: string;
  label: string;
  desc: string;
  category: "commerce" | "food" | "health" | "services" | "construction" | "industry";
  icon: LucideIcon;
  badge?: string;
  popular?: boolean;
}

const SECTOR_META_MAP: Record<string, { category: SectorMeta["category"]; icon: LucideIcon; badge?: string; popular?: boolean }> = {
  // Commerce & Retail
  retail: { category: "commerce", icon: ShoppingCart, badge: "Retail-POS", popular: true },
  wholesale: { category: "commerce", icon: Truck, badge: "تسعير كميات", popular: true },
  ecommerce: { category: "commerce", icon: Globe, badge: "ربط متجر", popular: true },
  wms_3pl: { category: "commerce", icon: Warehouse, badge: "مستودعات 3PL" },
  logistics: { category: "commerce", icon: Truck, badge: "بوالص وأساطيل" },

  // Food & Hospitality
  restaurant: { category: "food", icon: UtensilsCrossed, badge: "KDS وطاولات", popular: true },
  hotel: { category: "food", icon: Hotel, badge: "حجوزات وغرف" },
  travel: { category: "food", icon: Plane, badge: "حجوزات طيران" },
  entertainment: { category: "food", icon: Ticket, badge: "بوابات وتذاكر" },

  // Health & Wellness
  pharmacy: { category: "health", icon: Pill, badge: "تشغيلات وصلاحية", popular: true },
  healthcare: { category: "health", icon: Stethoscope, badge: "ملفات وتأمين", popular: true },
  gym: { category: "health", icon: Dumbbell, badge: "بوابات واشتراكات" },
  salon: { category: "health", icon: Sparkles, badge: "خدمات ومواعيد" },

  // Services & Professions
  consulting: { category: "services", icon: Briefcase, badge: "ساعات قابلة للفوترة" },
  law_firm: { category: "services", icon: ScaleIcon, badge: "قضايا وأمانات" },
  agency: { category: "services", icon: Palette, badge: "مشاريع وعقود" },
  field_service: { category: "services", icon: Wrench, badge: "أوامر شغل وفنيون" },
  school: { category: "services", icon: GraduationCap, badge: "أقساط ورسوم" },
  services: { category: "services", icon: Building2, badge: "خدمات وعقود" },

  // Construction & Property
  construction: { category: "construction", icon: HardHat, badge: "BOQ ومستخلصات", popular: true },
  real_estate: { category: "construction", icon: Building, badge: "عقود وصيانة" },
  plumbing: { category: "construction", icon: Store, badge: "معارض وتشطيبات" },

  // Industry & Energy
  discrete_mfg: { category: "industry", icon: Factory, badge: "BOM وMRP" },
  food_mfg: { category: "industry", icon: Apple, badge: "خلطات وسلامة" },
  pharma_mfg: { category: "industry", icon: FlaskConical, badge: "معايير GMP" },
  printing: { category: "industry", icon: Printer, badge: "تذاكر ومونتاج" },
  agriculture: { category: "industry", icon: Wheat, badge: "محاصيل وثروة" },
  energy: { category: "industry", icon: Zap, badge: "عدادات وصيانة" },
  oil_gas: { category: "industry", icon: Flame, badge: "آبار وتشغيل" },
  banking: { category: "industry", icon: Landmark, badge: "قيود مزدوجة" },
  insurance: { category: "industry", icon: ShieldCheck, badge: "وثائق ومطالبات" },
  government: { category: "industry", icon: Landmark, badge: "صناديق وموازنات" },
};

const CATEGORIES = [
  { id: "all", label: "كافة القطاعات" },
  { id: "commerce", label: "تجارة وتجزئة" },
  { id: "food", label: "مطاعم وضيافة" },
  { id: "health", label: "صحة ورياضة" },
  { id: "services", label: "خدمات واستشارات" },
  { id: "construction", label: "مقاولات وعقار" },
  { id: "industry", label: "صناعة وإنتاج" },
] as const;

export default function OnboardingWizard() {
  const nav = useNavigate();
  const draft: OwnerDraft | null = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("mizan.owner") ?? sessionStorage.getItem("vendora.owner") ?? "null"
      );
    } catch {
      return null;
    }
  })();

  const [step, setStep] = useState(0);
  const [sector, setSector] = useState("retail");
  const [sectorCategory, setSectorCategory] = useState<string>("all");
  const [sectorSearch, setSectorSearch] = useState<string>("");
  const [company, setCompany] = useState("");
  const [scale, setScale] = useState("medium");
  const [palette, setPalette] = useState<string>("mizan");
  const [features, setFeatures] = useState<string[]>(["pos", "inventory"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enriched sectors list
  const enrichedSectors: SectorMeta[] = useMemo(() => {
    return SECTOR_OPTIONS.map((s) => {
      const meta = SECTOR_META_MAP[s.value] || { category: "services", icon: Store };
      return {
        ...s,
        category: meta.category,
        icon: meta.icon,
        badge: meta.badge,
        popular: meta.popular,
      };
    });
  }, []);

  // Filtered sectors by search and category
  const filteredSectors = useMemo(() => {
    return enrichedSectors.filter((s) => {
      const matchesCategory = sectorCategory === "all" || s.category === sectorCategory;
      const q = sectorSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.label.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q) ||
        (s.badge && s.badge.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [enrichedSectors, sectorCategory, sectorSearch]);

  if (!draft) {
    return (
      <Centered>
        <Emptyish />
      </Centered>
    );
  }

  function toggleFeature(v: string) {
    setFeatures((f) => (f.includes(v) ? f.filter((x) => x !== v) : [...f, v]));
  }

  function handleSelectPalette(palId: string) {
    setPalette(palId);
    useUiStore.getState().setPalette(palId as ThemePalette);
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<{ access_token: string; user: never; tenant: TenantInfo }>("/platform/signup", {
        company_name: company,
        sector,
        scale,
        palette,
        features,
        owner_username: draft!.username,
        owner_password: draft!.password,
        owner_full_name: draft!.full_name,
      });

      // Apply the chosen palette in UI store
      useUiStore.getState().setPalette(palette as ThemePalette);
      useAuth.getState().setToken(r.access_token);

      const me = await api.get<import("@/stores/auth").User>("/auth/me");
      useAuth.getState().setUser(me);
      useAuth.getState().setTenant(r.tenant);
      sessionStorage.removeItem("mizan.owner");
      sessionStorage.removeItem("vendora.owner");

      const targetSlug = r.tenant?.slug;
      if (targetSlug && targetSlug !== "undefined" && targetSlug !== "null") {
        nav(`/c/${targetSlug}/pos`, { replace: true });
      } else {
        nav("/pos", { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("اسم المستخدم محجوز — ارجع للخطوة السابقة واختر اسمًا آخر.");
        setStep(0);
      } else {
        setError(err instanceof ApiError ? err.message : "تعذر تجهيز مساحة العمل — حاول مجددًا");
      }
    } finally {
      setBusy(false);
    }
  }

  const selectedSectorObj = enrichedSectors.find((s) => s.value === sector);

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4 text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-4xl py-6 transition-all duration-300">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3">
          <MizanLogo size="lg" />
        </Link>

        <div className="rounded-2xl border border-line bg-card p-5 sm:p-8 shadow-xl backdrop-blur-sm">
          {/* Step Progress Indicator */}
          <div className="mb-6 flex items-center gap-3" aria-label={`خطوة ${step + 1} من 3`}>
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i <= step ? "bg-primary shadow-xs" : "bg-muted"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    i === step ? "font-bold text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="font-mono me-1">{i + 1}.</span>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              Step 0: Business Sector (Curated, Categorized, Searchable)
              ══════════════════════════════════════════════════════════════════ */}
          {step === 0 && (
            <fieldset className="space-y-4">
              <div>
                <legend className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
                  <Building2 className="size-5 text-primary shrink-0" />
                  ما هو نوع وطبيعة نشاطك التجاري؟
                </legend>
                <p className="mt-1 text-xs text-muted-foreground">
                  سيقوم محرك ميزان بتهيئة الدليل المحاسبي، شاشات نقاط البيع، والمخزون، وقوالب الفواتير لتناسب قطاعك فورياً.
                </p>
              </div>

              {/* Search & Category Filter Toolbar */}
              <div className="space-y-2.5 pt-1">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    placeholder="ابحث عن نشاطك (مثال: سوبرماركت، مطعم، صيدلية، مقاولات، ملابس...)"
                    className="w-full h-10 rounded-xl border border-line bg-background pe-9 ps-9 text-xs font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
                  />
                  {sectorSearch && (
                    <button
                      type="button"
                      onClick={() => setSectorSearch("")}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md"
                      title="مسح البحث"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSectorCategory(cat.id);
                      }}
                      className={cn(
                        "shrink-0 rounded-lg px-3 py-1.5 font-medium transition text-[11px]",
                        sectorCategory === cat.id
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "border border-line bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sectors Grid with Controlled Scroll */}
              <div className="max-h-[50vh] sm:max-h-[52vh] overflow-y-auto pe-1 space-y-2 focus:outline-hidden">
                {filteredSectors.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed border-line rounded-xl">
                    <p className="text-sm font-semibold">لا يوجد قطاع مطابق لبحثك: &quot;{sectorSearch}&quot;</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      جرب البحث بكلمة أبسط أو اختر &quot;تجارة وتجزئة&quot; أو &quot;خدمات عامة&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSectorSearch("");
                        setSectorCategory("all");
                      }}
                      className="mt-3 text-xs font-bold text-primary hover:underline"
                    >
                      عرض كافة القطاعات
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSectors.map((o) => {
                      const IconComponent = o.icon;
                      const isSelected = sector === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setSector(o.value)}
                          aria-pressed={isSelected}
                          className={cn(
                            "group relative flex flex-col justify-between rounded-xl border p-3.5 text-start transition-all duration-200 cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary"
                              : "border-line bg-card hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className={cn(
                                  "grid size-8 place-items-center rounded-lg transition-colors",
                                  isSelected
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                                )}
                              >
                                <IconComponent className="size-4" />
                              </span>

                              <div className="flex items-center gap-1.5">
                                {o.badge && (
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.5 text-[9px] font-mono font-medium",
                                      isSelected
                                        ? "bg-primary/20 text-primary font-bold"
                                        : "bg-secondary text-muted-foreground"
                                    )}
                                  >
                                    {o.badge}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "grid size-4 place-items-center rounded-full border transition-all",
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground scale-110"
                                      : "border-muted-foreground/30 opacity-40 group-hover:opacity-100"
                                  )}
                                >
                                  {isSelected && <Check className="size-2.5 stroke-[3]" />}
                                </span>
                              </div>
                            </div>

                            <span className="block text-xs font-bold text-foreground leading-snug line-clamp-1">
                              {o.label.split("(")[0].trim()}
                            </span>
                            <span className="mt-1 block text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                              {o.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Sector Summary Banner */}
              {selectedSectorObj && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
                      <selectedSectorObj.icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">
                        القطاع المختار: {selectedSectorObj.label.split("(")[0].trim()}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{selectedSectorObj.desc}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    جاهز للتخصيص ✓
                  </span>
                </div>
              )}
            </fieldset>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              Step 1: Company Profile & Scale
              ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <fieldset className="space-y-5">
              <div>
                <legend className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
                  <Sparkles className="size-5 text-primary shrink-0" />
                  اسم منشأتك وحجم فروعها
                </legend>
                <p className="mt-1 text-xs text-muted-foreground">
                  هذا الاسم يظهر في الترويسة والفواتير الرسمية وتقارير الفروع ويمكنك تعديله في أي وقت.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  اسم الشركة / المنشأة أو المحل التجاري *
                </label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="مثال: مجمع الوادي التجاري، مطعم وكافيه البستان، صيدلية النور"
                  autoFocus
                  className="h-11 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  حجم الفروع ونقاط التشغيل
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "small",
                      label: "فرع واحد",
                      desc: "محل أو مكتب فردي وفريق عمل مركز",
                      icon: Store,
                    },
                    {
                      value: "medium",
                      label: "٢–٣ فروع",
                      desc: "أكثر من فرع مع مستودع مركزي ومزامنة",
                      icon: Building,
                    },
                    {
                      value: "large",
                      label: "٤ فروع وأكثر",
                      desc: "سلسلة فروع ممتدة وشبكة توزيع كبرى",
                      icon: Building2,
                    },
                  ].map((o) => {
                    const ScaleIconComp = o.icon;
                    const isSelected = scale === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setScale(o.value)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-xl border text-start transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-line bg-card hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className={cn(
                              "grid size-8 place-items-center rounded-lg",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                          >
                            <ScaleIconComp className="size-4" />
                          </span>
                          <span
                            className={cn(
                              "size-4 rounded-full border grid place-items-center",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                            )}
                          >
                            {isSelected && <Check className="size-2.5" />}
                          </span>
                        </div>
                        <span className="block text-xs font-bold text-foreground">{o.label}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground leading-relaxed">
                          {o.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              Step 2: Theme Palette & Modular Features
              ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <fieldset className="space-y-5">
              <div>
                <legend className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
                  <Palette className="size-5 text-primary shrink-0" />
                  اختر الهوية البصرية والوحدات المبدئية
                </legend>
                <p className="mt-1 text-xs text-muted-foreground">
                  يتم تطبيق لوحة الألوان فورياً أثناء الاختيار، ويمكنك تبديلها لاحقاً في أي لحظة من الإعدادات.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  لوحة الألوان الرسمية
                </label>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {PALETTE_OPTIONS.map((o) => {
                    const isSelected = palette === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => handleSelectPalette(o.value)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-start transition cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-line bg-card hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <span
                          className="mt-0.5 size-5 shrink-0 rounded-full border border-black/10 shadow-xs"
                          style={{ background: o.swatch }}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-foreground truncate">{o.label}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                            {o.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Layers className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">الوحدات المطلوب تفعيلها أولياً</span>
                  <span className="text-[10px] text-muted-foreground">(يمكنك تشغيل باقي الوحدات لاحقاً)</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {FEATURE_OPTIONS.map((o) => {
                    const isSelected = features.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleFeature(o.value)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-start transition cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-line bg-card hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-md border transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-muted/20"
                          )}
                        >
                          {isSelected && <Check className="size-2.5 stroke-[3]" />}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-foreground">{o.label}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground leading-relaxed line-clamp-1">
                            {o.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          )}

          {error && (
            <div className="mt-5">
              <ErrorBox message={error} />
            </div>
          )}

          {/* Wizard Action Controls */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <Button
              variant="outline"
              onClick={() => (step === 0 ? nav("/signup") : setStep((s) => s - 1))}
              className="text-xs font-medium"
            >
              ← رجوع
            </Button>

            {step < 2 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !company.trim()}
                className="font-bold text-xs px-6"
              >
                التالي ←
              </Button>
            ) : (
              <Button onClick={create} disabled={busy} className="font-bold text-xs px-6 shadow-md">
                {busy ? "جارٍ تجهيز مساحة عملك..." : "أنشئ مساحة عملي الآن ✓"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          ستدخل مباشرة على مساحة عمل مهيأة بالكامل، ويمكنك تغيير الأنشطة والوحدات في أي وقت.
        </p>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-background text-foreground">{children}</div>;
}

function Emptyish() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-line bg-card p-8 text-center mt-20 shadow-lg">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <ScaleIcon className="size-6" />
      </span>
      <h1 className="font-bold text-foreground">ابدأ من صفحة الحساب</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        يقوم المعالج بقراءة بيانات حسابك من خطوة التسجيل الأولى.
      </p>
      <Link to="/signup" className="mt-5 inline-block">
        <Button>إنشاء حساب جديد</Button>
      </Link>
    </div>
  );
}
