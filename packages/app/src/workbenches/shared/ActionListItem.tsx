import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ActionItemData {
  name: string;
  description: string;
  category: string;
}

export interface ActionListItemProps {
  action: ActionItemData;
  selected: boolean;
  onToggle: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Selectable and optionally draggable action item for use in the flow composition UI.
 * Supports keyboard reordering via onKeyDown and HTML5 drag-and-drop via drag events.
 */
export function ActionListItem({
  action,
  selected,
  onToggle,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onKeyDown,
}: ActionListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 border-b border-border cursor-pointer transition-colors',
        selected
          ? 'bg-[rgba(62,103,191,0.08)] border-l-2 border-l-accent'
          : 'hover:bg-surface-2'
      )}
      onClick={onToggle}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="option"
      aria-selected={selected}
    >
      {draggable && (
        <GripVertical size={14} className="text-text-muted flex-shrink-0" aria-label="Drag to reorder" />
      )}
      <span className="text-body">{action.name}</span>
      <span className="text-caption text-text-dim truncate">{action.description}</span>
      <Badge variant="default" size="sm" className="ml-auto flex-shrink-0">
        {action.category}
      </Badge>
    </div>
  );
}
