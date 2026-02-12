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
import { useWebSocketContext } from './WebSocketContext';

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
  const wsContext = useWebSocketContext();

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

  // WebSocket event handling: Evolution tick and map expansion
  useEffect(() => {
    if (!wsContext?.ws) return;

    const unsubscribe = wsContext.onEvent((event) => {
      if (event.type === 'universe:evolution_tick') {
        applyEvolutionTick(event as any);
      } else if (event.type === 'universe:map_expanded') {
        handleMapExpanded(event as any);
      }
    });

    return unsubscribe;
  }, [wsContext]);

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

  /**
   * Apply evolution tick to local universe state.
   * Called when 'universe:evolution_tick' WebSocket event received.
   */
  const applyEvolutionTick = useCallback((event: any) => {
    if (!universe) return;

    const { colorDeltas, traceDeltas, regionsActive, bridgesTraversed } = event.details || {};

    // Import color evolution utilities dynamically
    import('../systems/ColorEvolution').then(({ applyColorShift, calculateGlowIntensity }) => {
      // Apply color deltas to regions
      const updatedRegions = universe.regions.map((region) => {
        const delta = colorDeltas?.[region.id];
        if (!delta) return region;

        // Apply color shift
        const newColor = applyColorShift(region.colorShift.currentColor, delta);

        return {
          ...region,
          colorShift: {
            ...region.colorShift,
            currentColor: newColor,
            saturation: Math.min(1.0, region.colorShift.saturation + delta.saturationDelta),
            temperature: Math.min(1.0, region.colorShift.temperature + delta.temperatureDelta),
          },
          glowIntensity: calculateGlowIntensity(
            Math.min(1.0, region.colorShift.temperature + delta.temperatureDelta)
          ),
        };
      });

      // Apply trace deltas to bridges
      const updatedBridges = universe.bridges.map((bridge) => {
        const delta = traceDeltas?.[bridge.id];
        if (!delta) return bridge;

        // Ensure traces object exists
        const currentTraces = bridge.traces || {
          totalInteractions: 0,
          recentTraces: [],
          heatLevel: 0.0,
        };

        return {
          ...bridge,
          strength: Math.min(1.0, bridge.strength + delta.strengthIncrement),
          traces: {
            ...currentTraces,
            totalInteractions: currentTraces.totalInteractions + 1,
            recentTraces: [
              {
                timestamp: delta.timestamp,
                chainId: event.sessionId,
                sessionId: event.sessionId,
                action: 'traversal',
                result: 'success',
              } as any,
              ...currentTraces.recentTraces.slice(0, 9), // Keep last 10
            ],
            heatLevel: Math.min(1.0, currentTraces.heatLevel + 0.05),
          },
        };
      });

      // Update universe state
      setUniverse({
        ...universe,
        regions: updatedRegions,
        bridges: updatedBridges,
      });

      console.log(
        `[UniverseContext] Applied evolution tick: ${regionsActive?.length || 0} regions, ${bridgesTraversed?.length || 0} bridges`
      );
    }).catch((err) => {
      console.error('[UniverseContext] Failed to apply evolution tick:', err);
    });
  }, [universe]);

  /**
   * Handle map expansion event.
   * Called when new region or bridge is created.
   */
  const handleMapExpanded = useCallback((event: any) => {
    // Trigger fade-in animation for new region if applicable
    if (event.newRegionId) {
      // Store fade-in region ID for CosmicMap to apply animation
      setTargetWorkbenchId(event.newRegionId as any);
    }

    // Refresh universe to fetch new region/bridges
    refreshUniverse();

    console.log(`[UniverseContext] Map expanded: ${event.newRegionId || 'bridges only'}`);
  }, [refreshUniverse]);

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
