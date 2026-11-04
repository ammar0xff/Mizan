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
  // Phase 1: Core Business Systems
  { value: "retail", label: "تجارة، تجزئة، وسوبرماركت (Retail)", desc: "سوبرماركت، معارض، ومخازن تجارية وRetail-POS مع موازين وباركود" },
  { value: "restaurant", label: "مطاعم، كافيهات، وضيافة (Restaurant)", desc: "إدارة صالة، طاولات، وشاشات مطبخ KDS تفاعلية وRestaurant-POS" },
  { value: "pharmacy", label: "صيدليات ومستلزمات طبية (Pharmacy)", desc: "دواء، تشغيلات، تواريخ صلاحية، رقابة صرف وتأمين صحي" },
  { value: "consulting", label: "مكاتب محاسبة واستشارات (Consulting)", desc: "ساعات قابلة للفوترة، خطابات تكليف، عقود، وتقارير أرباح المشروعات" },
  { value: "school", label: "مدارس ومعاهد تدريب وأكاديميات (School)", desc: "شؤون الطلاب، أقساط، وإيصالات رسوم مدرسية وحافلات نقل" },
  
  // Phase 2: Distribution and Logistics
  { value: "wholesale", label: "تجارة جملة وتوزيع وتوريدات (Wholesale)", desc: "أسعار كميات، قوائم أسعار عملاء، تسعير حسب الحجم والخصومات" },
  { value: "logistics", label: "نقل، شحن، وخدمات لوجستية (Logistics)", desc: "بوالص شحن، تتبع مسارات، إدارة أساطيل، وتكاليف وقود" },
  { value: "wms_3pl", label: "مستودعات وخدمات لوجستية للغير (3PL WMS)", desc: "مستودعات متعددة العملاء، استلام، وتوزيع حسب مواقع التخزين" },
  { value: "ecommerce", label: "تجارة إلكترونية ومتاجر رقمية (E-commerce)", desc: "ربط المتاجر، مزامنة المخزون اللحظية، وتجهيز الشحنات" },
  
  // Phase 3: Service-Based Systems
  { value: "healthcare", label: "عيادات ومراكز طبية ومستشفيات (Healthcare)", desc: "ملفات مرضى، حجز مواعيد، روشتات، وفواتير تأمين طبي" },
  { value: "law_firm", label: "مكاتب ومؤسسات المحاماة (Law Firm)", desc: "إدارة القضايا، مواعيد الجلسات، وسجلات أموال العملاء وحسابات الأمانة" },
  { value: "travel", label: "وكالات السياحة والسفر (Travel Agency)", desc: "برامج سياحية، حجوزات طيران وفنادق، وفواتير موحدة للمجموعات" },
  { value: "hotel", label: "فنادق، منتجعات، وضيافة (Hotels & Resorts)", desc: "حجوزات، غرف، فواتير إقامة، وتدقيق ليلي ومطاعم فندقية" },
  { value: "gym", label: "أندية وصالات رياضية ولياقة بدنية (Gym)", desc: "اشتراكات، بوابات دخول ذكية، حصص تدريب شخصي، وكافيتيريا Gym-POS" },
  { value: "salon", label: "صالونات تجميل ومراكز سبا (Salon & Spa)", desc: "مواعيد مصففين، باقات خدمات، وعمولات موظفين ومستهلكات" },
  { value: "agency", label: "وكالات دعاية وتصميم وترجمة (Creative Agency)", desc: "إدارة ملخصات العملاء، مهام، مراجعة تصاميم، وفواتير مشروعات" },
  { value: "field_service", label: "صيانة وخدمات ميدانية وتشغيل (Field Service)", desc: "أوامر شغل، توجيه فنيين، قطع غيار متنقلة، وتوقيعات عملاء" },

  // Phase 4: Manufacturing and Production
  { value: "discrete_mfg", label: "تصنيع وتجميع ميكانيكي وإلكتروني (Manufacturing)", desc: "شجرة منتج BOM، مراكز تشغيل، تخطيط مواد MRP، وتكاليف إنتاج" },
  { value: "food_mfg", label: "تصنيع ومعالجة أغذية ومشروبات (Food Mfg)", desc: "وصفات وخلطات، تتبع تشغيلات، صلاحيات، ورقابة سلامة الغذاء" },
  { value: "pharma_mfg", label: "صناعات دوائية وكيميائية (Pharma Mfg)", desc: "سجلات تشغيل إلكترونية، معايير GMP، ورقابة جودة وتتبع حرج" },
  { value: "printing", label: "مطابع، تغليف، وتعبئة (Print & Packaging)", desc: "تذاكر تشغيل، مونتاج، استهلاك أحبار وورق، وهالك تجهيز" },

  // Phase 5: Projects and Infrastructure
  { value: "construction", label: "مقاولات عامة وتشييد (Construction)", desc: "مقايسات BOQ، مستخلصات، مقاولو باطن، ومعدات ثقيلة" },
  { value: "real_estate", label: "إدارة عقارات ومجمعات تجارية (Real Estate)", desc: "وحدات، عقود إيجار، تحصيل شيكات، وصيانة وإيرادات صافية" },
  { value: "agriculture", label: "مزارع وإنتاج زراعي وحيواني (Agriculture)", desc: "أحواض زراعية، دورات محصولية، أسمدة، وتتبع محاصيل وثروة حيوانية" },
  { value: "energy", label: "محطات طاقة وتوليد ومرافق (Energy & Utilities)", desc: "أصول، صيانة تنبؤية، قراءات عدادات، وتصاريح عمل وأمان بيئي" },

  // Phase 6: Specialized Systems
  { value: "banking", label: "بنوك ومؤسسات تمويل وإقراض (Banking & Microfinance)", desc: "محرك قيود مزدوجة لحظي، قروض، فوائد، ومراقبة غسيل أموال" },
  { value: "insurance", label: "شركات تأمين وتكافل (Insurance)", desc: "وثائق، تسعير اكتواري، مطالبات، واحتياطيات فنية وإعادة تأمين" },
  { value: "government", label: "جهات حكومية وجمعيات غير ربحية (Gov & Nonprofits)", desc: "محاسبة صناديق، موازنات ومخصصات، مناقصات، ومساعدات مستفيدين" },
  { value: "entertainment", label: "فعاليات ومدن ترفيهية وألعاب (Entertainment)", desc: "تذاكر، بوابات دخول، بطاقات ألعاب، وتوزيع إيرادات فعاليات" },
  { value: "oil_gas", label: "عمليات بترول وغاز وتكرير (Oil & Gas)", desc: "آبار، إنتاج يومي، محاسبة مشاركات نفطية، وأمان تشغيلي" },

  // Legacy aliases
  { value: "services", label: "خدمات عامة، مكاتب، ومقاولات", desc: "استشارات، عقود، فواتير مشاريع، وتتبع تكاليف ميدانية" },
  { value: "plumbing", label: "توريدات ومواد بناء وتشطيبات", desc: "سباكة، كهرباء، دهانات، ومواد إنشائية ومعارض تجارية" },
];

export const SCALE_OPTIONS = [
  { value: "small", label: "فرع واحد", desc: "محل واحد وفريق صغير" },
  { value: "medium", label: "٢–٣ فروع", desc: "أكثر من فرع ومستودع مركزي" },
  { value: "large", label: "٤ فروع وأكثر", desc: "سلسلة وفروع موزعة" },
];

export const PALETTE_OPTIONS = [
  { value: "mizan", hue: 350, label: "ميزان الفاخر (Warm Editorial Luxury)", desc: "الهوية الرسمية الفاخرة لمنظومة ميزان — درجات العنابي الملكي والأكس بلود وخلفية العاج الدافئ", swatch: "#651E2C" },
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
