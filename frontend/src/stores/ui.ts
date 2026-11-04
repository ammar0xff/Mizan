import { create } from "zustand";
import { isSoundMuted, setSoundMuted, sound } from "@/lib/sound";

export type ViewDensity = "compact" | "comfortable";
export type LayoutMode = "sidebar" | "rail" | "topnav";
export type ThemePalette = "mizan" | "slate" | "cobalt" | "emerald" | "amber" | "monokai";
export type ThemeMode = "light" | "dark";

export interface PaletteMeta {
  id: ThemePalette;
  name: string;
  nameEn: string;
  swatch: string;
  description: string;
}

export const THEME_PALETTES: PaletteMeta[] = [
  {
    id: "mizan",
    name: "ميزان الفاخر (Warm Editorial Luxury)",
    nameEn: "Mizan Editorial Luxury",
    swatch: "#651E2C",
    description: "الهوية الرسمية الفاخرة لمنظومة ميزان — درجات العنابي الملكي والأكس بلود وخلفية العاج الدافئ.",
  },
  {
    id: "slate",
    name: "سليت متوازن (Neutral SaaS)",
    nameEn: "Neutral Slate / Zinc",
    swatch: "oklch(0.42 0.02 250)",
    description: "مظهر حيادي راقٍ يعتمد على التباين الدقيق والحدود الصريحة دون تلوين إضافي.",
  },
  {
    id: "cobalt",
    name: "أزرق مؤسسي (Enterprise Cobalt)",
    nameEn: "Enterprise Cobalt",
    swatch: "oklch(0.45 0.16 250)",
    description: "نمط أنظمة تخطيط الموارد الكبرى (SAP / Oracle) ذو طابع رسمي وهادئ.",
  },
  {
    id: "emerald",
    name: "زمردي مالي (Emerald Ledger)",
    nameEn: "Emerald Finance",
    swatch: "oklch(0.48 0.14 155)",
    description: "مثالي للدفاتر المالية، التدقيق المحاسبي، وشركات التجارة وإدارة الخزائن.",
  },
  {
    id: "amber",
    name: "عنبري دافئ (Warm POS & Food)",
    nameEn: "Warm Hospitality",
    swatch: "oklch(0.58 0.16 75)",
    description: "مخصص للمطاعم، الكافيهات، ونقاط البيع السريعة لراحة العين وسرعة المسح البصري.",
  },
  {
    id: "monokai",
    name: "تباين داكن فائق (Terminal Contrast)",
    nameEn: "High-Contrast OLED",
    swatch: "oklch(0.2 0.01 255)",
    description: "تباين بصري حاد ودرجات أسود عميقة تناسب شاشات الكاشير والمستودعات لساعات العمل الطويلة.",
  },
];

export interface LayoutMeta {
  id: LayoutMode;
  name: string;
  nameEn: string;
  description: string;
}

export const LAYOUT_MODES: LayoutMeta[] = [
  {
    id: "sidebar",
    name: "الشريط الجانبي الكامل (Standard Sidebar)",
    nameEn: "Classic Sidebar",
    description: "تخطيط شجري كامل يضم أقسام العمليات والتوريد والمالية بوضوح.",
  },
  {
    id: "rail",
    name: "شريط أيقونات مصغّر (Compact Icon Rail)",
    nameEn: "Dense Rail",
    description: "يوفر أقصى مساحة أفقية للشاشات وجداول البيانات العريضة ونقاط البيع.",
  },
  {
    id: "topnav",
    name: "الشريط الأفقي العلوي (Top Navigation Bar)",
    nameEn: "Horizontal Top Nav",
    description: "قوائم منسدلة علوية كلاسيكية مستوحاة من أنظمة الـ ERP المكتبية.",
  },
];

interface UiState {
  // Density
  density: ViewDensity;
  setDensity: (d: ViewDensity) => void;
  toggleDensity: () => void;

  // Layout Mode
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  // Theme Palette
  palette: ThemePalette;
  setPalette: (p: ThemePalette) => void;

  // Dark/Light Mode
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;

  // Audio & Dialogs
  soundMuted: boolean;
  toggleSound: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  appearanceModalOpen: boolean;
  setAppearanceModalOpen: (open: boolean) => void;
}

const DENSITY_KEY = "mizan.density";
const LAYOUT_KEY = "mizan.layout";
const PALETTE_KEY = "mizan.palette";
const THEME_KEY = "mizan.theme";

function getInitialDensity(): ViewDensity {
  if (typeof window === "undefined") return "compact";
  const saved = localStorage.getItem(DENSITY_KEY) ?? localStorage.getItem("vendora.density");
  return saved === "comfortable" || saved === "compact" ? saved : "compact";
}

function getInitialLayout(): LayoutMode {
  if (typeof window === "undefined") return "sidebar";
  const saved = (localStorage.getItem(LAYOUT_KEY) ?? localStorage.getItem("vendora.layout")) as LayoutMode;
  return saved === "sidebar" || saved === "rail" || saved === "topnav" ? saved : "sidebar";
}

function getInitialPalette(): ThemePalette {
  if (typeof window === "undefined") return "mizan";
  const saved = (localStorage.getItem(PALETTE_KEY) ?? localStorage.getItem("vendora.palette")) as ThemePalette;
  return ["mizan", "slate", "cobalt", "emerald", "amber", "monokai"].includes(saved) ? saved : "mizan";
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY) ?? localStorage.getItem("vendora.theme");
  if (saved === "dark" || saved === "light") return saved;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyAllDomPreferences(
  density: ViewDensity,
  layout: LayoutMode,
  palette: ThemePalette,
  themeMode: ThemeMode
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-density", density);
  root.setAttribute("data-layout", layout);
  root.setAttribute("data-theme", palette);

  if (themeMode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// Initial bootstrap apply
if (typeof document !== "undefined") {
  applyAllDomPreferences(
    getInitialDensity(),
    getInitialLayout(),
    getInitialPalette(),
    getInitialThemeMode()
  );
}

export const useUiStore = create<UiState>((set, get) => ({
  density: getInitialDensity(),
  layoutMode: getInitialLayout(),
  palette: getInitialPalette(),
  themeMode: getInitialThemeMode(),
  soundMuted: isSoundMuted(),
  commandOpen: false,
  appearanceModalOpen: false,

  setDensity: (density: ViewDensity) => {
    localStorage.setItem(DENSITY_KEY, density);
    applyAllDomPreferences(density, get().layoutMode, get().palette, get().themeMode);
    sound.click();
    set({ density });
  },

  toggleDensity: () => {
    const next: ViewDensity = get().density === "compact" ? "comfortable" : "compact";
    localStorage.setItem(DENSITY_KEY, next);
    applyAllDomPreferences(next, get().layoutMode, get().palette, get().themeMode);
    sound.click();
    set({ density: next });
  },

  setLayoutMode: (layoutMode: LayoutMode) => {
    localStorage.setItem(LAYOUT_KEY, layoutMode);
    applyAllDomPreferences(get().density, layoutMode, get().palette, get().themeMode);
    sound.click();
    set({ layoutMode });
  },

  setPalette: (palette: ThemePalette) => {
    localStorage.setItem(PALETTE_KEY, palette);
    applyAllDomPreferences(get().density, get().layoutMode, palette, get().themeMode);
    sound.click();
    set({ palette });
  },

  setThemeMode: (themeMode: ThemeMode) => {
    localStorage.setItem(THEME_KEY, themeMode);
    applyAllDomPreferences(get().density, get().layoutMode, get().palette, themeMode);
    sound.click();
    set({ themeMode });
  },

  toggleThemeMode: () => {
    const next: ThemeMode = get().themeMode === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyAllDomPreferences(get().density, get().layoutMode, get().palette, next);
    sound.click();
    set({ themeMode: next });
  },

  toggleSound: () => {
    const nextMuted = !isSoundMuted();
    setSoundMuted(nextMuted);
    if (!nextMuted) sound.scan();
    set({ soundMuted: nextMuted });
  },

  setCommandOpen: (open: boolean) => {
    if (open) sound.click();
    set({ commandOpen: open });
  },

  setAppearanceModalOpen: (open: boolean) => {
    if (open) sound.click();
    set({ appearanceModalOpen: open });
  },
}));
