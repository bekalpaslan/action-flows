# IntelStarWorkbench Behavioral Contract

## Identity
**Component Name:** IntelStarWorkbench
**File Path:** packages/app/src/components/Workbench/IntelStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='intel'. Main content area when Intel (Intelligence) star is active.

## Lifecycle
- **Mount:** Loads intelligence dossiers, insights, and analysis
- **Update:** Re-renders when dossier data updates
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
interface IntelStarWorkbenchProps {
  workbenchId: 'intel';
}
```

## State Ownership
- **Dossiers:** Array of intelligence files
- **Current dossier:** Active dossier being viewed
- **Tabs:** Dossier tab/section state
- **Search query:** Intelligence search text
- **Filters:** Filter by type, source, etc.

## Interactions
- **Click dossier:** Opens dossier details
- **Tab switch:** Changes dossier section
- **Search intelligence:** Finds dossiers by keyword
- **Create dossier:** Opens new dossier form
- **Expand section:** Shows nested intelligence items

## Test Hooks
- `data-testid="intel-star-workbench"` on main container
- `data-testid="dossier-list"` on dossiers list
- `data-testid="dossier-{id}"` on individual dossier
- `data-testid="dossier-tabs"` on tab navigation
- `data-testid="dossier-content"` on content area
