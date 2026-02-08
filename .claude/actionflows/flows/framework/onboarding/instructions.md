# Onboarding Flow

> Interactive teaching session for ActionFlows framework—progressive disclosure from beginner to advanced.

---

## When to Use

- Human wants to learn ActionFlows
- New team member needs framework training
- Human asks "how does this work?"
- After bootstrap completion (optional but recommended)

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| (none) | Flow is self-contained | (onboarding agent asks all questions) |

---

## Action Sequence

### Step 1: Facilitate Onboarding

**Action:** `onboarding/`
**Model:** opus
**Run Mode:** FOREGROUND (human-paced conversation)

**Spawn with:**
```
Read your definition in .claude/actionflows/actions/onboarding/agent.md

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
- (none—agent is self-contained)
```

**Gate:** Human completes all modules or exits early

---

## Dependencies

```
Single step (no dependencies)
```

---

## Chains With

After onboarding, human may want to:
- Try a request → Any flow
- Customize framework → flow-creation/ or action-creation/
- Bootstrap a different project → (run bootstrap.md in that project)
