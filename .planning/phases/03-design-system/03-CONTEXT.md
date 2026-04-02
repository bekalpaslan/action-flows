# Phase 3: Design System - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete design token system and component library that agents and humans compose from exclusively. Migrate existing CSS custom properties into Tailwind v4 as the single source of truth. Create all 12 core components with Radix primitives + Tailwind + CVA. Support both dark and light themes. Create the machine-readable component manifest that agents consume.

</domain>

<decisions>
## Implementation Decisions

### Token Migration
- **D-01:** Replace design-tokens.css with Tailwind v4 ownership — migrate all token values into Tailwind v4 `@theme` config. Delete the existing 993-line `design-tokens.css`. Tailwind becomes the single source of truth for all design tokens.
- **D-02:** Components use Tailwind utility classes that resolve to tokens. No raw CSS values anywhere.

### Component Scope
- **D-03:** Build all 12 core components in Phase 3 — Button, Card, Dialog, Tabs, Tooltip, Dropdown, Input, Select, Checkbox, Radio, Badge, Avatar. Complete library before any workbench content.
- **D-04:** All components built with Radix UI primitives + Tailwind v4 + CVA variants (per project research).
- **D-05:** `cn()` utility (clsx + tailwind-merge) for conflict-free class composition.

### Theming
- **D-06:** Both dark and light themes from the start — tokens structured for theme switching via CSS class or media query. No single-theme retrofit later.
- **D-07:** Current GitHub-dark palette is the dark theme. Light theme derived as a complementary set.

### Component Manifest
- **D-08:** Machine-readable component manifest — a JSON/TypeScript registry that agents consume to know what components exist, their props, variants, and composition patterns. This is how agents "see" the component library.

### Claude's Discretion
- Tailwind v4 `@theme` structure and naming conventions
- How to organize the component library directory (`src/components/ui/` or `src/lib/components/`)
- Theme switching mechanism (CSS class toggle vs. media query vs. both)
- Component manifest format (JSON schema, TypeScript type exports, or generated from source)
- Whether to include Storybook or a simpler component preview in this phase
- Exact Radix primitives to use per component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Research
- `.planning/research/STACK.md` — Tailwind v4.2.2, @tailwindcss/vite, Radix UI primitives, CVA 0.7.1, clsx, tailwind-merge recommendations
- `.planning/research/ARCHITECTURE.md` — Component library as infrastructure pattern
- `.planning/research/FEATURES.md` — Design token system as table stakes, component manifest for agents
- `.planning/research/PITFALLS.md` — P3 (design system bypass by agents), P5 (brownfield rewrite)

### Existing Design Tokens (being replaced)
- `packages/app/src/styles/design-tokens.css` — 993-line existing token system (source for migration values)
- `packages/app/src/styles/design-tokens-guide.css` — Token documentation/guide
- `packages/app/src/styles/themes/` — Existing theme directory

### Phase 2 Output (foundation)
- `packages/app/src/workbenches/shell/AppShell.tsx` — Shell that will consume the design system
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx` — Sidebar using design tokens
- `packages/app/vite.config.ts` — Vite config needing @tailwindcss/vite plugin

</canonical_refs>

<code_context>
## Existing Code Insights

### What Gets Replaced
- `packages/app/src/styles/design-tokens.css` (993 lines) — values migrated into Tailwind v4 @theme
- All `var(--token-name)` references in shell CSS files — replaced with Tailwind utility classes

### What Gets Created
- Tailwind v4 config with @theme consuming all token values (color, spacing, typography, elevation, animation)
- `@tailwindcss/vite` plugin integration in vite.config.ts
- 12 Radix + Tailwind + CVA components
- `cn()` utility
- Component manifest (JSON/TS registry)
- Dark + light theme definitions

### Integration Points
- `packages/app/vite.config.ts` — needs @tailwindcss/vite plugin
- `packages/app/src/index.css` — Tailwind v4 entry point
- Shell components (AppShell, SidebarPlaceholder, etc.) — migrate from raw CSS vars to Tailwind classes
- Agent spawn prompts — will reference the component manifest

</code_context>

<specifics>
## Specific Ideas

No specific UI references — design system builds on the existing GitHub-dark aesthetic. The key constraint is that this library becomes the ONLY way agents build UI (DESIGN-06 requirement).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-design-system*
*Context gathered: 2026-04-02*
