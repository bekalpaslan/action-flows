import { describe, it, expect, beforeEach } from 'vitest';
import { usePipelineStore } from './pipelineStore';
import type { PipelineNode } from '../lib/pipeline-types';
import type { Edge } from '@xyflow/react';

function makeNodes(count: number): PipelineNode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    type: 'step' as const,
    position: { x: i * 200, y: 0 },
    data: {
      type: 'step' as const,
      stepNumber: i + 1,
      name: `step-${i + 1}`,
      status: 'pending' as const,
      elapsedMs: null,
      agentModel: null,
      description: null,
      inputs: null,
      result: null,
      error: null,
      suggestion: null,
      fileChanges: null,
      startedAt: null,
      checkpoint: null,
    },
  }));
}

function makeEdges(count: number): Edge[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `e-${i + 1}-${i + 2}`,
    source: String(i + 1),
    target: String(i + 2),
    type: 'smoothstep',
  }));
}

describe('pipelineStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    const state = usePipelineStore.getState();
    state.pipelines.clear();
  });

  it('initChain sets nodes, edges, chainId for a workbench with selectedNodeId null and drawerOpen false', () => {
    const nodes = makeNodes(3);
    const edges = makeEdges(2);

    usePipelineStore.getState().initChain('work', 'chain-1', nodes, edges);

    const pipeline = usePipelineStore.getState().pipelines.get('work');
    expect(pipeline).toBeDefined();
    expect(pipeline!.nodes).toHaveLength(3);
    expect(pipeline!.edges).toHaveLength(2);
    expect(pipeline!.chainId).toBe('chain-1');
    expect(pipeline!.selectedNodeId).toBeNull();
    expect(pipeline!.drawerOpen).toBe(false);
  });

  it('updateNodeStatus updates specific node data for correct workbench', () => {
    const nodes = makeNodes(2);
    const edges = makeEdges(1);

    usePipelineStore.getState().initChain('work', 'chain-1', nodes, edges);
    usePipelineStore.getState().updateNodeStatus('work', '1', { status: 'running' });

    const pipeline = usePipelineStore.getState().pipelines.get('work');
    expect(pipeline!.nodes[0]!.data.status).toBe('running');
    expect(pipeline!.nodes[1]!.data.status).toBe('pending');
  });

  it('selectNode sets selectedNodeId and drawerOpen=true, null clears both', () => {
    const nodes = makeNodes(1);
    const edges: Edge[] = [];

    usePipelineStore.getState().initChain('work', 'chain-1', nodes, edges);

    usePipelineStore.getState().selectNode('work', '1');
    let pipeline = usePipelineStore.getState().pipelines.get('work');
    expect(pipeline!.selectedNodeId).toBe('1');
    expect(pipeline!.drawerOpen).toBe(true);

    usePipelineStore.getState().selectNode('work', null);
    pipeline = usePipelineStore.getState().pipelines.get('work');
    expect(pipeline!.selectedNodeId).toBeNull();
    expect(pipeline!.drawerOpen).toBe(false);
  });

  it('clearPipeline removes pipeline for workbench', () => {
    const nodes = makeNodes(1);
    const edges: Edge[] = [];

    usePipelineStore.getState().initChain('work', 'chain-1', nodes, edges);
    expect(usePipelineStore.getState().pipelines.has('work')).toBe(true);

    usePipelineStore.getState().clearPipeline('work');
    expect(usePipelineStore.getState().pipelines.has('work')).toBe(false);
  });

  it('different workbenches have independent pipeline state (per PIPE-07)', () => {
    const workNodes = makeNodes(2);
    const workEdges = makeEdges(1);
    const exploreNodes = makeNodes(3);
    const exploreEdges = makeEdges(2);

    usePipelineStore.getState().initChain('work', 'chain-work', workNodes, workEdges);
    usePipelineStore.getState().initChain('explore', 'chain-explore', exploreNodes, exploreEdges);

    const workPipeline = usePipelineStore.getState().pipelines.get('work');
    const explorePipeline = usePipelineStore.getState().pipelines.get('explore');

    expect(workPipeline!.nodes).toHaveLength(2);
    expect(workPipeline!.chainId).toBe('chain-work');
    expect(explorePipeline!.nodes).toHaveLength(3);
    expect(explorePipeline!.chainId).toBe('chain-explore');

    // Updating one workbench doesn't affect the other
    usePipelineStore.getState().updateNodeStatus('work', '1', { status: 'complete' });
    expect(usePipelineStore.getState().pipelines.get('work')!.nodes[0]!.data.status).toBe('complete');
    expect(usePipelineStore.getState().pipelines.get('explore')!.nodes[0]!.data.status).toBe('pending');
  });

  it('updateEdgeStatus updates specific edge data', () => {
    const nodes = makeNodes(2);
    const edges = makeEdges(1);

    usePipelineStore.getState().initChain('work', 'chain-1', nodes, edges);
    usePipelineStore.getState().updateEdgeStatus('work', 'e-1-2', { animated: true });

    const pipeline = usePipelineStore.getState().pipelines.get('work');
    expect(pipeline!.edges[0]!.animated).toBe(true);
  });
});
