# @afw/shared - ActionFlows Dashboard Shared Types

Comprehensive TypeScript type definitions and utilities for the ActionFlows Dashboard.

## Quick Overview

```
1,337 lines of TypeScript | 60+ types | 18 events | 17 type guards | Zero-cost abstractions
```

## What's Inside

### 📦 Base Types (`types.ts`)
- **Branded Types**: `SessionId`, `StepNumber`, `UserId`, `Timestamp`, `DurationMs`
  - Prevent accidental mixing of different ID types
  - Zero-cost at runtime (compile-time only)
- **Enums**: `Status`, `Model`, `ChainSource`
- **Utility Factories**: Create and format branded types safely

### 📡 Event Types (`events.ts`)
18 comprehensive event types across 6 categories:

| Category | Events | Key Features |
|----------|--------|--------------|
| **Session** | Started, Ended | Session lifecycle with metadata |
| **Chain** | Compiled, Started, Completed | Chain compilation and execution |
| **Step** | Spawned, Started, Completed, Failed | Detailed step execution tracking |
| **Interaction** | AwaitingInput, InputReceived | User input handling |
| **File** | Created, Modified, Deleted | File operations with tracing |
| **System** | Error, Warning, Registry Updates | System events and diagnostics |

**Key Feature**: Null-safe parsed fields for graceful degradation
- **Automatic fields**: Always available from system hooks
- **Parsed fields**: Nullable, extracted from Claude output
- **Inferred fallbacks**: Always available, computed values

### 🏗️ Domain Models (`models.ts`)
Complete data structures for:
- `Chain` - Compiled execution sequences with lifecycle
- `Session` - User session with chains and metrics
- `ExecutionPlan` - Execution proposals with approval workflow
- `ActionRegistryEntry` - Action definitions with inputs
- `FlowDefinition` - Flow specifications by department
- `ExecutionMetrics` - Performance and usage statistics
- `ChainTemplate` - Reusable execution patterns

### ⚡ Commands (`commands.ts`)
Complete command system for controlling execution:
- **Command Types**: pause, resume, cancel, retry, skip, abort
- **Utilities**:
  - `CommandBuilder` - Fluent API for building commands
  - `CommandValidator` - Validates command structure
  - Type guards for each command type

## Installation

```bash
# Install dependencies (uses pnpm workspaces)
pnpm install

# Type check
pnpm type-check
```

## Quick Start

### Basic Usage

```typescript
import type { Chain, WorkspaceEvent, Command } from '@afw/shared';
import { brandedTypes, eventGuards, CommandBuilder } from '@afw/shared';

// Create a chain with type safety
const chain: Chain = {
  id: 'chain-1',
  sessionId: brandedTypes.sessionId('sess-abc'),
  title: 'Code Review',
  steps: [],
  source: 'flow',
  status: 'pending',
  compiledAt: brandedTypes.currentTimestamp(),
};

// Handle events safely
function handleEvent(event: WorkspaceEvent) {
  if (eventGuards.isStepCompleted(event)) {
    console.log(`Step ${event.stepNumber} completed`);
    console.log(`Learning: ${event.learning ?? 'None'}`);
  }
}

// Create commands with validation
const retry = CommandBuilder.retry(1 as StepNumber)
  .withReason('Timeout')
  .build();
```

### Working with Branded Types

```typescript
import { brandedTypes } from '@afw/shared';

// Create branded IDs
const sessionId = brandedTypes.sessionId('sess-123');
const userId = brandedTypes.userId('user-456');

// Create timestamps
const now = brandedTypes.currentTimestamp();
const specificTime = brandedTypes.timestamp(new Date('2025-02-06'));

// Create durations
const duration = brandedTypes.duration?.fromMinutes(15);

// TypeScript prevents mixing types
const chain: Chain = {
  sessionId, // ✅ Correct type
  userId,    // ✅ Correct type
  // sessionId: userId // ❌ Type error!
};
```

### Event Discriminators

```typescript
import { eventGuards, type WorkspaceEvent } from '@afw/shared';

async function processEvents(stream: AsyncIterable<WorkspaceEvent>) {
  for await (const event of stream) {
    if (eventGuards.isSessionStarted(event)) {
      console.log(`Session started in ${event.cwd}`);
    } else if (eventGuards.isChainCompiled(event)) {
      console.log(`Chain has ${event.totalSteps} steps`);
    } else if (eventGuards.isStepFailed(event)) {
      console.log(`Step failed: ${event.error}`);
      console.log(`Retryable: ${event.isRetryable}`);
    } else if (eventGuards.isFileCreated(event)) {
      console.log(`File: ${event.relativePath}`);
    } else if (eventGuards.isError(event)) {
      console.error(`System error: ${event.error}`);
    }
  }
}
```

### Command Creation

```typescript
import { CommandBuilder, CommandValidator } from '@afw/shared';

// Using builder pattern
const pauseCmd = CommandBuilder.pause()
  .withReason('Reviewing output')
  .build();

const retryCmd = CommandBuilder.retry(1 as StepNumber)
  .withReason('Network timeout')
  .withOptions({ maxRetries: 3 })
  .build();

// Validate commands
const validation = CommandValidator.validate(pauseCmd);
if (!validation.valid) {
  console.error('Invalid command:', validation.errors);
}
```

## File Structure

```
packages/shared/
├── src/
│   ├── types.ts          # Base types & branded strings (83 lines)
│   ├── events.ts         # Event definitions (438 lines)
│   ├── models.ts         # Domain models (394 lines)
│   ├── commands.ts       # Command system (280 lines)
│   └── index.ts          # Main exports (142 lines)
├── USAGE_GUIDE.md        # Comprehensive usage guide
├── README.md             # This file
├── package.json
└── tsconfig.json
```

## Type Exports Summary

### Base Types (from `types.ts`)
```typescript
// Branded types (type-safe identifiers)
type SessionId = string & { readonly __brand: 'SessionId' };
type StepNumber = number & { readonly __brand: 'StepNumber' };
type UserId = string & { readonly __brand: 'UserId' };
type Timestamp = string & { readonly __brand: 'Timestamp' };
type DurationMs = number & { readonly __brand: 'DurationMs' };

// Enums
enum Status { PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED }
enum Model { HAIKU, SONNET, OPUS }
enum ChainSource { FLOW, COMPOSED, META_TASK }

// Type unions
type StatusString = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
type ModelString = 'haiku' | 'sonnet' | 'opus';
type ChainSourceString = 'flow' | 'composed' | 'meta-task';
```

### Event Types (from `events.ts`)
```typescript
// Session events
type SessionStartedEvent = { type: 'session:started', cwd, user?, ... }
type SessionEndedEvent = { type: 'session:ended', duration?, reason?, ... }

// Chain events
type ChainCompiledEvent = { type: 'chain:compiled', title?, steps?, ... }
type ChainStartedEvent = { type: 'chain:started', chainId, ... }
type ChainCompletedEvent = { type: 'chain:completed', status?, summary?, ... }

// Step events
type StepSpawnedEvent = { type: 'step:spawned', stepNumber, action?, ... }
type StepCompletedEvent = { type: 'step:completed', status?, result?, learning?, ... }
type StepFailedEvent = { type: 'step:failed', error?, isRetryable, ... }

// File events
type FileCreatedEvent = { type: 'file:created', path, stepNumber?, ... }
type FileModifiedEvent = { type: 'file:modified', path, changes?, ... }
type FileDeletedEvent = { type: 'file:deleted', path, reason?, ... }

// Interaction events
type AwaitingInputEvent = { type: 'interaction:awaiting-input', question?, ... }
type InputReceivedEvent = { type: 'interaction:input-received', input, source, ... }

// System events
type ErrorOccurredEvent = { type: 'error:occurred', error, severity?, ... }
type WarningOccurredEvent = { type: 'warning:occurred', warning, ... }

// Union type
type WorkspaceEvent = SessionStartedEvent | SessionEndedEvent | ... (all 18 types)
```

### Domain Models (from `models.ts`)
```typescript
interface ChainStep {
  stepNumber: StepNumber;
  action: string;
  model: ModelString;
  inputs: Record<string, unknown>;
  waitsFor: StepNumber[];
  status: StatusString;
  // ... lifecycle fields
}

interface Chain {
  id: string;
  sessionId: SessionId;
  title: string;
  steps: ChainStep[];
  source: ChainSourceString;
  status: StatusString;
  // ... lifecycle fields
}

interface Session {
  id: SessionId;
  user?: UserId;
  cwd: string;
  chains: Chain[];
  status: StatusString;
  // ... metrics fields
}
```

### Commands (from `commands.ts`)
```typescript
type Command =
  | PauseCommand
  | ResumeCommand
  | CancelCommand
  | RetryCommand
  | SkipCommand
  | AbortCommand;

interface CommandPayload {
  commandId: string;
  command: Command;
  issuedAt: Timestamp;
  sessionId?: string;
  // ... metadata
}

class CommandBuilder {
  static pause(): CommandBuilder;
  static resume(): CommandBuilder;
  static cancel(): CommandBuilder;
  static retry(stepNumber: StepNumber): CommandBuilder;
  static skip(stepNumber: StepNumber): CommandBuilder;
  static abort(): CommandBuilder;
  // ... chainable methods
}
```

## Key Design Decisions

### 1. Branded Types for Safety
```typescript
// Without branded types (error-prone):
function processChain(chainId: string, sessionId: string) { }
processChain(userId, chainId); // ❌ Oops!

// With branded types (safe):
function processChain(chainId: ChainId, sessionId: SessionId) { }
processChain(userId, chainId); // ✅ Type error caught!
```

### 2. Null-Safe Parsed Fields
```typescript
// Events gracefully handle missing Claude output:
const event: StepCompletedEvent = {
  // Always available (from system)
  type: 'step:completed',
  stepNumber: 1 as StepNumber,
  duration: 5000 as DurationMs,

  // May be null (from Claude, which might not follow format perfectly)
  action: 'code' ?? 'unknown',
  result: result ?? null,
  learning: learning ?? undefined,

  // Always computed
  succeeded: status === 'completed' ?? false,
};
```

### 3. Type Guards for Runtime Safety
```typescript
// Instead of unsafe type checking:
if (event.type === 'step:completed') { } // ❌ Unsafe

// Use type guards:
if (eventGuards.isStepCompleted(event)) { } // ✅ Safe, narrows type
```

## Performance Characteristics

| Feature | Runtime Cost | Type-Check Cost |
|---------|--------------|-----------------|
| Branded types | Zero | Minimal |
| Enums | String comparison | Minimal |
| Type guards | Function call | Minimal |
| Union types | N/A | Minimal |
| Interfaces | Zero | Minimal |

All abstractions are zero-cost or minimal-cost for type checking.

## Backward Compatibility

Legacy types are preserved:
- `HookExecutionEvent`
- `WebSocketMessage`
- `AgentTask`
- `HookDefinition`

New code should use the new event system; legacy code continues working.

## Development

### Type Checking
```bash
pnpm type-check
```

### Building
```bash
pnpm build
```

### Using in Other Packages
```typescript
// In another package that depends on @afw/shared
import type { Chain, WorkspaceEvent } from '@afw/shared';
```

## Documentation

- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Comprehensive usage examples and patterns
- **[src/types.ts](./src/types.ts)** - Base types with JSDoc
- **[src/events.ts](./src/events.ts)** - Event definitions with field explanations
- **[src/models.ts](./src/models.ts)** - Domain models with JSDoc
- **[src/commands.ts](./src/commands.ts)** - Command system with examples

## License

MIT

## Contributing

When adding new types:
1. Follow existing naming conventions
2. Add comprehensive JSDoc comments
3. Include type guards for event types
4. Update USAGE_GUIDE.md with examples
5. Ensure backward compatibility
