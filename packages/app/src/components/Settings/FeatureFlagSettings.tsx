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

  const handleSwitchToClassic = () => {
    if (
      confirm(
        'Switch to classic mode? This will disable the cosmic map and use the traditional sidebar navigation. You can re-enable it anytime from this settings page.'
      )
    ) {
      updateFlag('COSMIC_MAP_ENABLED', false);
      // Reload to apply changes
      window.location.reload();
    }
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
      </section>

      <section className="flag-actions">
        <button className="btn btn-danger" onClick={handleSwitchToClassic}>
          Switch to Classic Mode
        </button>
        <button className="btn btn-secondary" onClick={handleResetFlags}>
          Reset to Defaults
        </button>
      </section>
    </div>
  );
}
