# ConversationPanel Behavioral Contract

## Identity
**Component Name:** ConversationPanel
**File Path:** packages/app/src/components/ConversationPanel/ConversationPanel.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Chat/conversation display panel within session view. Shows message history and active conversation thread for orchestrator interaction.

## Lifecycle
- **Mount:** Loads message history, subscribes to new messages
- **Update:** Re-renders on new messages, auto-scrolls to latest
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
interface ConversationPanelProps {
  sessionId: SessionId;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Whether to auto-scroll to latest message */
  autoScroll?: boolean;
}
```

## State Ownership
- **Message list:** Array of conversation messages
- **Scroll ref:** Reference for auto-scroll behavior
- **Loading state:** Whether loading initial messages
- **Unread count:** Number of unread messages

## Interactions
- **Scroll up:** Loads older messages
- **Auto-scroll:** Keeps view at latest message
- **Click message:** May show message context menu

## Test Hooks
- `data-testid="conversation-panel"` on main container
- `data-testid="message-list"` on messages list
- `data-testid="message-{id}"` on individual message
- `data-testid="timestamp-{id}"` on timestamps
