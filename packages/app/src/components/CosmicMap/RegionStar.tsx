/**
 * RegionStar - Custom ReactFlow node for Living Universe regions
 *
 * Renders a glowing star representing a workbench region in the cosmic map.
 * Features layer-based coloring, fog of war states, and glow intensity.
 */

import type { RegionId, WorkbenchId, ColorShift, HealthMetrics } from '@afw/shared';
import { FogState } from '@afw/shared';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useUniverseContext } from '../../contexts/UniverseContext';
import '../../styles/cosmic-tokens.css';
import './RegionStar.css';

export interface RegionStarData {
  regionId: RegionId;
  workbenchId: WorkbenchId;
  label: string;
  layer: 'platform' | 'template' | 'philosophy' | 'physics' | 'experience';
  fogState: FogState;
  glowIntensity: number;
  status: 'idle' | 'active' | 'waiting' | 'undiscovered';
  colorShift: ColorShift;
  health: HealthMetrics;
}

export const RegionStar: React.FC<NodeProps<RegionStarData>> = ({ data, selected }) => {
  const { navigateToRegion, isRegionAccessible } = useUniverseContext();

  const handleClick = () => {
    if (isRegionAccessible(data.regionId)) {
      navigateToRegion(data.regionId);
    }
  };

  // Determine CSS classes based on state
  const fogClass = `fog-${data.fogState}`;
  const statusClass = `status-${data.status}`;
  const layerClass = `layer-${data.layer}`;
  const selectedClass = selected ? 'selected' : '';

  // Calculate opacity based on fog state
  const opacity = data.fogState === FogState.HIDDEN
    ? 0.1
    : data.fogState === FogState.FAINT
      ? 0.35
      : 1.0;

  // Glow intensity affects filter brightness
  const glowFilter = `brightness(${1 + data.glowIntensity * 0.3})`;

  // Determine if clickable
  const isClickable = data.fogState === FogState.REVEALED;

  return (
    <div
      className={`region-star ${fogClass} ${statusClass} ${layerClass} ${selectedClass}`}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : 'presentation'}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      } : undefined}
      title={`${data.label} (${data.layer})`}
      style={{
        opacity,
        filter: data.status === 'active' ? glowFilter : undefined,
        cursor: isClickable ? 'pointer' : 'not-allowed',
      }}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* Star core */}
      <div className="region-star__core">
        {/* Glow effect layers */}
        <div
          className="region-star__glow"
          style={{
            opacity: data.glowIntensity,
          }}
        />

        {/* Star center */}
        <div className="region-star__center" />
      </div>

      {/* Label */}
      <div className="region-star__label">
        <span className="region-star__name">{data.label}</span>
        {data.fogState === FogState.FAINT && (
          <span className="region-star__locked">🔒</span>
        )}
      </div>

      {/* Status indicator */}
      {data.status !== 'idle' && (
        <div className={`region-star__status-indicator ${statusClass}`}>
          {data.status === 'active' && '⚡'}
          {data.status === 'waiting' && '⏳'}
          {data.status === 'undiscovered' && '?'}
        </div>
      )}

      {/* Health indicator (only for revealed regions) */}
      {data.fogState === FogState.REVEALED && data.health && (
        <div
          className="region-star__health"
          style={{
            backgroundColor: getHealthColor(calculateHealthScore(data.health)),
          }}
        />
      )}
    </div>
  );
};

/**
 * Calculate composite health score from individual metrics
 */
function calculateHealthScore(health: HealthMetrics): number {
  return ((health.contractCompliance + health.activityLevel + (1 - health.errorRate)) / 3) * 100;
}

/**
 * Get health color based on overall score
 */
function getHealthColor(score: number): string {
  if (score >= 80) return 'var(--cosmic-health-high)';
  if (score >= 40) return 'var(--cosmic-health-medium)';
  return 'var(--cosmic-health-low)';
}
