import { useWSStore } from '../stores/wsStore';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
};

const DOT_COLORS: Record<string, string> = {
  connected: 'bg-success',
  reconnecting: 'bg-warning animate-pulse',
  disconnected: 'bg-destructive',
  connecting: 'bg-warning animate-pulse',
};

export function WebSocketStatus() {
  const status = useWSStore((s) => s.status);
  return (
    <div className="flex items-center gap-2 text-caption font-semibold text-text-dim px-4 py-2">
      <span className={cn('h-2 w-2 rounded-full shrink-0', DOT_COLORS[status] ?? 'bg-text-muted')} />
      <span>{STATUS_LABELS[status] ?? status}</span>
    </div>
  );
}
