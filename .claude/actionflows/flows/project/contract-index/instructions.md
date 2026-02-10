# Contract Index Flow

> Create or update behavioral contract specifications for React components, contexts, and hooks.

---

## When to Use

- Human requests "create contracts for {components}", "write contracts", or "index contracts"
- Need to establish behavioral contracts for new components
- Migrating components to the contract system
- Updating contracts after significant component changes
- Periodic contract maintenance and sync with source code
- Ensuring all components have current, compliant contracts

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | What to contract | "Canvas components", "all components", "SessionPanel, ChatPanel", "contexts", "hooks" |
| mode | Create new or update existing | "create" (default) or "update" |
| domains | Optional domain filter | "Canvas, Common, Layout" or omit for all |
| depth | Thoroughness level | "standard" (default) or "deep" (includes performance analysis) |

---

## Action Sequence

### Step 1: Analyze Components

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Parallelizable:** Yes (one per domain)

**Spawn (one per domain batch):**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: component-contracts
- scope: {scope from human}
  - If "Canvas components": packages/app/src/components/Canvas/
  - If "Common": packages/app/src/components/Common/
  - If "contexts": packages/app/src/contexts/
  - If "hooks": packages/app/src/hooks/
  - If "all components": packages/app/src/components/
- context: Read source files to identify:
  - Props interface/type definitions
  - State and hooks (useState, useContext, etc.)
  - Effects and lifecycle
  - Callbacks and event handlers
  - External dependencies (contexts, APIs, WebSocket)
  - CSS classes used (for test hooks)
  - Render conditions and parent mount points

Output as structured JSON with per-component analysis including:
- Component name and file path
- Props (with types, defaults, required status)
- State variables and their types
- Effects (dependencies, side effects, cleanup)
- Callbacks (signatures, purposes)
- Context consumption
- External calls (API, WebSocket, Electron IPC)
- CSS classes used
- Lifecycle triggers
```

**Gate:** Component analysis delivered for all target components/domains.

---

### Step 2: Plan Contract Structure

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Design contract structure per TEMPLATE.contract.md
- context: Component analysis from Step 1
- depth: {depth from human, default: standard}
- template: packages/app/src/contracts/TEMPLATE.contract.md

Output contract plan including:
- Which components need new contracts (create)
- Which components have existing contracts that need updates (update)
- Per-component contract sections to include:
  - Identity (name, file, type, parent group)
  - Props Contract (inputs, callbacks up, callbacks down)
  - Lifecycle (mount triggers, effects, cleanup)
  - State Ownership (local, context, derived, hooks)
  - Interactions (parent, child, sibling, context)
  - Side Effects (API, WebSocket, timers, storage, Electron IPC)
  - Test Hooks (CSS classes, data-testid, ARIA labels)
  - Health Checks (critical and warning checks)
  - Dependencies (contexts, hooks, child components)
- Estimated file count and organization
- Any templates or patterns to reuse across similar components
```

**Gate:** Contract plan delivered.

---

### Step 3: HUMAN GATE

Present contract plan for approval:

- **Approve:** Proceed to Step 4
- **Modify:** Human provides adjustments (components to skip, sections to focus on, etc.), loop back to Step 2
- **Reject:** Flow ends (no contract changes)

---

### Step 4: Write/Update Contracts (Parallel)

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku
**Parallelizable:** Yes (one agent per domain batch)

**Spawn after human approves (one per domain batch):**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Write or update contracts per approved plan from Step 3
- scope: {domain batch, e.g., "Canvas", "Common", "Layout"}
- context:
  - Component analysis from Step 1
  - Approved contract plan from Step 3
  - TEMPLATE.contract.md at packages/app/src/contracts/TEMPLATE.contract.md
  - Existing contracts in packages/app/src/contracts/components/{domain}/ (if updating)
  - Output path: packages/app/src/contracts/components/{domain}/{ComponentName}.contract.md
  - OR packages/app/src/contracts/contexts/{ContextName}.contract.md
  - OR packages/app/src/contracts/hooks/{HookName}.contract.md
- requirements:
  - Follow TEMPLATE.contract.md exactly
  - All required sections must be present
  - Line endings: LF only (enforced by .gitattributes)
  - Test hooks must match actual CSS class names in source
  - Health checks must be executable (Chrome MCP compatible)
  - Compliance with existing contract standards in the repo

Output:
- New or updated .contract.md files
- One file per component/context/hook
- Follow naming: {ComponentName}.contract.md
```

**Gate:** All contracts written/updated successfully.

---

### Step 5: Review Contracts

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All contract files from Step 4
- type: contract-compliance
- template: packages/app/src/contracts/TEMPLATE.contract.md
- checklist:
  - All required sections present (Identity, Props, Lifecycle, State, Interactions, Side Effects, Test Hooks, Health Checks, Dependencies, Notes)
  - Props types are accurate and complete
  - Callbacks have correct signatures
  - State ownership clearly documented
  - CSS classes match source code
  - Health checks are runnable (Chrome MCP format)
  - No dangling references or missing context names
  - Line endings are LF
  - Version bumped if updated existing contracts
  - Last Updated date is current
```

**Gate:** Contracts reviewed and APPROVED (with optional suggestions for improvement).

---

### Step 6: Commit Contracts

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: {Summarize contracts created/updated. e.g., "Add contracts for Canvas domain (9 components)" or "Update SessionPanel and ChatPanel contracts"}
- files: All .contract.md files from Step 4
- scope: packages/app/src/contracts/
```

**Output:** Changes committed to git with descriptive message.

**Gate:** Commit successful.

---

## Dependencies

```
Step 1 (Analyze) ──┐
                   ├──→ Step 2 (Plan) → Step 3 (HUMAN GATE) → Step 4 (Code×N parallel) → Step 5 (Review) → Step 6 (Commit)
```

**Parallel opportunities:**
- Step 1: Analyze multiple domains in parallel (Canvas, Common, Layout, etc. as separate analyses)
- Step 4: Write/update contracts by domain batch in parallel (one code agent per batch)

---

## Chains With

- → `post-completion/` (after Step 6, to update documentation and notify)
- ← Triggered by orchestrator when human requests contract creation or updates
- ← Related to `contract-compliance-audit/` (audit flow validates contracts from this flow)
- ← Related to `backwards-harmony-audit/` (checks contract alignment with implementation)

---

## Examples

### Example 1: Create Contracts for Canvas Components

```
Human: "Create contracts for all Canvas components"

Orchestrator:
  scope = "Canvas components"
  mode = "create"
  domains = "Canvas"

Step 1: Analyze Canvas/ components → find 9 components
Step 2: Plan new contracts for all 9
Step 3: Human approves
Step 4: Code agent writes 9 .contract.md files
Step 5: Review for compliance
Step 6: Commit all new contracts

Output: packages/app/src/contracts/components/Canvas/{9 new contract files}
```

### Example 2: Update Existing Contracts After Refactor

```
Human: "Update contracts for SessionPanel and ChatPanel"

Orchestrator:
  scope = "SessionPanel, ChatPanel"
  mode = "update"

Step 1: Analyze both components for changes
Step 2: Plan contract updates
Step 3: Human approves
Step 4: Code agent updates 2 existing contracts
Step 5: Review changes
Step 6: Commit updates

Output: Updated packages/app/src/contracts/components/SessionPanel.contract.md, ChatPanel.contract.md
```

### Example 3: Index All Contexts

```
Human: "Create contracts for all contexts"

Orchestrator:
  scope = "contexts"
  mode = "create"
  domains = "all"

Step 1: Analyze packages/app/src/contexts/
Step 2: Plan new contracts for each context
Step 3: Human approves
Step 4: Code agent writes context contracts
Step 5: Review
Step 6: Commit

Output: packages/app/src/contracts/contexts/{ContextName}.contract.md for each
```

---

## Mode Selection Guidelines

| Scenario | Mode | Rationale |
|----------|------|-----------|
| "Create contracts for new components" | create | Components don't have contracts yet |
| "Write contracts for Canvas" | create | New domain being contractified |
| "Update contracts after refactor" | update | Components changed, contracts must sync |
| "Contract needs to be refreshed" | update | Existing contract, refresh current state |
| "Create/update all component contracts" | create | First time contractifying whole codebase |

---

## Contract Template Location

Reference: `packages/app/src/contracts/TEMPLATE.contract.md`

All written contracts MUST follow this template exactly:
- Identity section (component name, file, type, parent group)
- Render Location (mount points, conditions, positioning)
- Lifecycle (triggers, effects, cleanup)
- Props Contract (inputs, callbacks up/down)
- State Ownership (local, context, derived, custom hooks)
- Interactions (parent, child, sibling, context)
- Side Effects (API, WebSocket, timers, storage, Electron IPC)
- Test Hooks (CSS classes, data-testid, ARIA labels)
- Health Checks (critical, warning, benchmarks)
- Dependencies
- Notes

---

## Contract Compliance

All contracts must meet these standards:

1. **Completeness:** Every required section filled out
2. **Accuracy:** Props, state, and effects match source code exactly
3. **Testability:** CSS classes and test IDs are real (not inferred)
4. **Health Checks:** Must be Chrome MCP compatible and runnable
5. **Line Endings:** LF only (Windows systems: ensure .gitattributes applies)
6. **Naming:** {ComponentName}.contract.md for components, {ContextName}.contract.md for contexts
7. **Versioning:** Version field updated if modifying existing contracts

---
