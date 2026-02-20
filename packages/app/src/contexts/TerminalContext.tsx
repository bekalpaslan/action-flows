import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { SessionId, WorkbenchId } from '@afw/shared';

interface PerWorkbenchTerminalState {
  isVisible: boolean;
  sessionId: SessionId | null;
  height: number; // pixels
  isCollapsed: boolean;
}

interface TerminalContextValue {
  perWorkbenchState: Map<WorkbenchId, PerWorkbenchTerminalState>;
  saveAndSwitch: (fromWorkbench: WorkbenchId, toWorkbench: WorkbenchId) => void;
  updateHeight: (workbenchId: WorkbenchId, height: number) => void;
  toggleCollapsed: (workbenchId: WorkbenchId) => void;
  setVisible: (workbenchId: WorkbenchId, visible: boolean) => void;
  setSessionId: (workbenchId: WorkbenchId, sessionId: SessionId | null) => void;
}

const TerminalContext = createContext<TerminalContextValue | undefined>(undefined);

interface TerminalProviderProps {
  children: ReactNode;
}

const TERMINAL_STATE_STORAGE_KEY = 'afw-terminal-state';
const DEFAULT_HEIGHT = 200; // pixels
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;

/**
 * TerminalProvider
 * Manages per-workbench terminal state including visibility, height, collapse state, and session binding.
 * State is persisted to localStorage for consistent UX across sessions.
 *
 * NOTE: Must be nested inside WorkbenchProvider to ensure WorkbenchContext is available.
 */
export function TerminalProvider({ children }: TerminalProviderProps) {
  // Per-workbench terminal state persistence
  const workbenchTerminalMap = useRef<Map<WorkbenchId, PerWorkbenchTerminalState>>(new Map());
  const [, setUpdateTrigger] = useState<number>(0);

  // Helper to trigger re-renders when state changes
  const triggerUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  // Load initial state from localStorage
  const initializeState = useCallback(() => {
    const stored = localStorage.getItem(TERMINAL_STATE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([workbenchId, state]: [string, any]) => {
          workbenchTerminalMap.current.set(workbenchId as WorkbenchId, {
            isVisible: state.isVisible ?? false,
            sessionId: state.sessionId ?? null,
            height: Math.min(Math.max(state.height ?? DEFAULT_HEIGHT, MIN_HEIGHT), MAX_HEIGHT),
            isCollapsed: state.isCollapsed ?? false,
          });
        });
      } catch (e) {
        console.error('Failed to parse terminal state from localStorage:', e);
      }
    }
  }, []);

  // Initialize on first render
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    initializeState();
    setInitialized(true);
  }

  // Helper to persist state to localStorage
  const persistState = useCallback(() => {
    const state: Record<string, any> = {};
    workbenchTerminalMap.current.forEach((terminalState, workbenchId) => {
      state[workbenchId] = terminalState;
    });
    localStorage.setItem(TERMINAL_STATE_STORAGE_KEY, JSON.stringify(state));
  }, []);

  // Helper to get or create default state for a workbench
  const getOrCreateState = useCallback((workbenchId: WorkbenchId): PerWorkbenchTerminalState => {
    if (!workbenchTerminalMap.current.has(workbenchId)) {
      workbenchTerminalMap.current.set(workbenchId, {
        isVisible: false,
        sessionId: null,
        height: DEFAULT_HEIGHT,
        isCollapsed: false,
      });
    }
    return workbenchTerminalMap.current.get(workbenchId)!;
  }, []);

  const saveAndSwitch = useCallback((fromWorkbench: WorkbenchId, toWorkbench: WorkbenchId) => {
    // Ensure we have state for both workbenches
    getOrCreateState(fromWorkbench);
    getOrCreateState(toWorkbench);

    // Persist the update
    persistState();
    triggerUpdate();
  }, [getOrCreateState, persistState, triggerUpdate]);

  const updateHeight = useCallback((workbenchId: WorkbenchId, height: number) => {
    const state = getOrCreateState(workbenchId);
    state.height = Math.min(Math.max(height, MIN_HEIGHT), MAX_HEIGHT);
    persistState();
    triggerUpdate();
  }, [getOrCreateState, persistState, triggerUpdate]);

  const toggleCollapsed = useCallback((workbenchId: WorkbenchId) => {
    const state = getOrCreateState(workbenchId);
    state.isCollapsed = !state.isCollapsed;
    persistState();
    triggerUpdate();
  }, [getOrCreateState, persistState, triggerUpdate]);

  const setVisible = useCallback((workbenchId: WorkbenchId, visible: boolean) => {
    const state = getOrCreateState(workbenchId);
    state.isVisible = visible;
    persistState();
    triggerUpdate();
  }, [getOrCreateState, persistState, triggerUpdate]);

  const setSessionId = useCallback((workbenchId: WorkbenchId, sessionId: SessionId | null) => {
    const state = getOrCreateState(workbenchId);
    state.sessionId = sessionId;
    persistState();
    triggerUpdate();
  }, [getOrCreateState, persistState, triggerUpdate]);

  const value: TerminalContextValue = {
    perWorkbenchState: workbenchTerminalMap.current,
    saveAndSwitch,
    updateHeight,
    toggleCollapsed,
    setVisible,
    setSessionId,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

/**
 * useTerminal
 * Hook to access the TerminalContext
 * Must be used within TerminalProvider
 */
export function useTerminal(): TerminalContextValue {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within TerminalProvider');
  }
  return context;
}
