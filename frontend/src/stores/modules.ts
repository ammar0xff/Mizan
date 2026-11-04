import { create } from "zustand";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";

export interface SettingField {
  key: string;
  label: string;
  type: "boolean" | "number" | "string" | "select";
  default: any;
  description: string;
  options?: string[];
}

export interface ModuleManifest {
  id: string;
  name: string;
  name_en: string;
  category: string;
  version: string;
  icon: string;
  description: string;
  dependencies: string[];
  is_core: boolean;
  is_installed: boolean;
  badge?: string | null;
  target_business_types?: string[];
  settings_schema?: SettingField[];
}

export interface BusinessPreset {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  badge: string;
  description: string;
  modules: string[];
}

interface ModulesState {
  activePreset: string;
  activeModules: string[];
  catalog: ModuleManifest[];
  presets: BusinessPreset[];
  isLoaded: boolean;
  isLoading: boolean;
  fetchModules: () => Promise<void>;
  hasModule: (moduleId: string) => boolean;
  applyPreset: (presetId: string) => Promise<boolean>;
  toggleModule: (moduleId: string, enabled: boolean) => Promise<boolean>;
  fetchModuleSettings: (moduleId: string) => Promise<{ schema: SettingField[]; values: Record<string, any> }>;
  saveModuleSettings: (moduleId: string, settings: Record<string, any>) => Promise<boolean>;
}

const DEFAULT_ACTIVE = ["core", "inventory", "pos", "finance", "hr"];

export const useModulesStore = create<ModulesState>((set, get) => ({
  activePreset: localStorage.getItem("mizan.active_preset") || localStorage.getItem("vendora.active_preset") || "retail",
  activeModules: (() => {
    try {
      const saved = localStorage.getItem("mizan.active_modules") || localStorage.getItem("vendora.active_modules");
      return saved ? JSON.parse(saved) : DEFAULT_ACTIVE;
    } catch {
      return DEFAULT_ACTIVE;
    }
  })(),
  catalog: [],
  presets: [],
  isLoaded: false,
  isLoading: false,

  fetchModules: async () => {
    try {
      set({ isLoading: true });
      const data = await api.get<{
        active_preset: string;
        active_modules: string[];
        catalog: ModuleManifest[];
        presets: BusinessPreset[];
      }>("/modules");

      localStorage.setItem("mizan.active_preset", data.active_preset);
      localStorage.setItem("mizan.active_modules", JSON.stringify(data.active_modules));

      set({
        activePreset: data.active_preset,
        activeModules: data.active_modules,
        catalog: data.catalog,
        presets: data.presets,
        isLoaded: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  hasModule: (moduleId: string) => {
    if (!moduleId || moduleId === "core") return true;
    return get().activeModules.includes(moduleId);
  },

  applyPreset: async (presetId: string) => {
    try {
      sound.click();
      const res = await api.post<{
        detail: string;
        active_preset: string;
        active_modules: string[];
      }>("/modules/presets/apply", { preset_id: presetId });

      sound.success();
      localStorage.setItem("mizan.active_preset", res.active_preset);
      localStorage.setItem("mizan.active_modules", JSON.stringify(res.active_modules));

      set((state) => ({
        activePreset: res.active_preset,
        activeModules: res.active_modules,
        catalog: state.catalog.map((m) => ({
          ...m,
          is_installed: res.active_modules.includes(m.id),
        })),
      }));
      return true;
    } catch (e) {
      sound.error();
      return false;
    }
  },

  toggleModule: async (moduleId: string, enabled: boolean) => {
    try {
      sound.click();
      const res = await api.post<{
        detail: string;
        active_modules: string[];
      }>(`/modules/${moduleId}/toggle`, { enabled });

      sound.success();
      localStorage.setItem("mizan.active_modules", JSON.stringify(res.active_modules));

      set((state) => ({
        activeModules: res.active_modules,
        catalog: state.catalog.map((m) => ({
          ...m,
          is_installed: res.active_modules.includes(m.id),
        })),
      }));
      return true;
    } catch (e) {
      sound.error();
      throw e;
    }
  },

  fetchModuleSettings: async (moduleId: string) => {
    return await api.get<{
      module_id: string;
      module_name: string;
      schema: SettingField[];
      values: Record<string, any>;
    }>(`/modules/${moduleId}/settings`);
  },

  saveModuleSettings: async (moduleId: string, settings: Record<string, any>) => {
    try {
      sound.click();
      await api.post(`/modules/${moduleId}/settings`, { settings });
      sound.success();
      return true;
    } catch (e) {
      sound.error();
      throw e;
    }
  },
}));
