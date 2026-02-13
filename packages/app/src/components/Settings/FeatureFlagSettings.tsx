/**
 * Feature Flag Settings Component
 *
 * UI for managing feature flags for the Living Universe rollout.
 * Allows users to enable/disable features and fallback to classic mode.
 */

import React from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import './FeatureFlagSettings.css';

export function FeatureFlagSettings() {
  const { flags, updateFlag, resetToDefaults } = useFeatureFlags();

  const handleToggle = (key: keyof typeof flags) => {
    updateFlag(key, !flags[key]);
  };

  const handleResetFlags = () => {
    if (confirm('Reset all feature flags to defaults? This will reload the page.')) {
      resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="feature-flag-settings">
      <h2>Feature Flags</h2>
      <p className="warning-text">
        ⚠️ Changing these flags may affect active workflows. Some changes require a page reload.
      </p>

      <section className="flags-list">
        <div className="flag-item">
          <div className="flag-info">
            <label htmlFor="cosmic-map-flag">Cosmic Map (Phase 1)</label>
            <span className="flag-description">
              Enable the living universe visualization. Disable to use classic sidebar navigation.
            </span>
          </div>
          <input
            id="cosmic-map-flag"
            type="checkbox"
            checked={flags.COSMIC_MAP_ENABLED}
            onChange={() => handleToggle('COSMIC_MAP_ENABLED')}
          />
        </div>

        <div className="flag-item">
          <div className="flag-info">
            <label htmlFor="command-center-flag">Command Center (Phase 2)</label>
            <span className="flag-description">
              Enable the bottom command center for message input and session controls.
            </span>
          </div>
          <input
            id="command-center-flag"
            type="checkbox"
            checked={flags.COMMAND_CENTER_ENABLED}
            onChange={() => handleToggle('COMMAND_CENTER_ENABLED')}
          />
        </div>

        <div className="flag-item">
          <div className="flag-info">
            <label htmlFor="fog-of-war-flag">Fog of War (Phase 3)</label>
            <span className="flag-description">
              Enable discovery mechanics where regions are revealed through interaction.
            </span>
          </div>
          <input
            id="fog-of-war-flag"
            type="checkbox"
            checked={flags.FOG_OF_WAR_ENABLED}
            onChange={() => handleToggle('FOG_OF_WAR_ENABLED')}
          />
        </div>

        <div className="flag-item">
          <div className="flag-info">
            <label htmlFor="spark-animation-flag">Spark Animations (Phase 4)</label>
            <span className="flag-description">
              Enable spark travel animations during chain execution.
            </span>
          </div>
          <input
            id="spark-animation-flag"
            type="checkbox"
            checked={flags.SPARK_ANIMATION_ENABLED}
            onChange={() => handleToggle('SPARK_ANIMATION_ENABLED')}
          />
        </div>

        <div className="flag-item">
          <div className="flag-info">
            <label htmlFor="evolution-flag">Evolution Mechanics (Phase 6)</label>
            <span className="flag-description">
              Enable region color evolution and trace accumulation.
            </span>
          </div>
          <input
            id="evolution-flag"
            type="checkbox"
            checked={flags.EVOLUTION_ENABLED}
            onChange={() => handleToggle('EVOLUTION_ENABLED')}
          />
        </div>

        <div className="flag-item">
          <div className="flag-info">
            <label htmlFor="classic-dashboard-mode">Classic Dashboard Mode</label>
            <span className="flag-description">
              Switch to traditional sidebar navigation instead of cosmic map.
            </span>
          </div>
          <input
            id="classic-dashboard-mode"
            type="checkbox"
            checked={flags.CLASSIC_DASHBOARD_MODE}
            onChange={() => {
              const newClassicMode = !flags.CLASSIC_DASHBOARD_MODE;
              updateFlag('CLASSIC_DASHBOARD_MODE', newClassicMode);
              // Also toggle COSMIC_MAP_ENABLED inversely
              updateFlag('COSMIC_MAP_ENABLED', !newClassicMode);
            }}
          />
        </div>
      </section>

      <section className="flag-actions">
        <button className="btn btn-secondary" onClick={handleResetFlags}>
          Reset to Defaults
        </button>
      </section>
    </div>
  );
}
