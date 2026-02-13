import React, { useMemo } from 'react';
import type { FlowMetrics } from '../../hooks/useAnalytics';
import './MetricsPanels.css';

interface FlowMetricsPanelProps {
  metrics: FlowMetrics[];
}

/**
 * FlowMetricsPanel Component
 * Display top flows by usage with success rates and duration stats
 */
export function FlowMetricsPanel({ metrics }: FlowMetricsPanelProps): React.ReactElement {
  const sparklineData = useMemo(() => {
    // Generate mock sparkline data (in real impl, would come from API)
    return metrics.map(m => ({
      flowId: m.flowId,
      values: Array.from({ length: 12 }, () => Math.random() * 100),
    }));
  }, [metrics]);

  if (metrics.length === 0) {
    return (
      <div className="metrics-panel__empty">
        <span className="empty-icon">📊</span>
        <span className="empty-message">No flow data available</span>
      </div>
    );
  }

  return (
    <div className="metrics-panel flow-metrics-panel">
      <table className="metrics-table">
        <thead className="metrics-table__header">
          <tr>
            <th className="column-name">Flow</th>
            <th className="column-usage">Usage</th>
            <th className="column-success">Success Rate</th>
            <th className="column-duration">Avg Duration</th>
          </tr>
        </thead>
        <tbody className="metrics-table__body">
          {metrics.map((flow, idx) => {
            const sparkline = sparklineData[idx];
            const maxValue = Math.max(...sparkline.values);
            const minValue = Math.min(...sparkline.values);
            const range = maxValue - minValue || 1;

            return (
              <tr key={flow.flowId} className="metrics-row">
                <td className="column-name">
                  <div className="flow-name">{flow.flowName}</div>
                </td>
                <td className="column-usage">
                  <span className="usage-value">{flow.usageCount}</span>
                </td>
                <td className="column-success">
                  <div className="success-indicator">
                    <div className="success-bar">
                      <div
                        className="success-fill"
                        style={{
                          width: `${flow.successRate * 100}%`,
                        }}
                      />
                    </div>
                    <span className="success-text">
                      {(flow.successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="column-duration">
                  <span className="duration-value">
                    {(flow.averageDuration / 1000).toFixed(1)}s
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="metrics-panel__legend">
        <div className="legend-item">
          <span className="legend-label">Last 30 days</span>
        </div>
      </div>
    </div>
  );
}
