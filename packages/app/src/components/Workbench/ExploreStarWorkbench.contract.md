# ExploreStarWorkbench Behavioral Contract

## Identity
**Component Name:** ExploreStarWorkbench
**File Path:** packages/app/src/components/Workbench/ExploreStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='explore'. Main content area when Explore star is active.

## Lifecycle
- **Mount:** Loads exploration data, discovers new regions/features
- **Update:** Re-renders when discoveries are made
- **Unmount:** Cleans up

## Props Contract
```typescript
interface ExploreStarWorkbenchProps {
  workbenchId: 'explore';
}
```

## State Ownership
- **Discovered items:** List of explored features/regions
- **Exploration progress:** Map of discovered/undiscovered items
- **Current focus:** Which area is being explored
- **Breadcrumb trail:** Navigation history

## Interactions
- **Click discovery:** Navigates to related area
- **Expand section:** Shows nested discoveries
- **Guide button:** Opens guided exploration flow
- **Search:** Filters discoveries by keyword

## Test Hooks
- `data-testid="explore-star-workbench"` on main container
- `data-testid="discovery-item"` on discovery list items
- `data-testid="discovery-tree"` on tree structure
