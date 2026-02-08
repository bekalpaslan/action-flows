# ActionFlows Orchestrator Output Contract

**Version:** 1.0
**Last Updated:** 2026-02-08
**TypeScript Definitions:** `packages/shared/src/contract/`

---

## What Is This?

This contract defines every output format the ActionFlows orchestrator produces. The dashboard depends on these formats for visualization. **These formats are load-bearing** — changing them without updating the contract breaks the dashboard.

---

## Contract Philosophy

The orchestrator and dashboard are **living software** — they evolve through use, human feedback, and agent learnings. The contract is the **harmony mechanism** that keeps them in sync.

### Harmony Concept

**Harmony** means the orchestrator's actual output matches the contract specification. When harmony breaks:
1. **Dashboard shows "parsing incomplete"** (graceful degradation)
2. **Harmony detection flags drift** (automated monitoring)
3. **Human investigates and updates contract OR orchestrator** (evolutionary loop)

This is NOT rigid specification — it's **synchronized evolution**. The contract can change, but changes must be deliberate and coordinated.

### Evolution Rules

To add a new format:
1. Define it in the contract (types, patterns, parsers)
2. Update ORCHESTRATOR.md with example
3. Update dashboard components to render it
4. Run harmony detection to validate
5. Increment CONTRACT_VERSION if structure changes

To modify an existing format:
1. Increment CONTRACT_VERSION (e.g., 1.0 → 1.1 for minor, 1.0 → 2.0 for breaking)
2. Add version-specific parser (parseChainCompilationV1_1)
3. Support both versions during migration (90-day window minimum)
4. Update CONTRACT.md with new format
5. Notify via harmony detection (dashboard shows version mismatch warning)

---

## Format Catalog

### Priority Levels

Formats are prioritized by implementation urgency:

| Priority | Purpose |
|----------|---------|
| **P0** | Critical for core dashboard functionality (chain visualization, progress tracking) |
| **P1** | High-value features (quality metrics, error recovery) |
| **P2** | Second-opinion integration, live registry updates |
| **P3** | Historical data, status updates |
| **P4** | Session metadata, edge cases |
| **P5** | Low-frequency or internal formats |

---

## Category 1: Chain Management

### Format 1.1: Chain Compilation Table (P0)

**When Produced:** Orchestrator compiles chain and presents for approval
**Priority:** P0 (critical for ExecutionPlan model and chain visualization)

**Structure:**
```markdown
<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: {Brief Title}

**Request:** {One-line human intent}
**Source:** {flow-name/ | Composed from: action1 + action2 + action3 | Meta-task}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | input=value | -- | Pending |
| 2 | action/ | model | input=value | #1 | Pending |

**Execution:** {Sequential | Parallel: [1,2] -> [3] | Single step}

What each step does:
1. **{Action}** -- {What this agent does and produces}
2. **{Action}** -- {What this agent does and produces}

Execute?
```

**Required Fields:**
- `Brief Title` (string)
- `Request` (one-line string)
- `Source` (enum: flow name | "Composed from: ..." | "Meta-task")
- Table with columns: `#`, `Action`, `Model`, `Key Inputs`, `Waits For`, `Status`
- `Execution` (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does" with action name + description

**TypeScript Interface:** `ChainCompilationParsed`
**Parser:** `parseChainCompilation(text: string)`
**Detection Pattern:** `/^## Chain: (.+)$/m`

**Dashboard Usage:**
- ChainView component renders chain table with ReactFlow nodes
- ExecutionPlan model stores typed representation

---

### Format 1.2: Chain Execution Start (P3)

**When Produced:** Orchestrator starts executing an approved chain
**Priority:** P3 (status updates)

**Structure:**
```markdown
## Executing: {Brief Title}

Spawning Step {N}: {action/} ({model})...
```

**Required Fields:**
- `Brief Title` (string, same as from compilation)
- `N` (step number, int)
- `action/` (action type with trailing slash)
- `model` (haiku|sonnet|opus)

**TypeScript Interface:** `ChainExecutionStartParsed`
**Parser:** `parseChainExecutionStart(text: string)`

---

### Format 1.3: Chain Status Update (P4)

**When Produced:** Chain status changes during execution
**Priority:** P4 (progress tracking)

**Structure:**
```markdown
## Chain Status: {Brief Title}

**Changes:** {Description of what changed}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | input=value | -- | Done |
| 2 | action/ | model | input=value | #1 | In Progress |
```

**TypeScript Interface:** `ChainStatusUpdateParsed`
**Parser:** `parseChainStatusUpdate(text: string)`

---

### Format 1.4: Execution Complete Summary (P4)

**When Produced:** Chain execution completes
**Priority:** P4 (chain completion)

**Structure:**
```markdown
## Done: {Brief Title}

| # | Action | Status | Result |
|---|--------|--------|--------|
| 1 | action/ | Done | {one-line summary} |
| 2 | action/ | Done | {one-line summary} |

**Logs:** `{path to log folder}`
**Learnings:** {summary of learnings}
```

**TypeScript Interface:** `ExecutionCompleteParsed`
**Parser:** `parseExecutionComplete(text: string)`

---

## Category 2: Step Lifecycle

### Format 2.1: Step Completion Announcement (P0)

**When Produced:** After each step completes
**Priority:** P0 (real-time progress tracking)

**Structure:**
```
>> Step {N} complete: {action/} -- {one-line result}. Continuing to Step {N+1}...
```

**Required Fields:**
- `>>` (prefix marker)
- `N` (step number, int)
- `action/` (action type with trailing slash)
- `one-line result` (string, agent's completion summary)
- `N+1` (next step number, int, or "Done" if last step)

**TypeScript Interface:** `StepCompletionParsed`
**Parser:** `parseStepCompletion(text: string)`
**Detection Pattern:** `/^>> Step (\d+) complete:/m`

**Dashboard Usage:**
- StepCompletedEvent - WebSocket event type
- ProgressBar component - Advances completion percentage
- Timeline component - Adds completed step to visual timeline

---

### Format 2.2: Dual Output (Action + Second Opinion) (P2)

**When Produced:** Both action and second-opinion critique complete
**Priority:** P2 (second opinion integration)

**Structure:**
```markdown
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- {critique summary or SKIPPED}.

### Dual Output: {action/} + Second Opinion

**Original ({action/}):**
{Verdict/score from original agent}

**Second Opinion ({model name} via Ollama):**
{Key findings summary}
- Missed issues: {count}
- Disagreements: {count}
- Notable: {top finding if any}

**Full reports:**
- Original: `{original log path}`
- Critique: `{second-opinion log path}`

Continuing to Step {N+2}...
```

**TypeScript Interface:** `DualOutputParsed`
**Parser:** `parseDualOutput(text: string)`

**Dashboard Usage:**
- DualOutputPanel component - Side-by-side comparison view
- SecondOpinionBadge component - Shows missed issues count

---

### Format 2.3: Second Opinion Skip (P4)

**When Produced:** Second-opinion step is skipped
**Priority:** P4 (edge case handling)

**Structure:**
```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- SKIPPED ({reason}).

Continuing to Step {N+2}...
```

**TypeScript Interface:** `SecondOpinionSkipParsed`
**Parser:** `parseSecondOpinionSkip(text: string)`

---

## Category 3: Human Interaction

### Format 3.1: Human Gate Presentation (P5)

**When Produced:** At predefined gates requiring human approval
**Priority:** P5 (no standardized format)

**Structure:**
```markdown
### Step {N}: HUMAN GATE

{Present what was produced from previous step}

{Question or prompt for approval}
```

**Note:** Human gates do NOT have a standardized content format beyond "HUMAN GATE" in the heading. The content is free-form and varies by flow.

**TypeScript Interface:** `HumanGateParsed`
**Parser:** `parseHumanGate(text: string)`

---

### Format 3.2: Learning Surface Presentation (P2)

**When Produced:** Agent reports learnings in completion message
**Priority:** P2 (agent feedback loop)

**Structure:**
```markdown
## Agent Learning

**From:** {action/} ({model})
**Issue:** "{what happened}"
**Root cause:** "{why}"

**Suggested fix:** {orchestrator's proposed solution}

Implement?
```

**TypeScript Interface:** `LearningSurfaceParsed`
**Parser:** `parseLearningSurface(text: string)`

**Dashboard Usage:**
- LearningAlert component - Shows learning as dismissible alert
- LearningSurface component - Aggregates all learnings by action type

---

### Format 3.3: Session-Start Protocol Acknowledgment (P4)

**When Produced:** At start of orchestrator session
**Priority:** P4 (session metadata)
**Note:** Currently NOT produced by orchestrator (internal read)

**Structure:**
```markdown
## Session Started

Loaded configuration:
- Project: {name}
- Departments: {count} ({list})
- Flows: {count}
- Actions: {count}
- Past executions: {count}

Ready to route requests.
```

**TypeScript Interface:** `SessionStartProtocolParsed`
**Parser:** `parseSessionStartProtocol(text: string)`

---

## Category 4: Registry & Metadata

### Format 4.1: Registry Update (P2)

**When Produced:** Orchestrator directly edits a registry file
**Priority:** P2 (live registry updates)

**Structure:**
```markdown
## Registry Update: {Brief Title}

**File:** {INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md}
**Line:** {added/removed/updated}: "{the line}"

Done.
```

**TypeScript Interface:** `RegistryUpdateParsed`
**Parser:** `parseRegistryUpdate(text: string)`

**Dashboard Usage:**
- RegistryLineUpdatedEvent - WebSocket event type
- RegistryViewer component - Live-updates registry file display

---

### Format 4.2: INDEX.md Entry (P3)

**When Produced:** After each chain execution completes
**Priority:** P3 (already parsed, formalize)

**Structure:**
```
| {YYYY-MM-DD} | {Description} | {Pattern} | {Outcome} |
```

Where:
- `YYYY-MM-DD` = execution date
- `Description` = brief title of work
- `Pattern` = action chain signature (e.g., `code×8 → review → commit`)
- `Outcome` = status + metrics + commit hash (e.g., `Success — 18 files, APPROVED 92% (1d50f9e)`)

**TypeScript Interface:** `IndexEntryParsed`
**Parser:** `parseIndexEntry(text: string)`

---

### Format 4.3: LEARNINGS.md Entry (P4)

**When Produced:** After learning surface approved by human
**Priority:** P4 (historical learnings)

**Structure:**
```markdown
### {Action Type}

#### {Issue Title}

**Context:** {when this happens}
**Problem:** {what goes wrong}
**Root Cause:** {why it fails}
**Solution:** {how to prevent}
**Date:** {YYYY-MM-DD}
**Source:** {action/} in {chain description}
```

**TypeScript Interface:** `LearningEntryParsed`
**Parser:** `parseLearningEntry(text: string)`

---

## Category 5: Action Outputs

### Format 5.1: Review Report Structure (P1)

**When Produced:** After review/ action completes
**Priority:** P1 (quality metrics, findings table)

**Structure:**
```markdown
# Review Report: {scope}

## Verdict: {APPROVED | NEEDS_CHANGES}
## Score: {X}%

## Summary
{2-3 sentence overview}

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | {path} | {line} | {critical/high/medium/low} | {issue} | {fix} |

## Fixes Applied (if mode = review-and-fix)
| File | Fix |
|------|-----|
| {path} | {what was fixed} |

## Flags for Human
| Issue | Why Human Needed |
|-------|-----------------|
| {issue} | {reason} |
```

**TypeScript Interface:** `ReviewReportParsed`
**Parser:** `parseReviewReport(text: string)`

**Dashboard Usage:**
- ReviewReportViewer component - Renders review reports
- FindingsTable component - Sortable/filterable table
- VerdictBanner component - Shows APPROVED/NEEDS_CHANGES with score

---

### Format 5.2: Analysis Report Structure (P3)

**When Produced:** After analyze/ action completes
**Priority:** P3 (metrics display)

**Structure:**
```markdown
# {Analysis Title}

**Aspect:** {coverage | dependencies | structure | drift | inventory | impact}
**Scope:** {scope description}
**Date:** {YYYY-MM-DD}
**Agent:** analyze

---

## 1. {Section Title}

{Content with tables, metrics, findings}

---

## 2. {Next Section}

{More content}

---

## Recommendations

{Actionable recommendations with file paths}
```

**TypeScript Interface:** `AnalysisReportParsed`
**Parser:** `parseAnalysisReport(text: string)`

---

### Format 5.3: Brainstorm Session Transcript (P5)

**When Produced:** After brainstorm/ action completes
**Priority:** P5 (read-only viewing)

**Structure:**
```markdown
# Brainstorming Session: {idea}

## Idea
{Clear description}

## Classification
{Technical / Functional / Framework}

## Initial Context
{Summary of provided context}

## Session Transcript

### Question 1: {question}
**Human Response:** {response}

### Question 2: {question}
**Human Response:** {response}

## Key Insights
- {Insight 1}
- {Insight 2}

## Potential Issues & Risks
- {Issue 1}: {description}

## Suggested Next Steps
1. {Next step}
2. {Next step}

## Open Questions
- {Question}

## Session Metadata
- **Duration:** {How long}
- **Depth:** {High-level / Deep exploration}
- **Consensus:** {Agreement or divided}
```

**TypeScript Interface:** `BrainstormTranscriptParsed`
**Parser:** `parseBrainstormTranscript(text: string)`

---

## Category 6: Error & Status

### Format 6.1: Error Announcement (P1)

**When Produced:** When an agent fails or unexpected error occurs
**Priority:** P1 (recovery UI)

**Structure:**
```markdown
## Error: {Error title}

**Step:** {step number} — {action/}
**Message:** {error message}
**Context:** {what was being attempted}

{Stack trace or additional details}

**Recovery options:**
- Retry step {N}
- Skip step {N}
- Cancel chain
```

**TypeScript Interface:** `ErrorAnnouncementParsed`
**Parser:** `parseErrorAnnouncement(text: string)`

**Dashboard Usage:**
- ErrorOccurredEvent - WebSocket event type
- ErrorModal component - Shows error with recovery options

---

### Format 6.2: Department Routing Announcement (P5)

**When Produced:** Orchestrator routes a request to a department
**Priority:** P5 (internal, not user-facing)
**Note:** Currently NOT produced by orchestrator (internal routing)

**Structure:**
```markdown
## Routing: {Request brief}

**Department:** {Framework | Engineering | QA | Human}
**Flow:** {flow-name/ | Composed from actions | No match}
**Actions:** {action list}

{Explanation of why this routing was chosen}
```

**TypeScript Interface:** `DepartmentRoutingParsed`
**Parser:** `parseDepartmentRouting(text: string)`

---

## Contract Validation

### Automated Checks

Run harmony detection to validate contract compliance:

```bash
pnpm run harmony:check
```

This command:
1. Reads ORCHESTRATOR.md
2. Extracts format examples
3. Parses each example with current parsers
4. Reports violations

### Manual Testing

Test a format:
```typescript
import { parseChainCompilation } from '@afw/shared/contract';

const text = `<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Test

**Request:** Test request
**Source:** Meta-task

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/ | haiku | task=test | -- | Pending |

**Execution:** Single step

What each step does:
1. **code/** -- Test action

Execute?`;

const parsed = parseChainCompilation(text);
console.log(parsed); // Should return fully parsed object
```

---

## Breaking Changes

If a format **must** change structure:

1. **Increment contract version** (e.g., 1.0 → 2.0)
2. **Update CONTRACT_VERSION constant** in `version.ts`
3. **Add version-specific parser** (parseChainCompilationV2)
4. **Support both versions** during migration (90-day window minimum)
5. **Update ORCHESTRATOR.md** with new format
6. **Notify via harmony detection** (dashboard shows version mismatch warning)

---

## Contributing

When adding a new orchestrator output format:

1. **Define in CONTRACT.md** (this file)
2. **Add TypeScript interface** in `packages/shared/src/contract/types/`
3. **Add regex patterns** in `packages/shared/src/contract/patterns/`
4. **Add parser** in `packages/shared/src/contract/parsers/`
5. **Add type guard** in `packages/shared/src/contract/guards.ts`
6. **Update ORCHESTRATOR.md** with example
7. **Add dashboard component** to render the format
8. **Update harmony detection** to recognize the format
9. **Run validation** (`pnpm run harmony:check`)

---

## TypeScript Reference

All types, patterns, parsers, and guards are available via:

```typescript
import {
  // Types
  ChainCompilationParsed,
  StepCompletionParsed,
  ReviewReportParsed,
  // ... (all 17 format types)

  // Patterns
  ChainPatterns,
  StepPatterns,
  ActionPatterns,
  // ... (all pattern groups)

  // Parsers
  parseChainCompilation,
  parseStepCompletion,
  parseOrchestratorOutput, // Master parser (tries all)
  // ... (all parsers)

  // Guards
  isChainCompilationParsed,
  isStepCompletionParsed,
  isParsedFormat, // Generic guard
  // ... (all guards)

  // Version
  CONTRACT_VERSION,
  isSupportedVersion,
} from '@afw/shared/contract';
```

---

**End of Contract**
