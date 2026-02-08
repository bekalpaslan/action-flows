/**
 * HarmonyIndicator Component
 * Small inline indicator for session headers, step nodes
 */

import React from 'react';
import './HarmonyIndicator.css';

interface HarmonyIndicatorProps {
  /** Status of harmony check */
  status: 'valid' | 'degraded' | 'violation';

  /** Optional tooltip text */
  tooltip?: string;

  /** Optional className */
  className?: string;
}

export const HarmonyIndicator: React.FC<HarmonyIndicatorProps> = ({
  status,
  tooltip,
  className = '',
}) => {
  const classes = `harmony-indicator harmony-indicator--${status} ${className}`.trim();

  const defaultTooltips = {
    valid: 'Valid harmony - output parsed successfully',
    degraded: 'Degraded harmony - partial parse',
    violation: 'Harmony violation - output failed to parse',
  };

  const title = tooltip || defaultTooltips[status];

  return (
    <div className={classes} title={title}>
      {status === 'valid' && <span className="harmony-indicator__icon">✓</span>}
      {status === 'degraded' && <span className="harmony-indicator__icon">⚠</span>}
      {status === 'violation' && <span className="harmony-indicator__icon">✗</span>}
    </div>
  );
};
