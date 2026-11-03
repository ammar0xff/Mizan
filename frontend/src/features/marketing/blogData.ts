export interface BlogPost {
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  category: "engineering" | "retail" | "accounting" | "hardware";
  categoryLabel: string;
  readTime: string;
  date: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  content: {
    intro: string;
    bodySections: {
      title: string;
      text: string;
      codeBlock?: {
        lang: string;
        code: string;
      };
    }[];
    conclusion: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "postgresql-rls-multi-tenancy",
    title: "كيف يضمن عزل Row-Level Security في PostgreSQL أمان بيانات المنشآت المتعددة في ميزان؟",
    titleEn: "How PostgreSQL Row-Level Security Guarantees Multi-Tenant Isolation in Mizan ERP",
    excerpt:
      "استعراض عميق لكيفية تحقيق عزل رياضي وأمني صارم بين آلاف المنشآت المشتركة على نفس قاعدة البيانات بدون أي تسريب للبيانات أو عبء صيانة لقواعد بيانات متعددة.",
    category: "engineering",
    categoryLabel: "هندسة البرمجيات",
    readTime: "7 دقائق",
    date: "28 أكتوبر 2026",
    author: {
      name: "فريق هندسة النواة",
      role: "Core Architecture Team",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    content: {
      intro:
        "في أنظمة الـ ERP السحابية متعددة المنشآت (Multi-Tenant SaaS)، يُعد أمان وعزل بيانات العملاء المعيار الأهم على الإطلاق. تختار العديد من الأنظمة إما عزل قواعد البيانات بالكامل (Database-per-Tenant) وهو ما يؤدي إلى صعوبة بالغة في الترقية والصيانة، أو الاعتماد البسيط على شرط WHERE tenant_id = :id في شفرة التطبيق، وهو ما يحمل مخاطر خطأ بشري قد يكشف بيانات منشأة لأخرى. في ميزان ERP، اخترنا الحل الهندسي الأمثل: Row-Level Security على مستوى نواة PostgreSQL.",
      bodySections: [
        {
          title: "1. ما هو Row-Level Security (RLS)؟",
          text:
            "Row-Level Security هي ميزة مدمجة في محرك PostgreSQL تسمح بتحديد سياسات أمان تتحكم في الصفوف التي يمكن لكل مستخدم أو جلسة استرجاعها أو تعديلها. يتم تقييم السياسة مباشرة في النواة التنفيذية للاستعلام قبل إعادة أي بايت من البيانات.",
        },
        {
          title: "2. كيف يفعل ميزان سياسة الأمان؟",
          text:
            "عند وصول أي طلب إلى واجهة FastAPI، يقوم وسيط المصادقة باستخراج tenant_id الموثق من توكن الـ JWT، ثم يرسل أمراً فورياً لجلسة قاعدة البيانات قبل تنفيذ أي استعلام:",
          codeBlock: {
            lang: "sql",
            code: "-- ضبط معرف المنشأة الحالية في متغير الجلسة\nSET LOCAL app.current_tenant_id = 'c935140b-71a2-4c28-9bc3-7a9120489912';\n\n-- الآن، حتى لو قام المطور بكتابة SELECT * FROM products بدون WHERE،\n-- فإن المحرك يطبق السياسة تلقائياً ويعيد فقط منتجات هذه المنشأة!\nSELECT id, name, price FROM products;",
          },
        },
        {
          title: "3. نموذج الـ TenantScoped في SQLAlchemy",
          text:
            "لضمان عدم نسيان عمود tenant_id في أي جدول جديد، يرث كل موديل قاعدة بيانات في ميزان من كلاس موحد يحقن المفتاح الأجنبي وفهارس البحث اللحظية تلقائياً.",
        },
      ],
      conclusion:
        "بفضل هذا النموذج الهندسي، يحصل عملاء ميزان على أمان بنكي صارم يمنع تسريب البيانات حسابياً، مع الاستفادة من سرعة الاستعلامات وفهارس B-Tree المجمعة على خوادم فائقة الأداء.",
    },
  },
  {
    slug: "escpos-zatca-phase-2-thermal-printing",
    title: "نظرة عميقة في عتاد الكاشير: أوامر ESC/POS وتوليد رمز ZATCA Phase 2 QR المشفر",
    titleEn: "Deep Dive into POS Hardware: ESC/POS, TLV Base64 & ZATCA Phase 2 QR Codes",
    excerpt:
      "كيف يرسل ميزان نبضات فتح درج النقدية الكهرومغناطيسي، يطبع الفواتير الحرارية بمقاسي 80mm و58mm، ويولد رموز الاستجابة السريعة الضريبية المعتمدة.",
    category: "hardware",
    categoryLabel: "العتاد والأجهزة",
    readTime: "6 دقائق",
    date: "25 أكتوبر 2026",
    author: {
      name: "مهندس تكامل العتاد",
      role: "IoT & POS Hardware Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    content: {
      intro:
        "في بيئات التجزئة والسوبرماركت والمطاعم المزدحمة، لا مجال للانتظار. يجب أن تنتهي الفاتورة في أقل من ثوانٍ معدودة، يفتح درج الكاشير فورياً، ويخرج الإيصال الحراري بوضوح تام متضمناً الرمز الضريبي المعتمد من هيئات الزكاة والضرائب.",
      bodySections: [
        {
          title: "1. بروتوكول ESC/POS ونبضة درج الكاشير",
          text:
            "معظم طابعات الإيصالات الحرارية (Epson, Bixolon, Xprinter) تتصل بدرج النقدية عبر منفذ RJ11/RJ12. لإرسال نبضة فتح الدرج، نرسل تتابع البايتات ESC p 0 25 250:",
          codeBlock: {
            lang: "python",
            code: "# تتابع بايتات فتح درج النقدية عبر الطابعة الحرارية\nDRAWER_KICK = b'\\x1b\\x70\\x00\\x19\\xfa'\n\n# أمر القطع الجزئي للورق\nFEED_AND_CUT = b'\\x1d\\x56\\x42\\x00'",
          },
        },
        {
          title: "2. تشفير TLV Base64 لرمز الاستجابة السريعة الضريبي",
          text:
            "تتطلب هيئة الزكاة والضريبة والجمارك (ZATCA) في السعودية ومنظومة الفاتورة الإلكترونية (ETA) في مصر تشفير 5 علامات أساسية (اسم البائع، الرقم الضريبي، التوقيت، الإجمالي، والضريبة) بنظام Tag-Length-Value ثم تحويلها إلى Base64.",
        },
      ],
      conclusion:
        "يوفر موديول pos_hardware في ميزان هذه الوظائف مسبقاً لكل منشأة دون الحاجة لأي برامج وسيطة أو تعريفات معقدة.",
    },
  },
  {
    slug: "why-modular-erps-win",
    title: "لماذا تتفوق أنظمة الـ ERP المعيارية على الأنظمة التقليدية الجامدة في المنشآت النامية؟",
    titleEn: "Why Modular ERPs Outperform Monolithic Systems in Growing Enterprises",
    excerpt:
      "مقارنة عملية بين الأنظمة الكلاسيكية (SAP، Oracle، البرامج المكتبية) والجيل الجديد من منصات الـ ERP المعيارية القابلة للتخصيص اللحظي.",
    category: "accounting",
    categoryLabel: "إدارة الأعمال",
    readTime: "5 دقائق",
    date: "19 أكتوبر 2026",
    author: {
      name: "مستشار حلول الأعمال",
      role: "Enterprise Solutions Consultant",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    content: {
      intro:
        "لعقود طويلة، كانت أنظمة تخطيط الموارد المؤسسية مرادفة للتكلفة المرتفعة، عقود التنفيذ التي تمتد لأشهر أو سنوات، والواجهات المعقدة التي يصعب تدريب الموظفين عليها. اليوم، يعيد الجيل المعياري صياغة هذه المعادلة بالكامل.",
      bodySections: [
        {
          title: "1. ادفع مقابل ما تستخدمه فقط",
          text:
            "في ميزان ERP، إذا كنت تدير متجر تجزئة، فأنت لست مضطراً لرؤية شاشات المستشفيات أو حجز الطاولات. تفعل فقط: المخزون، نقطة البيع، والمالية. وحينما تقرر التوسع وفتح مطعم أو متجر إلكتروني، تفعل الموديول المناسب في ثانية واحدة.",
        },
        {
          title: "2. كشف حساب واحد ومخزون مركزي",
          text:
            "الميزة الكبرى في ميزان هي أن تفعيل أي موديول قطاعي يصب مباشرة في شجرة الحسابات العامة ودفتر الأستاذ الموحد، مما يمنح الإدارة المالية رؤية شاملة في الوقت الفعلي.",
        },
      ],
      conclusion:
        "المستقبل ينتمي للأنظمة الرشيقة التي تنمو مع المنشأة خطوة بخطوة بدلاً من إرهاقها بتكاليف تأسيسية باهظة.",
    },
  },
  {
    slug: "offline-first-cashier-velocity",
    title: "سرعة استجابة أقل من 10ms: هندسة محرك الكاشير الذي لا يتوقف عند انقطاع الإنترنت",
    titleEn: "Sub-10ms Cashier Velocity: Architecture of an Offline-First POS Engine",
    excerpt:
      "كيف تضمن بنية ميزان استمرار البيع والطباعة في طوابير الكاشير المزدحمة حتى عند انقطاع كابل الإنترنت بالكامل.",
    category: "retail",
    categoryLabel: "التجزئة والكاشير",
    readTime: "6 دقائق",
    date: "12 أكتوبر 2026",
    author: {
      name: "مهندس أداء النظم",
      role: "Performance Engineering",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    content: {
      intro:
        "توقف الكاشير لدقيقة واحدة في سوبرماركت أو مطعم في ساعة الذروة قد يعني خسارة عملاء وتكدس الطوابير. لذلك صُمم محرك البيع في ميزان بمفهوم Offline-First من اليوم الأول.",
      bodySections: [
        {
          title: "1. التخزين المؤقت في IndexedDB وSQLite",
          text:
            "يحتفظ التطبيق بنسخة محلية مشفرة من دليل الأصناف والأسعار وأرصدة المخزون، ويتم مسح الباركود واحتساب الضريبة محلياً في الذاكرة دون أي انتظار لرد الخادم السحابي.",
        },
        {
          title: "2. المزامنة التلقائية عند عودة الاتصال",
          text:
            "يتم تسجيل الفواتير في طابور محلي (Sync Queue) تُرقم بتسلسل مؤقت، ثم ترسل في الخلفية إلى PostgreSQL لتثبيتها وترحيل القيود المحاسبية دون إشعار الكاشير بأي انقطاع.",
        },
      ],
      conclusion:
        "تجمع هذه البنية بين سرعة البرامج المكتبية القديمة ومرونة وسهولة إدارة الأنظمة السحابية الحديثة.",
    },
  },
];
