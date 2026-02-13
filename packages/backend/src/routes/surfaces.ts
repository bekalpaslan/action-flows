/**
 * Surfaces REST API Routes
 * Manages connected surfaces and routing
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { Router } from 'express';
import { surfaceManager } from '../services/surfaceManager.js';
import type { SurfaceInput } from '@afw/shared';

const router = Router();

/**
 * @swagger
 * /api/surfaces:
 *   get:
 *     summary: List all connected surfaces
 *     tags: [surfaces]
 *     responses:
 *       200:
 *         description: List of connected surfaces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surfaces:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', (req, res) => {
  try {
    const surfaces = surfaceManager.list();
    res.json({ surfaces });
  } catch (error) {
    console.error('[Surfaces API] Error listing surfaces:', error);
    res.status(500).json({ error: 'Failed to list surfaces' });
  }
});

/**
 * @swagger
 * /api/surfaces/{instanceId}:
 *   get:
 *     summary: Get details for a specific surface
 *     tags: [surfaces]
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Surface instance ID
 *     responses:
 *       200:
 *         description: Surface details
 *       404:
 *         description: Surface not found
 */
router.get('/:instanceId', (req, res) => {
  try {
    const { instanceId } = req.params;
    const surface = surfaceManager.get(instanceId);

    if (!surface) {
      res.status(404).json({ error: 'Surface not found' });
      return;
    }

    res.json({ surface });
  } catch (error) {
    console.error('[Surfaces API] Error getting surface:', error);
    res.status(500).json({ error: 'Failed to get surface' });
  }
});

/**
 * @swagger
 * /api/surfaces/{instanceId}/subscribe:
 *   post:
 *     summary: Subscribe a surface to a session
 *     tags: [surfaces]
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *       404:
 *         description: Surface not found
 */
router.post('/:instanceId/subscribe', (req, res) => {
  try {
    const { instanceId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const surface = surfaceManager.get(instanceId);
    if (!surface) {
      res.status(404).json({ error: 'Surface not found' });
      return;
    }

    surfaceManager.subscribeToSession(instanceId, sessionId);
    res.json({ success: true, message: 'Subscribed to session' });
  } catch (error) {
    console.error('[Surfaces API] Error subscribing to session:', error);
    res.status(500).json({ error: 'Failed to subscribe to session' });
  }
});

/**
 * @swagger
 * /api/surfaces/{instanceId}/unsubscribe:
 *   post:
 *     summary: Unsubscribe a surface from a session
 *     tags: [surfaces]
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       404:
 *         description: Surface not found
 */
router.post('/:instanceId/unsubscribe', (req, res) => {
  try {
    const { instanceId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const surface = surfaceManager.get(instanceId);
    if (!surface) {
      res.status(404).json({ error: 'Surface not found' });
      return;
    }

    surfaceManager.unsubscribeFromSession(instanceId, sessionId);
    res.json({ success: true, message: 'Unsubscribed from session' });
  } catch (error) {
    console.error('[Surfaces API] Error unsubscribing from session:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from session' });
  }
});

/**
 * @swagger
 * /api/surfaces/{instanceId}/input:
 *   post:
 *     summary: Send input from a surface (non-WebSocket path)
 *     tags: [surfaces]
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - content
 *             properties:
 *               sessionId:
 *                 type: string
 *               content:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Input queued successfully
 *       404:
 *         description: Surface not found
 */
router.post('/:instanceId/input', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { sessionId, content, metadata } = req.body;

    if (!sessionId || !content) {
      res.status(400).json({ error: 'sessionId and content are required' });
      return;
    }

    const surface = surfaceManager.get(instanceId);
    if (!surface) {
      res.status(404).json({ error: 'Surface not found' });
      return;
    }

    const input: SurfaceInput = {
      surfaceId: surface.surfaceId,
      instanceId,
      sessionId,
      content,
      metadata,
    };

    await surfaceManager.handleInput(input);
    res.json({ success: true, message: 'Input queued for processing' });
  } catch (error) {
    console.error('[Surfaces API] Error handling input:', error);
    res.status(500).json({ error: 'Failed to handle input' });
  }
});

export default router;
