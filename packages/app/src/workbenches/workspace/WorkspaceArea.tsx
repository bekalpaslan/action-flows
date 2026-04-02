import type { WorkbenchId } from '@/lib/types';
import { WorkPage } from '../pages/WorkPage';
import { ExplorePage } from '../pages/ExplorePage';
import { ReviewPage } from '../pages/ReviewPage';
import { PMPage } from '../pages/PMPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ArchivePage } from '../pages/ArchivePage';
import { StudioPage } from '../pages/StudioPage';
import './WorkspaceArea.css';

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
  const Page = PAGE_MAP[workbenchId];

  return (
    <main className="workspace">
      <Page />
    </main>
  );
}
