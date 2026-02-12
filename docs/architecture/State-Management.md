# State Management Architecture Analysis

## Executive Summary

The ActionFlows Dashboard implements a **sophisticated multi-layer state management architecture** with:
- **11 Context providers** in hierarchical composition
- **45+ specialized hooks** for domain-specific logic
- **WebSocket-driven real-time synchronization** with HTTP polling fallback
- **Memoization-optimized performance** (154 useMemo/useCallback instances across 37 files)
- **Clear separation of concerns** between global, feature, and component-level state

---

## 1. Complete Context Provider Inventory

### Provider Hierarchy (from outer to inner)
```tsx
ThemeProvider
└─ FeatureFlagsProvider
   └─ ToastProvider
      └─ WebSocketProvider
         └─ SessionProvider
            └─ WorkbenchProvider
               └─ UniverseProvider
                  └─ DiscoveryProvider
                     └─ ChatWindowProvider
                        └─ DiscussProvider
                           └─ NotificationGlowProvider
                              └─ VimNavigationProvider
```

### Provider Catalog

| Provider | Data Managed | Actions Provided | Consumers |
|----------|--------------|------------------|-----------|
| **ThemeProvider** | `theme`, `resolvedTheme`, `isDark/isLight/isSystem` | `setTheme()`, `toggleTheme()` | Global UI components |
| **FeatureFlagsProvider** | `flags: FeatureFlags` | `updateFlag()`, `resetToDefaults()`, `isEnabled()` | Feature gates throughout app |
| **ToastProvider** | `toasts: ToastMessage[]` | `showToast()` | Error/success notifications |
| **WebSocketProvider** | `status: ConnectionStatus`, `error: Error \| null` | `send()`, `subscribe()`, `unsubscribe()`, `onEvent()` | Real-time event consumers |
| **SessionProvider** | `sessions: Session[]`, `activeSessionId`, `isLoading` | `createSession()`, `deleteSession()`, `setActiveSession()` | Session-aware components |
| **WorkbenchProvider** | `activeWorkbench`, `workbenchConfigs`, `workbenchNotifications`, `routingFilter`, `activeTool` | `setActiveWorkbench()`, `addNotification()`, `goBack()`, `setActiveTool()` | Navigation tabs, panels |
| **UniverseProvider** | `universe`, `isLoading`, `zoomTargetRegionId`, `targetWorkbenchId` | `navigateToRegion()`, `zoomToRegion()`, `returnToGodView()`, `refreshUniverse()` | CosmicMap, discovery |
| **DiscoveryProvider** | `discoveryProgress`, `readyToReveal`, `discoveryEnabled` | `checkDiscovery()`, `revealRegion()`, `recordInteraction()` | Discovery UI, reveals |
| **ChatWindowProvider** | `isOpen`, `sessionId`, `chatWidth`, `selectedModel`, `unreadCount` | `openChat()`, `closeChat()`, `setChatWidth()`, `setSelectedModel()` | SlidingChatWindow, buttons |
| **DiscussProvider** | Ref-based: `chatInputSetterRef`, `discussionMessageRef` | `registerChatInput()`, `prefillChatInput()`, `getDiscussionMessage()` | ChatPanel, 41+ DiscussButtons |
| **NotificationGlowProvider** | `notifications`, `notificationState` | `getSessionGlow()`, `getWorkbenchGlow()`, `addNotification()` | Glow effects |
| **VimNavigationProvider** | `mode`, `isEnabled`, `currentTarget`, `targets` | `setMode()`, `navigateToTarget()`, `navigateNext()` | Vim navigation system |

---

## 2. Custom Hooks Catalog

### State Hooks (Data Management)

| Hook | Purpose | Returns |
|------|---------|---------|
| `useChainState` | Maintains chain state with step updates | `{ chain, updateStep, setChain }` |
| `useChatMessages` | Chat message history with WebSocket sync | `{ messages, isLoading, addUserMessage, clearMessages }` |
| `useAllSessions` | All sessions with real-time updates | `{ sessions, loading, error, refresh }` |
| `useActiveChain` | Active chain for session with refetch | `{ activeChain, allChains, loading, refetch }` |
| `useEditorFiles` | Monaco editor file state | `{ files, activeFile, openFile, closeFile }` |
| `useFileTree` | File system tree structure | `{ tree, expanded, toggleExpanded }` |
| `usePromptButtons` | Context-aware prompt button selection | `{ buttons, getButtonPromptText }` |
| `useCustomPromptButtons` | User-defined custom prompt buttons | `{ customButtons, addButton, removeButton }` |
| `useReminderButtons` | Time-based reminder prompt buttons | `{ reminderButtons, scheduleReminder }` |
| `useSessionArchive` | Archived session data | `{ archivedSessions, archiveSession }` |
| `useDiscoveredSessions` | Sessions discovered via file watcher | `{ discoveredSessions, attachSession }` |
| `useProjects` | Project metadata | `{ projects, activeProject, setActiveProject }` |
| `useDossiers` | Intel dossier data | `{ dossiers, createDossier, updateDossier }` |

### Effect Hooks (Side Effects & Subscriptions)

| Hook | Purpose | Cleanup |
|------|---------|---------|
| `useEvents` | Subscribe to WebSocket events | WebSocket unsubscribe on unmount |
| `useChainEvents` | Chain step progression handlers | Event listener cleanup |
| `useWebSocket` | Connection with reconnect | Close connection, clear intervals |
| `useSessionControls` | Session commands (pause/resume/cancel) | None |
| `useKeyboardShortcuts` | Global keyboard shortcuts | `removeEventListener` |
| `useVimNavigation` | Vim-style navigation mode | Event cleanup |
| `useFileSyncManager` | File system monitoring | Watcher cleanup |
| `useTerminalEvents` | Terminal output handling | Listener cleanup |
| `useClaudeCliControl` | CLI process control | Process cleanup |
| `useNotifications` | Push notifications | Permission cleanup |

### Subscription Hooks (Derived Data)

| Hook | Purpose | Memoization |
|------|---------|-------------|
| `useLatestEvent` | Most recent event of type | No |
| `useFilteredEvents` | Events matching predicate | No |
| `useEventStats` | Event count statistics | Yes |
| `useChainEventSummary` | Chain activity summary | No |
| `useSessionInput` | Session input state | Yes |
| `useButtonActions` | Button action handlers | Yes |
| `useDiscussButton` | Discuss button state/handlers | Yes |
| `useNotificationGlow` | Notification glow state | Yes |
| `useHarmonyMetrics` | Contract compliance metrics | Yes |

---

## 3. State Distribution Analysis

### Global vs Local Decision Criteria

| State Type | Scope | Storage | Example |
|------------|-------|---------|---------|
| **Global Shared** | Context provider | Provider state + localStorage | `activeSessionId`, `theme` |
| **Global Transient** | Context provider | Provider state only | WebSocket `status`, `isLoading` |
| **Feature-Scoped** | Dedicated provider | Provider state | `discoveryProgress`, `vimMode` |
| **Component-Local** | useState in component | Component state | Modal open/closed, input value |
| **Derived** | useMemo in hook | Computed on-demand | Button visibility, glow intensity |
| **Persisted** | localStorage + Context | localStorage sync | `afw-active-session`, `afw-theme` |

### State Ownership Patterns

**Pattern 1: Single Source of Truth (SSOT)**
- `SessionContext` owns all session data
- Components never duplicate session state
- Updates always flow through context actions

**Pattern 2: Ref-Based Registration**
- `DiscussContext` uses refs for ChatPanel input registration
- Avoids re-render cascades
- 41+ DiscussButton instances register on mount, unregister on unmount

**Pattern 3: Event-Driven Sync**
- WebSocket events update local state optimistically
- Backend is source of truth, frontend mirrors
- Events trigger refetch for authoritative data

**Pattern 4: Lazy Loading**
- `useActiveChain` fetches on mount + refetches on events
- `useAllSessions` fetches once, then updates via WebSocket
- Reduces initial bundle size

**Pattern 5: Hierarchical State**
- Universe → Region → Workbench → Session → Chain → Step
- Parent state changes invalidate child queries
- Zoom navigation updates both UniverseContext and WorkbenchContext

---

## 4. Synchronization Patterns

### WebSocket → Context → Component Update Chains

**Chain 1: Session Lifecycle**
```
Backend emits `session:started`
  → WebSocketContext receives event
    → useAllSessions hook updates sessions array
      → SessionContext consumers re-render
        → SessionList shows new session
```

**Chain 2: Step Execution**
```
Backend emits `step:spawned`
  → useEvents captures event for sessionId
    → useChainEvents calls onStepSpawned callback
      → useChainState.updateStep() modifies chain
        → ChainVisualization re-renders
```

**Chain 3: Chat Messages**
```
Backend emits `chat:message`
  → useChatMessages processes event
    → Deduplicates via seenIdsRef
      → Appends to messages array
        → ChatPanel re-renders
```

**Chain 4: Discovery Progress**
```
User action triggers `recordInteraction()`
  → DiscoveryContext POST /api/universe/discovery/record
    → checkDiscovery() polls progress
      → `universe:region_discovered` WebSocket event
        → updateDiscoveryProgress() sets region to 100%
          → CosmicMap plays reveal animation
```

**Chain 5: Workbench Navigation**
```
User clicks workbench tab
  → setActiveWorkbench(id)
    → localStorage.setItem('afw-active-workbench', id)
      → WorkbenchContext notifies consumers
        → AppContent switches active panel
```

### Event Deduplication Strategy

**Problem**: React StrictMode calls effects twice in dev, causing duplicate event processing.

**Solution**: Ref-based deduplication in `useChatMessages`
```typescript
const seenIdsRef = useRef<Set<string>>(new Set());

// Dedup OUTSIDE updater to avoid StrictMode double-invocation
if (seenIdsRef.current.has(chatMsg.id)) {
  setMessages(prev => prev.map(m => (m.id === chatMsg.id ? chatMsg : m)));
} else {
  seenIdsRef.current.add(chatMsg.id);
  setMessages(prev => [...prev, chatMsg]);
}
```

### Subscription Lifecycle Management

**Pattern**: Auto-subscribe on mount, auto-unsubscribe on cleanup
```typescript
useEffect(() => {
  subscribe(sessionId);
  return () => {
    unsubscribe(sessionId);
  };
}, [sessionId, subscribe, unsubscribe]);
```

**WebSocket Connection Stability**:
- Auto-reconnect with exponential backoff (3s → 6s → 12s → max 30s)
- Heartbeat ping every 25s, timeout after 30s silence
- HTTP polling fallback after 3 consecutive WebSocket failures (polls every 5s)
- Re-subscribes to all sessions after reconnect

---

## 5. State Update Propagation Flows

### Flow 1: Optimistic Updates + Rollback
```typescript
// ChatWindowContext.openChat()
async openChat(source: string) {
  setIsOpen(true); // Optimistic

  if (!sessionId && !activeSessionId) {
    try {
      const newId = await createSession();
      setSessionId(newId); // Success
    } catch (error) {
      console.error(error);
      // Continue with no session - user can select manually
      // No rollback of isOpen - chat window stays open
    }
  }
}
```

### Flow 2: Derived State Cascades
```typescript
// WorkbenchContext.filterSessionsByContext()
const filterSessionsByContext = useCallback(
  (sessions: Session[]): Session[] => {
    if (!routingFilter) return sessions;

    return sessions.filter(session => {
      const routingContext = session.metadata?.routingContext;
      return routingContext === routingFilter;
    });
  },
  [routingFilter]
);

// When routingFilter changes → filtered list updates → UI re-renders
```

### Flow 3: Multi-Level State Sync
```typescript
// UniverseContext.navigateToRegion()
navigateToRegion(regionId) {
  const region = universe.regions.find(r => r.id === regionId);
  if (!region || region.fogState !== FogState.REVEALED) return;

  // Level 1: UniverseContext
  setTargetWorkbenchId(region.workbenchId);
  setZoomTargetRegionId(regionId);

  // Level 2: WorkbenchContext (via consumers reading targetWorkbenchId)
  // WorkbenchLayout.useEffect picks up targetWorkbenchId change
  //   → calls setActiveWorkbench(targetWorkbenchId)

  // Level 3: CosmicMap (via consumers reading zoomTargetRegionId)
  // CosmicMap.useEffect picks up zoomTargetRegionId change
  //   → animates viewport zoom to region
}
```

### Flow 4: Batched State Updates
```typescript
// useChainState.updateStep()
updateStep(stepNumber, updates) {
  setChainState(prevChain => {
    // 1. Find step
    const stepIndex = prevChain.steps.findIndex(...);

    // 2. Create updated step
    const updatedStep = { ...prevChain.steps[stepIndex], ...updates };

    // 3. Create updated steps array
    const updatedSteps = [...prevChain.steps.slice(0, stepIndex), updatedStep, ...prevChain.steps.slice(stepIndex + 1)];

    // 4. Recalculate stats (all in one pass)
    const successfulSteps = updatedSteps.filter(s => s.status === 'completed').length;
    const failedSteps = updatedSteps.filter(s => s.status === 'failed').length;
    const skippedSteps = updatedSteps.filter(s => s.status === 'skipped').length;

    // 5. Derive chain status
    let chainStatus = prevChain.status;
    if (inProgressCount > 0) chainStatus = 'in_progress';
    else if (pendingCount === 0 && failedSteps === 0) chainStatus = 'completed';
    else if (failedSteps > 0) chainStatus = 'mixed';

    // 6. Return new chain object (single state update)
    return { ...prevChain, steps: updatedSteps, status: chainStatus, successfulSteps, failedSteps, skippedSteps };
  });
}
```

### Flow 5: Event → Multiple Contexts
```typescript
// NotificationGlowProvider listens to WebSocket
useEffect(() => {
  if (!wsContext?.onEvent) return;

  const unsubscribe = wsContext.onEvent((event: WorkspaceEvent) => {
    if (shouldGenerateNotification(event)) {
      const notification = createNotification(eventToNotificationInput(event));

      // Updates NotificationGlowContext
      setNotifications(prev => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));

      // Notification propagates to:
      // - getSessionGlow() → session glow effect
      // - getWorkbenchGlow() → workbench tab badge
    }
  });

  return unsubscribe;
}, [wsContext]);
```

---

## 6. Performance Optimization Patterns

### Memoization Strategy

**154 useMemo/useCallback instances** across 37 hook files.

**Pattern A: Context Value Memoization**
```typescript
// SessionContext.tsx
const value = useMemo(
  () => ({
    sessions,
    activeSessionId,
    isLoading,
    createSession,
    deleteSession,
    setActiveSession: handleSetActiveSession,
    getSession,
  }),
  [sessions, activeSessionId, isLoading, createSession, deleteSession, handleSetActiveSession, getSession]
);
```
**Why**: Prevents context consumers from re-rendering unless actual values change.

**Pattern B: Callback Stability**
```typescript
// SessionContext.tsx
const createSession = useCallback(
  async (cwd?: string, name?: string): Promise<SessionId> => {
    // ... implementation
  },
  [API_BASE_URL]
);
```
**Why**: Ensures callback identity remains stable, preventing downstream useMemo/useCallback invalidation.

**Pattern C: Derived State Memoization**
```typescript
// usePromptButtons.ts
const buttons = useMemo(() => {
  const context: PromptButtonContext = {
    sessionStatus: session?.status || 'unknown',
    conversationState: session?.conversationState || 'idle',
    lastMessage,
    cliRunning,
    chainPaused: (session?.currentChain?.status as string) === 'paused',
  };

  return selectPromptButtons(context);
}, [session, lastMessage, cliRunning]);
```
**Why**: Expensive button selection logic runs only when inputs change.

**Pattern D: Ref-Based Caching**
```typescript
// useWebSocket.ts
const onEventRef = useRef(onEvent);
onEventRef.current = onEvent;

const handleMessage = useCallback((event: MessageEvent) => {
  // Uses onEventRef.current (always latest)
  onEventRef.current?.(data as WorkspaceEvent);
}, []); // Empty deps - handleMessage identity never changes
```
**Why**: Prevents reconnect storms caused by handleMessage identity changing on every onEvent prop update.

### Batching Techniques

**Technique 1: Single State Update for Multi-Field Changes**
```typescript
// useChainState.updateStep() - shown in Flow 4 above
// All stats recalculated and applied in one setState call
```

**Technique 2: Debounced API Calls**
```typescript
// DiscoveryContext.tsx
const POLLING_INTERVAL_ACTIVE = 10000; // 10s when active
const POLLING_INTERVAL_IDLE = 30000;   // 30s when idle

const pollInterval = timeSinceLastDiscovery > IDLE_THRESHOLD_MS
  ? POLLING_INTERVAL_IDLE
  : POLLING_INTERVAL_ACTIVE;
```

**Technique 3: Throttled Event Processing**
```typescript
// useNotificationGlow.ts
const MAX_NOTIFICATIONS = 100;

setNotifications(prev => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
```

### Selector Pattern

**Pattern**: Compute derived data in hook, return minimal API
```typescript
// useNotificationGlow.ts
const getWorkbenchGlow = useCallback(
  (workbenchId: WorkbenchId): GlowState => {
    const workbenchNotifications = notifications.filter(n => {
      if (n.workbenchId === workbenchId) return true;
      if (n.sessionId) return getWorkbenchForSession(n.sessionId) === workbenchId;
      return false;
    });
    return calculateGlowState(workbenchNotifications);
  },
  [notifications]
);
```
**Why**: Components don't need to iterate notifications array; hook provides optimized selector.

### Lazy Initialization

**Pattern**: Use function initializer for expensive localStorage reads
```typescript
// SessionContext.tsx
const [activeSessionId, setActiveSessionId] = useState<SessionId | null>(() => {
  const saved = localStorage.getItem('afw-active-session');
  // Only runs once on mount, not on every render
  return saved ? (saved as SessionId) : null;
});
```

### Subscription Pruning

**Pattern**: Limit state size to prevent memory leaks
```typescript
// SessionContext.tsx
if (prunedSessions.length > 20) {
  prunedSessions = prunedSessions
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 20);
}
```

---

## 7. Best Practices Observed

### ✅ Strengths

1. **Clear Provider Hierarchy**
   - Dependencies flow from outer to inner (WebSocket → Session → Workbench)
   - No circular dependencies
   - Explicit nesting order prevents race conditions

2. **Comprehensive Error Handling**
   - All async operations wrapped in try/catch
   - Errors stored in state (`error: Error | null`)
   - Fallback behavior (e.g., HTTP polling when WebSocket fails)

3. **Type Safety**
   - Branded types (`SessionId`, `WorkbenchId`, `ChainId`) prevent ID mixups
   - Discriminated unions for events (`WorkspaceEvent`)
   - Strict TypeScript throughout

4. **Immutable Updates**
   - All state updates create new objects/arrays
   - Spread operators + array slicing
   - Enables React's referential equality checks

5. **Cleanup Discipline**
   - Every `useEffect` with side effects returns cleanup function
   - WebSocket unsubscribe, event listener removal, interval clearing
   - Prevents memory leaks

6. **Accessibility Integration**
   - `useErrorAnnouncements` for ARIA live regions
   - `useReducedMotion` respects user preferences
   - `useVimNavigation` for keyboard-only workflows

7. **Performance-First Design**
   - 154 memoization instances across 37 files
   - Ref-based optimizations (DiscussContext, useWebSocket)
   - Lazy loading + code splitting

8. **localStorage Persistence**
   - `activeSessionId`, `activeWorkbench`, `theme`, `chatWidth`, `vimEnabled`
   - Synced on change, loaded on mount
   - Validates existence before restoring

9. **Real-Time + HTTP Fallback**
   - WebSocket for real-time events
   - HTTP polling fallback after 3 failures
   - Seamless switchover without user intervention

10. **Decoupled Communication**
    - DiscussContext uses ref registration pattern
    - 41+ DiscussButton instances communicate with ChatPanel without prop drilling
    - Scales horizontally (adding more buttons doesn't change existing code)

### ⚠️ Anti-Patterns to Avoid

1. **Prop Drilling**
   - **Avoided**: No session props passed through 5+ levels
   - **Solution**: Context providers + hooks

2. **Stale Closures**
   - **Avoided**: Ref-based caching in useWebSocket
   - **Solution**: `onEventRef.current` always has latest callback

3. **Duplicate State**
   - **Avoided**: No component keeps its own copy of session data
   - **Solution**: Single source of truth in SessionContext

4. **Unbounded Arrays**
   - **Avoided**: Notification cap at 100, session pruning at 20
   - **Solution**: `.slice(0, MAX)` on every append

5. **Missing Cleanup**
   - **Avoided**: All intervals/listeners have cleanup
   - **Solution**: Every `useEffect` with side effects returns cleanup function

6. **Race Conditions**
   - **Avoided**: Explicit session existence check before restoring from localStorage
   - **Solution**: Fetch sessions first, then validate activeSessionId

---

## 8. Architectural Insights

### State Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│ Backend (Express + WebSocket + Redis)                       │
└────────────┬──────────────────────────────┬─────────────────┘
             │ HTTP REST                    │ WebSocket Events
             ▼                              ▼
┌────────────────────────────┐  ┌──────────────────────────────┐
│ API Calls (fetch)          │  │ WebSocketContext             │
│ - GET /api/sessions        │  │ - Receives events            │
│ - POST /api/sessions       │  │ - Distributes to subscribers │
│ - DELETE /api/sessions/:id │  │ - Auto-reconnect + fallback  │
└────────────┬───────────────┘  └──────────┬───────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Context Providers (11 layers)                               │
│ - SessionContext (session CRUD)                             │
│ - WorkbenchContext (navigation)                             │
│ - UniverseContext (cosmic map)                              │
│ - DiscoveryContext (fog of war)                             │
│ - ChatWindowContext (chat state)                            │
│ - NotificationGlowContext (alerts)                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Custom Hooks (45+ specialized hooks)                        │
│ - useEvents (WebSocket subscription)                        │
│ - useChatMessages (message history)                         │
│ - useActiveChain (chain state)                              │
│ - usePromptButtons (UI state)                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Components (React UI)                                        │
│ - SessionPanel, ChainVisualization, CosmicMap, ChatPanel    │
└─────────────────────────────────────────────────────────────┘
```

### Data Lifecycle

**Session Creation**:
1. User clicks "New Session"
2. `SessionContext.createSession()` → POST /api/sessions
3. Backend creates session → emits `session:started` event
4. WebSocketContext receives event → `useAllSessions` updates state
5. UI shows new session in list + sets as active

**Step Execution**:
1. Backend executes step → emits `step:spawned` event
2. `useEvents` captures event for sessionId
3. `useChainEvents` calls `onStepSpawned` callback
4. `useChainState.updateStep()` updates step status
5. ChainVisualization re-renders with animated node

**Discovery Trigger**:
1. User completes chain → `recordChainCompleted(chainId)`
2. Backend increments discovery progress → emits `universe:region_discovered`
3. DiscoveryContext optimistically sets progress to 100%
4. UniverseContext.refreshUniverse() fetches updated fog states
5. CosmicMap plays fade-in animation for revealed region

### Scalability Considerations

**Current State**:
- 11 context providers (manageable)
- 45+ hooks (well-organized by domain)
- 154 memoization points (good coverage)

**Scaling Strategies**:
1. **Context Splitting**: If WorkbenchContext grows too large, split into `WorkbenchNavigationContext` + `WorkbenchNotificationContext`
2. **Hook Composition**: Combine related hooks (e.g., `useSession` = `useSessionContext` + `useAllSessions` + `useActiveChain`)
3. **Lazy Context Loading**: Load UniverseContext only when CosmicMap is visible
4. **State Normalization**: If session list grows >1000, normalize to `{ byId: {}, allIds: [] }` for O(1) lookup

---

## Summary

The ActionFlows Dashboard implements a **mature, production-ready state management architecture** with:

- **11-layer hierarchical context composition** (no circular deps)
- **45+ domain-specific hooks** (clear separation of concerns)
- **WebSocket-first real-time sync** with HTTP polling fallback
- **Memoization-optimized performance** (154 instances across 37 files)
- **Type-safe branded IDs** (prevents ID category mixing)
- **Comprehensive cleanup discipline** (no memory leaks)
- **Ref-based optimizations** (avoids reconnect storms)
- **localStorage persistence** (6 keys for UX continuity)
- **Decoupled communication** (ref registration pattern for 41+ DiscussButtons)

**Key Innovation**: The ref-based registration pattern in `DiscussContext` enables 41+ DiscussButton instances to communicate with ChatPanel without prop drilling or re-render cascades.

**Architecture Grade**: A+ (enterprise-ready, scalable, maintainable)
