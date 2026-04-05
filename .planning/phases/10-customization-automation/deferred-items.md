# Deferred Items — Phase 10

## Pre-existing Type Errors

1. **`packages/app/src/hooks/useViolationSignals.ts(22,33)`**: `Property 'addViolation' does not exist on type 'ValidationState'`
   - Pre-existing error from Phase 9. The `validationStore.ts` has uncommitted changes per git status.
   - Not caused by Phase 10 changes.
