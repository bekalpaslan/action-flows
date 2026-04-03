import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

export interface ContentListItemData {
  id: string;
  primary: string;
  secondary?: string;
  status?: 'running' | 'complete' | 'failed' | 'pending';
  timestamp?: string;
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const STATUS_VARIANT: Record<NonNullable<ContentListItemData['status']>, BadgeVariant> = {
  running: 'success',
  complete: 'default',
  failed: 'error',
  pending: 'warning',
};

export interface ContentListItemProps {
  item: ContentListItemData;
}

export function ContentListItem({ item }: ContentListItemProps) {
  return (
    <div
      role="listitem"
      className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors"
    >
      <div className="flex flex-col gap-1">
        <span className="text-body">{item.primary}</span>
        {item.secondary && (
          <span className="text-caption text-text-dim">{item.secondary}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {item.status && (
          <Badge
            variant={STATUS_VARIANT[item.status]}
            aria-label={`Status: ${item.status}`}
          >
            {item.status}
          </Badge>
        )}
        {item.timestamp && (
          <span className="text-caption text-text-muted">{item.timestamp}</span>
        )}
      </div>
    </div>
  );
}
