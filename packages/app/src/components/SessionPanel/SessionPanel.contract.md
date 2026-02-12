# SessionPanel Behavioral Contract

## Identity
**Component Name:** SessionPanel
**File Path:** packages/app/src/components/SessionPanel/SessionPanel.tsx
**Type:** Container
**Last Updated:** 2026-02-12

## Render Location
Right-side panel in split-view layout. Occupies fixed or resizable column on the right side of main dashboard, displaying session-related chat and information.

## Lifecycle
- **Mount:** Loads session data and message history from context
- **Update:** Re-renders when active session changes or new messages arrive
- **Unmount:** Cleans up message subscriptions

## Props Contract
```typescript
interface SessionPanelProps {
  sessionId: SessionId;
  /** Width of panel in pixels */
  width?: number;
  /** Whether panel is resizable */
  resizable?: boolean;
}
```

## State Ownership
- **Message list:** Array of chat messages in session
- **Scroll position:** Auto-scroll to latest message
- **Collapse state:** Header collapse/expand state
- **Panel width:** Current panel width (if resizable)
- **Input draft:** Current message input text

## Interactions
- **Send message:** Submits user message to Claude
- **Resize handle:** Adjusts panel width
- **Collapse header:** Toggles session info visibility
- **Click message:** May open message details

## Test Hooks
- `data-testid="session-panel"` on main container
- `data-testid="chat-panel"` on chat section
- `data-testid="session-info"` on info header
- `data-testid="resize-handle"` on resize handle
