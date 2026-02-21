import React, { forwardRef } from 'react';
import './Divider.css';

export interface DividerProps extends React.HTMLAttributes<HTMLElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  label?: string;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      spacing = 'md',
      label,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      'afw-divider',
      `afw-divider--${orientation}`,
      `afw-divider--${variant}`,
      `afw-divider--spacing-${spacing}`,
      label ? 'afw-divider--labeled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <hr
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={classNames}
        {...props}
      >
        {label && <span className="afw-divider__label">{label}</span>}
      </hr>
    );
  }
);

Divider.displayName = 'Divider';
