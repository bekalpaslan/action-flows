import React, { forwardRef } from 'react';
import './IABox.css';

export type IABoxVariant = 'default' | 'page-link' | 'content' | 'highlight' | 'menu-item' | 'cta';

export interface IABoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: IABoxVariant;
  /** Label text */
  label: string;
  /** Whether the box is interactive */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export const IABox = forwardRef<HTMLDivElement, IABoxProps>(
  ({ variant = 'default', label, interactive = false, onClick, className, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    };

    const classNames = [
      'afw-ia-box',
      `afw-ia-box--${variant}`,
      interactive && 'afw-ia-box--interactive',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classNames}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {label}
      </div>
    );
  }
);

IABox.displayName = 'IABox';
