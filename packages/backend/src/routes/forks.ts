/**
 * Fork Routes — REST API for session fork management.
 *
 * Routes:
 * - GET    /:parentSessionId       — list forks for a parent session
 * - POST   /                       — create a new fork
 * - PUT    /:forkId/description    — update fork description
 * - POST   /:forkId/merge         — merge fork back to parent
 * - DELETE /:forkId               — discard (abandon) a fork
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ForkId, MergeResolution } from '@afw/shared';
import { ForkMetadataService } from '../services/forkMetadataService.js';

/**
 * Minimal interface for SessionManager dependency injection.
 * Avoids importing the full SessionManager class to prevent circular dependencies.
 * The real SessionManager in services/sessionManager.ts satisfies this interface.
 */
export interface ISessionManager {
  forkSession(workbenchId: string): Promise<string | null>;
}

export default function createForksRouter(
  forkMetadataService: ForkMetadataService,
  sessionManager: ISessionManager,
): Router {
  const router = Router();

  /**
   * GET /:parentSessionId — list all non-abandoned forks for a session
   */
  router.get('/:parentSessionId', async (req: Request, res: Response) => {
    try {
      const { parentSessionId } = req.params;
      const forks = await forkMetadataService.listForks(parentSessionId as string);
      res.json({ success: true, forks });
    } catch (err) {
      console.error('[ForkRoutes] Error listing forks:', err);
      res.status(500).json({ success: false, error: 'Failed to list forks' });
    }
  });

  /**
   * POST / — create a new fork
   * D-14: validate description non-empty (400 if empty)
   * Returns 503 with FORK_SESSION_UNAVAILABLE when sessionManager.forkSession returns null
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { parentSessionId, workbenchId, description, forkPointMessageId } = req.body as {
        parentSessionId: string;
        workbenchId: string;
        description: string;
        forkPointMessageId?: string;
      };

      // D-14: validate description
      if (!description || description.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Fork description is required.',
        });
        return;
      }

      // Call sessionManager.forkSession to get a new session ID from the Agent SDK
      const forkSessionId = await sessionManager.forkSession(workbenchId);

      // If forkSession returns null, the Agent SDK session layer is unavailable (Phase 6 dependency)
      if (forkSessionId === null) {
        res.status(503).json({
          success: false,
          error: 'Fork creation requires active agent sessions. This feature will be available when agent session management (Phase 6) is implemented.',
          code: 'FORK_SESSION_UNAVAILABLE',
        });
        return;
      }

      // Create fork metadata
      const fork = await forkMetadataService.createFork({
        parentSessionId,
        forkSessionId,
        workbenchId,
        description,
        forkPointMessageId,
      });

      res.status(201).json({ success: true, fork });
    } catch (err) {
      console.error('[ForkRoutes] Error creating fork:', err);
      const message = err instanceof Error ? err.message : 'Failed to create fork';
      res.status(500).json({ success: false, error: message });
    }
  });

  /**
   * PUT /:forkId/description — update fork description
   */
  router.put('/:forkId/description', async (req: Request, res: Response) => {
    try {
      const forkId = req.params.forkId as ForkId;
      const { description } = req.body as { description: string };

      if (!description || description.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Fork description is required.',
        });
        return;
      }

      const fork = await forkMetadataService.updateForkDescription(forkId, description);
      if (!fork) {
        res.status(404).json({ success: false, error: 'Fork not found' });
        return;
      }

      res.json({ success: true, fork });
    } catch (err) {
      console.error('[ForkRoutes] Error updating fork description:', err);
      const message = err instanceof Error ? err.message : 'Failed to update fork description';
      res.status(500).json({ success: false, error: message });
    }
  });

  /**
   * POST /:forkId/merge — merge fork back to parent
   * D-13: supports three resolution strategies (theirs/parent/manual)
   */
  router.post('/:forkId/merge', async (req: Request, res: Response) => {
    try {
      const forkId = req.params.forkId as ForkId;
      const { resolution, manualContent } = req.body as {
        resolution: MergeResolution;
        manualContent?: string;
      };

      if (!resolution || !['theirs', 'parent', 'manual'].includes(resolution)) {
        res.status(400).json({
          success: false,
          error: 'Valid merge resolution is required (theirs, parent, or manual).',
        });
        return;
      }

      const fork = await forkMetadataService.mergeFork(forkId, resolution, manualContent);
      if (!fork) {
        res.status(404).json({ success: false, error: 'Fork not found' });
        return;
      }

      res.json({ success: true, fork });
    } catch (err) {
      console.error('[ForkRoutes] Error merging fork:', err);
      const message = err instanceof Error ? err.message : 'Failed to merge fork';
      res.status(500).json({ success: false, error: message });
    }
  });

  /**
   * DELETE /:forkId — discard (abandon) a fork
   */
  router.delete('/:forkId', async (req: Request, res: Response) => {
    try {
      const forkId = req.params.forkId as ForkId;
      const success = await forkMetadataService.discardFork(forkId);

      if (!success) {
        res.status(404).json({ success: false, error: 'Fork not found' });
        return;
      }

      res.json({ success: true });
    } catch (err) {
      console.error('[ForkRoutes] Error discarding fork:', err);
      res.status(500).json({ success: false, error: 'Failed to discard fork' });
    }
  });

  return router;
}
