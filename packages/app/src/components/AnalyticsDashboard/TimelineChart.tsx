import React, { useMemo } from 'react';
import type { TimelinePoint, TimeRange } from '../../hooks/useAnalytics';
import './TimelineChart.css';

interface TimelineChartProps {
  data: TimelinePoint[];
  metrics: Array<'sessions' | 'chains' | 'steps'>;
  timeRange: TimeRange;
}

/**
 * TimelineChart Component
 * Display usage metrics over time as a line chart
 * Supports multiple metrics overlay with configurable time buckets
 */
export function TimelineChart({ data, metrics, timeRange }: TimelineChartProps): React.ReactElement {
  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [], maxValue: 0 };

    const points = data.map(point => {
      const values = metrics.map(metric => point[metric] || 0);
      return {
        timestamp: point.timestamp,
        values,
        sessions: point.sessions,
        chains: point.chains,
        steps: point.steps,
      };
    });

    // Calculate max value for scaling
    let maxValue = 0;
    points.forEach(point => {
      metrics.forEach((metric, idx) => {
        const val = point.values[idx];
        if (val > maxValue) maxValue = val;
      });
    });

    return { points, maxValue: maxValue || 1 };
  }, [data, metrics]);

  const colors = {
    sessions: '#0A84FF', // Blue
    chains: '#34C759',   // Green
    steps: '#FF9500',    // Orange
  };

  if (chartData.points.length === 0) {
    return (
      <div className="timeline-chart__empty">
        <span>No data available</span>
      </div>
    );
  }

  // Calculate SVG dimensions and scaling
  const width = 100;
  const height = 200;
  const padding = 20;
  const pointWidth = (width - padding * 2) / (chartData.points.length - 1 || 1);
  const scaleY = (height - padding * 2) / chartData.maxValue;

  // Generate path data for each metric
  const pathData = metrics.map((metric, metricIdx) => {
    let path = '';
    chartData.points.forEach((point, pointIdx) => {
      const x = padding + pointIdx * pointWidth;
      const y = height - padding - (point.values[metricIdx] * scaleY);

      if (pointIdx === 0) {
        path += `M${x} ${y}`;
      } else {
        path += ` L${x} ${y}`;
      }
    });
    return { metric, path, color: colors[metric] };
  });

  // Format time labels based on timeRange
  const getTimeLabel = (timestamp: string, index: number, total: number): string | null => {
    if (total <= 1) return null;

    // Show labels at regular intervals
    const interval = Math.max(1, Math.floor(total / 4));
    if (index % interval === 0 || index === total - 1) {
      const date = new Date(timestamp);
      if (timeRange === '24h') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    return null;
  };

  return (
    <div className="timeline-chart">
      <svg
        className="timeline-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (i * (height - padding * 2)) / 4;
          const value = Math.round(chartData.maxValue - (i * chartData.maxValue) / 4);
          return (
            <g key={`grid-${i}`}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="timeline-chart__grid-line"
              />
              <text x={5} y={y + 3} className="timeline-chart__y-label">
                {value}
              </text>
            </g>
          );
        })}

        {/* Lines for each metric */}
        {pathData.map(({ metric, path, color }) => (
          <path
            key={metric}
            d={path}
            className="timeline-chart__line"
            style={{ stroke: color }}
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Data points */}
        {chartData.points.map((point, pointIdx) =>
          metrics.map((metric, metricIdx) => {
            const x = padding + pointIdx * pointWidth;
            const y = height - padding - (point.values[metricIdx] * scaleY);
            return (
              <circle
                key={`point-${pointIdx}-${metric}`}
                cx={x}
                cy={y}
                r="1.5"
                className="timeline-chart__point"
                style={{ fill: colors[metric] }}
              />
            );
          })
        )}
      </svg>

      {/* X-axis labels */}
      <div className="timeline-chart__x-labels">
        {chartData.points.map((point, idx) => {
          const label = getTimeLabel(point.timestamp, idx, chartData.points.length);
          return (
            <div
              key={`label-${idx}`}
              className="x-label"
              style={{
                left: `calc(${(idx / (chartData.points.length - 1 || 1)) * 100}% - 20px)`,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="timeline-chart__legend">
        {metrics.map(metric => (
          <div key={metric} className="legend-item">
            <div
              className="legend-indicator"
              style={{ backgroundColor: colors[metric] }}
            />
            <span className="legend-label">
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
