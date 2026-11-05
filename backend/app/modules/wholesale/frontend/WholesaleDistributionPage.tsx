/**
 * PAGE CONTRACT
 * Page: تجارة الجملة والتوزيع والتوريدات (/wholesale)
 * Archetype: Wholesale & Bulk Distribution Hub (WHO-01..10)
 * User: مدير المبيعات والتوزيع، محاسب تكاليف الاستيراد، ومراقب الائتمان
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status badges, no purple gradients)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Plus,
  ShieldAlert,
  Ship,
  TrendingUp,
  Percent,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  PackageCheck,
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

interface WholesaleSummary {
  price_lists_count: number;
  tiered_rules_count: number;
  total_credit_exposure: number;
  total_approved_limits: number;
  credit_utilization_percent: number;
  blocked_distributors_count: number;
  total_landed_cost_volume: number;
  drop_shipments_count: number;
  total_accrued_rebates: number;
}

interface TieredPrice {
  id: string;
  product_name: string;
  barcode: string;
  min_quantity: number;
  max_quantity: number;
  tier_name: string;
  unit_price: number;
  discount_percent: number;
  is_active: boolean;
}

interface CreditExposure {
  id: string;
  customer_name: string;
  customer_class: string;
  approved_credit_limit: number;
  current_receivables: number;
  unbilled_delivery_notes: number;
  pending_sales_orders: number;
  total_exposure: number;
  remaining_credit: number;
  max_allowed_overdue_days: number;
  oldest_overdue_days: number;
  is_blocked: boolean;
  block_reason: string;
}

interface LandedCost {
  id: string;
  shipment_reference: string;
  origin_country: string;
  supplier_name: string;
  fob_goods_value: number;
  freight_charges: number;
  customs_tariffs: number;
  port_clearance_fees: number;
  marine_insurance: number;
  allocation_method: string;
  total_landed_cost: number;
  cost_multiplier: number;
  status: string;
  notes: string;
}

interface DropShipment {
  id: string;
  order_ref: string;
  customer_name: string;
  customer_destination: string;
  supplier_name: string;
  product_description: string;
  quantity: number;
  supplier_po_ref: string;
  carrier_name: string;
  tracking_number: string;
  status: string;
  is_three_way_reconciled: boolean;
}

interface DistributorRebate {
  id: string;
  distributor_name: string;
  period: string;
  target_sales_amount: number;
  achieved_sales_amount: number;
  achievement_percent: number;
  rebate_rate_percent: number;
  rebate_amount: number;
  status: string;
  credit_note_ref: string;
}

export default function WholesaleDistributionPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"tiers" | "credit" | "landed" | "dropship">("tiers");
  const [search, setSearch] = useState("");

  // Block modal state
  const [selectedExposure, setSelectedExposure] = useState<CreditExposure | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  // New Tier Price Modal
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [tierForm, setTierForm] = useState({
    product_name: "",
    barcode: "",
    min_quantity: "100",
    max_quantity: "499",
    tier_name: "شريحة الجملة المعتمدة",
    unit_price: "",
    discount_percent: "5.0",
  });

  // New Landed Cost Modal
  const [isAddingLanded, setIsAddingLanded] = useState(false);
  const [landedForm, setLandedForm] = useState({
    shipment_reference: "",
    origin_country: "ألمانيا",
    supplier_name: "",
    fob_goods_value: "",
    freight_charges: "",
    customs_tariffs: "",
    port_clearance_fees: "",
    marine_insurance: "",
    notes: "",
  });

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<WholesaleSummary>({
    queryKey: ["wholesale-summary"],
    queryFn: () => api.get("/wholesale/summary"),
  });

  const { data: tiers = [], isLoading: isTiersLoading } = useQuery<TieredPrice[]>({
    queryKey: ["wholesale-tiers"],
    queryFn: () => api.get("/wholesale/tiered-prices"),
  });

  const { data: exposures = [], isLoading: isExposuresLoading } = useQuery<CreditExposure[]>({
    queryKey: ["wholesale-credit"],
    queryFn: () => api.get("/wholesale/credit-limits"),
  });

  const { data: landedCosts = [], isLoading: isLandedLoading } = useQuery<LandedCost[]>({
    queryKey: ["wholesale-landed"],
    queryFn: () => api.get("/wholesale/landed-costs"),
  });

  const { data: dropShipments = [] } = useQuery<DropShipment[]>({
    queryKey: ["wholesale-dropship"],
    queryFn: () => api.get("/wholesale/drop-shipments"),
  });

  const { data: rebates = [] } = useQuery<DistributorRebate[]>({
    queryKey: ["wholesale-rebates"],
    queryFn: () => api.get("/wholesale/rebates"),
  });

  const handleToggleBlock = async () => {
    if (!selectedExposure) return;
    setIsBlocking(true);
    try {
      const willBlock = !selectedExposure.is_blocked;
      await api.post(`/wholesale/credit-limits/${selectedExposure.id}/block`, {
        is_blocked: willBlock,
        block_reason: willBlock ? blockReason || "تجاوز السقف الائتماني والمديونيات المتأخرة" : "",
      });
      toast("success", willBlock ? "تم حظر العميل بنجاح" : "تم فك الحظر الائتماني");
      setSelectedExposure(null);
      setBlockReason("");
      queryClient.invalidateQueries({ queryKey: ["wholesale-credit"] });
      queryClient.invalidateQueries({ queryKey: ["wholesale-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تعديل حالة الحظر الائتماني";
      toast("error", msg);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/wholesale/tiered-prices", {
        product_name: tierForm.product_name,
        barcode: tierForm.barcode,
        min_quantity: parseInt(tierForm.min_quantity) || 1,
        max_quantity: parseInt(tierForm.max_quantity) || 999999,
        tier_name: tierForm.tier_name,
        unit_price: parseFloat(tierForm.unit_price) || 0,
        discount_percent: parseFloat(tierForm.discount_percent) || 0,
      });
      toast("success", "تم حفظ شريحة التسعير الكمي بنجاح");
      setIsAddingTier(false);
      setTierForm({
        product_name: "",
        barcode: "",
        min_quantity: "100",
        max_quantity: "499",
        tier_name: "شريحة الجملة المعتمدة",
        unit_price: "",
        discount_percent: "5.0",
      });
      queryClient.invalidateQueries({ queryKey: ["wholesale-tiers"] });
      queryClient.invalidateQueries({ queryKey: ["wholesale-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر حفظ شريحة التسعير";
      toast("error", msg);
    }
  };

  const handleCreateLanded = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/wholesale/landed-costs", {
        shipment_reference: landedForm.shipment_reference,
        origin_country: landedForm.origin_country,
        supplier_name: landedForm.supplier_name,
        fob_goods_value: parseFloat(landedForm.fob_goods_value) || 0,
        freight_charges: parseFloat(landedForm.freight_charges) || 0,
        customs_tariffs: parseFloat(landedForm.customs_tariffs) || 0,
        port_clearance_fees: parseFloat(landedForm.port_clearance_fees) || 0,
        marine_insurance: parseFloat(landedForm.marine_insurance) || 0,
        notes: landedForm.notes,
      });
      toast("success", "تم احتساب وتوزيع تكلفة الاستيراد المفرغة بنجاح");
      setIsAddingLanded(false);
      setLandedForm({
        shipment_reference: "",
        origin_country: "ألمانيا",
        supplier_name: "",
        fob_goods_value: "",
        freight_charges: "",
        customs_tariffs: "",
        port_clearance_fees: "",
        marine_insurance: "",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["wholesale-landed"] });
      queryClient.invalidateQueries({ queryKey: ["wholesale-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر احتساب تكلفة الاستيراد";
      toast("error", msg);
    }
  };

  const handleIssueRebateCreditNote = async (rebateId: string) => {
    try {
      const res = await api.post<{ credit_note_ref: string }>(`/wholesale/rebates/${rebateId}/issue-credit-note`);
      toast("success", `تم إصدار إشعار دائن رقم ${res.credit_note_ref} لحساب الموزع`);
      queryClient.invalidateQueries({ queryKey: ["wholesale-rebates"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إصدار الإشعار الدائن";
      toast("error", msg);
    }
  };

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorBox message="تعذر تحميل بيانات وحدة تجارة الجملة والتوزيع" />
      </div>
    );
  }

  const filteredTiers = tiers.filter(
    (t) =>
      t.product_name.toLowerCase().includes(search.toLowerCase()) ||
      t.tier_name.toLowerCase().includes(search.toLowerCase()) ||
      t.barcode.includes(search)
  );

  const filteredExposures = exposures.filter(
    (e) =>
      e.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      e.customer_class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">تجارة الجملة والتوزيع والتوريدات</h1>
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs font-mono">
                  WHO-01..10
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                سلالم التسعير الكمي المتدرج، رقابة سقوف الائتمان، تكاليف الاستيراد المفرغة Landed Cost، والشحن المباشر ومكافآت الموزعين
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab === "tiers" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAddingTier(true);
              }}
              className="gap-2 bg-primary text-primary-foreground shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة شريحة تسعير كمي
            </Button>
          )}
          {tab === "landed" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAddingLanded(true);
              }}
              className="gap-2 bg-primary text-primary-foreground shadow-sm"
            >
              <Ship className="w-4 h-4" />
              توزيع تكلفة شحنة استيراد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">إجمالي المديونية المعرضة للخطر</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.total_credit_exposure || 0)}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
              <span>نسبة الإشغال: {summary?.credit_utilization_percent || 0}%</span>
              <span>•</span>
              <span className="text-destructive font-semibold">
                {summary?.blocked_distributors_count || 0} عملاء محظورين
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">سلالم التسعير الكمي الفعالة</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.tiered_rules_count || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">شريحة</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              موزعة عبر {summary?.price_lists_count || 0} قوائم أسعار قطاعية معتمدة
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">حجم تكاليف الاستيراد الموزعة (Landed)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.total_landed_cost_volume || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">شاملة الشحن الجمركي، التأمين، ورسوم الموانئ</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">مكافآت التوزيع المستحقة (Rebates)</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.total_accrued_rebates || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.drop_shipments_count || 0} عمليات شحن مباشر Drop-Shipment جارية
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.click();
              setTab("tiers");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "tiers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            سلالم التسعير الكمي (Tiered Pricing)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("credit");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "credit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            سقوف الائتمان ورقابة المخاطر (Credit Ledger)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("landed");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "landed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            تكلفة الاستيراد المفرغة (Landed Cost)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("dropship");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "dropship"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الشحن المباشر ومكافآت التوزيع (Drop-Ship & Rebates)
          </button>
        </div>

        <div className="relative w-64 pb-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Tiered Pricing Ladders */}
      {tab === "tiers" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">المنتج والباركود</TableHead>
                <TableHead className="text-right">شريحة الكمية المطبقة</TableHead>
                <TableHead className="text-center">الكمية الصغرى - الكبرى</TableHead>
                <TableHead className="text-right">سعر الوحدة بالجملة</TableHead>
                <TableHead className="text-center">نسبة الخصم</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTiersLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد شرائح تسعير كمي مطابقة للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredTiers.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-semibold text-foreground">{item.product_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{item.barcode}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{item.tier_name}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/50">
                        {item.min_quantity.toLocaleString("en-US")} إلى{" "}
                        {item.max_quantity >= 999999 ? "∞" : item.max_quantity.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.discount_percent > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {item.discount_percent}% خصم
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">سعر الأساس</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs">
                        فعّال
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Credit Exposure & Ceilings */}
      {tab === "credit" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">العميل والتصنيف</TableHead>
                <TableHead className="text-right">سقف الائتمان المعتمد</TableHead>
                <TableHead className="text-right">المديونية الحالية (AR)</TableHead>
                <TableHead className="text-right">أذون غير مفوترة + أوامر معلقة</TableHead>
                <TableHead className="text-right">إجمالي التعرض (Total Exposure)</TableHead>
                <TableHead className="text-center">فترة التأخير</TableHead>
                <TableHead className="text-center">حالة الحظر</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isExposuresLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredExposures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد سجلات ائتمان مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredExposures.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-semibold text-foreground">{item.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{item.customer_class}</div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(item.approved_credit_limit)}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {moneyEGP(item.current_receivables)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {moneyEGP(item.unbilled_delivery_notes + item.pending_sales_orders)}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      <span
                        className={
                          item.total_exposure > item.approved_credit_limit
                            ? "text-destructive"
                            : "text-foreground"
                        }
                      >
                        {moneyEGP(item.total_exposure)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <span
                        className={
                          item.oldest_overdue_days > item.max_allowed_overdue_days
                            ? "text-destructive font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {item.oldest_overdue_days} يوم (الحد: {item.max_allowed_overdue_days})
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_blocked ? (
                        <div className="flex flex-col items-center">
                          <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 text-xs">
                            محظور بيعياً
                          </Badge>
                          {item.block_reason && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px] mt-0.5">
                              {item.block_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs">
                          نشط وسليم
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          sound.click();
                          setSelectedExposure(item);
                        }}
                        className={`text-xs gap-1.5 ${
                          item.is_blocked
                            ? "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                            : "border-destructive/40 text-destructive hover:bg-destructive/10"
                        }`}
                      >
                        {item.is_blocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            فك الحظر
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            تجميد ائتماني
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 3: Landed Cost Allocation */}
      {tab === "landed" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">مرجع الشحنة والمورد</TableHead>
                <TableHead className="text-right">بلد المنشأ</TableHead>
                <TableHead className="text-right">قيمة البضاعة FOB</TableHead>
                <TableHead className="text-right">الشحن الجوي/البحري</TableHead>
                <TableHead className="text-right">الجمارك والرسوم والتأمين</TableHead>
                <TableHead className="text-right">التكلفة المفرغة الإجمالية</TableHead>
                <TableHead className="text-center">معامل التحميل</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLandedLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : landedCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد شحنات استيراد مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                landedCosts.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-semibold text-foreground font-mono">{item.shipment_reference}</div>
                      <div className="text-xs text-muted-foreground">{item.supplier_name}</div>
                    </TableCell>
                    <TableCell className="text-sm">{item.origin_country}</TableCell>
                    <TableCell className="font-mono font-medium text-foreground">
                      {moneyEGP(item.fob_goods_value)}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {moneyEGP(item.freight_charges)}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {moneyEGP(item.customs_tariffs + item.port_clearance_fees + item.marine_insurance)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(item.total_landed_cost)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {item.cost_multiplier}x
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs">
                        تم التوزيع
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Drop-Shipping & Distributor Rebates */}
      {tab === "dropship" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drop Shipping Section */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base">عمليات الشحن المباشر (Drop-Shipping)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {dropShipments.length} إرسالية
              </Badge>
            </div>

            <div className="mt-4 space-y-4">
              {dropShipments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  لا توجد طلبات شحن مباشر حالياً
                </div>
              ) : (
                dropShipments.map((ds) => (
                  <div
                    key={ds.id}
                    className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-foreground">{ds.order_ref}</span>
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs"
                      >
                        {ds.status === "in_transit" ? "قيد النقل المباشر" : "تم التوصيل"}
                      </Badge>
                    </div>

                    <div className="text-sm font-medium text-foreground">{ds.product_description}</div>

                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 pt-1 border-t border-border/30 font-mono">
                      <div>المورد: {ds.supplier_name}</div>
                      <div>العميل: {ds.customer_name}</div>
                      <div>الناقل: {ds.carrier_name}</div>
                      <div>التتبع: {ds.tracking_number}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Rebates Section */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-base">مكافآت التوزيع التراكمية (Rebates)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {rebates.length} عقد
              </Badge>
            </div>

            <div className="mt-4 space-y-4">
              {rebates.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  لا توجد عقود مكافآت مسجلة
                </div>
              ) : (
                rebates.map((rb) => (
                  <div
                    key={rb.id}
                    className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-foreground text-sm">{rb.distributor_name}</div>
                      <span className="text-xs font-mono text-muted-foreground">{rb.period}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="text-muted-foreground">
                        الهدف: {moneyEGP(rb.target_sales_amount)}
                      </div>
                      <div className="text-foreground font-bold">
                        المحقق: {moneyEGP(rb.achieved_sales_amount)} ({rb.achievement_percent}%)
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div>
                        <div className="text-xs text-muted-foreground">قيمة المكافأة المستحقة ({rb.rebate_rate_percent}%)</div>
                        <div className="text-base font-bold font-mono text-emerald-500">
                          {moneyEGP(rb.rebate_amount)}
                        </div>
                      </div>

                      {rb.status === "credit_note_issued" ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>صدر إشعار: {rb.credit_note_ref}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleIssueRebateCreditNote(rb.id)}
                          className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          إصدار إشعار دائن
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Credit Block/Unblock Confirmation Modal */}
      <Modal
        open={!!selectedExposure}
        onClose={() => setSelectedExposure(null)}
        title={selectedExposure?.is_blocked ? "فك الحظر الائتماني عن العميل" : "تجميد الحساب الائتماني للعميل"}
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-sm">
            <div className="font-semibold text-foreground">{selectedExposure?.customer_name}</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              المديونية الإجمالية: {moneyEGP(selectedExposure?.total_exposure || 0)} / السقف المعتمد:{" "}
              {moneyEGP(selectedExposure?.approved_credit_limit || 0)}
            </div>
          </div>

          {!selectedExposure?.is_blocked && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">سبب تجميد الحساب الائتماني</label>
              <Input
                placeholder="أدخل سبب الحظر (تجاوز السقف، فواتير متأخرة، تعثر مؤقت)..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button variant="ghost" onClick={() => setSelectedExposure(null)}>
              إلغاء
            </Button>
            <Button
              onClick={handleToggleBlock}
              disabled={isBlocking}
              className={selectedExposure?.is_blocked ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"}
            >
              {isBlocking ? "جاري التحديث..." : selectedExposure?.is_blocked ? "تأكيد فك الحظر" : "تأكيد الحظر البيعي"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Tier Price Modal */}
      <Modal open={isAddingTier} onClose={() => setIsAddingTier(false)} title="إضافة شريحة تسعير كمي متدرج">
        <form onSubmit={handleCreateTier} className="space-y-4 text-right" dir="rtl">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">اسم الصنف</label>
            <Input
              required
              placeholder="مثال: زيت طعام ذرة 1 لتر"
              value={tierForm.product_name}
              onChange={(e) => setTierForm({ ...tierForm, product_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">الباركود الدولي</label>
              <Input
                required
                placeholder="622..."
                value={tierForm.barcode}
                onChange={(e) => setTierForm({ ...tierForm, barcode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">مسمى الشريحة</label>
              <Input
                required
                placeholder="شريحة الجملة، الموزعين..."
                value={tierForm.tier_name}
                onChange={(e) => setTierForm({ ...tierForm, tier_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">الكمية الصغرى للشريحة</label>
              <Input
                type="number"
                required
                value={tierForm.min_quantity}
                onChange={(e) => setTierForm({ ...tierForm, min_quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">الكمية القصوى للشريحة</label>
              <Input
                type="number"
                required
                value={tierForm.max_quantity}
                onChange={(e) => setTierForm({ ...tierForm, max_quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">سعر الوحدة بالجملة (EGP)</label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="75.00"
                value={tierForm.unit_price}
                onChange={(e) => setTierForm({ ...tierForm, unit_price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">نسبة الخصم المقابلة (%)</label>
              <Input
                type="number"
                step="0.1"
                value={tierForm.discount_percent}
                onChange={(e) => setTierForm({ ...tierForm, discount_percent: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setIsAddingTier(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              حفظ الشريحة
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Landed Cost Modal */}
      <Modal open={isAddingLanded} onClose={() => setIsAddingLanded(false)} title="توزيع تكلفة شحنة استيراد (Landed Cost)">
        <form onSubmit={handleCreateLanded} className="space-y-3.5 text-right" dir="rtl">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">رقم البوليصة / مرجع الشحنة</label>
              <Input
                required
                placeholder="IMP-2026-HAM-..."
                value={landedForm.shipment_reference}
                onChange={(e) => setLandedForm({ ...landedForm, shipment_reference: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">بلد المنشأ / ميناء الشحن</label>
              <Input
                required
                value={landedForm.origin_country}
                onChange={(e) => setLandedForm({ ...landedForm, origin_country: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">اسم المورد الخارجي</label>
            <Input
              required
              placeholder="اسم الشركة الموردة..."
              value={landedForm.supplier_name}
              onChange={(e) => setLandedForm({ ...landedForm, supplier_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">قيمة البضاعة FOB (EGP)</label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="400000"
                value={landedForm.fob_goods_value}
                onChange={(e) => setLandedForm({ ...landedForm, fob_goods_value: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">أجور الشحن الدولي (Freight)</label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="50000"
                value={landedForm.freight_charges}
                onChange={(e) => setLandedForm({ ...landedForm, freight_charges: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الضرائب الجمركية</label>
              <Input
                type="number"
                step="0.01"
                placeholder="35000"
                value={landedForm.customs_tariffs}
                onChange={(e) => setLandedForm({ ...landedForm, customs_tariffs: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">أرضيات وموانئ</label>
              <Input
                type="number"
                step="0.01"
                placeholder="15000"
                value={landedForm.port_clearance_fees}
                onChange={(e) => setLandedForm({ ...landedForm, port_clearance_fees: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">التأمين البحري</label>
              <Input
                type="number"
                step="0.01"
                placeholder="8000"
                value={landedForm.marine_insurance}
                onChange={(e) => setLandedForm({ ...landedForm, marine_insurance: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">ملاحظات الحاوية والميناء</label>
            <Input
              placeholder="مثال: حاوية 40 قدم - ميناء الإسكندرية..."
              value={landedForm.notes}
              onChange={(e) => setLandedForm({ ...landedForm, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setIsAddingLanded(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              توزيع وإعادة تسعير الأصناف
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
