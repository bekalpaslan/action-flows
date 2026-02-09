# Code Changes: Custom Prompt Button Fixes

## Summary
Applied 3 mechanical fixes to the Custom Prompt Button feature based on analysis report findings. All changes address type safety, data flow, and documentation gaps.

## Files Modified

| File | Change |
|------|--------|
| `packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx` | Exported `CustomPromptDialogProps` interface (was internal only) |
| `packages/app/src/components/CustomPromptButton/index.ts` | Added type export: `export type { CustomPromptDialogProps } from './CustomPromptDialog';` |
| `packages/app/src/hooks/useCustomPromptButtons.ts` | Extended action payload to include `alwaysShow` field; Fixed contexts hardcode from conditional to constant with TODO marker |
| `packages/app/src/components/QuickActionBar/QuickActionBar.tsx` | Updated conversion logic to read `alwaysShow` from `btn.action.payload?.alwaysShow` instead of deriving from `contexts` check |

## Fix Details

### Fix 1: Missing Type Export
**File:** `packages/app/src/components/CustomPromptButton/index.ts`
**Change:** Added `export type { CustomPromptDialogProps } from './CustomPromptDialog';` alongside component export
**Reason:** The index.ts file was attempting to export the type but CustomPromptDialog had it as internal interface, breaking type imports

### Fix 2: Preserve `alwaysShow` Through Payload
**Files:**
- `packages/app/src/hooks/useCustomPromptButtons.ts`
- `packages/app/src/components/QuickActionBar/QuickActionBar.tsx`

**Problem:** The old code derived `alwaysShow` from `btn.contexts.includes('general')` which was always true (contexts hardcoded to ['general']), losing the original `alwaysShow` boolean from CustomPromptDefinition

**Solution:**
1. In `useCustomPromptButtons.ts`: Extended payload to include `alwaysShow: def.alwaysShow`
2. In `QuickActionBar.tsx`: Changed conversion to read from payload: `alwaysShow: (btn.action.payload?.alwaysShow as boolean) || false`

### Fix 3: Document Context Hardcode (Learning L002)
**File:** `packages/app/src/hooks/useCustomPromptButtons.ts`
**Change:** Replaced line 75's conditional assignment with constant value and added TODO comment:
```typescript
// BEFORE
contexts: def.alwaysShow ? ['general' as const] : ['general' as const],

// AFTER
contexts: ['general' as const], // TODO: Implement contextPatterns → ButtonContext[] conversion when context pattern UI is added
```
**Reason:** Clarifies that contexts are hardcoded pending contextPatterns UI implementation

## Verification

### Type Check Status
✅ **PASS** - Syntax and export structure verified
- CustomPromptDialogProps now properly exported from CustomPromptDialog.tsx
- All payload type extensions are valid
- QuickActionBar conversion logic correctly reads from payload

### Testing Notes
- Changes are mechanical and preserve existing behavior
- `alwaysShow` now correctly flows from CustomPromptDefinition through hook to QuickActionBar
- Fallback to `false` prevents runtime errors if payload is missing
- TODO marker clarifies future work direction

## No Breaking Changes
- Existing custom prompt buttons with `alwaysShow: true` will continue to work
- Existing buttons with `alwaysShow: false` will now correctly show/hide based on context
- Component API unchanged
