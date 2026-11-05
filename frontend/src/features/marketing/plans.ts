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

export interface SectorModuleItem {
  id: string;
  label: string;
  desc: string;
  badge?: string;
  defaultChecked?: boolean;
}

export const SECTOR_PRIMARY_ROUTES: Record<string, string> = {
  healthcare: "/clinic",
  restaurant: "/restaurant/tables",
  pharmacy: "/pharmacy",
  school: "/school/students",
  law_firm: "/law",
  travel: "/travel",
  hotel: "/hospitality",
  gym: "/gym",
  salon: "/salon",
  consulting: "/services",
  services: "/services",
  agency: "/agency",
  field_service: "/field-service",
  wholesale: "/wholesale",
  logistics: "/logistics",
  wms_3pl: "/wms",
  ecommerce: "/ecommerce",
  construction: "/cst",
  real_estate: "/rec",
  discrete_mfg: "/mfg",
  food_mfg: "/fod",
  pharma_mfg: "/phm",
  printing: "/prn",
  agriculture: "/agr",
  energy: "/eng",
  banking: "/bnk",
  insurance: "/ins",
  government: "/gov",
  entertainment: "/ent",
  oil_gas: "/oil",
  retail: "/pos",
  plumbing: "/pos",
};

export const SECTOR_MODULES_MAP: Record<string, SectorModuleItem[]> = {
  healthcare: [
    { id: "clinic", label: "ملفات المرضى والتاريخ الطبي (EHR)", desc: "الملفات الطبية الرقمية، التاريخ المرضي، الحساسيات والأمراض المزمنة", badge: "أساسي", defaultChecked: true },
    { id: "appointments", label: "حجز المواعيد وأرتال الانتظار", desc: "جدولة كشوفات الأطباء، تنظيم شاشات وغرف الانتظار وتذاكر الدور", badge: "أساسي", defaultChecked: true },
    { id: "prescriptions", label: "الروشتات الطبية الإلكترونية (e-Rx)", desc: "كتابة الوصفات والجرعات والتداخلات وإرسالها إلكترونياً للصيدلية", badge: "طبي", defaultChecked: true },
    { id: "insurance_claims", label: "فواتير ومطالبات التأمين الصحي", desc: "حساب نسب التحمل Copay، بوالص التأمين والمطالبات الشهرية", badge: "تأمين", defaultChecked: true },
    { id: "lab_orders", label: "المختبرات والتحاليل الطبية", desc: "طلبات التحاليل السريرية، الباركودات المعملية، وإرفاق نتائج الفحص", badge: "تشخيص", defaultChecked: true },
    { id: "inpatient_beds", label: "إدارة الأسرّة وغرف التنويم (Beds)", desc: "تسكين المرضى، أجنحة الرعاية الفائقة ICU، وتتبع نسب الإشغال", badge: "تنويم", defaultChecked: true },
    { id: "pharmacy", label: "صيدلية المجمع والمستلزمات", desc: "صرف الروشتات، تتبع الصلاحيات، ومخزون الأدوية والمستهلكات الطبية", badge: "صيدلية", defaultChecked: true },
    { id: "finance", label: "الخزائن والمالية الطبية", desc: "رسوم الكشوفات، إيرادات العيادات وسندات القبض وحسابات الأطباء", badge: "مالية", defaultChecked: true },
  ],
  restaurant: [
    { id: "restaurant", label: "إدارة الصالة والطاولات التفاعلية", desc: "خريطة الطاولات اللحظية، نقل وحجز الطاولات، وتقسيم الفواتير", badge: "صالة", defaultChecked: true },
    { id: "kitchen_kds", label: "شاشات المطبخ الذكية (KDS)", desc: "وصول الطلبات اللحظي لرؤساء الأقسام، مؤقتات الطهي، وتنبيه الجاهزية", badge: "مطبخ", defaultChecked: true },
    { id: "pos", label: "كاشير ونقطة بيع المطاعم السريعة", desc: "فواتير لمسية سريعة، تعديلات الوجبات (Modifiers)، وخدمة التوصيل", badge: "كاشير", defaultChecked: true },
    { id: "recipe_bom", label: "شجرة الوصفات وحسم المكونات (BOM)", desc: "استهلاك المواد الخام من المستودع مع كل وجبة لمراقبة الهالك بدقة", badge: "تكاليف", defaultChecked: true },
    { id: "inventory", label: "مخزن الأغذية والمشروبات (F&B)", desc: "تتبع صلاحيات اللحوم والخضار، التوريد الدوري، وتنبيهات النواقص", badge: "مخزون", defaultChecked: true },
    { id: "finance", label: "تقفيل الوردية اليومية (Z-Report)", desc: "مطابقة درج النقدية، محافظ الدفع وتطبيقات التوصيل (طلبات/هنقرستيشن)", badge: "مالية", defaultChecked: true },
  ],
  pharmacy: [
    { id: "pharmacy", label: "صرف الروشتات والتأمين الطبي", desc: "صرف الوصفات، تدقيق الجرعات، واحتساب نسب تحمل شركات التأمين", badge: "صرف", defaultChecked: true },
    { id: "fefo_expiry", label: "تتبع الصلاحيات والتشغيلات (FEFO)", desc: "تنبيهات للأدوية قريبة الانتهاء، وأرقام التشغيلات Batch Numbers", badge: "صلاحية", defaultChecked: true },
    { id: "inn_alternatives", label: "دليل البدائل التكافؤية (INN)", desc: "البحث الفوري عن البدائل بالاسم العلمي والمادة الفعالة وسعر الجمهور", badge: "بدائل", defaultChecked: true },
    { id: "pos", label: "كاشير الصيدلية السريع والباركود", desc: "باركود دولي ومحلي، فواتير فورية، وإمكانية بيع بالأشرطة والعبوات", badge: "كاشير", defaultChecked: true },
    { id: "inventory", label: "مخزون المستودع الدوائي", desc: "حد إعادة الطلب مع شركات التوزيع ومتابعة نواقص السوق ومبيعات الأدوية", badge: "مخزون", defaultChecked: true },
    { id: "finance", label: "الخزائن ومطالبات شركات التأمين", desc: "كشوف حسابات الموردين، شركات التأمين الصحي، ومسيرات التحصيل", badge: "مالية", defaultChecked: true },
  ],
  school: [
    { id: "school", label: "شؤون الطلاب وسجلات القيد", desc: "ملفات الدارسين، المراحل الدراسية، الفصول، والشهادات والبيانات الأكاديمية", badge: "طلاب", defaultChecked: true },
    { id: "tuition_fees", label: "تحصيل الأقساط والمصروفات المدرسية", desc: "أقساط مجدولة، تنبيهات السداد التلقائية لأولياء الأمور، وإيصالات القبض", badge: "أقساط", defaultChecked: true },
    { id: "school_buses", label: "حافلات النقل المدرسي وخطوط السير", desc: "اشتراكات النقل، خطوط السير، توزيع الحافلات والمشرفين والسائقين", badge: "نقل", defaultChecked: true },
    { id: "hr", label: "حضور الطلاب ورواتب المعلمين", desc: "دفاتر الغياب اليومية، رواتب الكادر التعليمي والإداري، والمكافآت", badge: "رواتب", defaultChecked: true },
    { id: "finance", label: "الحسابات والموازنة المدرسية", desc: "الحسابات البنكية، رسوم الأنشطة، والمصروفات التشغيلية والمشتريات", badge: "مالية", defaultChecked: true },
  ],
  law_firm: [
    { id: "law", label: "إدارة القضايا والملفات القضائية", desc: "أرقام الدوائر، الرول، درجات التقاضي، وتاريخ الجلسات ومذكرات الدفاع", badge: "قضايا", defaultChecked: true },
    { id: "court_sessions", label: "أجندة المحاكم ومواعيد الطعون", desc: "تقويم الجلسات، تنبيهات مواعيد النقض والاستئناف وسقوط الحق القانوني", badge: "أجندة", defaultChecked: true },
    { id: "client_trust", label: "حسابات أمانات الموكلين المفرزة (IOLTA)", desc: "إدارة أموال القضايا المفصولة تماماً عن إيراد المكتب طبقاً لأصول المهنة", badge: "أمانات", defaultChecked: true },
    { id: "billable_hours", label: "ساعات العمل الاستشارية والفوترة", desc: "تسجيل الساعات المصروفة على كل قضية وإصدار فواتير الأتعاب المهنية", badge: "فوترة", defaultChecked: true },
    { id: "finance", label: "المالية وعقود الأتعاب القضائية", desc: "دفعات الأتعاب، رسوم المحاكم، والمصروفات المستردة من الموكلين", badge: "مالية", defaultChecked: true },
  ],
  gym: [
    { id: "gym", label: "إدارة العضويات والاشتراكات", desc: "اشتراكات شهرية وسنوية، تجميد العضوية (Freeze)، وتجديد الباقات", badge: "عضويات", defaultChecked: true },
    { id: "access_gates", label: "بوابات الدخول الذكية (Turnstiles)", desc: "التحقق من سريان العضوية ببطاقات RFID/QR ومراقبة سعة الصالة", badge: "بوابات", defaultChecked: true },
    { id: "personal_training", label: "حصص التدريب الخاص (PT)", desc: "حجز المدربين، حصص التدريب الفردي، ونسب عمولات المدربين", badge: "تدريب", defaultChecked: true },
    { id: "inbody", label: "قياسات InBody والتقييم البدني", desc: "تسجيل نسب الدهون والعضلات وتطور المتدرب عبر الزمن", badge: "قياسات", defaultChecked: true },
    { id: "pos", label: "كافيتيريا ومكملات الجيم (Pro-Shop)", desc: "بيع المشروبات الصحية والمكملات الغذائية والبروتين شيك", badge: "كاشير", defaultChecked: true },
    { id: "finance", label: "الخزائن والاشتراكات والتقسيط", desc: "الإيرادات اليومية، اشتراكات التقسيط، وسندات الصرف والرواتب", badge: "مالية", defaultChecked: true },
  ],
  salon: [
    { id: "salon", label: "أجندة المواعيد وخدمات السبا", desc: "حجز المصففين وأخصائيي البشرة، تنظيم أوقات الانتظار وجداول الخدمات", badge: "مواعيد", defaultChecked: true },
    { id: "staff_commissions", label: "عمولات المصففين وفرق العمل", desc: "احتساب عمولات كل خدمة ومنتج تلقائياً مع كل فاتورة وإكراميات Tips", badge: "عمولات", defaultChecked: true },
    { id: "color_formulas", label: "سجلات تركيبات الصبغة والعملاء", desc: "حفظ درجات صبغة الشعر والعلاجات المفضلة وتاريخ كل عميلة", badge: "تخصيص", defaultChecked: true },
    { id: "inventory", label: "استهلاك مستحضرات التجميل والمواد الخام", desc: "تتبع استهلاك الشامبوهات والزيوت والصبغات من المستودع بالجرام", badge: "مخزون", defaultChecked: true },
    { id: "pos", label: "كاشير الصالون وبيع المنتجات", desc: "فواتير فورية للخدمات والمنتجات المنزلية وباقات الهدايا", badge: "كاشير", defaultChecked: true },
    { id: "finance", label: "الخزينة والمالية والوردية اليومية", desc: "تقفيل الصندوق، توزيع العمولات، ومصروفات الصالون التشغيلية", badge: "مالية", defaultChecked: true },
  ],
  hotel: [
    { id: "hospitality", label: "نظام إدارة الغرف والتسكين (Hotel PMS)", desc: "خريطة الغرف التفاعلية، تسكين ومغادرة النزلاء (Check-in/Check-out)", badge: "غرف", defaultChecked: true },
    { id: "guest_folios", label: "فواتير النزلاء الموحدة (Folio)", desc: "تحميل مصاريف المطعم والمغسلة والميني بار تلقائياً على فاتورة الغرفة", badge: "فواتير", defaultChecked: true },
    { id: "housekeeping", label: "التدبير المنزلي ونظافة الغرف", desc: "تحديث حالة الغرف الفورية (شاغرة، نظيفة، قيد التنظيف، صيانة)", badge: "نظافة", defaultChecked: true },
    { id: "night_audit", label: "التدقيق الليلي ومؤشرات الإشغال", desc: "إغلاق اليومية الفندقية آلياً، واحتساب متوسط سعر الغرفة ADR ونسب RevPAR", badge: "تدقيق", defaultChecked: true },
    { id: "restaurant", label: "مطاعم وبوفيهات الفندق (F&B)", desc: "نقاط بيع بوفيه الإفطار وخدمة الغرف Room Service والطلبات الخارجية", badge: "مطاعم", defaultChecked: true },
    { id: "finance", label: "خزينة الفندق وحجوزات الشركات", desc: "عقود شركات السياحة، الدفعات المقدمة، وحسابات الوكالات", badge: "مالية", defaultChecked: true },
  ],
  travel: [
    { id: "travel", label: "بناء وتصميم البرامج السياحية", desc: "جداول الرحلات، البرامج الشاملة، تفاصيل المزارات والإقامة", badge: "برامج", defaultChecked: true },
    { id: "flight_hotel", label: "حجوزات الطيران والفنادق ومنافست الركاب", desc: "إدارة التذاكر، حجوزات المجموعات، وقوائم المسافرين وجداول الرحلات", badge: "حجوزات", defaultChecked: true },
    { id: "commissions", label: "محرك العمولات وهوامش الربح", desc: "احتساب هوامش الربح مع خطوط الطيران والفنادق وشركات النقل", badge: "عمولات", defaultChecked: true },
    { id: "passports_vault", label: "خزينة التأشيرات والجوازات", desc: "تتبع مواعيد تجديد التأشيرات ووثائق السفر وباركود الجوازات", badge: "جوازات", defaultChecked: true },
    { id: "finance", label: "حسابات العملاء والشركات السياحية", desc: "الدفعات المقدمة، الفواتير المجمعة، وتقارير أرباح الأفواج", badge: "مالية", defaultChecked: true },
  ],
  wholesale: [
    { id: "wholesale", label: "سلالم الأسعار وقوائم أسعار العملاء", desc: "تسعير حسب الكميات، وفئات العملاء (VIP / جملة / موزع معتمد)", badge: "تسعير", defaultChecked: true },
    { id: "credit_limits", label: "سقوف الائتمان وفترات السماح", desc: "ضبط حد مديونية العميل وأيام السداد وحظر البيع الآلي عند التجاوز", badge: "ائتمان", defaultChecked: true },
    { id: "sales_reps", label: "مندوبو التوزيع ومبيعات سيارات الفان", desc: "خطوط سير المناديب، جرد سيارات التوزيع وعمولات التحصيل والبيع", badge: "توزيع", defaultChecked: true },
    { id: "inventory", label: "المستودعات والتحويلات المركزية", desc: "حركات المخزن، كشوف الجرد، وأوامر الشراء والتوريد الكبرى", badge: "مستودعات", defaultChecked: true },
    { id: "finance", label: "الحسابات وأوراق القبض والشيكات", desc: "تحصيل الشيكات الآجلة، كشوف حسابات العملاء والموردين والذمم", badge: "شيكات", defaultChecked: true },
  ],
  logistics: [
    { id: "logistics", label: "بوالص الشحن وتتبع الشحنات (AWB/BoL)", desc: "دورة حياة الشحنة من الاستلام والتجميع وحتى محطة الوصول والتسليم", badge: "بوالص", defaultChecked: true },
    { id: "fleet_vehicles", label: "إدارة أسطول الشاحنات والمركبات", desc: "تتبع المسارات، الفحص الدوري للمركبات، وتكاليف الوقود والصيانة", badge: "أسطول", defaultChecked: true },
    { id: "e_pod", label: "إثبات التسليم الرقمي والتوقيعات (e-POD)", desc: "توقيع العميل الإلكتروني على جهاز السائق وصور الشحنة عند الاستلام", badge: "تسليم", defaultChecked: true },
    { id: "finance", label: "تكاليف الشحن ومطالبات العملاء", desc: "فواتير النقل، حسابات السائقين والمنقولات ومصروفات الطرق والرسوم", badge: "مالية", defaultChecked: true },
  ],
  wms_3pl: [
    { id: "wms", label: "مستودعات العملاء المتعددين (3PL)", desc: "عزل ملكيات المخزون وتخصيص المساحات التخزينية لكل عميل مستودع", badge: "تخزين", defaultChecked: true },
    { id: "bin_locations", label: "المواقع التخزينية المرمزة (Bin Locations)", desc: "ترميز الممرات والرفوف لسرعة الوصول والتخزين الموجه", badge: "ترميز", defaultChecked: true },
    { id: "pick_pack", label: "موجات الجمع والانتقاء والعبور السريع", desc: "خطوط تجميع الطلبات والشحن الفوري Cross-Docking", badge: "مناولة", defaultChecked: true },
    { id: "inventory", label: "تسويات الجرد والفوترة الشهرية للمساحات", desc: "احتساب رسوم التخزين الشهرية آلياً حسب البالتات والمساحة المشغولة", badge: "مخزون", defaultChecked: true },
    { id: "finance", label: "فواتير التخزين واللوجستيات", desc: "فواتير خدمات المناولة والشحن للغير وكشوف حسابات عملاء التخزين", badge: "مالية", defaultChecked: true },
  ],
  ecommerce: [
    { id: "ecommerce", label: "ربط منصات المتاجر الرقمية", desc: "مزامنة المنتجات والطلبات اللحظية مع ووكومرس، سلة، وزد وشوبيفاي", badge: "مزامنة", defaultChecked: true },
    { id: "inventory", label: "مخزون الأمان ومزامنة المستودعات", desc: "حماية من البيع الزائد (Overselling) وتوزيع الكميات على القنوات", badge: "مخزون", defaultChecked: true },
    { id: "fulfillment", label: "خط سير تجهيز الشحنات وبوالص الشحن", desc: "طباعة بوالص الشحن والتجهيز Pick-Pack-Ship وتعيين شركات الشحن", badge: "تجهيز", defaultChecked: true },
    { id: "cod_reconciliation", label: "تسوية الدفع عند الاستلام وبوابات الدفع", desc: "مطابقة أموال شركات الشحن وبوابات الدفع الإلكتروني والمرتجعات", badge: "تسوية", defaultChecked: true },
    { id: "finance", label: "الإيرادات والأرباح الرقمية", desc: "تكاليف الشحن والعمولات وصافي الأرباح وتقارير المبيعات الرقمية", badge: "مالية", defaultChecked: true },
  ],
  construction: [
    { id: "cst", label: "مقايسات المشاريع وجداول الكميات (BOQ)", desc: "تفريغ البنود، الكميات التعاقدية، وتكلفة المواد والمصنعيات لكل بند", badge: "مقايسات", defaultChecked: true },
    { id: "progress_invoices", label: "المستخلصات الجارية والختامية", desc: "مستخلصات المالك، نسب الإنجاز الموقعي وتجنيب الدفعة المقدمة والضمان", badge: "مستخلصات", defaultChecked: true },
    { id: "subcontractors", label: "إدارة مقاولي الباطن والعهد الموقعية", desc: "مستخلصات مقاولي الباطن، كشوف حصر الأعمال، وعهد المهندسين بالموقع", badge: "باطن", defaultChecked: true },
    { id: "heavy_equipment", label: "المعدات الثقيلة والمخزن الموقعي", desc: "تتبع ساعات تشغيل الحفارات والمعدات وصرف الإسمنت والحديد للموقع", badge: "معدات", defaultChecked: true },
    { id: "finance", label: "تكاليف المشاريع والتدفقات النقدية", desc: "متابعة ربحية كل مشروع والمصروفات الموقعية والتدفقات النقدية", badge: "مالية", defaultChecked: true },
  ],
  real_estate: [
    { id: "rec", label: "إدارة الأبراج والمجمعات والوحدات", desc: "دليل الوحدات السكنية والتجارية، المساحات، وحالات الإيجار والشاغر", badge: "عقارات", defaultChecked: true },
    { id: "lease_contracts", label: "عقود الإيجار والتحصيل الدوري", desc: "تجديد العقود التلقائي، جداول الأقساط الشهرية والسنوية، وغرامات التأخير", badge: "عقود", defaultChecked: true },
    { id: "cheque_portfolio", label: "حافظة الشيكات وسندات الصرف", desc: "مواعيد استحقاق شيكات الإيجار والإيداع البنكي ومتابعة الشيكات المرتجعة", badge: "شيكات", defaultChecked: true },
    { id: "facility_maintenance", label: "بلاغات الصيانة وتذاكر المرافق", desc: "تذاكر صيانة المصاعد والسباكة والكهرباء وتوزيع التكاليف على الملاك", badge: "صيانة", defaultChecked: true },
    { id: "finance", label: "كشوف حسابات الملاك وصافي الإيراد", desc: "كشوف حسابات ملاك الأبراج وتوزيع صافي العوائد بعد خصم إدارة الأملاك", badge: "مالية", defaultChecked: true },
  ],
  discrete_mfg: [
    { id: "mfg", label: "شجرة المنتج ومسارات التصنيع (BOM)", desc: "تفريغ الخامات ومراحل التشغيل والفاقد المسموح لكل مرحلة صناعية", badge: "BOM", defaultChecked: true },
    { id: "work_orders", label: "أوامر الإنتاج وتذاكر التشغيل", desc: "متابعة خطوط التجميع، زمن الإنجاز الفعلي، ومخرجات الورديات الصناعية", badge: "تشغيل", defaultChecked: true },
    { id: "mrp_planning", label: "تخطيط متطلبات المواد (MRP)", desc: "حساب احتياجات الخامات بدقة لمنع توقف خط الإنتاج وتأخير التوريد", badge: "تخطيط", defaultChecked: true },
    { id: "inventory", label: "مستودعات الخامات والمنتج التام", desc: "تتبع أرصدة الخامات، حدود الطلب، وأذون الصرف للإنتاج والتسليم", badge: "مستودعات", defaultChecked: true },
    { id: "finance", label: "تكاليف التصنيع والأجور المباشرة", desc: "حساب تكلفة الإنتاج الفعلية وترحيل التكاليف الصناعية للدفاتر المالية", badge: "تكاليف", defaultChecked: true },
  ],
  food_mfg: [
    { id: "fod", label: "خلطات ووصفات التصنيع الغذائي", desc: "تتبع نسب المكونات، تشغيلات الطهي والخلط ومقاييس الجودة الغذائية", badge: "خلطات", defaultChecked: true },
    { id: "haccp_safety", label: "رقابة سلامة الغذاء ومعايير HACCP", desc: "نقاط التحكم الحرجة، درجات الحرارة وسجلات الفحص المخبري للغذاء", badge: "سلامة", defaultChecked: true },
    { id: "lot_tracking", label: "تتبع أرقام التشغيلات والصلاحيات", desc: "استدعاء دفعات الإنتاج وتتبع تواريخ الصلاحية وسلاسل التوريد", badge: "تشغيلات", defaultChecked: true },
    { id: "inventory", label: "مخازن التبريد والمواد الأولية", desc: "مراقبة درجات حرارة الثلاجات والمستودعات ونواقص التعبئة والتغليف", badge: "مخازن", defaultChecked: true },
    { id: "finance", label: "تكلفة الوجبات وخطوط التعبئة", desc: "حساب تكلفة الوحدة المنتجة والهالك الغذائي والأرباح الصناعية", badge: "مالية", defaultChecked: true },
  ],
  pharma_mfg: [
    { id: "phm", label: "سجلات التشغيل الإلكترونية (eBMR)", desc: "توثيق مراحل التصنيع الدوائي خطوة بخطوة وتوقيعات المشرفين الرقمية", badge: "eBMR", defaultChecked: true },
    { id: "gmp_compliance", label: "معايير ممارسات التصنيع الجيد (cGMP)", desc: "بيئات الغرف النظيفة، ضغط الهواء، والتوثيق الرقابي الصارم", badge: "cGMP", defaultChecked: true },
    { id: "quarantine_qc", label: "العزل والفحص المخبري والإفراج", desc: "سحب العينات واختبارات الجودة الكيميائية والبيولوجية والإفراج النهائي", badge: "رقابة", defaultChecked: true },
    { id: "inventory", label: "مستودعات المواد الفعالة والمذيبات", desc: "تتبع المواد المراقبة، شروط التخزين الدقيقة، وحدود الأمان", badge: "مستودع", defaultChecked: true },
    { id: "finance", label: "محاسبة التشغيلات الدوائية", desc: "تكاليف الفحوصات والإنتاج المعقم وترحيل تكلفة الدواء المسجل", badge: "مالية", defaultChecked: true },
  ],
  printing: [
    { id: "prn", label: "تذاكر التشغيل وأوامر الطباعة (Job Dockets)", desc: "مواصفات المطبوعات، المقاسات، الألوان والأفلام والزنكات", badge: "تذاكر", defaultChecked: true },
    { id: "yield_calculators", label: "حساب استهلاك الورق والمونتاج", desc: "استغلال الفراغات وحساب فاقد القص والتكسير لتقليل هالك الورق", badge: "حسابات", defaultChecked: true },
    { id: "ink_supplies", label: "استهلاك الأحبار ومواد التغليف", desc: "تتبع مخزون الأحبار والخامات والورق ومستلزمات التجليد والسلوفان", badge: "مخزون", defaultChecked: true },
    { id: "production_stages", label: "مراحل التشغيل (طباعة/سلوفان/تكسير)", desc: "متابعة إنجاز كل ماكينة ومرحلة وتسليم المنتج النهائي للتعبئة", badge: "إنتاج", defaultChecked: true },
    { id: "finance", label: "مقايسات الأسعار وفواتير العملاء", desc: "حساب تكلفة المتر والملزمة وهوامش الربح وإصدار فواتير المطابع", badge: "مالية", defaultChecked: true },
  ],
  agriculture: [
    { id: "agr", label: "أحواض المزارع والدورات المحصولية", desc: "تقسيم الأراضي، جداول الزراعة، فترات الري والحصاد الموسمي", badge: "محاصيل", defaultChecked: true },
    { id: "fertilizer_schedule", label: "جداول التسميد والمبيدات والري", desc: "تتبع استهلاك الأسمدة، جداول المكافحة وشبكات الري بالتنقيط", badge: "تسميد", defaultChecked: true },
    { id: "livestock", label: "سجلات الثروة الحيوانية والتحصينات", desc: "الرعاية البيطرية، سلالات المواشي، إنتاج الألبان والتغذية", badge: "بيطري", defaultChecked: true },
    { id: "inventory", label: "حواصل المحاصيل ومخازن الأعلاف", desc: "جرد المحاصيل المعبأة، توريد الأعلاف، وأسعار بورصة الحبوب", badge: "حواصل", defaultChecked: true },
    { id: "finance", label: "تكاليف المزرعة والأرباح الموسمية", desc: "حساب تكلفة الفدان والدورات الزراعية وإيرادات المحصول الصافي", badge: "مالية", defaultChecked: true },
  ],
  energy: [
    { id: "eng", label: "شجرة أصول محطات التوليد والمرافق", desc: "هيكل المعدات القياسي KKS/ISO 14224، التوربينات والمحولات", badge: "أصول", defaultChecked: true },
    { id: "scada_readings", label: "قراءات الحساسات وتوليد الميجاواط", desc: "تتبع الأحمال اللحظية، كفاءة التوليد الحراري والشمسي، وسجلات العدادات", badge: "SCADA", defaultChecked: true },
    { id: "predictive_maint", label: "الصيانة التنبؤية وتصاريح العمل (PTW)", desc: "خطط الصيانة الوقائية، تصاريح العزل والسلامة المهنية LOTO", badge: "صيانة", defaultChecked: true },
    { id: "ppa_contracts", label: "عقود بيع الطاقة (PPA)", desc: "تسوية الفواتير مع شركات التوزيع وشبكات النقل القومية", badge: "طاقة", defaultChecked: true },
    { id: "finance", label: "محاسبة الأصول والمشروعات الكبرى", desc: "إهلاك التوربينات والمحولات والمصروفات التشغيلية للمحطة", badge: "مالية", defaultChecked: true },
  ],
  banking: [
    { id: "bnk", label: "ملف العميل الموحد (CIF)", desc: "بيانات العميل، الحسابات والتمويلات المرتبطة، والائتمان البنكي", badge: "CIF", defaultChecked: true },
    { id: "general_ledger", label: "دفتر الأستاذ البنكي اللحظي", desc: "معالجة القيود المزدوجة متعددة العملات والترحيل الآلي للودائع", badge: "أستاذ", defaultChecked: true },
    { id: "loan_origination", label: "إدارة التمويلات والتقييم الائتماني", desc: "دراسة الجدارة الائتمانية I-Score، جداول الأقساط، ومتابعة التعثر", badge: "تمويل", defaultChecked: true },
    { id: "aml_monitoring", label: "مراقبة غسيل الأموال والأنماط المشبوهة", desc: "فحص العمليات غير الاعتيادية والامتثال لتعليمات البنك المركزي", badge: "رقابة", defaultChecked: true },
    { id: "finance", label: "مخصصات IFRS 9 والتقارير المالية", desc: "حساب الخسائر الائتمانية المتوقعة ECL والميزانية العمومية", badge: "IFRS", defaultChecked: true },
  ],
  insurance: [
    { id: "ins", label: "إصدار وإدارة وثائق التأمين", desc: "وثائق التأمين الطبي، السيارات، الممتلكات، والتأمين التكافلي", badge: "وثائق", defaultChecked: true },
    { id: "actuarial_pricing", label: "التسعير الاكتواري وجداول الأقساط", desc: "حساب المخاطر، تسعير التغطيات، وتطبيق جداول الأسعار الرسمية", badge: "اكتواري", defaultChecked: true },
    { id: "claims_management", label: "إدارة مطالبات الحوادث والمعاينة", desc: "تسجيل البلاغات FNOL، تعيين خبراء المعاينة، وتقدير مبالغ التعويض", badge: "مطالبات", defaultChecked: true },
    { id: "reinsurance", label: "اتفاقيات إعادة التأمين والاحتياطيات", desc: "توزيع المخاطر مع معيدي التأمين، واحتياطيات معايير IFRS 17", badge: "إعادة", defaultChecked: true },
    { id: "finance", label: "التحصيل المالي وسداد التعويضات", desc: "سداد مبالغ التعويضات المعتمدة، وتحصيل أقساط الوثائق المكتتبة", badge: "مالية", defaultChecked: true },
  ],
  government: [
    { id: "gov", label: "محاسبة الصناديق والموازنات الحكومية", desc: "موازنات البرامج، الصناديق المقيدة وغير المقيدة، وتصنيف الإنفاق", badge: "صناديق", defaultChecked: true },
    { id: "encumbrance", label: "الارتباط المالي وحجز المخصصات", desc: "حجز مخصصات البنود قبل التعاقد لمنع أي تجاوزات مالية", badge: "ارتباط", defaultChecked: true },
    { id: "public_tenders", label: "المناقصات والمشتريات العامة", desc: "كراسات الشروط، ترسية العطاءات، ومتابعة توريدات المشروعات", badge: "مناقصات", defaultChecked: true },
    { id: "beneficiaries", label: "سجل المستفيدين وتوزيع المساعدات", desc: "صرف الإعانات والدعم العيني والنقدي وتوثيق الاستحقاق", badge: "مستفيدين", defaultChecked: true },
    { id: "finance", label: "التقارير الرقابية والتدقيق المالي", desc: "متابعة الحساب الختامي والاعتمادات الإضافية وتقارير التدقيق", badge: "مالية", defaultChecked: true },
  ],
  entertainment: [
    { id: "ent", label: "كتالوج الفعاليات وحجز التذاكر", desc: "إدارة الحفلات، العروض المسرحية، وحجز المقاعد المدرجة والدرجات", badge: "تذاكر", defaultChecked: true },
    { id: "rfid_turnstiles", label: "بوابات الدخول السريعة الذكية", desc: "قراءة الباركود وRFID لمنع التذاكر المزورة وتنظيم أرتال الجمهور", badge: "بوابات", defaultChecked: true },
    { id: "game_cards", label: "بطاقات ألعاب الملاهي والأنشطة", desc: "شحن الرصيد ونقاط المكافآت لبطاقات الألعاب وخصم رسوم الألعاب", badge: "ألعاب", defaultChecked: true },
    { id: "concessions", label: "نقاط بيع الأغذية والمشروبات (F&B)", desc: "كاشير سريع للوجبات الخفيفة والفيشار والهدايا التذكارية", badge: "كاشير", defaultChecked: true },
    { id: "finance", label: "تسوية إيرادات الفعاليات والرعايات", desc: "تقارير مبيعات التذاكر، نسب المنظمين، وتوزيع حصص الفعاليات", badge: "مالية", defaultChecked: true },
  ],
  oil_gas: [
    { id: "oil", label: "شجرة الآبار والمكامن البترولية", desc: "تتبع الآبار البرية والبحرية، منصات الحفر، وحالات التشغيل", badge: "آبار", defaultChecked: true },
    { id: "daily_production", label: "تقرير الإنتاج اليومي (DDR)", desc: "براميل النفط الخام، الغاز المصاحب، ونسب المياه المفرزة لكل بئر", badge: "إنتاج", defaultChecked: true },
    { id: "tanks_inventory", label: "صهاريج التخزين وعمليات الضخ", desc: "قياسات الخزانات اللحظية ومعدلات النقل والشحن لخطوط الأنابيب", badge: "صهاريج", defaultChecked: true },
    { id: "hse_permits", label: "تصاريح العمل والسلامة المهنية (HSE)", desc: "معايير السلامة الصارمة، تصاريح العمل الساخن وتفتيش المواقع", badge: "HSE", defaultChecked: true },
    { id: "finance", label: "محاسبة الشركاء والاتفاقيات النفطية", desc: "طلبات التمويل النقدية Cash Calls، وتوزيع حصص الشركاء والمصروفات", badge: "شركاء", defaultChecked: true },
  ],
  services: [
    { id: "services", label: "عقود الخدمات المهنية والمشاريع", desc: "عروض الأسعار، خطابات التكليف والتعاقدات ومتابعة تسليمات العملاء", badge: "عقود", defaultChecked: true },
    { id: "timesheets", label: "الساعات المهنية وسجلات الإنجاز", desc: "تسجيل ساعات العمل المصروفة على كل عميل وفواتير الأتعاب", badge: "ساعات", defaultChecked: true },
    { id: "invoicing", label: "فواتير الخدمات والمطالبات المرحلية", desc: "الفوترة حسب مراحل الإنجاز أو الفترات الزمنية المجدولة", badge: "فواتير", defaultChecked: true },
    { id: "finance", label: "الخزائن والمصروفات والتدفقات النقدية", desc: "كشوف حسابات العملاء، المصروفات التشغيلية، ومتابعة الأرباح", badge: "مالية", defaultChecked: true },
    { id: "hr", label: "فريق العمل والرواتب والمكافآت", desc: "إدارة ساعات الاستشاريين، الرواتب الشهرية، وبدلات المشاريع", badge: "رواتب", defaultChecked: true },
  ],
  consulting: [
    { id: "services", label: "عقود الاستشارات ودراسات الجدوى", desc: "خطابات التكليف، نطاق العمل الاستشاري، ومراحل تسليم الدراسات", badge: "عقود", defaultChecked: true },
    { id: "billable_hours", label: "الساعات الاستشارية القابلة للفوترة", desc: "تسجيل ساعات المستشارين وتكلفتها وفواتير الأتعاب المباشرة", badge: "ساعات", defaultChecked: true },
    { id: "milestones", label: "مراحل ومخرجات التسليم الاستشاري", desc: "متابعة تقارير الاستشارات واعتماد العملاء للمخرجات المرحلية", badge: "مراحل", defaultChecked: true },
    { id: "finance", label: "الفواتير المهنية والتحصيل", desc: "جدولة الدفعات الاستشارية والتقارير المالية وربحية المشروعات", badge: "مالية", defaultChecked: true },
    { id: "hr", label: "فريق المستشارين والخبراء", desc: "إدارة ساعات الخبراء والرواتب ونسب إنجاز الفرق الاستشارية", badge: "رواتب", defaultChecked: true },
  ],
  agency: [
    { id: "agency", label: "إدارة ملخصات العملاء والمشاريع الإبداعية", desc: "مهام التصميم، المونتاج، وإطلاق الحملات الرقمية ومتابعة المواعيد", badge: "مشاريع", defaultChecked: true },
    { id: "review_milestones", label: "مراجعة التصاميم واعتماد النسخ", desc: "دورات التعديلات مع العميل وتسليم الملفات النهائية بجودة كاملة", badge: "تعديلات", defaultChecked: true },
    { id: "freelancers", label: "عقود المستقلين ومصممي الباطن", desc: "تكاليف المصممين المستقلين، المصورين، والتعليق الصوتي والترجمة", badge: "مستقلين", defaultChecked: true },
    { id: "project_billing", label: "فواتير المشروعات والحملات", desc: "الفوترة المرحلية وتكاليف الإعلانات الممولة ونسب الوكالة", badge: "فواتير", defaultChecked: true },
    { id: "finance", label: "أرباح المشروعات والميزانية الإعلانية", desc: "متابعة ربحية كل حملة إعلانية، وسندات القبض ومصروفات الإنتاج", badge: "مالية", defaultChecked: true },
  ],
  field_service: [
    { id: "field_service", label: "أوامر الشغل وبلاغات الصيانة الميدانية", desc: "تسجيل الأعطال، تصنيف أولويات الإصلاح، وإسناد المهمة للفني المختص", badge: "أوامر", defaultChecked: true },
    { id: "tech_dispatch", label: "توجيه وجدولة الفنيين بالموقع", desc: "إرسال أوامر العمل لأجهزة الفنيين ومسارات الزيارات وتوقيتات الوصول", badge: "توجيه", defaultChecked: true },
    { id: "mobile_parts", label: "قطع الغيار والمخزن المتنقل", desc: "صرف القطع من سيارة الفني وخصمها من المخزن فورياً مع الفاتورة", badge: "قطع", defaultChecked: true },
    { id: "customer_signature", label: "التوقيعات الرقمية وإثبات الإصلاح", desc: "توقيع العميل على شاشة الفني، صور قبل وبعد، وإصدار الفاتورة فورياً", badge: "توقيع", defaultChecked: true },
    { id: "finance", label: "فواتير الصيانة وسندات القبض", desc: "تحصيل رسوم الزيارة الميدانية وأسعار قطع الغيار المستهلكة", badge: "مالية", defaultChecked: true },
  ],
  plumbing: [
    { id: "pos", label: "معرض مواد البناء والسباكة والكهرباء", desc: "كاشير سريع بالباركود مع خصومات المقاولين ومبيعات التجزئة والجملة", badge: "كاشير", defaultChecked: true },
    { id: "inventory", label: "مستودعات الأدوات الصحية والمواسير", desc: "تتبع الأطوال والأقطار والقطع ونواقص المخزون ومواقع الرفوف", badge: "مخزون", defaultChecked: true },
    { id: "contractor_accounts", label: "حسابات مقاولي التشطيبات والسباكة", desc: "كشوف حسابات آجلة، حدود الائتمان، ومتابعة سداد الفواتير", badge: "مقاولين", defaultChecked: true },
    { id: "purchases", label: "فواتير الموردين والمصانع", desc: "استلام طلبيات المصانع، مقارنة الأسعار، وتسجيل تكاليف النقل", badge: "توريد", defaultChecked: true },
    { id: "finance", label: "الخزينة وأوراق القبض والشيكات", desc: "الشيكات وسندات القبض ومصروفات المعرض وتقفيل الخزائن", badge: "مالية", defaultChecked: true },
  ],
  retail: [
    { id: "pos", label: "نقطة بيع سريعة وباركود (Retail POS)", desc: "كاشير سريع، موازين إلكترونية، اختصارات سريعة وفواتير لحظية", badge: "كاشير", defaultChecked: true },
    { id: "inventory", label: "إدارة المخزون ونواقص الرفوف", desc: "أرصدة لحظية، تنبيهات حد الطلب، التحويلات بين الفروع، والجرد", badge: "مخزون", defaultChecked: true },
    { id: "purchases", label: "المشتريات والتوريد وأوامر الشراء", desc: "استلام بضائع الموردين ومقارنة فواتير الشراء بأسعار السوق", badge: "مشتريات", defaultChecked: true },
    { id: "sales_promos", label: "العروض الترويجية وخصومات الأسعار", desc: "باقات التخفيضات، عروض اشترِ واحدة واحصل على خصم، ونقاط الولاء", badge: "عروض", defaultChecked: true },
    { id: "finance", label: "الخزينة والمالية وتقفيل اليومية", desc: "تقفيل الوردية ومطابقة النقدية والفيزا وحسابات البنوك", badge: "مالية", defaultChecked: true },
    { id: "hr", label: "الموظفون ورواتب الكاشير", desc: "ساعات الحضور، الورديات، ومسيرات الأجور والخصومات", badge: "رواتب", defaultChecked: true },
  ],
};

export function getSectorModules(sector: string): SectorModuleItem[] {
  return SECTOR_MODULES_MAP[sector] || SECTOR_MODULES_MAP.retail;
}

export function getSectorDefaultFeatures(sector: string): string[] {
  const mods = getSectorModules(sector);
  return mods.filter((m) => m.defaultChecked !== false).map((m) => m.id);
}

export const FEATURE_OPTIONS = getSectorModules("retail").map((m) => ({
  value: m.id,
  label: m.label,
  desc: m.desc,
}));

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

export const SECTOR_BADGES: Record<string, string> = {
  healthcare: "عيادات ومستشفيات",
  restaurant: "مطاعم وضيافة",
  pharmacy: "صيدلية ومستلزمات",
  school: "مدارس وأكاديميات",
  law_firm: "محاماة وقضايا",
  gym: "جيم ولياقة بدنية",
  salon: "صالون وسبا",
  hotel: "فنادق وضيافة (PMS)",
  travel: "سياحة وحجوزات",
  wholesale: "تجارة جملة وتوزيع",
  logistics: "شحن وأسطول",
  wms_3pl: "مستودعات 3PL",
  ecommerce: "تجارة إلكترونية",
  construction: "مقاولات وإنشاءات",
  real_estate: "إدارة عقارات وأملاك",
  discrete_mfg: "تصنيع وتجميع (BOM)",
  food_mfg: "صناعات غذائية",
  pharma_mfg: "تصنيع دوائي (GMP)",
  printing: "طباعة وتغليف",
  agriculture: "مزارع وإنتاج زراعي",
  energy: "محطات طاقة ومرافق",
  banking: "مصارف وتمويل",
  insurance: "تأمين وتكافل",
  government: "قطاع حكومي وغير ربحي",
  entertainment: "ترفيه وفعاليات",
  oil_gas: "بترول وغاز",
  consulting: "استشارات ومشاريع",
  services: "خدمات عامة ومقاولات",
  plumbing: "معارض ومواد بناء",
  retail: "تجزئة وسوبرماركت",
};
