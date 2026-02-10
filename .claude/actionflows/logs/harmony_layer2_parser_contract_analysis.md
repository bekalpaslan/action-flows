# Layer 2 Analysis: Parser/Shared Contract Layer

**Audit Date:** 2026-02-09
**Aspect:** Parser/shared contract layer — backwards harmony audit
**Scope:** `packages/shared/src/contract/` and related parsing infrastructure
**Agent:** analyze/
**Contract Version:** 1.0

---

## Executive Summary

The parser/shared contract layer is a **comprehensive, well-structured translation system** that sits between orchestrator text output and dashboard TypeScript consumers. It defines 17 standardized formats across 6 categories, with dedicated parsers, type definitions, regex patterns, and type guards for each format.

### Key Findings

1. **Complete contract implementation** — All 17 formats have: types, patterns, parsers, and guards
2. **Graceful degradation** — All parsers return `null` on non-match and allow `null` fields for partial parses
3. **Zero frontend usage** — Dashboard frontend does NOT import any contract parsers directly
4. **Single backend consumer** — Only `harmonyDetector.ts` uses `parseOrchestratorOutput`
5. **No server-side preprocessing** — Events flow through backend untouched; no parsing before frontend
6. **Type guard coverage** — 100% of parsed types have corresponding type guards
7. **Clear separation** — Patterns (regex), types (TypeScript), parsers (logic), guards (runtime) in separate modules

### Architecture Assessment

✅ **STRENGTHS:**
- Clear module boundaries (patterns, types, parsers, guards)
- Consistent parser structure (detect → extract → build → validate)
- Master parser with priority ordering
- All fields nullable for graceful degradation
- Raw text always preserved for fallback rendering
- Contract versioning system in place

⚠️ **CONCERNS:**
- Frontend doesn't use parsers (Layer 3 likely parses manually)
- Some type guards are weak (presence-based, not structure-based)
- No Zod validation (Phase 1 decision, documented in code)
- Harmony detector's `getFormatName` logic duplicates guard logic
- No usage tracking — unclear which formats are actually produced by orchestrator

---

## 1. Contract Structure

### 1.1 File Organization

```
packages/shared/src/contract/
├── version.ts                    # Contract version system
├── guards.ts                     # Runtime type guards
├── index.ts                      # Main export barrel
├── README.md                     # Documentation
├── types/
│   ├── index.ts                  # Type exports
│   ├── chainFormats.ts           # Format 1.x types
│   ├── stepFormats.ts            # Format 2.x types
│   ├── humanFormats.ts           # Format 3.x types
│   ├── registryFormats.ts        # Format 4.x types
│   ├── actionFormats.ts          # Format 5.x types
│   └── statusFormats.ts          # Format 6.x types
├── patterns/
│   ├── index.ts                  # Pattern exports
│   ├── chainPatterns.ts          # Format 1.x regex
│   ├── stepPatterns.ts           # Format 2.x regex
│   ├── humanPatterns.ts          # Format 3.x regex
│   ├── registryPatterns.ts       # Format 4.x regex
│   ├── actionPatterns.ts         # Format 5.x regex
│   └── statusPatterns.ts         # Format 6.x regex
└── parsers/
    ├── index.ts                  # Parser exports + master parser
    ├── chainParser.ts            # Format 1.x parsers
    ├── stepParser.ts             # Format 2.x parsers
    ├── humanParser.ts            # Format 3.x parsers
    ├── registryParser.ts         # Format 4.x parsers
    ├── actionParser.ts           # Format 5.x parsers
    └── statusParser.ts           # Format 6.x parsers
```

### 1.2 17 Standardized Formats

| Category | Format | Parser | Type | Guard | Notes |
|----------|--------|--------|------|-------|-------|
| **1.x Chain Management** |
| 1.1 | Chain Compilation | `parseChainCompilation` | `ChainCompilationParsed` | `isChainCompilationParsed` | Table with steps, request, source |
| 1.2 | Chain Execution Start | `parseChainExecutionStart` | `ChainExecutionStartParsed` | `isChainExecutionStartParsed` | "Spawning Step N..." |
| 1.3 | Chain Status Update | `parseChainStatusUpdate` | `ChainStatusUpdateParsed` | `isChainStatusUpdateParsed` | Mid-execution table update |
| 1.4 | Execution Complete | `parseExecutionComplete` | `ExecutionCompleteParsed` | `isExecutionCompleteParsed` | Summary table + logs |
| **2.x Step Lifecycle** |
| 2.1 | Step Completion | `parseStepCompletion` | `StepCompletionParsed` | `isStepCompletionParsed` | ">> Step N complete: ..." |
| 2.2 | Dual Output | `parseDualOutput` | `DualOutputParsed` | `isDualOutputParsed` | Action + second opinion |
| 2.3 | Second Opinion Skip | `parseSecondOpinionSkip` | `SecondOpinionSkipParsed` | `isSecondOpinionSkipParsed` | "SKIPPED (...)" |
| **3.x Human Interaction** |
| 3.1 | Human Gate | `parseHumanGate` | `HumanGateParsed` | `isHumanGateParsed` | Approval prompt |
| 3.2 | Learning Surface | `parseLearningSurface` | `LearningSurfaceParsed` | `isLearningSurfaceParsed` | Agent reports learning |
| 3.3 | Session Start Protocol | `parseSessionStartProtocol` | `SessionStartProtocolParsed` | `isSessionStartProtocolParsed` | Config acknowledgment |
| **4.x Registry & Metadata** |
| 4.1 | Registry Update | `parseRegistryUpdate` | `RegistryUpdateParsed` | `isRegistryUpdateParsed` | File line edit |
| 4.2 | Index Entry | `parseIndexEntry` | `IndexEntryParsed` | `isIndexEntryParsed` | Execution log entry |
| 4.3 | Learning Entry | `parseLearningEntry` | `LearningEntryParsed` | `isLearningEntryParsed` | LEARNINGS.md entry |
| **5.x Action Outputs** |
| 5.1 | Review Report | `parseReviewReport` | `ReviewReportParsed` | `isReviewReportParsed` | Verdict, findings, fixes |
| 5.2 | Analysis Report | `parseAnalysisReport` | `AnalysisReportParsed` | `isAnalysisReportParsed` | Sections, recommendations |
| 5.3 | Brainstorm Transcript | `parseBrainstormTranscript` | `BrainstormTranscriptParsed` | `isBrainstormTranscriptParsed` | Q&A, insights, next steps |
| **6.x Status & Errors** |
| 6.1 | Error Announcement | `parseErrorAnnouncement` | `ErrorAnnouncementParsed` | `isErrorAnnouncementParsed` | Error details + recovery |
| 6.2 | Context Routing | `parseContextRouting` | `ContextRoutingParsed` | `isContextRoutingParsed` | Workbench routing decision |

---

## 2. Parser Implementation Details

### 2.1 Master Parser (`parseOrchestratorOutput`)

**Location:** `packages/shared/src/contract/parsers/index.ts`

**Signature:**
```typescript
export function parseOrchestratorOutput(text: string): ParsedFormat
```

**Return Type:**
```typescript
type ParsedFormat =
  | ChainCompilationParsed
  | ChainExecutionStartParsed
  | ... (all 17 types)
  | null  // No parser matched
```

**Priority Order:**
```
P0 (most common):    parseChainCompilation, parseStepCompletion
P1 (high-value):     parseReviewReport, parseErrorAnnouncement
P2 (second opinion): parseDualOutput, parseRegistryUpdate, parseLearningSurface
P3 (metadata):       parseIndexEntry, parseChainExecutionStart, parseAnalysisReport
P4 (completion):     parseSessionStartProtocol, parseExecutionComplete, parseSecondOpinionSkip, parseLearningEntry, parseChainStatusUpdate
P5 (rare):           parseBrainstormTranscript, parseHumanGate, parseContextRouting
```

**Error Handling:**
- Returns `null` if no parser matches
- Individual parsers return `null` on non-match
- Graceful degradation: partial fields return parsed object with `null` values

---

### 2.2 Individual Parser Pattern

All parsers follow 4-step structure:

```typescript
export function parseXYZ(text: string): XYZParsed | null {
  // 1. Detect (Level 1 — quick rejection)
  if (!Patterns.xyz.heading.test(text)) {
    return null;
  }

  // 2. Extract (Level 2 — regex matching)
  const fieldMatch = text.match(Patterns.xyz.field);
  const nestedData = parseNestedStructure(text);

  // 3. Build (construct parsed object)
  const parsed: XYZParsed = {
    field: fieldMatch?.[1] || null,
    nestedData,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate (manual checks, no Zod in Phase 1)
  // Warnings logged, but partial parse still returned
  return parsed;
}
```

---

### 2.3 Example: Chain Compilation Parser

**Input Format (Markdown):**
```markdown
## Chain: Build User Authentication

**Request:** Add login and signup screens
**Source:** code-and-review/ flow
**Execution:** Sequential

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | analyze/ | sonnet | auth requirements | -- | Pending |
| 2 | code/ | opus | analysis results | #1 | Pending |

1. **analyze/** -- Review current auth implementation
2. **code/** -- Implement login/signup screens

Execute?
```

**Regex Patterns:**
```typescript
ChainCompilationPatterns = {
  heading: /^## Chain: (.+)$/m,
  request: /^\*\*Request:\*\* (.+)$/m,
  source: /^\*\*Source:\*\* (.+)$/m,
  tableRow: /^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| (.+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m,
  execution: /^\*\*Execution:\*\* (.+)$/m,
  stepDescription: /^(\d+)\. \*\*(.+?)\*\* -- (.+)$/m,
}
```

**Output Type:**
```typescript
interface ChainCompilationParsed {
  title: string | null;                    // "Build User Authentication"
  request: string | null;                  // "Add login and signup screens"
  source: string | null;                   // "code-and-review/ flow"
  steps: ChainStepParsed[] | null;         // Parsed table rows
  executionMode: string | null;            // "Sequential"
  stepDescriptions: StepDescription[] | null;  // Numbered list
  raw: string;                             // Full markdown text
  contractVersion: string;                 // "1.0"
}

interface ChainStepParsed {
  stepNumber: number;                      // 1, 2
  action: string;                          // "analyze/", "code/"
  model: ModelString | null;               // "sonnet", "opus"
  keyInputs: string | null;                // "auth requirements", "analysis results"
  waitsFor: string | null;                 // "--", "#1"
  status: StatusString | null;             // "Pending"
}
```

**Parser Logic:**
```typescript
export function parseChainCompilation(text: string): ChainCompilationParsed | null {
  // 1. Quick detection
  if (!ChainPatterns.chainCompilation.heading.test(text)) {
    return null;
  }

  // 2. Extract fields
  const titleMatch = text.match(ChainPatterns.chainCompilation.heading);
  const requestMatch = text.match(ChainPatterns.chainCompilation.request);
  const sourceMatch = text.match(ChainPatterns.chainCompilation.source);
  const executionMatch = text.match(ChainPatterns.chainCompilation.execution);

  // Extract table rows (helper function)
  const steps = parseChainTableRows(text);

  // Extract step descriptions (helper function)
  const stepDescriptions = parseStepDescriptions(text);

  // 3. Build parsed object
  return {
    title: titleMatch?.[1] || null,
    request: requestMatch?.[1] || null,
    source: sourceMatch?.[1] || null,
    steps,
    executionMode: executionMatch?.[1] || null,
    stepDescriptions,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };
}

function parseChainTableRows(text: string): ChainStepParsed[] | null {
  const lines = text.split('\n');
  const rows: ChainStepParsed[] = [];

  for (const line of lines) {
    const match = line.match(ChainPatterns.chainCompilation.tableRow);
    if (match) {
      rows.push({
        stepNumber: parseInt(match[1], 10),
        action: match[2],
        model: match[3] as ModelString,
        keyInputs: match[4],
        waitsFor: match[5],
        status: match[6] as StatusString,
      });
    }
  }

  return rows.length > 0 ? rows : null;
}
```

**Edge Cases Handled:**
- Missing title → `title: null`
- No table rows → `steps: null`
- Missing execution mode → `executionMode: null`
- Partial table row match → Skipped (no parse error)
- Always preserves `raw` text for fallback rendering

---

## 3. Type Guard System

### 3.1 Generic Guard

**Location:** `packages/shared/src/contract/guards.ts`

```typescript
export function isParsedFormat(obj: unknown): obj is { raw: string; contractVersion: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'raw' in obj &&
    'contractVersion' in obj &&
    typeof (obj as any).raw === 'string' &&
    typeof (obj as any).contractVersion === 'string'
  );
}
```

### 3.2 Specific Guards

All guards follow pattern: `isParsedFormat(obj) && (key field checks)`

**Example:**
```typescript
export function isChainCompilationParsed(obj: unknown): obj is ChainCompilationParsed {
  return (
    isParsedFormat(obj) &&
    ('title' in obj || 'steps' in obj)  // At least one must exist
  );
}

export function isStepCompletionParsed(obj: unknown): obj is StepCompletionParsed {
  return (
    isParsedFormat(obj) &&
    'stepNumber' in obj &&
    'action' in obj &&
    'result' in obj &&
    'nextStep' in obj
  );
}
```

**Guard Coverage:** 17/17 formats (100%)

**Weakness:** Guards only check field *presence*, not structure. A field can exist but be `null` and still pass the guard.

---

## 4. Pattern Library

### 4.1 Pattern Structure

Each format has a dedicated pattern object with regex for all structural markers.

**Example: Step Completion Patterns**
```typescript
export const StepCompletionPatterns = {
  prefix: /^>> Step (\d+) complete: ([a-z\-_/]+) -- (.+)\. Continuing to Step ((\d+)|Done)\.\.\.$/m,
} as const;
```

**Example: Review Report Patterns**
```typescript
export const ReviewReportPatterns = {
  heading: /^# Review Report: (.+)$/m,
  verdict: /^## Verdict: (APPROVED|NEEDS_CHANGES)$/m,
  score: /^## Score: (\d+)%$/m,
  summaryHeading: /^## Summary$/m,
  findingsHeading: /^## Findings$/m,
  findingsTableHeader: /^\| # \| File \| Line \| Severity \| Description \| Suggestion \|$/m,
  findingRow: /^\| (\d+) \| (.+) \| (\d+) \| (critical|high|medium|low) \| (.+) \| (.+) \|$/m,
  fixesHeading: /^## Fixes Applied$/m,
  flagsHeading: /^## Flags for Human$/m,
} as const;
```

### 4.2 Pattern Coverage

| Category | Pattern Module | Formats Covered |
|----------|----------------|-----------------|
| Chain Management | `chainPatterns.ts` | 1.1-1.4 (4 formats) |
| Step Lifecycle | `stepPatterns.ts` | 2.1-2.3 (3 formats) |
| Human Interaction | `humanPatterns.ts` | 3.1-3.3 (3 formats) |
| Registry & Metadata | `registryPatterns.ts` | 4.1-4.3 (3 formats) |
| Action Outputs | `actionPatterns.ts` | 5.1-5.3 (3 formats) |
| Status & Errors | `statusPatterns.ts` | 6.1-6.2 (2 formats) |

**All 18 patterns** (17 formats + 1 approval prompt) defined.

### 4.3 Regex Complexity

**Simple (single-line match):**
- Step completion: `>> Step (\d+) complete: ...`
- Error heading: `## Error: (.+)`
- Registry file: `**File:** (.+)`

**Moderate (structured capture):**
- Table row: `| (\d+) | ([a-z\-_/]+) | (haiku|sonnet|opus) | ... |`
- Finding row: `| (\d+) | (.+) | (\d+) | (critical|high|medium|low) | ... |`

**Complex (multi-phase extraction):**
- Dual output (requires section-based extraction between labels)
- Brainstorm transcript (requires iterative question/response parsing)
- Analysis sections (requires accumulation until next heading)

---

## 5. Usage Analysis

### 5.1 Backend Usage

**File:** `packages/backend/src/services/harmonyDetector.ts`

**Function:** `checkOutput(text: string, sessionId: SessionId, context?: HarmonyCheckContext)`

**How it's used:**
```typescript
// Parse output using master parser
const parsed = parseOrchestratorOutput(text);

// Determine result
let result: HarmonyResult;
let parsedFormat: string | null = null;
let missingFields: string[] = [];

if (parsed === null) {
  // Format unknown - complete violation
  result = 'violation';
} else {
  // Format recognized - check for partial parse
  parsedFormat = this.getFormatName(parsed);
  missingFields = this.getMissingFields(parsed);

  if (missingFields.length > 0) {
    result = 'degraded';  // Some fields missing
  } else {
    result = 'valid';     // All fields present
  }
}
```

**What it does:**
1. Calls master parser on orchestrator output
2. If `null` → logs as "violation" (unknown format)
3. If parsed → checks for `null` fields
4. If `null` fields exist → logs as "degraded" (partial parse)
5. If no `null` fields → logs as "valid" (full parse)
6. Broadcasts harmony check event to WebSocket clients
7. Updates harmony metrics for session/project

**Issue:** `getFormatName()` logic duplicates type guard logic (should use guards instead).

### 5.2 Frontend Usage

**Finding:** Frontend does NOT import any contract parsers.

**Grep results:**
```bash
# No matches in packages/app/src for:
# - parseOrchestratorOutput
# - parseChainCompilation
# - Any specific parser imports
```

**Implication:** Layer 3 (dashboard frontend) likely performs its own manual parsing or relies on raw event data.

### 5.3 Event Flow

```
Orchestrator Output (text)
  ↓
Backend receives via POST /api/events
  ↓
Harmony Detector parses (parseOrchestratorOutput)
  ↓
Stores event + harmony check
  ↓
Broadcasts to WebSocket clients
  ↓
Frontend receives raw event (no parsing)
  ↓
Frontend renders (manual parsing? Layer 3 analysis needed)
```

**No server-side preprocessing** — Events stored and broadcast as-is. Parsing only happens in `harmonyDetector` for compliance monitoring.

---

## 6. Detailed Parser Inventory

### 6.1 Chain Management Parsers (1.x)

#### Format 1.1: Chain Compilation
- **File:** `chainParser.ts`
- **Function:** `parseChainCompilation(text: string): ChainCompilationParsed | null`
- **Input Detection:** `/^## Chain: (.+)$/m`
- **Extracts:**
  - Title from heading
  - Request, source, execution mode from bold labels
  - Table rows (step number, action, model, inputs, dependencies, status)
  - Step descriptions from numbered list
- **Output Fields:** `title`, `request`, `source`, `steps[]`, `executionMode`, `stepDescriptions[]`, `raw`, `contractVersion`
- **Edge Cases:**
  - Missing request/source → field is `null`
  - No table rows → `steps: null`
  - Malformed table row → skipped, no error
- **Usage:** P0 (highest priority in master parser)

#### Format 1.2: Chain Execution Start
- **Function:** `parseChainExecutionStart(text: string): ChainExecutionStartParsed | null`
- **Input Detection:** `/^## Executing: (.+)$/m`
- **Extracts:**
  - Chain title
  - Spawning step number, action, model from "Spawning Step N: action/ (model)..."
- **Output Fields:** `title`, `stepNumber`, `action`, `model`, `raw`, `contractVersion`
- **Usage:** P3 (after review reports, dual outputs, registry updates)

#### Format 1.3: Chain Status Update
- **Function:** `parseChainStatusUpdate(text: string): ChainStatusUpdateParsed | null`
- **Input Detection:** `/^## Chain Status: (.+)$/m`
- **Extracts:**
  - Chain title
  - Changes description
  - Updated table rows (reuses `parseChainTableRows`)
- **Output Fields:** `title`, `changes`, `steps[]`, `raw`, `contractVersion`
- **Usage:** P4 (low priority, rare format)

#### Format 1.4: Execution Complete
- **Function:** `parseExecutionComplete(text: string): ExecutionCompleteParsed | null`
- **Input Detection:** `/^## Done: (.+)$/m`
- **Extracts:**
  - Chain title
  - Completed steps table (number, action, status, result)
  - Logs path from `**Logs:** \`...\``
  - Learnings from `**Learnings:** ...`
- **Output Fields:** `title`, `steps[]`, `logsPath`, `learnings`, `raw`, `contractVersion`
- **Usage:** P4

---

### 6.2 Step Lifecycle Parsers (2.x)

#### Format 2.1: Step Completion
- **File:** `stepParser.ts`
- **Function:** `parseStepCompletion(text: string): StepCompletionParsed | null`
- **Input Detection:** `/^>> Step (\d+) complete: ([a-z\-_/]+) -- (.+)\. Continuing to Step ((\d+)|Done)\.\.\.$/m`
- **Extracts:** All from single regex (step number, action, result, next step)
- **Output Fields:** `stepNumber`, `action`, `result`, `nextStep`, `raw`, `contractVersion`
- **Edge Cases:**
  - `nextStep` can be number or "Done" (union type)
- **Usage:** P0 (second highest priority after chain compilation)

#### Format 2.2: Dual Output
- **Function:** `parseDualOutput(text: string): DualOutputParsed | null`
- **Input Detection:** `/^### Dual Output: ([a-z\-_/]+) \+ Second Opinion$/m`
- **Extracts:**
  - Step completion announcements (original + second opinion)
  - Heading with action name
  - Original result (text between labels)
  - Second opinion model, summary
  - Missed issues count, disagreements count, notable finding
  - Log paths for both reports
  - Next step
- **Output Fields:** `stepNumber`, `action`, `originalResult`, `secondOpinionModel`, `secondOpinionSummary`, `missedIssues`, `disagreements`, `notable`, `originalLogPath`, `critiqueLogPath`, `nextStep`, `raw`, `contractVersion`
- **Complexity:** Requires section-based extraction (find label positions, extract text between)
- **Usage:** P2

#### Format 2.3: Second Opinion Skip
- **Function:** `parseSecondOpinionSkip(text: string): SecondOpinionSkipParsed | null`
- **Input Detection:** `/^>> Step (\d+) complete: second-opinion\/ -- SKIPPED \((.+)\)\.$/m`
- **Extracts:**
  - Original step completion
  - Second opinion step number, skip reason
  - Next step
- **Output Fields:** `stepNumber`, `action`, `result`, `secondOpinionStep`, `skipReason`, `nextStep`, `raw`, `contractVersion`
- **Usage:** P4

---

### 6.3 Human Interaction Parsers (3.x)

#### Format 3.1: Human Gate
- **File:** `humanParser.ts`
- **Function:** `parseHumanGate(text: string): HumanGateParsed | null`
- **Input Detection:** `/^### Step (\d+): HUMAN GATE$/m`
- **Extracts:**
  - Step number from heading
  - Free-form content (no guaranteed structure)
  - Prompt (first line ending with "?")
- **Output Fields:** `stepNumber`, `content`, `prompt`, `raw`, `contractVersion`
- **Note:** No standardized format beyond heading marker
- **Usage:** P5 (low priority, rare)

#### Format 3.2: Learning Surface
- **Function:** `parseLearningSurface(text: string): LearningSurfaceParsed | null`
- **Input Detection:** `/^## Agent Learning$/m`
- **Extracts:**
  - Action and model from `**From:** action/ (model)`
  - Issue description (quoted)
  - Root cause (quoted)
  - Suggested fix
- **Output Fields:** `fromAction`, `fromModel`, `issue`, `rootCause`, `suggestedFix`, `raw`, `contractVersion`
- **Usage:** P2

#### Format 3.3: Session Start Protocol
- **Function:** `parseSessionStartProtocol(text: string): SessionStartProtocolParsed | null`
- **Input Detection:** `/^## Session Started$/m`
- **Extracts:**
  - Project name
  - Flow count, action count, past execution count
- **Output Fields:** `projectName`, `flowCount`, `actionCount`, `pastExecutionCount`, `raw`, `contractVersion`
- **Note:** Currently not produced by orchestrator (internal read only)
- **Usage:** P4

---

### 6.4 Registry & Metadata Parsers (4.x)

#### Format 4.1: Registry Update
- **File:** `registryParser.ts`
- **Function:** `parseRegistryUpdate(text: string): RegistryUpdateParsed | null`
- **Input Detection:** `/^## Registry Update: (.+)$/m`
- **Extracts:**
  - Update title
  - File name (INDEX.md, FLOWS.md, etc.)
  - Action (added, removed, updated)
  - Line content
- **Output Fields:** `title`, `file`, `action`, `line`, `raw`, `contractVersion`
- **Usage:** P2

#### Format 4.2: Index Entry
- **Function:** `parseIndexEntry(text: string): IndexEntryParsed | null`
- **Input Detection:** Table row format `| YYYY-MM-DD | ... | ... | Status — metrics (hash) |`
- **Extracts:**
  - Date, description, pattern (action sequence signature)
  - Outcome string (status + metrics + commit)
  - Parsed success flag, metrics, commit hash
- **Output Fields:** `date`, `description`, `pattern`, `outcome`, `success`, `metrics`, `commitHash`, `raw`, `contractVersion`
- **Usage:** P3

#### Format 4.3: Learning Entry
- **Function:** `parseLearningEntry(text: string): LearningEntryParsed | null`
- **Input Detection:** `/^### ([A-Z][a-z]+)$/m` (action type heading)
- **Extracts:**
  - Action type, issue title
  - Context, problem, root cause, solution
  - Date, source (action in chain)
- **Output Fields:** `actionType`, `issueTitle`, `context`, `problem`, `rootCause`, `solution`, `date`, `source`, `raw`, `contractVersion`
- **Usage:** P4

---

### 6.5 Action Output Parsers (5.x)

#### Format 5.1: Review Report
- **File:** `actionParser.ts`
- **Function:** `parseReviewReport(text: string): ReviewReportParsed | null`
- **Input Detection:** `/^# Review Report: (.+)$/m`
- **Extracts:**
  - Scope, verdict (APPROVED | NEEDS_CHANGES), score (0-100)
  - Summary (text between headings)
  - Findings table (number, file, line, severity, description, suggestion)
  - Fixes table (file, fix)
  - Flags table (issue, reason)
- **Output Fields:** `scope`, `verdict`, `score`, `summary`, `findings[]`, `fixesApplied[]`, `flagsForHuman[]`, `raw`, `contractVersion`
- **Complexity:** Multiple table parsing + section extraction
- **Usage:** P1 (high priority)

#### Format 5.2: Analysis Report
- **Function:** `parseAnalysisReport(text: string): AnalysisReportParsed | null`
- **Input Detection:** `/^\*\*Aspect:\*\* (coverage|dependencies|structure|drift|inventory|impact)$/m`
- **Extracts:**
  - Title, aspect, scope, date
  - Numbered sections (iterative parsing, accumulate content until next heading)
  - Recommendations (bulleted list)
- **Output Fields:** `title`, `aspect`, `scope`, `date`, `sections[]`, `recommendations[]`, `raw`, `contractVersion`
- **Complexity:** Iterative section parsing
- **Usage:** P3

#### Format 5.3: Brainstorm Transcript
- **Function:** `parseBrainstormTranscript(text: string): BrainstormTranscriptParsed | null`
- **Input Detection:** `/^# Brainstorming Session: (.+)$/m`
- **Extracts:**
  - Idea, classification (Technical | Functional | Framework)
  - Initial context
  - Questions and responses (iterative parsing)
  - Key insights, potential issues, next steps, open questions (bulleted/numbered lists)
  - Duration, depth, consensus
- **Output Fields:** `idea`, `classification`, `initialContext`, `questions[]`, `keyInsights[]`, `potentialIssues[]`, `suggestedNextSteps[]`, `openQuestions[]`, `duration`, `depth`, `consensus`, `raw`, `contractVersion`
- **Complexity:** Highest complexity (multiple iterative parsers, section extraction helpers)
- **Usage:** P5 (lowest priority, rare)

---

### 6.6 Status & Error Parsers (6.x)

#### Format 6.1: Error Announcement
- **File:** `statusParser.ts`
- **Function:** `parseErrorAnnouncement(text: string): ErrorAnnouncementParsed | null`
- **Input Detection:** `/^## Error: (.+)$/m`
- **Extracts:**
  - Error title, step number, action
  - Message, context
  - Stack trace (text between markers)
  - Recovery options (bulleted list)
- **Output Fields:** `title`, `stepNumber`, `action`, `message`, `context`, `stackTrace`, `recoveryOptions[]`, `raw`, `contractVersion`
- **Usage:** P1 (high priority)

#### Format 6.2: Context Routing
- **Function:** `parseContextRouting(text: string): ContextRoutingParsed | null`
- **Input Detection:** `/^## Routing: (.+)$/m`
- **Extracts:**
  - Request brief
  - Context (workbench ID)
  - Confidence (0.0-1.0)
  - Flow name, actions list
  - Disambiguated flag (boolean)
- **Output Fields:** `request`, `context`, `confidence`, `flow`, `actions[]`, `disambiguated`, `raw`, `contractVersion`
- **Usage:** P5

---

## 7. Contract Version System

**File:** `packages/shared/src/contract/version.ts`

**Current Version:** `1.0`

**Version Record:**
```typescript
export const CONTRACT_VERSIONS = {
  '1.0': {
    date: '2026-02-08',
    description: 'Initial contract specification with 17 formats',
    breaking: false,
  },
} as const;
```

**Utilities:**
- `isSupportedVersion(version: string): boolean` — Check if version exists
- `getLatestVersion(): string` — Returns latest version key

**Usage:**
- Every parsed object includes `contractVersion: CONTRACT_VERSION`
- Allows future versioning and migration logic

**Forward Compatibility Plan:**
- Increment `CONTRACT_VERSION` when changing format structure
- Add new version to `CONTRACT_VERSIONS`
- Mark `breaking: true` if backward-incompatible
- Dashboard can detect version and render accordingly

---

## 8. Issues & Gaps

### 8.1 Unused Parsers

**Finding:** Frontend doesn't import any contract parsers.

**Evidence:**
- Grep search for parser imports in `packages/app/src` → 0 results
- Only usage: `harmonyDetector.ts` in backend

**Implication:**
- Layer 3 (frontend) likely parses manually or uses raw event data
- Shared contract layer is under-utilized
- Potential duplication between backend parser and frontend logic

**Recommendation:** Audit Layer 3 (frontend) to:
1. Confirm if manual parsing exists
2. Identify overlap with shared parsers
3. Migrate to shared parsers if possible
4. Document if manual parsing is intentional

---

### 8.2 Type Guards Are Weak

**Issue:** Guards only check field *presence*, not structure.

**Example:**
```typescript
export function isStepCompletionParsed(obj: unknown): obj is StepCompletionParsed {
  return (
    isParsedFormat(obj) &&
    'stepNumber' in obj &&    // Could be null
    'action' in obj &&        // Could be null
    'result' in obj &&        // Could be null
    'nextStep' in obj         // Could be null
  );
}
```

**Problem:**
```typescript
const obj = {
  stepNumber: null,
  action: null,
  result: null,
  nextStep: null,
  raw: "...",
  contractVersion: "1.0"
};

isStepCompletionParsed(obj)  // ✅ Returns true!
```

**Risk:** Type guard passes even if all fields are `null` (degraded parse).

**Solution Options:**
1. Add `null` checks to guards (strict mode)
2. Create separate guards: `isStepCompletionParsedStrict`, `isStepCompletionParsedPartial`
3. Add `isValid` field to parsed types
4. Document that guards allow `null` fields (current implicit behavior)

---

### 8.3 No Zod Validation

**Status:** Documented as Phase 1 decision (manual validation only).

**Comment from code:**
```typescript
// 4. Validate (manual validation, no Zod in Phase 1)
if (!parsed.title && !parsed.steps) {
  console.warn('Chain compilation parsing incomplete: missing title and steps');
}
```

**Current Behavior:**
- Parsers log warnings to console
- Always return parsed object (even if incomplete)
- No runtime schema validation

**Future Enhancement:** Phase 2 could add Zod schemas for strict validation.

---

### 8.4 Harmony Detector Duplication

**Issue:** `getFormatName()` logic duplicates type guard logic.

**Code Location:** `harmonyDetector.ts:199-222`

**Current Implementation:**
```typescript
private getFormatName(parsed: any): string {
  if ('title' in parsed && 'steps' in parsed) return 'ChainCompilation';
  if ('stepNumber' in parsed && 'action' in parsed && 'result' in parsed) return 'StepCompletion';
  // ... 15 more conditionals
  return 'Unknown';
}
```

**Problem:**
- Manually checks field presence (same logic as type guards)
- Must be updated when guards change
- No reuse of existing guards

**Solution:**
```typescript
import {
  isChainCompilationParsed,
  isStepCompletionParsed,
  // ... all guards
} from '@afw/shared';

private getFormatName(parsed: any): string {
  if (isChainCompilationParsed(parsed)) return 'ChainCompilation';
  if (isStepCompletionParsed(parsed)) return 'StepCompletion';
  // ... use guards
  return 'Unknown';
}
```

---

### 8.5 No Defined But Unused Types

**Check:** Are there types defined but no parser produces them?

**Analysis:**
- All 17 types in `types/` have corresponding parsers in `parsers/`
- All parsers return their defined types
- No orphaned types detected

**Result:** ✅ All types have parsers.

---

### 8.6 No Defined But Unused Parsers

**Check:** Are there parsers that exist but are never imported/used?

**Analysis:**
- Master parser (`parseOrchestratorOutput`) calls all 17 parsers
- Harmony detector imports and uses master parser
- All individual parsers are exported from `contract/index.ts`
- Frontend doesn't import (Layer 3 issue, not parser issue)

**Result:** ✅ All parsers are callable via master parser.

---

### 8.7 Partial Parse Handling

**Current Behavior:**
- Parsers return objects with `null` fields
- No `isValid` or `isPartial` flag
- Consumers must check each field individually

**Example:**
```typescript
const parsed = parseChainCompilation(text);
if (parsed) {
  // Could be partial parse — check fields
  if (parsed.title && parsed.steps) {
    // Full parse
  } else {
    // Partial parse — use fallback
  }
}
```

**Enhancement Options:**
1. Add `isComplete: boolean` field to all types
2. Add `missingFields: string[]` field
3. Separate types: `ChainCompilationParsedFull` vs `ChainCompilationParsedPartial`
4. Current approach (nullable fields) is sufficient

**Current Design Decision:** Nullable fields + `raw` fallback is intentional for graceful degradation.

---

### 8.8 Error/Warning Output

**Current Logging:**
- Parsers log warnings to console: `console.warn(...)`
- No structured error collection
- No metrics on parse failures

**Enhancement Options:**
1. Return `{ parsed, warnings: string[] }` instead of just parsed object
2. Emit parse events (success/fail/partial) for monitoring
3. Add `parseMetrics` to harmony checks

---

## 9. Contract → Dashboard Flow

### 9.1 Expected Flow

```
1. Orchestrator outputs text
   ↓
2. Backend receives via POST /api/events
   ↓
3. Harmony detector parses with parseOrchestratorOutput
   ↓
4. Stores harmony check (valid/degraded/violation)
   ↓
5. Stores raw event (no parsing)
   ↓
6. Broadcasts event to WebSocket
   ↓
7. Frontend receives raw event
   ↓
8. Frontend parses with shared contract parsers (expected)
   ↓
9. Dashboard renders structured UI
```

### 9.2 Actual Flow (Layer 3 Analysis Needed)

```
1. Orchestrator outputs text
   ↓
2. Backend receives via POST /api/events
   ↓
3. Harmony detector parses (monitoring only)
   ↓
4. Stores raw event
   ↓
5. Broadcasts raw event
   ↓
6. Frontend receives raw event
   ↓
7. Frontend parses with ??? (manual logic? Layer 3 unknown)
   ↓
8. Dashboard renders
```

**Layer 3 Question:** Does frontend use:
- Shared contract parsers?
- Manual regex in components?
- Raw text rendering?
- Hybrid approach?

---

## 10. Recommendations

### 10.1 Immediate

1. **Audit Layer 3 (frontend)** — Determine if/how frontend parses orchestrator output
2. **Fix harmony detector duplication** — Use type guards instead of manual field checks
3. **Document guard behavior** — Clarify that guards allow `null` fields (partial parses)
4. **Add usage metrics** — Track which parsers are actually called (via master parser)

### 10.2 Short-Term

5. **Frontend migration** — If frontend has manual parsing, migrate to shared contract parsers
6. **Add strict guards** — Create `isXYZParsedStrict` variants that reject `null` fields
7. **Enhance logging** — Add structured parse warnings/errors (not just console.warn)
8. **Test coverage** — Add unit tests for all 17 parsers (edge cases, malformed input)

### 10.3 Long-Term (Phase 2)

9. **Zod schemas** — Add runtime validation for strict parsing mode
10. **Parse metrics** — Emit parse success/failure events for monitoring
11. **Version migration** — Implement parser version detection and migration logic
12. **Performance optimization** — Profile master parser priority order, adjust based on actual usage

---

## 11. Summary Matrix

### Parser Completeness

| Component | Status | Coverage | Notes |
|-----------|--------|----------|-------|
| Types | ✅ Complete | 17/17 | All formats defined |
| Patterns | ✅ Complete | 18/18 | Includes approval prompt |
| Parsers | ✅ Complete | 17/17 | All formats implemented |
| Guards | ✅ Complete | 17/17 | All types have guards |
| Documentation | ✅ Complete | README.md | Usage examples provided |
| Tests | ❌ Missing | 0/17 | No unit tests found |
| Frontend Usage | ⚠️ Unknown | ? | Layer 3 analysis needed |
| Metrics | ❌ Missing | N/A | No parse success/failure tracking |

### Quality Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| Parser Coverage | 100% | All 17 formats implemented |
| Type Guard Coverage | 100% | All types have guards |
| Graceful Degradation | ✅ Yes | Nullable fields + raw fallback |
| Error Handling | ⚠️ Partial | Console warnings only |
| Documentation | ✅ Good | README + inline comments |
| Test Coverage | ❌ 0% | No tests |
| Usage Tracking | ❌ No | Unknown which parsers are actually used |
| Frontend Integration | ⚠️ Unknown | Layer 3 needed |

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Frontend not using parsers | Medium | Audit Layer 3, migrate if needed |
| Weak type guards | Low | Document behavior, add strict variants |
| No test coverage | Medium | Add unit tests for edge cases |
| Harmony detector duplication | Low | Refactor to use guards |
| No parse metrics | Low | Add structured logging |
| Missing Zod validation | Low | Phase 2 enhancement |

---

## Appendix A: Complete Parser Reference

### A.1 Chain Management (1.x)

| Format | Parser | Priority | Input Marker | Key Fields |
|--------|--------|----------|--------------|------------|
| 1.1 | `parseChainCompilation` | P0 | `## Chain:` | title, steps[], source |
| 1.2 | `parseChainExecutionStart` | P3 | `## Executing:` | title, stepNumber, action |
| 1.3 | `parseChainStatusUpdate` | P4 | `## Chain Status:` | title, changes, steps[] |
| 1.4 | `parseExecutionComplete` | P4 | `## Done:` | title, steps[], logsPath |

### A.2 Step Lifecycle (2.x)

| Format | Parser | Priority | Input Marker | Key Fields |
|--------|--------|----------|--------------|------------|
| 2.1 | `parseStepCompletion` | P0 | `>> Step N complete:` | stepNumber, result, nextStep |
| 2.2 | `parseDualOutput` | P2 | `### Dual Output:` | originalResult, secondOpinionSummary |
| 2.3 | `parseSecondOpinionSkip` | P4 | `SKIPPED (...)` | skipReason |

### A.3 Human Interaction (3.x)

| Format | Parser | Priority | Input Marker | Key Fields |
|--------|--------|----------|--------------|------------|
| 3.1 | `parseHumanGate` | P5 | `HUMAN GATE` | stepNumber, prompt |
| 3.2 | `parseLearningSurface` | P2 | `## Agent Learning` | issue, rootCause, suggestedFix |
| 3.3 | `parseSessionStartProtocol` | P4 | `## Session Started` | projectName, flowCount |

### A.4 Registry & Metadata (4.x)

| Format | Parser | Priority | Input Marker | Key Fields |
|--------|--------|----------|--------------|------------|
| 4.1 | `parseRegistryUpdate` | P2 | `## Registry Update:` | file, action, line |
| 4.2 | `parseIndexEntry` | P3 | Table row format | date, pattern, commitHash |
| 4.3 | `parseLearningEntry` | P4 | `### [ActionType]` | issueTitle, solution, source |

### A.5 Action Outputs (5.x)

| Format | Parser | Priority | Input Marker | Key Fields |
|--------|--------|----------|--------------|------------|
| 5.1 | `parseReviewReport` | P1 | `# Review Report:` | verdict, score, findings[] |
| 5.2 | `parseAnalysisReport` | P3 | `**Aspect:**` | aspect, sections[], recommendations[] |
| 5.3 | `parseBrainstormTranscript` | P5 | `# Brainstorming Session:` | questions[], keyInsights[] |

### A.6 Status & Errors (6.x)

| Format | Parser | Priority | Input Marker | Key Fields |
|--------|--------|----------|--------------|------------|
| 6.1 | `parseErrorAnnouncement` | P1 | `## Error:` | message, recoveryOptions[] |
| 6.2 | `parseContextRouting` | P5 | `## Routing:` | context, confidence, flow |

---

## Appendix B: Type Definitions (Condensed)

```typescript
// All parsed types include:
interface BaseParsed {
  raw: string;              // Full input text (always present)
  contractVersion: string;  // "1.0" (always present)
  // ... format-specific fields (nullable)
}

// Example: Chain Compilation
interface ChainCompilationParsed extends BaseParsed {
  title: string | null;
  request: string | null;
  source: string | null;
  steps: ChainStepParsed[] | null;
  executionMode: string | null;
  stepDescriptions: StepDescription[] | null;
}

// Example: Step Completion
interface StepCompletionParsed extends BaseParsed {
  stepNumber: number | null;
  action: string | null;
  result: string | null;
  nextStep: number | string | null;  // Union: number or "Done"
}

// Example: Review Report
interface ReviewReportParsed extends BaseParsed {
  scope: string | null;
  verdict: 'APPROVED' | 'NEEDS_CHANGES' | null;
  score: number | null;
  summary: string | null;
  findings: ReviewFinding[] | null;
  fixesApplied: ReviewFix[] | null;
  flagsForHuman: ReviewFlag[] | null;
}
```

---

## Appendix C: Regex Pattern Examples

```typescript
// Simple single-line match
ChainPatterns.chainCompilation.heading = /^## Chain: (.+)$/m;

// Table row with multiple captures
ChainPatterns.chainCompilation.tableRow =
  /^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| (.+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m;

// Step completion (all in one)
StepPatterns.stepCompletion.prefix =
  /^>> Step (\d+) complete: ([a-z\-_/]+) -- (.+)\. Continuing to Step ((\d+)|Done)\.\.\.$/m;

// Review verdict with enum
ReviewPatterns.verdict = /^## Verdict: (APPROVED|NEEDS_CHANGES)$/m;

// Context routing with workbench IDs
ContextPatterns.context =
  /^\*\*Context:\*\* (work|maintenance|explore|review|settings|pm|archive|harmony|editor)$/mi;
```

---

**End of Layer 2 Analysis**
