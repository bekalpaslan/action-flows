# Flow Creation Flow

> Create new flows through the framework.

---

## When to Use

- Human wants to create a new predefined workflow
- A recurring pattern has been identified that should become a flow
- flow-discovery/ suggests a new flow candidate

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| requirements | Flow purpose and triggers | "A flow for database migration: plan → implement → test → review" |
| context | Which context owns the flow | "work" |

---

## Action Sequence

### Step 1: Plan Flow Design

**Action:** `.claude/actionflows/actions/plan/`
**Model:** opus

**Spawn:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Design flow: {requirements from human}
- context: Existing flows in .claude/actionflows/flows/, existing actions in .claude/actionflows/actions/
- depth: detailed
```

**Gate:** Flow design plan delivered with action sequence, dependencies, and gates.

---

### Step 2: HUMAN GATE

Present the flow design for approval. Human reviews the proposed action sequence, dependencies, and gates.

---

### Step 3: Create Flow Files

**Spawn after Human approves:**

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Create flow instructions.md per approved design at .claude/actionflows/flows/{context}/{flow-name}/instructions.md
- template: .claude/actionflows/templates/TEMPLATE.instructions.md
- context: .claude/actionflows/flows/ for existing flow patterns, approved plan from Step 1
```

**Gate:** Flow instructions.md created following TEMPLATE.instructions.md structure.

---

### Step 4: Review Flow

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: .claude/actionflows/flows/{context}/{flow-name}/instructions.md
- type: proposal-review
```

**Gate:** Flow reviewed and APPROVED. Registered in FLOWS.md.

---

## Dependencies

```
Step 1 → Step 2 (HUMAN GATE) → Step 3 → Step 4
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- → `post-completion/` (after flow files are created and reviewed)
