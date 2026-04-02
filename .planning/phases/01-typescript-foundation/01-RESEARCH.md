# Phase 1: TypeScript Foundation - Research

**Researched:** 2026-04-02
**Domain:** TypeScript strict mode compliance, branded type patterns, backend compilation
**Confidence:** HIGH

## Summary

Phase 1 is a mechanical cleanup phase: fix 117 TypeScript compilation errors exclusively in `packages/backend/` so that `pnpm type-check` passes with zero errors across all packages. The frontend (`packages/app/`) and shared (`packages/shared/`) packages already compile clean. No new libraries are needed. No architectural changes are required.

The errors fall into 7 well-defined categories with established fix patterns already visible in the codebase. The branded type system (`SessionId`, `ChainId`, `StepId`, `UserId`, `DurationMs`) is already well-designed in `packages/shared/src/types.ts` with constructor functions (`toSessionId()`, `toDurationMs()`, etc.) -- the problem is that backend code bypasses these constructors or fails to handle the `undefined` values that TypeScript strict mode surfaces.

**Primary recommendation:** Fix errors in dependency order -- start with shared type adjustments (WorkspaceEvent union, FlowAnalytics type), then storage layer, then services, then routes. Each file's errors are self-contained and can be fixed independently within a category.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- user delegated all implementation decisions for this mechanical phase.

### Claude's Discretion
- **D-01:** Error fix strategy -- Fix errors inline with proper null checks and type guards. Prefer narrowing (`if (!x) return`) over assertion (`x!`). Add validation at route entry points where `req.params` values may be undefined.
- **D-02:** WorkspaceEvent union -- Add `timestamp` and `sessionId` as required fields to the base `WorkspaceEvent` type (or add them to all event variants). 13 errors stem from this missing property. Choose the approach that provides the cleanest type contract.
- **D-03:** Branded type enforcement -- DurationMs and other branded types must use constructor functions. Replace the 6 direct `as DurationMs` casts with proper `createDurationMs()` helpers. This sets the pattern agents will copy.
- **D-04:** Storage interface -- Fix `RedisStorage` to include missing methods (`getUser`, `setUser`, `deleteUser`, `getUsersByRole`, `listSessions`). Either implement them or declare them in the interface.
- **D-05:** Index type safety -- Fix the 11 `undefined cannot be used as index type` errors with proper null checks before indexing.
- **D-06:** shellEscape utility -- Fix the single undefined error in `utils/shellEscape.ts`.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | TypeScript compiles with zero errors across all packages | All 117 errors catalogued by file, error code, and category. Fix patterns documented for each category. |
| FOUND-02 | Branded types (SessionId, ChainId, StepId, UserId) used correctly -- no `as any` bypasses | Existing branded type system in `packages/shared/src/types.ts` already provides constructors (`toSessionId()`, `toDurationMs()`, etc.). 6 `DurationMs` casts need replacement with `toDurationMs()`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Rebuild after code changes:** CLAUDE.md requires rebuild/redeploy after code changes
- **Conventional commits:** Use `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` prefixes
- **Co-author tag:** `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- **TypeScript strict mode:** `strict: true` and `noUncheckedIndexedAccess: true` -- do NOT weaken these settings
- **ES modules:** All packages use `"type": "module"` with NodeNext module resolution
- **Type-check command:** `pnpm type-check` runs `tsc --noEmit` across all packages
- **Test command:** `pnpm test` runs `vitest run` -- tests should still pass after fixes
- **Path aliases:** `@afw/shared`, `@afw/backend`, etc. for cross-package imports

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | Installed (strict mode) | Type checking | Already configured with `strict: true`, `noUncheckedIndexedAccess: true` |
| Vitest | Installed | Test framework | Already configured in `packages/backend/vitest.config.ts` |

### Supporting
No new libraries needed. This phase uses only what exists.

### Alternatives Considered
None -- this is a fix-in-place phase, not a library selection phase.

## Architecture Patterns

### Error Categories and Fix Patterns

All 117 errors are in `packages/backend/src/`. They break down into 7 categories with specific fix patterns.

#### Category 1: `string | undefined` to `string` parameter mismatches (26 errors -- TS2345)

**Files:** routes/dossiers.ts (6), routes/lifecycle.ts (8), routes/analytics.ts (1), routes/sessions.ts (1), routes/healingRecommendations.ts (1), routes/suggestions.ts (2), routes/patterns.ts (1), cli/harmony-enforce.ts (4), services/claudeSessionDiscovery.ts (1), services/checkpoints/gate07-execute-step.ts (1)

**Root cause:** Express `req.params.xxx` returns `string | undefined` but functions expect `string`.

**Fix pattern -- early return guard:**
```typescript
// BEFORE (fails):
const result = someFunction(req.params.id);

// AFTER (correct):
const { id } = req.params;
if (!id) {
  return res.status(400).json({ error: 'Missing required parameter: id' });
}
// id is now narrowed to string
const result = someFunction(id);
```

**Fix pattern -- for CLI args (harmony-enforce.ts):**
```typescript
// BEFORE (fails):
checkHarmony(args[0], args[1], args[2], args[3]);

// AFTER (correct):
const [configPath, targetPath, outputPath, format] = args;
if (!configPath || !targetPath || !outputPath || !format) {
  console.error('Usage: harmony-enforce <config> <target> <output> <format>');
  process.exit(1);
}
checkHarmony(configPath, targetPath, outputPath, format);
```

#### Category 2: Object possibly undefined (20 errors -- TS2532, 15 errors -- TS18048)

**Files:** services/layerResolver.ts (16), services/healthScoreCalculator.ts (4), services/healingRecommendations.ts (3), services/dependencyResolver.ts (1), services/storyService.ts (1), cli/validate-contracts.ts (1), storage/memory.ts (1), storage/redis.ts (1), routes/events.ts (1), services/frequencyTracker.test.ts (5)

**Root cause:** Variables assigned from lookups (Map.get, array find, etc.) may be undefined. Code accesses properties without checking.

**Fix pattern -- null guard with early return:**
```typescript
// BEFORE (fails):
const entry = entries.find(e => e.id === id);
result.name = entry.name;  // entry possibly undefined

// AFTER (correct):
const entry = entries.find(e => e.id === id);
if (!entry) continue; // or return, or throw
result.name = entry.name;
```

**Fix pattern -- for layerResolver.ts winner/effectiveEntry pattern:**
```typescript
// BEFORE (fails -- 16 errors in this file):
const winner = candidates[0];
result.push({ source: winner.source, entry: winner.entry });

// AFTER (correct):
const winner = candidates[0];
if (!winner) continue;
result.push({ source: winner.source, entry: winner.entry });
```

#### Category 3: WorkspaceEvent missing `sessionId` and `timestamp` (17 errors -- TS2339)

**Files:** routes/events.ts (7), storage/memory.ts (3), storage/redis.ts (3), plus related property access errors

**Root cause:** `WorkspaceEvent` is a union of ~40 event types. Most extend `BaseEvent` (which has `sessionId` and `timestamp`), but `ArtifactCreatedMessage`, `ArtifactUpdatedMessage`, and `ArtifactArchivedMessage` are standalone interfaces that do NOT extend `BaseEvent`.

**Recommended fix (D-02):** Add `sessionId` and `timestamp` to the three Artifact message types in `packages/shared/src/artifactTypes.ts`, making them consistent with all other events in the union. This is the cleanest approach because:
1. Every event stored/retrieved should have session context and timing
2. Adding to the variants (not a new base) preserves the discriminated union pattern
3. Only 3 interfaces need 2 fields each -- minimal change

```typescript
// In packages/shared/src/artifactTypes.ts:
import type { SessionId, Timestamp } from './types.js';

export interface ArtifactCreatedMessage {
  type: 'artifact:created';
  artifact: StoredArtifact;
  sessionId: SessionId;     // ADD
  timestamp: Timestamp;     // ADD
}

export interface ArtifactUpdatedMessage {
  type: 'artifact:updated';
  artifactId: ArtifactId;
  data: Record<string, unknown>;
  sessionId: SessionId;     // ADD
  timestamp: Timestamp;     // ADD
}

export interface ArtifactArchivedMessage {
  type: 'artifact:archived';
  artifactId: ArtifactId;
  sessionId: SessionId;     // ADD
  timestamp: Timestamp;     // ADD
}
```

**Alternative (type guards):** Use `'sessionId' in event` checks at each access site. This is worse because it scatters guards across 7+ locations instead of fixing the source.

#### Category 4: `undefined` cannot be used as index type (11 errors -- TS2538) and computed property name issues (8 errors -- TS2464)

**Files:** storage/memory.ts (3), storage/redis.ts (3), services/frequencyTracker.ts (2), services/frequencyTracker.test.ts (8), services/lifecycleManager.ts (2), services/artifactParser.ts (1)

**Root cause:** `noUncheckedIndexedAccess: true` means any `obj[key]` where `key` might be `undefined` is an error. Computed property names (`{ [key]: value }`) require `key` to be a known type.

**Fix pattern:**
```typescript
// BEFORE (fails):
const key = someMap.get(id);  // key is string | undefined
results[key] = value;          // TS2538

// AFTER (correct):
const key = someMap.get(id);
if (key === undefined) continue;
results[key] = value;
```

**Fix pattern for computed properties:**
```typescript
// BEFORE (fails):
const record = { [entry.id]: entry.data };  // entry.id may be undefined

// AFTER (correct):
const id = entry.id;
if (!id) continue;
const record = { [id]: entry.data };
```

#### Category 5: `number` not assignable to `DurationMs` branded type (6 errors -- TS2322 subset)

**Files:** services/analyticsAggregator.ts (6 locations: lines 160, 161, 242, 243, 313, 409)

**Root cause:** Plain `number` values assigned to fields typed as `DurationMs`. The branded type system requires using the constructor.

**Fix pattern (D-03):**
```typescript
import { toDurationMs } from '@afw/shared';

// BEFORE (fails):
avgChainDuration: Math.round(avgDuration),
avgStepDuration: Math.round(avgDuration / Math.max(1, totalSteps)),

// AFTER (correct):
avgChainDuration: toDurationMs(Math.round(avgDuration)),
avgStepDuration: toDurationMs(Math.round(avgDuration / Math.max(1, totalSteps))),
```

#### Category 6: Missing type properties and interface mismatches (4 errors)

**a) FlowAnalytics missing `executionCount` (2 errors at analyticsAggregator.ts:250)**

The `FlowAnalytics` type has `usageCount` but code references `executionCount`. Fix: change the code to use `usageCount` (the field that exists in the type). Do NOT add a new field -- `usageCount` serves the same purpose.

```typescript
// BEFORE:
return results.sort((a, b) => b.executionCount - a.executionCount);

// AFTER:
return results.sort((a, b) => b.usageCount - a.usageCount);
```

**b) RedisStorage missing user methods (1 error at storage/index.ts:207 -- TS2739)**

`RedisStorage` does not implement `getUser`, `setUser`, `deleteUser`, `getUsersByRole`. The `MemoryStorage` implements all four. Fix: add stub implementations to `RedisStorage` that store/retrieve from Redis hashes.

**c) RedisStorage `listSessions` not in type (1 error at redis.ts:204 -- TS2561)**

The `listSessions` method exists as code but the `RedisStorage` type definition does not include it. Fix: add `listSessions` to the `RedisStorage` interface/class definition.

#### Category 7: Miscellaneous (remaining errors)

**a) UniverseGraph missing `discoveryTriggers` (1 error at index.ts:760 -- TS2345)**

Object literal passed to function is missing required `discoveryTriggers` field. Fix: add `discoveryTriggers: []` to the object.

**b) Storage.delete does not exist (1 error at flows.ts:314 -- TS2339)**

Code calls `storage.delete()` which is not in the `Storage` interface. Fix depends on intent -- likely should be `storage.deleteDossier()` or similar existing method, OR this is a flow-specific delete that needs a `deleteFlow()` method added to the interface.

**c) EvolutionService RegionNode type mismatch (1 error at evolutionService.ts:737 -- TS2345)**

Array of `{ position: { x, y } }` objects passed where `RegionNode[]` expected. Fix: construct proper `RegionNode` objects with required fields.

**d) ConversationWatcher `.map` on `never` (1 error at conversationWatcher.ts:851 -- TS2339)**

Type narrowing eliminates all possibilities, leaving `never`. Fix: adjust the type narrowing or add a type assertion where the runtime value is known to be an array.

**e) File-persistence `undefined` vs `null` (2 errors at file-persistence.ts:163-164 -- TS2322)**

Optional chaining returns `undefined` but type requires `string | null`. Fix: add `?? null` to normalize.

```typescript
// BEFORE:
result = obj?.property;  // string | undefined

// AFTER:
result = obj?.property ?? null;  // string | null
```

**f) HealthScoreCalculator overload mismatch (2 errors at healthScoreCalculator.ts:388-389 -- TS2769)**

No overload matches the call. Need to inspect the specific call signatures and adjust arguments or add proper type annotations.

### File-Level Error Summary

| File | Errors | Primary Category |
|------|--------|-----------------|
| services/layerResolver.ts | 16 | Object possibly undefined |
| services/frequencyTracker.test.ts | 12 | Computed property + undefined |
| routes/lifecycle.ts | 8 | string \| undefined params |
| services/analyticsAggregator.ts | 8 | DurationMs + executionCount |
| routes/events.ts | 7 | WorkspaceEvent sessionId/timestamp |
| storage/redis.ts | 8 | Mixed (timestamp, index, interface) |
| storage/memory.ts | 7 | Mixed (timestamp, index, undefined) |
| routes/dossiers.ts | 6 | string \| undefined params |
| services/healthScoreCalculator.ts | 4 | Object possibly undefined |
| cli/harmony-enforce.ts | 4 | string \| undefined args |
| services/healingRecommendations.ts | 3 | Object possibly undefined |
| services/frequencyTracker.ts | 2 | Undefined index |
| storage/file-persistence.ts | 2 | undefined vs null |
| routes/suggestions.ts | 2 | string \| undefined params |
| services/lifecycleManager.ts | 4 | Undefined index + params |
| 15 other files | 1 each | Various |

### Recommended Fix Order

1. **Shared type adjustments first** (unblocks downstream): `artifactTypes.ts` (add sessionId/timestamp to 3 interfaces), `models.ts` (verify FlowAnalytics)
2. **Storage layer** (foundational): `storage/index.ts`, `redis.ts`, `memory.ts`, `file-persistence.ts`
3. **Services** (depends on storage): `layerResolver.ts`, `analyticsAggregator.ts`, `frequencyTracker.ts`, `healthScoreCalculator.ts`, remaining services
4. **Routes** (depends on services): `events.ts`, `dossiers.ts`, `lifecycle.ts`, `sessions.ts`, remaining routes
5. **CLI/Utils** (independent): `harmony-enforce.ts`, `validate-contracts.ts`, `shellEscape.ts`
6. **Entry point**: `index.ts` (UniverseGraph fix)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Branded type construction | Manual `as DurationMs` casts | `toDurationMs()` from `@afw/shared` | Existing constructors provide validation |
| Parameter validation | Inline `typeof` checks | Early-return guard clauses | Consistent pattern, TypeScript narrowing works |
| Type narrowing | `as any` or `!` assertions | `if (!x) return` guards | Preserves type safety, no regression risk |
| Event type discrimination | `(event as any).sessionId` | Type guards or fix the union | Union must be correct for all consumers |

## Common Pitfalls

### Pitfall 1: Weakening strict settings to "fix" errors
**What goes wrong:** Changing `noUncheckedIndexedAccess` to `false` or adding `skipLibCheck` eliminates errors but hides real bugs.
**Why it happens:** Tempting shortcut when facing 117 errors.
**How to avoid:** NEVER modify `tsconfig.base.json` or package-level tsconfig. Fix the code, not the config.
**Warning signs:** Any PR that modifies tsconfig `strict` or `noUncheckedIndexedAccess` settings.

### Pitfall 2: Using non-null assertions (`!`) instead of proper guards
**What goes wrong:** `value!.property` compiles but crashes at runtime if value is actually undefined.
**Why it happens:** Quick fix for "possibly undefined" errors.
**How to avoid:** Use narrowing patterns (`if (!value) return/continue/throw`). The `!` operator should be a last resort with a comment explaining WHY it's safe.
**Warning signs:** Any `!` postfix operator in the diff.

### Pitfall 3: Fixing types in shared package without checking all consumers
**What goes wrong:** Adding required fields to `ArtifactCreatedMessage` breaks any code that constructs these objects without the new fields.
**Why it happens:** The shared package is consumed by backend, frontend, and mcp-server.
**How to avoid:** After modifying shared types, run `pnpm type-check` across ALL packages before considering the fix complete. Search for all construction sites of modified types.
**Warning signs:** Fix reduces backend errors but introduces frontend/mcp-server errors.

### Pitfall 4: Using `as any` to bypass branded types
**What goes wrong:** Code compiles but branded types lose their safety guarantees. Other developers (and agents) copy the pattern.
**Why it happens:** Branded types require constructor functions which feel verbose.
**How to avoid:** Always use `toSessionId()`, `toChainId()`, `toDurationMs()` etc. from `@afw/shared`.
**Warning signs:** Any `as any`, `as SessionId`, `as DurationMs` in the diff (except inside the constructor functions themselves).

### Pitfall 5: Fixing test file errors differently than production code
**What goes wrong:** Test files (`frequencyTracker.test.ts` has 12 errors) get `as` casts while production code gets proper guards, creating inconsistent patterns.
**Why it happens:** Tests feel like "second class" code.
**How to avoid:** Apply the same guard patterns in tests. Use `!` assertions in tests ONLY when the test setup guarantees the value exists (and add a comment).
**Warning signs:** Different fix patterns between `.test.ts` and `.ts` files.

### Pitfall 6: Breaking runtime behavior while fixing types
**What goes wrong:** Adding an early-return `if (!id) return res.status(400)` in a route handler changes behavior for edge cases that previously worked (even if incorrectly).
**Why it happens:** The type fix is correct but the route previously handled the undefined case differently.
**How to avoid:** Before adding guards, read the surrounding code to understand the intended behavior. Prefer returning 400 for truly invalid params, but check if there's a default value pattern.
**Warning signs:** Tests failing after type fixes.

## Code Examples

### Pattern 1: Route parameter validation (most common fix)
```typescript
// Source: Established pattern in packages/backend/src/routes/ (e.g., sessions.ts working routes)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }
  // id is now narrowed to string
  const result = await storage.getDossier(id);
  // ...
});
```

### Pattern 2: Branded type construction
```typescript
// Source: packages/shared/src/types.ts -- existing constructor pattern
import { toDurationMs, toSessionId } from '@afw/shared';

// Correct branded type usage:
const duration = toDurationMs(Math.round(avgMs));
const sessionId = toSessionId(rawSessionString);
```

### Pattern 3: Null guard for Map/Array lookups under noUncheckedIndexedAccess
```typescript
// Source: Required by tsconfig.base.json noUncheckedIndexedAccess: true
const sessions = storage.sessions;

// Array index access -- always possibly undefined
const first = items[0];
if (!first) return;  // guard before use

// Map.get -- returns T | undefined
const session = sessions.get(sessionId);
if (!session) {
  return res.status(404).json({ error: 'Session not found' });
}
// session is now narrowed to Session
```

### Pattern 4: Normalizing undefined to null
```typescript
// Source: packages/backend/src/storage/file-persistence.ts pattern
// When type expects string | null but optional chaining gives string | undefined:
const value = obj?.property ?? null;  // undefined -> null
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (installed) |
| Config file | `packages/backend/vitest.config.ts` |
| Quick run command | `cd packages/backend && pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Zero TypeScript errors across all packages | type-check | `pnpm type-check` | N/A (compiler check) |
| FOUND-02 | No `as any` bypasses for branded types | grep audit | `grep -r "as any\|as SessionId\|as ChainId\|as StepId\|as UserId\|as DurationMs" packages/backend/src/ --include="*.ts" -l` | N/A (grep check) |

### Sampling Rate
- **Per task commit:** `pnpm type-check` (must pass with zero errors)
- **Per wave merge:** `pnpm type-check && pnpm test`
- **Phase gate:** `pnpm type-check` returns 0 errors AND `grep -r "as any" packages/backend/src/ --include="*.ts"` returns no branded type bypasses

### Wave 0 Gaps
None -- existing test infrastructure (Vitest + tsc) covers all phase requirements. The primary verification is `pnpm type-check` which is already configured.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). This phase modifies TypeScript source files only. All tools (TypeScript compiler, Vitest) are already installed and configured in the monorepo.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all 117 TypeScript errors via `pnpm type-check` output
- `tsconfig.base.json` -- verified compiler settings (strict: true, noUncheckedIndexedAccess: true, ES2022 target, NodeNext modules)
- `packages/shared/src/types.ts` -- verified branded type constructors exist (toSessionId, toDurationMs, etc.)
- `packages/shared/src/events.ts` -- verified BaseEvent has sessionId and timestamp, ArtifactMessages do not
- `packages/shared/src/artifactTypes.ts` -- verified ArtifactCreatedMessage/Updated/Archived lack sessionId and timestamp
- `packages/shared/src/models.ts` -- verified FlowAnalytics has `usageCount` not `executionCount`
- `packages/backend/src/storage/index.ts` -- verified Storage interface requires getUser/setUser/deleteUser/getUsersByRole

### Secondary (MEDIUM confidence)
- `.planning/codebase/CONCERNS.md` -- error analysis from 2026-04-01, count was "150+" but actual is exactly 117
- `.planning/codebase/CONVENTIONS.md` -- coding conventions verified against actual code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already installed
- Architecture: HIGH -- errors directly inspected, fix patterns verified against existing working code in the same codebase
- Pitfalls: HIGH -- based on direct analysis of the specific errors and TypeScript strict mode behavior

**Research date:** 2026-04-02
**Valid until:** Indefinite (TypeScript strict mode behavior is stable; errors are concrete and verified)
