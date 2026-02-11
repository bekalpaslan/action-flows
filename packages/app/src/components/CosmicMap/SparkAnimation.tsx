/**
 * SparkAnimation - Animated spark traveling along light bridges
 *
 * Renders SVG sparks that travel along LightBridgeEdge paths during chain execution.
 * Uses SVG animateMotion for smooth, performant animation along the edge path.
 */

import React, { useEffect, useRef } from 'react';
import type { ChainId, RegionId } from '@afw/shared';
import { useFPSCounter } from '../../utils/performance';
import './SparkAnimation.css';

export interface SparkAnimationProps {
  chainId: ChainId;
  fromRegion: RegionId;
  toRegion: RegionId;
  progress: number; // 0.0 to 1.0
  edgePath: string; // SVG path definition from edge
  onComplete?: () => void;
}

/**
 * SparkAnimation component
 *
 * Renders an animated spark with a trailing glow effect that travels along
 * the LightBridgeEdge path between two regions. Progress is controlled externally
 * via the progress prop (0.0 = start, 1.0 = end).
 */
export const SparkAnimation: React.FC<SparkAnimationProps> = ({
  chainId,
  fromRegion,
  toRegion,
  progress,
  edgePath,
  onComplete,
}) => {
  const sparkRef = useRef<SVGCircleElement>(null);
  const pathIdRef = useRef(`spark-path-${chainId}-${Date.now()}`);

  // Performance monitoring (dev mode only)
  const fps = useFPSCounter(import.meta.env.DEV);

  useEffect(() => {
    if (progress >= 1.0 && onComplete) {
      onComplete();
    }
  }, [progress, onComplete]);

  // Log FPS in dev mode for performance monitoring
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[PERF] SparkAnimation FPS: ${fps}`);
    }
  }, [fps]);

  if (!edgePath) {
    console.warn(`[SparkAnimation] No edge path found for ${fromRegion} → ${toRegion}`);
    return null;
  }

  // Calculate trail delay (trail follows spark with 10% lag)
  const trailProgress = Math.max(0, progress - 0.1);

  return (
    <g
      className="spark-animation"
      role="status"
      aria-label={`Chain execution in progress: traveling from ${fromRegion} to ${toRegion}`}
      aria-live="polite"
      data-chain-id={chainId}
      data-from-region={fromRegion}
      data-to-region={toRegion}
    >
      {/* Hidden path definition for animateMotion */}
      <defs>
        <path id={pathIdRef.current} d={edgePath} />
      </defs>

      {/* Trail effect (larger, more transparent, follows behind) */}
      <circle
        className="spark-trail"
        r={6}
        fill="var(--cosmic-spark-trail)"
        opacity={0.3}
      >
        <animateMotion
          dur="3s"
          repeatCount="1"
          fill="freeze"
          keyPoints={`0;${trailProgress}`}
          keyTimes="0;1"
          calcMode="linear"
        >
          <mpath href={`#${pathIdRef.current}`} />
        </animateMotion>
      </circle>

      {/* Main spark dot (bright core) */}
      <circle
        ref={sparkRef}
        className="spark-dot"
        r={4}
        fill="var(--cosmic-spark-core)"
      >
        <animateMotion
          dur="3s"
          repeatCount="1"
          fill="freeze"
          keyPoints={`0;${progress}`}
          keyTimes="0;1"
          calcMode="linear"
        >
          <mpath href={`#${pathIdRef.current}`} />
        </animateMotion>
      </circle>
    </g>
  );
};
