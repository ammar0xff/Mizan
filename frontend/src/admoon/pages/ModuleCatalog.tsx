/**
 * Admoon ERP Module Catalog & Dependency Engine Page.
 * 
 * Shows modular catalog, categories from modules/categories.json,
 * specialized collections (gym-pos, restaurant-pos, retail-pos),
 * dependency graph, and compatibility status.
 */
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ModuleManifest {
  id: string;
  name: string;
  name_en: string;
  category: string;
  version: string;
  icon: string;
  description: string;
  target_business_types: string[];
  dependencies: string[];
  is_core: boolean;
}

interface CategoryConfig {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  description: string;
}

export default function ModuleCatalog() {
  const [modules, setModules] = useState<ModuleManifest[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const fetchCatalog = async () => {
    try {
      const res = await api.get<{ catalog: ModuleManifest[]; categories: CategoryConfig[] }>("/modules");
      setModules(res.catalog || []);
      setCategories(res.categories || []);
    } catch {
      toast.error("فشل قراءة كتالوج الوحدات النمطية");
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const filtered = modules.filter((m) => {
    if (selectedCat !== "all" && m.category !== selectedCat) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(s) ||
        m.name_en.toLowerCase().includes(s) ||
        m.id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">كتالوج وحدات ومجموعات ERP النمطية (Module Catalog)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة المنظومة التجميعية: كاشيرات متخصصة، قطاعات رأسية، وشبكة تبعيات البرمجيات.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الوحدات..."
            className="w-full h-8 pr-9 pl-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCat("all")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
            selectedCat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          كافة الوحدات ({modules.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
              selectedCat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">{m.name}</h2>
                  <p className="text-[11px] font-mono text-muted-foreground">{m.id} • v{m.version}</p>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {m.category}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{m.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border/60 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">التبعية (Dependencies):</span>
                <span className="font-mono text-foreground">
                  {(m.dependencies || []).length > 0 ? m.dependencies.join(", ") : "لا يوجد"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الأنشطة المستهدفة:</span>
                <span className="font-mono text-primary truncate max-w-[150px]">
                  {(m.target_business_types || []).join(", ") || "كافة الأنشطة"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
