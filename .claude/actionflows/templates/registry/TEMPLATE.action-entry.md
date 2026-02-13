# Action Entry Template

**Purpose:** Template for adding new actions to ACTIONS.md registry
**Registry File:** `.claude/actionflows/ACTIONS.md`
**Used By:** flow-creation/, action-creation/ flows

---

## Overview

ACTIONS.md contains 5 distinct table formats organized by action category. Choose the format that matches your action type.

**Action Categories:**
1. **Abstract Actions** — Reusable patterns (used by multiple agents)
2. **Generic Actions** — Standalone actions (analyze, review, plan, etc.)
3. **Stack-Specific Code Actions** — Code actions for specific tech stacks
4. **Stack-Specific Test Actions** — Test actions for specific frameworks
5. **Code-Backed Actions** — Actions that wrap TypeScript code execution

---

## Format 1: Abstract Action Entry

**Use when:** Creating a reusable pattern (instructions, no direct execution)

**Location in ACTIONS.md:** Under `## Abstract Actions` → Table starting line 9

**Table Header:**
```markdown
| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
```

**Column Definitions:**
- **Abstract Action:** Path format `_abstract/{name}/` (always ends with slash)
- **Purpose:** One-sentence description of the reusable pattern (< 80 chars)
- **Used By:** Comma-separated list (agents, orchestrator, or "All agents")

**Template:**
```markdown
| `_abstract/{action-name}/` | {One-sentence purpose} | {agent1, agent2} OR All agents |
```

**Example:**
```markdown
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
```

**Validation Rules:**
- Path MUST start with `_abstract/` and end with `/`
- Purpose MUST be concise (< 80 chars)
- Used By MUST list specific consumers or "All agents"
- Abstract actions do NOT execute — they provide instructions for other agents

**Supporting Files Required:**
- `.claude/actionflows/actions/_abstract/{action-name}/instructions.md`

---

## Format 2: Generic Action Entry

**Use when:** Creating a standalone action (not stack-specific)

**Location in ACTIONS.md:** Under `## Generic Actions` → Table header at line 20, entries start line 22

**Table Header:**
```markdown
| Action | Purpose | Requires Input? | Required Inputs | Model | Contract Output? |
|--------|---------|-----------------|-----------------|-------|------------------|
```

**Column Definitions:**
- **Action:** Path format `{name}/` (ends with slash, no prefix)
- **Purpose:** One-sentence description of the action
- **Requires Input?:** `YES` or `NO` (never empty)
- **Required Inputs:** Comma-separated parameter names, or `(none)` if NO
- **Model:** `haiku`, `sonnet`, or `opus`
- **Contract Output?:** `YES (X.X)` with format number from CONTRACT.md, or `NO`

**Template:**
```markdown
| {action-name}/ | {One-sentence purpose} | YES/NO | {param1, param2} OR (none) | haiku/sonnet/opus | YES (X.X)/NO |
```

**Example:**
```markdown
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet | YES (5.2) |
```

**Validation Rules:**
- Action path MUST NOT have prefix (unlike abstract actions)
- Requires Input? is binary: `YES` or `NO` (never empty)
- Required Inputs MUST match the action's `agent.md` Input Contract
- Contract Output format number MUST match CONTRACT.md if YES
- Model selection guidelines:
  - **haiku** — Fast execution, simple tasks
  - **sonnet** — Judgment required, review/analysis
  - **opus** — Complex reasoning, teaching/deep analysis

**Supporting Files Required:**
- `.claude/actionflows/actions/{action-name}/agent.md`

**Contract Output Column Reference:**
From ACTIONS.md lines 33-38:
```markdown
**Contract Output Column:**
- **YES (X.X)** — Action produces structured output parsed by dashboard (format number from CONTRACT.md)
- **NO** — Action output is not contract-defined (free-form documentation in changes.md or report.md)
```

---

## Format 3: Stack-Specific Code Action Entry

**Use when:** Creating a code action for a specific tech stack (backend, frontend, etc.)

**Location in ACTIONS.md:** Under `## Stack-Specific Code Actions` → Section at line 41, table at line 45

**Table Header:**
```markdown
| Action | Stack | Required Inputs | Model |
|--------|-------|-----------------|-------|
```

**Column Definitions:**
- **Action:** Path format `code/{stack}/` (namespaced under code/)
- **Stack:** Technology description with versions (e.g., "React 18.2 + Vite 5 + TypeScript")
- **Required Inputs:** Comma-separated parameter names
- **Model:** Claude model tier (typically `haiku` for code execution)

**Template:**
```markdown
| `code/{stack-name}/` | {Framework + Version + Language} | {param1, param2} | haiku |
```

**Example:**
```markdown
| `code/backend/` | Express 4.18 + TypeScript + Zod | task, context | haiku |
```

**Validation Rules:**
- Action MUST be namespaced under `code/` (e.g., `code/backend/`, `code/frontend/`)
- Stack MUST describe specific frameworks/versions
- Model SHOULD be `haiku` for execution (fast, cost-effective)
- Required Inputs MUST include `task` at minimum

**Supporting Files Required:**
- `.claude/actionflows/actions/code/{stack-name}/agent.md`

**Common Stack Names:**
- `code/backend/` — Backend Express + TypeScript
- `code/frontend/` — Frontend React + TypeScript
- `code/shared/` — Shared types and utilities

---

## Format 4: Stack-Specific Test Action Entry

**Use when:** Creating a test action for a specific framework

**Location in ACTIONS.md:** Under `## Stack-Specific Test Actions` → Section at line 50, table at line 54

**Table Header:**
```markdown
| Action | Stack | Required Inputs | Model |
|--------|-------|-----------------|-------|
```

**Column Definitions:**
- **Action:** Path format `test/{framework}/` (namespaced under test/)
- **Stack:** Test framework description
- **Required Inputs:** Comma-separated parameter names
- **Model:** Claude model tier

**Template:**
```markdown
| `test/{framework-name}/` | {Test Framework Description} | {param1, param2} | sonnet |
```

**Example:**
```markdown
| `test/playwright/` | Playwright E2E (browser tests) | target, mode, browser | sonnet |
```

**Validation Rules:**
- Action MUST be namespaced under `test/`
- Stack MUST describe test framework
- Required Inputs MUST match test action's needs (typically: target, mode)
- Model typically `sonnet` (judgment required for test design)

**Supporting Files Required:**
- `.claude/actionflows/actions/test/{framework-name}/agent.md`

**Common Test Framework Names:**
- `test/playwright/` — E2E browser tests
- `test/vitest/` — Unit/integration tests
- `test/chrome-mcp/` — Chrome MCP browser automation

---

## Format 5: Code-Backed Action Entry

**Use when:** Creating an action that wraps TypeScript code execution

**Location in ACTIONS.md:** Under `## Code-Backed Actions` → Section at line 58, table at line 66

**Table Header:**
```markdown
| Action | Purpose | Code Package | Required Inputs | Model |
|--------|---------|--------------|-----------------|-------|
```

**Column Definitions:**
- **Action:** Path format `{name}/` (generic action path)
- **Purpose:** One-sentence description
- **Code Package:** Path to TypeScript package (e.g., `packages/{name}/`)
- **Required Inputs:** Comma-separated parameter names
- **Model:** Claude model tier (typically `haiku` for orchestration)

**Template:**
```markdown
| {action-name}/ | {One-sentence purpose} | packages/{package-name}/ | {param1, param2} | haiku |
```

**Example:**
```markdown
| second-opinion/ | Ollama critique of agent output | packages/second-opinion/ | actionType, claudeOutputPath, originalInput | haiku |
```

**Validation Rules:**
- Code Package MUST be a real monorepo package path
- Action wraps code execution (Claude orchestrates, doesn't perform the work)
- Model typically `haiku` (simple orchestration logic)
- Package MUST exist in `packages/` directory

**Supporting Files Required:**
- `.claude/actionflows/actions/{action-name}/agent.md`
- `packages/{package-name}/` — TypeScript package with implementation

---

## Cross-Registry Validation

**IMPORTANT:** When adding a new action, verify these constraints:

### 1. Flow References
If flows reference this action in their chains, those flows must already exist in FLOWS.md.

**Example:**
```markdown
# ACTIONS.md
| analyze/ | ... | ... | ... | ... | ... |

# FLOWS.md (must contain flows that reference analyze/)
| audit-and-fix/ | ... | analyze → plan → code → review |
```

### 2. Abstract Action Usage
If creating an abstract action, document which agents use it in the "Used By" column.

### 3. Contract Output Alignment
If action produces contract output (YES (X.X)), verify:
- Format exists in `.claude/actionflows/CONTRACT.md`
- Parser exists in `packages/shared/src/contract/parsers/`
- Parser has unit tests in `packages/shared/src/contract/__tests__/`
- Component exists in `packages/app/src/components/` (if UI needed)

---

## Insertion Guidelines

### Alphabetical Ordering
While not enforced, alphabetical ordering within each category is recommended for readability.

### Table Formatting
- Align table columns using spaces (markdown renderers handle this)
- Keep Purpose column under 80 characters
- Use backticks for action paths in prose (not in table cells)

### Example Insertion

**Before:**
```markdown
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet | YES (5.2) |
| commit/ | Git commit with message | YES | message | haiku | NO |
```

**After (inserting brainstorm/):**
```markdown
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet | YES (5.2) |
| brainstorm/ | Structured ideation | YES | topic | opus | YES (5.1) |
| commit/ | Git commit with message | YES | message | haiku | NO |
```

---

## Model Selection Guidelines

Reference from ACTIONS.md § Model Selection Guidelines:

| Model | Use When | Examples |
|-------|----------|----------|
| haiku | Fast execution, simple tasks, orchestration | code/, commit/, second-opinion/ |
| sonnet | Judgment required, review, analysis | analyze/, review/, audit/, test/ |
| opus | Complex reasoning, teaching, deep analysis | brainstorm/, onboarding/, plan/ (complex) |

---

## Supporting Files Checklist

After adding an action entry to ACTIONS.md, ensure:

- ✅ `agent.md` exists at `.claude/actionflows/actions/{action-name}/agent.md`
- ✅ `agent.md` follows template from `.claude/actionflows/templates/agent/TEMPLATE.agent.md`
- ✅ Input Contract in `agent.md` matches Required Inputs column
- ✅ If Contract Output = YES (X.X), format documented in CONTRACT.md
- ✅ Abstract actions have `instructions.md` instead of `agent.md`

---

## Cross-References

- **Registry File:** `.claude/actionflows/ACTIONS.md`
- **Related Templates:** `TEMPLATE.flow-entry.md`, `TEMPLATE.context-entry.md`
- **Flow Creation:** `.claude/actionflows/flows/settings/flow-creation/`
- **Action Creation:** `.claude/actionflows/flows/settings/action-creation/`
