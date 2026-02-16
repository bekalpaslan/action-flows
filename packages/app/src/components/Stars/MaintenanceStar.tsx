/**
 * MaintenanceStar Component
 * System health dashboard for monitoring and maintenance
 *
 * Features:
 * - WebSocket connection status display
 * - Backend health check with uptime
 * - Memory usage display (if available)
 * - Active sessions count
 * - Recent errors list
 * - Manual refresh button
 * - Auto-refresh toggle (30s interval)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useAllSessions } from '../../hooks/useAllSessions';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { StatCard, StatCardRow } from '../shared/StatCard';
import { DashboardCard } from '../shared/DashboardCard';
import './MaintenanceStar.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface HealthData {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

interface SystemMetrics {
  health: HealthData | null;
  healthError: string | null;
  lastChecked: Date | null;
}

interface RecentError {
  id: string;
  timestamp: Date;
  message: string;
  source: 'websocket' | 'api' | 'session';
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * MaintenanceStar - System health monitoring dashboard
 */
export function MaintenanceStar(): React.ReactElement {
  // WebSocket context for connection status
  const { status: wsStatus, error: wsError } = useWebSocketContext();

  // All sessions for active count
  const { sessions, loading: sessionsLoading, error: sessionsError, refresh: refreshSessions } = useAllSessions();

  // System metrics state
  const [metrics, setMetrics] = useState<SystemMetrics>({
    health: null,
    healthError: null,
    lastChecked: null,
  });

  // Recent errors tracking
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);

  // Auto-refresh toggle
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Loading state for manual refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'MaintenanceStar',
    getContext: () => ({
      taskCount: sessions.length,
      activeTask: activeSessions,
      wsStatus,
    }),
  });

  /**
   * Add error to recent errors list
   */
  const addError = useCallback((message: string, source: RecentError['source']) => {
    const newError: RecentError = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
      message,
      source,
    };

    setRecentErrors((prev) => {
      // Keep only last 10 errors
      const updated = [newError, ...prev].slice(0, 10);
      return updated;
    });
  }, []);

  /**
   * Fetch backend health
   */
  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      const data: HealthData = await response.json();

      setMetrics((prev) => ({
        ...prev,
        health: data,
        healthError: null,
        lastChecked: new Date(),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setMetrics((prev) => ({
        ...prev,
        health: null,
        healthError: errorMessage,
        lastChecked: new Date(),
      }));
      addError(errorMessage, 'api');
    }
  }, [addError]);

  /**
   * Refresh all data
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchHealth(), refreshSessions()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchHealth, refreshSessions]);

  /**
   * Toggle auto-refresh
   */
  const handleAutoRefreshToggle = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  /**
   * Clear recent errors
   */
  const handleClearErrors = useCallback(() => {
    setRecentErrors([]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Track WebSocket errors
  useEffect(() => {
    if (wsError) {
      addError(wsError.message, 'websocket');
    }
  }, [wsError, addError]);

  // Track session errors
  useEffect(() => {
    if (sessionsError) {
      addError(sessionsError.message, 'session');
    }
  }, [sessionsError, addError]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      handleRefresh();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [autoRefresh, handleRefresh]);

  // Calculate active sessions count
  const activeSessions = sessions.filter(
    (s) => s.status === 'in_progress' || s.status === 'pending'
  ).length;

  // Determine overall system health status
  const getOverallStatus = (): 'healthy' | 'degraded' | 'error' => {
    if (wsStatus !== 'connected' || metrics.healthError) {
      return 'error';
    }
    if (recentErrors.length > 0) {
      return 'degraded';
    }
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="maintenance-workbench">
      {/* Header Bar */}
      <div className="maintenance-workbench__header">
        <div className="maintenance-workbench__header-left">
          <h1 className="maintenance-workbench__title">System Health</h1>
          <DiscussButton componentName="MaintenanceStar" onClick={openDialog} size="small" />
          <div className={`maintenance-workbench__status-badge maintenance-workbench__status-badge--${overallStatus}`}>
            <span className="status-dot" />
            <span className="status-text">
              {overallStatus === 'healthy' && 'All Systems Operational'}
              {overallStatus === 'degraded' && 'Degraded Performance'}
              {overallStatus === 'error' && 'System Issues Detected'}
            </span>
          </div>
        </div>
        <div className="maintenance-workbench__header-right">
          <label className="maintenance-workbench__auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={handleAutoRefreshToggle}
            />
            <span>Auto-refresh</span>
          </label>
          <button
            className="maintenance-workbench__refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh all metrics"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="maintenance-workbench__content">
        {/* StatCards replacing old metric-card implementation */}
        <StatCardRow>
          <StatCard
            label="WebSocket Status"
            value={wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting...' : wsStatus === 'error' ? 'Error' : 'Disconnected'}
            trend={wsStatus === 'connected' ? 'up' : wsStatus === 'error' ? 'down' : 'neutral'}
            accentColor="var(--snow-accent-green)"
          />
          <StatCard
            label="Active Sessions"
            value={sessionsLoading ? '...' : activeSessions.toString()}
            accentColor="var(--snow-accent-blue)"
          />
          <StatCard
            label="Backend Health"
            value={metrics.health ? (metrics.health.status === 'ok' ? 'Healthy' : 'Unhealthy') : metrics.healthError ? 'Unreachable' : 'Checking...'}
            accentColor="var(--snow-accent-mint)"
          />
          <StatCard
            label="Recent Errors"
            value={recentErrors.length.toString()}
            trend={recentErrors.length > 0 ? 'down' : 'neutral'}
            accentColor="var(--snow-accent-purple)"
          />
        </StatCardRow>

        {/* Recent Errors Section wrapped in DashboardCard */}
        <DashboardCard
          title="Recent Errors"
          variant={recentErrors.length > 0 ? 'error' : 'default'}
          action={
            recentErrors.length > 0 ? (
              <button
                className="errors-section__clear-btn"
                onClick={handleClearErrors}
              >
                Clear All
              </button>
            ) : undefined
          }
        >
          <div className="errors-section__list">
            {recentErrors.length === 0 ? (
              <div className="errors-section__empty">
                <span className="empty-icon">✓</span>
                <span className="empty-text">No recent errors</span>
              </div>
            ) : (
              recentErrors.map((error) => (
                <div key={error.id} className="error-item">
                  <div className="error-item__timestamp">
                    {formatTimestamp(error.timestamp)}
                  </div>
                  <div className={`error-item__source error-item__source--${error.source}`}>
                    {error.source}
                  </div>
                  <div className="error-item__message">{error.message}</div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="MaintenanceStar"
        componentContext={{
          taskCount: sessions.length,
          activeTask: activeSessions,
          wsStatus,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
