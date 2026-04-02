# Stack Research

**Domain:** Agentic personal OS dashboard (brownfield addition to existing React+Express+Electron monorepo)
**Researched:** 2026-04-01
**Confidence:** HIGH

## Context

This research covers libraries and tools to **ADD** to the existing stack. The codebase already has:
- React 18.2, Vite 6.2, TypeScript 5.3, Electron 35
- Express 4.18, ws 8.14, ioredis 5.3, zod 3.22
- ReactFlow 11.10 (old `reactflow` package), D3 7.9, dagre 0.8.5
- Monaco Editor 0.45, xterm 5.3
- CSS custom properties design token system (no Tailwind currently)
- pnpm workspaces monorepo

Research targets four capability areas:
1. Persistent remote Claude sessions per workbench
2. Node-based pipeline visualizer (upgrade existing ReactFlow)
3. Design system with enforced component library
4. Neural validation via Claude Code hooks

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| `@anthropic-ai/claude-agent-sdk` | 0.2.89 | Persistent Claude sessions per workbench | Official SDK for spawning Claude Code sessions programmatically. Provides `query()` with `resume` option for persistent sessions, `listSessions()` / `getSessionMessages()` for session management, streaming via async generators, and `AgentDefinition` for subagent orchestration. This is the canonical way to embed Claude Code into applications. Replaces the deprecated `@anthropic-ai/claude-code` package. | HIGH |
| `@xyflow/react` | 12.10.2 | Pipeline visualizer (replace `reactflow` 11) | ReactFlow rebranded to `@xyflow/react` in v12. Better TypeScript support, SSR compatibility, dark mode, `node.measured` dimensions, and improved performance. The project already uses ReactFlow 11 -- this is a required upgrade, not a new addition. Custom node types (rounded rect for steps, diamond for decision gates) are well-supported. | HIGH |
| `tailwindcss` | 4.2.2 | Utility-first CSS framework for design system | Tailwind CSS v4 is CSS-first (no JS config file), exposes all design tokens as native CSS variables via `@theme`, and has a dedicated Vite plugin for optimal build performance. The project already uses CSS custom properties -- Tailwind v4 formalizes this into an enforceable system. Agents compose UI from utility classes, eliminating raw CSS. | HIGH |
| `@tailwindcss/vite` | 4.2.2 | Tailwind Vite integration | Dedicated Vite plugin replaces PostCSS-based setup. Faster builds, better HMR, native integration with the existing Vite 6 toolchain. | HIGH |
| `zustand` | 5.0.12 | Client-side state management | Lightweight store for per-workbench state (session status, pipeline nodes, chat history, UI state). No boilerplate, TypeScript-native, middleware support (persist, devtools). Zustand is the standard choice for React apps in 2025-2026 that need shared state without Redux ceremony. Each workbench gets its own store slice. | HIGH |
| `react-resizable-panels` | 4.8.0 | 3-panel resizable layout | The de facto library for IDE-like resizable panel layouts in React. Powers the shadcn/ui Resizable component. Supports horizontal/vertical splits, min/max constraints, keyboard resize, collapse/snap, and layout persistence. Perfect for the sidebar (20%) + workspace (55%) + chat panel (25%) layout. | HIGH |

### Design System Libraries

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| `class-variance-authority` | 0.7.1 | Component variant API | Type-safe variant definitions for component styling. Defines `variants`, `compoundVariants`, and `defaultVariants` as a structured API. Framework-agnostic -- works with Tailwind classes, CSS modules, or raw classes. This is how agents will compose component variants without writing arbitrary CSS. | HIGH |
| `clsx` | 2.1.1 | Conditional class composition | Tiny utility for conditionally joining class names. Standard companion to CVA and Tailwind. Used inside every component to merge base classes, variant classes, and consumer-provided classes. | HIGH |
| `tailwind-merge` | 3.5.0 | Tailwind class deduplication | Resolves Tailwind class conflicts intelligently (e.g., `px-4` + `px-2` = `px-2`). Essential when components accept className props that may override internal classes. Without this, class conflicts create unpredictable styling. | HIGH |
| `@radix-ui/react-dialog` | 1.1.15 | Accessible modal dialogs | Unstyled, accessible dialog primitive. Handles focus trapping, escape key, scroll lock, ARIA attributes. Style with Tailwind. The project needs modals for session management, settings, confirmations. | HIGH |
| `@radix-ui/react-tabs` | 1.1.13 | Tab navigation | Accessible tab primitive for workbench sub-navigation. Handles keyboard navigation, ARIA roles. | HIGH |
| `@radix-ui/react-tooltip` | 1.2.8 | Tooltips | Accessible tooltip primitive with collision-aware positioning. Needed throughout the dashboard for toolbar buttons, node hover info, status indicators. | HIGH |
| `@radix-ui/react-scroll-area` | 1.2.10 | Custom scrollbars | Styled scroll containers that maintain native scroll behavior. Needed for chat panels, sidebar lists, pipeline overflow. | HIGH |
| `@radix-ui/react-dropdown-menu` | 2.1.16 | Dropdown menus | Accessible dropdown with sub-menus, keyboard navigation. Needed for workbench actions, context menus, session controls. | HIGH |
| `@radix-ui/react-context-menu` | 2.2.16 | Right-click context menus | Accessible context menu for pipeline nodes, workbench items. Same API pattern as dropdown-menu. | HIGH |
| `@radix-ui/react-separator` | 1.1.8 | Visual separators | Accessible horizontal/vertical dividers. Semantic `<hr>` with ARIA. | HIGH |
| `@radix-ui/react-slot` | 1.2.4 | Component composition (asChild) | Enables the `asChild` pattern where a component's behavior transfers to its child element. Core to building a composable component library. | HIGH |
| `@radix-ui/react-popover` | 1.1.15 | Popovers | Floating content panels anchored to triggers. Used for session info, node details, filter controls. | HIGH |
| `@radix-ui/react-switch` | 1.2.6 | Toggle switches | Accessible on/off toggle for settings. | HIGH |
| `@radix-ui/react-accordion` | 1.2.12 | Collapsible sections | Accessible accordion for sidebar navigation, settings groups, flow lists. | HIGH |
| `lucide-react` | 1.7.0 | Icon library | Consistent, tree-shakeable icon set. 1000+ icons, each as a named React component. Replaces ad-hoc SVGs. Standard companion to Tailwind-based design systems. | HIGH |
| `sonner` | 2.0.7 | Toast notifications | Lightweight, accessible toast system. Used for session events (connected, disconnected, error), validation results, agent notifications. Simpler and more performant than react-hot-toast. | HIGH |
| `cmdk` | 1.1.1 | Command palette | Accessible command palette component (Radix-based). Enables keyboard-driven navigation across workbenches, sessions, flows. Critical UX for power users. The project already has a CommandPalette component -- cmdk provides the accessible foundation. | MEDIUM |

### Claude Integration Libraries

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| `@anthropic-ai/claude-agent-sdk` | 0.2.89 | Session lifecycle management (backend) | Install in `packages/backend`. The backend spawns and manages Claude sessions, one per workbench. Key API: `query({ prompt, options: { resume: sessionId } })` for persistent sessions. Sessions persist to disk at `~/.claude/projects/` automatically. The `streamInput()` method enables multi-turn conversations. `forkSession` option enables branching. | HIGH |
| (No additional package needed) | -- | Claude Code hooks (neural validation) | Hooks are configured via `.claude/settings.json` / `.claude/settings.local.json` -- no npm package required. Four hook types: `command` (shell scripts), `http` (webhook to backend), `prompt` (Claude evaluates), `agent` (subagent verifies). Key events: `PreToolUse`, `PostToolUse`, `SubagentStart`, `SubagentStop`. The `http` hook type is ideal for neural validation -- hooks POST to Express endpoints that evaluate design system compliance. | HIGH |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| `@storybook/react` 10.3.3 | Component library development & documentation | Isolated component development environment. Agents and humans preview components in the Studio workbench. Storybook 10 supports Vite natively, React 18, and has built-in accessibility testing. Install with `npx storybook@latest init`. | MEDIUM |
| `eslint-plugin-tailwindcss` | Lint Tailwind class usage | Enforces Tailwind class ordering, catches invalid classes, prevents arbitrary values. Part of the design system enforcement layer -- agents cannot use non-existent utility classes. | HIGH |
| `prettier-plugin-tailwindcss` | Auto-sort Tailwind classes | Canonical class ordering in source code. Eliminates class order debates. Runs on save and in CI. | HIGH |

---

## Installation

```bash
# ── Core (frontend package) ──
cd packages/app
pnpm add @xyflow/react@^12.10.2 zustand@^5.0.12 react-resizable-panels@^4.8.0

# ── Design System (frontend package) ──
pnpm add tailwindcss@^4.2.2 class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^3.5.0
pnpm add lucide-react@^1.7.0 sonner@^2.0.7 cmdk@^1.1.1
pnpm add -D @tailwindcss/vite@^4.2.2 eslint-plugin-tailwindcss prettier-plugin-tailwindcss

# ── Radix Primitives (frontend package) ──
pnpm add @radix-ui/react-dialog@^1.1.15 @radix-ui/react-tabs@^1.1.13 \
  @radix-ui/react-tooltip@^1.2.8 @radix-ui/react-scroll-area@^1.2.10 \
  @radix-ui/react-dropdown-menu@^2.1.16 @radix-ui/react-context-menu@^2.2.16 \
  @radix-ui/react-separator@^1.1.8 @radix-ui/react-slot@^1.2.4 \
  @radix-ui/react-popover@^1.1.15 @radix-ui/react-switch@^1.2.6 \
  @radix-ui/react-accordion@^1.2.12

# ── Claude Integration (backend package) ──
cd ../backend
pnpm add @anthropic-ai/claude-agent-sdk@^0.2.89

# ── Storybook (frontend package, dev only) ──
cd ../app
npx storybook@latest init

# ── Remove deprecated package ──
pnpm remove reactflow @reactflow/core
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@anthropic-ai/claude-agent-sdk` | Direct CLI spawning via `child_process` | The SDK handles session persistence, streaming, abort, error recovery, and process lifecycle. Raw `child_process` would require reimplementing all of this. SDK also provides typed message streams. |
| `@anthropic-ai/claude-agent-sdk` | Anthropic API SDK (`@anthropic-ai/sdk`) | The API SDK calls the Anthropic API directly but lacks Claude Code's tool system (file editing, bash, MCP). The Agent SDK wraps Claude Code and provides the full agentic toolset needed for workbench sessions. |
| `zustand` | Jotai (atomic state) | Jotai is better for fine-grained reactivity in forms/editors. But the dashboard needs centralized per-workbench stores (session state, pipeline data, chat history) -- Zustand's store model maps more naturally. Both are viable; Zustand is simpler for this use case. |
| `zustand` | Redux Toolkit | Overkill for this project. RTK's ceremony (slices, actions, reducers) adds complexity without benefit when Zustand handles the same patterns in fewer lines. |
| Tailwind CSS v4 | Keep CSS custom properties only | The project already has design tokens as CSS vars. But raw CSS properties don't enforce a utility class vocabulary -- agents can still write arbitrary CSS. Tailwind constrains the design space to predefined utilities, which is the enforcement mechanism the design system needs. Tailwind v4 preserves existing CSS vars via `@theme`. |
| Tailwind CSS v4 | CSS Modules + design tokens | CSS Modules scope styles but don't constrain the design vocabulary. Agents could write any CSS within a module. Tailwind's utility-first approach means agents compose from a fixed set of classes -- the "component library is the only way agents build UI" constraint. |
| Tailwind CSS v4 | styled-components / Emotion | CSS-in-JS adds runtime overhead, complicates Vite's CSS extraction, and doesn't constrain the design vocabulary. Tailwind's static utility classes are faster (zero runtime), tree-shake unused styles, and produce predictable output. |
| `react-resizable-panels` | Allotment | Allotment is derived from VS Code's split view and is excellent, but react-resizable-panels has better React integration, is the foundation for shadcn/ui's Resizable component, and has a more active maintenance cadence (v4 released 2025). |
| Radix UI primitives | MUI (Material UI) | MUI comes with opinionated Material Design styling. Stripping it to build a custom design system is more work than starting with unstyled Radix primitives. MUI's bundle size is also significantly larger. |
| Radix UI primitives | Headless UI | Headless UI has fewer components (no tooltip, scroll-area, context-menu, accordion, popover). Radix covers every primitive the dashboard needs. |
| shadcn/ui components (copy-paste) | Installing shadcn/ui as dependency | shadcn/ui is a copy-paste pattern, not an npm dependency. For this project, we'll take the same approach: use Radix primitives + Tailwind + CVA to build our own component library. We borrow shadcn/ui's patterns (especially the `cn()` utility and variant structure) but own the code. This gives full control for agent-composed UI. |
| `sonner` | react-hot-toast | Sonner is smaller, has better accessibility, supports promise-based toasts, and has a cleaner API. react-hot-toast hasn't seen active development. |
| `lucide-react` | Heroicons, Phosphor, react-icons | Lucide has the largest icon set (1000+), is tree-shakeable, TypeScript-native, and is the standard companion for Tailwind-based design systems (used by shadcn/ui). react-icons bundles multiple icon sets but isn't tree-shakeable by default. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `reactflow` (v11 package) | Deprecated package name. xyflow rebranded; v11 won't receive updates. | `@xyflow/react` ^12.10.2 |
| `@anthropic-ai/claude-code` | Deprecated. Renamed to `@anthropic-ai/claude-agent-sdk`. | `@anthropic-ai/claude-agent-sdk` ^0.2.89 |
| `styled-components` / `@emotion/react` | CSS-in-JS adds runtime overhead, complicates SSR/streaming, and doesn't constrain the design vocabulary agents use. | Tailwind CSS v4 + CVA |
| `@mui/material` | Opinionated Material Design. Fighting the default styling to build a custom design system is wasted effort. Large bundle. | Radix UI primitives + Tailwind |
| `redux` / `@reduxjs/toolkit` | Unnecessary ceremony for this project's state needs. Zustand provides the same capabilities with 90% less boilerplate. | `zustand` |
| `react-hot-toast` | Unmaintained, accessibility gaps, larger API surface than needed. | `sonner` |
| `@anthropic-ai/sdk` (raw API) | Calls Anthropic API directly but lacks Claude Code's tool system (bash, file editing, MCP). Cannot provide the agentic workbench experience. | `@anthropic-ai/claude-agent-sdk` |
| PostCSS for Tailwind | Tailwind v4 has a dedicated Vite plugin (`@tailwindcss/vite`). PostCSS setup is the legacy approach and is slower. | `@tailwindcss/vite` |
| `node-cron` / external schedulers | Claude Code has built-in `/loop` and cron capabilities. External cron for agent tasks is redundant. | Claude Code's native cron |

---

## Stack Patterns by Capability

### Persistent Claude Sessions Per Workbench

**Pattern:** Backend manages a `SessionManager` service that maps workbench IDs to Claude Agent SDK sessions.

```typescript
import { query, listSessions } from "@anthropic-ai/claude-agent-sdk";

// Create or resume session for a workbench
const session = query({
  prompt: userMessage,
  options: {
    resume: existingSessionId,       // Resume persisted session
    cwd: projectDir,
    settingSources: ["user", "project", "local"],
    hooks: { /* programmatic hooks */ },
    persistSession: true,            // Sessions survive restarts
  }
});

// Stream messages to frontend via WebSocket
for await (const message of session) {
  ws.send(JSON.stringify(message));
}
```

**Key capabilities:**
- `resume` option reconnects to existing session (survives app restarts)
- `forkSession` branches a conversation for exploration
- `streamInput()` enables multi-turn conversations via async iterable
- `listSessions()` discovers past sessions by project directory
- `getSessionMessages()` retrieves conversation history for UI rendering
- Sessions persist to `~/.claude/projects/` automatically

### Pipeline Visualizer Upgrade

**Pattern:** Replace `reactflow` with `@xyflow/react`, use custom node types for steps and decision gates.

```typescript
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom node types for pipeline visualization
const nodeTypes = {
  step: StepNode,           // Rounded rectangle
  decision: DecisionNode,   // Diamond shape
};
```

**Migration from v11:**
- Change imports: `reactflow` -> `@xyflow/react`
- Change style import: `reactflow/dist/style.css` -> `@xyflow/react/dist/style.css`
- Node dimensions now at `node.measured.width` / `node.measured.height`
- Named exports only (no default import)

### Design System Enforcement

**Pattern:** Three-layer architecture: Tailwind tokens -> CVA variants -> React components.

```typescript
// Layer 1: Tailwind tokens in CSS (@theme directive)
// @theme { --color-surface: var(--app-bg-primary); }

// Layer 2: CVA variant definitions
import { cva } from "class-variance-authority";
const buttonVariants = cva("rounded-md font-medium transition-colors", {
  variants: {
    variant: { primary: "bg-accent text-white", ghost: "hover:bg-surface-2" },
    size: { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-base" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

// Layer 3: React component with cn() utility
import { cn } from "@/lib/utils";
function Button({ variant, size, className, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

**The `cn()` utility** (borrowed from shadcn/ui pattern):
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Neural Validation via Hooks

**Pattern:** HTTP hooks POST to Express backend for design system compliance checking.

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3001/api/hooks/validate-design-system",
            "timeout": 30
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3001/api/hooks/agent-started"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3001/api/hooks/agent-stopped"
          }
        ]
      }
    ]
  }
}
```

**Hook handler types relevant to neural validation:**
- `command`: Shell scripts for fast structural checks (file exists, class names valid)
- `http`: POST to Express for semantic validation (design system compliance, component library enforcement)
- `prompt`: Claude evaluates output against design system rules (expensive but thorough)
- `agent`: Subagent verifies with tool access (most powerful, used for deep analysis)

**Available hook events for pipeline visualization:**
- `SubagentStart` / `SubagentStop`: Track agent lifecycle for pipeline node status
- `PreToolUse` / `PostToolUse`: Track tool execution for step-level progress
- `TaskCreated` / `TaskCompleted`: Track background tasks

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@xyflow/react` 12.x | React 18.2+ | Requires React 17+ (React 18 recommended for concurrent features) |
| `tailwindcss` 4.x | Vite 6.x via `@tailwindcss/vite` | Vite plugin replaces PostCSS setup. Both must be same version (4.2.2). |
| `tailwindcss` 4.x | Existing CSS custom properties | v4 `@theme` directive can reference existing `var(--token)` values. Migration is additive, not destructive. |
| `zustand` 5.x | React 18.2+ | v5 requires React 18+. Uses `useSyncExternalStore` internally. |
| `@anthropic-ai/claude-agent-sdk` 0.2.x | Node.js 18+ | Requires Claude Code CLI installed. Uses `child_process` spawn internally. |
| `@radix-ui/react-*` 1.x/2.x | React 18.2+ | All Radix primitives support React 18. Some (dropdown-menu, context-menu) are at v2 major. |
| `react-resizable-panels` 4.x | React 18.2+ | v4 requires React 16.14+. |
| `class-variance-authority` 0.7.x | Any (framework-agnostic) | No React dependency. Works with any class-based styling approach. |
| `sonner` 2.x | React 18+ | v2 requires React 18 for transitions. |
| `cmdk` 1.x | React 18+, Radix UI | Built on Radix primitives internally. |

---

## Tailwind v4 Migration Strategy

The project currently uses raw CSS custom properties (`design-tokens.css`). Tailwind v4 migration is **additive**, not a rewrite:

1. **Keep existing tokens**: The `design-tokens.css` file stays. Tailwind v4's `@theme` directive references existing CSS vars.
2. **Create `@theme` mapping**: Map existing `--app-bg-primary`, `--text-primary`, etc. into Tailwind's theme namespace.
3. **Gradual adoption**: New components use Tailwind utilities. Existing components migrate incrementally.
4. **No breaking changes**: CSS custom properties continue to work. Tailwind adds utility classes on top.

```css
/* src/styles/tailwind-theme.css */
@import "tailwindcss";

@theme {
  --color-surface: var(--app-bg-primary);
  --color-surface-2: var(--app-bg-secondary);
  --color-surface-3: var(--app-bg-tertiary);
  --color-text: var(--text-primary);
  --color-text-dim: var(--text-secondary);
  --color-text-muted: var(--text-tertiary);
  --color-accent: var(--system-blue);
  --color-border: var(--separator-base);
}
```

---

## Sources

- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- Full API docs for `query()`, session management, `AgentDefinition`, hooks. **HIGH confidence.**
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Complete hook event list, matcher format, handler types, output schema. **HIGH confidence.**
- [Migrate to Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/migration-guide) -- Confirmed `@anthropic-ai/claude-code` renamed to `@anthropic-ai/claude-agent-sdk`. **HIGH confidence.**
- [React Flow Migration Guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) -- v11 to v12 migration steps, package rename to `@xyflow/react`. **HIGH confidence.**
- [@xyflow/react npm](https://www.npmjs.com/package/@xyflow/react) -- Version 12.10.2 confirmed via `npm view`. **HIGH confidence.**
- [Tailwind CSS v4 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, `@theme` directive, Vite plugin. **HIGH confidence.**
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) -- `@theme` directive documentation, CSS variable exposure. **HIGH confidence.**
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) -- Installation steps, Tailwind v4 support confirmed. **HIGH confidence.**
- [CVA Documentation](https://cva.style/docs) -- Variant API, compound variants, framework-agnostic design. **HIGH confidence.**
- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels) -- v4 API, IDE layout pattern. **HIGH confidence.**
- [State Management in 2026](https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge) -- Zustand as standard choice for React 2025-2026. **MEDIUM confidence** (community article, but aligns with npm download trends).
- All package versions verified via `npm view [package] version` on 2026-04-01. **HIGH confidence.**

---
*Stack research for: Agentic personal OS dashboard (brownfield additions)*
*Researched: 2026-04-01*
