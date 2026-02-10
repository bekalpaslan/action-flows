# Code Changes: Add StepSkippedEvent Type

## Summary
Added a new `StepSkippedEvent` type to the shared events module to support step skipping functionality. The frontend `useChainEvents` hook was listening for 'step:skipped' events but the type was missing from the event system.

## Files Modified

| File | Change |
|------|--------|
| packages/shared/src/events.ts | Added StepSkippedEvent interface (lines 220-232), added to WorkspaceEvent discriminated union (line 623), added isStepSkipped type guard (lines 671-672) |
| packages/shared/src/index.ts | Exported StepSkippedEvent type from events.js barrel export (line 46) |

## Files Created
None

## Implementation Details

### StepSkippedEvent Interface
The event follows the same pattern as other step events (StepSpawnedEvent, StepCompletedEvent, StepFailedEvent):

- **Type discriminator**: `'step:skipped'`
- **Automatic fields**: `stepNumber` (required)
- **Parsed fields**:
  - `action` (optional, why the step was skipped - e.g., "condition not met")
  - `reason` (optional, detailed reason for skipping)
- **Inferred fallbacks**: `skippedAt` (Timestamp when skipped)

### Changes Made
1. **Added StepSkippedEvent interface** following the exact same pattern as other step events
2. **Added to WorkspaceEvent discriminated union** to include it in all possible event types
3. **Added isStepSkipped type guard** to eventGuards object for runtime type discrimination
4. **Exported StepSkippedEvent** from the shared package barrel (index.ts)

## Verification
- Type check: **PASS**
  - `pnpm --filter @afw/shared type-check` completed without errors
  - All branded types, interfaces, and exports are correctly typed
  - Discriminated union properly includes the new event type

## Notes
- The implementation uses colon separators for event type strings ('step:skipped') matching the project convention
- Fields follow the three-tier pattern: automatic fields (always available), parsed fields (nullable, from Claude output), inferred fallbacks (computed)
- The frontend hook `useChainEvents.ts` was already listening for 'step_skipped' events (with underscores), which is a pre-existing mismatch that should be addressed separately (converting underscore event names to colon-separated names)
