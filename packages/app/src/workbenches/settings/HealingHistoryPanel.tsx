/**
 * HealingHistoryPanel — Settings page panel showing self-healing attempt
 * history, aggregate stats, and active circuit breakers.
 *
 * Per UI-SPEC Section 11.
 */

import { useEffect } from 'react';
import { useHealingStore } from '@/stores/healingStore';
import { StatCard } from '@/workbenches/shared/StatCard';
import { ContentList, type ContentListItemData } from '@/workbenches/shared/ContentList';
import type { HealingAttempt } from '@afw/shared';

/** Map attempt status to ContentList item status */
function toListStatus(status: HealingAttempt['status']): ContentListItemData['status'] {
  switch (status) {
    case 'succeeded':
    case 'approved':
      return 'complete';
    case 'failed':
      return 'failed';
    case 'awaiting_approval':
      return 'running';
    case 'declined':
    case 'expired':
    default:
      return 'pending';
  }
}

/** Format a relative time string from an ISO date */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HealingHistoryPanel() {
  const attempts = useHealingStore((s) => s.attempts);
  const loading = useHealingStore((s) => s.loading);
  const loadHistory = useHealingStore((s) => s.loadHistory);
  const getSuccessRate = useHealingStore((s) => s.getSuccessRate);
  const getActiveCircuitBreakerCount = useHealingStore((s) => s.getActiveCircuitBreakerCount);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filter to last 7 days for total count
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentAttempts = attempts.filter(
    (a) => new Date(a.createdAt).getTime() > sevenDaysAgo
  );

  // Map attempts to ContentList item format
  const items: ContentListItemData[] = attempts.slice(0, 50).map((a) => ({
    id: a.id,
    primary: `${a.errorClass} — ${a.workbenchId}`,
    secondary:
      a.status === 'declined'
        ? `Declined ${relativeTime(a.resolvedAt ?? a.createdAt)}`
        : `${a.status === 'awaiting_approval' ? 'Awaiting' : a.status.charAt(0).toUpperCase() + a.status.slice(1)} ${relativeTime(a.resolvedAt ?? a.createdAt)}`,
    status: toListStatus(a.status),
    timestamp: relativeTime(a.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading font-semibold">Healing History</h2>
        <p className="text-body text-text-dim mt-1">
          Recent self-healing attempts across workbenches.
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total attempts (7d)" value={recentAttempts.length} />
        <StatCard label="Success rate" value={`${getSuccessRate()}%`} />
        <StatCard label="Circuits active" value={getActiveCircuitBreakerCount()} />
      </div>

      {/* Attempt history list */}
      {loading ? (
        <div className="py-8 text-center text-text-dim" role="status">
          Loading healing history...
        </div>
      ) : (
        <ContentList
          items={items}
          emptyHeading="No healing attempts yet."
          emptyBody="Self-healing approvals will appear here once runtime errors trigger the flow."
        />
      )}
    </div>
  );
}
