# WorkStarWorkbench Behavioral Contract

## Identity
**Component Name:** WorkStarWorkbench
**File Path:** packages/app/src/components/Workbench/WorkStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='work'. Occupies main content area to the right of sidebar when Work star is navigated to.

## Lifecycle
- **Mount:** Fetches initial work data from backend, subscribes to real-time updates
- **Update:** Re-renders when work items change, filters/searches update
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
interface WorkStarWorkbenchProps {
  workbenchId: 'work';
}
```

## State Ownership
- **Work items list:** Array of active work tasks
- **Current filter:** Active filter selection
- **Search query:** Current search text
- **Selected item:** Highlighted work item
- **View mode:** List/grid/timeline view state

## Interactions
- **Click work item:** Navigates to item details
- **Filter control:** Updates work items list
- **Search input:** Filters work items by keyword
- **Create button:** Opens new work item dialog

## Test Hooks
- `data-testid="work-star-workbench"` on main container
- `data-testid="work-item-list"` on items list
- `data-testid="work-item-{id}"` on individual item
- `data-testid="work-search"` on search input
