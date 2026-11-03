/**
 * PublicStorefrontPage.tsx — Customer-Facing Public Online Store & Ordering App.
 *
 * Fully responsive, mobile-first, multi-tenant digital storefront:
 * - Brand customized colors & banners.
 * - Live category filtering and product search.
 * - Interactive cart drawer with quantity steppers.
 * - Delivery methods (Home delivery, branch pickup, table dine-in).
 * - Egyptian payment methods (COD, Fawry, InstaPay, Card).
 * - Real-time order tracking and instant WhatsApp dispatch.
 */
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  ArrowRight,
  Truck,
  Building,
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/kit/button";
import { Input } from "@/components/kit/input";
import { Badge } from "@/components/kit/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/kit/dialog";
import { toast } from "sonner";

interface PublicStoreConfig {
  store_title: string;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  brand_color: string;
  announcement: string | null;
  whatsapp_number: string | null;
  delivery_fee: number;
  free_delivery_above: number | null;
  min_order_amount: number;
  allow_delivery: boolean;
  allow_pickup: boolean;
  allow_dine_in: boolean;
  is_active: boolean;
  social_instagram: string | null;
  social_facebook: string | null;
}

interface PublicCategory {
  id: string;
  name: string;
  code?: string;
  image_url?: string;
  product_count: number;
}

interface PublicProduct {
  id: string;
  name: string;
  code?: string;
  unit?: string;
  retail_price: number;
  image_url?: string;
  description?: string;
  category_name?: string;
  category_id?: string;
}

interface CartItem {
  product: PublicProduct;
  quantity: number;
  notes?: string;
}

interface OrderConfirmation {
  order_number: string;
  customer_name: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  status: string;
  payment_method: string;
  fawry_ref?: string;
  whatsapp_link?: string;
  message: string;
}

const RAW_API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export default function PublicStorefrontPage() {
  const { tenantSlug: urlSlug } = useParams<{ tenantSlug?: string }>();
  const slug = urlSlug || "german-egyptian";

  // Data states
  const [tenantName, setTenantName] = useState("");
  const [config, setConfig] = useState<PublicStoreConfig | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup" | "dine_in">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);

  // 1. Fetch Store Config & Catalog
  useEffect(() => {
    async function initStore() {
      setLoading(true);
      try {
        const [cfgRes, catRes, prodRes] = await Promise.all([
          fetch(`${RAW_API_BASE}/storefront/${slug}/config`).then((r) => r.json()),
          fetch(`${RAW_API_BASE}/storefront/${slug}/categories`).then((r) => r.json()),
          fetch(`${RAW_API_BASE}/storefront/${slug}/products?page_size=60`).then((r) => r.json()),
        ]);

        if (cfgRes?.config) {
          setConfig(cfgRes.config);
          setTenantName(cfgRes.tenant_name || "");
        }
        if (Array.isArray(catRes)) {
          setCategories(catRes);
        }
        if (prodRes?.items) {
          setProducts(prodRes.items);
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
        toast.error("تعذر تحميل بيانات المتجر — يرجى التحقق من الرابط");
      } finally {
        setLoading(false);
      }
    }

    initStore();
  }, [slug]);

  // Apply brand color CSS variable dynamically
  useEffect(() => {
    if (config?.brand_color) {
      document.documentElement.style.setProperty("--store-brand", config.brand_color);
    }
  }, [config?.brand_color]);

  // Cart Handlers
  function addToCart(p: PublicProduct) {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === p.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product: p, quantity: 1 }];
    });
    toast.success(`تمت إضافة «${p.name}» إلى سلة الشراء`);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function getCartItemQuantity(productId: string): number {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.retail_price * item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (!config || deliveryType !== "delivery") return 0;
    if (config.free_delivery_above && subtotal >= config.free_delivery_above) {
      return 0;
    }
    return config.delivery_fee;
  }, [config, deliveryType, subtotal]);

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryFee;

  // Coupon Validator
  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch(`${RAW_API_BASE}/storefront/${slug}/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "كود الخصم غير صحيح");
      }
      setAppliedCoupon({ code: data.code, discount_amount: data.discount_amount });
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تطبيق كود الخصم");
    } finally {
      setValidatingCoupon(false);
    }
  }

  // Submit Order
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("السلة فارغة!");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("الرجاء إدخال رقم هاتف العميل");
      return;
    }
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast.error("الرجاء إدخال عنوان التوصيل بالتفصيل");
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        delivery_type: deliveryType,
        delivery_address: deliveryType === "delivery" ? deliveryAddress.trim() : undefined,
        table_number: deliveryType === "dine_in" ? tableNumber.trim() : undefined,
        notes: customerNotes.trim() || undefined,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
      };

      const res = await fetch(`${RAW_API_BASE}/storefront/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "تعذر إرسال الطلب");
      }

      setOrderConfirmation(data);
      setCart([]);
      setAppliedCoupon(null);
      toast.success("تم إرسال طلبك بنجاح!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إرسال الطلب");
    } finally {
      setSubmittingOrder(false);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
        (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" ? true : p.category_id === selectedCategory || p.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col selection:bg-primary/20" dir="rtl">
      {/* 1. Announcement Bar */}
      {config?.announcement && (
        <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-xs font-bold tracking-wide shadow-xs">
          <span>{config.announcement}</span>
        </div>
      )}

      {/* 2. Main Store Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs text-lg">
              {config?.store_title?.[0] || "V"}
            </span>
            <div>
              <h1 className="text-base font-black tracking-tight text-foreground line-clamp-1">
                {config?.store_title || tenantName || "متجر فيندورا"}
              </h1>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {config?.tagline || "المنظومة السحابية المتكاملة"}
              </p>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن المنتجات أو الأصناف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 text-xs h-9 bg-muted/40"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {config?.whatsapp_number && (
              <a
                href={`https://wa.me/${config.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-emerald-600 hover:bg-emerald-500/10 transition-colors shadow-xs"
              >
                <Phone className="size-3.5" />
                <span>واتساب المتجر</span>
              </a>
            )}

            {/* Cart Trigger Button */}
            <Button
              size="sm"
              onClick={() => setCartOpen(true)}
              className="relative gap-2 font-bold text-xs bg-primary text-primary-foreground shadow-xs"
            >
              <ShoppingCart className="size-4" />
              <span>السلة</span>
              {totalCartCount > 0 && (
                <span className="size-5 rounded-full bg-background text-foreground text-[10px] font-black grid place-items-center num shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar (Mobile) */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في المتجر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 text-xs h-9 bg-muted/40"
            />
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="bg-muted/20 border-b py-8 sm:py-12 px-4">
        <div className="mx-auto max-w-5xl text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary/30 font-bold text-xs gap-1">
            <Sparkles className="size-3" />
            متجر إلكتروني رسمي ومباشر
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {config?.store_title || "أهلاً بك في متجرنا الرقمي"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            {config?.tagline || "تصفح أحدث الأصناف واطلب أونلاين واستلم طلبك بكل سهولة وأمان."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-muted-foreground">
            {config?.allow_delivery && (
              <span className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border border-border shadow-xs">
                <Truck className="size-3.5 text-primary" />
                <span>توصيل للمنازل (مصاريف {formatCurrency(config.delivery_fee)})</span>
              </span>
            )}
            {config?.free_delivery_above && (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20 font-bold shadow-xs">
                <span>توصيل مجاني للطلبات فوق {formatCurrency(config.free_delivery_above)}</span>
              </span>
            )}
            {config?.allow_pickup && (
              <span className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border border-border shadow-xs">
                <Building className="size-3.5 text-primary" />
                <span>استلام مباشر من الفرع</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 4. Categories Filter Pills */}
      <nav className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur py-2.5 px-4 shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            كافة الأصناف ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                selectedCategory === c.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{c.name}</span>
              <span className="mr-1.5 opacity-70 num text-[10px]">({c.product_count})</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 5. Products Catalog Grid */}
      <main className="mx-auto max-w-7xl px-4 py-8 flex-1 w-full">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground space-y-3">
            <Store className="size-8 animate-pulse mx-auto text-primary" />
            <p className="text-xs">جاري تجهيز كتالوج المتجر...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground space-y-2 rounded-2xl border border-dashed border-border bg-card/40">
            <ShoppingBag className="size-10 mx-auto text-muted-foreground/30" />
            <p className="text-base font-bold text-foreground">لا توجد منتجات مطابقة لطلبك</p>
            <p className="text-xs">جرّب تغيير الصنف أو مسح عبارة البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const qtyInCart = getCartItemQuantity(p.id);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs flex flex-col justify-between transition hover:shadow-md hover:border-primary/40 group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-4/3 bg-muted/40 overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="object-cover size-full group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground/40 gap-1 bg-muted/20">
                        <Store className="size-8" />
                        <span className="text-[10px] font-mono">صورة المنتج</span>
                      </div>
                    )}
                    {p.category_name && (
                      <span className="absolute top-2 right-2 bg-background/90 backdrop-blur text-[10px] font-bold text-foreground px-2 py-0.5 rounded-md shadow-xs">
                        {p.category_name}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-foreground num">
                          {formatCurrency(p.retail_price)}
                        </span>
                      </div>
                      {p.unit && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          /{p.unit}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart / Quantity Stepper */}
                    {qtyInCart === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => addToCart(p)}
                        className="w-full text-xs font-bold gap-1.5 h-8 bg-primary text-primary-foreground shadow-xs"
                      >
                        <Plus className="size-3.5" />
                        <span>أضف للسلة</span>
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between p-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <button
                          onClick={() => updateQuantity(p.id, -1)}
                          className="size-6 rounded-md hover:bg-primary/20 grid place-items-center text-primary transition-colors"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="font-bold text-xs num">{qtyInCart} في السلة</span>
                        <button
                          onClick={() => updateQuantity(p.id, 1)}
                          className="size-6 rounded-md hover:bg-primary/20 grid place-items-center text-primary transition-colors"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Slide-Over Shopping Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in-0">
          <div className="w-full max-w-md bg-card border-s border-border h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Cart Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <h2 className="text-base font-black text-foreground">سلة الشراء</h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {totalCartCount} قطعة
                </Badge>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => setCartOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground space-y-2">
                  <ShoppingCart className="size-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm font-bold text-foreground">سلة الشراء فارغة</p>
                  <p className="text-xs">تصفح المنتجات وأضف ما ترغب لشرائه</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-foreground line-clamp-1">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground num block mt-0.5">
                            {formatCurrency(item.product.retail_price)} للقطعة
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-muted/40">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="px-2 py-1 text-muted-foreground hover:bg-muted transition"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="px-2 font-mono text-xs font-bold text-foreground num">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="px-2 py-1 text-muted-foreground hover:bg-muted transition"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <span className="font-bold text-xs num text-foreground min-w-[60px] text-left">
                            {formatCurrency(item.product.retail_price * item.quantity)}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.product.id, -item.quantity)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Type Option */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <span className="text-xs font-bold text-foreground block">طريقة استلام الطلب:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {config?.allow_delivery && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType("delivery")}
                          className={`p-2 rounded-lg border text-center transition ${
                            deliveryType === "delivery"
                              ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Truck className="size-3.5 mx-auto mb-1" />
                          <span>توصيل</span>
                        </button>
                      )}
                      {config?.allow_pickup && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType("pickup")}
                          className={`p-2 rounded-lg border text-center transition ${
                            deliveryType === "pickup"
                              ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Building className="size-3.5 mx-auto mb-1" />
                          <span>استلام فرع</span>
                        </button>
                      )}
                      {config?.allow_dine_in && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType("dine_in")}
                          className={`p-2 rounded-lg border text-center transition ${
                            deliveryType === "dine_in"
                              ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <UtensilsCrossed className="size-3.5 mx-auto mb-1" />
                          <span>صالة / طاولة</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coupon Input Form */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <span className="text-xs font-bold text-foreground block">كود الخصم (Promo Code):</span>
                    {appliedCoupon ? (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                        <span>تم تفعيل الكود «{appliedCoupon.code}» (-{formatCurrency(appliedCoupon.discount_amount)})</span>
                        <button onClick={() => setAppliedCoupon(null)} className="text-destructive hover:underline text-[10px]">
                          إزالة
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <Input
                          placeholder="أدخل كود الخصم مثل WELCOME10"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="text-xs h-8 uppercase font-mono"
                        />
                        <Button type="submit" size="sm" disabled={validatingCoupon} className="h-8 text-xs font-bold">
                          {validatingCoupon ? "جاري التحقق..." : "تطبيق"}
                        </Button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold text-foreground num">{formatCurrency(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>خصم الكوبون:</span>
                      <span className="num">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {deliveryType === "delivery" && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>مصاريف التوصيل:</span>
                      <span className="font-bold text-foreground num">
                        {deliveryFee === 0 ? "مجاناً ✓" : formatCurrency(deliveryFee)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border">
                    <span>الإجمالي المستحق:</span>
                    <span className="text-primary num">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full font-bold text-xs h-9 bg-primary text-primary-foreground shadow-xs gap-1.5"
                >
                  <span>متابعة إتمام الطلب (Checkout)</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-1.5">
              <ShoppingBag className="size-4 text-primary" />
              <span>إتمام وتأكيد بيانات الطلب</span>
            </DialogTitle>
          </DialogHeader>

          {orderConfirmation ? (
            /* Order Success State */
            <div className="py-6 text-center space-y-4">
              <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">تم استلام طلبك بنجاح!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  شكراً لتسوقك من <strong className="text-foreground">{config?.store_title || tenantName}</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border inline-block font-mono text-xs">
                رقم الطلب المرجعي: <strong className="text-primary">{orderConfirmation.order_number}</strong>
              </div>

              {orderConfirmation.fawry_ref && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                  <span className="text-muted-foreground block text-[11px]">كود سداد فوري باي:</span>
                  <strong className="text-xl font-mono font-black text-foreground mt-1 block">
                    {orderConfirmation.fawry_ref}
                  </strong>
                </div>
              )}

              {/* Progress Timeline */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-right">
                <span className="text-[11px] font-bold text-muted-foreground block">مراحل تنفيذ الطلب:</span>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="text-emerald-600 font-bold">1. استلام الطلب ✓</span>
                  <span>2. التجهيز</span>
                  <span>3. التوصيل</span>
                  <span>4. التسليم</span>
                </div>
              </div>

              {orderConfirmation.whatsapp_link && (
                <Button
                  size="sm"
                  nativeButton={false}
                  render={
                    <a
                      href={orderConfirmation.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 h-9"
                >
                  <Phone className="size-4" />
                  <span>إرسال نسخة من الطلب عبر الواتساب للمتجر</span>
                </Button>
              )}
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePlaceOrder} className="space-y-3.5 py-1 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">اسم العميل بالكامل:</label>
                <Input
                  placeholder="مثال: يوسف إبراهيم"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">رقم الهاتف (للتواصل وتأكيد الشحن):</label>
                <Input
                  placeholder="010xxxxxxxx أو 011xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-xs h-9 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">البريد الإلكتروني (اختياري لاستلام الفاتورة):</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>

              {deliveryType === "delivery" && (
                <div className="space-y-1">
                  <label className="font-bold text-foreground">عنوان التوصيل بالتفصيل (الشارع، العمارة، الشقة):</label>
                  <Input
                    placeholder="مثال: المعادي، شارع النصر، عمارة 12، الدور الثاني"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
              )}

              {deliveryType === "dine_in" && (
                <div className="space-y-1">
                  <label className="font-bold text-foreground">رقم الطاولة في الصالة:</label>
                  <Input
                    placeholder="مثال: طاولة 5"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="text-xs h-9 font-mono"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-foreground">ملاحظات خاصة على الطلب (اختياري):</label>
                <Input
                  placeholder="تعليمات خاصة، توقيت مفضل، إلخ..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-foreground block">وسيلة السداد المفضلة:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "cod", label: "كاش عند الاستلام", desc: "الدفع للمندوب نقدياً", icon: "💵" },
                    { id: "fawry", label: "فوري باي (Fawry)", desc: "كود فوري فوري", icon: "⚡" },
                    { id: "instapay", label: "إنستاباي (InstaPay)", desc: "تحويل لحظي IPN", icon: "📱" },
                    { id: "card", label: "بطاقة فيزا / ميزة", desc: "دفع إلكتروني فوري", icon: "💳" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-right transition ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/10 text-foreground font-bold ring-1 ring-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border flex justify-between items-center text-xs">
                <span>الإجمالي شامل الشحن والخصم:</span>
                <span className="text-base font-black text-primary num">{formatCurrency(grandTotal)}</span>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={submittingOrder}
                >
                  إلغاء
                </Button>
                <Button type="submit" size="sm" disabled={submittingOrder} className="font-bold gap-1">
                  {submittingOrder ? "جاري الإرسال..." : "تأكيد الطلب الآن"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. Footer */}
      <footer className="mt-auto border-t py-8 text-center text-xs text-muted-foreground bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p className="font-bold text-foreground">
            {config?.store_title || tenantName || "متجر فيندورا الرقمي"}
          </p>
          <p className="text-[11px]">
            مدعوم بواسطة منصة <strong className="text-foreground">Vendora ERP</strong> — حلول التجارة وإدارة الأعمال السحابية.
          </p>
        </div>
      </footer>
    </div>
  );
}
