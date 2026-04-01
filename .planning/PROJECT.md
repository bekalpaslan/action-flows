# ActionFlows Dashboard — Agentic Personal OS

## What This Is

An agentic personal OS built on ActionFlows — a 3-panel dashboard where each workbench is backed by a persistent Claude remote session. Users express intention through natural language; agents build and shape the software using a shared component library and design system. Actions and flows are the building blocks agents use to execute work. The system validates itself through a neural layer (Claude Code hooks + `/btw` signals) and heals autonomously when contract violations occur.

## Core Value

Agents build with the same components humans see — every button, card, table, and layout follows the design system. Consistency is not a guideline, it's enforced infrastructure.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Layout & Navigation**
- [ ] 3-panel layout: sidebar (~20%), workspace (~55%), chat panel (~25%)
- [ ] Sidebar navigation with workbench selection (replaces cosmic map)
- [ ] Main workspace split: pipeline visualizer (top ~25%) + content area (bottom ~75%)
- [ ] Each workbench renders its dedicated page in the content area on sidebar selection

**Pipeline Visualizer**
- [ ] Horizontal node-based pipeline showing live chain execution
- [ ] Data-driven: nodes and edges rendered from configurable data structure
- [ ] Two node shapes: rounded rectangles (steps) and diamonds (decision gates)
- [ ] Support forking (1→N) and merging (N→1)
- [ ] Horizontally scrollable for long chains
- [ ] Extensible for chain action types, flow types (future)

**Workbenches (7 Defaults)**
- [ ] Work — Active sessions, ongoing chains, the main hub
- [ ] Explore — Navigate codebase, understand before acting
- [ ] Review — Quality gates, approvals, audits
- [ ] PM — Planning, roadmaps, task tracking
- [ ] Settings — Configuration, preferences, system health (absorbed Maintenance)
- [ ] Archive — Historical sessions, searchable memory
- [ ] Studio — Preview components, test layouts, live renders; where agents materialize UI
- [ ] Each workbench displays its registered flows
- [ ] Custom workbench creation by users

**Chat Panel (Per-Workbench Agent Sessions)**
- [ ] Each workbench has its own independent chat panel
- [ ] Chat backed by persistent Claude remote session (survives app restarts, machine off)
- [ ] Session resume via `--resume` for reconnection
- [ ] Expandable menu for current workbench's session history
- [ ] Chat window UI design deferred to future phase (Figma forthcoming)

**Design System & Component Library**
- [ ] Shared component library: buttons, tables, cards, inputs, layouts
- [ ] Design tokens enforced across all workbenches
- [ ] Agents compose from the component library — never write raw CSS
- [ ] Every component well-designed, consistent, reusable

**Neural Validation Layer (Single Layer — Merged Gates + Hooks)**
- [ ] Claude Code hooks (`PreToolUse`/`PostToolUse`) validate agent output before UI rendering
- [ ] Prompt-based hooks evaluate design system compliance automatically
- [ ] `/btw` delivers violation signals to workbench agents
- [ ] Agent decides: fix now (critical) or note for future heal pass (non-critical)
- [ ] Healing outcome writes to learnings (prevents recurrence)

**Claude Code Integration (Framework Infrastructure)**
- [ ] Remote sessions — one persistent session per workbench
- [ ] Hooks — neural validation layer, auto-formatting, permission control
- [ ] `/btw` — violation signaling to agents
- [ ] Streaming JSON — real-time chain execution feeding pipeline visualizer
- [ ] `SubagentStart`/`SubagentStop` hooks — agent lifecycle tracking for pipeline view
- [ ] Subagents with persistent memory per workbench

**Claude Code Integration (User-Facing)**
- [ ] Scheduled tasks (cron) — recurring automation, health checks, reports
- [ ] `/loop` — session-scoped polling (watch builds, monitor deploys)
- [ ] Agent teams — parallel agents across workbenches for coordinated tasks
- [ ] Skills — user-created reusable commands per workbench
- [ ] MCP servers — custom tool integrations (databases, APIs, Slack)
- [ ] Permissions — per-workbench security boundaries

**Flow Management**
- [ ] All flows listed within their corresponding workbench
- [ ] Removed workbenches (Maintenance, Respect) have their flows archived, not deleted
- [ ] Archived flows harvestable for future use

### Out of Scope

- Cosmic map analogy / cosmic theming — stripped entirely, replaced with sidebar navigation
- Chat window visual redesign — deferred to future phase, Figma design forthcoming
- Terminal behavior overhaul — current session/communication issues noted, deferred to future phase
- Mobile app — desktop/web first
- Video/media processing — not core to agentic OS

## Context

**Existing Codebase (Brownfield):**
This is an existing monorepo (pnpm workspaces) with React 18 + TypeScript + Vite frontend, Express + ws backend, shared types package, MCP server, and Electron desktop wrapper. The codebase has an existing cosmic-themed UI, contract system, harmony detection, and orchestrator framework in `.claude/actionflows/`. The build-vs-rebuild decision for the frontend requires analysis during planning — existing backend services, shared types, and the actionflows framework are assets to preserve; the cosmic UI layer needs replacement.

**The ActionFlows Framework:**
The `.claude/actionflows/` directory contains the orchestration framework: actions (atomic building blocks with agent.md + instructions.md), flows (predefined action sequences), contexts (routing rules), contracts (17 output formats), and a learning/memory system. This framework is the backbone — agents, chains, and flows are the building blocks of the OS. The framework itself is preserved and evolved, not rebuilt.

**Three Audiences:**
- Coders: Technical flows, code-level interaction, IDE paradigm
- Regular users: Natural language to software creation, no coding required
- Explorers: Discovery journey, unlock flows, watch the system evolve

**Open Source (MIT):** Full sovereignty over all layers. The product is the idea — productivity software that evolves through use. Fork, reshape, replace anything.

## Constraints

- **Tech stack**: React 18 + TypeScript + Vite (frontend), Express + ws (backend), pnpm monorepo — preserve existing stack
- **Claude Code dependency**: Framework relies on Claude Code features (remote sessions, hooks, /btw, cron, streaming). Must work within Claude Code's capabilities and API surface
- **Design system enforcement**: No raw CSS in agent output. Component library is the only way agents build UI
- **Electron**: Desktop app wrapper must continue to function
- **Contract system**: Existing 17 output format contracts must be preserved or migrated, not discarded

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Strip cosmic map, use sidebar + 3-panel layout | Cosmic metaphor adds complexity without UX clarity; sidebar is familiar, functional | — Pending |
| 7 default workbenches (merge Maintenance→Settings, remove Respect, add Studio) | Maintenance too niche for own space; Respect becomes framework-level enforcement; Studio needed for agent UI materialization | — Pending |
| Single validation layer (merge gates + hooks) | Gates and hooks overlap; single neural layer using Claude Code hooks is simpler and leverages existing infrastructure | — Pending |
| /btw for violation signaling | Piggybacks on Claude Code infrastructure; agent maintains conversation context for richer fixes; no custom event system needed | — Pending |
| Persistent remote sessions per workbench | Each workbench becomes a live agent workspace, not just a UI page; agents work autonomously even when user isn't looking | — Pending |
| Agents compose from component library only | Design consistency enforced at infrastructure level, not guidelines; prevents UI drift across workbenches | — Pending |
| Archive removed workbench flows, don't delete | Flows represent accumulated intelligence; harvesting archived flows preserves system learning | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after initialization*
