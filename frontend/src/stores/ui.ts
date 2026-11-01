import { create } from "zustand";
import { isSoundMuted, setSoundMuted, sound } from "@/lib/sound";

export type ViewDensity = "compact" | "comfortable";

interface UiState {
  density: ViewDensity;
  setDensity: (d: ViewDensity) => void;
  toggleDensity: () => void;
  soundMuted: boolean;
  toggleSound: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

const DENSITY_KEY = "mizan.density";

function getInitialDensity(): ViewDensity {
  if (typeof window === "undefined") return "compact";
  const saved = localStorage.getItem(DENSITY_KEY);
  if (saved === "comfortable" || saved === "compact") return saved;
  return "compact";
}

function applyDensity(d: ViewDensity) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-density", d);
  }
}

// Initial apply
if (typeof document !== "undefined") {
  applyDensity(getInitialDensity());
}

export const useUiStore = create<UiState>((set) => ({
  density: getInitialDensity(),
  setDensity: (density: ViewDensity) => {
    localStorage.setItem(DENSITY_KEY, density);
    applyDensity(density);
    sound.click();
    set({ density });
  },
  toggleDensity: () => {
    set((state) => {
      const next: ViewDensity = state.density === "compact" ? "comfortable" : "compact";
      localStorage.setItem(DENSITY_KEY, next);
      applyDensity(next);
      sound.click();
      return { density: next };
    });
  },
  soundMuted: isSoundMuted(),
  toggleSound: () => {
    const nextMuted = !isSoundMuted();
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      sound.scan(); // audible feedback on unmute
    }
    set({ soundMuted: nextMuted });
  },
  commandOpen: false,
  setCommandOpen: (open: boolean) => {
    if (open) sound.click();
    set({ commandOpen: open });
  },
}));
