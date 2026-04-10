# ActionFlows Dashboard — Agentic Personal OS

## What This Is

A shipped agentic personal OS built on ActionFlows — a 3-panel dashboard where each workbench is backed by a persistent Claude session. Users express intention through natural language; agents build and shape the software using a shared component library and design system. Actions and flows are the building blocks agents use to execute work. The system validates itself through a neural layer (Claude Code hooks + `/btw` signals) and heals autonomously when contract violations occur.

**v4.8 status: Shipped 2026-04-11.** 13 phases complete, 74/74 requirements delivered, full 3-layer history model with bounded growth on gate traces, ledger, and canonical learnings.

## Core Value

Agents build with the same components humans see — every button, card, table, and layout follows the design system. Consistency is not a guideline, it's enforced infrastructure.

## Current State (v4.8 Shipped)

**Delivered this milestone:**
- Clean TypeScript foundation + cosmic UI teardown + workbench shell rebuild
- Design system with 12 Radix+CVA components and machine-readable manifest.json
- 3-panel resizable layout with 7 workbenches (Work, Explore, Review, PM, Settings, Archive, Studio) and Cmd+K command palette
- Framework realignment to agentic OS model (cosmic terminology removed from all docs)
- Real-time pipeline visualization with @xyflow/react v12 and dagre layout
- Persistent Claude sessions per workbench with lazy activation, health monitoring, session resume
- Per-workbench chat panels with interactive AskUserQuestion tool rendering
- Neural validation layer (PreToolUse/PostToolUse hooks) enforcing design system at file-write time
- Customization layer: self-healing flows with circuit breaker, skills, Croner scheduling, custom workbenches, session forking, learnings browser
- History & memory lifecycle: 3-layer model (raw → ledger → canonical), 7-day TTL for gate traces, 50-entry LEARNINGS.md cap with year-scoped archives, enforced INDEX.md creation at log time

**Tech stack (production):**
- Frontend: React 18 + TypeScript + Vite 6 + Electron 35 + @xyflow/react 12
- Backend: Express 4 + ws 8 + Vitest 4 + Croner + ioredis
- Shared: Zod schemas, branded types, WebSocket envelopes
- Storage: MemoryStorage (dev) / Redis (prod) behind unified Storage interface
- Design system: Tailwind v4 + Radix primitives + CVA variants
- Monorepo: pnpm workspaces

**Production metrics:**
- Backend test suite: 42 files / 981 tests / 0 failures
- Frontend TypeScript: `pnpm --filter @afw/app exec tsc --noEmit` exits 0
- 58 plans executed across 13 phases in ~10 days

## Requirements

### Validated (v4.8)

All 74 v4.8 requirements satisfied. See `.planning/milestones/v4.8-REQUIREMENTS.md` for the complete traceability table.

- ✓ **FOUND-01..04** — TypeScript foundation + frontend scaffold
- ✓ **DESIGN-01..06** — Design system with Tailwind v4 + Radix + CVA
- ✓ **LAYOUT-01..05** — 3-panel resizable layout + command palette
- ✓ **PIPE-01..07** — Real-time horizontal pipeline visualization
- ✓ **SESSION-01..09, STATUS-01..03** — Persistent Claude sessions + status monitoring
- ✓ **CHAT-01..08** — Per-workbench chat with interactive tool rendering
- ✓ **NEURAL-01..07, SAFETY-01..05** — Neural validation + safety gates
- ✓ **BENCH-01..09, FLOW-01..04** — 7 workbenches + flow management
- ✓ **CUSTOM-01..07** — Self-healing, skills, scheduling, custom workbenches, forking
- ✓ **D-01..D-12** — History & memory lifecycle (Phase 999.1)

### Active (Next Milestone)

TBD — run `/gsd:new-milestone` to define next milestone's requirements.

### Out of Scope

- Cosmic map analogy / cosmic theming — stripped in Phase 04.1
- Mobile app — desktop/web first
- Video/media processing — not core to agentic OS
- Search UI for ledger entries — deferred, separate future phase
- Bulk review/approval interface for ledger→canonical promotions — deferred
- Ledger visualization (health score over time) — deferred
- Backfilling INDEX.md for legacy log session dirs — not in scope per D-11

## Constraints

- **Tech stack:** React 18 + TypeScript + Vite (frontend), Express + ws (backend), pnpm monorepo — preserve existing stack
- **Claude Code dependency:** Framework relies on Claude Code features (remote sessions, hooks, `/btw`, cron, streaming). Must work within Claude Code's capabilities and API surface
- **Design system enforcement:** No raw CSS in agent output. Component library is the only way agents build UI
- **Electron:** Desktop app wrapper must continue to function
- **Backend test suite:** Must stay at 0 failures — regressions block milestone completion

## Key Decisions (v4.8)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Strip cosmic map, use sidebar + 3-panel layout | Cosmic metaphor added complexity without UX clarity | ✓ Good — users navigate intuitively |
| 7 default workbenches (merge Maintenance→Settings, remove Respect, add Studio) | Focused the default set around what users actually need | ✓ Good — shipped clean |
| Single validation layer (merge gates + hooks) | Gates and hooks overlapped; single neural layer using Claude Code hooks is simpler | ✓ Good — hooks enforcement works |
| `/btw` for violation signaling | Piggybacks on Claude Code infrastructure; agent maintains conversation context | ✓ Good — critical violations get immediate attention |
| Persistent remote sessions per workbench | Each workbench becomes a live agent workspace, not just a UI page | ✓ Good — lazy activation keeps token budget manageable |
| Agents compose from component library only | Design consistency enforced at infrastructure level | ✓ Good — manifest.json enables discovery |
| Archive removed workbench flows, don't delete | Flows represent accumulated intelligence | ✓ Good — Phase 9 harvest UI surfaces archived flows |
| Frontend rebuild (not migration) | Cosmic UI was tightly coupled; clean workbench dir replaced `src/workbenches/` | ✓ Good — 834 files deleted, clean structure |
| TypeScript debt fixed first | Agents imitate whatever patterns exist — patterns must be clean before agent work begins | ✓ Good — Phase 1 set the foundation |
| Design system before layout | Component library is infrastructure layout composes from | ✓ Good — Phase 3 unblocked Phase 4 |
| Lazy session activation | Only active workbench holds a live session to avoid token budget explosion | ✓ Good — shipped without budget issues |
| Zustand module singletons over React contexts | Replaced 12 nested context providers; simpler state isolation per workbench | ✓ Good — no provider pyramid |
| 3-layer history model (raw → ledger → canonical) | Mirrors established data lifecycle patterns | ✓ Good — bounded growth on all three data stores |
| Deferred promotion pattern (raw → ledger at TTL expiry) | Auto-promote during CleanupService daily sweep instead of real-time | ✓ Good — no race conditions with in-memory traceBuffer |
| 50-entry LEARNINGS.md cap with year-scoped archives | Active file stays fast to load; history preserved | ✓ Good — keeps agent-readable in single context load |

## Next Milestone Goals

**TBD** — run `/gsd:new-milestone` to define the next milestone.

Potential areas (deferred from v4.8):
- Search UI for ledger entries
- Bulk review/approval interface for ledger → canonical promotions
- Visualization of gate health score over time from ledger data
- Ledger real-time bridge (promote gate traces to ledger at checkpoint fire, not daily sweep)
- Frontend consumer for `GET /api/history/ledger`

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
*Last updated: 2026-04-11 after v4.8 milestone shipped — 13 phases, 74/74 requirements satisfied, shipped as "Agentic Personal OS"*
