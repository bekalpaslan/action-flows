/**
 * HealingQuotaTracker Service Tests
 *
 * Tests for daily quota enforcement, date-keyed reset, and circuit breaker detection.
 * RED phase: These tests will fail until Plan 04 creates the HealingQuotaTracker service.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealingQuotaTracker } from '../healingQuotaTracker.js';
import type { HealingQuota } from '@afw/shared';

/**
 * Creates a mock KV storage backed by a simple Map.
 * Mirrors the optional KV interface on Storage (get, set, keys, delete).
 */
function createMockStorage() {
  const data = new Map<string, string>();
  return {
    get: vi.fn((key: string) => data.get(key) ?? null),
    set: vi.fn((key: string, value: string) => { data.set(key, value); }),
    keys: vi.fn((pattern: string) => {
      // Convert a glob-style pattern (with one or more `*` wildcards) to a regex.
      // The healing quota tracker calls keys('healingQuota:*:*:${date}'), which has
      // multiple wildcards — a naive String.prototype.replace('*', '') only handles
      // the first wildcard and produces an unmatched literal `*` mid-string.
      // Production storage implementations (Memory, Redis) match multi-wildcard
      // patterns correctly; this mock now mirrors that behaviour.
      const regexSource = pattern
        .split('*')
        .map(segment => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*');
      const regex = new RegExp(`^${regexSource}$`);
      return [...data.keys()].filter(k => regex.test(k));
    }),
    delete: vi.fn((key: string) => data.delete(key)),
  };
}

describe('HealingQuotaTracker', () => {
  let tracker: HealingQuotaTracker;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    mockStorage = createMockStorage();
    tracker = new HealingQuotaTracker(mockStorage);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayQuota', () => {
    it('should return zero attempts when no prior attempts exist', async () => {
      const quota: HealingQuota = await tracker.getTodayQuota('work', 'build-flow');

      expect(quota.attemptsUsed).toBe(0);
      expect(quota.maxAttempts).toBe(2);
      expect(quota.workbenchId).toBe('work');
      expect(quota.flowId).toBe('build-flow');
      expect(quota.date).toBe('2026-04-05');
    });
  });

  describe('incrementAttempt', () => {
    it('should increase attemptsUsed by 1 and persist to storage', async () => {
      await tracker.incrementAttempt('work', 'build-flow');

      const quota = await tracker.getTodayQuota('work', 'build-flow');
      expect(quota.attemptsUsed).toBe(1);
      expect(mockStorage.set).toHaveBeenCalled();
    });
  });

  describe('isQuotaExhausted', () => {
    it('should return false when attemptsUsed < 2', async () => {
      await tracker.incrementAttempt('work', 'build-flow');

      const isExhausted = await tracker.isQuotaExhausted('work', 'build-flow');
      expect(isExhausted).toBe(false);
    });

    it('should return true when attemptsUsed >= 2', async () => {
      await tracker.incrementAttempt('work', 'build-flow');
      await tracker.incrementAttempt('work', 'build-flow');

      const isExhausted = await tracker.isQuotaExhausted('work', 'build-flow');
      expect(isExhausted).toBe(true);
    });
  });

  describe('daily reset', () => {
    it('should not carry over quota from yesterday (date-keyed storage)', async () => {
      // Use 2 attempts on April 5
      await tracker.incrementAttempt('work', 'build-flow');
      await tracker.incrementAttempt('work', 'build-flow');

      const exhaustedToday = await tracker.isQuotaExhausted('work', 'build-flow');
      expect(exhaustedToday).toBe(true);

      // Advance to April 6
      vi.setSystemTime(new Date('2026-04-06T12:00:00Z'));

      const quotaNextDay = await tracker.getTodayQuota('work', 'build-flow');
      expect(quotaNextDay.attemptsUsed).toBe(0);
      expect(quotaNextDay.date).toBe('2026-04-06');

      const exhaustedNextDay = await tracker.isQuotaExhausted('work', 'build-flow');
      expect(exhaustedNextDay).toBe(false);
    });
  });

  describe('getActiveCircuitBreakers', () => {
    it('should return only quotas where attemptsUsed >= maxAttempts', async () => {
      // Exhaust quota for work/build-flow
      await tracker.incrementAttempt('work', 'build-flow');
      await tracker.incrementAttempt('work', 'build-flow');

      // Use 1 attempt for explore/analyze-flow (not exhausted)
      await tracker.incrementAttempt('explore', 'analyze-flow');

      const breakers = await tracker.getActiveCircuitBreakers();

      expect(breakers.length).toBe(1);
      expect(breakers[0]!.workbenchId).toBe('work');
      expect(breakers[0]!.flowId).toBe('build-flow');
      expect(breakers[0]!.attemptsUsed).toBeGreaterThanOrEqual(2);
    });
  });
});
