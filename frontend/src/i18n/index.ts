import { create } from "zustand";
import { translations } from "./translations";

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

interface I18nState {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, fallback?: string) => string;
}

const STORAGE_KEY = "vendora.locale";

function getInitialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ar" || saved === "en") return saved;
  return "ar";
}

function applyHtmlDirection(locale: Locale) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  if (dir === "ltr") {
    document.body.classList.add("ltr");
    document.body.classList.remove("rtl");
  } else {
    document.body.classList.add("rtl");
    document.body.classList.remove("ltr");
  }
}

// Initial application on file load
if (typeof window !== "undefined") {
  const initial = getInitialLocale();
  applyHtmlDirection(initial);
}

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: getInitialLocale(),
  dir: getInitialLocale() === "ar" ? "rtl" : "ltr",

  setLocale: (locale: Locale) => {
    localStorage.setItem(STORAGE_KEY, locale);
    applyHtmlDirection(locale);
    set({ locale, dir: locale === "ar" ? "rtl" : "ltr" });
  },

  toggleLocale: () => {
    const nextLocale: Locale = get().locale === "ar" ? "en" : "ar";
    get().setLocale(nextLocale);
  },

  t: (path: string, fallback?: string): string => {
    const currentLocale = get().locale;
    const dict = translations[currentLocale];
    const parts = path.split(".");

    let cursor: any = dict;
    for (const part of parts) {
      if (cursor && typeof cursor === "object" && part in cursor) {
        cursor = cursor[part];
      } else {
        return fallback || path;
      }
    }

    return typeof cursor === "string" ? cursor : fallback || path;
  },
}));

export function useTranslation() {
  const { locale, dir, setLocale, toggleLocale, t } = useI18nStore();
  return { locale, dir, setLocale, toggleLocale, t };
}
