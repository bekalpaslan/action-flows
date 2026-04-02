import type { WorkbenchMeta } from '@/lib/types';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  workbench: WorkbenchMeta;
  isActive: boolean;
  collapsed: boolean;
  onSelect: () => void;
}

export function SidebarItem({ workbench, isActive, collapsed, onSelect }: SidebarItemProps) {
  const Icon = workbench.icon;

  const itemClasses = cn(
    'h-11 rounded-md cursor-pointer transition-colors border-l-[3px]',
    collapsed
      ? 'flex items-center justify-center px-3'
      : 'flex items-center gap-2 px-4 py-2',
    isActive
      ? 'bg-surface-3 text-text border-l-accent'
      : 'text-text-dim hover:bg-surface-3 hover:text-text border-l-transparent'
  );

  const content = (
    <li
      role="listitem"
      aria-current={isActive ? 'page' : undefined}
      className={itemClasses}
      onClick={onSelect}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <span className="text-caption font-semibold">{workbench.label}</span>
      )}
    </li>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{workbench.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
