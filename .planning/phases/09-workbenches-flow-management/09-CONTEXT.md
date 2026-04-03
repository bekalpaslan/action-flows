# Phase 9: Workbenches & Flow Management - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Each of the 7 default workbenches renders domain-specific content tailored to its purpose. Flows from FLOWS.md are browseable as card grids within each workbench and executable via chat message trigger. Users can compose new flows by selecting and reordering actions from the existing action catalog. Workbench agents have distinct personalities expressed through greetings and response tone.

</domain>

<decisions>
## Implementation Decisions

### Workbench Content Design
- **D-01:** Work workbench shows active chains list + recent activity. List of running/recent chains with status badges, duration, and one-click resume. Task-manager style using existing chain data from sessionStore.
- **D-02:** Explore shows file tree browser + codebase search. Review shows quality gates checklist + audit results. PM shows roadmap timeline + task tracking. Each gets a domain-specific panel layout.
- **D-03:** Settings extends the existing SettingsPage (already has autonomy levels from Phase 8) with full config forms. Archive shows searchable session history list with filters. Studio shows a live component preview canvas with props editors.

### Flow Browsing & Execution UX
- **D-04:** Flows displayed as a card grid within each workbench. Each Card shows flow name, description, chain preview (action count), and a "Run" button. Cards grouped by category. Uses existing Card + Badge components from the design system.
- **D-05:** Executing a flow sends the flow name as a chat message to the workbench agent. The agent compiles and executes the chain. Leverages Phase 7 chat panel infrastructure — no separate execution UI needed.

### Agent Personalities
- **D-06:** Each workbench agent has a distinct greeting message and maintains a consistent tone in responses. Examples: Review is strict ("What needs auditing?"), Explore is curious ("What shall we discover?"), PM is strategic ("What's the priority?"). Personalities defined as config, not hardcoded.
- **D-07:** Personality config lives in shared workbenchTypes.ts. Extend the existing WORKBENCHES array with personality fields (greeting, tone, systemPrompt snippet). Frontend reads it for greeting display, backend injects the systemPrompt snippet into session initialization.

### Flow Composition UI
- **D-08:** v1 composition: select actions from a list + drag to reorder + name the flow + save. No visual graph editor. Uses ACTIONS.md as the action catalog. Simple multi-select pattern, ship fast.

### Claude's Discretion
- Exact file tree component for Explore (reuse existing or new)
- Quality gates data source for Review (VERIFICATION.md files? Gate traces?)
- Roadmap visualization approach for PM (table? timeline? kanban?)
- Component preview sandbox strategy for Studio (iframe? portal? inline?)
- Session history storage/query approach for Archive
- Flow card layout spacing and grouping logic
- Action catalog parsing for flow composition

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workbench Infrastructure
- `packages/app/src/lib/types.ts` — WorkbenchId union type and WORKBENCHES array (extend with personality)
- `packages/app/src/workbenches/pages/` — All 7 existing placeholder page components
- `packages/app/src/workbenches/shell/AppShell.tsx` — 3-panel layout, WorkspaceArea routing
- `packages/shared/src/workbenchTypes.ts` — Extended workbench metadata (StarConfig, triggers, flows)

### Flow Registry
- `.claude/actionflows/FLOWS.md` — Flow definitions organized by context (work/explore/review/pm/settings)
- `.claude/actionflows/ACTIONS.md` — Action catalog for flow composition
- `.claude/actionflows/CONTEXTS.md` — Context-to-workbench routing rules

### Backend Services
- `packages/backend/src/services/personalityParser.ts` — Existing personality extraction from agent.md files
- `packages/backend/src/routes/sessions.ts` — Session creation (inject personality systemPrompt)

### Design System
- `packages/app/src/components/ui/` — Card, Badge, Button, Select components for flow cards and composition UI
- `packages/app/src/components/ui/manifest.ts` — Component manifest for Studio preview

### Prior Phase Infrastructure
- `packages/app/src/stores/sessionStore.ts` — Session/chain data for Work workbench
- `packages/app/src/stores/pipelineStore.ts` — Pipeline data (checkpoint markers from Phase 8)
- `packages/app/src/stores/validationStore.ts` — Violation + autonomy data for Settings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **7 page components** in workbenches/pages/ — all exist as placeholders, ready to fill
- **WorkspaceArea PAGE_MAP** — already routes activeWorkbench to correct page component
- **Card, Badge, Button** — design system components for flow cards
- **PersonalityParser** — backend service that extracts personality from agent.md files
- **sessionStore/pipelineStore/validationStore** — zustand stores with per-workbench data
- **useKeyboardShortcuts** — existing keyboard shortcut infrastructure

### Established Patterns
- Zustand stores with Map<WorkbenchId, State> for per-workbench isolation
- WebSocket channel subscription per workbench
- react-resizable-panels for panel layout
- Sonner toasts for notifications
- Design tokens for all styling (no raw CSS)

### Integration Points
- **WORKBENCHES array in types.ts** — extend with personality fields
- **WorkspaceArea** — already handles page routing, no changes needed
- **Chat panel sendMessage** — flow execution via chat trigger
- **FLOWS.md** — parse for flow card data (name, chain, actions)
- **ACTIONS.md** — parse for composition UI action catalog

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-workbenches-flow-management*
*Context gathered: 2026-04-03*
