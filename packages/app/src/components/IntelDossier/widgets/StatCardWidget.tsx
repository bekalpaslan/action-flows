/**
 * StatCardWidget Component
 *
 * Displays a labeled statistic with optional trend indicator and unit.
 */

import './widgets.css';

export interface StatCardWidgetProps {
  data: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    unit?: string;
  };
  span: number;
}

/**
 * Small card showing a stat with label, value, optional trend, and unit.
 */
export function StatCardWidget({ data, span }: StatCardWidgetProps) {
  const { label, value, trend, unit } = data;

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;
  const trendClass = trend === 'up'
    ? 'widget-stat-card__trend--up'
    : trend === 'down'
    ? 'widget-stat-card__trend--down'
    : 'widget-stat-card__trend--neutral';

  return (
    <div className="widget widget-stat-card" style={{ gridColumn: `span ${span}` }}>
      <div className="widget-stat-card__label">{label}</div>
      <div className="widget-stat-card__value">
        {value}{unit && <span className="widget-stat-card__unit">{unit}</span>}
      </div>
      {trend && (
        <div className={`widget-stat-card__trend ${trendClass}`}>
          {trendIcon}
        </div>
      )}
    </div>
  );
}
