import { Badge } from "@/components/kit/badge";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/kit/table";
import { Calendar, CheckCircle2, Plus } from "lucide-react";
import { sound } from "@/lib/sound";
import { useClinic } from "../ClinicContext";

const moneyEGP = (amount: number) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export default function AppointmentsTab() {
  const c = useClinic();
  const { filteredAppts, handleBillAppointment, handleUpdateApptStatus, setIsBookingOpen } = c;
  return (
    <Card className="border-border/50 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    جدول العيادات اليومية وقائمة النداء (Appointments & Queue)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تنظيم دخول المرضى، مواعيد الاستشارة، وتحصيل أتعاب الكشوفات
                  </p>
                </div>
                <Button
                  onClick={() => {
                    sound.click();
                    setIsBookingOpen(true);
                  }}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  حجز موعد كشف
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right">رقم الموعد والدور</TableHead>
                    <TableHead className="text-right">اسم المريض والشكوى</TableHead>
                    <TableHead className="text-right">الطبيب والعيادة</TableHead>
                    <TableHead className="text-center">الموعد والتوقيت</TableHead>
                    <TableHead className="text-right">أتعاب الكشف</TableHead>
                    <TableHead className="text-center">حالة الدور</TableHead>
                    <TableHead className="text-center">الإجراءات السريرية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppts.map((a: any) => (
                    <TableRow key={a.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-mono font-bold text-foreground text-xs">{a.appointment_ref}</div>
                        <Badge variant="outline" className="font-mono text-[10px] mt-0.5 text-teal-400 border-teal-500/30">
                          الدور #{a.queue_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground text-xs">{a.patient_name}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">{a.chief_complaint}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-foreground">{a.doctor_name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.department}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <div className="text-xs text-foreground">{a.appointment_date}</div>
                        <div className="text-[11px] text-muted-foreground">{a.time_slot}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {moneyEGP(a.consultation_fee)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            a.status === "in_consultation"
                              ? "border-teal-500/40 text-teal-400 bg-teal-500/10 text-[10px]"
                              : a.status === "waiting"
                              ? "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                              : a.status === "completed"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                              : "border-border text-muted-foreground text-[10px]"
                          }
                        >
                          {a.status === "in_consultation"
                            ? "بالكشف حالياً"
                            : a.status === "waiting"
                            ? "بقائمة الانتظار"
                            : a.status === "completed"
                            ? "مكتمل الكشف"
                            : "مجدول"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {a.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateApptStatus(a.id, "waiting")}
                              className="text-[10px] h-7 px-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                            >
                              استدعاء للانتظار
                            </Button>
                          )}
                          {a.status === "waiting" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateApptStatus(a.id, "in_consultation")}
                              className="text-[10px] h-7 px-2 bg-teal-600 hover:bg-teal-500 text-white"
                            >
                              بدء الكشف الطبي
                            </Button>
                          )}
                          {a.status === "in_consultation" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateApptStatus(a.id, "completed")}
                              className="text-[10px] h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              إنهاء واعتماد
                            </Button>
                          )}
                          {a.status === "completed" && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تم الكشف
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBillAppointment(a.id)}
                                className="text-[10px] h-7 px-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                              >
                                إصدار فاتورة
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
  );
}