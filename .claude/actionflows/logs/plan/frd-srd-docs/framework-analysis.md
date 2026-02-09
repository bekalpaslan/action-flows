# ActionFlows Framework: Deep Philosophy & Architecture Analysis

> **Analysis Date:** 2026-02-08
> **Purpose:** Document framework philosophy, architecture, and constraints for FRD/SRD documentation
> **Scope:** .claude/actionflows/ (all orchestrator, organizational, flow, and action definitions)

---

## Executive Summary

ActionFlows is a **strict delegation-based orchestration framework** that enforces separation between coordination and execution. The orchestrator compiles chains of work, agents execute them. This report documents the core philosophy, organizational structure, action/flow architecture, and how these constraints shape the ActionFlows Dashboard development process.

**Key Philosophical Principles:**
1. **It's a Sin** — Orchestrator produces zero content; agents produce everything
2. **Delegation Everything** — Work routing through department → flow → action chain
3. **Actions are Building Blocks** — Atomic, reusable, composable units
4. **Fix Root Causes** — Stop, diagnose, fix source, document learnings
5. **Plan First, Execute Second** — Compile chain → present → approve → spawn

---

## Part 1: Core Philosophy

### 1.1 The Foundational Truth: "It's a Sin"

The entire framework rests on a single axiom:

> **If you are producing content instead of compiling a chain, you are sinning.**

This is not hyperbole. The framework treats orchestrator content-production as a **boundary violation**. The orchestrator's hands are for **coordination**, agents' hands are for **creation**.

**The Sin Test (applied before EVERY action):**
```
Am I about to produce content? (write, analyze, review, code, rewrite, document)
    |
YES -> It's a sin. Stop. Compile a chain. Spawn an agent.
NO  -> Am I coordinating? (routing, compiling chain, updating registry line, presenting plan)
    |
YES -> Proceed. This is your job.
NO  -> What am I doing? Ask yourself. Then delegate it.
```

**Human Override:** When the human says "it's a sin", it's a reset command. The orchestrator must stop, acknowledge, recompile as a chain, and execute properly.

**Objection Protocol:** The orchestrator can object if it believes an action is CLEARLY within permitted boundaries (citing specific rules with evidence). But if there's ANY doubt, it IS a sin.

### 1.2 Delegation Architecture

The framework enforces **layered delegation**:

1. **Human** → Makes requests in natural language
2. **Orchestrator** → Reads registries (ORGANIZATION.md → FLOWS.md → ACTIONS.md) → Compiles chain → Presents for approval
3. **Agents** → Execute their agent.md instructions → Report results

**Orchestrator Permissions:**
- ✅ Read framework files (ORGANIZATION.md, FLOWS.md, ACTIONS.md, logs/INDEX.md, project.config.md)
- ✅ Registry line edits (add/remove single lines in INDEX.md, FLOWS.md, ACTIONS.md, LEARNINGS.md)
- ✅ Quick triage fixes (1-3 files, obvious mechanical changes, single-package scope)
- ❌ Read project code files (packages/**)
- ❌ Read project docs
- ❌ Implement features
- ❌ Review code
- ❌ Run tests

**Agent Permissions:**
- ✅ Read project code files
- ✅ Read project docs
- ✅ Implement features
- ✅ Review code
- ✅ Run tests
- ❌ Read ORCHESTRATOR.md
- ❌ Delegate work
- ❌ Compile chains

### 1.3 Quick Triage Mode (Solo Developer Override)

The framework acknowledges solo development needs and provides a **bounded escape hatch**:

| Criteria | Quick Triage (do it yourself) | Full Chain (delegate) |
|----------|------------------------------|----------------------|
| Files affected | 1-3 files | 4+ files |
| Fix complexity | Obvious, mechanical | Requires analysis or design |
| Scope | Single package | Cross-package |
| Confidence | You know exactly what to change | Needs investigation |

**Rules:**
- If ALL columns land in "Quick Triage": Orchestrator MAY read project code and implement fixes directly
- If ANY column lands in "Full Chain": Proceed to full delegation
- Commits MUST still go through commit/ action (not direct git calls)
- MUST note `[QUICK TRIAGE]` in response so human knows delegation was bypassed

**Why this exists:** For trivial single-file typo fixes, spawning 5 agents is excessive overhead. This acknowledges pragmatism while maintaining boundaries.

### 1.4 Meta-Task Size Threshold (Framework Files)

For framework file edits, the delegation threshold is:

| Criteria | Direct (registry edit) | Delegate (compile chain) |
|----------|----------------------|-------------------------|
| Lines changed | < 5 lines | 5+ lines |
| Files affected | 1 file | 2+ files |
| Nature | Add entry, update count | Structural rewrite, content generation |
| Judgment needed | Mechanical (add line, fix number) | Creative (write content, restructure) |

If ANY column lands in "Delegate" → compile a chain.

### 1.5 The Pre-Action Gate

Before the orchestrator makes ANY tool call, it mentally executes this checklist:

**Gate 1: Registry Line Edit?**
- Is this adding/removing a single line in INDEX.md, FLOWS.md, ACTIONS.md, or LEARNINGS.md?
  - YES → Proceed directly
  - NO → Continue to Gate 2

**Gate 2: Have I Compiled a Chain?**
- Have I compiled an explicit chain of actions for this work?
- Have I presented this chain to the human for approval?
  - YES → Proceed to spawn agents per the chain
  - NO → STOP. You are about to violate boundaries.

**Gate 3: What Tool Am I About to Use?**
- Read/Grep/Glob → Why? This is discovery work. Is there an analyze/ action for this?
- Edit/Write → STOP. This is implementation work. Compile a chain.
- Task spawn → Does it reference an agent.md in actionflows/actions/? If yes, proceed. If no, what are you doing?

If the orchestrator reaches Gate 3 about to use Edit/Write directly, it has already failed. Go back to Gate 2.

---

## Part 2: Organizational Structure

### 2.1 Department Model

The framework uses a **three-department model** to route work:

| Department | Owns | Key Flows | Triggers |
|-----------|------|-----------|----------|
| **Framework** | ActionFlows framework maintenance | flow-creation/, action-creation/, action-deletion/, framework-health/ | "create a new flow", "create a new action", "check framework health" |
| **Engineering** | Code implementation, reviews, bug fixes, refactoring | code-and-review/, bug-triage/, post-completion/ | "implement", "add feature", "fix bug", "refactor" |
| **QA** | Audits, quality sweeps, security scans | audit-and-fix/ | "audit", "security scan", "quality check" |

### 2.2 Routing Flow

```
Human Request
    ↓
Orchestrator reads ORGANIZATION.md → Identify department
    ↓
Orchestrator reads FLOWS.md → Find matching flow in department
    ↓
Flow exists?
    YES → Use flow's predefined chain
    NO → Read ACTIONS.md → Compose dynamic chain from actions
    ↓
Compile chain → Present to human → Approve → Spawn agents
```

### 2.3 Routing Guide

| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" / "add feature X" | Engineering | code-and-review/ |
| "fix bug X" / "X is broken" | Engineering | bug-triage/ |
| "refactor X" | Engineering | code-and-review/ |
| "audit security" / "security scan" | QA | audit-and-fix/ |
| "audit architecture" / "check performance" | QA | audit-and-fix/ |
| "run tests" | — | test/ (direct action) |
| "analyze coverage" / "check dependencies" | — | analyze/ (direct action) |
| "create a new flow" | Framework | flow-creation/ |
| "create a new action" | Framework | action-creation/ |
| "check framework health" | Framework | framework-health/ |
| "plan X" | — | plan/ (direct action) |

---

## Part 3: Action/Flow Architecture

### 3.1 Three Types of Actions

The framework defines three tiers of reusable components:

#### 3.1.1 Abstract Actions (Instructed Behaviors)

Abstract actions are **reusable behavior patterns** that don't have agents — just instructions that define "how we do things."

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `_abstract/agent-standards/` | Core behavioral standards for all agents | All agents |
| `_abstract/post-completion/` | Post-implementation workflow (commit, registry update) | Orchestrator (post-completion flow) |
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `_abstract/update-queue/` | Queue.md status updates | code, review |

**How they work:** Agents are instructed to "extend" abstract actions by reading their instructions.md files and following the patterns defined there.

Example from code/agent.md:
```
## Extends

This agent follows these abstract action standards:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` — Datetime log folder for outputs
**When you need to:**
- Follow behavioral standards → Read: `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Create log folder → Read: `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`
```

#### 3.1.2 Generic Actions (Atomic Verbs)

These are atomic, stack-agnostic actions. They know HOW to do their job, but need WHAT to work on.

| Action | Purpose | Requires Input? | Required Inputs | Model |
|--------|---------|-----------------|-----------------|-------|
| code/ | Implement code changes (generic) | YES | task, context | haiku |
| review/ | Review anything | YES | scope, type | sonnet |
| audit/ | Comprehensive audits | YES | type, scope | opus |
| test/ | Execute tests | YES | scope, type | haiku |
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet |
| plan/ | Implementation planning | YES | requirements, context | sonnet |
| commit/ | Git commit + push | YES | summary, files | haiku |

#### 3.1.3 Stack-Specific Code Actions

**Prefer these over generic `code/` when the target stack is known.**

| Action | Stack | Required Inputs | Model |
|--------|-------|-----------------|-------|
| `code/backend/` | Express 4.18 + TypeScript + Zod | task, context | haiku |
| `code/frontend/` | React 18.2 + Vite 5 + Electron 28 | task, context | haiku |

**Why stack-specific actions exist:** They embed stack-specific patterns, validation rules, and architectural constraints directly into the agent definition. This reduces error rates and improves consistency.

### 3.2 Action Modes (Assess + Fix)

Actions like review/, audit/, and analyze/ support a `mode` input that controls behavior:

| Action | Default Mode | Extended Mode | Behavior |
|--------|-------------|---------------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs, doc errors |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH findings |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift, mismatches |

**Use extended mode when:** Fixes are straightforward and don't require architecture decisions. This reduces chain length (no separate fix step needed).

**Don't use extended mode when:** Fixes require design decisions, API contract changes, or architecture modifications.

### 3.3 Model Selection Guidelines

The framework prescribes model selection based on task complexity:

| Action Type | Model | Why |
|-------------|-------|-----|
| code, code/backend, code/frontend, test, commit | haiku | Fast, simple execution |
| review, analyze, plan | sonnet | Needs judgment |
| audit | opus | Deep analysis needed |

### 3.4 Agent Standards (Core Behavioral Principles)

All agents follow 11 core principles defined in `_abstract/agent-standards/instructions.md`:

1. **Single Responsibility** — One clear mission per agent
2. **Token Efficiency** — Grep before Read, skip files that pass validation, summarize in tables
3. **Fresh Eye Discovery** — Notice issues outside explicit instructions, tag with `[FRESH EYE]`
4. **Parallel Safety** — Each parallel agent writes to its OWN file
5. **Verify, Don't Assume** — Never trust filenames, always check contents
6. **Explicit Over Implicit** — Use concrete file paths, not relative references
7. **Output Boundaries** — Assessment actions write to logs/, implementation actions write to project directories
8. **Graceful Degradation** — Step fails: continue with remaining, report failures
9. **Identity Boundary** — You are a task executor, not an orchestrator. Never read ORCHESTRATOR.md. Never route, delegate, or compile chains.
10. **Pre-Completion Validation** — Validate all output files exist and are non-empty before completing
11. **Output Boundary** — Never write outside your designated output location

**Learnings Output Format:** Every agent MUST include:
```
## Learnings
**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}
[FRESH EYE] {Discovery if any}
Or: None — execution proceeded as expected.
```

### 3.5 Flows (Predefined Action Sequences)

Flows are **department-organized, predefined chains** for recurring patterns.

#### Framework Department Flows

| Flow | Purpose | Chain |
|------|---------|-------|
| flow-creation/ | Create a new flow | plan → human gate → code → review |
| action-creation/ | Create a new action | plan → human gate → code → review |
| action-deletion/ | Remove action safely | analyze → code → review |
| framework-health/ | Validate structure | analyze |
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |

#### Engineering Department Flows

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → (loop if needed) |
| bug-triage/ | Structured bug fix | analyze → code → test → review |
| post-completion/ | Wrap-up after work | commit → registry update |

#### QA Department Flows

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → review |

### 3.6 Spawning Pattern

The orchestrator spawns agents using this standardized pattern:

```python
Task(
  subagent_type="general-purpose",
  model="{from action's instructions.md}",
  run_in_background=True,
  prompt="""
Read your definition in .claude/actionflows/actions/{action}/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- {key}: {value}
"""
)
```

**Config Injection Rule:** ALWAYS inject relevant project config into agent prompts. Read `project.config.md` at session start and inject relevant sections into each agent prompt.

---

## Part 4: How Framework Philosophy Constrains Dashboard Development

### 4.1 Orchestrator Session-Start Protocol

**The FIRST thing the orchestrator does in every session, before responding to the human:**

0. **Read** `.claude/actionflows/project.config.md` — Load project-specific context
1. **Read** `.claude/actionflows/ORGANIZATION.md` — Understand department routing
2. **Read** `.claude/actionflows/FLOWS.md` — Know what flows exist
3. **Read** `.claude/actionflows/logs/INDEX.md` — Check for similar past executions

This forces the orchestrator into **routing mode** instead of **help mode**.

**The orchestrator is NOT a general-purpose assistant. It is a routing coordinator.**

### 4.2 Session-Start Anti-Patterns

**WRONG — Help Mode:**
```
Human: Fix the login bug
Orchestrator: "What would you like me to do?"
```

**WRONG — Reading Code:**
```
Human: Fix the login bug
Orchestrator: [reads auth.py] "I see the issue..."
```

**CORRECT:**
```
Human: Fix the login bug
Orchestrator: [reads ORGANIZATION.md → Engineering, FLOWS.md → bug-triage/]
Orchestrator: [compiles chain: analyze → code → test → review → post-completion]
Orchestrator: [presents chain for approval]
```

### 4.3 Request Reception Protocol

When receiving ANY request:

**Step 1: Identify What Arrived**
- Checklist path? → Read the checklist itself ONLY
- User prose request? → Parse the intent
- Framework file? → Understand what it asks

**Step 2: Parse Without Reading Project Files**
1. What work is this asking for?
2. What's the scope?
3. What outputs does it expect?

**DO NOT read project code files.** That's agent work.

**Step 3: Route to Department**
Open ORGANIZATION.md, match request type to department.

**Step 4: Find the Flow**
Open FLOWS.md, look for flows in the identified department.

**Step 5: Compile and Present Chain**
Build an explicit chain. Present to human.

### 4.4 Proactive Coordination Initiative

Once the human approves a chain, execute the entire chain **without stopping for approval between steps**.

**Step completion format (informational, NOT approval checkpoint):**
```
>> Step {N} complete: {action/} -- {one-line result}. Continuing to Step {N+1}...
```

#### Next-Step Anticipation
After a chain completes, analyze what logically comes next and auto-compile the follow-up chain.

#### Preemptive Chain Recompilation
When mid-chain signals indicate the plan needs adjustment, recompile remaining steps without waiting.

#### Step Boundary Evaluation
After EVERY step completion, run the six-trigger evaluation:
1. Agent Output Signals
2. Pattern Recognition
3. Dependency Discovery
4. Quality Threshold
5. Chain Redesign Initiative
6. Reuse Opportunity

If any trigger fires and it's within original scope, recompile and announce. If it expands scope, STOP and present to human.

### 4.5 Learning Surface & Root Cause Fixing

**Rule 4:** Fix Root Causes, Not Symptoms

When something fails: Stop → Diagnose → Root cause → Fix source → Document in LEARNINGS.md

**Rule 5:** Surface Agent Learnings to Human

Check for learnings in every completion. Surface to human. Ask approval before fixing.

### 4.6 Compose First, Propose Later

**Rule 8:** No flow matches? Compose from existing actions. Propose new flow only if pattern recurs 2+ times.

**Why:** Prevents flow registry bloat. Flows should capture RECURRING patterns, not every unique request.

### 4.7 Framework-First Routing

**Rule 11:** All work routes through ActionFlows. Never bypass with external instruction files or skills.

**Why:** Maintains execution history (INDEX.md), enforces delegation boundaries, prevents framework drift.

---

## Part 5: Framework Improvement Areas & Missing Capabilities

### 5.1 Identified Gaps

Based on the current framework structure and learnings registry, the following gaps exist:

#### 5.1.1 No Automated Testing Flow
- **Gap:** No flow for "write tests for X" or "improve test coverage"
- **Current workaround:** Compose: analyze/coverage → code/backend → test/ → review/
- **Improvement:** Create `test-coverage-improvement/` flow in Engineering department

#### 5.1.2 No Database Migration Flow
- **Gap:** No flow for storage schema changes (Redis keys, data structures)
- **Current workaround:** Compose: analyze/storage → plan/ → code/backend → test/ → review/
- **Improvement:** Create `storage-migration/` flow in Engineering department

#### 5.1.3 No Performance Optimization Flow
- **Gap:** No flow for "optimize performance of X"
- **Current workaround:** Compose: audit/performance → analyze/bottlenecks → code/ → test/ → review/
- **Improvement:** Create `performance-optimization/` flow in QA or Engineering department

#### 5.1.4 No Cross-Package Refactoring Flow
- **Gap:** No flow for "move functionality from package A to package B"
- **Current workaround:** Compose: analyze/dependencies → plan/ → code/shared → code/backend → code/frontend → test/ → review/
- **Improvement:** Create `cross-package-refactor/` flow in Engineering department

#### 5.1.5 Limited Action Mode Documentation
- **Gap:** Action modes (review-only vs review-and-fix) exist but decision criteria not documented
- **Improvement:** Add decision matrix to ACTIONS.md: when to use each mode

#### 5.1.6 No Rollback Flow
- **Gap:** No flow for "rollback the last change" or "undo commit X"
- **Current workaround:** Manual git revert + manual registry update
- **Improvement:** Create `rollback/` action and `change-rollback/` flow in Engineering department

### 5.2 Philosophical Inconsistencies

#### 5.2.1 Quick Triage Mode vs "It's a Sin"
- **Inconsistency:** Quick triage mode allows orchestrator to read project code and implement fixes, violating "it's a sin"
- **Justification:** Solo developer pragmatism — spawning 5 agents for a single-line typo is excessive
- **Resolution:** Explicitly documented as "bounded escape hatch" with clear criteria. NOT a loophole for avoiding delegation.

#### 5.2.2 Registry Line Edits vs "Delegate Everything"
- **Inconsistency:** Orchestrator can directly edit registry files (INDEX.md, FLOWS.md, etc.), but all other file edits require delegation
- **Justification:** Registry updates are **coordination work**, not **content production**. Adding a line to INDEX.md is recording execution history, not implementing features.
- **Resolution:** Documented as explicit exception with thresholds (< 5 lines, mechanical changes only).

### 5.3 Missing Meta-Capabilities

#### 5.3.1 No Self-Optimization Flow
- **Gap:** No flow for "improve the ActionFlows framework itself"
- **Current state:** Framework changes go through framework-health/ → compose actions manually
- **Improvement:** Create `framework-optimization/` flow with: analyze/framework → plan/ → code/ → review/ → update LEARNINGS.md

#### 5.3.2 No Execution Analytics
- **Gap:** INDEX.md tracks executions, but no flow for "analyze past execution patterns"
- **Improvement:** Create `execution-analytics/` flow: analyze/logs → generate insights → suggest flow creation

#### 5.3.3 No Checklist Creation Flow
- **Gap:** Checklists exist (`checklists/` directory), but no flow for creating new ones
- **Improvement:** Create `checklist-creation/` flow in Framework department

---

## Part 6: How Framework Philosophy Should Influence FRD/SRD Structure

### 6.1 Document Organization Principles

The ActionFlows framework's philosophy suggests the following structure for FRD/SRD documentation:

#### 6.1.1 Separation of Concerns (Orchestrator vs Agent Perspective)

**FRD should split into two perspectives:**

1. **Human-Facing Requirements (What to Build)**
   - User stories, use cases, acceptance criteria
   - Domain concepts (Session, Chain, Step, User, Command, Event)
   - UI/UX requirements

2. **Orchestrator-Facing Requirements (How to Route)**
   - Department mapping for each requirement type
   - Flow identification or action composition
   - Dependency chains between requirements

**SRD should split into three layers:**

1. **Orchestrator-Level Design (Routing & Coordination)**
   - Department/flow routing decisions
   - Action chain composition patterns
   - Model selection rationale

2. **Agent-Level Design (Implementation Patterns)**
   - Backend patterns (Express Router, Zod validation, Storage)
   - Frontend patterns (React hooks, Context providers, WebSocket)
   - Shared patterns (branded types, discriminated unions)

3. **Cross-Cutting Concerns (All Layers)**
   - Error handling strategies
   - Security boundaries
   - Performance constraints
   - Testing approaches

#### 6.1.2 Atomic Feature Decomposition

Following "Actions are Building Blocks" philosophy:

- Each feature should be decomposable into **action-sized chunks**
- Each chunk should have clear inputs, outputs, and dependencies
- FRD should identify which features are **atomic** (single action) vs **composite** (chain required)

Example:
```
Feature: Session Pause/Resume Control
- Atomic: backend endpoint for pause command (code/backend)
- Atomic: frontend button UI (code/frontend)
- Composite: full pause/resume flow (shared types → backend → frontend → test → review)
```

#### 6.1.3 Explicit Dependency Graphs

Following "Plan First, Execute Second" philosophy:

- SRD should include **explicit dependency graphs** for each feature
- Graph should show: shared types → backend → frontend → tests
- Graph should identify parallel vs sequential work

Example:
```
Session Pause/Resume:
  Step 1: Define PauseCommand, ResumeCommand in shared types
    ↓
  Step 2: Implement /sessions/:id/pause endpoint (backend)
  Step 3: Implement usePauseSession hook (frontend)  [parallel with Step 2]
    ↓
  Step 4: Write integration tests
    ↓
  Step 5: Review changes
```

#### 6.1.4 Risk & Root Cause Documentation

Following "Fix Root Causes, Not Symptoms" philosophy:

- SRD should include **risk assessment tables** for each major feature
- Risks should map to: WebSocket protocol changes, breaking API changes, storage migrations, Electron security
- Each risk should have: Impact level, Mitigation strategy, Detection method

Example:
```
| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| WebSocket message schema change breaks existing clients | HIGH | Version negotiation, backward compatibility | E2E tests, protocol audit |
```

#### 6.1.5 Pattern Recognition & Reuse

Following "Compose First, Propose Later" philosophy:

- FRD should identify **recurring requirement patterns**
- SRD should identify **recurring implementation patterns**
- When a pattern recurs 2+ times, document it as a reusable flow/action

Example:
```
Recurring Pattern: "Add control button to session panel"
- Shared: Define command type
- Backend: Add POST /sessions/:id/:command endpoint
- Frontend: Add button to SessionControls.tsx, call useSessionCommand hook
- Tests: Integration test for command flow

→ Document as "session-command-addition/" flow for future reuse
```

### 6.2 Documentation Constraints from Framework Philosophy

#### 6.2.1 No "Implementation Details" in FRD

Following separation of orchestrator (routing) vs agent (implementation):

- FRD should NOT specify Express routes, React component names, or function signatures
- FRD should specify: domain concepts, user workflows, acceptance criteria
- Implementation patterns belong in SRD (agent-level design)

#### 6.2.2 Action-Oriented Language

Following "Actions are Building Blocks":

- Use action-verb phrasing: "Implement session pause", "Review error handling", "Audit WebSocket security"
- Avoid passive phrasing: "Session should be pauseable", "Error handling needs review"

#### 6.2.3 Explicit Approval Gates

Following "Plan First, Execute Second":

- SRD should identify where human approval is required before proceeding
- Example: Architecture decisions, API contract changes, storage migrations

### 6.3 Recommended FRD/SRD Section Structure

Based on framework philosophy:

#### FRD Sections

1. **Overview & Scope**
   - Project context (from project.config.md)
   - Human-facing goals
   - Out of scope (what this does NOT cover)

2. **Domain Model**
   - Core concepts (Session, Chain, Step, User, Command, Event)
   - Entity relationships
   - Branded type definitions

3. **User Requirements**
   - User stories with acceptance criteria
   - UI/UX requirements
   - Non-functional requirements (performance, security)

4. **Orchestrator Routing Guide**
   - Department mapping for each requirement type
   - Flow identification (existing flows vs composition needed)
   - Action chain patterns

5. **Dependency Matrix**
   - Feature-to-feature dependencies
   - Parallel vs sequential work identification
   - Critical path analysis

#### SRD Sections

1. **Architecture Overview**
   - Monorepo structure (packages/backend, packages/app, packages/shared, packages/mcp-server)
   - Data flow: shared types → backend → frontend
   - Tech stack per package

2. **Orchestrator-Level Design**
   - Department/flow routing decisions per requirement
   - Action chain composition
   - Model selection rationale (haiku/sonnet/opus)

3. **Agent-Level Design**
   - **Backend Patterns**
     - Express Router middleware chains
     - Zod validation schemas
     - StorageProvider interface
     - WebSocket event handlers
   - **Frontend Patterns**
     - React hooks (useState, useEffect, useCallback)
     - Context providers
     - WebSocket hooks
     - Electron IPC boundaries
   - **Shared Patterns**
     - Branded string types
     - Discriminated unions
     - ES module structure

4. **Implementation Sequence**
   - Ordered steps with dependency graphs
   - Action assignment per step
   - Parallel work identification

5. **Risk Assessment**
   - Risk tables per major feature
   - Impact levels, mitigation strategies
   - Detection methods (tests, audits)

6. **Quality Assurance**
   - Testing strategy (unit, integration, E2E)
   - Review checklists
   - Audit scope (security, performance)

7. **Learnings Integration**
   - Known anti-patterns to avoid
   - Proven approaches to follow
   - Root cause documentation from past executions

---

## Part 7: Framework Governance & Evolution

### 7.1 How Framework Changes Are Made

Based on LEARNINGS.md and framework flow definitions:

1. **Identify Gap or Inconsistency** — Human or orchestrator notices a recurring pattern or missing capability
2. **Document in LEARNINGS.md** — Record the pattern, root cause, suggested fix
3. **Wait for Recurrence (2+ times)** — Don't create flows for one-off needs
4. **Route to Framework Department** — Use flow-creation/ or action-creation/ flow
5. **Chain:** analyze → plan → code → review → commit → update registry
6. **Update FLOWS.md or ACTIONS.md** — Orchestrator adds registry line

### 7.2 When to Create a New Flow vs Compose from Actions

**Compose from Actions (dynamic chain):**
- Unique request (first occurrence)
- Situation-specific parameters
- One-off optimization or experiment

**Create a New Flow (predefined chain):**
- Pattern has recurred 2+ times
- Clear department ownership
- Predictable input/output structure
- Saves cognitive overhead for orchestrator

### 7.3 Framework Health Monitoring

The framework includes a `framework-health/` flow for validating structure:

**What it checks:**
- All flows in FLOWS.md reference valid actions in ACTIONS.md
- All actions in ACTIONS.md have agent.md + instructions.md files
- All abstract actions referenced by agents exist
- Log folder structure follows naming convention
- Registry files are parseable and consistent

**When to run:** Before major framework changes, or when strange errors occur

---

## Part 8: Dashboard Development Implications

### 8.1 How ActionFlows Framework Shapes Dashboard Architecture

The ActionFlows Dashboard is **both a product and a meta-example** of the framework in action. The dashboard's architecture reflects framework philosophy:

#### 8.1.1 Session = Orchestration Instance
- Each dashboard session represents an active orchestration flow
- Sessions have lifecycle: created → running → paused → resumed → completed/cancelled
- Mirrors framework's chain execution model

#### 8.1.2 Chain = Action Sequence
- Each chain in the dashboard represents a compiled action sequence
- Chains have dependency graphs (parallel vs sequential steps)
- Mirrors framework's "Plan First, Execute Second" philosophy

#### 8.1.3 Step = Individual Agent Execution
- Each step represents a spawned agent's work
- Steps have status: pending → running → completed/failed/skipped
- Mirrors framework's agent execution boundaries

### 8.2 Dashboard Features as Framework Embodiments

| Dashboard Feature | Framework Principle Embodied |
|------------------|----------------------------|
| Session control panel (pause/resume/cancel) | Proactive Coordination Initiative |
| Chain dependency graph visualization | Explicit dependency tracking |
| Step completion logging | Execution history (INDEX.md) |
| Agent output viewing | Learning surface & fresh eye discovery |
| Error boundary UI | Graceful degradation |
| "Retry from here" button | Root cause fixing + chain recompilation |

### 8.3 Dashboard UI/UX Constraints from Framework

#### 8.3.1 Orchestrator Panel (Coordination View)
- Shows compiled chains, not implementation details
- Displays routing decisions (department → flow → actions)
- Presents approval gates before execution

#### 8.3.2 Agent Panel (Execution View)
- Shows individual agent work (not orchestrator coordination)
- Displays agent.md instructions being executed
- Presents agent learnings and fresh eye discoveries

#### 8.3.3 No Mixed Perspectives
- Dashboard MUST NOT show orchestrator and agent work in same view
- Separation mirrors framework's strict boundary between coordination and execution

---

## Part 9: Key Takeaways for FRD/SRD Authors

### 9.1 What Makes a Good FRD in This Framework

1. **Domain-focused, not implementation-focused** — Describe WHAT to build, not HOW to route/implement
2. **Action-decomposable** — Every feature breaks into action-sized chunks
3. **Dependency-explicit** — Shows which features depend on others
4. **Routing-aware** — Identifies department ownership and likely flow/action composition

### 9.2 What Makes a Good SRD in This Framework

1. **Three-layer structure** — Orchestrator routing → Agent implementation patterns → Cross-cutting concerns
2. **Explicit action chains** — Every feature maps to a compilable chain
3. **Risk-conscious** — Tables for WebSocket protocol changes, breaking changes, migrations
4. **Pattern-reuse focused** — Identifies recurring patterns for flow/action extraction

### 9.3 Common Pitfalls to Avoid

1. **Mixing orchestrator and agent perspectives** — Keep coordination and execution separate
2. **Over-specifying in FRD** — Don't dictate Express routes or React component names
3. **Under-specifying in SRD** — Don't leave implementation patterns ambiguous
4. **Ignoring framework constraints** — Don't propose features that violate "it's a sin" or delegation boundaries
5. **Missing dependency graphs** — Don't assume sequential execution; make parallelism explicit

---

## Part 10: Framework Philosophy Summary

### 10.1 The Three Pillars

1. **Strict Delegation** — Orchestrator coordinates, agents execute. Never violate boundaries.
2. **Composable Actions** — Atomic, reusable, stack-aware building blocks. Compose first, propose flows later.
3. **Root Cause Fixing** — Stop, diagnose, fix source, document learnings. Prevent recurrence.

### 10.2 The Three Boundaries

1. **Orchestrator-Agent Boundary** — Coordination vs execution. Read different files, use different tools.
2. **Assessment-Implementation Boundary** — analyze/review/audit vs code/test/commit. Assessment actions write to logs/, implementation actions write to project.
3. **Abstract-Concrete Boundary** — agent-standards (how) vs code/review (what). Abstract actions define patterns, concrete actions execute them.

### 10.3 The Three Disciplines

1. **Plan First, Execute Second** — Compile chain → present → approve → spawn. No improvisation.
2. **Compose First, Propose Later** — Use existing actions. Create new flows only after 2+ recurrences.
3. **Fix First, Document Second** — Root cause fixing → LEARNINGS.md update. Prevent pattern recurrence.

---

## Conclusion

The ActionFlows framework is a **strict, opinionated orchestration system** that enforces separation between coordination and execution. Its philosophy rests on three foundational principles:

1. **"It's a Sin"** — Content production by orchestrator violates boundaries
2. **"Delegate Everything"** — Work routes through department → flow → action chain
3. **"Fix Root Causes"** — Stop, diagnose, fix source, document learnings

This philosophy constrains and guides dashboard development by:
- Forcing feature decomposition into action-sized chunks
- Requiring explicit dependency graphs
- Mandating risk assessment for breaking changes
- Enforcing separation between orchestrator (coordination) and agent (execution) perspectives

For FRD/SRD documentation, this implies:
- **FRD:** Domain-focused, action-decomposable, routing-aware
- **SRD:** Three-layer (orchestrator → agent → cross-cutting), explicit chains, risk-conscious

The framework includes 7 generic actions, 2 stack-specific code actions, 4 abstract behavior patterns, 9 predefined flows across 3 departments, and 11 core agent behavioral standards. It supports action modes (assess-only vs assess-and-fix), model selection (haiku/sonnet/opus), and execution history tracking (INDEX.md, LEARNINGS.md).

Identified improvement areas include: automated testing flow, database migration flow, performance optimization flow, cross-package refactoring flow, action mode decision matrix, rollback flow, framework self-optimization flow, execution analytics, and checklist creation flow.

**This framework is both the tool for building the dashboard and the philosophy embedded in the dashboard's architecture.**

---

## Learnings

**Issue:** None
**Root Cause:** N/A
**Suggestion:** N/A

[FRESH EYE] The framework's "it's a sin" philosophy is both its greatest strength (enforces clean boundaries) and its greatest friction point (requires constant vigilance). The quick triage mode and registry line edit exceptions acknowledge pragmatic solo development needs while maintaining the core philosophy. This tension between ideological purity and practical efficiency is a recurring theme worth documenting for future framework improvements.

The framework's three-tier action architecture (abstract → generic → stack-specific) is elegant and composable, but underutilized. Only 2 stack-specific actions exist (backend, frontend), but the pattern could extend to other domains (mcp-server, hooks, e2e tests). Consider proposing stack-specific action creation as a framework optimization.
