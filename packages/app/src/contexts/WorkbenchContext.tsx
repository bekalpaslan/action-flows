import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { WorkbenchId, WorkbenchConfig } from '@afw/shared';
import { DEFAULT_WORKBENCH_CONFIGS } from '@afw/shared';

// ============================================================================
// Types
// ============================================================================

interface WorkbenchContextValue {
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;
  workbenchConfigs: Map<WorkbenchId, WorkbenchConfig>;
  workbenchNotifications: Map<WorkbenchId, number>;
  addNotification: (workbenchId: WorkbenchId) => void;
  clearNotifications: (workbenchId: WorkbenchId) => void;
  previousWorkbench: WorkbenchId | null;
  goBack: () => void;
}

// ============================================================================
// Context
// ============================================================================

const WorkbenchContext = createContext<WorkbenchContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface WorkbenchProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'afw-active-workbench';

/**
 * Workbench provider component for managing workbench navigation state
 *
 * Handles:
 * - Active workbench selection
 * - Workbench configurations (9 tabs)
 * - Notification counts per workbench
 * - Back navigation history
 * - localStorage persistence
 */
export function WorkbenchProvider({ children }: WorkbenchProviderProps) {
  // Load initial active workbench from localStorage or default to 'work'
  const [activeWorkbench, setActiveWorkbenchState] = useState<WorkbenchId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as WorkbenchId) || 'work';
  });

  const [previousWorkbench, setPreviousWorkbench] = useState<WorkbenchId | null>(null);

  // Initialize workbench configs from defaults
  const [workbenchConfigs] = useState<Map<WorkbenchId, WorkbenchConfig>>(() => {
    const map = new Map<WorkbenchId, WorkbenchConfig>();
    Object.entries(DEFAULT_WORKBENCH_CONFIGS).forEach(([id, config]) => {
      map.set(id as WorkbenchId, { ...config });
    });
    return map;
  });

  // Track notification counts per workbench
  const [workbenchNotifications, setWorkbenchNotifications] = useState<
    Map<WorkbenchId, number>
  >(() => new Map());

  // Persist active workbench to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeWorkbench);
  }, [activeWorkbench]);

  // Set active workbench with history tracking
  const setActiveWorkbench = (id: WorkbenchId) => {
    if (id !== activeWorkbench) {
      setPreviousWorkbench(activeWorkbench);
      setActiveWorkbenchState(id);
    }
  };

  // Navigate back to previous workbench
  const goBack = () => {
    if (previousWorkbench) {
      setActiveWorkbenchState(previousWorkbench);
      setPreviousWorkbench(null);
    }
  };

  // Add a notification to a workbench
  const addNotification = (workbenchId: WorkbenchId) => {
    setWorkbenchNotifications(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(workbenchId) || 0;
      newMap.set(workbenchId, current + 1);
      return newMap;
    });
  };

  // Clear notifications for a workbench
  const clearNotifications = (workbenchId: WorkbenchId) => {
    setWorkbenchNotifications(prev => {
      const newMap = new Map(prev);
      newMap.set(workbenchId, 0);
      return newMap;
    });
  };

  const value: WorkbenchContextValue = useMemo(
    () => ({
      activeWorkbench,
      setActiveWorkbench,
      workbenchConfigs,
      workbenchNotifications,
      addNotification,
      clearNotifications,
      previousWorkbench,
      goBack,
    }),
    [
      activeWorkbench,
      workbenchConfigs,
      workbenchNotifications,
      previousWorkbench,
    ]
  );

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access full workbench context
 * Must be used within WorkbenchProvider
 */
export function useWorkbenchContext(): WorkbenchContextValue {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbenchContext must be used within WorkbenchProvider');
  }
  return context;
}

/**
 * Convenience hook that returns just the active workbench and setter
 * Must be used within WorkbenchProvider
 */
export function useActiveWorkbench(): {
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;
} {
  const { activeWorkbench, setActiveWorkbench } = useWorkbenchContext();
  return { activeWorkbench, setActiveWorkbench };
}
