import express, { Router } from 'express';
import type { WorkspaceEvent, SessionId, StepNumber } from '@afw/shared';
import { storage, isAsyncStorage } from '../storage/index.js';
import { setActiveStep, clearActiveStep } from '../services/fileWatcher.js';
import { activityTracker } from '../services/activityTracker.js';

// Validation and rate limiting (Agent A)
import { validateBody } from '../middleware/validate.js';
import { createEventSchema } from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';

const router = Router();

// Polling rate limit tracker (1 request per 5 seconds per client)
const pollingRateLimiter = new Map<string, number>();
const POLLING_RATE_LIMIT_MS = 5000; // 5 seconds

/**
 * POST /api/events
 * Receive events from hooks/systems, store and broadcast
 */
router.post('/', writeLimiter, validateBody(createEventSchema), async (req, res) => {
  try {
    const event: WorkspaceEvent = req.body;

    // Store event (handles both async Redis and sync Memory)
    // Registry events may not have a sessionId - skip storage for those
    if (event.sessionId) {
      await Promise.resolve(storage.addEvent(event.sessionId, event));

      // Track activity for TTL extension
      activityTracker.trackActivity(event.sessionId, 'event');
    }

    // Update active step for file change attribution (step events always have sessionId)
    if (event.sessionId) {
      if (event.type === 'step:spawned' || event.type === 'step:started') {
        const stepEvent = event as any;
        if (stepEvent.stepNumber && stepEvent.action) {
          setActiveStep(event.sessionId, stepEvent.stepNumber, stepEvent.action);
          // Track step progress activity
          activityTracker.trackActivity(event.sessionId, 'step_progress');
        }
      } else if (event.type === 'step:completed' || event.type === 'step:failed') {
        clearActiveStep(event.sessionId);
        // Track step progress activity
        activityTracker.trackActivity(event.sessionId, 'step_progress');
      }
    }

    // Broadcast to clients (WebSocket handler subscribes to Redis pub/sub)
    console.log(`[API] Event received and stored:`, {
      sessionId: event.sessionId,
      type: event.type,
      timestamp: event.timestamp,
    });

    res.status(201).json({
      success: true,
      eventId: (event as any).id,
      sessionId: event.sessionId,
    });
  } catch (error) {
    console.error('[API] Error storing event:', error);
    res.status(500).json({
      error: 'Failed to store event',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/events/:sessionId
 * Retrieve all events for a session
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { since } = req.query;

    let events = await Promise.resolve(storage.getEvents(sessionId as SessionId));

    // Filter by timestamp if provided
    if (since && typeof since === 'string') {
      events = await Promise.resolve(storage.getEventsSince(sessionId as SessionId, since));
    }

    res.json({
      sessionId,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('[API] Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/events/:sessionId/recent
 * Get recent events for a session (last N events or last M seconds)
 */
router.get('/:sessionId/recent', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, seconds = 60 } = req.query;

    const events = await Promise.resolve(storage.getEvents(sessionId as SessionId));
    const limitNum = Math.min(parseInt(limit as string) || 50, 1000);
    const secondsNum = parseInt(seconds as string) || 60;

    // Filter by time and limit
    const cutoffTime = new Date(Date.now() - secondsNum * 1000).toISOString();
    const recentEvents = events
      .filter((event: any) => {
        if (event?.timestamp && typeof event.timestamp === 'string') {
          return new Date(event.timestamp) >= new Date(cutoffTime);
        }
        return true;
      })
      .slice(-limitNum);

    res.json({
      sessionId,
      count: recentEvents.length,
      cutoffTime,
      events: recentEvents,
    });
  } catch (error) {
    console.error('[API] Error fetching recent events:', error);
    res.status(500).json({
      error: 'Failed to fetch recent events',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/events/poll/:sessionId
 * HTTP polling fallback for WebSocket failures
 * Returns events since a given timestamp with rate limiting
 */
router.get('/poll/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { since } = req.query;

    // Rate limiting: 1 request per 5 seconds per client
    const clientIdentifier = req.ip || 'unknown';
    const rateLimitKey = `${clientIdentifier}:${sessionId}`;
    const lastRequestTime = pollingRateLimiter.get(rateLimitKey) ?? 0;
    const now = Date.now();

    if (now - lastRequestTime < POLLING_RATE_LIMIT_MS) {
      const retryAfter = Math.ceil((POLLING_RATE_LIMIT_MS - (now - lastRequestTime)) / 1000);
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Polling is limited to 1 request per 5 seconds',
        retryAfter,
      });
      return;
    }

    // Update rate limit tracker
    pollingRateLimiter.set(rateLimitKey, now);

    // Clean up old entries (keep last 1000)
    if (pollingRateLimiter.size > 1000) {
      const entries = Array.from(pollingRateLimiter.entries());
      entries.sort((a, b) => a[1] - b[1]); // Sort by timestamp
      entries.slice(0, entries.length - 1000).forEach(([key]) => {
        pollingRateLimiter.delete(key);
      });
    }

    let events: WorkspaceEvent[];

    if (since && typeof since === 'string') {
      events = await Promise.resolve(storage.getEventsSince(sessionId as SessionId, since));
    } else {
      // No timestamp provided - return last 10 events
      const allEvents = await Promise.resolve(storage.getEvents(sessionId as SessionId));
      events = allEvents.slice(-10);
    }

    res.json({
      sessionId,
      count: events.length,
      events,
      timestamp: new Date().toISOString(),
      pollingMode: true,
    });
  } catch (error) {
    console.error('[API] Error in polling endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: sanitizeError(error),
    });
  }
});

export default router;
