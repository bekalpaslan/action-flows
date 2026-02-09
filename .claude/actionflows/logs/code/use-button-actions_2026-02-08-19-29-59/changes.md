# useButtonActions Hook Implementation

**Task:** Create useButtonActions hook in packages/app/src/hooks/
**Context:** SRD Section 2.3 - routes button clicks to command queue, API calls, or quick actions

## Summary

Implemented a fully-typed React hook that routes button actions to appropriate handlers (command queue, API calls, quick actions, clipboard, navigation). The hook integrates with the existing button system and provides usage tracking.

## Files Created

### 1. `/packages/app/src/hooks/useButtonActions.ts`

- **Type:** New custom React hook
- **Exports:**
  - `useButtonActions(sessionId)` - Main hook function
  - `UseButtonActionsResult` - Return type interface

#### Implementation Details

**Hook Signature:**
```typescript
function useButtonActions(sessionId: SessionId): UseButtonActionsResult
```

**Return Value:**
```typescript
interface UseButtonActionsResult {
  executeAction: (button: ButtonDefinition) => Promise<void>;
  trackUsage: (buttonId: string, projectId: string) => Promise<void>;
}
```

**Action Type Routing:**

1. **'command'** - Dispatch to session command queue
   - POST to `/api/sessions/{sessionId}/commands`
   - Includes commandType and payload
   - Error handling with response parsing

2. **'api-call'** - Direct HTTP request
   - Uses endpoint, method (default POST), and payload from action
   - Full error handling with status codes
   - JSON response parsing

3. **'quick-action'** - Trigger quick action
   - POST to `/api/sessions/{sessionId}/quick-actions`
   - Sends full action payload
   - Response validation

4. **'clipboard'** - Copy text to clipboard
   - Uses Clipboard API
   - Requires `text` property in payload
   - Graceful error handling

5. **'navigate'** - Navigation (placeholder)
   - Logs target and payload
   - TODO: Integrate with React Router in future

6. **'custom'** - Custom handlers
   - Currently logs warning
   - Extensible for behavior pack integration

**Usage Tracking:**
- `trackUsage(buttonId, projectId)` posts usage data to toolbar API
- Non-critical errors logged as warnings (won't break UI)
- Async but doesn't block action execution

#### Key Features

- Fully typed with TypeScript
- Error handling and logging throughout
- Uses `useCallback` for performance optimization
- Follows existing project patterns (see useSessionControls.ts)
- BACKEND_URL from Vite environment or localhost:3001
- All action handlers as separate functions (testable, composable)

## Files Modified

### 1. `/packages/app/src/hooks/index.ts`

**Changes:** Exported new hook

```typescript
export { useButtonActions } from './useButtonActions';
export type { UseButtonActionsResult } from './useButtonActions';
```

### 2. `/packages/app/src/components/InlineButtons/InlineButtonItem.tsx`

**Changes:** Integrated useButtonActions hook into button component

1. **Import added:**
   ```typescript
   import { useButtonActions } from '../../hooks/useButtonActions';
   ```

2. **Props interface updated:**
   - Added optional `projectId?: string` (defaults to 'default')
   - Maintains backward compatibility

3. **Hook instantiation:**
   ```typescript
   const { executeAction, trackUsage } = useButtonActions(sessionId);
   ```

4. **handleClick callback updated:**
   - Calls `await executeAction(button)` instead of logging only
   - Tracks usage with `await trackUsage(button.id, projectId)` after success
   - Maintains state management (loading → success/error → idle)
   - Enhanced error handling

5. **Dependency array updated:**
   - Added `executeAction` and `trackUsage` dependencies
   - Proper memoization

#### Before/After

**Before:** Button clicks were only logged to console and had simulated success.

**After:** Button clicks execute real actions through the appropriate handler:
- Commands go to command queue
- API calls execute immediately
- Quick actions trigger backend handlers
- Clipboard operations work natively
- Usage is tracked for learning system

## Testing Approach

### Manual Testing Checklist

1. **Command Actions**
   - Click a button with action.type = 'command'
   - Verify request sent to `/api/sessions/{sessionId}/commands`
   - Check console logs for command queuing confirmation

2. **API Call Actions**
   - Click a button with action.type = 'api-call'
   - Verify fetch request to configured endpoint
   - Check method (GET/POST/etc.) and payload handling

3. **Quick Actions**
   - Click a button with action.type = 'quick-action'
   - Verify request sent to `/api/sessions/{sessionId}/quick-actions`
   - Check response handling

4. **Clipboard Actions**
   - Click a button with action.type = 'clipboard'
   - Verify text copied to clipboard
   - Test with missing text payload (error handling)

5. **Usage Tracking**
   - Click any button successfully
   - Verify POST to `/api/toolbar/{projectId}/track`
   - Check that errors don't block UI

6. **Error Handling**
   - Trigger network errors for each action type
   - Verify error state displays and clears after 2s
   - Check console logs for debugging info

## Integration Points

### Consumers of useButtonActions

- `InlineButtonItem.tsx` - Now uses executeAction and trackUsage
- Future components can use this hook with their own button definitions
- Quick action bar components can leverage action routing

### Existing Integrations

- Relies on `@afw/shared` types (ButtonDefinition, ButtonAction, SessionId)
- Uses session ID passed from parent components
- Respects VITE_BACKEND_URL environment variable

## Type Safety

All code is fully typed with TypeScript:
- ButtonDefinition, ButtonAction, SessionId from @afw/shared
- UseButtonActionsResult interface for return type
- Proper error typing with response.json() handling
- Exhaustive switch statement with never type for unknown action types

## Performance Considerations

- useCallback memoization prevents unnecessary re-renders
- Separate action handler functions avoid closure overhead
- trackUsage errors are non-blocking (don't await in finally)
- Compatible with React 18.2 concurrent features

## Future Enhancements

1. **Navigation Integration:**
   - Add React Router integration when routing is implemented
   - Currently logs navigation targets

2. **Custom Handler Support:**
   - Register custom action handlers from behavior packs
   - Map custom action types to handler functions

3. **Action History:**
   - Track executed actions in state
   - Provide undo/redo capabilities

4. **Timeout Handling:**
   - Add configurable timeout for long-running actions
   - Display timeout errors appropriately

## Learnings

**Issue:** None - execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

[FRESH EYE] The hook design follows the existing pattern from useSessionControls.ts very closely, which is good for consistency. The separation of action handlers into individual functions makes the code more testable and maintainable. The cascading use of fetch() for multiple action types creates a good pattern for future action types.
