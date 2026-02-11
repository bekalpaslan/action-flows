# Living Universe Developer Guide

This guide covers customization, extension, and troubleshooting for developers working with the Living Universe visualization layer.

---

## Architecture Overview

### Component Hierarchy
```
CosmicMap (ReactFlowProvider)
├── CosmicBackground (Canvas stars)
├── ReactFlow (Region nodes + Light bridge edges)
│   ├── RegionStar (Custom node type)
│   ├── LightBridgeEdge (Custom edge type)
│   └── SparkAnimation (SVG overlay)
├── LiveRegion (Screen reader announcements)
├── CommandCenter (Bottom input bar)
└── UniverseOnboarding (First-run tooltips)
```

### Data Flow
```
Backend Universe API
  ↓
UniverseContext (React Context)
  ↓
CosmicMap (Transform to ReactFlow format)
  ↓
ReactFlow (Render nodes/edges)
```

---

## Adding a New Region

### 1. Update Universe Graph Schema
**File:** `packages/shared/src/livingUniverse/types.ts`

```typescript
export interface RegionNode {
  id: string;
  workbenchId: WorkbenchId; // Add new ID to union
  label: string;
  layer: UniverseLayer;
  position: { x: number; y: number };
  fogState: FogState;
  glowIntensity: number;
  status: RegionStatus;
  colorShift?: number;
  health?: number;
}
```

### 2. Add to Backend Initialization
**File:** `packages/backend/src/storage/universeStorage.ts`

```typescript
const newRegion: RegionNode = {
  id: 'region-new-feature',
  workbenchId: 'new-feature' as WorkbenchId,
  label: 'New Feature',
  layer: 'experience', // Choose layer
  position: { x: 400, y: 200 }, // Position in cosmic map
  fogState: 'visible', // or 'faint' to hide initially
  glowIntensity: 0.8,
  status: 'active',
};

universe.regions.push(newRegion);
```

### 3. Create Light Bridges (Connections)
**File:** Same as above

```typescript
const bridge: LightBridge = {
  id: 'bridge-work-to-new-feature',
  source: 'region-work',
  target: 'region-new-feature',
  gates: [], // Evolution gates (optional)
  strength: 0.7, // Visual opacity
  traversalCount: 0,
};

universe.bridges.push(bridge);
```

### 4. Wire to Workbench Component
**File:** `packages/app/src/components/WorkbenchLayout.tsx`

Map the `workbenchId` to your component:
```typescript
const workbenchComponents: Record<WorkbenchId, React.ComponentType> = {
  // ... existing
  'new-feature': NewFeatureWorkbench,
};
```

---

## Customizing Region Appearance

### Region Colors by Layer
**File:** `packages/app/src/styles/cosmic-tokens.css`

```css
:root {
  --layer-platform: #ff6b6b;
  --layer-template: #ffd93d;
  --layer-philosophy: #6bcb77;
  --layer-physics: #4d96ff;
  --layer-experience: #9b59b6;
}
```

### Region Star Custom Styles
**File:** `packages/app/src/components/CosmicMap/RegionStar.tsx`

Add custom logic based on `data.workbenchId`:
```typescript
const getRegionColor = (data: RegionStarData) => {
  if (data.workbenchId === 'new-feature') {
    return '#custom-color';
  }
  // Fall back to layer color
  return layerColors[data.layer];
};
```

### Glow Intensity
Control the region's glow via `glowIntensity` (0-1):
```typescript
region.glowIntensity = 1.0; // Maximum glow
```

CSS applies this via `filter: drop-shadow()`.

---

## Adjusting Evolution Speed

### Evolution Gates
**File:** Backend universe initialization

```typescript
const bridge: LightBridge = {
  // ... other fields
  gates: [
    {
      condition: 'session_count >= 5', // Custom condition
      unlocks: 'region-advanced-features',
    },
  ],
};
```

### Evolution Detector
**File:** `packages/backend/src/services/evolutionDetector.ts`

Implement custom evolution logic:
```typescript
export function checkEvolutionConditions(
  universe: UniverseGraph,
  context: { sessionCount: number; /* ... */ }
): RegionNode[] {
  const newlyUnlocked: RegionNode[] = [];

  // Custom logic: unlock after 5 sessions
  if (context.sessionCount >= 5) {
    const region = universe.regions.find((r) => r.id === 'region-advanced');
    if (region && region.fogState === 'faint') {
      region.fogState = 'visible';
      region.glowIntensity = 1.0;
      newlyUnlocked.push(region);
    }
  }

  return newlyUnlocked;
}
```

---

## Disabling Feature Flags Programmatically

### Disable Cosmic Map for Specific Users
**File:** `packages/app/src/hooks/useFeatureFlag.ts`

Add conditional logic:
```typescript
export function useFeatureFlagSimple(flag: FeatureFlagName): boolean {
  const [value, setValue] = useState(() => {
    // Override for specific users
    const userId = getCurrentUserId();
    if (userId === 'user-admin' && flag === 'COSMIC_MAP_ENABLED') {
      return false; // Force classic mode
    }

    return getFeatureFlag(flag);
  });

  // ... rest of hook
}
```

### Set Defaults in Backend
**File:** `packages/backend/src/services/featureFlagService.ts`

```typescript
const DEFAULT_FLAGS: Record<FeatureFlagName, boolean> = {
  COSMIC_MAP_ENABLED: process.env.COSMIC_MAP_DEFAULT === 'true',
  // ... other flags
};
```

---

## Performance Troubleshooting

### Reduce ReactFlow Re-renders
**File:** `packages/app/src/components/CosmicMap/CosmicMap.tsx`

Use `useMemo` for nodes/edges:
```typescript
const nodes = useMemo(() => transformRegionsToNodes(universe), [universe]);
const edges = useMemo(() => transformBridgesToEdges(universe), [universe]);
```

### Disable Spark Animations
**File:** User can toggle via Feature Flags, or hardcode:
```typescript
const sparkAnimationEnabled = false; // Disable unconditionally
```

### Optimize Canvas Rendering
**File:** `packages/app/src/components/CosmicMap/CosmicBackground.tsx`

Reduce star count:
```typescript
const STAR_COUNT = 50; // Default is 200
```

### Monitor Web Vitals
**File:** `packages/app/src/hooks/useWebVitals.ts`

Metrics are captured automatically. View in **Settings → Performance**.

---

## E2E Testing

### Running Cosmic Map Tests
```bash
# Run all cosmic map tests
pnpm test:e2e:cosmic

# Run with UI (debugging)
pnpm test:pw:ui -- cosmic-map

# Run in headed mode
pnpm test:pw:headed -- cosmic-map
```

### Test File Structure
```
test/e2e/
├── cosmic-map-navigation.test.ts   # Big Bang, zoom, onboarding
└── cosmic-map-interactions.test.ts # Keyboard, flags, settings
```

### Test Stabilization Techniques
**See:** `docs/testing/E2E_COSMIC_MAP.md`

Key practices:
- Use `waitForSelector` with timeouts
- Check visibility with `.isVisible({ timeout })` + `.catch(() => false)`
- Disable animations via `emulateMedia: { reducedMotion: 'reduce' }`
- Retry flaky steps (Playwright auto-retries on failure)

---

## Common Development Tasks

### Add a New Onboarding Step
**File:** `packages/app/src/components/Onboarding/UniverseOnboarding.tsx`

```typescript
const ONBOARDING_STEPS: TooltipStep[] = [
  // ... existing steps
  {
    id: 'new-step',
    target: '.new-feature-selector',
    title: 'New Feature',
    content: 'Description of new feature',
    position: 'bottom',
  },
];
```

### Change Zoom Transition Duration
**File:** `packages/app/src/components/CosmicMap/CosmicMap.tsx`

```typescript
setCenter(targetNode.position.x, targetNode.position.y, {
  zoom: 1.5,
  duration: 600, // Increase from 300ms
});
```

### Debug WebSocket Events
**File:** Browser console

```javascript
// Enable debug mode
localStorage.setItem('afw-debug', 'true');

// Watch for spark events
window.addEventListener('message', (e) => {
  if (e.data.type === 'SPARK_TRAVELING') {
    console.log('Spark event:', e.data);
  }
});
```

---

## API Reference

### Universe Graph Endpoints
```
GET  /api/universe         — Fetch full universe graph
POST /api/universe/evolve  — Trigger evolution check
GET  /api/universe/metrics — Health metrics
```

### WebSocket Events
```
UNIVERSE_UPDATED    — Universe graph changed
SPARK_TRAVELING     — Data flow visualization
REGION_DISCOVERED   — New region unlocked
```

---

## Troubleshooting

### TypeScript Errors After Adding Region
1. Rebuild shared package: `pnpm -F @afw/shared build`
2. Restart dev server: `pnpm dev:app`
3. Clear TypeScript cache: `rm -rf node_modules/.cache`

### Region Not Appearing
1. Check `fogState` is `'visible'`
2. Verify `position` is within viewport bounds
3. Inspect ReactFlow nodes in React DevTools
4. Check console for universe fetch errors

### Light Bridge Not Rendering
1. Verify `source` and `target` IDs match region IDs exactly
2. Check `strength > 0`
3. Inspect ReactFlow edges in React DevTools

### Evolution Not Triggering
1. Check evolution gates are defined
2. Verify `evolutionDetector.ts` logic
3. Enable debug logs: `localStorage.setItem('afw-debug', 'true')`
4. Check WebSocket connection for `UNIVERSE_UPDATED` events

---

## Next Steps

- Read [User Migration Guide](./USER_MIGRATION_GUIDE.md)
- See [E2E Testing Guide](../testing/E2E_COSMIC_MAP.md)
- Review [Rollout Strategy](./ROLLOUT_STRATEGY.md)
