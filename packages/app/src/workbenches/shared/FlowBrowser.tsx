import type { WorkbenchId } from '@/lib/types';

interface FlowBrowserProps {
  context: WorkbenchId | string;
}

export function FlowBrowser({ context: _context }: FlowBrowserProps) {
  // Minimal implementation: shows empty state for flows.
  // Full implementation comes from Plan 09-03 (FlowBrowser with card grid, search, filter, New Flow).
  return (
    <div>
      <h2 className="text-heading font-semibold mb-4">Flows</h2>
      <div className="py-12 text-center rounded-lg border border-border bg-surface-2" role="status">
        <h3 className="text-heading font-semibold">No flows registered</h3>
        <p className="text-body text-text-dim mt-2">
          This workbench has no flows yet. Create one with the New Flow button.
        </p>
      </div>
    </div>
  );
}
