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
  ChainStepParsed,
  StepDescription,
  ChainExecutionStartParsed,
  ChainStatusUpdateParsed,
  ExecutionCompleteParsed,
  CompletedStepSummary,

  // Step Lifecycle (Category 2)
  StepCompletionParsed,
  DualOutputParsed,
  SecondOpinionSkipParsed,

  // Human Interaction (Category 3)
  HumanGateParsed,
  LearningSurfaceParsed,
  SessionStartProtocolParsed,

  // Registry & Metadata (Category 4)
  RegistryUpdateParsed,
  IndexEntryParsed,
  LearningEntryParsed,

  // Action Outputs (Category 5 — Agent Outputs)
  ReviewReportParsed,
  ReviewFinding,
  ReviewFix,
  ReviewFlag,
  AnalysisReportParsed,
  AnalysisSection,
  BrainstormTranscriptParsed,
  BrainstormQuestion,

  // Error & Status (Category 6)
  ErrorAnnouncementParsed,
  ContextRoutingParsed,

  // Contract Metadata
  CONTRACT_VERSION,
  CONTRACT_VERSIONS,
  isSupportedVersion,
  getLatestVersion,
} from '@actionflows/shared/contract';
```

### Patterns
Regex patterns for detecting format boundaries:

```typescript
import {
  ChainPatterns,
  StepPatterns,
  HumanPatterns,
  RegistryPatterns,
  ActionPatterns,
  StatusPatterns,
} from '@actionflows/shared/contract';

// Example usage:
const chainMatch = text.match(ChainPatterns.CHAIN_COMPILATION_START);
```

### Parsers
Functions to parse orchestrator/agent output text into typed objects:

```typescript
import {
  // Master parser
  parseOrchestratorOutput,
  type ParsedFormat,

  // Chain parsers
  parseChainCompilation,
  parseChainExecutionStart,
  parseChainStatusUpdate,
  parseExecutionComplete,

  // Step parsers
  parseStepCompletion,
  parseDualOutput,
  parseSecondOpinionSkip,

  // Human interaction parsers
  parseHumanGate,
  parseLearningSurface,
  parseSessionStartProtocol,

  // Registry parsers
  parseRegistryUpdate,
  parseIndexEntry,
  parseLearningEntry,

  // Action output parsers
  parseReviewReport,
  parseAnalysisReport,
  parseBrainstormTranscript,

  // Status and error parsers
  parseErrorAnnouncement,
  parseContextRouting,
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
  // Generic guard
  isParsedFormat,

  // Chain format guards
  isChainCompilationParsed,
  isChainExecutionStartParsed,
  isChainStatusUpdateParsed,
  isExecutionCompleteParsed,

  // Step format guards
  isStepCompletionParsed,
  isDualOutputParsed,
  isSecondOpinionSkipParsed,

  // Human interaction guards
  isHumanGateParsed,
  isLearningSurfaceParsed,
  isSessionStartProtocolParsed,

  // Registry guards
  isRegistryUpdateParsed,
  isIndexEntryParsed,
  isLearningEntryParsed,

  // Action output guards
  isReviewReportParsed,
  isAnalysisReportParsed,
  isBrainstormTranscriptParsed,

  // Status and error guards
  isErrorAnnouncementParsed,
  isContextRoutingParsed,
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
<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Example Implementation

**Request:** Build new feature X
**Source:** Meta-task

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/  | opus  | scope=test | —         | pending |

**Execution:** Single step

What each step does:
1. **code/** -- Implement feature X
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
   import { NewFormatParsed } from '../types/newFormat.js';
   import { NewFormatPatterns } from '../patterns/newFormatPatterns.js';

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
   export type { NewFormatParsed } from './types/newFormat.js';
   export { NewFormatPatterns } from './patterns/newFormatPatterns.js';
   export { parseNewFormat } from './parsers/parseNewFormat.js';
   export { isNewFormatParsed } from './guards.js';
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
├── version.ts                  # Contract version management
├── guards.ts                   # Type guard functions
├── types/                      # TypeScript type definitions
│   ├── index.ts
│   ├── chainManagement.ts
│   ├── stepLifecycle.ts
│   ├── humanInteraction.ts
│   ├── registryMetadata.ts
│   ├── actionOutputs.ts
│   └── errorStatus.ts
├── patterns/                   # Regex patterns for parsing
│   ├── chainPatterns.ts
│   ├── stepPatterns.ts
│   ├── humanPatterns.ts
│   ├── registryPatterns.ts
│   ├── actionPatterns.ts
│   └── statusPatterns.ts
├── parsers/                    # Parser functions
│   ├── index.ts
│   ├── parseChainCompilation.ts
│   ├── parseStepCompletion.ts
│   ├── parseReviewReport.ts
│   └── ...
└── __tests__/                  # Parser unit tests
```

---

**Last Updated:** 2026-02-09
