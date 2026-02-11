import express, { Router } from 'express';
import type { WorkspaceEvent, SessionId, StepNumber, ChainCompiledEvent, ChainStartedEvent, ChainCompletedEvent, Chain, ChainStep } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage, isAsyncStorage } from '../storage/index.js';
import { setActiveStep, clearActiveStep } from '../services/fileWatcher.js';
import { activityTracker } from '../services/activityTracker.js';

// Validation and rate limiting (Agent A)
import { validateBody } from '../middleware/validate.js';
import { createEventSchema } from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';

// Discovery service for activity recording (Phase 3)
import { getDiscoveryService } from '../services/discoveryService.js';

// Universe events for region discovery broadcasts (Phase 3)
import { broadcastRegionDiscovered } from '../ws/universeEvents.js';

// Spark broadcaster for chain execution visualization (Phase 4)
import { getSparkBroadcaster } from '../services/sparkBroadcaster.js';

const router = Router();

// Polling rate limit tracker (1 request per 5 seconds per client)
const pollingRateLimiter = new Map<string, number>();
const POLLING_RATE_LIMIT_MS = 5000; // 5 seconds

// Active chain tracker for spark animation (Phase 4)
// Maps sessionId -> chainId
const activeChainBySession = new Map<SessionId, string>();

/**
 * Convert ChainCompiledEvent to Chain domain object
 * Maps event data to Chain structure for storage and retrieval
 */
function buildChainFromEvent(event: ChainCompiledEvent): Chain {
  // Generate chainId if not provided
  const chainId = event.chainId || brandedTypes.chainId(`${event.sessionId}-${Date.now()}`);

  // Map steps from ChainStepSnapshot to ChainStep
  const steps: ChainStep[] = (event.steps || []).map((snapshot) => ({
    stepNumber: brandedTypes.stepNumber(snapshot.stepNumber),
    action: snapshot.action,
    model: (snapshot.model || 'haiku') as 'haiku' | 'sonnet' | 'opus',
    inputs: snapshot.inputs || {},
    waitsFor: (snapshot.waitsFor || []).map(n => brandedTypes.stepNumber(n)),
    status: 'pending' as const,
    description: snapshot.description,
  }));

  // Build Chain object
  const chain: Chain = {
    id: chainId,
    sessionId: event.sessionId || ('' as SessionId),
    userId: event.user,
    title: event.title || 'Untitled Chain',
    steps,
    source: event.source || 'composed',
    ref: event.ref || undefined,
    status: 'pending',
    compiledAt: event.timestamp,
    executionMode: event.executionMode,
    estimatedDuration: event.estimatedDuration,
  };

  return chain;
}

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

      // Convert chain events to Chain domain objects
      if (event.type === 'chain:compiled') {
        const chainEvent = event as ChainCompiledEvent;
        const chain = buildChainFromEvent(chainEvent);
        // Check for duplicate — don't create if chain with same ID already exists
        const existing = await Promise.resolve(storage.getChain(chain.id));
        if (!existing) {
          await Promise.resolve(storage.addChain(event.sessionId, chain));
          console.log(`[API] Created chain: ${chain.id} with ${chain.steps.length} steps`);
        }
      }

      // Update chain status when chain starts
      if (event.type === 'chain:started') {
        const chainEvent = event as ChainStartedEvent;
        const chain = await Promise.resolve(storage.getChain(chainEvent.chainId));
        if (chain) {
          chain.status = 'in_progress';
          chain.startedAt = event.timestamp;
          chain.currentStep = chainEvent.currentStep;
          await Promise.resolve(storage.addChain(event.sessionId, chain));
          console.log(`[API] Updated chain status: ${chain.id} -> in_progress`);

          // Track active chain for spark animation (Phase 4)
          activeChainBySession.set(event.sessionId, chainEvent.chainId);
        }
      }

      // Update chain status when chain completes
      if (event.type === 'chain:completed') {
        const chainEvent = event as ChainCompletedEvent;
        const chain = await Promise.resolve(storage.getChain(chainEvent.chainId));
        if (chain) {
          chain.status = chainEvent.status || 'completed';
          chain.completedAt = event.timestamp;
          chain.duration = chainEvent.duration;
          chain.successfulSteps = chainEvent.successfulSteps || undefined;
          chain.failedSteps = chainEvent.failedSteps || undefined;
          chain.skippedSteps = chainEvent.skippedSteps || undefined;
          chain.summary = chainEvent.summary || undefined;
          await Promise.resolve(storage.addChain(event.sessionId, chain));
          console.log(`[API] Completed chain: ${chain.id} with status ${chain.status}`);

          // Clear active chain for spark animation (Phase 4)
          activeChainBySession.delete(event.sessionId);

          // Record chain completion for discovery (Phase 3)
          try {
            const discoveryService = getDiscoveryService();
            if (discoveryService) {
              await discoveryService.recordChainCompleted(event.sessionId, chainEvent.chainId);

              // Check if any regions became ready to reveal
              const { readyRegions } = await discoveryService.evaluateDiscovery(event.sessionId);

              // Broadcast WebSocket events for newly revealed regions
              if (readyRegions.length > 0) {
                // Get updated universe graph to get fog state
                const universe = await Promise.resolve(storage.getUniverseGraph());
                if (universe) {
                  for (const regionId of readyRegions) {
                    const region = universe.regions.find((r: any) => r.id === regionId);
                    if (region) {
                      broadcastRegionDiscovered(event.sessionId, regionId, region.fogState);
                      console.log(`[Discovery] Region ${regionId} revealed for session ${event.sessionId}`);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.warn('[Discovery] Failed to record chain completion:', error);
          }
        }
      }
    }

    // Update active step for file change attribution (step events always have sessionId)
    if (event.sessionId) {
      if (event.type === 'step:spawned' || event.type === 'step:started') {
        const stepEvent = event as any;
        if (stepEvent.stepNumber && stepEvent.action) {
          setActiveStep(event.sessionId, stepEvent.stepNumber, stepEvent.action);
          // Track step progress activity
          activityTracker.trackActivity(event.sessionId, 'step_progress');

          // Start spark animation for chain execution visualization (Phase 4)
          if (event.type === 'step:started' && stepEvent.action) {
            try {
              const sparkBroadcaster = getSparkBroadcaster();
              const chainId = activeChainBySession.get(event.sessionId);

              if (chainId) {
                const chain = await Promise.resolve(storage.getChain(chainId as any));

                if (chain) {
                  // Find current step and previous step
                  const currentStepIndex = chain.steps.findIndex(
                    (s) => s.stepNumber === stepEvent.stepNumber
                  );

                  if (currentStepIndex > 0) {
                    // Get previous completed step
                    const previousStep = chain.steps[currentStepIndex - 1];

                    // Start spark from previous step to current step
                    sparkBroadcaster.startSpark(
                      chain.id,
                      event.sessionId,
                      previousStep.action,
                      stepEvent.action,
                      3000 // 3 second default animation duration
                    );
                  }
                }
              }
            } catch (error) {
              console.warn('[SparkBroadcaster] Failed to start spark animation:', error);
            }
          }
        }
      } else if (event.type === 'step:completed' || event.type === 'step:failed') {
        clearActiveStep(event.sessionId);
        // Track step progress activity
        activityTracker.trackActivity(event.sessionId, 'step_progress');

        // Complete spark animation for chain execution visualization (Phase 4)
        const chainId = activeChainBySession.get(event.sessionId);
        if (chainId) {
          try {
            const sparkBroadcaster = getSparkBroadcaster();
            sparkBroadcaster.completeSpark(chainId as any);
          } catch (error) {
            console.warn('[SparkBroadcaster] Failed to complete spark animation:', error);
          }
        }

        // Record error for discovery when step fails (Phase 3)
        if (event.type === 'step:failed') {
          try {
            const discoveryService = getDiscoveryService();
            if (discoveryService) {
              await discoveryService.recordError(event.sessionId);
            }
          } catch (error) {
            console.warn('[Discovery] Failed to record step failure:', error);
          }
        }
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
