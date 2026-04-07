/**
 * ScheduledTaskService — Croner-backed cron scheduler with run history.
 *
 * Manages scheduled tasks per workbench: CRUD, live Cron instances,
 * manual trigger (Run Now), and execution history (last 10 per D-08).
 * Failed tasks do NOT auto-retry (D-09).
 */

import { Cron } from 'croner';
import { v4 as uuidv4 } from 'uuid';
import type { Storage } from '../storage/index.js';
import type { ScheduledTask, ScheduledTaskId, TaskRun } from '@afw/shared';
import { MAX_RUN_HISTORY } from '@afw/shared';

export class ScheduledTaskService {
  private storage: Storage;
  private jobs: Map<string, Cron> = new Map();

  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * Create a new scheduled task with cron validation.
   * Throws on invalid cron expression.
   */
  async createTask(
    workbenchId: string,
    data: {
      name: string;
      description: string;
      cronExpression: string;
      target: { type: 'flow' | 'action'; name: string };
    }
  ): Promise<ScheduledTask> {
    // Validate cron expression by attempting to create a Cron instance
    let testJob: Cron;
    try {
      testJob = new Cron(data.cronExpression);
    } catch (err) {
      throw new Error(
        `Invalid cron expression "${data.cronExpression}": ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const taskId = uuidv4() as ScheduledTaskId;
    const nextRun = testJob.nextRun()?.toISOString() ?? null;
    testJob.stop();

    const task: ScheduledTask = {
      id: taskId,
      workbenchId,
      name: data.name,
      description: data.description,
      cronExpression: data.cronExpression,
      target: data.target,
      createdAt: new Date().toISOString(),
      nextRun,
      lastStatus: null,
      lastRun: null,
    };

    const key = `schedule:${workbenchId}:${taskId}`;
    await Promise.resolve(this.storage.set?.(key, JSON.stringify(task)));

    this.registerJob(task);
    return task;
  }

  /**
   * List all tasks for a workbench, sorted by createdAt desc.
   * Updates nextRun from live Cron instances.
   */
  async listTasks(workbenchId: string): Promise<ScheduledTask[]> {
    const pattern = `schedule:${workbenchId}:*`;
    const keys = await Promise.resolve(this.storage.keys?.(pattern) ?? []);
    const tasks: ScheduledTask[] = [];

    for (const key of keys) {
      const raw = await Promise.resolve(this.storage.get?.(key));
      if (raw) {
        try {
          const task = JSON.parse(raw) as ScheduledTask;
          // Update nextRun from live Cron instance if available
          const liveNextRun = this.getNextRun(task.id);
          if (liveNextRun !== undefined) {
            task.nextRun = liveNextRun;
          }
          tasks.push(task);
        } catch {
          console.error(`[ScheduledTaskService] Failed to parse task from key ${key}`);
        }
      }
    }

    // Sort by createdAt descending (newest first)
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tasks;
  }

  /**
   * Get a single task by workbenchId and taskId.
   */
  async getTask(workbenchId: string, taskId: ScheduledTaskId): Promise<ScheduledTask | null> {
    const key = `schedule:${workbenchId}:${taskId}`;
    const raw = await Promise.resolve(this.storage.get?.(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ScheduledTask;
    } catch {
      return null;
    }
  }

  /**
   * Update task fields. If cronExpression changes, re-registers the Cron job.
   */
  async updateTask(
    workbenchId: string,
    taskId: ScheduledTaskId,
    updates: Partial<Pick<ScheduledTask, 'name' | 'description' | 'cronExpression' | 'target'>>
  ): Promise<ScheduledTask | null> {
    const task = await this.getTask(workbenchId, taskId);
    if (!task) return null;

    const cronChanged = updates.cronExpression && updates.cronExpression !== task.cronExpression;

    // Validate new cron expression if changed
    if (cronChanged) {
      try {
        const testJob = new Cron(updates.cronExpression!);
        testJob.stop();
      } catch (err) {
        throw new Error(
          `Invalid cron expression "${updates.cronExpression}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Merge updates
    const updated: ScheduledTask = {
      ...task,
      ...updates,
    };

    // If cron changed, stop old job and register new one
    if (cronChanged) {
      const oldJob = this.jobs.get(taskId);
      if (oldJob) {
        oldJob.stop();
        this.jobs.delete(taskId);
      }
      this.registerJob(updated);
      updated.nextRun = this.getNextRun(taskId) ?? null;
    }

    const key = `schedule:${workbenchId}:${taskId}`;
    await Promise.resolve(this.storage.set?.(key, JSON.stringify(updated)));
    return updated;
  }

  /**
   * Delete a task and its run history. Stops the Cron job if running.
   */
  async deleteTask(workbenchId: string, taskId: ScheduledTaskId): Promise<boolean> {
    const key = `schedule:${workbenchId}:${taskId}`;
    const raw = await Promise.resolve(this.storage.get?.(key));
    if (!raw) return false;

    // Stop Cron job
    const job = this.jobs.get(taskId);
    if (job) {
      job.stop();
      this.jobs.delete(taskId);
    }

    // Delete task data and run history
    await Promise.resolve(this.storage.delete?.(key));
    await Promise.resolve(this.storage.delete?.(`scheduleRun:${taskId}`));
    return true;
  }

  /**
   * Manually trigger a task execution (D-09: Run Now).
   */
  async runNow(workbenchId: string, taskId: ScheduledTaskId): Promise<TaskRun> {
    const task = await this.getTask(workbenchId, taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in workbench ${workbenchId}`);
    }
    return this.executeTask(task);
  }

  /**
   * Execute a task: record timing, dispatch action, store run history.
   * Does NOT retry on failure (D-09).
   */
  private async executeTask(task: ScheduledTask): Promise<TaskRun> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();
    let status: 'success' | 'failure' = 'success';
    let error: string | undefined;

    try {
      // V1: Log execution + would broadcast WS event schedule:task_executed
      console.log(
        `[ScheduledTaskService] Executing task "${task.name}" (${task.id}) — target: ${task.target.type}/${task.target.name}`
      );
    } catch (err) {
      status = 'failure';
      error = err instanceof Error ? err.message : String(err);
      console.error(`[ScheduledTaskService] Task "${task.name}" failed:`, error);
      // D-09: Do NOT retry
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;

    const run: TaskRun = {
      runId: uuidv4(),
      taskId: task.id,
      startedAt,
      finishedAt,
      durationMs,
      status,
      ...(error ? { error } : {}),
    };

    // Record run in history
    await this.recordRun(task.id, run);

    // Update task's lastStatus and lastRun in storage
    const key = `schedule:${task.workbenchId}:${task.id}`;
    const raw = await Promise.resolve(this.storage.get?.(key));
    if (raw) {
      try {
        const current = JSON.parse(raw) as ScheduledTask;
        current.lastStatus = status;
        current.lastRun = finishedAt;
        await Promise.resolve(this.storage.set?.(key, JSON.stringify(current)));
      } catch {
        console.error(`[ScheduledTaskService] Failed to update task status for ${task.id}`);
      }
    }

    return run;
  }

  /**
   * Record a run in the task's history, keeping only MAX_RUN_HISTORY (10) entries.
   */
  private async recordRun(taskId: ScheduledTaskId, run: TaskRun): Promise<void> {
    const historyKey = `scheduleRun:${taskId}`;
    const raw = await Promise.resolve(this.storage.get?.(historyKey));
    let history: TaskRun[] = [];

    if (raw) {
      try {
        history = JSON.parse(raw) as TaskRun[];
      } catch {
        history = [];
      }
    }

    // Prepend new run and trim to MAX_RUN_HISTORY
    history.unshift(run);
    history = history.slice(0, MAX_RUN_HISTORY);

    await Promise.resolve(this.storage.set?.(historyKey, JSON.stringify(history)));
  }

  /**
   * Get execution history for a task (last 10 runs, D-08).
   */
  async getRunHistory(taskId: ScheduledTaskId): Promise<TaskRun[]> {
    const historyKey = `scheduleRun:${taskId}`;
    const raw = await Promise.resolve(this.storage.get?.(historyKey));
    if (!raw) return [];

    try {
      return JSON.parse(raw) as TaskRun[];
    } catch {
      return [];
    }
  }

  /**
   * Register a Cron job for a task. Stops existing job for the same taskId.
   */
  private registerJob(task: ScheduledTask): void {
    // Stop existing job if any
    const existingJob = this.jobs.get(task.id);
    if (existingJob) {
      existingJob.stop();
    }

    const job = new Cron(task.cronExpression, { timezone: 'UTC' }, async () => {
      await this.executeTask(task);
    });

    this.jobs.set(task.id, job);
    console.log(
      `[ScheduledTaskService] Registered cron job for task "${task.name}" (${task.id}): ${task.cronExpression}`
    );
  }

  /**
   * Get the next run time for a task from its live Cron instance.
   */
  getNextRun(taskId: string): string | null {
    return this.jobs.get(taskId)?.nextRun()?.toISOString() ?? null;
  }

  /**
   * Load all existing tasks from storage and register Cron jobs.
   * Called on server initialization.
   */
  async loadAllTasks(): Promise<void> {
    const allKeys = await Promise.resolve(this.storage.keys?.('schedule:*') ?? []);
    let count = 0;

    for (const key of allKeys) {
      // Skip run history keys
      if (key.startsWith('scheduleRun:')) continue;

      const raw = await Promise.resolve(this.storage.get?.(key));
      if (!raw) continue;

      try {
        const task = JSON.parse(raw) as ScheduledTask;
        this.registerJob(task);
        count++;
      } catch {
        console.error(`[ScheduledTaskService] Failed to load task from key ${key}`);
      }
    }

    console.log(`[ScheduledTaskService] Loaded ${count} scheduled tasks`);
  }

  /**
   * Stop all Cron jobs. Called on server shutdown.
   */
  stopAll(): void {
    for (const [taskId, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    console.log('[ScheduledTaskService] All cron jobs stopped');
  }
}
