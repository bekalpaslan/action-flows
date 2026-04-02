import { Group, Panel, Separator, type PanelSize } from 'react-resizable-panels';
import type { WorkbenchId } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { PipelineView } from './PipelineView';
import { WorkPage } from '../pages/WorkPage';
import { ExplorePage } from '../pages/ExplorePage';
import { ReviewPage } from '../pages/ReviewPage';
import { PMPage } from '../pages/PMPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ArchivePage } from '../pages/ArchivePage';
import { StudioPage } from '../pages/StudioPage';

const PAGE_MAP: Record<WorkbenchId, React.FC> = {
  work: WorkPage,
  explore: ExplorePage,
  review: ReviewPage,
  pm: PMPage,
  settings: SettingsPage,
  archive: ArchivePage,
  studio: StudioPage,
};

interface WorkspaceAreaProps {
  workbenchId: WorkbenchId;
}

export function WorkspaceArea({ workbenchId }: WorkspaceAreaProps) {
  const setPipelineCollapsed = useUIStore((s) => s.setPipelineCollapsed);
  const Page = PAGE_MAP[workbenchId];

  return (
    <Group orientation="vertical">

      <Panel
        id="pipeline"
        defaultSize="30%"
        minSize="15%"
        maxSize="50%"
        collapsible
        collapsedSize="0%"
        onResize={(size: PanelSize) => {
          setPipelineCollapsed(size.asPercentage === 0);
        }}
      >
        <PipelineView workbenchId={workbenchId} />
      </Panel>
      <Separator
        className={cn(
          'relative flex items-center justify-center h-[10px] cursor-row-resize',
          'before:absolute before:rounded-full before:bg-transparent',
          'before:h-1 before:w-8',
          'before:transition-[background-color] before:duration-fast before:ease-in-out',
          'hover:before:bg-border-strong/50',
          'active:before:bg-accent/30'
        )}
      />
      <Panel id="content" defaultSize="70%" minSize="40%">
        <main className="overflow-y-auto h-full p-6 bg-surface" role="main">
          <Page />
        </main>
      </Panel>
    </Group>
  );
}
