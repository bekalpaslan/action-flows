import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type VimMode = 'normal' | 'insert' | 'visual' | 'command';

interface VimNavigationContextValue {
  mode: VimMode;
  setMode: (mode: VimMode) => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  currentTarget: string | null;
  setCurrentTarget: (targetId: string | null) => void;
  targets: string[];
  registerTarget: (targetId: string) => void;
  unregisterTarget: (targetId: string) => void;
  navigateToTarget: (targetId: string) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  navigateFirst: () => void;
  navigateLast: () => void;
}

const VimNavigationContext = createContext<VimNavigationContextValue | undefined>(undefined);

const VIM_ENABLED_KEY = 'actionflows:vim:enabled';

export function VimNavigationProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<VimMode>('normal');
  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(VIM_ENABLED_KEY);
    return stored ? JSON.parse(stored) : true;
  });
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);

  // Persist enabled state
  useEffect(() => {
    localStorage.setItem(VIM_ENABLED_KEY, JSON.stringify(isEnabled));
  }, [isEnabled]);

  const setIsEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    if (!enabled) {
      // Reset to normal mode when disabling
      setMode('normal');
    }
  }, []);

  const registerTarget = useCallback((targetId: string) => {
    setTargets(prev => {
      if (prev.includes(targetId)) {
        return prev;
      }
      return [...prev, targetId];
    });
  }, []);

  const unregisterTarget = useCallback((targetId: string) => {
    setTargets(prev => prev.filter(id => id !== targetId));
    setCurrentTarget(prev => (prev === targetId ? null : prev));
  }, []);

  const navigateToTarget = useCallback((targetId: string) => {
    if (targets.includes(targetId)) {
      setCurrentTarget(targetId);
    }
  }, [targets]);

  const navigateNext = useCallback(() => {
    if (targets.length === 0) return;

    const currentIndex = currentTarget ? targets.indexOf(currentTarget) : -1;
    const nextIndex = (currentIndex + 1) % targets.length;
    setCurrentTarget(targets[nextIndex]);
  }, [targets, currentTarget]);

  const navigatePrev = useCallback(() => {
    if (targets.length === 0) return;

    const currentIndex = currentTarget ? targets.indexOf(currentTarget) : -1;
    const prevIndex = currentIndex <= 0 ? targets.length - 1 : currentIndex - 1;
    setCurrentTarget(targets[prevIndex]);
  }, [targets, currentTarget]);

  const navigateFirst = useCallback(() => {
    if (targets.length > 0) {
      setCurrentTarget(targets[0]);
    }
  }, [targets]);

  const navigateLast = useCallback(() => {
    if (targets.length > 0) {
      setCurrentTarget(targets[targets.length - 1]);
    }
  }, [targets]);

  const value: VimNavigationContextValue = {
    mode,
    setMode,
    isEnabled,
    setIsEnabled,
    currentTarget,
    setCurrentTarget,
    targets,
    registerTarget,
    unregisterTarget,
    navigateToTarget,
    navigateNext,
    navigatePrev,
    navigateFirst,
    navigateLast,
  };

  return (
    <VimNavigationContext.Provider value={value}>
      {children}
    </VimNavigationContext.Provider>
  );
}

export function useVimContext(): VimNavigationContextValue {
  const context = useContext(VimNavigationContext);
  if (!context) {
    throw new Error('useVimContext must be used within a VimNavigationProvider');
  }
  return context;
}
