/**
 * PAGE CONTRACT
 * Page: نقطة البيع (/pos)
 * User: كاشير يخدم عميلًا أماميًا تحت ضغط الوقت
 * Outcome: إتمام بيع (نقدي/آجل/مقسّم) بسرعة ميكانيكية فائقة أو تعليق الفاتورة
 * Primary information: باركود/بحث المنتجات، إيصال الفاتورة الحالية (.receipt-paper)، الإجمالي، حالة الوردية
 * Hardware Velocity: F1 بحث · F2 كاش · F3 آجل · F4 تعليق/استئناف · F8 جملة/تجزئة · F9 مسح · Esc إغلاق
 * Tactile Feedback: نقرات صوتية اصطناعية لكل مسح باركود وإضافة وزيادة ونقصان وإتمام
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CalendarClock,
  Check,
  CloudUpload,
  Minus,
  Package,
  Pause,
  Play,
  Plus,
  Printer,
  ScanBarcode,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  X,
  Keyboard,
} from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { api, ApiError, openPrintDoc } from "@/lib/api";
import { D, money } from "@/lib/format";
import { Button, ConfirmDialog, ErrorBox, Input, Modal, Select, Spinner, useToast } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/kit/input-group";
import { Kbd } from "@/components/kit/kbd";
import { enqueueSale, listQueue, replayQueue, removeSale, type QueuedSale } from "@/lib/offline";
import { sound } from "@/lib/sound";
import { useBranch } from "@/components/AppShell";
import { useBarcodeScanner } from "./hooks/useBarcodeScanner";
import { ThermalReceiptSettingsModal } from "./components/ThermalReceiptSettingsModal";
import { PosKeyboardShortcutsModal } from "./components/PosKeyboardShortcutsModal";

interface Warehouse { id: string; name: string }
interface Product {
  id: string; name: string; barcode: string | null; code: string | null; unit: string;
  retail_price: string; wholesale_price: string; image_url: string | null;
}
interface Customer { id: string; name: string; balance: string; credit_limit: string | null }
interface Wallet { id: string; name: string; type: string }
interface CartItem { product: Product; qty: number; discount: string }
interface SplitPart { method: string; amount: string; wallet_id: string }
interface SaleResult { id: string; invoice_number: string }
interface HeldBill { id: string; cart: CartItem[]; mode: "retail" | "wholesale"; at: string }

const HELD_KEY = "mizan.held_bills";
const LEGACY_HELD_KEY = "vendora.held_bills";

function buildSaleBody(args: {
  warehouseId: string; shiftId: string | null; mode: "retail" | "wholesale";
  customerId: string; cart: CartItem[]; isCredit: boolean; cashInput: string;
  split: SplitPart[]; walletId: string; paidSoFar: { toString: () => string }; total: { toString: () => string };
}) {
  const payments = args.split.length
    ? [
        ...(D(args.cashInput || "0").gt(0) ? [{ method: "cash", amount: D(args.cashInput).toNumber() }] : []),
        ...args.split
            .filter((p) => D(p.amount || "0").gt(0))
            .map((p) => ({
              method: p.method,
              amount: D(p.amount).toNumber(),
              wallet_id: p.method === "wallet" && p.wallet_id ? p.wallet_id : undefined,
            })),
      ]
    : undefined;
  return {
    warehouse_id: args.warehouseId,
    shift_id: args.shiftId,
    sale_mode: args.mode,
    customer_id: args.customerId || null,
    items: args.cart.map((i) => ({
      product_id: i.product.id,
      qty: i.qty,
      unit_price: D(args.mode === "wholesale" ? i.product.wholesale_price : i.product.retail_price).toNumber(),
      discount: D(i.discount).toNumber(),
    })),
    is_credit: args.isCredit,
    payment_method: args.isCredit ? "credit" : payments ? "cash" : args.walletId ? "wallet" : "cash",
    wallet_id: !args.isCredit && !payments && args.walletId ? args.walletId : null,
    paid_amount: Number(args.paidSoFar.toString()),
    payments,
  };
}

export default function PosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<"retail" | "wholesale">("retail");
  const [payOpen, setPayOpen] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [split, setSplit] = useState<SplitPart[]>([]);
  const [cashInput, setCashInput] = useState("");
  const [walletId, setWalletId] = useState("");
  const [saleDone, setSaleDone] = useState<SaleResult | null>(null);
  const [held, setHeld] = useState<HeldBill[]>(() => {
    try { return JSON.parse(localStorage.getItem(HELD_KEY) ?? localStorage.getItem(LEGACY_HELD_KEY) ?? "[]"); } catch { return []; }
  });
  const [resumeOpen, setResumeOpen] = useState(false);
  const [openShiftFor, setOpenShiftFor] = useState<Warehouse | null>(null);
  const [initialAmount, setInitialAmount] = useState("0");
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { toast } = useToast();

  const { branchId, setBranchId } = useBranch();
  const wh = useQuery({ queryKey: ["warehouses"], queryFn: () => api.get<Warehouse[]>("/stock/warehouses") });
  const [warehouseId, setWarehouseId] = useState(branchId ?? "");
  useEffect(() => {
    if (branchId) setWarehouseId(branchId);
    else if (!warehouseId && wh.data?.length) setWarehouseId(wh.data[0].id);
  }, [branchId, wh.data, warehouseId]);

  const customers = useQuery({ queryKey: ["pos-customers"], queryFn: () => api.get<Customer[]>("/customers"), enabled: payOpen });
  const wallets = useQuery({ queryKey: ["pos-wallets"], queryFn: () => api.get<Wallet[]>("/wallets"), enabled: payOpen });

  const shift = useQuery({
    queryKey: ["shift", "current", warehouseId],
    queryFn: async () => {
      try {
        return await api.get<{ id: string; started_at: string }>("/shifts/current", { warehouse_id: warehouseId });
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: !!warehouseId,
    retry: false,
  });

  const products = useQuery({
    queryKey: ["pos-products", search],
    queryFn: () => api.get<{ items: Product[] }>("/products", { search: search || undefined, page: 1, page_size: 40, is_active: "true" }),
  });

  const customer = customers.data?.find((c) => c.id === customerId) ?? null;
  const shiftMissing = shift.data === null;

  function addToCart(p: Product) {
    sound.scan();
    setCart((c) => {
      const i = c.findIndex((x) => x.product.id === p.id);
      if (i >= 0) {
        const next = [...c];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...c, { product: p, qty: 1, discount: "0" }];
    });
  }

  async function scanBarcode(code: string) {
    if (!code) return;
    try {
      const p = await api.get<Product>(`/products/barcode/${encodeURIComponent(code)}`);
      if (p) {
        addToCart(p);
      } else {
        sound.error();
      }
    } catch {
      sound.error();
      /* unknown barcode — non-disruptive */
    }
    setSearch("");
    barcodeRef.current?.focus();
  }

  const [hardwareModalOpen, setHardwareModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Global continuous hardware barcode gun scanner listener
  useBarcodeScanner({
    onScan: (code) => {
      scanBarcode(code);
    },
    playSound: true,
    enabled: !payOpen && !resumeOpen && !confirmClear && !hardwareModalOpen && !shortcutsModalOpen,
  });

  const unitPrice = (p: Product) => D(mode === "wholesale" ? p.wholesale_price : p.retail_price);
  const total = useMemo(
    () => cart.reduce((s, i) => s.plus(unitPrice(i.product).times(i.qty).minus(D(i.discount))), D(0)),
    [cart, mode],
  );

  const subtotalBeforeDiscount = useMemo(
    () => cart.reduce((s, i) => s.plus(unitPrice(i.product).times(i.qty)), D(0)),
    [cart, mode],
  );

  const totalDiscount = useMemo(
    () => cart.reduce((s, i) => s.plus(D(i.discount || "0")), D(0)),
    [cart],
  );

  const splitTotal = split.reduce((s, p) => s.plus(D(p.amount || "0")), D(0));
  const paidSoFar = D(cashInput || "0").plus(splitTotal);
  const remaining = total.minus(paidSoFar);

  function persistHeld(bills: HeldBill[]) {
    setHeld(bills);
    localStorage.setItem(HELD_KEY, JSON.stringify(bills));
  }

  function handleHoldBill() {
    if (!cart.length) return;
    sound.hold();
    persistHeld([...held, { id: String(Date.now()), cart, mode, at: new Date().toISOString() }]);
    setCart([]);
    toast("info", "تم تعليق الفاتورة بنجاح");
  }

  function openPaymentModal(asCredit = false) {
    if (!cart.length || shiftMissing || shift.isLoading) {
      sound.error();
      return;
    }
    sound.click();
    setIsCredit(asCredit);
    setCashInput(asCredit ? "0" : total.toFixed(2));
    setSplit([]);
    setPayOpen(true);
  }

  // Keyboard navigation & hardware hotkeys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";

      if (e.key === "F1") {
        e.preventDefault();
        barcodeRef.current?.focus();
        barcodeRef.current?.select();
      } else if (e.key === "F2") {
        e.preventDefault();
        if (payOpen) {
          if (!checkout.isPending && (!isCredit || customerId)) {
            checkout.mutate();
          }
        } else {
          openPaymentModal(false);
        }
      } else if (e.key === "F3") {
        e.preventDefault();
        if (!payOpen) {
          openPaymentModal(true);
        }
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length) {
          handleHoldBill();
        } else if (held.length) {
          sound.click();
          setResumeOpen(true);
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        sound.click();
        setMode((m) => (m === "retail" ? "wholesale" : "retail"));
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length) {
          sound.click();
          setConfirmClear(true);
        }
      } else if (e.key === "F10") {
        e.preventDefault();
        sound.click();
        setHardwareModalOpen(true);
      } else if (e.key === "Escape") {
        if (hardwareModalOpen) setHardwareModalOpen(false);
        else if (shortcutsModalOpen) setShortcutsModalOpen(false);
        else if (payOpen) setPayOpen(false);
        else if (resumeOpen) setResumeOpen(false);
        else if (confirmClear) setConfirmClear(false);
        else if (!typing && cart.length) {
          setConfirmClear(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart, payOpen, resumeOpen, confirmClear, hardwareModalOpen, shortcutsModalOpen, shiftMissing, shift.isLoading, total, isCredit, customerId]);

  const body = () =>
    buildSaleBody({
      warehouseId, shiftId: shift.data?.id ?? null, mode, customerId, cart,
      isCredit, cashInput, split, walletId, paidSoFar, total,
    });

  const checkout = useMutation({
    mutationFn: async (): Promise<SaleResult> => {
      try {
        return await api.post<SaleResult>("/sales", body());
      } catch (err) {
        if (typeof err === "object" && err !== null && !("status" in err)) {
          await enqueueSale(body());
          throw new ApiError(0, "لا يوجد اتصال — تم حفظ الفاتورة محلياً وستُزامن تلقائياً");
        }
        throw err;
      }
    },
    onSuccess: (r) => {
      sound.success();
      setSaleDone(r);
      setCart([]); setPayOpen(false); setCashInput(""); setSplit([]);
      setIsCredit(false); setCustomerId(""); setWalletId("");
      toast("success", `تم البيع — فاتورة ${r.invoice_number}`);
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["report"] });
    },
    onError: () => {
      sound.error();
    },
  });

  const saveQuotation = useMutation({
    mutationFn: () => api.post<SaleResult>("/sales/quotations", body()),
    onSuccess: (r) => {
      sound.success();
      setSaleDone(r);
      setCart([]); setPayOpen(false); setCashInput(""); setSplit([]);
      setIsCredit(false); setCustomerId(""); setWalletId("");
      toast("success", `تم حفظ عرض السعر ${r.invoice_number}`);
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: () => {
      sound.error();
    },
  });

  const openShift = useMutation({
    mutationFn: () => api.post("/shifts/open", { warehouse_id: openShiftFor!.id, initial_amount: D(initialAmount).toNumber() }),
    onSuccess: () => {
      sound.success();
      setOpenShiftFor(null);
      setInitialAmount("0");
      qc.invalidateQueries({ queryKey: ["shift"] });
    },
  });

  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);

  async function refreshQueue() { setQueue(await listQueue()); }
  async function tryReplay() {
    const { synced } = await replayQueue((payload) => api.post("/sales", payload));
    if (synced > 0) {
      sound.success();
      qc.invalidateQueries({ queryKey: ["sales"] });
    }
    await refreshQueue();
  }
  useEffect(() => {
    refreshQueue();
    tryReplay();
    window.addEventListener("online", tryReplay);
    return () => window.removeEventListener("online", tryReplay);
  }, []);

  const creditWarning =
    isCredit && customer && customer.credit_limit
      ? D(customer.balance).plus(total).gt(D(customer.credit_limit))
      : false;

  // Numpad input helper for cash tender
  function handleNumpadPress(val: string) {
    sound.click();
    if (val === "C") {
      setCashInput("");
    } else if (val === "DEL") {
      setCashInput((prev) => prev.slice(0, -1));
    } else if (val === ".") {
      if (!cashInput.includes(".")) setCashInput((prev) => (prev ? prev + "." : "0."));
    } else {
      setCashInput((prev) => (prev === "0" ? val : prev + val));
    }
  }

  function handleQuickTender(amount: number) {
    sound.click();
    setCashInput(amount.toFixed(2));
  }

  return (
    <div className="flex flex-col gap-3 pb-24 lg:pb-2">
      {/* ── Terminal Hardware Shortcut Ribbon ── */}
      <div className="precision-glass flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            نقطة البيع
          </span>
          <span className="text-border">|</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => barcodeRef.current?.focus()}>
            <Kbd>F1</Kbd> بحث
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => openPaymentModal(false)}>
            <Kbd>F2</Kbd> كاش
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => openPaymentModal(true)}>
            <Kbd>F3</Kbd> آجل
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => (cart.length ? handleHoldBill() : setResumeOpen(true))}>
            <Kbd>F4</Kbd> {cart.length ? "تعليق" : "استئناف"}
            {held.length > 0 && <span className="num size-4 rounded-full bg-warning/20 text-warning text-[10px] font-black grid place-items-center">{held.length}</span>}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => { sound.click(); setMode(m => m === "retail" ? "wholesale" : "retail"); }}>
            <Kbd>F8</Kbd> {mode === "retail" ? "تجزئة" : "جملة"}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => cart.length && setConfirmClear(true)}>
            <Kbd>F9</Kbd> تفريغ
          </span>
          <span className="text-border">|</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition cursor-pointer" onClick={() => { sound.click(); setHardwareModalOpen(true); }}>
            <Kbd>F10</Kbd> <Printer size={12} /> الطابعة والورق
          </span>
          <button
            onClick={() => { sound.click(); setShortcutsModalOpen(true); }}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition px-1.5 py-0.5 rounded hover:bg-white/5"
            title="دليل اختصارات الكاشير"
          >
            <Keyboard size={12} /> الاختصارات
          </button>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            title="القارئ يعمل باستمرار في الخلفية"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            القارئ نشط
          </span>
        </div>

        <div className="flex items-center gap-2">
          {shift.data ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              وردية نشطة
            </span>
          ) : (
            <button
              onClick={() => { sound.click(); setOpenShiftFor(wh.data?.find((w) => w.id === warehouseId) ?? null); }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition"
            >
              وردية مغلقة — فتح الآن
            </button>
          )}

          {queue.length > 0 && (
            <button
              onClick={() => { sound.click(); setQueueOpen(true); }}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition"
            >
              <CloudUpload size={12} /> {queue.length} بانتظار المزامنة
            </button>
          )}
        </div>
      </div>

      {/* Main split grid: Catalog & Fast Scanner on Left / Mechanical Receipt on Right */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_440px]">
        {/* ── Catalog & Barcode Engine ── */}
        <div className="min-w-0 space-y-3">
          {/* Scanner search control card */}
          <div className="precision-surface rounded-xl p-3">
            <div className="flex flex-wrap items-center gap-2">
              <form
                onSubmit={(e) => { e.preventDefault(); scanBarcode(search.trim()); }}
                className="flex min-w-[260px] flex-1 items-center gap-2"
              >
                <InputGroup className="h-10 flex-1 bg-background border-line focus-within:border-primary">
                  <InputGroupInput
                    ref={barcodeRef}
                    autoFocus
                    placeholder="امسح الباركود أو ابحث بالاسم / الكود... [F1]"
                    aria-label="بحث أو باركود"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="font-mono text-sm placeholder:font-sans"
                  />
                  <InputGroupAddon>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <ScanBarcode className="size-4 text-primary" />
                      <span className="hidden sm:inline">سريع</span>
                    </span>
                  </InputGroupAddon>
                </InputGroup>

                <Select
                  value={warehouseId}
                  onChange={(e) => {
                    sound.click();
                    setWarehouseId(e.target.value);
                    setBranchId(e.target.value);
                  }}
                  className="h-10 w-auto text-xs"
                >
                  {wh.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
              </form>

              {/* Wholesale / Retail toggle segmented */}
              <div className="flex h-10 overflow-hidden rounded-lg border border-line bg-secondary/50 p-0.5">
                {(["retail", "wholesale"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { sound.click(); setMode(m); }}
                    className={`tactile-btn flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold transition ${
                      mode === m
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{m === "retail" ? "تجزئة" : "جملة"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products grid */}
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="جارٍ التحميل">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-line p-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.isError ? (
            <ErrorBox message={(products.error as Error).message} onRetry={() => products.refetch()} />
          ) : !products.data!.items.length ? (
            <div className="precision-surface rounded-xl p-12 text-center text-muted-foreground">
              <Package size={40} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-semibold text-foreground">لا توجد منتجات مطابقة للبحث</p>
              <p className="text-xs text-muted-foreground mt-1">تأكد من رقم الباركود أو ابحث باسم المنتج</p>
            </div>
          ) : (
            <Stagger className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4" key={search}>
              {products.data!.items.map((p) => {
                const currentPrice = mode === "wholesale" ? p.wholesale_price : p.retail_price;
                const inCart = cart.find((i) => i.product.id === p.id);
                return (
                  <StaggerItem key={p.id} className="h-full">
                    <button
                      onClick={() => addToCart(p)}
                      className="tactile-btn group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-card text-start transition-all hover:border-primary/60 hover:shadow-md"
                    >
                      {inCart && (
                        <div className="num absolute top-2 end-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground shadow">
                          {inCart.qty}
                        </div>
                      )}
                      <div className="relative aspect-[4/3] w-full bg-secondary/40 overflow-hidden">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground/40">
                            <Package size={32} strokeWidth={1.5} />
                          </div>
                        )}
                        {p.barcode && (
                          <span className="num font-mono absolute bottom-1 start-1.5 rounded bg-background/80 px-1 py-0.5 text-[9px] text-muted-foreground backdrop-blur">
                            {p.barcode}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-2.5">
                        <span className="line-clamp-2 min-h-9 text-xs font-bold leading-tight group-hover:text-primary transition-colors">
                          {p.name}
                        </span>
                        <div className="mt-auto flex items-baseline justify-between gap-1 pt-1 border-t border-border/40">
                          <span className="num font-mono text-sm font-extrabold text-foreground">
                            {money(currentPrice)} <span className="text-[10px] font-sans text-muted-foreground font-normal">ج.م</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">{p.unit}</span>
                        </div>
                      </div>
                    </button>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </div>

        {/* ── Mechanical Receipt Slip (The Cart) ── */}
        <div className="hidden lg:flex flex-col gap-3 sticky top-14 self-start max-h-[calc(100svh-4rem-3rem)] overflow-y-auto">
          <div className="receipt-paper flex flex-1 min-h-0 flex-col rounded-2xl overflow-hidden">
            {/* Receipt Top Header */}
            <header className="border-b border-border/80 bg-card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShoppingCart className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold leading-none">إيصال البيع الفوري</h2>
                    <p className="num text-[10px] text-muted-foreground mt-0.5">
                      {mode === "retail" ? "بيع تجزئة" : "بيع جملة"} · {wh.data?.find(w => w.id === warehouseId)?.name ?? "الفرع"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {held.length > 0 && (
                    <button
                      onClick={() => { sound.click(); setResumeOpen(true); }}
                      className="tactile-btn flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-bold text-warning hover:bg-warning/20"
                      title="استئناف الفواتير المعلقة [F4]"
                    >
                      <Pause size={12} />
                      <span className="num">{held.length}</span>
                    </button>
                  )}
                  {cart.length > 0 && (
                    <button
                      onClick={() => { sound.click(); setConfirmClear(true); }}
                      className="tactile-btn flex items-center justify-center rounded-md border border-line p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      title="تفريغ السلة [F9]"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Shift missing warning strip if blocking */}
            {shiftMissing && (
              <div className="border-b border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400">الوردية مغلقة لهذا الفرع</span>
                  <button
                    onClick={() => { sound.click(); setOpenShiftFor(wh.data?.find((w) => w.id === warehouseId) ?? null); }}
                    className="tactile-btn rounded bg-amber-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm"
                  >
                    فتح وردية
                  </button>
                </div>
              </div>
            )}

            {/* Cart itemized list */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
              {!cart.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <div className="size-12 rounded-full border border-dashed border-line flex items-center justify-center mb-2">
                    <ScanBarcode className="size-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs font-bold text-foreground">المسودة جاهزة للبدء</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">امسح الباركود أو اضغط <Kbd>F1</Kbd> للبحث</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {cart.map((i, idx) => {
                    const price = unitPrice(i.product);
                    const lineTotal = price.times(i.qty).minus(D(i.discount || "0"));
                    return (
                      <li key={i.product.id} className="group flex items-center justify-between gap-2 py-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-foreground">{i.product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-muted-foreground">
                            <span className="num">{money(price)} ج.م</span>
                            <span>×</span>
                            <span className="num font-bold text-foreground">{i.qty}</span>
                            {D(i.discount || "0").gt(0) && (
                              <span className="num text-[10px] text-emerald-600 bg-emerald-500/10 px-1 rounded">
                                -{money(i.discount)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper & Line Total */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-line bg-secondary/40 p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                sound.click();
                                setCart((c) => c.map((x, j) => (j === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x)));
                              }}
                              className="tactile-btn size-7.5 rounded-md flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              aria-label="تقليل الكمية"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="num font-mono w-7 text-center font-bold text-xs">{i.qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                sound.click();
                                setCart((c) => c.map((x, j) => (j === idx ? { ...x, qty: x.qty + 1 } : x)));
                              }}
                              className="tactile-btn size-7.5 rounded-md flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              aria-label="زيادة الكمية"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <span className="num font-mono text-xs font-black min-w-14 text-end text-foreground">
                            {money(lineTotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              sound.click();
                              setCart((c) => c.filter((_, j) => j !== idx));
                            }}
                            className="tactile-btn size-7.5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                            aria-label="حذف الصنف"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Perforation Line */}
            <div className="receipt-perforation mx-2 my-1" />

            {/* Receipt Summary Footer */}
            <div className="border-t border-border/80 bg-card p-3.5 space-y-3">
              {/* Calculations ledger breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>المجموع الجزئي ({cart.reduce((s, i) => s + i.qty, 0)} قطعة)</span>
                  <span className="num font-mono">{money(subtotalBeforeDiscount)} ج.م</span>
                </div>
                {totalDiscount.gt(0) && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>إجمالي الخصم</span>
                    <span className="num font-mono">-{money(totalDiscount)} ج.م</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-1 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground">الإجمالي الصافي</span>
                  <div className="text-end">
                    <span className="num font-mono text-2xl font-black text-foreground tracking-tight">
                      {money(total)}
                    </span>
                    <span className="text-xs text-muted-foreground ms-1">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Quick Cash Tender Bar */}
              {cart.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-mono">نقدًا:</span>
                  {[50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        handleQuickTender(val);
                        setIsCredit(false);
                        setSplit([]);
                        setPayOpen(true);
                      }}
                      className="tactile-btn num flex-1 rounded border border-line bg-secondary/50 py-1 text-center font-mono text-[11px] font-bold hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition"
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickTender(total.toNumber());
                      setIsCredit(false);
                      setSplit([]);
                      setPayOpen(true);
                    }}
                    className="tactile-btn flex-1 rounded border border-line bg-secondary/50 py-1 text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
                  >
                    بالضبط
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="tactile-btn text-xs px-3"
                  disabled={!cart.length}
                  onClick={handleHoldBill}
                  title="تعليق الفاتورة [F4]"
                >
                  <Pause size={14} />
                  <span>تعليق</span>
                  <Kbd className="ms-1 text-[9px]">F4</Kbd>
                </Button>

                <Button
                  className="tactile-btn flex-1 font-bold py-2.5 text-sm shadow-md"
                  disabled={!cart.length || shiftMissing || shift.isLoading}
                  onClick={() => openPaymentModal(false)}
                >
                  <span>إتمام الدفع</span>
                  <Kbd className="ms-1.5">F2</Kbd>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Fixed Sticky Bottom Action Bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-background/95 px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden shadow-lg">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground font-medium">الإجمالي الصافي</span>
          <span className="num font-mono text-lg font-black text-foreground">{money(total)} <span className="text-xs font-sans text-muted-foreground font-normal">ج.م</span></span>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <Button
              variant="outline"
              className="tactile-btn h-10 px-3 text-xs"
              onClick={handleHoldBill}
              title="تعليق الفاتورة"
            >
              <Pause size={14} />
              <span>تعليق</span>
            </Button>
          )}
          <Button
            className="tactile-btn h-10 px-4 font-bold text-sm shadow-md"
            disabled={!cart.length || shiftMissing || shift.isLoading}
            onClick={() => openPaymentModal(false)}
          >
            <span>إتمام الدفع</span>
            <Kbd className="ms-1.5 hidden sm:inline-flex">F2</Kbd>
          </Button>
        </div>
      </div>

      {/* ── High-Velocity Payment Modal with Cash Tender Numpad ── */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="إتمام الدفع والمحاسبة">
        <div className="flex flex-col gap-4">
          {/* Due hero banner */}
          <div className="precision-surface flex items-center justify-between rounded-xl p-4 bg-secondary/30">
            <div>
              <p className="text-xs text-muted-foreground font-medium">المطلوب سداده</p>
              <p className="num font-mono text-3xl font-black text-foreground mt-0.5">
                {money(total)} <span className="text-sm font-sans text-muted-foreground font-normal">ج.م</span>
              </p>
            </div>
            <div className="text-end font-mono text-xs text-muted-foreground">
              <span>{cart.reduce((s, i) => s + i.qty, 0)} أصناف</span>
            </div>
          </div>

          {/* Payment method toggle: Cash/Wallet vs Credit (آجل) */}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="طريقة الدفع">
            {([["cash", "نقدي / محفظة", false, Banknote], ["credit", "بيع آجل (على الحساب)", true, CalendarClock]] as const).map(
              ([key, label, credit, Icon]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isCredit === credit}
                  onClick={() => { sound.click(); setIsCredit(credit); }}
                  className={`tactile-btn flex items-center justify-center gap-2 rounded-xl border p-3 font-bold transition text-xs ${
                    isCredit === credit
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "border-line bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </button>
              )
            )}
          </div>

          {/* If Credit Sale */}
          {isCredit ? (
            <div className="space-y-3 rounded-xl border border-line bg-card p-3.5">
              <div>
                <label className="mb-1 block text-xs font-bold">العميل المستحق عليه الفاتورة</label>
                <Select value={customerId} onChange={(e) => { sound.click(); setCustomerId(e.target.value); }}>
                  <option value="">— اختر العميل —</option>
                  {customers.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (المديونية: {money(c.balance)} ج.م)</option>
                  ))}
                </Select>
              </div>

              {customer && (
                <div className="rounded-lg bg-secondary/50 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد السابق:</span>
                    <span className="num font-mono font-bold">{money(customer.balance)} ج.م</span>
                  </div>
                  {customer.credit_limit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">سقف الائتمان:</span>
                      <span className="num font-mono font-bold">{money(customer.credit_limit)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/40 pt-1 font-bold">
                    <span>الرصيد الجديد المتوقع:</span>
                    <span className="num font-mono text-primary">{money(D(customer.balance).plus(total))} ج.م</span>
                  </div>
                </div>
              )}

              {creditWarning && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs font-bold text-destructive">
                  <TriangleAlert className="size-4 shrink-0" />
                  <span>تحذير: إجمالي المديونية يتجاوز سقف الائتمان المسموح لهذا العميل</span>
                </div>
              )}
            </div>
          ) : (
            /* If Cash / Split Sale */
            <div className="space-y-3">
              {/* Tender input + Quick denomination chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold">المبلغ المستلم نقداً</label>
                  <div className="flex items-center gap-2.5">
                    {cashInput && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.click();
                          setCashInput("");
                        }}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        مسح
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleQuickTender(total.toNumber())}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      استلام المبلغ بالكامل
                    </button>
                  </div>
                </div>
                <InputGroup className="h-11 bg-card border-line focus-within:border-primary">
                  <InputGroupInput
                    type="text"
                    inputMode="decimal"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="0.00"
                    className="num font-mono text-lg font-bold"
                  />
                  <InputGroupAddon>
                    <span className="text-xs text-muted-foreground font-mono">ج.م</span>
                  </InputGroupAddon>
                </InputGroup>

                {/* Quick denomination chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[20, 50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickTender(amt)}
                      className="tactile-btn num rounded-md border border-line bg-secondary/50 px-2.5 py-1 text-xs font-mono font-bold hover:border-primary/50 hover:bg-primary/10 transition"
                    >
                      {amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = D(cashInput || "0");
                      const nextRound = Math.ceil(cur.toNumber() / 50) * 50 || 50;
                      handleQuickTender(nextRound);
                    }}
                    className="tactile-btn rounded-md border border-line bg-secondary/50 px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground transition"
                  >
                    لأقرب ٥٠
                  </button>
                </div>

                {/* Tactile Virtual Numpad for Touch Terminals */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 max-w-[280px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "DEL"].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNumpadPress(key)}
                      className="tactile-btn flex h-11 items-center justify-center rounded-xl border border-line bg-secondary/50 font-mono text-base font-bold hover:bg-primary/10 hover:border-primary/40 active:scale-95 transition-all shadow-xs"
                    >
                      {key === "DEL" ? "⌫" : key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Change / Remaining Calculator Badge */}
              <div className="rounded-xl border border-line bg-secondary/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground">حالة السداد:</span>
                  {remaining.gt(0) ? (
                    <span className="inline-flex items-center gap-1 font-bold text-warning font-mono">
                      <span>المتبقي للدفع:</span>
                      <span className="num font-mono text-sm">{money(remaining)} ج.م</span>
                    </span>
                  ) : remaining.lt(0) ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      <Check className="size-3.5" />
                      <span>الباقي للعميل:</span>
                      <span className="num font-mono text-sm">{money(remaining.neg())} ج.م</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3.5" />
                      المبلغ مسدد بالتمام
                    </span>
                  )}
                </div>
              </div>

              {/* Digital Wallets / Split Payments */}
              <div className="rounded-xl border border-line bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">دفع عبر محفظة أو حساب بنكي</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      setSplit((s) => [...s, { method: "wallet", amount: remaining.gt(0) ? remaining.toFixed(2) : "", wallet_id: wallets.data?.[0]?.id ?? "" }]);
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    + إضافة دفعة
                  </button>
                </div>

                {!split.length && !cashInput && (
                  <div>
                    <Select value={walletId} onChange={(e) => { sound.click(); setWalletId(e.target.value); }}>
                      <option value="">— اختيار محفظة للدفع الكامل —</option>
                      {wallets.data?.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
                    </Select>
                  </div>
                )}

                {split.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                    <Select
                      className="w-auto text-xs"
                      value={p.method}
                      onChange={(e) => setSplit((s) => s.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}
                    >
                      <option value="wallet">محفظة إلكترونية</option>
                      <option value="bank">تحويل بنكي / فوري</option>
                      <option value="cheque">شيك</option>
                      <option value="cash">نقدي إضافي</option>
                    </Select>

                    {p.method === "wallet" && (
                      <Select
                        className="w-auto text-xs"
                        value={p.wallet_id}
                        onChange={(e) => setSplit((s) => s.map((x, j) => (j === i ? { ...x, wallet_id: e.target.value } : x)))}
                      >
                        <option value="">اختر المحفظة</option>
                        {wallets.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </Select>
                    )}

                    <Input
                      className="num font-mono w-24 text-xs font-bold"
                      inputMode="decimal"
                      placeholder="المبلغ"
                      value={p.amount}
                      onChange={(e) => setSplit((s) => s.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                    />

                    <button
                      type="button"
                      onClick={() => { sound.click(); setSplit((s) => s.filter((_, j) => j !== i)); }}
                      className="rounded p-1 text-destructive hover:bg-destructive/10"
                      aria-label="حذف الدفعة"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {checkout.isError && <ErrorBox message={(checkout.error as Error).message} />}

          {/* Action triggers - Sticky pinned at bottom */}
          <div className="sticky bottom-0 -mx-5 -mb-4 mt-2 flex gap-2 border-t border-border/80 bg-card/95 px-5 py-3.5 backdrop-blur shadow-lg">
            <Button
              className="tactile-btn flex-1 h-11 text-sm font-bold shadow-md"
              disabled={checkout.isPending || (isCredit && !customerId)}
              onClick={() => checkout.mutate()}
            >
              {checkout.isPending ? <Spinner /> : <span>تأكيد وطباعة الفاتورة [F2]</span>}
            </Button>
            <Button
              variant="outline"
              className="tactile-btn flex-initial h-11 px-4 text-xs font-medium"
              disabled={saveQuotation.isPending}
              onClick={() => saveQuotation.mutate()}
              title="عرض سعر — لا يخصم من المخزون"
            >
              {saveQuotation.isPending ? <Spinner /> : "عرض سعر"}
            </Button>
          </div>
          {saveQuotation.isError && <ErrorBox message={(saveQuotation.error as Error).message} />}
        </div>
      </Modal>

      {/* Confirm Clear Modal */}
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          sound.click();
          setCart([]);
          setConfirmClear(false);
          toast("info", "تم تفريغ الفاتورة");
        }}
        title="تفريغ الفاتورة"
        message="هل أنت متأكد من تفريغ كافة أصناف الفاتورة الحالية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="تفريغ السلة [F9]"
      />

      {/* Resume Held Bills Modal */}
      <Modal open={resumeOpen} onClose={() => setResumeOpen(false)} title="الفواتير المعلقة">
        {!held.length ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            لا توجد فواتير معلقة حالياً
          </div>
        ) : (
          <div className="space-y-2">
            {held.map((b) => (
              <div key={b.id} className="precision-surface flex items-center justify-between rounded-xl p-3 text-xs">
                <div>
                  <p className="font-bold text-foreground">
                    {b.cart.length} أصناف · {b.mode === "retail" ? "تجزئة" : "جملة"}
                  </p>
                  <p className="num text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {new Date(b.at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    className="tactile-btn text-xs py-1 px-2.5"
                    onClick={() => {
                      sound.click();
                      setCart(b.cart);
                      setMode(b.mode);
                      persistHeld(held.filter((x) => x.id !== b.id));
                      setResumeOpen(false);
                      toast("success", "تم استئناف الفاتورة المعلقة");
                    }}
                  >
                    <Play size={12} />
                    استئناف
                  </Button>
                  <button
                    onClick={() => {
                      sound.click();
                      persistHeld(held.filter((x) => x.id !== b.id));
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="حذف الفاتورة المعلقة"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Offline Queue Modal */}
      <Modal open={queueOpen} onClose={() => setQueueOpen(false)} title="فواتير بانتظار المزامنة دون اتصال">
        <div className="flex flex-col gap-3">
          {!queue.length ? (
            <p className="p-6 text-center text-xs text-muted-foreground">لا توجد فواتير معلقة — كافة المبيعات متزامنة مع الخادم ✓</p>
          ) : (
            <>
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                {queue.map((s) => (
                  <li key={s.id} className="precision-surface flex items-center justify-between rounded-xl p-3 text-xs">
                    <div>
                      <p className="font-bold">
                        {s.status === "conflict" ? "تعارض — تحتاج مراجعة" : "محفوظة محلياً على الجهاز"}
                      </p>
                      <p className="num text-[11px] text-muted-foreground font-mono">{new Date(s.savedAt).toLocaleString("ar-EG")}</p>
                      {s.error && <p className="text-[11px] text-destructive mt-0.5">{s.error}</p>}
                    </div>
                    {s.status === "conflict" && (
                      <Button variant="ghost" className="text-destructive text-xs py-1 px-2" onClick={async () => { await removeSale(s.id); refreshQueue(); }}>
                        تجاهل
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              <Button className="tactile-btn w-full" onClick={() => tryReplay()}>
                <Play size={14} /> محاولة المزامنة الآن
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Open Shift Modal */}
      <Modal open={!!openShiftFor} onClose={() => setOpenShiftFor(null)} title="فتح وردية كاشير">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">الفرع / المخزن: <strong className="text-foreground">{openShiftFor?.name}</strong></p>
          <div>
            <label className="mb-1 block text-xs font-bold">العهدة النقدية الافتتاحية (ج.م)</label>
            <InputGroup className="h-10 bg-card border-line">
              <InputGroupInput
                type="text"
                inputMode="decimal"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="num font-mono text-sm font-bold"
              />
              <InputGroupAddon>
                <span className="text-xs text-muted-foreground font-mono">ج.م</span>
              </InputGroupAddon>
            </InputGroup>
          </div>
          {openShift.isError && <ErrorBox message={(openShift.error as Error).message} />}
          <Button className="tactile-btn w-full font-bold" disabled={openShift.isPending} onClick={() => openShift.mutate()}>
            {openShift.isPending ? <Spinner /> : "تأكيد فتح الوردية والبدء"}
          </Button>
        </div>
      </Modal>

      {/* Success Receipt Modal with Auto Print Button */}
      <Modal open={!!saleDone} onClose={() => setSaleDone(null)} title="تم تسجيل البيع بنجاح ✓">
        <div className="space-y-4 text-center py-2">
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center mx-auto">
            <Check size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">رقم الفاتورة المسجلة</p>
            <p className="num font-mono text-2xl font-black text-foreground mt-0.5 tracking-tight">
              {saleDone?.invoice_number}
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button
              className="tactile-btn font-bold px-6 shadow"
              onClick={() => saleDone && openPrintDoc(`/print/sale/${saleDone.id}`)}
            >
              <Printer size={16} /> طباعة إيصال الفاتورة
            </Button>
            <Button variant="outline" className="tactile-btn" onClick={() => setSaleDone(null)}>
              فاتورة جديدة
            </Button>
          </div>
        </div>
      </Modal>

      {/* POS Thermal Hardware & Paper Config Modal */}
      <ThermalReceiptSettingsModal
        isOpen={hardwareModalOpen}
        onClose={() => setHardwareModalOpen(false)}
      />

      {/* Cashier Velocity Keyboard Shortcuts Cheat Sheet */}
      <PosKeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}
