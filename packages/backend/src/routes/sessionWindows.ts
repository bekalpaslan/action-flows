import { Router } from 'express';
import type { SessionId, SessionWindowConfig } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage/index.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { validateBody, validateSessionIdParam } from '../middleware/validate.js';
import { sessionWindowConfigSchema } from '../schemas/api.js';
import { sanitizeError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/session-windows
 * Get all followed session windows with enriched data
 */
router.get('/', async (req, res) => {
  try {
    const followedSessionIds = storage.getFollowedSessions ? await storage.getFollowedSessions() : [];

    const enrichedSessions = await Promise.all(
      followedSessionIds.map(async (sessionId) => {
        const session = await storage.getSession(sessionId);
        if (!session) return null;

        const chains = await storage.getChains(sessionId);
        const currentChain = chains[chains.length - 1];

        return {
          session,
          currentChain,
          chainsCount: chains.length,
        };
      })
    );

    res.json({
      count: enrichedSessions.filter((s) => s !== null).length,
      sessionWindows: enrichedSessions.filter((s) => s !== null),
    });
  } catch (error) {
    console.error('[API] Error fetching session windows:', error);
    res.status(500).json({
      error: 'Failed to fetch session windows',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/session-windows/:id/enriched
 * Get enriched data for a specific session window
 */
router.get('/:id/enriched', validateSessionIdParam(), async (req, res) => {
  try {
    const { id } = req.params;
    const session = await storage.getSession(id as SessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    const chains = await storage.getChains(id as SessionId);
    const currentChain = chains[chains.length - 1];
    const events = await storage.getEvents(id as SessionId);

    // Get session window config
    const config = storage.getSessionWindowConfig ? await storage.getSessionWindowConfig(id as SessionId) : undefined;

    res.json({
      session,
      currentChain,
      chains,
      chainsCount: chains.length,
      eventsCount: events.length,
      config: config || null,
    });
  } catch (error) {
    console.error('[API] Error fetching enriched session window:', error);
    res.status(500).json({
      error: 'Failed to fetch enriched session window',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/session-windows/:id/follow
 * Mark a session as followed
 */
router.post('/:id/follow', writeLimiter, validateSessionIdParam(), async (req, res) => {
  try {
    const { id } = req.params;
    const session = await storage.getSession(id as SessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    if (storage.followSession) {
      await storage.followSession(id as SessionId);
    }

    console.log(`[API] Session followed: ${id}`);

    res.status(201).json({
      success: true,
      sessionId: id,
      followed: true,
    });
  } catch (error) {
    console.error('[API] Error following session:', error);
    res.status(500).json({
      error: 'Failed to follow session',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/session-windows/:id/follow
 * Unmark a session as followed
 */
router.delete('/:id/follow', writeLimiter, validateSessionIdParam(), async (req, res) => {
  try {
    const { id } = req.params;

    if (storage.unfollowSession) {
      await storage.unfollowSession(id as SessionId);
    }

    console.log(`[API] Session unfollowed: ${id}`);

    res.json({
      success: true,
      sessionId: id,
      followed: false,
    });
  } catch (error) {
    console.error('[API] Error unfollowing session:', error);
    res.status(500).json({
      error: 'Failed to unfollow session',
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/session-windows/:id/config
 * Update session window configuration
 */
router.put('/:id/config', writeLimiter, validateSessionIdParam(), validateBody(sessionWindowConfigSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const session = await storage.getSession(id as SessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    const config: SessionWindowConfig = {
      sessionId: id as SessionId,
      ...req.body,
    };

    if (storage.setSessionWindowConfig) {
      await storage.setSessionWindowConfig(id as SessionId, config);
    }

    console.log(`[API] Session window config updated: ${id}`);

    res.json({
      success: true,
      sessionId: id,
      config,
    });
  } catch (error) {
    console.error('[API] Error updating session window config:', error);
    res.status(500).json({
      error: 'Failed to update session window config',
      message: sanitizeError(error),
    });
  }
});

export default router;
