export interface Plan {
  id: string;
  name: string;
  price_egp: number;
  price_annual_egp: number;
  popular?: boolean;
  tagline: string;
  maxUsers: number;
  maxStorageMb: number;
  features: string[];
  recommendedFor: string;
}

/* Canonical SaaS plans aligned with Admoon control plane and platform API */
export const PLANS: Plan[] = [
  {
    id: "trial",
    name: "الباقة التجريبية (Trial)",
    price_egp: 0,
    price_annual_egp: 0,
    tagline: "تجربة سحابية كاملة لمدة 14 يوماً بلا بطاقة دفع",
    maxUsers: 3,
    maxStorageMb: 2048,
    recommendedFor: "استكشاف إمكانيات المنصة وتجربة الكوليكشن التجاري",
    features: [
      "نقطة بيع سريعة POS + فواتير فورية",
      "إدارة المخزون والموردين والعملاء",
      "تقارير مبيعات وورديات يومية",
      "دعم فني عبر البريد وتحديثات سحابية",
    ],
  },
  {
    id: "starter",
    name: "باقة البداية (Starter)",
    price_egp: 450,
    price_annual_egp: 4500,
    tagline: "للمتاجر والمنشآت الناشئة — فرع واحد متكامل",
    maxUsers: 5,
    maxStorageMb: 5120,
    recommendedFor: "المحلات الفردية، الكافيهات الصغيرة، والمكاتب الخدمية",
    features: [
      "حتى 5 مستخدمين بصلاحيات دورية محددة",
      "كافة مزايا نقاط البيع وإدارة المستودع",
      "محرك طباعة إيصالات حرارية 80mm/58mm",
      "أرشفة سحابية وتنبيهات نواقص المخزون",
      "شاشات مطبخ KDS أو ماسح باركود سريع",
    ],
  },
  {
    id: "pro",
    name: "باقة المحترفين (Pro)",
    price_egp: 850,
    price_annual_egp: 8500,
    popular: true,
    tagline: "الأكثر طلباً — صالات الجيم، المطاعم، والمراكز المتقدمة",
    maxUsers: 15,
    maxStorageMb: 20480,
    recommendedFor: "صالات اللياقة، سلاسل المطاعم، والمراكز التعليمية والطبية",
    features: [
      "حتى 3 فروع و15 مستخدماً متزامناً",
      "كافة كوليكشنات الأنشطة (نوادي، مطاعم، مدارس، عيادات)",
      "قاعدة بيانات سحابية مستقلة (Neon Postgres)",
      "إدارة الرواتب والموظفين HR والورديات",
      "نسخ احتياطي يومي مشفر تلقائي",
      "دعم فني مباشر على مدار الساعة",
    ],
  },
  {
    id: "enterprise",
    name: "باقة المؤسسات (Enterprise)",
    price_egp: 1950,
    price_annual_egp: 19500,
    tagline: "لسلاسل الأعمال الكبرى والمشاريع متعددة الفروع والبيئات",
    maxUsers: 50,
    maxStorageMb: 102400,
    recommendedFor: "الشركات الكبرى وسلاسل الفروع ذات المتطلبات الرقابية",
    features: [
      "فروع ومستخدمون غير محدودين",
      "خادم VPS مخصص مع عزل أمني فائق",
      "ترخيص نسخة سطح مكتب أوفلاين (.exe) بلا إنترنت",
      "نطاق مخصص وشهادة SSL خاصة (Custom Domain)",
      "تخزين سحابي S3 غير محدود للأرشفة والوثائق",
      "مدير حساب تقني ودعم مخصص للأجهزة والعتاد",
    ],
  },
];

export const TRIAL_DAYS = 14;

export const SECTOR_OPTIONS = [
  { value: "gym", label: "أندية وصالات رياضية (Gym & Fitness)", desc: "اشتراكات، بوابات دخول ذكية، حصص تدريب شخصي، وكافيتيريا Gym-POS" },
  { value: "restaurant", label: "مطاعم، كافيهات، وضيافة", desc: "إدارة صالة، طاولات، وشاشات مطبخ KDS تفاعلية وRestaurant-POS" },
  { value: "retail", label: "تجارة، تجزئة، وسوبرماركت", desc: "سوبرماركت، معارض، ومخازن تجارية وRetail-POS مع موازين وباركود" },
  { value: "school", label: "مدارس، مراكز تدريب، وأكاديميات", desc: "شؤون الطلاب، أقساط، وإيصالات رسوم مدرسية وحافلات نقل" },
  { value: "healthcare", label: "مراكز رعاية وصيدليات وعيادات", desc: "أدوية، مستلزمات، ملفات فحص، مواعيد أطباء، وروشتات" },
  { value: "services", label: "خدمات، مكاتب، ومقاولات", desc: "استشارات، عقود، فواتير مشاريع، وتتبع تكاليف ميدانية" },
  { value: "plumbing", label: "توريدات ومواد بناء وتشطيبات", desc: "سباكة، كهرباء، دهانات، ومواد إنشائية ومعارض تجارية" },
];

export const SCALE_OPTIONS = [
  { value: "small", label: "فرع واحد", desc: "محل واحد وفريق صغير" },
  { value: "medium", label: "٢–٣ فروع", desc: "أكثر من فرع ومستودع مركزي" },
  { value: "large", label: "٤ فروع وأكثر", desc: "سلسلة وفروع موزعة" },
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

export const DEPLOYMENT_MODES = [
  {
    id: "saas",
    name: "سحابي بالكامل (Cloud SaaS)",
    tagline: "جاهز فوراً في المتصفح مع استضافة مدارة وتحديثات آلية",
    badge: "الأكثر مرونة",
    bullets: [
      "تشغيل فوري عبر متصفح الويب من أي جهاز",
      "نسخ احتياطي يومي مشفر وتلقائي",
      "شهادة أمان SSL ونطاق فرعي مخصص للمنشأة",
      "قواعد بيانات متدرجة التوسع (Neon / PostgreSQL)",
    ],
  },
  {
    id: "offline",
    name: "مكتبي مستقل أوفلاين (Standalone .exe)",
    tagline: "يعمل على حاسوب واحد بدون إنترنت نهائياً مع ترخيص محمي",
    badge: "دون اتصال نهائياً",
    bullets: [
      "لا يشترط وجود اتصال بالإنترنت للتشغيل والبيع",
      "قاعدة بيانات SQLite محلية مدمجة وسريعة",
      "ترخيص رقمي مشفر بـ HMAC-SHA256 مقيد بالجهاز",
      "مثالي للمناطق النائية أو الفروع ذات الاتصال غير المستقر",
    ],
  },
  {
    id: "lan",
    name: "شبكة محلية داخلية (LAN Deployment)",
    tagline: "خادم محلي يربط كافة أجهزة الكاشير والمكاتب داخل المنشأة",
    badge: "سرعة فائقة بالموقع",
    bullets: [
      "مزامنة لحظية بين عدة نقاط بيع على الراوتر المحلي",
      "قاعدة بيانات مركزية محلية (PostgreSQL أو MySQL)",
      "استقلالية تامة عن سرعة الإنترنت الخارجي",
      "طباعة فورية على طابعات الشبكة المحلية بدون تأخير",
    ],
  },
  {
    id: "vps",
    name: "خادم سحابي خاص (Dedicated VPS)",
    tagline: "بيئة استضافة خاصة ومستقلة بالكامل لشركتك وسلاسل فروعك",
    badge: "سيادة وأمان فائق",
    bullets: [
      "عزل بنية تحتية كامل مع خادم مخصص للشركة",
      "ربط نطاق مخصص رسمي (erp.yourdomain.com)",
      "موارد حوسبة وتخزين مخصصة غير مشتركة",
      "تحكم كامل في مواعيد التحديث والنسخ الاحتياطي",
    ],
  },
];
