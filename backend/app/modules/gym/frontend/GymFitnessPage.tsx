import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  Dumbbell,
  Flame,
  PauseCircle,
  PlayCircle,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  UserCheck,
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

interface GymSummary {
  active_members_count: number;
  frozen_members_count: number;
  expired_members_count: number;
  total_members_count: number;
  today_turnstile_scans: number;
  active_pt_packages_count: number;
  classes_scheduled_count: number;
}

interface GymMembership {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  price: number;
  paid_amount: number;
  status: "active" | "frozen" | "expired";
  freeze_days_allowed: number;
  freeze_days_used: number;
}

interface GymAccessLog {
  id: string;
  member_id: string;
  member_name: string;
  gate_name: string;
  scanned_at: string;
  access_result: "granted" | "denied_expired" | "denied_frozen";
  reason: string;
}

interface GymPTPackage {
  id: string;
  member_id: string;
  member_name: string;
  trainer_name: string;
  total_sessions: number;
  completed_sessions: number;
  price_per_session: number;
  total_price: number;
  status: "active" | "completed" | "expired";
}

interface GymGroupClass {
  id: string;
  class_name: string;
  coach_name: string;
  studio_room: string;
  schedule_time: string;
  max_capacity: number;
  booked_count: number;
  status: "scheduled" | "ongoing" | "completed";
}

interface GymBodyAssessment {
  id: string;
  member_id: string;
  member_name: string;
  assessment_date: string;
  weight_kg: number;
  body_fat_percent: number;
  muscle_mass_kg: number;
  bmi: number;
  coach_notes: string;
}

export default function GymFitnessPage() {
  const [activeTab, setActiveTab] = useState<"memberships" | "access_logs" | "pt" | "classes" | "inbody">("memberships");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isNewPTOpen, setIsNewPTOpen] = useState(false);
  const [isNewClassOpen, setIsNewClassOpen] = useState(false);
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false);
  const [freezeTargetMember, setFreezeTargetMember] = useState<GymMembership | null>(null);
  const [freezeDays, setFreezeDays] = useState(14);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<GymSummary>({
    queryKey: ["gymSummary"],
    queryFn: () => api.get<GymSummary>("/gym/summary"),
  });

  const { data: memberships = [], isLoading: isMembershipsLoading } = useQuery<GymMembership[]>({
    queryKey: ["gymMemberships"],
    queryFn: () => api.get<GymMembership[]>("/gym/memberships"),
  });

  const { data: accessLogs = [], isLoading: isLogsLoading } = useQuery<GymAccessLog[]>({
    queryKey: ["gymAccessLogs"],
    queryFn: () => api.get<GymAccessLog[]>("/gym/access/logs"),
  });

  const { data: ptPackages = [], isLoading: isPTLoading } = useQuery<GymPTPackage[]>({
    queryKey: ["gymPTPackages"],
    queryFn: () => api.get<GymPTPackage[]>("/gym/pt-packages"),
  });

  const { data: classes = [], isLoading: isClassesLoading } = useQuery<GymGroupClass[]>({
    queryKey: ["gymClasses"],
    queryFn: () => api.get<GymGroupClass[]>("/gym/classes"),
  });

  const { data: assessments = [], isLoading: isAssessmentsLoading } = useQuery<GymBodyAssessment[]>({
    queryKey: ["gymAssessments"],
    queryFn: () => api.get<GymBodyAssessment[]>("/gym/assessments"),
  });

  // Forms State
  const [newMember, setNewMember] = useState({
    full_name: "",
    phone: "",
    plan_name: "عضوية سنوية ذهبية شاملة (All-Access VIP)",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "2027-11-02",
    price: 6500,
    paid_amount: 6500,
    freeze_days_allowed: 45,
  });

  const [scanMemberId, setScanMemberId] = useState("");
  const [scanGate, setScanGate] = useState("بوابة الدخول الرئيسية (Turnstile 01)");

  const [newPT, setNewPT] = useState({
    member_id: "",
    member_name: "",
    trainer_name: "كابتن / رامي السبيعي (Big Ramy)",
    total_sessions: 12,
    price_per_session: 350,
  });

  const [newClass, setNewClass] = useState({
    class_name: "كروس فيت لياقة قتالية (CrossFit MetCon)",
    coach_name: "كابتن / عمر الديب",
    studio_room: "القاعة المفتوحة 1 (Box Zone)",
    schedule_time: "السبت والإثنين والأربعاء 07:00 PM",
    max_capacity: 25,
  });

  const [newAssessment, setNewAssessment] = useState({
    member_id: "",
    member_name: "",
    assessment_date: new Date().toISOString().split("T")[0],
    weight_kg: 82.5,
    body_fat_percent: 14.8,
    muscle_mass_kg: 41.2,
    bmi: 23.9,
    coach_notes: "زيادة ممتازة في الكتلة العضلية وانخفاض 1.5% دهون عن الشهر السابق",
  });

  // Handlers
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gym/memberships", newMember);
      queryClient.invalidateQueries({ queryKey: ["gymMemberships"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      setIsNewMemberOpen(false);
      toast("success", "تم إنشاء ملف المشترك وإصدار الكود بنجاح");
    } catch {
      toast("error", "تعذر تسجيل العضوية");
    }
  };

  const handleFreezeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeTargetMember) return;
    sound.click();
    try {
      await api.post(`/gym/memberships/${freezeTargetMember.id}/freeze`, { days: freezeDays });
      queryClient.invalidateQueries({ queryKey: ["gymMemberships"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      setFreezeTargetMember(null);
      toast("success", `تم تجميد الاشتراك بنجاح لمدة ${freezeDays} يوماً`);
    } catch {
      toast("error", "تعذر تجميد العضوية");
    }
  };

  const handleUnfreezeMember = async (memberId: string) => {
    sound.click();
    try {
      await api.post(`/gym/memberships/${memberId}/unfreeze`);
      queryClient.invalidateQueries({ queryKey: ["gymMemberships"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      toast("success", "تمت إعادة تنشيط الاشتراك وتحديث تاريخ الانتهاء");
    } catch {
      toast("error", "تعذر إعادة تنشيط العضوية");
    }
  };

  const handleTurnstileScan = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      const res = await api.post<any>("/gym/access/scan", {
        member_id: scanMemberId,
        gate_name: scanGate,
      });
      queryClient.invalidateQueries({ queryKey: ["gymAccessLogs"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      setIsScanOpen(false);
      if (res?.access_result === "granted") {
        toast("success", `مرحباً بك: ${res.member_name}`);
      } else {
        toast("error", `${res?.member_name || ""} - السبب: ${res?.reason || "مرفوض"}`);
      }
    } catch {
      toast("error", "تعذر قراءة بطاقة العضوية");
    }
  };

  const handleCreatePT = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gym/pt-packages", newPT);
      queryClient.invalidateQueries({ queryKey: ["gymPTPackages"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      setIsNewPTOpen(false);
      toast("success", "تم إسناد المتدرب للمدرب الشخصي بنجاح");
    } catch {
      toast("error", "تعذر تسجيل باقة PT");
    }
  };

  const handleConsumePTSession = async (pkgId: string) => {
    sound.click();
    try {
      await api.post(`/gym/pt-packages/${pkgId}/consume`);
      queryClient.invalidateQueries({ queryKey: ["gymPTPackages"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      toast("success", "تم خصم حصة تدريب شخصي بنجاح");
    } catch {
      toast("error", "تعذر تسجيل الحصة أو اكتملت الباقة");
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gym/classes", newClass);
      queryClient.invalidateQueries({ queryKey: ["gymClasses"] });
      queryClient.invalidateQueries({ queryKey: ["gymSummary"] });
      setIsNewClassOpen(false);
      toast("success", "تم جدولة الحصة الجماعية في الجدول بنجاح");
    } catch {
      toast("error", "تعذر إضافة الكلاس");
    }
  };

  const handleBookClassSeat = async (classId: string) => {
    sound.click();
    try {
      await api.post(`/gym/classes/${classId}/book`);
      queryClient.invalidateQueries({ queryKey: ["gymClasses"] });
      toast("success", "تم تسجيل الحضور في الكلاس الجماعي بنجاح");
    } catch {
      toast("error", "اكتملت السعة القصوى للكلاس");
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    try {
      await api.post("/gym/assessments", newAssessment);
      queryClient.invalidateQueries({ queryKey: ["gymAssessments"] });
      setIsNewAssessmentOpen(false);
      toast("success", "تم تسجيل التقرير الحيوي في سجل المشترك");
    } catch {
      toast("error", "تعذر حفظ القياس");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-brand" />
            نظام إدارة الجيم والأندية الرياضية والتدريب
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة دورة حياة الاشتراكات وتجميد العضويات، بوابات الدخول RFID، التدريب الشخصي PT، والكلاسات وفحوصات InBody
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "memberships" && (
            <Button onClick={() => setIsNewMemberOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل اشتراك جديد
            </Button>
          )}
          {activeTab === "access_logs" && (
            <Button onClick={() => setIsScanOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <QrCode className="h-4 w-4" />
              محاكاة تمرير البوابة (RFID Scan)
            </Button>
          )}
          {activeTab === "pt" && (
            <Button onClick={() => setIsNewPTOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              اشتراك تدريب شخصي (PT)
            </Button>
          )}
          {activeTab === "classes" && (
            <Button onClick={() => setIsNewClassOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة كلاس جماعي
            </Button>
          )}
          {activeTab === "inbody" && (
            <Button onClick={() => setIsNewAssessmentOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل فحص InBody جديد
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Users className="h-4 w-4 text-emerald-500" />
            الأعضاء النشطون
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-500">
              {summary?.active_members_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <PauseCircle className="h-4 w-4 text-sky-500" />
            عضويات مجمدة (Freeze)
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-sky-500">
              {summary?.frozen_members_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            عضويات منتهية
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-red-500">
              {summary?.expired_members_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <QrCode className="h-4 w-4 text-indigo-500" />
            دخول البوابات اليوم
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-indigo-500">
              {summary?.today_turnstile_scans || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Flame className="h-4 w-4 text-amber-500" />
            باقات PT النشطة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.active_pt_packages_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Calendar className="h-4 w-4 text-teal-500" />
            كلاسات مجدولة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-teal-500">
              {summary?.classes_scheduled_count || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "memberships" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("memberships")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            سجل العضويات والاشتراكات
          </Button>
          <Button
            variant={activeTab === "access_logs" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("access_logs")}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            بوابات الدخول RFID
          </Button>
          <Button
            variant={activeTab === "pt" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("pt")}
            className="gap-2"
          >
            <Dumbbell className="h-4 w-4" />
            التدريب الشخصي (PT)
          </Button>
          <Button
            variant={activeTab === "classes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("classes")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            الكلاسات الجماعية
          </Button>
          <Button
            variant={activeTab === "inbody" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("inbody")}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            فحوصات InBody والتطور
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود، الاسم، الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Memberships */}
      {activeTab === "memberships" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">كود العضو</TableHead>
                  <TableHead className="text-right">الاسم والموبايل</TableHead>
                  <TableHead className="text-right">نوع الباقة</TableHead>
                  <TableHead className="text-right">صلاحية الاشتراك</TableHead>
                  <TableHead className="text-right">رصيد التجميد (Freeze)</TableHead>
                  <TableHead className="text-right">القيمة المدفوعة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات التجميد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMembershipsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : memberships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد اشتراكات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  memberships
                    .filter((m) =>
                      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.member_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.phone.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((mem) => (
                      <TableRow key={mem.id}>
                        <TableCell className="font-mono font-bold text-xs">{mem.member_code}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{mem.full_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{mem.phone}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium max-w-xs truncate">{mem.plan_name}</TableCell>
                        <TableCell className="text-xs font-mono">
                          <div>من: {mem.start_date}</div>
                          <div className="text-muted-foreground">إلى: {mem.end_date}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono font-bold">
                            {mem.freeze_days_used} / {mem.freeze_days_allowed} يوماً
                          </div>
                          <div className="w-20 bg-muted h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-sky-500"
                              style={{
                                width: `${Math.min((mem.freeze_days_used / mem.freeze_days_allowed) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-brand">
                          {mem.paid_amount.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              mem.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : mem.status === "frozen"
                                ? "bg-sky-500/10 text-sky-500 border-sky-500/30"
                                : "bg-red-500/10 text-red-500 border-red-500/30"
                            }
                          >
                            {mem.status === "active" ? "نشط وفعال" : mem.status === "frozen" ? "مجمد (Frozen)" : "منتهي الصلاحية"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {mem.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-sky-500/40 text-sky-500 hover:bg-sky-500/10"
                              onClick={() => setFreezeTargetMember(mem)}
                            >
                              <PauseCircle className="h-3.5 w-3.5" />
                              تجميد
                            </Button>
                          )}
                          {mem.status === "frozen" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleUnfreezeMember(mem.id)}
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              فك التجميد
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

      {/* TAB 2: Turnstile Access Logs */}
      {activeTab === "access_logs" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم العضو</TableHead>
                  <TableHead className="text-right">البوابة</TableHead>
                  <TableHead className="text-right">وقت القراءة</TableHead>
                  <TableHead className="text-right">نتيجة المسح</TableHead>
                  <TableHead className="text-right">التفاصيل والسبب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLogsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : accessLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات دخول مسجلة اليوم
                    </TableCell>
                  </TableRow>
                ) : (
                  accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-semibold text-sm">{log.member_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.gate_name}</TableCell>
                      <TableCell className="font-mono text-xs">{log.scanned_at}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.access_result === "granted"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-red-500/10 text-red-500 border-red-500/30"
                          }
                        >
                          {log.access_result === "granted" ? "دخول مصرح به" : "مرفوض الدخول"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 3: PT Packages */}
      {activeTab === "pt" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">المتدرب</TableHead>
                  <TableHead className="text-right">المدرب الشخصي</TableHead>
                  <TableHead className="text-right">الحصص المنجزة</TableHead>
                  <TableHead className="text-right">سعر الحصة والإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">تسجيل جلسة تدريب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPTLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : ptPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد باقات تدريب شخصي مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  ptPackages.map((pt) => {
                    const progressPct = Math.round((pt.completed_sessions / pt.total_sessions) * 100);
                    return (
                      <TableRow key={pt.id}>
                        <TableCell className="font-semibold text-sm">{pt.member_name}</TableCell>
                        <TableCell className="text-xs font-medium text-brand">{pt.trainer_name}</TableCell>
                        <TableCell>
                          <div className="text-xs font-mono font-bold">
                            {pt.completed_sessions} / {pt.total_sessions} حصة ({progressPct}%)
                          </div>
                          <div className="w-28 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${progressPct >= 100 ? "bg-emerald-500" : "bg-brand"}`}
                              style={{ width: `${Math.min(progressPct, 100)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-bold text-xs">{pt.total_price.toLocaleString()} ج.م</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {pt.price_per_session} ج.م / حصة
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              pt.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {pt.status === "active" ? "جارية ومتبقي حصص" : "مكتملة الحصص"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {pt.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-brand/40 text-brand hover:bg-brand/10"
                              onClick={() => handleConsumePTSession(pt.id)}
                            >
                              <Dumbbell className="h-3.5 w-3.5" />
                              خصم جلسة اليوم
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

      {/* TAB 4: Group Classes */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم الكلاس</TableHead>
                  <TableHead className="text-right">المدرب المسؤول</TableHead>
                  <TableHead className="text-right">القاعة والاستوديو</TableHead>
                  <TableHead className="text-right">المواعيد</TableHead>
                  <TableHead className="text-right">المقاعد المحجوزة</TableHead>
                  <TableHead className="text-center">حجز مقعد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isClassesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد كلاسات مجدولة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((c) => {
                    const capacityPct = Math.round((c.booked_count / c.max_capacity) * 100);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold text-sm">{c.class_name}</TableCell>
                        <TableCell className="text-xs font-medium text-brand">{c.coach_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.studio_room}</TableCell>
                        <TableCell className="text-xs font-mono">{c.schedule_time}</TableCell>
                        <TableCell>
                          <div className="text-xs font-mono font-bold">
                            {c.booked_count} / {c.max_capacity} مقعد ({capacityPct}%)
                          </div>
                          <div className="w-24 bg-muted h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${capacityPct >= 90 ? "bg-red-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(capacityPct, 100)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {c.booked_count < c.max_capacity ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleBookClassSeat(c.id)}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              تسجيل حضور
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-500 bg-red-500/10">
                              مكتمل المقاعد
                            </Badge>
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

      {/* TAB 5: InBody Assessments */}
      {activeTab === "inbody" && (
        <div className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">اسم العضو</TableHead>
                  <TableHead className="text-right">تاريخ الفحص</TableHead>
                  <TableHead className="text-right">الوزن (كجم)</TableHead>
                  <TableHead className="text-right">نسبة الدهون (Fat %)</TableHead>
                  <TableHead className="text-right">الكتلة العضلية (SMM)</TableHead>
                  <TableHead className="text-right">مؤشر كتلة الجسم (BMI)</TableHead>
                  <TableHead className="text-right">ملاحظات الكابتن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAssessmentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : assessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد قياسات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  assessments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold text-sm">{a.member_name}</TableCell>
                      <TableCell className="font-mono text-xs">{a.assessment_date}</TableCell>
                      <TableCell className="font-mono font-bold text-xs">{a.weight_kg} كجم</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs bg-amber-500/10 text-amber-500">
                          {a.body_fat_percent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-500">
                        {a.muscle_mass_kg} كجم
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.bmi}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {a.coach_notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* MODAL 1: Create Membership */}
      {isNewMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل اشتراك نادي رياضي جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewMemberOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم المشترك بالكامل</label>
                  <Input
                    required
                    value={newMember.full_name}
                    onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">رقم الهاتف</label>
                  <Input
                    required
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">نوع الباقة والاشتراك</label>
                <Input
                  required
                  value={newMember.plan_name}
                  onChange={(e) => setNewMember({ ...newMember, plan_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">تاريخ البداية</label>
                  <Input
                    type="date"
                    value={newMember.start_date}
                    onChange={(e) => setNewMember({ ...newMember, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">تاريخ النهاية</label>
                  <Input
                    type="date"
                    value={newMember.end_date}
                    onChange={(e) => setNewMember({ ...newMember, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">أيام التجميد المسموحة</label>
                  <Input
                    type="number"
                    value={newMember.freeze_days_allowed}
                    onChange={(e) => setNewMember({ ...newMember, freeze_days_allowed: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">سعر الاشتراك (ج.م)</label>
                  <Input
                    type="number"
                    value={newMember.price}
                    onChange={(e) => setNewMember({ ...newMember, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">المبلغ المدفوع (ج.م)</label>
                  <Input
                    type="number"
                    value={newMember.paid_amount}
                    onChange={(e) => setNewMember({ ...newMember, paid_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewMemberOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إتمام الاشتراك</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Freeze Membership */}
      {freezeTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تجميد اشتراك عضو (Freeze)</h3>
              <Button variant="ghost" size="sm" onClick={() => setFreezeTargetMember(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleFreezeMember} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="font-bold">{freezeTargetMember.full_name}</div>
                <div className="text-muted-foreground">كود: {freezeTargetMember.member_code}</div>
                <div className="text-muted-foreground">
                  رصيد التجميد المتبقي: {freezeTargetMember.freeze_days_allowed - freezeTargetMember.freeze_days_used} يوماً
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">عدد أيام التجميد المطلوبة</label>
                <Input
                  type="number"
                  min={1}
                  max={freezeTargetMember.freeze_days_allowed - freezeTargetMember.freeze_days_used}
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setFreezeTargetMember(null)}>
                  إلغاء
                </Button>
                <Button type="submit">تأكيد التجميد</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Simulate Turnstile Scan */}
      {isScanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">محاكاة قراءة بوابات الدخول (Turnstile)</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsScanOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleTurnstileScan} className="space-y-4">
              <div>
                <label className="text-xs font-medium">حدد العضو للمسح</label>
                <select
                  required
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={scanMemberId}
                  onChange={(e) => setScanMemberId(e.target.value)}
                >
                  <option value="">-- اختر بطاقة العضو --</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">البوابة</label>
                <select
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={scanGate}
                  onChange={(e) => setScanGate(e.target.value)}
                >
                  <option value="بوابة الدخول الرئيسية (Turnstile 01)">بوابة الدخول الرئيسية (Turnstile 01)</option>
                  <option value="بوابة المسبح والجاكوزي">بوابة المسبح والجاكوزي</option>
                  <option value="بوابة صالة الحديد والكروس فيت">بوابة صالة الحديد والكروس فيت</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsScanOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  تمرير البطاقة الآن
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: Create PT Package */}
      {isNewPTOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل باقة تدريب شخصي (Personal Training)</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewPTOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePT} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اختر العضو المتدرب</label>
                <select
                  required
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={newPT.member_id}
                  onChange={(e) => {
                    const m = memberships.find((x) => x.id === e.target.value);
                    setNewPT({ ...newPT, member_id: e.target.value, member_name: m ? m.full_name : "" });
                  }}
                >
                  <option value="">-- حدد العضو --</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">اسم المدرب الشخصي (PT Coach)</label>
                <Input
                  required
                  value={newPT.trainer_name}
                  onChange={(e) => setNewPT({ ...newPT, trainer_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">إجمالي الحصص</label>
                  <Input
                    type="number"
                    value={newPT.total_sessions}
                    onChange={(e) => setNewPT({ ...newPT, total_sessions: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">سعر الحصة (ج.م)</label>
                  <Input
                    type="number"
                    value={newPT.price_per_session}
                    onChange={(e) => setNewPT({ ...newPT, price_per_session: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewPTOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ وتفعيل الباقة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 5: Create Class */}
      {isNewClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">إضافة كلاس جماعي في الجدول</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewClassOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اسم الكلاس والتمرين</label>
                <Input
                  required
                  value={newClass.class_name}
                  onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">اسم الكابتن</label>
                  <Input
                    required
                    value={newClass.coach_name}
                    onChange={(e) => setNewClass({ ...newClass, coach_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الاستوديو / الصالة</label>
                  <Input
                    required
                    value={newClass.studio_room}
                    onChange={(e) => setNewClass({ ...newClass, studio_room: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">المواعيد والأيام</label>
                  <Input
                    required
                    value={newClass.schedule_time}
                    onChange={(e) => setNewClass({ ...newClass, schedule_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">السعة القصوى للمقاعد</label>
                  <Input
                    type="number"
                    value={newClass.max_capacity}
                    onChange={(e) => setNewClass({ ...newClass, max_capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewClassOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إدراج في الجدول</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 6: Create InBody Assessment */}
      {isNewAssessmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 border-border/80 bg-background shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold">تسجيل فحص InBody ومؤشرات الجسم</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsNewAssessmentOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="text-xs font-medium">اختر العضو</label>
                <select
                  required
                  className="w-full p-2 border rounded text-xs bg-background"
                  value={newAssessment.member_id}
                  onChange={(e) => {
                    const m = memberships.find((x) => x.id === e.target.value);
                    setNewAssessment({
                      ...newAssessment,
                      member_id: e.target.value,
                      member_name: m ? m.full_name : "",
                    });
                  }}
                >
                  <option value="">-- حدد العضو --</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_code} - {m.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الوزن (كجم)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newAssessment.weight_kg}
                    onChange={(e) => setNewAssessment({ ...newAssessment, weight_kg: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">نسبة الدهون (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newAssessment.body_fat_percent}
                    onChange={(e) => setNewAssessment({ ...newAssessment, body_fat_percent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">الكتلة العضلية (كجم)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newAssessment.muscle_mass_kg}
                    onChange={(e) => setNewAssessment({ ...newAssessment, muscle_mass_kg: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">مؤشر كتلة الجسم (BMI)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newAssessment.bmi}
                    onChange={(e) => setNewAssessment({ ...newAssessment, bmi: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">ملاحظات الكابتن والتوصيات الغذائية</label>
                <Input
                  value={newAssessment.coach_notes}
                  onChange={(e) => setNewAssessment({ ...newAssessment, coach_notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNewAssessmentOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ الفحص</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
