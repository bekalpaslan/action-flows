# GlowIndicator Integration into SessionSidebarItem

## Task
Integrate GlowIndicator component into SessionSidebarItem.tsx for session-level notification glow.

## Files Modified

### 1. `packages/app/src/components/SessionSidebar/SessionSidebarItem.tsx`

**Changes:**
- Added import for `GlowIndicator` from `../common`
- Added import for `useNotificationGlowContext` from `../../hooks/useNotificationGlow`
- Added call to `useNotificationGlowContext()` to get `getSessionGlow` function
- Wrapped the session item `<div>` with `<GlowIndicator>` component:
  - `active={glowState.active}` - glow activates when session has unread notifications
  - `level={glowState.level}` - color coded by severity (info/success/warning/error)
  - `intensity={glowState.intensity}` - varies based on notification count/severity
  - `pulse={glowState.active}` - animates when active
  - `className="session-sidebar-glow-wrapper"` - for CSS styling

### 2. `packages/app/src/components/SessionSidebar/SessionSidebarItem.css`

**Changes:**
- Added `.session-sidebar-glow-wrapper` class:
  - `display: block` - ensures full-width layout
  - `width: 100%` - takes full container width
  - `border-radius: 0.5rem` - matches session item border radius for proper glow shape

## Integration Flow

```
NotificationGlowContext (parent provides)
    |
    v
SessionSidebarItem
    |
    +-- useNotificationGlowContext() -> getSessionGlow(session.id)
    |
    +-- GlowState { active, level, intensity }
    |
    v
GlowIndicator (wraps session item)
    |
    +-- CSS glow effect based on level (info/success/warning/error)
    +-- Pulse animation when active
    +-- Intensity-based glow strength
```

## Requirements Checklist

- [x] Import GlowIndicator from '../common'
- [x] Import useNotificationGlowContext hook
- [x] Get session glow state using getSessionGlow(sessionId)
- [x] Wrap session item with GlowIndicator
- [x] Pass active, level, intensity props
- [x] Update CSS for proper glow display
- [x] TypeScript type-check passes

## Verification

- `pnpm type-check` completed successfully for all packages
- No TypeScript errors in the modified files
