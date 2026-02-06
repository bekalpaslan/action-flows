# Flow Creation Flow

> Create new flows through the framework.

---

## When to Use

- Human wants to add a new workflow to the framework
- A recurring pattern has been identified that should become a flow
- New department needs new flows

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| description | What the flow should do | "A flow that runs linting, then auto-fixes, then reviews changes" |
| department | Which department owns it | "engineering" |

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
- requirements: Design a new flow: {description}
- context: Existing flows in FLOWS.md, existing actions in ACTIONS.md, department: {department}
- depth: detailed
```

**Gate:** Flow design plan delivered with action sequence, dependencies, and gates.

---

### Step 2: HUMAN GATE

Present the flow design for approval before creating files.

---

### Step 3: Implement Flow

**Spawn after Step 2 approval:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- task: Create flow instructions.md per approved design at .claude/actionflows/flows/{department}/{flow-name}/instructions.md
- context: Approved flow design from Step 1, flow template format from existing flows
```

**Gate:** Flow instructions.md created in correct directory.

---

### Step 4: Review Flow

**Spawn after Step 3 completes:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- scope: .claude/actionflows/flows/{department}/{flow-name}/instructions.md
- type: proposal-review
- mode: review-and-fix
```

**Gate:** Flow reviewed and approved. Registered in FLOWS.md.

---

## Dependencies

```
Step 1 → Step 2 (HUMAN) → Step 3 → Step 4
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- → `engineering/post-completion/` (after flow files are created)
