# Quick Start: Real-Time Status Updates

Get real-time chain visualization running in 5 minutes.

## 1. Import the Components

```tsx
import { ChainLiveMonitor } from './components/ChainLiveMonitor';
// OR for testing without backend:
import { ChainDemo } from './components/ChainDemo';
```

## 2. Option A: Use ChainLiveMonitor (Production)

```tsx
import { ChainLiveMonitor } from './components/ChainLiveMonitor';
import { sampleChain } from './data/sampleChain';

function Dashboard() {
  const sessionId = 'session-123'; // From your backend

  return (
    <div style={{ height: '100vh' }}>
      <ChainLiveMonitor
        sessionId={sessionId}
        initialChain={sampleChain}
      />
    </div>
  );
}

export default Dashboard;
```

**What it does:**
- Automatically connects to WebSocket events for the session
- Listens for step_spawned, step_completed, step_failed, step_skipped events
- Updates the DAG visualization in real-time
- Shows event statistics in the header

## 3. Option B: Use ChainDemo (Testing)

```tsx
import { ChainDemo } from './components/ChainDemo';

function TestPage() {
  return (
    <div style={{ height: '100vh' }}>
      <ChainDemo />
    </div>
  );
}

export default TestPage;
```

**What it does:**
- No backend required
- Interactive buttons to simulate step transitions
- Automated scenario runner for testing
- Perfect for UI testing and demonstrations

## 4. Verify WebSocket Connection

For ChainLiveMonitor to work, ensure:

1. WebSocket endpoint is running on `ws://localhost:3001/ws`
2. Backend sends events in the correct format
3. Session ID matches between client and backend

Example event:
```json
{
  "type": "step_completed",
  "sessionId": "session-123",
  "data": {
    "stepNumber": 1,
    "duration": 30000
  },
  "timestamp": "2026-02-06T10:35:30Z"
}
```

## 5. Customize (Optional)

### Add Custom Styling

```css
/* Override default colors */
.step-node.status-in_progress {
  background-color: #e8f5e9; /* Your color */
}
```

### Handle Step Updates Manually

```tsx
const { chain, updateStep, setChain } = useChainState();

// Manually update a step
updateStep(1, {
  status: 'completed',
  duration: 5000,
});
```

### Monitor Events

```tsx
const eventSummary = useChainEventSummary(sessionId);

console.log('Last event:', eventSummary.lastEventType);
console.log('Total events:', eventSummary.totalEvents);
```

## Common Tasks

### Update a Step Status

```tsx
const { updateStep } = useChainState();

// Step started
updateStep(stepNum, {
  status: 'in_progress',
  startedAt: new Date().toISOString(),
});

// Step completed
updateStep(stepNum, {
  status: 'completed',
  duration: 5000,
  completedAt: new Date().toISOString(),
});

// Step failed
updateStep(stepNum, {
  status: 'failed',
  error: 'Timeout exceeded',
});
```

### Initialize with a Chain

```tsx
const { setChain } = useChainState();

setChain({
  id: 'chain-123',
  title: 'My Chain',
  steps: [
    { stepNumber: 1, action: 'code', model: 'haiku', status: 'pending', ... },
    { stepNumber: 2, action: 'review', model: 'sonnet', status: 'pending', ... },
  ],
  // ... other chain properties
});
```

### Listen to Specific Events

```tsx
useChainEvents(
  sessionId,
  (stepNumber) => {
    console.log(`Step ${stepNumber} started`);
  },
  (stepNumber, duration) => {
    console.log(`Step ${stepNumber} completed in ${duration}ms`);
  },
);
```

## Keyboard Shortcuts (ChainDemo)

- Click "Run Full Scenario" to run automated test
- Click individual step buttons to manually control status
- Use "Reset" to return to initial state

## File Locations

| File | Purpose |
|------|---------|
| `src/hooks/useChainState.ts` | State management hook |
| `src/hooks/useChainEvents.ts` | Event listening hook |
| `src/components/ChainLiveMonitor.tsx` | Production component |
| `src/components/ChainDemo.tsx` | Testing component |
| `src/components/ChainDAG/ChainDAG.tsx` | Main visualization |
| `src/components/ChainDAG/StepNode.tsx` | Step node renderer |
| `src/components/ChainDAG/ChainDAG.css` | Animations and styling |
| `REAL_TIME_UPDATES.md` | Full documentation |

## Troubleshooting

**Visualization not updating?**
- Check WebSocket connection in browser DevTools
- Verify event format matches expected schema
- Ensure session IDs match

**Animations choppy?**
- Close other tabs to free up resources
- Check DevTools Performance tab
- Verify GPU acceleration is enabled

**React warnings about key/state?**
- Ensure chain state is initialized with setChain before updating
- Check that step numbers are unique

## Next Steps

1. Read `REAL_TIME_UPDATES.md` for detailed documentation
2. Explore ChainDemo component for more examples
3. Integrate with your backend WebSocket API
4. Customize styling and animations as needed

## Support

For questions or issues:
1. Check the full documentation: `REAL_TIME_UPDATES.md`
2. Review example components: `ChainDemo.tsx`, `ChainLiveMonitor.tsx`
3. Test with ChainDemo to isolate issues
4. Check browser console for detailed error messages
