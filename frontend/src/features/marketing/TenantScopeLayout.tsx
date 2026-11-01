import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useAuth, type TenantInfo } from "@/stores/auth";
import { useUiStore, type ThemePalette } from "@/stores/ui";
import { useModulesStore } from "@/stores/modules";
import Shell from "@/components/AppShell";
import LoginPage from "@/features/auth/LoginPage";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/kit/button";
import { RESERVED_ROOT_PATHS } from "@/lib/tenant";

export default function TenantScopeLayout() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const tenant = useAuth((s) => s.tenant);
  const setTenant = useAuth((s) => s.setTenant);

  // If path matched /:tenantSlug but it's actually a reserved platform slug, let outer routes handle it
  if (tenantSlug && RESERVED_ROOT_PATHS.has(tenantSlug.toLowerCase())) {
    return <Navigate to={`/${tenantSlug}`} replace />;
  }

  useEffect(() => {
    if (!tenantSlug) {
      setLoading(false);
      return;
    }

    // If current tenant in memory already matches the slug, skip re-fetching
    if (tenant?.slug === tenantSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function resolveTenant() {
      try {
        setLoading(true);
        setError(null);
        const resolved = await api.get<TenantInfo & { active_modules?: string[] }>(
          `/admoon/resolve-slug/${tenantSlug}`
        );
        if (!isMounted) return;

        setTenant(resolved);
        if (resolved.palette?.name) {
          useUiStore.getState().setPalette(resolved.palette.name as ThemePalette);
        }
        if (resolved.active_modules && Array.isArray(resolved.active_modules)) {
          resolved.active_modules.forEach((modId) => {
            useModulesStore.getState().toggleModule(modId, true).catch(() => {});
          });
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? `المنشأة ذات الرابط "${tenantSlug}" غير مسجلة في منظومة ميزان.`
            : "تعذر التحقق من بيانات المنشأة — حاول مجدداً"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolveTenant();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug, tenant?.slug, setTenant]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground p-4">
        <div className="text-center space-y-3">
          <span className="inline-block size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">
            جارٍ تجهيز مساحة عمل المنشأة <span className="font-bold text-foreground">/{tenantSlug}</span>...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-base font-bold text-foreground">تعذر العثور على المنشأة</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/"}>
              الرئيسية
            </Button>
            <Button size="sm" className="font-bold" onClick={() => window.location.href = "/signup"}>
              تأسيس منشأة جديدة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is logged in AND belongs to this tenant (or is superadmin)
  const userTenantId = user?.tenant_id || (user as unknown as { tenant?: { id?: string } })?.tenant?.id;
  const isTenantAuthenticated = Boolean(
    token && user && (user.is_superadmin || !tenant?.id || userTenantId === tenant.id)
  );

  // If not authenticated for this tenant, show the customized LoginPage
  if (!isTenantAuthenticated) {
    return <LoginPage tenant={tenant} tenantSlug={tenantSlug} />;
  }

  // Authenticated: Shell acts as the layout container with its <Outlet />
  return <Shell />;
}
