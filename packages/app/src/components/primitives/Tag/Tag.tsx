import React, { forwardRef } from 'react';
import './Tag.css';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  variant?: 'filled' | 'outlined';
  color?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary';
  size?: 'sm' | 'md';
  dismissible?: boolean;
  onDismiss?: () => void;
  showCheck?: boolean;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      label,
      variant = 'filled',
      color = 'neutral',
      size = 'md',
      dismissible = false,
      onDismiss,
      showCheck = true,
      className,
      ...props
    },
    ref
  ) => {
    const classNames = [
      'afw-tag',
      `afw-tag--${variant}`,
      `afw-tag--${color}`,
      `afw-tag--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSize = size === 'sm' ? 10 : 12;

    return (
      <span ref={ref} className={classNames} {...props}>
        {showCheck && (
          <svg
            className="afw-tag__check"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="afw-tag__label">{label}</span>
        {dismissible && (
          <button
            className="afw-tag__dismiss"
            aria-label="Remove tag"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 3L9 9M9 3L3 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';
