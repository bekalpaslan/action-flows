# ActionFlows Framework Analysis

**Scope:** `.claude/actionflows/` structure, philosophy, and governance
**Date:** 2026-02-08
**Analyst:** analyze/ action agent
**Context:** Deep dive for FRD/SRD — the dashboard exists to visualize and control this orchestration system

---

## Executive Summary

ActionFlows is a **delegation-based orchestration framework** that transforms a Claude agent from a general-purpose assistant into a specialized routing coordinator. The framework enforces strict boundaries: the orchestrator compiles action chains and spawns specialized agents; agents execute their defined missions without further delegation.

**Key Insight:** The framework treats "doing work yourself" as a **sin** — the orchestrator's hands are for coordination only. This philosophical foundation pervades every aspect of the design.

**Health Status:** 🟢 **Structurally sound**, with clear philosophy, well-defined actions, abstract behaviors, and flow definitions. Minor gaps in flow coverage and checklist implementation.

---

## 1. Framework Philosophy & Governance

### 1.1 Core Philosophy: "It's a Sin"

**Location:** `ORCHESTRATOR.md` lines 28-46

The framework's foundational principle is that producing content (writing, analyzing, reviewing, coding) is forbidden for the orchestrator. Only coordination is permitted.

**The Sin Test (before every action):**
```
Am I about to produce content? → YES → It's a sin. Compile a chain.
                                → NO  → Am I coordinating? → YES → Proceed
                                                          → NO  → Delegate it
```

**Evidence of enforcement:**
- **Objection Protocol** (lines 48-62): Allows orchestrator to challenge false "sin" accusations but requires explicit citation
- **Pre-Action Gate** (lines 147-168): Three-layer validation before ANY tool call
- **Quick Triage Mode** (lines 65-85): Limited exception for 1-3 file mechanical fixes (solo developer optimization)

**Assessment:** ✅ **Philosophically coherent**. The sin metaphor is clear, memorable, and consistently applied.

### 1.2 Delegation Model

**Permitted orchestrator actions:**
1. Registry line edits (add/remove single lines in INDEX.md, FLOWS.md, ACTIONS.md, LEARNINGS.md)
2. Quick triage fixes (1-3 files, mechanical, high confidence)
3. Chain compilation and presentation
4. Agent spawning with structured prompts

**Meta-task size threshold** (lines 94-103):
| Criteria | Direct | Delegate |
|----------|--------|----------|
| Lines changed | < 5 | 5+ |
| Files affected | 1 | 2+ |
| Nature | Add entry, fix number | Structural rewrite, content gen |
| Judgment | Mechanical | Creative |

**Assessment:** ✅ **Clear boundaries**. The threshold table is quantitative and unambiguous.

### 1.3 Proactive Coordination Initiative

**Lines 171-197:** Framework shifts from "wait for approval between steps" to autonomous chain execution once approved.

**Key mechanisms:**
- **Autonomous Follow-Through:** Execute entire chain without stopping between steps
- **Step Boundary Evaluation:** Six triggers evaluated after EVERY step (agent signals, patterns, dependencies, quality, redesign, reuse)
- **Preemptive Recompilation:** Mid-chain plan adjustments without waiting

**Assessment:** ✅ **Proactive by design**. This prevents the "help mode" anti-pattern where the orchestrator constantly asks "what next?"

### 1.4 Session-Start Protocol

**Lines 8-24:** Forces orchestrator into **routing mode** instead of **help mode**.

**Required reads on EVERY session start:**
1. `project.config.md` — Project context
2. `ORGANIZATION.md` — Department routing
3. `FLOWS.md` — Available flows
4. `logs/INDEX.md` — Past executions

**Why this matters:** Prevents the orchestrator from defaulting to "how can I help?" Instead, it consults registries and routes work through the framework.

**Assessment:** ✅ **Effective forcing function**. Session start is a hard boundary.

---

## 2. Organization & Routing

**Location:** `ORGANIZATION.md`

### 2.1 Department Structure

| Department | Owns | Key Flows |
|------------|------|-----------|
| **Framework** | ActionFlows maintenance | flow-creation/, action-creation/, action-deletion/, framework-health/, doc-reorganization/ |
| **Engineering** | Code implementation, reviews, bug fixes | code-and-review/, bug-triage/, post-completion/ |
| **QA** | Audits, quality sweeps, security scans | audit-and-fix/ |

**Assessment:** ✅ **Logical separation of concerns**. Each department has a clear mandate.

### 2.2 Routing Table

**Lines 29-43:** Maps human intent to department and flow.

**Examples:**
- "implement X" / "add feature X" → Engineering → code-and-review/
- "fix bug X" → Engineering → bug-triage/
- "audit security" → QA → audit-and-fix/
- "create a new flow" → Framework → flow-creation/

**Gap identified:**
- No explicit routing for "documentation update" (non-code docs)
- No routing for "performance optimization" (separate from audit)

**Assessment:** 🟡 **Good coverage**, but gaps exist for docs-only work and performance tuning.

---

## 3. Flow Registry

**Location:** `FLOWS.md`

### 3.1 Framework Department Flows

| Flow | Purpose | Chain |
|------|---------|-------|
| flow-creation/ | Create new flow | plan → human gate → code → review |
| action-creation/ | Create new action | plan → human gate → code → review |
| action-deletion/ | Remove action safely | analyze → code → review |
| framework-health/ | Validate structure | analyze |
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |

**Assessment:** ✅ **Self-maintaining**. Framework has flows for its own evolution.

### 3.2 Engineering Department Flows

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → (loop if needed) |
| bug-triage/ | Structured bug fix | analyze → code → test → review |
| post-completion/ | Wrap-up after work | commit → registry update |

**Assessment:** ✅ **Core workflows covered**. Loop structure in code-and-review handles revision cycles.

### 3.3 QA Department Flows

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → review |

**Assessment:** 🟡 **Minimal but functional**. Could add flows for: test-coverage-sweep/, performance-profiling/.

### 3.4 Flow Structure Analysis

**Read flow definitions:**
- `flow-creation/instructions.md` — Includes human gate after planning
- `code-and-review/instructions.md` — Includes feedback loop (NEEDS_CHANGES → back to code)
- `bug-triage/instructions.md` — Sequential: analyze → code → test → review

**Pattern observed:** All flows use action references, spawn patterns, gates, and dependency graphs.

**Assessment:** ✅ **Consistent structure** across flows.

---

## 4. Actions Registry

**Location:** `ACTIONS.md`

### 4.1 Abstract Actions (Behavioral Patterns)

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `_abstract/agent-standards/` | Core behavioral standards | All agents |
| `_abstract/post-completion/` | Post-implementation workflow | Orchestrator |
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `_abstract/update-queue/` | Queue.md status updates | code, review |

**Implementation:**
- **agent-standards/instructions.md:** 11 principles including "Identity Boundary" (never read ORCHESTRATOR.md), "Pre-Completion Validation" (verify output exists)
- **create-log-folder/instructions.md:** CRITICAL execution order to prevent shell substitution failures on Windows
- **post-completion/instructions.md:** Commit → update INDEX.md
- **update-queue/instructions.md:** Status progression (PENDING → IN_PROGRESS → REVIEW_READY → APPROVED)

**Assessment:** ✅ **Well-designed abstractions**. Prevents code duplication across agents.

### 4.2 Generic Actions

| Action | Purpose | Required Inputs | Model |
|--------|---------|-----------------|-------|
| code/ | Implement code changes | task, context | haiku |
| review/ | Review anything | scope, type | sonnet |
| audit/ | Comprehensive audits | type, scope | opus |
| test/ | Execute tests | scope, type | haiku |
| analyze/ | Codebase analysis | aspect, scope | sonnet |
| plan/ | Implementation planning | requirements, context | sonnet |
| commit/ | Git commit + push | summary, files | haiku |

**Action Modes (lines 40-49):**
| Action | Default | Extended | Behavior |
|--------|---------|----------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs/docs |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift |

**Assessment:** ✅ **Flexible mode system** allows assess-only or assess-and-fix without duplicating actions.

### 4.3 Stack-Specific Actions

| Action | Stack | Required Inputs | Model |
|--------|-------|-----------------|-------|
| code/backend/ | Express 4.18 + TypeScript + Zod | task, context | haiku |
| code/frontend/ | React 18.2 + Vite 5 + Electron 28 | task, context | haiku |

**Assessment:** ✅ **Specialization available** but generic code/ action still exists as fallback.

### 4.4 Model Selection Strategy

| Action Type | Model | Rationale |
|-------------|-------|-----------|
| code, test, commit | haiku | Fast, simple execution |
| review, analyze, plan | sonnet | Needs judgment |
| audit | opus | Deep analysis needed |

**Assessment:** ✅ **Performance vs. capability tradeoff** is explicit and rational.

---

## 5. Agent Definitions

**Analyzed 7 agent.md files:** analyze, code, review, plan, audit, commit, test

### 5.1 Structure Consistency

All agents follow the same template:
1. **Mission statement**
2. **Extends** section (which abstract behaviors apply)
3. **Steps to Complete This Action** (numbered, sequential)
4. **Project Context** (tech stack, paths, ports)
5. **Constraints** (DO / DO NOT)
6. **Learnings Output** (required format)

**Assessment:** ✅ **Uniform structure** makes agents predictable and composable.

### 5.2 Agent Behavioral Standards

**From `_abstract/agent-standards/instructions.md`:**

**11 Core Principles:**
1. **Single Responsibility** — One mission per agent
2. **Token Efficiency** — Grep before Read, skip validated files, tables not prose
3. **Fresh Eye Discovery** — Notice issues outside instructions, tag with `[FRESH EYE]`
4. **Parallel Safety** — Each agent writes to its OWN file
5. **Verify, Don't Assume** — Check file contents before referencing
6. **Explicit Over Implicit** — Concrete paths, not relative references
7. **Output Boundaries** — Assessment actions write to logs/, implementation writes to project dirs
8. **Graceful Degradation** — Continue on failure, report issues
9. **Identity Boundary** — Never read ORCHESTRATOR.md, never delegate
10. **Pre-Completion Validation** — Verify output files exist and are non-empty
11. **Output Boundary** (duplicate of #7, but reinforced)

**Assessment:** ✅ **Strong identity isolation**. Principle #9 prevents agents from crossing into orchestrator territory.

### 5.3 Agent Input Requirements

**From ACTIONS.md lines 59-78:**

**Input classification:**
- **Requires Input = YES:** Orchestrator MUST provide inputs (action fails without them)
- **Requires Input = NO:** Agent is autonomous (orchestrator just spawns it)

**Example from code/agent.md:**
```
Input:
- task: {what to implement}
- context: {relevant files/areas}
- component (optional): {backend|frontend|shared}
```

**Assessment:** ✅ **Explicit input contracts** prevent ambiguous spawning.

---

## 6. Spawning Pattern

**Location:** ORCHESTRATOR.md lines 318-350, ACTIONS.md lines 80-106

### 6.1 Standard Spawn Template

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

**Critical Guards:**
1. **Identity Guard:** "Do NOT read ORCHESTRATOR.md — it is not for you"
2. **Boundary Guard:** "Do NOT delegate work or compile chains"
3. **Context Injection:** Project-specific tech stack and paths
4. **Input Specification:** Explicit key-value pairs

**Config Injection Rule (ORCHESTRATOR.md lines 346-348):**
> "ALWAYS inject relevant project config into agent prompts."

**Assessment:** ✅ **Three-layer defense** against identity confusion (spawn prompt, agent-standards #9, CLAUDE.md conditional).

---

## 7. Execution History & Learnings

**Location:** `logs/INDEX.md`, `logs/LEARNINGS.md`

### 7.1 Execution Index

**Current state:**
- 1 execution recorded (doc reorganization, 2026-02-08)
- Pattern signature: `analyze → plan → code → review → commit`
- Intent type: docs (1 success)

**Assessment:** 🟡 **Registry functional** but sparse (new framework). Will populate over time.

### 7.2 Learnings Registry

**Current learnings:**
1. **Indirect References Anti-Pattern:** Don't use "Follow: {path}" without explicit tool names
2. **Orchestrator Doing Project Work:** Never bypass framework to "do it yourself"
3. **Registry Updates Only:** Only single-line edits permitted (everything else = chain)
4. **Explicit Required Steps:** Use REQUIRED marker + inline tool + "Do NOT skip" warning

**Assessment:** ✅ **Learning capture working**. Documented fixes to early mistakes.

---

## 8. Checklists

**Location:** `.claude/actionflows/checklists/`

### 8.1 Checklist Structure

**Directories:**
- `functional/` — Feature flows, business logic validation
- `technical/` — Security, API consistency, test quality, performance

**INDEX.md:**
- Empty table (populated as checklists are created)
- Priority levels: p0 (critical), p1 (high), p2 (medium), p3 (low)

**Assessment:** 🟡 **Structure exists**, but no checklists implemented yet. This is expected for a new framework.

---

## 9. Philosophical Consistency Analysis

### 9.1 Alignment Check: Philosophy → Structure → Actions

| Philosophical Principle | Structural Manifestation | Agent Behavior |
|-------------------------|--------------------------|----------------|
| "It's a sin to produce content" | Pre-Action Gate (lines 147-168) | agent-standards #9: "Never delegate" |
| Delegation-first | Meta-task threshold table | Agents execute, orchestrator routes |
| Proactive coordination | Step Boundary Evaluation | Agents report learnings, orchestrator recompiles |
| Framework-first routing | ORGANIZATION.md + FLOWS.md | No external instruction files or skills |
| Fix root causes, not symptoms | LEARNINGS.md | Agents tag `[FRESH EYE]` discoveries |

**Assessment:** ✅ **Philosophy is consistently encoded** into structure and behavior.

### 9.2 Drift Detection

**Checked for:**
- Actions defined in ACTIONS.md but missing from `actions/` directory → ❌ None found
- Flows defined in FLOWS.md but missing from `flows/` directory → ❌ None found
- Agent.md files referencing non-existent abstract actions → ❌ None found
- Inconsistent spawn patterns across flow definitions → ❌ None found

**Assessment:** ✅ **No structural drift detected**.

---

## 10. Gaps & Inconsistencies

### 10.1 Flow Coverage Gaps

| Gap | Impact | Suggested Flow |
|-----|--------|----------------|
| Performance optimization (separate from audit) | Medium | `performance-tune/` — profile → analyze → optimize → test |
| Documentation-only updates | Low | `docs-update/` — analyze → code → review (no tests) |
| Test coverage expansion | Medium | `test-coverage-sweep/` — analyze → code (tests) → test |
| Security patch application | High | `security-patch/` — audit → code → test → review → commit |

**Assessment:** 🟡 **Core workflows covered**, but edge cases missing.

### 10.2 Abstract Action Usage Inconsistencies

**Checked:** Do all agents that create log folders extend `create-log-folder`?

| Agent | Creates Log Folder? | Extends create-log-folder? | Status |
|-------|---------------------|----------------------------|--------|
| analyze | Yes | Yes | ✅ |
| code | Yes | Yes | ✅ |
| review | Yes | Yes | ✅ |
| plan | Yes | Yes | ✅ |
| audit | Yes | Yes | ✅ |
| test | Yes | Yes | ✅ |
| commit | No | No | ✅ |

**Assessment:** ✅ **Consistent usage** of abstract behaviors.

### 10.3 Checklist Implementation

**Status:** Structure exists (`checklists/INDEX.md`, `functional/`, `technical/`), but no checklist files created yet.

**Impact:** Review and audit actions cannot reference specific validation checklists. This is LOW priority (agents have inline criteria in their agent.md files).

**Assessment:** 🟡 **Not blocking**, but should populate over time.

### 10.4 Flow Definition Completeness

**Checked:** Do all flows in FLOWS.md have corresponding `instructions.md` files?

| Flow | Expected Path | Exists? |
|------|---------------|---------|
| flow-creation/ | flows/framework/flow-creation/instructions.md | ✅ |
| action-creation/ | flows/framework/action-creation/instructions.md | ✅ |
| action-deletion/ | flows/framework/action-deletion/instructions.md | ✅ |
| framework-health/ | flows/framework/framework-health/instructions.md | ✅ |
| doc-reorganization/ | flows/framework/doc-reorganization/instructions.md | ✅ |
| code-and-review/ | flows/engineering/code-and-review/instructions.md | ✅ |
| bug-triage/ | flows/engineering/bug-triage/instructions.md | ✅ |
| post-completion/ | flows/engineering/post-completion/instructions.md | ✅ |
| audit-and-fix/ | flows/qa/audit-and-fix/instructions.md | ✅ |

**Assessment:** ✅ **100% registry-to-filesystem alignment**.

---

## 11. Response Format Standards

**Location:** ORCHESTRATOR.md lines 200-290

### 11.1 Format Types

1. **Chain Compilation** (presenting plan for approval)
2. **Execution Start**
3. **Step Completion**
4. **Chain Status Update**
5. **Execution Complete**
6. **Learning Surface**
7. **Registry Update** (the ONLY direct action)

**Assessment:** ✅ **Standardized communication** between orchestrator and human.

### 11.2 Learning Surface Protocol

**Lines 266-278:**
```
## Agent Learning

**From:** {action/} ({model})
**Issue:** "{what happened}"
**Root cause:** "{why}"

**Suggested fix:** {orchestrator's proposed solution}

Implement?
```

**Why this matters:** Agents report issues, but orchestrator owns the decision to fix. This preserves the boundary.

**Assessment:** ✅ **Clean handoff** from agent discovery to orchestrator action.

---

## 12. File Reading Permissions

**Location:** ORCHESTRATOR.md lines 401-415

| File Type | Orchestrator CAN Read | Agent Reads |
|-----------|----------------------|-------------|
| actionflows/ORGANIZATION.md | Yes (session start) | No |
| actionflows/FLOWS.md | Yes (routing) | No |
| actionflows/ACTIONS.md | Yes (dynamic chains) | No |
| actionflows/logs/INDEX.md | Yes (past executions) | No |
| actionflows/project.config.md | Yes (session start) | No |
| Project code (packages/**) | NEVER | Yes |
| Project docs | NEVER | Yes |
| Checklist files | NEVER | Yes (agents read these) |

**Assessment:** ✅ **Clear separation** — orchestrator reads registries, agents read project code.

---

## 13. Anti-Patterns

**Location:** ORCHESTRATOR.md lines 379-400

### 13.1 Session-Start Anti-Patterns

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

**Assessment:** ✅ **Examples teach the right behavior** through contrast.

---

## 14. Framework Health Metrics

### 14.1 Structural Completeness

| Component | Count | Status |
|-----------|-------|--------|
| Departments | 3 | ✅ |
| Flows | 9 | ✅ |
| Generic Actions | 7 | ✅ |
| Stack-Specific Actions | 2 | ✅ |
| Abstract Actions | 4 | ✅ |
| Agent Definitions | 7 | ✅ |
| Checklists | 0 | 🟡 |
| Learnings | 4 | ✅ |
| Execution Records | 1 | 🟡 (expected for new framework) |

### 14.2 Philosophical Coherence Score

| Principle | Implementation | Score |
|-----------|----------------|-------|
| Delegation-first | Pre-Action Gate, Meta-task threshold | 10/10 |
| Identity isolation | Spawn pattern guards, agent-standards #9 | 10/10 |
| Session-start forcing | Session-Start Protocol | 10/10 |
| Proactive coordination | Step Boundary Evaluation | 10/10 |
| Fix root causes | LEARNINGS.md, Fresh Eye tagging | 10/10 |
| **Overall** | | **10/10** |

### 14.3 Registry-to-Filesystem Alignment

| Registry | Declared | Implemented | Alignment |
|----------|----------|-------------|-----------|
| FLOWS.md | 9 flows | 9 flows | 100% |
| ACTIONS.md | 13 actions (7 generic + 2 stack + 4 abstract) | 13 actions | 100% |
| ORGANIZATION.md | 3 departments | 3 departments | 100% |

**Assessment:** ✅ **Perfect alignment** — no orphaned definitions or undocumented implementations.

---

## 15. Critical Context for FRD/SRD

### 15.1 What the Dashboard Visualizes

The ActionFlows framework IS the system being visualized. The dashboard must represent:

1. **Session-level view:**
   - Orchestrator state (which session-start files were read)
   - Current chain being executed
   - Human gates (awaiting approval)

2. **Chain-level view:**
   - Action sequence with dependencies
   - Parallel vs. sequential execution
   - Step completion status (Pending → Running → Done)

3. **Agent-level view:**
   - Which agent is executing (analyze/, code/, review/, etc.)
   - Which model is running (haiku, sonnet, opus)
   - Log folder outputs in real-time
   - Learnings discovered (`[FRESH EYE]` tags)

4. **Registry-level view:**
   - Available flows (FLOWS.md)
   - Available actions (ACTIONS.md)
   - Past executions (INDEX.md)
   - Aggregated learnings (LEARNINGS.md)

### 15.2 Control Commands

The dashboard must enable control of orchestration:

1. **Chain control:**
   - Pause chain execution
   - Resume paused chain
   - Cancel chain (stop and rollback)
   - Skip step (mark as skipped, proceed to next)
   - Retry step (re-execute failed step)

2. **Human gates:**
   - Approve/reject presented chains
   - Provide feedback for revision

3. **Learning management:**
   - Promote `[FRESH EYE]` discoveries to LEARNINGS.md
   - Apply suggested fixes from agent learnings

### 15.3 Data Flow Model

**Orchestrator → Backend → Frontend:**
1. Orchestrator compiles chain → sends to backend `/api/chains` endpoint
2. Backend stores chain in storage (MemoryStorage or Redis)
3. Backend broadcasts `ChainCreated` event via WebSocket
4. Frontend receives event → updates ReactFlow visualization
5. Agent completes step → backend broadcasts `StepCompleted` event
6. Frontend updates node status → shows agent output in log panel

**Frontend → Backend → Orchestrator:**
1. User clicks "Approve Chain" → frontend sends POST `/api/chains/{id}/approve`
2. Backend updates chain status → broadcasts `ChainApproved` event
3. Orchestrator receives approval signal → begins agent spawning

---

## 16. Inconsistencies & Philosophical Drift

### 16.1 Checked for Drift

**❌ No drift detected in:**
- Session-start protocol enforcement
- Delegation boundaries (orchestrator vs. agent)
- Spawn pattern consistency
- Abstract behavior usage
- Registry alignment

**🟡 Minor gaps (not drift):**
- Checklist implementation (structure exists, content pending)
- Flow coverage (core workflows present, edge cases missing)
- Execution history (sparse, but expected for new framework)

### 16.2 Potential Future Drift Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orchestrator starts reading project code | Medium | Pre-Action Gate enforces this |
| Agents start delegating work | Low | Identity Boundary (#9) prevents this |
| New flows bypass FLOWS.md registry | Low | Flow-creation/ flow enforces registry updates |
| Spawn pattern diverges across flows | Medium | Code review should catch inconsistencies |

**Assessment:** ✅ **Framework has self-defense mechanisms** against drift.

---

## 17. Missing Actions Analysis

**Checked:** Are there common tasks that lack corresponding actions?

| Task Type | Covered? | Action |
|-----------|----------|--------|
| Code implementation | ✅ | code/, code/backend/, code/frontend/ |
| Code review | ✅ | review/ |
| Testing | ✅ | test/ |
| Analysis | ✅ | analyze/ |
| Planning | ✅ | plan/ |
| Auditing | ✅ | audit/ |
| Git commits | ✅ | commit/ |
| Documentation generation | 🟡 | Could use dedicated docs/ action (currently uses code/) |
| Deployment | ❌ | No deploy/ action |
| Database migration | ❌ | No migrate/ action |
| Dependency updates | ❌ | No deps-update/ action |

**Assessment:** 🟡 **Core actions present**, but specialized actions missing (acceptable for current scope).

---

## 18. Abstract Behavior Completeness

**Checked:** Are there common behaviors agents should share that aren't abstracted?

| Behavior | Abstracted? | Current Implementation |
|----------|-------------|------------------------|
| Behavioral standards | ✅ | agent-standards/ |
| Log folder creation | ✅ | create-log-folder/ |
| Queue status updates | ✅ | update-queue/ |
| Post-completion workflow | ✅ | post-completion/ |
| Error handling | 🟡 | Inline in each agent (could abstract) |
| Pre-completion validation | ✅ | agent-standards/ #10 |
| Fresh eye discovery | ✅ | agent-standards/ #3 |

**Assessment:** ✅ **Key behaviors abstracted**, minor gaps acceptable.

---

## 19. Flow Chain Patterns

**Analyzed chain structures across flows:**

| Flow | Pattern | Complexity |
|------|---------|------------|
| flow-creation/ | plan → human gate → code → review | Sequential with gate |
| action-creation/ | plan → human gate → code → review | Sequential with gate |
| action-deletion/ | analyze → code → review | Sequential |
| framework-health/ | analyze | Single-step |
| doc-reorganization/ | analyze → human gate → plan → human gate → code → review | Sequential with 2 gates |
| code-and-review/ | code → review → (loop if NEEDS_CHANGES) | Sequential with feedback loop |
| bug-triage/ | analyze → code → test → review | Sequential |
| post-completion/ | commit → registry update | Sequential |
| audit-and-fix/ | audit → review | Sequential |

**Patterns observed:**
- **No parallel execution chains** (all sequential or single-step)
- **Human gates common** in Framework department flows
- **Feedback loops** in code-and-review/ for revision cycles
- **Consistent action ordering:** analyze/plan → code → test → review → commit

**Assessment:** ✅ **Consistent patterns** make chains predictable and composable.

---

## 20. Config Injection Analysis

**Location:** ORCHESTRATOR.md lines 346-348, project.config.md

**Current project config:**
- **Name:** ActionFlows Dashboard
- **Tech Stack:** Backend (Express 4.18 + ws + ioredis + Zod), Frontend (React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm), Shared (branded types)
- **Paths:** backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- **Ports:** backend=3001, vite=5173
- **Git conventions:** Conventional commits, Co-Authored-By: Claude Opus 4.6

**Assessment:** ✅ **Config is comprehensive** and injected into spawn prompts correctly.

---

## Summary of Findings

### Strengths

1. **Philosophically Coherent:** "It's a sin" metaphor consistently enforced
2. **Structurally Sound:** 100% registry-to-filesystem alignment
3. **Identity Isolation:** Three-layer defense prevents orchestrator/agent confusion
4. **Self-Maintaining:** Framework has flows for its own evolution
5. **Proactive Coordination:** Step Boundary Evaluation enables autonomous execution
6. **Learning Capture:** Agents report discoveries, orchestrator owns fixes

### Gaps (Non-Critical)

1. **Checklist Implementation:** Structure exists, content pending
2. **Flow Coverage:** Core workflows present, edge cases (performance-tune/, docs-update/) missing
3. **Execution History:** Sparse (1 execution recorded), but expected for new framework

### No Drift Detected

- Session-start protocol enforced
- Delegation boundaries respected
- Spawn patterns consistent
- Abstract behaviors used correctly
- Registry alignment perfect

### Recommendations for FRD/SRD

1. **Visualize the orchestration lifecycle:** Session start → routing → chain compilation → human gate → agent spawning → step execution → learning capture
2. **Represent human gates:** Chains awaiting approval must be clearly marked
3. **Show agent outputs in real-time:** Log folder contents should stream to dashboard
4. **Enable control commands:** Pause, resume, cancel, skip, retry at chain and step levels
5. **Surface learnings:** `[FRESH EYE]` discoveries should be highlightable for promotion to LEARNINGS.md

---

## Learnings

**Issue:** None — framework is structurally sound and philosophically consistent.

**[FRESH EYE]:** The framework's three-layer identity defense (spawn prompt guard, agent-standards #9, CLAUDE.md conditional) is unusually robust. Most delegation frameworks rely on a single guard. This defense-in-depth approach should be highlighted in the FRD as a key design principle.

**[FRESH EYE]:** The "It's a sin" metaphor is the framework's superpower. It's memorable, emotionally charged, and easy to enforce. This should be preserved in any future evolution.

**[FRESH EYE]:** The Step Boundary Evaluation (six triggers) enables true proactive orchestration. This is the mechanism that prevents "help mode" and should be central to the dashboard's control model.
