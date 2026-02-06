import express, { Router } from 'express';
import type { WorkspaceEvent, SessionId, StepNumber } from '@afw/shared';
import { storage, isAsyncStorage } from '../storage';
import { setActiveStep, clearActiveStep } from '../services/fileWatcher';

const router = Router();

/**
 * POST /api/events
 * Receive events from hooks/systems, store and broadcast
 */
router.post('/', async (req, res) => {
  try {
    const event: WorkspaceEvent = req.body;

    // Validate event structure
    if (!event || !event.sessionId || !event.type || !event.timestamp) {
      return res.status(400).json({
        error: 'Invalid event format',
        required: ['sessionId', 'type', 'timestamp'],
      });
    }

    // Store event (handles both async Redis and sync Memory)
    await Promise.resolve(storage.addEvent(event.sessionId, event));

    // Update active step for file change attribution
    if (event.type === 'step:spawned' || event.type === 'step:started') {
      const stepEvent = event as any;
      if (stepEvent.stepNumber && stepEvent.action) {
        setActiveStep(event.sessionId, stepEvent.stepNumber, stepEvent.action);
      }
    } else if (event.type === 'step:completed' || event.type === 'step:failed') {
      clearActiveStep(event.sessionId);
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
      message: error instanceof Error ? error.message : 'Unknown error',
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

    let events = await Promise.resolve(storage.getEvents(sessionId));

    // Filter by timestamp if provided
    if (since && typeof since === 'string') {
      events = await Promise.resolve(storage.getEventsSince(sessionId, since));
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
      message: error instanceof Error ? error.message : 'Unknown error',
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

    const events = await Promise.resolve(storage.getEvents(sessionId));
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
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
