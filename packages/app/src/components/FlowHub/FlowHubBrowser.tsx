import { useState, useCallback, useMemo } from 'react';
import type { FlowHubEntry, FlowSource } from '@afw/shared';
import { useFlowHub } from '../../hooks/useFlowHub';
import { FlowCard } from './FlowCard';
import { FlowDetails } from './FlowDetails';
import { InstallFlowDialog } from './InstallFlowDialog';
import './FlowHub.css';

type SortOption = 'downloads' | 'rating' | 'name' | 'recent';

/**
 * FlowHub browser UI for browsing and installing flows.
 * Features: search, filters (category, source, installed status), sort options
 * Shows: grid of flow cards, empty state, loading state
 */
export function FlowHubBrowser() {
  const { flows, loading, error, installFlow, uninstallFlow } = useFlowHub();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<FlowSource | 'all'>('all');
  const [installedFilter, setInstalledFilter] = useState<'all' | 'installed' | 'not-installed'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');
  const [selectedFlow, setSelectedFlow] = useState<FlowHubEntry | null>(null);
  const [installDialogFlow, setInstallDialogFlow] = useState<FlowHubEntry | null>(null);

  // Get unique categories from flows
  const categories = useMemo(() => {
    const cats = new Set<string>();
    flows.forEach(flow => flow.categories.forEach(cat => cats.add(cat)));
    return Array.from(cats).sort();
  }, [flows]);

  // Filter and sort flows
  const filteredFlows = useMemo(() => {
    let result = flows;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        flow =>
          flow.name.toLowerCase().includes(query) ||
          flow.description.toLowerCase().includes(query) ||
          flow.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(flow => flow.categories.includes(categoryFilter));
    }

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter(flow => flow.source === sourceFilter);
    }

    // Installed filter
    if (installedFilter !== 'all') {
      result = result.filter(flow => {
        const isInstalled = flow.source === 'local';
        return installedFilter === 'installed' ? isInstalled : !isInstalled;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [flows, searchQuery, categoryFilter, sourceFilter, installedFilter, sortBy]);

  const handleViewDetails = useCallback((flow: FlowHubEntry) => {
    setSelectedFlow(flow);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedFlow(null);
  }, []);

  const handleInstallClick = useCallback(
    (flowId: string) => {
      const flow = flows.find(f => f.flowId === flowId);
      if (flow) {
        setInstallDialogFlow(flow);
      }
    },
    [flows]
  );

  const handleConfirmInstall = useCallback(
    async (overrideExisting: boolean) => {
      if (!installDialogFlow) return;

      const result = await installFlow(installDialogFlow.flowId, { overrideExisting });
      setInstallDialogFlow(null);

      if (result?.success) {
        console.log('[FlowHubBrowser] Flow installed successfully:', result);
      } else {
        console.error('[FlowHubBrowser] Flow installation failed:', result?.errors);
      }
    },
    [installDialogFlow, installFlow]
  );

  const handleCancelInstall = useCallback(() => {
    setInstallDialogFlow(null);
  }, []);

  const handleUninstall = useCallback(
    async (flowId: string) => {
      const success = await uninstallFlow(flowId);
      if (success) {
        console.log('[FlowHubBrowser] Flow uninstalled successfully');
        setSelectedFlow(null);
      } else {
        console.error('[FlowHubBrowser] Flow uninstall failed');
      }
    },
    [uninstallFlow]
  );

  const isFlowInstalled = useCallback((flow: FlowHubEntry): boolean => {
    return flow.source === 'local';
  }, []);

  if (loading) {
    return (
      <div className="flow-hub-browser loading">
        <div className="loading-spinner">Loading flows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flow-hub-browser error">
        <div className="error-message">
          <span className="error-icon">⚠</span>
          <p>Error loading flows: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-hub-browser">
      <div className="flow-hub-header">
        <h2>FlowHub Browser</h2>
        <div className="flow-hub-stats">
          <span className="stat-badge">{flows.length} flows available</span>
          <span className="stat-badge">{flows.filter(f => f.source === 'local').length} installed</span>
        </div>
      </div>

      <div className="flow-hub-toolbar">
        <input
          type="text"
          className="flow-search-input"
          placeholder="Search flows by name, description, or tags..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flow-hub-filters">
        <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as FlowSource | 'all')}
        >
          <option value="all">All Sources</option>
          <option value="local">Local</option>
          <option value="flow-hub">FlowHub</option>
          <option value="community">Community</option>
        </select>

        <select className="filter-select" value={installedFilter} onChange={e => setInstalledFilter(e.target.value as any)}>
          <option value="all">All Flows</option>
          <option value="installed">Installed Only</option>
          <option value="not-installed">Not Installed</option>
        </select>

        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
          <option value="downloads">Most Downloads</option>
          <option value="rating">Highest Rated</option>
          <option value="name">Name (A-Z)</option>
          <option value="recent">Recently Updated</option>
        </select>
      </div>

      <div className="flow-hub-content">
        {filteredFlows.length === 0 ? (
          <div className="empty-state">
            <p>No flows found matching your filters.</p>
          </div>
        ) : (
          <div className="flows-grid">
            {filteredFlows.map(flow => (
              <FlowCard
                key={flow.flowId}
                flow={flow}
                onInstall={handleInstallClick}
                onViewDetails={handleViewDetails}
                isInstalled={isFlowInstalled(flow)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedFlow && (
        <FlowDetails
          flow={selectedFlow}
          onClose={handleCloseDetails}
          onInstall={handleInstallClick}
          onUninstall={handleUninstall}
          isInstalled={isFlowInstalled(selectedFlow)}
        />
      )}

      {installDialogFlow && (
        <InstallFlowDialog
          flow={installDialogFlow}
          onConfirm={handleConfirmInstall}
          onCancel={handleCancelInstall}
          isInstalled={isFlowInstalled(installDialogFlow)}
        />
      )}
    </div>
  );
}
