import { WorkbenchGreeting } from '../shared/WorkbenchGreeting';
import { ContentList, type ContentListItemData } from '../shared/ContentList';
import { StatCard } from '../shared/StatCard';
import { FlowBrowser } from '../shared/FlowBrowser';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';

export function WorkPage() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const getSession = useSessionStore((s) => s.getSession);
  const getRunningCount = useSessionStore((s) => s.getRunningCount);

  const session = getSession(activeWorkbench);

  const activeChains: ContentListItemData[] =
    session.status === 'running'
      ? [
          {
            id: '1',
            primary: 'Current session',
            secondary: session.sessionId ?? 'No session',
            status: 'running',
            timestamp: session.lastActivity ?? '',
          },
        ]
      : [];

  const recentChains: ContentListItemData[] = [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <WorkbenchGreeting workbenchId={activeWorkbench} />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Chains</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <ContentList
            items={activeChains}
            emptyHeading="No active chains"
            emptyBody="Start a chain by chatting with the Work agent or running a flow."
          />
        </TabsContent>
        <TabsContent value="recent">
          <ContentList
            items={recentChains}
            emptyHeading="No recent activity"
            emptyBody="Completed chains will appear here."
          />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Running" value={getRunningCount()} />
        <StatCard label="Completed today" value={0} />
        <StatCard label="Failed" value={0} />
      </div>

      <FlowBrowser context="work" />
    </div>
  );
}
