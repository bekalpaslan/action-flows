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
          'flex flex-col h-full bg-surface-2',
          collapsed ? 'p-3' : 'p-4'
        )}
      >
        {!collapsed && (
          <h2 className="text-heading font-semibold text-text mb-6 text-lg">
            Workbenches
          </h2>
        )}
        <ul role="list" className="flex flex-col gap-1.5">
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
        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="self-center"
          >
            {collapsed ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </Button>
          <WebSocketStatus />
        </div>
      </nav>
    </TooltipProvider>
  );
}
