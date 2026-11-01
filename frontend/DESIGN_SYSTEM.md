# ميزان (Mizan) Frontend Design System

Product: multi-tenant SaaS for Egyptian building-materials merchants. App: `mizan-app-liart.vercel.app`.

Canon for all UI work. Every visual value traces to a token here. No rogue values.

Source of truth: `src/styles.css` (oklch tokens, light + dark). Component library: `src/components/kit/*` (shadcn/ui v4 on @base-ui/react) + `src/components/app/shared.tsx` (page primitives). Legacy `src/components/ui.tsx` is visually identical to the kit and exists only until remaining screens migrate — do not add new usages.

## Color

Water-blue brand on near-white; the brand **hue is tenant-assignable** (onboarding wizard writes `--brand-hue`, presets: water 250 / emerald 155 / copper 55 / midnight 230). Deep brand-blue rail, constant in both themes.

| Role | Light | Dark |
|---|---|---|
| background | `oklch(0.975 0.004 220)` | `oklch(0.175 0.014 235)` |
| card | `oklch(1 0 0)` | `oklch(0.21 0.016 235)` |
| foreground | `oklch(0.23 0.025 240)` | `oklch(0.94 0.006 225)` |
| muted-foreground | `oklch(0.52 0.02 235)` | `oklch(0.66 0.015 230)` |
| primary | `oklch(0.46 0.085 215)` | `oklch(0.74 0.095 200)` |
| success | `oklch(0.52 0.12 155)` | `oklch(0.7 0.15 155)` |
| warning | `oklch(0.55 0.13 65)` *(AA ≥4.5 on white)* | `oklch(0.75 0.13 75)` |
| destructive | `oklch(0.55 0.2 27)` | `oklch(0.68 0.19 25)` |
| sidebar | `oklch(0.25 0.035 230)` | `oklch(0.145 0.013 235)` |
| chart 1–5 | brand / gold / teal / magenta / sky | same |

Rules: color marks state and one primary action per screen — never decoration. All contrast pairs ≥ 4.5:1 (verified). `vk-*` vars in `styles.css` are aliases for the legacy kit only.

## Typography

IBM Plex Sans Arabic (+ Plex Mono for codes). Scale: 24/20/16/14/12 — nothing smaller except sidebar group labels (11px, one exception). Numerals: `.num` class (tabular, lining, LTR-isolated) on every figure, always with `ar-EG-u-nu-latn`.

## Spacing & Radius

Page rhythm: `flex flex-col gap-6`; inside cards `gap-4`; dense lists `gap-3`. Radius: `--radius: 0.625rem` → cards/dialogs `rounded-xl`, controls `rounded-md`, pills `rounded-full`. Shadows: `shadow-xs` resting, `shadow-md` hover, `shadow-lg` overlays only. Dark sidebar carries a `-4px 0 24px rgb(0 0 0/0.18)` edge.

## Icons

lucide only — three sizes: 16 (table rows), 18 (buttons/headers), 20 (page-level). Emoji as iconography is forbidden. Stroke 1.25 for large decorative glyphs, default elsewhere.

## Components

- Page entry: `PageHeader` (title 2xl semibold + description + actions) — every screen, no exceptions.
- Stats: `StatCard` (label, icon tile, tone default/success/warning/destructive).
- Lists: `ListState` (skeleton → error → empty → content) wrapping `TableShell` + kit `Table`; secondary columns `hidden sm/md:table-cell`.
- Detail overlays: kit `Sheet` (side panels) / kit `Dialog`; legacy `Modal` until migration completes.
- Badges: kit `Badge` solid tones; status text maps via `StatusBadge` (Arabic + API English keys).
- Toasts: kit sonner `<Toaster position="top-center" dir="rtl" />` (mounted in `main.tsx`).

## Motion

Springs via `@/components/motion`; page transitions 150ms fade/4px-rise keyed by route; `whileTap` 0.97 on buttons. `prefers-reduced-motion` collapses all animation.

## Touch & Accessibility

Minimum interactive size 36px (`size="icon"` / h-9); absolute floor 32px in dense tables. Mobile primary action: fixed bottom bar (safe-area padded) — pattern used by POS. Focus: kit ring (`focus-visible:ring-[3px] ring-ring/30`) — no global outlines. RTL first: `dir="rtl"` document, logical properties (`ms-`, `ps-`, `end-`).

## Composition language — دفتر اليوم (the daily ledger)

The app composes like a trading-house daily sheet, not a SaaS admin template. This is the anti-generic-AI layer: hierarchy comes from type scale and hairline rules, not from boxes, gradients, or grids of equal cards.

- **Dashboard is a masthead**: one dominant tabular figure (مبيعات اليوم, 5xl), inline SVG sparkline, ruled sections with overline labels — no PageHeader, no KPI card grid, no chart card.
- **Tables are open ledgers**: `TableShell` = scroll container only (no border/bg box); kit Table hairlines carry the structure.
- **Status is quiet**: `StatusBadge` = small dot + text; solid chips only inside dense contexts that need them.
- **Stats are borderless**: `StatCard` = overline label / 2xl value / hint — rhythm by type, not by card.
- **Money is typographic**: large figures `num font-bold tracking-tight`, currency suffix `text-base font-medium text-muted-foreground`; POS total separated by a dashed rule like a receipt.
- Cards (`Card`) remain for genuine containers: POS cart, forms, modals — never for wrapping every section.

## Methodology — docs/ui-ux-kit (binding)

`docs/ui-ux-kit/` is the governing methodology (user-provided kit v2): page contracts before UI (`prompts/page-contract.md`, concise contract comment at the top of each page TSX), repair order contract → structure → tokens/components → states/responsive → polish, preflight gate (`checks/preflight-checklist.md`), and AI-tell scoring (`checks/ai-tell-score.md`, target 0). Its token scaffold is superseded by this file's established brand-hue palette (the kit itself mandates starting from the existing system). Adopted from the kit:

- Motion constants: spring `stiffness 300 / damping 30` (`components/motion.tsx`), stagger 0.04s, reveal ≤ 0.6s, hover/press ≤ 0.25s — centralized, no per-component timing.
- No inline `style` props in feature code (brand-art pattern lives in `styles.css` classes; kit chart CSS-var injection is the one sanctioned exception).
- Every state carries exactly one dominant action — including filtered-empty (reset) vs first-use-empty (create/start), and permission-denied (designed Empty with fallback navigation).
- Status never by color alone (badge text + tone), touch target ~44px where feasible — documented deviation: kit controls at h-9 (36px) matching the approved prototype, 32px floor in dense tables.

## Data states

Loading = skeletons shaped like the content. Empty = kit `Empty` with icon + one primary action. Error = `ErrorBox`/`ListState` error with Arabic message + retry. Network failure message: «تعذر الاتصال بالخادم — تحقق من اتصال الإنترنت» (thrown by `lib/api.ts`).
