/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for gradual Living Universe rollout.
 * Enables safe deployment with escape hatches for users.
 */

export interface FeatureFlags {
  /** Enable Cosmic Map visualization (Living Universe Phase 1) */
  COSMIC_MAP_ENABLED: boolean;
  /** Enable Command Center bottom bar (Phase 2) */
  COMMAND_CENTER_ENABLED: boolean;
  /** Enable Fog of War discovery mechanics (Phase 3) */
  FOG_OF_WAR_ENABLED: boolean;
  /** Enable spark travel animations during chain execution (Phase 4) */
  SPARK_ANIMATION_ENABLED: boolean;
  /** Enable evolution mechanics (region color shift, trace accumulation) (Phase 6) */
  EVOLUTION_ENABLED: boolean;
  /** Enable Classic Dashboard Mode (traditional sidebar navigation) */
  CLASSIC_DASHBOARD_MODE: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  COSMIC_MAP_ENABLED: true,
  COMMAND_CENTER_ENABLED: true,
  FOG_OF_WAR_ENABLED: true,
  SPARK_ANIMATION_ENABLED: true,
  EVOLUTION_ENABLED: true,
  CLASSIC_DASHBOARD_MODE: false,
};

const STORAGE_KEY = 'afw-feature-flags';

/**
 * Load feature flags from localStorage
 * Falls back to defaults if storage unavailable or corrupted
 */
export function loadFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new flags added after storage
      return { ...DEFAULT_FLAGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load feature flags from localStorage:', error);
  }
  return DEFAULT_FLAGS;
}

/**
 * Save feature flags to localStorage
 */
export function saveFlags(flags: FeatureFlags): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.error('Failed to save feature flags to localStorage:', error);
  }
}

/**
 * Reset flags to defaults and clear storage
 */
export function resetFlags(): FeatureFlags {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset feature flags:', error);
  }
  return DEFAULT_FLAGS;
}
