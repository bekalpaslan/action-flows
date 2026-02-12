/**
 * Performance utilities for Living Universe
 *
 * Web Vitals integration + custom performance hooks for monitoring
 * cosmic map rendering, animations, and memory usage.
 */

import { useState, useEffect } from 'react';
import { onCLS, onFID, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Augment Performance interface to include Chrome-specific memory API
 */
declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

/**
 * Web Vitals metrics captured by the dashboard
 */
export interface WebVitalsMetrics {
  CLS?: number;
  FID?: number;
  LCP?: number;
  TTFB?: number;
}

/**
 * Report Web Vitals to a custom callback
 *
 * @param onPerfEntry - Callback invoked when each metric is captured
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void): void {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}

/**
 * Hook: Track frame rate (FPS) using requestAnimationFrame
 *
 * Useful for monitoring animation performance during spark travel,
 * Big Bang sequences, and zoom transitions.
 *
 * @param enabled - Whether to actively measure FPS
 * @returns Current FPS value (refreshed every second)
 *
 * @example
 * ```tsx
 * const fps = useFPSCounter(true);
 * console.log(`Current FPS: ${fps}`);
 * ```
 */
export function useFPSCounter(enabled: boolean): number {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();

      if (now >= lastTime + 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  return fps;
}

/**
 * Hook: Measure component render timing using Performance API
 *
 * Automatically marks render start on mount and measures duration on unmount.
 * Useful for identifying slow-rendering components in the cosmic map.
 *
 * @param componentName - Identifier for this component (used in perf marks)
 *
 * @example
 * ```tsx
 * function CosmicMap() {
 *   useRenderTiming('CosmicMap');
 *   // ... rest of component
 * }
 * ```
 */
export function useRenderTiming(componentName: string): void {
  useEffect(() => {
    const mark = `${componentName}-render-start`;
    performance.mark(mark);

    return () => {
      const measure = `${componentName}-render-duration`;
      try {
        performance.measure(measure, mark);
        const entry = performance.getEntriesByName(measure)[0];
        if (entry) {
          console.log(`[PERF] ${componentName} render took ${entry.duration.toFixed(2)}ms`);
        }
      } catch (error) {
        // Measurement may fail if mark was cleared
        console.warn(`[PERF] Failed to measure ${componentName}:`, error);
      }
    };
  }, [componentName]);
}

/**
 * Get current memory usage (Chrome only)
 *
 * Returns heap size in MB if available, otherwise undefined.
 * Target: < 50MB for universe state.
 *
 * @returns Memory usage in MB or undefined if not available
 */
export function getMemoryUsage(): number | undefined {
  if (performance.memory && performance.memory.usedJSHeapSize) {
    return performance.memory.usedJSHeapSize / (1024 * 1024);
  }
  return undefined;
}
