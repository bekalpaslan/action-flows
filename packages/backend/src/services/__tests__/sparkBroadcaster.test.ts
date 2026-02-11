/**
 * SparkBroadcaster Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SparkBroadcaster } from '../sparkBroadcaster.js';
import type { ChainId, SessionId } from '@afw/shared';

describe('SparkBroadcaster', () => {
  let broadcaster: SparkBroadcaster;
  let emittedEvents: any[];

  beforeEach(() => {
    broadcaster = new SparkBroadcaster();
    emittedEvents = [];

    // Capture emitted events
    broadcaster.on('spark:traveling', (event) => {
      emittedEvents.push(event);
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    broadcaster.shutdown();
    vi.useRealTimers();
  });

  describe('startSpark', () => {
    it('should start spark animation and emit initial position', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 3000);

      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0]).toMatchObject({
        type: 'chain:spark_traveling',
        chainId,
        sessionId,
        fromRegion: 'region-explore',
        toRegion: 'region-work',
        progress: 0.0,
      });
    });

    it('should skip self-loop transitions (same region)', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'code', 'code/backend', 3000);

      expect(emittedEvents.length).toBe(0);
      expect(broadcaster.getActiveSparkCount()).toBe(0);
    });

    it('should enforce max 5 concurrent sparks', () => {
      const sessionId = 'session-1' as SessionId;

      // Start 5 sparks (should succeed)
      for (let i = 1; i <= 5; i++) {
        broadcaster.startSpark(
          `chain-${i}` as ChainId,
          sessionId,
          'analyze',
          'code',
          3000
        );
      }

      expect(broadcaster.getActiveSparkCount()).toBe(5);

      // Try to start 6th spark (should fail)
      broadcaster.startSpark('chain-6' as ChainId, sessionId, 'analyze', 'code', 3000);

      expect(broadcaster.getActiveSparkCount()).toBe(5);
    });
  });

  describe('progress updates', () => {
    it('should broadcast progress updates every 100ms', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 1000);
      emittedEvents = []; // Clear initial event

      // Advance 100ms
      vi.advanceTimersByTime(100);

      expect(emittedEvents.length).toBeGreaterThan(0);
      expect(emittedEvents[0].progress).toBeGreaterThan(0);
    });

    it('should apply 5% progress throttling', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 10000); // Long duration
      emittedEvents = []; // Clear initial event

      // Advance 50ms (0.5% progress) - should NOT broadcast
      vi.advanceTimersByTime(50);
      expect(emittedEvents.length).toBe(0);

      // Advance 500ms (5% progress total) - should broadcast
      vi.advanceTimersByTime(450);
      expect(emittedEvents.length).toBeGreaterThan(0);
    });

    it('should cap progress at 95%', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 1000);
      emittedEvents = [];

      // Advance beyond estimated duration
      vi.advanceTimersByTime(2000);

      // Find highest progress value
      const maxProgress = Math.max(...emittedEvents.map((e) => e.progress));
      expect(maxProgress).toBeLessThanOrEqual(0.95);
    });
  });

  describe('completeSpark', () => {
    it('should emit final position at 100% progress', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 3000);
      emittedEvents = [];

      broadcaster.completeSpark(chainId);

      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0].progress).toBe(1.0);
    });

    it('should cleanup timer and remove from active sparks', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 3000);
      expect(broadcaster.getActiveSparkCount()).toBe(1);

      broadcaster.completeSpark(chainId);
      expect(broadcaster.getActiveSparkCount()).toBe(0);

      // Advancing time should NOT emit more events
      emittedEvents = [];
      vi.advanceTimersByTime(1000);
      expect(emittedEvents.length).toBe(0);
    });

    it('should handle completing non-existent spark gracefully', () => {
      const chainId = 'chain-nonexistent' as ChainId;

      expect(() => {
        broadcaster.completeSpark(chainId);
      }).not.toThrow();

      expect(emittedEvents.length).toBe(0);
    });
  });

  describe('stopSpark', () => {
    it('should stop spark animation prematurely', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 3000);
      expect(broadcaster.getActiveSparkCount()).toBe(1);

      broadcaster.stopSpark(chainId);
      expect(broadcaster.getActiveSparkCount()).toBe(0);

      // Advancing time should NOT emit more events
      emittedEvents = [];
      vi.advanceTimersByTime(1000);
      expect(emittedEvents.length).toBe(0);
    });
  });

  describe('shutdown', () => {
    it('should cleanup all active sparks', () => {
      const sessionId = 'session-1' as SessionId;

      // Start multiple sparks
      broadcaster.startSpark('chain-1' as ChainId, sessionId, 'analyze', 'code', 3000);
      broadcaster.startSpark('chain-2' as ChainId, sessionId, 'code', 'review', 3000);
      broadcaster.startSpark('chain-3' as ChainId, sessionId, 'review', 'plan', 3000);

      expect(broadcaster.getActiveSparkCount()).toBe(3);

      broadcaster.shutdown();

      expect(broadcaster.getActiveSparkCount()).toBe(0);

      // Advancing time should NOT emit more events
      emittedEvents = [];
      vi.advanceTimersByTime(1000);
      expect(emittedEvents.length).toBe(0);
    });
  });

  describe('event payload structure', () => {
    it('should emit correct event structure', () => {
      const chainId = 'chain-1' as ChainId;
      const sessionId = 'session-1' as SessionId;

      broadcaster.startSpark(chainId, sessionId, 'analyze', 'code', 3000);

      const event = emittedEvents[0];

      expect(event).toHaveProperty('type', 'chain:spark_traveling');
      expect(event).toHaveProperty('chainId', chainId);
      expect(event).toHaveProperty('sessionId', sessionId);
      expect(event).toHaveProperty('fromRegion', 'region-explore');
      expect(event).toHaveProperty('toRegion', 'region-work');
      expect(event).toHaveProperty('progress');
      expect(event).toHaveProperty('timestamp');

      expect(typeof event.progress).toBe('number');
      expect(event.progress).toBeGreaterThanOrEqual(0);
      expect(event.progress).toBeLessThanOrEqual(1);
      expect(typeof event.timestamp).toBe('number');
    });
  });
});
