import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  BarChart,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Palette,
  Plus,
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

interface AgencySummary {
  active_projects_count: number;
  total_projects_count: number;
  pipeline_contract_value: number;
  team_members_count: number;
  team_utilization_percent: number;
  scope_creep_alerts_count: number;
  translation_orders_count: number;
}

interface AgencyProject {
  id: string;
  project_code: string;
  client_name: string;
  project_title: string;
  service_category: string;
  contract_value: number;
  deadline: string;
  total_milestones: number;
  completed_milestones: number;
  status: "in_production" | "client_review" | "delivered" | "closed";
  brief_notes: string;
}

interface AgencyCapacityMember {
  id: string;
  member_name: string;
  role_title: string;
  weekly_capacity_hours: number;
  booked_hours: number;
  utilization_percent: number;
  status: "available" | "optimal" | "overloaded";
}

interface AgencyRetainer {
  id: string;
  client_name: string;
  retainer_tier: string;
  contracted_hours: number;
  burned_hours: number;
  utilization_percent: number;
  scope_creep_alert: boolean;
  overage_hourly_rate: number;
  renewal_date: string;
}

interface AgencyTranslationOrder {
  id: string;
  doc_title: string;
  client_name: string;
  source_language: string;
  target_language: string;
  total_words: number;
  repeated_words_discount: number;
  net_billable_words: number;
  rate_per_word: number;
  total_amount: number;
  status: "translating" | "proofreading" | "certified_stamped";
}

export default function CreativeAgencyPage() {
  const [activeTab, setActiveTab] = useState<"projects" | "capacity" | "retainers" | "translations">("projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [isNewRetainerOpen, setIsNewRetainerOpen] = useState(false);
  const [isNewTranslationOpen, setIsNewTranslationOpen] = useState(false);
  const [burnTargetRetainer, setBurnTargetRetainer] = useState<AgencyRetainer | null>(null);
  const [burnHoursInput, setBurnHoursInput] = useState(5.0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<AgencySummary>({
    queryKey: ["agencySummary"],
    queryFn: () => api.get<AgencySummary>("/agency/summary"),
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<AgencyProject[]>({
    queryKey: ["agencyProjects"],
    queryFn: () => api.get<AgencyProject[]>("/agency/projects"),
  });

  const { data: capacityMembers = [], isLoading: isCapacityLoading } = useQuery<AgencyCapacityMember[]>({
    queryKey: ["agencyCapacityMembers"],
    queryFn: () => api.get<AgencyCapacityMember[]>("/agency/capacity"),
  });

  const { data: retainers = [], isLoading: isRetainersLoading } = useQuery<AgencyRetainer[]>({
    queryKey: ["agencyRetainers"],
    queryFn: () => api.get<AgencyRetainer[]>("/agency/retainers"),
  });

  const { data: translations = [], isLoading: isTranslationsLoading } = useQuery<AgencyTranslationOrder[]>({
    queryKey: ["agencyTranslations"],
    queryFn: () => api.get<AgencyTranslationOrder[]>("/agency/translations"),
  });

  // Forms State
  const [newProject, setNewProject] = useState({
    project_code: "PRJ-MKT-2026",
    client_name: "",
    project_title: "إطلاق الهوية البصرية والحملة الإعلانية الرقمية",
    service_category: "هوية بصرية وإعلان",
    contract_value: 120000,
    deadline: "2026-12-15",
    total_milestones: 4,
    brief_notes: "تصميم الشعار، دليل الهوية Brand Guidelines، وتجهيز 12 فيديو موشن جرافيك لمنصات التواصل",
  });

  const [newMember, setNewMember] = useState({
    member_name: "",
    role_title: "مخرج فني أول (Senior Art Director)",
    weekly_capacity_hours: 40.0,
    booked_hours: 32.0,
  });

  const [newRetainer, setNewRetainer] = useState({
    client_name: "",
    retainer_tier: "باقة إدارة تسويق رقمي ومحتوى (Tier A - 80h)",
    contracted_hours: 80.0,
    overage_hourly_rate: 850.0,
    renewal_date: "2026-12-01",
  });

  const [newTranslation, setNewTranslation] = useState({
    doc_title: "عقود توريد وبروتوكول شراكة دولية معتمد",
    client_name: "",
    source_language: "الإنجليزية",
    target_language: "العربية",
    total_words: 4500,
    repeated_words_discount: 500,
    rate_per_word: 0.65,
  });

  // Handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agency/projects", newProject);
      queryClient.invalidateQueries({ queryKey: ["agencyProjects"] });
      queryClient.invalidateQueries({ queryKey: ["agencySummary"] });
      setIsNewProjectOpen(false);
      toast("success", "تم إدراج المشروع الإبداعي في خطة الإنتاج بنجاح");
    } catch {
      toast("error", "تعذر إنشاء المشروع");
    }
  };

  const handleAdvanceMilestone = async (projectId: string) => {
    sound.click();
    try {
      await api.post(`/agency/projects/${projectId}/advance-milestone`);
      queryClient.invalidateQueries({ queryKey: ["agencyProjects"] });
      queryClient.invalidateQueries({ queryKey: ["agencySummary"] });
      toast("success", "تم ترقية إنجاز المشروع واعتماد المرحلة المسلمة");
    } catch {
      toast("error", "تعذر تحديث مرحلة المشروع");
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agency/capacity", newMember);
      queryClient.invalidateQueries({ queryKey: ["agencyCapacityMembers"] });
      queryClient.invalidateQueries({ queryKey: ["agencySummary"] });
      setIsNewMemberOpen(false);
      toast("success", "تم إدراج الموظف في لوحة القدرة الاستيعابية");
    } catch {
      toast("error", "تعذر تسجيل العضو");
    }
  };

  const handleCreateRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agency/retainers", newRetainer);
      queryClient.invalidateQueries({ queryKey: ["agencyRetainers"] });
      queryClient.invalidateQueries({ queryKey: ["agencySummary"] });
      setIsNewRetainerOpen(false);
      toast("success", "تم ربط ساعات Retainer للعميل بنجاح");
    } catch {
      toast("error", "تعذر تسجيل Retainer");
    }
  };

  const handleBurnHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!burnTargetRetainer) return;
    sound.click();
    try {
      await api.post(`/agency/retainers/${burnTargetRetainer.id}/burn`, { hours: burnHoursInput });
      queryClient.invalidateQueries({ queryKey: ["agencyRetainers"] });
      queryClient.invalidateQueries({ queryKey: ["agencySummary"] });
      setBurnTargetRetainer(null);
      toast("success", `تم خصم ${burnHoursInput} ساعة من رصيد العميل`);
    } catch {
      toast("error", "تعذر تسجيل الساعات");
    }
  };

  const handleCreateTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/agency/translations", newTranslation);
      queryClient.invalidateQueries({ queryKey: ["agencyTranslations"] });
      queryClient.invalidateQueries({ queryKey: ["agencySummary"] });
      setIsNewTranslationOpen(false);
      toast("success", "تم احتساب الكلمات الصافية وتسجيل أمر الترجمة بنجاح");
    } catch {
      toast("error", "تعذر تسجيل أمر الترجمة");
    }
  };

  const handleCertifyTranslation = async (orderId: string) => {
    sound.click();
    try {
      await api.post(`/agency/translations/${orderId}/certify`);
      queryClient.invalidateQueries({ queryKey: ["agencyTranslations"] });
      toast("success", "تم اعتماد الوثيقة بالختم المعتمد وترقيتها للملف النهائي");
    } catch {
      toast("error", "تعذر اعتماد الترجمة");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-7 w-7 text-brand" />
            وكالة الدعاية والإعلام والترجمة المعتمدة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة المشروعات الإبداعية ومراحل التسليم، قياس إشغال الفريق وساعات Retainer، وحساب الكلمات والترجمة المعتمدة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "projects" && (
            <Button onClick={() => setIsNewProjectOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              مشروع إبداعي جديد
            </Button>
          )}
          {activeTab === "capacity" && (
            <Button onClick={() => setIsNewMemberOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة عضو للوحة الفريق
            </Button>
          )}
          {activeTab === "retainers" && (
            <Button onClick={() => setIsNewRetainerOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل عقد شهري (Retainer)
            </Button>
          )}
          {activeTab === "translations" && (
            <Button onClick={() => setIsNewTranslationOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              أمر ترجمة معتمدة جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Briefcase className="h-4 w-4 text-brand" />
            المشروعات النشطة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold">{summary?.active_projects_count || 0}</div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            قيمة العقود قيد التنفيذ
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-xl font-mono font-bold text-emerald-500">
              {(summary?.pipeline_contract_value || 0).toLocaleString()} <span className="text-xs">ج.م</span>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Users className="h-4 w-4 text-sky-500" />
            فريق الإنتاج الإبداعي
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-sky-500">
              {summary?.team_members_count || 0} أفراد
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <BarChart className="h-4 w-4 text-violet-500" />
            متوسط إشغال الفريق
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-violet-500">
              {summary?.team_utilization_percent || 0}%
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            تجاوز ساعات Retainer (&gt;80%)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-red-500">
              {summary?.scope_creep_alerts_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Award className="h-4 w-4 text-teal-500" />
            أوامر الترجمة المعتمدة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-teal-500">
              {summary?.translation_orders_count || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "projects" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("projects")}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            المشروعات ومراحل التسليم
          </Button>
          <Button
            variant={activeTab === "capacity" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("capacity")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            لوحة إشغال الفريق (Heatmap)
          </Button>
          <Button
            variant={activeTab === "retainers" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("retainers")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            ساعات العقود الشهرية (Retainers)
          </Button>
          <Button
            variant={activeTab === "translations" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("translations")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            أوامر الترجمة المعتمدة
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود، العميل، المشروع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Projects */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">كود المشروع</TableHead>
                  <TableHead className="text-right">العميل وعنوان العمل</TableHead>
                  <TableHead className="text-right">مجال الخدمة</TableHead>
                  <TableHead className="text-right">قيمة التعاقد</TableHead>
                  <TableHead className="text-right">موعد التسليم النهائي</TableHead>
                  <TableHead className="text-right">مراحل التسليم (Milestones)</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراء التسليم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isProjectsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد مشروعات مسجلة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  projects
                    .filter((p) =>
                      p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.project_code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((proj) => {
                      const progressPct = Math.round((proj.completed_milestones / proj.total_milestones) * 100);
                      return (
                        <TableRow key={proj.id}>
                          <TableCell className="font-mono font-bold text-xs">{proj.project_code}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{proj.project_title}</div>
                            <div className="text-xs text-muted-foreground">عميل: {proj.client_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-muted">
                              {proj.service_category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-xs text-brand">
                            {proj.contract_value.toLocaleString()} ج.م
                          </TableCell>
                          <TableCell className="text-xs font-mono">{proj.deadline}</TableCell>
                          <TableCell>
                            <div className="text-xs font-mono font-bold">
                              المرحلة {proj.completed_milestones} من {proj.total_milestones} ({progressPct}%)
                            </div>
                            <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${progressPct >= 100 ? "bg-emerald-500" : "bg-brand"}`}
                                style={{ width: `${Math.min(progressPct, 100)}%` }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                proj.status === "delivered"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                  : proj.status === "client_review"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                  : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                              }
                            >
                              {proj.status === "delivered"
                                ? "تم التسليم النهائي"
                                : proj.status === "client_review"
                                ? "مراجعة العميل (Client Review)"
                                : "قيد الإنتاج والتصميم"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {proj.completed_milestones < proj.total_milestones && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 border-brand/40 text-brand hover:bg-brand/10"
                                onClick={() => handleAdvanceMilestone(proj.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                تسليم مرحلة
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 2: Capacity & Heatmap */}
      {activeTab === "capacity" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم الموظف / المبدع</TableHead>
                  <TableHead className="text-right">المسمى الوظيفي والدور</TableHead>
                  <TableHead className="text-right">الطاقة الأسبوعية (Capacity)</TableHead>
                  <TableHead className="text-right">الساعات المحجوزة</TableHead>
                  <TableHead className="text-right">نسبة الإشغال والاستغلال</TableHead>
                  <TableHead className="text-right">حالة التفرغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCapacityLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : capacityMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا يوجد أعضاء مسجلون في لوحة الإشغال
                    </TableCell>
                  </TableRow>
                ) : (
                  capacityMembers.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-sm">{m.member_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.role_title}</TableCell>
                      <TableCell className="font-mono text-xs">{m.weekly_capacity_hours} ساعة / أسبوع</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{m.booked_hours} ساعة</TableCell>
                      <TableCell>
                        <div className="text-xs font-mono font-bold">{m.utilization_percent}%</div>
                        <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              m.utilization_percent > 100
                                ? "bg-red-500"
                                : m.utilization_percent >= 80
                                ? "bg-emerald-500"
                                : "bg-sky-500"
                            }`}
                            style={{ width: `${Math.min(m.utilization_percent, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            m.status === "overloaded"
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : m.status === "optimal"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                          }
                        >
                          {m.status === "overloaded"
                            ? "ضغط عمل زائد (Overloaded)"
                            : m.status === "optimal"
                            ? "إشغال مثالي (Optimal)"
                            : "متاح لمشروعات جديدة"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 3: Retainers & Scope Creep */}
      {activeTab === "retainers" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم العميل</TableHead>
                  <TableHead className="text-right">باقة الـ Retainer الشهرية</TableHead>
                  <TableHead className="text-right">الساعات التعاقدية</TableHead>
                  <TableHead className="text-right">الساعات المستهلكة</TableHead>
                  <TableHead className="text-right">نسبة الحرق (Burn Rate)</TableHead>
                  <TableHead className="text-right">إنذار تمدد النطاق (Scope Creep)</TableHead>
                  <TableHead className="text-right">تاريخ التجديد</TableHead>
                  <TableHead className="text-center">تسجيل ساعات عمل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRetainersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : retainers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد عقود شهرية مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  retainers.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold text-sm">{r.client_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.retainer_tier}</TableCell>
                      <TableCell className="font-mono text-xs">{r.contracted_hours} ساعة</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{r.burned_hours} ساعة</TableCell>
                      <TableCell>
                        <div className="text-xs font-mono font-bold">{r.utilization_percent}%</div>
                        <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${r.utilization_percent >= 80 ? "bg-red-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(r.utilization_percent, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.scope_creep_alert ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 gap-1 font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            تجاوز 80% من الباقة
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            في النطاق الآمن
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.renewal_date}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 border-sky-500/40 text-sky-500 hover:bg-sky-500/10"
                          onClick={() => setBurnTargetRetainer(r)}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          قيد ساعات
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

      {/* TAB 4: Certified Translations */}
      {activeTab === "translations" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">عنوان الوثيقة</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">زوج اللغات</TableHead>
                  <TableHead className="text-right">إجمالي الكلمات</TableHead>
                  <TableHead className="text-right">خصم التكرار</TableHead>
                  <TableHead className="text-right">الكلمات الصافية المحاسبية</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الاعتماد والختم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTranslationsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : translations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد أوامر ترجمة مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  translations.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold text-sm max-w-xs truncate">{t.doc_title}</TableCell>
                      <TableCell className="text-xs">{t.client_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-muted font-mono">
                          {t.source_language} ➔ {t.target_language}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.total_words.toLocaleString()} كلمة</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        -{t.repeated_words_discount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-brand">
                        {t.net_billable_words.toLocaleString()} كلمة
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-emerald-500">
                        {t.total_amount.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.status === "certified_stamped"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : t.status === "proofreading"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-sky-500/10 text-sky-500 border-sky-500/30"
                          }
                        >
                          {t.status === "certified_stamped"
                            ? "مختومة ومعتمدة رسميـاً"
                            : t.status === "proofreading"
                            ? "تدقيق لغوي نهائي"
                            : "قيد الترجمة الفنية"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {t.status !== "certified_stamped" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => handleCertifyTranslation(t.id)}
                          >
                            <Award className="h-3.5 w-3.5" />
                            ختم الاعتماد
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* MODAL 1: Create Project */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل مشروع إبداعي / إعلاني جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewProjectOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">كود المشروع</label>
                  <Input
                    required
                    value={newProject.project_code}
                    onChange={(e) => setNewProject({ ...newProject, project_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">اسم العميل</label>
                  <Input
                    required
                    value={newProject.client_name}
                    onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">عنوان وموضوع المشروع</label>
                <Input
                  required
                  value={newProject.project_title}
                  onChange={(e) => setNewProject({ ...newProject, project_title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">تصنيف الخدمة</label>
                  <Input
                    value={newProject.service_category}
                    onChange={(e) => setNewProject({ ...newProject, service_category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">قيمة التعاقد (ج.م)</label>
                  <Input
                    type="number"
                    value={newProject.contract_value}
                    onChange={(e) => setNewProject({ ...newProject, contract_value: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">موعد التسليم النهائي</label>
                  <Input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">إجمالي مراحل التسليم (Milestones)</label>
                  <Input
                    type="number"
                    min={1}
                    value={newProject.total_milestones}
                    onChange={(e) => setNewProject({ ...newProject, total_milestones: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">موجز العمل (Creative Brief)</label>
                <textarea
                  className="w-full h-20 p-2 text-xs border rounded bg-background"
                  value={newProject.brief_notes}
                  onChange={(e) => setNewProject({ ...newProject, brief_notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">بدء المشروع</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Create Capacity Member */}
      {isNewMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إضافة عضو للوحة الإشغال الأسبوعية</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewMemberOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اسم الموظف / المبدع</label>
                <Input
                  required
                  value={newMember.member_name}
                  onChange={(e) => setNewMember({ ...newMember, member_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">المسمى الوظيفي والدور</label>
                <Input
                  required
                  value={newMember.role_title}
                  onChange={(e) => setNewMember({ ...newMember, role_title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الطاقة الأسبوعية (ساعات)</label>
                  <Input
                    type="number"
                    value={newMember.weekly_capacity_hours}
                    onChange={(e) => setNewMember({ ...newMember, weekly_capacity_hours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الساعات المحجوزة حالياً</label>
                  <Input
                    type="number"
                    value={newMember.booked_hours}
                    onChange={(e) => setNewMember({ ...newMember, booked_hours: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewMemberOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إدراج في الفريق</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Create Retainer */}
      {isNewRetainerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل باقة Retainer شهرية لعميل</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewRetainerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateRetainer} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اسم العميل</label>
                <Input
                  required
                  value={newRetainer.client_name}
                  onChange={(e) => setNewRetainer({ ...newRetainer, client_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">مستوى الباقة (Retainer Tier)</label>
                <Input
                  required
                  value={newRetainer.retainer_tier}
                  onChange={(e) => setNewRetainer({ ...newRetainer, retainer_tier: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الساعات التعاقدية شهرياً</label>
                  <Input
                    type="number"
                    value={newRetainer.contracted_hours}
                    onChange={(e) => setNewRetainer({ ...newRetainer, contracted_hours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">سعر الساعة الإضافية (ج.م)</label>
                  <Input
                    type="number"
                    value={newRetainer.overage_hourly_rate}
                    onChange={(e) => setNewRetainer({ ...newRetainer, overage_hourly_rate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">تاريخ تجديد الباقة</label>
                <Input
                  type="date"
                  value={newRetainer.renewal_date}
                  onChange={(e) => setNewRetainer({ ...newRetainer, renewal_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewRetainerOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تفعيل العقد</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: Burn Retainer Hours */}
      {burnTargetRetainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل ساعات عمل على باقة Retainer</h3>
              <Button variant="ghost" size="sm" onClick={() => setBurnTargetRetainer(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleBurnHours} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="font-bold">{burnTargetRetainer.client_name}</div>
                <div className="text-muted-foreground">{burnTargetRetainer.retainer_tier}</div>
                <div className="text-brand font-bold">
                  المستهلك حالياً: {burnTargetRetainer.burned_hours} / {burnTargetRetainer.contracted_hours} ساعة
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">عدد الساعات المستهلكة اليوم</label>
                <Input
                  type="number"
                  step="0.5"
                  min={0.5}
                  value={burnHoursInput}
                  onChange={(e) => setBurnHoursInput(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setBurnTargetRetainer(null)}>
                  إلغاء
                </Button>
                <Button type="submit">تسجيل وخصم الساعات</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 5: Create Translation Order */}
      {isNewTranslationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل أمر ترجمة قانونية معتمدة</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewTranslationOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateTranslation} className="space-y-4">
              <div>
                <label className="text-xs font-medium">عنوان الوثيقة / المستند</label>
                <Input
                  required
                  value={newTranslation.doc_title}
                  onChange={(e) => setNewTranslation({ ...newTranslation, doc_title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">اسم العميل / الجهة الطالبة</label>
                <Input
                  required
                  value={newTranslation.client_name}
                  onChange={(e) => setNewTranslation({ ...newTranslation, client_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اللغة المصدر</label>
                  <Input
                    value={newTranslation.source_language}
                    onChange={(e) => setNewTranslation({ ...newTranslation, source_language: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">اللغة الهدف</label>
                  <Input
                    value={newTranslation.target_language}
                    onChange={(e) => setNewTranslation({ ...newTranslation, target_language: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">إجمالي الكلمات</label>
                  <Input
                    type="number"
                    value={newTranslation.total_words}
                    onChange={(e) => setNewTranslation({ ...newTranslation, total_words: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تكرار الذاكرة (خصم)</label>
                  <Input
                    type="number"
                    value={newTranslation.repeated_words_discount}
                    onChange={(e) => setNewTranslation({ ...newTranslation, repeated_words_discount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">سعر الكلمة (ج.م)</label>
                  <Input
                    type="number"
                    step="0.05"
                    value={newTranslation.rate_per_word}
                    onChange={(e) => setNewTranslation({ ...newTranslation, rate_per_word: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded text-xs">
                صافي الكلمات المحاسبية:{" "}
                <span className="font-mono font-bold text-brand">
                  {Math.max(0, newTranslation.total_words - newTranslation.repeated_words_discount)} كلمة
                </span>{" "}
                • التكلفة التقديرية:{" "}
                <span className="font-mono font-bold text-emerald-500">
                  {(
                    Math.max(0, newTranslation.total_words - newTranslation.repeated_words_discount) *
                    newTranslation.rate_per_word
                  ).toLocaleString()}{" "}
                  ج.م
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewTranslationOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تأكيد أمر الترجمة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
