import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  FileCheck,
  FileText,
  HandCoins,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
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

interface InsSummary {
  active_policies_count: number;
  total_gross_written_premium_egp: number;
  total_claims_paid_egp: number;
  open_claims_count: number;
  claims_loss_ratio_pct: number;
  reinsurance_treaties_count: number;
}

interface InsPolicy {
  id: string;
  policy_number: string;
  line_of_business: string;
  policyholder_name: string;
  sum_insured_egp: number;
  annual_premium_egp: number;
  deductible_egp: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
}

interface InsClaim {
  id: string;
  policy_id: string;
  policy_number: string;
  line_of_business: string;
  claim_ref: string;
  claimant_name: string;
  loss_date: string;
  reported_date: string;
  estimated_loss_egp: number;
  approved_amount_egp: number;
  surveyor_name: string;
  status: string;
  created_at?: string;
}

interface InsSurvey {
  id: string;
  claim_id: string;
  claim_ref: string;
  survey_ref: string;
  surveyor_name: string;
  inspected_item: string;
  damage_description: string;
  estimated_repair_egp: number;
  subrogation_recommended: boolean;
  survey_date: string;
}

interface InsTreaty {
  id: string;
  treaty_code: string;
  reinsurer_name: string;
  treaty_type: string;
  retention_limit_egp: number;
  cession_percentage: number;
  status: string;
  created_at?: string;
}

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<
    "policies" | "claims" | "surveys" | "treaties"
  >("policies");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isTreatyModalOpen, setIsTreatyModalOpen] = useState(false);

  // Form states
  const [policyForm, setPolicyForm] = useState({
    policy_number: "",
    line_of_business: "motor_comprehensive",
    policyholder_name: "",
    sum_insured_egp: 1000000,
    annual_premium_egp: 25000,
    deductible_egp: 2000,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 365 * 24 * 3600 * 1000)
      .toISOString()
      .split("T")[0],
    status: "active",
  });

  const [claimForm, setClaimForm] = useState({
    policy_id: "",
    claim_ref: "",
    claimant_name: "",
    loss_date: new Date().toISOString().split("T")[0],
    reported_date: new Date().toISOString().split("T")[0],
    estimated_loss_egp: 50000,
    approved_amount_egp: 0,
    surveyor_name: "",
    status: "reported",
  });

  const [surveyForm, setSurveyForm] = useState({
    claim_id: "",
    survey_ref: "",
    surveyor_name: "",
    inspected_item: "",
    damage_description: "",
    estimated_repair_egp: 45000,
    subrogation_recommended: false,
    survey_date: new Date().toISOString().split("T")[0],
  });

  const [treatyForm, setTreatyForm] = useState({
    treaty_code: "",
    reinsurer_name: "",
    treaty_type: "quota_share",
    retention_limit_egp: 5000000,
    cession_percentage: 50,
    status: "active",
  });

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<InsSummary>({
    queryKey: ["ins-summary"],
    queryFn: () => api.get<InsSummary>("/ins/summary"),
  });

  const {
    data: policies = [],
    isLoading: isPoliciesLoading,
    refetch: refetchPolicies,
  } = useQuery<InsPolicy[]>({
    queryKey: ["ins-policies"],
    queryFn: () => api.get<InsPolicy[]>("/ins/policies"),
  });

  const {
    data: claims = [],
    isLoading: isClaimsLoading,
    refetch: refetchClaims,
  } = useQuery<InsClaim[]>({
    queryKey: ["ins-claims"],
    queryFn: () => api.get<InsClaim[]>("/ins/claims"),
  });

  const {
    data: surveys = [],
    isLoading: isSurveysLoading,
    refetch: refetchSurveys,
  } = useQuery<InsSurvey[]>({
    queryKey: ["ins-surveys"],
    queryFn: () => api.get<InsSurvey[]>("/ins/surveys"),
  });

  const {
    data: treaties = [],
    isLoading: isTreatiesLoading,
    refetch: refetchTreaties,
  } = useQuery<InsTreaty[]>({
    queryKey: ["ins-treaties"],
    queryFn: () => api.get<InsTreaty[]>("/ins/treaties"),
  });

  const handleRefresh = () => {
    sound.click();
    refetchSummary();
    refetchPolicies();
    refetchClaims();
    refetchSurveys();
    refetchTreaties();
    toast("success", "تم تحديث بيانات التأمين وإعادة التأمين");
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ins/policies", policyForm);
      toast("success", "تم إصدار وثيقة التأمين بنجاح");
      setIsPolicyModalOpen(false);
      refetchPolicies();
      refetchSummary();
      setPolicyForm({
        policy_number: "",
        line_of_business: "motor_comprehensive",
        policyholder_name: "",
        sum_insured_egp: 1000000,
        annual_premium_egp: 25000,
        deductible_egp: 2000,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 365 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0],
        status: "active",
      });
    } catch {
      toast("error", "فشل إصدار الوثيقة");
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ins/claims", claimForm);
      toast("success", "تم تسجيل إخطار المطالبة بنجاح");
      setIsClaimModalOpen(false);
      refetchClaims();
      refetchSummary();
      setClaimForm({
        policy_id: "",
        claim_ref: "",
        claimant_name: "",
        loss_date: new Date().toISOString().split("T")[0],
        reported_date: new Date().toISOString().split("T")[0],
        estimated_loss_egp: 50000,
        approved_amount_egp: 0,
        surveyor_name: "",
        status: "reported",
      });
    } catch {
      toast("error", "فشل تسجيل إخطار المطالبة");
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ins/surveys", surveyForm);
      toast("success", "تم تسجيل تقرير المعاينة الفنية بنجاح");
      setIsSurveyModalOpen(false);
      refetchSurveys();
      setSurveyForm({
        claim_id: "",
        survey_ref: "",
        surveyor_name: "",
        inspected_item: "",
        damage_description: "",
        estimated_repair_egp: 45000,
        subrogation_recommended: false,
        survey_date: new Date().toISOString().split("T")[0],
      });
    } catch {
      toast("error", "فشل تسجيل تقرير المعاينة");
    }
  };

  const handleCreateTreaty = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/ins/treaties", treatyForm);
      toast("success", "تم إبرام اتفاقية إعادة التأمين بنجاح");
      setIsTreatyModalOpen(false);
      refetchTreaties();
      refetchSummary();
      setTreatyForm({
        treaty_code: "",
        reinsurer_name: "",
        treaty_type: "quota_share",
        retention_limit_egp: 5000000,
        cession_percentage: 50,
        status: "active",
      });
    } catch {
      toast("error", "فشل إبرام اتفاقية إعادة التأمين");
    }
  };

  // Filters
  const filteredPolicies = policies.filter(
    (p) =>
      p.policy_number.toLowerCase().includes(search.toLowerCase()) ||
      p.policyholder_name.toLowerCase().includes(search.toLowerCase()) ||
      p.line_of_business.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClaims = claims.filter(
    (c) =>
      c.claim_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.claimant_name.toLowerCase().includes(search.toLowerCase()) ||
      c.policy_number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSurveys = surveys.filter(
    (s) =>
      s.survey_ref.toLowerCase().includes(search.toLowerCase()) ||
      s.surveyor_name.toLowerCase().includes(search.toLowerCase()) ||
      s.inspected_item.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTreaties = treaties.filter(
    (t) =>
      t.treaty_code.toLowerCase().includes(search.toLowerCase()) ||
      t.reinsurer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.treaty_type.toLowerCase().includes(search.toLowerCase())
  );

  const formatLineOfBusiness = (lob: string) => {
    switch (lob) {
      case "motor_comprehensive":
        return "تأمين سيارات شامل";
      case "property_fire":
        return "حريق وأخطار متحالفة (Property)";
      case "marine_cargo":
        return "نقل بحري وبضائع (Marine)";
      case "medical_health":
        return "تأمين طبي ورعاية صحية";
      case "engineering_car":
        return "مخاطر مقاولين وهندسي (CAR/EAR)";
      default:
        return lob;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                إدارة التأمين وإعادة التأمين (Insurance & Reinsurance)
              </h1>
              <p className="text-sm text-muted-foreground">
                محفظة وثائق التأمين، دورة حياة تسوية المطالبات، تقارير المعاينات الفنية، واتفاقيات إعادة التأمين (IFRS 17)
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
          {activeTab === "policies" && (
            <Button
              onClick={() => {
                sound.click();
                setIsPolicyModalOpen(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إصدار وثيقة تأمين
            </Button>
          )}
          {activeTab === "claims" && (
            <Button
              onClick={() => {
                sound.click();
                if (policies.length > 0 && !claimForm.policy_id) {
                  setClaimForm((prev) => ({ ...prev, policy_id: policies[0].id }));
                }
                setIsClaimModalOpen(true);
              }}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Plus className="h-4 w-4" />
              تسجيل إخطار مطالبة (FNOL)
            </Button>
          )}
          {activeTab === "surveys" && (
            <Button
              onClick={() => {
                sound.click();
                if (claims.length > 0 && !surveyForm.claim_id) {
                  setSurveyForm((prev) => ({ ...prev, claim_id: claims[0].id }));
                }
                setIsSurveyModalOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة تقرير معاينة فنية
            </Button>
          )}
          {activeTab === "treaties" && (
            <Button
              onClick={() => {
                sound.click();
                setIsTreatyModalOpen(true);
              }}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" />
              إبرام اتفاقية إعادة تأمين
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              الأقساط المكتتبة (GWP)
            </span>
            <HandCoins className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.total_gross_written_premium_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            إجمالي دخل الأقساط السنوية
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              الوثائق السارية
            </span>
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.active_policies_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            تغطيات تأمينية نشطة
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              التعويضات المسددة
            </span>
            <FileCheck className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${(summary?.total_claims_paid_egp ?? 0).toLocaleString()} ج.م`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            مطالبات تم تسويتها وصرفها
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              معدل الخسارة (Loss Ratio)
            </span>
            <Percent className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              `${summary?.claims_loss_ratio_pct ?? 0}%`
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            نسبة التعويضات إلى الأقساط
          </span>
        </Card>

        <Card className="p-4 border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              اتفاقيات إعادة التأمين
            </span>
            <ShieldAlert className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.reinsurance_treaties_count ?? 0).toLocaleString()
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            اتفاقيات سارية (معيدو التأمين)
          </span>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              sound.click();
              setActiveTab("policies");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "policies"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            وثائق التأمين (Policies)
            <Badge variant="outline" className="mr-1 text-xs">
              {policies.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("claims");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "claims"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            المطالبات والحوادث (Claims)
            <Badge variant="outline" className="mr-1 text-xs">
              {claims.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("surveys");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "surveys"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            المعاينات وتقدير الأضرار (Surveys)
            <Badge variant="outline" className="mr-1 text-xs">
              {surveys.length}
            </Badge>
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab("treaties");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "treaties"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            اتفاقيات إعادة التأمين (Treaties)
            <Badge variant="outline" className="mr-1 text-xs">
              {treaties.length}
            </Badge>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالرقم، العميل، أو المعاينة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Tab 1: Policies */}
      {activeTab === "policies" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم الوثيقة</TableHead>
                <TableHead className="text-right">حامل الوثيقة (المؤمن له)</TableHead>
                <TableHead className="text-right">فرع التأمين (LOB)</TableHead>
                <TableHead className="text-right">مبلغ التأمين (Sum Insured)</TableHead>
                <TableHead className="text-right">القسط السنوي</TableHead>
                <TableHead className="text-right">التحمل (Deductible)</TableHead>
                <TableHead className="text-right">فترة السريان</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPoliciesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد وثائق تأمين مسجلة تطابق البحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredPolicies.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-blue-400">
                      {p.policy_number}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {p.policyholder_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border/60">
                        {formatLineOfBusiness(p.line_of_business)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {p.sum_insured_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {p.annual_premium_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {p.deductible_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {p.start_date} إلى {p.end_date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "active" ? "default" : "secondary"}
                        className={p.status === "active" ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : ""}
                      >
                        {p.status === "active" ? "سارية ومنتظمة" : p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 2: Claims */}
      {activeTab === "claims" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم المطالبة</TableHead>
                <TableHead className="text-right">رقم الوثيقة التابعة</TableHead>
                <TableHead className="text-right">المطالِب / المستفيد</TableHead>
                <TableHead className="text-right">تاريخ الحادث / الإخطار</TableHead>
                <TableHead className="text-right">الخسارة التقديرية</TableHead>
                <TableHead className="text-right">التعويض المعتمد</TableHead>
                <TableHead className="text-right">الخبير المعاين</TableHead>
                <TableHead className="text-right">حالة المطالبة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClaimsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد إخطارات حوادث أو مطالبات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-rose-400">
                      {c.claim_ref}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {c.policy_number}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {c.claimant_name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      حادث: {c.loss_date} | إخطار: {c.reported_date}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {c.estimated_loss_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {c.approved_amount_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.surveyor_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "settled"
                            ? "default"
                            : c.status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          c.status === "settled"
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                            : c.status === "under_survey"
                            ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                            : ""
                        }
                      >
                        {c.status === "settled"
                          ? "تمت التسوية والصرف"
                          : c.status === "reported"
                          ? "إخطار جديد (FNOL)"
                          : c.status === "under_survey"
                          ? "قيد المعاينة وتقدير الخسائر"
                          : c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 3: Surveys */}
      {activeTab === "surveys" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">رقم المعاينة</TableHead>
                <TableHead className="text-right">المطالبة المرتبطة</TableHead>
                <TableHead className="text-right">خبير المعاينة وتقدير الأضرار</TableHead>
                <TableHead className="text-right">العنصر المعاين</TableHead>
                <TableHead className="text-right">وصف الأضرار والتلفيات</TableHead>
                <TableHead className="text-right">تقدير تكلفة الإصلاح</TableHead>
                <TableHead className="text-right">تاريخ المعاينة</TableHead>
                <TableHead className="text-right">حق الرجوع (Subrogation)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSurveysLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredSurveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد تقارير معاينات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredSurveys.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-amber-400">
                      {s.survey_ref}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-rose-400">
                      {s.claim_ref}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {s.surveyor_name}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {s.inspected_item}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {s.damage_description}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {s.estimated_repair_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {s.survey_date}
                    </TableCell>
                    <TableCell>
                      {s.subrogation_recommended ? (
                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">
                          يوصى بالرجوع على المتسبب
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          لا يوجد طرف ثالث
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Treaties */}
      {activeTab === "treaties" && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">كود الاتفاقية</TableHead>
                <TableHead className="text-right">معيد التأمين (Reinsurer)</TableHead>
                <TableHead className="text-right">نوع الاتفاقية</TableHead>
                <TableHead className="text-right">حد الاحتفاظ (Retention Limit)</TableHead>
                <TableHead className="text-right">نسبة التنازل (Cession %)</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTreatiesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTreaties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد اتفاقيات إعادة تأمين مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredTreaties.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-indigo-400">
                      {t.treaty_code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {t.reinsurer_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
                        {t.treaty_type === "quota_share"
                          ? "مشاركة نسبية (Quota Share)"
                          : t.treaty_type === "excess_of_loss"
                          ? "تجاوز الخسارة (Excess of Loss)"
                          : t.treaty_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-400">
                      {t.retention_limit_egp.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="font-mono text-foreground font-bold">
                      {t.cession_percentage}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {t.status === "active" ? "سارية وملزمة" : t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal: New Policy */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">إصدار وثيقة تأمين جديدة</h2>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePolicy} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم الوثيقة</label>
                  <Input
                    required
                    placeholder="مثال: POL-2026-MTR-099"
                    value={policyForm.policy_number}
                    onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">فرع التأمين (LOB)</label>
                  <select
                    value={policyForm.line_of_business}
                    onChange={(e) => setPolicyForm({ ...policyForm, line_of_business: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="motor_comprehensive">تأمين سيارات شامل</option>
                    <option value="property_fire">حريق وأخطار ممتلكات</option>
                    <option value="marine_cargo">نقل بحري وبضائع</option>
                    <option value="medical_health">تأمين طبي ورعاية صحية</option>
                    <option value="engineering_car">مخاطر مقاولين وهندسي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم حامل الوثيقة (المؤمن له)</label>
                <Input
                  required
                  placeholder="اسم الشركة أو العميل بالكامل"
                  value={policyForm.policyholder_name}
                  onChange={(e) => setPolicyForm({ ...policyForm, policyholder_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مبلغ التأمين (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={policyForm.sum_insured_egp}
                    onChange={(e) => setPolicyForm({ ...policyForm, sum_insured_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">القسط السنوي (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={policyForm.annual_premium_egp}
                    onChange={(e) => setPolicyForm({ ...policyForm, annual_premium_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">مبلغ التحمل (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={policyForm.deductible_egp}
                    onChange={(e) => setPolicyForm({ ...policyForm, deductible_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ بداية السريان</label>
                  <Input
                    type="date"
                    required
                    value={policyForm.start_date}
                    onChange={(e) => setPolicyForm({ ...policyForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ انتهاء السريان</label>
                  <Input
                    type="date"
                    required
                    value={policyForm.end_date}
                    onChange={(e) => setPolicyForm({ ...policyForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsPolicyModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  حفظ وإصدار الوثيقة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Claim */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">تسجيل إخطار مطالبة تعويض (FNOL)</h2>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClaim} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الوثيقة المؤمن عليها</label>
                  <select
                    value={claimForm.policy_id}
                    onChange={(e) => setClaimForm({ ...claimForm, policy_id: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">اختر الوثيقة...</option>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.policy_number} - {p.policyholder_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم المطالبة</label>
                  <Input
                    required
                    placeholder="مثال: CLM-2026-0089"
                    value={claimForm.claim_ref}
                    onChange={(e) => setClaimForm({ ...claimForm, claim_ref: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">اسم صاحب الإخطار / المطالب</label>
                <Input
                  required
                  placeholder="الاسم الثلاثي أو صفة المستفيد"
                  value={claimForm.claimant_name}
                  onChange={(e) => setClaimForm({ ...claimForm, claimant_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ وقوع الحادث</label>
                  <Input
                    type="date"
                    required
                    value={claimForm.loss_date}
                    onChange={(e) => setClaimForm({ ...claimForm, loss_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ إبلاغ الشركة</label>
                  <Input
                    type="date"
                    required
                    value={claimForm.reported_date}
                    onChange={(e) => setClaimForm({ ...claimForm, reported_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الخسارة التقديرية (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={claimForm.estimated_loss_egp}
                    onChange={(e) => setClaimForm({ ...claimForm, estimated_loss_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">التعويض المعتمد (ج.م)</label>
                  <Input
                    type="number"
                    value={claimForm.approved_amount_egp}
                    onChange={(e) => setClaimForm({ ...claimForm, approved_amount_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">خبير المعاينة المكلف</label>
                <Input
                  required
                  placeholder="اسم المهندس أو الخبير الاستشاري"
                  value={claimForm.surveyor_name}
                  onChange={(e) => setClaimForm({ ...claimForm, surveyor_name: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsClaimModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                  حفظ وتسجيل المطالبة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Survey */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">تسجيل تقرير معاينة فنية</h2>
              <button
                onClick={() => setIsSurveyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSurvey} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">المطالبة المرتبطة</label>
                  <select
                    value={surveyForm.claim_id}
                    onChange={(e) => setSurveyForm({ ...surveyForm, claim_id: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">اختر المطالبة...</option>
                    {claims.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.claim_ref} - {c.claimant_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">رقم تقرير المعاينة</label>
                  <Input
                    required
                    placeholder="مثال: SRV-2026-0104"
                    value={surveyForm.survey_ref}
                    onChange={(e) => setSurveyForm({ ...surveyForm, survey_ref: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">الخبير المعاين</label>
                  <Input
                    required
                    placeholder="اسم المهندس المعاين"
                    value={surveyForm.surveyor_name}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyor_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تاريخ المعاينة</label>
                  <Input
                    type="date"
                    required
                    value={surveyForm.survey_date}
                    onChange={(e) => setSurveyForm({ ...surveyForm, survey_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">العنصر المعاين</label>
                <Input
                  required
                  placeholder="مثال: سيارة مرسيدس / ماكينة خط تعبئة / مستودع بضائع"
                  value={surveyForm.inspected_item}
                  onChange={(e) => setSurveyForm({ ...surveyForm, inspected_item: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">توصيف الأضرار والتلفيات</label>
                <textarea
                  required
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="تفاصيل التلف المباشر والقطع المتضررة وأسباب الحادث..."
                  value={surveyForm.damage_description}
                  onChange={(e) => setSurveyForm({ ...surveyForm, damage_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">تكلفة الإصلاح التقديرية (ج.م)</label>
                  <Input
                    type="number"
                    required
                    value={surveyForm.estimated_repair_egp}
                    onChange={(e) => setSurveyForm({ ...surveyForm, estimated_repair_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="subrogation"
                    checked={surveyForm.subrogation_recommended}
                    onChange={(e) => setSurveyForm({ ...surveyForm, subrogation_recommended: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="subrogation" className="text-sm font-medium text-foreground cursor-pointer">
                    يوصى بالرجوع على طرف ثالث (Subrogation)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsSurveyModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  حفظ تقرير المعاينة
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: New Treaty */}
      {isTreatyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl p-6 border-border bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">إبرام اتفاقية إعادة تأمين جديدة</h2>
              <button
                onClick={() => setIsTreatyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTreaty} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">كود الاتفاقية</label>
                  <Input
                    required
                    placeholder="مثال: TRT-2026-MTR-QS"
                    value={treatyForm.treaty_code}
                    onChange={(e) => setTreatyForm({ ...treatyForm, treaty_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نوع الاتفاقية</label>
                  <select
                    value={treatyForm.treaty_type}
                    onChange={(e) => setTreatyForm({ ...treatyForm, treaty_type: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="quota_share">مشاركة نسبية (Quota Share)</option>
                    <option value="excess_of_loss">تجاوز الخسارة (Excess of Loss)</option>
                    <option value="surplus">فائض (Surplus Treaty)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">شركة إعادة التأمين (Reinsurer)</label>
                <Input
                  required
                  placeholder="مثال: سويس ري (Swiss Re) أو ميونخ ري (Munich Re)"
                  value={treatyForm.reinsurer_name}
                  onChange={(e) => setTreatyForm({ ...treatyForm, reinsurer_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">حد الاحتفاظ (Retention Limit EGP)</label>
                  <Input
                    type="number"
                    required
                    value={treatyForm.retention_limit_egp}
                    onChange={(e) => setTreatyForm({ ...treatyForm, retention_limit_egp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">نسبة التنازل المئوية (% Cession)</label>
                  <Input
                    type="number"
                    required
                    value={treatyForm.cession_percentage}
                    onChange={(e) => setTreatyForm({ ...treatyForm, cession_percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsTreatyModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  تفعيل وإبرام الاتفاقية
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
