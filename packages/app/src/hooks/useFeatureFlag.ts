import { useState, useCallback } from 'react';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import type { FeatureFlags } from '../config/featureFlags';

/**
 * useFeatureFlag Hook (Legacy)
 *
 * Simple localStorage-based feature flag system.
 * Enables runtime toggling of experimental features.
 *
 * @deprecated Use useFeatureFlags context or FEATURE_FLAGS constants instead
 * @param key - Feature flag key (will be prefixed with 'afw-')
 * @param defaultValue - Default value if flag is not set (default: false)
 * @returns Tuple of [isEnabled, setEnabled]
 *
 * @example
 * const [cosmicMapEnabled, setCosmicMapEnabled] = useFeatureFlag(FEATURE_FLAGS.COSMIC_MAP);
 * if (cosmicMapEnabled) {
 *   return <CosmicMap />;
 * }
 */
export function useFeatureFlag(
  key: string,
  defaultValue = false
): [boolean, (enabled: boolean) => void] {
  // Read initial value from localStorage
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }
    return stored === 'true';
  });

  // Toggle function that persists to localStorage
  const setEnabled = useCallback(
    (enabled: boolean) => {
      setIsEnabled(enabled);
      localStorage.setItem(key, String(enabled));
    },
    [key]
  );

  return [isEnabled, setEnabled];
}

/**
 * Pre-defined Feature Flags (Legacy)
 *
 * @deprecated Use FEATURE_FLAGS from config/featureFlags instead
 */
export const FEATURE_FLAGS = {
  /** Enable Cosmic Map visualization (Living Universe Phase 1) */
  COSMIC_MAP: 'afw-cosmic-map-enabled',
} as const;

/**
 * useFeatureFlagSimple - Simplified hook for checking feature flags
 *
 * Uses the FeatureFlagsContext for centralized flag management.
 *
 * @param key - Feature flag key from FeatureFlags interface
 * @returns boolean indicating if feature is enabled
 *
 * @example
 * const cosmicMapEnabled = useFeatureFlagSimple('COSMIC_MAP_ENABLED');
 * if (cosmicMapEnabled) {
 *   return <CosmicMap />;
 * }
 */
export function useFeatureFlagSimple(key: keyof FeatureFlags): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
}
