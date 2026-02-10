/**
 * Reminder API Routes
 * Handles reminder definitions (via registry) and reminder instances
 */

import { Router } from 'express';
import { z } from 'zod';
import type { ReminderInstance, SessionId, ChainId, Timestamp } from '@afw/shared';
import { storage } from '../storage/index.js';
import { registryStorage } from '../services/registryStorage.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const createReminderInstanceSchema = z.object({
  reminderId: z.string().min(1),
  sessionId: z.string(),
  chainId: z.string().nullable(),
  reminderText: z.string().min(1),
  variant: z.enum(['double-check', 'remind-approve', 'remind-restart', 'remind-generic']),
});

const markAddressedSchema = z.object({
  addressed: z.boolean(),
});

// ============================================================================
// Reminder Definition Endpoints (via Registry)
// ============================================================================

/**
 * GET /api/reminders/definitions
 * List all reminder definitions (fetches from registry)
 */
router.get('/definitions', async (req, res) => {
  try {
    // Fetch all registry entries with type: 'reminder'
    const allEntries = await registryStorage.listEntries();
    const reminderEntries = allEntries.filter((entry) => entry.type === 'reminder' && entry.enabled);

    // Extract the reminder definitions from the data union
    const definitions = reminderEntries.map((entry) => {
      if (entry.data.type === 'reminder') {
        return {
          id: entry.id,
          ...entry.data.definition,
        };
      }
      return null;
    }).filter(Boolean);

    res.json(definitions);
  } catch (error) {
    console.error('[Reminders] Error fetching definitions:', error);
    res.status(500).json({ error: 'Failed to fetch reminder definitions' });
  }
});

/**
 * POST /api/reminders/definitions
 * Create new reminder definition (delegates to registry API)
 * Note: Clients should use POST /api/registry/entries with type: 'reminder'
 */
router.post('/definitions', (req, res) => {
  res.status(400).json({
    error: 'Use POST /api/registry/entries to create reminder definitions',
    hint: 'Set type: "reminder" and data: { type: "reminder", definition: {...} }',
  });
});

/**
 * DELETE /api/reminders/definitions/:id
 * Delete reminder definition (delegates to registry API)
 */
router.delete('/definitions/:id', (req, res) => {
  res.status(400).json({
    error: 'Use DELETE /api/registry/entries/:id to delete reminder definitions',
  });
});

// ============================================================================
// Reminder Instance Endpoints
// ============================================================================

/**
 * GET /api/reminders/instances/:sessionId
 * Get all reminder instances for a session
 * Query param: chainId (optional)
 */
router.get('/instances/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { chainId } = req.query;

    const validChainId = typeof chainId === 'string' ? chainId as ChainId : undefined;

    const instances = await storage.getReminderInstances(
      sessionId as SessionId,
      validChainId
    );

    res.json(instances);
  } catch (error) {
    console.error('[Reminders] Error fetching instances:', error);
    res.status(500).json({ error: 'Failed to fetch reminder instances' });
  }
});

/**
 * POST /api/reminders/instances
 * Create a new reminder instance (attach reminder to chain)
 * Body: { reminderId, sessionId, chainId?, reminderText, variant }
 */
router.post('/instances', async (req, res) => {
  try {
    const body = createReminderInstanceSchema.parse(req.body);

    const instance: ReminderInstance = {
      id: `reminder-inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reminderId: body.reminderId,
      sessionId: body.sessionId as SessionId,
      chainId: body.chainId as ChainId | null,
      reminderText: body.reminderText,
      createdAt: new Date().toISOString() as Timestamp,
      addressed: false,
      metadata: {
        variant: body.variant,
      },
    };

    await storage.addReminderInstance(instance);

    res.status(201).json(instance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    } else {
      console.error('[Reminders] Error creating instance:', error);
      res.status(500).json({ error: 'Failed to create reminder instance' });
    }
  }
});

/**
 * PATCH /api/reminders/instances/:id
 * Mark a reminder instance as addressed
 * Body: { addressed: boolean }
 */
router.patch('/instances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = markAddressedSchema.parse(req.body);

    const success = await storage.markReminderAddressed(id);

    if (!success) {
      res.status(404).json({ error: 'Reminder instance not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    } else {
      console.error('[Reminders] Error marking addressed:', error);
      res.status(500).json({ error: 'Failed to mark reminder as addressed' });
    }
  }
});

/**
 * DELETE /api/reminders/instances/:id
 * Delete a reminder instance
 */
router.delete('/instances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteReminderInstance(id);

    if (!success) {
      res.status(404).json({ error: 'Reminder instance not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Reminders] Error deleting instance:', error);
    res.status(500).json({ error: 'Failed to delete reminder instance' });
  }
});

/**
 * POST /api/reminders/instances/chain/:chainId/mark-addressed
 * Mark all reminders for a chain as addressed (called on chain completion)
 */
router.post('/instances/chain/:chainId/mark-addressed', async (req, res) => {
  try {
    const { chainId } = req.params;
    const count = await storage.markChainRemindersAddressed(chainId as ChainId);

    res.json({ count });
  } catch (error) {
    console.error('[Reminders] Error marking chain reminders addressed:', error);
    res.status(500).json({ error: 'Failed to mark reminders as addressed' });
  }
});

export default router;
