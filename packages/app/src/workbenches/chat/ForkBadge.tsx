/**
 * ForkBadge — inline badge indicator for fork points in chat messages.
 *
 * Displays "Forked here" in accent variant. Shown in message metadata row
 * when a message has been used as a fork point.
 */
import { Badge } from '@/components/ui/badge';

export interface ForkBadgeProps {
  forkCount?: number;
}

export function ForkBadge({ forkCount }: ForkBadgeProps) {
  return (
    <Badge variant="accent" className="ml-2">
      {forkCount && forkCount > 1 ? `Forked here (${forkCount})` : 'Forked here'}
    </Badge>
  );
}
