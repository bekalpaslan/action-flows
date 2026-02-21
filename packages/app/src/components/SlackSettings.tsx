/**
 * Slack Settings Component
 *
 * User interface for configuring Slack notification settings.
 * Controls notification preferences, default channel, and level filtering.
 */

import { useState, useEffect } from 'react';
import { useSlackConfig } from '../hooks/useSlackConfig';
import './SlackSettings.css';

export interface SlackSettingsProps {
  /** Callback when close clicked */
  onClose: () => void;
}

/**
 * SlackSettings - settings panel for Slack notification configuration
 *
 * Controls:
 * - Enable/disable Slack notifications
 * - Set default channel
 * - Set notification level (all, important, critical)
 * - View connection status
 */
export function SlackSettings({ onClose }: SlackSettingsProps) {
  const {
    config,
    isLoading,
    error,
    updateConfig,
    testConnection,
    connectionStatus,
  } = useSlackConfig();

  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Update local config when hook config changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(localConfig) !== JSON.stringify(config);

  const handleEnabledToggle = () => {
    setLocalConfig({
      ...localConfig,
      enabled: !localConfig.enabled,
    });
  };

  const handleChannelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Ensure channel name starts with #
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    setLocalConfig({
      ...localConfig,
      defaultChannel: value,
    });
  };

  const handleLevelChange = (level: 'all' | 'important' | 'critical') => {
    setLocalConfig({
      ...localConfig,
      notificationLevel: level,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig(localConfig);
    } catch (err) {
      console.error('Failed to save Slack settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await testConnection();
    } catch (err) {
      console.error('Connection test failed:', err);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleReset = () => {
    setLocalConfig(config);
  };

  return (
    <>
      <div className="slack-settings-overlay" onClick={onClose}>
        <div className="slack-settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2>Slack Notifications</h2>
            <button
              className="settings-close-btn"
              onClick={onClose}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          <div className="settings-content">
            {isLoading ? (
              <div className="loading-state">Loading configuration...</div>
            ) : error ? (
              <div className="error-state">
                <strong>Error:</strong> {error}
              </div>
            ) : (
              <>
                {/* Enable/Disable Toggle */}
                <div className="setting-section">
                  <div className="setting-row">
                    <div className="setting-label">
                      <h3>Enable Notifications</h3>
                      <p className="setting-description">
                        Send notifications to Slack when chains complete, reviews finish, or errors occur.
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={localConfig.enabled}
                        onChange={handleEnabledToggle}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Default Channel */}
                <div className="setting-section">
                  <h3>Default Channel</h3>
                  <p className="setting-description">
                    Notifications will be posted to this channel by default.
                  </p>
                  <input
                    type="text"
                    className="channel-input"
                    value={localConfig.defaultChannel}
                    onChange={handleChannelChange}
                    placeholder="#cityzen-dev"
                    disabled={!localConfig.enabled}
                  />
                </div>

                {/* Notification Level */}
                <div className="setting-section">
                  <h3>Notification Level</h3>
                  <p className="setting-description">
                    Choose which types of notifications to send.
                  </p>
                  <div className="level-buttons">
                    <button
                      className={`level-btn ${localConfig.notificationLevel === 'all' ? 'active' : ''}`}
                      onClick={() => handleLevelChange('all')}
                      disabled={!localConfig.enabled}
                    >
                      <strong>All</strong>
                      <span>Every completion and event</span>
                    </button>
                    <button
                      className={`level-btn ${localConfig.notificationLevel === 'important' ? 'active' : ''}`}
                      onClick={() => handleLevelChange('important')}
                      disabled={!localConfig.enabled}
                    >
                      <strong>Important</strong>
                      <span>Partial completions, warnings</span>
                    </button>
                    <button
                      className={`level-btn ${localConfig.notificationLevel === 'critical' ? 'active' : ''}`}
                      onClick={() => handleLevelChange('critical')}
                      disabled={!localConfig.enabled}
                    >
                      <strong>Critical</strong>
                      <span>Failures and errors only</span>
                    </button>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="setting-section">
                  <h3>Connection Status</h3>
                  <div className="connection-status">
                    <div className={`status-indicator ${connectionStatus}`}>
                      <span className="status-dot"></span>
                      <span className="status-text">
                        {connectionStatus === 'connected' && 'Connected to Slack MCP'}
                        {connectionStatus === 'disconnected' && 'Not connected'}
                        {connectionStatus === 'error' && 'Connection error'}
                        {connectionStatus === 'testing' && 'Testing connection...'}
                      </span>
                    </div>
                    <button
                      className="test-connection-btn"
                      onClick={handleTestConnection}
                      disabled={!localConfig.enabled || testingConnection}
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="settings-footer">
            <button
              className="btn-secondary"
              onClick={handleReset}
              disabled={!hasUnsavedChanges || isSaving}
            >
              Reset
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
