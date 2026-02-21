import React, { forwardRef } from 'react';
import './Progress.css';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'bar' | 'circle' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'accent';
  showLabel?: boolean;
  label?: string;
  indeterminate?: boolean;
  formLabel?: string;
}

const COLOR_MAP = {
  blue: 'var(--system-blue)',
  green: 'var(--system-green)',
  orange: 'var(--system-orange)',
  red: 'var(--system-red)',
  accent: 'var(--accent)',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      variant = 'bar',
      size = 'md',
      color = 'accent',
      showLabel = false,
      label,
      indeterminate = false,
      formLabel,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const fillColor = COLOR_MAP[color];

    if (variant === 'circle') {
      const SIZES = { sm: 32, md: 48, lg: 64 };
      const circleSize = SIZES[size];
      const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
      const radius = (circleSize - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const offset = indeterminate
        ? circumference * 0.75
        : circumference - (percentage / 100) * circumference;

      return (
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={`afw-progress afw-progress--circle ${className || ''}`}
          data-size={size}
          {...props}
        >
          <svg
            width={circleSize}
            height={circleSize}
            className={`afw-progress__circle-svg ${indeterminate ? 'afw-progress__circle-svg--indeterminate' : ''}`}
          >
            <circle
              className="afw-progress__circle-track"
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <circle
              className="afw-progress__circle-fill"
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ stroke: fillColor }}
            />
          </svg>
          {showLabel && (
            <span className="afw-progress__label afw-progress__label--circle">
              {label || `${Math.round(percentage)}%`}
            </span>
          )}
        </div>
      );
    }

    if (variant === 'loading') {
      return (
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={`afw-progress afw-progress--loading ${className || ''}`}
          data-size={size}
          {...props}
        >
          <div className="afw-progress__bar-track">
            <div
              className="afw-progress__bar-fill afw-progress__bar-fill--loading"
              style={{ backgroundColor: fillColor }}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`afw-progress afw-progress--bar ${className || ''}`}
        data-size={size}
        {...props}
      >
        {formLabel && (
          <div className="afw-progress__form-label">
            <span className="afw-progress__form-label-text">{formLabel}</span>
            {!indeterminate && (
              <span className="afw-progress__form-label-value">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div className="afw-progress__bar-track">
          <div
            className={`afw-progress__bar-fill ${indeterminate ? 'afw-progress__bar-fill--indeterminate' : ''}`}
            style={{
              width: indeterminate ? '100%' : `${percentage}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
        {showLabel && (
          <span className="afw-progress__label afw-progress__label--bar">
            {label || `${Math.round(percentage)}%`}
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';
