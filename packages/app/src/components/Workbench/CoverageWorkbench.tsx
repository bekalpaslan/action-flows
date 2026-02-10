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
