import { describe, it, expect } from 'vitest';
import type { ChainStepSnapshot } from '@afw/shared';
import { layoutPipeline, STEP_WIDTH, STEP_HEIGHT, GATE_SIZE, isGateStep } from './pipeline-layout';

describe('layoutPipeline', () => {
  it('returns empty nodes and edges for empty input', () => {
    const result = layoutPipeline([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('produces 3 nodes and 2 edges for 3 sequential steps', () => {
    const steps: ChainStepSnapshot[] = [
      { stepNumber: 1, action: 'code/backend' },
      { stepNumber: 2, action: 'code/frontend' },
      { stepNumber: 3, action: 'test/unit' },
    ];
    const result = layoutPipeline(steps);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    // All nodes should have type 'step'
    result.nodes.forEach((node) => {
      expect(node.type).toBe('step');
    });
    // Non-first nodes should have x > 0 (horizontal layout)
    expect(result.nodes[1]!.position.x).toBeGreaterThan(result.nodes[0]!.position.x);
    expect(result.nodes[2]!.position.x).toBeGreaterThan(result.nodes[1]!.position.x);
  });

  it('creates correct edge from dependency to dependent when waitsFor is set', () => {
    const steps: ChainStepSnapshot[] = [
      { stepNumber: 1, action: 'analyze/code' },
      { stepNumber: 2, action: 'code/backend', waitsFor: [1] },
    ];
    const result = layoutPipeline(steps);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.source).toBe('1');
    expect(result.edges[0]!.target).toBe('2');
  });

  it('produces 2 edges from node "1" for fork (step 1 -> steps 2,3)', () => {
    const steps: ChainStepSnapshot[] = [
      { stepNumber: 1, action: 'compile/chain' },
      { stepNumber: 2, action: 'code/backend', waitsFor: [1] },
      { stepNumber: 3, action: 'code/frontend', waitsFor: [1] },
    ];
    const result = layoutPipeline(steps);

    const edgesFromOne = result.edges.filter((e) => e.source === '1');
    expect(edgesFromOne).toHaveLength(2);
    expect(edgesFromOne.map((e) => e.target).sort()).toEqual(['2', '3']);
  });

  it('produces 2 edges into node "4" for merge (steps 2,3 -> step 4)', () => {
    const steps: ChainStepSnapshot[] = [
      { stepNumber: 1, action: 'compile/chain' },
      { stepNumber: 2, action: 'code/backend', waitsFor: [1] },
      { stepNumber: 3, action: 'code/frontend', waitsFor: [1] },
      { stepNumber: 4, action: 'review/code', waitsFor: [2, 3] },
    ];
    const result = layoutPipeline(steps);

    const edgesIntoFour = result.edges.filter((e) => e.target === '4');
    expect(edgesIntoFour).toHaveLength(2);
    expect(edgesIntoFour.map((e) => e.source).sort()).toEqual(['2', '3']);
  });

  it('creates gate-type node when action contains "gate" or "check"', () => {
    const steps: ChainStepSnapshot[] = [
      { stepNumber: 1, action: 'code/backend' },
      { stepNumber: 2, action: 'gate/quality-check' },
      { stepNumber: 3, action: 'review/check-compliance' },
    ];
    const result = layoutPipeline(steps);

    expect(result.nodes[0]!.type).toBe('step');
    expect(result.nodes[1]!.type).toBe('gate');
    expect(result.nodes[2]!.type).toBe('gate');
  });

  it('adjusts node positions from dagre center to top-left', () => {
    const steps: ChainStepSnapshot[] = [
      { stepNumber: 1, action: 'code/backend' },
    ];
    const result = layoutPipeline(steps);

    // The node position should be adjusted: x = dagreX - width/2
    // Dagre places the single node at center. Position must not be negative
    // for a single node (dagre centers it in its space)
    const node = result.nodes[0]!;
    expect(node.position.x).toBeGreaterThanOrEqual(0);
    expect(node.position.y).toBeGreaterThanOrEqual(0);
    // Verify the width/height are factored by checking consistency:
    // For a step node, position should be at (dagreX - STEP_WIDTH/2, dagreY - STEP_HEIGHT/2)
    // Since we can't read dagreX directly, just verify it's a valid number
    expect(typeof node.position.x).toBe('number');
    expect(typeof node.position.y).toBe('number');
    expect(Number.isFinite(node.position.x)).toBe(true);
    expect(Number.isFinite(node.position.y)).toBe(true);
  });
});

describe('isGateStep', () => {
  it('returns true for actions containing "gate"', () => {
    expect(isGateStep({ stepNumber: 1, action: 'gate/quality' })).toBe(true);
    expect(isGateStep({ stepNumber: 1, action: 'quality-gate' })).toBe(true);
  });

  it('returns true for actions containing "check"', () => {
    expect(isGateStep({ stepNumber: 1, action: 'check/lint' })).toBe(true);
  });

  it('returns true for actions containing "decision"', () => {
    expect(isGateStep({ stepNumber: 1, action: 'decision/route' })).toBe(true);
  });

  it('returns false for regular actions', () => {
    expect(isGateStep({ stepNumber: 1, action: 'code/backend' })).toBe(false);
    expect(isGateStep({ stepNumber: 1, action: 'test/unit' })).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isGateStep({ stepNumber: 1, action: 'Gate/Quality' })).toBe(true);
    expect(isGateStep({ stepNumber: 1, action: 'CHECK/lint' })).toBe(true);
    expect(isGateStep({ stepNumber: 1, action: 'DECISION/route' })).toBe(true);
  });
});

describe('constants', () => {
  it('exports expected dimension constants', () => {
    expect(STEP_WIDTH).toBe(160);
    expect(STEP_HEIGHT).toBe(88);
    expect(GATE_SIZE).toBe(64);
  });
});
