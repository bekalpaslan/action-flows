import { WORKBENCHES } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui';
import { TooltipProvider } from '@/components/ui';
import { WebSocketStatus } from '@/status/WebSocketStatus';
import { SidebarItem } from './SidebarItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onExpand?: () => void;
}

export function Sidebar({ collapsed, onExpand }: SidebarProps) {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const setActiveWorkbench = useUIStore((s) => s.setActiveWorkbench);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <TooltipProvider>
      <nav
        aria-label="Workbench navigation"
        className={cn(
          'flex flex-col justify-between h-full bg-surface-2 border-r border-border/50',
          collapsed ? 'px-3 py-7' : 'px-4 py-7'
        )}
      >
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <div className="px-3 pb-4">
              <h2 className="text-lg font-semibold text-text tracking-tight">
                ActionFlows
              </h2>
            </div>
          )}
          <ul role="list" className="flex flex-col gap-1">
            {WORKBENCHES.map((wb) => (
              <SidebarItem
                key={wb.id}
                workbench={wb}
                isActive={wb.id === activeWorkbench}
                collapsed={collapsed}
                onSelect={() => {
                  setActiveWorkbench(wb.id);
                  if (collapsed && onExpand) onExpand();
                }}
              />
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="self-center"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
          <WebSocketStatus />
        </div>
      </nav>
    </TooltipProvider>
  );
}
