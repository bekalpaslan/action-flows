# Implementation Plan: P1 TypeScript Quality Fixes

**Generated:** 2026-02-06 21:49 UTC
**Scope:** P1 issues only (4 items from review)
**Risk Level:** Medium -- cross-package type changes that ripple to all consumers

---

## Table of Contents

1. [Summary of Changes](#1-summary-of-changes)
2. [Detailed File Inventory](#2-detailed-file-inventory)
3. [Implementation Steps (Ordered)](#3-implementation-steps-ordered)
4. [Dependency Graph](#4-dependency-graph)
5. [Risk Assessment](#5-risk-assessment)
6. [Verification Steps](#6-verification-steps)
7. [Suggested ActionFlows Chain](#7-suggested-actionflows-chain)

---

## 1. Summary of Changes

| P1 Issue | Description | Files Affected |
|----------|-------------|----------------|
| **P1-1** | Define `ChainId` and `StepId` as branded types | 5 files |
| **P1-2** | Update Storage interface to use branded types | 4 files |
| **P1-3** | Replace `Map<string, any>` with properly typed Maps | 3 files |
| **P1-4** | Add validation to branded type factory functions | 1 file |

**Total files to modify:** 9 unique files (some files are hit by multiple P1 items)

---

## 2. Detailed File Inventory

### Files to Modify

| # | File | Current State | Target State | P1 Items |
|---|------|---------------|--------------|----------|
| 1 | `packages/shared/src/types.ts` | Has `SessionId`, `UserId`, `StepNumber`, `Timestamp`, `DurationMs` branded types. No `ChainId` or `StepId`. Factory functions accept any string/number with no validation. | Add `ChainId` and `StepId` branded types. Add validation to all factory functions (reject empty strings, invalid values). | P1-1, P1-4 |
| 2 | `packages/shared/src/index.ts` | Exports `SessionId`, `StepNumber`, `UserId`, `Timestamp`, `DurationMs`. No `ChainId`/`StepId` exports. | Add `ChainId` and `StepId` to type exports. | P1-1 |
| 3 | `packages/shared/src/models.ts` | `Chain.id` is `string`. `ChainCompiledEvent.chainId` etc. are `string`. | Change `Chain.id` to `ChainId`. | P1-1 |
| 4 | `packages/shared/src/events.ts` | `chainId` fields are `string` or `string \| undefined`. | Change `chainId` fields to `ChainId` or `ChainId \| undefined`. | P1-1 |
| 5 | `packages/shared/src/commands.ts` | `CommandPayload.chainId` and `CommandPayload.sessionId` are `string`. | Change `CommandPayload.sessionId` to `SessionId`, `CommandPayload.chainId` to `ChainId`. | P1-1, P1-2 |
| 6 | `packages/backend/src/types.ts` | Duplicate `Storage` interface with `Map<string, any>` and `Map<string, any[]>`. | Remove duplicate Storage interface entirely (it is unused -- the real one is in `storage/index.ts`). If any consumer imports it, redirect. | P1-2, P1-3 |
| 7 | `packages/backend/src/storage/index.ts` | `Storage` interface uses `Map<string, Session>`, `Map<string, unknown[]>`, `Map<string, Chain[]>`, `Map<string, CommandPayload[]>`, `Map<string, unknown[]>`. Method params are `string` not branded. | Change Map keys to `SessionId`. Change method params `sessionId: string` to `sessionId: SessionId` and `chainId: string` to `chainId: ChainId`. Replace `unknown[]` event Maps with `WorkspaceEvent[]`. | P1-2, P1-3 |
| 8 | `packages/backend/src/storage/memory.ts` | `MemoryStorage` interface and implementation use `Map<string, Session>`, `Map<string, unknown[]>`, etc. Method params are `string`. | Change Map keys to `SessionId`. Change method params to branded types. Type events as `WorkspaceEvent[]` instead of `unknown[]`. Type input queue values. | P1-2, P1-3 |
| 9 | `packages/backend/src/storage/redis.ts` | `RedisStorage` interface method params are `string`. | Change method params to branded types (`SessionId`, `ChainId`). Type events as `WorkspaceEvent[]`. | P1-2, P1-3 |

### Files NOT Modified (but validated as safe)

These files are **consumers** that will benefit from the changes but do not need modification because they already cast `id as SessionId` at the call site, which remains valid:

| File | Reason No Change Needed |
|------|------------------------|
| `packages/backend/src/routes/sessions.ts` | Already does `id as SessionId` -- this is correct since `req.params.id` is unvalidated `string`. Routes are the trust boundary. No change to route files in P1 scope. |
| `packages/backend/src/routes/events.ts` | Passes `sessionId: string` from params -- storage methods will now require `SessionId`. Routes must cast. Already does this implicitly (passes raw strings that storage accepts). **Wait** -- this file passes `sessionId` as plain `string` to `storage.getEvents(sessionId)`. After P1-2 changes, this will fail. **NEEDS ATTENTION.** |
| `packages/backend/src/routes/commands.ts` | Same pattern -- passes `id as SessionId`. Already correct. |
| `packages/backend/src/routes/files.ts` | Same pattern. Already correct. |
| `packages/backend/src/ws/handler.ts` | Passes `message.sessionId` as `string` to storage methods. After P1-2, needs cast. |
| `packages/backend/src/services/fileWatcher.ts` | Already uses `SessionId` branded type throughout. Clean. |
| `packages/backend/src/index.ts` | Uses storage indirectly. No direct storage method calls with string keys. Clean. |

### Route Files That WILL Need Small Fixes

After P1-2 changes Storage method signatures from `string` to `SessionId`/`ChainId`, these files will get TypeScript errors because they pass unvalidated strings. The fix is to add `as SessionId` casts (which most already have) or use `brandedTypes.sessionId()`:

| File | Lines Needing Fix |
|------|-------------------|
| `packages/backend/src/routes/events.ts` | Lines 25, 67, 71 -- `storage.getEvents(sessionId)` and `storage.getEventsSince(sessionId, since)` need `sessionId as SessionId` |
| `packages/backend/src/ws/handler.ts` | Line 72 -- `storage.queueInput(message.sessionId, ...)` needs `message.sessionId as SessionId` |

---

## 3. Implementation Steps (Ordered)

### Step 1: Add ChainId and StepId branded types + validation (packages/shared/src/types.ts)

**File:** `packages/shared/src/types.ts`

**Changes:**

1. Add `ChainId` branded type:
   ```typescript
   /** Unique identifier for a chain */
   export type ChainId = string & { readonly __brand: 'ChainId' };
   ```

2. Add `StepId` branded type:
   ```typescript
   /** Unique identifier for a step (composite: chainId + stepNumber) */
   export type StepId = string & { readonly __brand: 'StepId' };
   ```

3. Add validated factory functions for new types:
   ```typescript
   chainId: (value: string): ChainId => {
     if (!value || value.trim().length === 0) {
       throw new Error('ChainId cannot be empty');
     }
     return value as ChainId;
   },
   stepId: (value: string): StepId => {
     if (!value || value.trim().length === 0) {
       throw new Error('StepId cannot be empty');
     }
     return value as StepId;
   },
   ```

4. Add validation to EXISTING factory functions:
   ```typescript
   sessionId: (value: string): SessionId => {
     if (!value || value.trim().length === 0) {
       throw new Error('SessionId cannot be empty');
     }
     return value as SessionId;
   },
   userId: (value: string): UserId => {
     if (!value || value.trim().length === 0) {
       throw new Error('UserId cannot be empty');
     }
     return value as UserId;
   },
   stepNumber: (value: number): StepNumber => {
     if (!Number.isFinite(value) || value < 1) {
       throw new Error('StepNumber must be a positive integer >= 1');
     }
     return value as StepNumber;
   },
   timestamp: (value: string | Date): Timestamp => {
     if (value instanceof Date) {
       if (isNaN(value.getTime())) {
         throw new Error('Timestamp: invalid Date');
       }
       return value.toISOString() as Timestamp;
     }
     if (!value || value.trim().length === 0) {
       throw new Error('Timestamp cannot be empty');
     }
     return value as Timestamp;
   },
   ```

**Dependencies:** None (leaf node)
**Risk:** LOW -- additive change only. Validation could break callers that pass empty strings intentionally, but that would be a bug anyway.

---

### Step 2: Export new branded types (packages/shared/src/index.ts)

**File:** `packages/shared/src/index.ts`

**Changes:**

1. Add `ChainId` and `StepId` to the type export:
   ```typescript
   export type {
     SessionId,
     StepNumber,
     UserId,
     Timestamp,
     StatusString,
     ModelString,
     ChainSourceString,
     DurationMs,
     ChainId,    // NEW
     StepId,     // NEW
   } from './types';
   ```

**Dependencies:** Step 1
**Risk:** NONE -- additive exports only

---

### Step 3: Update domain models to use ChainId (packages/shared/src/models.ts)

**File:** `packages/shared/src/models.ts`

**Changes:**

1. Add `ChainId` to imports:
   ```typescript
   import type {
     SessionId,
     StepNumber,
     UserId,
     Timestamp,
     StatusString,
     ModelString,
     ChainSourceString,
     DurationMs,
     ChainId,    // NEW
   } from './types';
   ```

2. Change `Chain.id` from `string` to `ChainId`:
   ```typescript
   export interface Chain {
     /** Unique identifier for this chain */
     id: ChainId;  // WAS: string
     ...
   ```

3. Change `ExecutionPlan.id` from `string` to `ChainId` (execution plans are pre-chain; this is debatable but keeps consistency):
   ```typescript
   export interface ExecutionPlan {
     /** Unique identifier */
     id: ChainId;  // WAS: string -- optional, could remain string
     ...
   ```

   **Decision:** Keep `ExecutionPlan.id` as `string` for now. Execution plans are not chains yet. Only change `Chain.id`.

4. Change `ChainTemplate.id` -- keep as `string` (templates are not runtime chains).

**Dependencies:** Step 1
**Risk:** MEDIUM -- `Chain.id` is used in storage (chains Maps), events, and frontend components. All consumers that construct `Chain` objects must now provide `ChainId` for the `id` field.

**Ripple Analysis:**
- `packages/backend/src/storage/memory.ts` line 124-129: `getChain(chainId)` iterates chains and checks `c.id === chainId` -- this will work since both are now `ChainId`.
- `packages/app/src/data/sampleChain.ts`: Constructs sample Chain objects -- will need `brandedTypes.chainId(...)` for `id` field.
- `packages/app/src/components/ChainDemo.tsx`: Constructs Chain objects -- same fix.

---

### Step 4: Update event types to use ChainId (packages/shared/src/events.ts)

**File:** `packages/shared/src/events.ts`

**Changes:**

1. Add `ChainId` to imports:
   ```typescript
   import type {
     SessionId,
     StepNumber,
     UserId,
     Timestamp,
     StatusString,
     ModelString,
     ChainSourceString,
     DurationMs,
     ChainId,    // NEW
   } from './types';
   ```

2. Update `ChainCompiledEvent.chainId`: `string` -> `ChainId | undefined` (already optional)
   ```typescript
   chainId?: ChainId;  // WAS: string | undefined
   ```

3. Update `ChainStartedEvent.chainId`: `string` -> `ChainId`
   ```typescript
   chainId: ChainId;  // WAS: string
   ```

4. Update `ChainCompletedEvent.chainId`: `string` -> `ChainId`
   ```typescript
   chainId: ChainId;  // WAS: string
   ```

**Dependencies:** Step 1
**Risk:** LOW-MEDIUM -- Events are created by hooks and test helpers. Hook payloads from HTTP POST arrive as raw JSON (untyped at runtime), so TypeScript types don't affect runtime behavior. Test helpers need updates.

---

### Step 5: Update CommandPayload to use branded types (packages/shared/src/commands.ts)

**File:** `packages/shared/src/commands.ts`

**Changes:**

1. Add imports:
   ```typescript
   import type { StepNumber, Timestamp, SessionId, ChainId } from './types';
   ```
   (Currently imports only `StepNumber, Timestamp`)

2. Update `CommandPayload`:
   ```typescript
   export interface CommandPayload {
     commandId: string;
     command: Command;
     issuedAt: Timestamp;
     sessionId?: SessionId;  // WAS: string
     chainId?: ChainId;      // WAS: string
     userId?: UserId;        // WAS: string (needs UserId import too)
     context?: Record<string, unknown>;
   }
   ```

3. Add `UserId` to imports if needed:
   ```typescript
   import type { StepNumber, Timestamp, SessionId, ChainId, UserId } from './types';
   ```

**Dependencies:** Step 1
**Risk:** LOW -- CommandPayload is constructed in `routes/commands.ts` where values come from request body. The route already constructs the object manually, so it controls the types.

---

### Step 6: Update unified Storage interface (packages/backend/src/storage/index.ts)

**File:** `packages/backend/src/storage/index.ts`

**Changes:**

1. Update imports:
   ```typescript
   import type { Session, Chain, CommandPayload, SessionId, ChainId, WorkspaceEvent } from '@afw/shared';
   ```

2. Update `Storage` interface -- change method signatures:
   ```typescript
   export interface Storage {
     // Session storage
     sessions?: Map<SessionId, Session>;  // WAS: Map<string, Session>
     getSession(sessionId: SessionId): Session | undefined | Promise<Session | undefined>;
     setSession(session: Session): void | Promise<void>;
     deleteSession(sessionId: SessionId): void | Promise<void>;

     // Events storage
     events?: Map<SessionId, WorkspaceEvent[]>;  // WAS: Map<string, unknown[]>
     addEvent(sessionId: SessionId, event: WorkspaceEvent): void | Promise<void>;
     getEvents(sessionId: SessionId): WorkspaceEvent[] | Promise<WorkspaceEvent[]>;
     getEventsSince(sessionId: SessionId, timestamp: string): WorkspaceEvent[] | Promise<WorkspaceEvent[]>;

     // Chains storage
     chains?: Map<SessionId, Chain[]>;  // WAS: Map<string, Chain[]>
     addChain(sessionId: SessionId, chain: Chain): void | Promise<void>;
     getChains(sessionId: SessionId): Chain[] | Promise<Chain[]>;
     getChain(chainId: ChainId): Chain | undefined | Promise<Chain | undefined>;

     // Commands queue per session
     commandsQueue?: Map<SessionId, CommandPayload[]>;  // WAS: Map<string, CommandPayload[]>
     queueCommand(sessionId: SessionId, command: CommandPayload): void | Promise<void>;
     getCommands(sessionId: SessionId): CommandPayload[] | Promise<CommandPayload[]>;
     clearCommands(sessionId: SessionId): void | Promise<void>;

     // Input queue per session
     inputQueue?: Map<SessionId, unknown[]>;  // WAS: Map<string, unknown[]> -- keep unknown for input since it's user-defined
     queueInput(sessionId: SessionId, input: unknown): void | Promise<void>;
     getInput(sessionId: SessionId): unknown[] | Promise<unknown[]>;
     clearInput(sessionId: SessionId): void | Promise<void>;

     // Connected WebSocket clients
     clients?: Set<{ clientId: string; sessionId?: SessionId }>;  // WAS: string
     addClient(clientId: string, sessionId?: SessionId): void;
     removeClient(clientId: string): void;
     getClientsForSession(sessionId: SessionId): string[];

     // Pub/Sub support (Redis only)
     subscribe?(channel: string, callback: (message: string) => void): Promise<void>;
     publish?(channel: string, message: string): Promise<void>;
     disconnect?(): Promise<void>;
   }
   ```

**Dependencies:** Steps 1-5 (shared types must be defined first)
**Risk:** HIGH -- This is the central interface. All storage implementations and all route consumers must conform. This will cause cascading TypeScript errors that must be fixed in Steps 7-9.

---

### Step 7: Update MemoryStorage (packages/backend/src/storage/memory.ts)

**File:** `packages/backend/src/storage/memory.ts`

**Changes:**

1. Update imports:
   ```typescript
   import type { Session, Chain, CommandPayload, SessionId, ChainId, UserId, WorkspaceEvent } from '@afw/shared';
   import { brandedTypes } from '@afw/shared';
   ```

2. Update `MemoryStorage` interface:
   - `sessions: Map<SessionId, Session>` (was `Map<string, Session>`)
   - `getSession(sessionId: SessionId)` (was `string`)
   - `setSession(session: Session)` (unchanged -- `session.id` is now `SessionId` from Step 3... wait, Session.id is already `SessionId`. So this is already correct.)
   - `deleteSession(sessionId: SessionId)` (was `string`)
   - `sessionsByUser: Map<UserId, Set<SessionId>>` (was `Map<string, Set<string>>`)
   - `getSessionsByUser(userId: UserId): SessionId[]` (was `string[]`)
   - `getUsersWithActiveSessions(): UserId[]` (was `string[]`)
   - `events: Map<SessionId, WorkspaceEvent[]>` (was `Map<string, unknown[]>`)
   - `addEvent(sessionId: SessionId, event: WorkspaceEvent)` (was `unknown`)
   - `getEvents(sessionId: SessionId): WorkspaceEvent[]`
   - `getEventsSince(sessionId: SessionId, timestamp: string): WorkspaceEvent[]`
   - `chains: Map<SessionId, Chain[]>` (was `Map<string, Chain[]>`)
   - `addChain(sessionId: SessionId, chain: Chain)`
   - `getChains(sessionId: SessionId): Chain[]`
   - `getChain(chainId: ChainId): Chain | undefined` (was `string`)
   - `commandsQueue: Map<SessionId, CommandPayload[]>`
   - `queueCommand(sessionId: SessionId, command: CommandPayload)`
   - `getCommands(sessionId: SessionId): CommandPayload[]`
   - `clearCommands(sessionId: SessionId)`
   - `inputQueue: Map<SessionId, unknown[]>`
   - `queueInput(sessionId: SessionId, input: unknown)`
   - `getInput(sessionId: SessionId): unknown[]`
   - `clearInput(sessionId: SessionId)`
   - `clients: Set<{ clientId: string; sessionId?: SessionId }>`
   - `addClient(clientId: string, sessionId?: SessionId)`
   - `getClientsForSession(sessionId: SessionId): string[]`

3. Update implementation method signatures to match.

4. Fix `getEventsSince` -- replace `(event: any)` with `(event: WorkspaceEvent)`:
   ```typescript
   getEventsSince(sessionId: SessionId, timestamp: string) {
     const events = this.events.get(sessionId) || [];
     return events.filter((event: WorkspaceEvent) => {
       if (event.timestamp && typeof event.timestamp === 'string') {
         return new Date(event.timestamp) >= new Date(timestamp);
       }
       return true;
     });
   },
   ```

**Dependencies:** Step 6
**Risk:** MEDIUM -- Implementation must exactly match interface. Session.id is already `SessionId`, so `this.sessions.set(session.id, session)` works. The `session.user` field is already `UserId | undefined`, so `this.sessionsByUser.get(session.user)` works.

---

### Step 8: Update RedisStorage (packages/backend/src/storage/redis.ts)

**File:** `packages/backend/src/storage/redis.ts`

**Changes:**

1. Update imports:
   ```typescript
   import type { Session, Chain, CommandPayload, SessionId, ChainId, WorkspaceEvent } from '@afw/shared';
   ```

2. Update `RedisStorage` interface method signatures:
   - `getSession(sessionId: SessionId)` (was `string`)
   - `setSession(session: Session)` (unchanged)
   - `deleteSession(sessionId: SessionId)` (was `string`)
   - `addEvent(sessionId: SessionId, event: WorkspaceEvent)` (was `unknown`)
   - `getEvents(sessionId: SessionId): Promise<WorkspaceEvent[]>`
   - `getEventsSince(sessionId: SessionId, timestamp: string): Promise<WorkspaceEvent[]>`
   - `addChain(sessionId: SessionId, chain: Chain)`
   - `getChains(sessionId: SessionId): Promise<Chain[]>`
   - `getChain(chainId: ChainId): Promise<Chain | undefined>` (was `string`)
   - `queueCommand(sessionId: SessionId, command: CommandPayload)`
   - `getCommands(sessionId: SessionId): Promise<CommandPayload[]>`
   - `clearCommands(sessionId: SessionId)`
   - `queueInput(sessionId: SessionId, input: unknown)`
   - `getInput(sessionId: SessionId): Promise<unknown[]>`
   - `clearInput(sessionId: SessionId)`
   - `addClient(clientId: string, sessionId?: SessionId)`
   - `getClientsForSession(sessionId: SessionId): string[]`

3. Update implementation method signatures to match.

4. Fix `getEventsSince` -- replace `(event: any)` with `(event: WorkspaceEvent)` (after JSON.parse, cast is needed):
   ```typescript
   .filter((event: WorkspaceEvent) => { ... })
   ```
   Note: JSON.parse returns `any`, so we need `as WorkspaceEvent[]` on the map result.

5. Update `localClients` Map type:
   ```typescript
   const localClients = new Map<string, SessionId | undefined>();
   // WAS: Map<string, string | undefined>
   ```

**Dependencies:** Step 6
**Risk:** MEDIUM -- Redis stores/retrieves JSON strings, so branded types are erased at runtime. The risk is in deserialization: `JSON.parse(data)` returns `any`, and we cast to `Session`, `Chain`, etc. This is the existing pattern and won't change. The branded types only add compile-time safety.

---

### Step 9: Clean up or remove duplicate Storage interface (packages/backend/src/types.ts)

**File:** `packages/backend/src/types.ts`

**Changes:**

1. Remove the duplicate `Storage` interface entirely. It has `Map<string, any>` which is the worst typing and is not imported anywhere (the real Storage is in `storage/index.ts`).

   **Verification needed:** Search for imports of `Storage` from `../types` or `./types`.

   Current content of the file:
   ```typescript
   export type * from '@afw/shared';
   // ApiResponse, ApiErrorResponse, PaginationQuery interfaces
   // Storage interface (DUPLICATE - TO REMOVE)
   ```

   Target:
   ```typescript
   export type * from '@afw/shared';
   // Keep ApiResponse, ApiErrorResponse, PaginationQuery
   // REMOVE Storage interface
   ```

**Dependencies:** Step 6 (to ensure the real Storage in storage/index.ts is complete)
**Risk:** LOW -- Need to verify no file imports `Storage` from `../types`. If any do, redirect them to `../storage`.

---

### Step 10: Fix consumer files that will get TypeScript errors

After Steps 6-9, some consumer files will fail to compile because they pass `string` where `SessionId` is now required.

**File: `packages/backend/src/routes/events.ts`**
- Line 25: `storage.addEvent(event.sessionId, event)` -- `event.sessionId` is already `SessionId` (from BaseEvent). **OK, no change needed.**
- Line 67: `storage.getEvents(sessionId)` where `sessionId` comes from `req.params.sessionId` (plain `string`). **FIX: cast `sessionId as SessionId`**.
- Line 71: `storage.getEventsSince(sessionId, since)` -- same fix.
- Line 97: `storage.getEvents(sessionId)` -- same fix.

**File: `packages/backend/src/ws/handler.ts`**
- Line 50: `storage.addClient(clientId, message.sessionId)` -- `message.sessionId` is `string | undefined`. **FIX: cast `message.sessionId as SessionId`**.
- Line 72: `storage.queueInput(message.sessionId, message.payload)` -- same fix.

**File: `packages/backend/src/services/fileWatcher.ts`**
- Line 271: `storage.addEvent(sessionId, event as any)` -- `sessionId` is already `SessionId`. Fix: remove `as any`, use proper event type.

**File: `packages/backend/src/__tests__/helpers.ts`**
- Line 175: `} as any;` -- test helpers use `any` extensively. These are P2 scope but will need minor fixes to avoid new errors from the branded type changes.
- Existing `any` casts in test helpers are acceptable for P1 scope.

**File: `packages/app/src/data/sampleChain.ts`** (if it constructs Chain objects with `id: string`)
- Needs `id: brandedTypes.chainId('...')` instead of `id: '...'`.

**File: `packages/app/src/components/ChainDemo.tsx`** (if it constructs Chain objects)
- Same fix as sampleChain.ts.

**Dependencies:** Steps 6-9
**Risk:** LOW -- These are mechanical "add cast" fixes.

---

## 4. Dependency Graph

```
Step 1: shared/types.ts (ChainId, StepId, validation)
   |
   +---> Step 2: shared/index.ts (exports)
   |
   +---> Step 3: shared/models.ts (Chain.id -> ChainId)
   |
   +---> Step 4: shared/events.ts (chainId fields -> ChainId)
   |
   +---> Step 5: shared/commands.ts (CommandPayload fields -> branded)
   |
   +---> Step 6: backend/storage/index.ts (Storage interface)
            |
            +---> Step 7: backend/storage/memory.ts (MemoryStorage)
            |
            +---> Step 8: backend/storage/redis.ts (RedisStorage)
            |
            +---> Step 9: backend/types.ts (remove duplicate)
            |
            +---> Step 10: Fix consumer files (routes, ws, tests, app)
```

Steps 2-5 can be done in parallel (they all depend only on Step 1).
Steps 7-9 can be done in parallel (they all depend only on Step 6).
Step 10 depends on Steps 7-9.

---

## 5. Risk Assessment

### Risk 1: Breaking existing API consumers (Runtime)
- **Severity:** LOW
- **Explanation:** Branded types are erased at runtime. TypeScript structural typing means a plain `string` is still assignable to `SessionId` at runtime. The only runtime change is the validation in factory functions (Step 1).
- **Mitigation:** Validation only throws on empty/invalid values, which are already bugs. No legitimate caller passes empty strings.

### Risk 2: Cascading TypeScript errors in frontend (Compile-time)
- **Severity:** MEDIUM
- **Explanation:** Changing `Chain.id` from `string` to `ChainId` affects every file that constructs a `Chain` object. Frontend components like `ChainDemo.tsx` and `sampleChain.ts` create mock chains.
- **Mitigation:** These files must use `brandedTypes.chainId(...)` for the `id` field. This is a mechanical fix. Run `pnpm type-check` after each step to catch issues early.

### Risk 3: Redis deserialization loses branded types
- **Severity:** LOW
- **Explanation:** When Redis stores a `Session` as JSON and retrieves it, `JSON.parse()` returns plain objects. The branded type information is lost. However, this is already the case for `SessionId` -- it works today because TypeScript trusts the cast.
- **Mitigation:** This is the existing pattern. No new risk introduced. The `as Session` cast after `JSON.parse` already handles this.

### Risk 4: Test failures from validation
- **Severity:** MEDIUM
- **Explanation:** Adding validation to `brandedTypes.sessionId('')` will throw. If any test passes empty strings, it will break.
- **Mitigation:** Search codebase for `brandedTypes.sessionId('')` or similar empty-string calls before implementing. Fix tests to use non-empty values. Current test code uses `brandedTypes.sessionId('test-session-...')` which is fine.

### Risk 5: `getUsersWithActiveSessions` and `getSessionsByUser` not on unified Storage interface
- **Severity:** LOW (pre-existing issue, not introduced by this change)
- **Explanation:** `routes/sessions.ts` calls `storage.getUsersWithActiveSessions()` and `storage.getSessionsByUser()` which exist on `MemoryStorage` but NOT on the unified `Storage` interface. This works today because the storage singleton happens to be a MemoryStorage instance, but TypeScript should flag it.
- **Mitigation:** Out of P1 scope. Note as [FRESH EYE] discovery. Do not fix in this PR to avoid scope creep.

---

## 6. Verification Steps

### After Each Step

1. Run `pnpm type-check` from the monorepo root to catch TypeScript errors early.

### After All Steps Complete

1. **Type check:** `pnpm type-check` -- must pass with 0 errors.
2. **Build:** `pnpm build` -- must succeed for all packages.
3. **Unit tests:** `pnpm test` -- all existing tests must pass.
4. **Grep validation:**
   - `grep -r "Map<string, any>" packages/backend/src/` should return 0 results (excluding `__tests__/`).
   - `grep -r "Map<string, any>" packages/backend/src/types.ts` should return 0 results.
5. **Runtime smoke test:**
   - Start backend: `pnpm dev:backend`
   - POST a session: `curl -X POST http://localhost:3001/api/sessions -H "Content-Type: application/json" -d '{"cwd":"/tmp"}'`
   - Verify 201 response with valid session ID.
6. **Branded type validation test:**
   - Verify that `brandedTypes.sessionId('')` throws.
   - Verify that `brandedTypes.chainId('')` throws.
   - Verify that `brandedTypes.stepNumber(0)` throws.
   - Verify that `brandedTypes.stepNumber(-1)` throws.

---

## 7. Suggested ActionFlows Chain

```
code -> review -> test -> commit
```

| Step | Action | Description |
|------|--------|-------------|
| 1 | `code` | Implement all 10 steps in order |
| 2 | `review` | Self-review the changes for completeness |
| 3 | `test` | Run type-check, build, and tests |
| 4 | `commit` | Commit with message: `refactor: add ChainId/StepId branded types and validate factory functions (P1 quality)` |

---

## Appendix: Full `any` Usage Inventory (P1-relevant only)

| File | Line | Usage | P1 Fix? |
|------|------|-------|---------|
| `backend/src/types.ts` | 41 | `Map<string, any>` | YES -- remove entire interface |
| `backend/src/types.ts` | 43 | `Map<string, any[]>` | YES -- remove entire interface |
| `backend/src/storage/memory.ts` | 105 | `(event: any)` in filter | YES -- change to `WorkspaceEvent` |
| `backend/src/storage/redis.ts` | 135 | `(event: any)` in filter | YES -- change to `WorkspaceEvent` |
| `backend/src/routes/events.ts` | 29 | `const stepEvent = event as any` | NO (P2 -- route-level unsafe cast) |
| `backend/src/routes/events.ts` | 46 | `(event as any).id` | NO (P2) |
| `backend/src/routes/events.ts` | 104 | `(event: any)` in filter | NO (P2 -- events from storage will be typed after P1-3) |
| `backend/src/routes/files.ts` | 60-61 | `(req as any).validatedPath` | NO (P2) |
| `backend/src/index.ts` | 54 | `Set<any>` for wsConnectedClients | NO (P2) |
| `backend/src/__tests__/helpers.ts` | many | Extensive `any` usage | NO (P2 -- test code) |

**Total `any` instances fixed by P1:** 4 (in types.ts, memory.ts, redis.ts)

---

**Notification skipped -- not configured.**
