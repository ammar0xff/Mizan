import { useLocation, Link, type LinkProps } from "react-router-dom";
import { useAuth } from "@/stores/auth";

export const RESERVED_ROOT_PATHS = new Set([
  "admoon",
  "pricing",
  "signup",
  "onboarding",
  "login",
  "c",
  "assets",
  "static",
  "api",
  "sw.js",
  "robots.txt",
  "favicon.ico",
  "pos",
  "products",
  "sales",
  "inventory",
  "operations",
  "purchases",
  "customers",
  "suppliers",
  "finance",
  "hr",
  "shifts",
  "archive",
  "reports",
  "users",
  "settings",
  "modules",
  "pharmacy",
  "restaurant",
  "school",
  "services",
  "wholesale",
  "logistics",
  "wms",
  "ecommerce",
  "clinic",
  "law",
  "travel",
  "hospitality",
  "gym",
  "salon",
  "agency",
  "field-service",
  "mfg",
  "fod",
  "phm",
  "prn",
  "cst",
  "rec",
  "agr",
  "eng",
  "bnk",
  "ins",
  "gov",
  "ent",
  "oil",
]);

export interface TenantRouteInfo {
  slug: string | null;
  root: string;
  isSubdomain: boolean;
}

/**
 * Extracts tenant slug and base route prefix from hostname or pathname.
 */
export function parseTenantFromLocation(
  pathname: string = window.location.pathname,
  hostname: string = window.location.hostname
): TenantRouteInfo {
  // 1. Check Subdomain (e.g. monset-gym.mizan.app or monset-gym.localhost)
  // Only treat as a tenant subdomain on the app's own domains, not on hosting
  // preview URLs (vercel.app, netlify.app, ...) where the first label is a
  // deploy hash, not a tenant slug.
  const isAppHost =
    hostname === "localhost" ||
    hostname.endsWith(".mizan.app") ||
    hostname.endsWith(".mizan.com") ||
    hostname.endsWith(".mizan.io");
  if (isAppHost && hostname && !hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
    const parts = hostname.split(".");
    if (parts.length >= 3 || (parts.length === 2 && parts[1] === "localhost")) {
      const sub = parts[0].toLowerCase();
      if (!["www", "app", "api", "admin", "mail"].includes(sub)) {
        return { slug: sub, root: "", isSubdomain: true };
      }
    }
  }

  // 2. Check Pathname inside React Router
  // Note: if Vite basename is active, React Router's location.pathname strips the base automatically.
  // We clean up any duplicate or trailing slashes.
  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  const segments = cleanPath ? cleanPath.split("/") : [];

  if (segments.length === 0) {
    return { slug: null, root: "", isSubdomain: false };
  }

  // Pattern A: /c/:tenantSlug/*
  if (segments[0] === "c" && segments[1] && segments[1] !== "undefined" && segments[1] !== "null") {
    const slug = segments[1];
    return { slug, root: `/c/${slug}`, isSubdomain: false };
  }

  // Pattern B: /:tenantSlug/* (where first segment is not a reserved SaaS path)
  if (!RESERVED_ROOT_PATHS.has(segments[0]) && segments[0] !== "undefined" && segments[0] !== "null") {
    const slug = segments[0];
    return { slug, root: `/${slug}`, isSubdomain: false };
  }

  return { slug: null, root: "", isSubdomain: false };
}

/**
 * Hook providing tenant-aware navigation, route scoping, and link resolution.
 */
export function useTenantNav() {
  const location = useLocation();
  const authTenant = useAuth((s) => s.tenant);

  const parsed = parseTenantFromLocation(location.pathname);
  const validAuthSlug = authTenant?.slug && authTenant.slug !== "undefined" && authTenant.slug !== "null" ? authTenant.slug : null;
  const tenantSlug = parsed.slug || validAuthSlug || null;

  // If the URL already has a prefix (/c/monset-gym or /monset-gym), use it.
  // Otherwise if authenticated with a tenant slug and not on subdomain, default to /c/:slug.
  let tenantRoot = parsed.root;
  if (!tenantRoot && !parsed.isSubdomain && validAuthSlug && location.pathname !== "/admoon") {
    tenantRoot = `/c/${validAuthSlug}`;
  }

  /**
   * Transforms any internal ERP route (e.g. "/pos", "/", "/settings")
   * into a tenant-scoped route (e.g. "/c/monset-gym/pos" or "/monset-gym/pos").
   */
  const tenantTo = (path: string): string => {
    // Keep absolute external or reserved URLs untouched
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("mailto:")) {
      return path;
    }
    const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

    if (!tenantRoot) {
      return clean || "/";
    }

    return clean ? `${tenantRoot}${clean}` : tenantRoot;
  };

  /**
   * Checks whether a given ERP route is currently active, accounting for tenant prefixes.
   */
  const isPathActive = (targetPath: string): boolean => {
    const fullTarget = tenantTo(targetPath);
    const [targetPathWithoutQuery, targetQuery] = fullTarget.split("?");
    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
    const targetPathClean = targetPathWithoutQuery.replace(/\/+$/, "") || "/";

    if (targetQuery) {
      if (currentPath !== targetPathClean) return false;
      const currentSearchParams = new URLSearchParams(location.search);
      const targetSearchParams = new URLSearchParams(targetQuery);
      let match = true;
      targetSearchParams.forEach((val, key) => {
        if (currentSearchParams.get(key) !== val) {
          match = false;
        }
      });
      return match;
    }

    if (targetPathClean === tenantRoot || targetPathClean === "/") {
      return currentPath === targetPathClean && !location.search;
    }

    return currentPath === targetPathClean || currentPath.startsWith(`${targetPathClean}/`);
  };

  return {
    tenantSlug,
    tenantRoot,
    isSubdomain: parsed.isSubdomain,
    tenantTo,
    isPathActive,
  };
}

/**
 * Drop-in replacement for React Router <Link> that automatically preserves the tenant root.
 */
export function TenantLink({ to, ...props }: LinkProps) {
  const { tenantTo } = useTenantNav();
  const dest = typeof to === "string" ? tenantTo(to) : to;
  return <Link to={dest} {...props} />;
}
