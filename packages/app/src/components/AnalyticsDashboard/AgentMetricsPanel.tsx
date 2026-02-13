import React from 'react';
import type { AgentMetrics } from '../../hooks/useAnalytics';
import './MetricsPanels.css';

interface AgentMetricsPanelProps {
  metrics: AgentMetrics[];
}

/**
 * AgentMetricsPanel Component
 * Display top agents by tasks completed with performance metrics
 */
export function AgentMetricsPanel({ metrics }: AgentMetricsPanelProps): React.ReactElement {
  if (metrics.length === 0) {
    return (
      <div className="metrics-panel__empty">
        <span className="empty-icon">🤖</span>
        <span className="empty-message">No agent data available</span>
      </div>
    );
  }

  return (
    <div className="metrics-panel agent-metrics-panel">
      <table className="metrics-table">
        <thead className="metrics-table__header">
          <tr>
            <th className="column-name">Agent</th>
            <th className="column-tasks">Tasks</th>
            <th className="column-success">Success Rate</th>
            <th className="column-duration">Avg Duration</th>
          </tr>
        </thead>
        <tbody className="metrics-table__body">
          {metrics.map((agent) => (
            <tr key={agent.agentId} className="metrics-row">
              <td className="column-name">
                <div className="agent-name">
                  <span className="agent-avatar">🤖</span>
                  {agent.agentId}
                </div>
              </td>
              <td className="column-tasks">
                <span className="tasks-value">{agent.tasksCompleted}</span>
              </td>
              <td className="column-success">
                <div className="success-indicator">
                  <div className="success-bar">
                    <div
                      className="success-fill"
                      style={{
                        width: `${agent.successRate * 100}%`,
                      }}
                    />
                  </div>
                  <span className="success-text">
                    {(agent.successRate * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="column-duration">
                <span className="duration-value">
                  {(agent.averageDuration / 1000).toFixed(1)}s
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="metrics-panel__legend">
        <div className="legend-item">
          <span className="legend-label">Based on completed tasks</span>
        </div>
      </div>
    </div>
  );
}
