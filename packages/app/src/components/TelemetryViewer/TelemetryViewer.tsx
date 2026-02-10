/**
 * TelemetryViewer Component
 * Filterable log table for structured telemetry entries
 */

import React, { useState, useEffect } from 'react';
import type { TelemetryEntry, TelemetryLevel } from '@afw/shared';
import './TelemetryViewer.css';

interface TelemetryStats {
  totalEntries: number;
  errorCount: number;
  bySource: Record<string, number>;
  byLevel: Record<string, number>;
}

export const TelemetryViewer: React.FC = () => {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [levelFilter, setLevelFilter] = useState<TelemetryLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sources, setSources] = useState<string[]>([]);

  // Fetch telemetry entries
  const fetchTelemetry = async () => {
    try {
      const params = new URLSearchParams();
      if (levelFilter !== 'all') {
        params.append('level', levelFilter);
      }
      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter);
      }
      params.append('limit', '100');

      const response = await fetch(`http://localhost:3001/api/telemetry?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/telemetry/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        // Extract unique sources
        setSources(Object.keys(data.stats.bySource));
      }
    } catch (error) {
      console.error('Failed to fetch telemetry stats:', error);
    }
  };

  // Initial fetch + auto-refresh every 10 seconds
  useEffect(() => {
    fetchTelemetry();
    fetchStats();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [levelFilter, sourceFilter]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <div className="telemetry-viewer">
      <div className="telemetry-viewer__header">
        <h2 className="telemetry-viewer__title">System Telemetry</h2>
        <div className="telemetry-viewer__filters">
          <label className="telemetry-viewer__filter-label">Level:</label>
          <select
            className="telemetry-viewer__filter-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as TelemetryLevel | 'all')}
          >
            <option value="all">All</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          <label className="telemetry-viewer__filter-label">Source:</label>
          <select
            className="telemetry-viewer__filter-select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="telemetry-viewer__stats">
          <div className="telemetry-viewer__stat">
            <div className="telemetry-viewer__stat-label">Total Entries</div>
            <div className="telemetry-viewer__stat-value">{stats.totalEntries}</div>
          </div>
          <div className="telemetry-viewer__stat">
            <div className="telemetry-viewer__stat-label">Errors</div>
            <div className="telemetry-viewer__stat-value">{stats.errorCount}</div>
          </div>
          <div className="telemetry-viewer__stat">
            <div className="telemetry-viewer__stat-label">Sources</div>
            <div className="telemetry-viewer__stat-value">{Object.keys(stats.bySource).length}</div>
          </div>
        </div>
      )}

      <div className="telemetry-viewer__table-container">
        {entries.length === 0 ? (
          <div className="telemetry-viewer__empty">No telemetry entries found</div>
        ) : (
          <table className="telemetry-viewer__table">
            <thead className="telemetry-viewer__table-header">
              <tr>
                <th className="telemetry-viewer__table-header-cell">Timestamp</th>
                <th className="telemetry-viewer__table-header-cell">Level</th>
                <th className="telemetry-viewer__table-header-cell">Source</th>
                <th className="telemetry-viewer__table-header-cell">Message</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`telemetry-viewer__table-row telemetry-viewer__table-row--${entry.level}`}
                >
                  <td className="telemetry-viewer__table-cell telemetry-viewer__table-cell--timestamp">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="telemetry-viewer__table-cell telemetry-viewer__table-cell--level">
                    <span className={`telemetry-viewer__level--${entry.level}`}>
                      {entry.level}
                    </span>
                  </td>
                  <td className="telemetry-viewer__table-cell telemetry-viewer__table-cell--source">
                    {entry.source}
                  </td>
                  <td className="telemetry-viewer__table-cell telemetry-viewer__table-cell--message">
                    {entry.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
