import { create } from 'zustand';
import type { Edge } from '@xyflow/react';
import type { WorkbenchId } from '../lib/types';
import type { PipelineNode, PipelineState, StepNodeData, GateNodeData } from '../lib/pipeline-types';

interface PipelineStoreState {
  pipelines: Map<WorkbenchId, PipelineState>;
  initChain: (workbenchId: WorkbenchId, chainId: string, nodes: PipelineNode[], edges: Edge[]) => void;
  updateNodeStatus: (workbenchId: WorkbenchId, nodeId: string, data: Partial<StepNodeData> | Partial<GateNodeData>) => void;
  updateEdgeStatus: (workbenchId: WorkbenchId, edgeId: string, data: Partial<Edge>) => void;
  selectNode: (workbenchId: WorkbenchId, nodeId: string | null) => void;
  clearPipeline: (workbenchId: WorkbenchId) => void;
}

export const usePipelineStore = create<PipelineStoreState>((set) => ({
  pipelines: new Map(),

  initChain: (workbenchId, chainId, nodes, edges) =>
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
        nodes: pipeline.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
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
