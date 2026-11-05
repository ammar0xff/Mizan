import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Building,
  CheckCircle2,
  CreditCard,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Wallet,
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

interface BnkSummary {
  total_accounts_count: number;
  total_deposits_egp: number;
  total_loans_disbursed_egp: number;
  active_loans_count: number;
  open_aml_alerts_count: number;
  capital_adequacy_ratio_pct: number;
}

interface BnkAccount {
  id: string;
  cif_number: string;
  account_number: string;
  customer_name: string;
  account_type: string;
  currency: string;
  ledger_balance_egp: number;
  available_balance_egp: number;
  hold_amount_egp: number;
  interest_rate_pct: number;
  status: string;
  created_at?: string;
}

interface BnkTransaction {
  id: string;
  account_id: string;
  account_number: string;
  customer_name: string;
  txn_ref: string;
  amount_egp: number;
  direction: string;
  channel: string;
  description: string;
  balance_after_egp: number;
  timestamp: string;
}

interface BnkLoan {
  id: string;
  loan_ref: string;
  applicant_name: string;
  applicant_national_id: string;
  loan_type: string;
  principal_amount_egp: number;
  interest_rate_pct: number;
  tenor_months: number;
  monthly_installment_egp: number;
  i_score_rating: number;
  ecl_stage: string;
  status: string;
  created_at?: string;
}

interface BnkAlert {
  id: string;
  account_id: string;
  account_number: string;
  customer_name: string;
  alert_ref: string;
  rule_name: string;
  transaction_amount_egp: number;
  risk_level: string;
  sar_filed: boolean;
  status: string;
  created_at?: string;
}

export default function BankingPage() {
  const [activeTab, setActiveTab] = useState<
    "accounts" | "transactions" | "loans" | "compliance"
  >("accounts");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({
    cif_number: "",
    account_number: "",
    customer_name: "",
    account_type: "current",
    currency: "EGP",
    ledger_balance_egp: 500000,
    available_balance_egp: 500000,
    hold_amount_egp: 0,
    interest_rate_pct: 12.0,
    status: "active",
  });

  const [txnForm, setTxnForm] = useState({
    account_id: "",
    txn_ref: "",
    amount_egp: 50000,
    direction: "credit",
    channel: "ipn_instant",
    description: "",
  });

  const [loanForm, setLoanForm] = useState({
    loan_ref: "",
    applicant_name: "",
    applicant_national_id: "",
    loan_type: "sme_working_capital",
    principal_amount_egp: 1500000,
    interest_rate_pct: 17.5,
    tenor_months: 24,
    monthly_installment_egp: 0,
    i_score_rating: 740,
    ecl_stage: "stage_1_performing",
    status: "approved",
  });

  const [alertForm, setAlertForm] = useState({
    account_id: "",
    alert_ref: "",
    rule_name: "Structuring / Smurfing تقطيع المبالغ النقدية",
    transaction_amount_egp: 250000,
    risk_level: "high",
    sar_filed: false,
    status: "open",
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery<BnkSummary>({
    queryKey: ["bnk-summary"],
    queryFn: () => api.get<BnkSummary>("/bnk/summary"),
  });

  const { data: accounts = [], isLoading: isAccountsLoading, refetch: refetchAccounts } = useQuery<BnkAccount[]>({
    queryKey: ["bnk-accounts"],
    queryFn: () => api.get<BnkAccount[]>("/bnk/accounts"),
  });

  const { data: transactions = [], isLoading: isTransactionsLoading, refetch: refetchTransactions } = useQuery<BnkTransaction[]>({
    queryKey: ["bnk-transactions"],
    queryFn: () => api.get<BnkTransaction[]>("/bnk/transactions"),
  });

  const { data: loans = [], isLoading: isLoansLoading, refetch: refetchLoans } = useQuery<BnkLoan[]>({
    queryKey: ["bnk-loans"],
    queryFn: () => api.get<BnkLoan[]>("/bnk/loans"),
  });

  const { data: alerts = [], isLoading: isAlertsLoading, refetch: refetchAlerts } = useQuery<BnkAlert[]>({
    queryKey: ["bnk-alerts"],
    queryFn: () => api.get<BnkAlert[]>("/bnk/alerts"),
  });

  const refreshAll = () => {
    sound.click();
    refetchSummary();
    refetchAccounts();
    refetchTransactions();
    refetchLoans();
    refetchAlerts();
    toast("success", "تم تحديث سجلات الحسابات المصرفية بنجاح");
  };

  // Handlers
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/bnk/accounts", accountForm);
      toast("success", "تم فتح الحساب المصرفي وإصدار رقم CIF بنجاح");
      setIsAccountModalOpen(false);
      refetchAccounts();
      refetchSummary();
    } catch {
      toast("error", "فشل فتح الحساب المصرفي");
    }
  };

  const handleCreateTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/bnk/transactions", txnForm);
      toast("success", "تم قيد المعاملة اللحظية في دفتر الأستاذ البنكي");
      setIsTxnModalOpen(false);
      refetchTransactions();
      refetchAccounts();
      refetchSummary();
    } catch {
      toast("error", "فشل معالجة المعاملة المالية");
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/bnk/loans", loanForm);
      toast("success", "تم تسجيل التسهيل الائتماني والتقييم الائتماني بنجاح");
      setIsLoanModalOpen(false);
      refetchLoans();
      refetchSummary();
    } catch {
      toast("error", "فشل إنشاء طلب القرض");
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/bnk/alerts", alertForm);
      toast("success", "تم تسجيل إشعار الامتثال ومكافحة غسيل الأموال (AML)");
      setIsAlertModalOpen(false);
      refetchAlerts();
      refetchSummary();
    } catch {
      toast("error", "فشل تسجيل إشعار AML");
    }
  };

  // Filters
  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_number.toLowerCase().includes(search.toLowerCase()) ||
      a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      a.cif_number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      t.txn_ref.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.account_number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLoans = loans.filter(
    (l) =>
      l.loan_ref.toLowerCase().includes(search.toLowerCase()) ||
      l.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      l.loan_type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAlerts = alerts.filter(
    (al) =>
      al.alert_ref.toLowerCase().includes(search.toLowerCase()) ||
      al.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      al.rule_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Landmark className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                الأنظمة المصرفية والمؤسسات المالية (Banking ERP)
              </h1>
              <p className="text-sm text-zinc-400">
                الحسابات الموحدة (CIF)، المقاصة اللحظية (IPN / SWIFT)، محرك الائتمان ومخصصات IFRS 9، والرقابة على غسيل الأموال (AML)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>

          {activeTab === "accounts" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsAccountModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              فتح حساب مصرفي (CIF)
            </Button>
          )}

          {activeTab === "transactions" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (accounts.length > 0) {
                  setTxnForm((prev) => ({ ...prev, account_id: accounts[0].id }));
                }
                setIsTxnModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              قيد معاملة مصرفية
            </Button>
          )}

          {activeTab === "loans" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                setIsLoanModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              طلب تسهيل ائتماني
            </Button>
          )}

          {activeTab === "compliance" && (
            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (accounts.length > 0) {
                  setAlertForm((prev) => ({ ...prev, account_id: accounts[0].id }));
                }
                setIsAlertModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل إشعار AML
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">الحسابات المصرفية</span>
            <Building className="h-4 w-4 text-blue-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {summary?.total_accounts_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">حساب CIF</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">إجمالي الودائع والمدخرات</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <div className="mt-2">
              <div className="font-mono text-xl font-bold text-emerald-400">
                {(summary?.total_deposits_egp ?? 0).toLocaleString()}
              </div>
              <span className="text-xs text-zinc-500">ج.م رصيد دائن</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">محفظة القروض والتسهيلات</span>
            <BadgeDollarSign className="h-4 w-4 text-amber-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <div className="mt-2">
              <div className="font-mono text-xl font-bold text-white">
                {(summary?.total_loans_disbursed_egp ?? 0).toLocaleString()}
              </div>
              <span className="text-xs text-zinc-500">ج.م منصرفة</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">التسهيلات النشطة</span>
            <CreditCard className="h-4 w-4 text-purple-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-purple-400">
                {summary?.active_loans_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">تسهيل معتمد</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">إشعارات الاشتباه (AML)</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-rose-400">
                {summary?.open_aml_alerts_count ?? 0}
              </span>
              <span className="text-xs text-zinc-500">حالة مفتوحة</span>
            </div>
          )}
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">كفاية رأس المال (CAR)</span>
            <ShieldAlert className="h-4 w-4 text-cyan-400" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-cyan-400">
                {summary?.capital_adequacy_ratio_pct ?? 0}%
              </span>
              <span className="text-xs text-zinc-500">بازل III</span>
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              sound.click();
              setActiveTab("accounts");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "accounts"
                ? "bg-blue-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Building className="h-4 w-4" />
            سجل الحسابات المصرفية (CIF)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("transactions");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            دفتر المعاملات اللحظية (IPN/ACH)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("loans");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "loans"
                ? "bg-blue-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <BadgeDollarSign className="h-4 w-4" />
            محفظة القروض والائتمان (I-Score)
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab("compliance");
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === "compliance"
                ? "bg-blue-600 text-white"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
            الامتثال ومكافحة غسيل الأموال (AML)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="بحث وتصفية السجلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-800 bg-zinc-900/60 pr-9 text-sm text-zinc-200 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Tab 1: Bank Accounts */}
      {activeTab === "accounts" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                دليل الحسابات المصرفية الموحدة (Customer CIF)
              </h2>
              <p className="text-xs text-zinc-400">
                الحسابات الجارية وحسابات الشركات والودائع مع احتساب الرصيد الدفتري والمتاح والحجوزات
              </p>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {filteredAccounts.length} حساب مسجل
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم الحساب المصرفي (IBAN)</TableHead>
                  <TableHead className="text-zinc-400">رقم العميل (CIF)</TableHead>
                  <TableHead className="text-zinc-400">اسم العميل والمنشأة</TableHead>
                  <TableHead className="text-zinc-400">نوع الحساب</TableHead>
                  <TableHead className="text-zinc-400">الرصيد الدفتري</TableHead>
                  <TableHead className="text-zinc-400">الرصيد المتاح للسحب</TableHead>
                  <TableHead className="text-zinc-400">المبالغ المجمدة (Hold)</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAccountsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="py-8 text-center text-zinc-500">
                      لا توجد حسابات مصرفية مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((a) => (
                    <TableRow key={a.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {a.account_number}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">{a.cif_number}</TableCell>
                      <TableCell className="font-medium text-white">{a.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          {a.account_type === "corporate_checking"
                            ? "جاري شركات"
                            : a.account_type === "savings"
                            ? "توفير واستثمار"
                            : "جاري أفراد"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-white">
                        {a.ledger_balance_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {a.available_balance_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs text-rose-400">
                        {a.hold_amount_egp > 0 ? `${a.hold_amount_egp.toLocaleString()} ج.م` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {a.status === "active" ? "نشط سارٍ" : a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 2: Transaction Ledger */}
      {activeTab === "transactions" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                دفتر المعاملات المصرفية اللحظية (Core Ledger)
              </h2>
              <p className="text-xs text-zinc-400">
                تسجيل المعاملات عبر شبكة المدفوعات اللحظية (IPN)، غرف المقاصة (ACH)، وتحويلات السويفت (SWIFT)
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              {filteredTransactions.length} معاملة مسجلة
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">رقم الحركة (Txn Ref)</TableHead>
                  <TableHead className="text-zinc-400">الحساب والعميل</TableHead>
                  <TableHead className="text-zinc-400">قناة التنفيذ</TableHead>
                  <TableHead className="text-zinc-400">الوصف والبيان</TableHead>
                  <TableHead className="text-zinc-400">القيمة والاتجاه</TableHead>
                  <TableHead className="text-zinc-400">الرصيد بعد الحركة</TableHead>
                  <TableHead className="text-zinc-400">الوقت والختم الزمني</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTransactionsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                      لا توجد معاملات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {t.txn_ref}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{t.customer_name}</div>
                        <div className="font-mono text-xs text-zinc-500">{t.account_number}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          {t.channel === "ipn_instant"
                            ? "لحظي IPN"
                            : t.channel === "ach_clearing"
                            ? "مقاصة ACH"
                            : t.channel === "swift_wire"
                            ? "سويفت دولي"
                            : "الفرع الرئيسي"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs max-w-xs truncate">{t.description}</TableCell>
                      <TableCell className="font-mono font-bold">
                        {t.direction === "credit" ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ArrowDownLeft className="h-3.5 w-3.5" /> +{t.amount_egp.toLocaleString()} ج.م
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400">
                            <ArrowUpRight className="h-3.5 w-3.5" /> -{t.amount_egp.toLocaleString()} ج.م
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-zinc-300">
                        {t.balance_after_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {t.timestamp}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 3: Loan Origination */}
      {activeTab === "loans" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                محفظة التسهيلات الائتمانية والتمويل (I-Score & Underwriting)
              </h2>
              <p className="text-xs text-zinc-400">
                تقييم الجدارة الائتمانية، احتساب الأقساط وجدول الإهلاك، وتصنيف مراحل خسائر الائتمان (IFRS 9 ECL Stages)
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              {filteredLoans.length} تسهيل معتمد
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">كود التسهيل</TableHead>
                  <TableHead className="text-zinc-400">المقترض</TableHead>
                  <TableHead className="text-zinc-400">نوع التمويل</TableHead>
                  <TableHead className="text-zinc-400">مبلغ القرض الأساسي</TableHead>
                  <TableHead className="text-zinc-400">الفائدة والمدة</TableHead>
                  <TableHead className="text-zinc-400">القسط الشهري</TableHead>
                  <TableHead className="text-zinc-400">تقييم I-Score</TableHead>
                  <TableHead className="text-zinc-400">تصنيف IFRS 9</TableHead>
                  <TableHead className="text-zinc-400">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoansLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLoans.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={9} className="py-8 text-center text-zinc-500">
                      لا توجد قروض مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((l) => (
                    <TableRow key={l.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {l.loan_ref}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{l.applicant_name}</div>
                        <div className="font-mono text-xs text-zinc-500">{l.applicant_national_id}</div>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs">
                        {l.loan_type === "sme_working_capital"
                          ? "رأس مال عامل للشركات"
                          : l.loan_type === "microfinance"
                          ? "تمويل متناهي الصغر"
                          : "تمويل أفراد وقروض شخصية"}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {l.principal_amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {l.interest_rate_pct}% سنوياً ({l.tenor_months} شهر)
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-white">
                        {l.monthly_installment_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 font-mono text-xs">
                          {l.i_score_rating} / 850
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                          {l.ecl_stage === "stage_1_performing"
                            ? "المرحلة 1: أداء ممتاز"
                            : l.ecl_stage === "stage_2_underperforming"
                            ? "المرحلة 2: مراقبة دقيقة"
                            : "المرحلة 3: تعثر"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            l.status === "disbursed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }
                        >
                          {l.status === "disbursed" ? "منصرف ونشط" : "معتمد"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 4: AML & Compliance */}
      {activeTab === "compliance" && (
        <Card className="border-zinc-800/80 bg-zinc-950/60 p-0 overflow-hidden">
          <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                وحدة مكافحة غسيل الأموال وتمويل الإرهاب (AML / CFT Monitoring)
              </h2>
              <p className="text-xs text-zinc-400">
                الكشف الآلي عن تقطيع المعاملات والحركات المشبوهة، التحقق من القوائم المحظورة، وإعداد تقارير الاشتباه (SAR)
              </p>
            </div>
            <Badge variant="outline" className="border-rose-500/30 text-rose-400">
              {filteredAlerts.length} إشعار امتثال
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">كود الإشعار</TableHead>
                  <TableHead className="text-zinc-400">الحساب والعميل</TableHead>
                  <TableHead className="text-zinc-400">القاعدة المفعلة</TableHead>
                  <TableHead className="text-zinc-400">قيمة المعاملة</TableHead>
                  <TableHead className="text-zinc-400">مستوى الخطورة</TableHead>
                  <TableHead className="text-zinc-400">تقرير الاشتباه (SAR)</TableHead>
                  <TableHead className="text-zinc-400">الحالة الرقابية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAlertsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAlerts.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                      لا توجد إشعارات اشتباه حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((al) => (
                    <TableRow key={al.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="font-mono text-xs font-bold text-amber-400">
                        {al.alert_ref}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{al.customer_name}</div>
                        <div className="font-mono text-xs text-zinc-500">{al.account_number}</div>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs font-medium">{al.rule_name}</TableCell>
                      <TableCell className="font-mono font-bold text-rose-400">
                        {al.transaction_amount_egp.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            al.risk_level === "high" || al.risk_level === "critical"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }
                        >
                          {al.risk_level === "high" ? "عالي الخطورة" : "متوسط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {al.sar_filed ? (
                          <span className="flex items-center gap-1 font-mono text-xs text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> تم الرفع لوحدة غسيل الأموال
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">قيد التحقيق الداخلي</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            al.status === "cleared"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }
                        >
                          {al.status === "under_investigation"
                            ? "قيد التحقيق"
                            : al.status === "cleared"
                            ? "تمت التبرئة"
                            : "مفتوح"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Modal: New Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">فتح حساب مصرفي جديد (Customer CIF)</h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم العميل الموحد (CIF)</label>
                  <Input
                    required
                    value={accountForm.cif_number}
                    onChange={(e) => setAccountForm({ ...accountForm, cif_number: e.target.value })}
                    placeholder="مثال: CIF-100990"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">رقم الحساب المصرفي (IBAN)</label>
                  <Input
                    required
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                    placeholder="مثال: EG29000..."
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">اسم العميل أو الكيان المؤسسي</label>
                <Input
                  required
                  value={accountForm.customer_name}
                  onChange={(e) => setAccountForm({ ...accountForm, customer_name: e.target.value })}
                  placeholder="مثال: شركة النيل الدولية للتجارة"
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">نوع الحساب</label>
                  <select
                    value={accountForm.account_type}
                    onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="corporate_checking">جاري شركات ومؤسسات</option>
                    <option value="current">جاري أفراد</option>
                    <option value="savings">توفير واستثمار</option>
                    <option value="time_deposit">وديعة لأجل</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نسبة الفائدة الدائنة (%)</label>
                  <Input
                    type="number"
                    value={accountForm.interest_rate_pct}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        interest_rate_pct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">الرصيد الافتتاحي الدفتري (ج.م)</label>
                  <Input
                    type="number"
                    value={accountForm.ledger_balance_egp}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        ledger_balance_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">مبالغ الحجز والضمانات (Hold)</label>
                  <Input
                    type="number"
                    value={accountForm.hold_amount_egp}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        hold_amount_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  فتح الحساب
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Transaction */}
      {isTxnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">قيد معاملة مصرفية لحظية في دفتر الأستاذ</h3>
              <button
                onClick={() => setIsTxnModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTxn} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400">الحساب المصرفي</label>
                <select
                  value={txnForm.account_id}
                  onChange={(e) => setTxnForm({ ...txnForm, account_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.customer_name} ({a.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">كود المعاملة (Txn Ref)</label>
                  <Input
                    required
                    value={txnForm.txn_ref}
                    onChange={(e) => setTxnForm({ ...txnForm, txn_ref: e.target.value })}
                    placeholder="مثال: TXN-IPN-9024"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">قناة التنفيذ</label>
                  <select
                    value={txnForm.channel}
                    onChange={(e) => setTxnForm({ ...txnForm, channel: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="ipn_instant">شبكة المدفوعات اللحظية IPN</option>
                    <option value="ach_clearing">غرفة المقاصة الآلية ACH</option>
                    <option value="swift_wire">تحويل دولي SWIFT</option>
                    <option value="core_branch">الفرع / كاونتر الصرافة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">المبلغ (ج.م)</label>
                  <Input
                    type="number"
                    value={txnForm.amount_egp}
                    onChange={(e) =>
                      setTxnForm({
                        ...txnForm,
                        amount_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الاتجاه</label>
                  <select
                    value={txnForm.direction}
                    onChange={(e) => setTxnForm({ ...txnForm, direction: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="credit">إيداع / إضافة لحساب العميل (+)</option>
                    <option value="debit">خصم / تحويل من حساب العميل (-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">البيان والوصف</label>
                <Input
                  required
                  value={txnForm.description}
                  onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
                  placeholder="سداد مستحقات تجارية أو تحويل عبر التطبيق..."
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsTxnModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  قيد الحركة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Loan */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">طلب تسهيل ائتماني وقرض جديد</h3>
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLoan} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم التسهيل المرجعي</label>
                  <Input
                    required
                    value={loanForm.loan_ref}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_ref: e.target.value })}
                    placeholder="مثال: LN-SME-2026-0044"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">نوع التمويل</label>
                  <select
                    value={loanForm.loan_type}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="sme_working_capital">تمويل رأس مال عامل للشركات</option>
                    <option value="retail_personal">قرض شخصي نقدي</option>
                    <option value="mortgage">تمويل عقاري</option>
                    <option value="microfinance">تمويل متناهي الصغر</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">اسم المقترض</label>
                  <Input
                    required
                    value={loanForm.applicant_name}
                    onChange={(e) => setLoanForm({ ...loanForm, applicant_name: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الرقم القومي / السجل التجاري</label>
                  <Input
                    required
                    value={loanForm.applicant_national_id}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, applicant_national_id: e.target.value })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">أصل القرض (ج.م)</label>
                  <Input
                    type="number"
                    value={loanForm.principal_amount_egp}
                    onChange={(e) =>
                      setLoanForm({
                        ...loanForm,
                        principal_amount_egp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">الفائدة (%)</label>
                  <Input
                    type="number"
                    value={loanForm.interest_rate_pct}
                    onChange={(e) =>
                      setLoanForm({
                        ...loanForm,
                        interest_rate_pct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">المدة (أشهر)</label>
                  <Input
                    type="number"
                    value={loanForm.tenor_months}
                    onChange={(e) =>
                      setLoanForm({
                        ...loanForm,
                        tenor_months: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">تقييم الجدارة I-Score</label>
                  <Input
                    type="number"
                    value={loanForm.i_score_rating}
                    onChange={(e) =>
                      setLoanForm({
                        ...loanForm,
                        i_score_rating: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">تصنيف مرحلة الخسارة (IFRS 9)</label>
                  <select
                    value={loanForm.ecl_stage}
                    onChange={(e) => setLoanForm({ ...loanForm, ecl_stage: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="stage_1_performing">المرحلة 1: أداء سليم (Performing)</option>
                    <option value="stage_2_underperforming">المرحلة 2: ارتفاع مخاطر (Underperforming)</option>
                    <option value="stage_3_impaired">المرحلة 3: تعثر ومخصص (Impaired)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsLoanModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  اعتماد وصرف القرض
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New AML Alert */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">تسجيل إشعار اشتباه رقابي (AML Alert)</h3>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAlert} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400">الحساب الخاضع للاشتباه</label>
                <select
                  value={alertForm.account_id}
                  onChange={(e) => setAlertForm({ ...alertForm, account_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.customer_name} ({a.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">رقم الإشعار المرجعي</label>
                  <Input
                    required
                    value={alertForm.alert_ref}
                    onChange={(e) => setAlertForm({ ...alertForm, alert_ref: e.target.value })}
                    placeholder="مثال: AML-2026-904"
                    className="mt-1 border-zinc-700 bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">مستوى الخطورة</label>
                  <select
                    value={alertForm.risk_level}
                    onChange={(e) => setAlertForm({ ...alertForm, risk_level: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="high">مرتفع (High)</option>
                    <option value="critical">حرج جداً (Critical)</option>
                    <option value="medium">متوسط (Medium)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">القاعدة المفعلة / نمط المعاملة المشبوهة</label>
                <Input
                  required
                  value={alertForm.rule_name}
                  onChange={(e) => setAlertForm({ ...alertForm, rule_name: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">مبلغ المعاملة محل الفحص (ج.م)</label>
                <Input
                  type="number"
                  value={alertForm.transaction_amount_egp}
                  onChange={(e) =>
                    setAlertForm({
                      ...alertForm,
                      transaction_amount_egp: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1 border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setIsAlertModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                  تسجيل الإشعار
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
