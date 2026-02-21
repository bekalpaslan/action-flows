import React from 'react';
import './Timeline.css';

export interface TimelineEventItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  icon?: React.ReactNode;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  events: TimelineEventItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'single' | 'double';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'accent' | 'neutral';
}

const COLOR_MAP = {
  blue: 'var(--system-blue)',
  green: 'var(--system-green)',
  orange: 'var(--system-orange)',
  red: 'var(--system-red)',
  accent: 'var(--accent)',
  neutral: 'var(--text-primary)',
};

const DefaultIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" />
  </svg>
);

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  (
    {
      events,
      orientation = 'vertical',
      variant = 'single',
      color = 'neutral',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const rootClasses = [
      'afw-timeline',
      `afw-timeline--${orientation}`,
      `afw-timeline--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const timelineColor = COLOR_MAP[color];

    return (
      <div
        ref={ref}
        className={rootClasses}
        role="list"
        aria-label="Timeline"
        style={{ ...style, '--timeline-color': timelineColor } as React.CSSProperties}
        {...props}
      >
        {events.map((event, index) => {
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="afw-timeline__event" role="listitem">
              {orientation === 'vertical' && event.date && (
                <div className="afw-timeline__date">{event.date}</div>
              )}

              <div className="afw-timeline__marker">
                <div className="afw-timeline__dot" />
                {!isLast && <div className="afw-timeline__connector" />}
              </div>

              <div className="afw-timeline__content">
                {orientation === 'vertical' && (
                  <span className="afw-timeline__icon">
                    {event.icon || <DefaultIcon />}
                  </span>
                )}

                <div className="afw-timeline__text">
                  <span className="afw-timeline__title">{event.title}</span>
                  {event.description && (
                    <span className="afw-timeline__description">{event.description}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Timeline.displayName = 'Timeline';
