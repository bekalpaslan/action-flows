# Implementation Plan: Intel Dossier Phase 1 MVP

## Overview

Intel Dossier Phase 1 adds a new "Intel" workbench to the ActionFlows Dashboard, providing persistent, evolving intelligence pages (dossiers) about code domains. The implementation follows the established monorepo pattern: shared types first, then backend CRUD + storage, then frontend workbench + widgets. Phase 1 is **manual-trigger only** (no file watchers), uses MemoryStorage, and ships 6 core widgets with a basic suggestion box.

---

## Steps

### Step 1: Shared Types — Dossier Domain Types

- **Package:** `packages/shared`
- **Files to CREATE:**
  - `packages/shared/src/dossierTypes.ts` — All dossier domain types
- **Files to MODIFY:**
  - `packages/shared/src/index.ts` — Add dossier type exports
  - `packages/shared/src/workbenchTypes.ts` — Add `'intel'` to WorkbenchId union, WORKBENCH_IDS array, DEFAULT_WORKBENCH_CONFIGS, and ROUTABLE_WORKBENCHES
- **Changes:**
  1. Create `dossierTypes.ts` with:
     - `DossierId` branded string type (pattern: `dossier-{timestamp}-{random}`)
     - `SuggestionId` branded string type
     - `WidgetType` string literal union: `'StatCard' | 'FileTree' | 'InsightCard' | 'AlertPanel' | 'CodeHealthMeter' | 'SnippetPreview'`
     - `LayoutType` union: `'grid-2col' | 'grid-3col' | 'stack'`
     - `WidgetDescriptor` interface: `{ type: WidgetType; span: number; data: Record<string, unknown> }`
     - `LayoutDescriptor` interface: `{ layout: LayoutType; widgets: WidgetDescriptor[] }`
     - `DossierStatus` enum: `'idle' | 'analyzing' | 'error'`
     - `IntelDossier` interface with: id, name, targets, context, createdAt, updatedAt, analysisCount, status, layoutDescriptor (nullable), history array, error string (nullable)
     - `DossierHistoryEntry` interface: `{ timestamp, layoutDescriptor, changedFiles }`
     - `SuggestionEntry` interface: id, type, requestedBy (DossierId), needed (string), reason, fallback ({ type, content }), frequency, timestamp
     - Factory functions in `brandedDossierTypes` object: `dossierId()`, `suggestionId()`
  2. Add `'intel'` to WorkbenchId type union in `workbenchTypes.ts`
  3. Add `'intel'` entry to WORKBENCH_IDS array
  4. Add DEFAULT_WORKBENCH_CONFIGS entry for `intel`: icon `'🕵️'`, label `'Intel'`, routable: true, triggers: `['dossier', 'intel', 'intelligence', 'monitor', 'watch', 'track', 'insight']`, flows: `['intel-analysis/']`
  5. Add `'intel'` to ROUTABLE_WORKBENCHES
  6. Export all new types from `index.ts`
- **Depends on:** Nothing
- **Estimated files:** 3

---

### Step 2: Backend — Dossier Zod Schemas

- **Package:** `packages/backend`
- **Files to MODIFY:**
  - `packages/backend/src/schemas/api.ts` — Add dossier validation schemas
- **Changes:**
  1. Add `createDossierSchema`: name (string, 1-200), targets (array of strings, 1-50 items, each 1-500 chars), context (string, 1-5000)
  2. Add `updateDossierSchema`: name (optional), targets (optional), context (optional)
  3. Add `triggerAnalysisSchema`: force (boolean, optional, default false)
  4. Add `createSuggestionSchema`: dossierId (string), needed (string), reason (string), fallback ({ type: 'raw' | 'markdown', content: string })
  5. Export all schema types
- **Depends on:** Step 1 (needs shared types for reference, but schemas are Zod-only)
- **Estimated files:** 1

---

### Step 3: Backend — Dossier Storage Layer

- **Package:** `packages/backend`
- **Files to MODIFY:**
  - `packages/backend/src/storage/memory.ts` — Add dossier and suggestion Maps + methods
  - `packages/backend/src/storage/index.ts` — Add dossier and suggestion methods to Storage interface
- **Changes:**
  1. Add to `Storage` interface:
     - `dossiers?: Map<string, IntelDossier>` (memory only)
     - `suggestions?: Map<string, SuggestionEntry>` (memory only)
     - `getDossier(id: DossierId): IntelDossier | undefined | Promise<...>`
     - `setDossier(dossier: IntelDossier): void | Promise<void>`
     - `listDossiers(): IntelDossier[] | Promise<IntelDossier[]>`
     - `deleteDossier(id: DossierId): void | Promise<void>`
     - `appendDossierHistory(id: DossierId, entry: DossierHistoryEntry): void | Promise<void>`
     - `getSuggestion(id: SuggestionId): SuggestionEntry | undefined | Promise<...>`
     - `listSuggestions(): SuggestionEntry[] | Promise<SuggestionEntry[]>`
     - `addSuggestion(suggestion: SuggestionEntry): void | Promise<void>`
     - `deleteSuggestion(id: SuggestionId): void | Promise<void>`
     - `incrementSuggestionFrequency(id: SuggestionId): void | Promise<void>`
  2. Implement all methods in `memory.ts` using `Map<string, IntelDossier>` and `Map<string, SuggestionEntry>`
  3. Add max bounds: MAX_DOSSIERS = 100, MAX_DOSSIER_HISTORY = 50, MAX_SUGGESTIONS = 500
- **Depends on:** Step 1
- **Estimated files:** 2

---

### Step 4: Backend — Dossier CRUD Routes

- **Package:** `packages/backend`
- **Files to CREATE:**
  - `packages/backend/src/routes/dossiers.ts` — Express router for dossier endpoints
- **Files to MODIFY:**
  - `packages/backend/src/index.ts` — Mount dossier router at `/api/dossiers`
- **Changes:**
  1. Create `dossiers.ts` router following `sessions.ts` pattern:
     - `POST /` — Create dossier (validate body with createDossierSchema, generate DossierId, set createdAt/updatedAt, analysisCount=0, status='idle', layoutDescriptor=null, history=[])
     - `GET /` — List all dossiers (return array with count)
     - `GET /:id` — Get dossier by ID (404 if not found)
     - `PUT /:id` — Update dossier metadata (name, targets, context)
     - `DELETE /:id` — Delete dossier
     - `GET /:id/history` — Get dossier history entries
     - `POST /:id/analyze` — Trigger analysis (set status to 'analyzing', broadcast `dossier:analyzing` WS event). Phase 1: just marks status, returns 202 Accepted. Actual agent integration is Phase 2+.
  2. Add WebSocket event broadcasts for create/update/delete/analyze status changes
  3. Mount router: `app.use('/api/dossiers', dossiersRouter)` in index.ts
  4. Add import for dossiers router in index.ts
- **Depends on:** Steps 1, 2, 3
- **Estimated files:** 2

---

### Step 5: Backend — Suggestion Box Routes

- **Package:** `packages/backend`
- **Files to CREATE:**
  - `packages/backend/src/routes/suggestions.ts` — Express router for suggestion endpoints
- **Files to MODIFY:**
  - `packages/backend/src/index.ts` — Mount suggestion router at `/api/suggestions`
- **Changes:**
  1. Create `suggestions.ts` router:
     - `GET /` — List all suggestions (sorted by frequency desc)
     - `GET /:id` — Get suggestion by ID
     - `POST /` — Create or increment suggestion (if matching `needed` string exists, increment frequency instead of creating new)
     - `DELETE /:id` — Dismiss/delete suggestion
     - `POST /:id/promote` — Promote suggestion (Phase 1: just marks it promoted, returns info. Actual widget creation is manual)
  2. Mount router in index.ts
- **Depends on:** Steps 1, 2, 3
- **Can parallel with:** Step 4

---

### Step 6: Frontend — Intel Workbench Shell

- **Package:** `packages/app`
- **Files to CREATE:**
  - `packages/app/src/components/Workbench/IntelWorkbench.tsx` — Main Intel workbench component
  - `packages/app/src/components/Workbench/IntelWorkbench.css` — Styles
- **Files to MODIFY:**
  - `packages/app/src/components/Workbench/WorkbenchLayout.tsx` — Add `case 'intel':` to renderWorkbenchContent switch
  - `packages/app/src/components/Workbench/index.ts` — Export IntelWorkbench
- **Changes:**
  1. Create `IntelWorkbench.tsx` with:
     - Header with title "Intel" and "+ New Dossier" button
     - Left panel: Dossier list (fetched from API)
     - Right panel: Selected dossier view OR empty state
     - Uses `useState` for selectedDossierId, dossiers list
     - Fetches dossiers from `GET /api/dossiers` on mount
     - CSS follows existing workbench patterns (BEM naming: `intel-workbench__*`)
  2. Add `case 'intel':` in WorkbenchLayout.tsx switch statement
  3. Export from barrel file
- **Depends on:** Step 1 (needs WorkbenchId with 'intel')
- **Estimated files:** 4

---

### Step 7: Frontend — Dossier List Component

- **Package:** `packages/app`
- **Files to CREATE:**
  - `packages/app/src/components/IntelDossier/DossierList.tsx` — List of dossier cards
  - `packages/app/src/components/IntelDossier/DossierList.css` — Styles
  - `packages/app/src/components/IntelDossier/DossierCard.tsx` — Single dossier card (name, target count, last updated, status indicator)
- **Changes:**
  1. `DossierList` receives dossiers array, selected ID, onSelect callback
  2. `DossierCard` shows: name, target path count, last updated relative time, status dot (idle=green, analyzing=yellow, error=red)
  3. Empty state when no dossiers: "No dossiers yet. Create one to get started."
  4. Selected state: highlighted border/background
- **Depends on:** Step 1
- **Can parallel with:** Steps 4, 5

---

### Step 8: Frontend — Dossier Creation Dialog

- **Package:** `packages/app`
- **Files to CREATE:**
  - `packages/app/src/components/IntelDossier/DossierCreationDialog.tsx` — Creation modal/dialog
  - `packages/app/src/components/IntelDossier/DossierCreationDialog.css` — Styles
- **Changes:**
  1. Modal with three inputs matching design spec:
     - **Name** — text input, required
     - **Targets** — multi-input (list of path strings, + Add Path button, X to remove)
     - **Context** — textarea for free-form natural language
  2. Cancel/Create buttons
  3. Validation: name required, at least one target, context optional but encouraged
  4. On create: POST to `/api/dossiers`, close dialog, refresh list, select new dossier
  5. Loading state while creating
- **Depends on:** Step 4 (needs API endpoint)
- **Can parallel with:** Step 7

---

### Step 9: Frontend — Widget Components (6 core widgets)

- **Package:** `packages/app`
- **Files to CREATE:**
  - `packages/app/src/components/IntelDossier/widgets/StatCardWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/InsightCardWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/AlertPanelWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/CodeHealthMeterWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/FileTreeWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/SnippetPreviewWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/UnknownWidget.tsx`
  - `packages/app/src/components/IntelDossier/widgets/widgets.css` — Shared widget styles
  - `packages/app/src/components/IntelDossier/widgets/index.ts` — Barrel + WIDGET_REGISTRY map
- **Changes:**
  1. **StatCardWidget** — Shows label, value, optional trend arrow (up/down). Small card. Props: `{ label: string, value: string | number, trend?: 'up' | 'down' }`
  2. **InsightCardWidget** — Natural language text block with optional confidence indicator. Props: `{ text: string, confidence?: number }`
  3. **AlertPanelWidget** — List of alerts with severity icons (info/warn/error). Props: `{ alerts: { severity: string, message: string }[] }`
  4. **CodeHealthMeterWidget** — Score display (0-100) with radial or bar visualization + factor breakdown. Props: `{ score: number, factors: { label: string, value: number }[] }`
  5. **FileTreeWidget** — Simple nested list of files. Props: `{ root: string, nodes: { name: string, type: 'file' | 'directory', children?: ... }[] }`
  6. **SnippetPreviewWidget** — Code excerpt with file name, line numbers, annotation. Props: `{ file: string, lineStart: number, lineEnd: number, code: string, annotation: string }`
  7. **UnknownWidget** — Fallback for unrecognized widget types. Shows type name and raw data JSON.
  8. **WIDGET_REGISTRY** in `index.ts`: `Record<string, React.ComponentType<{ data: Record<string, unknown>; span: number }>>` mapping type strings to components
- **Depends on:** Step 1 (WidgetType)
- **Can parallel with:** Steps 6, 7, 8

---

### Step 10: Frontend — WidgetRenderer + DossierView

- **Package:** `packages/app`
- **Files to CREATE:**
  - `packages/app/src/components/IntelDossier/WidgetRenderer.tsx` — Layout engine that maps LayoutDescriptor to widget components
  - `packages/app/src/components/IntelDossier/WidgetRenderer.css` — Grid layout styles
  - `packages/app/src/components/IntelDossier/DossierView.tsx` — Full dossier view (header + WidgetRenderer + suggestion panel)
  - `packages/app/src/components/IntelDossier/DossierView.css` — Styles
  - `packages/app/src/components/IntelDossier/index.ts` — Barrel export
- **Changes:**
  1. **WidgetRenderer** takes `LayoutDescriptor`, renders CSS Grid with layout class:
     - `grid-2col`: 2-column grid
     - `grid-3col`: 3-column grid
     - `stack`: single column
     - Each widget gets `grid-column: span {widget.span}`
     - Looks up component from WIDGET_REGISTRY, falls back to UnknownWidget
  2. **DossierView** shows:
     - Header: dossier name, last updated, status indicator
     - Re-analyze button (calls `POST /api/dossiers/:id/analyze`)
     - Targets list (collapsible)
     - Context display (collapsible)
     - WidgetRenderer with current layoutDescriptor
     - Empty state if no layout yet: "This dossier hasn't been analyzed yet. Click Re-analyze to start."
  3. Barrel exports all public components
- **Depends on:** Steps 9 (widgets), 4 (API)
- **Estimated files:** 5

---

### Step 11: Frontend — useDossiers Hook

- **Package:** `packages/app`
- **Files to CREATE:**
  - `packages/app/src/hooks/useDossiers.ts` — Data fetching hook for dossier CRUD
- **Changes:**
  1. Hook provides:
     - `dossiers: IntelDossier[]` — Current list
     - `loading: boolean`
     - `error: Error | null`
     - `refresh(): void` — Refetch list
     - `createDossier(name, targets, context): Promise<IntelDossier>`
     - `updateDossier(id, updates): Promise<IntelDossier>`
     - `deleteDossier(id): Promise<void>`
     - `triggerAnalysis(id): Promise<void>`
  2. Uses `fetch()` against `/api/dossiers` endpoints
  3. Listens for WebSocket dossier events (`dossier:created`, `dossier:updated`, `dossier:deleted`, `dossier:analyzed`) via useWebSocketContext to auto-refresh
  4. Pattern follows `useAllSessions.ts` / `useProjects.ts`
- **Depends on:** Steps 4 (API), 1 (types)
- **Can parallel with:** Steps 9, 10

---

### Step 12: Frontend — Wire IntelWorkbench Together

- **Package:** `packages/app`
- **Files to MODIFY:**
  - `packages/app/src/components/Workbench/IntelWorkbench.tsx` — Wire hook + components
- **Changes:**
  1. Use `useDossiers()` hook for data
  2. Wire DossierList in left panel with selection state
  3. Wire DossierView in right panel for selected dossier
  4. Wire DossierCreationDialog behind "+ New Dossier" button
  5. Handle delete (confirm dialog)
  6. Handle re-analysis trigger
  7. Show loading/error states
- **Depends on:** Steps 6, 7, 8, 9, 10, 11

---

### Step 13: Backend — WebSocket Events for Dossiers

- **Package:** `packages/backend`
- **Files to MODIFY:**
  - `packages/backend/src/index.ts` — Add dossier broadcast function
  - `packages/backend/src/routes/dossiers.ts` — Call broadcast on CRUD operations
- **Files to MODIFY (optional):**
  - `packages/backend/src/schemas/ws.ts` — Add dossier event types if WS schema validation exists
- **Changes:**
  1. Add `broadcastDossierEvent()` function in index.ts (broadcasts to all clients, not session-specific)
  2. Import and call from dossier routes on: create, update, delete, analyze-start, analyze-complete
  3. Event payloads match design spec:
     - `dossier:created` — `{ dossierId, name }`
     - `dossier:updated` — `{ dossierId, layoutDescriptor }`
     - `dossier:deleted` — `{ dossierId }`
     - `dossier:analyzing` — `{ dossierId, status: 'analyzing' }`
     - `dossier:analyzed` — `{ dossierId, status: 'complete', layoutDescriptor }`
- **Depends on:** Step 4
- **Can parallel with:** Steps 9, 10, 11

---

### Step 14: Context Routing — Add Intel Context

- **Package:** ActionFlows framework
- **Files to MODIFY:**
  - `.claude/actionflows/CONTEXTS.md` — Add `intel` context entry
- **Changes:**
  1. Add `intel` to Routable Contexts section:
     - **Purpose:** Code intelligence, dossier management, domain monitoring
     - **Icon:** spy emoji
     - **Triggers:** dossier, intel, intelligence, monitor, watch, track, insight, analyze domain, code health
     - **Flows:** intel-analysis/
     - **Examples:** "create an intel dossier for the auth system", "analyze the backend services", "track changes to the API routes"
  2. Add to Routing Guide table:
     - "create dossier" / "track domain X" -> intel -> intel-analysis/
  3. Add to Context-to-Flow Directory Mapping table
- **Depends on:** Nothing
- **Can parallel with:** Any step

---

## Dependency Graph

```
Step 1 (shared types) ──┬──> Step 2 (schemas) ────────────────┐
                        ├──> Step 3 (storage) ─────────────────┤
                        ├──> Step 6 (workbench shell) ─────────┤
                        ├──> Step 7 (dossier list) ────────────┤
                        ├──> Step 9 (widgets) ─────────────────┤
                        └──> Step 14 (context routing)         │
                                                               │
                        Steps 2+3 ──> Step 4 (CRUD routes) ───┤
                        Steps 2+3 ──> Step 5 (suggestion API)  │
                                                               │
                        Step 4 ──> Step 8 (creation dialog)    │
                        Step 4 ──> Step 11 (useDossiers hook)  │
                        Step 4 ──> Step 13 (WS events)         │
                                                               │
                        Step 9 ──> Step 10 (WidgetRenderer)    │
                                                               │
                        Steps 6+7+8+9+10+11 ──> Step 12 (wire together)
```

### Parallelization Opportunities

| Parallel Group | Steps | Description |
|---------------|-------|-------------|
| **Group A** | 1, 14 | Shared types + context routing (independent) |
| **Group B** | 2, 3, 6, 7, 9 | After Step 1: schemas, storage, shell, list, widgets (all independent) |
| **Group C** | 4, 5 | After Steps 2+3: CRUD routes + suggestion routes (independent) |
| **Group D** | 8, 11, 13 | After Step 4: creation dialog, hook, WS events (independent) |
| **Group E** | 10 | After Step 9: WidgetRenderer (needs widgets) |
| **Group F** | 12 | After all above: final wiring |

### Recommended Execution Chain

```
Chain Step 1: code/frontend  — Step 1 (shared types + workbench ID)
Chain Step 2: code/backend   — Steps 2+3 (schemas + storage) [parallel]
Chain Step 3: code/backend   — Steps 4+5 (CRUD + suggestion routes) [parallel]
Chain Step 4: code/frontend  — Steps 6+7 (workbench shell + dossier list) [parallel]
Chain Step 5: code/frontend  — Steps 8+9 (creation dialog + 6 widgets) [parallel]
Chain Step 6: code/frontend  — Steps 10+11 (WidgetRenderer + useDossiers hook) [parallel]
Chain Step 7: code/backend   — Step 13 (WebSocket events)
Chain Step 8: code/frontend  — Step 12 (wire everything together)
Chain Step 9: code/framework — Step 14 (CONTEXTS.md update)
Chain Step 10: review/       — Full review of all changes
```

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| WorkbenchId union change breaks existing code | High — every switch on WorkbenchId needs new case | Grep for all switch/if statements on WorkbenchId before merge. Add `case 'intel':` everywhere. TypeScript will catch missing cases if switches are exhaustive. |
| WORKBENCH_IDS array order affects TopBar tab order | Medium — Intel tab placement matters for UX | Insert `'intel'` after `'review'` in array to keep it grouped with analysis-related workbenches. |
| Storage interface change requires Redis implementation | Low (Phase 1) — using MemoryStorage only | Add optional methods with `?` on Storage interface. Redis implementation deferred. |
| Widget data schemas loosely typed (`Record<string, unknown>`) | Medium — runtime errors if agent outputs bad data | Each widget component validates its own props internally. UnknownWidget fallback catches unrecognized types. |
| Large number of new files (20+) | Medium — merge conflicts, review burden | Group into logical PRs if needed. Parallel code agents minimize wall-clock time. |
| LayoutDescriptor is null before first analysis | Low — UI shows empty state | DossierView handles null layoutDescriptor with "Not yet analyzed" message + prominent analyze button. |
| WebSocket event naming collision | Low — all prefixed with `dossier:` | Use `dossier:` namespace consistently. Check existing event types for conflicts. |

---

## Verification

- [ ] `pnpm type-check` passes across all packages (especially after WorkbenchId change)
- [ ] `pnpm build` succeeds for shared, backend, and app packages
- [ ] Backend starts without errors (`pnpm dev:backend`)
- [ ] Frontend starts without errors (`pnpm dev:app`)
- [ ] Intel tab appears in TopBar and navigates to Intel workbench
- [ ] Dossier CRUD works via curl: create, list, get, update, delete
- [ ] Dossier creation dialog captures name, targets, context
- [ ] WidgetRenderer renders sample layout descriptor with all 6 widget types
- [ ] UnknownWidget renders for unrecognized widget type strings
- [ ] Suggestion CRUD works via curl: create, list, frequency increment, delete
- [ ] WebSocket events broadcast on dossier CRUD operations
- [ ] useDossiers hook auto-refreshes on WebSocket events
- [ ] CONTEXTS.md has intel entry with correct triggers and examples
- [ ] Existing tests still pass (`pnpm test`)

---

## File Inventory Summary

### New Files (22)

| # | File Path | Package | Step |
|---|-----------|---------|------|
| 1 | `packages/shared/src/dossierTypes.ts` | shared | 1 |
| 2 | `packages/backend/src/routes/dossiers.ts` | backend | 4 |
| 3 | `packages/backend/src/routes/suggestions.ts` | backend | 5 |
| 4 | `packages/app/src/components/Workbench/IntelWorkbench.tsx` | app | 6 |
| 5 | `packages/app/src/components/Workbench/IntelWorkbench.css` | app | 6 |
| 6 | `packages/app/src/components/IntelDossier/DossierList.tsx` | app | 7 |
| 7 | `packages/app/src/components/IntelDossier/DossierList.css` | app | 7 |
| 8 | `packages/app/src/components/IntelDossier/DossierCard.tsx` | app | 7 |
| 9 | `packages/app/src/components/IntelDossier/DossierCreationDialog.tsx` | app | 8 |
| 10 | `packages/app/src/components/IntelDossier/DossierCreationDialog.css` | app | 8 |
| 11 | `packages/app/src/components/IntelDossier/widgets/StatCardWidget.tsx` | app | 9 |
| 12 | `packages/app/src/components/IntelDossier/widgets/InsightCardWidget.tsx` | app | 9 |
| 13 | `packages/app/src/components/IntelDossier/widgets/AlertPanelWidget.tsx` | app | 9 |
| 14 | `packages/app/src/components/IntelDossier/widgets/CodeHealthMeterWidget.tsx` | app | 9 |
| 15 | `packages/app/src/components/IntelDossier/widgets/FileTreeWidget.tsx` | app | 9 |
| 16 | `packages/app/src/components/IntelDossier/widgets/SnippetPreviewWidget.tsx` | app | 9 |
| 17 | `packages/app/src/components/IntelDossier/widgets/UnknownWidget.tsx` | app | 9 |
| 18 | `packages/app/src/components/IntelDossier/widgets/widgets.css` | app | 9 |
| 19 | `packages/app/src/components/IntelDossier/widgets/index.ts` | app | 9 |
| 20 | `packages/app/src/components/IntelDossier/WidgetRenderer.tsx` | app | 10 |
| 21 | `packages/app/src/components/IntelDossier/WidgetRenderer.css` | app | 10 |
| 22 | `packages/app/src/components/IntelDossier/DossierView.tsx` | app | 10 |
| 23 | `packages/app/src/components/IntelDossier/DossierView.css` | app | 10 |
| 24 | `packages/app/src/components/IntelDossier/index.ts` | app | 10 |
| 25 | `packages/app/src/hooks/useDossiers.ts` | app | 11 |

### Modified Files (9)

| # | File Path | Package | Step |
|---|-----------|---------|------|
| 1 | `packages/shared/src/index.ts` | shared | 1 |
| 2 | `packages/shared/src/workbenchTypes.ts` | shared | 1 |
| 3 | `packages/backend/src/schemas/api.ts` | backend | 2 |
| 4 | `packages/backend/src/storage/memory.ts` | backend | 3 |
| 5 | `packages/backend/src/storage/index.ts` | backend | 3 |
| 6 | `packages/backend/src/index.ts` | backend | 4, 5, 13 |
| 7 | `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | app | 6 |
| 8 | `packages/app/src/components/Workbench/index.ts` | app | 6 |
| 9 | `.claude/actionflows/CONTEXTS.md` | framework | 14 |

---

## Phase 1 Exclusions (Deferred to Phase 2+)

These items from the design spec are **intentionally excluded** from Phase 1:

- **File watcher integration** (chokidar) — Phase 1 is manual-trigger only
- **Automatic re-analysis** — Phase 1 only supports manual "Re-analyze" button
- **Agent integration** — The analyze endpoint marks status but does not actually spawn an agent. Layout descriptors will be seeded via API for testing.
- **DependencyGraph widget** — Requires ReactFlow integration, complex. Deferred.
- **ChangeTimeline widget** — Requires temporal data accumulation. Deferred.
- **RelationshipMap widget** — Requires graph visualization. Deferred.
- **TrendChart widget** — Requires historical data points. Deferred.
- **Redis storage adapter** for dossiers — Memory only in Phase 1
- **Suggestion promotion pipeline** — Phase 1 has dismiss/delete only
- **Cross-dossier intelligence** — Isolated dossiers only
- **Dossier templates** — Free-form only
- **External folder support** — Project-local paths only
