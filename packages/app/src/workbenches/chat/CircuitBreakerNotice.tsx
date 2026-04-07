/**
 * CircuitBreakerNotice — Display-only card shown when daily healing quota
 * is exhausted for a workbench-flow pair.
 *
 * Per UI-SPEC Section 10.
 */

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HealingQuota } from '@afw/shared';

export interface CircuitBreakerNoticeProps {
  workbenchId: string;
  flowId: string;
  quota: HealingQuota;
}

export function CircuitBreakerNotice({ quota }: CircuitBreakerNoticeProps) {
  return (
    <Card
      className="border-l-2 border-destructive"
      role="status"
      aria-live="polite"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h4 className="text-body font-semibold">Circuit breaker active</h4>
          <Badge variant="error">
            {quota.attemptsUsed}/{quota.maxAttempts} today
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-caption text-text-dim">
          Healing attempts exhausted for this flow today. Investigate manually or
          try again tomorrow.
        </p>
      </CardContent>
    </Card>
  );
}
