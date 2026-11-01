/**
 * PAGE CONTRACT
 * Page: المنتجات (/products)
 * User: أمين مخزن أو مدير يدير الكتالوج (إضافة/تعديل صنف)
 * Outcome: العثور على صنف وفتحه للتعديل، أو إضافة صنف جديد
 * Primary information: الاسم، الكود، أسعار التجزئة/الجملة، حالة النشاط
 * Primary action (per state): populated → فتح صنف (الصف)؛ filtered-empty → «مسح البحث»؛ first-empty → «منتج جديد»؛ error → «إعادة المحاولة»
 * Secondary action: «منتج جديد» دائمًا في رأس الصفحة
 * Required states: loading (skeleton), error (retry), filtered-empty (reset), first-use-empty, populated
 * Responsive: 1440 جدول كامل؛ 768 إخفاء الجملة/الشركة؛ 390 كود + اسم مقصوص + تجزئة + حالة
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { Button, Empty, ErrorBox, Modal, Select, Spinner, Input } from "@/components/ui";
import { PageHeader, SearchField, TablePagination, TableShell } from "@/components/app/shared";
import { Badge as KitBadge } from "@/components/kit/badge";
import { Skeleton } from "@/components/kit/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/table";

interface Product {
  id: string; name: string; code: string | null; barcode: string | null; unit: string;
  retail_price: string; wholesale_price: string; cost_price: string; company: string | null;
  size: string | null; is_active: boolean; subcategory_id: string | null;
}
interface Subcategory { id: string; name: string; category_id: string }

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [form, setForm] = useState({ name: "", barcode: "", unit: "قطعة", retail_price: "", wholesale_price: "", cost_price: "", subcategory_id: "" });

  const list = useQuery({
    queryKey: ["products", search, page],
    queryFn: () => api.get<{ items: Product[]; total: number; pages: number }>("/products", { search: search || undefined, page, page_size: 25 }),
  });
  const subs = useQuery({ queryKey: ["subcategories"], queryFn: () => api.get<Subcategory[]>("/subcategories") });

  function openNew() {
    setForm({ name: "", barcode: "", unit: "قطعة", retail_price: "", wholesale_price: "", cost_price: "", subcategory_id: "" });
    setEditing({});
  }
  function openEdit(p: Product) {
    setForm({
      name: p.name, barcode: p.barcode ?? "", unit: p.unit,
      retail_price: p.retail_price, wholesale_price: p.wholesale_price,
      cost_price: p.cost_price, subcategory_id: p.subcategory_id ?? "",
    });
    setEditing(p);
  }

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name, barcode: form.barcode || null, unit: form.unit,
        retail_price: form.retail_price, wholesale_price: form.wholesale_price,
        cost_price: form.cost_price, subcategory_id: form.subcategory_id || null,
      };
      return editing?.id
        ? api.put(`/products/${editing.id}`, body)
        : api.post("/products", body);
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const totalPages = list.data?.pages ?? 1;
  const total = list.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المنتجات"
        description={`${total} صنف في الكتالوج`}
        actions={
          <Button onClick={openNew}><Plus size={16} /> منتج جديد</Button>
        }
      />

      <SearchField
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="ابحث بالاسم أو الكود أو الباركود…"
      />

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : list.isError ? (
        <ErrorBox message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : !list.data!.items.length ? (
        <Empty
          text={search ? "لا توجد نتائج للبحث" : "لا توجد منتجات بعد"}
          hint={search ? `لا يوجد صنف يطابق «${search}» — امسح البحث وحاول مجددًا.` : "أضف أول منتج لتبدأ الكتالوج."}
          action={search ? (
            <Button variant="outline" onClick={() => { setSearch(""); setPage(1); }}>مسح البحث</Button>
          ) : (
            <Button onClick={openNew}><Plus size={16} /> منتج جديد</Button>
          )}
        />
      ) : (
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead className="hidden md:table-cell">الشركة</TableHead>
                <TableHead className="text-end">تجزئة</TableHead>
                <TableHead className="hidden sm:table-cell text-end">جملة</TableHead>
                <TableHead className="hidden lg:table-cell">الوحدة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data!.items.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                  <TableCell className="num text-xs text-muted-foreground" dir="ltr">{p.code ?? "—"}</TableCell>
                  <TableCell className="w-full max-w-0 truncate font-medium">{p.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{p.company ?? "—"}</TableCell>
                  <TableCell className="num text-end font-semibold">{money(p.retail_price)}</TableCell>
                  <TableCell className="num hidden sm:table-cell text-end">{money(p.wholesale_price)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{p.unit}</TableCell>
                  <TableCell>
                    <KitBadge variant={p.is_active ? "success" : "secondary"}>{p.is_active ? "نشط" : "موقوف"}</KitBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      )}

      <TablePagination
        page={page}
        pages={totalPages}
        onPage={(p) => setPage(p)}
        pageSize={25}
        onPageSize={() => setPage(1)}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل منتج" : "منتج جديد"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!save.isPending && form.name && form.retail_price) save.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم *</label>
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">الباركود</label>
              <Input className="num" dir="ltr" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">الوحدة</label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">تجزئة *</label>
              <Input className="num" inputMode="decimal" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">جملة</label>
              <Input className="num" inputMode="decimal" value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">التكلفة</label>
              <Input className="num" inputMode="decimal" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">التصنيف</label>
            <Select value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}>
              <option value="">— بدون —</option>
              {subs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          {save.isError && <ErrorBox message={(save.error as Error).message} />}
          <Button
            type="submit"
            className="w-full h-10 font-bold"
            disabled={save.isPending || !form.name || !form.retail_price}
          >
            {save.isPending ? <Spinner /> : "حفظ المنتج"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
