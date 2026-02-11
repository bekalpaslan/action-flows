/**
 * LightBridgeEdge - Custom ReactFlow edge for Living Universe light bridges
 *
 * Renders connections between regions with animated sparks, gate checkpoints,
 * and brightness based on traversal strength.
 */

import React, { useEffect, useState } from 'react';
import type { GateCheckpoint, ChainId, EdgeId, RegionId, LightBridge } from '@afw/shared';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import { GateCheckpointMarker, type GateStatus } from './GateCheckpointMarker';
import { TraceRenderer } from './TraceRenderer';
import '../../styles/cosmic-tokens.css';
import './LightBridgeEdge.css';

export interface LightBridgeData {
  edgeId: EdgeId;
  gates: GateCheckpoint[];
  strength: number;
  activeSparkChainId?: ChainId;
  traversalCount: number;
  bridge?: LightBridge; // Full bridge data for trace rendering
}

export const LightBridgeEdge: React.FC<EdgeProps<LightBridgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  source,
  target,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Gate state management (updated via WebSocket)
  const [gateStatus, setGateStatus] = useState<GateStatus>('pending');
  const [gatePassCount, setGatePassCount] = useState(0);
  const [gateFailCount, setGateFailCount] = useState(0);

  // Bridge strength tracking (for thickness visualization)
  const [strength, setStrength] = useState(0.3); // Default minimum

  const isActive = !!data?.activeSparkChainId;
  const gates = data?.gates ?? [];

  // Fetch initial bridge strength from backend
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    fetch(`${API_BASE_URL}/api/universe/bridge-strength/${source}/${target}`)
      .then((res) => res.json())
      .then((data) => setStrength(data.strength))
      .catch((err) => {
        console.warn(`[LightBridgeEdge] Failed to fetch strength for ${source}→${target}:`, err);
        setStrength(0.3); // Fallback to minimum
      });
  }, [source, target]);

  // Calculate bridge midpoint for gate marker
  const midpoint = {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2,
  };

  // Subscribe to gate update events
  useEffect(() => {
    // TODO: Wire up WebSocket subscription when ws context is available
    // ws.onEvent('chain:gate_updated', (event) => {
    //   if (event.fromRegion === source && event.toRegion === target) {
    //     setGateStatus(event.status);
    //     setGatePassCount(event.passCount);
    //     setGateFailCount(event.failCount);
    //   }
    // });
  }, [source, target]);

  // Determine stroke color, opacity, and width based on strength and active state
  const strokeColor = isActive
    ? 'var(--cosmic-bridge-active)'
    : 'var(--cosmic-bridge-idle)';

  const strokeOpacity = isActive ? 0.7 : 0.25 + strength * 0.4;

  // Calculate stroke width based on strength (3px to 10px)
  // 0.3 (min) → 5.1px, 1.0 (max) → 10px
  const strokeWidth = 3 + strength * 7;

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          strokeOpacity,
          strokeDasharray: isActive ? undefined : '5, 5',
        }}
      />

      {/* Animated sparks for active bridges */}
      {isActive && (
        <>
          <circle
            r="4"
            fill="var(--cosmic-bridge-spark)"
            className="light-bridge__spark spark-1"
          >
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle
            r="4"
            fill="var(--cosmic-bridge-spark)"
            className="light-bridge__spark spark-2"
          >
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={edgePath}
              begin="0.75s"
            />
          </circle>
        </>
      )}

      {/* Trace renderer overlay (Phase 6 evolution visualization) */}
      {data?.bridge && (
        <TraceRenderer
          bridge={data.bridge}
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
        />
      )}

      {/* Gate checkpoint marker at bridge midpoint */}
      <GateCheckpointMarker
        fromRegion={source as RegionId}
        toRegion={target as RegionId}
        status={gateStatus}
        position={midpoint}
        passCount={gatePassCount}
        failCount={gateFailCount}
      />

      {/* Traversal count label (for well-traveled bridges) */}
      {data?.traversalCount && data.traversalCount > 5 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="light-bridge__label"
            role="img"
            aria-label={`Connection from ${source} to ${target}, strength ${data.strength.toFixed(1)}, traversed ${data.traversalCount} times`}
          >
            <div className={`bridge-label-content ${isActive ? 'active' : ''}`}>
              {data.traversalCount}×
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

