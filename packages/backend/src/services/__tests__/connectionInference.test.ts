/**
 * Connection Inference Service Tests
 *
 * Comprehensive test suite for connection inference logic.
 * Coverage target: 90%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectionInferenceService, type BridgeSuggestion } from '../connectionInference.js';
import type { EvolutionTick, RegionId, LightBridge, UniverseGraph, EdgeId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

describe('ConnectionInferenceService', () => {
  let service: ConnectionInferenceService;

  beforeEach(() => {
    service = new ConnectionInferenceService();
  });

  describe('analyzeCoOccurrence', () => {
    it('should detect co-occurring region pairs', () => {
      const history: EvolutionTick[] = [
        {
          id: 'tick-1',
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        },
        {
          id: 'tick-2',
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        },
      ];

      const suggestions = service.analyzeCoOccurrence(history);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should require minimum 10 co-occurrences before suggesting', () => {
      const history: EvolutionTick[] = [];

      // Create 9 ticks with same region pair (below threshold)
      for (let i = 0; i < 9; i++) {
        history.push({
          id: `tick-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      expect(suggestions.length).toBe(0);
    });

    it('should suggest bridge after 10+ co-occurrences', () => {
      const history: EvolutionTick[] = [];

      // Create 10 ticks with same region pair (at threshold)
      for (let i = 0; i < 10; i++) {
        history.push({
          id: `tick-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].fromRegion).toBeDefined();
      expect(suggestions[0].toRegion).toBeDefined();
      expect(suggestions[0].coOccurrenceCount).toBe(10);
    });

    it('should calculate confidence correctly', () => {
      const history: EvolutionTick[] = [];

      // Create 20 ticks (100% confidence)
      for (let i = 0; i < 20; i++) {
        history.push({
          id: `tick-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      expect(suggestions[0].confidence).toBe(1.0);
    });

    it('should calculate confidence as min(count / 20, 1.0)', () => {
      const history: EvolutionTick[] = [];

      // Create 10 ticks (50% confidence)
      for (let i = 0; i < 10; i++) {
        history.push({
          id: `tick-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      expect(suggestions[0].confidence).toBe(0.5);
    });

    it('should sort suggestions by confidence (highest first)', () => {
      const history: EvolutionTick[] = [];

      // Create region pair A-B with 15 co-occurrences (75% confidence)
      for (let i = 0; i < 15; i++) {
        history.push({
          id: `tick-ab-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      // Create region pair C-D with 20 co-occurrences (100% confidence)
      for (let i = 0; i < 20; i++) {
        history.push({
          id: `tick-cd-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-C' as RegionId, 'region-D' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      expect(suggestions[0].confidence).toBeGreaterThanOrEqual(suggestions[1].confidence);
    });

    it('should handle bidirectional region pairs (A→B same as B→A)', () => {
      const history: EvolutionTick[] = [];

      // Half ticks with A, B
      for (let i = 0; i < 5; i++) {
        history.push({
          id: `tick-ab-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      // Half ticks with B, A (reversed order)
      for (let i = 0; i < 5; i++) {
        history.push({
          id: `tick-ba-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-B' as RegionId, 'region-A' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      // Should count both as same pair (total 10)
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].coOccurrenceCount).toBe(10);
    });

    it('should handle empty history gracefully', () => {
      const suggestions = service.analyzeCoOccurrence([]);
      expect(suggestions.length).toBe(0);
    });

    it('should handle ticks with single region', () => {
      const history: EvolutionTick[] = [
        {
          id: 'tick-1',
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        },
      ];

      const suggestions = service.analyzeCoOccurrence(history);
      expect(suggestions.length).toBe(0);
    });

    it('should count all pairs within same tick', () => {
      const history: EvolutionTick[] = [];

      // 10 ticks with 3 regions each (A-B, A-C, B-C pairs)
      for (let i = 0; i < 10; i++) {
        history.push({
          id: `tick-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: ['region-A' as RegionId, 'region-B' as RegionId, 'region-C' as RegionId],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const suggestions = service.analyzeCoOccurrence(history);
      // Should suggest 3 bridges: A-B, A-C, B-C (all with 10 co-occurrences)
      expect(suggestions.length).toBe(3);
    });
  });

  describe('shouldRemoveBridge', () => {
    it('should never remove pinned bridges', () => {
      const bridge: LightBridge = {
        id: 'bridge-1' as EdgeId,
        source: 'region-A' as RegionId,
        target: 'region-B' as RegionId,
        gates: [],
        strength: 0.3,
        pinned: true,
        traces: {
          totalInteractions: 0,
          recentTraces: [],
          heatLevel: 0.0,
        },
      };

      expect(service.shouldRemoveBridge(bridge, Date.now())).toBe(false);
    });

    it('should not remove bridge traversed recently', () => {
      const bridge: LightBridge = {
        id: 'bridge-1' as EdgeId,
        source: 'region-A' as RegionId,
        target: 'region-B' as RegionId,
        gates: [],
        strength: 0.3,
        pinned: false,
        traces: {
          totalInteractions: 2,
          recentTraces: [
            {
              timestamp: Date.now() - 1000 as any, // 1 second ago
              chainId: 'chain-1' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.1,
        },
      };

      expect(service.shouldRemoveBridge(bridge, Date.now())).toBe(false);
    });

    it('should remove weak bridge after 7+ days of inactivity', () => {
      const oneWeekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;

      const bridge: LightBridge = {
        id: 'bridge-1' as EdgeId,
        source: 'region-A' as RegionId,
        target: 'region-B' as RegionId,
        gates: [],
        strength: 0.3,
        pinned: false,
        traces: {
          totalInteractions: 2, // Below threshold (5)
          recentTraces: [
            {
              timestamp: oneWeekAgo as any,
              chainId: 'chain-1' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.0,
        },
      };

      expect(service.shouldRemoveBridge(bridge, Date.now())).toBe(true);
    });

    it('should not remove bridge with >= 5 traversals', () => {
      const oneWeekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;

      const bridge: LightBridge = {
        id: 'bridge-1' as EdgeId,
        source: 'region-A' as RegionId,
        target: 'region-B' as RegionId,
        gates: [],
        strength: 0.5,
        pinned: false,
        traces: {
          totalInteractions: 5, // At threshold
          recentTraces: [
            {
              timestamp: oneWeekAgo as any,
              chainId: 'chain-1' as any,
              action: 'traversal',
              result: 'success',
            },
          ],
          heatLevel: 0.2,
        },
      };

      expect(service.shouldRemoveBridge(bridge, Date.now())).toBe(false);
    });

    it('should handle bridge with no recent traces', () => {
      const bridge: LightBridge = {
        id: 'bridge-1' as EdgeId,
        source: 'region-A' as RegionId,
        target: 'region-B' as RegionId,
        gates: [],
        strength: 0.3,
        pinned: false,
        traces: {
          totalInteractions: 0,
          recentTraces: [],
          heatLevel: 0.0,
        },
      };

      // Should remove (no traces = old)
      expect(service.shouldRemoveBridge(bridge, Date.now())).toBe(true);
    });
  });

  describe('suggestNewBridges', () => {
    it('should only create bridges with >= 0.7 confidence', () => {
      const universe: UniverseGraph = {
        regions: [
          { id: 'region-A' as RegionId } as any,
          { id: 'region-B' as RegionId } as any,
        ],
        bridges: [],
      };

      const suggestions: BridgeSuggestion[] = [
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-B' as RegionId,
          coOccurrenceCount: 14,
          confidence: 0.7, // At threshold
        },
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-C' as RegionId,
          coOccurrenceCount: 10,
          confidence: 0.5, // Below threshold
        },
      ];

      const newBridgeIds = service.suggestNewBridges(universe, suggestions);

      expect(newBridgeIds.length).toBe(1);
      expect(universe.bridges.length).toBe(1);
    });

    it('should not create duplicate bridges', () => {
      const universe: UniverseGraph = {
        regions: [
          { id: 'region-A' as RegionId } as any,
          { id: 'region-B' as RegionId } as any,
        ],
        bridges: [
          {
            id: 'bridge-existing' as EdgeId,
            source: 'region-A' as RegionId,
            target: 'region-B' as RegionId,
            gates: [],
            strength: 0.5,
            pinned: false,
            traces: {
              totalInteractions: 10,
              recentTraces: [],
              heatLevel: 0.3,
            },
          },
        ],
      };

      const suggestions: BridgeSuggestion[] = [
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-B' as RegionId,
          coOccurrenceCount: 20,
          confidence: 1.0,
        },
      ];

      const newBridgeIds = service.suggestNewBridges(universe, suggestions);

      // Should not create duplicate
      expect(newBridgeIds.length).toBe(0);
      expect(universe.bridges.length).toBe(1);
    });

    it('should create bridges with correct initial properties', () => {
      const universe: UniverseGraph = {
        regions: [
          { id: 'region-A' as RegionId } as any,
          { id: 'region-B' as RegionId } as any,
        ],
        bridges: [],
      };

      const suggestions: BridgeSuggestion[] = [
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-B' as RegionId,
          coOccurrenceCount: 20,
          confidence: 1.0,
        },
      ];

      service.suggestNewBridges(universe, suggestions);

      const newBridge = universe.bridges[0];
      expect(newBridge.strength).toBe(0.3); // Minimum strength
      expect(newBridge.pinned).toBe(false); // Not pinned by default
      expect(newBridge.gates).toEqual([]);
      expect(newBridge.traces.totalInteractions).toBe(0);
    });

    it('should handle bidirectional bridge detection (A→B same as B→A)', () => {
      const universe: UniverseGraph = {
        regions: [
          { id: 'region-A' as RegionId } as any,
          { id: 'region-B' as RegionId } as any,
        ],
        bridges: [
          {
            id: 'bridge-ba' as EdgeId,
            source: 'region-B' as RegionId,
            target: 'region-A' as RegionId,
            gates: [],
            strength: 0.5,
            pinned: false,
            traces: {
              totalInteractions: 10,
              recentTraces: [],
              heatLevel: 0.3,
            },
          },
        ],
      };

      const suggestions: BridgeSuggestion[] = [
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-B' as RegionId,
          coOccurrenceCount: 20,
          confidence: 1.0,
        },
      ];

      const newBridgeIds = service.suggestNewBridges(universe, suggestions);

      // Should detect B→A is same as A→B
      expect(newBridgeIds.length).toBe(0);
    });
  });

  describe('pruneWeakBridges', () => {
    it('should remove weak bridges meeting criteria', () => {
      const oneWeekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;

      const universe: UniverseGraph = {
        regions: [],
        bridges: [
          {
            id: 'bridge-weak' as EdgeId,
            source: 'region-A' as RegionId,
            target: 'region-B' as RegionId,
            gates: [],
            strength: 0.3,
            pinned: false,
            traces: {
              totalInteractions: 2,
              recentTraces: [
                {
                  timestamp: oneWeekAgo as any,
                  chainId: 'chain-1' as any,
                  action: 'traversal',
                  result: 'success',
                },
              ],
              heatLevel: 0.0,
            },
          },
        ],
      };

      const removedIds = service.pruneWeakBridges(universe);

      expect(removedIds.length).toBe(1);
      expect(removedIds[0]).toBe('bridge-weak');
      expect(universe.bridges.length).toBe(0);
    });

    it('should not remove pinned bridges', () => {
      const oneWeekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;

      const universe: UniverseGraph = {
        regions: [],
        bridges: [
          {
            id: 'bridge-pinned' as EdgeId,
            source: 'region-A' as RegionId,
            target: 'region-B' as RegionId,
            gates: [],
            strength: 0.3,
            pinned: true, // Pinned by user
            traces: {
              totalInteractions: 0,
              recentTraces: [
                {
                  timestamp: oneWeekAgo as any,
                  chainId: 'chain-1' as any,
                  action: 'traversal',
                  result: 'success',
                },
              ],
              heatLevel: 0.0,
            },
          },
        ],
      };

      const removedIds = service.pruneWeakBridges(universe);

      expect(removedIds.length).toBe(0);
      expect(universe.bridges.length).toBe(1);
    });

    it('should handle empty bridges array', () => {
      const universe: UniverseGraph = {
        regions: [],
        bridges: [],
      };

      const removedIds = service.pruneWeakBridges(universe);

      expect(removedIds.length).toBe(0);
    });
  });
});
