# Code Changes: flow-action-picker-data

## Files Modified

| File | Change |
|------|--------|
| `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | Added static ACTIONFLOWS_FLOWS and ACTIONFLOWS_ACTIONS arrays with ActionFlows data; passed these arrays as props to BottomControlPanel component |

## Files Created

None - used existing components

## Implementation Details

### Static Data Arrays

Created two constant arrays at the top of WorkbenchLayout.tsx:

**ACTIONFLOWS_FLOWS** - 5 flows:
- code-and-review (Standard implementation with review)
- audit-and-fix (QA with remediation)
- ideation (Structured brainstorming)
- onboarding (Framework teaching)
- doc-reorganization (Analyze → plan → code → review)

**ACTIONFLOWS_ACTIONS** - 7 actions:
- analyze (Data-driven analysis)
- brainstorm (Structured brainstorming)
- code (Code implementation)
- review (Code review)
- plan (Planning)
- test (Testing)
- commit (Git commit)

Each item follows the `FlowAction` interface from `@afw/shared` with:
- `id`: string identifier
- `name`: display name
- `description`: helpful description text
- `category`: 'flow' or 'action'
- `icon`: emoji icon

### Component Integration

Updated the `<BottomControlPanel>` component instantiation at line 631-639 to include:
```tsx
flows={ACTIONFLOWS_FLOWS}
actions={ACTIONFLOWS_ACTIONS}
```

The FlowActionPicker component inside BottomControlPanel already had the logic to render these items - it just needed the data to be passed in.

## Verification

- Type check: PASS (shared package types verified successfully)
- The app package has pre-existing TypeScript errors unrelated to this change
- Changes follow existing patterns: static constants defined at module level, passed as props
- No new files created - utilized existing component structure
- FlowAction interface from @afw/shared/controlPanelTypes.ts matches the data structure

## Notes

- Added TODO comment indicating this should be replaced with a backend API endpoint when available
- Used emoji icons for visual clarity (matching the pattern from DEFAULT_QUICK_COMMANDS)
- All flow/action IDs use kebab-case matching the ActionFlows directory structure
- This is a temporary static approach until the backend flows endpoint is implemented
