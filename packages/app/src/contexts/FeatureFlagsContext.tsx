/**
 * Feature Flags Context
 *
 * React context for managing feature flags throughout the application.
 * Provides hooks for checking and updating feature flags with localStorage persistence.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { loadFlags, saveFlags, resetFlags, type FeatureFlags } from '../config/featureFlags';

interface FeatureFlagsContextValue {
  /** Current feature flag values */
  flags: FeatureFlags;
  /** Update a single feature flag */
  updateFlag: (key: keyof FeatureFlags, value: boolean) => void;
  /** Reset all flags to defaults */
  resetToDefaults: () => void;
  /** Check if a feature is enabled */
  isEnabled: (key: keyof FeatureFlags) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

/**
 * FeatureFlagsProvider - Context provider for feature flags
 *
 * Automatically loads flags from localStorage on mount and persists changes.
 */
export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(loadFlags());

  const updateFlag = useCallback((key: keyof FeatureFlags, value: boolean) => {
    setFlags((prev) => {
      const updated = { ...prev, [key]: value };
      saveFlags(updated);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = resetFlags();
    setFlags(defaults);
  }, []);

  const isEnabled = useCallback(
    (key: keyof FeatureFlags) => {
      return flags[key];
    },
    [flags]
  );

  const value: FeatureFlagsContextValue = {
    flags,
    updateFlag,
    resetToDefaults,
    isEnabled,
  };

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

/**
 * useFeatureFlags - Hook to access feature flags context
 *
 * @throws Error if used outside FeatureFlagsProvider
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}
