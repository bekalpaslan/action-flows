# ActionFlows Framework -- Comprehensive Analysis

> Analysis Date: 2026-02-08
> Scope: `.claude/actionflows/` directory -- all framework files
> Purpose: Foundation for FRD and SRD documentation

---

## Table of Contents

1. [What ActionFlows Is](#1-what-actionflows-is)
2. [Core Philosophy](#2-core-philosophy)
3. [Architecture Overview](#3-architecture-overview)
4. [The Orchestrator](#4-the-orchestrator)
5. [Organization and Routing](#5-organization-and-routing)
6. [Actions System](#6-actions-system)
7. [Flows System](#7-flows-system)
8. [Abstract Actions (Behavioral Mixins)](#8-abstract-actions-behavioral-mixins)
9. [Agent Spawning Model](#9-agent-spawning-model)
10. [Logging and Learning System](#10-logging-and-learning-system)
11. [Project-Framework Dependency Analysis](#11-project-framework-dependency-analysis)
12. [Quantitative Inventory](#12-quantitative-inventory)
13. [Improvement Areas and Gaps](#13-improvement-areas-and-gaps)
14. [Design Decisions and Rationale](#14-design-decisions-and-rationale)

---

## 1. What ActionFlows Is

ActionFlows is a **custom AI agent orchestration framework** that lives inside a project's `.claude/` directory. It transforms Claude Code (the AI coding assistant) from a general-purpose helper into a **structured delegation coordinator** that routes all work through typed, documented, auditable workflows.

### In One Sentence

ActionFlows is a prompt-engineering architecture that forces an LLM to behave as a project manager -- never doing work itself, always delegating to specialized agent instances.

### Key Characteristics

| Characteristic | Description |
|---------------|-------------|
| **Medium** | Markdown files (no code runtime, no executable framework) |
| **Execution environment** | Claude Code CLI sessions (Claude's context window) |
| **Agents** | Claude Code subagent instances spawned via `Task()` |
| **State** | Markdown logs, INDEX.md registry, LEARNINGS.md |
| **Configuration** | `project.config.md` -- injected into agent prompts |
| **Self-modifying** | Framework can create/delete its own actions and flows via dedicated flows |

### What It Is NOT

- It is NOT a software library or npm package
- It is NOT an executable runtime (no process, no server)
- It has NO code -- it is purely markdown-based prompt architecture
- It does NOT use a database -- all state is markdown files on disk
- It does NOT enforce constraints programmatically -- all enforcement is via LLM instruction-following

---

## 2. Core Philosophy

### 2.1. The Sin Doctrine

The framework's foundational principle is expressed as a moral imperative:

> "If you are producing content instead of compiling a chain, you are sinning."

This is the "Sin Test" -- a decision tree the orchestrator must run before every action:

```
Am I about to produce content? (write, analyze, review, code, rewrite, document)
    |
YES -> It's a sin. Stop. Compile a chain. Spawn an agent.
NO  -> Am I coordinating? (routing, compiling chain, updating registry line, presenting plan)
    |
YES -> Proceed. This is your job.
NO  -> What am I doing? Ask yourself. Then delegate it.
```

The human can invoke this as a **reset command** by saying "it's a sin" -- the orchestrator must immediately stop, acknowledge, and recompile as a chain.

An **Objection Protocol** exists as a safety valve: the orchestrator can argue back if it believes the action is clearly permitted, citing the specific rule and evidence.

### 2.2. Delegation Hierarchy

```
Human
  |
  v
Orchestrator (ORCHESTRATOR.md)
  - Routes requests
  - Compiles chains
  - Presents plans
  - Updates registries (single-line edits only)
  |
  v
Agents (spawned via Task())
  - Execute single-responsibility work
  - Read their agent.md definition
  - Write logs
  - Report learnings
```

### 2.3. Quick Triage Override

A pragmatic exception to the Sin Doctrine exists for solo developers:

| Criteria | Quick Triage (do directly) | Full Chain (delegate) |
|----------|---------------------------|----------------------|
| Files affected | 1-3 files | 4+ files |
| Fix complexity | Obvious, mechanical | Requires analysis or design |
| Scope | Single package | Cross-package |
| Confidence | Know exactly what to change | Needs investigation |

ALL criteria must land in "Quick Triage" for the orchestrator to act directly. If ANY criteria falls into "Full Chain", delegation is mandatory.

### 2.4. The Eleven Rules

1. **Delegate Everything** -- You don't read code, write code, or run tests
2. **Stay Lightweight** -- Don't read large files or agent outputs
3. **Actions Are Building Blocks** -- Each action is a complete unit
4. **Fix Root Causes, Not Symptoms** -- Stop -> Diagnose -> Root cause -> Fix source -> Document
5. **Surface Agent Learnings to Human** -- Check every completion for learnings
6. **Plan First, Execute Second** -- Compile chain -> present -> approve -> spawn
7. **Action Modes** -- review-only/review-and-fix, audit-only/audit-and-remediate, etc.
8. **Compose First, Propose Later** -- No flow matches? Compose from actions. Propose flow only after 2+ uses
9. **Second Pass Refinement** -- After complex tasks, suggest re-running
10. **Boundary Vigilance** -- "Does a flow handle this?" -> "Should an agent own this?" -> "Am I crossing into implementation?"
11. **Framework-First Routing** -- All work routes through ActionFlows. Never bypass.

### 2.5. Pre-Action Gate

Three gates the orchestrator must pass before any tool call:

1. **Gate 1: Registry Line Edit?** -- If yes, proceed directly
2. **Gate 2: Have I Compiled a Chain?** -- If no, STOP
3. **Gate 3: What Tool Am I About to Use?** -- Read/Grep/Glob = agent work (analyze/); Edit/Write = STOP; Task spawn = must reference agent.md

---

## 3. Architecture Overview

### 3.1. Directory Structure

```
.claude/actionflows/
  |-- ORCHESTRATOR.md          # Core orchestrator philosophy and rules
  |-- ORGANIZATION.md          # Department routing map
  |-- FLOWS.md                 # Flow registry
  |-- ACTIONS.md               # Action registry
  |-- project.config.md        # Project-specific values (injected into agents)
  |-- README.md                # High-level framework description
  |
  |-- actions/                 # Atomic building blocks
  |   |-- _abstract/           # Reusable behavioral patterns (not standalone)
  |   |   |-- agent-standards/instructions.md
  |   |   |-- create-log-folder/instructions.md
  |   |   |-- update-queue/instructions.md
  |   |   |-- post-completion/instructions.md
  |   |   |-- README.md
  |   |
  |   |-- code/               # Generic code implementation
  |   |   |-- agent.md
  |   |   |-- instructions.md
  |   |   |-- backend/        # Stack-specific variant
  |   |   |   |-- agent.md
  |   |   |   |-- instructions.md
  |   |   |-- frontend/       # Stack-specific variant
  |   |       |-- agent.md
  |   |       |-- instructions.md
  |   |
  |   |-- review/             # Code/doc review
  |   |   |-- agent.md
  |   |   |-- instructions.md
  |   |
  |   |-- audit/              # Deep audits (security, architecture, perf)
  |   |   |-- agent.md
  |   |   |-- instructions.md
  |   |
  |   |-- analyze/            # Data-driven analysis
  |   |   |-- agent.md
  |   |   |-- instructions.md
  |   |
  |   |-- plan/               # Implementation planning
  |   |   |-- agent.md
  |   |   |-- instructions.md
  |   |
  |   |-- test/               # Test execution
  |   |   |-- agent.md
  |   |   |-- instructions.md
  |   |
  |   |-- commit/             # Git commit + push
  |       |-- agent.md
  |       |-- instructions.md
  |
  |-- flows/                   # Predefined action sequences by department
  |   |-- framework/
  |   |   |-- flow-creation/instructions.md
  |   |   |-- action-creation/instructions.md
  |   |   |-- action-deletion/instructions.md
  |   |   |-- framework-health/instructions.md
  |   |   |-- doc-reorganization/instructions.md
  |   |
  |   |-- engineering/
  |   |   |-- code-and-review/instructions.md
  |   |   |-- bug-triage/instructions.md
  |   |   |-- post-completion/instructions.md
  |   |
  |   |-- qa/
  |       |-- audit-and-fix/instructions.md
  |
  |-- checklists/              # Validation criteria (mostly scaffolded, not populated)
  |   |-- INDEX.md
  |   |-- README.md
  |
  |-- logs/                    # Execution history
      |-- INDEX.md             # Pattern registry
      |-- LEARNINGS.md         # Accumulated insights
      |-- README.md
      |-- plan/                # Plan action logs
      |-- code/                # Code action logs
      |-- review/              # Review action logs
      |-- docs/                # Documentation analysis logs
```

### 3.2. File Duality: agent.md vs instructions.md

Every action has TWO files:

| File | Audience | Purpose |
|------|----------|---------|
| `agent.md` | The spawned agent | Full behavioral definition -- "You are the X agent. Here's your mission, steps, constraints, and output format." |
| `instructions.md` | The orchestrator | Metadata about the action -- inputs, model, spawning pattern, gate criteria |

This separation ensures:
- The orchestrator only reads lightweight metadata (instructions.md)
- The agent reads its full behavioral definition (agent.md) but never ORCHESTRATOR.md
- The files serve different functions in the delegation chain

### 3.3. Information Flow

```
Human Request
      |
      v
ORCHESTRATOR.md    (philosophy, rules)
      |
      v
ORGANIZATION.md    (which department?)
      |
      v
FLOWS.md           (pre-existing flow?)
      |
      v
ACTIONS.md         (compose from actions?)
      |
      v
project.config.md  (inject project context)
      |
      v
Chain Compilation   (orchestrator produces action sequence)
      |
      v
Human Approval      (go/no-go gate)
      |
      v
Agent Spawning      (Task() with agent.md reference + inputs)
      |
      v
Agent Execution     (agent reads agent.md, executes, writes logs)
      |
      v
Completion Report   (learnings, output, files changed)
      |
      v
Registry Update     (orchestrator updates INDEX.md)
```

---

## 4. The Orchestrator

### 4.1. Session-Start Protocol

Every session begins with a mandatory reading sequence:

1. Read `project.config.md` -- Load project-specific context
2. Read `ORGANIZATION.md` -- Understand department routing
3. Read `FLOWS.md` -- Know what flows exist
4. Read `logs/INDEX.md` -- Check for similar past executions

This forces the orchestrator into **routing mode** instead of **help mode**. The orchestrator is explicitly warned: "You are NOT a general-purpose assistant. You are a routing coordinator."

### 4.2. Request Reception Protocol

```
Step 1: Identify what arrived (checklist? prose? framework file?)
Step 2: Parse WITHOUT reading project files (that's agent work)
Step 3: Route to department (ORGANIZATION.md)
Step 4: Find the flow (FLOWS.md)
Step 5: Compile and present chain
```

### 4.3. File Reading Permissions

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

### 4.4. Response Format Standards

The orchestrator has 7 standard response templates:
1. **Chain Compilation** -- Table with action, model, inputs, dependencies, status
2. **Execution Start** -- "Spawning Step N..."
3. **Step Completion** -- ">> Step N complete: action/ -- result"
4. **Chain Status Update** -- Updated table
5. **Execution Complete** -- Final table with outcomes
6. **Learning Surface** -- Agent learning presented to human
7. **Registry Update** -- The only direct action (add/remove lines)

### 4.5. Proactive Coordination

The orchestrator has autonomous behaviors:
- **Autonomous Follow-Through** -- Once approved, execute entire chain without stopping
- **Next-Step Anticipation** -- After chain completes, auto-compile follow-up chain
- **Preemptive Recompilation** -- When mid-chain signals indicate plan needs adjustment
- **Step Boundary Evaluation** -- 6-trigger evaluation after EVERY step

---

## 5. Organization and Routing

### 5.1. Department Structure

| Department | Owns | Key Flows |
|-----------|------|-----------|
| **Framework** | ActionFlows framework maintenance | flow-creation/, action-creation/, action-deletion/, framework-health/, doc-reorganization/ |
| **Engineering** | Code, reviews, bug fixes, refactoring | code-and-review/, bug-triage/, post-completion/ |
| **QA** | Audits, quality sweeps, security scans | audit-and-fix/ |

### 5.2. Routing Table

| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" / "add feature X" | Engineering | code-and-review/ |
| "fix bug X" / "X is broken" | Engineering | bug-triage/ |
| "refactor X" | Engineering | code-and-review/ |
| "audit security" / "security scan" | QA | audit-and-fix/ |
| "audit architecture" / "check performance" | QA | audit-and-fix/ |
| "run tests" | -- | test/ (direct action) |
| "analyze coverage" / "check dependencies" | -- | analyze/ (direct action) |
| "create a new flow" | Framework | flow-creation/ |
| "create a new action" | Framework | action-creation/ |
| "check framework health" | Framework | framework-health/ |
| "plan X" | -- | plan/ (direct action) |

---

## 6. Actions System

### 6.1. Action Catalog

| Action | Purpose | Model | Required Inputs |
|--------|---------|-------|-----------------|
| `code/` | Implement code changes (generic) | haiku | task, context |
| `code/backend/` | Backend-specific code changes | haiku | task, context |
| `code/frontend/` | Frontend-specific code changes | haiku | task, context |
| `review/` | Review code/docs/proposals | sonnet | scope, type |
| `audit/` | Comprehensive deep audits | opus | type, scope |
| `analyze/` | Data-driven analysis | sonnet | aspect, scope |
| `plan/` | Implementation planning | sonnet | requirements, context |
| `test/` | Execute tests and report | haiku | scope, type |
| `commit/` | Git commit + push | haiku | summary, files |

### 6.2. Action Modes

Three actions support extended modes:

| Action | Default Mode | Extended Mode | Behavior |
|--------|-------------|---------------|----------|
| `review/` | review-only | review-and-fix | Reviews AND applies fixes for clear-cut issues |
| `audit/` | audit-only | audit-and-remediate | Audits AND fixes CRITICAL/HIGH findings |
| `analyze/` | analyze-only | analyze-and-correct | Analyzes AND corrects drift/mismatches |

### 6.3. Model Selection Strategy

| Action Type | Model | Rationale |
|-------------|-------|-----------|
| code, code/backend, code/frontend, test, commit | haiku | Fast execution for well-defined tasks |
| review, analyze, plan | sonnet | Requires judgment and pattern recognition |
| audit | opus | Deep analysis requiring comprehensive reasoning |

### 6.4. Action Anatomy (agent.md Structure)

Every agent.md follows a standard template:

```
1. Header (identity statement)
2. Extends (abstract action references)
3. Mission (one-line purpose)
4. Steps (numbered procedure)
   - Step 1: Create Log Folder (from abstract)
   - Step 2: Parse Inputs (from orchestrator prompt)
   - Step 3: Execute Core Work (the actual task)
   - Step 4: Generate Output (write to log folder)
5. Project Context (tech stack, paths, patterns)
6. Constraints (DO / DO NOT lists)
7. Learnings Output (mandatory format)
```

### 6.5. Stack-Specific Code Actions

The `code/` action has two specializations:

- `code/backend/` -- Knows about Express Router, Zod validation, StorageProvider, WebSocket handler patterns, middleware chain, backend-specific file paths
- `code/frontend/` -- Knows about React functional components, hooks patterns, Context providers, ReactFlow, Monaco Editor, xterm.js, frontend-specific file paths

The orchestrator should prefer these over generic `code/` when the target stack is known.

---

## 7. Flows System

### 7.1. Flow Catalog

**Framework Department:**

| Flow | Chain | Purpose |
|------|-------|---------|
| `flow-creation/` | plan -> HUMAN GATE -> code -> review | Create new predefined workflows |
| `action-creation/` | plan -> HUMAN GATE -> code -> review | Create new action types |
| `action-deletion/` | analyze -> code -> review | Safely remove actions |
| `framework-health/` | analyze | Validate framework structural integrity |
| `doc-reorganization/` | analyze -> HUMAN GATE -> plan -> HUMAN GATE -> code -> review | Documentation structure improvements |

**Engineering Department:**

| Flow | Chain | Purpose |
|------|-------|---------|
| `code-and-review/` | code -> review -> (loop if needed) | Implement + review code changes |
| `bug-triage/` | analyze -> code -> test -> review | Structured bug investigation and fix |
| `post-completion/` | commit -> registry update | Wrap-up after implementation work |

**QA Department:**

| Flow | Chain | Purpose |
|------|-------|---------|
| `audit-and-fix/` | audit -> review | Comprehensive audit with remediation |

### 7.2. Flow Anatomy

Every flow instructions.md follows a standard template:

```
1. Title and description
2. When to Use (trigger conditions)
3. Required Inputs From Human (table)
4. Action Sequence (numbered steps with spawning prompts)
   - Each step has: Action, Model, Spawn template, Gate
   - HUMAN GATE steps for approval checkpoints
5. Dependencies (execution graph)
6. Chains With (what flows precede/follow)
```

### 7.3. Flow Composition Model

When no existing flow matches a request:

1. **Check FLOWS.md** -- Does a predefined flow exist?
2. **Compose from ACTIONS.md** -- Build a dynamic chain from existing actions
3. **Propose new flow** -- Only after a composed pattern recurs 2+ times

This creates a natural evolution path: ad-hoc compositions crystallize into reusable flows over time.

### 7.4. Human Gates

Flows use HUMAN GATE steps as approval checkpoints. The human reviews the plan/analysis and decides:
- **APPROVE** -- Proceed to next step
- **MODIFY** -- Provide adjustments, loop back
- **CANCEL** -- Abort the flow

---

## 8. Abstract Actions (Behavioral Mixins)

Abstract actions are reusable behavioral patterns that concrete actions reference via their "Extends" section. They are NOT standalone agents -- they are instructions that agents read and follow.

### 8.1. Catalog

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `agent-standards/` | 11 core behavioral rules | ALL agents |
| `create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `update-queue/` | Queue.md status tracking | code, review |
| `post-completion/` | Commit + registry update | Orchestrator (post-completion flow) |

### 8.2. Agent Standards (11 Rules)

1. **Single Responsibility** -- One mission per agent
2. **Token Efficiency** -- Grep before Read; skip validated files; tables not prose
3. **Fresh Eye Discovery** -- Notice issues outside explicit instructions; tag `[FRESH EYE]`
4. **Parallel Safety** -- Each agent writes to its OWN file
5. **Verify, Don't Assume** -- Never trust filenames; check contents
6. **Explicit Over Implicit** -- Concrete file paths; provide examples
7. **Output Boundaries** -- Assessment actions write to logs/; implementation actions write to project dirs
8. **Graceful Degradation** -- Step fails: continue, report; file not found: note, continue
9. **Identity Boundary** -- You are NOT an orchestrator; never read ORCHESTRATOR.md; never delegate
10. **Pre-Completion Validation** -- Validate all output files exist and are non-empty
11. **Output Boundary** (repeated emphasis) -- Never write outside designated location

### 8.3. Create Log Folder Pattern

Standardized log folder creation:

```
.claude/actionflows/logs/{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/
```

Includes specific Windows/MinGW shell warnings about `$()` substitution failures and variable pre-computation requirements.

### 8.4. Learnings Output Format

Every agent MUST include in its completion message:

```
## Learnings
**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}
[FRESH EYE] {Discovery if any}
Or: None -- execution proceeded as expected.
```

---

## 9. Agent Spawning Model

### 9.1. Spawning Pattern

```python
Task(
  subagent_type="general-purpose",
  model="{from instructions.md}",
  run_in_background=True,
  prompt="""
Read your definition in .claude/actionflows/actions/{action}/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md -- it is not for you.
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

### 9.2. Identity Isolation Layers

Three defensive layers prevent agents from becoming orchestrators:

1. **Spawning prompt guard** -- "You are a spawned subagent executor. Do NOT read ORCHESTRATOR.md."
2. **Agent-standards rule #9** -- "You are a task executor, not an orchestrator. Never read ORCHESTRATOR.md."
3. **CLAUDE.md conditional pointer** -- "Spawned subagents: ignore this -- follow your agent.md instructions instead."

### 9.3. Config Injection Rule

The orchestrator MUST inject relevant project configuration from `project.config.md` into every agent prompt. This ensures agents have the tech stack context they need without reading framework files.

---

## 10. Logging and Learning System

### 10.1. Log Structure

```
logs/
  |-- INDEX.md           # Execution pattern registry
  |-- LEARNINGS.md       # Accumulated anti-patterns and proven approaches
  |-- {action-type}/     # Action-specific log folders
      |-- {desc}_{datetime}/
          |-- report.md  (or changes.md, review-report.md, etc.)
```

### 10.2. Execution Index (INDEX.md)

Tracks:
- Recent Executions (date, description, pattern, outcome)
- By Pattern Signature (count, last used, notes)
- By Intent Type (fix, feature, refactor, audit, test, docs, infra)

**Current state:** INDEX.md is mostly unpopulated templates. No execution data recorded despite 6+ chains having been executed (visible in `logs/` subdirectories).

### 10.3. Learnings (LEARNINGS.md)

Documents:
- **Anti-Patterns** -- Indirect references for required steps; orchestrator doing project work
- **Proven Approaches** -- Registry updates only; explicit required steps

**Current state:** Contains 2 anti-patterns and 2 proven approaches. Minimal accumulation despite multiple chain executions.

### 10.4. Observed Log Outputs

From the actual log history, the following chains have executed:

| Date | Chain | Steps | Output |
|------|-------|-------|--------|
| 2026-02-07 19:39 | claude-cli-integration | plan | 757-line detailed implementation plan |
| 2026-02-07 20:03 | claude-cli-integration | code | Implementation changes log |
| 2026-02-07 20:15 | claude-cli-integration | review | 283-line comprehensive review report (review-and-fix mode) |
| 2026-02-07 21:09 | session-window-system | plan | Implementation plan |
| 2026-02-07 21:13-21:41 | session-window-system (3 phases) | code x3 | Three phased code implementations |
| 2026-02-07 21:50 | session-window-system | review | Review with fixes applied |
| 2026-02-08 04:53 | project-registry | plan | Implementation plan |
| 2026-02-08 04:57 | project-registry | code | Implementation changes |
| 2026-02-08 05:09 | project-registry | review | Review with recommended fixes |
| 2026-02-08 16:32 | doc-reorganization | plan x2 | Two plan outputs (flow definition + reorganization plan) |

---

## 11. Project-Framework Dependency Analysis

### 11.1. How the ActionFlows Dashboard Project Depends on the Framework

The ActionFlows Dashboard project uses the framework for **all development workflow orchestration**. The dependency is:

```
CLAUDE.md (project root)
    |
    |-- Points to ORCHESTRATOR.md for session-start protocol
    |-- Points to project.config.md for project-specific values
    |
    v
ORCHESTRATOR.md
    |-- Reads project.config.md at session start
    |-- Injects project context into all agent prompts
    |-- Routes requests through ORGANIZATION.md -> FLOWS.md -> ACTIONS.md
    |
    v
Agent Prompts
    |-- Contain hardcoded project context (tech stack, paths, ports)
    |-- Reference project-specific patterns (Express Router, React hooks, etc.)
    |-- Know about project packages (@afw/backend, @afw/app, @afw/shared, etc.)
```

### 11.2. Configuration Injection Points

Project-specific values are injected at multiple levels:

1. **CLAUDE.md** -- Contains full tech stack, architecture paths, domain concepts, dev commands, git conventions
2. **project.config.md** -- Detailed tech stack versions, component paths, ports, domain concepts, dev commands, git conventions (more detailed than CLAUDE.md)
3. **Spawning prompts** -- Contain inline project context (name, tech stack, paths, ports)
4. **Agent agent.md files** -- Contain project-specific "Project Context" sections with relevant subset of tech stack

### 11.3. Session-Start Protocol Dependency

The CLAUDE.md file contains a STOP instruction:

```
# STOP -- Session-Start Protocol
Before responding to ANY human message, read .claude/actionflows/ORCHESTRATOR.md and execute the session-start protocol.
Spawned subagents: ignore this -- follow your agent.md instructions instead.
```

This means the framework intercepts every Claude Code session. Without the framework, the project would revert to unstructured Claude Code usage.

### 11.4. Project Context in Agents

Each agent's agent.md contains a "Project Context" section that hardcodes project-specific information:

- **code/backend/agent.md** -- Knows Express 4.18, ws 8.14.2, ioredis 5.3, Zod 3.22, route patterns, service patterns, storage patterns
- **code/frontend/agent.md** -- Knows React 18.2, Vite 5, Electron 28, ReactFlow 11.10, Monaco Editor, xterm, hook patterns
- **review/agent.md** -- Knows monorepo structure, all packages, validation patterns, testing framework
- **plan/agent.md** -- Knows data flow order (shared -> backend -> frontend), ports, cross-package patterns
- **audit/agent.md** -- Knows security surfaces (REST, WebSocket, Electron IPC, file system, Redis)

This means **the agents are tightly coupled to this specific project**. Reusing the framework for a different project would require updating:
- project.config.md
- All agent.md "Project Context" sections
- The spawning prompt template in ORCHESTRATOR.md and ACTIONS.md

---

## 12. Quantitative Inventory

### 12.1. File Counts

| Category | Count |
|----------|-------|
| Core framework files | 6 (ORCHESTRATOR.md, ORGANIZATION.md, FLOWS.md, ACTIONS.md, project.config.md, README.md) |
| Actions (concrete) | 9 (code, code/backend, code/frontend, review, audit, analyze, plan, test, commit) |
| Actions (abstract) | 4 (agent-standards, create-log-folder, update-queue, post-completion) |
| Flows | 9 (flow-creation, action-creation, action-deletion, framework-health, doc-reorganization, code-and-review, bug-triage, post-completion, audit-and-fix) |
| Checklists | 0 (scaffolded but empty) |
| Log folders | 10 (across plan, code, review, docs) |
| Total framework files | ~58 .md files |

### 12.2. Agent File Pairs

| Action | Has agent.md | Has instructions.md | Complete Pair |
|--------|-------------|---------------------|---------------|
| code/ | Yes | Yes | Yes |
| code/backend/ | Yes | Yes | Yes |
| code/frontend/ | Yes | Yes | Yes |
| review/ | Yes | Yes | Yes |
| audit/ | Yes | Yes | Yes |
| analyze/ | Yes | Yes | Yes |
| plan/ | Yes | Yes | Yes |
| test/ | Yes | Yes | Yes |
| commit/ | Yes | Yes | Yes |

All 9 concrete actions have complete file pairs.

### 12.3. Flow-Department Alignment

| Department (ORGANIZATION.md) | Flows in FLOWS.md | Flow dirs on disk | Match? |
|------------------------------|-------------------|-------------------|--------|
| Framework | 4 listed | 5 on disk (includes doc-reorganization/) | DRIFT: doc-reorganization/ exists on disk but NOT in FLOWS.md |
| Engineering | 3 listed | 3 on disk | Match |
| QA | 1 listed | 1 on disk | Match |

### 12.4. Log Output Metrics

From examining actual log outputs:

| Metric | Value |
|--------|-------|
| Largest plan output | 757 lines (claude-cli-integration plan) |
| Largest review output | 283 lines (claude-cli-integration review) |
| Plans executed | 4 |
| Code actions executed | 5 |
| Reviews executed | 3 |
| Total chain executions observed | ~5 distinct chains |
| INDEX.md entries | 0 (never populated) |
| LEARNINGS.md entries | 4 (2 anti-patterns, 2 proven approaches) |

---

## 13. Improvement Areas and Gaps

### 13.1. CRITICAL: INDEX.md Never Populated

**Issue:** INDEX.md has template placeholders but zero actual execution data, despite 10+ log folders existing across plan/, code/, and review/ directories.

**Root Cause:** The post-completion flow says "This is handled by the orchestrator as a registry line edit," but there is no enforcement mechanism. The orchestrator either forgets or skips this step.

**Impact:** The purpose of INDEX.md is for the orchestrator to read past executions before compiling new chains ("Check for similar past executions"). With no data, this lookup always returns nothing, negating the pattern-learning capability.

**Suggestion:** Add INDEX.md update as a mandatory step in the `commit/` agent (not the orchestrator), or add it to `post-completion/instructions.md` as an explicit agent step rather than an orchestrator task.

### 13.2. CRITICAL: doc-reorganization/ Flow Not Registered in FLOWS.md

**Issue:** `flows/framework/doc-reorganization/instructions.md` exists on disk (202 lines, fully defined) but is NOT listed in FLOWS.md under the Framework department.

**Root Cause:** The flow was likely created manually or by an agent but the FLOWS.md registry was never updated.

**Impact:** The orchestrator reads FLOWS.md during routing. Since doc-reorganization/ is not registered, it will never be routed to this flow, even when the human requests documentation reorganization.

**Suggestion:** Add to FLOWS.md:
```
| doc-reorganization/ | Analyze and restructure docs | analyze -> plan -> code -> review |
```

### 13.3. HIGH: LEARNINGS.md Underutilized

**Issue:** Only 4 entries in LEARNINGS.md despite 10+ agent executions. Agents are required to produce learnings output, but most learnings never make it to the aggregated file.

**Root Cause:** The orchestrator is supposed to surface agent learnings and add them to LEARNINGS.md, but this is a manual orchestrator step with no enforcement.

**Impact:** The framework's learning loop (execute -> learn -> improve) is broken. The same mistakes can recur across sessions.

**Suggestion:** Make learnings propagation part of the post-completion flow, or create a dedicated `learnings-aggregation/` action that scans log folders for unpropagated learnings.

### 13.4. HIGH: Checklists Directory Empty

**Issue:** `checklists/INDEX.md` has template placeholders but zero actual checklists. The `checklists/README.md` describes the system (technical/ and functional/ categories, priority levels p0-p3), but no checklist files exist.

**Root Cause:** Checklists were planned but never created.

**Impact:** The review agent supports a `checklist` input for validation against specific criteria. Without any checklists, this capability is unused, and reviews rely entirely on the agent's general judgment rather than project-specific criteria.

**Suggestion:** Create at least p0 checklists for security and p1 checklists for API consistency and TypeScript quality. These would standardize review quality across sessions.

### 13.5. HIGH: Duplicated Project Context Across Files

**Issue:** Project context (tech stack, paths, ports, domain concepts) is duplicated across:
1. CLAUDE.md
2. project.config.md
3. Every agent.md "Project Context" section
4. The spawning prompt template (appears in both ORCHESTRATOR.md and ACTIONS.md)

**Root Cause:** The framework has no single-source-of-truth mechanism. Each file contains its own copy of project details.

**Impact:** When the project changes (new package added, version bumped, port changed), ALL of these files must be manually updated. This creates drift risk. For example, if a new route file is added to the backend, only `code/backend/agent.md` would know about it until all other files are updated.

**Suggestion:** Make `project.config.md` the definitive single source of truth. Reduce agent.md "Project Context" sections to just what that specific agent needs. Have the spawning prompt reference project.config.md sections by name rather than inlining all values.

### 13.6. MEDIUM: No Dedicated "docs/" or "documentation/" Action

**Issue:** Documentation tasks are routed through the generic `code/` action. The doc-reorganization flow uses `code/` for execution, and there is no action specialized for documentation work.

**Root Cause:** Documentation was not anticipated as a distinct action type during framework creation.

**Impact:** The `code/` agent's constraints and patterns are oriented toward TypeScript code (Express Router patterns, React hooks, Zod validation). When used for documentation tasks, these constraints are irrelevant and may confuse the agent.

**Suggestion:** Consider creating a `docs/` action with appropriate constraints for markdown editing, cross-reference validation, and documentation structure patterns.

### 13.7. MEDIUM: No "deploy/" or "release/" Action or Flow

**Issue:** The framework has no deployment or release workflow. The global CLAUDE.md mentions "Rebuild and redeploy whenever you make code changes" but there is no corresponding action or flow.

**Root Cause:** Deployment was not formalized in the framework.

**Impact:** Deployments happen outside the framework, breaking the "Framework-First Routing" rule (#11). The orchestrator has no way to route "deploy this" requests.

**Suggestion:** Create a `deploy/` action (or at minimum, document the deployment process in project.config.md so agents know how to trigger rebuilds).

### 13.8. MEDIUM: Spawning Prompt Template Hardcoded in Two Places

**Issue:** The spawning prompt template appears identically in both `ORCHESTRATOR.md` (lines 320-344) and `ACTIONS.md` (lines 79-105). These are separate copies that must be kept in sync.

**Root Cause:** Both files describe the spawning pattern for different audiences (orchestrator rules vs action registry), but they use the same template.

**Impact:** If one is updated and the other is not, agents may receive inconsistent context.

**Suggestion:** Consolidate the spawning template to one location (ACTIONS.md, since it's the action registry) and have ORCHESTRATOR.md reference it.

### 13.9. MEDIUM: No Error Handling Flow

**Issue:** If a chain step fails (agent crashes, produces empty output, or reports a critical error), there is no defined recovery flow. The orchestrator relies on general rules ("Fix Root Causes, Not Symptoms") but has no structured process.

**Root Cause:** Error recovery was not formalized as a flow.

**Impact:** Chain failures are handled ad-hoc, which can lead to inconsistent responses (sometimes retry, sometimes abort, sometimes ignore).

**Suggestion:** Define an error-handling protocol in ORCHESTRATOR.md that specifies: when to retry, when to abort, when to escalate to human, and how to handle partial completion.

### 13.10. MEDIUM: analyze/ Agent Aspects vs Spawning Inputs Mismatch

**Issue:** The analyze agent's instructions.md uses `aspect` as input name, but the doc-reorganization flow spawns it with `target`, `focus`, and `output-format` inputs that don't match the defined interface.

**Root Cause:** The doc-reorganization flow was created after the analyze action and uses custom input names.

**Impact:** The analyze agent may not correctly parse inputs from the doc-reorganization flow since they don't match the defined input schema (aspect, scope, context, mode).

**Suggestion:** Update the doc-reorganization flow to use the analyze agent's defined input names, or expand the analyze agent's input schema.

### 13.11. LOW: No Automated Framework Health Checks

**Issue:** The `framework-health/` flow exists but must be manually triggered. There is no automation to run it periodically (e.g., "every 5-10 chain executions" as recommended).

**Root Cause:** No counter or trigger mechanism exists for auto-running flows.

**Impact:** Framework drift (like the doc-reorganization FLOWS.md gap identified above) accumulates undetected until someone manually triggers a health check.

**Suggestion:** Add a counter to INDEX.md that tracks total executions, and include a reminder in ORCHESTRATOR.md to suggest framework-health/ after every N executions.

### 13.12. LOW: No MCP Server Action

**Issue:** The project has an MCP server package (`packages/mcp-server/`), but no action or flow is specialized for MCP server development.

**Root Cause:** MCP server was not anticipated as needing specialized patterns.

**Impact:** MCP server changes are routed through generic `code/` action, which doesn't know about MCP protocol patterns, tool definitions, or MCP SDK conventions.

**Suggestion:** Consider adding `code/mcp-server/` action if MCP server changes become frequent.

### 13.13. LOW: Post-Completion Flow Has Structural Ambiguity

**Issue:** The post-completion flow's Step 2 says "This is handled by the orchestrator as a registry line edit." But the `_abstract/post-completion/instructions.md` describes it as a two-step agent process (commit + registry update). These are inconsistent.

**Root Cause:** The post-completion responsibilities are split between flow instructions and abstract action instructions, with conflicting descriptions of who does what.

**Impact:** Unclear execution boundary -- is registry update an orchestrator task or an agent task?

**Suggestion:** Consolidate: either make the `commit/` agent also update INDEX.md, or explicitly document that the orchestrator handles Step 2 after the commit agent completes.

### 13.14. LOW: Notification System Disabled

**Issue:** `project.config.md` states "Notifications stripped from all actions. Re-enable by adding a notify/ action." But the global CLAUDE.md (user's private instructions) expects Slack notifications for completions, milestones, deployments, test failures, and blockers.

**Root Cause:** The project-level config disabled notifications, but the user's global config still expects them.

**Impact:** Conflicting instructions. Agents may or may not attempt notifications depending on which config they read first.

**Suggestion:** Either re-enable notifications by creating the `notify/` action, or remove the Slack notification expectations from the user's global CLAUDE.md for this project.

---

## 14. Design Decisions and Rationale

### 14.1. Why Markdown Instead of Code?

The framework is entirely markdown because:
- **Zero runtime dependency** -- No build step, no packages, no server
- **LLM-native** -- Claude Code reads and writes markdown natively; markdown IS the instruction format
- **Version-controlled** -- Changes to the framework are tracked in git like any other project file
- **Human-readable** -- Developers can read, understand, and modify the framework without learning an API
- **Portable** -- Copy the `.claude/actionflows/` directory to any project

### 14.2. Why Split agent.md and instructions.md?

The separation serves the delegation hierarchy:
- The orchestrator needs to know WHAT an action does, WHAT it needs, and WHAT model to use -- but NOT the full behavioral definition
- The agent needs its full behavioral definition but should NEVER know about the orchestrator's rules

This also reduces token consumption: the orchestrator reads only the lightweight instructions.md.

### 14.3. Why the Sin Doctrine?

Without it, Claude Code naturally defaults to being a general-purpose assistant -- it will read code, write code, run tests, all in one session. This is efficient for small tasks but creates:
- **No audit trail** -- Who changed what? What was reviewed?
- **No quality gates** -- Code is written and committed without review
- **No learning loop** -- Insights from one session don't persist to the next
- **No separation of concerns** -- The same context does analysis, implementation, and review

The Sin Doctrine forces structured delegation, which produces auditable, reviewable, learnable work.

### 14.4. Why Three Models (haiku, sonnet, opus)?

The model selection optimizes for cost and speed:
- **haiku** -- Fast, cheap, good for mechanical tasks (code from a plan, test execution, git commit)
- **sonnet** -- Balanced, good for judgment tasks (review quality, analyze patterns, create plans)
- **opus** -- Slow but thorough, good for deep analysis (security audit, architecture audit)

This prevents using expensive models for simple tasks and ensures adequate reasoning power for complex tasks.

### 14.5. Why Abstract Actions?

Abstract actions implement the DRY principle for agent behaviors:
- Every agent needs to follow behavioral standards -> `agent-standards/`
- Most agents need to create log folders -> `create-log-folder/`
- Some agents need to update queue status -> `update-queue/`

Without abstracts, these behaviors would be duplicated across 9+ agent.md files.

---

## Summary

ActionFlows is a well-designed orchestration framework that successfully transforms Claude Code into a structured project manager. Its core strengths are:

1. **Strong philosophical foundation** -- The Sin Doctrine creates clear boundaries
2. **Clean separation of concerns** -- Orchestrator vs agents, agent.md vs instructions.md
3. **Comprehensive action catalog** -- 9 concrete actions covering plan/code/review/test/audit/analyze/commit
4. **Self-modifying capability** -- Can create/delete its own actions and flows
5. **Learning system** -- Designed for accumulated insights across sessions

Its primary weaknesses are:

1. **Execution tracking gap** -- INDEX.md is never populated, breaking pattern learning
2. **Registry drift** -- doc-reorganization flow exists but is unregistered
3. **Project context duplication** -- Same values repeated across 10+ files
4. **Missing capabilities** -- No deploy action, no docs action, no error recovery flow
5. **Checklist system unused** -- Scaffolded but empty
6. **Notification conflict** -- Disabled in project config but expected in user config

The framework is tightly coupled to the ActionFlows Dashboard project through hardcoded context in agent definitions and spawning templates. Making it project-agnostic would require parameterizing all project-specific values through project.config.md alone.
