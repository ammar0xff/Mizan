import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  DollarSign,
  FileCheck,
  Gavel,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Input } from "@/components/kit/input";
import { Skeleton } from "@/components/kit/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/kit/table";
import { sound } from "@/lib/sound";

interface LawSummary {
  active_cases_count: number;
  total_cases_count: number;
  upcoming_hearings_count: number;
  unbilled_hours_total: number;
  unbilled_fees_amount: number;
  client_trust_balance: number;
}

interface LawCase {
  id: string;
  case_number: string;
  client_name: string;
  case_title: string;
  case_type: string;
  court_jurisdiction: string;
  circuit_number: string;
  opposing_party: string;
  opposing_counsel: string;
  assigned_partner: string;
  filing_date: string;
  claim_amount: number;
  status: "active" | "in_court" | "judgment_rendered" | "closed";
}

interface LawHearing {
  id: string;
  case_id: string;
  case_number: string;
  hearing_date: string;
  court_room: string;
  hearing_stage: string;
  required_action: string;
  outcome_summary: string;
  next_hearing_date: string;
  appeal_deadline: string;
}

interface LawTimeEntry {
  id: string;
  case_id: string;
  case_number: string;
  lawyer_name: string;
  lawyer_role: string;
  work_date: string;
  hours: number;
  hourly_rate: number;
  total_amount: number;
  activity_type: string;
  description: string;
  is_billed: boolean;
}

interface LawTrustTransaction {
  id: string;
  account_number: string;
  case_id: string;
  client_name: string;
  transaction_type: string;
  amount: number;
  running_balance: number;
  payment_reference: string;
  description: string;
}

interface LawConflictCheck {
  id: string;
  search_query: string;
  searched_by: string;
  conflict_found: boolean;
  flagged_matters: string;
  clearance_status: "cleared" | "flagged_conflict";
  notes: string;
  created_at: string;
}

const moneyEGP = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export default function LawPracticePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<"cases" | "hearings" | "time" | "trust_conflict">("cases");
  const [search, setSearch] = useState("");

  // Modals state
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictQuery, setConflictQuery] = useState("");
  const [isScanningConflict, setIsScanningConflict] = useState(false);
  const [outcomeTargetHearing, setOutcomeTargetHearing] = useState<LawHearing | null>(null);
  const [outcomeText, setOutcomeText] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState("");

  // New Case Form
  const [caseForm, setCaseForm] = useState({
    case_number: "",
    client_name: "",
    case_title: "",
    case_type: "نزاع تجاري وتحكيم",
    court_jurisdiction: "محكمة استئناف القاهرة الاقتصادية",
    circuit_number: "الدائرة السابعة تجاري",
    opposing_party: "",
    opposing_counsel: "",
    assigned_partner: "المستشار / عصام الشريف",
    filing_date: "2026-11-02",
    claim_amount: "5000000",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<LawSummary>({
    queryKey: ["law-summary"],
    queryFn: () => api.get("/law/summary"),
  });

  const { data: cases = [], isLoading: isCasesLoading } = useQuery<LawCase[]>({
    queryKey: ["law-cases"],
    queryFn: () => api.get("/law/cases"),
  });

  const { data: hearings = [], isLoading: isHearingsLoading } = useQuery<LawHearing[]>({
    queryKey: ["law-hearings"],
    queryFn: () => api.get("/law/hearings"),
  });

  const { data: timeEntries = [], isLoading: isTimeLoading } = useQuery<LawTimeEntry[]>({
    queryKey: ["law-time"],
    queryFn: () => api.get("/law/time-entries"),
  });

  const { data: trustTxs = [] } = useQuery<LawTrustTransaction[]>({
    queryKey: ["law-trust"],
    queryFn: () => api.get("/law/trust-transactions"),
  });

  const { data: conflictChecks = [] } = useQuery<LawConflictCheck[]>({
    queryKey: ["law-conflicts"],
    queryFn: () => api.get("/law/conflict-checks"),
  });

  // Actions
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/law/cases", {
        ...caseForm,
        claim_amount: parseFloat(caseForm.claim_amount) || 0,
      });
      toast("success", "تم قيد وتسجيل ملف القضية بنجاح");
      setIsCaseModalOpen(false);
      setCaseForm({
        case_number: "",
        client_name: "",
        case_title: "",
        case_type: "نزاع تجاري وتحكيم",
        court_jurisdiction: "محكمة استئناف القاهرة الاقتصادية",
        circuit_number: "الدائرة السابعة تجاري",
        opposing_party: "",
        opposing_counsel: "",
        assigned_partner: "المستشار / عصام الشريف",
        filing_date: "2026-11-02",
        claim_amount: "5000000",
      });
      queryClient.invalidateQueries({ queryKey: ["law-cases"] });
      queryClient.invalidateQueries({ queryKey: ["law-summary"] });
    } catch {
      toast("error", "تعذر تسجيل القضية");
    }
  };

  const handleBillTimeEntry = async (entryId: string) => {
    sound.click();
    try {
      await api.post(`/law/time-entries/${entryId}/bill`, {});
      toast("success", "تم ترحيل الساعات المهنية للمطالبة والفوترة");
      queryClient.invalidateQueries({ queryKey: ["law-time"] });
      queryClient.invalidateQueries({ queryKey: ["law-summary"] });
    } catch {
      toast("error", "تعذر فوترة الساعات المهنية");
    }
  };

  const handleRecordHearingOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeTargetHearing) return;
    sound.click();
    try {
      await api.post(`/law/hearings/${outcomeTargetHearing.id}/outcome`, {
        outcome_summary: outcomeText,
        next_hearing_date: nextHearingDate,
      });
      toast("success", "تم توثيق منطوق وقرار الجلسة بنجاح");
      setOutcomeTargetHearing(null);
      setOutcomeText("");
      setNextHearingDate("");
      queryClient.invalidateQueries({ queryKey: ["law-hearings"] });
      queryClient.invalidateQueries({ queryKey: ["law-summary"] });
    } catch {
      toast("error", "تعذر توثيق قرار الجلسة");
    }
  };

  const handleRunConflictCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictQuery.trim()) return;
    setIsScanningConflict(true);
    sound.click();
    try {
      const res = await api.post<{ conflict_found: boolean; flagged_matters: string }>(
        "/law/conflict-checks",
        { search_query: conflictQuery }
      );
      if (res.conflict_found) {
        toast("error", "تم رصد تعارض مصالح محتمل! يرجى مراجعة التقرير");
      } else {
        toast("success", "تم فحص تعارض المصالح بنجاح — الكيان مصرح بتمثيله");
      }
      setConflictQuery("");
      setIsConflictModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["law-conflicts"] });
    } catch {
      toast("error", "تعذر إتمام فحص تعارض المصالح");
    } finally {
      setIsScanningConflict(false);
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      c.case_number.toLowerCase().includes(search.toLowerCase()) ||
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.opposing_party.toLowerCase().includes(search.toLowerCase()) ||
      c.case_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              إدارة مكاتب المحاماة والاستشارات القانونية
            </h1>
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs">
              LAW-01..09
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ملفات القضايا والتحكيم، الأجندة القضائية وجلسات المحاكم، الساعات المهنية، وحسابات أمانات الموكلين IOLTA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              sound.click();
              setIsConflictModalOpen(true);
            }}
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-2 h-9 text-xs"
          >
            <ShieldAlert className="w-4 h-4" />
            فحص تعارض المصالح
          </Button>
          <Button
            onClick={() => {
              sound.click();
              setIsCaseModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white gap-2 h-9 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            قيد قضية جديدة
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">القضايا النشطة والمتداولة</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Gavel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.active_cases_count || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              إجمالي {summary?.total_cases_count || 0} ملف قضائي مقيد بالمكتب
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">الجلسات والطعون القادمة</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {summary?.upcoming_hearings_count || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">جلسات محاكم مجدولة بالأجندة</p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">ساعات العمل غير المفوترة</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.unbilled_fees_amount || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {summary?.unbilled_hours_total || 0} ساعة عمل مهنية قيد الفوترة
            </p>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">رصيد أمانات الموكلين (IOLTA)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {moneyEGP(summary?.client_trust_balance || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono">حسابات بنكية مفرزة ومؤمنة</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.click();
              setTab("cases");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "cases"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            ملفات القضايا والموكلين (Matter Ledger)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("hearings");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "hearings"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الأجندة وجلسات المحاكم (Court Calendar)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("time");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "time"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            الساعات والأتعاب المهنية (Billable Hours)
          </button>
          <button
            onClick={() => {
              sound.click();
              setTab("trust_conflict");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "trust_conflict"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            أمانات الموكلين والتعارض (Trust & Conflict)
          </button>
        </div>

        <div className="relative w-64 pb-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="بحث بالقضية، الموكل، الخصم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Case & Matter Management */}
      {tab === "cases" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">رقم القضية والمحكمة</TableHead>
                <TableHead className="text-right">الموكل وموضوع الدعوى</TableHead>
                <TableHead className="text-right">الخصم والمحامي المقابل</TableHead>
                <TableHead className="text-right">الشريك المسؤول</TableHead>
                <TableHead className="text-right">قيمة المطالبة</TableHead>
                <TableHead className="text-center">الحالة القضائية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCasesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد قضايا مطابقة للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-sm">{c.case_number}</div>
                      <div className="text-xs text-muted-foreground">{c.court_jurisdiction} — {c.circuit_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">{c.client_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-sm">{c.case_title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{c.opposing_party}</div>
                      <div className="text-[11px] text-muted-foreground">وكيله: {c.opposing_counsel}</div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">{c.assigned_partner}</TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {moneyEGP(c.claim_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          c.status === "judgment_rendered"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                            : c.status === "in_court"
                            ? "border-blue-500/40 text-blue-400 bg-blue-500/10 text-xs"
                            : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs"
                        }
                      >
                        {c.status === "judgment_rendered"
                          ? "صدر فيها حكم"
                          : c.status === "in_court"
                          ? "متداولة بالجلسات"
                          : "مقيدة / قيد التحضير"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Court Hearings & Calendar */}
      {tab === "hearings" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">تاريخ الجلسة ورقم القضية</TableHead>
                <TableHead className="text-right">المحكمة والقاعة</TableHead>
                <TableHead className="text-right">مرحلة وموضوع الجلسة</TableHead>
                <TableHead className="text-right">الإجراء المطلوب والمذكرات</TableHead>
                <TableHead className="text-right">القرار / المنطوق</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isHearingsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : hearings.map((h) => (
                <TableRow key={h.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-mono font-bold text-foreground text-sm">{h.hearing_date}</div>
                    <div className="font-mono text-xs text-amber-400">{h.case_number}</div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">{h.court_room}</TableCell>
                  <TableCell className="text-xs text-foreground">{h.hearing_stage}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{h.required_action}</TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-foreground">{h.outcome_summary}</div>
                    {h.next_hearing_date && (
                      <div className="text-[11px] font-mono text-blue-400 mt-0.5">
                        الجلسة القادمة: {h.next_hearing_date}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sound.click();
                        setOutcomeTargetHearing(h);
                      }}
                      className="text-xs h-7 px-2.5 border-border gap-1"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      إثبات القرار
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 3: Billable Hours & Time Entries */}
      {tab === "time" && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">المحامي والدرجة</TableHead>
                <TableHead className="text-right">القضية والتاريخ</TableHead>
                <TableHead className="text-right">النشاط والوصف الإجرائي</TableHead>
                <TableHead className="text-center">الساعات المحتسبة</TableHead>
                <TableHead className="text-right">السعر / الساعة</TableHead>
                <TableHead className="text-right">إجمالي الأتعاب</TableHead>
                <TableHead className="text-center">حالة الفوترة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTimeLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : timeEntries.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-semibold text-foreground text-sm">{t.lawyer_name}</div>
                    <div className="text-xs text-muted-foreground">{t.lawyer_role}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-bold text-foreground">{t.case_number}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{t.work_date}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{t.activity_type}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{t.description}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-sm">
                    <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/50">
                      {t.hours} س
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {moneyEGP(t.hourly_rate)}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-foreground">
                    {moneyEGP(t.total_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.is_billed ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs">
                        تمت الفوترة
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleBillTimeEntry(t.id)}
                        className="text-xs h-6 px-2 bg-amber-600 hover:bg-amber-500 text-white gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        ترحيل للفوترة
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Client Trust Accounts & Conflict Screenings */}
      {tab === "trust_conflict" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trust Account Transactions */}
          <Card className="p-5 border-border/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">سجل أمانات الموكلين المفرزة (IOLTA Ledger)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {trustTxs.length} حركات
              </Badge>
            </div>

            <div className="space-y-3">
              {trustTxs.map((tx) => (
                <div key={tx.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">{tx.client_name}</span>
                    <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/30 text-emerald-400">
                      رصيد جاري: {moneyEGP(tx.running_balance)}
                    </Badge>
                  </div>

                  <div className="text-xs font-semibold text-foreground">{tx.transaction_type}</div>
                  <div className="text-xs text-muted-foreground">{tx.description}</div>

                  <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">مرجع: {tx.payment_reference}</span>
                    <span className="font-bold text-foreground">{moneyEGP(tx.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Conflict of Interest Logs */}
          <Card className="p-5 border-border/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">سجل رقابة تعارض المصالح (Conflict of Interest)</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {conflictChecks.length} فحوصات
              </Badge>
            </div>

            <div className="space-y-3">
              {conflictChecks.map((chk) => (
                <div key={chk.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">استعلام: «{chk.search_query}»</span>
                    <Badge
                      variant="outline"
                      className={
                        chk.conflict_found
                          ? "border-rose-500/40 text-rose-400 bg-rose-500/10 text-xs"
                          : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                      }
                    >
                      {chk.conflict_found ? "يوجد تعارض مصالح" : "تم الإبراء والاعتماد"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="text-foreground font-semibold">الملفات المرصودة: </span>
                    {chk.flagged_matters}
                  </div>
                  <div className="text-xs text-muted-foreground">{chk.notes}</div>

                  <div className="text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/30">
                    تم الفحص بواسطة: {chk.searched_by}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* New Case Modal */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setIsCaseModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-400" />
              قيد وتسجيل ملف قضية جديدة
            </h3>
            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">رقم القضية الرسمي *</label>
                  <Input
                    required
                    placeholder="مثال: 950 / 2026 ق استئناف القاهرة"
                    value={caseForm.case_number}
                    onChange={(e) => setCaseForm({ ...caseForm, case_number: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">نوع القضية *</label>
                  <Input
                    required
                    value={caseForm.case_type}
                    onChange={(e) => setCaseForm({ ...caseForm, case_type: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">اسم الموكل أو المنشأة *</label>
                <Input
                  required
                  placeholder="مثال: شركة النيل الدولية للتجارة والتوزيع"
                  value={caseForm.client_name}
                  onChange={(e) => setCaseForm({ ...caseForm, client_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">موضوع الدعوى والطلبات *</label>
                <Input
                  required
                  placeholder="مثال: بطلان حكم تحكيم في عقد توريدات تجارية مع التعويض"
                  value={caseForm.case_title}
                  onChange={(e) => setCaseForm({ ...caseForm, case_title: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">الخصم (الطرف المقابل) *</label>
                  <Input
                    required
                    placeholder="مثال: بنك القاهرة أو شركة فورتونا"
                    value={caseForm.opposing_party}
                    onChange={(e) => setCaseForm({ ...caseForm, opposing_party: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">محامي الخصم</label>
                  <Input
                    placeholder="مثال: مكتب الأستاذ فلان"
                    value={caseForm.opposing_counsel}
                    onChange={(e) => setCaseForm({ ...caseForm, opposing_counsel: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">المحكمة المختصة</label>
                  <Input
                    value={caseForm.court_jurisdiction}
                    onChange={(e) => setCaseForm({ ...caseForm, court_jurisdiction: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">قيمة المطالبة (ج.م)</label>
                  <Input
                    type="number"
                    value={caseForm.claim_amount}
                    onChange={(e) => setCaseForm({ ...caseForm, claim_amount: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsCaseModalOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white">
                  قيد القضية وتوليد الملف
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Hearing Outcome Modal */}
      {outcomeTargetHearing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setOutcomeTargetHearing(null)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              إثبات قرار جلسة: {outcomeTargetHearing.case_number}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 font-mono">{outcomeTargetHearing.hearing_date}</p>
            <form onSubmit={handleRecordHearingOutcome} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">منطوق وقرار المحكمة *</label>
                <Input
                  required
                  placeholder="مثال: قررت المحكمة التأجيل لجلسة 14-12 لتقديم المذكرات"
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">تاريخ الجلسة القادمة المحددة</label>
                <Input
                  type="date"
                  value={nextHearingDate}
                  onChange={(e) => setNextHearingDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setOutcomeTargetHearing(null)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button type="submit" className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white">
                  حفظ القرار وتحديث الأجندة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Conflict Check Modal */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl relative text-right" dir="rtl">
            <button
              onClick={() => setIsConflictModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              فحص تعارض المصالح الآلي (Conflict of Interest)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              فحص فوري لقاعدة بيانات الموكلين والخصوم والمحامين السابقين والحاليين قبل قبول التوكيل.
            </p>
            <form onSubmit={handleRunConflictCheck} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">اسم الشخص أو الشركة المراد فحصها *</label>
                <Input
                  required
                  placeholder="مثال: مجموعة فورتونا الدولية أو شركة الدلتا"
                  value={conflictQuery}
                  onChange={(e) => setConflictQuery(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsConflictModalOpen(false)} className="h-8 text-xs">
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isScanningConflict}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isScanningConflict ? "جاري الفحص المتقاطع..." : "بدء المسح الرقابي"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
