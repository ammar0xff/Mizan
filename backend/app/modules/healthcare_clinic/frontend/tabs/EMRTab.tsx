import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { HeartPulse, Plus } from "lucide-react";
import { sound } from "@/lib/sound";
import { useClinic } from "../ClinicContext";

export default function EMRTab() {
  const c = useClinic();
  const { filteredEncounters, setIsEncounterModalOpen } = c;
  return (
    <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-teal-400" />
                    سجلات الاستشارات والتشخيص السريري (Clinical Encounters)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    العلامات الحيوية (Vitals)، تصنيف الأمراض الدولي (ICD-10)، والملاحظات التخصصية
                  </p>
                </div>
                <Button
                  onClick={() => {
                    sound.click();
                    setIsEncounterModalOpen(true);
                  }}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  توثيق كشف سريري جديد
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEncounters.map((enc: any) => (
                  <Card key={enc.id} className="p-4 border-border/50 space-y-3 bg-card/60 backdrop-blur shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-foreground">{enc.encounter_ref}</span>
                        <span className="text-xs text-muted-foreground mr-2 font-mono">({enc.encounter_date})</span>
                      </div>
                      <Badge variant="outline" className="border-teal-500/40 text-teal-400 bg-teal-500/10 text-xs font-mono">
                        ICD-10: {enc.icd10_code}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground">المريض: </span>
                        <span className="font-bold text-foreground">{enc.patient_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الطبيب: </span>
                        <span className="font-medium text-foreground">{enc.doctor_name} ({enc.department})</span>
                      </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-5 gap-2 p-2 rounded-lg bg-muted/30 border border-border/30 text-center font-mono">
                      <div>
                        <div className="text-[10px] text-muted-foreground">ضغط الدم BP</div>
                        <div className="text-xs font-bold text-foreground">{enc.bp_systolic}/{enc.bp_diastolic}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">النبض HR</div>
                        <div className="text-xs font-bold text-foreground">{enc.heart_rate} bpm</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">الحرارة Temp</div>
                        <div className="text-xs font-bold text-foreground">{enc.temperature} °C</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">الأكسجين SpO2</div>
                        <div className="text-xs font-bold text-foreground">{enc.spo2}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">التشخيص الدولي</div>
                        <div className="text-xs font-bold text-teal-400">{enc.icd10_code}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">الشكوى الأولية:</div>
                      <div className="text-xs text-foreground font-medium mt-0.5">{enc.chief_complaint}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">التشخيص والملاحظات السريرية وخطة العلاج:</div>
                      <div className="text-xs text-foreground bg-muted/20 p-2 rounded border border-border/30 mt-1 leading-relaxed">
                        <span className="font-semibold text-teal-400">[{enc.icd10_description}]</span> {enc.clinical_notes}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
  );
}