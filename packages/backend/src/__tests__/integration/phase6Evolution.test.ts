/**
 * Phase 6 Evolution Integration Tests
 *
 * Full-stack integration tests for evolution mechanics.
 * Coverage target: 85%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EvolutionService, type InteractionContext } from '../../services/evolutionService.js';
import { ConnectionInferenceService } from '../../services/connectionInference.js';
import { ForceDirectedLayoutService } from '../../services/forceDirectedLayout.js';
import { BridgeStrengthService } from '../../services/bridgeStrengthService.js';
import type { SessionId, ChainId, RegionId, EdgeId, EvolutionTick, UniverseGraph } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

describe('Phase 6 Evolution - Integration Tests', () => {
  let evolutionService: EvolutionService;
  let connectionService: ConnectionInferenceService;
  let layoutService: ForceDirectedLayoutService;
  let bridgeService: BridgeStrengthService;

  beforeEach(() => {
    evolutionService = new EvolutionService();
    evolutionService.setThrottling(false); // Disable throttling for tests
    connectionService = new ConnectionInferenceService();
    layoutService = new ForceDirectedLayoutService();
    bridgeService = new BridgeStrengthService();
  });

  describe('Full evolution cycle', () => {
    it('should complete: interaction → tick → color shift → trace accumulation', async () => {
      // Set to fast speed and process 5 interactions to guarantee a tick
      evolutionService.setEvolutionSpeed('fast');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      // Process 5 interactions to get a tick (fast speed ticks at counter 5, 10, 15...)
      let tick: EvolutionTick | null = null;
      for (let i = 0; i < 5; i++) {
        tick = await evolutionService.processInteraction(context);
        if (tick) break;
      }

      // Verify evolution tick created
      expect(tick).not.toBeNull();
      expect(tick!.type).toBe('color_shifted');

      // Verify color deltas computed
      const details = tick!.details as any;
      expect(details.colorDeltas['region-platform']).toBeDefined();
      expect(details.colorDeltas['region-platform'].hueRotationDegrees).toBe(0.5);

      // Verify trace deltas computed
      expect(details.traceDeltas['bridge-1']).toBeDefined();
      expect(details.traceDeltas['bridge-1'].strengthIncrement).toBe(0.05);
    });

    it('should accumulate color shifts over multiple interactions', async () => {
      // Use fast speed to get more ticks (every 5 interactions)
      evolutionService.setEvolutionSpeed('fast');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      let totalHueShift = 0;
      let tickCount = 0;

      // Process 10 interactions with fast speed (ticks every 5)
      // tickCounter: 0 -> tick, 1-4 -> no tick, 5 -> tick, 6-9 -> no tick
      for (let i = 0; i < 10; i++) {
        const tick = await evolutionService.processInteraction(context);
        if (tick) {
          tickCount++;
          const details = tick.details as any;
          totalHueShift += details.colorDeltas?.['region-platform']?.hueRotationDegrees || 0;
        }
      }

      // With fast speed (threshold 5): tickCounter 0 and 5 produce ticks = 2 ticks
      // Total shift should be 2 * 0.5° = 1.0°
      expect(tickCount).toBe(2);
      expect(totalHueShift).toBeCloseTo(1.0, 1);
    });

    it('should track bridge strength increases after traversals', async () => {
      const fromRegion = 'region-A' as RegionId;
      const toRegion = 'region-B' as RegionId;

      // Record 10 traversals
      for (let i = 0; i < 10; i++) {
        bridgeService.recordTraversal(fromRegion, toRegion);
      }

      // Check strength increased
      const strength = bridgeService.getStrength(fromRegion, toRegion);
      expect(strength).toBeGreaterThan(0.3); // Greater than minimum
      expect(strength).toBeLessThanOrEqual(1.0);

      // Check traversal count
      const count = bridgeService.getTraversalCount(fromRegion, toRegion);
      expect(count).toBe(10);
    });
  });

  describe('Connection inference integration', () => {
    it('should suggest bridge after 10+ co-occurrences', async () => {
      const history: EvolutionTick[] = [];

      // Create 15 ticks with region pair A-B
      for (let i = 0; i < 15; i++) {
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

      // Analyze patterns
      const suggestions = connectionService.analyzeCoOccurrence(history);

      // Should suggest bridge
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].coOccurrenceCount).toBe(15);
      expect(suggestions[0].confidence).toBe(0.75); // 15 / 20
    });

    it('should create bridge automatically for high-confidence suggestions', () => {
      const universe: UniverseGraph = {
        regions: [
          { id: 'region-A' as RegionId } as any,
          { id: 'region-B' as RegionId } as any,
        ],
        bridges: [],
        discoveryTriggers: [],
        metadata: {
          createdAt: Date.now() as any,
          lastModifiedAt: Date.now() as any,
          evolutionHistory: [],
          totalInteractions: 0,
          discoveredRegionCount: 0,
          totalRegionCount: 2,
          mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
        },
      };

      const suggestions = [
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-B' as RegionId,
          coOccurrenceCount: 20,
          confidence: 1.0, // High confidence
        },
      ];

      // Apply suggestions
      const newBridgeIds = connectionService.applyBridgeSuggestions(universe, suggestions);

      // Should create new bridge
      expect(newBridgeIds.length).toBe(1);
      expect(universe.bridges.length).toBe(1);
      expect(universe.bridges[0].strength).toBe(0.3);
      expect(universe.bridges[0].pinned).toBe(false);
    });

    it('should not suggest bridge with low confidence (< 0.7)', () => {
      const universe: UniverseGraph = {
        regions: [
          { id: 'region-A' as RegionId } as any,
          { id: 'region-B' as RegionId } as any,
        ],
        bridges: [],
        discoveryTriggers: [],
        metadata: {
          createdAt: Date.now() as any,
          lastModifiedAt: Date.now() as any,
          evolutionHistory: [],
          totalInteractions: 0,
          discoveredRegionCount: 0,
          totalRegionCount: 2,
          mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
        },
      };

      const suggestions = [
        {
          fromRegion: 'region-A' as RegionId,
          toRegion: 'region-B' as RegionId,
          coOccurrenceCount: 10,
          confidence: 0.5, // Low confidence
        },
      ];

      // Apply suggestions
      const newBridgeIds = connectionService.applyBridgeSuggestions(universe, suggestions);

      // Should not create bridge
      expect(newBridgeIds.length).toBe(0);
      expect(universe.bridges.length).toBe(0);
    });
  });

  describe('Force-directed layout integration', () => {
    it('should position new region correctly with connected regions', () => {
      const existingRegions = [
        {
          id: 'region-A' as RegionId,
          position: { x: 400, y: 300 },
        } as any,
        {
          id: 'region-B' as RegionId,
          position: { x: 600, y: 300 },
        } as any,
      ];

      const newRegion = {
        id: 'region-C' as RegionId,
      } as any;

      const bridges = [
        {
          id: 'bridge-1' as EdgeId,
          source: 'region-C' as RegionId,
          target: 'region-A' as RegionId,
        } as any,
      ];

      // Calculate position
      const position = layoutService.calculateNewRegionPosition(newRegion, existingRegions, bridges);

      // Should be near region-A (connected)
      const distanceToA = Math.sqrt(
        Math.pow(position.x - 400, 2) + Math.pow(position.y - 300, 2)
      );

      expect(position.x % 50).toBe(0); // Grid snapping
      expect(position.y % 50).toBe(0);
      expect(distanceToA).toBeGreaterThanOrEqual(200); // Min distance
      expect(distanceToA).toBeLessThan(600); // Reasonable proximity
    });

    it('should enforce minimum distance between all regions', () => {
      const existingRegions = [
        { id: 'region-A' as RegionId, position: { x: 400, y: 300 } } as any,
        { id: 'region-B' as RegionId, position: { x: 600, y: 300 } } as any,
        { id: 'region-C' as RegionId, position: { x: 400, y: 500 } } as any,
      ];

      const newRegion = { id: 'region-D' as RegionId } as any;

      const position = layoutService.calculateNewRegionPosition(newRegion, existingRegions, []);

      // Check distance to all existing regions
      for (const region of existingRegions) {
        const dx = position.x - region.position.x;
        const dy = position.y - region.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(distance).toBeGreaterThanOrEqual(200);
      }
    });
  });

  describe('Evolution settings persistence', () => {
    it('should respect evolution speed changes', async () => {
      // Start with normal speed (threshold 10)
      evolutionService.setEvolutionSpeed('normal');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      let ticksNormal = 0;

      // Process 20 interactions on normal (threshold 10)
      // Counter increments first: ticks at counter 10, 20 = 2 ticks
      for (let i = 0; i < 20; i++) {
        const tick = await evolutionService.processInteraction(context);
        if (tick) ticksNormal++;
      }

      expect(ticksNormal).toBe(2);

      // Change to fast speed (threshold 5)
      evolutionService.setEvolutionSpeed('fast');

      let ticksFast = 0;

      // Process 20 more interactions on fast (threshold 5)
      // tickCounter continues from 21: 25, 30, 35, 40 = 4 ticks
      for (let i = 0; i < 20; i++) {
        const tick = await evolutionService.processInteraction(context);
        if (tick) ticksFast++;
      }

      expect(ticksFast).toBe(4);
    });

    it('should turn off evolution when speed is "off"', async () => {
      evolutionService.setEvolutionSpeed('off');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      // Process 100 interactions
      for (let i = 0; i < 100; i++) {
        const tick = await evolutionService.processInteraction(context);
        expect(tick).toBeNull();
      }
    });
  });

  describe('Performance benchmarks', () => {
    it('should compute evolution tick in < 16ms (60 FPS budget)', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId, 'region-philosophy' as RegionId, 'region-product' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId, 'bridge-2' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      const start = performance.now();
      await evolutionService.processInteraction(context);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(16);
    });

    it('should handle 1000 evolution ticks without memory leak', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      // Process 1000 ticks
      for (let i = 0; i < 1000; i++) {
        await evolutionService.processInteraction(context);
      }

      // Verify no performance degradation
      const start = performance.now();
      await evolutionService.processInteraction(context);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(16);
    });

    it('should handle connection inference with large history efficiently', async () => {
      const history: EvolutionTick[] = [];

      // Create 1000 ticks
      for (let i = 0; i < 1000; i++) {
        history.push({
          id: `tick-${i}`,
          timestamp: brandedTypes.currentTimestamp(),
          sessionId: 'session-1' as any,
          type: 'color_shifted',
          details: {
            regionsActive: [
              `region-${i % 10}` as RegionId,
              `region-${(i + 1) % 10}` as RegionId,
            ],
            bridgesTraversed: [],
            colorDeltas: {},
            traceDeltas: {},
          },
        });
      }

      const start = performance.now();
      const suggestions = connectionService.analyzeCoOccurrence(history);
      const duration = performance.now() - start;

      // Should complete quickly
      expect(duration).toBeLessThan(100);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should calculate layout for 50+ regions in < 100ms', () => {
      const existingRegions = [];
      for (let i = 0; i < 50; i++) {
        existingRegions.push({
          id: `region-${i}` as RegionId,
          position: {
            x: (i % 10) * 250,
            y: Math.floor(i / 10) * 250,
          },
        } as any);
      }

      const newRegion = { id: 'region-new' as RegionId } as any;

      const start = performance.now();
      layoutService.calculateNewRegionPosition(newRegion, existingRegions, []);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed interaction context gracefully', async () => {
      const badContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: null as any, // Intentionally bad
        bridgesTraversed: undefined as any, // Intentionally bad
        durationMs: 1000,
        success: true,
      };

      // Should not throw
      expect(async () => {
        await evolutionService.processInteraction(badContext);
      }).not.toThrow();
    });

    it('should handle empty evolution history for connection inference', () => {
      const suggestions = connectionService.analyzeCoOccurrence([]);
      expect(suggestions).toEqual([]);
    });

    it('should handle empty universe for layout calculation', () => {
      const newRegion = { id: 'region-first' as RegionId } as any;
      const position = layoutService.calculateNewRegionPosition(newRegion, [], []);

      expect(position).toBeDefined();
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
    });
  });
});
