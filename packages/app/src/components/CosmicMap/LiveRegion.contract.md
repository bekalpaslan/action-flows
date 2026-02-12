# LiveRegion Behavioral Contract

## Identity
**Component Name:** LiveRegion
**File Path:** packages/app/src/components/CosmicMap/LiveRegion.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
ARIA live region rendered invisibly within CosmicMap. Not visually displayed but provides screen reader announcements for region discoveries and state changes.

## Lifecycle
- **Mount:** Sets up live region container and aria-live="polite" attribute
- **Update:** Broadcasts announcements when regions are discovered or status changes
- **Unmount:** Cleans up

## Props Contract
```typescript
// No props - uses UniverseContext internally
```

## State Ownership
- **Announcement queue:** Tracks pending announcements for screen readers
- **Region discovery state:** From UniverseContext

## Interactions
- **No user interactions:** Pure accessibility component
- **Screen readers:** Broadcasts region discoveries and important state changes

## Test Hooks
- `data-testid="live-region"` on main container
- `role="status"` attribute for ARIA
- `aria-live="polite"` for announcements
