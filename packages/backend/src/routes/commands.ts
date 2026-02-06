import express, { Router } from 'express';
import type { SessionId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage';

const router = Router();

/**
 * POST /api/sessions/:id/commands
 * Queue a command for a session (from Dashboard)
 */
router.post('/:id/commands', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, payload } = req.body;

    const session = await Promise.resolve(storage.getSession(id as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId: id,
      });
    }

    // Validate command type
    const validTypes = ['pause', 'resume', 'cancel', 'abort', 'retry', 'skip'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid command type',
        validTypes,
        received: type,
      });
    }

    const command = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload: payload || {},
      timestamp: brandedTypes.currentTimestamp(),
    };

    await Promise.resolve(storage.queueCommand(id as SessionId, command));

    console.log(`[API] Command queued for session ${id}:`, type);

    res.status(201).json({
      success: true,
      sessionId: id,
      commandId: command.id,
      command,
    });
  } catch (error) {
    console.error('[API] Error queueing command:', error);
    res.status(500).json({
      error: 'Failed to queue command',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sessions/:id/commands
 * Get pending commands for a session (hook polling endpoint)
 */
router.get('/:id/commands', async (req, res) => {
  try {
    const { id } = req.params;
    const commands = await Promise.resolve(storage.getCommands(id as SessionId));

    res.json({
      sessionId: id,
      count: commands.length,
      commands,
    });
  } catch (error) {
    console.error('[API] Error fetching commands:', error);
    res.status(500).json({
      error: 'Failed to fetch commands',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/commands/:commandId/ack
 * Acknowledge that a command was received and processed
 */
router.post('/:commandId/ack', (req, res) => {
  try {
    const { commandId } = req.params;
    const { result, error } = req.body;

    console.log(`[API] Command acknowledged: ${commandId}`, { result, error });

    res.json({
      success: true,
      commandId,
      acknowledged: true,
    });
  } catch (error) {
    console.error('[API] Error acknowledging command:', error);
    res.status(500).json({
      error: 'Failed to acknowledge command',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
