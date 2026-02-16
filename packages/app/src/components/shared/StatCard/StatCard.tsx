import React from 'react';
import './StatCard.css';

export interface StatCardProps {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string; // e.g., "+11.01%"
  icon?: React.ReactNode;
  accentColor?: string; // CSS variable name like "var(--snow-accent-blue)"
}

/**
 * StatCard Component
 *
 * A SnowUI-style card for displaying a key metric with optional trend indicator.
 * Features rounded corners, clean typography, and accent color customization.
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Active Sessions"
 *   value={42}
 *   trend="up"
 *   change="+11.01%"
 *   accentColor="var(--snow-accent-blue)"
 * />
 * ```
 */
export function StatCard({
  label,
  value,
  trend,
  change,
  icon,
  accentColor = 'var(--snow-accent-blue)',
}: StatCardProps): JSX.Element {
  return (
    <div
      className="stat-card"
      style={{ borderLeftColor: accentColor } as React.CSSProperties}
    >
      <div className="stat-card__header">
        {icon && <div className="stat-card__icon">{icon}</div>}
        <div className="stat-card__label">{label}</div>
      </div>

      <div className="stat-card__content">
        <div className="stat-card__value">{value}</div>

        {(trend || change) && (
          <div className={`stat-card__trend stat-card__trend--${trend || 'neutral'}`}>
            {trend === 'up' && <span className="stat-card__trend-arrow">↑</span>}
            {trend === 'down' && <span className="stat-card__trend-arrow">↓</span>}
            {change && <span className="stat-card__trend-change">{change}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
