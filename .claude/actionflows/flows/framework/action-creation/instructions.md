# Action Creation Flow

> Create new actions through the framework.

---

## When to Use

- Human wants to add a new action type
- A gap has been identified in the action catalog
- New capability needed for workflows

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| description | What the action should do | "An action that generates API documentation from route definitions" |
| model | Suggested model for the action | "sonnet" |

---

## Action Sequence

### Step 1: Plan

**Action:** `.claude/actionflows/actions/plan/`
**Model:** opus

**Spawn:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- requirements: Design a new action: {description}
- context: Existing actions in ACTIONS.md, agent.md template format, model: {model}
- depth: detailed
```

**Gate:** Action design plan delivered.

---

### Step 2: HUMAN GATE

Present the action design for approval before creating files.

---

### Step 3: Implement Action

**Spawn after Step 2 approval:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- task: Create agent.md + instructions.md per approved design at .claude/actionflows/actions/{action-name}/
- context: Approved action design from Step 1, existing agent.md templates in .claude/actionflows/actions/
```

**Gate:** Action agent.md and instructions.md created.

---

### Step 4: Review Action

**Spawn after Step 3 completes:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- scope: .claude/actionflows/actions/{action-name}/agent.md, .claude/actionflows/actions/{action-name}/instructions.md
- type: proposal-review
- mode: review-and-fix
```

**Gate:** Action reviewed, approved, registered in ACTIONS.md.

---

## Dependencies

```
Step 1 → Step 2 (HUMAN) → Step 3 → Step 4
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- → `engineering/post-completion/` (after action files are created)
