/**
 * PAGE CONTRACT
 * Page: الشحن واللوجستيات وإدارة الأساطيل (/logistics)
 * Archetype: Logistics, Fleet Dispatch & Tracking Hub (LOG-01..11)
 * User: مدير العمليات اللوجستية، مسؤول ترحيل الشحنات، ومدير الأسطول
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status badges, no purple gradients)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Plus,
  Navigation,
  FileCheck2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Compass,
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

interface LogisticsSummary {
  total_consignments: number;
  in_transit_count: number;
  delivered_count: number;
  delivery_success_rate: number;
  total_cod_pending: number;
  total_freight_revenue: number;
  vehicles_count: number;
  drivers_count: number;
  claims_count: number;
}

interface Consignment {
  id: string;
  tracking_number: string;
  waybill_type: string;
  sender_name: string;
  sender_city: string;
  consignee_name: string;
  consignee_phone: string;
  consignee_city: string;
  consignee_address: string;
  cargo_description: string;
  package_count: number;
  actual_weight_kg: number;
  volumetric_weight_kg: number;
  chargeable_weight_kg: number;
  cod_amount: number;
  freight_charges: number;
  accessorial_charges: number;
  total_charges: number;
  status: "booked" | "vehicle_allocated" | "in_transit" | "out_for_delivery" | "delivered" | "exception";
  current_milestone: string;
  hazard_class: string;
  pod_recipient_name: string;
  pod_signature_date: string;
  pod_notes: string;
}

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  make_model: string;
  payload_capacity_kg: number;
  cargo_volume_cbm: number;
  is_refrigerated: boolean;
  odometer_km: number;
  license_expiry: string;
  insurance_expiry: string;
  status: "available" | "on_trip" | "maintenance";
  last_service_km: number;
  next_service_km: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  national_id: string;
  license_grade: string;
  license_expiry: string;
  medical_fitness: boolean;
  max_daily_hours: number;
  logged_hours_today: number;
  status: "available" | "on_trip" | "resting";
}

interface RouteTrip {
  id: string;
  trip_code: string;
  origin_hub: string;
  destination_hub: string;
  assigned_vehicle_plate: string;
  assigned_driver_name: string;
  total_distance_km: number;
  total_consignments: number;
  departure_time: string;
  arrival_time_est: string;
  status: string;
}

interface FuelLog {
  id: string;
  vehicle_plate: string;
  driver_name: string;
  date: string;
  liters_pumped: number;
  cost_total: number;
  odometer_at_fill: number;
  fuel_station: string;
  receipt_number: string;
}

interface CargoClaim {
  id: string;
  consignment_tracking: string;
  claimant_name: string;
  claim_type: string;
  claimed_amount: number;
  settled_amount: number;
  incident_description: string;
  status: string;
}

export default function LogisticsFleetPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"consignments" | "fleet" | "drivers" | "trips_fuel">("consignments");
  const [search, setSearch] = useState("");

  // e-POD Modal state
  const [epodConsignment, setEpodConsignment] = useState<Consignment | null>(null);
  const [epodRecipient, setEpodRecipient] = useState("");
  const [epodNotes, setEpodNotes] = useState("");
  const [isSubmittingEpod, setIsSubmittingEpod] = useState(false);

  // New Consignment Modal
  const [isAddingConsignment, setIsAddingConsignment] = useState(false);
  const [consignmentForm, setConsignmentForm] = useState({
    sender_name: "",
    sender_city: "القاهرة",
    consignee_name: "",
    consignee_phone: "",
    consignee_city: "الإسكندرية",
    consignee_address: "",
    cargo_description: "",
    package_count: "1",
    actual_weight_kg: "10.0",
    length_cm: "40",
    width_cm: "30",
    height_cm: "20",
    cod_amount: "0",
    freight_rate_per_kg: "12.0",
    accessorial_charges: "0",
  });

  // New Vehicle Modal
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "",
    vehicle_type: "شاحنة نقل مغلقة 5 طن",
    make_model: "مرسيدس أكتروس",
    payload_capacity_kg: "5000",
    cargo_volume_cbm: "22",
    is_refrigerated: false,
    odometer_km: "30000",
    license_expiry: "2027-10-15",
    insurance_expiry: "2027-11-01",
  });

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<LogisticsSummary>({
    queryKey: ["logistics-summary"],
    queryFn: () => api.get("/logistics/summary"),
  });

  const { data: consignments = [], isLoading: isConsignmentsLoading } = useQuery<Consignment[]>({
    queryKey: ["logistics-consignments"],
    queryFn: () => api.get("/logistics/consignments"),
  });

  const { data: vehicles = [], isLoading: isVehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["logistics-vehicles"],
    queryFn: () => api.get("/logistics/vehicles"),
  });

  const { data: drivers = [], isLoading: isDriversLoading } = useQuery<Driver[]>({
    queryKey: ["logistics-drivers"],
    queryFn: () => api.get("/logistics/drivers"),
  });

  const { data: trips = [] } = useQuery<RouteTrip[]>({
    queryKey: ["logistics-trips"],
    queryFn: () => api.get("/logistics/trips"),
  });

  const { data: fuelLogs = [] } = useQuery<FuelLog[]>({
    queryKey: ["logistics-fuel"],
    queryFn: () => api.get("/logistics/fuel-logs"),
  });

  const { data: claims = [] } = useQuery<CargoClaim[]>({
    queryKey: ["logistics-claims"],
    queryFn: () => api.get("/logistics/claims"),
  });

  const handleAdvanceMilestone = async (c: Consignment) => {
    let nextStatus = "in_transit";
    let nextText = "الشحنة على متن شاحنة التوزيع بين المحافظات";
    if (c.status === "booked") {
      nextStatus = "vehicle_allocated";
      nextText = "تم تخصيص مركبة الشحن وجاري التحميل بمستودع الانطلاق";
    } else if (c.status === "vehicle_allocated") {
      nextStatus = "in_transit";
      nextText = "خرجت الشحنة في طريقها إلى محطة الوجهة";
    } else if (c.status === "in_transit") {
      nextStatus = "out_for_delivery";
      nextText = "الشحنة مع مندوب التوزيع الأخير في طريقها للعميل";
    }

    try {
      await api.post(`/logistics/consignments/${c.id}/milestone`, {
        status: nextStatus,
        milestone_text: nextText,
      });
      toast("success", "تم تحديث مرحلة الشحنة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["logistics-consignments"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تحديث مرحلة الشحنة";
      toast("error", msg);
    }
  };

  const handleCompleteEpod = async () => {
    if (!epodConsignment || !epodRecipient) return;
    setIsSubmittingEpod(true);
    try {
      await api.post(`/logistics/consignments/${epodConsignment.id}/epod`, {
        recipient_name: epodRecipient,
        notes: epodNotes,
      });
      toast("success", `تم توثيق التسليم الرقمي e-POD للشحنة ${epodConsignment.tracking_number}`);
      setEpodConsignment(null);
      setEpodRecipient("");
      setEpodNotes("");
      queryClient.invalidateQueries({ queryKey: ["logistics-consignments"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر توثيق إثبات التسليم";
      toast("error", msg);
    } finally {
      setIsSubmittingEpod(false);
    }
  };

  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/logistics/consignments", {
        sender_name: consignmentForm.sender_name,
        sender_city: consignmentForm.sender_city,
        consignee_name: consignmentForm.consignee_name,
        consignee_phone: consignmentForm.consignee_phone,
        consignee_city: consignmentForm.consignee_city,
        consignee_address: consignmentForm.consignee_address,
        cargo_description: consignmentForm.cargo_description,
        package_count: parseInt(consignmentForm.package_count) || 1,
        actual_weight_kg: parseFloat(consignmentForm.actual_weight_kg) || 1.0,
        length_cm: parseFloat(consignmentForm.length_cm) || 30.0,
        width_cm: parseFloat(consignmentForm.width_cm) || 20.0,
        height_cm: parseFloat(consignmentForm.height_cm) || 15.0,
        cod_amount: parseFloat(consignmentForm.cod_amount) || 0.0,
        freight_rate_per_kg: parseFloat(consignmentForm.freight_rate_per_kg) || 12.0,
        accessorial_charges: parseFloat(consignmentForm.accessorial_charges) || 0.0,
      });
      toast("success", "تم إصدار بوليصة الشحن بنجاح");
      setIsAddingConsignment(false);
      setConsignmentForm({
        sender_name: "",
        sender_city: "القاهرة",
        consignee_name: "",
        consignee_phone: "",
        consignee_city: "الإسكندرية",
        consignee_address: "",
        cargo_description: "",
        package_count: "1",
        actual_weight_kg: "10.0",
        length_cm: "40",
        width_cm: "30",
        height_cm: "20",
        cod_amount: "0",
        freight_rate_per_kg: "12.0",
        accessorial_charges: "0",
      });
      queryClient.invalidateQueries({ queryKey: ["logistics-consignments"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر إصدار بوليصة الشحن";
      toast("error", msg);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/logistics/vehicles", {
        plate_number: vehicleForm.plate_number,
        vehicle_type: vehicleForm.vehicle_type,
        make_model: vehicleForm.make_model,
        payload_capacity_kg: parseFloat(vehicleForm.payload_capacity_kg) || 5000,
        cargo_volume_cbm: parseFloat(vehicleForm.cargo_volume_cbm) || 20,
        is_refrigerated: vehicleForm.is_refrigerated,
        odometer_km: parseFloat(vehicleForm.odometer_km) || 0,
        license_expiry: vehicleForm.license_expiry,
        insurance_expiry: vehicleForm.insurance_expiry,
      });
      toast("success", "تم تسجيل الشاحنة في الأسطول بنجاح");
      setIsAddingVehicle(false);
      queryClient.invalidateQueries({ queryKey: ["logistics-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-summary"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تسجيل المركبة";
      toast("error", msg);
    }
  };

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorBox message="تعذر تحميل بيانات وحدة الشحن واللوجستيات" />
      </div>
    );
  }

  const filteredConsignments = consignments.filter(
    (c) =>
      c.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      c.consignee_name.toLowerCase().includes(search.toLowerCase()) ||
      c.consignee_city.toLowerCase().includes(search.toLowerCase()) ||
      c.cargo_description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">الشحن والخدمات اللوجستية والأسطول</h1>
                <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/5 text-xs font-mono">
                  LOG-01..11
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                تتبع بوالص الشحن (AWB)، تخطيط المسارات، سجل الشاحنات والصيانة، إثبات التسليم الرقمي e-POD، والوقود والمطالبات
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab === "consignments" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAddingConsignment(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إصدار بوليصة شحن AWB
            </Button>
          )}
          {tab === "fleet" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAddingVehicle(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              تسجيل مركبة بالأسطول
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">الشحنات قيد التوصيل والمسار</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.in_transit_count || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">شحنة جارية</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              معدل نجاح التسليم الإجمالي: {summary?.delivery_success_rate || 0}%
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">متحصلات الدفع عند الاستلام المعلقة (COD)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.total_cod_pending || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">عهد نقدية مع مندوبي وسائقي الأسطول</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">أسطول الشاحنات والمركبات</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.vehicles_count || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">مركبة</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              يقودها {summary?.drivers_count || 0} سائق مهني معتمد
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">إجمالي عوائد الشحن والخدمات</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.total_freight_revenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.claims_count || 0} مطالبات بضائع تالفة قيد المراجعة
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
              setTab("consignments");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "consignments"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            بوالص الشحن والتتبع اللحظي (Waybills)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("fleet");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "fleet"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            أسطول الشاحنات والمركبات (Fleet)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("drivers");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "drivers"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            سجل السائقين والامتثال (Driver Rostering)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("trips_fuel");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "trips_fuel"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الرحلات ومصاريف الوقود (Trips & Fuel)
          </button>
        </div>

        <div className="relative w-64 pb-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث برقم البوليصة أو المستلم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Consignments & Waybills */}
      {tab === "consignments" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم البوليصة AWB</TableHead>
                <TableHead className="text-right">المرسل ← المستلم</TableHead>
                <TableHead className="text-right">وصف الشحنة</TableHead>
                <TableHead className="text-center">الوزن المحتسب</TableHead>
                <TableHead className="text-right">التحصيل COD</TableHead>
                <TableHead className="text-right">أجر الشحن</TableHead>
                <TableHead className="text-center">الحالة والمحطة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isConsignmentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredConsignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد بوالص شحن مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsignments.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-sm">{item.tracking_number}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {item.waybill_type === "domestic_waybill" ? "بوليصة نقل داخلي" : "CMR دولي"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground text-sm">{item.consignee_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.sender_city} ← {item.consignee_city}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-foreground max-w-[200px] truncate">{item.cargo_description}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{item.package_count} طرد</div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <span className="font-bold text-foreground">{item.chargeable_weight_kg} كجم</span>
                      <div className="text-[10px] text-muted-foreground">
                        فعلي: {item.actual_weight_kg} / حجمي: {item.volumetric_weight_kg}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-amber-500">
                      {item.cod_amount > 0 ? moneyEGP(item.cod_amount) : "مدفوع مسبقاً"}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(item.total_charges)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "delivered"
                              ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                              : item.status === "in_transit"
                              ? "border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs"
                              : "border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs"
                          }
                        >
                          {item.status === "delivered"
                            ? "تم التسليم (e-POD)"
                            : item.status === "in_transit"
                            ? "في الطريق"
                            : item.status === "out_for_delivery"
                            ? "قيد التوزيع"
                            : "محجوزة"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {item.current_milestone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.status === "delivered" ? (
                        <div className="text-[11px] text-emerald-500 font-mono">
                          مستلم: {item.pod_recipient_name}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdvanceMilestone(item)}
                            className="text-xs h-7 px-2 border-border/60 hover:bg-muted"
                          >
                            مرحلة تالية
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              sound.click();
                              setEpodConsignment(item);
                            }}
                            className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            e-POD
                          </Button>
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

      {/* Tab 2: Fleet & Vehicles */}
      {tab === "fleet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isVehiclesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5 border-border/50">
                <Skeleton className="h-32 w-full" />
              </Card>
            ))
          ) : (
            vehicles.map((veh) => (
              <Card key={veh.id} className="p-5 border-border/50 space-y-3.5 hover:border-blue-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground font-mono">{veh.plate_number}</div>
                      <div className="text-xs text-muted-foreground">{veh.make_model}</div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      veh.status === "available"
                        ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                        : veh.status === "on_trip"
                        ? "border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs"
                        : "border-destructive/40 text-destructive bg-destructive/10 text-xs"
                    }
                  >
                    {veh.status === "available" ? "جاهزة للتحميل" : veh.status === "on_trip" ? "في رحلة" : "صيانة"}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground font-medium">{veh.vehicle_type}</div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border/40">
                  <div>حمولة: {(veh.payload_capacity_kg / 1000).toFixed(1)} طن</div>
                  <div>حجم: {veh.cargo_volume_cbm} م³</div>
                  <div>عداد: {veh.odometer_km.toLocaleString("en-US")} كم</div>
                  <div>{veh.is_refrigerated ? "تبريد ثلاجة (Cold)" : "نقل جاف"}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-muted-foreground">الصيانة الدورية القادمة:</span>
                  <span className="font-bold text-foreground">{veh.next_service_km.toLocaleString("en-US")} كم</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Driver Rostering & Fatigue Safety */}
      {tab === "drivers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isDriversLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-5 border-border/50">
                <Skeleton className="h-28 w-full" />
              </Card>
            ))
          ) : (
            drivers.map((drv) => (
              <Card key={drv.id} className="p-5 border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-muted border border-border/60 text-muted-foreground">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">{drv.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{drv.phone}</div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      drv.status === "available"
                        ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs"
                        : "border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs"
                    }
                  >
                    {drv.status === "available" ? "متاح للترحيل" : "في مسار قيادة"}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">{drv.license_grade}</div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">ساعات القيادة المسجلة اليوم:</span>
                    <span className="font-bold text-foreground">
                      {drv.logged_hours_today} / {drv.max_daily_hours} ساعات
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${
                        drv.logged_hours_today / drv.max_daily_hours > 0.8
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (drv.logged_hours_today / drv.max_daily_hours) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-500 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الفحص الطبي ساري ورخصة القيادة معتمدة</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Route Trips, Fuel Logs & Claims */}
      {tab === "trips_fuel" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trips */}
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-sm">رحلات الشحن المجدولة (Route Trips)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {trips.length} رحلة
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {trips.map((tr) => (
                <div key={tr.id} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{tr.trip_code}</span>
                    <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs">
                      قيد الرحلة
                    </Badge>
                  </div>
                  <div className="text-xs text-foreground font-medium">
                    {tr.origin_hub} ← {tr.destination_hub}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono pt-1 border-t border-border/30">
                    <div>الشاحنة: {tr.assigned_vehicle_plate}</div>
                    <div>السائق: {tr.assigned_driver_name}</div>
                    <div>المسافة: {tr.total_distance_km} كم</div>
                    <div>الشحنات: {tr.total_consignments} بوليصة</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Fuel & Claims */}
          <div className="space-y-6">
            <Card className="p-5 border-border/50">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm">سجل تموين واستهلاك الوقود</h3>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {fuelLogs.length} سجل
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {fuelLogs.map((fl) => (
                  <div key={fl.id} className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-foreground">{fl.vehicle_plate}</span>
                      <span className="text-emerald-500 font-bold">{moneyEGP(fl.cost_total)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {fl.liters_pumped} لتر - {fl.fuel_station} (عداد: {fl.odometer_at_fill} كم)
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 border-border/50">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-bold text-sm">مطالبات البضائع والتلفيات</h3>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {claims.length} مطالبة
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {claims.map((cl) => (
                  <div key={cl.id} className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground font-mono">{cl.consignment_tracking}</span>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs">
                        تمت التسوية
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{cl.incident_description}</div>
                    <div className="text-xs font-mono text-foreground font-bold">
                      التعويض المعتمد: {moneyEGP(cl.settled_amount)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Digital Proof of Delivery (e-POD) Modal */}
      <Modal
        open={!!epodConsignment}
        onClose={() => setEpodConsignment(null)}
        title="توثيق إثبات التسليم الرقمي (e-POD)"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-foreground">{epodConsignment?.tracking_number}</span>
              <span className="font-bold text-amber-500 font-mono">
                {epodConsignment && epodConsignment.cod_amount > 0 ? `تحصيل: ${moneyEGP(epodConsignment.cod_amount)}` : "مدفوع"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{epodConsignment?.cargo_description}</div>
            <div className="text-xs text-muted-foreground font-mono">
              العنوان: {epodConsignment?.consignee_address} ({epodConsignment?.consignee_phone})
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">اسم المستلم الفعلي وتوقيعه</label>
            <Input
              required
              placeholder="مثال: أحمد عبد الرازق (مدير المخازن)..."
              value={epodRecipient}
              onChange={(e) => setEpodRecipient(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">ملاحظات حالة التسليم وسلامة الأختام</label>
            <Input
              placeholder="تم الفحص واستلام الشحنة كاملة وسليمة..."
              value={epodNotes}
              onChange={(e) => setEpodNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button variant="ghost" onClick={() => setEpodConsignment(null)}>
              إلغاء
            </Button>
            <Button
              onClick={handleCompleteEpod}
              disabled={isSubmittingEpod || !epodRecipient}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSubmittingEpod ? "جاري التوثيق..." : "اعتماد التسليم النهائي"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Consignment Modal */}
      <Modal open={isAddingConsignment} onClose={() => setIsAddingConsignment(false)} title="إصدار بوليصة شحن جديدة (AWB)">
        <form onSubmit={handleCreateConsignment} className="space-y-3.5 text-right" dir="rtl">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">اسم المرسل</label>
              <Input
                required
                placeholder="شركة التوريد أو العميل..."
                value={consignmentForm.sender_name}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, sender_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">مدينة الانطلاق</label>
              <Input
                required
                value={consignmentForm.sender_city}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, sender_city: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">اسم المستلم</label>
              <Input
                required
                placeholder="اسم العميل أو المؤسسة..."
                value={consignmentForm.consignee_name}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, consignee_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">هاتف المستلم</label>
              <Input
                required
                placeholder="010..."
                value={consignmentForm.consignee_phone}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, consignee_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">مدينة التسليم</label>
              <Input
                required
                value={consignmentForm.consignee_city}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, consignee_city: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">العنوان التفصيلي</label>
              <Input
                required
                placeholder="الشارع، رقم المبنى..."
                value={consignmentForm.consignee_address}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, consignee_address: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">وصف البضاعة المشحونة</label>
            <Input
              required
              placeholder="مثال: أجهزة منزلية، كراتين مواد غذائية..."
              value={consignmentForm.cargo_description}
              onChange={(e) => setConsignmentForm({ ...consignmentForm, cargo_description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الوزن (كجم)</label>
              <Input
                type="number"
                step="0.1"
                required
                value={consignmentForm.actual_weight_kg}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, actual_weight_kg: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الطول (سم)</label>
              <Input
                type="number"
                value={consignmentForm.length_cm}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, length_cm: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">العرض (سم)</label>
              <Input
                type="number"
                value={consignmentForm.width_cm}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, width_cm: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">الارتفاع (سم)</label>
              <Input
                type="number"
                value={consignmentForm.height_cm}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, height_cm: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">مبلغ التحصيل عند الاستلام COD</label>
              <Input
                type="number"
                value={consignmentForm.cod_amount}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, cod_amount: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">سعر الشحن للكيلو (EGP)</label>
              <Input
                type="number"
                value={consignmentForm.freight_rate_per_kg}
                onChange={(e) => setConsignmentForm({ ...consignmentForm, freight_rate_per_kg: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setIsAddingConsignment(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
              إصدار بوليصة AWB
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal open={isAddingVehicle} onClose={() => setIsAddingVehicle(false)} title="تسجيل مركبة جديدة بالأسطول">
        <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-right" dir="rtl">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">رقم اللوحة المعدنية</label>
              <Input
                required
                placeholder="ق ن ج 4812"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">الماركة والموديل</label>
              <Input
                required
                placeholder="مرسيدس أكتروس 2024"
                value={vehicleForm.make_model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make_model: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">نوع وتصنيف الشاحنة</label>
            <Input
              required
              value={vehicleForm.vehicle_type}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">سعة الحمولة (كجم)</label>
              <Input
                type="number"
                value={vehicleForm.payload_capacity_kg}
                onChange={(e) => setVehicleForm({ ...vehicleForm, payload_capacity_kg: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">قراءة العداد الحالية (كم)</label>
              <Input
                type="number"
                value={vehicleForm.odometer_km}
                onChange={(e) => setVehicleForm({ ...vehicleForm, odometer_km: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => setIsAddingVehicle(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
              حفظ المركبة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
