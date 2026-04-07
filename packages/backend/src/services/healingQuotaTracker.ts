/**
 * Healing Quota Tracker
 *
 * Tracks daily healing attempt quotas per workbench-flow pair.
 * Uses date-keyed storage keys for automatic daily reset (no cron needed).
 * Circuit breaker activates after MAX_HEALING_ATTEMPTS_PER_DAY attempts.
 */

import type { Storage } from '../storage/index.js';
import type { HealingQuota } from '@afw/shared';
import { MAX_HEALING_ATTEMPTS_PER_DAY } from '@afw/shared';

export class HealingQuotaTracker {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * Build a date-keyed storage key for a workbench-flow pair.
   * Daily reset happens naturally: new day = new key = fresh quota.
   */
  private getTodayKey(workbenchId: string, flowId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `healingQuota:${workbenchId}:${flowId}:${today}`;
  }

  /**
   * Get today's healing quota for a workbench-flow pair.
   * Returns a fresh quota (0 attempts) if none exists yet.
   */
  async getTodayQuota(workbenchId: string, flowId: string): Promise<HealingQuota> {
    const key = this.getTodayKey(workbenchId, flowId);
    const raw = this.storage.get ? await Promise.resolve(this.storage.get(key)) : null;

    if (raw) {
      try {
        return JSON.parse(raw) as HealingQuota;
      } catch {
        console.warn(`[HealingQuotaTracker] Failed to parse quota for key ${key}`);
      }
    }

    return {
      workbenchId,
      flowId,
      attemptsUsed: 0,
      maxAttempts: MAX_HEALING_ATTEMPTS_PER_DAY,
      date: new Date().toISOString().slice(0, 10),
    };
  }

  /**
   * Increment the attempt count for a workbench-flow pair.
   * Returns the updated quota.
   */
  async incrementAttempt(workbenchId: string, flowId: string): Promise<HealingQuota> {
    const quota = await this.getTodayQuota(workbenchId, flowId);
    quota.attemptsUsed += 1;

    const key = this.getTodayKey(workbenchId, flowId);
    if (this.storage.set) {
      // TTL of 86400 seconds (24 hours) for automatic cleanup
      await Promise.resolve(this.storage.set(key, JSON.stringify(quota), 86400));
    }

    console.log(`[HealingQuotaTracker] Incremented quota for ${workbenchId}:${flowId} to ${quota.attemptsUsed}/${quota.maxAttempts}`);
    return quota;
  }

  /**
   * Check if the daily quota is exhausted for a workbench-flow pair.
   */
  async isQuotaExhausted(workbenchId: string, flowId: string): Promise<boolean> {
    const quota = await this.getTodayQuota(workbenchId, flowId);
    return quota.attemptsUsed >= MAX_HEALING_ATTEMPTS_PER_DAY;
  }

  /**
   * Get all active circuit breakers for today.
   * Returns quotas where attemptsUsed >= maxAttempts.
   */
  async getActiveCircuitBreakers(): Promise<HealingQuota[]> {
    const today = new Date().toISOString().slice(0, 10);
    const pattern = `healingQuota:*:*:${today}`;
    const keys = this.storage.keys ? await Promise.resolve(this.storage.keys(pattern)) : [];

    const breakers: HealingQuota[] = [];
    for (const key of keys) {
      const raw = this.storage.get ? await Promise.resolve(this.storage.get(key)) : null;
      if (raw) {
        try {
          const quota = JSON.parse(raw) as HealingQuota;
          if (quota.attemptsUsed >= quota.maxAttempts) {
            breakers.push(quota);
          }
        } catch {
          // Skip malformed entries
        }
      }
    }

    return breakers;
  }
}
