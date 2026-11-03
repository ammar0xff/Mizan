# Mizan ERP — Frontend Architecture & UI Kit

**Target Audience:** Frontend developers, UI/UX engineers, full-stack contributors.  
**Platform Version:** Mizan 3.0 (React 19 + TypeScript + Tailwind CSS 3.4 + Radix UI)

---

## 1. Frontend Architectural Philosophy

Mizan's frontend is designed for high-density, low-latency enterprise operations:
- **Zero-Latency Keyboard Velocity:** Cashiers and operators can navigate, search, tender payments, and trigger actions purely via keyboard hotkeys (`F1`-`F12`, `Esc`, `Enter`).
- **Native Bidirectional Layout (RTL / LTR):** Built natively for Arabic (`dir="rtl"`) with the **Cairo** typography system, while seamlessly supporting English (`dir="ltr"`).
- **Design Tokens & Dark Mode:** Centralized HSL color tokens allow instant switching between Light and Dark modes without visual regressions.
- **Audio Sensory Feedback:** Low-latency Web Audio API synthesizer for barcode scans, drawer kicks, cash transactions, and validation warnings.

---

## 2. Design Tokens & Styling Conventions

Mizan uses Tailwind CSS driven by semantic CSS custom properties in `frontend/src/index.css`:

```css
@layer base {
  :root {
    --background: 210 20% 98%;
    --foreground: 224 71% 4%;
    --card: 0 0% 100%;
    --card-foreground: 224 71% 4%;
    --primary: 221 83% 53%;       /* Mizan Brand Blue */
    --primary-foreground: 210 20% 98%;
    --success: 142 71% 45%;       /* Financial Positive Green */
    --destructive: 0 84% 60%;     /* Error / Void Red */
    --border: 220 13% 91%;
    --radius: 0.75rem;            /* 12px Rounded Corners */
  }

  .dark {
    --background: 224 71% 4%;
    --foreground: 210 20% 98%;
    --card: 224 71% 7%;
    --card-foreground: 210 20% 98%;
    --primary: 217 91% 60%;
    --border: 216 34% 17%;
  }
}
```

### RTL/LTR Logical Rules:
Never use hardcoded directional CSS like `mr-4` or `text-left`. Instead use:
- `start` and `end`: `ms-4` (margin-inline-start), `pe-2` (padding-inline-end).
- `text-start` and `text-end`.
- Flex/Grid alignments that respect `dir="rtl"`.

---

## 3. The Mizan UI Kit (`components/kit/`)

All UI controls are built on top of accessible Radix UI primitives located in `frontend/src/components/kit/`.

### 1. Button (`button.tsx`)
Supports multiple visual variants and loading spinners:
```tsx
import { Button } from "@/components/kit/button";
import { Plus, Loader2 } from "lucide-react";

<Button variant="default" size="md" onClick={handleSave}>
  <Plus className="w-4 h-4 ms-2" />
  حفظ السجل
</Button>

<Button variant="outline" size="sm" disabled={isLoading}>
  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إلغاء"}
</Button>
```
*Variants:* `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.  
*Sizes:* `sm`, `md`, `lg`, `icon`.

### 2. Dialog / Modal (`dialog.tsx`)
Accessible modal overlay powered by Radix Dialog:
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/kit/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>تعديل إعدادات الوحدة</DialogTitle>
    </DialogHeader>
    <div className="py-4">
      {/* Form Content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
      <Button onClick={handleSubmit}>حفظ التغييرات</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3. Badge (`badge.tsx`)
Status indicators with semantic color accents:
```tsx
import { Badge } from "@/components/kit/badge";

<Badge variant="success">مفعل</Badge>
<Badge variant="destructive">ملغى</Badge>
<Badge variant="outline">مسودة</Badge>
```

### 4. Switch (`switch.tsx`)
High-contrast toggle switch for module settings:
```tsx
import { Switch } from "@/components/kit/switch";

<div className="flex items-center justify-between">
  <span>طباعة الفاتورة تلقائياً</span>
  <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
</div>
```

---

## 4. Zustand State Stores

Mizan uses lightweight, reactive Zustand stores (`frontend/src/stores/`):

### 1. `useAuth` (`stores/auth.ts`)
Manages authentication tokens, tenant details, and user permissions:
```ts
import { useAuth } from "@/stores/auth";

const { user, token, activeTenant, hasPermission, logout } = useAuth();

if (hasPermission("pos.create")) {
  // Render checkout button
}
```

### 2. `useModulesStore` (`stores/modules.ts`)
Tracks active modules, presets, and provides toggle actions:
```ts
import { useModulesStore } from "@/stores/modules";

const { activeModules, catalog, toggleModule, applyPreset, isModuleActive } = useModulesStore();

if (isModuleActive("pos_hardware")) {
  // Render hardware profile widget
}
```

### 3. `useUiStore` (`stores/ui.ts`)
Controls theme, sidebar collapsing, and sound effects:
```ts
import { useUiStore } from "@/stores/ui";

const { theme, toggleTheme, isSidebarCollapsed, toggleSidebar } = useUiStore();
```

---

## 5. Mizan App Launcher (9-Dots Grid)

The Mizan App Launcher provides instant access to all installed modular business applications directly from the application TopBar.

### Launcher Component (`frontend/src/components/MizanAppLauncher.tsx`):
- **Access Point:** Click the 9-dots icon (`LayoutGrid`) in the top navigation bar.
- **Search Filter:** Type in real-time to find any application by Arabic or English name.
- **Dynamic Filtering:** Displays only the applications enabled for the current active tenant.
- **Direct Catalog Link:** One-click shortcut to the Module Marketplace (`/modules`).

```tsx
import { MizanAppLauncher } from "@/components/MizanAppLauncher";

// Mounted inside AppShell header
<header className="h-14 border-b flex items-center justify-between px-4">
  <div className="flex items-center gap-3">
    <MizanAppLauncher />
    <span className="font-bold text-lg">ميزان ERP</span>
  </div>
</header>
```

---

## 6. Audio Sensory Feedback Engine (`lib/sound.ts`)

Mizan features a synthesized Web Audio API sound generator that requires zero external audio files:
```ts
import { sound } from "@/lib/sound";

// Successful barcode scan (quick 880Hz beep)
sound.scan();

// Completed payment transaction (pleasant rising arpeggio)
sound.success();

// Out of stock or validation error (soft descending buzz)
sound.error();

// Simulated cash drawer solenoid trigger
sound.cashDrawer();
```
