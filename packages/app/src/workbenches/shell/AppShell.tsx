import { useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { useUIStore } from '@/stores/uiStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Sidebar } from '../sidebar/Sidebar';
import { WorkspaceArea } from '../workspace/WorkspaceArea';
import { ChatPlaceholder } from '../chat/ChatPlaceholder';
import { cn } from '@/lib/utils';

export const panelHandles = {
  sidebar: null as ImperativePanelHandle | null,
  chat: null as ImperativePanelHandle | null,
};

export function AppShell() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const setChatCollapsed = useUIStore((s) => s.setChatCollapsed);
  useWebSocket();

  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const chatRef = useRef<ImperativePanelHandle>(null);

  // Sync refs to module-level handles for command palette access
  useEffect(() => {
    panelHandles.sidebar = sidebarRef.current;
    panelHandles.chat = chatRef.current;
  }, []);

  const handleSidebarExpand = () => {
    sidebarRef.current?.expand();
  };

  const dragHandleClasses = cn(
    'relative flex items-center justify-center w-[10px] cursor-col-resize',
    'before:absolute before:rounded-full before:bg-transparent',
    'before:h-8 before:w-1',
    'before:transition-[background-color] before:duration-fast before:ease-in-out',
    'hover:before:bg-border-strong/50',
    'active:before:bg-accent/30'
  );

  return (
    <PanelGroup direction="horizontal" autoSaveId="app-layout" className="h-screen">
      <Panel
        ref={sidebarRef}
        defaultSize={15}
        minSize={4}
        maxSize={25}
        collapsible
        collapsedSize={4}
        onCollapse={() => setSidebarCollapsed(true)}
        onExpand={() => setSidebarCollapsed(false)}
      >
        <Sidebar collapsed={sidebarCollapsed} onExpand={handleSidebarExpand} />
      </Panel>
      <PanelResizeHandle className={dragHandleClasses} />
      <Panel defaultSize={60} minSize={35}>
        <WorkspaceArea key={activeWorkbench} workbenchId={activeWorkbench} />
      </Panel>
      <PanelResizeHandle className={dragHandleClasses} />
      <Panel
        ref={chatRef}
        defaultSize={25}
        minSize={0}
        maxSize={40}
        collapsible
        collapsedSize={0}
        onCollapse={() => setChatCollapsed(true)}
        onExpand={() => setChatCollapsed(false)}
      >
        <ChatPlaceholder />
      </Panel>
    </PanelGroup>
  );
}
