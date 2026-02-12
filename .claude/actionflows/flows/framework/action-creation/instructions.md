# Action Creation Flow

> Create new actions through the framework.

---

## When to Use

- Human wants to create a new action type
- A gap in the action catalog has been identified
- Orchestrator proposes a new action after repeated composition

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| requirements | Action purpose, inputs, model | "A cleanup action that removes old log folders and temp files" |

---

## Action Sequence

### Step 1: Plan Action Design

**Action:** `.claude/actionflows/actions/plan/`
**Model:** opus

**Spawn:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Design action: {requirements from human}
- context: Existing actions in .claude/actionflows/actions/, action catalog patterns
- depth: detailed
```

**Gate:** Action design delivered with agent.md structure, inputs, gates, and model selection.

---

### Step 2: HUMAN GATE

Present the action design for approval. Human reviews the proposed agent.md structure, inputs, and model.

---

### Step 3: Create Action Files

**Spawn after Human approves:**

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Create agent.md + instructions.md per approved design at .claude/actionflows/actions/{action-name}/
- templates: .claude/actionflows/templates/TEMPLATE.agent.md, .claude/actionflows/templates/TEMPLATE.instructions.md
- context: .claude/actionflows/actions/ for existing action patterns, approved plan from Step 1
```

**Gate:** Both agent.md and instructions.md created following TEMPLATE.agent.md and TEMPLATE.instructions.md structure.

---

### Step 4: Review Action

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: .claude/actionflows/actions/{action-name}/agent.md, .claude/actionflows/actions/{action-name}/instructions.md
- type: proposal-review
```

**Gate:** Action reviewed and APPROVED. Registered in ACTIONS.md.

---

## Dependencies

```
Step 1 → Step 2 (HUMAN GATE) → Step 3 → Step 4
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- → `post-completion/` (after action files are created and reviewed)
