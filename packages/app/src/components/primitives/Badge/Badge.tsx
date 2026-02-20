import React, { forwardRef } from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  color?: 'neutral' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'pill' | 'rounded' | 'square';
  icon?: React.ReactNode;
  iconPosition?: 'leading' | 'trailing';
  dot?: boolean;
  dotPosition?: 'leading' | 'trailing';
  interactive?: boolean;
  onClick?: (event: React.MouseEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLSpanElement>) => void;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      label,
      color = 'neutral',
      size = 'md',
      shape = 'pill',
      icon,
      iconPosition = 'leading',
      dot = false,
      dotPosition = 'leading',
      interactive = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    // Normalize semantic colors to system colors
    const normalizedColor = color === 'info' ? 'blue'
      : color === 'success' ? 'green'
      : color === 'warning' ? 'orange'
      : color === 'error' ? 'red'
      : color;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick(event);
      }
    };

    const classes = [
      'afw-badge',
      `afw-badge--${normalizedColor}`,
      `afw-badge--${size}`,
      `afw-badge--${shape}`,
      interactive && 'afw-badge--interactive',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {dot && dotPosition === 'leading' && <span className="afw-badge__dot" />}
        {icon && iconPosition === 'leading' && <span className="afw-badge__icon">{icon}</span>}
        <span className="afw-badge__label">{label}</span>
        {icon && iconPosition === 'trailing' && <span className="afw-badge__icon">{icon}</span>}
        {dot && dotPosition === 'trailing' && <span className="afw-badge__dot" />}
      </>
    );

    return (
      <span
        ref={ref}
        className={classes}
        role={interactive ? 'button' : 'status'}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        {...props}
      >
        {content}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
