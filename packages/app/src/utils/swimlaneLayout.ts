/**
 * Swimlane Layout Algorithm
 * Organizes chain steps into action-type-based swimlanes with left-to-right flow
 */

import type { Chain, ChainStep, StepNumber } from '@afw/shared';

export interface SwimlaneAssignment {
  stepNumber: StepNumber;
  swimlane: string;
  swimlaneIndex: number;
  column: number;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  swimlane: string;
  column: number;
}

export interface EdgeDefinition {
  id: string;
  source: string;
  target: string;
  dataLabel?: string;
  animated: boolean;
}

// Layout constants
const SWIMLANE_HEIGHT = 180;
const SWIMLANE_PADDING = 20;
const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING_WITHIN_LANE = 140;

/**
 * Extract action type from action string (e.g., "code/frontend" -> "code")
 */
function extractActionType(action: string): string {
  const parts = action.split('/');
  return parts[0] || 'other';
}

/**
 * Assign each step to a swimlane based on action type
 * Returns map of stepNumber -> swimlane assignment
 */
export function assignSwimlanes(chain: Chain): Map<StepNumber, SwimlaneAssignment> {
  const assignments = new Map<StepNumber, SwimlaneAssignment>();
  const swimlaneMap = new Map<string, number>(); // swimlane name -> index
  let swimlaneCounter = 0;

  // First pass: identify all unique swimlanes
  for (const step of chain.steps) {
    const actionType = extractActionType(step.action);
    if (!swimlaneMap.has(actionType)) {
      swimlaneMap.set(actionType, swimlaneCounter++);
    }
  }

  // Second pass: assign each step to its swimlane and calculate column
  const stepMap = new Map<number, ChainStep>();
  chain.steps.forEach(step => stepMap.set(Number(step.stepNumber), step));

  const swimlaneColumns = new Map<string, number>(); // Track current column per swimlane

  // Initialize column counters
  for (const [swimlaneName] of swimlaneMap) {
    swimlaneColumns.set(swimlaneName, 0);
  }

  // Compute topological levels to determine column placement
  const levels = computeLevels(chain.steps);
  const sortedLevels = Array.from(levels.entries()).sort((a, b) => a[0] - b[0]);

  for (const [levelIdx, levelSteps] of sortedLevels) {
    for (const step of levelSteps) {
      const actionType = extractActionType(step.action);
      const swimlaneIndex = swimlaneMap.get(actionType)!;
      const column = levelIdx; // Use topological level as column

      assignments.set(step.stepNumber, {
        stepNumber: step.stepNumber,
        swimlane: actionType,
        swimlaneIndex,
        column,
      });
    }
  }

  return assignments;
}

/**
 * Compute topological levels (layers) for steps
 */
function computeLevels(steps: ChainStep[]): Map<number, ChainStep[]> {
  const stepMap = new Map<number, ChainStep>();
  steps.forEach(step => stepMap.set(Number(step.stepNumber), step));

  const levels = new Map<number, ChainStep[]>();
  const levelCache = new Map<number, number>();
  const visited = new Set<number>();

  function getLevel(stepNum: number): number {
    if (levelCache.has(stepNum)) {
      return levelCache.get(stepNum)!;
    }

    if (visited.has(stepNum)) {
      console.warn(`[swimlaneLayout] Cycle detected at step ${stepNum}, placing at current level`);
      // Place cyclic node at same level as its position in the chain
      // to avoid layout breakage — the node will appear in sequence
      const fallbackLevel = stepMap.has(stepNum) ? Math.max(0, stepNum - 1) : 0;
      levelCache.set(stepNum, fallbackLevel);
      return fallbackLevel;
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
 * Group steps by chain/swimlane for visualization
 */
export function groupStepsByChain(chain: Chain): Map<string, ChainStep[]> {
  const groups = new Map<string, ChainStep[]>();

  for (const step of chain.steps) {
    const actionType = extractActionType(step.action);
    if (!groups.has(actionType)) {
      groups.set(actionType, []);
    }
    groups.get(actionType)!.push(step);
  }

  return groups;
}

/**
 * Calculate node positions based on swimlane assignments
 */
export function calculateNodePositions(
  steps: ChainStep[],
  swimlanes: Map<StepNumber, SwimlaneAssignment>
): NodePosition[] {
  const positions: NodePosition[] = [];

  // Group steps by column to handle parallel steps within same swimlane
  const columnGroups = new Map<number, Map<string, ChainStep[]>>();

  for (const step of steps) {
    const assignment = swimlanes.get(step.stepNumber);
    if (!assignment) continue;

    if (!columnGroups.has(assignment.column)) {
      columnGroups.set(assignment.column, new Map());
    }
    const columnMap = columnGroups.get(assignment.column)!;

    if (!columnMap.has(assignment.swimlane)) {
      columnMap.set(assignment.swimlane, []);
    }
    columnMap.get(assignment.swimlane)!.push(step);
  }

  // Calculate positions
  for (const step of steps) {
    const assignment = swimlanes.get(step.stepNumber);
    if (!assignment) continue;

    const x = assignment.column * HORIZONTAL_SPACING;

    // Base Y position for swimlane
    const baseY = assignment.swimlaneIndex * SWIMLANE_HEIGHT + SWIMLANE_PADDING;

    // If multiple steps in same column+swimlane, stack them vertically
    const columnMap = columnGroups.get(assignment.column)!;
    const stepsInCell = columnMap.get(assignment.swimlane)!;
    const indexInCell = stepsInCell.findIndex(s => Number(s.stepNumber) === Number(step.stepNumber));

    const y = baseY + (indexInCell * VERTICAL_SPACING_WITHIN_LANE);

    positions.push({
      id: `step-${step.stepNumber}`,
      x,
      y,
      swimlane: assignment.swimlane,
      column: assignment.column,
    });
  }

  return positions;
}

/**
 * Calculate swimlane edges with data flow labels
 */
export function calculateSwimlaneEdges(steps: ChainStep[]): EdgeDefinition[] {
  const edges: EdgeDefinition[] = [];
  const stepMap = new Map<number, ChainStep>();
  steps.forEach(step => stepMap.set(Number(step.stepNumber), step));

  for (const step of steps) {
    for (const dependency of step.waitsFor) {
      const dependencyNum = Number(dependency);
      const depStep = stepMap.get(dependencyNum);

      if (depStep) {
        // Generate data label based on action types
        const dataLabel = generateDataLabel(depStep.action, step.action);

        edges.push({
          id: `edge-${dependencyNum}-${step.stepNumber}`,
          source: `step-${dependencyNum}`,
          target: `step-${step.stepNumber}`,
          dataLabel,
          animated: step.status === 'in_progress',
        });
      }
    }
  }

  return edges;
}

/**
 * Generate a data flow label for an edge based on source/target actions
 */
function generateDataLabel(sourceAction: string, targetAction: string): string {
  const sourceType = extractActionType(sourceAction);
  const targetType = extractActionType(targetAction);

  // Common data flow patterns
  if (sourceType === 'plan' && targetType === 'code') {
    return 'plan.md';
  }
  if (sourceType === 'code' && targetType === 'review') {
    return 'code changes';
  }
  if (sourceType === 'review' && targetType === 'code') {
    return 'review feedback';
  }
  if (sourceType === 'code' && targetType === 'test') {
    return 'implementation';
  }
  if (sourceType === 'test' && targetType === 'code') {
    return 'test results';
  }
  if (sourceType === 'audit' && targetType === 'code') {
    return 'audit findings';
  }

  // Default generic label
  return 'output';
}

/**
 * Get unique swimlane names from chain
 */
export function getSwimlaneNames(chain: Chain): string[] {
  const names = new Set<string>();
  for (const step of chain.steps) {
    names.add(extractActionType(step.action));
  }
  return Array.from(names).sort();
}
