import { Router } from 'express';
import { filePersistence } from '../storage/file-persistence.js';
import { ledgerService } from '../services/ledgerService.js';
import type { LedgerFilter } from '@afw/shared';

const router = Router()

/**
 * GET /api/history/dates
 * List all available dates with session history
 */
router.get('/dates', async (_req, res) => {
  try {
    const dates = await filePersistence.listAvailableDates()
    res.json({ dates })
  } catch (error) {
    console.error('Error listing history dates:', error)
    res.status(500).json({ error: 'Failed to list history dates' })
  }
})

/**
 * GET /api/history/sessions/:date
 * List all sessions for a specific date
 * Example: /api/history/sessions/2026-02-06
 */
router.get('/sessions/:date', async (req, res) => {
  try {
    const { date } = req.params
    const parsedDate = new Date(date)

    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
      return
    }

    const sessionIds = await filePersistence.listSessionsByDate(parsedDate)
    res.json({ date, sessionIds })
  } catch (error) {
    console.error('Error listing sessions:', error)
    res.status(500).json({ error: 'Failed to list sessions' })
  }
})

/**
 * GET /api/history/session/:sessionId
 * Load a specific session snapshot
 * Query param: date (optional, defaults to today)
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { date } = req.query

    const parsedDate = date ? new Date(date as string) : new Date()

    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
      return
    }

    const snapshot = await filePersistence.loadSession(sessionId, parsedDate)

    if (!snapshot) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    res.json(snapshot)
  } catch (error) {
    console.error('Error loading session:', error)
    res.status(500).json({ error: 'Failed to load session' })
  }
})

/**
 * GET /api/history/stats
 * Get storage statistics
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await filePersistence.getStats()
    res.json(stats)
  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

/**
 * POST /api/history/cleanup
 * Manually trigger cleanup of old files
 */
router.post('/cleanup', async (_req, res) => {
  try {
    const deletedCount = await filePersistence.cleanupOldFiles()
    res.json({ deletedCount, message: `Deleted ${deletedCount} old date folders` })
  } catch (error) {
    console.error('Error during cleanup:', error)
    res.status(500).json({ error: 'Failed to cleanup old files' })
  }
})

/**
 * GET /api/history/ledger
 * Query the execution ledger (raw → ledger promotions from gate traces).
 * Filters: gateId, outcome, fromTimestamp, toTimestamp, limit
 * Per D-05.
 */
router.get('/ledger', (req, res) => {
  try {
    const filter: LedgerFilter = {};
    if (typeof req.query.gateId === 'string') filter.gateId = req.query.gateId as LedgerFilter['gateId'];
    if (req.query.outcome === 'pass' || req.query.outcome === 'fail') {
      filter.outcome = req.query.outcome;
    }
    if (typeof req.query.fromTimestamp === 'string') {
      filter.fromTimestamp = req.query.fromTimestamp as LedgerFilter['fromTimestamp'];
    }
    if (typeof req.query.toTimestamp === 'string') {
      filter.toTimestamp = req.query.toTimestamp as LedgerFilter['toTimestamp'];
    }
    if (typeof req.query.limit === 'string') {
      const n = parseInt(req.query.limit, 10);
      if (Number.isFinite(n) && n > 0) filter.limit = n;
    }
    const entries = ledgerService.query(filter);
    res.json({ entries });
  } catch (error) {
    console.error('[history/ledger] Query failed:', error);
    res.status(500).json({ error: 'Failed to query ledger' });
  }
});

export default router
