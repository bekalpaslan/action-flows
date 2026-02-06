# TypeScript Quality Review - Quick Summary

**Date:** 2026-02-06 18:07:12
**Verdict:** ❌ NEEDS_CHANGES
**Quality Score:** 42% (7 of 11 checks failed)

---

## Critical Issues (Fix Immediately)

### 1. 83 instances of `any` type (HIGH)
- **Worst offenders:** backend/src/types.ts (Storage interface), backend/src/index.ts (wsConnectedClients)
- **Impact:** Core storage and WebSocket layers lack type safety
- **Fix:** Replace with proper types from @afw/shared

### 2. Missing ChainId and StepId branded types (HIGH)
- **Issue:** Only SessionId and UserId are branded; ChainId/StepId are plain strings
- **Impact:** 158 instances of unsafe ID handling across storage, routes, hooks
- **Fix:** Define in shared/src/types.ts, update all storage interfaces

### 3. 112 unsafe type assertions with `as` (HIGH)
- **Pattern:** Routes cast unvalidated params to branded types
- **Impact:** Runtime errors if invalid IDs passed to API
- **Fix:** Add validation middleware, use type guards instead of assertions

### 4. No validation in branded type factories (HIGH)
- **Issue:** `brandedTypes.sessionId('')` accepts empty strings
- **Impact:** Invalid IDs can enter system
- **Fix:** Add validation logic to factory functions

---

## What Passed ✅

- ✅ Strict mode enabled (strictNullChecks, noImplicitAny)
- ✅ Discriminated unions with type guards for events
- ✅ Generic constraints applied correctly
- ✅ Good type inference leverage

---

## Action Plan

### Priority 1 (This Sprint)
1. Add ChainId and StepId branded types to shared/src/types.ts
2. Update Storage interface to use SessionId/ChainId instead of string
3. Remove duplicate Storage interface in backend/src/types.ts
4. Replace `Map<string, any>` with `Map<string, Session>` in storage

### Priority 2 (Next Sprint)
5. Add validation to branded type factories
6. Create route validation middleware
7. Replace `catch (error: any)` with `catch (error: unknown)`
8. Add explicit return types to exported functions

### Priority 3 (Technical Debt)
9. Remove `as any` casts in event handlers
10. Add justification comments for unavoidable `any` usage
11. Enable noUnusedLocals and noUnusedParameters in tsconfig.base.json

---

## Key Files Needing Changes

**Must Fix:**
- packages/shared/src/types.ts
- packages/backend/src/types.ts
- packages/backend/src/storage/index.ts
- packages/backend/src/storage/memory.ts
- packages/backend/src/storage/redis.ts
- packages/backend/src/routes/sessions.ts

**High Priority:**
- packages/app/src/hooks/useAttachedSessions.ts
- packages/app/src/hooks/useUserSessions.ts
- packages/backend/src/services/fileWatcher.ts
- packages/backend/src/routes/events.ts

---

## Metrics

- Total violations: 353 instances
- Files with violations: 25 of 68 files
- Most common issue: Plain string IDs (158 instances)
- Second most common: `any` type (83 instances)

---

Full report: `review-report.md`
