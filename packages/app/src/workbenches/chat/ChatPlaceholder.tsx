import { cn } from '@/lib/utils';

export function ChatPlaceholder() {
  return (
    <aside className={cn(
      'flex items-center justify-center h-full',
      'bg-surface-2 text-caption text-text-dim'
    )}>
      Chat -- Phase 7
    </aside>
  );
}
