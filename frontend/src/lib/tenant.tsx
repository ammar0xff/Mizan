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
  // 1. Check Subdomain (e.g. monset-gym.vendora.com or monset-gym.localhost)
  if (hostname && !hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/) && hostname !== "localhost") {
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
  if (segments[0] === "c" && segments[1]) {
    const slug = segments[1];
    return { slug, root: `/c/${slug}`, isSubdomain: false };
  }

  // Pattern B: /:tenantSlug/* (where first segment is not a reserved SaaS path)
  if (!RESERVED_ROOT_PATHS.has(segments[0])) {
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
  const tenantSlug = parsed.slug || authTenant?.slug || null;

  // If the URL already has a prefix (/c/monset-gym or /monset-gym), use it.
  // Otherwise if authenticated with a tenant slug and not on subdomain, default to /c/:slug.
  let tenantRoot = parsed.root;
  if (!tenantRoot && !parsed.isSubdomain && authTenant?.slug && location.pathname !== "/admoon") {
    tenantRoot = `/c/${authTenant.slug}`;
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
    const current = location.pathname.replace(/\/+$/, "") || "/";
    const target = fullTarget.replace(/\/+$/, "") || "/";

    if (target === tenantRoot || target === "/") {
      return current === target;
    }

    return current === target || current.startsWith(`${target}/`);
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
