/**
 * TraceRenderer Component
 *
 * Renders recent trace history as fading particles traveling along bridges.
 * Shows activity heat map for frequently traversed connections.
 */

import React, { useMemo } from 'react';
import type { LightBridge } from '@afw/shared';
import './TraceRenderer.css';

export interface TraceRendererProps {
  bridge: LightBridge;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export const TraceRenderer: React.FC<TraceRendererProps> = ({
  bridge,
  sourceX,
  sourceY,
  targetX,
  targetY,
}) => {
  // Calculate particle positions based on recent traces
  const particles = useMemo(() => {
    if (!bridge.traces?.recentTraces || bridge.traces.recentTraces.length === 0) {
      return [];
    }

    const now = Date.now();
    const maxAge = 10000; // 10 seconds fade-out

    return bridge.traces.recentTraces
      .map((trace, index) => {
        const age = now - Number(trace.timestamp);
        if (age > maxAge) return null;

        // Position along bridge (0.0 to 1.0)
        const progress = 1.0 - (age / maxAge); // Newer traces at target end
        const x = sourceX + (targetX - sourceX) * progress;
        const y = sourceY + (targetY - sourceY) * progress;

        // Opacity fades with age
        const opacity = Math.max(0, 1.0 - age / maxAge);

        return {
          x,
          y,
          opacity,
          key: `${trace.timestamp}-${index}`,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [bridge.traces?.recentTraces, sourceX, sourceY, targetX, targetY]);

  // Heat level visualization (0-1 scale)
  const heatLevel = bridge.traces?.heatLevel || 0;

  return (
    <>
      {/* Heat map glow overlay */}
      {heatLevel > 0.3 && (
        <circle
          cx={(sourceX + targetX) / 2}
          cy={(sourceY + targetY) / 2}
          r={20 + heatLevel * 30}
          fill="var(--cosmic-spark-trail)"
          opacity={heatLevel * 0.2}
          className="trace-heat-glow"
        />
      )}

      {/* Trace particles */}
      {particles.map((particle) => (
        <circle
          key={particle.key}
          cx={particle.x}
          cy={particle.y}
          r={3}
          fill="var(--cosmic-spark-core)"
          opacity={particle.opacity}
          className="trace-particle"
        />
      ))}
    </>
  );
};
