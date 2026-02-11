# ActionFlows Orchestrator Output Contract

**Version:** 1.0
**Last Updated:** 2026-02-09
**TypeScript Definitions:** `packages/shared/src/contract/`

**⚠️ ENFORCEMENT:** Adding or modifying formats in this contract MUST follow the evolution process in `docs/architecture/CONTRACT_EVOLUTION.md`. Formats without paired parser + frontend implementations create spec-without-implementation drift. See ORCHESTRATOR.md § CONTRACT_EVOLUTION.md Process Validation.

---

## Implementation Status Definitions

A format progresses through these states. **A format is COMPLETE only when all three layers are functional.**

| State | Spec | Parser | Frontend | Score |
|-------|------|--------|----------|-------|
| 📝 Planned | ✓ | ❌ | ❌ | 0% |
| 🚧 In Progress (Parser) | ✓ | ✓ | ❌ | 33% |
| 🚧 In Progress (Frontend) | ✓ | ✓ | 🚧 Created but not wired | 66% |
| ✅ Complete | ✓ | ✓ | ✓ Wired & tested | 100% |

**Terminology:**
- **Specified** — Format exists in this document with examples
- **Parsed** — Parser implemented, Zod schema exists, exports integrated
- **Consumed** — Frontend component exists, wired to dashboard, WebSocket connected
- **Complete = Specified + Parsed + Consumed** (all three required)

When agents or orchestrator refer to "implementing Format X", the target is 100% (Complete) unless explicitly scoped otherwise. Partial completions (33%/66%) MUST be surfaced as learnings to trigger follow-up chains.

---

## Cross-References

**Philosophy & System:** See `.claude/actionflows/docs/living/HARMONY.md`
**Evolution Process:** See `docs/architecture/CONTRACT_EVOLUTION.md`
**Code API Reference:** See `packages/shared/src/contract/README.md`
**Parser Priority:** See `packages/app/docs/PARSER_PRIORITY.md`

**Golden Rule:** If the dashboard PARSES it → contract-defined (sacred). If the dashboard READS it → not contract-defined (evolve freely).

---

## Orchestrator Output Formats

These formats are produced by the orchestrator. Examples are in ORCHESTRATOR.md.

### Category 1: Chain Management

#### Format 1.1: Chain Compilation Table (P0)
**TypeScript:** `ChainCompilationParsed`
**Parser:** `parseChainCompilation(text: string)`
**Pattern:** `/^## Chain: (.+)$/m`
**Example:** ORCHESTRATOR.md § Response Format Standard → Chain Compilation

**Required Fields:**
- Brief Title (string)
- Request (one-line string)
- Source (enum: flow name | "Composed from: ..." | "Meta-task")
- Table columns: #, Action, Model, Key Inputs, Waits For, Status
- Execution (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does"

---

#### Format 1.2: Chain Execution Start (P3)
**TypeScript:** `ExecutionStartParsed`
**Parser:** `parseExecutionStart(text: string)`
**Pattern:** `/^Spawning Step (\d+): (.+) \((.+)\)$/m`
**Example:** ORCHESTRATOR.md § Execution Start

**Required Fields:**
- Step number (integer)
- Action path (string, e.g., "code/backend/auth")
- Model (string, e.g., "opus", "sonnet")

---

#### Format 1.3: Chain Status Update (P4)
**TypeScript:** `ChainStatusUpdateParsed`
**Parser:** `parseChainStatusUpdate(text: string)`
**Pattern:** `/^## Chain Status: (.+)$/m`
**Example:** ORCHESTRATOR.md § Chain Status Update

**Required Fields:**
- Brief Title (string)
- Changes (description string)
- Updated table with columns: #, Action, Model, Key Inputs, Waits For, Status

---

#### Format 1.4: Execution Complete Summary (P4)
**TypeScript:** `ExecutionCompleteParsed`
**Parser:** `parseExecutionComplete(text: string)`
**Pattern:** `/^## Done: (.+)$/m`
**Example:** ORCHESTRATOR.md § Execution Complete

**Required Fields:**
- Brief Title (string)
- Table columns: #, Action, Status, Result
- Logs (path to log folder)
- Learnings (summary string)

---

### Category 2: Step Lifecycle

#### Format 2.1: Step Completion Announcement (P0)
**TypeScript:** `StepCompletionParsed`
**Parser:** `parseStepCompletion(text: string)`
**Pattern:** `/^>> Step (\d+) complete:/m`
**Example:** ORCHESTRATOR.md § Step Completion

**Required Fields:**
- >> (prefix marker)
- Step number (integer)
- Action path (string with trailing slash)
- One-line result (string)
- Next step number or "Done"

---

#### Format 2.2: Dual Output (Action + Second Opinion) (P2)
**TypeScript:** `DualOutputParsed`
**Parser:** `parseDualOutput(text: string)`
**Pattern:** `/^### Dual Output: (.+) \+ Second Opinion$/m`
**Example:** ORCHESTRATOR.md § Dual Output

**Required Fields:**
- Action name (string)
- Original verdict/score (from action)
- Second opinion summary (findings, missed issues, disagreements)
- Full report paths (original and critique)

---

#### Format 2.3: Second Opinion Skip (P4)
**TypeScript:** `SecondOpinionSkipParsed`
**Parser:** `parseSecondOpinionSkip(text: string)`
**Pattern:** `/^>> Step (\d+) complete: second-opinion\/ -- SKIPPED/m`
**Example:** ORCHESTRATOR.md § Second Opinion Skip

**Required Fields:**
- Step number (integer)
- Reason (string, in parentheses)

---

### Category 3: Human Interaction

#### Format 3.1: Human Gate Presentation (P5)
**TypeScript:** `HumanGateParsed`
**Parser:** `parseHumanGate(text: string)`
**Pattern:** `/### Step (\d+): HUMAN GATE/m`
**Example:** ORCHESTRATOR.md § Human Gate Presentation

**Required Fields:**
- Step number (integer)
- Free-form content (not strictly enforced)

**Note:** Human gates do NOT have standardized content format. Dashboard displays as read-only markdown.

---

#### Format 3.2: Learning Surface Presentation (P2)
**TypeScript:** `LearningSurfaceParsed`
**Parser:** `parseLearningSurface(text: string)`
**Pattern:** `/^## Agent Learning$/m`
**Example:** ORCHESTRATOR.md § Learning Surface

**Required Fields:**
- From (action/ and model)
- Issue (string)
- Root cause (string)
- Suggested fix (string)

---

#### Format 3.3: Session-Start Protocol Acknowledgment (P4)
**TypeScript:** `SessionStartProtocolParsed`
**Parser:** `parseSessionStartProtocol(text: string)`
**Pattern:** `/^## Session Started$/m`
**Example:** ORCHESTRATOR.md § Session Start

**Required Fields:**
- Loaded configuration summary (project, contexts, flows, actions, past executions)

**Note:** Currently NOT produced by orchestrator (internal read).

---

### Category 4: Registry & Metadata

#### Format 4.1: Registry Update (P2)
**TypeScript:** `RegistryUpdateParsed`
**Parser:** `parseRegistryUpdate(text: string)`
**Pattern:** `/^## Registry Update: (.+)$/m`
**Example:** ORCHESTRATOR.md § Registry Update

**Required Fields:**
- Brief Title (string)
- File (enum: INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md)
- Line (operation: added/removed/updated + the line content)

---

#### Format 4.2: INDEX.md Entry (P3)
**TypeScript:** `IndexEntryParsed`
**Parser:** `parseIndexEntry(text: string)`
**Pattern:** `/^\| (\d{4}-\d{2}-\d{2}) \|/m`
**Example:** ORCHESTRATOR.md § INDEX.md Entry

**Required Fields:**
- Date (YYYY-MM-DD)
- Description (brief work title)
- Pattern (chain signature, e.g., "code×8 → review → commit")
- Outcome (status + metrics + commit hash)

---

#### Format 4.3: LEARNINGS.md Entry (P4)
**TypeScript:** `LearningEntryParsed`
**Parser:** `parseLearningEntry(text: string)`
**Pattern:** `/^### (.+)$/m` (followed by `#### {Issue Title}`)
**Example:** ORCHESTRATOR.md § LEARNINGS.md Entry

**Required Fields:**
- Action Type (string, e.g., "code/", "review/")
- Issue Title (string)
- Context (when this happens)
- Problem (what goes wrong)
- Root Cause (why it fails)
- Solution (how to prevent)
- Date (YYYY-MM-DD)
- Source (action/ in chain description)

---

### Category 6: Error & Status

#### Format 6.1: Error Announcement (P1)
**TypeScript:** `ErrorAnnouncementParsed`
**Parser:** `parseErrorAnnouncement(text: string)`
**Pattern:** `/^## Error: (.+)$/m`
**Example:** ORCHESTRATOR.md § Error Announcement

**Required Fields:**
- Error title (string)
- Step (step number and action/)
- Message (error message)
- Context (what was being attempted)
- Stack trace or details (optional)
- Recovery options (list: Retry, Skip, Cancel)

---

#### Format 6.2: Department Routing Announcement (P5)
**TypeScript:** `DepartmentRoutingParsed`
**Parser:** `parseDepartmentRouting(text: string)`
**Pattern:** `/^## Routing: (.+)$/m`
**Example:** ORCHESTRATOR.md § Context Routing

**Required Fields:**
- Request brief (string)
- Context (enum: work | maintenance | explore | review | settings | pm | archive | harmony | editor)
- Flow (flow name or "Composed from actions" or "No match")
- Actions (list of actions)
- Explanation (why this routing)

**Note:** Currently NOT produced by orchestrator (internal routing). Legacy name "Department" will be renamed to "Context" in future contract version.

---

## Agent Output Formats

These formats are produced by agents. Full specifications included because agents need them.

### Category 5: Action Outputs

#### Format 5.1: Review Report Structure (P1)
**Producer:** review/ action
**TypeScript:** `ReviewReportParsed`
**Parser:** `parseReviewReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, review/agent.md

**Required Structure:**
```markdown
# Review Report: {scope}

## Verdict: {APPROVED | NEEDS_CHANGES}
## Score: {X}%

## Summary
{2-3 sentence overview}

## Findings
| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|

## Fixes Applied (if mode = review-and-fix)
| File | Fix |

## Flags for Human
| Issue | Why Human Needed |
```

**Field Descriptions:**
- **Verdict:** Enum (`APPROVED` | `NEEDS_CHANGES`) — Must be exact string
- **Score:** Integer 0-100 — Quality percentage
- **Summary:** 2-3 sentences — High-level overview of findings
- **Findings:** Table with 6 columns (can be empty if no findings)
  - **#:** Finding number (integer)
  - **File:** Relative path from project root
  - **Line:** Line number or range (e.g., "42" or "42-45")
  - **Severity:** Enum (`critical` | `high` | `medium` | `low`) — Lowercase
  - **Description:** What the issue is
  - **Suggestion:** How to fix it
- **Fixes Applied:** Table (only if mode = review-and-fix)
  - **File:** Relative path
  - **Fix:** What was changed
- **Flags for Human:** Table (only if issues need human judgment)
  - **Issue:** What needs human decision
  - **Why Human Needed:** Reason for escalation

**Dashboard Usage:**
- `ReviewReportViewer` component displays full report
- `FindingsTable` component renders findings with severity badges
- `VerdictBanner` component shows APPROVED/NEEDS_CHANGES with score

**Validation:** Harmony detector validates Verdict enum, Score range (0-100), required sections present

---

#### Format 5.2: Analysis Report Structure (P3)
**Producer:** analyze/ action
**TypeScript:** `AnalysisReportParsed`
**Parser:** `parseAnalysisReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, analyze/agent.md

**Required Structure:**
```markdown
# {Analysis Title}

**Aspect:** {what aspect is being analyzed}
**Scope:** {what is being analyzed}
**Date:** {YYYY-MM-DD}
**Agent:** analyze/

---

## 1. {First Analysis Section}
{Content}

## 2. {Second Analysis Section}
{Content}

[... additional numbered sections ...]

---

## Recommendations
{Actionable next steps}
```

**Field Descriptions:**
- **Title:** Markdown H1 heading
- **Aspect:** What aspect is being analyzed (e.g., "Contract duplication", "Security vulnerabilities")
- **Scope:** What is being analyzed (e.g., "CONTRACT.md", "Authentication system")
- **Date:** Analysis date (YYYY-MM-DD format)
- **Agent:** Always "analyze/"
- **Numbered Sections:** At least 1 section, numbered with ##
- **Recommendations:** Actionable next steps section

**Dashboard Usage:**
- `AnalysisReportViewer` component displays full report
- `MetricsDisplay` component extracts and visualizes metrics (if present)

---

#### Format 5.3: Brainstorm Session Transcript (P5)
**Producer:** brainstorm/ action
**TypeScript:** `BrainstormTranscriptParsed`
**Parser:** `parseBrainstormTranscript(text: string)`
**Referenced By:** agent-standards § Contract Compliance, brainstorm/agent.md

**Note:** This format is **recommended but not strictly enforced**. Dashboard displays brainstorm transcripts as read-only markdown.

**Recommended Structure:**
```markdown
# Brainstorm: {Idea Title}

**Classification:** {category}
**Date:** {YYYY-MM-DD}

## Initial Context
{What prompted this brainstorm}

## Transcript
{Question-answer style conversation}

## Key Insights
{Bullet points of main discoveries}

## Issues & Risks
{Potential problems identified}

## Next Steps
{Actionable follow-up tasks}

## Open Questions
{Unresolved questions}

## Metadata
- Duration: {minutes}
- Participants: Human + Agent
```

**Dashboard Usage:**
- `BrainstormViewer` component displays as read-only markdown
- No parsing required (free-form content)

---

## Validation

Run contract validation:
```bash
pnpm run harmony:check
```

See `packages/shared/src/contract/README.md` for manual testing examples.

---

**End of Contract**
