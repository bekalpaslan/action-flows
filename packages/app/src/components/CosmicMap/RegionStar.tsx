/**
 * RegionStar - Custom ReactFlow node for Living Universe regions
 *
 * Renders a glowing star representing a workbench region in the cosmic map.
 * Features layer-based coloring, fog of war states, glow intensity, and
 * dynamic color evolution via WebSocket events.
 *
 * GAP-3: Color Shift — Applies evolved color from universe:evolution_tick events
 * GAP-4: Glow Intensity — Dynamic brightness with smooth transitions
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RegionId, WorkbenchId, ColorShift, HealthMetrics, StepStartedEvent, StepCompletedEvent } from '@afw/shared';
import { FogState, mapActionToRegion } from '@afw/shared';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useUniverseContext } from '../../contexts/UniverseContext';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import '../../styles/cosmic-tokens.css';
import '../../styles/region-themes.css';
import './RegionStar.css';

/**
 * Payload structure for universe:evolution_tick WebSocket events
 */
interface EvolutionTickPayload {
  universeId: string;
  tick: number;
  regionUpdates: Array<{
    regionId: string;
    colorShift: ColorShift;
    glowIntensity: number;
  }>;
  bridgeUpdates: Array<{
    bridgeId: string;
    strength: number;
  }>;
}

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
  const ws = useWebSocketContext();
  const [isRevealing, setIsRevealing] = useState(false);
  const [glowState, setGlowState] = useState<'idle' | 'active' | 'waiting'>('idle');
  const [showBurst, setShowBurst] = useState(false);
  const prevFogStateRef = useRef<FogState>(data.fogState);
  const autoRevertTimerRef = useRef<NodeJS.Timeout | null>(null);

  // GAP-3 & GAP-4: Dynamic state from universe:evolution_tick events
  const [evolvedColorShift, setEvolvedColorShift] = useState<ColorShift | null>(null);
  const [evolvedGlowIntensity, setEvolvedGlowIntensity] = useState<number | null>(null);

  // Use evolved values if available, otherwise fall back to props
  const activeColorShift = evolvedColorShift ?? data.colorShift;
  const activeGlowIntensity = evolvedGlowIntensity ?? data.glowIntensity;

  // Watch for fog state changes (HIDDEN → REVEALED)
  useEffect(() => {
    const prevFogState = prevFogStateRef.current;

    // Trigger revelation animation when transitioning from HIDDEN to REVEALED
    if (data.fogState === FogState.REVEALED && prevFogState === FogState.HIDDEN) {
      setIsRevealing(true);

      // Clear animation flag after animation completes (1500ms total duration)
      const timer = setTimeout(() => {
        setIsRevealing(false);
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Update ref for next comparison
    prevFogStateRef.current = data.fogState;
  }, [data.fogState]);

  // Subscribe to step execution events for region glow states
  useEffect(() => {
    if (!ws.onEvent) return;

    const handleEvent = (event: any) => {
      // Handle step:started - activate region glow
      if (event.type === 'step:started') {
        const stepEvent = event as StepStartedEvent;
        if (stepEvent.action) {
          const targetRegion = mapActionToRegion(stepEvent.action);
          if (targetRegion === data.regionId) {
            setGlowState('active');

            // Clear any existing auto-revert timer
            if (autoRevertTimerRef.current) {
              clearTimeout(autoRevertTimerRef.current);
            }

            // Auto-revert to idle after 3 seconds
            autoRevertTimerRef.current = setTimeout(() => {
              setGlowState('idle');
            }, 3000);
          }
        }
      }

      // Handle step:completed - show burst and revert
      if (event.type === 'step:completed') {
        const stepEvent = event as StepCompletedEvent;
        if (stepEvent.action) {
          const targetRegion = mapActionToRegion(stepEvent.action);
          if (targetRegion === data.regionId) {
            // Show completion burst
            setShowBurst(true);
            setGlowState('active');

            // Clear any existing auto-revert timer
            if (autoRevertTimerRef.current) {
              clearTimeout(autoRevertTimerRef.current);
            }

            // Hide burst after 1 second, then revert to idle
            setTimeout(() => {
              setShowBurst(false);
              setGlowState('idle');
            }, 1000);
          }
        }
      }
    };

    const unsubscribe = ws.onEvent(handleEvent);
    return () => {
      unsubscribe();
      // Clean up auto-revert timer on unmount
      if (autoRevertTimerRef.current) {
        clearTimeout(autoRevertTimerRef.current);
      }
    };
  }, [ws, data.regionId]);

  // GAP-3 & GAP-4: Subscribe to universe:evolution_tick for color/glow updates
  useEffect(() => {
    if (!ws.onEvent) return;

    const handleEvolutionTick = (event: { type: string; payload?: EvolutionTickPayload }) => {
      if (event.type !== 'universe:evolution_tick') return;
      if (!event.payload?.regionUpdates) return;

      // Find update for this region
      const regionUpdate = event.payload.regionUpdates.find(
        (update) => update.regionId === data.regionId
      );

      if (regionUpdate) {
        // GAP-3: Update color shift with validation
        if (regionUpdate.colorShift &&
            typeof regionUpdate.colorShift.currentColor === 'string' &&
            typeof regionUpdate.colorShift.baseColor === 'string' &&
            typeof regionUpdate.colorShift.saturation === 'number' &&
            typeof regionUpdate.colorShift.temperature === 'number') {
          setEvolvedColorShift(regionUpdate.colorShift);
        }

        // GAP-4: Update glow intensity with bounds validation
        if (typeof regionUpdate.glowIntensity === 'number' &&
            regionUpdate.glowIntensity >= 0 &&
            regionUpdate.glowIntensity <= 1) {
          setEvolvedGlowIntensity(regionUpdate.glowIntensity);
        }
      }
    };

    const unsubscribe = ws.onEvent(handleEvolutionTick as (event: unknown) => void);
    return () => {
      unsubscribe();
    };
  }, [ws, data.regionId]);

  const handleClick = () => {
    if (isRegionAccessible(data.regionId)) {
      navigateToRegion(data.regionId);
    }
  };

  // Determine CSS classes based on state
  const fogClass = `fog-${data.fogState}`;
  const statusClass = `status-${data.status}`;
  const layerClass = `layer-${data.layer}`;
  const regionClass = `region-star--${data.workbenchId}`;
  const glowClass = `glow-${glowState}`;
  const selectedClass = selected ? 'selected' : '';
  const revealingClass = isRevealing ? 'revealing' : '';
  const burstClass = showBurst ? 'showing-burst' : '';

  // Calculate opacity based on fog state
  const opacity = data.fogState === FogState.HIDDEN
    ? 0.1
    : data.fogState === FogState.FAINT
      ? 0.35
      : 1.0;

  // GAP-4: Glow intensity affects filter brightness with temperature modifier
  // Temperature adds warmth (0.0 = cool/blue shift, 1.0 = warm/orange shift)
  const temperatureModifier = activeColorShift.temperature * 0.1;
  const glowFilter = `brightness(${1 + activeGlowIntensity * 0.3 + temperatureModifier})`;

  // GAP-3: CSS custom properties for evolved color
  const evolvedColorStyle = useMemo(() => ({
    '--star-evolved-color': activeColorShift.currentColor,
    '--star-base-color': activeColorShift.baseColor,
    '--star-saturation': activeColorShift.saturation,
    '--star-temperature': activeColorShift.temperature,
    '--star-glow-intensity': activeGlowIntensity,
  } as React.CSSProperties), [activeColorShift, activeGlowIntensity]);

  // Determine if clickable
  const isClickable = data.fogState === FogState.REVEALED;

  // Determine active state (button is "pressed" when glow is active or status is active)
  const isActive = glowState === 'active' || data.status === 'active';

  // Determine if locked (faint fog state indicates locked)
  const isLocked = data.fogState === FogState.FAINT;

  return (
    <div
      className={`region-star ${fogClass} ${statusClass} ${layerClass} ${regionClass} ${glowClass} ${selectedClass} ${revealingClass} ${burstClass}`}
      data-testid={`region-star-${data.regionId}`}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : 'presentation'}
      aria-label={isClickable ? `Navigate to ${data.label} workbench` : undefined}
      aria-pressed={isClickable ? isActive : undefined}
      aria-disabled={isClickable ? isLocked : undefined}
      aria-describedby={isClickable ? `region-${data.regionId}-description` : undefined}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
      title={`${data.label} (${data.layer})`}
      style={{
        ...evolvedColorStyle,
        opacity,
        filter: glowState === 'active' ? glowFilter : undefined,
        cursor: isClickable ? 'pointer' : 'not-allowed',
      }}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* Fog overlay (for revelation animation) */}
      {data.fogState === FogState.HIDDEN && (
        <div className="region-star__fog" data-testid="discovery-overlay" />
      )}

      {/* Star core */}
      <div className="region-star__core" data-testid="region-badge">
        {/* Glow effect layers */}
        <div
          className="region-star__glow"
          data-testid="region-glow"
          style={{
            opacity: activeGlowIntensity,
          }}
        />

        {/* Star center */}
        <div className="region-star__center" />
      </div>

      {/* Completion burst effect */}
      {showBurst && (
        <div className="region-star__burst" />
      )}

      {/* Label */}
      <div className="region-star__label" data-testid="region-label">
        <span className="region-star__name">{data.label}</span>
        {data.fogState === FogState.FAINT && (
          <span className="region-star__locked" data-testid="locked-indicator">🔒</span>
        )}
      </div>

      {/* Status indicator */}
      {data.status !== 'idle' && (
        <div className={`region-star__status-indicator ${statusClass}`} data-testid="unlocked-indicator">
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
