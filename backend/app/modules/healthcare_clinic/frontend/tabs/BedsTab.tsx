import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Bed, CheckCircle2, UserPlus } from "lucide-react";
import { sound } from "@/lib/sound";
import { useClinic } from "../ClinicContext";

const moneyEGP = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export default function BedsTab() {
  const c = useClinic();
  const { beds, handleDischargeBed, handleCleanBed, setAdmitBedTarget } = c;
  return (
    <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Bed className="w-4 h-4 text-teal-400" />
                    مخطط الأجنحة وأسِرّة التنويم والعناية المركزة (Inpatient Wards)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    توزيع الغرف، معدلات الإشغال اللحظية، وتسكين وإخلاء المرضى
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> شاغر متاح
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> مشغول
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> تعقيم
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {beds.map((b: any) => (
                  <Card
                    key={b.id}
                    className={`p-4 border transition ${
                      b.status === "occupied"
                        ? "border-rose-500/40 bg-rose-500/5"
                        : b.status === "available"
                        ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70"
                        : "border-amber-500/40 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <span className="font-mono font-bold text-sm text-foreground">{b.bed_code}</span>
                      <Badge
                        variant="outline"
                        className={
                          b.status === "occupied"
                            ? "border-rose-500/40 text-rose-400 bg-rose-500/10 text-xs"
                            : b.status === "available"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                            : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs"
                        }
                      >
                        {b.status === "occupied"
                          ? "مشغول بمريض"
                          : b.status === "available"
                          ? "متاح للتسكين"
                          : "قيد التعقيم"}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="font-semibold text-foreground">{b.ward_name}</div>
                      <div className="text-muted-foreground">{b.room_number} — {b.bed_type}</div>
                      <div className="font-mono font-bold text-teal-400">{moneyEGP(b.daily_rate)} / اليوم</div>

                      {b.status === "occupied" && (
                        <div className="p-2 rounded bg-card/80 border border-border/40 mt-2 space-y-0.5 font-mono">
                          <div className="font-bold text-foreground text-xs">{b.current_patient_name}</div>
                          <div className="text-[11px] text-muted-foreground">تاريخ الدخول: {b.admission_date}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/30">
                      {b.status === "available" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            sound.click();
                            setAdmitBedTarget(b);
                          }}
                          className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          تسكين مريض بالسرير
                        </Button>
                      )}
                      {b.status === "occupied" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDischargeBed(b.id)}
                          className="w-full text-xs h-8 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1"
                        >
                          خروج المريض وإخلاء السرير
                        </Button>
                      )}
                      {b.status === "cleaning" && (
                        <Button
                          size="sm"
                          onClick={() => handleCleanBed(b.id)}
                          className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-500 text-white gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          اعتماد النظافة والجاهزية
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
  );
}