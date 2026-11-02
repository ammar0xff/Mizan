import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Coins,
  FileSpreadsheet,
  Fingerprint,
  Gavel,
  Landmark,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Users,
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

interface GovSummary {
  total_funds_count: number;
  total_allocated_budget_egp: number;
  total_spent_budget_egp: number;
  encumbered_commitments_egp: number;
  total_beneficiaries_assisted: number;
  active_tenders_count: number;
}

interface GovFund {
  id: string;
  fund_code: string;
  fund_name: string;
  fund_type: string;
  donor_organization: string;
  allocated_budget_egp: number;
  spent_amount_egp: number;
  remaining_budget_egp: number;
  created_at?: string;
}

interface GovCommitment {
  id: string;
  fund_id: string;
  fund_code: string;
  fund_name: string;
  commitment_ref: string;
  department: string;
  line_item: string;
  requisition_amount_egp: number;
  encumbered_amount_egp: number;
  status: string;
  created_at?: string;
}

interface GovAid {
  id: string;
  beneficiary_national_id: string;
  full_name: string;
  vulnerability_score: number;
  aid_type: string;
  aid_value_egp: number;
  family_members_count: number;
  distribution_date: string;
  biometric_verified: boolean;
  status: string;
  created_at?: string;
}

interface GovTender {
  id: string;
  tender_ref: string;
  title: string;
  procuring_entity: string;
  estimated_budget_egp: number;
  bid_bond_amount_egp: number;
  closing_date: string;
  status: string;
  created_at?: string;
}

export default function GovernmentPage() {
  const [activeTab, setActiveTab] = useState<
    "funds" | "commitments" | "aids" | "tenders"
  >("funds");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isAidModalOpen, setIsAidModalOpen] = useState(false);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);

  // Form states
  const [fundForm, setFundForm] = useState({
    fund_code: "",
    fund_name: "",
    fund_type: "temporarily_restricted",
    donor_organization: "",
    allocated_budget_egp: 10000000,
    spent_amount_egp: 0,
  });

  const [commitmentForm, setCommitmentForm] = useState({
    fund_id: "",
    commitment_ref: "",
    department: "",
    line_item: "",
    requisition_amount_egp: 500000,
    encumbered_amount_egp: 500000,
    status: "encumbered",
  });

  const [aidForm, setAidForm] = useState({
    beneficiary_national_id: "",
    full_name: "",
    vulnerability_score: 85,
    aid_type: "cash_transfer",
    aid_value_egp: 2500,
    family_members_count: 4,
    distribution_date: new Date().toISOString().split("T")[0],
    biometric_verified: true,
    status: "delivered",
  });

  const [tenderForm, setTenderForm] = useState({
    tender_ref: "",
    title: "",
    procuring_entity: "",
    estimated_budget_egp: 5000000,
    bid_bond_amount_egp: 100000,
    closing_date: new Date(Date.now() + 30 * 24 * 3600 * 1000)
      .toISOString()
      .split("T")[0],
    status: "published",
  });

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<GovSummary>({
    queryKey: ["gov-summary"],
    queryFn: () => api.get<GovSummary>("/gov/summary"),
  });

  const {
    data: funds = [],
    isLoading: isFundsLoading,
    refetch: refetchFunds,
  } = useQuery<GovFund[]>({
    queryKey: ["gov-funds"],
    queryFn: () => api.get<GovFund[]>("/gov/funds"),
  });

  const {
    data: commitments = [],
    isLoading: isCommitmentsLoading,
    refetch: refetchCommitments,
  } = useQuery<GovCommitment[]>({
    queryKey: ["gov-commitments"],
    queryFn: () => api.get<GovCommitment[]>("/gov/commitments"),
  });

  const {
    data: aids = [],
    isLoading: isAidsLoading,
    refetch: refetchAids,
  } = useQuery<GovAid[]>({
    queryKey: ["gov-aids"],
    queryFn: () => api.get<GovAid[]>("/gov/aids"),
  });

  const {
    data: tenders = [],
    isLoading: isTendersLoading,
    refetch: refetchTenders,
  } = useQuery<GovTender[]>({
    queryKey: ["gov-tenders"],
    queryFn: () => api.get<GovTender[]>("/gov/tenders"),
  });

  const handleRefresh = () => {
    sound.click();
    refetchSummary();
    refetchFunds();
    refetchCommitments();
    refetchAids();
    refetchTenders();
    toast("success", "تم تحديث بيانات المؤسسات الحكومية وغير الربحية");
  };

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gov/funds", fundForm);
      toast("success", "تم تسجيل الصندوق التمويلي / المنحة بنجاح");
      setIsFundModalOpen(false);
      refetchFunds();
      refetchSummary();
      setFundForm({
        fund_code: "",
        fund_name: "",
        fund_type: "temporarily_restricted",
        donor_organization: "",
        allocated_budget_egp: 10000000,
        spent_amount_egp: 0,
      });
    } catch {
      toast("error", "فشل تسجيل الصندوق");
    }
  };

  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gov/commitments", commitmentForm);
      toast("success", "تم قيد الارتباط المالي وحجز الموازنة بنجاح");
      setIsCommitmentModalOpen(false);
      refetchCommitments();
      refetchSummary();
      setCommitmentForm({
        fund_id: "",
        commitment_ref: "",
        department: "",
        line_item: "",
        requisition_amount_egp: 500000,
        encumbered_amount_egp: 500000,
        status: "encumbered",
      });
    } catch {
      toast("error", "فشل قيد الارتباط المالي");
    }
  };

  const handleCreateAid = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gov/aids", aidForm);
      toast("success", "تم تسجيل إعانة المستفيد والتحقق البصري/البيومتري بنجاح");
      setIsAidModalOpen(false);
      refetchAids();
      refetchSummary();
      setAidForm({
        beneficiary_national_id: "",
        full_name: "",
        vulnerability_score: 85,
        aid_type: "cash_transfer",
        aid_value_egp: 2500,
        family_members_count: 4,
        distribution_date: new Date().toISOString().split("T")[0],
        biometric_verified: true,
        status: "delivered",
      });
    } catch {
      toast("error", "فشل تسجيل الإعانة");
    }
  };

  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gov/tenders", tenderForm);
      toast("success", "تم طرح المناقصة العامة بنجاح");
      setIsTenderModalOpen(false);
      refetchTenders();
      refetchSummary();
      setTenderForm({
        tender_ref: "",
        title: "",
        procuring_entity: "",
        estimated_budget_egp: 5000000,
        bid_bond_amount_egp: 100000,
        closing_date: new Date(Date.now() + 30 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0],
        status: "published",
      });
    } catch {
      toast("error", "فشل طرح المناقصة");
    }
  };

  // Filters
  const filteredFunds = funds.filter(
    (f) =>
      f.fund_code.toLowerCase().includes(search.toLowerCase()) ||
      f.fund_name.toLowerCase().includes(search.toLowerCase()) ||
      f.donor_organization.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCommitments = commitments.filter(
    (c) =>
      c.commitment_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.line_item.toLowerCase().includes(search.toLowerCase()) ||
      c.fund_code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAids = aids.filter(
    (a) =>
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.beneficiary_national_id.includes(search) ||
      a.aid_type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTenders = tenders.filter(
    (t) =>
      t.tender_ref.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.procuring_entity.toLowerCase().includes(search.toLowerCase())
  );

  const formatFundType = (ft: string) => {
    switch (ft) {
      case "permanently_restricted":
        return "صندوق وقفي / مقيد دائماً (Endowment)";
      case "temporarily_restricted":
        return "مقيد لمشروع محدد (Restricted Grant)";
      case "unrestricted":
        return "صندوق عام غير مقيد (Unrestricted)";
      default:
        return ft;
    }
  };

  const formatAidType = (at: string) => {
    switch (at) {
      case "cash_transfer":
        return "تحويل نقدي شهري (تكافل وكرامة)";
      case "food_basket":
        return "سلة غذائية وبطاقة إمداد تمويني";
      case "medical_aid":
        return "علاج على نفقة الدولة وأجهزة تعويضية";
      case "shelter_rehab":
        return "إعادة تأهيل سكن ومياه نظيفة";
      default:
        return at;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                إدارة المؤسسات الحكومية والمنظمات غير الهادفة للربح (Gov & NGO)
              </h1>
              <p className="text-sm text-muted-foreground">
                محاسبة الصناديق المقيدة، حجز الارتباط المالي الصارم (Encumbrance)، الإعانات البيومترية، والمناقصات العامة
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2 border-border/40 hover:bg-secondary/20"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          {activeTab === "funds" && (
            <Button
              onClick={() => {
                sound.click();
                setIsFundModalOpen(true);
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              صندوق تمويلي / منحة جديدة
            </Button>
          )}
          {activeTab === "commitments" && (
            <Button
              onClick={() => {
                sound.click();
                if (funds.length > 0 && !commitmentForm.fund_id) {
                  setCommitmentForm((prev) => ({ ...prev, fund_id: funds[0].id }));
                }
                setIsCommitmentModalOpen(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              حجز ارتباط مالي مسبق
            </Button>
          )}
          {activeTab === "aids" && (
            <Button
              onClick={() => {
                sound.click();
                setIsAidModalOpen(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4" />
              صرف إعانة لمستفيد (تحقق بيومتري)
            </Button>
          )}
          {activeTab === "tenders" && (
            <Button
              onClick={() => {
                sound.click();
                setIsTenderModalOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4" />
              طرح مناقصة عامة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              الموازنة المعتمدة
            </span>
            <Coins className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.total_allocated_budget_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            إجمالي اعتمادات الصناديق والمنح
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              المنصرف الفعلي
            </span>
            <Receipt className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.total_spent_budget_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            نفقات منفذة ومسددة للمشاريع
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              الارتباطات المحجوزة
            </span>
            <FileSpreadsheet className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.encumbered_commitments_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            أوامر شراء وعقود قيد التنفيذ
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              المستفيدون من الإعانات
            </span>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.total_beneficiaries_assisted ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مواطنون تم صرف الدعم لهم
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              المناقصات النشطة
            </span>
            <Gavel className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.active_tenders_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مناقصات وممارسات عامة مطروحة
          </span>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              sound.click();
              setActiveTab("funds");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "funds"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            محاسبة الصناديق والمنح (Funds)
            <Badge variant="outline" className="mr-1 text-xs">
              {funds.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("commitments");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "commitments"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4" />
            الارتباط وحجز الموازنة (Encumbrance)
            <Badge variant="outline" className="mr-1 text-xs">
              {commitments.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("aids");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "aids"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Fingerprint className="h-4 w-4" />
            إعانات المستفيدين البيومترية (Aid)
            <Badge variant="outline" className="mr-1 text-xs">
              {aids.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("tenders");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "tenders"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Gavel className="h-4 w-4" />
            المناقصات العامة (Tenders)
            <Badge variant="outline" className="mr-1 text-xs">
              {tenders.length}
            </Badge>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود، الصندوق، الرقم القومي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Tab 1: Funds */}
      {activeTab === "funds" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود الصندوق</TableHead>
                <TableHead className="text-right">اسم الصندوق / المنحة</TableHead>
                <TableHead className="text-right">تصنيف الصندوق</TableHead>
                <TableHead className="text-right">الجهة المانحة (Donor)</TableHead>
                <TableHead className="text-right">الموازنة المخصصة</TableHead>
                <TableHead className="text-right">المنصرف حتى تاريخه</TableHead>
                <TableHead className="text-right">الرصيد المتبقي</TableHead>
                <TableHead className="text-right">نسبة الإنجاز المالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFundsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredFunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد صناديق تمويلية مسجلة تطابق البحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredFunds.map((f) => {
                  const pct = f.allocated_budget_egp > 0
                    ? Math.round((f.spent_amount_egp / f.allocated_budget_egp) * 100)
                    : 0;
                  return (
                    <TableRow key={f.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono font-medium text-emerald-400">
                        {f.fund_code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground max-w-xs truncate">
                        {f.fund_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
                          {formatFundType(f.fund_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {f.donor_organization}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-emerald-400">
                        {f.allocated_budget_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-blue-400">
                        {f.spent_amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {f.remaining_budget_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Commitments */}
      {activeTab === "commitments" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم أمر الارتباط</TableHead>
                <TableHead className="text-right">الصندوق التمويلي</TableHead>
                <TableHead className="text-right">الإدارة الطالبة</TableHead>
                <TableHead className="text-right">بند الموازنة (Line Item)</TableHead>
                <TableHead className="text-right">قيمة طلب الشراء</TableHead>
                <TableHead className="text-right">المبلغ المحجوز (Encumbered)</TableHead>
                <TableHead className="text-right">الحالة الرقابية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCommitmentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredCommitments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد ارتباطات مالية مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommitments.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-blue-400">
                      {c.commitment_ref}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      <span className="font-mono text-emerald-400 ml-1">{c.fund_code}</span> - {c.fund_name}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {c.department}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.line_item}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {c.requisition_amount_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-amber-400">
                      {c.encumbered_amount_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "encumbered" ? "default" : "secondary"}
                        className={
                          c.status === "encumbered"
                            ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        }
                      >
                        {c.status === "encumbered" ? "محجوز بالموازنة (Encumbered)" : "تمت التسوية والصرف"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 3: Aids */}
      {activeTab === "aids" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">الرقم القومي</TableHead>
                <TableHead className="text-right">اسم المستفيد</TableHead>
                <TableHead className="text-right">مؤشر الاستحقاق / الهشاشة</TableHead>
                <TableHead className="text-right">نوع المساعدة</TableHead>
                <TableHead className="text-right">القيمة النقدية / العينية</TableHead>
                <TableHead className="text-right">عدد أفراد الأسرة</TableHead>
                <TableHead className="text-right">التحقق البيومتري (بصمة)</TableHead>
                <TableHead className="text-right">حالة التسليم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAidsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا يوجد سجل مساعدات للمستفيدين
                  </TableCell>
                </TableRow>
              ) : (
                filteredAids.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-purple-400 font-medium">
                      {a.beneficiary_national_id}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {a.full_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          a.vulnerability_score >= 80
                            ? "border-rose-500/30 text-rose-300 bg-rose-500/10"
                            : "border-amber-500/30 text-amber-300"
                        }
                      >
                        درجة {a.vulnerability_score}/100 (أولوية قصوى)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {formatAidType(a.aid_type)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {a.aid_value_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {a.family_members_count} أفراد
                    </TableCell>
                    <TableCell>
                      {a.biometric_verified ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Fingerprint className="h-4 w-4" />
                          <span>بصمة مؤكدة</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">يدوي</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {a.status === "delivered" ? "تم التسليم بنجاح" : a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Tenders */}
      {activeTab === "tenders" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم المناقصة</TableHead>
                <TableHead className="text-right">عنوان المناقصة / الممارسة</TableHead>
                <TableHead className="text-right">الجهة الحكومية الطارحة</TableHead>
                <TableHead className="text-right">القيمة التقديرية (Budget)</TableHead>
                <TableHead className="text-right">خطاب التأمين الابتدائي (Bid Bond)</TableHead>
                <TableHead className="text-right">آخر موعد لتقديم العطاءات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTendersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTenders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد مناقصات عامة مطروحة
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenders.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-amber-400">
                      {t.tender_ref}
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-sm truncate">
                      {t.title}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {t.procuring_entity}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {t.estimated_budget_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {t.bid_bond_amount_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-xs text-rose-400 font-mono">
                      {t.closing_date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      >
                        {t.status === "published" ? "مطروحة لتلقي المظاريف" : t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal: New Fund */}
      {isFundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">تسجيل صندوق تمويلي / منحة جديدة</h2>
              <button
                onClick={() => setIsFundModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFund} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود الصندوق</label>
                  <Input
                    required
                    placeholder="مثال: FND-UN-2026"
                    value={fundForm.fund_code}
                    onChange={(e) => setFundForm({ ...fundForm, fund_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تصنيف الصندوق</label>
                  <select
                    value={fundForm.fund_type}
                    onChange={(e) => setFundForm({ ...fundForm, fund_type: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="temporarily_restricted">مقيد لمشروع محدد (Temporarily Restricted)</option>
                    <option value="permanently_restricted">صندوق وقفي دائم (Endowment Fund)</option>
                    <option value="unrestricted">صندوق عام غير مقيد (Unrestricted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم الصندوق / الغرض التنموي</label>
                <Input
                  required
                  placeholder="مثال: منحة تطوير شبكات الري والمياه بالقرى الأكثر احتياجاً"
                  value={fundForm.fund_name}
                  onChange={(e) => setFundForm({ ...fundForm, fund_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">الجهة المانحة (Donor Organization)</label>
                <Input
                  required
                  placeholder="مثال: البنك الدولي / الاتحاد الأوروبي / وزارة التضامن"
                  value={fundForm.donor_organization}
                  onChange={(e) => setFundForm({ ...fundForm, donor_organization: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الموازنة المعتمدة (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={fundForm.allocated_budget_egp}
                    onChange={(e) => setFundForm({ ...fundForm, allocated_budget_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المنصرف المبدئي (ج.م)</label>
                  <Input
                    type="number"
                    value={fundForm.spent_amount_egp}
                    onChange={(e) => setFundForm({ ...fundForm, spent_amount_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsFundModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  حفظ الصندوق التمويلي
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Commitment */}
      {isCommitmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">قيد ارتباط مالي وحجز موازنة (Encumbrance)</h2>
              <button
                onClick={() => setIsCommitmentModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCommitment} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الصندوق التمويلي المخصوم منه</label>
                  <select
                    value={commitmentForm.fund_id}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, fund_id: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">اختر الصندوق...</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.fund_code} - {f.fund_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم أمر الارتباط</label>
                  <Input
                    required
                    placeholder="مثال: ENC-2026-0044"
                    value={commitmentForm.commitment_ref}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, commitment_ref: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الإدارة الطالبة</label>
                  <Input
                    required
                    placeholder="مثال: قطاع المشروعات الهندسية"
                    value={commitmentForm.department}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">بند الموازنة (Line Item)</label>
                  <Input
                    required
                    placeholder="مثال: شراء محابس ومواسير ضغط عالي"
                    value={commitmentForm.line_item}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, line_item: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مبلغ طلب الشراء (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={commitmentForm.requisition_amount_egp}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, requisition_amount_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المبلغ المحجوز بالدفتر (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={commitmentForm.encumbered_amount_egp}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, encumbered_amount_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsCommitmentModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  حجز الارتباط المالي
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Aid */}
      {isAidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">صرف إعانة لمستفيد (تحقق بيومتري)</h2>
              <button
                onClick={() => setIsAidModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAid} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الرقم القومي (14 رقم)</label>
                  <Input
                    required
                    maxLength={14}
                    placeholder="28001011234567"
                    value={aidForm.beneficiary_national_id}
                    onChange={(e) => setAidForm({ ...aidForm, beneficiary_national_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">اسم المستفيد بالكامل</label>
                  <Input
                    required
                    placeholder="الاسم الرباعي للمستحق"
                    value={aidForm.full_name}
                    onChange={(e) => setAidForm({ ...aidForm, full_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نوع المساعدة</label>
                  <select
                    value={aidForm.aid_type}
                    onChange={(e) => setAidForm({ ...aidForm, aid_type: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="cash_transfer">تحويل نقدي شهري</option>
                    <option value="food_basket">كرتونة مواد غذائية</option>
                    <option value="medical_aid">علاج وأدوية طارئة</option>
                    <option value="shelter_rehab">ترميم سكن ومياه شرب</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مؤشر الهشاشة (0-100)</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={aidForm.vulnerability_score}
                    onChange={(e) => setAidForm({ ...aidForm, vulnerability_score: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">قيمة المساعدة (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={aidForm.aid_value_egp}
                    onChange={(e) => setAidForm({ ...aidForm, aid_value_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">عدد أفراد الأسرة</label>
                  <Input
                    type="number"
                    required
                    value={aidForm.family_members_count}
                    onChange={(e) => setAidForm({ ...aidForm, family_members_count: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="biometric"
                  checked={aidForm.biometric_verified}
                  onChange={(e) => setAidForm({ ...aidForm, biometric_verified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="biometric" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1">
                  <Fingerprint className="h-4 w-4 text-emerald-400" />
                  تم التحقق عبر البصمة البيومترية الحية (Biometric Match Confirmed)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsAidModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  تسجيل وصرف الإعانة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Tender */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">طرح مناقصة عامة جديدة</h2>
              <button
                onClick={() => setIsTenderModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTender} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم المناقصة</label>
                  <Input
                    required
                    placeholder="مثال: TND-2026-0012"
                    value={tenderForm.tender_ref}
                    onChange={(e) => setTenderForm({ ...tenderForm, tender_ref: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الجهة الحكومية الطارحة</label>
                  <Input
                    required
                    placeholder="مثال: الهيئة العامة للطرق والكباري"
                    value={tenderForm.procuring_entity}
                    onChange={(e) => setTenderForm({ ...tenderForm, procuring_entity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">عنوان المناقصة وموضوع التوريد</label>
                <Input
                  required
                  placeholder="مثال: توريد وتركيب شبكات إنارة بالطاقة الشمسية"
                  value={tenderForm.title}
                  onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">القيمة التقديرية (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={tenderForm.estimated_budget_egp}
                    onChange={(e) => setTenderForm({ ...tenderForm, estimated_budget_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">خطاب التأمين الابتدائي (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={tenderForm.bid_bond_amount_egp}
                    onChange={(e) => setTenderForm({ ...tenderForm, bid_bond_amount_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">آخر موعد لتقديم العطاءات والمظاريف</label>
                <Input
                  type="date"
                  required
                  value={tenderForm.closing_date}
                  onChange={(e) => setTenderForm({ ...tenderForm, closing_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsTenderModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  طرح المناقصة ونشر الكراسة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
