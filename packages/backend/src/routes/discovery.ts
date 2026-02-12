/**
 * Discovery API Routes
 * Endpoints for discovering externally-running Claude Code sessions
 */

import { Router, type Request, type Response } from 'express';
import { claudeSessionDiscovery } from '../services/claudeSessionDiscovery.js';

const router = Router();

/**
 * @swagger
 * /api/discovery/sessions:
 *   get:
 *     summary: Discover running Claude Code sessions
 *     description: Find active Claude Code sessions by scanning IDE lock files
 *     tags: [discovery]
 *     parameters:
 *       - in: query
 *         name: enrich
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include JSONL enrichment data
 *       - in: query
 *         name: aliveOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Only return sessions with alive PIDs (default true)
 *     responses:
 *       200:
 *         description: List of discovered sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 discoveredAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const enrich = req.query.enrich === 'true';
    const aliveOnly = req.query.aliveOnly !== 'false'; // default true

    const sessions = await claudeSessionDiscovery.discoverSessions({
      enrich,
      aliveOnly,
    });

    res.json({
      count: sessions.length,
      sessions,
      discoveredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Discovery] Error discovering sessions:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to discover sessions',
    });
  }
});

export default router;
