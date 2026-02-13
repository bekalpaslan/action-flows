/**
 * Dependency Resolver Service
 * Converts a chain with dependencies into ordered execution batches using topological sort.
 * Implements Kahn's algorithm for cycle detection and batch computation.
 */

import type { Chain, ChainStep, StepNumber } from '@afw/shared';

/**
 * Represents a batch of steps that can be executed concurrently
 */
export interface ExecutionBatch {
  /** Sequential batch number (1-indexed) */
  batchNumber: number;

  /** Step numbers that can run concurrently in this batch */
  stepNumbers: StepNumber[];

  /** Step numbers that must complete before this batch can start */
  dependsOn: StepNumber[];
}

/**
 * Dependency Resolver Service
 * Handles graph analysis of chain dependencies and batch computation
 */
export class DependencyResolverService {
  /**
   * Resolve chain dependencies into ordered execution batches
   *
   * @param chain - Chain with steps containing waitsFor dependencies
   * @returns Array of ExecutionBatch objects in execution order
   * @throws Error if circular dependency detected or invalid step references found
   */
  resolveDependencies(chain: Chain): ExecutionBatch[] {
    // Validate input
    if (!chain || !chain.steps || chain.steps.length === 0) {
      return [];
    }

    // Validate all step references exist (Fix: invalid step reference validation)
    this.validateStepReferences(chain);

    // Detect cycles before computing batches
    if (this.detectCycles(chain)) {
      throw new Error(
        `Circular dependency detected in chain ${chain.id}. Check step waitsFor arrays.`
      );
    }

    // Compute execution batches
    return this.computeBatches(chain);
  }

  /**
   * Validate that all step references in waitsFor arrays exist in the chain
   *
   * @param chain - Chain to validate
   * @throws Error if non-existent step is referenced
   */
  validateStepReferences(chain: Chain): void {
    if (!chain || !chain.steps) {
      return;
    }

    // Build set of valid step numbers
    const validStepNumbers = new Set<number>();
    for (const step of chain.steps) {
      validStepNumbers.add(step.stepNumber as number);
    }

    // Check all dependencies
    for (const step of chain.steps) {
      if (step.waitsFor && step.waitsFor.length > 0) {
        for (const dep of step.waitsFor) {
          const depNum = dep as number;
          if (!validStepNumbers.has(depNum)) {
            throw new Error(
              `Step ${step.stepNumber} depends on non-existent step ${depNum}. ` +
              `Valid steps in chain: ${Array.from(validStepNumbers).sort((a, b) => a - b).join(', ')}`
            );
          }
        }
      }
    }
  }

  /**
   * Detect if chain contains circular dependencies
   *
   * @param chain - Chain to analyze
   * @returns true if circular dependency found, false otherwise
   */
  detectCycles(chain: Chain): boolean {
    if (!chain || !chain.steps || chain.steps.length === 0) {
      return false;
    }

    const visited = new Set<number>();
    const recursionStack = new Set<number>();

    // DFS-based cycle detection
    const hasCycle = (stepNum: number): boolean => {
      visited.add(stepNum);
      recursionStack.add(stepNum);

      // Find step by number
      const step = chain.steps.find((s) => s.stepNumber === (stepNum as StepNumber));
      if (!step || !step.waitsFor) {
        recursionStack.delete(stepNum);
        return false;
      }

      // Check all dependencies
      for (const dep of step.waitsFor) {
        const depNum = dep as number;
        if (!visited.has(depNum)) {
          if (hasCycle(depNum)) {
            return true;
          }
        } else if (recursionStack.has(depNum)) {
          // Back edge found = cycle
          return true;
        }
      }

      recursionStack.delete(stepNum);
      return false;
    };

    // Check all steps
    for (const step of chain.steps) {
      if (!visited.has(step.stepNumber as number)) {
        if (hasCycle(step.stepNumber as number)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Compute execution batches from chain steps
   * Uses Kahn's algorithm for topological sort
   *
   * @param chain - Chain to analyze
   * @returns Array of ExecutionBatch in execution order
   */
  computeBatches(chain: Chain): ExecutionBatch[] {
    if (!chain || !chain.steps || chain.steps.length === 0) {
      return [];
    }

    // Build adjacency map and in-degree count
    // adjList maps from dependency → dependents
    // If step 2 waitsFor [1], then adjList[1] contains 2 (1 must complete before 2 starts)
    const stepMap = new Map<number, ChainStep>();
    const inDegree = new Map<number, number>();
    const adjList = new Map<number, Set<number>>();

    // Initialize maps
    for (const step of chain.steps) {
      const stepNum = step.stepNumber as number;
      stepMap.set(stepNum, step);
      inDegree.set(stepNum, 0);
      adjList.set(stepNum, new Set());
    }

    // Build graph edges
    // For each dependency: if step A waitsFor step B, add edge B → A
    // This means: "A must wait for B, so B→A shows B must come before A"
    for (const step of chain.steps) {
      const stepNum = step.stepNumber as number;
      if (step.waitsFor && step.waitsFor.length > 0) {
        for (const dep of step.waitsFor) {
          const depNum = dep as number;
          if (stepMap.has(depNum)) {
            // Add edge: dependency → dependent
            // depNum is the step we're waiting for, stepNum is waiting for it
            adjList.get(depNum)!.add(stepNum);
          }
        }
      }
    }

    // Calculate in-degrees
    for (const step of chain.steps) {
      const stepNum = step.stepNumber as number;
      const deps = step.waitsFor || [];
      inDegree.set(stepNum, deps.length);
    }

    // Kahn's algorithm
    const queue: number[] = [];
    const batches: ExecutionBatch[] = [];
    let batchNumber = 0;

    // Find all steps with no dependencies
    const inDegreeEntries = Array.from(inDegree.entries());
    for (const [stepNum, degree] of inDegreeEntries) {
      if (degree === 0) {
        queue.push(stepNum);
      }
    }

    while (queue.length > 0) {
      batchNumber++;
      const batchStepNumbers = queue.splice(0, queue.length);
      const sortedBatchSteps = batchStepNumbers.sort((a, b) => a - b);

      // Compute dependencies for this batch
      const batchDeps: number[] = [];
      const depsSet = new Set<number>();
      for (const stepNum of sortedBatchSteps) {
        const step = stepMap.get(stepNum);
        if (step && step.waitsFor) {
          for (const dep of step.waitsFor) {
            const depNum = dep as number;
            if (!depsSet.has(depNum)) {
              depsSet.add(depNum);
              batchDeps.push(depNum);
            }
          }
        }
      }

      batches.push({
        batchNumber,
        stepNumbers: sortedBatchSteps.map((num) => num as StepNumber),
        dependsOn: batchDeps.sort((a, b) => a - b) as StepNumber[],
      });

      // Process adjacencies
      const nextQueue: number[] = [];
      for (const stepNum of sortedBatchSteps) {
        const neighbors = adjList.get(stepNum);
        if (neighbors) {
          const neighborArray = Array.from(neighbors);
          for (const neighbor of neighborArray) {
            const currentDegree = inDegree.get(neighbor) || 0;
            inDegree.set(neighbor, currentDegree - 1);
            if (inDegree.get(neighbor) === 0) {
              nextQueue.push(neighbor);
            }
          }
        }
      }

      // Add newly-available steps to queue for next batch
      for (const stepNum of nextQueue) {
        queue.push(stepNum);
      }
    }

    return batches;
  }

  /**
   * Determine the execution mode of a chain based on its dependency structure
   *
   * @param chain - Chain to analyze
   * @returns 'sequential' | 'parallel' | 'mixed'
   */
  getExecutionMode(
    chain: Chain
  ): 'sequential' | 'parallel' | 'mixed' {
    if (!chain || !chain.steps || chain.steps.length <= 1) {
      return 'sequential';
    }

    const batches = this.computeBatches(chain);

    // All steps in one batch = fully parallel
    if (batches.length === 1 && batches[0].stepNumbers.length === chain.steps.length) {
      return 'parallel';
    }

    // Each batch has exactly 1 step = fully sequential
    if (batches.every((b) => b.stepNumbers.length === 1)) {
      return 'sequential';
    }

    // Otherwise mixed
    return 'mixed';
  }

  /**
   * Estimate execution duration based on batches and step durations
   *
   * @param chain - Chain with steps
   * @param batches - Execution batches
   * @param defaultStepDurationMs - Default duration per step if not known
   * @returns Estimated total duration in milliseconds
   */
  estimateDuration(
    chain: Chain,
    batches: ExecutionBatch[],
    defaultStepDurationMs = 60000
  ): number {
    if (batches.length === 0) {
      return 0;
    }

    let totalMs = 0;

    for (const batch of batches) {
      // Batch duration = max step duration in batch (parallel execution)
      let batchMaxMs = 0;
      for (const stepNum of batch.stepNumbers) {
        const step = chain.steps.find((s) => s.stepNumber === stepNum);
        const stepDurationMs = step?.duration ?? defaultStepDurationMs;
        batchMaxMs = Math.max(batchMaxMs, stepDurationMs);
      }
      totalMs += batchMaxMs;
    }

    return totalMs;
  }
}

// Export singleton instance
export const dependencyResolver = new DependencyResolverService();
