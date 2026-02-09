import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  RegistryEntry,
  BehaviorPack,
  RegistryFilter,
  RegistryEntryType,
  ProjectId,
} from '@afw/shared';
import { PackCard } from './PackCard';
import { RegistryEntryCard } from './RegistryEntryCard';
import { CustomPromptDialog } from '../CustomPromptButton';
import { useToast } from '../../contexts/ToastContext';
import './RegistryBrowser.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

type SourceFilterType = 'all' | 'core' | 'pack' | 'project';

interface RegistryBrowserProps {
  projectId?: ProjectId;
  onEntrySelect?: (entry: RegistryEntry) => void;
}

/**
 * Browse registry entries and installed behavior packs.
 * Features:
 * - Filter by type (button, pattern, modifier)
 * - Search by name/description
 * - View provenance (which layer defined the entry)
 * - Install/uninstall behavior packs
 */
export function RegistryBrowser({ projectId, onEntrySelect }: RegistryBrowserProps) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [packs, setPacks] = useState<BehaviorPack[]>([]);
  const [filter, setFilter] = useState<RegistryFilter>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'packs'>('entries');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterType>('all');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const entriesUrl = projectId
        ? `${BACKEND_URL}/api/registry/entries?projectId=${projectId}`
        : `${BACKEND_URL}/api/registry/entries`;

      const [entriesRes, packsRes] = await Promise.all([
        fetch(entriesUrl),
        fetch(`${BACKEND_URL}/api/registry/packs`),
      ]);

      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (packsRes.ok) setPacks(await packsRes.json());
    } catch (error) {
      console.error('[RegistryBrowser] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reserved for future pack marketplace/installation UI
  const _handleInstallPack = useCallback(async (pack: BehaviorPack) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/registry/packs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pack),
      });
      if (res.ok) {
        await fetchData(); // Refresh
      }
    } catch (error) {
      console.error('[RegistryBrowser] Failed to install pack:', error);
    }
  }, []);
  void _handleInstallPack; // Suppress unused warning

  const handleUninstallPack = useCallback(async (packId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/registry/packs/${packId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchData(); // Refresh
      }
    } catch (error) {
      console.error('[RegistryBrowser] Failed to uninstall pack:', error);
    }
  }, []);

  const handleToggleEntry = useCallback(async (entryId: string, enabled: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/registry/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setEntries(prev =>
          prev.map(e => e.id === entryId ? { ...e, enabled } : e)
        );
      }
    } catch (error) {
      console.error('[RegistryBrowser] Failed to toggle entry:', error);
    }
  }, []);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${entry.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/registry/entries/${entryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Remove entry from local state
        setEntries(prev => prev.filter(e => e.id !== entryId));
        showToast('Custom prompt deleted', 'success');
        console.log(`[RegistryBrowser] Deleted entry: ${entryId}`);
      } else {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        showToast(`Failed to delete entry: ${error.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('[RegistryBrowser] Failed to delete entry:', error);
      showToast(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [entries, showToast]);

  const handleTogglePack = useCallback(async (packId: string, enabled: boolean) => {
    try {
      const endpoint = enabled
        ? `${BACKEND_URL}/api/registry/packs/${packId}/enable`
        : `${BACKEND_URL}/api/registry/packs/${packId}/disable`;

      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        setPacks(prev =>
          prev.map(p => p.id === packId ? { ...p, enabled } : p)
        );
        // Refresh entries as pack toggle affects entry availability
        await fetchData();
      }
    } catch (error) {
      console.error('[RegistryBrowser] Failed to toggle pack:', error);
    }
  }, []);

  const handleCreateCustomPrompt = useCallback(
    async (
      label: string,
      prompt: string,
      icon?: string,
      contextPatterns?: string[],
      alwaysShow?: boolean
    ) => {
      setIsCreatingPrompt(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/registry/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: label,
            description: `Custom prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
            type: 'custom-prompt',
            source: { type: 'project', projectId: projectId || '' },
            version: '1.0.0',
            status: 'active',
            enabled: true,
            data: {
              type: 'custom-prompt',
              definition: { label, prompt, icon, contextPatterns, alwaysShow },
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(error.error || 'Failed to create custom prompt');
        }

        // Refresh entries list
        await fetchData();
        setShowCustomPromptDialog(false);
        showToast('Custom prompt created!', 'success');
      } catch (error) {
        console.error('[RegistryBrowser] Error creating custom prompt:', error);
        showToast(`Failed to create custom prompt: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        setIsCreatingPrompt(false);
      }
    },
    [projectId, showToast]
  );

  // Filter entries based on current filter + search
  const filteredEntries = useMemo(() => {
    let results = entries;

    if (filter.type) {
      results = results.filter(e => e.type === filter.type);
    }
    if (filter.status) {
      results = results.filter(e => e.status === filter.status);
    }
    if (sourceFilter !== 'all') {
      results = results.filter(e => e.source.type === sourceFilter);
    }
    if (enabledFilter !== 'all') {
      results = results.filter(e =>
        enabledFilter === 'enabled' ? e.enabled : !e.enabled
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }

    return results;
  }, [entries, filter, sourceFilter, enabledFilter, searchQuery]);

  // Group entries by type for categorized display
  const categorizedEntries = useMemo(() => {
    const categories: Record<string, RegistryEntry[]> = {
      button: [],
      pattern: [],
      workflow: [],
      shortcut: [],
      modifier: [],
      pack: [],
      'custom-prompt': [],
    };

    for (const entry of filteredEntries) {
      if (categories[entry.type]) {
        categories[entry.type].push(entry);
      }
    }

    return categories;
  }, [filteredEntries]);

  const typeFilters: { value: RegistryEntryType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'button', label: 'Buttons' },
    { value: 'pattern', label: 'Patterns' },
    { value: 'workflow', label: 'Workflows' },
    { value: 'shortcut', label: 'Shortcuts' },
    { value: 'modifier', label: 'Modifiers' },
    { value: 'custom-prompt', label: 'Custom Prompts' },
  ];

  const sourceFilters: { value: SourceFilterType; label: string }[] = [
    { value: 'all', label: 'All Sources' },
    { value: 'core', label: 'Core' },
    { value: 'pack', label: 'Packs' },
    { value: 'project', label: 'Project' },
  ];

  const enabledFilters: { value: 'all' | 'enabled' | 'disabled'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
  ];

  // Helper to get category counts for section headers
  const getCategoryCount = (type: string) => categorizedEntries[type]?.length ?? 0;

  if (loading) {
    return <div className="registry-browser loading">Loading registry...</div>;
  }

  return (
    <div className="registry-browser">
      <div className="registry-header">
        <h2>Behavior Registry</h2>
        <div className="registry-tabs">
          <button
            className={activeTab === 'entries' ? 'active' : ''}
            onClick={() => setActiveTab('entries')}
          >
            Entries ({entries.length})
          </button>
          <button
            className={activeTab === 'packs' ? 'active' : ''}
            onClick={() => setActiveTab('packs')}
          >
            Packs ({packs.length})
          </button>
        </div>
      </div>

      {activeTab === 'entries' && (
        <>
          <div className="registry-toolbar">
            <button
              className="add-custom-prompt-button"
              onClick={() => setShowCustomPromptDialog(true)}
              title="Create custom prompt button"
            >
              + Custom Prompt
            </button>
          </div>

          <div className="registry-filters">
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as RegistryEntryType || undefined })}
            >
              {typeFilters.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilterType)}
            >
              {sourceFilters.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
            >
              {enabledFilters.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="entries-content">
            {filter.type ? (
              // When a specific type is selected, show flat grid
              <div className="entries-grid">
                {filteredEntries.map(entry => (
                  <RegistryEntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => onEntrySelect?.(entry)}
                    onToggle={(enabled) => handleToggleEntry(entry.id, enabled)}
                    onDelete={handleDeleteEntry}
                  />
                ))}
                {filteredEntries.length === 0 && (
                  <div className="empty-state">No entries match your filter</div>
                )}
              </div>
            ) : (
              // When "All Types" is selected, show categorized view
              <div className="entries-categorized">
                {getCategoryCount('button') > 0 && (
                  <div className="entry-category">
                    <h3 className="category-header">
                      <span className="category-badge badge-button">Buttons</span>
                      <span className="category-count">{getCategoryCount('button')}</span>
                    </h3>
                    <div className="entries-grid">
                      {categorizedEntries.button.map(entry => (
                        <RegistryEntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => onEntrySelect?.(entry)}
                          onToggle={(enabled) => handleToggleEntry(entry.id, enabled)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {getCategoryCount('pattern') > 0 && (
                  <div className="entry-category">
                    <h3 className="category-header">
                      <span className="category-badge badge-pattern">Patterns</span>
                      <span className="category-count">{getCategoryCount('pattern')}</span>
                    </h3>
                    <div className="entries-grid">
                      {categorizedEntries.pattern.map(entry => (
                        <RegistryEntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => onEntrySelect?.(entry)}
                          onToggle={(enabled) => handleToggleEntry(entry.id, enabled)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {getCategoryCount('workflow') > 0 && (
                  <div className="entry-category">
                    <h3 className="category-header">
                      <span className="category-badge badge-workflow">Workflows</span>
                      <span className="category-count">{getCategoryCount('workflow')}</span>
                    </h3>
                    <div className="entries-grid">
                      {categorizedEntries.workflow.map(entry => (
                        <RegistryEntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => onEntrySelect?.(entry)}
                          onToggle={(enabled) => handleToggleEntry(entry.id, enabled)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {getCategoryCount('shortcut') > 0 && (
                  <div className="entry-category">
                    <h3 className="category-header">
                      <span className="category-badge badge-shortcut">Shortcuts</span>
                      <span className="category-count">{getCategoryCount('shortcut')}</span>
                    </h3>
                    <div className="entries-grid">
                      {categorizedEntries.shortcut.map(entry => (
                        <RegistryEntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => onEntrySelect?.(entry)}
                          onToggle={(enabled) => handleToggleEntry(entry.id, enabled)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {getCategoryCount('custom-prompt') > 0 && (
                  <div className="entry-category">
                    <h3 className="category-header">
                      <span className="category-badge badge-custom-prompt">Custom Prompts</span>
                      <span className="category-count">{getCategoryCount('custom-prompt')}</span>
                    </h3>
                    <div className="entries-grid">
                      {categorizedEntries['custom-prompt'].map(entry => (
                        <RegistryEntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => onEntrySelect?.(entry)}
                          onToggle={(enabled) => handleToggleEntry(entry.id, enabled)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {filteredEntries.length === 0 && (
                  <div className="empty-state">No entries match your filter</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'packs' && (
        <div className="packs-grid">
          {packs.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              onToggle={(enabled) => handleTogglePack(pack.id, enabled)}
              onUninstall={() => handleUninstallPack(pack.id)}
            />
          ))}
          {packs.length === 0 && (
            <div className="empty-state">No behavior packs installed</div>
          )}
        </div>
      )}

      {showCustomPromptDialog && (
        <CustomPromptDialog
          onSubmit={handleCreateCustomPrompt}
          onCancel={() => setShowCustomPromptDialog(false)}
          isLoading={isCreatingPrompt}
        />
      )}
    </div>
  );
}
