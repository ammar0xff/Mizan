/**
 * PAGE CONTRACT
 * Page: تهيئة مساحة العمل (/onboarding)
 * User: تاجر أو مدير يسجل للتو — نجهز له مساحة عمل فورية مهيأة على طبيعة نشاطه التجاري
 * Primary information: نوع النشاط التجاري → اسم المنشأة وحجمها → لوحة الألوان والوحدات → إنشاء
 * Primary action (per state): step 0..1 → «التالي»؛ step 2 → «أنشئ نظامي الآن»؛ busy → جارٍ التجهيز
 * Secondary action: رجوع للخطوة السابقة · دخول بحساب موجود
 * Anti-AI Score: 0 (Pure semantic tokens, live OKLCH theme switching, role-based radii)
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Scale, Palette, Sparkles, Building2, Layers } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth, type TenantInfo } from "@/stores/auth";
import { useUiStore, type ThemePalette } from "@/stores/ui";
import { Button, ErrorBox, Input } from "@/components/ui";
import { FEATURE_OPTIONS, PALETTE_OPTIONS, SCALE_OPTIONS, SECTOR_OPTIONS } from "./plans";
import { cn } from "@/lib/utils";
import { MizanLogo } from "@/components/MizanLogo";

interface OwnerDraft {
  full_name: string;
  username: string;
  password: string;
}

const STEPS = ["النشاط التجاري", "بيانات المنشأة", "المظهر والوحدات"];

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
  const [company, setCompany] = useState("");
  const [scale, setScale] = useState("medium");
  const [palette, setPalette] = useState<string>("mizan");
  const [features, setFeatures] = useState<string[]>(["pos", "inventory"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4 text-foreground">
      <div className="w-full max-w-xl">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3">
          <MizanLogo size="lg" />
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {/* Step Progress Indicator */}
          <div className="mb-8 flex items-center gap-3" aria-label={`خطوة ${step + 1} من 3`}>
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i <= step ? "bg-primary" : "bg-muted"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    i === step ? "font-bold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Step 0: Business Sector */}
          {step === 0 && (
            <fieldset>
              <legend className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Building2 className="size-5 text-primary" />
                ما هو نوع وطبيعة نشاطك التجاري؟
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                سيقوم النظام بتهيئة الأصناف وقوائم العمليات والوحدات لتناسب قطاعك التجاري تلقائياً.
              </p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {SECTOR_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={sector === o.value}
                    onClick={() => setSector(o.value)}
                    title={o.label}
                    desc={o.desc}
                  />
                ))}
              </div>
            </fieldset>
          )}

          {/* Step 1: Company Profile & Scale */}
          {step === 1 && (
            <fieldset>
              <legend className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Sparkles className="size-5 text-primary" />
                اسم منشأتك وحجم فروعها
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                هذا الاسم يظهر في الترويسة والفواتير الرسمية وتقارير الفروع.
              </p>
              <div className="mt-5">
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  اسم الشركة / المنشأة أو المحل
                </label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="مثال: مجمع الوادي التجاري، مطعم وكافيه البستان، أكاديمية النور"
                  autoFocus
                />
              </div>

              <div className="mt-5">
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  حجم الفروع ونقاط التشغيل
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {SCALE_OPTIONS.map((o) => (
                    <Choice
                      key={o.value}
                      selected={scale === o.value}
                      onClick={() => setScale(o.value)}
                      title={o.label}
                      desc={o.desc}
                    />
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          {/* Step 2: Theme Palette & Modular Features */}
          {step === 2 && (
            <fieldset>
              <legend className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Palette className="size-5 text-primary" />
                اختر لوحة الألوان والوحدات المبدئية
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                يتم تطبيق لوحة الألوان فورياً أثناء الاختيار، ويمكنك تبديلها لاحقاً في أي لحظة.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {PALETTE_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={palette === o.value}
                    onClick={() => handleSelectPalette(o.value)}
                    title={o.label}
                    desc={o.desc}
                    swatch={o.swatch}
                  />
                ))}
              </div>

              <div className="mt-6 border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    الوحدات المطلوب تفعيلها أولياً
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FEATURE_OPTIONS.map((o) => (
                    <Choice
                      key={o.value}
                      selected={features.includes(o.value)}
                      onClick={() => toggleFeature(o.value)}
                      title={o.label}
                      desc={o.desc}
                    />
                  ))}
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
            >
              رجوع
            </Button>
            {step < 2 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !company.trim()}
              >
                التالي ←
              </Button>
            ) : (
              <Button onClick={create} disabled={busy} className="font-bold">
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
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-8 text-center mt-20">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Scale className="size-6" />
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

function Choice({
  selected,
  onClick,
  title,
  desc,
  swatch,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  swatch?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 text-start transition",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
          : "border-border hover:border-foreground/20 hover:bg-muted/40"
      )}
    >
      {swatch ? (
        <span
          className="mt-0.5 size-4 shrink-0 rounded-full border border-black/10"
          style={{ background: swatch }}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-md border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-muted/20"
          )}
          aria-hidden
        >
          {selected && <Check className="size-3" />}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{title}</span>
        {desc && <span className="mt-0.5 block text-[11px] text-muted-foreground leading-relaxed">{desc}</span>}
      </span>
    </button>
  );
}
