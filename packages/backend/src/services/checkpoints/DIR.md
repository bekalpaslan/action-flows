# checkpoints/

- gate02-context-routing.ts
- gate04-chain-compilation.ts
- gate06-step-boundary.ts
- gate07-execute-step.ts — exports: validateExecuteStep
- gate08-execution-complete.ts
- gate09-agent-output.ts — exports: validateAgentOutput, AgentValidationResult
- gate10-auto-trigger-detection.ts — exports: validateAutoTriggerDetection, AutoTriggerDetectionResult
- gate11-registry-update.ts
- gate13-learning-surface.ts — exports: validateLearningSurface
- index.ts

## Gate 13: Learning Surface (`gate13-learning-surface.ts`)

Validates that agent learning surfaces follow prescribed format and that closed learnings have legitimate closure evidence.

**Exports:**
- `validateLearningSurface(orchestratorOutput, chainId, stepId?)` — Async validator

**Validation Rules:**
- Learning surface must have: From, Issue, Root Cause, Fix, Status fields
- Closed learnings must have evidence: commit hash or documented reason
- Non-blocking validation (WARN trace level for violations)

**Traces Recorded:**
- Learning surface format completeness
- Closure evidence presence
- Learning IDs extracted
- Harmony score: 100 (pass) or 80-0 (violations × 20 penalty)
