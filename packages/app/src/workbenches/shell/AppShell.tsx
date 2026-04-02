import { useRef, useEffect } from 'react';
import { Group, Panel, Separator, useDefaultLayout, type PanelImperativeHandle, type PanelSize } from 'react-resizable-panels';
import { useUIStore } from '@/stores/uiStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sidebar } from '../sidebar/Sidebar';
import { WorkspaceArea } from '../workspace/WorkspaceArea';
import { ChatPlaceholder } from '../chat/ChatPlaceholder';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { cn } from '@/lib/utils';

export const panelHandles = {
  sidebar: null as PanelImperativeHandle | null,
  chat: null as PanelImperativeHandle | null,
};

export function AppShell() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const setChatCollapsed = useUIStore((s) => s.setChatCollapsed);
  useWebSocket();
  useKeyboardShortcuts();

  const sidebarRef = useRef<PanelImperativeHandle>(null);
  const chatRef = useRef<PanelImperativeHandle>(null);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'app-layout',
    storage: localStorage,
  });

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
    <>
      <Group orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="h-screen">
        <Panel
          panelRef={sidebarRef}
          id="sidebar"
          defaultSize={15}
          minSize={4}
          maxSize={25}
          collapsible
          collapsedSize={4}
          onResize={(panelSize: PanelSize) => {
            setSidebarCollapsed(panelSize.asPercentage <= 4);
          }}
        >
          <Sidebar collapsed={sidebarCollapsed} onExpand={handleSidebarExpand} />
        </Panel>
        <Separator className={dragHandleClasses} />
        <Panel id="workspace" defaultSize={60} minSize={35}>
          <WorkspaceArea key={activeWorkbench} workbenchId={activeWorkbench} />
        </Panel>
        <Separator className={dragHandleClasses} />
        <Panel
          panelRef={chatRef}
          id="chat"
          defaultSize={25}
          minSize={0}
          maxSize={40}
          collapsible
          collapsedSize={0}
          onResize={(panelSize: PanelSize) => {
            setChatCollapsed(panelSize.asPercentage === 0);
          }}
        >
          <ChatPlaceholder />
        </Panel>
      </Group>
      <CommandPalette />
    </>
  );
}
