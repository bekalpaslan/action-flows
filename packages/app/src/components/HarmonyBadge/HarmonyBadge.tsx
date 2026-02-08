/**
 * HarmonyBadge Component
 * Displays harmony percentage with color-coded status
 */

import React from 'react';
import { useHarmonyStatus } from '../../hooks/useHarmonyMetrics';
import './HarmonyBadge.css';

interface HarmonyBadgeProps {
  /** Harmony percentage (0-100) */
  percentage: number;

  /** Show label text */
  showLabel?: boolean;

  /** Badge size */
  size?: 'small' | 'medium' | 'large';

  /** Optional click handler */
  onClick?: () => void;

  /** Optional className */
  className?: string;
}

export const HarmonyBadge: React.FC<HarmonyBadgeProps> = ({
  percentage,
  showLabel = false,
  size = 'medium',
  onClick,
  className = '',
}) => {
  const { color, label } = useHarmonyStatus(percentage);

  const classes = `harmony-badge harmony-badge--${size} harmony-badge--${color} ${className}`.trim();

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`Harmony: ${percentage.toFixed(1)}% (${label})`}
    >
      <div className="harmony-badge__icon">
        {color === 'green' && '✓'}
        {color === 'yellow' && '⚠'}
        {color === 'orange' && '⚠'}
        {color === 'red' && '✗'}
      </div>

      <div className="harmony-badge__percentage">
        {percentage.toFixed(0)}%
      </div>

      {showLabel && (
        <div className="harmony-badge__label">
          {label}
        </div>
      )}
    </div>
  );
};
