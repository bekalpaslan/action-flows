import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import type {
  UniverseGraph,
  RegionNode,
  LightBridge,
  RegionId,
  EdgeId,
  WorkbenchId,
} from '@afw/shared';
import { FogState } from '@afw/shared';

/**
 * UniverseContext Type Definition
 *
 * Provides app-level Living Universe state management with:
 * - Universe graph (regions, bridges, discovery triggers)
 * - Navigation methods (zoom, pan, god view)
 * - State queries (get region, check accessibility)
 * - Fog of war logic
 * - Sync with backend /api/universe endpoint
 */
interface UniverseContextType {
  /** Current universe graph state */
  universe: UniverseGraph | null;

  /** Whether universe is being loaded from backend */
  isLoading: boolean;

  /** Error message if universe fetch failed */
  error: string | null;

  // Navigation
  /** Navigate to a region (sets active workbench) */
  navigateToRegion: (regionId: RegionId) => void;

  /** Zoom to a region (animates viewport) */
  zoomToRegion: (regionId: RegionId) => void;

  /** Return to god view (full universe visible) */
  returnToGodView: () => void;

  // State queries
  /** Get region node by ID */
  getRegion: (regionId: RegionId) => RegionNode | undefined;

  /** Get region node by workbench ID */
  getRegionByWorkbench: (workbenchId: WorkbenchId) => RegionNode | undefined;

  /** Get light bridge by edge ID */
  getBridge: (edgeId: EdgeId) => LightBridge | undefined;

  // Fog of war
  /** Check if region is accessible (FogState.REVEALED) */
  isRegionAccessible: (regionId: RegionId) => boolean;

  // Sync
  /** Refresh universe from backend */
  refreshUniverse: () => Promise<void>;

  // Viewport state (for CosmicMap animation)
  /** Target region ID for zoom animation */
  zoomTargetRegionId: RegionId | null;

  /** Target workbench ID from last region navigation */
  targetWorkbenchId: WorkbenchId | null;

  /** Clear zoom target after animation completes */
  clearZoomTarget: () => void;
}

const UniverseContext = createContext<UniverseContextType | undefined>(undefined);

interface UniverseProviderProps {
  children: ReactNode;
}

/**
 * UniverseProvider Component
 *
 * Manages Living Universe state at the app level:
 * - Fetches universe from GET /api/universe on mount
 * - Listens to WebSocket events for universe updates
 * - Provides navigation and query methods
 * - Implements fog of war accessibility logic
 */
export function UniverseProvider({ children }: UniverseProviderProps) {
  const [universe, setUniverse] = useState<UniverseGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomTargetRegionId, setZoomTargetRegionId] = useState<RegionId | null>(null);
  const [targetWorkbenchId, setTargetWorkbenchId] = useState<WorkbenchId | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Initialize: Fetch universe from backend
  useEffect(() => {
    const initializeUniverse = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/universe`);
        if (!response.ok) {
          throw new Error(`Failed to fetch universe: ${response.statusText}`);
        }

        const data = await response.json();
        setUniverse(data.universe || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to initialize universe:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUniverse();
  }, [API_BASE_URL]);

  // WebSocket event handling (future implementation)
  // TODO: Listen to 'universe:region_discovered', 'universe:evolution_tick', 'chain:spark_traveling'
  // useEffect(() => {
  //   const ws = useWebSocket();
  //   ws.on('universe:region_discovered', handleRegionDiscovered);
  //   ws.on('universe:evolution_tick', handleEvolutionTick);
  //   ws.on('chain:spark_traveling', handleSparkTraveling);
  //   return () => { /* cleanup */ };
  // }, []);

  // Navigation: Navigate to region (stores target workbench, triggers zoom)
  const navigateToRegion = useCallback(
    (regionId: RegionId) => {
      if (!universe) return;

      const region = universe.regions.find((r) => r.id === regionId);
      if (!region) {
        console.warn(`Region ${regionId} not found in universe`);
        return;
      }

      // Check accessibility
      if (region.fogState !== FogState.REVEALED) {
        console.warn(`Region ${regionId} is not accessible (fog state: ${region.fogState})`);
        return;
      }

      // Store target workbench ID for WorkbenchLayout to pick up
      setTargetWorkbenchId(region.workbenchId);

      // Trigger zoom animation
      setZoomTargetRegionId(regionId);

      console.log(`[UniverseContext] Navigate to region ${regionId} (workbench: ${region.workbenchId})`);
    },
    [universe]
  );

  // Navigation: Zoom to region (animates viewport in CosmicMap)
  const zoomToRegion = useCallback((regionId: RegionId) => {
    setZoomTargetRegionId(regionId);
  }, []);

  // Navigation: Return to god view
  const returnToGodView = useCallback(() => {
    setZoomTargetRegionId(null);
  }, []);

  // State query: Get region by ID
  const getRegion = useCallback(
    (regionId: RegionId): RegionNode | undefined => {
      return universe?.regions.find((r) => r.id === regionId);
    },
    [universe]
  );

  // State query: Get region by workbench ID
  const getRegionByWorkbench = useCallback(
    (workbenchId: WorkbenchId): RegionNode | undefined => {
      return universe?.regions.find((r) => r.workbenchId === workbenchId);
    },
    [universe]
  );

  // State query: Get bridge by edge ID
  const getBridge = useCallback(
    (edgeId: EdgeId): LightBridge | undefined => {
      return universe?.bridges.find((b) => b.id === edgeId);
    },
    [universe]
  );

  // Fog of war: Check if region is accessible
  const isRegionAccessible = useCallback(
    (regionId: RegionId): boolean => {
      const region = getRegion(regionId);
      return region?.fogState === FogState.REVEALED;
    },
    [getRegion]
  );

  // Sync: Refresh universe from backend
  const refreshUniverse = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/universe`);
      if (!response.ok) {
        throw new Error(`Failed to refresh universe: ${response.statusText}`);
      }

      const data = await response.json();
      setUniverse(data.universe || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to refresh universe:', errorMessage);
      setError(errorMessage);
    }
  }, [API_BASE_URL]);

  // Clear zoom target
  const clearZoomTarget = useCallback(() => {
    setZoomTargetRegionId(null);
    setTargetWorkbenchId(null);
  }, []);

  const value = useMemo(
    () => ({
      universe,
      isLoading,
      error,
      navigateToRegion,
      zoomToRegion,
      returnToGodView,
      getRegion,
      getRegionByWorkbench,
      getBridge,
      isRegionAccessible,
      refreshUniverse,
      zoomTargetRegionId,
      targetWorkbenchId,
      clearZoomTarget,
    }),
    [
      universe,
      isLoading,
      error,
      navigateToRegion,
      zoomToRegion,
      returnToGodView,
      getRegion,
      getRegionByWorkbench,
      getBridge,
      isRegionAccessible,
      refreshUniverse,
      zoomTargetRegionId,
      targetWorkbenchId,
      clearZoomTarget,
    ]
  );

  return (
    <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>
  );
}

/**
 * useUniverseContext Hook
 *
 * Access UniverseContext from any component.
 * Throws error if used outside UniverseProvider.
 */
export function useUniverseContext(): UniverseContextType {
  const context = useContext(UniverseContext);
  if (!context) {
    throw new Error(
      'useUniverseContext must be used within a UniverseProvider. ' +
      'Make sure UniverseProvider wraps your component tree.'
    );
  }
  return context;
}
