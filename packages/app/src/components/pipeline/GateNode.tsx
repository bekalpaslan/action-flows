import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GateNodeData } from '@/lib/pipeline-types';
import './pipeline.css';

type GateNodeType = Node<GateNodeData, 'gate'>;

/**
 * Custom @xyflow/react node for decision gates.
 * Renders as a 64x64 diamond (CSS rotate-45) with a GitBranch icon and label below.
 * Defined at module level per RESEARCH.md Pitfall 1.
 */
export function GateNode({ data, selected }: NodeProps<GateNodeType>) {
  const borderColor =
    data.status === 'running'
      ? 'border-accent'
      : data.status === 'complete'
        ? 'border-success'
        : data.status === 'failed'
          ? 'border-destructive'
          : 'border-border';

  return (
    <div className="relative flex flex-col items-center">
      {/* Diamond shape */}
      <div
        className={cn(
          'w-16 h-16 rotate-45 bg-surface-2 border-2 shadow-sm cursor-pointer rounded-xs',
          borderColor,
          data.status === 'running' && 'animate-pipeline-pulse',
          selected && 'ring-2 ring-accent shadow-glow-focus'
        )}
      >
        {/* Inner content (counter-rotate to keep upright) */}
        <div className="w-full h-full -rotate-45 flex items-center justify-center">
          <GitBranch size={20} className="text-text-dim" />
        </div>
      </div>

      {/* Handle: target (left center of diamond) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border-strong !w-2 !h-2"
        style={{ top: '32px', left: '-4px' }}
      />

      {/* Handle: source (right center of diamond) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border-strong !w-2 !h-2"
        style={{ top: '32px', right: '-4px' }}
      />

      {/* Label below diamond */}
      <span className="mt-2 text-caption text-text-dim truncate max-w-[80px] text-center">
        {data.label}
      </span>
    </div>
  );
}
