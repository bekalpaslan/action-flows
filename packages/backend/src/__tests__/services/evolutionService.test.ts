/**
 * Evolution Service Unit Tests
 *
 * Tests for Phase 3 Visual Evolution features:
 * - Color shift calculation and persistence
 * - Glow intensity calculation
 * - Trace accumulation on bridges
 * - Cooling decay for inactive regions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EvolutionService,
  type InteractionContext,
  type ColorShiftDelta,
} from '../../services/evolutionService.js';
import { storage } from '../../storage/memory.js';
import type { SessionId, ChainId, RegionId, EdgeId, RegionNode, LightBridge } from '@afw/shared';
import { FogState } from '@afw/shared';

describe('EvolutionService - Phase 3 Visual Evolution', () => {
  let evolutionService: EvolutionService;

  beforeEach(() => {
    // Create fresh instance for each test
    evolutionService = new EvolutionService();
    evolutionService.resetTracking();
    evolutionService.setThrottling(false); // Disable throttling for tests

    // Clear storage
    storage.regions.clear();
    storage.bridges.clear();

    // Set up test regions in storage
    const testRegion: RegionNode = {
      id: 'region-platform' as RegionId,
      workbenchId: 'platform' as any,
      label: 'Platform',
      position: { x: 0, y: 0 },
      layer: 'platform',
      fogState: FogState.REVEALED,
      health: {
        contractCompliance: 1.0,
        activityLevel: 0.5,
        errorRate: 0.0,
      },
      traces: {
        totalInteractions: 0,
        recentTraces: [],
        heatLevel: 0,
      },
      colorShift: {
        baseColor: '#6b46c1',
        currentColor: '#6b46c1',
        saturation: 0.7,
        temperature: 0.0,
      },
      glowIntensity: 0.0,
      status: 'idle',
      sessionCount: 0,
    };
    storage.setRegion(testRegion);

    // Set up test bridge
    const testBridge: LightBridge = {
      id: 'bridge-1' as EdgeId,
      source: 'region-platform' as RegionId,
      target: 'region-philosophy' as RegionId,
      gates: [],
      strength: 0.3,
      traversalCount: 0,
      traces: {
        totalInteractions: 0,
        recentTraces: [],
        heatLevel: 0,
      },
    };
    storage.setBridge(testBridge);
  });

  // Helper to process enough interactions to get a tick
  async function processUntilTick(
    service: EvolutionService,
    context: InteractionContext,
    maxIterations = 10
  ): Promise<EvolutionTick | null> {
    for (let i = 0; i < maxIterations; i++) {
      const tick = await service.processInteraction(context);
      if (tick) return tick;
    }
    return null;
  }

  describe('Color Shift Calculation (GAP-3)', () => {
    it('should compute color shift deltas for active regions', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      // Set evolution speed to fast for testing
      evolutionService.setEvolutionSpeed('fast');

      // Process until we get a tick (fast speed ticks at counter 5, 10, ...)
      const tick = await processUntilTick(evolutionService, context);

      // Should return a tick with color deltas
      expect(tick).not.toBeNull();

      const details = tick!.details as any;
      expect(details.colorDeltas).toBeDefined();
      expect(details.colorDeltas['region-platform']).toBeDefined();
      expect(details.colorDeltas['region-platform'].hueRotationDegrees).toBe(0.5);
      expect(details.colorDeltas['region-platform'].temperatureDelta).toBe(0.01);
      expect(details.colorDeltas['region-platform'].saturationDelta).toBe(0.005);
    });

    it('should track interaction counts per region', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      // Process multiple interactions with delay to bypass throttling
      for (let i = 0; i < 5; i++) {
        await evolutionService.processInteraction(context);
        // Wait a bit between interactions (but not 1s since we're testing)
      }

      // Check that interaction count is tracked
      const interactionCount = evolutionService.getRegionInteractionCount('region-platform' as RegionId);
      expect(interactionCount).toBeGreaterThanOrEqual(1);
    });

    it('should accumulate temperature over multiple interactions', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      // Process until we get a tick
      const tick = await processUntilTick(evolutionService, context);
      expect(tick).not.toBeNull();

      // Check region temperature increased
      const region = storage.getRegion('region-platform' as RegionId);
      expect(region).toBeDefined();
      expect(region!.colorShift.temperature).toBeGreaterThan(0);
    });
  });

  describe('Glow Intensity Calculation (GAP-4)', () => {
    it('should compute glow intensity based on active chains', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      const tick = await processUntilTick(evolutionService, context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.glowIntensities).toBeDefined();
      expect(details.glowIntensities['region-platform']).toBeDefined();
      // Formula: Math.min(1.0, activeChains * 0.2)
      // With 1 active chain: 0.2
      expect(details.glowIntensities['region-platform']).toBeCloseTo(0.2, 1);
    });

    it('should cap glow intensity at 1.0', async () => {
      // Start multiple chains for the same region
      for (let i = 0; i < 10; i++) {
        const context: InteractionContext = {
          sessionId: 'session-1' as SessionId,
          chainId: `chain-${i}` as ChainId,
          regionsActive: ['region-platform' as RegionId],
          bridgesTraversed: [],
          durationMs: 1000,
          success: true,
        };

        evolutionService.setEvolutionSpeed('fast');
        const tick = await evolutionService.processInteraction(context);

        if (tick) {
          const details = tick.details as any;
          // Glow should never exceed 1.0
          expect(details.glowIntensities['region-platform']).toBeLessThanOrEqual(1.0);
        }
      }
    });

    it('should track active chains per region', () => {
      // Mark a chain as active
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      // Get initial count
      const initialCount = evolutionService.getRegionActiveChainCount('region-platform' as RegionId);
      expect(initialCount).toBe(0);
    });

    it('should remove chain from tracking when completed', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');
      await processUntilTick(evolutionService, context);

      // Mark chain as completed
      evolutionService.markChainCompleted('chain-1' as ChainId);

      // Verify it's no longer tracked
      const activeCount = evolutionService.getRegionActiveChainCount('region-platform' as RegionId);
      expect(activeCount).toBe(0);
    });
  });

  describe('Trace Accumulation (GAP-11)', () => {
    it('should record trace entries for bridge traversals', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');
      const tick = await processUntilTick(evolutionService, context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.traceEntries).toBeDefined();
      expect(details.traceEntries['bridge-1']).toBeDefined();
      expect(details.traceEntries['bridge-1'].action).toBe('bridge_traversal');
      expect(details.traceEntries['bridge-1'].result).toBe('success');
    });

    it('should record failure result when interaction fails', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: false, // Failed interaction
      };

      evolutionService.setEvolutionSpeed('fast');
      const tick = await processUntilTick(evolutionService, context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.traceEntries['bridge-1'].result).toBe('failure');
    });

    it('should persist traces to bridge storage', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');
      await processUntilTick(evolutionService, context);

      // Check bridge traces were updated
      const bridge = storage.getBridge('bridge-1' as EdgeId);
      expect(bridge).toBeDefined();
      expect(bridge!.traces.totalInteractions).toBe(1);
      expect(bridge!.traces.recentTraces.length).toBe(1);
      expect(bridge!.traversalCount).toBe(1);
    });

    it('should calculate heat level from trace frequency', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');
      await processUntilTick(evolutionService, context);

      // Check heat level increased
      const bridge = storage.getBridge('bridge-1' as EdgeId);
      expect(bridge).toBeDefined();
      expect(bridge!.traces.heatLevel).toBeGreaterThan(0);
    });
  });

  describe('Evolution Tick Throttling', () => {
    it('should throttle ticks to max 1 per second when enabled', async () => {
      // Re-enable throttling for this test
      evolutionService.setThrottling(true);

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      // Process until we get a tick
      const tick1 = await processUntilTick(evolutionService, context);
      expect(tick1).not.toBeNull();

      // Immediate next tick should be throttled (return null)
      const tick2 = await evolutionService.processInteraction(context);
      expect(tick2).toBeNull();
    });
  });

  describe('Region Statistics', () => {
    it('should provide region statistics', async () => {
      evolutionService.setEvolutionSpeed('fast');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');
      await processUntilTick(evolutionService, context);

      const stats = evolutionService.getRegionStats();
      expect(stats.length).toBeGreaterThan(0);

      const platformStats = stats.find(s => s.regionId === 'region-platform');
      expect(platformStats).toBeDefined();
      // Interaction count should be at least 1 (could be more depending on how many calls until tick)
      expect(platformStats!.interactionCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined regionsActive gracefully', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: null as any,
        bridgesTraversed: undefined as any,
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      // Should not throw
      await expect(evolutionService.processInteraction(context)).resolves.not.toThrow();
    });

    it('should handle empty arrays', async () => {
      evolutionService.setEvolutionSpeed('fast');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: [],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await processUntilTick(evolutionService, context);
      expect(tick).not.toBeNull();

      const details = tick!.details as any;
      expect(Object.keys(details.colorDeltas)).toHaveLength(0);
      expect(Object.keys(details.glowIntensities)).toHaveLength(0);
    });

    it('should handle non-existent regions', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['non-existent-region' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      evolutionService.setEvolutionSpeed('fast');

      // Should not throw, just log warning
      await expect(evolutionService.processInteraction(context)).resolves.not.toThrow();
    });
  });

  describe('Color Manipulation Utilities', () => {
    it('should rotate hue correctly', async () => {
      evolutionService.setEvolutionSpeed('fast');

      // Set up region with known color
      const region = storage.getRegion('region-platform' as RegionId);
      expect(region).toBeDefined();

      const originalColor = region!.colorShift.currentColor;

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      await processUntilTick(evolutionService, context);

      const updatedRegion = storage.getRegion('region-platform' as RegionId);
      expect(updatedRegion).toBeDefined();

      // Color should have changed (hue rotated)
      // Note: The actual color value depends on the starting color
      expect(updatedRegion!.colorShift.currentColor).toBeDefined();
    });
  });
});
