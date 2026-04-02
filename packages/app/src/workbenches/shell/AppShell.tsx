import { useUIStore } from '@/stores/uiStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SidebarPlaceholder } from '../sidebar/SidebarPlaceholder';
import { WorkspaceArea } from '../workspace/WorkspaceArea';
import { ChatPlaceholder } from '../chat/ChatPlaceholder';
import './AppShell.css';

export function AppShell() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  useWebSocket();

  return (
    <div className="app-shell">
      <SidebarPlaceholder />
      <WorkspaceArea key={activeWorkbench} workbenchId={activeWorkbench} />
      <ChatPlaceholder />
    </div>
  );
}
