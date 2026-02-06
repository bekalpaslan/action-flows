# Session Tree View - Quick Start Guide

## What Was Added

A new expandable session tree view that appears under each user in the sidebar, allowing users to see and manage individual sessions.

## File Locations

```
src/
├── components/
│   ├── SessionTree/
│   │   ├── SessionTree.tsx       # Main component
│   │   ├── SessionTree.css       # Styling
│   │   └── index.ts              # Exports
│   └── UserSidebar/
│       ├── UserSidebar.tsx       # UPDATED: Now includes SessionTree
│       └── UserSidebar.css       # UPDATED: New styling for tree
└── hooks/
    └── useUserSessions.ts        # Hook for fetching sessions
```

## Key Features

### SessionTree Component
```tsx
<SessionTree
  userId="user-123"
  sessions={sessions}
  attachedSessionIds={["session-abc"]}
  onSessionAttach={(id) => {...}}
  onSessionDetach={(id) => {...}}
  expanded={true}
  onToggle={() => {...}}
/>
```

**Props:**
- `userId`: User ID that owns these sessions
- `sessions`: Array of Session objects
- `attachedSessionIds`: Sessions currently attached to main view
- `onSessionAttach`: Called when user clicks to attach a session
- `onSessionDetach`: Called when user clicks to detach a session
- `expanded`: Optional, controls expand/collapse state
- `onToggle`: Optional, called when user toggles expand/collapse

### useUserSessions Hook
```tsx
const { sessions, loading, error, refresh } = useUserSessions(userId);
```

**Returns:**
- `sessions`: Array of Session objects for this user
- `loading`: Whether data is currently loading
- `error`: Error object if fetch failed
- `refresh`: Function to manually refresh sessions

**Features:**
- Auto-fetches from `/api/users/:userId/sessions`
- Auto-updates on WebSocket events
- Cleans up requests on unmount

### Updated UserSidebar Props
```tsx
<UserSidebar
  users={users}
  selectedUserId={selectedId}
  onUserSelect={setSelectedId}
  currentUserId={myId}
  attachedSessionIds={attachedIds}        // NEW
  onSessionAttach={attachSession}         // NEW
  onSessionDetach={detachSession}         // NEW
/>
```

## User Interface

### Expanded Session Tree
```
Users
  User Name (3 sessions)
    Sessions (3)
      ▼ session-abc (attached)
          green status "Active"    chain-name    5m ago
      ▶ session-def
          yellow status "Idle"     chain-name    2h ago
      ▶ session-ghi
          gray status "Ended"      (no chain)    1d ago
```

### Status Indicators
- **Green (●)**: Active session (`in_progress` status)
- **Yellow (●)**: Idle session (`pending` status)
- **Gray (●)**: Ended session (`completed` status)

### Session Actions
- **Click session**: Toggle attach/detach
- **Checkmark (✓)**: Shows attached sessions
- **Click arrow (▶/▼)**: Expand/collapse tree

## API Requirements

### Sessions Endpoint
```
GET /api/users/:userId/sessions

Response:
{
  "sessions": [
    {
      "id": "session-123",
      "user": "user-456",
      "cwd": "/path/to/project",
      "hostname": "localhost",
      "platform": "win32",
      "chains": [...],
      "currentChain": { "title": "code-and-review", ... },
      "status": "in_progress",
      "startedAt": "2026-02-06T10:30:00Z",
      ...
    }
  ]
}
```

## WebSocket Integration

The hook listens for these events:
- `session:started` - New session
- `session:updated` - Session changed
- `session:ended` - Session finished

Events are filtered by user ID automatically.

## CSS Classes Reference

**Tree Structure:**
- `.session-tree` - Main container
- `.session-tree-toggle` - Expand/collapse button
- `.session-tree-content` - Scrollable session list
- `.session-item` - Individual session
- `.session-button` - Clickable session

**Status:**
- `.status-indicator` - Colored dot
- `.status-active` - Green
- `.status-idle` - Yellow
- `.status-ended` - Gray

**Attached:**
- `.attached` - Class on attached session button
- `.attached-checkmark` - Green checkmark

## Common Tasks

### Attach a session
```tsx
const handleAttach = (sessionId: string) => {
  setAttachedSessionIds([...attachedSessionIds, sessionId]);
  // Also: update your view/chart to show this session
};
```

### Detach a session
```tsx
const handleDetach = (sessionId: string) => {
  setAttachedSessionIds(attachedSessionIds.filter(id => id !== sessionId));
  // Also: remove this session from your view/chart
};
```

### Refresh sessions manually
```tsx
const { sessions, refresh } = useUserSessions(userId);

// Later...
refresh(); // Fetches latest sessions
```

### Filter sessions by status
```tsx
const activeSessions = sessions.filter(s => s.status === 'in_progress');
const idleSessions = sessions.filter(s => s.status === 'pending');
const completedSessions = sessions.filter(s => s.status === 'completed');
```

## Styling Customization

Key CSS variables/colors:
- **Theme**: `#1e1e1e` (dark background)
- **Accent**: `#bb86fc` (purple)
- **Active**: `#4caf50` (green)
- **Idle**: `#ffc107` (yellow)
- **Ended**: `#757575` (gray)

To customize colors, update values in:
- `SessionTree.css` (tree styling)
- `UserSidebar.css` (integration styling)

## Performance Notes

- Sessions only fetch when UserListItem mounts
- WebSocket filters events by user before updating
- Requests cancel on unmount to prevent memory leaks
- Max 600px height for scrollable tree to prevent layout shift

## Backward Compatibility

All new props in UserSidebar have defaults:
- `attachedSessionIds` defaults to `[]`
- `onSessionAttach` defaults to no-op
- `onSessionDetach` defaults to no-op

Existing code will work without changes.

## Troubleshooting

### Sessions not loading?
- Check network tab: `/api/users/:userId/sessions` request
- Verify session API returns correct format
- Check browser console for fetch errors

### Sessions not updating?
- Verify WebSocket connection is active
- Check event types: `session:started`, `session:updated`, `session:ended`
- Confirm events have correct user ID

### Tree not expanding?
- Ensure `expanded` prop is passed correctly
- Check sessions array is not empty
- Verify `onToggle` callback is called

### Styling issues?
- Ensure CSS is imported: `import './SessionTree.css'`
- Check dark theme colors match sidebar
- Verify scrollbar styling not conflicting

## Dependencies

Required:
- React (17+)
- TypeScript (4.5+)
- @afw/shared (for Session type)

Optional:
- WebSocket context (for auto-updates)
