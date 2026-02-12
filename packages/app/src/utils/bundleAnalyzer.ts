/**
 * Bundle Analyzer Utilities
 * Tools for monitoring bundle size and performance metrics
 */

export interface BundleMetrics {
  timestamp: number;
  totalSize: number;
  chunkSizes: Record<string, number>;
  gzipSize?: number;
}

/**
 * Get current script sizes from performance API
 * Useful for monitoring bundle optimization
 */
export function getCurrentBundleMetrics(): BundleMetrics {
  const now = Date.now();
  const chunkSizes: Record<string, number> = {};

  // Get all loaded scripts
  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;

  scripts.forEach((script) => {
    const src = script.getAttribute('src') || 'unknown';
    const match = src.match(/chunks\/([^\/]+)/) || src.match(/([^\/]+)\.js$/);
    const chunkName = match ? match[1] : src;

    // Approximate size from performance API if available
    const perfEntry = performance.getEntriesByName(src)[0];
    const size = perfEntry
      ? (perfEntry as PerformanceResourceTiming).transferSize || 0
      : 0;

    chunkSizes[chunkName] = size;
    totalSize += size;
  });

  return {
    timestamp: now,
    totalSize,
    chunkSizes,
  };
}

/**
 * Log bundle metrics to console with formatting
 */
export function logBundleMetrics() {
  const metrics = getCurrentBundleMetrics();
  const sizeInMb = (metrics.totalSize / 1024 / 1024).toFixed(2);

  console.group('Bundle Metrics');
  console.log(`Total Size: ${sizeInMb}MB (${metrics.totalSize} bytes)`);
  console.table(metrics.chunkSizes);
  console.groupEnd();

  return metrics;
}

/**
 * Get Web Vitals metrics
 */
export interface WebVitalsMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * Collect Web Vitals using Performance Observer
 */
export async function getWebVitalsMetrics(): Promise<WebVitalsMetrics> {
  const metrics: WebVitalsMetrics = {};

  // Use web-vitals library if available
  try {
    const { getCLS, getFCP, getFID, getLCP, getTTFB } = await import('web-vitals');

    return new Promise((resolve) => {
      let resolved = 0;

      getFCP((metric) => {
        metrics.fcp = metric.value;
        resolved++;
        if (resolved === 5) resolve(metrics);
      });

      getLCP((metric) => {
        metrics.lcp = metric.value;
        resolved++;
        if (resolved === 5) resolve(metrics);
      });

      getFID((metric) => {
        metrics.fid = metric.value;
        resolved++;
        if (resolved === 5) resolve(metrics);
      });

      getCLS((metric) => {
        metrics.cls = metric.value;
        resolved++;
        if (resolved === 5) resolve(metrics);
      });

      getTTFB((metric) => {
        metrics.ttfb = metric.value;
        resolved++;
        if (resolved === 5) resolve(metrics);
      });
    });
  } catch (error) {
    console.warn('web-vitals not available:', error);
    return metrics;
  }
}

/**
 * Format metrics for display
 */
export function formatMetrics(
  bundleMetrics: BundleMetrics,
  vitals?: WebVitalsMetrics
): string {
  const lines = [
    '=== Bundle Optimization Report ===',
    `Total Bundle Size: ${(bundleMetrics.totalSize / 1024).toFixed(2)}KB`,
    '',
  ];

  if (vitals) {
    lines.push('Web Vitals:');
    if (vitals.fcp) lines.push(`  FCP: ${vitals.fcp.toFixed(0)}ms`);
    if (vitals.lcp) lines.push(`  LCP: ${vitals.lcp.toFixed(0)}ms`);
    if (vitals.fid) lines.push(`  FID: ${vitals.fid.toFixed(0)}ms`);
    if (vitals.cls) lines.push(`  CLS: ${vitals.cls.toFixed(3)}`);
    if (vitals.ttfb) lines.push(`  TTFB: ${vitals.ttfb.toFixed(0)}ms`);
  }

  return lines.join('\n');
}

/**
 * Performance monitoring hook initialization
 * Call early in app lifecycle to track metrics
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Mark app start
  performance.mark('app-start');

  // Store initial metrics
  const initialMetrics = getCurrentBundleMetrics();
  (window as any).__BUNDLE_METRICS__ = initialMetrics;

  // Log when fully loaded
  window.addEventListener('load', () => {
    performance.mark('app-load-complete');
    performance.measure('app-load', 'app-start', 'app-load-complete');

    const measure = performance.getEntriesByName('app-load')[0];
    console.log(`App fully loaded in ${measure.duration.toFixed(0)}ms`);
  });

  // Periodic metrics logging in development
  if (import.meta.env.DEV) {
    console.log('Bundle Metrics:', initialMetrics);
  }
}

export default {
  getCurrentBundleMetrics,
  logBundleMetrics,
  getWebVitalsMetrics,
  formatMetrics,
  initPerformanceMonitoring,
};
