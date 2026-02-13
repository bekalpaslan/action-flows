import React, { useState, useMemo, useCallback } from 'react';
import { useFlowBrowser, type FlowMetadata } from '../../hooks/useFlowBrowser';
import { useToast } from '../../contexts/ToastContext';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { FlowDetails } from './FlowDetails';
import './FlowBrowser.css';

type SortOption = 'mostUsed' | 'recentlyUpdated' | 'name';
type CategoryFilter = 'all' | 'work' | 'maintenance' | 'explore' | 'review' | 'settings' | 'pm';

interface FlowBrowserProps {
  onFlowSelect?: (flow: FlowMetadata) => void;
}

/**
 * FlowBrowser Component
 * Browse and discover available flows with filtering and search
 * Features:
 * - Grid/list view toggle
 * - Category filter tabs
 * - Tag search/filtering
 * - Sort by: Most Used, Recently Updated, Name
 * - Flow details panel
 * - Execute flow button
 */
export function FlowBrowser({ onFlowSelect }: FlowBrowserProps): React.ReactElement {
  const { flows, loading, error } = useFlowBrowser();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFlow, setSelectedFlow] = useState<FlowMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('mostUsed');

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'FlowBrowser',
    getContext: () => ({
      totalFlows: flows.length,
      viewMode,
      selectedCategory,
      searchQuery,
      selectedTags: Array.from(selectedTags),
      sortBy,
      filteredCount: filteredFlows.length,
    }),
  });

  // Extract all unique tags from flows
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    flows.forEach(flow => {
      flow.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [flows]);

  // Filter flows based on search, category, and tags
  const filteredFlows = useMemo(() => {
    let results = flows;

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(f => f.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        f =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by tags
    if (selectedTags.size > 0) {
      results = results.filter(f =>
        Array.from(selectedTags).some(tag => f.tags.includes(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case 'mostUsed':
        results.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'recentlyUpdated':
        results.sort((a, b) => {
          const aDate = new Date(a.lastUsedAt || '').getTime();
          const bDate = new Date(b.lastUsedAt || '').getTime();
          return bDate - aDate;
        });
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return results;
  }, [flows, selectedCategory, searchQuery, selectedTags, sortBy]);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }, []);

  const handleFlowSelect = useCallback(
    (flow: FlowMetadata) => {
      setSelectedFlow(flow);
      onFlowSelect?.(flow);
    },
    [onFlowSelect]
  );

  const handleExecuteFlow = useCallback(async (flow: FlowMetadata) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/flows/${flow.id}/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to execute flow: ${response.status}`);
      }

      showToast(`Flow "${flow.name}" started`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to execute flow: ${message}`, 'error');
      console.error('[FlowBrowser] Error executing flow:', err);
    }
  }, [showToast]);

  const handleExportFlows = useCallback(() => {
    const dataStr = JSON.stringify(filteredFlows, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flows-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Flows exported', 'success');
  }, [filteredFlows, showToast]);

  if (loading) {
    return (
      <div className="flow-browser loading">
        <div className="loading-spinner">Loading flows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flow-browser error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>Failed to load flows: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-browser">
      {/* Header */}
      <div className="flow-browser__header">
        <div className="flow-browser__header-title">
          <h2>Flow Discovery</h2>
          <span className="flow-browser__count">{filteredFlows.length} flows</span>
        </div>
        <div className="flow-browser__header-controls">
          <button
            className="flow-browser__view-toggle"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? '≡' : '⊞'}
          </button>
          <button
            className="flow-browser__export-button"
            onClick={handleExportFlows}
            title="Export flows as JSON"
          >
            ⬇
          </button>
          <DiscussButton componentName="FlowBrowser" onClick={openDialog} size="small" />
        </div>
      </div>

      {/* Toolbar with search and filters */}
      <div className="flow-browser__toolbar">
        <input
          type="text"
          className="flow-browser__search"
          placeholder="Search flows by name, description, or tags..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="flow-browser__sort"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
        >
          <option value="mostUsed">Most Used</option>
          <option value="recentlyUpdated">Recently Updated</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Category tabs */}
      <div className="flow-browser__categories">
        {(['all', 'work', 'maintenance', 'explore', 'review', 'settings', 'pm'] as const).map(
          category => {
            const count = category === 'all'
              ? flows.length
              : flows.filter(f => f.category === category).length;
            return (
              <button
                key={category}
                className={`flow-browser__category-tab ${
                  selectedCategory === category ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <span className="count">{count}</span>
              </button>
            );
          }
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flow-browser__tags-filter">
          <div className="tags-label">Tags:</div>
          <div className="tags-list">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag ${selectedTags.has(tag) ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flow-browser__content">
        {filteredFlows.length === 0 ? (
          <div className="flow-browser__empty">
            <div className="empty-icon">📭</div>
            <div className="empty-message">No flows match your filters</div>
            <button
              className="empty-reset"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedTags(new Set());
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Main grid/list view */}
            <div className={`flow-browser__list flow-browser__list--${viewMode}`}>
              {filteredFlows.map(flow => (
                <div
                  key={flow.id}
                  className={`flow-card ${selectedFlow?.id === flow.id ? 'active' : ''}`}
                  onClick={() => handleFlowSelect(flow)}
                >
                  <div className="flow-card__header">
                    <h3 className="flow-card__title">{flow.name}</h3>
                    <span className="flow-card__category-badge">{flow.category}</span>
                  </div>
                  <p className="flow-card__description">{flow.description}</p>
                  <div className="flow-card__tags">
                    {flow.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag-small">
                        {tag}
                      </span>
                    ))}
                    {flow.tags.length > 3 && (
                      <span className="tag-small">+{flow.tags.length - 3}</span>
                    )}
                  </div>
                  <div className="flow-card__stats">
                    <div className="stat">
                      <span className="stat-label">Used</span>
                      <span className="stat-value">{flow.usageCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Success</span>
                      <span className="stat-value">{(flow.successRate * 100).toFixed(0)}%</span>
                    </div>
                    {flow.lastUsedAt && (
                      <div className="stat">
                        <span className="stat-label">Last Used</span>
                        <span className="stat-value">
                          {new Date(flow.lastUsedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Details panel */}
            {selectedFlow && (
              <div className="flow-browser__details-panel">
                <FlowDetails
                  flow={selectedFlow}
                  onExecute={handleExecuteFlow}
                  onClose={() => setSelectedFlow(null)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="FlowBrowser"
        componentContext={{
          totalFlows: flows.length,
          viewMode,
          selectedCategory,
          searchQuery,
          selectedTags: Array.from(selectedTags),
          sortBy,
          filteredCount: filteredFlows.length,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
