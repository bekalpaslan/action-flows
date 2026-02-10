# Specification Layer Audit — Orchestrator Output Formats

**Aspect:** Specification/contract documentation layer (Layer 3 of backwards harmony audit)
**Scope:** .claude/actionflows/ documentation — CONTRACT.md and successor documents
**Date:** 2026-02-09
**Agent:** analyze/

---

## Executive Summary

CONTRACT.md was **reorganized on 2026-02-09**, not fully dissolved. Content was extracted to 4 new docs while CONTRACT.md remains as a **lean type specification** (reduced from 742 → 412 lines, 45% reduction).

**Key Findings:**
1. **17 orchestrator/agent output formats** specified across 6 categories
2. **CONTRACT.md remains** as canonical type specification
3. **4 new docs created** for philosophy, evolution, code reference, and parser priority
4. **All formats have complete specifications:** TypeScript type, parser function, regex pattern, required fields
5. **3 agent output formats** (review, analyze, brainstorm) have full markdown templates in CONTRACT.md
6. **12 orchestrator formats** reference ORCHESTRATOR.md for examples (type specs only in CONTRACT.md)
7. **2 formats marked "FUTURE"** (Session-Start Protocol, Department Routing) — not yet implemented

---

## Part 1: CONTRACT.md Successors (The "Dissolution")

### Finding 1.1: CONTRACT.md Was Reorganized, Not Dissolved

**What happened:**
- **2026-02-09:** Plan to "dissolve" CONTRACT.md created
- **Implementation:** Content extracted to 4 new docs, CONTRACT.md retained as lean spec
- **Result:** CONTRACT.md reduced from 742 → 412 lines (45% reduction)

**New files created:**
| File | Purpose | Lines | Source |
|------|---------|-------|--------|
| `.claude/actionflows/docs/HARMONY_SYSTEM.md` | Philosophy & 4-component system map | 57 | CONTRACT.md lines 48-76 |
| `.claude/actionflows/docs/CONTRACT_EVOLUTION.md` | Process for adding/modifying formats | 153 | CONTRACT.md lines 29-43, 673-700 |
| `packages/shared/src/contract/README.md` | TypeScript API reference & manual testing | 327 | CONTRACT.md lines 646-738 |
| `packages/app/docs/PARSER_PRIORITY.md` | Frontend parser implementation tracking | 173 | CONTRACT.md lines 82-93 + status |

**CONTRACT.md retained content:**
- Version header & cross-references
- All 17 format type specifications (TypeScript type, parser, pattern, required fields)
- Agent output formats (5.1-5.3) with full markdown templates
- Orchestrator formats (1.1-4.3, 6.1-6.2) as lean type specs referencing ORCHESTRATOR.md

---

### Finding 1.2: Harmony System Documentation Now Distributed

**4-component Framework Harmony System:**

| Component | Location | Purpose |
|-----------|----------|---------|
| **1. Orchestrator Contract** | `.claude/actionflows/CONTRACT.md` | Formal specification of all output formats |
| **2. Onboarding Questionnaire** | `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md` | Interactive teaching |
| **3. Harmony Detection** | `packages/backend/src/services/harmonyDetector.ts` | Automated drift monitoring |
| **4. Philosophy Documentation** | `.claude/actionflows/docs/HARMONY_SYSTEM.md` | Cross-reference map |

**Cross-references established:**
- CONTRACT.md header → links to all 4 new docs
- ORCHESTRATOR.md § Contract & Harmony → links to HARMONY_SYSTEM.md
- agent-standards § Contract Compliance → links to CONTRACT.md
- All agent.md files → link to their specific format (5.1, 5.2, 5.3)

---

## Part 2: Complete Format Catalog (17 Formats)

### Category 1: Chain Management (4 formats)

#### Format 1.1: Chain Compilation Table (P0)
**Location:** CONTRACT.md lines 26-39, ORCHESTRATOR.md lines 347-367
**TypeScript:** `ChainCompilationParsed`
**Parser:** `parseChainCompilation(text: string)`
**Pattern:** `/^## Chain: (.+)$/m`
**Priority:** **P0 — CRITICAL** (core dashboard functionality)

**Required Fields:**
- Brief Title (string)
- Request (one-line string)
- Source (enum: flow name | "Composed from: ..." | "Meta-task")
- Table columns: #, Action, Model, Key Inputs, Waits For, Status
- Execution (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does"

**Specification Status:** ✅ Complete
**Parser Status:** ✅ Implemented (`packages/shared/src/contract/parsers/parseChainCompilation.ts`)
**Dashboard Usage:** ChainVisualization, ChainTable, ProgressTracker components
**Conflicting Specs:** None detected

---

#### Format 1.2: Chain Execution Start (P3)
**Location:** CONTRACT.md lines 43-52, ORCHESTRATOR.md lines 369-375
**TypeScript:** `ExecutionStartParsed`
**Parser:** `parseExecutionStart(text: string)`
**Pattern:** `/^Spawning Step (\d+): (.+) \((.+)\)$/m`
**Priority:** P3 (status updates)

**Required Fields:**
- Step number (integer)
- Action path (string, e.g., "code/backend/auth")
- Model (string, e.g., "opus", "sonnet")

**Specification Status:** ✅ Complete
**Parser Status:** ✅ Implemented
**Dashboard Usage:** ExecutionTimeline, StartTimestamp components
**Conflicting Specs:** None detected

---

#### Format 1.3: Chain Status Update (P4)
**Location:** CONTRACT.md lines 56-65, ORCHESTRATOR.md lines 383-396
**TypeScript:** `ChainStatusUpdateParsed`
**Parser:** `parseChainStatusUpdate(text: string)`
**Pattern:** `/^## Chain Status: (.+)$/m`
**Priority:** P4 (progress tracking)

**Required Fields:**
- Brief Title (string)
- Changes (description string)
- Updated table with columns: #, Action, Model, Key Inputs, Waits For, Status

**Specification Status:** ✅ Complete
**Parser Status:** ✅ Implemented
**Dashboard Usage:** MidChainProgressUpdate component
**Conflicting Specs:** None detected

---

#### Format 1.4: Execution Complete Summary (P4)
**Location:** CONTRACT.md lines 69-79, ORCHESTRATOR.md lines 398-409
**TypeScript:** `ExecutionCompleteParsed`
**Parser:** `parseExecutionComplete(text: string)`
**Pattern:** `/^## Done: (.+)$/m`
**Priority:** P4 (completion tracking)

**Required Fields:**
- Brief Title (string)
- Table columns: #, Action, Status, Result
- Logs (path to log folder)
- Learnings (summary string)

**Specification Status:** ✅ Complete
**Parser Status:** ✅ Implemented
**Dashboard Usage:** SummaryCard, LogsLinkButton components
**Conflicting Specs:** None detected

---

### Category 2: Step Lifecycle (3 formats)

#### Format 2.1: Step Completion Announcement (P0)
**Location:** CONTRACT.md lines 84-95, ORCHESTRATOR.md line 380
**TypeScript:** `StepCompletionParsed`
**Parser:** `parseStepCompletion(text: string)`
**Pattern:** `/^>> Step (\d+) complete:/m`
**Priority:** **P0 — CRITICAL** (core functionality)

**Required Fields:**
- >> (prefix marker)
- Step number (integer)
- Action path (string with trailing slash)
- One-line result (string)
- Next step number or "Done"

**Specification Status:** ✅ Complete
**Parser Status:** ✅ Implemented
**Dashboard Usage:** StepProgressBar, ExecutionLog components
**Conflicting Specs:** None detected

---

#### Format 2.2: Dual Output (Action + Second Opinion) (P2)
**Location:** CONTRACT.md lines 99-110, ORCHESTRATOR.md lines 247-263
**TypeScript:** `DualOutputParsed`
**Parser:** `parseDualOutput(text: string)`
**Pattern:** `/^### Dual Output: (.+) \+ Second Opinion$/m`
**Priority:** P2 (second-opinion integration)

**Required Fields:**
- Action name (string)
- Original verdict/score (from action)
- Second opinion summary (findings, missed issues, disagreements)
- Full report paths (original and critique)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO (per PARSER_PRIORITY.md)
**Dashboard Usage:** DualOutputViewer, ComparisonPanel components (planned)
**Conflicting Specs:** None detected
**Note:** Example embedded in ORCHESTRATOR.md § Second Opinion Protocol, not standalone format section

---

#### Format 2.3: Second Opinion Skip (P4)
**Location:** CONTRACT.md lines 114-122, ORCHESTRATOR.md lines 265-272
**TypeScript:** `SecondOpinionSkipParsed`
**Parser:** `parseSecondOpinionSkip(text: string)`
**Pattern:** `/^>> Step (\d+) complete: second-opinion\/ -- SKIPPED/m`
**Priority:** P4 (second-opinion flow)

**Required Fields:**
- Step number (integer)
- Reason (string, in parentheses)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO
**Dashboard Usage:** SkipNotification component (planned)
**Conflicting Specs:** None detected

---

### Category 3: Human Interaction (3 formats)

#### Format 3.1: Human Gate Presentation (P5)
**Location:** CONTRACT.md lines 127-139, ORCHESTRATOR.md lines 528-554
**TypeScript:** `HumanGateParsed` (type exists, but parsing not required)
**Parser:** N/A (free-form content)
**Pattern:** `/### Step (\d+): HUMAN GATE/m`
**Priority:** P5 (no standardized format)

**Required Fields:**
- Step number (integer)
- Free-form content (not strictly enforced)

**Specification Status:** ✅ Complete (marked as free-form)
**Parser Status:** ❌ Not needed (dashboard displays as read-only markdown)
**Dashboard Usage:** HumanGateDisplay component (read-only markdown)
**Conflicting Specs:** None (explicitly NOT standardized)
**Note:** CONTRACT.md states "Human gates do NOT have standardized content format"

---

#### Format 3.2: Learning Surface Presentation (P2)
**Location:** CONTRACT.md lines 143-153, ORCHESTRATOR.md lines 411-423
**TypeScript:** `LearningSurfaceParsed`
**Parser:** `parseLearningSurface(text: string)`
**Pattern:** `/^## Agent Learning$/m`
**Priority:** P2 (agent feedback loop)

**Required Fields:**
- From (action/ and model)
- Issue (string)
- Root cause (string)
- Suggested fix (string)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO
**Dashboard Usage:** LearningsCard, ApprovalDialog components (planned)
**Conflicting Specs:** None detected

---

#### Format 3.3: Session-Start Protocol Acknowledgment (P4)
**Location:** CONTRACT.md lines 157-164
**TypeScript:** `SessionStartProtocolParsed`
**Parser:** `parseSessionStartProtocol(text: string)`
**Pattern:** `/^## Session Started$/m`
**Priority:** P4 (session metadata)

**Required Fields:**
- Loaded configuration summary (project, contexts, flows, actions, past executions)

**Specification Status:** ✅ Complete
**Parser Status:** ❌ FUTURE (not yet produced by orchestrator)
**Dashboard Usage:** SessionMetadataPanel component (planned)
**Conflicting Specs:** None detected
**Note:** CONTRACT.md line 164 states "Currently NOT produced by orchestrator (internal read)"

---

### Category 4: Registry & Metadata (3 formats)

#### Format 4.1: Registry Update (P2)
**Location:** CONTRACT.md lines 170-180, ORCHESTRATOR.md lines 425-434
**TypeScript:** `RegistryUpdateParsed`
**Parser:** `parseRegistryUpdate(text: string)`
**Pattern:** `/^## Registry Update: (.+)$/m`
**Priority:** P2 (live registry updates)

**Required Fields:**
- Brief Title (string)
- File (enum: INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md)
- Line (operation: added/removed/updated + the line content)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO
**Dashboard Usage:** RegistryLiveView, FileChangeIndicator components (planned)
**Conflicting Specs:** None detected

---

#### Format 4.2: INDEX.md Entry (P3)
**Location:** CONTRACT.md lines 184-194, ORCHESTRATOR.md lines 474-494
**TypeScript:** `IndexEntryParsed`
**Parser:** `parseIndexEntry(text: string)`
**Pattern:** `/^\| (\d{4}-\d{2}-\d{2}) \|/m`
**Priority:** P3 (historical data)

**Required Fields:**
- Date (YYYY-MM-DD)
- Description (brief work title)
- Pattern (chain signature, e.g., "code×8 → review → commit")
- Outcome (status + metrics + commit hash)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO
**Dashboard Usage:** ExecutionHistory, PastChainsTable components (planned)
**Conflicting Specs:** None detected

---

#### Format 4.3: LEARNINGS.md Entry (P4)
**Location:** CONTRACT.md lines 198-212, ORCHESTRATOR.md lines 496-526
**TypeScript:** `LearningEntryParsed`
**Parser:** `parseLearningEntry(text: string)`
**Pattern:** `/^### (.+)$/m` (followed by `#### {Issue Title}`)
**Priority:** P4 (historical learnings)

**Required Fields:**
- Action Type (string, e.g., "code/", "review/")
- Issue Title (string)
- Context (when this happens)
- Problem (what goes wrong)
- Root Cause (why it fails)
- Solution (how to prevent)
- Date (YYYY-MM-DD)
- Source (action/ in chain description)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO
**Dashboard Usage:** PastLearningsViewer component (planned)
**Conflicting Specs:** None detected

---

### Category 5: Action Outputs (3 formats — AGENT OUTPUTS)

#### Format 5.1: Review Report Structure (P1)
**Location:** CONTRACT.md lines 256-307 (full markdown template)
**Producer:** review/ action
**TypeScript:** `ReviewReportParsed`
**Parser:** `parseReviewReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, review/agent.md
**Priority:** **P1 — HIGH VALUE** (quality metrics)

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
- **Flags for Human:** Table (only if issues need human judgment)

**Specification Status:** ✅ Complete (full markdown template in CONTRACT.md)
**Parser Status:** ✅ Implemented
**Dashboard Usage:** ReviewReportViewer, FindingsTable, VerdictBanner components
**Conflicting Specs:** None detected
**Validation:** Harmony detector validates Verdict enum, Score range (0-100), required sections

---

#### Format 5.2: Analysis Report Structure (P3)
**Location:** CONTRACT.md lines 310-353 (full markdown template)
**Producer:** analyze/ action
**TypeScript:** `AnalysisReportParsed`
**Parser:** `parseAnalysisReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, analyze/agent.md
**Priority:** P3 (metrics display)

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

**Specification Status:** ✅ Complete (full markdown template in CONTRACT.md)
**Parser Status:** ✅ Implemented
**Dashboard Usage:** AnalysisReportViewer, MetricsDisplay components
**Conflicting Specs:** None detected

---

#### Format 5.3: Brainstorm Session Transcript (P5)
**Location:** CONTRACT.md lines 356-396 (recommended structure)
**Producer:** brainstorm/ action
**TypeScript:** `BrainstormTranscriptParsed`
**Parser:** `parseBrainstormTranscript(text: string)`
**Referenced By:** agent-standards § Contract Compliance, brainstorm/agent.md
**Priority:** P5 (read-only viewing)

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

**Specification Status:** ✅ Complete (marked as recommended, not enforced)
**Parser Status:** ✅ Implemented (but parsing not strictly required)
**Dashboard Usage:** BrainstormViewer component (read-only markdown display)
**Conflicting Specs:** None detected

---

### Category 6: Error & Status (2 formats)

#### Format 6.1: Error Announcement (P1)
**Location:** CONTRACT.md lines 217-230, ORCHESTRATOR.md lines 436-472
**TypeScript:** `ErrorAnnouncementParsed`
**Parser:** `parseErrorAnnouncement(text: string)`
**Pattern:** `/^## Error: (.+)$/m`
**Priority:** **P1 — HIGH VALUE** (error recovery UI)

**Required Fields:**
- Error title (string)
- Step (step number and action/)
- Message (error message)
- Context (what was being attempted)
- Stack trace or details (optional)
- Recovery options (list: Retry, Skip, Cancel)

**Specification Status:** ✅ Complete
**Parser Status:** ⚠️ TODO (high priority for error recovery UX)
**Dashboard Usage:** ErrorModal, RecoveryOptionsPanel components (planned)
**Conflicting Specs:** None detected

---

#### Format 6.2: Department Routing Announcement (P5)
**Location:** CONTRACT.md lines 234-246
**TypeScript:** `DepartmentRoutingParsed`
**Parser:** `parseDepartmentRouting(text: string)`
**Pattern:** `/^## Routing: (.+)$/m`
**Priority:** P5 (internal, not user-facing)

**Required Fields:**
- Request brief (string)
- Context (enum: work | maintenance | explore | review | settings | pm | archive | harmony | editor)
- Flow (flow name or "Composed from actions" or "No match")
- Actions (list of actions)
- Explanation (why this routing)

**Specification Status:** ✅ Complete
**Parser Status:** ❌ FUTURE (not yet produced by orchestrator)
**Dashboard Usage:** RoutingIndicator component (planned)
**Conflicting Specs:** None detected
**Note:** CONTRACT.md line 246 states "Currently NOT produced by orchestrator (internal routing). Legacy name 'Department' will be renamed to 'Context' in future contract version."

---

## Part 3: ORCHESTRATOR.md Response Format Standard

### Finding 3.1: ORCHESTRATOR.md Contains 11 Format Examples

**Location:** ORCHESTRATOR.md lines 344-557 (§ Response Format Standard)

**Formats documented with examples:**
1. ✅ Chain Compilation (lines 347-367) → Format 1.1
2. ✅ Execution Start (lines 369-375) → Format 1.2
3. ✅ Step Completion (line 380) → Format 2.1
4. ✅ Chain Status Update (lines 383-396) → Format 1.3
5. ✅ Execution Complete (lines 398-409) → Format 1.4
6. ✅ Learning Surface (lines 411-423) → Format 3.2
7. ✅ Registry Update (lines 425-434) → Format 4.1
8. ✅ Error Announcement (lines 436-472) → Format 6.1
9. ✅ INDEX.md Entry (lines 474-494) → Format 4.2
10. ✅ LEARNINGS.md Entry (lines 496-526) → Format 4.3
11. ✅ Human Gate Presentation (lines 528-554) → Format 3.1

**Formats documented elsewhere in ORCHESTRATOR.md:**
- Format 2.2: Dual Output (lines 247-263) — embedded in § Second Opinion Protocol
- Format 2.3: Second Opinion Skip (lines 265-272) — embedded in § Second Opinion Protocol

**Missing from ORCHESTRATOR.md:**
- Format 1.2: Chain Execution Start — Wait, this IS in ORCHESTRATOR.md (line 369-375)
- None! All orchestrator-produced formats have examples

**Agent output formats (NOT in ORCHESTRATOR.md):**
- Format 5.1: Review Report Structure — specified in CONTRACT.md
- Format 5.2: Analysis Report Structure — specified in CONTRACT.md
- Format 5.3: Brainstorm Session Transcript — specified in CONTRACT.md

---

### Finding 3.2: Contract Version Tracking

**Current Version:** 1.0
**Last Updated:** 2026-02-09 (per CONTRACT.md header)
**TypeScript Definitions:** `packages/shared/src/contract/`

**Version history:**
- 1.0 (2026-02-09): Initial versioned release after dissolution/reorganization

**Breaking changes process:** Documented in CONTRACT_EVOLUTION.md
- Minor (non-breaking): 1.0 → 1.1 (add optional field, expand enum)
- Major (breaking): 1.0 → 2.0 (remove field, change required structure)
- Migration window: Minimum 90 days

---

## Part 4: Actions Producing Contract Output

### Finding 4.1: Which Actions Reference Contract Formats?

**Actions with explicit contract compliance:**

| Action | Contract Format | Reference Location |
|--------|----------------|-------------------|
| **review/** | Format 5.1: Review Report Structure | review/agent.md lines 23-42 |
| **analyze/** | Format 5.2: Analysis Report Structure | analyze/agent.md lines 24-39 |
| **brainstorm/** | Format 5.3: Brainstorm Session Transcript | brainstorm/agent.md lines 23-34 |

**Orchestrator produces (not action-specific):**
- Formats 1.1-1.4 (Chain Management)
- Formats 2.1-2.3 (Step Lifecycle)
- Formats 3.1-3.3 (Human Interaction)
- Formats 4.1-4.3 (Registry & Metadata)
- Formats 6.1-6.2 (Error & Status)

---

### Finding 4.2: agent-standards § Contract Compliance

**Location:** `.claude/actionflows/actions/_abstract/agent-standards/instructions.md` lines 48-80

**Content:**
- References CONTRACT.md format specifications
- Lists contract-defined actions (review, analyze, brainstorm)
- Notes harmony detection validation
- Provides validation command: `pnpm run harmony:check`
- Clarifies "Not contract-defined": Agent learnings, internal notes, working files

**Cross-references:**
- review/ → CONTRACT.md § Format 5.1
- analyze/ → CONTRACT.md § Format 5.2
- brainstorm/ → CONTRACT.md § Format 5.3

---

## Part 5: Conflicting Specifications

### Finding 5.1: No Conflicting Format Specifications Detected

**Validated:**
- All 17 formats have consistent specifications between CONTRACT.md and ORCHESTRATOR.md
- TypeScript type names match across all references
- Parser function names consistent
- Required fields lists identical
- Regex patterns consistent

**Minor inconsistencies (non-conflicting):**
1. Cross-reference naming style (e.g., "§ Response Format Standard → Chain Compilation" vs "### 1. Chain Compilation")
2. Format 2.2 and 2.3 embedded in § Second Opinion Protocol rather than standalone format sections

**Reviewed:** CONTRACT.md dissolution review report (2026-02-09) found **Verdict: APPROVED, Score: 95%**, confirming specification integrity

---

### Finding 5.2: Formats Specified But No Corresponding Parser

**Per PARSER_PRIORITY.md:**

| Format | Parser Status | Dashboard Component Status |
|--------|--------------|---------------------------|
| 2.2: Dual Output | ⚠️ TODO | DualOutputViewer, ComparisonPanel (planned) |
| 2.3: Second Opinion Skip | ⚠️ TODO | SkipNotification (planned) |
| 3.2: Learning Surface | ⚠️ TODO | LearningsCard, ApprovalDialog (planned) |
| 4.1: Registry Update | ⚠️ TODO | RegistryLiveView, FileChangeIndicator (planned) |
| 4.2: INDEX.md Entry | ⚠️ TODO | ExecutionHistory, PastChainsTable (planned) |
| 4.3: LEARNINGS.md Entry | ⚠️ TODO | PastLearningsViewer (planned) |
| 6.1: Error Announcement | ⚠️ TODO (high priority) | ErrorModal, RecoveryOptionsPanel (planned) |

**Implemented parsers:**
- ✅ 1.1: Chain Compilation Table
- ✅ 1.2: Chain Execution Start
- ✅ 1.3: Chain Status Update
- ✅ 1.4: Execution Complete Summary
- ✅ 2.1: Step Completion Announcement
- ✅ 5.1: Review Report Structure
- ✅ 5.2: Analysis Report Structure
- ✅ 5.3: Brainstorm Session Transcript

**Not needed (free-form or future):**
- 3.1: Human Gate Presentation (no parser needed, read-only markdown)
- 3.3: Session-Start Protocol (FUTURE — not yet produced)
- 6.2: Department Routing (FUTURE — not yet produced)

---

## Part 6: Version Markers, Migration Notes, Deprecation

### Finding 6.1: No Deprecated Formats

**Current version:** 1.0 (all formats active)
**Deprecated formats:** None
**Migration notes:** None (no prior versions)

**Version markers:**
- CONTRACT.md header: "**Version:** 1.0"
- CONTRACT.md header: "**Last Updated:** 2026-02-09"

---

### Finding 6.2: Future/Placeholder Formats

**Formats marked "FUTURE" or "not yet produced":**

| Format | Status | Note Location |
|--------|--------|--------------|
| 3.3: Session-Start Protocol Acknowledgment | FUTURE (not yet produced) | CONTRACT.md line 164 |
| 6.2: Department Routing Announcement | FUTURE (internal routing) | CONTRACT.md line 246 |

**Legacy naming noted:**
- Format 6.2: "Legacy name 'Department' will be renamed to 'Context' in future contract version" (CONTRACT.md line 246)

---

## Part 7: Action Discovery

### Finding 7.1: Contract Output Actions

**Actions listing "Contract Output: YES":**
- None found with explicit "Contract Output: YES" metadata
- However, 3 actions explicitly reference contract formats in their agent.md:
  - review/
  - analyze/
  - brainstorm/

**Format numbers referenced by actions:**
- review/agent.md → Format 5.1
- analyze/agent.md → Format 5.2
- brainstorm/agent.md → Format 5.3

---

## Recommendations

### 1. Parser Implementation Priority (Immediate)
**Critical for error recovery:**
- Implement Format 6.1 parser (`parseErrorAnnouncement`) — P1 priority
- Build ErrorModal and RecoveryOptionsPanel components
- Test error recovery flow end-to-end

### 2. Second-Opinion Integration (Short-Term)
**Enhance quality assurance:**
- Implement Format 2.2 parser (`parseDualOutput`) — P2 priority
- Implement Format 2.3 parser (`parseSecondOpinionSkip`) — P4 priority
- Build DualOutputViewer and ComparisonPanel components
- Consider promoting Dual Output and Second Opinion Skip to standalone format sections in ORCHESTRATOR.md Response Format Standard

### 3. Learning Surface Integration (Short-Term)
**Enable agent feedback loop:**
- Implement Format 3.2 parser (`parseLearningSurface`) — P2 priority
- Build LearningsCard and ApprovalDialog components
- Test learning approval → LEARNINGS.md write flow

### 4. Registry Live Updates (Mid-Term)
**Real-time dashboard updates:**
- Implement Format 4.1 parser (`parseRegistryUpdate`) — P2 priority
- Build RegistryLiveView and FileChangeIndicator components
- Test WebSocket broadcasting of registry changes

### 5. Historical Data Tracking (Mid-Term)
**Past execution visibility:**
- Implement Format 4.2 parser (`parseIndexEntry`) — P3 priority
- Implement Format 4.3 parser (`parseLearningEntry`) — P4 priority
- Build ExecutionHistory, PastChainsTable, PastLearningsViewer components

### 6. Cross-Reference Standardization (Low Priority)
**Consistency improvement:**
- Standardize CONTRACT.md cross-reference notation (either "§ Response Format Standard → Chain Compilation" OR "§ 1. Chain Compilation")
- Consider adding standalone format sections for Dual Output and Second Opinion Skip in ORCHESTRATOR.md

### 7. Legacy Naming Update (Future)
**Format 6.2: Department Routing Announcement**
- Rename "Department" to "Context" when implemented (aligns with 2026-02-09 context-native routing design)

---

## Summary Table: All 17 Formats

| # | Format Name | Priority | Spec Status | Parser Status | Dashboard Status | Notes |
|---|-------------|----------|-------------|---------------|------------------|-------|
| 1.1 | Chain Compilation Table | P0 | ✅ Complete | ✅ Implemented | ✅ Implemented | Critical core functionality |
| 1.2 | Chain Execution Start | P3 | ✅ Complete | ✅ Implemented | ✅ Implemented | Status updates |
| 1.3 | Chain Status Update | P4 | ✅ Complete | ✅ Implemented | ✅ Implemented | Progress tracking |
| 1.4 | Execution Complete Summary | P4 | ✅ Complete | ✅ Implemented | ✅ Implemented | Completion tracking |
| 2.1 | Step Completion Announcement | P0 | ✅ Complete | ✅ Implemented | ✅ Implemented | Critical core functionality |
| 2.2 | Dual Output | P2 | ✅ Complete | ⚠️ TODO | ⚠️ Planned | Second-opinion integration |
| 2.3 | Second Opinion Skip | P4 | ✅ Complete | ⚠️ TODO | ⚠️ Planned | Second-opinion flow |
| 3.1 | Human Gate Presentation | P5 | ✅ Complete (free-form) | ❌ Not needed | ✅ Read-only | No standardized format |
| 3.2 | Learning Surface Presentation | P2 | ✅ Complete | ⚠️ TODO | ⚠️ Planned | Agent feedback loop |
| 3.3 | Session-Start Protocol | P4 | ✅ Complete | ❌ FUTURE | ❌ FUTURE | Not yet produced |
| 4.1 | Registry Update | P2 | ✅ Complete | ⚠️ TODO | ⚠️ Planned | Live registry updates |
| 4.2 | INDEX.md Entry | P3 | ✅ Complete | ⚠️ TODO | ⚠️ Planned | Historical data |
| 4.3 | LEARNINGS.md Entry | P4 | ✅ Complete | ⚠️ TODO | ⚠️ Planned | Historical learnings |
| 5.1 | Review Report Structure | P1 | ✅ Complete (full template) | ✅ Implemented | ✅ Implemented | Agent output |
| 5.2 | Analysis Report Structure | P3 | ✅ Complete (full template) | ✅ Implemented | ✅ Implemented | Agent output |
| 5.3 | Brainstorm Session Transcript | P5 | ✅ Complete (recommended) | ✅ Implemented | ✅ Read-only | Agent output (not enforced) |
| 6.1 | Error Announcement | P1 | ✅ Complete | ⚠️ TODO (high priority) | ⚠️ Planned | Error recovery UI |
| 6.2 | Department Routing | P5 | ✅ Complete | ❌ FUTURE | ❌ FUTURE | Not yet produced, will rename to "Context" |

---

## Learnings

**Issue:** User requested analysis of CONTRACT.md and its "~4 successor documents after dissolution"
**Root Cause:** Misleading phrasing — CONTRACT.md was **reorganized**, not dissolved. Content was extracted to 4 new docs, but CONTRACT.md remains as the canonical type specification (reduced from 742 → 412 lines).
**Suggestion:** When discussing the "dissolution," clarify that it was a reorganization/extraction, not a deletion. CONTRACT.md still exists and is the single source of truth for format specifications.

**[FRESH EYE]** The specification layer is remarkably complete and well-organized:
- All 17 formats have complete specifications (type, parser, pattern, fields)
- No conflicting specifications detected across docs
- Clear separation between orchestrator outputs (lean type specs) and agent outputs (full markdown templates)
- Parser implementation priority clearly documented with P0-P5 levels
- 8 of 17 parsers already implemented (47% complete)
- 7 parsers TODO (41%), 2 formats FUTURE (12%)
- The 2026-02-09 reorganization successfully reduced duplication while preserving all specification content

The main gap is **parser implementation** (9 formats with specs but no parsers), not specification documentation. The contract layer is solid.

---

## Pre-Completion Validation

**Log Folder Checklist:**
- [x] Log folder exists: `.claude/actionflows/logs/analyze/specification-contract-layer_2026-02-09-21-21-20/`
- [x] Contains output file: `report.md`
- [x] File is non-empty: ~32KB
- [x] Folder path follows format: `logs/analyze/{description}_{datetime}/`
- [x] Description is kebab-case: ✓

**Analysis Completeness:**
- [x] All 17 formats documented with complete specifications
- [x] CONTRACT.md reorganization (not dissolution) clarified
- [x] 4 successor docs identified and mapped
- [x] ORCHESTRATOR.md Response Format Standard section mapped (11 formats)
- [x] Conflicting specifications checked (none found)
- [x] Parser implementation status documented (8 implemented, 7 TODO, 2 FUTURE)
- [x] Action/format mappings identified (review, analyze, brainstorm → 5.1, 5.2, 5.3)
- [x] Version markers checked (v1.0, no deprecations)
- [x] Recommendations provided (7 actionable items)

---

**Analysis Complete**
Output written to: D:\ActionFlowsDashboard\.claude\actionflows\logs\analyze\specification-contract-layer_2026-02-09-21-21-20\report.md
