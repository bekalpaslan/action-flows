/**
 * useWebVitals Hook
 *
 * Captures Core Web Vitals metrics automatically and exposes them as React state.
 * Metrics are captured once per page load and update as they become available.
 */

import { useState, useEffect } from 'react';
import { onCLS, onFID, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Core Web Vitals data structure
 */
export interface WebVitals {
  /** Cumulative Layout Shift (target: < 0.1) */
  CLS?: number;
  /** First Input Delay in ms (target: < 100ms) */
  FID?: number;
  /** Largest Contentful Paint in ms (target: < 2500ms) */
  LCP?: number;
  /** Time to First Byte in ms (target: < 800ms) */
  TTFB?: number;
}

/**
 * Hook: Capture Core Web Vitals
 *
 * Automatically subscribes to web-vitals library and updates state
 * as each metric becomes available.
 *
 * @returns Object with CLS, FID, LCP, TTFB values (undefined until measured)
 *
 * @example
 * ```tsx
 * function PerformanceMonitor() {
 *   const vitals = useWebVitals();
 *   return (
 *     <div>
 *       <p>LCP: {vitals.LCP ? `${vitals.LCP}ms` : 'Measuring...'}</p>
 *       <p>CLS: {vitals.CLS ?? 'Measuring...'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWebVitals(): WebVitals {
  const [vitals, setVitals] = useState<WebVitals>({});

  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      setVitals((prev) => ({
        ...prev,
        [metric.name]: metric.value,
      }));
    };

    onCLS(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }, []);

  return vitals;
}
