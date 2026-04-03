import { create } from 'zustand';
import type { Edge } from '@xyflow/react';
import type { CheckpointData } from '@afw/shared';
import type { WorkbenchId } from '../lib/types';
import type { PipelineNode, PipelineState, StepNodeData, GateNodeData } from '../lib/pipeline-types';

interface PipelineStoreState {
  pipelines: Map<WorkbenchId, PipelineState>;
  initChain: (workbenchId: WorkbenchId, chainId: string, nodes: PipelineNode[], edges: Edge[]) => void;
  updateNodeStatus: (workbenchId: WorkbenchId, nodeId: string, data: Partial<StepNodeData> | Partial<GateNodeData>) => void;
  updateEdgeStatus: (workbenchId: WorkbenchId, edgeId: string, data: Partial<Edge>) => void;
  setCheckpoint: (workbenchId: WorkbenchId, nodeId: string, checkpoint: CheckpointData) => void;
  selectNode: (workbenchId: WorkbenchId, nodeId: string | null) => void;
  clearPipeline: (workbenchId: WorkbenchId) => void;
}

export const usePipelineStore = create<PipelineStoreState>((set) => ({
  pipelines: new Map(),

  initChain: (workbenchId, chainId, nodes: PipelineNode[], edges: Edge[]) =>
    set((state) => {
      const next = new Map(state.pipelines);
      next.set(workbenchId, {
        nodes,
        edges,
        chainId,
        selectedNodeId: null,
        drawerOpen: false,
      });
      return { pipelines: next };
    }),

  updateNodeStatus: (workbenchId, nodeId, data) =>
    set((state) => {
      const pipeline = state.pipelines.get(workbenchId);
      if (!pipeline) return state;

      const next = new Map(state.pipelines);
      next.set(workbenchId, {
        ...pipeline,
        nodes: (pipeline.nodes as PipelineNode[]).map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } } as PipelineNode
            : node
        ),
      });
      return { pipelines: next };
    }),

  updateEdgeStatus: (workbenchId, edgeId, data) =>
    set((state) => {
      const pipeline = state.pipelines.get(workbenchId);
      if (!pipeline) return state;

      const next = new Map(state.pipelines);
      next.set(workbenchId, {
        ...pipeline,
        edges: pipeline.edges.map((edge) =>
          edge.id === edgeId
            ? { ...edge, ...data }
            : edge
        ),
      });
      return { pipelines: next };
    }),

  setCheckpoint: (workbenchId, nodeId, checkpoint) =>
    set((state) => {
      const pipeline = state.pipelines.get(workbenchId);
      if (!pipeline) return state;

      const next = new Map(state.pipelines);
      next.set(workbenchId, {
        ...pipeline,
        nodes: (pipeline.nodes as PipelineNode[]).map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, checkpoint } } as PipelineNode
            : node
        ),
      });
      return { pipelines: next };
    }),

  selectNode: (workbenchId, nodeId) =>
    set((state) => {
      const pipeline = state.pipelines.get(workbenchId);
      if (!pipeline) return state;

      const next = new Map(state.pipelines);
      next.set(workbenchId, {
        ...pipeline,
        selectedNodeId: nodeId,
        drawerOpen: nodeId !== null,
      });
      return { pipelines: next };
    }),

  clearPipeline: (workbenchId) =>
    set((state) => {
      const next = new Map(state.pipelines);
      next.delete(workbenchId);
      return { pipelines: next };
    }),
}));
