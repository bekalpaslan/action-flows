# Contract Coverage Dashboard Implementation Plan

**Date:** 2026-02-10
**Agent:** Planning Agent
**Depth:** Detailed
**Analysis Source:** `.claude/actionflows/logs/analyze/contract-coverage-dashboard-architecture_2026-02-10-20-11-28/report.md`

---

## Executive Summary

This plan details the implementation of a **Contract Coverage Dashboard** workbench — a new panel that visualizes behavioral contract health, validation status, drift detection, and coverage metrics. The dashboard will leverage the existing health check CLI (`health:check:ci`) through a new backend API endpoint, display results in a workbench following the HarmonyWorkbench pattern, and provide actionable insights into the 99 behavioral contracts stored in `packages/app/src/contracts/`.

**Key Components:**
- New `coverage` workbench with summary cards, tabbed content, and drill-down capability
- Backend API endpoint `/api/contracts/health` that wraps the CLI health check
- Custom React hook `useCoverageMetrics` for data fetching
- Integration with existing workbench registration system

**Estimated Effort:** 3-4 hours
**Risk Level:** Low (follows established patterns)

---

## Phase 1: Type System & Backend Foundation

### 1.1 Add 'coverage' WorkbenchId

**File:** `packages/shared/src/workbenchTypes.ts`

**Changes:**
1. Add `'coverage'` to the `WorkbenchId` union type (line 27, after `'canvas'`)
2. Add `'coverage'` to the `WORKBENCH_IDS` array (line 44, after `'canvas'`)
3. Add config entry to `DEFAULT_WORKBENCH_CONFIGS` object:

```typescript
coverage: {
  id: 'coverage',
  label: 'Coverage',
  icon: 'Cg',  // or use ✓ emoji if preferred
  hasNotifications: true,
  notificationCount: 0,
  glowColor: '#00bcd4',  // Cyan, similar to PM workbench
  tooltip: 'Contract coverage and component health monitoring',
  routable: false,  // Not directly routable via orchestrator
  triggers: [],
  flows: [],
  routingExamples: [],
}
```

**Rationale:** This establishes the workbench identity in the shared type system, making it available to both frontend and backend.

---

### 1.2 Create Backend Route: contracts.ts

**File:** `packages/backend/src/routes/contracts.ts` (NEW)

**Implementation:**

```typescript
/**
 * Contracts Health Check API Routes
 * Provides contract validation, health check, and drift detection data
 */

import { Router } from 'express';
import { execSync } from 'child_process';
import { z } from 'zod';
import { sanitizeError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * In-memory cache for health check results
 * TTL: 5 minutes (300000ms)
 */
let cachedHealthCheck: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/contracts/health
 * Returns contract health check results (cached with TTL)
 */
router.get('/health', async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedHealthCheck && (now - cachedHealthCheck.timestamp) < CACHE_TTL) {
      return res.json({
        ...cachedHealthCheck.data,
        cached: true,
        cacheAge: Math.floor((now - cachedHealthCheck.timestamp) / 1000), // seconds
      });
    }

    // Run health check
    const output = execSync('pnpm run health:check:ci', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      timeout: 10000, // 10 second timeout
    });

    const result = JSON.parse(output);

    // Update cache
    cachedHealthCheck = {
      data: result,
      timestamp: now,
    };

    res.json({
      ...result,
      cached: false,
      cacheAge: 0,
    });
  } catch (error) {
    console.error('[API] Contract health check failed:', error);

    // If we have stale cache, return it with warning
    if (cachedHealthCheck) {
      return res.json({
        ...cachedHealthCheck.data,
        cached: true,
        stale: true,
        cacheAge: Math.floor((Date.now() - cachedHealthCheck.timestamp) / 1000),
        error: 'Health check failed, returning stale cache',
      });
    }

    res.status(500).json({
      error: 'Contract health check failed',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/contracts/health/refresh
 * Forces a fresh health check (bypasses cache)
 */
router.post('/health/refresh', async (req, res) => {
  try {
    const output = execSync('pnpm run health:check:ci', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      timeout: 10000,
    });

    const result = JSON.parse(output);

    // Update cache
    cachedHealthCheck = {
      data: result,
      timestamp: Date.now(),
    };

    res.json({
      ...result,
      cached: false,
      refreshed: true,
    });
  } catch (error) {
    console.error('[API] Contract health check refresh failed:', error);
    res.status(500).json({
      error: 'Contract health check refresh failed',
      message: sanitizeError(error),
    });
  }
});

export default router;
```

**Key Design Decisions:**
- **Caching strategy:** 5-minute TTL prevents excessive CLI executions
- **Graceful degradation:** Returns stale cache if refresh fails
- **Refresh endpoint:** Allows manual cache invalidation
- **Timeout protection:** 10-second timeout prevents hanging requests

---

### 1.3 Register Backend Route

**File:** `packages/backend/src/index.ts`

**Changes:**
1. Import the contracts router:
```typescript
import contractsRouter from './routes/contracts.js';
```

2. Register the route (add after harmony route registration, around line ~100):
```typescript
app.use('/api/contracts', contractsRouter);
```

**Validation:** Check that the route is mounted correctly by examining the Express middleware stack.

---

## Phase 2: Frontend Data Layer

### 2.1 Create useCoverageMetrics Hook

**File:** `packages/app/src/hooks/useCoverageMetrics.ts` (NEW)

**Implementation:**

```typescript
/**
 * Hook for fetching and subscribing to contract coverage metrics
 * Follows the pattern of useHarmonyMetrics
 */

import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Contract detail from health check
 */
export interface ContractDetail {
  filePath: string;
  name: string;
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  healthChecks: number;
}

/**
 * Coverage metrics response
 */
export interface CoverageMetrics {
  passed: boolean;
  timestamp: string;
  summary: {
    totalContracts: number;
    validContracts: number;
    warningContracts: number;
    errorContracts: number;
    totalHealthChecks: number;
    componentCoverage: number;
  };
  details: {
    errors: ContractDetail[];
    warnings: ContractDetail[];
    valid: ContractDetail[];
  };
  cached?: boolean;
  stale?: boolean;
  cacheAge?: number;
}

/**
 * Hook to fetch and manage contract coverage metrics
 */
export function useCoverageMetrics() {
  const [metrics, setMetrics] = useState<CoverageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { onEvent } = useWebSocketContext();

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/contracts/health`);

      if (!response.ok) {
        throw new Error(`Failed to fetch coverage metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh (bypasses cache)
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/contracts/health/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh coverage metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [fetchMetrics]);

  // Subscribe to WebSocket updates (future: contract:health:updated event)
  useEffect(() => {
    if (!onEvent) return;

    const handleEvent = (event: any) => {
      if (event.type === 'contract:health:updated') {
        fetchMetrics();
      }
    };

    const unregister = onEvent(handleEvent);
    return () => unregister();
  }, [onEvent, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastRefresh,
    refresh,
    fetchMetrics,
  };
}
```

**Key Features:**
- Automatic 5-minute refresh cycle
- Manual refresh capability (bypasses cache)
- WebSocket subscription for real-time updates (future)
- Tracks last refresh timestamp
- Error handling with graceful degradation

---

## Phase 3: UI Components

### 3.1 Create CoverageWorkbench Component

**File:** `packages/app/src/components/Workbench/CoverageWorkbench.tsx` (NEW)

**Component Structure:**
```
CoverageWorkbench
  ├── Header (title, refresh button, DiscussButton)
  ├── Summary Cards Row
  │   ├── TotalContractsCard
  │   ├── CoveragePercentageCard
  │   ├── ValidationStatusCard
  │   └── HealthChecksCard
  ├── Tabs Container
  │   ├── Tab: Contracts (table with search/filter)
  │   ├── Tab: Drift Detection
  │   └── Tab: Health Checks
  └── DiscussDialog
```

**Implementation:**

```typescript
/**
 * CoverageWorkbench Component
 * Dashboard for monitoring behavioral contract coverage and component health
 *
 * Features:
 * - Summary cards showing key metrics
 * - Tabbed interface for contracts, drift detection, and health checks
 * - Search and filter capabilities
 * - Manual refresh with cache info
 * - DiscussButton integration
 */

import React, { useState, useMemo } from 'react';
import { useCoverageMetrics } from '../../hooks/useCoverageMetrics';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import type { ContractDetail } from '../../hooks/useCoverageMetrics';
import './CoverageWorkbench.css';

type TabId = 'contracts' | 'drift' | 'health';
type FilterMode = 'all' | 'valid' | 'warnings' | 'errors';

export interface CoverageWorkbenchProps {
  // No required props for now
}

/**
 * Summary Card Component
 */
interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue';
  loading?: boolean;
}

function SummaryCard({ title, value, subtitle, color = 'blue', loading }: SummaryCardProps) {
  return (
    <div className={`coverage-summary-card coverage-summary-card--${color}`}>
      {loading ? (
        <div className="coverage-summary-card__loading">Loading...</div>
      ) : (
        <>
          <div className="coverage-summary-card__title">{title}</div>
          <div className="coverage-summary-card__value">{value}</div>
          {subtitle && <div className="coverage-summary-card__subtitle">{subtitle}</div>}
        </>
      )}
    </div>
  );
}

/**
 * Contract Row Component
 */
interface ContractRowProps {
  contract: ContractDetail;
  onViewDetails: (contract: ContractDetail) => void;
}

function ContractRow({ contract, onViewDetails }: ContractRowProps) {
  const statusColor = contract.valid
    ? contract.warnings.length > 0
      ? 'yellow'
      : 'green'
    : 'red';

  const statusText = contract.valid
    ? contract.warnings.length > 0
      ? 'Valid (Warnings)'
      : 'Valid'
    : 'Invalid';

  return (
    <tr className="coverage-contract-row">
      <td className="coverage-contract-row__name">{contract.name}</td>
      <td className={`coverage-contract-row__status coverage-contract-row__status--${statusColor}`}>
        {statusText}
      </td>
      <td className="coverage-contract-row__health-checks">{contract.healthChecks}</td>
      <td className="coverage-contract-row__errors">{contract.errors.length}</td>
      <td className="coverage-contract-row__warnings">{contract.warnings.length}</td>
      <td className="coverage-contract-row__actions">
        <button
          className="coverage-contract-row__view-btn"
          onClick={() => onViewDetails(contract)}
        >
          View
        </button>
      </td>
    </tr>
  );
}

/**
 * Main CoverageWorkbench Component
 */
export function CoverageWorkbench({}: CoverageWorkbenchProps): React.ReactElement {
  const { metrics, loading, error, lastRefresh, refresh } = useCoverageMetrics();

  const [activeTab, setActiveTab] = useState<TabId>('contracts');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<ContractDetail | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'CoverageWorkbench',
    getContext: () => ({
      coverage: metrics?.summary.componentCoverage ?? 0,
      totalContracts: metrics?.summary.totalContracts ?? 0,
      errorCount: metrics?.summary.errorContracts ?? 0,
      activeTab,
    }),
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  // Filter contracts based on mode and search
  const filteredContracts = useMemo(() => {
    if (!metrics) return [];

    let contracts: ContractDetail[] = [];

    switch (filterMode) {
      case 'valid':
        contracts = metrics.details.valid;
        break;
      case 'warnings':
        contracts = metrics.details.warnings;
        break;
      case 'errors':
        contracts = metrics.details.errors;
        break;
      default:
        contracts = [
          ...metrics.details.valid,
          ...metrics.details.warnings,
          ...metrics.details.errors,
        ];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      contracts = contracts.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.filePath.toLowerCase().includes(query)
      );
    }

    return contracts;
  }, [metrics, filterMode, searchQuery]);

  // Calculate coverage color
  const getCoverageColor = () => {
    if (!metrics) return 'blue';
    const coverage = metrics.summary.componentCoverage;
    if (coverage >= 80) return 'green';
    if (coverage >= 50) return 'yellow';
    return 'red';
  };

  // Render loading state
  if (loading && !metrics) {
    return (
      <div className="coverage-workbench">
        <header className="coverage-workbench__header">
          <h1>Contract Coverage Dashboard</h1>
        </header>
        <div className="coverage-workbench__loading">Loading coverage metrics...</div>
      </div>
    );
  }

  // Render error state
  if (error && !metrics) {
    return (
      <div className="coverage-workbench">
        <header className="coverage-workbench__header">
          <h1>Contract Coverage Dashboard</h1>
        </header>
        <div className="coverage-workbench__error">
          <p>Failed to load coverage metrics</p>
          <p className="coverage-workbench__error-details">{error}</p>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      </div>
    );
  }

  if (!metrics) return <div>No data available</div>;

  return (
    <div className="coverage-workbench">
      {/* Header */}
      <header className="coverage-workbench__header">
        <div className="coverage-workbench__header-left">
          <h1>Contract Coverage Dashboard</h1>
          {lastRefresh && (
            <span className="coverage-workbench__last-refresh">
              Last updated: {lastRefresh.toLocaleTimeString()}
              {metrics.cached && ` (cached ${metrics.cacheAge}s ago)`}
              {metrics.stale && <span className="coverage-workbench__stale-badge">Stale</span>}
            </span>
          )}
        </div>
        <div className="coverage-workbench__header-actions">
          <button
            className="coverage-workbench__refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <DiscussButton componentName="CoverageWorkbench" onClick={openDialog} size="small" />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="coverage-workbench__summary">
        <SummaryCard
          title="Total Contracts"
          value={metrics.summary.totalContracts}
          subtitle="behavioral contracts"
          color="blue"
        />
        <SummaryCard
          title="Component Coverage"
          value={`${metrics.summary.componentCoverage.toFixed(1)}%`}
          subtitle="of components have contracts"
          color={getCoverageColor()}
        />
        <SummaryCard
          title="Validation Status"
          value={metrics.summary.validContracts}
          subtitle={`${metrics.summary.errorContracts} errors, ${metrics.summary.warningContracts} warnings`}
          color={metrics.summary.errorContracts > 0 ? 'red' : 'green'}
        />
        <SummaryCard
          title="Health Checks"
          value={metrics.summary.totalHealthChecks}
          subtitle="critical health checks"
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="coverage-workbench__tabs">
        <div className="coverage-workbench__tab-buttons">
          <button
            className={`coverage-workbench__tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contracts')}
          >
            Contracts ({filteredContracts.length})
          </button>
          <button
            className={`coverage-workbench__tab-btn ${activeTab === 'drift' ? 'active' : ''}`}
            onClick={() => setActiveTab('drift')}
          >
            Drift Detection
          </button>
          <button
            className={`coverage-workbench__tab-btn ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            Health Checks
          </button>
        </div>

        {/* Tab Content */}
        <div className="coverage-workbench__tab-content">
          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="coverage-contracts-tab">
              {/* Filters */}
              <div className="coverage-contracts-tab__filters">
                <div className="coverage-contracts-tab__filter-buttons">
                  <button
                    className={filterMode === 'all' ? 'active' : ''}
                    onClick={() => setFilterMode('all')}
                  >
                    All
                  </button>
                  <button
                    className={filterMode === 'valid' ? 'active' : ''}
                    onClick={() => setFilterMode('valid')}
                  >
                    Valid ({metrics.details.valid.length})
                  </button>
                  <button
                    className={filterMode === 'warnings' ? 'active' : ''}
                    onClick={() => setFilterMode('warnings')}
                  >
                    Warnings ({metrics.details.warnings.length})
                  </button>
                  <button
                    className={filterMode === 'errors' ? 'active' : ''}
                    onClick={() => setFilterMode('errors')}
                  >
                    Errors ({metrics.details.errors.length})
                  </button>
                </div>
                <input
                  type="text"
                  className="coverage-contracts-tab__search"
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Table */}
              <div className="coverage-contracts-tab__table-container">
                <table className="coverage-contracts-table">
                  <thead>
                    <tr>
                      <th>Component Name</th>
                      <th>Status</th>
                      <th>Health Checks</th>
                      <th>Errors</th>
                      <th>Warnings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract, idx) => (
                      <ContractRow
                        key={`${contract.name}-${idx}`}
                        contract={contract}
                        onViewDetails={setSelectedContract}
                      />
                    ))}
                  </tbody>
                </table>
                {filteredContracts.length === 0 && (
                  <div className="coverage-contracts-tab__empty">
                    No contracts match your filters
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drift Tab */}
          {activeTab === 'drift' && (
            <div className="coverage-drift-tab">
              <p className="coverage-drift-tab__placeholder">
                Drift detection coming soon. This will show components without contracts.
              </p>
            </div>
          )}

          {/* Health Checks Tab */}
          {activeTab === 'health' && (
            <div className="coverage-health-tab">
              <p className="coverage-health-tab__placeholder">
                Health checks panel coming soon. This will show automated health check results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="coverage-contract-modal-backdrop" onClick={() => setSelectedContract(null)}>
          <div className="coverage-contract-modal" onClick={(e) => e.stopPropagation()}>
            <header className="coverage-contract-modal__header">
              <h2>{selectedContract.name}</h2>
              <button onClick={() => setSelectedContract(null)}>✕</button>
            </header>
            <div className="coverage-contract-modal__body">
              <div className="coverage-contract-modal__section">
                <h3>File Path</h3>
                <code>{selectedContract.filePath}</code>
              </div>
              <div className="coverage-contract-modal__section">
                <h3>Validation Status</h3>
                <p className={`status-badge status-badge--${selectedContract.valid ? 'green' : 'red'}`}>
                  {selectedContract.valid ? 'Valid' : 'Invalid'}
                </p>
              </div>
              {selectedContract.errors.length > 0 && (
                <div className="coverage-contract-modal__section">
                  <h3>Errors ({selectedContract.errors.length})</h3>
                  <ul>
                    {selectedContract.errors.map((err, idx) => (
                      <li key={idx} className="coverage-contract-modal__error">
                        <strong>{err.field}:</strong> {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedContract.warnings.length > 0 && (
                <div className="coverage-contract-modal__section">
                  <h3>Warnings ({selectedContract.warnings.length})</h3>
                  <ul>
                    {selectedContract.warnings.map((warn, idx) => (
                      <li key={idx} className="coverage-contract-modal__warning">
                        <strong>{warn.field}:</strong> {warn.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="coverage-contract-modal__section">
                <h3>Health Checks</h3>
                <p>{selectedContract.healthChecks} critical checks defined</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discuss Dialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="CoverageWorkbench"
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
```

**Component Features:**
- Summary cards showing key metrics at a glance
- Tabbed interface for organizing content
- Search and filter capabilities for contracts list
- Modal for viewing contract details
- Manual refresh with loading state
- Cache status indicator
- DiscussButton integration

---

### 3.2 Create CoverageWorkbench Styles

**File:** `packages/app/src/components/Workbench/CoverageWorkbench.css` (NEW)

**Implementation:**

```css
/**
 * CoverageWorkbench Styles
 * Design follows HarmonyWorkbench pattern with summary cards and tabbed content
 */

.coverage-workbench {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--background-primary);
}

/* ============================================================================
   Header
   ============================================================================ */

.coverage-workbench__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--background-secondary);
}

.coverage-workbench__header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coverage-workbench__header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.coverage-workbench__last-refresh {
  font-size: 12px;
  color: var(--text-tertiary);
}

.coverage-workbench__stale-badge {
  margin-left: 8px;
  padding: 2px 6px;
  background: var(--system-yellow);
  color: var(--background-primary);
  border-radius: 4px;
  font-weight: 600;
  font-size: 10px;
}

.coverage-workbench__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coverage-workbench__refresh-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.coverage-workbench__refresh-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.coverage-workbench__refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================================
   Summary Cards
   ============================================================================ */

.coverage-workbench__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 24px;
  background: var(--background-primary);
}

.coverage-summary-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 8px;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.coverage-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.coverage-summary-card__title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.coverage-summary-card__value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.coverage-summary-card__subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Color variants */
.coverage-summary-card--green .coverage-summary-card__value {
  color: var(--system-green);
}

.coverage-summary-card--yellow .coverage-summary-card__value {
  color: var(--system-yellow);
}

.coverage-summary-card--red .coverage-summary-card__value {
  color: var(--system-red);
}

.coverage-summary-card--blue .coverage-summary-card__value {
  color: var(--primary-color);
}

.coverage-summary-card__loading {
  font-size: 14px;
  color: var(--text-tertiary);
  padding: 20px 0;
  text-align: center;
}

/* ============================================================================
   Tabs
   ============================================================================ */

.coverage-workbench__tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--background-primary);
}

.coverage-workbench__tab-buttons {
  display: flex;
  gap: 2px;
  padding: 0 24px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.coverage-workbench__tab-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.coverage-workbench__tab-btn:hover {
  color: var(--text-primary);
  background: var(--background-hover);
}

.coverage-workbench__tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.coverage-workbench__tab-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

/* ============================================================================
   Contracts Tab
   ============================================================================ */

.coverage-contracts-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.coverage-contracts-tab__filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.coverage-contracts-tab__filter-buttons {
  display: flex;
  gap: 8px;
}

.coverage-contracts-tab__filter-buttons button {
  padding: 8px 16px;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.coverage-contracts-tab__filter-buttons button:hover {
  background: var(--background-hover);
  color: var(--text-primary);
}

.coverage-contracts-tab__filter-buttons button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.coverage-contracts-tab__search {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.coverage-contracts-tab__search:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Table */
.coverage-contracts-tab__table-container {
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.coverage-contracts-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--background-secondary);
}

.coverage-contracts-table thead {
  background: var(--background-tertiary);
  position: sticky;
  top: 0;
  z-index: 1;
}

.coverage-contracts-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.coverage-contracts-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.coverage-contracts-table tbody tr:hover {
  background: var(--background-hover);
}

.coverage-contract-row td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-primary);
}

.coverage-contract-row__name {
  font-weight: 500;
}

.coverage-contract-row__status {
  font-weight: 600;
}

.coverage-contract-row__status--green {
  color: var(--system-green);
}

.coverage-contract-row__status--yellow {
  color: var(--system-yellow);
}

.coverage-contract-row__status--red {
  color: var(--system-red);
}

.coverage-contract-row__view-btn {
  padding: 6px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.coverage-contract-row__view-btn:hover {
  background: var(--primary-hover);
}

.coverage-contracts-tab__empty {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

/* ============================================================================
   Contract Details Modal
   ============================================================================ */

.coverage-contract-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.coverage-contract-modal {
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  background: var(--background-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.coverage-contract-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--background-tertiary);
}

.coverage-contract-modal__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.coverage-contract-modal__header button {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.coverage-contract-modal__header button:hover {
  background: var(--background-hover);
  color: var(--text-primary);
}

.coverage-contract-modal__body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.coverage-contract-modal__section {
  margin-bottom: 24px;
}

.coverage-contract-modal__section:last-child {
  margin-bottom: 0;
}

.coverage-contract-modal__section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.coverage-contract-modal__section code {
  display: block;
  padding: 12px;
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.coverage-contract-modal__section ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.coverage-contract-modal__section li {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: var(--background-primary);
  border-radius: 6px;
  font-size: 13px;
}

.coverage-contract-modal__error {
  border-left: 3px solid var(--system-red);
}

.coverage-contract-modal__warning {
  border-left: 3px solid var(--system-yellow);
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge--green {
  background: rgba(76, 175, 80, 0.2);
  color: var(--system-green);
}

.status-badge--red {
  background: rgba(244, 67, 54, 0.2);
  color: var(--system-red);
}

/* ============================================================================
   Placeholder Tabs
   ============================================================================ */

.coverage-drift-tab__placeholder,
.coverage-health-tab__placeholder {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

/* ============================================================================
   Loading & Error States
   ============================================================================ */

.coverage-workbench__loading,
.coverage-workbench__error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.coverage-workbench__error {
  color: var(--system-red);
}

.coverage-workbench__error-details {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: monospace;
}

.coverage-workbench__error button {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.coverage-workbench__error button:hover {
  background: var(--primary-hover);
}
```

**Style Features:**
- Follows existing workbench visual language
- CSS custom properties for theming
- Responsive grid layout
- Smooth transitions and hover states
- Color-coded status indicators
- Accessible focus states

---

## Phase 4: Workbench Registration

### 4.1 Update AppSidebar Navigation

**File:** `packages/app/src/components/AppSidebar/AppSidebar.tsx`

**Change:** Add `'coverage'` to the management group workbenches array (line 39):

```typescript
management: {
  id: 'management',
  label: 'Management',
  icon: 'M',
  workbenches: ['pm', 'archive', 'harmony', 'respect', 'coverage'],  // Add 'coverage' here
  defaultExpanded: false,
}
```

**Rationale:** Places the Coverage workbench in the Management group alongside Harmony, PM, Archive, and Respect.

---

### 4.2 Register Component in WorkbenchLayout

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

**Changes:**

1. Import the component (add after line 16):
```typescript
import { CoverageWorkbench } from './CoverageWorkbench';
```

2. Add case to `renderWorkbenchContent()` switch statement (after the `respect` case, around line ~220):
```typescript
case 'coverage':
  return <CoverageWorkbench />;
```

**Rationale:** Mounts the CoverageWorkbench when the coverage workbench is active.

---

### 4.3 Export Component from Index

**File:** `packages/app/src/components/Workbench/index.ts`

**Changes:** Add export statements:

```typescript
export { CoverageWorkbench } from './CoverageWorkbench';
export type { CoverageWorkbenchProps } from './CoverageWorkbench';
```

**Rationale:** Makes the component available for import from the Workbench module.

---

## Phase 5: Contract Documentation

### 5.1 Create CoverageWorkbench Contract

**File:** `packages/app/src/contracts/components/Workbench/CoverageWorkbench.contract.md` (NEW)

**Content:**

```markdown
# CoverageWorkbench Component Contract

**Status:** Active
**Version:** 1.0.0
**Last Updated:** 2026-02-10
**Owner:** ActionFlows Dashboard Team

---

## Identity

**Component Name:** CoverageWorkbench
**File Location:** `packages/app/src/components/Workbench/CoverageWorkbench.tsx`
**Parent Component:** WorkbenchLayout
**Component Type:** Workbench (Top-level feature container)

**Purpose:**
Provides a dashboard for monitoring behavioral contract coverage, validation status, drift detection, and component health metrics across the ActionFlows Dashboard codebase.

---

## Render Location

**Mounted By:** WorkbenchLayout
**Mount Condition:** When `activeWorkbench === 'coverage'`
**Z-Index Layer:** Workbench content layer (z-index: 1)

**Container Dimensions:**
- Width: 100% of workbench content area
- Height: 100% of available viewport height (minus header)
- Overflow: Controlled by internal scroll containers

---

## Lifecycle

**Mount Triggers:**
- User clicks "Coverage" in sidebar navigation
- Direct navigation to coverage workbench via routing

**Unmount Triggers:**
- User switches to different workbench
- Application shutdown

**Initialization:**
1. Mount component
2. useCoverageMetrics hook fetches cached health check data
3. Render summary cards with metrics
4. Display contracts table with default "all" filter

**Cleanup:**
- WebSocket subscription cleanup (future)
- Abort in-flight fetch requests

---

## Props Contract

```typescript
export interface CoverageWorkbenchProps {
  // No required props — workbench is self-contained
}
```

**No Props Required:**
This workbench is stateless from the parent's perspective. All state is managed internally via hooks.

---

## State Ownership

### Local State (Component-owned)

1. **activeTab: TabId**
   - Controls which tab content is displayed ('contracts' | 'drift' | 'health')
   - Default: 'contracts'

2. **filterMode: FilterMode**
   - Controls contract list filtering ('all' | 'valid' | 'warnings' | 'errors')
   - Default: 'all'

3. **searchQuery: string**
   - Search text for filtering contracts by name or path
   - Default: ''

4. **selectedContract: ContractDetail | null**
   - Currently selected contract for detail view modal
   - Default: null

5. **isRefreshing: boolean**
   - Tracks manual refresh operation state
   - Default: false

### Hook-Managed State (useCoverageMetrics)

1. **metrics: CoverageMetrics | null**
   - Full health check results from backend
   - Source: `/api/contracts/health`

2. **loading: boolean**
   - Loading state for data fetching

3. **error: string | null**
   - Error message if fetch fails

4. **lastRefresh: Date | null**
   - Timestamp of last successful data fetch

---

## Interactions

### User Actions

1. **Switch Tab**
   - Trigger: Click tab button
   - Effect: Updates `activeTab`, displays corresponding content

2. **Filter Contracts**
   - Trigger: Click filter button (All/Valid/Warnings/Errors)
   - Effect: Updates `filterMode`, filters displayed contracts

3. **Search Contracts**
   - Trigger: Type in search input
   - Effect: Updates `searchQuery`, filters displayed contracts

4. **View Contract Details**
   - Trigger: Click "View" button on contract row
   - Effect: Sets `selectedContract`, opens modal

5. **Close Modal**
   - Trigger: Click backdrop or close button
   - Effect: Sets `selectedContract` to null

6. **Manual Refresh**
   - Trigger: Click "Refresh" button
   - Effect: Calls `/api/contracts/health/refresh`, bypasses cache

7. **Open DiscussDialog**
   - Trigger: Click DiscussButton
   - Effect: Opens AI assistance dialog with coverage context

### Data Flow

**Inbound:**
- Coverage metrics from `/api/contracts/health` endpoint
- WebSocket events (future): `contract:health:updated`

**Outbound:**
- Manual refresh POST request to `/api/contracts/health/refresh`
- Discuss messages to ChatPanel via handleSendMessage

---

## Side Effects

### API Calls

1. **GET /api/contracts/health** (automatic)
   - Frequency: On mount + every 5 minutes
   - Response: Cached health check results with TTL

2. **POST /api/contracts/health/refresh** (manual)
   - Frequency: User-triggered only
   - Response: Fresh health check results, cache invalidated

### WebSocket Subscriptions

- Event: `contract:health:updated` (future)
- Handler: Triggers automatic data refresh

### Local Storage

- None

---

## Test Hooks

### Data Attributes

- `data-testid="coverage-workbench"` on root element
- `data-testid="coverage-summary-card-{metric}"` on summary cards
- `data-testid="coverage-tab-{id}"` on tab buttons
- `data-testid="coverage-contract-row-{name}"` on table rows
- `data-testid="coverage-contract-modal"` on detail modal

### CSS Selectors

- `.coverage-workbench` - Root container
- `.coverage-summary-card` - Summary card
- `.coverage-contracts-table` - Main table
- `.coverage-contract-modal` - Detail modal

---

## Health Checks

### Critical Health Checks

1. **API Connectivity**
   ```bash
   curl http://localhost:3001/api/contracts/health
   # Expected: 200 OK with JSON response
   ```

2. **Data Freshness**
   ```bash
   # Check cacheAge in response
   # Warning if > 600 seconds (10 minutes)
   # Error if stale flag is true
   ```

3. **Component Mount**
   ```typescript
   // Verify component renders without errors
   const element = screen.getByTestId('coverage-workbench');
   expect(element).toBeInTheDocument();
   ```

4. **Tab Navigation**
   ```typescript
   // Verify all tabs are accessible
   const tabs = screen.getAllByRole('button', { name: /contracts|drift|health/i });
   expect(tabs).toHaveLength(3);
   ```

### Degraded States

- **Stale Cache:** Display warning badge, allow manual refresh
- **Fetch Error:** Show error message with retry button
- **No Data:** Display empty state with refresh prompt

### Automation Scripts

```bash
# Run full health check
pnpm run health:check:ci

# Check API endpoint
curl -I http://localhost:3001/api/contracts/health

# Validate component rendering (requires test suite)
pnpm test CoverageWorkbench
```

---

## Dependencies

### Runtime Dependencies

**React Hooks:**
- `useState` - Local state management
- `useMemo` - Contract filtering memoization
- `useCallback` - Stable function references

**Custom Hooks:**
- `useCoverageMetrics` - Data fetching and caching
- `useDiscussButton` - AI assistance integration
- `useWebSocketContext` - Real-time updates (future)

**Shared Types:**
- `ContractDetail` - Contract validation result type
- `CoverageMetrics` - Full health check response type

**UI Components:**
- `DiscussButton` - AI assistance trigger
- `DiscussDialog` - AI assistance modal

### Backend Dependencies

**API Endpoints:**
- `GET /api/contracts/health` - Fetch cached health check
- `POST /api/contracts/health/refresh` - Force fresh health check

**CLI Scripts:**
- `health:check:ci` - Generates health check JSON

**Shared Validation:**
- `parseAllContracts` - Contract file parser
- `validateAllContracts` - Contract validator
- `detectDrift` - Drift detector

---

## Security Considerations

### XSS Protection
- Contract names and file paths are rendered as text (not HTML)
- Search input is sanitized through React's auto-escaping

### CSRF Protection
- POST /refresh endpoint should include CSRF token (future)
- Currently low-risk (no sensitive mutations)

### Rate Limiting
- Manual refresh button disabled during operation
- Backend should rate-limit refresh endpoint (future)

---

## Performance Considerations

### Optimization Strategies

1. **Memoized Filtering**
   - `useMemo` for contract filtering
   - Prevents re-computation on unrelated re-renders

2. **Virtual Scrolling** (future)
   - For tables with > 100 contracts
   - Reduces DOM node count

3. **Lazy Tab Loading** (future)
   - Load drift/health tab content on-demand
   - Reduces initial render time

### Performance Targets

- **Initial Load:** < 1s (with cached data)
- **Manual Refresh:** < 3s (full health check)
- **Tab Switch:** < 100ms (instant)
- **Search/Filter:** < 50ms (debounced)

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter**: Activate buttons/links
- **Escape**: Close modal

### Screen Reader Support

- Header structure: h1 > h2 > h3 hierarchy
- Table headers with `<th>` tags
- Button labels via `aria-label`
- Modal with focus trap (future)

### Color Contrast

- Status colors meet WCAG AA standards
- Text on backgrounds: minimum 4.5:1 ratio

---

## Future Enhancements

### Planned Features

1. **Real-time Updates**
   - WebSocket subscription to `contract:health:updated`
   - Live badge updates on contract changes

2. **Drift Detection Tab**
   - List components without contracts
   - Auto-generate contract stubs
   - Track drift over time

3. **Health Checks Tab**
   - Display automated health check results
   - Run health checks on-demand
   - Schedule periodic checks

4. **Contract Comparison**
   - Diff view for contract changes
   - History of contract modifications

5. **Export Reports**
   - Download coverage report as PDF/CSV
   - CI/CD integration metrics

---

## Changelog

### Version 1.0.0 (2026-02-10)
- Initial component creation
- Summary cards with key metrics
- Contracts tab with search/filter
- Contract detail modal
- Manual refresh capability
- DiscussButton integration
```

---

## Phase 6: Testing & Validation

### 6.1 Manual Testing Checklist

**Pre-Flight Checks:**
- [ ] Backend server running on port 3001
- [ ] Frontend dev server running on port 5173
- [ ] Health check CLI produces valid JSON (`pnpm run health:check:ci`)

**Component Testing:**
- [ ] Navigate to Coverage workbench via sidebar
- [ ] Verify all 4 summary cards display correct data
- [ ] Test "Refresh" button triggers data reload
- [ ] Filter contracts by All/Valid/Warnings/Errors
- [ ] Search for specific contract by name
- [ ] Click "View" on a contract row, verify modal opens
- [ ] Close modal via backdrop or X button
- [ ] Switch between tabs (Contracts/Drift/Health)
- [ ] Verify cache status indicator shows age
- [ ] Test DiscussButton opens dialog
- [ ] Check responsive behavior at different viewport sizes

**API Testing:**
- [ ] Verify `/api/contracts/health` returns data
- [ ] Verify `/api/contracts/health/refresh` bypasses cache
- [ ] Check cache TTL works (5 minute expiry)
- [ ] Test error handling when CLI fails
- [ ] Verify stale cache fallback works

**Visual Regression:**
- [ ] Compare styling with HarmonyWorkbench
- [ ] Check dark/light theme compatibility
- [ ] Verify icon and badge colors
- [ ] Test hover states on interactive elements

---

### 6.2 Automated Testing (Future)

**Unit Tests:**
```typescript
// packages/app/src/components/Workbench/__tests__/CoverageWorkbench.test.tsx

describe('CoverageWorkbench', () => {
  it('renders summary cards with metrics', async () => {
    // Mock useCoverageMetrics response
    // Assert 4 summary cards exist
  });

  it('filters contracts by status', () => {
    // Click filter buttons
    // Assert table rows match filter
  });

  it('searches contracts by name', () => {
    // Type in search input
    // Assert filtered results
  });

  it('opens contract detail modal', () => {
    // Click View button
    // Assert modal is visible
  });

  it('handles refresh operation', async () => {
    // Click refresh button
    // Assert loading state
    // Assert new data loaded
  });
});
```

**Integration Tests:**
```bash
# test/e2e/coverage-workbench.spec.ts
# Playwright test for end-to-end coverage workbench flow
```

---

## Phase 7: Deployment

### 7.1 Build & Deploy Steps

```bash
# 1. Type-check
pnpm type-check

# 2. Build all packages
pnpm build

# 3. Run health check to verify CLI works
pnpm run health:check:ci

# 4. Start backend
pnpm dev:backend

# 5. Start frontend (separate terminal)
pnpm dev:app

# 6. Navigate to Coverage workbench and verify
```

---

### 7.2 Rollback Plan

If issues arise:

1. **Revert workbench registration:**
   - Remove `'coverage'` from `WorkbenchId` type
   - Remove case from `WorkbenchLayout`
   - Remove from sidebar group

2. **Disable API endpoint:**
   - Comment out route registration in `index.ts`
   - Leave route file for future use

3. **Hide in production:**
   - Add feature flag to workbench config
   - Set `disabled: true` in `DEFAULT_WORKBENCH_CONFIGS`

---

## Summary of Files

### Files to Create (8 total)

1. `packages/backend/src/routes/contracts.ts` - Backend API route
2. `packages/app/src/hooks/useCoverageMetrics.ts` - Data fetching hook
3. `packages/app/src/components/Workbench/CoverageWorkbench.tsx` - Main component
4. `packages/app/src/components/Workbench/CoverageWorkbench.css` - Component styles
5. `packages/app/src/contracts/components/Workbench/CoverageWorkbench.contract.md` - Behavioral contract
6. `packages/app/src/components/Workbench/__tests__/CoverageWorkbench.test.tsx` - Unit tests (future)
7. `test/e2e/coverage-workbench.spec.ts` - E2E tests (future)
8. `D:/ActionFlowsDashboard/.claude/actionflows/logs/plan/contract-coverage-dashboard_{datetime}/plan.md` - This file

### Files to Modify (5 total)

1. `packages/shared/src/workbenchTypes.ts` - Add 'coverage' to WorkbenchId type + config
2. `packages/app/src/components/AppSidebar/AppSidebar.tsx` - Add to management group
3. `packages/app/src/components/Workbench/WorkbenchLayout.tsx` - Register component
4. `packages/app/src/components/Workbench/index.ts` - Export component
5. `packages/backend/src/index.ts` - Register API route

---

## Implementation Order

**Recommended sequence for low-risk incremental progress:**

1. **Phase 1:** Type system & backend (30 min)
   - Add WorkbenchId type
   - Create backend route
   - Register route in index.ts
   - Test API endpoint manually

2. **Phase 2:** Frontend data layer (20 min)
   - Create useCoverageMetrics hook
   - Test hook with backend API

3. **Phase 3:** UI components (90 min)
   - Create CoverageWorkbench.tsx
   - Create CoverageWorkbench.css
   - Implement summary cards
   - Implement contracts table
   - Implement modal

4. **Phase 4:** Workbench registration (10 min)
   - Update AppSidebar
   - Update WorkbenchLayout
   - Export from index.ts

5. **Phase 5:** Documentation (20 min)
   - Create behavioral contract

6. **Phase 6:** Testing (30 min)
   - Manual testing checklist
   - Fix any issues

**Total Estimated Time:** 3 hours 20 minutes

---

## Risk Assessment

### Low Risk Items
- ✅ Backend API follows established pattern (harmony.ts)
- ✅ Frontend hook follows established pattern (useHarmonyMetrics)
- ✅ Workbench registration is well-documented
- ✅ Health check CLI already produces machine-readable output

### Medium Risk Items
- ⚠️ **Performance:** Health check takes 1-3 seconds
  - Mitigation: Caching with 5-minute TTL
- ⚠️ **Error Handling:** CLI execution might fail
  - Mitigation: Stale cache fallback + error UI

### High Risk Items
- None identified

---

## Success Criteria

1. **Functional:**
   - [ ] Coverage workbench appears in sidebar navigation
   - [ ] Summary cards display accurate metrics
   - [ ] Contracts table shows all contracts with correct status
   - [ ] Search and filter work as expected
   - [ ] Contract detail modal displays validation errors/warnings
   - [ ] Manual refresh updates data

2. **Performance:**
   - [ ] Initial load < 1s with cached data
   - [ ] Manual refresh < 3s
   - [ ] Search/filter < 50ms

3. **Visual:**
   - [ ] Matches HarmonyWorkbench styling patterns
   - [ ] Works in dark and light themes
   - [ ] Responsive at different screen sizes

4. **Integration:**
   - [ ] DiscussButton provides AI assistance
   - [ ] Backend API returns valid data
   - [ ] WebSocket subscription prepared (future)

---

## Learnings

**Issue:** Planning required deep understanding of multiple interconnected systems: workbench registration, sidebar navigation, backend API patterns, and CLI health check system.

**Root Cause:** Contract Coverage Dashboard touches 3 architectural layers (frontend component system, backend API, CLI validation tools) and must integrate with existing patterns.

**Suggestion:** When planning integration features, always map the full data flow from source → backend → frontend → UI. This plan followed the analysis report's recommendations closely, which provided clear architectural guidance.

[FRESH EYE] The analysis report's "hybrid approach" recommendation (backend API + caching + graceful degradation) is excellent. The 5-minute TTL balances performance with data freshness, and the stale cache fallback ensures the UI never breaks even if the CLI fails.

---

**Plan Complete**
