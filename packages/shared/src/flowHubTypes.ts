// FlowHub types for Phase 0 — Public Flow Registry (Thread 3)

/** Identifies a flow from FlowHub */
export type FlowHubFlowId = string & { readonly __brand: 'FlowHubFlowId' };

/** Convert string to FlowHubFlowId */
export function toFlowHubFlowId(value: string): FlowHubFlowId {
  return value as FlowHubFlowId;
}

/** A flow entry in the FlowHub registry */
export interface FlowHubEntry {
  flowId: FlowHubFlowId;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  source: 'local' | 'flow-hub';
}

/** Source of a flow in the local registry */
export type FlowSource = 'local' | 'flow-hub';
