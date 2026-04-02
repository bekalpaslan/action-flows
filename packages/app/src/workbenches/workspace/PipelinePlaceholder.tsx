import { cn } from '@/lib/utils';

export function PipelinePlaceholder() {
  return (
    <div className={cn(
      'flex items-center justify-center h-full',
      'bg-surface border-b border-border overflow-hidden'
    )}>
      <span className="text-caption text-text-dim">Pipeline -- Phase 5</span>
    </div>
  );
}
