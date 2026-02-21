import React, { forwardRef } from 'react';
import { Badge } from '../Badge';
import './FlowCard.css';

export interface FlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout variant */
  variant?: 'card' | 'list';
  /** Card title */
  title: string;
  /** Short description */
  description?: string;
  /** Status determines accent color and optional badge */
  status?: 'none' | 'review' | 'ready' | 'progress' | 'hold';
  /** Whether to show the status badge label */
  showStatusBadge?: boolean;
  /** Whether the card is interactive/clickable */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Children for extra content in footer area */
  children?: React.ReactNode;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'blue' | 'green' | 'orange' | 'red' | 'neutral' }
> = {
  none: { label: '', color: 'neutral' },
  review: { label: 'IN REVIEW', color: 'blue' },
  ready: { label: 'READY', color: 'green' },
  progress: { label: 'IN PROGRESS', color: 'orange' },
  hold: { label: 'ON HOLD', color: 'red' },
};

export const FlowCard = forwardRef<HTMLDivElement, FlowCardProps>(
  (
    {
      variant = 'card',
      title,
      description,
      status = 'none',
      showStatusBadge = false,
      interactive = false,
      onClick,
      children,
      className = '',
      ...rest
    },
    ref
  ) => {
    const statusConfig = STATUS_CONFIG[status];

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    };

    const classNames = [
      'afw-flow-card',
      `afw-flow-card--${variant}`,
      status !== 'none' && `afw-flow-card--${status}`,
      interactive && 'afw-flow-card--interactive',
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
        {...rest}
      >
        {showStatusBadge && statusConfig.label && (
          <div className="afw-flow-card__status">
            <Badge label={statusConfig.label} color={statusConfig.color} size="xs" shape="rounded" />
          </div>
        )}

        <div className="afw-flow-card__body">
          <h4 className="afw-flow-card__title">{title}</h4>
          {description && <p className="afw-flow-card__description">{description}</p>}
        </div>

        {children && <div className="afw-flow-card__footer">{children}</div>}
      </div>
    );
  }
);

FlowCard.displayName = 'FlowCard';
