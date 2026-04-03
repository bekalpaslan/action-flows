# Requirements: ActionFlows Dashboard — Agentic Personal OS

**Defined:** 2026-04-02
**Core Value:** Agents build with the same components humans see — consistency is enforced infrastructure, not guidelines

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Technical Foundation

- [x] **FOUND-01**: TypeScript compiles with zero errors across all packages
- [x] **FOUND-02**: Branded types (SessionId, ChainId, StepId, UserId) used correctly — no `as any` bypasses
- [x] **FOUND-03**: Single WebSocket connection multiplexed across all workbenches (replaces per-component connections)
- [x] **FOUND-04**: Frontend rebuilt as clean workbench architecture (preserve backend, shared types, actionflows framework)

### Layout & Navigation

- [x] **LAYOUT-01**: 3-panel resizable layout: sidebar (~20%), workspace (~55%), chat panel (~25%)
- [x] **LAYOUT-02**: Sidebar navigation with 7 default workbenches (Work, Explore, Review, PM, Settings, Archive, Studio)
- [x] **LAYOUT-03**: Workspace split: pipeline visualizer (top ~25%) + content area (bottom ~75%)
- [x] **LAYOUT-04**: Panels resizable with min/max constraints and collapse support
- [x] **LAYOUT-05**: Command palette with keyboard navigation (Cmd+K / Cmd+P)

### Design System

- [x] **DESIGN-01**: Design token system covering color, spacing, typography, elevation, animation
- [x] **DESIGN-02**: Component library: Button, Card, Dialog, Tabs, Tooltip, Dropdown, Input, Select, Checkbox, Radio, Badge, Avatar
- [x] **DESIGN-03**: All components built with Radix primitives + Tailwind v4 + CVA variants
- [x] **DESIGN-04**: `cn()` utility with clsx + tailwind-merge for conflict-free class composition
- [x] **DESIGN-05**: Machine-readable component manifest (registry agents use to know what components exist and how to compose them)
- [x] **DESIGN-06**: No raw CSS in agent output — component library is the only way agents build UI

### Pipeline Visualization

- [x] **PIPE-01**: Horizontal node-based pipeline showing live chain execution
- [x] **PIPE-02**: Data-driven rendering from configurable data structure (JSON nodes + edges)
- [x] **PIPE-03**: Two node shapes: rounded rectangles (steps) and diamonds (decision gates)
- [x] **PIPE-04**: Support forking (1→N) and merging (N→1) in pipelines
- [x] **PIPE-05**: Horizontally scrollable for long chains
- [ ] **PIPE-06**: Real-time status updates via WebSocket (pending → running → complete/failed)
- [x] **PIPE-07**: Pipeline state scoped per workbench (switching workbenches shows that workbench's pipeline)

### Agent Sessions

- [ ] **SESSION-01**: Persistent Claude session per workbench via Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- [ ] **SESSION-02**: Lazy session activation — only active workbench holds a live session
- [ ] **SESSION-03**: Session resume across app restarts via `--resume` with session ID mapping
- [ ] **SESSION-04**: Session health monitoring with heartbeat-based detection (<30s latency)
- [ ] **SESSION-05**: Session resurrection using local conversation logs as source of truth
- [ ] **SESSION-06**: Backend (SessionManager) is sole owner of Agent SDK calls — frontend communicates via WebSocket only
- [ ] **SESSION-07**: Session history searchable per workbench via `listSessions()` + `getSessionMessages()`
- [ ] **SESSION-08**: Workbench-scoped agent personality (Review = strict, Explore = curious, PM = strategic)
- [ ] **SESSION-09**: Session forking — branch a conversation to explore alternatives without losing the original

### Chat Panel

- [ ] **CHAT-01**: Each workbench has its own independent chat panel (right column)
- [ ] **CHAT-02**: Chat backed by persistent Claude remote session
- [ ] **CHAT-03**: Scrollable message history with auto-scroll on new messages
- [ ] **CHAT-04**: Fixed input row: text input + submit button
- [ ] **CHAT-05**: Render Claude's AskUserQuestion tool calls as interactive UI components (radio buttons, checkboxes, option cards) from the component library
- [ ] **CHAT-06**: Capture user selections from interactive tool calls and feed back as tool responses
- [ ] **CHAT-07**: Expandable menu for current workbench's session history
- [ ] **CHAT-08**: Session connect/disconnect status indicator

### Status & Notifications

- [ ] **STATUS-01**: Multi-agent status dashboard showing which agents are running, their workbench, status (idle/running/blocked/complete), elapsed time
- [ ] **STATUS-02**: Toast notification system for agent events (connect, disconnect, completion, errors, validation results)
- [ ] **STATUS-03**: SubagentStart/SubagentStop hooks feed agent lifecycle into status registry

### Neural Validation (Intelligence Layer)

- [ ] **NEURAL-01**: Claude Code hooks (PreToolUse/PostToolUse) validate agent file edits against component library rules
- [ ] **NEURAL-02**: PreToolUse allowlist hooks block unauthorized patterns (raw CSS, inline styles, non-library components)
- [ ] **NEURAL-03**: PostToolUse linter hook validates design system compliance on every file write
- [ ] **NEURAL-04**: `/btw` delivers violation signals to workbench agents with severity levels (critical/warning/info)
- [ ] **NEURAL-05**: Agent decides: fix now (critical) or note for future heal pass (non-critical)
- [ ] **NEURAL-06**: Prompt-based hooks evaluate semantic design system compliance
- [ ] **NEURAL-07**: Machine-readable component manifest injected into agent context

### Safety & Controls

- [ ] **SAFETY-01**: Checkpoint/rollback system — UI shows checkpoint timeline, one-click revert
- [ ] **SAFETY-02**: Human-in-the-loop approval gates with configurable autonomy levels per workbench
- [ ] **SAFETY-03**: Risk-based escalation: low-risk auto-approves, high-risk requires human OK
- [ ] **SAFETY-04**: Approval gates don't block entire pipeline — only the specific action
- [ ] **SAFETY-05**: Per-workbench permission boundaries (what agents can touch)

### Flow Management

- [ ] **FLOW-01**: Flow browser per workbench showing registered flows
- [ ] **FLOW-02**: Archived flows from removed workbenches (Maintenance, Respect) preserved and harvestable
- [x] **FLOW-03**: Flows surfaced as executable blueprints (not just instructions)
- [x] **FLOW-04**: Flow composition UI — browse, select, execute flows from the dashboard

### Customization & Automation

- [ ] **CUSTOM-01**: Self-healing flows: validate → signal → fix → re-validate with circuit breaker (max 2 attempts)
- [ ] **CUSTOM-02**: Per-workbench skills — user-created reusable commands scoped to workbench context
- [ ] **CUSTOM-03**: Scheduled tasks (cron) UI — recurring automation with status, next run, history per workbench
- [ ] **CUSTOM-04**: Custom workbench creation — user-defined domains beyond 7 defaults with own session, pipeline, chat, flows
- [ ] **CUSTOM-05**: Session forking UI — visual fork point in session history tree
- [ ] **CUSTOM-06**: Learning persistence UI — searchable learnings browser across workbenches
- [ ] **CUSTOM-07**: MCP server configuration panel in Settings workbench

### Workbenches

- [ ] **BENCH-01**: Work — active sessions, ongoing chains, the main hub
- [ ] **BENCH-02**: Explore — navigate codebase, understand before acting
- [ ] **BENCH-03**: Review — quality gates, approvals, audits
- [ ] **BENCH-04**: PM — planning, roadmaps, task tracking
- [ ] **BENCH-05**: Settings — configuration, preferences, system health (absorbed Maintenance)
- [ ] **BENCH-06**: Archive — historical sessions, searchable memory
- [ ] **BENCH-07**: Studio — preview components, test layouts, live renders
- [ ] **BENCH-08**: Each workbench agent has its own greeting and work tendency matching its domain
- [x] **BENCH-09**: Each workbench displays its registered flows

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Agent Teams

- **TEAM-01**: Parallel agents across workbenches for coordinated tasks
- **TEAM-02**: Multi-session coordination protocol
- **TEAM-03**: Cross-workbench shared context for team operations

### Chat Visual Redesign

- **CHATUI-01**: Figma-designed chat window (designs forthcoming)
- **CHATUI-02**: Rich message formatting beyond plain text/markdown

### Community

- **COMM-01**: Custom workbench recipe repository for community sharing
- **COMM-02**: "Most liked forks" discovery mechanism
- **COMM-03**: One-click prompt Claude to implement community workbench

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cosmic map / cosmic theming | Stripped — replaced with sidebar navigation |
| VS Code fork / editor integration | ActionFlows is an orchestration dashboard, not an editor |
| Raw CSS editor for agents | Breaks design system enforcement — the core value proposition |
| Custom AI model switching UI | Claude Code handles model selection internally |
| Web-hosted SaaS deployment | Agent SDK requires Claude Code CLI on local machine |
| Real-time collaborative editing | Personal OS — single user per installation |
| Plugin/extension marketplace | Premature ecosystem play before PMF |
| Autonomous agents with no human oversight | Configurable autonomy with human-in-the-loop defaults |
| Agent-generated arbitrary UI outside component library | Impossible to enforce design consistency at scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 2 | Complete |
| FOUND-04 | Phase 2 | Complete |
| DESIGN-01 | Phase 3 | Complete |
| DESIGN-02 | Phase 3 | Complete |
| DESIGN-03 | Phase 3 | Complete |
| DESIGN-04 | Phase 3 | Complete |
| DESIGN-05 | Phase 3 | Complete |
| DESIGN-06 | Phase 3 | Complete |
| LAYOUT-01 | Phase 4 | Complete |
| LAYOUT-02 | Phase 4 | Complete |
| LAYOUT-03 | Phase 4 | Complete |
| LAYOUT-04 | Phase 4 | Complete |
| LAYOUT-05 | Phase 4 | Complete |
| PIPE-01 | Phase 5 | Complete |
| PIPE-02 | Phase 5 | Complete |
| PIPE-03 | Phase 5 | Complete |
| PIPE-04 | Phase 5 | Complete |
| PIPE-05 | Phase 5 | Complete |
| PIPE-06 | Phase 5 | Pending |
| PIPE-07 | Phase 5 | Complete |
| SESSION-01 | Phase 6 | Pending |
| SESSION-02 | Phase 6 | Pending |
| SESSION-03 | Phase 6 | Pending |
| SESSION-04 | Phase 6 | Pending |
| SESSION-05 | Phase 6 | Pending |
| SESSION-06 | Phase 6 | Pending |
| SESSION-07 | Phase 6 | Pending |
| SESSION-08 | Phase 6 | Pending |
| SESSION-09 | Phase 6 | Pending |
| STATUS-01 | Phase 6 | Pending |
| STATUS-02 | Phase 6 | Pending |
| STATUS-03 | Phase 6 | Pending |
| CHAT-01 | Phase 7 | Pending |
| CHAT-02 | Phase 7 | Pending |
| CHAT-03 | Phase 7 | Pending |
| CHAT-04 | Phase 7 | Pending |
| CHAT-05 | Phase 7 | Pending |
| CHAT-06 | Phase 7 | Pending |
| CHAT-07 | Phase 7 | Pending |
| CHAT-08 | Phase 7 | Pending |
| NEURAL-01 | Phase 8 | Pending |
| NEURAL-02 | Phase 8 | Pending |
| NEURAL-03 | Phase 8 | Pending |
| NEURAL-04 | Phase 8 | Pending |
| NEURAL-05 | Phase 8 | Pending |
| NEURAL-06 | Phase 8 | Pending |
| NEURAL-07 | Phase 8 | Pending |
| SAFETY-01 | Phase 8 | Pending |
| SAFETY-02 | Phase 8 | Pending |
| SAFETY-03 | Phase 8 | Pending |
| SAFETY-04 | Phase 8 | Pending |
| SAFETY-05 | Phase 8 | Pending |
| BENCH-01 | Phase 9 | Pending |
| BENCH-02 | Phase 9 | Pending |
| BENCH-03 | Phase 9 | Pending |
| BENCH-04 | Phase 9 | Pending |
| BENCH-05 | Phase 9 | Pending |
| BENCH-06 | Phase 9 | Pending |
| BENCH-07 | Phase 9 | Pending |
| BENCH-08 | Phase 9 | Pending |
| BENCH-09 | Phase 9 | Complete |
| FLOW-01 | Phase 9 | Pending |
| FLOW-02 | Phase 9 | Pending |
| FLOW-03 | Phase 9 | Complete |
| FLOW-04 | Phase 9 | Complete |
| CUSTOM-01 | Phase 10 | Pending |
| CUSTOM-02 | Phase 10 | Pending |
| CUSTOM-03 | Phase 10 | Pending |
| CUSTOM-04 | Phase 10 | Pending |
| CUSTOM-05 | Phase 10 | Pending |
| CUSTOM-06 | Phase 10 | Pending |
| CUSTOM-07 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 74 total
- Mapped to phases: 74
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
