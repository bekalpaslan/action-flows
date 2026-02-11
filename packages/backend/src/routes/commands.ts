import express, { Router } from 'express';
import type { SessionId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage/index.js';

// Validation and rate limiting (Agent A)
import { validateBody } from '../middleware/validate.js';
import { createCommandSchema, ackCommandSchema } from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';

// Discovery service for activity recording (Phase 3)
import { getDiscoveryService } from '../services/discoveryService.js';

const router = Router();

/**
 * POST /api/sessions/:id/commands
 * Queue a command for a session (from Dashboard)
 */
router.post('/:id/commands', writeLimiter, validateBody(createCommandSchema), async (req, res) => {
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

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const commandPayload = {
      commandId,
      command: {
        type,
        payload: payload || {},
      },
      issuedAt: brandedTypes.currentTimestamp(),
    };

    await Promise.resolve(storage.queueCommand(id as SessionId, commandPayload as any));

    console.log(`[API] Command queued for session ${id}:`, type);

    // Record interaction for discovery (Phase 3)
    try {
      const discoveryService = getDiscoveryService();
      if (discoveryService) {
        await discoveryService.recordInteraction(id as SessionId, 'command-submitted');
      }
    } catch (error) {
      // Don't fail command if discovery recording fails
      console.warn('[Discovery] Failed to record interaction:', error);
    }

    res.status(201).json({
      success: true,
      sessionId: id,
      commandId,
      command: commandPayload,
    });
  } catch (error) {
    console.error('[API] Error queueing command:', error);
    res.status(500).json({
      error: 'Failed to queue command',
      message: sanitizeError(error),
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
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/commands/:commandId/ack
 * Acknowledge that a command was received and processed
 */
router.post('/:commandId/ack', validateBody(ackCommandSchema), (req, res) => {
  try {
    const { commandId } = req.params;
    const { result, error } = req.body;

    // Log without user input (Agent A security fix - sanitize log output)
    console.log(`[API] Command acknowledged: ${commandId}`);

    res.json({
      success: true,
      commandId,
      acknowledged: true,
    });
  } catch (error) {
    console.error('[API] Error acknowledging command:', error);
    res.status(500).json({
      error: 'Failed to acknowledge command',
      message: sanitizeError(error),
    });
  }
});

export default router;
