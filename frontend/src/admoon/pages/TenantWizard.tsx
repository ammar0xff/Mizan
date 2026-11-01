/**
 * Admoon Tenant Creation & Infrastructure Provisioning Wizard.
 * 
 * Multi-step interactive flow:
 * Step 1: Tenant Information
 * Step 2: Hosting Mode (SaaS, Local Single-Machine, LAN, VPS, Hybrid)
 * Step 3: Database Engine (Postgres, Neon, MySQL, SQLite, Firestore)
 * Step 4: Storage Provider (Local, S3/MinIO/R2, Firebase)
 * Step 5: ERP Modules & Specialized Collections
 * Step 6: Initial Admin User Credentials
 * Step 7: Live Provisioning Execution Progress
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wand2,
  FolderSync,
  ExternalLink,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button, Input } from "@/components/ui";
import { toast } from "sonner";

const HOSTING_MODES = [
  {
    id: "cloud_saas",
    title: "سحابي كامل (Fully Hosted SaaS)",
    desc: "تشغيل التطبيق وقاعدة البيانات والتخزين على البنية السحابية المدارة مع نسخ احتياطي وتحديثات تلقائية.",
    badge: "Cloud Hosted",
  },
  {
    id: "desktop_standalone",
    title: "مكتبي محلي مستقل (Local Single Machine)",
    desc: "تشغيل التطبيق كبرنامج محلي (.exe) مع قاعدة بيانات SQLite مدمجة والعمل دون اتصال بالإنترنت مع ترخيص مشفر.",
    badge: "Offline SQLite",
  },
  {
    id: "lan_deployment",
    title: "شبكة محلية للمنشأة (LAN Deployment)",
    desc: "سيرفر محلي مركزي يخدم عدة أجهزة كاشير ومحاسبة على نفس الشبكة الداخلية مع PostgreSQL محلي.",
    badge: "Local Network",
  },
  {
    id: "vps_deployment",
    title: "خادم افتراضي خاص (VPS Deployment)",
    desc: "استضافة كاملة على سيرفر VPS خاص بالعميل مع نطاق خاص وشهادة SSL وحرية إدارة موارد السيرفر.",
    badge: "Dedicated VPS",
  },
];

const DB_ENGINES = [
  { id: "postgres_neon", name: "Neon Serverless PostgreSQL", desc: "توسع تلقائي مع فروع مستقلة لكل عميل (موصى به للسحابة)" },
  { id: "postgres_shared", name: "PostgreSQL المشترك (Isolated Schema)", desc: "قاعدة بيانات PostgreSQL محلية أو مشتركة عالية الأداء" },
  { id: "mysql", name: "MySQL 8.0 على VPS", desc: "محرك MySQL مخصص للخوادم الافتراضية والبيئات الخاصة" },
  { id: "sqlite_local", name: "SQLite مدمج (Local Embedded)", desc: "محرك ملفي مدمج خفيف مثالي للتثبيت المكتبي الفردي" },
  { id: "firestore", name: "Google Cloud Firestore (NoSQL)", desc: "قاعدة بيانات وثائقية سحابية موزعة وغير علائقية" },
];

const STORAGE_DRIVERS = [
  { id: "local", name: "التخزين المحلي على القرص (Local Filesystem)", desc: "حفظ المرفقات والملفات في مجلدات السيرفر أو الجهاز المحلي" },
  { id: "s3_minio", name: "S3 / MinIO / Cloudflare R2", desc: "تخزين كائنات غير محدود متوافق مع بروتوكول S3 السحابي" },
  { id: "firebase_storage", name: "Firebase Cloud Storage", desc: "تخزين سحابي مدعوم من شبكة توصيل المحتوى العالمية لـ Google" },
];

const AVAILABLE_MODULES = [
  { id: "pos", name: "نقطة بيع سريعة (POS)", desc: "إصدار فواتير الكاشير والباركود والورديات" },
  { id: "gym-pos", name: "كاشير النوادي (Gym POS)", desc: "تجديد الاشتراكات، الدخول اليومي، وشيك بار" },
  { id: "restaurant-pos", name: "كاشير المطاعم والصالة", desc: "اختيار الطاولات، شاشات KDS، وفصل الشيكات" },
  { id: "retail-pos", name: "كاشير التجزئة والسوبرماركت", desc: "مسح فائق السرعة، الموازين، وأدراج النقدية" },
  { id: "inventory", name: "المستودعات والمخزون", desc: "تتبع الأرصدة، الجرد، والتحويلات" },
  { id: "gym_fitness", name: "إدارة النوادي والاشتراكات", desc: "ملفات الأعضاء، البصمة، والمدربين" },
  { id: "restaurant", name: "إدارة الصالات والمطاعم", desc: "خريطة الطاولات وشاشات المطبخ" },
  { id: "school", name: "المدارس والأكاديميات", desc: "الطلاب، الأقساط، وسندات المصروفات" },
  { id: "finance", name: "المالية والخزائن", desc: "الخزائن، الحسابات البنكية، والمصروفات" },
  { id: "hr", name: "شؤون الموظفين والرواتب", desc: "الحضور، الورديات، ومسيرات الأجور" },
];

export default function TenantWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [businessType, setBusinessType] = useState("gym");
  const [plan, setPlan] = useState("pro");
  const [trialDays, setTrialDays] = useState(30);

  const [hostingMode, setHostingMode] = useState("cloud_saas");
  const [dbEngine, setDbEngine] = useState("postgres_neon");
  const [dbConnectionUri, setDbConnectionUri] = useState("");
  const [storageDriver, setStorageDriver] = useState("local");
  const [selectedModules, setSelectedModules] = useState<string[]>(["pos", "inventory", "gym-pos"]);

  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");

  // Provisioning progress state
  const [provisioning, setProvisioning] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionStepText, setProvisionStepText] = useState("");
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const toggleModule = (id: string) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const handleStartProvisioning = async () => {
    try {
      setProvisioning(true);
      setProvisionProgress(15);
      setProvisionStepText("التحقق من بيانات المنشأة وعزل النطاق...");

      const payload = {
        company_name: companyName.trim(),
        slug: slug.trim().toLowerCase(),
        custom_domain: customDomain.trim() || null,
        business_type: businessType,
        sector: businessType,
        scale: "medium",
        palette: "cobalt",
        plan,
        deployment_mode: hostingMode,
        tech_stack: {
          deployment_mode: hostingMode,
          db_engine: dbEngine,
          db_connection_uri: dbConnectionUri || null,
          storage_driver: storageDriver,
          backend_engine: hostingMode === "desktop_standalone" ? "desktop_embedded" : "fastapi_cloud",
          offline_sync_enabled: hostingMode === "desktop_standalone" || hostingMode === "lan_deployment",
        },
        active_modules: selectedModules,
        owner_username: ownerUsername.trim(),
        owner_password: ownerPassword.trim(),
        owner_full_name: ownerFullName.trim(),
        trial_days: trialDays,
      };

      setProvisionProgress(40);
      setProvisionStepText("تهيئة بيئة قاعدة البيانات والمجلدات...");

      const res = await api.post<any>("/admoon/tenants", payload);

      setProvisionProgress(80);
      setProvisionStepText("إنشاء حساب المدير وتثبيت الوحدات والكتالوج الأولي...");

      setTimeout(() => {
        setProvisionProgress(100);
        setProvisionStepText("اكتمل التأسيس بنجاح!");
        setProvisionResult(res);
        toast.success(`تم تأسيس مساحة عمل '${companyName}' بنجاح!`);
      }, 800);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فشل تأسيس المنشأة");
      setProvisioning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          <Wand2 className="size-3.5" />
          معالج تأسيس الشركات وتخصيص البنية التحتية
        </div>
        <h1 className="text-xl font-black text-foreground">تأسيس منشأة جديدة (Provisioning Wizard)</h1>
        <p className="text-xs text-muted-foreground">
          خطوات معيارية لتهيئة بيئة الاستضافة، قاعدة البيانات، الوحدات النمطية، وحساب المالك.
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between border-b border-border pb-4 text-xs font-semibold">
        {[
          { num: 1, label: "بيانات المنشأة" },
          { num: 2, label: "نمط الاستضافة" },
          { num: 3, label: "قاعدة البيانات" },
          { num: 4, label: "وسيط التخزين" },
          { num: 5, label: "الوحدات النمطية" },
          { num: 6, label: "حساب المدير" },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-1.5 ${
              step === s.num ? "text-primary font-bold" : step > s.num ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            <span
              className={`size-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                step === s.num
                  ? "bg-primary text-primary-foreground font-black"
                  : step > s.num
                  ? "bg-emerald-500/20 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Tenant Info */}
      {step === 1 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">الخطوة 1: المعلومات الأساسية وهوية المنشأة</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">الاسم التجاري للمنشأة *</label>
              <Input
                placeholder="مثال: نادي مونست الرياضي"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                  }
                }}
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">الرابط المخصص (Slug) *</label>
              <Input
                placeholder="مثال: monset-gym"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="h-9 text-xs font-mono"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">سيكون مسار جذر المنشأة: /{slug}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">نوع النشاط والقطاع</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="gym">نوادي وصالات رياضية (Gym & Fitness)</option>
                <option value="restaurant">مطاعم وكافيهات (Restaurant & Cafe)</option>
                <option value="retail">تجزئة وسوبرماركت (Retail & Supermarket)</option>
                <option value="school">مدارس وأكاديميات (School & Academy)</option>
                <option value="clinic">مراكز وعيادات طبية (Clinic & Medical)</option>
                <option value="services">خدمات واستشارات (Services & Booking)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">باقة الاشتراك</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="trial">تجريبي (Trial - 30 يوماً)</option>
                <option value="starter">البداية (Starter)</option>
                <option value="pro">المحترف (Pro - موصى به)</option>
                <option value="enterprise">المؤسسات الكبرى (Enterprise)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">النطاق المخصص (Custom Domain - اختياري)</label>
              <Input
                placeholder="مثال: app.mygym.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            {plan === "trial" && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">فترة التجربة (بالأيام)</label>
                <Input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              size="sm"
              disabled={!companyName.trim() || !slug.trim()}
              onClick={() => setStep(2)}
              className="text-xs h-8 gap-1.5 font-bold"
            >
              التالي: نمط الاستضافة
              <ArrowLeft className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Hosting Mode */}
      {step === 2 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">الخطوة 2: اختيار نمط الاستضافة والبيئة</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOSTING_MODES.map((hm) => {
              const isSelected = hostingMode === hm.id;
              return (
                <div
                  key={hm.id}
                  onClick={() => {
                    setHostingMode(hm.id);
                    if (hm.id === "desktop_standalone") {
                      setDbEngine("sqlite_local");
                      setStorageDriver("local");
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{hm.title}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {hm.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{hm.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs h-8 gap-1.5">
              <ArrowRight className="size-3.5" />
              السابق
            </Button>
            <Button size="sm" onClick={() => setStep(3)} className="text-xs h-8 gap-1.5 font-bold">
              التالي: قاعدة البيانات
              <ArrowLeft className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Database Provider */}
      {step === 3 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">الخطوة 3: اختيار محرك قاعدة البيانات</h2>

          <div className="space-y-2.5">
            {DB_ENGINES.map((db) => {
              const isSelected = dbEngine === db.id;
              return (
                <div
                  key={db.id}
                  onClick={() => setDbEngine(db.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-foreground">{db.name}</p>
                    <p className="text-xs text-muted-foreground">{db.desc}</p>
                  </div>
                  <span className="size-4 rounded-full border border-primary flex items-center justify-center shrink-0">
                    {isSelected && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              رابط الاتصال المخصص بقاعدة البيانات (URI - اختياري)
            </label>
            <Input
              placeholder="مثال: postgresql://user:pass@host:5432/dbname"
              value={dbConnectionUri}
              onChange={(e) => setDbConnectionUri(e.target.value)}
              className="h-9 text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">اتركه فارغاً ليقوم المحرك بتوليده تلقائياً وفقاً للمزود المختار.</p>
          </div>

          <div className="pt-4 border-t border-border flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs h-8 gap-1.5">
              <ArrowRight className="size-3.5" />
              السابق
            </Button>
            <Button size="sm" onClick={() => setStep(4)} className="text-xs h-8 gap-1.5 font-bold">
              التالي: وسيط التخزين
              <ArrowLeft className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Storage Provider */}
      {step === 4 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">الخطوة 4: اختيار وسيط التخزين للملفات والمرفقات</h2>

          <div className="space-y-2.5">
            {STORAGE_DRIVERS.map((st) => {
              const isSelected = storageDriver === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => setStorageDriver(st.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-foreground">{st.name}</p>
                    <p className="text-xs text-muted-foreground">{st.desc}</p>
                  </div>
                  <span className="size-4 rounded-full border border-primary flex items-center justify-center shrink-0">
                    {isSelected && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs h-8 gap-1.5">
              <ArrowRight className="size-3.5" />
              السابق
            </Button>
            <Button size="sm" onClick={() => setStep(5)} className="text-xs h-8 gap-1.5 font-bold">
              التالي: الوحدات النمطية
              <ArrowLeft className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Modules Selection */}
      {step === 5 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground">الخطوة 5: تفعيل وحدات ERP والمجموعات المتخصصة</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_MODULES.map((m) => {
              const isChecked = selectedModules.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isChecked
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-bold text-xs text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep(4)} className="text-xs h-8 gap-1.5">
              <ArrowRight className="size-3.5" />
              السابق
            </Button>
            <Button size="sm" onClick={() => setStep(6)} className="text-xs h-8 gap-1.5 font-bold">
              التالي: حساب المدير
              <ArrowLeft className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: Admin Account & Review */}
      {step === 6 && !provisioning && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-foreground">الخطوة 6: إنشاء حساب مدير المنشأة والبدء في التأسيس</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">الاسم الكامل للمدير *</label>
              <Input
                placeholder="مثال: كابتن أحمد منصور"
                value={ownerFullName}
                onChange={(e) => setOwnerFullName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">اسم المستخدم للدخول *</label>
              <Input
                placeholder="مثال: captain_monset"
                value={ownerUsername}
                onChange={(e) => setOwnerUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                className="h-9 text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">كلمة المرور الابتدائية *</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Configuration Summary Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
            <h3 className="font-bold text-foreground">ملخص معايير التأسيس:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
              <div>الشركة: <strong className="text-foreground">{companyName}</strong></div>
              <div>الرابط: <strong className="text-foreground font-mono">/{slug}</strong></div>
              <div>الاستضافة: <strong className="text-foreground">{hostingMode}</strong></div>
              <div>المحرك: <strong className="text-foreground font-mono">{dbEngine}</strong></div>
              <div>التخزين: <strong className="text-foreground">{storageDriver}</strong></div>
              <div>الوحدات: <strong className="text-foreground">{selectedModules.length} مفعلة</strong></div>
              <div>الخطة: <strong className="text-foreground uppercase font-mono">{plan}</strong></div>
              <div>المدة: <strong className="text-foreground">{trialDays} يوماً</strong></div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep(5)} className="text-xs h-8 gap-1.5">
              <ArrowRight className="size-3.5" />
              السابق
            </Button>
            <Button
              size="sm"
              disabled={!ownerUsername.trim() || !ownerPassword.trim() || !ownerFullName.trim()}
              onClick={handleStartProvisioning}
              className="text-xs h-8 gap-1.5 font-bold bg-primary text-primary-foreground shadow-xs"
            >
              <Wand2 className="size-3.5" />
              بدء التأسيس الآلي الفوري
            </Button>
          </div>
        </div>
      )}

      {/* Step 7: Live Provisioning Execution Progress */}
      {provisioning && (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6 text-center">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            {provisionProgress === 100 ? (
              <CheckCircle2 className="size-8 text-emerald-500 animate-bounce" />
            ) : (
              <FolderSync className="size-8 animate-spin" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              {provisionProgress === 100 ? "تم تأسيس وتفعيل المنشأة بنجاح!" : "جارٍ تشغيل محرك التأسيس الآلي..."}
            </h2>
            <p className="text-xs text-muted-foreground">{provisionStepText}</p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-1.5">
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${provisionProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>{provisionProgress}% Completed</span>
              <span>100% Target</span>
            </div>
          </div>

          {provisionProgress === 100 && provisionResult && (
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-center gap-3">
              <Button size="sm" asChild className="text-xs font-bold gap-1.5">
                <Link to={`/${slug}`} target="_blank">
                  <ExternalLink className="size-3.5" />
                  فتح نظام العميل المستقل (/{slug})
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="text-xs">
                <Link to={`/admoon/tenants/${provisionResult.tenant_id}`}>
                  إدارة تفاصيل المنشأة
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigate("/admoon/tenants")} className="text-xs">
                العودة لقائمة الشركات
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
