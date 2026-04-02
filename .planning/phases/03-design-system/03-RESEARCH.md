# Phase 3: Design System - Research

**Researched:** 2026-04-01
**Domain:** Design token migration (CSS custom properties to Tailwind v4), component library (Radix + CVA), dual-theme support
**Confidence:** HIGH

## Summary

Phase 3 replaces the existing 993-line `design-tokens.css` with Tailwind CSS v4 as the single source of truth for all design tokens, builds 12 core components using Radix UI primitives + CVA + Tailwind utilities, and creates a machine-readable component manifest for agent consumption. The UI-SPEC provides exact values for every token and every component, so this phase is a precision execution task, not a design exploration.

The key architectural insight is that Tailwind v4's `@theme` directive generates both CSS custom properties AND utility classes from a single declaration. This means the project's existing `var(--token)` pattern can be replaced with Tailwind utility classes while simultaneously making every token available as a CSS variable at runtime. The `@theme` block is the single source of truth; `:root` and `[data-theme="light"]` blocks handle semantic color assignments per theme; `@custom-variant` overrides the dark variant to use `data-theme` attributes.

The existing codebase has a small migration surface: 5 CSS files (AppShell.css, SidebarPlaceholder.css, WorkspaceArea.css, ChatPlaceholder.css, WebSocketStatus.css) with 37 total `var(--token)` references, plus `index.css` (global reset) and `main.tsx` (import). The theme files (`dark.css`, `light.css`, `themes/index.css`) and `design-tokens.css` are all deleted and replaced.

**Primary recommendation:** Use Tailwind v4 `@theme` with `--*: initial` to clear all defaults and define a fully custom token set derived from the UI-SPEC values. Theme switching via `data-theme` attribute on `<html>` with `@custom-variant dark`. Components at `packages/app/src/components/ui/` following shadcn/ui file naming conventions (lowercase kebab-case). All 12 components in a single barrel export.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Replace design-tokens.css with Tailwind v4 ownership -- migrate all token values into Tailwind v4 `@theme` config. Delete the existing 993-line `design-tokens.css`. Tailwind becomes the single source of truth for all design tokens.
- **D-02:** Components use Tailwind utility classes that resolve to tokens. No raw CSS values anywhere.
- **D-03:** Build all 12 core components in Phase 3 -- Button, Card, Dialog, Tabs, Tooltip, Dropdown, Input, Select, Checkbox, Radio, Badge, Avatar. Complete library before any workbench content.
- **D-04:** All components built with Radix UI primitives + Tailwind v4 + CVA variants (per project research).
- **D-05:** `cn()` utility (clsx + tailwind-merge) for conflict-free class composition.
- **D-06:** Both dark and light themes from the start -- tokens structured for theme switching via CSS class or media query. No single-theme retrofit later.
- **D-07:** Current GitHub-dark palette is the dark theme. Light theme derived as a complementary set.
- **D-08:** Machine-readable component manifest -- a JSON/TypeScript registry that agents consume to know what components exist, their props, variants, and composition patterns.

### Claude's Discretion
- Tailwind v4 `@theme` structure and naming conventions
- How to organize the component library directory (`src/components/ui/` or `src/lib/components/`)
- Theme switching mechanism (CSS class toggle vs. media query vs. both)
- Component manifest format (JSON schema, TypeScript type exports, or generated from source)
- Whether to include Storybook or a simpler component preview in this phase
- Exact Radix primitives to use per component

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DESIGN-01 | Design token system covering color, spacing, typography, elevation, animation | Tailwind v4 @theme directive replaces CSS custom properties. UI-SPEC defines exact values for all 7 token categories. @theme generates both utility classes and CSS variables. |
| DESIGN-02 | Component library: Button, Card, Dialog, Tabs, Tooltip, Dropdown, Input, Select, Checkbox, Radio, Badge, Avatar | UI-SPEC defines exact specs for all 12 components. Radix primitives handle accessibility. CVA defines variant APIs. Component file organization follows shadcn/ui patterns. |
| DESIGN-03 | All components built with Radix primitives + Tailwind v4 + CVA variants | Verified: Radix UI, CVA 0.7.1, tailwindcss 4.2.2 are all current. Patterns documented below with exact code examples. |
| DESIGN-04 | cn() utility with clsx + tailwind-merge for conflict-free class composition | Standard pattern: `twMerge(clsx(inputs))`. Resolves class conflicts when consumers pass className props. |
| DESIGN-05 | Machine-readable component manifest (registry agents use to know what components exist and how to compose them) | UI-SPEC defines ComponentManifestEntry interface. TypeScript source + generated JSON for agent consumption. |
| DESIGN-06 | No raw CSS in agent output -- component library is the only way agents build UI | Enforced by: (1) all tokens in Tailwind utilities, (2) component manifest as agent API, (3) no CSS files in component library. Phase 8 neural validation will add runtime enforcement. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Tech stack**: React 18 + TypeScript + Vite (frontend), pnpm monorepo -- preserve existing stack
- **Design system enforcement**: No raw CSS in agent output. Component library is the only way agents build UI
- **Naming**: React components PascalCase .tsx, hooks camelCase with `use` prefix
- **Imports**: `@/` alias resolves to `packages/app/src/`
- **TypeScript**: strict mode enabled, `noUncheckedIndexedAccess: true`
- **Commit style**: Conventional commits (feat:, fix:, refactor:, docs:, test:, chore:)
- **Testing**: Vitest 4.0, happy-dom environment, @testing-library/react 14.1.2

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.2.2 | CSS-first design token system + utility classes | Verified via `npm view`. @theme directive generates both CSS vars and utility classes from single declaration. Replaces 993-line CSS custom property file. |
| @tailwindcss/vite | 4.2.2 | Vite plugin for Tailwind v4 | Verified via `npm view`. Replaces PostCSS-based setup. Required for Vite 6 integration. |
| class-variance-authority | 0.7.1 | Type-safe component variant API | Verified via `npm view`. Defines variants/compoundVariants/defaultVariants. Framework-agnostic. |
| clsx | 2.1.1 | Conditional class name composition | Verified via `npm view`. Tiny (228B), zero deps. Standard companion to CVA. |
| tailwind-merge | 3.5.0 | Tailwind class conflict resolution | Verified via `npm view`. Resolves `px-4 px-2` to `px-2`. Essential for className prop forwarding. |
| lucide-react | 1.7.0 | Icon library | Verified via `npm view`. Tree-shakeable, 1000+ icons, TypeScript-native. |

### Radix UI Primitives

| Library | Version | Component | Purpose |
|---------|---------|-----------|---------|
| @radix-ui/react-slot | 1.2.4 | Button | asChild pattern for polymorphic rendering |
| @radix-ui/react-dialog | 1.1.15 | Dialog | Focus trapping, scroll lock, ARIA, escape key |
| @radix-ui/react-tabs | 1.1.13 | Tabs | Keyboard nav (arrow keys), ARIA roles |
| @radix-ui/react-tooltip | 1.2.8 | Tooltip | Collision-aware positioning, delay, ARIA |
| @radix-ui/react-dropdown-menu | 2.1.16 | Dropdown | Sub-menus, keyboard nav, checkbox/radio items |
| @radix-ui/react-popover | 1.1.15 | Select | Floating content, collision detection |
| @radix-ui/react-checkbox | 1.3.3 | Checkbox | Accessible toggle, indeterminate state |
| @radix-ui/react-radio-group | 1.3.8 | Radio | Accessible radio group, arrow key nav |
| @radix-ui/react-select | 2.2.6 | Select (alternative) | Full accessible select with typeahead |

All versions verified via `npm view` on 2026-04-01.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications | Status feedback, agent events, validation results |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @radix-ui/react-popover for Select | @radix-ui/react-select 2.2.6 | Radix Select provides full typeahead, scroll-into-view, and grouped items. Popover gives more visual control. UI-SPEC says use Popover or native select. Recommend: use @radix-ui/react-select for full accessibility, style trigger to match Input visual contract. |
| Individual Radix imports | shadcn/ui CLI init | shadcn/ui copies files, but its CLI init adds dependencies and folder structure. Building from scratch gives full control. Borrow patterns, not CLI. |
| Storybook for component preview | Studio workbench in Phase 9 | Storybook adds devDependency weight. Defer to Studio workbench. Components are testable via Vitest + @testing-library. |

**Installation (packages/app):**
```bash
# Design system core
pnpm add tailwindcss@^4.2.2 class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^3.5.0 lucide-react@^1.7.0 sonner@^2.0.7
pnpm add -D @tailwindcss/vite@^4.2.2

# Radix primitives
pnpm add @radix-ui/react-slot@^1.2.4 @radix-ui/react-dialog@^1.1.15 @radix-ui/react-tabs@^1.1.13 @radix-ui/react-tooltip@^1.2.8 @radix-ui/react-dropdown-menu@^2.1.16 @radix-ui/react-popover@^1.1.15 @radix-ui/react-checkbox@^1.3.3 @radix-ui/react-radio-group@^1.3.8 @radix-ui/react-select@^2.2.6
```

---

## Architecture Patterns

### Recommended Project Structure

```
packages/app/src/
  components/
    ui/
      button.tsx              # CVA variants + Radix Slot
      card.tsx                # Pure div container + sub-components
      dialog.tsx              # Radix Dialog + overlay + animation
      tabs.tsx                # Radix Tabs + indicator styling
      tooltip.tsx             # Radix Tooltip + positioning
      dropdown-menu.tsx       # Radix DropdownMenu + items
      input.tsx               # Native input + CVA sizes
      select.tsx              # Radix Select + trigger styling
      checkbox.tsx            # Radix Checkbox + indicator
      radio-group.tsx         # Radix RadioGroup + indicator
      badge.tsx               # Span + CVA semantic variants
      avatar.tsx              # Img + fallback initials
      index.ts                # Barrel export for all components
      manifest.ts             # Component manifest (TypeScript source of truth)
      manifest.json           # Generated manifest (agent-readable)
  lib/
    utils.ts                  # cn() utility
  styles/
    theme.css                 # Tailwind v4 @theme entry (REPLACES design-tokens.css)
    globals.css               # @import "tailwindcss" + base reset + @custom-variant dark
```

### Pattern 1: Tailwind v4 Theme File Structure

**What:** Single CSS file that defines all tokens via `@theme`, theme-switches via `data-theme` attribute, and provides reduced-motion overrides.

**When to use:** This is THE token file. All components reference these tokens via Tailwind utility classes.

**Structure (from UI-SPEC and design-tokens.css values):**

```css
/* packages/app/src/styles/globals.css */
@import "tailwindcss";
@import "./theme.css";

/* Override dark variant to use data-theme attribute */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

```css
/* packages/app/src/styles/theme.css */

/* Clear ALL Tailwind defaults -- fully custom theme */
@theme {
  --*: initial;

  /* ── Font Families ── */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;

  /* ── Typography Scale (4 canonical sizes per UI-SPEC) ── */
  --text-caption: 13px;
  --text-caption--line-height: 1.5;
  --text-body: 15px;
  --text-body--line-height: 1.5;
  --text-heading: 20px;
  --text-heading--line-height: 1.2;
  --text-display: 28px;
  --text-display--line-height: 1.2;

  /* ── Font Weights ── */
  --font-weight-normal: 400;
  --font-weight-semibold: 600;

  /* ── Letter Spacing ── */
  --tracking-normal: 0;
  --tracking-tight: -0.025em;
  --tracking-tighter: -0.05em;

  /* ── Spacing (4px base system, 22 steps from UI-SPEC) ── */
  --spacing: 4px;
  /* Tailwind auto-generates p-1 (4px), p-2 (8px), p-4 (16px), etc. */

  /* ── Border Radius (from UI-SPEC) ── */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 14px;
  --radius-2xl: 18px;
  --radius-full: 9999px;

  /* ── Z-Index Scale (from UI-SPEC) ── */
  --z-index-base: 0;
  --z-index-dropdown: 1000;
  --z-index-sticky: 1100;
  --z-index-fixed: 1200;
  --z-index-modal-backdrop: 1300;
  --z-index-modal: 1400;
  --z-index-popover: 1500;
  --z-index-tooltip: 1600;
  --z-index-notification: 1700;
  --z-index-max: 9999;

  /* ── Shadows / Elevation (from UI-SPEC) ── */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-sm: 0 1px 3px 0 rgba(0,0,0,0.5), 0 1px 2px -1px rgba(0,0,0,0.5);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.6), 0 2px 4px -2px rgba(0,0,0,0.6);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.7), 0 4px 6px -4px rgba(0,0,0,0.7);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.8), 0 8px 10px -6px rgba(0,0,0,0.8);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.9);

  /* ── Transition Durations (from UI-SPEC) ── */
  /* Note: Tailwind v4 does not have a --duration-* namespace.
     These are defined as regular CSS vars in :root, not @theme. */

  /* ── Easing Functions ── */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* ── Brand Palette (raw hues, from UI-SPEC) ── */
  --color-prussian-100: #04070c;
  --color-prussian-200: #080d19;
  --color-prussian-300: #0c1425;
  --color-prussian-400: #101b31;
  --color-prussian-500: #14213d;
  --color-prussian-600: #29447e;
  --color-prussian-700: #3e67bf;
  --color-prussian-800: #7e99d5;
  --color-prussian-900: #beccea;

  --color-orange-100: #362101;
  --color-orange-200: #6b4201;
  --color-orange-300: #a16402;
  --color-orange-400: #d68502;
  --color-orange-500: #fca311;
  --color-orange-600: #fdb541;
  --color-orange-700: #fec871;
  --color-orange-800: #fedaa0;
  --color-orange-900: #ffedd0;

  --color-grey-100: #2e2e2e;
  --color-grey-200: #5c5c5c;
  --color-grey-300: #8a8a8a;
  --color-grey-400: #b8b8b8;
  --color-grey-500: #e5e5e5;
  --color-grey-600: #ebebeb;
  --color-grey-700: #f0f0f0;
  --color-grey-800: #f5f5f5;
  --color-grey-900: #fafafa;

  --color-black: #000000;
  --color-black-600: #333333;
  --color-black-700: #666666;
  --color-black-800: #999999;
  --color-black-900: #cccccc;
  --color-white: #ffffff;

  /* ── Glow System (brand signature, from UI-SPEC) ── */
  --shadow-glow-default: 0 0 8px rgba(62,103,191,0.10), 0 0 2px rgba(62,103,191,0.15);
  --shadow-glow-hover: 0 0 14px rgba(62,103,191,0.15), 0 0 3px rgba(62,103,191,0.20);
  --shadow-glow-focus: 0 0 18px rgba(62,103,191,0.25), 0 0 4px rgba(62,103,191,0.30);
  --shadow-glow-accent: 0 0 12px rgba(62,103,191,0.20), 0 0 3px rgba(62,103,191,0.25);

  /* ── Animations ── */
  --animate-fade-in: fade-in 150ms ease-out;
  --animate-fade-in-scale: fade-in-scale 400ms ease-out;
  --animate-slide-in-bottom: slide-in-bottom 150ms ease-out;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fade-in-scale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slide-in-bottom {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

/* ── Dark Theme (default) ── */
:root {
  --color-surface: #0c1425;
  --color-surface-2: #101b31;
  --color-surface-3: #14213d;
  --color-accent: #3e67bf;
  --color-text: #e5e5e5;
  --color-text-dim: #b8b8b8;
  --color-text-muted: #5c5c5c;
  --color-border: rgba(62, 103, 191, 0.08);
  --color-border-strong: rgba(62, 103, 191, 0.15);
  --color-destructive: #d68502;
  --color-warning: #fca311;
  --color-success: #7e99d5;
  --color-info: #3e67bf;

  /* Durations (not a @theme namespace) */
  --duration-instant: 75ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;
  --duration-slowest: 500ms;
}

/* ── Light Theme ── */
[data-theme="light"] {
  --color-surface: #fafafa;
  --color-surface-2: #f0f0f0;
  --color-surface-3: #e5e5e5;
  --color-accent: #3e67bf;
  --color-text: #333333;
  --color-text-dim: #666666;
  --color-text-muted: #999999;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.12);
  --color-destructive: #d68502;
  --color-warning: #fca311;
  --color-success: #7e99d5;
  --color-info: #3e67bf;
}

/* ── Reduced Motion ── */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-slower: 0ms;
    --duration-slowest: 0ms;
  }
}
```

**CRITICAL implementation note:** Semantic color tokens (`--color-surface`, `--color-text`, etc.) are NOT in `@theme` -- they are in `:root` and `[data-theme="light"]`. This is because they change per theme. Components reference them via `@theme inline` or arbitrary value utilities (`bg-[var(--color-surface)]`). Palette colors (static across themes) ARE in `@theme` so they generate utility classes like `bg-prussian-700`.

**Recommended approach for semantic tokens:** Use `@theme inline` to register semantic tokens so they generate utility classes:

```css
@theme inline {
  --color-surface: var(--color-surface);
  --color-surface-2: var(--color-surface-2);
  --color-surface-3: var(--color-surface-3);
  --color-accent: var(--color-accent);
  --color-text: var(--color-text);
  --color-text-dim: var(--color-text-dim);
  --color-text-muted: var(--color-text-muted);
  --color-border: var(--color-border);
  --color-border-strong: var(--color-border-strong);
  --color-destructive: var(--color-destructive);
  --color-warning: var(--color-warning);
  --color-success: var(--color-success);
  --color-info: var(--color-info);
}
```

This generates utility classes (`bg-surface`, `text-text-dim`, `border-border`) that resolve to the runtime CSS variable, which in turn resolves to the current theme's value.

### Pattern 2: CVA Component with cn() Utility

**What:** Every component follows the same pattern: CVA defines variants, cn() merges classes, Radix provides accessible behavior.

**Example (Button from UI-SPEC):**

```typescript
// packages/app/src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base classes (all buttons)
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[rgba(62,103,191,0.95)] text-white hover:bg-accent active:bg-prussian-700 shadow-glow-default hover:shadow-glow-hover',
        secondary: 'bg-[rgba(138,138,138,0.36)] text-text hover:bg-[rgba(138,138,138,0.42)]',
        ghost: 'bg-transparent text-text hover:bg-[rgba(255,255,255,0.08)]',
        destructive: 'bg-[rgba(214,133,2,0.95)] text-white hover:bg-orange-400',
        outline: 'border border-border bg-transparent text-text hover:border-border-strong',
      },
      size: {
        sm: 'h-8 px-3 text-caption',
        md: 'h-10 px-4 text-body',
        lg: 'h-12 px-6 text-body',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Pattern 3: cn() Utility

```typescript
// packages/app/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Pattern 4: Component Manifest

**What:** TypeScript source + generated JSON that tells agents what components exist and how to use them.

```typescript
// packages/app/src/components/ui/manifest.ts
export interface ComponentManifestEntry {
  name: string;
  importPath: string;
  description: string;
  variants: Record<string, string[]>;
  defaultVariants: Record<string, string>;
  sizes: string[];
  subComponents: string[];
  radixPrimitive: string | null;
  props: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
}

export const componentManifest: ComponentManifestEntry[] = [
  {
    name: 'Button',
    importPath: '@/components/ui/button',
    description: 'Primary interactive element for actions',
    variants: {
      variant: ['primary', 'secondary', 'ghost', 'destructive', 'outline'],
    },
    defaultVariants: { variant: 'primary', size: 'md' },
    sizes: ['sm', 'md', 'lg', 'icon'],
    subComponents: [],
    radixPrimitive: '@radix-ui/react-slot',
    props: {
      asChild: { type: 'boolean', required: false, description: 'Render as child element' },
    },
  },
  // ... remaining 11 components
];
```

### Pattern 5: Vite Config Integration

**What:** Add `@tailwindcss/vite` plugin to existing vite.config.ts.

```typescript
// packages/app/vite.config.ts -- add to plugins array
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),  // Add BEFORE react()
    react(),
    // ... existing electron plugins
  ],
  // ... rest unchanged
});
```

### Pattern 6: Theme Switching Mechanism

**What:** `data-theme` attribute on `<html>`, toggled via a React hook/store.

```typescript
// Theme toggle in a store or hook
function setTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('afw-theme', theme);
}

function getTheme(): 'dark' | 'light' {
  return (localStorage.getItem('afw-theme') as 'dark' | 'light') || 'dark';
}
```

The dark variant override in globals.css:
```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

This means `dark:bg-surface` applies when `data-theme="dark"` is on any ancestor.

### Anti-Patterns to Avoid

- **Raw CSS values in components:** Never `bg-[#3e67bf]` -- always `bg-accent` or `bg-prussian-700`
- **var(--token) in component TSX:** Use Tailwind utility classes, not inline `style={{ background: 'var(--color-surface)' }}`
- **Separate CSS files for components:** No `.css` files in `components/ui/`. All styling is Tailwind utilities in TSX.
- **Importing design-tokens.css:** After migration, this file is deleted. Only `globals.css` (which imports theme.css) is needed.
- **Using Tailwind's default color palette:** The `--*: initial` directive clears defaults. `bg-red-500` will NOT work. Only project-defined colors exist.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible modals | Custom dialog with manual focus trap | @radix-ui/react-dialog | Focus trapping, scroll lock, escape key, ARIA attributes, portal rendering, animation support. Manual implementation misses edge cases (nested modals, iOS scroll lock, screen reader announcements). |
| Dropdown menus | Custom div with click-outside detection | @radix-ui/react-dropdown-menu | Sub-menus, keyboard navigation (arrow keys, home/end, typeahead), checkbox/radio items, collision-aware positioning, nested triggers. |
| Tooltip positioning | Custom absolute-positioned div | @radix-ui/react-tooltip | Collision detection (flips when near viewport edge), delay management, accessible ARIA described-by, smooth animations, portal rendering to avoid overflow:hidden clipping. |
| Class conflict resolution | Manual class string concatenation | tailwind-merge (via cn()) | `className="px-4 px-2"` is ambiguous without merge. tailwind-merge understands Tailwind's class hierarchy and keeps the last-specified value. Without it, class prop forwarding breaks unpredictably. |
| Variant type safety | String union types + if/else chains | class-variance-authority | CVA provides `VariantProps<typeof variants>` for automatic TypeScript inference. Manual approach misses compound variants and default variants. |
| Form controls (checkbox, radio) | Custom styled div with hidden input | @radix-ui/react-checkbox, @radix-ui/react-radio-group | Correct ARIA roles, keyboard interaction (Space to toggle, arrow keys in groups), indeterminate state, form integration, label association. |
| Select dropdown | Custom listbox | @radix-ui/react-select | Typeahead, scroll-into-view, grouped items, collision-aware positioning, keyboard navigation, screen reader announcements. |

**Key insight:** Every Radix primitive handles accessibility correctly out of the box. Building accessible form controls and overlays from scratch takes 10x longer and misses edge cases that only surface in screen reader testing on specific platforms.

---

## Common Pitfalls

### Pitfall 1: @theme vs :root for Theme-Switching Tokens

**What goes wrong:** Putting semantic color tokens (that change per theme) inside `@theme` directly with hex values. When you switch themes, the `@theme` values don't change -- they are static.

**Why it happens:** `@theme` defines tokens at build time. Theme switching needs runtime CSS variable resolution.

**How to avoid:** Two-layer approach: (1) Static palette colors in `@theme` (they never change). (2) Semantic tokens in `:root` / `[data-theme="light"]` as CSS variables. (3) Register semantic tokens with `@theme inline` so Tailwind generates utility classes that reference the runtime variable.

**Warning signs:** Colors don't change when toggling `data-theme` attribute.

### Pitfall 2: Tailwind v4 Clears All Defaults with `--*: initial`

**What goes wrong:** Using `--*: initial` clears ALL of Tailwind's built-in colors, spacing multipliers, breakpoints, etc. Then `bg-blue-500` or `sm:` responsive prefix stops working.

**Why it happens:** The project wants a fully custom design system. But forgetting to re-declare spacing base (`--spacing: 4px`) means `p-4` stops meaning 16px.

**How to avoid:** After `--*: initial`, explicitly declare every needed namespace: spacing base, font families, breakpoints (if needed), radius scale, shadow scale, z-index. Use UI-SPEC as the checklist.

**Warning signs:** `p-4` renders as 0px. Responsive breakpoints don't work.

### Pitfall 3: Electron + Tailwind Vite Plugin Build Conflict

**What goes wrong:** `@tailwindcss/vite` plugin may conflict with `vite-plugin-electron` in the build pipeline because Electron plugin does its own Vite build for main process and preload.

**Why it happens:** Tailwind's Vite plugin hooks into CSS processing. Electron's plugin spawns separate Vite builds for main.ts and preload.ts. If Tailwind plugin runs during Electron builds (which don't have CSS), it may error or slow the build.

**How to avoid:** Add `@tailwindcss/vite` plugin BEFORE `react()` and BEFORE the electron plugin array. The Tailwind plugin should only process the renderer build. If issues arise, conditionally include it only for the renderer build (the main Vite config, not the electron sub-configs).

**Warning signs:** Build errors mentioning CSS processing in electron/main.ts or electron/preload.ts.

### Pitfall 4: tailwind-merge Configuration Mismatch

**What goes wrong:** `tailwind-merge` uses a default Tailwind configuration. With a fully custom theme (`--*: initial`), custom class names like `bg-surface` or `text-caption` are not recognized by tailwind-merge, so it may incorrectly remove them during merging.

**Why it happens:** tailwind-merge maintains an internal map of Tailwind classes. Custom @theme namespaces are not automatically recognized.

**How to avoid:** Configure tailwind-merge with `extendTailwindMerge()` if custom token names cause merge conflicts. Test early: pass two conflicting custom classes through `cn()` and verify the correct one wins.

**Warning signs:** Classes disappear after `cn()` processing. Component overrides via className prop don't apply.

### Pitfall 5: Missing `sr-only` Utility After `--*: initial`

**What goes wrong:** The `sr-only` utility class (screen-reader only, used for accessible icon-only buttons per UI-SPEC) may not exist after clearing defaults.

**Why it happens:** `sr-only` is a built-in Tailwind utility. With `--*: initial`, the base styles layer may be affected.

**How to avoid:** Verify `sr-only` still works after theme setup. If not, add it via `@utility sr-only { ... }` in globals.css. This is critical for DESIGN-06 accessibility (icon-only buttons need aria-label or sr-only text).

**Warning signs:** Screen readers don't announce icon-only button labels.

### Pitfall 6: CSS Import Order in main.tsx

**What goes wrong:** After migration, if `main.tsx` still imports the old `design-tokens.css` alongside the new Tailwind entry, there are conflicting CSS variable declarations.

**Why it happens:** Forgetting to remove the old import when adding the new one.

**How to avoid:** Single CSS entry point. `main.tsx` imports ONLY `globals.css`. globals.css imports tailwindcss and theme.css. Nothing else. Remove the old `import './styles/design-tokens.css'` line and the `import './index.css'` line (its contents merge into globals.css).

**Warning signs:** Doubled CSS variable declarations in browser devtools. Old dark theme colors appearing despite new theme values.

---

## Code Examples

### Complete cn() Utility
```typescript
// packages/app/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Source: shadcn/ui standard pattern, CVA documentation

### Badge Component (Simple, No Radix)
```typescript
// packages/app/src/components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm font-semibold text-caption',
  {
    variants: {
      variant: {
        default: 'bg-[rgba(138,138,138,0.15)] text-text-dim',
        success: 'bg-[rgba(126,153,213,0.15)] text-success',
        warning: 'bg-[rgba(252,163,17,0.15)] text-warning',
        error: 'bg-[rgba(214,133,2,0.15)] text-destructive',
        info: 'bg-[rgba(62,103,191,0.15)] text-info',
        accent: 'bg-[rgba(62,103,191,0.15)] text-accent',
      },
      size: {
        sm: 'px-1.5 py-0.5',
        md: 'px-2 py-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
```
Source: UI-SPEC Badge section, CVA documentation

### Dialog Component (Radix-Based)
```typescript
// packages/app/src/components/ui/dialog.tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[1300] bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-[1400] -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-md rounded-xl border border-border bg-surface-2 p-6 shadow-xl',
        'data-[state=open]:animate-fade-in-scale',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-accent">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-heading font-semibold text-text', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-body text-text-dim', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
);

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
};
```
Source: UI-SPEC Dialog section, Radix Dialog docs, shadcn/ui patterns

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js (JS) | @theme directive (CSS-first) | Tailwind v4.0 (Jan 2025) | No JS config file needed. All tokens in CSS. |
| PostCSS for Tailwind | @tailwindcss/vite plugin | Tailwind v4.0 (Jan 2025) | Faster builds, native Vite integration. |
| CSS custom properties only | @theme generates utilities + CSS vars | Tailwind v4.0 (Jan 2025) | Single source of truth for both utility classes and CSS variables. |
| darkMode: 'class' in config | @custom-variant dark | Tailwind v4.0 (Jan 2025) | CSS-first dark mode config. |
| Manual CVA typing | VariantProps<typeof fn> | CVA 0.7.x | Type inference from variant definition. |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts` -- replaced by @theme directive in CSS
- PostCSS-based Tailwind setup -- replaced by @tailwindcss/vite for Vite projects
- `darkMode` config key -- replaced by @custom-variant directive
- Tailwind v3 `theme.extend` -- replaced by simply adding new variables in @theme

---

## Migration Surface Analysis

### Files to DELETE
| File | Lines | Reason |
|------|-------|--------|
| `packages/app/src/styles/design-tokens.css` | 993 | Replaced by theme.css |
| `packages/app/src/styles/themes/dark.css` | 80 | Semantic tokens move to :root in theme.css |
| `packages/app/src/styles/themes/light.css` | 41 | Semantic tokens move to [data-theme="light"] in theme.css |
| `packages/app/src/styles/themes/index.css` | 7 | Import chain replaced by globals.css |

### Files to CREATE
| File | Purpose |
|------|---------|
| `packages/app/src/styles/globals.css` | @import "tailwindcss" + theme import + @custom-variant + base reset |
| `packages/app/src/styles/theme.css` | @theme tokens + :root dark + [data-theme="light"] light + reduced-motion |
| `packages/app/src/lib/utils.ts` | cn() utility |
| `packages/app/src/components/ui/*.tsx` | 12 component files |
| `packages/app/src/components/ui/index.ts` | Barrel export |
| `packages/app/src/components/ui/manifest.ts` | Component manifest TypeScript |
| `packages/app/src/components/ui/manifest.json` | Generated JSON manifest |

### Files to MODIFY
| File | Change |
|------|--------|
| `packages/app/vite.config.ts` | Add @tailwindcss/vite plugin |
| `packages/app/src/main.tsx` | Replace CSS imports with single globals.css |
| `packages/app/src/index.css` | DELETE or merge contents into globals.css |
| `packages/app/src/workbenches/shell/AppShell.css` | Migrate var(--) to Tailwind classes (or convert to inline className) |
| `packages/app/src/workbenches/sidebar/SidebarPlaceholder.css` | Migrate var(--) to Tailwind classes |
| `packages/app/src/workbenches/workspace/WorkspaceArea.css` | Migrate var(--) to Tailwind classes |
| `packages/app/src/workbenches/chat/ChatPlaceholder.css` | Migrate var(--) to Tailwind classes |
| `packages/app/src/status/WebSocketStatus.css` | Migrate var(--) to Tailwind classes |
| `packages/app/package.json` | Add new dependencies |

### CSS Reference Count (migration scope)
- `AppShell.css`: 3 var(--) references
- `SidebarPlaceholder.css`: 18 var(--) references
- `ChatPlaceholder.css`: 5 var(--) references
- `WorkspaceArea.css`: 11 var(--) references
- `WebSocketStatus.css`: (uses var() for status colors)
- `index.css`: 7 var(--) references
- **Total: ~50 var(--) references across 6 files**

---

## Open Questions

1. **tailwind-merge custom class handling**
   - What we know: tailwind-merge 3.5.0 works with default Tailwind classes. Custom @theme tokens generate non-standard class names.
   - What's unclear: Whether `extendTailwindMerge()` is needed for custom color names like `bg-surface` or `text-caption`.
   - Recommendation: Test early in implementation. If custom classes are stripped, configure extendTailwindMerge. The shadcn/ui approach uses default Tailwind names which avoid this issue, but our custom names might need explicit handling.

2. **@radix-ui/react-select vs @radix-ui/react-popover for Select component**
   - What we know: UI-SPEC says "Radix primitive: @radix-ui/react-popover (or native select for simple cases)". Radix Select (2.2.6) provides full accessible select with typeahead.
   - What's unclear: Whether the UI-SPEC's Popover recommendation was intentional or an older spec version.
   - Recommendation: Use @radix-ui/react-select for the Select component. It provides typeahead, scroll-into-view, grouped items, and correct ARIA combobox semantics. Style the trigger to match the Input visual contract from UI-SPEC.

3. **Existing component CSS files in workbenches**
   - What we know: 5 CSS files with 50 var(--) references exist from Phase 2.
   - What's unclear: Whether to migrate these CSS files to Tailwind classes now or defer to Phase 4 (Layout).
   - Recommendation: Migrate them in this phase. They are small (5-18 lines each) and serve as proof that the design system works. Leaving old var(--) references creates a split system.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build system | Yes | 24.13.1 | -- |
| pnpm | Package management | Yes | 10.29.3 | -- |
| Vite | Build tool | Yes (installed) | 6.2.0 | -- |

**Missing dependencies with no fallback:** None -- all dependencies are npm packages installable via pnpm.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0, @testing-library/react 14.1.2 |
| Config file | `packages/app/vitest.config.ts` (exists) |
| Quick run command | `cd packages/app && pnpm vitest run --reporter=verbose` |
| Full suite command | `cd packages/app && pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESIGN-01 | Token system: all UI-SPEC color/spacing/typography/elevation/animation values present in theme.css | unit | `cd packages/app && pnpm vitest run src/__tests__/design-tokens.test.ts -x` | No -- Wave 0 |
| DESIGN-02 | All 12 components render without error | unit | `cd packages/app && pnpm vitest run src/__tests__/components-ui.test.tsx -x` | No -- Wave 0 |
| DESIGN-03 | Components use Radix + Tailwind + CVA (no raw CSS files in ui/) | unit/lint | `cd packages/app && ls src/components/ui/*.css 2>/dev/null && echo FAIL \|\| echo PASS` | No -- Wave 0 |
| DESIGN-04 | cn() merges classes without conflict | unit | `cd packages/app && pnpm vitest run src/__tests__/cn-utility.test.ts -x` | No -- Wave 0 |
| DESIGN-05 | Component manifest covers all 12 components with valid schema | unit | `cd packages/app && pnpm vitest run src/__tests__/component-manifest.test.ts -x` | No -- Wave 0 |
| DESIGN-06 | No raw CSS in agent output (verified by component-only API) | manual-only | Agent spawned in Studio workbench cannot produce raw CSS (Phase 8 enforcement) | N/A |

### Sampling Rate
- **Per task commit:** `cd packages/app && pnpm vitest run --reporter=verbose`
- **Per wave merge:** Full test suite
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/app/src/__tests__/design-tokens.test.ts` -- covers DESIGN-01 (verify token CSS variables exist at runtime)
- [ ] `packages/app/src/__tests__/components-ui.test.tsx` -- covers DESIGN-02 (render all 12 components)
- [ ] `packages/app/src/__tests__/cn-utility.test.ts` -- covers DESIGN-04 (class merging)
- [ ] `packages/app/src/__tests__/component-manifest.test.ts` -- covers DESIGN-05 (manifest validation)

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) -- @theme directive, namespaces, inline/static modes, dark mode patterns
- [Tailwind CSS Functions and Directives](https://tailwindcss.com/docs/functions-and-directives) -- @custom-variant, @utility, @theme, @import
- [CVA Documentation](https://cva.style/docs) -- Variant API, compound variants, React+Tailwind example
- npm registry -- All package versions verified via `npm view [package] version` on 2026-04-01

### Secondary (MEDIUM confidence)
- [Tailwind Dark Mode + @custom-variant](https://schoen.world/n/tailwind-dark-mode-custom-variant) -- data-theme attribute pattern with @custom-variant dark
- [Tailwind Dark Mode: class vs data-theme Comparison](https://eastondev.com/blog/en/posts/dev/20260328-tailwind-dark-mode-comparison/) -- Strategy comparison for theme switching
- [Tailwind CSS v4 @theme Design Tokens Guide](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06) -- Migration patterns from CSS custom properties

### Tertiary (LOW confidence)
- None -- all findings verified with official docs or npm registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, APIs verified via official docs
- Architecture: HIGH -- @theme directive and CVA patterns are well-documented, UI-SPEC provides exact values
- Pitfalls: HIGH -- Tailwind v4 @theme behavior verified with official docs, Electron concern based on project's existing vite-plugin-electron setup

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- Tailwind v4 and Radix are mature)
