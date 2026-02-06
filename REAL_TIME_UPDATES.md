# Real-Time Step Status Updates in DAG Visualization

This document describes the implementation of real-time step status updates in the ActionFlows Dashboard chain visualization.

## Overview

The implementation provides real-time status updates for execution steps in the DAG (Directed Acyclic Graph) visualization. Steps transition through statuses (pending → in_progress → completed/failed) with smooth animations and visual feedback.

## Architecture

### Components

#### 1. **useChainState Hook** (`src/hooks/useChainState.ts`)

Manages the complete chain state and provides methods to update individual steps.

**Key Features:**
- Maintains immutable chain state using React hooks
- Updates single steps without re-rendering the entire chain
- Recalculates chain statistics (successfulSteps, failedSteps, etc.) on updates
- Updates overall chain status based on step statuses

**API:**

```typescript
const { chain, updateStep, setChain } = useChainState();

// Update a single step
updateStep(1, {
  status: 'in_progress',
  startedAt: timestamp,
  duration: 1000,
});

// Set entire chain
setChain(newChain);
```

#### 2. **useChainEvents Hook** (`src/hooks/useChainEvents.ts`)

Connects WebSocket events to chain state updates via callbacks.

**Key Features:**
- Listens for step lifecycle events (spawned, completed, failed, skipped)
- Filters events by session ID and type
- Provides callbacks for each event type
- Includes event summary hook for monitoring

**API:**

```typescript
const { chain, updateStep } = useChainState();

// Connect events to state updates
useChainEvents(
  sessionId,
  (stepNumber) => {
    // Step spawned - set to in_progress
    updateStep(stepNumber, { status: 'in_progress' });
  },
  (stepNumber, duration) => {
    // Step completed - set final status
    updateStep(stepNumber, { status: 'completed', duration });
  },
  (stepNumber, error) => {
    // Step failed - record error
    updateStep(stepNumber, { status: 'failed', error });
  },
  (stepNumber) => {
    // Step skipped
    updateStep(stepNumber, { status: 'skipped' });
  }
);
```

#### 3. **ChainDAG Component Updates** (`src/components/ChainDAG/ChainDAG.tsx`)

Enhanced to support real-time updates via callback prop.

**New Props:**
- `onStepUpdate?: (stepNumber: number, updates: any) => void` - Called when a step needs to be updated

#### 4. **StepNode Component** (`src/components/ChainDAG/StepNode.tsx`)

Enhanced with animations for status transitions.

**Features:**
- Fade-in animation when transitioning to in_progress or completed
- Pulsing animation for in_progress nodes
- Duration display when step completes
- Error indicator for failed steps

#### 5. **CSS Animations** (`src/components/ChainDAG/ChainDAG.css`)

Enhanced with smooth transitions and animations.

**New Keyframes:**
- `pulse-glow` - Expanding glow pulse for in-progress nodes
- `fadeIn` - Smooth fade and scale animation
- Smooth color transitions (0.3s ease) for status color changes

#### 6. **ChainLiveMonitor Component** (`src/components/ChainLiveMonitor.tsx`)

Complete integration of state management and event handling.

**Features:**
- Uses useChainState for state management
- Uses useChainEvents for event listening
- Displays event statistics
- Shows real-time status updates in ChainDAG
- Ready to connect to WebSocket backend

#### 7. **ChainDemo Component** (`src/components/ChainDemo.tsx`)

Interactive demo for testing status updates without a backend.

**Features:**
- Automated scenario runner
- Manual step controls (spawn, complete, fail, skip)
- Real-time visualization updates
- Useful for UI testing and demonstration

## Implementation Flow

### 1. Event Flow

```
Backend Event (WebSocket)
      ↓
useChainEvents (listens)
      ↓
Callback triggered
      ↓
updateStep called
      ↓
Chain state updated
      ↓
ChainDAG re-renders
      ↓
Animations triggered
```

### 2. State Update Flow

```
updateStep(stepNumber, updates)
      ↓
Find step in chain
      ↓
Merge updates with existing step
      ↓
Recalculate chain statistics
      ↓
Update overall chain status
      ↓
Return new chain object
      ↓
React triggers re-render
```

### 3. Animation Flow

```
Status changes (pending → in_progress)
      ↓
CSS class updates (.step-node.status-in_progress)
      ↓
Transition animations begin (0.3s ease)
      ↓
Keyframe animations play (pulse-glow, pulse-border)
      ↓
User sees smooth, visual feedback
```

## Usage Examples

### Basic Integration

```tsx
import { useChainState, useChainEvents } from './hooks';
import { ChainDAG } from './components/ChainDAG';

function MyComponent({ sessionId, chain }) {
  const { chain: chainState, updateStep, setChain } = useChainState();

  // Initialize chain
  useEffect(() => {
    setChain(chain);
  }, [chain]);

  // Listen for events and update state
  useChainEvents(
    sessionId,
    (stepNumber) => updateStep(stepNumber, { status: 'in_progress' }),
    (stepNumber, duration) => updateStep(stepNumber, { status: 'completed', duration }),
    (stepNumber, error) => updateStep(stepNumber, { status: 'failed', error }),
    (stepNumber) => updateStep(stepNumber, { status: 'skipped' })
  );

  return <ChainDAG chain={chainState} />;
}
```

### Using ChainLiveMonitor (Recommended)

```tsx
import { ChainLiveMonitor } from './components/ChainLiveMonitor';
import { sampleChain } from './data/sampleChain';

function Dashboard() {
  return (
    <ChainLiveMonitor
      sessionId="session-123"
      initialChain={sampleChain}
    />
  );
}
```

### Testing with ChainDemo

```tsx
import { ChainDemo } from './components/ChainDemo';

function TestPage() {
  return <ChainDemo />;
}
```

## Event Formats

### Step Spawned Event
```typescript
{
  type: 'step_spawned',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    action: string,
  },
  timestamp: string,
}
```

### Step Completed Event
```typescript
{
  type: 'step_completed',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    duration: number, // milliseconds
    result?: any,
  },
  timestamp: string,
}
```

### Step Failed Event
```typescript
{
  type: 'step_failed',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    error: string,
    message?: string,
  },
  timestamp: string,
}
```

### Step Skipped Event
```typescript
{
  type: 'step_skipped',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    reason?: string,
  },
  timestamp: string,
}
```

## Animation Details

### Status Transitions

1. **Pending → In Progress**
   - Color: gray → yellow
   - Animation: fadeIn (0.3s) + pulse-glow (1.5s loop)
   - Border: pulse effect every 2s

2. **In Progress → Completed**
   - Color: yellow → green
   - Animation: fadeIn (0.3s)
   - Shows duration badge

3. **In Progress → Failed**
   - Color: yellow → red
   - Animation: fadeIn (0.3s)
   - Shows error badge

4. **Any → Skipped**
   - Color: → gray with reduced opacity
   - Animation: fadeIn (0.3s)

### Animation Classes

- `.step-node.fade-in` - Smooth entry animation
- `.step-node.status-in_progress` - Pulsing glow effect
- `.step-node.status-completed` - Green success state
- `.step-node.status-failed` - Red error state
- `.step-node.status-skipped` - Grayed out state

## Performance Considerations

1. **Immutable Updates**: Chain state is updated immutably, allowing React to efficiently determine what changed

2. **Selective Re-renders**: Only the affected step node re-renders, not the entire DAG

3. **Event Batching**: Multiple events can be processed in sequence without blocking the UI

4. **CSS Animations**: Hardware-accelerated animations (transform, opacity) for smooth performance

5. **Memoization**: Computed values (parallel groups, layout) are memoized to prevent unnecessary recalculation

## File Structure

```
packages/app/src/
├── hooks/
│   ├── useChainState.ts          # State management hook
│   ├── useChainEvents.ts         # Event listening hook
│   └── index.ts                  # Re-exports
├── components/
│   ├── ChainDAG/
│   │   ├── ChainDAG.tsx          # Updated with status support
│   │   ├── StepNode.tsx          # Updated with animations
│   │   └── ChainDAG.css          # Enhanced animations
│   ├── ChainDemo.tsx             # Interactive demo
│   ├── ChainLiveMonitor.tsx      # Full integration example
│   └── ...
└── styles/
    ├── ChainDemo.css             # Demo styling
    └── ChainLiveMonitor.css      # Monitor styling
```

## Testing

### Unit Tests

Test individual hooks and components:

```typescript
// Test useChainState
test('updateStep updates single step correctly', () => {
  const { result } = renderHook(() => useChainState());
  act(() => result.current.setChain(sampleChain));

  act(() => {
    result.current.updateStep(1, { status: 'in_progress' });
  });

  expect(result.current.chain?.steps[0].status).toBe('in_progress');
});
```

### Integration Tests

Test the full flow with ChainDemo:

1. Click "Run Full Scenario" button
2. Observe steps transitioning through statuses
3. Verify animations play smoothly
4. Check that stats update correctly

### Manual Testing

Use ChainDemo component to test:
- Individual step status transitions
- Animation smoothness
- Color transitions
- Duration display
- Error display
- Skip status

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- Internet Explorer: Not supported (uses modern CSS and ES6+)

## Future Enhancements

1. **Event Recording**: Replay step transitions to debug issues
2. **Timeline View**: Show step execution timeline with durations
3. **Parallel Group Visualization**: Highlight parallel execution visually
4. **Step Metrics**: Display resource usage, execution time percentiles
5. **Failure Analysis**: Detailed error messages and stack traces
6. **Performance Profiling**: Track rendering performance metrics
7. **Custom Animations**: Allow theme customization for animations
8. **Step Dependencies**: Visual indication of dependency blocking

## Troubleshooting

### Status not updating

1. Check that WebSocket events are being received
2. Verify session ID matches between event and listener
3. Ensure useChainEvents callbacks are properly implemented
4. Check browser console for errors

### Animations not smooth

1. Verify CSS transitions are applied
2. Check for JavaScript errors blocking animations
3. Reduce other page animations that might compete
4. Profile in DevTools to check frame rate

### Chain state not syncing

1. Ensure chain is initialized with setChain
2. Verify updateStep is called with correct stepNumber
3. Check that step updates are valid according to ChainStep type
4. Review browser console for type errors

## References

- React Flow documentation: https://reactflow.dev
- CSS Animations: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations
- ActionFlows data types: See `@afw/shared` package
