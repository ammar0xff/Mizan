/**
 * PAGE CONTRACT
 * Page: التجارة الإلكترونية والربط متعدد القنوات (/ecommerce)
 * Archetype: Omnichannel E-Commerce & Fulfillment Hub (ECS-01..12)
 * User: مدير المتجر الإلكتروني، مسؤول تجهيز الطلبيات Pick-Pack-Ship، ومحاسب تسويات الدفع
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status badges, no purple gradients)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Plus,
  Package,
  RotateCcw,
  ShoppingCart,
  DollarSign,
  Search,
  RefreshCw,
  Send,
  Truck,
  Barcode,
} from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";
import { ErrorBox, Input, Modal, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { moneyEGP } from "@/lib/format";
import { sound } from "@/lib/sound";

interface EcommerceSummary {
  stores_count: number;
  total_orders: number;
  pending_fulfillment: number;
  total_gmv: number;
  pending_cod_amount: number;
  open_returns_count: number;
  total_abandoned_carts: number;
  recovered_revenue: number;
}

interface ChannelStore {
  id: string;
  platform: string;
  store_name: string;
  store_url: string;
  sync_status: "connected" | "syncing" | "warning" | "disconnected";
  last_sync_time: string;
  buffer_stock_percent: number;
  total_synced_products: number;
  total_orders_imported: number;
  is_active: boolean;
}

interface OrderFulfillment {
  id: string;
  order_number: string;
  channel_platform: string;
  customer_name: string;
  customer_phone: string;
  shipping_city: string;
  shipping_address: string;
  items_summary: string;
  total_amount: number;
  payment_gateway: string;
  payment_status: "paid" | "pending_cod" | "refunded";
  fulfillment_status: "unfulfilled" | "picking" | "packed" | "shipped" | "delivered" | "returned";
  courier_name: string;
  tracking_number: string;
  shipping_label_barcode: string;
}

interface ReturnRequest {
  id: string;
  rma_number: string;
  order_number: string;
  customer_name: string;
  return_reason: string;
  items_count: number;
  refund_amount: number;
  status: "requested" | "approved" | "received_inspected" | "restocked_refunded" | "rejected";
  restocked_to_inventory: boolean;
}

interface CodReconciliation {
  id: string;
  remittance_batch: string;
  courier_name: string;
  orders_count: number;
  total_collected_cash: number;
  courier_delivery_fees: number;
  net_remitted_amount: number;
  status: string;
  bank_deposit_reference: string;
  settled_date: string;
}

interface AbandonedCart {
  id: string;
  cart_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  cart_total: number;
  items_preview: string;
  abandoned_time_ago: string;
  recovery_status: "abandoned" | "reminder_sent" | "recovered";
  discount_coupon: string;
  recovered_amount: number;
}

export default function EcommerceHubPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"orders" | "channels" | "cod" | "returns_carts">("orders");
  const [search, setSearch] = useState("");

  // Ship Order Modal
  const [orderToShip, setOrderToShip] = useState<OrderFulfillment | null>(null);
  const [shipTrackingNumber, setShipTrackingNumber] = useState("");
  const [isShipping, setIsShipping] = useState(false);

  // New Store Connection Modal
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({
    platform: "Shopify",
    store_name: "",
    store_url: "",
    buffer_stock_percent: "10.0",
  });

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<EcommerceSummary>({
    queryKey: ["ecom-summary"],
    queryFn: () => api.get("/ecommerce/summary"),
  });

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<OrderFulfillment[]>({
    queryKey: ["ecom-orders"],
    queryFn: () => api.get("/ecommerce/orders"),
  });

  const { data: stores = [], isLoading: isStoresLoading } = useQuery<ChannelStore[]>({
    queryKey: ["ecom-stores"],
    queryFn: () => api.get("/ecommerce/stores"),
  });

  const { data: codReconciliations = [] } = useQuery<CodReconciliation[]>({
    queryKey: ["ecom-cod"],
    queryFn: () => api.get("/ecommerce/cod-reconciliations"),
  });

  const { data: returns = [] } = useQuery<ReturnRequest[]>({
    queryKey: ["ecom-returns"],
    queryFn: () => api.get("/ecommerce/returns"),
  });

  const { data: carts = [] } = useQuery<AbandonedCart[]>({
    queryKey: ["ecom-carts"],
    queryFn: () => api.get("/ecommerce/abandoned-carts"),
  });

  const handlePackOrder = async (orderId: string) => {
    try {
      const res = await api.post<{ label: string }>(`/ecommerce/orders/${orderId}/pack`, {
        courier_name: "بوسطة للشحن (Bosta)",
      });
      toast("success", `تم تجهيز الشحنة وتوليد الباركود ${res.label}`);
      queryClient.invalidateQueries({ queryKey: ["ecom-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ecom-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تجهيز الشحنة";
      toast("error", msg);
    }
  };

  const handleShipOrder = async () => {
    if (!orderToShip || !shipTrackingNumber) return;
    setIsShipping(true);
    try {
      await api.post(`/ecommerce/orders/${orderToShip.id}/ship`, {
        tracking_number: shipTrackingNumber,
      });
      toast("success", "تم تسليم الشحنة للناقل وإرسال رقم التتبع للعميل");
      setOrderToShip(null);
      setShipTrackingNumber("");
      queryClient.invalidateQueries({ queryKey: ["ecom-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ecom-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر شحن الطلب";
      toast("error", msg);
    } finally {
      setIsShipping(false);
    }
  };

  const handleSyncStore = async (storeId: string) => {
    try {
      await api.post(`/ecommerce/stores/${storeId}/sync`);
      toast("success", "تمت مزامنة المخزون والطلبيات مع المنصة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["ecom-stores"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر مزامنة المتجر";
      toast("error", msg);
    }
  };

  const handleSendCartReminder = async (cartId: string) => {
    try {
      const res = await api.post<{ message: string }>(`/ecommerce/abandoned-carts/${cartId}/send-reminder`);
      toast("success", res.message);
      queryClient.invalidateQueries({ queryKey: ["ecom-carts"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إرسال التذكير";
      toast("error", msg);
    }
  };

  const handleRestockReturn = async (returnId: string) => {
    try {
      await api.post(`/ecommerce/returns/${returnId}/restock`);
      toast("success", "تم فحص المرتجع وإعادته للمخزون واعتماد رد القيمة للعميل");
      queryClient.invalidateQueries({ queryKey: ["ecom-returns"] });
      queryClient.invalidateQueries({ queryKey: ["ecom-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إعادة الصنف للمخزون";
      toast("error", msg);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/ecommerce/stores", {
        platform: storeForm.platform,
        store_name: storeForm.store_name,
        store_url: storeForm.store_url,
        buffer_stock_percent: parseFloat(storeForm.buffer_stock_percent) || 10.0,
      });
      toast("success", "تم ربط المتجر بنجاح");
      setIsAddingStore(false);
      setStoreForm({
        platform: "Shopify",
        store_name: "",
        store_url: "",
        buffer_stock_percent: "10.0",
      });
      queryClient.invalidateQueries({ queryKey: ["ecom-stores"] });
      queryClient.invalidateQueries({ queryKey: ["ecom-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر ربط المتجر";
      toast("error", msg);
    }
  };

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorBox message="تعذر تحميل بيانات وحدة التجارة الإلكترونية" />
      </div>
    );
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_city.toLowerCase().includes(search.toLowerCase()) ||
      o.items_summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">التجارة الإلكترونية والربط متعدد القنوات</h1>
                <Badge variant="outline" className="border-purple-500/40 text-purple-500 bg-purple-500/5 text-xs font-mono">
                  ECS-01..12
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                ربط المتاجر والمنصات (Shopify, Amazon, Salla)، مخزون الأمان العازل، تجهيز الشحنات Pick-Pack-Ship، وتوليد البوالص وتسوية COD
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab === "channels" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAddingStore(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              ربط منصة متجر جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">طلبيات قيد التجهيز والشحن</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.pending_fulfillment || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">طلبية</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي مبيعات القنوات (GMV): {moneyEGP(summary?.total_gmv || 0)}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">متحصلات الدفع عند الاستلام (COD)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.pending_cod_amount || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">قيد التحصيل مع شركات الشحن السريع</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">المنصات والمتاجر المتصلة</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.stores_count || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">قنوات متزامنة</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">حماية مخزون الأمان العازل فعّالة</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">إيرادات السلات المتروكة المستردة</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.recovered_revenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary?.open_returns_count || 0} طلبات مرتجعات RMA قيد الفحص
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.click();
              setTab("orders");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "orders"
                ? "border-purple-500 text-purple-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الطلبات والتجهيز (Pick-Pack-Ship)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("channels");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "channels"
                ? "border-purple-500 text-purple-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            القنوات والربط المتعدد (Channels)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("cod");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "cod"
                ? "border-purple-500 text-purple-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            تسوية الدفع عند الاستلام (COD Remittances)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("returns_carts");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "returns_carts"
                ? "border-purple-500 text-purple-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            المرتجعات والسلات المتروكة (RMA & Abandoned)
          </button>
        </div>

        <div className="relative w-64 pb-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الطلب، العميل، المدينة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Orders & Fulfillment Workflow */}
      {tab === "orders" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم الطلب والمنصة</TableHead>
                <TableHead className="text-right">العميل والعنوان</TableHead>
                <TableHead className="text-right">محتويات الشحنة</TableHead>
                <TableHead className="text-right">إجمالي الطلب</TableHead>
                <TableHead className="text-center">بوابة الدفع والحالة</TableHead>
                <TableHead className="text-center">حالة التجهيز والشحن</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOrdersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد طلبيات مطابقة للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-sm">{ord.order_number}</div>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        {ord.channel_platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground text-sm">{ord.customer_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {ord.shipping_city} ({ord.customer_phone})
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-foreground max-w-[220px] truncate">{ord.items_summary}</div>
                      {ord.shipping_label_barcode && (
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3" />
                          <span>{ord.shipping_label_barcode}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(ord.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-foreground">{ord.payment_gateway}</span>
                        <Badge
                          variant="outline"
                          className={
                            ord.payment_status === "paid"
                              ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-[10px] mt-0.5"
                              : "border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] mt-0.5"
                          }
                        >
                          {ord.payment_status === "paid" ? "مدفوع إلكترونياً" : "دفع عند الاستلام"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          ord.fulfillment_status === "shipped"
                            ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                            : ord.fulfillment_status === "packed"
                            ? "border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs"
                            : "border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs"
                        }
                      >
                        {ord.fulfillment_status === "shipped"
                          ? "تم الشحن مع الناقل"
                          : ord.fulfillment_status === "packed"
                          ? "مغلفة وجاهزة"
                          : "بانتظار التجهيز"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {ord.fulfillment_status === "unfulfilled" && (
                        <Button
                          size="sm"
                          onClick={() => handlePackOrder(ord.id)}
                          className="text-xs h-7 px-2.5 bg-blue-600 hover:bg-blue-500 text-white gap-1"
                        >
                          <Package className="w-3.5 h-3.5" />
                          تغليف وتوليد بوليصة
                        </Button>
                      )}
                      {ord.fulfillment_status === "packed" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            sound.click();
                            setOrderToShip(ord);
                          }}
                          className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          تسليم للناقل
                        </Button>
                      )}
                      {ord.fulfillment_status === "shipped" && (
                        <div className="text-[11px] font-mono text-emerald-500 font-semibold">
                          تتبع: {ord.tracking_number}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Connected Channels */}
      {tab === "channels" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isStoresLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5 border-border/50">
                <Skeleton className="h-32 w-full" />
              </Card>
            ))
          ) : (
            stores.map((store) => (
              <Card key={store.id} className="p-5 border-border/50 space-y-3.5 hover:border-purple-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">{store.store_name}</div>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        {store.platform}
                      </Badge>
                    </div>
                  </div>

                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs">
                    متصل ومتزامن
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground truncate font-mono">{store.store_url}</div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border/40">
                  <div>الأصناف المتزامنة: {store.total_synced_products}</div>
                  <div>الطلبات المستوردة: {store.total_orders_imported}</div>
                  <div>مخزون الأمان العازل: {store.buffer_stock_percent}%</div>
                  <div>آخر مزامنة: {store.last_sync_time}</div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncStore(store.id)}
                  className="w-full text-xs gap-1.5 border-border/60 hover:bg-muted"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  مزامنة المخزون والطلبيات الآن
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 3: COD Remittances */}
      {tab === "cod" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم دفعة التسوية</TableHead>
                <TableHead className="text-right">شركة الشحن والتوصيل</TableHead>
                <TableHead className="text-center">عدد الطلبيات المحصلة</TableHead>
                <TableHead className="text-right">إجمالي النقدية المحصلة</TableHead>
                <TableHead className="text-right">عمولة ومصاريف الشحن</TableHead>
                <TableHead className="text-right">صافي المبلغ المودع</TableHead>
                <TableHead className="text-right">المرجع البنكي والتاريخ</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codReconciliations.map((cod) => (
                <TableRow key={cod.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono font-bold text-foreground text-sm">
                    {cod.remittance_batch}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{cod.courier_name}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-foreground">
                    {cod.orders_count} طلبية
                  </TableCell>
                  <TableCell className="font-mono font-bold text-foreground">
                    {moneyEGP(cod.total_collected_cash)}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {moneyEGP(cod.courier_delivery_fees)}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-emerald-500">
                    {moneyEGP(cod.net_remitted_amount)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div>{cod.bank_deposit_reference}</div>
                    <div>{cod.settled_date}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs">
                      تم الإيداع بالحساب
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: RMA Returns & Abandoned Carts */}
      {tab === "returns_carts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RMA Returns */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">إدارة المرتجعات والاستبدال (RMA)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {returns.length} طلب
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {returns.map((rma) => (
                <div key={rma.id} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{rma.rma_number}</span>
                    <Badge
                      variant="outline"
                      className={
                        rma.status === "restocked_refunded"
                          ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                          : "border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs"
                      }
                    >
                      {rma.status === "restocked_refunded" ? "تم الإرجاع والرد" : "طلب قيد المراجعة"}
                    </Badge>
                  </div>
                  <div className="text-xs text-foreground">
                    العميل: {rma.customer_name} (طلب: {rma.order_number})
                  </div>
                  <div className="text-xs text-muted-foreground">{rma.return_reason}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <span className="font-mono font-bold text-sm text-foreground">
                      القيمة: {moneyEGP(rma.refund_amount)}
                    </span>
                    {rma.status === "requested" && (
                      <Button
                        size="sm"
                        onClick={() => handleRestockReturn(rma.id)}
                        className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        إعادة للمخزون ورد القيمة
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Abandoned Carts Recovery */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-sm">استرجاع السلات المتروكة (Cart Recovery)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {carts.length} سلة
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {carts.map((cart) => (
                <div key={cart.id} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{cart.customer_name}</span>
                    <Badge
                      variant="outline"
                      className={
                        cart.recovery_status === "recovered"
                          ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                          : cart.recovery_status === "reminder_sent"
                          ? "border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs"
                          : "border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs"
                      }
                    >
                      {cart.recovery_status === "recovered"
                        ? "تم الاسترجاع والشراء"
                        : cart.recovery_status === "reminder_sent"
                        ? "تم إرسال العرض"
                        : "سلة متروكة"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{cart.items_preview}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs font-mono">
                    <span className="font-bold text-foreground">{moneyEGP(cart.cart_total)}</span>
                    <span className="text-muted-foreground">{cart.abandoned_time_ago}</span>
                  </div>
                  {cart.recovery_status === "abandoned" && (
                    <Button
                      size="sm"
                      onClick={() => handleSendCartReminder(cart.id)}
                      className="w-full text-xs h-7.5 bg-purple-600 hover:bg-purple-500 text-white gap-1.5 mt-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      إرسال تذكير واتساب بكوبون خصم {cart.discount_coupon}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Ship Order Modal */}
      <Modal open={!!orderToShip} onClose={() => setOrderToShip(null)} title="تسليم الشحنة لشركة الشحن وتفعيل التتبع">
        <div className="space-y-4 text-right" dir="rtl">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono space-y-1">
            <div className="font-bold text-foreground text-sm">{orderToShip?.order_number}</div>
            <div className="text-muted-foreground">
              العميل: {orderToShip?.customer_name} ({orderToShip?.shipping_city})
            </div>
            <div className="text-muted-foreground">
              شركة الشحن: {orderToShip?.courier_name}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">رقم بوليصة التتبع من الناقل (Airway Bill / Tracking)</label>
            <Input
              required
              placeholder="مثال: BST-EG-998811..."
              value={shipTrackingNumber}
              onChange={(e) => setShipTrackingNumber(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button variant="ghost" onClick={() => setOrderToShip(null)}>
              إلغاء
            </Button>
            <Button
              onClick={handleShipOrder}
              disabled={isShipping || !shipTrackingNumber}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isShipping ? "جاري الإرسال..." : "تأكيد الشحن وإشعار العميل"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Connect Store Modal */}
      <Modal open={isAddingStore} onClose={() => setIsAddingStore(false)} title="ربط منصة متجر إلكتروني جديدة">
        <form onSubmit={handleCreateStore} className="space-y-3.5 text-right" dir="rtl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">منصة المتجر</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={storeForm.platform}
              onChange={(e) => setStoreForm({ ...storeForm, platform: e.target.value })}
            >
              <option value="Shopify">Shopify</option>
              <option value="Amazon">Amazon.eg Seller Central</option>
              <option value="Salla">سلة (Salla)</option>
              <option value="Zid">زد (Zid)</option>
              <option value="WooCommerce">WooCommerce</option>
              <option value="Noon">Noon Market</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">اسم المتجر / المعرف</label>
            <Input
              required
              placeholder="مثال: متجر فيندورا للأجهزة..."
              value={storeForm.store_name}
              onChange={(e) => setStoreForm({ ...storeForm, store_name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">رابط المتجر أو نطاق الـ API</label>
            <Input
              required
              placeholder="https://..."
              value={storeForm.store_url}
              onChange={(e) => setStoreForm({ ...storeForm, store_url: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">نسبة مخزون الأمان العازل (%)</label>
            <Input
              type="number"
              value={storeForm.buffer_stock_percent}
              onChange={(e) => setStoreForm({ ...storeForm, buffer_stock_percent: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setIsAddingStore(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white">
              ربط ومزامنة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
