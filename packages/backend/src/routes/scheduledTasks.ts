/**
 * Scheduled Tasks Routes — REST endpoints for task CRUD and manual trigger.
 *
 * Routes:
 * - GET    /:workbenchId                  — list all tasks for a workbench
 * - POST   /:workbenchId                  — create a new task
 * - PUT    /:workbenchId/:taskId          — update a task
 * - DELETE /:workbenchId/:taskId          — delete a task
 * - POST   /:workbenchId/:taskId/run      — manual trigger (D-09)
 * - GET    /:workbenchId/:taskId/runs     — get run history
 */

import { Router } from 'express';
import type { ScheduledTaskId } from '@afw/shared';
import type { ScheduledTaskService } from '../services/scheduledTaskService.js';

export default function createScheduledTasksRouter(
  taskService: ScheduledTaskService
): Router {
  const router = Router();

  // GET /:workbenchId — list tasks
  router.get('/:workbenchId', async (req, res) => {
    try {
      const { workbenchId } = req.params;
      const tasks = await taskService.listTasks(workbenchId!);
      res.json({ success: true, tasks });
    } catch (error) {
      console.error('[ScheduledTasks] List error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // POST /:workbenchId — create task
  router.post('/:workbenchId', async (req, res) => {
    try {
      const { workbenchId } = req.params;
      const { name, description, cronExpression, target } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Name is required and must be non-empty.' });
        return;
      }
      if (!cronExpression || typeof cronExpression !== 'string' || cronExpression.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Cron expression is required and must be non-empty.' });
        return;
      }

      const task = await taskService.createTask(workbenchId!, {
        name: name.trim(),
        description: description ?? '',
        cronExpression: cronExpression.trim(),
        target: target ?? { type: 'flow', name: '' },
      });

      res.status(201).json({ success: true, task });
    } catch (error) {
      // Invalid cron expression produces a descriptive error
      if (error instanceof Error && error.message.includes('Invalid cron expression')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      console.error('[ScheduledTasks] Create error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // PUT /:workbenchId/:taskId — update task
  router.put('/:workbenchId/:taskId', async (req, res) => {
    try {
      const { workbenchId, taskId } = req.params;
      const updates = req.body;

      const task = await taskService.updateTask(
        workbenchId!,
        taskId as ScheduledTaskId,
        updates
      );

      if (!task) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      res.json({ success: true, task });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid cron expression')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      console.error('[ScheduledTasks] Update error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // DELETE /:workbenchId/:taskId — delete task
  router.delete('/:workbenchId/:taskId', async (req, res) => {
    try {
      const { workbenchId, taskId } = req.params;
      const deleted = await taskService.deleteTask(
        workbenchId!,
        taskId as ScheduledTaskId
      );

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[ScheduledTasks] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // POST /:workbenchId/:taskId/run — manual trigger (D-09)
  router.post('/:workbenchId/:taskId/run', async (req, res) => {
    try {
      const { workbenchId, taskId } = req.params;
      const run = await taskService.runNow(
        workbenchId!,
        taskId as ScheduledTaskId
      );

      res.json({ success: true, run });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      console.error('[ScheduledTasks] RunNow error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // GET /:workbenchId/:taskId/runs — get run history
  router.get('/:workbenchId/:taskId/runs', async (req, res) => {
    try {
      const { taskId } = req.params;
      const runs = await taskService.getRunHistory(taskId as ScheduledTaskId);
      res.json({ success: true, runs });
    } catch (error) {
      console.error('[ScheduledTasks] GetRuns error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  return router;
}
