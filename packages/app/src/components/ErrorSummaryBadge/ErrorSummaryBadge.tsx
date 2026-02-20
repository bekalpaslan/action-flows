/**
 * ErrorSummaryBadge Component
 * Small badge showing count of harmony-related errors
 * Placed in workbench header next to HarmonyBadge
 */

import React, { useCallback } from 'react';
import './ErrorSummaryBadge.css';

interface ErrorSummaryBadgeProps {
  /** Number of errors to display */
  errorCount: number;

  /** Click handler for badge interaction */
  onClick: () => void;

  /** Optional className */
  className?: string;
}

export const ErrorSummaryBadge: React.FC<ErrorSummaryBadgeProps> = ({
  errorCount,
  onClick,
  className = '',
}) => {
  // Determine severity variant based on error count
  const severity = errorCount >= 3 ? 'critical' : 'warning';

  const classes = [
    'error-summary-badge',
    `error-summary-badge--${severity}`,
    errorCount > 0 ? 'error-summary-badge--pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Keyboard accessibility handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
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
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${errorCount} error${errorCount !== 1 ? 's' : ''} detected`}
      title={`${errorCount} harmony error${errorCount !== 1 ? 's' : ''}`}
    >
      <span className="error-summary-badge__icon" aria-hidden="true">
        ⚠
      </span>
      <span className="error-summary-badge__count">{errorCount}</span>
    </div>
  );
};
