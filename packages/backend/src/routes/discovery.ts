/**
 * Discovery API Routes
 * Endpoints for discovering externally-running Claude Code sessions
 */

import { Router, type Request, type Response } from 'express';
import { claudeSessionDiscovery } from '../services/claudeSessionDiscovery.js';

const router = Router();

/**
 * GET /api/discovery/sessions
 * Discover running Claude Code sessions (IDE lock files)
 *
 * Query params:
 *   enrich   - "true" to include JSONL enrichment (default: false)
 *   aliveOnly - "true" to only return sessions with alive PIDs (default: true)
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
