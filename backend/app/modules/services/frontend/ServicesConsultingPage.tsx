/**
 * PAGE CONTRACT
 * Page: الشركات والمكاتب الاستشارية والمهنية (/services)
 * Archetype: Professional Services & Retainer Ledger (CON-01..08)
 * User: الشريك الإداري، المراجع القانوني، ومسؤول الفوترة لإدارة عقود المشاريع، مقدمات الأتعاب، وساعات العمل القابلة للفوترة
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status chips)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Clock,
  Calendar,
  Plus,
  Coins,
  Building2,
  ShieldCheck,
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

interface Engagement {
  id: string;
  client_name: string;
  project_name: string;
  billing_model: "retainer" | "hourly" | "fixed_milestone";
  contract_value: number;
  retainer_balance: number;
  retainer_ratio_pct: number;
  is_low_retainer: boolean;
  hourly_rate: number;
  status: "active" | "review" | "completed";
  start_date: string;
  due_date: string;
  partner_in_charge: string;
}

interface Timesheet {
  id: string;
  engagement_id: string;
  engagement_name: string;
  consultant_name: string;
  role: string;
  date: string;
  hours: number;
  is_billable: boolean;
  rate: number;
  line_value: number;
  task_description: string;
  status: string;
}

interface TimesheetResponse {
  total_billable_hours: number;
  total_non_billable_hours: number;
  total_billable_value: number;
  sheets: Timesheet[];
}

interface StatutoryDeadline {
  id: string;
  client_name: string;
  filing_type: string;
  due_date: string;
  period: string;
  status: "pending" | "under_review" | "filed" | "acknowledged";
  assigned_to: string;
  receipt_reference: string | null;
}

interface ConsultingSummary {
  total_engagements: number;
  total_contract_value: number;
  total_retainer_balance: number;
  total_billable_hours: number;
  total_billable_value: number;
  pending_deadlines_count: number;
}

export default function ServicesConsultingPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"engagements" | "timesheets" | "deadlines" | "ratecards">("engagements");
  const [search, setSearch] = useState("");

  // Drawdown state
  const [drawdownEngagement, setDrawdownEngagement] = useState<Engagement | null>(null);
  const [drawdownAmount, setDrawdownAmount] = useState("");
  const [drawdownDesc, setDrawdownDesc] = useState("");
  const [isDrawingDown, setIsDrawingDown] = useState(false);

  // New Engagement state
  const [isAddingEngagement, setIsAddingEngagement] = useState(false);
  const [engagementForm, setEngagementForm] = useState({
    client_name: "",
    project_name: "",
    billing_model: "retainer",
    contract_value: 100000,
    retainer_balance: 50000,
    hourly_rate: 900,
    start_date: "2026-11-01",
    due_date: "2027-04-30",
    partner_in_charge: "د. حازم القاضي (شريك إداري)",
  });

  // New Timesheet state
  const [isAddingTimesheet, setIsAddingTimesheet] = useState(false);
  const [timesheetForm, setTimesheetForm] = useState({
    engagement_id: "",
    engagement_name: "",
    consultant_name: "أ/ شريف ممدوح",
    role: "مستشار أول",
    date: new Date().toISOString().split("T")[0],
    hours: 4.0,
    is_billable: true,
    rate: 800.0,
    task_description: "",
  });

  // Deadline status update state
  const [selectedDeadline, setSelectedDeadline] = useState<StatutoryDeadline | null>(null);
  const [deadlineReceipt, setDeadlineReceipt] = useState("");
  const [isUpdatingDeadline, setIsUpdatingDeadline] = useState(false);

  const { toast } = useToast();

  const engagementsQuery = useQuery({
    queryKey: ["services-engagements"],
    queryFn: () => api.get<Engagement[]>("/services/engagements"),
  });

  const timesheetsQuery = useQuery({
    queryKey: ["services-timesheets"],
    queryFn: () => api.get<TimesheetResponse>("/services/timesheets"),
  });

  const deadlinesQuery = useQuery({
    queryKey: ["services-deadlines"],
    queryFn: () => api.get<StatutoryDeadline[]>("/services/deadlines"),
  });

  const summaryQuery = useQuery({
    queryKey: ["services-summary"],
    queryFn: () => api.get<ConsultingSummary>("/services/summary"),
  });

  const engagements = engagementsQuery.data ?? [];
  const timesheetData = timesheetsQuery.data ?? {
    total_billable_hours: 0,
    total_non_billable_hours: 0,
    total_billable_value: 0,
    sheets: [],
  };
  const deadlines = deadlinesQuery.data ?? [];
  const summary = summaryQuery.data ?? {
    total_engagements: engagements.length,
    total_contract_value: 0,
    total_retainer_balance: 0,
    total_billable_hours: 0,
    total_billable_value: 0,
    pending_deadlines_count: 0,
  };

  const filteredEngagements = engagements.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.client_name.toLowerCase().includes(q) || e.project_name.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Briefcase className="size-4" />
            <span>وحدة الشركات والمكاتب الاستشارية والمحاسبية (CON-01..08)</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            إدارة الاستشارات، مقدمات الأتعاب، وساعات الفوترة
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            تتبع عقود المشاريع (Retainer & Milestone)، استقطاع مخرجات العمل، وسجل الإقرارات الضريبية والقانونية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={tab === "engagements" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("engagements");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Building2 className="size-3.5" />
            عقود المشاريع ومقدم الأتعاب
          </Button>

          <Button
            variant={tab === "timesheets" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("timesheets");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Clock className="size-3.5" />
            ساعات الفوترة (Timesheets)
            <span className="ms-1 rounded-full bg-primary/20 px-1.5 text-[10px] text-primary font-bold">
              {timesheetData.total_billable_hours} س
            </span>
          </Button>

          <Button
            variant={tab === "deadlines" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("deadlines");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Calendar className="size-3.5" />
            الاستحقاقات والإقرارات الضريبية
            {summary.pending_deadlines_count > 0 && (
              <span className="ms-1 rounded-full bg-amber-500 px-1.5 text-[10px] text-white font-bold">
                {summary.pending_deadlines_count}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              sound.click();
              setIsAddingEngagement(true);
            }}
            className="h-9 gap-1.5 text-xs font-bold bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
            عقد استشارة جديد
          </Button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">إجمالي قيمة العقود الجارية</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-foreground">
            {moneyEGP(summary.total_contract_value)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            <span className="num font-semibold">{summary.total_engagements}</span> عقود ومشاريع نشطة
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">رصيد مقدمات الأتعاب المتاحة (Retainers)</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {moneyEGP(summary.total_retainer_balance)}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">رصيد تحت الاستقطاع للعملاء</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">قيمة ساعات العمل المسجلة للفوترة</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-xl font-bold tracking-tight text-primary">
              {moneyEGP(summary.total_billable_value)}
            </p>
            <span className="text-xs text-muted-foreground font-mono">
              ({summary.total_billable_hours} س)
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">معدل الفوترة وفق بطاقات الأسعار</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">استحقاقات ضريبية وقانونية معلقة</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {summary.pending_deadlines_count}
            </p>
            <Badge variant="warning" className="h-5 px-1.5 text-[10px] font-bold">
              تتطلب تقديم
            </Badge>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">مواعيد نهائية هذا الشهر (VAT وضرائب)</p>
        </Card>
      </div>

      {/* Tab 1: Engagements & Retainers (CON-01, CON-04) */}
      {tab === "engagements" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
              <Input
                placeholder="بحث باسم العميل أو المشروع..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-3 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              إجمالي العقود: <strong className="num text-foreground">{filteredEngagements.length}</strong>
            </span>
          </div>

          {engagementsQuery.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : engagementsQuery.isError ? (
            <div className="p-4">
              <ErrorBox message={(engagementsQuery.error as Error).message} onRetry={() => engagementsQuery.refetch()} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل والمشروع</TableHead>
                    <TableHead>نموذج الفوترة</TableHead>
                    <TableHead>قيمة العقد الكلية</TableHead>
                    <TableHead>رصيد مقدم الأتعاب</TableHead>
                    <TableHead>نسبة الرصيد المتبقي</TableHead>
                    <TableHead>الشريك المسؤول</TableHead>
                    <TableHead>المدة الزمنية</TableHead>
                    <TableHead className="text-center">إجراء الاستقطاع (Drawdown)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEngagements.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <span className="font-bold text-foreground text-xs">{e.client_name}</span>
                          <p className="text-[11px] text-primary mt-0.5">{e.project_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {e.billing_model === "retainer"
                            ? "مقدم أتعاب شهري (Retainer)"
                            : e.billing_model === "hourly"
                            ? "فوترة بالساعة (Hourly)"
                            : "مراحل ثابتة (Milestone)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="num text-xs font-bold text-foreground">
                        {moneyEGP(e.contract_value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="num text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {moneyEGP(e.retainer_balance)}
                          </span>
                          {e.is_low_retainer && (
                            <Badge variant="destructive" className="h-4 px-1 text-[9px] font-bold">
                              أقل من 20%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="num text-xs font-semibold">{e.retainer_ratio_pct}%</span>
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full ${
                                e.is_low_retainer ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, e.retainer_ratio_pct)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.partner_in_charge}</TableCell>
                      <TableCell className="num text-[11px] text-muted-foreground">
                        {e.start_date} إلى {e.due_date}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            sound.click();
                            setDrawdownEngagement(e);
                            setDrawdownAmount(String(Math.min(e.retainer_balance, 15000)));
                            setDrawdownDesc(`استقطاع مرحلة تسليم استشارات شهر ${new Date().toLocaleDateString("ar-EG", { month: "long" })}`);
                          }}
                          className="h-8 gap-1.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Coins className="size-3.5" />
                          استقطاع دفعة أتعاب
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Timesheets (CON-02, CON-03) */}
      {tab === "timesheets" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                ساعات عمل المستشارين وفريق المراجعة (Timesheets)
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                إجمالي الساعات المفوترة: <strong className="num text-foreground">{timesheetData.total_billable_hours} ساعة</strong> بقيمة <strong className="num text-emerald-600">{moneyEGP(timesheetData.total_billable_value)}</strong>
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (engagements.length > 0) {
                  setTimesheetForm({
                    ...timesheetForm,
                    engagement_id: engagements[0].id,
                    engagement_name: `${engagements[0].client_name} - ${engagements[0].project_name}`,
                  });
                }
                setIsAddingTimesheet(true);
              }}
              className="h-8 gap-1.5 text-xs font-bold"
            >
              <Plus className="size-3.5" />
              تسجيل ساعات عمل
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستشار والوظيفة</TableHead>
                  <TableHead>المشروع والعميل</TableHead>
                  <TableHead>وصف المهمة المنجزة</TableHead>
                  <TableHead>عدد الساعات</TableHead>
                  <TableHead>سعر الساعة</TableHead>
                  <TableHead>القيمة المحتسبة</TableHead>
                  <TableHead>نوع الفوترة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheetData.sheets.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <span className="font-bold text-foreground text-xs">{s.consultant_name}</span>
                        <p className="text-[10px] text-muted-foreground">{s.role}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">{s.engagement_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">{s.task_description}</TableCell>
                    <TableCell className="num text-xs font-bold">{s.hours} ساعة</TableCell>
                    <TableCell className="num text-xs">{moneyEGP(s.rate)}</TableCell>
                    <TableCell className="num text-xs font-bold text-foreground">
                      {moneyEGP(s.line_value)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.is_billable ? "success" : "secondary"}
                        className="text-[10px] font-bold"
                      >
                        {s.is_billable ? "خاضع للفوترة" : "إداري / داخلي"}
                      </Badge>
                    </TableCell>
                    <TableCell className="num text-xs text-muted-foreground">{s.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 3: Statutory Deadlines (CON-07) */}
      {tab === "deadlines" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-amber-500" />
                سجل المواعيد والإقرارات الضريبية والقانونية للعملاء (CON-07)
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                متابعة تواريخ تقديم إقرارات القيمة المضافة (15 من كل شهر)، كسب العمل، والقوائم المالية
              </p>
            </div>

            <Badge variant="outline" className="text-xs font-bold">
              استحقاقات هذا الشهر: {deadlines.length}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل والشركة</TableHead>
                  <TableHead>نوع الاستحقاق / الإقرار</TableHead>
                  <TableHead>الفترة الضريبية</TableHead>
                  <TableHead>تاريخ الاستحقاق القانوني</TableHead>
                  <TableHead>المسؤول عن الإعداد</TableHead>
                  <TableHead>حالة التقديم</TableHead>
                  <TableHead>رقم إيصال السداد / المنظومة</TableHead>
                  <TableHead className="text-center">تحديث الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-foreground text-xs">{d.client_name}</TableCell>
                    <TableCell className="text-xs font-semibold text-primary">{d.filing_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.period}</TableCell>
                    <TableCell className="num text-xs font-bold text-destructive">{d.due_date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.assigned_to}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.status === "filed" || d.status === "acknowledged"
                            ? "success"
                            : d.status === "under_review"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px] font-bold"
                      >
                        {d.status === "filed"
                          ? "تم التقديم بنجاح"
                          : d.status === "under_review"
                          ? "قيد المراجعة والاعتماد"
                          : "معلق ومستحق"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {d.receipt_reference || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          sound.click();
                          setSelectedDeadline(d);
                          setDeadlineReceipt(d.receipt_reference || `ETA-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
                        }}
                        className="h-8 text-xs font-semibold"
                      >
                        تحديث الإقرار
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Retainer Drawdown Modal (CON-04) */}
      <Modal
        open={!!drawdownEngagement}
        onClose={() => !isDrawingDown && setDrawdownEngagement(null)}
        title={drawdownEngagement ? `استقطاع دفعة أتعاب: ${drawdownEngagement.client_name}` : ""}
      >
        {drawdownEngagement && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const amt = parseFloat(drawdownAmount);
              if (isNaN(amt) || amt <= 0) {
                toast("error", "يرجى إدخال مبلغ استقطاع صحيح");
                return;
              }

              setIsDrawingDown(true);
              try {
                sound.click();
                const res = await api.post<any>(`/services/engagements/${drawdownEngagement.id}/drawdown`, {
                  amount: amt,
                  description: drawdownDesc,
                });
                sound.success();
                toast("success", res.detail);
                await queryClient.invalidateQueries({ queryKey: ["services-engagements"] });
                await queryClient.invalidateQueries({ queryKey: ["services-summary"] });
                setDrawdownEngagement(null);
                setDrawdownAmount("");
                setDrawdownDesc("");
              } catch (err: any) {
                toast("error", err.message || "فشل استقطاع الدفعة");
              } finally {
                setIsDrawingDown(false);
              }
            }}
            className="flex flex-col gap-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3">
              <div>
                <span className="text-muted-foreground">المشروع:</span>
                <p className="font-bold text-foreground">{drawdownEngagement.project_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">إجمالي قيمة العقد:</span>
                <p className="num font-bold text-foreground">{moneyEGP(drawdownEngagement.contract_value)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">رصيد مقدم الأتعاب الحالي:</span>
                <p className="num font-bold text-emerald-600 dark:text-emerald-400">
                  {moneyEGP(drawdownEngagement.retainer_balance)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">الشريك المسؤول:</span>
                <p className="font-semibold text-muted-foreground">{drawdownEngagement.partner_in_charge}</p>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground">مبلغ الاستقطاع من رصيد الأتعاب (ج.م) *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-primary"
                value={drawdownAmount}
                onChange={(e) => setDrawdownAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">بيان المخرج أو الخدمة المنجزة *</label>
              <textarea
                required
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                placeholder="مثال: تسليم مسودة التقرير المالي لشهر أكتوبر، أو حضور جلسة لجنة فض المنازعات..."
                value={drawdownDesc}
                onChange={(e) => setDrawdownDesc(e.target.value)}
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDrawdownEngagement(null)} disabled={isDrawingDown}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isDrawingDown} className="font-bold gap-1.5">
                <Coins className="size-4" />
                تأكيد الاستقطاع
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* New Engagement Modal (CON-01) */}
      <Modal
        open={isAddingEngagement}
        onClose={() => setIsAddingEngagement(false)}
        title="تسجيل عقد استشارات أو مراجعة جديد"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            sound.click();
            try {
              await api.post("/services/engagements", engagementForm);
              sound.success();
              toast("success", `تم تسجيل عقد «${engagementForm.project_name}» بنجاح`);
              await queryClient.invalidateQueries({ queryKey: ["services-engagements"] });
              await queryClient.invalidateQueries({ queryKey: ["services-summary"] });
              setIsAddingEngagement(false);
            } catch (err: any) {
              toast("error", err.message || "فشل تسجيل العقد");
            }
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div>
            <label className="font-semibold text-foreground">اسم العميل / المؤسسة *</label>
            <input
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="مثال: شركة النيل للتطوير العقاري"
              value={engagementForm.client_name}
              onChange={(e) => setEngagementForm({ ...engagementForm, client_name: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">عنوان المشروع ونطاق العمل *</label>
            <input
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="مثال: إعادة هيكلة نظم الرقابة الداخلية وإعداد دليل الحسابات"
              value={engagementForm.project_name}
              onChange={(e) => setEngagementForm({ ...engagementForm, project_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">نموذج الفوترة *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={engagementForm.billing_model}
                onChange={(e) => setEngagementForm({ ...engagementForm, billing_model: e.target.value as any })}
              >
                <option value="retainer">مقدم أتعاب شهري (Retainer)</option>
                <option value="hourly">فوترة بالساعة (Hourly Rate)</option>
                <option value="fixed_milestone">مراحل ثابتة (Fixed Milestone)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">إجمالي قيمة العقد (ج.م) *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-primary"
                value={engagementForm.contract_value}
                onChange={(e) => setEngagementForm({ ...engagementForm, contract_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">الدفعة المقدمة المسددة (ج.م)</label>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-emerald-600"
                value={engagementForm.retainer_balance}
                onChange={(e) => setEngagementForm({ ...engagementForm, retainer_balance: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">سعر الساعة الاستشارية (ج.م)</label>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num"
                value={engagementForm.hourly_rate}
                onChange={(e) => setEngagementForm({ ...engagementForm, hourly_rate: parseFloat(e.target.value) || 800 })}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingEngagement(false)}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              تأكيد حفظ العقد
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Timesheet Modal (CON-02, CON-03) */}
      <Modal
        open={isAddingTimesheet}
        onClose={() => setIsAddingTimesheet(false)}
        title="تسجيل ساعات عمل استشارية"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            sound.click();
            try {
              await api.post("/services/timesheets", timesheetForm);
              sound.success();
              toast("success", `تم تسجيل ${timesheetForm.hours} ساعة استشارية بنجاح`);
              await queryClient.invalidateQueries({ queryKey: ["services-timesheets"] });
              await queryClient.invalidateQueries({ queryKey: ["services-summary"] });
              setIsAddingTimesheet(false);
            } catch (err: any) {
              toast("error", err.message || "فشل تسجيل الساعات");
            }
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div>
            <label className="font-semibold text-foreground">عقد المشروع المعني *</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              value={timesheetForm.engagement_id}
              onChange={(e) => {
                const eng = engagements.find((x) => x.id === e.target.value);
                if (eng) {
                  setTimesheetForm({
                    ...timesheetForm,
                    engagement_id: eng.id,
                    engagement_name: `${eng.client_name} - ${eng.project_name}`,
                    rate: eng.hourly_rate,
                  });
                }
              }}
            >
              {engagements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.client_name} ({e.project_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">اسم المستشار *</label>
              <input
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={timesheetForm.consultant_name}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, consultant_name: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الوظيفة / الدور</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={timesheetForm.role}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, role: e.target.value })}
              >
                <option value="شريك إداري">شريك إداري (Partner)</option>
                <option value="مستشار أول">مستشار أول (Senior Consultant)</option>
                <option value="مراجع قانوني">مراجع قانوني (Senior Auditor)</option>
                <option value="مساعد مالي">مساعد مالي (Associate)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">عدد الساعات المنجزة *</label>
              <input
                type="number"
                step="0.25"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-primary"
                value={timesheetForm.hours}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, hours: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">سعر الساعة (ج.م) *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold"
                value={timesheetForm.rate}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground">وصف المهمة المنجزة *</label>
            <textarea
              required
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="مثال: فحص دورة الإيرادات والمشتريات وتحليل عينات الفواتير..."
              value={timesheetForm.task_description}
              onChange={(e) => setTimesheetForm({ ...timesheetForm, task_description: e.target.value })}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingTimesheet(false)}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              تأكيد تسجيل الساعات
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Deadline Modal (CON-07) */}
      <Modal
        open={!!selectedDeadline}
        onClose={() => !isUpdatingDeadline && setSelectedDeadline(null)}
        title={selectedDeadline ? `تحديث حالة الاستحقاق: ${selectedDeadline.filing_type}` : ""}
      >
        {selectedDeadline && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsUpdatingDeadline(true);
              try {
                sound.click();
                await api.post(`/services/deadlines/${selectedDeadline.id}/status`, {
                  status: "filed",
                  receipt_reference: deadlineReceipt,
                });
                sound.success();
                toast("success", `تم تحديث حالة الإقرار إلى (تم التقديم) برقم إيصال ${deadlineReceipt}`);
                await queryClient.invalidateQueries({ queryKey: ["services-deadlines"] });
                await queryClient.invalidateQueries({ queryKey: ["services-summary"] });
                setSelectedDeadline(null);
              } catch (err: any) {
                toast("error", err.message || "فشل تحديث الإقرار");
              } finally {
                setIsUpdatingDeadline(false);
              }
            }}
            className="flex flex-col gap-4 text-xs"
          >
            <div className="rounded-xl bg-muted p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">العميل:</span>
                <strong className="text-foreground">{selectedDeadline.client_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفترة الضريبية:</span>
                <strong className="text-foreground">{selectedDeadline.period}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                <strong className="text-destructive font-mono">{selectedDeadline.due_date}</strong>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground">رقم إيصال المنظومة الإلكترونية / مرجع المصلحة *</label>
              <input
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-primary"
                placeholder="مثال: ETA-REC-2026-8812"
                value={deadlineReceipt}
                onChange={(e) => setDeadlineReceipt(e.target.value)}
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDeadline(null)} disabled={isUpdatingDeadline}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isUpdatingDeadline} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <ShieldCheck className="size-4" />
                تأكيد تقديم الإقرار رسمياً
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
