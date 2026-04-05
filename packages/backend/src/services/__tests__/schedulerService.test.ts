/**
 * SchedulerService Tests
 *
 * Tests for cron scheduling, pause/resume, execution history, and pruning.
 * RED phase: These tests will fail until Plan 03 creates the SchedulerService.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchedulerService } from '../schedulerService.js';
import type { ScheduledTaskId, ScheduledTask, TaskExecution } from '@afw/shared';

/**
 * Creates a mock KV storage backed by a simple Map.
 * Mirrors the optional KV interface on Storage (get, set, keys, delete).
 */
function createMockStorage() {
  const data = new Map<string, string>();
  return {
    get: vi.fn((key: string) => data.get(key) ?? null),
    set: vi.fn((key: string, value: string) => { data.set(key, value); }),
    keys: vi.fn((pattern: string) => {
      const prefix = pattern.replace('*', '');
      return [...data.keys()].filter(k => k.startsWith(prefix));
    }),
    delete: vi.fn((key: string) => data.delete(key)),
  };
}

describe('SchedulerService', () => {
  let service: SchedulerService;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    mockStorage = createMockStorage();
    service = new SchedulerService(mockStorage);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createTask', () => {
    it('should store scheduled task with valid cron expression', async () => {
      const task = await service.createTask({
        workbenchId: 'work',
        name: 'Daily Build',
        description: 'Run build pipeline every morning',
        cronExpression: '0 9 * * 1-5',
      });

      expect(task.id).toBeDefined();
      expect(task.workbenchId).toBe('work');
      expect(task.name).toBe('Daily Build');
      expect(task.cronExpression).toBe('0 9 * * 1-5');
      expect(task.enabled).toBe(true);
      expect(task.createdAt).toBeDefined();
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should reject invalid cron expression with error', async () => {
      await expect(
        service.createTask({
          workbenchId: 'work',
          name: 'Bad Task',
          description: 'Invalid cron',
          cronExpression: 'not-a-cron',
        })
      ).rejects.toThrow();
    });
  });

  describe('toggleTask', () => {
    it('should switch enabled state', async () => {
      const task = await service.createTask({
        workbenchId: 'work',
        name: 'Toggle Test',
        description: 'Test toggling',
        cronExpression: '* * * * *',
      });

      expect(task.enabled).toBe(true);

      const toggled = await service.toggleTask(task.id);
      expect(toggled.enabled).toBe(false);

      const toggledAgain = await service.toggleTask(task.id);
      expect(toggledAgain.enabled).toBe(true);
    });
  });

  describe('getNextRun', () => {
    it('should return correct next run time for a cron expression', async () => {
      const task = await service.createTask({
        workbenchId: 'work',
        name: 'Weekday Morning',
        description: 'Runs at 9am weekdays',
        cronExpression: '0 9 * * 1-5',
      });

      const nextRun = await service.getNextRun(task.id);

      expect(nextRun).toBeDefined();
      // Current time is Saturday April 5, 2026 12:00 UTC
      // Next weekday 9am should be Monday April 7, 2026 09:00 UTC
      const nextRunDate = new Date(nextRun!);
      expect(nextRunDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('recordExecution', () => {
    it('should add to execution history', async () => {
      const task = await service.createTask({
        workbenchId: 'work',
        name: 'Execution Test',
        description: 'Test recording',
        cronExpression: '* * * * *',
      });

      const execution: TaskExecution = {
        taskId: task.id,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'succeeded',
        durationMs: 1500,
      };

      await service.recordExecution(execution);

      const history = await service.getExecutionHistory(task.id);
      expect(history.length).toBe(1);
      expect(history[0]!.status).toBe('succeeded');
      expect(history[0]!.durationMs).toBe(1500);
    });
  });

  describe('getExecutionHistory', () => {
    it('should return last 10 executions (D-08 pruning)', async () => {
      const task = await service.createTask({
        workbenchId: 'work',
        name: 'History Pruning Test',
        description: 'Test pruning at 10',
        cronExpression: '* * * * *',
      });

      // Create 12 executions
      for (let i = 0; i < 12; i++) {
        vi.setSystemTime(new Date(`2026-04-05T12:${String(i).padStart(2, '0')}:00Z`));

        const execution: TaskExecution = {
          taskId: task.id,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          status: i % 3 === 0 ? 'failed' : 'succeeded',
          durationMs: 1000 + i * 100,
        };

        await service.recordExecution(execution);
      }

      const history = await service.getExecutionHistory(task.id);

      expect(history.length).toBe(10);
      // Should retain the most recent 10, not the oldest
      expect(history[history.length - 1]!.durationMs).toBe(1000 + 11 * 100);
    });

    it('should return empty array for task with no runs', async () => {
      const task = await service.createTask({
        workbenchId: 'work',
        name: 'No Runs',
        description: 'Never executed',
        cronExpression: '* * * * *',
      });

      const history = await service.getExecutionHistory(task.id);
      expect(history).toEqual([]);
    });
  });
});
