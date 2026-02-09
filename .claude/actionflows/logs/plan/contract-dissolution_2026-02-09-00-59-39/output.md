# CONTRACT.md Dissolution Plan

**Created:** 2026-02-09
**Based On:** Analysis output from `.claude/actionflows/logs/analyze/contract-dissolution-inventory_2026-02-09-00-55-03/output.md`
**Objective:** Dissolve CONTRACT.md into relevant consuming files per human's principle: "Instructions should live where they're consumed"

---

## Executive Summary

CONTRACT.md (742 lines) serves **4 distinct consumers** with content belonging in different locations:

| Consumer | Current Lines | Target Location | Reduction |
|----------|--------------|-----------------|-----------|
| **Orchestrator** | ~400 | ORCHESTRATOR.md (9/12 formats already there) | Remove duplicates |
| **Agents** | ~150 | Keep in CONTRACT.md (lean type spec) | Keep, restructure |
| **Code Developers** | ~120 | packages/shared/src/contract/README.md | Move code docs |
| **Framework Developers** | ~150 | .claude/actionflows/docs/ (new files) | Extract philosophy |

**Target:** Reduce CONTRACT.md from 742 lines → **~350 lines** (53% reduction) by removing duplication and extracting documentation.

---

## Part 1: Exact File Operations

### Operation Group 1: Create New Documentation Files

#### 1.1 Create `.claude/actionflows/docs/HARMONY_SYSTEM.md`

**Purpose:** Cross-reference map of the 4-component Framework Harmony System

**Source Content (from CONTRACT.md):**
- Lines 48-76: Complete Harmony System overview

**New File Structure:**
```markdown
# Framework Harmony System

**Last Updated:** 2026-02-09

The complete 4-component system that keeps orchestrator and dashboard in sync.

---

## The Four Components

### 1. Orchestrator Contract
**Location:** `.claude/actionflows/CONTRACT.md`
**Purpose:** Formal specification of all output formats (orchestrator outputs + agent outputs)
**Implementation:** `packages/shared/src/contract/` (types, parsers, patterns, guards)
**Consumed By:** Orchestrator (must produce formats), Agents (review/analyze/brainstorm), Frontend (must parse)

**Key Concept:** If dashboard PARSES it → contract-defined (sacred). If dashboard READS it → not contract-defined (evolve freely).

### 2. Onboarding Questionnaire
**Location:** `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md`
**Purpose:** Interactive teaching of harmony concepts to humans
**Trigger:** Run `onboarding/` flow, complete Advanced level
**Target Audience:** New framework contributors, orchestrator maintainers

### 3. Harmony Detection
**Location:** `packages/backend/src/services/harmonyDetector.ts`
**Purpose:** Automated drift monitoring (real-time parsing validation)
**Types:** `packages/shared/src/harmonyTypes.ts`
**Usage:** Runs automatically on every orchestrator output, broadcasts violations via WebSocket
**Dashboard:** Real-time harmony panel shows parsing status

### 4. Philosophy Documentation
**Location:** Embedded across ORCHESTRATOR.md (lines 29-58), agent-standards/instructions.md (lines 48-67), onboarding modules
**Purpose:** Embed harmony concept everywhere it belongs
**Cross-References:** This document, CONTRACT.md header, onboarding Module 9

---

## Why This Matters

The contract is meaningless without the full system:
- **Humans** learn via onboarding questionnaire
- **Orchestrator** follows CONTRACT.md output specifications
- **Backend** validates via HarmonyDetector service
- **Dashboard** shows parsing status and harmony violations

This is **synchronized evolution** — not rigid specification.

---

## Learn More

- **Teaching:** Complete `.claude/actionflows/flows/framework/onboarding/` (Module 9)
- **Implementation:** Read `packages/backend/src/services/harmonyDetector.ts`
- **Monitoring:** Check dashboard harmony panel (real-time status)
- **Contract:** See `.claude/actionflows/CONTRACT.md` for format specifications
```

**Status:** File does NOT exist → CREATE

---

#### 1.2 Create `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`

**Purpose:** Consolidated guide for adding/modifying contract formats

**Source Content (from CONTRACT.md):**
- Lines 29-43: Evolution Rules
- Lines 673-685: Breaking Changes Process
- Lines 687-700: Contributing Guide

**New File Structure:**
```markdown
# Contract Evolution Process

**Last Updated:** 2026-02-09
**Audience:** Framework developers modifying CONTRACT.md

This guide consolidates the process for adding new formats or modifying existing formats in the Orchestrator Contract.

---

## Adding a New Format

Follow these steps to add a new contract-defined format:

### 1. Define the Type Specification (CONTRACT.md)
- Add new format section to CONTRACT.md under appropriate category
- Include: TypeScript type name, parser function, pattern regex, required fields
- Assign priority level (P0-P5) based on implementation urgency
- Provide markdown structure example (if complex)

**Example:**
```markdown
### Format X.Y: New Format Name (P2)
**TypeScript:** NewFormatParsed
**Parser:** parseNewFormat(text: string)
**Pattern:** /^## New Format: (.+)$/m
**Example:** ORCHESTRATOR.md § New Format Section

**Required Fields:**
- Field 1 (string)
- Field 2 (enum: VALUE_A | VALUE_B)
```

### 2. Implement TypeScript Definitions
- **Types:** `packages/shared/src/contract/types/newFormat.ts`
- **Patterns:** `packages/shared/src/contract/patterns/newFormatPatterns.ts`
- **Parser:** `packages/shared/src/contract/parsers/parseNewFormat.ts`
- **Guard:** Add `isNewFormatParsed` to `packages/shared/src/contract/guards.ts`
- **Export:** Update `packages/shared/src/contract/index.ts`

### 3. Update Orchestrator or Agent Instructions
**If orchestrator produces this format:**
- Add example to ORCHESTRATOR.md § Response Format Standard
- Include when to produce, required fields, formatting rules

**If agent produces this format:**
- Add reference to agent-standards/instructions.md § Contract Compliance
- Add explicit reference to specific agent.md file (e.g., review/agent.md)

### 4. Update Dashboard Components
- Create or update parser in `packages/app/src/parsers/`
- Add rendering component in `packages/app/src/components/`
- Test graceful degradation if parsing fails

### 5. Run Harmony Validation
```bash
pnpm run harmony:check
```
- Validates parsers against contract specifications
- Ensures TypeScript types match expected structure
- Tests example inputs from ORCHESTRATOR.md

### 6. Increment CONTRACT_VERSION (if structure changes)
- **Minor changes** (add optional field): 1.0 → 1.1
- **Breaking changes** (remove field, change enum): 1.0 → 2.0
- Update version in CONTRACT.md header

---

## Modifying an Existing Format

**CRITICAL:** Existing formats are load-bearing. Dashboard depends on them. Follow this process:

### Step 1: Assess Impact
**Questions:**
- Is this a breaking change? (removes field, changes required field, changes enum values)
- Which dashboard components consume this format?
- Are there active deployments relying on this format?

### Step 2: Increment CONTRACT_VERSION
- **Minor (non-breaking):** Add optional field, expand enum → 1.0 → 1.1
- **Major (breaking):** Remove field, change required structure → 1.0 → 2.0

### Step 3: Implement Version-Specific Parsers
```typescript
// packages/shared/src/contract/parsers/parseChainCompilation.ts
export function parseChainCompilationV1_0(text: string): ChainCompilationParsedV1_0 { ... }
export function parseChainCompilationV1_1(text: string): ChainCompilationParsedV1_1 { ... }

// Default export uses latest version
export function parseChainCompilation(text: string): ChainCompilationParsed {
  return parseChainCompilationV1_1(text);
}
```

### Step 4: Support Both Versions During Migration
- **Migration window:** Minimum 90 days
- Backend accepts both v1.0 and v1.1 parsers
- Dashboard gracefully handles both formats
- Harmony detector validates against correct version

### Step 5: Update CONTRACT.md
- Mark old version as deprecated (add "Deprecated since vX.Y")
- Document new version with full specification
- Update TypeScript reference
- Update ORCHESTRATOR.md example

### Step 6: Notify via Harmony Detection
- Harmony detector shows version mismatch warning
- Dashboard displays "Parsing with legacy format" banner
- Broadcast upgrade recommendation via WebSocket

---

## Breaking Changes Checklist

Before merging a breaking contract change:

- [ ] CONTRACT_VERSION incremented (major version bump)
- [ ] Version-specific parser implemented (parseFormatV2_0)
- [ ] Backward compatibility maintained for 90 days minimum
- [ ] CONTRACT.md updated with new format specification
- [ ] ORCHESTRATOR.md example updated
- [ ] Dashboard components handle both versions
- [ ] Harmony detection validates both versions
- [ ] Migration guide added to this document
- [ ] Team notified of migration timeline

---

## Validation & Testing

### Automated Validation
```bash
pnpm run harmony:check
```

Runs:
- TypeScript type checking across all packages
- Parser unit tests against contract examples
- Harmony detector validation
- Dashboard parser integration tests

### Manual Testing
See `packages/shared/src/contract/README.md` for parser testing examples.

---

## Questions?

- Read: `.claude/actionflows/docs/HARMONY_SYSTEM.md` (philosophy)
- Test: Complete onboarding Module 9 (interactive learning)
- Monitor: Dashboard harmony panel (real-time status)
```

**Status:** File does NOT exist → CREATE

---

#### 1.3 Create `packages/shared/src/contract/README.md`

**Purpose:** Developer API documentation for contract package

**Source Content (from CONTRACT.md):**
- Lines 646-671: Manual Testing examples
- Lines 702-738: TypeScript Reference (import statements)

**New File Structure:**
```markdown
# Contract Types & Parsers

**Package:** @actionflows/shared/contract
**Purpose:** TypeScript types, parsers, patterns, and guards for ActionFlows Orchestrator Contract

This package implements the formal specification defined in `.claude/actionflows/CONTRACT.md`.

---

## Available Exports

### Types
All parsed output types for orchestrator and agent outputs:

```typescript
import {
  // Chain Management (Category 1)
  ChainCompilationParsed,
  ExecutionStartParsed,
  ChainStatusUpdateParsed,
  ExecutionCompleteSummaryParsed,

  // Step Lifecycle (Category 2)
  StepCompletionParsed,
  DualOutputParsed,
  SecondOpinionSkipParsed,

  // Human Interaction (Category 3)
  LearningsSurfaceParsed,
  SessionStartAcknowledgmentParsed,

  // Registry & Metadata (Category 4)
  RegistryUpdateParsed,
  IndexEntryParsed,
  LearningsEntryParsed,

  // Action Outputs (Category 5 — Agent Outputs)
  ReviewReportParsed,
  AnalysisReportParsed,
  BrainstormTranscriptParsed,

  // Error & Status (Category 6)
  ErrorAnnouncementParsed,
  DepartmentRoutingParsed,

  // Contract Metadata
  CONTRACT_VERSION,
} from '@actionflows/shared/contract';
```

### Patterns
Regex patterns for detecting format boundaries:

```typescript
import {
  ChainPatterns,
  StepPatterns,
  RegistryPatterns,
  ErrorPatterns,
} from '@actionflows/shared/contract';

// Example usage:
const chainMatch = text.match(ChainPatterns.CHAIN_COMPILATION_START);
```

### Parsers
Functions to parse orchestrator/agent output text into typed objects:

```typescript
import {
  parseChainCompilation,
  parseExecutionStart,
  parseStepCompletion,
  parseReviewReport,
  parseAnalysisReport,
  parseErrorAnnouncement,
} from '@actionflows/shared/contract';

// Example usage:
const parsed: ChainCompilationParsed | null = parseChainCompilation(outputText);
if (parsed) {
  console.log(parsed.title, parsed.steps);
}
```

### Guards
Type guards for runtime type checking:

```typescript
import {
  isChainCompilationParsed,
  isReviewReportParsed,
  isErrorAnnouncementParsed,
} from '@actionflows/shared/contract';

// Example usage:
if (isChainCompilationParsed(parsed)) {
  // TypeScript knows parsed is ChainCompilationParsed
  parsed.steps.forEach(step => console.log(step.action));
}
```

---

## Manual Testing

### Testing a Parser

```typescript
import { parseChainCompilation, isChainCompilationParsed } from '@actionflows/shared/contract';

const exampleOutput = `
## Chain: Example Implementation

**Request:** Build new feature X
**Source:** Flow: code-and-review/

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/  | opus  | scope      | —         | pending |

**Execution:** Single step

**What this step does:**
1. Implement feature X
`;

const parsed = parseChainCompilation(exampleOutput);

if (isChainCompilationParsed(parsed)) {
  console.log('✅ Parsing successful');
  console.log('Title:', parsed.title);
  console.log('Steps:', parsed.steps);
} else {
  console.error('❌ Parsing failed');
}
```

### Testing Harmony Validation

```bash
# Run automated contract validation
pnpm run harmony:check

# Run specific parser tests
pnpm test packages/shared/src/contract/
```

---

## Adding a New Parser

1. **Create type definition:** `types/newFormat.ts`
   ```typescript
   export interface NewFormatParsed {
     title: string;
     requiredField: string;
     optionalField?: number;
   }
   ```

2. **Create pattern:** `patterns/newFormatPatterns.ts`
   ```typescript
   export const NewFormatPatterns = {
     START: /^## New Format: (.+)$/m,
     REQUIRED_FIELD: /\*\*Required:\*\* (.+)$/m,
   };
   ```

3. **Create parser:** `parsers/parseNewFormat.ts`
   ```typescript
   import { NewFormatParsed } from '../types/newFormat';
   import { NewFormatPatterns } from '../patterns/newFormatPatterns';

   export function parseNewFormat(text: string): NewFormatParsed | null {
     const titleMatch = text.match(NewFormatPatterns.START);
     if (!titleMatch) return null;

     const requiredMatch = text.match(NewFormatPatterns.REQUIRED_FIELD);
     if (!requiredMatch) return null;

     return {
       title: titleMatch[1].trim(),
       requiredField: requiredMatch[1].trim(),
     };
   }
   ```

4. **Add type guard:** `guards.ts`
   ```typescript
   export function isNewFormatParsed(value: unknown): value is NewFormatParsed {
     return (
       typeof value === 'object' &&
       value !== null &&
       'title' in value &&
       'requiredField' in value
     );
   }
   ```

5. **Export from index:** `index.ts`
   ```typescript
   export * from './types/newFormat';
   export * from './patterns/newFormatPatterns';
   export * from './parsers/parseNewFormat';
   export { isNewFormatParsed } from './guards';
   ```

6. **Add tests:** `__tests__/parseNewFormat.test.ts`

---

## Related Documentation

- **Contract Specification:** `.claude/actionflows/CONTRACT.md`
- **Evolution Process:** `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
- **Harmony System:** `.claude/actionflows/docs/HARMONY_SYSTEM.md`
- **Onboarding:** Complete Module 9 for interactive learning

---

## Package Structure

```
packages/shared/src/contract/
├── index.ts                    # Main exports
├── types/                      # TypeScript type definitions
│   ├── chainManagement.ts
│   ├── stepLifecycle.ts
│   ├── humanInteraction.ts
│   ├── registryMetadata.ts
│   ├── actionOutputs.ts
│   └── errorStatus.ts
├── patterns/                   # Regex patterns for parsing
│   ├── chainPatterns.ts
│   ├── stepPatterns.ts
│   ├── registryPatterns.ts
│   └── errorPatterns.ts
├── parsers/                    # Parser functions
│   ├── parseChainCompilation.ts
│   ├── parseStepCompletion.ts
│   ├── parseReviewReport.ts
│   └── ...
├── guards.ts                   # Type guard functions
└── __tests__/                  # Parser unit tests
```

---

**Last Updated:** 2026-02-09
```

**Status:** File does NOT exist → CREATE

---

#### 1.4 Create `packages/app/docs/PARSER_PRIORITY.md`

**Purpose:** Frontend parser implementation tracking

**Source Content (from CONTRACT.md):**
- Lines 82-93: Priority Levels table

**New File Structure:**
```markdown
# Parser Implementation Priority

**Last Updated:** 2026-02-09
**Audience:** Frontend developers implementing dashboard parsers

Formats are prioritized by implementation urgency and user value.

---

## Priority Levels

| Priority | Purpose | Implementation Urgency |
|----------|---------|----------------------|
| **P0** | Critical for core dashboard functionality (chain visualization, progress tracking) | MUST implement first |
| **P1** | High-value features (quality metrics, error recovery) | Implement early |
| **P2** | Second-opinion integration, live registry updates | Implement mid-term |
| **P3** | Historical data, status updates | Nice-to-have |
| **P4** | Session metadata, edge cases | Low priority |
| **P5** | Low-frequency or internal formats | Optional |

---

## Implementation Status

### P0 — Critical (Core Functionality)

- [x] **Format 1.1:** Chain Compilation Table
  - **Parser:** `parseChainCompilation`
  - **Components:** ChainVisualization, ChainTable, ProgressTracker
  - **Status:** IMPLEMENTED

- [x] **Format 2.1:** Step Completion Announcement
  - **Parser:** `parseStepCompletion`
  - **Components:** StepProgressBar, ExecutionLog
  - **Status:** IMPLEMENTED

---

### P1 — High-Value Features

- [x] **Format 5.1:** Review Report Structure
  - **Parser:** `parseReviewReport`
  - **Components:** ReviewReportViewer, FindingsTable, VerdictBanner
  - **Status:** IMPLEMENTED

- [ ] **Format 6.1:** Error Announcement
  - **Parser:** `parseErrorAnnouncement`
  - **Components:** ErrorModal, RecoveryOptionsPanel
  - **Status:** TODO (high priority for error recovery UX)

---

### P2 — Mid-Term Features

- [ ] **Format 2.2:** Dual Output (Action + Second Opinion)
  - **Parser:** `parseDualOutput`
  - **Components:** DualOutputViewer, ComparisonPanel
  - **Status:** TODO (second-opinion integration)

- [ ] **Format 3.2:** Learning Surface Presentation
  - **Parser:** `parseLearningsSurface`
  - **Components:** LearningsCard, ApprovalDialog
  - **Status:** TODO (agent feedback loop)

- [ ] **Format 4.1:** Registry Update
  - **Parser:** `parseRegistryUpdate`
  - **Components:** RegistryLiveView, FileChangeIndicator
  - **Status:** TODO (live registry updates)

---

### P3 — Historical Data

- [ ] **Format 1.2:** Chain Execution Start
  - **Parser:** `parseExecutionStart`
  - **Components:** ExecutionTimeline, StartTimestamp
  - **Status:** TODO (historical tracking)

- [ ] **Format 1.4:** Execution Complete Summary
  - **Parser:** `parseExecutionCompleteSummary`
  - **Components:** SummaryCard, LogsLinkButton
  - **Status:** TODO (completion tracking)

- [ ] **Format 4.2:** INDEX.md Entry
  - **Parser:** `parseIndexEntry`
  - **Components:** ExecutionHistory, PastChainsTable
  - **Status:** TODO (read-only historical view)

- [x] **Format 5.2:** Analysis Report Structure
  - **Parser:** `parseAnalysisReport`
  - **Components:** AnalysisReportViewer, MetricsDisplay
  - **Status:** IMPLEMENTED

---

### P4 — Session Metadata

- [ ] **Format 1.3:** Chain Status Update
  - **Parser:** `parseChainStatusUpdate`
  - **Components:** MidChainProgressUpdate
  - **Status:** TODO (progress tracking)

- [ ] **Format 2.3:** Second Opinion Skip
  - **Parser:** `parseSecondOpinionSkip`
  - **Components:** SkipNotification
  - **Status:** TODO (second-opinion flow)

- [ ] **Format 4.3:** LEARNINGS.md Entry
  - **Parser:** `parseLearningsEntry`
  - **Components:** PastLearningsViewer
  - **Status:** TODO (read-only historical view)

---

### P5 — Low-Frequency / Optional

- [ ] **Format 3.1:** Human Gate Presentation
  - **Parser:** NOT contract-defined (free-form)
  - **Components:** HumanGateDisplay (read-only markdown)
  - **Status:** NO PARSER NEEDED (display as-is)

- [ ] **Format 3.3:** Session-Start Protocol Acknowledgment
  - **Parser:** `parseSessionStartAck`
  - **Components:** SessionMetadataPanel
  - **Status:** FUTURE (not yet produced by orchestrator)

- [x] **Format 5.3:** Brainstorm Session Transcript
  - **Parser:** `parseBrainstormTranscript`
  - **Components:** BrainstormViewer (read-only)
  - **Status:** IMPLEMENTED

- [ ] **Format 6.2:** Department Routing Announcement
  - **Parser:** `parseDepartmentRouting`
  - **Components:** RoutingIndicator
  - **Status:** FUTURE (not yet produced by orchestrator)

---

## Next Priorities

**Immediate (Sprint 1):**
1. Format 6.1: Error Announcement — Critical for error recovery UX

**Short-Term (Sprint 2-3):**
2. Format 2.2: Dual Output — Second-opinion integration
3. Format 3.2: Learning Surface Presentation — Agent feedback loop
4. Format 4.1: Registry Update — Live registry updates

**Mid-Term (Sprint 4-6):**
5. Historical tracking formats (1.2, 1.4, 4.2, 4.3)
6. Status update formats (1.3, 2.3)

---

## Implementation Checklist

For each parser:

- [ ] TypeScript types exist in `@actionflows/shared/contract`
- [ ] Parser function implemented
- [ ] Type guard exists
- [ ] Unit tests written
- [ ] Dashboard component consumes parser output
- [ ] Graceful degradation tested (parsing failure)
- [ ] Harmony detection validates format
- [ ] Example added to Storybook (if applicable)

---

**Related:**
- Contract specification: `.claude/actionflows/CONTRACT.md`
- Code API reference: `packages/shared/src/contract/README.md`
```

**Status:** Directory `packages/app/docs/` does NOT exist → CREATE directory + file

---

### Operation Group 2: Modify Existing Files

#### 2.1 Modify `D:\ActionFlowsDashboard\.claude\actionflows\ORCHESTRATOR.md`

**Purpose:** Add 4 missing orchestrator-produced format examples

**Existing Content:** Lines 348-434 contain Chain Compilation, Execution Start, Step Completion, Chain Status Update, Execution Complete, Dual Output, Second Opinion Skip, Learning Surface, Registry Update

**ADD these sections (at line 435, before "## Decision Gates"):**

```markdown
### 8. Error Announcement

When a step fails or an error occurs:

```
## Error: {Error title}

**Step:** {step number} — {action/}
**Message:** {error message}
**Context:** {what was being attempted}

{Stack trace or additional details if available}

**Recovery options:**
- Retry step {N}
- Skip step {N}
- Cancel chain
```

**Example:**

```
## Error: Type Check Failed

**Step:** 3 — code/backend/user-service
**Message:** TS2345: Argument of type 'string' is not assignable to parameter of type 'UserId'
**Context:** Implementing getUserById endpoint in packages/backend/src/routes/users.ts

src/routes/users.ts:42:18 - error TS2345
  const user = await storage.getUser(req.params.id);
                                      ~~~~~~~~~~~~

**Recovery options:**
- Retry step 3 (after fixing type error)
- Skip step 3 (continue to step 4)
- Cancel chain
```

---

### 9. INDEX.md Entry

After chain completes successfully, add execution record to `.claude/actionflows/logs/INDEX.md`:

**Format:**
```
| {YYYY-MM-DD} | {Description} | {Pattern} | {Outcome} |
```

**Example:**
```
| 2026-02-08 | Self-Evolving UI phases 1-4 | code×8 → review → second-opinion → commit | Success — 18 files, APPROVED 92% (1d50f9e) |
```

**Fields:**
- **Date:** Execution start date (YYYY-MM-DD)
- **Description:** Brief task description (from chain title or request)
- **Pattern:** Chain pattern notation (e.g., "code×3 → review → commit")
- **Outcome:** Success/failure + key metrics + commit hash if applicable

**Note:** This is written AFTER chain completes, not during execution.

---

### 10. LEARNINGS.md Entry

After human approves a learning surface, write to `.claude/actionflows/LEARNINGS.md`:

**Format:**
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

**Example:**
```markdown
### code/

#### Missing Type Imports After File Reorganization

**Context:** When moving types from shared/index.ts to shared/types/user.ts
**Problem:** Other packages fail type check with "Cannot find name 'UserId'"
**Root Cause:** Imports in consuming files still reference old path (shared/index.ts)
**Solution:** After moving files, grep globally for ALL references to old paths and update them
**Date:** 2026-02-08
**Source:** code/shared/types-split in "Organize shared types by domain" chain
```

---

### 11. Human Gate Presentation (Free-Form)

**Note:** Human gates are NOT standardized format. Output is free-form prose tailored to the decision.

**Typical Structure:**
- Present the decision/approval needed
- Show relevant context (code snippets, analysis results)
- Explain options if applicable
- Ask clear yes/no or multiple-choice question

**Example:**
```
I've compiled the following chain to implement user authentication:

## Chain: User Authentication Implementation

[Chain table here]

This will:
1. Add JWT types to shared package
2. Implement auth middleware in backend
3. Add login/logout endpoints
4. Create auth context in frontend

**Proceed with this approach?** (yes/no)
```

**Format:** No parsing required — display as markdown. User responds with text.

---
```

**Status:** File exists → ADD at line 435 (or append to Response Format Standard section)

---

#### 2.2 Modify `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`

**Purpose:** Expand Contract Compliance section with more details

**Current Content (lines 48-67):** Basic contract compliance note

**REPLACE lines 48-67 with:**

```markdown
### 12. Contract Compliance (for output-producing actions)

If your action produces structured output consumed by the dashboard (review reports, analysis reports, brainstorm transcripts):

- **Read the format specification** in `.claude/actionflows/CONTRACT.md` for your action type
- **Follow the exact markdown structure** defined in the contract
- **Include all required fields** — Missing fields cause harmony violations
- **Use correct enums/types** — Backend validates using contract-defined parsers
- **Test your output** — Harmony detector automatically validates and flags violations

**Contract-defined actions:**
- **review/** → Review Report Structure (CONTRACT.md § Format 5.1)
  - Required: Verdict (APPROVED | NEEDS_CHANGES), Score (0-100), Summary, Findings table, Fixes Applied (if mode=review-and-fix), Flags for Human
- **analyze/** → Analysis Report Structure (CONTRACT.md § Format 5.2)
  - Required: Title, Aspect, Scope, Date, Agent, numbered analysis sections, Recommendations
- **brainstorm/** → Brainstorm Session Transcript (CONTRACT.md § Format 5.3)
  - Recommended structure (not strictly enforced): Idea, Classification, Transcript, Key Insights, Issues & Risks, Next Steps

**Why this matters:**
- The backend **parses your output** using contract-defined parsers
- If structure doesn't match → parsing fails → harmony violation logged
- Dashboard shows **"parsing incomplete"** and degrades gracefully
- Harmony detector **broadcasts violations** via WebSocket (visible in dashboard)

**Validation:**
```bash
pnpm run harmony:check
```

**Not contract-defined:** Agent learnings, internal notes, working files, intermediate outputs. Only final deliverables consumed by dashboard are contract-defined.

---
```

**Status:** File exists → REPLACE lines 48-67

---

#### 2.3 Modify `.claude/actionflows/actions/review/agent.md`

**Purpose:** Add explicit contract reference near top of file

**Current Content:** Standard review agent instructions

**ADD after line 17 (after "## Your Mission" section, before "## Steps to Complete This Action"):**

```markdown
---

## Output Format (CRITICAL)

**Your review report MUST follow the structure defined in:**
`.claude/actionflows/CONTRACT.md` § Format 5.1: Review Report Structure

The dashboard parses your output using this specification. Missing or incorrectly formatted fields cause harmony violations.

**Required Sections:**
- **Verdict:** `APPROVED` or `NEEDS_CHANGES` (exact enum values)
- **Score:** Integer 0-100 (quality percentage)
- **Summary:** 2-3 sentence overview of findings
- **Findings:** Markdown table with columns: #, File, Line, Severity, Description, Suggestion
- **Fixes Applied:** (if mode = review-and-fix) Table of files and fixes
- **Flags for Human:** Issues requiring human judgment

**Severity Levels:** `critical`, `high`, `medium`, `low` (exact lowercase values)

**See CONTRACT.md for complete specification.**

---
```

**Status:** File exists → ADD after line 17

---

#### 2.4 Modify `.claude/actionflows/actions/analyze/agent.md`

**Purpose:** Add explicit contract reference

**ADD after "## Your Mission" section:**

```markdown
---

## Output Format (CRITICAL)

**Your analysis report MUST follow the structure defined in:**
`.claude/actionflows/CONTRACT.md` § Format 5.2: Analysis Report Structure

**Required Sections:**
- **Title:** `# {Analysis Title}`
- **Metadata:** Aspect, Scope, Date, Agent
- **Analysis Body:** Numbered sections (1., 2., 3., etc.)
- **Recommendations:** Actionable next steps

**See CONTRACT.md for complete specification.**

---
```

**Status:** File exists → ADD after "## Your Mission"

---

#### 2.5 Modify `.claude/actionflows/flows/framework/brainstorm/agent.md`

**Purpose:** Add contract reference (recommended, not enforced)

**ADD after "## Your Mission" section:**

```markdown
---

## Output Format (Recommended)

**Your transcript should follow the structure defined in:**
`.claude/actionflows/CONTRACT.md` § Format 5.3: Brainstorm Session Transcript

**Note:** This format is **recommended but not enforced**. Dashboard displays brainstorm transcripts as read-only markdown.

**Recommended Sections:**
- Idea, Classification, Initial Context, Transcript, Key Insights, Issues & Risks, Next Steps, Open Questions, Metadata

**See CONTRACT.md for complete specification.**

---
```

**Status:** File exists (check path) → ADD after "## Your Mission"

---

### Operation Group 3: Restructure CONTRACT.md

#### 3.1 Restructure `D:\ActionFlowsDashboard\.claude\actionflows\CONTRACT.md`

**Purpose:** Convert to lean type specification, remove duplication, extract philosophy

**Current Structure:** 742 lines with philosophy, examples, and type specs mixed

**New Structure (Target: ~350 lines):**

**REMOVE these sections entirely:**
- Lines 9-13: "What Is This?" → Duplicated in ORCHESTRATOR.md
- Lines 15-27: "Contract Philosophy" → Duplicated in ORCHESTRATOR.md lines 29-58
- Lines 48-76: "The Complete Harmony System" → MOVED to docs/HARMONY_SYSTEM.md
- Lines 29-43: "Evolution Rules" → MOVED to docs/CONTRACT_EVOLUTION.md
- Lines 673-685: "Breaking Changes Process" → MOVED to docs/CONTRACT_EVOLUTION.md
- Lines 687-700: "Contributing Guide" → MOVED to docs/CONTRACT_EVOLUTION.md
- Lines 646-671: "Manual Testing" → MOVED to packages/shared/src/contract/README.md
- Lines 702-738: "TypeScript Reference" → MOVED to packages/shared/src/contract/README.md
- Lines 82-93: "Priority Levels" → MOVED to packages/app/docs/PARSER_PRIORITY.md

**REPLACE orchestrator format sections (1.1-4.3, 6.1-6.2) with TYPE SPEC ONLY:**
- Remove full markdown examples (already in ORCHESTRATOR.md)
- Keep: TypeScript type name, parser function, pattern regex, required fields list
- Add reference: "Example: ORCHESTRATOR.md § {section name}"

**KEEP agent format sections (5.1-5.3) with FULL SPECS:**
- These are NOT in ORCHESTRATOR.md (agents produce them)
- Agents need detailed structure specifications
- Keep markdown structure examples, field descriptions, dashboard usage notes

**New CONTRACT.md contents:**

```markdown
# ActionFlows Orchestrator Output Contract

**Version:** 1.0
**Last Updated:** 2026-02-09
**TypeScript Definitions:** `packages/shared/src/contract/`

---

## Cross-References

**Philosophy & System:** See `.claude/actionflows/docs/HARMONY_SYSTEM.md`
**Evolution Process:** See `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
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

[... Continue for all orchestrator formats 1.3, 1.4, 2.1-2.3, 3.1-3.3, 4.1-4.3, 6.1-6.2 ...]
[TYPE SPEC ONLY — no markdown examples]

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
```

**Status:** File exists → MAJOR RESTRUCTURE (reduce from 742 → ~350 lines)

---

## Part 2: Execution Order

**CRITICAL:** Dependencies matter. Execute in this order:

### Phase 1: Create New Documentation Files (Parallel)
**No dependencies** — can execute in parallel:
1. Create `.claude/actionflows/docs/HARMONY_SYSTEM.md`
2. Create `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
3. Create `packages/shared/src/contract/README.md`
4. Create `packages/app/docs/` directory
5. Create `packages/app/docs/PARSER_PRIORITY.md`

**Rationale:** These are net-new files. No risk of conflict.

---

### Phase 2: Add Missing Examples to ORCHESTRATOR.md (Sequential)
**Depends on:** Nothing (can run parallel with Phase 1)
6. Modify `ORCHESTRATOR.md` to add 4 missing format examples (Error Announcement, INDEX Entry, LEARNINGS Entry, Human Gate)

**Rationale:** Adds content without removing anything. Low risk.

---

### Phase 3: Expand Agent Instructions (Parallel)
**Depends on:** Phase 1 complete (CONTRACT.md restructure references new docs)
7. Modify `agent-standards/instructions.md` to expand Contract Compliance section
8. Modify `review/agent.md` to add contract reference
9. Modify `analyze/agent.md` to add contract reference
10. Modify `brainstorm/agent.md` to add contract reference

**Rationale:** These reference CONTRACT.md sections. Safe to add before restructure.

---

### Phase 4: Restructure CONTRACT.md (Sequential, LAST)
**Depends on:** Phase 1, 2, 3 complete
11. Restructure `CONTRACT.md` (remove duplicates, convert to lean type spec, add cross-references to new docs)

**Rationale:** This is the most disruptive change. Do it last after all supporting docs are in place.

---

## Part 3: What CONTRACT.md Becomes After Dissolution

### Current Structure (742 lines)
```
CONTRACT.md
├── Header & Meta (6 lines)
├── What Is This? (5 lines) ← REMOVE (duplicate)
├── Contract Philosophy (13 lines) ← REMOVE (duplicate)
├── Evolution Rules (15 lines) ← MOVE to docs/CONTRACT_EVOLUTION.md
├── Complete Harmony System (29 lines) ← MOVE to docs/HARMONY_SYSTEM.md
├── Format Catalog (549 lines)
│   ├── Priority Levels (12 lines) ← MOVE to packages/app/docs/PARSER_PRIORITY.md
│   ├── Category 1: Chain Management (114 lines) ← REDUCE to type specs only
│   ├── Category 2: Step Lifecycle (83 lines) ← REDUCE to type specs only
│   ├── Category 3: Human Interaction (75 lines) ← REDUCE to type specs only
│   ├── Category 4: Registry & Metadata (70 lines) ← REDUCE to type specs only
│   ├── Category 5: Action Outputs (132 lines) ← KEEP full specs (agents need them)
│   ├── Category 6: Error & Status (53 lines) ← REDUCE to type specs only
├── Contract Validation (43 lines) ← REDUCE to brief reference
│   ├── Automated Checks (14 lines) ← Keep brief version
│   ├── Manual Testing (28 lines) ← MOVE to packages/shared/src/contract/README.md
├── Breaking Changes & Contributing (70 lines) ← MOVE to docs/CONTRACT_EVOLUTION.md
│   ├── Breaking Changes Process (13 lines)
│   ├── Contributing Guide (14 lines)
│   ├── TypeScript Reference (37 lines) ← MOVE to packages/shared/src/contract/README.md
```

### New Structure (~350 lines)
```
CONTRACT.md
├── Header & Meta (6 lines) — KEEP
├── Cross-References (10 lines) — NEW (links to docs/)
├── Orchestrator Output Formats (~180 lines) — TYPE SPECS ONLY
│   ├── Category 1: Chain Management (4 formats × ~15 lines = 60 lines)
│   ├── Category 2: Step Lifecycle (3 formats × ~12 lines = 36 lines)
│   ├── Category 3: Human Interaction (3 formats × ~10 lines = 30 lines)
│   ├── Category 4: Registry & Metadata (3 formats × ~12 lines = 36 lines)
│   ├── Category 6: Error & Status (2 formats × ~10 lines = 20 lines)
├── Agent Output Formats (~150 lines) — FULL SPECS
│   ├── Format 5.1: Review Report (60 lines) — KEEP full spec
│   ├── Format 5.2: Analysis Report (50 lines) — KEEP full spec
│   ├── Format 5.3: Brainstorm Transcript (40 lines) — KEEP full spec
├── Validation (10 lines) — Brief reference to harmony:check
```

**Key Changes:**
- **Header:** Add cross-references to new docs
- **Orchestrator formats:** Remove markdown examples (reference ORCHESTRATOR.md)
- **Agent formats:** Keep full specifications (agents need them)
- **Philosophy:** Removed (now in docs/HARMONY_SYSTEM.md and ORCHESTRATOR.md)
- **Evolution process:** Removed (now in docs/CONTRACT_EVOLUTION.md)
- **Code docs:** Removed (now in packages/shared/src/contract/README.md)
- **Priority table:** Removed (now in packages/app/docs/PARSER_PRIORITY.md)

---

## Part 4: What Stays in CONTRACT.md

### Keep These Sections (Agents Need Them)

#### 1. Agent Output Format Specifications (Full Detail)
**Why:** Agents must produce these formats. They need complete structure specifications.

**Formats to keep in full:**
- **Format 5.1:** Review Report Structure (P1) — Full markdown structure, field descriptions, enums, dashboard usage
- **Format 5.2:** Analysis Report Structure (P3) — Full markdown structure, required sections
- **Format 5.3:** Brainstorm Transcript (P5) — Recommended structure (not enforced)

**Rationale:** These are NOT duplicated in ORCHESTRATOR.md (orchestrator doesn't produce them). Agents read CONTRACT.md directly for output specs. Frontend needs these for parsing.

---

#### 2. Orchestrator Output Type Specifications (Lean Format)
**Why:** Canonical type specification for frontend parsers.

**What to keep:**
- TypeScript type name (e.g., `ChainCompilationParsed`)
- Parser function name (e.g., `parseChainCompilation`)
- Regex pattern (e.g., `/^## Chain: (.+)$/m`)
- Required fields list (brief bullet points)
- Reference to ORCHESTRATOR.md for example

**What to remove:**
- Full markdown examples (already in ORCHESTRATOR.md lines 348-434)
- Verbose explanations (philosophy is in ORCHESTRATOR.md)
- Dashboard usage notes (frontend internal concern)

---

#### 3. Version Header & Cross-References
**Why:** Canonical version tracking and navigation to related docs.

**Keep:**
- Version number (1.0)
- Last updated date
- TypeScript definitions path
- Cross-references to HARMONY_SYSTEM.md, CONTRACT_EVOLUTION.md, contract/README.md, PARSER_PRIORITY.md

---

#### 4. Validation Reference (Brief)
**Why:** Developers need to know how to validate.

**Keep:**
```bash
pnpm run harmony:check
```
See `packages/shared/src/contract/README.md` for manual testing.

**Remove:** Full manual testing code examples (moved to README.md)

---

### Remove These Sections (Duplicate or Moved)

#### 1. Philosophy & Harmony Concept
**Current:** Lines 9-27
**Remove:** Fully duplicated in ORCHESTRATOR.md lines 29-58
**Keep:** Brief reference: "See ORCHESTRATOR.md § Contract & Harmony"

---

#### 2. Complete Harmony System Overview
**Current:** Lines 48-76
**Remove:** Entire section
**Move To:** `.claude/actionflows/docs/HARMONY_SYSTEM.md`
**Keep:** Cross-reference in header

---

#### 3. Evolution Rules, Breaking Changes, Contributing
**Current:** Lines 29-43, 673-700
**Remove:** All three sections
**Move To:** `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
**Keep:** Cross-reference in header

---

#### 4. Priority Levels Table
**Current:** Lines 82-93
**Remove:** Entire table
**Move To:** `packages/app/docs/PARSER_PRIORITY.md`
**Keep:** Cross-reference in header

---

#### 5. Manual Testing & TypeScript Reference
**Current:** Lines 646-671, 702-738
**Remove:** Both sections
**Move To:** `packages/shared/src/contract/README.md`
**Keep:** Cross-reference in Validation section

---

#### 6. Orchestrator Format Examples
**Current:** Lines 104-123 (Chain Compilation example), 149-153 (Execution Start example), etc.
**Remove:** All full markdown examples for orchestrator formats
**Keep:** Type spec only (TypeScript type, parser, pattern, required fields)
**Rationale:** ORCHESTRATOR.md already has these examples (9 out of 12 formats)

---

## Part 5: ORCHESTRATOR.md Additions

### Add These 4 Missing Formats

Currently in ORCHESTRATOR.md (lines 348-434):
- ✅ Format 1.1: Chain Compilation
- ✅ Format 1.2: Execution Start
- ✅ Format 2.1: Step Completion
- ✅ Format 1.3: Chain Status Update
- ✅ Format 1.4: Execution Complete
- ✅ Format 2.2: Dual Output
- ✅ Format 2.3: Second Opinion Skip
- ✅ Format 3.2: Learning Surface
- ✅ Format 4.1: Registry Update

**Missing from ORCHESTRATOR.md:**
- ❌ Format 6.1: Error Announcement
- ❌ Format 4.2: INDEX.md Entry
- ❌ Format 4.3: LEARNINGS.md Entry
- ❌ Format 3.1: Human Gate Presentation

**Add to ORCHESTRATOR.md at line 435 (after Registry Update, before Decision Gates):**

```markdown
### 8. Error Announcement

[Full example from Operation 2.1 above]

### 9. INDEX.md Entry

[Full example from Operation 2.1 above]

### 10. LEARNINGS.md Entry

[Full example from Operation 2.1 above]

### 11. Human Gate Presentation (Free-Form)

[Full example from Operation 2.1 above]
```

**Rationale:** Orchestrator must produce these formats. Examples belong in ORCHESTRATOR.md, not CONTRACT.md.

---

## Part 6: Risk Assessment

### High-Risk Changes

#### Risk 1: Breaking Contract References
**What:** Agents/orchestrator reference CONTRACT.md sections that we're moving/removing
**Impact:** Build failures, runtime errors, confusion
**Mitigation:**
1. Search codebase for `CONTRACT.md` references before restructuring
2. Add cross-references in new CONTRACT.md header to all moved docs
3. Update agent-standards to reference new locations
4. Add explicit references in agent.md files (review, analyze, brainstorm)

**Validation:**
```bash
# Search for CONTRACT.md references
grep -r "CONTRACT.md" .claude/actionflows/
grep -r "CONTRACT.md" packages/
```

---

#### Risk 2: Frontend Parser Breakage
**What:** Frontend parsers expect certain contract structure
**Impact:** Dashboard parsing failures, harmony violations
**Mitigation:**
1. Keep ALL type specifications in CONTRACT.md (lean format, but complete)
2. Keep agent output formats (5.1-5.3) in full detail
3. Test parsers after restructure:
   ```bash
   pnpm run harmony:check
   pnpm test packages/shared/src/contract/
   ```

---

#### Risk 3: Documentation Discoverability
**What:** Developers can't find philosophy/evolution docs after dissolution
**Impact:** Framework knowledge loss, poor onboarding
**Mitigation:**
1. Add prominent cross-references in CONTRACT.md header
2. Add cross-references in ORCHESTRATOR.md
3. Update onboarding Module 9 to reference new docs
4. Add references in agent-standards

**Checklist:**
- [ ] CONTRACT.md header links to all 4 new docs
- [ ] ORCHESTRATOR.md § Contract & Harmony links to HARMONY_SYSTEM.md
- [ ] agent-standards § Contract Compliance links to CONTRACT.md and CONTRACT_EVOLUTION.md
- [ ] onboarding/modules/09-harmony.md links to HARMONY_SYSTEM.md

---

#### Risk 4: Harmony Detector Breakage
**What:** Backend HarmonyDetector expects certain CONTRACT.md structure
**Impact:** Harmony detection fails, dashboard shows false positives
**Mitigation:**
1. Check `packages/backend/src/services/harmonyDetector.ts` for CONTRACT.md dependencies
2. Ensure type definitions in `packages/shared/src/contract/` remain unchanged
3. Test harmony detection after restructure:
   ```bash
   pnpm dev:backend
   # Trigger a chain execution, watch for harmony violations
   ```

**Validation:**
```bash
# Search for hardcoded CONTRACT.md parsing
grep -r "CONTRACT.md" packages/backend/src/services/harmonyDetector.ts
grep -r "CONTRACT.md" packages/shared/src/harmonyTypes.ts
```

---

### Medium-Risk Changes

#### Risk 5: Incomplete Cross-References
**What:** New docs reference each other but links are broken
**Impact:** 404s, poor navigation
**Mitigation:**
1. Create all docs in Phase 1 before restructuring CONTRACT.md
2. Test all cross-reference links after creation
3. Use absolute paths from project root (e.g., `.claude/actionflows/docs/HARMONY_SYSTEM.md`)

---

#### Risk 6: Duplicate Content Drift
**What:** After dissolution, ORCHESTRATOR.md and CONTRACT.md contain overlapping content that drifts apart
**Impact:** Conflicting information, confusion
**Mitigation:**
1. Establish clear boundary: ORCHESTRATOR.md = examples, CONTRACT.md = type specs
2. Contract.md references ORCHESTRATOR.md for all orchestrator format examples
3. No markdown examples in CONTRACT.md for orchestrator formats (type specs only)

**Golden Rule:** If it's an example the orchestrator produces → ORCHESTRATOR.md. If it's a type spec for parsing → CONTRACT.md.

---

### Low-Risk Changes

#### Risk 7: Git History Loss
**What:** Moving content makes git blame harder to track
**Impact:** Lose track of why decisions were made
**Mitigation:** Acceptable. Content is being reorganized for clarity, not deleted.

---

## Part 7: Pre-Execution Validation Checklist

Before executing this plan, validate:

### Codebase Search
- [ ] Search for all `CONTRACT.md` references:
  ```bash
  grep -r "CONTRACT.md" .claude/actionflows/
  grep -r "CONTRACT.md" packages/
  ```
- [ ] Search for hardcoded format examples in code:
  ```bash
  grep -r "## Chain:" packages/backend/
  grep -r "## Verdict:" packages/backend/
  ```
- [ ] Check `harmonyDetector.ts` for CONTRACT.md dependencies

### Dependency Check
- [ ] Verify `packages/shared/src/contract/` exists and is populated
- [ ] Verify TypeScript types/parsers/guards are implemented
- [ ] Check if frontend parsers import from contract package

### Path Validation
- [ ] Verify `.claude/actionflows/docs/` directory exists (or will be created)
- [ ] Verify `packages/app/docs/` directory exists (or will be created)
- [ ] Verify agent.md file paths exist:
  - `.claude/actionflows/actions/review/agent.md`
  - `.claude/actionflows/actions/analyze/agent.md`
  - `.claude/actionflows/flows/framework/brainstorm/agent.md` (check path)

---

## Part 8: Post-Execution Validation Checklist

After executing this plan, validate:

### File Existence
- [ ] `.claude/actionflows/docs/HARMONY_SYSTEM.md` exists and is non-empty
- [ ] `.claude/actionflows/docs/CONTRACT_EVOLUTION.md` exists and is non-empty
- [ ] `packages/shared/src/contract/README.md` exists and is non-empty
- [ ] `packages/app/docs/PARSER_PRIORITY.md` exists and is non-empty

### Contract Integrity
- [ ] CONTRACT.md reduced to ~350 lines (from 742)
- [ ] CONTRACT.md contains all type specs (orchestrator + agent formats)
- [ ] CONTRACT.md header has cross-references to 4 new docs
- [ ] Agent output formats (5.1-5.3) still have full specifications

### Cross-Reference Integrity
- [ ] ORCHESTRATOR.md has 4 new format examples (Error, INDEX, LEARNINGS, Human Gate)
- [ ] agent-standards expanded Contract Compliance section
- [ ] review/agent.md has contract reference
- [ ] analyze/agent.md has contract reference
- [ ] brainstorm/agent.md has contract reference

### Build Validation
- [ ] TypeScript builds without errors:
  ```bash
  pnpm type-check
  ```
- [ ] Harmony check passes:
  ```bash
  pnpm run harmony:check
  ```
- [ ] Contract parser tests pass:
  ```bash
  pnpm test packages/shared/src/contract/
  ```

### Link Validation
- [ ] All cross-references in CONTRACT.md resolve (files exist)
- [ ] All cross-references in new docs resolve
- [ ] No broken internal links

---

## Learnings

**Issue:** CONTRACT.md serves 4 distinct consumers (orchestrator, agents, code developers, framework developers) with content that belongs in different locations

**Root Cause:** Single-file consolidation mixed orchestrator guide (examples), agent specs (output structure), code docs (API reference), and philosophy (harmony system). The file evolved from a lean spec into a teaching document, causing 70% duplication with ORCHESTRATOR.md.

**Suggestion:** Dissolve CONTRACT.md into specialized files per consumer:
1. **Orchestrator guide** → ORCHESTRATOR.md (examples of what to produce)
2. **Agent specs** → CONTRACT.md lean type catalog (output structure)
3. **Philosophy** → docs/HARMONY_SYSTEM.md (cross-reference map)
4. **Evolution process** → docs/CONTRACT_EVOLUTION.md (contributor guide)
5. **Code reference** → packages/shared/src/contract/README.md (API docs)

**[FRESH EYE]** The fact that ORCHESTRATOR.md already contains 9 out of 12 orchestrator format examples (75% duplication) reveals that CONTRACT.md's role shifted over time. It started as a type specification (contract) but evolved into a teaching document for orchestrator behavior. The duplication is a symptom of unclear separation between:
- **"What the orchestrator must do"** (behavioral contract) → ORCHESTRATOR.md
- **"What structure the output must have"** (type contract) → CONTRACT.md

The dissolution aligns these: ORCHESTRATOR.md becomes the behavioral guide (examples, when to produce), CONTRACT.md becomes the type catalog (structure, parsers, validation).

---

**Plan Complete**
Output written to: D:\ActionFlowsDashboard\.claude\actionflows\logs\plan\contract-dissolution_2026-02-09-00-59-39\output.md
