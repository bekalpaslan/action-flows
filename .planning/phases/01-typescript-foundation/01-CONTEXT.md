# Phase 1: TypeScript Foundation - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 117 TypeScript compilation errors in `packages/backend/` so `pnpm type-check` passes with zero errors. Establish clean branded type patterns that agents will imitate in subsequent phases. Frontend and shared packages already compile clean.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation decisions for this mechanical phase. Claude has full discretion on:

- **D-01:** Error fix strategy — Fix errors inline with proper null checks and type guards. Prefer narrowing (`if (!x) return`) over assertion (`x!`). Add validation at route entry points where `req.params` values may be undefined.
- **D-02:** WorkspaceEvent union — Add `timestamp` and `sessionId` as required fields to the base `WorkspaceEvent` type (or add them to all event variants). 13 errors stem from this missing property. Choose the approach that provides the cleanest type contract.
- **D-03:** Branded type enforcement — DurationMs and other branded types must use constructor functions. Replace the 6 direct `as DurationMs` casts with proper `createDurationMs()` helpers. This sets the pattern agents will copy.
- **D-04:** Storage interface — Fix `RedisStorage` to include missing methods (`getUser`, `setUser`, `deleteUser`, `getUsersByRole`, `listSessions`). Either implement them or declare them in the interface.
- **D-05:** Index type safety — Fix the 11 `undefined cannot be used as index type` errors with proper null checks before indexing.
- **D-06:** shellEscape utility — Fix the single undefined error in `utils/shellEscape.ts`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### TypeScript Configuration
- `tsconfig.base.json` — Base config with strict mode, ES2022 target, NodeNext modules
- `packages/backend/tsconfig.json` — Backend-specific config

### Type Definitions
- `packages/shared/src/index.ts` — Shared types including branded strings (SessionId, ChainId, StepId, UserId, Timestamp, DurationMs)
- `packages/shared/src/contract/` — Contract types and parsers

### Codebase Analysis
- `.planning/codebase/CONCERNS.md` — Documents type safety failures, error patterns, and fix priorities
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, import organization, TypeScript conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Error Distribution (117 total, all in packages/backend/)
- `string | undefined` → `string` parameter mismatches: 23 errors (route handlers)
- `Object is possibly undefined`: 20 errors (storage, services)
- `undefined` index type: 11 errors (memory.ts, redis.ts)
- Computed property name issues: 8 errors (storage)
- WorkspaceEvent missing `timestamp`: 7 errors (storage, events)
- WorkspaceEvent missing `sessionId`: 6 errors (storage, events)
- `DurationMs` brand bypass: 6 errors (analytics)
- `RegistryEntry | undefined` → `RegistryEntry`: 3 errors

### Affected Files (clustered)
- `packages/backend/src/routes/` — dossiers.ts, analytics.ts, lifecycle.ts, sessions.ts, harmony-enforce.ts
- `packages/backend/src/storage/` — memory.ts, redis.ts
- `packages/backend/src/services/` — various services
- `packages/backend/src/utils/shellEscape.ts`

### Established Patterns
- TypeScript strict mode with `noUncheckedIndexedAccess: true` — keep this
- Branded types exist in shared package — extend usage patterns
- Zod schemas exist for validation — consider using at route boundaries

### Integration Points
- No frontend changes needed — frontend compiles clean
- No shared type changes expected unless WorkspaceEvent union is adjusted there

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. This is mechanical cleanup.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-typescript-foundation*
*Context gathered: 2026-04-02*
