# Flow Registry

> Orchestrator checks here first.

## work

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| post-completion/ | Wrap-up after work | commit → registry update |
| contract-format-implementation/ | Implement CONTRACT.md formats end-to-end | code/contract/parser → code/frontend/component → code/frontend/integration → validate/harmony → review → commit |

## maintenance

| Flow | Purpose | Chain |
|------|---------|-------|
| bug-triage/ | Structured bug fix | analyze → code → test → review |
| code-and-review/ | Refactor and review code | code → review → second-opinion/ → (loop if needed) |
| cleanup/ | Human-directed repository cleanup | analyze → plan → human gate → code → review → second-opinion/ → commit |
| harmony-audit-and-fix/ | Remediate format drift and contract violations | analyze/harmony-violation → code/fix-parser OR code/update-orchestrator OR code/update-contract → review/harmony-fix → commit |
| parser-update/ | Update backend parser for evolved formats | analyze/parser-gap → code/backend/parser → test/parser → review → commit |

## explore

| Flow | Purpose | Chain |
|------|---------|-------|
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |
| ideation/ | Structured ideation sessions | classify (human gate) → analyze → brainstorm → code (summary) |
| story-of-us/ | Poetic narrative of project journey | analyze → narrate → human gate → (narrate → human gate)× |

## review

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → second-opinion/ → review |
| test-coverage/ | Analyze test coverage and address gaps | test → analyze → code (conditional) |
| backwards-harmony-audit/ | Audit contract harmony from frontend backwards | analyze×3 (parallel) → audit → second-opinion/ |
| cli-integration-test/ | Systematic CLI integration testing | analyze → code → test → review |
| e2e-chrome-mcp/ | Chrome MCP browser E2E test creation and execution | analyze → plan → human gate → code → chrome-mcp-test → review |
| contract-index/ | Create/update behavioral contract specifications for components | analyze → plan → human gate → code×N → review → commit |
| contract-compliance-audit/ | Audit contracts for inconsistencies, drift, and create compliance tests | analyze×2 (parallel) → plan → human gate → code×2 (parallel) → review → second-opinion/ → commit |

## settings

| Flow | Purpose | Chain |
|------|---------|-------|
| onboarding/ | Interactive teaching session for ActionFlows | onboarding (single step, foreground) |
| flow-creation/ | Create a new flow | plan → human gate → code → review |
| action-creation/ | Create a new action | plan → human gate → code → review → second-opinion/ |
| action-deletion/ | Remove action safely | analyze → code → review |
| framework-health/ | Validate structure | analyze |
| contract-drift-fix/ | Update CONTRACT.md when formats evolve | analyze/contract-code-drift → code/update-contract → review/contract-update → commit |

## pm

| Flow | Purpose | Chain |
|------|---------|-------|
| planning/ | Structured roadmap review and prioritization | analyze → plan → human gate → code → commit |
| learning-dissolution/ | Process accumulated learnings into doc updates, agent patches, template fixes | analyze → plan → human gate → code×N (parallel) → review → commit |

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

### harmony-audit-and-fix/

**Context:** maintenance

**Trigger:**
- Human says "fix harmony violations"
- Human says "fix Gate N violations" (where N is gate number)
- Human clicks "Fix Now" in Harmony Health Dashboard

**Description:**
Remediate format drift and contract violations detected at gate checkpoints.

**Chain:**
1. `analyze/harmony-violation`
   - Input: Gate ID, violation pattern, last 24h traces
   - Output: Root cause analysis (parser bug? orchestrator drift? contract outdated?)
2. `code/fix-parser` OR `code/update-orchestrator-instruction` OR `code/update-contract`
   - Input: Root cause from step 1
   - Output: Fix applied (parser updated, instruction clarified, or contract synced)
3. `review/harmony-fix`
   - Input: Changes from step 2
   - Output: Validation that fix resolves violations
4. `commit/`
   - Input: All changes
   - Output: Committed fix with harmony-fix tag

**Example:**
```
Human: "Fix Gate 4 violations"
Orchestrator routes to harmony-audit-and-fix/
Chain: analyze → identify missing status column → update parser → review → commit
Result: Gate 4 violations cleared, health score rises
```

**Notes:**
- This flow requires human approval at chain presentation
- Fix may involve backend (parser), orchestrator (instruction), or contract (spec)
- Always validate fix with review/ before committing

---

### contract-drift-fix/

**Context:** settings

**Trigger:**
- Human says "sync CONTRACT.md with reality"
- Human says "fix contract drift"
- Recommendations suggest contract-drift-fix/

**Description:**
Update CONTRACT.md when orchestrator/agent formats evolve beyond documented spec.

**Chain:**
1. `analyze/contract-code-drift`
   - Input: Comparison of CONTRACT.md vs actual outputs
   - Output: List of format mismatches (missing fields, new formats, deprecated sections)
2. `code/update-contract`
   - Input: Drift analysis from step 1
   - Output: Updated CONTRACT.md matching current reality
3. `review/contract-update`
   - Input: CONTRACT.md changes
   - Output: Validation that contract now matches code
4. `commit/`
   - Input: Updated CONTRACT.md
   - Output: Committed with contract-sync tag

**Example:**
```
Human: "Sync CONTRACT.md with reality"
Orchestrator routes to contract-drift-fix/
Chain: analyze → find Format 1.1 now includes 'priority' field → update CONTRACT.md → review → commit
Result: CONTRACT.md documentation matches actual orchestrator output
```

**Notes:**
- Use this when orchestrator naturally evolves formats
- CONTRACT.md should document reality, not prescribe it
- After sync, update parsers to match new contract

---

### parser-update/

**Context:** maintenance

**Trigger:**
- Human says "update parser for Gate N"
- Recommendations suggest parser-update/
- Gate 9 repeatedly fails on same agent output pattern

**Description:**
Update backend parser to handle evolved orchestrator/agent output formats.

**Chain:**
1. `analyze/parser-gap`
   - Input: Gate ID, failed parsing examples, expected vs actual format
   - Output: What parser can't handle (new field? different structure? type change?)
2. `code/backend/parser`
   - Input: Parser gap analysis
   - Output: Updated parseXXX() function in packages/shared/src/contract/parsers/
3. `test/parser`
   - Input: Updated parser, sample outputs
   - Output: Validation that parser now handles new format
4. `review/`
   - Input: Parser code changes
   - Output: Code review approval
5. `commit/`
   - Input: Parser changes
   - Output: Committed with parser-update tag

**Example:**
```
Human: "Update parser for Gate 4"
Orchestrator routes to parser-update/
Chain: analyze → parser can't handle optional 'status' field → update parseChainCompilation → test → review → commit
Result: Parser handles new format variant, gate violations cleared
```

**Notes:**
- This is the "backend catches up to orchestrator evolution" flow
- Always add tests for new format variants
- Graceful degradation: parser should handle both old and new formats
