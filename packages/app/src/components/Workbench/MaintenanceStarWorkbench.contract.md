# MaintenanceStarWorkbench Behavioral Contract

## Identity
**Component Name:** MaintenanceStarWorkbench
**File Path:** packages/app/src/components/Workbench/MaintenanceStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='maintenance'. Occupies main content area when Maintenance star is navigated to.

## Lifecycle
- **Mount:** Loads maintenance issues and bug reports, subscribes to updates
- **Update:** Re-renders when issues change or status updates
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
interface MaintenanceStarWorkbenchProps {
  workbenchId: 'maintenance';
}
```

## State Ownership
- **Issues list:** Array of bugs, tech debt, and maintenance items
- **Priority filter:** Current priority filter
- **Status filter:** Open/in-progress/closed status
- **Sort order:** Sort field and direction
- **Selected issue:** Currently highlighted issue

## Interactions
- **Click issue:** Opens issue details panel
- **Priority filter:** Filters by severity
- **Status toggle:** Shows/hides closed issues
- **Create issue button:** Opens new issue form
- **Resolve action:** Marks issue as resolved

## Test Hooks
- `data-testid="maintenance-star-workbench"` on main container
- `data-testid="issue-list"` on issues list
- `data-testid="issue-{id}"` on individual issue
- `data-testid="issue-status-filter"` on filter dropdown
