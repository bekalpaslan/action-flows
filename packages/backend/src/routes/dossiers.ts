import express, { Router } from 'express';
import type { IntelDossier, DossierId } from '@afw/shared';
import { createDossierId } from '@afw/shared';
import { storage } from '../storage/index.js';
import { validateBody } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import {
  createDossierSchema,
  updateDossierSchema,
  triggerAnalysisSchema,
} from '../schemas/api.js';

const router = Router();

// Broadcast function (set by index.ts)
let broadcastDossierEvent: ((
  eventType: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: any
) => void) | null = null;

export function setBroadcastDossierFunction(fn: (
  eventType: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: any
) => void) {
  broadcastDossierEvent = fn;
}

/**
 * POST /api/dossiers
 * Create a new intel dossier
 */
router.post('/', writeLimiter, validateBody(createDossierSchema), async (req, res) => {
  try {
    const { name, targets, context } = req.body;

    const now = new Date().toISOString();
    const dossier: IntelDossier = {
      id: createDossierId(),
      name,
      targets,
      context: context || '',
      createdAt: now,
      updatedAt: now,
      analysisCount: 0,
      status: 'idle',
      layoutDescriptor: null,
      history: [],
      error: null,
    };

    await Promise.resolve(storage.setDossier(dossier));

    console.log(`[API] Dossier created: ${dossier.id}`);

    // Broadcast creation event
    if (broadcastDossierEvent) {
      broadcastDossierEvent('dossier:created', dossier.id, { dossierId: dossier.id, name: dossier.name });
    }

    res.status(201).json(dossier);
  } catch (error) {
    console.error('[API] Error creating dossier:', error);
    res.status(500).json({
      error: 'Failed to create dossier',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/dossiers
 * List all dossiers
 */
router.get('/', async (req, res) => {
  try {
    const dossiers = await Promise.resolve(storage.listDossiers());

    res.json({
      count: dossiers.length,
      dossiers,
    });
  } catch (error) {
    console.error('[API] Error listing dossiers:', error);
    res.status(500).json({
      error: 'Failed to list dossiers',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/dossiers/:id
 * Get dossier by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dossier = await Promise.resolve(storage.getDossier(id));

    if (!dossier) {
      return res.status(404).json({
        error: 'Dossier not found',
        dossierId: id,
      });
    }

    res.json(dossier);
  } catch (error) {
    console.error('[API] Error fetching dossier:', error);
    res.status(500).json({
      error: 'Failed to fetch dossier',
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/dossiers/:id
 * Update dossier metadata (name, targets, context)
 */
router.put('/:id', writeLimiter, validateBody(updateDossierSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targets, context } = req.body;

    const dossier = await Promise.resolve(storage.getDossier(id));

    if (!dossier) {
      return res.status(404).json({
        error: 'Dossier not found',
        dossierId: id,
      });
    }

    // Update fields
    if (name !== undefined) dossier.name = name;
    if (targets !== undefined) dossier.targets = targets;
    if (context !== undefined) dossier.context = context;

    dossier.updatedAt = new Date().toISOString();

    await Promise.resolve(storage.setDossier(dossier));

    console.log(`[API] Dossier updated: ${id}`);

    // Broadcast update event
    if (broadcastDossierEvent) {
      broadcastDossierEvent('dossier:updated', id, { dossierId: id });
    }

    res.json(dossier);
  } catch (error) {
    console.error('[API] Error updating dossier:', error);
    res.status(500).json({
      error: 'Failed to update dossier',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/dossiers/:id
 * Delete a dossier
 */
router.delete('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Promise.resolve(storage.deleteDossier(id));

    if (!deleted) {
      return res.status(404).json({
        error: 'Dossier not found',
        dossierId: id,
      });
    }

    console.log(`[API] Dossier deleted: ${id}`);

    // Broadcast delete event
    if (broadcastDossierEvent) {
      broadcastDossierEvent('dossier:deleted', id, { dossierId: id });
    }

    res.json({
      success: true,
      dossierId: id,
    });
  } catch (error) {
    console.error('[API] Error deleting dossier:', error);
    res.status(500).json({
      error: 'Failed to delete dossier',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/dossiers/:id/history
 * Get dossier history entries
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const dossier = await Promise.resolve(storage.getDossier(id));

    if (!dossier) {
      return res.status(404).json({
        error: 'Dossier not found',
        dossierId: id,
      });
    }

    res.json({
      dossierId: id,
      count: dossier.history.length,
      history: dossier.history,
    });
  } catch (error) {
    console.error('[API] Error fetching dossier history:', error);
    res.status(500).json({
      error: 'Failed to fetch dossier history',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/dossiers/:id/analyze
 * Trigger analysis for a dossier
 * Phase 1: Just marks status as 'analyzing' and returns 202 Accepted
 * No actual agent spawning in Phase 1
 */
router.post('/:id/analyze', writeLimiter, validateBody(triggerAnalysisSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.body;

    const dossier = await Promise.resolve(storage.getDossier(id));

    if (!dossier) {
      return res.status(404).json({
        error: 'Dossier not found',
        dossierId: id,
      });
    }

    // Check if already analyzing
    if (dossier.status === 'analyzing' && !force) {
      return res.status(409).json({
        error: 'Dossier is already being analyzed',
        dossierId: id,
        status: dossier.status,
      });
    }

    // Update dossier state
    dossier.status = 'analyzing';
    dossier.updatedAt = new Date().toISOString();
    dossier.analysisCount += 1;
    dossier.error = null;

    await Promise.resolve(storage.setDossier(dossier));

    console.log(`[API] Dossier analysis triggered: ${id} (count: ${dossier.analysisCount})`);

    // Broadcast analyzing event
    if (broadcastDossierEvent) {
      broadcastDossierEvent('dossier:analyzing', id, { dossierId: id, status: 'analyzing' });
    }

    // Phase 1: Just return 202 Accepted
    // Phase 2 will spawn agents and update layout
    res.status(202).json({
      success: true,
      dossierId: id,
      status: 'analyzing',
      analysisCount: dossier.analysisCount,
      message: 'Analysis queued (Phase 1: status update only)',
    });
  } catch (error) {
    console.error('[API] Error triggering dossier analysis:', error);
    res.status(500).json({
      error: 'Failed to trigger analysis',
      message: sanitizeError(error),
    });
  }
});

export default router;
