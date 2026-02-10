/**
 * SettingsWorkbench Component
 *
 * Configuration UI for ActionFlows Dashboard settings.
 * Organized into sections: General, Appearance, Keyboard, Advanced
 *
 * Features:
 * - Theme toggle integration (dark/light/system)
 * - Vim mode enable/disable
 * - Backend URL configuration
 * - Keyboard shortcut display
 * - Auto-save toggle
 * - Settings persistence via localStorage
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { useVimContext } from '../../contexts/VimNavigationContext';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './SettingsWorkbench.css';

// Storage keys
const SETTINGS_STORAGE_KEY = 'actionflows:settings';

// Default keyboard shortcuts for display
const DEFAULT_SHORTCUTS = [
  { action: 'Open Command Palette', keys: 'Ctrl+K', category: 'Global' },
  { action: 'Toggle Theme', keys: 'Ctrl+Shift+T', category: 'Global' },
  { action: 'Go to Work', keys: 'Ctrl+1', category: 'Navigation' },
  { action: 'Go to Squad', keys: 'Ctrl+2', category: 'Navigation' },
  { action: 'Go to Flows', keys: 'Ctrl+3', category: 'Navigation' },
  { action: 'Go to Actions', keys: 'Ctrl+4', category: 'Navigation' },
  { action: 'Go to Logs', keys: 'Ctrl+5', category: 'Navigation' },
  { action: 'Go to Harmony', keys: 'Ctrl+6', category: 'Navigation' },
  { action: 'Go to Registry', keys: 'Ctrl+7', category: 'Navigation' },
  { action: 'Go to Settings', keys: 'Ctrl+8', category: 'Navigation' },
  { action: 'Go to Help', keys: 'Ctrl+9', category: 'Navigation' },
  { action: 'New Session', keys: 'Ctrl+N', category: 'Session' },
  { action: 'Reload', keys: 'Ctrl+R', category: 'System' },
  { action: 'Exit Full Screen', keys: 'Escape', category: 'Session' },
  { action: 'Toggle Full Screen', keys: 'F', category: 'Session' },
  { action: 'Focus Tile 1-9', keys: '1-9', category: 'Session' },
  { action: 'Cycle Next Tile', keys: 'Tab', category: 'Session' },
  { action: 'Cycle Previous Tile', keys: 'Shift+Tab', category: 'Session' },
];

interface SettingsState {
  backendUrl: string;
  autoSave: boolean;
  autoSaveIntervalMs: number;
  showLineNumbers: boolean;
  fontSize: number;
  tabSize: number;
  notifications: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  autoSave: true,
  autoSaveIntervalMs: 5000,
  showLineNumbers: true,
  fontSize: 14,
  tabSize: 2,
  notifications: true,
  soundEnabled: false,
};

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

type SettingsSection = 'general' | 'appearance' | 'keyboard' | 'advanced';

/**
 * SettingsWorkbench - Configuration UI
 */
export function SettingsWorkbench(): React.ReactElement {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isEnabled: vimEnabled, setIsEnabled: setVimEnabled } = useVimContext();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'SettingsWorkbench',
    getContext: () => ({
      category: activeSection,
      unsavedChanges: hasChanges,
    }),
  });

  // Auto-save settings when they change
  useEffect(() => {
    if (hasChanges) {
      saveSettings(settings);
      setHasChanges(false);
      setSaveMessage('Settings saved');
      const timer = setTimeout(() => setSaveMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [settings, hasChanges]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, [setTheme]);

  const handleResetSettings = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      setTheme('system');
      setVimEnabled(true);
      setHasChanges(true);
    }
  }, [setTheme, setVimEnabled]);

  const renderGeneralSection = () => (
    <div className="settings-section">
      <h2 className="settings-section__title">General</h2>

      <div className="settings-group">
        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Backend URL</span>
            <span className="settings-item__description">
              Server address for API and WebSocket connections
            </span>
          </div>
          <div className="settings-item__control">
            <input
              type="text"
              className="settings-input"
              value={settings.backendUrl}
              onChange={(e) => updateSetting('backendUrl', e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Auto-save</span>
            <span className="settings-item__description">
              Automatically save changes to sessions and configurations
            </span>
          </div>
          <div className="settings-item__control">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => updateSetting('autoSave', e.target.checked)}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>
        </div>

        {settings.autoSave && (
          <div className="settings-item settings-item--nested">
            <div className="settings-item__label">
              <span className="settings-item__name">Auto-save interval</span>
              <span className="settings-item__description">
                How often to auto-save (in seconds)
              </span>
            </div>
            <div className="settings-item__control">
              <select
                className="settings-select"
                value={settings.autoSaveIntervalMs}
                onChange={(e) => updateSetting('autoSaveIntervalMs', Number(e.target.value))}
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>
          </div>
        )}

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Notifications</span>
            <span className="settings-item__description">
              Show desktop notifications for important events
            </span>
          </div>
          <div className="settings-item__control">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Sound effects</span>
            <span className="settings-item__description">
              Play sounds for alerts and notifications
            </span>
          </div>
          <div className="settings-item__control">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="settings-section">
      <h2 className="settings-section__title">Appearance</h2>

      <div className="settings-group">
        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Theme</span>
            <span className="settings-item__description">
              Choose your preferred color scheme (current: {resolvedTheme})
            </span>
          </div>
          <div className="settings-item__control">
            <div className="settings-theme-buttons">
              <button
                className={`settings-theme-btn ${theme === 'light' ? 'settings-theme-btn--active' : ''}`}
                onClick={() => handleThemeChange('light')}
                title="Light theme"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span>Light</span>
              </button>
              <button
                className={`settings-theme-btn ${theme === 'dark' ? 'settings-theme-btn--active' : ''}`}
                onClick={() => handleThemeChange('dark')}
                title="Dark theme"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Dark</span>
              </button>
              <button
                className={`settings-theme-btn ${theme === 'system' ? 'settings-theme-btn--active' : ''}`}
                onClick={() => handleThemeChange('system')}
                title="System theme"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Font size</span>
            <span className="settings-item__description">
              Base font size for the editor and terminal
            </span>
          </div>
          <div className="settings-item__control">
            <div className="settings-number-input">
              <button
                className="settings-number-btn"
                onClick={() => updateSetting('fontSize', Math.max(10, settings.fontSize - 1))}
              >
                -
              </button>
              <span className="settings-number-value">{settings.fontSize}px</span>
              <button
                className="settings-number-btn"
                onClick={() => updateSetting('fontSize', Math.min(24, settings.fontSize + 1))}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Show line numbers</span>
            <span className="settings-item__description">
              Display line numbers in the editor
            </span>
          </div>
          <div className="settings-item__control">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Tab size</span>
            <span className="settings-item__description">
              Number of spaces per tab
            </span>
          </div>
          <div className="settings-item__control">
            <select
              className="settings-select"
              value={settings.tabSize}
              onChange={(e) => updateSetting('tabSize', Number(e.target.value))}
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKeyboardSection = () => {
    // Group shortcuts by category
    const groupedShortcuts = DEFAULT_SHORTCUTS.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, typeof DEFAULT_SHORTCUTS>);

    return (
      <div className="settings-section">
        <h2 className="settings-section__title">Keyboard Shortcuts</h2>

        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item__label">
              <span className="settings-item__name">Vim mode</span>
              <span className="settings-item__description">
                Enable Vim-style keyboard navigation
              </span>
            </div>
            <div className="settings-item__control">
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={vimEnabled}
                  onChange={(e) => setVimEnabled(e.target.checked)}
                />
                <span className="settings-toggle__slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-shortcuts">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="settings-shortcuts__category">
              <h3 className="settings-shortcuts__category-title">{category}</h3>
              <div className="settings-shortcuts__list">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="settings-shortcut">
                    <span className="settings-shortcut__action">{shortcut.action}</span>
                    <kbd className="settings-shortcut__keys">{shortcut.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="settings-note">
          Keyboard shortcuts cannot be customized at this time.
          This feature will be available in a future update.
        </p>
      </div>
    );
  };

  const renderAdvancedSection = () => (
    <div className="settings-section">
      <h2 className="settings-section__title">Advanced</h2>

      <div className="settings-group">
        <div className="settings-item settings-item--danger">
          <div className="settings-item__label">
            <span className="settings-item__name">Reset all settings</span>
            <span className="settings-item__description">
              Restore all settings to their default values
            </span>
          </div>
          <div className="settings-item__control">
            <button
              className="settings-btn settings-btn--danger"
              onClick={handleResetSettings}
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Clear local storage</span>
            <span className="settings-item__description">
              Remove all cached data including session history
            </span>
          </div>
          <div className="settings-item__control">
            <button
              className="settings-btn settings-btn--warning"
              onClick={() => {
                if (window.confirm('This will clear all local data. Are you sure?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Clear Data
            </button>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Version</span>
            <span className="settings-item__description">
              ActionFlows Dashboard
            </span>
          </div>
          <div className="settings-item__control">
            <span className="settings-version">v1.0.0</span>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <span className="settings-item__name">Debug mode</span>
            <span className="settings-item__description">
              Enable verbose logging for troubleshooting
            </span>
          </div>
          <div className="settings-item__control">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={localStorage.getItem('afw-debug') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('afw-debug', String(e.target.checked));
                }}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-workbench">
      {/* Header */}
      <div className="settings-workbench__header">
        <div className="settings-workbench__header-left">
          <h1 className="settings-workbench__title">Settings</h1>
          <DiscussButton componentName="SettingsWorkbench" onClick={openDialog} size="small" />
          {saveMessage && (
            <span className="settings-workbench__save-message">{saveMessage}</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="settings-workbench__content">
        {/* Sidebar navigation */}
        <nav className="settings-nav">
          <button
            className={`settings-nav__item ${activeSection === 'general' ? 'settings-nav__item--active' : ''}`}
            onClick={() => setActiveSection('general')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            General
          </button>
          <button
            className={`settings-nav__item ${activeSection === 'appearance' ? 'settings-nav__item--active' : ''}`}
            onClick={() => setActiveSection('appearance')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            Appearance
          </button>
          <button
            className={`settings-nav__item ${activeSection === 'keyboard' ? 'settings-nav__item--active' : ''}`}
            onClick={() => setActiveSection('keyboard')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="6" y1="8" x2="6.01" y2="8" />
              <line x1="10" y1="8" x2="10.01" y2="8" />
              <line x1="14" y1="8" x2="14.01" y2="8" />
              <line x1="18" y1="8" x2="18.01" y2="8" />
              <line x1="8" y1="12" x2="8.01" y2="12" />
              <line x1="12" y1="12" x2="12.01" y2="12" />
              <line x1="16" y1="12" x2="16.01" y2="12" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
            Keyboard
          </button>
          <button
            className={`settings-nav__item ${activeSection === 'advanced' ? 'settings-nav__item--active' : ''}`}
            onClick={() => setActiveSection('advanced')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Advanced
          </button>
        </nav>

        {/* Section content */}
        <div className="settings-main">
          {activeSection === 'general' && renderGeneralSection()}
          {activeSection === 'appearance' && renderAppearanceSection()}
          {activeSection === 'keyboard' && renderKeyboardSection()}
          {activeSection === 'advanced' && renderAdvancedSection()}
        </div>
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="SettingsWorkbench"
        componentContext={{
          category: activeSection,
          unsavedChanges: hasChanges,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
