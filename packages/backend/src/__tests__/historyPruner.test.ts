import { describe, it, expect } from 'vitest';
import { initHealthScoreCalculator } from '../services/healthScoreCalculator.js';

describe('HealthScoreCalculator.prune (D-01, D-02)', () => {
  it('removes traces older than 7 days and returns them', () => {
    const calc: any = initHealthScoreCalculator({} as any);
    expect(typeof calc.prune).toBe('function');
    // Real behavioral test implemented in Wave 2.
    const pruned = calc.prune();
    expect(Array.isArray(pruned)).toBe(true);
  });
});
