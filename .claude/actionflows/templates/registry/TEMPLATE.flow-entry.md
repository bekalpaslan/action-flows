# Flow Entry Template

**Purpose:** Template for adding new flows to FLOWS.md registry
**Registry File:** `.claude/actionflows/FLOWS.md`
**Used By:** flow-creation/ flow

---

## Overview

FLOWS.md organizes flows by context (work, maintenance, explore, review, settings, pm, intel). Each flow has a table entry, and complex flows may have an extended H3 specification section.

**Flow Entry Formats:**
1. **Simple Table Entry** — Basic sequential flows (most common)
2. **Detailed H3 Specification** — Complex flows with gates, branching, or conditional logic

---

## Format 1: Simple Table Entry

**Use when:** Flow is a straightforward action sequence (no gates, branching, or complex conditionals)

**Location in FLOWS.md:** Under context H2 header (e.g., `## work`, `## maintenance`)

**Table Header:**
```markdown
| Flow | Purpose | Chain |
|------|---------|-------|
```

**Column Definitions:**
- **Flow:** Path format `{name}/` (ends with slash)
- **Purpose:** One-sentence description of the flow's goal (< 80 chars)
- **Chain:** Step sequence using arrow notation and modifiers

**Template:**
```markdown
| {flow-name}/ | {One-sentence purpose} | {action1} → {action2} → {action3} |
```

**Example:**
```markdown
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
```

**Validation Rules:**
- Flow name MUST end with `/`
- Purpose MUST be concise (< 80 chars)
- Chain MUST use registered action names from ACTIONS.md
- Chain syntax MUST follow arrow notation rules (see Chain Syntax Guide)
- Flows MUST be grouped under appropriate context headers

---

## Format 2: Detailed H3 Specification

**Use when:** Flow has human gates, conditional branching, complex inputs, or multi-path logic

**Location in FLOWS.md:**
1. Add simple table entry under context H2 header (as above)
2. Add detailed spec under `## Detailed Flow Specifications` section (~line 101)

**H3 Specification Structure:**

```markdown
### {flow-name}/

**Context:** {context}

**Trigger:**
- Human says "{trigger phrase}"
- {Other trigger conditions}

**Description:**
{2-3 sentence explanation of what this flow does and when to use it}

**Chain:**
1. `{action}/{subtype}`
   - Input: {what goes in}
   - Output: {what comes out}
2. **Human gate:** {What orchestrator presents for approval}
3. `{next-action}`
   - Input: {from previous step}
   - Output: {result}

**Example:**
```
Human: "{example request}"
Orchestrator routes to {flow-name}/
Chain: {step1} → {step2} → {step3}
Result: {outcome}
```

**Notes:**
- {Implementation notes}
- {Constraints or special considerations}
```

**Example (from FLOWS.md):**

```markdown
### doc-reorganization/

**Context:** explore

**Trigger:**
- Human says "reorganize docs" / "restructure documentation"
- Documentation structure needs revision

**Description:**
Multi-step process for reorganizing documentation with human approval gates.
Analyzes current structure, proposes new organization, implements changes after approval.

**Chain:**
1. `analyze/structure`
   - Input: scope=docs/
   - Output: Current structure analysis + proposed reorganization
2. **Human gate:** Review proposed structure, approve/modify
3. `plan/`
   - Input: approved structure from gate
   - Output: Detailed implementation plan (file moves, updates)
4. **Human gate:** Review plan, approve execution
5. `code×N` (parallel)
   - Input: plan from previous step
   - Output: Reorganized files + updated cross-references
6. `review/`
   - Input: all changes
   - Output: Validation that links work, no broken refs

**Example:**
```
Human: "reorganize the testing docs, they're scattered"
Orchestrator routes to doc-reorganization/
Chain: analyze/structure → gate → plan → gate → code×N → review
Result: Reorganized docs with updated cross-references
```

**Notes:**
- Human gates are critical — don't proceed without approval
- code×N step uses parallel execution for efficiency
- review/ validates no broken cross-references
```

**When to Use Detailed Spec:**
- Flow has > 1 human gate
- Flow has conditional branching (if/else logic)
- Flow has parallel execution with dependencies
- Flow inputs/outputs need clarification
- Flow has special constraints or modes

**When Simple Table is Enough:**
- Sequential action chain
- No human gates (or single gate at end)
- Self-explanatory from action names
- Standard inputs (task, scope, context)

---

## Chain Syntax Guide

FLOWS.md uses arrow notation with modifiers to express execution flow.

### 1. Sequential Steps
```markdown
action1 → action2 → action3
```
Steps execute in order, each waits for previous to complete.

**Example:**
```markdown
code → review → commit
```

---

### 2. Human Gates
```markdown
analyze → human gate → code
```
Orchestrator pauses, presents output, waits for approval.

**Example:**
```markdown
plan → human gate → code×N → review
```

---

### 3. Conditional Loops
```markdown
→ (loop if needed)
```
Step may repeat based on outcome (e.g., review fails → code again).

**Example:**
```markdown
code → review → (loop if needed) → commit
```

---

### 4. Parallel Execution
```markdown
code×N
```
Multiple instances run in parallel (N determined at execution).

**Example:**
```markdown
analyze×3 (parallel) → plan → code×N → review
```

**Variants:**
- `code×N` — Unspecified count (determined by task)
- `code×3` — Explicit count
- `(parallel)` — Optional clarifier

---

### 5. Alternative Paths
```markdown
action1 OR action2 OR action3
```
Orchestrator chooses based on context.

**Example:**
```markdown
analyze OR plan → code → review
```

---

### 6. Action Subtypes
```markdown
analyze/harmony-violation
```
Specific variant of base action (subtype defined in agent.md).

**Example:**
```markdown
analyze/backwards-compatibility → plan → code → review
```

---

### 7. Nested Parentheticals
```markdown
→ (narrate → human gate)×
```
Repeated interactive step.

**Example:**
```markdown
brainstorm → (narrate → human gate)× → plan
```

---

### 8. Complex Chains (Combined)
```markdown
analyze×N (parallel) → plan → human gate → code×N → review → (loop if needed) → commit
```

**Breakdown:**
1. Multiple parallel analyses
2. Planning phase
3. Human approval gate
4. Parallel code implementation
5. Review (may trigger loop)
6. Final commit

---

## Context Organization

Flows are organized by context under H2 headers:

### work
**Purpose:** Active feature development and new code
**Flow count:** ~3 flows
**Example flows:** code-and-review/, post-completion/, contract-format-implementation/

### maintenance
**Purpose:** Bug fixes, refactoring, housekeeping
**Flow count:** ~5 flows
**Example flows:** bug-triage/, cleanup/, harmony-audit-and-fix/

### explore
**Purpose:** Research, learning, documentation
**Flow count:** ~3 flows
**Example flows:** doc-reorganization/, ideation/, story-of-us/

### review
**Purpose:** QA, audits, validation
**Flow count:** ~6 flows
**Example flows:** audit-and-fix/, test-coverage/, backwards-harmony-audit/

### settings
**Purpose:** Framework configuration, flow/action creation
**Flow count:** ~6 flows
**Example flows:** onboarding/, flow-creation/, action-creation/

### pm
**Purpose:** Project management, planning
**Flow count:** ~2 flows
**Example flows:** planning/, learning-dissolution/

### intel
**Purpose:** Code intelligence, search, dependency analysis
**Flow count:** ~1 flow
**Example flows:** intel-analysis/

---

## Insertion Guidelines

### Step 1: Choose Context
Determine which context fits your flow's purpose. Use CONTEXTS.md as reference.

### Step 2: Add Table Entry
Navigate to the appropriate context H2 section in FLOWS.md and add a row.

**Before:**
```markdown
## work

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| post-completion/ | Proactive next steps after chain | analyze → plan → present options |
```

**After (inserting new flow):**
```markdown
## work

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| contract-format-implementation/ | Implement new contract formats | analyze → plan → gate → code×3 → review → commit |
| post-completion/ | Proactive next steps after chain | analyze → plan → present options |
```

### Step 3: Add Detailed Spec (If Needed)
If flow is complex, add H3 section under `## Detailed Flow Specifications`.

**Location:** After line ~99, before `## Appendix` (if present)

---

## Cross-Registry Validation

**IMPORTANT:** When adding a new flow, verify:

### 1. Action References
Every action in the chain MUST exist in ACTIONS.md.

**Example:**
```markdown
# FLOWS.md
| my-flow/ | Example flow | analyze → code → review |

# ACTIONS.md (must contain)
| analyze/ | ... | ... | ... | ... | ... |
| code/ | ... | ... | ... | ... | ... |
| review/ | ... | ... | ... | ... | ... |
```

**Exception:** Namespaced actions (e.g., `analyze/harmony`) reference base action (`analyze/`). Subtypes must be documented in the base action's agent.md file at `.claude/actionflows/actions/{action}/agent.md`.

---

### 2. Context References
Flow must be added to CONTEXTS.md **Flows:** field for the target context.

**Example:**
```markdown
# FLOWS.md
| code-and-review/ | Implement and review code | code → review → commit |
# (under ## work context)

# CONTEXTS.md (must update)
### work
**Purpose:** Active feature development
**Flows:** code-and-review/, post-completion/
```

---

### 3. Unique Flow Names
Flow names MUST be globally unique across all contexts.

**Invalid:**
```markdown
## work
| cleanup/ | ... | ... |

## maintenance
| cleanup/ | ... | ... |  ❌ Duplicate!
```

---

## Supporting Files Checklist

After adding a flow entry to FLOWS.md, ensure:

- ✅ All actions in chain exist in ACTIONS.md
- ✅ Flow added to CONTEXTS.md under appropriate context
- ✅ If flow is complex, detailed H3 spec provided
- ✅ Chain syntax validated (valid arrow notation)
- ✅ Purpose is concise (< 80 chars)

---

## Example: Adding a New Flow

**Scenario:** Creating an "api-documentation/" flow for the `work` context.

**Step 1: Table Entry**

```markdown
## work

| Flow | Purpose | Chain |
|------|---------|-------|
| api-documentation/ | Generate OpenAPI specs from code | analyze → plan → code → review → commit |
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| post-completion/ | Proactive next steps after chain | analyze → plan → present options |
```

**Step 2: CONTEXTS.md Update**

```markdown
### work
**Purpose:** Active feature development and new code
**Icon:** 🔨
**Triggers:** implement, build, create, add feature, develop, code, write, generate, construct, design
**Flows:** code-and-review/, post-completion/, contract-format-implementation/, api-documentation/
**Examples:**
- "implement user authentication"
- "build a dashboard component"
- "generate API documentation"
```

**Step 3: Detailed Spec (if needed)**

Since this flow is simple sequential, NO detailed spec needed.

If it had gates:

```markdown
### api-documentation/

**Context:** work

**Trigger:**
- Human says "generate API docs" / "create OpenAPI spec"
- Backend routes need documentation

**Description:**
Analyzes backend routes, generates OpenAPI specification, and creates human-readable API docs.
Uses Swagger format for compatibility with standard tooling.

**Chain:**
1. `analyze/routes`
   - Input: scope=packages/backend/src/routes/
   - Output: Route inventory + existing docs
2. `plan/`
   - Input: route inventory
   - Output: OpenAPI spec structure + doc strategy
3. **Human gate:** Review spec structure, approve format
4. `code/backend/`
   - Input: approved spec
   - Output: Generated OpenAPI files + route decorators
5. `review/`
   - Input: all changes
   - Output: Validation that spec matches routes
6. `commit/`
   - Input: changes
   - Output: Git commit

**Example:**
```
Human: "generate OpenAPI docs for the backend API"
Orchestrator routes to api-documentation/
Chain: analyze/routes → plan → gate → code/backend → review → commit
Result: OpenAPI spec + route decorators + API docs
```

**Notes:**
- Spec format defaults to OpenAPI 3.1
- Human gate critical to verify structure before generation
```

---

## Cross-References

- **Registry File:** `.claude/actionflows/FLOWS.md`
- **Related Templates:** `TEMPLATE.action-entry.md`, `TEMPLATE.context-entry.md`
- **Flow Creation:** `.claude/actionflows/flows/settings/flow-creation/`
- **Actions Registry:** `.claude/actionflows/ACTIONS.md`
- **Contexts Registry:** `.claude/actionflows/CONTEXTS.md`
