/**
 * DependencyResolver Service Unit Tests
 * Tests topological sort, cycle detection, and batch computation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Chain, ChainStep, StepNumber } from '@afw/shared';
import { DependencyResolverService, type ExecutionBatch } from '../../services/dependencyResolver.js';

describe('DependencyResolverService', () => {
  let resolver: DependencyResolverService;

  beforeEach(() => {
    resolver = new DependencyResolverService();
  });

  /**
   * Helper to create a chain with specified steps and dependencies
   */
  function createChain(steps: Array<{ num: number; deps?: number[] }>): Chain {
    const chainSteps: ChainStep[] = steps.map((s) => ({
      stepNumber: s.num as StepNumber,
      action: `action-${s.num}`,
      model: 'haiku' as any,
      inputs: {},
      waitsFor: (s.deps || []) as StepNumber[],
      status: 'pending' as any,
    }));

    return {
      id: 'chain-1' as any,
      sessionId: 'session-1' as any,
      title: 'Test Chain',
      steps: chainSteps,
      source: 'composed' as any,
      status: 'pending' as any,
      compiledAt: new Date().toISOString() as any,
    };
  }

  describe('Single step chain', () => {
    it('should handle a single step with no dependencies', () => {
      const chain = createChain([{ num: 1 }]);
      const batches = resolver.resolveDependencies(chain);

      expect(batches).toHaveLength(1);
      expect(batches[0].batchNumber).toBe(1);
      expect(batches[0].stepNumbers).toEqual([1]);
      expect(batches[0].dependsOn).toEqual([]);
    });
  });

  describe('Linear chain (sequential)', () => {
    it('should resolve 1->2->3->4 as 4 sequential batches', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [2] },
        { num: 4, deps: [3] },
      ]);

      const batches = resolver.resolveDependencies(chain);

      expect(batches).toHaveLength(4);
      batches.forEach((batch, idx) => {
        expect(batch.stepNumbers).toEqual([idx + 1]);
        expect(batch.batchNumber).toBe(idx + 1);
      });

      // Check dependencies
      expect(batches[0].dependsOn).toEqual([]);
      expect(batches[1].dependsOn).toEqual([1]);
      expect(batches[2].dependsOn).toEqual([2]);
      expect(batches[3].dependsOn).toEqual([3]);
    });
  });

  describe('Parallel branches', () => {
    it('should resolve 1->(2,3)->4 as 3 batches', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [1] },
        { num: 4, deps: [2, 3] },
      ]);

      const batches = resolver.resolveDependencies(chain);

      expect(batches).toHaveLength(3);
      expect(batches[0].stepNumbers).toEqual([1]);
      expect(batches[1].stepNumbers.sort()).toEqual([2, 3]);
      expect(batches[2].stepNumbers).toEqual([4]);
    });
  });

  describe('Diamond pattern', () => {
    it('should resolve 1->(2,3)->(4,5)->6 correctly', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [1] },
        { num: 4, deps: [2] },
        { num: 5, deps: [3] },
        { num: 6, deps: [4, 5] },
      ]);

      const batches = resolver.resolveDependencies(chain);

      expect(batches).toHaveLength(4);
      expect(batches[0].stepNumbers).toEqual([1]);
      expect(batches[1].stepNumbers.sort()).toEqual([2, 3]);
      expect(batches[2].stepNumbers.sort()).toEqual([4, 5]);
      expect(batches[3].stepNumbers).toEqual([6]);
    });
  });

  describe('Complex 20+ step chain', () => {
    it('should handle chain with multiple levels of parallelism', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [1] },
        { num: 4, deps: [1] },
        { num: 5, deps: [2, 3] },
        { num: 6, deps: [3, 4] },
        { num: 7, deps: [5, 6] },
        { num: 8, deps: [7] },
        { num: 9, deps: [8] },
        { num: 10, deps: [8] },
      ]);

      const batches = resolver.resolveDependencies(chain);

      expect(batches.length).toBeGreaterThan(0);
      expect(batches.length).toBeLessThanOrEqual(chain.steps.length);

      // All steps should appear in exactly one batch
      const allStepNums = new Set<number>();
      for (const batch of batches) {
        for (const stepNum of batch.stepNumbers) {
          allStepNums.add(stepNum as number);
        }
      }
      expect(allStepNums.size).toBe(chain.steps.length);
    });
  });

  describe('Cycle detection', () => {
    it('should detect direct cycle (1->2->1)', () => {
      const chain = createChain([
        { num: 1, deps: [2] },
        { num: 2, deps: [1] },
      ]);

      const hasCycle = resolver.detectCycles(chain);
      expect(hasCycle).toBe(true);

      expect(() => {
        resolver.resolveDependencies(chain);
      }).toThrow(/Circular dependency/);
    });

    it('should detect indirect cycle (1->2->3->1)', () => {
      const chain = createChain([
        { num: 1, deps: [3] },
        { num: 2, deps: [1] },
        { num: 3, deps: [2] },
      ]);

      const hasCycle = resolver.detectCycles(chain);
      expect(hasCycle).toBe(true);

      expect(() => {
        resolver.resolveDependencies(chain);
      }).toThrow(/Circular dependency/);
    });

    it('should detect cycle with multiple branches', () => {
      const chain = createChain([
        { num: 1, deps: [2, 3] },
        { num: 2, deps: [3] },
        { num: 3, deps: [1] },
      ]);

      const hasCycle = resolver.detectCycles(chain);
      expect(hasCycle).toBe(true);
    });

    it('should not detect false positives in diamond pattern', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [1] },
        { num: 4, deps: [2, 3] },
      ]);

      const hasCycle = resolver.detectCycles(chain);
      expect(hasCycle).toBe(false);
    });
  });

  describe('Execution mode determination', () => {
    it('should identify fully sequential chain', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [2] },
      ]);

      const mode = resolver.getExecutionMode(chain);
      expect(mode).toBe('sequential');
    });

    it('should identify fully parallel chain', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2 },
        { num: 3 },
      ]);

      const mode = resolver.getExecutionMode(chain);
      expect(mode).toBe('parallel');
    });

    it('should identify mixed mode chain', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [1] },
        { num: 4, deps: [2, 3] },
      ]);

      const mode = resolver.getExecutionMode(chain);
      expect(mode).toBe('mixed');
    });
  });

  describe('Duration estimation', () => {
    it('should estimate sequential chain duration', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [2] },
      ]);
      chain.steps.forEach((s) => {
        s.duration = 1000; // 1 second each
      });

      const batches = resolver.computeBatches(chain);
      const duration = resolver.estimateDuration(chain, batches, 1000);

      // Sequential: 1000 + 1000 + 1000 = 3000ms
      expect(duration).toBe(3000);
    });

    it('should estimate parallel batch duration correctly', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2 },
        { num: 3 },
      ]);
      chain.steps.forEach((s) => {
        s.duration = 2000; // All 2 seconds
      });

      const batches = resolver.computeBatches(chain);
      const duration = resolver.estimateDuration(chain, batches, 2000);

      // All parallel: max(2000) = 2000ms (not 6000)
      expect(duration).toBe(2000);
    });

    it('should estimate mixed mode duration correctly', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [1] },
        { num: 4, deps: [2, 3] },
      ]);
      chain.steps[0].duration = 1000; // Step 1: 1s
      chain.steps[1].duration = 2000; // Step 2: 2s
      chain.steps[2].duration = 3000; // Step 3: 3s
      chain.steps[3].duration = 1000; // Step 4: 1s

      const batches = resolver.computeBatches(chain);
      const duration = resolver.estimateDuration(chain, batches, 0);

      // Batch 1: 1000ms
      // Batch 2: max(2000, 3000) = 3000ms
      // Batch 3: 1000ms
      // Total: 5000ms
      expect(duration).toBe(5000);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty chain', () => {
      const chain: Chain = {
        id: 'chain-1' as any,
        sessionId: 'session-1' as any,
        title: 'Empty Chain',
        steps: [],
        source: 'composed' as any,
        status: 'pending' as any,
        compiledAt: new Date().toISOString() as any,
      };

      const batches = resolver.resolveDependencies(chain);
      expect(batches).toEqual([]);
    });

    it('should handle null/undefined chain', () => {
      expect(resolver.resolveDependencies(null as any)).toEqual([]);
      expect(resolver.detectCycles(null as any)).toBe(false);
    });

    it('should throw error on invalid step references (Fix #5)', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [99] }, // Reference to non-existent step
      ]);

      // Should throw descriptive error
      expect(() => {
        resolver.resolveDependencies(chain);
      }).toThrow(/depends on non-existent step/);
    });

    it('should handle duplicate dependencies', () => {
      const chain: Chain = {
        id: 'chain-1' as any,
        sessionId: 'session-1' as any,
        title: 'Test Chain',
        steps: [
          {
            stepNumber: 1 as StepNumber,
            action: 'action-1',
            model: 'haiku' as any,
            inputs: {},
            waitsFor: [],
            status: 'pending' as any,
          },
          {
            stepNumber: 2 as StepNumber,
            action: 'action-2',
            model: 'haiku' as any,
            inputs: {},
            waitsFor: [1, 1] as StepNumber[], // Duplicate dependency
            status: 'pending' as any,
          },
        ],
        source: 'composed' as any,
        status: 'pending' as any,
        compiledAt: new Date().toISOString() as any,
      };

      const batches = resolver.resolveDependencies(chain);
      expect(batches).toHaveLength(2);
    });
  });

  describe('Batch ordering', () => {
    it('should always return batches in execution order', () => {
      const chain = createChain([
        { num: 1 },
        { num: 2, deps: [1] },
        { num: 3, deps: [2] },
        { num: 4, deps: [3] },
      ]);

      const batches = resolver.resolveDependencies(chain);

      // Verify batchNumber increases
      for (let i = 1; i < batches.length; i++) {
        expect(batches[i].batchNumber).toBeGreaterThan(batches[i - 1].batchNumber);
      }

      // Verify dependencies only reference earlier batches
      for (const batch of batches) {
        for (const dep of batch.dependsOn) {
          // Dep should appear in an earlier batch
          let foundInEarlier = false;
          for (const earlierBatch of batches) {
            if (earlierBatch.batchNumber >= batch.batchNumber) break;
            if (earlierBatch.stepNumbers.includes(dep)) {
              foundInEarlier = true;
              break;
            }
          }
          expect(foundInEarlier).toBe(true);
        }
      }
    });
  });
});
