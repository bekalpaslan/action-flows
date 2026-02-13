/**
 * DiscoveryProgress - Universe discovery progress indicator
 *
 * Displays the number of revealed regions vs total regions in the universe.
 * Features a progress bar with percentage and count labels.
 */

import React from 'react';
import './DiscoveryProgress.css';

export interface DiscoveryProgressProps {
  /** Number of revealed regions */
  revealed: number;

  /** Total number of regions in the universe */
  total: number;
}

/**
 * DiscoveryProgress component - shows universe discovery progression
 */
export function DiscoveryProgress({ revealed, total }: DiscoveryProgressProps): React.ReactElement {
  // Clamp percentage to 0-100 range, handle edge cases
  const percentage = total > 0
    ? Math.min(100, Math.max(0, Math.round((revealed / total) * 100)))
    : 0;

  return (
    <div className="discovery-progress" data-testid="discovery-progress">
      <span className="discovery-progress__label">Universe Discovered</span>
      <div className="discovery-progress__bar-container">
        <div className="discovery-progress__bar" data-testid="discovery-progress-bar">
          <div
            className="discovery-progress__fill"
            style={{ width: `${percentage}%` }}
            data-testid="discovery-progress-fill"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentage}% of universe discovered`}
          />
        </div>
        <span className="discovery-progress__percentage">{percentage}%</span>
      </div>
      <span className="discovery-progress__count" data-testid="discovery-progress-count">
        {revealed}/{total} stars
      </span>
    </div>
  );
}
