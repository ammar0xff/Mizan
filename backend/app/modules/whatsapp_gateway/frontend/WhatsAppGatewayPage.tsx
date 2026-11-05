import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/kit/card";
import { Input } from "@/components/kit/input";
import { Badge } from "@/components/kit/badge";

interface WaMessage {
  id: string;
  recipient_phone: string;
  message_type: string;
  reference_type: string | null;
  reference_id: string | null;
  template_name: string | null;
  status: string;
  provider_message_id: string | null;
  error_detail: string | null;
  created_at: string | null;
}

export default function WhatsAppGatewayPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [] } = useQuery<WaMessage[]>({
    queryKey: ["whatsapp-messages"],
    queryFn: () => api.get("/integrations/whatsapp/messages"),
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSending(true);
    try {
      await api.post("/integrations/whatsapp/send-receipt", {
        recipient_phone: phone.trim(),
        reference_type: "sale",
        template_name: "receipt_basic",
      });
      toast("success", "تم إدراج الإيصال في قائمة إرسال WhatsApp");
      setPhone("");
      qc.invalidateQueries({ queryKey: ["whatsapp-messages"] });
    } catch {
      toast("info", "تعذر الاتصال بالخادم — عُرض محلياً");
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "sent" || s === "delivered" || s === "read")
      return <Badge variant="success">{s}</Badge>;
    if (s === "failed") return <Badge variant="destructive">{s}</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold">ربط WhatsApp Business — إرسال الإيصالات</h1>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold">إرسال إيصال تجريبي</h2>
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            placeholder="رقم الهاتف (مثال: 9665XXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={sending}>
            <Send className="w-4 h-4 ms-2" />
            {sending ? "جارٍ الإرسال..." : "إرسال"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          قم بتكوين WhatsApp Cloud API Token و Phone Number ID من متجر الإضافات (إعدادات الوحدة).
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-4">سجل الرسائل</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="text-start py-2 px-3">الهاتف</th>
                <th className="text-start py-2 px-3">النوع</th>
                <th className="text-start py-2 px-3">القالب</th>
                <th className="text-start py-2 px-3">الحالة</th>
                <th className="text-start py-2 px-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-border/40">
                  <td className="py-2 px-3">{m.recipient_phone}</td>
                  <td className="py-2 px-3">{m.message_type}</td>
                  <td className="py-2 px-3">{m.template_name ?? "—"}</td>
                  <td className="py-2 px-3">{statusBadge(m.status)}</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {m.created_at ? new Date(m.created_at).toLocaleString("ar-EG") : "—"}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    لا توجد رسائل بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
