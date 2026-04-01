# Coding Conventions

**Analysis Date:** 2026-04-01

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` (e.g., `ControlButtons.tsx`, `AppContent.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useChatMessages.ts`, `useSessionControls.ts`)
- Services: camelCase (e.g., `fileWatcher.ts`, `harmonyDetector.ts`)
- Routes: lowercase kebab-case (e.g., `sessions.ts`, `terminal.ts`)
- Tests: `*.test.ts` or `*.spec.ts` suffix (e.g., `errorHandler.test.ts`)
- Contracts: `*.contract.md` for behavioral contracts (e.g., `AppContent.contract.md`)

**Functions:**
- camelCase for all functions and methods
- Hook functions prefixed with `use` (React hooks pattern)
- Private/internal functions often prefixed with underscore or placed in utility files
- Handler functions suffixed with verb (e.g., `handlePause`, `handleCancelConfirm`, `handleWebSocket`)

**Variables:**
- camelCase for all local variables and constants
- Boolean variables often prefixed with `is`, `has`, `should`, `can` (e.g., `isPausing`, `hasActiveChain`, `isPaused`)
- Event callbacks prefixed with `on` (e.g., `onEvent`, `onClose`)
- useState setters use `set` prefix (e.g., `setMessages`, `setShowCancelConfirm`)
- State tracking refs use `Ref` suffix (e.g., `seenIdsRef`, `heartbeatInterval`)
- Service instances use descriptive names (e.g., `clientRegistry`, `claudeCliManager`)

**Types:**
- PascalCase for all type/interface names (e.g., `ChatDisplayMessage`, `ControlButtonsProps`, `Session`)
- Branded string types use descriptive names (e.g., `SessionId`, `ChainId`, `StepId`, `UserId`, `Timestamp`)
- Event types suffixed with `Event` (e.g., `FileCreatedEvent`, `ChainCompletedEvent`, `HarmonyCheckEvent`)
- Props interfaces suffixed with `Props` (e.g., `ControlButtonsProps`, `ChainBadgeProps`)

**Constants:**
- UPPER_SNAKE_CASE for all constants (e.g., `HEARTBEAT_INTERVAL_MS`, `IDLE_THRESHOLD_MS`, `DENIED_PATHS`)
- Environment variable names follow pattern `AFW_CONSTANT_NAME` (e.g., `AFW_CORS_ORIGINS`, `AFW_API_KEY`)

## Code Style

**Formatting:**
- No explicit ESLint/Prettier config found in repo root or packages
- Default to TypeScript strict mode settings (per `tsconfig.base.json`)
- Targets ES2022 with NodeNext module resolution

**Linting:**
- TypeScript strict mode enabled with `strict: true`
- Additional safety: `noUncheckedIndexedAccess: true` to catch array bounds issues
- Force consistent casing with `forceConsistentCasingInFileNames: true`
- No ESLint configuration detected; follows TypeScript compiler rules

**Import Statements:**
- All packages use ES modules (`"type": "module"` in package.json)
- Absolute paths via path aliases defined in `tsconfig.base.json`
- Workspace packages imported via `@afw/*` aliases (e.g., `@afw/shared`, `@afw/backend`)

## Import Organization

**Order (from packages/backend/src/index.ts):**
1. External npm packages (express, cors, compression, ws, etc.)
2. TypeScript type imports (import type { ... })
3. Internal relative imports (storage, services, routes)
4. Type-only imports at top (import type { SessionId, ... })
5. Aggregate imports from shared package

**Path Aliases:**
```json
{
  "@afw/shared": "packages/shared/src/index.ts",
  "@afw/shared/*": "packages/shared/src/*",
  "@afw/backend": "packages/backend/src/index.ts",
  "@afw/backend/*": "packages/backend/src/*",
  "@afw/app": "packages/app/src/index.ts",
  "@afw/app/*": "packages/app/src/*",
  "@afw/hooks": "packages/hooks/src/index.ts",
  "@afw/hooks/*": "packages/hooks/src/*"
}
```

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations and error boundary code
- Error sanitization via `sanitizeError()` function (`packages/backend/src/middleware/errorHandler.ts`)
  - Development: includes error message
  - Production: generic "An internal error occurred" message
- Silent failure pattern for secondary services: catch errors and log at debug level without crashing server
- Graceful degradation: services that fail to initialize log error but allow server to start

**Examples from codebase:**
```typescript
// Try-catch with error logging
try {
  await someAsyncOperation();
} catch (error) {
  console.error('[ServiceName] Failed to do thing:', error);
}

// Silent fail with debug logging (for secondary services)
try {
  await initializeSecondaryService();
} catch (error) {
  console.debug('[ServiceName] Not available (graceful degradation):', error);
}

// Error handler middleware logs full error server-side, returns sanitized response to client
globalErrorHandler(err, req, res, next) {
  console.error(`[Error Handler] ${req.method} ${req.path}:`, err);
  res.status(500).json({ error: 'Internal server error', message: sanitizeError(err) });
}
```

## Logging

**Framework:** console (no external logging library)

**Patterns:**
- All logs include module/service prefix in square brackets: `[ModuleName]`
- Log levels: `console.log()` for info, `console.error()` for errors, `console.warn()` for warnings, `console.debug()` for debug
- Structured logging with consistent prefix format: `[ServiceName] Message here`
- Status indicators using emoji for visual scanning: `✅` (success), `❌` (error), `⚠️` (warning)
- Log example: `console.log('[WS] Server heartbeat started (20s interval, only to idle clients)')`
- Server startup displays ASCII banner with status information

## Comments

**When to Comment:**
- Complex business logic requiring explanation
- Non-obvious design decisions (e.g., why silent failure is chosen)
- References to external specs or protocols (e.g., "Fix 5", "Component 3 - Agent Behavior Validation")
- Behavioral contracts: detailed inline comments in contract files explaining component lifecycle

**JSDoc/TSDoc:**
- Used for exported functions and types
- Includes description, parameters, return types, and examples
- Example (from `useChatMessages.ts`):
```typescript
/**
 * useChatMessages Hook
 * Listens to WebSocket events for chat messages and maintains message state.
 * Consumes chat:message and chat:history events from the backend message aggregator.
 * Falls back to claude-cli:output for stderr error display.
 */
```
- Functions document their purpose and key behaviors
- Types document nominal typing constraints (e.g., branded string types)

## Function Design

**Size:** Generally small, focused functions (under 50 lines typical for handlers)

**Parameters:**
- Avoid parameter objects for simple cases; use typed objects when > 3 parameters
- Prefix booleans with `is`/`has`/`should` for clarity
- Props interfaces suffixed with `Props` for React components

**Return Values:**
- Promise-returning functions properly typed with return type annotations
- Void returns explicit for side-effect-only functions (e.g., middleware)
- Nullable returns marked with `| null` or `| undefined` for optional values

**Examples:**
```typescript
// Handler with async error handling
const handlePause = async () => {
  if (!session.id || isPausing || !isRunning) return;
  setIsPausing(true);
  try {
    await controls.pause(session.id);
    console.log('[ControlButtons] Pause command sent');
  } catch (error) {
    console.error('[ControlButtons] Failed to pause:', error);
    alert('Failed to pause session. See console for details.');
  } finally {
    setIsPausing(false);
  }
};

// Broadcast function with proper typing
function broadcastFileEvent(
  sessionId: SessionId,
  event: FileCreatedEvent | FileModifiedEvent | FileDeletedEvent
) {
  const message = JSON.stringify({ type: 'event', sessionId, payload: event });
  clientRegistry.broadcastToSession(sessionId, message);
}
```

## Module Design

**Exports:**
- Named exports for public API
- Default exports used rarely (primary component only)
- Barrel files (`index.ts`) export common types and functions from package

**Barrel Files:**
- `packages/shared/src/index.ts`: aggregates exports from types.ts, events.ts, models.ts, commands.ts
- `packages/backend/src/index.ts`: exports app, server, wss, storage for testing
- Service initialization functions exported for setup phase

**Example (packages/shared/src/index.ts):**
```typescript
export type { SessionId, ChainId, StepId, ... } from './types.js';
export { Status, Model, ChainSource, brandedTypes, ... } from './types.js';
export type { BaseEvent, SessionStartedEvent, ... } from './events.js';
```

## Branded Types & Type Safety

**Pattern:** Nominal typing using unique symbols for compile-time safety

**Usage:**
- All entity IDs are branded: `SessionId`, `ChainId`, `StepId`, `UserId`, `Timestamp`, `RegionId`, `EdgeId`
- Branded types prevent accidental mixing (e.g., can't assign `ChainId` to `SessionId`)
- Assertion/conversion functions provide runtime validation

**Example:**
```typescript
declare const SessionIdSymbol: unique symbol;
export type SessionId = string & { readonly [SessionIdSymbol]: true };

export function toSessionId(value: string): SessionId {
  assertSessionId(value);
  return value as SessionId;
}
```

## React Patterns

**Hooks:**
- All custom hooks follow `use` prefix convention
- Hooks manage local state with `useState` and effects with `useEffect`
- Context subscription via dedicated `use*Context()` hooks

**Components:**
- Functional components with TypeScript
- Props interfaces separate and well-typed
- Behavioral contracts document component lifecycle (e.g., `AppContent.contract.md`)

**Context/Providers:**
- Provider components wrap tree (e.g., `ThemeProvider`, `WebSocketProvider`, `SessionProvider`)
- Context hooks exported for consuming components

---

*Convention analysis: 2026-04-01*
