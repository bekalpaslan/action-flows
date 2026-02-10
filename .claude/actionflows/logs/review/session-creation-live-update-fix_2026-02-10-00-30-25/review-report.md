# Review Report: Session Creation Live Update Bug Fix

## Verdict: NEEDS_CHANGES
## Score: 80%

## Summary

The three-part fix correctly addresses the root cause analysis: backend now emits `session:started` events, frontend removed the phantom `session:updated` event type, and subscription filtering was bypassed for session lifecycle events. However, **a critical pre-existing bug was discovered**: useAllSessions.ts line 134 accesses `event.data` but SessionStartedEvent does not have a `data` property—all fields are top-level. This causes the event handler to fail silently when accessing undefined properties. Additionally, the event construction in the backend includes incorrect field mappings that would cause TypeScript errors at runtime.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/hooks/useAllSessions.ts | 134 | critical | Event handler accesses `event.data` but SessionStartedEvent has no `data` property. All fields (id, user, cwd, hostname, platform) are top-level on the event object itself. This is a **pre-existing bug** that will cause the event handler to fail when trying to access `sessionData.id`, `sessionData.cwd`, etc. | Change line 134 from `const sessionData = event.data as SessionEventData;` to `const sessionData = event as unknown as SessionEventData;` and update lines 138-154 to access `event.sessionId` instead of `sessionData.id`, `event.cwd` instead of `sessionData.cwd`, etc. Alternatively, restructure to directly use event fields. |
| 2 | packages/backend/src/routes/sessions.ts | 123-131 | high | SessionStartedEvent construction does not match TypeScript interface. Line 125 uses `sessionId` but the event already has `sessionId` from BaseEvent (line 29 of events.ts). The structure creates the event incorrectly—it should not redeclare `sessionId` in the event object, as it's already part of BaseEvent. | The WorkspaceEvent cast is hiding a type error. SessionStartedEvent fields should be: `type`, `sessionId`, `timestamp`, `cwd`, `user`, `hostname`, `platform`. Current code sets these correctly, but the type assertion masks potential issues. Validate with explicit type checking or remove the cast. |
| 3 | packages/app/src/hooks/useAllSessions.ts | 147-149 | medium | Event handler maps `sessionData.user || sessionData.userId` but SessionStartedEvent only has optional `user?: UserId`. The field `userId` does not exist on SessionStartedEvent. | Remove fallback to `sessionData.userId` (line 147) and use only `event.user` since that's the only field defined in the type. |
| 4 | packages/app/src/hooks/useAllSessions.ts | 166 | medium | Similar issue with user field mapping on session:ended event handler. Uses `sessionData.user || sessionData.userId` but SessionEndedEvent only has optional `user?: UserId` from BaseEvent. | Remove fallback to `sessionData.userId` (line 166) and use only `event.user`. |
| 5 | packages/backend/src/routes/sessions.ts | 120-137 | low | Backend emits event in try-catch that silently swallows errors. While this is acceptable for non-critical operations, the console.error provides no actionable context about which clients failed to receive the broadcast. | Consider logging client count and any specific client errors if broadcastEvent supports it. Current logging is acceptable but could be more detailed. |

## Fixes Applied

N/A (mode = review-only)

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Finding #1: event.data access pattern | This is a critical pre-existing bug that affects ALL session event handling, not just the newly added broadcast. The entire event handler in useAllSessions.ts needs to be refactored to match the actual SessionStartedEvent interface. This requires understanding the intended event shape and updating both event construction (backend) and consumption (frontend) consistently. |
| Event structure contract | There's a mismatch between how events are constructed (backend wraps in `{ type: 'event', sessionId, payload }`) and how the type system defines them (SessionStartedEvent has fields at top level). The useWebSocket.ts unwraps the broadcast wrapper (lines 69-72) but useAllSessions.ts still expects a `.data` property that doesn't exist. Need to verify if this is a wrapper issue or a type definition issue. |
| TypeScript compilation status | The code compiles, which suggests the WorkspaceEvent cast on line 123 is masking type errors. Need to verify if the backend build process catches this or if `any` types are leaking through. Run `pnpm type-check` to validate. |
