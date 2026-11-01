/**
 * Admoon Database Providers & Tenancy Engine Page.
 * 
 * Supports PostgreSQL, Neon Serverless, MySQL VPS, SQLite Local, and Firebase Firestore.
 * Real connection tests, migration triggers, and telemetry.
 */
import { useState } from "react";
import { Database, RefreshCw, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { toast } from "sonner";

interface ProviderCard {
  id: string;
  name: string;
  type: string;
  strategy: string;
  defaultHost: string;
  desc: string;
}

const PROVIDERS: ProviderCard[] = [
  {
    id: "postgres_neon",
    name: "Neon Serverless PostgreSQL",
    type: "Serverless SQL",
    strategy: "Separate Isolated Branch per Tenant",
    defaultHost: "ep-rough-field.eu-central-1.aws.neon.tech",
    desc: "محرك PostgreSQL سحابي متطور يقدم تفرعات لحظية وعزل تام للبيانات مع توسع تلقائي.",
  },
  {
    id: "postgres_shared",
    name: "PostgreSQL 16 (Local/Shared)",
    type: "Relational SQL",
    strategy: "Shared DB with Isolated Schemas",
    defaultHost: "localhost:5433",
    desc: "المحرك الأساسي المحلي المشترك عالي الأداء مع تطبيق سياسات العزل وحماية المستأجرين.",
  },
  {
    id: "mysql",
    name: "MySQL 8.0 on Dedicated VPS",
    type: "VPS Dedicated SQL",
    strategy: "Separate Database Server",
    defaultHost: "192.168.1.100:3306",
    desc: "محرك MySQL مخصص للخوادم الافتراضية والمنشآت التي تتطلب سيرفر خاص مستقل.",
  },
  {
    id: "sqlite_local",
    name: "SQLite Local Embedded",
    type: "File-based Embedded",
    strategy: "Local File Isolation (.db)",
    defaultHost: "data/tenant.db",
    desc: "قاعدة بيانات محلية مدمجة مخصصة للعمل المكتبي (.exe) دون أي حاجة للاتصال بالإنترنت.",
  },
  {
    id: "firestore",
    name: "Google Cloud Firestore (NoSQL)",
    type: "Document NoSQL",
    strategy: "Collections & Security Rules",
    defaultHost: "firestore.googleapis.com",
    desc: "قاعدة بيانات وثائقية سحابية موزعة وغير علائقية للمنشآت ذات المعاملات الفورية المتزامنة.",
  },
];

export default function DatabaseConfig() {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const testProvider = async (pId: string) => {
    try {
      setTestingId(pId);
      const res = await api.get(`/admoon/database-providers/test?engine=${pId}`);
      setTestResults((prev) => ({ ...prev, [pId]: res }));
      toast.success(`تم اختبار اتصال '${pId}' بنجاح`);
    } catch {
      toast.error(`فشل اختبار الاتصال بـ ${pId}`);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground">محركات وقواعد بيانات المنظومة (Database Providers)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة استراتيجيات قواعد البيانات المتعددة: PostgreSQL، Neon، MySQL، SQLite المدمج، و Firestore.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROVIDERS.map((prov) => {
          const result = testResults[prov.id];
          const isTesting = testingId === prov.id;

          return (
            <div key={prov.id} className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Database className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{prov.name}</h2>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{prov.type}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testProvider(prov.id)}
                  disabled={isTesting}
                  className="text-xs h-7 gap-1 font-semibold"
                >
                  <RefreshCw className={`size-3 ${isTesting ? "animate-spin" : ""}`} />
                  اختبار الاتصال
                </Button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{prov.desc}</p>

              <div className="p-2.5 rounded-lg bg-muted/20 border border-border text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">استراتيجية العزل:</span>
                  <span className="text-foreground font-bold">{prov.strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">المضيف الافتراضي:</span>
                  <span className="text-foreground truncate max-w-[200px]">{prov.defaultHost}</span>
                </div>
              </div>

              {result && (
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>الاتصال ناجح ({result.server_version || "OK"})</span>
                  </div>
                  <span className="font-mono font-bold num">{result.latency_ms} ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
