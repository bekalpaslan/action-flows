import { Badge } from '@/components/ui/badge';

export interface ContentListItemData {
  id: string;
  primary: string;
  secondary?: string;
  status?: 'running' | 'complete' | 'failed' | 'pending';
  timestamp?: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'default' | 'error' | 'warning'> = {
  running: 'success',
  complete: 'default',
  failed: 'error',
  pending: 'warning',
};

interface ContentListProps {
  items: ContentListItemData[];
  emptyHeading: string;
  emptyBody: string;
}

export function ContentList({ items, emptyHeading, emptyBody }: ContentListProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center" role="status">
        <h3 className="text-heading font-semibold">{emptyHeading}</h3>
        <p className="text-body text-text-dim mt-2">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div role="list">
      {items.map((item) => (
        <div
          key={item.id}
          role="listitem"
          className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-body">{item.primary}</span>
            {item.secondary && (
              <span className="text-caption text-text-dim">{item.secondary}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {item.timestamp && (
              <span className="text-caption text-text-muted">{item.timestamp}</span>
            )}
            {item.status && (
              <Badge
                variant={STATUS_VARIANT[item.status] ?? 'default'}
                size="sm"
                aria-label={`Status: ${item.status}`}
              >
                {item.status}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
