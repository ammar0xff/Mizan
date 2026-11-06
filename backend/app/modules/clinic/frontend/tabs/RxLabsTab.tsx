import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Microscope, Pill, Plus } from "lucide-react";
import { sound } from "@/lib/sound";
import { useClinic } from "../ClinicContext";

export default function RxLabsTab() {
  const c = useClinic();
  const {
    filteredRx, filteredLabs, handleDispenseRx, setIsRxModalOpen, setIsLabModalOpen,
    setLabResultModalTarget, setLabResultValue,
  } = c;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prescriptions */}
              <Card className="border-border/50 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-400" />
                    الروشتات والوصفات الطبية الإلكترونية (e-Rx)
                  </h3>
                  <Button
                    onClick={() => {
                      sound.click();
                      setIsRxModalOpen(true);
                    }}
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-7 px-2.5 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    روشتة جديدة
                  </Button>
                </div>

                <div className="divide-y divide-border/30">
                  {filteredRx.map((rx: any) => (
                    <div key={rx.id} className="p-4 space-y-2 hover:bg-muted/10 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-foreground">{rx.rx_ref}</span>
                        <Badge
                          variant="outline"
                          className={
                            rx.status === "dispensed"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                              : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                          }
                        >
                          {rx.status === "dispensed" ? "تم الصرف من الصيدلية" : "بانتظار الصرف"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted-foreground">المريض: </span>
                          <span className="font-bold text-foreground">{rx.patient_name}</span>
                        </div>
                        <div className="font-mono text-muted-foreground text-[11px]">{rx.issue_date}</div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30 space-y-1">
                        <div className="font-bold text-xs text-teal-400">{rx.medication_name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>الجرعة: {rx.dosage}</span>
                          <span>•</span>
                          <span>التكرار: {rx.frequency}</span>
                          <span>•</span>
                          <span>المدة: {rx.duration_days} يوم</span>
                        </div>
                        <div className="text-[11px] text-foreground">{rx.instructions}</div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">الطبيب: {rx.doctor_name}</span>
                        {rx.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleDispenseRx(rx.id)}
                            className="text-xs h-7 bg-teal-600 hover:bg-teal-500 text-white"
                          >
                            صرف الدواء الآن
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Diagnostic Labs */}
              <Card className="border-border/50 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-purple-400" />
                    الفحوصات والتحاليل المخبرية والتصوير الطبي
                  </h3>
                  <Button
                    onClick={() => {
                      sound.click();
                      setIsLabModalOpen(true);
                    }}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-7 px-2.5 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    طلب فحص جديد
                  </Button>
                </div>

                <div className="divide-y divide-border/30">
                  {filteredLabs.map((lab: any) => (
                    <div key={lab.id} className="p-4 space-y-2 hover:bg-muted/10 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-foreground">{lab.order_ref}</span>
                          <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {lab.specimen_barcode}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            lab.status === "reported"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                              : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                          }
                        >
                          {lab.status === "reported" ? "معتمد وموثق" : "قيد الفحص المخبري"}
                        </Badge>
                      </div>

                      <div className="font-bold text-xs text-foreground">{lab.test_name}</div>
                      <div className="text-[11px] text-muted-foreground">{lab.category} — المريض: {lab.patient_name}</div>

                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30 space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">النتيجة:</span>
                          <span className="font-bold text-teal-400">{lab.result_value}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">المعدل المرجعي:</span>
                          <span className="text-muted-foreground">{lab.reference_range}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">الطبيب: {lab.doctor_name}</span>
                        {lab.status !== "reported" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setLabResultModalTarget(lab);
                              setLabResultValue("");
                            }}
                            className="text-xs h-7 bg-purple-600 hover:bg-purple-500 text-white"
                          >
                            تسجيل النتيجة
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
  );
}