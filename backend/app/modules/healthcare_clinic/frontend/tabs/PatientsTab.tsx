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
import { AlertCircle, UserPlus, Users } from "lucide-react";
import { sound } from "@/lib/sound";
import { useClinic } from "../ClinicContext";

export default function PatientsTab() {
  const c = useClinic();
  const {
    filteredPatients, setIsPatientModalOpen, setIsBookingOpen,
    setBookingForm, setIsRxModalOpen, setRxForm, bookingForm, rxForm,
  } = c;
  return (
    <Card className="border-border/50 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-400" />
                    سجل المرضى المعتمد (Master Patient Index - EMR)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    الملفات الطبية الرقمية، أرقام السجل الطبي (MRN)، الحساسيات الدوائية، والشركات الضامنة
                  </p>
                </div>
                <Button
                  onClick={() => {
                    sound.click();
                    setIsPatientModalOpen(true);
                  }}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8 gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  تسجيل مريض جديد
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right">رقم الملف (MRN) والمريض</TableHead>
                    <TableHead className="text-right">الرقم القومي والتواصل</TableHead>
                    <TableHead className="text-center">فصيلة الدم والميلاد</TableHead>
                    <TableHead className="text-right">الحساسيات والأمراض المزمنة</TableHead>
                    <TableHead className="text-right">التأمين والتحمل</TableHead>
                    <TableHead className="text-center">إجراءات سريرية سريعة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((pat: any) => (
                    <TableRow key={pat.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-bold text-foreground text-xs">{pat.full_name}</div>
                        <Badge variant="outline" className="font-mono text-[10px] mt-0.5 text-teal-400 border-teal-500/30">
                          {pat.patient_mrn}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-foreground">{pat.phone}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{pat.national_id}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">
                          {pat.blood_group}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{pat.date_of_birth} ({pat.gender})</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {pat.allergies}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{pat.chronic_conditions}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-foreground">{pat.insurance_provider}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          تحمل المريض: {pat.copay_percent}% {pat.insurance_policy_no !== "N/A" && `(${pat.insurance_policy_no})`}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBookingForm({
                                ...bookingForm,
                                patient_id: pat.id,
                                patient_name: pat.full_name,
                              });
                              setIsBookingOpen(true);
                            }}
                            className="text-[10px] h-7 px-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                          >
                            حجز كشف
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRxForm({
                                ...rxForm,
                                patient_id: pat.id,
                                patient_name: pat.full_name,
                              });
                              setIsRxModalOpen(true);
                            }}
                            className="text-[10px] h-7 px-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          >
                            روشتة
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
  );
}