/**
 * LearningsBrowser — Searchable learnings list derived from self-healing history.
 *
 * Displays resolved healing attempts as "learnings" — each successful or approved
 * heal is a learned pattern the system can reference. CUSTOM-06: lightweight v1.
 */

import { useState, useEffect, useMemo } from 'react';
import { useHealingStore } from '@/stores/healingStore';
import { StatCard } from '@/workbenches/shared/StatCard';
import { ContentList, type ContentListItemData } from '@/workbenches/shared/ContentList';
import { Input } from '@/components/ui/input';

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

export function LearningsBrowser() {
  const attempts = useHealingStore((s) => s.attempts);
  const loading = useHealingStore((s) => s.loading);
  const loadHistory = useHealingStore((s) => s.loadHistory);
  const getSuccessRate = useHealingStore((s) => s.getSuccessRate);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Derive learnings: filter to succeeded or approved attempts
  const learnings = useMemo(() => {
    const resolved = attempts.filter(
      (a) => a.status === 'succeeded' || a.status === 'approved'
    );

    // Deduplicate by errorClass — keep the most recent per class
    const seen = new Map<string, typeof resolved[number]>();
    for (const attempt of resolved) {
      const existing = seen.get(attempt.errorClass);
      if (!existing || new Date(attempt.createdAt) > new Date(existing.createdAt)) {
        seen.set(attempt.errorClass, attempt);
      }
    }

    return Array.from(seen.values());
  }, [attempts]);

  // Apply search filter (case-insensitive substring match)
  const filteredLearnings = useMemo(() => {
    if (!searchQuery.trim()) return learnings;
    const q = searchQuery.toLowerCase();
    return learnings.filter(
      (a) =>
        a.errorClass.toLowerCase().includes(q) ||
        a.errorMessage.toLowerCase().includes(q) ||
        a.workbenchId.toLowerCase().includes(q)
    );
  }, [learnings, searchQuery]);

  // Count of unique succeeded error classes
  const patternsLearned = useMemo(() => {
    const classes = new Set(
      attempts
        .filter((a) => a.status === 'succeeded')
        .map((a) => a.errorClass)
    );
    return classes.size;
  }, [attempts]);

  // Map to ContentList item format
  const items: ContentListItemData[] = filteredLearnings.map((a) => ({
    id: a.id,
    primary: a.errorClass,
    secondary: a.errorMessage.length > 100
      ? a.errorMessage.slice(0, 100) + '...'
      : a.errorMessage,
    status: a.status === 'succeeded' ? 'complete' as const : 'pending' as const,
    timestamp: `${a.workbenchId} \u00B7 ${relativeTime(a.createdAt)}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-heading font-semibold">Learnings</h2>
        <p className="text-caption text-text-dim">
          Patterns learned from self-healing across workbenches.
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Patterns learned" value={patternsLearned} />
        <StatCard label="Success rate" value={`${getSuccessRate()}%`} />
      </div>

      {/* Search input */}
      <Input
        placeholder="Search learnings..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        inputSize="md"
      />

      {/* Learnings list */}
      {loading ? (
        <div className="py-8 text-center text-text-dim" role="status">
          Loading learnings...
        </div>
      ) : (
        <ContentList
          items={items}
          emptyHeading="No learnings yet"
          emptyBody="Self-healing will create learnings as it resolves runtime errors."
        />
      )}
    </div>
  );
}
