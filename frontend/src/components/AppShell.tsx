import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, LogOut, Menu, Moon, Scale, Search, Settings, ShieldCheck, ShoppingCart, Sun, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { NAV_GROUPS, NAV_ITEMS, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";
import { Avatar, AvatarFallback } from "@/components/kit/avatar";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/kit/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/kit/sheet";
import { PageTransition } from "@/components/motion";
import { dateTime } from "@/lib/format";
import { CommandPalette, TrialBanner, useHotkeySearch } from "@/components/shell-parts";
import { useUiStore } from "@/stores/ui";
import { sound } from "@/lib/sound";
import { Kbd } from "@/components/kit/kbd";

interface Warehouse {
  id: string;
  name: string;
  kind?: string;
}

export function useBranch() {
  const user = useAuth((s) => s.user);
  const { data } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.get<Warehouse[]>("/stock/warehouses"),
    staleTime: 5 * 60_000,
  });
  const [branchId, setBranchId] = useState<string | null>(() => localStorage.getItem("vendora.branch"));
  const current = data?.find((w) => w.id === branchId) ?? data?.find((w) => w.id === user?.default_warehouse_id) ?? data?.[0];
  return { warehouses: data ?? [], branchId: current?.id ?? null, branchName: current?.name ?? "…", setBranchId };
}

function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation().pathname;
  const { can, tenant } = useAuth();
  const tenantTrialEnds = tenant?.trial_ends_at
    ? new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "long" }).format(new Date(tenant.trial_ends_at))
    : "";
  const visible = NAV_ITEMS.filter((n) => !n.perm || can(n.perm));
  const groups = (Object.keys(NAV_GROUPS) as NavItem["group"][])
    .map((g) => ({ id: g, label: NAV_GROUPS[g], items: visible.filter((n) => n.group === g) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Scale className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-bold">ميزان</span>
          <span className="truncate text-xs text-sidebar-foreground/60">{tenant?.name ?? "مساحة العمل"}</span>
        </div>
      </div>
      <nav aria-label="القائمة الرئيسية" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[11px] font-medium text-sidebar-foreground/50">{group.label}</p>
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring",
                      active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
      {/* Pinned quick access footer for compact displays */}
      <div className="shrink-0 border-t border-sidebar-border bg-sidebar/95 p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-1.5">
          {can("settings") && (
            <Link
              to="/settings"
              onClick={onNavigate}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname.startsWith("/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/70"
              )}
              title="إعدادات المتجر والنظام"
            >
              <Settings className="size-3.5" />
              <span>الإعدادات</span>
            </Link>
          )}

          {can("users") && (
            <Link
              to="/users"
              onClick={onNavigate}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname.startsWith("/users") ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/70"
              )}
              title="المستخدمون والصلاحيات"
            >
              <ShieldCheck className="size-3.5" />
              <span>المستخدمون</span>
            </Link>
          )}
        </div>

        {tenant?.plan === "trial" && (
          <Link to="/pricing" className="mb-2 block rounded-xl bg-sidebar-primary/15 p-2.5 ring-1 ring-sidebar-primary/30 transition hover:bg-sidebar-primary/25">
            <p className="text-xs font-bold text-sidebar-foreground">فعّل خطتك</p>
            <p className="mt-0.5 text-[10px] leading-4 text-sidebar-foreground/70">
              النسخة التجريبية حتى {tenantTrialEnds} — بياناتك محفوظة
            </p>
          </Link>
        )}
        <p className="px-1 text-[10px] text-sidebar-foreground/50">
          ميزان <span className="num">3.0</span> — نظام إدارة التجار
        </p>
      </div>
    </div>
  );
}

function AppTopbar({ onOpenMenu, onOpenSearch }: { onOpenMenu: () => void; onOpenSearch: () => void }) {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const { warehouses, branchId, branchName, setBranchId } = useBranch();
  const { density, toggleDensity, soundMuted, toggleSound } = useUiStore();

  const shift = useQuery({
    queryKey: ["shift", "topbar", branchId],
    queryFn: () => api.get<{ id: string; started_at: string } | null>("/shifts/current", { warehouse_id: branchId! }),
    enabled: !!branchId,
    retry: false,
    refetchInterval: 60_000,
  });

  function toggleTheme() {
    sound.click();
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("vendora.theme", dark ? "dark" : "light");
  }

  // Global F2 shortcut to jump to POS from any screen
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "F2" && window.location.pathname !== "/pos") {
        e.preventDefault();
        sound.click();
        navigate("/pos");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6 dark:border-white/10">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="فتح القائمة">
        <Menu className="size-4" />
      </Button>

      {/* Branch selector with tactile badge */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-2 px-2.5 font-medium" />}>
          <Building2 className="size-3.5 text-primary" data-icon="inline-start" />
          <span className="max-w-32 truncate text-xs">{branchName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>الفروع والمخازن</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={branchId ?? ""}
              onValueChange={(v) => {
                sound.click();
                localStorage.setItem("vendora.branch", String(v));
                setBranchId(String(v));
              }}
            >
              {warehouses.map((b) => (
                <DropdownMenuRadioItem key={b.id} value={b.id}>
                  {b.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Shift Indicator */}
      <Link to="/shifts" className="hidden sm:block">
        {shift.data ? (
          <Badge variant="success" className="h-6 gap-1.5 px-2 text-[11px] font-semibold">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            وردية نشطة · <span className="num">{dateTime(shift.data.started_at)}</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="h-6 gap-1.5 px-2 text-[11px]">
            <Clock className="size-3 text-muted-foreground" aria-hidden />
            بدون وردية
          </Badge>
        )}
      </Link>

      <div className="ms-auto flex items-center gap-1.5">
        {/* Quick F2 POS Jump */}
        <Link
          to="/pos"
          onClick={() => sound.click()}
          className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
        >
          <ShoppingCart className="size-3.5" />
          <span>نقطة البيع</span>
          <Kbd className="border-primary/20 bg-primary/15 text-primary">F2</Kbd>
        </Link>

        {/* Search Command Palette Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:bg-accent md:flex md:w-56"
          aria-label="بحث شامل (Ctrl+K)"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1 text-start">ابحث أو أمر…</span>
          <Kbd>⌘K</Kbd>
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onOpenSearch} aria-label="بحث شامل">
          <Search className="size-4" />
        </Button>

        {/* View Density Switcher */}
        <button
          onClick={toggleDensity}
          title={density === "compact" ? "التحويل للوضع المريح" : "التحويل لوضع الكثافة العالية"}
          className="flex h-8 items-center gap-1 rounded-md border border-border/80 px-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
            {density === "compact" ? "كثيف" : "مريح"}
          </span>
        </button>

        {/* Audio Feedback Toggle */}
        <button
          onClick={toggleSound}
          title={soundMuted ? "تفعيل الأصوات التفاعلية" : "كتم الأصوات"}
          className={`flex h-8 w-8 items-center justify-center rounded-md border border-border/80 transition hover:bg-accent ${
            soundMuted ? "text-muted-foreground" : "text-primary"
          }`}
        >
          <span className="sr-only">الأصوات</span>
          {soundMuted ? (
            <span className="font-mono text-[11px] opacity-60">🔇</span>
          ) : (
            <span className="font-mono text-[11px]">🔔</span>
          )}
        </button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="تبديل الوضع الليلي" onClick={toggleTheme}>
          <Sun className="size-4 dark:hidden" />
          <Moon className="size-4 hidden dark:block" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 gap-2 px-1.5" />} aria-label="قائمة المستخدم">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs font-semibold">{(user?.full_name ?? "؟").split(" ")[0].slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start leading-tight md:flex">
              <span className="text-xs font-medium">{user?.full_name}</span>
              <span className="text-[10px] text-muted-foreground">{tenant?.plan === "trial" ? "تجربة مجانية" : tenant?.name ?? user?.role}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <UserRound className="size-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  sound.click();
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="size-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useLocation().pathname;
  useHotkeySearch(() => setSearchOpen(true));

  return (
    <div className="flex min-h-svh">
      <aside className="no-print sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
        <AppSidebar />
      </aside>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-72 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
          <AppSidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <TrialBanner />
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <PageTransition routeKey={pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
