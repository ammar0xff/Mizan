import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/kit/skeleton";
import { api } from "@/lib/api";
import { Button, Card, ErrorBox, Input, Spinner } from "@/components/ui";

interface Settings {
  store_name?: string; store_phone?: string; store_address?: string;
  currency?: string; paper_size?: string; low_stock_threshold?: string;
  logo_url?: string;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => api.get<Settings>("/settings") });
  const [form, setForm] = useState<Settings>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (q.data && !dirty) setForm(q.data);
  }, [q.data, dirty]);

  const save = useMutation({
    mutationFn: () =>
      api.put("/settings", {
        store_name: form.store_name,
        store_phone: form.store_phone,
        store_address: form.store_address,
        currency: form.currency,
        paper_size: form.paper_size,
        low_stock_threshold: form.low_stock_threshold,
      }),
    onSuccess: () => { setDirty(false); qc.invalidateQueries({ queryKey: ["settings"] }); },
  });

  const fields: { key: keyof Settings; label: string; type?: string }[] = [
    { key: "store_name", label: "اسم المتجر" },
    { key: "store_phone", label: "الهاتف" },
    { key: "store_address", label: "العنوان" },
    { key: "currency", label: "العملة" },
    { key: "paper_size", label: "مقاس الورق" },
    { key: "low_stock_threshold", label: "حد المخزون المنخفض" },
  ];

  if (q.isLoading) return <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>;
  if (q.isError) return <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">إعدادات المتجر</h1>

      {form.logo_url && (
        <Card className="flex items-center gap-4">
          <img src={form.logo_url} alt="الشعار" className="h-16 w-16 rounded-xl border border-line object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="min-w-0">
            <p className="font-bold">{form.store_name}</p>
            <p className="truncate text-xs text-muted">{form.logo_url}</p>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-medium">{f.label}</label>
            <Input
              value={form[f.key] ?? ""}
              onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setDirty(true); }}
            />
          </div>
        ))}
        {save.isError && <ErrorBox message={(save.error as Error).message} />}
        <div className="flex items-center gap-2">
          <Button disabled={save.isPending || !dirty} onClick={() => save.mutate()}>
            {save.isPending ? <Spinner /> : dirty ? "حفظ التغييرات" : "لا توجد تغييرات"}
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => { setForm(q.data ?? {}); setDirty(false); }}>
              تراجع
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-2 font-bold">المتجر الإلكتروني</p>
        <p className="mb-3 text-sm text-muted">واجهة العملاء العامة تعمل تلقائياً من هذه البيانات</p>
        <a
          href="/api/storefront"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand hover:underline"
        >
          فتح المتجر ↗
        </a>
      </Card>
    </div>
  );
}
