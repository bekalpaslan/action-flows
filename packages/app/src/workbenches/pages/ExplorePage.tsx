import { useState } from 'react';
import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { FlowBrowser } from '../shared/FlowBrowser';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/stores/uiStore';

export function ExplorePage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      <div>
        <h2 className="text-heading font-semibold mb-4">Codebase Navigation</h2>
        <Input
          inputSize="md"
          placeholder="Search files and symbols..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-6 text-center">
          <p className="text-body text-text-dim">
            File tree will load when agent session is active.
          </p>
        </div>
      </div>

      <FlowBrowser context="explore" />
    </div>
  );
}
