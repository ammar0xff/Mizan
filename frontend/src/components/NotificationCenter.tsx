/**
 * NotificationCenter.tsx — In-App Real-Time Notification Center & Operational Alerts.
 *
 * Displays live system notifications:
 * - Storefront customer web orders (instant dispatch).
 * - Low stock warnings (reorder points).
 * - Trial expiry & billing alerts.
 * - Shift & Cashier alerts.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  Info,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { useTenantNav } from "@/lib/tenant";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/kit/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/kit/popover";
import { toast } from "sonner";

export interface InAppNotification {
  id: string;
  type: "storefront_order" | "low_stock" | "invoice_overdue" | "shift_alert" | "billing_alert" | "system";
  severity: "info" | "warning" | "error" | "success";
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationsResponse {
  unread_count: number;
  total_count: number;
  items: InAppNotification[];
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "الآن";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  } catch {
    return "";
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const queryClient = useQueryClient();
  const { tenantTo } = useTenantNav();

  // 1. Fetch Notifications with Auto-Refetch
  const { data, isLoading, isFetching, refetch } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get<NotificationsResponse>("/notifications?limit=50");
      return res;
    },
    refetchInterval: 30000, // Sync every 30 seconds
    staleTime: 10000,
  });

  // Run alert scanner once on mount
  useEffect(() => {
    api.post("/notifications/generate-system-alerts", {}).catch(() => {});
  }, []);

  // 2. Mark Single as Read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 3. Mark All as Read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all", {});
    },
    onSuccess: () => {
      sound.click();
      toast.success("تم تحديد كافة التنبيهات كمقروءة");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 4. Delete Notification
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.del(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 5. Trigger System Alert Scan Manually
  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      return await api.post<{ generated_count: number; message: string }>("/notifications/generate-system-alerts", {});
    },
    onSuccess: (res) => {
      sound.click();
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.unread_count ?? 0;
  const items = data?.items ?? [];

  // Filter items
  const filteredItems = items.filter((n) => {
    if (filterType === "unread") return !n.is_read;
    if (filterType === "storefront_order") return n.type === "storefront_order";
    if (filterType === "low_stock") return n.type === "low_stock";
    if (filterType === "billing") return n.type === "billing_alert" || n.type === "invoice_overdue";
    return true;
  });

  function getNotificationIcon(type: string, severity: string) {
    if (type === "storefront_order") {
      return <ShoppingBag className="size-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (type === "low_stock") {
      return <AlertTriangle className="size-4 text-amber-500" />;
    }
    if (type === "billing_alert") {
      return <CreditCard className="size-4 text-indigo-500" />;
    }
    if (severity === "success") {
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    }
    return <Info className="size-4 text-blue-500" />;
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "error":
        return <Badge variant="destructive" className="text-[9px] px-1 py-0">هام جداً</Badge>;
      case "warning":
        return <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 border-amber-500/30">تحذير</Badge>;
      case "success":
        return <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-600 border-emerald-500/30">نجاح</Badge>;
      default:
        return null;
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            onClick={() => sound.click()}
            title="مركز التنبيهات والإشعارات"
            aria-label="مركز التنبيهات والإشعارات"
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border/80 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground num ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[360px] sm:w-[420px] p-0 rounded-2xl bg-popover border border-border shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h3 className="text-sm font-black text-foreground">مركز التنبيهات</h3>
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 num font-bold">
                {unreadCount} جديد
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                refetch();
                generateAlertsMutation.mutate();
              }}
              disabled={generateAlertsMutation.isPending || isFetching}
              title="فحص وتحديث التنبيهات"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-[11px] font-bold gap-1 text-primary hover:text-primary"
              >
                <CheckCheck className="size-3.5" />
                <span>قراءة الكل</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 overflow-x-auto text-[11px] border-b border-border/60 bg-muted/10 no-scrollbar">
          {[
            { id: "all", label: "الكل", count: items.length },
            { id: "unread", label: "غير مقروءة", count: unreadCount },
            { id: "storefront_order", label: "الطلبات" },
            { id: "low_stock", label: "المخزون" },
            { id: "billing", label: "المالية" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.click();
                setFilterType(tab.id);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ms-1 font-mono text-[10px] num opacity-80">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification Items List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <span className="size-5 inline-block animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs">جاري تحميل التنبيهات...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2 px-4">
              <div className="size-10 rounded-full bg-muted/60 text-muted-foreground/60 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="text-xs font-bold text-foreground">لا توجد تنبيهات جديدة</p>
              <p className="text-[11px] text-muted-foreground">
                كافة عمليات مساحة العمل تسير بشكل طبيعي ومحدثة.
              </p>
            </div>
          ) : (
            filteredItems.map((n) => (
              <div
                key={n.id}
                className={`p-3 transition-colors flex items-start gap-3 hover:bg-muted/30 ${
                  !n.is_read ? "bg-primary/5" : "bg-transparent"
                }`}
              >
                {/* Type Icon Badge */}
                <div className="size-8 rounded-xl bg-card border border-border shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(n.type, n.severity)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`text-xs ${!n.is_read ? "font-black text-foreground" : "font-medium text-muted-foreground"}`}>
                        {n.title}
                      </h4>
                      {getSeverityBadge(n.severity)}
                    </div>
                    {!n.is_read && (
                      <span className="size-2 rounded-full bg-primary shrink-0" title="غير مقروء" />
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {n.body}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-muted-foreground/80 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{formatRelativeTime(n.created_at)}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {n.link && (
                        <Link
                          to={tenantTo(n.link)}
                          onClick={() => {
                            if (!n.is_read) markReadMutation.mutate(n.id);
                            setOpen(false);
                          }}
                          className="font-bold text-primary hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-primary/10 transition"
                        >
                          <span>عرض</span>
                          <ExternalLink className="size-2.5" />
                        </Link>
                      )}

                      {!n.is_read && (
                        <button
                          onClick={() => markReadMutation.mutate(n.id)}
                          title="تحديد كمقروء"
                          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition"
                        >
                          <CheckCheck className="size-3" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteMutation.mutate(n.id)}
                        title="حذف التنبيه"
                        className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted transition"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-border bg-muted/20 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="size-3 text-primary" />
          <span>تنبيهات فورية متزامنة مع المتجر ونقاط البيع</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
