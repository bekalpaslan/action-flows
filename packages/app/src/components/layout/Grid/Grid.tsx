import React, { forwardRef } from 'react';
import './Grid.css';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'loose';
  columns?: 4 | 8 | 12 | 16;
  rows?: number;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  columnGap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rowGap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  debug?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      variant = 'default',
      columns = 16,
      rows,
      gap = 'md',
      columnGap,
      rowGap,
      alignItems,
      justifyItems,
      debug = false,
      className = '',
      children,
      style,
      ...rest
    },
    ref
  ) => {
    const classes = [
      'afw-grid',
      variant !== 'default' && `afw-grid--${variant}`,
      `afw-grid--cols-${columns}`,
      `afw-grid--gap-${gap}`,
      debug && 'afw-grid--debug',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inlineStyle: React.CSSProperties = {
      ...style,
      ...(rows && { gridTemplateRows: `repeat(${rows}, 1fr)` }),
      ...(columnGap && { columnGap: `var(--grid-gap-${columnGap})` }),
      ...(rowGap && { rowGap: `var(--grid-gap-${rowGap})` }),
      ...(alignItems && { alignItems }),
      ...(justifyItems && { justifyItems }),
    };

    return (
      <div ref={ref} className={classes} style={inlineStyle} {...rest}>
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';
