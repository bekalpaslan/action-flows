/**
 * ScheduledTaskRow — Individual task row with status, next-run, Run Now button,
 * and expandable run history.
 */

import { useState, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TaskHistoryList } from './TaskHistoryList';
import type { ScheduledTask } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

export interface ScheduledTaskRowProps {
  task: ScheduledTask;
  workbenchId: WorkbenchId;
  onEdit: () => void;
  onDelete: () => void;
  onRunNow: () => void;
}

/** Map task lastStatus to Badge variant */
function statusVariant(status: ScheduledTask['lastStatus']): 'success' | 'error' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'failure') return 'error';
  return 'default';
}

/** Format a date string to a short readable form */
function formatNextRun(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function ScheduledTaskRow({
  task,
  workbenchId,
  onEdit,
  onDelete,
  onRunNow,
}: ScheduledTaskRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="bg-surface-2 border border-border rounded-md">
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {/* Left: Name and description */}
        <div className="flex-1 min-w-0">
          <div className="text-body font-semibold truncate">{task.name}</div>
          {task.description && (
            <div className="text-caption text-text-dim truncate">{task.description}</div>
          )}
        </div>

        {/* Middle: Cron expression and next run */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-caption font-mono text-text-dim">{task.cronExpression}</span>
          <span className="text-caption">
            <span className="text-text-muted">Next run </span>
            <span className="font-semibold">{formatNextRun(task.nextRun)}</span>
          </span>
        </div>

        {/* Right: Status badge, Run Now, menu */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant={statusVariant(task.lastStatus)}>
            {task.lastStatus ?? 'Not yet run'}
          </Badge>

          <Button
            variant="secondary"
            size="sm"
            aria-label={`Run task ${task.name} now`}
            onClick={(e) => {
              e.stopPropagation();
              onRunNow();
            }}
          >
            Run Now
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`More options for ${task.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expandable history */}
      {expanded && (
        <div className="border-t border-border">
          <TaskHistoryList taskId={task.id} workbenchId={workbenchId} />
        </div>
      )}
    </div>
  );
}
