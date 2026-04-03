# Phase 9: Workbenches & Flow Management - Research

**Researched:** 2026-04-03
**Domain:** React workbench content pages, flow browsing/composition, agent personality, zustand state management
**Confidence:** HIGH

## Summary

Phase 9 replaces 7 placeholder workbench pages with domain-specific content, adds personality-driven agent greetings, builds a flow browser (card grid per workbench), and creates a flow composition UI. The infrastructure is well-established: zustand stores with `Map<WorkbenchId, State>` pattern, design system components (Card, Badge, Button, Tabs, Dialog, Input, Select), and a working backend flows API at `/api/flows` with full CRUD. The `packages/app/src/workbenches/shared/` directory does not exist yet and must be created for the 8 shared components (WorkbenchGreeting, FlowBrowser, FlowCard, FlowComposer, ActionListItem, ContentList, ContentListItem, StatCard).

The two key integration points are: (1) extending the `WorkbenchMeta` interface in `packages/app/src/lib/types.ts` with personality fields (`greeting`, `tone`, `systemPromptSnippet`), and (2) creating a new `flowStore` that fetches from the existing `/api/flows` endpoint and provides `getFlowsByContext()` filtering. Flow execution triggers chat via the existing `sendMessage()` function from `useChatSend.ts`, sending the flow name as a chat message to the workbench agent. No new backend routes are needed -- the existing flows API and the FLOWS.md parsing logic just need a seeding mechanism to populate initial flows from the markdown registry.

**Primary recommendation:** Build shared components first (WorkbenchGreeting, ContentList, StatCard, FlowCard, FlowBrowser, FlowComposer), then fill each workbench page using those shared components, extending the WORKBENCHES array with personality config at the start.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Work workbench shows active chains list + recent activity. List of running/recent chains with status badges, duration, and one-click resume. Task-manager style using existing chain data from sessionStore.
- **D-02:** Explore shows file tree browser + codebase search. Review shows quality gates checklist + audit results. PM shows roadmap timeline + task tracking. Each gets a domain-specific panel layout.
- **D-03:** Settings extends the existing SettingsPage (already has autonomy levels from Phase 8) with full config forms. Archive shows searchable session history list with filters. Studio shows a live component preview canvas with props editors.
- **D-04:** Flows displayed as a card grid within each workbench. Each Card shows flow name, description, chain preview (action count), and a "Run" button. Cards grouped by category. Uses existing Card + Badge components from the design system.
- **D-05:** Executing a flow sends the flow name as a chat message to the workbench agent. The agent compiles and executes the chain. Leverages Phase 7 chat panel infrastructure -- no separate execution UI needed.
- **D-06:** Each workbench agent has a distinct greeting message and maintains a consistent tone in responses. Examples: Review is strict ("What needs auditing?"), Explore is curious ("What shall we discover?"), PM is strategic ("What's the priority?"). Personalities defined as config, not hardcoded.
- **D-07:** Personality config lives in shared workbenchTypes.ts. Extend the existing WORKBENCHES array with personality fields (greeting, tone, systemPrompt snippet). Frontend reads it for greeting display, backend injects the systemPrompt snippet into session initialization.
- **D-08:** v1 composition: select actions from a list + drag to reorder + name the flow + save. No visual graph editor. Uses ACTIONS.md as the action catalog. Simple multi-select pattern, ship fast.

### Claude's Discretion
- Exact file tree component for Explore (reuse existing or new)
- Quality gates data source for Review (VERIFICATION.md files? Gate traces?)
- Roadmap visualization approach for PM (table? timeline? kanban?)
- Component preview sandbox strategy for Studio (iframe? portal? inline?)
- Session history storage/query approach for Archive
- Flow card layout spacing and grouping logic
- Action catalog parsing for flow composition

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BENCH-01 | Work -- active sessions, ongoing chains, the main hub | sessionStore has Map<WorkbenchId, WorkbenchSession> with status/sessionId/lastActivity. ContentList + StatCard + Tabs compose the page. |
| BENCH-02 | Explore -- navigate codebase, understand before acting | Placeholder file tree (search input + placeholder div). FlowBrowser shows explore-context flows. |
| BENCH-03 | Review -- quality gates, approvals, audits | ContentList for gate checks and audit results. Tabs separate the two views. |
| BENCH-04 | PM -- planning, roadmaps, task tracking | ContentList for roadmap phases and tasks. Table-style layout with Tabs. |
| BENCH-05 | Settings -- configuration, preferences, system health (absorbed Maintenance) | Existing SettingsPage with autonomy levels preserved. Add WorkbenchGreeting + StatCard row + FlowBrowser. |
| BENCH-06 | Archive -- historical sessions, searchable memory | Input + Select for search/filter. ContentList for session history. |
| BENCH-07 | Studio -- preview components, test layouts, live renders | Component manifest list from manifest.ts. Placeholder preview area. |
| BENCH-08 | Each workbench agent has its own greeting and work tendency matching its domain | Extend WorkbenchMeta with greeting/tone/systemPromptSnippet fields in types.ts. WorkbenchGreeting card renders from config. |
| BENCH-09 | Each workbench displays its registered flows | FlowBrowser component fetches from flowStore.getFlowsByContext(workbenchId). Card grid layout. |
| FLOW-01 | Flow browser per workbench showing registered flows | flowStore with loadFlows() -> GET /api/flows. FlowBrowser filters by context. Existing backend route at packages/backend/src/routes/flows.ts. |
| FLOW-02 | Archived flows from removed workbenches (Maintenance, Respect) preserved and harvestable | FLOWS.md has maintenance flows (bug-triage/) now under work context. STAR_CONFIGS in shared/workbenchTypes.ts still has maintenance and respect entries. Backend flows API category enum includes 'maintenance'. Seed logic must include these flows. |
| FLOW-03 | Flows surfaced as executable blueprints (not just instructions) | FlowCard shows chain preview (action list from chainTemplate), action count badge, and Run button. |
| FLOW-04 | Flow composition UI -- browse, select, execute flows from the dashboard | FlowComposer dialog with action catalog from ACTIONS.md parsed by backend. HTML5 drag for reorder. Save via POST /api/flows. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack:** React 18 + TypeScript + Vite, Express + ws, pnpm monorepo -- preserve existing stack
- **Design system enforcement:** No raw CSS in agent output. Component library is the only way agents build UI
- **Design tokens only:** All CSS uses `var(--token)` references, zero raw hex values
- **Naming:** React components PascalCase .tsx, hooks camelCase use* prefix, stores camelCase
- **Zustand stores:** Module-level singletons (no provider pyramid)
- **Import aliases:** `@/` maps to packages/app/src/
- **Testing:** Vitest + happy-dom + @testing-library/react
- **No raw CSS:** Use Tailwind utility classes + design tokens exclusively
- **Commit style:** Conventional commits
- **Build after changes:** Rebuild and redeploy whenever code changes are made

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.12 | New flowStore + workbench content state | Existing pattern: sessionStore, pipelineStore, validationStore, uiStore, chatStore all use zustand |
| @radix-ui/react-tabs | ^1.1.13 | Tabbed content in Work, Review, PM, Studio pages | Already used by Tabs component in design system |
| @radix-ui/react-dialog | ^1.1.15 | Flow composition modal (FlowComposer) | Already used by Dialog component in design system |
| @radix-ui/react-select | ^2.2.6 | Category filter in FlowBrowser, workbench filter in Archive | Already used by Select component in design system |
| lucide-react | ^1.7.0 | Icons in greeting cards, action items, stat cards | Already installed, used in Sidebar and types.ts |
| class-variance-authority | ^0.7.1 | CVA variants for new shared components | Already used by all design system components |
| sonner | ^2.0.7 | Toast notifications for flow execution feedback | Already used in AppShell and SettingsPage |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @xyflow/react | (installed) | Pipeline visualization -- already used, no new use in Phase 9 | N/A for Phase 9 |
| react-resizable-panels | ^4.8.0 | Layout panels -- already used, no changes needed | N/A for Phase 9 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 drag API for flow composition | @dnd-kit/core | Better accessibility + touch support, but adds a dependency. D-08 says "ship fast" with native drag. |
| Manual FLOWS.md parsing | Dedicated flow registry DB | FLOWS.md parsing is simpler for v1. Backend already has /api/flows CRUD with storage. |
| Per-workbench data fetching hooks | React Query/TanStack Query | Not warranted. zustand + fetch is the established pattern. No cache invalidation complexity needed. |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure

```
packages/app/src/
  workbenches/
    shared/                          # NEW: shared components for all workbench pages
      WorkbenchGreeting.tsx           # Personality greeting card
      FlowBrowser.tsx                 # Flow card grid + search + category filter
      FlowCard.tsx                    # Single flow card
      FlowComposer.tsx               # Dialog for composing new flows
      ActionListItem.tsx              # Draggable action item in composer
      ContentList.tsx                 # Generic scrollable list
      ContentListItem.tsx             # Row in content list with status badge
      StatCard.tsx                    # Dashboard stat display
    pages/
      WorkPage.tsx                    # REPLACE placeholder
      ExplorePage.tsx                 # REPLACE placeholder
      ReviewPage.tsx                  # REPLACE placeholder
      PMPage.tsx                      # REPLACE placeholder
      SettingsPage.tsx                # EXTEND existing (preserve autonomy)
      ArchivePage.tsx                 # REPLACE placeholder
      StudioPage.tsx                  # REPLACE placeholder
  stores/
    flowStore.ts                      # NEW: flow state management
  lib/
    types.ts                          # EXTEND: add personality to WorkbenchMeta
```

### Pattern 1: Shared Workbench Components

**What:** All 7 workbench pages share WorkbenchGreeting and FlowBrowser. Domain-specific content uses ContentList, StatCard, and Tabs.

**When to use:** Every workbench page follows the same vertical layout structure: Greeting -> Domain Content -> FlowBrowser.

**Example:**
```typescript
// Source: Pattern derived from existing WorkPage placeholder + UI-SPEC layout
export function WorkPage() {
  const workbenchId = useUIStore((s) => s.activeWorkbench);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={workbenchId} />
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Chains</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <ContentList items={activeChains} />
        </TabsContent>
        <TabsContent value="recent">
          <ContentList items={recentChains} />
        </TabsContent>
      </Tabs>
      <FlowBrowser context="work" />
    </div>
  );
}
```

### Pattern 2: Zustand Store with Map<WorkbenchId, State> Isolation

**What:** Per-workbench state isolation using Map keyed by WorkbenchId.

**When to use:** Whenever state needs to be scoped per workbench. Already used by sessionStore, pipelineStore, validationStore, chatStore.

**Example:**
```typescript
// Source: Existing pattern from sessionStore.ts, pipelineStore.ts
import { create } from 'zustand';

interface FlowState {
  flows: FlowDefinition[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: string | null;
  loadFlows: () => Promise<void>;
  getFlowsByContext: (context: string) => FlowDefinition[];
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  addFlow: (flow: FlowDefinition) => Promise<void>;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  loading: false,
  error: null,
  searchQuery: '',
  categoryFilter: null,

  loadFlows: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/flows');
      const data = await res.json();
      if (data.success) {
        set({ flows: data.flows, loading: false });
      }
    } catch (e) {
      set({ error: 'Failed to load flows', loading: false });
    }
  },

  getFlowsByContext: (context) => {
    const { flows, searchQuery } = get();
    let filtered = flows.filter((f) => f.category === context);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),

  addFlow: async (flow) => {
    const res = await fetch('/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });
    if (res.ok) {
      // Re-fetch all flows to stay in sync
      get().loadFlows();
    }
  },
}));
```

### Pattern 3: Personality Extension of WORKBENCHES Array

**What:** Extend the existing `WorkbenchMeta` interface with personality fields and update the `WORKBENCHES` constant array.

**When to use:** Used by WorkbenchGreeting component and backend session initialization.

**Example:**
```typescript
// Source: Existing types.ts extended per D-07
export interface WorkbenchMeta {
  id: WorkbenchId;
  label: string;
  icon: LucideIcon;
  greeting: string;            // NEW
  tone: string;                // NEW
  systemPromptSnippet: string; // NEW
}

export const WORKBENCHES: readonly WorkbenchMeta[] = [
  {
    id: 'work',
    label: 'Work',
    icon: Briefcase,
    greeting: 'What needs building?',
    tone: 'Direct, action-oriented',
    systemPromptSnippet: 'You are a Work agent. Be direct and action-oriented.',
  },
  // ... 6 more entries
] as const;
```

### Pattern 4: Flow Execution via Chat Message

**What:** Flow execution sends the flow name as a chat message using existing sendMessage infrastructure.

**When to use:** When user clicks "Run Flow" on a FlowCard.

**Example:**
```typescript
// Source: Existing useChatSend.ts + D-05 decision
import { sendMessage } from '@/hooks/useChatSend';

function handleRunFlow(workbenchId: WorkbenchId, flowName: string) {
  sendMessage(workbenchId, `/run ${flowName}`);
  toast.success(`Flow '${flowName}' started.`);
}
```

### Anti-Patterns to Avoid

- **Raw CSS in workbench pages:** Use Tailwind utility classes with design tokens exclusively. No `style={{}}` props, no CSS files. Existing SettingsPage already follows this with classes like `text-heading`, `bg-surface-2`, `border-border`.
- **Duplicating workbench page structure:** Extract shared layout into WorkbenchGreeting and FlowBrowser components. Each page should compose from shared primitives, not copy/paste the same Card/Badge layout.
- **Creating new context providers for workbench state:** Use zustand module-level stores (existing pattern). No React.createContext() providers.
- **Hardcoding personality strings in page components:** Personality lives in the WORKBENCHES array in types.ts (config-driven per D-06/D-07).
- **Direct fetch calls in page components:** All API calls go through zustand stores (flowStore.loadFlows(), etc.). Components read from store selectors.
- **Breaking existing SettingsPage autonomy UI:** D-03 says "extends" -- the existing autonomy configuration Card must be preserved, with new sections added above or below it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flow data fetching | Custom fetch + useState | flowStore (zustand) | Consistent with all other stores. Single source of truth for flow data. |
| Tab navigation | Custom tab state | Radix Tabs (@radix-ui/react-tabs) | Already installed, handles keyboard nav, ARIA roles, focus management. |
| Modal dialog for flow composition | Custom overlay + portal | Radix Dialog (@radix-ui/react-dialog) | Already installed, handles focus trap, escape-to-close, overlay click-away. |
| Select dropdown for filters | Custom dropdown | Radix Select (@radix-ui/react-select) | Already installed, handles typeahead, scroll-into-view, ARIA combobox. |
| Toast notifications | Custom notification system | sonner (already used) | toast.success(), toast.error() already wired into AppShell Toaster. |
| Status badges | Custom styled spans | Badge component (design system) | Existing Badge with variant='success'/'warning'/'error'/'info' covers all status states. |
| Card layout | Custom div containers | Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter | Existing Card component with interactive variant handles hover states. |
| Drag and drop for flow composition | Full DnD library | HTML5 native drag API | D-08 explicitly says "no new dependency" and "ship fast". |

**Key insight:** Every UI primitive needed for Phase 9 already exists in the design system. The phase is pure composition -- no new design system components are needed, only new domain-specific compositions of existing primitives.

## Common Pitfalls

### Pitfall 1: FLOWS.md Parsing vs Backend Storage Mismatch
**What goes wrong:** The backend `/api/flows` route reads from key-value storage (`flow:*` keys), but the actual flow definitions live in `.claude/actionflows/FLOWS.md`. If the storage is empty (fresh start with MemoryStorage), the flow browser shows nothing.
**Why it happens:** The flows API was built for runtime registration, not for seeding from FLOWS.md. MemoryStorage is volatile -- data lost on restart.
**How to avoid:** Create a flow seeding mechanism that parses FLOWS.md on backend startup and populates storage with initial flow definitions. This can be a startup script in the backend initialization.
**Warning signs:** Flow browser shows "No flows registered" despite FLOWS.md having many entries.

### Pitfall 2: WorkbenchMeta Type Mismatch Between Frontend and Shared
**What goes wrong:** `packages/app/src/lib/types.ts` defines a simplified 7-workbench `WorkbenchId` type, while `packages/shared/src/workbenchTypes.ts` defines a broader `StarId` with 11+ entries including deprecated workbenches (maintenance, respect, intel, etc.). Extending the wrong one causes type conflicts.
**Why it happens:** Phase 4 decision to create a separate simplified type system for the frontend rebuild.
**How to avoid:** Extend ONLY the frontend `WorkbenchMeta` in `packages/app/src/lib/types.ts`. Do NOT modify the shared workbenchTypes.ts for personality data. The frontend types.ts is the source of truth for the 7-workbench model.
**Warning signs:** TypeScript errors about missing properties on WorkbenchId union members.

### Pitfall 3: SettingsPage Regression
**What goes wrong:** Replacing the SettingsPage content loses the existing autonomy level configuration UI from Phase 8.
**Why it happens:** Other placeholder pages get full rewrites, but SettingsPage already has functional content.
**How to avoid:** Wrap existing autonomy card in the new page layout. Add WorkbenchGreeting ABOVE, add FlowBrowser BELOW. Keep the autonomy card code intact.
**Warning signs:** Autonomy level selects disappear or lose their API connection.

### Pitfall 4: FlowMetadata Category Enum vs Frontend WorkbenchId
**What goes wrong:** The `FlowMetadata.category` field in `@afw/shared` uses a string union including `'maintenance'` and `'intel'`, which don't exist in the frontend's 7-workbench `WorkbenchId`. Filtering `getFlowsByContext('work')` misses flows categorized as `'maintenance'`.
**Why it happens:** The shared types predate the workbench consolidation in Phase 4.1.
**How to avoid:** The flowStore's `getFlowsByContext` should map legacy categories to their new workbench homes: `maintenance` -> `work`, `intel` -> `explore`. This fulfills FLOW-02 (archived flows from removed workbenches preserved and harvestable).
**Warning signs:** Flows from old categories silently disappear from the UI.

### Pitfall 5: Backend Flows API Category Validation
**What goes wrong:** The existing backend `flowMetadataSchema` has a Zod enum for category: `z.enum(['work', 'maintenance', 'explore', 'review', 'settings', 'pm', 'intel'])`. It does NOT include 'archive' or 'studio'. Attempting to save a flow with context 'studio' or 'archive' returns 400.
**Why it happens:** Schema was written before the 7-workbench consolidation.
**How to avoid:** Update the Zod enum in `packages/backend/src/routes/flows.ts` to include all 7 frontend workbench IDs: add `'archive'` and `'studio'` to the category enum.
**Warning signs:** POST /api/flows returns 400 "Invalid flow metadata" when saving flows for archive or studio contexts.

### Pitfall 6: HTML5 Drag API Accessibility Gap
**What goes wrong:** Native HTML5 drag doesn't provide keyboard fallback for reordering actions in the flow composer.
**Why it happens:** HTML5 drag events only fire from mouse/touch input.
**How to avoid:** Per the UI-SPEC accessibility contract: "Provide arrow key fallback for reordering (Up/Down to move selected item)." Implement onKeyDown handler with ArrowUp/ArrowDown to swap items in the chain order list.
**Warning signs:** Screen reader / keyboard-only users cannot reorder actions.

## Code Examples

Verified patterns from the existing codebase:

### WorkbenchGreeting Component Pattern
```typescript
// Source: UI-SPEC Component Inventory + existing WORKBENCHES array pattern
import { Card, CardContent } from '@/components/ui/card';
import { WORKBENCHES } from '@/lib/types';
import type { WorkbenchId } from '@/lib/types';

interface WorkbenchGreetingProps {
  workbenchId: WorkbenchId;
}

export function WorkbenchGreeting({ workbenchId }: WorkbenchGreetingProps) {
  const meta = WORKBENCHES.find((w) => w.id === workbenchId);
  if (!meta) return null;

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <span className="text-accent">&#x25CF;</span>
        <div>
          <p className="text-body font-semibold">{meta.label} Agent</p>
          <p className="text-body">{meta.greeting}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### FlowCard Component Pattern
```typescript
// Source: UI-SPEC Flow Card Colors + Card component API
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FlowCardProps {
  name: string;
  description: string;
  actionCount: number;
  category: string;
  onRun: () => void;
  disabled?: boolean;
}

export function FlowCard({ name, description, actionCount, category, onRun, disabled }: FlowCardProps) {
  return (
    <Card interactive role="listitem">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <Badge variant="default">{category}</Badge>
        <Badge variant="info">{actionCount} actions</Badge>
        <Button
          variant="primary"
          size="sm"
          onClick={onRun}
          disabled={disabled}
          aria-label={`Run ${name}`}
          className="ml-auto"
        >
          Run Flow
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### ContentList Generic Pattern
```typescript
// Source: UI-SPEC Content List Colors + existing design system
import { Badge } from '@/components/ui/badge';

interface ContentListItem {
  id: string;
  primary: string;
  secondary?: string;
  status?: 'running' | 'complete' | 'failed' | 'pending';
  timestamp?: string;
}

interface ContentListProps {
  items: ContentListItem[];
  emptyHeading: string;
  emptyBody: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'default' | 'error' | 'warning'> = {
  running: 'success',
  complete: 'default',
  failed: 'error',
  pending: 'warning',
};

export function ContentList({ items, emptyHeading, emptyBody }: ContentListProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center" role="status">
        <h3 className="text-heading font-semibold">{emptyHeading}</h3>
        <p className="text-body text-text-dim mt-2">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div role="list" className="flex flex-col">
      {items.map((item) => (
        <div
          key={item.id}
          role="listitem"
          className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors"
        >
          <div className="flex flex-col gap-1">
            <span className="text-body">{item.primary}</span>
            {item.secondary && (
              <span className="text-caption text-text-dim">{item.secondary}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {item.status && (
              <Badge variant={STATUS_VARIANT[item.status]} aria-label={`Status: ${item.status}`}>
                {item.status}
              </Badge>
            )}
            {item.timestamp && (
              <span className="text-caption text-text-muted">{item.timestamp}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Flow Seeding from FLOWS.md (Backend)
```typescript
// Source: Existing FLOWS.md structure + backend flows.ts route pattern
// Parse FLOWS.md markdown table rows into FlowMetadata objects

function parseFlowsMarkdown(content: string): Array<{
  name: string;
  description: string;
  category: string;
  chain: string;
}> {
  const flows: Array<{ name: string; description: string; category: string; chain: string }> = [];
  let currentCategory = '';

  for (const line of content.split('\n')) {
    // Detect category headers: ## work, ## explore, etc.
    const categoryMatch = line.match(/^## (\w+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }

    // Parse table rows: | flow-name/ | Purpose text | chain -> steps |
    const rowMatch = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
    if (rowMatch && currentCategory && !rowMatch[1].includes('Flow') && !rowMatch[1].includes('---')) {
      const name = rowMatch[1].trim().replace(/\/$/, '');
      const description = rowMatch[2].trim();
      const chain = rowMatch[3].trim();
      flows.push({ name, description, category: currentCategory, chain });
    }
  }

  return flows;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 9+ workbenches (maintenance, respect, intel, story, cosmic) | 7 workbenches (work, explore, review, pm, settings, archive, studio) | Phase 4.1 | Flow categories need mapping. Maintenance flows -> work context. |
| StarId / cosmicName in workbenchTypes.ts | Simplified WorkbenchId in app/lib/types.ts | Phase 4 | Frontend uses simplified types. Shared types kept for backward compat. |
| Per-component WebSocket connections | Single multiplexed WebSocket via wsClient singleton | Phase 2 | Chat send uses wsClient.send(). No new connections needed. |
| React Context providers for state | Zustand module-level singletons | Phase 2 | All new stores follow zustand pattern. No providers. |
| BEM CSS classes (.workbench-page__heading) | Tailwind utility classes + design tokens | Phase 3 | Existing placeholder pages still use BEM. Phase 9 replaces with Tailwind. |

**Deprecated/outdated:**
- `.workbench-page`, `.workbench-page__heading`, `.workbench-page__body` CSS classes: Used in current placeholder pages. Replace with Tailwind utility classes in Phase 9.
- `StarId`, `cosmicName`, `STAR_CONFIGS`: Legacy types in shared/workbenchTypes.ts. Phase 9 uses frontend's WorkbenchMeta from lib/types.ts exclusively.
- `FlowMetadata.category` enum missing 'archive' and 'studio': Backend Zod schema needs updating to match the 7-workbench model.

## Open Questions

1. **Flow seeding mechanism timing**
   - What we know: Backend has /api/flows CRUD with MemoryStorage. FLOWS.md has ~30 flow definitions. MemoryStorage is volatile.
   - What's unclear: Should seeding happen on every backend startup, or only when storage is empty?
   - Recommendation: Seed on startup if no flows exist in storage (idempotent). Parse FLOWS.md, populate via storage.set() calls. This keeps FLOWS.md as source of truth for default flows while allowing runtime additions.

2. **Work page chain data availability**
   - What we know: sessionStore tracks WorkbenchSession with status/sessionId. PipelineStore tracks nodes/edges per workbench.
   - What's unclear: There's no "chain list" in sessionStore -- it tracks a single session per workbench, not multiple chains.
   - Recommendation: For v1, Work page shows the current session status + pipeline state as "active chain" info. Chain history requires backend data (GET /api/sessions/{id}/chains) which may not be fully wired. Use placeholder data with the ContentList component and wire to real data when Session phase (6) is implemented.

3. **Explore file tree implementation**
   - What we know: D-02 says "file tree browser + codebase search". No file tree component exists.
   - What's unclear: Whether to build a real file tree (requires backend file listing API) or a placeholder.
   - Recommendation: Build a search input + placeholder div with text "File tree will load when agent session is active." The actual file tree is agent-driven content, not static UI. This is within Claude's discretion per CONTEXT.md.

4. **Studio component preview sandbox**
   - What we know: manifest.ts has ComponentManifestEntry[] with all component metadata.
   - What's unclear: How to render live component previews safely.
   - Recommendation: For v1, show the component list from manifest.ts and a placeholder preview area. Live component rendering requires a sandbox approach (iframe or dynamic import) that is Phase 10 scope. This is within Claude's discretion per CONTEXT.md.

5. **ACTIONS.md parsing for flow composition**
   - What we know: ACTIONS.md has a structured markdown table format with action name, purpose, inputs, model, etc.
   - What's unclear: Whether to parse client-side or add a backend endpoint.
   - Recommendation: Add a backend endpoint GET /api/actions that parses ACTIONS.md and returns structured action catalog. This avoids shipping markdown parsing to the frontend and follows the same pattern as flows (backend parses markdown, frontend consumes API).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.0 + happy-dom + @testing-library/react 14.1.2 |
| Config file | packages/app/vitest.config.ts |
| Quick run command | `cd packages/app && pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BENCH-08 | WorkbenchGreeting renders personality greeting from config | unit | `cd packages/app && pnpm vitest run src/workbenches/shared/WorkbenchGreeting.test.tsx -x` | Wave 0 |
| BENCH-09 | FlowBrowser shows flow cards filtered by workbench context | unit | `cd packages/app && pnpm vitest run src/workbenches/shared/FlowBrowser.test.tsx -x` | Wave 0 |
| FLOW-01 | flowStore.loadFlows fetches from /api/flows and populates state | unit | `cd packages/app && pnpm vitest run src/stores/flowStore.test.ts -x` | Wave 0 |
| FLOW-03 | FlowCard shows chain preview, action count, and Run button | unit | `cd packages/app && pnpm vitest run src/workbenches/shared/FlowCard.test.tsx -x` | Wave 0 |
| FLOW-04 | FlowComposer opens dialog, allows action selection, saves flow | unit | `cd packages/app && pnpm vitest run src/workbenches/shared/FlowComposer.test.tsx -x` | Wave 0 |
| BENCH-01 | WorkPage shows active chains and recent activity tabs | unit | `cd packages/app && pnpm vitest run src/workbenches/pages/WorkPage.test.tsx -x` | Wave 0 |
| BENCH-05 | SettingsPage preserves autonomy UI + adds greeting/flows | unit | `cd packages/app && pnpm vitest run src/workbenches/pages/SettingsPage.test.tsx -x` | Wave 0 |
| FLOW-02 | Legacy category flows (maintenance) mapped to work context | unit | `cd packages/app && pnpm vitest run src/stores/flowStore.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `cd packages/app && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test && pnpm type-check`
- **Phase gate:** Full suite green + type-check clean before /gsd:verify-work

### Wave 0 Gaps

- [ ] `packages/app/src/stores/flowStore.test.ts` -- covers FLOW-01, FLOW-02
- [ ] `packages/app/src/workbenches/shared/WorkbenchGreeting.test.tsx` -- covers BENCH-08
- [ ] `packages/app/src/workbenches/shared/FlowBrowser.test.tsx` -- covers BENCH-09
- [ ] `packages/app/src/workbenches/shared/FlowCard.test.tsx` -- covers FLOW-03
- [ ] `packages/app/src/workbenches/shared/FlowComposer.test.tsx` -- covers FLOW-04
- [ ] `packages/app/src/workbenches/pages/WorkPage.test.tsx` -- covers BENCH-01
- [ ] `packages/app/src/workbenches/pages/SettingsPage.test.tsx` -- covers BENCH-05 (update existing or create)

## Discretion Recommendations

Based on research of the existing codebase and CONTEXT.md discretion areas:

### File Tree for Explore
**Recommendation:** Search input + placeholder container. No real file tree in Phase 9. Rationale: File tree requires a backend file-listing API (not yet built) and agent-driven population. Build the UI shell with a search Input and a placeholder div that says "File tree will load when agent session is active."

### Quality Gates Data Source for Review
**Recommendation:** Use static placeholder data in v1. The gate checkpoint system exists in backend (`packages/backend/src/services/gateCheckpoint.ts`), but gate results are stored in memory and not exposed via a clean API for frontend consumption. Use ContentList with placeholder items showing gate names and pass/fail status. Wire to real data when the API is available.

### Roadmap Visualization for PM
**Recommendation:** Table layout using ContentList. Each row is a phase with name, status badge (complete/pending/in-progress), and plan count. Simple, data-dense, consistent with other workbench pages. No timeline or kanban -- those are Phase 10 scope.

### Component Preview for Studio
**Recommendation:** Two-tab layout (Components / Preview). Components tab shows ComponentManifestEntry[] from manifest.ts as a ContentList. Preview tab shows placeholder text "Select a component to preview." Live rendering is Phase 10 scope.

### Session History for Archive
**Recommendation:** Search Input + workbench filter Select + ContentList of sessions. For v1, data comes from in-memory session store (whatever sessions exist). When backend session persistence is implemented (Phase 6), this automatically benefits.

### Flow Card Layout
**Recommendation:** 2-column responsive grid (`grid grid-cols-1 md:grid-cols-2 gap-4`). Cards within a workbench are a flat list (no sub-grouping by sub-category in v1). Search filters across all visible flows.

### Action Catalog Parsing
**Recommendation:** Add a GET /api/actions endpoint on the backend that parses ACTIONS.md and returns a structured JSON array. Frontend FlowComposer fetches from this endpoint when opened.

## Sources

### Primary (HIGH confidence)
- `packages/app/src/lib/types.ts` -- Current WorkbenchMeta interface and WORKBENCHES array
- `packages/app/src/stores/sessionStore.ts` -- Session store pattern (zustand + Map)
- `packages/app/src/stores/chatStore.ts` -- Chat store pattern
- `packages/app/src/stores/validationStore.ts` -- Validation store pattern
- `packages/app/src/hooks/useChatSend.ts` -- Message sending via WebSocket
- `packages/app/src/workbenches/pages/SettingsPage.tsx` -- Existing autonomy UI to preserve
- `packages/app/src/workbenches/workspace/WorkspaceArea.tsx` -- PAGE_MAP routing
- `packages/app/src/components/ui/card.tsx` -- Card component API
- `packages/app/src/components/ui/tabs.tsx` -- Tabs component API
- `packages/app/src/components/ui/manifest.ts` -- Component manifest for Studio
- `packages/backend/src/routes/flows.ts` -- Existing flows CRUD API
- `packages/backend/src/services/personalityParser.ts` -- Personality extraction service
- `packages/shared/src/models.ts` -- FlowMetadata interface
- `packages/shared/src/workbenchTypes.ts` -- Legacy StarConfig with flow/trigger data
- `.claude/actionflows/FLOWS.md` -- Flow definitions (source of truth for seeding)
- `.claude/actionflows/ACTIONS.md` -- Action catalog (source of truth for composition)

### Secondary (MEDIUM confidence)
- UI-SPEC (09-UI-SPEC.md) -- Layout contracts, spacing, typography, color assignments
- CONTEXT.md (09-CONTEXT.md) -- User decisions D-01 through D-08

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, no new packages needed, all patterns verified in existing code
- Architecture: HIGH -- direct extension of established zustand store pattern, design system composition, and page routing via PAGE_MAP
- Pitfalls: HIGH -- all pitfalls identified from actual codebase inspection (type mismatches, missing enum values, volatile storage, regression risks)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- no rapidly evolving dependencies)
