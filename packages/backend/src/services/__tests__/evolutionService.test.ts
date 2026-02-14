/**
 * Evolution Service Tests
 *
 * Comprehensive test suite for the Evolution Service.
 * Coverage target: 90%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EvolutionService, type InteractionContext } from '../evolutionService.js';
import type { SessionId, ChainId, RegionId, EdgeId } from '@afw/shared';

describe('EvolutionService', () => {
  let service: EvolutionService;

  beforeEach(async () => {
    service = new EvolutionService();
    service.setThrottling(false);

    // Prime the tick counter by calling processInteraction 9 times
    // so that the next call (in the test) will be the 10th and will tick
    // (normal speed threshold is 10)
    const dummyContext: InteractionContext = {
      sessionId: 'session-init' as SessionId,
      chainId: 'chain-init' as ChainId,
      regionsActive: [],
      bridgesTraversed: [],
      durationMs: 0,
      success: true,
    };
    for (let i = 0; i < 9; i++) {
      await service.processInteraction(dummyContext);
    }
  });

  describe('processInteraction', () => {
    it('should compute color deltas for active regions', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId, 'region-philosophy' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).toBeDefined();
      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.colorDeltas).toBeDefined();
      expect(details.colorDeltas['region-platform']).toBeDefined();
      expect(details.colorDeltas['region-platform'].hueRotationDegrees).toBeGreaterThan(0);
      expect(details.colorDeltas['region-philosophy']).toBeDefined();
    });

    it('should compute trace deltas for traversed bridges', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId, 'bridge-2' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).toBeDefined();
      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.traceDeltas).toBeDefined();
      expect(details.traceDeltas['bridge-1']).toBeDefined();
      expect(details.traceDeltas['bridge-1'].strengthIncrement).toBe(0.05);
      expect(details.traceDeltas['bridge-2']).toBeDefined();
    });

    it('should respect evolution speed setting - off', async () => {
      service.setEvolutionSpeed('off');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);
      expect(tick).toBeNull();
    });

    it('should respect evolution speed setting - slow', async () => {
      service.resetTracking(); // Reset counter to test the full 1-20 sequence
      service.setEvolutionSpeed('slow');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      // First 19 interactions should return null (slow = every 20 interactions)
      for (let i = 0; i < 19; i++) {
        const tick = await service.processInteraction(context);
        expect(tick).toBeNull();
      }

      // 20th interaction should trigger tick
      const tick20 = await service.processInteraction(context);
      expect(tick20).not.toBeNull();
    });

    it('should create evolution tick with correct structure', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).toMatchObject({
        id: expect.stringContaining('tick-'),
        timestamp: expect.any(Number),
        sessionId: 'session-1',
        type: expect.stringMatching(/color_shifted|map_expanded/),
        details: {
          colorDeltas: expect.any(Object),
          traceDeltas: expect.any(Object),
          regionsActive: expect.arrayContaining(['region-platform']),
          bridgesTraversed: expect.arrayContaining(['bridge-1']),
        },
      });
    });

    it('should handle empty active regions gracefully', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: [],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.colorDeltas).toEqual({});
      expect(details.traceDeltas).toEqual({});
    });

    it('should handle empty traversed bridges gracefully', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      expect(details.traceDeltas).toEqual({});
    });
  });

  describe('shouldTick - speed thresholds', () => {
    it('should never tick when speed is off', async () => {
      service.setEvolutionSpeed('off');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      // Process 100 interactions - none should tick
      for (let i = 0; i < 100; i++) {
        const tick = await service.processInteraction(context);
        expect(tick).toBeNull();
      }
    });

    it('should tick every 20 interactions on slow speed', async () => {
      service.setEvolutionSpeed('slow');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      let tickCount = 0;

      // Process 100 interactions - should tick 5 times (every 20)
      for (let i = 0; i < 100; i++) {
        const tick = await service.processInteraction(context);
        if (tick !== null) {
          tickCount++;
        }
      }

      expect(tickCount).toBe(5);
    });

    it('should tick every 10 interactions on normal speed', async () => {
      service.setEvolutionSpeed('normal');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      let tickCount = 0;

      // Process 100 interactions - should tick 10 times (every 10)
      for (let i = 0; i < 100; i++) {
        const tick = await service.processInteraction(context);
        if (tick !== null) {
          tickCount++;
        }
      }

      expect(tickCount).toBe(10);
    });

    it('should tick every 5 interactions on fast speed', async () => {
      service.setEvolutionSpeed('fast');

      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      let tickCount = 0;

      // Process 100 interactions - should tick 20 times (every 5)
      for (let i = 0; i < 100; i++) {
        const tick = await service.processInteraction(context);
        if (tick !== null) {
          tickCount++;
        }
      }

      expect(tickCount).toBe(20);
    });
  });

  describe('color delta computation', () => {
    it('should compute hue rotation delta of 0.5 degrees per interaction', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      const delta = details.colorDeltas['region-platform'];
      expect(delta.hueRotationDegrees).toBe(0.5);
    });

    it('should compute temperature delta of 0.01 per interaction', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      const delta = details.colorDeltas['region-platform'];
      expect(delta.temperatureDelta).toBe(0.01);
    });

    it('should compute saturation delta of 0.005 per interaction', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      const delta = details.colorDeltas['region-platform'];
      expect(delta.saturationDelta).toBe(0.005);
    });
  });

  describe('trace delta computation', () => {
    it('should compute strength increment of 0.05 per traversal', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: [],
        bridgesTraversed: ['bridge-1' as EdgeId],
        durationMs: 1000,
        success: true,
      };

      const tick = await service.processInteraction(context);

      expect(tick).not.toBeNull();
      const details = tick!.details as any;
      const delta = details.traceDeltas['bridge-1'];
      expect(delta.strengthIncrement).toBe(0.05);
      expect(delta.timestamp).toBeGreaterThan(0);
    });
  });

  describe('setEvolutionSpeed', () => {
    it('should update evolution speed setting', () => {
      expect(() => service.setEvolutionSpeed('slow')).not.toThrow();
      expect(() => service.setEvolutionSpeed('normal')).not.toThrow();
      expect(() => service.setEvolutionSpeed('fast')).not.toThrow();
      expect(() => service.setEvolutionSpeed('off')).not.toThrow();
    });
  });

  describe('setAutoInference', () => {
    it('should update auto inference setting', () => {
      expect(() => service.setAutoInference(true)).not.toThrow();
      expect(() => service.setAutoInference(false)).not.toThrow();
    });
  });

  describe('performance', () => {
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
      await service.processInteraction(context);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(16);
    });

    it('should handle 1000 ticks without performance degradation', async () => {
      const context: InteractionContext = {
        sessionId: 'session-1' as SessionId,
        chainId: 'chain-1' as ChainId,
        regionsActive: ['region-platform' as RegionId],
        bridgesTraversed: [],
        durationMs: 1000,
        success: true,
      };

      // Measure first tick
      const start1 = performance.now();
      await service.processInteraction(context);
      const duration1 = performance.now() - start1;

      // Process 999 more ticks
      for (let i = 0; i < 999; i++) {
        await service.processInteraction(context);
      }

      // Measure 1000th tick
      const start1000 = performance.now();
      await service.processInteraction(context);
      const duration1000 = performance.now() - start1000;

      // 1000th tick should not be significantly slower than 1st tick
      expect(duration1000).toBeLessThan(duration1 * 2);
    });
  });
});
