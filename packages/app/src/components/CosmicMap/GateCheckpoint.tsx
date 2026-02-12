/**
 * GateCheckpoint - A contract checkpoint on a light bridge
 *
 * Placeholder component for Phase E.
 * Visual: Small diamond shape with status-based coloring.
 * Future: Click to view contract details, violation history.
 */

import React from 'react';
import type { GateCheckpoint } from '@afw/shared';
import './GateCheckpoint.css';

interface GateCheckpointProps {
  /** Gate data */
  gate: GateCheckpoint;

  /** Position on the bridge */
  position: { x: number; y: number };
}

export const GateCheckpointComponent: React.FC<GateCheckpointProps> = ({ gate, position }) => {
  return (
    <div
      className={`gate-checkpoint gate-checkpoint--${gate.status}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      role="status"
      aria-label={`Gate checkpoint ${gate.harmonyRule}`}
      data-gate-id={gate.id}
      data-harmony-rule={gate.harmonyRule}
      title={`Gate: ${gate.harmonyRule} (${gate.status})`}
    >
      <div className="gate-checkpoint__diamond">
        <div
          className="gate-checkpoint__inner"
          aria-live="polite"
          data-testid={`gate-checkpoint-status-${gate.id}`}
        />
      </div>
    </div>
  );
};
