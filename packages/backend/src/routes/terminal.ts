/**
 * Terminal API Routes
 * Handles terminal output posting and retrieval
 */

import { Router, type Request, type Response } from 'express';
import type { SessionId, StepNumber, TerminalOutputEvent } from '@afw/shared';
import { terminalBuffer } from '../services/terminalBuffer.js';

// Validation and rate limiting (Agent A)
import { validateBody } from '../middleware/validate.js';
import { terminalOutputSchema } from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Broadcast function (set by index.ts)
let broadcastTerminalEvent: ((sessionId: SessionId, event: TerminalOutputEvent) => void) | null = null;

export function setBroadcastTerminalFunction(fn: (sessionId: SessionId, event: TerminalOutputEvent) => void) {
  broadcastTerminalEvent = fn;
}

/**
 * POST /api/terminal/:sessionId/output
 * Hook posts terminal output here
 */
router.post('/:sessionId/output', writeLimiter, validateBody(terminalOutputSchema), (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { output, stream, stepNumber, action } = req.body;

  try {
    // Append to buffer
    terminalBuffer.append(
      sessionId as SessionId,
      output,
      stream as 'stdout' | 'stderr',
      stepNumber ? parseInt(stepNumber, 10) as StepNumber : undefined,
      action
    );

    // Create event for WebSocket broadcast
    const event: TerminalOutputEvent = {
      type: 'terminal:output',
      sessionId: sessionId as SessionId,
      output,
      stream: stream as 'stdout' | 'stderr',
      timestamp: new Date().toISOString() as any,
      stepNumber: stepNumber ? parseInt(stepNumber, 10) as StepNumber : undefined,
      action,
    };

    // Broadcast to WebSocket clients
    if (broadcastTerminalEvent) {
      broadcastTerminalEvent(sessionId as SessionId, event);
    }

    res.status(200).json({
      success: true,
      buffered: terminalBuffer.getBufferSize(sessionId as SessionId),
    });
  } catch (error) {
    console.error('[Terminal] Error posting output:', error);
    res.status(500).json({ error: 'Failed to post terminal output' });
  }
});

/**
 * GET /api/terminal/:sessionId/buffer
 * Get recent terminal output for a session
 */
router.get('/:sessionId/buffer', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;

  try {
    const buffer = terminalBuffer.getRecentBuffer(sessionId as SessionId, limit);
    const totalSize = terminalBuffer.getBufferSize(sessionId as SessionId);

    res.json({
      sessionId,
      buffer,
      totalSize,
      returned: buffer.length,
      truncated: buffer.length < totalSize,
    });
  } catch (error) {
    console.error('[Terminal] Error retrieving buffer:', error);
    res.status(500).json({ error: 'Failed to retrieve terminal buffer' });
  }
});

/**
 * DELETE /api/terminal/:sessionId/buffer
 * Clear terminal buffer for a session
 */
router.delete('/:sessionId/buffer', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  try {
    const previousSize = terminalBuffer.getBufferSize(sessionId as SessionId);
    terminalBuffer.clear(sessionId as SessionId);

    res.json({
      sessionId,
      clearedLines: previousSize,
    });
  } catch (error) {
    console.error('[Terminal] Error clearing buffer:', error);
    res.status(500).json({ error: 'Failed to clear terminal buffer' });
  }
});

export default router;
