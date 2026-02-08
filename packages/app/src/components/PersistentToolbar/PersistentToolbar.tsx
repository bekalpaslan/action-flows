import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ButtonDefinition, ToolbarConfig, ProjectId, ButtonId } from '@afw/shared';
import { getVisibleSlots, trackButtonUsage } from '../../utils/toolbarOrdering';
import { PersistentToolbarButton } from './PersistentToolbarButton';
import './PersistentToolbar.css';

/** Backend URL from environment, defaults to relative path for same-origin */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export interface PersistentToolbarProps {
  /** Project ID for config persistence */
  projectId: ProjectId;
  /** Available button definitions */
  buttons: ButtonDefinition[];
  /** Optional: callback when button is clicked */
  onButtonClick?: (button: ButtonDefinition) => void;
}

/**
 * Project-scoped persistent toolbar with frequency-based ordering.
 *
 * Key features:
 * - Fetches config from /api/toolbar/:projectId/config
 * - Displays buttons sorted by frequency (pinned first)
 * - Supports pin/unpin via right-click context menu
 * - Persists changes to backend
 * - Shows "Suggested" section for high-frequency buttons not yet pinned
 */
export function PersistentToolbar({ projectId, buttons, onButtonClick }: PersistentToolbarProps) {
  const [config, setConfig] = useState<ToolbarConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [projectId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/toolbar/${projectId}/config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else if (response.status === 404) {
        // No config yet, create a default one
        const defaultConfig: ToolbarConfig = {
          maxSlots: 8,
          slots: [],
          autoLearn: true,
          showUsageCount: false,
        };
        setConfig(defaultConfig);
      } else {
        throw new Error(`Failed to fetch toolbar config: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[PersistentToolbar] Failed to fetch config:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set default config on error
      setConfig({
        maxSlots: 8,
        slots: [],
        autoLearn: true,
        showUsageCount: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = useCallback(async (newConfig: ToolbarConfig) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/toolbar/${projectId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        throw new Error(`Failed to save toolbar config: ${response.statusText}`);
      }

      setConfig(newConfig);
    } catch (err) {
      console.error('[PersistentToolbar] Failed to save config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save config');
    }
  }, [projectId]);

  // Get visible slots based on config
  const visibleSlots = useMemo(() => {
    if (!config) return [];
    return getVisibleSlots(config.slots, config.maxSlots);
  }, [config]);

  // Map slots to button definitions
  const toolbarButtons = useMemo(() => {
    return visibleSlots
      .map(slot => buttons.find(b => b.id === slot.buttonId))
      .filter((b): b is ButtonDefinition => b !== undefined);
  }, [visibleSlots, buttons]);

  const handleButtonClick = useCallback((button: ButtonDefinition) => {
    if (!config) return;

    // Track usage
    const updatedSlots = trackButtonUsage(config.slots, button.id as ButtonId);
    const newConfig = { ...config, slots: updatedSlots };
    saveConfig(newConfig);

    // User callback
    onButtonClick?.(button);
  }, [config, saveConfig, onButtonClick]);

  const handleTogglePin = useCallback((buttonId: ButtonId, pinned: boolean) => {
    if (!config) return;

    const newSlots = config.slots.map(slot =>
      slot.buttonId === buttonId ? { ...slot, pinned } : slot
    );

    saveConfig({ ...config, slots: newSlots });
  }, [config, saveConfig]);

  const handleRemoveSlot = useCallback((buttonId: ButtonId) => {
    if (!config) return;

    const newSlots = config.slots.filter(slot => slot.buttonId !== buttonId);
    saveConfig({ ...config, slots: newSlots });
  }, [config, saveConfig]);

  if (loading) {
    return <div className="persistent-toolbar loading">Loading toolbar...</div>;
  }

  if (error && !config) {
    return (
      <div className="persistent-toolbar error">
        <span className="error-message">{error}</span>
        <button className="retry-button" onClick={fetchConfig}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="persistent-toolbar">
      <div className="toolbar-header">
        <span className="toolbar-title">Toolbar</span>
        {config?.showUsageCount && (
          <span className="toolbar-stats">
            {visibleSlots.length} / {config.maxSlots} slots
          </span>
        )}
      </div>

      <div className="toolbar-buttons">
        {toolbarButtons.length > 0 ? (
          toolbarButtons.map((button, idx) => {
            const slot = visibleSlots[idx];
            return (
              <PersistentToolbarButton
                key={button.id}
                button={button}
                slot={slot}
                onClick={() => handleButtonClick(button)}
                onTogglePin={(pinned) => handleTogglePin(button.id as ButtonId, pinned)}
                onRemove={() => handleRemoveSlot(button.id as ButtonId)}
              />
            );
          })
        ) : (
          <div className="empty-state">
            <p>No buttons pinned</p>
            <p className="help-text">Right-click buttons to pin them to the toolbar</p>
          </div>
        )}
      </div>
    </div>
  );
}
