# Review Report: Tier 4 DiscussButton Integrations

## Verdict: NEEDS_CHANGES
## Score: 85%

## Summary

Reviewed 10 Tier 4 DiscussButton integrations across widgets, navigation, and settings components. Most integrations follow the correct pattern (imports → hook init → button placement → dialog at root). However, found 3 critical issues: DossierCard has incorrect event bubbling prevention logic, InlineButtons has stale references in getContext callback causing potential runtime errors, and QuickActionBar also has stale closure references. Additionally, 2 components have suboptimal import paths that could be improved.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/components/IntelDossier/DossierCard.tsx | 101-103 | critical | Event bubbling prevention logic is incorrect. Uses `.closest('.discuss-button')` on event target, but DiscussButton is a React component that renders a `<button>` with class `discuss-button__trigger`, not `discuss-button`. This will never match, so DiscussButton clicks will always trigger card selection. | Change to: `if ((e.target as HTMLElement).closest('.discuss-button__trigger'))` to match the actual rendered class name. |
| 2 | packages/app/src/components/InlineButtons/InlineButtons.tsx | 61-68 | critical | `getContext` callback references `filteredButtons` which hasn't been computed yet (defined after hook initialization). This creates a stale closure - the callback will always see `filteredButtons` from the first render. | Move `useDiscussButton` hook call after the `filteredButtons` useMemo, or pass primitive values instead: `buttonsShown: allButtons.filter(b => b.enabled && b.contexts.includes(detectedContext)).length`. |
| 3 | packages/app/src/components/QuickActionBar/QuickActionBar.tsx | 57-65 | critical | Same stale closure issue as InlineButtons - `getContext` references `visibleActions` which is defined later (line 119). Will cause incorrect context data on first render. | Move hook initialization after `visibleActions` definition, or compute inline: `visibleActionsCount: allQuickActions.filter(action => action.alwaysShow \|\| compiledPatterns.get(action.id)?.some(r => r.test(lastOutput))).length`. |
| 4 | packages/app/src/components/HarmonyIndicator/HarmonyIndicator.tsx | 7-8 | medium | Import paths use relative imports `../DiscussButton` and `../../hooks/useDiscussButton`. Component is 2 levels deep, which is correct, but could use path alias for consistency with codebase standards. | Consider using path aliases if configured: `import { DiscussButton, DiscussDialog } from '@/components/DiscussButton'` and `import { useDiscussButton } from '@/hooks/useDiscussButton'`. |
| 5 | packages/app/src/components/ControlButtons/ControlButtons.tsx | 9-10 | medium | Same relative import path issue - uses `../DiscussButton` and `../../hooks/useDiscussButton`. | Consider using path aliases for consistency. |
| 6 | packages/app/src/components/SessionSidebar/SessionSidebar.tsx | 103-107 | low | `handleDiscussDialogSend` wrapper just logs and closes. This pattern is repeated in multiple components. Could be simplified by using `handleSend` return value for logging outside dialog lifecycle. | Consider simplifying to just pass `closeDialog` directly to `onClose` and handle logging elsewhere, or document why the wrapper is needed. |
| 7 | packages/app/src/components/DashboardSidebar/DashboardSidebar.tsx | 79-83 | low | Same logging wrapper pattern as SessionSidebar. | Same suggestion - evaluate if wrapper is necessary or just pass `closeDialog` directly. |
| 8 | packages/app/src/components/TopBar/TopBar.tsx | 34-38 | low | Same logging wrapper pattern. | Same suggestion. |
| 9 | packages/app/src/components/PersistentToolbar/PersistentToolbar.tsx | 52-56 | low | Same logging wrapper pattern. | Same suggestion. |
| 10 | packages/app/src/components/Settings/QuickActionSettings.tsx | 59-63 | low | Same logging wrapper pattern. | Same suggestion. |

## Fixes Applied

N/A (mode = review-only)

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Path alias configuration | Need to verify if path aliases (@/components, @/hooks) are configured in tsconfig.json and vite.config.ts before changing imports. |
| onSend wrapper pattern | Multiple components use identical `handleDiscussDialogSend` wrapper that just logs and closes. This might be intentional for future extension, or could indicate over-engineering. Human should decide if this is a deliberate pattern or should be simplified. |
| Event bubbling test | The DossierCard event bubbling fix (finding #1) should be tested manually or with E2E test to verify clicking DiscussButton doesn't trigger card selection. |

## Pattern Consistency Summary

**✅ Correct Patterns:**
- All components follow imports → hook init → button placement → dialog at root structure
- All hook initializations include `componentName` and `getContext` callback
- All dialogs are placed at component root level (not nested in conditionals)
- No hooks inside conditionals (all at top level)

**⚠️ Issues Found:**
- 3 components have stale closure bugs in getContext callbacks (critical)
- 1 component has incorrect event bubbling prevention (critical)
- 5 components use relative imports instead of path aliases (medium - consistency)
- 5 components have repetitive logging wrappers (low - design decision)

## Component-Specific Notes

### Batch A (Widgets)

1. **HarmonyIndicator** - Clean integration, button size="small" appropriate for compact widget. Import paths could use aliases.

2. **DossierCard** - Critical bug: event bubbling check will never work. Card is clickable so this is a real UX issue. Fix urgently.

3. **ControlButtons** - Clean integration, proper conditional rendering (only shows when hasActiveChain). Import paths could use aliases.

4. **QuickActionBar** - Stale closure bug in getContext. Also note: complex component with custom prompt integration, but DiscussButton placement is correct at line 157.

5. **InlineButtons** - Stale closure bug in getContext. Empty state handling is correct (returns null if no buttons). Dialog placement is correct.

### Batch B (Nav/Settings)

6. **SessionSidebar** - Clean integration, button placed in header next to "+" button. Proper context data (sessionCount, activeSession).

7. **DashboardSidebar** - Clean integration, button in logo area. Context data is placeholder (activeView: 'Analytics', pinnedItems: []) - verify if this should be dynamic.

8. **TopBar** - Clean integration, button placed in status bar with ThemeToggle. Context includes activeTab and workbenchType from config.

9. **PersistentToolbar** - Clean integration, button in toolbar header. Context includes toolbarItems count and pinnedCount.

10. **QuickActionSettings** - Clean integration, button in settings header next to close button. Context includes settingsCategory and unsavedChanges flag (good!).

## TypeScript & Imports Check

✅ All components use proper TypeScript types
✅ All imports resolve correctly (relative paths are valid)
✅ No `any` types detected
✅ Proper type imports from @afw/shared where needed

## React Hooks Rules Check

✅ All hooks at top level (no conditionals)
⚠️ Dependency arrays not applicable (useDiscussButton has no deps in these usages)
❌ 2 components have stale closure issues (see findings #2, #3)

## Performance Check

✅ No unnecessary re-renders detected
✅ Proper use of useMemo in QuickActionBar and InlineButtons for expensive computations
✅ Button components are lightweight, minimal performance impact

## Security Check

✅ No injection risks
✅ No exposed secrets
✅ Proper event handler usage
✅ No unsafe refs or DOM manipulation
