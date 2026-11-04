import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Layers,
  Calculator,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { EASINGS } from "@/lib/motion";

interface ModuleNode {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: typeof Layers;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr: string;
  badgeEn: string;
  color: string;
  x: number; // percentage in SVG coordinate space
  y: number;
}

const MODULE_NODES: ModuleNode[] = [
  {
    id: "accounting",
    nameAr: "المحاسبة والقيود الآلية",
    nameEn: "Financial Ledger & Entries",
    icon: Calculator,
    descriptionAr: "شجرة حسابات قياسية وتوليد تلقائي لقيود اليومية مع كل فاتورة أو حركة صرف.",
    descriptionEn: "Standard chart of accounts with automated journal entry generation per invoice.",
    badgeAr: "النظام المالي الموحد",
    badgeEn: "Core Ledger",
    color: "#651E2C",
    x: 20,
    y: 22,
  },
  {
    id: "pos",
    nameAr: "نقاط البيع السريعة",
    nameEn: "High-Velocity POS",
    icon: ShoppingCart,
    descriptionAr: "إصدار الفواتير في أجزاء من الثانية مع دعم الباركود المباشر والطباعة الحرارية ESC/POS.",
    descriptionEn: "Sub-second checkout with continuous barcode scanning & 80mm ESC/POS thermal printing.",
    badgeAr: "العمليات النقدية",
    badgeEn: "Fast POS",
    color: "#B86B76",
    x: 80,
    y: 22,
  },
  {
    id: "wms",
    nameAr: "المخازن وسلاسل الإمداد",
    nameEn: "WMS & Warehousing",
    icon: Boxes,
    descriptionAr: "تتبع الأرصدة عبر الفروع، أذونات الصرف والإضافة، والتنبيه التلقائي لنواقص الأصناف.",
    descriptionEn: "Multi-branch inventory tracking, dispatch requisitions, and automatic reorder alerts.",
    badgeAr: "اللوجستيات",
    badgeEn: "Supply Chain",
    color: "#8A293B",
    x: 15,
    y: 75,
  },
  {
    id: "purchasing",
    nameAr: "المشتريات والموردين",
    nameEn: "Procurement & Vendors",
    icon: Truck,
    descriptionAr: "أوامر الشراء، مطابقة الفواتير مع عروض الأسعار، وجدولة المستحقات بدقة.",
    descriptionEn: "Purchase orders, three-way matching, and scheduled vendor payables tracking.",
    badgeAr: "التوريد",
    badgeEn: "Procurement",
    color: "#35151D",
    x: 85,
    y: 75,
  },
  {
    id: "hr",
    nameAr: "الموارد البشرية والرواتب",
    nameEn: "HR & Biometric Payroll",
    icon: Users,
    descriptionAr: "مزامنة أجهزة البصمة ZKTeco، احتساب الرواتب والبدلات، وتوزيع الورديات.",
    descriptionEn: "ZKTeco biometric integration, automatic shifts calculation, and compliant payroll.",
    badgeAr: "شؤون الموظفين",
    badgeEn: "Workforce",
    color: "#C58A35",
    x: 50,
    y: 12,
  },
  {
    id: "tax",
    nameAr: "الفاتورة والضرائب (ETA)",
    nameEn: "Tax & e-Invoicing Compliance",
    icon: ShieldCheck,
    descriptionAr: "توليد كود الـ UUID والتوقيع الإلكتروني المتوافق مع مصلحة الضرائب المصرية 100%.",
    descriptionEn: "UUID generation, cryptographic signing, and 100% ETA e-Invoice compliance.",
    badgeAr: "الامتثال القانوني",
    badgeEn: "Compliance",
    color: "#27835C",
    x: 50,
    y: 88,
  },
];

export function MizanModularArchitectureShowcase() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const shouldReduceMotion = useReducedMotion();
  const [activeNode, setActiveNode] = useState<ModuleNode>(MODULE_NODES[0]);

  // Center coordinate in 100x100 space
  const centerX = 50;
  const centerY = 50;

  return (
    <div className="relative rounded-3xl border border-[#E7D6C1] bg-[#FAF6F0] p-6 sm:p-10 overflow-hidden shadow-xl">
      {/* Background radial gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FAF0E4]/60 via-transparent to-transparent pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DECFC0] bg-[#FAF0E4] text-xs font-semibold text-[#651E2C]">
          <Layers className="size-3.5" />
          <span>
            {isAr
              ? "معمارية معيارية ذكية (Modular Architecture)"
              : "Smart Modular Architecture"}
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-[#262321] font-display">
          {isAr
            ? "نواة مركزية موحدة، وموديولات متصلة بلا انقطاع"
            : "One Unified Core, Seamlessly Interconnected Modules"}
        </h3>
        <p className="text-sm text-[#77716E] leading-relaxed">
          {isAr
            ? "انقر على أي موديول لاستكشاف مسار تدفق البيانات والتكامل اللحظي مع قاعدة البيانات المشتركة عبر PostgreSQL RLS."
            : "Click on any module to inspect data flow paths and instantaneous sync via PostgreSQL RLS."}
        </p>
      </div>

      {/* Interactive Architecture Canvas */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Canvas Diagram (7 Columns) */}
        <div className="lg:col-span-7 relative aspect-[4/3] w-full max-w-lg mx-auto bg-[#FFFFFF] rounded-2xl border border-[#E7D6C1] shadow-inner p-4 overflow-hidden">
          {/* SVG Animated Connector Paths */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {MODULE_NODES.map((node) => {
              const isSelected = activeNode.id === node.id;
              return (
                <g key={`path-${node.id}`}>
                  {/* Base track */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={node.x}
                    y2={node.y}
                    stroke={isSelected ? "#651E2C" : "#E7D6C1"}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    strokeDasharray={isSelected ? "none" : "2,2"}
                    className="transition-colors duration-300"
                  />

                  {/* Animated data pulse along path when selected */}
                  {isSelected && !shouldReduceMotion && (
                    <motion.circle
                      r="1.2"
                      fill="#B86B76"
                      animate={{
                        cx: [centerX, node.x, centerX],
                        cy: [centerY, node.y, centerY],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Center Hub: Mizan Core */}
          <motion.div
            className="absolute z-20 flex flex-col items-center justify-center p-3 rounded-2xl bg-[#35151D] text-[#FAF6F0] shadow-2xl border border-white/20"
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              transform: "translate(-50%, -50%)",
              width: "110px",
              height: "110px",
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    boxShadow: [
                      "0 0 0 0 rgba(101,30,44,0.4)",
                      "0 0 0 12px rgba(101,30,44,0)",
                    ],
                  }
            }
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-[#651E2C] flex items-center justify-center mb-1">
              <Layers className="size-4 text-[#FAF6F0]" />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight">
              {isAr ? "نواة ميزان" : "Mizan Core"}
            </span>
            <span className="text-[9px] font-mono text-[#B86B76]">
              RLS Engine
            </span>
          </motion.div>

          {/* Peripheral Satellite Module Nodes */}
          {MODULE_NODES.map((node) => {
            const isSelected = activeNode.id === node.id;
            const Icon = node.icon;

            return (
              <motion.button
                key={node.id}
                onClick={() => setActiveNode(node)}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                className={`absolute z-20 flex items-center gap-2 p-2 rounded-xl transition-all text-start ${
                  isSelected
                    ? "bg-[#651E2C] text-[#FAF6F0] shadow-lg ring-2 ring-[#B86B76]/50"
                    : "bg-[#FFFFFF] text-[#262321] border border-[#E7D6C1] shadow-xs hover:border-[#651E2C]/50 hover:bg-[#FAF6F0]"
                }`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-white/20 text-[#FAF6F0]"
                      : "bg-[#FAF0E4] text-[#651E2C]"
                  }`}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="hidden sm:block pe-1">
                  <div className="text-[11px] font-bold leading-tight">
                    {isAr ? node.nameAr : node.nameEn}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Module Detail Panel (5 Columns) */}
        <div className="lg:col-span-5 space-y-5">
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASINGS.editorial }}
            className="rounded-2xl border border-[#E7D6C1] bg-[#FFFFFF] p-6 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B86B76] bg-[#FAF0E4] px-2.5 py-1 rounded-full">
                {isAr ? activeNode.badgeAr : activeNode.badgeEn}
              </span>
              <span className="text-[11px] font-mono text-[#27835C] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="size-3.5" />
                {isAr ? "جاهز للتفعيل الفوري" : "Instant Activation"}
              </span>
            </div>

            <h4 className="text-xl font-bold text-[#262321]">
              {isAr ? activeNode.nameAr : activeNode.nameEn}
            </h4>

            <p className="text-sm text-[#77716E] leading-relaxed">
              {isAr ? activeNode.descriptionAr : activeNode.descriptionEn}
            </p>

            <div className="pt-2 border-t border-[#E6DCD2]/70 space-y-2 text-xs">
              <div className="flex justify-between text-[#77716E]">
                <span>{isAr ? "طريقة الربط:" : "Integration Protocol:"}</span>
                <span className="font-mono font-semibold text-[#262321]">
                  Internal Kernel Bus (Zero-Latency)
                </span>
              </div>
              <div className="flex justify-between text-[#77716E]">
                <span>{isAr ? "عزل البيانات:" : "Tenant Isolation:"}</span>
                <span className="font-mono font-semibold text-[#27835C]">
                  RLS tenant_id scope
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
