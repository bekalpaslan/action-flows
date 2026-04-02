export { StepNode, formatElapsed } from './StepNode';
export { GateNode } from './GateNode';
export { PipelineEdge } from './PipelineEdge';

import { StepNode } from './StepNode';
import { GateNode } from './GateNode';
import { PipelineEdge } from './PipelineEdge';

/**
 * Module-level nodeTypes and edgeTypes for @xyflow/react.
 * MUST be defined outside React components to prevent unmount/remount on re-render.
 * Per RESEARCH.md Pitfall 1 and Performance Contract.
 */
export const nodeTypes = { step: StepNode, gate: GateNode } as const;
export const edgeTypes = { pipeline: PipelineEdge } as const;
