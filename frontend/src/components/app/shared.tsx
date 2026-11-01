
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Inbox, RotateCcw, Search, X } from 'lucide-react'
import { Button } from '@/components/kit/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/kit/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/kit/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/kit/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/kit/select'
import { Skeleton } from '@/components/kit/skeleton'
import { formatMoney, formatNumber } from '@/lib/format'
import { sound } from '@/lib/sound'
import { cn } from '@/lib/utils'

export function Money({ value, className, currency = true }: { value: number; className?: string; currency?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1 whitespace-nowrap', className)}>
      <span className="num">{formatMoney(value)}</span>
      {currency && <span className="text-xs font-normal text-muted-foreground">ج.م</span>}
    </span>
  )
}

export function Num({ value, className }: { value: number | string; className?: string }) {
  return <span className={cn('num', className)}>{typeof value === 'number' ? formatNumber(value) : value}</span>
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-pretty text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'destructive'
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && (
          <Icon
            className={cn(
              'size-3.5 shrink-0',
              tone === 'success' && 'text-success',
              tone === 'warning' && 'text-warning',
              tone === 'destructive' && 'text-destructive',
            )}
            aria-hidden
          />
        )}
        <span>{label}</span>
      </p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

type ListStateProps = {
  status: 'loading' | 'error' | 'ready'
  isEmpty: boolean
  onRetry: () => void
  emptyTitle: string
  emptyDescription: string
  emptyIcon?: LucideIcon
  emptyAction?: React.ReactNode
  skeleton?: 'table' | 'grid'
  children: React.ReactNode
}

export function ListState({
  status,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  skeleton = 'table',
  children,
}: ListStateProps) {
  if (status === 'loading') {
    return skeleton === 'grid' ? (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="جارٍ التحميل">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="جارٍ التحميل">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>تعذّر تحميل البيانات</EmptyTitle>
          <EmptyDescription>حدث خطأ أثناء الاتصال بالخادم. تحقق من الاتصال ثم أعد المحاولة.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw data-icon="inline-start" />
            إعادة المحاولة
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (isEmpty) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <EmptyIcon />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        {emptyAction && <EmptyContent>{emptyAction}</EmptyContent>}
      </Empty>
    )
  }

  return <>{children}</>
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  label = 'بحث',
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
  label?: string
}) {
  return (
    <InputGroup className={cn('w-full sm:w-72', className)}>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <InputGroupAddon>
        {value ? (
          <button
            type="button"
            onClick={() => {
              sound.click();
              onChange('');
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
            aria-label="مسح البحث"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <Search />
        )}
      </InputGroupAddon>
    </InputGroup>
  )
}

export type Option = { value: string; label: string }

export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  className,
  id,
}: {
  value: string
  onValueChange: (v: string) => void
  options: Option[]
  placeholder?: string
  label?: string
  className?: string
  id?: string
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v !== null && onValueChange(String(v))}>
      <SelectTrigger id={id} aria-label={label} className={cn('min-w-40', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline'> = {
  مكتملة: 'success',
  مدفوعة: 'success',
  مدفوع: 'success',
  معتمد: 'success',
  مفتوحة: 'success',
  آجل: 'warning',
  'عرض سعر': 'info',
  'مرتجع كلي': 'destructive',
  محسوب: 'info',
  'بانتظار الاعتماد': 'warning',
  مغلقة: 'secondary',
  مقفلة: 'secondary',
  مستلم: 'success',
  حاضر: 'success',
  نشط: 'success',
  إيراد: 'success',
  آجلة: 'warning',
  'قيد النقل': 'info',
  مرسل: 'info',
  'مستلم جزئيًا': 'warning',
  'مرتجع جزئي': 'warning',
  متأخر: 'warning',
  إجازة: 'info',
  مسودة: 'secondary',
  ملغاة: 'destructive',
  ملغي: 'destructive',
  مرفوض: 'destructive',
  غائب: 'destructive',
  موقوف: 'destructive',
  مصروف: 'destructive',
  // API (English) statuses from the backend
  confirmed: 'success',
  paid: 'success',
  received: 'success',
  approved: 'success',
  submitted: 'info',
  active: 'success',
  present: 'success',
  credit: 'warning',
  partial: 'warning',
  delayed: 'warning',
  draft: 'secondary',
  closed: 'secondary',
  quotation: 'info',
  cancelled: 'destructive',
  rejected: 'destructive',
  returned: 'destructive',
  suspended: 'destructive',
}

const STATUS_PILL: Record<string, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  info: 'bg-chart-4/15 text-chart-4',
  secondary: 'bg-muted text-muted-foreground',
  outline: 'border border-border text-muted-foreground',
}

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? 'outline'
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_PILL[variant])}>
      <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
      {status}
    </span>
  )
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}

/* ── KPI tile — colored icon square, value, real delta, optional sparkline ── */
import { TrendingDown, TrendingUp } from 'lucide-react'

export function KpiTile({
  label, value, icon: Icon, tone = 'default', hint, spark,
}: {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info'
  hint?: React.ReactNode
  spark?: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {Icon && (
            <span
              className={cn(
                'grid size-10 place-items-center rounded-lg',
                tone === 'success' && 'bg-success/15 text-success',
                tone === 'warning' && 'bg-warning/20 text-warning',
                tone === 'destructive' && 'bg-destructive/12 text-destructive',
                tone === 'info' && 'bg-chart-4/15 text-chart-4',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
          )}
        </CardDescription>
        <CardTitle className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {spark}
        </CardTitle>
      </CardHeader>
      {hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  )
}

export function Delta({ percent }: { percent: number | null }) {
  if (percent === null || !Number.isFinite(percent)) return null
  const up = percent >= 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', up ? 'text-success' : 'text-destructive')}>
      {up ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
      <span className="num">{up ? '+' : ''}{percent.toFixed(0)}%</span>
    </span>
  )
}

/* ── Table footer — pagination + rows-per-page (list screens) ── */
export function TablePagination({
  page, pages, onPage, pageSize, onPageSize,
}: {
  page: number
  pages: number
  onPage: (p: number) => void
  pageSize: number
  onPageSize: (n: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground pt-1">
      <span>
        صفحة <span className="num font-semibold text-foreground">{page}</span> من <span className="num font-semibold">{Math.max(pages, 1)}</span>
      </span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span>صفوف لكل صفحة:</span>
          <select
            className="h-8 rounded-md border border-input bg-card px-2 text-xs font-mono font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={pageSize}
            onChange={(e) => {
              sound.click();
              onPageSize(Number(e.target.value));
            }}
            aria-label="عدد الصفوف في الصفحة"
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n} className="num">{n}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="tactile-btn h-8 px-3 text-xs"
            disabled={page <= 1}
            onClick={() => {
              sound.click();
              onPage(page - 1);
            }}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="tactile-btn h-8 px-3 text-xs"
            disabled={page >= pages}
            onClick={() => {
              sound.click();
              onPage(page + 1);
            }}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  )
}
