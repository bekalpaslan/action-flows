/**
 * TraceRenderer Component
 *
 * Renders recent trace history as fading particles traveling along bridges.
 * Shows activity heat map for frequently traversed connections.
 * Subscribes to `universe:evolution_tick` WebSocket events for live updates.
 */

import React, { useMemo, useState, useEffect } from 'react';
import type { LightBridge, TraceAccumulation, EvolutionTickEvent } from '@afw/shared';
import { eventGuards } from '@afw/shared';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import './TraceRenderer.css';

/** Maximum number of particles to render for performance */
const MAX_PARTICLES = 100;

/** Default particle fade duration in milliseconds */
const DEFAULT_FADE_MS = 10000;

export interface TraceRendererProps {
  bridge: LightBridge;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  /** Custom fade duration in milliseconds (default: 10000) */
  fadeDurationMs?: number;
}

/**
 * Hook to detect prefers-reduced-motion media query
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  return prefersReducedMotion;
}

export const TraceRenderer: React.FC<TraceRendererProps> = ({
  bridge,
  sourceX,
  sourceY,
  targetX,
  targetY,
  fadeDurationMs = DEFAULT_FADE_MS,
}) => {
  const wsContext = useWebSocketContext();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Local trace state that can be updated via WebSocket
  const [liveTraces, setLiveTraces] = useState<TraceAccumulation | undefined>(
    bridge.traces
  );

  // Sync with prop changes (e.g., when universe data refreshes)
  useEffect(() => {
    setLiveTraces(bridge.traces);
  }, [bridge.traces]);

  // Subscribe to evolution tick events for this bridge
  useEffect(() => {
    if (!wsContext.onEvent) return;

    const unsubscribe = wsContext.onEvent((event) => {
      if (eventGuards.isEvolutionTick(event)) {
        const tickEvent = event as EvolutionTickEvent;

        // Check if this tick contains updates for our bridge
        const bridgeUpdate = tickEvent.details?.traceDeltas?.[bridge.id];
        // Validate payload structure and bounds
        if (bridgeUpdate &&
            typeof bridgeUpdate.strengthIncrement === 'number' &&
            typeof bridgeUpdate.heatLevel === 'number' &&
            bridgeUpdate.strengthIncrement >= 0 &&
            bridgeUpdate.strengthIncrement <= 1 &&
            bridgeUpdate.heatLevel >= 0 &&
            bridgeUpdate.heatLevel <= 1) {
          // Clamp values to valid bounds
          const validStrengthIncrement = Math.max(0, Math.min(1, bridgeUpdate.strengthIncrement));
          setLiveTraces((prev) => {
            if (!prev) {
              return {
                totalInteractions: 1,
                recentTraces: [],
                heatLevel: Math.min(1, bridgeUpdate.strengthIncrement),
              };
            }

            return {
              ...prev,
              totalInteractions: prev.totalInteractions + 1,
              // Heat level accumulates from increments, capped at 1.0
              heatLevel: Math.min(1, prev.heatLevel + bridgeUpdate.strengthIncrement * 0.1),
            };
          });
        }

        // Also check bridgesTraversed array for activity indication
        if (Array.isArray(tickEvent.details?.bridgesTraversed) &&
            tickEvent.details.bridgesTraversed.includes(bridge.id)) {
          setLiveTraces((prev) => {
            if (!prev) {
              return {
                totalInteractions: 1,
                recentTraces: [],
                heatLevel: 0.1,
              };
            }

            return {
              ...prev,
              totalInteractions: prev.totalInteractions + 1,
              // Bump heat level slightly on traversal
              heatLevel: Math.min(1, prev.heatLevel + 0.05),
            };
          });
        }
      }
    });

    return unsubscribe;
  }, [wsContext, bridge.id]);

  // Calculate particle positions based on recent traces
  const particles = useMemo(() => {
    if (!liveTraces?.recentTraces || liveTraces.recentTraces.length === 0) {
      return [];
    }

    const now = Date.now();

    // Limit to MAX_PARTICLES for performance
    const tracesToRender = liveTraces.recentTraces.slice(0, MAX_PARTICLES);

    return tracesToRender
      .map((trace, index) => {
        const age = now - Number(trace.timestamp);
        if (age > fadeDurationMs) return null;

        // Position along bridge (0.0 to 1.0)
        const progress = 1.0 - (age / fadeDurationMs); // Newer traces at target end
        const x = sourceX + (targetX - sourceX) * progress;
        const y = sourceY + (targetY - sourceY) * progress;

        // Opacity fades with age
        const opacity = Math.max(0, 1.0 - age / fadeDurationMs);

        // Size scales slightly with recency
        const size = 2 + (1 - age / fadeDurationMs) * 2;

        return {
          x,
          y,
          opacity,
          size,
          key: `${trace.timestamp}-${index}`,
          result: trace.result,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [liveTraces?.recentTraces, sourceX, sourceY, targetX, targetY, fadeDurationMs]);

  // Heat level visualization (0-1 scale)
  const heatLevel = liveTraces?.heatLevel || 0;

  // Calculate heat glow properties based on heat level
  const heatGlowRadius = 20 + heatLevel * 30;
  const heatGlowOpacity = heatLevel * 0.3; // Increased from 0.2 for visibility
  const heatGlowBlur = 10 + heatLevel * 20; // Scales with heat

  // For reduced motion: show static heat indicator without particles
  if (prefersReducedMotion) {
    return (
      <g
        role="img"
        aria-label={`Bridge activity: ${Math.round(heatLevel * 100)}% heat level`}
        aria-hidden={heatLevel <= 0.1}
        className="trace-renderer trace-renderer--reduced-motion"
        style={{ contain: 'layout paint' }}
      >
        {/* Static heat indicator (no animation) */}
        {heatLevel > 0.1 && (
          <circle
            cx={(sourceX + targetX) / 2}
            cy={(sourceY + targetY) / 2}
            r={heatGlowRadius}
            fill="var(--cosmic-spark-trail)"
            opacity={heatGlowOpacity}
            className="trace-heat-glow trace-heat-glow--static"
          />
        )}

        {/* Static activity indicator for high heat */}
        {heatLevel > 0.5 && (
          <circle
            cx={(sourceX + targetX) / 2}
            cy={(sourceY + targetY) / 2}
            r={8}
            fill="var(--cosmic-spark-core)"
            opacity={0.8}
            className="trace-activity-indicator"
          />
        )}
      </g>
    );
  }

  return (
    <g
      role="img"
      aria-label={`Activity heat map showing ${particles.length} interaction traces, ${Math.round(heatLevel * 100)}% heat level`}
      aria-hidden={particles.length === 0 && heatLevel <= 0.3}
      className="trace-renderer"
      style={{ contain: 'layout paint' }}
    >
      {/* Heat map glow overlay with scaled blur */}
      {heatLevel > 0.3 && (
        <circle
          cx={(sourceX + targetX) / 2}
          cy={(sourceY + targetY) / 2}
          r={heatGlowRadius}
          fill="var(--cosmic-spark-trail)"
          opacity={heatGlowOpacity}
          className="trace-heat-glow"
          style={{
            filter: `blur(${heatGlowBlur}px)`,
          }}
        />
      )}

      {/* Trace particles with size variation */}
      {particles.map((particle) => (
        <circle
          key={particle.key}
          cx={particle.x}
          cy={particle.y}
          r={particle.size}
          fill={
            particle.result === 'failure'
              ? 'var(--cosmic-gate-failed)'
              : particle.result === 'partial'
                ? 'var(--cosmic-gate-pending)'
                : 'var(--cosmic-spark-core)'
          }
          opacity={particle.opacity}
          className="trace-particle"
        />
      ))}
    </g>
  );
};
