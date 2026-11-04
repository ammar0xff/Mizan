import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useAuth, type TenantInfo } from "@/stores/auth";
import { useUiStore, type ThemePalette } from "@/stores/ui";
import { useModulesStore } from "@/stores/modules";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

export default function TenantResolverPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug || tenantSlug === "undefined" || tenantSlug === "null") {
      navigate("/", { replace: true });
      return;
    }

    async function resolve() {
      try {
        setLoading(true);
        setError(null);
        const tenant = await api.get<TenantInfo & { active_modules?: string[] }>(
          `/admoon/resolve-slug/${tenantSlug}`
        );

        // Apply tenant profile & branding
        useAuth.getState().setTenant(tenant);
        if (tenant.palette?.name) {
          useUiStore.getState().setPalette(tenant.palette.name as ThemePalette);
        }

        // Activate client's enabled modules
        if (tenant.active_modules && Array.isArray(tenant.active_modules)) {
          tenant.active_modules.forEach((modId) => {
            useModulesStore.getState().toggleModule(modId, true).catch(() => {});
          });
        }

        // If user is signed in to this tenant, go to dashboard, otherwise login
        const curUser = useAuth.getState().user;
        const curToken = useAuth.getState().token;
        if (curToken && curUser) {
          navigate("/", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        setError(
          err instanceof ApiError && err.status === 404
            ? `المنشأة ذات الرابط "${tenantSlug}" غير مسجلة في منصة ميزان ERP.`
            : "تعذر التحقق من بيانات المنشأة — حاول مجدداً"
        );
      } finally {
        setLoading(false);
      }
    }

    resolve();
  }, [tenantSlug, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground p-4">
        <div className="text-center space-y-3">
          <span className="inline-block size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">
            جارٍ تجهيز مساحة عمل <span className="font-bold text-foreground">/{tenantSlug}</span>...
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
            <Link to="/">
              <Button variant="outline" className="text-xs">
                الرئيسية
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="text-xs font-bold">
                تأسيس منشأة جديدة
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
