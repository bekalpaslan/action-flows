import { useState, useCallback } from 'react';

/**
 * useFeatureFlag Hook
 *
 * Simple localStorage-based feature flag system.
 * Enables runtime toggling of experimental features.
 *
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
 * Pre-defined Feature Flags
 *
 * Centralized registry of all feature flags used in the app.
 * Use these constants to avoid typos and enable IDE autocomplete.
 */
export const FEATURE_FLAGS = {
  /** Enable Cosmic Map visualization (Living Universe Phase 1) */
  COSMIC_MAP: 'afw-cosmic-map-enabled',
} as const;
