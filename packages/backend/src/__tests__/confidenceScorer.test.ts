import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateConfidence,
  meetsProposalThreshold,
  meetsAutoApplyThreshold,
  calculateConsistency,
  DEFAULT_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  RECENCY_CONFIG,
} from '../services/confidenceScorer.js';
import type { ConfidenceScore, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

describe('ConfidenceScorer', () => {
  let now: Date;

  beforeEach(() => {
    now = new Date('2026-02-08T20:16:44Z');
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence with all recent, high-frequency patterns', () => {
      // Recently seen (1 day ago), high frequency (20), high consistency (0.9)
      const recentTimestamp = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(20, recentTimestamp, 0.9, { now });

      // Expected: freq=min(20/10,1)=1.0, recency=1.0, consistency=0.9
      // Result: 0.4*1.0 + 0.3*1.0 + 0.3*0.9 = 0.4 + 0.3 + 0.27 = 0.97
      expect(score).toBeGreaterThan(0.95);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should decay recency for older patterns', () => {
      // Seen 30 days ago (in decay window), frequency 10, consistency 0.5
      const oldTimestamp = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(10, oldTimestamp, 0.5, { now });

      // Recency should be between 0 and 1
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
      // Should be lower than a recent pattern with same frequency/consistency
      const recentScore = calculateConfidence(10, new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() as Timestamp, 0.5, { now });
      expect(score).toBeLessThan(recentScore);
    });

    it('should reach zero confidence for very old patterns', () => {
      // Seen 100+ days ago (beyond decay end)
      const veryOldTimestamp = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(100, veryOldTimestamp, 1.0, { now });

      // Should be low since recency is 0. With freq=1.0, consistency=1.0, recency=0:
      // 0.4*1.0 + 0.3*0 + 0.3*1.0 = 0.7
      expect(score).toBeLessThanOrEqual(0.7);
      expect(score).toBeGreaterThan(0.65);
    });

    it('should handle low frequency patterns', () => {
      const recentTimestamp = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(2, recentTimestamp, 0.7, { now });

      // freq = 2/10 = 0.2, recency = 1.0, consistency = 0.7
      // Result: 0.4*0.2 + 0.3*1.0 + 0.3*0.7 = 0.08 + 0.3 + 0.21 = 0.59
      expect(score).toBeGreaterThan(0.55);
      expect(score).toBeLessThan(0.65);
    });

    it('should handle custom weights', () => {
      const recentTimestamp = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(10, recentTimestamp, 0.9, {
        weights: { frequency: 0.7, recency: 0.2, consistency: 0.1 },
        now,
      });

      // With different weights, score should still be valid
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should clamp scores to [0, 1]', () => {
      // Test negative consistency
      const recentTimestamp = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(0, recentTimestamp, -0.5, { now });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);

      // Test very high values
      const highScore = calculateConfidence(1000, recentTimestamp, 2.0, { now });
      expect(highScore).toBeGreaterThanOrEqual(0);
      expect(highScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('meetsProposalThreshold', () => {
    it('should return true for scores >= 0.7', () => {
      expect(meetsProposalThreshold(0.7 as ConfidenceScore)).toBe(true);
      expect(meetsProposalThreshold(0.95 as ConfidenceScore)).toBe(true);
      expect(meetsProposalThreshold(1.0 as ConfidenceScore)).toBe(true);
    });

    it('should return false for scores < 0.7', () => {
      expect(meetsProposalThreshold(0.69 as ConfidenceScore)).toBe(false);
      expect(meetsProposalThreshold(0.5 as ConfidenceScore)).toBe(false);
      expect(meetsProposalThreshold(0 as ConfidenceScore)).toBe(false);
    });
  });

  describe('meetsAutoApplyThreshold', () => {
    it('should return true for scores >= 0.9', () => {
      expect(meetsAutoApplyThreshold(0.9 as ConfidenceScore)).toBe(true);
      expect(meetsAutoApplyThreshold(0.95 as ConfidenceScore)).toBe(true);
      expect(meetsAutoApplyThreshold(1.0 as ConfidenceScore)).toBe(true);
    });

    it('should return false for scores < 0.9', () => {
      expect(meetsAutoApplyThreshold(0.89 as ConfidenceScore)).toBe(false);
      expect(meetsAutoApplyThreshold(0.7 as ConfidenceScore)).toBe(false);
      expect(meetsAutoApplyThreshold(0 as ConfidenceScore)).toBe(false);
    });
  });

  describe('calculateConsistency', () => {
    it('should calculate consistency ratio', () => {
      // 8 occurrences in 10 opportunities = 0.8
      const consistency = calculateConsistency(8, 10);
      expect(consistency).toBe(0.8);

      // 5 occurrences in 5 opportunities = 1.0
      const fullConsistency = calculateConsistency(5, 5);
      expect(fullConsistency).toBe(1.0);

      // 0 occurrences = 0.0
      const noConsistency = calculateConsistency(0, 10);
      expect(noConsistency).toBe(0);
    });

    it('should cap consistency at 1.0', () => {
      // More occurrences than opportunities = capped at 1.0
      const consistency = calculateConsistency(15, 10);
      expect(consistency).toBe(1.0);
    });

    it('should return 0 for invalid window size', () => {
      const consistency = calculateConsistency(5, 0);
      expect(consistency).toBe(0);

      const consistency2 = calculateConsistency(5, -10);
      expect(consistency2).toBe(0);
    });
  });

  describe('Constants', () => {
    it('should have valid default weights', () => {
      const sum = DEFAULT_WEIGHTS.frequency + DEFAULT_WEIGHTS.recency + DEFAULT_WEIGHTS.consistency;
      expect(sum).toBe(1.0);
      expect(DEFAULT_WEIGHTS.frequency).toBe(0.4);
      expect(DEFAULT_WEIGHTS.recency).toBe(0.3);
      expect(DEFAULT_WEIGHTS.consistency).toBe(0.3);
    });

    it('should have valid thresholds', () => {
      expect(CONFIDENCE_THRESHOLDS.proposal).toBe(0.7);
      expect(CONFIDENCE_THRESHOLDS.autoApply).toBe(0.9);
      expect(CONFIDENCE_THRESHOLDS.autoApply).toBeGreaterThan(CONFIDENCE_THRESHOLDS.proposal);
    });

    it('should have valid recency config', () => {
      expect(RECENCY_CONFIG.decayStartDays).toBe(7);
      expect(RECENCY_CONFIG.decayEndDays).toBe(90);
      expect(RECENCY_CONFIG.decayEndDays).toBeGreaterThan(RECENCY_CONFIG.decayStartDays);
    });
  });

  describe('Edge Cases', () => {
    it('should handle pattern seen exactly at decay start', () => {
      const decayStartTimestamp = new Date(now.getTime() - RECENCY_CONFIG.decayStartDays * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(10, decayStartTimestamp, 0.5, { now });
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should handle pattern seen exactly at decay end', () => {
      const decayEndTimestamp = new Date(now.getTime() - RECENCY_CONFIG.decayEndDays * 24 * 60 * 60 * 1000).toISOString() as Timestamp;
      const score = calculateConfidence(10, decayEndTimestamp, 0.5, { now });
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should use current time when now is not provided', () => {
      const recentTimestamp = new Date().toISOString() as Timestamp;
      const score = calculateConfidence(20, recentTimestamp, 0.9);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });
});
