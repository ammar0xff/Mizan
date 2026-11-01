import { create } from "zustand";

export type Role = "admin" | "manager" | "cashier" | "storekeeper" | "accountant" | "superadmin";

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  permissions: string[];
  is_manager: boolean;
  is_superadmin?: boolean;
  default_warehouse_id: string | null;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug?: string | null;
  custom_domain?: string | null;
  sector: string;
  business_type?: string;
  scale: string;
  palette: { name?: string; hue?: number };
  features: string[];
  active_modules?: string[];
  plan: string;
  trial_ends_at: string | null;
  deployment_mode?: string;
  tech_stack?: Record<string, unknown>;
  limits?: Record<string, unknown>;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: TenantInfo | null;
  setTenant: (t: TenantInfo | null) => void;
  login: (token: string, user: User) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  can: (perm: string) => boolean;
}

const KEY = "vendora.session";

function persist(token: string | null, user: User | null, tenant: TenantInfo | null) {
  if (token) localStorage.setItem(KEY, JSON.stringify({ token, user, tenant }));
  else localStorage.removeItem(KEY);
}

/** Apply the tenant's chosen brand hue to the document (onboarding wizard option). */
export function applyBrandHue(hue?: number) {
  if (hue && Number.isFinite(hue)) {
    document.documentElement.style.setProperty("--brand-hue", String(Math.round(hue)));
  }
}

function load(): { token: string | null; user: User | null } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted session — start fresh */
  }
  return { token: null, user: null };
}

export const useAuth = create<AuthState>((set, get) => ({
  ...load(),
  tenant: null,
  setTenant: (tenant) => {
    set({ tenant });
    applyBrandHue(tenant?.palette?.hue);
    if (tenant) localStorage.setItem("vendora.tenant", JSON.stringify(tenant));
    else localStorage.removeItem("vendora.tenant");
  },
  login: (token, user) => {
    persist(token, user, get().tenant);
    set({ token, user });
  },
  setToken: (token) => {
    persist(token, get().user, get().tenant);
    set({ token });
  },
  setUser: (user) => {
    const token = get().token;
    if (token) localStorage.setItem(KEY, JSON.stringify({ token, user }));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem("vendora.tenant");
    set({ token: null, user: null, tenant: null });
  },
  can: (perm) => {
    const u = get().user;
    if (!u) return false;
    if (u.is_superadmin) return true;
    if (!perm) return true;
    const perms = Array.isArray(u.permissions) ? u.permissions : [];
    return perms.includes("*") || perms.includes(perm);
  },
}));
