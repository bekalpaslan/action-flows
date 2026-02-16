# Flow Registry

> Orchestrator checks here first.

## work

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| post-completion/ | Wrap-up after work | commit → registry update |
| contract-format-implementation/ | Implement CONTRACT.md formats end-to-end | code/contract/parser → code/frontend/component → code/frontend/integration → review → commit |
| design-to-code/ | Convert Figma designs to React components | figma-extract (orchestrator) → plan → HUMAN GATE → code/frontend/ → figma-map (orchestrator) → review → (code/frontend/integration if mode=generate-and-integrate) |
| design-system-sync/ | Sync Figma design tokens to frontend | figma-variables (orchestrator) → analyze → plan → HUMAN GATE → code/frontend/ → figma-rules (orchestrator) → review |

## maintenance

| Flow | Purpose | Chain |
|------|---------|-------|
| bug-triage/ | Structured bug fix | analyze → code → test → review → second-opinion/ |
| code-and-review/ | Refactor and review code | code → review → second-opinion/ → (loop if needed) |
| cleanup/ | Human-directed repository cleanup | analyze → plan → human gate → code → review → second-opinion/ → commit |
| harmony-audit-and-fix/ | Remediate format drift and contract violations | analyze/harmony-violation → code/fix-parser OR code/update-orchestrator OR code/update-contract → review/harmony-fix → second-opinion/ → commit |
| health-protocol/ | 7-phase immune response for contract violations | analyze (detect) → analyze (classify) → isolate (conditional) → diagnose → human gate → healing flow → verify-healing → analyze (learn) |
| parser-update/ | Update backend parser for evolved formats | analyze/parser-gap → code/backend/parser → test/parser → review → second-opinion/ → commit |

## explore

| Flow | Purpose | Chain |
|------|---------|-------|
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review → second-opinion/ |
| ideation/ | Structured ideation sessions | classify (human gate) → analyze → brainstorm → code (summary) |
| story-of-us/ | Poetic narrative of project journey | analyze → narrate → human gate → (narrate → human gate)× |

## review

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → second-opinion/ → review → second-opinion/ |
| test-coverage/ | Analyze test coverage and address gaps | test → analyze → code (conditional) → review → second-opinion/ |
| backwards-harmony-audit/ | Audit contract harmony from frontend backwards | analyze×3 (parallel) → audit → second-opinion/ |
| cli-integration-test/ | Systematic CLI integration testing | analyze → code → test → review → second-opinion/ |
| e2e-chrome-mcp/ (LEGACY) | Chrome MCP browser E2E test creation and execution | analyze → plan → human gate → code → chrome-mcp-test → review → second-opinion/ |
| e2e-playwright/ | Create and execute Playwright E2E tests | analyze → plan → HUMAN GATE → code → playwright-test (orchestrator) → review |
| contract-index/ | Create/update behavioral contract specifications for components | analyze → plan → human gate → code×N → review → second-opinion/ → commit |
| contract-compliance-audit/ | Audit contracts for inconsistencies, drift, and create compliance tests | analyze×2 (parallel) → plan → human gate → code×2 (parallel) → review → second-opinion/ → commit |

## settings

| Flow | Purpose | Chain |
|------|---------|-------|
| onboarding/ | Interactive teaching session for ActionFlows | onboarding (single step, foreground) |
| flow-creation/ | Create a new flow | plan → human gate → code → review → second-opinion/ |
| action-creation/ | Create a new action | plan → human gate → code → review → second-opinion/ |
| action-deletion/ | Remove action safely | analyze → code → review → second-opinion/ |
| standards-creation/ | Create canonical framework standards and templates | analyze → code/framework → review → second-opinion/ → commit |
| framework-health/ | Validate structure | analyze |
| contract-drift-fix/ | Update CONTRACT.md when formats evolve | analyze/contract-code-drift → code/update-contract → review/contract-update → second-opinion/ → commit |
| flow-drift-audit/ | Deep audit of all flow instructions vs actual actions/chains | analyze → plan → human gate → code×N → review → second-opinion/ → commit |

## intel

| Flow | Purpose | Chain |
|------|---------|-------|
| intel-analysis/ | Create living dossiers of code domains | analyze → plan → human gate → code → review → second-opinion/ → commit |

## pm

| Flow | Purpose | Chain |
|------|---------|-------|
| planning/ | Structured roadmap review and prioritization | analyze → plan → human gate → code → commit |
| learning-dissolution/ | Process accumulated learnings into doc updates, agent patches, template fixes | analyze → plan → human gate → code×N (parallel) → review → second-opinion/ → commit |

---

## Healing Flows Philosophy

Healing flows are **human-initiated** remediation chains triggered when system health degrades.

**Key Principles:**
1. **Human Decision Boundary**: Backend detects violations, human decides to heal
2. **Zero Orchestrator Burden**: Orchestrator is unaware of healing flows until human triggers
3. **Graceful Degradation**: System continues operating with degraded health until healed
4. **Sovereignty Preserved**: Human approves healing chain before execution
5. **Learning Cycle**: Each healing execution creates learnings for future prevention

**When to Use:**
- Health score drops below 90
- Critical violations detected (3+ in 24h)
- Recommendations suggest specific healing flow
- Human observes degraded behavior

**How It Works:**
1. Backend detects drift pattern
2. Frontend displays health degradation + recommendation
3. Human clicks "Fix Now" (or sends instruction)
4. Orchestrator routes to healing flow
5. Orchestrator compiles healing chain
6. Human approves chain
7. Healing executes
8. Health score rises, violations cleared

---

## Detailed Flow Specifications

### harmony-audit-and-fix/ (maintenance)
Remediate format drift and contract violations detected at gate checkpoints.
- Chain: analyze/harmony-violation → code/fix-parser OR code/update-orchestrator OR code/update-contract → review/harmony-fix → commit
- Example: "Fix Gate 4 violations" → identify missing status column → update parser → review → commit → health score rises

### contract-drift-fix/ (settings)
Update CONTRACT.md when orchestrator/agent formats evolve beyond documented spec.
- Chain: analyze/contract-code-drift → code/update-contract → review/contract-update → commit
- Example: "Sync CONTRACT.md with reality" → find Format 1.1 now includes 'priority' field → update CONTRACT.md → review → commit

### parser-update/ (maintenance)
Update backend parser to handle evolved orchestrator/agent output formats.
- Chain: analyze/parser-gap → code/backend/parser → test/parser → review → commit
- Example: "Update parser for Gate 4" → parser can't handle optional 'status' field → update parseChainCompilation → test → review → commit
