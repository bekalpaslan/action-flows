import { Router } from 'express';
import type { Request, Response } from 'express';
import { CustomWorkbenchService } from '../services/customWorkbenchService.js';
import { toCustomWorkbenchId } from '@afw/shared';

/**
 * REST routes for custom workbench CRUD.
 * Mounted at /api/custom-workbenches.
 */
export default function createCustomWorkbenchesRouter(
  workbenchService: CustomWorkbenchService
): Router {
  const router = Router();

  /**
   * GET /api/custom-workbenches
   * List all custom workbenches.
   */
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const workbenches = await workbenchService.listWorkbenches();
      res.json({ success: true, workbenches });
    } catch (error) {
      console.error('[CustomWorkbenches] Error listing:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * POST /api/custom-workbenches
   * Create a new custom workbench.
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, iconName, greeting, tone, systemPromptSnippet } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, error: 'Name is required' });
        return;
      }

      const workbench = await workbenchService.createWorkbench({
        name,
        iconName: iconName || 'briefcase',
        greeting: greeting || '',
        tone: tone || '',
        systemPromptSnippet: systemPromptSnippet || '',
      });

      res.status(201).json({ success: true, workbench });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message === 'A workbench with this name already exists.') {
        res.status(409).json({ success: false, error: message });
        return;
      }

      if (message.includes('conflicts with a default workbench') || message.includes('Cannot modify default')) {
        res.status(400).json({ success: false, error: message });
        return;
      }

      console.error('[CustomWorkbenches] Error creating:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/custom-workbenches/:id
   * Update a custom workbench (partial updates).
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = toCustomWorkbenchId(req.params.id!);
      const updates = req.body;

      const workbench = await workbenchService.updateWorkbench(id, updates);
      if (!workbench) {
        res.status(404).json({ success: false, error: 'Workbench not found' });
        return;
      }

      res.json({ success: true, workbench });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message === 'Cannot modify default workbenches') {
        res.status(400).json({ success: false, error: message });
        return;
      }

      if (message === 'A workbench with this name already exists.') {
        res.status(409).json({ success: false, error: message });
        return;
      }

      console.error('[CustomWorkbenches] Error updating:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * DELETE /api/custom-workbenches/:id
   * Delete a custom workbench.
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = toCustomWorkbenchId(req.params.id!);
      const deleted = await workbenchService.deleteWorkbench(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Workbench not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message === 'Cannot modify default workbenches') {
        res.status(400).json({ success: false, error: message });
        return;
      }

      console.error('[CustomWorkbenches] Error deleting:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
}
