import type { Node, Edge } from '@xyflow/react';
import type { WorkbenchId } from './types';

export type NodeStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

export type StepNodeData = {
  type: 'step';
  stepNumber: number;
  name: string;
  status: NodeStatus;
  elapsedMs: number | null;
  agentModel: string | null;
  description: string | null;
  inputs: Record<string, unknown> | null;
  result: unknown | null;
  error: string | null;
  suggestion: string | null;
  fileChanges: Array<{ path: string; type: 'created' | 'modified' | 'deleted' }> | null;
  startedAt: string | null;
};

export type GateNodeData = {
  type: 'gate';
  label: string;
  status: NodeStatus;
  passCount: number;
  failCount: number;
  outcome: string | null;
};

export type PipelineNodeData = StepNodeData | GateNodeData;

export type StepNodeType = Node<StepNodeData, 'step'>;
export type GateNodeType = Node<GateNodeData, 'gate'>;
export type PipelineNode = Node<PipelineNodeData>;

export interface PipelineState {
  nodes: PipelineNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  drawerOpen: boolean;
  chainId: string | null;
}

export function createEmptyPipelineState(): PipelineState {
  return { nodes: [], edges: [], selectedNodeId: null, drawerOpen: false, chainId: null };
}
