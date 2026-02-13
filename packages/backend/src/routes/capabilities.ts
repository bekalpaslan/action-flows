/**
 * Capabilities REST API Routes
 * Implements REST endpoints for capability management and invocation
 * Part of Phase 1 Node Architecture (Thread 2)
 */

import { Router } from 'express';
import crypto from 'crypto';
import { capabilityRegistry } from '../services/capabilityRegistry.js';
import { toCapabilityId, type CapabilityInvocation } from '@afw/shared';

const router = Router();

/**
 * @swagger
 * /api/capabilities:
 *   get:
 *     summary: List all registered capabilities
 *     tags: [capabilities]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, degraded]
 *         description: Filter by status
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [dashboard, backend, external]
 *         description: Filter by provider
 *     responses:
 *       200:
 *         description: List of capabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 capabilities:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get('/', (req, res) => {
  try {
    const { status, provider } = req.query;

    const capabilities = capabilityRegistry.list({
      status: status as any,
      provider: provider as string | undefined,
    });

    res.json({ capabilities });
  } catch (error) {
    console.error('[Capabilities API] Error listing capabilities:', error);
    res.status(500).json({
      error: 'Failed to list capabilities',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @swagger
 * /api/capabilities/stats:
 *   get:
 *     summary: Get capability registry statistics
 *     tags: [capabilities]
 *     responses:
 *       200:
 *         description: Registry statistics
 *       500:
 *         description: Internal server error
 */
router.get('/stats', (req, res) => {
  try {
    const stats = capabilityRegistry.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[Capabilities API] Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @swagger
 * /api/capabilities/{capId}:
 *   get:
 *     summary: Get details of a specific capability
 *     tags: [capabilities]
 *     parameters:
 *       - in: path
 *         name: capId
 *         required: true
 *         schema:
 *           type: string
 *         description: Capability ID
 *     responses:
 *       200:
 *         description: Capability details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Capability not found
 *       500:
 *         description: Internal server error
 */
router.get('/:capId', (req, res) => {
  try {
    const capId = toCapabilityId(req.params.capId);
    const capability = capabilityRegistry.get(capId);

    if (!capability) {
      return res.status(404).json({
        error: 'Capability not found',
        capabilityId: capId,
      });
    }

    res.json(capability);
  } catch (error) {
    console.error('[Capabilities API] Error getting capability:', error);
    res.status(500).json({
      error: 'Failed to get capability',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @swagger
 * /api/capabilities/{capId}/invoke:
 *   post:
 *     summary: Invoke a capability via REST
 *     tags: [capabilities]
 *     parameters:
 *       - in: path
 *         name: capId
 *         required: true
 *         schema:
 *           type: string
 *         description: Capability ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inputs:
 *                 type: object
 *                 description: Input parameters for the capability
 *               timeout:
 *                 type: number
 *                 description: Timeout in milliseconds (default 30000)
 *     responses:
 *       200:
 *         description: Invocation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 capabilityId:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Capability not found
 *       502:
 *         description: Capability invocation failed
 *       500:
 *         description: Internal server error
 */
router.post('/:capId/invoke', async (req, res) => {
  try {
    const capId = toCapabilityId(req.params.capId);
    const { inputs = {}, timeout } = req.body;

    // Validate capability exists
    const capability = capabilityRegistry.get(capId);
    if (!capability) {
      return res.status(404).json({
        error: 'Capability not found',
        capabilityId: capId,
      });
    }

    // Check if capability is invokable
    if (!capability.invokable) {
      return res.status(400).json({
        error: 'Capability is not invokable',
        capabilityId: capId,
      });
    }

    // Create invocation
    const invocation: CapabilityInvocation = {
      capabilityId: capId,
      correlationId: crypto.randomUUID(),
      inputs,
      timeout: timeout ? Math.min(timeout, 120000) : undefined, // Cap at 2 minutes
    };

    console.log(`[Capabilities API] Invoking capability: ${capability.name} (${capId}) - correlation: ${invocation.correlationId}`);

    // Invoke and wait for result
    const result = await capabilityRegistry.invoke(invocation);

    res.json(result);
  } catch (error) {
    console.error('[Capabilities API] Error invoking capability:', error);

    // Check if it's a capability error (offline, timeout, etc.)
    if (error instanceof Error && error.message.includes('Capability')) {
      return res.status(502).json({
        error: 'Capability invocation failed',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to invoke capability',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
