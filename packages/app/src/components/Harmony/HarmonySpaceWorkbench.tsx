/**
 * HarmonySpaceWorkbench Component
 * Dashboard for monitoring contract compliance and harmony detection
 *
 * Features:
 * - Displays contract compliance status via HarmonyPanel
 * - Shows drift detection results
 * - Harmony score visualization
 * - Manual harmony check triggering
 * - Real-time updates via WebSocket
 *
 * Layout:
 * - Header bar with global harmony score and refresh controls
 * - Main content with HarmonyPanel and drift detection results
 * - Quick actions for triggering checks
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { SessionId, ProjectId, HarmonyCheck } from '@afw/shared';
import { HarmonyPanel } from '../HarmonyPanel/HarmonyPanel';
import { HarmonyBadge } from '../HarmonyBadge/HarmonyBadge';
import { useHarmonyMetrics } from '../../hooks/useHarmonyMetrics';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { OrchestratorButton } from '../OrchestratorButton';
import './HarmonySpaceWorkbench.css';

/**
 * View mode for the workbench
 */
type ViewMode = 'session' | 'project' | 'global';

/**
 * Drift detection result type
 */
interface DriftResult {
  id: string;
  timestamp: string;
  formatName: string;
  expectedFields: string[];
  actualFields: string[];
  driftedFields: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface HarmonySpaceWorkbenchProps {
  /** Active session ID for session-level monitoring */
  sessionId?: SessionId;

  /** Active project ID for project-level monitoring */
  projectId?: ProjectId;

  /** Callback when a violation is clicked */
  onViolationClick?: (check: HarmonyCheck) => void;

  /** Callback when triggering a manual harmony check */
  onTriggerCheck?: () => void;
}

/**
 * HarmonyWorkbench - Dashboard for harmony monitoring and contract compliance
 */
export function HarmonySpaceWorkbench({
  sessionId,
  projectId,
  onViolationClick,
  onTriggerCheck,
}: HarmonySpaceWorkbenchProps): React.ReactElement {
  // Reserved for future: wire to HarmonyPanel when it supports violation callbacks
  void onViolationClick;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>(
    sessionId ? 'session' : projectId ? 'project' : 'global'
  );
  const [manualCheckText, setManualCheckText] = useState('');
  const [isCheckingManually, setIsCheckingManually] = useState(false);
  const [manualCheckResult, setManualCheckResult] = useState<{
    result: 'valid' | 'degraded' | 'violation';
    parsedFormat: string | null;
    missingFields?: string[];
  } | null>(null);
  const [showManualCheck, setShowManualCheck] = useState(false);

  // Determine target based on view mode
  const target = useMemo(() => {
    if (viewMode === 'session' && sessionId) return sessionId;
    if (viewMode === 'project' && projectId) return projectId;
    return projectId || sessionId || ('' as SessionId);
  }, [viewMode, sessionId, projectId]);

  const targetType = viewMode === 'session' ? 'session' : 'project';

  // Use harmony metrics hook (only when we have a valid target)
  const { metrics, loading, error, refresh } = useHarmonyMetrics(
    target || ('' as SessionId),
    targetType
  );

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'HarmonySpaceWorkbench',
    getContext: () => ({
      harmonyStatus: metrics?.harmonyPercentage ?? 100,
      checksCount: metrics?.formatBreakdown ? Object.keys(metrics.formatBreakdown).length : 0,
      viewMode,
    }),
  });

  // Mock drift detection results (to be replaced with actual API call)
  const [driftResults] = useState<DriftResult[]>([
    {
      id: 'drift-1',
      timestamp: new Date().toISOString(),
      formatName: 'ChainCompilation',
      expectedFields: ['title', 'steps', 'status'],
      actualFields: ['title', 'steps'],
      driftedFields: ['status'],
      severity: 'medium',
      recommendation: 'Add status field to chain compilation output',
    },
  ]);

  /**
   * Handle manual harmony check
   */
  const handleManualCheck = useCallback(async () => {
    if (!manualCheckText.trim() || !target) return;

    setIsCheckingManually(true);
    setManualCheckResult(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBase}/harmony/${target}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualCheckText }),
      });

      if (!response.ok) {
        throw new Error(`Check failed: ${response.statusText}`);
      }

      const data = await response.json();
      setManualCheckResult({
        result: data.result,
        parsedFormat: data.parsed,
        missingFields: data.check?.missingFields,
      });

      // Refresh metrics after check
      refresh();
    } catch (err) {
      console.error('Manual check failed:', err);
      setManualCheckResult({
        result: 'violation',
        parsedFormat: null,
        missingFields: undefined,
      });
    } finally {
      setIsCheckingManually(false);
    }
  }, [manualCheckText, target, refresh]);

  /**
   * Handle triggering a full harmony check
   */
  const handleTriggerFullCheck = useCallback(() => {
    if (onTriggerCheck) {
      onTriggerCheck();
    }
    refresh();
  }, [onTriggerCheck, refresh]);

  /**
   * Get severity color class
   */
  const getSeverityClass = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'high':
        return 'harmony-workbench__drift-item--high';
      case 'medium':
        return 'harmony-workbench__drift-item--medium';
      case 'low':
        return 'harmony-workbench__drift-item--low';
    }
  };

  /**
   * Get result icon
   */
  const getResultIcon = (result: 'valid' | 'degraded' | 'violation'): string => {
    switch (result) {
      case 'valid':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'violation':
        return '✗';
    }
  };

  /**
   * Get result color class
   */
  const getResultClass = (result: 'valid' | 'degraded' | 'violation'): string => {
    switch (result) {
      case 'valid':
        return 'harmony-workbench__result--valid';
      case 'degraded':
        return 'harmony-workbench__result--degraded';
      case 'violation':
        return 'harmony-workbench__result--violation';
    }
  };

  // Compute global harmony score
  const harmonyScore = metrics?.harmonyPercentage ?? 100;

  return (
    <div className="harmony-workbench">
      {/* Header Bar */}
      <header className="harmony-workbench__header">
        <div className="harmony-workbench__header-left">
          <h1 className="harmony-workbench__title">Harmony Dashboard</h1>
          <DiscussButton componentName="HarmonyWorkbench" onClick={openDialog} size="small" />
          <div className="harmony-workbench__subtitle">
            Contract compliance monitoring and drift detection
          </div>
        </div>

        <div className="harmony-workbench__header-center">
          <div className="harmony-workbench__score-display">
            <HarmonyBadge
              percentage={harmonyScore}
              showLabel
              size="large"
              onClick={refresh}
            />
          </div>
        </div>

        <div className="harmony-workbench__header-right">
          {/* View Mode Selector */}
          <div className="harmony-workbench__view-selector">
            {sessionId && (
              <button
                className={`harmony-workbench__view-btn ${viewMode === 'session' ? 'harmony-workbench__view-btn--active' : ''}`}
                onClick={() => setViewMode('session')}
              >
                Session
              </button>
            )}
            {projectId && (
              <button
                className={`harmony-workbench__view-btn ${viewMode === 'project' ? 'harmony-workbench__view-btn--active' : ''}`}
                onClick={() => setViewMode('project')}
              >
                Project
              </button>
            )}
            <button
              className={`harmony-workbench__view-btn ${viewMode === 'global' ? 'harmony-workbench__view-btn--active' : ''}`}
              onClick={() => setViewMode('global')}
            >
              Global
            </button>
          </div>

          {/* Actions */}
          <OrchestratorButton source="harmony-recheck" context={{ action: 'recheck-harmony' }}>
            <button
              className="harmony-workbench__action-btn harmony-workbench__action-btn--primary"
              onClick={handleTriggerFullCheck}
            >
              Re-check Harmony
            </button>
          </OrchestratorButton>
          <button
            className="harmony-workbench__action-btn"
            onClick={() => setShowManualCheck(!showManualCheck)}
          >
            {showManualCheck ? 'Hide' : 'Manual Check'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="harmony-workbench__content">
        {/* Left Column: HarmonyPanel */}
        <div className="harmony-workbench__panel harmony-workbench__panel--main">
          {target ? (
            <HarmonyPanel
              target={target}
              targetType={targetType}
              className="harmony-workbench__harmony-panel"
            />
          ) : (
            <div className="harmony-workbench__empty-state">
              <h3>No Target Selected</h3>
              <p>Select a session or project to view harmony metrics.</p>
            </div>
          )}
        </div>

        {/* Right Column: Drift Detection + Manual Check */}
        <div className="harmony-workbench__sidebar">
          {/* Manual Check Panel */}
          {showManualCheck && (
            <div className="harmony-workbench__panel harmony-workbench__panel--manual">
              <h3 className="harmony-workbench__panel-title">Manual Harmony Check</h3>
              <p className="harmony-workbench__panel-description">
                Paste orchestrator output to check contract compliance.
              </p>

              <textarea
                className="harmony-workbench__manual-input"
                placeholder="Paste orchestrator output here..."
                value={manualCheckText}
                onChange={(e) => setManualCheckText(e.target.value)}
                rows={6}
              />

              <div className="harmony-workbench__manual-actions">
                <button
                  className="harmony-workbench__action-btn harmony-workbench__action-btn--primary"
                  onClick={handleManualCheck}
                  disabled={!manualCheckText.trim() || isCheckingManually}
                >
                  {isCheckingManually ? 'Checking...' : 'Check Output'}
                </button>
                <button
                  className="harmony-workbench__action-btn"
                  onClick={() => {
                    setManualCheckText('');
                    setManualCheckResult(null);
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Manual Check Result */}
              {manualCheckResult && (
                <div
                  className={`harmony-workbench__manual-result ${getResultClass(manualCheckResult.result)}`}
                >
                  <div className="harmony-workbench__result-header">
                    <span className="harmony-workbench__result-icon">
                      {getResultIcon(manualCheckResult.result)}
                    </span>
                    <span className="harmony-workbench__result-label">
                      {manualCheckResult.result.toUpperCase()}
                    </span>
                  </div>

                  {manualCheckResult.parsedFormat && (
                    <div className="harmony-workbench__result-format">
                      Format: {manualCheckResult.parsedFormat}
                    </div>
                  )}

                  {manualCheckResult.missingFields &&
                    manualCheckResult.missingFields.length > 0 && (
                      <div className="harmony-workbench__result-missing">
                        Missing fields: {manualCheckResult.missingFields.join(', ')}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Drift Detection Panel */}
          <div className="harmony-workbench__panel harmony-workbench__panel--drift">
            <h3 className="harmony-workbench__panel-title">Drift Detection</h3>
            <p className="harmony-workbench__panel-description">
              Schema changes detected between contract versions.
            </p>

            {driftResults.length === 0 ? (
              <div className="harmony-workbench__drift-empty">
                <span className="harmony-workbench__drift-icon">✓</span>
                <span>No drift detected</span>
              </div>
            ) : (
              <div className="harmony-workbench__drift-list">
                {driftResults.map((drift) => (
                  <div
                    key={drift.id}
                    className={`harmony-workbench__drift-item ${getSeverityClass(drift.severity)}`}
                  >
                    <div className="harmony-workbench__drift-header">
                      <span className="harmony-workbench__drift-format">
                        {drift.formatName}
                      </span>
                      <span className="harmony-workbench__drift-severity">
                        {drift.severity}
                      </span>
                    </div>

                    <div className="harmony-workbench__drift-fields">
                      <strong>Drifted:</strong>{' '}
                      {drift.driftedFields.join(', ') || 'None'}
                    </div>

                    <div className="harmony-workbench__drift-recommendation">
                      {drift.recommendation}
                    </div>

                    <div className="harmony-workbench__drift-timestamp">
                      {new Date(drift.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contract Status */}
          <div className="harmony-workbench__panel harmony-workbench__panel--contract">
            <h3 className="harmony-workbench__panel-title">Contract Status</h3>

            <div className="harmony-workbench__contract-info">
              <div className="harmony-workbench__contract-row">
                <span className="harmony-workbench__contract-label">Version:</span>
                <span className="harmony-workbench__contract-value">1.0.0</span>
              </div>
              <div className="harmony-workbench__contract-row">
                <span className="harmony-workbench__contract-label">
                  Registered Formats:
                </span>
                <span className="harmony-workbench__contract-value">
                  {metrics?.formatBreakdown
                    ? Object.keys(metrics.formatBreakdown).length
                    : 0}
                </span>
              </div>
              <div className="harmony-workbench__contract-row">
                <span className="harmony-workbench__contract-label">Last Check:</span>
                <span className="harmony-workbench__contract-value">
                  {metrics?.lastCheck
                    ? new Date(metrics.lastCheck).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="harmony-workbench__loading-overlay">
          <div className="harmony-workbench__spinner">Loading harmony data...</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="harmony-workbench__error-banner">
          <span className="harmony-workbench__error-icon">!</span>
          <span className="harmony-workbench__error-message">{error}</span>
          <button className="harmony-workbench__error-dismiss" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="HarmonyWorkbench"
        componentContext={{
          harmonyStatus: metrics?.harmonyPercentage ?? 100,
          checksCount: metrics?.formatBreakdown ? Object.keys(metrics.formatBreakdown).length : 0,
          viewMode,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
