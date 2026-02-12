# Bundle Optimization Quick Start

## Installation

```bash
cd packages/app
pnpm install
```

This installs `react-window` and TypeScript definitions needed for virtual scrolling.

## Build & Verify

```bash
pnpm build
```

Check the bundle size in `dist/chunks/`:
- Total should be ~2MB (was 11.6MB)
- Look for lazy chunks: `monaco-editor-*.js`, `cosmic-map-*.js`, `flow-viz-*.js`

## Using Lazy Components

Replace heavy component imports with lazy wrappers:

### Before
```tsx
import CosmicMap from './components/CosmicMap/CosmicMap';

export function Dashboard() {
  return <CosmicMap />;
}
```

### After
```tsx
import { Suspense } from 'react';
import LazyCosmicMap from './components/LazyCosmicMap';
import LoadingSpinner from './components/common/LoadingSpinner';

export function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyCosmicMap />
    </Suspense>
  );
}
```

## Lazy Components Available

```tsx
import LazyCosmicMap from './components/LazyCosmicMap';
import LazyFlowVisualization from './components/LazyFlowVisualization';
import LazyCodeEditor from './components/LazyCodeEditor';
import LazyTerminal from './components/LazyTerminal';
```

## Virtual Scrolling

For lists with many items, use virtual scrolling:

### VirtualSessionList
```tsx
import VirtualSessionList from './components/VirtualScrolling/VirtualSessionList';

<VirtualSessionList
  items={sessions}
  itemHeight={48}
  maxHeight={500}
  renderItem={(session) => <SessionItem session={session} />}
/>
```

### VirtualFileTree
```tsx
import VirtualFileTree from './components/VirtualScrolling/VirtualFileTree';

<VirtualFileTree
  tree={fileTree}
  onFileSelect={handleSelect}
  onFileOpen={handleOpen}
/>
```

### VirtualChatHistory
```tsx
import VirtualChatHistory from './components/VirtualScrolling/VirtualChatHistory';

<VirtualChatHistory
  messages={messages}
  renderMessage={(msg) => <MessageBubble message={msg} />}
/>
```

## Performance Monitoring

```typescript
import { logBundleMetrics, getWebVitalsMetrics } from './utils/bundleAnalyzer';

// Log bundle metrics
logBundleMetrics();

// Get Web Vitals
getWebVitalsMetrics().then(metrics => {
  console.log('FCP:', metrics.fcp);
  console.log('LCP:', metrics.lcp);
});
```

## Service Worker (Automatic)

Service worker is automatically registered in `App.tsx`. It provides:
- Offline caching
- Faster repeat visits (50-80%)
- Background update checks

To manually clear cache:
```typescript
import { useClearCache } from './hooks/useServiceWorker';

const clearCache = useClearCache();
await clearCache();
```

## Troubleshooting

### Lazy component not loading?
- Check that Suspense boundary is in place
- Verify LoadingSpinner is imported
- Check DevTools Network tab for chunk loading

### Virtual list not scrolling?
- Ensure `itemHeight` is accurate
- Check that `maxHeight` is set
- Verify items array is properly typed

### Bundle not getting smaller?
- Run `pnpm build` with clean dist/
- Check vite.config.ts has manual chunks defined
- Verify Monaco Editor is in separate chunk

## Files to Know

**Configuration:**
- `vite.config.ts` - Code splitting setup

**Components:**
- `src/components/Lazy*.tsx` - Lazy loading wrappers
- `src/components/VirtualScrolling/*` - Virtual list components
- `src/components/common/LoadingSpinner.tsx` - Loading UI

**Hooks:**
- `src/hooks/useServiceWorker.ts` - Service worker management

**Utils:**
- `src/utils/bundleAnalyzer.ts` - Performance metrics

**Service Worker:**
- `public/sw.js` - Offline caching logic

**Documentation:**
- `BUNDLE_OPTIMIZATION.md` - Detailed guide
- `OPTIMIZATION_CHECKLIST.md` - Testing checklist

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial FCP | <1s |
| Total LCP | <1.5s |
| Time to Interactive | <1.5s |
| Cumulative Layout Shift | <0.1 |

## Common Issues

**Q: Service worker not working offline?**
A: Must use HTTPS in production. Localhost works for development.

**Q: Virtual list feels jerky?**
A: Adjust `itemHeight` or `overscanCount` in the component.

**Q: Lazy component takes too long to load?**
A: Preload with `preloadCommonLanguageWorkers()` for Monaco.

**Q: Cache getting stale?**
A: Clear with `useClearCache()` or update CACHE_VERSION in sw.js.

## Next Steps

1. Run `pnpm install && pnpm build`
2. Verify bundle size reduction
3. Update component imports per guide above
4. Test lazy loading with DevTools Network tab
5. Monitor metrics with `logBundleMetrics()`
6. Replace lists with virtual scrolling for performance

## Resources

- Full guide: See `BUNDLE_OPTIMIZATION.md`
- Integration steps: See `../../docs/status/deliveries/bundle-optimization-summary.md`
- Testing checklist: See `OPTIMIZATION_CHECKLIST.md`
- React docs: https://react.dev/reference/react/lazy
- react-window: https://react-window.vercel.app/
- Web Vitals: https://web.dev/vitals/

---

**Quick links:**
- [LazyCosmicMap](./src/components/LazyCosmicMap.tsx)
- [VirtualSessionList](./src/components/VirtualScrolling/VirtualSessionList.tsx)
- [useServiceWorker](./src/hooks/useServiceWorker.ts)
- [bundleAnalyzer](./src/utils/bundleAnalyzer.ts)
