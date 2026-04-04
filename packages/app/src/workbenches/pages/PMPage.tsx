import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { ContentList, type ContentListItemData } from '../shared/ContentList';
import { FlowBrowser } from '../shared/FlowBrowser';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUIStore } from '@/stores/uiStore';

const roadmapPhases: ContentListItemData[] = [
  {
    id: 'p1',
    primary: 'Phase 1: TypeScript Foundation',
    secondary: '3/3 plans complete',
    status: 'complete',
  },
  {
    id: 'p2',
    primary: 'Phase 2: Frontend Scaffold & WebSocket',
    secondary: '3/3 plans complete',
    status: 'complete',
  },
  {
    id: 'p3',
    primary: 'Phase 3: Design System',
    secondary: '4/4 plans complete',
    status: 'complete',
  },
  {
    id: 'p4',
    primary: 'Phase 4: Layout & Navigation',
    secondary: '5/5 plans complete',
    status: 'complete',
  },
  {
    id: 'p5',
    primary: 'Phase 5: Pipeline Visualization',
    secondary: '2/3 plans complete',
    status: 'running',
  },
  {
    id: 'p9',
    primary: 'Phase 9: Workbenches & Flow Management',
    secondary: 'In progress',
    status: 'running',
  },
  {
    id: 'p10',
    primary: 'Phase 10: Customization & Automation',
    secondary: 'Not started',
    status: 'pending',
  },
];

const tasks: ContentListItemData[] = [];

export function PMPage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      <Tabs defaultValue="roadmap">
        <TabsList>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="roadmap">
          <ContentList
            items={roadmapPhases}
            emptyHeading="No plans tracked"
            emptyBody="Create a roadmap or planning session through the PM agent."
          />
        </TabsContent>
        <TabsContent value="tasks">
          <ContentList
            items={tasks}
            emptyHeading="No tasks tracked"
            emptyBody="Task tracking will be available when the PM agent is active."
          />
        </TabsContent>
      </Tabs>

      <FlowBrowser context="pm" />
    </div>
  );
}
