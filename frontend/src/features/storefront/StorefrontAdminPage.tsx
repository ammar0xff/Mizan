/**
 * StorefrontAdminPage.tsx — Back-Office Management for Tenant Storefront.
 *
 * Provides:
 * 1. Live Orders Dispatch Board (Kanban / Filterable order cards with status transitions).
 * 2. Visual Store Customizer (Brand color, Banner, Announcement, Delivery rules).
 * 3. Discount Coupons Manager (Create and monitor promo codes).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Phone,
  MapPin,
  Tag,
  Plus,
  Palette,
  DollarSign,
  UtensilsCrossed,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/stores/auth";
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

interface StoreOrderItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
}

interface StoreOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: "delivery" | "pickup" | "dine_in";
  delivery_address?: string;
  table_number?: string;
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  coupon_code?: string;
  total_amount: number;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";
  payment_method: string;
  payment_status: string;
  fawry_ref?: string;
  created_at: string;
  items_count: number;
  items: StoreOrderItem[];
}

interface StoreDashboardStats {
  total_orders: number;
  total_revenue_egp: number;
  pending_orders: number;
  preparing_orders: number;
  completed_orders: number;
  average_ticket_egp: number;
}

interface StoreConfigData {
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
  social_instagram: string | null;
  social_facebook: string | null;
}

interface CouponItem {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

export default function StorefrontAdminPage() {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "customizer" | "coupons">("orders");

  // Dashboard Stats
  const [stats, setStats] = useState<StoreDashboardStats>({
    total_orders: 0,
    total_revenue_egp: 0,
    pending_orders: 0,
    preparing_orders: 0,
    completed_orders: 0,
    average_ticket_egp: 0,
  });

  // Orders State
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Config State
  const [config, setConfig] = useState<StoreConfigData>({
    store_title: "متجرنا الإلكتروني",
    tagline: "تسوق أفضل المنتجات مع خدمة التوصيل السريع",
    logo_url: "",
    banner_url: "",
    brand_color: "#0f766e",
    announcement: "🚚 توصيل مجاني للطلبات فوق 500 ج.م • ادفع عند الاستلام أو فوري وإنستاباي",
    whatsapp_number: "201099887766",
    delivery_fee: 30,
    free_delivery_above: 500,
    min_order_amount: 50,
    allow_delivery: true,
    allow_pickup: true,
    allow_dine_in: true,
    social_instagram: "",
    social_facebook: "",
  });
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCouponModalOpen, setNewCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponPercent, setNewCouponPercent] = useState<number>(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(100);
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  async function fetchDashboard() {
    try {
      const data = await api.get<StoreDashboardStats>("/modules/storefront/dashboard");
      setStats(data);
    } catch {
      /* ignore */
    }
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const res = await api.get<{ items: StoreOrder[] }>("/modules/storefront/orders", {
        status_filter: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
        search: orderSearch || undefined,
      });
      setOrders(res.items || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فشل جلب طلبات المتجر");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchConfig() {
    try {
      const res = await api.get<{ tenant_slug: string; config: StoreConfigData }>(
        "/modules/storefront/config"
      );
      setConfig(res.config);
      setTenantSlug(res.tenant_slug);
    } catch {
      /* ignore */
    }
  }

  async function fetchCoupons() {
    setLoadingCoupons(true);
    try {
      const res = await api.get<{ coupons: CouponItem[] }>("/modules/storefront/coupons");
      setCoupons(res.coupons || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingCoupons(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
    fetchOrders();
    fetchConfig();
    fetchCoupons();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [orderStatusFilter]);

  async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.post<{ ok: boolean; message: string }>(
        `/modules/storefront/orders/${orderId}/status`,
        { status: newStatus }
      );
      toast.success(res.message);
      await fetchOrders();
      await fetchDashboard();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر تحديث حالة الطلب");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.put<{ ok: boolean; message: string }>(
        "/modules/storefront/config",
        config
      );
      toast.success(res.message || "تم حفظ إعدادات المتجر بنجاح");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر حفظ إعدادات المتجر");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      toast.error("الرجاء إدخال كود الخصم");
      return;
    }
    setCreatingCoupon(true);
    try {
      const res = await api.post<{ ok: boolean; message: string }>(
        "/modules/storefront/coupons",
        {
          code: newCouponCode.trim().toUpperCase(),
          discount_percent: newCouponPercent || undefined,
          min_order_amount: newCouponMinOrder || 0,
        }
      );
      toast.success(res.message);
      setNewCouponModalOpen(false);
      setNewCouponCode("");
      await fetchCoupons();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر إنشاء كود الخصم");
    } finally {
      setCreatingCoupon(false);
    }
  }

  const liveStoreUrl = tenantSlug ? `/store/${tenantSlug}` : "/storefront";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground">
              المتجر الإلكتروني وإدارة الطلبات (Tenant Storefront)
            </h1>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              أونلاين 24/7
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            الكتالوج العام، طلبات العملاء أونلاين، بوابات الدفع، وإعدادات العلامة التجارية لمساحة العمل «{tenant?.name}».
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchDashboard();
              fetchOrders();
            }}
            className="text-xs font-bold gap-1"
          >
            <RefreshCw className={`size-3.5 ${loadingOrders ? "animate-spin text-primary" : ""}`} />
            <span>تحديث</span>
          </Button>

          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link to={liveStoreUrl} target="_blank" rel="noopener noreferrer" />
            }
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Store className="size-3.5" />
            <span>معاينة المتجر المباشر</span>
            <ExternalLink className="size-3 opacity-80" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>مبيعات المتجر الإلكتروني</span>
            <DollarSign className="size-3.5 text-primary" />
          </span>
          <p className="text-xl font-black text-foreground mt-1.5 num">
            {formatCurrency(stats.total_revenue_egp)}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            متوسط الطلب: <strong className="num text-foreground">{formatCurrency(stats.average_ticket_egp)}</strong>
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>طلبات بانتظار التأكيد</span>
            <Clock className="size-3.5 text-amber-500" />
          </span>
          <p className="text-xl font-black text-amber-500 mt-1.5 num">
            {stats.pending_orders} <span className="text-xs font-normal text-muted-foreground">طلب</span>
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
            تتطلب موافقة المطبخ/التجهيز
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>قيد التجهيز والتوصيل</span>
            <Truck className="size-3.5 text-blue-500" />
          </span>
          <p className="text-xl font-black text-blue-500 mt-1.5 num">
            {stats.preparing_orders} <span className="text-xs font-normal text-muted-foreground">طلب</span>
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            جاري تحضيرها للشحن أو الاستلام
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>الطلبات المكتملة</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </span>
          <p className="text-xl font-black text-emerald-600 mt-1.5 num">
            {stats.completed_orders} <span className="text-xs font-normal text-muted-foreground">طلب</span>
          </p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">
            إجمالي الطلبات المنفذة: <span className="num font-bold">{stats.total_orders}</span>
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border text-xs font-bold gap-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="size-3.5" />
          <span>الطلبات الواردة (Live Orders)</span>
          <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] num">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("customizer")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "customizer"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="size-3.5" />
          <span>تخصيص وهوية المتجر (Customizer)</span>
        </button>

        <button
          onClick={() => setActiveTab("coupons")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "coupons"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="size-3.5" />
          <span>قسائم وكوبونات الخصم (Coupons)</span>
          <span className="rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[10px] num">
            {coupons.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Live Orders Dispatch Board */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/60">
            <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "كافة الطلبات" },
                { id: "pending", label: "جديدة (في الانتظار)", badge: stats.pending_orders },
                { id: "confirmed", label: "تم التأكيد" },
                { id: "preparing", label: "قيد التجهيز" },
                { id: "out_for_delivery", label: "مع المندوب" },
                { id: "completed", label: "مكتملة" },
                { id: "cancelled", label: "ملغاة" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                    orderStatusFilter === f.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{f.label}</span>
                  {f.badge !== undefined && f.badge > 0 && (
                    <span className="mr-1.5 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[9px] num">
                      {f.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="بحث برقم الطلب أو الهاتف أو العميل..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Orders Cards Grid / List */}
          {loadingOrders ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <RefreshCw className="size-6 animate-spin mx-auto text-primary" />
              <p className="text-xs">جاري جلب طلبات المتجر الحديثة...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2 rounded-xl border border-dashed border-border bg-card/30">
              <ShoppingBag className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-bold text-foreground">لا توجد طلبات مطابقة</p>
              <p className="text-xs">سيظهر هنا أي طلب جديد يُجريه العملاء من المتجر الإلكتروني مباشرة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {orders.map((o) => {
                const isUpdating = updatingOrderId === o.id;
                const statusStyles: Record<string, { label: string; color: string }> = {
                  pending: { label: "طلب جديد", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                  confirmed: { label: "تم التأكيد", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
                  preparing: { label: "قيد التجهيز", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
                  out_for_delivery: { label: "جاري التوصيل", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
                  completed: { label: "تم التسليم", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
                  cancelled: { label: "ملغي", color: "bg-destructive/10 text-destructive border-destructive/20" },
                };
                const currentStatus = statusStyles[o.status] || { label: o.status, color: "bg-muted text-muted-foreground" };

                return (
                  <div
                    key={o.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Card Top: Order Number & Status */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-primary">
                          {o.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentStatus.color}`}>
                          {currentStatus.label}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="mt-2.5 space-y-1">
                        <p className="font-bold text-foreground text-sm">{o.customer_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Phone className="size-3" />
                          <span>{o.customer_phone}</span>
                        </div>
                        {o.delivery_type === "delivery" && o.delivery_address && (
                          <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="size-3 shrink-0 mt-0.5 text-primary" />
                            <span>{o.delivery_address}</span>
                          </div>
                        )}
                        {o.delivery_type === "dine_in" && o.table_number && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                            <UtensilsCrossed className="size-3" />
                            <span>طلب صالة (طاولة رقم {o.table_number})</span>
                          </div>
                        )}
                        {o.delivery_type === "pickup" && (
                          <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2 py-0.2 rounded">
                            استلام ذاتي من الفرع
                          </span>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-muted-foreground block">الأصناف المطلوبة:</span>
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-foreground/90 text-[11px]">
                            <span>
                              <span className="num font-bold">{item.quantity}×</span> {item.product_name}
                            </span>
                            <span className="num font-bold text-foreground">{formatCurrency(item.total_price)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Financial summary */}
                      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {o.payment_method === "cod" ? "كاش عند الاستلام" : o.payment_method === "fawry" ? `فوري (${o.fawry_ref || "—"})` : o.payment_method.toUpperCase()}
                        </span>
                        <div className="text-left">
                          <span className="font-black text-sm text-foreground num">{formatCurrency(o.total_amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-border/80 flex items-center gap-1.5">
                      {o.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(o.id, "preparing")}
                          disabled={isUpdating}
                          className="flex-1 h-7 text-[11px] font-bold bg-primary text-primary-foreground"
                        >
                          {isUpdating ? <RefreshCw className="size-3 animate-spin" /> : <UtensilsCrossed className="size-3" />}
                          <span>قبول وتجهيز</span>
                        </Button>
                      )}
                      {o.status === "preparing" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(o.id, "out_for_delivery")}
                          disabled={isUpdating}
                          className="flex-1 h-7 text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Truck className="size-3" />
                          <span>إرسال للتوصيل</span>
                        </Button>
                      )}
                      {o.status === "out_for_delivery" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(o.id, "completed")}
                          disabled={isUpdating}
                          className="flex-1 h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="size-3" />
                          <span>تم التسليم</span>
                        </Button>
                      )}
                      {o.status !== "completed" && o.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateOrderStatus(o.id, "cancelled")}
                          disabled={isUpdating}
                          className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="size-3" />
                        </Button>
                      )}
                      {o.status === "completed" && (
                        <span className="w-full text-center text-[11px] font-bold text-emerald-600 bg-emerald-500/10 py-1 rounded">
                          طلب مكتمل ومسدد ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Visual Store Customizer */}
      {activeTab === "customizer" && (
        <form onSubmit={handleSaveConfig} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Storefront Identity */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b border-border pb-2">
                <Store className="size-4 text-primary" />
                <span>الهوية الأساسية والعناوين</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">اسم المتجر الإلكتروني:</label>
                <Input
                  value={config.store_title}
                  onChange={(e) => setConfig({ ...config, store_title: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">الوصف الترويجي (Tagline):</label>
                <Input
                  value={config.tagline || ""}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">شريط الإعلانات العاجلة (Announcement):</label>
                <Input
                  value={config.announcement || ""}
                  onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">رقم واتساب للتواصل السريع والطلبات:</label>
                <Input
                  placeholder="2010xxxxxxxx"
                  value={config.whatsapp_number || ""}
                  onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">لون العلامة التجارية (Theme Color):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.brand_color}
                    onChange={(e) => setConfig({ ...config, brand_color: e.target.value })}
                    className="size-9 rounded-lg border border-border cursor-pointer p-0.5"
                  />
                  <Input
                    value={config.brand_color}
                    onChange={(e) => setConfig({ ...config, brand_color: e.target.value })}
                    className="text-xs h-9 font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Delivery & Ordering Rules */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b border-border pb-2">
                <Truck className="size-4 text-primary" />
                <span>شروط التوصيل والاستلام</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">تكلفة التوصيل الثابتة (ج.م):</label>
                <Input
                  type="number"
                  min="0"
                  value={config.delivery_fee}
                  onChange={(e) => setConfig({ ...config, delivery_fee: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">حد التوصيل المجاني (ج.م):</label>
                <Input
                  type="number"
                  min="0"
                  value={config.free_delivery_above || 0}
                  onChange={(e) => setConfig({ ...config, free_delivery_above: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">الحد الأدنى لقيمة الطلب (ج.م):</label>
                <Input
                  type="number"
                  min="0"
                  value={config.min_order_amount}
                  onChange={(e) => setConfig({ ...config, min_order_amount: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 font-mono"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allow_delivery}
                    onChange={(e) => setConfig({ ...config, allow_delivery: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>تفعيل التوصيل للمنازل (Home Delivery)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allow_pickup}
                    onChange={(e) => setConfig({ ...config, allow_pickup: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>تفعيل الاستلام الذاتي من الفرع (Pickup)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allow_dine_in}
                    onChange={(e) => setConfig({ ...config, allow_dine_in: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>تفعيل طلب الصالة والطاولات (Dine-in / Tables)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={savingConfig} className="font-bold text-xs gap-1.5 px-6">
              {savingConfig ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              <span>حفظ وتطبيق إعدادات المتجر</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: Discount Coupons Manager */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xs font-bold text-foreground">قسائم وكوبونات الخصم الترويجية</h2>
              <p className="text-[11px] text-muted-foreground">
                إنشاء أكواد خصم ترويجية بنسبة مئوية أو قيمة ثابتة للعملاء عند الشراء من المتجر.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setNewCouponModalOpen(true)}
              className="text-xs font-bold gap-1"
            >
              <Plus className="size-3.5" />
              <span>إضافة كود خصم</span>
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                <tr>
                  <th className="py-3 px-4">كود الخصم</th>
                  <th className="py-3 px-3">قيمة الخصم</th>
                  <th className="py-3 px-3">الحد الأدنى للطلب</th>
                  <th className="py-3 px-3">مرات الاستخدام</th>
                  <th className="py-3 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                      {loadingCoupons ? "جاري تحميل أكواد الخصم..." : "لا توجد أكواد خصم مسجلة حالياً"}
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{c.code}</td>
                      <td className="py-3 px-3 font-bold text-foreground">
                        {c.discount_percent ? `${c.discount_percent}% خصم` : formatCurrency(c.discount_amount || 0)}
                      </td>
                      <td className="py-3 px-3 num text-muted-foreground">{formatCurrency(c.min_order_amount)}</td>
                      <td className="py-3 px-3 font-mono">
                        {c.used_count} / {c.max_uses ? c.max_uses : "∞"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {c.is_active ? "مفعل ✓" : "معطل"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Coupon Modal */}
      <Dialog open={newCouponModalOpen} onOpenChange={setNewCouponModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-1.5">
              <Tag className="size-4 text-primary" />
              <span>إنشاء كود خصم جديد</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCoupon} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground">كود الخصم (Promo Code):</label>
              <Input
                placeholder="مثال: SUMMER20 أو WELCOME"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">نسبة الخصم المئوية (%):</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newCouponPercent}
                onChange={(e) => setNewCouponPercent(parseInt(e.target.value) || 0)}
                className="font-mono text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">الحد الأدنى لقيمة الطلب (ج.م):</label>
              <Input
                type="number"
                min="0"
                value={newCouponMinOrder}
                onChange={(e) => setNewCouponMinOrder(parseInt(e.target.value) || 0)}
                className="font-mono text-xs h-9"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewCouponModalOpen(false)}
                disabled={creatingCoupon}
              >
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={creatingCoupon} className="font-bold">
                {creatingCoupon ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-3" />}
                <span>حفظ الكود</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
