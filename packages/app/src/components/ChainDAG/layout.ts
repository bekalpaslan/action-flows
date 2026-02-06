/**
 * DAG Layout Engine
 * Computes positions for chain steps with support for parallel execution
 */

import type { ChainStep, StepNumber } from '@afw/shared';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  row: number;
  column: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
}

const VERTICAL_SPACING = 150;
const HORIZONTAL_SPACING = 200;
const PARALLEL_GROUP_WIDTH = 250;

/**
 * Group parallel steps (steps with the same dependencies)
 */
function groupParallelSteps(steps: ChainStep[]): Map<string, ChainStep[]> {
  const groups = new Map<string, ChainStep[]>();

  for (const step of steps) {
    const key = step.waitsFor.length === 0 ? 'START' : step.waitsFor.sort().join(',');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(step);
  }

  return groups;
}

/**
 * Compute topological levels (layers) for steps
 */
function computeLevels(steps: ChainStep[]): Map<number, ChainStep[]> {
  const stepMap = new Map<number, ChainStep>();
  steps.forEach(step => stepMap.set(Number(step.stepNumber), step));

  const levels = new Map<number, ChainStep[]>();
  const visited = new Set<number>();

  const levelCache = new Map<number, number>();

  function getLevel(stepNum: number): number {
    // Return cached value if already computed
    if (levelCache.has(stepNum)) {
      return levelCache.get(stepNum)!;
    }

    // Detect cycles
    if (visited.has(stepNum)) {
      console.warn(`Cycle detected at step ${stepNum}`);
      return 0;
    }

    visited.add(stepNum);
    const step = stepMap.get(stepNum);
    if (!step) {
      levelCache.set(stepNum, 0);
      return 0;
    }

    const level = step.waitsFor.length === 0
      ? 0
      : 1 + Math.max(...step.waitsFor.map(dep => getLevel(Number(dep))));

    levelCache.set(stepNum, level);
    return level;
  }

  for (const [stepNum, step] of stepMap) {
    const level = getLevel(stepNum);
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(step);
  }

  return levels;
}

/**
 * Generate node positions for DAG layout
 */
export function layoutNodes(steps: ChainStep[]): NodePosition[] {
  if (steps.length === 0) return [];

  const levels = computeLevels(steps);
  const positions: NodePosition[] = [];

  // Sort levels by level number
  const sortedLevels = Array.from(levels.entries()).sort((a, b) => a[0] - b[0]);

  for (const [levelIdx, levelSteps] of sortedLevels) {
    const y = levelIdx * VERTICAL_SPACING;
    const stepsInLevel = levelSteps.length;

    // Center steps horizontally based on count
    const totalWidth = (stepsInLevel - 1) * PARALLEL_GROUP_WIDTH;
    const startX = -totalWidth / 2;

    for (let i = 0; i < stepsInLevel; i++) {
      const step = levelSteps[i];
      const x = startX + i * PARALLEL_GROUP_WIDTH;

      positions.push({
        id: `step-${step.stepNumber}`,
        x,
        y,
        row: levelIdx,
        column: i,
      });
    }
  }

  return positions;
}

/**
 * Generate edges based on dependencies
 */
export function layoutEdges(steps: ChainStep[]): Edge[] {
  const edges: Edge[] = [];
  const stepMap = new Map<number, ChainStep>();
  steps.forEach(step => stepMap.set(Number(step.stepNumber), step));

  for (const step of steps) {
    for (const dependency of step.waitsFor) {
      const dependencyNum = Number(dependency);
      const depStep = stepMap.get(dependencyNum);

      if (depStep) {
        edges.push({
          id: `edge-${dependencyNum}-${step.stepNumber}`,
          source: `step-${dependencyNum}`,
          target: `step-${step.stepNumber}`,
          animated: step.status === 'in_progress',
        });
      }
    }
  }

  return edges;
}

/**
 * Detect parallel execution groups
 */
export function detectParallelGroups(steps: ChainStep[]): Array<StepNumber[]> {
  const groups: Array<StepNumber[]> = [];
  const grouped = new Set<number>();

  for (const step of steps) {
    if (grouped.has(Number(step.stepNumber))) continue;

    const group: StepNumber[] = [step.stepNumber];
    grouped.add(Number(step.stepNumber));

    // Find other steps with same dependencies
    for (const other of steps) {
      if (grouped.has(Number(other.stepNumber))) continue;

      // Same waitsFor array = parallel steps
      const sameWaitsFor =
        step.waitsFor.length === other.waitsFor.length &&
        step.waitsFor.every(dep =>
          other.waitsFor.includes(dep)
        );

      if (sameWaitsFor) {
        group.push(other.stepNumber);
        grouped.add(Number(other.stepNumber));
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}
