import express, { Router } from 'express';
import type { Session, Chain, SessionId } from '@afw/shared';
import { brandedTypes, Status } from '@afw/shared';
import { storage } from '../storage/index.js';
import { filePersistence } from '../storage/file-persistence.js';
import { startWatching, stopWatching } from '../services/fileWatcher.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Validation and rate limiting (Agent A)
import { validateBody } from '../middleware/validate.js';
import {
  createSessionSchema,
  updateSessionSchema,
  sessionInputSchema,
  sessionAwaitingSchema,
} from '../schemas/api.js';
import { writeLimiter, sessionCreateLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * Sensitive system directories that should not be accessible
 * Includes common Unix and Windows system paths (Fix 5)
 */
const DENIED_PATHS = [
  // Unix system directories
  '/etc',
  '/sys',
  '/proc',
  '/dev',
  '/root',
  '/boot',
  '/bin',
  '/sbin',
  '/usr/bin',
  '/usr/sbin',
  '/usr/local/bin',
  '/lib',
  '/lib64',
  '/usr/lib',
  '/var/log',
  '/var/www',

  // Windows system directories
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  'C:\\System Volume Information',
  'C:\\$Recycle.Bin',
];

/**
 * Check if a path is in the denied list
 */
function isPathDenied(filePath: string): boolean {
  const normalizedPath = path.resolve(filePath).toLowerCase();

  return DENIED_PATHS.some(deniedPath => {
    const normalizedDenied = path.resolve(deniedPath).toLowerCase();
    // Check if the path starts with a denied directory
    return normalizedPath.startsWith(normalizedDenied) &&
           (normalizedPath.length === normalizedDenied.length ||
            normalizedPath[normalizedDenied.length] === path.sep);
  });
}

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', sessionCreateLimiter, validateBody(createSessionSchema), async (req, res) => {
  try {
    const { cwd, hostname, platform, userId } = req.body;

    // Validate that directory exists (Agent A security fix)
    try {
      const stat = await fs.stat(cwd);
      if (!stat.isDirectory()) {
        return res.status(400).json({ error: 'cwd must be a directory' });
      }
    } catch {
      return res.status(400).json({ error: 'cwd directory does not exist or is not accessible' });
    }

    // Check if cwd is a sensitive system directory (Fix 5)
    if (isPathDenied(cwd)) {
      return res.status(403).json({
        error: 'Access denied: system directory is protected',
        cwd,
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

    // Start file watching for this session
    try {
      await startWatching(session.id, cwd);
      console.log(`[API] Session created: ${session.id} (file watching enabled)`);
    } catch (error) {
      console.error(`[API] Failed to start file watching for session ${session.id}:`, error);
      // Don't fail session creation if file watching fails
    }

    res.status(201).json(session);
  } catch (error) {
    console.error('[API] Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: sanitizeError(error),
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
        // cwd omitted from list response for security (Agent A)
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
      message: sanitizeError(error),
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
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/sessions/:id
 * Update session (e.g., status, summary)
 */
router.put('/:id', writeLimiter, validateBody(updateSessionSchema), async (req, res) => {
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

      // Stop file watching for this session
      try {
        await stopWatching(id as SessionId);
        console.log(`[API] File watching stopped for session ${id}`);
      } catch (error) {
        console.error(`[API] Error stopping file watching for session ${id}:`, error);
      }

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
      message: sanitizeError(error),
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
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/sessions/:id/input
 * Submit user input for a session (from Dashboard)
 */
router.post('/:id/input', writeLimiter, validateBody(sessionInputSchema), async (req, res) => {
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
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/sessions/:id/awaiting
 * Mark session as awaiting input (called by Stop hook)
 */
router.post('/:id/awaiting', writeLimiter, validateBody(sessionAwaitingSchema), async (req, res) => {
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
      message: sanitizeError(error),
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
    // Cap timeout at 60 seconds (Agent A security fix)
    const timeout = Math.min(parseInt(req.query.timeout as string) || 0, 60000);

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
        res.json({
          available: false,
          sessionId: id,
          timedOut: true,
        });
        return;
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

        res.json({
          available: true,
          input: inputs[0],
          sessionId: id,
        });
        return;
      }

      // Continue polling
      setTimeout(() => poll(), pollInterval);
    };

    await poll();
  } catch (error) {
    console.error('[API] Error fetching input:', error);
    res.status(500).json({
      error: 'Failed to fetch input',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/users
 * Get list of active users with session counts
 */
router.get('/users', (req, res) => {
  try {
    const users = storage.getUsersWithActiveSessions?.() || [];

    const userStats = users.map((userId: string) => {
      const sessionIds = storage.getSessionsByUser?.(userId as any) || [];
      const sessions = (sessionIds
        .map((id: string) => storage.getSession(id as SessionId)) as any[])
        .filter((s: any): s is Session => s !== undefined && typeof s === 'object' && 'id' in s);

      return {
        user: userId,
        sessionCount: sessions.length,
        sessions: sessions.map((s: Session) => ({
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
      message: sanitizeError(error),
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
    const sessionIds = storage.getSessionsByUser?.(userId as any) || [];
    const sessions = (sessionIds
      .map((id: string) => storage.getSession(id as SessionId)) as any[])
      .filter((s: any): s is Session => s !== undefined && typeof s === 'object' && 'id' in s);

    res.json({
      user: userId,
      sessionCount: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('[API] Error fetching user sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch user sessions',
      message: sanitizeError(error),
    });
  }
});

export default router;
