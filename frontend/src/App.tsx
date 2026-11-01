import { lazy, Suspense } from "react";
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const PosPage = lazy(() => import("@/features/pos/PosPage"));
const ProductsPage = lazy(() => import("@/features/products/ProductsPage"));
const SalesPage = lazy(() => import("@/features/sales/SalesPage"));
const PurchasesPage = lazy(() => import("@/features/purchases/PurchasesPage"));
const PayrollPage = lazy(() => import("@/features/hr/PayrollPage"));
const ShiftsPage = lazy(() => import("@/features/shifts/ShiftsPage"));
const CustomersPage = lazy(() => import("@/features/customers/CustomersPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const FinancePage = lazy(() => import("@/features/finance/FinancePage"));
const SuppliersPage = lazy(() => import("@/features/suppliers/SuppliersPage"));
const UsersPage = lazy(() => import("@/features/users/UsersPage"));
const HrPage = lazy(() => import("@/features/hr/HrPage"));
const InventoryPage = lazy(() => import("@/features/inventory/InventoryPage"));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));
const ArchivePage = lazy(() => import("@/features/archive/ArchivePage"));
const OperationsPage = lazy(() => import("@/features/operations/OperationsPage"));
const ModulesPage = lazy(() => import("@/features/modules/ModulesPage"));
const RestaurantTablesPage = lazy(() => import("@/features/restaurant/RestaurantTablesPage"));
const SchoolStudentsPage = lazy(() => import("@/features/school/SchoolStudentsPage"));
const AdmoonDashboard = lazy(() => import("@/features/admoon/AdmoonDashboard"));
const TenantScopeLayout = lazy(() => import("@/features/marketing/TenantScopeLayout"));
import { Link, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "@/features/marketing/LandingPage";
import PricingPage from "@/features/marketing/PricingPage";
import SignupPage from "@/features/marketing/SignupPage";
import OnboardingWizard from "@/features/marketing/OnboardingWizard";
import { Lock } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useModulesStore } from "@/stores/modules";
import { NAV_ITEMS } from "@/lib/nav";
import { useTenantNav } from "@/lib/tenant";
import { Button } from "@/components/kit/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/kit/empty";
import Shell from "@/components/AppShell";
import LoginPage from "@/features/auth/LoginPage";

function Page({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="grid place-items-center p-16"><span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></div>}>{children}</Suspense>;
}

function Guard({ perm, module, children }: { perm: string; module?: string; children: React.ReactNode }) {
  const { token, user, can } = useAuth();
  const hasModule = useModulesStore((s) => s.hasModule);
  const { tenantTo } = useTenantNav();

  if (!token || !user) return <Navigate to={tenantTo("/login")} replace />;
  if (module && !hasModule(module)) {
    return (
      <Empty className="mx-auto mt-16 max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lock />
          </EmptyMedia>
          <EmptyTitle>الوحدة غير مفعّلة في منشأتك</EmptyTitle>
          <EmptyDescription>
            هذه الشاشة تتطلب تفعيل وحدة متخصصة لمجال عملك. يمكنك تفعيلها فوراً بنقرة واحدة من مركز الوحدات والتطبيقات.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link to={tenantTo("/modules")} />}>
            الانتقال إلى مركز الوحدات والتطبيقات
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  if (perm && !can(perm)) {
    const fallback = NAV_ITEMS.find((n) => (!n.perm || can(n.perm)) && (!n.module || hasModule(n.module)));
    return (
      <Empty className="mx-auto mt-16 max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lock />
          </EmptyMedia>
          <EmptyTitle>لا تملك صلاحية الوصول</EmptyTitle>
          <EmptyDescription>
            دورك الحالي لا يتضمن هذه الشاشة. تواصل مع مدير النظام لمنحك الصلاحية، أو انتقل إلى شاشة متاحة لك.
          </EmptyDescription>
        </EmptyHeader>
        {fallback && (
          <EmptyContent>
            <Button nativeButton={false} render={<Link to={tenantTo(fallback.to)} />}>
              الانتقال إلى {fallback.label}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }
  return <Page>{children}</Page>;
}

/**
 * Reusable full suite of ERP modules, pages, and operational screens.
 * These are scoped inside the tenant root layout when a tenant prefix is present.
 */
function renderErpChildRoutes() {
  return (
    <>
      <Route index element={<Guard perm=""><DashboardPage /></Guard>} />
      <Route path="pos" element={<Guard perm="pos"><PosPage /></Guard>} />
      <Route path="products" element={<Guard perm="inventory"><ProductsPage /></Guard>} />
      <Route path="sales" element={<Guard perm="sales"><SalesPage /></Guard>} />
      <Route path="inventory" element={<Guard perm="inventory"><InventoryPage /></Guard>} />
      <Route path="operations" element={<Guard perm="operations"><OperationsPage /></Guard>} />
      <Route path="purchases" element={<Guard perm="purchases"><PurchasesPage /></Guard>} />
      <Route path="customers" element={<Guard perm="customers"><CustomersPage /></Guard>} />
      <Route path="suppliers" element={<Guard perm="customers"><SuppliersPage /></Guard>} />
      <Route path="finance" element={<Guard perm="finance"><FinancePage /></Guard>} />
      <Route path="hr" element={<Guard perm="payroll"><HrPage /></Guard>} />
      <Route path="hr/payroll" element={<Guard perm="payroll"><PayrollPage /></Guard>} />
      <Route path="shifts" element={<Guard perm="shifts"><ShiftsPage /></Guard>} />
      <Route path="archive" element={<Guard perm="archive"><ArchivePage /></Guard>} />
      <Route path="reports" element={<Guard perm="reports"><ReportsPage /></Guard>} />
      <Route path="users" element={<Guard perm="users"><UsersPage /></Guard>} />
      <Route path="settings" element={<Guard perm="settings"><SettingsPage /></Guard>} />
      <Route path="modules" element={<Guard perm=""><ModulesPage /></Guard>} />
      <Route path="restaurant/tables" element={<Guard perm="" module="restaurant"><RestaurantTablesPage /></Guard>} />
      <Route path="restaurant/kitchen" element={<Guard perm="" module="restaurant"><RestaurantTablesPage /></Guard>} />
      <Route path="school/students" element={<Guard perm="" module="school"><SchoolStudentsPage /></Guard>} />
      <Route path="login" element={<LoginPage />} />
    </>
  );
}

export default function App() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  return (
    <Routes>
      {/* SaaS Owner & Platform Control Plane */}
      <Route path="/admoon" element={<Page><AdmoonDashboard /></Page>} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/signup" element={token && user ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route path="/login" element={token && user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Pattern 1: Canonical Tenant Root at /c/:tenantSlug/* */}
      <Route path="/c/:tenantSlug" element={<Page><TenantScopeLayout /></Page>}>
        {renderErpChildRoutes()}
      </Route>

      {/* Pattern 2: Direct Tenant Root at /:tenantSlug/* (e.g. /monset-gym/pos) */}
      <Route path="/:tenantSlug" element={<Page><TenantScopeLayout /></Page>}>
        {renderErpChildRoutes()}
      </Route>

      {/* Fallback Root for Standalone Desktop / Subdomain deployments */}
      <Route
        path="/"
        element={token && user ? <Guard perm=""><Shell /></Guard> : <LandingPage />}
      >
        <Route index element={<Page><DashboardPage /></Page>} />
      </Route>

      {/* Direct top-level routes when authenticated without slug (e.g. desktop offline .exe) */}
      <Route
        element={
          <Guard perm="">
            <Shell />
          </Guard>
        }
      >
        {renderErpChildRoutes()}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
