/**
 * Error Announcement API Routes
 * Handles real-time error notifications with recovery actions
 * Implements Format 6.1 from CONTRACT.md
 */

import { Router } from 'express';
import { z } from 'zod';
import type { ErrorInstance, SessionId, ChainId, StepNumber, Timestamp, ErrorSeverity, ErrorRecoveryAction } from '@afw/shared';
import { storage } from '../storage/index.js';
import { broadcastEvent } from '../ws/handler.js';
import { clientRegistry } from '../ws/clientRegistry.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const createErrorSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  context: z.string().min(1).max(500),
  stackTrace: z.string().max(5000).nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('high'),
  stepNumber: z.number().int().optional().nullable(),
  action: z.string().optional().nullable(),
  sessionId: z.string().min(1),
  chainId: z.string().optional().nullable(),
  recoveryOptions: z.array(z.enum(['retry', 'skip', 'cancel'])).optional().default(['retry', 'skip', 'cancel']),
  metadata: z.record(z.unknown()).optional(),
});

const dismissErrorSchema = z.object({
  dismissed: z.boolean(),
});

const handleRecoverySchema = z.object({
  action: z.enum(['retry', 'skip', 'cancel']),
});

// ============================================================================
// Error Instance Endpoints
// ============================================================================

/**
 * GET /api/errors/:sessionId
 * Get all errors for a session
 * Query param: chainId (optional), unread (optional boolean)
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { chainId, unread } = req.query;

    const validChainId = typeof chainId === 'string' ? (chainId as ChainId) : undefined;
    const showUnreadOnly = unread === 'true';

    const errors = await storage.getErrors(sessionId as SessionId, {
      chainId: validChainId,
      dismissedOnly: false,
    });

    const filtered = showUnreadOnly ? errors.filter(e => !e.dismissed) : errors;

    res.json(filtered);
  } catch (error) {
    console.error('[Errors] Error fetching errors:', error);
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

/**
 * POST /api/errors
 * Create a new error announcement
 * Body: { title, message, context, stackTrace?, severity?, stepNumber?, action?, sessionId, chainId?, recoveryOptions?, metadata? }
 */
router.post('/', async (req, res) => {
  try {
    const body = createErrorSchema.parse(req.body);

    const errorInstance: ErrorInstance = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: body.title,
      message: body.message,
      context: body.context,
      stackTrace: body.stackTrace ?? null,
      severity: body.severity as ErrorSeverity,
      stepNumber: body.stepNumber as StepNumber | undefined,
      action: body.action,
      sessionId: body.sessionId as SessionId,
      chainId: body.chainId as ChainId | undefined,
      createdAt: new Date().toISOString() as Timestamp,
      recoveryOptions: body.recoveryOptions as ErrorRecoveryAction[],
      dismissed: false,
      metadata: body.metadata,
    };

    await storage.addError(errorInstance);

    // Broadcast error event to all connected clients for this session
    const clients = clientRegistry.getClientsForSession(errorInstance.sessionId);
    broadcastEvent(
      clients,
      {
        type: 'error:occurred',
        timestamp: new Date().toISOString() as Timestamp,
        sessionId: errorInstance.sessionId,
        error: errorInstance.title,
        stepNumber: errorInstance.stepNumber,
        severity: errorInstance.severity,
        context: { errorId: errorInstance.id },
        recoverable: errorInstance.recoveryOptions.length > 0,
        affectsChain: !!errorInstance.chainId,
      },
      errorInstance.sessionId
    );

    res.status(201).json(errorInstance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    }

    console.error('[Errors] Error creating error instance:', error);
    res.status(500).json({ error: 'Failed to create error instance' });
  }
});

/**
 * PATCH /api/errors/:id
 * Update error (dismiss, handle recovery)
 * Body: { dismissed?: boolean } OR { action?: 'retry' | 'skip' | 'cancel' }
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dismissed, action } = req.body;

    if (dismissed !== undefined) {
      const bodySchema = dismissErrorSchema.parse({ dismissed });
      const success = await storage.dismissError(id, bodySchema.dismissed);

      if (!success) {
        return res.status(404).json({ error: 'Error instance not found' });
      }

      res.json({ success: true });
    } else if (action !== undefined) {
      const bodySchema = handleRecoverySchema.parse({ action });

      // Mark as dismissed after recovery action
      await storage.dismissError(id, true);

      // Broadcast recovery action (can be consumed by orchestrator)
      // TODO: Implement recovery action handling in orchestrator
      res.json({
        success: true,
        action: bodySchema.action,
        message: `Recovery action '${bodySchema.action}' recorded`,
      });
    } else {
      res.status(400).json({ error: 'Provide either dismissed or action in request body' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    }

    console.error('[Errors] Error updating error:', error);
    res.status(500).json({ error: 'Failed to update error' });
  }
});

/**
 * DELETE /api/errors/:id
 * Delete an error instance (hard delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteError(id);

    if (!success) {
      return res.status(404).json({ error: 'Error instance not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Errors] Error deleting error:', error);
    res.status(500).json({ error: 'Failed to delete error' });
  }
});

/**
 * DELETE /api/errors/chain/:chainId
 * Delete all errors for a chain
 */
router.delete('/chain/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    const count = await storage.deleteChainErrors(chainId as ChainId);

    res.json({ deleted: count });
  } catch (error) {
    console.error('[Errors] Error deleting chain errors:', error);
    res.status(500).json({ error: 'Failed to delete chain errors' });
  }
});

export default router;
