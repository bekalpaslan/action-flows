# AppContent Behavioral Contract

## Identity
**Component Name:** AppContent
**File Path:** packages/app/src/components/AppContent.tsx
**Type:** Container
**Last Updated:** 2026-02-12

## Render Location
Main content area wrapper within application layout. Sits between AppSidebar and SessionPanel in split-view layout.

## Lifecycle
- **Mount:** Initializes route/workbench context, loads initial content
- **Update:** Re-renders when navigation changes
- **Unmount:** Cleans up route subscriptions

## Props Contract
```typescript
// No props - uses routing context internally
```

## State Ownership
- **Current workbench/page:** From routing context
- **Content visibility:** Whether content is shown (vs cosmic map)
- **Layout state:** Split-view width state

## Interactions
- **Navigation:** Routes to different workbenches via context
- **Resize:** May trigger layout recalculation
- **Focus management:** Manages keyboard focus for accessibility

## Test Hooks
- `data-testid="app-content"` on main container
- `data-testid="content-area"` on content section
