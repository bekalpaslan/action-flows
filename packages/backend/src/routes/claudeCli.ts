/**
 * Claude CLI API Routes
 * Handles Claude Code CLI session control (start, input, stop, status)
 */

import { Router, type Request, type Response } from 'express';
import type { SessionId } from '@afw/shared';
import { claudeCliManager } from '../services/claudeCliManager.js';
import { validateBody } from '../middleware/validate.js';
import { claudeCliStartSchema, claudeCliInputSchema, claudeCliStopSchema } from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * POST /api/claude-cli/start
 * Start a new Claude CLI session
 */
router.post('/start', writeLimiter, validateBody(claudeCliStartSchema), async (req: Request, res: Response) => {
  const { sessionId, cwd, prompt, flags } = req.body;

  try {
    const session = await claudeCliManager.startSession(
      sessionId as SessionId,
      cwd,
      prompt,
      flags
    );

    const info = session.getInfo();
    res.status(200).json({
      success: true,
      session: info,
    });
  } catch (error) {
    console.error('[ClaudeCli] Error starting session:', error);
    const message = error instanceof Error ? error.message : 'Failed to start Claude CLI session';
    res.status(500).json({
      error: message,
    });
  }
});

/**
 * POST /api/claude-cli/:sessionId/input
 * Send input to Claude CLI stdin
 */
router.post('/:sessionId/input', writeLimiter, validateBody(claudeCliInputSchema), (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { input } = req.body;

  try {
    const session = claudeCliManager.getSession(sessionId as SessionId);
    if (!session) {
      return res.status(404).json({ error: 'Claude CLI session not found' });
    }

    session.sendInput(input);

    res.status(200).json({
      success: true,
      message: 'Input sent to Claude CLI',
    });
  } catch (error) {
    console.error('[ClaudeCli] Error sending input:', error);
    const message = error instanceof Error ? error.message : 'Failed to send input';
    res.status(500).json({
      error: message,
    });
  }
});

/**
 * POST /api/claude-cli/:sessionId/stop
 * Stop a Claude CLI session
 */
router.post('/:sessionId/stop', writeLimiter, validateBody(claudeCliStopSchema), (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { signal } = req.body;

  try {
    const stopped = claudeCliManager.stopSession(
      sessionId as SessionId,
      signal as NodeJS.Signals || 'SIGTERM'
    );

    if (!stopped) {
      return res.status(404).json({ error: 'Claude CLI session not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Claude CLI session stopped',
    });
  } catch (error) {
    console.error('[ClaudeCli] Error stopping session:', error);
    const message = error instanceof Error ? error.message : 'Failed to stop session';
    res.status(500).json({
      error: message,
    });
  }
});

/**
 * GET /api/claude-cli/:sessionId/status
 * Get status of a Claude CLI session
 */
router.get('/:sessionId/status', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  try {
    const session = claudeCliManager.getSession(sessionId as SessionId);
    if (!session) {
      return res.status(404).json({ error: 'Claude CLI session not found' });
    }

    const info = session.getInfo();
    const uptime = info.startedAt && !info.endedAt
      ? Date.now() - new Date(info.startedAt).getTime()
      : 0;

    res.json({
      session: info,
      uptime,
      isRunning: session.isRunning(),
    });
  } catch (error) {
    console.error('[ClaudeCli] Error getting status:', error);
    const message = error instanceof Error ? error.message : 'Failed to get session status';
    res.status(500).json({
      error: message,
    });
  }
});

/**
 * GET /api/claude-cli/sessions
 * List all active Claude CLI sessions
 */
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessionIds = claudeCliManager.listSessions();
    const sessions = sessionIds.map(id => {
      const session = claudeCliManager.getSession(id);
      return session ? session.getInfo() : null;
    }).filter(Boolean);

    res.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('[ClaudeCli] Error listing sessions:', error);
    const message = error instanceof Error ? error.message : 'Failed to list sessions';
    res.status(500).json({
      error: message,
    });
  }
});

export default router;
