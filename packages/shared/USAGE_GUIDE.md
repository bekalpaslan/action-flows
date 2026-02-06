# Shared Types - Usage Guide

## Overview

The `@afw/shared` package provides comprehensive TypeScript interfaces for the ActionFlows Dashboard. All types support **null-safe parsed fields** for graceful degradation when Claude output doesn't follow expected format.

## File Organization

```
src/
├── types.ts        # Base types, branded strings, enums
├── events.ts       # All event type definitions
├── models.ts       # Domain models (Chain, Session, etc.)
├── commands.ts     # Command types and utilities
└── index.ts        # Main export file
```

## Quick Start

### Import Examples

```typescript
// Import all types
import type {
  SessionId,
  StepNumber,
  UserId,
  Timestamp,
  Chain,
  Session,
  WorkspaceEvent,
  Command,
} from '@afw/shared';

import {
  Status,
  Model,
  brandedTypes,
  eventGuards,
  CommandBuilder,
} from '@afw/shared';
```

## Core Concepts

### 1. Branded Types (Type Safety)

Branded types prevent accidental mixing of different ID types:

```typescript
import { brandedTypes } from '@afw/shared';

// Creating branded IDs
const sessionId = brandedTypes.sessionId('sess-123');
const userId = brandedTypes.userId('user-456');
const timestamp = brandedTypes.currentTimestamp();

// TypeScript enforces correct types
const chain: Chain = {
  id: 'chain-1',
  sessionId,        // ✅ SessionId type
  userId,           // ✅ UserId type
  title: 'My Chain',
  steps: [],
  source: 'flow',
  status: 'pending',
  compiledAt: timestamp,
};

// This would cause TypeScript error:
// const chain2: Chain = { sessionId: userId }; ❌ Type mismatch
```

### 2. Enums for Clarity

```typescript
import { Status, Model, ChainSource } from '@afw/shared';

// Status enum
const chainStatus: Status = Status.IN_PROGRESS;
// or using string literal
const stepStatus: StatusString = 'completed';

// Model enum
const model: Model = Model.OPUS;

// Chain source enum
const source: ChainSourceString = 'flow';
```

### 3. Null-Safe Event Fields

All events have three categories of fields:

```typescript
import type { StepCompletedEvent } from '@afw/shared';

const event: StepCompletedEvent = {
  // Automatic fields (always available from hooks)
  type: 'step:completed',
  sessionId,
  timestamp,
  stepNumber: 1 as StepNumber,
  duration: 5000 as DurationMs,

  // Parsed fields (nullable, extracted from Claude output)
  action: 'code',          // Could be null if Claude didn't provide
  status: 'completed',     // Could be null
  result: { files: [] },   // Could be null
  learning: 'Found pattern X',  // Could be null

  // Inferred fallbacks (always available, computed)
  succeeded: true,
  outputLength: 150,
};
```

### 4. Event Type Guards

Use type guards to discriminate between event types:

```typescript
import { eventGuards } from '@afw/shared';

function handleEvent(event: WorkspaceEvent) {
  if (eventGuards.isStepCompleted(event)) {
    // event is typed as StepCompletedEvent here
    console.log(`Step ${event.stepNumber} completed in ${event.duration}ms`);
  }

  if (eventGuards.isError(event)) {
    // event is typed as ErrorOccurredEvent
    console.log(`Error: ${event.error}`);
  }

  if (eventGuards.isSessionEnded(event)) {
    // event is typed as SessionEndedEvent
    console.log(`Session ended: ${event.reason}`);
  }
}
```

## Detailed Usage Examples

### Creating a Chain

```typescript
import type { Chain, ChainStep, StepNumber } from '@afw/shared';
import { Status, Model, brandedTypes } from '@afw/shared';

const chain: Chain = {
  id: 'chain-1',
  sessionId: brandedTypes.sessionId('sess-abc'),
  userId: brandedTypes.userId('user-xyz'),
  title: 'Code Review & Fix',

  steps: [
    {
      stepNumber: 1 as StepNumber,
      action: 'review',
      model: Model.OPUS,
      inputs: { scope: 'backend' },
      waitsFor: [],
      status: Status.PENDING,
      description: 'Review backend code',
    },
    {
      stepNumber: 2 as StepNumber,
      action: 'code',
      model: Model.SONNET,
      inputs: { task: 'Fix issues from review' },
      waitsFor: [1 as StepNumber],
      status: Status.PENDING,
      description: 'Implement fixes',
    },
  ],

  source: 'flow',
  ref: 'code-and-review',
  status: Status.COMPILED,
  compiledAt: brandedTypes.currentTimestamp(),
  executionMode: 'sequential',
  estimatedDuration: brandedTypes.duration?.fromMinutes(10),
};
```

### Creating a Session

```typescript
import type { Session } from '@afw/shared';
import { Status, brandedTypes } from '@afw/shared';

const session: Session = {
  id: brandedTypes.sessionId('sess-123'),
  user: brandedTypes.userId('operator-1'),
  cwd: '/home/user/project',
  hostname: 'laptop',
  platform: 'darwin',
  chains: [],
  status: Status.IN_PROGRESS,
  startedAt: brandedTypes.currentTimestamp(),
  totalStepsExecuted: 0,
  totalChainsCompleted: 0,
};
```

### Creating Events

```typescript
import type {
  SessionStartedEvent,
  StepSpawnedEvent,
  StepCompletedEvent,
  FileCreatedEvent,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';

// Session started
const sessionStart: SessionStartedEvent = {
  type: 'session:started',
  sessionId: brandedTypes.sessionId('sess-1'),
  timestamp: brandedTypes.currentTimestamp(),
  cwd: '/project',
  user: brandedTypes.userId('user-1'),
};

// Step spawned
const stepSpawned: StepSpawnedEvent = {
  type: 'step:spawned',
  sessionId: brandedTypes.sessionId('sess-1'),
  timestamp: brandedTypes.currentTimestamp(),
  stepNumber: 1 as StepNumber,
  action: 'code',
  model: 'opus',
  inputs: { task: 'Implement feature' },
  description: 'Code implementation step',
  waitsFor: [],
  estimatedDuration: brandedTypes.duration?.fromMinutes(15),
};

// Step completed
const stepCompleted: StepCompletedEvent = {
  type: 'step:completed',
  sessionId: brandedTypes.sessionId('sess-1'),
  timestamp: brandedTypes.currentTimestamp(),
  stepNumber: 1 as StepNumber,
  duration: 900000 as DurationMs, // 15 minutes
  action: 'code',
  status: 'completed',
  result: {
    filesCreated: 3,
    filesModified: 5,
  },
  learning: 'Discovered component pattern',
  succeeded: true,
  outputLength: 2048,
};

// File created
const fileCreated: FileCreatedEvent = {
  type: 'file:created',
  sessionId: brandedTypes.sessionId('sess-1'),
  timestamp: brandedTypes.currentTimestamp(),
  path: '/project/src/new-component.ts',
  stepNumber: 1 as StepNumber,
  content: 'export const Component = () => { ... }',
  size: 256,
  relativePath: 'src/new-component.ts',
  extension: '.ts',
};
```

### Using Commands

```typescript
import { CommandBuilder, CommandValidator } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

// Using the command builder
const pauseCmd = CommandBuilder.pause()
  .withReason('Need to review output')
  .build();

const retryCmd = CommandBuilder.retry(1 as StepNumber)
  .withReason('First attempt timed out')
  .withOptions({ maxRetries: 3 })
  .build();

const skipCmd = CommandBuilder.skip(2 as StepNumber)
  .withReason('Step not applicable to this context')
  .build();

// Validate commands
const validation = CommandValidator.validate(pauseCmd);
if (validation.valid) {
  console.log('Command is valid');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Processing Events in a Stream

```typescript
import { eventGuards } from '@afw/shared';
import type { WorkspaceEvent } from '@afw/shared';

async function processEventStream(eventIterator: AsyncIterable<WorkspaceEvent>) {
  for await (const event of eventIterator) {
    // Type-safe handling of each event
    if (eventGuards.isSessionStarted(event)) {
      console.log(`Session started in ${event.cwd}`);
    } else if (eventGuards.isChainCompiled(event)) {
      console.log(`Chain "${event.title}" has ${event.totalSteps} steps`);
    } else if (eventGuards.isStepSpawned(event)) {
      console.log(`Spawning step ${event.stepNumber}: ${event.action}`);
    } else if (eventGuards.isStepCompleted(event)) {
      console.log(`Step ${event.stepNumber} completed: ${event.status}`);
    } else if (eventGuards.isStepFailed(event)) {
      console.log(`Step ${event.stepNumber} failed: ${event.error}`);
      console.log(`Retryable: ${event.isRetryable}`);
    } else if (eventGuards.isFileCreated(event)) {
      console.log(`Created: ${event.relativePath}`);
    } else if (eventGuards.isAwaitingInput(event)) {
      console.log(`Waiting for input: ${event.question}`);
    } else if (eventGuards.isError(event)) {
      console.error(`Error: ${event.error}`);
    }
  }
}
```

## Field Categories Explained

### Automatic Fields
**Always available** - provided by the system hooks/runtime:
- `type` - Event discriminator (always present)
- `sessionId` - Session context (always present)
- `timestamp` - When event occurred (always present)
- `stepNumber` (when applicable) - The step number (always present for step events)
- `duration` (for completion events) - How long the step/chain took

### Parsed Fields
**Nullable** - extracted from Claude output:
- `action` - Which action was executed (extracted from agent output)
- `result` - What the step produced (extracted from agent output)
- `learning` - Insights discovered (extracted from agent output)
- `fileChanges` - Files modified (parsed from agent report)

**Why nullable?** Claude might not follow format, output might be incomplete, or parsing might fail. Systems must gracefully degrade.

### Inferred Fallbacks
**Always available** - computed from automatic fields or defaults:
- `succeeded` - Boolean computed from `status` field
- `outputLength` - Computed from `result` size
- `isCritical` - Boolean computed based on error type
- `isRetryable` - Boolean computed based on error category

## Best Practices

### 1. Always Use Type Guards
```typescript
// ❌ Don't do this - not type-safe
if (event.type === 'step:completed') {
  console.log(event.result); // Unsafe, not all events have result
}

// ✅ Do this - type-safe
if (eventGuards.isStepCompleted(event)) {
  console.log(event.result); // Now we know event has result
}
```

### 2. Handle Nullable Parsed Fields
```typescript
// ❌ Don't assume parsed fields exist
const action = event.action.toUpperCase(); // Could be null!

// ✅ Handle gracefully
const action = event.action?.toUpperCase() ?? 'UNKNOWN';
```

### 3. Use Branded Types for Important IDs
```typescript
// ❌ Easy to mix up
function processChain(chainId: string, sessionId: string) { }

// ✅ Type-safe
import type { ChainId, SessionId } from '@afw/shared';
function processChain(chainId: ChainId, sessionId: SessionId) { }
```

### 4. Leverage Utility Factories
```typescript
// ✅ Use factories for consistency
const timestamp = brandedTypes.currentTimestamp();
const duration = brandedTypes.duration?.fromMinutes(5);
const sessionId = brandedTypes.sessionId(generateId());
```

## Type Hierarchy

```
WorkspaceEvent (union type)
├── Session events
│   ├── SessionStartedEvent
│   └── SessionEndedEvent
├── Chain events
│   ├── ChainCompiledEvent
│   ├── ChainStartedEvent
│   └── ChainCompletedEvent
├── Step events
│   ├── StepSpawnedEvent
│   ├── StepStartedEvent
│   ├── StepCompletedEvent
│   └── StepFailedEvent
├── User interaction events
│   ├── AwaitingInputEvent
│   └── InputReceivedEvent
├── File system events
│   ├── FileCreatedEvent
│   ├── FileModifiedEvent
│   └── FileDeletedEvent
└── System events
    ├── ErrorOccurredEvent
    ├── WarningOccurredEvent
    └── Registry events
```

## Migration from Legacy Types

Legacy types are still exported for backward compatibility:

```typescript
// Old style (still works)
import type { HookExecutionEvent, AgentTask } from '@afw/shared';

// New style (recommended)
import type { StepCompletedEvent, WorkspaceEvent } from '@afw/shared';
```

## Performance Considerations

1. **Type Guards are Zero-Cost** - They compile to simple JavaScript comparisons
2. **Branded Types are Zero-Cost** - They only exist at type-check time
3. **Events are Serializable** - All types are JSON-serializable for transmission
4. **Enums are Optimized** - Use string unions for better tree-shaking

## Related Documentation

- **events.ts** - Detailed event type definitions with field explanations
- **types.ts** - Base types, branded strings, and utility factories
- **models.ts** - Domain models for chains, sessions, and templates
- **commands.ts** - Command types and control flow utilities
