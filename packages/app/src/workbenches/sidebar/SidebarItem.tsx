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
    'rounded-2xl cursor-pointer transition-colors',
    collapsed
      ? 'flex items-center justify-center p-3'
      : 'flex items-center gap-3 p-3',
    isActive
      ? 'bg-white/[0.08] text-text'
      : 'text-text-dim hover:bg-white/[0.04] hover:text-text'
  );

  const content = (
    <li
      role="listitem"
      aria-current={isActive ? 'page' : undefined}
      className={itemClasses}
      onClick={onSelect}
    >
      <Icon className="h-6 w-6 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
      {!collapsed && (
        <span className="text-sm leading-5 font-normal">{workbench.label}</span>
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
