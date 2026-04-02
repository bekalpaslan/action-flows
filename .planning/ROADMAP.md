# Roadmap: ActionFlows Dashboard

## Overview

Transform the ActionFlows Dashboard from a cosmic-themed orchestration visualizer into a workbench-based agentic personal OS. The build follows a strict dependency chain: clean the TypeScript foundation agents will imitate, scaffold the new frontend architecture with the design system agents will compose from, build the layout and pipeline visualization users will see, wire up persistent agent sessions and chat panels users will interact through, layer on neural validation and safety controls that enforce design system compliance, then deliver workbench content, flow management, and power features that make the system self-sustaining. The backend, shared types, and actionflows framework are preserved; the frontend is a rebuild.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: TypeScript Foundation** - Zero compiler errors, branded type hygiene, clean patterns for agents to imitate
- [ ] **Phase 2: Frontend Scaffold & WebSocket** - Clean workbench architecture, singleton multiplexed WebSocket, Vite/Electron build verified
- [x] **Phase 3: Design System** - Token system, component library with Radix + Tailwind v4 + CVA, machine-readable manifest (completed 2026-04-02)
- [x] **Phase 4: Layout & Navigation** - 3-panel resizable layout, sidebar with 7 workbenches, workspace split, command palette (completed 2026-04-02)
- [ ] **Phase 5: Pipeline Visualization** - Horizontal node-based pipeline with live chain execution, forking/merging, real-time status
- [ ] **Phase 6: Agent Sessions & Status** - Persistent Claude sessions per workbench, lazy activation, health monitoring, status dashboard
- [ ] **Phase 7: Chat Panel** - Per-workbench chat backed by persistent sessions, interactive tool call rendering, session history
- [ ] **Phase 8: Neural Validation & Safety** - Hook-based design system enforcement, /btw signaling, approval gates, permission boundaries
- [ ] **Phase 9: Workbenches & Flow Management** - 7 default workbench content pages, flow browser, archived flow harvesting, flow composition
- [ ] **Phase 10: Customization & Automation** - Self-healing flows, skills, scheduled tasks, custom workbenches, session forking, learning browser

## Phase Details

### Phase 1: TypeScript Foundation
**Goal**: Agents entering this codebase find zero type errors and clean branded type patterns to imitate
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02
**Success Criteria** (what must be TRUE):
  1. `pnpm type-check` passes with zero errors across all packages (backend, app, shared, mcp-server)
  2. All SessionId, ChainId, StepId, and UserId usages go through branded type constructors -- no `as any` bypasses exist in the codebase
  3. A developer (or agent) reading existing code sees consistent TypeScript patterns worth imitating
**Plans:** 3 plans
Plans:
- [x] 01-01-PLAN.md -- Fix shared artifact types and storage layer TypeScript errors
- [x] 01-02-PLAN.md -- Fix all service layer TypeScript errors (16 files)
- [x] 01-03-PLAN.md -- Fix routes, CLI, utilities, entry point, and final zero-error verification

### Phase 2: Frontend Scaffold & WebSocket
**Goal**: The new frontend architecture exists as a clean workbench shell with a working build pipeline and multiplexed WebSocket connection
**Depends on**: Phase 1
**Requirements**: FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. A clean `src/workbenches/` directory structure replaces the cosmic UI layer -- the app renders a workbench shell (not the old cosmic map)
  2. A single WebSocket connection multiplexes messages across all workbenches (no per-component connections)
  3. `pnpm dev` starts the Vite dev server and `pnpm build` produces a working Electron app with the new frontend
  4. Backend services, shared types, and the actionflows framework are preserved and functional
**Plans:** 3 plans
Plans:
- [x] 02-01-PLAN.md -- Delete cosmic frontend, build new workbench shell with sidebar navigation and zustand state
- [x] 02-02-PLAN.md -- Rebuild backend WebSocket hub with channel-per-workbench multiplexing
- [x] 02-03-PLAN.md -- Frontend WebSocket client singleton, status indicator, and build pipeline verification
**UI hint**: yes

### Phase 3: Design System
**Goal**: Agents and humans compose UI exclusively from a shared component library backed by design tokens
**Depends on**: Phase 2
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06
**Success Criteria** (what must be TRUE):
  1. Design tokens (color, spacing, typography, elevation, animation) are defined and Tailwind v4 consumes them via `@theme` directive
  2. All 12 core components (Button, Card, Dialog, Tabs, Tooltip, Dropdown, Input, Select, Checkbox, Radio, Badge, Avatar) exist with Radix primitives + Tailwind + CVA variants
  3. The `cn()` utility (clsx + tailwind-merge) is available and used by all components for conflict-free class composition
  4. A machine-readable component manifest exists that agents can consume to know what components exist and how to compose them
  5. No raw CSS exists in any component -- all styling flows through design tokens and CVA variants
**Plans:** 4/4 plans complete
Plans:
- [x] 03-01-PLAN.md -- Install deps, create Tailwind v4 token system (theme.css + globals.css), cn() utility, migrate shell CSS
- [x] 03-02-PLAN.md -- Build 6 core components: Button, Card, Badge, Avatar, Input, Checkbox
- [x] 03-03-PLAN.md -- Build 6 Radix components: Dialog, Tabs, Tooltip, DropdownMenu, Select, RadioGroup
- [x] 03-04-PLAN.md -- Barrel export, TypeScript manifest, JSON manifest, full build verification
**UI hint**: yes

### Phase 4: Layout & Navigation
**Goal**: Users see and interact with the 3-panel workbench layout with sidebar navigation and command palette
**Depends on**: Phase 3
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05
**Success Criteria** (what must be TRUE):
  1. The app renders a 3-panel resizable layout: sidebar (~20%), workspace (~55%), chat panel (~25%) with min/max constraints
  2. Sidebar shows 7 default workbenches (Work, Explore, Review, PM, Settings, Archive, Studio) and clicking one switches the workspace content
  3. The workspace area splits into pipeline visualizer region (top ~25%) and content area (bottom ~75%)
  4. Panels can be resized by dragging and collapsed/expanded
  5. Command palette opens with Cmd+K / Ctrl+K and supports keyboard navigation through commands
**Plans:** 5 plans (4 complete + 1 gap closure)
Plans:
- [x] 04-01-PLAN.md -- Install deps (react-resizable-panels, cmdk), extend types with lucide icons, extend uiStore, vitest setup
- [x] 04-02-PLAN.md -- Rewrite AppShell with 3-panel PanelGroup, create Sidebar with collapse/expand, migrate WebSocketStatus
- [x] 04-03-PLAN.md -- Rebuild WorkspaceArea with vertical pipeline/content split, create PipelinePlaceholder, migrate ChatPlaceholder
- [x] 04-04-PLAN.md -- Create command palette (cmdk), keyboard shortcuts hook, wire into AppShell
- [x] 04-05-PLAN.md -- Gap closure: fix react-resizable-panels v4.8 API mismatch in AppShell.tsx and WorkspaceArea.tsx type annotation
**UI hint**: yes

### Phase 04.1: Framework & Docs Realignment (INSERTED)

**Goal:** All .claude/actionflows/ framework files use agentic OS vocabulary with zero cosmic remnants, CONTEXTS.md routes to 7 workbenches, stale docs/ and logs/ deleted
**Requirements**: D-01, D-02, D-03, D-04, D-05, D-06
**Depends on:** Phase 4
**Success Criteria** (what must be TRUE):
  1. Zero cosmic terminology exists in any .md file under .claude/actionflows/ (excluding logs/)
  2. CONTEXTS.md routes to exactly 7 workbenches (Work, Explore, Review, PM, Settings, Archive, Studio) plus system-health auto-target and editor manual context
  3. docs/ directory deleted, actionflows/logs/ content deleted, cosmic/MODEL.md deleted
  4. All broken cross-references to deleted docs/ paths fixed
  5. Functional gate vocabulary (Pre-Action Gate, Gate 1-14) preserved
  6. Flow reassignment complete: maintenance flows to settings/work, intel flows to explore
**Plans:** 1/5 plans executed
Plans:
- [x] 04.1-01-PLAN.md -- Delete docs/, logs/ content, and cosmic/MODEL.md
- [ ] 04.1-02-PLAN.md -- Deep rewrite ORCHESTRATOR.md, CONTEXTS.md, FLOWS.md, ACTIONS.md, project.config.md
- [ ] 04.1-03-PLAN.md -- Deep rewrite CONTRACT.md, CLAUDE.md, actionflows/docs/living/, secondary critical files
- [ ] 04.1-04-PLAN.md -- Batch update agent.md files, flow instructions, onboarding modules, LEARNINGS.md
- [ ] 04.1-05-PLAN.md -- Batch replace remaining files and comprehensive verification grep

### Phase 5: Pipeline Visualization
**Goal**: Users watch live chain execution as a horizontal node-based pipeline that updates in real-time
**Depends on**: Phase 4
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07
**Success Criteria** (what must be TRUE):
  1. A horizontal pipeline renders nodes and edges from a JSON data structure (not hardcoded)
  2. Steps display as rounded rectangles and decision gates display as diamonds
  3. Pipelines support forking (1-to-N) and merging (N-to-1) visually
  4. Long pipelines scroll horizontally without breaking the layout
  5. Node status updates in real-time via WebSocket (pending, running, complete, failed transitions are visible)
  6. Switching workbenches shows that workbench's own pipeline state (not a shared global view)
**Plans**: TBD
**UI hint**: yes

### Phase 6: Agent Sessions & Status
**Goal**: Each workbench connects to a persistent Claude session that survives restarts, with visible status monitoring
**Depends on**: Phase 2, Phase 5
**Requirements**: SESSION-01, SESSION-02, SESSION-03, SESSION-04, SESSION-05, SESSION-06, SESSION-07, SESSION-08, SESSION-09, STATUS-01, STATUS-02, STATUS-03
**Success Criteria** (what must be TRUE):
  1. The backend SessionManager creates and manages Claude sessions via Agent SDK -- one session per workbench, frontend communicates via WebSocket only
  2. Only the active workbench holds a live session; switching workbenches activates/deactivates sessions lazily
  3. Sessions resume after app restart via `--resume` with stored session ID mapping
  4. A health monitor detects session disconnection within 30 seconds and a resurrection layer recovers from local conversation logs
  5. A multi-agent status dashboard shows which agents are running, their workbench, status (idle/running/blocked/complete), and elapsed time
  6. Toast notifications fire for agent lifecycle events (connect, disconnect, completion, errors)
**Plans**: TBD
**UI hint**: yes

### Phase 7: Chat Panel
**Goal**: Users converse with their workbench agent through an independent chat panel with interactive tool call rendering
**Depends on**: Phase 6
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08
**Success Criteria** (what must be TRUE):
  1. Each workbench has its own independent chat panel in the right column, backed by that workbench's persistent Claude session
  2. Message history scrolls with auto-scroll on new messages, and a fixed input row (text input + submit) stays at the bottom
  3. Claude's AskUserQuestion tool calls render as interactive UI components (radio buttons, checkboxes, option cards) from the component library -- not plain text
  4. User selections from interactive tool calls are captured and fed back as tool responses to the Claude session
  5. An expandable menu shows the current workbench's session history, and a status indicator shows connect/disconnect state
**Plans**: TBD
**UI hint**: yes

### Phase 8: Neural Validation & Safety
**Goal**: Agents cannot bypass the design system -- hooks validate every file edit and safety gates protect destructive operations
**Depends on**: Phase 3, Phase 6
**Requirements**: NEURAL-01, NEURAL-02, NEURAL-03, NEURAL-04, NEURAL-05, NEURAL-06, NEURAL-07, SAFETY-01, SAFETY-02, SAFETY-03, SAFETY-04, SAFETY-05
**Success Criteria** (what must be TRUE):
  1. PreToolUse hooks block agent file edits containing raw CSS, inline styles, or non-library components before they land
  2. PostToolUse hooks validate design system compliance on every file write and surface violations
  3. `/btw` delivers violation signals to workbench agents with severity levels (critical/warning/info), and agents fix critical violations immediately
  4. A checkpoint/rollback UI shows a timeline of checkpoints with one-click revert
  5. Human-in-the-loop approval gates block specific high-risk actions (not entire pipelines), with configurable autonomy levels per workbench
**Plans**: TBD
**UI hint**: yes

### Phase 9: Workbenches & Flow Management
**Goal**: Each of the 7 default workbenches renders its domain-specific content and flows are browseable, executable blueprints
**Depends on**: Phase 4, Phase 7
**Requirements**: BENCH-01, BENCH-02, BENCH-03, BENCH-04, BENCH-05, BENCH-06, BENCH-07, BENCH-08, BENCH-09, FLOW-01, FLOW-02, FLOW-03, FLOW-04
**Success Criteria** (what must be TRUE):
  1. Work shows active sessions and ongoing chains; Explore shows codebase navigation; Review shows quality gates; PM shows planning/roadmaps; Settings shows configuration and system health; Archive shows historical sessions; Studio shows component preview and live renders
  2. Each workbench agent greets users with a personality matching its domain (Review is strict, Explore is curious, PM is strategic)
  3. Each workbench displays its registered flows in a browseable list
  4. Archived flows from removed workbenches (Maintenance, Respect) are preserved and harvestable
  5. Users can browse, select, and execute flows from a flow composition UI within any workbench
**Plans**: TBD
**UI hint**: yes

### Phase 10: Customization & Automation
**Goal**: The system sustains itself through self-healing flows, and users extend it with custom workbenches, skills, and automation
**Depends on**: Phase 8, Phase 9
**Requirements**: CUSTOM-01, CUSTOM-02, CUSTOM-03, CUSTOM-04, CUSTOM-05, CUSTOM-06, CUSTOM-07
**Success Criteria** (what must be TRUE):
  1. Self-healing flows run the validate-signal-fix-re-validate cycle with a circuit breaker that stops after 2 failed attempts
  2. Users can create per-workbench skills (reusable commands) scoped to that workbench's context
  3. A scheduled tasks UI shows recurring automations with status, next run time, and execution history per workbench
  4. Users can create custom workbenches beyond the 7 defaults, each with its own session, pipeline, chat, and flows
  5. Session forking UI shows a visual fork point in session history, letting users branch conversations to explore alternatives
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 4.1 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. TypeScript Foundation | 0/3 | Planning complete | - |
| 2. Frontend Scaffold & WebSocket | 0/3 | Planning complete | - |
| 3. Design System | 4/4 | Complete   | 2026-04-02 |
| 4. Layout & Navigation | 5/5 | Complete | 2026-04-02 |
| 4.1 Framework & Docs Realignment | 1/5 | In Progress|  |
| 5. Pipeline Visualization | 0/? | Not started | - |
| 6. Agent Sessions & Status | 0/? | Not started | - |
| 7. Chat Panel | 0/? | Not started | - |
| 8. Neural Validation & Safety | 0/? | Not started | - |
| 9. Workbenches & Flow Management | 0/? | Not started | - |
| 10. Customization & Automation | 0/? | Not started | - |
