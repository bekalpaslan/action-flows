import { useState } from 'react';
import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { ContentList, type ContentListItemData } from '../shared/ContentList';
import { FlowBrowser } from '../shared/FlowBrowser';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useUIStore } from '@/stores/uiStore';
import { WORKBENCHES } from '@/lib/types';

export function ArchivePage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const [searchValue, setSearchValue] = useState('');
  const [workbenchFilter, setWorkbenchFilter] = useState('all');

  // v1: empty array -- real data comes from backend session persistence
  const archivedSessions: ContentListItemData[] = [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      <div>
        <h2 className="text-heading font-semibold mb-4">Session Search</h2>
        <div className="flex items-center gap-2">
          <Input
            inputSize="md"
            placeholder="Search archived sessions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Search archived sessions"
          />
          <Select value={workbenchFilter} onValueChange={setWorkbenchFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by workbench">
              <SelectValue placeholder="All workbenches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workbenches</SelectItem>
              {WORKBENCHES.map((wb) => (
                <SelectItem key={wb.id} value={wb.id}>
                  {wb.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ContentList
        items={archivedSessions}
        emptyHeading="No archived sessions"
        emptyBody="Completed sessions will appear here for reference and search."
      />

      <FlowBrowser context="archive" />
    </div>
  );
}
