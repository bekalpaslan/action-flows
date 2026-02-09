# ActionFlows Framework Inventory for Onboarding Questionnaire

> **Purpose:** Comprehensive catalog of framework files, structures, patterns, and agent instruction architecture to inform an ideation session about creating an onboarding questionnaire for new projects.

---

## Executive Summary

The ActionFlows framework is a **three-layer orchestration system** where:
1. **Orchestrator** compiles chains and spawns agents (never produces content)
2. **Flows** are predefined action sequences organized by department
3. **Actions** are atomic building blocks with agent.md (behavior) + instructions.md (metadata)

**Key Discovery:** The framework has a comprehensive **bootstrap.md** file (38,147 tokens) that provides step-by-step instructions for creating the framework in new projects. This is the foundational onboarding mechanism already in place.

---

## 1. Framework File Structure

### 1.1 Top-Level Organization

```
.claude/
├── CLAUDE.md                    # Lean project context (all agents read this)
├── bootstrap.md                 # Comprehensive bootstrap prompt (38,147 tokens)
└── actionflows/
    ├── ORCHESTRATOR.md          # Orchestration rules (only orchestrator reads)
    ├── ORGANIZATION.md          # Department routing map
    ├── FLOWS.md                 # Flow registry
    ├── ACTIONS.md               # Action registry
    ├── project.config.md        # Single source of truth for project values
    ├── README.md                # Framework overview
    ├── actions/                 # Atomic building blocks
    ├── flows/                   # Predefined sequences
    ├── checklists/              # Validation criteria
    └── logs/                    # Execution history
```

### 1.2 Actions Directory Structure

**Total Actions:** 8 generic + 2 stack-specific + 4 abstract patterns

```
actions/
├── _abstract/                   # Reusable behavior patterns
│   ├── agent-standards/         # 11 core principles
│   ├── create-log-folder/       # Datetime folder creation
│   ├── post-completion/         # Commit + registry update
│   └── update-queue/            # Queue.md status tracking
├── analyze/                     # Data-driven analysis
├── audit/                       # Deep-dive audits
├── brainstorm/                  # Interactive ideation (foreground)
├── code/                        # Generic implementation
│   ├── backend/                 # Express + TypeScript + Zod
│   └── frontend/                # React + Vite + Electron
├── commit/                      # Git operations
├── plan/                        # Implementation planning
├── review/                      # Quality assessment
├── second-opinion/              # Ollama critique (code-backed)
└── test/                        # Test execution
```

**Each action contains:**
- `agent.md` - Behavior definition for spawned agents
- `instructions.md` - Metadata for orchestrator (inputs, model, gates)

### 1.3 Flows Directory Structure

**Total Flows:** 10 flows across 4 departments

```
flows/
├── engineering/
│   ├── bug-triage/              # analyze → code → test → review
│   ├── code-and-review/         # code → review → second-opinion
│   └── post-completion/         # commit → registry update
├── framework/
│   ├── action-creation/         # plan → gate → code → review
│   ├── action-deletion/         # analyze → code → review
│   ├── doc-reorganization/      # analyze → gate → plan → gate → code → review
│   ├── flow-creation/           # plan → gate → code → review
│   └── framework-health/        # analyze
├── human/
│   └── ideation/                # classify → analyze → brainstorm → code (summary)
└── qa/
    └── audit-and-fix/           # audit → second-opinion → review
```

**Each flow contains:**
- `instructions.md` - Step sequence, gates, dependencies, spawning patterns

### 1.4 Logs Directory Structure

```
logs/
├── INDEX.md                     # Execution registry (orchestrator reads first)
├── LEARNINGS.md                 # Aggregated learnings (prevents repeat mistakes)
├── README.md                    # Log folder documentation
├── analyze/{description}_{datetime}/
├── code/{description}_{datetime}/
├── plan/{description}_{datetime}/
├── review/{description}_{datetime}/
└── second-opinion/{description}_{datetime}/
```

**Naming pattern:** `{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/`

---

## 2. Core Framework Concepts

### 2.1 Three Defense Layers for Identity Isolation

**Problem:** Prevent subagents from reading orchestrator rules and delegating work.

**Solution:**
1. **Spawning prompt guard** - "Do NOT read ORCHESTRATOR.md — it is not for you"
2. **Agent-standards rule #9** - "You are a task executor, not an orchestrator. Never read ORCHESTRATOR.md."
3. **CLAUDE.md conditional pointer** - "Spawned subagents: ignore this — follow your agent.md instructions instead"

### 2.2 The Sin Test (Orchestrator Boundary Enforcement)

**Core principle:** If the orchestrator produces content, it's sinning.

```
Am I about to produce content? (write, analyze, review, code, rewrite, document)
    ↓
YES → It's a sin. Stop. Compile a chain. Spawn an agent.
NO  → Am I coordinating? (routing, compiling chain, updating registry line, presenting plan)
    ↓
YES → Proceed. This is your job.
NO  → What am I doing? Ask yourself. Then delegate it.
```

**Recovery protocol:**
1. Stop immediately
2. Acknowledge the sin
3. Compile the chain
4. Execute through agents

**Objection protocol:** Orchestrator can challenge "it's a sin" if clearly within permitted boundaries.

### 2.3 Quick Triage Mode (Solo Developer Override)

**Before delegation, check:**
| Criteria | Quick Triage | Full Chain |
|----------|--------------|------------|
| Files affected | 1-3 files | 4+ files |
| Fix complexity | Obvious, mechanical | Requires analysis |
| Scope | Single package | Cross-package |
| Confidence | Know exactly what to change | Needs investigation |

**If ALL criteria land in "Quick Triage":**
- Orchestrator MAY implement directly
- MUST still commit via commit/ action
- MUST note `[QUICK TRIAGE]` in response

### 2.4 Meta-Task Size Threshold (For Framework Files)

| Criteria | Direct (registry edit) | Delegate (compile chain) |
|----------|------------------------|--------------------------|
| Lines changed | < 5 lines | 5+ lines |
| Files affected | 1 file | 2+ files |
| Nature | Add entry, update count | Structural rewrite, content generation |
| Judgment needed | Mechanical | Creative |

**If ANY column lands in "Delegate" → compile a chain.**

### 2.5 Action Modes

| Action | Default Mode | Extended Mode | Behavior |
|--------|--------------|---------------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes clear-cut bugs |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift |

### 2.6 Second Opinion Protocol

**Auto-trigger (always inserted):**
- After `review/` steps
- After `audit/` steps

**Opt-in (orchestrator flag):**
- After `analyze/` steps
- After `plan/` steps

**Critical rule:** Commit waits for ORIGINAL action, NOT second-opinion. Second opinion never blocks workflow.

**Presentation format:**
```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- {critique summary or SKIPPED}.

### Dual Output: {action/} + Second Opinion
[Present both outputs together]
```

---

## 3. Agent Instruction Architecture

### 3.1 Two-File Pattern

**Every action has:**
1. **agent.md** - Behavior definition (what the agent does)
2. **instructions.md** - Metadata (what the orchestrator needs to know)

### 3.2 agent.md Structure

**Standard sections:**
```markdown
# {Action Name} Agent

You are the {action} agent for ActionFlows Dashboard. {Mission statement}.

## Extends
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` — Datetime log folder

## Your Mission
{Clear statement of what this agent does}

## Steps to Complete This Action
### 1. Create Log Folder
### 2. Parse Inputs
### 3. Execute Core Work
### 4. Generate Output

## Project Context
{Project-specific details}

## Constraints
### DO
### DO NOT

## Learnings Output
{Required format for completion message}
```

### 3.3 instructions.md Structure

**Standard sections:**
```markdown
# {Action Name} Action

> {One-line purpose}

## Requires Input: YES/NO

## Extends
{Abstract actions this executes}

## Inputs
| Input | Required | Description | Default |

## Model
{haiku/sonnet/opus} — {Why this model}

## How Orchestrator Spawns This
{Example spawning pattern}

## Gate
{What this action produces}

## Notes
{Important behavioral details}
```

### 3.4 Abstract Actions (Instructed Behaviors)

**Not standalone agents — reusable patterns embedded into concrete actions.**

| Abstract | Purpose | Used By |
|----------|---------|---------|
| agent-standards/ | 11 core behavioral principles | ALL agents |
| create-log-folder/ | Datetime-isolated output folders | code, review, audit, analyze, test, plan |
| post-completion/ | Commit → update registry | Orchestrator (post-completion flow) |
| update-queue/ | Queue.md status updates | code, review (when queue exists) |

**Pattern:** Action's agent.md says "Extends: agent-standards" → Agent reads and follows those instructions.

### 3.5 Agent Standards (11 Core Principles)

1. **Single Responsibility** - One clear mission per agent
2. **Token Efficiency** - Grep before Read, skip files that pass validation
3. **Fresh Eye Discovery** - Notice issues outside explicit instructions, tag with `[FRESH EYE]`
4. **Parallel Safety** - Each parallel agent writes to OWN file
5. **Verify, Don't Assume** - Always check contents before referencing
6. **Explicit Over Implicit** - Concrete file paths, not relative references
7. **Output Boundaries** - Assessment actions → logs/, implementation actions → project dirs
8. **Graceful Degradation** - Step fails → continue with remaining, report failures
9. **Identity Boundary** - Never read ORCHESTRATOR.md, never delegate, execute directly
10. **Pre-Completion Validation** - Verify all output files exist and are non-empty
11. **Output Boundary** (duplicate of 7, reinforced)

### 3.6 Spawning Pattern

**Standard template:**
```python
Task(
  subagent_type="general-purpose",
  model="{from instructions.md}",
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

**Config injection rule:** Always inject relevant project config from project.config.md.

---

## 4. Existing Bootstrap Patterns

### 4.1 bootstrap.md Overview

**File size:** 38,147 tokens (too large for single read)

**Purpose:** Comprehensive step-by-step guide for creating ActionFlows framework in new projects.

**Key sections (from first 200 lines):**
1. **Your Role** - Builder vs Orchestrator distinction
2. **Absolute Prohibition** - For future orchestrator, not builder
3. **Session-Start Protocol** - What to encode into ORCHESTRATOR.md
4. **Your Mission** - Bootstrap framework into project
5. **Part 1: Framework Concept** - Three-layer architecture
6. **Part 2: Philosophy** - Orchestrator enforcement rules

**Builder vs Orchestrator exemption pattern:**
```
During bootstrapping: You ARE a worker. Read code, write files, produce content.
After bootstrapping: Orchestrator delegates everything. Never produces content.
```

### 4.2 Bootstrap Process Flow

**From first 200 lines:**
1. Read project files to discover stack
2. Identify what actions, flows, departments needed
3. Create framework structure
4. Populate templates with project-specific values
5. Write CLAUDE.md with lean project context
6. Write ORCHESTRATOR.md with orchestration rules
7. Create actions/, flows/, checklists/
8. Verify everything works

**Step count:** 10 steps (Steps 1-10 mentioned in content)

### 4.3 CLAUDE.md Architecture

**Purpose:** Lean project context (all agents read this)

**Contents:**
- Session-start protocol pointer
- Project name and description
- Tech stack summary
- Architecture paths
- Domain concepts
- Development commands
- Git conventions

**Split from ORCHESTRATOR.md:**
- CLAUDE.md = project context (all agents)
- ORCHESTRATOR.md = orchestration rules (only orchestrator)

This prevents subagents from reading orchestrator rules.

---

## 5. Current Project Patterns

### 5.1 Project Configuration (project.config.md)

**Single source of truth for:**
- Project name, description, working directory
- Tech stack (backend, frontend, shared, MCP server, hooks)
- Architecture paths (routes, services, storage, components, hooks)
- Ports (backend 3001, vite 5173, electron N/A)
- Domain concepts (SessionId, ChainId, StepId, UserId)
- Development commands (pnpm install, build, dev, type-check)
- Git conventions (commit style, co-author, branch format)
- Notification status (currently disabled)

**Referenced by:**
- CLAUDE.md (imports values)
- Orchestrator (injects into agent prompts)

### 5.2 Department Routing

**4 departments:**
1. **Framework** - ActionFlows maintenance (flow/action creation, health checks)
2. **Engineering** - Code implementation, reviews, bug fixes
3. **QA** - Audits, quality sweeps
4. **Human** - Ideation, brainstorming

**Routing table:**
| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" | Engineering | code-and-review/ |
| "fix bug X" | Engineering | bug-triage/ |
| "audit security" | QA | audit-and-fix/ |
| "create a new flow" | Framework | flow-creation/ |
| "I have an idea" | Human | ideation/ |
| "analyze coverage" | — | analyze/ (direct action) |

### 5.3 Execution History Patterns

**From INDEX.md (last 7 executions):**
| Date | Pattern | Outcome |
|------|---------|---------|
| 2026-02-08 | code×8 → review → second-opinion → commit | Success - Phase 2 Pattern Detection |
| 2026-02-08 | code×8 → review → second-opinion → commit | Success - Phase 1 Button System |
| 2026-02-08 | plan → code → review → commit | Success - Wire second-opinion |
| 2026-02-08 | analyze → plan → code → review → commit | Success - Doc reorganization |
| 2026-02-08 | analyze×4 → plan → code×2 → review → commit | Success - FRD & SRD docs |
| 2026-02-08 | plan → human gate → code → review → commit | Success - Ideation flow creation |
| 2026-02-08 | analyze → plan/code → review → second-opinion → code → review → commit | Success - Self-Evolving UI FRD/SRD |

**Pattern signatures tracked:**
- plan → code → review → commit (framework integration)
- plan → human gate → code → review → commit (flow creation with approval)
- analyze → plan → code → review → commit (large-scope work)
- analyze×4 → plan → code×2 → review → commit (parallel analysis + parallel writing)

**Intent types tracked:**
- fix, feature, refactor, audit, test, docs, infra

### 5.4 Checklist System

**Structure:**
```
checklists/
├── technical/
│   └── p{0-3}-{topic}.md
└── functional/
    └── p{0-3}-{feature-name}-review.md
```

**Priority levels:**
- p0: Critical (security, auth, data integrity)
- p1: High (core features, API contracts)
- p2: Medium (test quality, UI patterns)
- p3: Low (code style, documentation)

**Current status:** INDEX.md shows "populated as checklists are created" - empty catalog.

---

## 6. Agent Instruction Patterns

### 6.1 Input Parsing Pattern

**All agent.md files use:**
```markdown
### 2. Parse Inputs
Read inputs from the orchestrator's prompt:
- `{input1}` — {description}
- `{input2}` — {description}
- `{input3}` (optional) — {description}
```

**Example from analyze/agent.md:**
```
- `aspect` — Analysis type: coverage, dependencies, structure, drift, inventory, impact
- `scope` — What to analyze: directories, file patterns, or "all"
- `context` (optional) — Additional context about what to look for
- `mode` (optional) — analyze-only (default) or analyze-and-correct
```

### 6.2 Log Folder Creation Pattern

**All assessment actions follow:**
```bash
description="auth-changes"
datetime=$(date +%Y-%m-%d-%H-%M-%S)
folder=".claude/actionflows/logs/review/${description}_${datetime}"
mkdir -p "$folder"
```

**Critical warnings:**
- Pre-compute values into variables FIRST
- Substitute ALL variables BEFORE constructing path string
- Windows shell substitution failures with `$()`
- Description must be kebab-case, no spaces or special chars

### 6.3 Learnings Output Format

**Required in ALL agent completion messages:**
```markdown
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside your explicit instructions}

Or: None — execution proceeded as expected.
```

**Purpose:** Surface to orchestrator → aggregate in LEARNINGS.md → prevent repeat mistakes.

### 6.4 Gate Pattern

**Definition from instructions.md:**
```markdown
## Gate
{What this action produces and when it's complete}
```

**Examples:**
- analyze/ → "Context inventory delivered"
- plan/ → "Plan delivered with actionable, ordered steps"
- review/ → "Verdict delivered (APPROVED or NEEDS_CHANGES)"
- commit/ → "Commit created with conventional commit message"

**Purpose:** Orchestrator knows when to proceed to next step in chain.

### 6.5 Model Selection Guidelines

| Action Type | Model | Why |
|-------------|-------|-----|
| code, test, commit | haiku | Fast, simple execution |
| review, analyze, plan | sonnet | Needs judgment |
| audit, brainstorm | opus | Deep analysis needed |
| second-opinion | haiku | Lightweight CLI wrapper |

### 6.6 Foreground vs Background Execution

**Background (default):**
- All actions except brainstorm/
- `run_in_background=True`
- Orchestrator waits for completion before next step

**Foreground (special case):**
- brainstorm/ action only
- Interactive back-and-forth with human
- No timeout pressure
- Human signals when done ("That's enough", "Let's wrap up")

---

## 7. Framework Compatibility Requirements

### 7.1 File Structure Requirements

**MUST have:**
```
.claude/
├── CLAUDE.md                    # Project context
├── actionflows/
│   ├── ORCHESTRATOR.md          # Orchestration rules
│   ├── ORGANIZATION.md          # Department routing
│   ├── FLOWS.md                 # Flow registry
│   ├── ACTIONS.md               # Action registry
│   ├── project.config.md        # Project values
│   ├── actions/
│   │   └── _abstract/
│   │       ├── agent-standards/
│   │       └── create-log-folder/
│   └── logs/
│       ├── INDEX.md
│       └── LEARNINGS.md
```

### 7.2 Action File Requirements

**Each action directory MUST contain:**
- `agent.md` - Behavior definition
- `instructions.md` - Metadata for orchestrator

**Each agent.md MUST include:**
- Extends section (references to abstract actions)
- Mission statement
- Steps to Complete This Action
- Project Context
- Constraints (DO/DO NOT)
- Learnings Output format

**Each instructions.md MUST include:**
- Requires Input: YES/NO
- Extends (abstract actions)
- Inputs table (if required)
- Model specification
- How Orchestrator Spawns This
- Gate definition

### 7.3 Flow File Requirements

**Each flow directory MUST contain:**
- `instructions.md` - Step sequence definition

**Each flow instructions.md MUST include:**
- When to Use
- Required Inputs From Human (table)
- Action Sequence (numbered steps)
- Dependencies (chain diagram)
- Chains With (follow-up flows)

### 7.4 Registry File Requirements

**ORGANIZATION.md MUST have:**
- Department definitions (Owns, Key Flows, Triggers)
- Routing table

**FLOWS.md MUST have:**
- Flow registry by department (table: Flow, Purpose, Chain)

**ACTIONS.md MUST have:**
- Abstract actions section
- Generic actions table
- Stack-specific actions table
- Code-backed actions table
- Action modes table
- Model selection guidelines
- Spawning pattern example

**INDEX.md MUST have:**
- Recent Executions table
- By Pattern Signature table
- By Intent Type table

**LEARNINGS.md MUST have:**
- Foundational principle
- By Action Type sections (added as needed)
- Anti-Patterns section
- Proven Approaches section

---

## 8. Behavioral Patterns & Answering Conventions

### 8.1 Session-Start Protocol (Orchestrator)

**Before responding to ANY human message:**
0. Read `project.config.md` - Load project-specific context
1. Read `ORGANIZATION.md` - Understand department routing
2. Read `FLOWS.md` - Know what flows exist
3. Read `logs/INDEX.md` - Check for similar past executions

**Purpose:** Force routing mode instead of help mode.

### 8.2 Chain Compilation Format

**Standard presentation:**
```markdown
## Chain: {Brief Title}

**Request:** {One-line human intent}
**Source:** {flow-name/ | Composed from: action1 + action2 + action3}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | input=value | -- | Pending |
| 2 | action/ | model | input=value | #1 | Pending |

**Execution:** {Sequential | Parallel: [1,2] -> [3]}

What each step does:
1. **{Action}** -- {What this agent does and produces}
2. **{Action}** -- {What this agent does and produces}

Execute?
```

### 8.3 Step Completion Format

**Standard announcement:**
```
>> Step {N} complete: {action/} -- {one-line result}. Continuing to Step {N+1}...
```

**With second opinion:**
```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- {critique summary or SKIPPED}.

### Dual Output: {action/} + Second Opinion
{Present both outputs together}

Continuing to Step {N+2}...
```

### 8.4 Registry Update Format

**Only direct action orchestrator can take:**
```markdown
## Registry Update: {Brief Title}

**File:** {registry file}
**Line:** {added/removed/updated}: "{the line}"

Done.
```

### 8.5 Learning Surface Format

**When agent reports learnings:**
```markdown
## Agent Learning

**From:** {action/} ({model})
**Issue:** "{what happened}"
**Root cause:** "{why}"

**Suggested fix:** {orchestrator's proposed solution}

Implement?
```

### 8.6 Human Gate Format

**When flow requires approval:**
```markdown
### Step {N}: HUMAN GATE

{Present what was produced}

{Ask for approval to continue}
```

**Example from action-creation flow:**
> Step 2: HUMAN GATE - Present the action design for approval. Human reviews the proposed agent.md structure, inputs, and model.

### 8.7 Proactive Coordination Behaviors

**Once chain approved, orchestrator:**
1. **Autonomous Follow-Through** - Execute entire chain without stopping between steps
2. **Next-Step Anticipation** - After completion, auto-compile follow-up chain
3. **Preemptive Chain Recompilation** - Mid-chain signals → adjust remaining steps
4. **Step Boundary Evaluation** - After EVERY step, check 6 triggers:
   - Agent output signals
   - Pattern recognition
   - Dependency discovery
   - Quality threshold
   - Chain redesign initiative
   - Reuse opportunity

**If trigger fires within original scope:** Recompile and announce
**If trigger expands scope:** STOP and present to human

---

## 9. Key Gaps & Opportunities for Questionnaire

### 9.1 Current Bootstrap Limitations

**bootstrap.md strengths:**
- Comprehensive (38,147 tokens)
- Clear builder vs orchestrator distinction
- Step-by-step framework creation
- Philosophy encoded for future orchestrator

**bootstrap.md gaps:**
- Not structured as questionnaire
- No interactive teaching moments
- No examples of common patterns in action
- No validation checkpoints
- No "here's what you just created and why it matters" explanations

### 9.2 Missing Onboarding Patterns

**What exists:**
- Bootstrap prompt (long instruction file)
- Complete framework structure
- Working examples in ActionFlows Dashboard

**What's missing:**
- Interactive questionnaire format
- Progressive disclosure (start simple, add complexity)
- Pattern examples library (show before asking to create)
- Validation after each major step
- Teaching moments explaining WHY each pattern exists
- Common pitfall warnings upfront
- Quick-start vs comprehensive path options

### 9.3 Potential Questionnaire Structure

**Based on framework patterns discovered:**

**Phase 1: Project Discovery (Interactive)**
- What's your project tech stack? [dropdown: Node.js, Python, Go, etc.]
- Backend framework? [dropdown: Express, FastAPI, etc.]
- Frontend framework? [dropdown: React, Vue, None, etc.]
- What kind of work will agents do? [checkboxes: code, docs, tests, audits]

**Phase 2: Framework Sizing (Guided)**
- Show pattern: "Here's a minimal framework (2 actions, 1 flow)"
- Show pattern: "Here's a full framework (8 actions, 10 flows)"
- Ask: "Start minimal or comprehensive?" [radio buttons]

**Phase 3: Department Setup (Educational)**
- Explain: "Departments route work to specialized flows"
- Show example: Engineering department routing table
- Ask: "Which departments do you need?" [checkboxes with defaults]

**Phase 4: Action Selection (Pattern Library)**
- For each department selected, show action cards:
  - Action name
  - What it does (1 line)
  - Example use case
  - Complexity (simple/medium/complex)
- Ask: "Select actions to include" [checkboxes with smart defaults]

**Phase 5: Flow Composition (Teaching Moment)**
- Show: "Actions are building blocks. Flows are recipes."
- Example: code-and-review/ flow breakdown
- Ask: "Which flows do you need?" [checkboxes]
- Offer: "Create custom flow?" [link to advanced mode]

**Phase 6: Project Values (Smart Defaults)**
- Pre-fill from project files detected
- Show what was detected, ask for corrections
- Ports, paths, conventions

**Phase 7: Validation & Preview (Checkpoint)**
- Show file structure to be created
- Show example agent.md for one selected action
- Show example chain execution
- Confirm or go back to adjust

**Phase 8: Creation & Explanation (Teaching Throughout)**
- Create each file with explanatory message:
  - "Creating agent-standards/instructions.md — This defines 11 rules all agents follow..."
  - "Creating code/agent.md — This agent implements features by..."
- Progress bar showing completion

**Phase 9: First Chain Test (Hands-On)**
- Walk through compiling first chain
- Show routing process
- Show spawning process
- Execute simple test chain

**Phase 10: Framework Compatibility Checklist (Validation)**
- Verify all required files exist
- Verify structure matches requirements
- Test orchestrator session-start protocol
- Generate compatibility report

### 9.4 Teaching Examples Needed

**For each core concept, show before asking:**

**Example: Agent Identity Boundary**
```
❌ Wrong: Agent reads ORCHESTRATOR.md and tries to compile chain
✅ Right: Agent reads only its agent.md and executes directly

How we enforce:
1. Spawning prompt: "Do NOT read ORCHESTRATOR.md"
2. Agent-standards rule #9: "Never delegate"
3. CLAUDE.md conditional: "Subagents: follow agent.md instead"
```

**Example: The Sin Test**
```
Scenario: Human asks to "fix the login bug"

❌ Orchestrator sin: [reads auth.py, analyzes issue, writes fix]
✅ Orchestrator correct: [compiles chain: analyze → code → review → commit]

Why: Orchestrator coordinates. Agents produce.
```

**Example: Log Folder Creation**
```
Wrong (shell substitution failure):
mkdir -p ".claude/actionflows/logs/review/auth-changes_$(date +%Y-%m-%d-%H-%M-%S)/"

Right (pre-compute variables):
description="auth-changes"
datetime=$(date +%Y-%m-%d-%H-%M-%S)
folder=".claude/actionflows/logs/review/${description}_${datetime}"
mkdir -p "$folder"

Why: Windows shell substitution with $() inside strings fails
```

### 9.5 Suggested Initial Behaviors

**For questionnaire to suggest:**

**Minimal starter set:**
- Actions: code/, review/, commit/, plan/ (4 actions)
- Flows: code-and-review/ (1 flow)
- Departments: Engineering (1 department)
- Abstract: agent-standards, create-log-folder

**Balanced set:**
- Actions: code/, review/, commit/, plan/, analyze/, test/ (6 actions)
- Flows: code-and-review/, bug-triage/ (2 flows)
- Departments: Engineering, QA (2 departments)
- Abstract: agent-standards, create-log-folder, post-completion

**Comprehensive set:**
- Actions: All 8 generic + stack-specific (10 actions)
- Flows: All 10 flows
- Departments: All 4 departments
- Abstract: All 4 patterns

**Smart defaults based on project type:**
- Node.js backend → include code/backend/, Express patterns
- React frontend → include code/frontend/, React patterns
- Has tests/ → include test/ action, bug-triage/ flow
- Has docs/ → include analyze/, plan/ for doc work

---

## 10. Recommendations for Questionnaire Design

### 10.1 Progressive Teaching Approach

**Instead of:** "Here are 38,147 tokens about the framework"
**Use:** "Let's build your framework together. First question..."

**Each step:**
1. Explain the concept (1-2 paragraphs max)
2. Show a concrete example
3. Ask the question
4. Validate the answer
5. Explain what just got created and why

### 10.2 Pattern Library Integration

**Create reusable pattern cards:**
```
┌─────────────────────────────────────────┐
│ Pattern: code-and-review/              │
├─────────────────────────────────────────┤
│ What: Implement → Quality Gate         │
│ When: Building features, fixing bugs   │
│ Chain: code → review → second-opinion  │
│ Gates: Human approval after review     │
│ Example: "Add login rate limiting"     │
└─────────────────────────────────────────┘

Include this pattern? [Yes] [No] [Customize]
```

### 10.3 Validation Checkpoints

**After each major phase:**
```
✓ Project discovered: Node.js + Express + React
✓ 4 actions selected: code, review, plan, commit
✓ 1 flow selected: code-and-review
✓ Engineering department configured

Next: Configure project values
[Continue] [Go Back] [Preview Structure]
```

### 10.4 Smart Defaults & Detection

**Auto-detect from project:**
- package.json → Node.js + dependencies → suggest backend patterns
- src/components/ → React detected → suggest frontend patterns
- tests/ or __tests__/ → testing present → suggest test/ action
- docs/ → documentation present → suggest analyze/ for doc work
- .git/ → git repo → include commit/ action

**Pre-fill values:**
- Project name from package.json or directory name
- Ports from common defaults (3000, 3001, 5173, 8080)
- Paths from standard structures

### 10.5 Failure Recovery Patterns

**If questionnaire interrupted:**
- Save progress to `.claude/actionflows/.questionnaire-state.json`
- On resume: "I see you were configuring actions. Continue from there?"

**If validation fails:**
- Clear error message
- Specific fix suggestion
- Option to auto-fix or manual fix

**If user unsure:**
- "Not sure? Choose recommended defaults" option
- "Show me examples first" link
- "Skip for now, configure later" option

### 10.6 Post-Questionnaire Deliverables

**Generate:**
1. Complete framework structure
2. Compatibility report (checklist of requirements met)
3. Quick start guide (personalized to their selections)
4. First chain tutorial (using their selected actions)
5. Cheat sheet (common commands for their setup)

**Example compatibility report:**
```
✓ All required files created
✓ Agent identity isolation configured (3 defense layers)
✓ Registry files populated
✓ Session-start protocol encoded in ORCHESTRATOR.md
✓ Project-specific values injected
✓ Log folder structure created

Ready to use! Try: "implement a new feature"
```

---

## 11. Framework-Specific Answer Patterns

### 11.1 How to Teach "It's a Sin"

**Progressive explanation:**

**Level 1 (Questionnaire intro):**
> "The orchestrator coordinates work but never does it. Think of it like a project manager — they assign tasks, not write code."

**Level 2 (During setup):**
> "When you ask the orchestrator to 'fix a bug', it won't fix it directly. It will compile a chain (analyze → code → review → commit) and spawn agents to do each step."

**Level 3 (Post-creation):**
> "If the orchestrator ever produces content (writes code, analyzes files, reviews changes), that's called 'sinning'. The recovery is: stop, acknowledge, compile chain, execute through agents."

**Level 4 (Cheat sheet):**
```
Sin Test:
About to produce content? → It's a sin
About to coordinate? → Proceed

Exemption: Registry line edits (add entry to INDEX.md, etc.)
```

### 11.2 How to Teach Agent Identity Boundary

**Progressive explanation:**

**Level 1:**
> "Orchestrator reads ORCHESTRATOR.md. Agents read only their agent.md."

**Level 2:**
> "This prevents agents from trying to delegate work. Each agent has one job."

**Level 3:**
> "We enforce this 3 ways: spawning prompt warns, agent-standards forbids, CLAUDE.md redirects."

**Level 4:**
```
Defense layers:
1. Spawning prompt: "Do NOT read ORCHESTRATOR.md"
2. Agent-standards rule #9: "Never delegate"
3. CLAUDE.md: "Subagents: follow agent.md instead"
```

### 11.3 How to Teach Action Modes

**Progressive explanation:**

**Level 1:**
> "Some actions can assess OR assess+fix. Default is assess-only."

**Level 2:**
> "Example: review/ can review-only (report issues) or review-and-fix (report AND fix clear bugs)."

**Level 3:**
> "Use extended modes for straightforward fixes. Use default for complex changes that need human judgment."

**Level 4:**
```
Action Modes:
review/   → review-only | review-and-fix
audit/    → audit-only  | audit-and-remediate
analyze/  → analyze-only | analyze-and-correct

When to use extended: Clear-cut fixes, no architecture decisions needed
When to use default: Complex changes, human judgment required
```

### 11.4 How to Teach Second Opinion Protocol

**Progressive explanation:**

**Level 1:**
> "After reviews and audits, a local AI model (Ollama) critiques the output. This catches what Claude might miss."

**Level 2:**
> "It's automatic for review/ and audit/. Optional for analyze/ and plan/."

**Level 3:**
> "The second opinion never blocks workflow. Commit waits for the original action, not the critique."

**Level 4:**
```
Second Opinion:
Auto-trigger: review/, audit/
Opt-in: analyze/, plan/ (with orchestrator flag)
Never: code/, test/, commit/

Critical: Commit depends on ORIGINAL action, not second-opinion
If Ollama unavailable: Reports SKIPPED, chain continues
```

---

## Summary of Key Findings

### Framework Structure
- **3-layer architecture:** Orchestrator (routing) → Flows (sequences) → Actions (atomic)
- **10 flows** across 4 departments (Framework, Engineering, QA, Human)
- **8 generic + 2 stack-specific + 4 abstract actions**
- **Comprehensive bootstrap.md** (38,147 tokens) already exists

### Agent Instructions
- **Two-file pattern:** agent.md (behavior) + instructions.md (metadata)
- **11 core principles** in agent-standards
- **Extends pattern:** Actions reference abstract behaviors
- **Required sections:** Mission, Steps, Context, Constraints, Learnings

### Bootstrap Patterns
- **Builder exemption:** During creation, read code and produce content
- **Orchestrator prohibition:** After creation, never produce content (only coordinate)
- **3 defense layers:** Prevent subagents from reading orchestrator rules
- **Smart defaults:** Auto-detect project structure and pre-fill values

### Gaps for Questionnaire
- **No interactive teaching:** Current bootstrap is long instruction file
- **No progressive disclosure:** All 38K tokens at once
- **No pattern examples:** No "show before asking to create"
- **No validation checkpoints:** No "here's what you created and why"
- **No recovery patterns:** No saved state for interrupted setup

### Recommendations
1. **Interactive questionnaire format** with progressive teaching
2. **Pattern library cards** showing examples before asking
3. **Validation checkpoints** after each phase
4. **Smart defaults** from project detection
5. **Teaching moments** explaining why each pattern exists
6. **Post-creation deliverables:** compatibility report, quick start, first chain tutorial

---

## Next Steps for Ideation Session

**This inventory provides context for:**
1. Designing questionnaire flow (10 phases suggested)
2. Creating pattern library (example cards provided)
3. Teaching framework concepts progressively (4-level explanations)
4. Validating framework compatibility (checklist requirements)
5. Generating post-creation deliverables (personalized guides)

**Key questions to explore:**
- How much to teach vs how much to automate?
- When to show examples vs when to let users discover?
- How to balance minimal (quick start) vs comprehensive (full power)?
- Should questionnaire generate bootstrap.md or replace it?
- How to evolve the program: questionnaire → generated instructions → self-improving framework?
