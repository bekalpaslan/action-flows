import React, { useState } from 'react';
import { useAnalytics, type TimeRange } from '../../hooks/useAnalytics';
import { useToast } from '../../contexts/ToastContext';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { FlowMetricsPanel } from './FlowMetricsPanel';
import { AgentMetricsPanel } from './AgentMetricsPanel';
import { TimelineChart } from './TimelineChart';
import './AnalyticsDashboard.css';

/**
 * AnalyticsDashboard Component
 * Display comprehensive analytics with real-time updates
 * Features:
 * - Summary cards (total sessions, chains, steps, success rate)
 * - Time range selector (24h, 7d, 30d)
 * - Flow metrics with usage stats
 * - Agent metrics with performance data
 * - Timeline chart with configurable metrics
 * - Real-time WebSocket updates
 * - Export data (JSON/CSV)
 */
export function AnalyticsDashboard(): React.ReactElement {
  const { summary, flowMetrics, agentMetrics, timeline, loading, error, timeRange, setTimeRange, refresh } = useAnalytics();
  const { showToast } = useToast();
  const [chartMetrics, setChartMetrics] = useState<Array<'sessions' | 'chains' | 'steps'>>([
    'sessions',
    'chains',
  ]);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'AnalyticsDashboard',
    getContext: () => ({
      timeRange,
      summary: summary ? {
        totalSessions: summary.totalSessions,
        totalChains: summary.totalChains,
        totalSteps: summary.totalSteps,
        successRate: summary.successRate,
      } : null,
      flowMetricsCount: flowMetrics.length,
      agentMetricsCount: agentMetrics.length,
      timelinePointsCount: timeline.length,
    }),
  });

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      timeRange,
      summary,
      flowMetrics,
      agentMetrics,
      timeline,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Analytics exported as JSON', 'success');
  };

  const handleExportCSV = () => {
    // Create CSV from flow metrics
    const headers = ['Flow Name', 'Usage Count', 'Success Rate (%)', 'Avg Duration (ms)'];
    const rows = flowMetrics.map(f => [
      `"${f.flowName}"`,
      f.usageCount,
      (f.successRate * 100).toFixed(1),
      f.averageDuration.toFixed(0),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Analytics exported as CSV', 'success');
  };

  const handleRefresh = async () => {
    await refresh();
    showToast('Analytics refreshed', 'success');
  };

  if (error) {
    return (
      <div className="analytics-dashboard error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>Failed to load analytics: {error.message}</span>
          <button className="retry-button" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard ${loading ? 'loading' : ''}`}>
      {/* Header */}
      <div className="analytics-dashboard__header">
        <div className="analytics-dashboard__title-section">
          <h2 className="analytics-dashboard__title">Analytics Dashboard</h2>
          {summary && (
            <span className="analytics-dashboard__last-updated">
              Updated: {new Date(summary.updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="analytics-dashboard__controls">
          {/* Time range selector */}
          <div className="time-range-selector">
            {(['24h', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                className={`time-range-button ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range === '24h' ? '24h' : range === '7d' ? '7d' : '30d'}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="analytics-dashboard__actions">
            <button className="action-button" onClick={handleRefresh} title="Refresh analytics">
              ⟳
            </button>
            <button
              className="action-button"
              onClick={handleExportJSON}
              title="Export as JSON"
            >
              ⬇ JSON
            </button>
            <button
              className="action-button"
              onClick={handleExportCSV}
              title="Export as CSV"
            >
              ⬇ CSV
            </button>
            <DiscussButton componentName="AnalyticsDashboard" onClick={openDialog} size="small" />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && !loading && (
        <div className="analytics-dashboard__summary">
          <div className="summary-card">
            <div className="card-label">Total Sessions</div>
            <div className="card-value">{summary.totalSessions}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Total Chains</div>
            <div className="card-value">{summary.totalChains}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Total Steps</div>
            <div className="card-value">{summary.totalSteps}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Success Rate</div>
            <div className="card-value">{(summary.successRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Charts and metrics */}
      <div className="analytics-dashboard__content">
        {/* Timeline chart */}
        {timeline.length > 0 && (
          <div className="analytics-dashboard__section timeline-section">
            <div className="section-header">
              <h3 className="section-title">Usage Timeline</h3>
              <div className="metrics-toggle">
                {(['sessions', 'chains', 'steps'] as const).map(metric => (
                  <label key={metric} className="metric-checkbox">
                    <input
                      type="checkbox"
                      checked={chartMetrics.includes(metric)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setChartMetrics([...chartMetrics, metric]);
                        } else {
                          setChartMetrics(chartMetrics.filter(m => m !== metric));
                        }
                      }}
                    />
                    <span className="label-text">
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <TimelineChart
              data={timeline}
              metrics={chartMetrics}
              timeRange={timeRange}
            />
          </div>
        )}

        {/* Metrics panels */}
        <div className="analytics-dashboard__panels">
          <div className="analytics-dashboard__section">
            <h3 className="section-title">Top Flows</h3>
            <FlowMetricsPanel metrics={flowMetrics} />
          </div>

          <div className="analytics-dashboard__section">
            <h3 className="section-title">Top Agents</h3>
            <AgentMetricsPanel metrics={agentMetrics} />
          </div>
        </div>
      </div>

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="AnalyticsDashboard"
        componentContext={{
          timeRange,
          summary: summary ? {
            totalSessions: summary.totalSessions,
            totalChains: summary.totalChains,
            totalSteps: summary.totalSteps,
            successRate: summary.successRate,
          } : null,
          flowMetricsCount: flowMetrics.length,
          agentMetricsCount: agentMetrics.length,
          timelinePointsCount: timeline.length,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
