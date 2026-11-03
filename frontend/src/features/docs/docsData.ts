export interface DocSection {
  id: string;
  title: string;
  titleEn: string;
  items: DocArticle[];
}

export interface DocArticle {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  category: string;
  lastUpdated?: string;
  headings?: { id: string; text: string }[];
  content: {
    overview: string;
    sections: {
      id: string;
      title: string;
      body: string;
      codeBlock?: {
        language: string;
        code: string;
        filename?: string;
      };
      callout?: {
        type: "note" | "tip" | "important" | "warning";
        text: string;
      };
    }[];
  };
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "البدء والتهيئة الأولية",
    titleEn: "Getting Started",
    items: [
      {
        slug: "introduction",
        title: "مقدمة عن ميزان ERP",
        titleEn: "Introduction",
        description: "تعرف على المنظومة المعيارية، فلسفة العزل، وبنية الـ 47 موديول الموحدة.",
        category: "getting-started",
        content: {
          overview:
            "ميزان ERP (Mizan Modular ERP) هو نظام إدارة موارد مؤسسي سحابي متعدد المنشآت (Multi-Tenant SaaS) مبني على معمارية معيارية قابلة للتوسع اللانهائي، حيث تعتبر كافة الأنشطة والمجالات موديولات مستقلة يتم تفعيلها بنقرة واحدة دون الحاجة لتعديل شفرة النظام المصدرية.",
          sections: [
            {
              id: "why-mizan",
              title: "لماذا تم بناء ميزان؟",
              body:
                "الأنظمة التقليدية تفرض هيكلاً جامداً يكلف المؤسسات مبالغ طائلة للتخصيص. يوفر ميزان نموذجاً مرناً يتيح لكل منشأة اختيار باقتها المعيارية الدقيقة (سوبرماركت، مطعم، مجمع طبي، مصنع) مع مشاركة نفس النواة الآمنة والمحدثة باستمرار.",
              callout: {
                type: "tip",
                text: "تعتمد المنصة تقنية PostgreSQL Row-Level Security (RLS) لعزل بيانات كل منشأة حسابياً وأمنياً.",
              },
            },
            {
              id: "core-capabilities",
              title: "أبرز قدرات المنصة الفنية",
              body:
                "تشمل المنصة محرك نقطة بيع فائق السرعة، دعم طابعات الإيصالات الحرارية عبر USB والشبكة (ESC/POS)، رمز ضريبي مشفر ZATCA Phase 2، ربط بوابات الحضور والانصراف البيومترية ZKTeco، ومحرك مهام دورية آلي.",
            },
          ],
        },
      },
      {
        slug: "overview",
        title: "نظرة عامة على المنصة",
        titleEn: "Platform Overview",
        description: "المعمارية التقنية وطبقات النظام الثلاث: النواة، الموديولات، والعتاد الخارجي.",
        category: "getting-started",
        content: {
          overview:
            "تتكون معمارية ميزان من ثلاث طبقات متناغمة: طبقة النواة الأساسية (Core Engine)، طبقة الموديولات القطاعية (Business Verticals)، وطبقة تكامل العتاد والأتمتة (Hardware & Automation).",
          sections: [
            {
              id: "layers",
              title: "الطبقات المعمارية الثلاث",
              body:
                "1. النواة (Core): إدارة المستخدمين، الأدوار والصلاحيات، الخزائن، وسجل التدقيق الرقابي.\n2. الموديولات القطاعية: 47 موديول تشمل المطاعم (KDS)، الصيدليات، المدارس، والمقاولات.\n3. تكامل العتاد: بروتوكول ESC/POS للطابعات الحرارية، قارئات الباركود HID، وأجهزة البصمة ZKTeco عبر منفذ 4370 TCP.",
              callout: {
                type: "note",
                text: "جميع الموديولات تشترك في كشف الحساب الموحد وشجرة الحسابات العامة.",
              },
            },
          ],
        },
      },
      {
        slug: "create-account",
        title: "إنشاء حساب مستخدم جديد",
        titleEn: "Create an Account",
        description: "خطوات التسجيل، التحقق الأمني، وإدارة بيانات الدخول الخاصة بالمسؤول.",
        category: "getting-started",
        content: {
          overview:
            "يمكن لمديري الشركات إنشاء حساب جديد في أقل من دقيقة لتفعيل فترة تجريبية مجانية لمدة 14 يوماً تشمل كافة الموديولات.",
          sections: [
            {
              id: "steps",
              title: "خطوات إنشاء الحساب",
              body:
                "1. توجه إلى صفحة التسجيل (/signup).\n2. أدخل الاسم الكامل، البريد الإلكتروني، ورقم الهاتف.\n3. عيّن كلمة مرور قوية تخضع لمعايير التشفير المتقدم (Argon2).\n4. اضغط 'بدء التجربة المجانية'.",
            },
          ],
        },
      },
      {
        slug: "create-company",
        title: "إنشاء وتهيئة منشأة جديدة",
        titleEn: "Create a Company",
        description: "تحديد المعرّف التعريفي (Slug)، اختيار النشاط التجاري، وضبط العملة الافتراضية.",
        category: "getting-started",
        content: {
          overview:
            "يتم عزل كل منشأة بمعرّف خاص (Tenant Slug) يحدد مسار العمل مثل: /c/german-egyptian/pos مع ربط الحساب برقم ضريبي ونطاق عمل متخصص.",
          sections: [
            {
              id: "company-slug",
              title: "أهمية اسم النطاق الفرعي (Slug)",
              body:
                "الـ Slug هو المعرف الفريد لمنشأتك في النظام. يمكن للموظفين استخدامه للدخول السريع، كما يحدد مسار المتجر الإلكتروني العام /store/:slug.",
            },
          ],
        },
      },
      {
        slug: "workspace-setup",
        title: "إعداد مساحة العمل والفرع",
        titleEn: "Workspace Setup",
        description: "إضافة الفروع والمستودعات وتعيين خزائن النقدية وأدراج الكاشير.",
        category: "getting-started",
        content: {
          overview:
            "تدعم المنصة إدارة الفروع المتعددة والمستودعات المنفصلة مع تخصيص خزائن مستقلة لكل فرع ترحل إليها إيرادات الورديات اليومية.",
          sections: [
            {
              id: "branches",
              title: "تهيئة الفروع والمستودعات",
              body:
                "من لوحة الإعدادات، انتقل إلى 'الفروع والمستودعات' وأضف الفرع الرئيسي مع تحديد العنوان الفعلي والمستودع التابع له لخصم المبيعات فورياً.",
            },
          ],
        },
      },
      {
        slug: "first-steps",
        title: "الخطوات الأولى بعد التثبيت",
        titleEn: "First Steps",
        description: "استيراد الأصناف عبر Excel، تفعيل موديولات النشاط، وإجراء أول عملية بيع.",
        category: "getting-started",
        content: {
          overview:
            "دليل إرشادي لتشغيل أول نقطة بيع خلال 10 دقائق من إنشاء الحساب عبر استيراد بيانات المنتجات وتعيين الصلاحيات.",
          sections: [
            {
              id: "quick-start-checklist",
              title: "قائمة المهام السريعة",
              body:
                "1. تفعيل الموديولات المطلوبة من متجر الإضافات (/modules).\n2. إضافة الأصناف أو استيراد ملف CSV للمخزون.\n3. فتح وردية كاشير في نقطة البيع (/pos).\n4. مسح باركود المنتج وإصدار الفاتورة التجريبية الأولى.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "user-guide",
    title: "دليل المستخدم العام",
    titleEn: "User Guide",
    items: [
      {
        slug: "dashboard",
        title: "لوحة التحكم والمؤشرات اللحظية",
        titleEn: "Dashboard",
        description: "قراءة مؤشرات المبيعات، نواقص المخزون، حركة الخزائن، وأداء الموظفين.",
        category: "user-guide",
        content: {
          overview:
            "توفر شاشة لوحة التحكم الرئيسية نظرة شاملة ولحظية على مؤشرات الأداء المالي والتشغيلي للمنشأة وتنبيهات السيولة.",
          sections: [
            {
              id: "kpis",
              title: "المؤشرات الرئيسية (Executive KPIs)",
              body:
                "• إجمالي مبيعات اليوم والوردية النشطة.\n• صافي الأرباح المحققة بعد خصم تكلفة البضاعة المباعة (COGS).\n• عدد الأصناف التي وصلت لحد إعادة الطلب.\n• رصيد الخزائن والعهد البنكية اللحظي.",
            },
          ],
        },
      },
      {
        slug: "navigation",
        title: "التنقل وقاذف التطبيقات (9-Dots)",
        titleEn: "Navigation & App Launcher",
        description: "التبديل بين الموديولات عبر قاذف ميزان والبحث السريع بالاختصارات.",
        category: "user-guide",
        content: {
          overview:
            "قاذف ميزان (Mizan App Launcher) الموجود في الشريط العلوي (أيقونة الـ 9 نقاط) يتيح الوصول الفوري لكافة التطبيقات والوحدات المفعلة مع ميزة الفلترة السريعة.",
          sections: [
            {
              id: "launcher-usage",
              title: "استخدام قاذف التطبيقات",
              body:
                "اضغط على أيقونة الشبكة في الشريط العلوي، واكتب اسم الموديول (مثلاً: مطاعم، صيدلية، رواتب) للانتقال المباشر للشاشة المخصصة.",
            },
          ],
        },
      },
      {
        slug: "users-roles",
        title: "إدارة المستخدمين والأدوار",
        titleEn: "Users & Roles",
        description: "تعيين صلاحيات الكاشير، المحاسب، مدير الفرع، ومدير المنظومة.",
        category: "user-guide",
        content: {
          overview:
            "يعتمد النظام نموذج التحكم في الوصول القائم على الأدوار (RBAC) مع إمكانية منح صلاحيات دقيقة على مستوى كل شاشة وزر.",
          sections: [
            {
              id: "roles-matrix",
              title: "مصفوفة الأدوار القياسية",
              body:
                "• مدير النظام (Owner/Admin): وصول كامل وغير مقيد.\n• مدير الفرع (Manager): إشراف على المبيعات، المخزون، والورديات.\n• الكاشير (Cashier): إصدار الفواتير، مرتجعات بإذن، وإغلاق الوردية فقط.\n• المحاسب (Accountant): الدفاتر المالية، القيود، والتقارير الرقابية.",
            },
          ],
        },
      },
      {
        slug: "company-settings",
        title: "إعدادات المنشأة والضرائب",
        titleEn: "Company Settings",
        description: "تهيئة الرقم الضريبي، نسبة ضريبة القيمة المضافة، والبيانات الترحيبية على الفواتير.",
        category: "user-guide",
        content: {
          overview:
            "شاشة الإعدادات العامة تتيح تخصيص شعار المنشأة، بيانات السجل التجاري، ونصوص الترويسة والتذييل المطبوعة على الإيصالات الحرارية.",
          sections: [
            {
              id: "tax-config",
              title: "ضبط نسبة الضريبة والـ QR",
              body:
                "حدد نسبة الضريبة (مثلاً: 14% في مصر أو 15% في السعودية)، وفعّل خيار 'رمز الاستجابة السريعة الضريبي' لتوليد QR معتمد تلقائياً.",
            },
          ],
        },
      },
      {
        slug: "notifications",
        title: "مركز الإشعارات والتنبيهات",
        titleEn: "Notifications",
        description: "استقبال تنبيهات نواقص المخزون، إغلاق الورديات، ومواعيد السداد.",
        category: "user-guide",
        content: {
          overview:
            "يرسل محرك الإشعارات تنبيهات فورية للمسؤولين عند حدوث أحداث حرجة مثل عجز الوردية أو اقتراب تاريخ انتهاء صلاحية الأدوية.",
          sections: [
            {
              id: "notification-types",
              title: "أنواع التنبيهات المؤتمتة",
              body:
                "• تنبيهات الأمان والورديات: عند قيام كاشير بتعديل سعر أو إلغاء فاتورة.\n• تنبيهات المخزون: عند وصول صنف لحد إعادة الطلب.\n• تنبيهات المديونيات: فواتير الموردين المستحقة اليوم.",
            },
          ],
        },
      },
      {
        slug: "search-filters",
        title: "البحث المتقدم والفلترة",
        titleEn: "Search & Filters",
        description: "البحث بالباركود، الاسم، التاريخ، وتصفية السجلات في جداول البيانات.",
        category: "user-guide",
        content: {
          overview:
            "تحتوي كافة جداول ميزان على محرك بحث سريع وفلاتر متعددة للفرز والتصدير الفوري بصيغة Excel أو PDF.",
          sections: [
            {
              id: "keyboard-shortcuts",
              title: "اختصارات لوحة المفاتيح في البحث",
              body:
                "استخدم مفتاح 'F3' لتركيز مؤشر البحث، ومفتاح 'Esc' لتفريغ الفلاتر والعودة للشاشة السابقة.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "modules-doc",
    title: "دليل الموديولات والتطبيقات",
    titleEn: "Modules Reference",
    items: [
      {
        slug: "modules/accounting",
        title: "المالية والحسابات والقيود",
        titleEn: "Accounting & Finance",
        description: "دورة القيود اليومية، شجرة الحسابات، كشوفات العملاء والموردين، ومطابقة الخزائن.",
        category: "modules-doc",
        content: {
          overview:
            "موديول المالية (Finance & Ledgers) هو القلب المحاسبي للمنظومة. يسجل الحركات المالية تلقائياً بنظام القيد المزدوج فور تنفيذ أي حركة بيع أو شراء.",
          sections: [
            {
              id: "double-entry",
              title: "التسجيل المحاسبي التلقائي",
              body:
                "عند بيع فاتورة نقدية، يقوم المحرك بإنشاء قيد مزدوج:\n• مدين: الخزينة (زيادة الأصول المتداولة).\n• دائن: إيراد المبيعات وضريبة القيمة المضافة المستحقة.",
              callout: {
                type: "important",
                text: "لا يمكن تعديل القيود بعد الترحيل النهائي لضمان سلامة سجل التدقيق الرقابي.",
              },
            },
          ],
        },
      },
      {
        slug: "modules/pos",
        title: "نقطة البيع السريعة (POS)",
        titleEn: "Point of Sale",
        description: "إصدار الفواتير الفوري، دعم قارئات الباركود، الشاشات اللمسية، وإدارة الورديات.",
        category: "modules-doc",
        content: {
          overview:
            "شاشة كاشير فائقة الاستجابة تتيح مسح الباركود، تطبيق الخصومات المصرح بها، تقسيم طرق الدفع (كاش/فيزا/محفظة)، وطباعة الإيصال الحراري في أقل من ثانيتين.",
          sections: [
            {
              id: "shift-cycle",
              title: "دورة حياة وردية الكاشير",
              body:
                "1. فتح الوردية وتحديد رصيد العهدة النقدية الافتتاحية.\n2. إجراء عمليات البيع وقبول المدفوعات.\n3. إغلاق الوردية وجرد النقدية الفعلي وطباعة تقرير Z-Report.\n4. ترحيل الفروقات النقدية تلقائياً لحساب العجز والزيادة.",
            },
          ],
        },
      },
      {
        slug: "modules/inventory",
        title: "إدارة المخزون والمستودعات (WMS)",
        titleEn: "Inventory & Warehouse",
        description: "تتبع الأرصدة، التحويلات بين الفروع، أذون الإضافة والصرف، وتسويات الجرد.",
        category: "modules-doc",
        content: {
          overview:
            "يدعم موديول المخزون التتبع اللحظي للكميات، تكلفة المخزون بطريقة المتوسط المرجح (WAC)، تتبع التشغيلات وتواريخ الصلاحية (FEFO)، والباركود المتغير للأوزان.",
          sections: [
            {
              id: "transfers",
              title: "التحويل بين المستودعات",
              body:
                "يتم التحويل عبر إذن نقل مخزني يمر بمرحلة الشحن ثم الاستلام والتأكيد من أمين المستودع المستلم لمنع ضياع العهد.",
            },
          ],
        },
      },
      {
        slug: "modules/purchasing",
        title: "المشتريات والتوريدات",
        titleEn: "Purchasing & Procurement",
        description: "دورة طلبات الشراء، عروض الأسعار، فواتير التوريد، وحسابات الموردين.",
        category: "modules-doc",
        content: {
          overview:
            "إدارة كاملة لعمليات التوريد بدءاً من طلب الشراء الداخلي، تعميد أوامر الشراء للموردين، مطابقة الاستلام المخزني مع الفاتورة (3-Way Matching)، والمديونيات الآجلة.",
          sections: [
            {
              id: "supplier-balance",
              title: "كشف حساب المورد والمديونيات",
              body:
                "تحديث لحظي لمديونية المورد وسداد الدفعات النقدية أو الشيكات مع إرفاق صور أذون الاستلام.",
            },
          ],
        },
      },
      {
        slug: "modules/hr",
        title: "الموارد البشرية والرواتب (HR)",
        titleEn: "Human Resources & Payroll",
        description: "سجلات الموظفين، الحضور البيومتري ZKTeco، مسيرات الرواتب، والسلف والخصومات.",
        category: "modules-doc",
        content: {
          overview:
            "منظومة متكاملة لحساب ساعات العمل الإضافي، التأخيرات والغياب تلقائياً بناءً على بصمات الأجهزة وربطها بمسير الرواتب الشهري.",
          sections: [
            {
              id: "payroll-calculation",
              title: "احتساب مسير الرواتب",
              body:
                "صافي الراتب = الراتب الأساسي + البدلات + الإضافي - (الغياب + التأخير + الخصومات + أقساط السلف).",
            },
          ],
        },
      },
      {
        slug: "modules/clinic",
        title: "العيادات والمراكز الطبية",
        titleEn: "Healthcare & Clinic EMR",
        description: "الملفات الطبية الإلكترونية، الروشتات الرقمية، المواعيد، والفحوصات المخبرية.",
        category: "modules-doc",
        content: {
          overview:
            "حل شامل للمراكز الطبية والعيادات يربط الاستقبال، غرف الأطباء، والصيدلية الداخلية بنظام روشتات إلكترونية مؤمنة.",
          sections: [
            {
              id: "emr-records",
              title: "السجل الطبي الموحد (EMR)",
              body:
                "تسجيل الأعراض، الفحص السريري، التشخيص وفق ترميز ICD-10، وربط التحاليل وصرف الأدوية من مستودع المركز مباشرة.",
            },
          ],
        },
      },
      {
        slug: "modules/restaurant",
        title: "المطاعم وشاشات المطبخ (KDS)",
        titleEn: "Restaurant & KDS",
        description: "خريطة الطاولات، شاشات المطبخ اللحظية، تجزئة الشيكات، وتفكيك وصفات الأطباق (BOM).",
        category: "modules-doc",
        content: {
          overview:
            "موديول ضيافة متخصص يرسل أوامر التشغيل للمطبخ فور تأكيدها في صالة الطعام، مع خصم المكونات الخام من المستودع تلقائياً بنظام Backflushing.",
          sections: [
            {
              id: "table-plan",
              title: "إدارة الصالة والطاولات",
              body:
                "متابعة حالة الطاولات (مشغولة، فارغة، قيد التحاسب) وتعيين طلبات الدليفري والسفري مع تتبع أوقات التجهيز.",
            },
          ],
        },
      },
      {
        slug: "modules/manufacturing",
        title: "التصنيع وتخطيط الإنتاج (BOM)",
        titleEn: "Discrete Manufacturing",
        description: "شجرة المنتج متعددة المستويات، مسارات التشغيل، أوامر الشغل، وكفاءة المعدات OEE.",
        category: "modules-doc",
        content: {
          overview:
            "تخطيط وتتبع عمليات التصنيع الميكانيكي والغذائي بدءاً من صرف المواد الخام، مراكز العمل، وحتى تسليم المنتج التام للمستودع.",
          sections: [
            {
              id: "oee-metrics",
              title: "مؤشر كفاءة المعدات (OEE)",
              body:
                "حساب معدلات التوافر والأداء والجودة لماكينات خط الإنتاج وتحديد أسباب التوقف والأعطال.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "admin-doc",
    title: "دليل الإدارة والتحكم",
    titleEn: "Administration",
    items: [
      {
        slug: "admin/company-management",
        title: "إدارة المنشآت والاشتراكات",
        titleEn: "Company Management",
        description: "متابعة استهلاك خطة الاشتراك، حدود المستخدمين، والمساحة التخزينية.",
        category: "admin-doc",
        content: {
          overview:
            "تمكن شاشة إدارة المنشأة المسؤولين من ترقية الباقة السحابية، إضافة فروع جديدة، ومتابعة سجل الفواتير الشهرية والسنوية.",
          sections: [
            {
              id: "plan-limits",
              title: "مراقبة حدود الاستخدام",
              body:
                "يعرض النظام مؤشرات بيانية لاستهلاك عدد المستخدمين المتاح، عدد الفروع المفعلة، وحجم المرفقات والمستندات المؤرشفة.",
            },
          ],
        },
      },
      {
        slug: "admin/users-permissions",
        title: "الأدوار والصلاحيات المتقدمة",
        titleEn: "Roles & Permissions",
        description: "إنشاء أدوار مخصصة وتحديد صلاحيات التعديل، الحذف، والتقارير بدقة.",
        category: "admin-doc",
        content: {
          overview:
            "يتيح محرك الصلاحيات حجب أسعار الشراء عن الكاشير، تقييد صلاحية الخصم بحد أقصى للنسبة المئوية، ومنع تعديل الفواتير بعد الطباعة.",
          sections: [
            {
              id: "custom-roles",
              title: "تخصيص الأدوار الجديدة",
              body:
                "يمكن إنشاء دور مثل 'أمين مستودع' مع منحه صلاحية قراءة الأصناف وإنشاء أذون الإضافة فقط وحرمانه من شاشات المبيعات والمالية.",
            },
          ],
        },
      },
      {
        slug: "admin/module-config",
        title: "تهيئة الموديولات وضبط الإعدادات",
        titleEn: "Module Configuration",
        description: "تفعيل وتعطيل الموديولات المعيارية وضبط معايير التشغيل بدون كود.",
        category: "admin-doc",
        content: {
          overview:
            "يوفر متجر التطبيقات الداخلي (/modules) واجهة رسومية لتفعيل موديولات النشاط وتعديل إعداداتها المدعومة تلقائياً من ملف manifest.json.",
          sections: [
            {
              id: "toggle-modules",
              title: "تفعيل وتعطيل الإضافات",
              body:
                "عند تفعيل موديول يعتمد على موديول آخر (مثلاً المطاعم تعتمد على نقاط البيع والمخزون)، يقوم النظام تلقائياً بتفعيل التبعيات المطلوبة.",
            },
          ],
        },
      },
      {
        slug: "admin/tenant-settings",
        title: "عزل البيانات وسياسات RLS",
        titleEn: "Tenant Settings & RLS",
        description: "الآلية الرياضية لعزل بيانات المنشآت في قاعدة بيانات PostgreSQL.",
        category: "admin-doc",
        content: {
          overview:
            "تعتمد بنية المنصة على محرك PostgreSQL Row-Level Security حيث يتم وسم كل سجل بـ tenant_id مع تطبيق سياسة أمان صارمة تمنع أي استعلام من قراءة بيانات منشأة أخرى.",
          sections: [
            {
              id: "rls-policy",
              title: "كود سياسة الأمان RLS",
              body:
                "يتم تفعيل الأمان عبر جلسة قاعدة البيانات المعزولة:",
              codeBlock: {
                language: "sql",
                filename: "rls_policy.sql",
                code: "ALTER TABLE products ENABLE ROW LEVEL SECURITY;\nCREATE POLICY tenant_isolation_policy ON products\n  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);",
              },
            },
          ],
        },
      },
      {
        slug: "admin/data-import-export",
        title: "استيراد وتصدير البيانات",
        titleEn: "Data Import & Export",
        description: "استيراد دليل الحسابات وقوائم الأصناف من Excel وتصدير النسخ الاحتياطية.",
        category: "admin-doc",
        content: {
          overview:
            "يدعم النظام استيراد وتصدير كافة الجداول بصيغة Excel وCSV مع فحص تلقائي لتكرار أرقام الباركود وكود الأصناف.",
          sections: [
            {
              id: "templates",
              title: "قوالب الاستيراد المعتمدة",
              body:
                "قم بتحميل ملف القالب الجاهز من شاشة المنتجات، املأ الأعمدة الأساسية (الاسم، الباركود، سعر الشراء، سعر البيع)، ثم ارفعه لمعالجته في ثوانٍ.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "dev-doc",
    title: "توثيق المطورين وواجهات البرمجة (API)",
    titleEn: "Developer Documentation",
    items: [
      {
        slug: "dev/architecture",
        title: "معمارية النظام والتقنيات",
        titleEn: "Architecture Overview",
        description: "مواصفات Python 3.12، FastAPI، SQLAlchemy 2.0، وReact 19.",
        category: "dev-doc",
        content: {
          overview:
            "تم بناء ميزان ليعمل بنمط غير تزامني بالكامل (Asynchronous Event Loop) باستخدام FastAPI ومحرك قاعدة البيانات asyncpg لضمان معالجة آلاف الطلبات المتزامنة بأقل استهلاك للموارد.",
          sections: [
            {
              id: "tech-stack",
              title: "حزمة التقنيات المعتمدة",
              body:
                "• الباك إند: Python 3.12+ وFastAPI مع SQLAlchemy 2.0 Async.\n• قاعدة البيانات: PostgreSQL 16+ مع RLS ومحرك بحث متقدم.\n• الفرونت إند: React 19، Vite 6، Tailwind CSS، وCairo Font.\n• المكتبات المكتبية: Tauri وCapacitor للأجهزة والتابلت.",
            },
          ],
        },
      },
      {
        slug: "dev/api-intro",
        title: "واجهة برمجة التطبيقات (REST API)",
        titleEn: "API Introduction",
        description: "طرق المصادقة، الترويسات المطلوبة، والتوثيق التفاعلي Swagger OpenAPI.",
        category: "dev-doc",
        content: {
          overview:
            "كافة وظائف المنظومة متاحة عبر واجهة برمجية RESTful موثقة بالكامل بمعيار OpenAPI 3.0 ومتاحة للتجربة الحية عبر الرابط /docs في خادم الباك إند.",
          sections: [
            {
              id: "sample-request",
              title: "مثال على استدعاء قائمة المنتجات",
              body:
                "يتطلب كل استدعاء تمرير توكن المصادقة Bearer JWT في ترويسة الطلب:",
              codeBlock: {
                language: "bash",
                filename: "curl_products.sh",
                code: 'curl -X GET "https://api.mizan.app/api/v1/products" \\\n  -H "Authorization: Bearer <JWT_TOKEN>" \\\n  -H "X-Tenant-Slug: my-company"',
              },
            },
          ],
        },
      },
      {
        slug: "dev/authentication",
        title: "المصادقة وتوكن JWT",
        titleEn: "Authentication & JWT",
        description: "آلية تسجيل الدخول، توليد التوكن، والتحقق من الصلاحيات وتجديد الجلسة.",
        category: "dev-doc",
        content: {
          overview:
            "تعتمد المنصة توكنات JSON Web Tokens (JWT) مشفرة بخوارزمية HS256 تحتوي على معرف المستخدم، معرف المنشأة (tenant_id)، وقائمة الصلاحيات.",
          sections: [
            {
              id: "auth-endpoint",
              title: "نقطة نهاية تسجيل الدخول",
              body: "استدعاء POST /api/v1/auth/login:",
              codeBlock: {
                language: "json",
                filename: "login_response.json",
                code: '{\n  "access_token": "eyJhbGciOiJIUzI1NiIs...",\n  "token_type": "bearer",\n  "expires_in": 86400,\n  "user": {\n    "id": "c935140b-...",\n    "username": "admin",\n    "tenant_id": "e841a20f-..."\n  }\n}',
              },
            },
          ],
        },
      },
      {
        slug: "dev/manifest-spec",
        title: "مواصفة الموديول (manifest.json)",
        titleEn: "Module Manifest Spec",
        description: "العقد التعريفي للموديول، الحقول الإلزامية، ونموذج الإعدادات بدون كود.",
        category: "dev-doc",
        content: {
          overview:
            "كل موديول في ميزان هو مجلد مستقل في backend/app/modules/<id>/ يحتوي إلزامياً على ملف manifest.json يعرّف هويته وتبعيته وشاشاته.",
          sections: [
            {
              id: "manifest-example",
              title: "نموذج مانيفست قياسي لموديول",
              body: "هيكل ملف manifest.json النموذجي:",
              codeBlock: {
                language: "json",
                filename: "manifest.json",
                code: '{\n  "id": "pos_hardware",\n  "name": "إدارة أجهزة نقاط البيع والطباعة الحرارية",\n  "name_en": "POS Hardware & Printing",\n  "version": "1.0.0",\n  "icon": "Printer",\n  "dependencies": ["core", "pos"],\n  "is_core": false,\n  "settings_schema": [\n    {\n      "key": "paper_width",\n      "label": "عرض الورق الحراري",\n      "type": "select",\n      "default": "80mm",\n      "options": ["80mm", "58mm"]\n    }\n  ]\n}',
              },
            },
          ],
        },
      },
      {
        slug: "dev/hardware-escpos",
        title: "الطباعة الحرارية وبروتوكول ESC/POS",
        titleEn: "Hardware & ESC/POS",
        description: "توليد أوامر الطباعة الثنائية، نبضة فتح درج الكاشير، ورمز ZATCA TLV QR.",
        category: "dev-doc",
        content: {
          overview:
            "يدعم ميزان طباعة الإيصالات الحرارية المباشرة عبر المتصفح (Window Print)، أو عبر كابل الشبكة وUSB المباشر باستخدام أوامر ESC/POS القياسية.",
          sections: [
            {
              id: "zatca-tlv",
              title: "توليد كود ZATCA TLV في بايثون",
              body:
                "يتم ترميز البيانات الضريبية وفق متطلبات هيئة الزكاة والجمارك بصيغة TLV Base64:",
              codeBlock: {
                language: "python",
                filename: "zatca_tlv.py",
                code: 'import base64\n\ndef zatca_tlv(seller: str, vat: str, timestamp: str, total: str, tax: str) -> str:\n    def tag(t: int, val: str) -> bytes:\n        b = val.encode("utf-8")\n        return bytes([t, len(b)]) + b\n    tlv = tag(1, seller) + tag(2, vat) + tag(3, timestamp) + tag(4, total) + tag(5, tax)\n    return base64.b64encode(tlv).decode("ascii")',
              },
            },
          ],
        },
      },
      {
        slug: "dev/webhooks",
        title: "خطافات الويب والأحداث (Webhooks)",
        titleEn: "Webhooks & Events",
        description: "إرسال إشعارات لحظية للأنظمة الخارجية عند اكتمال عمليات البيع أو التوريد.",
        category: "dev-doc",
        content: {
          overview:
            "يمكن ربط ميزان بأنظمة التجارة الإلكترونية وتطبيقات الطرف الثالث عبر خطافات الويب (Webhooks) التي ترسل حمولات JSON موقعة رقمياً.",
          sections: [
            {
              id: "webhook-payload",
              title: "حمولة حدث اكتمال الفاتورة (order.completed)",
              body: "نموذج البيانات المرسلة:",
              codeBlock: {
                language: "json",
                filename: "order_completed_webhook.json",
                code: '{\n  "event": "order.completed",\n  "tenant_id": "c935140b-...",\n  "timestamp": "2026-11-03T20:30:00Z",\n  "data": {\n    "invoice_number": "INV-1092",\n    "total_amount": 450.00,\n    "payment_method": "CASH"\n  }\n}',
              },
            },
          ],
        },
      },
      {
        slug: "dev/error-handling",
        title: "رموز الاستجابة ومعالجة الأخطاء",
        titleEn: "Error Handling & Codes",
        description: "دليل رموز الأخطاء HTTP القياسية (400, 401, 403, 404, 422, 500).",
        category: "dev-doc",
        content: {
          overview:
            "ترجع واجهات ميزان رسائل خطأ قياسية ثنائية اللغة لمساعدة مطوري الواجهات على فهم سبب الرفض ومعالجته بمرونة.",
          sections: [
            {
              id: "error-structure",
              title: "هيكل رسالة الخطأ",
              body: "نموذج استجابة الخطأ:",
              codeBlock: {
                language: "json",
                filename: "error_response.json",
                code: '{\n  "detail": "وحدة «المطاعم والكافيهات» غير مفعلة في اشتراك المنشأة الحالي.",\n  "error_code": "MODULE_NOT_ACTIVE",\n  "module_id": "restaurant"\n}',
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: "deployment-doc",
    title: "دليل النشر والتشغيل",
    titleEn: "Deployment & Operations",
    items: [
      {
        slug: "deploy/saas",
        title: "نشر بيئة السحابة المدارة (SaaS)",
        titleEn: "SaaS Deployment",
        description: "تهيئة منصة SaaS متعددة المنشآت مع بوابات الدفع ولوحة التحكم Admoon.",
        category: "deployment-doc",
        content: {
          overview:
            "يوفر ميزان منصة تحكم مركزية (Admoon Control Plane) تتيح لمقدمي الخدمة إدارة المنشآت المشتركة، مراقبة استهلاك الخوادم، وإصدار الفواتير الدورية تلقائياً.",
          sections: [
            {
              id: "control-plane",
              title: "لوحة تحكم المنصة /admoon",
              body:
                "تتضمن لوحة الإدارة العامة شاشات لمراقبة حالة الحاويات، إدارة باقات الأسعار، وتوليد النسخ الاحتياطية المجمعة بنقرة زر.",
            },
          ],
        },
      },
      {
        slug: "deploy/self-hosted",
        title: "النشر الذاتي عبر Docker Compose",
        titleEn: "Self-Hosted Deployment",
        description: "تشغيل المنظومة على خادم خاص أو محلي داخل منشأتك عبر الحاويات.",
        category: "deployment-doc",
        content: {
          overview:
            "يمكن للشركات ذات المتطلبات الأمنية العالية تشغيل المنظومة بالكامل على خوادمها الداخلية (On-Premises) دون اتصال خارجي.",
          sections: [
            {
              id: "docker-run",
              title: "أمر التشغيل السريع",
              body: "قم بتشغيل الحاويات باستخدام ملف docker-compose.yml المعتمد:",
              codeBlock: {
                language: "bash",
                filename: "deploy.sh",
                code: "git clone https://github.com/mizan-erp/mizan.git\ncd mizan\npython manage.py setup\npython manage.py deploy --yes",
              },
            },
          ],
        },
      },
      {
        slug: "deploy/environment",
        title: "متغيرات البيئة (.env)",
        titleEn: "Environment Configuration",
        description: "قائمة بكافة متغيرات البيئة الخاصة بقاعدة البيانات، الأمان، والعمال المؤتمتة.",
        category: "deployment-doc",
        content: {
          overview:
            "تتم تهيئة إعدادات الخادم من خلال ملف backend/.env متضمناً مفتاح التشفير السري، رابط اتصال قاعدة البيانات، وفترات عمل مؤقت المهام.",
          sections: [
            {
              id: "env-keys",
              title: "أهم مفاتيح ملف .env",
              body: "نموذج تهيئة الإنتاج:",
              codeBlock: {
                language: "ini",
                filename: ".env",
                code: "DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/inventory_db\nSECRET_KEY=your-super-secret-key-change-in-production\nACCESS_TOKEN_EXPIRE_MINUTES=1440\nCRON_POLL_INTERVAL=60",
              },
            },
          ],
        },
      },
      {
        slug: "deploy/database",
        title: "تهيئة قاعدة بيانات PostgreSQL وRLS",
        titleEn: "Database Configuration",
        description: "إنشاء الجداول، تفعيل سياسات الأمان RLS، وضبط إعدادات الذاكرة ومجمع الاتصالات.",
        category: "deployment-doc",
        content: {
          overview:
            "تتطلب المنصة خادم PostgreSQL إصدار 16 أو أحدث مع تفعيل امتدادات UUID وRLS لضمان أفضل أداء مع محرك SQLAlchemy Async.",
          sections: [
            {
              id: "tuning",
              title: "تحسين أداء خادم قواعد البيانات",
              body:
                "يوصى بضبط shared_buffers إلى 25% من إجمالي ذاكرة الرام وضبط work_mem بما يناسب استعلامات التقارير المالية الكبرى.",
            },
          ],
        },
      },
      {
        slug: "deploy/backup-restore",
        title: "النسخ الاحتياطي واستعادة البيانات",
        titleEn: "Backup & Restore",
        description: "أوامر أخذ لقطات فورية من قاعدة البيانات، جدولة النسخ، واستعادتها بأمان.",
        category: "deployment-doc",
        content: {
          overview:
            "يوفر سكريبت manage.py أوامر مدمجة لأخذ لقطات مضغوطة من قاعدة البيانات وتخزينها في مجلد backups/.",
          sections: [
            {
              id: "backup-commands",
              title: "أوامر إدارة النسخ",
              body: "استخدم الأوامر التالية:",
              codeBlock: {
                language: "bash",
                filename: "backup_commands.sh",
                code: "# أخذ نسخة احتياطية جديدة\npython manage.py backup\n\n# استعادة نسخة سابقة محددة\npython manage.py restore backups/backup_20261103_120000.sql",
              },
            },
          ],
        },
      },
      {
        slug: "deploy/monitoring",
        title: "المراقبة وسجلات التشغيل (Logs)",
        titleEn: "Monitoring & Logs",
        description: "متابعة سجلات Uvicorn، تتبع الأخطاء اللحظية، وفحص مؤشر الصحة /health.",
        category: "deployment-doc",
        content: {
          overview:
            "توفر نقطة نهاية GET /health فحصاً ذاتياً لاتصال قاعدة البيانات وصحة عمال الأتمتة مع إمكانية متابعة السجلات الحية.",
          sections: [
            {
              id: "logs-tail",
              title: "متابعة السجلات الحية",
              body: "أمر متابعة السجلات:",
              codeBlock: {
                language: "bash",
                filename: "logs.sh",
                code: "python manage.py logs",
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: "support-doc",
    title: "الدعم والمساعدة وتاريخ التحديثات",
    titleEn: "Support & Release Notes",
    items: [
      {
        slug: "support/faq",
        title: "الأسئلة الشائعة (FAQ)",
        titleEn: "Frequently Asked Questions",
        description: "إجابات على أكثر الاستفسارات التقنية والتشغيلية شيوعاً لدى العملاء.",
        category: "support-doc",
        content: {
          overview:
            "إجابات سريعة وشاملة لأكثر الأسئلة تكراراً حول التوافق مع الأجهزة، الأمان السحابي، والتكلفة.",
          sections: [
            {
              id: "faq-q1",
              title: "هل يعمل ميزان عند انقطاع الإنترنت؟",
              body:
                "نعم، تطبيق الكاشير المكتبي (المبني عبر Tauri) يدعم تسجيل المبيعات وحفظها محلياً في ذاكرة التخزين المؤقت، ثم مزامنتها تلقائياً مع السحابة فور عودة الاتصال.",
            },
            {
              id: "faq-q2",
              title: "هل أحتاج إلى شراء أجهزة كاشير معينة؟",
              body:
                "لا! يدعم ميزان العمل على أي جهاز كمبيوتر، شاشة لمس، أو تابلت بنظام ويندوز، لينكس، أندرويد، أو ماك، ويدعم أي طابعة إيصالات حرارية قياسية (80mm أو 58mm).",
            },
          ],
        },
      },
      {
        slug: "support/troubleshooting",
        title: "حل المشكلات الفنية الشائعة",
        titleEn: "Common Issues & Troubleshooting",
        description: "إرشادات حل مشكلات اتصال الطابعة، قارئ الباركود، أو بطء الاستجابة.",
        category: "support-doc",
        content: {
          overview:
            "دليل عملي لتشخيص وإصلاح أي عقبة تشغيلية قد تواجه طاقم الكاشير أو مسؤولي النظام.",
          sections: [
            {
              id: "printer-offline",
              title: "الطابعة الحرارية لا تستجيب",
              body:
                "1. تأكد من توصيل كابل USB أو كابل الشبكة واشتعال لمبة الطاقة الخضراء.\n2. من شاشة الكاشير، اضغط على زر 'إعدادات الطابعة' وتأكد من اختيار المقاس الصحيح (80mm أو 58mm).\n3. تأكد من إعطاء متصفح الويب إذن الطباعة التلقائية (Always Allow).",
            },
          ],
        },
      },
      {
        slug: "support/contact",
        title: "التواصل مع الدعم الفني",
        titleEn: "Contact Support",
        description: "قنوات الدعم المباشر، الدعم الطارئ للمؤسسات، ومستويات الخدمة (SLA).",
        category: "support-doc",
        content: {
          overview:
            "فريق الدعم الفني الميداني والسحابي متاح على مدار الساعة للمنشآت المشتركة في باقات المحترفين والمؤسسات عبر الواتساب، الهاتف، ونظام التذاكر.",
          sections: [
            {
              id: "support-channels",
              title: "قنوات الاتصال المباشرة",
              body:
                "• البريد الفني: support@mizan.app\n• هاتف الدعم السريع: +20 100 000 0000 (مصر) / +966 50 000 0000 (السعودية)\n• متوسط زمن الاستجابة للحالات الطارئة: أقل من 15 دقيقة للمؤسسات.",
            },
          ],
        },
      },
      {
        slug: "support/release-notes",
        title: "سجل التحديثات والإصدارات",
        titleEn: "Release Notes & Changelog",
        description: "تاريخ ميزات وتحديثات المنظومة من الإصدار 1.0 وحتى الإصدار 3.0 المعياري.",
        category: "support-doc",
        content: {
          overview:
            "سجل زمني يوضح كافة التحسينات المعمارية والإضافات الوظيفية المعتمدة في كل إصدار من ميزان.",
          sections: [
            {
              id: "v3-0-0",
              title: "الإصدار Mizan 3.0 (نوفمبر 2026) — التحديث المعياري الشامل",
              body:
                "• تحويل 100% من نطاقات العمل إلى موديولات ذاتية الاكتفاء (47 موديول معياري).\n• إطلاق قاذف التطبيقات Mizan App Launcher (9 نقاط) في الشريط العلوي.\n• إضافة موديول حضور وبصمة ZKTeco التلقائي عبر الشبكة.\n• إضافة محرك الأتمتة المجدول Automation Worker لمهام الـ Cron.\n• ترقية محرك إيصالات الكاشير ليدعم المقاسين 80mm و58mm مع نبضة فتح درج النقدية الكهرومغناطيسي.\n• دعم كامل للتنقل بين العربية (RTL) والإنجليزية (LTR).",
            },
          ],
        },
      },
    ],
  },
];

// Helper to look up article by slug
export function getDocArticle(slug: string): DocArticle | undefined {
  for (const section of DOC_SECTIONS) {
    for (const item of section.items) {
      if (item.slug === slug) return item;
    }
  }
  return undefined;
}

// Flat list of all articles for search
export function getAllDocArticles(): DocArticle[] {
  const articles: DocArticle[] = [];
  for (const section of DOC_SECTIONS) {
    articles.push(...section.items);
  }
  return articles;
}
