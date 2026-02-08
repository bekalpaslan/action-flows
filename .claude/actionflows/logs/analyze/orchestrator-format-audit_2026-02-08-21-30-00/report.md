# Orchestrator Format Audit Report

**Analysis Type:** Format Catalog & Pattern Detection Inventory
**Date:** 2026-02-08 21:30:00
**Scope:** All orchestrator output formats across ORCHESTRATOR.md, FLOWS.md, ACTIONS.md, and backend parsing
**Agent:** analyze/

---

## Executive Summary

This audit catalogs **17 distinct output formats** produced by the ActionFlows orchestrator that the dashboard could parse or visualize. The backend currently parses **2 primary formats** (execution patterns via INDEX.md, and action frequencies) but has no parsers for the remaining 15 orchestrator message formats. This represents a significant opportunity for real-time dashboard visualization.

**Key Findings:**
- **Chain compilation tables** are the most complex format (7 columns, markdown table)
- **Step completion announcements** follow a consistent `>> Step N complete: action/ -- result` pattern
- **Dual output format** for second-opinion results is well-structured but not yet parsed
- **Human gate presentations** have no standardized format marker
- **Registry updates** follow a predictable 3-field pattern
- **Backend gap:** No real-time parsing of orchestrator messages; only post-execution log analysis

---

## Format Categories

### 1. Chain Management Formats
- [1.1] Chain Compilation Table
- [1.2] Chain Execution Start
- [1.3] Chain Status Update
- [1.4] Execution Complete Summary

### 2. Step Lifecycle Formats
- [2.1] Step Completion Announcement
- [2.2] Dual Output (Action + Second Opinion)
- [2.3] Second Opinion Skip

### 3. Human Interaction Formats
- [3.1] Human Gate Presentation
- [3.2] Learning Surface Presentation
- [3.3] Session-Start Protocol Acknowledgment

### 4. Registry & Metadata Formats
- [4.1] Registry Update
- [4.2] INDEX.md Entry
- [4.3] LEARNINGS.md Entry

### 5. Action Output Formats
- [5.1] Review Report Structure
- [5.2] Analysis Report Structure
- [5.3] Brainstorm Session Transcript

### 6. Error & Status Formats
- [6.1] Error Announcement
- [6.2] Department Routing Announcement

---

## Format 1.1: Chain Compilation Table

**Source:** `ORCHESTRATOR.md` lines 315-334 (Response Format Standard)

**When Produced:** When orchestrator compiles a chain and presents it to human for approval

**Exact Structure:**
```markdown
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
- Table with columns: `#` (int), `Action` (action-type/), `Model` (haiku|sonnet|opus), `Key Inputs` (key=value pairs), `Waits For` (step ref or "--"), `Status` (enum)
- `Execution` (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does" with action name + description

**Parseable Pattern:**
```regex
^## Chain: (.+)$
^\*\*Request:\*\* (.+)$
^\*\*Source:\*\* (.+)$
^\| # \| Action \| Model \| Key Inputs \| Waits For \| Status \|$
^\| (\d+) \| ([a-z-/]+) \| (haiku|sonnet|opus) \| (.+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$
^\*\*Execution:\*\* (.+)$
^(\d+)\. \*\*(.+)\*\* -- (.+)$
^Execute\?$
```

**Dashboard Dependency:**
- **ChainView component** - Renders chain table with ReactFlow nodes
- **ExecutionPlan model** - Typed representation of chain structure
- **Pattern detection** - Identifies recurring chain signatures

**Example:**
```markdown
## Chain: FRD & SRD Documentation

**Request:** Generate comprehensive FRD and SRD for ActionFlows Dashboard
**Source:** Composed from: analyze + plan + code + review + commit

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | analyze/ | sonnet | aspect=inventory, scope=packages/ | -- | Pending |
| 2 | analyze/ | sonnet | aspect=structure, scope=docs/ | -- | Pending |
| 3 | plan/ | sonnet | requirements=FRD+SRD outline | #1,#2 | Pending |
| 4 | code/ | haiku | task=Write FRD.md | #3 | Pending |
| 5 | code/ | haiku | task=Write SRD.md | #3 | Pending |
| 6 | review/ | sonnet | scope=docs/FRD.md,docs/SRD.md | #4,#5 | Pending |
| 7 | commit/ | haiku | summary=docs: Add FRD and SRD | #6 | Pending |

**Execution:** Parallel: [1,2] -> [3] -> Parallel: [4,5] -> [6] -> [7]

What each step does:
1. **analyze/** -- Inventory project structure, packages, and tech stack
2. **analyze/** -- Analyze existing docs structure and conventions
3. **plan/** -- Create FRD and SRD outline with sections
4. **code/** -- Write FRD.md with functional requirements
5. **code/** -- Write SRD.md with technical specifications
6. **review/** -- Review both documents for completeness and accuracy
7. **commit/** -- Commit FRD and SRD to repository

Execute?
```

---

## Format 1.2: Chain Execution Start

**Source:** `ORCHESTRATOR.md` lines 336-342

**When Produced:** When orchestrator starts executing an approved chain

**Exact Structure:**
```markdown
## Executing: {Brief Title}

Spawning Step {N}: {action/} ({model})...
```

**Required Fields:**
- `Brief Title` (string, same as from compilation)
- `N` (step number, int)
- `action/` (action type with trailing slash)
- `model` (haiku|sonnet|opus)

**Parseable Pattern:**
```regex
^## Executing: (.+)$
^Spawning Step (\d+): ([a-z-/]+) \((haiku|sonnet|opus)\)\.\.\.$
```

**Dashboard Dependency:**
- **ExecutionStatus component** - Shows "Executing" badge
- **StepTracker component** - Updates active step indicator
- **ChainStartedEvent** - WebSocket event to update UI state

**Example:**
```markdown
## Executing: FRD & SRD Documentation

Spawning Step 1: analyze/ (sonnet)...
```

---

## Format 2.1: Step Completion Announcement

**Source:** `ORCHESTRATOR.md` lines 344-348, line 289

**When Produced:** After each step completes (informational, not approval checkpoint)

**Exact Structure:**
```
>> Step {N} complete: {action/} -- {one-line result}. Continuing to Step {N+1}...
```

**Required Fields:**
- `>>` (prefix marker)
- `N` (step number, int)
- `action/` (action type with trailing slash)
- `one-line result` (string, agent's completion summary)
- `N+1` (next step number, int, or "Done" if last step)

**Parseable Pattern:**
```regex
^>> Step (\d+) complete: ([a-z-/]+) -- (.+)\. Continuing to Step (\d+|Done)\.\.\.$
```

**Dashboard Dependency:**
- **StepCompletedEvent** - WebSocket event type
- **ProgressBar component** - Advances completion percentage
- **Timeline component** - Adds completed step to visual timeline
- **StepResultSummary component** - Displays one-line result

**Example:**
```
>> Step 1 complete: analyze/ -- Inventory delivered with 42 components across 3 packages. Continuing to Step 2...
>> Step 6 complete: review/ -- APPROVED 96% (1 low-severity issue). Continuing to Step 7...
>> Step 7 complete: commit/ -- Committed as df4db44: "docs: Add FRD and SRD". Continuing to Done...
```

---

## Format 2.2: Dual Output (Action + Second Opinion)

**Source:** `ORCHESTRATOR.md` lines 207-230

**When Produced:** When both an action (review/audit) and its second-opinion critique complete

**Exact Structure:**
```markdown
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- {critique summary or SKIPPED}.

### Dual Output: {action/} + Second Opinion

**Original ({action/}):**
{Verdict/score from original agent's completion message}

**Second Opinion ({model name} via Ollama):**
{Key findings summary from second-opinion agent's completion message}
- Missed issues: {count}
- Disagreements: {count}
- Notable: {top finding if any}

**Full reports:**
- Original: `{original log path}`
- Critique: `{second-opinion log path}`

Continuing to Step {N+2}...
```

**Required Fields:**
- Two step completion lines (N and N+1)
- `### Dual Output: {action/} + Second Opinion` (H3 heading)
- **Original** subsection with verdict/score
- **Second Opinion** subsection with model name, findings summary, and bullet counts
- **Full reports** subsection with two file paths
- "Continuing to Step {N+2}..." line

**Parseable Pattern:**
```regex
^>> Step (\d+) complete: ([a-z-/]+) -- (.+)\.$
^>> Step (\d+) complete: second-opinion/ -- (.+)\.$
^### Dual Output: ([a-z-/]+) \+ Second Opinion$
^\*\*Original \(([a-z-/]+)\):\*\*$
^(.+)$
^\*\*Second Opinion \((.+) via Ollama\):\*\*$
^(.+)$
^- Missed issues: (\d+)$
^- Disagreements: (\d+)$
^- Notable: (.+)$
^\*\*Full reports:\*\*$
^- Original: `(.+)`$
^- Critique: `(.+)`$
^Continuing to Step (\d+)\.\.\.$
```

**Dashboard Dependency:**
- **DualOutputPanel component** - Side-by-side comparison view
- **SecondOpinionBadge component** - Shows missed issues count
- **DiffViewer component** - Highlights disagreements
- **ReportLinkList component** - Provides download links to full reports

**Example:**
```markdown
>> Step 3 complete: review/ -- APPROVED 92% (7 findings: 2 MEDIUM, 5 LOW). Continuing to Step 4...
>> Step 4 complete: second-opinion/ -- 3 additional concerns found, 1 disagreement on severity.

### Dual Output: review/ + Second Opinion

**Original (review/):**
APPROVED 92% — 7 findings across integration quality, performance, and minor inconsistencies.

**Second Opinion (llama3.2 via Ollama):**
Critique identified 3 additional concerns not flagged by Claude:
- Missed issues: 3
- Disagreements: 1
- Notable: Redis KEYS command is O(N) and blocks production traffic

**Full reports:**
- Original: `.claude/actionflows/logs/review/phase2-pattern-detection_2026-02-08-20-30-50/review-report.md`
- Critique: `.claude/actionflows/logs/second-opinion/phase2-review-critique_2026-02-08-20-31-15/critique.md`

Continuing to Step 5...
```

---

## Format 2.3: Second Opinion Skip

**Source:** `ORCHESTRATOR.md` lines 232-240

**When Produced:** When second-opinion step is skipped (Ollama unavailable or human suppression)

**Exact Structure:**
```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- SKIPPED ({reason}).

Continuing to Step {N+2}...
```

**Required Fields:**
- Two step completion lines
- `SKIPPED` keyword
- `reason` (string: "Ollama unavailable" | "human suppression" | other)
- "Continuing to Step {N+2}..." line

**Parseable Pattern:**
```regex
^>> Step (\d+) complete: ([a-z-/]+) -- (.+)\.$
^>> Step (\d+) complete: second-opinion/ -- SKIPPED \((.+)\)\.$
^Continuing to Step (\d+)\.\.\.$
```

**Dashboard Dependency:**
- **SkippedStepBadge component** - Shows gray "SKIPPED" badge with reason
- **StepCompletedEvent** - Status field = "skipped"
- **Timeline component** - Renders skipped steps with different styling

**Example:**
```
>> Step 3 complete: review/ -- APPROVED 88% (3 findings: 1 MEDIUM, 2 LOW).
>> Step 4 complete: second-opinion/ -- SKIPPED (Ollama service unavailable).

Continuing to Step 5...
```

---

## Format 3.1: Human Gate Presentation

**Source:** Flow instructions (e.g., `flow-creation/instructions.md` line 42-48)

**When Produced:** At predefined gates in flows where human approval is required

**Exact Structure:**
```markdown
### Step {N}: HUMAN GATE

{Present what was produced from previous step}

{Question or prompt for approval}
```

**Required Fields:**
- `### Step {N}: HUMAN GATE` (H3 heading with exact "HUMAN GATE" text)
- Summary or artifact from previous step
- Approval prompt

**Parseable Pattern:**
```regex
^### Step (\d+): HUMAN GATE$
^(.+)$
^(.+)\?$
```

**Dashboard Dependency:**
- **HumanGateModal component** - Blocking modal with approval buttons
- **AwaitingInputEvent** - WebSocket event to pause execution UI
- **GateHistory component** - Shows past gates and decisions

**Example:**
```markdown
### Step 2: HUMAN GATE

Flow design plan delivered with action sequence:
1. plan/ → Design flow structure
2. code/ → Create instructions.md
3. review/ → Validate flow correctness

Approve this design to continue?
```

**Note:** Human gates do NOT have a standardized marker beyond "HUMAN GATE" in the heading. The content is free-form and varies by flow. This makes parsing challenging.

---

## Format 3.2: Learning Surface Presentation

**Source:** `ORCHESTRATOR.md` lines 379-391

**When Produced:** When an agent reports learnings in its completion message

**Exact Structure:**
```markdown
## Agent Learning

**From:** {action/} ({model})
**Issue:** "{what happened}"
**Root cause:** "{why}"

**Suggested fix:** {orchestrator's proposed solution}

Implement?
```

**Required Fields:**
- `## Agent Learning` (H2 heading)
- `From` field with action type and model
- `Issue` field (quoted string)
- `Root cause` field (quoted string)
- `Suggested fix` field (orchestrator's analysis, not quoted)
- "Implement?" prompt

**Parseable Pattern:**
```regex
^## Agent Learning$
^\*\*From:\*\* ([a-z-/]+) \((haiku|sonnet|opus)\)$
^\*\*Issue:\*\* "(.+)"$
^\*\*Root cause:\*\* "(.+)"$
^\*\*Suggested fix:\*\* (.+)$
^Implement\?$
```

**Dashboard Dependency:**
- **LearningAlert component** - Shows learning as dismissible alert
- **LearningSurface component** - Aggregates all learnings by action type
- **LEARNINGS.md viewer** - Displays historical learnings
- **ImplementButton component** - Triggers fix chain when clicked

**Example:**
```markdown
## Agent Learning

**From:** review/ (sonnet)
**Issue:** "Log folder creation with inline $() substitution fails on Windows"
**Root cause:** "Windows shell doesn't support $() inside strings during mkdir"

**Suggested fix:** Pre-compute variables separately before constructing paths. Update create-log-folder/instructions.md with warning and correct pattern.

Implement?
```

---

## Format 3.3: Session-Start Protocol Acknowledgment

**Source:** `ORCHESTRATOR.md` lines 8-24 (Session-Start Protocol)

**When Produced:** At the start of every orchestrator session (before responding to human)

**Exact Structure:**
This format is **internal** — the orchestrator reads these files but doesn't output a visible acknowledgment. However, it COULD produce:

```markdown
## Session Started

Loaded configuration:
- Project: {name from project.config.md}
- Departments: {count} ({list})
- Flows: {count}
- Actions: {count}
- Past executions: {count from INDEX.md}

Ready to route requests.
```

**Required Fields:**
- Project name
- Department count and list
- Flow count
- Action count
- Past execution count

**Parseable Pattern:**
```regex
^## Session Started$
^Loaded configuration:$
^- Project: (.+)$
^- Departments: (\d+) \((.+)\)$
^- Flows: (\d+)$
^- Actions: (\d+)$
^- Past executions: (\d+)$
^Ready to route requests\.$
```

**Dashboard Dependency:**
- **SessionStatusBar component** - Shows "Session active" with config summary
- **SessionStartedEvent** - WebSocket event to initialize UI state

**Example:**
```markdown
## Session Started

Loaded configuration:
- Project: ActionFlows Dashboard
- Departments: 4 (Framework, Engineering, QA, Human)
- Flows: 10
- Actions: 14
- Past executions: 37

Ready to route requests.
```

**Note:** This format is currently NOT produced by the orchestrator. It reads the files silently. Recommend adding this output for dashboard visibility.

---

## Format 4.1: Registry Update

**Source:** `ORCHESTRATOR.md` lines 393-401

**When Produced:** When orchestrator directly edits a registry file (only permitted direct action)

**Exact Structure:**
```markdown
## Registry Update: {Brief Title}

**File:** {registry file}
**Line:** {added/removed/updated}: "{the line}"

Done.
```

**Required Fields:**
- `Brief Title` (string)
- `File` (filename: INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md)
- `Line` (action: added | removed | updated)
- `the line` (exact text of the line)

**Parseable Pattern:**
```regex
^## Registry Update: (.+)$
^\*\*File:\*\* (.+)$
^\*\*Line:\*\* (added|removed|updated): "(.+)"$
^Done\.$
```

**Dashboard Dependency:**
- **RegistryLineUpdatedEvent** - WebSocket event type
- **RegistryViewer component** - Live-updates registry file display
- **RegistryChangeLog component** - Shows history of registry edits

**Example:**
```markdown
## Registry Update: Add ideation flow to registry

**File:** FLOWS.md
**Line:** added: "| ideation/ | Structured ideation sessions | classify → analyze → brainstorm → code |"

Done.
```

---

## Format 4.2: INDEX.md Entry

**Source:** `logs/INDEX.md` (lines 7-15 in sample)

**When Produced:** After each chain execution completes (orchestrator adds entry)

**Exact Structure:**
```
| {YYYY-MM-DD} | {Description} | {Pattern} | {Outcome} |
```

Where:
- `YYYY-MM-DD` = execution date
- `Description` = brief title of work
- `Pattern` = action chain signature (e.g., `code×8 → review → second-opinion → commit`)
- `Outcome` = status + metrics + commit hash (e.g., `Success — 18 files, APPROVED 92% (1d50f9e)`)

**Required Fields:**
- Date (YYYY-MM-DD format)
- Description (string)
- Pattern (action sequence with arrows →, multipliers ×N optional)
- Outcome (Success/Failed + metrics + git hash in parens)

**Parseable Pattern:**
```regex
^\| (\d{4}-\d{2}-\d{2}) \| (.+) \| (.+) \| (Success|Failed) — (.+) \(([a-f0-9]{7})\) \|$
```

**Dashboard Dependency:**
- **ExecutionHistoryTable component** - Renders INDEX.md as searchable table
- **PatternAnalyzer service** - Extracts pattern signatures for frequency analysis
- **CommitLinkButton component** - Links git hash to repository

**Example:**
```
| 2026-02-08 | Phase 2 Pattern Detection | code×8 → review → second-opinion → commit | Success — 18 files, APPROVED 92% (1d50f9e) |
| 2026-02-08 | FRD & SRD Documentation | analyze×4 → plan → code×2 → review → commit | Success — 2,263 lines, FRD+SRD, APPROVED 96% (df4db44) |
```

---

## Format 4.3: LEARNINGS.md Entry

**Source:** `logs/LEARNINGS.md` (referenced in ORCHESTRATOR.md lines 115, 379-391)

**When Produced:** After orchestrator surfaces an agent learning and human approves implementation

**Exact Structure:**
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

**Required Fields:**
- H3 heading: Action type (e.g., "Review", "Code", "Analyze")
- H4 heading: Issue title
- Context, Problem, Root Cause, Solution fields
- Date (YYYY-MM-DD)
- Source (action type + chain reference)

**Parseable Pattern:**
```regex
^### ([A-Z][a-z]+)$
^#### (.+)$
^\*\*Context:\*\* (.+)$
^\*\*Problem:\*\* (.+)$
^\*\*Root Cause:\*\* (.+)$
^\*\*Solution:\*\* (.+)$
^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$
^\*\*Source:\*\* ([a-z-/]+) in (.+)$
```

**Dashboard Dependency:**
- **LearningsLibrary component** - Searchable library of past learnings
- **LearningsByAction component** - Groups learnings by action type
- **PreventionChecklist component** - Shows solutions as checklist before spawning

**Example:**
```markdown
### Review

#### Log Folder Creation Fails on Windows with Inline Substitution

**Context:** When agents create log folders using create-log-folder/instructions.md
**Problem:** mkdir fails with "invalid syntax" on Windows shell
**Root Cause:** Windows shell doesn't support $() inside strings during mkdir command
**Solution:** Pre-compute datetime and description into variables BEFORE constructing path string. Updated create-log-folder/instructions.md with warning and corrected pattern.
**Date:** 2026-02-08
**Source:** review/ in FRD & SRD Documentation chain
```

---

## Format 5.1: Review Report Structure

**Source:** `actions/review/agent.md` lines 69-97

**When Produced:** After review/ action completes

**Exact Structure:**
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

**Required Fields:**
- Title: "Review Report: {scope}"
- Verdict (APPROVED | NEEDS_CHANGES)
- Score (percentage, 0-100)
- Summary (2-3 sentences)
- Findings table (columns: #, File, Line, Severity, Description, Suggestion)
- Fixes Applied table (optional, only if review-and-fix mode)
- Flags for Human table (optional)

**Parseable Pattern:**
```regex
^# Review Report: (.+)$
^## Verdict: (APPROVED|NEEDS_CHANGES)$
^## Score: (\d+)%$
^## Summary$
^(.+)$
^## Findings$
^\| # \| File \| Line \| Severity \| Description \| Suggestion \|$
^\| (\d+) \| (.+) \| (\d+) \| (critical|high|medium|low) \| (.+) \| (.+) \|$
```

**Dashboard Dependency:**
- **ReviewReportViewer component** - Renders review reports with syntax highlighting
- **FindingsTable component** - Sortable/filterable table of findings
- **SeverityBadge component** - Color-coded severity indicators
- **VerdictBanner component** - Shows APPROVED/NEEDS_CHANGES with score

**Example:** See Format 5.1 example in sample read from `phase2-pattern-detection_2026-02-08-20-30-50/review-report.md`

---

## Format 5.2: Analysis Report Structure

**Source:** `actions/analyze/agent.md` lines 85-88

**When Produced:** After analyze/ action completes

**Exact Structure:**
```markdown
# {Analysis Title}

**Aspect:** {aspect type}
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

**Required Fields:**
- Title (string)
- Metadata block: Aspect, Scope, Date, Agent
- Numbered sections (H2 headings)
- Tables with quantitative data
- Recommendations section at end

**Parseable Pattern:**
```regex
^# (.+)$
^\*\*Aspect:\*\* (coverage|dependencies|structure|drift|inventory|impact)$
^\*\*Scope:\*\* (.+)$
^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$
^\*\*Agent:\*\* analyze$
^## (\d+)\. (.+)$
^## Recommendations$
```

**Dashboard Dependency:**
- **AnalysisReportViewer component** - Renders analysis with collapsible sections
- **MetricsTable component** - Shows quantitative data in tables
- **RecommendationList component** - Displays actionable recommendations
- **ScopeFilter component** - Filters analyses by scope

**Example:** See Format 5.2 example in sample read from `frd-srd-structure_2026-02-08-18-31-58/report.md`

---

## Format 5.3: Brainstorm Session Transcript

**Source:** `actions/brainstorm/agent.md` lines 78-128

**When Produced:** After brainstorm/ action completes

**Exact Structure:**
```markdown
# Brainstorming Session: {idea}

## Idea
{Clear description of the idea}

## Classification
{Technical / Functional / Framework}

## Initial Context
{Summary of provided context}

## Session Transcript

### Question 1: {question}
**Human Response:** {response}

### Question 2: {question}
**Human Response:** {response}

... (continue for all questions and follow-ups)

## Key Insights
- {Insight 1}
- {Insight 2}
- {Insight 3}
...

## Potential Issues & Risks
- {Issue 1}: {description and impact}
- {Issue 2}: {description and impact}
...

## Suggested Next Steps
1. {Next step with clear action}
2. {Next step with clear action}
...

## Open Questions
- {Question that remains unanswered}
- {Question for future exploration}
...

## Session Metadata
- **Duration:** {How long was this session}
- **Depth:** {High-level / Deep exploration}
- **Consensus:** {Agreement reached on direction, or perspectives remain divided}
```

**Required Fields:**
- Title: "Brainstorming Session: {idea}"
- Sections: Idea, Classification, Initial Context, Session Transcript, Key Insights, Potential Issues & Risks, Suggested Next Steps, Open Questions, Session Metadata
- Session Transcript: H3 questions with "Human Response:" subsections
- Bullet lists for insights, issues, questions
- Numbered list for next steps

**Parseable Pattern:**
```regex
^# Brainstorming Session: (.+)$
^## Idea$
^(.+)$
^## Classification$
^(Technical|Functional|Framework)$
^## Session Transcript$
^### Question (\d+): (.+)$
^\*\*Human Response:\*\* (.+)$
^## Key Insights$
^- (.+)$
^## Suggested Next Steps$
^(\d+)\. (.+)$
```

**Dashboard Dependency:**
- **BrainstormViewer component** - Renders session with Q&A expansion
- **IdeaCard component** - Shows idea summary with classification badge
- **NextStepsChecklist component** - Converts next steps to actionable tasks
- **SessionMetadataBadge component** - Shows duration/depth/consensus

**Example:**
```markdown
# Brainstorming Session: Self-Evolving UI System

## Idea
Create a UI that learns from operator patterns and auto-generates buttons, shortcuts, and workflows based on detected usage patterns.

## Classification
Technical

## Initial Context
ActionFlows Dashboard already has pattern detection (Phase 2) with frequency tracking, sequence detection, and bookmark clustering. Current button system is static.

## Session Transcript

### Question 1: How should the system distinguish between one-off actions and patterns worth automating?
**Human Response:** Frequency + recency + consistency. If someone does the same thing 5+ times in a week, and it's not just a batch job, that's a candidate.

### Question 2: What's the risk of auto-generating a button that's wrong or confusing?
**Human Response:** Huge. Need confidence scoring and human approval before materialization. Show as "suggested" first.

## Key Insights
- Confidence scoring is critical (frequency × recency × consistency)
- Two-phase approach: suggest → approve → materialize
- Need pattern "cooling period" to avoid noise from short-term bursts

## Potential Issues & Risks
- False positives from batch operations: If someone processes 100 files in a session, don't suggest "Process file" button
- Button namespace pollution: Too many auto-generated buttons clutter UI
- Stale patterns: Usage changes, old buttons linger

## Suggested Next Steps
1. Design confidence scoring formula (review existing confidenceScorer.ts)
2. Create "Suggested Buttons" panel in dashboard
3. Add approval workflow (suggest → review → activate → archive)
4. Implement cooling period (7-day window before suggestion)

## Open Questions
- Should button suggestions expire if not approved within 30 days?
- How to handle conflicting patterns (same action, different contexts)?

## Session Metadata
- **Duration:** 45 minutes
- **Depth:** Deep exploration
- **Consensus:** Agreement on two-phase approach with confidence scoring
```

---

## Format 6.1: Error Announcement

**Source:** Not explicitly documented in ORCHESTRATOR.md, but referenced in `ErrorOccurredEvent` from shared types

**When Produced:** When an agent fails or an unexpected error occurs

**Exact Structure:**
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

**Required Fields:**
- Title: "Error: {title}"
- Step (number + action type)
- Message (error message)
- Context (what was happening)
- Recovery options (list)

**Parseable Pattern:**
```regex
^## Error: (.+)$
^\*\*Step:\*\* (\d+) — ([a-z-/]+)$
^\*\*Message:\*\* (.+)$
^\*\*Context:\*\* (.+)$
^\*\*Recovery options:\*\*$
^- (Retry|Skip|Cancel) (.+)$
```

**Dashboard Dependency:**
- **ErrorOccurredEvent** - WebSocket event type
- **ErrorModal component** - Shows error with recovery options
- **ErrorTimeline component** - Logs all errors in execution history
- **RetryButton component** - Triggers retry command

**Example:**
```markdown
## Error: Review agent failed

**Step:** 6 — review/
**Message:** TypeError: Cannot read property 'length' of undefined
**Context:** Analyzing findings table in patternAnalyzer.ts

Stack trace:
  at analyzeFindings (review-agent.ts:127)
  at executeReview (review-agent.ts:89)

**Recovery options:**
- Retry step 6
- Skip step 6
- Cancel chain
```

---

## Format 6.2: Department Routing Announcement

**Source:** `ORCHESTRATOR.md` lines 462-511 (Request Reception Protocol)

**When Produced:** When orchestrator routes a request to a department (internal, could be made visible)

**Exact Structure:**
```markdown
## Routing: {Request brief}

**Department:** {department name}
**Flow:** {flow-name/ | Composed from actions | No match}
**Actions:** {action list}

{Explanation of why this routing was chosen}
```

**Required Fields:**
- Title: "Routing: {request}"
- Department name
- Flow (flow name or "Composed from actions" or "No match")
- Actions (list of actions in chain)
- Explanation

**Parseable Pattern:**
```regex
^## Routing: (.+)$
^\*\*Department:\*\* (Framework|Engineering|QA|Human)$
^\*\*Flow:\*\* (.+)$
^\*\*Actions:\*\* (.+)$
^(.+)$
```

**Dashboard Dependency:**
- **RoutingTimeline component** - Shows routing decisions over time
- **DepartmentBadge component** - Color-coded department indicators
- **FlowSuggestion component** - Suggests flows based on past routing

**Example:**
```markdown
## Routing: Fix login bug

**Department:** Engineering
**Flow:** bug-triage/
**Actions:** analyze → code → test → review → commit

This request matches the "fix bug" trigger pattern. The bug-triage/ flow provides structured diagnosis and testing steps before committing the fix.
```

**Note:** This format is currently NOT produced by the orchestrator. Routing happens silently. Recommend adding this output for dashboard visibility and learning.

---

## Backend Parsing Status

### Currently Parsed (2 formats)

| Format | Parser Location | What's Extracted |
|--------|----------------|------------------|
| INDEX.md Entries | PatternAnalyzer → FrequencyTracker | Action sequences, pattern signatures, execution dates |
| Action Frequencies | FrequencyTracker service | Action usage counts, trends, timestamps |

### Not Yet Parsed (15 formats)

| Format | Gap Description | Priority |
|--------|----------------|----------|
| Chain Compilation Table | No parser for markdown table extraction | HIGH — Needed for ExecutionPlan model |
| Step Completion Announcements | No real-time message parsing | HIGH — Needed for live step updates |
| Dual Output | No parser for dual-format messages | MEDIUM — Second opinion integration |
| Human Gate Presentations | No standardized marker | LOW — Gates are user-driven |
| Learning Surface | No parser for learning format | MEDIUM — Aggregate learnings |
| Registry Updates | No WebSocket event emission | MEDIUM — Live registry updates |
| Review Reports | No structured parser | HIGH — Needed for FindingsTable |
| Analysis Reports | No structured parser | MEDIUM — Needed for MetricsTable |
| Brainstorm Transcripts | No parser | LOW — Read-only viewing sufficient |
| Error Announcements | Basic ErrorEvent exists but no format parsing | HIGH — Recovery UI needs structured data |
| Session-Start Protocol | No output produced by orchestrator | MEDIUM — Session metadata tracking |
| Chain Execution Start | No parser | MEDIUM — ExecutionStatus updates |
| Chain Status Update | No parser | MEDIUM — Progress tracking |
| Execution Complete | No parser | MEDIUM — Chain completion events |
| Department Routing | No output produced by orchestrator | LOW — Internal routing logic |

---

## Gap Analysis

### Structural Patterns Detected

**Well-Structured Formats (Easy to Parse):**
1. Chain Compilation Table — Fixed columns, clear delimiters
2. Step Completion Announcements — Consistent `>> Step N complete:` prefix
3. Registry Updates — Fixed 3-field structure
4. INDEX.md Entries — Pipe-delimited table rows
5. Review Reports — Markdown headers + tables

**Semi-Structured Formats (Moderate Difficulty):**
1. Dual Output — Multiple sections with keywords
2. Learning Surface — Fixed fields but variable content
3. Analysis Reports — Numbered sections, variable tables
4. Brainstorm Transcripts — Structured headings, variable Q&A depth

**Unstructured Formats (Hard to Parse):**
1. Human Gate Presentations — Free-form content
2. Error Announcements — Variable stack traces
3. Department Routing — Not yet produced by orchestrator

### Missing Real-Time Integration

**Key insight:** The backend currently **only parses logs post-execution**. There is **no real-time parsing** of orchestrator messages during chain execution.

**Why this matters:**
- Dashboard can't show live step progress
- No real-time error recovery UI
- Pattern detection runs after chains complete (not during)
- Human gates require manual watching, not UI prompts

**Recommendation:** Add a **message parser service** that intercepts orchestrator output and emits structured WebSocket events.

---

## Recommendations for Contract Spec

### 1. TypeScript Types + Zod Schemas

**Rationale:** ActionFlows already uses Zod for validation. Extend this pattern to orchestrator outputs.

**Example:**
```typescript
// packages/shared/src/orchestratorFormats.ts

export const StepCompletionSchema = z.object({
  stepNumber: z.number().int().positive(),
  actionType: z.string().regex(/^[a-z-]+\/$/),
  result: z.string().min(1),
  nextStep: z.union([z.number().int().positive(), z.literal('Done')]),
});

export type StepCompletion = z.infer<typeof StepCompletionSchema>;

// Parser
export function parseStepCompletion(message: string): StepCompletion | null {
  const match = message.match(/^>> Step (\d+) complete: ([a-z-/]+) -- (.+)\. Continuing to Step ((\d+)|Done)\.\.\.$/)
  if (!match) return null;
  return StepCompletionSchema.parse({
    stepNumber: parseInt(match[1]),
    actionType: match[2],
    result: match[3],
    nextStep: match[4] === 'Done' ? 'Done' : parseInt(match[4]),
  });
}
```

### 2. JSON Schema for Validation

**Rationale:** JSON Schema is language-agnostic and widely supported.

**Example:**
```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "Chain Compilation Table",
  "type": "object",
  "required": ["title", "request", "source", "steps", "execution"],
  "properties": {
    "title": { "type": "string" },
    "request": { "type": "string" },
    "source": { "type": "string" },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["number", "action", "model", "inputs", "waitsFor", "status"],
        "properties": {
          "number": { "type": "integer", "minimum": 1 },
          "action": { "type": "string", "pattern": "^[a-z-]+/$" },
          "model": { "enum": ["haiku", "sonnet", "opus"] },
          "inputs": { "type": "string" },
          "waitsFor": { "type": "string" },
          "status": { "enum": ["Pending", "Done", "Awaiting"] }
        }
      }
    },
    "execution": { "type": "string" }
  }
}
```

### 3. Regex Patterns Library

**Rationale:** Quick reference for pattern detection without full parsing.

**Example:**
```typescript
// packages/shared/src/orchestratorPatterns.ts

export const OrchestratorPatterns = {
  stepCompletion: /^>> Step (\d+) complete: ([a-z-/]+) -- (.+)\. Continuing to Step ((\d+)|Done)\.\.\.$/ ,
  chainCompilation: /^## Chain: (.+)$/,
  humanGate: /^### Step (\d+): HUMAN GATE$/,
  registryUpdate: /^## Registry Update: (.+)$/,
  learningsSurface: /^## Agent Learning$/,
  dualOutput: /^### Dual Output: ([a-z-/]+) \+ Second Opinion$/,
  verdict: /^## Verdict: (APPROVED|NEEDS_CHANGES)$/,
  score: /^## Score: (\d+)%$/,
} as const;
```

### 4. Contract Version Marker

**Rationale:** Allow orchestrator format to evolve without breaking dashboard.

**Example:**
```markdown
<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: {title}
...
```

Parser checks version and uses appropriate schema.

### 5. Structured Output Directive

**Rationale:** Orchestrator could be instructed to output in JSON when requested.

**Example (human input):**
```
--output-format json
Execute the chain: FRD & SRD Documentation
```

**Orchestrator response:**
```json
{
  "type": "ChainCompilation",
  "version": "1.0",
  "title": "FRD & SRD Documentation",
  "request": "Generate comprehensive FRD and SRD for ActionFlows Dashboard",
  "source": "Composed from: analyze + plan + code + review + commit",
  "steps": [
    { "number": 1, "action": "analyze/", "model": "sonnet", "inputs": "aspect=inventory, scope=packages/", "waitsFor": "--", "status": "Pending" },
    ...
  ],
  "execution": "Parallel: [1,2] -> [3] -> Parallel: [4,5] -> [6] -> [7]"
}
```

This would eliminate parsing ambiguity entirely.

---

## Appendix: Format Summary Table

| # | Format Name | Category | Structured? | Backend Parser? | Priority |
|---|-------------|----------|-------------|-----------------|----------|
| 1.1 | Chain Compilation Table | Chain Management | YES | NO | HIGH |
| 1.2 | Chain Execution Start | Chain Management | YES | NO | MEDIUM |
| 1.3 | Chain Status Update | Chain Management | YES | NO | MEDIUM |
| 1.4 | Execution Complete | Chain Management | YES | NO | MEDIUM |
| 2.1 | Step Completion Announcement | Step Lifecycle | YES | NO | HIGH |
| 2.2 | Dual Output | Step Lifecycle | SEMI | NO | MEDIUM |
| 2.3 | Second Opinion Skip | Step Lifecycle | YES | NO | MEDIUM |
| 3.1 | Human Gate Presentation | Human Interaction | NO | NO | LOW |
| 3.2 | Learning Surface | Human Interaction | YES | NO | MEDIUM |
| 3.3 | Session-Start Protocol | Human Interaction | NO OUTPUT | NO | MEDIUM |
| 4.1 | Registry Update | Registry & Metadata | YES | NO | MEDIUM |
| 4.2 | INDEX.md Entry | Registry & Metadata | YES | YES | N/A |
| 4.3 | LEARNINGS.md Entry | Registry & Metadata | YES | NO | MEDIUM |
| 5.1 | Review Report | Action Outputs | YES | NO | HIGH |
| 5.2 | Analysis Report | Action Outputs | SEMI | NO | MEDIUM |
| 5.3 | Brainstorm Transcript | Action Outputs | SEMI | NO | LOW |
| 6.1 | Error Announcement | Error & Status | SEMI | PARTIAL | HIGH |
| 6.2 | Department Routing | Error & Status | NO OUTPUT | NO | LOW |

**Total Formats:** 17 (2 parsed, 15 gaps)

---

## Conclusion

This audit identified **17 distinct formats** with **15 unaddressed parsing gaps**. The most critical gaps are:

1. **Chain Compilation Table** — Needed for ExecutionPlan model and live chain visualization
2. **Step Completion Announcements** — Needed for real-time progress tracking
3. **Review Reports** — Needed for FindingsTable and quality metrics
4. **Error Announcements** — Needed for recovery UI

**Next Steps:**
1. Create `packages/shared/src/orchestratorFormats.ts` with TypeScript types + Zod schemas
2. Create `packages/backend/src/services/orchestratorParser.ts` with parser service
3. Add WebSocket event emission for parsed formats
4. Update dashboard components to consume structured events
5. Add contract version marker to all orchestrator outputs
6. Consider JSON output mode for critical formats

---

**End of Audit Report**
