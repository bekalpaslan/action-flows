/**
 * Harmony Detection API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SessionId, ProjectId } from '@afw/shared';
import { harmonyDetector } from '../services/harmonyDetector.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Query schema for harmony endpoints
 */
const harmonyQuerySchema = z.object({
  since: z.string().datetime().optional(),
  result: z.enum(['valid', 'degraded', 'violation']).optional(),
  formatType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

/**
 * Schema for manual harmony check
 */
const harmonyCheckSchema = z.object({
  text: z.string().min(1).max(10000),
  context: z.object({
    stepNumber: z.number().optional(),
    chainId: z.string().optional(),
    actionType: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/harmony/project/:projectId
 * Get harmony metrics for all sessions in a project
 * IMPORTANT: This route must come before /:sessionId to avoid matching "project" as sessionId
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId as ProjectId;
    const query = harmonyQuerySchema.parse(req.query);

    // Get project-level metrics
    const metrics = await harmonyDetector.getHarmonyMetrics(projectId, 'project');

    // Get recent checks with filters
    const recentChecks = await harmonyDetector.getHarmonyChecks(projectId, {
      result: query.result,
      formatType: query.formatType,
      since: query.since as any,
      limit: query.limit,
    });

    res.json({
      projectId,
      metrics,
      recentChecks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching project harmony metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch project harmony metrics',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/harmony/stats
 * Get global harmony statistics across all projects
 */
router.get('/stats', async (req, res) => {
  try {
    // This would require aggregating across all sessions/projects
    // For now, return placeholder
    res.json({
      message: 'Global stats endpoint - to be implemented',
      totalChecks: 0,
      globalHarmonyPercentage: 100,
    });
  } catch (error) {
    console.error('[API] Error fetching global harmony stats:', error);
    res.status(500).json({
      error: 'Failed to fetch global harmony stats',
      message: sanitizeError(error),
    });
  }
});

/**
 * @swagger
 * /api/harmony/{sessionId}:
 *   get:
 *     summary: Get harmony metrics for a session
 *     description: Retrieve contract compliance metrics and validation results
 *     tags: [harmony]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: result
 *         schema:
 *           type: string
 *           enum: [valid, degraded, violation]
 *         description: Filter by validation result
 *       - in: query
 *         name: formatType
 *         schema:
 *           type: string
 *         description: Filter by format type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Limit number of recent checks
 *     responses:
 *       200:
 *         description: Harmony metrics and recent checks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 metrics:
 *                   $ref: '#/components/schemas/HarmonyMetrics'
 *                 recentChecks:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId as SessionId;
    const query = harmonyQuerySchema.parse(req.query);

    // Get metrics
    const metrics = await harmonyDetector.getHarmonyMetrics(sessionId, 'session');

    // Get recent checks with filters
    const recentChecks = await harmonyDetector.getHarmonyChecks(sessionId, {
      result: query.result,
      formatType: query.formatType,
      since: query.since as any,
      limit: query.limit,
    });

    res.json({
      sessionId,
      metrics,
      recentChecks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching harmony metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch harmony metrics',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/harmony/:sessionId/check
 * Manually trigger harmony check on text (for testing/debugging)
 */
router.post('/:sessionId/check', writeLimiter, async (req, res) => {
  try {
    const sessionId = req.params.sessionId as SessionId;

    // Validate request body
    const parsed = harmonyCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.errors,
      });
    }

    const { text, context } = parsed.data;

    // Run harmony check
    const result = await harmonyDetector.checkOutput(text, sessionId, context);

    res.json({
      check: result.check,
      parsed: result.check.parsedFormat,
      result: result.check.result,
    });
  } catch (error) {
    console.error('[API] Error running harmony check:', error);
    res.status(500).json({
      error: 'Failed to run harmony check',
      message: sanitizeError(error),
    });
  }
});

export default router;
