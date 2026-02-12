# PMStarWorkbench Behavioral Contract

## Identity
**Component Name:** PMStarWorkbench
**File Path:** packages/app/src/components/Workbench/PMStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='pm'. Main content area when PM (Project Management) star is active.

## Lifecycle
- **Mount:** Loads roadmap, milestones, and project timeline
- **Update:** Re-renders when project data changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface PMStarWorkbenchProps {
  workbenchId: 'pm';
}
```

## State Ownership
- **Roadmap items:** Array of project phases/milestones
- **Timeline view:** Gantt/kanban/timeline view state
- **Current phase:** Active project phase
- **Filters:** Filter by status, owner, priority
- **Expanded item:** Currently expanded milestone

## Interactions
- **Click milestone:** Shows milestone details
- **Add milestone:** Opens new milestone dialog
- **Update status:** Changes milestone status
- **Filter items:** Updates visible milestones
- **Timeline drag:** Adjusts schedule (if enabled)

## Test Hooks
- `data-testid="pm-star-workbench"` on main container
- `data-testid="roadmap-list"` on roadmap items
- `data-testid="milestone-{id}"` on individual milestone
- `data-testid="timeline-view"` on timeline visualization
