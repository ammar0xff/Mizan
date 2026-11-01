import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, Inbox, X, XCircle } from "lucide-react";
import {
  createContext, useCallback, useContext, useEffect, useState,
  type ReactNode,
} from "react";
import { spring } from "@/components/motion";
import { sound } from "@/lib/sound";

/* Legacy kit — visually identical to components/kit (shadcn v4).
   Kept for the not-yet-migrated screens; same API, kit styling. */

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="جارٍ التحميل"
    />
  );
}

export function Button({
  variant = "default",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "danger" | "outline" }) {
  const styles = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    danger: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
    outline: "border border-input bg-card shadow-xs hover:bg-accent hover:text-accent-foreground",
  }[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08 }}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 ${styles} ${className}`}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}

export function Input({ ref, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className="flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50"
      {...props}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50"
      {...props}
    />
  );
}

export function Card({ className = "", children, hover = false }: { className?: string; children: ReactNode; hover?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-line bg-card text-card-foreground shadow-xs transition-shadow ${
        hover ? "hover:border-primary/40 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "muted" | "success" | "warning" | "danger" | "brand"; children: ReactNode }) {
  const tones = {
    muted: "bg-secondary text-secondary-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    danger: "bg-destructive text-white",
    brand: "bg-primary text-primary-foreground",
  }[tone];
  return <span className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tones}`}>{children}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-[2px] overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              sound.click();
              onClose();
            }
          }}
        >
          <motion.div
            className={`flex max-h-[90vh] sm:max-h-[85vh] w-full flex-col rounded-2xl border border-line bg-card text-card-foreground shadow-2xl overflow-hidden ${
              wide ? "max-w-3xl" : "max-w-lg"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={spring}
          >
            {/* Pinned Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-card">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">{title}</h2>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  onClose();
                }}
                aria-label="إغلاق النافذة"
                className="tactile-btn flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
            {/* Scrollable Modal Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Accessible confirmation dialog — replaces window.confirm. */
export function ConfirmDialog({
  open,
  onConfirm,
  onClose,
  title,
  message,
  confirmLabel = "تأكيد",
  danger = true,
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex gap-2.5 pt-2">
          <Button
            variant={danger ? "danger" : "default"}
            className="flex-1 h-10 font-bold"
            onClick={() => {
              sound.click();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-10 font-medium"
            onClick={() => {
              sound.click();
              onClose();
            }}
          >
            إلغاء
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Empty({ text, hint, icon, action }: { text: string; hint?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-line p-12 text-center">
      <span className="text-muted-foreground/60">{icon ?? <Inbox className="size-10" strokeWidth={1.25} />}</span>
      <p className="font-medium text-muted-foreground">{text}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      role="alert"
    >
      <span className="flex items-center gap-2"><XCircle size={16} className="shrink-0" /> {message}</span>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </motion.div>
  );
}

/* ── Toasts ─────────────────────────────────────────────── */

type ToastKind = "success" | "error" | "info";
interface Toast { id: number; kind: ToastKind; message: string }

const ToastCtx = createContext<{ toast: (kind: ToastKind, message: string) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((kind: ToastKind, message: string) => {
    if (kind === "success") {
      sound.success();
    } else if (kind === "error") {
      sound.error();
    } else {
      sound.click();
    }

    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={spring}
              onClick={() => {
                sound.click();
                setToasts((all) => all.filter((x) => x.id !== t.id));
              }}
              role="status"
              className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                t.kind === "success"
                  ? "border-success/30 bg-success/15 text-success dark:bg-success/20"
                  : t.kind === "error"
                    ? "border-destructive/30 bg-destructive/15 text-destructive dark:bg-destructive/20"
                    : "border-border/80 bg-popover/95 text-popover-foreground"
              }`}
            >
              {t.kind === "success" ? <CheckCircle2 size={16} className="shrink-0" /> : t.kind === "error" ? <XCircle size={16} className="shrink-0" /> : <Info size={16} className="shrink-0" />}
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.click();
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
                className="opacity-60 hover:opacity-100 p-1 rounded-md transition"
                aria-label="إغلاق التنبيه"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
