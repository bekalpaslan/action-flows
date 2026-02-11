# Performance Baseline Report — Phase 7 Batch A

**Date:** 2026-02-12
**Environment:** Development build (localhost:5173)
**Browser:** Chrome 120+ (or latest)
**Hardware:** [To be filled during manual testing]

---

## Metrics Captured

### 1. CosmicMap Initial Render
**Target:** < 16ms (60fps)
**Actual:** [TBD — measure with Chrome DevTools Performance tab]
**Method:** performance.mark() + performance.measure() in CosmicMap.tsx

**Steps to measure:**
1. Open Chrome DevTools → Performance tab
2. Start recording
3. Reload page
4. Stop recording after cosmic map visible
5. Find "CosmicMap-render-duration" in flame chart or console output

**Status:** ⏳ Pending manual measurement

---

### 2. Zoom Transition Duration
**Target:** < 400ms
**Actual:** [TBD]
**Method:** Timestamp onZoomStart → onZoomComplete in RegionFocusView

**Steps to measure:**
1. Open DevTools Console
2. Click any region star
3. Note console log: "Zoom transition took Xms"

**Status:** ⏳ Pending manual measurement

---

### 3. Spark Animation FPS
**Target:** 60fps sustained
**Actual:** [TBD]
**Method:** useFPSCounter() hook in SparkAnimation.tsx (dev mode only)

**Steps to measure:**
1. Enable FPS counter in Settings → Performance
2. Send message to trigger chain execution
3. Observe FPS during spark travel animation
4. Note minimum FPS value in console (dev mode logs)

**Status:** ⏳ Pending manual measurement

---

### 4. Memory Overhead
**Target:** < 50MB
**Actual:** [TBD]
**Method:** Chrome DevTools Memory tab heap snapshots

**Steps to measure:**
1. Open DevTools → Memory tab
2. Take heap snapshot before cosmic map loads
3. Take heap snapshot after cosmic map fully loaded
4. Compare heap size difference

**Status:** ⏳ Pending manual measurement

---

### 5. Big Bang Animation FPS
**Target:** Smooth (minimum 30fps)
**Actual:** [TBD]
**Method:** RAF callback timing in BigBangAnimation.tsx

**Steps to measure:**
1. Clear localStorage to trigger Big Bang on next visit
2. Open DevTools Performance tab
3. Record while Big Bang plays (3 seconds)
4. Analyze frame rate in timeline

**Status:** ⏳ Pending manual measurement

---

## Web Vitals

### CLS (Cumulative Layout Shift)
**Target:** < 0.1
**Actual:** [Auto-captured in Settings → Performance]
**Status:** ✅ Automated

### FID (First Input Delay)
**Target:** < 100ms
**Actual:** [Auto-captured in Settings → Performance]
**Status:** ✅ Automated

### LCP (Largest Contentful Paint)
**Target:** < 2.5s
**Actual:** [Auto-captured in Settings → Performance]
**Status:** ✅ Automated

### TTFB (Time to First Byte)
**Target:** < 800ms
**Actual:** [Auto-captured in Settings → Performance]
**Status:** ✅ Automated

---

## How to Use This Document

### For Developers
1. Install dependencies: `pnpm install` (web-vitals now included)
2. Run dev server: `pnpm dev:app`
3. Navigate to Settings → Performance tab
4. Web Vitals display automatically
5. Enable FPS counter to monitor animation performance
6. Follow manual measurement steps above for custom metrics

### For QA / Testing
1. Load the app in Chrome with DevTools open
2. Complete each "Steps to measure" section
3. Record actual values in [TBD] placeholders
4. Report any metrics that fail targets

### Baseline vs Optimization
- **This is Phase 7 Batch A:** Measurement infrastructure only
- **Actual optimization:** Phase 7 Batch B+ (after baseline captured)
- If metrics fail targets → surface in Batch A learnings → queue optimization work

---

## Next Steps

1. **Manual testing:** Fill in [TBD] metrics via Chrome DevTools
2. **Automated capture:** Web Vitals are already instrumented in PerformanceSettings.tsx
3. **Optimization:** If any metric fails target, investigate bottlenecks in Phase 7 Batch B+

---

**Note:** This is a BASELINE report. Optimization work will happen after metrics are captured.
