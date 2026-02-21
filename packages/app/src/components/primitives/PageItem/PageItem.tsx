import React from 'react';
import './PageItem.css';

export type PageItemColor = 'neutral' | 'blue' | 'green' | 'orange' | 'red';

export interface PageItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Item title */
  title: string;
  /** Priority color */
  color?: PageItemColor;
  /** Indent level (0-based) */
  indent?: number;
  /** Whether interactive */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export const PageItem = React.forwardRef<HTMLDivElement, PageItemProps>(
  (
    {
      title,
      color = 'neutral',
      indent = 0,
      interactive = false,
      onClick,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    };

    const classNames = [
      'afw-page-item',
      `afw-page-item--${color}`,
      interactive && 'afw-page-item--interactive',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const combinedStyle = {
      ...style,
      ['--indent-level' as string]: indent,
    };

    return (
      <div
        ref={ref}
        className={classNames}
        style={combinedStyle}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        <span className="afw-page-item__title">{title}</span>
      </div>
    );
  }
);

PageItem.displayName = 'PageItem';
