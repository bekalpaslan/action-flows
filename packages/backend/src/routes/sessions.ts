import express, { Router } from 'express';
import type { Session, Chain, SessionId } from '@afw/shared';
import { brandedTypes, Status } from '@afw/shared';
import { storage } from '../storage';
import { filePersistence } from '../storage/file-persistence';

const router = Router();

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', async (req, res) => {
  try {
    const { cwd, hostname, platform, userId } = req.body;

    if (!cwd) {
      return res.status(400).json({
        error: 'Missing required field: cwd',
      });
    }

    const session: Session = {
      id: brandedTypes.sessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
      cwd,
      hostname,
      platform,
      user: userId ? brandedTypes.userId(userId) : undefined,
      chains: [],
      status: 'pending',
      startedAt: brandedTypes.currentTimestamp(),
    };

    await Promise.resolve(storage.setSession(session));

    console.log(`[API] Session created: ${session.id}`);

    res.status(201).json(session);
  } catch (error) {
    console.error('[API] Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sessions
 * List all active sessions
 */
router.get('/', (req, res) => {
  try {
    // For memory storage, we can list all sessions
    // For Redis, we'd need to scan keys - for now return empty for Redis
    const sessions = storage.sessions ? Array.from(storage.sessions.values()) : [];

    res.json({
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        cwd: s.cwd,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        chainsCount: s.chains.length,
      })),
      note: storage.sessions ? undefined : 'Full session listing not available with Redis storage',
    });
  } catch (error) {
    console.error('[API] Error listing sessions:', error);
    res.status(500).json({
      error: 'Failed to list sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sessions/:id
 * Get session details with chains and steps
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    // Include detailed chain information
    const chains = await Promise.resolve(storage.getChains(id as SessionId));

    res.json({
      ...session,
      chains,
    });
  } catch (error) {
    console.error('[API] Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/sessions/:id
 * Update session (e.g., status, summary)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, summary, endReason } = req.body;

    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    // Update fields
    if (status) session.status = status;
    if (summary) session.summary = summary;
    if (endReason) session.endReason = endReason;

    if (status === 'completed' || status === 'failed') {
      session.endedAt = brandedTypes.currentTimestamp();

      // Persist session to file storage for history
      try {
        const events = await Promise.resolve(storage.getEvents(id as SessionId));
        await filePersistence.saveSession(id, session, events);
        console.log(`[API] Session persisted to history: ${id}`);
      } catch (error) {
        console.error(`[API] Error persisting session to history:`, error);
        // Don't fail the request if persistence fails
      }
    }

    await Promise.resolve(storage.setSession(session));

    console.log(`[API] Session updated: ${id}`, { status, summary, endReason });

    res.json(session);
  } catch (error) {
    console.error('[API] Error updating session:', error);
    res.status(500).json({
      error: 'Failed to update session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sessions/:id/chains
 * Get all chains in a session
 */
router.get('/:id/chains', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    const chains = await Promise.resolve(storage.getChains(id as SessionId));

    res.json({
      sessionId: id,
      count: chains.length,
      chains,
    });
  } catch (error) {
    console.error('[API] Error fetching chains:', error);
    res.status(500).json({
      error: 'Failed to fetch chains',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sessions/:id/input
 * Submit user input for a session (from Dashboard)
 */
router.post('/:id/input', async (req, res) => {
  try {
    const { id } = req.params;
    const { input, prompt } = req.body;

    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    const inputPayload = {
      timestamp: brandedTypes.currentTimestamp(),
      input,
      prompt,
    };

    await Promise.resolve(storage.queueInput(id as SessionId, inputPayload));

    console.log(`[API] Input queued for session ${id}`);

    res.status(201).json({
      success: true,
      sessionId: id,
      inputQueued: inputPayload,
    });
  } catch (error) {
    console.error('[API] Error queueing input:', error);
    res.status(500).json({
      error: 'Failed to queue input',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sessions/:id/awaiting
 * Mark session as awaiting input (called by Stop hook)
 */
router.post('/:id/awaiting', async (req, res) => {
  try {
    const { id } = req.params;
    const { promptType, promptText, quickResponses } = req.body;

    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    // Update session conversation state
    session.conversationState = 'awaiting_input';
    session.lastPrompt = {
      text: promptText || 'Awaiting input...',
      type: promptType || 'text',
      quickResponses,
      timestamp: brandedTypes.currentTimestamp(),
    };

    await Promise.resolve(storage.setSession(session));

    console.log(`[API] Session ${id} marked as awaiting input`);

    // TODO: Broadcast awaiting_input event via WebSocket

    res.json({
      status: 'awaiting',
      sessionId: id,
      conversationState: session.conversationState,
    });
  } catch (error) {
    console.error('[API] Error marking session as awaiting:', error);
    res.status(500).json({
      error: 'Failed to mark session as awaiting',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sessions/:id/input
 * Get pending input for a session (hook polling endpoint)
 * Supports long-polling with timeout parameter
 */
router.get('/:id/input', async (req, res) => {
  try {
    const { id } = req.params;
    const timeout = parseInt(req.query.timeout as string) || 0;

    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    // Function to check for input
    const checkInput = async (): Promise<any[] | null> => {
      const inputs = await Promise.resolve(storage.getInput(id as SessionId));
      return inputs.length > 0 ? inputs : null;
    };

    // If no timeout, return immediately
    if (timeout === 0) {
      const inputs = await checkInput();
      if (inputs) {
        // Clear the input from queue after retrieval
        await Promise.resolve(storage.clearInput(id as SessionId));

        // Update session state
        session.conversationState = 'idle';
        delete session.lastPrompt;
        await Promise.resolve(storage.setSession(session));

        return res.json({
          available: true,
          input: inputs[0],
          sessionId: id,
        });
      }

      return res.json({
        available: false,
        sessionId: id,
      });
    }

    // Long-polling with timeout
    const startTime = Date.now();
    const pollInterval = 500; // Poll every 500ms

    const poll = async (): Promise<void> => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= timeout) {
        return res.json({
          available: false,
          sessionId: id,
          timedOut: true,
        });
      }

      const inputs = await checkInput();

      if (inputs) {
        // Clear the input from queue after retrieval
        await Promise.resolve(storage.clearInput(id as SessionId));

        // Update session state
        session.conversationState = 'idle';
        delete session.lastPrompt;
        await Promise.resolve(storage.setSession(session));

        // TODO: Broadcast input_received event via WebSocket

        return res.json({
          available: true,
          input: inputs[0],
          sessionId: id,
        });
      }

      // Continue polling
      setTimeout(() => poll(), pollInterval);
    };

    await poll();
  } catch (error) {
    console.error('[API] Error fetching input:', error);
    res.status(500).json({
      error: 'Failed to fetch input',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users
 * Get list of active users with session counts
 */
router.get('/users', (req, res) => {
  try {
    const users = storage.getUsersWithActiveSessions();

    const userStats = users.map((userId) => {
      const sessionIds = storage.getSessionsByUser(userId);
      const sessions = sessionIds
        .map((id) => storage.getSession(id as SessionId))
        .filter((s) => s !== undefined) as Session[];

      return {
        user: userId,
        sessionCount: sessions.length,
        sessions: sessions.map((s) => ({
          id: s.id,
          status: s.status,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
        })),
      };
    });

    res.json({
      count: users.length,
      users: userStats,
    });
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:userId/sessions
 * Get all sessions for a specific user
 */
router.get('/users/:userId/sessions', (req, res) => {
  try {
    const { userId } = req.params;
    const sessionIds = storage.getSessionsByUser(userId);
    const sessions = sessionIds
      .map((id) => storage.getSession(id as SessionId))
      .filter((s) => s !== undefined) as Session[];

    res.json({
      user: userId,
      sessionCount: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('[API] Error fetching user sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch user sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
