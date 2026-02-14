/**
 * Performance Settings Component
 *
 * Displays real-time performance metrics for the Living Universe:
 * - Core Web Vitals (CLS, INP, LCP, TTFB)
 * - FPS counter for animations
 * - Memory usage guidance
 *
 * Used to establish performance baselines and monitor optimization progress.
 */

import { useState } from 'react';
import { useWebVitals } from '../../hooks/useWebVitals';
import { useFPSCounter } from '../../utils/performance';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './PerformanceSettings.css';

/**
 * Format metric value with unit
 */
function formatMetric(value: number | undefined, unit: string): string {
  return value !== undefined ? `${value.toFixed(2)} ${unit}` : 'Measuring...';
}

/**
 * Determine metric status based on value and thresholds
 */
function getMetricStatus(metric: string, value: number | undefined): 'good' | 'fair' | 'poor' | 'pending' {
  if (value === undefined) return 'pending';

  switch (metric) {
    case 'CLS':
      return value < 0.1 ? 'good' : value < 0.25 ? 'fair' : 'poor';
    case 'INP':
      return value < 200 ? 'good' : value < 500 ? 'fair' : 'poor';
    case 'LCP':
      return value < 2500 ? 'good' : value < 4000 ? 'fair' : 'poor';
    case 'TTFB':
      return value < 800 ? 'good' : value < 1800 ? 'fair' : 'poor';
    default:
      return 'pending';
  }
}

/**
 * PerformanceSettings - Real-time performance monitoring UI
 */
export function PerformanceSettings() {
  const vitals = useWebVitals();
  const [fpsEnabled, setFpsEnabled] = useState(false);
  const fps = useFPSCounter(fpsEnabled);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="performance-settings">
      <h2>Performance Metrics</h2>

      {/* Core Web Vitals Section */}
      <section className="web-vitals">
        <h3>Core Web Vitals</h3>
        <div className="metrics-grid">
          <div className={`metric ${getMetricStatus('CLS', vitals.CLS)}`}>
            <label>CLS (Cumulative Layout Shift)</label>
            <div className="metric-value">{formatMetric(vitals.CLS, '')}</div>
            <span className="target">Target: &lt; 0.1</span>
          </div>

          <div className={`metric ${getMetricStatus('INP', vitals.INP)}`}>
            <label>INP (Interaction to Next Paint)</label>
            <div className="metric-value">{formatMetric(vitals.INP, 'ms')}</div>
            <span className="target">Target: &lt; 200ms</span>
          </div>

          <div className={`metric ${getMetricStatus('LCP', vitals.LCP)}`}>
            <label>LCP (Largest Contentful Paint)</label>
            <div className="metric-value">{formatMetric(vitals.LCP, 'ms')}</div>
            <span className="target">Target: &lt; 2.5s</span>
          </div>

          <div className={`metric ${getMetricStatus('TTFB', vitals.TTFB)}`}>
            <label>TTFB (Time to First Byte)</label>
            <div className="metric-value">{formatMetric(vitals.TTFB, 'ms')}</div>
            <span className="target">Target: &lt; 800ms</span>
          </div>
        </div>
      </section>

      {/* FPS Counter Section */}
      <section className="fps-counter">
        <h3>Frame Rate</h3>
        <div className="fps-toggle">
          <label>
            <input
              type="checkbox"
              checked={fpsEnabled}
              onChange={(e) => setFpsEnabled(e.target.checked)}
            />
            Show FPS Counter
          </label>
        </div>
        {fpsEnabled && (
          <div className="fps-display">
            <div className="metric-value">{fps} FPS</div>
            <span className={fps >= 60 ? 'good' : fps >= 30 ? 'fair' : 'poor'}>
              Target: 60 FPS
            </span>
          </div>
        )}
      </section>

      {/* Reduced Motion Status Section */}
      <section className="reduced-motion-status">
        <h3>Reduced Motion</h3>
        <div className="status-display">
          <span className={prefersReducedMotion ? 'status-badge enabled' : 'status-badge disabled'}>
            {prefersReducedMotion ? '✓ Enabled' : '✗ Disabled'}
          </span>
          <p className="info-text">
            {prefersReducedMotion
              ? 'System preference detected: Animations are reduced or disabled.'
              : 'No system preference detected: Animations are enabled.'}
          </p>
        </div>
      </section>

      {/* Memory Usage Section */}
      <section className="memory-usage">
        <h3>Memory Usage</h3>
        <p className="info-text">
          Use browser DevTools (Performance tab) to measure memory overhead.
          Target: &lt; 50MB for universe state.
        </p>
        <div className="memory-instructions">
          <h4>How to Measure:</h4>
          <ol>
            <li>Open DevTools → Memory tab</li>
            <li>Take heap snapshot before cosmic map loads</li>
            <li>Take heap snapshot after cosmic map fully loaded</li>
            <li>Compare heap size difference</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
