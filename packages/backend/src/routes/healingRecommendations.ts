/**
 * Healing Recommendations API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SessionId, ProjectId } from '@afw/shared';
import { getHealingRecommendationEngine } from '../services/healingRecommendations.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Query schema for recommendations endpoint
 */
const recommendationsQuerySchema = z.object({
  sessionId: z.string().optional(),
  projectId: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'accepted', 'ignored']).optional(),
});

/**
 * Schema for triggering analysis
 */
const analyzeSchema = z.object({
  target: z.string(),
  targetType: z.enum(['session', 'project']).default('session'),
});

/**
 * Schema for updating recommendation status
 */
const updateStatusSchema = z.object({
  status: z.enum(['accepted', 'ignored']),
});

/**
 * GET /api/harmony/recommendations
 * Get healing recommendations with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const query = recommendationsQuerySchema.parse(req.query);

    const engine = getHealingRecommendationEngine();
    const recommendations = await engine.getRecommendations({
      sessionId: query.sessionId as SessionId | undefined,
      projectId: query.projectId as ProjectId | undefined,
      severity: query.severity,
      status: query.status,
    });

    res.json({
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching healing recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch healing recommendations',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/harmony/recommendations/analyze
 * Trigger analysis and recommendation generation
 */
router.post('/analyze', writeLimiter, async (req, res) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.errors,
      });
    }

    const { target, targetType } = parsed.data;

    const engine = getHealingRecommendationEngine();
    const recommendations = await engine.analyzeAndRecommend(
      target as SessionId | ProjectId,
      targetType
    );

    res.json({
      analyzed: target,
      targetType,
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    console.error('[API] Error analyzing for recommendations:', error);
    res.status(500).json({
      error: 'Failed to analyze and generate recommendations',
      message: sanitizeError(error),
    });
  }
});

/**
 * PATCH /api/harmony/recommendations/:id
 * Update recommendation status
 */
router.patch('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.errors,
      });
    }

    const { status } = parsed.data;

    const engine = getHealingRecommendationEngine();
    const recommendation = await engine.updateRecommendationStatus(id, status);

    if (!recommendation) {
      return res.status(404).json({
        error: 'Recommendation not found',
      });
    }

    res.json({
      recommendation,
    });
  } catch (error) {
    console.error('[API] Error updating recommendation status:', error);
    res.status(500).json({
      error: 'Failed to update recommendation status',
      message: sanitizeError(error),
    });
  }
});

export default router;
