import { GitBranch } from 'lucide-react';

/**
 * Empty state for the pipeline visualizer when no active chain exists.
 * Shown in place of the ReactFlow canvas per D-04.
 */
export function PipelineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <GitBranch size={32} className="text-text-muted" />
      <h3 className="text-body font-semibold text-text">No active chain</h3>
      <p className="text-caption text-text-dim">
        Start a chain from the chat panel to see it execute here.
      </p>
    </div>
  );
}
