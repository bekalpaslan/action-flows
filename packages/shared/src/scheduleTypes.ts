/**
 * Schedule System Types for Phase 10: Customization & Automation
 *
 * Types for cron-based scheduled tasks and their execution history.
 * Tasks target flows or actions and run on configurable schedules.
 */

/** @internal Unique symbol for ScheduledTaskId branding */
declare const ScheduledTaskIdSymbol: unique symbol;
/** Unique identifier for a scheduled task */
export type ScheduledTaskId = string & { readonly [ScheduledTaskIdSymbol]: true };

/** Maximum number of run history entries to retain per task (per D-08) */
export const MAX_RUN_HISTORY = 10;

/** A cron-scheduled task definition */
export interface ScheduledTask {
  id: ScheduledTaskId;
  workbenchId: string;
  name: string;
  description: string;
  cronExpression: string;
  target: { type: 'flow' | 'action'; name: string };
  createdAt: string;
  nextRun: string | null;
  lastStatus: 'success' | 'failure' | null;
  lastRun: string | null;
}

/** A single execution record for a scheduled task */
export interface TaskRun {
  runId: string;
  taskId: ScheduledTaskId;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'success' | 'failure';
  error?: string;
}
