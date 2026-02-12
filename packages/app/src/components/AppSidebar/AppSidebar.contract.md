# AppSidebar Behavioral Contract

## Identity
**Component Name:** AppSidebar
**File Path:** packages/app/src/components/AppSidebar/AppSidebar.tsx
**Type:** Container
**Last Updated:** 2026-02-12

## Render Location
Left-side navigation sidebar in main dashboard layout. Contains star navigation, search, user profile, and navigation groups.

## Lifecycle
- **Mount:** Loads navigation structure, subscribes to navigation state
- **Update:** Re-renders when active workbench changes
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
// No props - uses context internally
```

## State Ownership
- **Expanded groups:** Which navigation groups are expanded
- **Selected star:** Currently active workbench/star
- **Search state:** Active search query
- **User profile:** Current user information
- **Unread counts:** Unread notifications per workbench

## Interactions
- **Click star:** Navigates to workbench
- **Expand group:** Shows/hides navigation items
- **Search input:** Filters navigation items
- **Profile menu:** Opens user menu

## Test Hooks
- `data-testid="app-sidebar"` on main container
- `data-testid="sidebar-nav-group-{group}"` on nav groups
- `data-testid="sidebar-nav-item-{workbenchId}"` on nav items
- `data-testid="sidebar-search"` on search input
- `data-testid="user-profile"` on profile section
