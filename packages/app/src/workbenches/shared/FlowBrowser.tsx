import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/stores/flowStore';
import { FlowCard } from './FlowCard';
import { FlowComposer } from './FlowComposer';
import type { WorkbenchId } from '@/lib/types';

export interface FlowBrowserProps {
  context: WorkbenchId;
}

/**
 * Flow card grid with search, filter, and "New Flow" button.
 * Fetches and displays flows for a specific workbench context.
 * Includes FlowComposer dialog for creating new flows.
 */
export function FlowBrowser({ context }: FlowBrowserProps) {
  const flows = useFlowStore((s) => s.getFlowsByContext(context));
  const loading = useFlowStore((s) => s.loading);
  const error = useFlowStore((s) => s.error);
  const searchQuery = useFlowStore((s) => s.searchQuery);
  const setSearchQuery = useFlowStore((s) => s.setSearchQuery);
  const loadFlows = useFlowStore((s) => s.loadFlows);

  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    const allFlows = useFlowStore.getState().flows;
    if (allFlows.length === 0) {
      loadFlows();
    }
  }, [loadFlows]);

  const filteredFlows = searchQuery
    ? flows.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flows;

  return (
    <section>
      <h2 className="text-heading font-semibold mb-6">Flows</h2>

      <div className="flex items-center gap-2 mb-4">
        <Input
          inputSize="sm"
          placeholder="Search flows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search flows"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => setComposerOpen(true)}
        >
          New Flow
        </Button>
      </div>

      {loading && (
        <p className="text-body text-text-dim py-4">Loading flows...</p>
      )}

      {error && (
        <p className="text-body text-destructive">{error}</p>
      )}

      {!loading && !error && filteredFlows.length > 0 && (
        <div role="list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFlows.map((flow) => (
            <FlowCard key={flow.id} flow={flow} workbenchId={context} />
          ))}
        </div>
      )}

      {!loading && !error && filteredFlows.length === 0 && searchQuery && (
        <p className="text-body text-text-dim py-4">No flows match your search.</p>
      )}

      {!loading && !error && flows.length === 0 && !searchQuery && (
        <div className="py-12 text-center" role="status">
          <h3 className="text-heading font-semibold">No flows registered</h3>
          <p className="text-body text-text-dim mt-2">
            This workbench has no flows yet. Create one with the New Flow button.
          </p>
        </div>
      )}

      <FlowComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        context={context}
      />
    </section>
  );
}
