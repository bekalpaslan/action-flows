# ChatPanel Behavioral Contract

## Identity
**Component Name:** ChatPanel
**File Path:** packages/app/src/components/SessionPanel/ChatPanel.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Mobile-format chat window within SessionPanel. Displays conversation messages in chat UI format optimized for narrow column (~280px minimum).

## Lifecycle
- **Mount:** Loads message history, subscribes to new messages, initializes auto-scroll
- **Update:** Auto-scrolls to bottom when new messages arrive
- **Unmount:** Cleans up WebSocket subscriptions

## Props Contract
```typescript
interface ChatPanelProps {
  sessionId: SessionId;
}
```

## State Ownership
- **Chat messages:** Array of ChatMessage objects (user/assistant/system)
- **Scroll position:** Reference for auto-scroll behavior
- **Typing indicator:** Whether assistant is currently responding
- **Input value:** Current user input text draft
- **Selected prompt button:** Active context-aware prompt

## Interactions
- **Type message:** Updates input state
- **Send button:** Submits message via WebSocket
- **Prompt button:** Inserts suggested text into input
- **Message hover:** Shows timestamp/metadata
- **Auto-scroll:** Keeps view at latest message

## Test Hooks
- `data-testid="chat-panel"` on main container
- `data-testid="message-list"` on messages container
- `data-testid="message-{id}"` on individual message
- `data-testid="chat-input"` on input field
- `data-testid="send-button"` on send button
- `data-testid="prompt-button-{idx}"` on prompt buttons
- `data-testid="typing-indicator"` on typing animation
