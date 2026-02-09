# Toolbar Ordering Utility - Implementation Summary

**Task:** Create `toolbarOrdering.ts` utility in `packages/app/src/utils/`
**Context:** SRD Section 2.3 Persistent Toolbar ordering logic
**Date:** 2026-02-08
**Status:** ✅ COMPLETE

---

## What Was Implemented

Created `/packages/app/src/utils/toolbarOrdering.ts` with the following exports:

### Core Functions

1. **`sortToolbarSlots(slots: ToolbarSlot[]): ToolbarSlot[]`**
   - Sorts toolbar slots with consistent ordering rules
   - Pinned buttons first (by position within pinned group)
   - Non-pinned buttons by usage count (descending)
   - Tie-breaker: most recent lastUsed timestamp

2. **`getVisibleSlots(slots: ToolbarSlot[], maxSlots: number): ToolbarSlot[]`**
   - Returns the top N slots after sorting
   - Respects both pinned status and frequency

3. **`getSuggestedButtons(allButtons: ButtonDefinition[], currentSlots: ToolbarSlot[]): ButtonDefinition[]`**
   - Identifies buttons not yet in the toolbar
   - Enables UI to suggest new buttons for pinning

4. **`createSlot(buttonId: ButtonId, existingSlots: ToolbarSlot[], pinned?: boolean): ToolbarSlot`**
   - Factory function for creating new toolbar slots
   - Auto-calculates position based on existing slots
   - Uses current timestamp for lastUsed

5. **`trackButtonUsage(slots: ToolbarSlot[], buttonId: ButtonId): ToolbarSlot[]`**
   - Increments usage count for a clicked button
   - Updates lastUsed timestamp
   - Returns new array (immutable pattern)

6. **`updatePinnedStatus(slots: ToolbarSlot[], buttonId: ButtonId, pinned: boolean): ToolbarSlot[]`**
   - Updates pin/unpin status for a button
   - Maintains immutability

7. **`reorderSlots(slots: ToolbarSlot[], newOrder: ButtonId[]): ToolbarSlot[]`**
   - Supports manual reordering via drag-and-drop
   - Updates positions based on new order array

8. **`removeSlot(slots: ToolbarSlot[], buttonId: ButtonId): ToolbarSlot[]`**
   - Removes a button from the toolbar
   - Returns filtered array

### Statistics & Analysis

9. **`calculateToolbarStats(slots: ToolbarSlot[]): ToolbarStats`**
   - Returns object with:
     - `totalButtons`: Count of all buttons
     - `pinnedCount`: Count of pinned buttons
     - `unpinnedCount`: Count of unpinned buttons
     - `mostUsedButtonId`: Most frequently used button
     - `totalUsage`: Sum of all usage counts
     - `averageUsagePerButton`: Mean usage count

---

## Design Decisions

### Type Safety
- Uses branded types from `@afw/shared` for ButtonId, ToolbarSlot, etc.
- Full TypeScript strict mode compliance (no `any` types)
- Proper interface exports for stats type

### Immutability
- All functions return new arrays/objects
- Input arrays and objects are never mutated
- Consistent with React patterns (safe for state management)

### Timestamp Handling
- Uses ISO 8601 string format (per shared types)
- Converts to Date for comparisons in sort logic
- Uses `brandedTypes.currentTimestamp()` for new timestamps

### Sorting Algorithm
1. **Primary:** Pinned status (pinned before unpinned)
2. **Secondary (pinned):** Position order (0, 1, 2...)
3. **Secondary (unpinned):** Usage count descending
4. **Tertiary:** Most recent timestamp wins ties

---

## File Location

```
D:\ActionFlowsDashboard\packages\app\src\utils\toolbarOrdering.ts
```

---

## TypeScript Verification

- File compiled successfully with `npx tsc --moduleResolution node --skipLibCheck`
- All imports resolve correctly to `@afw/shared`
- No type errors in the utility functions

Note: Pre-existing compilation errors in backend and Monaco editor config are unrelated to this utility.

---

## Integration Points

This utility is ready for use in:
- **Frontend Components**: Toolbar display/management components
- **Custom Hooks**: `useToolbar()` hook for state management
- **Context Providers**: ToolbarContext to share state across app
- **Event Handlers**: Button click tracking and reordering

---

## Related Files

**Types used from:**
- `packages/shared/src/types.ts` - Timestamp, branded types
- `packages/shared/src/buttonTypes.ts` - ToolbarSlot, ButtonDefinition, ButtonId

**Example usage patterns:**
- Similar to: `packages/app/src/utils/chainTypeDetection.ts`
- Follows: Immutable patterns from React conventions
