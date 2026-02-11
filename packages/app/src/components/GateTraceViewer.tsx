/**
 * GateTraceViewer Component
 * Displays gate traces from the Harmony namespace with real-time updates
 *
 * Features:
 * - Gate log table showing ID, name, timestamp, and status
 * - Filtering by gate ID
 * - Expandable detail view for gate data
 * - Real-time updates via WebSocket (gate:passed and gate:violated events)
 * - Integration with WebSocketContext
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { eventGuards } from '@afw/shared';
import type { SessionId } from '@afw/shared';
import './GateTraceViewer.css';

/**
 * Gate trace entry
 */
export interface GateTrace {
  id: string;
  name: string;
  timestamp: string;
  status: 'pass' | 'fail' | 'pending';
  fromRegion: string;
  toRegion: string;
  passCount: number;
  failCount: number;
}

/**
 * Component props
 */
export interface GateTraceViewerProps {
  /** Session ID to listen for gate events */
  sessionId: SessionId;

  /** Optional className for styling */
  className?: string;

  /** Optional callback when a gate event is received */
  onGateEvent?: (trace: GateTrace) => void;
}

/**
 * GateTraceViewer - Real-time gate trace visualization
 */
export const GateTraceViewer: React.FC<GateTraceViewerProps> = ({
  sessionId,
  className = '',
  onGateEvent,
}) => {
  // State
  const [traces, setTraces] = useState<GateTrace[]>([]);
  const [filterGateId, setFilterGateId] = useState<string>('');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [stats, setStats] = useState({ passed: 0, violated: 0 });

  // WebSocket context
  const { onEvent, status } = useWebSocketContext();

  /**
   * Update stats based on current traces
   */
  const updateStats = useCallback((allTraces: GateTrace[]) => {
    const passed = allTraces.filter((t) => t.status === 'pass').length;
    const violated = allTraces.filter((t) => t.status === 'fail').length;
    setStats({ passed, violated });
  }, []);

  /**
   * Handle gate events from WebSocket
   */
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event) => {
      // Check if this is a gate event using type guard
      if (!eventGuards.isGateUpdated(event)) {
        return;
      }

      // Only process events for this session
      if (event.sessionId !== sessionId) {
        return;
      }

      // Extract gate data from event (now properly typed)
      const gateTrace: GateTrace = {
        id: `gate-${event.fromRegion}-${event.toRegion}-${Date.now()}`,
        name: `Gate: ${event.fromRegion} → ${event.toRegion}`,
        timestamp: event.timestamp || new Date().toISOString(),
        status: event.status || 'pending',
        fromRegion: event.fromRegion || 'Unknown',
        toRegion: event.toRegion || 'Unknown',
        passCount: event.passCount || 0,
        failCount: event.failCount || 0,
      };

      // Add to traces
      setTraces((prev) => {
        const updated = [gateTrace, ...prev].slice(0, 100); // Keep last 100 traces
        updateStats(updated);
        return updated;
      });

      // Call optional callback
      if (onGateEvent) {
        onGateEvent(gateTrace);
      }
    });

    return unsubscribe;
  }, [onEvent, sessionId, onGateEvent, updateStats]);

  /**
   * Filter traces by gate ID
   */
  const filteredTraces = filterGateId
    ? traces.filter((t) => t.id.includes(filterGateId) || t.name.includes(filterGateId))
    : traces;

  /**
   * Toggle trace expansion
   */
  const toggleTrace = (traceId: string) => {
    setExpandedTraceId(expandedTraceId === traceId ? null : traceId);
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return timestamp;
    }
  };

  /**
   * Get status class for styling
   */
  const getStatusClass = (status: 'pass' | 'fail' | 'pending') => {
    return `gate-trace-viewer__status--${status}`;
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return '✓';
      case 'fail':
        return '✗';
      case 'pending':
        return '⊙';
    }
  };

  return (
    <div className={`gate-trace-viewer ${className}`}>
      {/* Header */}
      <div className="gate-trace-viewer__header">
        <div className="gate-trace-viewer__header-left">
          <h3 className="gate-trace-viewer__title">Gate Traces</h3>
          <div className="gate-trace-viewer__status-indicator">
            <span
              className={`gate-trace-viewer__connection-dot gate-trace-viewer__connection-dot--${status}`}
            />
            <span className="gate-trace-viewer__connection-text">{status}</span>
          </div>
        </div>

        <div className="gate-trace-viewer__stats">
          <div className="gate-trace-viewer__stat">
            <span className="gate-trace-viewer__stat-label">Passed:</span>
            <span className="gate-trace-viewer__stat-value gate-trace-viewer__stat-value--passed">
              {stats.passed}
            </span>
          </div>
          <div className="gate-trace-viewer__stat">
            <span className="gate-trace-viewer__stat-label">Violated:</span>
            <span className="gate-trace-viewer__stat-value gate-trace-viewer__stat-value--violated">
              {stats.violated}
            </span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="gate-trace-viewer__filter-bar">
        <input
          type="text"
          className="gate-trace-viewer__filter-input"
          placeholder="Filter by gate ID or name..."
          value={filterGateId}
          onChange={(e) => setFilterGateId(e.target.value)}
        />
        {filterGateId && (
          <button
            className="gate-trace-viewer__filter-clear"
            onClick={() => setFilterGateId('')}
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="gate-trace-viewer__table-container">
        {filteredTraces.length === 0 ? (
          <div className="gate-trace-viewer__empty">
            {traces.length === 0 ? 'No gate traces yet' : 'No traces match the filter'}
          </div>
        ) : (
          <table className="gate-trace-viewer__table">
            <thead className="gate-trace-viewer__table-header">
              <tr>
                <th className="gate-trace-viewer__table-header-cell">Status</th>
                <th className="gate-trace-viewer__table-header-cell">Gate ID</th>
                <th className="gate-trace-viewer__table-header-cell">Name</th>
                <th className="gate-trace-viewer__table-header-cell">Timestamp</th>
                <th className="gate-trace-viewer__table-header-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraces.map((trace) => (
                <React.Fragment key={trace.id}>
                  <tr
                    className={`gate-trace-viewer__table-row ${getStatusClass(trace.status)}`}
                  >
                    <td className="gate-trace-viewer__table-cell">
                      <span className={`gate-trace-viewer__status-icon ${getStatusClass(trace.status)}`}>
                        {getStatusIcon(trace.status)}
                      </span>
                    </td>
                    <td className="gate-trace-viewer__table-cell gate-trace-viewer__table-cell--id">
                      {trace.id}
                    </td>
                    <td className="gate-trace-viewer__table-cell">{trace.name}</td>
                    <td className="gate-trace-viewer__table-cell gate-trace-viewer__table-cell--timestamp">
                      {formatTimestamp(trace.timestamp)}
                    </td>
                    <td className="gate-trace-viewer__table-cell gate-trace-viewer__table-cell--actions">
                      <button
                        className="gate-trace-viewer__expand-btn"
                        onClick={() => toggleTrace(trace.id)}
                        title={expandedTraceId === trace.id ? 'Collapse' : 'Expand'}
                      >
                        {expandedTraceId === trace.id ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Detail View */}
                  {expandedTraceId === trace.id && (
                    <tr className="gate-trace-viewer__table-row--expanded">
                      <td colSpan={5} className="gate-trace-viewer__table-cell--details">
                        <div className="gate-trace-viewer__detail-panel">
                          <div className="gate-trace-viewer__detail-section">
                            <h5 className="gate-trace-viewer__detail-title">Gate Details</h5>
                            <div className="gate-trace-viewer__detail-grid">
                              <div className="gate-trace-viewer__detail-row">
                                <span className="gate-trace-viewer__detail-label">From Region:</span>
                                <span className="gate-trace-viewer__detail-value">{trace.fromRegion}</span>
                              </div>
                              <div className="gate-trace-viewer__detail-row">
                                <span className="gate-trace-viewer__detail-label">To Region:</span>
                                <span className="gate-trace-viewer__detail-value">{trace.toRegion}</span>
                              </div>
                              <div className="gate-trace-viewer__detail-row">
                                <span className="gate-trace-viewer__detail-label">Status:</span>
                                <span className={`gate-trace-viewer__detail-value gate-trace-viewer__status--${trace.status}`}>
                                  {trace.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="gate-trace-viewer__detail-row">
                                <span className="gate-trace-viewer__detail-label">Pass Count:</span>
                                <span className="gate-trace-viewer__detail-value">{trace.passCount}</span>
                              </div>
                              <div className="gate-trace-viewer__detail-row">
                                <span className="gate-trace-viewer__detail-label">Fail Count:</span>
                                <span className="gate-trace-viewer__detail-value">{trace.failCount}</span>
                              </div>
                              <div className="gate-trace-viewer__detail-row">
                                <span className="gate-trace-viewer__detail-label">Timestamp:</span>
                                <span className="gate-trace-viewer__detail-value">
                                  {new Date(trace.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="gate-trace-viewer__footer">
        <span className="gate-trace-viewer__entry-count">
          {filteredTraces.length} of {traces.length} traces
        </span>
      </div>
    </div>
  );
};
