import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  FlaskConical,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Utensils,
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

interface FodSummary {
  active_batches_count: number;
  quarantined_batches_count: number;
  ccp_compliance_percent: number;
  average_yield_loss_pct: number;
  pending_lab_samples_count: number;
  total_recipes_count: number;
}

interface FodRecipeIngredient {
  id: string;
  ingredient_code: string;
  ingredient_name: string;
  standard_qty: number;
  uom: string;
  potency_factor: number;
  is_allergen: boolean;
  allergen_type?: string;
}

interface FodRecipe {
  id: string;
  recipe_code: string;
  product_name: string;
  base_batch_size: number;
  uom: string;
  target_yield_pct: number;
  standard_loss_pct: number;
  shelf_life_days: number;
  ingredients: FodRecipeIngredient[];
}

interface FodBatchOrder {
  id: string;
  batch_number: string;
  recipe_id?: string;
  recipe_code?: string;
  product_name: string;
  target_qty: number;
  actual_yield_qty: number;
  yield_loss_pct: number;
  status: "staging" | "mixing" | "cooking" | "cooling" | "packaging" | "qc_quarantine" | "released";
  start_date?: string;
  expiry_date?: string;
  supervisor_name: string;
  notes?: string;
}

interface FodHaccpLog {
  id: string;
  batch_id?: string;
  batch_number: string;
  ccp_point: string;
  reading_value: string;
  standard_limit: string;
  is_compliant: boolean;
  recorded_at: string;
  operator_name: string;
  corrective_action?: string;
}

interface FodQaLabSample {
  id: string;
  sample_ref: string;
  batch_id?: string;
  batch_number?: string;
  test_name: string;
  result_value: string;
  spec_limit: string;
  status: "pass" | "pending" | "fail";
  tested_by: string;
}

interface FodTraceabilityRecall {
  id: string;
  simulation_ref: string;
  suspect_ingredient_lot: string;
  affected_batches_count: number;
  distributed_units_count: number;
  audit_duration_mins: number;
  is_within_iso_30min: boolean;
}

export default function FoodProcessingPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "recipes" | "haccp" | "lab" | "recall">("batches");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [isNewHaccpOpen, setIsNewHaccpOpen] = useState(false);
  const [isNewLabOpen, setIsNewLabOpen] = useState(false);
  const [targetBatch, setTargetBatch] = useState<FodBatchOrder | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<FodSummary>({
    queryKey: ["fodSummary"],
    queryFn: () => api.get<FodSummary>("/fod/summary"),
  });

  const { data: batches = [], isLoading: isBatchesLoading } = useQuery<FodBatchOrder[]>({
    queryKey: ["fodBatches"],
    queryFn: () => api.get<FodBatchOrder[]>("/fod/batches"),
  });

  const { data: recipes = [], isLoading: isRecipesLoading } = useQuery<FodRecipe[]>({
    queryKey: ["fodRecipes"],
    queryFn: () => api.get<FodRecipe[]>("/fod/recipes"),
  });

  const { data: haccpLogs = [] } = useQuery<FodHaccpLog[]>({
    queryKey: ["fodHaccpLogs"],
    queryFn: () => api.get<FodHaccpLog[]>("/fod/haccp-logs"),
  });

  const { data: labSamples = [] } = useQuery<FodQaLabSample[]>({
    queryKey: ["fodLabSamples"],
    queryFn: () => api.get<FodQaLabSample[]>("/fod/lab-samples"),
  });

  const { data: recalls = [] } = useQuery<FodTraceabilityRecall[]>({
    queryKey: ["fodRecalls"],
    queryFn: () => api.get<FodTraceabilityRecall[]>("/fod/recalls"),
  });

  // Forms
  const [newBatch, setNewBatch] = useState({
    batch_number: `BAT-YOG-2026-${Math.floor(100 + Math.random() * 900)}`,
    product_name: "زبادي طبيعي كامل الدسم 170 جم",
    target_qty: 5000,
    start_date: new Date().toISOString().split("T")[0],
    expiry_date: "2026-11-23",
    supervisor_name: "م/ خالد العوضي",
    notes: "تشغيلة مطابقة لمعايير سلامة الغذاء ISO 22000",
  });

  const [newHaccp, setNewHaccp] = useState({
    ccp_point: "CCP-1: حرارة البسترة الفجائية HTST Pasteurization",
    reading_value: "86.2°C / 18 sec",
    standard_limit: "85.0°C - 88.0°C",
    is_compliant: true,
    recorded_at: "2026-11-02 14:30",
    operator_name: "الفني / عاطف جاد",
    corrective_action: "",
  });

  const [newLab, setNewLab] = useState({
    sample_ref: `LAB-SMP-${Math.floor(100 + Math.random() * 900)}`,
    test_name: "العد الكلي للبكتيريا الهوائية Total Aerobic Count",
    result_value: "< 10 CFU/g (مطابق)",
    spec_limit: "Max 50 CFU/g",
    status: "pass" as const,
    tested_by: "د. نهال رضوان (ميكروبيولوجي)",
  });

  // Actions
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/fod/batches", newBatch);
      queryClient.invalidateQueries({ queryKey: ["fodBatches"] });
      queryClient.invalidateQueries({ queryKey: ["fodSummary"] });
      setIsNewBatchOpen(false);
      sound.click();
      toast("success", "تم إصدار تشغيلة الإنتاج الغذائي وتحديد تاريخ الصلاحية بنجاح");
    } catch {
      toast("error", "تعذر إصدار تشغيلة الإنتاج");
    }
  };

  const handleUpdateBatchStatus = async (batchId: string, nextStatus: string, actualYield: number) => {
    try {
      await api.post(`/fod/batches/${batchId}/status`, {
        status: nextStatus,
        actual_yield_qty: actualYield,
      });
      queryClient.invalidateQueries({ queryKey: ["fodBatches"] });
      queryClient.invalidateQueries({ queryKey: ["fodSummary"] });
      setTargetBatch(null);
      sound.click();
      toast("success", `تم نقل التشغيلة إلى مرحلة ${nextStatus}`);
    } catch {
      toast("error", "تعذر تحديث مرحلة التشغيلة");
    }
  };

  const handleCreateHaccp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/fod/haccp-logs", newHaccp);
      queryClient.invalidateQueries({ queryKey: ["fodHaccpLogs"] });
      queryClient.invalidateQueries({ queryKey: ["fodSummary"] });
      setIsNewHaccpOpen(false);
      sound.click();
      toast("success", "تم تسجيل قراءة نقطة التحكم الحرجة CCP بنجاح");
    } catch {
      toast("error", "تعذر تسجيل قراءة HACCP");
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/fod/lab-samples", newLab);
      queryClient.invalidateQueries({ queryKey: ["fodLabSamples"] });
      queryClient.invalidateQueries({ queryKey: ["fodSummary"] });
      setIsNewLabOpen(false);
      sound.click();
      toast("success", "تم تسجيل نتيجة التحليل المخبري بنجاح");
    } catch {
      toast("error", "تعذر تسجيل التحليل المخبري");
    }
  };

  const handleTriggerRecall = async () => {
    try {
      await api.post("/fod/recalls/simulate", { suspect_ingredient_lot: "LOT-SMP-IRISH-221B" });
      queryClient.invalidateQueries({ queryKey: ["fodRecalls"] });
      queryClient.invalidateQueries({ queryKey: ["fodSummary"] });
      sound.click();
      toast("success", "تم إنجاز محاكاة الاستدعاء التتبعي الشامل في 8.5 دقيقة (< 30 دقيقة ISO 22000)");
    } catch {
      toast("error", "تعذر تنفيذ محاكاة الاستدعاء");
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Utensils className="h-7 w-7 text-brand" />
            الصناعات الغذائية والمشروبات (HACCP / FEFO)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            وصفات الخلط، سلامة الغذاء ونقاط التحكم الحرجة (CCP)، السحب التجريبي Mock Recall، ومراقبة الصلاحيات وحساب الفواقد
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "batches" && (
            <Button onClick={() => setIsNewBatchOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تشغيلة إنتاج جديدة (Batch Order)
            </Button>
          )}
          {activeTab === "haccp" && (
            <Button onClick={() => setIsNewHaccpOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل قراءة CCP
            </Button>
          )}
          {activeTab === "lab" && (
            <Button onClick={() => setIsNewLabOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              تسجيل عينة مختبر
            </Button>
          )}
          {activeTab === "recall" && (
            <Button onClick={handleTriggerRecall} className="gap-2 bg-rose-600 hover:bg-rose-700">
              <RefreshCw className="h-4 w-4" />
              محاكاة استدعاء فوري (Mock Recall)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Clock className="h-4 w-4 text-amber-500" />
            التشغيلات النشطة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-amber-500">
              {summary?.active_batches_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            تشغيلات في الحجر الصحي
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-rose-500">
              {summary?.quarantined_batches_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            مطابقة نقاط HACCP
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-emerald-500">
              {summary?.ccp_compliance_percent || 0}%
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Percent className="h-4 w-4 text-violet-500" />
            متوسط فاقد التبخير والطهي
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-violet-500">
              {summary?.average_yield_loss_pct || 0}%
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <FlaskConical className="h-4 w-4 text-blue-500" />
            عينات قيد التحليل المخبري
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-blue-500">
              {summary?.pending_lab_samples_count || 0}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
            <Boxes className="h-4 w-4 text-teal-500" />
            الوصفات المعتمدة
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-mono font-bold text-teal-500">
              {summary?.total_recipes_count || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "batches" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("batches")}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            أوامر التشغيل وتتبع الدفعات
          </Button>
          <Button
            variant={activeTab === "recipes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("recipes")}
            className="gap-2"
          >
            <Boxes className="h-4 w-4" />
            وصفات الخلط ومعايرة التركيبات
          </Button>
          <Button
            variant={activeTab === "haccp" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("haccp")}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            نقاط التحكم الحرجة (HACCP)
          </Button>
          <Button
            variant={activeTab === "lab" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("lab")}
            className="gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            المختبر والميكروبيولوجي
          </Button>
          <Button
            variant={activeTab === "recall" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("recall")}
            className="gap-2"
          >
            <Compass className="h-4 w-4" />
            محاكي الاستدعاء (Mock Recall)
          </Button>
        </div>

        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم التشغيلة، المنتج، الاختبار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* TAB 1: Batches */}
      {activeTab === "batches" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم التشغيلة Lot</TableHead>
                <TableHead>المنتج الغذائي</TableHead>
                <TableHead>الكمية المستهدفة</TableHead>
                <TableHead>الإنتاج الفعلي / الفاقد</TableHead>
                <TableHead>المرحلة الحالية</TableHead>
                <TableHead>تاريخ الإنتاج / الصلاحية FEFO</TableHead>
                <TableHead>المشرف المسؤول</TableHead>
                <TableHead>الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBatchesLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Skeleton className="h-8 w-48 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد تشغيلات إنتاج مسجلة حالياً
                  </TableCell>
                </TableRow>
              ) : (
                batches
                  .filter((b) => b.batch_number.includes(searchTerm) || b.product_name.includes(searchTerm))
                  .map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-bold text-foreground">{b.batch_number}</TableCell>
                      <TableCell className="font-semibold">{b.product_name}</TableCell>
                      <TableCell className="font-mono">{b.target_qty} كجم</TableCell>
                      <TableCell className="font-mono">
                        <span className="text-emerald-500 font-bold">{b.actual_yield_qty} كجم</span>
                        {b.yield_loss_pct > 0 && (
                          <span className="text-rose-500 text-xs mr-1">(-{b.yield_loss_pct}%)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            b.status === "released"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : b.status === "qc_quarantine"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                          }
                        >
                          {b.status === "released"
                            ? "مُفرَج للبيع"
                            : b.status === "cooling"
                            ? "تبريد وتحضين"
                            : b.status === "packaging"
                            ? "تعبئة وتغليف"
                            : b.status === "qc_quarantine"
                            ? "حجر مخبري"
                            : "تجهيز خامات"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {b.start_date} <span className="text-amber-400 font-bold">إلى {b.expiry_date}</span>
                      </TableCell>
                      <TableCell className="text-sm">{b.supervisor_name}</TableCell>
                      <TableCell>
                        {b.status !== "released" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTargetBatch(b)}
                          >
                            تحديث المرحلة
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

      {/* TAB 2: Recipes */}
      {activeTab === "recipes" && (
        <div className="space-y-6">
          {isRecipesLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            recipes.map((r) => (
              <Card key={r.id} className="p-5 border-border/60 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-border/40 gap-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg text-brand">{r.recipe_code}</span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                        تركيبة قياسية معتمدة
                      </Badge>
                    </div>
                    <div className="text-base font-bold text-foreground mt-1">{r.product_name}</div>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <div>
                      <div className="text-muted-foreground">حجم التشغيلة القياسي</div>
                      <div className="text-base font-bold text-foreground">{r.base_batch_size} {r.uom}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">الصلاحية المستهدفة</div>
                      <div className="text-base font-bold text-amber-400">{r.shelf_life_days} يوماً</div>
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>كود المكون</TableHead>
                      <TableHead>المكون الخام / الإضافات</TableHead>
                      <TableHead>الكمية القياسية</TableHead>
                      <TableHead>معامل الفاعلية / التركيز</TableHead>
                      <TableHead>مسببات الحساسية Allergens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.ingredients.map((ing) => (
                      <TableRow key={ing.id}>
                        <TableCell className="font-mono text-xs">{ing.ingredient_code}</TableCell>
                        <TableCell className="font-semibold">{ing.ingredient_name}</TableCell>
                        <TableCell className="font-mono">{ing.standard_qty} {ing.uom}</TableCell>
                        <TableCell className="font-mono">{ing.potency_factor}x</TableCell>
                        <TableCell>
                          {ing.is_allergen ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-xs flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              {ing.allergen_type || "مسبب حساسية"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">خالٍ من المسببات</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: HACCP */}
      {activeTab === "haccp" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نقطة التحكم الحرجة (CCP)</TableHead>
                <TableHead>رقم التشغيلة</TableHead>
                <TableHead>القراءة المسجلة</TableHead>
                <TableHead>الحدود الحرجة المسموحة</TableHead>
                <TableHead>حالة المطابقة</TableHead>
                <TableHead>وقت التسجيل</TableHead>
                <TableHead>المسؤول</TableHead>
                <TableHead>الإجراء التصحيحي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {haccpLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-semibold">{log.ccp_point}</TableCell>
                  <TableCell className="font-mono text-xs">{log.batch_number}</TableCell>
                  <TableCell className="font-mono font-bold text-foreground">{log.reading_value}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{log.standard_limit}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        log.is_compliant
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                      }
                    >
                      {log.is_compliant ? "مطابق وآمن" : "تجاوز للحدود"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.recorded_at}</TableCell>
                  <TableCell className="text-sm">{log.operator_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {log.corrective_action || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 4: Lab Samples */}
      {activeTab === "lab" && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>كود العينة</TableHead>
                <TableHead>التشغيلة</TableHead>
                <TableHead>الفحص الميكروبيولوجي / الكيميائي</TableHead>
                <TableHead>النتيجة المعملية</TableHead>
                <TableHead>المواصفة القياسية المصرية</TableHead>
                <TableHead>القرار</TableHead>
                <TableHead>أخصائي التحاليل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labSamples.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-bold text-foreground">{s.sample_ref}</TableCell>
                  <TableCell className="font-mono text-xs">{s.batch_number || "—"}</TableCell>
                  <TableCell className="font-semibold">{s.test_name}</TableCell>
                  <TableCell className="font-mono font-bold text-emerald-400">{s.result_value}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{s.spec_limit}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.status === "pass"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }
                    >
                      {s.status === "pass" ? "مطابق للمواصفة" : "قيد الاختبار"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{s.tested_by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 5: Mock Recall */}
      {activeTab === "recall" && (
        <div className="space-y-4">
          <Card className="p-5 border-border/60 bg-muted/10 space-y-2">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
              <FileCheck className="h-5 w-5 text-brand" />
              سجل محاكاة الاستدعاء التتبعي السريع (ISO 22000 / FDA Mock Recall)
            </h3>
            <p className="text-sm text-muted-foreground">
              يشترط معيار سلامة الغذاء العالمي إمكانية تتبع أي دفعة مشتبه بها من المواد الخام إلى كامل المنتجات الموزعة والعملاء في أقل من 30 دقيقة.
            </p>
          </Card>

          <Card className="border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المحاكاة</TableHead>
                  <TableHead>دفعة الخام المشتبه بها</TableHead>
                  <TableHead>التشغيلات المتأثرة</TableHead>
                  <TableHead>العبوات الموزعة في السوق</TableHead>
                  <TableHead>زمن التتبع الفعلي</TableHead>
                  <TableHead>الامتثال لمعيار ISO 22000 (&lt; 30 دقيقة)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recalls.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-bold text-foreground">{r.simulation_ref}</TableCell>
                    <TableCell className="font-mono text-rose-400 font-bold">{r.suspect_ingredient_lot}</TableCell>
                    <TableCell className="font-mono">{r.affected_batches_count} تشغيلات</TableCell>
                    <TableCell className="font-mono font-bold">{r.distributed_units_count.toLocaleString()} عبوة</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-400">{r.audit_duration_mins} دقيقة</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        ناجح ومطابق للاعتماد الدولي
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* MODAL: New Batch */}
      {isNewBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-brand" />
                إصدار تشغيلة إنتاج غذائي جديدة
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewBatchOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">رقم التشغيلة (Batch Lot Number)</label>
                <Input
                  value={newBatch.batch_number}
                  onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">المنتج الغذائي</label>
                <Input
                  value={newBatch.product_name}
                  onChange={(e) => setNewBatch({ ...newBatch, product_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">الكمية المستهدفة (كجم)</label>
                  <Input
                    type="number"
                    value={newBatch.target_qty}
                    onChange={(e) => setNewBatch({ ...newBatch, target_qty: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">تاريخ انتهاء الصلاحية FEFO</label>
                  <Input
                    type="date"
                    value={newBatch.expiry_date}
                    onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">المشرف المسؤول</label>
                <Input
                  value={newBatch.supervisor_name}
                  onChange={(e) => setNewBatch({ ...newBatch, supervisor_name: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewBatchOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إصدار التشغيلة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: Update Batch Stage */}
      {targetBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                تحديث مرحلة التشغيلة وتسجيل الإنتاج
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setTargetBatch(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm">
              التشغيلة: <span className="font-mono font-bold">{targetBatch.batch_number}</span>
              <br />
              المنتج: <span className="font-semibold">{targetBatch.product_name}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold mb-1 block">المرحلة التالية</label>
                <select id="stageSelect" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="packaging">تعبئة وتغليف آلي</option>
                  <option value="qc_quarantine">حجر مخبري وتحاليل QA</option>
                  <option value="released">إفراج نهائي وتوزيع FEFO</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">الإنتاج الفعلي المحقق (كجم)</label>
                <Input
                  type="number"
                  defaultValue={targetBatch.target_qty * 0.97}
                  id="actualYieldInput"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setTargetBatch(null)}>
                إلغاء
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  const stage = (document.getElementById("stageSelect") as HTMLSelectElement)?.value || "released";
                  const yieldVal = Number((document.getElementById("actualYieldInput") as HTMLInputElement)?.value || targetBatch.target_qty);
                  handleUpdateBatchStatus(targetBatch.id, stage, yieldVal);
                }}
              >
                تأكيد النقل وحساب الفاقد
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: New CCP Log */}
      {isNewHaccpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand" />
                تسجيل قراءة نقطة تحكم حرجة (HACCP CCP)
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewHaccpOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateHaccp} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">نقطة التحكم</label>
                <Input
                  value={newHaccp.ccp_point}
                  onChange={(e) => setNewHaccp({ ...newHaccp, ccp_point: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">القراءة المسجلة</label>
                  <Input
                    value={newHaccp.reading_value}
                    onChange={(e) => setNewHaccp({ ...newHaccp, reading_value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">الحد المسموح</label>
                  <Input
                    value={newHaccp.standard_limit}
                    onChange={(e) => setNewHaccp({ ...newHaccp, standard_limit: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewHaccpOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تسجيل القراءة</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: New Lab Test */}
      {isNewLabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4 border-border shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-brand" />
                تسجيل فحص مخبري وميكروبيولوجي
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsNewLabOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateLab} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">كود العينة</label>
                <Input
                  value={newLab.sample_ref}
                  onChange={(e) => setNewLab({ ...newLab, sample_ref: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">اسم الفحص الميكروبيولوجي</label>
                <Input
                  value={newLab.test_name}
                  onChange={(e) => setNewLab({ ...newLab, test_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">النتيجة المعملية</label>
                  <Input
                    value={newLab.result_value}
                    onChange={(e) => setNewLab({ ...newLab, result_value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">حد المواصفة القياسية</label>
                  <Input
                    value={newLab.spec_limit}
                    onChange={(e) => setNewLab({ ...newLab, spec_limit: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewLabOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ التحليل</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
