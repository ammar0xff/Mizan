import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChefHat,
  Clock,
  GraduationCap,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { useModulesStore } from "@/stores/modules";
import { NAV_ITEMS } from "@/lib/nav";
import { Dialog, DialogContent, DialogTitle } from "@/components/kit/dialog";
import { Kbd } from "@/components/kit/kbd";
import { sound } from "@/lib/sound";

/* ── Ctrl+K global hotkey ─────────────────────────────────────── */
export function useHotkeySearch(open: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        sound.click();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

/* ── Trial banner — routes to pricing (the SaaS conversion loop) ── */
export function TrialBanner() {
  const { tenant } = useAuth();
  if (!tenant || tenant.plan !== "trial" || !tenant.trial_ends_at) return null;
  const days = Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86_400_000));
  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm">
      <span>
        <strong className="font-bold">تجربة مجانية</strong> — باقي{" "}
        <span className="num font-bold">{days}</span> يوم على «{tenant.name}»
      </span>
      <Link to="/pricing" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
        فعّل خطتك الآن
        <ArrowLeft className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

interface SearchProduct {
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  retail_price: string;
}

interface SearchCustomer {
  id: string;
  name: string;
  balance: string;
}

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  kbd?: string;
  group: "action" | "nav" | "product" | "customer" | "student" | "table";
  icon: React.ReactNode;
  run: () => void;
}

/* ── Precision Raycast/Linear Command Palette ──────────────────── */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { can } = useAuth();
  const { hasModule } = useModulesStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live queries when user searches 2+ chars
  const trimmed = q.trim();
  const shouldSearchLive = trimmed.length >= 2;

  const { data: searchProducts } = useQuery({
    queryKey: ["cmd-products", trimmed],
    queryFn: () => api.get<{ items: SearchProduct[] }>("/products", { search: trimmed, page_size: 5 }),
    enabled: open && shouldSearchLive,
    staleTime: 10_000,
  });

  const { data: searchCustomers } = useQuery({
    queryKey: ["cmd-customers", trimmed],
    queryFn: () => api.get<SearchCustomer[]>("/customers", { search: trimmed }),
    enabled: open && shouldSearchLive,
    staleTime: 10_000,
  });

  const { data: searchStudents } = useQuery({
    queryKey: ["cmd-students"],
    queryFn: () => api.get<any[]>("/modules/school/students"),
    enabled: open && shouldSearchLive && hasModule("school"),
    staleTime: 30_000,
  });

  const { data: searchTables } = useQuery({
    queryKey: ["cmd-tables"],
    queryFn: () => api.get<any[]>("/modules/restaurant/tables"),
    enabled: open && shouldSearchLive && hasModule("restaurant"),
    staleTime: 30_000,
  });

  // Static actions and navigation
  const staticItems = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [
      {
        id: "act-new-sale",
        label: "فاتورة بيع جديدة",
        hint: "نقطة البيع السريعة",
        kbd: "F2",
        group: "action",
        icon: <ShoppingCart className="size-4 text-primary" />,
        run: () => nav("/pos"),
      },
      {
        id: "act-new-product",
        label: "إضافة صنف جديد",
        hint: "الكتالوج",
        kbd: "N",
        group: "action",
        icon: <Plus className="size-4 text-emerald-500" />,
        run: () => nav("/products"),
      },
      {
        id: "act-new-shift",
        label: "إدارة وردية الصندوق",
        hint: "الورديات والخزائن",
        kbd: "S",
        group: "action",
        icon: <Clock className="size-4 text-amber-500" />,
        run: () => nav("/shifts"),
      },
      {
        id: "act-sales-log",
        label: "سجل الفواتير والمردودات",
        hint: "المبيعات",
        kbd: "V",
        group: "action",
        icon: <Receipt className="size-4 text-sky-500" />,
        run: () => nav("/sales"),
      },
    ];

    if (hasModule("restaurant")) {
      list.push({
        id: "act-dining-tables",
        label: "إدارة طاولات الصالة والضيافة",
        hint: "المطاعم والكافيهات",
        group: "action",
        icon: <UtensilsCrossed className="size-4 text-amber-500" />,
        run: () => nav("/restaurant/tables"),
      });
      list.push({
        id: "act-kds-kitchen",
        label: "شاشة تحضير المطبخ (KDS)",
        hint: "المطاعم والكافيهات",
        group: "action",
        icon: <ChefHat className="size-4 text-amber-500" />,
        run: () => nav("/restaurant/kitchen"),
      });
    }

    if (hasModule("school")) {
      list.push({
        id: "act-school-students",
        label: "شؤون الطلاب والأقساط الدراسية",
        hint: "المدارس والأكاديميات",
        group: "action",
        icon: <GraduationCap className="size-4 text-indigo-500" />,
        run: () => nav("/school/students"),
      });
    }

    for (const n of NAV_ITEMS) {
      if (n.perm && !can(n.perm)) continue;
      if (n.module && !hasModule(n.module)) continue;
      list.push({
        id: `nav-${n.to}`,
        label: n.label,
        hint: n.to === "/" ? "صحيفة اليوم" : n.to.replace("/", ""),
        group: "nav",
        icon: <n.icon className="size-4 text-muted-foreground" />,
        run: () => nav(n.to === "/" ? "/" : n.to),
      });
    }
    return list;
  }, [can, hasModule, nav]);

  // Combine static and live search results
  const allResults = useMemo<PaletteAction[]>(() => {
    let items = staticItems;
    if (trimmed) {
      items = staticItems.filter((i) => i.label.includes(trimmed) || (i.hint && i.hint.includes(trimmed)));
    }

    const dynamicItems: PaletteAction[] = [];

    // Add matching products
    if (searchProducts?.items && searchProducts.items.length > 0) {
      for (const p of searchProducts.items) {
        dynamicItems.push({
          id: `prod-${p.id}`,
          label: p.name,
          hint: `${p.retail_price} ج.م ${p.barcode ? `· ${p.barcode}` : ""}`,
          group: "product",
          icon: <Boxes className="size-4 text-indigo-400" />,
          run: () => nav(`/products?search=${encodeURIComponent(p.name)}`),
        });
      }
    }

    // Add matching customers
    if (Array.isArray(searchCustomers) && searchCustomers.length > 0) {
      for (const c of searchCustomers.slice(0, 3)) {
        dynamicItems.push({
          id: `cust-${c.id}`,
          label: c.name,
          hint: `رصيد: ${c.balance} ج.م`,
          group: "customer",
          icon: <Users className="size-4 text-teal-400" />,
          run: () => nav(`/customers`),
        });
      }
    }

    // Add matching school students
    if (Array.isArray(searchStudents) && searchStudents.length > 0) {
      const qLower = trimmed.toLowerCase();
      const matched = searchStudents.filter(
        (s) =>
          s.name?.toLowerCase().includes(qLower) ||
          s.code?.toLowerCase().includes(qLower) ||
          s.grade?.includes(qLower)
      );
      for (const s of matched.slice(0, 3)) {
        dynamicItems.push({
          id: `stu-${s.id}`,
          label: s.name,
          hint: `طالب (${s.grade}) · متبقي: ${s.balance_due} ج.م`,
          group: "student",
          icon: <GraduationCap className="size-4 text-indigo-400" />,
          run: () => nav("/school/students"),
        });
      }
    }

    // Add matching dining tables
    if (Array.isArray(searchTables) && searchTables.length > 0) {
      const qLower = trimmed.toLowerCase();
      const matched = searchTables.filter(
        (t) =>
          `طاولة ${t.number}`.includes(qLower) ||
          t.number.includes(qLower) ||
          t.section?.toLowerCase().includes(qLower)
      );
      for (const t of matched.slice(0, 3)) {
        dynamicItems.push({
          id: `tbl-${t.id}`,
          label: `طاولة رقم ${t.number} (${t.section})`,
          hint: `سعة ${t.capacity} أفراد · ${t.status === "occupied" ? "مشغولة حالياً" : "متاحة"}`,
          group: "table",
          icon: <UtensilsCrossed className="size-4 text-amber-500" />,
          run: () => nav("/restaurant/tables"),
        });
      }
    }

    return [...dynamicItems, ...items].slice(0, 14);
  }, [staticItems, trimmed, searchProducts, searchCustomers, searchStudents, searchTables, nav]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [q]);

  function executeItem(item: PaletteAction) {
    sound.click();
    onOpenChange(false);
    item.run();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % Math.max(1, allResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        executeItem(allResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[12%] translate-y-0 gap-0 overflow-hidden border border-border/80 bg-card p-0 shadow-2xl sm:max-w-xl dark:border-white/10 dark:bg-card/95 dark:backdrop-blur-xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">لوحة الأوامر السريعة</DialogTitle>

        {/* Input Bar */}
        <div className="flex h-14 items-center gap-3 border-b border-border/60 px-4">
          <Search className="size-5 shrink-0 text-muted-foreground/70" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب أمرًا، ابحث عن صنف، عميل، أو شاشة…"
            aria-label="لوحة الأوامر"
            className="h-full w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              مسح
            </button>
          )}
          <Kbd className="hidden sm:inline-flex">ESC</Kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2" role="listbox">
          {allResults.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة لـ «{q}»</p>
              <p className="mt-1 text-xs text-muted-foreground/60">جرّب البحث باسم الصنف، كود الباركود، أو الشاشة</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {allResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground font-medium shadow-xs"
                          : "text-foreground/80 hover:bg-muted/50"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                          {item.hint}
                        </span>
                      )}
                      {item.kbd && <Kbd>{item.kbd}</Kbd>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Terminal Footer Legend */}
        <div className="flex h-10 items-center justify-between border-t border-border/60 bg-muted/30 px-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3 font-mono">
            <span>
              <Kbd className="me-1">↑↓</Kbd> للتنقل
            </span>
            <span>
              <Kbd className="me-1">↵</Kbd> للاختيار
            </span>
            <span>
              <Kbd className="me-1">ESC</Kbd> للإغلاق
            </span>
          </div>
          <span className="font-semibold text-primary/80">ميزان · لوحة القيادة السريعة</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
