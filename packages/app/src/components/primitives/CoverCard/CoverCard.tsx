import React from 'react';
import { Badge } from '../Badge';
import './CoverCard.css';

export type CoverCardType = 'project' | 'library' | 'template' | 'boilerplate' | 'training';

export interface CoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card type determines visual treatment */
  type?: CoverCardType;
  /** Card title */
  title: string;
  /** Subtitle or description */
  description?: string;
  /** Tags/badges to display (e.g., "Client file", "Published", "Shared") */
  tags?: string[];
  /** Status badge text (e.g., "IN PROGRESS") */
  status?: string;
  /** Status color variant */
  statusColor?: 'orange' | 'blue' | 'green' | 'red';
  /** Custom icon/emoji for the bottom-right icon area */
  icon?: React.ReactNode;
  /** Thumbnail image URL (for project type) */
  thumbnail?: string;
  /** Children rendered in the avatar/face-pile area */
  children?: React.ReactNode;
  /** Whether the card is interactive/clickable */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
}

const TYPE_ICONS: Record<CoverCardType, string> = {
  project: '',
  library: '🔗',
  template: '✏️',
  boilerplate: '🧩',
  training: '🧠',
};

export const CoverCard = React.forwardRef<HTMLDivElement, CoverCardProps>(
  (
    {
      type = 'project',
      title,
      description,
      tags = [],
      status,
      statusColor = 'orange',
      icon,
      thumbnail,
      children,
      interactive = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const displayIcon = icon || TYPE_ICONS[type];

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    };

    return (
      <div
        ref={ref}
        className={`afw-cover-card afw-cover-card--${type} ${
          interactive ? 'afw-cover-card--interactive' : ''
        } ${className || ''}`}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {/* Header: tags or status */}
        {(tags.length > 0 || status) && (
          <div className="afw-cover-card__header">
            {status && (
              <Badge
                label={status}
                shape="rounded"
                color={statusColor}
              />
            )}
            {tags.map((tag) => (
              <Badge
                key={tag}
                label={tag}
                shape="rounded"
              />
            ))}
          </div>
        )}

        {/* Body: title + description */}
        <div className="afw-cover-card__body">
          <h3 className="afw-cover-card__title">{title}</h3>
          {description && (
            <p className="afw-cover-card__description">{description}</p>
          )}
        </div>

        {/* Footer: avatars left, icon/thumbnail right */}
        <div className="afw-cover-card__footer">
          {children && (
            <div className="afw-cover-card__avatars">{children}</div>
          )}
          {displayIcon && (
            <div className={`afw-cover-card__icon afw-cover-card__icon--${type}`}>
              {displayIcon}
            </div>
          )}
          {thumbnail && type === 'project' && (
            <div
              className="afw-cover-card__thumbnail"
              style={{ backgroundImage: `url(${thumbnail})` }}
            />
          )}
        </div>
      </div>
    );
  }
);

CoverCard.displayName = 'CoverCard';
