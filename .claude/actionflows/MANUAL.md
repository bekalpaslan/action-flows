# ActionFlows Framework Manual

> Consolidated reference from all `.claude/actionflows/` docs.
> Source files: README.md, ORCHESTRATOR.md, CONTEXTS.md, FLOWS.md, ACTIONS.md, CONTRACT.md, GATE_STRUCTURE.md, LEARNINGS.md, LOGGING_STANDARDS_CATALOG.md, ORCHESTRATOR_OBSERVABILITY.md, project.config.md, ROUTING_METADATA.md, ROUTING_RULES.md

---

## Table of Contents

1. [What Is ActionFlows](#1-what-is-actionflows)
2. [Project Configuration](#2-project-configuration)
3. [Session-Start Protocol](#3-session-start-protocol)
4. [Core Rules & Philosophy](#4-core-rules--philosophy)
5. [Context Routing](#5-context-routing)
6. [Flow Registry](#6-flow-registry)
7. [Actions Registry](#7-actions-registry)
8. [Chain Compilation & Response Formats](#8-chain-compilation--response-formats)
9. [Gate Architecture](#9-gate-architecture)
10. [Contract & System Health](#10-contract--harmony)
11. [Observability](#11-observability)
12. [Routing Engine](#12-routing-engine)
13. [Logging Standards](#13-logging-standards)
14. [Learnings Registry](#14-learnings-registry)

---

## 1. What Is ActionFlows

ActionFlows is an orchestration framework for delegating work to specialized agents. It runs inside Claude Code (CLI) and optionally surfaces observability data to the ActionFlows Dashboard.

**The operational model:**
- **Code = Foundation**  --  The raw, mutable codebase that everything runs on.
- **Orchestrator = Brain** -- Coordinates agents, compiles chains, ensures system health.
- **Human = Will** -- Sets intention. The brain figures out how to execute it.
- **Agents = Hands** -- Specialized workers that execute within the codebase.

**Three audiences** the orchestrator detects and routes for:

| Audience | Indicators | Routing Style |
|----------|-----------|---------------|
| Coder | Mentions code, API, architecture, refactoring | Technical flows |
| Regular user | "I want to...", avoids jargon | High-level flows that hide complexity |
| Explorer | First-time, "what flows exist", curious | Suggest unused flows, surface learning |

**Directory structure:**
```
.claude/actionflows/
├── actions/           # Atomic building blocks (agent.md per action)
├── actions/_abstract/ # Reusable behavior patterns
├── flows/             # Predefined action sequences by context
├── checklists/        # Validation criteria
├── logs/              # Execution history
└── *.md               # This manual and registries
```

---

## 2. Project Configuration

**Source:** `project.config.md`

### Environment

| Mode | Behavior |
|------|----------|
| `cli` | Orchestrator skips health check. Lean and fast. Backend may run independently  --  still observes via ConversationWatcher. |
| `dashboard` | Orchestrator queries health at session start. Full interactive loop. |

**Current:** `cli`

### Tech Stack

**Backend:** TypeScript 5.3 · Express 4.18 · ws 8.14.2 · Zod 3.22 · ioredis 5.3 · chokidar 3.5 · Vitest 1.0
`packages/backend/src/index.ts` · Port 3001

**Frontend:** TypeScript 5.4 · React 18.2 · Vite 5 · Electron 28 · ReactFlow 11.10 · Monaco 0.45 · xterm 5.3
`packages/app/src/main.tsx` · Port 5173

**Shared:** TypeScript 5.3 · Branded strings (SessionId, ChainId, StepId, UserId) · ES modules
`packages/shared/src/index.ts`

**MCP Server:** Model Context Protocol 1.0 · `packages/mcp-server/src/index.ts`

**Hooks:** Claude Code hook scripts · `packages/hooks/`

### Domain Concepts

- **Session**  --  A user's orchestration session (branded `SessionId`)
- **Chain**  --  A sequence of steps within a session (branded `ChainId`)
- **Step**  --  An individual action within a chain (branded `StepId`)
- **Command**  --  Control instruction: pause, resume, cancel, retry, skip
- **Event**  --  State change broadcast via WebSocket

### Dev Commands

```bash
pnpm dev             # All dev servers
pnpm dev:backend     # Backend only (port 3001)
pnpm dev:app         # Frontend only (port 5173)
pnpm type-check      # TypeScript check
pnpm lint            # Linter
pnpm test            # Vitest
pnpm test:e2e        # E2E tests
pnpm build           # Build all packages
```

### Notifications

Slack · Channel: `#cityzen-dev` · Trigger: `chain-complete` · Action: `actions/notify/agent.md`

---

## 3. Session-Start Protocol

**Before responding to ANY human message**, execute in order:

0. Read `project.config.md`  --  load project-specific context
1. Read `CONTEXTS.md`  --  understand context routing
2. Read `FLOWS.md`  --  know what flows exist
3. Read `logs/INDEX.md`  --  check for similar past executions
4. Read `LEARNINGS.md`  --  check accumulated wisdom
   - Current request matches known issue pattern → consider suggested fix
   - LEARNINGS.md has entries for target context → understand lessons learned
   - Recent learnings (< 7 days) suggest flow bypass → note for routing decision
5. **Check system health** (dashboard mode only  --  skip if `environment: cli`)
   - `GET http://localhost:3001/api/harmony/health`
   - If unreachable → skip (non-blocking)
   - If `overall >= 80` → proceed normally
   - If `overall < 80` → surface to human: violations detected, suggest healing flow

This forces **routing mode** instead of help mode. You are a routing coordinator, not a general-purpose assistant.

**Frontend-agnostic:** Steps 0–4 are the core protocol (file reads). Step 5 is optional. A CLI-only session with no backend is a fully valid ActionFlows session.

---

## 4. Core Rules & Philosophy

### The Sin Test

Before EVERY action: "Am I about to produce content?"
- **YES** → It's a sin. Stop. Compile a chain. Spawn an agent.
- **NO** → Am I coordinating? (routing, compiling, registry edits, presenting plans)
  - **YES** → Proceed.
  - **NO** → Delegate it.

**"It's a sin"** from the human = reset command. Stop, acknowledge, recompile as chain.

### Quick Triage Mode (Rule 0)

All four must be true to act directly:

| Criteria | Quick Triage (do it yourself) | Full Chain (delegate) |
|----------|------------------------------|----------------------|
| Files affected | 1–3 files | 4+ files |
| Fix complexity | Obvious, mechanical | Requires analysis or design |
| Scope | Single package | Cross-package |
| Confidence | Know exactly what to change | Needs investigation |

If ANY column fails → compile a chain.

**Framework file threshold:**

| Criteria | Direct (registry edit) | Delegate (compile chain) |
|----------|----------------------|-------------------------|
| Lines changed | < 5 lines | 5+ lines |
| Files affected | 1 file | 2+ files |
| Nature | Add entry, fix number | Structural rewrite, content generation |

### Hard Rules

1. **Delegate Everything**  --  Don't read code, write code, or run tests above quick-triage threshold. Spawn agents.
2. **Post-Work Commit**  --  Every chain with file changes MUST end with `commit/`. Add registry line to `logs/INDEX.md` after commit.
3. **Post-Commit Verification**  --  Run `git status --porcelain | grep '^??'` after every commit. Warn on unexpected untracked files.
4. **Stay Lightweight**  --  Don't read large files or agent outputs (except during quick triage). Trust agents.
5. **Actions Are Building Blocks**  --  Each action has `agent.md` instructions. Point agents to their definition files.
6. **Fix Root Causes**  --  Stop → Diagnose → Root cause → Fix source → Document in LEARNINGS.md.
7. **Surface Agent Learnings**  --  Check every completion for learnings. Surface to human. Ask approval before fixing.
8. **Plan First, Execute Second**  --  Compile chain → present → approve → spawn. Parallel for independent steps, sequential for dependent.
9. **Framework-First Routing**  --  All work routes through ActionFlows. Never bypass with external instruction files or skills.

### Pre-Action Gate

Before ANY tool call, run this checklist:

**Gate 1: Registry Line Edit?**
- Adding/removing a single line in INDEX.md, FLOWS.md, ACTIONS.md, or LEARNINGS.md → Proceed directly
- Otherwise → Gate 2

**Gate 2: Have I Compiled a Chain?**
- Compiled chain + human approval → Proceed to spawn agents
- Otherwise → **STOP.** Compile a chain first.

**Gate 3: What Tool Am I About to Use?**
- Read/Grep/Glob → Why? Is there an analyze/ action for this?
- Edit/Write → STOP. This is implementation work. Back to Gate 2.
- Task spawn → Does it reference an agent.md in actionflows/actions/? If yes, proceed.

### File Reading Permissions

| File Type | Orchestrator CAN Read | Agent Reads |
|-----------|----------------------|-------------|
| actionflows/CONTEXTS.md | Yes (session start) | No |
| actionflows/FLOWS.md | Yes (routing) | No |
| actionflows/ACTIONS.md | Yes (dynamic chains) | No |
| actionflows/logs/INDEX.md | Yes (past executions) | No |
| actionflows/project.config.md | Yes (session start) | No |
| Project code (packages/**) | **NEVER** | Yes |
| Project docs | **NEVER** | Yes |
| Checklist files | **NEVER** | Yes |

### Post-Chain Completion Protocol (Mandatory)

After EVERY chain completes, execute IN ORDER:

1. **Gate 11  --  Completion Summary**  --  Present "Done:" table (Format #5) with all steps, statuses, results, log paths.
2. **Gate 12  --  Archive & Index**  --  Add execution entry to `logs/INDEX.md` (Format #9). Registry edit  --  do directly.
3. **Gate 13  --  Learning Surface**  --  Check ALL agent outputs for learnings. If any → add to `LEARNINGS.md`.
4. **Gate 14  --  Flow Candidate Detection**  --  If ad-hoc chain, evaluate reuse potential (clean compose, domain value, reuse likelihood, context fit, autonomy). If ALL met → suggest flow registration.
5. **Next-Step Anticipation**  --  Auto-compile follow-up chain.

Steps 1–3 are MANDATORY. Steps 4–5 are conditional.

### Proactive Coordination

- **Autonomous Follow-Through**  --  Once approved, execute entire chain without stopping between steps.
- **Step Boundary Evaluation**  --  After EVERY step, run six-trigger check: (1) Agent Output Signals, (2) Pattern Recognition, (3) Dependency Discovery, (4) Quality Threshold, (5) Chain Redesign Initiative, (6) Reuse Opportunity.
- **Contract Change Auto-Validation**  --  After any chain touching `CONTRACT.md`, `shared/src/contract/`, or `harmonyDetector.ts`, auto-compile: `validate/harmony → analyze/contract-coverage → review/harmony-audit`.

### Second Opinion Protocol

| Trigger | Second Opinion? |
|---------|----------------|
| After `review/` | Auto (always) |
| After `audit/` | Auto (always) |
| After `analyze/` or `plan/` | Opt-in (`secondOpinion: true`) |
| After `code/`, `test/`, `commit/` | Never |

Second opinion is informational and never blocks workflow. Commit waits for ORIGINAL action, not second-opinion.

---

## 5. Context Routing

**Source:** `CONTEXTS.md`

Request → Keyword Extraction → Context Scoring → Selection or Disambiguation

### Routable Contexts (7)

| Context | Purpose | Key Triggers | Flows |
|---------|---------|--------------|-------|
| **work** 🔨 | Active feature development | implement, build, create, add feature, develop | code-and-review/, post-completion/, contract-format-implementation/ |
| **settings** 🔧 | Config, system health, bug fixes, refactoring | configure, fix bug, refactor, optimize, system health | bug-triage/, code-and-review/, cleanup/, framework-health/ |
| **explore** 🔍 | Research, learning | explore, investigate, research, how does | doc-reorganization/, ideation/ |
| **review** 👁️ | Code reviews, audits | review, audit, check quality, security scan, design drift | audit-and-fix/, test-coverage/, e2e-playwright/, ui-design-audit/ |
| **settings** ⚙️ | Config, framework dev | configure, create flow, onboard me, flow drift | onboarding/, flow-creation/, action-creation/, framework-health/ |
| **pm** 📋 | Project management | plan, roadmap, what's next, priorities | planning/, learning-dissolution/ |
| **explore** 🕵️ | Code intelligence, dossiers | dossier, intel, monitor, track, analyze domain | intel-analysis/ |

### Auto-Target Contexts (not user-routed)

- **archive** 📦  --  Completed sessions move here automatically
- **harmony** ❤️  --  Populated by harmony detection system

### Manual-Only Context

- **editor** 📝  --  Full-screen code editing, never orchestrator-routed

### Routing Quick Reference

| Human Says | Context | Flow/Action |
|------------|---------|-------------|
| "implement X" / "add feature X" | work | code-and-review/ |
| "fix bug X" | settings | bug-triage/ |
| "refactor X" | settings | code-and-review/ |
| "clean up X" / "tidy up" | settings | cleanup/ |
| "audit security" | review | audit-and-fix/ |
| "review PR" / "check quality" | review | audit-and-fix/ |
| "run tests" |  --  | test/ (direct) |
| "analyze X" / "explore X" | explore | analyze/ (direct) |
| "create a new flow" | settings | flow-creation/ |
| "check framework health" | settings | framework-health/ |
| "onboard me" | settings | onboarding/ |
| "what's next" / "roadmap" | pm | planning/ |
| "implement format X.Y" / "contract parser" | work | contract-format-implementation/ |
| "run E2E tests" / "playwright" | review | e2e-playwright/ |
| "UI audit" / "design drift" | review | ui-design-audit/ |
| "audit flows" / "flow drift" | settings | flow-drift-audit/ |
| "I have an idea" / "brainstorm X" | explore | ideation/ |
| "create dossier" / "intel on X" | explore | intel-analysis/ |
| "dissolve learnings" / "update docs from learnings" | pm | learning-dissolution/ |

**Special Routing:** Contract format work (mentions "Format X.Y", `contract/`, "harmony parser") → always `contract-format-implementation/`. Single-step code chains prohibited for contract work.

---

## 6. Flow Registry

**Source:** `FLOWS.md`

### work

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review | code → review → second-opinion/ → (loop if needed) |
| post-completion/ | Wrap-up after work | commit → registry update |
| contract-format-implementation/ | Implement CONTRACT.md formats end-to-end | code/contract/parser → code/frontend/component → code/frontend/integration → review → commit |
| design-to-code/ | Convert Figma designs to React | figma-extract (orch) → plan → HUMAN GATE → code/frontend/ → figma-map (orch) → review |
| design-system-sync/ | Sync Figma tokens to frontend | figma-variables (orch) → analyze → plan → HUMAN GATE → code/frontend/ → figma-rules (orch) → review |

### settings

| Flow | Purpose | Chain |
|------|---------|-------|
| bug-triage/ | Structured bug fix | analyze → code → test → review → second-opinion/ |
| code-and-review/ | Refactor and review | code → review → second-opinion/ → (loop if needed) |
| cleanup/ | Human-directed cleanup | analyze → plan → human gate → code → review → second-opinion/ → commit |
| harmony-audit-and-fix/ | Remediate format drift | analyze/harmony-violation → code/(fix-parser OR update-orchestrator OR update-contract) → review/harmony-fix → second-opinion/ → commit |
| health-protocol/ | 7-phase immune response | analyze (detect) → analyze (classify) → isolate (conditional) → diagnose → human gate → healing flow → verify-healing → analyze (learn) |
| parser-update/ | Update backend parser | analyze/parser-gap → code/backend/parser → test/parser → review → second-opinion/ → commit |

### explore

| Flow | Purpose | Chain |
|------|---------|-------|
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review → second-opinion/ |
| ideation/ | Structured ideation | classify (human gate) → analyze → brainstorm → code (summary) |

### review

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → second-opinion/ → review → second-opinion/ |
| test-coverage/ | Coverage analysis | test → analyze → code (conditional) → review → second-opinion/ |
| backwards-harmony-audit/ | Audit contract harmony | analyze×3 (parallel) → audit → second-opinion/ |
| cli-integration-test/ | CLI integration tests | analyze → code → test → review → second-opinion/ |
| e2e-playwright/ | Playwright E2E tests | analyze → plan → HUMAN GATE → code → playwright-test (orch) → review |
| contract-index/ | Behavioral contract specs | analyze → plan → human gate → code×N → review → second-opinion/ → commit |
| contract-compliance-audit/ | Audit contract drift | analyze×2 (parallel) → plan → human gate → code×2 (parallel) → review → second-opinion/ → commit |
| ui-design-audit/ | Audit UI vs design | analyze → HUMAN GATE → (code/frontend/ → review → second-opinion/ → commit) |

### settings

| Flow | Purpose | Chain |
|------|---------|-------|
| onboarding/ | Interactive teaching | onboarding (single step, foreground) |
| flow-creation/ | Create a new flow | plan → human gate → code → review → second-opinion/ |
| action-creation/ | Create a new action | plan → human gate → code → review → second-opinion/ |
| action-deletion/ | Remove action safely | analyze → code → review → second-opinion/ |
| standards-creation/ | Create framework standards | analyze → code/framework → review → second-opinion/ → commit |
| framework-health/ | Validate structure | analyze |
| contract-drift-fix/ | Sync CONTRACT.md | analyze/contract-code-drift → code/update-contract → review/contract-update → second-opinion/ → commit |
| flow-drift-audit/ | Deep audit of flow instructions | analyze → plan → human gate → code×N → review → second-opinion/ → commit |

### explore (continued)

| Flow | Purpose | Chain |
|------|---------|-------|
| intel-analysis/ | Living code dossiers | analyze → plan → human gate → code → review → second-opinion/ → commit |

### pm

| Flow | Purpose | Chain |
|------|---------|-------|
| planning/ | Roadmap review + prioritization | analyze → plan → human gate → code → commit |
| learning-dissolution/ | Process learnings into doc updates | analyze → plan → human gate → code×N (parallel) → review → second-opinion/ → commit |

### Healing Flows Philosophy

Healing flows are **human-initiated** remediation chains triggered when health degrades.

1. Backend detects drift/violations
2. Frontend shows health degradation + recommendation
3. Human triggers ("Fix Now" or sends instruction)
4. Orchestrator routes to healing flow
5. Orchestrator compiles healing chain
6. Human approves
7. Healing executes
8. Health score rises, violations cleared

**Trigger when:** Health score < 90 · 3+ critical violations in 24h · Recommendations present · Human observes degraded behavior

---

## 7. Actions Registry

**Source:** `ACTIONS.md`

### Abstract Actions (behavior patterns, not agents)

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `_abstract/agent-standards/` | Core behavioral standards for ALL agents | All agents |
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `_abstract/log-ownership/` | Log path ownership principle | All agents |

### Generic Actions

| Action | Purpose | Model | Contract Output | Parallel Safe |
|--------|---------|-------|-----------------|---------------|
| analyze/ | Codebase analysis | sonnet | YES (5.2) | Yes |
| audit/ | Comprehensive audits | opus | NO | No |
| brainstorm/ | Interactive ideation | opus | YES (5.3) | Yes |
| code/ | Implement code (generic) | haiku | NO | Yes* |
| commit/ | Git commit + push | haiku | NO | No |
| diagnose/ | Root cause analysis | sonnet | YES (5.4) | Yes |
| docs-lookup/ | Query Context7 documentation | haiku | NO | Yes |
| isolate/ | Quarantine management | haiku | YES (5.6) | No |
| notify/ | Send Slack notifications | haiku | NO | Yes |
| onboarding/ | Interactive onboarding | opus | NO | Yes |
| plan/ | Implementation planning | sonnet | NO | Yes |
| review/ | Review anything | sonnet | YES (5.1) | No |
| test/ | Execute tests | haiku | NO | Yes |
| verify-healing/ | Post-healing validation | sonnet | YES (5.5) | Yes |

*code/ parallel safe with file exclusivity per batch

### Stack-Specific Code Actions (prefer over generic code/ when stack is known)

| Action | Stack | Model |
|--------|-------|-------|
| code/backend/ | Express 4.18 + TypeScript + Zod | haiku |
| code/frontend/ | React 18.2 + Vite 5 + Electron 28 | haiku |

### Stack-Specific Test Actions

| Action | Stack | Model |
|--------|-------|-------|
| test/playwright/ | Playwright E2E browser tests | sonnet |

### Code-Backed Actions (wrap existing packages)

| Action | Purpose | Package |
|--------|---------|---------|
| second-opinion/ | Independent critique of agent output | (direct sonnet action) |

### Orchestrator-Executed Actions (not spawned as agents)

| Action | Purpose | Method |
|--------|---------|--------|
| chrome-mcp-test | Browser E2E tests | Orchestrator uses Chrome DevTools MCP directly |

### Action Modes

| Action | Default Mode | Extended Mode |
|--------|-------------|---------------|
| review/ | review-only | review-and-fix |
| audit/ | audit-only | audit-and-remediate |
| analyze/ | analyze-only | analyze-and-correct |

### Model Override

All agents are Claude-backed (haiku, sonnet, opus) and spawned via the Task tool.

Activate: human says "use haiku for everything", "all agents on sonnet", etc.
Scope: **session-only**  --  never persists to ACTIONS.md
Reset: "reset models" / "default models"

### Spawning Pattern

The spawn prompt provides ONLY three things:
1. The agent.md read instruction (always first line)
2. The specific **inputs** for this execution (task, scope, context, files)
3. Project config injection (from `project.config.md`)

**NEVER** write ad-hoc step-by-step instructions that agent.md already provides. If agent.md is missing info → update agent.md, don't patch in spawn prompt.

```
Read your definition in .claude/actionflows/actions/{action}/agent.md
Then read .claude/actionflows/actions/_abstract/agent-standards/instructions.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read framework files meant for orchestration.
Do NOT delegate work, compile chains, or spawn subagents.

Input:
- task: {what to do}
- scope: {files, modules, or areas}
- context: {additional context}
```

---

## 8. Chain Compilation & Response Formats

**Source:** `ORCHESTRATOR.md`

### Format 1: Chain Compilation (presenting plan for approval)

```
## Chain: {Brief Title}

**Request:** {One-line human intent}
**Source:** {flow-name/ | Composed from: action1 + action2 | Meta-task}
**Execution:** {Sequential | Parallel: [1,2] -> [3] | Single step}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | input=value | -- | Pending |
| 2 | action/ | model | input=value | #1 | Pending |

**What each step does:**
1. **{Action}**  --  {What this agent does and produces}
2. **{Action}**  --  {What this agent does and produces}

Execute?
```

### Format 2: Execution Start

```
## Executing: {Brief Title}

Spawning Step {N}: {action/} ({model})...
```

### Format 3: Step Completion

```
>> Step {N} complete: {action/} -- {one-line result}. Continuing to Step {N+1}...
```

### Format 4: Chain Status Update

```
## Chain: {Brief Title} -- Updated

{What changed}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | ... | -- | Done |
| 2 | action/ | model | ... | #1 | Awaiting |

Continuing execution...
```

### Format 5: Execution Complete

```
## Done: {Brief Title}

| # | Action | Status | Result |
|---|--------|--------|--------|
| 1 | action/ | completed | {one-line outcome} |

**Logs:** `.claude/actionflows/logs/{YYYY-MM-DD_description}/`
**Learnings:** {Summary or "None"}
```

### Format 6: Learning Surface

```
## Agent Learning

**From:** {action/} ({model})
**Issue:** "{what happened}"
**Root cause:** "{why}"

**Suggested fix:** {proposed solution}

Implement?
```

### Format 7: Registry Update (only direct action)

```
## Registry Update: {Brief Title}

**File:** {registry file}
**Line:** {added/removed/updated}: "{the line}"

Done.
```

### Format 8: Error Announcement

```
## Error: {Error title}

**Step:** {step number}  --  {action/}
**Message:** {error message}
**Context:** {what was being attempted}

{Stack trace if available}

**Recovery options:**
- Retry step {N}
- Skip step {N}
- Cancel chain
```

### Format 9: INDEX.md Entry

```
| {YYYY-MM-DD} | {Description} | {Pattern} | {Outcome} |
```

Example: `| 2026-02-08 | Self-Evolving UI phases 1-4 | code×8 → review → second-opinion → commit | Success  --  18 files, APPROVED 92% (1d50f9e) |`

### Format 10: LEARNINGS.md Entry

```markdown
### {Action Type}

#### {Issue Title}

**Context:** {when this happens}
**Problem:** {what goes wrong}
**Root Cause:** {why it fails}
**Solution:** {how to prevent}
**Date:** {YYYY-MM-DD}
**Source:** {action/} in {chain description}
```

### Format 11: Human Gate Presentation (free-form)

Not standardized. Free-form prose tailored to the decision. Dashboard displays as read-only markdown. User responds with text.

---

## 9. Gate Architecture

**Source:** `GATE_STRUCTURE.md` · `ORCHESTRATOR_OBSERVABILITY.md`

**5 phases, 14 gates, 12 log points.**

```
REQUEST_RECEPTION → CHAIN_COMPILATION → CHAIN_EXECUTION → COMPLETION → POST_EXECUTION
    (Gates 1-3)         (Gates 4-6)        (Gates 7-10)    (Gates 11-12)  (Gates 13-14)
```

### Gate Index

| Gate | Name | Phase | Logged? | Validated By |
|------|------|-------|---------|--------------|
| 1 | Parse & Understand | Reception | No | Internal reasoning |
| 2 | Route to Context | Reception | Yes | gateCheckpoint.ts |
| 3 | Detect Special Work | Reception | Yes | gateCheckpoint.ts |
| 4 | Compile Chain | Compilation | Yes | gateCheckpoint.ts |
| 5 | Present Chain | Compilation | Implicit | Response format |
| 6 | Human Approval | Compilation | Yes | gateCheckpoint.ts |
| 7 | Execute Step | Execution | Yes | Agent logs |
| 8 | Step Completion | Execution | Implicit | Response format |
| 9 | Mid-Chain Evaluation | Execution | Yes | gateCheckpoint.ts |
| 10 | Auto-Trigger Detection | Execution | Partial | Response format |
| 11 | Chain Completion | Completion | Partial | Response format |
| 12 | Archive & Indexing | Completion | Yes | INDEX.md |
| 13 | Learning Surface | Post-Exec | Yes | gateCheckpoint.ts, LEARNINGS.md |
| 14 | Flow Candidate | Post-Exec | Partial | FLOWS.md |

### Trust Boundaries

| Level | Boundary | Validation |
|-------|----------|------------|
| T0 | User → Backend | Zod schemas, rate limiting |
| T1 | Orchestrator → Backend | Gate checkpoint validation |
| T2 | Backend → Frontend | TypeScript types, event schemas |
| T3 | Agent → Orchestrator | Agent output validation |

### Implementation

| Component | Location |
|-----------|----------|
| Checkpoint service | `packages/backend/src/services/gateCheckpoint.ts` |
| Gate trace types | `packages/shared/src/gateTrace.ts` |
| Gate log output | `.claude/actionflows/logs/` |
| System health detector | `packages/backend/src/services/harmonyDetector.ts` |

### GateTrace Schema

```typescript
interface GateTrace {
  gateId: GateId;           // "gate-01" through "gate-14"
  gateName: string;
  timestamp: string;        // ISO 8601
  chainId: ChainId;
  stepId?: StepId;
  traceLevel: GateTraceLevel;
  validationResult?: {
    passed: boolean;
    violations: string[];
    harmonyScore: number;   // 0-100
  };
  selected: string;
  rationale: string;
  confidence: "high" | "medium" | "low";
}
```

Storage: Redis · 7-day TTL · Key: `gate:{gateId}:{chainId}:{timestamp}`

### Immune System Layers (L023)

1. **Prevention** (Gates 1–6, agent standards) → Innate immunity  --  stops violations before they happen
2. **Detection** (Gates 7–11, harmony detector, health calculator) → Adaptive immunity  --  identifies violations in real-time
3. **Healing** (Gates 12–14, health-protocol, learning capture) → Immunological memory  --  fixes violations and prevents recurrence

---

## 10. Contract & System Health

**Source:** `CONTRACT.md`

**Version:** 1.0 · TypeScript definitions: `packages/shared/src/contract/`

**Golden Rule:** If the dashboard PARSES it → contract-defined (sacred). If the dashboard READS it → not contract-defined (evolve freely).

### Implementation Status

| State | Spec | Parser | Frontend | Score |
|-------|------|--------|----------|-------|
| Planned | ✓ | ❌ | ❌ | 0% |
| In Progress (Parser) | ✓ | ✓ | ❌ | 33% |
| In Progress (Frontend) | ✓ | ✓ | 🚧 | 66% |
| Complete | ✓ | ✓ | ✓ | 100% |

A format is COMPLETE only when all three layers are functional.

### Gate Checkpoint Format Map

| Format | Gate | Validation |
|--------|------|-----------|
| 1.1 Chain Compilation Table | Gate 4 | Parse table structure, validate step counts |
| 1.2 Chain Execution Start | Gate 7 | Parse step metadata, validate action paths |
| 2.1 Step Completion Announcement | Gate 6 | Parse completion, check 6-trigger signals |
| 3.2 Learning Surface Presentation | Gate 13 | Validate Issue/Root/Suggestion structure |
| 4.1 Registry Update | Gate 12 | Verify INDEX.md entry format |

### Contract Formats (Orchestrator Outputs)

**Category 1: Chain Management**

| Format | TypeScript Type | Parser | Pattern |
|--------|----------------|--------|---------|
| 1.1 Chain Compilation Table (P0) | ChainCompilationParsed | parseChainCompilation | `/^## Chain: (.+)$/m` |
| 1.2 Chain Execution Start (P3) | ExecutionStartParsed | parseExecutionStart | `/^Spawning Step (\d+): (.+) \((.+)\)$/m` |
| 1.3 Chain Status Update (P4) | ChainStatusUpdateParsed | parseChainStatusUpdate | `/^## Chain: (.+) -- Updated$/m` |
| 1.4 Execution Complete Summary (P4) | ExecutionCompleteParsed | parseExecutionComplete | `/^## Done: (.+)$/m` |

**Category 2: Step Lifecycle**

| Format | TypeScript Type | Parser | Pattern |
|--------|----------------|--------|---------|
| 2.1 Step Completion (P0) | StepCompletionParsed | parseStepCompletion | `/^>> Step (\d+) complete:/m` |
| 2.2 Dual Output (P2) | DualOutputParsed | parseDualOutput | `/^### Dual Output: (.+) \+ Second Opinion$/m` |
| 2.3 Second Opinion Skip (P4) | SecondOpinionSkipParsed | parseSecondOpinionSkip | `/^>> Step (\d+) complete: second-opinion\/ -- SKIPPED/m` |

**Category 3: Human Interaction**

| Format | TypeScript Type | Parser | Pattern |
|--------|----------------|--------|---------|
| 3.1 Human Gate Presentation (P5) | HumanGateParsed | parseHumanGate | `/### Step (\d+): HUMAN GATE/m` |
| 3.2 Learning Surface (P2) | LearningSurfaceParsed | parseLearningSurface | `/^## Agent Learning$/m` |
| 3.3 Session-Start Protocol Ack (P4) | SessionStartProtocolParsed | parseSessionStartProtocol | `/^## Session Started$/m` |

**Category 4: Registry & Metadata**

| Format | TypeScript Type | Parser | Pattern |
|--------|----------------|--------|---------|
| 4.1 Registry Update (P2) | RegistryUpdateParsed | parseRegistryUpdate | `/^## Registry Update: (.+)$/m` |
| 4.2 INDEX.md Entry (P3) | IndexEntryParsed | parseIndexEntry | `/^\| (\d{4}-\d{2}-\d{2}) \|/m` |
| 4.3 LEARNINGS.md Entry (P4) | LearningEntryParsed | parseLearningEntry | `/^### (.+)$/m` |

**Category 6: Error & Status**

| Format | TypeScript Type | Parser | Pattern |
|--------|----------------|--------|---------|
| 6.1 Error Announcement (P1) | ErrorAnnouncementParsed | parseErrorAnnouncement | `/^## Error: (.+)$/m` |
| 6.2 Department Routing (P5) | DepartmentRoutingParsed | parseDepartmentRouting | `/^## Routing: (.+)$/m` |

**Category 5: Agent Output Formats**

| Format | Producer | TypeScript Type |
|--------|---------|----------------|
| 5.1 Review Report | review/ | ReviewReportParsed |
| 5.2 Analysis Report | analyze/ | AnalysisReportParsed |
| 5.3 Brainstorm Transcript | brainstorm/ | BrainstormTranscriptParsed |
| 5.4 Diagnosis Report | diagnose/ | DiagnosisReportParsed |
| 5.5 Healing Verification Report | verify-healing/ | HealingVerificationParsed |
| 5.6 Quarantine Operations Report | isolate/ | QuarantineOperationsReportParsed |

### Contract Alignment Verification Gate

Before committing ANY contract change, verify 4-layer alignment for ALL modified fields:

- [ ] **Layer 1 (Spec):** Field in CONTRACT.md with correct type/nullability
- [ ] **Layer 2 (Type):** Field in TypeScript type definition (`packages/shared/src/contract/types/`)
- [ ] **Layer 3 (Schema):** Field in Zod schema (`packages/shared/src/contract/validation/schemas.ts`)
- [ ] **Layer 4 (Parser):** Field extracted by parser (`packages/shared/src/contract/parsers/`)
- [ ] **Layer 5 (Pattern):** Regex pattern exists if applicable
- [ ] Run `pnpm run contract:validate`  --  exit 0 required

### Contract Evolution

Adding/modifying formats MUST follow the contract evolution process in CONTRACT.md. Breaking changes increment `CONTRACT_VERSION` with 90-day dual support.

```bash
pnpm run harmony:check    # Validate contract alignment
pnpm run contract:validate # Full 4-layer check
```

---

## 11. Observability

**Source:** `ORCHESTRATOR_OBSERVABILITY.md`

### Data Flow

```
Orchestrator outputs Format X.Y → ConversationWatcher (tails .jsonl) →
Backend Gate Checkpoint → Parse → Validate → GateTrace (Redis, 7d TTL) →
WebSocket broadcast → Frontend GateTraceViewer
```

### System Health Detection Flow

```
Orchestrator Output
        ↓
Gate Checkpoint (gateCheckpoint.ts)
        ↓
    ┌───┴───┐
  valid   violation
    │         ↓
    │   HarmonyDetector (record + emit)
    │         ↓
    │   System Health (score update)
    └────┬────┘
         ↓
    GateTrace (stored, Redis 7d TTL)
```

**System health states:**
- ✅ Healthy (100)  --  All features work
- ⚠️ Degraded (60–99)  --  Partial parse
- ❌ Unhealthy (< 60)  --  Graceful degradation

Graceful degradation means backend logs violations but does NOT block execution  --  creates a signal in the Settings workbench (system health view).

**Runtime health vs design-time alignment (L027):** `/api/harmony/health` measures parsing success rate. Design-time score measures spec-type-schema-parser agreement at field level. Both must be 100% for true system health alignment.

---

## 12. Routing Engine

**Sources:** `ROUTING_RULES.md` · `ROUTING_METADATA.md`

### Routing Algorithm (Gate 4)

```
score = (keyword_match * 0.5) + (scope_match * 0.3) + (input_match * 0.2)
score = score * (priority / 100)
Final ranking: Sort by (score DESC, routing_priority DESC)
```

Confidence thresholds gate routing when score falls below:
- **high** → 0.8+ (actions: audit/, code/*, test/*, plan/, verify-healing/)
- **medium** → 0.5+ (actions: analyze/, commit/, review/)
- **low** → 0.0+ (actions: brainstorm/, onboarding/, second-opinion/)

### Routing Rules

| Rule | Priority | Context | Keywords | Action |
|------|----------|---------|----------|--------|
| RR001 | 95 | review | security, CVE, auth, injection, xss | audit/ |
| RR002 | 90 | review, explore | performance, optimization, bottleneck | analyze/ |
| RR003 | 88 | explore, review, settings | architecture, refactor, structure, pattern | analyze/ |
| RR004 | 85 | settings, work | bug, fix, error, crash, exception | code/backend/ |
| RR005 | 85 | work, settings | implement, build, feature, component (frontend scope) | code/frontend/ |
| RR006 | 80 | work, settings | test, coverage, unit, integration, playwright | test/ |
| RR007 | 82 | work, explore | brainstorm, ideate, concept, possibility | brainstorm/ |
| RR008 | 75 | work | plan, design, architecture, approach | plan/ |
| RR009 | 78 | review, settings | audit, comprehensive, scan, health, status | audit/ |
| RR010 | 40 | settings | (fallback, no keywords) | analyze/ |

### Action Routing Priorities

| Action | Routing Priority | Context Affinity |
|--------|-----------------|-----------------|
| audit/ | 85 | review, settings |
| code/backend/, code/frontend/ | 85 | work, settings |
| test/playwright/ | 80 | work, maintenance, review |
| code/ | 80 | work, settings |
| analyze/ | 70 | explore, review, settings |
| test/ | 70 | work, maintenance, review |
| review/, plan/, diagnose/ | 75 | context-specific |
| commit/ | 50 | work, settings |
| second-opinion/ | 50 | review, explore |
| isolate/ | 60 | review, settings |
| brainstorm/ | 65 | work, explore |
| onboarding/ | 35 | explore, settings |

### Parallel Safety

**Parallel safe:** analyze/, brainstorm/, code/*, test/*, diagnose/, second-opinion/, verify-healing/
**Sequential (must run alone):** review/, commit/, isolate/
**Caveat for code/*:** File exclusivity required  --  no two code/ agents work on same file.

---

## 13. Logging Standards

**Source:** `LOGGING_STANDARDS_CATALOG.md`

### Log Output Structure

```
.claude/actionflows/logs/
├── [action-type]/
│   └── [session-name]_[timestamp]/
│       ├── report.md              # Main output
│       └── logs/                  # Optional, DEBUG+ level
│           ├── orchestrator-decisions.log
│           ├── tool-usage.log
│           ├── agent-reasoning.log
│           └── data-flow.log
```

### Where Standards Live

| Topic | Location |
|-------|----------|
| Log levels (TRACE/DEBUG/INFO/WARN/ERROR) | `actions/_abstract/agent-standards/instructions.md` § Trace Standards |
| Universal log types | `actions/_abstract/agent-standards/instructions.md` § Trace Standards |
| analyze/ logging | `actions/analyze/agent.md` § Logging Requirements |
| code/ logging | `actions/code/agent.md` § Logging Requirements |
| review/ logging | `actions/review/agent.md` § Logging Requirements |
| plan/ logging | `actions/plan/agent.md` § Logging Requirements |
| audit/ logging | `actions/audit/agent.md` § Logging Requirements |
| commit/ logging | `actions/commit/agent.md` § Logging Requirements |
| Gate checkpoint specs | `packages/backend/src/services/gateCheckpoint.ts` (JSDoc) |

---

## 14. Learnings Registry

**Source:** `LEARNINGS.md`  --  28 entries (L001–L028)

### Open / In-Progress

| ID | Issue | Status |
|----|-------|--------|
| L024 | Output Protection ≠ Input Protection  --  agent.md files have no checksum/integrity verification for spawn integrity. agentIntegrityService.ts created (SHA-256 checksums) but items 2–4 remain open. | Partially addressed |
| L026 | Health Protocol reveals infrastructure decay (pnpm version, orphan flows, gate coverage gaps, input protection)  --  healing applied, pending commit+restart verification. | Open |
| L027 | Runtime health ≠ design-time alignment  --  runtime measures parsing success; alignment measures spec-type-schema-parser agreement at field level. | Open (insight logged, no code change yet) |

### Closed Learnings  --  Key Patterns

**Agent & Code Quality**
- **L002**  --  Deferred fields: use explicit `// TODO:` comments at each hardcoded fallback site
- **L007 / Code Agent Selector Naming Drift**  --  Pass EXACT CSS class names/selectors as explicit inputs to code agents; don't rely on inference
- **L008 / Flat file on Windows**  --  Use `_abstract/create-log-folder/` before writing; ensures directory tree exists
- **L014 / Contract Restructuring**  --  After migrating content to new contract sections, always do a deduplication verification pass
- **L015 / Requirements vs Type Definitions**  --  For cross-layer features, always read shared types first to verify actual entities
- **L028 / "X wins over Y" ambiguity**  --  Phrase conflict resolution as explicit edit directives: "Update FILE_A to match FILE_B", not "B wins"

**Testing & E2E**
- **L004 / Chrome MCP Profile Lock**  --  Close all Chrome instances before Chrome MCP tests; single profile directory, no isolation
- **L005 / Chat messages are frontend-only**  --  `GET /api/sessions/:id/chat` returns empty; UI messages are React state, not persisted
- **L006 / New sessions appear in RECENT**  --  Session status: `pending` → RECENT, `in_progress` → ACTIVE
- **L009 / CRLF breaks multiline regex**  --  Add `.gitattributes` with `*.contract.md text eol=lf` for any regex-parsed files on Windows

**Framework Architecture**
- **L003 / Bundled commits**  --  Use `feat:` prefix for primary feature; separate infrastructure fixes or list as secondary bullets
- **L010 / Stale manifests**  --  Validate all referenced file paths exist before dispatching batch agents
- **L011 / Parallel batch collisions**  --  Ensure file-level exclusivity across all parallel batches; deduplicate at manifest level before dispatch
- **L012 / Orphan flows**  --  When registering a flow, always immediately create the `instructions.md` file or queue a flow-creation chain
- **L013 / Post-chain gates skipped**  --  Gates 11–14 are MANDATORY post-chain; added prescriptive checklist to ORCHESTRATOR.md
- **L016 / Severity consistency**  --  Clarify CRITICAL/HIGH/MEDIUM/LOW upfront in review prompts; defined in `actions/review/agent.md`
- **L017 / Composite Feature Flags**  --  `const isActive = globalFlag && localToggle` pattern; backend global + localStorage local
- **L018 / ResilientStorage wrapper**  --  When adding optional interface methods, always update: interface → implementations → **ResilientStorage proxy**
- **L019 / Hook scripts not wired**  --  Hook implementation = write source + build + **register in settings.json** + verify fires. All 4 required.
- **L020 / afw-input-inject requires active session**  --  Re-enable only when dashboard actively manages sessions; currently unwired
- **L021 / Field-level contract review**  --  Field-level tracing across all 4 layers (spec → type → schema → parser) required; file-level review misses gaps
- **L022 / False deployment blockers**  --  Verify deployment paths (tsx, esbuild) before marking compilation errors as blockers
- **L023 / Immune system 3-layer model**  --  Prevention (Gates 1–6) · Detection (Gates 7–11) · Healing (Gates 12–14)
- **L025 / Type-to-schema drift**  --  StatusString enum split (`in_progress` vs `running`) across layers; add `AssertEqual<T,U>` build-step assertions

---

## Quick Reference Card

```
REQUEST ARRIVES
      ↓
Read session-start files (CONTEXTS → FLOWS → INDEX → LEARNINGS)
      ↓
Identify audience (Coder / Regular User / Explorer)
      ↓
Quick Triage? (1-3 files, obvious, single pkg, know exactly what to change)
    YES → Fix directly, commit via commit/, note [QUICK TRIAGE]
    NO  ↓
Route to Context (CONTEXTS.md)
      ↓
Find Flow (FLOWS.md) or Compose from ACTIONS.md
      ↓
Compile Chain → Present to Human
      ↓
Human approves → Spawn agents autonomously
      ↓
Step Boundary Evaluation after each step (6-trigger check)
      ↓
Chain complete → Gate 11 summary → Gate 12 INDEX.md → Gate 13 LEARNINGS.md → Gate 14 flow candidate
      ↓
Auto-compile follow-up chain
```

---

*Last consolidated: 2026-02-22*
*Source docs: 13 files in `.claude/actionflows/`*
