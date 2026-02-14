/**
 * HarmonyHealthDashboard Component
 * System health monitoring and healing action interface for harmony verification infrastructure
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { SessionId, ProjectId, WorkspaceEvent } from '@afw/shared';
import './HarmonyHealthDashboard.css';

// TODO: Backend needs to implement /api/harmony/health endpoint for these types
interface GateHealthScore {
  gateId: string;
  gateName: string;
  score: number; // 0-100
  violations: number;
  lastViolation: number | null;
  status: 'healthy' | 'warning' | 'critical';
}

interface DriftPattern {
  pattern: string;
  frequency: number;
  affectedGates: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface HealingRecommendation {
  id: string;
  gateId: string;
  gateName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedFlow: string;
  affectedOutputs: number;
  estimatedImpact: string;
}

interface HarmonyHealthScore {
  overall: number; // 0-100
  timestamp: number;
  byGate: Record<string, GateHealthScore>;
  violations24h: number;
  violationsTotal: number;
  driftPatterns: DriftPattern[];
  recommendations: HealingRecommendation[];
  trend: 'improving' | 'stable' | 'degrading';
}

interface HarmonyHealthDashboardProps {
  /** Target session or project ID (optional — uses system-wide health if omitted) */
  target?: SessionId | ProjectId;

  /** Target type */
  targetType?: 'session' | 'project';

  /** Optional className */
  className?: string;
}

export const HarmonyHealthDashboard: React.FC<HarmonyHealthDashboardProps> = ({
  target,
  targetType,
  className = '',
}) => {
  const [healthScore, setHealthScore] = useState<HarmonyHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ignoredRecommendations, setIgnoredRecommendations] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('ignoredRecommendations') || '[]'))
  );
  const [expandedGate, setExpandedGate] = useState<string | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  // Load ignored recommendations from localStorage
  useEffect(() => {
    const ignored = JSON.parse(localStorage.getItem('ignoredRecommendations') || '[]');
    setIgnoredRecommendations(new Set(ignored));
  }, []);

  // Fetch health score from API
  const fetchHealthScore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use system-wide health endpoint (works without a session)
      const response = await fetch('http://localhost:3001/api/harmony/health');

      if (!response.ok) {
        throw new Error(`Failed to fetch harmony health: ${response.status}`);
      }

      const data = await response.json();

      // Gate name lookup
      const GATE_NAMES: Record<string, string> = {
        'gate-01': 'Parse & Understand',
        'gate-02': 'Route to Context',
        'gate-03': 'Detect Special Work',
        'gate-04': 'Chain Compilation',
        'gate-05': 'Present Chain',
        'gate-06': 'Step Boundary',
        'gate-07': 'Execute Step',
        'gate-08': 'Execution Complete',
        'gate-09': 'Agent Output',
        'gate-10': 'Auto-Trigger',
        'gate-11': 'Registry Update',
        'gate-12': 'Archive & Indexing',
        'gate-13': 'Learning Surface',
        'gate-14': 'Flow Candidate',
      };

      // Map backend gate data to frontend GateHealthScore shape
      const mappedGates: Record<string, GateHealthScore> = {};
      for (const [gateId, gate] of Object.entries(data.byGate ?? {})) {
        const g = gate as any;
        const score = g.score ?? 100;
        mappedGates[gateId] = {
          gateId,
          gateName: GATE_NAMES[gateId] || gateId,
          score,
          violations: g.violationCount ?? 0,
          lastViolation: g.lastViolation ?? null,
          status: score >= 90 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
        };
      }

      // Map API response to component's HarmonyHealthScore shape
      setHealthScore({
        overall: data.overall ?? 100,
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
        byGate: mappedGates,
        violations24h: data.violations24h ?? 0,
        violationsTotal: data.violationsTotal ?? 0,
        driftPatterns: (data.driftPatterns ?? []).map((dp: any) => ({
          pattern: dp.pattern ?? 'unknown',
          frequency: dp.frequency ?? 0,
          affectedGates: dp.gates ?? dp.affectedGates ?? [],
          severity: dp.frequency >= 5 ? 'high' : dp.frequency >= 3 ? 'medium' : 'low',
        })),
        recommendations: data.healingRecommendations?.length
          ? data.healingRecommendations.map((rec: any, i: number) => ({
              id: `rec-${i}`,
              gateId: rec.pattern ?? 'unknown',
              gateName: rec.pattern ?? 'Unknown',
              severity: rec.severity ?? 'low',
              description: rec.reason ?? rec.pattern ?? '',
              suggestedFlow: rec.suggestedFlow ?? 'harmony-audit-and-fix/',
              affectedOutputs: rec.violationCount ?? 0,
              estimatedImpact: rec.estimatedEffort ?? 'Unknown',
            }))
          : (data.recommendations ?? []).map((msg: string, i: number) => ({
              id: `rec-${i}`,
              gateId: 'system',
              gateName: 'System',
              severity: msg.includes('🚨') ? 'high' : msg.includes('⚠️') || msg.includes('📉') ? 'medium' : 'low',
              description: msg,
              suggestedFlow: 'harmony-audit-and-fix/',
              affectedOutputs: 0,
              estimatedImpact: 'Unknown',
            })),
        trend: data.trend ?? 'stable',
      });
    } catch (err) {
      console.error('[HarmonyHealthDashboard] Error fetching health score:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health score');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket event handler
  const handleWebSocketEvent = useCallback((event: WorkspaceEvent) => {
    // Refetch health score when harmony events occur
    // Note: harmony events don't exist in WorkspaceEvent type yet, so we check with type casting
    const eventType = event.type as string;
    if (
      eventType === 'harmony:health_updated' ||
      eventType === 'harmony:metrics_updated' ||
      eventType === 'harmony:violation'
    ) {
      console.log('[HarmonyHealthDashboard] Received harmony event, refetching health score');
      fetchHealthScore();
    }
  }, [fetchHealthScore]);

  // WebSocket connection with event handler
  const ws = useWebSocket({
    url: 'ws://localhost:3001/ws',
    onEvent: handleWebSocketEvent,
  });

  // Subscribe to WebSocket updates (use target if available)
  useEffect(() => {
    if (target) {
      ws.subscribe(target as SessionId);
      return () => { ws.unsubscribe(target as SessionId); };
    }
  }, [ws, target]);

  // Initial fetch
  useEffect(() => {
    fetchHealthScore();
  }, [fetchHealthScore]);

  // Handle "Fix Now" action
  const handleFixNow = useCallback((recommendation: HealingRecommendation) => {
    const instruction = `Fix ${recommendation.gateName} violations using ${recommendation.suggestedFlow}`;

    // Copy to clipboard as interim solution
    navigator.clipboard.writeText(instruction);

    // Show user feedback
    alert(
      `Healing instruction copied to clipboard:\n\n"${instruction}"\n\n` +
      `Paste this instruction in the orchestrator chat to trigger automated healing.`
    );

    // TODO: Implement POST to /api/orchestrator/instruction endpoint when available
    // fetch('http://localhost:3001/api/orchestrator/instruction', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ instruction, target, targetType }),
    // });
  }, []);

  // Handle "Ignore" action
  const handleIgnore = useCallback((recommendationId: string) => {
    const newIgnored = new Set(ignoredRecommendations);
    newIgnored.add(recommendationId);
    setIgnoredRecommendations(newIgnored);
    localStorage.setItem('ignoredRecommendations', JSON.stringify([...newIgnored]));
  }, [ignoredRecommendations]);

  // Handle "Investigate" action
  const handleInvestigate = useCallback((recommendationId: string) => {
    setExpandedRecommendation(
      expandedRecommendation === recommendationId ? null : recommendationId
    );
  }, [expandedRecommendation]);

  // Toggle gate details
  const toggleGate = useCallback((gateId: string) => {
    setExpandedGate(expandedGate === gateId ? null : gateId);
  }, [expandedGate]);

  // Get health score color
  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'var(--system-green)';
    if (score >= 70) return 'var(--system-yellow)';
    if (score >= 50) return 'var(--system-orange)';
    return 'var(--semantic-error)';
  };

  // Get trend icon
  const getTrendIcon = (trend: 'improving' | 'stable' | 'degrading'): string => {
    if (trend === 'improving') return '↗';
    if (trend === 'degrading') return '↘';
    return '→';
  };

  // Get severity badge color
  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical'): string => {
    switch (severity) {
      case 'critical': return 'var(--semantic-error)';
      case 'high': return 'var(--system-orange)';
      case 'medium': return 'var(--system-yellow)';
      case 'low': return 'var(--text-secondary)';
    }
  };

  if (loading) {
    return (
      <div className={`harmony-health-dashboard harmony-health-dashboard--loading ${className}`}>
        <div className="harmony-health-dashboard__spinner">
          Loading harmony health data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`harmony-health-dashboard harmony-health-dashboard--error ${className}`}>
        <div className="harmony-health-dashboard__error">
          <strong>Error:</strong> {error}
          <button onClick={fetchHealthScore} className="harmony-health-dashboard__retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className={`harmony-health-dashboard harmony-health-dashboard--empty ${className}`}>
        <p>No harmony health data available yet.</p>
      </div>
    );
  }

  // Filter out ignored recommendations
  const activeRecommendations = healthScore.recommendations.filter(
    rec => !ignoredRecommendations.has(rec.id)
  );

  return (
    <div className={`harmony-health-dashboard ${className}`}>
      {/* Overall Health Score Card */}
      <div className="harmony-health-dashboard__score-card">
        <div className="harmony-health-dashboard__score-header">
          <h2 className="harmony-health-dashboard__title">System Harmony Health</h2>
          <button
            onClick={fetchHealthScore}
            className="harmony-health-dashboard__refresh"
            title="Refresh health data"
          >
            ↻
          </button>
        </div>

        <div className="harmony-health-dashboard__score-display">
          <div
            className="harmony-health-dashboard__score-number"
            style={{ color: getHealthColor(healthScore.overall) }}
          >
            {healthScore.overall}
          </div>
          <div className="harmony-health-dashboard__score-label">
            Health Score
          </div>
        </div>

        <div className="harmony-health-dashboard__score-meta">
          <div className="harmony-health-dashboard__trend">
            <span className="harmony-health-dashboard__trend-icon">
              {getTrendIcon(healthScore.trend)}
            </span>
            <span className="harmony-health-dashboard__trend-label">
              {healthScore.trend}
            </span>
          </div>
          <div className="harmony-health-dashboard__updated">
            Last updated: {new Date(healthScore.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="harmony-health-dashboard__stats">
          <div className="harmony-health-dashboard__stat">
            <div className="harmony-health-dashboard__stat-value">
              {healthScore.violations24h}
            </div>
            <div className="harmony-health-dashboard__stat-label">
              Violations (24h)
            </div>
          </div>
          <div className="harmony-health-dashboard__stat">
            <div className="harmony-health-dashboard__stat-value">
              {Object.keys(healthScore.byGate).length}
            </div>
            <div className="harmony-health-dashboard__stat-label">
              Gates Monitored
            </div>
          </div>
        </div>
      </div>

      {/* Per-Gate Health Breakdown */}
      <div className="harmony-health-dashboard__section">
        <h3 className="harmony-health-dashboard__section-title">
          Gate Health Breakdown
        </h3>
        <div className="harmony-health-dashboard__gate-list">
          <div className="harmony-health-dashboard__gate-header">
            <span className="harmony-health-dashboard__gate-col">Gate</span>
            <span className="harmony-health-dashboard__gate-col">Score</span>
            <span className="harmony-health-dashboard__gate-col">Status</span>
            <span className="harmony-health-dashboard__gate-col">Violations</span>
          </div>
          {Object.values(healthScore.byGate)
            .sort((a, b) => a.score - b.score) // Sort by score (worst first)
            .map(gate => (
              <div key={gate.gateId} className="harmony-health-dashboard__gate-item">
                <div
                  className="harmony-health-dashboard__gate-row"
                  onClick={() => toggleGate(gate.gateId)}
                >
                  <span className="harmony-health-dashboard__gate-name">
                    {gate.gateName}
                  </span>
                  <span
                    className="harmony-health-dashboard__gate-score"
                    style={{ color: getHealthColor(gate.score) }}
                  >
                    {gate.score}
                  </span>
                  <span
                    className={`harmony-health-dashboard__gate-status harmony-health-dashboard__gate-status--${gate.status}`}
                  >
                    {gate.status}
                  </span>
                  <span className="harmony-health-dashboard__gate-violations">
                    {gate.violations}
                  </span>
                  <span className="harmony-health-dashboard__gate-expand">
                    {expandedGate === gate.gateId ? '▼' : '▶'}
                  </span>
                </div>

                {expandedGate === gate.gateId && (
                  <div className="harmony-health-dashboard__gate-details">
                    <p>
                      <strong>Gate ID:</strong> {gate.gateId}
                    </p>
                    <p>
                      <strong>Last Violation:</strong>{' '}
                      {gate.lastViolation
                        ? new Date(gate.lastViolation).toLocaleString()
                        : 'None'}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Violation Alerts with Healing Actions */}
      {activeRecommendations.length > 0 && (
        <div className="harmony-health-dashboard__section">
          <h3 className="harmony-health-dashboard__section-title">
            Healing Recommendations ({activeRecommendations.length})
          </h3>
          <div className="harmony-health-dashboard__recommendations">
            {activeRecommendations.map(rec => (
              <div
                key={rec.id}
                className={`harmony-health-dashboard__recommendation harmony-health-dashboard__recommendation--${rec.severity}`}
              >
                <div className="harmony-health-dashboard__recommendation-header">
                  <span
                    className="harmony-health-dashboard__severity-badge"
                    style={{ backgroundColor: getSeverityColor(rec.severity) }}
                  >
                    {rec.severity.toUpperCase()}
                  </span>
                  <span className="harmony-health-dashboard__recommendation-title">
                    {rec.gateName}
                  </span>
                </div>

                <p className="harmony-health-dashboard__recommendation-description">
                  {rec.description}
                </p>

                {expandedRecommendation === rec.id && (
                  <div className="harmony-health-dashboard__recommendation-details">
                    <p><strong>Suggested Flow:</strong> {rec.suggestedFlow}</p>
                    <p><strong>Affected Outputs:</strong> {rec.affectedOutputs}</p>
                    <p><strong>Estimated Impact:</strong> {rec.estimatedImpact}</p>
                  </div>
                )}

                <div className="harmony-health-dashboard__recommendation-actions">
                  <button
                    onClick={() => handleFixNow(rec)}
                    className="harmony-health-dashboard__action-btn harmony-health-dashboard__action-btn--fix"
                  >
                    Fix Now
                  </button>
                  <button
                    onClick={() => handleInvestigate(rec.id)}
                    className="harmony-health-dashboard__action-btn harmony-health-dashboard__action-btn--investigate"
                  >
                    {expandedRecommendation === rec.id ? 'Hide Details' : 'Investigate'}
                  </button>
                  <button
                    onClick={() => handleIgnore(rec.id)}
                    className="harmony-health-dashboard__action-btn harmony-health-dashboard__action-btn--ignore"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drift Patterns */}
      {healthScore.driftPatterns.length > 0 && (
        <div className="harmony-health-dashboard__section">
          <h3 className="harmony-health-dashboard__section-title">
            Detected Drift Patterns
          </h3>
          <div className="harmony-health-dashboard__drift-patterns">
            {healthScore.driftPatterns.map((pattern, index) => (
              <div key={index} className="harmony-health-dashboard__drift-pattern">
                <div className="harmony-health-dashboard__drift-header">
                  <span
                    className="harmony-health-dashboard__severity-badge"
                    style={{ backgroundColor: getSeverityColor(pattern.severity) }}
                  >
                    {pattern.severity.toUpperCase()}
                  </span>
                  <span className="harmony-health-dashboard__drift-pattern-name">
                    {pattern.pattern}
                  </span>
                </div>
                <p className="harmony-health-dashboard__drift-info">
                  Frequency: {pattern.frequency} | Affected Gates: {pattern.affectedGates.length}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
