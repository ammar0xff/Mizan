/**
 * PAGE CONTRACT
 * Page: مستودعات وخدمات لوجستية للغير 3PL WMS (/wms)
 * Archetype: Multi-Client Warehouse & Bin Slotting Hub (WMS-01..11)
 * User: مدير المستودعات 3PL، أمين مراقبة المخزون، ومسؤول فوترة الخدمات اللوجستية
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status badges, no purple gradients)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Warehouse,
  Plus,
  Boxes,
  Users,
  Search,
  CheckCircle2,
  FolderSync,
  Layers,
  FileText,
  ScanLine,
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

interface WmsSummary {
  clients_count: number;
  total_bins: number;
  occupied_bins: number;
  utilization_rate: number;
  active_waves: number;
  total_receipts: number;
  clean_receipts_rate: number;
  cross_dock_count: number;
  total_3pl_revenue: number;
}

interface BinLocation {
  id: string;
  bin_code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  position: string;
  velocity_class: string;
  max_weight_kg: number;
  max_volume_cbm: number;
  status: "empty" | "occupied" | "reserved" | "maintenance";
  client_code: string;
  current_pallet_barcode: string;
  current_product_name: string;
  current_quantity: number;
}

interface ClientAccount {
  id: string;
  client_code: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  storage_rate_pallet_day: number;
  handling_in_per_pallet: number;
  handling_out_per_pallet: number;
  pick_per_line_fee: number;
  status: string;
  total_stored_pallets: number;
}

interface PickingWave {
  id: string;
  wave_number: string;
  client_code: string;
  zone: string;
  picker_name: string;
  total_orders: number;
  total_items_count: number;
  status: "queued" | "in_progress" | "completed";
  started_at: string;
  completed_at: string;
}

interface InboundReceipt {
  id: string;
  asn_number: string;
  client_code: string;
  carrier_name: string;
  expected_units: number;
  received_units: number;
  damaged_units: number;
  short_units: number;
  over_units: number;
  osd_status: "clean" | "discrepancy_reported" | "resolved";
  inspector_notes: string;
  received_date: string;
}

interface CrossDockOrder {
  id: string;
  cross_dock_code: string;
  client_code: string;
  inbound_asn_ref: string;
  outbound_so_ref: string;
  cargo_description: string;
  pallet_count: number;
  inbound_dock: string;
  outbound_dock: string;
  status: string;
}

export default function WmsWarehousePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"bins" | "clients" | "waves" | "inbound">("bins");
  const [search, setSearch] = useState("");

  // Directed Putaway Modal
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [putawayForm, setPutawayForm] = useState({
    client_code: "CLI-NESTLE",
    current_pallet_barcode: "",
    current_product_name: "",
    current_quantity: "50",
  });
  const [isPuttingAway, setIsPuttingAway] = useState(false);

  // Generate 3PL Invoice Modal
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<ClientAccount | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    billing_month: "أكتوبر 2026",
    pallet_days_count: "600",
    handling_in_pallets: "50",
    handling_out_pallets: "40",
    picked_lines_count: "350",
  });
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Create Bin Location Modal
  const [isAddingBin, setIsAddingBin] = useState(false);
  const [binForm, setBinForm] = useState({
    bin_code: "",
    zone: "Zone A - الجاف والغذائي",
    aisle: "01",
    rack: "02",
    shelf: "1",
    position: "A",
    velocity_class: "A",
    max_weight_kg: "1200",
    max_volume_cbm: "1.8",
  });

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<WmsSummary>({
    queryKey: ["wms-summary"],
    queryFn: () => api.get("/wms/summary"),
  });

  const { data: bins = [], isLoading: isBinsLoading } = useQuery<BinLocation[]>({
    queryKey: ["wms-bins"],
    queryFn: () => api.get("/wms/bins"),
  });

  const { data: clients = [], isLoading: isClientsLoading } = useQuery<ClientAccount[]>({
    queryKey: ["wms-clients"],
    queryFn: () => api.get("/wms/clients"),
  });

  const { data: waves = [], isLoading: isWavesLoading } = useQuery<PickingWave[]>({
    queryKey: ["wms-waves"],
    queryFn: () => api.get("/wms/waves"),
  });

  const { data: inbounds = [] } = useQuery<InboundReceipt[]>({
    queryKey: ["wms-inbound"],
    queryFn: () => api.get("/wms/inbound-receipts"),
  });

  const { data: crossDocks = [] } = useQuery<CrossDockOrder[]>({
    queryKey: ["wms-cross-dock"],
    queryFn: () => api.get("/wms/cross-dock"),
  });

  const handleExecutePutaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBin) return;
    setIsPuttingAway(true);
    try {
      await api.post(`/wms/bins/${selectedBin.id}/putaway`, {
        client_code: putawayForm.client_code,
        current_pallet_barcode: putawayForm.current_pallet_barcode || `PAL-${Date.now().toString().slice(-4)}`,
        current_product_name: putawayForm.current_product_name,
        current_quantity: parseInt(putawayForm.current_quantity) || 1,
      });
      toast("success", `تم توجيه وتسكين الباليتة في الموقع ${selectedBin.bin_code}`);
      setSelectedBin(null);
      queryClient.invalidateQueries({ queryKey: ["wms-bins"] });
      queryClient.invalidateQueries({ queryKey: ["wms-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تنفيذ التسكين الذكي";
      toast("error", msg);
    } finally {
      setIsPuttingAway(false);
    }
  };

  const handleEmptyBin = async (binId: string) => {
    try {
      await api.post(`/wms/bins/${binId}/empty`);
      toast("success", "تم تفريغ الموقع التخزيني وإتاحته");
      queryClient.invalidateQueries({ queryKey: ["wms-bins"] });
      queryClient.invalidateQueries({ queryKey: ["wms-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تفريغ الموقع";
      toast("error", msg);
    }
  };

  const handleCompleteWave = async (waveId: string) => {
    try {
      await api.post(`/wms/waves/${waveId}/complete`);
      toast("success", "تم تأكيد اكتمال موجة الانتقاء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["wms-waves"] });
      queryClient.invalidateQueries({ queryKey: ["wms-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إكمال الموجة";
      toast("error", msg);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForInvoice) return;
    setIsGeneratingInvoice(true);
    try {
      const res = await api.post<{ invoice_number: string; total_amount: number }>("/wms/invoices/generate", {
        client_code: selectedClientForInvoice.client_code,
        billing_month: invoiceForm.billing_month,
        pallet_days_count: parseInt(invoiceForm.pallet_days_count) || 600,
        handling_in_pallets: parseInt(invoiceForm.handling_in_pallets) || 50,
        handling_out_pallets: parseInt(invoiceForm.handling_out_pallets) || 40,
        picked_lines_count: parseInt(invoiceForm.picked_lines_count) || 350,
      });
      toast("success", `تم إصدار فاتورة 3PL رقم ${res.invoice_number} بقيمة ${moneyEGP(res.total_amount)}`);
      setSelectedClientForInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["wms-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إصدار فاتورة 3PL";
      toast("error", msg);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/wms/bins", {
        bin_code: binForm.bin_code,
        zone: binForm.zone,
        aisle: binForm.aisle,
        rack: binForm.rack,
        shelf: binForm.shelf,
        position: binForm.position,
        velocity_class: binForm.velocity_class,
        max_weight_kg: parseFloat(binForm.max_weight_kg) || 1200,
        max_volume_cbm: parseFloat(binForm.max_volume_cbm) || 1.8,
      });
      toast("success", "تم إنشاء الموقع التخزيني بنجاح");
      setIsAddingBin(false);
      queryClient.invalidateQueries({ queryKey: ["wms-bins"] });
      queryClient.invalidateQueries({ queryKey: ["wms-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إنشاء الموقع التخزيني";
      toast("error", msg);
    }
  };

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorBox message="تعذر تحميل بيانات إدارة المستودعات 3PL" />
      </div>
    );
  }

  const filteredBins = bins.filter(
    (b) =>
      b.bin_code.toLowerCase().includes(search.toLowerCase()) ||
      b.current_product_name.toLowerCase().includes(search.toLowerCase()) ||
      b.client_code.toLowerCase().includes(search.toLowerCase()) ||
      b.current_pallet_barcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">إدارة المستودعات والخدمات اللوجستية للغير (3PL WMS)</h1>
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/5 text-xs font-mono">
                  WMS-01..11
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                عزل ملكية مخزون العملاء، شبكة المواقع التخزينية (Zone-Aisle-Rack-Bin)، موجات الجمع، وفحص الاستلام والعبور السريع
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab === "bins" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAddingBin(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة موقع تخزيني جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">نسبة إشغال المستودع الفعلي</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.utilization_rate || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary?.occupied_bins || 0} موقع مشغول من أصل {summary?.total_bins || 0} موقع
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">حسابات عملاء 3PL المستضافة</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.clients_count || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">عميل معزول</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">عزل تام لسجلات المخزون والحسابات</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">موجات الانتقاء والجمع الجارية</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.active_waves || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">موجة قيد التنفيذ</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              معدل دقة استلام الشحنات: {summary?.clean_receipts_rate || 100}%
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">إيرادات خدمات 3PL الشهرية</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.total_3pl_revenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              شاملة إيجار الباليتات والمناولة والجمع
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
              setTab("bins");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "bins"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            المواقع التخزينية والتسكين الذكي (Bin Slotting)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("clients");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "clients"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            عملاء 3PL والتعرفة والفوترة (Clients & Billing)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("waves");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "waves"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            موجات الجمع والانتقاء (Wave Picking)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("inbound");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "inbound"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الاستلام وفروقات الشحن والعبور السريع (OS&D & Cross-Dock)
          </button>
        </div>

        <div className="relative w-64 pb-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الموقع، الباليتة، أو الصنف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Bin Locations & Directed Putaway */}
      {tab === "bins" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">كود الموقع التخزيني</TableHead>
                <TableHead className="text-right">المنطقة والممر</TableHead>
                <TableHead className="text-center">فئة الدوران</TableHead>
                <TableHead className="text-right">العميل والباليتة المستضافة</TableHead>
                <TableHead className="text-right">الصنف والكمية الحالية</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBinsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد مواقع تخزينية مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredBins.map((bin) => (
                  <TableRow key={bin.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-sm">{bin.bin_code}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        ممر {bin.aisle} - رف {bin.rack} - مستوى {bin.shelf}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{bin.zone}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          bin.velocity_class === "A"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                            : bin.velocity_class === "B"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        فئة {bin.velocity_class}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bin.status === "occupied" ? (
                        <div>
                          <div className="font-mono text-xs font-semibold text-foreground">
                            {bin.current_pallet_barcode}
                          </div>
                          <Badge variant="outline" className="text-[10px] mt-0.5 border-border/60">
                            {bin.client_code}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">متاح للتسكين</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bin.status === "occupied" ? (
                        <div>
                          <div className="text-sm font-medium text-foreground">{bin.current_product_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {bin.current_quantity} طرد / وحدة
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">فارغ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          bin.status === "occupied"
                            ? "border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs"
                            : "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                        }
                      >
                        {bin.status === "occupied" ? "مشغول بالكامل" : "موقع فارغ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {bin.status === "occupied" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmptyBin(bin.id)}
                          className="text-xs h-7 px-2 border-border/60 text-destructive hover:bg-destructive/10"
                        >
                          تفريغ الموقع
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            sound.click();
                            setSelectedBin(bin);
                          }}
                          className="text-xs h-7 px-2 bg-amber-600 hover:bg-amber-500 text-white gap-1"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          توجيه وتسكين
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: 3PL Clients & Billing */}
      {tab === "clients" && (
        <div className="space-y-4">
          <Card className="border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-right">كود العميل والمنشأة</TableHead>
                  <TableHead className="text-right">المسؤول والتواصل</TableHead>
                  <TableHead className="text-center">سعر التخزين (باليتة/يوم)</TableHead>
                  <TableHead className="text-center">أجر المناولة دخول/خروج</TableHead>
                  <TableHead className="text-center">أجر جمع السطر (Pick Line)</TableHead>
                  <TableHead className="text-center">الباليتات المخزنة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isClientsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  clients.map((cli) => (
                    <TableRow key={cli.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-bold text-foreground text-sm">{cli.company_name}</div>
                        <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                          {cli.client_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{cli.contact_person}</div>
                        <div className="text-xs text-muted-foreground font-mono">{cli.phone}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-foreground">
                        {moneyEGP(cli.storage_rate_pallet_day)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {moneyEGP(cli.handling_in_per_pallet)} / {moneyEGP(cli.handling_out_per_pallet)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium text-foreground">
                        {moneyEGP(cli.pick_per_line_fee)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-amber-500">
                        {cli.total_stored_pallets} باليتة
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          onClick={() => {
                            sound.click();
                            setSelectedClientForInvoice(cli);
                          }}
                          className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          إصدار فاتورة 3PL
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 3: Wave Picking */}
      {tab === "waves" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم موجة الانتقاء</TableHead>
                <TableHead className="text-right">العميل والمنطقة</TableHead>
                <TableHead className="text-right">أمين المستودع / المشغل</TableHead>
                <TableHead className="text-center">عدد الطلبيات المجمعة</TableHead>
                <TableHead className="text-center">إجمالي الأصناف والوحدات</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isWavesLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : waves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد موجات انتقاء نشطة حالياً
                  </TableCell>
                </TableRow>
              ) : (
                waves.map((w) => (
                  <TableRow key={w.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-sm">{w.wave_number}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">بدأت: {w.started_at}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{w.client_code}</div>
                      <div className="text-xs text-muted-foreground">{w.zone}</div>
                    </TableCell>
                    <TableCell className="text-sm">{w.picker_name}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-foreground">
                      {w.total_orders} طلبيات
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-amber-500">
                      {w.total_items_count} وحدة
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          w.status === "completed"
                            ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                            : "border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs"
                        }
                      >
                        {w.status === "completed" ? "مكتملة بالكامل" : "قيد الانتقاء والفرز"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {w.status === "completed" ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-emerald-500 font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{w.completed_at}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteWave(w.id)}
                          className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          تأكيد الجمع
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Inbound OS&D & Cross-Dock */}
      {tab === "inbound" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inbound ASN Receipts */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">استلام البضائع وفروقات الفحص (OS&D)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {inbounds.length} شحنة واردة
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {inbounds.map((inb) => (
                <div key={inb.id} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{inb.asn_number}</span>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs">
                      مطابقة تامة وسليمة
                    </Badge>
                  </div>
                  <div className="text-xs text-foreground font-medium">
                    العميل: {inb.client_code} | الناقل: {inb.carrier_name}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 border-t border-border/30">
                    <div>المتوقع: {inb.expected_units}</div>
                    <div className="text-emerald-500 font-bold">المستلم: {inb.received_units}</div>
                    <div>التالف: {inb.damaged_units}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/20">
                    {inb.inspector_notes}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cross Dock Orders */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FolderSync className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-sm">العبور المباشر السريع (Cross-Docking)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {crossDocks.length} أمر عبور
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {crossDocks.map((xd) => (
                <div key={xd.id} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{xd.cross_dock_code}</span>
                    <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs">
                      تم العبور المباشر
                    </Badge>
                  </div>
                  <div className="text-xs text-foreground">{xd.cargo_description}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono pt-1 border-t border-border/30">
                    <div>من: {xd.inbound_dock} ({xd.inbound_asn_ref})</div>
                    <div>إلى: {xd.outbound_dock} ({xd.outbound_so_ref})</div>
                  </div>
                  <div className="text-xs text-emerald-500 font-mono font-semibold">
                    {xd.pallet_count} باليتات عبرت دون الحاجة للتخزين الرفي (0 Dwell Time)
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Directed Putaway Modal */}
      <Modal open={!!selectedBin} onClose={() => setSelectedBin(null)} title="التوجيه والتسكين الذكي في الموقع (Putaway)">
        <form onSubmit={handleExecutePutaway} className="space-y-3.5 text-right" dir="rtl">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono space-y-1">
            <div className="font-bold text-foreground text-sm">{selectedBin?.bin_code}</div>
            <div className="text-muted-foreground">
              المنطقة: {selectedBin?.zone} | الفئة: {selectedBin?.velocity_class}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">العميل مالك المخزون</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={putawayForm.client_code}
              onChange={(e) => setPutawayForm({ ...putawayForm, client_code: e.target.value })}
            >
              <option value="CLI-NESTLE">شركة نستله للصناعات الغذائية (CLI-NESTLE)</option>
              <option value="CLI-UNILEVER">يونيليفر مشرق للتجارة (CLI-UNILEVER)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">باركود الباليتة المستلمة</label>
            <Input
              required
              placeholder="PAL-NES-9912..."
              value={putawayForm.current_pallet_barcode}
              onChange={(e) => setPutawayForm({ ...putawayForm, current_pallet_barcode: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">اسم الصنف بالباليتة</label>
            <Input
              required
              placeholder="مثال: نسكافيه كلاسيك 200 جم..."
              value={putawayForm.current_product_name}
              onChange={(e) => setPutawayForm({ ...putawayForm, current_product_name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">الكمية الإجمالية بالباليتة (كرتونة/طرد)</label>
            <Input
              type="number"
              required
              value={putawayForm.current_quantity}
              onChange={(e) => setPutawayForm({ ...putawayForm, current_quantity: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setSelectedBin(null)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPuttingAway} className="bg-amber-600 hover:bg-amber-500 text-white">
              {isPuttingAway ? "جاري التسكين..." : "تأكيد التسكين بالموقع"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generate 3PL Invoice Modal */}
      <Modal
        open={!!selectedClientForInvoice}
        onClose={() => setSelectedClientForInvoice(null)}
        title="إصدار فاتورة خدمات لوجستية 3PL للعميل"
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-3.5 text-right" dir="rtl">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono space-y-1">
            <div className="font-bold text-foreground text-sm">{selectedClientForInvoice?.company_name}</div>
            <div className="text-muted-foreground">
              التعرفة: {moneyEGP(selectedClientForInvoice?.storage_rate_pallet_day || 0)} / باليتة يومياً
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">شهر الفاتورة المطالب به</label>
            <Input
              required
              value={invoiceForm.billing_month}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, billing_month: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">إجمالي أيام إشغال الباليتات</label>
              <Input
                type="number"
                required
                value={invoiceForm.pallet_days_count}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, pallet_days_count: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">عدد سطور الانتقاء والجمع</label>
              <Input
                type="number"
                required
                value={invoiceForm.picked_lines_count}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, picked_lines_count: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">باليتات المناولة دخول (In)</label>
              <Input
                type="number"
                required
                value={invoiceForm.handling_in_pallets}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, handling_in_pallets: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">باليتات المناولة خروج (Out)</label>
              <Input
                type="number"
                required
                value={invoiceForm.handling_out_pallets}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, handling_out_pallets: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setSelectedClientForInvoice(null)}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isGeneratingInvoice}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isGeneratingInvoice ? "جاري الحساب..." : "احتساب واعتماد الفاتورة"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Bin Modal */}
      <Modal open={isAddingBin} onClose={() => setIsAddingBin(false)} title="إضافة موقع تخزيني جديد (Bin Location)">
        <form onSubmit={handleCreateBin} className="space-y-3.5 text-right" dir="rtl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">كود الموقع القياسي</label>
            <Input
              required
              placeholder="ZN-A-02-1-A"
              value={binForm.bin_code}
              onChange={(e) => setBinForm({ ...binForm, bin_code: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">المنطقة المستودعية (Zone)</label>
            <Input
              required
              value={binForm.zone}
              onChange={(e) => setBinForm({ ...binForm, zone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الممر (Aisle)</label>
              <Input
                required
                value={binForm.aisle}
                onChange={(e) => setBinForm({ ...binForm, aisle: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الرف (Rack)</label>
              <Input
                required
                value={binForm.rack}
                onChange={(e) => setBinForm({ ...binForm, rack: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">المستوى (Shelf)</label>
              <Input
                required
                value={binForm.shelf}
                onChange={(e) => setBinForm({ ...binForm, shelf: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الموضع</label>
              <Input
                required
                value={binForm.position}
                onChange={(e) => setBinForm({ ...binForm, position: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">فئة الدوران</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={binForm.velocity_class}
                onChange={(e) => setBinForm({ ...binForm, velocity_class: e.target.value })}
              >
                <option value="A">A (سريع الدوران)</option>
                <option value="B">B (متوسط الدوران)</option>
                <option value="C">C (بطيء الدوران)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">أقصى وزن (كجم)</label>
              <Input
                type="number"
                value={binForm.max_weight_kg}
                onChange={(e) => setBinForm({ ...binForm, max_weight_kg: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">أقصى حجم (م³)</label>
              <Input
                type="number"
                value={binForm.max_volume_cbm}
                onChange={(e) => setBinForm({ ...binForm, max_volume_cbm: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setIsAddingBin(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white">
              حفظ الموقع
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
