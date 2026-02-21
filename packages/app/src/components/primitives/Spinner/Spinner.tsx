import React, { forwardRef } from 'react';
import './Spinner.css';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'accent' | 'primary' | 'secondary' | 'current';
  label?: string;
}

const COLOR_MAP = {
  accent: 'var(--accent)',
  primary: 'var(--text-primary)',
  secondary: 'var(--text-tertiary)',
  current: 'currentColor',
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      color = 'accent',
      label = 'Loading',
      className,
      ...props
    },
    ref
  ) => {
    const SIZES = { sm: 16, md: 24, lg: 32, xl: 48 };
    const spinnerSize = SIZES[size];
    const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
    const radius = (spinnerSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${circumference * 0.75} ${circumference * 0.25}`;

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={`afw-spinner ${className || ''}`}
        data-size={size}
        {...props}
      >
        <svg
          width={spinnerSize}
          height={spinnerSize}
          className="afw-spinner__svg"
          viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="afw-spinner__track"
            cx={spinnerSize / 2}
            cy={spinnerSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="afw-spinner__arc"
            cx={spinnerSize / 2}
            cy={spinnerSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ stroke: COLOR_MAP[color] }}
          />
        </svg>
        <span className="afw-spinner__label-hidden">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
