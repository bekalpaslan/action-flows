import { useCallback, useMemo, useState } from 'react';
import type { HarmonyCheck, ProjectId, SessionId } from '@afw/shared';
import { HarmonyBadge } from '../HarmonyBadge/HarmonyBadge';
import { OrchestratorButton } from '../OrchestratorButton';
import { BreadcrumbBar } from '../shared/BreadcrumbBar';
import { useHarmonyHealth } from '../../hooks/useHarmonyHealth';
import { useHarmonyMetrics } from '../../hooks/useHarmonyMetrics';
import './HarmonySpaceWorkbench.css';

type RecommendationSeverity = 'low' | 'medium' | 'high' | 'critical';

type GateSummary = {
  gateId: string;
  name: string;
  score: number;
  violations: number;
  trend: string;
};

const SEVERITY_ORDER: Record<RecommendationSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleString();
};

const getScoreTone = (score: number): 'healthy' | 'warning' | 'critical' => {
  if (score >= 90) return 'healthy';
  if (score >= 70) return 'warning';
  return 'critical';
};

export interface HarmonySpaceWorkbenchProps {
  sessionId?: SessionId;
  projectId?: ProjectId;
  onViolationClick?: (check: HarmonyCheck) => void;
  onTriggerCheck?: () => void;
}

export function HarmonySpaceWorkbench({
  sessionId,
  projectId,
  onViolationClick,
  onTriggerCheck,
}: HarmonySpaceWorkbenchProps) {
  const [copiedFlow, setCopiedFlow] = useState<string | null>(null);

  const metricsTarget = sessionId ?? projectId ?? null;
  const metricsTargetType: 'session' | 'project' = sessionId ? 'session' : 'project';

  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    refresh: refreshMetrics,
  } = useHarmonyMetrics((metricsTarget ?? '') as SessionId | ProjectId, metricsTargetType);

  const {
    health,
    loading: healthLoading,
    error: healthError,
    refresh: refreshHealth,
  } = useHarmonyHealth(sessionId ?? null, { pollInterval: 10000 });

  const harmonyScore = metrics?.harmonyPercentage ?? health?.overall ?? 100;
  const scoreTone = getScoreTone(harmonyScore);
  const hasMetricsScope = Boolean(metricsTarget);

  const gateHealth = useMemo<GateSummary[]>(() => {
    return Object.entries(health?.byGate ?? {})
      .map(([gateId, gate]) => {
        const enrichedGate = gate as typeof gate & {
          name?: string;
          violationCount?: number;
        };
        return {
          gateId,
          name: enrichedGate.name || gateId,
          score: enrichedGate.score ?? 100,
          violations: enrichedGate.violations ?? enrichedGate.violationCount ?? 0,
          trend: enrichedGate.trend ?? 'stable',
        };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);
  }, [health]);

  const focusRecommendations = useMemo(() => {
    return [...(health?.healingRecommendations ?? [])]
      .sort((a, b) => {
        const aSeverity = (a.severity as RecommendationSeverity) || 'low';
        const bSeverity = (b.severity as RecommendationSeverity) || 'low';
        return (
          SEVERITY_ORDER[bSeverity] - SEVERITY_ORDER[aSeverity] ||
          (b.violationCount ?? 0) - (a.violationCount ?? 0)
        );
      })
      .slice(0, 4);
  }, [health]);

  const isLoading = (hasMetricsScope && metricsLoading) || healthLoading;
  const error = metricsError || healthError;

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMetrics(), refreshHealth()]);
  }, [refreshMetrics, refreshHealth]);

  const triggerCheck = useCallback(async () => {
    if (onTriggerCheck) {
      onTriggerCheck();
    }
    await refreshAll();
  }, [onTriggerCheck, refreshAll]);

  const copyFlow = useCallback(async (flow: string) => {
    await navigator.clipboard.writeText(flow);
    setCopiedFlow(flow);
    setTimeout(() => setCopiedFlow((current) => (current === flow ? null : current)), 1600);
  }, []);

  return (
    <div className="harmony-workbench" data-testid="harmony-workbench">
      <header className="harmony-workbench__header">
        <div className="harmony-workbench__breadcrumb-wrap">
          <BreadcrumbBar
            segments={[
              { label: 'Harmony' },
            ]}
          />
          <p className="harmony-workbench__subtitle">
            Last update: {formatTimestamp(health?.timestamp || metrics?.lastCheck)}
          </p>
        </div>

        <div className="harmony-workbench__header-actions">
          <HarmonyBadge percentage={harmonyScore} size="large" showLabel />

          <OrchestratorButton source="harmony-recheck" context={{ action: 'recheck-harmony' }}>
            <button className="harmony-workbench__button harmony-workbench__button--primary" onClick={triggerCheck}>
              Re-check
            </button>
          </OrchestratorButton>

          <button className="harmony-workbench__button" onClick={refreshAll}>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="harmony-workbench__banner harmony-workbench__banner--error">
          <span>{error}</span>
          <button className="harmony-workbench__button" onClick={refreshAll}>Retry</button>
        </div>
      )}

      <section className="harmony-workbench__kpis">
        <article className={`harmony-workbench__kpi harmony-workbench__kpi--${scoreTone}`}>
          <span className="harmony-workbench__kpi-label">Harmony Score</span>
          <strong className="harmony-workbench__kpi-value">{Math.round(harmonyScore)}%</strong>
        </article>
        <article className="harmony-workbench__kpi">
          <span className="harmony-workbench__kpi-label">Total Checks</span>
          <strong className="harmony-workbench__kpi-value">{metrics?.totalChecks ?? 0}</strong>
        </article>
        <article className="harmony-workbench__kpi">
          <span className="harmony-workbench__kpi-label">Violations</span>
          <strong className="harmony-workbench__kpi-value">{metrics?.violationCount ?? 0}</strong>
        </article>
        <article className="harmony-workbench__kpi">
          <span className="harmony-workbench__kpi-label">24h Gate Violations</span>
          <strong className="harmony-workbench__kpi-value">{health?.violations24h ?? 0}</strong>
        </article>
      </section>

      <main className="harmony-workbench__grid">
        <section className="harmony-workbench__card">
          <div className="harmony-workbench__card-head">
            <h2>Action Queue</h2>
            <span>{focusRecommendations.length} items</span>
          </div>

          {focusRecommendations.length === 0 ? (
            <p className="harmony-workbench__empty">No urgent healing actions right now.</p>
          ) : (
            <ul className="harmony-workbench__list">
              {focusRecommendations.map((rec, index) => (
                <li key={`${rec.suggestedFlow}-${index}`} className="harmony-workbench__list-item">
                  <div>
                    <div className="harmony-workbench__item-title">{rec.reason || rec.pattern}</div>
                    <div className="harmony-workbench__item-meta">
                      {rec.severity?.toUpperCase() || 'LOW'}
                      {' · '}
                      {rec.violationCount ?? 0} affected
                    </div>
                  </div>
                  <button className="harmony-workbench__button" onClick={() => copyFlow(rec.suggestedFlow)}>
                    {copiedFlow === rec.suggestedFlow ? 'Copied' : 'Copy flow'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="harmony-workbench__card">
          <div className="harmony-workbench__card-head">
            <h2>Gate Risk</h2>
            <span>Lowest scores first</span>
          </div>

          {gateHealth.length === 0 ? (
            <p className="harmony-workbench__empty">No gate health data yet.</p>
          ) : (
            <ul className="harmony-workbench__gate-list">
              {gateHealth.map((gate) => (
                <li key={gate.gateId}>
                  <div className="harmony-workbench__gate-row">
                    <span className="harmony-workbench__gate-name">{gate.name}</span>
                    <span className="harmony-workbench__gate-score">{gate.score}%</span>
                  </div>
                  <div className="harmony-workbench__meter" role="presentation">
                    <div className="harmony-workbench__meter-fill" style={{ width: `${Math.max(0, Math.min(100, gate.score))}%` }} />
                  </div>
                  <div className="harmony-workbench__item-meta">
                    {gate.violations} violations · trend {gate.trend}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="harmony-workbench__card harmony-workbench__card--wide">
          <div className="harmony-workbench__card-head">
            <h2>Recent Violations</h2>
            <span>{metrics?.recentViolations?.length ?? 0} recent</span>
          </div>

          {!hasMetricsScope && (
            <p className="harmony-workbench__empty">
              Attach a session or project to load violation-level harmony metrics.
            </p>
          )}

          {hasMetricsScope && (metrics?.recentViolations?.length ?? 0) === 0 && (
            <p className="harmony-workbench__empty">No recent violations.</p>
          )}

          {hasMetricsScope && (metrics?.recentViolations?.length ?? 0) > 0 && (
            <ul className="harmony-workbench__list">
              {metrics?.recentViolations.map((violation) => (
                <li
                  key={violation.id}
                  className="harmony-workbench__list-item harmony-workbench__list-item--interactive"
                  onClick={() => onViolationClick?.(violation)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onViolationClick?.(violation);
                    }
                  }}
                >
                  <div>
                    <div className="harmony-workbench__item-title">
                      {violation.parsedFormat ?? 'Unknown format'}
                    </div>
                    <div className="harmony-workbench__item-meta">
                      {formatTimestamp(violation.timestamp)}
                      {violation.missingFields?.length ? ` · missing: ${violation.missingFields.join(', ')}` : ''}
                    </div>
                  </div>
                  <span className="harmony-workbench__pill">Violation</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {isLoading && (
        <div className="harmony-workbench__banner">
          Loading harmony telemetry...
        </div>
      )}
    </div>
  );
}
