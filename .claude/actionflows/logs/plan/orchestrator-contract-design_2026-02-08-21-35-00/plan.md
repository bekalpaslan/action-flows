# Orchestrator Output Contract Design Plan

**Date:** 2026-02-08 21:35:00
**Type:** Architecture Spec + Implementation Roadmap
**Scope:** Complete contract specification for all orchestrator output formats
**Agent:** plan/

---

## Executive Summary

This plan defines the **Orchestrator Output Contract** — a formal specification of every output format the ActionFlows orchestrator produces. The contract serves as:

1. **Source of truth** for dashboard parsing (what formats exist, what fields are required)
2. **Validation target** for harmony detection (is orchestrator output still parseable?)
3. **Teaching material** for the onboarding questionnaire (what patterns are sacred?)
4. **Type safety foundation** for backend/frontend code (compile-time guarantees)

The contract is **both manually defined AND auto-validated** — TypeScript types provide compile-time safety, Zod schemas enable runtime validation, and harmony detection ensures the orchestrator's actual output stays compliant.

---

## Design Principles

### 1. Progressive Enhancement Architecture

The contract supports **three levels of parsing**:

| Level | Purpose | Implementation |
|-------|---------|----------------|
| **L1: Detection** | "Is this format present?" | Regex patterns for quick matching |
| **L2: Extraction** | "What are the key fields?" | Zod schemas for structure validation |
| **L3: Consumption** | "How do I render this?" | TypeScript interfaces for type-safe usage |

This allows the dashboard to:
- Detect formats quickly (L1) for routing
- Validate structure (L2) for error handling
- Render safely (L3) for visualization

### 2. Graceful Degradation

Following the existing event system pattern (see `packages/shared/src/events.ts`), all parsed fields are **nullable by default**. If the orchestrator produces malformed output, the dashboard degrades gracefully instead of crashing.

**Example:**
```typescript
interface ChainCompilationParsed {
  title: string | null;           // Parsed from "## Chain: {title}"
  request: string | null;          // Parsed from "**Request:** {text}"
  steps: ChainStepParsed[] | null; // Parsed from table
  // If parsing fails, all fields are null
  // Dashboard shows "Chain compilation detected (parsing failed)"
}
```

### 3. Version-Aware Contract

The contract includes a **version marker** that the orchestrator embeds in its output. This allows:
- Incremental evolution of output formats
- Backward compatibility with old outputs
- Detection of orchestrator/dashboard version mismatches

**Format:**
```markdown
<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Feature Implementation
...
```

Parser checks version and routes to appropriate schema.

### 4. Single Source of Truth

The contract definitions live in **one place**: `packages/shared/src/contract/`. Both backend and frontend import from this package, ensuring consistency.

---

## File Structure

### Directory Layout

```
packages/shared/src/contract/
├── index.ts                    # Re-exports all contract types
├── version.ts                  # Contract version constant
├── types/                      # TypeScript interfaces by category
│   ├── index.ts
│   ├── chainFormats.ts         # Format 1.x: Chain management
│   ├── stepFormats.ts          # Format 2.x: Step lifecycle
│   ├── humanFormats.ts         # Format 3.x: Human interaction
│   ├── registryFormats.ts      # Format 4.x: Registry & metadata
│   ├── actionFormats.ts        # Format 5.x: Action outputs
│   └── statusFormats.ts        # Format 6.x: Errors & routing
├── schemas/                    # Zod validation schemas
│   ├── index.ts
│   ├── chainSchemas.ts
│   ├── stepSchemas.ts
│   ├── humanSchemas.ts
│   ├── registrySchemas.ts
│   ├── actionSchemas.ts
│   └── statusSchemas.ts
├── patterns/                   # Regex patterns for detection
│   ├── index.ts
│   ├── chainPatterns.ts
│   ├── stepPatterns.ts
│   ├── humanPatterns.ts
│   ├── registryPatterns.ts
│   ├── actionPatterns.ts
│   └── statusPatterns.ts
├── parsers/                    # Parser implementations
│   ├── index.ts
│   ├── chainParser.ts
│   ├── stepParser.ts
│   ├── humanParser.ts
│   ├── registryParser.ts
│   ├── actionParser.ts
│   └── statusParser.ts
├── guards.ts                   # Type guard functions
└── README.md                   # Human-readable contract doc

.claude/actionflows/
└── CONTRACT.md                 # Authoritative contract document (markdown)
```

### Why This Structure?

- **By category (not by format ID)**: Groups related formats together (all chain formats in one file)
- **Parallel organization**: types/, schemas/, patterns/, parsers/ mirror each other for easy navigation
- **Flat within categories**: Each category file contains 3-5 related formats (not nested further)
- **Central re-export**: `contract/index.ts` provides one-stop import for consumers

---

## Contract Spec Format

### TypeScript Interfaces (types/)

**Purpose:** Compile-time type safety for dashboard components and backend handlers

**Pattern:**
```typescript
// packages/shared/src/contract/types/chainFormats.ts

/**
 * Format 1.1: Chain Compilation Table
 * When produced: Orchestrator compiles chain and presents for approval
 * ORCHESTRATOR.md reference: lines 315-334
 */
export interface ChainCompilationParsed {
  /** Chain title from "## Chain: {title}" */
  title: string | null;

  /** Human's original request from "**Request:** {text}" */
  request: string | null;

  /** Source (flow name | "Composed from: ..." | "Meta-task") */
  source: string | null;

  /** Parsed steps from markdown table */
  steps: ChainStepParsed[] | null;

  /** Execution mode (Sequential | Parallel: [...] | Single step) */
  executionMode: string | null;

  /** Step descriptions from "What each step does" section */
  stepDescriptions: StepDescription[] | null;

  /** Raw markdown text (always available for fallback rendering) */
  raw: string;

  /** Version of contract used to parse this */
  contractVersion: string;
}

export interface ChainStepParsed {
  stepNumber: number;
  action: string;           // e.g., "analyze/"
  model: ModelString | null;
  keyInputs: string | null;
  waitsFor: string | null;  // "--" or "#1,#2"
  status: StatusString | null;
}

export interface StepDescription {
  stepNumber: number;
  action: string;
  description: string;
}
```

**Key Design Decisions:**
- All fields nullable except `raw` and `contractVersion` (fallback data)
- Enums imported from existing `packages/shared/src/types.ts` (ModelString, StatusString)
- JSDoc comments reference ORCHESTRATOR.md line numbers for traceability
- Interfaces named with `Parsed` suffix to distinguish from domain models (e.g., `Chain`)

### Zod Schemas (schemas/)

**Purpose:** Runtime validation, safe parsing from string input

**Pattern:**
```typescript
// packages/shared/src/contract/schemas/chainSchemas.ts

import { z } from 'zod';
import { Model, Status } from '../types.js';

/** Zod schema for ChainStepParsed */
export const ChainStepParsedSchema = z.object({
  stepNumber: z.number().int().positive(),
  action: z.string().regex(/^[a-z-]+\/$/),
  model: z.nativeEnum(Model).nullable(),
  keyInputs: z.string().nullable(),
  waitsFor: z.string().nullable(),
  status: z.nativeEnum(Status).nullable(),
});

/** Zod schema for ChainCompilationParsed */
export const ChainCompilationParsedSchema = z.object({
  title: z.string().nullable(),
  request: z.string().nullable(),
  source: z.string().nullable(),
  steps: z.array(ChainStepParsedSchema).nullable(),
  executionMode: z.string().nullable(),
  stepDescriptions: z.array(z.object({
    stepNumber: z.number().int().positive(),
    action: z.string(),
    description: z.string(),
  })).nullable(),
  raw: z.string(),
  contractVersion: z.string(),
});

/** Type inference from schema (ensures schema matches interface) */
export type ChainCompilationParsed = z.infer<typeof ChainCompilationParsedSchema>;
```

**Key Design Decisions:**
- Use `z.nativeEnum()` for existing enums (Model, Status) to avoid duplication
- Schemas are the **single source of truth** for structure (interfaces inferred via `z.infer`)
- Nullable fields use `.nullable()` not `.optional()` (explicit null vs undefined)
- Regex patterns embedded in schema for validation (e.g., `action: /^[a-z-]+\/$/`)

### Regex Patterns (patterns/)

**Purpose:** Fast detection without full parsing (Level 1)

**Pattern:**
```typescript
// packages/shared/src/contract/patterns/chainPatterns.ts

/**
 * Regex patterns for detecting chain formats
 * Used by harmony detection and message routing
 */
export const ChainPatterns = {
  /** Format 1.1: Chain Compilation Table */
  chainCompilation: {
    heading: /^## Chain: (.+)$/m,
    request: /^\*\*Request:\*\* (.+)$/m,
    source: /^\*\*Source:\*\* (.+)$/m,
    tableHeader: /^\| # \| Action \| Model \| Key Inputs \| Waits For \| Status \|$/m,
    tableRow: /^\| (\d+) \| ([a-z-\/]+) \| (haiku|sonnet|opus) \| (.+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m,
    execution: /^\*\*Execution:\*\* (.+)$/m,
    stepDescription: /^(\d+)\. \*\*(.+?)\*\* -- (.+)$/m,
    approvalPrompt: /^Execute\?$/m,
  },

  /** Format 1.2: Chain Execution Start */
  chainExecutionStart: {
    heading: /^## Executing: (.+)$/m,
    spawning: /^Spawning Step (\d+): ([a-z-\/]+) \((haiku|sonnet|opus)\)\.\.\.$/m,
  },

  /** Format 1.4: Execution Complete Summary */
  executionComplete: {
    heading: /^## Done: (.+)$/m,
    tableHeader: /^\| # \| Action \| Status \| Result \|$/m,
    logs: /^\*\*Logs:\*\* `(.+)`$/m,
    learnings: /^\*\*Learnings:\*\* (.+)$/m,
  },
} as const;
```

**Key Design Decisions:**
- Patterns grouped by format (nested object structure)
- Named captures avoided in favor of numbered groups (simpler for consumers)
- Multiline mode (`/m`) for matching within larger text blocks
- Exported as `const` for readonly guarantee

### Parsers (parsers/)

**Purpose:** Extract structured data from orchestrator output

**Pattern:**
```typescript
// packages/shared/src/contract/parsers/chainParser.ts

import type { ChainCompilationParsed } from '../types/chainFormats.js';
import { ChainCompilationParsedSchema } from '../schemas/chainSchemas.js';
import { ChainPatterns } from '../patterns/chainPatterns.js';
import { CONTRACT_VERSION } from '../version.js';

/**
 * Parse a chain compilation table from orchestrator output
 *
 * @param text - Raw markdown text containing chain compilation
 * @returns Parsed structure, or null if format not detected
 */
export function parseChainCompilation(text: string): ChainCompilationParsed | null {
  // 1. Quick detection (Level 1)
  if (!ChainPatterns.chainCompilation.heading.test(text)) {
    return null; // Not a chain compilation format
  }

  // 2. Extract fields (Level 2)
  const titleMatch = text.match(ChainPatterns.chainCompilation.heading);
  const requestMatch = text.match(ChainPatterns.chainCompilation.request);
  const sourceMatch = text.match(ChainPatterns.chainCompilation.source);
  const executionMatch = text.match(ChainPatterns.chainCompilation.execution);

  // Extract table rows
  const steps = parseChainTableRows(text);

  // Extract step descriptions
  const stepDescriptions = parseStepDescriptions(text);

  // 3. Build parsed object
  const parsed: ChainCompilationParsed = {
    title: titleMatch?.[1] || null,
    request: requestMatch?.[1] || null,
    source: sourceMatch?.[1] || null,
    steps,
    executionMode: executionMatch?.[1] || null,
    stepDescriptions,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod (Level 2)
  const result = ChainCompilationParsedSchema.safeParse(parsed);
  if (!result.success) {
    console.warn('Chain compilation parsing failed validation:', result.error);
    // Return partial parse with nulls for invalid fields
    return { ...parsed, contractVersion: CONTRACT_VERSION };
  }

  return result.data;
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

function parseStepDescriptions(text: string): StepDescription[] | null {
  const lines = text.split('\n');
  const descriptions: StepDescription[] = [];

  for (const line of lines) {
    const match = line.match(ChainPatterns.chainCompilation.stepDescription);
    if (match) {
      descriptions.push({
        stepNumber: parseInt(match[1], 10),
        action: match[2],
        description: match[3],
      });
    }
  }

  return descriptions.length > 0 ? descriptions : null;
}
```

**Key Design Decisions:**
- Parsers return `null` (not `undefined`) for undetected formats
- Validation failures return **partial parses** (all nullable fields = null, raw text preserved)
- Helper functions (parseChainTableRows, parseStepDescriptions) keep main parser clean
- All parsers follow same 4-step pattern: detect → extract → build → validate

### Type Guards (guards.ts)

**Purpose:** Runtime type narrowing for TypeScript

**Pattern:**
```typescript
// packages/shared/src/contract/guards.ts

import type { ChainCompilationParsed, ChainExecutionStartParsed } from './types/index.js';

/**
 * Type guard: check if object is ChainCompilationParsed
 */
export function isChainCompilationParsed(obj: unknown): obj is ChainCompilationParsed {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'contractVersion' in obj &&
    'raw' in obj &&
    ('title' in obj || 'steps' in obj) // At least one parsed field
  );
}

/**
 * Type guard: check if object is ChainExecutionStartParsed
 */
export function isChainExecutionStartParsed(obj: unknown): obj is ChainExecutionStartParsed {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'contractVersion' in obj &&
    'raw' in obj &&
    'title' in obj
  );
}

// ... (similar guards for other formats)

/**
 * Generic parser result guard
 */
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

---

## 17 Contract Formats — Type Definitions

Below are the complete TypeScript interface signatures for all 17 formats. Detailed implementations follow in subsequent sections.

### Category 1: Chain Management (4 formats)

```typescript
// Format 1.1: Chain Compilation Table
export interface ChainCompilationParsed {
  title: string | null;
  request: string | null;
  source: string | null;
  steps: ChainStepParsed[] | null;
  executionMode: string | null;
  stepDescriptions: StepDescription[] | null;
  raw: string;
  contractVersion: string;
}

// Format 1.2: Chain Execution Start
export interface ChainExecutionStartParsed {
  title: string | null;
  stepNumber: number | null;
  action: string | null;
  model: ModelString | null;
  raw: string;
  contractVersion: string;
}

// Format 1.3: Chain Status Update
export interface ChainStatusUpdateParsed {
  title: string | null;
  changes: string | null;
  steps: ChainStepParsed[] | null;
  raw: string;
  contractVersion: string;
}

// Format 1.4: Execution Complete Summary
export interface ExecutionCompleteParsed {
  title: string | null;
  steps: CompletedStepSummary[] | null;
  logsPath: string | null;
  learnings: string | null;
  raw: string;
  contractVersion: string;
}
```

### Category 2: Step Lifecycle (3 formats)

```typescript
// Format 2.1: Step Completion Announcement
export interface StepCompletionParsed {
  stepNumber: number | null;
  action: string | null;
  result: string | null;
  nextStep: number | string | null; // number or "Done"
  raw: string;
  contractVersion: string;
}

// Format 2.2: Dual Output (Action + Second Opinion)
export interface DualOutputParsed {
  stepNumber: number | null;
  action: string | null;
  originalResult: string | null;
  secondOpinionModel: string | null;
  secondOpinionSummary: string | null;
  missedIssues: number | null;
  disagreements: number | null;
  notable: string | null;
  originalLogPath: string | null;
  critiqueLogPath: string | null;
  nextStep: number | null;
  raw: string;
  contractVersion: string;
}

// Format 2.3: Second Opinion Skip
export interface SecondOpinionSkipParsed {
  stepNumber: number | null;
  action: string | null;
  result: string | null;
  secondOpinionStep: number | null;
  skipReason: string | null;
  nextStep: number | null;
  raw: string;
  contractVersion: string;
}
```

### Category 3: Human Interaction (3 formats)

```typescript
// Format 3.1: Human Gate Presentation
export interface HumanGateParsed {
  stepNumber: number | null;
  content: string | null; // Free-form, no guaranteed structure
  prompt: string | null;
  raw: string;
  contractVersion: string;
}

// Format 3.2: Learning Surface Presentation
export interface LearningSurfaceParsed {
  fromAction: string | null;
  fromModel: ModelString | null;
  issue: string | null;
  rootCause: string | null;
  suggestedFix: string | null;
  raw: string;
  contractVersion: string;
}

// Format 3.3: Session-Start Protocol Acknowledgment
export interface SessionStartProtocolParsed {
  projectName: string | null;
  departmentCount: number | null;
  departments: string[] | null;
  flowCount: number | null;
  actionCount: number | null;
  pastExecutionCount: number | null;
  raw: string;
  contractVersion: string;
}
```

### Category 4: Registry & Metadata (3 formats)

```typescript
// Format 4.1: Registry Update
export interface RegistryUpdateParsed {
  title: string | null;
  file: string | null; // INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md
  action: 'added' | 'removed' | 'updated' | null;
  line: string | null;
  raw: string;
  contractVersion: string;
}

// Format 4.2: INDEX.md Entry
export interface IndexEntryParsed {
  date: string | null; // YYYY-MM-DD
  description: string | null;
  pattern: string | null; // Action sequence signature
  outcome: string | null;
  success: boolean | null;
  metrics: string | null;
  commitHash: string | null;
  raw: string;
  contractVersion: string;
}

// Format 4.3: LEARNINGS.md Entry
export interface LearningEntryParsed {
  actionType: string | null;
  issueTitle: string | null;
  context: string | null;
  problem: string | null;
  rootCause: string | null;
  solution: string | null;
  date: string | null;
  source: string | null; // "{action/} in {chain description}"
  raw: string;
  contractVersion: string;
}
```

### Category 5: Action Outputs (3 formats)

```typescript
// Format 5.1: Review Report Structure
export interface ReviewReportParsed {
  scope: string | null;
  verdict: 'APPROVED' | 'NEEDS_CHANGES' | null;
  score: number | null; // 0-100
  summary: string | null;
  findings: ReviewFinding[] | null;
  fixesApplied: ReviewFix[] | null;
  flagsForHuman: ReviewFlag[] | null;
  raw: string;
  contractVersion: string;
}

export interface ReviewFinding {
  number: number;
  file: string;
  line: number | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  description: string;
  suggestion: string;
}

export interface ReviewFix {
  file: string;
  fix: string;
}

export interface ReviewFlag {
  issue: string;
  reason: string;
}

// Format 5.2: Analysis Report Structure
export interface AnalysisReportParsed {
  title: string | null;
  aspect: string | null; // coverage | dependencies | structure | drift | inventory | impact
  scope: string | null;
  date: string | null;
  sections: AnalysisSection[] | null;
  recommendations: string[] | null;
  raw: string;
  contractVersion: string;
}

export interface AnalysisSection {
  number: number;
  title: string;
  content: string; // Raw markdown content
}

// Format 5.3: Brainstorm Session Transcript
export interface BrainstormTranscriptParsed {
  idea: string | null;
  classification: 'Technical' | 'Functional' | 'Framework' | null;
  initialContext: string | null;
  questions: BrainstormQuestion[] | null;
  keyInsights: string[] | null;
  potentialIssues: string[] | null;
  suggestedNextSteps: string[] | null;
  openQuestions: string[] | null;
  duration: string | null;
  depth: string | null;
  consensus: string | null;
  raw: string;
  contractVersion: string;
}

export interface BrainstormQuestion {
  number: number;
  question: string;
  response: string;
}
```

### Category 6: Error & Status (2 formats)

```typescript
// Format 6.1: Error Announcement
export interface ErrorAnnouncementParsed {
  title: string | null;
  stepNumber: number | null;
  action: string | null;
  message: string | null;
  context: string | null;
  stackTrace: string | null;
  recoveryOptions: string[] | null;
  raw: string;
  contractVersion: string;
}

// Format 6.2: Department Routing Announcement
export interface DepartmentRoutingParsed {
  request: string | null;
  department: 'Framework' | 'Engineering' | 'QA' | 'Human' | null;
  flow: string | null;
  actions: string[] | null;
  explanation: string | null;
  raw: string;
  contractVersion: string;
}
```

---

## Integration Points

### Backend Integration

**Purpose:** Parse orchestrator output in real-time, emit structured WebSocket events

**Location:** `packages/backend/src/services/orchestratorParser.ts` (NEW)

**Architecture:**
```typescript
// packages/backend/src/services/orchestratorParser.ts

import { EventEmitter } from 'events';
import type { WorkspaceEvent } from '@afw/shared';
import {
  parseChainCompilation,
  parseStepCompletion,
  parseDualOutput,
  // ... import all parsers
} from '@afw/shared/contract';

/**
 * Service that parses orchestrator output and emits structured events
 */
export class OrchestratorParser extends EventEmitter {
  /**
   * Parse a chunk of orchestrator output
   * @param text - Raw markdown text from orchestrator
   * @param sessionId - Session this output belongs to
   */
  parse(text: string, sessionId: SessionId): void {
    // Try each parser in priority order
    const parsed =
      parseChainCompilation(text) ||
      parseStepCompletion(text) ||
      parseDualOutput(text) ||
      parseErrorAnnouncement(text) ||
      // ... try all parsers
      null;

    if (!parsed) {
      // No format matched - emit raw text event
      this.emit('orchestrator:unknown', {
        type: 'orchestrator:unknown',
        sessionId,
        text,
        timestamp: brandedTypes.currentTimestamp(),
      });
      return;
    }

    // Format detected - emit typed event
    const event = this.buildEventFromParsed(parsed, sessionId);
    this.emit(event.type, event);
  }

  private buildEventFromParsed(
    parsed: ParsedFormat,
    sessionId: SessionId
  ): WorkspaceEvent {
    // Convert parsed format to appropriate event type
    if (isChainCompilationParsed(parsed)) {
      return {
        type: 'chain:compiled',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        title: parsed.title,
        steps: parsed.steps?.map(/* convert to ChainStepSnapshot */),
        source: parsed.source,
        totalSteps: parsed.steps?.length || null,
      } as ChainCompiledEvent;
    }

    if (isStepCompletionParsed(parsed)) {
      return {
        type: 'step:completed',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        stepNumber: parsed.stepNumber,
        action: parsed.action,
        result: parsed.result,
      } as StepCompletedEvent;
    }

    // ... (handle other formats)

    throw new Error('Unhandled parsed format');
  }
}
```

**Integration with WebSocket:**
```typescript
// packages/backend/src/ws/connection.ts

import { OrchestratorParser } from '../services/orchestratorParser.js';

class WebSocketConnection {
  private parser: OrchestratorParser;

  constructor(/* ... */) {
    this.parser = new OrchestratorParser();

    // Forward parsed events to WebSocket clients
    this.parser.on('chain:compiled', (event) => {
      this.broadcast(event);
    });

    this.parser.on('step:completed', (event) => {
      this.broadcast(event);
    });

    // ... (register all event handlers)
  }

  /**
   * Called when orchestrator produces output
   */
  onOrchestratorOutput(text: string, sessionId: SessionId): void {
    this.parser.parse(text, sessionId);
  }
}
```

**Key Design Decisions:**
- Parser is an EventEmitter (follows Node.js patterns)
- Priority ordering: try common formats first (step completion, chain compilation)
- Fallback: emit `orchestrator:unknown` event with raw text if no parser matches
- Conversion layer: parsed formats → event types (keeps concerns separated)

### Frontend Integration

**Purpose:** Type-safe consumption of parsed formats in React components

**Pattern:**
```typescript
// packages/app/src/components/ChainTable.tsx

import type { ChainCompilationParsed } from '@afw/shared/contract';
import { isChainCompilationParsed } from '@afw/shared/contract';

interface ChainTableProps {
  /** Parsed chain compilation data */
  chain: ChainCompilationParsed;
}

export function ChainTable({ chain }: ChainTableProps) {
  // Graceful degradation: show fallback if parsing failed
  if (!chain.title || !chain.steps) {
    return (
      <div className="chain-table-fallback">
        <h3>Chain Compilation Detected</h3>
        <p>Parsing incomplete. Raw output:</p>
        <pre>{chain.raw}</pre>
      </div>
    );
  }

  // Render parsed data
  return (
    <div className="chain-table">
      <h2>{chain.title}</h2>
      <p><strong>Request:</strong> {chain.request || 'N/A'}</p>
      <p><strong>Source:</strong> {chain.source || 'N/A'}</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Action</th>
            <th>Model</th>
            <th>Key Inputs</th>
            <th>Waits For</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {chain.steps.map((step) => (
            <tr key={step.stepNumber}>
              <td>{step.stepNumber}</td>
              <td>{step.action}</td>
              <td>{step.model || 'N/A'}</td>
              <td>{step.keyInputs || 'N/A'}</td>
              <td>{step.waitsFor || '--'}</td>
              <td>{step.status || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Execution:</strong> {chain.executionMode || 'N/A'}</p>
    </div>
  );
}
```

**Hook for Contract Data:**
```typescript
// packages/app/src/hooks/useChainCompilation.ts

import { useEffect, useState } from 'react';
import type { ChainCompilationParsed } from '@afw/shared/contract';
import { useWebSocket } from './useWebSocket';

/**
 * Hook to subscribe to chain compilation events
 */
export function useChainCompilation(sessionId: SessionId): ChainCompilationParsed | null {
  const [chain, setChain] = useState<ChainCompilationParsed | null>(null);
  const ws = useWebSocket();

  useEffect(() => {
    const handler = (event: ChainCompiledEvent) => {
      if (event.sessionId === sessionId) {
        // Convert event to parsed format
        const parsed: ChainCompilationParsed = {
          title: event.title,
          request: null, // Not included in event (would need to be added)
          source: event.source,
          steps: event.steps?.map(/* convert ChainStepSnapshot to ChainStepParsed */),
          executionMode: event.executionMode,
          stepDescriptions: null,
          raw: '', // Would need to be included in event
          contractVersion: '1.0',
        };
        setChain(parsed);
      }
    };

    ws.on('chain:compiled', handler);
    return () => ws.off('chain:compiled', handler);
  }, [sessionId, ws]);

  return chain;
}
```

**Key Design Decisions:**
- Components receive **parsed data** (not raw text) via props
- Graceful degradation: check for null fields, show fallback UI
- Hooks abstract WebSocket subscriptions and format conversions
- Type guards (`isChainCompilationParsed`) enable runtime checks

### Harmony Detection Integration

**Purpose:** Auto-detect when orchestrator output drifts from contract

**Location:** `packages/backend/src/services/harmonyDetector.ts` (NEW)

**Architecture:**
```typescript
// packages/backend/src/services/harmonyDetector.ts

import type { ProjectId } from '@afw/shared';
import { ChainPatterns, StepPatterns, /* ... */ } from '@afw/shared/contract';
import type { OrchestratorParser } from './orchestratorParser.js';

/**
 * Detects when orchestrator output drifts from contract
 */
export class HarmonyDetector {
  constructor(private parser: OrchestratorParser) {
    // Listen for unknown formats
    this.parser.on('orchestrator:unknown', (event) => {
      this.onUnknownFormat(event.text);
    });
  }

  /**
   * Check a text blob for expected formats
   * @returns List of detected formats
   */
  detectFormats(text: string): string[] {
    const detected: string[] = [];

    // Test each pattern category
    if (ChainPatterns.chainCompilation.heading.test(text)) {
      detected.push('chain:compilation');
    }
    if (StepPatterns.stepCompletion.prefix.test(text)) {
      detected.push('step:completion');
    }
    // ... (test all pattern categories)

    return detected;
  }

  /**
   * Validate that a format is complete (all required fields present)
   */
  validateFormat(text: string, formatType: string): boolean {
    // Use parsers to validate
    switch (formatType) {
      case 'chain:compilation': {
        const parsed = parseChainCompilation(text);
        return parsed !== null && parsed.title !== null && parsed.steps !== null;
      }
      case 'step:completion': {
        const parsed = parseStepCompletion(text);
        return parsed !== null && parsed.stepNumber !== null && parsed.action !== null;
      }
      // ... (validate other formats)
      default:
        return false;
    }
  }

  /**
   * Called when an unknown format is detected
   */
  private onUnknownFormat(text: string): void {
    console.warn('Harmony violation: Unknown orchestrator format detected');
    console.warn('Text:', text.substring(0, 200) + '...');

    // Emit harmony event
    this.parser.emit('harmony:violation', {
      type: 'harmony:violation',
      reason: 'unknown_format',
      text: text.substring(0, 500), // First 500 chars for context
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Run full harmony check against ORCHESTRATOR.md
   */
  async checkAgainstSource(): Promise<HarmonyCheckResult> {
    // Read ORCHESTRATOR.md
    const orchestratorMd = await fs.readFile('.claude/actionflows/ORCHESTRATOR.md', 'utf8');

    // Extract all format examples from ORCHESTRATOR.md
    const examples = this.extractFormatExamples(orchestratorMd);

    // Validate each example against current parsers
    const results = examples.map((example) => ({
      format: example.format,
      valid: this.validateFormat(example.text, example.format),
      example: example.text,
    }));

    const violations = results.filter((r) => !r.valid);

    return {
      totalFormats: results.length,
      valid: results.length - violations.length,
      violations: violations.map((v) => v.format),
      details: violations,
    };
  }

  private extractFormatExamples(orchestratorMd: string): FormatExample[] {
    // Parse ORCHESTRATOR.md to extract code blocks
    // This would use a markdown parser to find ```markdown blocks
    // and associate them with format headings
    // Implementation depends on ORCHESTRATOR.md structure
    // (placeholder for now)
    return [];
  }
}

interface HarmonyCheckResult {
  totalFormats: number;
  valid: number;
  violations: string[];
  details: Array<{ format: string; example: string }>;
}

interface FormatExample {
  format: string; // Format ID (e.g., "chain:compilation")
  text: string;   // Example text from ORCHESTRATOR.md
}
```

**Dashboard Visualization:**
```typescript
// packages/app/src/components/HarmonyStatus.tsx

import { useEffect, useState } from 'react';
import type { HarmonyCheckResult } from '@afw/backend/services/harmonyDetector';

export function HarmonyStatus() {
  const [status, setStatus] = useState<HarmonyCheckResult | null>(null);

  useEffect(() => {
    // Fetch harmony status from backend
    fetch('/api/harmony/status')
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  if (!status) return <div>Loading harmony status...</div>;

  const percentage = (status.valid / status.totalFormats) * 100;

  return (
    <div className="harmony-status">
      <h3>Framework Harmony</h3>
      <div className="harmony-meter">
        <div
          className="harmony-bar"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? 'green' : percentage > 80 ? 'yellow' : 'red',
          }}
        />
      </div>
      <p>
        {status.valid} / {status.totalFormats} formats valid ({percentage.toFixed(0)}%)
      </p>
      {status.violations.length > 0 && (
        <details>
          <summary>Violations ({status.violations.length})</summary>
          <ul>
            {status.violations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
```

**Key Design Decisions:**
- Harmony detection listens to parser events (no duplicate parsing)
- Two levels: 1) unknown format detection (real-time), 2) source validation (on-demand)
- Source validation reads ORCHESTRATOR.md and tests examples against parsers
- Dashboard visualizes harmony as percentage meter

---

## Contract Version System

### Version Marker Format

The orchestrator embeds a version marker in its output:

```markdown
<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Feature Implementation
...
```

**Location:** First line of every structured output (chain compilation, learning surface, registry update, etc.)

**Format:** HTML comment (invisible when rendered, easy to parse)

### Version Constant

```typescript
// packages/shared/src/contract/version.ts

/**
 * Current contract version
 * Increment when changing output format structure
 */
export const CONTRACT_VERSION = '1.0';

/**
 * Contract version history
 */
export const CONTRACT_VERSIONS = {
  '1.0': {
    date: '2026-02-08',
    description: 'Initial contract specification with 17 formats',
    breaking: false,
  },
  // Future versions...
} as const;

/**
 * Check if a version is supported
 */
export function isSupportedVersion(version: string): boolean {
  return version in CONTRACT_VERSIONS;
}

/**
 * Get the latest version
 */
export function getLatestVersion(): string {
  const versions = Object.keys(CONTRACT_VERSIONS);
  return versions[versions.length - 1];
}
```

### Version Detection in Parsers

```typescript
// packages/shared/src/contract/parsers/chainParser.ts

export function parseChainCompilation(text: string): ChainCompilationParsed | null {
  // Extract version marker
  const versionMatch = text.match(/<!-- ActionFlows-Contract-Version: ([\d.]+) -->/);
  const version = versionMatch?.[1] || '1.0'; // Default to 1.0 if missing

  // Check if version is supported
  if (!isSupportedVersion(version)) {
    console.warn(`Unsupported contract version: ${version}`);
    // Fall through to parsing with latest schema (best effort)
  }

  // Route to version-specific parser
  switch (version) {
    case '1.0':
      return parseChainCompilationV1(text);
    // Future versions...
    default:
      return parseChainCompilationV1(text); // Fallback
  }
}
```

**Key Design Decisions:**
- Version marker is optional (defaults to 1.0 for backward compatibility)
- Unsupported versions trigger warnings but don't block parsing
- Each version has dedicated parser functions (allows structural changes)
- Version constant is exported for external tools to check compatibility

---

## Contract Document (Human-Readable)

**Location:** `.claude/actionflows/CONTRACT.md`

**Purpose:**
- Authoritative specification for humans
- Teaching material for onboarding questionnaire
- Reference for agents (don't change these formats!)
- Link from ORCHESTRATOR.md

**Structure:**
```markdown
# ActionFlows Orchestrator Output Contract

Version: 1.0
Last Updated: 2026-02-08

---

## What Is This?

This contract defines every output format the ActionFlows orchestrator produces. The dashboard depends on these formats for visualization. **These formats are load-bearing** — changing them without updating the contract breaks the dashboard.

---

## Contract Philosophy

The orchestrator and dashboard are **co-dependent systems**. They stay in harmony through:

1. **Contract Specification** (this document) — Source of truth for formats
2. **Runtime Validation** (Zod schemas) — Ensures output matches contract
3. **Harmony Detection** (pattern analysis) — Auto-flags drift
4. **Graceful Degradation** (nullable fields) — Dashboard doesn't crash on malformed output

**Evolution is encouraged, but within the contract.** To add a new format:
1. Define it in the contract (types, schemas, patterns)
2. Update parsers to recognize it
3. Update dashboard components to render it
4. Run harmony detection to validate

---

## Format Catalog

### Category 1: Chain Management

#### Format 1.1: Chain Compilation Table

**When Produced:** Orchestrator compiles chain and presents for approval

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

**TypeScript Interface:**
```typescript
interface ChainCompilationParsed {
  title: string | null;
  request: string | null;
  source: string | null;
  steps: ChainStepParsed[] | null;
  executionMode: string | null;
  stepDescriptions: StepDescription[] | null;
  raw: string;
  contractVersion: string;
}
```

**Dashboard Usage:**
- ChainView component renders chain table with ReactFlow nodes
- ExecutionPlan model stores typed representation

**Example:** (see ORCHESTRATOR.md lines 315-334)

---

(Continue with all 17 formats in this pattern)

---

## Format Priority for Implementation

| Priority | Format | Reason |
|----------|--------|--------|
| **P0** | Chain Compilation (1.1) | Core visualization, most complex |
| **P0** | Step Completion (2.1) | Real-time progress tracking |
| **P1** | Review Report (5.1) | Quality metrics, findings table |
| **P1** | Error Announcement (6.1) | Recovery UI |
| **P2** | Dual Output (2.2) | Second opinion integration |
| **P2** | Registry Update (4.1) | Live registry updates |
| **P2** | Learning Surface (3.2) | Agent feedback loop |
| **P3** | INDEX.md Entry (4.2) | Already parsed, formalize |
| **P3** | Chain Execution Start (1.2) | Status updates |
| **P3** | Analysis Report (5.2) | Metrics display |
| **P4** | Session Start Protocol (3.3) | Session metadata |
| **P4** | Execution Complete (1.4) | Chain completion |
| **P4** | Second Opinion Skip (2.3) | Edge case handling |
| **P4** | LEARNINGS.md Entry (4.3) | Historical learnings |
| **P4** | Chain Status Update (1.3) | Progress tracking |
| **P5** | Brainstorm Transcript (5.3) | Read-only viewing |
| **P5** | Human Gate (3.1) | No standardized format |
| **P5** | Department Routing (6.2) | Internal, not user-facing |

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
2. **Update CONTRACT_VERSION constant**
3. **Add version-specific parser** (parseChainCompilationV2)
4. **Support both versions** during migration
5. **Update ORCHESTRATOR.md** with new format
6. **Notify via harmony detection** (dashboard shows version mismatch warning)

**Migration window:** Support previous version for 30 days minimum.

---

## Contributing

When adding a new orchestrator output format:

1. **Define in CONTRACT.md** (this file)
2. **Add TypeScript interface** in `packages/shared/src/contract/types/`
3. **Add Zod schema** in `packages/shared/src/contract/schemas/`
4. **Add regex patterns** in `packages/shared/src/contract/patterns/`
5. **Add parser** in `packages/shared/src/contract/parsers/`
6. **Update ORCHESTRATOR.md** with example
7. **Add dashboard component** to render the format
8. **Update harmony detection** to recognize the format
9. **Run validation** (`pnpm run harmony:check`)

---

**End of Contract**
```

---

## Migration Path (Incremental Adoption)

### Phase 1: Foundation (Week 1)

**Goal:** Establish contract infrastructure

**Tasks:**
1. Create `packages/shared/src/contract/` directory structure
2. Define version.ts with CONTRACT_VERSION constant
3. Set up base types for all 17 formats (interfaces only)
4. Create empty schema/pattern/parser files (scaffolding)
5. Write CONTRACT.md with full format specifications
6. Update ORCHESTRATOR.md to reference contract

**Deliverables:**
- Contract package structure (empty parsers)
- CONTRACT.md documentation
- Version constant and checking

**No breaking changes:** Existing code unaffected (no imports yet)

### Phase 2: Priority Formats (Week 2)

**Goal:** Implement P0 parsers (Chain Compilation, Step Completion)

**Tasks:**
1. Implement ChainCompilationParsedSchema (Zod)
2. Implement ChainPatterns.chainCompilation (regex)
3. Implement parseChainCompilation() parser
4. Implement StepCompletionParsedSchema (Zod)
5. Implement StepPatterns.stepCompletion (regex)
6. Implement parseStepCompletion() parser
7. Write unit tests for both parsers

**Deliverables:**
- 2 working parsers with tests
- Type-safe parsing of chain/step formats

**Integration:** Still isolated (no backend/frontend changes yet)

### Phase 3: Backend Integration (Week 3)

**Goal:** Real-time parsing in backend, WebSocket event emission

**Tasks:**
1. Create OrchestratorParser service
2. Integrate with WebSocket connection handler
3. Emit typed events (chain:compiled, step:completed)
4. Add harmony detection service (basic)
5. Create /api/harmony/status endpoint
6. Update existing event types to include parsed data

**Deliverables:**
- Real-time parsing pipeline
- Harmony detection (basic)
- API endpoint for harmony status

**Testing:** Monitor WebSocket traffic, verify events contain parsed data

### Phase 4: Frontend Integration (Week 4)

**Goal:** Dashboard components consume parsed formats

**Tasks:**
1. Create ChainTable component (uses ChainCompilationParsed)
2. Update StepTimeline component (uses StepCompletionParsed)
3. Add HarmonyStatus widget to dashboard
4. Create useChainCompilation hook
5. Add graceful degradation UI (fallback for parsing failures)

**Deliverables:**
- 2 dashboard components rendering contract data
- Harmony status visible in UI

**User-facing:** Dashboard now shows structured chain/step info

### Phase 5: Expand Coverage (Weeks 5-8)

**Goal:** Implement P1-P3 parsers incrementally

**Week 5: P1 Formats**
- Review Report (5.1)
- Error Announcement (6.1)

**Week 6: P2 Formats**
- Dual Output (2.2)
- Registry Update (4.1)
- Learning Surface (3.2)

**Week 7: P3 Formats**
- INDEX.md Entry (4.2) — formalize existing parser
- Chain Execution Start (1.2)
- Analysis Report (5.2)

**Week 8: P4 Formats**
- Session Start Protocol (3.3)
- Execution Complete (1.4)
- Second Opinion Skip (2.3)
- LEARNINGS.md Entry (4.3)
- Chain Status Update (1.3)

**Approach:** One format per day (2 hours work)

### Phase 6: Polish & Validation (Week 9)

**Goal:** Full harmony validation, comprehensive testing

**Tasks:**
1. Implement ORCHESTRATOR.md format extraction
2. Build harmony:check command (validates all examples)
3. Add dashboard warnings for version mismatches
4. Write integration tests (orchestrator → parser → event → UI)
5. Performance testing (parse 1000 messages/sec?)
6. Documentation: usage examples, troubleshooting guide

**Deliverables:**
- Automated harmony validation
- Comprehensive test suite
- Performance benchmarks

### Phase 7: Onboarding Integration (Week 10)

**Goal:** Questionnaire teaches contract formats

**Tasks:**
1. Create onboarding questionnaire flow
2. Include contract format examples in teaching
3. Link CONTRACT.md from questionnaire
4. Add "test your understanding" exercises
5. Update bootstrap.md to wrap questionnaire

**Deliverables:**
- Onboarding questionnaire that teaches contract
- Smooth new project setup experience

---

## Testing Strategy

### Unit Tests (Per Parser)

**Location:** `packages/shared/src/contract/parsers/__tests__/`

**Pattern:**
```typescript
// packages/shared/src/contract/parsers/__tests__/chainParser.test.ts

import { describe, it, expect } from 'vitest';
import { parseChainCompilation } from '../chainParser';

describe('parseChainCompilation', () => {
  it('parses valid chain compilation', () => {
    const input = `<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Test Chain

**Request:** Do something
**Source:** flow-test/

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/ | haiku | task=test | -- | Pending |

**Execution:** Sequential

What each step does:
1. **code/** -- Write test code

Execute?`;

    const result = parseChainCompilation(input);

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Test Chain');
    expect(result?.request).toBe('Do something');
    expect(result?.source).toBe('flow-test/');
    expect(result?.steps).toHaveLength(1);
    expect(result?.steps?.[0].action).toBe('code/');
    expect(result?.contractVersion).toBe('1.0');
  });

  it('handles missing optional fields', () => {
    const input = `<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Minimal

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/ | haiku | task=test | -- | Pending |

Execute?`;

    const result = parseChainCompilation(input);

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Minimal');
    expect(result?.request).toBeNull(); // Missing field
    expect(result?.source).toBeNull();
  });

  it('returns null for non-matching input', () => {
    const input = 'This is not a chain compilation.';
    const result = parseChainCompilation(input);
    expect(result).toBeNull();
  });

  it('handles malformed table rows', () => {
    const input = `## Chain: Bad Table

| # | Action | Model |
|---|--------|-------|
| 1 | code/ | haiku |

Execute?`;

    const result = parseChainCompilation(input);

    expect(result).not.toBeNull();
    expect(result?.steps).toBeNull(); // Table parsing failed
    expect(result?.raw).toBe(input); // Raw text preserved
  });
});
```

### Integration Tests (Backend)

**Location:** `packages/backend/src/services/__tests__/orchestratorParser.test.ts`

**Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { OrchestratorParser } from '../orchestratorParser';
import { brandedTypes } from '@afw/shared';

describe('OrchestratorParser', () => {
  it('emits chain:compiled event for chain compilation format', (done) => {
    const parser = new OrchestratorParser();
    const sessionId = brandedTypes.sessionId('test-session');

    parser.on('chain:compiled', (event) => {
      expect(event.type).toBe('chain:compiled');
      expect(event.sessionId).toBe(sessionId);
      expect(event.title).toBe('Test Chain');
      done();
    });

    parser.parse(`## Chain: Test Chain\n\nExecute?`, sessionId);
  });

  it('emits orchestrator:unknown for unrecognized format', (done) => {
    const parser = new OrchestratorParser();
    const sessionId = brandedTypes.sessionId('test-session');

    parser.on('orchestrator:unknown', (event) => {
      expect(event.type).toBe('orchestrator:unknown');
      expect(event.text).toContain('random text');
      done();
    });

    parser.parse('Some random text that does not match any format', sessionId);
  });
});
```

### E2E Tests (Dashboard)

**Location:** `test/e2e/contract.spec.ts`

**Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test('chain compilation renders in dashboard', async ({ page }) => {
  // Start backend and dashboard
  await page.goto('http://localhost:5173');

  // Wait for WebSocket connection
  await page.waitForSelector('.ws-connected');

  // Trigger chain compilation (simulate orchestrator output)
  // (This would involve a test harness that injects events)

  // Verify ChainTable component renders
  await expect(page.locator('.chain-table')).toBeVisible();
  await expect(page.locator('.chain-table h2')).toHaveText('Test Chain');
  await expect(page.locator('.chain-table tbody tr')).toHaveCount(2);
});

test('harmony status shows 100% when all formats parse', async ({ page }) => {
  await page.goto('http://localhost:5173/harmony');

  await expect(page.locator('.harmony-meter .harmony-bar')).toHaveCSS(
    'width',
    '100%'
  );
  await expect(page.locator('.harmony-status p')).toContainText('17 / 17 formats valid');
});
```

### Manual Testing Checklist

Before merging contract changes:

- [ ] Run `pnpm test` (all unit tests pass)
- [ ] Run `pnpm run harmony:check` (all ORCHESTRATOR.md examples parse)
- [ ] Start backend and frontend, verify WebSocket events emit
- [ ] Trigger each format via orchestrator, verify dashboard renders correctly
- [ ] Test with malformed input (missing fields), verify graceful degradation
- [ ] Check browser console for parsing warnings
- [ ] Verify harmony status endpoint returns valid JSON
- [ ] Test with old contract version (backward compatibility)

---

## Performance Considerations

### Parsing Performance

**Goal:** Parse 1000 messages/second without blocking Node.js event loop

**Strategy:**
- Regex patterns are fast (compiled once, reused)
- Zod validation is lightweight (no async overhead)
- Parser tries formats in priority order (most common first)
- Early exit on detection failure (no wasted work)

**Benchmarking:**
```typescript
// packages/shared/src/contract/parsers/__tests__/performance.test.ts

import { describe, it } from 'vitest';
import { parseChainCompilation } from '../chainParser';

describe('Parser Performance', () => {
  it('parses 1000 chain compilations in <100ms', () => {
    const input = `...`; // Valid chain compilation

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      parseChainCompilation(input);
    }
    const end = performance.now();

    const duration = end - start;
    expect(duration).toBeLessThan(100); // 100ms for 1000 parses = 10ms per 100 parses
    console.log(`Parsed 1000 messages in ${duration.toFixed(2)}ms`);
  });
});
```

**Optimization:**
- Cache compiled regexes (already done via module-level constants)
- Avoid JSON.stringify/parse in hot paths
- Use string methods (indexOf, substring) over regex when possible
- Lazy-load parsers (import only when needed)

### Memory Considerations

**Issue:** Storing raw text in every parsed object could use significant memory

**Solution:**
- Raw text is **required** for fallback rendering (can't omit)
- Frontend can discard `raw` field after rendering (keep only structured data)
- Backend can use a ring buffer for recent parses (LRU cache, max 100 entries)

**Ring Buffer Implementation:**
```typescript
// packages/backend/src/services/parseCache.ts

import type { ParsedFormat } from '@afw/shared/contract';

export class ParseCache {
  private cache: Map<string, ParsedFormat> = new Map();
  private maxSize = 100;

  set(key: string, value: ParsedFormat): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key: string): ParsedFormat | undefined {
    return this.cache.get(key);
  }
}
```

---

## Open Questions & Future Work

### 1. JSON Output Mode

**Question:** Should the orchestrator support a `--output-format json` flag?

**Pros:**
- Eliminates parsing ambiguity (JSON is unambiguous)
- Faster parsing (no regex, direct JSON.parse)
- Easier for non-JavaScript consumers

**Cons:**
- Markdown is human-readable, JSON is not
- Would require dual output (markdown for humans, JSON for machines)
- Orchestrator output is currently one stream (hard to split)

**Decision:** Defer to Phase 7. Markdown parsing is sufficient for MVP.

### 2. Contract Enforcement in Orchestrator

**Question:** Should ORCHESTRATOR.md load the contract and validate its own output?

**Approach:**
```typescript
// Hypothetical orchestrator code
import { parseChainCompilation } from '@afw/shared/contract';

function compileChain(/* ... */): string {
  const output = `## Chain: ${title}\n\n...`;

  // Self-validation
  const parsed = parseChainCompilation(output);
  if (!parsed || !parsed.title || !parsed.steps) {
    throw new Error('Orchestrator produced invalid chain compilation format');
  }

  return output;
}
```

**Pros:**
- Catches format drift immediately (at production time)
- Prevents bad output from reaching dashboard

**Cons:**
- Orchestrator depends on shared package (circular dependency risk)
- Orchestrator is Claude (can't import npm packages easily)
- Validation overhead on every output

**Decision:** No. Orchestrator is Claude, can't import TypeScript packages. Harmony detection is sufficient.

### 3. Format Extensibility

**Question:** How do third-party actions define custom output formats?

**Scenario:** A custom `deploy/` action produces a deployment report with a unique structure. How does it integrate with the contract?

**Approach:**
1. Third-party actions define their format in `packages/shared/src/contract/types/customFormats.ts`
2. Contract exports a registry of custom formats
3. Dashboard components can import and render custom formats

**Example:**
```typescript
// packages/shared/src/contract/types/customFormats.ts

export interface DeploymentReportParsed {
  service: string | null;
  environment: string | null;
  status: 'success' | 'failed' | null;
  url: string | null;
  raw: string;
  contractVersion: string;
}

// packages/shared/src/contract/patterns/customPatterns.ts

export const CustomPatterns = {
  deploymentReport: {
    heading: /^## Deployment Report$/m,
    service: /^\*\*Service:\*\* (.+)$/m,
    environment: /^\*\*Environment:\*\* (.+)$/m,
    status: /^\*\*Status:\*\* (success|failed)$/m,
    url: /^\*\*URL:\*\* (.+)$/m,
  },
};

// packages/shared/src/contract/parsers/customParsers.ts

export function parseDeploymentReport(text: string): DeploymentReportParsed | null {
  // ... (standard parser pattern)
}

// Dashboard component
// packages/app/src/components/DeploymentReportCard.tsx

import { parseDeploymentReport } from '@afw/shared/contract';

export function DeploymentReportCard({ text }: { text: string }) {
  const parsed = parseDeploymentReport(text);
  if (!parsed) return null;

  return (
    <div className="deployment-report">
      <h3>{parsed.service || 'Unknown Service'}</h3>
      <p>Environment: {parsed.environment}</p>
      <p>Status: {parsed.status}</p>
      {parsed.url && <a href={parsed.url}>View Deployment</a>}
    </div>
  );
}
```

**Decision:** Support custom formats via the same contract infrastructure. Third-party actions contribute their formats to the contract package.

### 4. Backward Compatibility Duration

**Question:** How long must old contract versions be supported?

**Options:**
- 30 days (1 month migration window)
- 90 days (1 quarter)
- Forever (never break old outputs)

**Decision:** **90 days minimum**. After 90 days, dashboard can drop support for old versions. Harmony detection will warn users to update.

**Rationale:** 90 days gives teams time to update custom flows and actions without pressure. "Forever" is impractical (version bloat).

---

## Summary

This plan defines a **comprehensive contract system** for orchestrator output formats:

1. **17 formats cataloged** with types, schemas, patterns, and parsers
2. **Progressive enhancement** (detection → extraction → consumption)
3. **Graceful degradation** (nullable fields, fallback rendering)
4. **Version-aware** (contract version marker, migration support)
5. **Real-time parsing** (backend service, WebSocket events)
6. **Harmony detection** (auto-flag drift from contract)
7. **Incremental adoption** (10-week rollout plan)

**Key Files:**
- `packages/shared/src/contract/` — Contract implementation (types, schemas, parsers)
- `.claude/actionflows/CONTRACT.md` — Human-readable specification
- `packages/backend/src/services/orchestratorParser.ts` — Real-time parsing service
- `packages/backend/src/services/harmonyDetector.ts` — Drift detection
- `packages/app/src/components/HarmonyStatus.tsx` — Dashboard visualization

**Next Steps:**
1. Review this plan with human for approval
2. Spawn code/ agent to implement Phase 1 (foundation)
3. Iterate through phases 2-7 incrementally
4. Integrate with onboarding questionnaire (Phase 7)

**Contract Benefits:**
- Dashboard never crashes on malformed orchestrator output
- Type-safe parsing (compile-time guarantees)
- Auto-detection of orchestrator/dashboard drift
- Clear specification for humans and agents
- Incremental evolution without breaking changes

---

**End of Plan**
