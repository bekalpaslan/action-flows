import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import type { WorkbenchId, WorkbenchConfig, Session, ToolId } from '@afw/shared';
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
  routingFilter: WorkbenchId | null;
  setRoutingFilter: (filter: WorkbenchId | null) => void;
  filterSessionsByContext: (sessions: Session[]) => Session[];
  // Phase D: Tool embedding support
  activeTool: ToolId | null;
  setActiveTool: (tool: ToolId | null) => void;
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

  // Track routing filter (null = show all sessions)
  const [routingFilter, setRoutingFilter] = useState<WorkbenchId | null>(null);

  // Phase D: Track active tool (tools embed in stars, not navigable)
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

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

  /**
   * Filter sessions by routing context
   * Returns sessions that were routed to the specified context
   * If routingFilter is null, returns all sessions
   */
  const filterSessionsByContext = useCallback(
    (sessions: Session[]): Session[] => {
      if (!routingFilter) {
        return sessions;
      }

      return sessions.filter(session => {
        // Check if session has routing metadata
        const routingContext = session.metadata?.routingContext as WorkbenchId | undefined;
        return routingContext === routingFilter;
      });
    },
    [routingFilter]
  );

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
      routingFilter,
      setRoutingFilter,
      filterSessionsByContext,
      activeTool,
      setActiveTool,
    }),
    [
      activeWorkbench,
      workbenchConfigs,
      workbenchNotifications,
      previousWorkbench,
      routingFilter,
      filterSessionsByContext,
      activeTool,
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
