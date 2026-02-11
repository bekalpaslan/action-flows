/**
 * LightBridgeEdge - Custom ReactFlow edge for Living Universe light bridges
 *
 * Renders connections between regions with animated sparks, gate checkpoints,
 * and brightness based on traversal strength.
 */

import type { GateCheckpoint, ChainId, EdgeId } from '@afw/shared';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import '../../styles/cosmic-tokens.css';
import './LightBridgeEdge.css';

export interface LightBridgeData {
  edgeId: EdgeId;
  gates: GateCheckpoint[];
  strength: number;
  activeSparkChainId?: ChainId;
  traversalCount: number;
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
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = !!data?.activeSparkChainId;
  const strength = data?.strength ?? 0.3;
  const gates = data?.gates ?? [];

  // Determine stroke color and opacity based on strength and active state
  const strokeColor = isActive
    ? 'var(--cosmic-bridge-active)'
    : 'var(--cosmic-bridge-idle)';

  const strokeOpacity = isActive ? 0.7 : 0.25 + strength * 0.4;

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
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

      {/* Gate checkpoint markers */}
      {gates.length > 0 && (
        <EdgeLabelRenderer>
          {gates.map((gate, index) => {
            // Place gates at even intervals along the path
            const progress = (index + 1) / (gates.length + 1);
            const x = sourceX + (targetX - sourceX) * progress;
            const y = sourceY + (targetY - sourceY) * progress;

            return (
              <div
                key={gate.id}
                className="light-bridge__gate"
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  pointerEvents: 'all',
                }}
                title={`${gate.harmonyRule}: ${gate.status}`}
              >
                <div className={`gate-marker gate-status-${gate.status}`}>
                  {getGateIcon(gate.status)}
                </div>
              </div>
            );
          })}
        </EdgeLabelRenderer>
      )}

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

/**
 * Get gate status icon
 */
function getGateIcon(status: 'clear' | 'warning' | 'violation'): string {
  switch (status) {
    case 'clear':
      return '✓';
    case 'warning':
      return '○';
    case 'violation':
      return '✗';
    default:
      return '?';
  }
}
