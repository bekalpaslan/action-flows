# ActionFlows Onboarding Teaching Inventory

> **Purpose:** Comprehensive catalog of everything a human needs to learn to manage a project using the ActionFlows orchestrator + dashboard.

**Date:** 2026-02-08
**Context:** Framework Harmony System implementation (Step 2: Onboarding Questionnaire)
**Source Files:**
- `.claude/bootstrap.md` (3781 lines, 38,147 tokens)
- `.claude/actionflows/ORCHESTRATOR.md`
- `.claude/actionflows/CONTRACT.md`
- `.claude/actionflows/ORGANIZATION.md`
- `.claude/actionflows/FLOWS.md`
- `.claude/actionflows/ACTIONS.md`
- `.claude/actionflows/project.config.md`
- `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Previous inventory: `logs/analyze/framework-inventory-for-onboarding-questionnaire_2026-02-08-20-47-50/report.md`
- Ideation summary: `logs/ideation/framework-harmony-system_2026-02-08-21-10-43/summary.md`

---

## Executive Summary

The ActionFlows framework is a **living software system** where humans trigger Claude to evolve it, but **guardrails ensure the dashboard stays accurate**. This inventory categorizes everything a human needs to learn into:

1. **Sacred / Never Change** (14 items) — Breaking these breaks the dashboard
2. **Sensitive / Change With Care** (11 items) — Degraded experience if changed improperly
3. **Safe to Evolve** (8 categories) — Go ahead, the system adapts
4. **Behavioral Patterns** (15 patterns) — How the orchestrator works
5. **Living Software Model** — Philosophy of harmony
6. **Teaching Order** — Beginner → Intermediate → Advanced

**Key Insight:** The contract (`CONTRACT.md`) is the **harmony bridge** between orchestrator freedom and dashboard reliability. It defines every output format the dashboard depends on. As long as the orchestrator's actual output matches the contract, the dashboard visualizes correctly.

---

## 1. Sacred / Never Change (Breaking = Dashboard Dies)

These are **load-bearing for the dashboard**. The backend parses these formats to build the visual model. If any of these change structure without updating the contract AND the backend parsers, visualization breaks.

### 1.1 Chain Compilation Table (P0 - Critical)

**What it is:**
The markdown table the orchestrator produces when presenting a chain for approval.

**Where defined:**
`CONTRACT.md` → Format 1.1: Chain Compilation Table

**Required structure:**
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

**Required fields:**
- `Brief Title` (string)
- `Request` (one-line string)
- `Source` (enum: flow name | "Composed from: ..." | "Meta-task")
- Table columns: `#`, `Action`, `Model`, `Key Inputs`, `Waits For`, `Status`
- `Execution` (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does"

**What breaks if changed:**
- Dashboard can't parse chain into ExecutionPlan model
- ChainView component can't render ReactFlow nodes
- Step dependencies don't render correctly
- Chain approval UI doesn't work

**How to change safely:**
1. Increment CONTRACT_VERSION (e.g., 1.0 → 1.1)
2. Add parser variant: `parseChainCompilationV1_1()`
3. Support both versions for 90 days
4. Update backend to use new parser
5. Update ORCHESTRATOR.md examples

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 65-107)
- Parser: `packages/shared/src/contract/parsers/chain.ts`
- TypeScript type: `packages/shared/src/contract/types/chain.ts` → `ChainCompilationParsed`
- Dashboard component: `packages/app/src/components/ChainView.tsx`

---

### 1.2 Step Completion Announcement (P0 - Critical)

**What it is:**
The `>> Step N complete:` format the orchestrator uses after each step finishes.

**Where defined:**
`CONTRACT.md` → Format 2.1: Step Completion Announcement

**Required structure:**
```
>> Step {N} complete: {action/} -- {one-line result}. Continuing to Step {N+1}...
```

**Required fields:**
- `>>` prefix (detection marker)
- `N` (step number, int)
- `action/` (action type with trailing slash)
- `one-line result` (string, agent's completion summary)
- `N+1` (next step number, int) OR "Done" if last step

**What breaks if changed:**
- Dashboard can't detect step completions
- ProgressBar component doesn't advance
- Timeline component doesn't update
- StepCompletedEvent (WebSocket) doesn't fire

**How to change safely:**
Same versioning process as 1.1

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 179-205)
- Parser: `packages/shared/src/contract/parsers/step.ts`
- Event: `packages/backend/src/ws/events/StepCompletedEvent.ts`
- Component: `packages/app/src/components/ProgressBar.tsx`

---

### 1.3 Dual Output Format (P2 - Second Opinion Integration)

**What it is:**
The format for presenting both original action output AND second-opinion critique together.

**Where defined:**
`CONTRACT.md` → Format 2.2: Dual Output (Action + Second Opinion)

**Required structure:**
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

**Required fields:**
- Two `>> Step` announcements (original + second-opinion)
- `### Dual Output:` heading
- Original verdict/score section
- Second opinion findings section
- Full reports paths

**What breaks if changed:**
- DualOutputPanel component can't render side-by-side comparison
- SecondOpinionBadge doesn't show missed issues count
- Dashboard can't link to critique logs

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 207-242)
- Parser: `packages/shared/src/contract/parsers/dual-output.ts`
- Component: `packages/app/src/components/DualOutputPanel.tsx`

---

### 1.4 Registry Update Format (P2 - Live Registry Updates)

**What it is:**
The format the orchestrator uses when directly editing a registry file.

**Where defined:**
`CONTRACT.md` → Format 4.1: Registry Update

**Required structure:**
```markdown
## Registry Update: {Brief Title}

**File:** {INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md}
**Line:** {added/removed/updated}: "{the line}"

Done.
```

**Required fields:**
- `## Registry Update:` heading
- `File:` (one of the four registry files)
- `Line:` with action type (added/removed/updated) and the actual line content
- `Done.` completion marker

**What breaks if changed:**
- RegistryViewer component can't live-update
- RegistryLineUpdatedEvent doesn't fire
- Dashboard doesn't reflect registry changes in real-time

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 340-361)
- Parser: `packages/shared/src/contract/parsers/registry.ts`
- Event: `packages/backend/src/ws/events/RegistryLineUpdatedEvent.ts`

---

### 1.5 Review Report Structure (P1 - Quality Metrics)

**What it is:**
The markdown structure review/ agents produce in their log files.

**Where defined:**
`CONTRACT.md` → Format 5.1: Review Report Structure

**Required structure:**
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

**Required fields:**
- `Verdict:` (enum: APPROVED | NEEDS_CHANGES)
- `Score:` (integer 0-100 with % suffix)
- Findings table with specific columns
- Fixes Applied section (if mode = review-and-fix)
- Flags for Human section

**What breaks if changed:**
- ReviewReportViewer can't render reports
- FindingsTable can't display sortable/filterable findings
- VerdictBanner doesn't show APPROVED/NEEDS_CHANGES
- Quality score metrics don't work

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 410-450)
- Parser: `packages/shared/src/contract/parsers/review.ts`
- Component: `packages/app/src/components/ReviewReportViewer.tsx`

---

### 1.6 Error Announcement Format (P1 - Recovery UI)

**What it is:**
The format for reporting agent failures or unexpected errors.

**Where defined:**
`CONTRACT.md` → Format 6.1: Error Announcement

**Required structure:**
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

**Required fields:**
- `## Error:` heading
- `Step:` with number and action type
- `Message:` error message
- `Context:` what was attempted
- Recovery options list

**What breaks if changed:**
- ErrorModal component can't show error details
- Recovery UI doesn't render
- ErrorOccurredEvent doesn't fire correctly

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 542-571)
- Parser: `packages/shared/src/contract/parsers/error.ts`
- Component: `packages/app/src/components/ErrorModal.tsx`

---

### 1.7 Branded Type Conventions (Shared Types)

**What it is:**
TypeScript branded string types for domain IDs: `SessionId`, `ChainId`, `StepId`, `UserId`.

**Where defined:**
`packages/shared/src/types/branded.ts`

**Why sacred:**
These types prevent mixing up IDs (e.g., accidentally using a ChainId where a SessionId is expected). The backend storage layer depends on these being distinct types.

**Required pattern:**
```typescript
type SessionId = string & { readonly __brand: 'SessionId' };
type ChainId = string & { readonly __brand: 'ChainId' };
type StepId = string & { readonly __brand: 'StepId' };
type UserId = string & { readonly __brand: 'UserId' };
```

**What breaks if changed:**
- Type safety across entire system breaks
- Backend storage queries can accept wrong ID types
- WebSocket event types become unsafe
- Frontend components can mix up entity types

**How to change safely:**
Don't. These are foundational. If you must add a new branded ID type, follow the same pattern.

**File references:**
- Types: `packages/shared/src/types/branded.ts`
- Usage: Everywhere (`packages/backend/`, `packages/app/`, `packages/shared/`)

---

### 1.8 WebSocket Event Discriminated Unions

**What it is:**
The discriminated union pattern for WebSocket events. Each event has a `type` field that determines its structure.

**Where defined:**
`packages/shared/src/events/`

**Why sacred:**
The frontend uses the `type` field to narrow event types and render correctly. If the discriminator changes or event structures change, frontend-backend communication breaks.

**Required pattern:**
```typescript
type Event =
  | { type: 'ChainStarted'; sessionId: SessionId; chainId: ChainId; ... }
  | { type: 'StepCompleted'; chainId: ChainId; stepId: StepId; ... }
  | { type: 'ErrorOccurred'; error: string; ... };
```

**What breaks if changed:**
- Frontend can't parse events
- Event handlers don't trigger
- Dashboard stops receiving updates
- TypeScript type narrowing breaks

**How to change safely:**
1. Add new event type to union
2. Add handler in frontend event listener
3. Backend emits new event type
4. Never remove old event types (deprecate instead)

**File references:**
- Types: `packages/shared/src/events/types.ts`
- Backend: `packages/backend/src/ws/emit.ts`
- Frontend: `packages/app/src/contexts/WebSocketContext.tsx`

---

### 1.9 Log Folder Naming Convention

**What it is:**
The required naming pattern for log folders: `{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/`

**Where defined:**
- Contract: `CONTRACT.md` → Category 4: Registry & Metadata
- Agent standards: `actions/_abstract/create-log-folder/instructions.md`

**Why sacred:**
The backend execution registry (`logs/INDEX.md`) depends on this pattern to link executions to their log folders. The dashboard uses these paths to load output files.

**Required pattern:**
```bash
.claude/actionflows/logs/{action-type}/{description}_{datetime}/
```

Where:
- `{action-type}` = code, review, analyze, plan, audit, test, etc.
- `{description}` = kebab-case, no spaces or special chars
- `{datetime}` = `YYYY-MM-DD-HH-MM-SS` format

**What breaks if changed:**
- INDEX.md can't link to log folders
- Dashboard can't find output files
- Execution history visualization breaks
- Pattern signatures don't match

**How to change safely:**
Don't. This is deeply integrated into registry parsing and file discovery.

**File references:**
- Pattern definition: `actions/_abstract/create-log-folder/instructions.md`
- Usage: All assessment actions (analyze, review, audit, plan, test)
- Registry: `.claude/actionflows/logs/INDEX.md`

---

### 1.10 INDEX.md Table Structure

**What it is:**
The markdown table structure in `logs/INDEX.md` that tracks execution history.

**Where defined:**
`CONTRACT.md` → Format 4.2: INDEX.md Entry

**Required structure:**
```
| {YYYY-MM-DD} | {Description} | {Pattern} | {Outcome} |
```

Where:
- `YYYY-MM-DD` = execution date
- `Description` = brief title of work
- `Pattern` = action chain signature (e.g., `code×8 → review → commit`)
- `Outcome` = status + metrics + commit hash (e.g., `Success — 18 files, APPROVED 92% (1d50f9e)`)

**What breaks if changed:**
- Execution history parsing breaks
- Pattern signature matching breaks
- Dashboard historical view doesn't work
- Orchestrator can't find similar past executions

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 363-381)
- Registry: `.claude/actionflows/logs/INDEX.md`
- Parser: `packages/backend/src/services/HistoryService.ts`

---

### 1.11 FLOWS.md Registry Structure

**What it is:**
The table structure in `FLOWS.md` that maps flow names to their action chains.

**Where defined:**
`.claude/actionflows/FLOWS.md`

**Required structure:**
```markdown
## {Department Name}

| Flow | Purpose | Chain |
|------|---------|-------|
| flow-name/ | {One-line purpose} | {action sequence} |
```

**Why sacred:**
The orchestrator reads this during session-start protocol to route requests. If the structure changes, routing breaks.

**What breaks if changed:**
- Orchestrator can't find flows
- Department routing breaks
- Session-start protocol fails
- Human requests route to wrong flows

**How to change safely:**
Only add new rows. Never change column headers. Changing the table structure requires updating the orchestrator's parsing logic in `ORCHESTRATOR.md`.

**File references:**
- Registry: `.claude/actionflows/FLOWS.md`
- Reader: Orchestrator session-start protocol

---

### 1.12 ACTIONS.md Registry Structure

**What it is:**
The table structures in `ACTIONS.md` that catalog all available actions.

**Where defined:**
`.claude/actionflows/ACTIONS.md`

**Required sections:**
1. Abstract Actions table
2. Generic Actions table
3. Stack-Specific Code Actions table
4. Code-Backed Actions table
5. Action Modes table
6. Model Selection Guidelines table
7. Spawning Pattern example

**Why sacred:**
The orchestrator uses this to compose dynamic chains when no flow matches.

**What breaks if changed:**
- Dynamic chain composition breaks
- Orchestrator can't find actions
- Input requirements unknown
- Model selection incorrect

**File references:**
- Registry: `.claude/actionflows/ACTIONS.md`
- Reader: Orchestrator (when composing from actions)

---

### 1.13 ORGANIZATION.md Routing Table

**What it is:**
The routing table that maps human intent keywords to departments.

**Where defined:**
`.claude/actionflows/ORGANIZATION.md`

**Required structure:**
```markdown
| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" | Engineering | code-and-review/ |
| "fix bug X" | Engineering | bug-triage/ |
```

**Why sacred:**
This is the **first routing decision** in the orchestrator's workflow. If this table is wrong, everything routes incorrectly.

**What breaks if changed:**
- Human requests route to wrong departments
- Flows don't match intent
- Orchestrator falls back to generic actions instead of optimized flows

**File references:**
- Registry: `.claude/actionflows/ORGANIZATION.md`
- Reader: Orchestrator session-start protocol (step 1)

---

### 1.14 Contract Version Header

**What it is:**
The `<!-- ActionFlows-Contract-Version: 1.0 -->` HTML comment that appears in orchestrator outputs.

**Where defined:**
`CONTRACT.md` → Version header in all P0/P1 formats

**Required format:**
```html
<!-- ActionFlows-Contract-Version: 1.0 -->
```

**Why sacred:**
The backend harmony detection system uses this to validate that orchestrator output matches the expected contract version. Version mismatches trigger warnings.

**What breaks if changed:**
- Harmony detection can't validate output
- Dashboard can't detect contract drift
- Version migration doesn't work

**How to change:**
Only increment version when making breaking changes to output formats. Follow semantic versioning (1.0 → 1.1 = minor, 1.0 → 2.0 = major).

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (throughout)
- Validator: `packages/backend/src/services/HarmonyDetectionService.ts`

---

## 2. Sensitive / Change With Care (Breaking = Degraded Experience)

These are important but have **graceful degradation**. The dashboard still works if these change, but the experience degrades (missing features, incomplete data, less useful visualizations).

### 2.1 Learning Surface Format (P2 - Agent Feedback Loop)

**What it is:**
The format the orchestrator uses to surface agent learnings to the human.

**Where defined:**
`CONTRACT.md` → Format 3.2: Learning Surface Presentation

**Structure:**
```markdown
## Agent Learning

**From:** {action/} ({model})
**Issue:** "{what happened}"
**Root cause:** "{why}"

**Suggested fix:** {orchestrator's proposed solution}

Implement?
```

**What degrades if changed:**
- LearningAlert component doesn't render
- Learnings don't aggregate into LearningSurface view
- Agent feedback loop weakens
- Framework improvements slow down

**Graceful degradation:**
The system still works. Learnings just appear as plain text instead of structured alerts.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 285-310)
- Component: `packages/app/src/components/LearningAlert.tsx`

---

### 2.2 Human Gate Presentation (P5 - No Standardized Format)

**What it is:**
The `### Step {N}: HUMAN GATE` heading that marks approval checkpoints in chains.

**Where defined:**
`CONTRACT.md` → Format 3.1: Human Gate Presentation

**Structure:**
```markdown
### Step {N}: HUMAN GATE

{Present what was produced from previous step}

{Question or prompt for approval}
```

**What degrades if changed:**
- Dashboard doesn't know when to pause for human input
- Approval UI doesn't trigger
- Chain continues without human review

**Graceful degradation:**
The orchestrator still waits for human response (it's programmed to), but the dashboard doesn't render a nice approval modal.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 265-283)
- Behavior: `ORCHESTRATOR.md` → Human gate sections in flow definitions

---

### 2.3 Second Opinion Skip Format (P4 - Edge Case Handling)

**What it is:**
The format when second-opinion step is skipped (e.g., Ollama unavailable).

**Where defined:**
`CONTRACT.md` → Format 2.3: Second Opinion Skip

**Structure:**
```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- SKIPPED ({reason}).

Continuing to Step {N+2}...
```

**What degrades if changed:**
- Dashboard shows "second opinion pending" forever
- Skip reason not displayed
- User doesn't know why second opinion didn't run

**Graceful degradation:**
Chain continues correctly. Dashboard just shows incomplete second-opinion data.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 244-259)
- Parser: `packages/shared/src/contract/parsers/second-opinion.ts`

---

### 2.4 Analysis Report Structure (P3 - Metrics Display)

**What it is:**
The markdown structure analyze/ agents produce in their log files.

**Where defined:**
`CONTRACT.md` → Format 5.2: Analysis Report Structure

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
```

**What degrades if changed:**
- AnalysisReportViewer can't parse reports
- Metrics extraction breaks
- Recommendation sections don't render

**Graceful degradation:**
Reports still exist and are readable as plain markdown. Dashboard just can't extract structured data.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 452-489)
- Parser: `packages/shared/src/contract/parsers/analysis.ts`

---

### 2.5 Chain Status Update Format (P4 - Progress Tracking)

**What it is:**
The format the orchestrator uses to report mid-chain status changes.

**Where defined:**
`CONTRACT.md` → Format 1.3: Chain Status Update

**Structure:**
```markdown
## Chain Status: {Brief Title}

**Changes:** {Description of what changed}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | input=value | -- | Done |
| 2 | action/ | model | input=value | #1 | In Progress |
```

**What degrades if changed:**
- Real-time progress updates stop
- Dashboard shows stale chain state
- Step status not visualized

**Graceful degradation:**
Final completion state still updates. Mid-chain updates just don't appear.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 132-152)
- Parser: `packages/shared/src/contract/parsers/chain.ts`

---

### 2.6 Execution Complete Summary (P4 - Chain Completion)

**What it is:**
The format the orchestrator uses when a chain finishes.

**Where defined:**
`CONTRACT.md` → Format 1.4: Execution Complete Summary

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

**What degrades if changed:**
- Completion modal doesn't render
- Log links don't work
- Learnings summary missing

**Graceful degradation:**
Chain completes correctly. Dashboard just doesn't show a nice summary modal.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 154-175)
- Parser: `packages/shared/src/contract/parsers/execution.ts`

---

### 2.7 Brainstorm Session Transcript (P5 - Read-Only Viewing)

**What it is:**
The markdown structure brainstorm/ agents produce.

**Where defined:**
`CONTRACT.md` → Format 5.3: Brainstorm Session Transcript

**Structure:**
```markdown
# Brainstorming Session: {idea}

## Idea
{Clear description}

## Classification
{Technical / Functional / Framework}

## Session Transcript

### Question 1: {question}
**Human Response:** {response}

## Key Insights
- {Insight 1}

## Suggested Next Steps
1. {Next step}
```

**What degrades if changed:**
- BrainstormViewer can't parse transcripts
- Insights don't extract
- Next steps don't render as action buttons

**Graceful degradation:**
Transcript still readable as markdown. Dashboard just can't make it interactive.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 491-538)
- Parser: `packages/shared/src/contract/parsers/brainstorm.ts`

---

### 2.8 LEARNINGS.md Entry Format (P4 - Historical Learnings)

**What it is:**
The markdown structure for entries in `logs/LEARNINGS.md`.

**Where defined:**
`CONTRACT.md` → Format 4.3: LEARNINGS.md Entry

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

**What degrades if changed:**
- Learnings don't parse into structured cards
- Historical learning search breaks
- Pattern detection weakens

**Graceful degradation:**
Learnings still exist and are readable. Just not queryable or aggregatable.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 383-408)
- Registry: `.claude/actionflows/logs/LEARNINGS.md`

---

### 2.9 Session-Start Protocol Acknowledgment (P4 - Session Metadata)

**What it is:**
A potential format for the orchestrator to acknowledge session start (currently NOT produced).

**Where defined:**
`CONTRACT.md` → Format 3.3: Session-Start Protocol Acknowledgment

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

**What degrades if changed:**
Currently nothing, since this isn't produced yet. When implemented, dashboard could show a "session initialized" indicator.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 312-335)
- Future feature: Session metadata panel

---

### 2.10 Department Routing Announcement (P5 - Internal)

**What it is:**
A potential format for the orchestrator to announce routing decisions (currently NOT produced).

**Where defined:**
`CONTRACT.md` → Format 6.2: Department Routing Announcement

**Structure:**
```markdown
## Routing: {Request brief}

**Department:** {Framework | Engineering | QA | Human}
**Flow:** {flow-name/ | Composed from actions | No match}
**Actions:** {action list}

{Explanation of why this routing was chosen}
```

**What degrades if changed:**
Currently nothing, since this is internal. When implemented, could show routing decision tree in dashboard.

**File references:**
- Contract: `.claude/actionflows/CONTRACT.md` (lines 575-593)
- Future feature: Routing visualization

---

### 2.11 Agent Learnings Output Format (All Agents)

**What it is:**
The required `## Learnings` section in every agent's completion message.

**Where defined:**
`actions/_abstract/agent-standards/instructions.md` → Section "Learnings Output Format"

**Structure:**
```markdown
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside your explicit instructions}

Or: None — execution proceeded as expected.
```

**What degrades if changed:**
- Orchestrator can't extract learnings
- Learning surface presentation breaks
- LEARNINGS.md doesn't get populated
- Framework improvement loop weakens

**Graceful degradation:**
Agents still report issues as plain text. Just not in a format the orchestrator can auto-surface to the human.

**File references:**
- Definition: `actions/_abstract/agent-standards/instructions.md` (lines 50-61)
- Usage: All agent.md files
- Surface logic: `ORCHESTRATOR.md` → Rule 5 Application

---

## 3. Safe to Evolve (Go Ahead, The System Adapts)

These can be freely modified without breaking the dashboard or orchestrator. They're configuration, not contract.

### 3.1 Adding New Flows

**What you can do:**
- Add new rows to FLOWS.md
- Create new flow directories in `flows/{department}/{flow-name}/`
- Write flow `instructions.md` files

**Guardrails:**
- Follow the flow instructions.md template (see existing flows)
- Update FLOWS.md registry with the new flow
- Define "When to Use", "Action Sequence", "Dependencies"

**What adapts:**
- Orchestrator reads FLOWS.md at session-start
- New flow automatically available for routing
- Human can trigger it immediately

**File references:**
- Template: Any existing flow's `instructions.md`
- Registry: `.claude/actionflows/FLOWS.md`

---

### 3.2 Adding New Actions

**What you can do:**
- Add new action directories in `actions/{action-name}/`
- Write `agent.md` and `instructions.md` files
- Add entry to ACTIONS.md

**Guardrails:**
- Follow the two-file pattern (agent.md + instructions.md)
- Extend `agent-standards` at minimum
- Define required inputs, model, gate
- Test spawning pattern before deploying

**What adapts:**
- Orchestrator reads ACTIONS.md for dynamic chain composition
- New action automatically available
- Can be composed into chains immediately

**File references:**
- Template: `actions/code/agent.md` and `actions/code/instructions.md`
- Registry: `.claude/actionflows/ACTIONS.md`

---

### 3.3 Adding New Departments

**What you can do:**
- Add new department section to ORGANIZATION.md
- Define: Owns, Key Flows, Triggers
- Add routing table entries

**Guardrails:**
- Update ORGANIZATION.md with clear triggers
- Create at least one flow for the department
- Add department to FLOWS.md with its flows

**What adapts:**
- Orchestrator reads ORGANIZATION.md at session-start
- New department routing works immediately

**File references:**
- Registry: `.claude/actionflows/ORGANIZATION.md`

---

### 3.4 Modifying Agent Instructions (Within Standards)

**What you can do:**
- Edit agent.md files to improve instructions
- Add new steps to agents
- Refine input parsing
- Update project context sections

**Guardrails:**
- MUST preserve the "Extends" section (agent-standards, create-log-folder, etc.)
- MUST preserve "Learnings" output format
- MUST NOT remove required inputs
- Test after changes

**What adapts:**
- Agents read their agent.md when spawned
- Changes take effect on next spawn
- No orchestrator update needed

**File references:**
- Any `actions/{action}/agent.md` file

---

### 3.5 Modifying ORCHESTRATOR.md Philosophy Sections

**What you can do:**
- Edit explanations in Parts 1-2 (Framework Concept, Philosophy)
- Add new applications of "It's a Sin"
- Refine objection protocol
- Clarify boundary rules

**Guardrails:**
- MUST preserve Session-Start Protocol section exactly
- MUST preserve Response Format Standard section (formats are in CONTRACT)
- MUST preserve Spawning Pattern section
- MUST NOT change formats (those are in CONTRACT.md, not here)

**What adapts:**
- Orchestrator reads ORCHESTRATOR.md at session-start
- Behavioral changes take effect next session

**File references:**
- `.claude/actionflows/ORCHESTRATOR.md`

---

### 3.6 Customizing project.config.md Values

**What you can do:**
- Change project name, description, working directory
- Update tech stack details
- Add new ports
- Change git conventions
- Update notification settings

**Guardrails:**
- MUST keep all required sections (Project, Tech Stack, Architecture, Domain Concepts, etc.)
- Values injected into agent prompts — keep them accurate

**What adapts:**
- Orchestrator reads project.config.md at session-start
- Injects values into agent prompts
- Changes propagate to all agents

**File references:**
- `.claude/actionflows/project.config.md`

---

### 3.7 Adding Custom Checklists

**What you can do:**
- Create checklist files in `checklists/technical/` or `checklists/functional/`
- Define p0-p3 priority levels
- Write validation criteria

**Guardrails:**
- Follow naming: `p{0-3}-{topic}.md`
- Use markdown format
- Define clear pass/fail criteria

**What adapts:**
- review/ and audit/ actions can reference checklists
- Checklist-driven validation works automatically

**File references:**
- Examples: `checklists/technical/` and `checklists/functional/` (when they exist)

---

### 3.8 Extending Abstract Actions

**What you can do:**
- Add new abstract action directories in `actions/_abstract/{pattern}/`
- Write `instructions.md` defining the reusable behavior
- Have concrete actions extend it

**Guardrails:**
- Abstract actions are NOT standalone agents — they're behavior patterns
- Other actions reference them via "Extends: _abstract/{pattern}"
- Don't create abstract actions that duplicate agent-standards

**What adapts:**
- Agents that extend the abstract action follow its instructions
- Behavior changes propagate to all extending agents

**File references:**
- Examples: `actions/_abstract/agent-standards/`, `actions/_abstract/create-log-folder/`

---

## 4. Behavioral Patterns (How The System Works)

These are the **key workflows** the orchestrator follows. A human needs to understand these to know what the orchestrator will do when they make a request.

### 4.1 Session-Start Protocol

**What it does:**
Before responding to ANY human message, the orchestrator reads these files in order:

1. `.claude/actionflows/project.config.md` — Load project-specific context
2. `.claude/actionflows/ORGANIZATION.md` — Understand department routing
3. `.claude/actionflows/FLOWS.md` — Know what flows exist
4. `.claude/actionflows/logs/INDEX.md` — Check for similar past executions

**Why it exists:**
Forces the orchestrator into **routing mode** instead of **help mode**. Without this, the orchestrator would default to answering questions instead of compiling chains.

**What the human's role is:**
None. This is automatic. But the human should know: the orchestrator is NOT a chatbot. It's a routing coordinator. Every request goes through this protocol.

**File references:**
- Definition: `ORCHESTRATOR.md` → Session-Start Protocol section (lines 8-24)
- Enforcement: CLAUDE.md → Pointer to ORCHESTRATOR.md (line 3)

---

### 4.2 Chain Compilation → Approval → Execution Cycle

**What it does:**

**Phase 1: Compilation**
1. Read routing table (ORGANIZATION.md) → identify department
2. Read flow registry (FLOWS.md) → find matching flow
3. If no flow matches → compose from actions (ACTIONS.md)
4. Build explicit chain table with dependencies
5. Present chain to human

**Phase 2: Approval**
6. Wait for human response
7. Human says "Execute" or "Yes" or approves → proceed
8. Human adjusts → recompile chain
9. Human cancels → abort

**Phase 3: Execution**
10. Spawn agents sequentially or in parallel
11. Track progress with step completion announcements
12. Update chain status table as steps complete
13. Present final summary when done

**Why it exists:**
Separates planning from execution. Gives human visibility and control BEFORE work starts.

**What the human's role is:**
Review the compiled chain. Approve, adjust, or cancel. Once approved, the orchestrator handles the rest autonomously.

**File references:**
- Definition: `ORCHESTRATOR.md` → Rule 6 Application: Plan First, Execute Second (lines 308-325)
- Flow: `ORCHESTRATOR.md` → Orchestrator Decision Process (lines 549-583)

---

### 4.3 Department Routing

**What it does:**
Maps human intent to the right team:

- "implement X" → Engineering department → code-and-review/ flow
- "fix bug" → Engineering department → bug-triage/ flow
- "audit security" → QA department → audit-and-fix/ flow
- "I have an idea" → Human department → ideation/ flow

**Why it exists:**
Different types of work need different workflows. This is the **first routing decision**.

**What the human's role is:**
Use natural language. The orchestrator parses intent and routes automatically. No need to know department names.

**File references:**
- Routing table: `ORGANIZATION.md` → Routing Guide table (lines 35-50)
- Departments: `ORGANIZATION.md` → Departments section (lines 11-32)

---

### 4.4 The Sin Test (Orchestrator Never Produces Content)

**What it does:**
Before EVERY action, the orchestrator asks:

```
Am I about to produce content? (write, analyze, review, code, rewrite, document)
    ↓
YES → It's a sin. Stop. Compile a chain. Spawn an agent.
NO  → Am I coordinating? (routing, compiling chain, updating registry line, presenting plan)
    ↓
YES → Proceed. This is your job.
NO  → What am I doing? Ask yourself. Then delegate it.
```

**Why it exists:**
The orchestrator is a coordinator, not a worker. This is the foundational truth that prevents it from doing work itself.

**What the human's role is:**
If the orchestrator starts producing content, say "it's a sin" — this is a reset command. The orchestrator will stop, acknowledge, compile a chain, and execute properly.

**File references:**
- Definition: `ORCHESTRATOR.md` → The Foundational Truth: It's a Sin (lines 117-170)
- Bootstrap context: `bootstrap.md` → Builder vs Orchestrator exemption (lines 9-34)

---

### 4.5 Identity Isolation (Subagents Don't Read ORCHESTRATOR.md)

**What it does:**
Prevents subagents from reading orchestrator rules and trying to delegate work.

**Three defense layers:**

1. **Spawning prompt guard** — Every Task spawn includes:
   ```
   IMPORTANT: You are a spawned subagent executor.
   Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
   Do NOT delegate work or compile chains. Execute your agent.md directly.
   ```

2. **Agent-standards rule #9** — Core behavioral principle:
   ```
   You are a task executor, not an orchestrator. Never read ORCHESTRATOR.md.
   Never route, delegate, or compile chains. Execute your agent.md instructions directly.
   ```

3. **CLAUDE.md conditional pointer** —
   ```
   Spawned subagents: ignore this — follow your agent.md instructions instead.
   ```

**Why it exists:**
If agents read ORCHESTRATOR.md, they'd try to delegate their own work. This creates infinite recursion and chaos.

**What the human's role is:**
None. This is enforced automatically. But if you see an agent compiling chains, that's a framework bug.

**File references:**
- Spawning pattern: `ORCHESTRATOR.md` → Spawning Pattern (lines 431-456)
- Agent standards: `actions/_abstract/agent-standards/instructions.md` → Principle #9 (lines 35-36)
- CLAUDE.md guard: `.claude/CLAUDE.md` (line 3)

---

### 4.6 Review → Second-Opinion Pipeline

**What it does:**
Auto-inserts a `second-opinion/` step after review/ and audit/ actions.

**Example chain:**

Before:
```
| 1 | analyze/ | -- |
| 2 | code/    | #1 |
| 3 | review/  | #2 |
| 4 | commit/  | #3 |
```

After (with auto-inserted second opinion):
```
| 1 | analyze/         | -- |
| 2 | code/            | #1 |
| 3 | review/          | #2 |
| 4 | second-opinion/  | #3 |
| 5 | commit/          | #3 (NOT #4) |
```

**Critical rule:** Commit waits for the ORIGINAL action (#3), NOT the second-opinion step (#4). Second opinion never blocks workflow.

**Why it exists:**
Local AI model (Ollama) critiques Claude's output. Catches what Claude might miss. Improves quality without blocking progress.

**What the human's role is:**
Review the dual output (original + second opinion). Human can suppress with "skip second opinions" when approving chain.

**File references:**
- Protocol: `ORCHESTRATOR.md` → Rule 7a: Second Opinion Protocol (lines 133-244)
- Contract: `CONTRACT.md` → Format 2.2: Dual Output (lines 207-242)
- Action: `actions/second-opinion/agent.md`

---

### 4.7 Human Gates

**What it does:**
Explicit approval checkpoints within a chain. The orchestrator stops and waits for human response.

**Example:**
```
| 1 | plan/  | -- | Pending |
| 2 | HUMAN GATE | #1 | Pending |
| 3 | code/  | #2 | Pending |
```

After step 1 completes, orchestrator presents plan and asks: "Approve this plan?"

**Why it exists:**
Some decisions require human judgment. The orchestrator can't auto-approve design decisions, architecture changes, or major refactors.

**What the human's role is:**
Review what was produced. Approve to continue, adjust the plan, or cancel the chain.

**File references:**
- Format: `CONTRACT.md` → Format 3.1: Human Gate Presentation (lines 265-283)
- Usage: Flows with "human gate" steps (e.g., `flows/framework/action-creation/instructions.md`)

---

### 4.8 Registry Updates After Execution

**What it does:**
After EVERY chain completes, the orchestrator adds a line to `logs/INDEX.md`:

```
| 2026-02-08 | Implement login rate limiting | code → review → commit | Success — 3 files, APPROVED 98% (a1b2c3d) |
```

**Why it exists:**
Execution history. The orchestrator checks INDEX.md at session-start to find similar past executions. This enables learning and pattern reuse.

**What the human's role is:**
None. Automatic. But the human can read INDEX.md to see execution history.

**File references:**
- Format: `CONTRACT.md` → Format 4.2: INDEX.md Entry (lines 363-381)
- Registry: `.claude/actionflows/logs/INDEX.md`

---

### 4.9 Learning Surfaces

**What it does:**
When an agent reports a learning in its completion message, the orchestrator:

1. Extracts the learning
2. Suggests a solution
3. Asks human: "Implement this fix?"
4. If approved → compiles a chain to implement the fix
5. If approved → adds learning to LEARNINGS.md

**Example:**
```markdown
## Agent Learning

**From:** review/ (sonnet)
**Issue:** "Review agent missed a typo in error messages"
**Root cause:** "Review checklist doesn't include error message validation"

**Suggested fix:** Add error message checklist to checklists/technical/p1-code-quality.md

Implement?
```

**Why it exists:**
Agents discover issues and improvement opportunities. This is the **framework's feedback loop** — it evolves based on real usage.

**What the human's role is:**
Approve or reject learning fixes. If approved, the orchestrator implements automatically.

**File references:**
- Format: `CONTRACT.md` → Format 3.2: Learning Surface Presentation (lines 285-310)
- Rule: `ORCHESTRATOR.md` → Rule 5 Application: Surface Agent Learnings to Human (lines 300-306)

---

### 4.10 How The Bootstrap Process Works

**What it does:**
When a human wants to add ActionFlows to a NEW project:

1. Give the agent `bootstrap.md` as a prompt
2. Agent reads project files to discover stack
3. Agent decides which actions/flows/departments are needed
4. Agent creates framework structure (`.claude/actionflows/`)
5. Agent writes CLAUDE.md (lean project context)
6. Agent writes ORCHESTRATOR.md (orchestration rules)
7. Agent creates actions, flows, registries
8. Agent verifies everything works
9. Framework is ready — future orchestrator uses it

**Why it exists:**
Bootstrapping is a special case. The agent creating the framework IS a worker (reads code, writes files, produces content). Once created, the orchestrator using it is a coordinator (never produces content).

**What the human's role is:**
Provide bootstrap.md to the agent. Answer questions about what components to create. Verify final structure.

**File references:**
- Bootstrap prompt: `.claude/bootstrap.md` (3781 lines)
- Builder exemption: `bootstrap.md` → Lines 9-46 (you're a builder, not orchestrator)

---

### 4.11 Quick Triage Mode (Solo Developer Override)

**What it does:**
Before delegating, the orchestrator checks if the fix qualifies for quick triage:

| Criteria | Quick Triage (do it yourself) | Full Chain (delegate) |
|----------|------------------------------|----------------------|
| Files affected | 1-3 files | 4+ files |
| Fix complexity | Obvious, mechanical | Requires analysis or design |
| Scope | Single package | Cross-package |
| Confidence | Know exactly what to change | Needs investigation |

If ALL columns land in "Quick Triage":
- Orchestrator MAY implement directly (read, edit, fix)
- MUST still commit via commit/ action (not directly)
- MUST note `[QUICK TRIAGE]` in response

**Why it exists:**
Solo developers need fast iteration on trivial fixes. Full chain compilation is overhead for 1-line typo fixes.

**What the human's role is:**
Trust that orchestrator evaluates correctly. If the orchestrator over-uses quick triage, say "compile a chain for this."

**File references:**
- Definition: `ORCHESTRATOR.md` → Rule 0: Quick Triage Mode (lines 65-84)

---

### 4.12 Meta-Task Size Threshold (For Framework Files)

**What it does:**
Even for framework files, there's a threshold:

| Criteria | Direct (registry edit) | Delegate (compile chain) |
|----------|----------------------|-------------------------|
| Lines changed | < 5 lines | 5+ lines |
| Files affected | 1 file | 2+ files |
| Nature | Add entry, update count | Structural rewrite, content generation |
| Judgment needed | Mechanical (add line, fix number) | Creative (write content, restructure) |

**If ANY column lands in "Delegate" → compile a chain.**

**Why it exists:**
The registry edit exemption is for bookkeeping, not implementation. Adding a line to INDEX.md is coordination. Rewriting an agent.md is creation.

**What the human's role is:**
Trust that orchestrator evaluates correctly. The threshold is clear and objective.

**File references:**
- Definition: `ORCHESTRATOR.md` → Rule 1 Application: Delegate Everything (lines 94-102)

---

### 4.13 Action Modes (Assess vs Assess+Fix)

**What it does:**
Some actions support two modes:

| Action | Default Mode | Extended Mode | Behavior |
|--------|-------------|---------------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs, doc errors |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH findings |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift, mismatches |

The orchestrator chooses mode based on fix complexity:
- Extended mode: straightforward fixes, no architecture decisions
- Default mode: complex changes, human judgment required

**Why it exists:**
Sometimes you want assessment + fix in one pass. Sometimes you want assessment only so you can decide how to fix.

**What the human's role is:**
Can override mode when approving chain: "Use review-and-fix" or "review-only please."

**File references:**
- Definition: `ORCHESTRATOR.md` → Rule 7 Application: Action Modes (lines 327-336)
- Contract: `CONTRACT.md` → Action Modes (throughout action-specific formats)

---

### 4.14 Autonomous Follow-Through (No Approval Between Steps)

**What it does:**
Once the human approves a chain, the orchestrator executes the ENTIRE chain without stopping for approval between steps.

**Step completion format (informational, NOT approval):**
```
>> Step 1 complete: analyze/ -- Found 3 coverage gaps. Continuing to Step 2...
>> Step 2 complete: code/ -- Implemented 3 tests. Continuing to Step 3...
```

The orchestrator doesn't wait for human response between steps. Only HUMAN GATE steps are approval checkpoints.

**Why it exists:**
Chain approval is upfront. Once approved, the orchestrator handles execution autonomously. This prevents "death by a thousand approvals."

**What the human's role is:**
Approve the chain upfront. Trust the orchestrator to execute. If a step fails, orchestrator stops and presents the failure.

**File references:**
- Definition: `ORCHESTRATOR.md` → Initiative Area 1: Autonomous Follow-Through (lines 391-405)

---

### 4.15 Step Boundary Evaluation (Six-Trigger Recompilation)

**What it does:**
After EVERY step completion, the orchestrator runs this checklist:

1. **Agent Output Signals** — Did the agent report scope change?
2. **Pattern Recognition** — Does history show this chain type needs adjustment here?
3. **Dependency Discovery** — Did the step reveal missing prerequisites?
4. **Quality Threshold** — Does output quality meet the bar for next step?
5. **Chain Redesign Initiative** — Would rearranging remaining steps improve outcome?
6. **Reuse Opportunity** — Does an existing flow match remaining work better?

If ANY trigger fires:
- Within original scope → Recompile remaining steps, announce, continue
- Expands scope → STOP, present expanded chain to human for approval

**Why it exists:**
Plans change. The orchestrator adapts mid-chain instead of rigidly following the original plan when signals indicate a better path.

**What the human's role is:**
None for within-scope adjustments (orchestrator announces and continues). Approve/reject for scope expansions.

**File references:**
- Definition: `ORCHESTRATOR.md` → Step Boundary Evaluation (lines 480-545)

---

## 5. The Living Software Model

**What it is:**
ActionFlows is not a static framework. It's a **living system** that evolves through human-triggered Claude sessions, but stays in harmony through guardrails.

### Philosophy

**Traditional software:** Human writes code → Code is static → Changes require manual editing

**Living software:** Human triggers Claude to evolve the system → Guardrails ensure consistency → Backend algorithms remain accurate

### How It Works

**Three components in harmony:**

1. **Orchestrator** — Living agent that evolves behavior via ORCHESTRATOR.md edits
2. **Dashboard** — Living visualization that evolves via backend/frontend code
3. **Contract** — The harmony bridge that keeps them in sync

**The Contract is the Bridge:**

- Orchestrator can change how it behaves (edit ORCHESTRATOR.md)
- Dashboard can change how it visualizes (edit components)
- **But:** Orchestrator output formats MUST match the contract
- **But:** Dashboard parsing MUST match the contract

If the contract changes, BOTH sides update in coordination.

### Evolution Workflow

**Scenario:** Human wants to add a new output format (e.g., "risk assessment summary")

**Steps:**
1. Define the new format in CONTRACT.md (structure, required fields, patterns)
2. Add TypeScript type to `packages/shared/src/contract/types/`
3. Add parser to `packages/shared/src/contract/parsers/`
4. Update ORCHESTRATOR.md with example of when to produce this format
5. Add dashboard component to render the format
6. Test harmony detection validates the format
7. Increment CONTRACT_VERSION if structure breaks old parsers

**Guardrails:**
- Contract defines required fields (can't change arbitrarily)
- Parsers validate structure (mismatches detected)
- Harmony detection flags drift (dashboard shows "parsing incomplete")
- TypeScript types enforce correctness (compile errors if wrong)

### Harmony Detection

**What it does:**
Backend pattern recognition that detects orchestrator drift from the contract.

**How it works:**
1. Orchestrator produces output
2. Backend tries to parse using contract parsers
3. Parse succeeds → Harmony ✅
4. Parse fails → Harmony ❌ (dashboard shows "parsing incomplete")

**Example:**

Orchestrator produces:
```markdown
## Chain: Fix login bug

| Step | Action | Status |
|------|--------|--------|
| 1 | code/ | Pending |
```

Backend parser expects:
```
| # | Action | Model | Key Inputs | Waits For | Status |
```

Parser fails → Harmony detection flags drift → Dashboard shows warning

**What the human's role is:**
- Investigate harmony violations
- Decide: Was orchestrator wrong? Or is contract outdated?
- Update whichever side drifted

### Why This Matters

**Without harmony:**
- Orchestrator changes output formats
- Dashboard still parses old formats
- Visualization breaks
- Human doesn't know why

**With harmony:**
- Orchestrator changes output formats
- Dashboard detects mismatch
- Human investigates and fixes
- System stays synchronized

**The key insight:** Living software needs **guardrails**, not rigidity. The contract is the guardrail. Evolution happens within it.

### What's Sacred vs What's Not

**Sacred (harmony-critical):**
- Contract-defined output formats
- Branded type conventions
- WebSocket event structures
- Registry file structures
- Log folder naming patterns

**Not sacred (evolve freely):**
- ORCHESTRATOR.md philosophy sections
- Agent instructions (within standards)
- Flow definitions
- Department routing rules
- project.config.md values

**The boundary:** If the dashboard PARSES it, it's sacred. If the dashboard READS it, it's not.

### File References

- Philosophy: Ideation summary → `logs/ideation/framework-harmony-system_2026-02-08-21-10-43/summary.md`
- Contract: `.claude/actionflows/CONTRACT.md` → Contract Philosophy section (lines 15-27)
- Harmony detection: `packages/backend/src/services/HarmonyDetectionService.ts` (future)

---

## 6. Teaching Order (Progressive Disclosure)

This is the recommended sequence for teaching ActionFlows concepts to a new human. Start simple, add complexity progressively.

### Beginner Level (First Session)

**Goal:** Human can use the framework without breaking it.

**Teach in this order:**

1. **The Orchestrator is a Coordinator, Not a Worker** (5 min)
   - Show example: "implement login" → orchestrator compiles chain → spawns agents
   - Key point: Orchestrator NEVER writes code, it delegates
   - Practice: Ask for a feature, watch orchestrator compile chain

2. **Chain Compilation → Approval → Execution** (10 min)
   - Show chain compilation table format
   - Explain: You approve BEFORE work starts
   - Practice: Review a compiled chain, approve it

3. **Sacred Formats (Don't Touch These)** (15 min)
   - Show: Chain compilation table
   - Show: Step completion announcements
   - Show: Log folder naming convention
   - Rule: If dashboard parses it, don't change it
   - Give list of sacred items (Section 1 of this inventory)

4. **Safe to Evolve (Go Ahead, Change These)** (10 min)
   - Show: Adding a new flow to FLOWS.md
   - Show: Updating project.config.md
   - Rule: If dashboard READS it (doesn't parse), you can change it
   - Give list of safe items (Section 3 of this inventory)

5. **The Sin Test (Simple Version)** (5 min)
   - If orchestrator produces content instead of compiling chain → Say "it's a sin"
   - Orchestrator stops, acknowledges, recompiles
   - You don't need to know WHY, just know the reset command

**Deliverables after Beginner:**
- Quick reference card: Sacred vs Safe
- Cheat sheet: "How to request work" (natural language examples)
- Emergency command: "It's a sin" = reset

**Skip for now:**
- Detailed contract formats (they just need to know "don't change these")
- Harmony detection details
- Second opinion protocol
- Bootstrap process

---

### Intermediate Level (After 5-10 Successful Chains)

**Goal:** Human can customize the framework safely.

**Teach in this order:**

1. **How Department Routing Works** (10 min)
   - Show ORGANIZATION.md routing table
   - Explain: Human intent → Department → Flow
   - Practice: Add a new routing trigger

2. **How to Add a Flow** (20 min)
   - Show existing flow's instructions.md
   - Walk through: Create flow directory, write instructions.md, update FLOWS.md
   - Practice: Create a simple flow (e.g., "docs-update/")

3. **How to Add an Action** (30 min)
   - Show agent.md + instructions.md pattern
   - Explain: Extends section, mission, steps, constraints, learnings
   - Walk through: Create simple action (e.g., "deploy/")
   - Practice: Write agent.md, test spawning

4. **Action Modes (Assess vs Assess+Fix)** (10 min)
   - Explain: review-only vs review-and-fix
   - When to use which mode
   - Practice: Request review-and-fix mode in chain approval

5. **Second Opinion Protocol** (15 min)
   - Explain: Auto-inserted after review/audit
   - Show dual output format
   - Explain: Commit waits for original, not second opinion
   - Practice: Review a dual output

6. **Learning Surfaces** (10 min)
   - Explain: Agents report learnings → orchestrator surfaces → you approve
   - Show example learning surface
   - Practice: Approve a learning fix

**Deliverables after Intermediate:**
- Flow creation template
- Action creation template
- Common patterns library (example flows/actions to copy)

**Skip for now:**
- Contract versioning
- Harmony detection internals
- Bootstrap process
- Step boundary evaluation

---

### Advanced Level (After 20+ Chains, Ready to Evolve Framework)

**Goal:** Human can evolve the framework and maintain harmony.

**Teach in this order:**

1. **The Contract as Harmony Bridge** (20 min)
   - Explain: Living software model
   - Show: CONTRACT.md structure
   - Explain: Dashboard parses these formats
   - Practice: Read a contract format definition (e.g., Chain Compilation)

2. **How to Add a New Output Format** (45 min)
   - Walk through: Define in CONTRACT.md
   - Walk through: Add TypeScript type
   - Walk through: Add parser
   - Walk through: Update ORCHESTRATOR.md
   - Walk through: Add dashboard component
   - Walk through: Test harmony detection
   - Practice: Add a simple format (e.g., "deployment summary")

3. **Harmony Detection** (15 min)
   - Explain: Backend validates orchestrator output against contract
   - Show: What "parsing incomplete" means in dashboard
   - Explain: Recovery workflow (investigate → decide → update)
   - Practice: Simulate a harmony violation, resolve it

4. **Contract Versioning** (20 min)
   - Explain: When to increment version (breaking vs non-breaking changes)
   - Show: How to support multiple versions during migration
   - Walk through: Version increment workflow
   - Practice: Plan a contract version bump

5. **Step Boundary Evaluation (Six Triggers)** (20 min)
   - Explain: Orchestrator recompiles mid-chain when signals change
   - Show: The six triggers
   - Explain: Within-scope vs scope-expansion
   - Practice: Review a mid-chain recompilation announcement

6. **Bootstrap Process** (30 min)
   - Explain: How to add ActionFlows to a new project
   - Show: bootstrap.md structure
   - Explain: Builder exemption (reads code, writes files)
   - Walk through: Bootstrap workflow
   - Practice: Review a bootstrapped framework structure

7. **Identity Isolation (Three Defense Layers)** (15 min)
   - Explain: Why subagents can't read ORCHESTRATOR.md
   - Show: Spawning prompt guard
   - Show: Agent-standards rule #9
   - Show: CLAUDE.md conditional
   - Practice: Verify an agent.md follows identity boundary

**Deliverables after Advanced:**
- Contract format creation guide
- Harmony troubleshooting playbook
- Bootstrap checklist
- Framework evolution decision tree

**Now you can:**
- Evolve the framework autonomously
- Add new output formats
- Maintain contract harmony
- Bootstrap new projects

---

## Teaching Format Recommendations

### Use Progressive Examples, Not Walls of Text

**Bad:**
> "The orchestrator reads ORGANIZATION.md, FLOWS.md, ACTIONS.md, and logs/INDEX.md at session start to determine routing. It uses a department-first approach where human intent is mapped to departments via keyword triggers, then flows are matched within departments, and if no flow matches, actions are composed dynamically..."

**Good:**

**Level 1 (Beginner):**
> The orchestrator is like a project manager. You ask for work, it figures out who should do it, and delegates.

**Level 2 (Intermediate):**
> The orchestrator reads routing tables to decide which flow matches your request. If no flow matches, it composes actions into a custom chain.

**Level 3 (Advanced):**
> The orchestrator follows this workflow:
> 1. Read ORGANIZATION.md → identify department
> 2. Read FLOWS.md → find matching flow
> 3. No match? Read ACTIONS.md → compose chain
> 4. Check logs/INDEX.md → any similar past executions?
> 5. Present chain to human for approval

---

### Show Before Telling

**For each concept, use this structure:**

1. **Show the example** (concrete)
2. **Explain what it does** (1-2 sentences)
3. **Ask the teaching question** (quiz)
4. **Validate the answer**
5. **Explain what just happened and why** (synthesis)

**Example for "Chain Compilation":**

1. **Show:**
   ```markdown
   ## Chain: Fix login bug

   **Request:** Fix login validation bug
   **Source:** bug-triage/

   | # | Action | Model | Key Inputs | Waits For | Status |
   |---|--------|-------|------------|-----------|--------|
   | 1 | analyze/ | sonnet | scope=auth | -- | Pending |
   | 2 | code/ | haiku | fix from #1 | #1 | Pending |
   | 3 | review/ | sonnet | changes from #2 | #2 | Pending |
   | 4 | commit/ | haiku | all changes | #3 | Pending |

   Execute?
   ```

2. **Explain:**
   This is how the orchestrator presents a plan before executing. You approve or adjust BEFORE work starts.

3. **Ask:**
   What happens if you say "Execute"?

4. **Validate:**
   Correct! The orchestrator spawns agents to run each step. Step 1 first, then step 2 (waits for #1), etc.

5. **Explain:**
   This is called "chain compilation." It separates planning from execution. You get visibility and control upfront.

---

### Use Visual Hierarchy

**Group related concepts:**

```
Sacred / Never Change
├── P0 Formats (Critical)
│   ├── Chain Compilation Table
│   └── Step Completion Announcement
├── P1 Formats (High Value)
│   ├── Review Report Structure
│   └── Error Announcement
└── P2 Formats (Important)
    ├── Dual Output Format
    └── Registry Update Format
```

**Not:**
> Sacred formats include chain compilation table, step completion announcement, dual output format, registry update format, review report structure, error announcement format...

---

### Provide Escape Hatches

**At every level, give the human ways to:**

1. **Skip ahead** — "Already know this? Jump to intermediate"
2. **Go back** — "Need to review basics? Return to beginner"
3. **Get help** — "Stuck? Show me examples"
4. **Test knowledge** — "Quiz me on this section"

---

## Summary of Key Findings

### Sacred Items (14)
The contract-defined formats, branded types, event structures, registry formats, and log naming patterns. If the dashboard PARSES it, it's load-bearing.

### Sensitive Items (11)
Learnings format, human gates, second opinion skip, analysis reports, chain status updates, completion summaries, brainstorm transcripts, LEARNINGS.md entries, session-start acknowledgment, routing announcements, agent learnings output. These degrade experience if changed improperly.

### Safe Items (8 categories)
Flows, actions, departments, agent instructions (within standards), ORCHESTRATOR.md philosophy, project.config.md, checklists, abstract actions. If the dashboard READS it (doesn't parse), you can evolve it.

### Behavioral Patterns (15)
Session-start protocol, chain compilation cycle, department routing, The Sin Test, identity isolation, review→second-opinion pipeline, human gates, registry updates, learning surfaces, bootstrap process, quick triage mode, meta-task threshold, action modes, autonomous follow-through, step boundary evaluation.

### Living Software Model
Human triggers Claude to evolve → Guardrails ensure harmony → Contract is the bridge → Dashboard stays accurate. The philosophy of synchronized evolution.

### Teaching Order
Beginner (5 topics, 45 min) → Intermediate (6 topics, 95 min) → Advanced (7 topics, 165 min). Progressive disclosure from "how to use" to "how to evolve."

---

## Gaps & Recommendations

### Current State

**What exists:**
- Comprehensive bootstrap.md (3781 lines)
- Complete contract specification (CONTRACT.md)
- Full framework implementation

**What's missing:**
- Interactive teaching flow
- Progressive disclosure structure
- Pattern examples library
- Validation checkpoints
- "Why this matters" explanations
- Recovery workflows for common mistakes

### Recommended Next Steps

1. **Create Interactive Questionnaire Flow** (Onboarding Step 2)
   - Use this inventory as source material
   - Structure: Beginner → Intermediate → Advanced
   - Format: Show example → Explain → Quiz → Validate → Synthesize

2. **Build Pattern Examples Library**
   - Show-before-ask cards for each concept
   - Wrong vs Right examples (❌ vs ✅)
   - Common pitfalls with recovery steps

3. **Add Validation Checkpoints**
   - After each teaching level: quiz
   - After customization: verify structure
   - After evolution: run harmony detection

4. **Create Teaching Moments in Dashboard**
   - When orchestrator violates boundary → explain The Sin Test
   - When harmony breaks → explain contract
   - When agent reports learning → explain feedback loop

5. **Write Recovery Playbooks**
   - Harmony violation detected → investigation workflow
   - Orchestrator sinned → reset command explanation
   - Agent broke identity boundary → debug steps

---

**End of Teaching Inventory**
