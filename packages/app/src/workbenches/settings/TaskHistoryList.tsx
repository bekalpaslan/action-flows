/**
 * TaskHistoryList — Shows last 10 execution runs for a scheduled task.
 *
 * Auto-refreshes every 30 seconds while mounted.
 * Each run shows timestamp, duration, status badge, and error tooltip on failure.
 */

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { TaskRun } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

export interface TaskHistoryListProps {
  taskId: string;
  workbenchId: WorkbenchId;
}

/** Format milliseconds to a human-readable duration string */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

/** Format ISO timestamp to a readable short form */
function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export function TaskHistoryList({ taskId, workbenchId }: TaskHistoryListProps) {
  const loadRuns = useScheduleStore((s) => s.loadRuns);
  const runs = useScheduleStore((s) => s.runs[taskId] ?? []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initial load
    loadRuns(workbenchId, taskId);

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadRuns(workbenchId, taskId);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId, workbenchId, loadRuns]);

  return (
    <div className="px-4 py-3">
      <h4 className="text-caption font-semibold mb-2">Recent runs</h4>

      {runs.length === 0 ? (
        <p className="text-caption text-text-dim">No runs yet.</p>
      ) : (
        <TooltipProvider>
          <div>
            {runs.map((run: TaskRun, index: number) => (
              <div
                key={run.runId}
                className={`flex items-center gap-2 px-4 py-3 ${
                  index < runs.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Timestamp */}
                <span className="text-caption text-text-muted flex-1 min-w-0 truncate">
                  {formatTimestamp(run.startedAt)}
                </span>

                {/* Duration */}
                <span className="text-caption text-text-dim shrink-0">
                  {formatDuration(run.durationMs)}
                </span>

                {/* Status badge */}
                <Badge
                  variant={run.status === 'success' ? 'success' : 'error'}
                  size="sm"
                >
                  {run.status}
                </Badge>

                {/* Error text with tooltip on failure */}
                {run.status === 'failure' && run.error && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-caption text-destructive truncate max-w-[120px] cursor-help">
                        {run.error}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-caption">{run.error}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}

            {/* Hint when showing max history */}
            {runs.length >= 10 && (
              <p className="text-caption text-text-muted px-4 py-2">
                Showing the last 10 runs.
              </p>
            )}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
