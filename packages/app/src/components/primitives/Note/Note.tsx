import React from 'react';
import { Badge } from '../Badge';
import './Note.css';

export interface NoteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant */
  variant?: 'default' | 'simple';
  /** Note title (default variant only) */
  title?: string;
  /** Body text */
  children: React.ReactNode;
  /** Pointer/arrow direction */
  pointer?: 'up' | 'right' | 'down' | 'left' | 'none';
  /** Status badges to show at bottom (default variant only) */
  status?: Array<{ label: string; color?: 'blue' | 'green' | 'orange' | 'red' | 'neutral' }>;
  /** Color dot above the note (status indicator) */
  dot?: 'blue' | 'green' | 'orange' | 'red' | 'none';
}

export const Note = React.forwardRef<HTMLDivElement, NoteProps>(
  (
    {
      variant = 'default',
      title,
      children,
      pointer = 'none',
      status,
      dot = 'none',
      className,
      ...props
    },
    ref
  ) => {
    const classes = [
      'afw-note',
      `afw-note--variant-${variant}`,
      pointer !== 'none' && `afw-note--pointer-${pointer}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {dot !== 'none' && (
          <div className={`afw-note__dot afw-note__dot--${dot}`} />
        )}
        <div className="afw-note__card">
          {variant === 'default' && title && (
            <div className="afw-note__title">{title}</div>
          )}
          <div className="afw-note__body">{children}</div>
          {variant === 'default' && status && status.length > 0 && (
            <div className="afw-note__footer">
              {status.map((badge) => (
                <Badge
                  key={`${badge.label}-${badge.color || 'neutral'}`}
                  label={badge.label}
                  color={badge.color || 'neutral'}
                  size="xs"
                  shape="pill"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Note.displayName = 'Note';
