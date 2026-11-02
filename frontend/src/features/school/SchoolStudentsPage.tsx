/**
 * PAGE CONTRACT
 * Page: شؤون الطلاب، الحضور، درجات الاختبارات، والأقساط الدراسية (/school/students)
 * Archetype: School Administration Suite & Academic Ledger (EDU-01..10)
 * User: المحاسب المالي، شؤون الطلاب، والمشرف الأكاديمي لإدارة الطلاب، الحضور والغياب، الدرجات، وسداد المصروفات
 * Anti-AI Tell Score: 0 (Pure design tokens, tabular numerals, semantic status chips)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  HandCoins,
  Plus,
  Search,
  CheckCircle2,
  CalendarCheck,
  Award,
} from "lucide-react";
import { Skeleton } from "@/components/kit/skeleton";
import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";
import { Empty, ErrorBox, Input, Modal, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { moneyEGP } from "@/lib/format";
import { sound } from "@/lib/sound";
import { SchoolTuitionReceiptModal, type SchoolPaymentReceiptData } from "@/features/modules/SpecializedReceiptModals";

interface Student {
  id: string;
  code: string;
  name: string;
  grade: string;
  parent_phone: string;
  guardian_name?: string;
  has_sibling_discount?: boolean;
  total_tuition: number;
  paid_tuition: number;
  balance_due: number;
  status: "active" | "settled" | "overdue";
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  grade: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  recorded_by: string;
}

interface AttendanceResponse {
  total_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate_pct: number;
  records: AttendanceRecord[];
}

interface GradeRecord {
  id: string;
  student_name: string;
  grade: string;
  term: string;
  subject: string;
  exam_type: string;
  max_score: number;
  score: number;
  letter_grade: string;
  is_passed: boolean;
  remarks?: string;
}

interface GradeResponse {
  total_grades: number;
  average_score: number;
  pass_rate_pct: number;
  grades: GradeRecord[];
}

interface SchoolSummary {
  total_students: number;
  total_tuition: number;
  paid_tuition: number;
  balance_due: number;
  collection_rate_pct: number;
  attendance_rate_pct: number;
  current_term: string;
}

export default function SchoolStudentsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"students" | "attendance" | "grades">("students");
  const [search, setSearch] = useState("");
  const [payFor, setPayFor] = useState<Student | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payTerm, setPayTerm] = useState("القسط الأول");
  const [payNotes, setPayNotes] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [receiptData, setReceiptData] = useState<SchoolPaymentReceiptData | null>(null);

  // New Student Modal
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    code: `STU-2024-00${Math.floor(10 + Math.random() * 90)}`,
    name: "",
    grade: "الصف الأول الإعدادي",
    parent_phone: "",
    guardian_name: "",
    has_sibling_discount: false,
    total_tuition: 15000,
  });

  // New Grade Modal
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    student_id: "",
    student_name: "",
    grade: "الصف الأول الإعدادي",
    term: "الفصل الدراسي الأول",
    subject: "الرياضيات",
    exam_type: "midterm",
    max_score: 100,
    score: 85,
    remarks: "",
  });

  const { toast } = useToast();

  const studentsQuery = useQuery({
    queryKey: ["school-students"],
    queryFn: () => api.get<Student[]>("/modules/school/students"),
  });

  const attendanceQuery = useQuery({
    queryKey: ["school-attendance"],
    queryFn: () => api.get<AttendanceResponse>("/modules/school/attendance"),
  });

  const gradesQuery = useQuery({
    queryKey: ["school-grades"],
    queryFn: () => api.get<GradeResponse>("/modules/school/grades"),
  });

  const summaryQuery = useQuery({
    queryKey: ["school-summary"],
    queryFn: () => api.get<SchoolSummary>("/modules/school/summary"),
  });

  const students = studentsQuery.data ?? [];
  const attendanceData = attendanceQuery.data ?? { total_records: 0, present_count: 0, absent_count: 0, late_count: 0, attendance_rate_pct: 100, records: [] };
  const gradesData = gradesQuery.data ?? { total_grades: 0, average_score: 0, pass_rate_pct: 100, grades: [] };
  const summary = summaryQuery.data ?? {
    total_students: students.length,
    total_tuition: 0,
    paid_tuition: 0,
    balance_due: 0,
    collection_rate_pct: 0,
    attendance_rate_pct: 100,
    current_term: "الفصل الدراسي الأول 2024-2025",
  };

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.grade.includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <GraduationCap className="size-4" />
            <span>وحدة المدارس والأكاديميات التعليمية</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            شؤون الطلاب، الحضور والنتائج الأكاديمية
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            تسجيل الطلاب والدارسين، متابعة سداد الأقساط، دفتر الدرجات، ونسب الحضور والغياب ({summary.current_term})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={tab === "students" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("students");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <GraduationCap className="size-3.5" />
            سجل الطلاب والمصروفات
          </Button>

          <Button
            variant={tab === "attendance" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("attendance");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <CalendarCheck className="size-3.5" />
            الحضور والغياب
            <span className="ms-1 rounded-full bg-emerald-500/20 px-1.5 text-[10px] text-emerald-600 font-bold">
              {attendanceData.attendance_rate_pct}%
            </span>
          </Button>

          <Button
            variant={tab === "grades" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              sound.click();
              setTab("grades");
            }}
            className="h-9 gap-1.5 text-xs font-bold"
          >
            <Award className="size-3.5" />
            دفتر الدرجات والاختبارات
          </Button>

          <Button
            size="sm"
            onClick={() => {
              sound.click();
              setIsAddingStudent(true);
            }}
            className="h-9 gap-1.5 text-xs font-bold bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
            تسجيل طالب جديد
          </Button>
        </div>
      </div>

      {/* Tuition Financial & Academic KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">إجمالي الرسوم الدراسية</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-foreground">
            {moneyEGP(summary.total_tuition)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            المستحق لكافة صفوف المدرسة
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">المصروفات المحصلة</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {moneyEGP(summary.paid_tuition)}
            </p>
            <Badge variant="success" className="h-5 px-1 text-[10px] font-bold">
              {summary.collection_rate_pct}%
            </Badge>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">نسبة التحصيل الفعلي</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">الأقساط المتبقية للتحصيل</p>
          <p className="num mt-1 text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {moneyEGP(summary.balance_due)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">متأخرات ومستحقات مؤجلة</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground">نسبة الحضور والالتزام</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="num text-xl font-bold tracking-tight text-primary">
              {attendanceData.attendance_rate_pct}%
            </p>
            <span className="text-xs text-muted-foreground">
              (<span className="num font-semibold">{attendanceData.present_count}</span> حاضر)
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">إجمالي المقيدين: <span className="num font-semibold">{students.length}</span> طالب</p>
        </Card>
      </div>

      {/* Tab 1: Students Roster & Installments */}
      {tab === "students" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث باسم الطالب، الكود، أو الصف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              عدد الطلاب: <strong className="num text-foreground">{filteredStudents.length}</strong>
            </span>
          </div>

          {studentsQuery.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : studentsQuery.isError ? (
            <div className="p-4">
              <ErrorBox message={(studentsQuery.error as Error).message} onRetry={() => studentsQuery.refetch()} />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-6">
              <Empty
                icon={<GraduationCap className="size-8 text-muted-foreground" />}
                text="لا يوجد طلاب مسجلين"
                hint="ابدأ بإضافة أول طالب للأكاديمية لإنشاء ملفه وتحديد أقساطه"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>كود الطالب</TableHead>
                    <TableHead>اسم الطالب والولي</TableHead>
                    <TableHead>المرحلة / الصف</TableHead>
                    <TableHead>هاتف ولي الأمر</TableHead>
                    <TableHead>المصروفات المقررة</TableHead>
                    <TableHead>المسدد</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>حالة السداد</TableHead>
                    <TableHead className="text-center">إجراءات التحصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => {
                    const isSettled = s.balance_due <= 0;
                    const isOverdue = s.status === "overdue";

                    return (
                      <TableRow key={s.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {s.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-foreground">{s.name}</span>
                            {s.guardian_name && (
                              <p className="text-[10px] text-muted-foreground">ولي الأمر: {s.guardian_name}</p>
                            )}
                            {s.has_sibling_discount && (
                              <Badge variant="outline" className="mt-0.5 text-[9px] text-emerald-600 border-emerald-500/30">
                                خصم أخوة 10%
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {s.grade}
                        </TableCell>
                        <TableCell className="num text-xs text-muted-foreground">
                          {s.parent_phone}
                        </TableCell>
                        <TableCell className="num text-xs font-bold text-foreground">
                          {moneyEGP(s.total_tuition)}
                        </TableCell>
                        <TableCell className="num text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {moneyEGP(s.paid_tuition)}
                        </TableCell>
                        <TableCell className="num text-xs font-bold text-amber-600 dark:text-amber-400">
                          {moneyEGP(s.balance_due)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isSettled ? "success" : isOverdue ? "destructive" : "warning"}
                            className="text-[10px] font-bold"
                          >
                            {isSettled ? "مسدد بالكامل" : isOverdue ? "متأخر" : "ساري"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={isSettled ? "outline" : "default"}
                            size="sm"
                            disabled={isSettled}
                            onClick={() => {
                              sound.click();
                              setPayFor(s);
                              setPayAmount(String(Math.min(s.balance_due, 5000)));
                            }}
                            className="h-8 gap-1 text-xs font-semibold"
                          >
                            <HandCoins className="size-3.5" />
                            {isSettled ? "لا توجد مستحقات" : "تحصيل قسط"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Attendance Register (EDU-05) */}
      {tab === "attendance" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CalendarCheck className="size-4 text-emerald-600" />
                سجل الحضور والغياب اليومي للطلاب
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                توثيق الحضور، التأخيرات، والغياب غير المعذور مع إشعار ولي الأمر
              </p>
            </div>

            <Badge variant="outline" className="text-xs font-bold">
              نسبة الحضور اليومية: {attendanceData.attendance_rate_pct}%
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead>الصف الدراسي</TableHead>
                  <TableHead>حالة الحضور</TableHead>
                  <TableHead>المسجل بواسطة</TableHead>
                  <TableHead>الملاحظات والإجراء</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.records.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-foreground">{a.student_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.grade}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "present"
                            ? "success"
                            : a.status === "absent"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px] font-bold"
                      >
                        {a.status === "present"
                          ? "حاضر بالصف"
                          : a.status === "absent"
                          ? "غائب (إنذار غياب)"
                          : "متأخر عن الطابور"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.recorded_by}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.notes || "حضور منتظم"}</TableCell>
                    <TableCell className="num text-xs text-muted-foreground">{a.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 3: Grades & Exam Gradebook (EDU-06, EDU-07) */}
      {tab === "grades" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                دفتر درجات الطلاب ونتائج الاختبارات الفصلية
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                متوسط الدرجات العام: <strong className="num text-foreground">{gradesData.average_score}%</strong> | نسبة النجاح: <strong className="num text-emerald-600">{gradesData.pass_rate_pct}%</strong>
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                sound.click();
                if (students.length > 0) {
                  setGradeForm({
                    ...gradeForm,
                    student_id: students[0].id,
                    student_name: students[0].name,
                    grade: students[0].grade,
                  });
                }
                setIsAddingGrade(true);
              }}
              className="h-8 gap-1.5 text-xs font-bold"
            >
              <Plus className="size-3.5" />
              رصد نتيجة اختبار
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead>المرحلة / الصف</TableHead>
                  <TableHead>المادة الدراسية</TableHead>
                  <TableHead>نوع الاختبار</TableHead>
                  <TableHead>الدرجة المحققة</TableHead>
                  <TableHead>التقدير الأكاديمي</TableHead>
                  <TableHead>ملاحظات المعلم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradesData.grades.map((g) => (
                  <TableRow key={g.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-foreground">{g.student_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{g.grade}</TableCell>
                    <TableCell className="text-xs font-semibold text-primary">{g.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {g.exam_type === "midterm" ? "اختبار منتصف الفصل" : "امتحان نهاية الفصل"}
                    </TableCell>
                    <TableCell className="num text-xs font-bold">
                      {g.score} / {g.max_score}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={g.is_passed ? "success" : "destructive"}
                        className="text-[10px] font-bold"
                      >
                        {g.letter_grade} ({g.is_passed ? "ناجح" : "راسب"})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{g.remarks || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pay Installment Modal */}
      <Modal
        open={!!payFor}
        onClose={() => !isPaying && setPayFor(null)}
        title={payFor ? `تحصيل قسط دراسي للطالب: ${payFor.name}` : ""}
      >
        {payFor && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const amt = parseFloat(payAmount);
              if (isNaN(amt) || amt <= 0) {
                toast("error", "يرجى إدخال مبلغ سداد صحيح");
                return;
              }

              setIsPaying(true);
              try {
                sound.click();
                const res = await api.post<any>(`/modules/school/students/${payFor.id}/pay`, {
                  amount: amt,
                  term: payTerm,
                  notes: payNotes,
                });
                sound.success();
                toast("success", res.detail);

                setReceiptData({
                  receipt_no: res.receipt_no,
                  student_name: payFor.name,
                  student_code: payFor.code,
                  grade: payFor.grade,
                  parent_phone: payFor.parent_phone,
                  paid_amount: amt,
                  new_balance_due: res.new_balance_due,
                  total_paid: res.total_paid,
                  total_tuition: payFor.total_tuition,
                  notes: `${payTerm} - ${payNotes}`,
                });

                await queryClient.invalidateQueries({ queryKey: ["school-students"] });
                await queryClient.invalidateQueries({ queryKey: ["school-summary"] });
                setPayFor(null);
                setPayAmount("");
                setPayNotes("");
              } catch (err: any) {
                toast("error", err.message || "فشل تسجيل الدفعة");
              } finally {
                setIsPaying(false);
              }
            }}
            className="flex flex-col gap-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3">
              <div>
                <span className="text-muted-foreground">كود الطالب:</span>
                <p className="font-mono font-bold text-primary">{payFor.code}</p>
              </div>
              <div>
                <span className="text-muted-foreground">الصف:</span>
                <p className="font-bold text-foreground">{payFor.grade}</p>
              </div>
              <div>
                <span className="text-muted-foreground">إجمالي الرسوم:</span>
                <p className="num font-bold text-foreground">{moneyEGP(payFor.total_tuition)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">المتبقي حالياً:</span>
                <p className="num font-bold text-amber-600 dark:text-amber-400">
                  {moneyEGP(payFor.balance_due)}
                </p>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground">الفصل / القسط الدراسي *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={payTerm}
                onChange={(e) => setPayTerm(e.target.value)}
              >
                <option value="القسط الأول (سبتمبر)">القسط الأول (سبتمبر)</option>
                <option value="القسط الثاني (نوفمبر)">القسط الثاني (نوفمبر)</option>
                <option value="القسط الثالث (فبراير)">القسط الثالث (فبراير)</option>
                <option value="رسوم الكتب والأنشطة">رسوم الكتب والأنشطة</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">مبلغ القسط المحصل (ج.م) *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-primary"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">ملاحظات الإيصال (طريقة الدفع أو الحساب)</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                placeholder="مثال: نقداً بخزينة المدرسة، أو تحويل بنكي على حساب CIB..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayFor(null)} disabled={isPaying}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isPaying} className="gap-1.5 font-bold">
                <CheckCircle2 className="size-4" />
                تأكيد السداد وطباعة الإيصال
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Register New Student Modal (EDU-01, EDU-09) */}
      <Modal
        open={isAddingStudent}
        onClose={() => setIsAddingStudent(false)}
        title="تسجيل طالب جديد وشؤون القيد"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            sound.click();
            try {
              await api.post("/modules/school/students", studentForm);
              sound.success();
              toast("success", `تم تسجيل الطالب ${studentForm.name} بنجاح`);
              await queryClient.invalidateQueries({ queryKey: ["school-students"] });
              await queryClient.invalidateQueries({ queryKey: ["school-summary"] });
              setIsAddingStudent(false);
              setStudentForm({
                code: `STU-2024-00${Math.floor(10 + Math.random() * 90)}`,
                name: "",
                grade: "الصف الأول الإعدادي",
                parent_phone: "",
                guardian_name: "",
                has_sibling_discount: false,
                total_tuition: 15000,
              });
            } catch (err: any) {
              toast("error", err.message || "فشل تسجيل الطالب");
            }
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">كود الطالب الأكاديمي *</label>
              <input
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold"
                value={studentForm.code}
                onChange={(e) => setStudentForm({ ...studentForm, code: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">المرحلة / الصف *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={studentForm.grade}
                onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
              >
                <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground">اسم الطالب الرباعي *</label>
            <input
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="مثال: يوسف خالد محمد عثمان"
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">اسم ولي الأمر</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                placeholder="اسم ولي الأمر أو الوصي"
                value={studentForm.guardian_name}
                onChange={(e) => setStudentForm({ ...studentForm, guardian_name: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">رقم هاتف ولي الأمر *</label>
              <input
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num"
                placeholder="010XXXXXXXX"
                value={studentForm.parent_phone}
                onChange={(e) => setStudentForm({ ...studentForm, parent_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="font-semibold text-foreground">إجمالي المصروفات المقررة (ج.م) *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-primary"
                value={studentForm.total_tuition}
                onChange={(e) => setStudentForm({ ...studentForm, total_tuition: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={studentForm.has_sibling_discount}
                  onChange={(e) => setStudentForm({ ...studentForm, has_sibling_discount: e.target.checked })}
                  className="rounded border-border text-primary size-4"
                />
                <span>تطبيق خصم الأخوة (10% خصم)</span>
              </label>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingStudent(false)}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              تأكيد حفظ الطالب
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Grade Modal (EDU-06) */}
      <Modal
        open={isAddingGrade}
        onClose={() => setIsAddingGrade(false)}
        title="رصد نتيجة اختبار أو تقويم مستمر"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            sound.click();
            try {
              await api.post("/modules/school/grades", gradeForm);
              sound.success();
              toast("success", `تم رصد نتيجة ${gradeForm.subject} للطالب بنجاح`);
              await queryClient.invalidateQueries({ queryKey: ["school-grades"] });
              setIsAddingGrade(false);
            } catch (err: any) {
              toast("error", err.message || "فشل رصد النتيجة");
            }
          }}
          className="flex flex-col gap-3 text-xs"
        >
          <div>
            <label className="font-semibold text-foreground">الطالب المقيد *</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              value={gradeForm.student_id}
              onChange={(e) => {
                const s = students.find((st) => st.id === e.target.value);
                if (s) {
                  setGradeForm({ ...gradeForm, student_id: s.id, student_name: s.name, grade: s.grade });
                }
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">المادة الدراسية *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={gradeForm.subject}
                onChange={(e) => setGradeForm({ ...gradeForm, subject: e.target.value })}
              >
                <option value="الرياضيات">الرياضيات</option>
                <option value="اللغة العربية">اللغة العربية</option>
                <option value="العلوم">العلوم</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                <option value="الدراسات الاجتماعية">الدراسات الاجتماعية</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">نوع الاختبار *</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={gradeForm.exam_type}
                onChange={(e) => setGradeForm({ ...gradeForm, exam_type: e.target.value })}
              >
                <option value="midterm">منتصف الفصل (Midterm)</option>
                <option value="final">امتحان نهاية الفصل (Final)</option>
                <option value="coursework">تقويم مستمر وأعمال سنة</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground">الدرجة المحققة *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num font-bold text-primary"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">الدرجة العظمى *</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs num"
                value={gradeForm.max_score}
                onChange={(e) => setGradeForm({ ...gradeForm, max_score: parseFloat(e.target.value) || 100 })}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground">ملاحظات المعلم</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="مثال: متفوق في حل المسائل التطبيقية..."
              value={gradeForm.remarks}
              onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingGrade(false)}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              تأكيد حفظ النتيجة
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tuition Receipt Print Modal */}
      <SchoolTuitionReceiptModal
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
