/**
 * Evolution Settings Component
 *
 * User-configurable evolution speed and auto-inference options.
 * Controls how frequently the cosmic map evolves based on user activity.
 */

import { useState } from 'react';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './EvolutionSettings.css';

/**
 * Evolution speed options
 */
export type EvolutionSpeed = 'off' | 'slow' | 'normal' | 'fast';

/**
 * Evolution settings data structure
 */
export interface EvolutionSettingsData {
  speed: EvolutionSpeed;
  autoInference: boolean;
  lastEvolutionTick?: number;
  totalInteractions?: number;
}

export interface EvolutionSettingsProps {
  /** Current settings */
  settings: EvolutionSettingsData;

  /** Callback when settings updated */
  onUpdate: (settings: EvolutionSettingsData) => void;

  /** Callback when close clicked */
  onClose: () => void;
}

/**
 * EvolutionSettings - settings panel for Living Universe evolution mechanics
 *
 * Controls:
 * - Evolution speed (off, slow, normal, fast)
 * - Auto-inference toggle
 * - Manual bridge editor (stub for future)
 */
export function EvolutionSettings({
  settings,
  onUpdate,
  onClose,
}: EvolutionSettingsProps) {
  const [localSettings, setLocalSettings] = useState<EvolutionSettingsData>(settings);
  const [isSaving, setIsSaving] = useState(false);

  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend: handleDiscussSend } = useDiscussButton({
    componentName: 'EvolutionSettings',
    getContext: () => ({
      settingsCategory: 'Living Universe Evolution',
      currentSpeed: localSettings.speed,
      autoInference: localSettings.autoInference,
      unsavedChanges: hasUnsavedChanges,
    }),
  });

  // Handle discuss dialog send
  const handleDiscussDialogSend = (message: string) => {
    const formattedMessage = handleDiscussSend(message);
    console.log('Discussion message:', formattedMessage);
    closeDialog();
  };

  const handleSpeedChange = (speed: EvolutionSpeed) => {
    setLocalSettings({
      ...localSettings,
      speed,
    });
  };

  const handleAutoInferenceChange = (enabled: boolean) => {
    setLocalSettings({
      ...localSettings,
      autoInference: enabled,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Send settings to backend
      const response = await fetch('/api/universe/evolution/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speed: localSettings.speed,
          autoInference: localSettings.autoInference,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save evolution settings');
      }

      // Update parent component
      onUpdate(localSettings);

      // Save to localStorage for persistence
      localStorage.setItem('evolutionSettings', JSON.stringify(localSettings));

      console.log('[EvolutionSettings] Settings saved successfully');
    } catch (error) {
      console.error('[EvolutionSettings] Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert to original settings
    setLocalSettings(settings);
    onClose();
  };

  const handleOpenBridgeEditor = () => {
    alert('Manual bridge editor coming soon! For now, bridges are automatically inferred from usage patterns.');
  };

  // Get speed description
  const getSpeedDescription = (speed: EvolutionSpeed): string => {
    switch (speed) {
      case 'off':
        return 'Static map - no automatic evolution';
      case 'slow':
        return 'Tick every 20 interactions';
      case 'normal':
        return 'Tick every 10 interactions (recommended)';
      case 'fast':
        return 'Tick every 5 interactions';
      default:
        return '';
    }
  };

  return (
    <div className="evolution-settings-overlay" onClick={handleCancel}>
      <div className="evolution-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Living Universe Evolution</h2>
          <DiscussButton componentName="EvolutionSettings" onClick={openDialog} size="small" />
          <button className="settings-close-btn" onClick={handleCancel} title="Close">
            ×
          </button>
        </div>

        <div className="settings-content">
          {/* Evolution Speed Section */}
          <div className="setting-section">
            <label className="setting-label">Evolution Speed</label>
            <div className="setting-description">
              Controls how frequently the cosmic map evolves based on your activity.
              Colors shift, bridges strengthen, and new connections emerge organically.
            </div>

            <div className="speed-options">
              <label className="speed-option">
                <input
                  type="radio"
                  name="speed"
                  value="off"
                  checked={localSettings.speed === 'off'}
                  onChange={() => handleSpeedChange('off')}
                />
                <span className="speed-label">Off</span>
                <span className="speed-desc">{getSpeedDescription('off')}</span>
              </label>

              <label className="speed-option">
                <input
                  type="radio"
                  name="speed"
                  value="slow"
                  checked={localSettings.speed === 'slow'}
                  onChange={() => handleSpeedChange('slow')}
                />
                <span className="speed-label">Slow</span>
                <span className="speed-desc">{getSpeedDescription('slow')}</span>
              </label>

              <label className="speed-option">
                <input
                  type="radio"
                  name="speed"
                  value="normal"
                  checked={localSettings.speed === 'normal'}
                  onChange={() => handleSpeedChange('normal')}
                />
                <span className="speed-label">Normal</span>
                <span className="speed-desc">{getSpeedDescription('normal')}</span>
              </label>

              <label className="speed-option">
                <input
                  type="radio"
                  name="speed"
                  value="fast"
                  checked={localSettings.speed === 'fast'}
                  onChange={() => handleSpeedChange('fast')}
                />
                <span className="speed-label">Fast</span>
                <span className="speed-desc">{getSpeedDescription('fast')}</span>
              </label>
            </div>
          </div>

          {/* Auto-Inference Section */}
          <div className="setting-section">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={localSettings.autoInference}
                onChange={(e) => handleAutoInferenceChange(e.target.checked)}
              />
              Automatic Connection Inference
            </label>
            <div className="setting-description">
              Let the framework suggest new bridges between frequently co-occurring regions.
              High-confidence bridges (10+ co-occurrences) are created automatically.
              Weak unused bridges are pruned after 7 days of inactivity.
            </div>
          </div>

          {/* Manual Bridge Editor Section */}
          <div className="setting-section">
            <label className="setting-label">Manual Bridge Management</label>
            <div className="setting-description">
              Add, remove, or pin bridges manually. Pinned bridges are never auto-removed.
            </div>
            <button className="btn-secondary" onClick={handleOpenBridgeEditor}>
              Open Bridge Editor (Coming Soon)
            </button>
          </div>

          {/* Current State Section */}
          {settings.totalInteractions !== undefined && (
            <div className="setting-section state-section">
              <label className="setting-label">Current Evolution State</label>
              <div className="state-info">
                <div className="state-item">
                  <span className="state-key">Total Interactions:</span>
                  <span className="state-value">{settings.totalInteractions}</span>
                </div>
                {settings.lastEvolutionTick && (
                  <div className="state-item">
                    <span className="state-key">Last Evolution Tick:</span>
                    <span className="state-value">
                      {new Date(settings.lastEvolutionTick).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="footer-btn cancel-footer-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="footer-btn save-footer-btn"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* DiscussDialog */}
        <DiscussDialog
          isOpen={isDialogOpen}
          componentName="EvolutionSettings"
          componentContext={{
            settingsCategory: 'Living Universe Evolution',
            currentSpeed: localSettings.speed,
            autoInference: localSettings.autoInference,
            unsavedChanges: hasUnsavedChanges,
          }}
          onSend={handleDiscussDialogSend}
          onClose={closeDialog}
        />
      </div>
    </div>
  );
}
