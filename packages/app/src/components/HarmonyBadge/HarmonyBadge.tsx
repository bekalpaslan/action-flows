/**
 * HarmonyBadge Component
 * Displays harmony percentage with color-coded status
 */

import React, { useCallback } from 'react';
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

  // Keyboard accessibility handler for interactive badges
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      className={classes}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Harmony status: ${percentage.toFixed(1)}% - ${label}`}
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
