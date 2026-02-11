/**
 * TraceRenderer Component Tests
 *
 * Test suite for trace visualization component.
 * Coverage target: 70%+
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TraceRenderer } from '../TraceRenderer';
import type { LightBridge, EdgeId, RegionId } from '@afw/shared';

describe('TraceRenderer', () => {
  const mockBridge: LightBridge = {
    id: 'bridge-1' as EdgeId,
    source: 'region-A' as RegionId,
    target: 'region-B' as RegionId,
    gates: [],
    strength: 0.5,
    pinned: false,
    traversalCount: 0,
    traces: {
      totalInteractions: 10,
      recentTraces: [],
      heatLevel: 0.0,
    },
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <svg>
            <TraceRenderer
              bridge={mockBridge}
              sourceX={100}
              sourceY={100}
              targetX={200}
              targetY={200}
            />
          </svg>
        );
      }).not.toThrow();
    });

    it('should render with empty traces array', () => {
      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={mockBridge}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      // Should render but with no particles
      const particles = container.querySelectorAll('.trace-particle');
      expect(particles.length).toBe(0);
    });

    it('should not render heat glow when heatLevel <= 0.3', () => {
      const lowHeatBridge: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 5,
          recentTraces: [],
          heatLevel: 0.2, // Below threshold
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={lowHeatBridge}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const heatGlow = container.querySelector('.trace-heat-glow');
      expect(heatGlow).toBeNull();
    });

    it('should render heat glow when heatLevel > 0.3', () => {
      const highHeatBridge: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 50,
          recentTraces: [],
          heatLevel: 0.8, // Above threshold
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={highHeatBridge}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const heatGlow = container.querySelector('.trace-heat-glow');
      expect(heatGlow).not.toBeNull();
    });

    it('should position heat glow at bridge midpoint', () => {
      const highHeatBridge: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 50,
          recentTraces: [],
          heatLevel: 0.8,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={highHeatBridge}
            sourceX={100}
            sourceY={100}
            targetX={300}
            targetY={200}
          />
        </svg>
      );

      const heatGlow = container.querySelector('.trace-heat-glow');
      expect(heatGlow).not.toBeNull();

      // Midpoint should be (200, 150)
      expect(heatGlow?.getAttribute('cx')).toBe('200');
      expect(heatGlow?.getAttribute('cy')).toBe('150');
    });
  });

  describe('particle rendering', () => {
    it('should render particles for recent traces', () => {
      const now = Date.now();
      const bridgeWithTraces: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 5,
          recentTraces: [
            {
              timestamp: now - 1000 as any, // 1 second ago
              chainId: 'chain-1' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
            {
              timestamp: now - 2000 as any, // 2 seconds ago
              chainId: 'chain-2' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.2,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={bridgeWithTraces}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const particles = container.querySelectorAll('.trace-particle');
      expect(particles.length).toBe(2);
    });

    it('should position particles along bridge path', () => {
      const now = Date.now();
      const bridgeWithTraces: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 1,
          recentTraces: [
            {
              timestamp: now - 5000 as any, // 5 seconds ago (50% fade)
              chainId: 'chain-1' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.1,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={bridgeWithTraces}
            sourceX={0}
            sourceY={0}
            targetX={100}
            targetY={100}
          />
        </svg>
      );

      const particle = container.querySelector('.trace-particle');
      expect(particle).not.toBeNull();

      // Particle should be somewhere along the line
      const cx = parseFloat(particle?.getAttribute('cx') || '0');
      const cy = parseFloat(particle?.getAttribute('cy') || '0');

      expect(cx).toBeGreaterThan(0);
      expect(cx).toBeLessThan(100);
      expect(cy).toBeGreaterThan(0);
      expect(cy).toBeLessThan(100);
    });

    it('should fade particles over 10 seconds', () => {
      const now = Date.now();
      const bridgeWithOldTrace: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 1,
          recentTraces: [
            {
              timestamp: now - 9000 as any, // 9 seconds ago (90% fade)
              chainId: 'chain-1' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.0,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={bridgeWithOldTrace}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const particle = container.querySelector('.trace-particle');
      expect(particle).not.toBeNull();

      // Opacity should be low (10% remaining)
      const opacity = parseFloat(particle?.getAttribute('opacity') || '1');
      expect(opacity).toBeLessThan(0.2);
    });

    it('should not render particles older than 10 seconds', () => {
      const now = Date.now();
      const bridgeWithOldTrace: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 1,
          recentTraces: [
            {
              timestamp: now - 11000 as any, // 11 seconds ago (expired)
              chainId: 'chain-1' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.0,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={bridgeWithOldTrace}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const particles = container.querySelectorAll('.trace-particle');
      expect(particles.length).toBe(0);
    });

    it('should handle mixed recent and old traces', () => {
      const now = Date.now();
      const bridgeWithMixedTraces: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 3,
          recentTraces: [
            {
              timestamp: now - 2000 as any, // Recent
              chainId: 'chain-1' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
            {
              timestamp: now - 11000 as any, // Expired
              chainId: 'chain-2' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
            {
              timestamp: now - 5000 as any, // Recent
              chainId: 'chain-3' as any,
              sessionId: 'session-test' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.3,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={bridgeWithMixedTraces}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const particles = container.querySelectorAll('.trace-particle');
      // Should only render 2 recent particles
      expect(particles.length).toBe(2);
    });
  });

  describe('performance', () => {
    it('should handle 50+ particles efficiently', () => {
      const now = Date.now();
      const recentTraces = [];

      // Create 50 recent traces
      for (let i = 0; i < 50; i++) {
        recentTraces.push({
          timestamp: now - i * 100 as any, // Spread over 5 seconds
          chainId: `chain-${i}` as any,
          sessionId: 'session-test' as any,
          action: 'traversal',
          result: 'success',
        });
      }

      const busyBridge: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 50,
          recentTraces,
          heatLevel: 0.9,
        },
      };

      const start = performance.now();
      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={busyBridge}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );
      const duration = performance.now() - start;

      // Should render all particles
      const particles = container.querySelectorAll('.trace-particle');
      expect(particles.length).toBe(50);

      // Should render quickly (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('edge cases', () => {
    it('should handle missing traces object', () => {
      const bridgeWithoutTraces: LightBridge = {
        ...mockBridge,
        traces: undefined as any,
      };

      expect(() => {
        render(
          <svg>
            <TraceRenderer
              bridge={bridgeWithoutTraces}
              sourceX={100}
              sourceY={100}
              targetX={200}
              targetY={200}
            />
          </svg>
        );
      }).not.toThrow();
    });

    it('should handle undefined recentTraces', () => {
      const bridgeWithUndefinedTraces: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 0,
          recentTraces: undefined as any,
          heatLevel: 0.0,
        },
      };

      expect(() => {
        render(
          <svg>
            <TraceRenderer
              bridge={bridgeWithUndefinedTraces}
              sourceX={100}
              sourceY={100}
              targetX={200}
              targetY={200}
            />
          </svg>
        );
      }).not.toThrow();
    });

    it('should handle zero-length bridge (sourceX === targetX, sourceY === targetY)', () => {
      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={mockBridge}
            sourceX={100}
            sourceY={100}
            targetX={100}
            targetY={100}
          />
        </svg>
      );

      // Should render without errors
      expect(container).toBeDefined();
    });

    it('should handle negative coordinates', () => {
      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={mockBridge}
            sourceX={-100}
            sourceY={-100}
            targetX={-50}
            targetY={-50}
          />
        </svg>
      );

      expect(container).toBeDefined();
    });

    it('should handle heatLevel = 0', () => {
      const coldBridge: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 0,
          recentTraces: [],
          heatLevel: 0.0,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={coldBridge}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const heatGlow = container.querySelector('.trace-heat-glow');
      expect(heatGlow).toBeNull();
    });

    it('should handle heatLevel = 1.0', () => {
      const maxHeatBridge: LightBridge = {
        ...mockBridge,
        traces: {
          totalInteractions: 1000,
          recentTraces: [],
          heatLevel: 1.0,
        },
      };

      const { container } = render(
        <svg>
          <TraceRenderer
            bridge={maxHeatBridge}
            sourceX={100}
            sourceY={100}
            targetX={200}
            targetY={200}
          />
        </svg>
      );

      const heatGlow = container.querySelector('.trace-heat-glow');
      expect(heatGlow).not.toBeNull();

      // Radius should be 20 + 1.0 * 30 = 50
      expect(heatGlow?.getAttribute('r')).toBe('50');
    });
  });
});
