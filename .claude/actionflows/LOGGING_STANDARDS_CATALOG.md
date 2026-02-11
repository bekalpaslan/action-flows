# Logging Standards Catalog

> Comprehensive logging specification for orchestrator, gates, flows, agents, data operations, and tool usage. Configurable log levels and trace depths for complete visibility.

---

## Overview

**Purpose:** Enable complete traceability of orchestrator decisions, subagent reasoning, tool usage, data flows, and gate passage.

**Scope:**
- Orchestrator decisions (routing, compilation, execution)
- Gate operations (14 gates × logging requirements)
- Flow instructions (per-flow logging config)
- Subagent thought processes (internal reasoning)
- Tool usage (every Bash, Read, Glob, Grep, Edit, Write call)
- Data reads (file I/O operations)
- Action execution (analyze, code, review, etc.)

**Configuration:** Log levels control verbosity; chains can specify required trace depth.

---

## Part 1: Log Levels & Types

### Log Level Hierarchy

```
TRACE (10)    — Maximum verbosity, every decision point
DEBUG (20)    — Reasoning steps, decision alternatives
INFO (30)     — Key decisions, state changes, milestones
WARN (40)     — Warnings, deferred work, incomplete states
ERROR (50)    — Failures, unrecoverable errors
```

### Log Level Selection by Context

| Context | Default Level | Use When |
|---------|---------------|----------|
| **Standard chain execution** | INFO | Production workflows, normal development |
| **Debugging failing chain** | DEBUG | Investigating errors, unusual behavior |
| **Deep investigation** | TRACE | Root cause analysis, architecture audit |
| **High-stakes work** | DEBUG | Financial, security, or critical features |
| **Performance analysis** | TRACE | Measuring execution time, optimization |

---

## Part 2: Log Types & Categories

### 2.1 Orchestrator Decision Logs

**What:** Orchestrator's internal decisions and reasoning

**When:** At each orchestrator gate/checkpoint

**Log Type:** `orchestrator-decision`

**Fields:**
```yaml
timestamp: ISO 8601
gate: [gate-number, gate-name]
decision: [routing|compilation|trigger|evaluation|approval]
input: [what triggered this decision]
alternatives_considered: [other options evaluated]
selected: [which option was chosen]
rationale: [why this decision]
confidence: [high|medium|low]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (INFO level):**
```
[2026-02-11 14:23:45] ORCHESTRATOR_DECISION
Gate: 2 (Route to Context)
Input: "implement user authentication"
Selected: work context
Rationale: Keywords "implement" + "build" matched work context triggers
Confidence: high
```

**Example (DEBUG level):**
```
[2026-02-11 14:23:45] ORCHESTRATOR_DECISION
Gate: 2 (Route to Context)
Input: "implement user authentication"
Keywords Extracted: [implement, user, authentication]
Context Scores:
  - work: 0.95 (implement=trigger)
  - settings: 0.20 (configure?)
  - maintenance: 0.15 (refactor?)
Selected: work (score 0.95)
Rationale: Highest scoring context (0.95), implementation keyword triggers work
Confidence: high
```

**Example (TRACE level):**
```
[2026-02-11 14:23:45] ORCHESTRATOR_DECISION
Gate: 2 (Route to Context)
Input: "implement user authentication"
Preprocessing: [lowercase, tokenize, remove_stopwords]
Tokens: [implement, user, authentication]
Stop Words Removed: []
Context Matching:
  - work: [implement (HIGH)=1.0, build (HIGH), create (HIGH), develop (HIGH), code (HIGH)]
    Token "implement" matches trigger "implement" → +0.95
    Final Score: 0.95
  - maintenance: [fix (HIGH), debug (HIGH), refactor (HIGH), optimize (MEDIUM)]
    No matching tokens → +0.0
    Final Score: 0.15 (base)
  - explore: [research (MEDIUM), investigate (MEDIUM), analyze (HIGH)]
    No matching tokens → +0.0
    Final Score: 0.15 (base)
  [... all contexts scored ...]
Selected Context: work (highest score 0.95)
Confidence: high
Reasoning: Single high-confidence match with no ambiguity
```

---

### 2.2 Gate Passage Logs

**What:** Each time orchestrator passes through a gate

**Log Type:** `gate-passage`

**Fields:**
```yaml
timestamp: ISO 8601
gate_id: [1-14]
gate_name: [name]
phase: [REQUEST_RECEPTION|CHAIN_COMPILATION|CHAIN_EXECUTION|COMPLETION|POST_EXECUTION]
status: [entering|processing|exiting]
input_state: [what was state before gate?]
output_state: [what is state after gate?]
decisions_made: [list of decisions at this gate]
logs_produced: [list of log types produced]
duration_ms: [execution time]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (INFO level):**
```
[2026-02-11 14:24:30] GATE_PASSAGE
Gate: 4 (Compile Action Chain)
Phase: CHAIN_COMPILATION
Status: exiting
Duration: 245ms
Chain Compiled: code-and-review [3 steps, parallel enabled]
Logs Produced: [chain-compilation]
```

**Example (DEBUG level):**
```
[2026-02-11 14:24:30] GATE_PASSAGE
Gate: 4 (Compile Action Chain)
Phase: CHAIN_COMPILATION
Status: exiting
Input State:
  context: work
  intent: "implement user authentication"
  scope: backend + frontend
Output State:
  chain_name: backend-authentication-phase-1
  step_count: 3
  parallelization: [code/backend, code/frontend] → review → second-opinion
  estimated_duration: 120 minutes
Duration: 245ms
Chain Compiled:
  1. code/backend (Express auth routes, JWT middleware)
  2. code/frontend (Login form, auth context)
  3. review (Code quality, security checks)
Logs Produced: [chain-compilation, step-dependencies, estimated-timeline]
```

---

### 2.3 Subagent Thought Process Logs

**What:** Agent's internal reasoning, decision points, alternatives considered

**When:** During agent execution (before, during, after)

**Log Type:** `agent-reasoning`

**Fields:**
```yaml
timestamp: ISO 8601
agent: [action-type/subtype]
task: [assigned task]
phase: [startup|analysis|reasoning|decision|execution|completion]
reasoning: [what is agent thinking?]
inputs_received: [config, context, previous outputs]
alternatives: [options considered]
chosen_approach: [which approach selected]
confidence: [high|medium|low]
next_step: [what will happen next]
blockers: [any obstacles?]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (DEBUG level, analyze/ agent):**
```
[2026-02-11 14:25:00] AGENT_REASONING
Agent: analyze/
Task: contract-coverage-analysis
Phase: reasoning
Reasoning: Task is to analyze format coverage across packages/shared/src/contract/
Inputs Received:
  scope: packages/shared/src/contract/
  aspect: coverage
Approach Options Considered:
  1. Parse CONTRACT.md, grep for parsers → fast, might miss edge cases
  2. Walk all parsers, verify FORMAT properties → comprehensive, slower
  3. Build dependency graph → complete but complex
Chosen Approach: Option 2 (comprehensive walk)
Rationale: Contract compliance is critical; comprehensive > fast
Next Step: Glob packages/shared/src/contract/parsers/*.ts
Confidence: high
```

---

### 2.4 Tool Usage Logs

**What:** Every tool call made by orchestrator or agents

**When:** Before and after each tool execution

**Log Type:** `tool-usage`

**Fields:**
```yaml
timestamp: ISO 8601
tool: [Bash|Read|Glob|Grep|Edit|Write|Task|etc]
operation: [command for Bash, file_path for Read, pattern for Glob, etc]
parameters: [all parameters passed]
caller: [orchestrator|analyze|code|review|etc]
purpose: [why was this tool used?]
status: [started|completed|error]
result_summary: [brief outcome]
files_affected: [list of files modified/read]
data_size: [lines/bytes processed]
duration_ms: [execution time]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (INFO level, Read tool):**
```
[2026-02-11 14:25:30] TOOL_USAGE
Tool: Read
Operation: packages/shared/src/contract/CONTRACT.md
Caller: analyze/
Purpose: Extract all 17 format definitions for coverage inventory
Status: completed
Result Summary: 17 formats read, 334 lines processed
Duration: 45ms
```

**Example (DEBUG level, Glob tool):**
```
[2026-02-11 14:25:31] TOOL_USAGE
Tool: Glob
Operation: Pattern matching
Pattern: packages/shared/src/contract/parsers/*.ts
Caller: analyze/
Purpose: Find all parser implementations to cross-reference with CONTRACT.md formats
Parameters:
  pattern: packages/shared/src/contract/parsers/*.ts
  recursive: true
Status: completed
Files Found: [6 parsers]
Files Matched:
  - registryParser.ts
  - statusParser.ts
  - chainParser.ts
  - actionParser.ts
  - eventParser.ts
  - learningParser.ts
Duration: 23ms
Confidence: complete (Glob exhaustive on pattern)
```

**Example (DEBUG level, Edit tool):**
```
[2026-02-11 14:26:00] TOOL_USAGE
Tool: Edit
Operation: String replacement
File: packages/shared/src/contract/validation/schemas.ts
Caller: code/
Purpose: Add Zod validation schema for Format 6.1 (Error Announcement)
Parameters:
  old_string: [Format 5.3 schema definition ...]
  new_string: [Format 6.1 schema definition ...]
  replace_all: false
Status: completed
Result Summary: 1 replacement, file intact
Lines Changed: 15 lines added at line 420
Files Affected: [packages/shared/src/contract/validation/schemas.ts]
Duration: 12ms
Validation: Changed file runs TypeScript type check ✅
```

---

### 2.5 Data Flow Logs

**What:** What data moved through the system (file reads, transformations, writes)

**When:** During data processing operations

**Log Type:** `data-flow`

**Fields:**
```yaml
timestamp: ISO 8601
operation: [read|transform|write|parse|validate]
source: [file path or origin]
destination: [file path or destination]
data_type: [json|markdown|typescript|yaml|csv|etc]
record_count: [number of records/lines processed]
validation_status: [valid|partial|invalid]
transformations_applied: [list of transformations]
errors: [any data quality issues]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (DEBUG level):**
```
[2026-02-11 14:27:00] DATA_FLOW
Operation: parse
Source: CONTRACT.md
Data Type: markdown
Record Count: 17 formats parsed
Transformations Applied:
  1. Extract H4 headers (Format X.Y)
  2. Parse metadata (Priority, P value)
  3. Extract pattern examples
  4. Link to parsers/consumers
Validation Status: valid
Errors: none
Result: 17 format records ready for analysis
```

---

### 2.6 Flow Instruction Logs

**What:** Which flows were invoked, their configuration, parameters

**When:** Each flow starts

**Log Type:** `flow-execution`

**Fields:**
```yaml
timestamp: ISO 8601
flow: [flow-name/]
context: [work|maintenance|explore|review|settings|pm|intel]
trigger: [human request, auto-trigger, follow-up]
parameters: [flow config, input variables]
steps: [list of steps]
approvals_required: [human gates in chain]
estimated_duration: [if known]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (INFO level):**
```
[2026-02-11 14:27:30] FLOW_EXECUTION
Flow: code-and-review/
Context: work
Trigger: human request "implement user authentication"
Steps:
  1. code/backend (Express routes, middleware)
  2. code/frontend (Login form, context)
  3. review/ (Code quality, security)
  4. second-opinion/ (Expert review)
  5. commit/ (Create git commit)
Approvals Required: [before step 1, before step 5]
Estimated Duration: 2-3 hours
```

---

### 2.7 Configuration/Context Logs

**What:** Configuration injected into agents, context read at flow start

**When:** Before flow execution

**Log Type:** `configuration`

**Fields:**
```yaml
timestamp: ISO 8601
scope: [project|flow|agent|action]
config_name: [e.g., project.config.md, flow-config]
parameters_injected: [list of key values]
overrides: [any defaults overridden?]
validation: [config valid?]
log_level: [TRACE|DEBUG|INFO|WARN|ERROR]
```

**Example (DEBUG level):**
```
[2026-02-11 14:28:00] CONFIGURATION
Scope: project
Config Name: project.config.md
Parameters Injected:
  - name: ActionFlows Dashboard
  - stack: TypeScript + Express + React + Electron
  - ports: backend 3001, vite 5173
  - shared_types_path: packages/shared/src/
  - test_runner: vitest
Overrides: none
Validation: ✅ All required fields present
Context Ready: ✅ Ready for code agents
```

---

## Part 3: Per-Action Logging Requirements

### 3.1 analyze/ Agent Logging

**Required Logs:**

| Log Type | Level | Required? | Format |
|----------|-------|-----------|--------|
| agent-reasoning | DEBUG | ✅ Yes | Structured (YAML) |
| tool-usage (Glob, Grep, Read) | DEBUG | ✅ Yes | Structured (YAML) |
| data-flow (parse CONTRACT.md, etc) | DEBUG | ✅ Yes | Structured (YAML) |
| analysis-report | INFO | ✅ Yes | CONTRACT.md Format 5.2 |
| findings | DEBUG | Optional | Narrative |
| recommendations | INFO | ✅ Yes | Numbered list |

**Trace Depth Options:**

- **INFO (default):** Analysis report only, no internal reasoning
- **DEBUG:** + reasoning steps, tool usage, data flow
- **TRACE:** + all alternatives considered, scoring details, dead ends explored

**Example INFO Output:**
```markdown
# Contract Format Coverage Analysis

**Aspect:** Contract compliance
**Scope:** packages/shared/src/contract/
**Date:** 2026-02-11

## Findings

- 17 formats specified in CONTRACT.md
- 17 parsers implemented (100%)
- 17 validation schemas (100%)

## Recommendations

1. All formats production-ready
```

**Example DEBUG Output:**
```markdown
# Contract Format Coverage Analysis

**Aspect:** Contract compliance
**Scope:** packages/shared/src/contract/

[Standard analysis report...]

---

## Internal Reasoning (DEBUG)

### Coverage Analysis Approach
Considered: (1) Regex scan, (2) Walk parsers, (3) Build dependency graph
Chosen: Walk parsers (comprehensive, verifiable)

### Tool Usage Summary
- Glob: 6 parser files found in 23ms
- Grep: 34 imports verified
- Read: CONTRACT.md (334 lines)

### Data Flow
```
CONTRACT.md (17 formats)
  ↓ parse (extract Format X.Y)
  ↓ cross-reference
packages/shared/src/contract/parsers/ (17 parser files)
  ↓ verify implementation
  ↓ validate exports
Result: 17/17 parsers implemented
```
```

---

### 3.2 code/ Agent Logging

**Required Logs:**

| Log Type | Level | Required? | Format |
|----------|-------|-----------|--------|
| agent-reasoning | DEBUG | ✅ Yes | Structured (YAML) |
| tool-usage (Edit, Write, Bash) | DEBUG | ✅ Yes | Structured (YAML) |
| changes-summary | INFO | ✅ Yes | Markdown table |
| file-modifications | DEBUG | ✅ Yes | Structured (YAML) |
| validation | INFO | ✅ Yes | Pass/fail + details |
| learnings | INFO | Optional | Structured (agent-standards) |

**Trace Depth Options:**

- **INFO (default):** Changes summary, validation results
- **DEBUG:** + reasoning, tool calls, file modifications detailed
- **TRACE:** + all considered approaches, refactored code versions, performance analysis

**Required Output Structure (changes.md):**

```yaml
# Code Implementation: [Feature Name]

## Summary
[1-2 sentences what was built]

## Files Changed
| File | Status | Changes |
|------|--------|---------|
| packages/backend/src/routes/auth.ts | Modified | +85/-12 (auth endpoints) |
| packages/app/src/contexts/AuthContext.tsx | Created | +156 (new file) |

## Validations Passed
- TypeScript type check ✅
- Lint (no errors) ✅
- Imports verified ✅
- Builds successfully ✅

## Learnings
[Optional: issues found, patterns discovered]
```

---

### 3.3 review/ Agent Logging

**Required Logs:**

| Log Type | Level | Required? | Format |
|----------|-------|-----------|--------|
| agent-reasoning | DEBUG | ✅ Yes | Structured (YAML) |
| tool-usage (Glob, Read, Grep) | DEBUG | ✅ Yes | Structured (YAML) |
| review-findings | INFO | ✅ Yes | CONTRACT.md Format 5.1 |
| quality-assessment | INFO | ✅ Yes | Scored feedback |
| security-scan | DEBUG | Optional | Security findings |
| recommendations | INFO | ✅ Yes | Numbered list |

**Review Report Structure (CONTRACT.md Format 5.1):**

```markdown
# Code Review: [Feature Name]

## Summary
[1-2 sentences overall assessment]

## Quality Score
- Overall: 92/100
- Code quality: 95/100
- Test coverage: 85/100
- Documentation: 88/100

## Findings
1. **[Category]** - Finding description (severity: high/medium/low)
2. [...]

## Recommendations
1. [Action item]
2. [...]

## Approval
- [APPROVED | NEEDS_CHANGES | BLOCKED]
- Confidence: high/medium/low
```

---

### 3.4 plan/ Agent Logging

**Required Logs:**

| Log Type | Level | Required? | Format |
|----------|-------|-----------|--------|
| agent-reasoning | DEBUG | ✅ Yes | Structured (YAML) |
| planning-phases | INFO | ✅ Yes | Numbered phases |
| risk-assessment | DEBUG | ✅ Yes | Risk matrix |
| timeline-estimate | INFO | ✅ Yes | Duration estimates |
| dependencies | DEBUG | ✅ Yes | Dependency graph |

**Plan Document Structure:**

```markdown
# Implementation Plan: [Feature]

## Approach
[What approach will be taken, why]

## Phases
1. [Phase 1] - [Duration] - [What]
2. [Phase 2] - [Duration] - [What]

## Risks & Mitigation
| Risk | Severity | Mitigation |
|------|----------|-----------|
| [risk] | high/med/low | [mitigation] |

## Timeline
[Total estimated duration]
```

---

### 3.5 audit/ Agent Logging

**Required Logs:**

| Log Type | Level | Required? | Format |
|----------|-------|-----------|--------|
| agent-reasoning | DEBUG | ✅ Yes | Structured (YAML) |
| audit-findings | INFO | ✅ Yes | Structured (YAML) |
| severity-assessment | INFO | ✅ Yes | P0/P1/P2 ratings |
| audit-report | INFO | ✅ Yes | Comprehensive report |
| recommendations | INFO | ✅ Yes | Numbered list |

---

## Part 4: Gate Logging Requirements

### Gate 2: Route to Context

**Logs to Produce:**
- `orchestrator-decision` (routing decision)
- `gate-passage` (entering/exiting gate)

**Trace Depth:**
- INFO: Selected context only
- DEBUG: Scoring for all contexts
- TRACE: Keyword extraction, stopword removal, full matching logic

---

### Gate 4: Compile Chain

**Logs to Produce:**
- `orchestrator-decision` (which flow selected)
- `chain-compilation` (chain structure)
- `gate-passage` (entering/exiting)
- `configuration` (config injected into agents)

**Trace Depth:**
- INFO: Chain steps only
- DEBUG: + rationale, alternatives considered
- TRACE: + parallelization analysis, dependency resolution details

---

### Gate 6: Human Approval

**Logs to Produce:**
- `human-approval` (approval/rejection/modifications)
- `gate-passage` (state transition)

**Trace Depth:**
- INFO: Decision + timestamp
- DEBUG: + what human changed, suppression flags
- TRACE: + all displayed options, human's interaction pattern

---

### Gate 7: Execute Step

**Logs to Produce:**
- `tool-usage` (all agent tools)
- `agent-reasoning` (agent thinking)
- `data-flow` (data processing)
- `gate-passage` (step start/completion)

**Trace Depth:**
- INFO: Step completion announcement
- DEBUG: + tool calls, agent reasoning
- TRACE: + all data transformations, alternatives considered

---

### Gate 9: Mid-Chain Evaluation

**Logs to Produce:**
- `orchestrator-decision` (stay/recompile/halt)
- `gate-passage` (evaluation checkpoint)

**Trace Depth:**
- INFO: Decision only (continue vs. recompile)
- DEBUG: + 6-trigger evaluation results
- TRACE: + detailed trigger analysis, alternative chains considered

---

### Gate 10: Auto-Trigger Detection

**Logs to Produce:**
- `orchestrator-decision` (which triggers fired)
- `gate-passage` (trigger detection)
- `agent-reasoning` (why triggers fired)

**Trace Depth:**
- INFO: Triggers fired, steps inserted
- DEBUG: + trigger criteria matching, scoring
- TRACE: + all patterns checked, pattern matching details

---

## Part 5: Configuration & Control

### 5.1 Chain-Level Log Configuration

Chains can specify required trace depth:

```yaml
chain: code-and-review

# Default: INFO (standard logs)
# Options: TRACE, DEBUG, INFO, WARN, ERROR

trace_depth: DEBUG  # This chain requires DEBUG-level logs

steps:
  1: code/backend
  2: code/frontend
  3: review/
  4: second-opinion/
  5: commit/

# Optional: Per-step overrides
step_overrides:
  4:
    trace_depth: TRACE  # Second opinion should be deeply traced
```

### 5.2 Per-Agent Log Configuration

Agents can be invoked with log level:

```bash
# Run analyze/ with TRACE-level logging
pnpm spawn analyze/ --log-level TRACE --task "coverage analysis"

# Run code/ with DEBUG-level logging (default)
pnpm spawn code/ --task "implement auth" --log-level DEBUG
```

### 5.3 Runtime Log Filtering

Orchestrator can filter logs at presentation time:

```yaml
presentation_mode: summary  # Only show INFO+ logs
# Options: summary (INFO+), detailed (DEBUG+), full (TRACE+)

hidden_log_types:  # Optionally hide specific log types
  - tool-usage  # Hide all tool calls
  - data-flow   # Hide data processing details
```

---

## Part 6: Log Output & Storage

### 6.1 Log File Structure

```
.claude/actionflows/logs/
├── [action-type]/
│   └── [session-name]_[timestamp]/
│       ├── report.md (main output)
│       ├── logs/
│       │   ├── orchestrator-decisions.log (JSON lines)
│       │   ├── tool-usage.log (JSON lines)
│       │   ├── agent-reasoning.log (JSON lines)
│       │   ├── data-flow.log (JSON lines)
│       │   └── gates.log (JSON lines)
│       └── metadata.yaml
│           - trace_depth: DEBUG
│           - duration_ms: 1250
│           - log_count: 47
```

### 6.2 Log Format (JSON Lines)

Each log is a JSON object on its own line (for streaming):

```json
{"timestamp":"2026-02-11T14:25:30Z","log_type":"orchestrator-decision","gate":2,"decision":"routing","selected":"work","confidence":"high","duration_ms":23}
{"timestamp":"2026-02-11T14:25:31Z","log_type":"tool-usage","tool":"Glob","pattern":"packages/shared/src/contract/parsers/*.ts","files_found":6,"duration_ms":23}
{"timestamp":"2026-02-11T14:25:32Z","log_type":"agent-reasoning","agent":"analyze/","phase":"reasoning","approach":"Walk parsers (comprehensive)","confidence":"high"}
```

### 6.3 Log Aggregation

Orchestrator creates aggregate logs showing:
- Total execution time
- Tool usage summary
- Decision summary
- Critical errors/warnings
- Agent reasoning overview

---

## Part 7: Validation & Compliance

### 7.1 Log Completeness Validator

CLI tool: `pnpm run logs:validate`

```bash
$ pnpm run logs:validate --action code/ --session "code-and-review_2026-02-11-14-30"

Validating logs for: code-and-review (session: code-and-review_2026-02-11-14-30)

Checks:
✅ Report.md exists (8.2 KB)
✅ Logs/ directory exists
✅ orchestrator-decisions.log (3 entries)
✅ tool-usage.log (12 entries)
✅ agent-reasoning.log (5 entries)
✅ data-flow.log (2 entries)
✅ gates.log (6 entries)
✅ metadata.yaml (trace_depth: DEBUG)
⚠️ Warnings: None
❌ Errors: None

Summary: All logs present and valid
Completeness: 100%
Log Count: 28 (expected: ~25 ✅)
```

### 7.2 Log Drift Detection

Monitor for missing logs:

```bash
$ pnpm run logs:audit --since "2026-02-01"

Auditing logs from 2026-02-01 to today...

Sessions Analyzed: 47
✅ Complete (all gates logged): 43
⚠️ Partial (some gates missing): 4
❌ Incomplete (critical logs missing): 0

Partial Sessions:
- harmony-remediation_2026-02-11-18-20 (missing: gate-9-auto-triggers)
- contract-compliance_2026-02-10-20-05 (missing: gate-6-human-approval)
[...]

Recommendation: Re-run with trace_depth: DEBUG for detailed logging
```

---

## Part 8: Examples: Complete Trace

### Example 1: DEBUG-Level Trace (code-and-review chain)

```
[2026-02-11 14:30:00] ORCHESTRATOR_DECISION
Gate: 2 (Route to Context)
Input: "implement user authentication"
Selected: work
Confidence: high

[2026-02-11 14:30:01] ORCHESTRATOR_DECISION
Gate: 4 (Compile Chain)
Flow: code-and-review/
Chain: backend-auth → frontend-auth → review → second-opinion → commit

[2026-02-11 14:30:02] CONFIGURATION
Scope: project
Config: project.config.md
Parameters: [backend Express 4.18, frontend React 18.2, ports 3001/5173]
Validation: ✅

[2026-02-11 14:30:03] FLOW_EXECUTION
Flow: code-and-review/
Context: work
Steps: [code/backend, code/frontend, review/, second-opinion/, commit/]
Approvals: [before step 1, before step 5]

[2026-02-11 14:30:30] GATE_PASSAGE
Gate: 7 (Execute Step 1)
Step: code/backend
Status: starting

[2026-02-11 14:30:31] AGENT_REASONING
Agent: code/backend
Task: Implement Express auth routes + JWT middleware
Phase: startup
Approach: (1) Auth routes, (2) JWT verification middleware, (3) integration tests
Confidence: high

[2026-02-11 14:30:33] TOOL_USAGE
Tool: Read
File: packages/backend/src/routes/index.ts
Purpose: Understand existing route structure
Duration: 12ms

[2026-02-11 14:30:45] TOOL_USAGE
Tool: Write
File: packages/backend/src/routes/auth.ts
Operation: Create new auth routes file
Lines: +85
Duration: 18ms

[2026-02-11 14:30:50] TOOL_USAGE
Tool: Edit
File: packages/backend/src/middleware/index.ts
Operation: Add JWT verification middleware export
Changes: +15 lines
Duration: 8ms

[2026-02-11 14:31:00] DATA_FLOW
Operation: validate
File: packages/backend/src/routes/auth.ts
DataType: TypeScript
Status: TypeScript check ✅, Lint ✅

[2026-02-11 14:31:05] GATE_PASSAGE
Gate: 7 (Execute Step 1 - Complete)
Step: code/backend
Status: completed
Files Modified: 3
Duration: 35 minutes
Logs Produced: [agent-reasoning, tool-usage×5, data-flow, gate-passage]

[2026-02-11 14:31:06] GATE_PASSAGE
Gate: 8 (Mid-Chain Evaluation)
Step Completed: code/backend
Evaluation:
  - Agent Output Signals: ✅ No errors
  - Pattern Recognition: ✅ Auth pattern matches code-and-review
  - Quality Threshold: ✅ TypeScript + Lint pass
  - Dependency Discovery: ✅ No new dependencies
Decision: Continue to next step

[2026-02-11 14:31:07] GATE_PASSAGE
Gate: 9 (Auto-Trigger Detection)
Step Completed: code/backend
Triggers Checked:
  - Review output: No (code agent, not review)
  - Partial completion (< 100%): No (100% complete)
  - Other triggers: None
Auto-Triggers Fired: None
Continue: to step 2 (code/frontend)

[... steps 2-5 follow similar pattern ...]

[2026-02-11 15:45:00] CHAIN_COMPLETION
Chain: code-and-review (backend-auth)
Status: success
Duration: 75 minutes
Commits: 1 (abc12345)
Files Modified: 12
Lines Changed: +456/-23
Quality Score: 92/100
Approvals: 100% (all human gates approved)
Logs Produced: 47 log entries
```

---

## Part 9: Future Enhancements

### 9.1 Log Visualization Dashboard

Future dashboard showing:
- Execution timeline with gate passages
- Decision tree (what was chosen at each gate)
- Data flow diagram (what files were read/written)
- Agent reasoning flow (what agents thought)
- Critical path analysis (slowest steps)

### 9.2 Log-Based Debugging

Query logs like:
```
logs:query "WHERE gate=7 AND duration_ms > 1000"
→ Find all slow agent executions

logs:query "WHERE log_type=orchestrator-decision AND confidence < 0.7"
→ Find uncertain routing decisions

logs:query "WHERE agent=code AND tool=Write AND file CONTAINS 'auth'"
→ Find all auth-related code changes
```

### 9.3 Log Compliance Rules

Define rules like:
- "Every chain must have gate-6-human-approval logs"
- "Code agents must have tool-usage logs"
- "Review agents must complete within 10 minutes"
- "No orchestrator decisions with confidence < 0.8"

---

## Part 10: Implementation Roadmap

### Phase 1: Core Logging Infrastructure (P0)

- [ ] Define log JSON schema for all log types
- [ ] Implement orchestrator decision logging (Gates 2, 4, 6, 9, 10)
- [ ] Implement gate passage logging (all gates)
- [ ] Add to all agent.md files: required logs per action type
- [ ] Create logs/ subdirectory structure

**Effort:** ~300 lines of schema definition + orchestrator updates

### Phase 2: Agent Logging Integration (P1)

- [ ] Add logger utility to agent scaffold
- [ ] Update analyze/ agent to produce agent-reasoning logs
- [ ] Update code/ agent to produce tool-usage + data-flow logs
- [ ] Update review/ agent to produce quality-assessment logs
- [ ] Add trace_depth parameter to agent invocation

**Effort:** ~200 lines per agent

### Phase 3: Configuration & Control (P2)

- [ ] Implement trace_depth configuration in chains
- [ ] Create log filtering at presentation time
- [ ] Add per-step trace_depth overrides
- [ ] Build logs:validate CLI

**Effort:** ~400 lines

### Phase 4: Validation & Analytics (P2)

- [ ] Implement logs:audit CLI
- [ ] Create log drift detection
- [ ] Build log aggregation summary
- [ ] Add compliance rule engine

**Effort:** ~500 lines

---

## Appendix: Quick Reference

### Log Type Quick Lookup

| Want to Know... | Log Type | Where |
|-----------------|----------|-------|
| Why was context selected? | orchestrator-decision | Gate 2 |
| What chain was compiled? | chain-compilation | Gate 4 |
| What did agent think? | agent-reasoning | Gate 7 |
| What files changed? | tool-usage (Edit/Write) | Gate 7 |
| What data was processed? | data-flow | Gate 7 |
| Did mid-chain checks pass? | orchestrator-decision | Gate 9 |
| Why was auto-trigger fired? | orchestrator-decision | Gate 10 |

### Configuration Quick Reference

```yaml
# Run chain with DEBUG-level logging
trace_depth: DEBUG

# Query logs for errors
logs:query "WHERE log_level=ERROR"

# Find slow gate passages
logs:query "WHERE log_type=gate-passage AND duration_ms > 5000"

# Validate completeness
logs:validate --action code/

# Audit for missing logs
logs:audit --since "2026-02-01"
```

---

**Last Updated:** 2026-02-11
**Status:** Framework specification (ready for Phase 1 implementation)
**Total Pages:** 10 (comprehensive logging standard)

