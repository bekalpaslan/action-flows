# ArchiveStarWorkbench Behavioral Contract

## Identity
**Component Name:** ArchiveStarWorkbench
**File Path:** packages/app/src/components/Workbench/ArchiveStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='archive'. Main content area when Archive star is active.

## Lifecycle
- **Mount:** Loads archived items, sessions, and historical data
- **Update:** Re-renders when archive view changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface ArchiveStarWorkbenchProps {
  workbenchId: 'archive';
}
```

## State Ownership
- **Archived items:** Array of completed/archived work items
- **Time filter:** Date range for archive view
- **Category filter:** Archive category selection
- **Search query:** Archive search text
- **Expanded item:** Currently expanded archive entry

## Interactions
- **Click item:** Shows archived item details
- **Restore button:** Unarchives and returns to active work
- **Filter by date:** Shows items from time period
- **Search archived:** Finds items by keyword
- **Download:** Exports archive data

## Test Hooks
- `data-testid="archive-star-workbench"` on main container
- `data-testid="archive-list"` on archived items list
- `data-testid="archive-item-{id}"` on individual archive entry
- `data-testid="restore-button-{id}"` on restore action
