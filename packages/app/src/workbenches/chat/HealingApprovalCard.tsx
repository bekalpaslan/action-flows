/**
 * HealingApprovalCard — In-chat approval checkpoint for runtime errors.
 *
 * Renders between MessageList and ChatInput in ChatPanel when a healing
 * attempt is awaiting approval. Users can approve healing or investigate manually.
 *
 * Per UI-SPEC Section 9 (HealingApprovalCard Layout).
 */

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HealingAttempt } from '@afw/shared';
import { cn } from '@/lib/utils';

export interface HealingApprovalCardProps {
  attempt: HealingAttempt;
  approvalId: string;
  onResolve: (approvalId: string, decision: 'approved' | 'declined') => void;
}

/** Map attempt status to badge variant */
const STATUS_BADGE: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  awaiting_approval: 'warning',
  approved: 'success',
  declined: 'default',
  succeeded: 'success',
  failed: 'error',
  expired: 'default',
};

export function HealingApprovalCard({ attempt, approvalId, onResolve }: HealingApprovalCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const isActive = attempt.status === 'awaiting_approval';

  // Extract attempt number from the proposed fix or use a default
  // The quota info is embedded in the approval description by the backend
  const attemptMatch = attempt.proposedFix.match(/attempt (\d+)\/(\d+)/i);
  const attemptNum = attemptMatch ? parseInt(attemptMatch[1]!, 10) : 1;
  const maxAttempts = attemptMatch ? parseInt(attemptMatch[2]!, 10) : 2;
  const isFinalAttempt = attemptNum >= maxAttempts;

  const handleResolve = async (decision: 'approved' | 'declined') => {
    setIsResolving(true);
    try {
      onResolve(approvalId, decision);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card
      className={cn('border-l-2 border-warning max-w-full')}
      role="alertdialog"
      aria-labelledby={`healing-title-${attempt.id}`}
      aria-describedby={`healing-body-${attempt.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h4
            id={`healing-title-${attempt.id}`}
            className="text-body font-semibold"
          >
            Runtime error detected
          </h4>
          <Badge variant="warning">{attempt.errorClass}</Badge>
        </div>
      </CardHeader>

      <CardContent id={`healing-body-${attempt.id}`} className="space-y-3">
        <p className="text-caption text-text-dim">
          The agent can attempt to heal this automatically. Approve to run the
          fix, or investigate manually.
        </p>

        <div>
          <p className="text-caption font-semibold">Proposed fix</p>
          <div className="bg-surface-3 rounded-sm p-2 mt-1">
            <code className="text-caption font-mono break-all">
              {attempt.proposedFix}
            </code>
          </div>
        </div>

        <div className="text-caption font-mono text-destructive break-all">
          {attempt.errorMessage}
        </div>

        <p
          className={cn(
            'text-caption',
            isFinalAttempt ? 'text-warning font-semibold' : 'text-text-dim'
          )}
        >
          {isFinalAttempt
            ? `Attempt ${attemptNum} of ${maxAttempts} today — final attempt`
            : `Attempt ${attemptNum} of ${maxAttempts} today`}
        </p>
      </CardContent>

      {isActive ? (
        <CardFooter className="gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            disabled={isResolving}
            aria-label={`Investigate ${attempt.errorClass} manually`}
            onClick={() => handleResolve('declined')}
          >
            Investigate
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isResolving}
            aria-label={`Approve healing for ${attempt.errorClass}`}
            onClick={() => handleResolve('approved')}
          >
            Approve Healing
          </Button>
        </CardFooter>
      ) : (
        <CardFooter className="justify-end">
          <Badge variant={STATUS_BADGE[attempt.status] ?? 'default'}>
            {attempt.status.replace('_', ' ')}
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
}
