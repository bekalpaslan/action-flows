import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { ContentList, type ContentListItemData } from '../shared/ContentList';
import { FlowBrowser } from '../shared/FlowBrowser';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUIStore } from '@/stores/uiStore';

const gateChecks: ContentListItemData[] = [
  {
    id: 'gate-1',
    primary: 'Design System Compliance',
    secondary: 'PreToolUse hook validation',
    status: 'complete',
    timestamp: 'Phase 8',
  },
  {
    id: 'gate-2',
    primary: 'TypeScript Strict Mode',
    secondary: 'Zero compiler errors across packages',
    status: 'complete',
    timestamp: 'Phase 1',
  },
  {
    id: 'gate-3',
    primary: 'Component Library Coverage',
    secondary: 'All UI uses design system components',
    status: 'complete',
    timestamp: 'Phase 3',
  },
];

const auditResults: ContentListItemData[] = [];

export function ReviewPage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      <Tabs defaultValue="gates">
        <TabsList>
          <TabsTrigger value="gates">Quality Gates</TabsTrigger>
          <TabsTrigger value="audits">Audit Results</TabsTrigger>
        </TabsList>
        <TabsContent value="gates">
          <ContentList
            items={gateChecks}
            emptyHeading="No quality gates"
            emptyBody="Quality gate results will appear after running audit flows."
          />
        </TabsContent>
        <TabsContent value="audits">
          <ContentList
            items={auditResults}
            emptyHeading="No reviews pending"
            emptyBody="Trigger a review by running an audit flow or asking the Review agent."
          />
        </TabsContent>
      </Tabs>

      <FlowBrowser context="review" />
    </div>
  );
}
