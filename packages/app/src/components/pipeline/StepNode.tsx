import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cva } from 'class-variance-authority';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  SkipForward,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepNodeData, NodeStatus } from '@/lib/pipeline-types';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import './pipeline.css';

type StepNodeType = Node<StepNodeData, 'step'>;

const statusBorder = cva('border-l-[3px]', {
  variants: {
    status: {
      pending: 'border-l-border',
      running: 'border-l-accent',
      complete: 'border-l-success',
      failed: 'border-l-destructive',
      skipped: 'border-l-border',
    },
  },
});

const STATUS_ICONS = {
  pending: Circle,
  running: Loader2,
  complete: CheckCircle2,
  failed: XCircle,
  skipped: SkipForward,
} as const;

const STATUS_ICON_CLASSES: Record<NodeStatus, string> = {
  pending: 'text-text-muted',
  running: 'animate-spin text-accent',
  complete: 'text-success',
  failed: 'text-destructive',
  skipped: 'text-text-muted',
};

/**
 * Format elapsed milliseconds to a human-readable string.
 * - Under 60s: "12s"
 * - 60s+: "1m 23s"
 */
export function formatElapsed(ms: number): string {
  if (ms < 60000) {
    return `${Math.round(ms / 1000)}s`;
  }
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Custom @xyflow/react node for chain steps.
 * Renders as a rounded rectangle with status icon, name, elapsed time, and agent model.
 * Defined at module level per RESEARCH.md Pitfall 1.
 */
export function StepNode({ data, selected }: NodeProps<StepNodeType>) {
  const Icon = STATUS_ICONS[data.status];
  const liveElapsed = useElapsedTime(data.startedAt, data.status === 'running');
  const displayElapsed = liveElapsed ?? data.elapsedMs;

  return (
    <div
      className={cn(
        'min-w-[160px] rounded-md bg-surface-2 border border-border p-3 shadow-sm',
        'hover:shadow-md hover:border-border-strong transition-shadow cursor-pointer',
        statusBorder({ status: data.status }),
        data.status === 'running' && 'animate-pipeline-pulse',
        selected && 'ring-2 ring-accent shadow-glow-focus'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border-strong !w-2 !h-2"
      />

      {/* Row 1: Status icon + step name */}
      <div className="flex items-center gap-2">
        <Icon size={16} className={STATUS_ICON_CLASSES[data.status]} />
        <span className="text-caption font-semibold truncate max-w-[120px] text-text">
          {data.name}
        </span>
      </div>

      {/* Row 2: Elapsed time */}
      <div className="text-caption text-text-dim mt-1">
        {displayElapsed != null ? formatElapsed(displayElapsed) : '--'}
      </div>

      {/* Row 3: Agent model (if present) */}
      {data.agentModel && (
        <div className="text-caption text-text-muted truncate">
          {data.agentModel}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border-strong !w-2 !h-2"
      />
    </div>
  );
}
