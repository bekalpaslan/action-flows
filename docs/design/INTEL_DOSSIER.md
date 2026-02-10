# Intel Dossier — Design Specification

**Feature:** Intel Dossier System
**Status:** Design Phase
**Version:** 1.0
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Architecture](#architecture)
4. [User Experience](#user-experience)
5. [Data Model](#data-model)
6. [Widget System](#widget-system)
7. [Suggestion Box](#suggestion-box)
8. [Implementation Plan](#implementation-plan)
9. [Open Topics](#open-topics)

---

## Overview

### What Is Intel Dossier?

**Intel Dossier** is a first-class workbench feature that provides **living dossiers** — persistent, evolving intelligence pages about code folders/paths. Unlike static analysis reports, dossiers are born, watch for changes, grow over time, and accumulate insights.

### Philosophy

Intel Dossiers embody the **Living Universe** at the codebase level. Where humans provide will, orchestrators provide brain, and agents provide hands, **dossiers provide memory**.

**Dossiers as Living Organisms:**

A dossier is not a static analysis report—it's a **living organism** that:

- **Watches** its domain (file paths) for changes
- **Learns** through re-analysis (accumulates insights over time)
- **Remembers** prior states (temporal depth)
- **Grows** with the codebase (domain understanding deepens)
- **Signals** when the physics (code) are changing in unexpected ways

**From Passive to Active:**

The ActionFlows Dashboard shifts from **passive observer** (monitoring AI work) to **active intelligence gatherer** (initiating analysis). Intel is the framework's **intelligence division** — continuously learning and growing alongside the codebase.

**Journey Integration:**

As you explore the ActionFlows universe, you create dossiers for domains that matter. Over time, these dossiers accumulate wisdom about your codebase. This is **co-evolution**—you and your code's memory growing together.

When the brain (orchestrator) needs to understand a domain, it consults the dossier (memory). The dossier informs the brain's decisions about which laws (code) to rewrite and how.

### Key Characteristics

- **Persistent** — Dossiers live permanently, accumulating insights over time
- **Active** — Watches for file changes and triggers re-analysis automatically
- **Evolutionary** — New analysis builds ON TOP of prior knowledge (temporal depth)
- **Multi-path** — A single dossier can track multiple folders/files as a domain
- **Intent-driven** — User provides free-form natural language context to guide analysis
- **Self-composing** — Agent selects widgets from a catalog to build the dossier page

---

## Core Concepts

### Dossier

A **dossier** is a living intelligence page about a code domain. It contains:

- **Name** — Human-readable identifier (e.g., "Auth System", "Backend Services")
- **Targets** — Multiple paths to watch (folders and/or files)
- **Context** — Free-form natural language describing what to focus on
- **State** — Current analysis results (widgets, insights, metrics)
- **History** — Prior analysis states for temporal comparison
- **Metadata** — Creation date, last updated, re-analysis count, etc.

### Domain-Centric Design

A dossier watches a **domain**, not a single folder.

**Example:** "Auth System" dossier watches:
- `packages/backend/src/middleware/auth.ts`
- `packages/app/src/contexts/AuthContext.tsx`
- `packages/shared/src/types/user.ts`

The agent sees the full picture across package boundaries. This is critical for understanding cross-cutting concerns.

### Lifecycle

```
Birth (User Creation)
  ↓
Life (File Watching + Re-Analysis)
  ↓
Growth (Insight Accumulation)
  ↓
Memory (Temporal Depth)
```

#### 1. Birth
User creates dossier via creation UI:
- Provides name, target paths, and free-form context
- System initializes file watcher for target paths
- Agent runs initial analysis

#### 2. Life
File watcher detects changes in watched paths:
- Triggers re-analysis automatically (or manual trigger)
- Agent receives prior dossier state + changed files
- Agent updates dossier incrementally

#### 3. Growth
Over time, dossier accumulates insights:
- "Test coverage dropped 3 times this week"
- Trend detection across multiple analyses
- Temporal comparison ("Changed since last analysis")

#### 4. Memory
Re-analysis prompt includes prior dossier state:
- Not a fresh analysis every time
- Incremental knowledge updates
- Agent builds ON TOP of what it already knows

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Intel Workbench                              │  │
│  │  ├── Dossier List                             │  │
│  │  ├── Dossier View (Widget Renderer)           │  │
│  │  └── Dossier Creation                         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕ WebSocket
┌─────────────────────────────────────────────────────┐
│                  Backend (Express)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Dossier API                                  │  │
│  │  ├── POST /api/dossiers (create)              │  │
│  │  ├── GET /api/dossiers (list)                 │  │
│  │  ├── GET /api/dossiers/:id (read)             │  │
│  │  ├── PUT /api/dossiers/:id (update)           │  │
│  │  ├── DELETE /api/dossiers/:id (delete)        │  │
│  │  └── POST /api/dossiers/:id/analyze (trigger) │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  File Watcher Service (chokidar)              │  │
│  │  ├── Watches dossier target paths             │  │
│  │  ├── Debounces change events                  │  │
│  │  └── Triggers re-analysis                     │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Storage Layer (MemoryStorage/Redis)          │  │
│  │  ├── Dossier state                            │  │
│  │  ├── Dossier history                          │  │
│  │  └── Suggestion box entries                   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕ CLI Session
┌─────────────────────────────────────────────────────┐
│              ActionFlows Orchestrator                │
│  ┌───────────────────────────────────────────────┐  │
│  │  Intel Action Agent                           │  │
│  │  ├── Receives: target paths, context, prior   │  │
│  │  │             state, changed files           │  │
│  │  ├── Analyzes: code structure, metrics,       │  │
│  │  │             relationships, trends          │  │
│  │  └── Outputs: layout descriptor JSON          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18.2 + Vite 5 + Electron 28 | Intel workbench UI, widget renderer |
| **Backend** | Express 4.18 + TypeScript + ws 8.14.2 | Dossier API, file watching, WebSocket events |
| **Storage** | MemoryStorage (dev) / Redis 5.3 (prod) | Dossier state + history persistence |
| **File Watching** | chokidar | Detect changes in target paths |
| **Agent** | Claude CLI + ActionFlows | Analysis execution, layout descriptor generation |
| **Types** | @afw/shared (branded strings) | DossierId, WidgetType, etc. |

### Existing Integrations

| Component | Current Use | Intel Use |
|-----------|-------------|-----------|
| **chokidar** | Watch files per session | Watch dossier target paths |
| **MemoryStorage/Redis** | Persist session state | Persist dossier state + history |
| **Claude CLI sessions** | Bidirectional streaming | Re-analysis execution |
| **Self-Evolving UI Registry** | Custom prompt buttons | Widget catalog storage |
| **Context routing** | Route to Work, Review, etc. | New Intel context |
| `.auto-claude/` | Proves output schema pattern | Layout descriptor validation |

---

## User Experience

### Intel Workbench UI

```
┌─────────────────────────────────────────────────────┐
│  TopBar: [Work] [Review] [Explore] [Intel] [...]    │
└─────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────┐
│                  Intel Workbench                     │
│  ┌───────────┬─────────────────────────────────────┐│
│  │           │                                     ││
│  │ Dossiers  │      [+ New Dossier]                ││
│  │           │                                     ││
│  │ ┌───────┐ │  ┌─────────────────────────────┐   ││
│  │ │ Auth  │ │  │  Auth System Dossier        │   ││
│  │ │ System│ │  │  ┌────┐ ┌────┐ ┌──────────┐ │   ││
│  │ └───────┘ │  │  │Stat│ │Stat│ │ Insights │ │   ││
│  │           │  │  └────┘ └────┘ └──────────┘ │   ││
│  │ ┌───────┐ │  │  ┌────────────────────────┐ │   ││
│  │ │Backend│ │  │  │  Dependency Graph      │ │   ││
│  │ │Service│ │  │  └────────────────────────┘ │   ││
│  │ └───────┘ │  │  ┌────────────────────────┐ │   ││
│  │           │  │  │  Change Timeline       │ │   ││
│  │           │  │  └────────────────────────┘ │   ││
│  │           │  └─────────────────────────────┘   ││
│  └───────────┴─────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Dossier Creation Flow

```
[+ New Dossier] → Opens dialog:

┌─────────────────────────────────────────────────────┐
│  Create New Dossier                                  │
│                                                      │
│  Name: ____________________________________          │
│                                                      │
│  Targets:                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ packages/backend/src/middleware/auth.ts        │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ packages/app/src/contexts/AuthContext.tsx      │ │
│  └────────────────────────────────────────────────┘ │
│  [+ Add Path]                                        │
│                                                      │
│  Context / Intent:                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ Focus on authentication flow, session          │ │
│  │ management, and security patterns. Track       │ │
│  │ test coverage and potential vulnerabilities.   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│              [Cancel]  [Create Dossier]              │
└─────────────────────────────────────────────────────┘
```

**Three inputs:**
1. **Name** — User-facing identifier
2. **Targets** — Multiple paths (folders and/or files)
3. **Context** — Free-form natural language describing focus

**No templates. No dropdowns.** Pure intent-driven creation.

### Dossier View

Widget-based layout rendered from layout descriptor JSON:

```
┌─────────────────────────────────────────────────────┐
│  Auth System Dossier                 [↻ Re-analyze] │
│  Last updated: 2 hours ago                           │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────────────────┐   │
│  │ Files   │ │   LOC   │ │  Test Coverage      │   │
│  │   12    │ │  3,421  │ │      78%            │   │
│  └─────────┘ └─────────┘ └─────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Dependency Graph                           │    │
│  │  [Interactive graph visualization]          │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Insights                                   │    │
│  │  • AuthContext uses deprecated token        │    │
│  │    storage pattern. Consider migrating to   │    │
│  │    secure cookie-based sessions.            │    │
│  │  • Test coverage for auth middleware        │    │
│  │    dropped from 85% to 78% over 3 days.     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Change Timeline                            │    │
│  │  [Timeline chart showing file changes]      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Data Model

### Dossier Schema

```typescript
import { z } from 'zod';

// Branded types
export type DossierId = string & { readonly __brand: 'DossierId' };
export type WidgetType = string & { readonly __brand: 'WidgetType' };

// Dossier state
export const DossierSchema = z.object({
  id: z.string().brand<'DossierId'>(),
  name: z.string(),
  targets: z.array(z.string()), // File paths
  context: z.string(), // Free-form user intent
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  analysisCount: z.number(),
  layoutDescriptor: z.object({
    layout: z.enum(['grid-2col', 'grid-3col', 'stack']),
    widgets: z.array(z.object({
      type: z.string().brand<'WidgetType'>(),
      span: z.number(),
      data: z.record(z.unknown()),
    })),
  }),
  history: z.array(z.object({
    timestamp: z.string().datetime(),
    layoutDescriptor: z.unknown(),
    changedFiles: z.array(z.string()),
  })),
});

export type Dossier = z.infer<typeof DossierSchema>;
```

### Layout Descriptor Schema

```typescript
export const LayoutDescriptorSchema = z.object({
  layout: z.enum(['grid-2col', 'grid-3col', 'stack']),
  widgets: z.array(z.object({
    type: z.string().brand<'WidgetType'>(), // 'StatCard', 'DependencyGraph', etc.
    span: z.number(), // Grid column span
    data: z.record(z.unknown()), // Widget-specific data
  })),
});

export type LayoutDescriptor = z.infer<typeof LayoutDescriptorSchema>;
```

### Storage Interface

```typescript
export interface DossierStorage {
  create(dossier: Omit<Dossier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dossier>;
  read(id: DossierId): Promise<Dossier | null>;
  list(): Promise<Dossier[]>;
  update(id: DossierId, updates: Partial<Dossier>): Promise<Dossier>;
  delete(id: DossierId): Promise<void>;
  appendHistory(id: DossierId, entry: { layoutDescriptor: LayoutDescriptor; changedFiles: string[] }): Promise<void>;
}
```

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/dossiers` | Create new dossier |
| GET | `/api/dossiers` | List all dossiers |
| GET | `/api/dossiers/:id` | Read dossier by ID |
| PUT | `/api/dossiers/:id` | Update dossier (name, targets, context) |
| DELETE | `/api/dossiers/:id` | Delete dossier |
| POST | `/api/dossiers/:id/analyze` | Trigger re-analysis |
| GET | `/api/dossiers/:id/history` | Get dossier history |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `dossier:created` | Server → Client | `{ dossierId, name }` |
| `dossier:updated` | Server → Client | `{ dossierId, layoutDescriptor }` |
| `dossier:deleted` | Server → Client | `{ dossierId }` |
| `dossier:analyzing` | Server → Client | `{ dossierId, status: 'analyzing' }` |
| `dossier:analyzed` | Server → Client | `{ dossierId, status: 'complete', layoutDescriptor }` |

---

## Widget System

### Widget Catalog

Initial catalog (10 widgets):

| Widget | Purpose | Data Schema |
|--------|---------|-------------|
| **StatCard** | Single metric | `{ label: string, value: number \| string, trend?: 'up' \| 'down' }` |
| **FileTree** | Interactive folder structure | `{ root: string, nodes: TreeNode[] }` |
| **DependencyGraph** | Package/import relationships | `{ nodes: Node[], edges: Edge[] }` |
| **ChangeTimeline** | Recent file changes over time | `{ events: { timestamp: string, file: string, type: string }[] }` |
| **CodeHealthMeter** | Quality score | `{ score: number, factors: { label: string, value: number }[] }` |
| **AlertPanel** | Issues, warnings, anomalies | `{ alerts: { severity: string, message: string }[] }` |
| **RelationshipMap** | How watched paths connect | `{ relationships: { from: string, to: string, type: string }[] }` |
| **TrendChart** | Metric changes over time | `{ metric: string, dataPoints: { timestamp: string, value: number }[] }` |
| **InsightCard** | Natural language observation | `{ text: string, confidence?: number }` |
| **SnippetPreview** | Key code excerpts | `{ file: string, lineStart: number, lineEnd: number, code: string, annotation: string }` |

### Widget Renderer Architecture

```typescript
// Frontend: packages/app/src/components/WidgetRenderer/

export function WidgetRenderer({ descriptor }: { descriptor: LayoutDescriptor }) {
  return (
    <div className={`layout-${descriptor.layout}`}>
      {descriptor.widgets.map((widget, idx) => {
        const Component = WIDGET_REGISTRY[widget.type];
        if (!Component) {
          return <UnknownWidget key={idx} widget={widget} />;
        }
        return <Component key={idx} data={widget.data} span={widget.span} />;
      })}
    </div>
  );
}

const WIDGET_REGISTRY: Record<WidgetType, React.ComponentType<any>> = {
  StatCard: StatCardWidget,
  FileTree: FileTreeWidget,
  DependencyGraph: DependencyGraphWidget,
  ChangeTimeline: ChangeTimelineWidget,
  CodeHealthMeter: CodeHealthMeterWidget,
  AlertPanel: AlertPanelWidget,
  RelationshipMap: RelationshipMapWidget,
  TrendChart: TrendChartWidget,
  InsightCard: InsightCardWidget,
  SnippetPreview: SnippetPreviewWidget,
};
```

### Agent Output Format

Agent outputs JSON layout descriptor:

```json
{
  "layout": "grid-2col",
  "widgets": [
    {
      "type": "StatCard",
      "span": 1,
      "data": {
        "label": "Files",
        "value": 12,
        "trend": "up"
      }
    },
    {
      "type": "StatCard",
      "span": 1,
      "data": {
        "label": "LOC",
        "value": 3421
      }
    },
    {
      "type": "DependencyGraph",
      "span": 2,
      "data": {
        "nodes": [
          { "id": "auth.ts", "label": "auth.ts", "type": "backend" },
          { "id": "AuthContext.tsx", "label": "AuthContext.tsx", "type": "frontend" }
        ],
        "edges": [
          { "from": "AuthContext.tsx", "to": "auth.ts", "type": "imports" }
        ]
      }
    },
    {
      "type": "InsightCard",
      "span": 2,
      "data": {
        "text": "Test coverage for auth middleware dropped from 85% to 78% over 3 days. Recent changes to token validation logic lack corresponding test updates.",
        "confidence": 0.9
      }
    }
  ]
}
```

Frontend renders this via `<WidgetRenderer>`.

---

## Suggestion Box

### Concept

When the agent needs a widget that doesn't exist:

1. **Build a minimum viable fallback** (basic rendering within design constraints)
2. **File a suggestion** for future widget promotion
3. **Continue execution** (graceful degradation)

### Suggestion Entry Schema

```typescript
export const SuggestionEntrySchema = z.object({
  id: z.string(),
  type: z.literal('widget_suggestion'),
  requestedBy: z.string(), // Dossier ID
  needed: z.string(), // Widget name (e.g., "ComparisonTable")
  reason: z.string(), // Why needed
  fallback: z.object({
    type: z.enum(['raw', 'markdown']),
    content: z.string(),
  }),
  frequency: z.number(), // Times requested (increments on duplicate)
  timestamp: z.string().datetime(),
});

export type SuggestionEntry = z.infer<typeof SuggestionEntrySchema>;
```

### Example Suggestion

```json
{
  "id": "sugg_001",
  "type": "widget_suggestion",
  "requestedBy": "dossier:backend-services",
  "needed": "ComparisonTable",
  "reason": "Needed to compare test coverage across 3 packages side-by-side. Current widgets can only show single package metrics.",
  "fallback": {
    "type": "markdown",
    "content": "| Package | Coverage |\n|---------|----------|\n| backend | 78% |\n| app | 65% |\n| shared | 92% |"
  },
  "frequency": 1,
  "timestamp": "2026-02-09T22:15:00Z"
}
```

### Evolution Cycle

```
Agent needs widget → Not in catalog → Builds MVP fallback → Files suggestion
     ↓
Suggestion box accumulates entries → Frequency tracking → High-value detection
     ↓
Human reviews suggestion box → Approves widget → Proper widget gets built
     ↓
Widget added to catalog → Next time agent needs it → Uses polished version
```

### Connection to Self-Evolving UI

Suggestion box entries feed **Self-Evolving UI Phase 2 (Pattern Detection)** system:

- Track widget request frequency
- Identify recurring patterns
- Surface high-value widget candidates for promotion
- Enable framework to evolve its own capabilities

### Suggestion Box API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/suggestions` | List all suggestions |
| GET | `/api/suggestions/:id` | Read suggestion by ID |
| POST | `/api/suggestions/:id/promote` | Promote suggestion to widget |
| DELETE | `/api/suggestions/:id` | Dismiss suggestion |

---

## Implementation Plan

### Phase 1: Data Model & Backend Foundation

**Tasks:**
- Define dossier schema (TypeScript + Zod)
- Implement dossier storage (MemoryStorage + Redis)
- Create dossier CRUD API endpoints
- Set up file watcher service (chokidar integration)
- Implement suggestion box storage

**Outputs:**
- `packages/shared/src/types/dossier.ts`
- `packages/backend/src/routes/dossiers.ts`
- `packages/backend/src/storage/DossierStorage.ts`
- `packages/backend/src/services/FileWatcherService.ts`
- `packages/backend/src/storage/SuggestionStorage.ts`

**Verification:**
- `pnpm type-check` passes
- Dossier CRUD endpoints tested via curl/Postman
- File watcher triggers on path changes

### Phase 2: Frontend Shell & Widget Renderer

**Tasks:**
- Create Intel workbench UI shell
- Implement widget renderer system
- Add Intel context to TopBar navigation
- Build dossier list view
- Build dossier creation flow UI

**Outputs:**
- `packages/app/src/components/IntelWorkbench/`
- `packages/app/src/components/WidgetRenderer/`
- `packages/app/src/components/DossierCreationDialog/`
- `packages/app/src/components/DossierList/`
- Updated `packages/app/src/components/TopBar/TopBar.tsx`

**Verification:**
- Intel workbench renders in dashboard
- Dossier creation flow captures name, targets, context
- Widget renderer handles unknown widgets gracefully

### Phase 3: Initial Widget Catalog

**Tasks:**
- Implement 10 initial widgets:
  - StatCard
  - FileTree
  - DependencyGraph
  - ChangeTimeline
  - CodeHealthMeter
  - AlertPanel
  - RelationshipMap
  - TrendChart
  - InsightCard
  - SnippetPreview

**Outputs:**
- `packages/app/src/components/widgets/StatCardWidget.tsx`
- `packages/app/src/components/widgets/FileTreeWidget.tsx`
- (... and 8 more widget components)

**Verification:**
- All widgets render with sample data
- Widgets respect `span` prop for grid layout
- Widget data schemas documented

### Phase 4: Agent Integration

**Tasks:**
- Create Intel action agent
- Implement layout descriptor generation logic
- Implement suggestion filing logic
- Design incremental analysis prompt (with prior state)
- Add Intel context to CONTEXTS.md
- Create Intel flow in FLOWS.md

**Outputs:**
- `.claude/actionflows/actions/intel/agent.md`
- `.claude/actionflows/actions/intel/instructions.md`
- Updated `.claude/actionflows/CONTEXTS.md`
- Updated `.claude/actionflows/FLOWS.md`

**Verification:**
- Agent outputs valid layout descriptor JSON
- Agent files suggestions when widget missing
- Agent builds on prior dossier state in re-analysis

### Phase 5: File Watching & Re-Analysis

**Tasks:**
- Wire file watcher to re-analysis trigger
- Implement debouncing strategy
- Implement dossier history storage
- Add WebSocket events for dossier updates
- Create re-analysis API endpoint

**Outputs:**
- Updated `packages/backend/src/services/FileWatcherService.ts`
- Updated `packages/backend/src/ws/broadcastEvent.ts`
- `packages/backend/src/routes/dossiers.ts` (analyze endpoint)

**Verification:**
- File change triggers re-analysis
- Dossier history accumulates over time
- WebSocket events broadcast to frontend
- Frontend updates dossier view on event

### Phase 6: Testing & Iteration

**Tasks:**
- E2E flow testing (create → watch → re-analyze → render)
- Widget catalog expansion based on usage
- Performance testing (file watcher load)
- Suggestion box workflow validation
- Documentation updates

**Outputs:**
- `test/e2e/intel-dossier.spec.ts`
- Updated `docs/design/INTEL_DOSSIER.md`
- Updated `README.md`

**Verification:**
- Full E2E flow passes
- Performance budget met (N concurrent watchers)
- Suggestion box accumulates and promotes widgets
- Documentation complete

---

## Open Topics

These are flagged for future phases. Not blocking initial implementation.

### 1. Re-Analysis Triggers

**Question:** When does a dossier re-analyze?

**Options:**
- On file change (automatic)?
- Scheduled intervals (e.g., daily)?
- Manual only (user-triggered)?
- Hybrid (automatic + manual override)?

**Impact:** Performance budget, freshness guarantees, user control.

**Recommendation:** Start with manual-only. Add automatic triggers in Phase 2 after performance testing.

---

### 2. Dossier Versioning / History

**Question:** Can you "rewind" a dossier to see what it looked like last week?

**Options:**
- Full state snapshots at intervals?
- Diff-based history (like git)?
- Append-only log with temporal queries?

**Impact:** Storage requirements, UI complexity, debugging capabilities.

**Recommendation:** Start with append-only history (last 10 analyses). Add temporal queries later if needed.

---

### 3. Insight Accumulation Strategy

**Question:** How do new insights relate to old ones?

**Options:**
- Append new insights to existing list?
- Replace stale insights with fresh ones?
- Score decay for aging insights?
- Tag insights with confidence/recency?

**Impact:** Dossier page length, relevance over time, signal-to-noise ratio.

**Recommendation:** Start with append-only (agent decides what to keep). Add pruning logic if pages become too long.

---

### 4. Cross-Dossier Intelligence

**Question:** Can one dossier reference another's findings?

**Options:**
- Shared knowledge graph across dossiers?
- Explicit cross-references in layout descriptor?
- Auto-detect related dossiers?

**Impact:** System-wide intelligence, complexity, potential for circular references.

**Recommendation:** Defer to Phase 2. Start with isolated dossiers. Add cross-references once patterns emerge.

---

### 5. Suggestion Box → Pattern Detection Pipeline

**Question:** How does the suggestion box feed into the Self-Evolving UI system?

**Options:**
- Automatic promotion after N requests?
- Human review gate?
- ML-based pattern clustering?

**Impact:** Widget catalog evolution speed, quality control, automation level.

**Recommendation:** Start with human review gate. Add auto-promotion (after threshold) in Phase 2.

---

### 6. Widget Catalog Governance

**Question:** Who approves promoted widgets?

**Options:**
- Human review required?
- Auto-promote after threshold?
- Community voting (multi-user)?

**Impact:** Quality control, evolution speed, trust in auto-generated widgets.

**Recommendation:** Start with human review. Add threshold-based auto-promotion for trusted patterns.

---

### 7. External Folder Support

**Question:** Can dossiers watch repos outside the project?

**Use Cases:**
- Competitor analysis
- Cloned repos for comparison
- External dependencies

**Concerns:**
- Security/sandboxing
- File watcher scope
- Agent context limits

**Impact:** Use case expansion, security model, performance.

**Recommendation:** Defer to Phase 2. Start with project-local paths only.

---

### 8. Dossier Sharing

**Question:** In multi-user deployments, can dossiers be shared between team members?

**Options:**
- Per-user dossiers only?
- Team-wide shared dossiers?
- Read-only vs. edit permissions?

**Impact:** Collaboration features, storage model, access control.

**Recommendation:** Start with per-user dossiers. Add team sharing in multi-user version.

---

### 9. Agent Prompt Engineering

**Question:** How much prior context to feed on re-analysis?

**Options:**
- Full prior state (token-heavy)?
- Summarized prior state?
- Only changed sections?
- Sliding window (last N analyses)?

**Impact:** Token budget, analysis quality, cost optimization.

**Recommendation:** Start with full prior state (single prior analysis). Add summarization if token limits hit.

---

### 10. Performance Budget

**Question:** How many concurrent file watchers can the system support?

**Considerations:**
- Limit per user?
- Debouncing strategy?
- Priority system for active dossiers?

**Impact:** System performance, scalability, user experience.

**Recommendation:** Start with 10 watchers per user. Add priority system if performance degrades.

---

### 11. Dossier Templates (Despite Free-Form Design)

**Question:** Should common patterns be offered as starting points?

**Options:**
- "API Service" template (common paths pre-filled)
- "Frontend App" template
- "Library" template
- Still allow full customization

**Impact:** Onboarding friction, standardization vs. flexibility.

**Recommendation:** Defer to Phase 2. Start with free-form only. Add templates if users request them.

---

### 12. Offline Dossiers

**Question:** What happens when watched folders go offline or get deleted?

**Options:**
- Mark as "offline" but preserve history?
- Auto-archive?
- Notify user for manual intervention?

**Impact:** Error handling, user experience, data retention policy.

**Recommendation:** Start with "offline" status + notification. Let user decide (archive or delete).

---

## Design Principles

### 1. Living Over Static
Dossiers evolve over time, not snapshots.

### 2. Intent Over Template
Free-form context, not dropdowns.

### 3. Domain Over Path
Multi-path dossiers for cross-cutting concerns.

### 4. Build Over Block
Missing widget? Build MVP, file suggestion, continue.

### 5. Memory Over Amnesia
Re-analysis builds on prior knowledge.

---

## Success Metrics

How do we know Intel is working?

1. **Dossiers created** — Users find it valuable enough to set up
2. **Re-analysis frequency** — Dossiers stay fresh (not stale)
3. **Widget reuse** — High overlap between dossier layouts (catalog is useful)
4. **Suggestion box activity** — Framework identifies gaps and proposes widgets
5. **Cross-package insights** — Dossiers span boundaries (multi-path usage)
6. **Temporal insights** — "Changed since..." observations appear in dossiers

---

## Risks & Mitigations

### Risk 1: Performance Degradation
**Problem:** Too many file watchers slow down the system.
**Mitigation:** Performance budget per user (10 watchers max), debouncing, priority system for active dossiers.

### Risk 2: Stale Dossiers
**Problem:** Dossiers created but never updated (one-time use).
**Mitigation:** Auto-archive inactive dossiers (no updates in 30 days), notification when changes detected.

### Risk 3: Widget Catalog Sprawl
**Problem:** Suggestion box fills with one-off widget requests.
**Mitigation:** Frequency threshold for promotion (3+ requests), human review gate, pattern clustering.

### Risk 4: Prompt Context Explosion
**Problem:** Full prior state in re-analysis prompt exceeds token budget.
**Mitigation:** Summarization (compress prior state), sliding window (last N analyses), only feed changed sections.

### Risk 5: User Confusion (What Is This?)
**Problem:** Intel workbench purpose unclear to new users.
**Mitigation:** Onboarding flow, example dossiers (templates), clear UI messaging, help tooltip.

---

## Related Features

- **Self-Evolving UI** — Widget catalog lives in registry
- **Context Routing** — Intel context added to CONTEXTS.md
- **Session Management** — Re-analysis runs as Claude CLI session
- **File Watching** — chokidar already integrated per session
- **Storage System** — MemoryStorage/Redis already persist state

---

## References

- Brainstorm session summary: `.claude/actionflows/logs/ideation/intel-dossier_{datetime}/summary.md`
- Self-Evolving UI design: `docs/design/SELF_EVOLVING_UI.md` (if exists)
- Contract evolution guide: `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
- Context routing spec: `.claude/actionflows/CONTEXTS.md`

---

**End of Design Specification**
