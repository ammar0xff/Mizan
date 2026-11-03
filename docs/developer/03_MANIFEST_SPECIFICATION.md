# Mizan ERP — Manifest Specification (`manifest.json`)

**Target Audience:** Module authors, integration engineers, core platform developers.  
**Platform Version:** Mizan 3.0 (Modular Enterprise Architecture)

---

## 1. Overview

Every Mizan module **must** contain a `manifest.json` file in its root directory. The manifest serves as the contract between the module and the Mizan engine. It defines the module's identity, category, dependencies, navigation hooks, and dynamic settings schema.

The engine parses the manifest during auto-discovery (`loader.py`), registers its endpoints, and uses its configuration schema to render zero-code management interfaces.

---

## 2. Complete Field Reference

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Yes** | Unique identifier slug in `snake_case` (e.g. `pos_hardware`, `zk_attendance`). |
| `name` | `string` | **Yes** | Localized display name in Arabic (e.g. `إدارة أجهزة نقاط البيع والطباعة`). |
| `name_en` | `string` | **Yes** | Localized display name in English (e.g. `POS Hardware & Printing`). |
| `category` | `string` | **Yes** | Category identifier matching `categories.json` (see Section 3). |
| `version` | `string` | **Yes** | Semantic version string (e.g. `1.0.0`, `3.0.0`). |
| `icon` | `string` | **Yes** | Name of the Lucide icon used in the UI (e.g. `Printer`, `Boxes`, `Cpu`). |
| `description` | `string` | **Yes** | Detailed overview of module capabilities and business scope. |
| `author` | `string` | No | Author or organization name (e.g. `Mizan Engineering Team`). |
| `website` | `string` | No | Documentation or vendor website URL. |
| `license` | `string` | No | Software license (e.g. `Proprietary`, `MIT`). |
| `is_core` | `boolean` | No | If `true`, the module cannot be deactivated by tenants (Default: `false`). |
| `badge` | `string` | No | Optional badge text displayed on the module card (e.g. `جديد`, `عتاد`). |
| `target_business_types` | `array[string]` | No | Vertical presets this module targets (e.g. `["retail", "restaurant"]`). |
| `dependencies` | `array[string]` | No | List of prerequisite module IDs that must be active for this module to run. |
| `nav_items` | `array[object]` | No | Navigation items injected into Mizan sidebar and launcher (see Section 4). |
| `settings_schema` | `array[object]` | No | Declarative configuration fields rendered in the UI (see Section 5). |

---

## 3. Supported Categories

Module categories are defined in `backend/app/modules/categories.json`. The standard categories are:

| Category ID | Arabic Name | English Name | Examples |
| :--- | :--- | :--- | :--- |
| `core` | النواة الأساسية | Core System | `core`, `inventory`, `sales`, `purchases`, `finance`, `hr` |
| `retail` | التجارة والتجزئة | Retail & Commerce | `pos`, `wholesale`, `ecommerce` |
| `hospitality` | الضيافة والمطاعم | Hospitality & Dining | `restaurant`, `kitchen_display`, `hospitality` |
| `healthcare` | الرعاية الصحية | Healthcare & Medical | `clinic`, `pharmacy`, `phm` |
| `distribution_logistics` | التوزيع واللوجستيات | Logistics & Warehousing | `logistics`, `wms` |
| `manufacturing` | الصناعة والإنتاج | Manufacturing & Packaging | `mfg`, `fod`, `prn` |
| `infrastructure_projects` | البنية التحتية والمقاولات | Infrastructure & Real Estate | `cst`, `rec`, `agr`, `eng` |
| `specialized` | القطاعات المتخصصة | Specialized Verticals | `bnk`, `ins`, `gov`, `ent`, `oil` |
| `hardware_iot` | العتاد والأتمتة | Hardware & Automation | `pos_hardware`, `zk_attendance`, `automation_worker` |

---

## 4. Navigation Items Schema (`nav_items`)

Modules can declare navigation items that automatically appear in the tenant's sidebar or Mizan App Launcher when the module is activated.

```json
"nav_items": [
  {
    "id": "restaurant_kds",
    "label": "شاشة المطبخ (KDS)",
    "label_en": "Kitchen Display",
    "path": "/restaurant/kitchen",
    "icon": "UtensilsCrossed",
    "permission": "pos.view"
  }
]
```

### Nav Item Attributes:
- **`id`** (`string`, required): Unique item key.
- **`label`** (`string`, required): Arabic title.
- **`label_en`** (`string`, required): English title.
- **`path`** (`string`, required): Relative route within the tenant app (e.g. `/c/:slug/restaurant/kitchen`).
- **`icon`** (`string`, required): Lucide icon identifier.
- **`permission`** (`string`, optional): Security permission string required to view this link.

---

## 5. Declarative Settings Schema (`settings_schema`)

The `settings_schema` enables **zero-code UI generation**. When specified, Mizan renders an interactive configuration panel with input validation and persistence.

### Field Attributes:
- **`key`** (`string`, required): Unique parameter key in snake_case.
- **`label`** (`string`, required): Localized field title in Arabic.
- **`type`** (`string`, required): Data type. Supported types:
  - `string`: Single-line text input.
  - `number`: Numeric input with stepper.
  - `boolean`: High-contrast toggle switch.
  - `select`: Dropdown menu (requires `options` array).
- **`default`** (`any`, required): Initial value if not yet configured by the tenant.
- **`description`** (`string`, optional): Explanatory help text or tooltip.
- **`options`** (`array[string]`, required for `select`): Available selectable options.

---

## 6. Real-World Concrete Examples

### Example 1: Hardware Integration Module (`pos_hardware/manifest.json`)

```json
{
  "id": "pos_hardware",
  "name": "إدارة أجهزة نقاط البيع والطباعة الحرارية",
  "name_en": "POS Hardware & Thermal Printing",
  "category": "hardware_iot",
  "version": "1.0.0",
  "icon": "Printer",
  "description": "تهيئة الطابعات الحرارية (80mm/58mm)، إرسال نبضات فتح درج الكاشير (ESC/POS)، توليد الباركود والفواتير المتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك.",
  "dependencies": ["core", "pos"],
  "is_core": false,
  "badge": "عتاد",
  "settings_schema": [
    {
      "key": "paper_width",
      "label": "عرض ورق الطباعة الحرارية",
      "type": "select",
      "default": "80mm",
      "options": ["80mm", "58mm"],
      "description": "اختر المقاس القياسي (80 مم) أو المقاس المدمج (58 مم)"
    },
    {
      "key": "auto_print",
      "label": "طباعة الإيصال تلقائياً فور الدفع",
      "type": "boolean",
      "default": true,
      "description": "تفعيل أمر الطباعة المباشر إلى الطابعة الافتراضية"
    },
    {
      "key": "show_tax_qr",
      "label": "إظهار رمز الاستجابة السريعة الضريبي (ZATCA / ETA QR)",
      "type": "boolean",
      "default": true,
      "description": "تضمين رمز QR المشفر بصيغة TLV Base64"
    },
    {
      "key": "cash_drawer_pulse",
      "label": "نبضة فتح درج النقدية الكهرومغناطيسي",
      "type": "boolean",
      "default": true,
      "description": "إرسال أمر النبضة ESC p 0 25 250 عبر كابل RJ11/RJ12"
    },
    {
      "key": "header_note",
      "label": "ترويسة الفاتورة المطبوعة",
      "type": "string",
      "default": "أهلاً وسهلاً بكم — نسعد بخدمتكم دائماً",
      "description": "النص الترحيبي أعلى الإيصال الحراري"
    },
    {
      "key": "footer_note",
      "label": "تذييل الفاتورة والشروط",
      "type": "string",
      "default": "البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب الفاتورة",
      "description": "سياسة الاستبدال والضمان أسفل الإيصال"
    }
  ]
}
```

### Example 2: Vertical Industry Module (`restaurant/manifest.json`)

```json
{
  "id": "restaurant",
  "name": "إدارة المطاعم والكافيهات",
  "name_en": "Restaurant & Hospitality",
  "category": "hospitality",
  "version": "1.0.0",
  "icon": "UtensilsCrossed",
  "description": "مخطط صالة الطعام وحجز الطاولات، شاشات المطبخ اللحظية (KDS)، ووصفات المأكولات وخصم المكونات (BOM).",
  "dependencies": ["core", "pos", "inventory"],
  "is_core": false,
  "badge": "جديد",
  "target_business_types": ["restaurant", "cafe", "cloud_kitchen"],
  "nav_items": [
    {
      "id": "restaurant_tables",
      "label": "مخطط الصالة والطاولات",
      "label_en": "Floor Tables Plan",
      "path": "/restaurant/tables",
      "icon": "LayoutGrid"
    },
    {
      "id": "restaurant_kds",
      "label": "شاشة المطبخ (KDS)",
      "label_en": "Kitchen Orders",
      "path": "/restaurant/kitchen",
      "icon": "UtensilsCrossed"
    },
    {
      "id": "restaurant_recipes",
      "label": "الوصفات والمكونات (BOM)",
      "label_en": "Recipes & Food Cost",
      "path": "/restaurant/recipes",
      "icon": "BookOpen"
    }
  ],
  "settings_schema": [
    {
      "key": "auto_backflush_inventory",
      "label": "خصم المكونات الخام تلقائياً عند طلب الوجبة",
      "type": "boolean",
      "default": true,
      "description": "خصم المقادير المسجلة في شجرة الوصفة من المستودع مباشرة"
    },
    {
      "key": "default_table_turnover_minutes",
      "label": "متوسط فترة جلوس الطاولة (بالدقائق)",
      "type": "number",
      "default": 45,
      "description": "الفترة التقديرية لتحرير الطاولة بعد بدء الطلب"
    }
  ]
}
```
