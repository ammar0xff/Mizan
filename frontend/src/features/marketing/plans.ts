export interface Plan {
  id: string;
  name: string;
  price_egp: number | null;
  popular?: boolean;
  tagline: string;
  features: string[];
}

/* Mirrors backend app/api/routers/platform.py PLANS */
export const PLANS: Plan[] = [
  {
    id: "basic", name: "أساسي", price_egp: 499,
    tagline: "ابدأ صح — فرع واحد جاهز للبيع",
    features: ["فرع واحد · 3 مستخدمين", "نقطة بيع + مخزون + مبيعات", "عملاء وموردون", "تقارير أساسية"],
  },
  {
    id: "pro", name: "احترافي", price_egp: 999, popular: true,
    tagline: "للمحلات اللي بتكبر — كل الميزات",
    features: ["حتى 3 فروع · 15 مستخدمًا", "كل ميزات أساسي", "مشتريات وذمم وخزائن", "تقارير متقدمة + تصدير"],
  },
  {
    id: "enterprise", name: "مؤسسي", price_egp: null,
    tagline: "سلاسل وفروع كثيرة",
    features: ["فروع ومستخدمون بلا حدود", "صلاحيات متقدمة", "أولوية دعم", "تهيئة وتدريب فريق العمل"],
  },
];

export const TRIAL_DAYS = 14;

export const SECTOR_OPTIONS = [
  { value: "retail", label: "تجارة وتجزئة ومستودعات", desc: "سوبرماركت، معارض، ومخازن تجارية" },
  { value: "restaurant", label: "مطاعم، كافيهات، وضيافة", desc: "إدارة صالة، طاولات، وشاشات مطبخ KDS" },
  { value: "school", label: "مدارس، مراكز تدريب، وأكاديميات", desc: "شؤون الطلاب، أقساط، وإيصالات رسوم" },
  { value: "services", label: "خدمات، مكاتب، ومقاولات", desc: "استشارات، عقود، ومتابعة مشاريع" },
  { value: "healthcare", label: "مراكز رعاية وصيدليات وعيادات", desc: "أدوية، مستلزمات، وسجلات فحص" },
  { value: "plumbing", label: "توريدات ومواد بناء وتشطيبات", desc: "سباكة، كهرباء، دهانات، وسيراميك" },
];

export const SCALE_OPTIONS = [
  { value: "small", label: "فرع واحد", desc: "محل واحد وفريق صغير" },
  { value: "medium", label: "٢–٣ فروع", desc: "أكثر من فرع ومخزن" },
  { value: "large", label: "٤ فروع وأكثر", desc: "سلسلة وفروع متعددة" },
];

export const PALETTE_OPTIONS = [
  { value: "slate", hue: 240, label: "سليت متوازن (Neutral SaaS)", desc: "مظهر حيادي راقٍ يعتمد على الحدود الدقيقة والتباين الصريح", swatch: "oklch(0.42 0.02 250)" },
  { value: "cobalt", hue: 250, label: "أزرق مؤسسي (Enterprise Cobalt)", desc: "نمط أنظمة تخطيط الموارد الكبرى (SAP / Oracle) ذو طابع رسمي", swatch: "oklch(0.45 0.16 250)" },
  { value: "emerald", hue: 155, label: "زمردي مالي (Emerald Ledger)", desc: "مثالي للدفاتر المالية، التدقيق المحاسبي، وإدارة الخزائن", swatch: "oklch(0.48 0.14 155)" },
  { value: "amber", hue: 75, label: "عنبري دافئ (Warm POS & Food)", desc: "مخصص للمطاعم والكافيهات ونقاط البيع السريعة لراحة العين", swatch: "oklch(0.58 0.16 75)" },
  { value: "monokai", hue: 255, label: "تباين داكن فائق (Terminal Contrast)", desc: "تباين بصري حاد وسواد عميق لشاشات الكاشير والمستودعات", swatch: "oklch(0.2 0.01 255)" },
];

export const FEATURE_OPTIONS = [
  { value: "pos", label: "نقطة بيع سريعة (POS)", desc: "باركود، اختصارات كيبورد، وفواتير لحظية" },
  { value: "restaurant", label: "إدارة الصالة والمطبخ (Dine-in)", desc: "توزيع الطاولات وشاشة المطبخ KDS" },
  { value: "school", label: "شؤون الطلاب والأقساط", desc: "سجلات الدارسين وسداد المصروفات المدرسية" },
  { value: "inventory", label: "المخزون والتوريد", desc: "حد الطلب، التحويلات بين الفروع، والجرد" },
  { value: "finance", label: "الخزائن والمالية", desc: "حسابات البنوك، محافظ الدفع، والتدفقات" },
  { value: "hr", label: "الموظفون والرواتب", desc: "الورديات، الحضور، ومسيرات الأجور" },
];
