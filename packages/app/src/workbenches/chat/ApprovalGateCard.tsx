import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatApprovalRequest, ApprovalStatus } from '@/lib/chat-types';

export interface ApprovalGateCardProps {
  request: ChatApprovalRequest;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

/** Total timeout duration in milliseconds (120 seconds) */
const TIMEOUT_DURATION_MS = 120_000;

/**
 * Interactive approval gate card for the chat panel. Renders inline with
 * approve/deny buttons, a timeout progress bar, and resolved state badges.
 * Follows the same visual pattern as AskUserRenderer (D-13).
 */
export function ApprovalGateCard({ request, onApprove, onDeny }: ApprovalGateCardProps) {
  const [localStatus, setLocalStatus] = useState<ApprovalStatus>(request.status);
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const expires = new Date(request.expiresAt).getTime();
    return Math.max(0, expires - Date.now());
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync local status with incoming prop when it changes externally
  useEffect(() => {
    if (request.status !== 'pending') {
      setLocalStatus(request.status);
    }
  }, [request.status]);

  // Countdown timer for timeout progress bar
  useEffect(() => {
    if (localStatus !== 'pending') return;

    intervalRef.current = setInterval(() => {
      const expires = new Date(request.expiresAt).getTime();
      const remaining = Math.max(0, expires - Date.now());
      setRemainingMs(remaining);

      if (remaining <= 0) {
        setLocalStatus('timed_out');
        onDeny(request.approvalId);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [localStatus, request.expiresAt, request.approvalId, onDeny]);

  const handleApprove = useCallback(async () => {
    setLocalStatus('approved');
    onApprove(request.approvalId);
    try {
      await fetch(`/api/approvals/${request.approvalId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
    } catch {
      /* silent -- optimistic UI already updated */
    }
  }, [request.approvalId, onApprove]);

  const handleDeny = useCallback(async () => {
    setLocalStatus('denied');
    onDeny(request.approvalId);
    try {
      await fetch(`/api/approvals/${request.approvalId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' }),
      });
    } catch {
      /* silent -- optimistic UI already updated */
    }
  }, [request.approvalId, onDeny]);

  const isPending = localStatus === 'pending';
  const progressPercent = Math.max(0, (remainingMs / TIMEOUT_DURATION_MS) * 100);
  const remainingSec = Math.ceil(remainingMs / 1000);

  // Progress bar color based on remaining time
  const progressColor =
    remainingSec > 30
      ? 'bg-accent'
      : remainingSec > 10
        ? 'bg-warning'
        : 'bg-destructive';

  const statusBadge = () => {
    switch (localStatus) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'denied':
        return <Badge variant="error">Denied</Badge>;
      case 'timed_out':
        return <Badge variant="default">Timed out</Badge>;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'border-l-2 border-warning bg-surface-2 rounded-md overflow-hidden',
        !isPending && 'opacity-75 cursor-default'
      )}
    >
      {/* Timeout progress bar */}
      {isPending && (
        <div
          className={cn('h-1 rounded-t-md transition-colors', progressColor)}
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      )}

      <div className="p-3">
        {/* Row 1: Icon + heading */}
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={16} className="text-warning shrink-0" />
          <span className="text-body font-semibold">Approval Required</span>
        </div>

        {/* Row 2: Description */}
        <p className="text-caption text-text-dim mb-2">{request.description}</p>

        {/* Row 3: File list */}
        {request.files && request.files.length > 0 && (
          <div className="mb-2">
            {request.files.map((file) => (
              <p key={file} className="text-caption font-mono">{file}</p>
            ))}
          </div>
        )}

        {/* Row 4: Workbench + autonomy level */}
        <p className="text-caption text-text-dim mb-3">
          <span className="font-semibold">{request.workbenchId}</span>
          {' '}&middot;{' '}
          {request.autonomyLevel}
        </p>

        {/* Button row or resolved badge */}
        {isPending ? (
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleApprove}>
              Approve action
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeny}>
              Deny action
            </Button>
          </div>
        ) : (
          <div className="flex items-center">
            {statusBadge()}
          </div>
        )}
      </div>
    </div>
  );
}
