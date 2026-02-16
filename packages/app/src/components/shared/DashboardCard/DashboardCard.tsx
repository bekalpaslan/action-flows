import React from 'react';
import './DashboardCard.css';

export interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode; // top-right action buttons
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean; // span full grid width
}

/**
 * DashboardCard Component
 *
 * A SnowUI-style card container for dashboard content sections.
 * Features optional header with title/subtitle and action buttons.
 *
 * @example
 * ```tsx
 * <DashboardCard
 *   title="Activity Feed"
 *   subtitle="Recent events"
 *   actions={<button>View All</button>}
 * >
 *   <ActivityFeed items={activities} />
 * </DashboardCard>
 * ```
 */
export function DashboardCard({
  title,
  subtitle,
  actions,
  children,
  className = '',
  fullWidth = false,
}: DashboardCardProps): JSX.Element {
  return (
    <div
      className={`dashboard-card ${fullWidth ? 'dashboard-card--full-width' : ''} ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="dashboard-card__header">
          <div className="dashboard-card__header-text">
            {title && <h3 className="dashboard-card__title">{title}</h3>}
            {subtitle && <p className="dashboard-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="dashboard-card__actions">{actions}</div>}
        </div>
      )}

      <div className="dashboard-card__content">{children}</div>
    </div>
  );
}
