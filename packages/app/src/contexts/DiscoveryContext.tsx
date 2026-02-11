import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import type { RegionId, ChainId, RegionDiscoveredEvent } from '@afw/shared';
import { useSessionContext } from './SessionContext.js';
import { useUniverseContext } from './UniverseContext.js';
import { useWebSocket } from '../hooks/useWebSocket.js';

/**
 * DiscoveryContext Type Definition
 *
 * Provides Living Universe discovery state management with:
 * - Discovery progress tracking (0-100% per region)
 * - Real-time WebSocket updates for region revelation
 * - Activity recording API calls (interactions, chains, errors)
 * - Manual reveal functions for testing/debugging
 * - "Reveal All" escape hatch with localStorage toggle
 */
interface DiscoveryContextValue {
  // Current state
  /** Discovery progress for each region (0-100%) */
  discoveryProgress: Record<RegionId, number>;

  /** Regions that are ready to be revealed (100% progress) */
  readyToReveal: RegionId[];

  /** Whether discovery feature is enabled (localStorage toggle) */
  discoveryEnabled: boolean;

  // Actions
  /** Poll backend for current discovery progress */
  checkDiscovery: () => Promise<void>;

  /** Manually reveal a specific region (testing/debug) */
  revealRegion: (regionId: RegionId) => Promise<void>;

  /** Reveal all regions (testing/debug escape hatch) */
  revealAll: () => Promise<void>;

  /** Toggle discovery feature on/off */
  toggleDiscovery: (enabled: boolean) => void;

  // Activity tracking (calls backend)
  /** Record user interaction for discovery progress */
  recordInteraction: (context: string) => Promise<void>;

  /** Record chain completion for discovery triggers */
  recordChainCompleted: (chainId: ChainId) => Promise<void>;

  /** Record error event for discovery triggers */
  recordError: () => Promise<void>;
}

const DiscoveryContext = createContext<DiscoveryContextValue | undefined>(undefined);

interface DiscoveryProviderProps {
  children: ReactNode;
}

/**
 * DiscoveryProvider Component
 *
 * Manages Living Universe discovery state:
 * - Subscribes to WebSocket for 'universe:region_discovered' events
 * - Tracks discovery progress for all regions
 * - Provides activity recording methods
 * - Implements debounced polling (every 5 seconds)
 * - Respects prefers-reduced-motion for animation control
 */
export function DiscoveryProvider({ children }: DiscoveryProviderProps) {
  const { activeSessionId } = useSessionContext();
  const { universe, refreshUniverse } = useUniverseContext();

  const [discoveryProgress, setDiscoveryProgress] = useState<Record<RegionId, number>>({});
  const [readyToReveal, setReadyToReveal] = useState<RegionId[]>([]);
  const [discoveryEnabled, setDiscoveryEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('afw-discovery-enabled');
    return stored === null ? true : stored === 'true';
  });
  const [lastDiscoveryTime, setLastDiscoveryTime] = useState<number>(Date.now());

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

  // Adaptive polling intervals
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL_ACTIVE = 10000; // 10 seconds when active
  const POLLING_INTERVAL_IDLE = 30000;   // 30 seconds when idle (no discoveries for 5 min)
  const IDLE_THRESHOLD_MS = 300000;      // 5 minutes

  // WebSocket connection
  const ws = useWebSocket({
    url: WS_URL,
    onEvent: (event) => {
      // Handle region discovered events
      if (event.type === 'universe:region_discovered') {
        handleRegionDiscovered(event as RegionDiscoveredEvent);
      }
    },
  });

  /**
   * Handle incoming region discovered WebSocket event
   * Updates local state optimistically and refreshes universe
   */
  const handleRegionDiscovered = useCallback(
    (event: RegionDiscoveredEvent) => {
      console.log('[Discovery] Region discovered:', event.regionId, event.fogState);

      // Optimistic update: mark as 100% progress
      setDiscoveryProgress((prev) => ({
        ...prev,
        [event.regionId]: 100,
      }));

      // Add to ready-to-reveal list
      setReadyToReveal((prev) => {
        if (prev.includes(event.regionId)) return prev;
        return [...prev, event.regionId];
      });

      // Update last discovery time for adaptive polling
      setLastDiscoveryTime(Date.now());

      // Refresh universe to get updated fog states
      refreshUniverse();
    },
    [refreshUniverse]
  );

  /**
   * Subscribe to session events via WebSocket
   */
  useEffect(() => {
    if (activeSessionId && ws.status === 'connected') {
      ws.subscribe(activeSessionId);
      console.log('[Discovery] Subscribed to session:', activeSessionId);

      return () => {
        ws.unsubscribe(activeSessionId);
      };
    }
  }, [activeSessionId, ws, ws.status]);

  /**
   * Poll backend for discovery progress
   * Debounced to avoid excessive API calls
   */
  const checkDiscovery = useCallback(async () => {
    if (!activeSessionId || !discoveryEnabled) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/universe/discovery/progress/${activeSessionId}`
      );

      if (!response.ok) {
        console.warn('[Discovery] Failed to fetch progress:', response.statusText);
        return;
      }

      const data = await response.json();

      // Update progress state
      if (data.progress) {
        setDiscoveryProgress(data.progress);
      }

      // Update ready-to-reveal list
      if (data.readyRegions && Array.isArray(data.readyRegions)) {
        setReadyToReveal(data.readyRegions);
      }
    } catch (error) {
      console.error('[Discovery] Error checking discovery:', error);
    }
  }, [activeSessionId, discoveryEnabled, API_BASE_URL]);

  /**
   * Start adaptive polling when session is active
   * Slows down polling when no discoveries have happened recently
   */
  useEffect(() => {
    if (!activeSessionId || !discoveryEnabled) {
      // Clear polling if no session or discovery disabled
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Calculate adaptive interval based on last discovery time
    const timeSinceLastDiscovery = Date.now() - lastDiscoveryTime;
    const pollInterval = timeSinceLastDiscovery > IDLE_THRESHOLD_MS
      ? POLLING_INTERVAL_IDLE
      : POLLING_INTERVAL_ACTIVE;

    console.log(
      `[Discovery] Setting poll interval to ${pollInterval}ms (${timeSinceLastDiscovery > IDLE_THRESHOLD_MS ? 'idle' : 'active'})`
    );

    // Initial check
    checkDiscovery();

    // Start polling interval with adaptive timing
    pollingIntervalRef.current = setInterval(() => {
      checkDiscovery();
    }, pollInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeSessionId, discoveryEnabled, lastDiscoveryTime, checkDiscovery]);

  /**
   * Record user interaction for discovery progress
   */
  const recordInteraction = useCallback(
    async (context: string) => {
      if (!activeSessionId || !discoveryEnabled) return;

      try {
        await fetch(`${API_BASE_URL}/api/universe/discovery/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSessionId,
            type: 'interaction',
            context,
          }),
        });

        // Trigger immediate progress check
        checkDiscovery();
      } catch (error) {
        console.error('[Discovery] Failed to record interaction:', error);
      }
    },
    [activeSessionId, discoveryEnabled, API_BASE_URL, checkDiscovery]
  );

  /**
   * Record chain completion for discovery triggers
   */
  const recordChainCompleted = useCallback(
    async (chainId: ChainId) => {
      if (!activeSessionId || !discoveryEnabled) return;

      try {
        await fetch(`${API_BASE_URL}/api/universe/discovery/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSessionId,
            type: 'chain_completed',
            chainId,
          }),
        });

        // Trigger immediate progress check
        checkDiscovery();
      } catch (error) {
        console.error('[Discovery] Failed to record chain completion:', error);
      }
    },
    [activeSessionId, discoveryEnabled, API_BASE_URL, checkDiscovery]
  );

  /**
   * Record error event for discovery triggers
   */
  const recordError = useCallback(async () => {
    if (!activeSessionId || !discoveryEnabled) return;

    try {
      await fetch(`${API_BASE_URL}/api/universe/discovery/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          type: 'error',
        }),
      });

      // Trigger immediate progress check
      checkDiscovery();
    } catch (error) {
      console.error('[Discovery] Failed to record error:', error);
    }
  }, [activeSessionId, discoveryEnabled, API_BASE_URL, checkDiscovery]);

  /**
   * Manually reveal a specific region (testing/debug)
   */
  const revealRegion = useCallback(
    async (regionId: RegionId) => {
      if (!activeSessionId) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/universe/discovery/reveal/${regionId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: activeSessionId }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to reveal region: ${response.statusText}`);
        }

        // Optimistic update
        setDiscoveryProgress((prev) => ({
          ...prev,
          [regionId]: 100,
        }));

        setReadyToReveal((prev) => {
          if (prev.includes(regionId)) return prev;
          return [...prev, regionId];
        });

        // Refresh universe
        await refreshUniverse();
      } catch (error) {
        console.error('[Discovery] Failed to reveal region:', error);
      }
    },
    [activeSessionId, API_BASE_URL, refreshUniverse]
  );

  /**
   * Reveal all regions (testing/debug escape hatch)
   */
  const revealAll = useCallback(async () => {
    if (!activeSessionId || !universe) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/universe/discovery/reveal-all`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSessionId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reveal all regions: ${response.statusText}`);
      }

      // Optimistic update: mark all regions as 100%
      const allProgress: Record<RegionId, number> = {};
      const allRegionIds: RegionId[] = [];

      universe.regions.forEach((region) => {
        allProgress[region.id] = 100;
        allRegionIds.push(region.id);
      });

      setDiscoveryProgress(allProgress);
      setReadyToReveal(allRegionIds);

      // Refresh universe
      await refreshUniverse();
    } catch (error) {
      console.error('[Discovery] Failed to reveal all regions:', error);
    }
  }, [activeSessionId, universe, API_BASE_URL, refreshUniverse]);

  /**
   * Toggle discovery feature on/off
   */
  const toggleDiscovery = useCallback((enabled: boolean) => {
    setDiscoveryEnabled(enabled);
    localStorage.setItem('afw-discovery-enabled', enabled.toString());
    console.log('[Discovery] Feature toggled:', enabled);
  }, []);

  /**
   * Respect prefers-reduced-motion
   * (Used by animation components to disable animations if user preference set)
   */
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        console.log('[Discovery] Reduced motion detected - animations will be minimized');
      }
    };

    // Check initial state
    handleChange(prefersReducedMotion);

    // Listen for changes
    prefersReducedMotion.addEventListener('change', handleChange);

    return () => {
      prefersReducedMotion.removeEventListener('change', handleChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      discoveryProgress,
      readyToReveal,
      discoveryEnabled,
      checkDiscovery,
      revealRegion,
      revealAll,
      toggleDiscovery,
      recordInteraction,
      recordChainCompleted,
      recordError,
    }),
    [
      discoveryProgress,
      readyToReveal,
      discoveryEnabled,
      checkDiscovery,
      revealRegion,
      revealAll,
      toggleDiscovery,
      recordInteraction,
      recordChainCompleted,
      recordError,
    ]
  );

  return (
    <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>
  );
}

/**
 * useDiscoveryContext Hook
 *
 * Access DiscoveryContext from any component.
 * Throws error if used outside DiscoveryProvider.
 *
 * @returns DiscoveryContextValue with all discovery operations
 *
 * @example
 * ```tsx
 * const { discoveryProgress, recordInteraction } = useDiscoveryContext();
 *
 * // Check progress for a region
 * const progressPercent = discoveryProgress['region-review'] || 0;
 *
 * // Record user interaction
 * await recordInteraction('chat-message-submitted');
 * ```
 */
export function useDiscoveryContext(): DiscoveryContextValue {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error(
      'useDiscoveryContext must be used within a DiscoveryProvider. ' +
        'Make sure DiscoveryProvider wraps your component tree.'
    );
  }
  return context;
}
