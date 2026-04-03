import dagre from 'dagre';
import type { Edge } from '@xyflow/react';
import type { ChainStepSnapshot } from '@afw/shared';
import type { PipelineNode, StepNodeData, GateNodeData } from './pipeline-types';

/** Step node dimensions */
export const STEP_WIDTH = 160;
export const STEP_HEIGHT = 88;

/** Gate (diamond) node size -- width and height are equal */
export const GATE_SIZE = 64;

/**
 * Determines whether a chain step should render as a gate node.
 * Gate detection is based on the action name containing "gate", "check", or "decision" (case-insensitive).
 * This is the Phase 5 naming convention per RESEARCH.md Open Question 1.
 */
export function isGateStep(step: ChainStepSnapshot): boolean {
  const lower = step.action.toLowerCase();
  return lower.includes('gate') || lower.includes('check') || lower.includes('decision');
}

/**
 * Converts an array of ChainStepSnapshot into positioned nodes and edges
 * using dagre for automatic graph layout. Supports sequential, fork, and merge topologies.
 *
 * @param steps - Array of chain step snapshots from the shared events package.
 * @returns Object with nodes (positioned for @xyflow/react) and edges (smoothstep type).
 */
export function layoutPipeline(steps: ChainStepSnapshot[]): { nodes: PipelineNode[]; edges: Edge[] } {
  if (steps.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 48 });

  // Build a lookup from stepNumber to index for sequential edge fallback
  const stepMap = new Map<number, ChainStepSnapshot>();
  for (const step of steps) {
    stepMap.set(step.stepNumber, step);
  }

  // Add nodes to dagre
  for (const step of steps) {
    const gate = isGateStep(step);
    const w = gate ? GATE_SIZE : STEP_WIDTH;
    const h = gate ? GATE_SIZE : STEP_HEIGHT;
    g.setNode(String(step.stepNumber), { width: w, height: h });
  }

  // Add edges to dagre
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (step.waitsFor && step.waitsFor.length > 0) {
      // Explicit dependencies
      for (const dep of step.waitsFor) {
        g.setEdge(String(dep), String(step.stepNumber));
      }
    } else if (i > 0) {
      // Sequential edge from previous step
      g.setEdge(String(steps[i - 1]!.stepNumber), String(step.stepNumber));
    }
  }

  // Run dagre layout
  dagre.layout(g);

  // Build nodes with adjusted positions (dagre returns center, xyflow expects top-left)
  const nodes: PipelineNode[] = steps.map((step) => {
    const gate = isGateStep(step);
    const w = gate ? GATE_SIZE : STEP_WIDTH;
    const h = gate ? GATE_SIZE : STEP_HEIGHT;
    const pos = g.node(String(step.stepNumber));

    const position = {
      x: pos.x - w / 2,
      y: pos.y - h / 2,
    };

    if (gate) {
      const data: GateNodeData = {
        type: 'gate',
        label: step.action,
        status: 'pending',
        passCount: 0,
        failCount: 0,
        outcome: null,
      };
      return {
        id: String(step.stepNumber),
        type: 'gate' as const,
        position,
        data,
      };
    }

    const data: StepNodeData = {
      type: 'step',
      stepNumber: step.stepNumber,
      name: step.action,
      status: 'pending',
      elapsedMs: null,
      agentModel: step.model ?? null,
      description: step.description ?? null,
      inputs: step.inputs ?? null,
      result: null,
      error: null,
      suggestion: null,
      fileChanges: null,
      startedAt: null,
      checkpoint: null,
    };

    return {
      id: String(step.stepNumber),
      type: 'step' as const,
      position,
      data,
    };
  });

  // Build edges
  const edges: Edge[] = g.edges().map((e) => ({
    id: `e-${e.v}-${e.w}`,
    source: e.v,
    target: e.w,
    type: 'smoothstep',
  }));

  return { nodes, edges };
}
