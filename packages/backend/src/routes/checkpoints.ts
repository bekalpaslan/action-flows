/**
 * Checkpoint Routes
 *
 * Git-based checkpoint listing and revert operations.
 * Lists recent commits as checkpoints and supports reverting
 * to any checkpoint via git revert (creates new commit, not reset --hard).
 */

import { Router } from 'express';
import { checkpointService } from '../services/checkpointService.js';
import type { WebSocketHub } from '../ws/hub.js';
import { SYSTEM_CHANNEL } from '@afw/shared';

const router = Router();

/**
 * GET /
 * List recent checkpoints (git commits).
 * Query: ?limit=20 (default)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const checkpoints = await checkpointService.listCheckpoints(limit);
    res.status(200).json({ checkpoints });
  } catch (error) {
    console.error('[Checkpoints] Error listing checkpoints:', error);
    res.status(500).json({ error: 'Failed to list checkpoints' });
  }
});

/**
 * POST /revert
 * Revert to a checkpoint by creating a new git revert commit.
 * Body: { commitHash: string }
 */
router.post('/revert', async (req, res) => {
  try {
    const { commitHash } = req.body as { commitHash: string };

    if (!commitHash || !/^[0-9a-f]{7,40}$/i.test(commitHash)) {
      res.status(400).json({ error: 'Invalid commitHash: must be 7-40 hex characters' });
      return;
    }

    const result = await checkpointService.revertToCheckpoint(commitHash);

    if (result.success) {
      // Broadcast revert event via WebSocket
      const hub = req.app.locals.wsHub as WebSocketHub | undefined;
      if (hub) {
        const envelope = JSON.stringify({
          channel: SYSTEM_CHANNEL,
          type: 'checkpoint:reverted',
          payload: { commitHash },
          ts: new Date().toISOString(),
        });
        hub.broadcast(SYSTEM_CHANNEL, envelope);
      }

      console.log(`[Checkpoints] Reverted to checkpoint ${commitHash}`);
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[Checkpoints] Error reverting checkpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /:hash
 * Get checkpoint data for a single commit.
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash || !/^[0-9a-f]{7,40}$/i.test(hash)) {
      res.status(400).json({ error: 'Invalid hash format' });
      return;
    }

    const checkpoint = await checkpointService.getCheckpointForCommit(hash);

    if (checkpoint) {
      res.status(200).json({ checkpoint });
    } else {
      res.status(404).json({ error: 'Checkpoint not found' });
    }
  } catch (error) {
    console.error('[Checkpoints] Error getting checkpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
