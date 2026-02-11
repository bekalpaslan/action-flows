/**
 * GateCheckpointMarker - Visual marker for Harmony validation checkpoints on light bridges
 *
 * Displays gate status (pending/pass/fail) at bridge midpoints.
 * Pulses when spark passes through and validation occurs.
 * Shows pass/fail statistics on hover.
 */

import React from 'react';
import type { RegionId } from '@afw/shared';
import './GateCheckpointMarker.css';

/**
 * Gate validation status
 */
export type GateStatus = 'pending' | 'pass' | 'fail';

/**
 * Gate checkpoint marker props
 */
interface GateCheckpointMarkerProps {
  /** Source region */
  fromRegion: RegionId;

  /** Target region */
  toRegion: RegionId;

  /** Current gate status */
  status: GateStatus;

  /** Position on the bridge (midpoint) */
  position: { x: number; y: number };

  /** Pass count */
  passCount: number;

  /** Fail count */
  failCount: number;

  /** Optional CSS class for custom styling */
  className?: string;
}

/**
 * GateCheckpointMarker Component
 *
 * Renders a circular gate marker on light bridges that:
 * - Shows status color (pending: gray, pass: green, fail: red)
 * - Pulses when status changes
 * - Displays stats tooltip on hover
 * - Respects reduced motion preferences
 */
export const GateCheckpointMarker: React.FC<GateCheckpointMarkerProps> = ({
  status,
  position,
  passCount,
  failCount,
  className = '',
}) => {
  const statusColor = {
    pending: 'var(--cosmic-gate-pending, #888)',
    pass: 'var(--cosmic-gate-pass, #4ade80)',
    fail: 'var(--cosmic-gate-fail, #f87171)',
  }[status];

  const totalChecks = passCount + failCount;
  const passRate = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;

  return (
    <g
      className={`gate-checkpoint gate-checkpoint--${status} ${className}`}
      transform={`translate(${position.x}, ${position.y})`}
      role="img"
      aria-label={`Gate checkpoint: ${status} (${passCount} pass, ${failCount} fail)`}
    >
      {/* Gate circle */}
      <circle
        className="gate-checkpoint__circle"
        r={8}
        fill={statusColor}
        stroke="var(--cosmic-bridge-idle, #475569)"
        strokeWidth={2}
      />

      {/* Pulse animation on status change (not pending) */}
      {status !== 'pending' && (
        <circle
          className="gate-checkpoint__pulse"
          r={8}
          fill="none"
          stroke={statusColor}
          strokeWidth={2}
        />
      )}

      {/* Stats tooltip (SVG title for accessibility) */}
      <title>
        {`Gate Checkpoint\nStatus: ${status}\nPass: ${passCount}\nFail: ${failCount}\nPass Rate: ${passRate}%`}
      </title>
    </g>
  );
};
