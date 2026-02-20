import React, { forwardRef } from 'react';
import './Indicator.css';

export interface IndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'circle' | 'pill' | 'bar' | 'dot';
  status?: 'info' | 'success' | 'warning' | 'error' | 'valid' | 'degraded' | 'violation';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  pulse?: boolean;
  progress?: number; // 0-100, for bar shape
  count?: number; // overlay badge for circle
  label?: string; // for pill/bar
  'aria-label'?: string;
}

export const Indicator = forwardRef<HTMLDivElement, IndicatorProps>(
  (
    {
      shape = 'circle',
      status = 'info',
      size = 'md',
      glow = false,
      pulse = false,
      progress = 0,
      count,
      label,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Normalize status to base colors
    const normalizedStatus = status === 'valid' ? 'success'
      : status === 'degraded' ? 'warning'
      : status === 'violation' ? 'error'
      : status;

    const classes = [
      'afw-indicator',
      `afw-indicator--${shape}`,
      `afw-indicator--${normalizedStatus}`,
      `afw-indicator--${size}`,
      glow && 'afw-indicator--glow',
      pulse && 'afw-indicator--pulse',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Clamp progress to 0-100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <div
        ref={ref}
        className={classes}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel || label || `${status} indicator`}
        {...props}
      >
        {shape === 'bar' && (
          <>
            <div
              className="afw-indicator__fill"
              style={{ width: `${clampedProgress}%` }}
            />
            {label && <span className="afw-indicator__label">{label}</span>}
          </>
        )}
        {shape === 'pill' && label && (
          <span className="afw-indicator__label">{label}</span>
        )}
        {count !== undefined && count > 0 && (
          <span className="afw-indicator__count">{count > 99 ? '99+' : count}</span>
        )}
      </div>
    );
  }
);

Indicator.displayName = 'Indicator';
