# Bug Triage Flow

> Analyze, classify layer, fix with the right tool, verify with the right proof, review.

---

## When to Use

- Bug reports requiring investigation
- Errors that span multiple packages
- Complex bugs needing root cause analysis before fixing

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| bug | Bug description or error message | "WebSocket disconnects after 30s idle, no reconnection" |
| context | Where the bug manifests | "packages/app/src/hooks/useWebSocket.ts, packages/backend/src/ws/handler.ts" |

---

## Action Sequence

### Step 1: Analyze Root Cause + Classify Layer

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: impact
- scope: {context from human}
- context: Bug: {bug description}. Investigate root cause and identify all affected files.

Your analysis MUST end with a layer classification:

## Layer Classification
- **Layer:** {backend | framework | hooks | frontend}
- **Root cause:** {one sentence}
- **Fix target:** {specific file path(s)}

Use these definitions:
- backend: Bug in TypeScript code (parsers, routes, storage, Zod schemas, services)
- framework: Bug in markdown instructions (ORCHESTRATOR.md, agent.md, flow instructions, CONTRACT.md)
- hooks: Bug in Claude Code lifecycle hooks (packages/hooks/src/afw-*.ts)
- frontend: Bug in React components, hooks, contexts (packages/app/src/)
```

**Gate:** Root cause identified with layer classification and affected files list.

---

### Step 2: Implement Fix (Layer-Routed)

Based on the layer from Step 1, use the appropriate code agent:

#### If Layer = backend

**Action:** `.claude/actionflows/actions/code/backend/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/backend/agent.md

Input:
- task: Fix bug: {bug description}. Root cause: {from Step 1 analysis}
- context: {affected files from Step 1}
```

#### If Layer = frontend

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Input:
- task: Fix bug: {bug description}. Root cause: {from Step 1 analysis}
- context: {affected files from Step 1}
```

#### If Layer = hooks

**Action:** `.claude/actionflows/actions/code/hooks/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/hooks/agent.md

Input:
- task: Fix bug: {bug description}. Root cause: {from Step 1 analysis}
- context: {affected files from Step 1}
```

#### If Layer = framework

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix bug: {bug description}. Root cause: {from Step 1 analysis}
- context: {affected files from Step 1}
- component: framework
```

**Gate:** Bug fix implemented, type-check passes (for code layers).

---

### Step 3: Verify Fix

**Action:** `.claude/actionflows/actions/verify/`
**Model:** haiku

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/verify/agent.md

Input:
- layer: {layer from Step 1}
- scope: {changed files from Step 2}
- issue: Bug: {bug description}. Root cause: {from Step 1}
```

**Gate:** Verdict is VERIFIED. If FAILED → loop back to Step 2 with verification failure details (max 2 retries).

---

### Step 4: Run Tests (backend and frontend layers only)

**Action:** `.claude/actionflows/actions/test/`
**Model:** haiku

**Spawn after Step 3 (skip if Layer = framework):**
```
Read your definition in .claude/actionflows/actions/test/agent.md

Input:
- scope: {test files related to affected areas}
- type: integration
- context: Bug fix for {bug description}. Changed files: {from Step 2}
```

**Gate:** Tests executed, results reported. No new failures introduced.

> **Note:** Framework-layer fixes skip this step — markdown instructions have no test suite. Verification (Step 3) provides the best-effort contract cross-reference instead.

---

### Step 5: Review Fix

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4 (or Step 3 if framework layer):**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {changed files from Step 2}
- type: code-review
- context: Layer: {layer}. Bug: {bug description}. Verification: VERIFIED.
```

**Gate:** Verdict APPROVED.

---

## Dependencies

```
Step 1 → Step 2 (branched by layer) → Step 3 → Step 4 (skip if framework) → Step 5
                                         ↑                                      |
                                         └──────────────────────────────────────┘ (if NEEDS_CHANGES, max 2 retries)
```

**Parallel groups:** None — sequential (each step depends on previous).

---

## Chains With

- → `post-completion/` (when review APPROVED)
- ← Bug fix requests route here
